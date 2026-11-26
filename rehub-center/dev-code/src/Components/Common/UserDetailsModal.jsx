import React, { useState, useEffect, useRef } from "react";
import { Row, Col, Card, CardBody, Badge, Button } from "reactstrap";
import CommonModal from "../UiKits/Modals/common/modal";
import ModalLoading from "./ModalLoading";
import { useBranch } from "../../contexts/BranchContext";
import { useLang } from "../../contexts/LangContext";
import { getTranslation } from "../../utils/translator";
import html2pdf from "html2pdf.js";
import { printElementAsPdf } from "../../utils/pdfPrintHelper";
import { toast } from "react-toastify";
import ModalActionButtons from "./ModalActionButtons";
import { pickCleanText } from "../../utils/unicodeHelper";

const UserDetailsModal = ({ isOpen, userId, user: propUser, toggler, toggle, onClose }) => {
  const handleClose = toggler || toggle || onClose || (() => {});
  const { lang } = useLang();
  const { selectedBranch } = useBranch();
  const storedBranchDetail = (() => {
    try {
      return JSON.parse(localStorage.getItem("Branch_Detail") || "[]");
    } catch {
      return [];
    }
  })();
  const branchId =
    selectedBranch?.branch_id ||
    selectedBranch?.id ||
    selectedBranch ||
    storedBranchDetail?.[0]?.Branch_id ||
    storedBranchDetail?.[0]?.branch_id ||
    1;

  const pdfRef = useRef();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);

  const enrichUserWithLocalAndIpdData = async (rawUser, token) => {
    if (!rawUser || typeof rawUser !== "object") return rawUser;
    const userCopy = { ...rawUser };
    const uid = userCopy.user_id || userCopy.id;
    const cleanPhone = String(userCopy.phone || "").trim();

    let localExtra = {};
    try {
      const byId = uid ? localStorage.getItem(`gks_user_extra_${uid}`) : null;
      const byPhone = cleanPhone ? localStorage.getItem(`gks_user_extra_phone_${cleanPhone}`) : null;
      const parsedId = byId ? JSON.parse(byId) : {};
      const parsedPhone = byPhone ? JSON.parse(byPhone) : {};
      localExtra = { ...parsedPhone, ...parsedId };
    } catch {
      localExtra = {};
    }

    userCopy.name = pickCleanText(userCopy.name, localExtra.name) || userCopy.name || "";
    userCopy.address = pickCleanText(userCopy.address, localExtra.address) || "";
    userCopy.patient_type = pickCleanText(userCopy.patient_type, localExtra.patient_type) || "";
    userCopy.relative_name = pickCleanText(userCopy.relative_name, localExtra.relative_name) || "";
    userCopy.relative_address = pickCleanText(userCopy.relative_address, localExtra.relative_address) || "";
    userCopy.relation_with_patient = pickCleanText(userCopy.relation_with_patient, localExtra.relation_with_patient) || "";

    // Parse relative_contacts
    let parsedContacts = [];
    if (userCopy.relative_contacts) {
      try {
        parsedContacts =
          typeof userCopy.relative_contacts === "string"
            ? JSON.parse(userCopy.relative_contacts)
            : Array.isArray(userCopy.relative_contacts)
            ? userCopy.relative_contacts
            : [];
      } catch {
        parsedContacts = [];
      }
    }

    let localSavedContacts = [];
    try {
      localSavedContacts = JSON.parse(
        localStorage.getItem(`gks_user_relative_contacts_${uid}`) || "[]"
      );
    } catch {
      localSavedContacts = [];
    }

    if (parsedContacts.length === 0 && Array.isArray(localSavedContacts) && localSavedContacts.length > 0) {
      parsedContacts = localSavedContacts.filter((c) => c && (c.name || c.phone));
    }

    userCopy.relative_contacts = parsedContacts.map((c) => {
      const matched = localSavedContacts.find((ls) => ls && ls.phone === c.phone);
      const isWa =
        c.use_for_whatsapp === "Yes" ||
        c.is_whatsapp ||
        matched?.is_whatsapp ||
        matched?.use_for_whatsapp === "Yes" ||
        ((userCopy.whatsapp_no || localExtra.whatsapp_no) &&
          c.phone &&
          String(c.phone).trim() === String(userCopy.whatsapp_no || localExtra.whatsapp_no).trim());
      return { ...c, is_whatsapp: !!isWa };
    });

    // Resolve WhatsApp Number
    const waContact = (userCopy.relative_contacts || []).find(
      (c) => (c.is_whatsapp || c.use_for_whatsapp === "Yes") && c.phone
    );
    userCopy.whatsapp_no =
      userCopy.whatsapp_no ||
      localExtra.whatsapp_no ||
      (waContact ? waContact.phone : "") ||
      "";

    // Resolve Secondary Phone
    const secondaryFromContacts = (userCopy.relative_contacts || []).find(
      (c) => c.phone && String(c.phone).trim() !== cleanPhone
    );
    userCopy.secondary_phone =
      userCopy.secondary_phone ||
      localExtra.secondary_phone ||
      (secondaryFromContacts ? secondaryFromContacts.phone : "") ||
      (userCopy.relative_contacts?.[0]?.phone || "") ||
      "";

    // Resolve Ward Details & Admission Date
    userCopy.ward_name =
      userCopy.ward_name ||
      userCopy.wardName ||
      userCopy.recent_ward_name ||
      userCopy.ward?.ward_name ||
      userCopy.ipd?.ward_name ||
      localExtra.ward_name ||
      "";
    userCopy.ward_type_id =
      userCopy.ward_type_id ||
      userCopy.ward?.ward_type_id ||
      userCopy.ipd?.ward_type_id ||
      localExtra.ward_type_id ||
      "";
    userCopy.date_of_admission =
      userCopy.date_of_admission ||
      userCopy.recent_admit_date ||
      userCopy.admit_date ||
      userCopy.ipd?.admit_date ||
      localExtra.date_of_admission ||
      userCopy.created_at ||
      "";

    // If ward_name is still missing, look up from /api/ipd/active-ipd-entries
    if (!userCopy.ward_name && token && uid) {
      try {
        const ipdRes = await fetch(
          `https://gks-yjdc.onrender.com/api/ipd/active-ipd-entries?branch_id=${branchId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `${token}`,
            },
          }
        );
        if (ipdRes.ok) {
          const ipdJson = await ipdRes.json().catch(() => null);
          const entries = Array.isArray(ipdJson?.data) ? ipdJson.data : [];
          const matchedEntry = entries.find(
            (e) =>
              String(e.user_id || e.id) === String(uid) ||
              (userCopy.gks_id && e.gks_id === userCopy.gks_id)
          );
          if (matchedEntry) {
            if (matchedEntry.ward_name) userCopy.ward_name = matchedEntry.ward_name;
            if (matchedEntry.admit_date && !userCopy.date_of_admission) {
              userCopy.date_of_admission = matchedEntry.admit_date;
            }
          }
        }
      } catch {
        // ignore IPD lookup error
      }
    }

    // Collect all Admission Form files (supports array of URLs from backend admission_form_urls / admission_form_url, JSON array, or single URL)
    const admissionFilesList = [];
    const addFileItem = (urlOrObj, idx) => {
      if (!urlOrObj) return;
      if (Array.isArray(urlOrObj)) {
        urlOrObj.forEach((item, i) => addFileItem(item, i));
        return;
      }
      if (typeof urlOrObj === "string") {
        const trimmed = urlOrObj.trim();
        if (!trimmed) return;
        if (trimmed.startsWith("[")) {
          try {
            const arr = JSON.parse(trimmed);
            if (Array.isArray(arr)) {
              arr.forEach((item, i) => addFileItem(item, i));
              return;
            }
          } catch {
            // not JSON array
          }
        }
        const isPdf =
          trimmed.toLowerCase().includes(".pdf") ||
          trimmed.startsWith("data:application/pdf");
        const defaultName = `Admission_Form_${admissionFilesList.length + 1}.${isPdf ? "pdf" : "jpg"}`;
        if (!admissionFilesList.some((f) => f.url === trimmed)) {
          admissionFilesList.push({
            name: defaultName,
            url: trimmed,
            isPdf,
          });
        }
      } else if (typeof urlOrObj === "object") {
        const u = urlOrObj.url || urlOrObj.dataUrl || "";
        if (!u) return;
        const isPdf =
          urlOrObj.isPdf ||
          String(urlOrObj.type || "").includes("pdf") ||
          String(urlOrObj.name || u).toLowerCase().endsWith(".pdf");
        if (!admissionFilesList.some((f) => f.url === u)) {
          admissionFilesList.push({
            name: urlOrObj.name || `Admission_Form_${admissionFilesList.length + 1}.${isPdf ? "pdf" : "jpg"}`,
            url: u,
            isPdf,
          });
        }
      }
    };

    if (userCopy.admission_form_urls) {
      addFileItem(userCopy.admission_form_urls, 0);
    }
    if (userCopy.admission_form_url || userCopy.admission_form) {
      addFileItem(userCopy.admission_form_url || userCopy.admission_form, admissionFilesList.length);
    }
    if (
      admissionFilesList.length === 0 &&
      Array.isArray(localExtra.admission_files) &&
      localExtra.admission_files.length > 0
    ) {
      localExtra.admission_files.forEach((f, i) => addFileItem(f, i));
    }

    userCopy.admission_files = admissionFilesList;
    return userCopy;
  };

  useEffect(() => {
    let active = true;

    if (!isOpen) {
      setSelectedUser(null);
      setIsLoading(false);
      return;
    }

    const token = localStorage.getItem("Authorization");

    const fetchUserDetails = async () => {
      let id = userId || propUser?.user_id || propUser?.id;
      if (typeof id === "object" && id !== null) {
        id = id.user_id || id.userId || id.id;
      }

      // If parent passed propUser and no id to fetch, enrich propUser directly
      if (!id && propUser && typeof propUser === "object") {
        setIsLoading(true);
        const enriched = await enrichUserWithLocalAndIpdData(propUser, token);
        if (active) {
          setSelectedUser(enriched);
          setIsLoading(false);
        }
        return;
      }

      if (!id) {
        setSelectedUser(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

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

        let data = await response.json().catch(() => ({}));

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
            data = await fallbackRes.json().catch(() => ({}));
          }
        }

        const fetchedUser = Array.isArray(data.data) ? data.data[0] : (data.data || data);
        const mergedRawUser =
          fetchedUser && typeof fetchedUser === "object" && (fetchedUser.user_id || fetchedUser.id || fetchedUser.name)
            ? { ...(propUser || {}), ...fetchedUser }
            : propUser && typeof propUser === "object"
            ? { ...propUser }
            : null;

        if (!mergedRawUser) {
          console.error("User not found in response:", data);
          if (active) setSelectedUser(null);
          return;
        }

        const enrichedUser = await enrichUserWithLocalAndIpdData(mergedRawUser, token);

        if (active) {
          setSelectedUser(enrichedUser);
        }
      } catch (error) {
        console.error("Fetch error in UserDetailsModal:", error);
        if (propUser && typeof propUser === "object" && active) {
          const enriched = await enrichUserWithLocalAndIpdData(propUser, token);
          setSelectedUser(enriched);
        }
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

  const triggerSingleFileDownload = async (fileUrl, fileName) => {
    if (!fileUrl) return;
    try {
      if (fileUrl.startsWith("data:") || fileUrl.startsWith("blob:")) {
        const a = document.createElement("a");
        a.href = fileUrl;
        a.download = fileName || "document";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
      const res = await fetch(fileUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName || fileUrl.split("/").pop() || "document";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
    } catch {
      const a = document.createElement("a");
      a.href = fileUrl;
      a.target = "_blank";
      a.download = fileName || "document";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleBulkDownloadAllFiles = async () => {
    if (!selectedUser) return;
    const filesToDownload = [];
    const safePatientName = String(selectedUser.name || "Patient")
      .trim()
      .replace(/\s+/g, "_");
    const safeGksId = String(selectedUser.gks_id || selectedUser.user_id || selectedUser.id || "")
      .trim()
      .replace(/\s+/g, "_");

    const profilePic =
      selectedUser.profile_pic ||
      selectedUser.profile_image ||
      selectedUser.image ||
      "";
    if (profilePic) {
      const isPdf = profilePic.toLowerCase().includes(".pdf") || profilePic.startsWith("data:application/pdf");
      filesToDownload.push({
        url: profilePic,
        name: `${safePatientName}_${safeGksId}_Profile.${isPdf ? "pdf" : "jpg"}`,
      });
    }

    const admissionFiles = Array.isArray(selectedUser.admission_files)
      ? selectedUser.admission_files
      : [];
    admissionFiles.forEach((f, idx) => {
      const ext = f.isPdf ? "pdf" : "jpg";
      const cleanName = f.name
        ? `${safePatientName}_${safeGksId}_${f.name}`
        : `${safePatientName}_${safeGksId}_Admission_Form_${idx + 1}.${ext}`;
      filesToDownload.push({
        url: f.url,
        name: cleanName,
      });
    });

    if (filesToDownload.length === 0) {
      toast.info(getTranslation("No uploaded files available to download / डाउनलोड करने के लिए कोई फ़ाइल उपलब्ध नहीं है", lang));
      return;
    }

    setIsBulkDownloading(true);
    try {
      for (let i = 0; i < filesToDownload.length; i++) {
        await triggerSingleFileDownload(filesToDownload[i].url, filesToDownload[i].name);
        await new Promise((r) => setTimeout(r, 350));
      }
      toast.success(
        getTranslation(
          `Downloaded ${filesToDownload.length} file(s) successfully! / ${filesToDownload.length} फ़ाइलें सफलतापूर्वक डाउनलोड की गईं!`,
          lang
        )
      );
    } finally {
      setIsBulkDownloading(false);
    }
  };

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

  const handlePrint = () =>
    printElementAsPdf(pdfRef.current, {
      title: `Patient_${selectedUser?.name || "Profile"}`,
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
      case 5:
        return "LabOperator";
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
      toggler={handleClose}
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
                  <div className="card-body p-3 p-md-4">
                    <div className="d-flex flex-column flex-sm-row align-items-center gap-3 gap-md-4">
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

                  <div className="mt-2 mt-sm-0 d-flex align-items-center justify-content-center justify-content-sm-end gap-2 flex-wrap user-modal-banner-actions">
                    {(profilePic ||
                      selectedUser.admission_form_url ||
                      selectedUser.admission_form ||
                      (Array.isArray(selectedUser.admission_files) && selectedUser.admission_files.length > 0)) && (
                      <button
                        type="button"
                        onClick={handleBulkDownloadAllFiles}
                        disabled={isBulkDownloading}
                        className="d-inline-flex align-items-center gap-2"
                        style={{
                          borderRadius: "8px",
                          fontWeight: "600",
                          fontSize: "13px",
                          padding: "7px 14px",
                          backgroundColor: "#24695c",
                          border: "1px solid #24695c",
                          color: "#ffffff",
                          whiteSpace: "nowrap",
                          cursor: isBulkDownloading ? "not-allowed" : "pointer",
                          boxShadow: "0 2px 6px rgba(36, 105, 92, 0.18)",
                        }}
                      >
                        <i className="fa fa-download" />
                        <span>
                          {isBulkDownloading
                            ? getTranslation("Downloading... / डाउनलोड हो रहा है...", lang)
                            : getTranslation("Download All Files / सभी फ़ाइलें डाउनलोड करें", lang)}
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleClose}
                      className="d-inline-flex align-items-center gap-1"
                      style={{
                        borderRadius: "8px",
                        fontWeight: "600",
                        fontSize: "13px",
                        padding: "7px 14px",
                        border: "1px solid #cbd5e1",
                        color: "#334155",
                        backgroundColor: "#ffffff",
                        whiteSpace: "nowrap",
                        cursor: "pointer",
                      }}
                    >
                      <i className="fa fa-times me-1 text-danger" />
                      {getTranslation("Close / बंद करें", lang)}
                    </button>
                  </div>
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
                  <CardBody className="p-3 p-md-4">
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
                  <CardBody className="p-3 p-md-4">
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
                          {getTranslation("Patient Type / रोगी का प्रकार", lang)}
                        </div>
                        <div className="fw-semibold text-dark" style={{ fontSize: "14px" }}>
                          {selectedUser.patient_type ? (
                            <span
                              className="d-inline-block px-2 py-1 rounded-2"
                              style={{
                                backgroundColor: "#ecfdf5",
                                color: "#14532d",
                                border: "1px solid #a7f3d0",
                                fontSize: "13px",
                              }}
                            >
                              {selectedUser.patient_type}
                            </span>
                          ) : (
                            "—"
                          )}
                        </div>
                      </div>

                      <div className="col-12 mt-2 pt-3 border-top">
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                          <div className="d-flex align-items-center gap-2">
                            <span
                              className="text-muted fw-semibold"
                              style={{ fontSize: "11.5px", textTransform: "uppercase", letterSpacing: "0.5px" }}
                            >
                              {getTranslation("Admission Form Documents / प्रवेश फॉर्म दस्तावेज़", lang)}
                            </span>
                            {Array.isArray(selectedUser.admission_files) && selectedUser.admission_files.length > 0 && (
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: "600",
                                  backgroundColor: "#f1f5f9",
                                  color: "#475569",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: "999px",
                                  padding: "1px 8px",
                                }}
                              >
                                {selectedUser.admission_files.length} {selectedUser.admission_files.length === 1 ? "File" : "Files"}
                              </span>
                            )}
                          </div>
                          {Array.isArray(selectedUser.admission_files) && selectedUser.admission_files.length > 0 && (
                            <button
                              type="button"
                              onClick={handleBulkDownloadAllFiles}
                              disabled={isBulkDownloading}
                              className="d-inline-flex align-items-center gap-1"
                              style={{
                                fontSize: "12px",
                                fontWeight: "600",
                                padding: "5px 12px",
                                borderRadius: "6px",
                                backgroundColor: "#ecfdf5",
                                color: "#047857",
                                border: "1px solid #a7f3d0",
                                whiteSpace: "nowrap",
                                cursor: isBulkDownloading ? "not-allowed" : "pointer",
                                transition: "all 0.15s ease",
                              }}
                            >
                              <i className="fa fa-download" style={{ fontSize: "11px" }} />
                              <span>
                                {getTranslation("Bulk Download", lang)} ({selectedUser.admission_files.length + (selectedUser.profile_pic ? 1 : 0)})
                              </span>
                            </button>
                          )}
                        </div>
                        <div>
                          {Array.isArray(selectedUser.admission_files) && selectedUser.admission_files.length > 0 ? (
                            <div className="d-flex flex-column gap-2">
                              {selectedUser.admission_files.map((fileItem, idx) => (
                                <div
                                  key={idx}
                                  className="d-flex align-items-center justify-content-between flex-wrap gap-2 p-2 px-3"
                                  style={{
                                    borderRadius: "10px",
                                    backgroundColor: "#ffffff",
                                    border: "1px solid #e2e8f0",
                                    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
                                  }}
                                >
                                  <div className="d-flex align-items-center gap-2 text-truncate me-2">
                                    {!fileItem.isPdf && fileItem.url ? (
                                      <img
                                        src={fileItem.url}
                                        alt={fileItem.name}
                                        style={{
                                          width: "36px",
                                          height: "36px",
                                          objectFit: "cover",
                                          borderRadius: "8px",
                                          border: "1px solid #cbd5e1",
                                          flexShrink: 0,
                                        }}
                                      />
                                    ) : (
                                      <div
                                        style={{
                                          width: "36px",
                                          height: "36px",
                                          borderRadius: "8px",
                                          backgroundColor: "#fef2f2",
                                          border: "1px solid #fecaca",
                                          color: "#dc2626",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          fontSize: "11px",
                                          fontWeight: "700",
                                          flexShrink: 0,
                                        }}
                                      >
                                        PDF
                                      </div>
                                    )}
                                    <div className="text-truncate">
                                      <div
                                        className="fw-semibold text-dark text-truncate"
                                        style={{ fontSize: "13px", maxWidth: "200px", lineHeight: "1.25" }}
                                      >
                                        {fileItem.name || `Admission_Form_${idx + 1}`}
                                      </div>
                                      <div className="text-muted" style={{ fontSize: "11px" }}>
                                        {fileItem.isPdf ? "PDF Document" : "JPG / JPEG Image"}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="d-flex align-items-center gap-2 flex-shrink-0">
                                    <a
                                      href={fileItem.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-decoration-none d-inline-flex align-items-center gap-1"
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: "600",
                                        padding: "5px 10px",
                                        borderRadius: "6px",
                                        backgroundColor: "#f8fafc",
                                        color: "#334155",
                                        border: "1px solid #cbd5e1",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      <span>{getTranslation("View / देखें", lang)}</span>
                                      <span style={{ fontSize: "11px" }}>↗</span>
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => triggerSingleFileDownload(fileItem.url, fileItem.name)}
                                      className="d-inline-flex align-items-center gap-1"
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: "600",
                                        padding: "5px 10px",
                                        borderRadius: "6px",
                                        backgroundColor: "#24695c",
                                        color: "#ffffff",
                                        border: "1px solid #24695c",
                                        whiteSpace: "nowrap",
                                        cursor: "pointer",
                                      }}
                                    >
                                      <i className="fa fa-download" style={{ fontSize: "11px" }} />
                                      <span>{getTranslation("Download", lang)}</span>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : selectedUser.admission_form_url || selectedUser.admission_form ? (
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
                  <CardBody className="p-3 p-md-4">
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
                                {c.is_whatsapp && (
                                  <span
                                    className="badge bg-success d-inline-flex align-items-center gap-1 ms-1"
                                    style={{ fontSize: "10.5px", fontWeight: "600", padding: "2px 6px" }}
                                  >
                                    WhatsApp
                                  </span>
                                )}
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
        onClose={handleClose}
        onPrint={handlePrint}
        onDownload={handleDownloadPDF}
        isDownloading={isDownloading}
        downloadText={getTranslation("Download PDF Report / रिपोर्ट डाउनलोड करें", lang)}
      />
    </CommonModal>
  );
};

export default UserDetailsModal;
