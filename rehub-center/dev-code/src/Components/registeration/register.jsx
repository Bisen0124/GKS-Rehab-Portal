import React, { Fragment, useState, useEffect, useRef, useCallback } from "react";
import {
  dateOfAdmission,
  patientRelativeName,
  patientSex,
  patientRelativePhoneNumber,
  patientRelativeEmailAddr,
  patientDateOfBirth,
  pateintAddress,
  Password,
  patientName,
  registerYourDetail,
  wardDetails,
  wardOptions,
  IspatientWhatsappNo,
  whatsAppNo,
  pateintRelativeAddress,
} from "../../Constant";
import {
  Form,
  FormGroup,
  Label,
  Input,
  Col,
  Button,
  Row,
  Container,
  Card,
  CardBody,
  InputGroup,
  Table,
  Spinner,
} from "reactstrap";
import { Btn} from "../../AbstractElements";
import DatePicker from "react-datepicker";
import CommonModal from "../UiKits/Modals/common/modal";
import DataTable from "react-data-table-component";
import { toast } from "react-toastify";
import HeaderCard from "../Common/Component/HeaderCard";
import { Data } from "../UiKits/Spinners/SpinnerData";

import Swal from "sweetalert2"; // ✅ Make sure this is imported at the top

import { useBranch } from "../../contexts/BranchContext";

//Download view data in PDF 
import html2pdf from "html2pdf.js";

import Translated from "../Translated";
import { useLang } from "../../contexts/LangContext";
import { getTranslation } from "../../utils/translator";
import UserDetailsModal from "../Common/UserDetailsModal";
import TableExportButtons from "../Common/TableExportButtons";
import { SaveDraftButton, DraftNoticeBanner } from "../Common/SaveDraftButton";
import { loadDraft, clearDraft, safeDate } from "../../utils/formDraftManager";
import { validateCompulsoryFields, showApiErrorAlert } from "../../utils/formValidationHelper";

import VoiceTextarea from "../VoiceTextarea/VoiceTextarea";

import { printElementAsPdf } from "../../utils/pdfPrintHelper";

