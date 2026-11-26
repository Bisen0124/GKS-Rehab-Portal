import React, {
  useEffect,
  useState,
  useCallback,
  Fragment,
  useRef,
} from "react";
import {
  patientFirstAssessment,
  dateOfAdmission,
  dateOfAssessment,
  patientName,
  patientSex,
  patientAge,
  dependentTo,
  substanceUsePattern,
  substanceUseFrequency,
  usingMedicine,
  last30DaysQuantity,
  tableNumber,
  genralPhysicalExamination,
  Observation,
  anyMedicalHistory,
  anyBloodTransfusionHistory,
  mentionIfAny,
  tableNumber2,
  complicationDetails,
  yes,
  no,
  ulcers,
  respiratoryProblem,
  jaundice,
  Haematemesis,
  mentionIfAny2,
  tableNumber3,
  neurological,
  yes1,
  male,
  female,
  other,
  no1,
  otherAbdominalComplaints,
  cardiovascular,
  consent,
  name,
  relationship,
  signature,
  anyOtherFindings,
  prepared,
  Simple,
  neurologicalOptions,
  Weight,
  PulseRate,
  Bloodpressure,
  Temperature,
  Lymphadenopathy,
} from "../../Constant";
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
  Table,
  Button,
  InputGroup,
  Spinner,
  Badge,
} from "reactstrap";
import UserDetailsModal from "../Common/UserDetailsModal";
import ModalLoading from "../Common/ModalLoading";
import { H5, Btn, P, H4 } from "../../AbstractElements";
import DatePicker from "react-datepicker";
import CommonModal from "../UiKits/Modals/common/modal";
import { toast } from "react-toastify";
import HeaderCard from "../Common/Component/HeaderCard";
import { ActionButtonsGroup, TableActionButton } from "../Common/Component/ActionButtons";
import DataTable from "react-data-table-component";
import { Data } from "../UiKits/Spinners/SpinnerData";

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

import Translated from "../Translated";
import { useLang } from "../../contexts/LangContext";
import { getTranslation } from "../../utils/translator";

import VoiceTextarea from "../VoiceTextarea/VoiceTextarea";

import { printElementAsPdf } from "../../utils/pdfPrintHelper";
import TableExportButtons from "../Common/TableExportButtons";
import { SaveDraftButton, DraftNoticeBanner } from "../Common/SaveDraftButton";
import { loadDraft, clearDraft, safeDate } from "../../utils/formDraftManager";
import ModalActionButtons from "../Common/ModalActionButtons";
import { validateCompulsoryFields, showApiErrorAlert } from "../../utils/formValidationHelper";

