import React, { useState, useEffect, Fragment, useRef } from "react";
import {
  Input,
  Col,
  Button,
  Row,
  Container,
  Card,
  CardBody,
  InputGroup,
  Table,
  Badge,
} from "reactstrap";

import DatePicker from "react-datepicker";
import CommonModal from "../UiKits/Modals/common/modal";
import HeaderCard from "../Common/Component/HeaderCard";
import { ActionButtonsGroup, TableActionButton } from "../Common/Component/ActionButtons";
import DataTable from "react-data-table-component";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

// Calculate age by DOB custom hook
import useCalculateAge from "../../CustomHook/useCalculateAge";

// Show patient/user common info
import PatientCommonInfo from "../../CustomHook/PatientCommonInfo";

// PDF libraries
import html2pdf from "html2pdf.js";
import { useBranch } from "../../contexts/BranchContext";
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
import { pickCleanText } from "../../utils/unicodeHelper";

const FirstExamination = () => {
  const { lang } = useLang();
  const { selectedBranch } = useBranch();
  const pdfRef = useRef();

  const [pfaDownload, setpfaDownload] = useState(false);
  const [viewUserDetailsModal, setViewUserDetailsModal] = useState(false);
  const [selectedViewUserId, setSelectedViewUserId] = useState(null);

  const handleViewUserDetails = (userId) => {
    setSelectedViewUserId(userId);
    setViewUserDetailsModal(true);
  };

  const handleDownloadPDF = () => {
    const element = pdfRef.current;
    setpfaDownload(true);
    element.classList.add("pdf-scale");

    const patientName = viewFEData?.name || viewFEData?.patient_name || "Patient";
    const gksId = viewFEData?.custom_code || viewFEData?.gks_id || viewFEData?.uid || viewFEData?.user_id || "";
    const safeName = String(patientName).trim().replace(/\s+/g, "_");
    const safeId = String(gksId).trim().replace(/\s+/g, "_");

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `patient_${safeName}_${safeId || "fe_report"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        toast.success(
          getTranslation("Download complete!/डाउनलोड पूर्ण!", lang),
        );
        element.classList.remove("pdf-scale");
        setTimeout(() => setpfaDownload(false), 2000);
      });
  };

  const [selectedUser, setSelectedUser] = useState(null);
  const dob = selectedUser?.dob;
  const patientCalAge = useCalculateAge(dob);

  const isValidValue = (value) =>
    value !== undefined && value !== null && value !== "" && value !== "N/A";

  const pickValue = (...values) => {
    for (const value of values) {
      if (isValidValue(value)) return value;
    }
    return "";
  };

  const normalizeArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    if (payload?.data && typeof payload.data === "object")
      return [payload.data];
    return [];
  };

  const getLatestAssessment = (payload) =>
    normalizeArray(payload)
      .filter(Boolean)
      .sort(
        (a, b) =>
          new Date(b.created_at || b.date_of_assessment || 0) -
          new Date(a.created_at || a.date_of_assessment || 0),
      )[0] || null;

  const getPFAUserId = (pfa) =>
    pickValue(
      pfa?.user_id,
      pfa?.User_id,
      pfa?.userId,
      pfa?.user?.user_id,
      pfa?.user?.id,
      pfa?.patient?.user_id,
      pfa?.patient?.id,
      pfa?.entry?.user_id,
      pfa?.pfa?.user_id,
      pfa?.id,
    );

  const getPFAGksId = (pfa) =>
    pickValue(
      pfa?.entry_gks_id,
      pfa?.user_gks_id,
      pfa?.gks_id,
      pfa?.custom_code,
      pfa?.entry?.gks_id,
      pfa?.user?.gks_id,
      pfa?.patient?.gks_id,
    );

  const getPFAName = (pfa) =>
    pickValue(
      pfa?.name,
      pfa?.patient_name,
      pfa?.user_name,
      pfa?.full_name,
      pfa?.user?.name,
      pfa?.patient?.name,
      [pfa?.first_name, pfa?.last_name].filter(Boolean).join(" ").trim(),
    );

  const normalizePFARow = (entry, assessment = null) => {
    const merged = { ...(entry || {}), ...(assessment || {}) };
    const userId = getPFAUserId(merged);
    const dischargeStatus = Number(pickValue(merged.discharge_status, 0));
    const isReadmission = Number(pickValue(merged.is_readmission, 0));
    const feCompletedValue = pickValue(
      merged.is_fe_completed,
      merged.fe_completed,
      merged.first_evaluation_completed,
      0,
    );

    return {
      id: userId || "N/A",
      userId,
      pfa_id: pickValue(merged.pfa_id, merged.id),
      gks_id: getPFAGksId(merged) || "N/A",
      name: getPFAName(merged) || "N/A",
      status: "PFA Completed",
      isFECompleted:
        feCompletedValue === true ||
        feCompletedValue === 1 ||
        feCompletedValue === "1" ||
        merged.status === "FE Completed",
      dischargeStatus,
      isReadmission,
      recent_first_eval_id: pickValue(
        merged.recent_first_eval_id,
        merged.first_eval_id,
      ),
      pfaRaw: merged,
    };
  };

  const fetchLatestPFAAssessment = async (userId, token, branchId) => {
    if (!isValidValue(userId)) return null;

    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/pfa/user-assessments/${encodeURIComponent(
        userId,
      )}?branch_id=${branchId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      },
    );

    if (!response.ok) return null;

    const result = await response.json();
    return getLatestAssessment(result);
  };

  const loadLocalUserExtra = (userId, phone = "") => {
    try {
      const cleanPhone = String(phone || "").trim();
      const byId = userId ? localStorage.getItem(`gks_user_extra_${userId}`) : null;
      const byPhone = cleanPhone
        ? localStorage.getItem(`gks_user_extra_phone_${cleanPhone}`)
        : null;
      const parsedId = byId ? JSON.parse(byId) : {};
      const parsedPhone = byPhone ? JSON.parse(byPhone) : {};
      return { ...parsedPhone, ...parsedId };
    } catch {
      return {};
    }
  };

  const loadLocalPFAScreening = (userId, pfaId = null) => {
    try {
      const byPfa = pfaId ? localStorage.getItem(`gks_pfa_screening_pfa_${pfaId}`) : null;
      const byUser = userId ? localStorage.getItem(`gks_pfa_screening_user_${userId}`) : null;
      const raw = byPfa || byUser;
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const saveLocalFEExtra = (evalId, userId, extraObj = {}) => {
    try {
      const record = {
        spo2_percentage: extraObj.spo2_percentage ?? "",
        location: extraObj.location ?? "",
        patient_type: extraObj.patient_type ?? extraObj.addiction ?? "",
        addiction: extraObj.addiction ?? extraObj.patient_type ?? "",
        other_findings: extraObj.other_findings ?? "",
        using_medicine: extraObj.using_medicine ?? "",
        updatedAt: Date.now(),
      };
      if (evalId) {
        localStorage.setItem(`gks_fe_extra_eval_${evalId}`, JSON.stringify(record));
      }
      if (userId) {
        localStorage.setItem(`gks_fe_extra_user_${userId}`, JSON.stringify(record));
      }
    } catch {
      // ignore storage errors
    }
  };

  const loadLocalFEExtra = (evalId, userId = null) => {
    try {
      const byEval = evalId ? localStorage.getItem(`gks_fe_extra_eval_${evalId}`) : null;
      const byUser = userId ? localStorage.getItem(`gks_fe_extra_user_${userId}`) : null;
      const parsedEval = byEval ? JSON.parse(byEval) : {};
      const parsedUser = byUser ? JSON.parse(byUser) : {};
      return { ...parsedUser, ...parsedEval };
    } catch {
      return {};
    }
  };

  const fetchRegisteredUserDetails = async (userId, token, branchId) => {
    if (!isValidValue(userId)) return null;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `${token}`,
    };
    try {
      let res = await fetch(
        `https://gks-yjdc.onrender.com/api/users/${encodeURIComponent(
          userId,
        )}?branch_id=${branchId}`,
        { method: "GET", headers },
      );
      let json = await res.json().catch(() => null);
      let userObj = Array.isArray(json?.data) ? json.data[0] : json?.data || json;
      if (!res.ok || !userObj || (typeof userObj === "object" && !userObj.name && !userObj.address && !userObj.user_id && !userObj.id)) {
        const fallbackRes = await fetch(
          `https://gks-yjdc.onrender.com/api/users/${encodeURIComponent(userId)}`,
          { method: "GET", headers },
        );
        if (fallbackRes.ok) {
          const fallbackJson = await fallbackRes.json().catch(() => null);
          userObj = Array.isArray(fallbackJson?.data)
            ? fallbackJson.data[0]
            : fallbackJson?.data || fallbackJson;
        }
      }
      return userObj && typeof userObj === "object" ? userObj : null;
    } catch {
      return null;
    }
  };

  const FE_EXTENDED_KEYS = ["other_findings", "using_medicine", "patient_type", "spo2"];

  const submitFEWithFallback = async (url, method, token, payloadObj) => {
    const doFetch = async (bodyObj) => {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify(bodyObj),
      });
      const json = await res.json().catch(() => null);
      return { response: res, result: json };
    };

    const firstTry = await doFetch(payloadObj);
    if (firstTry.response.ok) return firstTry;

    const errStr = JSON.stringify(firstTry.result || "").toLowerCase();
    const mentionsExtended = FE_EXTENDED_KEYS.some((k) => errStr.includes(k));
    if (
      firstTry.response.status === 400 &&
      (mentionsExtended || errStr.includes("not allowed") || errStr.includes("unknown"))
    ) {
      const stripped = { ...payloadObj };
      FE_EXTENDED_KEYS.forEach((k) => {
        delete stripped[k];
      });
      return doFetch(stripped);
    }

    return firstTry;
  };

  // First Table Data: ONLY PFA Completed Data List
  const [data, setData] = useState([]);
  const [stillLoading, setstillLoading] = useState(true);

  // Fetch ONLY Completed PFA Data List for Table 1
  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem("Authorization");
    if (!selectedBranch) return;

    const loadPFACompletedEntries = async () => {
      setstillLoading(true);

      try {
        const response = await fetch(
          `https://gks-yjdc.onrender.com/api/pfa/all-entries?branch_id=${selectedBranch}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `${token}`,
            },
          },
        );

        if (!response.ok)
          throw new Error("Failed to fetch PFA completed entries");

        const result = await response.json();
        const pfaEntries = normalizeArray(result);

        const formatted = await Promise.all(
          pfaEntries.map(async (pfa) => {
            const rowUserId = getPFAUserId(pfa);
            const latestAssessment = await fetchLatestPFAAssessment(
              rowUserId,
              token,
              selectedBranch,
            );

            return normalizePFARow(pfa, latestAssessment);
          }),
        );

        if (!isMounted) return;
        setData(formatted);
        setFilteredData(formatted);
      } catch (error) {
        console.error("Error fetching PFA entries:", error);
      } finally {
        if (isMounted) {
          setstillLoading(false);
        }
      }
    };

    loadPFACompletedEntries();

    return () => {
      isMounted = false;
    };
  }, [selectedBranch]);

  // Search Filter Table 1
  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState([]);

  const handleSearchChange = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchText(value);
    const filtered = data.filter((item) =>
      [item.id, item.gks_id, item.name].join(" ").toLowerCase().includes(value),
    );
    setFilteredData(filtered);
  };

  // Table 1 Columns
  const tableColumns = [
    {
      name: getTranslation("GKS ID/GKS आईडी", lang),
      selector: (row) => row.gks_id,
      sortable: true,
      center: true,
    },
    {
      name: getTranslation("Patient name/रोगी का नाम", lang),
      selector: (row) => row.name,
      sortable: true,
      cell: (row) => <span>{row.name}</span>,
    },
    {
      name: getTranslation("Action/क्रिया", lang),
      center: true,
      cell: (row) => {
        if (row.dischargeStatus === 1) return null;
        const canCreateFE = Boolean(row.userId);

        return (
          <ActionButtonsGroup>
            <TableActionButton
              type="view"
              onClick={() => handleViewUserDetails(row.userId || row.id)}
              title={getTranslation("View/देखना", lang)}
            />

            {row.dischargeStatus === 0 && row.isReadmission === 1 && (
              <TableActionButton
                type="edit"
                onClick={() => handleFEprefill(row.recent_first_eval_id)}
                title={getTranslation("Readmission FE/पुनः प्रवेश FE", lang)}
              />
            )}

            {row.dischargeStatus === 0 && row.isReadmission === 0 && (
              <TableActionButton
                type="create"
                disabled={!canCreateFE}
                onClick={() =>
                  canCreateFE ? createFEform(row.userId, row.pfaRaw) : null
                }
                title={
                  !row.userId
                    ? getTranslation(
                        "User ID missing/उपयोगकर्ता आईडी नहीं मिली",
                        lang,
                      )
                    : getTranslation("Create FE/FE बनाएँ", lang)
                }
              />
            )}
          </ActionButtonsGroup>
        );
      },
    },
  ];

  // Table 2 Data: FE List
  const [searchTextone, setSearchTextone] = useState("");
  const [filteredDataone, setFilteredDataone] = useState([]);
  const [getfdaData, setfdaData] = useState([]);

  const handleSearchChangeone = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTextone(value);
    const filtered = getfdaData.filter((item) =>
      item.name.toLowerCase().includes(value),
    );
    setFilteredDataone(filtered);
  };

  useEffect(() => {
    const token = localStorage.getItem("Authorization");
    if (!selectedBranch) return;

    fetch(
      `https://gks-yjdc.onrender.com/api/first-evaluation/all-entries?branch_id=${selectedBranch}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      },
    )
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch FE entries");
        return response.json();
      })
      .then((res) => {
        const evalEntries = res.data || [];
        const formatted = evalEntries.map((item) => {
          const localExtra = loadLocalFEExtra(item.first_eval_id, item.user_id);
          return {
            first_eval_id: item.first_eval_id,
            user_id: item.user_id,
            entry_id: item.entry_id,
            visit_no: item.visit_no,
            status: item.status,
            date_of_assessment: item.date_of_assessment,
            patient_name: item.patient_name,
            weight: item.weight,
            pulse_rate: item.pulse_rate,
            blood_pressure: item.blood_pressure,
            spo2_percentage: pickValue(
              item.spo2_percentage,
              item.spo2,
              localExtra.spo2_percentage,
            ),
            location: pickValue(item.location, localExtra.location),
            addiction: pickValue(
              item.patient_type,
              item.addiction,
              localExtra.patient_type,
              localExtra.addiction,
            ),
            other_findings: pickValue(
              item.other_findings,
              localExtra.other_findings,
            ),
            using_medicine: pickValue(
              item.using_medicine,
              localExtra.using_medicine,
            ),
            intoxicated_at_admission: item.intoxicated_at_admission,
            name: item.name,
            phone: item.phone,
            email: item.email,
            gks_id: item.gks_id,
            dob: item.dob,
            gender: item.gender,
            age: item.age,
          };
        });

        setfdaData(formatted);
        setFilteredDataone(formatted);
      })
      .catch((error) => {
        console.error("Error fetching FE entries:", error);
      });
  }, [selectedBranch]);

  const tableColumnsFDAList = [
    {
      name: getTranslation("First Examination ID/प्रथम परीक्षा आईडी", lang),
      selector: (row) => row.first_eval_id,
      sortable: true,
      center: true,
    },
    {
      name: getTranslation("Patient name/रोगी का नाम", lang),
      selector: (row) => row.name || row.patient_name,
      sortable: true,
    },
    {
      name: getTranslation("Email/ईमेल", lang),
      selector: (row) => row.email,
      sortable: true,
      center: true,
    },
    {
      name: getTranslation("Patient Phone/मरीज़ का फ़ोन", lang),
      selector: (row) => row.phone,
      sortable: true,
      center: true,
    },
    {
      name: getTranslation("Status/स्थिति", lang),
      selector: (row) => row.status,
      sortable: true,
      cell: (row) => (
        <span className="badge bg-success p-2">FE {row.status}</span>
      ),
    },
    {
      name: getTranslation("Action/क्रिया", lang),
      center: true,
      cell: (row) => (
        <ActionButtonsGroup>
          <TableActionButton
            type="view"
            onClick={() => viewFEFormData(row.first_eval_id)}
            title={getTranslation("View/देखना", lang)}
          />
          <TableActionButton
            type="edit"
            onClick={() => handleFEindividualEdit(row.first_eval_id)}
            title={getTranslation("Edit/संपादन करना", lang)}
          />
        </ActionButtonsGroup>
      ),
    },
  ];

  // FE Form Creation State
  const initialFEFormData = {
    dateOfAssessment: new Date(),
    patient_name: "",
    weight: "",
    pulse_rate: "",
    blood_pressure: "",
    spo2_percentage: "",
    location: "",
    addiction: "",
    using_medicine: "",
    other_findings: "",
    intoxicated_at_admission: "No",
  };

  const [formData, setFormData] = useState(initialFEFormData);
  const [draftTimestamp, setDraftTimestamp] = useState(null);
  const [currentFEUserId, setCurrentFEUserId] = useState(null);

  const handleIntoxicatedChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      intoxicated_at_admission: e.target.checked ? "Yes" : "No",
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAssesmentDateChange = (name, date) => {
    setFormData((prev) => ({ ...prev, [name]: date }));
  };

  const [isFEModalOpen, setIsFEModalOpen] = useState(false);

  // Auto-fill helper: maps PFA assessment + Register user details onto the FE create-form state.
  const applyPFAAutoFill = (pfa = {}, userDetails = null, draftData = null) => {
    const resolvedUserId =
      getPFAUserId(pfa) ||
      userDetails?.user_id ||
      userDetails?.id ||
      currentFEUserId;
    const resolvedPfaId = pickValue(pfa?.pfa_id, pfa?.id);
    const localUserExtra = loadLocalUserExtra(
      resolvedUserId,
      userDetails?.phone || pfa?.phone,
    );
    const localPfaExtra = loadLocalPFAScreening(resolvedUserId, resolvedPfaId);

    const patientName = pickValue(
      getPFAName(pfa),
      pickCleanText(userDetails?.name, localUserExtra?.name),
    );
    const weightVal = pickValue(pfa?.weight, pfa?.health_metrics?.weight, "");
    const pulseVal = pickValue(
      pfa?.pulse_rate,
      pfa?.health_metrics?.pulse_rate,
      "",
    );
    const bpVal = pickValue(
      pfa?.blood_pressure,
      pfa?.health_metrics?.blood_pressure,
      "",
    );
    const spo2Val = pickValue(
      pfa?.spo2,
      pfa?.spo2_percentage,
      pfa?.health_metrics?.spo2,
      pfa?.health_metrics?.spo2_percentage,
      pfa?.vitals?.spo2,
      "",
    );
    const addressVal = pickValue(
      pickCleanText(userDetails?.address, localUserExtra?.address),
      pfa?.address,
      pfa?.user?.address,
      pfa?.location,
      "",
    );
    const patientTypeVal = pickValue(
      pickCleanText(userDetails?.patient_type, localUserExtra?.patient_type),
      pfa?.patient_type,
      pfa?.user?.patient_type,
      "",
    );
    const usingMedicineVal = pickValue(
      pfa?.using_medicine,
      pfa?.health_metrics?.using_medicine,
      pfa?.assessment?.using_medicine,
      localPfaExtra?.using_medicine,
      "",
    );
    const otherFindingsVal = pickValue(
      pfa?.other_findings,
      pfa?.health_metrics?.other_findings,
      pfa?.assessment?.other_findings,
      "",
    );

    setSelectedUser({
      ...(userDetails || {}),
      ...(pfa || {}),
      user_id: resolvedUserId,
      name: patientName,
      patient_name: patientName,
      gks_id: pickValue(getPFAGksId(pfa), userDetails?.gks_id),
      dob: pickValue(pfa?.dob, userDetails?.dob, localUserExtra?.dob),
      gender: pickValue(pfa?.gender, userDetails?.gender),
      date_of_admission: pickValue(
        pfa?.date_of_admission,
        pfa?.admit_date,
        userDetails?.date_of_admission,
        localUserExtra?.date_of_admission,
      ),
    });

    setFormData({
      dateOfAssessment: draftData?.dateOfAssessment
        ? safeDate(draftData.dateOfAssessment)
        : new Date(),
      patient_name: pickValue(draftData?.patient_name, patientName),
      weight: pickValue(draftData?.weight, weightVal),
      pulse_rate: pickValue(draftData?.pulse_rate, pulseVal),
      blood_pressure: pickValue(draftData?.blood_pressure, bpVal),
      spo2_percentage: pickValue(draftData?.spo2_percentage, spo2Val),
      location: pickValue(draftData?.location, addressVal),
      addiction: pickValue(draftData?.addiction, patientTypeVal),
      using_medicine: pickValue(draftData?.using_medicine, usingMedicineVal),
      other_findings: pickValue(draftData?.other_findings, otherFindingsVal),
      intoxicated_at_admission:
        draftData?.intoxicated_at_admission === "Yes" ? "Yes" : "No",
    });
  };

  // Auto fill FE form using PFA assessment + Register patient data
  const createFEform = async (userId = null, pfaDataRow = null) => {
    if (typeof userId === "object" && userId !== null) {
      pfaDataRow = userId.pfaRaw || userId;
      userId = userId.userId || getPFAUserId(userId);
    }

    userId = userId || getPFAUserId(pfaDataRow) || currentFEUserId;
    if (userId) setCurrentFEUserId(userId);

    if (!isValidValue(userId)) {
      toast.error(
        getTranslation("User ID not found for this PFA record.", lang),
      );
      return;
    }

    const saved = loadDraft("first_examination", userId);
    const savedDraft = saved && saved.data ? saved.data : null;
    if (savedDraft) {
      setFormData(savedDraft);
      setDraftTimestamp(saved.savedAt);
    } else {
      setFormData(initialFEFormData);
      setDraftTimestamp(null);
    }

    const token = localStorage.getItem("Authorization");
    const branch_id = selectedBranch;

    setIsFEModalOpen(true);
    setIsLoading(true);

    try {
      const [latestPFARes, userDetails] = await Promise.all([
        fetchLatestPFAAssessment(userId, token, branch_id).catch(() => null),
        fetchRegisteredUserDetails(userId, token, branch_id).catch(() => null),
      ]);

      const mergedPFA = {
        ...(pfaDataRow || {}),
        ...(latestPFARes || {}),
      };

      applyPFAAutoFill(mergedPFA, userDetails, savedDraft);
    } catch (error) {
      console.error("Error fetching PFA/user details for FE create form:", error);
      applyPFAAutoFill(pfaDataRow || {}, null, savedDraft);
    } finally {
      setIsLoading(false);
    }
  };

  const [isLoading, setIsLoading] = useState(false);

  // Submit New FE
  const handleSubmit = async (e) => {
    e.preventDefault();

    const compulsoryFieldDefinitions = [
      {
        label: getTranslation("Date of Assessment / मूल्यांकन की तिथि", lang),
        value: formData.dateOfAssessment,
      },
      {
        label: getTranslation("Weight / वजन", lang),
        value: formData.weight,
      },
      {
        label: getTranslation("Pulse Rate / नाड़ी की दर", lang),
        value: formData.pulse_rate,
      },
      {
        label: getTranslation("Blood Pressure / रक्तचाप", lang),
        value: formData.blood_pressure,
      },
      {
        label: getTranslation("SpO2 / एसपीओ2", lang),
        value: formData.spo2_percentage,
      },
      {
        label: getTranslation("Address / पता", lang),
        value: formData.location,
      },
    ];

    if (!validateCompulsoryFields(compulsoryFieldDefinitions, lang)) {
      return;
    }

    setIsLoading(true);

    const parsedSpo2 = Math.max(parseInt(formData.spo2_percentage, 10) || 0, 70);
    const trimmedPatientType = formData.addiction?.trim() || "";
    const trimmedAddress = formData.location?.trim() || "";
    const trimmedUsingMed = formData.using_medicine?.trim() || "";
    const trimmedOtherFindings = formData.other_findings?.trim() || "";

    const payload = {
      user_id: getPFAUserId(selectedUser) || currentFEUserId,
      date_of_assessment: formData.dateOfAssessment
        ? new Date(formData.dateOfAssessment).toISOString().split("T")[0]
        : null,
      patient_name: formData.patient_name?.trim() || null,
      weight: parseFloat(formData.weight) || 0,
      pulse_rate: Math.max(parseInt(formData.pulse_rate, 10) || 0, 30),
      blood_pressure: formData.blood_pressure?.trim() || null,
      spo2_percentage: parsedSpo2,
      spo2: parsedSpo2,
      location: trimmedAddress || null,
      addiction: trimmedPatientType || null,
      patient_type: trimmedPatientType || null,
      using_medicine: trimmedUsingMed || "",
      other_findings: trimmedOtherFindings || "",
      intoxicated_at_admission:
        formData.intoxicated_at_admission === "Yes" ? "Yes" : "No",
    };

    try {
      const token = localStorage.getItem("Authorization");
      const branch_id = selectedBranch;

      const { response, result } = await submitFEWithFallback(
        `https://gks-yjdc.onrender.com/api/first-evaluation/create-assessment?branch_id=${branch_id}`,
        "POST",
        token,
        payload,
      );

      if (!response.ok) {
        setIsLoading(false);
        showApiErrorAlert(result, lang, getTranslation("FE Creation Failed / एफई निर्माण विफल", lang));
        return;
      }

      const userTargetId = getPFAUserId(selectedUser) || currentFEUserId;
      const createdEvalId =
        result?.data?.first_eval_id ||
        result?.data?.insertId ||
        result?.first_eval_id ||
        null;
      saveLocalFEExtra(createdEvalId, userTargetId, payload);

      setIsLoading(false);
      clearDraft("first_examination", userTargetId);
      setDraftTimestamp(null);

      Swal.fire({
        icon: "success",
        title: getTranslation(
          "Patient First Examination Created/रोगी की पहली जांच बनाई गई",
          lang,
        ),
        text: getTranslation(
          "The assessment was submitted successfully./मूल्यांकन सफलतापूर्वक प्रस्तुत किया गया।",
          lang,
        ),
      }).then(() => setIsFEModalOpen(false));
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      Swal.fire({
        icon: "error",
        title: "Unexpected Error",
        text: getTranslation(
          "Failed to submit. Check console for error./सबमिट करने में विफल.",
          lang,
        ),
      });
    }
  };

  // View FE Modal
  const [viewFEData, setViewFEData] = useState(null);
  const [viewFEModal, setViewFEModal] = useState(false);

  const viewFEFormData = async (FEID) => {
    setViewFEModal(true);
    if (typeof FEID === "object" && FEID !== null) {
      FEID = FEID.first_evaluation_id || FEID.first_eval_id || FEID.intake_fe_id;
    }

    if (!FEID) return;

    setIsLoading(true);
    const token = localStorage.getItem("Authorization");
    const branch_id = selectedBranch;

    try {
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/first-evaluation/assessment/${FEID}?branch_id=${branch_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        },
      );

      if (!response.ok) return;

      const data = await response.json();
      const fetchedData = data?.data || null;

      if (fetchedData) {
        const localExtra = loadLocalFEExtra(
          fetchedData.first_eval_id || FEID,
          fetchedData.user_id,
        );
        const enriched = {
          ...fetchedData,
          spo2_percentage: pickValue(
            fetchedData.spo2_percentage,
            fetchedData.spo2,
            localExtra.spo2_percentage,
          ),
          location: pickValue(fetchedData.location, localExtra.location),
          addiction: pickValue(
            fetchedData.patient_type,
            fetchedData.addiction,
            localExtra.patient_type,
            localExtra.addiction,
          ),
          using_medicine: pickValue(
            fetchedData.using_medicine,
            localExtra.using_medicine,
          ),
          other_findings: pickValue(
            fetchedData.other_findings,
            localExtra.other_findings,
          ),
        };
        setViewFEData(enriched);
        setSelectedUser(enriched);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Edit FE Modal
  const [FEEditData, setFEEditData] = useState(null);
  const [FEEditModal, setFEEditModal] = useState(false);

  const handleFEindividualEdit = async (editFEID = null) => {
    setFEEditModal(true);
    if (typeof editFEID === "object" && editFEID !== null) {
      editFEID = editFEID.first_eval_id || editFEID.intake_fe_id;
    }

    if (!editFEID) return;

    const token = localStorage.getItem("Authorization");
    const branch_id = selectedBranch;

    try {
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/first-evaluation/assessment/${editFEID}?branch_id=${branch_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        },
      );

      const data = await response.json();
      const latestAssessment = data.data || null;

      if (latestAssessment) {
        const localExtra = loadLocalFEExtra(
          latestAssessment.first_eval_id || editFEID,
          latestAssessment.user_id,
        );
        const [latestPFA, userDetails] = await Promise.all([
          fetchLatestPFAAssessment(latestAssessment.user_id, token, branch_id).catch(() => null),
          fetchRegisteredUserDetails(latestAssessment.user_id, token, branch_id).catch(() => null),
        ]);
        const localUserExtra = loadLocalUserExtra(
          latestAssessment.user_id,
          userDetails?.phone || latestAssessment.phone,
        );
        const localPfaExtra = loadLocalPFAScreening(
          latestAssessment.user_id,
          latestPFA?.pfa_id || latestPFA?.id,
        );

        setSelectedUser(latestAssessment);
        setFEEditData({
          first_eval_id: latestAssessment.first_eval_id,
          user_id: latestAssessment.user_id,
          entry_id: latestAssessment.entry_id,
          branch_id: latestAssessment.branch_id,
          visit_no: latestAssessment.visit_no,
          date_of_assessment: latestAssessment.date_of_assessment
            ? new Date(latestAssessment.date_of_assessment)
            : "",
          weight: latestAssessment.weight,
          pulse_rate: latestAssessment.pulse_rate,
          blood_pressure: latestAssessment.blood_pressure,
          spo2_percentage: pickValue(
            latestAssessment.spo2_percentage,
            latestAssessment.spo2,
            localExtra.spo2_percentage,
            latestPFA?.spo2,
            latestPFA?.health_metrics?.spo2,
          ),
          location: pickValue(
            latestAssessment.location,
            localExtra.location,
            pickCleanText(userDetails?.address, localUserExtra?.address),
          ),
          addiction: pickValue(
            latestAssessment.patient_type,
            latestAssessment.addiction,
            localExtra.patient_type,
            localExtra.addiction,
            pickCleanText(userDetails?.patient_type, localUserExtra?.patient_type),
          ),
          using_medicine: pickValue(
            latestAssessment.using_medicine,
            localExtra.using_medicine,
            latestPFA?.using_medicine,
            latestPFA?.health_metrics?.using_medicine,
            localPfaExtra?.using_medicine,
          ),
          other_findings: pickValue(
            latestAssessment.other_findings,
            localExtra.other_findings,
            latestPFA?.other_findings,
            latestPFA?.health_metrics?.other_findings,
          ),
          intoxicated_at_admission: latestAssessment.intoxicated_at_admission,
          status: latestAssessment.status,
          isActive: latestAssessment.isActive,
          patient_name: latestAssessment.patient_name || latestAssessment.name,
        });
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  const handleFEUpdate = async () => {
    if (!FEEditData?.first_eval_id) return;

    const compulsoryFieldDefinitions = [
      {
        label: getTranslation("Date of Assessment / मूल्यांकन की तिथि", lang),
        value: FEEditData?.date_of_assessment,
      },
      {
        label: getTranslation("Weight / वजन", lang),
        value: FEEditData?.weight,
      },
      {
        label: getTranslation("Pulse Rate / नाड़ी की दर", lang),
        value: FEEditData?.pulse_rate,
      },
      {
        label: getTranslation("Blood Pressure / रक्तचाप", lang),
        value: FEEditData?.blood_pressure,
      },
      {
        label: getTranslation("SpO2 / एसपीओ2", lang),
        value: FEEditData?.spo2_percentage,
      },
      {
        label: getTranslation("Address / पता", lang),
        value: FEEditData?.location,
      },
    ];

    if (!validateCompulsoryFields(compulsoryFieldDefinitions, lang)) {
      return;
    }

    setIsLoading(true);
    const trimmedPatientType = String(FEEditData?.addiction || "").trim();
    const payload = {
      user_id: selectedUser?.user_id || FEEditData?.user_id,
      entry_id: FEEditData?.entry_id,
      branch_id: FEEditData?.branch_id,
      visit_no: FEEditData?.visit_no,
      date_of_assessment: FEEditData?.date_of_assessment
        ? new Date(FEEditData.date_of_assessment).toISOString().split("T")[0]
        : "",
      weight: FEEditData?.weight || "",
      pulse_rate: FEEditData?.pulse_rate || "",
      blood_pressure: FEEditData?.blood_pressure || "",
      spo2_percentage: FEEditData?.spo2_percentage || "",
      spo2: FEEditData?.spo2_percentage || "",
      location: String(FEEditData?.location || "").trim(),
      addiction: trimmedPatientType,
      patient_type: trimmedPatientType,
      using_medicine: String(FEEditData?.using_medicine || "").trim(),
      other_findings: String(FEEditData?.other_findings || "").trim(),
      intoxicated_at_admission: FEEditData?.intoxicated_at_admission || "",
      status: FEEditData?.status || "",
      isActive: FEEditData?.isActive || 1,
    };

    try {
      const branch_id = selectedBranch;
      const token = localStorage.getItem("Authorization");

      const { response, result } = await submitFEWithFallback(
        `https://gks-yjdc.onrender.com/api/first-evaluation/update-assessment/${FEEditData.first_eval_id}?branch_id=${branch_id}`,
        "PUT",
        token,
        payload,
      );

      if (!response.ok) {
        setIsLoading(false);
        showApiErrorAlert(result, lang, getTranslation("FE Update Failed / एफई अद्यतन विफल", lang));
        return;
      }

      saveLocalFEExtra(FEEditData.first_eval_id, payload.user_id, payload);

      setIsLoading(false);
      Swal.fire({
        icon: "success",
        title: getTranslation(
          "FE Updated Successfully!/FE अद्यतन हो गया!",
          lang,
        ),
      }).then(() => setFEEditModal(false));
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      Swal.fire({
        icon: "error",
        title: getTranslation("Error/त्रुटि", lang),
        text: getTranslation(
          "Failed to update assessment./मूल्यांकन अद्यतन करने में विफल.",
          lang,
        ),
      });
    }
  };

  // Pre-fill readmission modal with latest existing FE + PFA + Register data
  const [FEPrefillModal, setFEPrefillModal] = useState(false);
  const [FEPrefillData, setFEPrefillData] = useState(null);

  const handleFEprefill = async (prefillFEID = null) => {
    if (typeof prefillFEID === "object" && prefillFEID !== null) {
      prefillFEID = prefillFEID.first_eval_id || prefillFEID.intake_fe_id || prefillFEID.recent_first_eval_id;
    }

    if (!prefillFEID) return;

    setFEPrefillModal(true);
    setFEPrefillData(null);
    const token = localStorage.getItem("Authorization");
    const branch_id = selectedBranch;

    try {
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/first-evaluation/assessment/${prefillFEID}?branch_id=${branch_id}`,
        {
          headers: {
            Authorization: `${token}`,
          },
        },
      );
      const data = await response.json();
      const latestAssessment = data?.assessment || data?.data;

      if (latestAssessment) {
        const localExtra = loadLocalFEExtra(
          latestAssessment.first_eval_id || prefillFEID,
          latestAssessment.user_id,
        );
        const [latestPFA, userDetails] = await Promise.all([
          fetchLatestPFAAssessment(latestAssessment.user_id, token, branch_id).catch(() => null),
          fetchRegisteredUserDetails(latestAssessment.user_id, token, branch_id).catch(() => null),
        ]);
        const localUserExtra = loadLocalUserExtra(
          latestAssessment.user_id,
          userDetails?.phone || latestAssessment.phone,
        );
        const localPfaExtra = loadLocalPFAScreening(
          latestAssessment.user_id,
          latestPFA?.pfa_id || latestPFA?.id,
        );

        setFEPrefillData({
          user_id: latestAssessment.user_id,
          date_of_assessment: latestAssessment.date_of_assessment
            ? new Date(latestAssessment.date_of_assessment)
            : new Date(),
          weight: pickValue(latestPFA?.weight, latestAssessment.weight, ""),
          pulse_rate: pickValue(latestPFA?.pulse_rate, latestAssessment.pulse_rate, ""),
          blood_pressure: pickValue(
            latestPFA?.blood_pressure,
            latestAssessment.blood_pressure,
            "",
          ),
          spo2_percentage: pickValue(
            latestPFA?.spo2,
            latestPFA?.health_metrics?.spo2,
            latestAssessment.spo2_percentage,
            latestAssessment.spo2,
            localExtra.spo2_percentage,
            "",
          ),
          location: pickValue(
            pickCleanText(userDetails?.address, localUserExtra?.address),
            latestAssessment.location,
            localExtra.location,
            "",
          ),
          addiction: pickValue(
            pickCleanText(userDetails?.patient_type, localUserExtra?.patient_type),
            latestAssessment.patient_type,
            latestAssessment.addiction,
            localExtra.patient_type,
            localExtra.addiction,
            "",
          ),
          using_medicine: pickValue(
            latestPFA?.using_medicine,
            latestPFA?.health_metrics?.using_medicine,
            localPfaExtra?.using_medicine,
            latestAssessment.using_medicine,
            localExtra.using_medicine,
            "",
          ),
          other_findings: pickValue(
            latestPFA?.other_findings,
            latestPFA?.health_metrics?.other_findings,
            latestAssessment.other_findings,
            localExtra.other_findings,
            "",
          ),
          intoxicated_at_admission:
            latestAssessment.intoxicated_at_admission || "No",
          patient_name:
            latestAssessment.patient_name || latestAssessment.name || "",
        });
      }
    } catch (error) {
      console.error("Prefill error:", error);
    }
  };

  const handleReadmissionSubmit = async (e) => {
    e.preventDefault();

    const compulsoryFieldDefinitions = [
      {
        label: getTranslation("Date of Assessment / मूल्यांकन की तिथि", lang),
        value: FEPrefillData?.date_of_assessment,
      },
      {
        label: getTranslation("Weight / वजन", lang),
        value: FEPrefillData?.weight,
      },
      {
        label: getTranslation("Pulse Rate / नाड़ी की दर", lang),
        value: FEPrefillData?.pulse_rate,
      },
      {
        label: getTranslation("Blood Pressure / रक्तचाप", lang),
        value: FEPrefillData?.blood_pressure,
      },
      {
        label: getTranslation("SpO2 / एसपीओ2", lang),
        value: FEPrefillData?.spo2_percentage,
      },
      {
        label: getTranslation("Address / पता", lang),
        value: FEPrefillData?.location,
      },
    ];

    if (!validateCompulsoryFields(compulsoryFieldDefinitions, lang)) {
      return;
    }

    setIsLoading(true);

    const parsedSpo2 = Math.max(
      parseInt(FEPrefillData?.spo2_percentage, 10) || 0,
      70,
    );
    const trimmedPatientType = FEPrefillData?.addiction?.trim() || "";
    const payload = {
      user_id: FEPrefillData?.user_id,
      date_of_assessment: FEPrefillData?.date_of_assessment
        ? new Date(FEPrefillData.date_of_assessment).toISOString().split("T")[0]
        : null,
      patient_name: FEPrefillData?.patient_name?.trim() || null,
      weight: parseFloat(FEPrefillData?.weight) || 0,
      pulse_rate: Math.max(parseInt(FEPrefillData?.pulse_rate, 10) || 0, 30),
      blood_pressure: FEPrefillData?.blood_pressure?.trim() || null,
      spo2_percentage: parsedSpo2,
      spo2: parsedSpo2,
      location: FEPrefillData?.location?.trim() || null,
      addiction: trimmedPatientType || null,
      patient_type: trimmedPatientType || null,
      using_medicine: FEPrefillData?.using_medicine?.trim() || "",
      other_findings: FEPrefillData?.other_findings?.trim() || "",
      intoxicated_at_admission:
        FEPrefillData?.intoxicated_at_admission === "Yes" ? "Yes" : "No",
    };

    try {
      const token = localStorage.getItem("Authorization");
      const branch_id = selectedBranch;

      const { response, result } = await submitFEWithFallback(
        `https://gks-yjdc.onrender.com/api/first-evaluation/create-assessment?branch_id=${branch_id}`,
        "POST",
        token,
        payload,
      );

      if (!response.ok) {
        setIsLoading(false);
        showApiErrorAlert(result, lang, getTranslation("FE Readmission Failed / एफई पुनः प्रवेश विफल", lang));
        return;
      }

      const createdEvalId =
        result?.data?.first_eval_id ||
        result?.data?.insertId ||
        result?.first_eval_id ||
        null;
      saveLocalFEExtra(createdEvalId, FEPrefillData?.user_id, payload);

      setIsLoading(false);
      Swal.fire({
        icon: "success",
        title: getTranslation(
          "Readmission FE Created/पुनः प्रवेश FE बनाया गया",
          lang,
        ),
      }).then(() => setFEPrefillModal(false));
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  const closeAllmodal = () => {
    setIsFEModalOpen(false);
    setViewFEModal(false);
    setFEEditModal(false);
    setFEPrefillModal(false);
  };

  const handlePrint = () => printElementAsPdf(pdfRef.current);

  return (
    <Fragment>
      {/* Table 1: Registered Patient List (Completed PFA List Only) */}
      <Container fluid={true} className="datatables">
        <Row>
          <Col sm="12">
            <CardBody>
              <Card>
                <CardBody>
                  <div className="d-flex pb-2 justify-content-between">
                    <HeaderCard
                      title={getTranslation(
                        "Registered Patient List/पंजीकृत रोगी सूची",
                        lang,
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
                          placeholder={getTranslation(
                            "Search......./खोज.......",
                            lang,
                          )}
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
                        filename="FE_Registration_List"
                        title={getTranslation("First Examination Registration List / प्रथम परीक्षा पंजीकरण सूची", lang)}
                      />
                    </div>
                  </div>
                  {stillLoading ? (
                    <div className="loading-text">
                      {getTranslation(
                        "Data is fetching from server. Please wait.../सर्वर से डेटा प्राप्त किया जा रहा है।",
                        lang,
                      )}
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
                    />
                  )}
                </CardBody>
              </Card>
            </CardBody>
          </Col>
        </Row>
      </Container>

      {/* Table 2: All FE Entries List */}
      <Container fluid={true} className="datatables">
        <Row>
          <Col sm="12">
            <CardBody>
              <Card>
                <CardBody>
                  <div className="d-flex pb-2 justify-content-between">
                    <HeaderCard
                      title={getTranslation(
                        "All First Eamination Data List/सभी प्रथम उत्सर्जन डेटा सूची",
                        lang,
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
                          placeholder={getTranslation(
                            "Search......./खोज.......",
                            lang,
                          )}
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
                        columns={tableColumnsFDAList}
                        filename="All_FE_Examination_List"
                        title={getTranslation("All First Examination Data List / सभी प्रथम परीक्षा डेटा सूची", lang)}
                      />
                    </div>
                  </div>
                  <DataTable
                    data={filteredDataone}
                    columns={tableColumnsFDAList}
                    striped
                    center
                    highlightOnHover
                    pagination
                    persistTableHead
                  />
                </CardBody>
              </Card>
            </CardBody>
          </Col>
        </Row>
      </Container>

      {/* FE Create Modal */}
      <CommonModal
        isOpen={isFEModalOpen}
        title={getTranslation(
          "Create First Examination Form/पहला परीक्षा फॉर्म बनाएँ",
          lang,
        )}
        toggler={closeAllmodal}
        maxWidth="1200px"
      >
        <PatientCommonInfo
          selectedUser={selectedUser}
          labels={{
            name: getTranslation("Patient name/प्रयासक का नाम :", lang),
            sex: getTranslation("Gender/प्रयासक का लिंग :", lang),
            age: getTranslation("Age/प्रयासक का उम्र :", lang),
            date_of_admission: getTranslation(
              "Date of Admission/प्रवेश की तिथि :",
              lang,
            ),
            ageValue: patientCalAge,
          }}
        />
        <div className="row px-3 pt-4 pb-3">
          <DraftNoticeBanner
            draftTimestamp={draftTimestamp}
            formKey="first_examination"
            targetId={getPFAUserId(selectedUser) || currentFEUserId}
            onDiscard={() => {
              setFormData(initialFEFormData);
              setDraftTimestamp(null);
            }}
          />
          <form noValidate onSubmit={handleSubmit}>
            <div className="col-12 col-md-6 mb-3">
              <label className="form-label">
                {getTranslation("Date of Assessment/मूल्यांकन की तिथि", lang)}
              </label>
              <DatePicker showMonthDropdown showYearDropdown dropdownMode="select"
                className="form-control digits"
                selected={safeDate(formData.dateOfAssessment)}
                onChange={(date) =>
                  handleAssesmentDateChange("dateOfAssessment", date)
                }
              />
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="name">{getTranslation("Name/नाम", lang)}</label>
                <input
                  type="text"
                  id="name"
                  name="patient_name"
                  className="form-control"
                  value={formData.patient_name}
                  disabled
                />
              </div>
              <div className="col-md-3">
                <label htmlFor="weight">
                  {getTranslation("Weight (kg)/वजन (किलोग्राम)", lang)}
                </label>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  className="form-control"
                  value={formData.weight}
                  disabled
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-2">
                <label htmlFor="pulse">
                  {getTranslation("Pulse/नाड़ी", lang)}
                </label>
                <input
                  type="number"
                  id="pulse"
                  name="pulse_rate"
                  className="form-control"
                  value={formData.pulse_rate}
                  disabled
                />
              </div>
              <div className="col-md-3">
                <label htmlFor="bp">
                  {getTranslation("Blood Pressure/रक्तचाप", lang)}
                </label>
                <input
                  type="text"
                  id="bp"
                  name="blood_pressure"
                  className="form-control"
                  value={formData.blood_pressure}
                  placeholder="e.g. 120/80"
                  disabled
                />
              </div>
              <div className="col-md-3">
                <label htmlFor="spo2">SpO2 (%)</label>
                <input
                  type="number"
                  id="spo2"
                  name="spo2_percentage"
                  className="form-control"
                  min="0"
                  max="100"
                  placeholder="e.g. 98"
                  value={formData.spo2_percentage}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="location">
                  {getTranslation("Address / पता", lang)}
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  className="form-control"
                  placeholder={getTranslation("Enter patient address... / रोगी का पता दर्ज करें...", lang)}
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="addiction">
                  {getTranslation("Patient Type / रोगी का प्रकार", lang)}
                </label>
                <input
                  type="text"
                  id="addiction"
                  name="addiction"
                  className="form-control"
                  placeholder={getTranslation("Enter patient type... / रोगी का प्रकार दर्ज करें...", lang)}
                  value={formData.addiction}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="using_medicine">
                  {getTranslation("Using Medicine / उपयोग की जा रही दवा", lang)}
                </label>
                <input
                  type="text"
                  id="using_medicine"
                  name="using_medicine"
                  className="form-control"
                  placeholder={getTranslation("Enter currently using medicine... / वर्तमान में उपयोग की जा रही दवा दर्ज करें...", lang)}
                  value={formData.using_medicine}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="other_findings">
                  {getTranslation("Any Other Findings / अन्य निष्कर्ष", lang)}
                </label>
                <textarea
                  id="other_findings"
                  name="other_findings"
                  rows="2"
                  className="form-control"
                  placeholder={getTranslation("Enter any other findings... / कोई अन्य निष्कर्ष दर्ज करें...", lang)}
                  value={formData.other_findings}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-check mb-3">
              <input
                type="checkbox"
                id="intoxicated"
                name="intoxicated_at_admission"
                className="form-check-input checkbox_animated"
                checked={formData.intoxicated_at_admission === "Yes"}
                onChange={handleIntoxicatedChange}
              />
              <label className="form-check-label" htmlFor="intoxicated">
                {getTranslation(
                  "Intoxicated at the time of admission/प्रवेश के समय नशे में",
                  lang,
                )}
              </label>
            </div>

            <div className="d-flex align-items-center gap-3 flex-wrap">
              <SaveDraftButton
                formKey="first_examination"
                targetId={getPFAUserId(selectedUser) || currentFEUserId}
                formData={formData}
                onDraftSaved={() => setDraftTimestamp(Date.now())}
                style={{ height: "38px", padding: "6px 16px" }}
              />

              <Button color="primary" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : (
                  getTranslation("Create FE Form/FE फॉर्म बनाएं", lang)
                )}
              </Button>
            </div>
          </form>
        </div>
      </CommonModal>

      {/* FE View Modal */}
      <CommonModal
        isOpen={viewFEModal}
        title={getTranslation(
          "View First Examination Form/प्रथम परीक्षा फॉर्म देखें",
          lang,
        )}
        toggler={closeAllmodal}
        maxWidth="1100px"
      >
        <div className="p-3 p-md-4 print-area" ref={pdfRef} style={{ background: "#f8fafc" }}>
          {isLoading ? (
            <ModalLoading message={getTranslation("Loading First Examination details... / विवरण लोड हो रहा है...", lang)} />
          ) : viewFEData ? (
            <div>
              <PatientViewHeader data={viewFEData} />

              {/* Card 1: Clinical Vitals */}
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
                    🩺 {getTranslation("Patient & Clinical Vitals / रोगी एवं नैदानिक ​​विवरण", lang)}
                  </h6>
                </div>
                <div className="card-body p-3 p-md-4">
                  <div className="row g-3">
                    <div className="col-12 col-sm-6 col-lg-4">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                          {getTranslation("Date of assessment/मूल्यांकन की तिथि", lang)}
                        </div>
                        <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                          📅 {viewFEData.date_of_assessment ? new Date(viewFEData.date_of_assessment).toLocaleDateString() : "-"}
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-sm-6 col-lg-4">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                          {getTranslation("Patient Name/रोगी का नाम", lang)}
                        </div>
                        <div className="fw-semibold text-dark text-capitalize mt-1" style={{ fontSize: "13.5px" }}>
                          👤 {viewFEData?.patient_name || viewFEData?.name || "-"}
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-sm-6 col-lg-4">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                          {getTranslation("Address / पता", lang)}
                        </div>
                        <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                          📍 {viewFEData?.location || "-"}
                        </div>
                      </div>
                    </div>

                    <div className="col-6 col-sm-3 col-lg-3">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                          {getTranslation("Weight/वज़न", lang)}
                        </div>
                        <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                          ⚖️ {viewFEData?.weight ? `${viewFEData.weight} kg` : "-"}
                        </div>
                      </div>
                    </div>

                    <div className="col-6 col-sm-3 col-lg-3">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                          {getTranslation("Pulse/नाड़ी", lang)}
                        </div>
                        <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                          ❤️ {viewFEData?.pulse_rate ? `${viewFEData.pulse_rate} bpm` : "-"}
                        </div>
                      </div>
                    </div>

                    <div className="col-6 col-sm-3 col-lg-3">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                          Blood Pressure
                        </div>
                        <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                          🩸 {viewFEData?.blood_pressure || "-"}
                        </div>
                      </div>
                    </div>

                    <div className="col-6 col-sm-3 col-lg-3">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                          SpO2 (%)
                        </div>
                        <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                          🫁 {viewFEData?.spo2_percentage ? `${viewFEData.spo2_percentage}%` : "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Patient Type, Medications & Admission Status */}
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
                    ⚠️ {getTranslation("Patient Type & Clinical Details / रोगी का प्रकार एवं नैदानिक विवरण", lang)}
                  </h6>
                </div>
                <div className="card-body p-3 p-md-4">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                          {getTranslation("Patient Type / रोगी का प्रकार", lang)}
                        </div>
                        <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                          {viewFEData?.addiction || "-"}
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                          {getTranslation(
                            "Intoxicated at the time of admission/प्रवेश के समय नशे में",
                            lang,
                          )}
                        </div>
                        <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                          {viewFEData?.intoxicated_at_admission || "-"}
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                          {getTranslation("Using Medicine / उपयोग की जा रही दवा", lang)}
                        </div>
                        <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                          💊 {viewFEData?.using_medicine || "-"}
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                          {getTranslation("Any Other Findings / अन्य निष्कर्ष", lang)}
                        </div>
                        <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                          {viewFEData?.other_findings || "-"}
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

        {/* Action Buttons */}
        <ModalActionButtons
          onClose={closeAllmodal}
          onPrint={handlePrint}
          onDownload={handleDownloadPDF}
          isDownloading={pfaDownload}
          downloadText={getTranslation("Download PDF / डाउनलोड करें", lang)}
        />
      </CommonModal>

      {/* FE Edit Modal */}
      <CommonModal
        isOpen={FEEditModal}
        title={getTranslation(
          "Edit First Examination Form/प्रथम परीक्षा फॉर्म संपादित करें",
          lang,
        )}
        toggler={closeAllmodal}
        maxWidth="1200px"
      >
        <div className="row px-3 pt-4 pb-3">
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              handleFEUpdate();
            }}
          >
            <div className="col-12 col-md-6 mb-3">
              <label className="form-label">
                {getTranslation("Date of Assessment/मूल्यांकन की तिथि", lang)}
              </label>
              <DatePicker showMonthDropdown showYearDropdown dropdownMode="select"
                className="form-control digits"
                selected={safeDate(FEEditData?.date_of_assessment)}
                onChange={(date) =>
                  setFEEditData((prev) => ({
                    ...prev,
                    date_of_assessment: date,
                  }))
                }
              />
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="name">{getTranslation("Name/नाम", lang)}</label>
                <input
                  type="text"
                  id="name"
                  className="form-control"
                  value={FEEditData?.patient_name || ""}
                  disabled
                />
              </div>
              <div className="col-md-3">
                <label htmlFor="weight">
                  {getTranslation("Weight (kg)/वजन (किलोग्राम)", lang)}
                </label>
                <input
                  type="number"
                  id="weight"
                  className="form-control"
                  value={FEEditData?.weight || ""}
                  disabled
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-2">
                <label htmlFor="pulse">
                  {getTranslation("Pulse/नाड़ी", lang)}
                </label>
                <input
                  type="number"
                  id="pulse"
                  className="form-control"
                  value={FEEditData?.pulse_rate || ""}
                  disabled
                />
              </div>
              <div className="col-md-3">
                <label htmlFor="bp">
                  {getTranslation("Blood Pressure/रक्तचाप", lang)}
                </label>
                <input
                  type="text"
                  id="bp"
                  className="form-control"
                  value={FEEditData?.blood_pressure || ""}
                  disabled
                />
              </div>
              <div className="col-md-3">
                <label htmlFor="edit-spo2">SpO2 (%)</label>
                <input
                  type="number"
                  id="edit-spo2"
                  className="form-control"
                  min="0"
                  max="100"
                  placeholder="e.g. 98"
                  value={FEEditData?.spo2_percentage || ""}
                  onChange={(e) =>
                    setFEEditData((prev) => ({
                      ...prev,
                      spo2_percentage: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="edit-location">
                  {getTranslation("Address / पता", lang)}
                </label>
                <input
                  type="text"
                  id="edit-location"
                  className="form-control"
                  placeholder={getTranslation("Enter patient address... / रोगी का पता दर्ज करें...", lang)}
                  value={FEEditData?.location || ""}
                  onChange={(e) =>
                    setFEEditData((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="edit-addiction">
                  {getTranslation("Patient Type / रोगी का प्रकार", lang)}
                </label>
                <input
                  type="text"
                  id="edit-addiction"
                  className="form-control"
                  placeholder={getTranslation("Enter patient type... / रोगी का प्रकार दर्ज करें...", lang)}
                  value={FEEditData?.addiction || ""}
                  onChange={(e) =>
                    setFEEditData((prev) => ({
                      ...prev,
                      addiction: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="edit-using-medicine">
                  {getTranslation("Using Medicine / उपयोग की जा रही दवा", lang)}
                </label>
                <input
                  type="text"
                  id="edit-using-medicine"
                  className="form-control"
                  placeholder={getTranslation("Enter currently using medicine... / वर्तमान में उपयोग की जा रही दवा दर्ज करें...", lang)}
                  value={FEEditData?.using_medicine || ""}
                  onChange={(e) =>
                    setFEEditData((prev) => ({
                      ...prev,
                      using_medicine: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="edit-other-findings">
                  {getTranslation("Any Other Findings / अन्य निष्कर्ष", lang)}
                </label>
                <textarea
                  id="edit-other-findings"
                  rows="2"
                  className="form-control"
                  placeholder={getTranslation("Enter any other findings... / कोई अन्य निष्कर्ष दर्ज करें...", lang)}
                  value={FEEditData?.other_findings || ""}
                  onChange={(e) =>
                    setFEEditData((prev) => ({
                      ...prev,
                      other_findings: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="form-check mb-3">
              <input
                type="checkbox"
                id="edit-intoxicated"
                className="form-check-input checkbox_animated"
                checked={FEEditData?.intoxicated_at_admission === "Yes"}
                onChange={(e) =>
                  setFEEditData((prev) => ({
                    ...prev,
                    intoxicated_at_admission: e.target.checked ? "Yes" : "No",
                  }))
                }
              />
              <label className="form-check-label" htmlFor="edit-intoxicated">
                {getTranslation(
                  "Intoxicated at the time of admission/प्रवेश के समय नशे में",
                  lang,
                )}
              </label>
            </div>

            <div className="d-flex gap-3">
              <Button color="primary" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : (
                  getTranslation("Update FE Form/FE फॉर्म अपडेट करें", lang)
                )}
              </Button>
            </div>
          </form>
        </div>
      </CommonModal>

      {/* FE Prefill Modal (Readmission) */}
      <CommonModal
        isOpen={FEPrefillModal}
        title={getTranslation(
          "Readmission First Examination Form/पुनः प्रवेश प्रथम परीक्षा फॉर्म",
          lang,
        )}
        toggler={closeAllmodal}
        maxWidth="1200px"
      >
        <div className="row px-3 pt-4 pb-3">
          <form noValidate onSubmit={handleReadmissionSubmit}>
            <div className="col-12 col-md-6 mb-3">
              <label className="form-label">
                {getTranslation("Date of Assessment/मूल्यांकन की तिथि", lang)}
              </label>
              <DatePicker showMonthDropdown showYearDropdown dropdownMode="select"
                className="form-control digits"
                selected={safeDate(FEPrefillData?.date_of_assessment)}
                onChange={(date) =>
                  setFEPrefillData((prev) => ({
                    ...prev,
                    date_of_assessment: date,
                  }))
                }
              />
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="name">{getTranslation("Name/नाम", lang)}</label>
                <input
                  type="text"
                  id="name"
                  className="form-control"
                  value={FEPrefillData?.patient_name || ""}
                  disabled
                />
              </div>
              <div className="col-md-3">
                <label htmlFor="weight">
                  {getTranslation("Weight (kg)/वजन (किलोग्राम)", lang)}
                </label>
                <input
                  type="number"
                  id="weight"
                  className="form-control"
                  value={FEPrefillData?.weight || ""}
                  disabled
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-2">
                <label htmlFor="pulse">
                  {getTranslation("Pulse/नाड़ी", lang)}
                </label>
                <input
                  type="number"
                  id="pulse"
                  className="form-control"
                  value={FEPrefillData?.pulse_rate || ""}
                  disabled
                />
              </div>
              <div className="col-md-3">
                <label htmlFor="bp">
                  {getTranslation("Blood Pressure/रक्तचाप", lang)}
                </label>
                <input
                  type="text"
                  id="bp"
                  className="form-control"
                  value={FEPrefillData?.blood_pressure || ""}
                  disabled
                />
              </div>
              <div className="col-md-3">
                <label htmlFor="readmit-spo2">SpO2 (%)</label>
                <input
                  type="number"
                  id="readmit-spo2"
                  className="form-control"
                  min="0"
                  max="100"
                  placeholder="e.g. 98"
                  value={FEPrefillData?.spo2_percentage || ""}
                  onChange={(e) =>
                    setFEPrefillData((prev) => ({
                      ...prev,
                      spo2_percentage: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="readmit-location">
                  {getTranslation("Address / पता", lang)}
                </label>
                <input
                  type="text"
                  id="readmit-location"
                  className="form-control"
                  placeholder={getTranslation("Enter patient address... / रोगी का पता दर्ज करें...", lang)}
                  value={FEPrefillData?.location || ""}
                  onChange={(e) =>
                    setFEPrefillData((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="readmit-addiction">
                  {getTranslation("Patient Type / रोगी का प्रकार", lang)}
                </label>
                <input
                  type="text"
                  id="readmit-addiction"
                  className="form-control"
                  placeholder={getTranslation("Enter patient type... / रोगी का प्रकार दर्ज करें...", lang)}
                  value={FEPrefillData?.addiction || ""}
                  onChange={(e) =>
                    setFEPrefillData((prev) => ({
                      ...prev,
                      addiction: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="readmit-using-medicine">
                  {getTranslation("Using Medicine / उपयोग की जा रही दवा", lang)}
                </label>
                <input
                  type="text"
                  id="readmit-using-medicine"
                  className="form-control"
                  placeholder={getTranslation("Enter currently using medicine... / वर्तमान में उपयोग की जा रही दवा दर्ज करें...", lang)}
                  value={FEPrefillData?.using_medicine || ""}
                  onChange={(e) =>
                    setFEPrefillData((prev) => ({
                      ...prev,
                      using_medicine: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="readmit-other-findings">
                  {getTranslation("Any Other Findings / अन्य निष्कर्ष", lang)}
                </label>
                <textarea
                  id="readmit-other-findings"
                  rows="2"
                  className="form-control"
                  placeholder={getTranslation("Enter any other findings... / कोई अन्य निष्कर्ष दर्ज करें...", lang)}
                  value={FEPrefillData?.other_findings || ""}
                  onChange={(e) =>
                    setFEPrefillData((prev) => ({
                      ...prev,
                      other_findings: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="form-check mb-3">
              <input
                type="checkbox"
                id="readmit-intoxicated"
                className="form-check-input checkbox_animated"
                checked={FEPrefillData?.intoxicated_at_admission === "Yes"}
                onChange={(e) =>
                  setFEPrefillData((prev) => ({
                    ...prev,
                    intoxicated_at_admission: e.target.checked ? "Yes" : "No",
                  }))
                }
              />
              <label className="form-check-label" htmlFor="readmit-intoxicated">
                {getTranslation(
                  "Intoxicated at the time of admission/प्रवेश के समय नशे में",
                  lang,
                )}
              </label>
            </div>

            <div className="d-flex gap-3">
              <Button color="primary" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : (
                  getTranslation(
                    "Readmission FE Form/पुनः प्रवेश FE फॉर्म",
                    lang,
                  )
                )}
              </Button>
            </div>
          </form>
        </div>
      </CommonModal>

      {/* View user details modal */}
      <UserDetailsModal
        isOpen={viewUserDetailsModal}
        userId={selectedViewUserId}
        toggler={() => setViewUserDetailsModal(false)}
      />
    </Fragment>
  );
};

export default FirstExamination;
