import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
  Button,
  Badge,
  Input,
  InputGroup,
  Progress,
  Spinner,
} from "reactstrap";
import { Link, useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import { useBranch } from "../../contexts/BranchContext";
import { useLang } from "../../contexts/LangContext";
import { getTranslation } from "../../utils/translator";
import { Breadcrumbs } from "../../AbstractElements";
import TableExportButtons from "../Common/TableExportButtons";
import UserDetailsModal from "../Common/UserDetailsModal";
import { toast } from "react-toastify";

const BASE_URL = "https://gks-yjdc.onrender.com";

const CombinedFormsReport = () => {
  const navigate = useNavigate();
  const { lang } = useLang();
  const { selectedBranch } = useBranch();
  const branchId =
    selectedBranch?.branch_id || selectedBranch?.id || selectedBranch || "";

  // Loading & State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [dashboardSummary, setDashboardSummary] = useState(null);

  // User detail modal
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [viewUserModal, setViewUserModal] = useState(false);

  // Filters
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'admitted', 'discharged'
  const [formFilter, setFormFilter] = useState("all"); // 'all', 'pfa_pending', etc.
  const [activeTab, setActiveTab] = useState("matrix"); // 'matrix' or 'modules'

  // Fetch all required data
  const fetchData = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    const token = localStorage.getItem("Authorization");
    const headers = {
      "Content-Type": "application/json",
      Authorization: `${token}`,
      "x-target-branch": String(branchId),
    };

    try {
      // 1. Fetch Users
      const usersPromise = fetch(`${BASE_URL}/api/users?branch_id=${branchId}`, {
        method: "GET",
        headers,
      }).then((res) => (res.ok ? res.json() : null)).catch(() => null);

      // 2. Fetch Dashboard Summary
      const summaryPromise = fetch(`${BASE_URL}/api/dashboard/summary?branch_id=${branchId}`, {
        method: "GET",
        headers,
      }).then((res) => (res.ok ? res.json() : null)).catch(() => null);

      // 3. Fetch Discharge Records
      const dischargePromise = fetch(`${BASE_URL}/api/discharge-follow-up/all/follow-ups?branch_id=${branchId}`, {
        method: "GET",
        headers,
      }).then((res) => (res.ok ? res.json() : null)).catch(() => null);

      // 4. Fetch Brief Intervention Records
      const biPromise = fetch(`${BASE_URL}/api/brief-intervention/all-entries?branch_id=${branchId}`, {
        method: "GET",
        headers,
      }).then((res) => (res.ok ? res.json() : null)).catch(() => null);

      const [usersRes, summaryRes, dischargeRes, biRes] = await Promise.all([
        usersPromise,
        summaryPromise,
        dischargePromise,
        biPromise,
      ]);

      if (summaryRes?.data) {
        setDashboardSummary(summaryRes.data);
      }

      // Map Discharge Records
      const dischargeMap = new Map();
      if (dischargeRes?.data && Array.isArray(dischargeRes.data)) {
        dischargeRes.data.forEach((item) => {
          const uId = item.user_id || item.user?.user_id;
          if (uId) {
            dischargeMap.set(String(uId), {
              discharge_date: item.followup_discharge_date || item.discharge_date,
              followup_date: item.followup_date,
              remarks: item.followup_doctor_remark,
              report_url: item.followup_report_url,
            });
          }
        });
      }

      // Check LocalStorage fallback for discharges
      try {
        const localDischarge = JSON.parse(
          localStorage.getItem(`gks_discharge_followups_${branchId}`) || "[]"
        );
        localDischarge.forEach((item) => {
          const uId = item.user_id || item.user?.user_id;
          if (uId && !dischargeMap.has(String(uId))) {
            dischargeMap.set(String(uId), {
              discharge_date: item.followup_discharge_date || item.discharge_date,
              followup_date: item.followup_date,
              remarks: item.followup_doctor_remark,
              report_url: item.followup_report_url,
            });
          }
        });
      } catch (e) {
        console.warn("Error reading local discharges:", e);
      }

      // Map Brief Intervention Records
      const biSet = new Set();
      if (biRes?.data && Array.isArray(biRes.data)) {
        biRes.data.forEach((item) => {
          const uId = item.user_id || item.user?.user_id;
          if (uId) biSet.add(String(uId));
        });
      }
      try {
        const localBi = JSON.parse(
          localStorage.getItem(`gks_brief_interventions_${branchId}`) || "[]"
        );
        localBi.forEach((item) => {
          const uId = item.user_id || item.user?.user_id;
          if (uId) biSet.add(String(uId));
        });
      } catch (e) {
        console.warn("Error reading local BI:", e);
      }

      // Format Patients Matrix
      const rawUsers = usersRes?.data || [];
      const formatted = rawUsers.map((user) => {
        const uId = String(user.user_id || user.id);
        const dischargeInfo = dischargeMap.get(uId);

        // Individual form completion checks
        const pfaDone = Boolean(user.recent_pfa_date || user.recent_pfa_id || user.pfa_status === "Completed");
        const genFamDone = Boolean(user.recent_gen_fam_date || user.recent_gen_fam_id);
        const feDone = Boolean(user.recent_first_eval_date || user.recent_first_eval_id || user.recentFEId);
        const baDone = Boolean(user.recent_blood_analysis_date || user.recent_blood_analysis_id || user.recentBAId);
        const detoxDone = Boolean(user.recent_detox_end_date || user.recent_detox_id || user.recentDetoxId);
        const fdaDone = Boolean(user.recent_fda_date || user.recent_fda_id);
        const sudDone = Boolean(user.recent_sda_date || user.recent_sda_id || user.recent_sud_date || user.recent_sud_id);
        const cbtDone = Boolean(user.recent_cbt_date || user.recent_cbt_id);
        const biDone = Boolean(user.recent_brief_intervention_date || user.recent_bi_id || biSet.has(uId));
        const isDischarged = Boolean(
          user.discharge_status === 1 ||
          user.discharge_status_text?.toLowerCase() === "discharged" ||
          dischargeInfo
        );

        // Clinical assessment completion counter (9 clinical forms excluding discharge)
        const clinicalChecks = [pfaDone, genFamDone, feDone, baDone, detoxDone, fdaDone, sudDone, cbtDone, biDone];
        const completedCount = clinicalChecks.filter(Boolean).length;
        const completionPercentage = Math.round((completedCount / 9) * 100);

        const admitDateStr = user.recent_admit_date || user.admit_date || user.created_at;
        const admitDateFormatted = admitDateStr
          ? new Date(admitDateStr).toLocaleDateString()
          : "N/A";

        return {
          user_id: user.user_id || user.id,
          id: user.user_id || user.id,
          gks_id: user.gks_id || "N/A",
          name: user.name || "N/A",
          phone: user.phone || "N/A",
          email: user.email || "N/A",
          admit_date: admitDateFormatted,
          raw_admit_date: admitDateStr,
          is_discharged: isDischarged,
          status_text: isDischarged ? "Discharged" : "Admitted",
          discharge_date: dischargeInfo?.discharge_date
            ? new Date(dischargeInfo.discharge_date).toLocaleDateString()
            : user.recent_discharge_date
            ? new Date(user.recent_discharge_date).toLocaleDateString()
            : "-",

          // Module statuses & dates
          pfa: {
            done: pfaDone,
            date: user.recent_pfa_date ? new Date(user.recent_pfa_date).toLocaleDateString() : "-",
          },
          gen_family: {
            done: genFamDone,
            date: user.recent_gen_fam_date ? new Date(user.recent_gen_fam_date).toLocaleDateString() : "-",
          },
          fe: {
            done: feDone,
            date: user.recent_first_eval_date ? new Date(user.recent_first_eval_date).toLocaleDateString() : "-",
          },
          ba: {
            done: baDone,
            date: user.recent_blood_analysis_date ? new Date(user.recent_blood_analysis_date).toLocaleDateString() : "-",
          },
          detox: {
            done: detoxDone,
            date: user.recent_detox_end_date ? new Date(user.recent_detox_end_date).toLocaleDateString() : "-",
          },
          fda: {
            done: fdaDone,
            date: user.recent_fda_date ? new Date(user.recent_fda_date).toLocaleDateString() : "-",
          },
          sud: {
            done: sudDone,
            date: (user.recent_sda_date || user.recent_sud_date)
              ? new Date(user.recent_sda_date || user.recent_sud_date).toLocaleDateString()
              : "-",
          },
          cbt: {
            done: cbtDone,
            date: user.recent_cbt_date ? new Date(user.recent_cbt_date).toLocaleDateString() : "-",
          },
          bi: {
            done: biDone,
            date: user.recent_brief_intervention_date ? new Date(user.recent_brief_intervention_date).toLocaleDateString() : "-",
          },

          completed_count: completedCount,
          completion_percentage: completionPercentage,
        };
      });

      setPatients(formatted);
      setFilteredPatients(formatted);
    } catch (err) {
      console.error("Error fetching combined report data:", err);
      toast.error(getTranslation("Failed to load report data/रिपोर्ट डेटा लोड करने में विफल", lang));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [branchId, lang]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Filter application
  useEffect(() => {
    let list = [...patients];

    // 1. Text search
    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.gks_id?.toLowerCase().includes(q) ||
          p.phone?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q)
      );
    }

    // 2. Admission Status filter
    if (statusFilter === "admitted") {
      list = list.filter((p) => !p.is_discharged);
    } else if (statusFilter === "discharged") {
      list = list.filter((p) => p.is_discharged);
    }

    // 3. Form-specific completion filter
    if (formFilter === "pfa_pending") list = list.filter((p) => !p.pfa.done);
    else if (formFilter === "pfa_done") list = list.filter((p) => p.pfa.done);
    else if (formFilter === "gen_family_pending") list = list.filter((p) => !p.gen_family.done);
    else if (formFilter === "fe_pending") list = list.filter((p) => !p.fe.done);
    else if (formFilter === "ba_pending") list = list.filter((p) => !p.ba.done);
    else if (formFilter === "detox_pending") list = list.filter((p) => !p.detox.done);
    else if (formFilter === "fda_pending") list = list.filter((p) => !p.fda.done);
    else if (formFilter === "sud_pending") list = list.filter((p) => !p.sud.done);
    else if (formFilter === "cbt_pending") list = list.filter((p) => !p.cbt.done);
    else if (formFilter === "bi_pending") list = list.filter((p) => !p.bi.done);
    else if (formFilter === "all_completed") list = list.filter((p) => p.completed_count === 9);

    setFilteredPatients(list);
  }, [searchText, statusFilter, formFilter, patients]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = patients.length;
    const discharged = patients.filter((p) => p.is_discharged).length;
    const admitted = total - discharged;

    const pfaDone = patients.filter((p) => p.pfa.done).length;
    const genFamDone = patients.filter((p) => p.gen_family.done).length;
    const feDone = patients.filter((p) => p.fe.done).length;
    const baDone = patients.filter((p) => p.ba.done).length;
    const detoxDone = patients.filter((p) => p.detox.done).length;
    const fdaDone = patients.filter((p) => p.fda.done).length;
    const sudDone = patients.filter((p) => p.sud.done).length;
    const cbtDone = patients.filter((p) => p.cbt.done).length;
    const biDone = patients.filter((p) => p.bi.done).length;

    const totalPossibleAssessments = total * 9;
    const totalCompletedAssessments =
      pfaDone + genFamDone + feDone + baDone + detoxDone + fdaDone + sudDone + cbtDone + biDone;
    const overallRate = totalPossibleAssessments > 0
      ? Math.round((totalCompletedAssessments / totalPossibleAssessments) * 100)
      : 0;

    return {
      total,
      admitted,
      discharged,
      pfaDone,
      genFamDone,
      feDone,
      baDone,
      detoxDone,
      fdaDone,
      sudDone,
      cbtDone,
      biDone,
      totalCompletedAssessments,
      totalPossibleAssessments,
      overallRate,
    };
  }, [patients]);

  // Module Breakdown List
  const modulesList = useMemo(() => {
    const t = metrics.total;
    return [
      {
        key: "pfa",
        name: "Patient First Assessment (PFA)",
        nameHi: "रोगी प्रथम मूल्यांकन (पीएफए)",
        path: `${process.env.PUBLIC_URL}/PFA-Menu/pfa`,
        completed: metrics.pfaDone,
        pending: t - metrics.pfaDone,
        total: t,
        rate: t > 0 ? Math.round((metrics.pfaDone / t) * 100) : 0,
        color: "#24695c",
        tag: "Initial / प्राथमिक",
      },
      {
        key: "gen_family",
        name: "General Family Assessment",
        nameHi: "सामान्य परिवार मूल्यांकन",
        path: `${process.env.PUBLIC_URL}/Gen-Family/gen-family`,
        completed: metrics.genFamDone,
        pending: t - metrics.genFamDone,
        total: t,
        rate: t > 0 ? Math.round((metrics.genFamDone / t) * 100) : 0,
        color: "#0284c7",
        tag: "Family / परिवार",
      },
      {
        key: "fe",
        name: "First Examination (FE)",
        nameHi: "पहली परीक्षा (एफई)",
        path: `${process.env.PUBLIC_URL}/FE/First-Examination`,
        completed: metrics.feDone,
        pending: t - metrics.feDone,
        total: t,
        rate: t > 0 ? Math.round((metrics.feDone / t) * 100) : 0,
        color: "#d56337",
        tag: "Clinical / नैदानिक",
      },
      {
        key: "ba",
        name: "Blood Analysis (BA)",
        nameHi: "रक्त विश्लेषण (बीए)",
        path: `${process.env.PUBLIC_URL}/BA/Blood-Analysis`,
        completed: metrics.baDone,
        pending: t - metrics.baDone,
        total: t,
        rate: t > 0 ? Math.round((metrics.baDone / t) * 100) : 0,
        color: "#e11d48",
        tag: "Lab / लैब",
      },
      {
        key: "detox",
        name: "Detoxification (Detox)",
        nameHi: "डिटॉक्सिफिकेशन",
        path: `${process.env.PUBLIC_URL}/Detoxification/Detoxification`,
        completed: metrics.detoxDone,
        pending: t - metrics.detoxDone,
        total: t,
        rate: t > 0 ? Math.round((metrics.detoxDone / t) * 100) : 0,
        color: "#7c3aed",
        tag: "Medical / चिकित्सा",
      },
      {
        key: "fda",
        name: "First Dependency Assessment (FDA)",
        nameHi: "पहला निर्भरता मूल्यांकन (एफडीए)",
        path: `${process.env.PUBLIC_URL}/FDA/first-dependency-assessment`,
        completed: metrics.fdaDone,
        pending: t - metrics.fdaDone,
        total: t,
        rate: t > 0 ? Math.round((metrics.fdaDone / t) * 100) : 0,
        color: "#059669",
        tag: "Assessment / मूल्यांकन",
      },
      {
        key: "sud",
        name: "Substance Use Dependency (SUD)",
        nameHi: "पदार्थ के उपयोग पर निर्भरता",
        path: `${process.env.PUBLIC_URL}/SUD/substance-use-dependency`,
        completed: metrics.sudDone,
        pending: t - metrics.sudDone,
        total: t,
        rate: t > 0 ? Math.round((metrics.sudDone / t) * 100) : 0,
        color: "#b45309",
        tag: "Addiction / व्यसन",
      },
      {
        key: "cbt",
        name: "Cognitive Behavioral Test (CBT)",
        nameHi: "संज्ञानात्मक व्यवहार परीक्षण (सीबीटी)",
        path: `${process.env.PUBLIC_URL}/CBT_Intake_Sex_D/CBT`,
        completed: metrics.cbtDone,
        pending: t - metrics.cbtDone,
        total: t,
        rate: t > 0 ? Math.round((metrics.cbtDone / t) * 100) : 0,
        color: "#0891b2",
        tag: "Therapy / थेरेपी",
      },
      {
        key: "bi",
        name: "Brief Intervention (BI)",
        nameHi: "संक्षिप्त हस्तक्षेप",
        path: `${process.env.PUBLIC_URL}/Brief_Intervation/BriefIntervation`,
        completed: metrics.biDone,
        pending: t - metrics.biDone,
        total: t,
        rate: t > 0 ? Math.round((metrics.biDone / t) * 100) : 0,
        color: "#4f46e5",
        tag: "Counseling / परामर्श",
      },
      {
        key: "discharge",
        name: "Discharge Follow Up",
        nameHi: "डिस्चार्ज फॉलो अप",
        path: `${process.env.PUBLIC_URL}/Discharge_followup/DischargeFollowUp`,
        completed: metrics.discharged,
        pending: metrics.admitted,
        total: t,
        rate: t > 0 ? Math.round((metrics.discharged / t) * 100) : 0,
        color: "#334155",
        tag: "Discharge / डिस्चार्ज",
      },
    ];
  }, [metrics]);

  // Helper Badge for cell status
  const renderStatusBadge = (field) => {
    if (field.done) {
      return (
        <div className="d-flex flex-column align-items-center">
          <Badge
            color="success"
            pill
            style={{
              fontSize: "11px",
              padding: "4px 8px",
              fontWeight: "600",
              backgroundColor: "#24695c",
            }}
          >
            ✓ {getTranslation("Done/पूर्ण", lang)}
          </Badge>
          {field.date && field.date !== "-" && (
            <span className="text-muted extra-small mt-0.5" style={{ fontSize: "10px" }}>
              {field.date}
            </span>
          )}
        </div>
      );
    }
    return (
      <Badge
        pill
        className="bg-warning text-dark border border-warning"
        style={{
          fontSize: "11px",
          padding: "4px 9px",
          fontWeight: "700",
          letterSpacing: "0.2px",
          display: "inline-block",
        }}
      >
        {getTranslation("Pending/लंबित", lang)}
      </Badge>
    );
  };

  // DataTable Columns for Patient Matrix
  const columns = useMemo(
    () => [
      {
        name: getTranslation("GKS ID/GKS आईडी", lang),
        selector: (row) => row.gks_id,
        sortable: true,
        center: true,
        width: "110px",
        cell: (row) => (
          <span className="fw-semibold text-primary" style={{ fontSize: "12.5px" }}>
            {row.gks_id}
          </span>
        ),
      },
      {
        name: getTranslation("Patient Name/रोगी का नाम", lang),
        selector: (row) => row.name,
        sortable: true,
        minWidth: "160px",
        cell: (row) => (
          <div
            onClick={() => {
              setSelectedUserId(row.user_id);
              setViewUserModal(true);
            }}
            style={{ cursor: "pointer" }}
            title={getTranslation("Click to view details/विवरण देखने के लिए क्लिक करें", lang)}
          >
            <div className="fw-bold text-dark text-truncate" style={{ fontSize: "13px" }}>
              {row.name}
            </div>
            <div className="text-muted extra-small" style={{ fontSize: "11px" }}>
              {row.phone}
            </div>
          </div>
        ),
      },
      {
        name: getTranslation("Admit Date/प्रवेश तिथि", lang),
        selector: (row) => row.admit_date,
        sortable: true,
        center: true,
        width: "110px",
        cell: (row) => (
          <span className="text-muted small" style={{ fontSize: "11.5px" }}>
            {row.admit_date}
          </span>
        ),
      },
      {
        name: getTranslation("Status/स्थिति", lang),
        selector: (row) => row.status_text,
        sortable: true,
        center: true,
        width: "115px",
        cell: (row) =>
          row.is_discharged ? (
            <Badge color="dark" pill style={{ fontSize: "11px", padding: "4px 8px" }}>
              {getTranslation("Discharged/डिस्चार्ज", lang)}
            </Badge>
          ) : (
            <Badge color="success" pill style={{ fontSize: "11px", padding: "4px 8px" }}>
              {getTranslation("Admitted/भर्ती", lang)}
            </Badge>
          ),
      },
      {
        name: "PFA",
        selector: (row) => (row.pfa.done ? "Done" : "Pending"),
        sortable: true,
        center: true,
        width: "100px",
        cell: (row) => renderStatusBadge(row.pfa),
      },
      {
        name: "Gen Family",
        selector: (row) => (row.gen_family.done ? "Done" : "Pending"),
        sortable: true,
        center: true,
        width: "105px",
        cell: (row) => renderStatusBadge(row.gen_family),
      },
      {
        name: "FE (Exam)",
        selector: (row) => (row.fe.done ? "Done" : "Pending"),
        sortable: true,
        center: true,
        width: "100px",
        cell: (row) => renderStatusBadge(row.fe),
      },
      {
        name: "BA (Blood)",
        selector: (row) => (row.ba.done ? "Done" : "Pending"),
        sortable: true,
        center: true,
        width: "100px",
        cell: (row) => renderStatusBadge(row.ba),
      },
      {
        name: "Detox",
        selector: (row) => (row.detox.done ? "Done" : "Pending"),
        sortable: true,
        center: true,
        width: "100px",
        cell: (row) => renderStatusBadge(row.detox),
      },
      {
        name: "FDA",
        selector: (row) => (row.fda.done ? "Done" : "Pending"),
        sortable: true,
        center: true,
        width: "100px",
        cell: (row) => renderStatusBadge(row.fda),
      },
      {
        name: "SUD",
        selector: (row) => (row.sud.done ? "Done" : "Pending"),
        sortable: true,
        center: true,
        width: "100px",
        cell: (row) => renderStatusBadge(row.sud),
      },
      {
        name: "CBT",
        selector: (row) => (row.cbt.done ? "Done" : "Pending"),
        sortable: true,
        center: true,
        width: "100px",
        cell: (row) => renderStatusBadge(row.cbt),
      },
      {
        name: "BI",
        selector: (row) => (row.bi.done ? "Done" : "Pending"),
        sortable: true,
        center: true,
        width: "100px",
        cell: (row) => renderStatusBadge(row.bi),
      },
      {
        name: getTranslation("Progress/प्रगति", lang),
        selector: (row) => row.completion_percentage,
        sortable: true,
        center: true,
        width: "130px",
        cell: (row) => (
          <div className="w-100 px-1">
            <div className="d-flex justify-content-between text-muted extra-small mb-1" style={{ fontSize: "11px" }}>
              <span>{row.completed_count}/9 {getTranslation("Forms/फॉर्म", lang)}</span>
              <span className="fw-semibold text-dark">{row.completion_percentage}%</span>
            </div>
            <Progress
              value={row.completion_percentage}
              style={{ height: "6px" }}
              color={
                row.completion_percentage >= 75
                  ? "success"
                  : row.completion_percentage >= 40
                  ? "warning"
                  : "danger"
              }
            />
          </div>
        ),
      },
      {
        name: getTranslation("Action/कार्रवाई", lang),
        center: true,
        width: "80px",
        ignoreExport: true,
        cell: (row) => (
          <span
            onClick={() => {
              setSelectedUserId(row.user_id);
              setViewUserModal(true);
            }}
            style={{ cursor: "pointer" }}
            title={getTranslation("View Patient Profile/रोगी प्रोफाइल देखें", lang)}
          >
            <svg
              style={{ color: "#d56337" }}
              xmlns="http://www.w3.org/2000/svg"
              width="19"
              height="19"
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
        ),
      },
    ],
    [lang]
  );

  return (
    <>
      <Breadcrumbs
        parent={getTranslation("Reports/रिपोर्टों", lang)}
        title={getTranslation("All Forms Combined Report/सभी फॉर्म संयुक्त रिपोर्ट", lang)}
        mainTitle={getTranslation("All Forms Combined Report/सभी फॉर्म संयुक्त रिपोर्ट", lang)}
      />

      <Container fluid className="combined-forms-report mb-4">
        {/* Top Header Card */}
        <Card className="border-0 shadow-sm mb-4">
          <CardBody className="p-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
              <div>
                <h4 className="fw-bold mb-1" style={{ color: "#0f172a" }}>
                  {getTranslation("Consolidated Clinical Forms & Assessments/समेकित नैदानिक ​​फॉर्म और मूल्यांकन", lang)}
                </h4>
                <p className="text-muted small mb-0">
                  {getTranslation(
                    "Real-time overview of PFA and all clinical forms completed across patients for audit and administrative review./लेखापरीक्षा और प्रशासनिक समीक्षा के लिए रोगियों में पूर्ण किए गए पीएफए ​​और सभी नैदानिक ​​फॉर्मों का वास्तविक समय अवलोकन।",
                    lang
                  )}
                </p>
              </div>

              <div className="d-flex align-items-center flex-wrap gap-2">
                {dashboardSummary?.overall?.completion_percentage !== undefined && (
                  <span
                    className="badge bg-light text-dark border px-3 py-2"
                    style={{ fontSize: "12px", borderRadius: "8px" }}
                  >
                    📈 {getTranslation("Overall Progress/कुल प्रगति", lang)}:{" "}
                    <strong className="text-primary">
                      {dashboardSummary.overall.completion_percentage}%
                    </strong>
                  </span>
                )}
                <Button
                  color="light"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing || loading}
                  className="d-flex align-items-center gap-2 border shadow-sm"
                  style={{ borderRadius: "8px", fontWeight: 600 }}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={refreshing ? "fa-spin" : ""}
                  >
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <polyline points="1 20 1 14 7 14"></polyline>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                  </svg>
                  <span>{refreshing ? getTranslation("Refreshing.../ताज़ा हो रहा है...", lang) : getTranslation("Refresh/ताज़ा करें", lang)}</span>
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* KPI Stat Cards */}
        <Row className="g-3 mb-4">
          {/* Card 1: Total Patients */}
          <Col xl="3" sm="6">
            <Card className="h-100 border shadow-sm" style={{ borderRadius: "12px" }}>
              <CardBody className="p-3 d-flex flex-column justify-content-between">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      backgroundColor: "#e0f2fe",
                      color: "#0284c7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <Badge color="light" className="text-secondary border">
                    {getTranslation("Active & Discharged/सक्रिय और डिस्चार्ज", lang)}
                  </Badge>
                </div>
                <div>
                  <h3 className="fw-bold mb-0 text-dark">
                    {loading ? "..." : metrics.total}
                  </h3>
                  <div className="text-muted small fw-medium mt-1">
                    {getTranslation("Total Registered Patients/कुल पंजीकृत मरीज़", lang)}
                  </div>
                  <div className="d-flex gap-2 mt-2 pt-1 border-top extra-small" style={{ fontSize: "11.5px" }}>
                    <span className="text-success fw-semibold">
                      ● {metrics.admitted} {getTranslation("Admitted/भर्ती", lang)}
                    </span>
                    <span className="text-muted">|</span>
                    <span className="text-secondary fw-semibold">
                      ● {metrics.discharged} {getTranslation("Discharged/डिस्चार्ज", lang)}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>

          {/* Card 2: Clinical Assessments Completed */}
          <Col xl="3" sm="6">
            <Card className="h-100 border shadow-sm" style={{ borderRadius: "12px" }}>
              <CardBody className="p-3 d-flex flex-column justify-content-between">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      backgroundColor: "#dcfce7",
                      color: "#16a34a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 11 12 14 22 4"></polyline>
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                    </svg>
                  </div>
                  <Badge color="success" pill>
                    {metrics.overallRate}% {getTranslation("Done/पूर्ण", lang)}
                  </Badge>
                </div>
                <div>
                  <h3 className="fw-bold mb-0 text-dark">
                    {loading ? "..." : metrics.totalCompletedAssessments}
                  </h3>
                  <div className="text-muted small fw-medium mt-1">
                    {getTranslation("Assessments Completed/पूर्ण किए गए मूल्यांकन", lang)}
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-2 pt-1 border-top extra-small" style={{ fontSize: "11.5px" }}>
                    <span className="text-muted">
                      {getTranslation("Expected/अपेक्षित", lang)}: {metrics.totalPossibleAssessments}
                    </span>
                    <span className="fw-bold" style={{ color: "#b45309" }}>
                      {metrics.totalPossibleAssessments - metrics.totalCompletedAssessments} {getTranslation("Pending/लंबित", lang)}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>

          {/* Card 3: PFA Completed */}
          <Col xl="3" sm="6">
            <Card className="h-100 border shadow-sm" style={{ borderRadius: "12px" }}>
              <CardBody className="p-3 d-flex flex-column justify-content-between">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      backgroundColor: "#e6fffa",
                      color: "#24695c",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                  </div>
                  <Badge
                    style={{ backgroundColor: "#24695c" }}
                    pill
                  >
                    {metrics.total > 0 ? Math.round((metrics.pfaDone / metrics.total) * 100) : 0}%
                  </Badge>
                </div>
                <div>
                  <h3 className="fw-bold mb-0 text-dark">
                    {loading ? "..." : metrics.pfaDone}
                  </h3>
                  <div className="text-muted small fw-medium mt-1">
                    {getTranslation("PFA Completed/पीएफए ​​पूर्ण", lang)}
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-2 pt-1 border-top extra-small" style={{ fontSize: "11.5px" }}>
                    <span className="text-muted">
                      {getTranslation("Pending/लंबित", lang)}: {metrics.total - metrics.pfaDone}
                    </span>
                    <Link
                      to={`${process.env.PUBLIC_URL}/PFA-Menu/pfa`}
                      className="text-decoration-none fw-semibold"
                      style={{ color: "#24695c" }}
                    >
                      {getTranslation("PFA Form/पीएफए ​​फॉर्म →", lang)}
                    </Link>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>

          {/* Card 4: Discharged Patients */}
          <Col xl="3" sm="6">
            <Card className="h-100 border shadow-sm" style={{ borderRadius: "12px" }}>
              <CardBody className="p-3 d-flex flex-column justify-content-between">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      backgroundColor: "#ffedd5",
                      color: "#ea580c",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                  </div>
                  <Badge color="warning" pill>
                    {metrics.total > 0 ? Math.round((metrics.discharged / metrics.total) * 100) : 0}%
                  </Badge>
                </div>
                <div>
                  <h3 className="fw-bold mb-0 text-dark">
                    {loading ? "..." : metrics.discharged}
                  </h3>
                  <div className="text-muted small fw-medium mt-1">
                    {getTranslation("Discharged Patients/डिस्चार्ज मरीज़", lang)}
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-2 pt-1 border-top extra-small" style={{ fontSize: "11.5px" }}>
                    <span className="text-success fw-semibold">
                      {metrics.admitted} {getTranslation("Still Admitted/वर्तमान में भर्ती", lang)}
                    </span>
                    <Link
                      to={`${process.env.PUBLIC_URL}/Discharge_followup/DischargeFollowUp`}
                      className="text-decoration-none fw-semibold"
                      style={{ color: "#ea580c" }}
                    >
                      {getTranslation("Follow-up/फॉलो अप →", lang)}
                    </Link>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* View Toggle Tabs */}
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <div className="btn-group shadow-sm" role="group">
            <Button
              color={activeTab === "matrix" ? "primary" : "light"}
              size="sm"
              onClick={() => setActiveTab("matrix")}
              style={{
                backgroundColor: activeTab === "matrix" ? "#24695c" : "#ffffff",
                borderColor: activeTab === "matrix" ? "#24695c" : "#e2e8f0",
                color: activeTab === "matrix" ? "#ffffff" : "#475569",
                fontWeight: 600,
                borderRadius: "8px 0 0 8px",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="3" y1="15" x2="21" y2="15"></line>
                <line x1="9" y1="3" x2="9" y2="21"></line>
                <line x1="15" y1="3" x2="15" y2="21"></line>
              </svg>
              {getTranslation("Patient-Wise Forms Matrix/मरीज़-वार फॉर्म मैट्रिक्स", lang)}
            </Button>
            <Button
              color={activeTab === "modules" ? "primary" : "light"}
              size="sm"
              onClick={() => setActiveTab("modules")}
              style={{
                backgroundColor: activeTab === "modules" ? "#24695c" : "#ffffff",
                borderColor: activeTab === "modules" ? "#24695c" : "#e2e8f0",
                color: activeTab === "modules" ? "#ffffff" : "#475569",
                fontWeight: 600,
                borderRadius: "0 8px 8px 0",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
              {getTranslation("Modules Completion Overview/मॉड्यूल पूर्णता अवलोकन", lang)}
            </Button>
          </div>

          <div className="text-muted small">
            {getTranslation("Showing/दिखा रहे हैं", lang)}: <strong>{filteredPatients.length}</strong> / {patients.length} {getTranslation("Patients/मरीज़", lang)}
          </div>
        </div>

        {/* TAB 1: Patient Matrix */}
        {activeTab === "matrix" && (
          <Card className="border shadow-sm" style={{ borderRadius: "12px" }}>
            <CardHeader className="bg-white border-bottom p-3">
              <Row className="g-2 align-items-center">
                {/* Search Bar */}
                <Col md="4" sm="12">
                  <InputGroup size="sm">
                    <Input
                      type="text"
                      placeholder={getTranslation("Search by Patient Name, GKS ID, Phone.../मरीज़ का नाम, GKS ID खोजें...", lang)}
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      style={{ borderRadius: "8px 0 0 8px" }}
                    />
                    <span className="input-group-text bg-white" style={{ borderRadius: "0 8px 8px 0" }}>
                      <i className="fa fa-search text-muted"></i>
                    </span>
                  </InputGroup>
                </Col>

                {/* Status Filter */}
                <Col md="3" sm="6">
                  <Input
                    type="select"
                    bsSize="sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ borderRadius: "8px" }}
                  >
                    <option value="all">{getTranslation("All Status / सभी स्थिति", lang)}</option>
                    <option value="admitted">{getTranslation("Admitted Only / केवल भर्ती", lang)}</option>
                    <option value="discharged">{getTranslation("Discharged Only / केवल डिस्चार्ज", lang)}</option>
                  </Input>
                </Col>

                {/* Form Specific Filter */}
                <Col md="3" sm="6">
                  <Input
                    type="select"
                    bsSize="sm"
                    value={formFilter}
                    onChange={(e) => setFormFilter(e.target.value)}
                    style={{ borderRadius: "8px" }}
                  >
                    <option value="all">{getTranslation("All Forms Filter / सभी फॉर्म", lang)}</option>
                    <option value="pfa_pending">{getTranslation("PFA Pending / पीएफए ​​लंबित", lang)}</option>
                    <option value="pfa_done">{getTranslation("PFA Completed / पीएफए ​​पूर्ण", lang)}</option>
                    <option value="gen_family_pending">{getTranslation("Gen Family Pending / जनरल परिवार लंबित", lang)}</option>
                    <option value="fe_pending">{getTranslation("First Exam Pending / पहली परीक्षा लंबित", lang)}</option>
                    <option value="ba_pending">{getTranslation("Blood Analysis Pending / रक्त विश्लेषण लंबित", lang)}</option>
                    <option value="detox_pending">{getTranslation("Detox Pending / डिटॉक्स लंबित", lang)}</option>
                    <option value="fda_pending">{getTranslation("FDA Pending / एफडीए लंबित", lang)}</option>
                    <option value="sud_pending">{getTranslation("SUD Pending / एसयूडी लंबित", lang)}</option>
                    <option value="cbt_pending">{getTranslation("CBT Pending / सीबीटी लंबित", lang)}</option>
                    <option value="bi_pending">{getTranslation("Brief Intervention Pending / संक्षिप्त हस्तक्षेप लंबित", lang)}</option>
                    <option value="all_completed">{getTranslation("All 9 Forms Completed / सभी 9 फॉर्म पूर्ण", lang)}</option>
                  </Input>
                </Col>

                {/* Export Buttons */}
                <Col md="2" sm="12" className="d-flex justify-content-md-end justify-content-start">
                  <TableExportButtons
                    data={filteredPatients}
                    columns={columns}
                    filename="combined_clinical_forms_report"
                    title={getTranslation("GKS Rehab - Combined Clinical Forms Report", lang)}
                    disabled={loading || filteredPatients.length === 0}
                  />
                </Col>
              </Row>
            </CardHeader>

            <CardBody className="p-0">
              <DataTable
                columns={columns}
                data={filteredPatients}
                progressPending={loading}
                progressComponent={
                  <div className="py-5 text-center">
                    <Spinner color="primary" />
                    <div className="mt-2 text-muted small">
                      {getTranslation("Loading consolidated records.../रिकॉर्ड लोड हो रहे हैं...", lang)}
                    </div>
                  </div>
                }
                noDataComponent={
                  <div className="py-5 text-center text-muted small">
                    {getTranslation("No matching patient records found./कोई मेल खाता मरीज़ रिकॉर्ड नहीं मिला।", lang)}
                  </div>
                }
                pagination
                paginationPerPage={15}
                paginationRowsPerPageOptions={[10, 15, 25, 50, 100]}
                responsive
                highlightOnHover
                striped
                customStyles={{
                  headCells: {
                    style: {
                      backgroundColor: "#f8fafc",
                      color: "#334155",
                      fontWeight: "700",
                      fontSize: "12px",
                      borderBottom: "1px solid #e2e8f0",
                      textTransform: "uppercase",
                      letterSpacing: "0.4px",
                    },
                  },
                  cells: {
                    style: {
                      fontSize: "12px",
                      paddingTop: "10px",
                      paddingBottom: "10px",
                    },
                  },
                }}
              />
            </CardBody>
          </Card>
        )}

        {/* TAB 2: Modules Overview */}
        {activeTab === "modules" && (
          <Row className="g-3">
            {modulesList.map((m) => (
              <Col lg="6" xs="12" key={m.key}>
                <Card className="h-100 border shadow-sm" style={{ borderRadius: "12px" }}>
                  <CardBody className="p-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <span
                            className="badge text-white"
                            style={{ backgroundColor: m.color, fontSize: "11px" }}
                          >
                            {m.tag}
                          </span>
                          <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: "14px" }}>
                            {getTranslation(`${m.name}/${m.nameHi}`, lang)}
                          </h6>
                        </div>
                      </div>
                      <span className="fw-bold" style={{ color: m.color, fontSize: "15px" }}>
                        {m.rate}%
                      </span>
                    </div>

                    <div className="my-2">
                      <Progress
                        value={m.rate}
                        style={{ height: "8px", borderRadius: "4px" }}
                        color={m.rate >= 75 ? "success" : m.rate >= 40 ? "warning" : "danger"}
                      />
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top small">
                      <div className="d-flex gap-3">
                        <span className="text-success fw-semibold">
                          ✓ {m.completed} {getTranslation("Completed/पूर्ण", lang)}
                        </span>
                        <span className="fw-bold" style={{ color: "#b45309" }}>
                          ⏳ {m.pending} {getTranslation("Pending/लंबित", lang)}
                        </span>
                        <span className="text-muted">
                          {getTranslation("Total/कुल", lang)}: {m.total}
                        </span>
                      </div>

                      <div className="d-flex gap-2">
                        <Button
                          size="sm"
                          color="light"
                          className="border px-2 py-1"
                          style={{ fontSize: "11.5px", borderRadius: "6px" }}
                          onClick={() => {
                            setFormFilter(`${m.key}_pending`);
                            setActiveTab("matrix");
                          }}
                          title={getTranslation("Filter patients pending this form/इस फॉर्म के लंबित मरीजों को फ़िल्टर करें", lang)}
                        >
                          {getTranslation("View Pending/लंबित देखें", lang)}
                        </Button>
                        <Button
                          size="sm"
                          className="px-2.5 py-1 text-white shadow-sm"
                          style={{
                            backgroundColor: m.color,
                            borderColor: m.color,
                            fontSize: "11.5px",
                            borderRadius: "6px",
                          }}
                          onClick={() => navigate(m.path)}
                        >
                          {getTranslation("Open Form/फॉर्म खोलें →", lang)}
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>

      {/* Patient Detail Modal */}
      {viewUserModal && (
        <UserDetailsModal
          isOpen={viewUserModal}
          userId={selectedUserId}
          toggler={() => setViewUserModal(false)}
        />
      )}
    </>
  );
};

export default CombinedFormsReport;
