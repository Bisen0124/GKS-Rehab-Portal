/**
 * Patient Billing Service
 * Implements official Bills (/api/bills) and Transactions (/api/transactions) APIs
 * from the GKS Rehab Portal Accounting & Billing Postman Collection.
 * Features full offline cache & fallback for uninterrupted workflow.
 */

import { getAuthHeaders, buildApiUrl } from "./billingMasterService";

const PATIENT_BILLS_KEY = "gks_patient_bills";
const BILL_TRANSACTIONS_KEY = "gks_bill_transactions";

// Default Registered Patients (for offline fallback / test reference)
export const DEFAULT_REGISTERED_PATIENTS = [
  {
    id: 37,
    user_id: 37,
    gks_id: "GKS-2026-037",
    name: "Rajesh Kumar Sharma",
    phone: "9876543210",
    email: "rajesh.sharma@example.com",
    gender: "Male",
    age: 38,
    branch_id: 1,
    branch_name: "Bhopal Main Branch",
    admit_date: "2026-08-10",
    ward: "Private Ward Room (AC)",
    photo: "",
  },
  {
    id: 102,
    user_id: 102,
    gks_id: "GKS-2026-102",
    name: "Priya Verma",
    phone: "9823456781",
    email: "priya.verma@example.com",
    gender: "Female",
    age: 29,
    branch_id: 1,
    branch_name: "Bhopal Main Branch",
    admit_date: "2026-08-15",
    ward: "Semi-Private Ward Bed",
    photo: "",
  },
  {
    id: 103,
    user_id: 103,
    gks_id: "GKS-2026-103",
    name: "Amitabh Patel",
    phone: "9712345678",
    email: "amitabh.patel@example.com",
    gender: "Male",
    age: 45,
    branch_id: 1,
    branch_name: "Bhopal Main Branch",
    admit_date: "2026-08-20",
    ward: "General Rehabilitation Ward",
    photo: "",
  },
];

// Initial Seed Bills
const INITIAL_PATIENT_BILLS = [
  {
    id: 1,
    bill_id: 1,
    bill_no: 1,
    bill_number: "GKS/BILL/26/001",
    user_id: 37,
    patient_id: 37,
    patient_name: "Rajesh Kumar Sharma",
    patient_phone: "9876543210",
    branch_id: 1,
    branch_name: "Bhopal Main Branch",
    bill_date: "2026-09-25",
    bill_status: "partial_paid",
    status: "partial_paid",
    bill_detail: [
      {
        item_id: 1,
        item_name: "Private Ward Room (AC)",
        item_type_name: "Ward Charges",
        original_amount: 15000,
        discount_amount: 1000,
        remaining_amount: 14000,
        quantity: 1,
      },
      {
        item_id: 4,
        item_name: "Routine Blood Package (CBC + ESR)",
        item_type_name: "Blood Packages",
        original_amount: 450,
        discount_amount: 0,
        remaining_amount: 450,
        quantity: 1,
      },
    ],
    items: [
      {
        id: "item_1",
        item_id: 1,
        item_type_id: 1,
        item_type_name: "Ward Charges",
        item_name: "Private Ward Room (AC)",
        unit_rate: 15000,
        original_amount: 15000,
        discount_amount: 1000,
        remaining_amount: 14000,
        quantity: 1,
        total_rate: 14000,
      },
      {
        id: "item_2",
        item_id: 4,
        item_type_id: 2,
        item_type_name: "Blood Packages",
        item_name: "Routine Blood Package (CBC + ESR)",
        unit_rate: 450,
        original_amount: 450,
        discount_amount: 0,
        remaining_amount: 450,
        quantity: 1,
        total_rate: 450,
      },
    ],
    gross_amount: 15450,
    discount_amount: 1000,
    net_amount: 14450,
    paid_amount: 5000,
    remaining_amount: 9450,
    balance_amount: 9450,
    payments: [
      {
        id: 1,
        tr_no: 1,
        tr_date: "2026-09-25",
        amount: 5000,
        method: "UPI",
        type: "Cr",
        utr_no: "412345678901",
        tr_status: "completed",
      },
    ],
  },
];

// Seed Transactions
const INITIAL_TRANSACTIONS = [
  {
    id: 1,
    tr_no: 1,
    user_id: 37,
    bill_no: 1,
    tr_date: "2026-09-25",
    amount: 5000,
    method: "UPI",
    type: "Cr",
    utr_no: "412345678901",
    tr_status: "completed",
    branch_id: 1,
  },
];

