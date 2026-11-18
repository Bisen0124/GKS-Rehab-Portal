import { React, useState, useEffect, Fragment, useRef, useCallback, useMemo } from "react";
import {
  Form,
  FormGroup,
  Label,
  Input,
  Col,
  Button,
  Row,
  Container,
  Card,
  CardBody,
  InputGroup,
  Table,
  Spinner,
  Badge,
  Nav,
  NavItem,
  NavLink,
} from "reactstrap";

import {
  dateOfAssessment,
  tableNumber,
  tableNumber2,
  yes1,
  no1,
  prepared,
  fda,
  mentalBehaviour,
  mentalBehavioursData,
  fdaAdsiction,
  addictionSeverity,
  Remarks,
} from "../../Constant";
import DatePicker from "react-datepicker";
import CommonModal from "../UiKits/Modals/common/modal";
import HeaderCard from "../Common/Component/HeaderCard";
import DataTable from "react-data-table-component";
import { Data } from "../UiKits/Spinners/SpinnerData";
import { toast } from "react-toastify";

import Swal from "sweetalert2"; // ✅ Make sure this is imported at the top

//Calculate age by DOB custom hook
import useCalculateAge from "../../CustomHook/useCalculateAge";

//Show pateint/user common info like name, age and DOB by custom hook
import PatientCommonInfo from "../../CustomHook/PatientCommonInfo";

//editPFA download PDF library
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import html2pdf from "html2pdf.js";

import { useBranch } from "../../contexts/BranchContext";

import { Btn, H5, Breadcrumbs, H4 } from "../../AbstractElements";


import Translated from "../Translated";
import { useLang } from "../../contexts/LangContext";
import { getTranslation } from "../../utils/translator";
import UserDetailsModal from "../Common/UserDetailsModal";
import ModalLoading from "../Common/ModalLoading";
import PatientViewHeader from "../Common/PatientViewHeader";
import TableExportButtons from "../Common/TableExportButtons";
import { SaveDraftButton, DraftNoticeBanner } from "../Common/SaveDraftButton";
import { loadDraft, clearDraft, safeDate } from "../../utils/formDraftManager";
import { printElementAsPdf } from "../../utils/pdfPrintHelper";
import ModalActionButtons from "../Common/ModalActionButtons";
import { validateCompulsoryFields, showApiErrorAlert } from "../../utils/formValidationHelper";
import {
  Clock,
  CheckCircle,
  Upload,
  AlertCircle,
  FileText,
  Activity,
  RefreshCw,
  Eye,
  Plus,
  Heart,
  Edit2,
  Trash2,
  Info,
  Calendar,
} from "react-feather";
import VoiceTextarea from "../VoiceTextarea/VoiceTextarea";

// Standard medical observation packages fallback (guarantees package options are always available)
const DEFAULT_OBSERVATION_PACKAGES = [
  { package_type_id: 1, package_name: "CBC (Complete Blood Count)", original_amount: 350, package_description: "Hemoglobin, TLC, DLC, Platelets, ESR" },
  { package_type_id: 2, package_name: "LFT (Liver Function Test)", original_amount: 650, package_description: "SGOT, SGPT, Bilirubin, Alkaline Phosphatase" },
  { package_type_id: 3, package_name: "KFT / RFT (Renal Function Test)", original_amount: 550, package_description: "Blood Urea, Serum Creatinine, Uric Acid" },
  { package_type_id: 4, package_name: "Blood Sugar (Fasting / Random)", original_amount: 120, package_description: "Blood Glucose Level" },
  { package_type_id: 5, package_name: "Lipid Profile", original_amount: 700, package_description: "Cholesterol, Triglycerides, HDL, LDL" },
  { package_type_id: 6, package_name: "Thyroid Profile (T3, T4, TSH)", original_amount: 500, package_description: "Thyroid gland hormones" },
  { package_type_id: 7, package_name: "Urine Routine & Microscopy", original_amount: 150, package_description: "Physical, chemical and microscopic exam" },
  { package_type_id: 8, package_name: "Electrolytes (Na+, K+, Cl-)", original_amount: 450, package_description: "Sodium, Potassium, Chloride" },
];

const customTableStyles = {
  table: {
    style: {
      border: "1px solid #dcefe8",
      borderRadius: "8px",
    },
  },
  headRow: {
    style: {
      backgroundColor: "#ebf7f3",
      borderBottom: "2px solid #b7dfd2",
      minHeight: "48px",
    },
  },
  headCells: {
    style: {
      fontSize: "13px",
      fontWeight: "700",
      color: "#23594b",
      letterSpacing: "0.3px",
      paddingLeft: "12px",
      paddingRight: "12px",
      whiteSpace: "nowrap",
      wordBreak: "keep-all",
      overflow: "visible",
      textOverflow: "unset",
    },
  },
  cells: {
    style: {
      fontSize: "13px",
      paddingLeft: "12px",
      paddingRight: "12px",
      paddingTop: "10px",
      paddingBottom: "10px",
    },
  },
  rows: {
    style: {
      minHeight: "54px",
      "&:hover": {
        backgroundColor: "#f8fdfb",
      },
    },
  },
};

