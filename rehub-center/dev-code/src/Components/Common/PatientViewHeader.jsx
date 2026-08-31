import React from "react";
import { Badge } from "reactstrap";

const PatientViewHeader = ({ data = {} }) => {
  if (!data || typeof data !== "object") return null;

  // Flatten / resolve nested objects if applicable
  const resolved = data.gen_family || data.user || data.patient || data;

  const patientName =
    resolved.name ||
    resolved.patient_name ||
    resolved.patientName ||
    resolved.user_name ||
    data.name ||
    data.patient_name ||
    "Patient";

  const gksId =
    resolved.custom_code ||
    resolved.gks_id ||
    resolved.uid ||
    data.custom_code ||
    data.gks_id ||
    data.uid ||
    resolved.user_id ||
    data.user_id ||
    resolved.id ||
    data.id ||
    "";

  const profilePic =
    resolved.profile_pic ||
    resolved.profile_image ||
    resolved.image ||
    resolved.photo ||
    data.profile_pic ||
    data.profile_image ||
    data.image ||
    "";

  const phone = resolved.phone || resolved.mobile || resolved.patient_phone || data.phone || "";
  const email = resolved.email || resolved.patient_email || data.email || "";
  const gender = resolved.gender || resolved.sex || data.gender || "";
  const dateStr =
    resolved.date_of_assessment ||
    resolved.date_of_admission ||
    resolved.form_fill_date ||
    resolved.dateOfAssessment ||
    resolved.date ||
    data.date_of_assessment ||
    data.date_of_admission ||
    "";

  const initial =
    typeof patientName === "string" && patientName.trim()
      ? patientName.trim().charAt(0).toUpperCase()
      : "P";

  return (
    <div
      className="card shadow-sm border-0 mb-4 patient-view-header"
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
                width: "84px",
                height: "84px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "3px solid #24695c",
                boxShadow: "0 4px 12px rgba(36, 105, 92, 0.2)",
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: "84px",
                height: "84px",
                borderRadius: "50%",
                background: "#eaf2f0",
                color: "#24695c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "30px",
                fontWeight: "700",
                border: "3px solid #24695c",
                boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                flexShrink: 0,
              }}
            >
              {initial}
            </div>
          )}

          <div className="text-center text-sm-start flex-grow-1">
            <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-sm-start gap-2 mb-1">
              <h3 className="mb-0 fw-bold text-dark" style={{ fontSize: "1.35rem" }}>
                {patientName}
              </h3>
              {gksId && (
                <Badge
                  style={{
                    borderRadius: "10px",
                    fontSize: "12px",
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
            <div
              className="d-flex flex-wrap align-items-center justify-content-center justify-content-sm-start gap-3 mt-2 text-muted"
              style={{ fontSize: "13px" }}
            >
              {phone && <span>📞 {phone}</span>}
              {email && <span>✉️ {email}</span>}
              {gender && <span>👤 {gender}</span>}
              {dateStr && (
                <span>
                  📅{" "}
                  {dateStr.includes("T") || dateStr.includes("-")
                    ? new Date(dateStr).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : dateStr}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientViewHeader;