// Helper: Normalize bill payload
export const normalizeBill = (b) => {
  if (!b) return null;
  const billId = b.id || b.bill_id;
  const billNo = b.bill_no !== undefined ? b.bill_no : b.bill_number ? String(b.bill_number).split("/").pop() : 1;
  const userId = b.user_id !== undefined ? b.user_id : b.patient_id;

  const rawDetails = b.bill_detail || b.items || [];
  const items = Array.isArray(rawDetails)
    ? rawDetails.map((it, idx) => {
        const orig = Number(it.original_amount !== undefined ? it.original_amount : it.unit_rate || it.amount || 0);
        const disc = Number(it.discount_amount) || 0;
        const rem = Number(it.remaining_amount !== undefined ? it.remaining_amount : Math.max(0, orig - disc));
        const qty = Number(it.quantity) || 1;
        return {
          id: it.id || `item_${idx}`,
          item_id: it.item_id || it.id,
          item_master_id: it.item_id || it.id,
          item_name: it.item_name || "Service Item",
          item_type_id: it.item_type_id || 1,
          item_type_name: it.item_type_name || "General",
          original_amount: orig,
          unit_rate: orig,
          discount_amount: disc,
          remaining_amount: rem,
          quantity: qty,
          total_rate: rem * qty,
          description: it.description || "",
        };
      })
    : [];

  const gross = Number(
    b.gross_amount !== undefined && b.gross_amount !== null
      ? b.gross_amount
      : items.reduce((s, i) => s + (Number(i.original_amount) || 0) * (Number(i.quantity) || 1), 0)
  );

  const discount = Number(
    b.discount_amount !== undefined && b.discount_amount !== null
      ? b.discount_amount
      : items.reduce((s, i) => s + (Number(i.discount_amount) || 0), 0)
  );

  const net = Number(
    b.net_amount !== undefined && b.net_amount !== null
      ? b.net_amount
      : Math.max(0, gross - discount)
  );

  // Compute total paid from attached transactions if available
  let calculatedPaid = 0;
  const rawTxList = Array.isArray(b.transactions)
    ? b.transactions
    : Array.isArray(b.payments)
    ? b.payments
    : [];
  rawTxList.forEach((t) => {
    if (t.tr_status === "completed" || !t.tr_status) {
      if (t.type === "Cr") calculatedPaid += Number(t.amount) || 0;
      else if (t.type === "De") calculatedPaid -= Number(t.amount) || 0;
    }
  });

  const paid = Number(
    b.paid_amount !== undefined && b.paid_amount !== null && Number(b.paid_amount) > 0
      ? b.paid_amount
      : calculatedPaid
  );

  // Remaining MUST be logically consistent:
  let remaining = Math.max(0, net - paid);
  if (paid === 0 && net > 0) {
    remaining = net;
  } else if (b.remaining_amount !== undefined && b.remaining_amount !== null && Number(b.remaining_amount) > 0) {
    remaining = Number(b.remaining_amount);
  } else if (b.balance_amount !== undefined && b.balance_amount !== null && Number(b.balance_amount) > 0) {
    remaining = Number(b.balance_amount);
  }

  // Derive authoritative status:
  let status = b.bill_status || b.status;
  if (!status || status === "unpaid" || status === "draft") {
    if (remaining === 0 && net > 0 && paid >= net) {
      status = "full_paid";
    } else if (paid > 0 && remaining > 0) {
      status = "partial_paid";
    } else {
      status = "pending";
    }
  }
  if (status === "paid") status = "full_paid";
  if (status === "partial") status = "partial_paid";

  // Sanity check: if status says full_paid but paid is 0 and net is > 0, it is definitely pending!
  if (status === "full_paid" && paid === 0 && net > 0) {
    status = "pending";
    remaining = net;
  }

  return {
    ...b,
    id: billId,
    bill_id: billId,
    bill_no: Number(billNo) || 1,
    bill_number: b.bill_number || `GKS/BILL/26/${String(billNo).padStart(3, "0")}`,
    user_id: Number(userId),
    patient_id: Number(userId),
    patient_name: b.patient_name || b.name || "Patient",
    patient_phone: b.patient_phone || b.phone || "",
    bill_date: b.bill_date ? String(b.bill_date).split("T")[0] : new Date().toISOString().split("T")[0],
    items,
    bill_detail: items,
    gross_amount: gross,
    discount_amount: discount,
    net_amount: net,
    paid_amount: paid,
    remaining_amount: remaining,
    balance_amount: remaining,
    bill_status: status,
    status,
    payments: rawTxList,
    transactions: rawTxList,
  };
};

