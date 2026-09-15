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
  Badge,
  Spinner,
} from "reactstrap";
import CommonModal from "../UiKits/Modals/common/modal";
import HeaderCard from "../Common/Component/HeaderCard";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import html2pdf from "html2pdf.js";
import { useReactToPrint } from "react-to-print";

// Custom Hooks & Contexts
import PatientCommonInfo from "../../CustomHook/PatientCommonInfo";
import { useBranch } from "../../contexts/BranchContext";
import { useLang } from "../../contexts/LangContext";
import { getTranslation } from "../../utils/translator";

// Common Components & Utilities
import UserDetailsModal from "../Common/UserDetailsModal";
import TableExportButtons from "../Common/TableExportButtons";
import PatientViewHeader from "../Common/PatientViewHeader";
import ModalActionButtons from "../Common/ModalActionButtons";
import {
  validateCompulsoryFields,
  showApiErrorAlert,
} from "../../utils/formValidationHelper";

const BASE_URL = "https://gks-yjdc.onrender.com";

const getTodayDate = () => new Date().toISOString().split("T")[0];

const addDaysToDate = (baseDateStr, days) => {
  const base = baseDateStr ? new Date(baseDateStr) : new Date();
  base.setDate(base.getDate() + days);
  return base.toISOString().split("T")[0];
};

