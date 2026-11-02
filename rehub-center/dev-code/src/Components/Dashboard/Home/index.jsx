import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Button,
  Card,
  CardBody,
  Col,
  Container,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Progress,
  Row,
  Table,
  Badge,
  Input,
  InputGroup,
  Spinner,
} from "reactstrap";
import {
  Users,
  UserCheck,
  Activity,
  Calendar,
  Clock,
  AlertCircle,
  FileText,
  Search,
  RefreshCw,
  Layers,
  Shield,
  Heart,
  ChevronRight,
  Filter,
  MapPin,
  X,
  CheckSquare,
  AlertTriangle,
  ExternalLink,
} from "react-feather";
import { useBranch } from "../../../contexts/BranchContext";
import { useLang } from "../../../contexts/LangContext";
import { getTranslation } from "../../../utils/translator";
import {
  fetchDashboardOverview,
  fetchDashboardSectionList,
  updateUserProfile,
} from "../../../Services/dashboardService";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
const formatNumber = (val) => {
  if (val === undefined || val === null) return "0";
  return new Intl.NumberFormat("en-IN").format(val);
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? String(dateStr) : d.toLocaleDateString("en-IN");
  } catch {
    return String(dateStr);
  }
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? String(dateStr)
      : d.toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return String(dateStr);
  }
};

/* ------------------------------------------------------------------ */
/* Custom Styles                                                      */
/* ------------------------------------------------------------------ */
const DashboardStyles = () => (
  <style>{`
    .dashboard-pro {
      background-color: #f8fafc;
      min-height: 100vh;
      padding: 1.25rem 0.75rem 2.5rem;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
    }
    .dashboard-card {
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.02);
      background: #ffffff;
      transition: all 0.2s ease;
      margin-bottom: 1.25rem;
    }
    .dashboard-card:hover {
      box-shadow: 0 6px 18px rgba(0,0,0,0.05);
    }
    .clickable-card {
      cursor: pointer;
      user-select: none;
    }
    .clickable-card:hover {
      transform: translateY(-2px);
      border-color: #cbd5e1;
    }
    .stat-metric-card {
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      background: #ffffff;
      padding: 1.2rem;
      transition: all 0.2s ease;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      height: 100%;
    }
    .stat-metric-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.06);
    }
    .stat-metric-card::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      height: 4px;
      width: 100%;
      background: transparent;
      transition: background 0.2s ease;
    }
    .stat-metric-card.card-primary::after { background: #24695c; }
    .stat-metric-card.card-info::after { background: #0284c7; }
    .stat-metric-card.card-success::after { background: #16a34a; }
    .stat-metric-card.card-warning::after { background: #d97706; }

    .stat-card-icon-box {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .period-tab-btn {
      font-size: 0.825rem;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 20px;
      border: 1px solid transparent;
      color: #64748b;
      background: #f1f5f9;
      transition: all 0.15s ease;
      cursor: pointer;
    }
    .period-tab-btn:hover {
      color: #0f172a;
      background: #e2e8f0;
    }
    .period-tab-btn.active {
      background: #24695c !important;
      color: #ffffff !important;
      box-shadow: 0 2px 6px rgba(36, 105, 92, 0.25);
    }

    .ward-stat-pill {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 14px;
      background: #f8fafc;
      transition: all 0.15s ease;
      cursor: pointer;
    }
    .ward-stat-pill:hover {
      background: #ffffff;
      border-color: #24695c;
      box-shadow: 0 4px 12px rgba(36, 105, 92, 0.08);
      transform: translateY(-1px);
    }

    .severity-row-pill {
      border-radius: 10px;
      padding: 10px 14px;
      transition: all 0.15s ease;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .severity-row-pill:hover {
      transform: translateX(3px);
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .drilldown-modal .modal-content {
      border-radius: 16px;
      border: none;
      box-shadow: 0 20px 40px rgba(0,0,0,0.15);
      overflow: hidden;
    }
    .drilldown-modal .modal-header {
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      padding: 1.1rem 1.5rem;
    }
    .drilldown-modal .modal-body {
      padding: 1.25rem 1.5rem;
    }

    .custom-table thead th {
      background-color: #f8fafc;
      color: #475569;
      font-size: 0.76rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 700;
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    .custom-table tbody td {
      padding: 11px 12px;
      font-size: 0.85rem;
      color: #334155;
      vertical-align: middle;
      border-bottom: 1px solid #f1f5f9;
    }
  `}</style>
);