// Normalize transaction helper
export const normalizeTransaction = (tr) => {
  return {
    id: tr.id || tr.tr_id,
    tr_id: tr.id || tr.tr_id,
    tr_no: tr.tr_no || tr.id || 1,
    user_id: Number(tr.user_id),
    bill_no: Number(tr.bill_no),
    tr_date: tr.tr_date ? String(tr.tr_date).split("T")[0] : new Date().toISOString().split("T")[0],
    amount: Number(tr.amount) || 0,
    method: tr.method || "Cash",
    type: tr.type === "De" ? "De" : "Cr",
    utr_no: tr.utr_no || "",
    tr_status: tr.tr_status || "completed",
    branch_id: tr.branch_id || 1,
  };
};

// ============================================================================
// 1. BILLING MODULE APIS (/api/bills)
// ============================================================================

/**
 * 15) Get All Active Bills
 * GET /api/bills?branch_id=1[&bill_status=...&user_id=...&from_date=...&to_date=...]
 */
export const fetchActiveBills = async (branchId = 1, queryParams = {}) => {
  try {
    const url = buildApiUrl("/api/bills", branchId, queryParams);
    const res = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
      const normalized = list.map(normalizeBill);
      saveAllBills(normalized);
      return normalized;
    }
  } catch (err) {
    console.warn("fetchActiveBills failed, fallback to local:", err);
  }
  return getAllBills(branchId);
};

/**
 * 16) Get All Bills (Including Inactive)
 * GET /api/bills/all?branch_id=1
 */
export const fetchAllBills = async (branchId = 1) => {
  try {
    const url = buildApiUrl("/api/bills/all", branchId);
    const res = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
      const normalized = list.map(normalizeBill);
      saveAllBills(normalized);
      return normalized;
    }
  } catch (err) {
    console.warn("fetchAllBills failed, fallback to local:", err);
  }
  return getAllBills(branchId);
};

/**
 * 17) Get Bills By Patient (with total / paid / balance summary)
 * GET /api/bills/user/:user_id?branch_id=1
 */
export const fetchBillsByPatient = async (userId, branchId = 1) => {
  if (!userId) return [];
  try {
    const url = buildApiUrl(`/api/bills/user/${userId}`, branchId);
    const res = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
      return list.map(normalizeBill);
    }
  } catch (err) {
    console.warn("fetchBillsByPatient failed, fallback to local:", err);
  }
  const all = getAllBills(branchId);
  return all.filter((b) => Number(b.user_id) === Number(userId));
};

/**
 * 18) Get Bill By ID (includes its transactions)
 * GET /api/bills/:id?branch_id=1
 */
export const fetchBillById = async (billId, branchId = 1) => {
  try {
    const url = buildApiUrl(`/api/bills/${billId}`, branchId);
    const res = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      const data = await res.json();
      return normalizeBill(data.data || data);
    }
  } catch (err) {
    console.warn("fetchBillById failed, fallback to local:", err);
  }
  const all = getAllBills(branchId);
  return all.find((b) => String(b.id) === String(billId)) || null;
};

/**
 * 14) Create Bill
 * POST /api/bills?branch_id=1
 * Payload:
 * {
 *   "user_id": 37,
 *   "bill_date": "2026-09-25",
 *   "bill_detail": [
 *     { "item_id": 1, "discount_amount": 1000.00 },
 *     { "item_id": 2, "discount_amount": 0 }
 *   ]
 * }
 */
