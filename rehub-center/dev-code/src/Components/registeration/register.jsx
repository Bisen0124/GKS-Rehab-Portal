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

  const [formData, setFormData] = useState({
    date_of_admission: new Date(),
    patientName: "",
    patientRelativeName: "",
    gender: "",
    phone: "",
    secondary_phone: "",
    isWhatsApp: false,
    whatsapp_no: "",
    email: "",
    password: "",
    dob: new Date(),
    address: "",
    relativeaddress: "",
    relation_with_patient: "",
    relative_contacts: [{ name: "", phone: "" }],
    is_role: "", // This will be 3
    ward_type_id: "",
    ward_name: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "phone" && prev.isWhatsApp ? { whatsapp_no: value } : {}),
    }));
  };

  const handleDateChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field === "dateOfAdmission" ? "date_of_admission" : field]: value,
    }));
  };

  const handleWhatsAppToggle = (e) => {
    const isChecked = e.target.value === "yes";
    setFormData((prev) => ({
      ...prev,
      isWhatsApp: isChecked,
      whatsapp_no: isChecked ? prev.phone : "",
    }));
  };

  const handleIsRoleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "is_role" ? Number(value) : value,
    });
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
  
    const requiredFields = {
      date_of_admission: formData.date_of_admission,
      patientName: formData.patientName,
      email: formData.email,
      patientRelativeName: formData.patientRelativeName,
      phone: formData.phone,
      gender: formData.gender,
      dob: formData.dob,
      address: formData.address,
      password: formData.password,
      whatsapp_no: formData.whatsapp_no,
      is_role: formData.is_role,
      secondary_phone: formData.secondary_phone,
    };
  
    for (const [key, value] of Object.entries(requiredFields)) {
      const isEmpty =
        value === null ||
        value === undefined ||
        (typeof value === "string" && value.trim() === "");
  
      if (isEmpty) {
        Swal.fire({
          icon: "warning",
          title: getTranslation(
            "Field should not be empty!/फ़ील्ड खाली नहीं होना चाहिए!",
            lang
          ),
        });
        return;
      }
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
      payload.append("whatsapp_no", formData.whatsapp_no);
      payload.append("isRole", formData.is_role);
      payload.append("ward_type_id", formData.ward_type_id || "");
      payload.append("ward_name", formData.ward_name || "");
      payload.append("secondary_phone", formData.secondary_phone);
  
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
        }
      } else {
        Swal.fire({
          title: getTranslation("Good job!/अच्छा काम!", lang),
          text: getTranslation("Registration successful!/सफल पंजीकरण!", lang),
          icon: "success",
        }).then(() => {
          setModal(false);
  
          // ✅ Reset form including files
          setFormData({
            date_of_admission: "",
            patientName: "",
            email: "",
            patientRelativeName: "",
            phone: "",
            gender: "",
            dob: "",
            address: "",
            password: "",
            whatsapp_no: "",
            is_role: "",
            secondary_phone: "",
            ward_type_id: "",
            ward_name: "",
            relativeaddress: "",
            relation_with_patient: "",
            relative_contacts: [{ name: "", phone: "" }],
          });
  
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
  const toggle = () => setModal(!modal);

  //View and delete user data state
  const [viewModal, setViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  //view user data on modal

  const userViewToggle = async (userId = null) => {
    if (typeof userId === "object" && userId !== null) {
      userId = userId.id;
    }

    if (!userId) {
      console.error("Invalid userId provided to toggle");
      return;
    }

    // Open modal immediately
    setViewModal(true);
    setIsLoading(true); // Start loading

    const token = localStorage.getItem("Authorization");

    try {
      // ✅ Get selected branch from context or state
      const branch_id = branchId;

      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/users/${userId}?branch_id=${branch_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        }
      );

      const data = await response.json();

      console.log("register user details: ", data);

      if (!response.ok) {
        console.error("User fetch error:", data);
        return;
      }

      const userData = data.data?.[0];
      console.log("userData", userData);

      if (!userData) {
        console.error("User not found in response");
        return;
      }

      // ✅ Normalize relative_contacts in case backend sends it as a JSON string
      if (userData.relative_contacts && typeof userData.relative_contacts === "string") {
        try {
          userData.relative_contacts = JSON.parse(userData.relative_contacts);
        } catch (e) {
          userData.relative_contacts = [];
        }
      }

      setSelectedUser(userData);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false); // End loading
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
      // name: "User ID",
      name: `${getTranslation('User ID/उपयोगकर्ता आईडी' , lang)}`,
      selector: (row) => row.id,
      sortable: true,
      center: true,
    },
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
      name: `${getTranslation('User ID/उपयोगकर्ता आईडी' , lang)}`,
      
      selector: (row) => row.id,
      sortable: true,
      center: true,
    },
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

  //Generate password dynamically while regestering/entering password
  const generatePassword = () => {
    const length = 10;
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    let password = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
      password += charset.charAt(Math.floor(Math.random() * n));
    }
    return password;
  };

  //PDf view download pdf code handler
    const [pfaDownload, setpfaDownload] = useState(false);
    const handleDownloadPDF = () => {
      const element = pdfRef.current;
      setpfaDownload(true);
  
      // Add a temporary class to scale fonts if needed
      element.classList.add("pdf-scale");
  
      const opt = {
        margin: [10, 10, 10, 10], // top, left, bottom, right
        filename: `user_data_${selectedUser.name}_${selectedUser.user_id}.pdf`,
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
                <div className="row pb-2">
                  <div className="col-md-4">
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
                    // title="All Registered Patient List"
                    title={getTranslation("All Registered Patient List/ सभी पंजीकृत रोगियों की सूची" , lang)}
                    className="p-0"
                    qweq
                  />
                </div>
                <div className="row pb-2">
                  <div className="col-md-4">
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
        title={getTranslation("Patient Registration Form/रोगी पंजीकरण फॉर्म" , lang)}
        toggler={toggle}
        maxWidth="1200px"
      >
        <div className="register__wrapper p-20">
          <Form onSubmit={handleSubmit}>
            <div className="row gap-3">
              <div className="row">
                {/* Date of Admission */}
                <div className="col-md-6">
                  <FormGroup className="form-group row">
                    <Label className="col-sm-12 col-form-label col-xl-6">
                      {/* {dateOfAdmission} */}
                      <Translated text={dateOfAdmission} />
                    </Label>
                    <Col xl="5" sm="12">
                      <DatePicker showMonthDropdown showYearDropdown dropdownMode="select"
                        className="form-control digits"
                        selected={
                          formData.date_of_admission
                            ? new Date(formData.date_of_admission)
                            : null
                        } // Make sure it's a valid Date object
                        onChange={(date) =>
                          handleDateChange("dateOfAdmission", date)
                        }
                        dateFormat="yyyy/MM/dd"
                      />
                    </Col>
                  </FormGroup>
                </div>

                {/* Name */}
                <div className="col-md-6">
                  <FormGroup className="form-group row">
                    <Label className="col-sm-12 col-form-label col-xl-6">
                      {/* {patientName} */}
                      <Translated text={patientName} />
                    </Label>
                    <Col xl="5" sm="12">
                      <Input
                        type="text"
                        name="patientName"
                        value={formData.patientName}
                        onChange={handleChange}
                        placeholder={getTranslation("Patient Name/मरीज़ का नाम",lang)}
                      />
                    </Col>
                  </FormGroup>
                </div>
              </div>

              <div className="row">
                {/* Relative Name */}
                <div className="col-md-6">
                  <FormGroup className="form-group row">
                    <Label className="col-sm-12 col-form-label col-xl-6">
                      {/* {patientRelativeName} */}
                      <Translated text={patientRelativeName} />
                    </Label>
                    <Col xl="5" sm="12">
                      <Input
                        type="text"
                        name="patientRelativeName"
                        value={formData.patientRelativeName}
                        onChange={handleChange}
                        placeholder={getTranslation("Patient Relative Name/मरीज़ का नाम",lang)}
                      />
                    </Col>
                  </FormGroup>
                </div>

                {/* Gender */}
                <div className="col-md-6">
                <Translated text={patientSex} />
                  {/* <Label>{patientSex}</Label> */}
                  <div className="radio radio-primary d-flex gap-3">
                    {["Male", "Female", "Other"].map((g) => (
                      <div key={g}>
                        <Input
                          type="radio"
                          id={`gender-${g}`}
                          name="gender"
                          value={g}
                          checked={formData.gender === g}
                          onChange={handleChange}
                        />
                        <Label for={`gender-${g}`}>{g}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Relation with patient */}
              <div className="row">
                <div className="col-md-6">
                  <FormGroup className="form-group row">
                    <Label className="col-sm-12 col-form-label col-xl-6">
                      {getTranslation("Relation with Patient/रोगी से संबंध", lang)}
                    </Label>
                    <Col xl="5" sm="12">
                      <Input
                        type="text"
                        name="relation_with_patient"
                        value={formData.relation_with_patient}
                        onChange={handleChange}
                        placeholder={getTranslation("e.g. Brother, Father/जैसे भाई, पिता", lang)}
                      />
                    </Col>
                  </FormGroup>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  {/* DOB */}
                  <div className="col-md-12">
                    <FormGroup className="form-group row">
                      <Label className="col-sm-12 col-form-label col-xl-6">
                      <Translated text={patientDateOfBirth} />
                        {/* {patientDateOfBirth} */}
                      </Label>
                      <Col xl="5" sm="12">
                        <DatePicker showMonthDropdown showYearDropdown dropdownMode="select"
                          className="form-control digits"
                          selected={
                            formData.dob ? new Date(formData.dob) : null
                          } // Make sure it's a valid Date object
                          onChange={(date) => handleDateChange("dob", date)}
                          dateFormat="yyyy/MM/dd"
                        />
                      </Col>
                    </FormGroup>
                  </div>
                  {/* Phone */}
                  <div className="col-md-12">
                    <FormGroup className="form-group row">
                      <Label className="col-sm-12 col-form-label col-xl-6">
                        {/* {patientRelativePhoneNumber} */}
                        <Translated text={patientRelativePhoneNumber} />
                      </Label>
                      <Col xl="5" sm="12">
                        <Input
                          type="text"
                          name="phone"
                          value={formData.phone}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Allow only numbers and max 10 digits
                            if (/^\d{0,10}$/.test(value)) {
                              setFormData({ ...formData, phone: value });
                            }
                          }}
                          placeholder={getTranslation("Phone Number/फ़ोन नंबर",lang)}
                          maxLength={10}
                        />
                        {formData.phone.length > 0 &&
                          formData.phone.length !== 10 && (
                            <small className="text-danger">
                              {getTranslation("Phone number must be 10 digits./फ़ोन नंबर 10 अंकों का होना चाहिए।",lang)}
                            </small>
                          )}
                      </Col>
                    </FormGroup>
                  </div>


{/* Patient relative secondary mobile number */}
                  <div className="col-md-12">
                    <FormGroup className="form-group row">
                      <Label className="col-sm-12 col-form-label col-xl-6">
                        {/* {patientRelativePhoneNumber} */}
                        <Translated text={patientRelativesecPhoneNumber} />
                      </Label>
                      <Col xl="5" sm="12">
                        <Input
                          type="text"
                          name="secondary_phone"
                          value={formData.secondary_phone}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Allow only numbers and max 10 digits
                            if (/^\d{0,10}$/.test(value)) {
                              setFormData({ ...formData, secondary_phone: value });
                            }
                          }}
                          placeholder={getTranslation("Phone Number/फ़ोन नंबर",lang)}
                          maxLength={10}
                        />
                        {formData.secondary_phone.length > 0 &&
                          formData.secondary_phone.length !== 10 && (
                            <small className="text-danger">
                              {getTranslation("Phone number must be 10 digits./फ़ोन नंबर 10 अंकों का होना चाहिए।",lang)}
                            </small>
                          )}
                      </Col>
                    </FormGroup>
                  </div>

                  {/* Additional relative contacts (name + phone pairs) */}
                  <div className="col-md-12">
                    <Label>
                      {getTranslation("Additional Relative Contacts/अतिरिक्त संबंधी संपर्क", lang)}
                    </Label>
                    {formData.relative_contacts.map((contact, index) => (
                      <div className="d-flex gap-2 align-items-center mb-2" key={index}>
                        <Input
                          type="text"
                          placeholder={getTranslation("Name/नाम", lang)}
                          value={contact.name}
                          onChange={(e) =>
                            handleRelativeContactChange(index, "name", e.target.value)
                          }
                        />
                        <Input
                          type="text"
                          placeholder={getTranslation("Phone/फ़ोन", lang)}
                          value={contact.phone}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d{0,10}$/.test(value)) {
                              handleRelativeContactChange(index, "phone", value);
                            }
                          }}
                          maxLength={10}
                        />
                        {formData.relative_contacts.length > 1 && (
                          <Button
                            color="danger"
                            type="button"
                            size="sm"
                            onClick={() => removeRelativeContact(index)}
                          >
                            {getTranslation("Remove/हटाएं", lang)}
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      color="secondary"
                      type="button"
                      size="sm"
                      className="mb-2"
                      onClick={addRelativeContact}
                    >
                      {getTranslation("+ Add Contact/+ संपर्क जोड़ें", lang)}
                    </Button>
                  </div>

                  {/* WhatsApp Option */}
                  <div className="col-md-12">
                  <Translated text={IspatientWhatsappNo} />
                    {/* <Label>Is it WhatsApp?</Label> */}
                    <div className="radio radio-primary d-flex gap-3">
                      <Input
                        type="radio"
                        id="whatsappYes"
                        name="isWhatsApp"
                        value="yes"
                        checked={formData.isWhatsApp}
                        onChange={handleWhatsAppToggle}
                      />
                      <Label for="whatsappYes">{getTranslation("Yes/हाँ",lang)}</Label>

                      <Input
                        type="radio"
                        id="whatsappNo"
                        name="isWhatsApp"
                        value="no"
                        checked={!formData.isWhatsApp}
                        onChange={handleWhatsAppToggle}
                      />
                      <Label for="whatsappNo">{getTranslation("No/नहीं",lang)}</Label>
                    </div>
                  </div>

                  {/* WhatsApp Number */}
                  {!formData.isWhatsApp && (
                    <div className="col-md-12">
                      <FormGroup className="form-group row">
                        <Label className="col-sm-12 col-form-label col-xl-6">
                           <Translated text={whatsAppNo} />
                          {/* WhatsApp Number */}
                        </Label>
                        <Col xl="5" sm="12">
                          <Input
                            type="text"
                            name="whatsapp_no"
                            value={formData.whatsapp_no}
                            onChange={handleChange}
                            placeholder={getTranslation("Enter WhatsApp Number/WhatsApp नंबर डालें",lang)}
                          />
                        </Col>
                      </FormGroup>
                    </div>
                  )}
                </div>

                <div className="col-md-6">
                  {/* Email */}
                  <div className="col-md-12">
                    <FormGroup className="form-group row">
                      <Label className="col-sm-12 col-form-label col-xl-6">
                      <Translated text={patientRelativeEmailAddr} />
                        {/* {patientRelativeEmailAddr} */}
                      </Label>
                      <Col xl="5" sm="12">
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
                          placeholder={getTranslation("Enter Email/ईमेल दर्ज करें",lang)}
                        />
                        {emailError && (
                          <small className="text-danger">{emailError}</small>
                        )}
                      </Col>
                    </FormGroup>
                  </div>

                  {/* Password */}
                  <div className="col-md-12">
                    <FormGroup className="form-group row">
                      <Label className="col-sm-12 col-form-label col-xl-6">
                      <Translated text={Password} />
                        {/* {Password} */}
                      </Label>
                      <Col xl="5" sm="12">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <label htmlFor="password">{getTranslation("Password/पासवर्ड",lang)}</label>
                          <svg
                            className="pe-auto d-block"
                            onClick={() => {
                              const generatedPassword = generatePassword();
                              setFormData({
                                ...formData,
                                password: generatedPassword,
                              });
                              validatePassword(generatedPassword);
                            }}
                            width="30px"
                            height="30px"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fill-rule="evenodd"
                              clip-rule="evenodd"
                              d="M15.0614 9.67972L16.4756 11.0939L17.8787 9.69083L16.4645 8.27662L15.0614 9.67972ZM16.4645 6.1553L20 9.69083L8.6863 21.0045L5.15076 17.469L16.4645 6.1553Z"
                              fill="#1F2328"
                            />
                            <path
                              fill-rule="evenodd"
                              clip-rule="evenodd"
                              d="M11.364 5.06066L9.59619 6.82843L8.53553 5.76777L10.3033 4L11.364 5.06066ZM6.76778 6.82842L5 5.06067L6.06066 4L7.82843 5.76776L6.76778 6.82842ZM10.3033 10.364L8.53553 8.5962L9.59619 7.53554L11.364 9.3033L10.3033 10.364ZM7.82843 8.5962L6.06066 10.364L5 9.3033L6.76777 7.53554L7.82843 8.5962Z"
                              fill="#1F2328"
                            />
                          </svg>
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
                            placeholder={getTranslation("Enter Password/पास वर्ड दर्ज करें",lang)}
                          />
                          <span
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                              position: "absolute",
                              right: "10px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              cursor: "pointer",
                              fontSize: "14px",
                              color: "#007bff",
                            }}
                          >
                            {showPassword ? "Hide" : "Show"}
                          </span>
                        </div>

                        {passwordError && (
                          <small className="text-danger">{passwordError}</small>
                        )}
                      </Col>
                    </FormGroup>
                  </div>

                  {/* Role */}
                  <div className="col-md-12">
                    {/* <Label>User Role</Label> */}

                    {/* Role while register */}
                    <div className="form-group row mb-4 mt-3">
                    <label
                      className="col-sm-12 col-form-label col-xl-6 form-label"
                      htmlFor="selectRole"
                    >
                      
                      <Translated text={"Select Role/भूमिका चुनें"} />
                    </label>
                    <div className="col-sm-12 col-xl-5">
                    <select
                      className="form-select"
                      aria-label="Select Role"
                      name="is_role"
                      value={formData.is_role}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_role: Number(e.target.value),
                        })
                      }
                    >
                      <option value="">{getTranslation("Select a role/एक भूमिका चुनें",lang)}</option>
                      {/* <option value="1">SuperAdmin</option>
                      <option value="2">BranchAdmin</option>
                      <option value="3">BranchOperator</option> */}
                      <option value="4">{getTranslation("Patient/मरीज़",lang)}</option>
                    </select>
                    </div>
                    </div>
                    {/* Read-only visible input showing text like "USER" */}
                    <Input
                      type="text"
                      value="USER"
                      readOnly
                      style={{ position: "absolute", left: "-9999px" }}
                    />
                  </div>
                   {/* Patient photo upload */}
              <div className="col-md-12">
              {getTranslation("Upload Patient Profile Image/रोगी प्रोफ़ाइल छवि अपलोड करें",lang)}
              <div className="profile-upload">
      {preview && (
        <img
          src={preview}
          alt="Preview"
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            objectFit: "cover",
            marginBottom: "10px",
          }}
        />
      )}

      <Input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="form-control"
      />

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
              </div>

              {/* Patient admission form upload */}
              <div className="col-md-12 mt-2">
                {getTranslation("Upload Admission Form (PDF/Image)/प्रवेश फॉर्म अपलोड करें", lang)}
                <div className="profile-upload">
                  <Input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={handleAdmissionFormChange}
                    className="form-control"
                  />
                  {admissionFormName && (
                    <small className="text-success d-block mt-1">
                      {getTranslation("Selected file/चयनित फ़ाइल", lang)}: {admissionFormName}
                    </small>
                  )}
                  {admissionFormError && (
                    <p style={{ color: "red" }}>{admissionFormError}</p>
                  )}
                </div>
              </div>
                </div>
              </div>