/* ------------------------------------------------------------------ */
/* Header Greeting Card Component                                     */
/* ------------------------------------------------------------------ */
const ProfileGreetingCard = ({
  generatedAt,
  loading,
  refreshing,
  onRefresh,
  onOpenProfile,
  lang,
}) => {
  const userName = localStorage.getItem("Name") || "Staff";
  const userRole = localStorage.getItem("isRoleType") || "Administrator";
  const branchDetails = JSON.parse(localStorage.getItem("Branch_Detail") || "[]");
  const branchName = branchDetails[0]?.Branch_name || "GKS Rehab Portal";

  return (
    <Card className="dashboard-card mb-3 overflow-hidden border-0 shadow-sm" style={{ background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)" }}>
      <CardBody className="p-3.5">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1.5">
              <h3 className="fw-bold mb-0 text-dark" style={{ letterSpacing: "-0.3px" }}>
                {getTranslation("Welcome Back, /वापसी पर स्वागत है, ", lang)}
                <span style={{ color: "#24695c" }}>{userName}</span>
              </h3>
              <Badge color="success" pill className="px-2.5 py-1 text-white extra-small fw-semibold">
                ● {getTranslation("Live /सक्रिय", lang)}
              </Badge>
            </div>
            <div className="d-flex align-items-center flex-wrap gap-2 text-muted small">
              <span className="badge bg-light text-dark border px-2 py-1 d-inline-flex align-items-center gap-1">
                <Shield size={12} color="#24695c" /> {userRole}
              </span>
              <span className="badge bg-light text-dark border px-2 py-1 d-inline-flex align-items-center gap-1">
                <MapPin size={12} color="#24695c" /> {branchName}
              </span>
              {generatedAt && (
                <span className="badge bg-light text-secondary border px-2 py-1 d-inline-flex align-items-center gap-1">
                  <Clock size={12} /> {getTranslation("Updated: ", lang)}
                  {formatDateTime(generatedAt)}
                </span>
              )}
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Button
              color="light"
              size="sm"
              className="d-inline-flex align-items-center gap-1.5 shadow-sm border rounded-pill px-3 py-1.5 fw-semibold"
              onClick={onRefresh}
              disabled={loading || refreshing}
              title={getTranslation("Refresh Dashboard Data / डेटा रीफ्रेश करें", lang)}
            >
              <RefreshCw size={13} className={refreshing ? "spin-animation" : ""} />
              <span>{refreshing ? getTranslation("Refreshing...", lang) : getTranslation("Refresh / रीफ्रेश", lang)}</span>
            </Button>
            <Button
              color="primary"
              size="sm"
              className="d-inline-flex align-items-center gap-1.5 shadow-sm rounded-pill px-3 py-1.5 fw-semibold"
              onClick={onOpenProfile}
              title={getTranslation("View / Update User Profile", lang)}
            >
              <Shield size={13} />
              <span>{getTranslation("My Profile / प्रोफाइल", lang)}</span>
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

/* ------------------------------------------------------------------ */
/* User Profile Modal (View & Update User API - Section A)             */
/* ------------------------------------------------------------------ */
const ProfileUpdateModal = ({ isOpen, toggle, branchId, lang }) => {
  const userId = localStorage.getItem("user_id") || "1";
  const userRole = localStorage.getItem("isRoleType") || "Administrator";
  const branchDetails = JSON.parse(localStorage.getItem("Branch_Detail") || "[]");
  const branchName = branchDetails[0]?.Branch_name || "GKS Rehab Portal";

  const [formData, setFormData] = useState({
    name: localStorage.getItem("Name") || "",
    relative_name: localStorage.getItem("relative_name") || "",
    email: localStorage.getItem("email") || "",
    gender: localStorage.getItem("gender") || "Male",
    address: localStorage.getItem("address") || "",
  });
  const [updating, setUpdating] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: localStorage.getItem("Name") || "",
        relative_name: localStorage.getItem("relative_name") || "",
        email: localStorage.getItem("email") || "",
        gender: localStorage.getItem("gender") || "Male",
        address: localStorage.getItem("address") || "",
      });
      setMsg(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setMsg(null);

    try {
      await updateUserProfile(userId, branchId, {
        name: formData.name,
        relative_name: formData.relative_name,
        email: formData.email,
        gender: formData.gender,
        address: formData.address,
      });

      localStorage.setItem("Name", formData.name);
      localStorage.setItem("relative_name", formData.relative_name);
      localStorage.setItem("email", formData.email);
      localStorage.setItem("gender", formData.gender);
      localStorage.setItem("address", formData.address);

      setMsg({
        type: "success",
        text: getTranslation(
          "Profile updated successfully! / प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई!",
          lang
        ),
      });
      setTimeout(() => {
        toggle();
      }, 1200);
    } catch (err) {
      setMsg({ type: "danger", text: err.message || "Failed to update profile" });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered>
      <ModalHeader toggle={toggle}>
        <div className="fw-bold">{getTranslation("User Profile / उपयोगकर्ता प्रोफ़ाइल", lang)}</div>
        <small className="text-muted">{userRole} · {branchName}</small>
      </ModalHeader>
      <form onSubmit={handleSubmit}>
        <ModalBody>
          {msg && (
            <div className={`alert alert-${msg.type} py-2 px-3 small border-0 mb-3`}>
              {msg.text}
            </div>
          )}
          <Row className="g-2.5">
            <Col xs="12">
              <label className="form-label small fw-semibold text-secondary mb-1">
                {getTranslation("Full Name / पूरा नाम", lang)} *
              </label>
              <Input
                size="sm"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Col>
            <Col xs="12">
              <label className="form-label small fw-semibold text-secondary mb-1">
                {getTranslation("Relative Name / रिश्तेदार का नाम", lang)}
              </label>
              <Input
                size="sm"
                value={formData.relative_name}
                onChange={(e) => setFormData({ ...formData, relative_name: e.target.value })}
              />
            </Col>
            <Col sm="6" xs="12">
              <label className="form-label small fw-semibold text-secondary mb-1">
                {getTranslation("Email Address / ईमेल", lang)}
              </label>
              <Input
                size="sm"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Col>
            <Col sm="6" xs="12">
              <label className="form-label small fw-semibold text-secondary mb-1">
                {getTranslation("Gender / लिंग", lang)}
              </label>
              <Input
                size="sm"
                type="select"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </Input>
            </Col>
            <Col xs="12">
              <label className="form-label small fw-semibold text-secondary mb-1">
                {getTranslation("Address / पता", lang)}
              </label>
              <Input
                size="sm"
                type="textarea"
                rows="2"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter className="py-2 px-3">
          <Button color="light" size="sm" type="button" onClick={toggle}>
            {getTranslation("Cancel / रद्द करें", lang)}
          </Button>
          <Button color="primary" size="sm" type="submit" disabled={updating} className="px-3 fw-semibold">
            {updating ? getTranslation("Saving...", lang) : getTranslation("Save Changes / सहेजें", lang)}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

/* ------------------------------------------------------------------ */
/* Interactive Drill-down Patient List Modal Component                */
/* ------------------------------------------------------------------ */
const DashboardDrilldownModal = ({
  isOpen,
  toggle,
  config,
  branchId,
  lang,
}) => {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total_records: 0, total_pages: 1 });
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [error, setError] = useState(null);

  const { section, title, subtitle, params = {} } = config || {};

  // Fetch drill-down records when modal opens, page changes, or search applies
  const fetchRecords = useCallback(
    async (pageToFetch = 1, searchToFetch = "") => {
      if (!isOpen || !section) return;
      setLoading(true);
      setError(null);

      try {
        const queryPayload = {
          branchId,
          section,
          search: searchToFetch,
          page: pageToFetch,
          limit: 20,
          ...params,
        };

        const res = await fetchDashboardSectionList(queryPayload);
        setRecords(res?.records || []);
        setPagination(
          res?.pagination || { page: pageToFetch, limit: 20, total_records: res?.records?.length || 0, total_pages: 1 }
        );
      } catch (err) {
        console.error("Error fetching drilldown patient list:", err);
        setError(err.message || "Failed to load patient records");
      } finally {
        setLoading(false);
      }
    },
    [isOpen, section, branchId, params]
  );

  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setActiveSearch("");
      fetchRecords(1, "");
    }
  }, [isOpen, fetchRecords]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveSearch(searchTerm);
    fetchRecords(1, searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setActiveSearch("");
    fetchRecords(1, "");
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > (pagination.total_pages || 1)) return;
    fetchRecords(newPage, activeSearch);
  };

  // Section-specific table headers and cells
  const isLabSection = [
    "sample_to_collect",
    "samples_collected",
    "reports_not_uploaded",
    "reports_uploaded",
  ].includes(section);

  const isDetoxTreatmentSection = section === "treatment_in_progress";
  const isFollowUpSection = section === "follow_ups" || section === "missed_follow_ups";
  const isDischargedSection = section === "discharged";

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="xl" centered className="drilldown-modal">
      <ModalHeader toggle={toggle} className="d-flex align-items-center justify-content-between">
        <div>
          <h5 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
            <span>{title || getTranslation("Patient Records / मरीज रिकॉर्ड्स", lang)}</span>
            <Badge color="primary" pill className="px-2.5 py-1 extra-small fw-semibold">
              {pagination.total_records || 0} {getTranslation("Patients", lang)}
            </Badge>
          </h5>
          {subtitle && <small className="text-muted">{subtitle}</small>}
        </div>
      </ModalHeader>

      <ModalBody>
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mb-3">
          <Row className="g-2 align-items-center">
            <Col md="7" sm="12">
              <InputGroup size="sm">
                <Input
                  type="text"
                  placeholder={getTranslation(
                    "Search by patient name, GKS ID, phone... / नाम, आईडी या फोन से खोजें",
                    lang
                  )}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-start-pill ps-3"
                />
                {searchTerm && (
                  <Button
                    color="light"
                    type="button"
                    onClick={handleClearSearch}
                    className="border-top border-bottom text-muted"
                  >
                    <X size={14} />
                  </Button>
                )}
                <Button color="primary" type="submit" className="rounded-end-pill px-3 fw-semibold">
                  <Search size={14} className="me-1" />
                  {getTranslation("Search / खोजें", lang)}
                </Button>
              </InputGroup>
            </Col>
            <Col md="5" sm="12" className="text-md-end text-muted small">
              {activeSearch && (
                <span>
                  {getTranslation("Filtering for: ", lang)}
                  <strong className="text-dark">"{activeSearch}"</strong>
                </span>
              )}
            </Col>
          </Row>
        </form>

        {/* Error Notification */}
        {error && (
          <div className="alert alert-danger py-2 px-3 small border-0 shadow-sm mb-3">
            <AlertCircle size={14} className="me-1.5" />
            {error}
          </div>
        )}

        {/* Records Table */}
        {loading ? (
          <div className="py-5 text-center text-muted">
            <Spinner color="primary" size="sm" className="me-2" />
            {getTranslation("Loading patient records... / रिकॉर्ड लोड हो रहे हैं...", lang)}
          </div>
        ) : records.length === 0 ? (
          <div className="py-5 text-center text-muted">
            <Users size={32} className="text-slate-300 mb-2" />
            <p className="mb-0 fw-medium">
              {getTranslation("No matching patient records found / कोई रिकॉर्ड नहीं मिला", lang)}
            </p>
            <small className="text-secondary">
              {getTranslation("Try adjusting your search criteria", lang)}
            </small>
          </div>
        ) : (
          <div className="table-responsive" style={{ maxHeight: "420px", overflowY: "auto" }}>
            <Table hover className="custom-table mb-0 align-middle">
              <thead>
                <tr>
                  <th style={{ width: "45px" }}>#</th>
                  <th>{getTranslation("Patient / मरीज़", lang)}</th>
                  <th>{getTranslation("GKS ID / आईडी", lang)}</th>
                  <th>{getTranslation("Phone / फोन", lang)}</th>

                  {/* Section-Specific Columns */}
                  {isLabSection ? (
                    <>
                      <th>{getTranslation("Package(s) / पैकेज", lang)}</th>
                      <th>{getTranslation("Status / स्थिति", lang)}</th>
                      <th>{getTranslation("Assessment Date / तिथि", lang)}</th>
                      <th>{getTranslation("Report / रिपोर्ट", lang)}</th>
                    </>
                  ) : isDetoxTreatmentSection ? (
                    <>
                      <th>{getTranslation("CIWA Rating / रेटिंग", lang)}</th>
                      <th>{getTranslation("Severity / गंभीरता", lang)}</th>
                      <th>{getTranslation("Detox Status / स्थिति", lang)}</th>
                      <th>{getTranslation("Next Follow-up / अगली तिथि", lang)}</th>
                    </>
                  ) : isFollowUpSection ? (
                    <>
                      <th>{getTranslation("Source / स्रोत", lang)}</th>
                      <th>{getTranslation("Follow-up Date / तिथि", lang)}</th>
                      <th>{getTranslation("Attended / उपस्थित", lang)}</th>
                    </>
                  ) : isDischargedSection ? (
                    <>
                      <th>{getTranslation("Ward / वार्ड", lang)}</th>
                      <th>{getTranslation("Admit Date / प्रवेश", lang)}</th>
                      <th>{getTranslation("Discharge Date / डिस्चार्ज", lang)}</th>
                    </>
                  ) : (
                    <>
                      <th>{getTranslation("Ward / वार्ड", lang)}</th>
                      <th>{getTranslation("Date / तिथि", lang)}</th>
                      <th>{getTranslation("Status / स्थिति", lang)}</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {records.map((r, idx) => {
                  const sNo = ((pagination.page || 1) - 1) * (pagination.limit || 20) + (idx + 1);
                  return (
                    <tr key={r.user_id || r.blood_analysis_id || r.detox_id || idx}>
                      <td className="text-muted extra-small">{sNo}</td>

                      {/* Patient Name & Gender */}
                      <td>
                        <div className="fw-semibold text-dark">{r.name || "Patient"}</div>
                        <div className="text-muted extra-small" style={{ fontSize: "0.74rem" }}>
                          {r.gender || "-"}
                        </div>
                      </td>

                      {/* GKS ID */}
                      <td>
                        <span className="badge bg-light text-dark border px-2 py-0.5" style={{ fontSize: "0.78rem" }}>
                          {r.gks_id || "-"}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="small text-secondary">{r.phone || "-"}</td>

                      {/* Lab Observations Columns */}
                      {isLabSection ? (
                        <>
                          <td>
                            {Array.isArray(r.package_name) ? (
                              r.package_name.map((pkg, i) => (
                                <Badge key={i} color="light" className="text-dark border me-1 mb-1" style={{ fontSize: "11px" }}>
                                  {pkg}
                                </Badge>
                              ))
                            ) : (
                              <Badge color="light" className="text-dark border" style={{ fontSize: "11px" }}>
                                {r.package_name || "-"}
                              </Badge>
                            )}
                          </td>
                          <td>
                            <Badge
                              color={
                                r.status === "Sample_Collected"
                                  ? "info"
                                  : r.status === "Report_Uploaded"
                                  ? "success"
                                  : "warning"
                              }
                              className="px-2 py-1 extra-small"
                            >
                              {r.status || "Scheduled"}
                            </Badge>
                          </td>
                          <td className="small text-muted">{formatDate(r.date_of_assessment || r.scheduled_at)}</td>
                          <td>
                            {r.report_file_path ? (
                              <a
                                href={r.report_file_path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-outline-primary py-0.5 px-2 d-inline-flex align-items-center gap-1"
                                style={{ fontSize: "11px" }}
                              >
                                <ExternalLink size={11} />
                                <span>{getTranslation("View / देखें", lang)}</span>
                              </a>
                            ) : (
                              <span className="text-muted extra-small">-</span>
                            )}
                          </td>
                        </>
                      ) : isDetoxTreatmentSection ? (
                        <>
                          <td>
                            <Badge color="dark" className="px-2 py-1" style={{ fontSize: "12px" }}>
                              {r.CIWA_rating !== undefined ? r.CIWA_rating : "-"}
                            </Badge>
                          </td>
                          <td>
                            <Badge
                              color={
                                String(r.severity).toLowerCase().includes("severe")
                                  ? "danger"
                                  : String(r.severity).toLowerCase().includes("moderate")
                                  ? "warning"
                                  : "success"
                              }
                              className="px-2 py-1 extra-small"
                            >
                              {r.severity || "Under Therapy"}
                            </Badge>
                          </td>
                          <td>
                            <Badge color="light" className="text-dark border px-2 py-0.5 extra-small">
                              {r.detox_status || "Active"} {r.follow_up_visit ? `(#${r.follow_up_visit})` : ""}
                            </Badge>
                          </td>
                          <td className="small text-muted">{formatDate(r.next_follow_date)}</td>
                        </>
                      ) : isFollowUpSection ? (
                        <>
                          <td>
                            <Badge color="secondary" className="px-2 py-1 extra-small text-capitalize">
                              {String(r.source || "follow_up").replace(/_/g, " ")}
                            </Badge>
                          </td>
                          <td className="small text-dark fw-medium">{formatDate(r.follow_up_date)}</td>
                          <td>
                            <Badge
                              color={r.is_attended ? "success" : "warning"}
                              className="px-2 py-0.5 extra-small"
                            >
                              {r.is_attended ? "Attended" : "Scheduled"}
                            </Badge>
                          </td>
                        </>
                      ) : isDischargedSection ? (
                        <>
                          <td>
                            <Badge color="light" className="text-dark border px-2 py-0.5 extra-small">
                              {r.ward_name || "General"}
                            </Badge>
                          </td>
                          <td className="small text-muted">{formatDate(r.admit_date)}</td>
                          <td className="small text-success fw-medium">{formatDate(r.discharge_date)}</td>
                        </>
                      ) : (
                        <>
                          <td>
                            <Badge color="light" className="text-dark border px-2 py-0.5 extra-small">
                              {r.ward_name || "-"}
                            </Badge>
                          </td>
                          <td className="small text-muted">{formatDate(r.registered_on || r.admit_date || r.updated_at)}</td>
                          <td>
                            <Badge
                              color={r.status === "completed" || r.status === "Active" ? "success" : "warning"}
                              className="px-2 py-0.5 extra-small"
                            >
                              {r.status || "Active"}
                            </Badge>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}
      </ModalBody>

      <ModalFooter className="d-flex justify-content-between align-items-center py-2 px-3 border-top bg-light">
        <div className="text-muted small">
          {pagination.total_records > 0 && (
            <span>
              {getTranslation("Page", lang)} {pagination.page || 1} {getTranslation("of", lang)}{" "}
              {pagination.total_pages || 1} ({pagination.total_records} {getTranslation("total", lang)})
            </span>
          )}
        </div>
        <div className="d-flex gap-2">
          <Button
            color="light"
            size="sm"
            disabled={loading || (pagination.page || 1) <= 1}
            onClick={() => handlePageChange((pagination.page || 1) - 1)}
            className="rounded-3 px-3 fw-medium"
          >
            {getTranslation("Previous / पिछला", lang)}
          </Button>
          <Button
            color="primary"
            size="sm"
            disabled={loading || (pagination.page || 1) >= (pagination.total_pages || 1)}
            onClick={() => handlePageChange((pagination.page || 1) + 1)}
            className="rounded-3 px-3 fw-medium"
          >
            {getTranslation("Next / अगला", lang)}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

/* ------------------------------------------------------------------ */
/* Main Dashboard Component                                           */
/* ------------------------------------------------------------------ */
const Dashboard = () => {
  const { selectedBranch } = useBranch();
  const { lang } = useLang();

  // Resolve active branch ID
  const activeBranchId = useMemo(() => {
    if (selectedBranch) return selectedBranch;
    const stored = localStorage.getItem("Selected_Branch_ID");
    if (stored) return stored;
    try {
      const branches = JSON.parse(localStorage.getItem("Branch_Detail") || "[]");
      return branches[0]?.Branch_id || 1;
    } catch {
      return 1;
    }
  }, [selectedBranch]);

  // Dashboard Overview State
  const [overviewData, setOverviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Active Period Tab: "today" | "this_week" | "this_month" | "this_year" | "overall"
  const [activePeriod, setActivePeriod] = useState("this_month");

  // Patient Wise Analysis Scope: "not_discharged" | "discharged" | "overall"
  const [patientWiseScope, setPatientWiseScope] = useState("not_discharged");

  // User Profile Modal State
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Drill-down Modal State
  const [drilldownModal, setDrilldownModal] = useState({
    isOpen: false,
    section: "",
    title: "",
    subtitle: "",
    params: {},
  });

  // Fetch complete dashboard overview (one call)
  const loadDashboard = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const data = await fetchDashboardOverview(activeBranchId);
        setOverviewData(data);
      } catch (err) {
        console.error("Dashboard overview fetch error:", err);
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeBranchId]
  );

  useEffect(() => {
    loadDashboard(false);
  }, [loadDashboard]);

  // Open drilldown modal helper
  const openDrilldown = (section, title, subtitle = "", customParams = {}) => {
    // Map period key to API period value
    let periodForApi = "overall";
    if (activePeriod === "today") periodForApi = "today";
    else if (activePeriod === "this_week") periodForApi = "week";
    else if (activePeriod === "this_month") periodForApi = "month";
    else if (activePeriod === "this_year") periodForApi = "year";

    setDrilldownModal({
      isOpen: true,
      section,
      title,
      subtitle,
      params: {
        period: periodForApi,
        ...customParams,
      },
    });
  };

  const closeDrilldown = () => {
    setDrilldownModal((prev) => ({ ...prev, isOpen: false }));
  };

  // Helper to safely extract period count from a metric object
  const getPeriodCount = (metricObj) => {
    if (!metricObj) return 0;
    if (metricObj[activePeriod] !== undefined) return metricObj[activePeriod];
    return metricObj.overall || 0;
  };

  // Human readable period range string
  const activePeriodRangeText = useMemo(() => {
    const ranges = overviewData?.period_ranges;
    if (!ranges) return "";
    if (activePeriod === "today") return `${getTranslation("Today: ", lang)} ${ranges.today || ""}`;
    if (activePeriod === "this_week" && ranges.week) {
      return `${formatDate(ranges.week.start)} — ${formatDate(ranges.week.end)}`;
    }
    if (activePeriod === "this_month" && ranges.month) {
      return `${formatDate(ranges.month.start)} — ${formatDate(ranges.month.end)}`;
    }
    if (activePeriod === "this_year" && ranges.year) {
      return `${formatDate(ranges.year.start)} — ${formatDate(ranges.year.end)}`;
    }
    return getTranslation("All-Time Cumulative / समग्र", lang);
  }, [overviewData, activePeriod, lang]);

  // Data pointers from overview
  const totalPatients = overviewData?.total_patients;
  const currentlyAdmitted = overviewData?.currently_admitted_patients;
  const discharged = overviewData?.discharged_patients;
  const wardWise = overviewData?.ward_wise_on_bed_patients;
  const wardOccupancy = overviewData?.ward_occupancy;
  const followUps = overviewData?.follow_ups;
  const missedFollowUps = overviewData?.missed_follow_ups;
  const sampleCollection = overviewData?.sample_collection;
  const reportUpload = overviewData?.report_upload;
  const treatmentInProgress = overviewData?.treatment_in_progress;
  const patientWiseAnalysis = overviewData?.patient_wise_analysis;

  return (
    <div className="dashboard-pro">
      <DashboardStyles />

      {/* Drill-down Patient List Modal */}
      <DashboardDrilldownModal
        isOpen={drilldownModal.isOpen}
        toggle={closeDrilldown}
        config={drilldownModal}
        branchId={activeBranchId}
        lang={lang}
      />

      {/* User Profile View & Update Modal (Section A API) */}
      <ProfileUpdateModal
        isOpen={isProfileOpen}
        toggle={() => setIsProfileOpen(false)}
        branchId={activeBranchId}
        lang={lang}
      />

      <Container fluid className="px-2">
        {/* Profile Header Banner */}
        <ProfileGreetingCard
          generatedAt={overviewData?.generated_at}
          loading={loading}
          refreshing={refreshing}
          onRefresh={() => loadDashboard(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          lang={lang}
        />

        {/* Global Period Selector Tabs */}
        <Card className="dashboard-card mb-3 border-0 shadow-sm">
          <CardBody className="py-2.5 px-3">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div className="d-flex align-items-center gap-1.5 flex-wrap">
                <span className="text-secondary small fw-bold me-1 text-uppercase" style={{ fontSize: "0.75rem", letterSpacing: "0.5px" }}>
                  <Filter size={12} className="me-1" />
                  {getTranslation("Period: ", lang)}
                </span>
                <button
                  type="button"
                  className={`period-tab-btn ${activePeriod === "today" ? "active" : ""}`}
                  onClick={() => setActivePeriod("today")}
                >
                  {getTranslation("Today / आज", lang)}
                </button>
                <button
                  type="button"
                  className={`period-tab-btn ${activePeriod === "this_week" ? "active" : ""}`}
                  onClick={() => setActivePeriod("this_week")}
                >
                  {getTranslation("This Week / इस सप्ताह", lang)}
                </button>
                <button
                  type="button"
                  className={`period-tab-btn ${activePeriod === "this_month" ? "active" : ""}`}
                  onClick={() => setActivePeriod("this_month")}
                >
                  {getTranslation("This Month / इस माह", lang)}
                </button>
                <button
                  type="button"
                  className={`period-tab-btn ${activePeriod === "this_year" ? "active" : ""}`}
                  onClick={() => setActivePeriod("this_year")}
                >
                  {getTranslation("This Year / इस वर्ष", lang)}
                </button>
                <button
                  type="button"
                  className={`period-tab-btn ${activePeriod === "overall" ? "active" : ""}`}
                  onClick={() => setActivePeriod("overall")}
                >
                  {getTranslation("Overall / समग्र", lang)}
                </button>
              </div>

              {activePeriodRangeText && (
                <div className="text-muted extra-small d-inline-flex align-items-center gap-1" style={{ fontSize: "0.78rem" }}>
                  <Calendar size={12} color="#24695c" />
                  <span>{activePeriodRangeText}</span>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger py-2 px-3 small border-0 shadow-sm mb-3 d-flex align-items-center justify-content-between">
            <div>
              <AlertCircle size={15} className="me-1.5" />
              {error}
            </div>
            <Button color="light" size="sm" onClick={() => loadDashboard(true)} className="py-0.5 px-2 text-danger fw-semibold">
              {getTranslation("Retry / पुनः प्रयास करें", lang)}
            </Button>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* ROW 1: TOP KEY OPERATIONAL METRICS CARDS                     */}
        {/* ------------------------------------------------------------- */}
        <Row className="mb-1 g-3">
          {/* 1. Total Registered Patients */}
          <Col xl="3" md="6">
            <div
              className="stat-metric-card card-primary"
              onClick={() =>
                openDrilldown(
                  "total_patients",
                  getTranslation("Total Registered Patients / कुल पंजीकृत मरीज़", lang),
                  getTranslation("Search and view patients registered in this period", lang)
                )
              }
              title={getTranslation("Click to view patient records", lang)}
            >
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="stat-card-icon-box" style={{ backgroundColor: "#f0fdf4", color: "#166534" }}>
                  <Users size={22} />
                </div>
                <Badge color="light" className="text-dark border" style={{ fontSize: "11px" }}>
                  {getTranslation("Click to View", lang)}
                </Badge>
              </div>
              <h2 className="fw-bold mb-0 text-dark">
                {loading ? "..." : formatNumber(getPeriodCount(totalPatients))}
              </h2>
              <div className="fw-semibold text-secondary small mt-1">
                {getTranslation("Total Patients / कुल मरीज़", lang)}
              </div>
              <div className="text-muted extra-small mt-1 d-flex align-items-center gap-1" style={{ fontSize: "0.75rem" }}>
                <span>{getTranslation("Overall: ", lang)} {formatNumber(totalPatients?.overall || 0)}</span>
                <ChevronRight size={12} />
              </div>
            </div>
          </Col>

          {/* 2. Currently Admitted (On Bed) */}
          <Col xl="3" md="6">
            <div
              className="stat-metric-card card-info"
              onClick={() =>
                openDrilldown(
                  "currently_admitted",
                  getTranslation("Currently Admitted Patients / वर्तमान में भर्ती मरीज़", lang),
                  getTranslation("Active in-patients with open IPD admission", lang)
                )
              }
              title={getTranslation("Click to view admitted patients", lang)}
            >
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="stat-card-icon-box" style={{ backgroundColor: "#f0f9ff", color: "#0284c7" }}>
                  <Activity size={22} />
                </div>
                <Badge color="info" className="px-2 py-1 extra-small">
                  {getTranslation("Active IPD", lang)}
                </Badge>
              </div>
              <h2 className="fw-bold mb-0 text-dark">
                {loading ? "..." : formatNumber(getPeriodCount(currentlyAdmitted))}
              </h2>
              <div className="fw-semibold text-secondary small mt-1">
                {getTranslation("Currently Admitted / वर्तमान में भर्ती", lang)}
              </div>
              <div className="text-muted extra-small mt-1 d-flex align-items-center gap-1" style={{ fontSize: "0.75rem" }}>
                <span>{getTranslation("On Bed Now: ", lang)} {formatNumber(currentlyAdmitted?.overall || 0)}</span>
                <ChevronRight size={12} />
              </div>
            </div>
          </Col>

          {/* 3. Discharged Patients */}
          <Col xl="3" md="6">
            <div
              className="stat-metric-card card-success"
              onClick={() =>
                openDrilldown(
                  "discharged",
                  getTranslation("Discharged Patients / डिस्चार्ज किए गए मरीज़", lang),
                  getTranslation("Patients successfully discharged in this period", lang)
                )
              }
              title={getTranslation("Click to view discharged patients", lang)}
            >
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="stat-card-icon-box" style={{ backgroundColor: "#ecfdf5", color: "#059669" }}>
                  <UserCheck size={22} />
                </div>
                <Badge color="success" className="px-2 py-1 extra-small">
                  {getTranslation("Discharged", lang)}
                </Badge>
              </div>
              <h2 className="fw-bold mb-0 text-dark">
                {loading ? "..." : formatNumber(getPeriodCount(discharged))}
              </h2>
              <div className="fw-semibold text-secondary small mt-1">
                {getTranslation("Discharged Patients / डिस्चार्ज मरीज़", lang)}
              </div>
              <div className="text-muted extra-small mt-1 d-flex align-items-center gap-1" style={{ fontSize: "0.75rem" }}>
                <span>{getTranslation("Total Discharged: ", lang)} {formatNumber(discharged?.overall || 0)}</span>
                <ChevronRight size={12} />
              </div>
            </div>
          </Col>

          {/* 4. Total Follow-ups & Missed */}
          <Col xl="3" md="6">
            <div
              className="stat-metric-card card-warning"
              onClick={() =>
                openDrilldown(
                  "follow_ups",
                  getTranslation("Total Follow-ups / कुल फॉलो-अप", lang),
                  getTranslation("Scheduled follow-ups across medical and detoxification modules", lang)
                )
              }
              title={getTranslation("Click to view follow-up schedule", lang)}
            >
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="stat-card-icon-box" style={{ backgroundColor: "#fffbeb", color: "#d97706" }}>
                  <Calendar size={22} />
                </div>
                {getPeriodCount(missedFollowUps) > 0 ? (
                  <Badge color="danger" pill className="px-2 py-1 extra-small">
                    {formatNumber(getPeriodCount(missedFollowUps))} {getTranslation("Missed", lang)}
                  </Badge>
                ) : (
                  <Badge color="light" className="text-dark border" style={{ fontSize: "11px" }}>
                    {getTranslation("Follow-up Care", lang)}
                  </Badge>
                )}
              </div>
              <h2 className="fw-bold mb-0 text-dark">
                {loading ? "..." : formatNumber(getPeriodCount(followUps))}
              </h2>
              <div className="fw-semibold text-secondary small mt-1">
                {getTranslation("Total Follow-ups / कुल फॉलो-अप", lang)}
              </div>
              <div className="text-muted extra-small mt-1 d-flex align-items-center gap-1" style={{ fontSize: "0.75rem" }}>
                <span>{getTranslation("Missed: ", lang)} {formatNumber(getPeriodCount(missedFollowUps))}</span>
                <ChevronRight size={12} />
              </div>
            </div>
          </Col>
        </Row>

        {/* ------------------------------------------------------------- */}
        {/* ROW 2: WARD OCCUPANCY & TREATMENT IN PROGRESS (CIWA)          */}
        {/* ------------------------------------------------------------- */}
        <Row className="mt-3 g-3">
          {/* Ward Wise On Bed Patients & Occupancy */}
          <Col xl="7" lg="12">
            <Card className="dashboard-card h-100">
              <CardBody className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                      <Layers size={18} color="#24695c" />
                      {getTranslation("Ward Wise On-Bed Patients / वार्ड अनुसार भर्ती मरीज़", lang)}
                    </h5>
                    <small className="text-muted">
                      {getTranslation("Real-time occupancy by ward type in this branch", lang)}
                    </small>
                  </div>
                  <Badge color="primary" pill className="px-2.5 py-1.5 fw-semibold">
                    {getTranslation("Total On Bed: ", lang)}{" "}
                    {loading ? "..." : formatNumber(wardWise?.total_on_bed?.[activePeriod] ?? wardOccupancy?.total_patients ?? 0)}
                  </Badge>
                </div>

                {/* Ward Stat Grid */}
                <Row className="g-2.5 mb-3">
                  {/* General Ward */}
                  <Col sm="4" xs="12">
                    <div
                      className="ward-stat-pill"
                      onClick={() =>
                        openDrilldown(
                          "ward_wise_on_bed",
                          getTranslation("General Ward - On Bed Patients / जनरल वार्ड मरीज़", lang),
                          getTranslation("Patients currently assigned to General Ward", lang),
                          { ward_type_id: wardOccupancy?.general?.ward_type_id || 1, omitPeriod: true }
                        )
                      }
                      title={getTranslation("Click to view General Ward patients", lang)}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="small fw-semibold text-secondary">
                          {getTranslation("General / जनरल", lang)}
                        </span>
                        <ChevronRight size={14} className="text-muted" />
                      </div>
                      <h3 className="fw-bold mb-0 text-dark">
                        {loading ? "..." : formatNumber(wardOccupancy?.general?.patients || 0)}
                      </h3>
                      <div className="text-muted extra-small mt-1">
                        {getTranslation("Active beds occupied", lang)}
                      </div>
                    </div>
                  </Col>

                  {/* Semi Private Ward */}
                  <Col sm="4" xs="12">
                    <div
                      className="ward-stat-pill"
                      onClick={() =>
                        openDrilldown(
                          "ward_wise_on_bed",
                          getTranslation("Semi Private Ward - On Bed Patients / सेमी प्राइवेट वार्ड", lang),
                          getTranslation("Patients currently assigned to Semi Private Ward", lang),
                          { ward_type_id: wardOccupancy?.semi_private?.ward_type_id || 2, omitPeriod: true }
                        )
                      }
                      title={getTranslation("Click to view Semi Private Ward patients", lang)}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="small fw-semibold text-secondary">
                          {getTranslation("Semi Private / सेमी प्राइवेट", lang)}
                        </span>
                        <ChevronRight size={14} className="text-muted" />
                      </div>
                      <h3 className="fw-bold mb-0 text-dark">
                        {loading ? "..." : formatNumber(wardOccupancy?.semi_private?.patients || 0)}
                      </h3>
                      <div className="text-muted extra-small mt-1">
                        {getTranslation("Active beds occupied", lang)}
                      </div>
                    </div>
                  </Col>

                  {/* Private Ward */}
                  <Col sm="4" xs="12">
                    <div
                      className="ward-stat-pill"
                      onClick={() =>
                        openDrilldown(
                          "ward_wise_on_bed",
                          getTranslation("Private Ward - On Bed Patients / प्राइवेट वार्ड मरीज़", lang),
                          getTranslation("Patients currently assigned to Private Ward", lang),
                          { ward_type_id: wardOccupancy?.private?.ward_type_id || 3, omitPeriod: true }
                        )
                      }
                      title={getTranslation("Click to view Private Ward patients", lang)}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="small fw-semibold text-secondary">
                          {getTranslation("Private / प्राइवेट", lang)}
                        </span>
                        <ChevronRight size={14} className="text-muted" />
                      </div>
                      <h3 className="fw-bold mb-0 text-dark">
                        {loading ? "..." : formatNumber(wardOccupancy?.private?.patients || 0)}
                      </h3>
                      <div className="text-muted extra-small mt-1">
                        {getTranslation("Active beds occupied", lang)}
                      </div>
                    </div>
                  </Col>

                  {/* Other Wards from ward_occupancy (e.g. ICU) */}
                  {wardOccupancy?.other_wards &&
                    wardOccupancy.other_wards.map((ow, idx) => (
                      <Col sm="4" xs="12" key={ow.ward_type_id || idx}>
                        <div
                          className="ward-stat-pill"
                          onClick={() =>
                            openDrilldown(
                              "ward_wise_on_bed",
                              `${ow.ward_name || "Ward"} - ${getTranslation("On Bed Patients", lang)}`,
                              getTranslation("Patients currently assigned to this ward", lang),
                              { ward_type_id: ow.ward_type_id, omitPeriod: true }
                            )
                          }
                          title={`${ow.ward_name}: ${ow.patients || 0}`}
                        >
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="small fw-semibold text-secondary">
                              {ow.ward_name}
                            </span>
                            <ChevronRight size={14} className="text-muted" />
                          </div>
                          <h3 className="fw-bold mb-0 text-dark">
                            {loading ? "..." : formatNumber(ow.patients || 0)}
                          </h3>
                          <div className="text-muted extra-small mt-1">
                            {getTranslation("Active beds occupied", lang)}
                          </div>
                        </div>
                      </Col>
                    ))}
                </Row>

                {/* Other Wards / Wards Breakdown Table */}
                {wardWise?.wards && wardWise.wards.length > 0 && (
                  <div className="table-responsive mt-2">
                    <Table size="sm" className="mb-0 custom-table">
                      <thead>
                        <tr>
                          <th>{getTranslation("Ward Name / वार्ड का नाम", lang)}</th>
                          <th className="text-center">{getTranslation("Today", lang)}</th>
                          <th className="text-center">{getTranslation("Week", lang)}</th>
                          <th className="text-center">{getTranslation("Month", lang)}</th>
                          <th className="text-center">{getTranslation("Overall", lang)}</th>
                          <th className="text-end">{getTranslation("Action", lang)}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {wardWise.wards.map((w, idx) => (
                          <tr key={w.ward_type_id || idx}>
                            <td className="fw-semibold text-dark">{w.ward_name || "Unassigned"}</td>
                            <td className="text-center">{w.today ?? 0}</td>
                            <td className="text-center">{w.this_week ?? 0}</td>
                            <td className="text-center">{w.this_month ?? 0}</td>
                            <td className="text-center fw-bold">{w.overall ?? 0}</td>
                            <td className="text-end">
                              <Button
                                color="light"
                                size="sm"
                                className="py-0 px-2 extra-small border"
                                onClick={() =>
                                  openDrilldown(
                                    "ward_wise_on_bed",
                                    `${w.ward_name || "Ward"} - ${getTranslation("On Bed Patients", lang)}`,
                                    getTranslation("Patients admitted in this ward", lang),
                                    w.ward_type_id ? { ward_type_id: w.ward_type_id } : {}
                                  )
                                }
                              >
                                {getTranslation("View / देखें", lang)}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>

          {/* Treatment In Progress (CIWA Withdrawal Severity) */}
          <Col xl="5" lg="12">
            <Card className="dashboard-card h-100">
              <CardBody className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                      <Heart size={18} color="#dc2626" />
                      {getTranslation("Treatment in Progress (CIWA) / उपचार एवं विड्रॉल स्थिति", lang)}
                    </h5>
                    <small className="text-muted">
                      {getTranslation("Detoxification withdrawal scoring for admitted patients", lang)}
                    </small>
                  </div>
                </div>

                {/* Severe Withdrawal */}
                <div
                  className="severity-row-pill"
                  style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}
                  onClick={() =>
                    openDrilldown(
                      "treatment_in_progress",
                      getTranslation("Severe Withdrawal Patients / गंभीर विड्रॉल मरीज़", lang),
                      getTranslation("CIWA rating marked as Severe withdrawal", lang),
                      { category: "severe" }
                    )
                  }
                  title={getTranslation("Click to view Severe Withdrawal patients", lang)}
                >
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-danger rounded-circle p-1.5"></span>
                    <div>
                      <div className="fw-bold text-danger small">
                        {getTranslation("Severe Withdrawal / गंभीर विड्रॉल", lang)}
                      </div>
                      <div className="text-muted extra-small" style={{ fontSize: "0.74rem" }}>
                        {getTranslation("Requires close monitoring & detox protocol", lang)}
                      </div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <h4 className="fw-bold text-danger mb-0">
                      {loading ? "..." : treatmentInProgress?.severe_withdrawal || 0}
                    </h4>
                    <ChevronRight size={14} className="text-danger" />
                  </div>
                </div>

                {/* Moderate Withdrawal */}
                <div
                  className="severity-row-pill"
                  style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a" }}
                  onClick={() =>
                    openDrilldown(
                      "treatment_in_progress",
                      getTranslation("Moderate Withdrawal Patients / मध्यम विड्रॉल मरीज़", lang),
                      getTranslation("CIWA rating marked as Moderate withdrawal", lang),
                      { category: "moderate" }
                    )
                  }
                  title={getTranslation("Click to view Moderate Withdrawal patients", lang)}
                >
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-warning rounded-circle p-1.5"></span>
                    <div>
                      <div className="fw-bold text-dark small" style={{ color: "#b45309" }}>
                        {getTranslation("Moderate Withdrawal / मध्यम विड्रॉल", lang)}
                      </div>
                      <div className="text-muted extra-small" style={{ fontSize: "0.74rem" }}>
                        {getTranslation("Under supportive therapy & observation", lang)}
                      </div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <h4 className="fw-bold mb-0" style={{ color: "#b45309" }}>
                      {loading ? "..." : treatmentInProgress?.moderate_withdrawal || 0}
                    </h4>
                    <ChevronRight size={14} style={{ color: "#b45309" }} />
                  </div>
                </div>

                {/* Under Therapy */}
                <div
                  className="severity-row-pill"
                  style={{ backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0" }}
                  onClick={() =>
                    openDrilldown(
                      "treatment_in_progress",
                      getTranslation("Under Therapy Patients / थेरेपी में मरीज़", lang),
                      getTranslation("Assessment completed with stabilized parameters", lang),
                      { category: "under_therapy" }
                    )
                  }
                  title={getTranslation("Click to view Under Therapy patients", lang)}
                >
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-success rounded-circle p-1.5"></span>
                    <div>
                      <div className="fw-bold text-success small">
                        {getTranslation("Under Therapy / सामान्य थेरेपी में", lang)}
                      </div>
                      <div className="text-muted extra-small" style={{ fontSize: "0.74rem" }}>
                        {getTranslation("Detox assessment completed, stable progress", lang)}
                      </div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <h4 className="fw-bold text-success mb-0">
                      {loading ? "..." : treatmentInProgress?.under_therapy || 0}
                    </h4>
                    <ChevronRight size={14} className="text-success" />
                  </div>
                </div>

                {/* Mild or Unclassified */}
                <div
                  className="severity-row-pill"
                  style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-secondary rounded-circle p-1.5"></span>
                    <div>
                      <div className="fw-semibold text-secondary small">
                        {getTranslation("Mild / Unclassified / हल्का या अप्रवर्गीकृत", lang)}
                      </div>
                      <div className="text-muted extra-small" style={{ fontSize: "0.74rem" }}>
                        {getTranslation("Routine monitoring", lang)}
                      </div>
                    </div>
                  </div>
                  <h4 className="fw-bold text-secondary mb-0">
                    {loading ? "..." : treatmentInProgress?.mild_or_unclassified_withdrawal || 0}
                  </h4>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* ------------------------------------------------------------- */}
        {/* ROW 3: LAB WORKFLOW & FOLLOW-UPS COMPLIANCE                   */}
        {/* ------------------------------------------------------------- */}
        <Row className="mt-3 g-3">
          {/* Medical Observations & Lab Analysis Pipeline */}
          <Col xl="6" md="12">
            <Card className="dashboard-card h-100">
              <CardBody className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                      <CheckSquare size={18} color="#24695c" />
                      {getTranslation("Laboratory & Medical Observations / प्रयोगशाला जांच", lang)}
                    </h5>
                    <small className="text-muted">
                      {getTranslation("Sample collection and report upload turnaround tracking", lang)}
                    </small>
                  </div>
                </div>

                {/* Pipeline Stats Grid */}
                <Row className="g-2.5">
                  {/* Sample to Collect */}
                  <Col sm="6" xs="12">
                    <div
                      className="p-3 rounded-3 border h-100 clickable-card"
                      style={{ backgroundColor: "#fffbeb", borderColor: "#fde68a" }}
                      onClick={() =>
                        openDrilldown(
                          "sample_to_collect",
                          getTranslation("Samples to Collect / नमूना संग्रह लंबित", lang),
                          getTranslation("Medical observations awaiting sample collection (48h SLA)", lang)
                        )
                      }
                      title={getTranslation("Click to view samples to collect", lang)}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="small fw-semibold text-secondary">
                          {getTranslation("Sample to Collect", lang)}
                        </span>
                        <ChevronRight size={14} className="text-muted" />
                      </div>
                      <h3 className="fw-bold mb-0 text-dark" style={{ color: "#b45309" }}>
                        {loading ? "..." : sampleCollection?.sample_to_collect || 0}
                      </h3>
                      <div className="text-muted extra-small mt-1">
                        {getTranslation("Pending sample collection", lang)}
                      </div>
                    </div>
                  </Col>

                  {/* Samples Collected */}
                  <Col sm="6" xs="12">
                    <div
                      className="p-3 rounded-3 border h-100 clickable-card"
                      style={{ backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }}
                      onClick={() =>
                        openDrilldown(
                          "samples_collected",
                          getTranslation("Samples Collected / नमूना एकत्रित", lang),
                          getTranslation("Lab samples successfully collected from patients", lang)
                        )
                      }
                      title={getTranslation("Click to view collected samples", lang)}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="small fw-semibold text-success">
                          {getTranslation("Samples Collected", lang)}
                        </span>
                        <ChevronRight size={14} className="text-muted" />
                      </div>
                      <h3 className="fw-bold mb-0 text-success">
                        {loading ? "..." : sampleCollection?.samples_collected || 0}
                      </h3>
                      <div className="text-muted extra-small mt-1">
                        {getTranslation("Ready for lab analysis", lang)}
                      </div>
                    </div>
                  </Col>

                  {/* Reports Not Uploaded */}
                  <Col sm="6" xs="12">
                    <div
                      className="p-3 rounded-3 border h-100 clickable-card"
                      style={{ backgroundColor: "#fef2f2", borderColor: "#fecaca" }}
                      onClick={() =>
                        openDrilldown(
                          "reports_not_uploaded",
                          getTranslation("Reports Not Uploaded / रिपोर्ट अपलोड लंबित", lang),
                          getTranslation("Samples collected but report file upload pending (72h SLA)", lang)
                        )
                      }
                      title={getTranslation("Click to view pending reports", lang)}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="small fw-semibold text-danger">
                          {getTranslation("Reports Not Uploaded", lang)}
                        </span>
                        <ChevronRight size={14} className="text-muted" />
                      </div>
                      <h3 className="fw-bold mb-0 text-danger">
                        {loading ? "..." : reportUpload?.reports_not_uploaded || 0}
                      </h3>
                      <div className="text-muted extra-small mt-1">
                        {getTranslation("Pending lab report PDF upload", lang)}
                      </div>
                    </div>
                  </Col>

                  {/* Reports Uploaded */}
                  <Col sm="6" xs="12">
                    <div
                      className="p-3 rounded-3 border h-100 clickable-card"
                      style={{ backgroundColor: "#ecfdf5", borderColor: "#a7f3d0" }}
                      onClick={() =>
                        openDrilldown(
                          "reports_uploaded",
                          getTranslation("Reports Uploaded / रिपोर्ट अपलोड पूर्ण", lang),
                          getTranslation("Lab reports successfully uploaded and ready for review", lang)
                        )
                      }
                      title={getTranslation("Click to view completed reports", lang)}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="small fw-semibold text-success">
                          {getTranslation("Reports Uploaded", lang)}
                        </span>
                        <ChevronRight size={14} className="text-muted" />
                      </div>
                      <h3 className="fw-bold mb-0 text-success">
                        {loading ? "..." : reportUpload?.reports_uploaded || 0}
                      </h3>
                      <div className="text-muted extra-small mt-1">
                        {getTranslation("Completed diagnostics", lang)}
                      </div>
                    </div>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>

          {/* Follow-up Care Tracking & Missed Follow-ups */}
          <Col xl="6" md="12">
            <Card className="dashboard-card h-100">
              <CardBody className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                      <Clock size={18} color="#d97706" />
                      {getTranslation("Follow-Up Care Pipeline / फॉलो-अप अनुवर्तन", lang)}
                    </h5>
                    <small className="text-muted">
                      {getTranslation("Scheduled follow-ups across medical and detoxification modules", lang)}
                    </small>
                  </div>
                </div>

                {/* Follow-up Sources Breakdown */}
                <div className="mb-3">
                  <div
                    className="p-2.5 rounded-3 border mb-2 d-flex justify-content-between align-items-center clickable-card"
                    style={{ backgroundColor: "#f8fafc" }}
                    onClick={() =>
                      openDrilldown(
                        "follow_ups",
                        getTranslation("Medical Observation Follow-ups / चिकित्सा अवलोकन फॉलो-अप", lang),
                        getTranslation("Follow-up tests scheduled for medical observations", lang),
                        { source: "medical_observation" }
                      )
                    }
                  >
                    <div>
                      <span className="fw-semibold text-dark small">
                        {getTranslation("Medical Observation Follow-ups", lang)}
                      </span>
                      <div className="text-muted extra-small">
                        {getTranslation("Repeat lab work & vitals recheck", lang)}
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-bold text-dark">
                        {loading ? "..." : followUps?.by_source?.medical_observation?.[activePeriod] ?? 0}
                      </span>
                      <ChevronRight size={14} className="text-muted" />
                    </div>
                  </div>

                  <div
                    className="p-2.5 rounded-3 border mb-2 d-flex justify-content-between align-items-center clickable-card"
                    style={{ backgroundColor: "#f8fafc" }}
                    onClick={() =>
                      openDrilldown(
                        "follow_ups",
                        getTranslation("Detoxification Follow-ups / डिटॉक्स फॉलो-अप", lang),
                        getTranslation("Detox CIWA reassessment appointments", lang),
                        { source: "detoxification" }
                      )
                    }
                  >
                    <div>
                      <span className="fw-semibold text-dark small">
                        {getTranslation("Detoxification Reassessments", lang)}
                      </span>
                      <div className="text-muted extra-small">
                        {getTranslation("Withdrawal symptoms scoring follow-up", lang)}
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-bold text-dark">
                        {loading ? "..." : followUps?.by_source?.detoxification?.[activePeriod] ?? 0}
                      </span>
                      <ChevronRight size={14} className="text-muted" />
                    </div>
                  </div>

                  <div
                    className="p-2.5 rounded-3 border d-flex justify-content-between align-items-center clickable-card"
                    style={{ backgroundColor: "#f8fafc" }}
                    onClick={() =>
                      openDrilldown(
                        "follow_ups",
                        getTranslation("Discharge Follow-ups / डिस्चार्ज फॉलो-अप", lang),
                        getTranslation("Post-discharge outpatient care check-ins", lang),
                        { source: "discharge_follow_up" }
                      )
                    }
                  >
                    <div>
                      <span className="fw-semibold text-dark small">
                        {getTranslation("Post-Discharge Follow-ups", lang)}
                      </span>
                      <div className="text-muted extra-small">
                        {getTranslation("Outpatient recovery checks", lang)}
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-bold text-dark">
                        {loading ? "..." : followUps?.by_source?.discharge_follow_up?.[activePeriod] ?? 0}
                      </span>
                      <ChevronRight size={14} className="text-muted" />
                    </div>
                  </div>
                </div>

                {/* Missed Follow-ups Highlight Box */}
                <div
                  className="p-3 rounded-3 border d-flex justify-content-between align-items-center clickable-card"
                  style={{ backgroundColor: "#fef2f2", borderColor: "#fecaca" }}
                  onClick={() =>
                    openDrilldown(
                      "missed_follow_ups",
                      getTranslation("Missed Follow-ups / छूटे हुए फॉलो-अप", lang),
                      getTranslation("Follow-ups past due date with no recorded subsequent visit", lang)
                    )
                  }
                  title={getTranslation("Click to view missed follow-up appointments", lang)}
                >
                  <div className="d-flex align-items-center gap-2.5">
                    <AlertTriangle size={20} color="#dc2626" />
                    <div>
                      <div className="fw-bold text-danger small">
                        {getTranslation("Missed Follow-Ups / छूटे हुए फॉलो-अप", lang)}
                      </div>
                      <div className="text-muted extra-small" style={{ fontSize: "0.75rem" }}>
                        {getTranslation("Scheduled date elapsed without visit recorded", lang)}
                      </div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <h4 className="fw-bold text-danger mb-0">
                      {loading ? "..." : formatNumber(getPeriodCount(missedFollowUps))}
                    </h4>
                    <ChevronRight size={14} className="text-danger" />
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* ------------------------------------------------------------- */}
        {/* ROW 4: PATIENT WISE CLINICAL MODULE ANALYSIS MATRIX           */}
        {/* ------------------------------------------------------------- */}
        <Row className="mt-3 g-3">
          <Col xl="12">
            <Card className="dashboard-card">
              <CardBody className="p-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                  <div>
                    <h5 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                      <FileText size={18} color="#24695c" />
                      {getTranslation("Patient-Wise Clinical Module Analysis / मॉड्यूल अनुसार मूल्यांकन स्थिति", lang)}
                    </h5>
                    <small className="text-muted">
                      {getTranslation("Compliance, completion, and pending status across clinical forms", lang)}
                    </small>
                  </div>

                  {/* Patient Scope Tabs */}
                  <div className="d-flex align-items-center gap-1.5 bg-light p-1 rounded-pill border">
                    <button
                      type="button"
                      className={`period-tab-btn ${patientWiseScope === "not_discharged" ? "active" : ""}`}
                      onClick={() => setPatientWiseScope("not_discharged")}
                      style={{ fontSize: "0.78rem", padding: "4px 12px" }}
                    >
                      {getTranslation("In-Patients (Not Discharged) / भर्ती मरीज़", lang)} (
                      {patientWiseAnalysis?.patients?.not_discharged ?? 0})
                    </button>
                    <button
                      type="button"
                      className={`period-tab-btn ${patientWiseScope === "discharged" ? "active" : ""}`}
                      onClick={() => setPatientWiseScope("discharged")}
                      style={{ fontSize: "0.78rem", padding: "4px 12px" }}
                    >
                      {getTranslation("Discharged / डिस्चार्ज", lang)} (
                      {patientWiseAnalysis?.patients?.discharged ?? 0})
                    </button>
                    <button
                      type="button"
                      className={`period-tab-btn ${patientWiseScope === "overall" ? "active" : ""}`}
                      onClick={() => setPatientWiseScope("overall")}
                      style={{ fontSize: "0.78rem", padding: "4px 12px" }}
                    >
                      {getTranslation("All Patients / सभी मरीज़", lang)} (
                      {patientWiseAnalysis?.patients?.overall ?? 0})
                    </button>
                  </div>
                </div>

                {/* Modules Table */}
                {patientWiseAnalysis?.modules && patientWiseAnalysis.modules.length > 0 ? (
                  <div className="table-responsive">
                    <Table hover className="custom-table mb-0 align-middle">
                      <thead>
                        <tr>
                          <th>{getTranslation("Module / मॉड्यूल का नाम", lang)}</th>
                          <th>{getTranslation("Scope / दायरा", lang)}</th>
                          <th className="text-center">{getTranslation("Completed / पूर्ण", lang)}</th>
                          <th className="text-center">{getTranslation("Pending / लंबित", lang)}</th>
                          <th style={{ width: "220px" }}>{getTranslation("Compliance Progress / प्रगति", lang)}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patientWiseAnalysis.modules.map((m) => {
                          const counts = m[patientWiseScope] || m.overall || { completed: 0, pending: 0 };
                          const completed = counts.completed || 0;
                          const pending = counts.pending || 0;
                          const total = completed + pending;
                          const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

                          return (
                            <tr key={m.module_key}>
                              <td>
                                <span className="fw-semibold text-dark">{m.module_name}</span>
                              </td>
                              <td>
                                <Badge color="light" className="text-dark border extra-small text-capitalize">
                                  {m.applies_to || "All"}
                                </Badge>
                              </td>
                              <td className="text-center">
                                <Button
                                  color="success"
                                  size="sm"
                                  className="py-0.5 px-2.5 rounded-pill extra-small fw-semibold shadow-sm"
                                  onClick={() =>
                                    openDrilldown(
                                      "patient_wise_analysis",
                                      `${m.module_name} - ${getTranslation("Completed Assessments", lang)}`,
                                      getTranslation("Patients who have completed this clinical module", lang),
                                      {
                                        module: m.module_key,
                                        module_status: "completed",
                                        patient_type: patientWiseScope,
                                      }
                                    )
                                  }
                                  title={getTranslation("Click to view completed patients", lang)}
                                >
                                  {completed}
                                </Button>
                              </td>
                              <td className="text-center">
                                <Button
                                  color={pending > 0 ? "warning" : "light"}
                                  size="sm"
                                  className={`py-0.5 px-2.5 rounded-pill extra-small fw-semibold shadow-sm ${
                                    pending > 0 ? "text-dark" : "text-muted"
                                  }`}
                                  onClick={() =>
                                    openDrilldown(
                                      "patient_wise_analysis",
                                      `${m.module_name} - ${getTranslation("Pending Assessments", lang)}`,
                                      getTranslation("Patients with pending assessments for this module", lang),
                                      {
                                        module: m.module_key,
                                        module_status: "pending",
                                        patient_type: patientWiseScope,
                                      }
                                    )
                                  }
                                  title={getTranslation("Click to view pending patients", lang)}
                                >
                                  {pending}
                                </Button>
                              </td>
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  <Progress
                                    value={percent}
                                    style={{ height: 6, flex: 1 }}
                                    color={percent >= 80 ? "success" : percent >= 40 ? "warning" : "danger"}
                                  />
                                  <span className="small text-muted" style={{ minWidth: "35px" }}>
                                    {percent}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}

                        {/* Grouped Modules Row (e.g. CBT & Intake & Sex Desire) */}
                        {patientWiseAnalysis.grouped_modules &&
                          patientWiseAnalysis.grouped_modules.map((gm) => {
                            const counts = gm[patientWiseScope] || gm.overall || { completed: 0, pending: 0 };
                            const completed = counts.completed || 0;
                            const pending = counts.pending || 0;
                            const total = completed + pending;
                            const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

                            return (
                              <tr key={gm.module_key} style={{ backgroundColor: "#f8fafc" }}>
                                <td>
                                  <div className="fw-bold text-dark d-flex align-items-center gap-1.5">
                                    <Layers size={14} color="#24695c" />
                                    <span>{gm.module_name}</span>
                                    <Badge color="primary" className="ms-1 extra-small">
                                      Combined Group
                                    </Badge>
                                  </div>
                                </td>
                                <td>
                                  <Badge color="light" className="text-secondary border extra-small">
                                    7 Forms Combined
                                  </Badge>
                                </td>
                                <td className="text-center">
                                  <Button
                                    color="success"
                                    size="sm"
                                    className="py-0.5 px-2.5 rounded-pill extra-small fw-semibold shadow-sm"
                                    onClick={() =>
                                      openDrilldown(
                                        "patient_wise_analysis",
                                        `${gm.module_name} - ${getTranslation("Completed", lang)}`,
                                        getTranslation("Patients who completed all 7 combined forms", lang),
                                        {
                                          module: gm.module_key,
                                          module_status: "completed",
                                          patient_type: patientWiseScope,
                                        }
                                      )
                                    }
                                  >
                                    {completed}
                                  </Button>
                                </td>
                                <td className="text-center">
                                  <Button
                                    color={pending > 0 ? "warning" : "light"}
                                    size="sm"
                                    className={`py-0.5 px-2.5 rounded-pill extra-small fw-semibold shadow-sm ${
                                      pending > 0 ? "text-dark" : "text-muted"
                                    }`}
                                    onClick={() =>
                                      openDrilldown(
                                        "patient_wise_analysis",
                                        `${gm.module_name} - ${getTranslation("Pending", lang)}`,
                                        getTranslation("Patients with at least one form pending in this group", lang),
                                        {
                                          module: gm.module_key,
                                          module_status: "pending",
                                          patient_type: patientWiseScope,
                                        }
                                      )
                                    }
                                  >
                                    {pending}
                                  </Button>
                                </td>
                                <td>
                                  <div className="d-flex align-items-center gap-2">
                                    <Progress
                                      value={percent}
                                      style={{ height: 6, flex: 1 }}
                                      color={percent >= 80 ? "success" : percent >= 40 ? "warning" : "danger"}
                                    />
                                    <span className="small text-muted" style={{ minWidth: "35px" }}>
                                      {percent}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-4 text-center text-muted">
                    {loading
                      ? getTranslation("Loading clinical analysis... / डेटा लोड हो रहा है...", lang)
                      : getTranslation("No clinical module data available / डेटा उपलब्ध नहीं है", lang)}
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Dashboard;