export const createBillApi = async (payload, branchId = 1) => {
  const body = {
    user_id: Number(payload.user_id || payload.patient_id),
    bill_date: payload.bill_date || new Date().toISOString().split("T")[0],
    bill_detail: (payload.bill_detail || payload.items || []).map((it) => ({
      item_id: Number(it.item_id || it.item_master_id || it.id),
      discount_amount: Number(it.discount_amount) || 0,
    })),
  };

  try {
    const url = buildApiUrl("/api/bills", branchId);
    const res = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const resData = await res.json();
      let created = normalizeBill(resData.data || resData);
      // Enrich with items from payload if backend response items lack rate details
      if (created && created.items && (payload.bill_detail || payload.items)) {
        const sourceItems = payload.items || payload.bill_detail;
        created.items = created.items.map((it, idx) => {
          const match = sourceItems.find((si) => Number(si.item_id || si.id) === Number(it.item_id)) || sourceItems[idx];
          return {
            ...it,
            original_amount: it.original_amount || match?.original_amount || match?.unit_rate || 0,
            unit_rate: it.unit_rate || match?.unit_rate || match?.original_amount || 0,
            item_name: it.item_name || match?.item_name || "Service Item",
            item_type_name: it.item_type_name || match?.item_type_name || "General",
          };
        });
        created = normalizeBill(created);
      }
      // Sync local cache
      const current = getAllBills();
      saveAllBills([created, ...current.filter((b) => String(b.id) !== String(created.id))]);
      return created;
    }
  } catch (err) {
    console.warn("createBillApi failed, saving locally:", err);
  }
  return savePatientBill(payload);
};

/**
 * 19) Update Bill
 * PUT /api/bills/:id?branch_id=1
 * Payload:
 * {
 *   "bill_date": "2026-09-25",
 *   "bill_detail": [
 *     { "item_id": 1, "discount_amount": 500.00 }
 *   ]
 * }
 */
export const updateBillApi = async (billId, payload, branchId = 1) => {
  const body = {};
  if (payload.bill_date) body.bill_date = payload.bill_date;
  if (payload.bill_detail || payload.items) {
    body.bill_detail = (payload.bill_detail || payload.items).map((it) => ({
      item_id: Number(it.item_id || it.item_master_id || it.id),
      discount_amount: Number(it.discount_amount) || 0,
    }));
  }

  try {
    const url = buildApiUrl(`/api/bills/${billId}`, branchId);
    const res = await fetch(url, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const resData = await res.json();
      let updated = normalizeBill(resData.data || resData);
      if (updated && updated.items && (payload.bill_detail || payload.items)) {
        const sourceItems = payload.items || payload.bill_detail;
        updated.items = updated.items.map((it, idx) => {
          const match = sourceItems.find((si) => Number(si.item_id || si.id) === Number(it.item_id)) || sourceItems[idx];
          return {
            ...it,
            original_amount: it.original_amount || match?.original_amount || match?.unit_rate || 0,
            unit_rate: it.unit_rate || match?.unit_rate || match?.original_amount || 0,
            item_name: it.item_name || match?.item_name || "Service Item",
            item_type_name: it.item_type_name || match?.item_type_name || "General",
          };
        });
        updated = normalizeBill(updated);
      }
      const current = getAllBills();
      const idx = current.findIndex((b) => String(b.id) === String(billId));
      if (idx !== -1) {
        current[idx] = { ...current[idx], ...updated };
        saveAllBills(current);
      }
      return updated;
    }
  } catch (err) {
    console.warn("updateBillApi failed, saving locally:", err);
  }
  return savePatientBill({ ...payload, id: billId });
};

/**
 * 20) Delete Bill (soft delete)
 * DELETE /api/bills/:id?branch_id=1
 */
export const deleteBillApi = async (billId, branchId = 1) => {
  try {
    const url = buildApiUrl(`/api/bills/${billId}`, branchId);
    const res = await fetch(url, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      deletePatientBill(billId);
      return await res.json();
    }
  } catch (err) {
    console.warn("deleteBillApi failed, deleting locally:", err);
  }
  return deletePatientBill(billId);
};

// ============================================================================
// 2. TRANSACTION MODULE APIS (/api/transactions)
// ============================================================================

/**
 * 21 & 22) Create Transaction (Payment: Cr, Refund: De)
 * POST /api/transactions?branch_id=1
 * Payload:
 * {
 *   "user_id": 37,
 *   "bill_no": 1,
 *   "tr_date": "2026-09-25",
 *   "amount": 5000.00,
 *   "method": "UPI", // Cash | Credit Card | Debit Card | UPI | Bank Transfer | Insurance
 *   "type": "Cr", // Cr | De
 *   "utr_no": "412345678901",
 *   "tr_status": "completed" // completed | failed | pending
 * }
 */