<div className="row">
              {/* Wards details */}
              <div className="col-md-6">
                {/* <Label>{wardDetails}</Label> */}
                <Translated text={wardDetails} />
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
              </div>

             
              </div>

<div className="row">
              {/* Patient Relative Address */}
              <div className="col-md-6">
                {/* <FormGroup>
                <Translated text={pateintAddress} />
                  <Label>{pateintAddress}</Label>
                  <Input
                    type="textarea"
                    rows="3"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </FormGroup> */}
<VoiceTextarea
    label={<Translated text={pateintRelativeAddress} />}
    name="relativeaddress"
    value={formData.relativeaddress}
    onChange={handleChange}
  />

              </div>

            

               {/* Patient Address */}
               <div className="col-md-6">
                {/* <FormGroup>
                <Translated text={pateintAddress} />
                  <Label>{pateintAddress}</Label>
                  <Input
                    type="textarea"
                    rows="3"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </FormGroup> */}
               <VoiceTextarea
    label={<Translated text={pateintAddress} />}
    name="address"
    value={formData.address}
    onChange={(e) => {
      handleChange(e);
      if (sameAddress) {
        setSameAddress(false); // user edits manually → uncheck automatically
      }
    }}
  />

              </div>
              <div className="col-md-12 mt-2">
  <label style={{ cursor: "pointer" }}>
    <input
      type="checkbox"
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
      style={{ marginRight: "6px" }}
    />
    <Translated text="Same as Patient Relative Address" />
  </label>
