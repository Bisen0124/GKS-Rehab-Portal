import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Table,
  Button,
  Badge,
  Input,
  InputGroup,
  Label,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Spinner,
} from "reactstrap";
import {
  CreditCard,
  Plus,
  Trash2,
  Search,
  Layers,
  Printer,
  CheckCircle,
  Clock,
  DollarSign,
  GitBranch,
  RefreshCw,
  Check,
  ArrowUpRight,
  ArrowDownLeft,
  Phone,
} from "react-feather";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useLang } from "../../contexts/LangContext";
import { useBranch } from "../../contexts/BranchContext";
import { getTranslation } from "../../utils/translator";
import HeaderCard from "../Common/Component/HeaderCard";
import {
  fetchActiveItemTypes,
  fetchActiveItems,
  fetchItemsByType,
  getItemTypes,
  getItemsMaster,
} from "../../Services/billingMasterService";
import {
  DEFAULT_REGISTERED_PATIENTS,
  fetchActiveBills,
  createBillApi,
  updateBillApi,
  createTransactionApi,
  fetchTransactionsByBill,
  fetchActiveTransactions,
  deleteTransactionApi,
  calculateBillFinancials,
  getAllBills,
  getStoredTransactions,
} from "../../Services/patientBillingService";

// Distinct badge palette for billed service types
const getItemTypeBadgeColor = (typeName = "") => {
  const name = String(typeName).toLowerCase();
  if (name.includes("ward") || name.includes("room") || name.includes("bed")) {
    return { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" }; // blue
  }
  if (name.includes("blood") || name.includes("lab") || name.includes("test")) {
    return { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" }; // red
  }
  if (name.includes("consult") || name.includes("opd") || name.includes("doctor")) {
    return { bg: "#f5f3ff", text: "#6d28d9", border: "#ddd6fe" }; // purple
  }
  if (name.includes("physio") || name.includes("rehab") || name.includes("therapy")) {
    return { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0" }; // emerald
  }
  if (name.includes("med") || name.includes("pharmacy")) {
    return { bg: "#fffbeb", text: "#b45309", border: "#fde68a" }; // amber
  }
  return { bg: "#f1f5f9", text: "#334155", border: "#cbd5e1" }; // slate
};

const PatientBilling = ({ isTabMode = false }) => {
  const { lang } = useLang();
  const { selectedBranch } = useBranch();
  const printRef = useRef(null);

  // Role detection
  const storedRoleType = localStorage.getItem("isRoleType") || "SuperAdmin";
  const isSuperAdmin = storedRoleType === "SuperAdmin";
  const branchDetail = JSON.parse(localStorage.getItem("Branch_Detail") || "[]");
  const currentBranchName = branchDetail[0]?.Branch_name || "Bhopal Main Branch";

  // Data States
  const [patients, setPatients] = useState([]);
  const [bills, setBills] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);
  const [itemsMaster, setItemsMaster] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState(isSuperAdmin ? "all" : selectedBranch || 1);

  // Modal 1: Manage Bill (Create / Edit / Re-open)
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [currentBillId, setCurrentBillId] = useState(null);
  const [currentBillNo, setCurrentBillNo] = useState(1);
  const [currentBillNumber, setCurrentBillNumber] = useState("");
  const [billDate, setBillDate] = useState(new Date().toISOString().split("T")[0]);
  const [billItems, setBillItems] = useState([]);
  const [billNotes, setBillNotes] = useState("");
  const [billTransactions, setBillTransactions] = useState([]);
  const [isSavingBill, setIsSavingBill] = useState(false);

  // Line Item Entry State (Inside Modal)
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [typeItems, setTypeItems] = useState([]);
  const [selectedMasterItemId, setSelectedMasterItemId] = useState("");
  const [itemUnitRate, setItemUnitRate] = useState(0);
  const [itemDiscount, setItemDiscount] = useState(0);
  const [itemQuantity, setItemQuantity] = useState(1);

  // Transaction Entry State (Payment Cr / Refund De)
  const [txAmount, setTxAmount] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);
  const [txMethod, setTxMethod] = useState("UPI");
  const [txType, setTxType] = useState("Cr"); // Cr = Payment, De = Refund
  const [txUtrNo, setTxUtrNo] = useState("");
  const [isRecordingTx, setIsRecordingTx] = useState(false);

  // Modal 2: Printable Invoice Receipt
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [activeReceiptBill, setActiveReceiptBill] = useState(null);
  const [activeReceiptPatient, setActiveReceiptPatient] = useState(null);

  // Target branch ID helper
  const targetBranch = branchFilter !== "all" ? branchFilter : selectedBranch || 1;

  // --------------------------------------------------------------------------
  // Data Loading
  // --------------------------------------------------------------------------
  const loadMasterData = useCallback(async () => {
    try {
      const types = await fetchActiveItemTypes(targetBranch);
      setItemTypes(types && types.length > 0 ? types : getItemTypes(targetBranch));

      const items = await fetchActiveItems(targetBranch);
      setItemsMaster(items && items.length > 0 ? items : getItemsMaster(targetBranch));
    } catch {
      setItemTypes(getItemTypes(targetBranch));
      setItemsMaster(getItemsMaster(targetBranch));
    }
  }, [targetBranch]);

  const loadBillsData = useCallback(async () => {
    try {
      const [activeBills, activeTxs] = await Promise.all([
        fetchActiveBills(targetBranch),
        fetchActiveTransactions(targetBranch),
      ]);

      const billsList = activeBills && activeBills.length > 0 ? activeBills : getAllBills(targetBranch);
      const txsList = activeTxs && activeTxs.length > 0 ? activeTxs : getStoredTransactions(targetBranch);

      // Merge transactions into their respective bills to guarantee exact financial parity
      const mergedBills = billsList.map((b) => {
        const bUser = Number(b.user_id || b.patient_id);
        const bNo = Number(b.bill_no || 1);
        const billTxs = txsList.filter(
          (t) => Number(t.user_id) === bUser && Number(t.bill_no) === bNo
        );

        let totalPaid = 0;
        billTxs.forEach((t) => {
          if (t.tr_status === "completed" || !t.tr_status) {
            if (t.type === "Cr") totalPaid += Number(t.amount) || 0;
            else if (t.type === "De") totalPaid -= Number(t.amount) || 0;
          }
        });
        totalPaid = Math.max(0, totalPaid);
        const netAmt = Number(b.net_amount) || 0;
        const remaining = Math.max(0, netAmt - totalPaid);
        let status = "pending";
        if (remaining === 0 && netAmt > 0 && totalPaid >= netAmt) {
          status = "full_paid";
        } else if (totalPaid > 0 && remaining > 0) {
          status = "partial_paid";
        }

        return {
          ...b,
          transactions: billTxs,
          payments: billTxs,
          paid_amount: totalPaid,
          remaining_amount: remaining,
          balance_amount: remaining,
          bill_status: status,
          status,
        };
      });

      setBills(mergedBills);
    } catch {
      setBills(getAllBills(targetBranch));
    }
  }, [targetBranch]);

  const loadPatientsData = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem("Authorization");

    try {
      if (token) {
        const response = await fetch(
          `https://gks-yjdc.onrender.com/api/users?branch_id=${targetBranch}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `${token}`,
            },
          }
        );

        if (response.ok) {
          const resData = await response.json();
          if (Array.isArray(resData.data) && resData.data.length > 0) {
            const apiMapped = resData.data.map((u) => ({
              id: u.user_id || u.id,
              user_id: u.user_id || u.id,
              gks_id: u.gks_id || `GKS-${u.user_id || u.id}`,
              name: u.name || "Patient",
              phone: u.phone || "",
              email: u.email || "",
              branch_id: u.branch_id || targetBranch,
              branch_name: u.branch_name || currentBranchName,
              admit_date: u.recent_admit_date
                ? new Date(u.recent_admit_date).toISOString().split("T")[0]
                : "2026-08-15",
              ward: u.ward_name || "General Ward",
            }));

            // Merge with local demo patients to guarantee full rich testing
            const merged = [...apiMapped];
            DEFAULT_REGISTERED_PATIENTS.forEach((dp) => {
              if (!merged.some((m) => String(m.id) === String(dp.id))) {
                merged.push(dp);
              }
            });
            setPatients(merged);
            setIsLoading(false);
            return;
          }
        }
      }
      setPatients(DEFAULT_REGISTERED_PATIENTS);
    } catch (err) {
      console.warn("Using default patients fallback:", err);
      setPatients(DEFAULT_REGISTERED_PATIENTS);
    } finally {
      setIsLoading(false);
    }
  }, [targetBranch, currentBranchName]);

  useEffect(() => {
    loadMasterData();
    loadBillsData();
    loadPatientsData();
  }, [loadMasterData, loadBillsData, loadPatientsData]);

  // Handle Item Type selection in modal: fetches items for that type
  const handleItemTypeSelect = async (typeId) => {
    setSelectedTypeId(typeId);
    setSelectedMasterItemId("");
    setItemUnitRate(0);
    setItemDiscount(0);

    if (!typeId) {
      setTypeItems([]);
      return;
    }

    try {
      const items = await fetchItemsByType(typeId, targetBranch);
      if (items && items.length > 0) {
        setTypeItems(items);
        const first = items[0];
        setSelectedMasterItemId(String(first.id || first.item_id));
        setItemUnitRate(first.original_amount !== undefined ? first.original_amount : first.amount || 0);
      } else {
        // Fallback filter from itemsMaster
        const localMatched = itemsMaster.filter((m) => String(m.item_type_id) === String(typeId));
        setTypeItems(localMatched);
        if (localMatched.length > 0) {
          const first = localMatched[0];
          setSelectedMasterItemId(String(first.id || first.item_id));
          setItemUnitRate(first.original_amount !== undefined ? first.original_amount : first.amount || 0);
        }
      }
    } catch {
      const localMatched = itemsMaster.filter((m) => String(m.item_type_id) === String(typeId));
      setTypeItems(localMatched);
    }
  };

  // Handle Master Item selection in modal
  const handleMasterItemSelect = (itemId) => {
    setSelectedMasterItemId(itemId);
    const found = typeItems.find((m) => String(m.id || m.item_id) === String(itemId)) ||
      itemsMaster.find((m) => String(m.id || m.item_id) === String(itemId));
    if (found) {
      setItemUnitRate(found.original_amount !== undefined ? found.original_amount : found.amount || 0);
    }
  };

  // Add line item to modal bill (Hierarchy: Item Type -> Item -> Original Amount -> Discount)
  const handleAddLineItem = () => {
    if (!selectedTypeId) {
      toast.warning(getTranslation("Please select an Item Type / कृपया आइटम प्रकार चुनें", lang));
      return;
    }
    if (!selectedMasterItemId) {
      toast.warning(getTranslation("Please select a Service Item / कृपया सेवा आइटम चुनें", lang));
      return;
    }
    const origRate = Number(itemUnitRate);
    if (origRate <= 0) {
      toast.warning(getTranslation("Rate must be greater than 0 / दर शून्य से अधिक होनी चाहिए", lang));
      return;
    }
    const disc = Number(itemDiscount) || 0;
    if (disc < 0) {
      toast.warning(getTranslation("Discount cannot be negative / छूट ऋणात्मक नहीं हो सकती", lang));
      return;
    }
    if (disc > origRate) {
      toast.error(
        getTranslation(
          `Item discount (₹${disc}) cannot exceed original rate (₹${origRate})!`,
          lang
        )
      );
      return;
    }

    const qty = Math.max(1, Number(itemQuantity) || 1);
    const typeObj = itemTypes.find((t) => String(t.id) === String(selectedTypeId));
    const masterObj = typeItems.find((m) => String(m.id || m.item_id) === String(selectedMasterItemId)) ||
      itemsMaster.find((m) => String(m.id || m.item_id) === String(selectedMasterItemId));

    const remainingLineRate = origRate - disc;

    const newLine = {
      id: `item_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      item_id: Number(selectedMasterItemId),
      item_master_id: Number(selectedMasterItemId),
      item_type_id: Number(selectedTypeId),
      item_type_name: typeObj ? typeObj.item_type_name || typeObj.name : "General",
      item_name: masterObj ? masterObj.item_name : "Service Item",
      original_amount: origRate,
      unit_rate: origRate,
      discount_amount: disc,
      remaining_amount: remainingLineRate,
      quantity: qty,
      total_rate: remainingLineRate * qty,
      description: masterObj?.description || "",
    };

    setBillItems((prev) => [...prev, newLine]);
    setItemDiscount(0);
    setItemQuantity(1);
    toast.success(
      `${newLine.item_name} ${getTranslation("added to bill / बिल में जोड़ा गया", lang)}`
    );
  };

  // Remove line item with confirmation dialog
  const handleRemoveLineItem = async (itemId) => {
    const itemToRemove = billItems.find((i) => i.id === itemId);
    const itemName = itemToRemove ? itemToRemove.item_name : "this item";

    const confirm = await Swal.fire({
      title: getTranslation("Remove Item? / आइटम हटाएं?", lang),
      text: `${getTranslation("Are you sure you want to remove", lang)} "${itemName}" ${getTranslation("from this bill?", lang)}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#24695c",
      confirmButtonText: getTranslation("Yes, remove / हाँ, हटाएं", lang),
      cancelButtonText: getTranslation("Cancel / रद्द करें", lang),
    });

    if (confirm.isConfirmed) {
      setBillItems((prev) => prev.filter((i) => i.id !== itemId));
      toast.info(`${itemName} ${getTranslation("removed from bill / बिल से हटाया गया", lang)}`);
    }
  };

  // Real-time calculation of modal financials matching backend
  const modalFinancials = useMemo(() => {
    return calculateBillFinancials(billItems, billTransactions);
  }, [billItems, billTransactions]);

  // Open "Manage Bill" Modal for a patient - Instant zero-latency opening
  const handleOpenBillModal = (patient) => {
    setSelectedPatient(patient);
    const existingBill = bills.find(
      (b) => Number(b.user_id) === Number(patient.id) || Number(b.patient_id) === Number(patient.id)
    );

    if (existingBill) {
      setCurrentBillId(existingBill.id || existingBill.bill_id);
      setCurrentBillNo(existingBill.bill_no || 1);
      setCurrentBillNumber(existingBill.bill_number || `GKS/BILL/26/${String(existingBill.bill_no || 1).padStart(3, "0")}`);
      setBillDate(existingBill.bill_date || new Date().toISOString().split("T")[0]);
      setBillItems(existingBill.items || existingBill.bill_detail || []);
      setBillNotes(existingBill.notes || "");
      // Immediately populate with existing transactions from bills state (zero delay)
      setBillTransactions(existingBill.transactions || existingBill.payments || []);
    } else {
      setCurrentBillId(null);
      setCurrentBillNo(1);
      setCurrentBillNumber("");
      setBillDate(new Date().toISOString().split("T")[0]);
      setBillItems([]);
      setBillNotes("");
      setBillTransactions([]);
    }

    // Reset line item input
    setItemDiscount(0);
    setItemQuantity(1);
    setTxAmount("");
    setTxUtrNo("");
    setTxType("Cr");
    setTxMethod("UPI");
    setTxDate(new Date().toISOString().split("T")[0]);

    // Pre-select first item type synchronously from cached itemsMaster
    if (itemTypes.length > 0) {
      const firstType = itemTypes[0];
      setSelectedTypeId(firstType.id);
      const matched = itemsMaster.filter(
        (m) => Number(m.item_type_id) === Number(firstType.id)
      );
      if (matched.length > 0) {
        setTypeItems(matched);
        setSelectedMasterItemId(String(matched[0].id || matched[0].item_id));
        setItemUnitRate(matched[0].original_amount !== undefined ? matched[0].original_amount : matched[0].amount || 0);
      } else {
        setTypeItems([]);
        setSelectedMasterItemId("");
        setItemUnitRate(0);
      }
    }

    // OPEN MODAL INSTANTLY WITHOUT WAITING FOR NETWORK!
    setBillModalOpen(true);

    // Asynchronously refresh transactions in the background if needed
    if (existingBill) {
      fetchTransactionsByBill(patient.id, existingBill.bill_no || 1, targetBranch)
        .then((freshTxs) => {
          if (freshTxs && freshTxs.length > 0) {
            setBillTransactions(freshTxs);
          }
        })
        .catch(() => {});
    }
  };

  // Record a payment / refund transaction (Calls /api/transactions)
  const handleRecordTransaction = async () => {
    if (!selectedPatient) return;
    const amount = Number(txAmount);
    if (!amount || amount <= 0) {
      toast.warning(getTranslation("Please enter a valid transaction amount / कृपया मान्य राशि दर्ज करें", lang));
      return;
    }

    // Validations: Cr cannot exceed remaining balance
    if (txType === "Cr" && amount > modalFinancials.remaining_amount) {
      Swal.fire({
        icon: "error",
        title: getTranslation("Excess Payment", lang),
        text: getTranslation(
          `Payment amount (₹${amount}) cannot exceed remaining balance (₹${modalFinancials.remaining_amount})!`,
          lang
        ),
      });
      return;
    }

    // Refund cannot exceed already paid amount
    if (txType === "De" && amount > modalFinancials.paid_amount) {
      Swal.fire({
        icon: "error",
        title: getTranslation("Excess Refund", lang),
        text: getTranslation(
          `Refund amount (₹${amount}) cannot exceed total amount paid (₹${modalFinancials.paid_amount})!`,
          lang
        ),
      });
      return;
    }

    // UTR validation: mandatory for UPI and Bank Transfer
    if ((txMethod === "UPI" || txMethod === "Bank Transfer") && !txUtrNo.trim()) {
      Swal.fire({
        icon: "warning",
        title: getTranslation("UTR / Reference Number Required", lang),
        text: getTranslation(
          `UTR / Transaction Reference number is mandatory for ${txMethod} payments!`,
          lang
        ),
      });
      return;
    }

    setIsRecordingTx(true);
    try {
      const payload = {
        user_id: selectedPatient.id,
        bill_no: currentBillNo || 1,
        tr_date: txDate,
        amount: amount,
        method: txMethod,
        type: txType,
        utr_no: txUtrNo.trim(),
        tr_status: "completed",
      };

      const result = await createTransactionApi(payload, targetBranch);
      if (result && result.success) {
        toast.success(
          txType === "Cr"
            ? getTranslation("Payment received & recorded successfully! / भुगतान दर्ज किया गया!", lang)
            : getTranslation("Refund recorded successfully! / धनवापसी दर्ज की गई!", lang)
        );

        // Append to local transaction log
        const newRecord = result.data || {
          id: Date.now(),
          tr_no: Date.now().toString().slice(-4),
          ...payload,
        };
        setBillTransactions((prev) => [newRecord, ...prev]);
        setTxAmount("");
        setTxUtrNo("");

        // Refresh bills list
        loadBillsData();
      }
    } catch (err) {
      toast.error(err.message || "Failed to record transaction");
    } finally {
      setIsRecordingTx(false);
    }
  };

  // Delete transaction (Calls DELETE /api/transactions/:id)
  const handleDeleteTransaction = async (txId) => {
    const confirm = await Swal.fire({
      title: getTranslation("Delete Transaction? / लेन-देन हटाएं?", lang),
      text: getTranslation("Are you sure you want to delete this transaction record?", lang),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#24695c",
      confirmButtonText: getTranslation("Yes, delete / हाँ, हटाएं", lang),
      cancelButtonText: getTranslation("Cancel / रद्द करें", lang),
    });

    if (confirm.isConfirmed) {
      try {
        await deleteTransactionApi(txId, targetBranch);
        setBillTransactions((prev) => prev.filter((t) => Number(t.id) !== Number(txId)));
        toast.info(getTranslation("Transaction deleted / लेन-देन हटा दिया गया", lang));
        loadBillsData();
      } catch (err) {
        toast.error("Failed to delete transaction: " + err.message);
      }
    }
  };

  // Save Bill (Calls POST /api/bills or PUT /api/bills/:id)
  const handleSaveBill = async (e) => {
    if (e) e.preventDefault();
    if (!selectedPatient) return;

    if (billItems.length === 0) {
      toast.warning(
        getTranslation(
          "Please add at least one billable item to the bill / कृपया बिल में कम से कम एक आइटम जोड़ें",
          lang
        )
      );
      return;
    }

    setIsSavingBill(true);
    try {
      const billDetailPayload = billItems.map((it) => ({
        item_id: Number(it.item_id || it.item_master_id || it.id),
        discount_amount: Number(it.discount_amount) || 0,
      }));

      let savedBill = null;
      if (currentBillId) {
        // Update existing bill (PUT /api/bills/:id)
        savedBill = await updateBillApi(
          currentBillId,
          {
            bill_date: billDate,
            bill_detail: billDetailPayload,
            notes: billNotes,
          },
          targetBranch
        );
      } else {
        // Create new bill (POST /api/bills)
        savedBill = await createBillApi(
          {
            user_id: selectedPatient.id,
            bill_date: billDate,
            bill_detail: billDetailPayload,
            notes: billNotes,
          },
          targetBranch
        );
      }

      await loadBillsData();
      setBillModalOpen(false);

      const isCleared = modalFinancials.remaining_amount === 0;
      const statusBadge = isCleared
        ? `<span style="display:inline-block;padding:3px 10px;border-radius:12px;background:#ecfdf5;color:#047857;font-weight:700;font-size:12px;border:1px solid #a7f3d0;">✓ Cleared / Full Paid</span>`
        : modalFinancials.paid_amount > 0
        ? `<span style="display:inline-block;padding:3px 10px;border-radius:12px;background:#eff6ff;color:#1d4ed8;font-weight:700;font-size:12px;border:1px solid #bfdbfe;">⏳ Partial Paid</span>`
        : `<span style="display:inline-block;padding:3px 10px;border-radius:12px;background:#fef2f2;color:#b91c1c;font-weight:700;font-size:12px;border:1px solid #fecaca;">⚠️ Payment Pending</span>`;

      Swal.fire({
        icon: "success",
        title: `<div style="font-size: 19px; font-weight: 700; color: #0f172a; margin-top: 4px;">${getTranslation("Bill Saved Successfully! / बिल सहेज लिया गया!", lang)}</div>`,
        html: `
          <div style="text-align: left; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 18px; margin-top: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            
            <!-- Patient & Bill Header -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 12px; border-bottom: 1px dashed #cbd5e1; margin-bottom: 12px;">
              <div>
                <div style="font-size: 15px; font-weight: 700; color: #0f172a;">${selectedPatient.name}</div>
                <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px;">
                  <span style="display: inline-block; font-size: 11px; padding: 2px 8px; border-radius: 6px; background: #e2e8f0; color: #334155; font-weight: 600;">${selectedPatient.gks_id}</span>
                </div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 12px; font-weight: 700; color: #24695c; background: #e6f4f1; padding: 3px 8px; border-radius: 6px; display: inline-block;">${savedBill.bill_number || `Bill #${savedBill.bill_no || 1}`}</div>
                <div style="font-size: 11.5px; color: #64748b; margin-top: 4px;">${billDate}</div>
              </div>
            </div>

            <!-- Financial Breakdown Table -->
            <div style="display: flex; flex-direction: column; gap: 7px; font-size: 13px;">
              <div style="display: flex; justify-content: space-between; color: #475569;">
                <span>${getTranslation("Gross Total", lang)}:</span>
                <span style="font-weight: 600; color: #0f172a;">₹ ${modalFinancials.gross_amount.toLocaleString("en-IN")}</span>
              </div>
              ${modalFinancials.discount_amount > 0 ? `
              <div style="display: flex; justify-content: space-between; color: #b45309;">
                <span>${getTranslation("Concession / Discount", lang)}:</span>
                <span style="font-weight: 700;">- ₹ ${modalFinancials.discount_amount.toLocaleString("en-IN")}</span>
              </div>` : ''}
              <div style="display: flex; justify-content: space-between; font-size: 13.5px; font-weight: 700; color: #0f172a; padding: 6px 0; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
                <span>${getTranslation("Net Payable", lang)}:</span>
                <span style="color: #24695c;">₹ ${modalFinancials.net_amount.toLocaleString("en-IN")}</span>
              </div>
              <div style="display: flex; justify-content: space-between; color: #047857; font-weight: 600;">
                <span>${getTranslation("Total Paid", lang)}:</span>
                <span>₹ ${modalFinancials.paid_amount.toLocaleString("en-IN")}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 14px; padding-top: 4px;">
                <span style="color: #334155;">${getTranslation("Remaining Balance", lang)}:</span>
                <span style="color: ${modalFinancials.remaining_amount > 0 ? '#dc2626' : '#16a34a'};">₹ ${modalFinancials.remaining_amount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <!-- Status Footer -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 10px; border-top: 1px dashed #cbd5e1;">
              <span style="font-size: 12px; color: #64748b;">${getTranslation("Payment Status", lang)}:</span>
              ${statusBadge}
            </div>

            <!-- Server Sync Notice -->
            <div style="margin-top: 10px; font-size: 11px; color: #64748b; text-align: center; border-radius: 6px; background: #ffffff; padding: 4px 8px; border: 1px solid #e2e8f0;">
              ✓ Stored in backend database (<code>/api/bills</code> &amp; <code>bill_detail</code>)
            </div>
          </div>
        `,
        confirmButtonColor: "#24695c",
        confirmButtonText: getTranslation("Done / संपन्न", lang),
      });
    } catch (err) {
      toast.error("Failed to save bill: " + err.message);
    } finally {
      setIsSavingBill(false);
    }
  };

  // Open Printable Receipt Modal
  const handleOpenReceipt = (patient, bill) => {
    setActiveReceiptPatient(patient);
    setActiveReceiptBill(bill);
    setReceiptModalOpen(true);
  };

  // Handle Print Action with dedicated clean printable document
  const handlePrintReceipt = () => {
    if (!printRef.current) {
      window.print();
      return;
    }

    const printWindow = window.open("", "_blank", "width=850,height=950");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice - ${activeReceiptBill?.bill_number || "Receipt"}</title>
            <style>
              @page { size: A4; margin: 15mm; }
              * { box-sizing: border-box; }
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
                color: #0f172a;
                background: #ffffff;
                margin: 0;
                padding: 16px;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .print-container { width: 100%; max-width: 800px; margin: 0 auto; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
              th, td { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 13px; text-align: left; }
              th { background-color: #f1f5f9 !important; font-weight: 700; color: #1e293b; }
              .text-end { text-align: right; }
              .text-center { text-align: center; }
              .fw-bold { font-weight: 700; }
              .fw-semibold { font-weight: 600; }
              .badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; }
              .info-box { background-color: #f8fafc !important; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 14px; font-size: 13px; color: #1e293b; line-height: 1.6; }
            </style>
          </head>
          <body>
            <div class="print-container">
              ${printRef.current.innerHTML}
            </div>
            <script>
              window.onload = function() {
                window.focus();
                window.print();
                setTimeout(function() { window.close(); }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      window.print();
    }
  };

  // Patients merged with their bill data
  const patientsWithBills = useMemo(() => {
    return patients.map((pt) => {
      const bill = bills.find(
        (b) => Number(b.user_id) === Number(pt.id) || Number(b.patient_id) === Number(pt.id)
      );
      const gross = bill ? Number(bill.gross_amount) || 0 : 0;
      const discount = bill ? Number(bill.discount_amount) || 0 : 0;
      const net = bill ? Number(bill.net_amount) || 0 : 0;
      const paid = bill ? Number(bill.paid_amount) || 0 : 0;
      const remaining = bill
        ? paid === 0 && net > 0
          ? net
          : bill.remaining_amount !== undefined && bill.remaining_amount !== null
          ? Number(bill.remaining_amount)
          : Math.max(0, net - paid)
        : 0;

      let billStatus = "none";
      if (bill) {
        if (remaining === 0 && net > 0 && paid >= net) {
          billStatus = "full_paid";
        } else if (paid > 0 && remaining > 0) {
          billStatus = "partial_paid";
        } else {
          billStatus = "pending";
        }
      }

      return {
        ...pt,
        bill: bill || null,
        billStatus,
        gross,
        discount,
        net,
        paid,
        remaining,
      };
    });
  }, [patients, bills]);

  // Filtered Patients List
  const filteredPatientsWithBills = useMemo(() => {
    return patientsWithBills.filter((pt) => {
      if (branchFilter !== "all" && String(pt.branch_id) !== String(branchFilter)) {
        return false;
      }

      if (statusFilter !== "all") {
        if (statusFilter === "full_paid" && pt.billStatus !== "full_paid" && pt.billStatus !== "paid") return false;
        if (statusFilter === "partial_paid" && pt.billStatus !== "partial_paid" && pt.billStatus !== "partial") return false;
        if (statusFilter === "pending" && pt.billStatus !== "pending" && pt.billStatus !== "unpaid") return false;
        if (statusFilter === "none" && pt.billStatus !== "none") return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const mName = pt.name.toLowerCase().includes(q);
        const mId = (pt.gks_id || "").toLowerCase().includes(q);
        const mPhone = (pt.phone || "").toLowerCase().includes(q);
        const mWard = (pt.ward || "").toLowerCase().includes(q);
        const mBillNo = (pt.bill?.bill_number || `bill #${pt.bill?.bill_no || ""}`).toLowerCase().includes(q);
        return mName || mId || mPhone || mWard || mBillNo;
      }

      return true;
    });
  }, [patientsWithBills, branchFilter, statusFilter, searchTerm]);

  // Overall Financial Statistics
  const stats = useMemo(() => {
    let totalInvoiced = 0;
    let totalCollected = 0;
    let totalPending = 0;
    let fullyPaidCount = 0;
    let partialCount = 0;

    bills.forEach((b) => {
      if (branchFilter === "all" || String(b.branch_id) === String(branchFilter)) {
        totalInvoiced += Number(b.net_amount) || 0;
        totalCollected += Number(b.paid_amount) || 0;
        totalPending += Number(b.remaining_amount) || 0;
        if (b.bill_status === "full_paid" || b.status === "paid") fullyPaidCount++;
        if (b.bill_status === "partial_paid" || b.status === "partial") partialCount++;
      }
    });

    return {
      totalInvoiced,
      totalCollected,
      totalPending,
      fullyPaidCount,
      partialCount,
    };
  }, [bills, branchFilter]);

  const mainContent = (
    <>
      {!isTabMode && (
        <HeaderCard
          title={getTranslation(
            "Patient Billing & Invoices / मरीज बिलिंग एवं चालान प्रबंधन",
            lang
          )}
          className="mb-4"
        />
      )}

      {/* Top Financial Stat Cards */}
      <Row className="g-3 mb-4">
        <Col sm={6} lg={3}>
          <Card className="border-0 shadow-sm rounded-3 h-100 bg-white">
            <CardBody className="d-flex align-items-center gap-3" style={{ padding: "20px 22px" }}>
              <div
                className="d-flex align-items-center justify-content-center rounded-3 text-primary flex-shrink-0"
                style={{
                  width: "48px",
                  height: "48px",
                  backgroundColor: "rgba(36, 105, 92, 0.1)",
                }}
              >
                <DollarSign size={22} color="#24695c" />
              </div>
              <div>
                <div
                  className="text-muted small fw-semibold text-uppercase"
                  style={{ fontSize: "11px", letterSpacing: "0.5px" }}
                >
                  {getTranslation("Total Invoiced / कुल बिल राशि", lang)}
                </div>
                <h4 className="fw-bold mb-0 text-dark">
                  ₹ {stats.totalInvoiced.toLocaleString("en-IN")}
                </h4>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col sm={6} lg={3}>
          <Card className="border-0 shadow-sm rounded-3 h-100 bg-white">
            <CardBody className="d-flex align-items-center gap-3" style={{ padding: "20px 22px" }}>
              <div
                className="d-flex align-items-center justify-content-center rounded-3 text-success flex-shrink-0"
                style={{
                  width: "48px",
                  height: "48px",
                  backgroundColor: "rgba(34, 197, 94, 0.1)",
                }}
              >
                <CheckCircle size={22} color="#16a34a" />
              </div>
              <div>
                <div
                  className="text-muted small fw-semibold text-uppercase"
                  style={{ fontSize: "11px", letterSpacing: "0.5px" }}
                >
                  {getTranslation("Total Collected / प्राप्त राशि", lang)}
                </div>
                <h4 className="fw-bold mb-0 text-success">
                  ₹ {stats.totalCollected.toLocaleString("en-IN")}
                </h4>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col sm={6} lg={3}>
          <Card className="border-0 shadow-sm rounded-3 h-100 bg-white">
            <CardBody className="d-flex align-items-center gap-3" style={{ padding: "20px 22px" }}>
              <div
                className="d-flex align-items-center justify-content-center rounded-3 text-danger flex-shrink-0"
                style={{
                  width: "48px",
                  height: "48px",
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                }}
              >
                <Clock size={22} color="#dc2626" />
              </div>
              <div>
                <div
                  className="text-muted small fw-semibold text-uppercase"
                  style={{ fontSize: "11px", letterSpacing: "0.5px" }}
                >
                  {getTranslation("Pending Balance / शेष बकाया", lang)}
                </div>
                <h4 className="fw-bold mb-0 text-danger">
                  ₹ {stats.totalPending.toLocaleString("en-IN")}
                </h4>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col sm={6} lg={3}>
          <Card className="border-0 shadow-sm rounded-3 h-100 bg-white">
            <CardBody className="d-flex align-items-center gap-3" style={{ padding: "20px 22px" }}>
              <div
                className="d-flex align-items-center justify-content-center rounded-3 text-info flex-shrink-0"
                style={{
                  width: "48px",
                  height: "48px",
                  backgroundColor: "rgba(14, 165, 233, 0.1)",
                }}
              >
                <Check size={22} color="#0284c7" />
              </div>
              <div>
                <div
                  className="text-muted small fw-semibold text-uppercase"
                  style={{ fontSize: "11px", letterSpacing: "0.5px" }}
                >
                  {getTranslation("Settled / पूर्ण चुकता", lang)}
                </div>
                <h4 className="fw-bold mb-0 text-dark">
                  {stats.fullyPaidCount}{" "}
                  <span className="small text-muted" style={{ fontSize: "12px" }}>
                    / {bills.length} {getTranslation("Bills", lang)}
                  </span>
                </h4>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Main Billing Table Card */}
      <Card className="border-0 shadow-sm rounded-3 bg-white">
        <CardBody className="p-4">
          {/* Header & Controls */}
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <div>
              <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                <CreditCard size={20} color="#24695c" />
                <span>
                  {getTranslation(
                    "Registered Patients Billing Table / पंजीकृत रोगी बिलिंग सूची",
                    lang
                  )}
                </span>
              </h5>
              <small className="text-muted">
                {getTranslation(
                  "Manage patient invoices, itemized services, discounts, and payments (Cr/De).",
                  lang
                )}
              </small>
            </div>

            <Button
              color="white"
              className="btn btn-outline-secondary py-2 px-3.5 d-flex align-items-center gap-2 shadow-sm fw-medium"
              style={{
                borderRadius: "8px",
                backgroundColor: "#ffffff",
                borderColor: "#cbd5e1",
                color: "#334155",
                fontSize: "13px",
              }}
              onClick={() => {
                loadBillsData();
                loadPatientsData();
                loadMasterData();
                toast.info(getTranslation("Refreshed billing data / डेटा रीफ़्रेश किया गया", lang));
              }}
            >
              <RefreshCw size={14} className="text-primary" />
              <span>{getTranslation("Refresh / रीफ़्रेश", lang)}</span>
            </Button>
          </div>

          {/* Search & Filter Bar */}
          <Row className="g-3 mb-4 align-items-center">
            <Col md={5} sm={12}>
              <InputGroup size="sm" className="shadow-sm rounded-3 overflow-hidden">
                <span className="input-group-text bg-white border-end-0 ps-3">
                  <Search size={15} className="text-muted" />
                </span>
                <Input
                  type="text"
                  placeholder={getTranslation(
                    "Search by patient name, GKS ID, phone, or bill #... / खोजें...",
                    lang
                  )}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-start-0"
                  style={{ height: "40px", fontSize: "13px" }}
                />
              </InputGroup>
            </Col>

            {/* Filter by Bill Status */}
            <Col md={3} sm={6}>
              <select
                className="form-select form-select-sm shadow-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ height: "40px", fontSize: "13px", borderRadius: "8px", borderColor: "#cbd5e1" }}
              >
                <option value="all">
                  {getTranslation("All Payment Statuses / सभी स्थितियां", lang)}
                </option>
                <option value="partial_paid">
                  ⏳ {getTranslation("Partial Paid (आंशिक भुगतान)", lang)}
                </option>
                <option value="full_paid">
                  ✓ {getTranslation("Full Paid (पूर्ण चुकता)", lang)}
                </option>
                <option value="pending">
                  ⚠️ {getTranslation("Pending / Unpaid (लंबित)", lang)}
                </option>
                <option value="none">
                  ○ {getTranslation("No Bill Created (कोई बिल नहीं)", lang)}
                </option>
              </select>
            </Col>

            {/* Filter by Branch (SuperAdmin) */}
            {isSuperAdmin && (
              <Col md={4} sm={6}>
                <select
                  className="form-select form-select-sm shadow-sm"
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  style={{ height: "40px", fontSize: "13px", borderRadius: "8px", borderColor: "#cbd5e1" }}
                >
                  <option value="all">
                    {getTranslation("All Branches (सभी शाखाएं)", lang)}
                  </option>
                  <option value="1">Bhopal Main Branch</option>
                  <option value="2">Pune-shrink</option>
                  <option value="3">Indore Center</option>
                </select>
              </Col>
            )}
          </Row>

          {/* Registered Patients Billing Table */}
          <div
            className="table-responsive rounded-3 border"
            style={{
              backgroundColor: "#ffffff",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
            }}
          >
            <Table hover className="align-middle mb-0" style={{ fontSize: "13px", minWidth: "1440px" }}>
              <thead style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                <tr>
                  <th className="ps-4 py-3 fw-bold text-uppercase text-secondary" style={{ width: "50px", minWidth: "50px", fontSize: "11.5px", letterSpacing: "0.5px" }}>#</th>
                  <th className="py-3 px-3 fw-bold text-uppercase text-secondary" style={{ minWidth: "230px", whiteSpace: "nowrap", fontSize: "11.5px", letterSpacing: "0.5px" }}>
                    {getTranslation("Patient Info / रोगी विवरण", lang)}
                  </th>
                  <th className="py-3 px-3 fw-bold text-uppercase text-secondary" style={{ minWidth: "160px", whiteSpace: "nowrap", fontSize: "11.5px", letterSpacing: "0.5px" }}>
                    {getTranslation("Branch / शाखा", lang)}
                  </th>
                  <th className="py-3 px-3 fw-bold text-uppercase text-secondary" style={{ minWidth: "350px", fontSize: "11.5px", letterSpacing: "0.5px" }}>
                    {getTranslation("Services Billed / सेवाएं", lang)}
                  </th>
                  <th className="py-3 px-3 fw-bold text-uppercase text-secondary text-end" style={{ minWidth: "120px", whiteSpace: "nowrap", fontSize: "11.5px", letterSpacing: "0.5px" }}>
                    {getTranslation("Gross / कुल (₹)", lang)}
                  </th>
                  <th className="py-3 px-3 fw-bold text-uppercase text-secondary text-end" style={{ minWidth: "120px", whiteSpace: "nowrap", fontSize: "11.5px", letterSpacing: "0.5px" }}>
                    {getTranslation("Discount / छूट (₹)", lang)}
                  </th>
                  <th className="py-3 px-3 fw-bold text-uppercase text-secondary text-end" style={{ minWidth: "130px", whiteSpace: "nowrap", fontSize: "11.5px", letterSpacing: "0.5px" }}>
                    {getTranslation("Net Payable / देय (₹)", lang)}
                  </th>
                  <th className="py-3 px-3 fw-bold text-uppercase text-secondary text-end" style={{ minWidth: "120px", whiteSpace: "nowrap", fontSize: "11.5px", letterSpacing: "0.5px" }}>
                    {getTranslation("Paid / जमा (₹)", lang)}
                  </th>
                  <th className="py-3 px-3 fw-bold text-uppercase text-secondary text-end" style={{ minWidth: "150px", whiteSpace: "nowrap", fontSize: "11.5px", letterSpacing: "0.5px" }}>
                    {getTranslation("Remaining / शेष (₹)", lang)}
                  </th>
                  <th className="py-3 px-3 fw-bold text-uppercase text-secondary text-center" style={{ minWidth: "150px", whiteSpace: "nowrap", fontSize: "11.5px", letterSpacing: "0.5px" }}>
                    {getTranslation("Status / स्थिति", lang)}
                  </th>
                  <th className="py-3 pe-4 fw-bold text-uppercase text-secondary text-end" style={{ minWidth: "210px", whiteSpace: "nowrap", fontSize: "11.5px", letterSpacing: "0.5px" }}>
                    {getTranslation("Actions / कार्य", lang)}
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={11} className="text-center py-5 text-muted">
                      <Spinner size="sm" color="primary" className="me-2" />
                      <span>{getTranslation("Loading patient billing records... / डेटा लोड हो रहा है...", lang)}</span>
                    </td>
                  </tr>
                ) : filteredPatientsWithBills.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-5 text-muted">
                      {getTranslation("No registered patients found matching filters.", lang)}
                    </td>
                  </tr>
                ) : (
                  filteredPatientsWithBills.map((patient, idx) => {
                    const bill = patient.bill;
                    const hasBill = Boolean(bill);
                    const isFullPaid = hasBill && (
                      (patient.paid >= patient.net && patient.net > 0) ||
                      (patient.remaining === 0 && patient.paid > 0 && patient.net > 0) ||
                      ((bill.bill_status === "full_paid" || bill.status === "paid") && patient.paid > 0)
                    );
                    const isPartial = hasBill && !isFullPaid && (
                      (patient.paid > 0 && patient.remaining > 0) ||
                      bill.bill_status === "partial_paid" ||
                      bill.status === "partial"
                    );

                    return (
                      <tr
                        key={patient.id}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          transition: "background-color 0.15s ease",
                        }}
                      >
                        <td className="ps-4 fw-bold text-muted" style={{ width: "50px", padding: "16px 14px" }}>
                          {idx + 1}
                        </td>
                        <td style={{ minWidth: "250px", padding: "16px 14px" }}>
                          <div className="d-flex align-items-center" style={{ gap: "12px" }}>
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center text-primary shadow-sm flex-shrink-0"
                              style={{
                                width: "40px",
                                height: "40px",
                                minWidth: "40px",
                                backgroundColor: "#e6f4f1",
                                fontWeight: "700",
                                fontSize: "14px",
                                border: "1px solid #b2dfdb",
                              }}
                            >
                              {patient.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="d-flex flex-column" style={{ minWidth: 0 }}>
                              <div
                                className="fw-bold text-truncate"
                                style={{ fontSize: "14px", color: "#0f172a", lineHeight: 1.3 }}
                                title={patient.name}
                              >
                                {patient.name}
                              </div>
                              <div
                                className="d-flex align-items-center flex-wrap mt-1"
                                style={{ gap: "8px" }}
                              >
                                <span
                                  style={{
                                    display: "inline-block",
                                    fontSize: "11px",
                                    fontWeight: "600",
                                    padding: "2px 7px",
                                    borderRadius: "6px",
                                    backgroundColor: "#f1f5f9",
                                    color: "#334155",
                                    border: "1px solid #cbd5e1",
                                    letterSpacing: "0.2px",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {patient.gks_id}
                                </span>
                                {patient.phone && (
                                  <span
                                    className="d-flex align-items-center text-muted"
                                    style={{ fontSize: "12px", color: "#475569", whiteSpace: "nowrap" }}
                                  >
                                    <Phone size={11} className="me-1 text-secondary" />
                                    {patient.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td style={{ minWidth: "160px", whiteSpace: "nowrap", padding: "16px 14px" }}>
                          <Badge color="light" className="text-dark border px-2.5 py-1.5" style={{ fontSize: "11.5px" }}>
                            <GitBranch size={11} className="me-1 text-primary" />
                            {patient.branch_name || currentBranchName}
                          </Badge>
                        </td>

                        <td style={{ minWidth: "350px", padding: "16px 14px" }}>
                          {hasBill && bill.items && bill.items.length > 0 ? (
                            <div className="d-flex flex-column gap-2 py-1">
                              {bill.items.map((it, i) => {
                                const badgeColors = getItemTypeBadgeColor(it.item_type_name);
                                return (
                                  <div
                                    key={i}
                                    className="d-flex align-items-center justify-content-between p-2 px-2.5 rounded-3 border"
                                    style={{
                                      backgroundColor: "#f8fafc",
                                      borderColor: "#e2e8f0",
                                      fontSize: "12px",
                                    }}
                                  >
                                    <div className="d-flex align-items-center gap-2 me-2" style={{ maxWidth: "230px" }}>
                                      <span
                                        style={{
                                          display: "inline-block",
                                          fontSize: "10.5px",
                                          padding: "2px 8px",
                                          borderRadius: "12px",
                                          fontWeight: "600",
                                          whiteSpace: "nowrap",
                                          backgroundColor: badgeColors.bg,
                                          color: badgeColors.text,
                                          border: `1px solid ${badgeColors.border}`,
                                        }}
                                      >
                                        {it.item_type_name}
                                      </span>
                                      <span
                                        className="text-dark fw-semibold text-truncate"
                                        title={`${it.item_name} (₹${it.total_rate})`}
                                        style={{ fontSize: "12.5px" }}
                                      >
                                        {it.item_name}
                                      </span>
                                    </div>
                                    <span className="fw-bold text-dark small text-nowrap" style={{ fontSize: "12px" }}>
                                      ₹ {Number(it.total_rate || 0).toLocaleString("en-IN")}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-muted fst-italic small">
                              {getTranslation("No items billed", lang)}
                            </span>
                          )}
                        </td>

                        <td className="text-end fw-semibold text-muted" style={{ minWidth: "120px", whiteSpace: "nowrap", padding: "16px 14px" }}>
                          {hasBill ? `₹ ${patient.gross.toLocaleString("en-IN")}` : "—"}
                        </td>

                        <td className="text-end" style={{ minWidth: "120px", whiteSpace: "nowrap", padding: "16px 14px" }}>
                          {hasBill && patient.discount > 0 ? (
                            <span
                              style={{
                                display: "inline-block",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                backgroundColor: "#fffbeb",
                                color: "#b45309",
                                fontWeight: "700",
                                fontSize: "12px",
                                border: "1px solid #fde68a",
                              }}
                            >
                              - ₹ {patient.discount.toLocaleString("en-IN")}
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>

                        <td className="text-end fw-bold" style={{ minWidth: "130px", whiteSpace: "nowrap", color: "#0f172a", fontSize: "13.5px", padding: "16px 14px" }}>
                          {hasBill ? `₹ ${patient.net.toLocaleString("en-IN")}` : "—"}
                        </td>

                        <td className="text-end fw-bold" style={{ minWidth: "120px", whiteSpace: "nowrap", color: "#16a34a", fontSize: "13px", padding: "16px 14px" }}>
                          {hasBill && patient.paid > 0 ? (
                            `₹ ${patient.paid.toLocaleString("en-IN")}`
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>

                        <td className="text-end" style={{ minWidth: "150px", whiteSpace: "nowrap", padding: "16px 14px" }}>
                          {hasBill ? (
                            isFullPaid ? (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  padding: "6px 12px",
                                  borderRadius: "20px",
                                  backgroundColor: "#dcfce7",
                                  color: "#166534",
                                  border: "1px solid #86efac",
                                  fontWeight: "700",
                                  fontSize: "12px",
                                  letterSpacing: "0.2px",
                                }}
                              >
                                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#16a34a" }}></span>
                                ₹ 0 (Cleared)
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  padding: "6px 12px",
                                  borderRadius: "20px",
                                  backgroundColor: "#fee2e2",
                                  color: "#991b1b",
                                  border: "1px solid #fca5a5",
                                  fontWeight: "700",
                                  fontSize: "12px",
                                  letterSpacing: "0.2px",
                                }}
                              >
                                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#dc2626" }}></span>
                                ₹ {Number(patient.remaining || (patient.net - patient.paid)).toLocaleString("en-IN")}
                              </span>
                            )
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>

                        <td className="text-center" style={{ minWidth: "150px", whiteSpace: "nowrap", padding: "16px 14px" }}>
                          {hasBill ? (
                            isFullPaid ? (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "5px",
                                  padding: "6px 14px",
                                  borderRadius: "20px",
                                  backgroundColor: "#ecfdf5",
                                  color: "#065f46",
                                  border: "1px solid #a7f3d0",
                                  fontWeight: "600",
                                  fontSize: "12px",
                                }}
                              >
                                ✓ {getTranslation("Full Paid", lang)}
                              </span>
                            ) : isPartial ? (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "5px",
                                  padding: "6px 14px",
                                  borderRadius: "20px",
                                  backgroundColor: "#fffbeb",
                                  color: "#92400e",
                                  border: "1px solid #fde68a",
                                  fontWeight: "600",
                                  fontSize: "12px",
                                }}
                              >
                                ⏳ {getTranslation("Partial Paid", lang)}
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "5px",
                                  padding: "6px 14px",
                                  borderRadius: "20px",
                                  backgroundColor: "#fff1f2",
                                  color: "#9f1239",
                                  border: "1px solid #fecdd3",
                                  fontWeight: "600",
                                  fontSize: "12px",
                                }}
                              >
                                ⚠️ {getTranslation("Pending", lang)}
                              </span>
                            )
                          ) : (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                padding: "6px 14px",
                                borderRadius: "20px",
                                backgroundColor: "#f1f5f9",
                                color: "#64748b",
                                border: "1px solid #cbd5e1",
                                fontWeight: "600",
                                fontSize: "12px",
                              }}
                            >
                              ○ {getTranslation("No Bill", lang)}
                            </span>
                          )}
                        </td>

                        <td className="text-end pe-4" style={{ minWidth: "210px", whiteSpace: "nowrap", padding: "16px 14px" }}>
                          <div className="d-flex align-items-center justify-content-end gap-2">
                            <Button
                              color="primary"
                              size="sm"
                              className="d-flex align-items-center gap-1.5 fw-semibold shadow-sm px-3"
                              style={{
                                height: "36px",
                                borderRadius: "8px",
                                backgroundColor: "#24695c",
                                borderColor: "#24695c",
                                fontSize: "12.5px",
                              }}
                              onClick={() => handleOpenBillModal(patient)}
                            >
                              <CreditCard size={14} />
                              <span>{getTranslation("Manage Bill / बिल प्रबंध", lang)}</span>
                            </Button>

                            {hasBill && (
                              <button
                                type="button"
                                className="btn btn-sm d-flex align-items-center justify-content-center shadow-sm"
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  minWidth: "36px",
                                  borderRadius: "8px",
                                  backgroundColor: "#e6f4f1",
                                  border: "1px solid #b2dfdb",
                                  padding: 0,
                                  cursor: "pointer",
                                }}
                                onClick={() => handleOpenReceipt(patient, bill)}
                                title={getTranslation("Print Invoice Receipt / रसीद प्रिंट करें", lang)}
                              >
                                <Printer size={16} color="#24695c" stroke="#24695c" strokeWidth={2.2} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </div>
        </CardBody>
      </Card>

      {/* ===================================================================== */}
      {/* MODAL 1: Manage Bill (Create / Edit / Items / Payments)               */}
      {/* ===================================================================== */}
      {billModalOpen && selectedPatient && (
        <Modal
          isOpen={billModalOpen}
          toggle={() => setBillModalOpen(false)}
          size="xl"
          backdrop="static"
          style={{ maxWidth: "1100px" }}
        >
          <ModalHeader
            toggle={() => setBillModalOpen(false)}
            style={{ backgroundColor: "#ffffff", borderBottom: "1.5px solid #e2e8f0" }}
          >
            <div className="d-flex align-items-center gap-2">
              <CreditCard size={18} color="#24695c" />
              <span className="fw-bold" style={{ fontSize: "16px" }}>
                {getTranslation("Manage Patient Bill & Transactions / मरीज बिल एवं लेन-देन", lang)}
              </span>
              {currentBillNumber ? (
                <Badge color="light" className="text-primary border ms-2">
                  {currentBillNumber}
                </Badge>
              ) : (
                <Badge color="warning" className="ms-2">
                  New Bill (बिल सं. स्वतः उत्पन्न होगी)
                </Badge>
              )}
            </div>
          </ModalHeader>

          <ModalBody className="p-4" style={{ backgroundColor: "#f8fafc" }}>
            {/* Bill Fully Cleared Banner */}
            {modalFinancials.remaining_amount === 0 && modalFinancials.paid_amount > 0 && (
              <div
                className="d-flex align-items-center justify-content-between rounded-3 shadow-sm"
                style={{
                  backgroundColor: "#ecfdf5",
                  border: "1.5px solid #a7f3d0",
                  padding: "18px 24px",
                  marginBottom: "24px",
                  gap: "16px",
                }}
              >
                <div className="d-flex align-items-center" style={{ gap: "16px" }}>
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                    style={{
                      width: "44px",
                      height: "44px",
                      backgroundColor: "#d1fae5",
                      border: "1px solid #6ee7b7",
                    }}
                  >
                    <CheckCircle size={24} color="#059669" />
                  </div>
                  <div>
                    <div className="fw-bold" style={{ color: "#065f46", fontSize: "15px", letterSpacing: "0.2px" }}>
                      {getTranslation("Bill Fully Cleared & Settled (Zero Balance Due) / बिल पूरी तरह से चुकता है", lang)}
                    </div>
                    <div style={{ color: "#047857", fontSize: "13px", marginTop: "4px", lineHeight: 1.5 }}>
                      {getTranslation("All", lang)} ₹{modalFinancials.paid_amount.toLocaleString("en-IN")}{" "}
                      {getTranslation("has been paid in full via completed transactions. Remaining balance is ₹0.", lang)}
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 16px",
                    borderRadius: "20px",
                    backgroundColor: "#059669",
                    color: "#ffffff",
                    fontWeight: "700",
                    fontSize: "12.5px",
                    letterSpacing: "0.3px",
                    whiteSpace: "nowrap",
                  }}
                >
                  ✓ FULL PAID
                </span>
              </div>
            )}

            {/* Step 1: Patient Header Info */}
            <div
              className="bg-white rounded-3 border shadow-sm"
              style={{ padding: "22px 24px", marginBottom: "24px", borderColor: "#e2e8f0" }}
            >
              <Row className="g-3 align-items-center">
                <Col md={3} sm={6}>
                  <div className="text-muted small fw-semibold text-uppercase mb-1" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                    {getTranslation("Patient Name / नाम", lang)}:
                  </div>
                  <div className="fw-bold" style={{ fontSize: "15px", color: "#0f172a" }}>{selectedPatient.name}</div>
                </Col>
                <Col md={3} sm={6}>
                  <div className="text-muted small fw-semibold text-uppercase mb-1" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                    {getTranslation("GKS ID / आईडी", lang)}:
                  </div>
                  <div className="fw-bold" style={{ fontSize: "14.5px", color: "#24695c" }}>{selectedPatient.gks_id}</div>
                </Col>
                <Col md={3} sm={6}>
                  <div className="text-muted small fw-semibold text-uppercase mb-1" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                    {getTranslation("Bill Date / बिल तिथि", lang)}:
                  </div>
                  <Input
                    type="date"
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    style={{ height: "38px", fontSize: "13px", borderRadius: "8px", borderColor: "#cbd5e1" }}
                  />
                </Col>
                <Col md={3} sm={6}>
                  <div className="text-muted small fw-semibold text-uppercase mb-1" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                    {getTranslation("Branch / शाखा", lang)}:
                  </div>
                  <div>
                    <Badge color="light" className="text-dark border px-2.5 py-1.5" style={{ fontSize: "12px" }}>
                      <GitBranch size={12} className="text-primary me-1" />
                      {selectedPatient.branch_name || currentBranchName}
                    </Badge>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Step 2: Item Selection (Hierarchy: Item Type -> Item -> Original Rate -> Discount) */}
            <div
              className="bg-white rounded-3 border shadow-sm"
              style={{ padding: "22px 24px", marginBottom: "24px", borderColor: "#e2e8f0" }}
            >
              <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2" style={{ fontSize: "14.5px" }}>
                <Layers size={17} color="#24695c" />
                <span>
                  {getTranslation(
                    "1. Add Service / Item (आइटम प्रकार -> आइटम -> घोषित दर -> छूट)",
                    lang
                  )}
                </span>
              </h6>

              <Row className="g-3 align-items-end">
                {/* 1. Item Type */}
                <Col md={3} sm={6}>
                  <Label className="small fw-semibold text-dark mb-1.5">
                    {getTranslation("Item Type (Category) / प्रकार", lang)} <span className="text-danger">*</span>
                  </Label>
                  <select
                    className="form-select"
                    value={selectedTypeId}
                    onChange={(e) => handleItemTypeSelect(e.target.value)}
                    style={{ height: "40px", fontSize: "13px", borderRadius: "8px", borderColor: "#cbd5e1" }}
                  >
                    <option value="">-- {getTranslation("Select Type", lang)} --</option>
                    {itemTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.item_type_name || t.name}
                      </option>
                    ))}
                  </select>
                </Col>

                {/* 2. Item Name */}
                <Col md={3} sm={6}>
                  <Label className="small fw-semibold text-dark mb-1.5">
                    {getTranslation("Item Name / सेवा या आइटम", lang)} <span className="text-danger">*</span>
                  </Label>
                  <select
                    className="form-select"
                    value={selectedMasterItemId}
                    onChange={(e) => handleMasterItemSelect(e.target.value)}
                    disabled={!selectedTypeId || typeItems.length === 0}
                    style={{ height: "40px", fontSize: "13px", borderRadius: "8px", borderColor: "#cbd5e1" }}
                  >
                    <option value="">
                      {typeItems.length === 0
                        ? `-- ${getTranslation("No items under this type", lang)} --`
                        : `-- ${getTranslation("Select Item Name", lang)} --`}
                    </option>
                    {typeItems.map((m) => (
                      <option key={m.id || m.item_id} value={m.id || m.item_id}>
                        {m.item_name} (₹{Number(m.original_amount !== undefined ? m.original_amount : m.amount).toLocaleString("en-IN")})
                      </option>
                    ))}
                  </select>
                </Col>

                {/* 3. Original Rate (₹) */}
                <Col md={2} sm={4}>
                  <Label className="small fw-semibold text-dark mb-1.5">
                    {getTranslation("Rate / दर (₹)", lang)} <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={itemUnitRate}
                    onChange={(e) => setItemUnitRate(e.target.value)}
                    className="form-control"
                    style={{ height: "40px", fontSize: "13px", borderRadius: "8px", borderColor: "#cbd5e1" }}
                  />
                </Col>

                {/* 4. Item Discount (₹) */}
                <Col md={2} sm={4}>
                  <Label className="small fw-semibold text-dark mb-1.5">
                    {getTranslation("Discount / छूट (₹)", lang)}
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max={itemUnitRate}
                    placeholder="0"
                    value={itemDiscount}
                    onChange={(e) => setItemDiscount(e.target.value)}
                    className="form-control"
                    style={{ height: "40px", fontSize: "13px", borderRadius: "8px", borderColor: "#cbd5e1" }}
                  />
                </Col>

                {/* 5. Add Button */}
                <Col md={2} sm={4}>
                  <Button
                    color="primary"
                    className="w-100 fw-bold d-flex align-items-center justify-content-center gap-1.5 shadow-sm"
                    style={{
                      height: "40px",
                      borderRadius: "8px",
                      backgroundColor: "#24695c",
                      borderColor: "#24695c",
                    }}
                    onClick={handleAddLineItem}
                  >
                    <Plus size={16} />
                    <span>{getTranslation("Add to Bill", lang)}</span>
                  </Button>
                </Col>
              </Row>
            </div>

            {/* Step 3: Added Items Table */}
            <div
              className="bg-white rounded-3 border shadow-sm"
              style={{ padding: "22px 24px", marginBottom: "24px", borderColor: "#e2e8f0" }}
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold text-dark mb-0" style={{ fontSize: "14px" }}>
                  2. {getTranslation("Billed Items List / जोड़े गए बिल आइटम", lang)} ({billItems.length})
                </h6>
                <span className="small text-muted" style={{ fontSize: "12px" }}>
                  {getTranslation("Stored bill_detail with item_id, original_amount & discount_amount", lang)}
                </span>
              </div>

              <div className="table-responsive rounded-2 border">
                <Table hover className="align-middle mb-0" style={{ fontSize: "13px" }}>
                  <thead style={{ backgroundColor: "#f8fafc" }}>
                    <tr>
                      <th className="py-2.5 px-3" style={{ width: "50px" }}>#</th>
                      <th className="py-2.5 px-3">{getTranslation("Item Name / सेवा", lang)}</th>
                      <th className="py-2.5 px-3">{getTranslation("Category / प्रकार", lang)}</th>
                      <th className="py-2.5 px-3 text-end">{getTranslation("Original Rate (₹)", lang)}</th>
                      <th className="py-2.5 px-3 text-end">{getTranslation("Discount (₹)", lang)}</th>
                      <th className="py-2.5 px-3 text-end">{getTranslation("Net Line Total (₹)", lang)}</th>
                      <th className="py-2.5 px-3 text-end pe-3">{getTranslation("Action", lang)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4 text-muted fst-italic">
                          {getTranslation("No services added yet. Select an item above and click '+ Add to Bill'.", lang)}
                        </td>
                      </tr>
                    ) : (
                      billItems.map((item, index) => (
                        <tr key={item.id || index}>
                          <td className="py-2.5 px-3 fw-bold text-muted">{index + 1}</td>
                          <td className="py-2.5 px-3">
                            <div className="fw-bold text-dark">{item.item_name}</div>
                            {item.description && (
                              <div className="text-muted small">{item.description}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge color="light" className="text-primary border px-2 py-1">
                              {item.item_type_name}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 text-end fw-semibold">₹ {Number(item.original_amount).toLocaleString("en-IN")}</td>
                          <td className="py-2.5 px-3 text-end text-warning fw-bold">
                            {item.discount_amount > 0 ? `- ₹ ${Number(item.discount_amount).toLocaleString("en-IN")}` : "—"}
                          </td>
                          <td className="py-2.5 px-3 text-end fw-bold text-dark">
                            ₹ {Number(item.remaining_amount).toLocaleString("en-IN")}
                          </td>
                          <td className="py-2.5 px-3 text-end pe-3">
                            <Button
                              color="light"
                              size="sm"
                              className="p-1 text-danger border"
                              onClick={() => handleRemoveLineItem(item.id)}
                              title="Remove item"
                            >
                              <Trash2 size={13} />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </div>

            {/* Step 4: Financial Summary (Gross, Discount, Net, Paid, Remaining) */}
            <div
              className="bg-white rounded-3 border shadow-sm"
              style={{ padding: "22px 24px", marginBottom: "24px", borderColor: "#e2e8f0" }}
            >
              <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2" style={{ fontSize: "14px" }}>
                <span>3. {getTranslation("Financial Summary & Calculation / वित्तीय सारांश", lang)}</span>
              </h6>

              <Row className="g-3">
                {/* Gross Amount */}
                <Col md={3} sm={6}>
                  <div className="p-3 bg-light rounded-3 border h-100">
                    <div className="text-muted small fw-semibold text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                      {getTranslation("Gross Amount / कुल घोषित:", lang)}
                    </div>
                    <h4 className="fw-bold text-dark mb-0 mt-1.5">
                      ₹ {modalFinancials.gross_amount.toLocaleString("en-IN")}
                    </h4>
                    <span className="small text-muted" style={{ fontSize: "11px" }}>
                      {billItems.length} {getTranslation("services added", lang)}
                    </span>
                  </div>
                </Col>

                {/* Total Discount */}
                <Col md={3} sm={6}>
                  <div className="p-3 bg-light rounded-3 border h-100">
                    <div className="text-muted small fw-semibold text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                      {getTranslation("Total Discount / कुल छूट:", lang)}
                    </div>
                    <h4 className="fw-bold text-warning mb-0 mt-1.5">
                      - ₹ {modalFinancials.discount_amount.toLocaleString("en-IN")}
                    </h4>
                    <span className="small text-muted" style={{ fontSize: "11px" }}>
                      {getTranslation("Concessions applied", lang)}
                    </span>
                  </div>
                </Col>

                {/* Net Payable */}
                <Col md={3} sm={6}>
                  <div className="p-3 rounded-3 border h-100" style={{ backgroundColor: "#e6f4f1", borderColor: "#a7f3d0" }}>
                    <div className="small fw-semibold text-primary text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                      {getTranslation("Net Payable / कुल देय:", lang)}
                    </div>
                    <h3 className="fw-bold mb-0 mt-1.5" style={{ color: "#24695c" }}>
                      ₹ {modalFinancials.net_amount.toLocaleString("en-IN")}
                    </h3>
                    <span className="small text-muted" style={{ fontSize: "11px" }}>
                      {getTranslation("After all discounts", lang)}
                    </span>
                  </div>
                </Col>

                {/* Remaining Due / Settlement Status */}
                <Col md={3} sm={6}>
                  <div
                    className="p-3 rounded-3 border h-100"
                    style={{
                      backgroundColor:
                        billItems.length === 0 && modalFinancials.gross_amount === 0
                          ? "#f8fafc"
                          : modalFinancials.remaining_amount > 0
                          ? "#fef2f2"
                          : "#ecfdf5",
                      borderColor:
                        billItems.length === 0 && modalFinancials.gross_amount === 0
                          ? "#e2e8f0"
                          : modalFinancials.remaining_amount > 0
                          ? "#fecaca"
                          : "#a7f3d0",
                    }}
                  >
                    <div
                      className="small fw-bold text-uppercase"
                      style={{
                        fontSize: "11px",
                        letterSpacing: "0.5px",
                        color:
                          billItems.length === 0 && modalFinancials.gross_amount === 0
                            ? "#64748b"
                            : modalFinancials.remaining_amount > 0
                            ? "#b91c1c"
                            : "#047857",
                      }}
                    >
                      {billItems.length === 0 && modalFinancials.gross_amount === 0
                        ? getTranslation("○ Status / स्थिति:", lang)
                        : modalFinancials.remaining_amount > 0
                        ? getTranslation("⚠️ Remaining Due / शेष बकाया:", lang)
                        : getTranslation("✓ Settle Status / स्थिति:", lang)}
                    </div>
                    <h3
                      className="fw-bold mb-0 mt-1.5"
                      style={{
                        color:
                          billItems.length === 0 && modalFinancials.gross_amount === 0
                            ? "#475569"
                            : modalFinancials.remaining_amount > 0
                            ? "#b91c1c"
                            : "#047857",
                      }}
                    >
                      ₹ {modalFinancials.remaining_amount.toLocaleString("en-IN")}
                    </h3>
                    <span
                      className="small fw-semibold"
                      style={{
                        fontSize: "11px",
                        color:
                          billItems.length === 0 && modalFinancials.gross_amount === 0
                            ? "#94a3b8"
                            : modalFinancials.remaining_amount > 0
                            ? "#b91c1c"
                            : "#047857",
                      }}
                    >
                      {billItems.length === 0 && modalFinancials.gross_amount === 0
                        ? getTranslation("No items added", lang)
                        : modalFinancials.remaining_amount === 0
                        ? "✓ Full Paid"
                        : `Paid: ₹${modalFinancials.paid_amount.toLocaleString("en-IN")}`}
                    </span>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Step 5: Record Transaction (Cr / De) Section */}
            <div
              className="bg-white rounded-3 border shadow-sm"
              style={{ padding: "22px 24px", marginBottom: "24px", borderColor: "#e2e8f0" }}
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2" style={{ fontSize: "14.5px" }}>
                  <span>4. {getTranslation("Record Payment or Refund / भुगतान अथवा धनवापसी दर्ज करें", lang)}</span>
                </h6>
                <span className="small text-muted">
                  {getTranslation("API: /api/transactions (Cr: Payment | De: Refund)", lang)}
                </span>
              </div>

              <Row className="g-3 align-items-end">
                {/* Type: Cr (Payment) vs De (Refund) */}
                <Col md={2} sm={6}>
                  <Label className="small fw-semibold text-dark mb-1.5">
                    {getTranslation("Type / प्रकार", lang)}
                  </Label>
                  <select
                    className="form-select"
                    value={txType}
                    onChange={(e) => setTxType(e.target.value)}
                    style={{ height: "40px", fontSize: "13px", borderRadius: "8px", borderColor: "#cbd5e1" }}
                  >
                    <option value="Cr">Cr (Payment)</option>
                    <option value="De">De (Refund)</option>
                  </select>
                </Col>

                {/* Amount */}
                <Col md={2} sm={6}>
                  <Label className="small fw-semibold text-dark mb-1.5">
                    {getTranslation("Amount / राशि (₹)", lang)} <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder={
                      txType === "Cr" && modalFinancials.remaining_amount <= 0 && modalFinancials.paid_amount > 0
                        ? "0 (Settled)"
                        : "e.g. 5000"
                    }
                    value={
                      txType === "Cr" && modalFinancials.remaining_amount <= 0 && modalFinancials.paid_amount > 0
                        ? ""
                        : txAmount
                    }
                    disabled={txType === "Cr" && modalFinancials.remaining_amount <= 0 && modalFinancials.paid_amount > 0}
                    onChange={(e) => setTxAmount(e.target.value)}
                    style={{
                      height: "40px",
                      fontSize: "13px",
                      borderRadius: "8px",
                      borderColor: "#cbd5e1",
                      backgroundColor:
                        txType === "Cr" && modalFinancials.remaining_amount <= 0 && modalFinancials.paid_amount > 0
                          ? "#f1f5f9"
                          : "#ffffff",
                    }}
                  />
                </Col>

                {/* Method */}
                <Col md={2} sm={6}>
                  <Label className="small fw-semibold text-dark mb-1.5">
                    {getTranslation("Method / माध्यम", lang)}
                  </Label>
                  <select
                    className="form-select"
                    value={txMethod}
                    disabled={txType === "Cr" && modalFinancials.remaining_amount <= 0 && modalFinancials.paid_amount > 0}
                    onChange={(e) => setTxMethod(e.target.value)}
                    style={{
                      height: "40px",
                      fontSize: "13px",
                      borderRadius: "8px",
                      borderColor: "#cbd5e1",
                      backgroundColor:
                        txType === "Cr" && modalFinancials.remaining_amount <= 0 && modalFinancials.paid_amount > 0
                          ? "#f1f5f9"
                          : "#ffffff",
                    }}
                  >
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Insurance">Insurance</option>
                  </select>
                </Col>

                {/* UTR / Ref No */}
                <Col md={2} sm={6}>
                  <Label className="small fw-semibold text-dark mb-1.5">
                    {getTranslation("UTR / Ref No", lang)}{" "}
                    {(txMethod === "UPI" || txMethod === "Bank Transfer") &&
                      !(txType === "Cr" && modalFinancials.remaining_amount <= 0 && modalFinancials.paid_amount > 0) && (
                        <span className="text-danger">*</span>
                      )}
                  </Label>
                  <Input
                    type="text"
                    placeholder={
                      txType === "Cr" && modalFinancials.remaining_amount <= 0 && modalFinancials.paid_amount > 0
                        ? "Not required (Settled)"
                        : txMethod === "UPI"
                        ? "e.g. 412345678901 (Mandatory)"
                        : "Transaction reference..."
                    }
                    disabled={txType === "Cr" && modalFinancials.remaining_amount <= 0 && modalFinancials.paid_amount > 0}
                    value={
                      txType === "Cr" && modalFinancials.remaining_amount <= 0 && modalFinancials.paid_amount > 0
                        ? ""
                        : txUtrNo
                    }
                    onChange={(e) => setTxUtrNo(e.target.value)}
                    style={{
                      height: "40px",
                      fontSize: "13px",
                      borderRadius: "8px",
                      borderColor: "#cbd5e1",
                      backgroundColor:
                        txType === "Cr" && modalFinancials.remaining_amount <= 0 && modalFinancials.paid_amount > 0
                          ? "#f1f5f9"
                          : "#ffffff",
                    }}
                  />
                </Col>

                {/* Date */}
                <Col md={2} sm={6}>
                  <Label className="small fw-semibold text-dark mb-1.5">
                    {getTranslation("Date / तिथि", lang)}
                  </Label>
                  <Input
                    type="date"
                    value={txDate}
                    disabled={txType === "Cr" && modalFinancials.remaining_amount <= 0 && modalFinancials.paid_amount > 0}
                    onChange={(e) => setTxDate(e.target.value)}
                    style={{
                      height: "40px",
                      fontSize: "13px",
                      borderRadius: "8px",
                      borderColor: "#cbd5e1",
                      backgroundColor:
                        txType === "Cr" && modalFinancials.remaining_amount <= 0 && modalFinancials.paid_amount > 0
                          ? "#f1f5f9"
                          : "#ffffff",
                    }}
                  />
                </Col>

                {/* Record Button */}
                <Col md={2} sm={6}>
                  <Button
                    color={txType === "Cr" ? "success" : "danger"}
                    className="w-100 fw-bold d-flex align-items-center justify-content-center shadow-sm"
                    style={{
                      height: "40px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      opacity:
                        txType === "Cr" && modalFinancials.remaining_amount <= 0 && modalFinancials.paid_amount > 0
                          ? 0.6
                          : 1,
                    }}
                    onClick={handleRecordTransaction}
                    disabled={
                      isRecordingTx ||
                      (txType === "Cr" && modalFinancials.remaining_amount <= 0 && modalFinancials.paid_amount > 0)
                    }
                  >
                    {isRecordingTx ? (
                      <Spinner size="sm" />
                    ) : (
                      <>
                        {txType === "Cr" ? (
                          <ArrowDownLeft size={15} className="me-1" />
                        ) : (
                          <ArrowUpRight size={15} className="me-1" />
                        )}
                        <span>
                          {txType === "Cr" && modalFinancials.remaining_amount <= 0 && modalFinancials.paid_amount > 0
                            ? getTranslation("Cleared", lang)
                            : txType === "Cr"
                            ? getTranslation("Add Cr", lang)
                            : getTranslation("Add De", lang)}
                        </span>
                      </>
                    )}
                  </Button>
                </Col>
              </Row>

              {/* Pay Full Remaining Quick Button */}
              {modalFinancials.remaining_amount > 0 && txType === "Cr" && (
                <div style={{ marginTop: "14px" }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-light border py-1.5 px-3 text-primary fw-semibold d-inline-flex align-items-center gap-1.5"
                    style={{ fontSize: "12px", borderRadius: "6px" }}
                    onClick={() => setTxAmount(modalFinancials.remaining_amount)}
                  >
                    <span>⚡</span>
                    <span>
                      {getTranslation("Fill Full Remaining Due", lang)}: ₹{modalFinancials.remaining_amount.toLocaleString("en-IN")}
                    </span>
                  </button>
                </div>
              )}

              {/* Notice when bill is fully paid & txType is Cr */}
              {modalFinancials.remaining_amount === 0 && modalFinancials.paid_amount > 0 && txType === "Cr" && (
                <div
                  className="rounded-3 d-flex align-items-center gap-3 shadow-sm"
                  style={{
                    marginTop: "20px",
                    padding: "16px 20px",
                    backgroundColor: "#ecfdf5",
                    border: "1.5px solid #a7f3d0",
                    fontSize: "12.5px",
                    color: "#065f46",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      backgroundColor: "#d1fae5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <CheckCircle size={20} color="#059669" />
                  </div>
                  <div>
                    <div className="fw-bold" style={{ color: "#065f46", fontSize: "13.5px", marginBottom: "3px" }}>
                      {getTranslation("Notice: Bill is 100% cleared (₹0 due) / बिल पूरी तरह से चुकता है", lang)}
                    </div>
                    <div style={{ color: "#047857", lineHeight: 1.5 }}>
                      {getTranslation(
                        "No further payment can be collected for this bill. To record a refund to the patient, change Type to 'De (Refund)'.",
                        lang
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 6: Transaction History Log */}
            <div
              className="bg-white rounded-3 border shadow-sm"
              style={{ padding: "22px 24px", marginBottom: "24px", borderColor: "#e2e8f0" }}
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold text-dark mb-0" style={{ fontSize: "14px" }}>
                  5. {getTranslation("Transaction History Log / लेन-देन इतिहास", lang)} ({billTransactions.length})
                </h6>
                <span className="small text-muted" style={{ fontSize: "12px" }}>
                  {getTranslation("Payments (Cr) and Refunds (De) synced with bill", lang)}
                </span>
              </div>

              <div className="table-responsive rounded-2 border">
                <Table size="sm" className="mb-0 text-muted align-middle" style={{ fontSize: "12.5px" }}>
                  <thead style={{ backgroundColor: "#f8fafc" }}>
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">{getTranslation("Date", lang)}</th>
                      <th className="py-2.5 px-3">{getTranslation("Type", lang)}</th>
                      <th className="py-2.5 px-3">{getTranslation("Method", lang)}</th>
                      <th className="py-2.5 px-3">{getTranslation("UTR / Reference", lang)}</th>
                      <th className="py-2.5 px-3">{getTranslation("Status", lang)}</th>
                      <th className="py-2.5 px-3 text-end">{getTranslation("Amount (₹)", lang)}</th>
                      <th className="py-2.5 px-3 text-end">{getTranslation("Action", lang)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-3 text-muted fst-italic">
                          {getTranslation("No transactions recorded yet.", lang)}
                        </td>
                      </tr>
                    ) : (
                      billTransactions.map((t, idx) => (
                        <tr key={t.id || idx}>
                          <td className="py-2.5 px-3">{idx + 1}</td>
                          <td className="py-2.5 px-3">{t.tr_date}</td>
                          <td className="py-2.5 px-3">
                            <Badge color={t.type === "Cr" ? "success" : "danger"} className="p-1 px-2">
                              {t.type === "Cr" ? "Cr (Payment)" : "De (Refund)"}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge color="light" className="text-dark border">
                              {t.method}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3">{t.utr_no || "N/A"}</td>
                          <td className="py-2.5 px-3">
                            <span className="text-success fw-semibold">✓ {t.tr_status || "completed"}</span>
                          </td>
                          <td className={`py-2.5 px-3 text-end fw-bold ${t.type === "Cr" ? "text-success" : "text-danger"}`}>
                            {t.type === "Cr" ? "+" : "-"} ₹ {Number(t.amount).toLocaleString("en-IN")}
                          </td>
                          <td className="py-2.5 px-3 text-end">
                            <Button
                              color="light"
                              size="sm"
                              className="p-1 text-danger border"
                              onClick={() => handleDeleteTransaction(t.id)}
                              title="Delete Transaction"
                            >
                              <Trash2 size={12} />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </div>

            {/* Bill Remarks / Notes */}
            <div
              className="bg-white rounded-3 border shadow-sm"
              style={{ padding: "20px 24px", marginBottom: "16px", borderColor: "#e2e8f0" }}
            >
              <Label className="small fw-semibold text-dark mb-1">
                {getTranslation("Bill Notes / टिप्पणियां (Optional)", lang)}
              </Label>
              <Input
                type="textarea"
                rows={2}
                placeholder="e.g. Ward charges for admission, blood routine done, pending amount due on discharge..."
                value={billNotes}
                onChange={(e) => setBillNotes(e.target.value)}
                style={{ fontSize: "13px", borderRadius: "8px" }}
              />
            </div>
          </ModalBody>

          <ModalFooter style={{ backgroundColor: "#ffffff", borderTop: "1.5px solid #e2e8f0" }}>
            <div className="d-flex justify-content-between align-items-center w-100">
              <div className="d-flex align-items-center gap-2">
                <span className="small text-muted">{getTranslation("Net Payable:", lang)}</span>
                <span className="fw-bold text-dark">
                  ₹ {modalFinancials.net_amount.toLocaleString("en-IN")}
                </span>
                <span className="text-muted">|</span>
                <span className="small text-muted">{getTranslation("Remaining:", lang)}</span>
                <span
                  className="fw-bold"
                  style={{ color: modalFinancials.remaining_amount > 0 ? "#dc2626" : "#16a34a" }}
                >
                  ₹ {modalFinancials.remaining_amount.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="d-flex gap-2">
                <Button color="light" className="border px-3" onClick={() => setBillModalOpen(false)}>
                  {getTranslation("Cancel / रद्द करें", lang)}
                </Button>
                <Button
                  color="primary"
                  className="px-4 fw-bold shadow-sm"
                  style={{ backgroundColor: "#24695c", borderColor: "#24695c" }}
                  onClick={handleSaveBill}
                  disabled={isSavingBill}
                >
                  {isSavingBill ? (
                    <Spinner size="sm" className="me-1" />
                  ) : (
                    <Check size={16} className="me-1" />
                  )}
                  <span>
                    {modalFinancials.remaining_amount === 0 && modalFinancials.paid_amount > 0
                      ? getTranslation("Update Bill Details / बिल विवरण अपडेट करें", lang)
                      : currentBillId
                      ? getTranslation("Save & Update Bill / बिल सहेजें और अपडेट करें", lang)
                      : getTranslation("Generate & Save Bill / बिल सहेजें", lang)}
                  </span>
                </Button>
              </div>
            </div>
          </ModalFooter>
        </Modal>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: Printable Invoice Receipt                                    */}
      {/* ===================================================================== */}
      {receiptModalOpen && activeReceiptBill && activeReceiptPatient && (
        <Modal
          isOpen={receiptModalOpen}
          toggle={() => setReceiptModalOpen(false)}
          size="lg"
        >
          <ModalHeader
            toggle={() => setReceiptModalOpen(false)}
            style={{ backgroundColor: "#ffffff" }}
          >
            <div className="d-flex align-items-center gap-2">
              <Printer size={18} color="#24695c" />
              <span className="fw-bold">
                {getTranslation("Patient Invoice Receipt / मरीज रसीद", lang)}:{" "}
                {activeReceiptBill.bill_number || `Bill #${activeReceiptBill.bill_no}`}
              </span>
            </div>
          </ModalHeader>

          <ModalBody className="p-4" style={{ backgroundColor: "#ffffff" }}>
            <style>{`
              @media print {
                body * {
                  visibility: hidden !important;
                }
                .printable-receipt-card, .printable-receipt-card * {
                  visibility: visible !important;
                  color: #0f172a !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .printable-receipt-card {
                  position: fixed !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  padding: 24px !important;
                  margin: 0 !important;
                  border: none !important;
                  background: #ffffff !important;
                }
                .modal, .modal-backdrop, .modal-dialog, .modal-content, .modal-header, .modal-footer {
                  border: none !important;
                  background: transparent !important;
                  box-shadow: none !important;
                }
              }
            `}</style>

            <div ref={printRef} className="printable-receipt-card p-4 border rounded-3 bg-white" style={{ fontFamily: "inherit" }}>
              {/* Clinic Header */}
              <div className="text-center pb-3 border-bottom mb-3">
                <h4 className="fw-bold text-dark mb-1" style={{ color: "#24695c" }}>
                  GKS REHABILITATION & CLINICAL CARE CENTER
                </h4>
                <div className="text-muted small">
                  {activeReceiptBill.branch_name || currentBranchName} | Integrated De-Addiction & Neuro-Psychiatry
                </div>
                <div className="text-muted small">
                  Helpline: +91 98765 43210 | Email: billing@gks-rehab.com | GSTIN: 23AAAAA0000A1Z5
                </div>
              </div>

              {/* Invoice Meta & Patient Info */}
              <Row className="g-3 mb-3">
                <Col sm={6}>
                  <div
                    style={{
                      backgroundColor: "#f8fafc",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      padding: "14px 16px",
                      color: "#0f172a",
                    }}
                  >
                    <div className="fw-bold mb-2 pb-1 border-bottom" style={{ fontSize: "13px", color: "#24695c", borderColor: "#e2e8f0" }}>
                      {getTranslation("PATIENT DETAILS / मरीज का विवरण", lang)}
                    </div>
                    <div className="d-flex justify-content-between mb-1" style={{ fontSize: "13px" }}>
                      <span style={{ color: "#475569", fontWeight: "600" }}>{getTranslation("Name", lang)}:</span>
                      <span style={{ color: "#0f172a", fontWeight: "700" }}>{activeReceiptPatient.name}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1" style={{ fontSize: "13px" }}>
                      <span style={{ color: "#475569", fontWeight: "600" }}>{getTranslation("GKS ID", lang)}:</span>
                      <span style={{ color: "#24695c", fontWeight: "700" }}>{activeReceiptPatient.gks_id}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1" style={{ fontSize: "13px" }}>
                      <span style={{ color: "#475569", fontWeight: "600" }}>{getTranslation("Phone", lang)}:</span>
                      <span style={{ color: "#0f172a", fontWeight: "600" }}>{activeReceiptPatient.phone || "—"}</span>
                    </div>
                    <div className="d-flex justify-content-between" style={{ fontSize: "13px" }}>
                      <span style={{ color: "#475569", fontWeight: "600" }}>{getTranslation("Ward / Branch", lang)}:</span>
                      <span style={{ color: "#0f172a", fontWeight: "600" }}>{activeReceiptBill.branch_name || currentBranchName}</span>
                    </div>
                  </div>
                </Col>

                <Col sm={6}>
                  <div
                    style={{
                      backgroundColor: "#f8fafc",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      padding: "14px 16px",
                      color: "#0f172a",
                    }}
                  >
                    <div className="fw-bold mb-2 pb-1 border-bottom" style={{ fontSize: "13px", color: "#24695c", borderColor: "#e2e8f0" }}>
                      {getTranslation("INVOICE SUMMARY / चालान विवरण", lang)}
                    </div>
                    <div className="d-flex justify-content-between mb-1" style={{ fontSize: "13px" }}>
                      <span style={{ color: "#475569", fontWeight: "600" }}>{getTranslation("Invoice No", lang)}:</span>
                      <span style={{ color: "#24695c", fontWeight: "700" }}>{activeReceiptBill.bill_number || `Bill #${activeReceiptBill.bill_no}`}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1" style={{ fontSize: "13px" }}>
                      <span style={{ color: "#475569", fontWeight: "600" }}>{getTranslation("Date", lang)}:</span>
                      <span style={{ color: "#0f172a", fontWeight: "600" }}>{activeReceiptBill.bill_date}</span>
                    </div>
                    <div className="d-flex justify-content-between" style={{ fontSize: "13px" }}>
                      <span style={{ color: "#475569", fontWeight: "600" }}>{getTranslation("Status", lang)}:</span>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontWeight: "700",
                          fontSize: "11px",
                          backgroundColor: activeReceiptBill.remaining_amount === 0 ? "#ecfdf5" : "#fffbeb",
                          color: activeReceiptBill.remaining_amount === 0 ? "#047857" : "#b45309",
                          border: `1px solid ${activeReceiptBill.remaining_amount === 0 ? "#a7f3d0" : "#fde68a"}`,
                        }}
                      >
                        {activeReceiptBill.remaining_amount === 0 ? "✓ FULLY PAID" : "⏳ PARTIAL / PENDING"}
                      </span>
                    </div>
                  </div>
                </Col>
              </Row>

              {/* Itemized Table */}
              <Table bordered size="sm" className="align-middle mb-3" style={{ fontSize: "13px", borderColor: "#cbd5e1" }}>
                <thead style={{ backgroundColor: "#f1f5f9" }}>
                  <tr>
                    <th className="py-2 px-2.5 text-dark" style={{ width: "45px" }}>#</th>
                    <th className="py-2 px-2.5 text-dark">{getTranslation("Item / Service Description", lang)}</th>
                    <th className="py-2 px-2.5 text-dark">{getTranslation("Category", lang)}</th>
                    <th className="py-2 px-2.5 text-dark text-end">{getTranslation("Unit Rate (₹)", lang)}</th>
                    <th className="py-2 px-2.5 text-dark text-end">{getTranslation("Discount (₹)", lang)}</th>
                    <th className="py-2 px-2.5 text-dark text-end">{getTranslation("Net Line Amount (₹)", lang)}</th>
                  </tr>
                </thead>
                <tbody>
                  {activeReceiptBill.items && activeReceiptBill.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-2.5 fw-bold text-muted">{idx + 1}</td>
                      <td className="py-2 px-2.5">
                        <div className="fw-bold text-dark">{it.item_name}</div>
                        {it.description && <div className="text-muted small">{it.description}</div>}
                      </td>
                      <td className="py-2 px-2.5 text-dark">{it.item_type_name}</td>
                      <td className="py-2 px-2.5 text-end text-dark">₹ {Number(it.original_amount !== undefined ? it.original_amount : it.unit_rate).toLocaleString("en-IN")}</td>
                      <td className="py-2 px-2.5 text-end text-warning fw-bold">
                        {it.discount_amount > 0 ? `- ₹ ${Number(it.discount_amount).toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td className="py-2 px-2.5 text-end fw-bold text-dark">₹ {Number(it.remaining_amount !== undefined ? it.remaining_amount : it.total_rate).toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* Totals Summary */}
              <Row className="g-2 justify-content-end mb-3">
                <Col sm={6}>
                  <div
                    style={{
                      backgroundColor: "#f8fafc",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      padding: "14px 16px",
                      fontSize: "13px",
                      color: "#0f172a",
                    }}
                  >
                    <div className="d-flex justify-content-between mb-1.5" style={{ color: "#475569" }}>
                      <span>{getTranslation("Gross Declared Amount:", lang)}</span>
                      <span className="fw-semibold text-dark">₹ {activeReceiptBill.gross_amount.toLocaleString("en-IN")}</span>
                    </div>
                    {activeReceiptBill.discount_amount > 0 && (
                      <div className="d-flex justify-content-between mb-1.5" style={{ color: "#b45309" }}>
                        <span>{getTranslation("Discount Applied:", lang)}</span>
                        <span className="fw-bold">- ₹ {activeReceiptBill.discount_amount.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    <div className="d-flex justify-content-between border-top pt-2 fw-bold" style={{ fontSize: "14px", color: "#0f172a", borderColor: "#cbd5e1" }}>
                      <span>{getTranslation("Net Payable:", lang)}</span>
                      <span style={{ color: "#24695c" }}>₹ {activeReceiptBill.net_amount.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="d-flex justify-content-between pt-1.5" style={{ color: "#047857", fontWeight: "600" }}>
                      <span>{getTranslation("Total Paid:", lang)}</span>
                      <span>₹ {activeReceiptBill.paid_amount.toLocaleString("en-IN")}</span>
                    </div>
                    <div
                      className="d-flex justify-content-between border-top pt-2 fw-bold"
                      style={{
                        color: activeReceiptBill.remaining_amount > 0 ? "#dc2626" : "#047857",
                        fontSize: "14px",
                        borderColor: "#cbd5e1",
                      }}
                    >
                      <span>{getTranslation("Balance Remaining Due:", lang)}</span>
                      <span>₹ {activeReceiptBill.remaining_amount.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </Col>
              </Row>

              {/* Signatures */}
              <div className="d-flex justify-content-between align-items-end pt-4 mt-3 border-top" style={{ color: "#334155", borderColor: "#cbd5e1" }}>
                <div>
                  <div className="fw-semibold small" style={{ color: "#475569" }}>{getTranslation("Patient / Relative Signature", lang)}</div>
                  <div style={{ height: "45px" }}></div>
                  <div className="border-top pt-1" style={{ width: "170px", borderColor: "#94a3b8" }}></div>
                </div>

                <div className="text-end">
                  <div className="fw-semibold small" style={{ color: "#475569" }}>{getTranslation("Authorized Signatory & Stamp", lang)}</div>
                  <div style={{ height: "45px" }}></div>
                  <div className="border-top pt-1" style={{ width: "170px", borderColor: "#94a3b8" }}></div>
                </div>
              </div>
            </div>
          </ModalBody>

          <ModalFooter style={{ backgroundColor: "#ffffff" }}>
            <Button color="light" className="border" onClick={() => setReceiptModalOpen(false)}>
              {getTranslation("Close / बंद करें", lang)}
            </Button>
            <Button
              color="primary"
              className="fw-bold px-3 d-flex align-items-center gap-1.5"
              style={{ backgroundColor: "#24695c", borderColor: "#24695c" }}
              onClick={handlePrintReceipt}
            >
              <Printer size={15} />
              <span>{getTranslation("Print Invoice / प्रिंट रसीद", lang)}</span>
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </>
  );

  return isTabMode ? (
    <div className="pt-2">{mainContent}</div>
  ) : (
    <Container fluid={true} className="p-3 p-md-4">
      {mainContent}
    </Container>
  );
};

export default PatientBilling;
