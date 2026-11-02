import React, { Fragment, useState, useEffect, useRef, useCallback } from "react";
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
  InputGroup,
  Button,
  Badge,
} from "reactstrap";
import DatePicker from "react-datepicker";
import HeaderCard from "../Common/Component/HeaderCard";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import useCalculateAge from "../../CustomHook/useCalculateAge";
import CommonModal from "../UiKits/Modals/common/modal";
import html2pdf from "html2pdf.js";
import PatientCommonInfo from "../../CustomHook/PatientCommonInfo";
import { useBranch } from "../../contexts/BranchContext";
import { useLang } from "../../contexts/LangContext";
import { getTranslation } from "../../utils/translator";
import VoiceTextarea from "../VoiceTextarea/VoiceTextarea";
import { useReactToPrint } from "react-to-print";
import PatientViewHeader from "../Common/PatientViewHeader";
import TableExportButtons from "../Common/TableExportButtons";
import ModalLoading from "../Common/ModalLoading";
import UserDetailsModal from "../Common/UserDetailsModal";
import { SaveDraftButton, DraftNoticeBanner } from "../Common/SaveDraftButton";
import { loadDraft, clearDraft, safeDate } from "../../utils/formDraftManager";
import ModalActionButtons from "../Common/ModalActionButtons";
import { validateCompulsoryFields, showApiErrorAlert } from "../../utils/formValidationHelper";
import { fetchActiveDetoxSubstances } from "../../Services/detoxSubstanceService";
import { fetchAssessmentParameters } from "../../Services/detoxParameterService";
import {
  Plus,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  RefreshCw,
} from "react-feather";

// Standard Clinical Institute Withdrawal Assessment (CIWA-Ar) parameter fallbacks
const DEFAULT_CIWA_PARAMETERS = [
  {
    sub_id: 1,
    name: "nausea",
    display_name: "Nausea and Vomiting / मतली और उल्टी",
    description: "Nausea and vomiting assessment",
    scoring_bands: [
      { score_id: 1, min_score: 0, max_score: 0, description: "No nausea and no vomiting" },
      { score_id: 2, min_score: 1, max_score: 1, description: "Mild nausea with no vomiting" },
      { score_id: 3, min_score: 2, max_score: 3, description: "Intermittent nausea with dry heaves" },
      { score_id: 4, min_score: 4, max_score: 7, description: "Constant nausea, frequent dry heaves and vomiting" },
    ],
  },
  {
    sub_id: 2,
    name: "tremor",
    display_name: "Tremor / कंपकंपी",
    description: "Tremor with arms extended and fingers spread apart",
    scoring_bands: [
      { score_id: 5, min_score: 0, max_score: 0, description: "No tremor" },
      { score_id: 6, min_score: 1, max_score: 1, description: "Not visible, but can be felt fingertip to fingertip" },
      { score_id: 7, min_score: 2, max_score: 4, description: "Moderate, with patient's arms extended" },
      { score_id: 8, min_score: 5, max_score: 7, description: "Severe, even with arms not extended" },
    ],
  },
  {
    sub_id: 3,
    name: "paroxysmal_sweats",
    display_name: "Paroxysmal Sweats / पसीना आना",
    description: "Sweating and perspiration rate",
    scoring_bands: [
      { score_id: 9, min_score: 0, max_score: 0, description: "No sweat visible" },
      { score_id: 10, min_score: 1, max_score: 1, description: "Barely perceptible sweating, palms moist" },
      { score_id: 11, min_score: 2, max_score: 4, description: "Beads of sweat obvious on forehead" },
      { score_id: 12, min_score: 5, max_score: 7, description: "Drenching sweats" },
    ],
  },
  {
    sub_id: 4,
    name: "anxiety",
    display_name: "Anxiety / चिंता",
    description: "Subjective anxiety or nervousness",
    scoring_bands: [
      { score_id: 13, min_score: 0, max_score: 0, description: "No anxiety, at ease" },
      { score_id: 14, min_score: 1, max_score: 1, description: "Mildly anxious" },
      { score_id: 15, min_score: 2, max_score: 4, description: "Moderately anxious or guarded" },
      { score_id: 16, min_score: 5, max_score: 7, description: "Equivalent to acute panic state" },
    ],
  },
  {
    sub_id: 5,
    name: "agitation",
    display_name: "Agitation / उत्तेजना",
    description: "Restlessness and physical pacing",
    scoring_bands: [
      { score_id: 17, min_score: 0, max_score: 0, description: "Normal activity" },
      { score_id: 18, min_score: 1, max_score: 2, description: "Somewhat more than normal activity" },
      { score_id: 19, min_score: 3, max_score: 5, description: "Moderately fidgety and restless" },
      { score_id: 20, min_score: 6, max_score: 7, description: "Paces back and forth during most of the interview" },
    ],
  },
  {
    sub_id: 6,
    name: "headache",
    display_name: "Headache / सिरदर्द",
    description: "Headache, fullness in head",
    scoring_bands: [
      { score_id: 21, min_score: 0, max_score: 0, description: "Not present" },
      { score_id: 22, min_score: 1, max_score: 2, description: "Very mild to mild" },
      { score_id: 23, min_score: 3, max_score: 5, description: "Moderate to moderately severe" },
      { score_id: 24, min_score: 6, max_score: 7, description: "Extremely severe" },
    ],
  },
  {
    sub_id: 7,
    name: "orientation",
    display_name: "Orientation / अभिविन्यास",
    description: "Orientation and clouding of sensorium",
    scoring_bands: [
      { score_id: 25, min_score: 0, max_score: 0, description: "Oriented and knows date and place" },
      { score_id: 26, min_score: 1, max_score: 1, description: "Cannot do serial additions or is uncertain about date" },
      { score_id: 27, min_score: 2, max_score: 2, description: "Disoriented for date by no more than 2 calendar days" },
      { score_id: 28, min_score: 3, max_score: 4, description: "Disoriented for date by more than 2 calendar days or place" },
    ],
  },
];

const parseAssessmentResult = (raw) => {
  if (!raw) return [];
  let parsed = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.map((item) => {
    if (item.parameter || item.substance) {
      return {
        parameter: item.parameter || item.substance || item.name,
        score: item.score,
        description: item.description,
      };
    }
    const keys = Object.keys(item);
    if (keys.length > 0) {
      const param = keys[0];
      const inner = item[param];
      if (typeof inner === "object" && inner !== null) {
        const scoreKey = Object.keys(inner)[0];
        return {
          parameter: param,
          score: scoreKey,
          description: inner[scoreKey],
        };
      }
    }
    return { parameter: "Parameter", score: "—", description: "—" };
  });
};

