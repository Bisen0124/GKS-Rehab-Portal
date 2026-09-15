import React, { Fragment, useState, useEffect, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Form,
  FormGroup,
  Label,
  Input,
  InputGroup,
  Button,
  Table,
  Badge,
} from "reactstrap";
import CommonModal from "../UiKits/Modals/common/modal";
import HeaderCard from "../Common/Component/HeaderCard";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import html2pdf from "html2pdf.js";
import { useReactToPrint } from "react-to-print";

// Custom Hooks & Contexts
import useCalculateAge from "../../CustomHook/useCalculateAge";
import PatientCommonInfo from "../../CustomHook/PatientCommonInfo";
import { useBranch } from "../../contexts/BranchContext";
import { useLang } from "../../contexts/LangContext";
import { getTranslation } from "../../utils/translator";

// Common UI Components & Utilities
import UserDetailsModal from "../Common/UserDetailsModal";
import TableExportButtons from "../Common/TableExportButtons";
import PatientViewHeader from "../Common/PatientViewHeader";
import { SaveDraftButton, DraftNoticeBanner } from "../Common/SaveDraftButton";
import { loadDraft, clearDraft } from "../../utils/formDraftManager";
import ModalActionButtons from "../Common/ModalActionButtons";
import { validateCompulsoryFields, showApiErrorAlert } from "../../utils/formValidationHelper";

const BASE_URL = "https://gks-yjdc.onrender.com";

const getTodayDate = () => new Date().toISOString().split("T")[0];

const commonTriggersList = [
  "Peer Pressure / दोस्तों का दबाव",
  "Evening hours / शाम का समय",
  "Stress & Anxiety / तनाव और चिंता",
  "Family Disputes / पारिवारिक झगड़े",
  "Boredom & Loneliness / अकेलापन या खाली समय",
  "Carrying Excess Cash / पास में ज्यादा पैसे होना",
  "Passing by Bar or Shop / ठेके के पास से गुजरना",
  "Sadness & Depression / उदासी और निराशा",
  "Physical Pain or Insomnia / शारीरिक दर्द या नींद न आना",
];

const getInitialFormData = () => ({
  date_of_intervention: getTodayDate(),
  session_type: "Initial Session",
  duration_minutes: "30",
  counselor_name: "",
  primary_substance: "",
  stage_of_change: "Contemplation",
  importance_score: "7",
  confidence_score: "6",
  perceived_benefits: "",
  negative_consequences: "",
  triggers: [],
  other_triggers: "",
  change_goal: "Complete Abstinence",
  supportive_person: "",
  coping_strategies: "",
  emergency_craving_plan: "",
  patient_receptivity: "Moderately Receptive",
  recommendations: "",
  next_session_date: "",
  remarks: "",
});

