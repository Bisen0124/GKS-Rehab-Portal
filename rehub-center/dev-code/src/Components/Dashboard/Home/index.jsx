import React, { useEffect, useState } from "react";
import { Button, Card, CardBody, Col, Container, Modal, Progress, Row, Table } from "reactstrap";
import Chart from "react-apexcharts";
import { useBranch } from "../../../contexts/BranchContext";
import { useLang } from "../../../contexts/LangContext";
import { getTranslation } from "../../../utils/translator";

/* ------------------------------------------------------------------ */
/* Custom Inline SVG Icons                                            */
/* ------------------------------------------------------------------ */
const IconPatients = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const IconAssessment = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4"></polyline>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
  </svg>
);

const IconAdmitted = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

const IconCollection = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
    <line x1="12" y1="8" x2="12" y2="16"></line>
    <line x1="8" y1="12" x2="16" y2="12"></line>
  </svg>
);

const IconShield = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
);

const IconMapPin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

/* ------------------------------------------------------------------ */
/* Data hook                                                          */
/* ------------------------------------------------------------------ */
const useDashboardSummary = () => {
  const { selectedBranch } = useBranch();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (!selectedBranch) return;

    const fetchSummary = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("Authorization");

        const response = await fetch(
          `https://gks-yjdc.onrender.com/api/dashboard/summary?branch_id=${selectedBranch}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `${token}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch dashboard summary");

        const result = await response.json();
        if (isMounted) setSummary(result?.data || null);
      } catch (err) {
        console.error("Error fetching dashboard summary:", err);
        if (isMounted) setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSummary();

    return () => {
      isMounted = false;
    };
  }, [selectedBranch]);

  return { summary, loading, error };
};

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
const formatNumber = (value) => {
  if (value === undefined || value === null) return "-";
  return new Intl.NumberFormat("en-IN").format(value);
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

/* ------------------------------------------------------------------ */
/* Global Styling Rules                                               */
/* ------------------------------------------------------------------ */
const DashboardStyles = () => (
  <style>{`
    .dashboard-pro {
      background-color: #f8fafc;
      min-height: 100vh;
      padding: 1.5rem;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
    }
    .dashboard-pro .card {
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.02);
      background: #ffffff;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      margin-bottom: 1.25rem;
    }
    .dashboard-pro .card:hover {
      box-shadow: 0 8px 24px rgba(0,0,0,0.04);
    }
    
    .header-greeting-card {
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 60%, #f1f5f9 100%) !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 16px !important;
      position: relative;
    }
    .header-greeting-card::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 6px;
      height: 100%;
      background: linear-gradient(180deg, #84cc16 0%, #10b981 100%);
    }
    .meta-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background-color: #ffffff;
      color: #475569;
      font-weight: 500;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 0.8rem;
      border: 1px solid #e2e8f0;
    }
    .live-status-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      padding: 6px 14px;
      border-radius: 30px;
      font-size: 0.78rem;
      color: #64748b;
      font-weight: 500;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }
    .status-dot {
      width: 8px;
      height: 8px;
      background-color: #22c55e;
      border-radius: 50%;
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
    }
    .btn-pro-profile {
      border-radius: 10px !important;
      font-weight: 600 !important;
      font-size: 0.85rem !important;
      padding: 8px 18px !important;
      background-color: #0f172a !important;
      border: none !important;
      transition: all 0.2s ease !important;
    }
    .btn-pro-profile:hover {
      background-color: #1e293b !important;
      transform: translateY(-1px);
    }

    .dashboard-pro .stat-card-icon {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f1f5f9;
      color: #0f172a;
    }
    .dashboard-pro .trend-badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 20px;
      display: inline-flex;
      align-items: center;
      gap: 3px;
    }
    .dashboard-pro .trend-badge.up {
      background-color: #dcfce7;
      color: #15803d;
    }
    .dashboard-pro .trend-badge.down {
      background-color: #fee2e2;
      color: #b91c1c;
    }
    .dashboard-pro .section-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: #0f172a;
    }
    .dashboard-pro .table thead th {
      border-top: none;
      border-bottom: 1px solid #f1f5f9;
      color: #64748b;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
      padding: 12px 16px;
    }
    .dashboard-pro .table tbody td {
      padding: 14px 16px;
      vertical-align: middle;
      font-size: 0.875rem;
      color: #334155;
      border-bottom: 1px solid #f8fafc;
    }
    .dashboard-pro .badge-soft-warning {
      background-color: #fef3c7;
      color: #d97706;
      border-radius: 6px;
      padding: 4px 8px;
    }
    .dashboard-pro .badge-soft-success {
      background-color: #dcfce7;
      color: #16a34a;
      border-radius: 6px;
      padding: 4px 8px;
    }
    .dashboard-pro .progress {
      border-radius: 8px;
      background-color: #f1f5f9;
      overflow: hidden;
    }
    .dashboard-pro .progress-bar {
      background-color: #84cc16;
    }
    .dashboard-pro .breakup-item {
      display: flex;
      justify-content: space-between;
      font-size: 0.825rem;
      padding: 6px 0;
      color: #475569;
    }

    .profile-modal .modal-content {
      border-radius: 20px;
      border: none;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
      overflow: hidden;
    }
    .profile-modal-header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 2rem 1.5rem 3.5rem;
      color: #ffffff;
      position: relative;
    }
    .profile-avatar-wrapper {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: #84cc16;
      color: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
      font-weight: 700;
      border: 4px solid #ffffff;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      position: absolute;
      bottom: -36px;
      left: 1.5rem;
    }
    .profile-modal-body {
      padding: 3rem 1.5rem 1.5rem;
      background: #f8fafc;
    }
    .profile-info-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1rem;
      margin-bottom: 0.75rem;
    }
    .profile-info-label {
      font-size: 0.725rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      font-weight: 600;
      margin-bottom: 2px;
    }
    .profile-info-value {
      font-size: 0.925rem;
      color: #0f172a;
      font-weight: 600;
    }

    .dashboard-footer {
      padding: 1.5rem 0 0.5rem;
      text-align: center;
      color: #94a3b8;
      font-size: 0.8rem;
    }
  `}</style>
);

/* ------------------------------------------------------------------ */
/* Profile Modal Component                                            */
/* ------------------------------------------------------------------ */
const ProfileModal = ({ isOpen, toggle, profile, lang }) => {
  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered className="profile-modal">
      <div className="profile-modal-header">
        <button
          onClick={toggle}
          type="button"
          className="btn-close btn-close-white position-absolute top-0 end-0 m-3"
          aria-label="Close"
        ></button>
        <span className="badge bg-success-subtle text-success rounded-pill px-2.5 py-1 extra-small fw-semibold mb-2">
          ● {getTranslation("Active Account/सक्रिय खाता", lang)}
        </span>
        <h4 className="fw-bold mb-0 text-white">
          {profile?.name || getTranslation("User Details/उपयोगकर्ता विवरण", lang)}
        </h4>
        <p className="text-slate-300 small mb-0">
          {profile?.role_name || getTranslation("Administrator/प्रशासक", lang)}
        </p>

        <div className="profile-avatar-wrapper">{getInitials(profile?.name)}</div>
      </div>

      <div className="profile-modal-body">
        <Row className="g-2">
          <Col xs="6">
            <div className="profile-info-card">
              <div className="profile-info-label">
                {getTranslation("Full Name/पूरा नाम", lang)}
              </div>
              <div className="profile-info-value">{profile?.name || "-"}</div>
            </div>
          </Col>
          <Col xs="6">
            <div className="profile-info-card">
              <div className="profile-info-label">
                {getTranslation("User Role/उपयोगकर्ता भूमिका", lang)}
              </div>
              <div className="profile-info-value">{profile?.role_name || "-"}</div>
            </div>
          </Col>
          <Col xs="6">
            <div className="profile-info-card">
              <div className="profile-info-label">
                {getTranslation("Branch Name/शाखा का नाम", lang)}
              </div>
              <div className="profile-info-value">{profile?.branch?.branch_name || "-"}</div>
            </div>
          </Col>
          <Col xs="6">
            <div className="profile-info-card">
              <div className="profile-info-label">
                {getTranslation("Branch Code/शाखा कोड", lang)}
              </div>
              <div className="profile-info-value">{profile?.branch?.branch_code || "-"}</div>
            </div>
          </Col>
          <Col xs="12">
            <div className="profile-info-card">
              <div className="profile-info-label">
                {getTranslation("Last Session Login/अंतिम सत्र लॉगिन", lang)}
              </div>
              <div className="profile-info-value">
                {profile?.last_login?.login_time
                  ? new Date(profile.last_login.login_time).toLocaleString("en-IN", {
                      dateStyle: "full",
                      timeStyle: "medium",
                    })
                  : "-"}
              </div>
            </div>
          </Col>
        </Row>

        <div className="d-flex justify-content-end gap-2 mt-3 pt-2">
          <Button color="light" size="sm" onClick={toggle} className="px-3 rounded-3 fw-semibold">
            {getTranslation("Close/बंद करें", lang)}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

/* ------------------------------------------------------------------ */
/* Header Greeting Card Component                                      */
/* ------------------------------------------------------------------ */
const ProfileGreetingCard = ({ profile, generatedAt, loading, onOpenProfile, lang }) => {
  return (
    <Card className="header-greeting-card border-0 shadow-sm overflow-hidden mb-3">
      <CardBody className="p-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <h2 className="fw-bold mb-0 text-dark tracking-tight">
                {loading
                  ? getTranslation("Welcome Back.../वापसी पर स्वागत है...", lang)
                  : profile?.welcome_message ||
                    `${getTranslation("Welcome Back, /वापसी पर स्वागत है, ", lang)}${profile?.name || "User"}`}
              </h2>
              <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-1 small fw-semibold">
                ● {getTranslation("Active/सक्रिय", lang)}
              </span>
            </div>

            {!loading && profile && (
              <div className="d-flex align-items-center flex-wrap gap-2 text-muted small">
                {profile.role_name && (
                  <span className="meta-badge">
                    <IconShield /> {profile.role_name}
                  </span>
                )}

                {profile.branch?.branch_name && (
                  <span className="meta-badge">
                    <IconMapPin /> {profile.branch.branch_name}
                  </span>
                )}

                {profile.last_login?.login_time && (
                  <span className="meta-badge">
                    <IconClock /> {getTranslation("Last login: /अंतिम लॉगिन: ", lang)}
                    {new Date(profile.last_login.login_time).toLocaleString("en-IN", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="d-flex align-items-center gap-3">
            {generatedAt && (
              <div className="live-status-pill">
                <span className="status-dot"></span>
                <span>
                  {getTranslation("Updated /अद्यतन ", lang)}
                  {new Date(generatedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              </div>
            )}

            <Button color="dark" className="btn-pro-profile shadow-sm" onClick={onOpenProfile}>
              {getTranslation("View Profile/प्रोफाइल देखें", lang)}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

/* ------------------------------------------------------------------ */
/* Stat Card Component                                                */
/* ------------------------------------------------------------------ */
const StatCard = ({ icon, amount, title, percent, trend, isCurrency = false, loading }) => {
  const isDown = trend === "down";
  return (
    <Card className="h-100">
      <CardBody className="p-3 d-flex flex-column justify-content-between">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="stat-card-icon">{icon}</div>
          {!loading && percent !== undefined && percent !== null && (
            <span className={`trend-badge ${isDown ? "down" : "up"}`}>
              {isDown ? "↘" : "↗"} {Math.abs(percent)}%
            </span>
          )}
        </div>
        <div>
          <h2 className="fw-bold mb-0 text-dark">
            {loading ? "..." : isCurrency ? formatCurrency(amount) : formatNumber(amount)}
          </h2>
          <span className="text-muted small fw-medium">{title}</span>
        </div>
      </CardBody>
    </Card>
  );
};

/* ------------------------------------------------------------------ */
/* Admission Overview Chart                                           */
/* ------------------------------------------------------------------ */
const AdmissionOverviewCard = ({ data, loading, lang }) => {
  const trend = data?.trend || [];
  const categories = trend.map((t) => t.label);
  const series = [{ name: getTranslation("Admissions/प्रवेश", lang), data: trend.map((t) => t.total_admissions) }];

  const options = {
    chart: { toolbar: { show: false }, zoom: { enabled: false }, fontFamily: "inherit" },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 3 },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.05,
        colorStops: [
          { offset: 0, color: "#84cc16", opacity: 0.4 },
          { offset: 100, color: "#84cc16", opacity: 0.0 },
        ],
      },
    },
    colors: ["#84cc16"],
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: "#94a3b8", fontSize: "12px" } },
    },
    yaxis: { labels: { style: { colors: "#94a3b8" } } },
    grid: { borderColor: "#f1f5f9", strokeDashArray: 4 },
  };

  return (
    <Card>
      <CardBody className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="section-title mb-0">
              {data?.chart_title
                ? getTranslation(`${data.chart_title}/प्रवेश अवलोकन`, lang)
                : getTranslation("Admission Overview/प्रवेश अवलोकन", lang)}
            </h5>
            <span className="text-muted small">
              {getTranslation("Admissions timeline across periods/विभिन्न अवधि में प्रवेश की समयरेखा", lang)}
            </span>
          </div>
          {data?.summary?.growth_percentage !== undefined && (
            <span className={`trend-badge ${data.summary.trend === "down" ? "down" : "up"}`}>
              {data.summary.trend === "down" ? "↘" : "↗"}{" "}
              {Math.abs(data.summary.growth_percentage)}% {getTranslation("vs last period/पिछली अवधि की तुलना में", lang)}
            </span>
          )}
        </div>
        {loading ? (
          <div className="py-5 text-center text-muted">
            {getTranslation("Loading chart data.../चार्ट डेटा लोड हो रहा है...", lang)}
          </div>
        ) : (
          <Chart options={options} series={series} type="area" height={280} />
        )}
      </CardBody>
    </Card>
  );
};

/* ------------------------------------------------------------------ */
/* Assessment Growth Radial Chart Component                           */
/* ------------------------------------------------------------------ */
const GrowthOverviewCard = ({ data, loading, lang }) => {
  const overall = data?.overall;
  const genFamily = data?.gen_family_forms;
  const allModules = data?.modules || [];
  const topModules = allModules.slice(0, 4);

  const series = topModules.length
    ? topModules.map((m) => m.completion_percentage || 0)
    : [0];
  const labels = topModules.length
    ? topModules.map((m) => m.module_name)
    : ["No Data"];

  const options = {
    chart: { toolbar: { show: false }, fontFamily: "inherit" },
    labels,
    colors: ["#84cc16", "#0284c7", "#f59e0b", "#64748b"],
    plotOptions: {
      radialBar: {
        hollow: { size: "45%" },
        track: { background: "#f1f5f9" },
        dataLabels: {
          name: { fontSize: "12px", color: "#64748b" },
          value: { fontSize: "18px", fontWeight: "700", color: "#0f172a" },
        },
      },
    },
    legend: { show: false },
  };

  return (
    <Card className="h-100">
      <CardBody className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="section-title mb-0">
            {getTranslation("Growth Overview/प्रगति अवलोकन", lang)}
          </h5>
          {overall?.completion_percentage !== undefined && (
            <span className="trend-badge up">
              ↗ {overall.completion_percentage}% {getTranslation("Completion/पूर्णता", lang)}
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-4 text-center text-muted">
            {getTranslation("Loading growth statistics.../प्रगति आँकड़े लोड हो रहे हैं...", lang)}
          </div>
        ) : (
          <>
            <div className="d-flex align-items-center flex-wrap justify-content-around mb-3">
              <Chart options={options} series={series} type="radialBar" height={220} width={220} />
              <div className="small text-secondary">
                <div className="mb-1">
                  {getTranslation("Modules/मॉड्यूल", lang)}: <strong className="text-dark">{overall?.total_modules || 0}</strong>
                </div>
                <div className="mb-1">
                  {getTranslation("Assessments/मूल्यांकन", lang)}: <strong className="text-dark">{overall?.total_assessments || 0}</strong>
                </div>
                <div className="mb-1">
                  {getTranslation("Completed/पूर्ण", lang)}: <strong className="text-success">{overall?.completed_assessments || 0}</strong>
                </div>
                <div className="mb-1">
                  {getTranslation("Pending/लंबित", lang)}: <strong className="text-warning">{overall?.pending_assessments || 0}</strong>
                </div>
                <div>
                  {getTranslation("Family Forms/पारिवारिक फॉर्म", lang)}: <strong className="text-dark">{genFamily?.total_forms || 0}</strong>
                </div>
              </div>
            </div>

            <div style={{ maxHeight: 160, overflowY: "auto" }} className="pe-1">
              {allModules.map((m) => (
                <div key={m.module_key || m.module_name} className="mb-2">
                  <div className="d-flex justify-content-between small mb-1">
                    <span className="fw-medium text-dark">{m.module_name}</span>
                    <span className="text-muted">
                      {m.completed_assessments}/{m.total_assessments} ({m.completion_percentage}%)
                    </span>
                  </div>
                  <Progress value={m.completion_percentage || 0} style={{ height: 5 }} />
                </div>
              ))}
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
};

/* ------------------------------------------------------------------ */
/* Latest Activity List                                                */
/* ------------------------------------------------------------------ */
const LatestActivityCard = ({ data, loading, lang }) => {
  const activities = data?.activities || [];

  return (
    <Card className="h-100">
      <CardBody className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="section-title mb-0">
            {getTranslation("Latest Activity/नवीनतम गतिविधि", lang)}
          </h5>
          <span className="badge bg-light text-dark fw-normal text-capitalize">
            {data?.period || getTranslation("Recent/हाल ही में", lang)}
          </span>
        </div>

        {loading ? (
          <div className="py-4 text-center text-muted">
            {getTranslation("Loading activities.../गतिविधियाँ लोड हो रही हैं...", lang)}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-muted py-4 text-center small">
            {getTranslation("No recent activity recorded./कोई हालिया गतिविधि दर्ज नहीं की गई।", lang)}
          </div>
        ) : (
          <div className="pe-1" style={{ maxHeight: 340, overflowY: "auto" }}>
            {activities.map((a, idx) => (
              <div
                key={idx}
                className="d-flex justify-content-between align-items-start py-2 border-bottom"
                style={{ borderColor: "#f8fafc" }}
              >
                <div>
                  <div className="fw-semibold text-dark small">{a.activity_title}</div>
                  <div className="text-muted extra-small" style={{ fontSize: "0.75rem" }}>
                    {a.patient_name} · <span className="text-secondary">{a.gks_id}</span>
                  </div>
                </div>
                <div className="text-end ms-2">
                  <span className="badge-soft-success extra-small fw-semibold">
                    {a.activity_status}
                  </span>
                  <div className="text-muted extra-small mt-1" style={{ fontSize: "0.7rem" }}>
                    {a.time_ago}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

/* ------------------------------------------------------------------ */
/* Recent Admissions Table Card                                       */
/* ------------------------------------------------------------------ */
const RecentAdmissionsCard = ({ data, loading, lang }) => {
  const admissions = data?.admissions || [];

  return (
    <Card>
      <CardBody className="p-4">
        <h5 className="section-title mb-3">
          {getTranslation("Recent Admissions/हाल के प्रवेश", lang)}
        </h5>
        {loading ? (
          <div className="py-4 text-center text-muted">
            {getTranslation("Loading recent records.../हाल के रिकॉर्ड लोड हो रहे हैं...", lang)}
          </div>
        ) : (
          <div className="table-responsive">
            <Table className="align-middle mb-0">
              <thead>
                <tr>
                  <th>{getTranslation("Patient/मरीज़", lang)}</th>
                  <th>{getTranslation("GKS ID/जीकेएस आईडी", lang)}</th>
                  <th>{getTranslation("Ward/वार्ड", lang)}</th>
                  <th>{getTranslation("Admit Date/प्रवेश तिथि", lang)}</th>
                  <th>{getTranslation("Days Stayed/रुके हुए दिन", lang)}</th>
                  <th>{getTranslation("Payment Status/भुगतान स्थिति", lang)}</th>
                </tr>
              </thead>
              <tbody>
                {admissions.map((row) => (
                  <tr key={row.entry_id || row.gks_id}>
                    <td className="fw-semibold text-dark">{row.name}</td>
                    <td>{row.gks_id}</td>
                    <td>{row.ward_name || "-"}</td>
                    <td>
                      {row.admit_date ? new Date(row.admit_date).toLocaleDateString() : "-"}
                    </td>
                    <td>{row.days_stayed} {getTranslation("days/दिन", lang)}</td>
                    <td>
                      <span
                        className={
                          row.payment_status === "Pending"
                            ? "badge-soft-warning"
                            : "badge-soft-success"
                        }
                      >
                        {getTranslation(
                          `${row.payment_status}/${row.payment_status === "Pending" ? "लंबित" : "सफल"}`,
                          lang
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

/* ------------------------------------------------------------------ */
/* Patient Registrations Bar Chart                                    */
/* ------------------------------------------------------------------ */
const RegistrationsCard = ({ data, loading, lang }) => {
  const trend = data?.trend || [];
  const categories = trend.map((t) => t.label);
  const series = [{ name: getTranslation("Registrations/पंजीकरण", lang), data: trend.map((t) => t.total_registrations) }];

  const options = {
    chart: { toolbar: { show: false }, fontFamily: "inherit" },
    plotOptions: { bar: { columnWidth: "35%", borderRadius: 4 } },
    dataLabels: { enabled: false },
    colors: ["#0f172a"],
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: "#94a3b8", fontSize: "11px" } },
    },
    yaxis: { labels: { style: { colors: "#94a3b8" } } },
    grid: { borderColor: "#f1f5f9" },
  };

  return (
    <Card>
      <CardBody className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="section-title mb-0">
            {getTranslation("Patient Registrations/मरीज़ पंजीकरण", lang)}
          </h5>
          <span className="trend-badge up">
            ↗ {data?.summary?.total_registrations ?? 0} {getTranslation("Total/कुल", lang)}
          </span>
        </div>
        {loading ? (
          <div className="py-4 text-center text-muted">
            {getTranslation("Loading chart.../चार्ट लोड हो रहा है...", lang)}
          </div>
        ) : (
          <Chart options={options} series={series} type="bar" height={200} />
        )}
      </CardBody>
    </Card>
  );
};

/* ------------------------------------------------------------------ */
/* Financial Transaction Summary Card                                 */
/* ------------------------------------------------------------------ */
const TransactionsSummaryCard = ({ data, loading, lang }) => {
  const charges = data?.charges_break_up || {};
  const paymentMethods = data?.payment_methods || [];

  return (
    <Card>
      <CardBody className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="section-title mb-0">
            {getTranslation("Transactions/लेन-देन", lang)}
          </h5>
          {data?.growth_percentage !== undefined && (
            <span className={`trend-badge ${data?.trend === "down" ? "down" : "up"}`}>
              {data?.trend === "down" ? "↘" : "↗"} {Math.abs(data.growth_percentage)}%
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-4 text-center text-muted">
            {getTranslation("Loading transactions.../लेन-देन लोड हो रहे हैं...", lang)}
          </div>
        ) : (
          <>
            <div className="d-flex justify-content-between mb-1">
              <span className="text-muted small">
                {getTranslation("Collected/एकत्रित", lang)}
              </span>
              <strong className="text-dark">{formatCurrency(data?.total_collected_amount)}</strong>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted small">
                {getTranslation("Outstanding/बकाया", lang)}
              </span>
              <strong className="text-danger">{formatCurrency(data?.outstanding_amount)}</strong>
            </div>

            <Progress value={data?.collection_percentage || 0} className="mb-2" style={{ height: 6 }} />

            <div className="text-muted extra-small mb-3" style={{ fontSize: "0.75rem" }}>
              {data?.collection_percentage || 0}% {getTranslation("of/का", lang)} {formatCurrency(data?.total_billed_amount)} {getTranslation("billed/बिल किया गया", lang)}
            </div>

            <div className="border-top pt-3 mb-3">
              <span className="fw-bold text-dark d-block mb-2 small">
                {getTranslation("Charges Breakdown/शुल्क विवरण", lang)}
              </span>
              <div className="breakup-item">
                <span>{getTranslation("Ward Charges/वार्ड शुल्क", lang)}</span>
                <span>{formatCurrency(charges.ward_charges)}</span>
              </div>
              <div className="breakup-item">
                <span>{getTranslation("Package Charges/पैकेज शुल्क", lang)}</span>
                <span>{formatCurrency(charges.package_charges)}</span>
              </div>
              <div className="breakup-item">
                <span>{getTranslation("Medicine/दवाइयां", lang)}</span>
                <span>{formatCurrency(charges.medicine_charges)}</span>
              </div>
              <div className="breakup-item text-danger">
                <span>{getTranslation("Discounts/छूट", lang)}</span>
                <span>-{formatCurrency(charges.discount_amount)}</span>
              </div>
            </div>

            <div className="border-top pt-3">
              <span className="fw-bold text-dark d-block mb-2 small">
                {getTranslation("Payment Methods/भुगतान के तरीके", lang)}
              </span>
              {paymentMethods.length === 0 ? (
                <span className="text-muted small">
                  {getTranslation("No payment methods recorded./कोई भुगतान विधि दर्ज नहीं है।", lang)}
                </span>
              ) : (
                paymentMethods.map((pm, idx) => (
                  <div key={idx} className="breakup-item">
                    <span>{pm.method || pm.name}</span>
                    <span className="fw-semibold">{formatCurrency(pm.amount)}</span>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
};

/* ------------------------------------------------------------------ */
/* Main Dashboard Screen                                              */
/* ------------------------------------------------------------------ */
const Dashboard = () => {
  const { summary, loading, error } = useDashboardSummary();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { lang } = useLang();

  const academicYear = new Date().getFullYear();

  const toggleProfileModal = () => setIsProfileOpen(!isProfileOpen);

  const profile = summary?.welcome_profile;
  const statCards = summary?.stat_cards;
  const admissionOverview = summary?.admission_overview;
  const assessmentProgress = summary?.assessment_progress;
  const latestActivity = summary?.latest_activity;
  const registrationTrend = summary?.patient_registration_trend;
  const transactionSummary = summary?.transaction_summary;
  const recentAdmissions = summary?.recent_admissions;

  return (
    <div className="dashboard-pro">
      <DashboardStyles />

      {/* Profile Detail Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        toggle={toggleProfileModal}
        profile={profile}
        lang={lang}
      />

      <Container fluid className="px-2">
        {/* Profile Header Banner */}
        <Row>
          <Col xl="12">
            <ProfileGreetingCard
              profile={profile}
              generatedAt={summary?.generated_at}
              loading={loading}
              onOpenProfile={toggleProfileModal}
              lang={lang}
            />
          </Col>
        </Row>

        {/* Key Metrics Indicators */}
        <Row className="mb-2">
          <Col xl="3" md="6" className="mb-3">
            <StatCard
              icon={<IconPatients />}
              amount={statCards?.total_patients?.value}
              title={
                statCards?.total_patients?.card_title
                  ? getTranslation(`${statCards.total_patients.card_title}/कुल मरीज़`, lang)
                  : getTranslation("Total Patients/कुल मरीज़", lang)
              }
              percent={statCards?.total_patients?.growth_percentage}
              trend={statCards?.total_patients?.trend}
              loading={loading}
            />
          </Col>
          <Col xl="3" md="6" className="mb-3">
            <StatCard
              icon={<IconAssessment />}
              amount={statCards?.pending_assessments?.value}
              title={
                statCards?.pending_assessments?.card_title
                  ? getTranslation(`${statCards.pending_assessments.card_title}/लंबित मूल्यांकन`, lang)
                  : getTranslation("Pending Assessments/लंबित मूल्यांकन", lang)
              }
              percent={statCards?.pending_assessments?.completion_percentage}
              trend={statCards?.pending_assessments?.trend}
              loading={loading}
            />
          </Col>
          <Col xl="3" md="6" className="mb-3">
            <StatCard
              icon={<IconAdmitted />}
              amount={statCards?.currently_admitted?.value}
              title={
                statCards?.currently_admitted?.card_title
                  ? getTranslation(`${statCards.currently_admitted.card_title}/वर्तमान में भर्ती`, lang)
                  : getTranslation("Currently Admitted/वर्तमान में भर्ती", lang)
              }
              percent={statCards?.currently_admitted?.growth_percentage}
              trend={statCards?.currently_admitted?.trend}
              loading={loading}
            />
          </Col>
          <Col xl="3" md="6" className="mb-3">
            <StatCard
              icon={<IconCollection />}
              amount={statCards?.total_collection?.value}
              title={
                statCards?.total_collection?.card_title
                  ? getTranslation(`${statCards.total_collection.card_title}/कुल संग्रह`, lang)
                  : getTranslation("Total Collection/कुल संग्रह", lang)
              }
              percent={statCards?.total_collection?.growth_percentage}
              trend={statCards?.total_collection?.trend}
              isCurrency={true}
              loading={loading}
            />
          </Col>
        </Row>

        {/* Content Layout */}
        <Row>
          <Col xl="8">
            <Row>
              <Col xl="12">
                <AdmissionOverviewCard data={admissionOverview} loading={loading} lang={lang} />
              </Col>
              <Col xl="6">
                <GrowthOverviewCard data={assessmentProgress} loading={loading} lang={lang} />
              </Col>
              <Col xl="6">
                <LatestActivityCard data={latestActivity} loading={loading} lang={lang} />
              </Col>
              <Col xl="12">
                <RecentAdmissionsCard data={recentAdmissions} loading={loading} lang={lang} />
              </Col>
            </Row>
          </Col>

          <Col xl="4">
            <Row>
              <Col xl="12">
                <RegistrationsCard data={registrationTrend} loading={loading} lang={lang} />
              </Col>
              <Col xl="12">
                <TransactionsSummaryCard data={transactionSummary} loading={loading} lang={lang} />
              </Col>
            </Row>
          </Col>
        </Row>

        {/* Error Notification Translated */}
        {error && (
          <Row className="mt-3">
            <Col xl="12">
              <div className="alert alert-danger border-0 shadow-sm">
                {getTranslation(
                  "Failed to refresh dashboard indicators. Please check backend connection./डैशबोर्ड संकेतक ताज़ा करने में विफल। कृपया बैकएंड कनेक्शन की जांच करें।",
                  lang
                )}
              </div>
            </Col>
          </Row>
        )}

       
      </Container>
    </div>
  );
};

export default Dashboard;