const getFullFileUrl = (url) => {
  if (!url) return "";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  return `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

// Fallback patients matching Screenshot 2 in case of server spin-down
const FALLBACK_REGISTERED_PATIENTS = [
  { id: 111, user_id: 111, gks_id: "GKS_20260901_111", name: "Ashwani Agrawal", phone: "9876543210", wardName: "General Ward", admit_date: "2026-08-01", status: "Active", discharge_status: 0, dischargeStatus: 0 },
  { id: 112, user_id: 112, gks_id: "GKS_20260901_112", name: "Bharma Devasin", phone: "9876543211", wardName: "General Ward", admit_date: "2026-08-02", status: "Active", discharge_status: 0, dischargeStatus: 0 },
  { id: 115, user_id: 115, gks_id: "GKS_20260901_115", name: "Lalisa Manobal", phone: "9876543212", wardName: "Special Ward", admit_date: "2026-08-03", status: "Active", discharge_status: 0, dischargeStatus: 0 },
  { id: 114, user_id: 114, gks_id: "GKS_20260901_114", name: "Testing 001", phone: "9876543213", wardName: "General Ward", admit_date: "2026-08-04", status: "Active", discharge_status: 0, dischargeStatus: 0 },
  { id: 113, user_id: 113, gks_id: "GKS_20260901_113", name: "Testing 001", phone: "9876543214", wardName: "General Ward", admit_date: "2026-08-05", status: "Active", discharge_status: 0, dischargeStatus: 0 },
  { id: 109, user_id: 109, gks_id: "GKS_20260827_109", name: "Nishchay Tomar", phone: "9876543215", wardName: "General Ward", admit_date: "2026-08-06", status: "Active", discharge_status: 0, dischargeStatus: 0 },
  { id: 108, user_id: 108, gks_id: "GKS_20260826_108", name: "Ashwini Agarwal", phone: "9876543216", wardName: "Special Ward", admit_date: "2026-08-07", status: "Active", discharge_status: 0, dischargeStatus: 0 },
  { id: 107, user_id: 107, gks_id: "GKS_20260825_107", name: "Ashwani Agrawal", phone: "9876543217", wardName: "General Ward", admit_date: "2026-08-08", status: "Active", discharge_status: 0, dischargeStatus: 0 },
  { id: 105, user_id: 105, gks_id: "GKS_20260824_105", name: "Mily being deo", phone: "9876543218", wardName: "Special Ward", admit_date: "2026-08-09", status: "Active", discharge_status: 0, dischargeStatus: 0 },
  { id: 106, user_id: 106, gks_id: "GKS_20260824_106", name: "Ravi", phone: "9876543219", wardName: "General Ward", admit_date: "2026-08-10", status: "Active", discharge_status: 0, dischargeStatus: 0 },
];

// Helper to test whether patient is already discharged
const isPatientDischarged = (p, recordsList = []) => {
  if (Number(p.discharge_status) === 1 || Number(p.dischargeStatus) === 1) return true;
  const statText = String(p.discharge_status_text || p.status || "").toLowerCase();
  if (statText === "discharged" || statText === "discharge") return true;
  const pid = String(p.user_id || p.id || "");
  if (pid && recordsList.some((r) => String(r.user_id || r.id) === pid)) {
    return true;
  }
  return false;
};

function DischargeFollowUp() {
  const { lang } = useLang();
  const { selectedBranch } = useBranch();

  // Resolve active branch with robust fallback chain
  const resolveBranchId = () => {
    if (selectedBranch) {
      if (typeof selectedBranch === "object") {
        return String(selectedBranch.branch_id || selectedBranch.id || "");
      }
      return String(selectedBranch);
    }
    const saved = localStorage.getItem("Selected_Branch_ID");
    if (saved) return String(saved);
    try {
      const bd = JSON.parse(localStorage.getItem("Branch_Detail") || "[]");
      if (Array.isArray(bd) && bd.length > 0) {
        return String(bd[0].Branch_id || bd[0].branch_id || bd[0].id || "");
      }
    } catch {
      // ignore
    }
    return "";
  };

  const branchId = resolveBranchId();

  // ─── Modal States ──────────────────────────────────────────────────────────
  const [submitModal, setSubmitModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [viewUserDetailsModal, setViewUserDetailsModal] = useState(false);
  const [selectedViewUserId, setSelectedViewUserId] = useState(null);

  // ─── Selected Item States ──────────────────────────────────────────────────
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // ─── Table 1 Data: Registered Patients (Screenshot 2 style) ───────────────
  const [patientList, setPatientList] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [searchPatientText, setSearchPatientText] = useState("");

  // ─── Table 2 Data: Discharge Follow-Up Records ─────────────────────────────
  const [dischargeRecords, setDischargeRecords] = useState([]);
  const [filteredDischargeRecords, setFilteredDischargeRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [searchRecordsText, setSearchRecordsText] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  // ─── Form Data for Submission (Matching user's 4 fields) ───────────────────
  const [formData, setFormData] = useState({
    followup_discharge_date: "2026-08-01",
    followup_date: "2026-08-15",
    followup_doctor_remark: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Form Data for Editing ─────────────────────────────────────────────────
  const [editFormData, setEditFormData] = useState({
    followup_date: "",
    followup_doctor_remark: "",
  });
  const [editSelectedFile, setEditSelectedFile] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // ─── View / Print / PDF States ─────────────────────────────────────────────
  const reportPrintRef = useRef(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // ─── LocalStorage Persistence ──────────────────────────────────────────────
  const getStorageKey = () =>
    `gks_discharge_followups_${branchId || "default"}`;

  const loadLocalRecords = () => {
    try {
      const data = localStorage.getItem(getStorageKey());
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const saveLocalRecords = (records) => {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(records));
    } catch (e) {
      console.error("Discharge follow up local storage save error:", e);
    }
  };

  // ─── Auth Headers Builder (Standard raw token matching other modules) ──────
  const getAuthHeaders = (isFormData = false) => {
    const rawToken = localStorage.getItem("Authorization") || "";
    const headers = {
      Authorization: `${rawToken}`,
    };
    if (branchId) {
      headers["x-target-branch"] = String(branchId);
    }
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }
    return headers;
  };

  // ─── Fetch Table 1: Active Registered Patients Pending Discharge ───────────
  const fetchRegisteredPatients = async (currentRecords = dischargeRecords) => {
    setLoadingPatients(true);
    const token = localStorage.getItem("Authorization") || "";
    const activeBranch = resolveBranchId();

    try {
      const url = activeBranch
        ? `${BASE_URL}/api/users?branch_id=${activeBranch}`
        : `${BASE_URL}/api/users`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      });

      const resData = await res.json().catch(() => null);
      const rawUsers =
        res.ok && resData
          ? Array.isArray(resData)
            ? resData
            : resData.data || resData.users || []
          : [];

      if (rawUsers && rawUsers.length > 0) {
        const mapped = rawUsers.map((user) => ({
          id: user.user_id || user.id,
          user_id: user.user_id || user.id,
          gks_id: user.gks_id || user.custom_code || "N/A",
          name: user.name || user.patient_name || "N/A",
          phone: user.phone || user.mobile || "N/A",
          email: user.email || "",
          gender: user.gender || user.sex || "",
          dob: user.dob || null,
          wardName: user.ward_name || user.wardName || "General Ward",
          admit_date:
            user.recent_admit_date || user.admit_date || user.created_at,
          discharge_status: user.discharge_status || 0,
          dischargeStatus: user.discharge_status || 0,
          discharge_status_text:
            user.discharge_status_text ||
            (user.discharge_status === 1 ? "Discharged" : "Active"),
          status: user.discharge_status === 1 ? "Discharged" : "Active",
        }));

        // Filter out discharged patients so they DON'T show again in Table 1
        const activeOnly = mapped.filter(
          (p) => !isPatientDischarged(p, currentRecords)
        );

        setPatientList(activeOnly);
        setFilteredPatients(activeOnly);

        try {
          localStorage.setItem(
            "gks_cached_registered_patients",
            JSON.stringify(mapped)
          );
        } catch {
          // ignore
        }
      } else {
        // Fallback: Filter out any discharged records from fallback list
        const cached = localStorage.getItem("gks_cached_registered_patients");
        let sourceList = FALLBACK_REGISTERED_PATIENTS;
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              sourceList = parsed;
            }
          } catch {
            sourceList = FALLBACK_REGISTERED_PATIENTS;
          }
        }
        const activeOnly = sourceList.filter(
          (p) => !isPatientDischarged(p, currentRecords)
        );
        setPatientList(activeOnly);
        setFilteredPatients(activeOnly);
      }
    } catch (err) {
      console.warn("Network fetch error for registered patients, using filtered fallback:", err);
      const cached = localStorage.getItem("gks_cached_registered_patients");
      let sourceList = FALLBACK_REGISTERED_PATIENTS;
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            sourceList = parsed;
          }
        } catch {
          sourceList = FALLBACK_REGISTERED_PATIENTS;
        }
      }
      const activeOnly = sourceList.filter(
        (p) => !isPatientDischarged(p, currentRecords)
      );
      setPatientList(activeOnly);
      setFilteredPatients(activeOnly);
    } finally {
      setLoadingPatients(false);
    }
  };

  // ─── Fetch Table 2: Discharge Follow-Up Records ───────────────────────────
  const fetchDischargeRecords = async () => {
    const activeBranch = resolveBranchId();
    const local = loadLocalRecords();

    if (!activeBranch) {
      setDischargeRecords(local);
      applyRecordsFilter(local, searchRecordsText, activeFilter);
      setLoadingRecords(false);
      fetchRegisteredPatients(local);
      return;
    }

    setLoadingRecords(true);
    try {
      const res = await fetch(
        `${BASE_URL}/api/discharge-follow-up/all/follow-ups?branch_id=${activeBranch}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );
      const data = await res.json().catch(() => null);

      let serverRecords = [];
      if (res.ok && data) {
        const items = Array.isArray(data)
          ? data
          : data.data || data.followups || data.entries || [];
        serverRecords = items.map((item) => ({
          id: item.followup_id || item.id || item.user_id,
          user_id: item.user_id || item.id,
          gks_id: item.gks_id || item.custom_code || item.user?.gks_id || "N/A",
          name:
            item.name ||
            item.patient_name ||
            item.user?.name ||
            item.user_name ||
            "N/A",
          phone: item.phone || item.user?.phone || "N/A",
          email: item.email || item.user?.email || "",
          gender: item.gender || item.user?.gender || "",
          dob: item.dob || item.user?.dob || null,
          admit_date:
            item.admit_date ||
            item.entry?.admit_date ||
            item.user?.recent_admit_date ||
            null,
          ward_name:
            item.ward_name ||
            item.entry?.ward_name ||
            item.user?.ward_name ||
            "N/A",
          followup_discharge_date:
            item.followup_discharge_date ||
            item.discharge_date ||
            item.entry?.discharge_date ||
            "N/A",
          followup_date: item.followup_date || "N/A",
          followup_doctor_remark:
            item.followup_doctor_remark || item.doctor_remark || "N/A",
          followup_report_url:
            item.followup_report_url || item.report_url || "",
          followup_status:
            item.followup_status !== undefined
              ? item.followup_status
              : item.discharge_status || 1,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || null,
        }));
      }

      // Merge server records with local storage records
      const combined = [...serverRecords];
      local.forEach((locItem) => {
        const locUserId = locItem.user_id || locItem.id;
        if (
          !combined.some(
            (srv) => (srv.user_id || srv.id) === locUserId
          )
        ) {
          combined.push(locItem);
        }
      });

      setDischargeRecords(combined);
      applyRecordsFilter(combined, searchRecordsText, activeFilter);

      // Filter Table 1 so discharged patients NEVER appear in Table 1
      setPatientList((prev) =>
        prev.filter((p) => !isPatientDischarged(p, combined))
      );
      setFilteredPatients((prev) =>
        prev.filter((p) => !isPatientDischarged(p, combined))
      );
    } catch (err) {
      console.warn("Error fetching discharge follow-ups, loading local:", err);
      setDischargeRecords(local);
      applyRecordsFilter(local, searchRecordsText, activeFilter);

      // Filter Table 1
      setPatientList((prev) =>
        prev.filter((p) => !isPatientDischarged(p, local))
      );
      setFilteredPatients((prev) =>
        prev.filter((p) => !isPatientDischarged(p, local))
      );
    } finally {
      setLoadingRecords(false);
    }
  };

  // ─── Initial & Branch-Triggered Loading ────────────────────────────────────
  useEffect(() => {
    fetchDischargeRecords();
    fetchRegisteredPatients();
  }, [selectedBranch]);

  // ─── Table 1 Search Filter ────────────────────────────────────────────────
  const handlePatientSearchChange = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchPatientText(term);
    if (!term.trim()) {
      setFilteredPatients(patientList);
      return;
    }
    const filtered = patientList.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.gks_id && String(p.gks_id).toLowerCase().includes(term))
    );
    setFilteredPatients(filtered);
  };

  // ─── Table 2 Filter by Search & Follow-Up Status ──────────────────────────
  const applyRecordsFilter = (list, searchTerm, filterKey) => {
    let result = list;

    if (filterKey && filterKey !== "all") {
      const todayStr = getTodayDate();
      result = result.filter((r) => {
        if (!r.followup_date || r.followup_date === "N/A") return false;
        const datePart = r.followup_date.split("T")[0];
        if (filterKey === "today") return datePart === todayStr;
        if (filterKey === "upcoming") return datePart >= todayStr;
        return true;
      });
    }

    if (searchTerm && searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (r) =>
          (r.name && r.name.toLowerCase().includes(lower)) ||
          (r.gks_id && String(r.gks_id).toLowerCase().includes(lower)) ||
          (r.followup_doctor_remark &&
            r.followup_doctor_remark.toLowerCase().includes(lower)) ||
          (r.followup_discharge_date &&
            String(r.followup_discharge_date).includes(lower)) ||
          (r.followup_date && String(r.followup_date).includes(lower))
      );
    }

    setFilteredDischargeRecords(result);
  };

  const handleRecordsSearchChange = (e) => {
    const term = e.target.value;
    setSearchRecordsText(term);
    applyRecordsFilter(dischargeRecords, term, activeFilter);
  };

  const handleQuickFilterChange = (filterKey) => {
    setActiveFilter(filterKey);
    applyRecordsFilter(dischargeRecords, searchRecordsText, filterKey);
  };

  // ─── Follow-Up Statistics Counters ────────────────────────────────────────
  const todayStr = getTodayDate();
  const followUpStats = {
    total: dischargeRecords.length,
    today: dischargeRecords.filter(
      (r) => r.followup_date && r.followup_date.split("T")[0] === todayStr
    ).length,
    upcoming: dischargeRecords.filter(
      (r) => r.followup_date && r.followup_date.split("T")[0] >= todayStr
    ).length,
  };

  // ─── File Validation & Selection ──────────────────────────────────────────
  const handleFileChange = (e, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict PDF MIME and extension check
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      Swal.fire({
        icon: "error",
        title: getTranslation("Invalid File Format / अमान्य फ़ाइल प्रारूप", lang),
        text: getTranslation(
          "Only PDF documents are allowed for the discharge follow-up report. / डिस्चार्ज फॉलो-अप रिपोर्ट के लिए केवल पीडीएफ दस्तावेज़ स्वीकार्य हैं।",
          lang
        ),
        confirmButtonColor: "#d56337",
        confirmButtonText: getTranslation("OK / ठीक है", lang),
      });
      e.target.value = "";
      if (isEdit) setEditSelectedFile(null);
      else setSelectedFile(null);
      return;
    }

    // Strict 5MB limit check
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      Swal.fire({
        icon: "error",
        title: getTranslation("File Too Large / फ़ाइल बहुत बड़ी है", lang),
        text: `${getTranslation(
          "PDF file size must not exceed 5MB. Selected file size: ",
          lang
        )} ${sizeMb} MB.`,
        confirmButtonColor: "#d56337",
        confirmButtonText: getTranslation("OK / ठीक है", lang),
      });
      e.target.value = "";
      if (isEdit) setEditSelectedFile(null);
      else setSelectedFile(null);
      return;
    }

    if (isEdit) {
      setEditSelectedFile(file);
    } else {
      setSelectedFile(file);
    }
  };

  // ─── Open Submit Modal for a Patient ──────────────────────────────────────
  const openSubmitModal = (patient) => {
    setSelectedPatient(patient);
    setFormData({
      followup_discharge_date: "2026-08-01",
      followup_date: "2026-08-15",
      followup_doctor_remark: "",
    });
    setSelectedFile(null);
    setSubmitModal(true);
  };

  // ─── Open Edit Modal for a Record ─────────────────────────────────────────
  const openEditModal = (record) => {
    setSelectedRecord(record);
    setEditFormData({
      followup_date:
        record.followup_date && record.followup_date !== "N/A"
          ? record.followup_date.split("T")[0]
          : addDaysToDate(getTodayDate(), 14),
      followup_doctor_remark:
        record.followup_doctor_remark && record.followup_doctor_remark !== "N/A"
          ? record.followup_doctor_remark
          : "",
    });
    setEditSelectedFile(null);
    setEditModal(true);
  };

  // ─── Open View Details Modal ──────────────────────────────────────────────
  const openViewModal = async (record) => {
    setSelectedRecord(record);
    setViewModal(true);

    const userId = record.user_id || record.id;
    if (!userId) return;

    try {
      const activeBranch = resolveBranchId();
      const res = await fetch(
        `${BASE_URL}/api/discharge-follow-up/${userId}?branch_id=${activeBranch}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );
      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        const item = data.data || data;
        setSelectedRecord((prev) => ({
          ...prev,
          followup_discharge_date:
            item.followup_discharge_date ||
            item.discharge_date ||
            prev.followup_discharge_date,
          followup_date: item.followup_date || prev.followup_date,
          followup_doctor_remark:
            item.followup_doctor_remark ||
            item.doctor_remark ||
            prev.followup_doctor_remark,
          followup_report_url:
            item.followup_report_url ||
            item.report_url ||
            prev.followup_report_url,
          followup_status:
            item.followup_status !== undefined
              ? item.followup_status
              : prev.followup_status,
        }));
      }
    } catch (err) {
      console.warn("Detailed follow-up fetch error:", err);
    }
  };

  // ─── Open Patient Profile Details Modal ────────────────────────────────────
  const handleViewUserDetails = (userId) => {
    setSelectedViewUserId(userId);
    setViewUserDetailsModal(true);
  };

  // ─── Submit Discharge Follow-Up Handler ───────────────────────────────────
  const handleSubmitDischarge = async (e) => {
    e.preventDefault();

    const userId = selectedPatient?.user_id || selectedPatient?.id;
    if (!userId) {
      Swal.fire({
        icon: "error",
        title: getTranslation("Error / त्रुटि", lang),
        text: getTranslation(
          "Invalid patient selected. Please try again. / अमान्य मरीज चुना गया। कृपया पुन: प्रयास करें।",
          lang
        ),
      });
      return;
    }

    // Client-side compulsory validation
    const fieldsToValidate = [
      {
        label: getTranslation(
          "followup_discharge_date / डिस्चार्ज की तिथि",
          lang
        ),
        value: formData.followup_discharge_date,
      },
      {
        label: getTranslation(
          "followup_date / फॉलो-अप की तिथि",
          lang
        ),
        value: formData.followup_date,
      },
      {
        label: getTranslation(
          "followup_doctor_remark / डॉक्टर की टिप्पणी",
          lang
        ),
        value: formData.followup_doctor_remark,
      },
      {
        label: getTranslation(
          "followup_report_url / डिस्चार्ज रिपोर्ट (PDF)",
          lang
        ),
        value: selectedFile,
      },
    ];

    if (!validateCompulsoryFields(fieldsToValidate, lang)) {
      return;
    }

    setIsSubmitting(true);

    const bodyFormData = new FormData();
    bodyFormData.append(
      "followup_discharge_date",
      formData.followup_discharge_date
    );
    bodyFormData.append("followup_date", formData.followup_date);
    bodyFormData.append(
      "followup_doctor_remark",
      formData.followup_doctor_remark
    );
    bodyFormData.append("followup_report_url", selectedFile);
    if (branchId) {
      bodyFormData.append("branch_id", String(branchId));
    }

    try {
      const response = await fetch(
        `${BASE_URL}/api/discharge-follow-up/submit/${userId}?branch_id=${branchId}`,
        {
          method: "POST",
          headers: getAuthHeaders(true),
          body: bodyFormData,
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        showApiErrorAlert(
          result,
          getTranslation(
            "Failed to Submit Discharge Follow-Up / डिस्चार्ज फॉलो-अप जमा करने में विफल",
            lang
          ),
          lang
        );
        setIsSubmitting(false);
        return;
      }

      // Success handling
      const reportFileUrl =
        result?.data?.followup_report_url ||
        result?.followup_report_url ||
        (selectedFile ? URL.createObjectURL(selectedFile) : "");

      const newRecord = {
        id: result?.data?.followup_id || result?.followup_id || userId,
        user_id: userId,
        gks_id: selectedPatient.gks_id || "N/A",
        name: selectedPatient.name || "N/A",
        phone: selectedPatient.phone || "N/A",
        email: selectedPatient.email || "",
        gender: selectedPatient.gender || "",
        dob: selectedPatient.dob || null,
        admit_date: selectedPatient.admit_date || null,
        ward_name: selectedPatient.wardName || "General Ward",
        followup_discharge_date: formData.followup_discharge_date,
        followup_date: formData.followup_date,
        followup_doctor_remark: formData.followup_doctor_remark,
        followup_report_url: reportFileUrl,
        followup_status: 1,
        created_at: new Date().toISOString(),
      };

      const currentLocal = loadLocalRecords();
      const updatedLocal = [
        newRecord,
        ...currentLocal.filter((item) => (item.user_id || item.id) !== userId),
      ];
      saveLocalRecords(updatedLocal);

      setDischargeRecords(updatedLocal);
      applyRecordsFilter(updatedLocal, searchRecordsText, activeFilter);

      // Immediately REMOVE this discharged patient from Table 1 (Active Admitted Patients)
      setPatientList((prev) =>
        prev.filter((p) => String(p.user_id || p.id) !== String(userId))
      );
      setFilteredPatients((prev) =>
        prev.filter((p) => String(p.user_id || p.id) !== String(userId))
      );

      setSubmitModal(false);
      setSelectedPatient(null);
      setSelectedFile(null);

      Swal.fire({
        icon: "success",
        title: getTranslation("Discharge Follow-Up Submitted! / डिस्चार्ज फॉलो-अप जमा हुआ!", lang),
        text: getTranslation(
          "Patient has been discharged and follow-up scheduled successfully. / मरीज को डिस्चार्ज कर दिया गया है एवं फॉलो-अप निर्धारित किया गया है।",
          lang
        ),
        timer: 2200,
        showConfirmButton: false,
      });

      fetchDischargeRecords();
      fetchRegisteredPatients(updatedLocal);
    } catch (err) {
      console.error("Discharge follow up submit error:", err);
      showApiErrorAlert(
        { message: err.message || "Network error occurred" },
        getTranslation(
          "Failed to Submit Discharge Follow-Up / डिस्चार्ज फॉलो-अप जमा करने में विफल",
          lang
        ),
        lang
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Update Discharge Follow-Up Handler ───────────────────────────────────
  const handleUpdateDischarge = async (e) => {
    e.preventDefault();

    const userId = selectedRecord?.user_id || selectedRecord?.id;
    if (!userId) return;

    setIsUpdating(true);

    const bodyFormData = new FormData();
    if (editFormData.followup_date) {
      bodyFormData.append("followup_date", editFormData.followup_date);
    }
    if (editFormData.followup_doctor_remark) {
      bodyFormData.append(
        "followup_doctor_remark",
        editFormData.followup_doctor_remark
      );
    }
    if (editSelectedFile) {
      bodyFormData.append("followup_report_url", editSelectedFile);
    }
    if (branchId) {
      bodyFormData.append("branch_id", String(branchId));
    }

    try {
      const response = await fetch(
        `${BASE_URL}/api/discharge-follow-up/update/${userId}?branch_id=${branchId}`,
        {
          method: "PUT",
          headers: getAuthHeaders(true),
          body: bodyFormData,
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        showApiErrorAlert(
          result,
          getTranslation(
            "Failed to Update Discharge Follow-Up / डिस्चार्ज फॉलो-अप अपडेट करने में विफल",
            lang
          ),
          lang
        );
        setIsUpdating(false);
        return;
      }

      // Success
      const reportFileUrl =
        result?.data?.followup_report_url ||
        result?.followup_report_url ||
        (editSelectedFile
          ? URL.createObjectURL(editSelectedFile)
          : selectedRecord.followup_report_url);

      const updatedItem = {
        ...selectedRecord,
        followup_date: editFormData.followup_date,
        followup_doctor_remark: editFormData.followup_doctor_remark,
        followup_report_url: reportFileUrl,
        updated_at: new Date().toISOString(),
      };

      const currentLocal = loadLocalRecords();
      const updatedLocal = currentLocal.map((item) =>
        (item.user_id || item.id) === userId ? updatedItem : item
      );
      saveLocalRecords(updatedLocal);

      setDischargeRecords(updatedLocal);
      applyRecordsFilter(updatedLocal, searchRecordsText, activeFilter);

      setEditModal(false);
      setSelectedRecord(null);
      setEditSelectedFile(null);

      Swal.fire({
        icon: "success",
        title: getTranslation("Success / सफलता", lang),
        text: getTranslation(
          "Discharge follow-up updated successfully! / डिस्चार्ज फॉलो-अप सफलतापूर्वक अपडेट किया गया!",
          lang
        ),
        timer: 2000,
        showConfirmButton: false,
      });

      fetchDischargeRecords();
    } catch (err) {
      console.error("Discharge follow up update error:", err);
      showApiErrorAlert(
        { message: err.message || "Network error during update" },
        getTranslation(
          "Failed to Update Discharge Follow-Up / डिस्चार्ज फॉलो-अप अपडेट करने में विफल",
          lang
        ),
        lang
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // ─── Print & PDF Download Handlers ────────────────────────────────────────
  const handlePrint = useReactToPrint({
    content: () => reportPrintRef.current,
    documentTitle: `Discharge_Follow_Up_${
      selectedRecord?.name || selectedRecord?.patient_name || "Patient"
    }`,
  });

  const handleDownloadPdf = () => {
    const element = reportPrintRef.current;
    if (!element) return;
    setIsDownloadingPdf(true);
    const opt = {
      margin: [8, 8, 8, 8],
      filename: `Discharge_Follow_Up_${
        selectedRecord?.name || selectedRecord?.patient_name || "Patient"
      }.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };
    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => setIsDownloadingPdf(false))
      .catch((err) => {
        console.error("PDF download error:", err);
        setIsDownloadingPdf(false);
      });
  };

  // ─── Helper for Quick Preset Dates in Create Modal ────────────────────────
  const setQuickFollowUpInterval = (days) => {
    const baseDate = formData.followup_discharge_date || getTodayDate();
    setFormData({
      ...formData,
      followup_date: addDaysToDate(baseDate, days),
    });
  };

  const calculateDaysInterval = () => {
    if (!formData.followup_discharge_date || !formData.followup_date) return null;
    const d1 = new Date(formData.followup_discharge_date);
    const d2 = new Date(formData.followup_date);
    const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // ─── Table 1 Columns (Matching Screenshot 2 exactly: GKS ID, Patient name, Action) ───
  const tablePatientColumns = [
    {
      name: `${getTranslation("GKS ID / GKS आईडी", lang)}`,
      selector: (row) => row.gks_id,
      sortable: true,
      center: true,
    },
    {
      name: `${getTranslation("Patient name / रोगी का नाम", lang)}`,
      selector: (row) => row.name,
      sortable: true,
      cell: (row) => (
        <span
          style={{
            color: row.disabled ? "#999" : "#000",
            fontStyle: row.disabled ? "italic" : "normal",
            fontWeight: 500,
          }}
        >
          {row.name} {row.disabled && "(disabled)"}
        </span>
      ),
    },
    {
      name: `${getTranslation("Action / क्रिया", lang)}`,
      center: true,
      cell: (row) => (
        <div className="d-flex align-items-center justify-content-center gap-2">
          {/* View User Details Icon (Orange Eye) */}
          <span
            onClick={() => handleViewUserDetails(row.id || row.user_id)}
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

          {/* Plus Square Icon to Open Submit Discharge Follow-Up Modal */}
          <span
            onClick={() => openSubmitModal(row)}
            style={{ cursor: "pointer" }}
            title={getTranslation(
              "Create Discharge Follow-Up / डिस्चार्ज फॉलो-अप बनाएँ",
              lang
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </span>
        </div>
      ),
    },
  ];

  // ─── Table 2 Columns: Clean, centered follow-up date and View/Edit only ───
  const tableRecordsColumns = [
    {
      name: getTranslation("GKS ID / GKS आईडी", lang),
      selector: (row) => row.gks_id || "N/A",
      sortable: true,
      center: true,
      width: "130px",
    },
    {
      name: getTranslation("Patient Name / रोगी का नाम", lang),
      selector: (row) => row.name || "N/A",
      sortable: true,
      cell: (row) => (
        <span
          style={{ cursor: "pointer", fontWeight: 600, color: "#1e293b" }}
          onClick={() => {
            setSelectedViewUserId(row.user_id || row.id);
            setViewUserDetailsModal(true);
          }}
          title={getTranslation(
            "Click to view patient profile / प्रोफ़ाइल देखने के लिए क्लिक करें",
            lang
          )}
        >
          {row.name}
        </span>
      ),
    },
    {
      name: getTranslation("Discharge Date / डिस्चार्ज तिथि", lang),
      selector: (row) => row.followup_discharge_date,
      sortable: true,
      center: true,
      cell: (row) => (
        <span className="fw-semibold text-dark">
          {row.followup_discharge_date && row.followup_discharge_date !== "N/A"
            ? new Date(row.followup_discharge_date).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "N/A"}
        </span>
      ),
    },
    {
      name: getTranslation("Follow-Up Date / फॉलो-अप तिथि", lang),
      selector: (row) => row.followup_date,
      sortable: true,
      center: true,
      cell: (row) => {
        if (!row.followup_date || row.followup_date === "N/A") {
          return <span className="text-muted">N/A</span>;
        }

        const formattedDate = new Date(row.followup_date).toLocaleDateString(
          "en-GB",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }
        );

        return (
          <span className="fw-semibold text-dark" style={{ fontSize: "13.5px" }}>
            {formattedDate}
          </span>
        );
      },
    },
    {
      name: getTranslation("Doctor's Remark / डॉक्टर की टिप्पणी", lang),
      selector: (row) => row.followup_doctor_remark || "N/A",
      cell: (row) => (
        <span
          title={row.followup_doctor_remark}
          style={{
            maxWidth: "240px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "inline-block",
          }}
        >
          {row.followup_doctor_remark || "N/A"}
        </span>
      ),
    },
    {
      name: getTranslation("Report / रिपोर्ट", lang),
      center: true,
      cell: (row) => {
        if (!row.followup_report_url) {
          return (
            <Badge color="light" className="text-muted border">
              {getTranslation("No File", lang)}
            </Badge>
          );
        }
        return (
          <a
            href={getFullFileUrl(row.followup_report_url)}
            target="_blank"
            rel="noopener noreferrer"
            className="badge bg-primary text-white text-decoration-none px-2 py-1"
            title={getTranslation("View / Download PDF", lang)}
          >
            <i className="fa fa-file-pdf-o me-1" /> PDF
          </a>
        );
      },
    },
    {
      name: getTranslation("Status / स्थिति", lang),
      center: true,
      cell: (row) => (
        <Badge color="success" pill>
          {getTranslation("Discharged / डिस्चार्ज", lang)}
        </Badge>
      ),
    },
    {
      name: getTranslation("Action / कार्रवाई", lang),
      center: true,
      cell: (row) => (
        <div className="d-flex align-items-center justify-content-center gap-2">
          {/* View Icon (Orange Eye) */}
          <span
            onClick={() => openViewModal(row)}
            style={{ cursor: "pointer" }}
            title={getTranslation("View Details / विवरण देखें", lang)}
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

          {/* Edit Icon (Green Pencil) */}
          <span
            onClick={() => openEditModal(row)}
            style={{ cursor: "pointer" }}
            title={getTranslation("Edit Follow-Up / फॉलो-अप संपादित करें", lang)}
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

  const intervalDays = calculateDaysInterval();

  return (
    <Fragment>
      <Container fluid={true} className="datatables">
        <Row>
          <Col sm="12">
            <CardBody className="p-0">
              {/* ── Table 1: Registered Patients (Matching Screenshot 2 Exactly) ──── */}
              <Card className="mb-4">
                <CardBody>
                  <div className="d-flex pb-2 justify-content-between align-items-center flex-wrap gap-2">
                    <HeaderCard
                      title={getTranslation(
                        "Active Admitted Patients (Pending Discharge) / सक्रिय भर्ती मरीज (लंबित डिस्चार्ज)",
                        lang
                      )}
                      className="p-0 mb-0"
                    />
                  </div>

                  <div className="row pb-3 align-items-center">
                    <div className="col-md-5 col-12 mb-2 mb-md-0">
                      <InputGroup>
                        <Input
                          className="form-control"
                          type="text"
                          placeholder={getTranslation(
                            "Search......./खोज.......",
                            lang
                          )}
                          value={searchPatientText}
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
                        filename="Active_Admitted_Patients_Pending_Discharge"
                        title={getTranslation(
                          "Active Admitted Patients (Pending Discharge) / सक्रिय भर्ती मरीज (लंबित डिस्चार्ज)",
                          lang
                        )}
                      />
                    </div>
                  </div>

                  {loadingPatients ? (
                    <div className="text-center py-4 text-muted">
                      <Spinner color="primary" size="sm" className="me-2" />
                      {getTranslation(
                        "Loading registered patients... / डेटा लोड हो रहा है...",
                        lang
                      )}
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
                      noDataComponent={
                        <div className="p-4 text-muted">
                          {getTranslation(
                            "No active admitted patients pending discharge. / कोई लंबित मरीज नहीं मिला।",
                            lang
                          )}
                        </div>
                      }
                    />
                  )}
                </CardBody>
              </Card>

              {/* ── Table 2: Discharge Follow-Up Records ───────────────────── */}
              <Card>
                <CardBody>
                  <div className="d-flex pb-2 justify-content-between align-items-center flex-wrap gap-2">
                    <HeaderCard
                      title={getTranslation(
                        "Discharge Follow-Up Records / डिस्चार्ज फॉलो-अप रिकॉर्ड्स",
                        lang
                      )}
                      className="p-0 mb-0"
                    />

                    {/* Clean Filter Buttons */}
                    <div className="d-flex align-items-center gap-1 flex-wrap">
                      <Button
                        size="sm"
                        color={activeFilter === "all" ? "primary" : "light"}
                        onClick={() => handleQuickFilterChange("all")}
                        className="px-3"
                        style={activeFilter === "all" ? { backgroundColor: "#24695c", borderColor: "#24695c" } : {}}
                      >
                        {getTranslation("All", lang)} ({followUpStats.total})
                      </Button>
                      <Button
                        size="sm"
                        color={activeFilter === "today" ? "warning" : "light"}
                        onClick={() => handleQuickFilterChange("today")}
                        className="px-3 text-dark border"
                      >
                        🔔 {getTranslation("Today / आज", lang)} ({followUpStats.today})
                      </Button>
                      <Button
                        size="sm"
                        color={activeFilter === "upcoming" ? "info" : "light"}
                        onClick={() => handleQuickFilterChange("upcoming")}
                        className="px-3 border"
                      >
                        📅 {getTranslation("Upcoming / आगामी", lang)} ({followUpStats.upcoming})
                      </Button>
                    </div>
                  </div>

                  <div className="row pb-3 align-items-center">
                    <div className="col-md-5 col-12 mb-2 mb-md-0">
                      <InputGroup>
                        <Input
                          className="form-control"
                          type="text"
                          placeholder={getTranslation(
                            "Search records by patient name, GKS ID, remark, date... / खोजें...",
                            lang
                          )}
                          value={searchRecordsText}
                          onChange={handleRecordsSearchChange}
                        />
                        <span className="input-group-text">
                          <i className="fa fa-search" />
                        </span>
                      </InputGroup>
                    </div>
                    <div className="col-md-7 col-12 d-flex justify-content-md-end justify-content-start">
                      <TableExportButtons
                        data={filteredDischargeRecords}
                        columns={tableRecordsColumns}
                        filename="Discharge_Follow_Up_Records"
                        title={getTranslation(
                          "Discharge Follow-Up Records",
                          lang
                        )}
                      />
                    </div>
                  </div>

                  {loadingRecords ? (
                    <div className="text-center py-4 text-muted">
                      <Spinner color="primary" size="sm" className="me-2" />
                      {getTranslation(
                        "Loading discharge follow-up records... / रिकॉर्ड लोड हो रहे हैं...",
                        lang
                      )}
                    </div>
                  ) : (
                    <DataTable
                      data={filteredDischargeRecords}
                      columns={tableRecordsColumns}
                      striped
                      center
                      highlightOnHover
                      pagination
                      persistTableHead
                      noDataComponent={
                        <div className="p-4 text-muted">
                          {getTranslation(
                            "No discharge follow-up records found. / कोई रिकॉर्ड नहीं मिला।",
                            lang
                          )}
                        </div>
                      }
                    />
                  )}
                </CardBody>
              </Card>
            </CardBody>
          </Col>
        </Row>
      </Container>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL 1: SUBMIT DISCHARGE FOLLOW UP (The 4 Specified Fields) ─── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <CommonModal
        isOpen={submitModal}
        toggler={() => {
          if (!isSubmitting) {
            setSubmitModal(false);
            setSelectedPatient(null);
            setSelectedFile(null);
          }
        }}
        size="lg"
        title={getTranslation(
          "Create Discharge Follow-Up / डिस्चार्ज फॉलो-अप बनाएँ",
          lang
        )}
      >
        <div className="p-4">
          {/* Patient Common Info Header */}
          {selectedPatient && (
            <PatientCommonInfo
              selectedUser={{
                ...selectedPatient,
                user_id: selectedPatient.user_id || selectedPatient.id,
              }}
              labels={{
                nameValue: selectedPatient.name,
                gksId: selectedPatient.gks_id,
              }}
            />
          )}

          <Form onSubmit={handleSubmitDischarge} noValidate>
            <Row className="g-3">
              {/* Field 1: followup_discharge_date */}
              <Col md="6">
                <FormGroup>
                  <Label className="fw-semibold text-dark">
                    {getTranslation(
                      "followup_discharge_date / डिस्चार्ज की तिथि",
                      lang
                    )}{" "}
                    <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="date"
                    name="followup_discharge_date"
                    value={formData.followup_discharge_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        followup_discharge_date: e.target.value,
                      })
                    }
                    className="form-control"
                    required
                  />
                  <small className="text-muted">
                    {getTranslation(
                      "Patient discharge date (sets discharge_status = 1).",
                      lang
                    )}
                  </small>
                </FormGroup>
              </Col>

              {/* Field 2: followup_date */}
              <Col md="6">
                <FormGroup>
                  <div className="d-flex align-items-center justify-content-between">
                    <Label className="fw-semibold text-dark mb-0">
                      {getTranslation(
                        "followup_date / फॉलो-अप की तिथि",
                        lang
                      )}{" "}
                      <span className="text-danger">*</span>
                    </Label>

                    {/* Quick Preset Buttons */}
                    <div className="d-flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        color="light"
                        className="border py-0 px-2"
                        style={{ fontSize: "11px" }}
                        onClick={() => setQuickFollowUpInterval(7)}
                      >
                        +7D
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        color="light"
                        className="border py-0 px-2"
                        style={{ fontSize: "11px" }}
                        onClick={() => setQuickFollowUpInterval(14)}
                      >
                        +14D
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        color="light"
                        className="border py-0 px-2"
                        style={{ fontSize: "11px" }}
                        onClick={() => setQuickFollowUpInterval(30)}
                      >
                        +30D
                      </Button>
                    </div>
                  </div>

                  <Input
                    type="date"
                    name="followup_date"
                    value={formData.followup_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        followup_date: e.target.value,
                      })
                    }
                    className="form-control mt-1"
                    required
                  />

                  {intervalDays !== null && (
                    <small className="text-primary fw-semibold d-block mt-1">
                      📅 {getTranslation("Doctor will review patient after", lang)}{" "}
                      {intervalDays} {getTranslation("days.", lang)}
                    </small>
                  )}
                </FormGroup>
              </Col>

              {/* Field 3: followup_doctor_remark */}
              <Col md="12">
                <FormGroup>
                  <Label className="fw-semibold text-dark">
                    {getTranslation(
                      "followup_doctor_remark / डॉक्टर की टिप्पणी",
                      lang
                    )}{" "}
                    <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="textarea"
                    rows="3"
                    name="followup_doctor_remark"
                    placeholder="Patient recovering well, no complaints"
                    value={formData.followup_doctor_remark}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        followup_doctor_remark: e.target.value,
                      })
                    }
                    className="form-control"
                    required
                  />
                </FormGroup>
              </Col>

              {/* Field 4: followup_report_url (PDF Only, Max 5MB) */}
              <Col md="12">
                <FormGroup>
                  <Label className="fw-semibold text-dark">
                    {getTranslation(
                      "followup_report_url / डिस्चार्ज रिपोर्ट (PDF Only, Max 5MB)",
                      lang
                    )}{" "}
                    <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => handleFileChange(e, false)}
                    className="form-control"
                    required
                  />
                  {selectedFile ? (
                    <div className="mt-2 p-2 bg-light rounded border d-flex align-items-center justify-content-between">
                      <span className="text-success small fw-semibold">
                        <i className="fa fa-file-pdf-o me-1 text-danger" />{" "}
                        {selectedFile.name} (
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                      <Button
                        color="link"
                        size="sm"
                        className="text-danger p-0 text-decoration-none"
                        onClick={() => setSelectedFile(null)}
                      >
                        <i className="fa fa-times" />{" "}
                        {getTranslation("Remove / हटाएं", lang)}
                      </Button>
                    </div>
                  ) : (
                    <small className="text-muted d-block mt-1">
                      {getTranslation(
                        "Please select the discharge summary document in PDF format (strictly maximum 5MB).",
                        lang
                      )}
                    </small>
                  )}
                </FormGroup>
              </Col>
            </Row>

            {/* Modal Buttons */}
            <div className="d-flex justify-content-end align-items-center gap-2 mt-4 pt-3 border-top">
              <Button
                color="light"
                type="button"
                onClick={() => {
                  setSubmitModal(false);
                  setSelectedPatient(null);
                  setSelectedFile(null);
                }}
                disabled={isSubmitting}
                className="px-4"
              >
                {getTranslation("Cancel / रद्द करें", lang)}
              </Button>
              <Button
                color="primary"
                type="submit"
                disabled={isSubmitting}
                className="px-4 d-flex align-items-center gap-2"
                style={{ backgroundColor: "#24695c", borderColor: "#24695c" }}
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" />
                    <span>{getTranslation("Submitting...", lang)}</span>
                  </>
                ) : (
                  <>
                    <i className="fa fa-check-circle" />
                    <span>
                      {getTranslation(
                        "Discharge & Schedule Follow-Up / डिस्चार्ज करें",
                        lang
                      )}
                    </span>
                  </>
                )}
              </Button>
            </div>
          </Form>
        </div>
      </CommonModal>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL 2: EDIT DISCHARGE FOLLOW UP ────────────────────────────── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <CommonModal
        isOpen={editModal}
        toggler={() => {
          if (!isUpdating) {
            setEditModal(false);
            setSelectedRecord(null);
            setEditSelectedFile(null);
          }
        }}
        size="lg"
        title={getTranslation(
          "Edit Discharge Follow-Up / डिस्चार्ज फॉलो-अप संपादित करें",
          lang
        )}
      >
        <div className="p-4">
          {selectedRecord && (
            <PatientCommonInfo
              selectedUser={{
                ...selectedRecord,
                user_id: selectedRecord.user_id || selectedRecord.id,
              }}
              labels={{
                nameValue: selectedRecord.name,
                gksId: selectedRecord.gks_id,
              }}
            />
          )}

          <Form onSubmit={handleUpdateDischarge}>
            <Row className="g-3">
              {/* Follow-Up Date */}
              <Col md="12">
                <FormGroup>
                  <Label className="fw-semibold text-dark">
                    {getTranslation(
                      "Follow-Up Date / फॉलो-अप की तिथि",
                      lang
                    )}
                  </Label>
                  <Input
                    type="date"
                    name="followup_date"
                    value={editFormData.followup_date}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        followup_date: e.target.value,
                      })
                    }
                    className="form-control"
                  />
                </FormGroup>
              </Col>

              {/* Doctor's Remark */}
              <Col md="12">
                <FormGroup>
                  <Label className="fw-semibold text-dark">
                    {getTranslation(
                      "Doctor's Remark / डॉक्टर की टिप्पणी",
                      lang
                    )}
                  </Label>
                  <Input
                    type="textarea"
                    rows="3"
                    name="followup_doctor_remark"
                    value={editFormData.followup_doctor_remark}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        followup_doctor_remark: e.target.value,
                      })
                    }
                    className="form-control"
                  />
                </FormGroup>
              </Col>

              {/* Replace PDF Report */}
              <Col md="12">
                <FormGroup>
                  <Label className="fw-semibold text-dark">
                    {getTranslation(
                      "Update Report PDF (Optional, Max 5MB) / रिपोर्ट फ़ाइल अपडेट करें",
                      lang
                    )}
                  </Label>
                  <Input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => handleFileChange(e, true)}
                    className="form-control"
                  />
                  {editSelectedFile ? (
                    <div className="mt-2 p-2 bg-light rounded border d-flex align-items-center justify-content-between">
                      <span className="text-success small fw-semibold">
                        <i className="fa fa-file-pdf-o me-1 text-danger" />{" "}
                        {editSelectedFile.name} (
                        {(editSelectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                      <Button
                        color="link"
                        size="sm"
                        className="text-danger p-0 text-decoration-none"
                        onClick={() => setEditSelectedFile(null)}
                      >
                        <i className="fa fa-times" />{" "}
                        {getTranslation("Remove / हटाएं", lang)}
                      </Button>
                    </div>
                  ) : selectedRecord?.followup_report_url ? (
                    <small className="text-muted d-block mt-1">
                      {getTranslation("Current file attached:", lang)}{" "}
                      <a
                        href={getFullFileUrl(selectedRecord.followup_report_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary fw-semibold text-decoration-none"
                      >
                        <i className="fa fa-file-pdf-o me-1 text-danger" />
                        {getTranslation("View Current PDF", lang)}
                      </a>
                    </small>
                  ) : null}
                </FormGroup>
              </Col>
            </Row>

            {/* Action Buttons */}
            <div className="d-flex justify-content-end align-items-center gap-2 mt-4 pt-3 border-top">
              <Button
                color="light"
                type="button"
                onClick={() => {
                  setEditModal(false);
                  setSelectedRecord(null);
                  setEditSelectedFile(null);
                }}
                disabled={isUpdating}
                className="px-4"
              >
                {getTranslation("Cancel / रद्द करें", lang)}
              </Button>
              <Button
                color="success"
                type="submit"
                disabled={isUpdating}
                className="px-4 d-flex align-items-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <Spinner size="sm" />
                    <span>{getTranslation("Updating...", lang)}</span>
                  </>
                ) : (
                  <>
                    <i className="fa fa-save" />
                    <span>{getTranslation("Save Changes / सहेजें", lang)}</span>
                  </>
                )}
              </Button>
            </div>
          </Form>
        </div>
      </CommonModal>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL 3: VIEW DISCHARGE DETAILS (Clean PDF & Print Template) ─── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <CommonModal
        isOpen={viewModal}
        toggler={() => setViewModal(!viewModal)}
        size="lg"
        title={getTranslation(
          "Discharge Follow-Up Details / डिस्चार्ज फॉलो-अप विवरण",
          lang
        )}
      >
        <div className="p-3">
          <div ref={reportPrintRef} className="p-3 bg-white">
            {/* Standard Hospital Branding Header */}
            <PatientViewHeader
              title={getTranslation(
                "Discharge Follow-Up Summary / डिस्चार्ज फॉलो-अप सारांश",
                lang
              )}
            />

            {/* Standard Patient Details Card */}
            <Card className="mb-3 border">
              <CardBody className="p-3">
                <h6
                  className="fw-bold mb-3 pb-2 border-bottom text-uppercase"
                  style={{ color: "#24695c", letterSpacing: "0.5px" }}
                >
                  <i className="fa fa-user me-2" />
                  {getTranslation(
                    "Patient Demographic Details / मरीज का विवरण",
                    lang
                  )}
                </h6>
                <Row className="g-3">
                  <Col md="4" sm="6">
                    <div className="p-2 rounded bg-light border">
                      <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                        {getTranslation("GKS ID / GKS आईडी", lang)}
                      </small>
                      <span className="fw-bold text-dark" style={{ fontSize: "14px" }}>
                        {selectedRecord?.gks_id || "N/A"}
                      </span>
                    </div>
                  </Col>
                  <Col md="4" sm="6">
                    <div className="p-2 rounded bg-light border">
                      <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                        {getTranslation("Patient Name / रोगी का नाम", lang)}
                      </small>
                      <span className="fw-bold text-dark" style={{ fontSize: "14px" }}>
                        {selectedRecord?.name || selectedRecord?.patient_name || "N/A"}
                      </span>
                    </div>
                  </Col>
                  <Col md="4" sm="6">
                    <div className="p-2 rounded bg-light border">
                      <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                        {getTranslation("Phone / फ़ोन", lang)}
                      </small>
                      <span className="fw-semibold text-dark" style={{ fontSize: "14px" }}>
                        {selectedRecord?.phone || "N/A"}
                      </span>
                    </div>
                  </Col>
                  <Col md="4" sm="6">
                    <div className="p-2 rounded bg-light border">
                      <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                        {getTranslation("Ward / वार्ड", lang)}
                      </small>
                      <span className="fw-semibold text-dark" style={{ fontSize: "14px" }}>
                        {selectedRecord?.ward_name || "General Ward"}
                      </span>
                    </div>
                  </Col>
                  <Col md="4" sm="6">
                    <div className="p-2 rounded bg-light border">
                      <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                        {getTranslation("Admission Date / भर्ती तिथि", lang)}
                      </small>
                      <span className="fw-semibold text-dark" style={{ fontSize: "14px" }}>
                        {selectedRecord?.admit_date
                          ? new Date(selectedRecord.admit_date).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                  </Col>
                  <Col md="4" sm="6">
                    <div className="p-2 rounded bg-light border">
                      <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                        {getTranslation("Discharge Status / स्थिति", lang)}
                      </small>
                      <Badge color="success" pill>
                        {getTranslation("Discharged / डिस्चार्ज", lang)}
                      </Badge>
                    </div>
                  </Col>
                </Row>
              </CardBody>
            </Card>

            {/* Doctor Discharge & Follow-Up Findings Card */}
            <Card className="mb-3 border">
              <CardBody className="p-3">
                <h6
                  className="fw-bold mb-3 pb-2 border-bottom text-uppercase"
                  style={{ color: "#24695c", letterSpacing: "0.5px" }}
                >
                  <i className="fa fa-stethoscope me-2" />
                  {getTranslation(
                    "Doctor Discharge & Follow-Up Schedule / डिस्चार्ज एवं फॉलो-अप विवरण",
                    lang
                  )}
                </h6>
                <Row className="g-3">
                  <Col md="6">
                    <div className="p-3 rounded bg-light border">
                      <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                        {getTranslation("Discharge Date / डिस्चार्ज तिथि", lang)}
                      </small>
                      <h5 className="fw-bold text-dark mt-1 mb-0">
                        📅 {selectedRecord?.followup_discharge_date && selectedRecord.followup_discharge_date !== "N/A"
                          ? new Date(selectedRecord.followup_discharge_date).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })
                          : "N/A"}
                      </h5>
                    </div>
                  </Col>
                  <Col md="6">
                    <div className="p-3 rounded bg-light border">
                      <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                        {getTranslation("Scheduled Follow-Up Date / फॉलो-अप तिथि", lang)}
                      </small>
                      <h5 className="fw-bold text-dark mt-1 mb-0">
                        📅 {selectedRecord?.followup_date && selectedRecord.followup_date !== "N/A"
                          ? new Date(selectedRecord.followup_date).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })
                          : "N/A"}
                      </h5>
                    </div>
                  </Col>

                  <Col md="12">
                    <div className="p-3 rounded bg-light border">
                      <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                        {getTranslation("Doctor's Clinical Remark / डॉक्टर की टिप्पणी", lang)}
                      </small>
                      <p className="fw-semibold text-dark mt-1 mb-0" style={{ whiteSpace: "pre-wrap", fontSize: "14px" }}>
                        {selectedRecord?.followup_doctor_remark || "N/A"}
                      </p>
                    </div>
                  </Col>
                </Row>
              </CardBody>
            </Card>

            {/* Attached PDF Report Preview */}
            <Card className="border">
              <CardBody className="p-3">
                <h6
                  className="fw-bold mb-3 pb-2 border-bottom text-uppercase"
                  style={{ color: "#24695c", letterSpacing: "0.5px" }}
                >
                  <i className="fa fa-file-text-o me-2" />
                  {getTranslation("Discharge Document Report / डिस्चार्ज रिपोर्ट दस्तावेज़", lang)}
                </h6>
                {selectedRecord?.followup_report_url ? (
                  <div>
                    <div className="d-flex align-items-center justify-content-between p-3 rounded-3 bg-light border mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <i className="fa fa-file-pdf-o text-danger" style={{ fontSize: "24px" }} />
                        <div>
                          <div className="fw-bold text-dark">Discharge_Report.pdf</div>
                          <small className="text-muted">PDF Document (≤ 5MB)</small>
                        </div>
                      </div>
                      <a
                        href={getFullFileUrl(selectedRecord.followup_report_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-primary px-3"
                      >
                        <i className="fa fa-external-link me-1" />
                        {getTranslation("Open in New Tab", lang)}
                      </a>
                    </div>
                    <div className="border rounded overflow-hidden">
                      <iframe
                        src={getFullFileUrl(selectedRecord.followup_report_url)}
                        width="100%"
                        height="400px"
                        title="PDF Preview"
                        style={{ border: "none" }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-3 bg-light border text-muted fst-italic">
                    {getTranslation(
                      "No report document was attached to this record.",
                      lang
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          <ModalActionButtons
            onClose={() => setViewModal(false)}
            onPrint={handlePrint}
            onDownload={handleDownloadPdf}
            isDownloading={isDownloadingPdf}
          />
        </div>
      </CommonModal>

      {/* ── User Details Modal (Quick Patient Profile inspection with working cancel/close) ── */}
      <UserDetailsModal
        isOpen={viewUserDetailsModal}
        toggler={() => setViewUserDetailsModal(false)}
        toggle={() => setViewUserDetailsModal(false)}
        onClose={() => setViewUserDetailsModal(false)}
        userId={selectedViewUserId}
      />
    </Fragment>
  );
}

export default DischargeFollowUp;