const BloodAnalysis = () => {

     const { lang } = useLang(); // get current language from context

  //Branches selection
    const { selectedBranch } = useBranch();
    const [viewUserDetailsModal, setViewUserDetailsModal] = useState(false);
    const [selectedViewUserId, setSelectedViewUserId] = useState(null);

    // Role detection (SuperAdmin: 1, BranchAdmin: 2, BranchOperator: 3, Patient: 4, LabOperator: 5)
    const currentUserRole = Number(localStorage.getItem("isRole")) || 1;
    const currentUserRoleType = localStorage.getItem("isRoleType") || "";
    const isLabOperator = currentUserRole === 5 || currentUserRoleType === "LabOperator";

    // Main Tab State: Default is "lab_requests" (Tab 1: Lab, Tab 2: Patient Observation)
    const [mainTab, setMainTab] = useState("lab_requests");

    // Quick Patient Select Modal for Lab Tab (+ Create Blood Analysis Form)
    const [quickPatientModalOpen, setQuickPatientModalOpen] = useState(false);
    const [quickPatientSearch, setQuickPatientSearch] = useState("");

    // Patient Observations Vitals State (Screenshot 5: W, SPO2, BP)
    const [patientObservations, setPatientObservations] = useState(() => {
      try {
        const saved = localStorage.getItem(`gks_patient_observations_${selectedBranch}`);
        return saved ? JSON.parse(saved) : {};
      } catch {
        return {};
      }
    });

    const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
    const [selectedPatientForObservation, setSelectedPatientForObservation] = useState(null);
    const [observationFormData, setObservationFormData] = useState({
      date_of_observation: new Date(),
      weight: "",
      spo2: "",
      blood_pressure: "",
      pulse_rate: "",
      remarks: "",
    });
    const [viewObservationModalOpen, setViewObservationModalOpen] = useState(false);
    const [selectedObservationForView, setSelectedObservationForView] = useState(null);
    const [obsDraftTimestamp, setObsDraftTimestamp] = useState(null);

    // Lab requests states
    const [labRequests, setLabRequests] = useState([]);
    const [labRequestsLoading, setLabRequestsLoading] = useState(false);
    const [labSearchText, setLabSearchText] = useState("");
    const [activeKpiTile, setActiveKpiTile] = useState(null); // null | "all" | "pending_collection" | "overdue_samples" | "pending_reports"

    // Lab Operator Action Modals
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [selectedObservationForUpload, setSelectedObservationForUpload] = useState(null);
    const [uploadFormData, setUploadFormData] = useState({
      report_file: null,
      report_file_path: "",
      report_file_type: "PDF",
      remarks: "",
    });

    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedObservationForReview, setSelectedObservationForReview] = useState(null);
    const [reviewFormData, setReviewFormData] = useState({
      severity_id: "",
      severity_name: "",
      remarks: "",
      follow_up_date: "",
    });

    const handleViewUserDetails = (userId) => {
      setSelectedViewUserId(userId);
      setViewUserDetailsModal(true);
    };
  
    //Pring vide data in pdf format
    const pdfRef = useRef();
  
    //This React hook calculates a user's age based on their date of birth (dob) and returns the age on PFA form by create.
    const [selectedUser, setSelectedUser] = useState(null); // User data
    const dob = selectedUser?.dob;
    const patientCalAge = useCalculateAge(dob);
    console.log("DOB", patientCalAge);
  
    //All registered data list for creating SUD brif form
    //Registered Patient data
    const [data, setData] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [stillLoading, setstillLoading] = useState(true);
    useEffect(() => {
      const token = localStorage.getItem("Authorization");
  
      if (!selectedBranch) return; // avoid empty branch fetch
  
      fetch(
        `https://gks-yjdc.onrender.com/api/users?branch_id=${selectedBranch}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        }
      )
        .then((response) => {
          if (!response.ok) throw new Error("Failed to fetch FDA user details");
          return response.json();
        })
        .then((res) => {
          const users = res.data || []; // <-- Corrected from res.users
  
          const formatted = users.map((user) => {
            const admitDate = user.recent_admit_date
              ? new Date(user.recent_admit_date)
              : null;
            const BADate = user.recent_blood_analysis_date
              ? new Date(user.recent_blood_analysis_date)
              : null;
  
              let isBACompleted = false;
            let userStatus = (
              <p className="badge bg-warning text-dark p-2">{"Pending"}</p>
            );
            if (admitDate && BADate && admitDate > BADate) {
              isBACompleted = true;
              userStatus = <p className="badge bg-success p-2">{"Completed"}</p>;
            }
  
            const dischargeStatus = user.discharge_status_text || "Unknown";
  
            return {
              id: user.user_id,
              gks_id: user.gks_id || "N/A",
              recentBAId: user.recent_blood_analysis_id || " ",
              name: user.name,
              status: userStatus,
              isBACompleted,
              dischargeStatus: user.discharge_status,
              dischargeStatusText: dischargeStatus,
              isReadmission: user.is_readmission,
              recent_fda_id: user.recent_fda_id,
            };
          });
  
          setTimeout(() => {
            setData(formatted);
            setFilteredData(formatted);
            setstillLoading(false);
          }, 1000); // optional delay
        })
        .catch((error) => {
          console.error("Error fetching FDA user data:", error);
          setstillLoading(true);
        });
    }, [selectedBranch]);
  
    //Search filter on register datalist
    const [searchText, setSearchText] = useState("");
    const [filteredData, setFilteredData] = useState([]);
    //This search filter for above table where we are listing all register user list from user API
    const handleSearchChange = (e) => {
      const value = e.target.value.toLowerCase();
      setSearchText(value);
  
      const filtered = data.filter((item) =>
        item.name.toLowerCase().includes(value)
      );
  
      setFilteredData(filtered);
    };
    //Getting registred patient data into table row
    const tableColumns = [
      {
           name: `${getTranslation('GKS ID/GKS आईडी' , lang)}`,
        selector: (row) => row.gks_id,
        sortable: true,
        center: true,
      },
      // {
      //   name: "Recent BA ID's",
      //   selector: (row) => row.recentBAId,
      //   sortable: true,
      //   center: true,
      // },
      {
         name: `${getTranslation('Patient name/रोगी का नाम' , lang)}`,
        selector: (row) => row.name,
        sortable: true,
        cell: (row) => (
          <span
            style={{
              color: row.disabled ? "#999" : "#000",
              fontStyle: row.disabled ? "italic" : "normal",
            }}
          >
            {row.name} {row.disabled && "(disabled)"}
          </span>
        ),
      },
  
      {
       name: `${getTranslation('Action/क्रिया' , lang)}`,
        center: true,
        cell: (row) => {
          // Hide all actions if discharged
          if (row.dischargeStatus === 1) {
            return null;
          }
          return (
            //Showing action buttons on register user list on FDA page
            <div className="d-flex gap-2">
              {/* View User Details Icon */}
              <span
                onClick={() => handleViewUserDetails(row.id)}
                style={{ cursor: "pointer" }}
                title={getTranslation("View/देखना", lang)}
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
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </span>

              {/* Show Edit only if not discharged and readmission */}
              {row.dischargeStatus === 0 && row.isReadmission === 1 && (
                <span
                  onClick={() => handleBAprefill(row.recentBAId)}
                  style={{ cursor: "pointer" }}
                  title={getTranslation("Readmission Blood Analysis Form/पुनः प्रवेश रक्त विश्लेषण प्रपत्र",lang)}
                >
                  ✏️
                </span>
              )}

              {row.dischargeStatus === 0 && row.isReadmission === 0 && (
                <span
                  onClick={() => createSUDBrief(row.id)}
                  style={{
                    cursor: "pointer",
                  }}
                  title={getTranslation("Create Blood Analysis/रक्त विश्लेषण बनाएँ",lang)}
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
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="12" y1="8" x2="12" y2="16"></line>
      <line x1="8" y1="12" x2="16" y2="12"></line>
    </svg>
  </span>
)}
            </div>
          );
        },
      },
    ];
  
    //Get All Patient SUD Register Data
    const [searchTextone, setSearchTextone] = useState("");
    const [filteredDataone, setFilteredDataone] = useState([]);
    const [getfdaData, setfdaData] = useState([]);
    //This search filter for below one table where we are listing all FDA data entered by patient
    const handleSearchChangeone = (e) => {
      const value = e.target.value.toLowerCase();
      setSearchTextone(value);
  
      const allRegisterListFilter = getfdaData.filter((item) =>
        item.name.toLowerCase().includes(value)
      );
  
      setFilteredDataone(allRegisterListFilter);
    };
  
    const fetchBAEntries = useCallback(() => {
      const token = localStorage.getItem("Authorization");
      if (!selectedBranch) return;

      fetch(
        `https://gks-yjdc.onrender.com/api/medical-observations/all-entries?branch_id=${selectedBranch}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        }
      )
        .then((response) => {
          if (!response.ok) {
            return fetch(`https://gks-yjdc.onrender.com/api/blood-analysis/all-entries?branch_id=${selectedBranch}`, {
              headers: { "Content-Type": "application/json", Authorization: `${token}` },
            });
          }
          return response;
        })
        .then((response) => response.json())
        .then((res) => {
          const baEntries = res.data || [];

          const formattedBAPatients = baEntries.map((item) => ({
            // top level
            blood_analysis_id: item.blood_analysis_id || item.id,
            status: item.status || "Scheduled",
            follow_up_visit: item.follow_up_visit || 1,
            follow_up_date: item.follow_up_date || null,

            // user details
            user_id: item.user_id || null,
            name: item.name || "",
            phone: item.phone || "",
            email: item.email || "",
            gks_id: item.gks_id || "",
            dob: item.dob || null,
            gender: item.gender || "",
            branch_name: item.branch_name || "",
            custom_code: item.custom_code || "",

            // entry details
            entry_id: item.entry_id || null,
            visit_no: item.visit_no || null,
            admit_date: item.admit_date || null,
            ward_name: item.ward_name || "",

            // assessment details
            date_of_assessment: item.date_of_assessment || null,
            sample_collected: item.sample_collected || "No",
            sample_collection_time: item.sample_collection_time || null,
            package_name: item.package_name || "",
            package_description: item.package_description || "",
            severity_name: item.severity_name || "",
            severity_description: item.severity_description || "",

            // report details
            report_file_path: item.report_file_path || "",
            report_file_type: item.report_file_type || "",
            remarks: item.remarks || "",

            // audit (meta info)
            created_at: item.created_at || null,
            updated_at: item.updated_at || null,
          }));

          setfdaData(formattedBAPatients);
          setFilteredDataone(formattedBAPatients);
          setstillLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching Medical Observations entries:", error);
          setstillLoading(false);
        });
    }, [selectedBranch]);

    const fetchLabRequests = useCallback(() => {
      const token = localStorage.getItem("Authorization");
      if (!selectedBranch) return;
      setLabRequestsLoading(true);

      const localQueueKey = `gks_offline_lab_requests_${selectedBranch}`;
      let localList = [];
      try {
        localList = JSON.parse(localStorage.getItem(localQueueKey) || "[]");
      } catch {
        localList = [];
      }

      fetch(
        `https://gks-yjdc.onrender.com/api/medical-observations/lab-requests?branch_id=${selectedBranch}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        }
      )
        .then((response) => {
          if (!response.ok) {
            return fetch(`https://gks-yjdc.onrender.com/api/blood-analysis/all-entries?branch_id=${selectedBranch}`, {
              headers: { "Content-Type": "application/json", Authorization: `${token}` },
            });
          }
          return response;
        })
        .then((response) => response.json())
        .then((res) => {
          const list = Array.isArray(res?.data) ? res.data : [];
          // Merge local offline queued records with backend records
          const merged = [
            ...localList.filter(loc => !list.some(r => String(r.blood_analysis_id || r.id) === String(loc.blood_analysis_id || loc.id))),
            ...list,
          ];
          setLabRequests(merged);
          setLabRequestsLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching lab requests:", err);
          setLabRequests(localList);
          setLabRequestsLoading(false);
        });
    }, [selectedBranch]);

    useEffect(() => {
      fetchBAEntries();
      fetchLabRequests();
    }, [fetchBAEntries, fetchLabRequests]);

    // SLA calculation helper (48h for sample collection, 72h for report upload)
    const getSLAInfo = (row) => {
      const s = row.status || "Scheduled";
      if (s === "Scheduled") {
        const dateRef = row.date_of_assessment || row.created_at;
        if (!dateRef) return { isOverdue: false, text: "48h SLA Active", hours: 0, color: "warning" };
        const hours = Math.max(0, Math.floor((Date.now() - new Date(dateRef).getTime()) / 3600000));
        const isOverdue = hours > 48;
        return {
          isOverdue,
          hours,
          color: isOverdue ? "danger" : "warning",
          text: isOverdue ? (hours > 96 ? "Overdue (>48h)" : `Overdue (${hours}h > 48h)`) : `Pending (${hours}h/48h)`,
        };
      }
      if (s === "Sample_Collected") {
        const dateRef = row.sample_collection_time || row.updated_at || row.created_at;
        if (!dateRef) return { isOverdue: false, text: "72h SLA Active", hours: 0, color: "info" };
        const hours = Math.max(0, Math.floor((Date.now() - new Date(dateRef).getTime()) / 3600000));
        const isOverdue = hours > 72;
        return {
          isOverdue,
          hours,
          color: isOverdue ? "danger" : "info",
          text: isOverdue ? (hours > 144 ? "Overdue (>72h)" : `Overdue (${hours}h > 72h)`) : `Pending (${hours}h/72h)`,
        };
      }
      if (s === "Report_Uploaded") {
        return { isOverdue: false, hours: 0, color: "primary", text: "Ready for Review" };
      }
      return { isOverdue: false, hours: 0, color: "success", text: s };
    };

    // Lab Operator Action Handlers
    const handleCollectSample = async (row) => {
      const obsId = row.blood_analysis_id || row.id;
      const confirm = await Swal.fire({
        title: getTranslation("Collect Blood Sample? / रक्त का नमूना एकत्र करें?", lang),
        text: `${getTranslation("Record blood/sample collection for", lang)} ${row.name || "Patient"}?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#24695c",
        cancelButtonColor: "#6c757d",
        confirmButtonText: getTranslation("Yes, Mark Collected / हाँ, एकत्र किया गया", lang),
        cancelButtonText: getTranslation("Cancel / रद्द करें", lang),
      });

      if (!confirm.isConfirmed) return;

      const token = localStorage.getItem("Authorization");
      const branch_id = selectedBranch;
      try {
        let res = await fetch(
          `https://gks-yjdc.onrender.com/api/medical-observations/collect-sample/${obsId}?branch_id=${branch_id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `${token}` },
            body: JSON.stringify({
              sample_collected: "Yes",
              sample_collection_time: new Date().toISOString(),
            }),
          }
        );
        if (!res.ok) {
          res = await fetch(
            `https://gks-yjdc.onrender.com/api/blood-analysis/update-assessment/${obsId}?branch_id=${branch_id}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json", Authorization: `${token}` },
              body: JSON.stringify({
                sample_collected: "Yes",
                sample_collection_time: new Date().toISOString(),
                status: "Sample_Collected",
              }),
            }
          );
        }
        // Also update local storage if item was scheduled locally
        const localQueueKey = `gks_offline_lab_requests_${branch_id}`;
        try {
          const localList = JSON.parse(localStorage.getItem(localQueueKey) || "[]");
          const idx = localList.findIndex(loc => String(loc.blood_analysis_id || loc.id) === String(obsId));
          if (idx >= 0) {
            localList[idx].status = "Sample_Collected";
            localList[idx].sample_collected = "Yes";
            localList[idx].sample_collection_time = new Date().toISOString();
            localStorage.setItem(localQueueKey, JSON.stringify(localList));
          }
        } catch (e) {
          console.warn("Local queue update:", e);
        }

        toast.success(getTranslation("Sample collection recorded successfully! / नमूना संग्रह सफलतापूर्वक दर्ज किया गया!", lang));
        fetchBAEntries();
        fetchLabRequests();
      } catch (err) {
        console.error(err);
        toast.error("Failed to update sample collection");
      }
    };

    const handleOpenUploadModal = (row) => {
      setSelectedObservationForUpload(row);
      setUploadFormData({
        report_file: null,
        report_file_path: "",
        report_file_type: "PDF",
        remarks: row.remarks || "",
      });
      setUploadModalOpen(true);
    };

    const handleUploadReportSubmit = async (e) => {
      e.preventDefault();
      if (!uploadFormData.report_file || !(uploadFormData.report_file instanceof File)) {
        toast.warning(getTranslation("Please select a valid report file (PDF, JPEG, or PNG, max 10 MB) / कृपया एक मान्य रिपोर्ट फ़ाइल चुनें (अधिकतम 10 MB)", lang));
        return;
      }
      if (uploadFormData.report_file.size > 10 * 1024 * 1024) {
        toast.error(getTranslation("Report file size exceeds 10 MB limit / फ़ाइल का आकार 10 MB से अधिक है", lang));
        return;
      }
      const obsId = selectedObservationForUpload?.blood_analysis_id || selectedObservationForUpload?.id;
      const token = localStorage.getItem("Authorization") || "";
      const rawToken = token.startsWith("Bearer ") ? token.slice(7).trim() : token.trim();
      const branch_id = selectedBranch;

      try {
        const formDataPayload = new FormData();
        formDataPayload.append("report_file", uploadFormData.report_file, uploadFormData.report_file.name);

        if (uploadFormData.remarks) {
          formDataPayload.append("remarks", uploadFormData.remarks);
        }

        let res = await fetch(
          `https://gks-yjdc.onrender.com/api/medical-observations/upload-report/${obsId}?branch_id=${branch_id}`,
          {
            method: "PUT",
            headers: {
              ...(rawToken ? { Authorization: rawToken } : {}),
            },
            body: formDataPayload,
          }
        );

        if (!res.ok) {
          res = await fetch(
            `https://gks-yjdc.onrender.com/api/blood-analysis/upload-report/${obsId}?branch_id=${branch_id}`,
            {
              method: "PUT",
              headers: {
                ...(rawToken ? { Authorization: rawToken } : {}),
              },
              body: formDataPayload,
            }
          );
        }

        const data = await res.json().catch(() => null);
        const uploadedFilePath = data?.data?.report_file_path || data?.report_file_path || uploadFormData.report_file_path || "Medical_Observation_Report.pdf";

        // Also update local storage if item was scheduled locally
        const localQueueKey = `gks_offline_lab_requests_${branch_id}`;
        try {
          const localList = JSON.parse(localStorage.getItem(localQueueKey) || "[]");
          const idx = localList.findIndex(loc => String(loc.blood_analysis_id || loc.id) === String(obsId));
          if (idx >= 0) {
            localList[idx].status = "Report_Uploaded";
            localList[idx].report_file_path = uploadedFilePath;
            localList[idx].remarks = uploadFormData.remarks;
            localStorage.setItem(localQueueKey, JSON.stringify(localList));
          }
        } catch (e) {
          console.warn("Local queue update:", e);
        }

        if (!res.ok) {
          // Check if local queue record
          const localQueueKey = `gks_offline_lab_requests_${branch_id}`;
          const localList = JSON.parse(localStorage.getItem(localQueueKey) || "[]");
          const isLocal = localList.some(loc => String(loc.blood_analysis_id || loc.id) === String(obsId)) || selectedObservationForUpload?.is_local;
          if (isLocal) {
            toast.success(getTranslation("Report uploaded successfully (Local Queue)! / रिपोर्ट सफलतापूर्वक अपलोड की गई!", lang));
            setUploadModalOpen(false);
            fetchBAEntries();
            fetchLabRequests();
            return;
          }

          const detailMsg = Array.isArray(data?.details) && data.details[0]?.message
            ? data.details[0].message
            : data?.error || data?.message || getTranslation("Report file is required (PDF, JPEG or PNG, max 10 MB)", lang);
          toast.error(detailMsg);
          return;
        }

        toast.success(getTranslation("Report uploaded successfully! / रिपोर्ट सफलतापूर्वक अपलोड की गई!", lang));
        setUploadModalOpen(false);
        fetchBAEntries();
        fetchLabRequests();
      } catch (err) {
        console.error(err);
        toast.error("Failed to upload report");
      }
    };

    const handleOpenReviewModal = (row) => {
      setSelectedObservationForReview(row);
      setReviewFormData({
        severity_id: row.severity_id || "",
        severity_name: row.severity_name || "",
        remarks: row.remarks || "",
        follow_up_date: row.follow_up_date || "",
      });
      setReviewModalOpen(true);
    };

    const handleReviewReportSubmit = async (e) => {
      e.preventDefault();
      const obsId = selectedObservationForReview?.blood_analysis_id || selectedObservationForReview?.id;
      const token = localStorage.getItem("Authorization");
      const branch_id = selectedBranch;

      try {
        const payload = {
          severity_id: reviewFormData.severity_id,
          severity_name: reviewFormData.severity_name,
          remarks: reviewFormData.remarks,
          follow_up_date: reviewFormData.follow_up_date || null,
          status: reviewFormData.follow_up_date ? "Next_follow_up" : "Completed",
        };

        let res = await fetch(
          `https://gks-yjdc.onrender.com/api/medical-observations/review-report/${obsId}?branch_id=${branch_id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `${token}` },
            body: JSON.stringify(payload),
          }
        );
        if (!res.ok) {
          res = await fetch(
            `https://gks-yjdc.onrender.com/api/blood-analysis/update-assessment/${obsId}?branch_id=${branch_id}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json", Authorization: `${token}` },
              body: JSON.stringify(payload),
            }
          );
        }
        // Also update local storage if item was scheduled locally
        const localQueueKey = `gks_offline_lab_requests_${branch_id}`;
        try {
          const localList = JSON.parse(localStorage.getItem(localQueueKey) || "[]");
          const idx = localList.findIndex(loc => String(loc.blood_analysis_id || loc.id) === String(obsId));
          if (idx >= 0) {
            localList[idx].status = payload.status;
            localList[idx].severity_id = payload.severity_id;
            localList[idx].severity_name = payload.severity_name;
            localList[idx].remarks = payload.remarks;
            localList[idx].follow_up_date = payload.follow_up_date;
            localStorage.setItem(localQueueKey, JSON.stringify(localList));
          }
        } catch (e) {
          console.warn("Local queue update:", e);
        }

        if (!res.ok) {
          const localQueueKey = `gks_offline_lab_requests_${branch_id}`;
          const localList = JSON.parse(localStorage.getItem(localQueueKey) || "[]");
          const isLocal = localList.some(loc => String(loc.blood_analysis_id || loc.id) === String(obsId)) || selectedObservationForReview?.is_local;
          if (isLocal) {
            toast.success(getTranslation("Report reviewed & follow-up updated (Local Queue)! / रिपोर्ट की समीक्षा की गई!", lang));
            setReviewModalOpen(false);
            fetchBAEntries();
            fetchLabRequests();
            return;
          }
        }

        toast.success(getTranslation("Report reviewed & follow-up updated! / रिपोर्ट की समीक्षा की गई एवं अनुवर्ती स्थिति अपडेट हुई!", lang));
        setReviewModalOpen(false);
        fetchBAEntries();
        fetchLabRequests();
      } catch (err) {
        console.error(err);
        toast.error("Failed to update review");
      }
    };

    const tableColumnsBAList = [
      {
        name: getTranslation("Blood Analysis ID/रक्त विश्लेषण आईडी",lang),
        selector: (row) => row.blood_analysis_id,
        sortable: true,
        center: true,
      },
      // { name: "GKS ID", selector: (row) => row.gks_id, sortable: true, center: true },
      {
       name: `${getTranslation('Patient name/रोगी का नाम' , lang)}`,
        selector: (row) => row.name,
        sortable: true,
        cell: (row) => (
          <span
            style={{
              color: row.disabled ? "#999" : "#000",
              fontStyle: row.disabled ? "italic" : "normal",
            }}
          >
            {row.name} {row.disabled && "(disabled)"}
          </span>
        ),
      },
      {
        name: `${getTranslation('Package(s) / पैकेज' , lang)}`,
        selector: (row) => row.package_name,
        sortable: true,
        cell: (row) => (
          <span className="fw-semibold text-dark">
            {Array.isArray(row.package_name) ? row.package_name.join(", ") : row.package_name || "—"}
          </span>
        ),
      },
      {
        name: `${getTranslation('Visit # / विज़िट' , lang)}`,
        selector: (row) => row.follow_up_visit || 1,
        sortable: true,
        center: true,
        cell: (row) => (
          <Badge color="light" className="text-dark border">
            #{row.follow_up_visit || 1}
          </Badge>
        ),
      },
      {
        name: `${getTranslation('Patient Phone/मरीज़ का फ़ोन' , lang)}`,
        selector: (row) => row.phone,
        sortable: true,
        center: true,
      },
      {
        name: `${getTranslation('Status/स्थिति' , lang)}`,
        selector: (row) => row.status,
        sortable: true,
        cell: (row) => {
          const s = row.status || "Scheduled";
          if (s === "Scheduled") return <Badge color="warning" className="text-dark p-2">Scheduled</Badge>;
          if (s === "Sample_Collected") return <Badge color="info" className="p-2">Sample Collected</Badge>;
          if (s === "Report_Uploaded") return <Badge color="primary" className="p-2">Report Uploaded</Badge>;
          if (s === "Next_follow_up") return <Badge color="secondary" className="p-2">Next Follow-Up</Badge>;
          return <Badge color="success" className="p-2">{s}</Badge>;
        },
      },
      {
        name: `${getTranslation('Action/क्रिया' , lang)}`,
        center: true,
        cell: (row) => (
          <div className="d-flex gap-2">
            <span
              onClick={() => viewBAFormData(row.blood_analysis_id)}
              style={{ cursor: "pointer" }}
              title="View/देखना"
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
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </span>
            {row.status === "Report_Uploaded" && (
              <span
                onClick={() => handleOpenReviewModal(row)}
                style={{ cursor: "pointer", marginLeft: "6px" }}
                title={getTranslation("Review Report & Follow-up / रिपोर्ट समीक्षा", lang)}
              >
                <CheckCircle size={18} color="#24695c" />
              </span>
            )}
            <span
              onClick={() => handleBAindividualEdit(row.blood_analysis_id)}
              style={{ cursor: "pointer", marginLeft: "10px" }}
              title="Edit/संपादन करना"
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
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </span>
          </div>
        ),
      },
    ];

    const getKpiTileRequests = (tileKey) => {
      if (!tileKey || tileKey === "all") return labRequests;
      if (tileKey === "pending_collection") {
        return labRequests.filter(
          (r) => r.status === "Scheduled" || !r.sample_collected || r.sample_collected === "No"
        );
      }
      if (tileKey === "overdue_samples") {
        return labRequests.filter(
          (r) =>
            (r.status === "Scheduled" || !r.sample_collected || r.sample_collected === "No") &&
            getSLAInfo(r).isOverdue
        );
      }
      if (tileKey === "pending_reports") {
        return labRequests.filter((r) => r.status === "Sample_Collected");
      }
      return labRequests;
    };

    const activeTileMeta = {
      all: {
        title: getTranslation("Total Active Requests / कुल सक्रिय अनुरोध", lang),
        color: "#1E6554",
        bg: "#f0fdf4",
        border: "#86efac",
      },
      pending_collection: {
        title: getTranslation("Pending Collection / लंबित नमूना संग्रह", lang),
        color: "#b45309",
        bg: "#fffbeb",
        border: "#fcd34d",
      },
      overdue_samples: {
        title: getTranslation("Overdue Samples (>48h) / विलंबित नमूने (>48 घंटे)", lang),
        color: "#dc2626",
        bg: "#fef2f2",
        border: "#fca5a5",
      },
      pending_reports: {
        title: getTranslation("Pending Reports / लंबित रिपोर्ट", lang),
        color: "#0284c7",
        bg: "#f0f9ff",
        border: "#7dd3fc",
      },
    };

    const quickTileRequests = useMemo(() => {
      if (!activeKpiTile) return [];
      return getKpiTileRequests(activeKpiTile);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [labRequests, activeKpiTile]);

    const filteredLabRequests = useMemo(() => {
      const baseList = activeKpiTile ? getKpiTileRequests(activeKpiTile) : labRequests;
      if (!labSearchText) return baseList;
      const lower = labSearchText.toLowerCase();
      return baseList.filter((item) =>
        (item.name && item.name.toLowerCase().includes(lower)) ||
        (item.custom_code && item.custom_code.toLowerCase().includes(lower)) ||
        (item.gks_id && String(item.gks_id).toLowerCase().includes(lower)) ||
        (item.blood_analysis_id && String(item.blood_analysis_id).includes(lower)) ||
        (item.status && item.status.toLowerCase().includes(lower)) ||
        (item.package_name && String(item.package_name).toLowerCase().includes(lower))
      );
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [labRequests, labSearchText, activeKpiTile]);

    const tableColumnsLabRequests = [
      {
        name: getTranslation("ID / आईडी", lang),
        selector: (row) => row.blood_analysis_id || row.id,
        sortable: true,
        width: "75px",
        center: true,
      },
      {
        name: getTranslation("Patient / रोगी", lang),
        selector: (row) => row.name,
        sortable: true,
        minWidth: "160px",
        cell: (row) => (
          <div>
            <div className="fw-semibold text-dark">{row.name || "—"}</div>
            <small className="text-muted">{row.custom_code || row.gks_id || (row.phone ? `Ph: ${row.phone}` : "")}</small>
          </div>
        ),
      },
      {
        name: getTranslation("Package(s) / पैकेज", lang),
        selector: (row) => row.package_name,
        sortable: true,
        minWidth: "160px",
        cell: (row) => (
          <span className="fw-semibold text-dark">
            {Array.isArray(row.package_name) ? row.package_name.join(", ") : row.package_name || "—"}
          </span>
        ),
      },
      {
        name: getTranslation("Visit # / विज़िट", lang),
        selector: (row) => row.follow_up_visit || 1,
        sortable: true,
        center: true,
        width: "90px",
        cell: (row) => (
          <Badge color="light" className="text-dark border">
            #{row.follow_up_visit || 1}
          </Badge>
        ),
      },
      {
        name: getTranslation("Status / स्थिति", lang),
        selector: (row) => row.status,
        sortable: true,
        minWidth: "140px",
        center: true,
        cell: (row) => {
          const s = row.status || "Scheduled";
          if (s === "Scheduled") return <Badge color="warning" className="text-dark p-2">Scheduled</Badge>;
          if (s === "Sample_Collected") return <Badge color="info" className="p-2">Sample Collected</Badge>;
          if (s === "Report_Uploaded") return <Badge color="primary" className="p-2">Report Uploaded</Badge>;
          if (s === "Next_follow_up") return <Badge color="secondary" className="p-2">Next Follow-Up</Badge>;
          return <Badge color="success" className="p-2">{s}</Badge>;
        },
      },
      {
        name: getTranslation("SLA Tracking / एसएलए स्थिति", lang),
        sortable: true,
        minWidth: "185px",
        center: true,
        selector: (row) => {
          const sla = getSLAInfo(row);
          return sla.hours;
        },
        cell: (row) => {
          const sla = getSLAInfo(row);
          return (
            <Badge
              color={sla.color}
              className="px-2.5 py-1.5 d-inline-flex align-items-center gap-1 shadow-sm"
              style={{
                fontSize: "11px",
                whiteSpace: "nowrap",
                maxWidth: "165px",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {sla.isOverdue ? <AlertCircle size={12} /> : <Clock size={12} />}
              <span className="text-truncate">{sla.text}</span>
            </Badge>
          );
        },
      },
      {
        name: getTranslation("Actions / कार्य", lang),
        center: true,
        minWidth: "220px",
        cell: (row) => {
          const s = row.status || "Scheduled";
          return (
            <div className="d-flex align-items-center justify-content-center gap-2">
              {/* View Observation (Left) */}
              <button
                type="button"
                className="btn btn-action-icon btn-action-view"
                style={{
                  width: "32px",
                  height: "32px",
                  minWidth: "32px",
                  padding: "0",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "7px",
                  backgroundColor: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  color: "#166534",
                  cursor: "pointer",
                }}
                onClick={() => viewBAFormData(row.blood_analysis_id || row.id)}
                title={getTranslation("View Observation / विवरण देखें", lang)}
              >
                <Eye size={16} color="#166534" strokeWidth={2.2} />
              </button>

              {/* Step 1: Collect Sample (Scheduled) */}
              {(s === "Scheduled" || row.sample_collected !== "Yes") && (
                <Button
                  color="warning"
                  size="sm"
                  className="py-1 px-2.5 d-inline-flex align-items-center gap-1 shadow-sm text-dark fw-semibold"
                  style={{ borderRadius: "7px", fontSize: "12px", height: "32px" }}
                  onClick={() => handleCollectSample(row)}
                  title={getTranslation("Collect Sample (48h SLA) / नमूना एकत्र करें", lang)}
                >
                  <Activity size={13} color="#212529" strokeWidth={2.2} />
                  <span>{getTranslation("Collect Sample", lang)}</span>
                </Button>
              )}

              {/* Step 2: Upload Report (Sample_Collected) */}
              {s === "Sample_Collected" && (
                <Button
                  color="info"
                  size="sm"
                  className="py-1 px-2.5 d-inline-flex align-items-center gap-1 text-white shadow-sm fw-semibold"
                  style={{ borderRadius: "7px", fontSize: "12px", height: "32px", backgroundColor: "#0284c7", borderColor: "#0284c7" }}
                  onClick={() => handleOpenUploadModal(row)}
                  title={getTranslation("Upload Report (72h SLA) / रिपोर्ट अपलोड करें", lang)}
                >
                  <Upload size={13} color="#ffffff" strokeWidth={2.2} />
                  <span>{getTranslation("Upload Report", lang)}</span>
                </Button>
              )}

              {/* Step 3: Review Report (Report_Uploaded) - only if SuperAdmin/BranchAdmin/BranchOperator */}
              {s === "Report_Uploaded" && !isLabOperator && (
                <Button
                  color="success"
                  size="sm"
                  className="py-1 px-2.5 d-inline-flex align-items-center gap-1 shadow-sm fw-semibold"
                  style={{ borderRadius: "7px", fontSize: "12px", height: "32px" }}
                  onClick={() => handleOpenReviewModal(row)}
                  title={getTranslation("Review Report & Next Follow-up / समीक्षा", lang)}
                >
                  <CheckCircle size={13} color="#ffffff" strokeWidth={2.2} />
                  <span>{getTranslation("Review", lang)}</span>
                </Button>
              )}

              {/* Delete Observation (Right - SuperAdmin / BranchAdmin) */}
              {(currentUserRole === 1 || currentUserRole === 2) && (
                <button
                  type="button"
                  className="btn btn-action-icon btn-action-delete"
                  style={{
                    width: "32px",
                    height: "32px",
                    minWidth: "32px",
                    padding: "0",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "7px",
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#dc2626",
                    cursor: "pointer",
                  }}
                  onClick={() => handleDeleteObservation(row.blood_analysis_id || row.id, row.name)}
                  title={getTranslation("Delete Observation / हटाएं", lang)}
                >
                  <Trash2 size={16} color="#dc2626" strokeWidth={2.2} />
                </button>
              )}
            </div>
          );
        },
      },
    ];

    // Delete Medical Observation handler
    const handleDeleteObservation = async (obsId, patientName) => {
      const confirm = await Swal.fire({
        title: getTranslation("Delete Medical Observation? / चिकित्सा अवलोकन हटाएं?", lang),
        text: `${getTranslation("Are you sure you want to delete observation for", lang)} ${patientName || "this patient"}?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: getTranslation("Yes, Delete / हाँ, हटाएं", lang),
        cancelButtonText: getTranslation("Cancel / रद्द करें", lang),
      });

      if (!confirm.isConfirmed) return;

      const token = localStorage.getItem("Authorization");
      try {
        let res = await fetch(
          `https://gks-yjdc.onrender.com/api/medical-observations/delete-assessment/${obsId}?branch_id=${selectedBranch}`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json", Authorization: `${token}` },
          }
        );
        if (!res.ok) {
          res = await fetch(
            `https://gks-yjdc.onrender.com/api/blood-analysis/delete-assessment/${obsId}?branch_id=${selectedBranch}`,
            {
              method: "DELETE",
              headers: { "Content-Type": "application/json", Authorization: `${token}` },
            }
          );
        }
        // Also delete from local queue if present
        const localQueueKey = `gks_offline_lab_requests_${selectedBranch}`;
        try {
          const localExisting = JSON.parse(localStorage.getItem(localQueueKey) || "[]");
          const updated = localExisting.filter(loc => String(loc.blood_analysis_id || loc.id) !== String(obsId));
          localStorage.setItem(localQueueKey, JSON.stringify(updated));
        } catch (e) {
          console.warn("Local queue delete:", e);
        }

        toast.success(getTranslation("Observation deleted successfully / अवलोकन सफलतापूर्वक हटा दिया गया", lang));
        fetchBAEntries();
        fetchLabRequests();
      } catch (err) {
        console.error(err);
        toast.error(getTranslation("Failed to delete observation.", lang));
      }
    };

    // Columns for Admitted Patients (Order Lab Test inside Lab Tab)
    const tableColumnsOrderBA = [
      {
        name: getTranslation("GKS ID / आईडी", lang),
        selector: (row) => row.gks_id,
        sortable: true,
        center: true,
        minWidth: "115px",
        cell: (row) => (
          <span className="badge bg-light text-dark border px-2 py-1.5 fw-bold" style={{ fontSize: "12px", borderColor: "#cbd5e1" }}>
            {row.gks_id || "—"}
          </span>
        ),
      },
      {
        name: getTranslation("Patient Name / रोगी का नाम", lang),
        selector: (row) => row.name,
        sortable: true,
        minWidth: "170px",
        cell: (row) => (
          <div className="py-1">
            <div className="fw-bold text-dark" style={{ fontSize: "13.5px" }}>{row.name}</div>
            <small className="text-muted fw-semibold">{row.phone ? `Ph: ${row.phone}` : ""}</small>
          </div>
        ),
      },
      {
        name: getTranslation("Status / स्थिति", lang),
        selector: (row) => row.status,
        sortable: true,
        center: true,
        minWidth: "130px",
        cell: (row) => row.status,
      },
      {
        name: getTranslation("Action / कार्य", lang),
        center: true,
        minWidth: "180px",
        cell: (row) => (
          <div className="d-flex align-items-center justify-content-center gap-2">
            <button
              type="button"
              className="btn btn-action-icon btn-action-neutral"
              style={{
                width: "32px",
                height: "32px",
                minWidth: "32px",
                padding: "0",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "7px",
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                color: "#475569",
                cursor: "pointer",
              }}
              title={getTranslation("View Patient / देखना", lang)}
              onClick={() => handleViewUserDetails(row.id)}
            >
              <Eye size={16} color="#475569" strokeWidth={2.2} />
            </button>
            <Button
              color="primary"
              size="sm"
              className="py-1 px-2.5 d-inline-flex align-items-center gap-1 shadow-sm"
              style={{ borderRadius: "6px", fontSize: "12.5px" }}
              onClick={() => createSUDBrief(row.id)}
              title={getTranslation("Create Blood Analysis / रक्त विश्लेषण बनाएं", lang)}
            >
              <Plus size={14} />
              <span>{getTranslation("Order Lab Test", lang)}</span>
            </Button>
          </div>
        ),
      },
    ];

    // Columns for Patient Physical Observations Table (Screenshot 5: W, SPO2, BP)
    const tableColumnsPatientObservations = [
      {
        name: getTranslation("GKS ID / आईडी", lang),
        selector: (row) => row.gks_id,
        sortable: true,
        center: true,
        minWidth: "115px",
        cell: (row) => (
          <span
            className="badge bg-light text-dark border px-2 py-1.5 fw-bold"
            style={{ fontSize: "12px", borderColor: "#cbd5e1" }}
          >
            {row.gks_id || "—"}
          </span>
        ),
      },
      {
        name: getTranslation("Patient Name / रोगी का नाम", lang),
        selector: (row) => row.name,
        sortable: true,
        minWidth: "170px",
        cell: (row) => (
          <div className="py-1">
            <div className="fw-bold text-dark" style={{ fontSize: "13.5px" }}>
              {row.name || "—"}
            </div>
            <small className="text-muted fw-semibold">
              {row.phone ? `Ph: ${row.phone}` : (row.dischargeStatusText || "")}
            </small>
          </div>
        ),
      },
      {
        name: getTranslation("Observation Date / तिथि", lang),
        selector: (row) => {
          const obs = patientObservations[String(row.id)];
          return obs?.date_of_observation || "—";
        },
        sortable: true,
        center: true,
        minWidth: "130px",
        cell: (row) => {
          const obs = patientObservations[String(row.id)];
          return (
            <span className="text-secondary fw-medium" style={{ fontSize: "12.5px" }}>
              {obs?.date_of_observation ? new Date(obs.date_of_observation).toLocaleDateString() : "—"}
            </span>
          );
        },
      },
      {
        name: getTranslation("W — Weight / वजन", lang),
        selector: (row) => {
          const obs = patientObservations[String(row.id)];
          return obs?.weight || row.weight || 0;
        },
        sortable: true,
        center: true,
        minWidth: "130px",
        cell: (row) => {
          const obs = patientObservations[String(row.id)];
          const val = obs?.weight || row.weight;
          if (!val) return <span className="text-muted">—</span>;
          return (
            <Badge color="light" className="text-dark border px-2.5 py-1.5 fw-semibold" style={{ fontSize: "12px" }}>
              ⚖️ {val} kg
            </Badge>
          );
        },
      },
      {
        name: getTranslation("SpO2 (%) / ऑक्सीजन", lang),
        selector: (row) => {
          const obs = patientObservations[String(row.id)];
          return obs?.spo2 || row.spo2 || 0;
        },
        sortable: true,
        center: true,
        minWidth: "135px",
        cell: (row) => {
          const obs = patientObservations[String(row.id)];
          const val = obs?.spo2 || row.spo2 || row.spo2_percentage;
          if (!val) return <span className="text-muted">—</span>;
          const num = Number(val);
          const bg = num >= 95 ? "#dcfce7" : num >= 90 ? "#fef3c7" : "#fee2e2";
          const color = num >= 95 ? "#166534" : num >= 90 ? "#92400e" : "#991b1b";
          const border = num >= 95 ? "#bbf7d0" : num >= 90 ? "#fde68a" : "#fecaca";
          return (
            <span
              className="badge px-2.5 py-1.5 fw-bold"
              style={{ backgroundColor: bg, color, border: `1px solid ${border}`, fontSize: "12px" }}
            >
              🫁 {val}%
            </span>
          );
        },
      },
      {
        name: getTranslation("BP / रक्तचाप", lang),
        selector: (row) => {
          const obs = patientObservations[String(row.id)];
          return obs?.blood_pressure || row.blood_pressure || "—";
        },
        sortable: true,
        center: true,
        minWidth: "140px",
        cell: (row) => {
          const obs = patientObservations[String(row.id)];
          const val = obs?.blood_pressure || row.blood_pressure;
          if (!val) return <span className="text-muted">—</span>;
          return (
            <span
              className="badge px-2.5 py-1.5 fw-semibold"
              style={{ backgroundColor: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe", fontSize: "12px" }}
            >
              🩺 {val} mmHg
            </span>
          );
        },
      },
      {
        name: getTranslation("Status / स्थिति", lang),
        selector: (row) => {
          const obs = patientObservations[String(row.id)];
          return obs ? "Recorded" : "Pending";
        },
        sortable: true,
        center: true,
        minWidth: "120px",
        cell: (row) => {
          const obs = patientObservations[String(row.id)];
          if (obs) {
            return (
              <Badge color="success" className="px-2 py-1">
                ✓ Recorded
              </Badge>
            );
          }
          return (
            <Badge color="warning" className="text-dark px-2 py-1">
              Pending
            </Badge>
          );
        },
      },
      {
        name: getTranslation("Action / कार्य", lang),
        center: true,
        minWidth: "190px",
        cell: (row) => {
          const obs = patientObservations[String(row.id)];
          return (
            <div className="d-flex align-items-center justify-content-center gap-2">
              {obs && (
                <button
                  type="button"
                  className="btn btn-action-icon btn-action-neutral"
                  style={{
                    width: "32px",
                    height: "32px",
                    minWidth: "32px",
                    padding: "0",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "7px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    color: "#475569",
                    cursor: "pointer",
                  }}
                  title={getTranslation("View Observation / विवरण देखें", lang)}
                  onClick={() => handleViewPatientObservation(row)}
                >
                  <Eye size={16} color="#475569" strokeWidth={2.2} />
                </button>
              )}

              <Button
                color="primary"
                size="sm"
                className="py-1 px-2.5 d-inline-flex align-items-center gap-1 shadow-sm"
                style={{ borderRadius: "6px", fontSize: "12px" }}
                onClick={() => handleOpenObservationModal(row)}
                title={getTranslation("Record Patient Observation / अवलोकन दर्ज करें", lang)}
              >
                <Heart size={13} />
                <span>{obs ? getTranslation("Update Vitals", lang) : getTranslation("Record Vitals", lang)}</span>
              </Button>
            </div>
          );
        },
      },
    ];

    // Open Patient Observation Modal (Screenshot 5: W, SPO2, BP)
    const handleOpenObservationModal = async (patient) => {
      setSelectedPatientForObservation(patient);
      setSelectedUser(patient);

      const userId = patient.id || patient.user_id;
      const existing = patientObservations[String(userId)];

      const saved = loadDraft("patient_observation", userId);
      if (saved && saved.data) {
        setObservationFormData(saved.data);
        setObsDraftTimestamp(saved.savedAt);
      } else if (existing) {
        setObservationFormData({
          date_of_observation: existing.date_of_observation ? new Date(existing.date_of_observation) : new Date(),
          weight: existing.weight || "",
          spo2: existing.spo2 || "",
          blood_pressure: existing.blood_pressure || "",
          pulse_rate: existing.pulse_rate || "",
          remarks: existing.remarks || "",
        });
        setObsDraftTimestamp(null);
      } else {
        setObservationFormData({
          date_of_observation: new Date(),
          weight: patient.weight || "",
          spo2: patient.spo2 || patient.spo2_percentage || "",
          blood_pressure: patient.blood_pressure || "",
          pulse_rate: patient.pulse_rate || "",
          remarks: "",
        });
        setObsDraftTimestamp(null);
      }

      setIsObservationModalOpen(true);
    };

    // Save Patient Observation (W, SPO2, BP)
    const handleSavePatientObservation = async (e) => {
      e.preventDefault();

      const compulsory = [
        { label: getTranslation("Weight (W) / वजन (kg)", lang), value: observationFormData.weight },
        { label: getTranslation("SpO2 / ऑक्सीजन स्तर (%)", lang), value: observationFormData.spo2 },
        { label: getTranslation("Blood Pressure (BP) / रक्तचाप", lang), value: observationFormData.blood_pressure },
      ];

      if (!validateCompulsoryFields(compulsory, lang)) {
        return;
      }

      const userId = selectedPatientForObservation?.id || selectedPatientForObservation?.user_id;
      const dateStr = observationFormData.date_of_observation instanceof Date
        ? observationFormData.date_of_observation.toISOString().split("T")[0]
        : observationFormData.date_of_observation;

      const newObs = {
        observation_id: Date.now(),
        user_id: userId,
        gks_id: selectedPatientForObservation?.gks_id || "N/A",
        name: selectedPatientForObservation?.name,
        phone: selectedPatientForObservation?.phone,
        date_of_observation: dateStr,
        weight: parseFloat(observationFormData.weight) || 0,
        spo2: parseFloat(observationFormData.spo2) || 0,
        blood_pressure: observationFormData.blood_pressure?.trim() || "120/80",
        pulse_rate: observationFormData.pulse_rate ? parseInt(observationFormData.pulse_rate) : null,
        remarks: observationFormData.remarks?.trim() || "",
        recorded_at: new Date().toISOString(),
      };

      const updated = { ...patientObservations, [String(userId)]: newObs };
      setPatientObservations(updated);
      try {
        localStorage.setItem(`gks_patient_observations_${selectedBranch}`, JSON.stringify(updated));
      } catch {
        // ignore
      }

      // Also attempt backend sync via first-evaluation API
      try {
        const token = localStorage.getItem("Authorization");
        await fetch(
          `https://gks-yjdc.onrender.com/api/first-evaluation/create-assessment?branch_id=${selectedBranch}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `${token}` },
            body: JSON.stringify({
              user_id: userId,
              date_of_assessment: dateStr,
              weight: newObs.weight,
              spo2_percentage: Math.max(parseInt(newObs.spo2) || 0, 70),
              blood_pressure: newObs.blood_pressure,
              pulse_rate: newObs.pulse_rate || 72,
              remarks: newObs.remarks,
            }),
          }
        );
      } catch {
        // local storage persists it cleanly
      }

      clearDraft("patient_observation", userId);
      setObsDraftTimestamp(null);
      setIsObservationModalOpen(false);

      Swal.fire({
        icon: "success",
        title: getTranslation("Patient Observation Recorded / रोगी अवलोकन सफलतापूर्वक दर्ज", lang),
        text: `${getTranslation("Vitals saved for", lang)} ${selectedPatientForObservation?.name || "Patient"}: W: ${newObs.weight}kg, SpO2: ${newObs.spo2}%, BP: ${newObs.blood_pressure}`,
      });
    };

    const handleViewPatientObservation = (patient) => {
      const userId = patient.id || patient.user_id;
      const existing = patientObservations[String(userId)];
      setSelectedObservationForView(existing || {
        user_id: userId,
        gks_id: patient.gks_id || "N/A",
        name: patient.name,
        date_of_observation: new Date().toISOString().split("T")[0],
        weight: patient.weight || "—",
        spo2: patient.spo2 || patient.spo2_percentage || "—",
        blood_pressure: patient.blood_pressure || "—",
        pulse_rate: patient.pulse_rate || "—",
        remarks: "No additional remarks.",
      });
      setSelectedUser(patient);
      setViewObservationModalOpen(true);
    };


 



  //Crete BA form function start
  //Loading spinner
    const [isBAModalOpen, setIsBAModalOpen] = useState(false);
    const [draftTimestamp, setDraftTimestamp] = useState(null);

    const createSUDBrief = async (userId = null) => {
      setIsBAModalOpen(true);
      if (userId) {
        const saved = loadDraft("blood_analysis", userId);
        if (saved && saved.data) {
          setFormData(saved.data);
          setDraftTimestamp(saved.savedAt);
        } else {
          setFormData(initialBAFormData);
          setDraftTimestamp(null);
        }

        const token = localStorage.getItem("Authorization");
        const branch_id = selectedBranch;
  
        try {
          const response = await fetch(
            `https://gks-yjdc.onrender.com/api/users/${userId}?branch_id=${branch_id}`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `${token}`,
              },
            }
          );
          const data = await response.json();
          if (!response.ok) throw new Error("User fetch failed");
  
          // ✅ store the user object
          setSelectedUser(data.data[0]);
        } catch (error) {
          console.error("Fetch error:", error);
        }
      }
    };
   //Create BA form function start


   
   //spinner extract from other file
     const selectedSpinner = Data.find(
       (item) => item.spinnerClass === "loader-37"
     );
     //Loading spinner

     //Submit BA form hanlder start

     //Get packages from API start (with DEFAULT_OBSERVATION_PACKAGES fallback)
     const [packages, setPackages] = useState(DEFAULT_OBSERVATION_PACKAGES);

     // Helper to auto-provision Item Type "Medical Observations" and standard items if missing in branch
     const ensureMedicalObservationPackages = async (branchId, token) => {
       const rawToken = token ? (token.startsWith("Bearer ") ? token.slice(7).trim() : token.trim()) : "";
       const authHeaders = {
         "Content-Type": "application/json",
         ...(rawToken ? { Authorization: rawToken } : {}),
       };

       try {
         // 1. Check existing packages from package-types API
         let res = await fetch(
           `https://gks-yjdc.onrender.com/api/medical-observations/package-types?branch_id=${branchId}`,
           { method: "GET", headers: authHeaders }
         ).catch(() => null);
         if (!res || !res.ok) {
           res = await fetch(
             `https://gks-yjdc.onrender.com/api/blood-analysis/package-types?branch_id=${branchId}`,
             { method: "GET", headers: authHeaders }
           ).catch(() => null);
         }
         let json = await res?.json().catch(() => null);
         let list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
         if (list.length > 0) {
           const mapped = list.map((item) => ({
             package_type_id: Number(item.package_type_id || item.item_id || item.id),
             package_name: item.package_name || item.item_name || item.name,
             original_amount: Number(item.original_amount || item.amount || item.price) || 0,
             package_description: item.package_description || item.description || "",
           }));
           try {
             localStorage.setItem(`gks_med_packages_${branchId}`, JSON.stringify(mapped));
           } catch (e) {}
           return mapped;
         }

         // 2. Fetch all item types to find "Medical Observations"
         let typesRes = await fetch(
           `https://gks-yjdc.onrender.com/api/item-types/all?branch_id=${branchId}`,
           { method: "GET", headers: authHeaders }
         ).catch(() => null);
         if (!typesRes || !typesRes.ok) {
           typesRes = await fetch(
             `https://gks-yjdc.onrender.com/api/item-types?branch_id=${branchId}`,
             { method: "GET", headers: authHeaders }
           ).catch(() => null);
         }
         const typesJson = await typesRes?.json().catch(() => null);
         let typesList = Array.isArray(typesJson?.data) ? typesJson.data : Array.isArray(typesJson) ? typesJson : [];

         let medType = typesList.find(
           (t) => (t.item_type_name || t.name || "").toLowerCase().trim() === "medical observations"
         );

         // If not found, create "Medical Observations" item type
         if (!medType || !medType.id) {
           const createTypeRes = await fetch(
             `https://gks-yjdc.onrender.com/api/item-types?branch_id=${branchId}`,
             {
               method: "POST",
               headers: authHeaders,
               body: JSON.stringify({ item_type_name: "Medical Observations" }),
             }
           ).catch(() => null);
           const createdTypeJson = await createTypeRes?.json().catch(() => null);
           if (createTypeRes?.ok && (createdTypeJson?.data?.id || createdTypeJson?.id)) {
             medType = createdTypeJson.data || createdTypeJson;
           } else {
             // Re-check all item types in case it already existed (409)
             const recheck = await fetch(
               `https://gks-yjdc.onrender.com/api/item-types/all?branch_id=${branchId}`,
               { method: "GET", headers: authHeaders }
             ).catch(() => null);
             const recheckJson = await recheck?.json().catch(() => null);
             const recheckList = Array.isArray(recheckJson?.data) ? recheckJson.data : Array.isArray(recheckJson) ? recheckJson : [];
             medType = recheckList.find(
               (t) => (t.item_type_name || t.name || "").toLowerCase().includes("medical observation")
             );
           }
         }

         const typeId = medType?.id || medType?.item_type_id;

         if (typeId) {
           const standardPackages = [
             { name: "CBC", amount: 350 },
             { name: "LFT", amount: 650 },
             { name: "KFT", amount: 550 },
             { name: "Blood Sugar", amount: 120 },
             { name: "Lipid Profile", amount: 700 },
             { name: "Thyroid Profile", amount: 600 },
             { name: "Urine Routine & Microscopy", amount: 150 },
             { name: "Electrolytes", amount: 450 },
           ];

           for (const pkg of standardPackages) {
             await fetch(`https://gks-yjdc.onrender.com/api/items?branch_id=${branchId}`, {
               method: "POST",
               headers: authHeaders,
               body: JSON.stringify({
                 item_name: pkg.name,
                 item_type_id: Number(typeId),
                 original_amount: pkg.amount,
               }),
             }).catch(() => null);
           }

           // Re-fetch packages
           const refetchRes = await fetch(
             `https://gks-yjdc.onrender.com/api/medical-observations/package-types?branch_id=${branchId}`,
             { method: "GET", headers: authHeaders }
           ).catch(() => null);
           const refetchJson = await refetchRes?.json().catch(() => null);
           const refetchList = Array.isArray(refetchJson?.data) ? refetchJson.data : Array.isArray(refetchJson) ? refetchJson : [];
           if (refetchList.length > 0) {
             const mapped = refetchList.map((item) => ({
               package_type_id: Number(item.package_type_id || item.item_id || item.id),
               package_name: item.package_name || item.item_name || item.name,
               original_amount: Number(item.original_amount || item.amount || item.price) || 0,
               package_description: item.package_description || item.description || "",
             }));
             try {
               localStorage.setItem(`gks_med_packages_${branchId}`, JSON.stringify(mapped));
             } catch (e) {}
             return mapped;
           }
         }
       } catch (err) {
         console.warn("Auto-provision packages error:", err);
       }
       return null;
     };

     useEffect(() => {
      const fetchPackages = async () => {
        const token = localStorage.getItem("Authorization") || "";
        const rawToken = token.startsWith("Bearer ") ? token.slice(7).trim() : token.trim();
        const branch_id = selectedBranch;
  
        try {
          const cached = localStorage.getItem(`gks_med_packages_${branch_id}`);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed) && parsed.length > 0) setPackages(parsed);
            } catch (e) {}
          }

          let res = await fetch(
            `https://gks-yjdc.onrender.com/api/medical-observations/package-types?branch_id=${branch_id}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                ...(rawToken ? { Authorization: rawToken } : {}),
              },
            }
          );
          if (!res.ok) {
            res = await fetch(
              `https://gks-yjdc.onrender.com/api/blood-analysis/package-types?branch_id=${branch_id}`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  ...(rawToken ? { Authorization: rawToken } : {}),
                },
              }
            );
          }
  
          const data = await res.json().catch(() => null);
          const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  
          if (list.length > 0) {
            const normalized = list.map(item => ({
              package_type_id: Number(item.package_type_id || item.item_id || item.id),
              package_name: item.package_name || item.item_name || item.name,
              original_amount: Number(item.original_amount || item.amount || item.price) || 0,
              package_description: item.package_description || item.description || "",
            }));
            setPackages(normalized);
            try {
              localStorage.setItem(`gks_med_packages_${branch_id}`, JSON.stringify(normalized));
            } catch (e) {}
          } else {
            // Auto-provision if empty
            const provisioned = await ensureMedicalObservationPackages(branch_id, rawToken);
            if (provisioned && provisioned.length > 0) {
              setPackages(provisioned);
            } else {
              setPackages(DEFAULT_OBSERVATION_PACKAGES);
            }
          }
        } catch (error) {
          console.warn("Using default observation packages:", error);
          setPackages(DEFAULT_OBSERVATION_PACKAGES);
        }
      };
  
      if (selectedBranch) fetchPackages();
    }, [selectedBranch]);

    // Update patient observations state when branch changes
    useEffect(() => {
      if (!selectedBranch) return;
      try {
        const saved = localStorage.getItem(`gks_patient_observations_${selectedBranch}`);
        if (saved) setPatientObservations(JSON.parse(saved));
      } catch {
        // ignore
      }
    }, [selectedBranch]);

    //Get packages from API end


    //Get severity from API start
    const [severity, setSeverity] = useState([]);
     
    useEffect(() => {
     const fetchSeverity = async () => {
       const token = localStorage.getItem("Authorization");
       // use selectedBranch from props
       const branch_id = selectedBranch;
 
       try {
         const res = await fetch(
           `https://gks-yjdc.onrender.com/api/blood-analysis/severity-levels?branch_id=${branch_id}`,
           {
             method: "GET", // changed to GET if API supports it
             headers: {
               "Content-Type": "application/json",
               Authorization: `${token}`,
             },
             // body: JSON.stringify(payload), // remove if not needed
           }
         );
 
         const data = await res.json();
 
         if (data.success && data.data) {
          setSeverity(data.data); // no filter, all Severity
         }
         
       } catch (error) {
         console.error("Error fetching Severity:", error);
       }
     };
 
     if (selectedBranch) fetchSeverity();
   }, [selectedBranch]); // dependency fixed

   //Get severity from API end

   const [isLoading, setIsLoading] = useState(false);

   const initialBAFormData = {
    date_of_assessment: new Date(),
    package_type_id: [],
    package_name: [],
    sample_collected: false,
    sample_collection_time: new Date().toISOString(),
    severity_id: "",
    severity_name: "",
    report_file: "",
    report_file_type: "",
    remarks: "",
  };

   const [formData, setFormData] = useState(initialBAFormData);
  
 
 // Generic handler