</div>

              </div>

              {/* Submit */}
              <div className="col-md-6">
                <Button color="primary" type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <div
                      className="spinner-border spinner-border-sm"
                      role="status"
                    >
                      <span className="sr-only">{getTranslation("Loading Data.../डेटा लोड हो रहा है...",lang)}</span>
                    </div>
                  ) : (
                    getTranslation("Patient Register / रोगी रजिस्टर",lang)
                  )}
                </Button>
              </div>
            </div>
          </Form>
        </div>
      </CommonModal>

      {/* View user details by id modal */}
      <CommonModal
        isOpen={viewModal}
        title={getTranslation("Patient Register View Data / रोगी रजिस्टर डेटा देखें" , lang)}
        
        toggler={closeUserViewModal}
        maxWidth="1200px"
      >
    <div className="table-responsive p-4 print-area" ref={pdfRef}>
      <h4
        style={{
          textAlign: "center",
          textDecoration: "underline",
          padding: "20px 0",
        }}
      >
       {getTranslation(h4Text, lang)}
      </h4>

      <Table size="sm" className="table-auto table-bordered">
        <tbody style={{ fontSize: "14px" }}>
          {isLoading ? (
            <tr>
              <td colSpan="2" className="text-center">
                <div className="loader-box">
                  <Spinner
                    className={selectedSpinner?.spinnerClass || "spinner-border"}
                  />
                </div>
              </td>
            </tr>
          ) : selectedUser && typeof selectedUser === "object" ? (
            <>
              {selectedUser.profile_pic && (
                <tr>
                  <th className="text-start p-3">{getTranslation("Patient Photo/रोगी की तस्वीर", lang)}</th>
                  <td className="border p-3">
                    <img
                      src={selectedUser.profile_pic}
                      alt="Profile"
                      style={{
                        width: "90px",
                        height: "90px",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  </td>
                </tr>
              )}
              <tr>
                <th className="text-start p-3">{getTranslation("Patient Name/रोगी का नाम",lang)}</th>
                <td className="border p-3">{selectedUser.name}</td>
              </tr>
              <tr>
              <th className="text-start p-3">{getTranslation("Patient Email/रोगी का ईमेल", lang)}</th>
                <td className="border p-3">{selectedUser.email}</td>
              </tr>
              <tr>
              <th className="text-start p-3">{getTranslation("Patient Phone/रोगी का फोन", lang)}</th>
                <td className="border p-3">{selectedUser.phone}</td>
              </tr>
              <tr>
              <th className="text-start p-3">{getTranslation("Patient Secondary Phone/रोगी का द्वितीयक फोन", lang)}</th>
                <td className="border p-3">{selectedUser.secondary_phone}</td>
              </tr>
              <tr>
              <th className="text-start p-3">{getTranslation("Patient WhatsApp No/रोगी का व्हाट्सएप नंबर", lang)}</th>
                <td className="border p-3">{selectedUser.whatsapp_no}</td>
              </tr>
              <tr>
              <th className="text-start p-3">{getTranslation("Patient Date of Birth/रोगी का जन्म तिथि", lang)}</th>
                <td className="border p-3">
                  {selectedUser.dob
                    ? new Date(selectedUser.dob).toLocaleDateString()
                    : ""}
                </td>
              </tr>
              <tr>
              <th className="text-start p-3">{getTranslation("Patient Gender/रोगी का लिंग", lang)}</th>
                <td className="border p-3">{selectedUser.gender}</td>
              </tr>
              <tr>
              <th className="text-start p-3">{getTranslation("Patient Address/रोगी का पता", lang)}</th>
                <td className="border p-3">{selectedUser.address}</td>
              </tr>
              <tr>
              <th className="text-start p-3">{getTranslation("Patient Relative Name/रोगी का संबंधी का नाम", lang)}</th>
                <td className="border p-3">{selectedUser.relative_name}</td>
              </tr>
              <tr>
              <th className="text-start p-3">{getTranslation("Relation with Patient/रोगी से संबंध", lang)}</th>
                <td className="border p-3">{selectedUser.relation_with_patient}</td>
              </tr>
              <tr>
              <th className="text-start p-3">{getTranslation("Patient Relative Address/रोगी के संबंधी का पता", lang)}</th>
                <td className="border p-3">{selectedUser.relative_address}</td>
              </tr>
              <tr>
              <th className="text-start p-3">{getTranslation("Additional Relative Contacts/अतिरिक्त संबंधी संपर्क", lang)}</th>
                <td className="border p-3">
                  {Array.isArray(selectedUser.relative_contacts) &&
                  selectedUser.relative_contacts.length > 0 ? (
                    <ul className="mb-0 ps-3">
                      {selectedUser.relative_contacts.map((c, i) => (
                        <li key={i}>
                          {c.name} {c.phone ? `- ${c.phone}` : ""}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "N/A"
                  )}
                </td>
              </tr>
              <tr>
              <th className="text-start p-3">{getTranslation("Patient Date of Admission/रोगी का प्रवेश की तिथि", lang)}</th>
                <td className="border p-3">
                  {selectedUser.date_of_admission
                    ? new Date(selectedUser.date_of_admission).toLocaleDateString()
                    : ""}
                </td>
              </tr>
              <tr>
              <th className="text-start p-3">{getTranslation("Patient Ward Name/रोगी का वार्ड का नाम", lang)}</th>
                <td className="border p-3">{selectedUser.ward_name || "N/A"}</td>
              </tr>
              <tr>
              <th className="text-start p-3">{getTranslation("Patient role/रोगी की भूमिका", lang)}</th>
                <td className="border p-3">
                  {{
                    1: "SuperAdmin",
                    2: "BranchAdmin",
                    3: "BranchOperator",
                    4: "Patient",
                  }[selectedUser.isRole] || "N/A"}
                </td>
              </tr>
              {(selectedUser.admission_form_url || selectedUser.admission_form) && (
                <tr>
                  <th className="text-start p-3">{getTranslation("Admission Form/प्रवेश फॉर्म", lang)}</th>
                  <td className="border p-3">
                    <a
                      href={selectedUser.admission_form_url || selectedUser.admission_form}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {getTranslation("View File/फ़ाइल देखें", lang)}
                    </a>
                  </td>
                </tr>
              )}
            </>
          ) : (
            <tr>
              <td colSpan="2" className="text-center">
                {getTranslation("No data available/कोई डेटा मौजूद नहीं",lang)}
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>

    <div style={{ margin: "0 20px 20px 20px" }}>
    <button
      disabled={pfaDownload}
      id="download-btn"
      className="btn btn-primary"
      onClick={handleDownloadPDF}
    >
      {pfaDownload
        ? getTranslation("Your patient report is being downloaded... / आपका patient रिपोर्ट डाउनलोड हो रहा है...", lang)
        : getTranslation("Download patient registered report/रोगी पंजीकृत रिपोर्ट डाउनलोड करें",lang)}
    </button>

    <button
      id="download-btn"
      className="btn btn-primary mx-3"
      onClick={handlePrint}
    >
       {getTranslation("Print Your Data/अपना डेटा प्रिंट करें", lang)}
    </button>
  </div>

      </CommonModal>

      {/* Update form data JSX code start */}
       <CommonModal
              isOpen={showEditModal}
              // title={"Update Patient Registration Data/रोगी पंजीकरण डेटा अपडेट करें"}
              title={getTranslation("Update Patient Registration Data/रोगी पंजीकरण डेटा अपडेट करें",lang)}
              toggler={closeUserViewModal}
              maxWidth="1200px"
            >
              {showEditModal && (
                <div className="modal-overlay">
                  <div className="modal-content border-0">
                    <div className="row pb-3 px-3">
                      <Form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleUpdateSubmit();
                        }}
                      >
                        <div className="row pt-4">
                          <div className="col-md-6">
                            <Label>{getTranslation("Patient Name/रोगी का नाम",lang)}</Label>
                            <Input
                              type="text"
                              placeholder={getTranslation("Name/नाम",lang)}
                              value={editData.name}
                              onChange={(e) =>
                                setEditData({ ...editData, name: e.target.value })
                              }
                            />
                          </div>
                          <div className="col-md-6">
                            <Label>{getTranslation("Patient Relative Name/रोगी का संबंधी का नाम",lang)}</Label>
                            <Input
                              type="text"
                              placeholder={getTranslation("Relative Name/रिश्तेदार का नाम",lang)}
                              value={editData.patientRelativeName}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  patientRelativeName: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                        <br />
      
                        <div className="row">
                          <div className="col-md-6">
                            <Label>{getTranslation("Relation with Patient/रोगी से संबंध", lang)}</Label>
                            <Input
                              type="text"
                              placeholder={getTranslation("e.g. Brother, Father/जैसे भाई, पिता", lang)}
                              value={editData.relation_with_patient}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  relation_with_patient: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                        <br />
      
                        <div className="form-group col-md-6">
                          <Label>{getTranslation("Patient Gender/रोगी का लिंग",lang)}</Label>
                          <div className="radio radio-primary d-flex gap-3">
                            {["Male", "Female", "Other"].map((g) => (
                              <div key={g}>
                                <Input
                                  className="radio_animated"
                                  type="radio"
                                  id={`gender-${g}`}
                                  name="gender"
                                  value={g}
                                  checked={editData.gender === g}
                                  onChange={(e) =>
                                    setEditData({
                                      ...editData,
                                      gender: e.target.value,
                                    })
                                  }
                                />
                                <Label htmlFor={`gender-${g}`}>{g}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
      
                        <div className="row align-items-baseline">
                          <div className="col-md-4">
                            <Label>{getTranslation("Patient Phone/मरीज़ का फ़ोन",lang)}</Label>
                            <Input
                              type="text"
                              placeholder={getTranslation("Phone/फ़ोन",lang)}
                              value={editData.phone}
                              onChange={(e) => {
                                const newPhone = e.target.value;
                                setEditData((prev) => ({
                                  ...prev,
                                  phone: newPhone,
                                  whatsapp_no: prev.isWhatsApp
                                    ? newPhone
                                    : prev.whatsapp_no,
                                }));
                              }}
                            />
                          </div>
                          <div className="col-md-4">
                            <Label>{getTranslation("Patient Secondary Phone/रोगी का द्वितीयक फोन", lang)}</Label>
                            <Input
                              type="text"
                              placeholder={getTranslation("Secondary Phone/द्वितीयक फोन", lang)}
                              value={editData.secondary_phone}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  secondary_phone: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="col-md-3">
                            <Label>
                              <Input
                                className="checkbox_animated"
                                type="checkbox"
                                checked={editData.isWhatsApp}
                                onChange={(e) => {
                                  const isChecked = e.target.checked;
                                  setEditData((prev) => ({
                                    ...prev,
                                    isWhatsApp: isChecked,
                                    whatsapp_no: isChecked ? prev.phone : "",
                                  }));
                                }}
                              />
                              {getTranslation("Patient Is WhatsApp?/क्या मरीज़ व्हाट्सएप्प है?",lang)}
                            </Label>
                          </div>
                          <div className="col-md-5">
                            <Label>{getTranslation("Patient WhatsApp No./मरीज़ का व्हाट्सएप नंबर",lang)}</Label>
                            <Input
                              type="text"
                              placeholder={getTranslation("WhatsApp No./व्हाट्सएप नंबर.",lang)}
                              value={editData.whatsapp_no}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  whatsapp_no: e.target.value,
                                })
                              }
                              disabled={editData.isWhatsApp}
                            />
                          </div>
                        </div>
                        <br />
      
                        <div className="row">
                          <div className="col-md-6">
                            <Label>{getTranslation("Patient Email/रोगी का ईमेल",lang)}</Label>
                            <Input
                              type="email"
                              placeholder={getTranslation("Email/ईमेल",lang)}
                              value={editData.email}
                              onChange={(e) =>
                                setEditData({ ...editData, email: e.target.value })
                              }
                            />
                          </div>
                          <div className="col-md-6 d-flex align-items-end gap-4">
                            <Label>{getTranslation("Patient Date of Birth/रोगी की जन्मतिथि",lang)}</Label>
                            <DatePicker showMonthDropdown showYearDropdown dropdownMode="select"
                              className="form-control"
                              selected={
                                editData.dob instanceof Date && !isNaN(editData.dob)
                                  ? editData.dob
                                  : null
                              }
                              onChange={(date) =>
                                setEditData({ ...editData, dob: date })
                              }
                            />
                          </div>
                        </div>
                        <br />
      
                        <div className="row">
                          <div className="col-md-6">
                            <Label>{getTranslation("Update Patient Profile Image/रोगी प्रोफ़ाइल छवि अपडेट करें", lang)}</Label>
                            {editData.profile_pic_url && (
                              <div className="mb-2">
                                <img
                                  src={editData.profile_pic_url}
                                  alt="Patient profile"
                                  style={{
                                    width: "90px",
                                    height: "90px",
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                  }}
                                />
                              </div>
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
                            />
                            {editData.profile_pic && (
                              <small className="text-success d-block mt-1">
                                {getTranslation("Selected file/चयनित फ़ाइल", lang)}: {editData.profile_pic.name}
                              </small>
                            )}
                          </div>
      
                          <div className="col-md-6">
                            <Label>{getTranslation("Update Admission Form (PDF/Image)/प्रवेश फॉर्म अपडेट करें", lang)}</Label>
                            {editData.admission_form_url && (
                              <div className="mb-2">
                                <a
                                  href={editData.admission_form_url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {getTranslation("View Current File/वर्तमान फ़ाइल देखें", lang)}
                                </a>
                              </div>
                            )}
                            <Input
                              type="file"
                              accept="application/pdf,image/*"
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  admission_form_file: e.target.files?.[0] || null,
                                })
                              }
                            />
                            {editData.admission_form_file && (
                              <small className="text-success d-block mt-1">
                                {getTranslation("Selected file/चयनित फ़ाइल", lang)}: {editData.admission_form_file.name}
                              </small>
                            )}
                          </div>
                        </div>
                        <br />
      
                        {/* <Label>{getTranslation("Patient Address/रोगी का पता",lang)}</Label> */}
                        {/* <Input
                          type="textarea"
                          rows="3"
                          placeholder={getTranslation("Address/पता",lang)}
                          value={editData.address}
                          onChange={(e) =>
                            setEditData({ ...editData, address: e.target.value })
                          }
      
                          
      
                        ></Input> */}
      
      <VoiceTextarea
        label={<Translated text={getTranslation("Patient Address/रोगी का पता",lang)} />}
        // name="address"
        value={editData.address}
        onChange={(e) =>
          setEditData({ ...editData, address: e.target.value })
        }
      />
      
      <br />
      <VoiceTextarea
        label={<Translated text={getTranslation("Patient Relative Address/रोगी के संबंधी का पता", lang)} />}
        value={editData.relativeaddress}
        onChange={(e) =>
          setEditData({ ...editData, relativeaddress: e.target.value })
        }
      />
      
                        {/* Edit-mode additional relative contacts */}
                        <div className="col-md-12 mt-3">
                          <Label>
                            {getTranslation("Additional Relative Contacts/अतिरिक्त संबंधी संपर्क", lang)}
                          </Label>
                          {(editData.relative_contacts || []).map((contact, index) => (
                            <div className="d-flex gap-2 align-items-center mb-2" key={index}>
                              <Input
                                type="text"
                                placeholder={getTranslation("Name/नाम", lang)}
                                value={contact.name}
                                onChange={(e) =>
                                  handleEditRelativeContactChange(index, "name", e.target.value)
                                }
                              />
                              <Input
                                type="text"
                                placeholder={getTranslation("Phone/फ़ोन", lang)}
                                value={contact.phone}
                                onChange={(e) =>
                                  handleEditRelativeContactChange(index, "phone", e.target.value)
                                }
                              />
                              {editData.relative_contacts.length > 1 && (
                                <Button
                                  color="danger"
                                  type="button"
                                  size="sm"
                                  onClick={() => removeEditRelativeContact(index)}
                                >
                                  {getTranslation("Remove/हटाएं", lang)}
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button
                            color="secondary"
                            type="button"
                            size="sm"
                            onClick={addEditRelativeContact}
                          >
                            {getTranslation("+ Add Contact/+ संपर्क जोड़ें", lang)}
                          </Button>
                        </div>
      
                        {/* Optional: role dropdown if editable */}
                        {/* <Label className="mt-4 mb-2">Role</Label>
                        <select
        className="form-select"
        aria-label="Select Role"
        value={editData.is_role}
        onChange={(e) =>
          setEditData({
            ...editData,
            is_role: Number(e.target.value),
          })
        }
      >
        <option value="">Select a role</option>
        <option value={1}>SuperAdmin</option>
        <option value={2}>BranchAdmin</option>
        <option value={3}>BranchOperator</option>
        <option value={4}>Patient</option>
      </select> */}
      
      
                        <br />
                        <div className="d-flex gap-3">
                          <Button color="primary" type="submit" disabled={isLoading}>
                            {isLoading ? (
                              <span
                                className="spinner-border spinner-border-sm"
                                role="status"
                                aria-hidden="true"
                              ></span>
                            ) : (
                              getTranslation('Update Patient Register Data/रोगी रजिस्टर डेटा अपडेट करें',lang)
                            )}
                          </Button>
                          <Button
                            color="primary"
                            type="button"
                            onClick={() => setShowEditModal(false)}
                          >
                            {getTranslation('Cancel Patient Register Data/रोगी रजिस्टर डेटा रद्द करें',lang)}
                          </Button>
                        </div>
                      </Form>
                    </div>
                  </div>
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
