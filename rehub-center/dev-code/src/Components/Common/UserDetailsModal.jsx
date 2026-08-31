import React, { useState, useEffect, useRef } from "react";
import { Row, Col, Card, CardBody, Badge, Button } from "reactstrap";
import CommonModal from "../UiKits/Modals/common/modal";
import ModalLoading from "./ModalLoading";
import { useBranch } from "../../contexts/BranchContext";
import { useLang } from "../../contexts/LangContext";
import { getTranslation } from "../../utils/translator";
import html2pdf from "html2pdf.js";
import { useReactToPrint } from "react-to-print";
import { toast } from "react-toastify";
import ModalActionButtons from "./ModalActionButtons";

const UserDetailsModal = ({ isOpen, userId, user: propUser, toggler }) => {
  const { lang } = useLang();
  const { selectedBranch } = useBranch();
  const branchId =
    selectedBranch?.branch_id || selectedBranch?.id || selectedBranch || "";

  const pdfRef = useRef();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    let active = true;

    if (!isOpen) {
      setSelectedUser(null);
      setIsLoading(false);
      return;
    }

    // If parent directly passed user object
    if (propUser && typeof propUser === "object" && (propUser.id || propUser.name || propUser.user_id)) {
      const userCopy = { ...propUser };
      if (userCopy.relative_contacts && typeof userCopy.relative_contacts === "string") {
        try {
          userCopy.relative_contacts = JSON.parse(userCopy.relative_contacts);
        } catch (e) {
          userCopy.relative_contacts = [];
        }
      }
      setSelectedUser(userCopy);
      setIsLoading(false);
      return;
    }

    const fetchUserDetails = async () => {
      let id = userId;
      if (typeof id === "object" && id !== null) {
        id = id.user_id || id.userId || id.id;
      }
      if (!id) {
        setSelectedUser(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const token = localStorage.getItem("Authorization");

      try {
        let response = await fetch(
          `https://gks-yjdc.onrender.com/api/users/${id}?branch_id=${branchId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `${token}`,
            },
          }
        );

        let data = await response.json();

        // If not found or empty, retry without branch_id query parameter
        if (!response.ok || !data.data || (Array.isArray(data.data) && data.data.length === 0)) {
          const fallbackRes = await fetch(
            `https://gks-yjdc.onrender.com/api/users/${id}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `${token}`,
              },
            }
          );
          if (fallbackRes.ok) {
            data = await fallbackRes.json();
          }
        }

        const userData = Array.isArray(data.data) ? data.data[0] : (data.data || data);

        if (!userData || typeof userData !== "object") {
          console.error("User not found in response:", data);
          if (active) setSelectedUser(null);
          return;
        }

        if (
          userData.relative_contacts &&
          typeof userData.relative_contacts === "string"
        ) {
          try {
            userData.relative_contacts = JSON.parse(userData.relative_contacts);
          } catch (e) {
            userData.relative_contacts = [];
          }
        }

        if (active) {
          setSelectedUser(userData);
        }
      } catch (error) {
        console.error("Fetch error in UserDetailsModal:", error);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchUserDetails();

    return () => {
      active = false;
    };
  }, [isOpen, userId, propUser, branchId]);

  const handleDownloadPDF = () => {
    const element = pdfRef.current;
    if (!element) return;

    setIsDownloading(true);

    const patientName = selectedUser?.name || selectedUser?.patient_name || "Patient";
    const gksId = selectedUser?.custom_code || selectedUser?.gks_id || selectedUser?.uid || selectedUser?.user_id || selectedUser?.id || "";
    const safeName = String(patientName).trim().replace(/\s+/g, "_");
    const safeId = String(gksId).trim().replace(/\s+/g, "_");

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `patient_${safeName}_${safeId || "report"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        toast.success(getTranslation("Download complete!/डाउनलोड पूर्ण!", lang));
        setTimeout(() => {
          setIsDownloading(false);
        }, 2000);
      })
      .catch((err) => {
        console.error("PDF download error:", err);
        setIsDownloading(false);
      });
  };

  const handlePrint = useReactToPrint({
    content: () => pdfRef.current,
    pageStyle: `@page { size: A4; margin: 12mm; }`,
  });

  const getRoleLabel = (role) => {
    switch (Number(role)) {
      case 1:
        return "SuperAdmin";
      case 2:
        return "BranchAdmin";
      case 3:
        return "BranchOperator";
      case 4:
        return getTranslation("Patient/मरीज़", lang);
      default:
        return "User";
    }
  };

  return (
    <CommonModal
      isOpen={isOpen}
      title={getTranslation(
        "Patient Register View Data / रोगी रजिस्टर डेटा देखें",
        lang
      )}
      toggler={toggler}
      maxWidth="1100px"
    >
      <div className="p-3 p-md-4 print-area" ref={pdfRef} style={{ background: "#f8fafc" }}>
        {isLoading ? (
          <ModalLoading message={getTranslation("Loading patient details... / रोगी का विवरण लोड हो रहा है...", lang)} />
        ) : selectedUser && typeof selectedUser === "object" ? (
          <>
            {/* Header Profile Banner Card with Profile Photo & GKS ID */}
            {(() => {
              const gksId =
                selectedUser.gks_id ||
                selectedUser.custom_code ||
                selectedUser.uid ||
                selectedUser.user_id ||
                selectedUser.id ||
                "";
              const profilePic =
                selectedUser.profile_pic ||
                selectedUser.profile_image ||
                selectedUser.image ||
                "";

              return (
                <div
                  className="card shadow-sm border-0 mb-4"
                  style={{
                    borderRadius: "16px",
                    background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                    borderLeft: "6px solid #24695c",
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
                            width: "96px",
                            height: "96px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "3px solid #24695c",
                            boxShadow: "0 4px 12px rgba(36, 105, 92, 0.2)",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "96px",
                            height: "96px",
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
                          {(selectedUser.name || "P").charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="text-center text-sm-start flex-grow-1">
                        <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-sm-start gap-2 mb-1">
                          <h3 className="mb-0 fw-bold text-dark" style={{ fontSize: "1.5rem" }}>
                            {selectedUser.name || "N/A"}
                          </h3>
                          {gksId && (
                            <Badge
                              style={{
                                borderRadius: "12px",
                                fontSize: "13px",
                                fontWeight: "700",
                                backgroundColor: "#24695c",
                                color: "#ffffff",
                                padding: "6px 12px",
                                letterSpacing: "0.5px",
                              }}
                            >
                              GKS ID: {gksId}
                            </Badge>
                          )}
                          <Badge
                            color="warning"
                            className="text-white px-3 py-1"
                            style={{
                              borderRadius: "20px",
                              fontSize: "12px",
                              fontWeight: "600",
                              backgroundColor: "#d56337",
                            }}
                          >
                            {getRoleLabel(selectedUser.isRole)}
                          </Badge>
                        </div>
                        <p className="text-muted mb-0" style={{ fontSize: "14px" }}>
                          {selectedUser.email ? `📧 ${selectedUser.email}` : "No email provided"}
                          {selectedUser.phone ? ` • 📞 ${selectedUser.phone}` : ""}
                          {selectedUser.whatsapp_no ? ` • 📱 ${selectedUser.whatsapp_no}` : ""}
                        </p>
                      </div>

                  {(selectedUser.admission_form_url || selectedUser.admission_form) && (
                    <div className="mt-2 mt-sm-0">
                      <a
                        href={selectedUser.admission_form_url || selectedUser.admission_form}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2 shadow-sm"
                        style={{
                          borderRadius: "8px",
                          fontWeight: "500",
                          padding: "8px 16px",
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        {getTranslation("View Admission Form / प्रवेश फॉर्म देखें", lang)}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

            {/* Content Cards Grid */}
            <Row className="g-4">
              {/* Personal Information Card */}
              <Col md="6">
                <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: "14px" }}>
                  <CardBody className="p-4">
                    <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom">
                      <h5 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2" style={{ fontSize: "15px" }}>
                        <span style={{ color: "#d56337" }}>👤</span>
                        {getTranslation("Personal Information / व्यक्तिगत जानकारी", lang)}
                      </h5>
                    </div>

                    <div className="row g-3">
                      <div className="col-6">
                        <div className="text-muted mb-1" style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {getTranslation("Gender / लिंग", lang)}
                        </div>
                        <div className="fw-semibold text-dark" style={{ fontSize: "14px" }}>
                          {selectedUser.gender || "—"}
                        </div>
                      </div>

                      <div className="col-6">
                        <div className="text-muted mb-1" style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {getTranslation("Date of Birth / जन्म तिथि", lang)}
                        </div>
                        <div className="fw-semibold text-dark" style={{ fontSize: "14px" }}>
                          {selectedUser.dob ? new Date(selectedUser.dob).toLocaleDateString() : "—"}
                        </div>
                      </div>

                      <div className="col-12">
                        <div className="text-muted mb-1" style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {getTranslation("Patient Address / रोगी का पता", lang)}
                        </div>
                        <div className="fw-semibold text-dark" style={{ fontSize: "14px", lineHeight: "1.5" }}>
                          {selectedUser.address || "—"}
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Col>

              {/* Admission & Ward Details Card */}
              <Col md="6">
                <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: "14px" }}>
                  <CardBody className="p-4">
                    <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom">
                      <h5 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2" style={{ fontSize: "15px" }}>
                        <span style={{ color: "#d56337" }}>🏥</span>
                        {getTranslation("Admission & Ward / प्रवेश एवं वार्ड विवरण", lang)}
                      </h5>
                    </div>

                    <div className="row g-3">
                      <div className="col-6">
                        <div className="text-muted mb-1" style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {getTranslation("Admission Date / प्रवेश तिथि", lang)}
                        </div>
                        <div className="fw-semibold text-dark" style={{ fontSize: "14px" }}>
                          {selectedUser.date_of_admission ? new Date(selectedUser.date_of_admission).toLocaleDateString() : "—"}
                        </div>
                      </div>

                      <div className="col-6">
                        <div className="text-muted mb-1" style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {getTranslation("Ward Details / वार्ड का नाम", lang)}
                        </div>
                        <div className="fw-semibold text-dark" style={{ fontSize: "14px" }}>
                          {selectedUser.ward_name ? (
                            <Badge color="info" className="text-white px-2 py-1" style={{ borderRadius: "6px" }}>
                              {selectedUser.ward_name}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </div>
                      </div>

                      <div className="col-12">
                        <div className="text-muted mb-1" style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {getTranslation("Admission Form / प्रवेश फॉर्म", lang)}
                        </div>
                        <div>
                          {selectedUser.admission_form_url || selectedUser.admission_form ? (
                            <a
                              href={selectedUser.admission_form_url || selectedUser.admission_form}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
                              style={{ fontSize: "14px" }}
                            >
                              📄 {getTranslation("View Uploaded Document / दस्तावेज़ देखें", lang)} ↗
                            </a>
                          ) : (
                            <span className="text-muted" style={{ fontSize: "14px" }}>
                              {getTranslation("Not Uploaded / अपलोड नहीं किया गया", lang)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Col>

              {/* Contact & Relative Details Card */}
              <Col xs="12">
                <Card className="border-0 shadow-sm" style={{ borderRadius: "14px" }}>
                  <CardBody className="p-4">
                    <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom">
                      <h5 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2" style={{ fontSize: "15px" }}>
                        <span style={{ color: "#d56337" }}>📞</span>
                        {getTranslation("Contact & Relative Details / संपर्क और संबंधी विवरण", lang)}
                      </h5>
                    </div>

                    <div className="row g-3">
                      <div className="col-sm-6 col-md-3">
                        <div className="text-muted mb-1" style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {getTranslation("Primary Phone / प्राथमिक फोन", lang)}
                        </div>
                        <div className="fw-semibold text-dark" style={{ fontSize: "14px" }}>
                          {selectedUser.phone || "—"}
                        </div>
                      </div>

                      <div className="col-sm-6 col-md-3">
                        <div className="text-muted mb-1" style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {getTranslation("Secondary Phone / दूसरा फोन", lang)}
                        </div>
                        <div className="fw-semibold text-dark" style={{ fontSize: "14px" }}>
                          {selectedUser.secondary_phone || "—"}
                        </div>
                      </div>

                      <div className="col-sm-6 col-md-3">
                        <div className="text-muted mb-1" style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {getTranslation("WhatsApp Number / व्हाट्सएप", lang)}
                        </div>
                        <div className="fw-semibold text-dark" style={{ fontSize: "14px" }}>
                          {selectedUser.whatsapp_no ? `📱 ${selectedUser.whatsapp_no}` : "—"}
                        </div>
                      </div>

                      <div className="col-sm-6 col-md-3">
                        <div className="text-muted mb-1" style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {getTranslation("Relative Name / रिश्तेदार का नाम", lang)}
                        </div>
                        <div className="fw-semibold text-dark" style={{ fontSize: "14px" }}>
                          {selectedUser.relative_name || "—"}
                        </div>
                      </div>

                      <div className="col-sm-6 col-md-3">
                        <div className="text-muted mb-1" style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {getTranslation("Relation / संबंध", lang)}
                        </div>
                        <div className="fw-semibold text-dark" style={{ fontSize: "14px" }}>
                          {selectedUser.relation_with_patient || "—"}
                        </div>
                      </div>

                      <div className="col-sm-6 col-md-9">
                        <div className="text-muted mb-1" style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {getTranslation("Relative Address / रिश्तेदार का पता", lang)}
                        </div>
                        <div className="fw-semibold text-dark" style={{ fontSize: "14px" }}>
                          {selectedUser.relative_address || "—"}
                        </div>
                      </div>

                      {Array.isArray(selectedUser.relative_contacts) && selectedUser.relative_contacts.length > 0 && (
                        <div className="col-12 mt-3 pt-3 border-top">
                          <div className="text-muted mb-2" style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            {getTranslation("Additional Relative Contacts / अतिरिक्त संपर्क", lang)}
                          </div>
                          <div className="d-flex flex-wrap gap-2">
                            {selectedUser.relative_contacts.map((c, i) => (
                              <Badge
                                key={i}
                                color="light"
                                className="text-dark border p-2 d-flex align-items-center gap-2"
                                style={{ borderRadius: "8px", fontWeight: "500", fontSize: "13px" }}
                              >
                                👤 {c.name || "Contact"} {c.phone ? `• 📞 ${c.phone}` : ""}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </>
        ) : (
          <div className="text-center py-5 text-muted">
            {getTranslation("No user data available / कोई डेटा मौजूद नहीं", lang)}
          </div>
        )}
      </div>

      {/* Modern Modal Footer Actions */}
      <ModalActionButtons
        onClose={toggler}
        onPrint={handlePrint}
        onDownload={handleDownloadPDF}
        isDownloading={isDownloading}
        downloadText={getTranslation("Download PDF Report / रिपोर्ट डाउनलोड करें", lang)}
      />
    </CommonModal>
  );
};

export default UserDetailsModal;