function Register() {

  const { lang } = useLang(); // get current language from context
 
  //Download view data in PDF 
    const pdfRef = useRef();

  //Branches selection
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

  // Helper: Calculate age from DOB string or Date
  const calculateAgeFromDob = useCallback((dobVal, fallbackAge) => {
    if (fallbackAge !== undefined && fallbackAge !== null && fallbackAge !== "" && !isNaN(Number(fallbackAge)) && Number(fallbackAge) > 0) {
      return `${Number(fallbackAge)} Yrs`;
    }
    if (!dobVal) return "N/A";
    const birthDate = new Date(dobVal);
    if (isNaN(birthDate.getTime())) return "N/A";
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? `${age} Yrs` : "N/A";
  }, []);

  // Helper: Convert File to Data URL for local persistence & bulk download
  const fileToDataUrl = (file) =>
    new Promise((resolve) => {
      if (!file || !(file instanceof Blob)) return resolve("");
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result || "");
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });

  // Helper: Load extra user metadata from localStorage
  const loadUserExtraMetadata = useCallback((uid, phone) => {
    try {
      const cleanPhone = String(phone || "").trim();
      const byId = uid ? localStorage.getItem(`gks_user_extra_${uid}`) : null;
      const byPhone = cleanPhone ? localStorage.getItem(`gks_user_extra_phone_${cleanPhone}`) : null;
      const parsedId = byId ? JSON.parse(byId) : {};
      const parsedPhone = byPhone ? JSON.parse(byPhone) : {};
      return { ...parsedPhone, ...parsedId };
    } catch {
      return {};
    }
  }, []);

  // Helper: Save extra user metadata to localStorage
  const saveUserExtraMetadata = useCallback((uid, phone, extraObj) => {
    try {
      const cleanPhone = String(phone || "").trim();
      const existing = loadUserExtraMetadata(uid, cleanPhone);
      const merged = { ...existing, ...extraObj, updatedAt: Date.now() };
      if (uid) {
        localStorage.setItem(`gks_user_extra_${uid}`, JSON.stringify(merged));
      }
      if (cleanPhone) {
        localStorage.setItem(`gks_user_extra_phone_${cleanPhone}`, JSON.stringify(merged));
      }
    } catch {
      // ignore storage quota errors
    }
  }, [loadUserExtraMetadata]);

  // Helper: Format all phone numbers (Primary, Secondary, WhatsApp, Additional Relative Contacts)
  const collectAllPhones = useCallback((userObj = {}, localExtra = {}) => {
    const phones = [];
    const addPhone = (p, tag = "") => {
      if (!p) return;
      const clean = String(p).trim();
      if (!clean) return;
      if (!phones.some((item) => item.number === clean)) {
        phones.push({ number: clean, tag });
      }
    };

    addPhone(userObj.phone, "Primary");
    addPhone(userObj.secondary_phone || localExtra.secondary_phone, "Secondary");
    addPhone(userObj.whatsapp_no || localExtra.whatsapp_no, "WhatsApp");

    let relContacts = userObj.relative_contacts || localExtra.relative_contacts || [];
    if (typeof relContacts === "string") {
      try {
        relContacts = JSON.parse(relContacts);
      } catch {
        relContacts = [];
      }
    }
    if (Array.isArray(relContacts)) {
      relContacts.forEach((c) => {
        if (c && c.phone) {
          addPhone(c.phone, c.name || "Relative");
        }
      });
    }

    return {
      list: phones,
      text: phones.length > 0 ? phones.map((p) => p.number).join(", ") : "N/A",
    };
  }, []);

  //spinner extract from other file
  const selectedSpinner = Data.find(
    (item) => item.spinnerClass === "loader-37"
  );

  // Ward dynamic data state
  const [wardList, setWardList] = useState(wardOptions);
  const [isWardsLoading, setIsWardsLoading] = useState(false);

  // User data table data & search state (declared at top level)
  const [data, setData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const token = localStorage.getItem("Authorization");

  // Email duplicate check helper for patient relative email
  const isEmailAlreadyUsed = useCallback(
    (testEmail) => {
      if (!testEmail || typeof testEmail !== "string" || !testEmail.trim()) return false;
      const normalized = testEmail.trim().toLowerCase();
      return (data || []).some(
        (u) => u.email && typeof u.email === "string" && u.email.trim().toLowerCase() === normalized
      );
    },
    [data]
  );

  //Patient file upload 
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [imageOptimizationInfo, setImageOptimizationInfo] = useState(null);

  // Client-side image compressor & optimizer: Resizes and compresses images to <60KB for ultra-fast uploads
  const compressImageFile = (file, maxWidth = 600, quality = 0.75) => {
    return new Promise((resolve) => {
      if (!file || !file.type.startsWith("image/")) {
        return resolve(file);
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const elem = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          elem.width = width;
          elem.height = height;
          const ctx = elem.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          elem.toBlob(
            (blob) => {
              if (!blob) return resolve(file);
              // If blob is still > 1MB, do a second tighter compression pass
              if (blob.size > 1024 * 1024) {
                const subCanvas = document.createElement("canvas");
                let subWidth = Math.min(width, 600);
                let subHeight = Math.round((height * subWidth) / width);
                subCanvas.width = subWidth;
                subCanvas.height = subHeight;
                const subCtx = subCanvas.getContext("2d");
                subCtx.drawImage(elem, 0, 0, subWidth, subHeight);
                subCanvas.toBlob(
                  (tighterBlob) => {
                    if (!tighterBlob) return resolve(file);
                    const cleanFileName = file.name.replace(/\.[^/.]+$/, ".jpg");
                    const compressedFile = new File([tighterBlob], cleanFileName, {
                      type: "image/jpeg",
                      lastModified: Date.now(),
                    });
                    resolve(compressedFile);
                  },
                  "image/jpeg",
                  0.72
                );
                return;
              }

              const cleanFileName = file.name.replace(/\.[^/.]+$/, ".jpg");
              const compressedFile = new File([blob], cleanFileName, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            "image/jpeg",
            quality
          );
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Backend requirement: Profile picture must be JPEG / JPG or PDF (max 5 MB)
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    const allowedImgTypes = ["image/jpeg", "image/jpg"];
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    const allowedImgExts = ["jpg", "jpeg"];
    const isJpegOrCameraImg =
      allowedImgTypes.includes(file.type?.toLowerCase()) ||
      allowedImgExts.includes(fileExt) ||
      file.type?.startsWith("image/");

    if (!isPdf && !isJpegOrCameraImg) {
      const msg = getTranslation(
        `Profile picture must be a JPG, JPEG, or PDF file (Max 5 MB). (${file.name || file.type} is not supported) / प्रोफ़ाइल फ़ाइल केवल JPG, JPEG या PDF प्रारूप (अधिकतम 5 MB) में होनी चाहिए।`,
        lang
      );
      setError(msg);
      toast.error(msg);
      setImage(null);
      setPreview(null);
      setImageOptimizationInfo(null);
      e.target.value = "";
      return;
    }

    // PDF file handling for profile_pic (max 5 MB)
    if (isPdf) {
      if (file.size > 5 * 1024 * 1024) {
        const msg = getTranslation(
          "File size must be less than 5 MB / फ़ाइल का आकार 5 MB से कम होना चाहिए।",
          lang
        );
        setError(msg);
        toast.error(msg);
        setImage(null);
        setPreview(null);
        setImageOptimizationInfo(null);
        e.target.value = "";
        return;
      }
      setError("");
      setImage(file);
      setPreview(null);
      setImageOptimizationInfo({
        originalSize: file.size,
        compressedSize: file.size,
        name: file.name,
      });
      return;
    }

    // Reject raw image files larger than 10MB before compression
    if (file.size > 10 * 1024 * 1024) {
      const msg = getTranslation(
        "Image file size must be less than 10MB before optimization / छवि फ़ाइल का आकार अनुकूलन से पहले 10MB से कम होना चाहिए।",
        lang
      );
      setError(msg);
      toast.error(msg);
      setImage(null);
      setPreview(null);
      setImageOptimizationInfo(null);
      e.target.value = "";
      return;
    }

    try {
      // compressImageFile converts any camera/image input into a strict image/jpeg (.jpg) file
      const compressed = await compressImageFile(file);

      if (compressed.size > 5 * 1024 * 1024) {
        const msg = getTranslation(
          "File size exceeds 5 MB limit. Please choose a smaller file. / फ़ाइल 5 MB की सीमा से अधिक है।",
          lang
        );
        setError(msg);
        toast.error(msg);
        setImage(null);
        setPreview(null);
        setImageOptimizationInfo(null);
        e.target.value = "";
        return;
      }

      setError("");
      setImage(compressed);
      setPreview(URL.createObjectURL(compressed));
      setImageOptimizationInfo({
        originalSize: file.size,
        compressedSize: compressed.size,
        name: compressed.name || file.name,
      });
      toast.success(
        getTranslation(
          `Image optimized (JPG): ${(compressed.size / 1024).toFixed(0)} KB / छवि अनुकूलित: ${(compressed.size / 1024).toFixed(0)} KB`,
          lang
        ),
        { autoClose: 2500 }
      );
    } catch (compressErr) {
      if (file.size > 5 * 1024 * 1024 || (!allowedImgTypes.includes(file.type?.toLowerCase()) && !allowedImgExts.includes(fileExt))) {
        const msg = getTranslation(
          "Profile picture must be a JPG, JPEG, or PDF file under 5 MB. / फ़ाइल 5 MB से कम JPG, JPEG या PDF होनी चाहिए।",
          lang
        );
        setError(msg);
        toast.error(msg);
        setImage(null);
        setPreview(null);
        setImageOptimizationInfo(null);
        e.target.value = "";
        return;
      }
      setError("");
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setImageOptimizationInfo({
        originalSize: file.size,
        compressedSize: file.size,
        name: file.name,
      });
    }
  };

  //Patient admission form (Multiple JPG / JPEG / PDF / Camera) upload
  const [admissionForm, setAdmissionForm] = useState(null);
  const [admissionFormFiles, setAdmissionFormFiles] = useState([]);
  const [admissionFormName, setAdmissionFormName] = useState("");
  const [admissionFormPreview, setAdmissionFormPreview] = useState(null);
  const [admissionFormError, setAdmissionFormError] = useState("");
  const [sameAsPrimaryPhone, setSameAsPrimaryPhone] = useState(false);

  const processSingleAdmissionFile = async (file) => {
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    const allowedImgTypes = ["image/jpeg", "image/jpg"];
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    const allowedImgExts = ["jpg", "jpeg"];
    const isImage =
      allowedImgTypes.includes(file.type?.toLowerCase()) ||
      allowedImgExts.includes(fileExt) ||
      file.type?.startsWith("image/");

    if (!isPdf && !isImage) {
      const msg = getTranslation(
        "Admission form must be a JPG, JPEG, or PDF file (Max 5 MB) / प्रवेश फ़ॉर्म केवल JPG, JPEG या PDF (अधिकतम 5 MB) होना चाहिए",
        lang
      );
      toast.error(msg);
      return { error: msg };
    }

    if ((isPdf && file.size > 5 * 1024 * 1024) || file.size > 10 * 1024 * 1024) {
      const msg = getTranslation("File size must be less than 5 MB / फ़ाइल का आकार 5 MB से कम होना चाहिए", lang);
      toast.error(msg);
      return { error: msg };
    }

    if (isImage) {
      try {
        const compressed = await compressImageFile(file, 1400, 0.85);
        if (compressed.size > 5 * 1024 * 1024) {
          const msg = getTranslation("File size exceeds 5 MB limit / फ़ाइल 5 MB सीमा से अधिक है", lang);
          toast.error(msg);
          return { error: msg };
        }
        const dataUrl = await fileToDataUrl(compressed);
        return {
          item: {
            file: compressed,
            name: compressed.name || file.name,
            preview: URL.createObjectURL(compressed),
            dataUrl,
            isPdf: false,
            size: compressed.size,
          },
        };
      } catch {
        const dataUrl = await fileToDataUrl(file);
        return {
          item: {
            file,
            name: file.name,
            preview: URL.createObjectURL(file),
            dataUrl,
            isPdf: false,
            size: file.size,
          },
        };
      }
    } else {
      const dataUrl = await fileToDataUrl(file);
      return {
        item: {
          file,
          name: file.name,
          preview: null,
          dataUrl,
          isPdf: true,
          size: file.size,
        },
      };
    }
  };

  const handleAdmissionFormChange = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    setAdmissionFormError("");
    const newlyProcessed = [];
    for (const rawFile of selectedFiles) {
      const { item, error: errMsg } = await processSingleAdmissionFile(rawFile);
      if (errMsg) {
        setAdmissionFormError(errMsg);
      } else if (item) {
        newlyProcessed.push(item);
      }
    }

    if (newlyProcessed.length > 0) {
      setAdmissionFormFiles((prev) => {
        const combined = [...prev, ...newlyProcessed];
        setAdmissionForm(combined[0]?.file || null);
        setAdmissionFormName(combined.map((f) => f.name).join(", "));
        const firstImg = combined.find((f) => !f.isPdf && f.preview);
        setAdmissionFormPreview(firstImg ? firstImg.preview : null);
        return combined;
      });
      toast.success(
        getTranslation(
          `Added ${newlyProcessed.length} admission form file(s) / ${newlyProcessed.length} प्रवेश फ़ॉर्म फ़ाइल जोड़ी गई`,
          lang
        ),
        { autoClose: 2200 }
      );
    }
    e.target.value = "";
  };

  const removeAdmissionFormFile = (indexToRemove) => {
    setAdmissionFormFiles((prev) => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      setAdmissionForm(updated[0]?.file || null);
      setAdmissionFormName(updated.map((f) => f.name).join(", "));
      const firstImg = updated.find((f) => !f.isPdf && f.preview);
      setAdmissionFormPreview(firstImg ? firstImg.preview : null);
      return updated;
    });
  };

  //Show hide password of register password filed.
  const [showPassword, setShowPassword] = useState(false);

  // const roleMapping = {
  //   SuperAdmin: 1,
  //   BranchAdmin: 2,
  //   BranchOperator: 3,
  //   Patient: 4

  // };

  //loading
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterSubmitting, setIsRegisterSubmitting] = useState(false);
  const [submitStatusMessage, setSubmitStatusMessage] = useState("");

  //email error state
  const [emailError, setEmailError] = useState("");

  //password validation
  const [passwordError, setPasswordError] = useState("");
  const validatePassword = (password) => {
    if (password.length < 6) {
      setPasswordError(getTranslation("Password must be at least 6 characters long/पासवर्ड कम से कम 6 अक्षरों का होना चाहिए",lang));
    } else if (!/\d/.test(password)) {
      setPasswordError(getTranslation("Password must contain at least one number/सांकेतिक शब्द में कम से कम एक संख्या शामिल होना चाहिए",lang));
    } else if (!/[A-Z]/.test(password)) {
      setPasswordError(getTranslation("Password must contain at least one uppercase letter/पासवर्ड में कम से कम एक बड़ा अक्षर होना चाहिए",lang));
    } else {
      setPasswordError("");
    }
  };

  const initialFormData = {
    date_of_admission: new Date(),
    patientName: "",
    patientRelativeName: "",
    gender: "Male", // Default Male
    phone: "",
    secondary_phone: "",
    whatsapp_no: "",
    email: "",
    password: "",
    dob: new Date(),
    address: "",
    relativeaddress: "",
    relation_with_patient: "",
    relative_contacts: [{ name: "", phone: "", is_whatsapp: false }],
    is_role: 4, // Default Patient role (4)
    ward_type_id: "",
    ward_name: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field === "dateOfAdmission" ? "date_of_admission" : field]: value,
    }));
  };

  //Handle patient relative additional contacts (name + phone pairs + is_whatsapp)
  const handleRelativeContactChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedContacts = [...prev.relative_contacts];
      updatedContacts[index] = { ...updatedContacts[index], [field]: value };
      return { ...prev, relative_contacts: updatedContacts };
    });
  };

  const addRelativeContact = () => {
    setFormData((prev) => ({
      ...prev,
      relative_contacts: [...prev.relative_contacts, { name: "", phone: "", is_whatsapp: false }],
    }));
  };

  const removeRelativeContact = (index) => {
    setFormData((prev) => ({
      ...prev,
      relative_contacts: prev.relative_contacts.filter((_, i) => i !== index),
    }));
  };

  //Register form data submit funtion
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const compulsoryFieldDefinitions = [
      {
        label: getTranslation("Date of Admission / प्रवेश की तिथि", lang),
        value: formData.date_of_admission,
      },
      {
        label: getTranslation("Name of Patient / रोगी का नाम", lang),
        value: formData.patientName,
      },
      {
        label: getTranslation("Name of Patient Relative / रोगी के संबंधी का नाम", lang),
        value: formData.patientRelativeName,
      },
      {
        label: getTranslation("Patient Sex / रोगी का लिंग", lang),
        value: formData.gender,
      },
      {
        label: getTranslation("Relation with Patient / रोगी से संबंध", lang),
        value: formData.relation_with_patient,
      },
      {
        label: getTranslation("Patient Date of Birth / रोगी की जन्म तिथि", lang),
        value: formData.dob,
      },
      {
        label: getTranslation("Patient Primary Phone Number / प्राथमिक फ़ोन नंबर", lang),
        value: formData.phone,
      },
      {
        label: getTranslation("Password / पासवर्ड", lang),
        value: formData.password,
      },
      {
        label: getTranslation("Ward Details / वार्ड विवरण", lang),
        value: formData.ward_type_id,
      },
      {
        label: getTranslation("Upload Patient Profile Image / रोगी प्रोफ़ाइल छवि", lang),
        value: image ? "uploaded" : "",
      },
      {
        label: getTranslation("Upload Admission Form (JPG / JPEG / PDF) / प्रवेश फ़ॉर्म", lang),
        value: admissionFormFiles.length > 0 || admissionForm ? "uploaded" : "",
      },
      {
        label: getTranslation("Patient Address / रोगी का पता", lang),
        value: formData.address,
      },
    ];

    if (!validateCompulsoryFields(compulsoryFieldDefinitions, lang)) {
      return;
    }

    if (formData.phone && formData.phone.length !== 10) {
      Swal.fire({
        icon: "warning",
        title: getTranslation("Invalid Phone Number / अमान्य फ़ोन नंबर", lang),
        text: getTranslation(
          "Patient Relative Primary Phone number must be 10 digits. / प्राथमिक फ़ोन नंबर 10 अंकों का होना चाहिए।",
          lang
        ),
        confirmButtonText: getTranslation("OK / ठीक है", lang),
      });
      return;
    }

    if (formData.whatsapp_no && formData.whatsapp_no.length !== 10) {
      Swal.fire({
        icon: "warning",
        title: getTranslation("Invalid WhatsApp/SMS Number / अमान्य व्हाट्सएप/एसएमएस नंबर", lang),
        text: getTranslation(
          "Mobile number for WhatsApp/SMS communication must be 10 digits. / व्हाट्सएप/एसएमएस नंबर 10 अंकों का होना चाहिए।",
          lang
        ),
        confirmButtonText: getTranslation("OK / ठीक है", lang),
      });
      return;
    }

    if (
      formData.email &&
      formData.email.trim() &&
      !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email.trim())
    ) {
      Swal.fire({
        icon: "warning",
        title: getTranslation("Invalid Email / अमान्य ईमेल", lang),
        text: getTranslation(
          "Please enter a valid email address / कृपया एक वैध ईमेल पता दर्ज करें",
          lang
        ),
        confirmButtonText: getTranslation("OK / ठीक है", lang),
      });
      return;
    }

    if (passwordError) {
      Swal.fire({
        icon: "warning",
        title: getTranslation("Weak Password / कमजोर पासवर्ड", lang),
        text: passwordError,
        confirmButtonText: getTranslation("OK / ठीक है", lang),
      });
      return;
    }
  
    // ✅ Submit registration with auto-recovery and email fallback
    executeRegistrationSubmission(formData);
  };

  // ✅ Auto-verification: Check if the patient was created on the backend (prevents false timeouts & duplicates)
  const verifyPatientRegistrationOnServer = async (targetBranch, patientPhone, patientName) => {
    try {
      const authToken = localStorage.getItem("Authorization");
      const branchParam = targetBranch ? `?branch_id=${targetBranch}` : "";
      const res = await fetch(`https://gks-yjdc.onrender.com/api/users${branchParam}`, {
        method: "GET",
        headers: {
          Authorization: `${authToken}`,
        },
      });
      if (!res.ok) return null;
      const resJson = await res.json();
      const userList = Array.isArray(resJson?.data) ? resJson.data : [];

      const cleanPhone = String(patientPhone || "").trim();
      const cleanName = String(patientName || "").trim().toLowerCase();

      // Priority 1: Match by phone number
      if (cleanPhone) {
        const byPhone = userList.find((u) => String(u.phone || "").trim() === cleanPhone);
        if (byPhone) return byPhone;
      }

      // Priority 2: Match by exact patient name
      if (cleanName) {
        const byName = userList.find(
          (u) => String(u.name || "").trim().toLowerCase() === cleanName
        );
        if (byName) return byName;
      }

      return null;
    } catch (err) {
      console.warn("Failed to verify patient registration on server:", err);
      return null;
    }
  };

  // ✅ Common registration success handler
  const handleRegistrationSuccess = (createdUser = {}) => {
    const createdUserId = createdUser?.id || createdUser?.user_id || createdUser?.insertId;
    const formatDateStr = (d) =>
      d instanceof Date && !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : d || "";

    const storedAdmissionFiles = (admissionFormFiles || []).map((f) => ({
      name: f.name,
      url: f.dataUrl || "",
      isPdf: !!f.isPdf,
    }));
    if (createdUser?.admission_form_url && !storedAdmissionFiles.some((f) => f.url === createdUser.admission_form_url)) {
      storedAdmissionFiles.unshift({
        name: admissionFormFiles[0]?.name || "Admission_Form",
        url: createdUser.admission_form_url,
        isPdf: String(createdUser.admission_form_url).toLowerCase().includes(".pdf"),
      });
    }

    saveUserExtraMetadata(createdUserId, formData.phone, {
      ward_type_id: createdUser?.ward?.ward_type_id || formData.ward_type_id,
      ward_name: createdUser?.ward?.ward_name || formData.ward_name,
      date_of_admission: formatDateStr(formData.date_of_admission),
      secondary_phone: (formData.secondary_phone || "").trim(),
      whatsapp_no: (formData.whatsapp_no || "").trim(),
      dob: formatDateStr(formData.dob),
      address: (formData.address || "").trim(),
      relative_name: (formData.patientRelativeName || "").trim(),
      relative_address: (formData.relativeaddress || "").trim(),
      relation_with_patient: formData.relation_with_patient || "",
      relative_contacts: formData.relative_contacts,
      admission_files: storedAdmissionFiles,
    });

    if (createdUserId) {
      try {
        localStorage.setItem(
          `gks_user_relative_contacts_${createdUserId}`,
          JSON.stringify(formData.relative_contacts)
        );
      } catch {
        // ignore storage errors
      }
    }

    Swal.fire({
      title: getTranslation("Good job!/अच्छा काम!", lang),
      text: getTranslation("Registration successful!/सफल पंजीकरण!", lang),
      icon: "success",
      confirmButtonText: getTranslation("OK / ठीक है", lang),
    }).then(() => {
      clearDraft("patient_registration", "new");
      setDraftTimestamp(null);
      setModal(false);

      // ✅ Reset form including files
      setFormData(initialFormData);
      setPasswordError("");
      setEmailError("");
      setSameAsPrimaryPhone(false);

      // ✅ Reset file upload states too
      setImage(null);
      setPreview(null);
      setAdmissionForm(null);
      setAdmissionFormFiles([]);
      setAdmissionFormName("");
      setAdmissionFormPreview(null);

      fetchUsers();
      fetchIPDEntries();
    });
  };

  // ✅ Robust submission executor with 120s timeout, live progress messages, and optional email fallback
  const executeRegistrationSubmission = async (formToSubmit) => {
    setIsRegisterSubmitting(true);
    setSubmitStatusMessage(getTranslation("Registering Patient... / रोगी पंजीकरण हो रहा है...", lang));

    // Dynamic progress updates while waiting for Render wake-up & Cloudinary uploads
    const progressTimer1 = setTimeout(() => {
      setSubmitStatusMessage(
        getTranslation("Uploading Patient Documents & Profile... / रोगी दस्तावेज़ और प्रोफ़ाइल अपलोड हो रहे हैं...", lang)
      );
    }, 7000);

    const progressTimer2 = setTimeout(() => {
      setSubmitStatusMessage(
        getTranslation("Connecting to Server & Securing Records... / सर्वर से कनेक्ट हो रहा है...", lang)
      );
    }, 20000);

    const progressTimer3 = setTimeout(() => {
      setSubmitStatusMessage(
        getTranslation("Finalizing Registration (Render waking up)... / पंजीकरण पूरा हो रहा है...", lang)
      );
    }, 40000);

    const clearAllProgressTimers = () => {
      clearTimeout(progressTimer1);
      clearTimeout(progressTimer2);
      clearTimeout(progressTimer3);
    };

    const formatDate = (date) => {
      return date instanceof Date && !isNaN(date.getTime())
        ? date.toISOString().split("T")[0]
        : date || "";
    };

    try {
      const branch_id = branchId;
      const authToken = localStorage.getItem("Authorization");

      // Ensure ward_type_id is a valid active ward of the selected branch from GET /api/users/wards
      let effectiveWardTypeId = formToSubmit.ward_type_id;
      let effectiveWardName = formToSubmit.ward_name;
      try {
        const wardsCheckRes = await fetch(
          `https://gks-yjdc.onrender.com/api/users/wards${branch_id ? `?branch_id=${branch_id}` : ""}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `${authToken}`,
            },
          }
        );
        if (wardsCheckRes.ok) {
          const wardsCheckJson = await wardsCheckRes.json().catch(() => null);
          const activeBranchWards = Array.isArray(wardsCheckJson?.data) ? wardsCheckJson.data : [];
          if (activeBranchWards.length > 0) {
            setWardList(activeBranchWards);
            const matchedWard =
              activeBranchWards.find(
                (w) => String(w.ward_type_id || w.id) === String(effectiveWardTypeId)
              ) ||
              activeBranchWards.find(
                (w) =>
                  effectiveWardName &&
                  String(w.ward_name || "").trim().toLowerCase() ===
                    String(effectiveWardName).trim().toLowerCase()
              ) ||
              activeBranchWards[0];
            if (matchedWard) {
              effectiveWardTypeId = matchedWard.ward_type_id || matchedWard.id;
              effectiveWardName = matchedWard.ward_name || matchedWard.name;
            }
          }
        }
      } catch {
        // continue with selected ward_type_id
      }

      // ✅ Create FormData matching GKS Rehab Portal Users Module API specification
      const payload = new FormData();
      payload.append("name", (formToSubmit.patientName || "").trim());

      if (formToSubmit.patientRelativeName && formToSubmit.patientRelativeName.trim()) {
        payload.append("relative_name", formToSubmit.patientRelativeName.trim());
      }

      // Email is optional for patients: only append if non-empty
      if (formToSubmit.email && formToSubmit.email.trim()) {
        payload.append("email", formToSubmit.email.trim());
      }

      payload.append("gender", formToSubmit.gender || "Male");
      payload.append("address", (formToSubmit.address || "").trim());
      payload.append("dob", formatDate(formToSubmit.dob));
      payload.append("phone", (formToSubmit.phone || "").trim());
      payload.append("password", formToSubmit.password || "");
      payload.append("isRole", 4);
      payload.append("ward_type_id", effectiveWardTypeId || "");
      if (effectiveWardName) {
        payload.append("ward_name", effectiveWardName);
      }

      if (formToSubmit.relation_with_patient && formToSubmit.relation_with_patient.trim()) {
        payload.append("relation_with_patient", formToSubmit.relation_with_patient.trim());
      }

      // Clean relative_contacts: optional — every sent entry must have name + 10-digit phone + use_for_whatsapp + use_for_sms
      const cleanedRelativeContacts = (formToSubmit.relative_contacts || [])
        .map((c) => ({
          name: c.name && c.name.trim() ? c.name.trim() : (formToSubmit.patientRelativeName || "").trim(),
          phone: c.phone ? String(c.phone).trim() : "",
          use_for_whatsapp: c.is_whatsapp || c.use_for_whatsapp === "Yes" ? "Yes" : "No",
          use_for_sms: c.use_for_sms === "Yes" ? "Yes" : "No",
        }))
        .filter((c) => c.name && /^\d{10}$/.test(c.phone));

      // If user entered a 10-digit secondary_phone and it isn't already in relative_contacts, include it cleanly
      const secTrimmed = (formToSubmit.secondary_phone || "").trim();
      if (/^\d{10}$/.test(secTrimmed) && !cleanedRelativeContacts.some((c) => c.phone === secTrimmed)) {
        cleanedRelativeContacts.push({
          name: (formToSubmit.patientRelativeName || formToSubmit.patientName || "Secondary").trim(),
          phone: secTrimmed,
          use_for_whatsapp: secTrimmed === (formToSubmit.whatsapp_no || "").trim() ? "Yes" : "No",
          use_for_sms: "No",
        });
      }

      // If user entered a 10-digit whatsapp_no and it isn't already in relative_contacts, include it cleanly
      const waTrimmed = (formToSubmit.whatsapp_no || "").trim();
      if (/^\d{10}$/.test(waTrimmed) && !cleanedRelativeContacts.some((c) => c.phone === waTrimmed)) {
        cleanedRelativeContacts.push({
          name: (formToSubmit.patientRelativeName || formToSubmit.patientName || "Relative").trim(),
          phone: waTrimmed,
          use_for_whatsapp: "Yes",
          use_for_sms: "No",
        });
      }

      if (cleanedRelativeContacts.length > 0) {
        payload.append("relative_contacts", JSON.stringify(cleanedRelativeContacts));
      }

      if (formToSubmit.relativeaddress && formToSubmit.relativeaddress.trim()) {
        payload.append("relative_address", formToSubmit.relativeaddress.trim());
      }

      // File uploads (.jpg / .jpeg / .pdf, max 5 MB)
      if (image) {
        payload.append("profile_pic", image);
      }

      const primaryAdmissionFile = admissionFormFiles?.[0]?.file || admissionForm;
      if (primaryAdmissionFile) {
        payload.append("admission_form_url", primaryAdmissionFile);
      }

      // 120-second timeout to handle Render cold boot + Cloudinary dual file uploads
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/users?branch_id=${branch_id}`,
        {
          method: "POST",
          headers: {
            Authorization: `${authToken}`,
          },
          body: payload,
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);
      clearAllProgressTimers();

      const result = await response.json();

      if (!response.ok) {
        let errorMsg = result.message || result.error || "";
        if (result.details?.stack && typeof result.details.stack === "string") {
          const firstLine = result.details.stack.split("\n")[0].replace(/^Error:\s*/i, "").trim();
          if (firstLine && !firstLine.includes("Internal Server Error") && !firstLine.includes("An unexpected error occurred")) {
            errorMsg = firstLine;
          }
        }
        if (result.details?.message && result.details.message !== "An unexpected error occurred") {
          errorMsg = result.details.message;
        }

        const lowerErr = (errorMsg + " " + (result.error || "") + " " + (result.message || "")).toLowerCase();

        // Check if patient was actually created on backend during a network retry
        if (
          (lowerErr.includes("email") && lowerErr.includes("exist")) ||
          (lowerErr.includes("phone") && lowerErr.includes("exist"))
        ) {
          const alreadyCreatedPatient = await verifyPatientRegistrationOnServer(
            branch_id,
            formToSubmit.phone,
            formToSubmit.patientName
          );

          if (alreadyCreatedPatient) {
            handleRegistrationSuccess(alreadyCreatedPatient);
            return;
          }
        }

        if (lowerErr.includes("email") && lowerErr.includes("exist")) {
          // Email is optional: Offer immediate option to register without email!
          Swal.fire({
            icon: "warning",
            title: getTranslation("Email Already Registered / ईमेल पहले से पंजीकृत है", lang),
            html: `<div style="text-align: left; font-size: 13.5px; line-height: 1.5;">
              <p style="margin-bottom: 8px;">
                ${getTranslation("The email", lang)} <b>${formToSubmit.email}</b> ${getTranslation(
              "is already registered with another account in the system.",
              lang
            )}
              </p>
              <p style="color: #64748b; margin-bottom: 0;">
                ${getTranslation(
                  "Since email is optional for patient registration, would you like to register this patient without this email?",
                  lang
                )}
              </p>
            </div>`,
            showCancelButton: true,
            confirmButtonColor: "#22c55e",
            cancelButtonColor: "#64748b",
            confirmButtonText: getTranslation("Register Without Email / बिना ईमेल के रजिस्टर करें", lang),
            cancelButtonText: getTranslation("Change Email / ईमेल बदलें", lang),
          }).then((choice) => {
            if (choice.isConfirmed) {
              const updatedForm = { ...formToSubmit, email: "" };
              setFormData(updatedForm);
              executeRegistrationSubmission(updatedForm);
            }
          });
        } else if (lowerErr.includes("phone") && lowerErr.includes("exist")) {
          Swal.fire({
            icon: "warning",
            title: getTranslation(
              "Primary Phone Already Registered / प्राथमिक फ़ोन नंबर पहले से पंजीकृत है",
              lang
            ),
            text: getTranslation(
              "Patient Relative Primary Phone Number already exists! Please enter a different primary phone number. / रोगी के संबंधी का प्राथमिक फ़ोन नंबर पहले से मौजूद है! कृपया कोई अन्य प्राथमिक फ़ोन नंबर दर्ज करें।",
              lang
            ),
            confirmButtonText: getTranslation("OK / ठीक है", lang),
          });
        } else if (
          lowerErr.includes("profile picture must be") ||
          lowerErr.includes("admission form") ||
          lowerErr.includes("jpeg, jpg or pdf") ||
          lowerErr.includes("jpeg, png, or webp")
        ) {
          Swal.fire({
            icon: "error",
            title: getTranslation("Unsupported File Format / असमर्थित फ़ाइल प्रारूप", lang),
            text: getTranslation(
              `${errorMsg} / फ़ाइल केवल JPG, JPEG या PDF प्रारूप (अधिकतम 5 MB) में होनी चाहिए।`,
              lang
            ),
            confirmButtonText: getTranslation("OK / ठीक है", lang),
          });
        } else {
          showApiErrorAlert(result, lang, getTranslation("Registration Failed / पंजीकरण विफल", lang));
        }
      } else {
        handleRegistrationSuccess(result?.data || {});
      }
    } catch (error) {
      clearAllProgressTimers();
      console.error("Fetch Error:", error);

      // On timeout (AbortError) or network glitch, verify if the backend actually completed the registration!
      const alreadyCreatedPatient = await verifyPatientRegistrationOnServer(
        branchId,
        formToSubmit.phone,
        formToSubmit.patientName
      );

      if (alreadyCreatedPatient) {
        handleRegistrationSuccess(alreadyCreatedPatient);
        return;
      }

      if (error.name === "AbortError") {
        Swal.fire({
          icon: "warning",
          title: getTranslation("Server is Waking Up / सर्वर सक्रिय हो रहा है", lang),
          text: getTranslation(
            "The backend server is hosted on Render and took longer to wake from idle sleep. Please click 'Patient Register' again to complete registration. / बैकएंड सर्वर को सक्रिय होने में समय लगा। कृपया पुनः 'रोगी रजिस्टर' पर क्लिक करें।",
            lang
          ),
          confirmButtonText: getTranslation("OK / ठीक है", lang),
        });
      } else {
        Swal.fire({
          icon: "error",
          title: getTranslation("Registration Failed / पंजीकरण विफल", lang),
          text: getTranslation(
            "Registration failed! Unknown error./पंजीकरण विफल! अज्ञात त्रुटि.",
            lang
          ),
          confirmButtonText: getTranslation("OK / ठीक है", lang),
        });
      }
    } finally {
      clearAllProgressTimers();
      setIsRegisterSubmitting(false);
      setSubmitStatusMessage("");
    }
  };

  //Modal - register
  const [modal, setModal] = useState(false);
  const [draftTimestamp, setDraftTimestamp] = useState(null);
  const toggle = () => {
    if (!modal) {
      setIsRegisterSubmitting(false);
      setSubmitStatusMessage("");
      fetchWards(branchId);

      // ✅ Pre-warm the backend on Render in background while user fills the form
      if (branchId) {
        fetch(`https://gks-yjdc.onrender.com/api/users?branch_id=${branchId}`, {
          method: "GET",
          headers: {
            Authorization: `${token}`,
          },
        }).catch(() => {});
      }

      const saved = loadDraft("patient_registration", "new");
      if (saved && saved.data) {
        setFormData((prev) => ({
          ...saved.data,
          ward_type_id: saved.data.ward_type_id || prev.ward_type_id || wardList?.[0]?.ward_type_id || wardList?.[0]?.id || "",
          ward_name: saved.data.ward_name || prev.ward_name || wardList?.[0]?.ward_name || wardList?.[0]?.name || "",
        }));
        setDraftTimestamp(saved.savedAt);
      } else {
        setFormData((prev) => ({
          ...initialFormData,
          ward_type_id: prev.ward_type_id || wardList?.[0]?.ward_type_id || wardList?.[0]?.id || "",
          ward_name: prev.ward_name || wardList?.[0]?.ward_name || wardList?.[0]?.name || "",
        }));
      }
    } else {
      setIsRegisterSubmitting(false);
      setSubmitStatusMessage("");
    }
    setModal(!modal);
  };

  //View and delete user data state
  const [viewModal, setViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  //view user data on modal
  const userViewToggle = async (userId = null) => {
    if (typeof userId === "object" && userId !== null) {
      userId = userId.id || userId.user_id;
    }

    if (!userId) {
      console.error("Invalid userId provided to toggle");
      return;
    }

    // Set state immediately so modal opens with user ID
    setSelectedUserId(userId);
    setSelectedUser(null);
    setViewModal(true);

    const token = localStorage.getItem("Authorization");

    try {
      const branch_id = branchId;
      let response = await fetch(
        `https://gks-yjdc.onrender.com/api/users/${userId}?branch_id=${branch_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        }
      );

      let data = await response.json();

      // If branch param caused empty result, fallback without branch_id
      if (!response.ok || !data.data || (Array.isArray(data.data) && data.data.length === 0)) {
        const fallbackRes = await fetch(
          `https://gks-yjdc.onrender.com/api/users/${userId}`,
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

      console.log("register user details: ", data);

      const userData = Array.isArray(data.data) ? data.data[0] : (data.data || data);

      if (userData && typeof userData === "object") {
        if (userData.relative_contacts && typeof userData.relative_contacts === "string") {
          try {
            userData.relative_contacts = JSON.parse(userData.relative_contacts);
          } catch (e) {
            userData.relative_contacts = [];
          }
        }
        setSelectedUser(userData);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  //delete user data by Id's
  const handleDelete = async (userId) => {
    // Using SweetAlert for confirmation
    Swal.fire({
      title: getTranslation("Are you sure?/क्या आपको यकीन है?",lang),
      text: getTranslation("Once deleted, you will not be able to recover this user!/एक बार हटा दिए जाने के बाद, आप इस उपयोगकर्ता को पुनः प्राप्त नहीं कर पाएंगे!",lang),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: getTranslation("Ok/ठीक है",lang),
      cancelButtonText: getTranslation("Cancel/रद्द करना",lang),
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        // Show loading message while deletion is happening
        Swal.fire({
          title: getTranslation("Deleting.../हटा रहा है...",lang),
          text: getTranslation("This might take some time./इसमें कुछ समय लग सकता है.",lang),
          icon: "info",
          showConfirmButton: false,
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        const token = localStorage.getItem("Authorization");

        try {
          const branch_id = branchId;
          const response = await fetch(
            `https://gks-yjdc.onrender.com/api/users/${userId}?branch_id=${branch_id}`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `${token}`,
              },
            }
          );

          const result = await response.json();

          if (response.ok) {
            // Successfully deleted
            Swal.fire(getTranslation("The user has been deleted succesfully!/उपयोगकर्ता को सफलतापूर्वक हटा दिया गया है!",lang));

            // Remove user from local data state
            setData((prev) => prev.filter((user) => user.id !== userId));
            setFilteredData((prev) =>
              prev.filter((user) => user.id !== userId)
            );
          } else {
            // Error during deletion
            Swal.fire(
              getTranslation("Failed!/असफल",lang),
              result.message || getTranslation("Failed to delete user./उपयोगकर्ता को हटाने में विफल.",lang),
              "error"
            );
          }
        } catch (error) {
          console.error("Delete error:", error);
          Swal.fire(
            getTranslation("Error!/गलती!",lang),
            getTranslation("An error occurred while deleting the user./उपयोगकर्ता को हटाते समय एक त्रुटि हुई.",lang),
            "error"
          );
        }
      } else {
        // If user cancels
        Swal.fire(
           getTranslation("Cancelled/रद्द",lang), 
           getTranslation("The user is safe./उपयोगकर्ता सुरक्षित है.",lang), 
           "info"
        );
      }
    });
  };

  //handle re-register user based on discharge status
  const [reregisterModal, setreregisterModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [reregFormData, setReregFormData] = useState({
    date_of_admission: new Date(),
    patientName: "",
    patientRelativeName: "",
    gender: "Male",
    relation_with_patient: "",
    dob: new Date(),
    phone: "",
    secondary_phone: "",
    whatsapp_no: "",
    sameAsPrimaryPhone: false,
    email: "",
    ward_type_id: "",
    ward_name: "",
    relative_contacts: [{ name: "", phone: "", is_whatsapp: false }],
    relativeaddress: "",
    address: "",
    sameAddress: false,
  });
  const [reregImage, setReregImage] = useState(null);
  const [reregPreview, setReregPreview] = useState(null);
  const [reregAdmissionFiles, setReregAdmissionFiles] = useState([]);

  //getting user_Id for re-registering: pre-fill ONLY current date, patient name, gender, email, phone, DOB; rest empty
  const handleReregisterUserID = async (userOrId) => {
    const userId = typeof userOrId === "object" && userOrId !== null ? userOrId.id : userOrId;
    if (!userId) return;

    setSelectedUserId(userId);
    setReregImage(null);
    setReregPreview(null);
    setReregAdmissionFiles([]);
    fetchWards(branchId);

    const rowFallback = (data || []).find((u) => String(u.id) === String(userId)) || {};
    const defaultWard = (wardList && wardList.length > 0 ? wardList : wardOptions)[0] || {};

    // Initialize immediately from row while fetching full user details
    setReregFormData({
      date_of_admission: new Date(),
      patientName: rowFallback.name || "",
      patientRelativeName: "",
      gender: rowFallback.gender || "Male",
      relation_with_patient: "",
      dob: rowFallback.rawDob ? parseDateString(rowFallback.rawDob) || new Date() : new Date(),
      phone: rowFallback.phone || "",
      secondary_phone: "",
      whatsapp_no: "",
      sameAsPrimaryPhone: false,
      email: rowFallback.email || "",
      ward_type_id: defaultWard.ward_type_id || defaultWard.id || "",
      ward_name: defaultWard.ward_name || defaultWard.name || "",
      relative_contacts: [{ name: "", phone: "", is_whatsapp: false }],
      relativeaddress: "",
      address: "",
      sameAddress: false,
    });
    setreregisterModal(true);

    try {
      const authToken = localStorage.getItem("Authorization");
      const res = await fetch(
        `https://gks-yjdc.onrender.com/api/users/${userId}?branch_id=${branchId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${authToken}`,
          },
        }
      );
      if (res.ok) {
        const resJson = await res.json().catch(() => ({}));
        const u = Array.isArray(resJson?.data) ? resJson.data[0] : resJson?.data || resJson;
        if (u && typeof u === "object") {
          setReregFormData((prev) => ({
            ...prev,
            date_of_admission: new Date(),
            patientName: u.name || prev.patientName || "",
            gender: u.gender || prev.gender || "Male",
            email: u.email || "",
            phone: u.phone || prev.phone || "",
            dob: u.dob ? parseDateString(u.dob) || new Date() : prev.dob,
            // Ensure all remaining fields stay empty as required for readmission
            patientRelativeName: "",
            relation_with_patient: "",
            secondary_phone: "",
            whatsapp_no: "",
            sameAsPrimaryPhone: false,
            relative_contacts: [{ name: "", phone: "", is_whatsapp: false }],
            relativeaddress: "",
            address: "",
            sameAddress: false,
          }));
        }
      }
    } catch (err) {
      console.warn("Failed to prefill readmission user details:", err);
    }
  };

  // Submit Readmission: validate fields, update user details & files, and create new IPD readmission entry
  const handleReRegister = async (e) => {
    e.preventDefault();
    if (!selectedUserId) {
      console.error("No user selected for re-registration");
      return;
    }

    const reregCompulsoryFields = [
      { label: getTranslation("Date of Admission / प्रवेश की तिथि", lang), value: reregFormData.date_of_admission },
      { label: getTranslation("Name of Patient / रोगी का नाम", lang), value: reregFormData.patientName },
      { label: getTranslation("Name of Patient Relative / रोगी के संबंधी का नाम", lang), value: reregFormData.patientRelativeName },
      { label: getTranslation("Patient Sex / रोगी का लिंग", lang), value: reregFormData.gender },
      { label: getTranslation("Relation with Patient / रोगी से संबंध", lang), value: reregFormData.relation_with_patient },
      { label: getTranslation("Patient Date of Birth / रोगी की जन्म तिथि", lang), value: reregFormData.dob },
      { label: getTranslation("Patient Primary Phone Number / प्राथमिक फ़ोन नंबर", lang), value: reregFormData.phone },
      { label: getTranslation("Ward Details / वार्ड विवरण", lang), value: reregFormData.ward_type_id },
      { label: getTranslation("Upload Patient Profile Image / रोगी प्रोफ़ाइल छवि", lang), value: reregImage ? "uploaded" : "" },
      { label: getTranslation("Upload Admission Form (JPG / JPEG / PDF) / प्रवेश फ़ॉर्म", lang), value: reregAdmissionFiles.length > 0 ? "uploaded" : "" },
      { label: getTranslation("Patient Address / रोगी का पता", lang), value: reregFormData.address },
    ];

    if (!validateCompulsoryFields(reregCompulsoryFields, lang)) {
      return;
    }

    setIsLoading(true);
    const formatDateStr = (d) =>
      d instanceof Date && !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : d || "";

    try {
      const branch_id = branchId;
      const authToken = localStorage.getItem("Authorization");

      // Step 1: Update user details & files via PUT /api/users/:id
      const cleanedReregContacts = (reregFormData.relative_contacts || [])
        .map((c) => ({
          name: c.name && c.name.trim() ? c.name.trim() : (reregFormData.patientRelativeName || "").trim(),
          phone: c.phone ? String(c.phone).trim() : "",
          use_for_whatsapp: c.is_whatsapp || c.use_for_whatsapp === "Yes" ? "Yes" : "No",
          use_for_sms: c.use_for_sms === "Yes" ? "Yes" : "No",
        }))
        .filter((c) => c.name && /^\d{10}$/.test(c.phone));

      const secTrimmed = (reregFormData.secondary_phone || "").trim();
      if (/^\d{10}$/.test(secTrimmed) && !cleanedReregContacts.some((c) => c.phone === secTrimmed)) {
        cleanedReregContacts.push({
          name: (reregFormData.patientRelativeName || reregFormData.patientName || "Secondary").trim(),
          phone: secTrimmed,
          use_for_whatsapp: secTrimmed === (reregFormData.whatsapp_no || "").trim() ? "Yes" : "No",
          use_for_sms: "No",
        });
      }

      const waTrimmed = (reregFormData.whatsapp_no || "").trim();
      if (/^\d{10}$/.test(waTrimmed) && !cleanedReregContacts.some((c) => c.phone === waTrimmed)) {
        cleanedReregContacts.push({
          name: (reregFormData.patientRelativeName || reregFormData.patientName || "Relative").trim(),
          phone: waTrimmed,
          use_for_whatsapp: "Yes",
          use_for_sms: "No",
        });
      }

      const updateForm = new FormData();
      updateForm.append("name", (reregFormData.patientName || "").trim());
      updateForm.append("relative_name", (reregFormData.patientRelativeName || "").trim());
      if (reregFormData.email && reregFormData.email.trim()) {
        updateForm.append("email", reregFormData.email.trim());
      }
      updateForm.append("gender", reregFormData.gender || "Male");
      updateForm.append("address", (reregFormData.address || "").trim());
      updateForm.append("dob", formatDateStr(reregFormData.dob));
      updateForm.append("phone", (reregFormData.phone || "").trim());
      updateForm.append("relative_address", (reregFormData.relativeaddress || "").trim());
      updateForm.append("relation_with_patient", reregFormData.relation_with_patient || "");
      updateForm.append("relative_contacts", JSON.stringify(cleanedReregContacts));
      if (reregImage instanceof File) {
        updateForm.append("profile_pic", reregImage);
      }
      if (reregAdmissionFiles?.[0]?.file instanceof File) {
        updateForm.append("admission_form_url", reregAdmissionFiles[0].file);
      }

      await fetch(
        `https://gks-yjdc.onrender.com/api/users/${selectedUserId}?branch_id=${branch_id}`,
        {
          method: "PUT",
          headers: { Authorization: `${authToken}` },
          body: updateForm,
        }
      ).catch(() => {});

      // Step 2: Create new IPD readmission entry
      const ipdPayload = {
        user_id: selectedUserId,
        ward_type_id: reregFormData.ward_type_id,
        ward_name: reregFormData.ward_name,
      };

      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/ipd/create-entry?branch_id=${branch_id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${authToken}`,
          },
          body: JSON.stringify(ipdPayload),
        }
      );

      const result = await response.json();

      // Save local extra metadata for readmission
      saveUserExtraMetadata(selectedUserId, reregFormData.phone, {
        ward_type_id: reregFormData.ward_type_id,
        ward_name: reregFormData.ward_name,
        date_of_admission: formatDateStr(reregFormData.date_of_admission),
        secondary_phone: secTrimmed,
        whatsapp_no: waTrimmed,
        dob: formatDateStr(reregFormData.dob),
        address: (reregFormData.address || "").trim(),
        relative_name: (reregFormData.patientRelativeName || "").trim(),
        relative_address: (reregFormData.relativeaddress || "").trim(),
        relation_with_patient: reregFormData.relation_with_patient || "",
        relative_contacts: cleanedReregContacts,
        admission_files: (reregAdmissionFiles || []).map((f) => ({
          name: f.name,
          url: f.dataUrl || "",
          isPdf: !!f.isPdf,
        })),
      });

      if (response.ok) {
        await Swal.fire({
          title: getTranslation("Success!/सफलता!", lang),
          text: getTranslation("Re-Registration has been successful!/पुनः पंजीकरण सफल रहा!", lang),
          icon: "success",
          confirmButtonText: getTranslation("OK/ठीक है", lang),
        });
        setreregisterModal(false);
        fetchUsers();
        fetchIPDEntries();
      } else {
        await Swal.fire({
          title: getTranslation("User Not Eligible/उपयोगकर्ता योग्य नहीं है", lang),
          text:
            result?.error ||
            result?.message ||
            getTranslation(
              "User is not eligible for re-admission. Please check the discharge status and dates./उपयोगकर्ता पुनः प्रवेश के लिए पात्र नहीं है। कृपया डिस्चार्ज स्थिति और तिथियाँ जाँच लें।",
              lang
            ),
          icon: "warning",
          confirmButtonText: getTranslation("OK/ठीक है", lang),
        });
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  //close view data modal
  const closeUserViewModal = () => {
    setViewModal(false);
    setSelectedUser(null);
    setSelectedUserId(null);
    setShowEditModal(false);
    setreregisterModal(false);
  };

  //🔧 Convert DD/MM/YYYY to Date Object:
  const parseDateString = (dateStr) => {
    if (!dateStr) return null;

    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  };

  //handle edit user details by id's
  const [editData, setEditData] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleEdit = async (userId = null) => {
    if (typeof userId === "object" && userId !== null) {
      userId = userId.id;
    }

    if (!userId) {
      console.error("Invalid userId provided to handleEdit");
      return;
    }

    const token = localStorage.getItem("Authorization");

    try {
      const branch_id = branchId;

      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/users/${userId}?branch_id=${branch_id}`,
        {
          method: "GET",
          headers: {
            Authorization: `${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user data.");
      }

      const responseData = await response.json();
      // The actual user object is inside responseData.data[0]
      const user = Array.isArray(responseData.data)
        ? responseData.data[0]
        : responseData.data;

      console.log("Edit", user);

      if (!user) {
        throw new Error("User not found in response.");
      }

      // ✅ Normalize relative_contacts in case backend sends it as a JSON string
      let parsedRelativeContacts = [];
      if (user.relative_contacts) {
        if (typeof user.relative_contacts === "string") {
          try {
            parsedRelativeContacts = JSON.parse(user.relative_contacts);
          } catch (e) {
            parsedRelativeContacts = [];
          }
        } else if (Array.isArray(user.relative_contacts)) {
          parsedRelativeContacts = user.relative_contacts;
        }
      }
      if (!parsedRelativeContacts.length) {
        parsedRelativeContacts = [{ name: "", phone: "", is_whatsapp: false }];
      } else {
        try {
          const localSaved = JSON.parse(
            localStorage.getItem(`gks_user_relative_contacts_${user.user_id || user.id}`) || "[]"
          );
          parsedRelativeContacts = parsedRelativeContacts.map((c) => {
            const matched = localSaved.find((ls) => ls.phone === c.phone);
            const isWa =
              c.use_for_whatsapp === "Yes" ||
              c.is_whatsapp ||
              matched?.is_whatsapp ||
              (user.whatsapp_no && c.phone && String(c.phone).trim() === String(user.whatsapp_no).trim());
            return {
              name: c.name || "",
              phone: c.phone || "",
              is_whatsapp: !!isWa,
              use_for_whatsapp: isWa ? "Yes" : "No",
              use_for_sms: c.use_for_sms === "Yes" ? "Yes" : "No",
            };
          });
        } catch {
          // ignore
        }
      }

      const localExtra = loadUserExtraMetadata(user.user_id || user.id, user.phone);
      const ipdRow = (allIPDData || []).find((entry) => String(entry.id) === String(user.user_id || user.id));
      const resolvedWardName =
        user.ward_name ||
        user.ward?.ward_name ||
        user.ipd?.ward_name ||
        localExtra.ward_name ||
        ipdRow?.wardName ||
        "";
      const matchedWardOption = (wardList && wardList.length > 0 ? wardList : wardOptions).find(
        (w) =>
          (user.ward_type_id && String(w.ward_type_id || w.id) === String(user.ward_type_id)) ||
          (localExtra.ward_type_id && String(w.ward_type_id || w.id) === String(localExtra.ward_type_id)) ||
          (resolvedWardName &&
            String(w.ward_name || w.name || "").trim().toLowerCase() === String(resolvedWardName).trim().toLowerCase())
      );
      const resolvedWardTypeId =
        user.ward_type_id ||
        localExtra.ward_type_id ||
        matchedWardOption?.ward_type_id ||
        matchedWardOption?.id ||
        "";

      const waContact = parsedRelativeContacts.find((c) => c.is_whatsapp || c.use_for_whatsapp === "Yes");
      const resolvedWhatsAppNo =
        user.whatsapp_no ||
        localExtra.whatsapp_no ||
        (waContact ? waContact.phone : "") ||
        "";
      const secContact = parsedRelativeContacts.find(
        (c) => c.phone && String(c.phone).trim() !== String(user.phone || "").trim()
      );
      const resolvedSecondaryPhone =
        user.secondary_phone ||
        localExtra.secondary_phone ||
        (secContact ? secContact.phone : "") ||
        "";

      // Handle null/undefined safely and set editData
      setEditData({
        id: user.user_id || "",
        name: user.name || "",
        patientRelativeName: user.relative_name || localExtra.relative_name || "",
        dob: (user.dob || localExtra.dob) ? parseDateString(user.dob || localExtra.dob) : "",
        email: user.email || "",
        phone: user.phone || "",
        secondary_phone: resolvedSecondaryPhone,
        whatsapp_no: resolvedWhatsAppNo,
        isWhatsApp:
          user.isWhatsApp ||
          (Boolean(resolvedWhatsAppNo) && String(resolvedWhatsAppNo).trim() === String(user.phone || "").trim()),
        address: user.address || localExtra.address || "",
        relativeaddress: user.relative_address || localExtra.relative_address || "",
        relation_with_patient: user.relation_with_patient || localExtra.relation_with_patient || "",
        relative_contacts: parsedRelativeContacts,
        ward_type_id: resolvedWardTypeId,
        ward_name: resolvedWardName || matchedWardOption?.ward_name || matchedWardOption?.name || "",
        is_role: Number(user.isRole) || 4,
        password: "",
        gender: user.gender || "Male",
        profile_pic_url: user.profile_pic || "",
        profile_pic_preview: "",
        admission_form_url: user.admission_form_url || user.admission_form || "",
        existing_admission_files: Array.isArray(localExtra.admission_files) ? localExtra.admission_files : [],
        admission_form_files: [],
      });
      setShowEditModal(true);
    } catch (error) {
      console.error("Error fetching user details:", error);
      Swal.fire({
        title: "Error!",
        text: getTranslation("Failed to load user data for editing./एडिटिंग के लिए यूज़र डेटा लोड नहीं हो सका।",lang),
        icon: "error",
        confirmButtonText: getTranslation("OK/ठीक है",lang),
      });
    }
  };

  //Handle edit-modal relative contacts (name + phone pairs)
  const handleEditRelativeContactChange = (index, field, value) => {
    setEditData((prev) => {
      const updatedContacts = [...(prev.relative_contacts || [])];
      updatedContacts[index] = { ...updatedContacts[index], [field]: value };
      return { ...prev, relative_contacts: updatedContacts };
    });
  };

  const addEditRelativeContact = () => {
    setEditData((prev) => ({
      ...prev,
      relative_contacts: [...(prev.relative_contacts || []), { name: "", phone: "", is_whatsapp: false }],
    }));
  };

  const removeEditRelativeContact = (index) => {
    setEditData((prev) => ({
      ...prev,
      relative_contacts: (prev.relative_contacts || []).filter((_, i) => i !== index),
    }));
  };

  //User handle update function
  const handleUpdateSubmit = async () => {
    setIsLoading(true); // Set loading to true when the update starts
    const token = localStorage.getItem("Authorization");

    const formatDate = (date) => {
      return date instanceof Date && !isNaN(date.getTime())
        ? date.toISOString().split("T")[0]
        : date || "";
    };

    // ✅ Set WhatsApp number from primary or relative contact with WhatsApp enabled
    const waEditContact = (editData.relative_contacts || []).find(
      (c) => c.is_whatsapp && c.phone && c.phone.trim()
    );
    const effectiveEditWhatsAppNo = editData.whatsapp_no || (waEditContact ? waEditContact.phone.trim() : "");

    // Clean relative contacts for PUT /api/users/:id: every entry needs name + 10-digit phone + use_for_whatsapp + use_for_sms
    const cleanedEditContacts = (editData.relative_contacts || [])
      .map((c) => ({
        name: c.name && c.name.trim() ? c.name.trim() : (editData.patientRelativeName || "").trim(),
        phone: c.phone ? String(c.phone).trim() : "",
        use_for_whatsapp: c.is_whatsapp || c.use_for_whatsapp === "Yes" ? "Yes" : "No",
        use_for_sms: c.use_for_sms === "Yes" ? "Yes" : "No",
      }))
      .filter((c) => c.name && /^\d{10}$/.test(c.phone));

    const secEditTrimmed = (editData.secondary_phone || "").trim();
    if (/^\d{10}$/.test(secEditTrimmed) && !cleanedEditContacts.some((c) => c.phone === secEditTrimmed)) {
      cleanedEditContacts.push({
        name: (editData.patientRelativeName || editData.name || "Secondary").trim(),
        phone: secEditTrimmed,
        use_for_whatsapp: secEditTrimmed === (effectiveEditWhatsAppNo || "").trim() ? "Yes" : "No",
        use_for_sms: "No",
      });
    }

    const waEditTrimmed = (effectiveEditWhatsAppNo || "").trim();
    if (/^\d{10}$/.test(waEditTrimmed) && !cleanedEditContacts.some((c) => c.phone === waEditTrimmed)) {
      cleanedEditContacts.push({
        name: (editData.patientRelativeName || editData.name || "Relative").trim(),
        phone: waEditTrimmed,
        use_for_whatsapp: "Yes",
        use_for_sms: "No",
      });
    }

    const updatedData = new FormData();
    updatedData.append("name", (editData.name || "").trim());
    if (editData.patientRelativeName !== undefined) {
      updatedData.append("relative_name", (editData.patientRelativeName || "").trim());
    }
    if (editData.email && editData.email.trim()) {
      updatedData.append("email", editData.email.trim());
    }
    if (editData.gender) {
      updatedData.append("gender", editData.gender);
    }
    if (editData.address !== undefined) {
      updatedData.append("address", (editData.address || "").trim());
    }
    if (editData.dob) {
      updatedData.append("dob", formatDate(editData.dob));
    }
    if (editData.phone) {
      updatedData.append("phone", (editData.phone || "").trim());
    }
    updatedData.append("relative_address", (editData.relativeaddress || "").trim());
    if (editData.relation_with_patient) {
      updatedData.append("relation_with_patient", editData.relation_with_patient);
    }
    updatedData.append("relative_contacts", JSON.stringify(cleanedEditContacts));

    if (editData.profile_pic instanceof File) {
      updatedData.append("profile_pic", editData.profile_pic);
    }

    const primaryEditAdmissionFile =
      editData.admission_form_files?.[0]?.file ||
      (editData.admission_form_file instanceof File ? editData.admission_form_file : null);
    if (primaryEditAdmissionFile) {
      updatedData.append("admission_form_url", primaryEditAdmissionFile);
    }

    console.log("User ID:", editData.id, typeof editData.id);

    try {
      const branch_id = branchId;
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/users/${editData.id}?branch_id=${branch_id}`,

        {
          method: "PUT",
          headers: {
            Authorization: `${token}`,
          },
          body: updatedData, // Send multipart form-data for text + file fields
        }
      );

      if (response.ok) {
        if (editData?.id) {
          const mergedEditAdmissionFiles = [
            ...(Array.isArray(editData.existing_admission_files) ? editData.existing_admission_files : []),
            ...(Array.isArray(editData.admission_form_files)
              ? editData.admission_form_files.map((f) => ({
                  name: f.name,
                  url: f.dataUrl || "",
                  isPdf: !!f.isPdf,
                }))
              : []),
          ];

          saveUserExtraMetadata(editData.id, editData.phone, {
            ward_type_id: editData.ward_type_id,
            ward_name: editData.ward_name,
            secondary_phone: secEditTrimmed,
            whatsapp_no: waEditTrimmed,
            isWhatsApp: !!editData.isWhatsApp,
            dob: formatDate(editData.dob),
            address: (editData.address || "").trim(),
            relative_name: (editData.patientRelativeName || "").trim(),
            relative_address: (editData.relativeaddress || "").trim(),
            relation_with_patient: editData.relation_with_patient || "",
            relative_contacts: cleanedEditContacts,
            ...(mergedEditAdmissionFiles.length > 0 ? { admission_files: mergedEditAdmissionFiles } : {}),
          });

          try {
            localStorage.setItem(
              `gks_user_relative_contacts_${editData.id}`,
              JSON.stringify(cleanedEditContacts)
            );
          } catch {
            // ignore
          }
        }
        // Show success SweetAlert
        Swal.fire({
          title: getTranslation("Good job!/अच्छा काम!",lang),
          text: getTranslation("Patient Data Has Been Updated Successfully!/रोगी डेटा सफलतापूर्वक अद्यतन किया गया है!",lang),
          icon: "success",
          confirmButtonText: getTranslation("OK/ठीक है",lang),
        }).then(() => {
          // Close the modal and refresh user list if needed
          setShowEditModal(false);
        });
        fetchUsers();
        fetchIPDEntries();
      } else {
        const errorData = await response.json();
        showApiErrorAlert(errorData, lang, getTranslation("Failed to update user/उपयोगकर्ता अपडेट करने में विफल", lang));
      }
    } catch (err) {
      console.error("Error updating user:", err);
      // Handle error with SweetAlert
      Swal.fire({
        title: "Error!",
        text: getTranslation("An unexpected error occurred while updating the user./यूज़र को अपडेट करते समय एक अनचाही एरर आई।",lang),
        icon: "error",
        confirmButtonText: getTranslation("OK/ठीक है",lang),
      });
    } finally {
      setIsLoading(false); // Set loading to false after the request is complete
    }
  };

  // ✅ Fetching user data from API

  // ✅ Step 1: Move this into a reusable function
  const [stillLoading, setstillLoading] = useState(true);

  const enrichMissingUserDetailsInBackground = useCallback(
    async (userIdsToEnrich) => {
      if (!Array.isArray(userIdsToEnrich) || userIdsToEnrich.length === 0) return;
      const authToken = localStorage.getItem("Authorization");
      for (const uid of userIdsToEnrich) {
        try {
          const res = await fetch(
            `https://gks-yjdc.onrender.com/api/users/${uid}?branch_id=${branchId}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `${authToken}`,
              },
            }
          );
          if (!res.ok) continue;
          const resJson = await res.json().catch(() => null);
          const u = Array.isArray(resJson?.data) ? resJson.data[0] : resJson?.data || resJson;
          if (!u || typeof u !== "object") continue;

          saveUserExtraMetadata(uid, u.phone, {
            dob: u.dob || "",
            address: u.address || "",
            relative_name: u.relative_name || "",
            relative_address: u.relative_address || "",
            relation_with_patient: u.relation_with_patient || "",
            ...(u.relative_contacts ? { relative_contacts: u.relative_contacts } : {}),
            ...(u.ward_name ? { ward_name: u.ward_name } : {}),
          });

          const localExtra = loadUserExtraMetadata(uid, u.phone);
          const phonesObj = collectAllPhones(u, localExtra);
          const ageStr = calculateAgeFromDob(u.dob || localExtra.dob, u.age);
          const addressStr = u.address || localExtra.address || "N/A";
          const relNameStr = u.relative_name || localExtra.relative_name || "N/A";

          setData((prev) =>
            prev.map((row) =>
              String(row.id) === String(uid)
                ? {
                    ...row,
                    rawDob: u.dob || row.rawDob,
                    age: ageStr !== "N/A" ? ageStr : row.age,
                    address: addressStr !== "N/A" ? addressStr : row.address,
                    relative_name: relNameStr !== "N/A" ? relNameStr : row.relative_name,
                    allPhonesList: phonesObj.list,
                    allPhonesText: phonesObj.text,
                  }
                : row
            )
          );
          setFilteredData((prev) =>
            prev.map((row) =>
              String(row.id) === String(uid)
                ? {
                    ...row,
                    rawDob: u.dob || row.rawDob,
                    age: ageStr !== "N/A" ? ageStr : row.age,
                    address: addressStr !== "N/A" ? addressStr : row.address,
                    relative_name: relNameStr !== "N/A" ? relNameStr : row.relative_name,
                    allPhonesList: phonesObj.list,
                    allPhonesText: phonesObj.text,
                  }
                : row
            )
          );
          setAllIPDData((prev) =>
            prev.map((row) =>
              String(row.id) === String(uid)
                ? {
                    ...row,
                    age: ageStr !== "N/A" ? ageStr : row.age,
                    address: addressStr !== "N/A" ? addressStr : row.address,
                    relative_name: relNameStr !== "N/A" ? relNameStr : row.relative_name,
                    allPhonesList: phonesObj.list,
                    allPhonesText: phonesObj.text,
                  }
                : row
            )
          );
          setFilteredIPDData((prev) =>
            prev.map((row) =>
              String(row.id) === String(uid)
                ? {
                    ...row,
                    age: ageStr !== "N/A" ? ageStr : row.age,
                    address: addressStr !== "N/A" ? addressStr : row.address,
                    relative_name: relNameStr !== "N/A" ? relNameStr : row.relative_name,
                    allPhonesList: phonesObj.list,
                    allPhonesText: phonesObj.text,
                  }
                : row
            )
          );
        } catch {
          // ignore background enrichment errors
        }
      }
    },
    [branchId, calculateAgeFromDob, collectAllPhones, loadUserExtraMetadata, saveUserExtraMetadata]
  );

  const fetchUsers = () => {
    if (!branchId) return; // avoid empty branch fetch

    fetch(
      `https://gks-yjdc.onrender.com/api/users?branch_id=${branchId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unauthorized or failed to fetch");
        }
        return response.json();
      })
      .then((resData) => {
        const missingIds = [];
        const formatted = (resData.data || []).map((user) => {
          const localExtra = loadUserExtraMetadata(user.user_id, user.phone);
          const dobVal = user.dob || localExtra.dob || "";
          const ageVal = calculateAgeFromDob(dobVal, user.age);
          const addrVal = user.address || localExtra.address || "";
          const relNameVal = user.relative_name || localExtra.relative_name || "";
          const phonesObj = collectAllPhones(user, localExtra);

          if (!dobVal || !addrVal || !relNameVal) {
            missingIds.push(user.user_id);
          }

          return {
            id: user.user_id,
            name: user.name,
            gender: user.gender,
            email: user.email,
            phone: user.phone,
            allPhonesList: phonesObj.list,
            allPhonesText: phonesObj.text,
            rawDob: dobVal,
            age: ageVal,
            address: addrVal || "N/A",
            relative_name: relNameVal || "N/A",
            gks_id: user.gks_id,
            discharge_status: user.discharge_status,
            discharge_status_text: user.discharge_status_text,
            is_readmission: user.is_readmission,
            recent_admit_date: user.recent_admit_date
              ? new Date(user.recent_admit_date).toLocaleDateString()
              : localExtra.date_of_admission
              ? new Date(localExtra.date_of_admission).toLocaleDateString()
              : "N/A",
            recent_pfa_date: user.recent_pfa_date
              ? new Date(user.recent_pfa_date).toLocaleDateString()
              : "N/A",
            recent_gen_fam_date: user.recent_gen_fam_date
              ? new Date(user.recent_gen_fam_date).toLocaleDateString()
              : "N/A",
          };
        });

        setData(formatted);
        setFilteredData(formatted);
        setstillLoading(false);

        if (missingIds.length > 0) {
          enrichMissingUserDetailsInBackground(missingIds.slice(0, 25));
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        toast.error("Error fetching user data");
        setstillLoading(true);
      });
  };

  // ✅ Fetch active ward types from GET /api/users/wards?branch_id=<id> (items of item type "Wards")
  const fetchWards = useCallback(async (targetBranch = branchId) => {
    setIsWardsLoading(true);
    const authToken = localStorage.getItem("Authorization");
    const headers = {
      "Content-Type": "application/json",
      Authorization: `${authToken}`,
    };

    const parseWardList = (data) => {
      if (!data) return [];
      if (Array.isArray(data.data)) return data.data;
      if (Array.isArray(data.wards)) return data.wards;
      if (Array.isArray(data)) return data;
      return [];
    };

    const branchQuery = targetBranch ? `?branch_id=${targetBranch}` : "";

    try {
      let list = [];
      let res = await fetch(
        `https://gks-yjdc.onrender.com/api/users/wards${branchQuery}`,
        { method: "GET", headers }
      );
      if (res.ok) {
        const data = await res.json().catch(() => null);
        list = parseWardList(data);
      } else if (branchQuery) {
        // Fallback without ?branch_id for BranchAdmin / BranchOperator tokens
        const fallbackRes = await fetch(
          `https://gks-yjdc.onrender.com/api/users/wards`,
          { method: "GET", headers }
        );
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json().catch(() => null);
          list = parseWardList(fallbackData);
        }
      }

      // If no active "Wards" items exist in this branch yet, auto-provision default "Wards" items so registration never fails with 400
      if (list.length === 0) {
        try {
          const typesRes = await fetch(
            `https://gks-yjdc.onrender.com/api/item-types${branchQuery}`,
            { method: "GET", headers }
          );
          let wardItemTypeId = null;
          if (typesRes.ok) {
            const typesJson = await typesRes.json().catch(() => null);
            const typesArr = Array.isArray(typesJson?.data)
              ? typesJson.data
              : Array.isArray(typesJson)
              ? typesJson
              : [];
            const foundType = typesArr.find(
              (t) =>
                String(t.item_type_name || t.name || "")
                  .trim()
                  .toLowerCase() === "wards"
            );
            if (foundType) {
              wardItemTypeId = foundType.item_type_id || foundType.id;
            }
          }

          if (!wardItemTypeId) {
            const createTypeRes = await fetch(
              `https://gks-yjdc.onrender.com/api/item-types${branchQuery}`,
              {
                method: "POST",
                headers,
                body: JSON.stringify({ item_type_name: "Wards", description: "Patient admission wards" }),
              }
            );
            if (createTypeRes.ok) {
              const createdJson = await createTypeRes.json().catch(() => null);
              wardItemTypeId =
                createdJson?.data?.item_type_id ||
                createdJson?.data?.insertId ||
                createdJson?.data?.id ||
                createdJson?.insertId;
            }
          }

          if (wardItemTypeId) {
            const defaultWardItems = [
              { item_name: "General Ward", original_amount: 8000 },
              { item_name: "Semi-Private Ward", original_amount: 12000 },
              { item_name: "Private Ward", original_amount: 18000 },
            ];
            for (const w of defaultWardItems) {
              await fetch(
                `https://gks-yjdc.onrender.com/api/items${branchQuery}`,
                {
                  method: "POST",
                  headers,
                  body: JSON.stringify({
                    item_name: w.item_name,
                    item_type_id: Number(wardItemTypeId),
                    original_amount: w.original_amount,
                  }),
                }
              ).catch(() => {});
            }

            const retryRes = await fetch(
              `https://gks-yjdc.onrender.com/api/users/wards${branchQuery}`,
              { method: "GET", headers }
            );
            if (retryRes.ok) {
              const retryData = await retryRes.json().catch(() => null);
              list = parseWardList(retryData);
            }
          }
        } catch {
          // ignore auto-provision errors
        }
      }

      if (list.length > 0) {
        setWardList(list);
        setFormData((prev) => {
          const validIds = list.map((w) => String(w.ward_type_id || w.id));
          if (prev.ward_type_id && validIds.includes(String(prev.ward_type_id))) {
            return prev;
          }
          const first = list[0];
          return {
            ...prev,
            ward_type_id: first.ward_type_id || first.id,
            ward_name: first.ward_name || first.name,
          };
        });
      } else {
        setWardList(wardOptions);
      }
    } catch (err) {
      console.warn("Failed to fetch wards from /api/users/wards, using fallback:", err);
      setWardList(wardOptions);
    } finally {
      setIsWardsLoading(false);
    }
  }, [branchId]);

  // ✅ Step 2: Run when branch changes
  useEffect(() => {
    fetchUsers();
    fetchWards();
  }, [branchId, fetchWards]);

  // ✅ Define table columns for Registered Patient List (GKS ID, Patient Name, Age, All Phone Numbers, Address, Action — Email removed)
  const tableColumns = [
    {
      name: `${getTranslation("GKS ID/GKS आईडी", lang)}`,
      selector: (row) => row.gks_id,
      sortable: true,
      center: true,
    },
    {
      name: `${getTranslation("Patient name/रोगी का नाम", lang)}`,
      selector: (row) => row.name,
      sortable: true,
      center: true,
    },
    {
      name: `${getTranslation("Age/उम्र", lang)}`,
      selector: (row) => row.age || "N/A",
      sortable: true,
      center: true,
      width: "100px",
    },
    {
      name: `${getTranslation("Phone Numbers (Primary / Secondary)/फ़ोन नंबर", lang)}`,
      selector: (row) => row.allPhonesText || row.phone || "N/A",
      sortable: true,
      center: true,
      minWidth: "180px",
      cell: (row) => (
        <div className="d-flex flex-column align-items-center py-1" style={{ lineHeight: "1.35" }}>
          {Array.isArray(row.allPhonesList) && row.allPhonesList.length > 0 ? (
            row.allPhonesList.map((p, idx) => (
              <span key={idx} className={idx === 0 ? "fw-semibold text-dark" : "text-muted small"}>
                {p.number}
                {idx > 0 && p.tag ? ` (${p.tag})` : ""}
              </span>
            ))
          ) : (
            <span>{row.phone || "N/A"}</span>
          )}
        </div>
      ),
    },
    {
      name: `${getTranslation("Address/पता", lang)}`,
      selector: (row) => row.address || "N/A",
      sortable: true,
      center: true,
      wrap: true,
    },
    {
      name: `${getTranslation('Action/क्रिया' , lang)}`,
      center: true,
      cell: (row) => (
        <div className="d-flex gap-2">
          {/* View icon */}
          <span
            onClick={() => userViewToggle(row.id)}
            style={{ cursor: "pointer" }}
            title={getTranslation("View/देखना",lang)}
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
              className="feather feather-eye"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </span>

          {/* Edit icon */}
          <span
            onClick={() => handleEdit(row.id)}
            style={{ cursor: "pointer" }}
            title={getTranslation("Edit/संपादन करना",lang)}
          >
            {/* Edit/Pencil icon */}
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
              className="feather feather-edit"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </span>

          {/* Delete icon */}
          <span
            onClick={() => handleDelete(row.id)}
            style={{ cursor: "pointer" }}
            title={getTranslation("Delete/मिटाना",lang)}
          >
            <svg
              style={{ color: "red" }}
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="feather feather-trash-2"
            >
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </span>

          {/* Re-register icon */}
          {/* Conditionally render Re-register or Tooltip-only icon */}
          {row.discharge_status === 1 ? (
            <span
              onClick={() => handleReregisterUserID(row.id)}
              style={{ cursor: "pointer" }}
              title={getTranslation("Re-register/पुन: पंजीकृत",lang)}
            >
              {/* Re-register SVG */}
              <svg
                style={{ color: "blue" }}
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="feather feather-refresh-ccw"
              >
                <polyline points="1 4 1 10 7 10"></polyline>
                <polyline points="23 20 23 14 17 14"></polyline>
                <path d="M20.49 9A9 9 0 0 0 5.51 15M3.51 15A9 9 0 0 0 18.49 9"></path>
              </svg>
            </span>
          ) : (
            <span title={getTranslation("User not discharged/उपयोगकर्ता को छुट्टी नहीं दी गई",lang)}>
              {/* Disabled or info-only icon */}
              <svg
                style={{ color: "gray", opacity: 0.5 }}
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="feather feather-alert-circle"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12" y2="16"></line>
              </svg>
            </span>
          )}
        </div>
      ),
    },
  ];

  const [allIPDData, setAllIPDData] = useState([]);
  const [filteredIPDData, setFilteredIPDData] = useState([]);

  // Fetch IPD entries
  const fetchIPDEntries = () => {
    if (!branchId) return;

    fetch(
      `https://gks-yjdc.onrender.com/api/ipd/active-ipd-entries?branch_id=${branchId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unauthorized or failed to fetch");
        }
        return response.json();
      })
      .then((entriesData) => {
        const missingIds = [];
        const mappedData = (entriesData.data || []).map((entry) => {
          const uid = entry.user_id || entry.id;
          const localExtra = loadUserExtraMetadata(uid, entry.phone);
          const matchedUser = (data || []).find((u) => String(u.id) === String(uid));

          // Also persist ward_name from active IPD entry into localExtra so View modal always has it
          if (entry.ward_name) {
            saveUserExtraMetadata(uid, entry.phone, {
              ward_name: entry.ward_name,
              ...(entry.admit_date ? { date_of_admission: entry.admit_date } : {}),
            });
          }

          const dobVal = entry.dob || matchedUser?.rawDob || localExtra.dob || "";
          const ageVal = calculateAgeFromDob(dobVal, entry.age);
          const phonesObj = collectAllPhones(
            { ...matchedUser, ...entry },
            localExtra
          );
          const relNameVal =
            entry.relative_name ||
            matchedUser?.relative_name ||
            localExtra.relative_name ||
            "N/A";
          const addrVal =
            entry.address ||
            entry.relative_address ||
            matchedUser?.address ||
            localExtra.address ||
            localExtra.relative_address ||
            "N/A";
          const rawAdmitDate =
            entry.admit_date ||
            entry.date_of_admission ||
            entry.recent_admit_date ||
            localExtra.date_of_admission ||
            "";
          const admitDateFormatted = rawAdmitDate
            ? new Date(rawAdmitDate).toLocaleDateString()
            : matchedUser?.recent_admit_date || "N/A";

          if (!dobVal || addrVal === "N/A" || relNameVal === "N/A") {
            if (uid && !missingIds.includes(uid)) missingIds.push(uid);
          }

          return {
            id: uid,
            gks_id: entry.gks_id,
            name: entry.name,
            age: ageVal,
            phone: entry.phone,
            allPhonesList: phonesObj.list,
            allPhonesText: phonesObj.text,
            relative_name: relNameVal,
            address: addrVal,
            admitDate: admitDateFormatted,
            wardName: entry.ward_name || localExtra.ward_name || "N/A",
            dischargeDate: entry.discharge_date ? (
              <span className="Discharge" style={{ color: "#28a745", fontWeight: "500" }}>
                {new Date(entry.discharge_date).toLocaleDateString()}
              </span>
            ) : (
              <span className="ntDischarge" style={{ color: "#dc3545", fontWeight: "500" }}>
                Not Discharge
              </span>
            ),
          };
        });

        setAllIPDData(mappedData);
        setFilteredIPDData(mappedData);
        setstillLoading(false);

        if (missingIds.length > 0) {
          enrichMissingUserDetailsInBackground(missingIds.slice(0, 25));
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        toast.error("Error fetching user data");
        setstillLoading(true);
      });
  };

  useEffect(() => {
    fetchIPDEntries();
  }, [branchId]);

  // ✅ Define table columns for All Registered Patient List (Show Age, All Phone Numbers, Relative Name, Address, Date of Admission, Ward Name, Discharge Date — Email removed)
  const tableIPDColumns = [
    {
      name: `${getTranslation("GKS ID/GKS आईडी", lang)}`,
      selector: (row) => row.gks_id,
      sortable: true,
      center: true,
    },
    {
      name: `${getTranslation("Patient name/रोगी का नाम", lang)}`,
      selector: (row) => row.name,
      sortable: true,
      center: true,
    },
    {
      name: `${getTranslation("Age/उम्र", lang)}`,
      selector: (row) => row.age || "N/A",
      sortable: true,
      center: true,
      width: "95px",
    },
    {
      name: `${getTranslation("Phone Numbers (Primary / Secondary)/फ़ोन नंबर", lang)}`,
      selector: (row) => row.allPhonesText || row.phone || "N/A",
      sortable: true,
      center: true,
      minWidth: "175px",
      cell: (row) => (
        <div className="d-flex flex-column align-items-center py-1" style={{ lineHeight: "1.35" }}>
          {Array.isArray(row.allPhonesList) && row.allPhonesList.length > 0 ? (
            row.allPhonesList.map((p, idx) => (
              <span key={idx} className={idx === 0 ? "fw-semibold text-dark" : "text-muted small"}>
                {p.number}
                {idx > 0 && p.tag ? ` (${p.tag})` : ""}
              </span>
            ))
          ) : (
            <span>{row.phone || "N/A"}</span>
          )}
        </div>
      ),
    },
    {
      name: `${getTranslation("Relative Name/रिश्तेदार का नाम", lang)}`,
      selector: (row) => row.relative_name || "N/A",
      sortable: true,
      center: true,
    },
    {
      name: `${getTranslation("Address/पता", lang)}`,
      selector: (row) => row.address || "N/A",
      sortable: true,
      center: true,
      wrap: true,
    },
    {
      name: `${getTranslation("Date of Admission/प्रवेश की तिथि", lang)}`,
      selector: (row) => row.admitDate || "N/A",
      sortable: true,
      center: true,
    },
    {
      name: `${getTranslation("Ward Name/वार्ड का नाम", lang)}`,
      selector: (row) => row.wardName,
      sortable: true,
      center: true,
    },
    {
      name: `${getTranslation("Discharge Date/डिस्चार्ज की तिथि", lang)}`,
      selector: (row) => row.dischargeDate,
      sortable: true,
      center: true,
    },
    {
      name: `${getTranslation('Action/क्रिया' , lang)}`,
      center: true,
      cell: (row) => (
        <div className="d-flex gap-2">
          {/* View icon */}
          <span
            onClick={() => userViewToggle(row.id)}
            style={{ cursor: "pointer" }}
            title="View"
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
              className="feather feather-eye"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </span>
        </div>
      ),
    },
  ];

  //User data search filter function
  const [IPDsearchText, setSIPDearchText] = useState("");
  const handleLatestSearchChange = (e) => {
    const value = e.target.value.toLowerCase();
    setSIPDearchText(value);

    const normalize = (field) => {
      if (typeof field === "string") {
        return field.toLowerCase(); // English case-insensitive
      }
      return field?.toString() || ""; // Hindi, numbers, dates, etc.
    };

    const filtered = data.filter((item) => {
      return (
        // item.name?.toLowerCase().includes(value) ||
        // item.email?.toLowerCase().includes(value) ||
        // item.phone?.toString().includes(value) ||
        // item.id?.toString().includes(value) ||
        // item.gks_id?.toLowerCase().includes(value) // Only if gks_id is a string
        item.name && normalize(item.name).includes(value.toLowerCase()) ||
item.email && normalize(item.email).includes(value.toLowerCase()) ||
item.phone && normalize(item.phone).includes(value) ||
item.id && normalize(item.id).includes(value) ||
item.gks_id && normalize(item.gks_id).includes(value.toLowerCase()) ||
item.wardName && normalize(item.wardName).includes(value.toLowerCase()) ||
item.dischargeDate && normalize(item.dischargeDate).includes(value.toLowerCase())
      );
    });

    setFilteredData(filtered);
  };

  // Search handler IPD all entries
  const handleIPDSearchChange = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchText(value);

    if (!value) {
      // Reset to original data if search is empty
      setFilteredIPDData(allIPDData);
      return;
    }
    const normalize = (field) => {
      if (typeof field === "string") {
        return field.toLowerCase(); // English case-insensitive
      }
      return field?.toString() || ""; // Hindi, numbers, dates, etc.
    };

    const IPDfiltered = allIPDData.filter((item) => {
      return (
        // item.name?.toLowerCase().includes(value) ||
        // item.email?.toLowerCase().includes(value) ||
        // item.phone?.toString().includes(value) ||
        // item.id?.toString().includes(value) ||
        // item.gks_id?.toLowerCase().includes(value) ||
        // item.wardName?.toLowerCase().includes(value) ||
        // item.dischargeDate?.toLowerCase().includes(value)


        item.name && normalize(item.name).includes(value.toLowerCase()) ||
item.email && normalize(item.email).includes(value.toLowerCase()) ||
item.phone && normalize(item.phone).includes(value) ||
item.id && normalize(item.id).includes(value) ||
item.gks_id && normalize(item.gks_id).includes(value.toLowerCase()) ||
item.wardName && normalize(item.wardName).includes(value.toLowerCase()) ||
item.dischargeDate && normalize(item.dischargeDate).includes(value.toLowerCase())
      );
    });

    setFilteredIPDData(IPDfiltered);
  };

  //Generate strong password dynamically while registering
  const generatePassword = () => {
    const lowers = "abcdefghijklmnopqrstuvwxyz";
    const uppers = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const digits = "0123456789";
    const symbols = "!@#$%^&*";
    let password = "";
    password += lowers.charAt(Math.floor(Math.random() * lowers.length));
    password += uppers.charAt(Math.floor(Math.random() * uppers.length));
    password += digits.charAt(Math.floor(Math.random() * digits.length));
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));
    const all = lowers + uppers + digits + symbols;
    for (let i = 4; i < 10; ++i) {
      password += all.charAt(Math.floor(Math.random() * all.length));
    }
    return password.split("").sort(() => 0.5 - Math.random()).join("");
  };

  //PDf view download pdf code handler
    const [pfaDownload, setpfaDownload] = useState(false);
    const handleDownloadPDF = () => {
      const element = pdfRef.current;
      setpfaDownload(true);
  
      // Add a temporary class to scale fonts if needed
      element.classList.add("pdf-scale");
  
      const patientName = selectedUser?.name || selectedUser?.patient_name || "Patient";
      const gksId = selectedUser?.custom_code || selectedUser?.gks_id || selectedUser?.uid || selectedUser?.user_id || "";
      const safeName = String(patientName).trim().replace(/\s+/g, "_");
      const safeId = String(gksId).trim().replace(/\s+/g, "_");

      const opt = {
        margin: [10, 10, 10, 10], // top, left, bottom, right
        filename: `patient_${safeName}_${safeId || "registration"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          scrollY: 0,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };
  
      html2pdf()
        .set(opt)
        .from(element)
        .save()
        .then(() => {
          toast.success(getTranslation("Download complete!/डाउनलोड पूर्ण!",lang));
          element.classList.remove("pdf-scale");
  
          setTimeout(() => {
            setpfaDownload(false);
          }, 2000);
        });
    };

  //Print Data handler
  // const handlePrint = () => {
  //   window.print();
  //   // setviweFormPrint(false); // modal will close correctly
  // };

  //Print viewable form data handler (matches Download PDF exactly)
  const handlePrint = () =>
    printElementAsPdf(pdfRef.current, {
      title: `Patient_${selectedUser?.name || "Registration"}`,
    });

  // Patient address and Patient relative address Usestate
  const [sameAddress, setSameAddress] = useState(false);

  


  return (
    <Fragment>
      {/* <H5 className="patient__Register">{patientRegisterTitle}</H5> */}

      {/* Register data table list */}
      {/* <Breadcrumbs parent="Table" title="User List Table" mainTitle="User List Table" /> */}
      <Container fluid={true} className="datatables">
        <Row>
          <Col sm="12">
            <Card>
              <CardBody>
                <div class="d-flex pb-2 justify-content-between">
                  <HeaderCard
                   title={getTranslation("Registered Patient List/ पंजीकृत रोगी सूची" , lang)}
                    className="p-0"
                    qweq
                  />
                  <Btn attrBtn={{ color: "primary", onClick: toggle }}>
                    {/* {registerYourDetail} */}
                    <Translated text={registerYourDetail} />
                  </Btn>
                </div>
                <div className="row pb-3 align-items-center">
                  <div className="col-md-5 col-12 mb-2 mb-md-0">
                    <InputGroup>
                      <Input
                        className="form-control"
                        type="text"
                        placeholder={getTranslation("Search......./खोज.......",lang)}
                        value={IPDsearchText}
                        onChange={handleLatestSearchChange}
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
                      filename="Active_Patient_Registration_List"
                      title={getTranslation("Active Patient Registration List / सक्रिय रोगी पंजीकरण सूची", lang)}
                    />
                  </div>
                </div>
                {stillLoading ? (
                  <div className="loading-text">
                    Data is fetching from server. Please wait...
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
          </Col>
        </Row>
      </Container>

      {/* Get All IPD Datils In Table View */}
      <Container fluid={true} className="datatables">
        <Row>
          <Col sm="12">
            <Card>
              <CardBody>
                <div class="d-flex pb-2 justify-content-between">
                  <HeaderCard
                    title={getTranslation("All Registered Patient List/ सभी पंजीकृत रोगियों की सूची" , lang)}
                    className="p-0"
                    qweq
                  />
                </div>
                <div className="row pb-3 align-items-center">
                  <div className="col-md-5 col-12 mb-2 mb-md-0">
                    <InputGroup>
                      <Input
                        className="form-control"
                        type="text"
                        placeholder={getTranslation("Search......./खोज.......",lang)}
                        value={searchText}
                        onChange={handleIPDSearchChange}
                      />
                      <span className="input-group-text">
                        <i className="fa fa-search"></i>
                      </span>
                    </InputGroup>
                  </div>
                  <div className="col-md-7 col-12 d-flex justify-content-md-end justify-content-start">
                    <TableExportButtons
                      data={filteredIPDData}
                      columns={tableIPDColumns}
                      filename="All_Registered_Patient_List"
                      title={getTranslation("All Registered Patient List / सभी पंजीकृत रोगियों की सूची", lang)}
                    />
                  </div>
                </div>
                {stillLoading ? (
                  <div className="loading-text">
                    {getTranslation("Data is fetching from server. Please wait.../सर्वर से डेटा लिया जा रहा है। कृपया इंतज़ार करें...",lang)}
                  </div>
                ) : (
                  <DataTable
                    data={filteredIPDData}
                    columns={tableIPDColumns}
                    striped
                    center
                    highlightOnHover
                    pagination
                    persistTableHead
                  />
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

      <CommonModal
        isOpen={modal}
        title={getTranslation("Patient Registration Form/रोगी पंजीकरण फॉर्म", lang)}
        toggler={toggle}
        maxWidth="1100px"
      >
        <div className="p-3 p-md-4" style={{ backgroundColor: "#ffffff" }}>
          <DraftNoticeBanner
            draftTimestamp={draftTimestamp}
            formKey="patient_registration"
            targetId="new"
            onDiscard={() => {
              setFormData(initialFormData);
              setDraftTimestamp(null);
            }}
          />
          <Form noValidate onSubmit={handleSubmit}>
            <div className="row g-3">
              {/* Date of Admission */}
              <div className="col-md-6">
                <Label className="form-label fw-semibold text-dark mb-1" style={{ fontSize: "13px" }}>
                  <Translated text={dateOfAdmission} /> <span className="text-danger">*</span>
                </Label>
                <div>
                  <DatePicker
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    className="form-control"
                    style={{ borderRadius: "8px", height: "40px" }}
                    selected={safeDate(formData.date_of_admission)}
                    onChange={(date) => handleDateChange("dateOfAdmission", date)}
                    dateFormat="yyyy/MM/dd"
                  />
                </div>
              </div>

              {/* Patient Name */}
              <div className="col-md-6">
                <Label className="form-label fw-semibold text-dark mb-1" style={{ fontSize: "13px" }}>
                  <Translated text={patientName} /> <span className="text-danger">*</span>
                </Label>
                <Input
                  type="text"
                  name="patientName"
                  value={formData.patientName}
                  onChange={handleChange}
                  placeholder={getTranslation("Enter Patient Name / मरीज़ का नाम दर्ज करें", lang)}
                  className="form-control"
                  style={{ borderRadius: "8px", height: "40px" }}
                />
              </div>

              {/* Patient Relative Name (Mandatory) */}
              <div className="col-md-6">
                <Label className="form-label fw-semibold text-dark mb-1" style={{ fontSize: "13px" }}>
                  <Translated text={patientRelativeName} /> <span className="text-danger">*</span>
                </Label>
                <Input
                  type="text"
                  name="patientRelativeName"
                  value={formData.patientRelativeName}
                  onChange={handleChange}
                  placeholder={getTranslation("Enter Relative Name / रिश्तेदार का नाम दर्ज करें", lang)}
                  className="form-control"
                  style={{ borderRadius: "8px", height: "40px" }}
                />
              </div>

              {/* Gender */}
              <div className="col-md-6">
                <Label className="form-label fw-semibold text-dark mb-1 d-block" style={{ fontSize: "13px" }}>
                  <Translated text={patientSex} /> <span className="text-danger">*</span>
                </Label>
                <div className="d-flex align-items-center gap-3" style={{ height: "40px" }}>
                  {["Male", "Female", "Other"].map((g) => (
                    <div key={g} className="form-check form-check-inline m-0">
                      <Input
                        type="radio"
                        id={`gender-${g}`}
                        name="gender"
                        value={g}
                        checked={formData.gender === g}
                        onChange={handleChange}
                        className="form-check-input"
                      />
                      <Label for={`gender-${g}`} className="form-check-label ms-1" style={{ cursor: "pointer", fontSize: "14px" }}>
                        {g}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Relation with Patient (Mandatory) */}
              <div className="col-md-6">
                <Label className="form-label fw-semibold text-dark mb-1" style={{ fontSize: "13px" }}>
                  {getTranslation("Relation with Patient / रोगी से संबंध", lang)} <span className="text-danger">*</span>
                </Label>
                <select
                  className="form-select"
                  name="relation_with_patient"
                  value={formData.relation_with_patient}
                  onChange={handleChange}
                  style={{ borderRadius: "8px", height: "40px", fontSize: "13.5px" }}
                >
                  <option value="">{getTranslation("Select Relation / संबंध चुनें", lang)}</option>
                  <option value="Father">{getTranslation("Father / पिता", lang)}</option>
                  <option value="Mother">{getTranslation("Mother / माता", lang)}</option>
                  <option value="Brother">{getTranslation("Brother / भाई", lang)}</option>
                  <option value="Sister">{getTranslation("Sister / बहन", lang)}</option>
                  <option value="Spouse">{getTranslation("Spouse (Husband/Wife) / पति/पत्नी", lang)}</option>
                  <option value="Son">{getTranslation("Son / बेटा", lang)}</option>
                  <option value="Daughter">{getTranslation("Daughter / बेटी", lang)}</option>
                  <option value="Friend">{getTranslation("Friend / मित्र", lang)}</option>
                  <option value="Guardian">{getTranslation("Guardian / अभिभावक", lang)}</option>
                  <option value="Uncle">{getTranslation("Uncle / चाचा/मामा", lang)}</option>
                  <option value="Aunt">{getTranslation("Aunt / चाची/मामी", lang)}</option>
                  <option value="Cousin">{getTranslation("Cousin / चचेरा/ममेरा भाई/बहन", lang)}</option>
                  <option value="Self">{getTranslation("Self / स्वयं", lang)}</option>
                  <option value="Other Relative">{getTranslation("Other Relative / अन्य रिश्तेदार", lang)}</option>
                  <option value="Other">{getTranslation("Other / अन्य", lang)}</option>
                </select>
              </div>

              {/* DOB */}
              <div className="col-md-6">
                <Label className="form-label fw-semibold text-dark mb-1" style={{ fontSize: "13px" }}>
                  <Translated text={patientDateOfBirth} /> <span className="text-danger">*</span>
                </Label>
                <div>
                  <DatePicker
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    className="form-control"
                    style={{ borderRadius: "8px", height: "40px" }}
                    selected={safeDate(formData.dob)}
                    onChange={(date) => handleDateChange("dob", date)}
                    dateFormat="yyyy/MM/dd"
                  />
                </div>
              </div>

              {/* Primary Phone */}
              <div className="col-md-6">
                <Label className="form-label fw-semibold text-dark mb-1" style={{ fontSize: "13px" }}>
                  <Translated text={patientRelativePhoneNumber} /> <span className="text-danger">*</span>
                </Label>
                <Input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d{0,10}$/.test(value)) {
                      setFormData((prev) => ({
                        ...prev,
                        phone: value,
                        whatsapp_no: sameAsPrimaryPhone ? value : prev.whatsapp_no,
                      }));
                    }
                  }}
                  placeholder={getTranslation("Enter 10-digit Phone Number / 10 अंकों का फोन नंबर दर्ज करें", lang)}
                  maxLength={10}
                  className="form-control"
                  style={{ borderRadius: "8px", height: "40px" }}
                />
                {formData.phone.length > 0 && formData.phone.length !== 10 && (
                  <small className="text-danger d-block mt-1">
                    {getTranslation("Phone number must be 10 digits. / फ़ोन नंबर 10 अंकों का होना चाहिए।", lang)}
                  </small>
                )}
              </div>

              {/* Mobile number for WhatsApp (Optional) + Same as Patient Primary Phone Number */}
              <div className="col-md-6">
                <div className="d-flex justify-content-between align-items-center mb-1 flex-wrap gap-1">
                  <Label className="form-label fw-semibold text-dark mb-0" style={{ fontSize: "13px" }}>
                    {getTranslation("Mobile number for WhatsApp / व्हाट्सएप के लिए मोबाइल नंबर", lang)}
                    <span className="text-muted fw-normal ms-1" style={{ fontSize: "12px" }}>
                      ({getTranslation("Optional / वैकल्पिक", lang)})
                    </span>
                  </Label>
                  <div className="form-check m-0 p-0 d-inline-flex align-items-center gap-1">
                    <Input
                      type="checkbox"
                      id="sameAsPrimaryPhoneCheck"
                      checked={sameAsPrimaryPhone}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSameAsPrimaryPhone(checked);
                        if (checked) {
                          setFormData((prev) => ({ ...prev, whatsapp_no: prev.phone || "" }));
                        }
                      }}
                      className="form-check-input m-0"
                    />
                    <Label
                      for="sameAsPrimaryPhoneCheck"
                      className="form-check-label text-primary mb-0"
                      style={{ fontSize: "12px", cursor: "pointer", fontWeight: "600" }}
                    >
                      {getTranslation("Same as Patient Primary Phone Number / प्राथमिक फ़ोन नंबर जैसा", lang)}
                    </Label>
                  </div>
                </div>
                <Input
                  type="text"
                  name="whatsapp_no"
                  value={formData.whatsapp_no}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d{0,10}$/.test(value)) {
                      setFormData((prev) => ({ ...prev, whatsapp_no: value }));
                      if (sameAsPrimaryPhone && value !== formData.phone) {
                        setSameAsPrimaryPhone(false);
                      }
                    }
                  }}
                  placeholder={getTranslation("Enter 10-digit WhatsApp Number / 10 अंकों का व्हाट्सएप नंबर दर्ज करें", lang)}
                  maxLength={10}
                  className="form-control"
                  style={{ borderRadius: "8px", height: "40px" }}
                />
                {formData.whatsapp_no.length > 0 && formData.whatsapp_no.length !== 10 && (
                  <small className="text-danger d-block mt-1">
                    {getTranslation("WhatsApp number must be 10 digits. / व्हाट्सएप नंबर 10 अंकों का होना चाहिए।", lang)}
                  </small>
                )}
              </div>

              {/* Patient Secondary Phone Number (Optional) */}
              <div className="col-md-6">
                <Label className="form-label fw-semibold text-dark mb-1" style={{ fontSize: "13px" }}>
                  {getTranslation("Patient Secondary Phone Number / द्वितीयक फ़ोन नंबर", lang)}
                  <span className="text-muted fw-normal ms-1" style={{ fontSize: "12px" }}>
                    ({getTranslation("Optional / वैकल्पिक", lang)})
                  </span>
                </Label>
                <Input
                  type="text"
                  name="secondary_phone"
                  value={formData.secondary_phone || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d{0,10}$/.test(value)) {
                      setFormData((prev) => ({ ...prev, secondary_phone: value }));
                    }
                  }}
                  placeholder={getTranslation("Enter 10-digit Secondary Phone (Optional) / द्वितीयक फ़ोन नंबर", lang)}
                  maxLength={10}
                  className="form-control"
                  style={{ borderRadius: "8px", height: "40px" }}
                />
              </div>

              {/* Relative Email (Optional) */}
              <div className="col-md-6">
                <Label className="form-label fw-semibold text-dark mb-1" style={{ fontSize: "13px" }}>
                  <Translated text={patientRelativeEmailAddr} />
                  <span className="text-muted fw-normal ms-1" style={{ fontSize: "12px" }}>({getTranslation("Optional / वैकल्पिक", lang)})</span>
                </Label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, email: value });
                    setEmailError(
                      value &&
                        !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)
                        ? getTranslation("Please enter a valid email address / कृपया एक वैध ईमेल पता दर्ज करें", lang)
                        : ""
                    );
                  }}
                  placeholder={getTranslation("Enter Email Address (Optional) / ईमेल पता दर्ज करें (वैकल्पिक)", lang)}
                  className="form-control"
                  style={{ borderRadius: "8px", height: "40px" }}
                />
                {emailError ? (
                  <small className="text-danger d-block mt-1">{emailError}</small>
                ) : isEmailAlreadyUsed(formData.email) ? (
                  <small className="text-warning d-block mt-1 fw-medium" style={{ fontSize: "11.5px" }}>
                    ⚠️ {getTranslation("This email is already in use by another user. Since email is optional, you can leave it blank or use a different email. / यह ईमेल पहले से उपयोग में है। चूँकि ईमेल वैकल्पिक है, आप इसे खाली छोड़ सकते हैं।", lang)}
                  </small>
                ) : (
                  <small className="text-muted d-block mt-1" style={{ fontSize: "11px" }}>
                    {getTranslation("Optional: Leave blank if patient relative does not have an email. / वैकल्पिक: यदि संबंधी के पास ईमेल नहीं है तो खाली छोड़ दें।", lang)}
                  </small>
                )}
              </div>

              {/* Password */}
              <div className="col-md-6">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <Label className="form-label fw-semibold text-dark mb-0" style={{ fontSize: "13px" }}>
                    <Translated text={Password} /> <span className="text-danger">*</span>
                  </Label>
                  <span
                    className="text-primary d-inline-flex align-items-center gap-1"
                    style={{ fontSize: "12px", cursor: "pointer", fontWeight: "500" }}
                    onClick={() => {
                      const generatedPassword = generatePassword();
                      setFormData((prev) => ({
                        ...prev,
                        password: generatedPassword,
                      }));
                      setPasswordError("");
                    }}
                    title="Generate Password"
                  >
                    ✨ {getTranslation("Generate / बनाएं", lang)}
                  </span>
                </div>
                <div className="position-relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, password: value });
                      validatePassword(value);
                    }}
                    placeholder={getTranslation("Enter Password / पासवर्ड दर्ज करें", lang)}
                    className="form-control pe-5"
                    style={{ borderRadius: "8px", height: "40px" }}
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#64748b",
                    }}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </span>
                </div>
                {passwordError && (
                  <small className="text-danger d-block mt-1">{passwordError}</small>
                )}
              </div>

              {/* Wards Details (Full width) */}
              <div className="col-12">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <Label className="form-label fw-semibold text-dark mb-0" style={{ fontSize: "13px" }}>
                    <Translated text={wardDetails} /> <span className="text-danger">*</span>
                  </Label>
                </div>
                <div className="d-flex align-items-center flex-wrap gap-3 py-1" style={{ minHeight: "40px" }}>
                  {isWardsLoading ? (
                    <div className="d-flex align-items-center gap-2 text-muted small">
                      <Spinner size="sm" color="primary" />
                      <span>{getTranslation("Loading wards... / वार्ड लोड हो रहे हैं...", lang)}</span>
                    </div>
                  ) : (
                    (wardList && wardList.length > 0 ? wardList : wardOptions).map((option) => {
                      const optId = option.ward_type_id || option.id;
                      const optName = option.ward_name || option.name;
                      return (
                        <div key={optId} className="form-check form-check-inline m-0">
                          <Input
                            type="radio"
                            id={`wards-${optId}`}
                            name="ward"
                            value={optName}
                            checked={String(formData.ward_type_id) === String(optId)}
                            onChange={() =>
                              setFormData((prev) => ({
                                ...prev,
                                ward_type_id: optId,
                                ward_name: optName,
                              }))
                            }
                            className="form-check-input"
                          />
                          <Label
                            for={`wards-${optId}`}
                            className="form-check-label ms-1"
                            style={{ cursor: "pointer", fontSize: "14px" }}
                          >
                            {optName}
                            {(option.original_amount ?? option.price_rate ?? option.ward_amount) ? (
                              <span className="text-muted extra-small ms-1" style={{ fontSize: "11px" }}>
                                (₹{Number(option.original_amount ?? option.price_rate ?? option.ward_amount).toLocaleString("en-IN")})
                              </span>
                            ) : null}
                          </Label>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Patient Photo Upload with Modern Camera Icon & Optimization (.jpg / .jpeg / .pdf, max 5 MB) — Mandatory */}
              <div className="col-md-6">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <Label className="form-label fw-semibold text-dark mb-0" style={{ fontSize: "13px" }}>
                    {getTranslation("Upload Patient Profile Image / रोगी प्रोफ़ाइल छवि अपलोड करें", lang)}{" "}
                    <span className="text-danger">*</span>
                  </Label>
                  <span className="text-muted" style={{ fontSize: "11px" }}>
                    JPG / JPEG / PDF (Max 5MB)
                  </span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {preview && (
                    <img
                      src={preview}
                      alt="Preview"
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "2px solid #1E6554",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <div className="position-relative flex-grow-1" style={{ display: "flex", alignItems: "center" }}>
                    <Input
                      id="patientPhotoInput"
                      type="file"
                      accept=".jpg,.jpeg,.pdf,image/jpeg,application/pdf"
                      onChange={handleImageChange}
                      className="form-control"
                      style={{ borderRadius: "8px", height: "40px", paddingRight: "42px" }}
                    />
                    <input
                      id="patientPhotoCameraInput"
                      type="file"
                      accept="image/jpeg,image/*"
                      capture="environment"
                      onChange={handleImageChange}
                      style={{ display: "none" }}
                    />
                    <label
                      htmlFor="patientPhotoCameraInput"
                      className="d-flex align-items-center justify-content-center"
                      style={{
                        position: "absolute",
                        right: "6px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        cursor: "pointer",
                        width: "28px",
                        height: "28px",
                        borderRadius: "6px",
                        background: "#e6f4ea",
                        border: "1px solid #bbf7d0",
                        transition: "all 0.2s ease-in-out",
                        margin: 0,
                        zIndex: 2,
                      }}
                      title={getTranslation("Take photo with camera / कैमरे से फ़ोटो लें", lang)}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1E6554" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                        <circle cx="12" cy="13" r="4"></circle>
                      </svg>
                    </label>
                  </div>
                </div>
                {imageOptimizationInfo && image && (
                  <div className="d-flex align-items-center justify-content-between mt-1 px-1">
                    <small className="text-success fw-semibold" style={{ fontSize: "11.5px" }}>
                      ✓ {getTranslation("Ready / तैयार", lang)}: {imageOptimizationInfo.name || image.name} ({(image.size / 1024).toFixed(0)} KB)
                      {imageOptimizationInfo.originalSize > image.size && (
                        <span className="text-muted fw-normal ms-1">
                          ({getTranslation("Saved / बचत", lang)} {Math.round((1 - image.size / imageOptimizationInfo.originalSize) * 100)}%)
                        </span>
                      )}
                    </small>
                  </div>
                )}
                {error && <small className="text-danger d-block mt-1">{error}</small>}
              </div>

              {/* Admission Form Upload — Multiple JPG / JPEG / PDF & Direct Camera Capture (max 5 MB) — Mandatory */}
              <div className="col-md-6">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <Label className="form-label fw-semibold text-dark mb-0" style={{ fontSize: "13px" }}>
                    {getTranslation("Upload Admission Form (JPG / JPEG / PDF) / प्रवेश फ़ॉर्म अपलोड करें", lang)}{" "}
                    <span className="text-danger">*</span>
                  </Label>
                  <span className="text-muted" style={{ fontSize: "11px" }}>
                    Multiple JPG / JPEG / PDF (Max 5MB)
                  </span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {admissionFormPreview && (
                    <img
                      src={admissionFormPreview}
                      alt="Admission Form Preview"
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "8px",
                        objectFit: "cover",
                        border: "2px solid #1E6554",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <div className="position-relative flex-grow-1" style={{ display: "flex", alignItems: "center" }}>
                    <Input
                      id="admissionFormInput"
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.pdf,image/jpeg,application/pdf"
                      onChange={handleAdmissionFormChange}
                      className="form-control"
                      style={{ borderRadius: "8px", height: "40px", paddingRight: "74px" }}
                    />
                    {/* Dedicated Camera Capture Input for Tablets / Mobile */}
                    <input
                      id="admissionFormCameraInput"
                      type="file"
                      accept="image/jpeg,image/*"
                      capture="environment"
                      onChange={handleAdmissionFormChange}
                      style={{ display: "none" }}
                    />
                    <label
                      htmlFor="admissionFormInput"
                      className="d-flex align-items-center justify-content-center"
                      style={{
                        position: "absolute",
                        right: "38px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        cursor: "pointer",
                        width: "28px",
                        height: "28px",
                        borderRadius: "6px",
                        background: "#fef3c7",
                        border: "1px solid #fde68a",
                        transition: "all 0.2s ease-in-out",
                        margin: 0,
                        zIndex: 2,
                      }}
                      title={getTranslation("Upload Multiple PDFs or Images / एकाधिक पीडीएफ या छवियां अपलोड करें", lang)}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                    </label>
                    <label
                      htmlFor="admissionFormCameraInput"
                      className="d-flex align-items-center justify-content-center"
                      style={{
                        position: "absolute",
                        right: "6px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        cursor: "pointer",
                        width: "28px",
                        height: "28px",
                        borderRadius: "6px",
                        background: "#e6f4ea",
                        border: "1px solid #bbf7d0",
                        transition: "all 0.2s ease-in-out",
                        margin: 0,
                        zIndex: 2,
                      }}
                      title={getTranslation("Capture admission form with camera / कैमरे से प्रवेश फ़ॉर्म फ़ोटो लें", lang)}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1E6554" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                        <circle cx="12" cy="13" r="4"></circle>
                      </svg>
                    </label>
                  </div>
                </div>
                {admissionFormFiles.length > 0 && (
                  <div className="d-flex flex-wrap gap-1 mt-2">
                    {admissionFormFiles.map((f, idx) => (
                      <span
                        key={idx}
                        className="badge bg-light text-dark border d-inline-flex align-items-center gap-1 px-2 py-1"
                        style={{ fontSize: "11.5px", fontWeight: "500" }}
                      >
                        {f.isPdf ? "📄" : "🖼️"} {f.name} ({(f.size / 1024).toFixed(0)} KB)
                        <button
                          type="button"
                          onClick={() => removeAdmissionFormFile(idx)}
                          className="btn btn-sm p-0 ms-1 text-danger border-0 bg-transparent"
                          style={{ fontSize: "12px", lineHeight: 1 }}
                          title="Remove file"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {admissionFormError && (
                  <small className="text-danger d-block mt-1">{admissionFormError}</small>
                )}
              </div>

              {/* Additional Relative Contacts */}
              <div className="col-12">
                <div className="p-3 bg-light rounded-3 border" style={{ borderRadius: "10px" }}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <Label className="form-label fw-semibold text-dark mb-0" style={{ fontSize: "13px" }}>
                      {getTranslation("Additional Relative Contacts / अतिरिक्त संबंधी संपर्क", lang)}
                      <span className="text-muted fw-normal ms-1" style={{ fontSize: "12px" }}>({getTranslation("Optional / वैकल्पिक", lang)})</span>
                    </Label>
                    <Button
                      color="secondary"
                      type="button"
                      size="sm"
                      onClick={addRelativeContact}
                      style={{ borderRadius: "6px", fontSize: "12px" }}
                    >
                      {getTranslation("+ Add Contact / + संपर्क जोड़ें", lang)}
                    </Button>
                  </div>

                  {formData.relative_contacts.map((contact, index) => (
                    <div className="bg-white p-2 mb-2 rounded border" key={index} style={{ borderRadius: "8px" }}>
                      <div className="row g-2 align-items-center">
                        <div className="col-md-4 col-sm-6">
                          <Input
                            type="text"
                            placeholder={getTranslation("Contact Name / संपर्क का नाम", lang)}
                            value={contact.name}
                            onChange={(e) => handleRelativeContactChange(index, "name", e.target.value)}
                            className="form-control"
                            style={{ borderRadius: "6px", height: "36px", fontSize: "13px" }}
                          />
                        </div>
                        <div className="col-md-4 col-sm-6">
                          <Input
                            type="text"
                            placeholder={getTranslation("Phone Number / फ़ोन नंबर", lang)}
                            value={contact.phone}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^\d{0,10}$/.test(value)) {
                                handleRelativeContactChange(index, "phone", value);
                              }
                            }}
                            maxLength={10}
                            className="form-control"
                            style={{ borderRadius: "6px", height: "36px", fontSize: "13px" }}
                          />
                        </div>
                        <div className="col-md-3 col-sm-8 d-flex align-items-center">
                          <div className="form-check form-switch d-flex align-items-center gap-2 m-0">
                            <Input
                              type="checkbox"
                              id={`contact-wa-${index}`}
                              checked={!!contact.is_whatsapp}
                              onChange={(e) => {
                                const isChecked = e.target.checked;
                                handleRelativeContactChange(index, "is_whatsapp", isChecked);
                                if (isChecked) {
                                  toast.success(
                                    getTranslation(
                                      `WhatsApp enabled for ${contact.name || "Relative"} (${contact.phone || "Number"}) / व्हाट्सएप संचार सक्षम किया गया`,
                                      lang
                                    ),
                                    { autoClose: 2500 }
                                  );
                                } else {
                                  toast.info(
                                    getTranslation(
                                      `WhatsApp disabled for ${contact.name || "Relative"} / व्हाट्सएप संचार अक्षम किया गया`,
                                      lang
                                    ),
                                    { autoClose: 2000 }
                                  );
                                }
                              }}
                              role="switch"
                              className="form-check-input cursor-pointer"
                              style={{ cursor: "pointer", width: "36px", height: "18px" }}
                            />
                            <Label
                              htmlFor={`contact-wa-${index}`}
                              className={`form-check-label mb-0 small cursor-pointer fw-semibold ${
                                contact.is_whatsapp ? "text-success" : "text-muted"
                              }`}
                              style={{ fontSize: "12px" }}
                            >
                              {contact.is_whatsapp
                                ? getTranslation("✓ WhatsApp Enabled / व्हाट्सएप सक्रिय", lang)
                                : getTranslation("WhatsApp? / व्हाट्सएप?", lang)}
                            </Label>
                          </div>
                        </div>
                        <div className="col-md-1 col-sm-4 text-end">
                          {formData.relative_contacts.length > 1 && (
                            <Button
                              color="danger"
                              outline
                              type="button"
                              size="sm"
                              className="w-100"
                              onClick={() => removeRelativeContact(index)}
                              style={{ borderRadius: "6px", height: "36px", padding: "0" }}
                              title={getTranslation("Remove / हटाएं", lang)}
                            >
                              ✕
                            </Button>
                          )}
                        </div>
                      </div>

                      {contact.is_whatsapp && (
                        <div className="mt-1 pt-1 border-top d-flex align-items-center gap-1 text-success" style={{ fontSize: "11px" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.058-2.127-.53-1.62-.667-2.668-2.316-2.75-2.423-.081-.107-.655-.873-.655-1.666 0-.793.415-1.183.562-1.343.148-.16.323-.2.431-.2.108 0 .216.002.31.007.099.006.232-.038.363.277.135.323.461 1.127.502 1.209.041.082.069.178.014.287-.054.108-.082.176-.163.271-.082.096-.172.214-.246.287-.082.082-.167.171-.072.334.095.163.422.697.906 1.127.623.555 1.148.728 1.311.809.163.082.259.072.355-.04.096-.111.411-.479.521-.643.11-.164.219-.137.367-.082.148.055.938.442 1.1.523.162.082.27.122.31.19.04.068.04.394-.104.799z"/>
                          </svg>
                          <span>
                            {getTranslation(
                              "Patient progress & emergency updates will also be shared to this WhatsApp number. / रोगी की प्रगति और आपातकालीन अपडेट इस व्हाट्सएप नंबर पर भी साझा किए जाएंगे।",
                              lang
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Patient Relative Address */}
              <div className="col-md-6">
                <VoiceTextarea
                  label={
                    <span className="fw-semibold text-dark" style={{ fontSize: "13px" }}>
                      <Translated text={pateintRelativeAddress} />
                      <span className="text-muted fw-normal ms-1" style={{ fontSize: "12px" }}>
                        ({getTranslation("Optional / वैकल्पिक", lang)})
                      </span>
                    </span>
                  }
                  name="relativeaddress"
                  value={formData.relativeaddress}
                  onChange={handleChange}
                />
              </div>

              {/* Patient Address */}
              <div className="col-md-6">
                <VoiceTextarea
                  label={
                    <span className="fw-semibold text-dark" style={{ fontSize: "13px" }}>
                      <Translated text={pateintAddress} /> <span className="text-danger">*</span>
                    </span>
                  }
                  name="address"
                  value={formData.address}
                  onChange={(e) => {
                    handleChange(e);
                    if (sameAddress) {
                      setSameAddress(false);
                    }
                  }}
                />
              </div>

              {/* Same Address Checkbox */}
              <div className="col-12">
                <div className="form-check">
                  <Input
                    type="checkbox"
                    id="sameAddressCheck"
                    className="form-check-input"
                    checked={sameAddress}
                    onChange={(e) => {
                      setSameAddress(e.target.checked);
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          address: formData.relativeaddress,
                        });
                      }
                    }}
                  />
                  <Label for="sameAddressCheck" className="form-check-label ms-1" style={{ cursor: "pointer", fontSize: "13.5px" }}>
                    <Translated text="Same as Patient Relative Address" />
                  </Label>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="d-flex justify-content-end align-items-center gap-2 pt-4 mt-4 border-top flex-wrap">
              <Button
                color="light"
                type="button"
                className="border fw-semibold px-4"
                onClick={toggle}
                style={{ borderRadius: "8px" }}
              >
                {getTranslation("Cancel / रद्द करें", lang)}
              </Button>

              <SaveDraftButton
                formKey="patient_registration"
                targetId="new"
                formData={formData}
                onDraftSaved={() => setDraftTimestamp(Date.now())}
                style={{ height: "40px", padding: "8px 18px", borderRadius: "8px" }}
              />

              <Button
                color="primary"
                type="submit"
                disabled={isRegisterSubmitting}
                style={{
                  borderRadius: "8px",
                  backgroundColor: "#d56337",
                  borderColor: "#d56337",
                  fontWeight: "600",
                  padding: "8px 24px",
                  minWidth: "180px",
                }}
              >
                {isRegisterSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    {submitStatusMessage || getTranslation("Registering... / पंजीकरण हो रहा है...", lang)}
                  </>
                ) : (
                  getTranslation("Patient Register / रोगी रजिस्टर", lang)
                )}
              </Button>
            </div>
          </Form>
        </div>
      </CommonModal>

      {/* Modern View User Details Modal */}
      <UserDetailsModal
        isOpen={viewModal}
        userId={selectedUserId}
        user={selectedUser}
        toggler={closeUserViewModal}
      />

      {/* Update form data modal */}
      <CommonModal
        isOpen={showEditModal}
        title={getTranslation("Update Patient Registration Data / रोगी पंजीकरण डेटा अपडेट करें", lang)}
        toggler={closeUserViewModal}
        maxWidth="1100px"
      >
        {showEditModal && (
          <div className="p-3 p-md-4" style={{ backgroundColor: "#ffffff" }}>
            <Form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateSubmit();
              }}
            >
              <div className="row g-3">
                {/* Patient Name */}
                <div className="col-md-6">
                  <Label className="form-label fw-semibold text-dark mb-1" style={{ fontSize: "13px" }}>
                    {getTranslation("Patient Name / रोगी का नाम", lang)}
                  </Label>
                  <Input
                    type="text"
                    placeholder={getTranslation("Name / नाम", lang)}
                    value={editData.name}
                    onChange={(e) =>
                      setEditData({ ...editData, name: e.target.value })
                    }
                    className="form-control"
                    style={{ borderRadius: "8px", height: "40px" }}
                  />
                </div>

                {/* Relative Name */}
                <div className="col-md-6">
                  <Label className="form-label fw-semibold text-dark mb-1" style={{ fontSize: "13px" }}>
                    {getTranslation("Patient Relative Name / रोगी का संबंधी का नाम", lang)}
                  </Label>
                  <Input
                    type="text"
                    placeholder={getTranslation("Relative Name / रिश्तेदार का नाम", lang)}
                    value={editData.patientRelativeName}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        patientRelativeName: e.target.value,
                      })
                    }
                    className="form-control"
                    style={{ borderRadius: "8px", height: "40px" }}
                  />
                </div>

                {/* Relation with Patient */}
                <div className="col-md-6">
                  <Label className="form-label fw-semibold text-dark mb-1" style={{ fontSize: "13px" }}>
                    {getTranslation("Relation with Patient / रोगी से संबंध", lang)}
                  </Label>
                  <select
                    className="form-select"
                    name="relation_with_patient"
                    value={editData.relation_with_patient}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        relation_with_patient: e.target.value,
                      })
                    }
                    style={{ borderRadius: "8px", height: "40px", fontSize: "13.5px" }}
                  >
                    <option value="">{getTranslation("Select Relation / संबंध चुनें", lang)}</option>
                    <option value="Father">{getTranslation("Father / पिता", lang)}</option>
                    <option value="Mother">{getTranslation("Mother / माता", lang)}</option>
                    <option value="Brother">{getTranslation("Brother / भाई", lang)}</option>
                    <option value="Sister">{getTranslation("Sister / बहन", lang)}</option>
                    <option value="Spouse">{getTranslation("Spouse (Husband/Wife) / पति/पत्नी", lang)}</option>
                    <option value="Son">{getTranslation("Son / बेटा", lang)}</option>
                    <option value="Daughter">{getTranslation("Daughter / बेटी", lang)}</option>
                    <option value="Friend">{getTranslation("Friend / मित्र", lang)}</option>
                    <option value="Guardian">{getTranslation("Guardian / अभिभावक", lang)}</option>
                    <option value="Uncle">{getTranslation("Uncle / चाचा/मामा", lang)}</option>
                    <option value="Aunt">{getTranslation("Aunt / चाची/मामी", lang)}</option>
                    <option value="Cousin">{getTranslation("Cousin / चचेरा/ममेरा भाई/बहन", lang)}</option>
                    <option value="Self">{getTranslation("Self / स्वयं", lang)}</option>
                    <option value="Other Relative">{getTranslation("Other Relative / अन्य रिश्तेदार", lang)}</option>
                    <option value="Other">{getTranslation("Other / अन्य", lang)}</option>
                  </select>
                </div>

                {/* Gender */}
                <div className="col-md-6">
                  <Label className="form-label fw-semibold text-dark mb-1 d-block" style={{ fontSize: "13px" }}>
                    {getTranslation("Patient Gender / रोगी का लिंग", lang)}
                  </Label>
                  <div className="d-flex align-items-center gap-3" style={{ height: "40px" }}>
                    {["Male", "Female", "Other"].map((g) => (
                      <div key={g} className="form-check form-check-inline m-0">
                        <Input
                          type="radio"
                          id={`edit-gender-${g}`}
                          name="edit-gender"
                          value={g}
                          checked={editData.gender === g}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              gender: e.target.value,
                            })
                          }
                          className="form-check-input"
                        />
                        <Label for={`edit-gender-${g}`} className="form-check-label ms-1" style={{ cursor: "pointer", fontSize: "14px" }}>
                          {g}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Phone */}
                <div className="col-md-6">
                  <Label className="form-label fw-semibold text-dark mb-1" style={{ fontSize: "13px" }}>
                    {getTranslation("Patient Phone / मरीज़ का फ़ोन", lang)}
                  </Label>
                  <Input
                    type="text"
                    placeholder={getTranslation("Phone / फ़ोन", lang)}
                    value={editData.phone}
                    onChange={(e) => {
                      const newPhone = e.target.value;
                      setEditData((prev) => ({
                        ...prev,
                        phone: newPhone,
                        whatsapp_no: prev.isWhatsApp ? newPhone : prev.whatsapp_no,
                      }));
                    }}
                    className="form-control"
                    style={{ borderRadius: "8px", height: "40px" }}
                  />
                </div>

                {/* Secondary Phone */}
                <div className="col-md-6">
                  <Label className="form-label fw-semibold text-dark mb-1" style={{ fontSize: "13px" }}>
                    {getTranslation("Patient Secondary Phone / रोगी का द्वितीयक फोन", lang)}
                  </Label>
                  <Input
                    type="text"
                    placeholder={getTranslation("Secondary Phone / द्वितीयक फोन", lang)}
                    value={editData.secondary_phone}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        secondary_phone: e.target.value,
                      })
                    }
                    className="form-control"
                    style={{ borderRadius: "8px", height: "40px" }}
                  />
                </div>

                {/* Is WhatsApp & WhatsApp No */}
                <div className="col-md-6">
                  <Label className="form-label fw-semibold text-dark mb-1 d-block" style={{ fontSize: "13px" }}>
                    {getTranslation("Patient Is WhatsApp? / क्या मरीज़ व्हाट्सएप्प है?", lang)}
                  </Label>
                  <div className="d-flex align-items-center gap-2" style={{ height: "40px" }}>
                    <div className="form-check">
                      <Input
                        type="checkbox"
                        id="editIsWhatsApp"
                        checked={editData.isWhatsApp}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setEditData((prev) => ({
                            ...prev,
                            isWhatsApp: isChecked,
                            whatsapp_no: isChecked ? prev.phone : "",
                          }));
                        }}
                        className="form-check-input"
                      />
                      <Label for="editIsWhatsApp" className="form-check-label ms-1" style={{ cursor: "pointer", fontSize: "13.5px" }}>
                        {getTranslation("Yes, Same as Primary Phone / हाँ, प्राथमिक फ़ोन जैसा", lang)}
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <Label className="form-label fw-semibold text-dark mb-1" style={{ fontSize: "13px" }}>
                    {getTranslation("Patient WhatsApp No. / मरीज़ का व्हाट्सएप नंबर", lang)}
                  </Label>
                  <Input
                    type="text"
                    placeholder={getTranslation("WhatsApp No. / व्हाट्सएप नंबर", lang)}
                    value={editData.whatsapp_no}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        whatsapp_no: e.target.value,
                      })
                    }
                    disabled={editData.isWhatsApp}
                    className="form-control"
                    style={{ borderRadius: "8px", height: "40px" }}
                  />
                </div>

                {/* Email */}
                <div className="col-md-6">
                  <Label className="form-label fw-semibold text-dark mb-1" style={{ fontSize: "13px" }}>
                    {getTranslation("Patient Email / रोगी का ईमेल", lang)}
                  </Label>
                  <Input
                    type="email"
                    placeholder={getTranslation("Email / ईमेल", lang)}
                    value={editData.email}
                    onChange={(e) =>
                      setEditData({ ...editData, email: e.target.value })
                    }
                    className="form-control"
                    style={{ borderRadius: "8px", height: "40px" }}
                  />
                </div>

                {/* DOB */}
                <div className="col-md-6">
                  <Label className="form-label fw-semibold text-dark mb-1" style={{ fontSize: "13px" }}>
                    {getTranslation("Patient Date of Birth / रोगी की जन्मतिथि", lang)}
                  </Label>
                  <div>
                    <DatePicker
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      className="form-control"
                      style={{ borderRadius: "8px", height: "40px" }}
                      selected={safeDate(editData?.dob)}
                      onChange={(date) =>
                        setEditData({ ...editData, dob: date })
                      }
                      dateFormat="yyyy/MM/dd"
                    />
                  </div>
                </div>

                {/* Edit Ward Details */}
                <div className="col-12">
                  <Label className="form-label fw-semibold text-dark mb-1" style={{ fontSize: "13px" }}>
                    <Translated text={wardDetails} />
                  </Label>
                  <div className="d-flex align-items-center flex-wrap gap-3 py-1" style={{ minHeight: "40px" }}>
                    {(wardList && wardList.length > 0 ? wardList : wardOptions).map((option) => {
                      const optId = option.ward_type_id || option.id;
                      const optName = option.ward_name || option.name;
                      const isChecked =
                        (editData.ward_type_id && String(editData.ward_type_id) === String(optId)) ||
                        (!editData.ward_type_id &&
                          editData.ward_name &&
                          String(editData.ward_name).trim().toLowerCase() === String(optName).trim().toLowerCase());
                      return (
                        <div key={optId} className="form-check form-check-inline m-0">
                          <Input
                            type="radio"
                            id={`edit-wards-${optId}`}
                            name="edit-ward"
                            value={optName}
                            checked={Boolean(isChecked)}
                            onChange={() =>
                              setEditData((prev) => ({
                                ...prev,
                                ward_type_id: optId,
                                ward_name: optName,
                              }))
                            }
                            className="form-check-input"
                          />
                          <Label
                            for={`edit-wards-${optId}`}
                            className="form-check-label ms-1"
                            style={{ cursor: "pointer", fontSize: "14px" }}
                          >
                            {optName}
                            {(option.original_amount ?? option.price_rate ?? option.ward_amount) ? (
                              <span className="text-muted extra-small ms-1" style={{ fontSize: "11px" }}>
                                (₹{Number(option.original_amount ?? option.price_rate ?? option.ward_amount).toLocaleString("en-IN")})
                              </span>
                            ) : null}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Profile Pic Upload with Camera Support */}
                <div className="col-md-6">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <Label className="form-label fw-semibold text-dark mb-0" style={{ fontSize: "13px" }}>
                      {getTranslation("Update Patient Profile Image / रोगी प्रोफ़ाइल छवि अपडेट करें", lang)}
                    </Label>
                    <span className="text-muted" style={{ fontSize: "11px" }}>
                      JPG / JPEG / PDF + Camera
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    {(editData.profile_pic_preview || editData.profile_pic_url) && (
                      <img
                        src={editData.profile_pic_preview || editData.profile_pic_url}
                        alt="Patient profile"
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "2px solid #1E6554",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <div className="position-relative flex-grow-1" style={{ display: "flex", alignItems: "center" }}>
                      <Input
                        id="editProfilePicInput"
                        type="file"
                        accept=".jpg,.jpeg,.pdf,image/jpeg,application/pdf"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
                          if (isPdf) {
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error(getTranslation("File size must be less than 5 MB / फ़ाइल 5 MB से कम होनी चाहिए।", lang));
                              e.target.value = "";
                              return;
                            }
                            setEditData({ ...editData, profile_pic: file, profile_pic_preview: "" });
                            return;
                          }
                          if (file.size > 10 * 1024 * 1024) {
                            toast.error(getTranslation("Image file size must be less than 10MB before optimization / छवि फ़ाइल का आकार 10MB से कम होना चाहिए।", lang));
                            e.target.value = "";
                            return;
                          }
                          try {
                            const compressed = await compressImageFile(file);
                            if (compressed.size > 5 * 1024 * 1024) {
                              toast.error(getTranslation("File size exceeds 5 MB limit. / फ़ाइल 5 MB सीमा से अधिक है।", lang));
                              e.target.value = "";
                              return;
                            }
                            setEditData({
                              ...editData,
                              profile_pic: compressed,
                              profile_pic_preview: URL.createObjectURL(compressed),
                            });
                            toast.success(getTranslation(`Image optimized (JPG): ${(compressed.size / 1024).toFixed(0)} KB / छवि अनुकूलित`, lang));
                          } catch {
                            setEditData({
                              ...editData,
                              profile_pic: file,
                              profile_pic_preview: URL.createObjectURL(file),
                            });
                          }
                        }}
                        className="form-control"
                        style={{ borderRadius: "8px", height: "40px", paddingRight: "42px" }}
                      />
                      <input
                        id="editProfilePicCameraInput"
                        type="file"
                        accept="image/jpeg,image/*"
                        capture="environment"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const compressed = await compressImageFile(file);
                            setEditData({
                              ...editData,
                              profile_pic: compressed,
                              profile_pic_preview: URL.createObjectURL(compressed),
                            });
                            toast.success(getTranslation("Camera photo captured! / कैमरे से फ़ोटो ली गई!", lang));
                          } catch {
                            setEditData({
                              ...editData,
                              profile_pic: file,
                              profile_pic_preview: URL.createObjectURL(file),
                            });
                          }
                        }}
                        style={{ display: "none" }}
                      />
                      <label
                        htmlFor="editProfilePicCameraInput"
                        className="d-flex align-items-center justify-content-center"
                        style={{
                          position: "absolute",
                          right: "6px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          cursor: "pointer",
                          width: "28px",
                          height: "28px",
                          borderRadius: "6px",
                          background: "#e6f4ea",
                          border: "1px solid #bbf7d0",
                          margin: 0,
                          zIndex: 2,
                        }}
                        title={getTranslation("Take profile photo with camera / कैमरे से प्रोफ़ाइल फ़ोटो लें", lang)}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1E6554" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                          <circle cx="12" cy="13" r="4"></circle>
                        </svg>
                      </label>
                    </div>
                  </div>
                  {editData.profile_pic && (
                    <small className="text-success d-block mt-1">
                      ✓ {getTranslation("Selected file / चयनित फ़ाइल", lang)}: {editData.profile_pic.name}
                    </small>
                  )}
                </div>

                {/* Admission Form Upload — Multiple JPG / JPEG / PDF + Camera */}
                <div className="col-md-6">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <Label className="form-label fw-semibold text-dark mb-0" style={{ fontSize: "13px" }}>
                      {getTranslation("Update Admission Form (Multiple JPG / JPEG / PDF) / प्रवेश फॉर्म अपडेट करें", lang)}
                    </Label>
                    {editData.admission_form_url && (
                      <a
                        href={editData.admission_form_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary text-decoration-none"
                        style={{ fontSize: "12px", fontWeight: "500" }}
                      >
                        📄 {getTranslation("View Current File / वर्तमान फ़ाइल देखें", lang)}
                      </a>
                    )}
                  </div>
                  <div className="position-relative" style={{ display: "flex", alignItems: "center" }}>
                    <Input
                      id="editAdmissionFormInput"
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.pdf,image/jpeg,application/pdf"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length === 0) return;
                        const added = [];
                        for (const f of files) {
                          const { item } = await processSingleAdmissionFile(f);
                          if (item) added.push(item);
                        }
                        if (added.length > 0) {
                          setEditData((prev) => ({
                            ...prev,
                            admission_form_file: added[0].file,
                            admission_form_files: [...(prev.admission_form_files || []), ...added],
                          }));
                        }
                        e.target.value = "";
                      }}
                      className="form-control"
                      style={{ borderRadius: "8px", height: "40px", paddingRight: "42px" }}
                    />
                    <input
                      id="editAdmissionFormCameraInput"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const { item } = await processSingleAdmissionFile(file);
                        if (item) {
                          setEditData((prev) => ({
                            ...prev,
                            admission_form_file: item.file,
                            admission_form_files: [...(prev.admission_form_files || []), item],
                          }));
                        }
                        e.target.value = "";
                      }}
                      style={{ display: "none" }}
                    />
                    <label
                      htmlFor="editAdmissionFormCameraInput"
                      className="d-flex align-items-center justify-content-center"
                      style={{
                        position: "absolute",
                        right: "6px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        cursor: "pointer",
                        width: "28px",
                        height: "28px",
                        borderRadius: "6px",
                        background: "#e6f4ea",
                        border: "1px solid #bbf7d0",
                        margin: 0,
                        zIndex: 2,
                      }}
                      title={getTranslation("Capture admission form with camera / कैमरे से फ़ोटो लें", lang)}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1E6554" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                        <circle cx="12" cy="13" r="4"></circle>
                      </svg>
                    </label>
                  </div>
                  {Array.isArray(editData.admission_form_files) && editData.admission_form_files.length > 0 && (
                    <div className="d-flex flex-wrap gap-1 mt-2">
                      {editData.admission_form_files.map((f, idx) => (
                        <span
                          key={idx}
                          className="badge bg-light text-dark border d-inline-flex align-items-center gap-1 px-2 py-1"
                          style={{ fontSize: "11.5px", fontWeight: "500" }}
                        >
                          {f.isPdf ? "📄" : "🖼️"} {f.name}
                          <button
                            type="button"
                            onClick={() =>
                              setEditData((prev) => {
                                const updated = (prev.admission_form_files || []).filter((_, i) => i !== idx);
                                return {
                                  ...prev,
                                  admission_form_files: updated,
                                  admission_form_file: updated[0]?.file || null,
                                };
                              })
                            }
                            className="btn btn-sm p-0 ms-1 text-danger border-0 bg-transparent"
                            style={{ fontSize: "12px", lineHeight: 1 }}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Additional Contacts */}
                <div className="col-12">
                  <div className="p-3 bg-light rounded-3 border" style={{ borderRadius: "10px" }}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <Label className="form-label fw-semibold text-dark mb-0" style={{ fontSize: "13px" }}>
                        {getTranslation("Additional Relative Contacts / अतिरिक्त संबंधी संपर्क", lang)}
                      </Label>
                      <Button
                        color="secondary"
                        type="button"
                        size="sm"
                        onClick={addEditRelativeContact}
                        style={{ borderRadius: "6px", fontSize: "12px" }}
                      >
                        {getTranslation("+ Add Contact / + संपर्क जोड़ें", lang)}
                      </Button>
                    </div>

                    {(editData.relative_contacts || []).map((contact, index) => (
                      <div className="bg-white p-2 mb-2 rounded border" key={index} style={{ borderRadius: "8px" }}>
                        <div className="row g-2 align-items-center">
                          <div className="col-md-4 col-sm-6">
                            <Input
                              type="text"
                              placeholder={getTranslation("Contact Name / नाम", lang)}
                              value={contact.name}
                              onChange={(e) =>
                                handleEditRelativeContactChange(index, "name", e.target.value)
                              }
                              className="form-control"
                              style={{ borderRadius: "6px", height: "36px", fontSize: "13px" }}
                            />
                          </div>
                          <div className="col-md-4 col-sm-6">
                            <Input
                              type="text"
                              placeholder={getTranslation("Phone Number / फ़ोन", lang)}
                              value={contact.phone}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (/^\d{0,10}$/.test(val)) {
                                  handleEditRelativeContactChange(index, "phone", val);
                                }
                              }}
                              maxLength={10}
                              className="form-control"
                              style={{ borderRadius: "6px", height: "36px", fontSize: "13px" }}
                            />
                          </div>
                          <div className="col-md-3 col-sm-8 d-flex align-items-center">
                            <div className="form-check form-switch d-flex align-items-center gap-2 m-0">
                              <Input
                                type="checkbox"
                                id={`edit-contact-wa-${index}`}
                                checked={!!contact.is_whatsapp}
                                onChange={(e) => {
                                  const isChecked = e.target.checked;
                                  handleEditRelativeContactChange(index, "is_whatsapp", isChecked);
                                  if (isChecked) {
                                    toast.success(
                                      getTranslation(
                                        `WhatsApp enabled for ${contact.name || "Relative"} (${contact.phone || "Number"}) / व्हाट्सएप संचार सक्षम किया गया`,
                                        lang
                                      ),
                                      { autoClose: 2500 }
                                    );
                                  } else {
                                    toast.info(
                                      getTranslation(
                                        `WhatsApp disabled for ${contact.name || "Relative"} / व्हाट्सएप संचार अक्षम किया गया`,
                                        lang
                                      ),
                                      { autoClose: 2000 }
                                    );
                                  }
                                }}
                                role="switch"
                                className="form-check-input cursor-pointer"
                                style={{ cursor: "pointer", width: "36px", height: "18px" }}
                              />
                              <Label
                                htmlFor={`edit-contact-wa-${index}`}
                                className={`form-check-label mb-0 small cursor-pointer fw-semibold ${
                                  contact.is_whatsapp ? "text-success" : "text-muted"
                                }`}
                                style={{ fontSize: "12px" }}
                              >
                                {contact.is_whatsapp
                                  ? getTranslation("✓ WhatsApp Enabled / व्हाट्सएप सक्रिय", lang)
                                  : getTranslation("WhatsApp? / व्हाट्सएप?", lang)}
                              </Label>
                            </div>
                          </div>
                          <div className="col-md-1 col-sm-4 text-end">
                            {editData.relative_contacts.length > 1 && (
                              <Button
                                color="danger"
                                outline
                                type="button"
                                size="sm"
                                className="w-100"
                                onClick={() => removeEditRelativeContact(index)}
                                style={{ borderRadius: "6px", height: "36px", padding: "0" }}
                                title={getTranslation("Remove / हटाएं", lang)}
                              >
                                ✕
                              </Button>
                            )}
                          </div>
                        </div>

                        {contact.is_whatsapp && (
                          <div className="mt-1 pt-1 border-top d-flex align-items-center gap-1 text-success" style={{ fontSize: "11px" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.058-2.127-.53-1.62-.667-2.668-2.316-2.75-2.423-.081-.107-.655-.873-.655-1.666 0-.793.415-1.183.562-1.343.148-.16.323-.2.431-.2.108 0 .216.002.31.007.099.006.232-.038.363.277.135.323.461 1.127.502 1.209.041.082.069.178.014.287-.054.108-.082.176-.163.271-.082.096-.172.214-.246.287-.082.082-.167.171-.072.334.095.163.422.697.906 1.127.623.555 1.148.728 1.311.809.163.082.259.072.355-.04.096-.111.411-.479.521-.643.11-.164.219-.137.367-.082.148.055.938.442 1.1.523.162.082.27.122.31.19.04.068.04.394-.104.799z"/>
                            </svg>
                            <span>
                              {getTranslation(
                                "Patient progress & emergency updates will also be shared to this WhatsApp number. / रोगी की प्रगति और आपातकालीन अपडेट इस व्हाट्सएप नंबर पर भी साझा किए जाएंगे।",
                                lang
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Relative Address */}
                <div className="col-md-6">
                  <VoiceTextarea
                    label={<Translated text={getTranslation("Patient Relative Address / रोगी के संबंधी का पता", lang)} />}
                    value={editData.relativeaddress}
                    onChange={(e) =>
                      setEditData({ ...editData, relativeaddress: e.target.value })
                    }
                  />
                </div>

                {/* Patient Address */}
                <div className="col-md-6">
                  <VoiceTextarea
                    label={<Translated text={getTranslation("Patient Address / रोगी का पता", lang)} />}
                    value={editData.address}
                    onChange={(e) =>
                      setEditData({ ...editData, address: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="d-flex justify-content-end gap-2 pt-4 mt-4 border-top">
                <Button
                  color="primary"
                  type="submit"
                  disabled={isLoading}
                  style={{
                    borderRadius: "8px",
                    backgroundColor: "#d56337",
                    borderColor: "#d56337",
                    fontWeight: "600",
                    padding: "8px 24px",
                    minWidth: "160px",
                  }}
                >
                  {isLoading ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  ) : (
                    getTranslation("Update Patient Data / डेटा अपडेट करें", lang)
                  )}
                </Button>
              </div>
            </Form>
          </div>
        )}
      </CommonModal>
      {/* Update form data JSX code end */}

      {/* Readmission / Re-register modal: pre-fills current date, patient name, gender, email, phone, DOB; all other fields start empty */}
      <CommonModal
        isOpen={reregisterModal}
        title={getTranslation("Patient Re-Admission Form / रोगी पुन: प्रवेश फॉर्म", lang)}
        toggler={closeUserViewModal}
        maxWidth="1100px"
      >
        {reregisterModal && (
          <div className="p-3 p-md-4" style={{ backgroundColor: "#ffffff" }}>
            <Form noValidate onSubmit={handleReRegister}>
              <div className="row g-3">
                {/* Date of Admission (Current Date) */}
                <div className="col-md-6">
                  <Label className="form-label fw-semibold text-dark mb-1" style={{ fontSize: "13px" }}>
                    <Translated text={dateOfAdmission} /> <span className="text-danger">*</span>
                  </Label>
                  <div>
                    <DatePicker
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      className="form-control"
                      style={{ borderRadius: "8px", height: "40px" }}
                      selected={safeDate(reregFormData.date_of_admission)}
                      onChange={(date) =>
                        setReregFormData((prev) => ({ ...prev, date_of_admission: date }))
                      }
                      dateFormat="yyyy/MM/dd"
                    />
                  </div>
                </div>

                {/* Patient Name (Pre-filled) */}
                <div className="col-md-6">
                  <Label className="form-label fw-semibold text-dark mb-1" style={{ fontSize: "13px" }}>
                    <Translated text={patientName} /> <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={reregFormData.patientName}
                    onChange={(e) =>
                      setReregFormData((prev) => ({ ...prev, patientName: e.target.value }))
                    }
                    placeholder={getTranslation("Enter Patient Name / मरीज़ का नाम दर्ज करें", lang)}
                    className="form-control"
                    style={{ borderRadius: "8px", height: "40px" }}
                  />
                </div>

                {/* Patient Relative Name (Empty on Readmission, Mandatory) */}
                <div className="col-md-6">
                  <Label className="form-label fw-semibold text-dark mb-1" style={{ fontSize: "13px" }}>
                    <Translated text={patientRelativeName} /> <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={reregFormData.patientRelativeName}
                    onChange={(e) =>
                      setReregFormData((prev) => ({ ...prev, patientRelativeName: e.target.value }))
                    }
                    placeholder={getTranslation("Enter Relative Name / रिश्तेदार का नाम दर्ज करें", lang)}
                    className="form-control"
                    style={{ borderRadius: "8px", height: "40px" }}
                  />
                </div>

                {/* Gender (Pre-filled) */}
                <div className="col-md-6">
                  <Label className="form-label fw-semibold text-dark mb-1 d-block" style={{ fontSize: "13px" }}>
                    <Translated text={patientSex} /> <span className="text-danger">*</span>
                  </Label>
                  <div className="d-flex align-items-center gap-3" style={{ height: "40px" }}>
                    {["Male", "Female", "Other"].map((g) => (
                      <div key={g} className="form-check form-check-inline m-0">
                        <Input
                          type="radio"
                          id={`rereg-gender-${g}`}
                          name="rereg-gender"
                          value={g}
                          checked={reregFormData.gender === g}
                          onChange={() =>
                            setReregFormData((prev) => ({ ...prev, gender: g }))
                          }
                          className="form-check-input"
                        />
                        <Label for={`rereg-gender-${g}`} className="form-check-label ms-1" style={{ cursor: "pointer", fontSize: "14px" }}>
                          {g}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Relation with Patient (Empty on Readmission, Mandatory) */}
                <div className="col-md-6">
                  <Label className="form-label fw-semibold text-dark mb-1" style={{ fontSize: "13px" }}>
                    {getTranslation("Relation with Patient / रोगी से संबंध", lang)} <span className="text-danger">*</span>
                  </Label>
                  <select
                    className="form-select"
                    value={reregFormData.relation_with_patient}
                    onChange={(e) =>
                      setReregFormData((prev) => ({ ...prev, relation_with_patient: e.target.value }))
                    }
                    style={{ borderRadius: "8px", height: "40px", fontSize: "13.5px" }}
                  >
                    <option value="">{getTranslation("Select Relation / संबंध चुनें", lang)}</option>
                    <option value="Father">{getTranslation("Father / पिता", lang)}</option>
                    <option value="Mother">{getTranslation("Mother / माता", lang)}</option>
                    <option value="Brother">{getTranslation("Brother / भाई", lang)}</option>
                    <option value="Sister">{getTranslation("Sister / बहन", lang)}</option>
                    <option value="Spouse">{getTranslation("Spouse (Husband/Wife) / पति/पत्नी", lang)}</option>
                    <option value="Son">{getTranslation("Son / बेटा", lang)}</option>
                    <option value="Daughter">{getTranslation("Daughter / बेटी", lang)}</option>
                    <option value="Friend">{getTranslation("Friend / मित्र", lang)}</option>
                    <option value="Guardian">{getTranslation("Guardian / अभिभावक", lang)}</option>
                    <option value="Uncle">{getTranslation("Uncle / चाचा/मामा", lang)}</option>
                    <option value="Aunt">{getTranslation("Aunt / चाची/मामी", lang)}</option>
                    <option value="Cousin">{getTranslation("Cousin / चचेरा/ममेरा भाई/बहन", lang)}</option>
                    <option value="Self">{getTranslation("Self / स्वयं", lang)}</option>
                    <option value="Other Relative">{getTranslation("Other Relative / अन्य रिश्तेदार", lang)}</option>
                    <option value="Other">{getTranslation("Other / अन्य", lang)}</option>
                  </select>
                </div>

                {/* DOB (Pre-filled) */}
                <div className="col-md-6">
                  <Label className="form-label fw-semibold text-dark mb-1" style={{ fontSize: "13px" }}>
                    <Translated text={patientDateOfBirth} /> <span className="text-danger">*</span>
                  </Label>
                  <div>
                    <DatePicker
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      className="form-control"
                      style={{ borderRadius: "8px", height: "40px" }}
                      selected={safeDate(reregFormData.dob)}
                      onChange={(date) =>
                        setReregFormData((prev) => ({ ...prev, dob: date }))
                      }
                      dateFormat="yyyy/MM/dd"
                    />
                  </div>
                </div>

                {/* Primary Phone (Pre-filled) */}
                <div className="col-md-6">
                  <Label className="form-label fw-semibold text-dark mb-1" style={{ fontSize: "13px" }}>
                    <Translated text={patientRelativePhoneNumber} /> <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={reregFormData.phone}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d{0,10}$/.test(val)) {
                        setReregFormData((prev) => ({
                          ...prev,
                          phone: val,
                          whatsapp_no: prev.sameAsPrimaryPhone ? val : prev.whatsapp_no,
                        }));
                      }
                    }}
                    maxLength={10}
                    className="form-control"
                    style={{ borderRadius: "8px", height: "40px" }}
                  />
                </div>

                {/* WhatsApp Mobile (Empty on Readmission + Same as Primary Phone checkbox) */}
                <div className="col-md-6">
                  <div className="d-flex justify-content-between align-items-center mb-1 flex-wrap gap-1">
                    <Label className="form-label fw-semibold text-dark mb-0" style={{ fontSize: "13px" }}>
                      {getTranslation("Mobile number for WhatsApp / व्हाट्सएप के लिए मोबाइल नंबर", lang)}
                      <span className="text-muted fw-normal ms-1" style={{ fontSize: "12px" }}>
                        ({getTranslation("Optional / वैकल्पिक", lang)})
                      </span>
                    </Label>
                    <div className="form-check m-0 p-0 d-inline-flex align-items-center gap-1">
                      <Input
                        type="checkbox"
                        id="reregSameAsPrimaryPhoneCheck"
                        checked={reregFormData.sameAsPrimaryPhone}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setReregFormData((prev) => ({
                            ...prev,
                            sameAsPrimaryPhone: checked,
                            whatsapp_no: checked ? prev.phone || "" : prev.whatsapp_no,
                          }));
                        }}
                        className="form-check-input m-0"
                      />
                      <Label
                        for="reregSameAsPrimaryPhoneCheck"
                        className="form-check-label text-primary mb-0"
                        style={{ fontSize: "12px", cursor: "pointer", fontWeight: "600" }}
                      >
                        {getTranslation("Same as Patient Primary Phone Number", lang)}
                      </Label>
                    </div>
                  </div>
                  <Input
                    type="text"
                    value={reregFormData.whatsapp_no}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d{0,10}$/.test(val)) {
                        setReregFormData((prev) => ({
                          ...prev,
                          whatsapp_no: val,
                          sameAsPrimaryPhone: val === prev.phone ? prev.sameAsPrimaryPhone : false,
                        }));
                      }
                    }}
                    placeholder={getTranslation("Enter 10-digit WhatsApp Number / व्हाट्सएप नंबर", lang)}
                    maxLength={10}
                    className="form-control"
                    style={{ borderRadius: "8px", height: "40px" }}
                  />
                </div>

                {/* Secondary Phone (Empty on Readmission) */}
                <div className="col-md-6">
                  <Label className="form-label fw-semibold text-dark mb-1" style={{ fontSize: "13px" }}>
                    {getTranslation("Patient Secondary Phone Number / द्वितीयक फ़ोन नंबर", lang)}
                    <span className="text-muted fw-normal ms-1" style={{ fontSize: "12px" }}>
                      ({getTranslation("Optional / वैकल्पिक", lang)})
                    </span>
                  </Label>
                  <Input
                    type="text"
                    value={reregFormData.secondary_phone}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d{0,10}$/.test(val)) {
                        setReregFormData((prev) => ({ ...prev, secondary_phone: val }));
                      }
                    }}
                    placeholder={getTranslation("Enter 10-digit Secondary Phone (Optional)", lang)}
                    maxLength={10}
                    className="form-control"
                    style={{ borderRadius: "8px", height: "40px" }}
                  />
                </div>

                {/* Email (Pre-filled, Optional) */}
                <div className="col-md-6">
                  <Label className="form-label fw-semibold text-dark mb-1" style={{ fontSize: "13px" }}>
                    <Translated text={patientRelativeEmailAddr} />
                    <span className="text-muted fw-normal ms-1" style={{ fontSize: "12px" }}>
                      ({getTranslation("Optional / वैकल्पिक", lang)})
                    </span>
                  </Label>
                  <Input
                    type="email"
                    value={reregFormData.email}
                    onChange={(e) =>
                      setReregFormData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder={getTranslation("Enter Email Address (Optional)", lang)}
                    className="form-control"
                    style={{ borderRadius: "8px", height: "40px" }}
                  />
                </div>

                {/* Ward Details */}
                <div className="col-12">
                  <Label className="form-label fw-semibold text-dark mb-1" style={{ fontSize: "13px" }}>
                    <Translated text={wardDetails} /> <span className="text-danger">*</span>
                  </Label>
                  <div className="d-flex align-items-center flex-wrap gap-3 py-1">
                    {(wardList && wardList.length > 0 ? wardList : wardOptions).map((option) => {
                      const optId = option.ward_type_id || option.id;
                      const optName = option.ward_name || option.name;
                      return (
                        <div key={optId} className="form-check form-check-inline m-0">
                          <Input
                            type="radio"
                            id={`rereg-wards-${optId}`}
                            name="rereg-ward"
                            value={optName}
                            checked={String(reregFormData.ward_type_id) === String(optId)}
                            onChange={() =>
                              setReregFormData((prev) => ({
                                ...prev,
                                ward_type_id: optId,
                                ward_name: optName,
                              }))
                            }
                            className="form-check-input"
                          />
                          <Label for={`rereg-wards-${optId}`} className="form-check-label ms-1 cursor-pointer">
                            {optName}
                            {(option.original_amount ?? option.price_rate ?? option.ward_amount) ? (
                              <span className="text-muted small ms-1">
                                (₹{Number(option.original_amount ?? option.price_rate ?? option.ward_amount).toLocaleString("en-IN")})
                              </span>
                            ) : null}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Upload Patient Profile Image (Empty on Readmission, Mandatory) */}
                <div className="col-md-6">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <Label className="form-label fw-semibold text-dark mb-0" style={{ fontSize: "13px" }}>
                      {getTranslation("Upload Patient Profile Image / रोगी प्रोफ़ाइल छवि अपलोड करें", lang)}{" "}
                      <span className="text-danger">*</span>
                    </Label>
                    <span className="text-muted" style={{ fontSize: "11px" }}>
                      JPG / JPEG / PDF + Camera
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    {reregPreview && (
                      <img
                        src={reregPreview}
                        alt="Preview"
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "2px solid #1E6554",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <div className="position-relative flex-grow-1" style={{ display: "flex", alignItems: "center" }}>
                      <Input
                        id="reregProfileInput"
                        type="file"
                        accept=".jpg,.jpeg,.pdf,image/jpeg,application/pdf"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
                          if (isPdf) {
                            setReregImage(file);
                            setReregPreview(null);
                            return;
                          }
                          try {
                            const compressed = await compressImageFile(file);
                            setReregImage(compressed);
                            setReregPreview(URL.createObjectURL(compressed));
                          } catch {
                            setReregImage(file);
                            setReregPreview(URL.createObjectURL(file));
                          }
                        }}
                        className="form-control"
                        style={{ borderRadius: "8px", height: "40px", paddingRight: "42px" }}
                      />
                      <input
                        id="reregProfileCameraInput"
                        type="file"
                        accept="image/jpeg,image/*"
                        capture="environment"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const compressed = await compressImageFile(file);
                            setReregImage(compressed);
                            setReregPreview(URL.createObjectURL(compressed));
                          } catch {
                            setReregImage(file);
                            setReregPreview(URL.createObjectURL(file));
                          }
                        }}
                        style={{ display: "none" }}
                      />
                      <label
                        htmlFor="reregProfileCameraInput"
                        className="d-flex align-items-center justify-content-center"
                        style={{
                          position: "absolute",
                          right: "6px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          cursor: "pointer",
                          width: "28px",
                          height: "28px",
                          borderRadius: "6px",
                          background: "#e6f4ea",
                          border: "1px solid #bbf7d0",
                          margin: 0,
                          zIndex: 2,
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1E6554" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                          <circle cx="12" cy="13" r="4"></circle>
                        </svg>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Upload Admission Form (Multiple JPG / JPEG / PDF, Empty on Readmission, Mandatory) */}
                <div className="col-md-6">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <Label className="form-label fw-semibold text-dark mb-0" style={{ fontSize: "13px" }}>
                      {getTranslation("Upload Admission Form (JPG / JPEG / PDF) / प्रवेश फ़ॉर्म अपलोड करें", lang)}{" "}
                      <span className="text-danger">*</span>
                    </Label>
                    <span className="text-muted" style={{ fontSize: "11px" }}>
                      Multiple JPG / JPEG / PDF
                    </span>
                  </div>
                  <div className="position-relative" style={{ display: "flex", alignItems: "center" }}>
                    <Input
                      id="reregAdmissionInput"
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.pdf,image/jpeg,application/pdf"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        const added = [];
                        for (const f of files) {
                          const { item } = await processSingleAdmissionFile(f);
                          if (item) added.push(item);
                        }
                        if (added.length > 0) {
                          setReregAdmissionFiles((prev) => [...prev, ...added]);
                        }
                        e.target.value = "";
                      }}
                      className="form-control"
                      style={{ borderRadius: "8px", height: "40px", paddingRight: "42px" }}
                    />
                    <input
                      id="reregAdmissionCameraInput"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const { item } = await processSingleAdmissionFile(file);
                        if (item) {
                          setReregAdmissionFiles((prev) => [...prev, item]);
                        }
                        e.target.value = "";
                      }}
                      style={{ display: "none" }}
                    />
                    <label
                      htmlFor="reregAdmissionCameraInput"
                      className="d-flex align-items-center justify-content-center"
                      style={{
                        position: "absolute",
                        right: "6px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        cursor: "pointer",
                        width: "28px",
                        height: "28px",
                        borderRadius: "6px",
                        background: "#e6f4ea",
                        border: "1px solid #bbf7d0",
                        margin: 0,
                        zIndex: 2,
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1E6554" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                        <circle cx="12" cy="13" r="4"></circle>
                      </svg>
                    </label>
                  </div>
                  {reregAdmissionFiles.length > 0 && (
                    <div className="d-flex flex-wrap gap-1 mt-2">
                      {reregAdmissionFiles.map((f, idx) => (
                        <span
                          key={idx}
                          className="badge bg-light text-dark border d-inline-flex align-items-center gap-1 px-2 py-1"
                          style={{ fontSize: "11.5px", fontWeight: "500" }}
                        >
                          {f.isPdf ? "📄" : "🖼️"} {f.name}
                          <button
                            type="button"
                            onClick={() =>
                              setReregAdmissionFiles((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="btn btn-sm p-0 ms-1 text-danger border-0 bg-transparent"
                            style={{ fontSize: "12px", lineHeight: 1 }}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Relative Address (Empty on Readmission) */}
                <div className="col-md-6">
                  <VoiceTextarea
                    label={
                      <span className="fw-semibold text-dark" style={{ fontSize: "13px" }}>
                        <Translated text={pateintRelativeAddress} />
                        <span className="text-muted fw-normal ms-1" style={{ fontSize: "12px" }}>
                          ({getTranslation("Optional / वैकल्पिक", lang)})
                        </span>
                      </span>
                    }
                    value={reregFormData.relativeaddress}
                    onChange={(e) =>
                      setReregFormData((prev) => ({
                        ...prev,
                        relativeaddress: e.target.value,
                        address: prev.sameAddress ? e.target.value : prev.address,
                      }))
                    }
                  />
                </div>

                {/* Patient Address (Empty on Readmission, Mandatory) */}
                <div className="col-md-6">
                  <VoiceTextarea
                    label={
                      <span className="fw-semibold text-dark" style={{ fontSize: "13px" }}>
                        <Translated text={pateintAddress} /> <span className="text-danger">*</span>
                      </span>
                    }
                    value={reregFormData.address}
                    onChange={(e) =>
                      setReregFormData((prev) => ({
                        ...prev,
                        address: e.target.value,
                        sameAddress: false,
                      }))
                    }
                  />
                </div>

                {/* Same as Patient Relative Address Checkbox */}
                <div className="col-12">
                  <div className="form-check">
                    <Input
                      type="checkbox"
                      id="reregSameAddressCheck"
                      className="form-check-input"
                      checked={reregFormData.sameAddress}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setReregFormData((prev) => ({
                          ...prev,
                          sameAddress: checked,
                          address: checked ? prev.relativeaddress : prev.address,
                        }));
                      }}
                    />
                    <Label for="reregSameAddressCheck" className="form-check-label ms-1" style={{ cursor: "pointer", fontSize: "13.5px" }}>
                      <Translated text="Same as Patient Relative Address" />
                    </Label>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 pt-4 mt-4 border-top">
                <Button
                  color="light"
                  type="button"
                  className="border fw-semibold px-4"
                  onClick={closeUserViewModal}
                  style={{ borderRadius: "8px" }}
                >
                  {getTranslation("Cancel / रद्द करें", lang)}
                </Button>
                <Button
                  color="primary"
                  type="submit"
                  disabled={isLoading}
                  style={{
                    borderRadius: "8px",
                    backgroundColor: "#d56337",
                    borderColor: "#d56337",
                    fontWeight: "600",
                    padding: "8px 24px",
                  }}
                >
                  {isLoading ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  ) : (
                    getTranslation("Re-Admission / पुन: प्रवेश", lang)
                  )}
                </Button>
              </div>
            </Form>
          </div>
        )}
      </CommonModal>
    </Fragment>
  );
}

export default Register;