export const createTransactionApi = async (payload, branchId = 1) => {
  const body = {
    user_id: Number(payload.user_id),
    bill_no: Number(payload.bill_no || 1),
    tr_date: payload.tr_date || new Date().toISOString().split("T")[0],
    amount: Number(payload.amount) || 0,
    method: payload.method || "Cash",
    type: payload.type === "De" ? "De" : "Cr",
    utr_no: payload.utr_no ? String(payload.utr_no).trim() : "",
    tr_status: payload.tr_status || "completed",
  };

  try {
    const url = buildApiUrl("/api/transactions", branchId);
    const res = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const resData = await res.json();
      const created = normalizeTransaction(resData.data || resData);
      // Sync local storage
      const txs = getStoredTransactions();
      saveStoredTransactions([created, ...txs]);
      return { success: true, data: created, bill_sync: resData.bill_sync };
    } else {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || "Failed to record transaction");
    }
  } catch (err) {
    console.warn("createTransactionApi failed, saving locally:", err);
    // Offline local transaction record
    const newTx = {
      id: Date.now(),
      tr_no: Date.now().toString().slice(-4),
      ...body,
      branch_id: branchId,
    };
    const txs = getStoredTransactions();
    saveStoredTransactions([newTx, ...txs]);
    return { success: true, data: newTx };
  }
};

/**
 * 23) Get All Active Transactions
 * GET /api/transactions?branch_id=1
 */
export const fetchActiveTransactions = async (branchId = 1, queryParams = {}) => {
  try {
    const url = buildApiUrl("/api/transactions", branchId, queryParams);
    const res = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
      return list.map(normalizeTransaction);
    }
  } catch (err) {
    console.warn("fetchActiveTransactions failed, fallback to local:", err);
  }
  return getStoredTransactions(branchId);
};

/**
 * 25) Get Transactions By Patient
 * GET /api/transactions/user/:user_id?branch_id=1
 */
export const fetchTransactionsByPatient = async (userId, branchId = 1) => {
  if (!userId) return [];
  try {
    const url = buildApiUrl(`/api/transactions/user/${userId}`, branchId);
    const res = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
      return list.map(normalizeTransaction);
    }
  } catch (err) {
    console.warn("fetchTransactionsByPatient failed, fallback to local:", err);
  }
  const all = getStoredTransactions(branchId);
  return all.filter((t) => Number(t.user_id) === Number(userId));
};

/**
 * 26) Get Transactions By Bill (with bill balance)
 * GET /api/transactions/user/:user_id/bill/:bill_no?branch_id=1
 */
export const fetchTransactionsByBill = async (userId, billNo, branchId = 1) => {
  if (!userId || !billNo) return [];
  try {
    const url = buildApiUrl(`/api/transactions/user/${userId}/bill/${billNo}`, branchId);
    const res = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
      return list.map(normalizeTransaction);
    }
  } catch (err) {
    console.warn("fetchTransactionsByBill failed, fallback to local:", err);
  }
  const all = getStoredTransactions(branchId);
  return all.filter((t) => Number(t.user_id) === Number(userId) && Number(t.bill_no) === Number(billNo));
};

/**
 * 29) Delete Transaction (soft delete, bill_status re-synced)
 * DELETE /api/transactions/:id?branch_id=1
 */
export const deleteTransactionApi = async (trId, branchId = 1) => {
  try {
    const url = buildApiUrl(`/api/transactions/${trId}`, branchId);
    const res = await fetch(url, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      deleteStoredTransaction(trId);
      return await res.json();
    }
  } catch (err) {
    console.warn("deleteTransactionApi failed, deleting locally:", err);
  }
  return deleteStoredTransaction(trId);
};

// ============================================================================
// 3. SYNCHRONOUS LOCALSTORAGE & CALCULATION HELPERS
// ============================================================================

export const getAllBills = (branchId = null) => {
  try {
    const raw = localStorage.getItem(PATIENT_BILLS_KEY);
    let list = [];
    if (!raw) {
      localStorage.setItem(PATIENT_BILLS_KEY, JSON.stringify(INITIAL_PATIENT_BILLS));
      list = INITIAL_PATIENT_BILLS;
    } else {
      list = JSON.parse(raw);
    }
    const normalized = list.map(normalizeBill);
    if (branchId !== null && branchId !== undefined && branchId !== "all" && branchId !== "") {
      return normalized.filter(
        (b) => b.branch_id === null || Number(b.branch_id) === Number(branchId)
      );
    }
    return normalized;
  } catch (err) {
    console.error("Error reading patient bills from storage:", err);
    return INITIAL_PATIENT_BILLS.map(normalizeBill);
  }
};