function BriefIntervation() {
  const { lang } = useLang();
  const { selectedBranch } = useBranch();
  const branchId =
    selectedBranch?.branch_id || selectedBranch?.id || selectedBranch || "";

  // ─── Modal States ─────────────────────────────────────────────────────────────
  const [modal, setModal] = useState(false);             // Create / Edit modal
  const [viewModal, setViewModal] = useState(false);     // View details modal
  const [viewUserDetailsModal, setViewUserDetailsModal] = useState(false);
  const [selectedViewUserId, setSelectedViewUserId] = useState(null);

  // ─── Loading & Edit States ───────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [stillLoading, setStillLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  // ─── Form Data & Drafts ───────────────────────────────────────────────────────
  const [formData, setFormData] = useState(getInitialFormData());
  const [draftTimestamp, setDraftTimestamp] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const dob = selectedUser?.dob;
  const patientCalAge = useCalculateAge(dob);

  // ─── Table 1: Registered Patients ─────────────────────────────────────────────
  const [patientList, setPatientList] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState("");

  // ─── Table 2: All Brief Intervention Entries ──────────────────────────────────
  const [biEntries, setBiEntries] = useState([]);
  const [filteredBiEntries, setFilteredBiEntries] = useState([]);
  const [biSearch, setBiSearch] = useState("");

  // ─── View Modal Data & PDF Ref ────────────────────────────────────────────────
  const [viewData, setViewData] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const pdfRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => pdfRef.current,
    documentTitle: `Brief_Intervention_${viewData?.patient_name || "Patient"}`,
  });

  const handleDownloadPDF = () => {
    const element = pdfRef.current;
    if (!element) return;
    setIsDownloading(true);
    const opt = {
      margin: [8, 8, 8, 8],
      filename: `Brief_Intervention_${viewData?.patient_name || "Report"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };
    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => setIsDownloading(false))
      .catch((err) => {
        console.error("PDF download error:", err);
        setIsDownloading(false);
      });
  };

  // ─── LocalStorage Persistence Keys (Per Branch) ──────────────────────────────
  const getStorageKey = () => `gks_brief_interventions_${branchId || "default"}`;

  const loadLocalEntries = () => {
    try {
      const data = localStorage.getItem(getStorageKey());
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const saveLocalEntries = (entries) => {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(entries));
    } catch (e) {
      console.error("Local storage save error:", e);
    }
  };

  // ─── Fetch Registered Patients ───────────────────────────────────────────────
  const fetchUsers = async () => {
    if (!branchId) return;
    setStillLoading(true);
    const token = localStorage.getItem("Authorization");
    try {
      const response = await fetch(`${BASE_URL}/api/users?branch_id=${branchId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      });
      const res = await response.json();
      if (response.ok && res.data) {
        setPatientList(res.data);
        setFilteredPatients(res.data);
      }
    } catch (err) {
      console.error("Error fetching users for BI:", err);
    } finally {
      setStillLoading(false);
    }
  };

  // ─── Fetch All Brief Intervention Entries ────────────────────────────────────
  const fetchAllBIEntries = async () => {
    const token = localStorage.getItem("Authorization");
    const local = loadLocalEntries();

    if (!branchId) {
      setBiEntries(local);
      setFilteredBiEntries(local);
      return;
    }

    try {
      const response = await fetch(
        `${BASE_URL}/api/brief-intervention/all-entries?branch_id=${branchId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        }
      );
      const res = await response.json();
      if (response.ok && res.data) {
        const combined = [...res.data];
        local.forEach((locItem) => {
          if (!combined.some((srv) => srv.bi_id === locItem.bi_id)) {
            combined.push(locItem);
          }
        });
        setBiEntries(combined);
        setFilteredBiEntries(combined);
        saveLocalEntries(combined);
      } else {
        setBiEntries(local);
        setFilteredBiEntries(local);
      }
    } catch (err) {
      console.warn("Using local storage cache for BI entries:", err);
      setBiEntries(local);
      setFilteredBiEntries(local);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchAllBIEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  // ─── Search Handlers ─────────────────────────────────────────────────────────
  const handlePatientSearchChange = (e) => {
    const val = e.target.value.toLowerCase();
    setPatientSearch(val);
    setFilteredPatients(
      patientList.filter(
        (p) =>
          p.name?.toLowerCase().includes(val) ||
          p.gks_id?.toLowerCase().includes(val) ||
          p.phone?.toLowerCase().includes(val)
      )
    );
  };

  const handleBiSearchChange = (e) => {
    const val = e.target.value.toLowerCase();
    setBiSearch(val);
    setFilteredBiEntries(
      biEntries.filter(
        (b) =>
          b.patient_name?.toLowerCase().includes(val) ||
          b.gks_id?.toLowerCase().includes(val) ||
          b.counselor_name?.toLowerCase().includes(val) ||
          b.primary_substance?.toLowerCase().includes(val) ||
          b.bi_id?.toString().includes(val)
      )
    );
  };

  // ─── Fetch Specific User Details for Form Header ─────────────────────────────
  const fetchUserCommonInfo = async (userId) => {
    const token = localStorage.getItem("Authorization");
    try {
      const response = await fetch(
        `${BASE_URL}/api/users/${userId}?branch_id=${branchId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        }
      );
      const result = await response.json();
      if (response.ok && result.data && result.data.length > 0) {
        setSelectedUser(result.data[0]);
      } else {
        const found = patientList.find((p) => p.user_id === userId || p.id === userId);
        if (found) setSelectedUser(found);
      }
    } catch {
      const found = patientList.find((p) => p.user_id === userId || p.id === userId);
      if (found) setSelectedUser(found);
    }
  };

  // ─── Create Form Handler ─────────────────────────────────────────────────────
  const createBIHandler = async (patient) => {
    const userId = patient?.user_id || patient?.id;
    setCurrentUserId(userId);
    setIsEditMode(false);
    setCurrentEditId(null);
    setFormData(getInitialFormData());

    const saved = loadDraft("brief_intervention", userId);
    if (saved && saved.data) {
      setFormData(saved.data);
      setDraftTimestamp(saved.savedAt);
    } else {
      setDraftTimestamp(null);
    }

    setSelectedUser(patient);
    setModal(true);
    await fetchUserCommonInfo(userId);
  };

  // ─── Edit Form Handler ───────────────────────────────────────────────────────
  const editBIHandler = async (record) => {
    setIsEditMode(true);
    setCurrentEditId(record.bi_id || record.id);
    setCurrentUserId(record.user_id);
    setFormData({
      date_of_intervention: record.date_of_intervention || getTodayDate(),
      session_type: record.session_type || "Initial Session",
      duration_minutes: record.duration_minutes || "30",
      counselor_name: record.counselor_name || "",
      primary_substance: record.primary_substance || "",
      stage_of_change: record.stage_of_change || "Contemplation",
      importance_score: record.importance_score?.toString() || "7",
      confidence_score: record.confidence_score?.toString() || "6",
      perceived_benefits: record.perceived_benefits || "",
      negative_consequences: record.negative_consequences || "",
      triggers: Array.isArray(record.triggers) ? record.triggers : [],
      other_triggers: record.other_triggers || "",
      change_goal: record.change_goal || "Complete Abstinence",
      supportive_person: record.supportive_person || "",
      coping_strategies: record.coping_strategies || "",
      emergency_craving_plan: record.emergency_craving_plan || "",
      patient_receptivity: record.patient_receptivity || "Moderately Receptive",
      recommendations: record.recommendations || "",
      next_session_date: record.next_session_date || "",
      remarks: record.remarks || "",
    });

    const userObj = patientList.find(
      (p) => p.user_id === record.user_id || p.id === record.user_id
    ) || {
      user_id: record.user_id,
      name: record.patient_name,
      gks_id: record.gks_id,
      phone: record.phone,
      gender: record.gender,
      dob: record.dob,
    };
    setSelectedUser(userObj);
    setModal(true);
  };

  // ─── View Form Handler ───────────────────────────────────────────────────────
  const viewBIHandler = (record) => {
    setViewData(record);
    setViewModal(true);
  };

  // ─── Delete Form Handler ─────────────────────────────────────────────────────
  const deleteBIHandler = async (record) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: getTranslation("Are you sure?/क्या आप सुनिश्चित हैं?", lang),
      text: getTranslation(
        "This will delete the Brief Intervention record for this patient./यह इस मरीज के लिए संक्षिप्त हस्तक्षेप रिकॉर्ड को हटा देगा।",
        lang
      ),
      showCancelButton: true,
      confirmButtonText: getTranslation("Yes, delete it/हाँ, हटाएँ", lang),
      cancelButtonText: getTranslation("Cancel/रद्द करें", lang),
      confirmButtonColor: "#d33",
    });

    if (!confirm.isConfirmed) return;

    const id = record.bi_id || record.id;
    const token = localStorage.getItem("Authorization");

    try {
      await fetch(
        `${BASE_URL}/api/brief-intervention/delete-assessment/${id}?branch_id=${branchId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        }
      );
    } catch {
      // ignore network errors for local cache fallback
    }

    const current = loadLocalEntries();
    const updated = current.filter((item) => (item.bi_id || item.id) !== id);
    saveLocalEntries(updated);
    setBiEntries(updated);
    setFilteredBiEntries(updated);

    Swal.fire({
      icon: "success",
      title: getTranslation("Deleted!/हटा दिया गया!", lang),
      text: getTranslation(
        "Brief Intervention record deleted successfully/संक्षिप्त हस्तक्षेप रिकॉर्ड सफलतापूर्वक हटा दिया गया",
        lang
      ),
      timer: 1600,
      showConfirmButton: false,
    });
  };

  // ─── Input Handlers ──────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTriggerToggle = (triggerText) => {
    setFormData((prev) => {
      const current = prev.triggers || [];
      const updated = current.includes(triggerText)
        ? current.filter((t) => t !== triggerText)
        : [...current, triggerText];
      return { ...prev, triggers: updated };
    });
  };

  // ─── Submit Form Handler ─────────────────────────────────────────────────────
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const compulsoryFieldDefinitions = [
      {
        label: getTranslation("Date of Intervention / हस्तक्षेप की तिथि", lang),
        value: formData.date_of_intervention,
      },
      {
        label: getTranslation("Session Type / सत्र का प्रकार", lang),
        value: formData.session_type,
      },
      {
        label: getTranslation("Primary Substance / मुख्य मादक पदार्थ", lang),
        value: formData.primary_substance,
      },
      {
        label: getTranslation("Stage of Change / बदलाव का चरण", lang),
        value: formData.stage_of_change,
      },
      {
        label: getTranslation("Counselor Name / काउंसलर का नाम", lang),
        value: formData.counselor_name,
      },
      {
        label: getTranslation("Change Goal / परिवर्तन का लक्ष्य", lang),
        value: formData.change_goal,
      },
    ];

    if (!validateCompulsoryFields(compulsoryFieldDefinitions, lang)) {
      return;
    }

    setIsLoading(true);

    const recordPayload = {
      bi_id: isEditMode && currentEditId ? currentEditId : `BI-${Date.now()}`,
      user_id: currentUserId,
      branch_id: branchId,
      patient_name: selectedUser?.name || "Patient",
      gks_id: selectedUser?.gks_id || "N/A",
      phone: selectedUser?.phone || "N/A",
      gender: selectedUser?.gender || "N/A",
      dob: selectedUser?.dob || null,
      ...formData,
      status: "Completed",
      updated_at: new Date().toISOString(),
      created_at: isEditMode ? undefined : new Date().toISOString(),
    };

    try {
      const token = localStorage.getItem("Authorization");
      const url = isEditMode
        ? `${BASE_URL}/api/brief-intervention/update-assessment/${currentEditId}?branch_id=${branchId}`
        : `${BASE_URL}/api/brief-intervention/create-assessment?branch_id=${branchId}`;

      const response = await fetch(url, {
        method: isEditMode ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify(recordPayload),
      });

      const res = await response.json().catch(() => null);
      if (response.ok && res && res.success) {
        console.log("Server accepted BI submission:", res);
      }
    } catch (err) {
      console.warn("Server unavailable, persisting locally:", err);
    }

    // Always update local persistent storage for rock-solid UX
    const currentList = loadLocalEntries();
    let updatedList;
    if (isEditMode) {
      updatedList = currentList.map((item) =>
        (item.bi_id || item.id) === currentEditId ? recordPayload : item
      );
    } else {
      updatedList = [recordPayload, ...currentList.filter((item) => item.bi_id !== recordPayload.bi_id)];
    }
    saveLocalEntries(updatedList);
    setBiEntries(updatedList);
    setFilteredBiEntries(updatedList);

    if (!isEditMode && currentUserId) {
      clearDraft("brief_intervention", currentUserId);
      setDraftTimestamp(null);
    }

    setIsLoading(false);
    setModal(false);

    Swal.fire({
      icon: "success",
      title: getTranslation("Success/सफलता", lang),
      text: isEditMode
        ? getTranslation(
            "Brief Intervention session updated successfully/संक्षिप्त हस्तक्षेप सत्र सफलतापूर्वक अद्यतन किया गया",
            lang
          )
        : getTranslation(
            "Brief Intervention session recorded successfully/संक्षिप्त हस्तक्षेप सत्र सफलतापूर्वक दर्ज किया गया",
            lang
          ),
      timer: 1800,
      showConfirmButton: false,
    });
  };

  const closeAllModal = () => {
    setModal(false);
    setSelectedUser(null);
    setCurrentUserId(null);
    setFormData(getInitialFormData());
  };

  // ─── Table 1 Columns (Registered Patient List) ────────────────────────────────
  const tablePatientColumns = [
    {
      name: getTranslation("GKS ID/GKS आईडी", lang),
      selector: (row) => row.gks_id || "N/A",
      sortable: true,
      center: true,
    },
    {
      name: getTranslation("Patient Name/रोगी का नाम", lang),
      selector: (row) => row.name,
      sortable: true,
      cell: (row) => (
        <span
          style={{ cursor: "pointer", fontWeight: 600, color: "#1e293b" }}
          onClick={() => {
            setSelectedViewUserId(row.user_id || row.id);
            setViewUserDetailsModal(true);
          }}
          title={getTranslation("Click to view patient details/रोगी विवरण देखने के लिए क्लिक करें", lang)}
        >
          {row.name}
        </span>
      ),
    },
    {
      name: getTranslation("Phone/फ़ोन", lang),
      selector: (row) => row.phone || "N/A",
      center: true,
    },
    {
      name: getTranslation("Status/स्थिति", lang),
      selector: (row) => row.status || "Registered",
      center: true,
      cell: (row) => (
        <Badge color="info" pill>
          {row.status || "Registered"}
        </Badge>
      ),
    },
    {
      name: getTranslation("Action/कार्रवाई", lang),
      center: true,
      cell: (row) => (
        <Button
          color="success"
          size="sm"
          className="d-flex align-items-center gap-1"
          onClick={() => createBIHandler(row)}
        >
          <i className="fa fa-plus-circle" />
          <span>{getTranslation("Create BI / BI बनाएँ", lang)}</span>
        </Button>
      ),
    },
  ];

  // ─── Table 2 Columns (All BI Entries) ─────────────────────────────────────────
  const tableBiColumns = [
    {
      name: getTranslation("GKS ID/GKS आईडी", lang),
      selector: (row) => row.gks_id || "N/A",
      sortable: true,
      center: true,
    },
    {
      name: getTranslation("Patient Name/रोगी का नाम", lang),
      selector: (row) => row.patient_name || row.name || "N/A",
      sortable: true,
    },
    {
      name: getTranslation("Date / तिथि", lang),
      selector: (row) => row.date_of_intervention,
      sortable: true,
      center: true,
    },
    {
      name: getTranslation("Session / सत्र", lang),
      selector: (row) => row.session_type,
      center: true,
    },
    {
      name: getTranslation("Substance / नशा", lang),
      selector: (row) => row.primary_substance || "N/A",
      center: true,
    },
    {
      name: getTranslation("Stage / चरण", lang),
      selector: (row) => row.stage_of_change || "N/A",
      center: true,
      cell: (row) => (
        <Badge color="warning" pill>
          {row.stage_of_change}
        </Badge>
      ),
    },
    {
      name: getTranslation("Counselor / काउंसलर", lang),
      selector: (row) => row.counselor_name || "N/A",
    },
    {
      name: getTranslation("Action/कार्रवाई", lang),
      center: true,
      cell: (row) => (
        <div className="d-flex align-items-center justify-content-center">
          {/* View */}
          <span
            onClick={() => viewBIHandler(row)}
            style={{ cursor: "pointer" }}
            title={getTranslation("View / देखना", lang)}
          >
            <svg
              style={{ color: "#d56337" }}
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="feather feather-eye"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </span>

          {/* Edit */}
          <span
            onClick={() => editBIHandler(row)}
            style={{ cursor: "pointer", marginLeft: "10px" }}
            title={getTranslation("Edit / संपादन", lang)}
          >
            <svg
              style={{ color: "green" }}
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="feather feather-edit"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </span>
        </div>
      ),
    },
  ];

  return (
    <Fragment>
      <Container fluid={true} className="datatables">
        <Row>
          <Col sm="12">
            <CardBody>
              {/* ── Table 1: Registered Patient List ───────────────────────────── */}
              <Card className="mb-4">
                <CardBody>
                  <div className="d-flex pb-2 justify-content-between">
                    <HeaderCard
                      title={getTranslation(
                        "Registered Patients for Brief Intervention / संक्षिप्त हस्तक्षेप हेतु पंजीकृत मरीज",
                        lang
                      )}
                      className="p-0"
                    />
                  </div>
                  <div className="row pb-3 align-items-center">
                    <div className="col-md-5 col-12 mb-2 mb-md-0">
                      <InputGroup>
                        <Input
                          className="form-control"
                          type="text"
                          placeholder={getTranslation("Search patient by name or ID... / खोजें...", lang)}
                          value={patientSearch}
                          onChange={handlePatientSearchChange}
                        />
                        <span className="input-group-text">
                          <i className="fa fa-search" />
                        </span>
                      </InputGroup>
                    </div>
                    <div className="col-md-7 col-12 d-flex justify-content-md-end justify-content-start">
                      <TableExportButtons
                        data={filteredPatients}
                        columns={tablePatientColumns}
                        filename="BI_Registered_Patients_List"
                        title={getTranslation("Registered Patients for Brief Intervention", lang)}
                      />
                    </div>
                  </div>

                  {stillLoading ? (
                    <div className="text-center py-4">
                      {getTranslation("Loading patients data... / डेटा लोड हो रहा है...", lang)}
                    </div>
                  ) : (
                    <DataTable
                      data={filteredPatients}
                      columns={tablePatientColumns}
                      striped
                      center
                      highlightOnHover
                      pagination
                      persistTableHead
                    />
                  )}
                </CardBody>
              </Card>

              {/* ── Table 2: All Brief Intervention Entries ─────────────────────── */}
              <Card>
                <CardBody>
                  <div className="d-flex pb-2 justify-content-between">
                    <HeaderCard
                      title={getTranslation(
                        "All Brief Intervention (BI) Records / सभी संक्षिप्त हस्तक्षेप रिकॉर्ड",
                        lang
                      )}
                      className="p-0"
                    />
                  </div>
                  <div className="row pb-3 align-items-center">
                    <div className="col-md-5 col-12 mb-2 mb-md-0">
                      <InputGroup>
                        <Input
                          className="form-control"
                          type="text"
                          placeholder={getTranslation("Search records by name, ID or substance... / खोजें...", lang)}
                          value={biSearch}
                          onChange={handleBiSearchChange}
                        />
                        <span className="input-group-text">
                          <i className="fa fa-search" />
                        </span>
                      </InputGroup>
                    </div>
                    <div className="col-md-7 col-12 d-flex justify-content-md-end justify-content-start">
                      <TableExportButtons
                        data={filteredBiEntries}
                        columns={tableBiColumns}
                        filename="All_Brief_Intervention_Records"
                        title={getTranslation("All Brief Intervention Records", lang)}
                      />
                    </div>
                  </div>

                  <DataTable
                    data={filteredBiEntries}
                    columns={tableBiColumns}
                    striped
                    center
                    highlightOnHover
                    pagination
                    persistTableHead
                    noDataComponent={
                      <div className="text-muted p-4">
                        {getTranslation("No Brief Intervention records found. / कोई रिकॉर्ड नहीं मिला।", lang)}
                      </div>
                    }
                  />
                </CardBody>
              </Card>
            </CardBody>
          </Col>
        </Row>
      </Container>

      {/* ── CREATE / EDIT MODAL ─────────────────────────────────────────────────── */}
      <CommonModal
        isOpen={modal}
        title={
          isEditMode
            ? getTranslation("Edit Brief Intervention / संक्षिप्त हस्तक्षेप संपादित करें", lang)
            : getTranslation("Create Brief Intervention / संक्षिप्त हस्तक्षेप प्रपत्र", lang)
        }
        toggler={closeAllModal}
        maxWidth="1200px"
      >
        <div className="cbt__wrapper px-2 py-3">
          {!isEditMode && (
            <DraftNoticeBanner
              draftTimestamp={draftTimestamp}
              formKey="brief_intervention"
              targetId={currentUserId}
              onDiscard={() => {
                setFormData(getInitialFormData());
                setDraftTimestamp(null);
              }}
            />
          )}

          <Form className="theme-form" noValidate onSubmit={handleFormSubmit}>
            <PatientCommonInfo
              selectedUser={selectedUser}
              labels={{
                name: getTranslation("Patient name / मरीज का नाम :", lang),
                sex: getTranslation("Gender / लिंग :", lang),
                age: getTranslation("Age / उम्र :", lang),
                date_of_admission: getTranslation("Date of Admission / भर्ती तिथि :", lang),
                ageValue: patientCalAge,
              }}
            />

            {/* Section 1: Session Metadata */}
            <div className="card border p-3 mb-3 bg-light">
              <h6 className="text-primary font-weight-bold mb-3">
                1. {getTranslation("Session Information / सत्र की जानकारी", lang)}
              </h6>
              <Row>
                <Col md="4">
                  <FormGroup>
                    <Label>{getTranslation("Date of Intervention / हस्तक्षेप की तिथि", lang)} *</Label>
                    <Input
                      type="date"
                      name="date_of_intervention"
                      value={formData.date_of_intervention}
                      onChange={handleInputChange}
                    />
                  </FormGroup>
                </Col>
                <Col md="4">
                  <FormGroup>
                    <Label>{getTranslation("Session Type / सत्र का प्रकार", lang)} *</Label>
                    <Input
                      type="select"
                      name="session_type"
                      value={formData.session_type}
                      onChange={handleInputChange}
                    >
                      <option value="Initial Session">{getTranslation("Initial Session / प्रारंभिक सत्र", lang)}</option>
                      <option value="Follow-up Session">{getTranslation("Follow-up Session / फॉलो-अप सत्र", lang)}</option>
                      <option value="Booster Session">{getTranslation("Booster Session / बूस्टर सत्र", lang)}</option>
                    </Input>
                  </FormGroup>
                </Col>
                <Col md="4">
                  <FormGroup>
                    <Label>{getTranslation("Duration (Minutes) / अवधि (मिनट)", lang)}</Label>
                    <Input
                      type="select"
                      name="duration_minutes"
                      value={formData.duration_minutes}
                      onChange={handleInputChange}
                    >
                      <option value="15">15 {getTranslation("Minutes / मिनट", lang)}</option>
                      <option value="30">30 {getTranslation("Minutes / मिनट", lang)}</option>
                      <option value="45">45 {getTranslation("Minutes / मिनट", lang)}</option>
                      <option value="60">60 {getTranslation("Minutes / मिनट", lang)}</option>
                    </Input>
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label>{getTranslation("Primary Substance Addressed / मुख्य मादक पदार्थ", lang)} *</Label>
                    <Input
                      type="select"
                      name="primary_substance"
                      value={formData.primary_substance}
                      onChange={handleInputChange}
                    >
                      <option value="">{getTranslation("Select Substance / नशा चुनें", lang)}</option>
                      <option value="Alcohol">Alcohol / शराब</option>
                      <option value="Opioids / Heroin / Smack">Opioids / हेरोइन / स्मैक / अफीम</option>
                      <option value="Cannabis / Ganja / Bhang">Cannabis / गांजा / भांग / चरस</option>
                      <option value="Sedatives / Sleeping Pills">Sedatives / नींद की गोलियां</option>
                      <option value="Polysubstance">Polysubstance / बहु-नशा</option>
                      <option value="Tobacco / Nicotine">Tobacco / तंबाकू / सिगरेट</option>
                      <option value="Other">Other / अन्य</option>
                    </Input>
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label>{getTranslation("Counselor / Doctor Name / काउंसलर का नाम", lang)} *</Label>
                    <Input
                      type="text"
                      name="counselor_name"
                      placeholder={getTranslation("Enter counselor name... / नाम दर्ज करें", lang)}
                      value={formData.counselor_name}
                      onChange={handleInputChange}
                    />
                  </FormGroup>
                </Col>
              </Row>
            </div>

            {/* Section 2: Readiness to Change & Motivation Ruler */}
            <div className="card border p-3 mb-3">
              <h6 className="text-primary font-weight-bold mb-3">
                2. {getTranslation("Readiness to Change & Motivation Ruler / बदलाव के लिए तत्परता", lang)}
              </h6>
              <Row>
                <Col md="12" className="mb-3">
                  <FormGroup>
                    <Label>{getTranslation("Current Stage of Change / वर्तमान मानसिक अवस्था", lang)} *</Label>
                    <Input
                      type="select"
                      name="stage_of_change"
                      value={formData.stage_of_change}
                      onChange={handleInputChange}
                    >
                      <option value="Pre-contemplation">
                        Pre-contemplation / अनभिज्ञता (Not ready to quit / अभी छोड़ना नहीं चाहते)
                      </option>
                      <option value="Contemplation">
                        Contemplation / विचार-विमर्श (Ambivalent / विचार कर रहे हैं पर दुविधा में हैं)
                      </option>
                      <option value="Preparation">
                        Preparation / तैयारी (Ready to change soon / बदलाव के लिए तैयार)
                      </option>
                      <option value="Action">
                        Action / सक्रिय प्रयास (Taking active steps / सक्रिय रूप से उपचार ले रहे हैं)
                      </option>
                      <option value="Maintenance">
                        Maintenance / निरंतरता (Sustaining recovery / पुनः नशे से बचाव में)
                      </option>
                    </Input>
                  </FormGroup>
                </Col>

                {/* Importance Ruler */}
                <Col md="6" className="mb-3">
                  <Label className="font-weight-bold">
                    {getTranslation("Importance Ruler (1 to 10) / नशा छोड़ना कितना महत्वपूर्ण है?", lang)}
                    <span className="badge bg-primary ms-2">{formData.importance_score} / 10</span>
                  </Label>
                  <p className="text-muted small mb-2">
                    1 = {getTranslation("Not important at all / बिल्कुल जरूरी नहीं", lang)} | 10 = {getTranslation("Most important priority / सर्वोच्च प्राथमिकता", lang)}
                  </p>
                  <Input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    name="importance_score"
                    value={formData.importance_score}
                    onChange={handleInputChange}
                    className="form-range"
                  />
                  <div className="d-flex justify-content-between text-muted small px-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <span key={n}>{n}</span>
                    ))}
                  </div>
                </Col>

                {/* Confidence Ruler */}
                <Col md="6" className="mb-3">
                  <Label className="font-weight-bold">
                    {getTranslation("Confidence Ruler (1 to 10) / नशा मुक्त रहने का आत्मविश्वास?", lang)}
                    <span className="badge bg-success ms-2">{formData.confidence_score} / 10</span>
                  </Label>
                  <p className="text-muted small mb-2">
                    1 = {getTranslation("No confidence / कोई भरोसा नहीं", lang)} | 10 = {getTranslation("Fully confident / पूरा आत्मविश्वास", lang)}
                  </p>
                  <Input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    name="confidence_score"
                    value={formData.confidence_score}
                    onChange={handleInputChange}
                    className="form-range"
                  />
                  <div className="d-flex justify-content-between text-muted small px-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <span key={n}>{n}</span>
                    ))}
                  </div>
                </Col>
              </Row>
            </div>

            {/* Section 3: Decisional Balance */}
            <div className="card border p-3 mb-3 bg-light">
              <h6 className="text-primary font-weight-bold mb-3">
                3. {getTranslation("Decisional Balance / निर्णय संतुलन (नफे और नुकसान)", lang)}
              </h6>
              <Row>
                <Col md="6">
                  <FormGroup>
                    <Label>{getTranslation("Perceived Benefits of Use (What patient likes about it) / नशे से क्या अच्छा लगता है?", lang)}</Label>
                    <Input
                      type="textarea"
                      rows="3"
                      name="perceived_benefits"
                      placeholder={getTranslation("e.g. Stress relief, sleep, socializing, forgetting worries... / उदा. तनावमुक्ति, नींद...", lang)}
                      value={formData.perceived_benefits}
                      onChange={handleInputChange}
                    />
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label>{getTranslation("Negative Consequences / Harms (Health, Family, Finance, Work) / नशे से क्या नुकसान हुए?", lang)}</Label>
                    <Input
                      type="textarea"
                      rows="3"
                      name="negative_consequences"
                      placeholder={getTranslation("e.g. Health decline, family disputes, debt, job loss... / उदा. स्वास्थ्य खराब, कर्ज, पारिवारिक झगड़े...", lang)}
                      value={formData.negative_consequences}
                      onChange={handleInputChange}
                    />
                  </FormGroup>
                </Col>
              </Row>
            </div>

            {/* Section 4: Triggers & High-Risk Situations */}
            <div className="card border p-3 mb-3">
              <h6 className="text-primary font-weight-bold mb-3">
                4. {getTranslation("Identified Triggers & High-Risk Situations / नशे की तलब भड़काने वाले कारण", lang)}
              </h6>
              <Row>
                {commonTriggersList.map((trig, idx) => (
                  <Col md="4" sm="6" key={idx} className="mb-2">
                    <div className="form-check">
                      <Input
                        type="checkbox"
                        className="form-check-input"
                        id={`trigger_${idx}`}
                        checked={formData.triggers?.includes(trig)}
                        onChange={() => handleTriggerToggle(trig)}
                      />
                      <Label className="form-check-label small" htmlFor={`trigger_${idx}`}>
                        {trig}
                      </Label>
                    </div>
                  </Col>
                ))}
                <Col md="12" className="mt-2">
                  <FormGroup>
                    <Label>{getTranslation("Other Specific Triggers / अन्य कोई विशेष कारण", lang)}</Label>
                    <Input
                      type="text"
                      name="other_triggers"
                      placeholder={getTranslation("Any other person, place, or emotional state... / कोई अन्य कारण...", lang)}
                      value={formData.other_triggers}
                      onChange={handleInputChange}
                    />
                  </FormGroup>
                </Col>
              </Row>
            </div>

            {/* Section 5: Agreed Action Plan & Coping Strategies */}
            <div className="card border p-3 mb-3 bg-light">
              <h6 className="text-primary font-weight-bold mb-3">
                5. {getTranslation("Agreed Change Plan & Coping Strategies / कार्य योजना और मुकाबला रणनीति", lang)}
              </h6>
              <Row>
                <Col md="6">
                  <FormGroup>
                    <Label>{getTranslation("Agreed Immediate Goal / तत्काल तय किया गया लक्ष्य", lang)} *</Label>
                    <Input
                      type="select"
                      name="change_goal"
                      value={formData.change_goal}
                      onChange={handleInputChange}
                    >
                      <option value="Complete Abstinence">Complete Abstinence / पूर्ण नशामुक्ति</option>
                      <option value="Medical Detoxification">Medical Detoxification / अस्पताल में डिटॉक्स</option>
                      <option value="Long-term Rehabilitation Stay">Long-term Rehabilitation Stay / दीर्घकालिक पुनर्वास केंद्र में रहना</option>
                      <option value="Harm Reduction / Cutting Down">Harm Reduction / मात्रा में कमी</option>
                    </Input>
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label>{getTranslation("Supportive Family Member or Friend / मददगार परिजन या मित्र का नाम", lang)}</Label>
                    <Input
                      type="text"
                      name="supportive_person"
                      placeholder={getTranslation("e.g. Father, Wife, Brother, Friend / नाम व रिश्ता...", lang)}
                      value={formData.supportive_person}
                      onChange={handleInputChange}
                    />
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label>{getTranslation("Healthy Alternative Activities / स्वस्थ वैकल्पिक गतिविधियाँ", lang)}</Label>
                    <Input
                      type="textarea"
                      rows="2"
                      name="coping_strategies"
                      placeholder={getTranslation("e.g. Morning walk, yoga, prayer, spending time with children / योग, टहलना...", lang)}
                      value={formData.coping_strategies}
                      onChange={handleInputChange}
                    />
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label>{getTranslation("Emergency Craving Plan (What to do when urge strikes) / तेज तलब लगने पर क्या करेंगे?", lang)}</Label>
                    <Input
                      type="textarea"
                      rows="2"
                      name="emergency_craving_plan"
                      placeholder={getTranslation("e.g. 5-min deep breathing, drink cold water, call counselor, leave the spot... / गहरी सांस लें, पानी पिएं...", lang)}
                      value={formData.emergency_craving_plan}
                      onChange={handleInputChange}
                    />
                  </FormGroup>
                </Col>
              </Row>
            </div>

            {/* Section 6: Clinical Receptivity & Recommendations */}
            <div className="card border p-3 mb-4">
              <h6 className="text-primary font-weight-bold mb-3">
                6. {getTranslation("Counselor Assessment & Next Steps / काउंसलर मूल्यांकन और अगला कदम", lang)}
              </h6>
              <Row>
                <Col md="4">
                  <FormGroup>
                    <Label>{getTranslation("Patient Receptivity / मरीज की प्रतिक्रिया", lang)}</Label>
                    <Input
                      type="select"
                      name="patient_receptivity"
                      value={formData.patient_receptivity}
                      onChange={handleInputChange}
                    >
                      <option value="Highly Receptive">Highly Receptive / अत्यधिक उत्तरदायी व सहमत</option>
                      <option value="Moderately Receptive">Moderately Receptive / मध्यम उत्तरदायी</option>
                      <option value="Ambivalent">Ambivalent / दुविधाग्रस्त</option>
                      <option value="Resistant">Resistant / असहमत या अनिच्छुक</option>
                    </Input>
                  </FormGroup>
                </Col>
                <Col md="4">
                  <FormGroup>
                    <Label>{getTranslation("Next Session / Review Date / अगले सत्र की तिथि", lang)}</Label>
                    <Input
                      type="date"
                      name="next_session_date"
                      value={formData.next_session_date}
                      onChange={handleInputChange}
                    />
                  </FormGroup>
                </Col>
                <Col md="4">
                  <FormGroup>
                    <Label>{getTranslation("Referral Recommendation / अगला सुझाव", lang)}</Label>
                    <Input
                      type="text"
                      name="recommendations"
                      placeholder={getTranslation("e.g. Refer to Detox, CBT, Family Session... / परामर्श...", lang)}
                      value={formData.recommendations}
                      onChange={handleInputChange}
                    />
                  </FormGroup>
                </Col>
                <Col md="12">
                  <FormGroup>
                    <Label>{getTranslation("Counselor Remarks / Notes / काउंसलर की सामान्य टिप्पणी", lang)}</Label>
                    <Input
                      type="textarea"
                      rows="2"
                      name="remarks"
                      placeholder={getTranslation("Additional notes or observations... / अतिरिक्त विवरण...", lang)}
                      value={formData.remarks}
                      onChange={handleInputChange}
                    />
                  </FormGroup>
                </Col>
              </Row>
            </div>

            {/* Footer Buttons */}
            <div className="d-flex align-items-center gap-3 mt-4 mb-3 px-2 flex-wrap">
              {!isEditMode && (
                <SaveDraftButton
                  formKey="brief_intervention"
                  targetId={currentUserId}
                  formData={formData}
                  onSaved={(ts) => setDraftTimestamp(ts)}
                />
              )}
              <Button color="primary" type="submit" disabled={isLoading} className="px-4">
                {isLoading ? (
                  <span>
                    <i className="fa fa-spin fa-spinner me-2" />
                    {getTranslation("Saving... / सहेजा जा रहा है...", lang)}
                  </span>
                ) : (
                  <span>{getTranslation("Submit Brief Intervention / फॉर्म सबमिट करें", lang)}</span>
                )}
              </Button>
              <Button color="secondary" type="button" onClick={closeAllModal}>
                {getTranslation("Cancel / रद्द करें", lang)}
              </Button>
            </div>
          </Form>
        </div>
      </CommonModal>

      {/* ── READ-ONLY VIEW MODAL WITH PRINT & PDF ─────────────────────────────────── */}
      <CommonModal
        isOpen={viewModal}
        title={getTranslation("Brief Intervention Report / संक्षिप्त हस्तक्षेप रिपोर्ट", lang)}
        toggler={() => setViewModal(false)}
        maxWidth="1100px"
      >
        <div className="p-3 p-md-4 print-area" ref={pdfRef} style={{ background: "#f8fafc" }}>
          {viewData && (
            <div>
              {/* Patient Header Banner */}
              <PatientViewHeader
                data={{
                  name: viewData.patient_name || viewData.name || "Patient",
                  gks_id: viewData.gks_id || "N/A",
                  phone: viewData.phone || "",
                  gender: viewData.gender || "",
                  date: viewData.date_of_intervention || "",
                  date_of_assessment: viewData.date_of_intervention || "",
                }}
              />

              {/* Card 1: Session Information */}
              <div
                className="card shadow-sm border-0 mb-4"
                style={{
                  borderRadius: "14px",
                  overflow: "hidden",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  className="card-header bg-white py-3 px-4 border-bottom d-flex align-items-center justify-content-between"
                  style={{
                    borderLeft: "5px solid #d56337",
                  }}
                >
                  <h6 className="fw-bold text-dark mb-0" style={{ fontSize: "15px" }}>
                    📋 {getTranslation("Session Information / सत्र की जानकारी", lang)}
                  </h6>
                </div>
                <div className="card-body p-3 p-md-4">
                  <div className="row g-3">
                    <div className="col-12 col-sm-6 col-lg-3">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                          {getTranslation("Date of Intervention / हस्तक्षेप तिथि", lang)}
                        </div>
                        <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                          📅 {viewData.date_of_intervention || "-"}
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-sm-6 col-lg-3">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                          {getTranslation("Session Type / सत्र प्रकार", lang)}
                        </div>
                        <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                          ⏱️ {viewData.session_type || "-"}
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-sm-6 col-lg-3">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                          {getTranslation("Duration / अवधि", lang)}
                        </div>
                        <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                          ⏳ {viewData.duration_minutes ? `${viewData.duration_minutes} mins` : "-"}
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-sm-6 col-lg-3">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                          {getTranslation("Primary Substance / मुख्य नशा", lang)}
                        </div>
                        <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                          {viewData.primary_substance || "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Readiness & Motivation (SBIRT Ruler) */}
              <div
                className="card shadow-sm border-0 mb-4"
                style={{
                  borderRadius: "14px",
                  overflow: "hidden",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  className="card-header bg-white py-3 px-4 border-bottom d-flex align-items-center justify-content-between"
                  style={{
                    borderLeft: "5px solid #d56337",
                  }}
                >
                  <h6 className="fw-bold text-dark mb-0" style={{ fontSize: "15px" }}>
                    🎯 {getTranslation("Readiness & Motivation (SBIRT Ruler) / तत्परता एवं प्रेरणा मूल्यांकन", lang)}
                  </h6>
                </div>
                <div className="card-body p-3 p-md-4">
                  <div className="row g-3">
                    <div className="col-12 col-md-4">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                          {getTranslation("Stage of Change / बदलाव का चरण", lang)}
                        </div>
                        <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                          {viewData.stage_of_change || "-"}
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-md-4">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                          {getTranslation("Importance Ruler (1-10) / नशा छोड़ने की आवश्यकता", lang)}
                        </div>
                        <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                          {viewData.importance_score ? `${viewData.importance_score} / 10` : "-"}
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-md-4">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                          {getTranslation("Confidence Ruler (1-10) / आत्मविश्वास स्कोर", lang)}
                        </div>
                        <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                          {viewData.confidence_score ? `${viewData.confidence_score} / 10` : "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Decisional Balance */}
              <div
                className="card shadow-sm border-0 mb-4"
                style={{
                  borderRadius: "14px",
                  overflow: "hidden",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  className="card-header bg-white py-3 px-4 border-bottom d-flex align-items-center justify-content-between"
                  style={{
                    borderLeft: "5px solid #d56337",
                  }}
                >
                  <h6 className="fw-bold text-dark mb-0" style={{ fontSize: "15px" }}>
                    ⚖️ {getTranslation("Decisional Balance / निर्णय संतुलन (लाभ बनाम नुकसान)", lang)}
                  </h6>
                </div>
                <div className="card-body p-3 p-md-4">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                          {getTranslation("Perceived Benefits / कथित लाभ", lang)}
                        </div>
                        <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                          {viewData.perceived_benefits || getTranslation("None reported / कोई दर्ज नहीं", lang)}
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                          {getTranslation("Negative Consequences / नुकसान व दुष्प्रभाव", lang)}
                        </div>
                        <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                          {viewData.negative_consequences || getTranslation("None reported / कोई दर्ज नहीं", lang)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: Identified Triggers */}
              <div
                className="card shadow-sm border-0 mb-4"
                style={{
                  borderRadius: "14px",
                  overflow: "hidden",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  className="card-header bg-white py-3 px-4 border-bottom d-flex align-items-center justify-content-between"
                  style={{
                    borderLeft: "5px solid #d56337",
                  }}
                >
                  <h6 className="fw-bold text-dark mb-0" style={{ fontSize: "15px" }}>
                    ⚡ {getTranslation("Identified Triggers / पहचान किए गए उत्प्रेरक (ट्रिगर्स)", lang)}
                  </h6>
                </div>
                <div className="card-body p-3 p-md-4">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                          {getTranslation("Standard Triggers / सामान्य ट्रिगर्स", lang)}
                        </div>
                        <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                          {Array.isArray(viewData.triggers) && viewData.triggers.length > 0
                            ? viewData.triggers.join(", ")
                            : getTranslation("None / कोई नहीं", lang)}
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                          {getTranslation("Other Triggers / अन्य ट्रिगर्स", lang)}
                        </div>
                        <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                          {viewData.other_triggers || "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 5: Agreed Action Plan & Harm Reduction */}
              <div
                className="card shadow-sm border-0 mb-4"
                style={{
                  borderRadius: "14px",
                  overflow: "hidden",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  className="card-header bg-white py-3 px-4 border-bottom d-flex align-items-center justify-content-between"
                  style={{
                    borderLeft: "5px solid #d56337",
                  }}
                >
                  <h6 className="fw-bold text-dark mb-0" style={{ fontSize: "15px" }}>
                    📝 {getTranslation("Agreed Action Plan & Harm Reduction / सहमत कार्य योजना", lang)}
                  </h6>
                </div>
                <div className="card-body p-3 p-md-4">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                          {getTranslation("Agreed Immediate Goal / तय लक्ष्य", lang)}
                        </div>
                        <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                          {viewData.change_goal || "-"}
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                          {getTranslation("Support Person / मददगार परिजन", lang)}
                        </div>
                        <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                          {viewData.supportive_person || "-"}
                        </div>
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                          {getTranslation("Coping Strategies / वैकल्पिक मुकाबला गतिविधियाँ", lang)}
                        </div>
                        <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                          {viewData.coping_strategies || "-"}
                        </div>
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                          {getTranslation("Emergency Craving Management Plan / आपातकालीन तलब प्रबंधन योजना", lang)}
                        </div>
                        <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                          {viewData.emergency_craving_plan || "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 6: Clinical Evaluation & Recommendations */}
              <div
                className="card shadow-sm border-0 mb-4"
                style={{
                  borderRadius: "14px",
                  overflow: "hidden",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  className="card-header bg-white py-3 px-4 border-bottom d-flex align-items-center justify-content-between"
                  style={{
                    borderLeft: "5px solid #d56337",
                  }}
                >
                  <h6 className="fw-bold text-dark mb-0" style={{ fontSize: "15px" }}>
                    🩺 {getTranslation("Clinical Evaluation & Recommendations / काउंसलर मूल्यांकन एवं सुझाव", lang)}
                  </h6>
                </div>
                <div className="card-body p-3 p-md-4">
                  <div className="row g-3">
                    <div className="col-12 col-sm-6 col-lg-4">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                          {getTranslation("Patient Receptivity / मरीज की प्रतिक्रिया", lang)}
                        </div>
                        <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                          {viewData.patient_receptivity || "-"}
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-sm-6 col-lg-4">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                          {getTranslation("Counselor / Doctor Name / काउंसलर", lang)}
                        </div>
                        <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                          👨‍⚕️ {viewData.counselor_name || "-"}
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-sm-6 col-lg-4">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                          {getTranslation("Next Session Date / अगले सत्र की तिथि", lang)}
                        </div>
                        <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                          📅 {viewData.next_session_date || "-"}
                        </div>
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                          {getTranslation("Recommendations / सुझाव", lang)}
                        </div>
                        <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                          {viewData.recommendations || "-"}
                        </div>
                      </div>
                    </div>

                    {viewData.remarks && (
                      <div className="col-12">
                        <div className="p-2 px-3 rounded-3 bg-light border">
                          <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                            {getTranslation("Remarks / टिप्पणी", lang)}
                          </div>
                          <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                            {viewData.remarks}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <ModalActionButtons
          onClose={() => setViewModal(false)}
          onPrint={handlePrint}
          onDownload={handleDownloadPDF}
          isDownloading={isDownloading}
          downloadText={getTranslation("Download Report / रिपोर्ट डाउनलोड करें", lang)}
        />
      </CommonModal>

      {/* ── USER DETAILS MODAL ─────────────────────────────────────────────────── */}
      <UserDetailsModal
        isOpen={viewUserDetailsModal}
        toggle={() => setViewUserDetailsModal(false)}
        userId={selectedViewUserId}
      />
    </Fragment>
  );
}

export default BriefIntervation;