const handleChange = (e) => {
  const { name, type, value, checked, files } = e.target;
  if (type === "checkbox") {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  } else if (type === "file") {
    setFormData((prev) => ({ ...prev, report_file: files[0] }));
  } else {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }
};

// Handle file change
const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    // detect type properly
    let fileType = "FILE";
    if (file.type.includes("pdf")) fileType = "PDF";
    else if (
      file.type.includes("jpg") ||
      file.type.includes("jpeg") ||
      file.type.includes("png")
    ) {
      fileType = "IMAGE";
    }

    setFormData((prev) => ({
      ...prev,
      report_file_path: file.name, // just "report.pdf"
      report_file_type: fileType,
    }));
  }
};


// Handle Multiple Package Toggle
const handlePackageToggle = (pkg) => {
  setFormData((prev) => {
    const currentIds = Array.isArray(prev.package_type_id)
      ? prev.package_type_id
      : prev.package_type_id ? [prev.package_type_id] : [];
    const currentNames = Array.isArray(prev.package_name)
      ? prev.package_name
      : prev.package_name ? [prev.package_name] : [];

    const isSelected = currentIds.some((id) => String(id) === String(pkg.package_type_id));
    let newIds;
    let newNames;
    if (isSelected) {
      newIds = currentIds.filter((id) => String(id) !== String(pkg.package_type_id));
      newNames = currentNames.filter((name) => name !== pkg.package_name);
    } else {
      newIds = [...currentIds, pkg.package_type_id];
      newNames = [...currentNames, pkg.package_name];
    }
    return {
      ...prev,
      package_type_id: newIds,
      package_name: newNames,
    };
  });
};