export const saveAllBills = (bills) => {
  try {
    localStorage.setItem(PATIENT_BILLS_KEY, JSON.stringify(bills));
  } catch (err) {
    console.error("Error saving patient bills to storage:", err);
  }
};

export const getBillByPatientId = (patientId) => {
  const bills = getAllBills();
  return bills.find((b) => Number(b.user_id) === Number(patientId) || Number(b.patient_id) === Number(patientId)) || null;
};

export const getStoredTransactions = (branchId = null) => {
  try {
    const raw = localStorage.getItem(BILL_TRANSACTIONS_KEY);
    let list = [];
    if (!raw) {
      localStorage.setItem(BILL_TRANSACTIONS_KEY, JSON.stringify(INITIAL_TRANSACTIONS));
      list = INITIAL_TRANSACTIONS;
    } else {
      list = JSON.parse(raw);
    }
    const normalized = list.map(normalizeTransaction);
    if (branchId !== null && branchId !== undefined && branchId !== "all" && branchId !== "") {
      return normalized.filter((t) => Number(t.branch_id) === Number(branchId));
    }
    return normalized;
  } catch {
    return INITIAL_TRANSACTIONS.map(normalizeTransaction);
  }
};

export const saveStoredTransactions = (list) => {
  try {
    localStorage.setItem(BILL_TRANSACTIONS_KEY, JSON.stringify(list));
  } catch (err) {
    console.error("Error saving transactions:", err);
  }
};

export const deleteStoredTransaction = (trId) => {
  const current = getStoredTransactions();
  const filtered = current.filter((t) => Number(t.id) !== Number(trId));
  saveStoredTransactions(filtered);
  return { success: true };
};

export const deletePatientBill = (billId) => {
  const bills = getAllBills();
  const filtered = bills.filter((b) => String(b.id) !== String(billId));
  saveAllBills(filtered);
  return true;
};

/**
 * Mathematical Calculation Helper matching the Backend & Handwritten Schema:
 * Per item: remaining_amount = original_amount - discount_amount
 * Bill gross: sum of items original_amount
 * Bill net: sum of items remaining_amount
 * Paid: total Cr transactions - De transactions
 * Remaining: net - paid
 */
export const calculateBillFinancials = (items = [], transactions = []) => {
  let grossAmount = 0;
  let totalDiscount = 0;

  items.forEach((it) => {
    const orig = Number(it.original_amount !== undefined ? it.original_amount : it.unit_rate || it.amount || 0);
    const disc = Number(it.discount_amount) || 0;
    const qty = Number(it.quantity) || 1;
    grossAmount += orig * qty;
    totalDiscount += disc;
  });

  const netAmount = Math.max(0, grossAmount - totalDiscount);

  let totalPaid = 0;
  transactions.forEach((t) => {
    if (t.tr_status === "completed") {
      if (t.type === "Cr") totalPaid += Number(t.amount) || 0;
      else if (t.type === "De") totalPaid -= Number(t.amount) || 0;
    }
  });

  totalPaid = Math.max(0, totalPaid);
  const remainingAmount = Math.max(0, netAmount - totalPaid);

  let status = "pending";
  if (remainingAmount === 0 && grossAmount > 0) {
    status = "full_paid";
  } else if (totalPaid > 0) {
    status = "partial_paid";
  }

  return {
    gross_amount: grossAmount,
    discount_amount: totalDiscount,
    net_amount: netAmount,
    paid_amount: totalPaid,
    remaining_amount: remainingAmount,
    status,
    bill_status: status,
  };
};

export const generateBillNumber = () => {
  const year = new Date().getFullYear().toString().slice(-2);
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `GKS/BILL/${year}/${randomSuffix}`;
};

export const savePatientBill = (billPayload) => {
  const bills = getAllBills();
  const existingIdx = bills.findIndex(
    (b) =>
      String(b.id) === String(billPayload.id) ||
      Number(b.user_id) === Number(billPayload.user_id || billPayload.patient_id)
  );

  const normalized = normalizeBill(billPayload);

  if (existingIdx >= 0) {
    bills[existingIdx] = {
      ...bills[existingIdx],
      ...normalized,
      updated_at: new Date().toISOString(),
    };
    saveAllBills(bills);
    return bills[existingIdx];
  } else {
    bills.unshift(normalized);
    saveAllBills(bills);
    return normalized;
  }
};