function PFA() {
  const { lang } = useLang(); // get current language from context


 //Branches selection
  const { selectedBranch } = useBranch();

  const pdfRef = useRef();
  const [isDownloading, setIsDownloading] = useState(false);

  //spinner extract from other file
  const selectedSpinner = Data.find(
    (item) => item.spinnerClass === "loader-37"
  );

  const CUSTOM_DEPENDENT_STORAGE_KEY = "gks_pfa_custom_dependent_options_v1";

  const DEFAULT_DEPENDENT_OPTIONS = [
    { value: "Alcohol", label: "Alcohol / शराब" },
    { value: "Afeem, Doada Chura", label: "Afeem, Doada Chura / अफीम, डोडा चुरा" },
    { value: "Samke Heroin", label: "Samke Heroin / समके हेरोइन" },
    { value: "Coacine", label: "Coacine / कोकीन" },
    { value: "MD", label: "MD / एमडी" },
    { value: "Ganja, Bhang, Charas, Munnka", label: "Ganja, Bhang, Charas, Munnka / गांजा, भांग, चरस, मुन्नका" },
    { value: "Inhalant Abuse", label: "Inhalant Abuse / इनहेलेंट का दुरुपयोग" },
    { value: "Medical Abuse", label: "Medical Abuse / चिकित्सा दुरुपयोग" },
    { value: "Multi Addict", label: "Multi Addict / मल्टी एडिक्ट" },
  ];

  const SUBSTANCE_USE_PATTERN_OPTIONS = [
    { value: "Orally", label: "Orally / मौखिक" },
    { value: "Smoke", label: "Smoke / धूम्रपान" },
    { value: "Inhale", label: "Inhale / साँस द्वारा" },
    { value: "Drink", label: "Drink / पीना" },
    { value: "Inject", label: "Inject / इंजेक्शन" },
    { value: "Snorting", label: "Snorting / नाक से खींचना" },
    { value: "Sniff", label: "Sniff / सूंघना" },
    { value: "Chase", label: "Chase / चेज़" },
  ];

  const [customDependentOptions, setCustomDependentOptions] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CUSTOM_DEPENDENT_STORAGE_KEY) || "[]");
      return Array.isArray(saved) ? saved.filter((item) => typeof item === "string" && item.trim()) : [];
    } catch {
      return [];
    }
  });
  const [customDependentInput, setCustomDependentInput] = useState("");

  const parseDependentSelection = (rawVal, knownList = []) => {
    if (!rawVal) return [];
    if (Array.isArray(rawVal)) {
      return Array.from(new Set(rawVal.map((x) => String(x).trim()).filter(Boolean)));
    }
    const str = String(rawVal).trim();
    if (!str) return [];

    if (str.includes("|")) {
      return Array.from(new Set(str.split("|").map((s) => s.trim()).filter(Boolean)));
    }

    const allKnown = [
      ...DEFAULT_DEPENDENT_OPTIONS.map((o) => o.value),
      ...knownList,
    ].filter(Boolean);

    const exact = allKnown.find((k) => k.toLowerCase() === str.toLowerCase());
    if (exact) return [exact];

    // Extract known values that contain commas before splitting remaining values on commas
    const multiCommaKnown = Array.from(new Set(allKnown.filter((k) => k.includes(","))))
      .sort((a, b) => b.length - a.length);

    let working = str;
    const placeholders = [];
    multiCommaKnown.forEach((opt) => {
      const idx = working.toLowerCase().indexOf(opt.toLowerCase());
      if (idx !== -1) {
        const token = `__GKS_DEP_${placeholders.length}__`;
        placeholders.push(opt);
        working = working.slice(0, idx) + token + working.slice(idx + opt.length);
      }
    });

    const parts = working
      .split(",")
      .map((part) => {
        const p = part.trim();
        const m = p.match(/^__GKS_DEP_(\d+)__$/);
        return m ? placeholders[Number(m[1])] : p;
      })
      .filter(Boolean);

    return Array.from(new Set(parts));
  };

  const serializeDependentSelection = (list) => {
    return Array.from(
      new Set((list || []).map((item) => String(item).trim()).filter(Boolean))
    ).join(" | ");
  };

  const parseUsePatternSelection = (rawVal) => {
    if (!rawVal) return [];
    const items = Array.isArray(rawVal) ? rawVal : String(rawVal).split(/[,|]/);
    const cleaned = items
      .map((s) => {
        const trimmed = String(s).trim();
        if (!trimmed) return "";
        if (trimmed.toLowerCase() === "snotting") return "Snorting";
        const canonical = SUBSTANCE_USE_PATTERN_OPTIONS.find(
          (o) => o.value.toLowerCase() === trimmed.toLowerCase()
        );
        return canonical ? canonical.value : trimmed;
      })
      .filter(Boolean);
    return Array.from(new Set(cleaned));
  };

  const serializeUsePatternSelection = (list) => {
    return Array.from(
      new Set((list || []).map((item) => String(item).trim()).filter(Boolean))
    ).join(", ");
  };

  const SCREENING_KEYS = ["hiv", "hcv", "hbsag", "vdrl", "syphilis", "vdrl_syphilis"];
  const EXTENDED_PFA_KEYS = [
    ...SCREENING_KEYS,
    "diabetes",
    "substance_use_frequency",
    "using_medicine",
  ];

  const normalizeScreeningValue = (val) => {
    if (val === null || val === undefined || val === "") return "";
    const trimmed = String(val).trim();
    const lower = trimmed.toLowerCase();
    if (["not done", "not_done", "not tested", "not_tested", "na", "n/a"].includes(lower)) {
      return "NA";
    }
    if (lower === "positive") return "Positive";
    if (lower === "negative") return "Negative";
    return "";
  };

  const normalizeDiabetesValue = (val) => {
    if (val === null || val === undefined || val === "") return "";
    const trimmed = String(val).trim();
    const lower = trimmed.toLowerCase();
    if (lower === "yes" || lower === "हाँ") return "Yes";
    if (lower === "no" || lower === "नहीं") return "No";
    if (["na", "n/a", "not done", "not_done", "not tested"].includes(lower)) return "NA";
    return "";
  };

  const saveLocalPFAScreening = (userId, pfaId, dataObj) => {
    try {
      const combinedVdrlSyph = normalizeScreeningValue(
        dataObj?.vdrl_syphilis ?? dataObj?.vdrl ?? dataObj?.syphilis
      );
      const record = {
        hiv: normalizeScreeningValue(dataObj?.hiv),
        hcv: normalizeScreeningValue(dataObj?.hcv ?? dataObj?.hepatitis_c),
        hbsag: normalizeScreeningValue(dataObj?.hbsag ?? dataObj?.hepatitis_b),
        vdrl_syphilis: combinedVdrlSyph,
        vdrl: combinedVdrlSyph,
        syphilis: combinedVdrlSyph,
        diabetes: normalizeDiabetesValue(dataObj?.diabetes),
        substance_use_frequency: String(
          dataObj?.substance_use_frequency ?? dataObj?.substanceUseFrequencyData ?? ""
        ),
        using_medicine: String(dataObj?.using_medicine ?? ""),
      };
      if (pfaId) localStorage.setItem(`gks_pfa_screening_pfa_${pfaId}`, JSON.stringify(record));
      if (userId) localStorage.setItem(`gks_pfa_screening_user_${userId}`, JSON.stringify(record));
    } catch {
      // ignore storage errors
    }
  };

  const loadLocalPFAScreening = (userId, pfaId) => {
    try {
      const byPfa = pfaId ? localStorage.getItem(`gks_pfa_screening_pfa_${pfaId}`) : null;
      const byUser = userId ? localStorage.getItem(`gks_pfa_screening_user_${userId}`) : null;
      const raw = byPfa || byUser;
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      const combinedVdrlSyph = normalizeScreeningValue(
        parsed?.vdrl_syphilis ?? parsed?.vdrl ?? parsed?.syphilis
      );
      return {
        hiv: normalizeScreeningValue(parsed?.hiv),
        hcv: normalizeScreeningValue(parsed?.hcv ?? parsed?.hepatitis_c),
        hbsag: normalizeScreeningValue(parsed?.hbsag ?? parsed?.hepatitis_b),
        vdrl_syphilis: combinedVdrlSyph,
        vdrl: combinedVdrlSyph,
        syphilis: combinedVdrlSyph,
        diabetes: normalizeDiabetesValue(parsed?.diabetes),
        substance_use_frequency: parsed?.substance_use_frequency || "",
        using_medicine: parsed?.using_medicine || "",
      };
    } catch {
      return {};
    }
  };

  const submitPFAWithScreeningFallback = async (url, method, token, payloadObj) => {
    const doFetch = async (bodyObj) => {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify(bodyObj),
      });
      const json = await res.json().catch(() => ({}));
      return { response: res, result: json };
    };

    let { response, result } = await doFetch(payloadObj);

    let currentPayload = { ...payloadObj };
    for (let attempt = 0; attempt < 2 && !response.ok; attempt++) {
      const errStr = JSON.stringify(result || "").toLowerCase();
      let modified = false;

      if (errStr.includes("not allowed") || errStr.includes("unknown") || errStr.includes("not permitted")) {
        EXTENDED_PFA_KEYS.forEach((k) => {
          if (Object.prototype.hasOwnProperty.call(currentPayload, k) && errStr.includes(k)) {
            delete currentPayload[k];
            modified = true;
          }
        });
      }

      if (
        (errStr.includes("not done") || errStr.includes("must be one of") || errStr.includes("invalid")) &&
        ["hiv", "hcv", "hbsag", "vdrl", "syphilis"].some((k) => currentPayload[k] === "NA")
      ) {
        ["hiv", "hcv", "hbsag", "vdrl", "syphilis"].forEach((k) => {
          if (currentPayload[k] === "NA") {
            currentPayload[k] = "Not Done";
            modified = true;
          }
        });
      }

      if (!modified) break;
      ({ response, result } = await doFetch(currentPayload));
    }

    return { response, result };
  };

  const initialPFAFormData = {
    dateOfAdmission: new Date(),
    dateOfAssessment: new Date(),
    dependentToData: "",
    substanceUseFrequencyData: "",
    substanceUsePatternData: "",
    last30DaysQuantityData: "",

    medicalConfirmationData: "", // for anyMedicalHistory
    bloodConfirmationData: "", // for anyBloodTransfusionHistory
    weight: "",
    pulse_rate: "",
    blood_pressure: "",
    temperature: "",
    spo2: "",
    diabetes: "",
    hiv: "",
    hcv: "",
    hbsag: "",
    vdrl_syphilis: "",
    vdrl: "",
    syphilis: "",

    lymphadenopathy: "",

    bloodTransfusionHistoryData: "",

    complications: {
      ulcer: "",
      respiratory_problem: "",
      jaundice: "",
      haematemesis: "",
      abdominal_complaints: "",
      cardiovascular: "",
    },
    complication_description: "",

    neurological: {
      delirium: "",
      seizure: "",
      blackout: "",
      memory_loss: "",
      trembling: "",
      epilepsy: "",
      neuropathy: "",
    },
    neuro_description: "",

    nutritional_status: "",

    using_medicine: "",
    other_findings: "",

    consent: "No", // or "Yes" if checked by default
    consent_name: "",
    consent_relationship: "",
    consent_signature: "",
    prepared_by: "",

    verification: "No",
  };

  //PFA form data
  const [formData, setFormData] = useState(initialPFAFormData);
  const [draftTimestamp, setDraftTimestamp] = useState(null);
  const [currentPFAUserId, setCurrentPFAUserId] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAssesmentDateChange = (name, date) => {
    setFormData((prev) => ({
      ...prev,
      [name]: date,
    }));
  };

  //Registered Patient data
  const [data, setData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [stillLoading, setstillLoading] = useState(true);
  useEffect(() => {
    if (!selectedBranch) return; // avoid empty branch fetch
  
    const token = localStorage.getItem("Authorization");
  
    fetch(`https://gks-yjdc.onrender.com/api/users?branch_id=${selectedBranch}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch PFA user details");
        return response.json();
      })
      .then((res) => {
        const users = res.data || []; // <-- FIXED
  
        const formatted = users.map((user) => {
          const admitDate = user.recent_admit_date
            ? new Date(user.recent_admit_date)
            : null;
          const pfaDate = user.recent_pfa_date
            ? new Date(user.recent_pfa_date)
            : null;
        
          let isPFACompleted = false;
          let userStatus = (
            <p className="badge bg-warning text-dark p-2">{getTranslation("Pending/लंबित",lang)}</p>
          );
        
          if (admitDate && pfaDate && admitDate > pfaDate) {
            isPFACompleted = true;
            userStatus = <p className="badge bg-success p-2">{getTranslation("Completed/पुरा होना।",lang)}</p>;
          }
        
          const dischargeStatus = user.discharge_status_text || "Unknown";
        
          return {
            id: user.user_id,
            gks_id: user.gks_id || user.custom_code || user.uid || "N/A",
            name: user.name,
            status: userStatus,
            isPFACompleted,   // ✅ new flag
            dischargeStatus: user.discharge_status,
            dischargeStatusText: dischargeStatus,
            isReadmission: user.is_readmission,
            recent_pfa_id: user.recent_pfa_id,
          };
        });
        
  
        setTimeout(() => {
          setData(formatted);
          setFilteredData(formatted);
          setstillLoading(false);
        }, 1000);
      })
      .catch((error) => {
        console.error("Error fetching PFA user data:", error);
        setstillLoading(true);
      });
  }, [selectedBranch]);
  
  




  //PFA view
  const [viewModal, setViewModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [viewUserDetailsModal, setViewUserDetailsModal] = useState(false);
  const [selectedViewUserId, setSelectedViewUserId] = useState(null);

  const handleViewUserDetails = (userId) => {
    setSelectedViewUserId(userId);
    setViewUserDetailsModal(true);
  };

  //close view data modal
  const closeUserViewModal = () => {
    setViewModal(false);
    setPFAEditModal(false);
    setPFAEditIndividualDataModal(false);
  };


//Getting registred patient data into table row 
  const tableColumns = [
  { name: `${getTranslation('GKS ID/GKS आईडी' , lang)}`, selector: (row) => row.gks_id, sortable: true, center: true },
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
  //Old code
// {
//   name: "Action",
//   center: true,
//   cell: (row) => (
//     <div className="d-flex gap-2">
//       <span
//             onClick={() => toggle(row.id)}
//             style={{ cursor: "pointer" }}
//             title="View"
//           >
//           <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 width="24"
//                 height="24"
//                 viewBox="0 0 24 24"
//                 fill="none"
//                 stroke="currentColor"
//                 stroke-width="2"
//                 stroke-linecap="round"
//                 stroke-linejoin="round"
//               >
//                 <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
//                 <line x1="12" y1="8" x2="12" y2="16"></line>
//                 <line x1="8" y1="12" x2="16" y2="12"></line>
//               </svg>
//         </span>
//         <>
//           {/* <span
//             onClick={() => viewPFAToggle(row.id)}
//             style={{ cursor: "pointer" }}
//             title="View"
//           >
//             <svg
//               style={{ color: "#d56337" }}
//               xmlns="http://www.w3.org/2000/svg"
//               width="20"
//               height="20"
//               viewBox="0 0 24 24"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth="2"
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               className="feather feather-eye"
//             >
//               <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
//               <circle cx="12" cy="12" r="3"></circle>
//             </svg>
//           </span>
//           <span
//             onClick={() => handleFAEdit(row.id)}
//             style={{ cursor: "pointer", marginLeft: "10px" }}
//             title="Edit"
//           >
//           <svg
//               style={{ color: "green" }}
//               xmlns="http://www.w3.org/2000/svg"
//               width="20"
//               height="20"
//               viewBox="0 0 24 24"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth="2"
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               className="feather feather-edit"
//             >
//               <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
//               <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
//             </svg>
//           </span>
//           <span
//             onClick={() => handlePFADelete(row.id)}
//             style={{ cursor: "pointer", marginLeft: "10px" }}
//             title="Delete"
//           >
//             <svg
//               style={{ color: "red" }}
//               xmlns="http://www.w3.org/2000/svg"
//               width="20"
//               height="20"
//               viewBox="0 0 24 24"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth="2"
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               className="feather feather-trash-2"
//             >
//               <polyline points="3 6 5 6 21 6"></polyline>
//               <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
//               <line x1="10" y1="11" x2="10" y2="17"></line>
//               <line x1="14" y1="11" x2="14" y2="17"></line>
//             </svg>
//           </span> */}
          
//         </>
      
//     </div>
//   ),
// },

//Updated code
{
  name: `${getTranslation('Action/क्रिया' , lang)}`,
  center: true,
  cell: (row) => {
    // Hide all actions if discharged
    if (row.dischargeStatus === 1) {
      return null;
    }

    return (
      <ActionButtonsGroup>
        <TableActionButton
          type="view"
          onClick={() => handleViewUserDetails(row.id)}
          title={getTranslation("View/देखना", lang)}
        />

        {/* Show Edit only if not discharged and readmission */}
        {row.dischargeStatus === 0 && row.isReadmission === 1 && (
          <TableActionButton
            type="edit"
            onClick={() => handlePreeFillCreateReadmissionPFA(row.recent_pfa_id)}
            title={getTranslation("Readmission PFA/पुनः प्रवेश पीएफए", lang)}
          />
        )}

        {/* Show Create PFA if not discharged and not readmission */}
        {row.dischargeStatus === 0 && row.isReadmission === 0 && (
          <TableActionButton
            type="create"
            onClick={() => toggle(row.id)}
            title={getTranslation("Create PFA/पीएफए ​​बनाएं", lang)}
          />
        )}
      </ActionButtonsGroup>
    );
  },
}



];

const tablePFAPatientListColumns = [
  { name: `${getTranslation('GKS ID/GKS आईडी' , lang)}`, selector: (row) => row.gks_id, sortable: true, center: true },
  { name: `${getTranslation('Patient Phone/मरीज़ का फ़ोन' , lang)}`, selector: (row) => row.phone, sortable: true, center: true },
  { name: `${getTranslation('Email/ईमेल' , lang)}`, selector: (row) => row.email, sortable: true, center: true },
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
    name: `${getTranslation('Status/स्थिति' , lang)}`,
    selector: (row) => row.status,
    sortable: true,
    cell: (row) => (
      <span style={{ color: row.disabled ? "#999" : "#000" }}>
        <p className="badge bg-success p-2">PFA {row.status}</p>
      </span>
    ),
  },
  {
    name: `${getTranslation('Verification / सत्यापन' , lang)}`,
    selector: (row) => row.verification,
    sortable: true,
    center: true,
    cell: (row) => {
      const isVerified = row.verification === "Yes";
      return (
        <span
          className={`badge ${isVerified ? "bg-success" : "bg-warning text-dark"} p-2`}
          style={{ fontSize: "11px", fontWeight: "600" }}
        >
          {isVerified
            ? `✓ ${getTranslation("Verified / सत्यापित", lang)}`
            : `⏳ ${getTranslation("Pending / लंबित", lang)}`}
        </span>
      );
    },
  },
  {
    name: `${getTranslation('Action/क्रिया' , lang)}`,
    center: true,
    cell: (row) => (
      <ActionButtonsGroup>
        <TableActionButton
          type="view"
          onClick={() => viewPFAToggle(row.user_id)}
          title={getTranslation("View/देखना", lang)}
        />
        <TableActionButton
          type="edit"
          onClick={() => handleAllPFAEditData(row.user_id)}
          title={getTranslation("Edit/संपादन करना", lang)}
        />
      </ActionButtonsGroup>
    ),
  },


];

  //view pfa handler
  //fetch the latest assessment based on created_at, then simply sort the assessments and pick the first one:
  const viewPFAToggle = async (userId = null) => {
    if (typeof userId === "object" && userId !== null) {
      userId = userId.id;
    }
  
    if (!userId) {
      console.error("Invalid userId provided to toggle");
      return;
    }
  
    setViewModal(true);
    setIsLoading(true);
  
    const branch_id = selectedBranch;
    const token = localStorage.getItem("Authorization");
  
    try {
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/pfa/user-assessments/${userId}?branch_id=${branch_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        }
      );
  
      const result = await response.json();
  
      if (!response.ok) {
        console.error("User fetch error:", result);
        return;
      }
  
      // API returns assessments array in result.data
      const latestAssessment = (result.data || []).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      )[0];
  
      if (!latestAssessment) {
        console.warn("No assessments found for this user.");
        return;
      }
  
      const localScreening = loadLocalPFAScreening(
        latestAssessment.user_id,
        latestAssessment.pfa_id || latestAssessment.id
      );

      const combinedVdrlSyphView = normalizeScreeningValue(
        latestAssessment.vdrl_syphilis ??
        latestAssessment.screening_tests?.vdrl_syphilis ??
        latestAssessment.health_metrics?.vdrl_syphilis ??
        latestAssessment.vdrl ??
        latestAssessment.screening_tests?.vdrl ??
        latestAssessment.health_metrics?.vdrl ??
        latestAssessment.syphilis ??
        latestAssessment.screening_tests?.syphilis ??
        latestAssessment.health_metrics?.syphilis ??
        localScreening.vdrl_syphilis ??
        localScreening.vdrl ??
        localScreening.syphilis
      );

      const assessmentData = latestAssessment ? {
        ...latestAssessment,
        substance_use_frequency: latestAssessment.substance_use_frequency ?? latestAssessment.assessment?.substance_use_frequency ?? localScreening.substance_use_frequency ?? "",
        using_medicine: latestAssessment.using_medicine ?? latestAssessment.health_metrics?.using_medicine ?? localScreening.using_medicine ?? "",
        temperature: latestAssessment.temperature ?? latestAssessment.health_metrics?.temperature,
        spo2: latestAssessment.spo2 ?? latestAssessment.health_metrics?.spo2,
        diabetes: normalizeDiabetesValue(latestAssessment.diabetes ?? latestAssessment.health_metrics?.diabetes ?? localScreening.diabetes),
        hiv: normalizeScreeningValue(latestAssessment.hiv ?? latestAssessment.screening_tests?.hiv ?? latestAssessment.health_metrics?.hiv ?? localScreening.hiv),
        hcv: normalizeScreeningValue(latestAssessment.hcv ?? latestAssessment.screening_tests?.hcv ?? latestAssessment.health_metrics?.hcv ?? latestAssessment.hepatitis_c ?? localScreening.hcv),
        hbsag: normalizeScreeningValue(latestAssessment.hbsag ?? latestAssessment.screening_tests?.hbsag ?? latestAssessment.health_metrics?.hbsag ?? latestAssessment.hepatitis_b ?? localScreening.hbsag),
        vdrl_syphilis: combinedVdrlSyphView,
        vdrl: combinedVdrlSyphView,
        syphilis: combinedVdrlSyphView,
        verification: latestAssessment.verification ?? latestAssessment.consent?.verification ?? "No",
      } : null;

      setSelectedUser(assessmentData);
      console.log("Selected User Assessment:", assessmentData);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  

  const selectableRowDisabled = (row) => row.disabled === true;

  const handleRowSelected = (state) => {
    const selectedRow = state.selectedRows[0];
    if (!selectedRow) return;

    if (selectedRow.disabled) {
      Swal.fire("Disabled", "This user's assessment is deleted.", "info");
      return;
    }

    setSelectedUser(selectedRow);
    setPFAEditModal(true);

    // Make sure this is set correctly
    setPFAeditData({
      pfa_id: selectedRow.pfa_id, // or selectedRow.pfa_id if that’s what you named it
      name: selectedRow.name,
      // include other fields if needed
    });
  };

  // //Date of Admission State/प्रवेश की तिथि
  // const [startDateOfAdmission, setstartDateOfAdmission] = useState(new Date());
  // const handleChangeAdmission = (date) => {
  //   setstartDateOfAdmission(date);
  //   console.log("Date of Admission", date);
  // };
  // //Date of Assessment State
  // const [startDateOfAssessment, setstartDateOfAssessment] = useState(
  //   new Date()
  // );
  // const handleChangeAssessment = (date) => {
  //   setstartDateOfAssessment(date);
  //   console.log("Date of Assessment", date);
  // };

  //Modal
  const [modal, setModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // User data

  //Auto fetch dob and calculate age based on dob
  //This React hook calculates a user's age based on their date of birth (dob) and returns the age on PFA form by create.
  const dob = selectedUser?.[0]?.dob;
  const patientCalAge = useCalculateAge(dob);
  console.log("DOB", patientCalAge);
  // const [patientCalAge, setPatientAge] = useState("");
  // useEffect(() => {
  //   if (selectedUser && selectedUser[0]?.dob) {
  //     const age = calculateAge(selectedUser[0].dob);
  //     setPatientAge(age);
  //   }
  // }, [selectedUser]);
  // const calculateAge = (dob) => {
  //   const birthDate = new Date(dob);
  //   const today = new Date();
  //   let age = today.getFullYear() - birthDate.getFullYear();
  //   const monthDiff = today.getMonth() - birthDate.getMonth();

  //   if (
  //     monthDiff < 0 ||
  //     (monthDiff === 0 && today.getDate() < birthDate.getDate())
  //   ) {
  //     age--;
  //   }

  //   return age;
  // };

  const closePFAModal = () => {
    setModal(false);
   

  };
  const toggle = async (userId = null) => {
    // Always open modal
    setModal(true);
    const targetUserId = userId || currentPFAUserId;
    if (userId) setCurrentPFAUserId(userId);
  
    if (targetUserId) {
      const saved = loadDraft("pfa", targetUserId);
      if (saved && saved.data) {
        setFormData(saved.data);
        setDraftTimestamp(saved.savedAt);
      } else {
        setFormData(initialPFAFormData);
        setDraftTimestamp(null);
      }

      const branch_id = selectedBranch;
      const token = localStorage.getItem("Authorization");
  
      try {
        const response = await fetch(
          `https://gks-yjdc.onrender.com/api/users/${targetUserId}?branch_id=${branch_id}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `${token}`,
            },
          }
        );
  
        const result = await response.json();
  
        if (!response.ok) {
          console.error("User fetch error:", result);
          return;
        }
  
        // If your API wraps user data in `data`
        const userData = result.data || result; 
  
        setSelectedUser(userData);
        console.log("Fetched user:", userData);
        console.log("User DOB:", userData?.dob);
      } catch (error) {
        console.error("Fetch error:", error);
      }
    }
  };
  

  //PFA POST data API call

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Start loader

    const compulsoryFieldDefinitions = [
      { label: getTranslation("Date of Assessment / मूल्यांकन की तिथि", lang), value: formData.dateOfAssessment },
      { label: getTranslation("Dependent To / पर निर्भर", lang), value: formData.dependentToData },
      { label: getTranslation("Substance Use Pattern / मादक पदार्थ उपयोग पैटर्न", lang), value: formData.substanceUsePatternData },
      { label: getTranslation("Last 30 Days Quantity / पिछले 30 दिनों की मात्रा", lang), value: formData.last30DaysQuantityData },
      { label: getTranslation("Medical History / चिकित्सा इतिहास", lang), value: formData.medicalConfirmationData },
      { label: getTranslation("Blood Transfusion History / रक्त आधान इतिहास", lang), value: formData.bloodConfirmationData },
      { label: getTranslation("Weight / वजन", lang), value: formData.weight },
      { label: getTranslation("Pulse Rate / नाड़ी की दर", lang), value: formData.pulse_rate },
      { label: getTranslation("Temperature (°F) / तापमान (°F)", lang), value: formData.temperature },
      { label: getTranslation("Complications (Ulcer) / अल्सर", lang), value: formData.complications?.ulcer },
      { label: getTranslation("Complications (Respiratory) / श्वसन समस्या", lang), value: formData.complications?.respiratory_problem },
      { label: getTranslation("Complications (Jaundice) / पीलिया", lang), value: formData.complications?.jaundice },
      { label: getTranslation("Complications (Haematemesis (Blood Vomiting)) / खून की उल्टी", lang), value: formData.complications?.haematemesis },
      { label: getTranslation("Complications (Abdominal) / पेट की शिकायतें", lang), value: formData.complications?.abdominal_complaints },
      { label: getTranslation("Complications (Cardiovascular) / हृदय संबंधी", lang), value: formData.complications?.cardiovascular },
      { label: getTranslation("Neurological (Delirium) / प्रलाप", lang), value: formData.neurological?.delirium },
      { label: getTranslation("Neurological (Seizure) / दौरा", lang), value: formData.neurological?.seizure },
      { label: getTranslation("Neurological (Blackout) / बेहोशी", lang), value: formData.neurological?.blackout },
      { label: getTranslation("Neurological (Memory Loss) / स्मृति हानि", lang), value: formData.neurological?.memory_loss },
      { label: getTranslation("Neurological (Trembling) / कंपकंपी", lang), value: formData.neurological?.trembling },
      { label: getTranslation("Neurological (Epilepsy) / मिर्गी", lang), value: formData.neurological?.epilepsy },
      { label: getTranslation("Neurological (Neuropathy) / न्यूरोपैथी", lang), value: formData.neurological?.neuropathy },
      { label: getTranslation("Consent / सहमति", lang), value: formData.consent },
      { label: getTranslation("Consent Name / सहमति देने वाले का नाम", lang), value: formData.consent_name },
      { label: getTranslation("Consent Relationship / संबंध", lang), value: formData.consent_relationship },
      { label: getTranslation("Prepared By / द्वारा तैयार", lang), value: formData.prepared_by },
    ];

    if (!validateCompulsoryFields(compulsoryFieldDefinitions, lang)) {
      setIsLoading(false);
      return;
    }

    const tempVal = Number(formData.temperature);
    if (isNaN(tempVal) || tempVal < 86 || tempVal > 113) {
      setIsLoading(false);
      Swal.fire({
        icon: "warning",
        title: getTranslation("Invalid Temperature / अमान्य तापमान", lang),
        text: getTranslation(
          "Temperature must be in Fahrenheit between 86°F and 113°F (e.g. 98.6°F). / तापमान फ़ारेनहाइट में 86°F और 113°F के बीच होना चाहिए (जैसे 98.6°F)।",
          lang
        ),
      });
      return;
    }

    const combinedVdrlSyphSubmit = normalizeScreeningValue(
      formData.vdrl_syphilis ?? formData.vdrl ?? formData.syphilis
    );

    const payload = {
      user_id: selectedUser[0].user_id,
      // date_of_admission: formData.dateOfAdmission?.toISOString(),
      date_of_assessment: formData.dateOfAssessment?.toISOString(),
      dependent_to: formData.dependentToData,
      substance_use_frequency: formData.substanceUseFrequencyData || "",
      substance_use_pattern: formData.substanceUsePatternData,
      last_30_days_quantity: formData.last30DaysQuantityData,
      medical_history: formData.medicalConfirmationData,
      weight: Number(formData.weight) || 0,
      pulse_rate: Number(formData.pulse_rate) || 0,
      blood_pressure: formData.blood_pressure || "", // optional (omit, "" or null)
      temperature: tempVal,
      spo2: formData.spo2 !== "" && formData.spo2 !== null && formData.spo2 !== undefined ? Number(formData.spo2) : null,
      diabetes: normalizeDiabetesValue(formData.diabetes),
      sugar: null,
      hb: null,
      hiv: normalizeScreeningValue(formData.hiv),
      hcv: normalizeScreeningValue(formData.hcv ?? formData.hepatitis_c),
      hbsag: normalizeScreeningValue(formData.hbsag ?? formData.hepatitis_b),
      vdrl_syphilis: combinedVdrlSyphSubmit,
      vdrl: combinedVdrlSyphSubmit,
      syphilis: combinedVdrlSyphSubmit,
      lymphadenopathy: formData.lymphadenopathy,
      blood_transfusion_history: formData.bloodConfirmationData,
      medical_or_blood_history_details: formData.bloodTransfusionHistoryData,
      ...formData.complications,
      ...formData.neurological,
      complication_description: formData.complication_description,
      neuro_description: formData.neuro_description,
      using_medicine: formData.using_medicine || "",
      other_findings: formData.other_findings,
      consent: formData.consent,
      verification: formData.verification || "No",
      consent_name: formData.consent_name,
      consent_relationship: formData.consent_relationship,
      consent_signature: formData.consent_signature || "",
      prepared_by: formData.prepared_by,
      nutritional_status: formData.nutritional_status,
    };

    try {
      const branch_id = selectedBranch; // make sure `selectedBranch` 
      const token = localStorage.getItem("Authorization");

      //new pfa API (with automatic fallback if backend Joi rejects new screening keys)
      const { response, result } = await submitPFAWithScreeningFallback(
        `https://gks-yjdc.onrender.com/api/pfa/create-assessment?branch_id=${branch_id}`,
        "POST",
        token,
        payload
      );

      console.log("payload", payload);
      console.log("result", result);

      if (!response.ok) {
        setIsLoading(false);
        showApiErrorAlert(result, lang);
        return;
      }
      // ✅ Success Case
  setIsLoading(false);
  const userTargetId = selectedUser?.[0]?.user_id || selectedUser?.[0]?.id || selectedUser?.user_id || selectedUser?.id || currentPFAUserId;
  const createdPfaId = result?.data?.pfa_id || result?.data?.id || result?.pfa_id;
  saveLocalPFAScreening(userTargetId, createdPfaId, formData);
  clearDraft("pfa", userTargetId);
  setDraftTimestamp(null);

  Swal.fire({
    icon: "success",
    title: getTranslation("PFA Created Successfully/PFA सफलतापूर्वक बनाया गया",lang),
    text: getTranslation("The PFA assessment was submitted successfully./PFA असेसमेंट सक्सेसफुली सबमिट हो गया।",lang),
  }).then(() => {
  // This runs after the user clicks "OK"
  setModal(false);
});
    } catch (error) {
      setIsLoading(false);
      Swal.fire({
        icon: "error",
        title: getTranslation("Unexpected Error/अप्रत्याशित त्रुटि",lang),
        text: getTranslation("PFA failed! Unknown error occurred./PFA फेल हो गया! कोई अनजान एरर हुआ।",lang),
      });
    }
  };

  //Partially delete, delete row will show but it's disbaled

  // const handlePFADelete = async (userId) => {
  //   const token = localStorage.getItem("Authorization");

  //   if (!userId) {
  //     console.error("No userId provided for deletion");
  //     Swal.fire("Error", "No user selected for deletion", "error");
  //     return;
  //   }

  //   console.log("Delete called with userId:", userId);

  //   const confirm = await Swal.fire({
  //     title: "Are you sure?",
  //     text: "You are about to delete this assessment.",
  //     icon: "warning",
  //     showCancelButton: true,
  //     confirmButtonText: "Yes, delete it!",
  //   });

  //   if (!confirm.isConfirmed) return;

  //   try {
  //     // First, get pfa_id using userId
  //     const getResponse = await fetch(
  //       `https://gks-yjdc.onrender.com/api/pfa/user-assessment/${userId}`,
  //       {
  //         method: "GET",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: `${token}`,
  //         },
  //       }
  //     );

  //     const data = await getResponse.json();

  //     if (!getResponse.ok || !data?.assessment?.patient_id) {
  //       console.error("Failed to get assessment data:", data);
  //       Swal.fire("Error", "Could not fetch assessment info.", "error");
  //       return;
  //     }

  //     const pfa_id = data.assessment.patient_id;
  //     console.log("Fetched pfa_id:", pfa_id);

  //     // Now delete using pfa_id
  //     const delResponse = await fetch(
  //       `https://gks-yjdc.onrender.com/api/pfa/delete-assessment/${pfa_id}`,
  //       {
  //         method: "DELETE",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: `${token}`,
  //         },
  //       }
  //     );

  //     const result = await delResponse.json();

  //     if (!delResponse.ok) {
  //       console.error("Delete failed:", result);
  //       Swal.fire("Error", "Assessment deletion failed!", "error");
  //       return;
  //     }

  //     Swal.fire("Deleted!", "Assessment has been deleted.", "success");

  //     // // Disable that row
  //     // setData((prev) =>
  //     //   prev.map((user) =>
  //     //     user.id === userId ? { ...user, disabled: true } : user
  //     //   )
  //     // );
  //     // setFilteredData((prev) =>
  //     //   prev.map((user) =>
  //     //     user.id === userId ? { ...user, disabled: true } : user
  //     //   )
  //     // );/
  //     // Completely remove the row
  //     setData((prev) => prev.filter((user) => user.id !== userId));
  //     setFilteredData((prev) => prev.filter((user) => user.id !== userId));
  //   } catch (error) {
  //     console.error("Error deleting assessment:", error);
  //     Swal.fire("Error", "Something went wrong.", "error");
  //   }
  // };

  //PFA edit handler
  const [PFAeditData, setPFAeditData] = useState({});
  const [PFAEditModal, setPFAEditModal] = useState(false);

  const [PFAEditIndividualDataModal, setPFAEditIndividualDataModal] = useState(false);
  //fetch the latest assessment based on created_at, then simply sort the assessments and pick the first one: - Not applicable
  //Re-admission patient by handlePDAEdit
    //🔧 Convert DD/MM/YYYY to Date Object:
