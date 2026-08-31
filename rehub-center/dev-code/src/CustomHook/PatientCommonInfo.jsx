import React from "react";
import { Badge } from "reactstrap";

const PatientCommonInfo = ({ selectedUser = [], labels = {} }) => {
  const user =
    Array.isArray(selectedUser) && selectedUser.length > 0
      ? selectedUser[0]
      : selectedUser || {};

  const patientName = user?.name || user?.patient_name || labels?.nameValue || "N/A";
  const initial =
    typeof patientName === "string" && patientName.trim()
      ? patientName.trim().charAt(0).toUpperCase()
      : "P";

  const gksId =
    user?.gks_id ||
    user?.custom_code ||
    user?.uid ||
    user?.user_id ||
    labels?.gksId ||
    labels?.gks_id ||
    "";

  const profilePic =
    user?.profile_pic ||
    user?.profile_image ||
    user?.image ||
    user?.photo ||
    labels?.profile_pic ||
    labels?.profile_image ||
    "";

  return (
    <div
      className="p-3 mb-4 rounded-3 border shadow-sm"
      style={{
        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        borderLeft: "5px solid #24695c",
        borderRadius: "12px",
      }}
    >
      <div className="row g-3 align-items-center">
        {/* Patient Profile / Name */}
        <div className="col-12 col-sm-6 col-lg-4">
          <div className="d-flex align-items-center gap-3">
            {profilePic ? (
              <img
                src={profilePic}
                crossOrigin="anonymous"
                alt="Patient Profile"
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2.5px solid #24695c",
                  boxShadow: "0 2px 8px rgba(36, 105, 92, 0.25)",
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  backgroundColor: "#24695c",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "700",
                  fontSize: "20px",
                  boxShadow: "0 2px 8px rgba(36, 105, 92, 0.25)",
                  flexShrink: 0,
                }}
              >
                {initial}
              </div>
            )}
            <div>
              <div
                className="text-muted text-uppercase fw-semibold"
                style={{ fontSize: "11px", letterSpacing: "0.5px" }}
              >
                {labels?.name || "Patient Name"}
              </div>
              <div className="d-flex flex-wrap align-items-center gap-2">
                <div
                  className="fw-bold text-dark text-capitalize text-truncate"
                  style={{ fontSize: "15px", maxWidth: "180px" }}
                >
                  {patientName}
                </div>
                {gksId && (
                  <Badge
                    style={{
                      borderRadius: "8px",
                      fontSize: "11px",
                      fontWeight: "700",
                      backgroundColor: "#24695c",
                      color: "#ffffff",
                      padding: "4px 8px",
                      letterSpacing: "0.3px",
                    }}
                  >
                    GKS ID: {gksId}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Date of Admission */}
        <div className="col-6 col-sm-6 col-lg-3">
          <div
            className="text-muted text-uppercase fw-semibold mb-1"
            style={{ fontSize: "11px", letterSpacing: "0.5px" }}
          >
            {labels?.date_of_admission || "Date of Admission"}
          </div>
          <div className="fw-semibold text-dark" style={{ fontSize: "13.5px" }}>
            📅{" "}
            {user?.date_of_admission
              ? new Date(user.date_of_admission).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : labels?.dateValue || "N/A"}
          </div>
        </div>

        {/* Gender */}
        <div className="col-6 col-sm-6 col-lg-2">
          <div
            className="text-muted text-uppercase fw-semibold mb-1"
            style={{ fontSize: "11px", letterSpacing: "0.5px" }}
          >
            {labels?.sex || "Gender"}
          </div>
          <div>
            <Badge
              color="light"
              className="text-dark border px-2 py-1 fw-semibold"
              style={{ fontSize: "12px", borderRadius: "6px" }}
            >
              {user?.gender || labels?.genderValue || "N/A"}
            </Badge>
          </div>
        </div>

        {/* Age */}
        <div className="col-6 col-sm-6 col-lg-3">
          <div
            className="text-muted text-uppercase fw-semibold mb-1"
            style={{ fontSize: "11px", letterSpacing: "0.5px" }}
          >
            {labels?.age || "Age"}
          </div>
          <div className="fw-semibold text-dark" style={{ fontSize: "13.5px" }}>
            {labels?.ageValue ? `${labels.ageValue} Yrs` : user?.age ? `${user.age} Yrs` : "N/A"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientCommonInfo;