// Handle Severity Selection
const handleSeverityChange = (e) => {
  const selected = severity.find(
    (sev) => sev.severity_id.toString() === e.target.value
  );
  if (selected) {
    setFormData((prev) => ({
      ...prev,
      severity_id: selected.severity_id,
      severity_name: selected.severity_name,
    }));
  } else {
    setFormData((prev) => ({
      ...prev,
      severity_id: "",
      severity_name: "",
    }));
  }
};

const handleAssesmentDateChange = (name, date) => {
  setFormData((prev) => ({
    ...prev,
    [name]: date,
  }));
};

const SubmitBAFormHandler = async (e) => {
  e.preventDefault();

  const selectedPackageIds = Array.isArray(formData.package_type_id)
    ? formData.package_type_id
    : formData.package_type_id ? [formData.package_type_id] : [];

  // Strictly 3 mandatory fields: date_of_assessment, package_type_id, and package_name
  const compulsoryFieldDefinitions = [
    {
      label: getTranslation("Date of Assessment / मूल्यांकन की तिथि", lang),
      value: formData.date_of_assessment,
    },
    {
      label: getTranslation("Package Selection / पैकेज चयन", lang),
      value: selectedPackageIds.length > 0 ? selectedPackageIds : "",
    },
  ];

  if (!validateCompulsoryFields(compulsoryFieldDefinitions, lang)) {
    return;
  }

  setIsLoading(true);

  try {
    const token = localStorage.getItem("Authorization");
    const branch_id = selectedBranch;

    const selectedPackageNames = Array.isArray(formData.package_name)
      ? formData.package_name
      : formData.package_name ? [formData.package_name] : [];

    const payload = {
      user_id: selectedUser?.user_id || selectedUser?.id,
      date_of_assessment: formData.date_of_assessment instanceof Date
        ? formData.date_of_assessment.toISOString().split("T")[0]
        : formData.date_of_assessment,
      package_type_id: selectedPackageIds,
      package_name: selectedPackageNames,
      sample_collected: formData.sample_collected ? "Yes" : "No",
      sample_collection_time: formData.sample_collected ? (formData.sample_collection_time || new Date().toISOString()) : null,
      remarks: formData.remarks || "",
    };

    if (formData.severity_id) {
      payload.severity_id = formData.severity_id;
      payload.severity_name = formData.severity_name;
    }

    console.log("Payload to submit (Medical Observations):", payload);

    let response = await fetch(
      `https://gks-yjdc.onrender.com/api/medical-observations/create-assessment?branch_id=${branch_id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      response = await fetch(
        `https://gks-yjdc.onrender.com/api/blood-analysis/create-assessment?branch_id=${branch_id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
    }

    let data = await response.json().catch(() => null);

    if (!response.ok) {
      const errMsg = (data?.error || data?.message || "").toString();
      if (errMsg.toLowerCase().includes("not of item type") || errMsg.toLowerCase().includes("package")) {
        console.log("Package validation failed, attempting auto-provisioning and retry...");
        const provisioned = await ensureMedicalObservationPackages(branch_id, token);
        if (provisioned && provisioned.length > 0) {
          setPackages(provisioned);
          // Remap selected names to real provisioned package IDs
          const remappedIds = [];
          const remappedNames = [];
          selectedPackageNames.forEach((selName) => {
            const shortName = selName.split(" ")[0].toLowerCase();
            const matched = provisioned.find(
              (p) =>
                p.package_name.toLowerCase().includes(shortName) ||
                selName.toLowerCase().includes(p.package_name.toLowerCase())
            );
            if (matched) {
              remappedIds.push(matched.package_type_id);
              remappedNames.push(matched.package_name);
            }
          });

          if (remappedIds.length > 0) {
            payload.package_type_id = remappedIds;
            payload.package_name = remappedNames;
            console.log("Retrying create-assessment with provisioned IDs:", payload);
            response = await fetch(
              `https://gks-yjdc.onrender.com/api/medical-observations/create-assessment?branch_id=${branch_id}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `${token}` },
                body: JSON.stringify(payload),
              }
            );
            data = await response.json().catch(() => null);
          }
        }
      }
    }

    if (!response.ok) {
      const errMsg = (data?.error || data?.message || "").toString();
      if (errMsg.toLowerCase().includes("not of item type") || errMsg.toLowerCase().includes("package")) {
        // Fallback: Queue in local lab requests queue so staff/technician workflow is never blocked
        const offlineItem = {
          id: Date.now(),
          blood_analysis_id: Date.now(),
          user_id: payload.user_id,
          name: selectedUser?.name || "Patient",
          gks_id: selectedUser?.gks_id || "N/A",
          phone: selectedUser?.phone || "",
          gender: selectedUser?.gender || "",
          age: selectedUser?.age || "",
          date_of_assessment: payload.date_of_assessment,
          package_type_id: payload.package_type_id,
          package_name: payload.package_name,
          sample_collected: "No",
          status: "Scheduled",
          remarks: payload.remarks || "",
          created_at: new Date().toISOString(),
          is_local: true,
        };

        const localQueueKey = `gks_offline_lab_requests_${branch_id}`;
        try {
          const localExisting = JSON.parse(localStorage.getItem(localQueueKey) || "[]");
          localExisting.unshift(offlineItem);
          localStorage.setItem(localQueueKey, JSON.stringify(localExisting));
        } catch (e) {
          console.warn("Local storage write failed:", e);
        }

        setLabRequests((prev) => [offlineItem, ...prev]);
        setIsLoading(false);
        clearDraft("blood_analysis", selectedUser?.user_id || selectedUser?.id);
        setDraftTimestamp(null);
        closeAllmodal();

        Swal.fire({
          icon: "success",
          title: getTranslation("Blood Analysis Scheduled / रक्त विश्लेषण निर्धारित", lang),
          html: `
            <p class="mb-2">
              <strong>${selectedUser?.name || "Patient"}</strong> (${selectedPackageNames.join(", ")})
            </p>
            <div class="alert alert-info text-start py-2 px-3 small mb-0">
              <strong>${getTranslation("Workflow Status: Scheduled in Lab Queue", lang)}</strong><br/>
              ${getTranslation(
                "The assessment has been queued for Sample Collection (48h SLA) and Report Upload.",
                lang
              )}
            </div>
          `,
        });
        return;
      }

      setIsLoading(false);
      showApiErrorAlert(data, lang, getTranslation("Medical Observations Creation Failed / चिकित्सा अवलोकन निर्माण विफल", lang));
      return;
    }

    setIsLoading(false);

    clearDraft("blood_analysis", selectedUser?.user_id || selectedUser?.id);
    setDraftTimestamp(null);

    Swal.fire({
      icon: "success",
      title: getTranslation("Medical Observation Created Successfully / चिकित्सा अवलोकन सफलतापूर्वक बनाया गया", lang),
      text: getTranslation("Status set to Scheduled and bill drafted. Request sent to Lab Operator dashboard.", lang),
    }).then(() => {
      closeAllmodal();
      fetchBAEntries();
      fetchLabRequests();
    });

    console.log("Response Data:", data);
  } catch (err) {
    console.error(err);
    setIsLoading(false);
    Swal.fire({
      icon: "error",
      title: getTranslation("Unexpected Error/अप्रत्याशित त्रुटि",lang),
      text: getTranslation("Failed to submit. Check console for error./सबमिट करने में विफल. त्रुटि के लिए कंसोल की जाँच करें.",lang),
    });
  }
};


     //Submit BA form function end


     // View BA form function start
const [viewBAData, setViewBAData] = useState(null);
const [viewBAModal, setViewBAModal] = useState(false);

const viewBAFormData = async (bloodAnalysisId) => {
  setViewBAModal(true);
  console.log("Blood Analysis ID =>", bloodAnalysisId);

  if (!bloodAnalysisId) {
    console.error("Invalid Blood Analysis ID provided");
    return;
  }

  setIsLoading(true);
  const token = localStorage.getItem("Authorization");

  try {
    const branch_id = selectedBranch;
    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/blood-analysis/assessment/${bloodAnalysisId}?branch_id=${branch_id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      }
    );

    const data = await response.json();
    console.log("Raw BA API Response:", data);

    if (!response.ok) {
      console.error("Fetch error:", data);
      return;
    }

    // ✅ Extract from data.data
    const ViewBADataEntry = data.data || null;
    console.log("Extracted BA Data Entry:", ViewBADataEntry);

    if (!ViewBADataEntry) {
      console.warn("No Blood Analysis assessment data found./कोई ब्लड एनालिसिस असेसमेंट डेटा नहीं मिला।");
      return;
    }

    setViewBAData(ViewBADataEntry);
    console.log("Blood Analysis Data Fetched ID:", ViewBADataEntry.blood_analysis_id);
  } catch (error) {
    console.error("Fetch error:", error);
  } finally {
    setIsLoading(false);
  }
};
// View BA form function end



// Edit BA form function start
const parseDateString = (dateStr) => {
  if (!dateStr) return null;

  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};
const [BAEditData, setBAEditData] = useState(null);
const [IsBAEditModal, setIsBAEditModal] = useState(false);

const handleBAindividualEdit = async (editBAID = null) => {
  setIsBAEditModal(true);

  if (typeof editBAID === "object" && editBAID !== null) {
    editBAID = editBAID.blood_analysis_id;
  }

  if (!editBAID) {
    console.error("Invalid editBAID provided");
    return;
  }

  console.log("BA ID For Edit:", editBAID);
  const token = localStorage.getItem("Authorization");

  try {
    const branch_id = selectedBranch;
    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/blood-analysis/assessment/${editBAID}?branch_id=${branch_id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("BA fetch error:", data);
      return;
    }

    // ✅ Correct: pick from data.data
    const latestAssessment = data.data || null;

    if (!latestAssessment) {
      console.warn("No BA assessment found for this ID./इस ID के लिए कोई BA असेसमेंट नहीं मिला।");
      return;
    }

    setSelectedUser(latestAssessment);
    console.log("Selected BA User Assessment for edit:", latestAssessment);

    // ✅ Map payload into your BA form structure
    setBAEditData({
      blood_analysis_id: latestAssessment.blood_analysis_id,
      user_id: latestAssessment.user_id,
      entry_id: latestAssessment.entry_id,
      branch_id: latestAssessment.branch_id,
      visit_no: latestAssessment.visit_no,

      date_of_assessment: latestAssessment.date_of_assessment
        ? parseDateString(latestAssessment.date_of_assessment)
        : "",

      package_type_id: latestAssessment.package_type_id,
      package_name: latestAssessment.package_name,
      package_description: latestAssessment.package_description,

      sample_collected: latestAssessment.sample_collected,
      sample_collection_time: latestAssessment.sample_collection_time
        ? parseDateString(latestAssessment.sample_collection_time)
        : "",

      report_file_path: latestAssessment.report_file_path,
      report_file_type: latestAssessment.report_file_type,

      remarks: latestAssessment.remarks,

      severity_id: latestAssessment.severity_id,
      severity_name: latestAssessment.severity_name,
      severity_level_name: latestAssessment.severity_level_name,
      severity_description: latestAssessment.severity_description,

      status: latestAssessment.status,
      isActive: latestAssessment.isActive,
      created_by: latestAssessment.created_by,
      updated_by: latestAssessment.updated_by,
      created_at: latestAssessment.created_at,
      updated_at: latestAssessment.updated_at,

      // User details from API
      name: latestAssessment.name,
      phone: latestAssessment.phone,
      email: latestAssessment.email,
      gks_id: latestAssessment.gks_id,
      dob: latestAssessment.dob
        ? parseDateString(latestAssessment.dob)
        : "",
      gender: latestAssessment.gender,
      address: latestAssessment.address,
      custom_code: latestAssessment.custom_code,
      admit_date: latestAssessment.admit_date
        ? parseDateString(latestAssessment.admit_date)
        : "",
      ward_name: latestAssessment.ward_name,
      branch_name: latestAssessment.branch_name,
      user_branch_id: latestAssessment.user_branch_id,
    });

    console.log("Mapped BA Edit Data:", latestAssessment);
  } catch (error) {
    console.error("Fetch error:", error);
  }
};
// Edit BA form function end


// ✅ Update BA Form Data Handler start
const updateBAHandler = async (e) => {
  e.preventDefault();

  const compulsoryFieldDefinitions = [
    {
      label: getTranslation("Date of Assessment / मूल्यांकन की तिथि", lang),
      value: BAEditData?.date_of_assessment,
    },
    {
      label: getTranslation("Package Type / पैकेज प्रकार", lang),
      value: BAEditData?.package_type_id,
    },
    {
      label: getTranslation("Severity / गंभीरता", lang),
      value: BAEditData?.severity_id,
    },
  ];

  if (!validateCompulsoryFields(compulsoryFieldDefinitions, lang)) {
    return;
  }

  setIsLoading(true);

  const payload = {
    user_id: BAEditData?.user_id || "",
    date_of_assessment: BAEditData?.date_of_assessment
      ? new Date(BAEditData.date_of_assessment).toISOString().split("T")[0]
      : "",

    package_type_id: BAEditData?.package_type_id || "",
    package_name: BAEditData?.package_name || "",
    sample_collected: BAEditData?.sample_collected ? "Yes" : "No",
    sample_collection_time: BAEditData?.sample_collection_time
      ? new Date(BAEditData.sample_collection_time).toISOString()
      : "",

    severity_id: BAEditData?.severity_id || "",
    severity_name: BAEditData?.severity_name || "",
    remarks: BAEditData?.remarks || "",

    report_file_path: BAEditData?.report_file_path || "",
    report_file_type: BAEditData?.report_file_type || "",
  };

  console.log("Update BA Payload =>", payload);

  try {
    const token = localStorage.getItem("Authorization");
    const branch_id = selectedBranch;
    const response = await fetch(
     `https://gks-yjdc.onrender.com/api/blood-analysis/update-assessment/${BAEditData?.blood_analysis_id}?branch_id=${branch_id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      setIsLoading(false);
      showApiErrorAlert(result, lang, getTranslation("Blood Analysis Update Failed / रक्त विश्लेषण अद्यतन विफल", lang));
      return;
    }

    setIsLoading(false);
    Swal.fire({
      icon: "success",
      title: getTranslation("Blood Analysis Updated/रक्त विश्लेषण अद्यतन",lang),
      text: getTranslation("The blood analysis form has been successfully updated./रक्त विश्लेषण प्रपत्र सफलतापूर्वक अद्यतन कर दिया गया है।",lang),
    });
  } catch (error) {
    console.error("Fetch Error:", error);
    setIsLoading(false);
    Swal.fire({
      icon: "error",
      title: getTranslation("Network Error/नेटवर्क त्रुटि",lang),
      text: getTranslation("A network or server issue occurred./नेटवर्क या सर्वर संबंधी समस्या उत्पन्न हुई.",lang),
    });
  }
};

// ✅ Update BA Form Data Handler end



// ✅ Prefill BA form handler start
const [BAPrefillData, setBAPrefillData] = useState({});
const [BAPrefillModal, setBAPrefillModal] = useState(false);

const handleBAprefill = async (prefillBAID = null) => {
  if (typeof prefillBAID === "object" && prefillBAID !== null) {
    prefillBAID = prefillBAID.blood_analysis_id || prefillBAID.id;
  }

  // ✅ If no valid ID, stop here and don’t open modal
  if (!prefillBAID) {
    Swal.fire({
      icon: "warning",
      title: getTranslation("Missing Blood Analysis ID/गुम रक्त विश्लेषण आईडी",lang),
      text: getTranslation("Please provide a valid Blood Analysis ID before opening the form./कृपया फ़ॉर्म खोलने से पहले एक वैलिड ब्लड एनालिसिस ID दें।",lang),
    });
    return; // ⛔ stop execution
  }

  console.log("BA ID For Prefill:", prefillBAID);
  const token = localStorage.getItem("Authorization");

  try {
    const branch_id = selectedBranch;
    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/blood-analysis/assessment/${prefillBAID}?branch_id=${branch_id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      }
    );

    const data = await response.json();
    console.log("Raw BA API Response:", data);

    if (!response.ok) {
      Swal.fire({
        icon: "error",
        title: "Fetch Failed",
        text: data.message || getTranslation("Unable to fetch blood analysis data for prefill./प्रीफ़िल के लिए रक्त विश्लेषण डेटा प्राप्त करने में असमर्थ.",lang),
      });
      return;
    }

    const latestAssessment = data.data || null;
    if (!latestAssessment) {
      Swal.fire({
        icon: "info",
        title: getTranslation("No Data Found/डाटा प्राप्त नहीं हुआ",lang),
        text: getTranslation("No blood analysis data available for this ID./इस आईडी के लिए कोई रक्त विश्लेषण डेटा उपलब्ध नहीं है।",lang),
      });
      return;
    }

    // ✅ Open modal only when valid data
    setBAPrefillModal(true);

    // ✅ Wrap in array so PatientCommonInfo works (expects [0])
    setSelectedUser([latestAssessment]);

    // ✅ Map BA-specific fields
    const mappedData = {
      blood_analysis_id: latestAssessment.blood_analysis_id,
      user_id: latestAssessment.user_id,
      branch_id: latestAssessment.branch_id,
      entry_id: latestAssessment.entry_id,
      visit_no: latestAssessment.visit_no,

      date_of_assessment: latestAssessment.date_of_assessment
        ? new Date(latestAssessment.date_of_assessment)
        : null,

      package_type_id: latestAssessment.package_type_id,
      package_name: latestAssessment.package_name || "",
      package_description: latestAssessment.package_description || "",

      sample_collected: latestAssessment.sample_collected || "No",
      sample_collection_time: latestAssessment.sample_collection_time
        ? new Date(latestAssessment.sample_collection_time)
        : null,

      report_file_path: latestAssessment.report_file_path || "",
      report_file_type: latestAssessment.report_file_type || "",
      remarks: latestAssessment.remarks || "",

      severity_id: latestAssessment.severity_id,
      severity_name: latestAssessment.severity_name || "",
      severity_description: latestAssessment.severity_description || "",
      severity_level_name: latestAssessment.severity_level_name || "",

      status: latestAssessment.status || "",
      isActive: latestAssessment.isActive || 0,

      // User Info
      patient_name: latestAssessment.name || "",
      dob: latestAssessment.dob ? new Date(latestAssessment.dob) : null,
      gender: latestAssessment.gender || "",
      address: latestAssessment.address || "",
      gks_id: latestAssessment.gks_id || "",
      phone: latestAssessment.phone || "",
      email: latestAssessment.email || "",
      branch_name: latestAssessment.branch_name || "",
      custom_code: latestAssessment.custom_code || "",
      admit_date: latestAssessment.admit_date
        ? new Date(latestAssessment.admit_date)
        : null,
      ward_name: latestAssessment.ward_name || "",
    };

    setBAPrefillData(mappedData);

    console.log("✅ Mapped BA Prefill Data:", mappedData);
  } catch (error) {
    console.error("Prefill BA fetch error:", error);
    Swal.fire({
      icon: "error",
      title: "Network Error",
      text: getTranslation("Unable to fetch blood analysis data due to a network issue./नेटवर्क समस्या के कारण रक्त विश्लेषण डेटा प्राप्त करने में असमर्थ।",lang),
    });
  }
};
// ✅ Prefill BA form handler end


// ✅ Submit BA Readmission form handler start
const SubmitBAReadmissionFormHandler = async (e) => {
  e.preventDefault();

  const compulsoryFieldDefinitions = [
    {
      label: getTranslation("Date of Assessment / मूल्यांकन की तिथि", lang),
      value: BAPrefillData?.date_of_assessment,
    },
    {
      label: getTranslation("Package Type / पैकेज प्रकार", lang),
      value: BAPrefillData?.package_type_id,
    },
    {
      label: getTranslation("Severity / गंभीरता", lang),
      value: BAPrefillData?.severity_id,
    },
  ];

  if (!validateCompulsoryFields(compulsoryFieldDefinitions, lang)) {
    return;
  }

  setIsLoading(true);

  try {
    const token = localStorage.getItem("Authorization");
    const branch_id = selectedBranch;

    const payload = {
      user_id: BAPrefillData?.user_id,
      date_of_assessment: BAPrefillData?.date_of_assessment
        ? new Date(BAPrefillData.date_of_assessment).toISOString()
        : null,

      package_type_id: BAPrefillData?.package_type_id || null,
      package_name: BAPrefillData?.package_name || null,

      sample_collected: BAPrefillData?.sample_collected === "Yes" ? "Yes" : "No",
      sample_collection_time: BAPrefillData?.sample_collection_time
        ? new Date(BAPrefillData.sample_collection_time).toISOString()
        : null,

      severity_id: BAPrefillData?.severity_id || null,
      severity_name: BAPrefillData?.severity_name || null,

      report_file_path: BAPrefillData?.report_file_path || "", // TODO: handle file upload separately
      report_file_type: BAPrefillData?.report_file_type || "PDF",

      remarks: BAPrefillData?.remarks?.trim() || null,
    };

    console.log("✅ Payload to submit:", payload);

    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/blood-analysis/create-assessment?branch_id=${branch_id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setIsLoading(false);
      showApiErrorAlert(data, lang, getTranslation("Blood Analysis Readmission Failed / रक्त विश्लेषण पुनः प्रवेश विफल", lang));
      return;
    }

    setIsLoading(false);

    Swal.fire({
      icon: "success",
      title: getTranslation("Blood Analysis Form Created Successfully/रक्त विश्लेषण फ़ॉर्म सफलतापूर्वक बनाया गया",lang),
      text: getTranslation("The form was submitted successfully./फॉर्म सफलतापूर्वक सबमिट कर दिया गया।",lang),
    }).then(() => closeAllmodal());

    console.log("✅ Response Data:", data);
  } catch (err) {
    console.error("❌ Submit error:", err);
    setIsLoading(false);
    Swal.fire({
      icon: "error",
      title: "Unexpected Error",
      text: getTranslation("Failed to submit. Check console for error./सबमिट करने में विफल. त्रुटि के लिए कंसोल की जाँच करें.",lang),
    });
  }
};
// ✅ Submit BA Readmission form handler end





    //Close all modal handler
  const closeAllmodal = () => {
    setIsBAModalOpen(false);
    setViewBAModal(false);
    setIsBAEditModal(false);
    setBAPrefillModal(false);
  }

  //PDf view download pdf code handler
    const [pfaDownload, setpfaDownload] = useState(false);
    const handleDownloadPDF = () => {
      const element = pdfRef.current;
      setpfaDownload(true);
  
      // Add a temporary class to scale fonts if needed
      element.classList.add("pdf-scale");
  
      const patientName = viewBAData?.name || viewBAData?.patient_name || "Patient";
      const gksId = viewBAData?.custom_code || viewBAData?.gks_id || viewBAData?.uid || viewBAData?.user_id || "";
      const safeName = String(patientName).trim().replace(/\s+/g, "_");
      const safeId = String(gksId).trim().replace(/\s+/g, "_");

      const opt = {
        margin: [10, 10, 10, 10], // top, left, bottom, right
        filename: `patient_${safeName}_${safeId || "blood_analysis_report"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          scrollY: 0,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };
  
      html2pdf()
        .set(opt)
        .from(element)
        .save()
        .then(() => {
          toast.success(getTranslation("Download complete!/डाउनलोड पूर्ण!",lang));
          element.classList.remove("pdf-scale");
  
          setTimeout(() => {
            setpfaDownload(false);
          }, 2000);
        });
    };


     //Print viewable form data handler (matches Download PDF identically)
       const handlePrint = () =>
         printElementAsPdf(pdfRef.current, {
           title: `Blood_Analysis_${viewBAData?.name || "Report"}`,
         });

  return (
   <Fragment>
      {/* Top Header & Tab Navigation */}
      <Container fluid={true} className="pt-3 pb-2">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pb-2 border-bottom">
          <div>
            <h4 className="mb-0 text-primary fw-bold">
              {getTranslation("Medical Observations / चिकित्सा अवलोकन", lang)}
            </h4>
            <small className="text-muted">
              {isLabOperator
                ? getTranslation("Lab Operator Dashboard — Sample Collection (48h) & Report Upload (72h)", lang)
                : getTranslation("Patient Assessment, Multi-Package Selection & Laboratory Tracking", lang)}
            </small>
          </div>
          <Nav pills className="nav-primary">
            {/* Tab 1: Lab Requests & Blood Analysis and Body Scan */}
            <NavItem>
              <NavLink
                className={mainTab === "lab_requests" ? "active" : ""}
                style={{ cursor: "pointer", fontWeight: "600" }}
                onClick={() => setMainTab("lab_requests")}
              >
                <Activity size={16} className="me-1" />
                {getTranslation("Lab Requests & Blood Analysis and Body Scan / लैब अनुरोध, रक्त विश्लेषण एवं बॉडी स्कैन", lang)}
                {labRequests.filter((r) => r.status === "Scheduled" || r.status === "Sample_Collected").length > 0 && (
                  <Badge color="danger" pill className="ms-2">
                    {labRequests.filter((r) => r.status === "Scheduled" || r.status === "Sample_Collected").length}
                  </Badge>
                )}
              </NavLink>
            </NavItem>

            {/* Tab 2: Patient Observation (Swiped to second tab as requested) */}
            <NavItem>
              <NavLink
                className={mainTab === "patients" ? "active" : ""}
                style={{ cursor: "pointer", fontWeight: "600" }}
                onClick={() => setMainTab("patients")}
              >
                <Heart size={16} className="me-1" />
                {getTranslation("Patient Observations / रोगी अवलोकन (W, SpO2, BP)", lang)}
              </NavLink>
            </NavItem>
          </Nav>
        </div>
      </Container>

      {mainTab === "lab_requests" ? (
        /* Lab Operator / Collection Queue View */
        <Container fluid={true} className="datatables">
          <Row>
            <Col sm="12">
              {/* SLA KPI Metrics Cards — Click any tile for instant quick data view & filtering */}
              <Row className="mb-3 g-2">
                {[
                  {
                    key: "all",
                    label: getTranslation("Total Active Requests / कुल सक्रिय अनुरोध", lang),
                    count: labRequests.length,
                    color: "#1E6554",
                    activeBg: "#f0fdf4",
                    activeBorder: "#1E6554",
                    icon: <Activity color="#1E6554" size={26} />,
                  },
                  {
                    key: "pending_collection",
                    label: getTranslation("Pending Collection / लंबित संग्रह", lang),
                    count: getKpiTileRequests("pending_collection").length,
                    color: "#d97706",
                    activeBg: "#fffbeb",
                    activeBorder: "#d97706",
                    icon: <Clock color="#d97706" size={26} />,
                  },
                  {
                    key: "overdue_samples",
                    label: getTranslation("Overdue Samples (>48h) / विलंबित नमूने", lang),
                    count: getKpiTileRequests("overdue_samples").length,
                    color: "#dc2626",
                    activeBg: "#fef2f2",
                    activeBorder: "#dc2626",
                    icon: <AlertCircle color="#dc2626" size={26} />,
                  },
                  {
                    key: "pending_reports",
                    label: getTranslation("Pending Reports / लंबित रिपोर्ट", lang),
                    count: getKpiTileRequests("pending_reports").length,
                    color: "#0284c7",
                    activeBg: "#f0f9ff",
                    activeBorder: "#0284c7",
                    icon: <Upload color="#0284c7" size={26} />,
                  },
                ].map((tile) => {
                  const isActive = activeKpiTile === tile.key;
                  return (
                    <Col md="3" sm="6" key={tile.key}>
                      <Card
                        className="mb-0"
                        onClick={() => setActiveKpiTile(isActive ? null : tile.key)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setActiveKpiTile(isActive ? null : tile.key);
                          }
                        }}
                        style={{
                          cursor: "pointer",
                          backgroundColor: isActive ? tile.activeBg : "#f8fafc",
                          border: isActive ? `2px solid ${tile.activeBorder}` : "1px solid #e2e8f0",
                          borderRadius: "10px",
                          boxShadow: isActive ? "0 4px 12px rgba(0,0,0,0.08)" : "none",
                          transition: "all 0.18s ease-in-out",
                        }}
                      >
                        <CardBody className="p-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <small className="fw-semibold d-block" style={{ color: "#475569", fontSize: "12.5px" }}>
                                {tile.label}
                              </small>
                              <h4
                                className="mb-0 fw-bold mt-1"
                                style={{ color: tile.color, fontSize: "24px", lineHeight: 1.2 }}
                              >
                                {tile.count}
                              </h4>
                              <small
                                style={{
                                  fontSize: "11px",
                                  color: isActive ? tile.color : "#64748b",
                                  fontWeight: isActive ? 600 : 500,
                                }}
                              >
                                {isActive
                                  ? getTranslation("Showing quick data ▲ / बंद करें", lang)
                                  : getTranslation("Click to view data → / डेटा देखें", lang)}
                              </small>
                            </div>
                            {tile.icon}
                          </div>
                        </CardBody>
                      </Card>
                    </Col>
                  );
                })}
              </Row>

              {/* Quick Data Preview Panel — Opens immediately when any KPI tile is clicked */}
              {activeKpiTile && (
                <Card
                  className="mb-3 shadow-sm"
                  style={{
                    borderRadius: "12px",
                    border: `1.5px solid ${activeTileMeta[activeKpiTile]?.border || "#cbd5e1"}`,
                    overflow: "hidden",
                  }}
                >
                  <div
                    className="px-3 py-2 d-flex justify-content-between align-items-center flex-wrap gap-2"
                    style={{
                      backgroundColor: activeTileMeta[activeKpiTile]?.bg || "#f8fafc",
                      borderBottom: `1px solid ${activeTileMeta[activeKpiTile]?.border || "#e2e8f0"}`,
                    }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <span
                        className="fw-bold"
                        style={{ color: activeTileMeta[activeKpiTile]?.color || "#1e293b", fontSize: "14px" }}
                      >
                        ⚡ {getTranslation("Quick View / त्वरित डेटा", lang)}: {activeTileMeta[activeKpiTile]?.title}
                      </span>
                      <Badge
                        pill
                        style={{
                          backgroundColor: activeTileMeta[activeKpiTile]?.color || "#1E6554",
                          color: "#ffffff",
                          fontSize: "12px",
                        }}
                      >
                        {quickTileRequests.length} {getTranslation("Record(s) / रिकॉर्ड", lang)}
                      </Badge>
                    </div>
                    <Button
                      color="light"
                      size="sm"
                      className="border fw-semibold py-1 px-2"
                      onClick={() => setActiveKpiTile(null)}
                      style={{ borderRadius: "6px", fontSize: "12px", color: "#334155" }}
                    >
                      ✕ {getTranslation("Close Quick View / बंद करें", lang)}
                    </Button>
                  </div>
                  <CardBody className="p-0">
                    {quickTileRequests.length === 0 ? (
                      <div className="p-4 text-center text-muted" style={{ fontSize: "13.5px" }}>
                        {getTranslation("No matching records found for this category. / इस श्रेणी के लिए कोई रिकॉर्ड नहीं मिला।", lang)}
                      </div>
                    ) : (
                      <div className="table-responsive" style={{ maxHeight: "340px", overflowY: "auto" }}>
                        <table className="table table-hover align-middle mb-0" style={{ fontSize: "13px" }}>
                          <thead style={{ backgroundColor: "#f8fafc", position: "sticky", top: 0, zIndex: 1 }}>
                            <tr>
                              <th className="px-3 py-2 text-muted fw-semibold">ID</th>
                              <th className="px-3 py-2 text-muted fw-semibold">{getTranslation("Patient / रोगी", lang)}</th>
                              <th className="px-3 py-2 text-muted fw-semibold">{getTranslation("Package(s) / पैकेज", lang)}</th>
                              <th className="px-3 py-2 text-muted fw-semibold text-center">{getTranslation("Status / स्थिति", lang)}</th>
                              <th className="px-3 py-2 text-muted fw-semibold text-center">{getTranslation("SLA / एसएलए", lang)}</th>
                              <th className="px-3 py-2 text-muted fw-semibold text-center">{getTranslation("Quick Actions / त्वरित कार्य", lang)}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {quickTileRequests.map((row) => {
                              const s = row.status || "Scheduled";
                              const sla = getSLAInfo(row);
                              const rowId = row.blood_analysis_id || row.id;
                              return (
                                <tr key={`quick-${rowId}`}>
                                  <td className="px-3 py-2 fw-semibold text-dark">#{rowId}</td>
                                  <td className="px-3 py-2">
                                    <div className="fw-semibold text-dark">{row.name || "—"}</div>
                                    <small className="text-muted">
                                      {row.custom_code || row.gks_id || (row.phone ? `Ph: ${row.phone}` : "")}
                                    </small>
                                  </td>
                                  <td className="px-3 py-2 fw-medium text-dark">
                                    {Array.isArray(row.package_name) ? row.package_name.join(", ") : row.package_name || "—"}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    {s === "Scheduled" ? (
                                      <Badge color="warning" className="text-dark px-2 py-1">Scheduled</Badge>
                                    ) : s === "Sample_Collected" ? (
                                      <Badge color="info" className="px-2 py-1">Sample Collected</Badge>
                                    ) : s === "Report_Uploaded" ? (
                                      <Badge color="primary" className="px-2 py-1">Report Uploaded</Badge>
                                    ) : (
                                      <Badge color="success" className="px-2 py-1">{s}</Badge>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <Badge color={sla.color} className="px-2 py-1" style={{ fontSize: "11px" }}>
                                      {sla.text}
                                    </Badge>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <div className="d-inline-flex align-items-center gap-2">
                                      <button
                                        type="button"
                                        className="btn btn-action-icon btn-action-view"
                                        style={{
                                          width: "30px",
                                          height: "30px",
                                          minWidth: "30px",
                                          padding: 0,
                                          display: "inline-flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          borderRadius: "6px",
                                          backgroundColor: "#f0fdf4",
                                          border: "1px solid #bbf7d0",
                                          color: "#166534",
                                        }}
                                        onClick={() => viewBAFormData(rowId)}
                                        title={getTranslation("View Observation / विवरण देखें", lang)}
                                      >
                                        <Eye size={15} color="#166534" strokeWidth={2.2} />
                                      </button>
                                      {(s === "Scheduled" || row.sample_collected !== "Yes") && (
                                        <Button
                                          color="warning"
                                          size="sm"
                                          className="py-1 px-2 text-dark fw-semibold d-inline-flex align-items-center gap-1"
                                          style={{ borderRadius: "6px", fontSize: "11.5px" }}
                                          onClick={() => handleCollectSample(row)}
                                        >
                                          <Activity size={12} color="#212529" />
                                          <span>{getTranslation("Collect Sample", lang)}</span>
                                        </Button>
                                      )}
                                      {s === "Sample_Collected" && (
                                        <Button
                                          color="info"
                                          size="sm"
                                          className="py-1 px-2 text-white fw-semibold d-inline-flex align-items-center gap-1"
                                          style={{ borderRadius: "6px", fontSize: "11.5px", backgroundColor: "#0284c7", borderColor: "#0284c7" }}
                                          onClick={() => handleOpenUploadModal(row)}
                                        >
                                          <Upload size={12} color="#ffffff" />
                                          <span>{getTranslation("Upload Report", lang)}</span>
                                        </Button>
                                      )}
                                      {s === "Report_Uploaded" && !isLabOperator && (
                                        <Button
                                          color="success"
                                          size="sm"
                                          className="py-1 px-2 fw-semibold d-inline-flex align-items-center gap-1"
                                          style={{ borderRadius: "6px", fontSize: "11.5px" }}
                                          onClick={() => handleOpenReviewModal(row)}
                                        >
                                          <CheckCircle size={12} color="#ffffff" />
                                          <span>{getTranslation("Review", lang)}</span>
                                        </Button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardBody>
                </Card>
              )}

              {/* Card 1: Lab Requests & Collection Queue */}
              <Card className="mb-4">
                <CardBody>
                  <div className="d-flex pb-2 justify-content-between align-items-center flex-wrap gap-2">
                    <HeaderCard
                      title={getTranslation("Medical Observations — Lab Requests & Collection Queue / लैब अनुरोध एवं संग्रह", lang)}
                      className="p-0"
                    />
                    <div className="d-flex gap-2">
                      <Button color="success" size="sm" onClick={() => setQuickPatientModalOpen(true)}>
                        <Plus size={14} className="me-1" />
                        {getTranslation("Create Blood Analysis Form / रक्त विश्लेषण प्रपत्र बनाएं", lang)}
                      </Button>
                      <Button color="outline-primary" size="sm" onClick={() => fetchLabRequests()} disabled={labRequestsLoading}>
                        <RefreshCw size={14} className={labRequestsLoading ? "spin me-1" : "me-1"} />
                        {getTranslation("Refresh Queue", lang)}
                      </Button>
                    </div>
                  </div>
                  <div className="row pb-3 align-items-center">
                    <div className="col-md-5 col-12 mb-2 mb-md-0">
                      <InputGroup>
                        <Input
                          className="form-control"
                          type="text"
                          placeholder={getTranslation("Search by patient name, ID, status, package... / खोजें...", lang)}
                          value={labSearchText}
                          onChange={(e) => setLabSearchText(e.target.value)}
                        />
                        <span className="input-group-text">
                          <i className="fa fa-search"></i>
                        </span>
                      </InputGroup>
                    </div>
                    <div className="col-md-7 col-12 d-flex justify-content-md-end justify-content-start">
                      <TableExportButtons
                        data={filteredLabRequests}
                        columns={tableColumnsLabRequests}
                        filename="Medical_Observations_Lab_Requests"
                        title={getTranslation("Medical Observations Lab Requests Queue", lang)}
                      />
                    </div>
                  </div>
                  {labRequestsLoading ? (
                    <div className="loading-text">
                      {getTranslation("Fetching lab requests... / लैब अनुरोध प्राप्त किए जा रहे हैं...", lang)}
                    </div>
                  ) : (
                    <DataTable
                      data={filteredLabRequests}
                      columns={tableColumnsLabRequests}
                      striped
                      center
                      highlightOnHover
                      pagination
                      persistTableHead
                      customStyles={customTableStyles}
                    />
                  )}
                </CardBody>
              </Card>

              {/* Card 2: Admitted Patients — Order Lab Tests directly */}
              <Card className="mb-4">
                <CardBody>
                  <div className="d-flex pb-2 justify-content-between align-items-center flex-wrap gap-2">
                    <HeaderCard
                      title={getTranslation("Admitted Patients — Order Lab Tests / भर्ती मरीज — लैब टेस्ट ऑर्डर करें", lang)}
                      className="p-0"
                    />
                  </div>
                  <div className="row pb-3 align-items-center">
                    <div className="col-md-5 col-12 mb-2 mb-md-0">
                      <InputGroup>
                        <Input
                          className="form-control"
                          type="text"
                          placeholder={getTranslation("Search admitted patients... / मरीज खोजें...", lang)}
                          value={searchText}
                          onChange={handleSearchChange}
                        />
                        <span className="input-group-text">
                          <i className="fa fa-search"></i>
                        </span>
                      </InputGroup>
                    </div>
                    <div className="col-md-7 col-12 d-flex justify-content-md-end justify-content-start">
                      <TableExportButtons
                        data={filteredData}
                        columns={tableColumnsOrderBA}
                        filename="Admitted_Patients_Lab_Order_List"
                        title={getTranslation("Admitted Patients Lab Order List", lang)}
                      />
                    </div>
                  </div>
                  {stillLoading ? (
                    <div className="loading-text">
                      {getTranslation("Loading admitted patients... / मरीज सूची लोड हो रही है...", lang)}
                    </div>
                  ) : (
                    <DataTable
                      data={filteredData}
                      columns={tableColumnsOrderBA}
                      striped
                      center
                      highlightOnHover
                      pagination
                      persistTableHead
                      customStyles={customTableStyles}
                    />
                  )}
                </CardBody>
              </Card>

              {/* Card 3: All Blood Analysis Records History */}
              <Card className="mb-4">
                <CardBody>
                  <div className="d-flex pb-2 justify-content-between align-items-center flex-wrap gap-2">
                    <HeaderCard
                      title={getTranslation("All Blood Analysis Records History / सभी रक्त विश्लेषण डेटा इतिहास", lang)}
                      className="p-0"
                    />
                  </div>
                  <div className="row pb-3 align-items-center">
                    <div className="col-md-5 col-12 mb-2 mb-md-0">
                      <InputGroup>
                        <Input
                          className="form-control"
                          type="text"
                          placeholder={getTranslation("Search records... / रिकॉर्ड खोजें...", lang)}
                          value={searchTextone}
                          onChange={handleSearchChangeone}
                        />
                        <span className="input-group-text">
                          <i className="fa fa-search"></i>
                        </span>
                      </InputGroup>
                    </div>
                    <div className="col-md-7 col-12 d-flex justify-content-md-end justify-content-start">
                      <TableExportButtons
                        data={filteredDataone}
                        columns={tableColumnsBAList}
                        filename="All_Blood_Analysis_Data_List"
                        title={getTranslation("All Blood Analysis Data List / सभी रक्त विश्लेषण डेटा सूची", lang)}
                      />
                    </div>
                  </div>
                  {stillLoading ? (
                    <div className="loading-text">
                      {getTranslation("Data is fetching from server. Please wait... / सर्वर से डेटा प्राप्त किया जा रहा है...", lang)}
                    </div>
                  ) : (
                    <DataTable
                      data={filteredDataone}
                      columns={tableColumnsBAList}
                      striped
                      center
                      highlightOnHover
                      pagination
                      persistTableHead
                      customStyles={customTableStyles}
                    />
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      ) : (
        /* Tab 2: Patient Observations (W, SpO2, BP) View */
        <Container fluid={true} className="datatables">
          <Row>
            <Col sm="12">
              <Card>
                <CardBody>
                  <div className="d-flex pb-2 justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                      <HeaderCard
                        title={getTranslation("Patient Physical Observations / रोगी शारीरिक अवलोकन (W, SpO2, BP)", lang)}
                        className="p-0 mb-1"
                      />
                      <small className="text-muted">
                        {getTranslation(
                          "Track vitals: Weight (W in kg), Oxygen Saturation (SpO2 %), and Blood Pressure (BP in mmHg)",
                          lang
                        )}
                      </small>
                    </div>
                    <Button
                      color="primary"
                      size="sm"
                      className="d-flex align-items-center gap-1 shadow-sm"
                      onClick={() => setQuickPatientModalOpen(true)}
                    >
                      <Plus size={15} />
                      {getTranslation("Record New Vitals / नया अवलोकन दर्ज करें", lang)}
                    </Button>
                  </div>
                  <div className="row pb-3 pt-2 align-items-center">
                    <div className="col-md-5 col-12 mb-2 mb-md-0">
                      <InputGroup>
                        <Input
                          className="form-control"
                          type="text"
                          placeholder={getTranslation("Search patient by name or GKS ID... / मरीज खोजें...", lang)}
                          value={searchText}
                          onChange={handleSearchChange}
                        />
                        <span className="input-group-text">
                          <i className="fa fa-search"></i>
                        </span>
                      </InputGroup>
                    </div>
                    <div className="col-md-7 col-12 d-flex justify-content-md-end justify-content-start">
                      <TableExportButtons
                        data={filteredData}
                        columns={tableColumnsPatientObservations}
                        filename="Patient_Physical_Observations_W_SPO2_BP"
                        title={getTranslation("Patient Physical Observations (W, SpO2, BP)", lang)}
                      />
                    </div>
                  </div>
                  {stillLoading ? (
                    <div className="loading-text">
                      {getTranslation("Loading patient observation vitals... / अवलोकन लोड हो रहा है...", lang)}
                    </div>
                  ) : (
                    <DataTable
                      data={filteredData}
                      columns={tableColumnsPatientObservations}
                      striped
                      center
                      highlightOnHover
                      pagination
                      persistTableHead
                      customStyles={customTableStyles}
                    />
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      )}

{/* BA create form start */}
<CommonModal
  isOpen={isBAModalOpen}
  title={getTranslation("Create Blood Analysis Form/रक्त विश्लेषण प्रपत्र बनाएँ",lang)}
  toggler={closeAllmodal}
  maxWidth="1200px"
>
  <PatientCommonInfo
    selectedUser={selectedUser}
    labels={{
      name: getTranslation("Patient name/प्रयासक का नाम :",lang),
      sex: getTranslation("Gender/प्रयासक का लिंग :",lang),
      age: getTranslation("Age/प्रयासक का उम्र :",lang),
      date_of_admission: getTranslation("Date of Admission/प्रवेश की तिथि :",lang),
      ageValue: patientCalAge,
    }}
  />

  <div className="ow px-3 pt-4 pb-3">
    <DraftNoticeBanner
      draftTimestamp={draftTimestamp}
      formKey="blood_analysis"
      targetId={selectedUser?.user_id || selectedUser?.id}
      onDiscard={() => {
        setFormData(initialBAFormData);
        setDraftTimestamp(null);
      }}
    />
    <form noValidate onSubmit={SubmitBAFormHandler}>
      {/*Date of Assessment section/परीक्षण की तारीख :*/}
      <div className="col-md-6">
                      <FormGroup className="form-group row">
                        <Label className="col-sm-12 col-form-label  col-xl-6">
                          {getTranslation(dateOfAssessment,lang)}
                        </Label>
                        <Col xl="5" sm="12">
                          <div className="input-group">
                            <DatePicker showMonthDropdown showYearDropdown dropdownMode="select"
                              className="form-control digits"
                              selected={safeDate(formData.date_of_assessment)}
                              onChange={(date) =>
                                handleAssesmentDateChange(
                                  "date_of_assessment",
                                  date
                                )
                              }
                            />
                          </div>
                        </Col>
                      </FormGroup>
                    </div>{" "}
                    {/*Date of Admission section/प्रवेश की तिथि :*/}
      {/* Package Selection (Multi-select) */}
      <div className="mb-3">
        <Label className="fw-bold text-dark d-block mb-1">
          {getTranslation("Package Selection (Multiple Options) / पैकेज चयन (एकाधिक विकल्प)", lang)} <span className="text-danger">*</span>
        </Label>
        <div className="p-3 border rounded bg-white shadow-sm" style={{ maxHeight: "190px", overflowY: "auto" }}>
          {packages.length === 0 ? (
            <small className="text-muted">{getTranslation("No packages available / कोई पैकेज उपलब्ध नहीं है", lang)}</small>
          ) : (
            packages.map((pkg) => {
              const selectedIds = Array.isArray(formData.package_type_id)
                ? formData.package_type_id
                : formData.package_type_id ? [formData.package_type_id] : [];
              const isChecked = selectedIds.some((id) => String(id) === String(pkg.package_type_id));
              return (
                <div key={pkg.package_type_id} className="form-check mb-2">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id={`pkg_${pkg.package_type_id}`}
                    checked={isChecked}
                    onChange={() => handlePackageToggle(pkg)}
                  />
                  <label className="form-check-label" htmlFor={`pkg_${pkg.package_type_id}`} style={{ cursor: "pointer" }}>
                    <span className="fw-semibold text-dark">{pkg.package_name}</span>
                    {pkg.original_amount && (
                      <span className="text-muted ms-2 small">(₹{pkg.original_amount})</span>
                    )}
                    {pkg.package_description && (
                      <span className="text-muted ms-2 small">— {pkg.package_description}</span>
                    )}
                  </label>
                </div>
              );
            })
          )}
        </div>
        {Array.isArray(formData.package_name) && formData.package_name.length > 0 && (
          <div className="mt-2 d-flex flex-wrap gap-1 align-items-center">
            <small className="text-muted me-1">{getTranslation("Selected / चयनित:", lang)}</small>
            {formData.package_name.map((name, i) => (
              <Badge key={i} color="primary" className="px-2 py-1">
                {name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Workflow Guidance Banner (Image 2 Requirement) */}
      <div className="alert alert-info border py-2 px-3 mb-3 d-flex align-items-center gap-2" style={{ backgroundColor: "#f0f9ff", borderColor: "#bae6fd" }}>
        <Info size={18} className="text-primary flex-shrink-0" />
        <small className="text-dark">
          <strong>{getTranslation("Billing & Lab Workflow Notice:", lang)}</strong>{" "}
          {getTranslation(
            "Selecting packages will automatically generate/draft the invoice in the Billing module upon scheduling. Sample collection and report upload are handled in the Lab Queue.",
            lang
          )}
        </small>
      </div>

      {/* Remarks */}
      <div className="mb-3">
        <label htmlFor="remarks" className="fw-semibold text-dark">{getTranslation("Clinical Remarks / टिप्पणी", lang)}</label>
        <input
          type="text"
          id="remarks"
          name="remarks"
          className="form-control"
          placeholder="Add any baseline clinical remarks (optional)"
          value={formData.remarks}
          onChange={handleChange}
        />
      </div>

      {/* Sample Collected (Disabled during initial creation - handled in Lab Queue) */}
      <div className="form-check mb-3 p-3 bg-light rounded border opacity-75">
        <input
          type="checkbox"
          id="sample_collected"
          name="sample_collected"
          className="form-check-input"
          checked={formData.sample_collected}
          disabled
        />
        <label className="form-check-label text-muted" htmlFor="sample_collected">
          {getTranslation("Sample Collected / नमूना एकत्र किया गया", lang)}{" "}
          <span className="badge bg-secondary ms-2" style={{ fontSize: "11px" }}>
            {getTranslation("Disabled at creation — Handled in Lab Queue (48h)", lang)}
          </span>
        </label>
      </div>

      {/* Report Upload (Disabled during initial creation - handled in Lab Queue) */}
      <div className="mb-3 p-3 bg-light rounded border opacity-75">
        <label htmlFor="reportFile" className="text-muted d-block mb-1">
          {getTranslation("Upload Report (PDF/Image) / रिपोर्ट अपलोड करें", lang)}{" "}
          <span className="badge bg-secondary ms-2" style={{ fontSize: "11px" }}>
            {getTranslation("Disabled at creation — Handled in Lab Queue (72h)", lang)}
          </span>
        </label>
        <input
          type="file"
          id="reportFile"
          name="report_file"
          className="form-control"
          disabled
        />
      </div>

      {/* Severity Selection (Disabled during initial creation - assigned after report review) */}
      <div className="mb-3 p-3 bg-light rounded border opacity-75">
        <label htmlFor="severity_id" className="text-muted d-block mb-1">
          {getTranslation("Package Severity / पैकेज की गंभीरता", lang)}{" "}
          <span className="badge bg-secondary ms-2" style={{ fontSize: "11px" }}>
            {getTranslation("Disabled at creation — Assigned upon Report Review", lang)}
          </span>
        </label>
        <select
          id="severity_id"
          name="severity_id"
          className="form-control"
          disabled
        >
          <option value="">{getTranslation("Assigned after report is uploaded & reviewed", lang)}</option>
        </select>
      </div>

      {/* Submit Button */}
      <div className="d-flex align-items-center gap-3 pt-3 flex-wrap">
        <SaveDraftButton
          formKey="blood_analysis"
          targetId={selectedUser?.user_id || selectedUser?.id}
          formData={formData}
          onDraftSaved={() => setDraftTimestamp(Date.now())}
          style={{ height: "38px", padding: "6px 16px" }}
        />

        <Button color="primary" type="submit" disabled={isLoading}>
          {isLoading ? (
            <span
              className="spinner-border spinner-border-sm"
              role="status"
              aria-hidden="true"
            ></span>
          ) : (
            getTranslation("Create Blood Analysis Form/रक्त विश्लेषण प्रपत्र बनाएँ",lang)
          )}
        </Button>
      </div>
    </form>
  </div>
</CommonModal>
{/* BA create form end */}

 {/* View BA data into modal start */}
<CommonModal
  isOpen={viewBAModal}
  title={getTranslation("View Blood Analysis Assessment/रक्त विश्लेषण मूल्यांकन देखें", lang)}
  toggler={closeAllmodal}
  maxWidth="1100px"
>
  <div className="p-3 p-md-4 print-area" ref={pdfRef} style={{ background: "#f8fafc" }}>
    {isLoading ? (
      <ModalLoading message={getTranslation("Loading Blood Analysis details... / विवरण लोड हो रहा है...", lang)} />
    ) : viewBAData ? (
      <div>
        <PatientViewHeader data={viewBAData} />

        {/* Card 1: Patient Information */}
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
              background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
              borderLeft: "5px solid #d56337",
            }}
          >
            <h6 className="fw-bold text-dark mb-0" style={{ fontSize: "15px" }}>
              👤 {getTranslation("Patient Information / रोगी की जानकारी", lang)}
            </h6>
          </div>
          <div className="card-body p-3 p-md-4">
            <div className="row g-3">
              <div className="col-12 col-sm-6 col-lg-4">
                <div className="p-2 px-3 rounded-3 bg-light border">
                  <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                    {getTranslation("Patient Name/रोगी का नाम", lang)}
                  </div>
                  <div className="fw-semibold text-dark text-capitalize mt-1" style={{ fontSize: "13.5px" }}>
                    {viewBAData.name || "-"}
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-lg-4">
                <div className="p-2 px-3 rounded-3 bg-light border">
                  <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                    {getTranslation("Phone/फ़ोन", lang)}
                  </div>
                  <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                    📞 {viewBAData.phone || "-"}
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-lg-4">
                <div className="p-2 px-3 rounded-3 bg-light border">
                  <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                    {getTranslation("Email/ईमेल", lang)}
                  </div>
                  <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                    ✉️ {viewBAData.email || "-"}
                  </div>
                </div>
              </div>

              <div className="col-6 col-sm-4 col-lg-4">
                <div className="p-2 px-3 rounded-3 bg-light border">
                  <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                    {getTranslation("Gender/लिंग", lang)}
                  </div>
                  <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                    {viewBAData.gender || "-"}
                  </div>
                </div>
              </div>

              <div className="col-6 col-sm-4 col-lg-4">
                <div className="p-2 px-3 rounded-3 bg-light border">
                  <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                    {getTranslation("Date of Birth/जन्म तिथि", lang)}
                  </div>
                  <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                    📅 {viewBAData.dob ? new Date(viewBAData.dob).toLocaleDateString() : "-"}
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-4 col-lg-4">
                <div className="p-2 px-3 rounded-3 bg-light border">
                  <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                    {getTranslation("Assessment Date/मूल्यांकन तिथि", lang)}
                  </div>
                  <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                    📅 {viewBAData.date_of_assessment ? new Date(viewBAData.date_of_assessment).toLocaleDateString() : "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Sample & Investigation Details */}
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
              background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
              borderLeft: "5px solid #d56337",
            }}
          >
            <h6 className="fw-bold text-dark mb-0" style={{ fontSize: "15px" }}>
              🧪 {getTranslation("Investigation & Sample Details / जांच एवं नमूना विवरण", lang)}
            </h6>
          </div>
          <div className="card-body p-3 p-md-4">
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <div className="p-2 px-3 rounded-3 bg-light border">
                  <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                    {getTranslation("Package/पैकेट", lang)}
                  </div>
                  <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                    {viewBAData.package_name} {viewBAData.package_description ? `- ${viewBAData.package_description}` : ""}
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="p-2 px-3 rounded-3 bg-light border">
                  <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                    {getTranslation("Severity/गंभीरता", lang)}
                  </div>
                  <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                    {viewBAData.severity_name} {viewBAData.severity_description ? `- ${viewBAData.severity_description}` : ""}
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-lg-4">
                <div className="p-2 px-3 rounded-3 bg-light border">
                  <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                    {getTranslation("Sample Collected/नमूना एकत्र किया गया", lang)}
                  </div>
                  <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                    {viewBAData.sample_collected || "-"}
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-lg-4">
                <div className="p-2 px-3 rounded-3 bg-light border">
                  <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                    {getTranslation("Sample Collection Time/नमूना संग्रह समय", lang)}
                  </div>
                  <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                    ⏰ {viewBAData.sample_collection_time ? new Date(viewBAData.sample_collection_time).toLocaleString() : "-"}
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-lg-4">
                <div className="p-2 px-3 rounded-3 bg-light border">
                  <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                    {getTranslation("Status/स्थिति", lang)}
                  </div>
                  <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                    <Badge color="light" className="text-dark border">
                      {viewBAData.status || "-"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="p-2 px-3 rounded-3 bg-light border">
                  <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                    {getTranslation("Remarks/टिप्पणी", lang)}
                  </div>
                  <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                    {viewBAData.remarks || "-"}
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="p-2 px-3 rounded-3 bg-light border">
                  <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                    {getTranslation("Report File/रिपोर्ट फ़ाइल", lang)}
                  </div>
                  <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                    {viewBAData.report_file_path ? (
                      <a
                        href={viewBAData.report_file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary text-decoration-none fw-bold d-inline-flex align-items-center gap-1"
                      >
                        📄 {getTranslation("View Uploaded Report", lang)} ({viewBAData.report_file_type || "PDF"})
                      </a>
                    ) : (
                      getTranslation("Not Uploaded/अपलोड नहीं किया गया", lang)
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div className="text-center py-5">
        <p className="text-muted mb-0">
          {getTranslation("No data available/कोई डेटा मौजूद नहीं", lang)}
        </p>
      </div>
    )}
  </div>

  {/* Modal Footer Actions */}
  <ModalActionButtons
    onClose={closeAllmodal}
    onPrint={handlePrint}
    onDownload={handleDownloadPDF}
    isDownloading={pfaDownload}
    downloadText={getTranslation("Download PDF / डाउनलोड करें", lang)}
  />
</CommonModal>
{/* View BA data into modal end */}



{/* BA edit form start */}
<CommonModal
  isOpen={IsBAEditModal}
  title={getTranslation("Edit Blood Analysis Form/रक्त विश्लेषण प्रपत्र संपादित करें",lang)}
  toggler={closeAllmodal}
  maxWidth="1200px"
>
  {/* <PatientCommonInfo
    selectedUser={selectedUser}
    labels={{
      name: "Patient name/प्रयासक का नाम :",
      sex: "Gender/प्रयासक का लिंग :",
      age: "Age/प्रयासक का उम्र :",
      date_of_admission: "Date of Admission/प्रवेश की तिथि :",
      ageValue: patientCalAge,
    }}
  /> */}

  <div className="row px-3 pt-4 pb-3">
    <form noValidate onSubmit={updateBAHandler}>
      {/* Date of Assessment */}
      <div className="col-md-6">
        <FormGroup className="form-group row">
          <Label className="col-sm-12 col-form-label col-xl-6">
            {getTranslation(dateOfAssessment,lang)}
          </Label>
          <Col xl="5" sm="12">
            <div className="input-group">
              <DatePicker showMonthDropdown showYearDropdown dropdownMode="select"
                className="form-control digits"
                selected={safeDate(BAEditData?.date_of_assessment)}
                onChange={(date) =>
                  setBAEditData({
                    ...BAEditData,
                    date_of_assessment: date,
                  })
                }
              />
            </div>
          </Col>
        </FormGroup>
      </div>

      {/* Package Selection */}
      <div className="mb-3">
        <label htmlFor="package_type_id">{getTranslation("Package Selection/पैकेज चयन",lang)}</label>
        <select
          id="package_type_id"
          name="package_type_id"
          className="form-control"
          value={BAEditData?.package_type_id || ""}
          onChange={(e) =>
            setBAEditData({
              ...BAEditData,
              package_type_id: e.target.value,
            })
          }
        >
          <option value="">Select Package</option>
          {packages.map((pkg) => (
            <option key={pkg.package_type_id} value={pkg.package_type_id}>
              {pkg.package_name}
            </option>
          ))}
        </select>
      </div>

      {/* Sample Collected */}
      <div className="form-check mb-3">
        <input
          type="checkbox"
          id="sample_collected"
          name="sample_collected"
          className="form-check-input checkbox_animated"
          checked={BAEditData?.sample_collected === "Yes"}
          onChange={(e) =>
            setBAEditData({
              ...BAEditData,
              sample_collected: e.target.checked ? "Yes" : "No",
            })
          }
        />
        <label className="form-check-label" htmlFor="sample_collected">
          {getTranslation("Sample Collected/नमूना एकत्र किया गया",lang)}
        </label>
      </div>

      {/* Sample Collection Time */}
      <div className="col-md-6 mb-3">
        <FormGroup className="form-group row">
          <Label className="col-sm-12 col-form-label col-xl-6">
            {getTranslation("Sample Collection Time/नमूना संग्रह समय",lang)}
          </Label>
          <Col xl="5" sm="12">
            <div className="input-group">
              <DatePicker showMonthDropdown showYearDropdown dropdownMode="select"
                className="form-control digits"
                showTimeSelect
                dateFormat="Pp"
                selected={safeDate(BAEditData?.sample_collection_time)}
                onChange={(date) =>
                  setBAEditData({
                    ...BAEditData,
                    sample_collection_time: date,
                  })
                }
              />
            </div>
          </Col>
        </FormGroup>
      </div>

      {/* Report Upload */}
      <div className="mb-3">
        <label htmlFor="reportFile">{getTranslation("Upload Report (PDF/Image)/रिपोर्ट अपलोड करें (पीडीएफ/छवि)",lang)}</label>
        <input
          type="file"
          id="reportFile"
          name="report_file"
          className="form-control"
          accept=".pdf,.jpg,.png,.jpeg"
          onChange={handleFileChange}
        />
        {BAEditData?.report_file_path && (
          <small className="text-muted">
            Current File: {BAEditData?.report_file_path}
          </small>
        )}
      </div>

      {/* Remarks */}
      <div className="mb-3">
        <label htmlFor="remarks">{getTranslation("Remarks/टिप्पणी",lang)}</label>
        <input
          type="text"
          id="remarks"
          name="remarks"
          className="form-control"
          placeholder="Add any additional remarks"
          value={BAEditData?.remarks || ""}
          onChange={(e) =>
            setBAEditData({
              ...BAEditData,
              remarks: e.target.value,
            })
          }
        />
      </div>

      {/* Severity Selection */}
      <div className="mb-3">
        <label htmlFor="severity_id">{getTranslation("Package Severity/पैकेज की गंभीरता",lang)}</label>
        <select
          id="severity_id"
          name="severity_id"
          className="form-control"
          value={BAEditData?.severity_id || ""}
          onChange={(e) =>
            setBAEditData({
              ...BAEditData,
              severity_id: e.target.value,
            })
          }
        >
          <option value="">Select Severity</option>
          {severity.map((sev) => (
            <option key={sev.severity_id} value={sev.severity_id}>
              {sev.severity_name}
            </option>
          ))}
        </select>
      </div>

      {/* Submit Button */}
      <div className="d-flex gap-3 pt-3">
        <Button color="primary" type="submit" disabled={isLoading}>
          {isLoading ? (
            <span
              className="spinner-border spinner-border-sm"
              role="status"
              aria-hidden="true"
            ></span>
          ) : (
            getTranslation("Update Blood Analysis Form/रक्त विश्लेषण फ़ॉर्म अपडेट करें",lang)
          )}
        </Button>
      </div>
    </form>
  </div>
</CommonModal>
{/* BA edit form end */}





{/* BA Prefill readmission form start */}
<CommonModal
  isOpen={BAPrefillModal}
  title={getTranslation("Readmission Blood Analysis Form/प्रवेश रक्त विश्लेषण प्रपत्र",lang)}
  toggler={closeAllmodal}
  maxWidth="1200px"
>
  {/* <PatientCommonInfo
    selectedUser={selectedUser}
    labels={{
      name: "Patient name/प्रयासक का नाम :",
      sex: "Gender/प्रयासक का लिंग :",
      age: "Age/प्रयासक का उम्र :",
      date_of_admission: "Date of Admission/प्रवेश की तिथि :",
      ageValue: patientCalAge,
    }}
  /> */}

  <div className="row px-3 pt-4 pb-3">
    <form noValidate onSubmit={SubmitBAReadmissionFormHandler}>
      {/* Date of Assessment */}
      <div className="col-md-6">
        <FormGroup className="form-group row">
          <Label className="col-sm-12 col-form-label col-xl-6">
            {getTranslation(dateOfAssessment,lang)}
          </Label>
          <Col xl="5" sm="12">
            <div className="input-group">
              <DatePicker showMonthDropdown showYearDropdown dropdownMode="select"
                className="form-control digits"
                selected={safeDate(BAPrefillData?.date_of_assessment)}
                onChange={(date) =>
                  setBAPrefillData({
                    ...BAPrefillData,
                    date_of_assessment: date,
                  })
                }
              />
            </div>
          </Col>
        </FormGroup>
      </div>

      {/* Package Selection */}
      <div className="mb-3">
        <label htmlFor="package_type_id">{getTranslation("Package Selection/पैकेज चयन",lang)}</label>
        <select
          id="package_type_id"
          name="package_type_id"
          className="form-control"
          value={BAPrefillData?.package_type_id || ""}
          onChange={(e) =>
            setBAPrefillData({
              ...BAPrefillData,
              package_type_id: e.target.value,
            })
          }
        >
          <option value="">Select Package</option>
          {packages.map((pkg) => (
            <option key={pkg.package_type_id} value={pkg.package_type_id}>
              {pkg.package_name}
            </option>
          ))}
        </select>
      </div>

      {/* Sample Collected */}
      <div className="form-check mb-3">
        <input
          type="checkbox"
          id="sample_collected"
          name="sample_collected"
          className="form-check-input checkbox_animated"
          checked={BAPrefillData?.sample_collected === "Yes"}
          onChange={(e) =>
            setBAPrefillData({
              ...BAPrefillData,
              sample_collected: e.target.checked ? "Yes" : "No",
            })
          }
        />
        <label className="form-check-label" htmlFor="sample_collected">
         {getTranslation(" Sample Collected/नमूना एकत्र किया गया",lang)}
        </label>
      </div>

      {/* Sample Collection Time */}
      <div className="col-md-6 mb-3">
        <FormGroup className="form-group row">
          <Label className="col-sm-12 col-form-label col-xl-6">
            {getTranslation("Sample Collection Time/नमूना संग्रह समय",lang)}
          </Label>
          <Col xl="5" sm="12">
            <div className="input-group">
              <DatePicker showMonthDropdown showYearDropdown dropdownMode="select"
                className="form-control digits"
                showTimeSelect
                dateFormat="Pp"
                selected={safeDate(BAPrefillData?.sample_collection_time)}
                onChange={(date) =>
                  setBAPrefillData({
                    ...BAPrefillData,
                    sample_collection_time: date,
                  })
                }
              />
            </div>
          </Col>
        </FormGroup>
      </div>

      {/* Report Upload */}
      <div className="mb-3">
        <label htmlFor="reportFile">{getTranslation("Upload Report (PDF/Image)/रिपोर्ट अपलोड करें (पीडीएफ/छवि)",lang)}</label>
        <input
          type="file"
          id="reportFile"
          name="report_file"
          className="form-control"
          accept=".pdf,.jpg,.png,.jpeg"
          onChange={handleFileChange}
        />
        {BAPrefillData?.report_file_path && (
          <small className="text-muted">
            Current File: {BAPrefillData?.report_file_path}
          </small>
        )}
      </div>

      {/* Remarks */}
      <div className="mb-3">
        <label htmlFor="remarks">{getTranslation("Remarks/टिप्पणी",lang)}</label>
        <input
          type="text"
          id="remarks"
          name="remarks"
          className="form-control"
          placeholder="Add any additional remarks"
          value={BAPrefillData?.remarks || ""}
          onChange={(e) =>
            setBAPrefillData({
              ...BAPrefillData,
              remarks: e.target.value,
            })
          }
        />
      </div>

      {/* Severity Selection */}
      <div className="mb-3">
        <label htmlFor="severity_id">{getTranslation("Package Severity/पैकेज की गंभीरता",lang)}</label>
        <select
          id="severity_id"
          name="severity_id"
          className="form-control"
          value={BAPrefillData?.severity_id || ""}
          onChange={(e) =>
            setBAPrefillData({
              ...BAPrefillData,
              severity_id: e.target.value,
            })
          }
        >
          <option value="">Select Severity</option>
          {severity.map((sev) => (
            <option key={sev.severity_id} value={sev.severity_id}>
              {sev.severity_name}
            </option>
          ))}
        </select>
      </div>

      {/* Submit Button */}
      <div className="d-flex gap-3">
        <Button color="primary" type="submit" disabled={isLoading}>
          {isLoading ? (
            <span
              className="spinner-border spinner-border-sm"
              role="status"
              aria-hidden="true"
            ></span>
          ) : (
            getTranslation("Readmission Blood Analysis Form/पुनः प्रवेश रक्त विश्लेषण प्रपत्र",lang)
          )}
        </Button>
      </div>
    </form>
  </div>
</CommonModal>
{/* BA Prefill readmission form end */}

      {/* View user details modal */}
      <UserDetailsModal
        isOpen={viewUserDetailsModal}
        userId={selectedViewUserId}
        toggler={() => setViewUserDetailsModal(false)}
      />

      {/* Upload Report Modal (Lab Operator / Staff) */}
      <CommonModal
        isOpen={uploadModalOpen}
        title={getTranslation("Upload Lab Observation Report / लैब रिपोर्ट अपलोड करें", lang)}
        toggler={() => setUploadModalOpen(false)}
        maxWidth="650px"
      >
        <div className="p-3">
          <div className="alert alert-info py-2 px-3 mb-3">
            <strong>{getTranslation("Patient:", lang)}</strong> {selectedObservationForUpload?.name || "Patient"} &nbsp;|&nbsp;
            <strong>{getTranslation("ID:", lang)}</strong> #{selectedObservationForUpload?.blood_analysis_id || selectedObservationForUpload?.id} &nbsp;|&nbsp;
            <strong>{getTranslation("Package:", lang)}</strong> {Array.isArray(selectedObservationForUpload?.package_name) ? selectedObservationForUpload.package_name.join(", ") : (selectedObservationForUpload?.package_name || "—")}
          </div>

          <form onSubmit={handleUploadReportSubmit}>
            <FormGroup className="mb-3">
              <Label className="fw-semibold">
                {getTranslation("Report File (PDF / Image) / रिपोर्ट फ़ाइल", lang)} <span className="text-danger">*</span>
              </Label>
              <Input
                type="file"
                id="modalReportFileInput"
                accept=".pdf,.png,.jpg,.jpeg"
                required
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    if (file.size > 10 * 1024 * 1024) {
                      toast.error(getTranslation("Report file size exceeds 10 MB limit / फ़ाइल का आकार 10 MB से अधिक है", lang));
                      e.target.value = "";
                      return;
                    }
                    setUploadFormData((prev) => ({
                      ...prev,
                      report_file: file,
                      report_file_path: file.name,
                      report_file_type: file.type.includes("pdf") ? "PDF" : "IMAGE",
                    }));
                  }
                }}
              />
              {uploadFormData.report_file_path && (
                <small className="text-success mt-1 d-block">
                  Selected: {uploadFormData.report_file_path} ({uploadFormData.report_file_type})
                </small>
              )}
            </FormGroup>

            <FormGroup className="mb-3">
              <Label className="fw-semibold">{getTranslation("Lab Technician Remarks / लैब तकनीशियन टिप्पणी", lang)}</Label>
              <Input
                type="textarea"
                rows="3"
                placeholder={getTranslation("Enter findings or test status remarks...", lang)}
                value={uploadFormData.remarks}
                onChange={(e) => setUploadFormData((prev) => ({ ...prev, remarks: e.target.value }))}
              />
            </FormGroup>

            <div className="d-flex justify-content-end gap-2 pt-2">
              <Button color="secondary" type="button" onClick={() => setUploadModalOpen(false)}>
                {getTranslation("Cancel / रद्द करें", lang)}
              </Button>
              <Button color="primary" type="submit">
                <Upload size={16} className="me-1" />
                {getTranslation("Upload & Complete / रिपोर्ट जमा करें", lang)}
              </Button>
            </div>
          </form>
        </div>
      </CommonModal>

      {/* Review Report & Follow-up Scheduling Modal (SuperAdmin / BranchAdmin / Operator) */}
      <CommonModal
        isOpen={reviewModalOpen}
        title={getTranslation("Clinical Review & Follow-up / नैदानिक समीक्षा एवं अनुवर्ती", lang)}
        toggler={() => setReviewModalOpen(false)}
        maxWidth="650px"
      >
        <div className="p-3">
          <div className="alert alert-light border py-2 px-3 mb-3">
            <strong>{getTranslation("Patient:", lang)}</strong> {selectedObservationForReview?.name || "Patient"} &nbsp;|&nbsp;
            <strong>{getTranslation("ID:", lang)}</strong> #{selectedObservationForReview?.blood_analysis_id || selectedObservationForReview?.id} &nbsp;|&nbsp;
            <strong>{getTranslation("Current Visit:", lang)}</strong> #{selectedObservationForReview?.follow_up_visit || 1}
          </div>

          <form onSubmit={handleReviewReportSubmit}>
            <FormGroup className="mb-3">
              <Label className="fw-semibold">{getTranslation("Severity Classification / गंभीरता वर्गीकरण", lang)}</Label>
              <Input
                type="select"
                value={reviewFormData.severity_id}
                onChange={(e) => {
                  const chosen = severity.find((s) => String(s.severity_id) === String(e.target.value));
                  setReviewFormData((prev) => ({
                    ...prev,
                    severity_id: e.target.value,
                    severity_name: chosen ? chosen.severity_name : "",
                  }));
                }}
              >
                <option value="">{getTranslation("Select Severity / गंभीरता चुनें", lang)}</option>
                {severity.map((s) => (
                  <option key={s.severity_id} value={s.severity_id}>
                    {s.severity_name}
                  </option>
                ))}
              </Input>
            </FormGroup>

            <FormGroup className="mb-3">
              <Label className="fw-semibold">{getTranslation("Next Follow-up Date (Optional) / अगली अनुवर्ती तिथि", lang)}</Label>
              <Input
                type="date"
                value={reviewFormData.follow_up_date || ""}
                onChange={(e) => setReviewFormData((prev) => ({ ...prev, follow_up_date: e.target.value }))}
              />
              <small className="text-muted">
                {getTranslation(
                  "If scheduled, status updates to 'Next_follow_up' and patient's next visit increments to #",
                  lang
                )}
                {(selectedObservationForReview?.follow_up_visit || 1) + 1}.
              </small>
            </FormGroup>

            <FormGroup className="mb-3">
              <Label className="fw-semibold">{getTranslation("Doctor / Reviewer Remarks / डॉक्टर / समीक्षक टिप्पणी", lang)}</Label>
              <Input
                type="textarea"
                rows="3"
                placeholder={getTranslation("Enter clinical impression, doctor notes...", lang)}
                value={reviewFormData.remarks}
                onChange={(e) => setReviewFormData((prev) => ({ ...prev, remarks: e.target.value }))}
              />
            </FormGroup>

            <div className="d-flex justify-content-end gap-2 pt-2">
              <Button color="secondary" type="button" onClick={() => setReviewModalOpen(false)}>
                {getTranslation("Cancel / रद्द करें", lang)}
              </Button>
              <Button color="success" type="submit">
                <CheckCircle size={16} className="me-1" />
                {getTranslation("Save Review / समीक्षा सहेजें", lang)}
              </Button>
            </div>
          </form>
        </div>
      </CommonModal>

      {/* Quick Patient Select Modal for Creating BA or Recording Vitals */}
      <CommonModal
        isOpen={quickPatientModalOpen}
        title={getTranslation("Select Admitted Patient / भर्ती मरीज चुनें", lang)}
        toggler={() => setQuickPatientModalOpen(false)}
        maxWidth="750px"
      >
        <div className="p-3">
          <InputGroup className="mb-3">
            <Input
              type="text"
              placeholder={getTranslation("Type to search patient name, GKS ID, phone... / खोजें...", lang)}
              value={quickPatientSearch}
              onChange={(e) => setQuickPatientSearch(e.target.value)}
              autoFocus
            />
            <span className="input-group-text">
              <i className="fa fa-search"></i>
            </span>
          </InputGroup>

          <div style={{ maxHeight: "380px", overflowY: "auto" }}>
            {data
              .filter((p) => {
                const q = quickPatientSearch.toLowerCase().trim();
                if (!q) return true;
                return (
                  p.name?.toLowerCase().includes(q) ||
                  p.gks_id?.toLowerCase().includes(q) ||
                  p.phone?.includes(q)
                );
              })
              .map((patient) => (
                <div
                  key={patient.id}
                  className="p-2 px-3 mb-2 border rounded d-flex justify-content-between align-items-center bg-white shadow-sm"
                >
                  <div>
                    <span className="badge bg-light text-dark border me-2 fw-bold">{patient.gks_id || "N/A"}</span>
                    <strong className="text-dark">{patient.name}</strong>
                    <div className="small text-muted">
                      {patient.phone ? `Ph: ${patient.phone}` : ""} {patient.gender ? `| ${patient.gender}` : ""} {patient.age ? `• ${patient.age} yrs` : ""}
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <Button
                      color="success"
                      size="sm"
                      onClick={() => {
                        setQuickPatientModalOpen(false);
                        createSUDBrief(patient.id);
                      }}
                      className="d-flex align-items-center gap-1"
                    >
                      <Plus size={13} />
                      {getTranslation("Lab Test", lang)}
                    </Button>
                    <Button
                      color="primary"
                      size="sm"
                      onClick={() => {
                        setQuickPatientModalOpen(false);
                        handleOpenObservationModal(patient);
                      }}
                      className="d-flex align-items-center gap-1"
                    >
                      <Heart size={13} />
                      {getTranslation("Record Vitals", lang)}
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </CommonModal>

      {/* Patient Physical Observation Form Modal (Screenshot 5: W, SPO2, BP) */}
      <CommonModal
        isOpen={isObservationModalOpen}
        title={getTranslation("Patient Physical Observation / रोगी शारीरिक अवलोकन (W, SpO2, BP)", lang)}
        toggler={() => setIsObservationModalOpen(false)}
        maxWidth="750px"
      >
        <div className="p-3">
          <div className="alert alert-light border py-2 px-3 mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <strong>{getTranslation("Patient:", lang)}</strong> {selectedPatientForObservation?.name || "Patient"} &nbsp;|&nbsp;
              <strong>{getTranslation("GKS ID:", lang)}</strong> {selectedPatientForObservation?.gks_id || "—"}
            </div>
            <div className="text-muted small">
              {selectedPatientForObservation?.gender || ""} {selectedPatientForObservation?.age ? `• ${selectedPatientForObservation?.age} Yrs` : ""}
            </div>
          </div>

          <DraftNoticeBanner
            draftTimestamp={obsDraftTimestamp}
            formKey="patient_observation"
            targetId={selectedPatientForObservation?.id || selectedPatientForObservation?.user_id}
            onDiscard={() => {
              setObservationFormData({
                date_of_observation: new Date(),
                weight: "",
                spo2: "",
                blood_pressure: "",
                pulse_rate: "",
                remarks: "",
              });
              setObsDraftTimestamp(null);
            }}
          />

          <form onSubmit={handleSavePatientObservation}>
            <Row>
              <Col md="6" className="mb-3">
                <FormGroup>
                  <Label className="fw-semibold text-dark">
                    {getTranslation("Date of Observation / अवलोकन तिथि", lang)} <span className="text-danger">*</span>
                  </Label>
                  <DatePicker
                    className="form-control"
                    selected={
                      observationFormData.date_of_observation instanceof Date
                        ? observationFormData.date_of_observation
                        : new Date(observationFormData.date_of_observation || Date.now())
                    }
                    onChange={(date) =>
                      setObservationFormData((prev) => ({ ...prev, date_of_observation: date }))
                    }
                    dateFormat="yyyy-MM-dd"
                  />
                </FormGroup>
              </Col>

              <Col md="6" className="mb-3">
                <FormGroup>
                  <Label className="fw-semibold text-dark">
                    ⚖️ {getTranslation("Weight (W in kg) / वजन", lang)} <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 68.5"
                    value={observationFormData.weight}
                    onChange={(e) =>
                      setObservationFormData((prev) => ({ ...prev, weight: e.target.value }))
                    }
                    required
                  />
                  <small className="text-muted">{getTranslation("Patient body weight in kilograms", lang)}</small>
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md="6" className="mb-3">
                <FormGroup>
                  <Label className="fw-semibold text-dark">
                    🫁 {getTranslation("SpO2 (% Saturation) / ऑक्सीजन", lang)} <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="50"
                    max="100"
                    placeholder="e.g. 98"
                    value={observationFormData.spo2}
                    onChange={(e) =>
                      setObservationFormData((prev) => ({ ...prev, spo2: e.target.value }))
                    }
                    required
                  />
                  <small className="text-muted">
                    {Number(observationFormData.spo2) >= 95 ? (
                      <span className="text-success fw-bold">✓ Normal (≥95%)</span>
                    ) : Number(observationFormData.spo2) >= 90 ? (
                      <span className="text-warning fw-bold">⚠ Borderline (90-94%)</span>
                    ) : observationFormData.spo2 ? (
                      <span className="text-danger fw-bold">🚨 Low / Hypoxia (&lt;90%)</span>
                    ) : (
                      getTranslation("Normal range: 95-100%", lang)
                    )}
                  </small>
                </FormGroup>
              </Col>

              <Col md="6" className="mb-3">
                <FormGroup>
                  <Label className="fw-semibold text-dark">
                    🩺 {getTranslation("Blood Pressure (BP in mmHg) / रक्तचाप", lang)} <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="text"
                    placeholder="e.g. 120/80"
                    value={observationFormData.blood_pressure}
                    onChange={(e) =>
                      setObservationFormData((prev) => ({ ...prev, blood_pressure: e.target.value }))
                    }
                    required
                  />
                  <small className="text-muted">{getTranslation("Systolic / Diastolic format (e.g. 120/80)", lang)}</small>
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md="6" className="mb-3">
                <FormGroup>
                  <Label className="fw-semibold text-dark">
                    💓 {getTranslation("Pulse Rate (bpm) / नाड़ी की गति", lang)}
                  </Label>
                  <Input
                    type="number"
                    placeholder="e.g. 72"
                    value={observationFormData.pulse_rate}
                    onChange={(e) =>
                      setObservationFormData((prev) => ({ ...prev, pulse_rate: e.target.value }))
                    }
                  />
                  <small className="text-muted">{getTranslation("Optional (Normal: 60-100 bpm)", lang)}</small>
                </FormGroup>
              </Col>

              <Col md="6" className="mb-3">
                <div className="p-3 border rounded bg-light h-100">
                  <div className="fw-bold text-dark mb-1 small">{getTranslation("Clinical Summary / सारांश", lang)}</div>
                  <div className="d-flex flex-wrap gap-2 pt-1">
                    <Badge color="light" className="text-dark border">
                      ⚖️ W: {observationFormData.weight || "—"} kg
                    </Badge>
                    <Badge color="light" className="text-dark border">
                      🫁 SpO2: {observationFormData.spo2 || "—"}%
                    </Badge>
                    <Badge color="light" className="text-dark border">
                      🩺 BP: {observationFormData.blood_pressure || "—"}
                    </Badge>
                  </div>
                </div>
              </Col>
            </Row>

            <FormGroup className="mb-3">
              <Label className="fw-semibold text-dark">
                📝 {getTranslation("Clinical Remarks / अवलोकन टिप्पणी", lang)}
              </Label>
              <Input
                type="textarea"
                rows="2"
                placeholder={getTranslation("Enter any symptoms, visible distress, or doctor remarks...", lang)}
                value={observationFormData.remarks}
                onChange={(e) =>
                  setObservationFormData((prev) => ({ ...prev, remarks: e.target.value }))
                }
              />
            </FormGroup>

            <div className="d-flex justify-content-end gap-2 pt-2">
              <SaveDraftButton
                formKey="patient_observation"
                targetId={selectedPatientForObservation?.id || selectedPatientForObservation?.user_id}
                formData={observationFormData}
                onDraftSaved={() => setObsDraftTimestamp(Date.now())}
                style={{ height: "38px", padding: "6px 16px" }}
              />
              <Button color="secondary" type="button" onClick={() => setIsObservationModalOpen(false)}>
                {getTranslation("Cancel / रद्द करें", lang)}
              </Button>
              <Button color="primary" type="submit">
                <Heart size={15} className="me-1" />
                {getTranslation("Save Vitals / अवलोकन सहेजें", lang)}
              </Button>
            </div>
          </form>
        </div>
      </CommonModal>

      {/* View Patient Physical Observation Modal */}
      <CommonModal
        isOpen={viewObservationModalOpen}
        title={getTranslation("Patient Vitals Observation Details / रोगी शारीरिक अवलोकन विवरण", lang)}
        toggler={() => setViewObservationModalOpen(false)}
        maxWidth="650px"
      >
        <div className="p-3">
          {selectedObservationForView ? (
            <div>
              <div className="card shadow-none border mb-3">
                <div className="card-header bg-light py-2 px-3 fw-bold text-dark d-flex justify-content-between align-items-center">
                  <span>👤 {selectedObservationForView.name || "Patient"}</span>
                  <span className="badge bg-secondary">{selectedObservationForView.gks_id || "N/A"}</span>
                </div>
                <div className="card-body p-3">
                  <Row className="g-3">
                    <Col xs="6" md="3">
                      <div className="p-2 border rounded bg-white text-center">
                        <small className="text-muted d-block">{getTranslation("Weight (W)", lang)}</small>
                        <strong className="text-primary fs-6">⚖️ {selectedObservationForView.weight || "—"} kg</strong>
                      </div>
                    </Col>
                    <Col xs="6" md="3">
                      <div className="p-2 border rounded bg-white text-center">
                        <small className="text-muted d-block">{getTranslation("SpO2", lang)}</small>
                        <strong className="text-success fs-6">🫁 {selectedObservationForView.spo2 || "—"}%</strong>
                      </div>
                    </Col>
                    <Col xs="6" md="3">
                      <div className="p-2 border rounded bg-white text-center">
                        <small className="text-muted d-block">{getTranslation("Blood Pressure", lang)}</small>
                        <strong className="text-dark fs-6">🩺 {selectedObservationForView.blood_pressure || "—"}</strong>
                      </div>
                    </Col>
                    <Col xs="6" md="3">
                      <div className="p-2 border rounded bg-white text-center">
                        <small className="text-muted d-block">{getTranslation("Pulse Rate", lang)}</small>
                        <strong className="text-info fs-6">💓 {selectedObservationForView.pulse_rate || "—"} bpm</strong>
                      </div>
                    </Col>
                  </Row>

                  <div className="mt-3 p-2 px-3 border rounded bg-light">
                    <small className="text-muted fw-bold d-block">{getTranslation("Observation Date / तिथि:", lang)}</small>
                    <span className="text-dark">
                      {selectedObservationForView.date_of_observation || "—"}
                    </span>
                  </div>

                  <div className="mt-2 p-2 px-3 border rounded bg-light">
                    <small className="text-muted fw-bold d-block">{getTranslation("Remarks / टिप्पणी:", lang)}</small>
                    <span className="text-dark">
                      {selectedObservationForView.remarks || getTranslation("No remarks recorded.", lang)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-end">
                <Button color="primary" size="sm" onClick={() => setViewObservationModalOpen(false)}>
                  {getTranslation("Close / बंद करें", lang)}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted">
              {getTranslation("No observation record found.", lang)}
            </div>
          )}
        </div>
      </CommonModal>
    
   </Fragment>
  );
};

export default BloodAnalysis;