const getCIWASeverity = (score) => {
  const num = Number(score) || 0;
  if (num < 10) {
    return {
      label: "Mild Withdrawal / हल्का विषहरण",
      color: "success",
      badgeColor: "#16a34a",
      badgeBg: "#f0fdf4",
      badgeBorder: "#bbf7d0",
      textColor: "#166534",
      bgClass: "alert-success",
      description: "Supportive care, minimal or no medication typically required.",
    };
  }
  if (num <= 19) {
    return {
      label: "Moderate Withdrawal / मध्यम विषहरण",
      color: "warning",
      badgeColor: "#d97706",
      badgeBg: "#fffbeb",
      badgeBorder: "#fde68a",
      textColor: "#92400e",
      bgClass: "alert-warning",
      description: "Medical detoxification protocol and monitoring recommended.",
    };
  }
  return {
    label: "Severe Withdrawal / गंभीर विषहरण",
    color: "danger",
    badgeColor: "#dc2626",
    badgeBg: "#fef2f2",
    badgeBorder: "#fecaca",
    textColor: "#991b1b",
    bgClass: "alert-danger",
    description: "High risk of delirium tremens/seizures; urgent clinical intervention.",
  };
};

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

const Detoxification = () => {
  const { lang } = useLang();
  const { selectedBranch } = useBranch();

  const [isLoading, setIsLoading] = useState(false);
  const [viewUserDetailsModal, setViewUserDetailsModal] = useState(false);
  const [selectedViewUserId, setSelectedViewUserId] = useState(null);

  // Form options from backend
  const [formSubstances, setFormSubstances] = useState(DEFAULT_CIWA_PARAMETERS);

  // Registered Patients (Table 1)
  const [registeredPatients, setRegisteredPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [patientSearchText, setPatientSearchText] = useState("");
  const [patientsLoading, setPatientsLoading] = useState(true);

  // Detoxification Assessments (Table 2)
  const [assessments, setAssessments] = useState([]);
  const [filteredAssessments, setFilteredAssessments] = useState([]);
  const [assessmentSearchText, setAssessmentSearchText] = useState("");
  const [assessmentsLoading, setAssessmentsLoading] = useState(true);

  // Create Form State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [draftTimestamp, setDraftTimestamp] = useState(null);
  const [currentDetoxUserId, setCurrentDetoxUserId] = useState(null);

  const initialDetoxForm = {
    sub_id: "",
    dateOfAssessment: new Date(),
    parameterScores: {},
    CIWA_rating: 0,
    remarks: "",
    next_follow_date: "",
  };

  const [formData, setFormData] = useState(initialDetoxForm);

  // Edit Assessment State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  // View Assessment State
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewDetoxData, setViewDetoxData] = useState(null);

  const pdfRef = useRef();
  const [pdfDownloading, setPdfDownloading] = useState(false);

  const dob = selectedUser?.dob;
  const patientCalAge = useCalculateAge(dob);

  const handleViewUserDetails = (userId) => {
    setSelectedViewUserId(userId);
    setViewUserDetailsModal(true);
  };

  // Fetch Form Options (Master Substances & CIWA scoring bands)
  const fetchFormOptions = useCallback(async () => {
    if (!selectedBranch) return;
    const token = localStorage.getItem("Authorization");

    try {
      // 1. Fetch active substances from master API
      let masterSubs = [];
      try {
        const subRes = await fetch(
          `https://gks-yjdc.onrender.com/api/detoxification-substances?branch_id=${selectedBranch}`,
          {
            headers: { "Content-Type": "application/json", Authorization: `${token}` },
          }
        );
        if (subRes.ok) {
          const subJson = await subRes.json();
          masterSubs = subJson.data || (Array.isArray(subJson) ? subJson : []);
        }
      } catch {
        // network fallback
      }

      // Check local cache if network empty
      if (!masterSubs || masterSubs.length === 0) {
        try {
          const cached = await fetchActiveDetoxSubstances(selectedBranch);
          if (cached && cached.length > 0) masterSubs = cached;
        } catch {
          // ignore
        }
      }

      // 2. Fetch form-options if available to get scoring bands mapping
      const bandsMap = {};
      try {
        const res = await fetch(
          `https://gks-yjdc.onrender.com/api/detoxification/form-options?branch_id=${selectedBranch}`,
          {
            headers: { "Content-Type": "application/json", Authorization: `${token}` },
          }
        );
        if (res.ok) {
          const json = await res.json();
          const list = json.data || json.substances || [];
          if (Array.isArray(list)) {
            list.forEach((item) => {
              const idKey = item.sub_id || item.id;
              if (idKey) bandsMap[String(idKey)] = item.scoring_bands || item.scoring;
              if (item.name) bandsMap[item.name.toLowerCase()] = item.scoring_bands || item.scoring;
            });
          }
        }
      } catch {
        // ignore
      }

      // Also incorporate custom configured assessment parameters
      try {
        const customParams = await fetchAssessmentParameters(selectedBranch);
        if (Array.isArray(customParams) && customParams.length > 0) {
          customParams.forEach((cp) => {
            if (cp.sub_id && cp.scores && cp.scores.length > 0) {
              const scoringBands = cp.scores.map((sc, scIdx) => ({
                score_id: scIdx + 1,
                min_score: Number(sc.score) || 0,
                max_score: Number(sc.score) || 0,
                description: sc.description,
              }));
              bandsMap[String(cp.sub_id)] = scoringBands;
              if (cp.substance_name) bandsMap[cp.substance_name.toLowerCase()] = scoringBands;
              bandsMap[cp.parameter_name.toLowerCase()] = scoringBands;
            }
          });
        }
      } catch {
        // ignore
      }

      // 3. Merge master substances with scoring bands
      if (masterSubs.length > 0) {
        const merged = masterSubs.map((sub, idx) => {
          const subId = sub.sub_id || sub.id;
          const matchedBands =
            bandsMap[String(subId)] ||
            bandsMap[(sub.name || "").toLowerCase()] ||
            sub.scoring_bands ||
            DEFAULT_CIWA_PARAMETERS[idx % DEFAULT_CIWA_PARAMETERS.length].scoring_bands;

          return {
            sub_id: subId,
            id: subId,
            name: sub.name,
            description: sub.description || sub.name,
            scoring_bands: matchedBands,
          };
        });
        setFormSubstances(merged);
        return;
      }
    } catch (err) {
      console.warn("Could not fetch dynamic detox form-options, using standard CIWA parameters:", err);
    }
  }, [selectedBranch]);

  // Fetch Registered Patients
  const fetchRegisteredPatients = useCallback(() => {
    if (!selectedBranch) return;
    setPatientsLoading(true);
    const token = localStorage.getItem("Authorization");

    // Fetch active detox users enriched with status & CIWA info (API 22), fallback to /api/users
    fetch(
      `https://gks-yjdc.onrender.com/api/detoxification/active-users-detoxification-details?branch_id=${selectedBranch}`,
      {
        headers: { "Content-Type": "application/json", Authorization: `${token}` },
      }
    )
      .then((res) => {
        if (!res.ok) {
          return fetch(`https://gks-yjdc.onrender.com/api/users?branch_id=${selectedBranch}`, {
            headers: { "Content-Type": "application/json", Authorization: `${token}` },
          });
        }
        return res;
      })
      .then((res) => (res.ok ? res.json() : Promise.reject("Fetch failed")))
      .then((res) => {
        const users = res.data || [];
        const formatted = users.map((user) => ({
          id: user.user_id || user.id,
          user_id: user.user_id || user.id,
          gks_id: user.gks_id || "N/A",
          recentDetoxId: user.recent_detox_id,
          name: user.name || user.patient_name,
          phone: user.phone,
          dischargeStatus: user.discharge_status,
          isReadmission: user.is_readmission,
          has_detoxification: user.has_detoxification,
          recent_status: user.recent_status,
          recent_ciwa_rating: user.recent_ciwa_rating,
        }));
        setRegisteredPatients(formatted);
        setFilteredPatients(formatted);
        setPatientsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching patients:", err);
        setPatientsLoading(false);
      });
  }, [selectedBranch]);

  // Fetch Detoxification Assessments
  const fetchAssessments = useCallback(() => {
    if (!selectedBranch) return;
    setAssessmentsLoading(true);
    const token = localStorage.getItem("Authorization");

    fetch(`https://gks-yjdc.onrender.com/api/detoxification/all-entries?branch_id=${selectedBranch}`, {
      headers: { "Content-Type": "application/json", Authorization: `${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject("Fetch failed")))
      .then((res) => {
        const list = res.data || [];
        setAssessments(list);
        setFilteredAssessments(list);
        setAssessmentsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching detox assessments:", err);
        setAssessmentsLoading(false);
      });
  }, [selectedBranch]);

  useEffect(() => {
    fetchFormOptions();
    fetchRegisteredPatients();
    fetchAssessments();
  }, [fetchFormOptions, fetchRegisteredPatients, fetchAssessments]);

  // Search filter for patients
  const handleSearchPatient = (e) => {
    const val = e.target.value.toLowerCase();
    setPatientSearchText(val);
    const filtered = registeredPatients.filter(
      (item) =>
        (item.name && item.name.toLowerCase().includes(val)) ||
        (item.gks_id && String(item.gks_id).toLowerCase().includes(val)) ||
        (item.phone && String(item.phone).includes(val))
    );
    setFilteredPatients(filtered);
  };

  // Search filter for assessments
  const handleSearchAssessment = (e) => {
    const val = e.target.value.toLowerCase();
    setAssessmentSearchText(val);
    const filtered = assessments.filter((item) => {
      const patientName = (item.name || item.patient_name || "").toLowerCase();
      const subName = (item.substance_name || item.sub_name || "").toLowerCase();
      const status = (item.status || "").toLowerCase();
      const gksId = String(item.gks_id || "").toLowerCase();
      const detoxId = String(item.detox_id || item.id || "").toLowerCase();
      return (
        patientName.includes(val) ||
        subName.includes(val) ||
        status.includes(val) ||
        gksId.includes(val) ||
        detoxId.includes(val)
      );
    });
    setFilteredAssessments(filtered);
  };

  // Parameter score updater: updates the score for a specific parameter and re-computes CIWA total
  const handleParameterScoreChange = (paramName, scoreNum, desc, isEditing = false) => {
    const updater = isEditing ? setEditData : setFormData;
    updater((prev) => {
      const currentScores = { ...(prev.parameterScores || {}) };
      currentScores[paramName] = { score: Number(scoreNum), description: desc };

      const newRating = Object.values(currentScores).reduce(
        (sum, item) => sum + (Number(item.score) || 0),
        0
      );

      return {
        ...prev,
        parameterScores: currentScores,
        CIWA_rating: newRating,
      };
    });
  };

  // Open Create Modal for Patient
  const handleOpenCreateForm = async (userId) => {
    fetchFormOptions();
    const targetId = userId || currentDetoxUserId;
    if (userId) setCurrentDetoxUserId(userId);

    const saved = loadDraft("detoxification", targetId);
    if (saved && saved.data) {
      setFormData(saved.data);
      setDraftTimestamp(saved.savedAt);
    } else {
      // Default to first substance if available
      const defaultSubId = formSubstances.length > 0 ? formSubstances[0].sub_id : "";
      setFormData({ ...initialDetoxForm, sub_id: defaultSubId });
      setDraftTimestamp(null);
    }

    setCreateModalOpen(true);

    if (targetId) {
      const token = localStorage.getItem("Authorization");
      try {
        const response = await fetch(
          `https://gks-yjdc.onrender.com/api/users/${targetId}?branch_id=${selectedBranch}`,
          { headers: { "Content-Type": "application/json", Authorization: `${token}` } }
        );
        const data = await response.json();
        if (response.ok && data.data && data.data[0]) {
          setSelectedUser(data.data[0]);
        }
      } catch (err) {
        console.error("Fetch patient details error:", err);
      }
    }
  };

  // Submit Create Assessment
  const handleSubmitAssessment = async (e) => {
    e.preventDefault();

    const compulsoryFieldDefinitions = [
      {
        label: getTranslation("Primary Substance Under Assessment / मुख्य विषहरण पदार्थ", lang),
        value: formData.sub_id,
      },
    ];

    if (!validateCompulsoryFields(compulsoryFieldDefinitions, lang)) {
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem("Authorization");
    const userId = selectedUser?.user_id || selectedUser?.id || currentDetoxUserId;

    // Build assessment_result array of objects
    const assessment_result = Object.entries(formData.parameterScores || {})
      .filter(([_, obj]) => obj && obj.score !== "" && obj.score !== undefined && obj.score !== null)
      .map(([param, obj]) => ({
        [param]: { [String(obj.score)]: obj.description || "" },
      }));

    const payload = {
      user_id: Number(userId),
      sub_id: Number(formData.sub_id),
      assessment_result,
      CIWA_rating: Number(formData.CIWA_rating) || 0,
    };

    if (formData.remarks && formData.remarks.trim()) {
      payload.remarks = formData.remarks.trim();
    }
    if (formData.next_follow_date) {
      payload.next_follow_date = formData.next_follow_date;
    }

    console.log("Submitting Detoxification Payload =>", payload);

    try {
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/detoxification/create-assessment?branch_id=${selectedBranch}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `${token}` },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setIsLoading(false);
        showApiErrorAlert(
          result,
          lang,
          getTranslation("Detoxification Assessment Failed / विषहरण मूल्यांकन विफल", lang)
        );
        return;
      }

      setIsLoading(false);
      clearDraft("detoxification", userId);
      setDraftTimestamp(null);
      setCreateModalOpen(false);

      Swal.fire({
        icon: "success",
        title: getTranslation("Detoxification Assessment Created / विषहरण मूल्यांकन सफलतापूर्वक दर्ज", lang),
        text: payload.next_follow_date
          ? getTranslation("Status updated to 'Next_follow_up' with scheduled return date.", lang)
          : getTranslation("Status marked as 'Completed'.", lang),
      });

      fetchAssessments();
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      Swal.fire({
        icon: "error",
        title: getTranslation("Unexpected Error / त्रुटि", lang),
        text: getTranslation("Failed to submit assessment.", lang),
      });
    }
  };

  // Open Edit Assessment Modal
  const handleOpenEditModal = async (detoxId) => {
    fetchFormOptions();
    setIsLoading(true);
    const token = localStorage.getItem("Authorization");
    try {
      const res = await fetch(
        `https://gks-yjdc.onrender.com/api/detoxification/assessment/${detoxId}?branch_id=${selectedBranch}`,
        { headers: { "Content-Type": "application/json", Authorization: `${token}` } }
      );
      const data = await res.json();
      if (!res.ok || !data.data) {
        throw new Error("Failed to fetch assessment");
      }
      const record = data.data;

      // Parse existing assessment_result into map
      const parsedItems = parseAssessmentResult(record.assessment_result);
      const scoresMap = {};
      parsedItems.forEach((p) => {
        scoresMap[p.parameter] = { score: Number(p.score) || 0, description: p.description || "" };
      });

      setEditData({
        detox_id: record.detox_id || record.id || detoxId,
        user_id: record.user_id,
        name: record.name || record.patient_name,
        sub_id: record.sub_id || "",
        CIWA_rating: Number(record.CIWA_rating) || 0,
        remarks: record.remarks || "",
        next_follow_date: record.next_follow_date
          ? new Date(record.next_follow_date).toISOString().split("T")[0]
          : "",
        parameterScores: scoresMap,
        follow_up_visit: record.follow_up_visit || record.visit_no || 1,
      });

      setEditModalOpen(true);
    } catch (err) {
      console.error(err);
      toast.error(getTranslation("Unable to load assessment details.", lang));
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Edit Assessment
  const handleUpdateAssessmentSubmit = async (e) => {
    e.preventDefault();
    if (!editData) return;

    setIsLoading(true);
    const token = localStorage.getItem("Authorization");

    const assessment_result = Object.entries(editData.parameterScores || {})
      .filter(([_, obj]) => obj && obj.score !== "" && obj.score !== undefined && obj.score !== null)
      .map(([param, obj]) => ({
        [param]: { [String(obj.score)]: obj.description || "" },
      }));

    const payload = {
      sub_id: Number(editData.sub_id),
      assessment_result,
      CIWA_rating: Number(editData.CIWA_rating) || 0,
    };

    if (editData.remarks && editData.remarks.trim()) {
      payload.remarks = editData.remarks.trim();
    }
    if (editData.next_follow_date) {
      payload.next_follow_date = editData.next_follow_date;
    }

    try {
      const res = await fetch(
        `https://gks-yjdc.onrender.com/api/detoxification/update-assessment/${editData.detox_id}?branch_id=${selectedBranch}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `${token}` },
          body: JSON.stringify(payload),
        }
      );

      const result = await res.json().catch(() => null);

      if (!res.ok) {
        setIsLoading(false);
        showApiErrorAlert(
          result,
          lang,
          getTranslation("Detoxification Update Failed / विषहरण अद्यतन विफल", lang)
        );
        return;
      }

      setIsLoading(false);
      setEditModalOpen(false);

      Swal.fire({
        icon: "success",
        title: getTranslation("Assessment Updated Successfully / मूल्यांकन अद्यतन संपन्न", lang),
      });

      fetchAssessments();
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      toast.error("Failed to update assessment");
    }
  };

  // View Assessment Details Modal
  const handleOpenViewModal = async (detoxId) => {
    setIsLoading(true);
    const token = localStorage.getItem("Authorization");
    try {
      const res = await fetch(
        `https://gks-yjdc.onrender.com/api/detoxification/assessment/${detoxId}?branch_id=${selectedBranch}`,
        { headers: { "Content-Type": "application/json", Authorization: `${token}` } }
      );
      const data = await res.json();
      if (!res.ok || !data.data) {
        throw new Error("Failed to fetch assessment");
      }
      setViewDetoxData(data.data);
      setViewModalOpen(true);
    } catch (err) {
      console.error(err);
      toast.error(getTranslation("Unable to load assessment details.", lang));
    } finally {
      setIsLoading(false);
    }
  };

  // Soft Delete Assessment
  const handleDeleteAssessment = async (detoxId, patientName) => {
    const confirm = await Swal.fire({
      title: getTranslation("Delete Detoxification Assessment? / विषहरण मूल्यांकन हटाएं?", lang),
      text: `${getTranslation("Are you sure you want to delete the assessment for", lang)} ${patientName || "this patient"}?`,
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
      const res = await fetch(
        `https://gks-yjdc.onrender.com/api/detoxification/delete-assessment/${detoxId}?branch_id=${selectedBranch}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json", Authorization: `${token}` },
        }
      );
      if (!res.ok) {
        throw new Error("Delete failed");
      }
      toast.success(getTranslation("Assessment deleted successfully / मूल्यांकन सफलतापूर्वक हटा दिया गया", lang));
      fetchAssessments();
    } catch (err) {
      console.error(err);
      toast.error(getTranslation("Failed to delete assessment.", lang));
    }
  };

  // Print PDF handler
  const handlePrint = useReactToPrint({
    content: () => pdfRef.current,
    pageStyle: `@page { size: A4; margin: 12mm; } @media print { body { margin: 0; } }`,
  });

  const handleDownloadPDF = () => {
    const element = pdfRef.current;
    if (!element) return;
    setPdfDownloading(true);

    const patientName = viewDetoxData?.name || viewDetoxData?.patient_name || "Patient";
    const safeName = String(patientName).trim().replace(/\s+/g, "_");
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Detox_Assessment_${safeName}_#${viewDetoxData?.detox_id || "report"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        toast.success(getTranslation("Download complete! / डाउनलोड पूर्ण!", lang));
        setPdfDownloading(false);
      })
      .catch(() => setPdfDownloading(false));
  };

  // Columns for Registered Patients Table
  const tableColumnsPatients = [
    {
      name: getTranslation("GKS ID / आईडी", lang),
      selector: (row) => row.gks_id,
      sortable: true,
      center: true,
      minWidth: "120px",
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
      minWidth: "180px",
      cell: (row) => (
        <span className="fw-bold text-dark" style={{ fontSize: "13.5px" }}>
          {row.name || "—"}
        </span>
      ),
    },
    {
      name: getTranslation("Phone / फ़ोन", lang),
      selector: (row) => row.phone || "—",
      sortable: true,
      center: true,
      minWidth: "140px",
      cell: (row) => (
        <span className="text-muted fw-semibold" style={{ fontSize: "13px" }}>
          {row.phone || "—"}
        </span>
      ),
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
            onClick={() => handleViewUserDetails(row.id)}
            title={getTranslation("View Patient / देखना", lang)}
          >
            <Eye size={16} />
          </button>

          <Button
            color="primary"
            size="sm"
            className="py-1 px-2.5 d-inline-flex align-items-center gap-1 shadow-sm"
            style={{ borderRadius: "6px", fontSize: "12.5px" }}
            onClick={() => handleOpenCreateForm(row.id)}
            title={getTranslation("Create Detox Assessment / विषहरण मूल्यांकन बनाएँ", lang)}
          >
            <Plus size={14} />
            <span>{getTranslation("Assess Detox", lang)}</span>
          </Button>
        </div>
      ),
    },
  ];

  // Columns for Detoxification Assessments Table
  const tableColumnsAssessments = [
    {
      name: getTranslation("Detox ID / आईडी", lang),
      selector: (row) => row.detox_id || row.id,
      sortable: true,
      center: true,
      minWidth: "115px",
      cell: (row) => (
        <span
          className="badge bg-light text-dark border px-2 py-1.5 fw-bold"
          style={{ fontSize: "12.5px", borderColor: "#cbd5e1" }}
        >
          #{row.detox_id || row.id}
        </span>
      ),
    },
    {
      name: getTranslation("Patient Name / रोगी का नाम", lang),
      selector: (row) => row.name || row.patient_name,
      sortable: true,
      minWidth: "180px",
      cell: (row) => (
        <div className="py-1">
          <div className="fw-bold text-dark" style={{ fontSize: "13.5px" }}>
            {row.name || row.patient_name || "—"}
          </div>
          <small className="text-muted fw-semibold">
            {row.custom_code || row.gks_id || (row.phone ? `Ph: ${row.phone}` : "")}
          </small>
        </div>
      ),
    },
    {
      name: getTranslation("Primary Substance / मुख्य पदार्थ", lang),
      selector: (row) => row.substance_name || row.sub_name || "—",
      sortable: true,
      center: true,
      minWidth: "170px",
      cell: (row) => (
        <Badge
          color="light"
          className="text-dark border text-capitalize px-2.5 py-1.5 fw-medium text-truncate"
          style={{ fontSize: "12.5px", maxWidth: "160px" }}
        >
          🌿 {row.substance_name || row.sub_name || "Detoxification"}
        </Badge>
      ),
    },
    {
      name: getTranslation("CIWA Rating / सीआईडब्ल्यूए स्कोर", lang),
      selector: (row) => row.CIWA_rating || 0,
      sortable: true,
      center: true,
      minWidth: "220px",
      cell: (row) => {
        const rating = Number(row.CIWA_rating) || 0;
        const sev = getCIWASeverity(rating);
        const sevText = sev.label.split("/")[0].trim();
        return (
          <div
            className="d-inline-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill"
            style={{
              backgroundColor: sev.badgeBg,
              border: `1px solid ${sev.badgeBorder}`,
              maxWidth: "100%",
            }}
          >
            <span
              className="badge rounded-pill fw-bold"
              style={{
                backgroundColor: sev.badgeColor,
                color: "#ffffff",
                fontSize: "12px",
                padding: "3px 8px",
              }}
            >
              {rating}
            </span>
            <span
              className="fw-semibold text-truncate"
              style={{
                color: sev.textColor,
                fontSize: "12px",
                paddingRight: "2px",
              }}
              title={sevText}
            >
              {sevText}
            </span>
          </div>
        );
      },
    },
    {
      name: getTranslation("Visit # / विज़िट", lang),
      selector: (row) => row.follow_up_visit || row.visit_no || 1,
      sortable: true,
      center: true,
      minWidth: "100px",
      cell: (row) => (
        <span
          className="badge bg-light text-dark border px-2 py-1.5 fw-semibold"
          style={{ fontSize: "12px", borderColor: "#cbd5e1" }}
        >
          #{row.follow_up_visit || row.visit_no || 1}
        </span>
      ),
    },
    {
      name: getTranslation("Next Follow-up / अगली तिथि", lang),
      selector: (row) => row.next_follow_date || "—",
      sortable: true,
      center: true,
      minWidth: "140px",
      cell: (row) => (
        <span className="fw-medium text-secondary" style={{ fontSize: "13px" }}>
          {row.next_follow_date ? new Date(row.next_follow_date).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      name: getTranslation("Status / स्थिति", lang),
      selector: (row) => row.status || (row.next_follow_date ? "Next_follow_up" : "Completed"),
      sortable: true,
      center: true,
      minWidth: "155px",
      cell: (row) => {
        const s = row.status || (row.next_follow_date ? "Next_follow_up" : "Completed");
        if (s === "Next_follow_up") {
          return (
            <span
              className="badge px-2.5 py-1.5 fw-semibold"
              style={{
                backgroundColor: "#fef3c7",
                color: "#92400e",
                border: "1px solid #fde68a",
                fontSize: "12px",
              }}
            >
              🗓 Next Follow-Up
            </span>
          );
        }
        return (
          <span
            className="badge px-2.5 py-1.5 fw-semibold"
            style={{
              backgroundColor: "#dcfce7",
              color: "#166534",
              border: "1px solid #bbf7d0",
              fontSize: "12px",
            }}
          >
            ✓ Completed
          </span>
        );
      },
    },
    {
      name: getTranslation("Action / कार्य", lang),
      center: true,
      minWidth: "140px",
      cell: (row) => {
        const detoxId = row.detox_id || row.id;
        const patientName = row.name || row.patient_name;
        return (
          <div className="d-flex align-items-center justify-content-center gap-2">
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
              title={getTranslation("View Assessment / देखना", lang)}
              onClick={() => handleOpenViewModal(detoxId)}
            >
              <Eye size={16} />
            </button>
            <button
              type="button"
              className="btn btn-action-icon btn-action-edit"
              style={{
                width: "32px",
                height: "32px",
                minWidth: "32px",
                padding: "0",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "7px",
                backgroundColor: "#ecfdf5",
                border: "1px solid #a7f3d0",
                color: "#059669",
                cursor: "pointer",
              }}
              title={getTranslation("Edit Assessment / संपादित करें", lang)}
              onClick={() => handleOpenEditModal(detoxId)}
            >
              <Edit2 size={16} />
            </button>
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
              title={getTranslation("Delete Assessment / हटाएं", lang)}
              onClick={() => handleDeleteAssessment(detoxId, patientName)}
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      },
    },
  ];

  // Render the Parameter Scoring Matrix for Create or Edit
  const renderScoringMatrix = (isEditing = false) => {
    const currentData = isEditing ? editData : formData;
    const scores = currentData?.parameterScores || {};

    return (
      <div className="border rounded-3 p-3 bg-light mb-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3 pb-2 border-bottom">
          <div>
            <h6 className="fw-bold mb-0 text-dark">
              📊 {getTranslation("CIWA-Ar Parameter Scoring Matrix / सीआईडब्ल्यूए स्कोरिंग मैट्रिक्स", lang)}
            </h6>
            <small className="text-muted">
              {getTranslation("Select clinical findings for each parameter to compute the withdrawal severity score.", lang)}
            </small>
          </div>
        </div>

        <Row className="g-3">
          {formSubstances.map((param) => {
            const paramKey = param.name;
            const currentScoreObj = scores[paramKey] || { score: "", description: "" };

            return (
              <Col md="6" key={param.sub_id || param.name}>
                <Card className="border shadow-none h-100 bg-white">
                  <CardBody className="p-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <div className="fw-bold text-dark text-capitalize">
                          {param.display_name || param.name}
                        </div>
                        <small className="text-muted">{param.description}</small>
                      </div>
                      {currentScoreObj.score !== "" && (
                        <Badge color="primary" pill>
                          Score: {currentScoreObj.score}
                        </Badge>
                      )}
                    </div>

                    <FormGroup className="mb-0">
                      <Input
                        type="select"
                        bsSize="sm"
                        value={
                          currentScoreObj.score !== "" && currentScoreObj.description
                            ? `${currentScoreObj.score}|||${currentScoreObj.description}`
                            : ""
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) {
                            handleParameterScoreChange(paramKey, 0, "", isEditing);
                            return;
                          }
                          const [sNum, sDesc] = val.split("|||");
                          handleParameterScoreChange(paramKey, sNum, sDesc, isEditing);
                        }}
                      >
                        <option value="">{getTranslation("-- Select score / स्कोर चुनें --", lang)}</option>
                        {(param.scoring_bands || []).map((band) => {
                          const min = band.min_score;
                          const max = band.max_score;
                          const scoreOptions = [];
                          for (let s = min; s <= max; s++) {
                            scoreOptions.push(s);
                          }
                          return scoreOptions.map((s) => (
                            <option key={`${band.score_id}_${s}`} value={`${s}|||${band.description}`}>
                              Score {s}: {band.description}
                            </option>
                          ));
                        })}
                      </Input>
                    </FormGroup>
                  </CardBody>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>
    );
  };

  // Total Score & CIWA Severity Summary Card (placed after Clinical Remarks at bottom)
  const renderTotalScoreCard = (isEditing = false) => {
    const currentData = isEditing ? editData : formData;
    const rating = Number(currentData?.CIWA_rating) || 0;
    const sev = getCIWASeverity(rating);

    return (
      <div
        className="d-flex justify-content-between align-items-center flex-wrap gap-2 p-3 rounded-3 border mt-3 mb-3"
        style={{
          backgroundColor: "#f8fafc",
          borderLeft: `5px solid ${sev.badgeColor || "#198754"}`,
        }}
      >
        <div className="d-flex align-items-center gap-2">
          <span
            className="fw-bold"
            style={{ color: "#1e293b", fontSize: "15px" }}
          >
            {getTranslation("Total Score / कुल अंक:", lang)}
          </span>
          <Badge
            color={sev.color}
            className="px-3 py-2 fs-6 fw-bold"
            style={{ fontSize: "14px", letterSpacing: "0.2px" }}
          >
            {rating} &nbsp;—&nbsp; {sev.label.split("/")[0].trim()}
          </Badge>
        </div>
        <div className="small fw-semibold" style={{ color: "#475569" }}>
          {sev.description}
        </div>
      </div>
    );
  };

  return (
    <Fragment>
      {/* Top Header */}
      <Container fluid={true} className="pt-3 pb-2">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pb-2 border-bottom">
          <div>
            <h4 className="mb-0 text-primary fw-bold">
              🌿 {getTranslation("Detoxification Module / विषहरण मॉड्यूल", lang)}
            </h4>
            <small className="text-muted">
              {getTranslation("CIWA-Ar Clinical Assessment, Withdrawal Scoring, and Patient Chained Visits", lang)}
            </small>
          </div>
          <Button
            color="outline-primary"
            size="sm"
            onClick={() => {
              fetchFormOptions();
              fetchAssessments();
              fetchRegisteredPatients();
            }}
          >
            <RefreshCw size={14} className="me-1" />
            {getTranslation("Refresh Data", lang)}
          </Button>
        </div>
      </Container>

      {/* Table 1: Registered Patient List (To Create Assessment) */}
      <Container fluid={true} className="datatables mt-2">
        <Row>
          <Col sm="12">
            <Card>
              <CardBody>
                <div className="d-flex pb-2 justify-content-between align-items-center flex-wrap gap-2">
                  <HeaderCard
                    title={getTranslation("Registered Patient List / पंजीकृत रोगी सूची", lang)}
                    className="p-0"
                  />
                </div>
                <div className="row pb-3 align-items-center">
                  <div className="col-md-5 col-12 mb-2 mb-md-0">
                    <InputGroup>
                      <Input
                        className="form-control"
                        type="text"
                        placeholder={getTranslation("Search patient by name, ID, phone... / खोजें...", lang)}
                        value={patientSearchText}
                        onChange={handleSearchPatient}
                      />
                      <span className="input-group-text">
                        <i className="fa fa-search"></i>
                      </span>
                    </InputGroup>
                  </div>
                  <div className="col-md-7 col-12 d-flex justify-content-md-end justify-content-start">
                    <TableExportButtons
                      data={filteredPatients}
                      columns={tableColumnsPatients}
                      filename="Detoxification_Patient_Registration_List"
                      title={getTranslation("Detoxification Patient Registration List", lang)}
                    />
                  </div>
                </div>

                {patientsLoading ? (
                  <div className="loading-text">
                    {getTranslation("Data is fetching from server. Please wait...", lang)}
                  </div>
                ) : (
                  <DataTable
                    data={filteredPatients}
                    columns={tableColumnsPatients}
                    striped
                    center
                    highlightOnHover
                    pagination
                    persistTableHead
                    responsive
                    customStyles={customTableStyles}
                  />
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Table 2: All Detoxification Patient Assessments List */}
      <Container fluid={true} className="datatables mt-2">
        <Row>
          <Col sm="12">
            <Card>
              <CardBody>
                <div className="d-flex pb-2 justify-content-between align-items-center flex-wrap gap-2">
                  <HeaderCard
                    title={getTranslation("All Detoxification Assessments / सभी विषहरण मूल्यांकन", lang)}
                    className="p-0"
                  />
                </div>
                <div className="row pb-3 align-items-center">
                  <div className="col-md-5 col-12 mb-2 mb-md-0">
                    <InputGroup>
                      <Input
                        className="form-control"
                        type="text"
                        placeholder={getTranslation("Search assessments by patient, substance, ID, status... / खोजें...", lang)}
                        value={assessmentSearchText}
                        onChange={handleSearchAssessment}
                      />
                      <span className="input-group-text">
                        <i className="fa fa-search"></i>
                      </span>
                    </InputGroup>
                  </div>
                  <div className="col-md-7 col-12 d-flex justify-content-md-end justify-content-start">
                    <TableExportButtons
                      data={filteredAssessments}
                      columns={tableColumnsAssessments}
                      filename="All_Detoxification_Assessments"
                      title={getTranslation("All Detoxification Assessments", lang)}
                    />
                  </div>
                </div>

                {assessmentsLoading ? (
                  <div className="loading-text">
                    {getTranslation("Data is fetching from server. Please wait...", lang)}
                  </div>
                ) : (
                  <DataTable
                    data={filteredAssessments}
                    columns={tableColumnsAssessments}
                    striped
                    center
                    highlightOnHover
                    pagination
                    persistTableHead
                    responsive
                    customStyles={customTableStyles}
                  />
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Create Detoxification Assessment Modal */}
      <CommonModal
        isOpen={createModalOpen}
        title={getTranslation("Create Detoxification Assessment (CIWA-Ar) / विषहरण मूल्यांकन प्रपत्र", lang)}
        toggler={() => setCreateModalOpen(false)}
        maxWidth="1200px"
      >
        <div className="p-3">
          <DraftNoticeBanner
            draftTimestamp={draftTimestamp}
            formKey="detoxification"
            targetId={selectedUser?.user_id || selectedUser?.id || currentDetoxUserId}
            onDiscard={() => {
              setFormData(initialDetoxForm);
              setDraftTimestamp(null);
            }}
          />

          <PatientCommonInfo
            selectedUser={selectedUser}
            labels={{
              name: getTranslation("Patient name/प्रयासक का नाम :", lang),
              sex: getTranslation("Gender/प्रयासक का लिंग :", lang),
              age: getTranslation("Age/प्रयासक का उम्र :", lang),
              date_of_admission: getTranslation("Date of Admission/प्रवेश की तिथि :", lang),
              ageValue: patientCalAge,
            }}
          />

          <Form className="mt-3" noValidate onSubmit={handleSubmitAssessment}>
            {/* Primary Substance Selection & Assessment Date */}
            <Row className="mb-3 g-3">
              <Col md="6">
                <FormGroup>
                  <Label className="fw-semibold">
                    {getTranslation("Primary Substance Under Assessment / मुख्य विषहरण पदार्थ", lang)}{" "}
                    <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="select"
                    value={formData.sub_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sub_id: e.target.value }))}
                  >
                    <option value="">{getTranslation("-- Select Primary Substance --", lang)}</option>
                    {formSubstances.map((s) => (
                      <option key={s.sub_id || s.id} value={s.sub_id || s.id}>
                        {s.name} {s.description ? `(${s.description})` : ""}
                      </option>
                    ))}
                  </Input>
                </FormGroup>
              </Col>

              <Col md="6">
                <FormGroup>
                  <Label className="fw-semibold">
                    {getTranslation("Date of Assessment / मूल्यांकन की तिथि", lang)}
                  </Label>
                  <div>
                    <DatePicker
                      className="form-control"
                      selected={safeDate(formData.dateOfAssessment)}
                      onChange={(date) => setFormData((prev) => ({ ...prev, dateOfAssessment: date }))}
                    />
                  </div>
                </FormGroup>
              </Col>
            </Row>

            {/* CIWA Scoring Matrix */}
            {renderScoringMatrix(false)}

            {/* Next Follow-up Date & Remarks */}
            <Row className="mb-3 g-3">
              <Col md="6">
                <FormGroup>
                  <Label className="fw-semibold">
                    {getTranslation("Next Follow-up Date (Optional) / अगली अनुवर्ती तिथि", lang)}
                  </Label>
                  <Input
                    type="date"
                    value={formData.next_follow_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, next_follow_date: e.target.value }))}
                  />
                  <small className="text-muted">
                    {formData.next_follow_date
                      ? getTranslation("Setting follow-up marks status as 'Next_follow_up' and chains the next visit.", lang)
                      : getTranslation("Leaving empty will mark this detoxification assessment as 'Completed'.", lang)}
                  </small>
                </FormGroup>
              </Col>

              <Col md="6">
                <FormGroup>
                  <Label className="fw-semibold">
                    {getTranslation("Clinical Remarks / टिप्पणियाँ", lang)}
                  </Label>
                  <VoiceTextarea
                    id="remarks"
                    name="remarks"
                    className="form-control"
                    placeholder={getTranslation("Enter treatment observations, fluid therapy, medications...", lang)}
                    value={formData.remarks}
                    onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
                  />
                </FormGroup>
              </Col>
            </Row>

            {/* Total Score Display (after Clinical Remarks at bottom) */}
            {renderTotalScoreCard(false)}

            {/* Submit & Draft Buttons */}
            <div className="d-flex align-items-center gap-3 mt-4 flex-wrap">
              <SaveDraftButton
                formKey="detoxification"
                targetId={selectedUser?.user_id || selectedUser?.id || currentDetoxUserId}
                formData={formData}
                onDraftSaved={() => setDraftTimestamp(Date.now())}
                style={{ height: "38px", padding: "6px 16px" }}
              />

              <Button color="primary" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <span className="spinner-border spinner-border-sm me-1"></span>
                ) : (
                  <CheckCircle size={16} className="me-1" />
                )}
                {getTranslation("Submit Detoxification Assessment / मूल्यांकन जमा करें", lang)}
              </Button>
            </div>
          </Form>
        </div>
      </CommonModal>

      {/* Edit Detoxification Assessment Modal */}
      <CommonModal
        isOpen={editModalOpen}
        title={getTranslation("Update Detoxification Assessment / विषहरण मूल्यांकन अपडेट करें", lang)}
        toggler={() => setEditModalOpen(false)}
        maxWidth="1200px"
      >
        <div className="p-3">
          {editData && (
            <Form noValidate onSubmit={handleUpdateAssessmentSubmit}>
              <div className="alert alert-light border py-2 px-3 mb-3 d-flex justify-content-between align-items-center">
                <div>
                  <strong>{getTranslation("Patient:", lang)}</strong> {editData.name || "Patient"} &nbsp;|&nbsp;
                  <strong>{getTranslation("Detox ID:", lang)}</strong> #{editData.detox_id} &nbsp;|&nbsp;
                  <strong>{getTranslation("Visit #:", lang)}</strong> #{editData.follow_up_visit}
                </div>
                <Badge
                  color={getCIWASeverity(editData.CIWA_rating).color}
                  className="px-2 py-1"
                >
                  CIWA: {editData.CIWA_rating}
                </Badge>
              </div>

              <Row className="mb-3 g-3">
                <Col md="6">
                  <FormGroup>
                    <Label className="fw-semibold">
                      {getTranslation("Primary Substance / मुख्य पदार्थ", lang)}
                    </Label>
                    <Input
                      type="select"
                      value={editData.sub_id}
                      onChange={(e) => setEditData((prev) => ({ ...prev, sub_id: e.target.value }))}
                    >
                      <option value="">{getTranslation("-- Select Substance --", lang)}</option>
                      {formSubstances.map((s) => (
                        <option key={s.sub_id || s.id} value={s.sub_id || s.id}>
                          {s.name} {s.description ? `(${s.description})` : ""}
                        </option>
                      ))}
                    </Input>
                  </FormGroup>
                </Col>

                <Col md="6">
                  <FormGroup>
                    <Label className="fw-semibold">
                      {getTranslation("Next Follow-up Date / अगली अनुवर्ती तिथि", lang)}
                    </Label>
                    <Input
                      type="date"
                      value={editData.next_follow_date}
                      onChange={(e) => setEditData((prev) => ({ ...prev, next_follow_date: e.target.value }))}
                    />
                  </FormGroup>
                </Col>
              </Row>

              {/* CIWA Scoring Matrix (Edit) */}
              {renderScoringMatrix(true)}

              <FormGroup className="mb-3">
                <Label className="fw-semibold">
                  {getTranslation("Clinical Remarks / टिप्पणियाँ", lang)}
                </Label>
                <VoiceTextarea
                  id="edit_remarks"
                  name="edit_remarks"
                  className="form-control"
                  value={editData.remarks}
                  onChange={(e) => setEditData((prev) => ({ ...prev, remarks: e.target.value }))}
                />
              </FormGroup>

              {/* Total Score Display (after Clinical Remarks at bottom) */}
              {renderTotalScoreCard(true)}

              <div className="d-flex justify-content-end gap-2 pt-2">
                <Button color="secondary" type="button" onClick={() => setEditModalOpen(false)}>
                  {getTranslation("Cancel / रद्द करें", lang)}
                </Button>
                <Button color="success" type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <span className="spinner-border spinner-border-sm me-1"></span>
                  ) : (
                    <CheckCircle size={16} className="me-1" />
                  )}
                  {getTranslation("Update Assessment / सहेजें", lang)}
                </Button>
              </div>
            </Form>
          )}
        </div>
      </CommonModal>

      {/* View Detoxification Assessment Details Modal */}
      <CommonModal
        isOpen={viewModalOpen}
        title={getTranslation("View Detoxification Assessment / विषहरण मूल्यांकन देखें", lang)}
        toggler={() => setViewModalOpen(false)}
        maxWidth="1000px"
      >
        <div className="p-3 p-md-4 print-area" ref={pdfRef} style={{ background: "#f8fafc" }}>
          {isLoading ? (
            <ModalLoading message={getTranslation("Loading assessment details...", lang)} />
          ) : viewDetoxData ? (
            <div>
              <PatientViewHeader data={viewDetoxData} />

              {/* Assessment Summary Card */}
              <div className="card shadow-sm border-0 mb-4 rounded-3 overflow-hidden">
                <div
                  className="card-header bg-white py-3 px-4 border-bottom d-flex align-items-center justify-content-between"
                  style={{ borderLeft: "5px solid #24695c" }}
                >
                  <h6 className="fw-bold text-dark mb-0">
                    🌿 {getTranslation("Detoxification & CIWA-Ar Evaluation Summary", lang)}
                  </h6>
                  <Badge color="light" className="text-dark border px-3 py-1">
                    Visit #{viewDetoxData.follow_up_visit || viewDetoxData.visit_no || 1}
                  </Badge>
                </div>
                <div className="card-body p-3 p-md-4">
                  <Row className="g-3">
                    <Col sm="6" lg="3">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <small className="text-muted text-uppercase fw-semibold">{getTranslation("Primary Substance", lang)}</small>
                        <div className="fw-bold text-dark mt-1 text-capitalize">
                          {viewDetoxData.substance_name || viewDetoxData.sub_name || "—"}
                        </div>
                      </div>
                    </Col>
                    <Col sm="6" lg="3">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <small className="text-muted text-uppercase fw-semibold">{getTranslation("CIWA-Ar Total Rating", lang)}</small>
                        <div className="mt-1">
                          <Badge
                            color={getCIWASeverity(viewDetoxData.CIWA_rating).color}
                            className="fs-6 px-2 py-1"
                          >
                            Score: {viewDetoxData.CIWA_rating || 0}
                          </Badge>
                        </div>
                      </div>
                    </Col>
                    <Col sm="6" lg="3">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <small className="text-muted text-uppercase fw-semibold">{getTranslation("Status", lang)}</small>
                        <div className="mt-1">
                          <Badge
                            color={viewDetoxData.status === "Next_follow_up" ? "secondary" : "success"}
                            className="p-1 px-2"
                          >
                            {viewDetoxData.status || (viewDetoxData.next_follow_date ? "Next_follow_up" : "Completed")}
                          </Badge>
                        </div>
                      </div>
                    </Col>
                    <Col sm="6" lg="3">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <small className="text-muted text-uppercase fw-semibold">{getTranslation("Next Follow-up", lang)}</small>
                        <div className="fw-bold text-dark mt-1">
                          {viewDetoxData.next_follow_date
                            ? new Date(viewDetoxData.next_follow_date).toLocaleDateString()
                            : "—"}
                        </div>
                      </div>
                    </Col>
                  </Row>

                  {/* Severity Banner */}
                  <div className={`alert ${getCIWASeverity(viewDetoxData.CIWA_rating).bgClass} mt-3 mb-0 py-2 px-3`}>
                    <strong>{getCIWASeverity(viewDetoxData.CIWA_rating).label}</strong> &nbsp;—&nbsp;
                    <span>{getCIWASeverity(viewDetoxData.CIWA_rating).description}</span>
                  </div>
                </div>
              </div>

              {/* Detailed Parameter Scoring Breakdown */}
              <div className="card shadow-sm border-0 mb-4 rounded-3 overflow-hidden">
                <div
                  className="card-header bg-white py-3 px-4 border-bottom"
                  style={{ borderLeft: "5px solid #d56337" }}
                >
                  <h6 className="fw-bold text-dark mb-0">
                    📋 {getTranslation("Parameter Scoring Breakdown / पैरामीटर स्कोरिंग विवरण", lang)}
                  </h6>
                </div>
                <div className="card-body p-0">
                  <Table responsive striped className="mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th style={{ width: "30%" }}>{getTranslation("Parameter / लक्षण", lang)}</th>
                        <th style={{ width: "15%" }} className="text-center">{getTranslation("Score / अंक", lang)}</th>
                        <th>{getTranslation("Clinical Description / विवरण", lang)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parseAssessmentResult(viewDetoxData.assessment_result).length > 0 ? (
                        parseAssessmentResult(viewDetoxData.assessment_result).map((item, idx) => (
                          <tr key={idx}>
                            <td className="fw-semibold text-capitalize">{item.parameter}</td>
                            <td className="text-center">
                              <Badge color="primary" pill>
                                {item.score}
                              </Badge>
                            </td>
                            <td>{item.description || "—"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="text-center text-muted py-3">
                            {getTranslation("No individual parameter breakdown recorded.", lang)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </div>

              {/* Remarks Card */}
              {viewDetoxData.remarks && (
                <div className="card shadow-sm border-0 mb-3 rounded-3 overflow-hidden">
                  <div
                    className="card-header bg-white py-2 px-3 border-bottom"
                    style={{ borderLeft: "5px solid #6c757d" }}
                  >
                    <h6 className="fw-bold text-dark mb-0">{getTranslation("Clinical Remarks / टिप्पणियाँ", lang)}</h6>
                  </div>
                  <div className="card-body p-3">
                    <p className="mb-0 text-dark">{viewDetoxData.remarks}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-5">
              <p className="text-muted">{getTranslation("No assessment data available.", lang)}</p>
            </div>
          )}
        </div>

        <ModalActionButtons
          onClose={() => setViewModalOpen(false)}
          onPrint={handlePrint}
          onDownload={handleDownloadPDF}
          isDownloading={pdfDownloading}
          downloadText={getTranslation("Download PDF / डाउनलोड करें", lang)}
        />
      </CommonModal>

      {/* User Details Modal */}
      <UserDetailsModal
        isOpen={viewUserDetailsModal}
        userId={selectedViewUserId}
        toggler={() => setViewUserDetailsModal(false)}
      />
    </Fragment>
  );
};

export default Detoxification;
