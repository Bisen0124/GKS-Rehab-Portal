import React, { Fragment, useState, useEffect, useRef } from "react";
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
  h4Text,
  patientRelativesecPhoneNumber,
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

import VoiceTextarea from "../VoiceTextarea/VoiceTextarea";

import { useReactToPrint } from "react-to-print";

function Register() {

  const { lang } = useLang(); // get current language from context
 
  //Download view data in PDF 
    const pdfRef = useRef();

  //Branches selection
  const { selectedBranch } = useBranch();
  const branchId =
    selectedBranch?.branch_id || selectedBranch?.id || selectedBranch || "";

  //spinner extract from other file
  const selectedSpinner = Data.find(
    (item) => item.spinnerClass === "loader-37"
  );

  //Patient file upload 
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // File type validation
    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed");
      return;
    }

    // File size validation (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("Image size must be less than 2MB");
      return;
    }

    setError("");
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  //Patient admission form (PDF) upload
  const [admissionForm, setAdmissionForm] = useState(null);
  const [admissionFormName, setAdmissionFormName] = useState("");
  const [admissionFormError, setAdmissionFormError] = useState("");

  const handleAdmissionFormChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // File type validation - allow pdf/image
    if (
      file.type !== "application/pdf" &&
      !file.type.startsWith("image/")
    ) {
      setAdmissionFormError("Only PDF or image files are allowed");
      return;
    }

    // File size validation (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAdmissionFormError("File size must be less than 5MB");
      return;
    }

    setAdmissionFormError("");
    setAdmissionForm(file);
    setAdmissionFormName(file.name);
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
    relative_contacts: [{ name: "", phone: "" }],
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

  //Handle patient relative additional contacts (name + phone pairs)
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
      relative_contacts: [...prev.relative_contacts, { name: "", phone: "" }],
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
        label: getTranslation("Patient Relative Primary Phone Number / संबंधी का प्राथमिक फ़ोन नंबर", lang),
        value: formData.phone,
      },
      {
        label: getTranslation("Mobile number for WhatsApp/SMS communication / व्हाट्सएप/एसएमएस संचार के लिए मोबाइल नंबर", lang),
        value: formData.whatsapp_no,
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
        label: getTranslation("Patient Relative Address / रोगी के संबंधी का पता", lang),
        value: formData.relativeaddress,
      },
      {
        label: getTranslation("Patient Address / रोगी का पता", lang),
        value: formData.address,
      },
    ];

    const missingFields = [];

    for (const field of compulsoryFieldDefinitions) {
      const val = field.value;
      const isEmpty =
        val === null ||
        val === undefined ||
        (typeof val === "string" && val.trim() === "") ||
        (typeof val === "number" && isNaN(val));

      if (isEmpty) {
        missingFields.push(field.label);
      }
    }

    if (missingFields.length > 0) {
      const missingListHtml = `<div style="text-align: left; margin-top: 10px; font-size: 14px;"><p style="margin-bottom: 8px; font-weight: 600;">${getTranslation(
        "Please fill the following compulsory field(s): / कृपया निम्नलिखित अनिवार्य फ़ील्ड भरें:",
        lang
      )}</p><ul style="padding-left: 20px; margin-bottom: 0; line-height: 1.6;">${missingFields
        .map((f) => `<li>${f}</li>`)
        .join("")}</ul></div>`;

      Swal.fire({
        icon: "warning",
        title: getTranslation(
          "Required field(s) missing! / आवश्यक फ़ील्ड खाली हैं!",
          lang
        ),
        html: missingListHtml,
        confirmButtonText: getTranslation("OK / ठीक है", lang),
      });
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
      !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)
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
  
    setIsLoading(true);
  
    const formatDate = (date) => {
      return date instanceof Date && !isNaN(date.getTime())
        ? date.toISOString().split("T")[0]
        : date || "";
    };
  
    try {
      const branch_id = branchId;
      const token = localStorage.getItem("Authorization");
  
      // ✅ Create FormData instead of JSON
      const payload = new FormData();
  
      payload.append("date_of_admission", formatDate(formData.date_of_admission));
      payload.append("name", formData.patientName);
      payload.append("email", formData.email);
      payload.append("relative_name", formData.patientRelativeName);
      payload.append("phone", formData.phone);
      payload.append("gender", formData.gender);
      payload.append("dob", formatDate(formData.dob));
      payload.append("address", formData.address);
      payload.append("password", formData.password);
      payload.append("whatsapp_no", formData.whatsapp_no || "");
      payload.append("isRole", 4);
      payload.append("ward_type_id", formData.ward_type_id || "");
      payload.append("ward_name", formData.ward_name || "");
      payload.append("secondary_phone", formData.secondary_phone || "");
  
      // ✅ New fields (send empty if not available)
      const cleanedRelativeContacts = formData.relative_contacts.filter(
        (c) => (c.name && c.name.trim()) || (c.phone && c.phone.trim())
      );
      payload.append("relative_contacts", JSON.stringify(cleanedRelativeContacts));
      payload.append("relative_address", formData.relativeaddress || "");
      payload.append("relation_with_patient", formData.relation_with_patient || "");
  
      // ✅ File uploads
      if (image) {
        payload.append("profile_pic", image);
      } else {
        payload.append("profile_pic", ""); // optional
      }
  
      if (admissionForm) {
        payload.append("admission_form_url", admissionForm);
      } else {
        payload.append("admission_form_url", ""); // optional
      }
  
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/users?branch_id=${branch_id}`,
        {
          method: "POST",
          headers: {
            Authorization: `${token}`, // ❗ DO NOT set Content-Type manually
          },
          body: payload,
        }
      );
  
      const result = await response.json();
  
      if (!response.ok) {
        if (result.error === "Email already exists") {
          Swal.fire({
            icon: "warning",
            title: getTranslation(
              "Email is already exists/ईमेल पहले से मौजूद है",
              lang
            ),
          });
        } else if (
          result.error ===
          getTranslation(
            "Phone number already exists/फ़ोन नंबर पहले से मौजूद है",
            lang
          )
        ) {
          Swal.fire({
            icon: "warning",
            title: getTranslation(
              "Phone is already exist/फ़ोन पहले से मौजूद है",
              lang
            ),
          });
        } else {
          Swal.fire({
            icon: "error",
            title: getTranslation("Registration Failed / पंजीकरण विफल", lang),
            text: result.message || result.error || getTranslation("Server error/सर्वर त्रुटि", lang),
          });
        }
      } else {
        Swal.fire({
          title: getTranslation("Good job!/अच्छा काम!", lang),
          text: getTranslation("Registration successful!/सफल पंजीकरण!", lang),
          icon: "success",
        }).then(() => {
          clearDraft("patient_registration", "new");
          setDraftTimestamp(null);
          setModal(false);
  
          // ✅ Reset form including files
          setFormData(initialFormData);
          setPasswordError("");
          setEmailError("");
  
          // ✅ Reset file upload states too
          setImage(null);
          setPreview(null);
          setAdmissionForm(null);
          setAdmissionFormName("");
  
          fetchUsers();
        });
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      alert(
        getTranslation(
          "Registration failed! Unknown error./पंजीकरण विफल! अज्ञात त्रुटि.",
          lang
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  //Modal - register
  const [modal, setModal] = useState(false);
  const [draftTimestamp, setDraftTimestamp] = useState(null);
  const toggle = () => {
    if (!modal) {
      const saved = loadDraft("patient_registration", "new");
      if (saved && saved.data) {
        setFormData(saved.data);
        setDraftTimestamp(saved.savedAt);
      }
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

    // Set state immediately so modal opens with loading screen
    setSelectedUserId(userId);
    setSelectedUser(null);
    setViewModal(true);
    setIsLoading(true);

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
    } finally {
      setIsLoading(false);
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

  //handle re-register user based on discahrge status
  const [reregisterModal, setreregisterModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  //getting user_Id for re-registering
  const handleReregisterUserID = async (user) => {
    const userId = typeof user === "object" && user !== null ? user.id : user;
    if (!userId) return;

    setSelectedUserId(userId); // store user ID
    setreregisterModal(true); // open modal

    // alert(selectedUserId);
  };

  //It check if discharge status true then re-register user will perform and send userId, ward name and ward type id to backend
  const handleReRegister = async (e) => {
    e.preventDefault(); // prevent default form submission
    setIsLoading(true); // Set loading to true when the update starts
    if (!selectedUserId) {
      console.error("No user selected for re-registration");
      return;
    }

    const payload = {
      user_id: selectedUserId,
      ward_type_id: formData.ward_type_id,
      ward_name: formData.ward_name,
    };

    try {
      const branch_id = branchId;
      const token = localStorage.getItem("Authorization");
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/ipd/create-entry?branch_id=${branch_id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      console.log("Re-Registration payload data: ", result);

      if (response.ok) {
        await Swal.fire({
          title: getTranslation("Success!/सफलता!",lang),
          text: getTranslation("Re-Registration has been successful!/पुनः पंजीकरण सफल रहा!",lang),
          icon: "success",
          confirmButtonText: getTranslation("OK/ठीक है",lang),
        });
        setreregisterModal(false); // Close modal only after success
      } else if (
        result.error ===
       getTranslation( "User is not eligible for readmission. Please check discharge status and dates./उपयोगकर्ता पुनः प्रवेश के लिए पात्र नहीं है। कृपया डिस्चार्ज स्थिति और तिथियाँ जाँच लें।",lang)
      ) {
        await Swal.fire({
          title: getTranslation("User Not Eligible/उपयोगकर्ता योग्य नहीं है",lang),
          text: getTranslation("User is not eligible for re-admission. Please check the discharge status and dates./उपयोगकर्ता पुनः प्रवेश के लिए पात्र नहीं है। कृपया डिस्चार्ज स्थिति और तिथियाँ जाँच लें।",lang),
          icon: "warning",
          confirmButtonText: getTranslation("OK/ठीक है",lang),
        });
        setreregisterModal(false); // Keep modal open
      } else {
        console.error("Unhandled error:", result?.error || result?.message);
        // No alert shown for other errors, just log it
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      // No alert shown here either, per your request
    } finally {
      setIsLoading(false); // Set loading to false after the request is complete
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
        parsedRelativeContacts = [{ name: "", phone: "" }];
      }

      // Handle null/undefined safely and set editData
      setEditData({
        id: user.user_id || "",
        name: user.name || "",
        patientRelativeName: user.relative_name || "",
        dob: user.dob ? parseDateString(user.dob) : "",
        email: user.email || "",
        phone: user.phone || "",
        secondary_phone: user.secondary_phone || "",
        whatsapp_no: user.whatsapp_no || "",
        isWhatsApp: user.isWhatsApp || false,
        address: user.address || "",
        relativeaddress: user.relative_address || "",
        relation_with_patient: user.relation_with_patient || "",
        relative_contacts: parsedRelativeContacts,
        // is_role: user.isRole || "",
        is_role: Number(user.isRole) || "",
        password: "",
        gender: user.gender || "",
        profile_pic_url: user.profile_pic || "",
        admission_form_url: user.admission_form_url || user.admission_form || "",
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
      relative_contacts: [...(prev.relative_contacts || []), { name: "", phone: "" }],
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

    // Make sure you match your form fields to the API payload structure
    const cleanedEditContacts = (editData.relative_contacts || []).filter(
      (c) => (c.name && c.name.trim()) || (c.phone && c.phone.trim())
    );

    const updatedData = new FormData();
    updatedData.append("name", editData.name || "");
    updatedData.append("relative_name", editData.patientRelativeName || "");
    updatedData.append("email", editData.email || "");
    updatedData.append("gender", editData.gender || "");
    updatedData.append("address", editData.address || "");
    updatedData.append("dob", formatDate(editData.dob));
    updatedData.append("phone", editData.phone || "");
    updatedData.append("secondary_phone", editData.secondary_phone || "");
    updatedData.append("whatsapp_no", editData.whatsapp_no || "");
    updatedData.append("isRole", editData.is_role || "");
    updatedData.append("relative_address", editData.relativeaddress || "");
    updatedData.append("relation_with_patient", editData.relation_with_patient || "");
    updatedData.append("relative_contacts", JSON.stringify(cleanedEditContacts));

    if (editData.profile_pic instanceof File) {
      updatedData.append("profile_pic", editData.profile_pic);
    }

    if (editData.admission_form_file instanceof File) {
      updatedData.append("admission_form_url", editData.admission_form_file);
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
      } else {
        const errorData = await response.json();
        // Show error SweetAlert
        Swal.fire({
          title: getTranslation("Failed to update user/उपयोगकर्ता अपडेट करने में विफल",lang),
          text: errorData.message || "Unknown error occurred",
          icon: "error",
          confirmButtonText: getTranslation("OK/ठीक है",lang),
        });
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

  //User data table data
  const [data, setData] = useState([]);
  //Search filter on register datalist
  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState([]);

  // ✅ Fetching user data from API
  // ✅ Token outside useEffect so it's always accessible
  const token = localStorage.getItem("Authorization");

  // ✅ Step 1: Move this into a reusable function
  const [stillLoading, setstillLoading] = useState(true);
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
        const formatted = resData.data.map((user) => ({
          id: user.user_id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          gks_id: user.gks_id,
          discharge_status: user.discharge_status,
          discharge_status_text: user.discharge_status_text,
          is_readmission: user.is_readmission,
          recent_admit_date: user.recent_admit_date
            ? new Date(user.recent_admit_date).toLocaleDateString()
            : "N/A",
          recent_pfa_date: user.recent_pfa_date
            ? new Date(user.recent_pfa_date).toLocaleDateString()
            : "N/A",
          recent_gen_fam_date: user.recent_gen_fam_date
            ? new Date(user.recent_gen_fam_date).toLocaleDateString()
            : "N/A",
        }));

        setTimeout(() => {
          setData(formatted);
          setFilteredData(formatted);
          setstillLoading(false);
          console.log("data", data);
        }, 1000); // You can reduce the delay to 1s if 3s is too much
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        toast.error("Error fetching user data");
        setstillLoading(true);
      });
  };

  // ✅ Step 2: Run this once when component mounts
  useEffect(() => {
    fetchUsers();
  }, [branchId]);

  // ✅ Define table columns
  const tableColumns = [
    {
      // name: "GKS ID",
      name: `${getTranslation('GKS ID/GKS आईडी' , lang)}`,
      selector: (row) => row.gks_id,
      sortable: true,
      center: true,
    },
    { 
      name: `${getTranslation('Patient name/रोगी का नाम' , lang)}`,
      selector: (row) => row.name, sortable: true, center: true },
    {
      name: `${getTranslation('Phone/फोन' , lang)}`,
      selector: (row) => row.phone,
      sortable: true,
      center: true,
    },
    {
      name: `${getTranslation('Email/ईमेल' , lang)}`,
      selector: (row) => row.email,
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
        const mappedData = (entriesData.data || []).map((entry) => ({
          id: entry.user_id,
          gks_id: entry.gks_id,
          name: entry.name,
          email: entry.email,
          phone: entry.phone,
          wardName: entry.ward_name,
          // dischargeDate: entry.discharge_date
          //   ? new Date(entry.discharge_date).toLocaleDateString()
          //   : "Not Discharge yet",
          dischargeDate: entry.discharge_date ? (
            <span class="Discharge" style={{ color: "#28a745", fontWeight: "500" }}>
              {new Date(entry.discharge_date).toLocaleDateString()}
            </span>
          ) : (
            <span class="ntDischarge" style={{ color: "#dc3545", fontWeight: "500" }}>
              Not Discharge
            </span>
          ),
          
        }));

        setAllIPDData(mappedData); // keep the full data
        setFilteredIPDData(mappedData); // also show full data initially
        setstillLoading(false);
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

  // ✅ Define table columns
  const tableIPDColumns = [
    {
      name: `${getTranslation('GKS ID/GKS आईडी' , lang)}`,
      selector: (row) => row.gks_id,
      sortable: true,
      center: true,
    },
    { 
      name: `${getTranslation('Patient name/रोगी का नाम' , lang)}`,
      selector: (row) => row.name, sortable: true, center: true },
    {
      name: `${getTranslation('Phone/फोन' , lang)}`,
      selector: (row) => row.phone,
      sortable: true,
      center: true,
    },
    {
      name: `${getTranslation('Email/ईमेल' , lang)}`,
      selector: (row) => row.email,
      sortable: true,
      center: true,
    },
    {
      name: `${getTranslation('Ward Name/वार्ड का नाम' , lang)}`,
      selector: (row) => row.wardName,
      sortable: true,
      center: true,
    },
    {
      name: `${getTranslation('Discharge Date/डिस्चार्ज की तिथि' , lang)}`,
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

  //Print viewable form data handler
  const handlePrint = useReactToPrint({
    content: () => pdfRef.current,
    pageStyle: `
      @page { size: A4; margin: 12mm; }
      @media print {
        body { margin: 0; }
      }
    `,
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
          <Form onSubmit={handleSubmit}>
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

              {/* Patient Relative Name */}
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

              {/* Relation with Patient */}
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
                        ? "Please enter a valid email address"
                        : ""
                    );
                  }}
                  placeholder={getTranslation("Enter Email Address / ईमेल पता दर्ज करें", lang)}
                  className="form-control"
                  style={{ borderRadius: "8px", height: "40px" }}
                />
                {emailError && (
                  <small className="text-danger d-block mt-1">{emailError}</small>
                )}
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
                      setFormData({ ...formData, phone: value });
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

              {/* Mobile number for WhatsApp/SMS communication (Manual Input) */}
              <div className="col-md-6">
                <Label className="form-label fw-semibold text-dark mb-1" style={{ fontSize: "13px" }}>
                  {getTranslation("Mobile number for WhatsApp/SMS communication / व्हाट्सएप/एसएमएस संचार के लिए मोबाइल नंबर", lang)} <span className="text-danger">*</span>
                </Label>
                <Input
                  type="text"
                  name="whatsapp_no"
                  value={formData.whatsapp_no}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d{0,10}$/.test(value)) {
                      setFormData((prev) => ({ ...prev, whatsapp_no: value }));
                    }
                  }}
                  placeholder={getTranslation("Enter 10-digit WhatsApp/SMS Number / 10 अंकों का व्हाट्सएप/एसएमएस नंबर दर्ज करें", lang)}
                  maxLength={10}
                  className="form-control"
                  style={{ borderRadius: "8px", height: "40px" }}
                />
                {formData.whatsapp_no.length > 0 && formData.whatsapp_no.length !== 10 && (
                  <small className="text-danger d-block mt-1">
                    {getTranslation("WhatsApp/SMS number must be 10 digits. / व्हाट्सएप/एसएमएस नंबर 10 अंकों का होना चाहिए।", lang)}
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

              {/* Secondary Phone (Optional) */}
              <div className="col-md-6">
                <Label className="form-label fw-semibold text-dark mb-1" style={{ fontSize: "13px" }}>
                  <Translated text={patientRelativesecPhoneNumber} />
                  <span className="text-muted fw-normal ms-1" style={{ fontSize: "12px" }}>({getTranslation("Optional / वैकल्पिक", lang)})</span>
                </Label>
                <Input
                  type="text"
                  name="secondary_phone"
                  value={formData.secondary_phone}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d{0,10}$/.test(value)) {
                      setFormData({ ...formData, secondary_phone: value });
                    }
                  }}
                  placeholder={getTranslation("Secondary Phone Number / द्वितीयक फ़ोन नंबर", lang)}
                  maxLength={10}
                  className="form-control"
                  style={{ borderRadius: "8px", height: "40px" }}
                />
              </div>

              {/* Wards Details */}
              <div className="col-md-6">
                <Label className="form-label fw-semibold text-dark mb-1 d-block" style={{ fontSize: "13px" }}>
                  <Translated text={wardDetails} /> <span className="text-danger">*</span>
                </Label>
                <div className="d-flex align-items-center gap-3" style={{ height: "40px" }}>
                  {wardOptions.map((option) => (
                    <div key={option.ward_type_id} className="form-check form-check-inline m-0">
                      <Input
                        type="radio"
                        id={`wards-${option.ward_type_id}`}
                        name="ward"
                        value={option.ward_name}
                        checked={formData.ward_type_id === option.ward_type_id}
                        onChange={() =>
                          setFormData((prev) => ({
                            ...prev,
                            ward_type_id: option.ward_type_id,
                            ward_name: option.ward_name,
                          }))
                        }
                        className="form-check-input"
                      />
                      <Label for={`wards-${option.ward_type_id}`} className="form-check-label ms-1" style={{ cursor: "pointer", fontSize: "14px" }}>
                        {option.ward_name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Patient Photo Upload with Camera Icon */}
              <div className="col-md-6">
                <Label className="form-label fw-semibold text-dark mb-1" style={{ fontSize: "13px" }}>
                  {getTranslation("Upload Patient Profile Image / रोगी प्रोफ़ाइल छवि", lang)}
                  <span className="text-muted fw-normal ms-1" style={{ fontSize: "12px" }}>({getTranslation("Optional / वैकल्पिक", lang)})</span>
                </Label>
                <div className="d-flex align-items-center gap-2">
                  {preview && (
                    <img
                      src={preview}
                      alt="Preview"
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "2px solid #e2e8f0",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <div className="position-relative flex-grow-1">
                    <Input
                      id="patientPhotoInput"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageChange}
                      className="form-control"
                      style={{ borderRadius: "8px", height: "40px", paddingRight: "40px" }}
                    />
                    <label
                      htmlFor="patientPhotoInput"
                      className="position-absolute end-0 top-50 translate-middle-y me-2 mb-0 d-flex align-items-center justify-content-center"
                      style={{
                        cursor: "pointer",
                        width: "30px",
                        height: "30px",
                        borderRadius: "6px",
                        background: "#f1f5f9",
                        border: "1px solid #cbd5e1",
                        fontSize: "14px",
                      }}
                      title={getTranslation("Take or choose photo / फ़ोटो लें या चुनें", lang)}
                    >
                      📷
                    </label>
                  </div>
                </div>
                {error && <small className="text-danger d-block mt-1">{error}</small>}
              </div>

              {/* Admission Form Upload with Camera Icon */}
              <div className="col-md-6">
                <Label className="form-label fw-semibold text-dark mb-1" style={{ fontSize: "13px" }}>
                  {getTranslation("Upload Admission Form (PDF / Image) / प्रवेश फॉर्म अपलोड करें", lang)}
                  <span className="text-muted fw-normal ms-1" style={{ fontSize: "12px" }}>({getTranslation("Optional / वैकल्पिक", lang)})</span>
                </Label>
                <div className="position-relative">
                  <Input
                    id="admissionFormInput"
                    type="file"
                    accept="application/pdf,image/*"
                    capture="environment"
                    onChange={handleAdmissionFormChange}
                    className="form-control"
                    style={{ borderRadius: "8px", height: "40px", paddingRight: "40px" }}
                  />
                  <label
                    htmlFor="admissionFormInput"
                    className="position-absolute end-0 top-50 translate-middle-y me-2 mb-0 d-flex align-items-center justify-content-center"
                    style={{
                      cursor: "pointer",
                      width: "30px",
                      height: "30px",
                      borderRadius: "6px",
                      background: "#f1f5f9",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                    title={getTranslation("Capture or select document / दस्तावेज़ कैप्चर करें या चुनें", lang)}
                  >
                    📷
                  </label>
                </div>
                {admissionFormName && (
                  <small className="text-success d-block mt-1">
                    ✓ {getTranslation("Selected file / चयनित फ़ाइल", lang)}: {admissionFormName}
                  </small>
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
                    <div className="row g-2 align-items-center mb-2" key={index}>
                      <div className="col-sm-5">
                        <Input
                          type="text"
                          placeholder={getTranslation("Contact Name / संपर्क का नाम", lang)}
                          value={contact.name}
                          onChange={(e) => handleRelativeContactChange(index, "name", e.target.value)}
                          className="form-control"
                          style={{ borderRadius: "6px", height: "36px", fontSize: "13px" }}
                        />
                      </div>
                      <div className="col-sm-5">
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
                      <div className="col-sm-2">
                        {formData.relative_contacts.length > 1 && (
                          <Button
                            color="danger"
                            outline
                            type="button"
                            size="sm"
                            className="w-100"
                            onClick={() => removeRelativeContact(index)}
                            style={{ borderRadius: "6px", height: "36px" }}
                          >
                            {getTranslation("Remove / हटाएं", lang)}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Patient Relative Address */}
              <div className="col-md-6">
                <VoiceTextarea
                  label={
                    <span className="fw-semibold text-dark" style={{ fontSize: "13px" }}>
                      <Translated text={pateintRelativeAddress} /> <span className="text-danger">*</span>
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

                {/* Profile Pic Upload */}
                <div className="col-md-6">
                  <Label className="form-label fw-semibold text-dark mb-1" style={{ fontSize: "13px" }}>
                    {getTranslation("Update Patient Profile Image / रोगी प्रोफ़ाइल छवि अपडेट करें", lang)}
                  </Label>
                  <div className="d-flex align-items-center gap-3">
                    {editData.profile_pic_url && (
                      <img
                        src={editData.profile_pic_url}
                        alt="Patient profile"
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "2px solid #e2e8f0",
                        }}
                      />
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          profile_pic: e.target.files?.[0] || null,
                        })
                      }
                      className="form-control"
                      style={{ borderRadius: "8px", height: "40px" }}
                    />
                  </div>
                  {editData.profile_pic && (
                    <small className="text-success d-block mt-1">
                      ✓ {getTranslation("Selected file / चयनित फ़ाइल", lang)}: {editData.profile_pic.name}
                    </small>
                  )}
                </div>

                {/* Admission Form Upload */}
                <div className="col-md-6">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <Label className="form-label fw-semibold text-dark mb-0" style={{ fontSize: "13px" }}>
                      {getTranslation("Update Admission Form (PDF / Image) / प्रवेश फॉर्म अपडेट करें", lang)}
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
                  <Input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        admission_form_file: e.target.files?.[0] || null,
                      })
                    }
                    className="form-control"
                    style={{ borderRadius: "8px", height: "40px" }}
                  />
                  {editData.admission_form_file && (
                    <small className="text-success d-block mt-1">
                      ✓ {getTranslation("Selected file / चयनित फ़ाइल", lang)}: {editData.admission_form_file.name}
                    </small>
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
                      <div className="row g-2 align-items-center mb-2" key={index}>
                        <div className="col-sm-5">
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
                        <div className="col-sm-5">
                          <Input
                            type="text"
                            placeholder={getTranslation("Phone Number / फ़ोन", lang)}
                            value={contact.phone}
                            onChange={(e) =>
                              handleEditRelativeContactChange(index, "phone", e.target.value)
                            }
                            className="form-control"
                            style={{ borderRadius: "6px", height: "36px", fontSize: "13px" }}
                          />
                        </div>
                        <div className="col-sm-2">
                          {editData.relative_contacts.length > 1 && (
                            <Button
                              color="danger"
                              outline
                              type="button"
                              size="sm"
                              className="w-100"
                              onClick={() => removeEditRelativeContact(index)}
                              style={{ borderRadius: "6px", height: "36px" }}
                            >
                              {getTranslation("Remove / हटाएं", lang)}
                            </Button>
                          )}
                        </div>
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
                  color="light"
                  type="button"
                  className="border fw-semibold px-4"
                  onClick={() => setShowEditModal(false)}
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

      {/* Readmission/Re-register modal pass ward name and type to backend for re-enter user registration field */}
      <CommonModal
        isOpen={reregisterModal}
        title={getTranslation("Re-Registeration User/पुनः पंजीकरण उपयोगकर्ता",lang)}
        toggler={closeUserViewModal}
        maxWidth="500px"
      >
        {reregisterModal && (
          <Form onSubmit={handleReRegister}>
            <div className="col-md-12 pt-3 pb-3">
              <Label>{wardDetails}</Label>
              <div className="radio radio-primary d-flex gap-3">
                {wardOptions.map((option) => (
                  <div key={option.ward_type_id}>
                    <Input
                      type="radio"
                      id={`wards-${option.ward_type_id}`}
                      name="ward"
                      value={option.ward_name}
                      checked={formData.ward_type_id === option.ward_type_id}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          ward_type_id: option.ward_type_id,
                          ward_name: option.ward_name,
                        }))
                      }
                    />
                    <Label for={`wards-${option.ward_type_id}`}>
                      {option.ward_name}
                    </Label>
                  </div>
                ))}
              </div>

              <Button
                color="primary"
                type="submit"
                className="mt-3 mb-3"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  ></span>
                ) : (
                  getTranslation("Re-Admission/पुन: प्रवेश",lang)
                )}
              </Button>
            </div>
          </Form>
        )}
      </CommonModal>
    </Fragment>
  );
}

export default Register;
