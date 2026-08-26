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
} from "reactstrap";

import DatePicker from "react-datepicker";
import CommonModal from "../UiKits/Modals/common/modal";
import HeaderCard from "../Common/Component/HeaderCard";
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
import { useReactToPrint } from "react-to-print";

const FirstExamination = () => {
  const { lang } = useLang();
  const { selectedBranch } = useBranch();
  const pdfRef = useRef();

  const [pfaDownload, setpfaDownload] = useState(false);

  const handleDownloadPDF = () => {
    const element = pdfRef.current;
    setpfaDownload(true);
    element.classList.add("pdf-scale");

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `user_data_${viewFEData?.name || viewFEData?.patient_name}_${
        viewFEData?.user_id
      }.pdf`,
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
      name: getTranslation("User ID/उपयोगकर्ता आईडी", lang),
      selector: (row) => row.id,
      sortable: true,
      center: true,
    },
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
      name: getTranslation("Status/स्थिति", lang),
      selector: (row) => row.status,
      sortable: true,
      cell: () => (
        <span className="badge bg-success p-2">
          {getTranslation("PFA Completed/पीएफए पूरा हुआ", lang)}
        </span>
      ),
    },
    {
      name: getTranslation("Action/क्रिया", lang),
      center: true,
      cell: (row) => {
        if (row.dischargeStatus === 1) return null;
        const canCreateFE = Boolean(row.userId) && !row.isFECompleted;

        return (
          <div className="d-flex gap-2">
            {row.dischargeStatus === 0 && row.isReadmission === 1 && (
              <span
                onClick={() => handleFEprefill(row.recent_first_eval_id)}
                style={{ cursor: "pointer" }}
                title={getTranslation("Readmission FE/पुनः प्रवेश FE", lang)}
              >
                ✏️
              </span>
            )}

            {row.dischargeStatus === 0 && row.isReadmission === 0 && (
              <span
                onClick={() =>
                  canCreateFE ? createFEform(row.userId, row.pfaRaw) : null
                }
                style={{
                  cursor: canCreateFE ? "pointer" : "not-allowed",
                  opacity: canCreateFE ? 1 : 0.5,
                }}
                title={
                  !row.userId
                    ? getTranslation(
                        "User ID missing/उपयोगकर्ता आईडी नहीं मिली",
                        lang,
                      )
                    : row.isFECompleted
                      ? getTranslation("FE Completed/एफई पूरा हुआ", lang)
                      : getTranslation("Create FE/FE बनाएँ", lang)
                }
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
        const formatted = evalEntries.map((item) => ({
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
          spo2_percentage: item.spo2_percentage,
          location: item.location,
          addiction: item.addiction,
          intoxicated_at_admission: item.intoxicated_at_admission,
          name: item.name,
          phone: item.phone,
          email: item.email,
          gks_id: item.gks_id,
          dob: item.dob,
          gender: item.gender,
          age: item.age,
        }));

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
        <div className="d-flex gap-2">
          <span
            onClick={() => viewFEFormData(row.first_eval_id)}
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
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </span>
          <span
            onClick={() => handleFEindividualEdit(row.first_eval_id)}
            style={{ cursor: "pointer", marginLeft: "10px" }}
            title={getTranslation("Edit/संपादन करना", lang)}
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
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </span>
        </div>
      ),
    },
  ];

  // FE Form Creation State
  const [formData, setFormData] = useState({
    dateOfAssessment: new Date(),
    patient_name: "",
    weight: "",
    pulse_rate: "",
    blood_pressure: "",
    spo2_percentage: "",
    location: "",
    addiction: "",
    intoxicated_at_admission: "No",
  });

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

  // Auto-fill helper: maps a raw PFA assessment object (whichever field
  // variant it comes in as) onto the FE create-form state.
  const applyPFAAutoFill = (pfa) => {
    const patientName = getPFAName(pfa);

    setSelectedUser({
      ...pfa,
      user_id: getPFAUserId(pfa),
      name: patientName,
      patient_name: patientName,
      gks_id: getPFAGksId(pfa),
    });
    setFormData((prev) => ({
      ...prev,
      dateOfAssessment: new Date(),
      patient_name: patientName || "",
      weight: pfa?.weight ?? "",
      pulse_rate: pfa?.pulse_rate ?? "",
      blood_pressure: pfa?.blood_pressure ?? "",
      spo2_percentage: pfa?.spo2_percentage ?? "",
      location: "",
      addiction: "",
    }));
  };

  // Auto fill FE form using PFA assessment data
  const createFEform = async (userId = null, pfaDataRow = null) => {
    if (typeof userId === "object" && userId !== null) {
      pfaDataRow = userId.pfaRaw || userId;
      userId = userId.userId || getPFAUserId(userId);
    }

    userId = userId || getPFAUserId(pfaDataRow);

    if (!isValidValue(userId)) {
      toast.error(
        getTranslation("User ID not found for this PFA record.", lang),
      );
      return;
    }

    const token = localStorage.getItem("Authorization");
    const branch_id = selectedBranch;

    setIsFEModalOpen(true);
    setIsLoading(true);

    try {
      const latestPFA =
        (await fetchLatestPFAAssessment(userId, token, branch_id)) ||
        pfaDataRow;

      if (!latestPFA) {
        console.warn(
          "No PFA assessment data found to auto-fill FE form for user",
          userId,
        );
        return;
      }

      applyPFAAutoFill(latestPFA);
    } catch (error) {
      console.error("Error fetching PFA details for FE create form:", error);
      // Fallback: use whatever row data we already have rather than leaving
      // the form completely blank.
      if (pfaDataRow) {
        applyPFAAutoFill(pfaDataRow);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const [isLoading, setIsLoading] = useState(false);

  // Submit New FE
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const payload = {
      user_id: getPFAUserId(selectedUser),
      date_of_assessment: formData.dateOfAssessment
        ? new Date(formData.dateOfAssessment).toISOString().split("T")[0]
        : null,
      patient_name: formData.patient_name?.trim() || null,
      weight: parseFloat(formData.weight) || 0,
      pulse_rate: Math.max(parseInt(formData.pulse_rate) || 0, 30),
      blood_pressure: formData.blood_pressure?.trim() || null,
      spo2_percentage: Math.max(parseInt(formData.spo2_percentage) || 0, 70),
      location: formData.location?.trim() || null,
      addiction: formData.addiction?.trim() || null,
      intoxicated_at_admission:
        formData.intoxicated_at_admission === "Yes" ? "Yes" : "No",
    };

    try {
      const token = localStorage.getItem("Authorization");
      const branch_id = selectedBranch;

      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/first-evaluation/create-assessment?branch_id=${branch_id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) throw new Error("API call failed");

      setIsLoading(false);
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
      FEID = FEID.first_evaluation_id || FEID.intake_fe_id;
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
        setViewFEData(fetchedData);
        setSelectedUser(fetchedData);
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
          spo2_percentage: latestAssessment.spo2_percentage,
          location: latestAssessment.location,
          addiction: latestAssessment.addiction,
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

    setIsLoading(true);
    const payload = {
      user_id: selectedUser?.user_id,
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
      location: FEEditData?.location || "",
      addiction: FEEditData?.addiction || "",
      intoxicated_at_admission: FEEditData?.intoxicated_at_admission || "",
      status: FEEditData?.status || "",
      isActive: FEEditData?.isActive || 1,
    };

    try {
      const branch_id = selectedBranch;
      const token = localStorage.getItem("Authorization");

      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/first-evaluation/update-assessment/${FEEditData.first_eval_id}?branch_id=${branch_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) throw new Error("API call failed");

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
        title: "Unexpected Error",
        text: getTranslation(
          "Failed to update First Evaluation assessment.",
          lang,
        ),
      });
    }
  };

  // Prefill FE Modal (Readmission)
  const [FEPrefillData, setFEPrefillData] = useState({});
  const [FEPrefillModal, setFEPrefillModal] = useState(false);

  const handleFEprefill = async (prefillFEID = null) => {
    if (typeof prefillFEID === "object" && prefillFEID !== null) {
      prefillFEID = prefillFEID.first_eval_id || prefillFEID.intake_fe_id;
    }

    if (!prefillFEID) return;

    const token = localStorage.getItem("Authorization");
    const branch_id = selectedBranch;

    try {
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/first-evaluation/assessment/${prefillFEID}?branch_id=${branch_id}`,
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
        setFEPrefillModal(true);
        setSelectedUser([latestAssessment]);

        setFEPrefillData({
          first_eval_id: latestAssessment.first_eval_id,
          user_id: latestAssessment.user_id,
          date_of_assessment: latestAssessment.date_of_assessment
            ? new Date(latestAssessment.date_of_assessment)
            : null,
          weight: latestAssessment.weight || "",
          pulse_rate: latestAssessment.pulse_rate || "",
          blood_pressure: latestAssessment.blood_pressure || "",
          spo2_percentage: latestAssessment.spo2_percentage || "",
          location: latestAssessment.location || "",
          addiction: latestAssessment.addiction || "",
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
    setIsLoading(true);

    const payload = {
      user_id: FEPrefillData?.user_id,
      date_of_assessment: FEPrefillData?.date_of_assessment
        ? new Date(FEPrefillData.date_of_assessment).toISOString().split("T")[0]
        : null,
      patient_name: FEPrefillData?.patient_name?.trim() || null,
      weight: parseFloat(FEPrefillData?.weight) || 0,
      pulse_rate: Math.max(parseInt(FEPrefillData?.pulse_rate) || 0, 30),
      blood_pressure: FEPrefillData?.blood_pressure?.trim() || null,
      spo2_percentage: Math.max(
        parseInt(FEPrefillData?.spo2_percentage) || 0,
        70,
      ),
      location: FEPrefillData?.location?.trim() || null,
      addiction: FEPrefillData?.addiction?.trim() || null,
      intoxicated_at_admission:
        FEPrefillData?.intoxicated_at_admission === "Yes" ? "Yes" : "No",
    };

    try {
      const token = localStorage.getItem("Authorization");
      const branch_id = selectedBranch;

      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/first-evaluation/create-assessment?branch_id=${branch_id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) throw new Error("API call failed");

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

  const handlePrint = useReactToPrint({
    content: () => pdfRef.current,
    pageStyle: `@page { size: A4; margin: 12mm; }`,
  });

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
                  <div className="row pb-2">
                    <div className="col-md-4">
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
                  <div className="row pb-2">
                    <div className="col-md-4">
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
          <form onSubmit={handleSubmit}>
            <div className="col-md-6 mb-3">
              <label className="col-sm-12 col-form-label col-xl-6">
                {getTranslation("Date of Assessment/मूल्यांकन की तिथि", lang)}
              </label>
              <div className="col-xl-5 col-sm-12">
                <DatePicker showMonthDropdown showYearDropdown dropdownMode="select"
                  className="form-control digits"
                  selected={formData.dateOfAssessment}
                  onChange={(date) =>
                    handleAssesmentDateChange("dateOfAssessment", date)
                  }
                />
              </div>
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
                  value={formData.spo2_percentage}
                  disabled
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="location">
                  {getTranslation("Location/जगह", lang)}
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  className="form-control"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="addiction">
                  {getTranslation("Addiction/लत", lang)}
                </label>
                <input
                  type="text"
                  id="addiction"
                  name="addiction"
                  className="form-control"
                  value={formData.addiction}
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

            <div className="d-flex gap-3">
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
        maxWidth="1200px"
      >
        <div className="table-responsive p-4" ref={pdfRef}>
          <h4
            style={{
              textAlign: "center",
              textDecoration: "underline",
              padding: "20px 0",
            }}
          >
            {getTranslation("First Evaluation / प्रथम मूल्यांकन", lang)}
          </h4>
          <Table size="sm" className="table-auto table-bordered">
            <tbody style={{ fontSize: "14px" }}>
              {viewFEData ? (
                <>
                  <tr>
                    <th className="text-start p-3">
                      {getTranslation(
                        "Date of assessment/मूल्यांकन की तिथि",
                        lang,
                      )}
                    </th>
                    <td className="border p-3">
                      {viewFEData.date_of_assessment
                        ? new Date(
                            viewFEData.date_of_assessment,
                          ).toLocaleDateString()
                        : ""}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">
                      {getTranslation("Patient Name/रोगी का नाम", lang)}
                    </th>
                    <td className="border p-3">
                      {viewFEData?.patient_name || viewFEData?.name}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">
                      {getTranslation("Weight/वज़न", lang)}
                    </th>
                    <td className="border p-3">{viewFEData?.weight}</td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">
                      {getTranslation("Pulse/नाड़ी", lang)}
                    </th>
                    <td className="border p-3">{viewFEData?.pulse_rate}</td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">Blood Pressure</th>
                    <td className="border p-3">{viewFEData.blood_pressure}</td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">SpO2 (%)</th>
                    <td className="border p-3">{viewFEData.spo2_percentage}</td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">
                      {getTranslation("Location/जगह", lang)}
                    </th>
                    <td className="border p-3">{viewFEData.location}</td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">
                      {getTranslation("Addiction/लत", lang)}
                    </th>
                    <td className="border p-3">{viewFEData.addiction}</td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">
                      {getTranslation(
                        "Intoxicated at the time of admission/प्रवेश के समय नशे में",
                        lang,
                      )}
                    </th>
                    <td className="border p-3">
                      {viewFEData.intoxicated_at_admission}
                    </td>
                  </tr>
                </>
              ) : (
                <tr>
                  <td colSpan="2" className="text-center">
                    {getTranslation(
                      "No data available/कोई डेटा मौजूद नहीं",
                      lang,
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
        <div style={{ margin: "0 20px 20px 20px" }}>
          <button
            disabled={pfaDownload}
            className="btn btn-primary"
            onClick={handleDownloadPDF}
          >
            {pfaDownload
              ? getTranslation("Downloading.../डाउनलोड हो रहा है...", lang)
              : getTranslation("Download Your First Exam Form(FE)", lang)}
          </button>
          <button className="btn btn-primary mx-3" onClick={handlePrint}>
            {getTranslation("Print Your Data/अपना डेटा प्रिंट करें", lang)}
          </button>
        </div>
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
            onSubmit={(e) => {
              e.preventDefault();
              handleFEUpdate();
            }}
          >
            <div className="col-md-6 mb-3">
              <label className="col-sm-12 col-form-label col-xl-6">
                {getTranslation("Date of Assessment/मूल्यांकन की तिथि", lang)}
              </label>
              <div className="col-xl-5 col-sm-12">
                <DatePicker showMonthDropdown showYearDropdown dropdownMode="select"
                  className="form-control digits"
                  selected={FEEditData?.date_of_assessment}
                  onChange={(date) =>
                    setFEEditData((prev) => ({
                      ...prev,
                      date_of_assessment: date,
                    }))
                  }
                />
              </div>
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
                <label htmlFor="spo2">SpO2 (%)</label>
                <input
                  type="number"
                  id="spo2"
                  className="form-control"
                  value={FEEditData?.spo2_percentage || ""}
                  disabled
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="location">
                  {getTranslation("Location/जगह", lang)}
                </label>
                <input
                  type="text"
                  id="location"
                  className="form-control"
                  value={FEEditData?.location || ""}
                  onChange={(e) =>
                    setFEEditData((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="addiction">
                  {getTranslation("Addiction/लत", lang)}
                </label>
                <input
                  type="text"
                  id="addiction"
                  className="form-control"
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

            <div className="form-check mb-3">
              <input
                type="checkbox"
                id="intoxicated"
                className="form-check-input checkbox_animated"
                checked={FEEditData?.intoxicated_at_admission === "Yes"}
                onChange={(e) =>
                  setFEEditData((prev) => ({
                    ...prev,
                    intoxicated_at_admission: e.target.checked ? "Yes" : "No",
                  }))
                }
              />
              <label className="form-check-label" htmlFor="intoxicated">
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
          <form onSubmit={handleReadmissionSubmit}>
            <div className="col-md-6 mb-3">
              <label className="col-sm-12 col-form-label col-xl-6">
                {getTranslation("Date of Assessment/मूल्यांकन की तिथि", lang)}
              </label>
              <div className="col-xl-5 col-sm-12">
                <DatePicker showMonthDropdown showYearDropdown dropdownMode="select"
                  className="form-control digits"
                  selected={FEPrefillData?.date_of_assessment || null}
                  onChange={(date) =>
                    setFEPrefillData((prev) => ({
                      ...prev,
                      date_of_assessment: date,
                    }))
                  }
                />
              </div>
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
                <label htmlFor="spo2">SpO2 (%)</label>
                <input
                  type="number"
                  id="spo2"
                  className="form-control"
                  value={FEPrefillData?.spo2_percentage || ""}
                  disabled
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="location">
                  {getTranslation("Location/जगह", lang)}
                </label>
                <input
                  type="text"
                  id="location"
                  className="form-control"
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
                <label htmlFor="addiction">
                  {getTranslation("Addiction/लत", lang)}
                </label>
                <input
                  type="text"
                  id="addiction"
                  className="form-control"
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

            <div className="form-check mb-3">
              <input
                type="checkbox"
                id="intoxicated"
                className="form-check-input checkbox_animated"
                checked={FEPrefillData?.intoxicated_at_admission === "Yes"}
                onChange={(e) =>
                  setFEPrefillData((prev) => ({
                    ...prev,
                    intoxicated_at_admission: e.target.checked ? "Yes" : "No",
                  }))
                }
              />
              <label className="form-check-label" htmlFor="intoxicated">
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
    </Fragment>
  );
};

export default FirstExamination;