const parseDateString = (dateStr) => {
  if (!dateStr) return null;

  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};
 const handlePreeFillCreateReadmissionPFA = async (recentPFAiD = null) => {
  if (typeof recentPFAiD === "object" && recentPFAiD !== null) {
    recentPFAiD = recentPFAiD.recent_pfa_id;
  }

  if (!recentPFAiD) {
    console.error("Invalid userId provided to toggle");
    return;
  }

  setPFAEditModal(true);

  const token = localStorage.getItem("Authorization");
  try {
    const branch_id = selectedBranch; // make sure `selectedBranch` 
    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/pfa/assessment/${recentPFAiD}?branch_id=${branch_id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      }
    );

    const data = await response.json();
    console.log("Latest PFA:", data);

    if (!response.ok) {
      console.error("User fetch error:", data);
      return;
    }

    const latestAssessment = data.data || data.assessment || data;

    if (!latestAssessment) {
      console.warn("No assessment found for this user.");
      return;
    }

    setSelectedUser(latestAssessment);
    console.log("Selected User Assessment:", latestAssessment);

    console.log(latestAssessment.date_of_assessment)
    

    const localReadmitScreening = loadLocalPFAScreening(
      latestAssessment?.user_id,
      latestAssessment?.pfa_id || latestAssessment?.id
    );
    const combinedReadmitVdrlSyph = normalizeScreeningValue(
      latestAssessment?.vdrl_syphilis ??
      latestAssessment?.screening_tests?.vdrl_syphilis ??
      latestAssessment?.health_metrics?.vdrl_syphilis ??
      latestAssessment?.vdrl ??
      latestAssessment?.screening_tests?.vdrl ??
      latestAssessment?.health_metrics?.vdrl ??
      latestAssessment?.syphilis ??
      latestAssessment?.screening_tests?.syphilis ??
      latestAssessment?.health_metrics?.syphilis ??
      localReadmitScreening?.vdrl_syphilis ??
      localReadmitScreening?.vdrl ??
      localReadmitScreening?.syphilis
    );

    setPFAeditData({
      date_of_assessment: latestAssessment.date_of_assessment
        ? new Date(latestAssessment.date_of_assessment) // ✅ always Date object
        : null,
    
      dependent_to: latestAssessment.dependent_to || "",
      substance_use_frequency: latestAssessment.substance_use_frequency || localReadmitScreening?.substance_use_frequency || "",
      substance_use_pattern: latestAssessment.substance_use_pattern || "",
      last_30_days_quantity: latestAssessment.last_30_days_quantity || "",
    
      medical_history: latestAssessment?.medical_history || "",
      blood_transfusion_history: latestAssessment?.blood_transfusion_history || "",
      medicalConfirmationData: latestAssessment?.medical_history || "",
      bloodConfirmationData: latestAssessment?.blood_transfusion_history || "",
    
      weight: Number(latestAssessment?.weight) || 0,
      pulse_rate: Number(latestAssessment?.pulse_rate) || 0,
      blood_pressure: latestAssessment?.blood_pressure || "",
      temperature: Number(latestAssessment?.temperature ?? latestAssessment?.health_metrics?.temperature) || 0,
      spo2: latestAssessment?.spo2 ?? latestAssessment?.health_metrics?.spo2 ?? "",
      diabetes: normalizeDiabetesValue(latestAssessment?.diabetes ?? latestAssessment?.health_metrics?.diabetes ?? localReadmitScreening?.diabetes),
      hiv: normalizeScreeningValue(latestAssessment?.hiv ?? latestAssessment?.screening_tests?.hiv ?? latestAssessment?.health_metrics?.hiv ?? localReadmitScreening?.hiv),
      hcv: normalizeScreeningValue(latestAssessment?.hcv ?? latestAssessment?.screening_tests?.hcv ?? latestAssessment?.health_metrics?.hcv ?? latestAssessment?.hepatitis_c ?? localReadmitScreening?.hcv),
      hbsag: normalizeScreeningValue(latestAssessment?.hbsag ?? latestAssessment?.screening_tests?.hbsag ?? latestAssessment?.health_metrics?.hbsag ?? latestAssessment?.hepatitis_b ?? localReadmitScreening?.hbsag),
      vdrl_syphilis: combinedReadmitVdrlSyph,
      vdrl: combinedReadmitVdrlSyph,
      syphilis: combinedReadmitVdrlSyph,
      lymphadenopathy: latestAssessment?.lymphadenopathy || "",
    
      medical_or_blood_history_details:
        latestAssessment.medical_or_blood_history_details || "",
      complication_description: latestAssessment.complication_description || "",
      neuro_description: latestAssessment.neuro_description || "",
      using_medicine: latestAssessment.using_medicine ?? latestAssessment.health_metrics?.using_medicine ?? localReadmitScreening?.using_medicine ?? "",
      other_findings: latestAssessment.other_findings || "",
      consent_name: latestAssessment.consent_name || "",
      consent_relationship: latestAssessment.consent_relationship || "",
      consent_signature: latestAssessment.consent_signature || "",
      prepared_by: latestAssessment.prepared_by || "",
    
      complications: {
        ulcer: latestAssessment.ulcer || "No",
        respiratory_problem: latestAssessment.respiratory_problem || "No",
        jaundice: latestAssessment.jaundice || "No",
        haematemesis: latestAssessment.haematemesis || "No",
        abdominal_complaints: latestAssessment.abdominal_complaints || "No",
        cardiovascular: latestAssessment.cardiovascular || "No",
      },
    
      neurological: {
        delirium: latestAssessment.delirium || "No",
        seizure: latestAssessment.seizure || "No",
        blackout: latestAssessment.blackout || "No",
        memory_loss: latestAssessment.memory_loss || "No",
        trembling: latestAssessment.trembling || "No",
        epilepsy: latestAssessment.epilepsy || "No",
        neuropathy: latestAssessment.neuropathy || "No",
      },
    
      nutritional_status: latestAssessment.nutritional_status || "",
    
      readmissionConsent: latestAssessment.consent || "No",
      readmissionVerification: latestAssessment.verification || "No",
      readmissionUserId: latestAssessment.user_id || null,
    });
    
  } catch (error) {
    console.error("Fetch error:", error);
  }
};


  //PFA update patient assessment handler - Not applicable
  //Readmission patient PFA Handler
  const handleReadmissionAssessment = async () => {
    setIsLoading(true); // Start loading

    const combinedReadmitSubmitVdrlSyph = normalizeScreeningValue(
      PFAeditData.vdrl_syphilis ?? PFAeditData.vdrl ?? PFAeditData.syphilis
    );

    const payload = {
      date_of_assessment: PFAeditData.date_of_assessment?.toISOString(),
      dependent_to: PFAeditData.dependent_to,
      substance_use_frequency: PFAeditData.substance_use_frequency || "",
      substance_use_pattern: PFAeditData.substance_use_pattern,
      last_30_days_quantity: PFAeditData.last_30_days_quantity,
      medical_history: PFAeditData.medical_history,
      blood_transfusion_history: PFAeditData.blood_transfusion_history,
      medical_or_blood_history_details:
        PFAeditData.medical_or_blood_history_details,

      weight: Number(PFAeditData.weight) || 0,
      pulse_rate: Number(PFAeditData.pulse_rate) || 0,
      blood_pressure: PFAeditData.blood_pressure || "",
      temperature: Number(PFAeditData?.temperature) || 0,
      spo2: PFAeditData.spo2 !== "" && PFAeditData.spo2 !== null && PFAeditData.spo2 !== undefined ? Number(PFAeditData.spo2) : null,
      diabetes: normalizeDiabetesValue(PFAeditData.diabetes),
      sugar: null,
      hb: null,
      hiv: normalizeScreeningValue(PFAeditData.hiv),
      hcv: normalizeScreeningValue(PFAeditData.hcv ?? PFAeditData.hepatitis_c),
      hbsag: normalizeScreeningValue(PFAeditData.hbsag ?? PFAeditData.hepatitis_b),
      vdrl_syphilis: combinedReadmitSubmitVdrlSyph,
      vdrl: combinedReadmitSubmitVdrlSyph,
      syphilis: combinedReadmitSubmitVdrlSyph,
      lymphadenopathy: PFAeditData.lymphadenopathy,

      // Complications
      ulcer: PFAeditData.complications?.ulcer || "",
      respiratory_problem: PFAeditData.complications?.respiratory_problem || "",
      jaundice: PFAeditData.complications?.jaundice || "",
      haematemesis: PFAeditData.complications?.haematemesis || "",
      abdominal_complaints:
        PFAeditData.complications?.abdominal_complaints || "",
      cardiovascular: PFAeditData.complications?.cardiovascular || "",
      complication_description: PFAeditData.complication_description,

      // Neurological
      seizure: PFAeditData.neurological?.seizure || "",
      epilepsy: PFAeditData.neurological?.epilepsy || "",
      delirium: PFAeditData.neurological?.delirium || "",
      trembling: PFAeditData.neurological?.trembling || "",
      memory_loss: PFAeditData.neurological?.memory_loss || "",
      neuropathy: PFAeditData.neurological?.neuropathy || "",
      blackout: PFAeditData.neurological?.blackout || "",
      neuro_description: PFAeditData.neuro_description,

      using_medicine: PFAeditData.using_medicine || "",
      other_findings: PFAeditData.other_findings,

      consent_name: PFAeditData.consent_name,
      consent_relationship: PFAeditData.consent_relationship,
      consent_signature: PFAeditData.consent_signature,
      prepared_by: PFAeditData.prepared_by,

      nutritional_status: PFAeditData.nutritional_status,

      consent:PFAeditData.readmissionConsent,

      verification:PFAeditData.readmissionVerification,
      user_id: PFAeditData.readmissionUserId,
    };

    // try {
    //   const response = await fetch(
    //     `https://gks-yjdc.onrender.com/api/pfa/update-assessment/${PFAeditData.pfa_id}`,
    //     {
    //       method: "PUT",
    //       headers: {
    //         "Content-Type": "application/json",
    //         Authorization: `${token}`,
    //       },
    //       body: JSON.stringify(payload),
    //     }
    //   );

    //   const data = await response.json();

    //   if (!response.ok) {
    //     Swal.fire({
    //       icon: "error",
    //       title: "Update Failed",
    //       text: data.errors?.[0]?.message || "Unknown error occurred.",
    //     });
    //     return;
    //   }

    //   Swal.fire({
    //     icon: "success",
    //     title: "Assessment Updated",
    //     text: "The assessment was updated successfully!",
    //   });

    //   setPFAEditModal(false);
    // } catch (error) {
    //   Swal.fire({
    //     icon: "error",
    //     title: "Error",
    //     text: "An error occurred while updating the assessment.",
    //   });
    // }
    try {
      const token = localStorage.getItem("Authorization");
      const branch_id = selectedBranch; // make sure `selectedBranch` comes from your BranchContext
      //Readmission PFA API
      const { response, result } = await submitPFAWithScreeningFallback(
        `https://gks-yjdc.onrender.com/api/pfa/create-assessment?branch_id=${branch_id}`,
        "POST",
        token,
        payload
      );

      console.log("payload", payload);
      console.log("result", result);

      if (!response.ok) {
        setIsLoading(false);
        showApiErrorAlert(result, lang, getTranslation("Readmission Submission Failed/पुनः प्रवेश सबमिशन विफल", lang));
        return;
      }
      saveLocalPFAScreening(
        PFAeditData.readmissionUserId,
        result?.data?.pfa_id || result?.data?.id || result?.pfa_id,
        PFAeditData
      );
      // ✅ Success Case
  setIsLoading(false);
  Swal.fire({
    icon: "success",
    title: getTranslation("PFA Readmission Created Successfully/PFA रीडमिशन सफलतापूर्वक बनाया गया",lang),
    text: getTranslation("The PFA readmission was submitted successfully./PFA रीएडमिशन सफलतापूर्वक सबमिट कर दिया गया।",lang),
  }).then(() => {
  // This runs after the user clicks "OK"
  setModal(false);
});
    } catch (error) {
      setIsLoading(false);
      Swal.fire({
        icon: "error",
        title: getTranslation("Unexpected Error/अप्रत्याशित त्रुटि",lang),
        text: getTranslation("PFA Readmission failed! Unknown error occurred./PFA रीडमिशन फेल हो गया! कोई अनजान एरर हुआ।",lang),
      });
    }
  };


  //Edit like view PFA data by userID and get pateint id through user id and pass to update edit PFA to backend hanlder
  const handleAllPFAEditData = async (userId = null) => {
    // Open modal right away
    setPFAEditIndividualDataModal(true);
    setIsLoading(true); 
  
    // Handle if userId is an object
    if (typeof userId === "object" && userId !== null) {
      userId = userId.id;
    }
    if (!userId) {
      console.error("Invalid userId provided to toggle");
      setIsLoading(false);
      return;
    }
  
    console.log("Edit userId", userId);
  
    const branch_id = selectedBranch;
    const token = localStorage.getItem("Authorization");
  
    try {
      // Step 1: Fetch user's assessments list
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/pfa/user-assessments/${userId}?branch_id=${branch_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        }
      );
  
      const result = await response.json();
      if (!response.ok) {
        console.error("User fetch error:", result);
        return;
      }
  
      const assessmentsArray = Array.isArray(result.data)
        ? result.data
        : result.assessments || [];
  
      if (!Array.isArray(assessmentsArray) || assessmentsArray.length === 0) {
        console.warn("No assessments found for this user.");
        return;
      }
  
      // Step 2: Pick latest assessment by created_at
      const latestAssessmentMeta = assessmentsArray.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      )[0];
  
      const pfaId = Number(latestAssessmentMeta?.pfa_id);
      if (!pfaId) {
        console.error("Invalid or missing pfa_id:", latestAssessmentMeta);
        return;
      }
  
      // Step 3: Fetch full assessment details
      const detailResponse = await fetch(
        `https://gks-yjdc.onrender.com/api/pfa/assessment/${pfaId}?branch_id=${branch_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        }
      );
  
      const detailData = await detailResponse.json();

      console.log("detailData Edit Data", detailData.date_of_assessment);

      if (!detailResponse.ok) {
        console.error("Detail fetch error:", detailData);
        return;
      }
  
      const latestAssessment = detailData?.data || detailData.assessment;

      console.log(latestAssessment.date_of_assessment)

      if (!latestAssessment) {
        console.warn("No detailed assessment found.");
        return;
      }
  
      // Save data into state
      setSelectedUser(latestAssessment);
      const localEditScreening = loadLocalPFAScreening(latestAssessment.user_id, pfaId);
      const combinedEditVdrlSyph = normalizeScreeningValue(
        latestAssessment.vdrl_syphilis ??
        latestAssessment.screening_tests?.vdrl_syphilis ??
        latestAssessment.health_metrics?.vdrl_syphilis ??
        latestAssessment.vdrl ??
        latestAssessment.screening_tests?.vdrl ??
        latestAssessment.health_metrics?.vdrl ??
        latestAssessment.syphilis ??
        latestAssessment.screening_tests?.syphilis ??
        latestAssessment.health_metrics?.syphilis ??
        localEditScreening.vdrl_syphilis ??
        localEditScreening.vdrl ??
        localEditScreening.syphilis
      );
      setPFAeditData({
        pfa_id: pfaId,
        ...latestAssessment,
        substance_use_frequency: latestAssessment.substance_use_frequency ?? latestAssessment.assessment?.substance_use_frequency ?? localEditScreening.substance_use_frequency ?? "",
        using_medicine: latestAssessment.using_medicine ?? latestAssessment.health_metrics?.using_medicine ?? localEditScreening.using_medicine ?? "",
        temperature: latestAssessment.temperature ?? latestAssessment.health_metrics?.temperature ?? "",
        spo2: latestAssessment.spo2 ?? latestAssessment.health_metrics?.spo2 ?? "",
        diabetes: normalizeDiabetesValue(latestAssessment.diabetes ?? latestAssessment.health_metrics?.diabetes ?? localEditScreening.diabetes),
        hiv: normalizeScreeningValue(latestAssessment.hiv ?? latestAssessment.screening_tests?.hiv ?? latestAssessment.health_metrics?.hiv ?? localEditScreening.hiv),
        hcv: normalizeScreeningValue(latestAssessment.hcv ?? latestAssessment.screening_tests?.hcv ?? latestAssessment.health_metrics?.hcv ?? latestAssessment.hepatitis_c ?? localEditScreening.hcv),
        hbsag: normalizeScreeningValue(latestAssessment.hbsag ?? latestAssessment.screening_tests?.hbsag ?? latestAssessment.health_metrics?.hbsag ?? latestAssessment.hepatitis_b ?? localEditScreening.hbsag),
        vdrl_syphilis: combinedEditVdrlSyph,
        vdrl: combinedEditVdrlSyph,
        syphilis: combinedEditVdrlSyph,
        verification: latestAssessment.verification ?? latestAssessment.consent?.verification ?? "No",
        date_of_assessment: latestAssessment.date_of_assessment
          ? new Date(latestAssessment.date_of_assessment) // Convert string → Date object
          : null,
      });
  
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  
  
  
  


  //Edit and submit PFA individual assessment data hanlder
  const handlerEditPFAIndividualAssessmentData = async () => {
    setIsLoading(true);
  
    const yesNo = (val) => (val === "Yes" ? "Yes" : "No"); // Ensures Yes/No only
  
    const combinedEditSubmitVdrlSyph = normalizeScreeningValue(
      PFAeditData.vdrl_syphilis ?? PFAeditData.vdrl ?? PFAeditData.syphilis
    );

    const payload = {
      date_of_assessment: PFAeditData.date_of_assessment
      ? PFAeditData.date_of_assessment.toISOString()
      : null,
  
      dependent_to: PFAeditData.dependent_to,
      substance_use_frequency: PFAeditData.substance_use_frequency || "",
      substance_use_pattern: PFAeditData.substance_use_pattern,
      last_30_days_quantity: PFAeditData.last_30_days_quantity,
      medical_history: PFAeditData.medical_history,
      blood_transfusion_history: PFAeditData.blood_transfusion_history,
      medical_or_blood_history_details: PFAeditData.medical_or_blood_history_details,
  
      weight: Number(PFAeditData.weight) || 0,
      pulse_rate: Number(PFAeditData.pulse_rate) || 0,
      blood_pressure: PFAeditData.blood_pressure ?? "",
      temperature: Number(PFAeditData.temperature) || 0,
      spo2: PFAeditData.spo2 !== "" && PFAeditData.spo2 !== null && PFAeditData.spo2 !== undefined ? Number(PFAeditData.spo2) : null,
      diabetes: normalizeDiabetesValue(PFAeditData.diabetes),
      sugar: null,
      hb: null,
      hiv: normalizeScreeningValue(PFAeditData.hiv),
      hcv: normalizeScreeningValue(PFAeditData.hcv ?? PFAeditData.hepatitis_c),
      hbsag: normalizeScreeningValue(PFAeditData.hbsag ?? PFAeditData.hepatitis_b),
      vdrl_syphilis: combinedEditSubmitVdrlSyph,
      vdrl: combinedEditSubmitVdrlSyph,
      syphilis: combinedEditSubmitVdrlSyph,
      lymphadenopathy: PFAeditData.lymphadenopathy,
  
      // Complications - flat
  ulcer: yesNo(PFAeditData.ulcer),
  respiratory_problem: yesNo(PFAeditData.respiratory_problem),
  jaundice: yesNo(PFAeditData.jaundice),
  haematemesis: yesNo(PFAeditData.haematemesis),
  abdominal_complaints: yesNo(PFAeditData.abdominal_complaints),
  cardiovascular: yesNo(PFAeditData.cardiovascular),
  complication_description: PFAeditData.complication_description,

  // Neurological - flat
  seizure: yesNo(PFAeditData.seizure),
  epilepsy: yesNo(PFAeditData.epilepsy),
  delirium: yesNo(PFAeditData.delirium),
  trembling: yesNo(PFAeditData.trembling),
  memory_loss: yesNo(PFAeditData.memory_loss),
  neuropathy: yesNo(PFAeditData.neuropathy),
  blackout: yesNo(PFAeditData.blackout),
  neuro_description: PFAeditData.neuro_description,
  
      using_medicine: PFAeditData.using_medicine || "",
      other_findings: PFAeditData.other_findings,
      consent_name: PFAeditData.consent_name,
      consent_relationship: PFAeditData.consent_relationship,
      consent_signature: PFAeditData.consent_signature,
      prepared_by: PFAeditData.prepared_by,
      nutritional_status: PFAeditData.nutritional_status,
  
      consent: yesNo(PFAeditData.consent ?? PFAeditData.readmissionConsent),
      // verification: yesNo(PFAeditData.readmissionVerification),
      verification:PFAeditData.verification,
  
      user_id: PFAeditData.readmissionUserId,
      pfa_id: PFAeditData.pfa_id,
    };
  
    try {
      const branch_id = selectedBranch;
      const token = localStorage.getItem("Authorization");
  
      const { response, result: data } = await submitPFAWithScreeningFallback(
        `https://gks-yjdc.onrender.com/api/pfa/update-assessment/${PFAeditData.pfa_id}?branch_id=${branch_id}`,
        "PUT",
        token,
        payload
      );
  
      if (!response.ok) {
        showApiErrorAlert(data, lang, getTranslation("Update Failed/भार बढ़ाना विफल हुवा", lang));
        return;
      }

      saveLocalPFAScreening(PFAeditData.user_id || PFAeditData.readmissionUserId, PFAeditData.pfa_id, PFAeditData);
  
      Swal.fire({
        icon: "success",
        title: getTranslation("Assessment Updated/मूल्यांकन अद्यतन",lang),
        text: getTranslation("The assessment was updated successfully!/मूल्यांकन सफलतापूर्वक अद्यतन किया गया!",lang),
      });
  
      setPFAEditIndividualDataModal(false);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: getTranslation("Error/गलती",lang),
        text: getTranslation("An error occurred while updating the assessment./मूल्यांकन अद्यतन करते समय एक त्रुटि हुई.",lang),
      });
    } finally {
      setTimeout(() => setIsLoading(false), 300); // show spinner at least 300ms
    }
  };
  

  //Search filter on register datalist
  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  //User data search filter function
  const handleSearchChange = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchText(value);

    const filtered = data.filter((item) =>
      item.name.toLowerCase().includes(value)
    );

    setFilteredData(filtered);
  };

  //All pfa patient list data search 
  const [PFAallDatasearchText, PFAallDatasetSearchText] = useState("");
  const handlePFASearchChange = (e) => {
    const value = e.target.value.toLowerCase();
    PFAallDatasetSearchText(value);

    const filtered = getpfaData.filter((item) =>{
      return(
        item.name?.toLowerCase().includes(value) ||
        item.gks_id?.toLowerCase().includes(value) ||
        item.pfa_id?.toString().includes(value) ||
        item.user_id?.toString().includes(value) ||
        item.phone?.toLowerCase().includes(value) ||
        item.email?.toLowerCase().includes(value) 
      );
    }
    );

    setpfaFilterData(filtered);
  };

  //PDf view download pdf code handler
  const [pfaDownload, setpfaDownload] = useState(false);
  const handleDownloadPDF = () => {
    const element = pdfRef.current;
    setpfaDownload(true);

    // Add a temporary class to scale fonts if needed
    element.classList.add("pdf-scale");

    const patientName =
      selectedUser?.name ||
      selectedUser?.patient_name ||
      "Patient";
    const gksId =
      selectedUser?.custom_code ||
      selectedUser?.gks_id ||
      selectedUser?.uid ||
      selectedUser?.user_id ||
      selectedUser?.id ||
      "";
    const safeName = String(patientName).trim().replace(/\s+/g, "_");
    const safeId = String(gksId).trim().replace(/\s+/g, "_");

    const opt = {
      margin: [10, 10, 10, 10], // top, left, bottom, right
      filename: `patient_${safeName}_${safeId || "pfa_report"}.pdf`,
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


    // All pfa patient data list state
    const [getpfaData, setgetpfaData]=useState([]);
    const [pfaFilterData, setpfaFilterData]=useState([]);
    useEffect(() => {

      if (!selectedBranch) return; // avoid empty branch fetch

      const token = localStorage.getItem("Authorization");
    
      fetch(`https://gks-yjdc.onrender.com/api/pfa/all-entries?branch_id=${selectedBranch}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      })
        .then((response) => {
          if (!response.ok) throw new Error(getTranslation("Failed to fetch PFA all list user details/PFA की सभी लिस्ट के यूज़र डिटेल्स नहीं मिल पाए",lang));
          return response.json();
        })
        .then((res) => {
          // const pfaPatient = res.entries || [];
          const pfaPatient = res.data || [];

          console.log("All Patient First Assessment (PFA) List =>", pfaPatient )
    
          const formattedPFAPatient = pfaPatient.map((item) => {
            return {
              pfa_id: item.pfa_id,
              status: item.status,
    
              user_id: item.user?.user_id,
              name: item.user?.name,
              phone: item.user?.phone,
              email: item.user?.email,
              gks_id: item.user?.gks_id || item.user?.custom_code || item.user?.uid || item.gks_id || item.custom_code || item.uid || "N/A",
    
              entry_id: item.entry?.entry_id,
              visit_no: item.entry?.visit_no,
              admit_date: item.entry?.admit_date,
              discharge_date: item.entry?.discharge_date,
              discharge_status: item.entry?.discharge_status,
              ward_name: item.entry?.ward_name,
    
              assessment_date: item.assessment?.date_of_assessment,
              age: item.assessment?.age,
              dependent_to: item.assessment?.dependent_to,
              substance_use_frequency: item.assessment?.substance_use_frequency ?? "",
              substance_use_pattern: item.assessment?.substance_use_pattern,
              last_30_days_quantity: item.assessment?.last_30_days_quantity,
    
              medical_history: item.medical_history?.medical_history,
              blood_transfusion_history: item.medical_history?.blood_transfusion_history,
              medical_or_blood_history_details: item.medical_history?.medical_or_blood_history_details,
    
              ulcer: item.medical_conditions?.ulcer,
              respiratory_problem: item.medical_conditions?.respiratory_problem,
              jaundice: item.medical_conditions?.jaundice,
              haematemesis: item.medical_conditions?.haematemesis,
              abdominal_complaints: item.medical_conditions?.abdominal_complaints,
              cardiovascular: item.medical_conditions?.cardiovascular,
              complication_description: item.medical_conditions?.complication_description,
    
              seizure: item.neurological_conditions?.seizure,
              epilepsy: item.neurological_conditions?.epilepsy,
              delirium: item.neurological_conditions?.delirium,
              trembling: item.neurological_conditions?.trembling,
              memory_loss: item.neurological_conditions?.memory_loss,
              neuropathy: item.neurological_conditions?.neuropathy,
              blackout: item.neurological_conditions?.blackout,
              neuro_description: item.neurological_conditions?.neuro_description,
    
              weight: item.health_metrics?.weight ?? item.weight,
              pulse_rate: item.health_metrics?.pulse_rate ?? item.pulse_rate,
              blood_pressure: item.health_metrics?.blood_pressure ?? item.blood_pressure,
              temperature: item.health_metrics?.temperature ?? item.temperature,
              spo2: item.health_metrics?.spo2 ?? item.spo2,
              diabetes: normalizeDiabetesValue(item.health_metrics?.diabetes ?? item.diabetes),
              hiv: normalizeScreeningValue(item.screening_tests?.hiv ?? item.health_metrics?.hiv ?? item.hiv ?? ""),
              hcv: normalizeScreeningValue(item.screening_tests?.hcv ?? item.health_metrics?.hcv ?? item.hcv ?? ""),
              hbsag: normalizeScreeningValue(item.screening_tests?.hbsag ?? item.health_metrics?.hbsag ?? item.hbsag ?? ""),
              vdrl_syphilis: normalizeScreeningValue(
                item.screening_tests?.vdrl_syphilis ??
                item.health_metrics?.vdrl_syphilis ??
                item.vdrl_syphilis ??
                item.screening_tests?.vdrl ??
                item.health_metrics?.vdrl ??
                item.vdrl ??
                item.screening_tests?.syphilis ??
                item.health_metrics?.syphilis ??
                item.syphilis ??
                ""
              ),
              vdrl: normalizeScreeningValue(item.screening_tests?.vdrl ?? item.health_metrics?.vdrl ?? item.vdrl ?? ""),
              syphilis: normalizeScreeningValue(item.screening_tests?.syphilis ?? item.health_metrics?.syphilis ?? item.syphilis ?? ""),
              lymphadenopathy: item.health_metrics?.lymphadenopathy ?? item.lymphadenopathy,
              nutritional_status: item.health_metrics?.nutritional_status ?? item.nutritional_status,
              using_medicine: item.health_metrics?.using_medicine ?? item.using_medicine ?? "",
              other_findings: item.health_metrics?.other_findings ?? item.other_findings,
    
              consent: item.consent?.consent ?? item.consent,
              consent_name: item.consent?.consent_name ?? item.consent_name,
              consent_relationship: item.consent?.consent_relationship ?? item.consent_relationship,
              consent_signature: item.consent?.consent_signature ?? item.consent_signature,
              prepared_by: item.consent?.prepared_by ?? item.prepared_by,
              verification: item.verification || item.consent?.verification || "No",
    
              created_by: item.audit?.created_by,
              updated_by: item.audit?.updated_by,
              created_at: item.audit?.created_at,
              updated_at: item.audit?.updated_at,
              branch_id: item.audit?.branch_id,
            };
          });

          console.log(formattedPFAPatient)
    
          setTimeout(() => {
            setgetpfaData(formattedPFAPatient);
            setpfaFilterData(formattedPFAPatient);
            setstillLoading(false);
          }, 1000);
        })
        .catch((error) => {
          console.error("Error fetching PFA user data:", error);
          setstillLoading(true);
        });
    }, [selectedBranch]);
    


      //Print Data handler
  //Print Data handler
  // const handlePrint = () => {
  //   window.print();
  //   // setviweFormPrint(false); // modal will close correctly
  // };

   //Print viewable form data handler (matches Download PDF identically)
    const handlePrint = () =>
      printElementAsPdf(pdfRef.current, {
        title: `PFA_${selectedUser?.name || "Report"}`,
      });

  const handleAddCustomDependentOption = (currentVal, onChangeVal) => {
    const trimmed = String(customDependentInput || "").trim();
    if (!trimmed) return;

    const allKnown = [
      ...DEFAULT_DEPENDENT_OPTIONS.map((o) => o.value),
      ...customDependentOptions,
    ];
    const existingCanonical = allKnown.find(
      (k) => k.toLowerCase() === trimmed.toLowerCase()
    );
    const valueToUse = existingCanonical || trimmed;

    if (!existingCanonical) {
      const nextCustom = [...customDependentOptions, valueToUse];
      setCustomDependentOptions(nextCustom);
      try {
        localStorage.setItem(CUSTOM_DEPENDENT_STORAGE_KEY, JSON.stringify(nextCustom));
      } catch {
        // ignore storage errors
      }
    }

    const currentList = parseDependentSelection(currentVal, allKnown);
    if (!currentList.some((x) => x.toLowerCase() === valueToUse.toLowerCase())) {
      onChangeVal(serializeDependentSelection([...currentList, valueToUse]));
    }
    setCustomDependentInput("");
  };

  const handleRemoveCustomDependentOption = (optVal, currentVal, onChangeVal) => {
    const nextCustom = customDependentOptions.filter(
      (o) => o.toLowerCase() !== optVal.toLowerCase()
    );
    setCustomDependentOptions(nextCustom);
    try {
      localStorage.setItem(CUSTOM_DEPENDENT_STORAGE_KEY, JSON.stringify(nextCustom));
    } catch {
      // ignore storage errors
    }
    const allKnown = [
      ...DEFAULT_DEPENDENT_OPTIONS.map((o) => o.value),
      ...nextCustom,
    ];
    const currentList = parseDependentSelection(currentVal, allKnown);
    const updatedList = currentList.filter(
      (x) => x.toLowerCase() !== optVal.toLowerCase()
    );
    onChangeVal(serializeDependentSelection(updatedList));
  };

  const renderDependentToField = (currentVal, onChangeVal, idPrefix = "pfa") => {
    const allKnown = [
      ...DEFAULT_DEPENDENT_OPTIONS.map((o) => o.value),
      ...customDependentOptions,
    ];
    const selectedList = parseDependentSelection(currentVal, allKnown);

    const optionItems = [
      ...DEFAULT_DEPENDENT_OPTIONS.map((o) => ({ ...o, isCustom: false })),
      ...customDependentOptions
        .filter(
          (c) =>
            !DEFAULT_DEPENDENT_OPTIONS.some(
              (d) => d.value.toLowerCase() === c.toLowerCase()
            )
        )
        .map((c) => ({ value: c, label: c, isCustom: true })),
    ];

    selectedList.forEach((sel) => {
      if (!optionItems.some((o) => o.value.toLowerCase() === sel.toLowerCase())) {
        optionItems.push({ value: sel, label: sel, isCustom: false });
      }
    });

    const toggleDepOption = (optVal, checked) => {
      let nextList;
      if (checked) {
        nextList = selectedList.some((x) => x.toLowerCase() === optVal.toLowerCase())
          ? selectedList
          : [...selectedList, optVal];
      } else {
        nextList = selectedList.filter(
          (x) => x.toLowerCase() !== optVal.toLowerCase()
        );
      }
      onChangeVal(serializeDependentSelection(nextList));
    };

    return (
      <FormGroup className="mb-3">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
          <Label className="mb-0 fw-semibold">
            {getTranslation(dependentTo, lang)}
          </Label>
          <Badge
            color={selectedList.length > 0 ? "success" : "secondary"}
            pill
            style={{
              backgroundColor: selectedList.length > 0 ? "#24695c" : "#64748b",
              color: "#ffffff",
              fontSize: "11.5px",
              padding: "4px 10px",
            }}
          >
            {getTranslation("Selected / चयनित", lang)}: {selectedList.length}
          </Badge>
        </div>

        <div
          style={{
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "12px",
          }}
        >
          <div className="d-flex flex-wrap gap-2">
            {optionItems.map((opt, idx) => {
              const inputId = `${idPrefix}-dep-${idx}`;
              const isChecked = selectedList.some(
                (x) => x.toLowerCase() === opt.value.toLowerCase()
              );
              return (
                <div
                  key={`${opt.value}-${idx}`}
                  className="form-check form-check-inline m-0"
                  style={{
                    backgroundColor: isChecked ? "#ecfdf5" : "#ffffff",
                    border: isChecked ? "1px solid #24695c" : "1px solid #cbd5e1",
                    borderRadius: "8px",
                    padding: "5px 10px",
                  }}
                >
                  <Input
                    id={inputId}
                    type="checkbox"
                    className="form-check-input"
                    checked={isChecked}
                    onChange={(e) => toggleDepOption(opt.value, e.target.checked)}
                  />
                  <Label
                    htmlFor={inputId}
                    className="form-check-label"
                    style={{
                      fontWeight: isChecked ? "600" : "500",
                      color: isChecked ? "#14532d" : "#334155",
                    }}
                  >
                    {opt.label.includes("/") ? getTranslation(opt.label, lang) : opt.label}
                  </Label>
                  {opt.isCustom && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveCustomDependentOption(opt.value, currentVal, onChangeVal);
                      }}
                      title={getTranslation("Remove custom option / हटाएँ", lang)}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#dc2626",
                        fontWeight: "700",
                        fontSize: "13px",
                        lineHeight: 1,
                        marginLeft: "6px",
                        padding: "0 2px",
                        cursor: "pointer",
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="d-flex align-items-center gap-2 mt-3 flex-wrap">
            <Input
              type="text"
              value={customDependentInput}
              onChange={(e) => setCustomDependentInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustomDependentOption(currentVal, onChangeVal);
                }
              }}
              placeholder={getTranslation(
                "Add custom dependent option... / कस्टम निर्भरता जोड़ें...",
                lang
              )}
              className="form-control"
              style={{ maxWidth: "340px", backgroundColor: "#ffffff" }}
            />
            <Button
              type="button"
              color="primary"
              size="sm"
              onClick={() => handleAddCustomDependentOption(currentVal, onChangeVal)}
              className="d-inline-flex align-items-center gap-1 fw-semibold"
              style={{
                minHeight: "38px",
                padding: "6px 14px",
                backgroundColor: "#24695c",
                borderColor: "#24695c",
                borderRadius: "8px",
              }}
            >
              <span style={{ fontSize: "15px", lineHeight: 1 }}>+</span>
              <span>{getTranslation("Add / जोड़ें", lang)}</span>
            </Button>
          </div>

          <div className="mt-2">
            <Input
              type="text"
              readOnly
              value={
                selectedList.length > 0
                  ? `(${selectedList.length} ${getTranslation("Selected / चयनित", lang)}) ${selectedList.join(" | ")}`
                  : ""
              }
              placeholder={getTranslation(
                "Selected dependencies will appear here... / चयनित निर्भरता यहाँ दिखाई देगी...",
                lang
              )}
              className="form-control bg-white fw-semibold"
            />
          </div>
        </div>
      </FormGroup>
    );
  };

  const renderFrequencyAndPatternSection = ({
    frequencyVal,
    onFrequencyChange,
    patternVal,
    onPatternChange,
    idPrefix = "pfa",
  }) => {
    const selectedPatterns = parseUsePatternSelection(patternVal);

    const togglePatternOption = (optVal, checked) => {
      let nextList;
      if (checked) {
        nextList = selectedPatterns.some((x) => x.toLowerCase() === optVal.toLowerCase())
          ? selectedPatterns
          : [...selectedPatterns, optVal];
      } else {
        nextList = selectedPatterns.filter(
          (x) => x.toLowerCase() !== optVal.toLowerCase()
        );
      }
      onPatternChange(serializeUsePatternSelection(nextList));
    };

    const extraPatterns = selectedPatterns.filter(
      (sel) =>
        !SUBSTANCE_USE_PATTERN_OPTIONS.some(
          (o) => o.value.toLowerCase() === sel.toLowerCase()
        )
    );
    const allPatternItems = [
      ...SUBSTANCE_USE_PATTERN_OPTIONS,
      ...extraPatterns.map((p) => ({ value: p, label: p })),
    ];

    return (
      <div className="row g-3 mt-1 mb-3 align-items-stretch">
        <div className="col-12 col-lg-6">
          <VoiceTextarea
            label={<Translated text={getTranslation(substanceUseFrequency, lang)} />}
            name="substanceUseFrequencyData"
            value={frequencyVal || ""}
            onChange={(e) => onFrequencyChange(e.target.value)}
            rows={4}
          />
        </div>

        <div className="col-12 col-lg-6">
          <FormGroup className="mb-0">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-1">
              <Label className="mb-0 fw-semibold">
                {getTranslation(substanceUsePattern, lang)}
              </Label>
              <Badge
                color={selectedPatterns.length > 0 ? "success" : "secondary"}
                pill
                style={{
                  backgroundColor: selectedPatterns.length > 0 ? "#24695c" : "#64748b",
                  color: "#ffffff",
                  fontSize: "11px",
                  padding: "3px 9px",
                }}
              >
                {selectedPatterns.length} {getTranslation("Selected / चयनित", lang)}
              </Badge>
            </div>

            <div
              style={{
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "12px",
              }}
            >
              <div className="d-flex flex-wrap gap-2">
                {allPatternItems.map((opt, idx) => {
                  const inputId = `${idPrefix}-pattern-${idx}`;
                  const isChecked = selectedPatterns.some(
                    (x) => x.toLowerCase() === opt.value.toLowerCase()
                  );
                  return (
                    <div
                      key={`${opt.value}-${idx}`}
                      className="form-check form-check-inline m-0"
                      style={{
                        backgroundColor: isChecked ? "#ecfdf5" : "#ffffff",
                        border: isChecked ? "1px solid #24695c" : "1px solid #cbd5e1",
                        borderRadius: "8px",
                        padding: "5px 10px",
                      }}
                    >
                      <Input
                        id={inputId}
                        type="checkbox"
                        className="form-check-input"
                        checked={isChecked}
                        onChange={(e) => togglePatternOption(opt.value, e.target.checked)}
                      />
                      <Label
                        htmlFor={inputId}
                        className="form-check-label"
                        style={{
                          fontWeight: isChecked ? "600" : "500",
                          color: isChecked ? "#14532d" : "#334155",
                        }}
                      >
                        {opt.label.includes("/") ? getTranslation(opt.label, lang) : opt.label}
                      </Label>
                    </div>
                  );
                })}
              </div>

              <div className="mt-2">
                <Input
                  type="text"
                  readOnly
                  value={selectedPatterns.join(", ")}
                  placeholder={getTranslation(
                    "Selected substance use pattern(s) will appear here... / चयनित उपयोग पैटर्न यहाँ दिखेगा...",
                    lang
                  )}
                  className="form-control bg-white fw-semibold"
                />
              </div>
            </div>
          </FormGroup>
        </div>
      </div>
    );
  };

  const renderPhysicalExamTable = (dataObj, onFieldChange, isCreateMode = false) => {
    const medField = isCreateMode ? "medicalConfirmationData" : "medical_history";
    const bloodField = isCreateMode
      ? "bloodConfirmationData"
      : "blood_transfusion_history";

    const rows = [
      {
        id: "1",
        question: getTranslation(anyMedicalHistory, lang),
        name: medField,
        type: "yesno",
      },
      {
        id: "2",
        question: getTranslation(anyBloodTransfusionHistory, lang),
        name: bloodField,
        type: "yesno",
      },
      {
        id: "3",
        question: getTranslation(Weight, lang),
        name: "weight",
        type: "number",
      },
      {
        id: "4",
        question: getTranslation(PulseRate, lang),
        name: "pulse_rate",
        type: "number",
      },
      {
        id: "5",
        question: getTranslation(Bloodpressure, lang),
        name: "blood_pressure",
        type: "text",
      },
      {
        id: "6",
        question: getTranslation("Temperature (°F) / तापमान (°F)", lang),
        name: "temperature",
        type: "number",
        min: 86,
        max: 113,
        step: "0.1",
        placeholder: getTranslation(
          "86 - 113 °F (e.g. 98.6 - 100 °F) / जैसे 98.6 - 100 °F",
          lang
        ),
      },
      {
        id: "7",
        question: getTranslation("SpO2 (%) / एसपीओ२ (%)", lang),
        name: "spo2",
        type: "number",
        min: 0,
        max: 100,
        step: 1,
        placeholder: getTranslation("0 - 100 %", lang),
      },
      {
        id: "8",
        question: getTranslation("Diabetes / मधुमेह", lang),
        name: "diabetes",
        type: "yesnona",
      },
      {
        id: "9",
        question: getTranslation("HIV / एचआईवी", lang),
        name: "hiv",
        type: "screening",
      },
      {
        id: "10",
        question: getTranslation("Hepatitis C (HCV) / हेपेटाइटिस सी (HCV)", lang),
        name: "hcv",
        type: "screening",
      },
      {
        id: "11",
        question: getTranslation("Hepatitis B (HBsAg) / हेपेटाइटिस बी (HBsAg)", lang),
        name: "hbsag",
        type: "screening",
      },
      {
        id: "12",
        question: getTranslation("VDRL / Syphilis / वीडीआरएल / सिफलिस", lang),
        name: "vdrl_syphilis",
        type: "screening",
      },
    ];

    return (
      <Table bordered>
        <thead>
          <tr>
            <th scope="col">{getTranslation(tableNumber, lang)}</th>
            <th scope="col">{getTranslation(genralPhysicalExamination, lang)}</th>
            <th scope="col">{getTranslation(Observation, lang)}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ id, question, name, type, min, max, step, placeholder }) => (
            <tr key={id}>
              <td>{id}</td>
              <td>{question}</td>
              <td>
                {type === "yesno" ? (
                  <select
                    className="form-control"
                    name={name}
                    value={dataObj?.[name] || ""}
                    onChange={(e) => onFieldChange(name, e.target.value)}
                  >
                    <option value="">{getTranslation("Select / चुनें", lang)}</option>
                    <option value="Yes">{getTranslation("Yes / हाँ", lang)}</option>
                    <option value="No">{getTranslation("No / नहीं", lang)}</option>
                  </select>
                ) : type === "yesnona" ? (
                  <select
                    className="form-control"
                    name={name}
                    value={normalizeDiabetesValue(dataObj?.[name])}
                    onChange={(e) => onFieldChange(name, e.target.value)}
                  >
                    <option value="">{getTranslation("Select / चुनें", lang)}</option>
                    <option value="Yes">{getTranslation("Yes / हाँ", lang)}</option>
                    <option value="No">{getTranslation("No / नहीं", lang)}</option>
                    <option value="NA">{getTranslation("NA / लागू नहीं", lang)}</option>
                  </select>
                ) : type === "screening" ? (
                  <select
                    className="form-control"
                    name={name}
                    value={normalizeScreeningValue(
                      name === "vdrl_syphilis"
                        ? dataObj?.vdrl_syphilis ?? dataObj?.vdrl ?? dataObj?.syphilis
                        : dataObj?.[name]
                    )}
                    onChange={(e) => onFieldChange(name, e.target.value)}
                  >
                    <option value="">{getTranslation("Select / चुनें", lang)}</option>
                    <option value="Negative">{getTranslation("Negative / नेगेटिव", lang)}</option>
                    <option value="Positive">{getTranslation("Positive / पॉजिटिव", lang)}</option>
                    <option value="NA">{getTranslation("NA / लागू नहीं", lang)}</option>
                  </select>
                ) : (
                  <Input
                    type={type === "number" ? "number" : "text"}
                    name={name}
                    value={dataObj?.[name] ?? ""}
                    min={min}
                    max={max}
                    step={step}
                    onChange={(e) => onFieldChange(name, e.target.value)}
                    placeholder={placeholder || getTranslation("Enter details / विवरण दर्ज करें", lang)}
                    className="form-control"
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  };


  return (
    <Fragment>
      <div className="pfa__wrapper">
        {/* <H5>{patientFirstAssessment}</H5> */}

{/* register user data into data table format start */}
        <Container fluid={true} className="datatables">
          <Row>
            <Col sm="12">
              <CardBody>
                {/* Register pateint list/user list */}
                <Card>
                  {/* <HeaderCard title="User Data Table with Multiple Selection" /> */}
                  <CardBody>
                    <div class="d-flex pb-2 justify-content-between">
                      <HeaderCard
                        
                         title={getTranslation("Patient First Assessment (PFA)/ रोगी प्रथम मूल्यांकन (पीएफए)" , lang)}
                        className="p-0"
                      />
                    </div>
                    <div className="row pb-3 align-items-center">
                      <div className="col-md-5 col-12 mb-2 mb-md-0">
                        <InputGroup>
                          <Input
                            className="form-control"
                            type="text"
                             placeholder={getTranslation("Search......./खोज.......",lang)}
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
                          columns={tableColumns}
                          filename="PFA_Registration_List"
                          title={getTranslation("Patient First Assessment (PFA) Registration List / रोगी प्रथम मूल्यांकन पंजीकरण सूची", lang)}
                        />
                      </div>
                    </div>
                    {stillLoading ? (
                      <div className="loading-text">
                        {getTranslation("Data is fetching from server. Please wait.../सर्वर से डेटा लिया जा रहा है। कृपया इंतज़ार करें...",lang)}
                      </div>
                    ) : (
                      <DataTable
                        data={filteredData}
                        columns={tableColumns}
                        striped
                        center
                        highlightOnHover
                        pagination
                        persistTableHead
                        onSelectedRowsChange={handleRowSelected}
                        selectableRowDisabled={selectableRowDisabled}
                        conditionalRowStyles={[
                          {
                            when: (row) => row.disabled,
                            style: {
                              backgroundColor: "#f5f5f5",
                              color: "#999",
                              pointerEvents: "none",
                            },
                          },
                        ]}
                      />
                    )}
                  </CardBody>
                  
                </Card>

{/* PFA pateint all list */}
                <Card>
                  {/* <HeaderCard title="User Data Table with Multiple Selection" /> */}
                  <CardBody>
                    <div class="d-flex pb-2 justify-content-between">
                      <HeaderCard
                        // title="All Patient First Assessment (PFA) List"
                        title={getTranslation("All Patient First Assessment (PFA) List/ सभी रोगी प्रथम मूल्यांकन (पीएफए) सूची" , lang)}
                        className="p-0"
                      />
                    </div>
                    <div className="row pb-3 align-items-center">
                      <div className="col-md-5 col-12 mb-2 mb-md-0">
                        <InputGroup>
                          <Input
                            className="form-control"
                            type="text"
                            placeholder={getTranslation("Search......./खोज.......",lang)}
                            value={PFAallDatasearchText}
                            onChange={handlePFASearchChange}
                          />
                          <span className="input-group-text">
                            <i className="fa fa-search"></i>
                          </span>
                        </InputGroup>
                      </div>
                      <div className="col-md-7 col-12 d-flex justify-content-md-end justify-content-start">
                        <TableExportButtons
                          data={pfaFilterData}
                          columns={tablePFAPatientListColumns}
                          filename="All_PFA_Patient_List"
                          title={getTranslation("All Patient First Assessment (PFA) List / सभी रोगी प्रथम मूल्यांकन (पीएफए) सूची", lang)}
                        />
                      </div>
                    </div>
                    {stillLoading ? (
                      <div className="loading-text">
                        {getTranslation("Data is fetching from server. Please wait.../सर्वर से डेटा लिया जा रहा है। कृपया इंतज़ार करें...",lang)}
                      </div>
                    ) : (
                      <DataTable
                        data={pfaFilterData}
                        columns={tablePFAPatientListColumns}
                        striped
                        center
                        highlightOnHover
                        pagination
                        persistTableHead
                        onSelectedRowsChange={handleRowSelected}
                        selectableRowDisabled={selectableRowDisabled}
                        conditionalRowStyles={[
                          {
                            when: (row) => row.disabled,
                            style: {
                              backgroundColor: "#f5f5f5",
                              color: "#999",
                              pointerEvents: "none",
                            },
                          },
                        ]}
                      />
                    )}
                  </CardBody>
                  
                </Card>
              </CardBody>
            </Col>
          </Row>
        </Container>

{/* register user data into data table format end */}


{/* all pfa patient data into data table format start */}



{/* all pfa patient data into data table format end */}


        <div className="generalInfo__section">
          {/* PFA data form modal */}
          <CommonModal
            isOpen={modal}
            title={getTranslation(patientFirstAssessment,lang)}
            toggler={closePFAModal}
            maxWidth="1200px"
          >
            {selectedUser && selectedUser.length > 0 ? (
              <>
                <DraftNoticeBanner
                  draftTimestamp={draftTimestamp}
                  formKey="pfa"
                  targetId={selectedUser?.[0]?.user_id || selectedUser?.[0]?.id || selectedUser?.user_id || selectedUser?.id || currentPFAUserId}
                  onDiscard={() => {
                    setFormData(initialPFAFormData);
                    setDraftTimestamp(null);
                  }}
                />
                {/* add more fields as needed */}
                <Form className="theme-form" onSubmit={handleSubmit}>
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

                  <div className="row g-3 px-3 pt-4 pb-2">
                    {/*Date of Assessment section/परीक्षण की तारीख :*/}
                    <div className="col-12 col-md-6">
                      <FormGroup className="mb-3">
                        <Label>
                          {getTranslation(dateOfAssessment,lang)}
                        </Label>
                        <DatePicker showMonthDropdown showYearDropdown dropdownMode="select"
                          className="form-control digits"
                          selected={safeDate(formData.dateOfAssessment)}
                          onChange={(date) =>
                            handleAssesmentDateChange(
                              "dateOfAssessment",
                              date
                            )
                          }
                        />
                      </FormGroup>
                    </div>
                  </div>
                  <div className="row px-3">
                    {/*Dependent to section/उपयोगकर्ता :*/}
                    <div className="col-md-12">
                      {renderDependentToField(
                        formData.dependentToData,
                        (val) =>
                          setFormData((prev) => ({
                            ...prev,
                            dependentToData: val,
                          })),
                        "create"
                      )}
                    </div>
                    {/* Substance Use Frequency (Left) & Substance Use Pattern (Right) */}
                    <div className="col-md-12">
                      {renderFrequencyAndPatternSection({
                        frequencyVal: formData.substanceUseFrequencyData,
                        onFrequencyChange: (val) =>
                          setFormData((prev) => ({
                            ...prev,
                            substanceUseFrequencyData: val,
                          })),
                        patternVal: formData.substanceUsePatternData,
                        onPatternChange: (val) =>
                          setFormData((prev) => ({
                            ...prev,
                            substanceUsePatternData: val,
                          })),
                        idPrefix: "create",
                      })}
                    </div>
                    {/*Last 30 Days Quantity section/उपयोगकर्ता :*/}
                    <div className="col-md-12">
                      <FormGroup className="mb-4 mt-4">
                        <VoiceTextarea
                          label={<Translated text={getTranslation(last30DaysQuantity,lang)} />}
                          name="last30DaysQuantityData"
                          value={formData.last30DaysQuantityData}
                          onChange={handleChange}
                        />
                      </FormGroup>
                    </div>
                    {/* General Physical Examination / सामान्य शारीरिक परीक्षण */}
                    <div className="table-responsive">
                      {renderPhysicalExamTable(
                        formData,
                        (name, val) =>
                          setFormData((prev) => ({
                            ...prev,
                            [name]: val,
                            ...(name === "vdrl_syphilis" ? { vdrl: val, syphilis: val } : {}),
                          })),
                        true
                      )}

                      <div className="col-md-12">
                        <FormGroup className="mb-4 mt-4">
                          {/* <Label>{getTranslation(mentionIfAny,lang)}</Label>
                          <Input
                            type="textarea"
                            className="form-control"
                            rows="3"
                            name="bloodTransfusionHistoryData"
                            value={formData.bloodTransfusionHistoryData}
                            onChange={handleChange}
                          /> */}
                          <VoiceTextarea
  label={<Translated text={getTranslation(mentionIfAny,lang)} />}
  name="bloodTransfusionHistoryData"
  value={formData.bloodTransfusionHistoryData}
  onChange={handleChange}
/>
                        </FormGroup>
                      </div>
                    </div>

                    {/* Complication Details / जटिलता विवरण */}
                    <div className="table-responsive">
                      <Table bordered>
                        <thead>
                          <tr>
                            <th scope="col">{getTranslation(tableNumber2,lang)}</th>
                            <th scope="col">{getTranslation(complicationDetails,lang)}</th>
                            <th scope="col">{getTranslation(yes1,lang)}</th>
                            <th scope="col">{getTranslation(no1,lang)}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { key: "ulcer", label: getTranslation(ulcers,lang) },
                            {
                              key: "respiratory_problem",
                              label: getTranslation(respiratoryProblem,lang),
                            },
                            { key: "jaundice", label: getTranslation(jaundice,lang) },
                            { key: "haematemesis", label: getTranslation(Haematemesis,lang) },
                            {
                              key: "abdominal_complaints",
                              label: getTranslation(otherAbdominalComplaints,lang),
                            },
                            { key: "cardiovascular", label: getTranslation(cardiovascular,lang) },
                          ].map(({ key, label }, index) => (
                            <tr key={key}>
                              <td>{index + 1}</td>
                              <td>{label}</td>
                              {[getTranslation("Yes/हाँ",lang), getTranslation("No/नहीं",lang)].map((value) => {
                                const inputId = `complication_${key}_${value}`;
                                return (
                                  <td
                                    key={inputId}
                                    className="align-middle"
                                  >
                                    <div className="form-check form-check-inline m-0">
                                      <Input
                                        id={inputId}
                                        type="radio"
                                        className="form-check-input"
                                        name={`complication_${key}`}
                                        value={value}
                                        checked={
                                          formData.complications[key] === value
                                        }
                                        onChange={() =>
                                          setFormData((prev) => ({
                                            ...prev,
                                            complications: {
                                              ...prev.complications,
                                              [key]: value,
                                            },
                                          }))
                                        }
                                      />
                                      <Label for={inputId} className="form-check-label">
                                        {value === getTranslation("Yes/हाँ",lang) ? getTranslation("Yes/हाँ",lang) : getTranslation("No/नहीं",lang)}
                                      </Label>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </Table>

                      <div className="col-md-12">
                        <FormGroup className="mb-4 mt-4">
                          {/* <Label>{getTranslation(mentionIfAny2,lang)}</Label>
                          <Input
                            type="textarea"
                            className="form-control"
                            rows="3"
                            name="complication_description"
                            value={formData.complication_description}
                            onChange={handleChange}
                          /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(mentionIfAny2,lang)} />}
  name="complication_description"
  value={formData.complication_description}
  onChange={handleChange}
/>

                        </FormGroup>
                      </div>
                    </div>

                    {/*Neurological section / न्यूरोलॉजिकल*/}
                    <div className="table-responsive">
                      <Table bordered>
                        <thead>
                          <tr>
                            <th scope="col">{getTranslation(tableNumber3,lang)}</th>
                            <th scope="col">{getTranslation(neurological,lang)}</th>
                            <th scope="col">{getTranslation(yes1,lang)}</th>
                            <th scope="col">{getTranslation(no1,lang)}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {neurologicalOptions.map((option, index) => (
                            <tr key={option.key}>
                              <td>{index + 1}</td>
                              <td>{getTranslation(option.label,lang)}</td>
                              {[getTranslation("Yes/हाँ",lang), getTranslation("No/नहीं",lang)].map((value) => {
                                const inputId = `neuro_${option.key}_${value}`;
                                return (
                                  <td
                                    key={inputId}
                                    className="align-middle"
                                  >
                                    <div className="form-check form-check-inline m-0">
                                      <Input
                                        id={inputId}
                                        type="radio"
                                        className="form-check-input"
                                        name={`neuro_${option.key}`}
                                        value={value}
                                        checked={
                                          formData.neurological[option.key] ===
                                          value
                                        }
                                        onChange={() =>
                                          setFormData((prev) => ({
                                            ...prev,
                                            neurological: {
                                              ...prev.neurological,
                                              [option.key]: value,
                                            },
                                          }))
                                        }
                                      />
                                      <Label for={inputId} className="form-check-label">
                                        {value === getTranslation("Yes/हाँ",lang) ? getTranslation("Yes/हाँ",lang) : getTranslation("No/नहीं",lang)}
                                      </Label>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </Table>

                      <div className="col-md-12">
                        <FormGroup className="mb-4 mt-4">
                          {/* <Label>{getTranslation(mentionIfAny2,lang)}</Label>
                          <Input
                            type="textarea"
                            className="form-control"
                            rows="3"
                            name="neuro_description"
                            value={formData.neuro_description}
                            onChange={handleChange}
                          /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(mentionIfAny2,lang)} />}
  name="neuro_description"
  value={formData.neuro_description}
  onChange={handleChange}
/>

                        </FormGroup>
                      </div>
                    </div>

                    {/* Using Medicine */}
                    <div className="col-md-12">
                      <FormGroup className="mb-3 mt-3">
                        <Label>{getTranslation(usingMedicine, lang)}</Label>
                        <Input
                          type="text"
                          name="using_medicine"
                          value={formData.using_medicine || ""}
                          onChange={handleChange}
                          placeholder={getTranslation(
                            "Enter currently using medicine... / वर्तमान में उपयोग की जा रही दवा दर्ज करें...",
                            lang
                          )}
                          className="form-control"
                        />
                      </FormGroup>
                    </div>

                    {/* Any Other Findings */}
                    <div className="col-md-12">
                      <FormGroup className="mb-4 mt-4">
                        {/* <Label>{getTranslation(anyOtherFindings,lang)}</Label>
                        <Input
                          type="textarea"
                          className="form-control"
                          rows="3"
                          name="other_findings"
                          value={formData.other_findings}
                          onChange={handleChange}
                        /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(anyOtherFindings,lang)} />}
  name="other_findings"
  value={formData.other_findings}
  onChange={handleChange}
/>

                      </FormGroup>
                    </div>

                    {/* Nutritional Status / नुट्रिशन स्तिथि */}
                    <div className="col-md-6">
                      <Label>{getTranslation("Nutritional Status / नुट्रिशन स्तिथि",lang)}</Label>
                      <div className="radio radio-primary d-flex gap-3">
                        {[getTranslation("Good/अच्छा",lang), getTranslation("Average/औसत",lang), getTranslation("Poor/गरीब",lang)].map((Nstatus) => (
                          <div key={Nstatus}>
                            <Input
                              type="radio"
                              id={`nutritionalStatus-${Nstatus}`}
                              name="nutritional_status"
                              value={Nstatus}
                              checked={formData.nutritional_status === Nstatus}
                              onChange={handleChange}
                            />
                            <Label htmlFor={`nutritionalStatus-${Nstatus}`}>
                              {Nstatus}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="col-md-12">
                      <FormGroup className="mb-2 mt-4">
                        {/* <Label>{getTranslation(Lymphadenopathy,lang)}</Label>
                        <Input
                          type="textarea"
                          className="form-control"
                          rows="3"
                          name="lymphadenopathy"
                          value={formData.lymphadenopathy}
                          onChange={handleChange}
                        /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(Lymphadenopathy,lang)} />}
  name="lymphadenopathy"
  value={formData.lymphadenopathy}
  onChange={handleChange}
/>

                      </FormGroup>
                    </div>

                    {/* Consent Section */}
                    <div className="col-md-12 mb-2">
                      <div className="checkbox ms-3 mb-2">
                        <Input
                          id="checkbox1"
                          type="checkbox"
                          checked={formData.consent === "Yes"}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              consent: e.target.checked ? "Yes" : "No",
                            }))
                          }
                        />
                        <Label className="text-muted" for="checkbox1">
                          {getTranslation(consent,lang)}
                        </Label>
                      </div>

                      <Row>
                        <Col md="4">
                          <FormGroup>
                            <Label>{getTranslation(name,lang)}</Label>
                            <Input
                              type="text"
                              placeholder={getTranslation("Name/नाम",lang)}
                              name="consent_name"
                              value={formData.consent_name}
                              onChange={handleChange}
                            />
                          </FormGroup>
                        </Col>
                        <Col md="4">
                          <FormGroup>
                            <Label>{getTranslation(relationship,lang)}</Label>
                            <Input
                              type="text"
                              placeholder={getTranslation("Relationship/संबंध",lang)}
                              name="consent_relationship"
                              value={formData.consent_relationship}
                              onChange={handleChange}
                            />
                          </FormGroup>
                        </Col>
                        {/* <Col md="4">
                          <FormGroup>
                            <Label>{getTranslation(signature,lang)}</Label>
                            <Input
                              type="text"
                              placeholder={getTranslation("Signature/हस्ताक्षर",lang)}
                              name="consent_signature"
                              value={formData.consent_signature}
                              onChange={handleChange}
                            />
                          </FormGroup>
                        </Col> */}
                      </Row>
                    </div>

                    <div className="row align-items-center">
                      {/* Prepared By Section */}
                      <div className="col-md-6 mt-3">
                        <FormGroup>
                          <Label>{getTranslation(prepared,lang)}</Label>
                          <Input
                            type="text"
                            placeholder={getTranslation("Prepared By/द्वारा तैयार",lang)}
                            name="prepared_by"
                            value={formData.prepared_by}
                            onChange={handleChange}
                          />
                        </FormGroup>
                      </div>

                      {/* verification Section */}
                      <div className="col-md-6 mt-4">
                        <div className="checkbox ms-3">
                          <Input
                            id="checkbox2"
                            type="checkbox"
                            checked={formData.verification === "Yes"}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                verification: e.target.checked ? "Yes" : "No",
                              }))
                            }
                          />
                          <Label className="text-muted" for="checkbox2">
                            {
                              getTranslation("Verification from parent side before PFA submitting/पीएफए ​​जमा करने से पहले माता-पिता की ओर से सत्यापन",lang)
                            }
                          </Label>
                        </div>
                      </div>
                    </div>
                    {/* Submit & Save Draft */}
                    <div className="col-md-12 mt-3 mb-3 d-flex align-items-center gap-2 flex-wrap">
                      <SaveDraftButton
                        formKey="pfa"
                        targetId={selectedUser?.[0]?.user_id || selectedUser?.[0]?.id || selectedUser?.user_id || selectedUser?.id || currentPFAUserId}
                        formData={formData}
                        onDraftSaved={() => setDraftTimestamp(Date.now())}
                        style={{ height: "38px", padding: "6px 16px" }}
                      />

                      <Button
                        color="primary"
                        type="submit"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <span
                            className="spinner-border spinner-border-sm"
                            role="status"
                            aria-hidden="true"
                          ></span>
                        ) : (
                          getTranslation("Submit Patient First Assessment (PFA) Form/रोगी प्रथम मूल्यांकन (पीएफए) फॉर्म जमा करें",lang)
                        )}
                      </Button>
                    </div>
                  </div>
                </Form>
              </>
            ) : (
              <div className="loader-box">
                <Spinner
                  className={selectedSpinner?.spinnerClass || "spinner-border"}
                />
              </div>
            )}
          </CommonModal>

          {/* PFA view data modal */}
          {/* PFA view data modal */}
          <CommonModal
            isOpen={viewModal}
            title={
              getTranslation("View First Physical Assessment / पहला शारीरिक मूल्यांकन देखें", lang)
            }
            toggler={closeUserViewModal}
            maxWidth="1100px"
          >
            <div className="p-3 p-md-4 print-area" ref={pdfRef} style={{ background: "#f8fafc" }}>
              {isLoading ? (
                <ModalLoading message={getTranslation("Loading Physical Assessment details... / विवरण लोड हो रहा है...", lang)} />
              ) : selectedUser ? (
                <div>
                  {/* Header Profile Banner Card with Profile Photo & GKS ID */}
                  {(() => {
                    const patientName = selectedUser.name || selectedUser.patient_name || "Patient";
                    const gksId = selectedUser.custom_code || selectedUser.gks_id || selectedUser.uid || selectedUser.user_id || selectedUser.id || "";
                    const profilePic = selectedUser.profile_pic || selectedUser.profile_image || selectedUser.image || "";
                    const initial = typeof patientName === "string" && patientName.trim() ? patientName.trim().charAt(0).toUpperCase() : "P";

                    return (
                      <div
                        className="card shadow-sm border-0 mb-4"
                        style={{
                          borderRadius: "16px",
                          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                          borderLeft: "6px solid #24695c",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <div className="card-body p-4">
                          <div className="d-flex flex-column flex-sm-row align-items-center gap-4">
                            {profilePic ? (
                              <img
                                src={profilePic}
                                crossOrigin="anonymous"
                                alt="Patient Profile"
                                style={{
                                  width: "90px",
                                  height: "90px",
                                  borderRadius: "50%",
                                  objectFit: "cover",
                                  border: "3px solid #24695c",
                                  boxShadow: "0 4px 12px rgba(36, 105, 92, 0.2)",
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "90px",
                                  height: "90px",
                                  borderRadius: "50%",
                                  background: "#eaf2f0",
                                  color: "#24695c",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "32px",
                                  fontWeight: "700",
                                  border: "3px solid #24695c",
                                  boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                                }}
                              >
                                {initial}
                              </div>
                            )}

                            <div className="text-center text-sm-start flex-grow-1">
                              <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-sm-start gap-2 mb-1">
                                <h3 className="mb-0 fw-bold text-dark" style={{ fontSize: "1.4rem" }}>
                                  {patientName}
                                </h3>
                                {gksId && (
                                  <Badge
                                    style={{
                                      borderRadius: "10px",
                                      fontSize: "12.5px",
                                      fontWeight: "700",
                                      backgroundColor: "#24695c",
                                      color: "#ffffff",
                                      padding: "5px 12px",
                                      letterSpacing: "0.4px",
                                    }}
                                  >
                                    GKS ID: {gksId}
                                  </Badge>
                                )}
                              </div>
                              <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-sm-start gap-3 mt-2 text-muted" style={{ fontSize: "13px" }}>
                                {selectedUser.phone && <span>📞 {selectedUser.phone}</span>}
                                {selectedUser.email && <span>✉️ {selectedUser.email}</span>}
                                {selectedUser.gender && <span>👤 {selectedUser.gender}</span>}
                                {selectedUser.date_of_assessment && (
                                  <span>📅 Assessment: {new Date(selectedUser.date_of_assessment).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Card 1: Patient & Physical Vitals */}
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
                        🩺 {getTranslation("Patient & Physical Vitals / रोगी एवं शारीरिक विवरण", lang)}
                      </h6>
                      <Badge color="light" className="text-muted border px-2 py-1">
                        📅 {selectedUser.date_of_assessment ? new Date(selectedUser.date_of_assessment).toLocaleDateString() : "-"}
                      </Badge>
                    </div>
                    <div className="card-body p-3 p-md-4">
                      <div className="row g-3">
                        <div className="col-12 col-sm-6 col-lg-4">
                          <div className="p-2 px-3 rounded-3 bg-light border">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                              {getTranslation("Name of Patient / मरीज का नाम:", lang)}
                            </div>
                            <div className="fw-semibold text-dark text-capitalize mt-1" style={{ fontSize: "13.5px" }}>
                              👤 {selectedUser.name || "-"}
                            </div>
                          </div>
                        </div>

                        <div className="col-6 col-sm-3 col-lg-2">
                          <div className="p-2 px-3 rounded-3 bg-light border">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                              {getTranslation("Age / उम्र:", lang)}
                            </div>
                            <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                              {selectedUser.age ? `${selectedUser.age} Yrs` : "-"}
                            </div>
                          </div>
                        </div>

                        <div className="col-6 col-sm-3 col-lg-2">
                          <div className="p-2 px-3 rounded-3 bg-light border">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                              {getTranslation("Weight / वजन", lang)}
                            </div>
                            <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                              ⚖️ {selectedUser.weight ? `${selectedUser.weight} kg` : "-"}
                            </div>
                          </div>
                        </div>

                        <div className="col-6 col-sm-4 col-lg-2">
                          <div className="p-2 px-3 rounded-3 bg-light border">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                              {getTranslation("Pulse Rate / पल्स रेट", lang)}
                            </div>
                            <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                              ❤️ {selectedUser.pulse_rate ? `${selectedUser.pulse_rate} bpm` : "-"}
                            </div>
                          </div>
                        </div>

                        <div className="col-6 col-sm-4 col-lg-2">
                          <div className="p-2 px-3 rounded-3 bg-light border">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                              {getTranslation("Blood pressure / रक्तचाप", lang)}
                            </div>
                            <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                              🩸 {selectedUser.blood_pressure || "-"}
                            </div>
                          </div>
                        </div>

                        <div className="col-6 col-sm-4 col-lg-2">
                          <div className="p-2 px-3 rounded-3 bg-light border">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                              {getTranslation("Temperature / तापमान", lang)}
                            </div>
                            <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                              🌡️ {selectedUser.temperature ? `${selectedUser.temperature} °F` : "-"}
                            </div>
                          </div>
                        </div>

                        <div className="col-6 col-sm-4 col-lg-2">
                          <div className="p-2 px-3 rounded-3 bg-light border">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                              {getTranslation("SpO2 / एसपीओ२", lang)}
                            </div>
                            <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                              🫁 {selectedUser.spo2 !== undefined && selectedUser.spo2 !== null && selectedUser.spo2 !== "" ? `${selectedUser.spo2} %` : "-"}
                            </div>
                          </div>
                        </div>

                        <div className="col-6 col-sm-4 col-lg-2">
                          <div className="p-2 px-3 rounded-3 bg-light border">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                              {getTranslation("Diabetes / मधुमेह", lang)}
                            </div>
                            <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                              🩺 {normalizeDiabetesValue(selectedUser.diabetes) || "-"}
                            </div>
                          </div>
                        </div>

                        {[
                          { key: "hiv", label: getTranslation("HIV / एचआईवी", lang) },
                          { key: "hcv", fallbackKey: "hepatitis_c", label: getTranslation("Hepatitis C (HCV) / हेपेटाइटिस सी", lang) },
                          { key: "hbsag", fallbackKey: "hepatitis_b", label: getTranslation("Hepatitis B (HBsAg) / हेपेटाइटिस बी", lang) },
                          { key: "vdrl_syphilis", fallbackKey: "vdrl", secondFallbackKey: "syphilis", label: getTranslation("VDRL / Syphilis / वीडीआरएल / सिफलिस", lang) },
                        ].map((item) => {
                          const rawVal =
                            selectedUser[item.key] ||
                            (item.fallbackKey ? selectedUser[item.fallbackKey] : "") ||
                            (item.secondFallbackKey ? selectedUser[item.secondFallbackKey] : "");
                          const val = rawVal ? normalizeScreeningValue(rawVal) : "";
                          const isPos = String(val || "").toLowerCase() === "positive";
                          const isNeg = String(val || "").toLowerCase() === "negative";
                          return (
                            <div className="col-6 col-sm-4 col-lg-2" key={item.key}>
                              <div className="p-2 px-3 rounded-3 bg-light border">
                                <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                                  {item.label}
                                </div>
                                <div className="fw-semibold mt-1" style={{ fontSize: "13px" }}>
                                  {val ? (
                                    <span
                                      className="px-2 py-0.5 rounded-pill d-inline-block"
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        backgroundColor: isPos ? "#fef2f2" : isNeg ? "#f0fdf4" : "#f1f5f9",
                                        color: isPos ? "#dc2626" : isNeg ? "#166534" : "#475569",
                                        border: `1px solid ${isPos ? "#fecaca" : isNeg ? "#bbf7d0" : "#e2e8f0"}`,
                                      }}
                                    >
                                      {val}
                                    </span>
                                  ) : (
                                    <span className="text-muted">-</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        <div className="col-12 col-sm-6 col-lg-4">
                          <div className="p-2 px-3 rounded-3 bg-light border">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                              {getTranslation("Nutritional Status / पोषण स्थिति:", lang)}
                            </div>
                            <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                              {selectedUser.nutritional_status || "-"}
                            </div>
                          </div>
                        </div>

                        <div className="col-12 col-sm-6 col-lg-8">
                          <div className="p-2 px-3 rounded-3 bg-light border">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                              {getTranslation("Lymphadenopathy (mention): / लिम्फैडेनोपैथी (उल्लेख):", lang)}
                            </div>
                            <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                              {selectedUser.lymphadenopathy || "-"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Substance Dependency */}
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
                        ⚠️ {getTranslation("Substance Dependency / पदार्थ निर्भरता", lang)}
                      </h6>
                    </div>
                    <div className="card-body p-3 p-md-4">
                      <div className="row g-3">
                        <div className="col-12 col-md-6">
                          <div className="p-2 px-3 rounded-3 bg-light border">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                              {getTranslation("Dependent To / निर्भरता का प्रकार:", lang)}
                            </div>
                            <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                              {selectedUser.dependent_to || "-"}
                            </div>
                          </div>
                        </div>

                        <div className="col-12 col-md-6">
                          <div className="p-2 px-3 rounded-3 bg-light border">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                              {getTranslation(substanceUseFrequency, lang)}
                            </div>
                            <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                              {selectedUser.substance_use_frequency || "-"}
                            </div>
                          </div>
                        </div>

                        <div className="col-12 col-md-6">
                          <div className="p-2 px-3 rounded-3 bg-light border">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                              {getTranslation("Substance Use Pattern / उपयोग का पैटर्न:", lang)}
                            </div>
                            <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                              {selectedUser.substance_use_pattern || "-"}
                            </div>
                          </div>
                        </div>

                        <div className="col-12 col-md-6">
                          <div className="p-2 px-3 rounded-3 bg-light border">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                              {getTranslation("Last 30 Days Quantity / पिछले 30 दिनों की मात्रा:", lang)}
                            </div>
                            <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                              {selectedUser.last_30_days_quantity || "-"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Medical History & Complications */}
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
                        🏥 {getTranslation("Medical History & Complications / चिकित्सा इतिहास एवं जटिलताएं", lang)}
                      </h6>
                    </div>
                    <div className="card-body p-3 p-md-4">
                      <div className="row g-3">
                        <div className="col-12 col-md-6">
                          <div className="p-2 px-3 rounded-3 bg-light border">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                              {getTranslation("Medical History / चिकित्सा इतिहास", lang)}
                            </div>
                            <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                              {selectedUser.medical_history || "-"}
                            </div>
                          </div>
                        </div>

                        <div className="col-12 col-md-6">
                          <div className="p-2 px-3 rounded-3 bg-light border">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                              {getTranslation("Blood Transfusion History / रक्त संक्रमण इतिहास", lang)}
                            </div>
                            <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                              {selectedUser.blood_transfusion_history || "-"}
                            </div>
                          </div>
                        </div>

                        <div className="col-6 col-sm-4 col-md-3">
                          <div className="p-2 px-3 rounded-3 bg-light border">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                              {getTranslation("Ulcers / अल्सर", lang)}
                            </div>
                            <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                              {selectedUser.ulcer || "-"}
                            </div>
                          </div>
                        </div>

                        <div className="col-6 col-sm-4 col-md-3">
                          <div className="p-2 px-3 rounded-3 bg-light border">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                              {getTranslation("Respiratory Problem / श्वसन समस्या", lang)}
                            </div>
                            <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                              {selectedUser.respiratory_problem || "-"}
                            </div>
                          </div>
                        </div>

                        <div className="col-6 col-sm-4 col-md-3">
                          <div className="p-2 px-3 rounded-3 bg-light border">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                              {getTranslation("Jaundice / पीलिया", lang)}
                            </div>
                            <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                              {selectedUser.jaundice || "-"}
                            </div>
                          </div>
                        </div>

                        <div className="col-6 col-sm-4 col-md-3">
                          <div className="p-2 px-3 rounded-3 bg-light border">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                              {getTranslation("Haematemesis (Blood Vomiting) / खून की उल्टी", lang)}
                            </div>
                            <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                              {selectedUser.haematemesis || "-"}
                            </div>
                          </div>
                        </div>

                        <div className="col-6 col-sm-4 col-md-3">
                          <div className="p-2 px-3 rounded-3 bg-light border">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                              {getTranslation("Abdominal Complaints / पेट की शिकायतें", lang)}
                            </div>
                            <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                              {selectedUser.abdominal_complaints || "-"}
                            </div>
                          </div>
                        </div>

                        <div className="col-6 col-sm-4 col-md-3">
                          <div className="p-2 px-3 rounded-3 bg-light border">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                              {getTranslation("Cardiovascular / हृदय संबंधी", lang)}
                            </div>
                            <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                              {selectedUser.cardiovascular || "-"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Neurological Symptoms */}
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
                        🧠 {getTranslation("Neurological Examination / न्यूरोलॉजिकल परीक्षण", lang)}
                      </h6>
                    </div>
                    <div className="card-body p-3 p-md-4">
                      <div className="row g-3">
                        <div className="col-6 col-sm-4 col-lg-3">
                          <div className="p-2 px-3 rounded-3 bg-light border">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                              {getTranslation("Seizure / फिट्स", lang)}
                            </div>
                            <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                              {selectedUser.seizure || "-"}
                            </div>
                          </div>
                        </div>

                        <div className="col-6 col-sm-4 col-lg-3">
                          <div className="p-2 px-3 rounded-3 bg-light border">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                              {getTranslation("Epilepsy / मिर्गी", lang)}
                            </div>
                            <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                              {selectedUser.epilepsy || "-"}
                            </div>
                          </div>
                        </div>

                        <div className="col-6 col-sm-4 col-lg-3">
                          <div className="p-2 px-3 rounded-3 bg-light border">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                              {getTranslation("Delirium / भ्रम", lang)}
                            </div>
                            <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                              {selectedUser.delirium || "-"}
                            </div>
                          </div>
                        </div>

                        <div className="col-6 col-sm-4 col-lg-3">
                          <div className="p-2 px-3 rounded-3 bg-light border">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                              {getTranslation("Trembling / कांपना", lang)}
                            </div>
                            <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                              {selectedUser.trembling || "-"}
                            </div>
                          </div>
                        </div>

                        <div className="col-6 col-sm-4 col-lg-3">
                          <div className="p-2 px-3 rounded-3 bg-light border">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                              {getTranslation("Memory Loss / स्मृति हानि", lang)}
                            </div>
                            <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                              {selectedUser.memory_loss || "-"}
                            </div>
                          </div>
                        </div>

                        <div className="col-6 col-sm-4 col-lg-3">
                          <div className="p-2 px-3 rounded-3 bg-light border">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                              {getTranslation("Neuropathy / स्नायु रोग", lang)}
                            </div>
                            <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                              {selectedUser.neuropathy || "-"}
                            </div>
                          </div>
                        </div>

                        <div className="col-6 col-sm-4 col-lg-3">
                          <div className="p-2 px-3 rounded-3 bg-light border">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                              {getTranslation("Blackout / बेहोशी", lang)}
                            </div>
                            <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                              {selectedUser.blackout || "-"}
                            </div>
                          </div>
                        </div>

                        <div className="col-12">
                          <div className="p-2 px-3 rounded-3 bg-light border">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                              {getTranslation(usingMedicine, lang)}
                            </div>
                            <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                              {selectedUser.using_medicine || "-"}
                            </div>
                          </div>
                        </div>

                        <div className="col-12">
                          <div className="p-2 px-3 rounded-3 bg-light border">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                              {getTranslation("Other Findings / अन्य खोज:", lang)}
                            </div>
                            <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                              {selectedUser.other_findings || "-"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 5: Consent & Signatures */}
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
                        📝 {getTranslation("Consent & Staff Signatures / सहमति एवं हस्ताक्षर", lang)}
                      </h6>
                    </div>
                    <div className="card-body p-3 p-md-4">
                      <div className="row g-3">
                        <div className="col-12 col-sm-4">
                          <div className="p-2 px-3 rounded-3 bg-light border">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                              {getTranslation("Consent: / सहमति:", lang)}
                            </div>
                            <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                              {selectedUser.consent || "-"}
                            </div>
                          </div>
                        </div>

                        <div className="col-12 col-sm-4">
                          <div className="p-2 px-3 rounded-3 bg-light border">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                              {getTranslation("Consent Name:/सहमति नाम:", lang)}
                            </div>
                            <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                              {selectedUser.consent_name || "-"}
                            </div>
                          </div>
                        </div>

                        <div className="col-12 col-sm-4">
                          <div className="p-2 px-3 rounded-3 bg-light border">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                              {getTranslation("Relationship:/संबंध:", lang)}
                            </div>
                            <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                              {selectedUser.consent_relationship || "-"}
                            </div>
                          </div>
                        </div>

                        <div className="col-12 col-sm-6">
                          <div className="p-2 px-3 rounded-3 bg-light border">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                              {getTranslation("Prepared by:/द्वारा तैयार:", lang)}
                            </div>
                            <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                              ✍️ {selectedUser.prepared_by || "-"}
                            </div>
                          </div>
                        </div>

                        <div className="col-12 col-sm-6">
                          <div className="p-2 px-3 rounded-3 bg-light border">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                              {getTranslation("Verification Status / सत्यापन स्थिति", lang)}
                            </div>
                            <div className="mt-1">
                              <span
                                className={`badge ${selectedUser.verification === "Yes" ? "bg-success" : "bg-warning text-dark"} p-2`}
                                style={{ fontSize: "12px" }}
                              >
                                {selectedUser.verification === "Yes"
                                  ? `✓ ${getTranslation("Verified / सत्यापित", lang)}`
                                  : `⏳ ${getTranslation("Pending / लंबित", lang)}`}
                              </span>
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
                    {getTranslation("No data available / कोई डेटा मौजूद नहीं", lang)}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <ModalActionButtons
              onClose={closeUserViewModal}
              onPrint={handlePrint}
              onDownload={handleDownloadPDF}
              isDownloading={pfaDownload}
              downloadText={getTranslation("Download PDF / डाउनलोड करें", lang)}
            />
          </CommonModal>

          {/* Readmission PFA Edit Modal */}
          <CommonModal
            isOpen={PFAEditModal}
            title={getTranslation("Readmission Patient First Assessment (PFA)/पुनः प्रवेश रोगी प्रथम मूल्यांकन (पीएफए)",lang)}
            toggler={closeUserViewModal}
            maxWidth="1200px"
          >
            {PFAEditModal && PFAeditData && (
              <div className="row">
                <Form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleReadmissionAssessment();
                  }}
                >
                  {/* Date of assesment */}
                    <div className="col-md-6 mt-3">
                      <FormGroup className="form-group row">
                        <Label className="col-sm-12 col-form-label  col-xl-6">
                          {dateOfAssessment}
                        </Label>
                        <Col xl="5" sm="12">
                          <div className="input-group">
                            <DatePicker showMonthDropdown showYearDropdown dropdownMode="select"
                              className="form-control digits"
                              selected={safeDate(PFAeditData?.date_of_assessment)}
                              onChange={(date) =>
  setPFAeditData({
    ...PFAeditData,
    date_of_assessment: date, // this is already a Date object
  })
}

                            />
                          </div>
                        </Col>
                      </FormGroup>
                    </div>
                  {/* Dependent To */}
                  <div className="col-md-12 pt-3">
                    {renderDependentToField(
                      PFAeditData?.dependent_to || "",
                      (val) =>
                        setPFAeditData((prev) => ({
                          ...(prev || {}),
                          dependent_to: val,
                        })),
                      "readmit"
                    )}
                  </div>

                  {/* Substance Use Frequency (Left) & Substance Use Pattern (Right) */}
                  <div className="col-md-12">
                    {renderFrequencyAndPatternSection({
                      frequencyVal: PFAeditData?.substance_use_frequency || "",
                      onFrequencyChange: (val) =>
                        setPFAeditData((prev) => ({
                          ...(prev || {}),
                          substance_use_frequency: val,
                        })),
                      patternVal: PFAeditData?.substance_use_pattern || "",
                      onPatternChange: (val) =>
                        setPFAeditData((prev) => ({
                          ...(prev || {}),
                          substance_use_pattern: val,
                        })),
                      idPrefix: "readmit",
                    })}
                  </div>

                  {/* Last 30 Days Quantity */}
                  <div className="col-md-12">
                    <FormGroup className="mb-0">
                      <VoiceTextarea
                        label={<Translated text={getTranslation(last30DaysQuantity,lang)} />}
                        name="last30DaysQuantityData"
                        value={PFAeditData.last_30_days_quantity}
                        onChange={(e) =>
                          setPFAeditData({
                            ...PFAeditData,
                            last_30_days_quantity: e.target.value,
                          })
                        }
                      />
                    </FormGroup>
                  </div>

                  {/* General Physical Examination */}
                  <div className="table-responsive">
                    {renderPhysicalExamTable(
                      PFAeditData,
                      (name, val) =>
                        setPFAeditData((prev) => ({
                          ...(prev || {}),
                          [name]: val,
                          ...(name === "vdrl_syphilis" ? { vdrl: val, syphilis: val } : {}),
                        })),
                      false
                    )}

                    <div className="col-md-12">
                      <FormGroup className="mb-0">
                        {/* <Label>{getTranslation(mentionIfAny,lang)}</Label>
                        <Input
                          type="textarea"
                          rows="3"
                          name="bloodTransfusionHistoryData"
                          value={PFAeditData.medical_or_blood_history_details}
                          onChange={(e) =>
                            setPFAeditData({
                              ...PFAeditData,
                              medical_or_blood_history_details: e.target.value,
                            })
                          }
                        /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(mentionIfAny,lang)} />}
  name="bloodTransfusionHistoryData"
  value={PFAeditData.medical_or_blood_history_details}
  onChange={(e) =>
    setPFAeditData({
      ...PFAeditData,
      medical_or_blood_history_details: e.target.value,
    })
  }
/>

                      </FormGroup>
                    </div>
                  </div>

                  {/* Complication Details */}
                  <div className="table-responsive">
                    <Table bordered>
                      <thead>
                        <tr>
                          <th>{getTranslation(tableNumber2,lang)}</th>
                          <th>{getTranslation(complicationDetails,lang)}</th>
                          <th>{getTranslation(yes1,lang)}</th>
                          <th>{getTranslation(no1,lang)}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { key: "ulcer", label: getTranslation(ulcers,lang) },
                          {
                            key: "respiratory_problem",
                            label: getTranslation(respiratoryProblem,lang),
                          },
                          { key: "jaundice", label: getTranslation(jaundice,lang) },
                          { key: "haematemesis", label: getTranslation(Haematemesis,lang) },
                          {
                            key: "abdominal_complaints",
                            label: getTranslation(otherAbdominalComplaints,lang),
                          },
                          { key: "cardiovascular", label: getTranslation(cardiovascular,lang) },
                        ].map(({ key, label }, index) => (
                          <tr key={key}>
                            <td>{index + 1}</td>
                            <td>{label}</td>
                              {[getTranslation("Yes/हाँ",lang), getTranslation("No/नहीं",lang)].map((value) => {
                                const inputId = `complication_${key}_${value}`;
                                return (
                                  <td
                                    key={inputId}
                                    className="align-middle"
                                  >
                                    <div className="form-check form-check-inline m-0">
                                      <Input
                                        id={inputId}
                                        type="radio"
                                        className="form-check-input"
                                        name={`complication_${key}`}
                                        value={value}
                                        checked={
                                          PFAeditData?.complications?.[
                                            key
                                          ]?.toString() === value.toString()
                                        }
                                        onChange={() => {
                                          setPFAeditData((prev) => ({
                                            ...prev,
                                            complications: {
                                              ...prev.complications,
                                              [key]: value,
                                            },
                                          }));
                                        }}
                                      />
                                      <Label
                                        className="form-check-label"
                                        htmlFor={inputId}
                                      >
                                        {value}
                                      </Label>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </Table>

                    <div className="col-md-12">
                      <FormGroup className="mb-0">
                        {/* <Label>{getTranslation(mentionIfAny2,lang)}</Label>
                        <Input
                          type="textarea"
                          rows="3"
                          name="complication_description"
                          value={PFAeditData.complication_description}
                          onChange={(e) =>
                            setPFAeditData({
                              ...PFAeditData,
                              complication_description: e.target.value,
                            })
                          }
                        /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(mentionIfAny2,lang)} />}
  name="complication_description"
                          value={PFAeditData.complication_description}
                          onChange={(e) =>
                            setPFAeditData({
                              ...PFAeditData,
                              complication_description: e.target.value,
                            })
                          }
/>

                      </FormGroup>
                    </div>
                  </div>

                  {/* Neurological Section */}
                  <div className="table-responsive">
                    <Table bordered>
                      <thead>
                        <tr>
                          <th>{getTranslation(tableNumber3,lang)}</th>
                          <th>{getTranslation(neurological,lang)}</th>
                          <th>{getTranslation(yes1,lang)}</th>
                          <th>{getTranslation(no1,lang)}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {neurologicalOptions.map((option, index) => (
                          <tr key={option.key}>
                            <td>{index + 1}</td>
                            <td>{getTranslation(option.label,lang)}</td>
                            {[getTranslation("Yes/हाँ",lang), getTranslation("No/नहीं",lang)].map((value) => {
                              const inputId = `neuro_${option.key}_${value}`;
                              return (
                                <td
                                  key={inputId}
                                  className="align-middle"
                                >
                                  <div className="form-check form-check-inline m-0">
                                    <Input
                                      id={inputId}
                                      type="radio"
                                      className="form-check-input"
                                      name={`neuro_${option.key}`}
                                      value={value}
                                      checked={
                                        PFAeditData?.neurological?.[
                                          option.key
                                        ]?.toString() === value.toString()
                                      }
                                      onChange={() =>
                                        setPFAeditData((prev) => ({
                                          ...prev,
                                          neurological: {
                                            ...prev.neurological,
                                            [option.key]: value,
                                          },
                                        }))
                                      }
                                    />
                                    <Label
                                      className="form-check-label"
                                      htmlFor={inputId}
                                    >
                                      {value}
                                    </Label>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </Table>

                    <div className="col-md-12">
                      <FormGroup className="mb-0">
                        {/* <Label>{getTranslation(mentionIfAny2,lang)}</Label>
                        <Input
                          type="textarea"
                          rows="3"
                          name="neuro_description"
                          value={PFAeditData.neuro_description}
                          onChange={(e) =>
                            setPFAeditData({
                              ...PFAeditData,
                              neuro_description: e.target.value,
                            })
                          }
                        /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(mentionIfAny2,lang)} />}
  name="neuro_description"
  value={PFAeditData.neuro_description}
  onChange={(e) =>
    setPFAeditData({
      ...PFAeditData,
      neuro_description: e.target.value,
    })
  }
/>

                      </FormGroup>
                    </div>
                  </div>

                  {/* Using Medicine */}
                  <div className="col-md-12">
                    <FormGroup className="mb-3 mt-3">
                      <Label>{getTranslation(usingMedicine, lang)}</Label>
                      <Input
                        type="text"
                        name="using_medicine"
                        value={PFAeditData?.using_medicine || ""}
                        onChange={(e) =>
                          setPFAeditData((prev) => ({
                            ...(prev || {}),
                            using_medicine: e.target.value,
                          }))
                        }
                        placeholder={getTranslation(
                          "Enter currently using medicine... / वर्तमान में उपयोग की जा रही दवा दर्ज करें...",
                          lang
                        )}
                        className="form-control"
                      />
                    </FormGroup>
                  </div>

                  {/* Any Other Findings */}
                  <div className="col-md-12">
                    <FormGroup className="mb-0">
                      {/* <Label>{getTranslation(anyOtherFindings,lang)}</Label>
                      <Input
                        type="textarea"
                        rows="3"
                        name="other_findings"
                        value={PFAeditData.other_findings}
                        onChange={(e) =>
                          setPFAeditData({
                            ...PFAeditData,
                            other_findings: e.target.value,
                          })
                        }
                      /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(anyOtherFindings,lang)} />}
  name="other_findings"
                        value={PFAeditData.other_findings}
                        onChange={(e) =>
                          setPFAeditData({
                            ...PFAeditData,
                            other_findings: e.target.value,
                          })
                        }
/>

                    </FormGroup>
                  </div>

                  {/* Lymphadenopathy */}
                  <div className="col-md-12">
                    <FormGroup className="mb-0">
                      {/* <Label>{getTranslation(Lymphadenopathy,lang)}</Label>
                      <Input
                        type="textarea"
                        rows="3"
                        name="lymphadenopathy"
                        value={PFAeditData.lymphadenopathy}
                        onChange={(e) =>
                          setPFAeditData({
                            ...PFAeditData,
                            lymphadenopathy: e.target.value,
                          })
                        }
                      /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(Lymphadenopathy,lang)} />}
  name="lymphadenopathy"
                        value={PFAeditData.lymphadenopathy}
                        onChange={(e) =>
                          setPFAeditData({
                            ...PFAeditData,
                            lymphadenopathy: e.target.value,
                          })
                        }
/>

                    </FormGroup>
                  </div>

                  {/* Nutritional Status / नुट्रिशन स्तिथि */}
                  <div className="col-md-6">
                    <Label>{getTranslation("Nutritional Status / नुट्रिशन स्तिथि,",lang)}</Label>
                    <div className="radio radio-primary d-flex gap-3">
                      {[getTranslation("Good/अच्छा",lang), getTranslation("Average/औसत",lang), getTranslation("Poor/गरीब",lang)].map((Nstatus) => (
                        <div key={Nstatus}>
                          <Input
                            type="radio"
                            id={`nutritionalStatus-${Nstatus}`}
                            name="nutritional_status"
                            value={Nstatus}
                            checked={PFAeditData.nutritional_status === Nstatus}
                            onChange={(e) =>
                              setPFAeditData({
                                ...PFAeditData,
                                nutritional_status: e.target.value,
                              })
                            }
                          />
                          <Label htmlFor={`nutritionalStatus-${Nstatus}`}>
                            {Nstatus}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Consent Section */}
                  <div className="col-md-12 mt-4">
                    <div className="checkbox ms-3">
                    <Input
                      id="checkbox1"
                      type="checkbox"
                      checked={PFAeditData.readmissionConsent === "Yes"}
                      onChange={(e) =>
                        setPFAeditData({
                          ...PFAeditData,
                          readmissionConsent: e.target.checked ? "Yes" : "No",
                        })
                      }
                    />
                    <Label className="text-muted" for="checkbox1">
                      {getTranslation(consent,lang)}
                    </Label>
                  </div>

                    <Row>
                      <Col md="4">
                        <FormGroup>
                          <Label>{getTranslation(name,lang)}</Label>
                          <Input
                            type="text"
                            name="consent_name"
                            placeholder={getTranslation("Name/नाम",lang)}
                            value={PFAeditData.consent_name}
                            onChange={(e) =>
                              setPFAeditData({
                                ...PFAeditData,
                                consent_name: e.target.value,
                              })
                            }
                          />
                        </FormGroup>
                      </Col>
                      <Col md="4">
                        <FormGroup>
                          <Label>{getTranslation(relationship,lang)}</Label>
                          <Input
                            type="text"
                            name="consent_relationship"
                            placeholder={getTranslation("Relationship/संबंध",lang)}
                            value={PFAeditData.consent_relationship}
                            onChange={(e) =>
                              setPFAeditData({
                                ...PFAeditData,
                                consent_relationship: e.target.value,
                              })
                            }
                          />
                        </FormGroup>
                      </Col>
                      {/* <Col md="4">
                        <FormGroup>
                          <Label>{getTranslation(signature,lang)}</Label>
                          <Input
                            type="text"
                            name="consent_signature"
                            placeholder={getTranslation("Signature/हस्ताक्षर",lang)}
                            value={PFAeditData.consent_signature}
                            onChange={(e) =>
                              setPFAeditData({
                                ...PFAeditData,
                                consent_signature: e.target.value,
                              })
                            }
                          />
                        </FormGroup>
                      </Col> */}
                    </Row>
                  </div>

                  {/* Prepared By Section */}
                  <div className="col-md-12 mt-3">
                    <FormGroup>
                      <Label>{getTranslation(prepared,lang)}</Label>
                      <Input
                        type="text"
                        name="prepared_by"
                        placeholder={getTranslation("Prepared By/द्वारा तैयार",lang)}
                        value={PFAeditData.prepared_by}
                        onChange={(e) =>
                          setPFAeditData({
                            ...PFAeditData,
                            prepared_by: e.target.value,
                          })
                        }
                      />
                    </FormGroup>
                  </div>

                  <div className="col-md-12 mt-4">
                        <div className="checkbox ms-3">
                          <Input
                            id="checkbox3"
                            type="checkbox"
                            checked={PFAeditData.readmissionVerification === "Yes"}
                            onChange={(e) =>
                              setPFAeditData((prev) => ({
                                ...prev,
                                readmissionVerification: e.target.checked ? "Yes" : "No",
                              }))
                            }
                          />
                          <Label className="text-muted" for="checkbox3">
                            {
                              getTranslation("Verification from parent side before PFA submitting/PFA सबमिट करने से पहले माता-पिता की तरफ से वेरिफिकेशन",lang)
                            }
                          </Label>
                        </div>
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
                        getTranslation("Recreate PFA Form / पीएफए ​​को पुनः बनाएँ",lang)
                      )}
                    </Button>
                  </div>
                </Form>
              </div>
            )}
          </CommonModal>



           {/* Edit individual PFA by user_id modal */}
           <CommonModal
            isOpen={PFAEditIndividualDataModal}
            title={getTranslation("Edit Patient First Assessment (PFA)/रोगी प्रथम मूल्यांकन (PFA) संपादित करें",lang)}
            toggler={closeUserViewModal}
            maxWidth="1200px"
          >

 
  {PFAEditIndividualDataModal && (
      <div className="row p-3">
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            handlerEditPFAIndividualAssessmentData();
          }}
        >
          {/* Date of assesment */}
            <div className="col-md-6 mt-3">
              <FormGroup className="form-group row">
                <Label className="col-sm-12 col-form-label  col-xl-6">
                  {getTranslation(dateOfAssessment,lang)}
                </Label>
                <Col xl="5" sm="12">
                  <div className="input-group">
                  <DatePicker showMonthDropdown showYearDropdown dropdownMode="select"
  className="form-control digits"
  selected={safeDate(PFAeditData?.date_of_assessment)} // Always Date object or null
  onChange={(date) =>
    setPFAeditData({
      ...PFAeditData,
      date_of_assessment: date, // Store as Date object
    })
  }
  
/>

                  </div>
                </Col>
              </FormGroup>
            </div>
          {/* Dependent To */}
          <div className="col-md-12 pt-3">
            {renderDependentToField(
              PFAeditData?.dependent_to || "",
              (val) =>
                setPFAeditData((prev) => ({
                  ...(prev || {}),
                  dependent_to: val,
                })),
              "edit"
            )}
          </div>

          {/* Substance Use Frequency (Left) & Substance Use Pattern (Right) */}
          <div className="col-md-12">
            {renderFrequencyAndPatternSection({
              frequencyVal: PFAeditData?.substance_use_frequency || "",
              onFrequencyChange: (val) =>
                setPFAeditData((prev) => ({
                  ...(prev || {}),
                  substance_use_frequency: val,
                })),
              patternVal: PFAeditData?.substance_use_pattern || "",
              onPatternChange: (val) =>
                setPFAeditData((prev) => ({
                  ...(prev || {}),
                  substance_use_pattern: val,
                })),
              idPrefix: "edit",
            })}
          </div>

          {/* Last 30 Days Quantity */}
          <div className="col-md-12">
            <FormGroup className="mb-0">
              <VoiceTextarea
                label={<Translated text={getTranslation(last30DaysQuantity,lang)} />}
                name="last30DaysQuantityData"
                value={PFAeditData?.last_30_days_quantity}
                onChange={(e) =>
                  setPFAeditData({
                    ...PFAeditData,
                    last_30_days_quantity: e.target.value,
                  })
                }
              />
            </FormGroup>
          </div>

          {/* General Physical Examination */}
          <div className="table-responsive">
            {renderPhysicalExamTable(
              PFAeditData,
              (name, val) =>
                setPFAeditData((prev) => ({
                  ...(prev || {}),
                  [name]: val,
                  ...(name === "vdrl_syphilis" ? { vdrl: val, syphilis: val } : {}),
                })),
              false
            )}

            <div className="col-md-12">
              <FormGroup className="mb-0 mt-4 mb-4">
                {/* <Label>{getTranslation(mentionIfAny,lang)}</Label>
                <Input
                  type="textarea"
                  rows="3"
                  name="bloodTransfusionHistoryData"
                  value={PFAeditData?.medical_or_blood_history_details}
                  onChange={(e) =>
                    setPFAeditData({
                      ...PFAeditData,
                      medical_or_blood_history_details: e.target.value,
                    })
                  }
                /> */}
                <VoiceTextarea
  label={<Translated text={getTranslation(mentionIfAny,lang)} />}
  name="bloodTransfusionHistoryData"
  value={PFAeditData?.medical_or_blood_history_details}
  onChange={(e) =>
    setPFAeditData({
      ...PFAeditData,
      medical_or_blood_history_details: e.target.value,
    })
  }
/>
              </FormGroup>
            </div>
          </div>

          {/* Complication Details */}
          <div className="table-responsive">
  <Table bordered>
    <thead>
      <tr>
        <th>{getTranslation(tableNumber2,lang)}</th>
        <th>{getTranslation(complicationDetails,lang)}</th>
        <th>{getTranslation(yes1,lang)}</th>
        <th>{getTranslation(no1,lang)}</th>
      </tr>
    </thead>
    <tbody>
      {[
        { key: "ulcer", label: getTranslation(ulcers,lang) },
        { key: "respiratory_problem", label: getTranslation(respiratoryProblem,lang) },
        { key: "jaundice", label: getTranslation(jaundice,lang) },
        { key: "haematemesis", label: getTranslation(Haematemesis,lang) },
        { key: "abdominal_complaints", label: getTranslation(otherAbdominalComplaints,lang) },
        { key: "cardiovascular", label: getTranslation(cardiovascular,lang) },
      ].map(({ key, label }, index) => (
        <tr key={key}>
          <td>{index + 1}</td>
          <td>{label}</td>
                              {[getTranslation("Yes/हाँ",lang), getTranslation("No/नहीं",lang)].map((value) => {
                                const inputId = `complication_${key}_${value}`;
                                return (
                                  <td
                                    key={inputId}
                                    className="align-middle"
                                  >
                                    <div className="form-check form-check-inline m-0">
                                      <Input
                                        id={inputId}
                                        type="radio"
                                        className="form-check-input"
                                        name={`complication_${key}`}
                                        value={value}
                                        checked={
                                          PFAeditData?.[key]?.toString() === value.toString()
                                        }
                                        onChange={() => {
                                          setPFAeditData((prev) => ({
                                            ...prev,
                                            [key]: value, // store directly in flat structure
                                          }));
                                        }}
                                      />
                                      <Label
                                        className="form-check-label"
                                        htmlFor={inputId}
                                      >
                                        {value}
                                      </Label>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </Table>

  <div className="col-md-12">
    <FormGroup className="mb-0 mt-4 mb-4">
      <Label>{getTranslation(mentionIfAny2,lang)}</Label>
      {/* <Input
        type="textarea"
        rows="3"
        name="complication_description"
        value={PFAeditData?.complication_description || ""}
        onChange={(e) =>
          setPFAeditData({
            ...PFAeditData,
            complication_description: e.target.value,
          })
        }
      /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(mentionIfAny2,lang)} />}
  name="complication_description"
        value={PFAeditData?.complication_description || ""}
        onChange={(e) =>
          setPFAeditData({
            ...PFAeditData,
            complication_description: e.target.value,
          })
        }
/>

    </FormGroup>
  </div>
</div>


          {/* Neurological Section */}
          <div className="table-responsive">
  <Table bordered>
    <thead>
      <tr>
        <th>{getTranslation(tableNumber3,lang)}</th>
        <th>{getTranslation(neurological,lang)}</th>
        <th>{getTranslation(yes1,lang)}</th>
        <th>{getTranslation(no1,lang)}</th>
      </tr>
    </thead>
    <tbody>
      {neurologicalOptions.map((option, index) => (
        <tr key={option.key}>
          <td>{index + 1}</td>
          <td>{getTranslation(option.label,lang)}</td>
          {[getTranslation("Yes/हाँ",lang), getTranslation("No/नहीं",lang)].map((value) => {
            const inputId = `neuro_${option.key}_${value}`;
            return (
              <td
                key={inputId}
                className="align-middle"
              >
                <div className="form-check form-check-inline m-0">
                  <Input
                    id={inputId}
                    type="radio"
                    className="form-check-input"
                    name={`neuro_${option.key}`}
                    value={value}
                    checked={
                      PFAeditData?.[option.key]?.toString() === value.toString()
                    }
                    onChange={() =>
                      setPFAeditData((prev) => ({
                        ...prev,
                        [option.key]: value, // store in flat structure
                      }))
                    }
                  />
                  <Label
                    className="form-check-label"
                    htmlFor={inputId}
                  >
                    {value}
                  </Label>
                </div>
              </td>
            );
          })}
        </tr>
      ))}
    </tbody>
  </Table>

  <div className="col-md-12">
    <FormGroup className="mb-0 mt-4 mb-4">
      {/* <Label>{getTranslation(mentionIfAny2,lang)}</Label>
      <Input
        type="textarea"
        rows="3"
        name="neuro_description"
        value={PFAeditData?.neuro_description || ""}
        onChange={(e) =>
          setPFAeditData({
            ...PFAeditData,
            neuro_description: e.target.value,
          })
        }
      /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(mentionIfAny2,lang)} />}
  name="neuro_description"
        value={PFAeditData?.neuro_description || ""}
        onChange={(e) =>
          setPFAeditData({
            ...PFAeditData,
            neuro_description: e.target.value,
          })
        }
/>

    </FormGroup>
  </div>
</div>


          {/* Using Medicine */}
          <div className="col-md-12">
            <FormGroup className="mb-3 mt-3">
              <Label>{getTranslation(usingMedicine, lang)}</Label>
              <Input
                type="text"
                name="using_medicine"
                value={PFAeditData?.using_medicine || ""}
                onChange={(e) =>
                  setPFAeditData((prev) => ({
                    ...(prev || {}),
                    using_medicine: e.target.value,
                  }))
                }
                placeholder={getTranslation(
                  "Enter currently using medicine... / वर्तमान में उपयोग की जा रही दवा दर्ज करें...",
                  lang
                )}
                className="form-control"
              />
            </FormGroup>
          </div>

          {/* Any Other Findings */}
          <div className="col-md-12">
            <FormGroup className="mb-0">
              {/* <Label>{getTranslation(anyOtherFindings,lang)}</Label>
              <Input
                type="textarea"
                rows="3"
                name="other_findings"
                value={PFAeditData?.other_findings}
                onChange={(e) =>
                  setPFAeditData({
                    ...PFAeditData,
                    other_findings: e.target.value,
                  })
                }
              /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(anyOtherFindings,lang)} />}
  name="other_findings"
                value={PFAeditData?.other_findings}
                onChange={(e) =>
                  setPFAeditData({
                    ...PFAeditData,
                    other_findings: e.target.value,
                  })
                }
/>

            </FormGroup>
          </div>

          {/* Lymphadenopathy */}
          <div className="col-md-12">
            <FormGroup className="mb-0">
              {/* <Label>{getTranslation(Lymphadenopathy,lang)}</Label>
              <Input
                type="textarea"
                rows="3"
                name="lymphadenopathy"
                value={PFAeditData?.lymphadenopathy}
                onChange={(e) =>
                  setPFAeditData({
                    ...PFAeditData,
                    lymphadenopathy: e.target.value,
                  })
                }
              /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(Lymphadenopathy,lang)} />}
  name="lymphadenopathy"
  value={PFAeditData?.lymphadenopathy}
  onChange={(e) =>
    setPFAeditData({
      ...PFAeditData,
      lymphadenopathy: e.target.value,
    })
  }
/>

            </FormGroup>
          </div>

          {/* Nutritional Status / नुट्रिशन स्तिथि */}
          <div className="col-md-6">
            <Label>{getTranslation("Nutritional Status / नुट्रिशन स्तिथि",lang)}</Label>
            <div className="radio radio-primary d-flex gap-3">
              {[getTranslation("Good/अच्छा",lang), getTranslation("Average/औसत",lang), getTranslation("Poor/गरीब",lang)].map((Nstatus) => (
                <div key={Nstatus}>
                  <Input
                    type="radio"
                    id={`nutritionalStatus-${Nstatus}`}
                    name="nutritional_status"
                    value={Nstatus}
                    checked={PFAeditData?.nutritional_status === Nstatus}
                    onChange={(e) =>
                      setPFAeditData({
                        ...PFAeditData,
                        nutritional_status: e.target.value,
                      })
                    }
                  />
                  <Label htmlFor={`nutritionalStatus-${Nstatus}`}>
                    {Nstatus}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Consent Section */}
          <div className="col-md-12 mt-4">
            <div className="checkbox ms-3">
            <Input
              id="checkbox1"
              type="checkbox"
              checked={PFAeditData?.consent === "Yes"}
              onChange={(e) =>
                setPFAeditData({
                  ...PFAeditData,
                  consent: e.target.checked ? "Yes" : "No",
                })
              }
            />
            <Label className="text-muted" for="checkbox1">
              {getTranslation(consent,lang)}
            </Label>
          </div>

            <Row>
              <Col md="4">
                <FormGroup>
                  <Label>{getTranslation(name,lang)}</Label>
                  <Input
                    type="text"
                    name="consent_name"
                    placeholder={getTranslation("Name/नाम",lang)}
                    value={PFAeditData?.consent_name}
                    onChange={(e) =>
                      setPFAeditData({
                        ...PFAeditData,
                        consent_name: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </Col>
              <Col md="4">
                <FormGroup>
                  <Label>{getTranslation(relationship,lang)}</Label>
                  <Input
                    type="text"
                    name="consent_relationship"
                    placeholder={getTranslation("Relationship/संबंध",lang)}
                    value={PFAeditData?.consent_relationship}
                    onChange={(e) =>
                      setPFAeditData({
                        ...PFAeditData,
                        consent_relationship: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </Col>
              {/* <Col md="4">
                <FormGroup>
                  <Label>{getTranslation(signature,lang)}</Label>
                  <Input
                    type="text"
                    name="consent_signature"
                    placeholder={getTranslation("Signature/हस्ताक्षर",lang)}
                    value={PFAeditData?.consent_signature}
                    onChange={(e) =>
                      setPFAeditData({
                        ...PFAeditData,
                        consent_signature: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </Col> */}
            </Row>
          </div>

          {/* Prepared By Section */}
          <div className="col-md-12 mt-3">
            <FormGroup>
              <Label>{getTranslation(prepared,lang)}</Label>
              <Input
                type="text"
                name="prepared_by"
                placeholder={getTranslation("Prepared By/द्वारा तैयार",lang)}
                value={PFAeditData?.prepared_by}
                onChange={(e) =>
                  setPFAeditData({
                    ...PFAeditData,
                    prepared_by: e.target.value,
                  })
                }
              />
            </FormGroup>
          </div>

          <div className="col-md-12 mt-4">
                <div className="checkbox ms-3">
                  <Input
                    id="checkbox3"
                    type="checkbox"
                    checked={PFAeditData?.verification === "Yes"}
                    onChange={(e) =>
                      setPFAeditData((prev) => ({
                        ...prev,
                        verification: e.target.checked ? "Yes" : "No",
                      }))
                    }
                  />
                  <Label className="text-muted" for="checkbox3">
                    {
                      getTranslation("Verification from parent side before PFA submitting/पीएफए ​​जमा करने से पहले माता-पिता की ओर से सत्यापन",lang)
                    }
                  </Label>
                </div>
              </div>

          {/* Submit Button */}
          <div className="d-flex gap-3 pt-4">
            <Button color="primary" type="submit" disabled={isLoading}>
              {isLoading ? (
                <span
                  className="spinner-border spinner-border-sm"
                  role="status"
                  aria-hidden="true"
                ></span>
              ) : (
                getTranslation("Update Patient First Assessment (PFA)/रोगी प्रथम मूल्यांकन (पीएफए) को अद्यतन करें",lang)
              )}
            </Button>
          </div>
        </Form>
      </div>
  )}
    



            
          </CommonModal>
        </div>
      </div>

      {/* View user details modal */}
      <UserDetailsModal
        isOpen={viewUserDetailsModal}
        userId={selectedViewUserId}
        toggler={() => setViewUserDetailsModal(false)}
      />
    </Fragment>

   
  );
}

export default PFA;
