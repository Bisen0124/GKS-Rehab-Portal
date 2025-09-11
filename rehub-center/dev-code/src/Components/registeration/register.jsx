import React, { Fragment, useState, useEffect, useRef } from "react";
import {
  patientRegisterTitle,
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
  name,
  wardDetails,
  wardOptions,
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

function Register() {
 
  //Download view data in PDF 
    const pdfRef = useRef();

  //Branches selection
  const { selectedBranch } = useBranch();

  //spinner extract from other file
  const selectedSpinner = Data.find(
    (item) => item.spinnerClass === "loader-37"
  );

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
      setPasswordError("Password must be at least 6 characters long");
    } else if (!/\d/.test(password)) {
      setPasswordError("Password must contain at least one number");
    } else if (!/[A-Z]/.test(password)) {
      setPasswordError("Password must contain at least one uppercase letter");
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
    isWhatsApp: false,
    whatsapp_no: "",
    email: "",
    password: "",
    dob: new Date(),
    address: "",
    is_role: "", // This will be 3
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

  //Register form data submit funtion
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic frontend validation
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
    };

    for (const [key, value] of Object.entries(requiredFields)) {
      const isEmpty =
        value === null ||
        value === undefined ||
        (typeof value === "string" && value.trim() === "");

      if (isEmpty) {
        Swal.fire({
          icon: "warning",
          title: `Missing ${key.replace(/_/g, " ")}" field.`,
          text: `Please fill out the "${key.replace(/_/g, " ")}" field.`,
        });
        return;
      }
    }

    setIsLoading(true); // Start loading

    const formatDate = (date) => {
      return date instanceof Date && !isNaN(date.getTime())
        ? date.toISOString().split("T")[0]
        : "";
    };

    const payload = {
      date_of_admission: formatDate(formData.date_of_admission),
      name: formData.patientName,
      email: formData.email,
      relative_name: formData.patientRelativeName,
      phone: formData.phone,
      gender: formData.gender,
      dob: formatDate(formData.dob),
      address: formData.address,
      password: formData.password,
      whatsapp_no: formData.whatsapp_no,
      isRole: formData.is_role,
      ward_type_id: formData.ward_type_id,
      ward_name: formData.ward_name,
    };

    try {
      const branch_id = selectedBranch; // make sure `selectedBranch` 
      const token = localStorage.getItem("Authorization");
      // const response = await fetch("https://gks-yjdc.onrender.com/api/users", {
        const response = await fetch(`https://gks-yjdc.onrender.com/api/users?branch_id=${branch_id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        // Check specific backend error
        if (result.error === "Email already exists") {
          Swal.fire({
            icon: "warning",
            title: "Email is already exists",
            text: "This email is already registered. Please use a different one.",
          });
        } else if (result.error === "Phone number already exists") {
          Swal.fire({
            icon: "warning",
            title: "Phone is already exist",
            text: "This phone is already registered. Please use a different one.",
          });
        }
      } else {
        Swal.fire({
          title: "Good job!",
          text: "Registration successful!",
          icon: "success",
          confirmButtonText: "OK",
        }).then(() => {
          setModal(false);
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
          });
          fetchUsers();
        });
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      alert("Registration failed! Unknown error.");
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
      const branch_id = selectedBranch; // make sure `selectedBranch` comes from your BranchContext

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
      title: "Are you sure?",
      text: "Once deleted, you will not be able to recover this user!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ok",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        // Show loading message while deletion is happening
        Swal.fire({
          title: "Deleting...",
          text: "This might take some time.",
          icon: "info",
          showConfirmButton: false,
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        const token = localStorage.getItem("Authorization");

        try {
          const branch_id = selectedBranch; // make sure `selectedBranch` comes from your BranchContext
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
            Swal.fire("Deleted!", "The user has been deleted.", "success");

            // Remove user from local data state
            setData((prev) => prev.filter((user) => user.id !== userId));
            setFilteredData((prev) =>
              prev.filter((user) => user.id !== userId)
            );
          } else {
            // Error during deletion
            Swal.fire(
              "Failed!",
              result.message || "Failed to delete user.",
              "error"
            );
          }
        } catch (error) {
          console.error("Delete error:", error);
          Swal.fire(
            "Error!",
            "An error occurred while deleting the user.",
            "error"
          );
        }
      } else {
        // If user cancels
        Swal.fire("Cancelled", "The user is safe.", "info");
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
      const branch_id = selectedBranch; // make sure `selectedBranch` 
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
          title: "Success!",
          text: "Re-Registration successful!",
          icon: "success",
          confirmButtonText: "OK",
        });
        setreregisterModal(false); // Close modal only after success
      } else if (
        result.error ===
        "User is not eligible for readmission. Please check discharge status and dates."
      ) {
        await Swal.fire({
          title: "User Not Eligible",
          text: "User is not eligible for re-admission. Please check the discharge status and dates.",
          icon: "warning",
          confirmButtonText: "OK",
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
      const branch_id = selectedBranch; // make sure `selectedBranch` comes from your BranchContext

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

      // Handle null/undefined safely and set editData
      setEditData({
        id: user.user_id || "",
        name: user.name || "",
        patientRelativeName: user.relative_name || "",
        dob: user.dob ? parseDateString(user.dob) : "",
        email: user.email || "",
        phone: user.phone || "",
        whatsapp_no: user.whatsapp_no || "",
        isWhatsApp: user.isWhatsApp || false,
        address: user.address || "",
        // is_role: user.isRole || "",
        is_role: Number(user.isRole) || "",
        password: "",
        gender: user.gender || "",
      });
      setShowEditModal(true);
    } catch (error) {
      console.error("Error fetching user details:", error);
      Swal.fire({
        title: "Error!",
        text: "Failed to load user data for editing.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  //User handle update function
  const handleUpdateSubmit = async () => {
    setIsLoading(true); // Set loading to true when the update starts
    const token = localStorage.getItem("Authorization");

    // Make sure you match your form fields to the API payload structure
    const updatedData = {
      name: editData.name,
      relative_name: editData.patientRelativeName, // Assuming this is mapped correctly
      email: editData.email,
      // date_of_admission: editData.date_of_admission, // Ensure this is in the correct format
      gender: editData.gender,
      address: editData.address,
      dob: editData.dob, // Ensure dob is in 'yyyy-mm-dd' format
      phone: editData.phone,
      whatsapp_no: editData.whatsapp_no, // Make sure this is correctly handled
      isRole: editData.is_role // ✅ match DB column name exactly
    };

    console.log("User ID:", editData.id, typeof editData.id);

    try {
      const branch_id = selectedBranch; // make sure `selectedBranch` comes from your BranchContext
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/users/${editData.id}?branch_id=${branch_id}`,

        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
          body: JSON.stringify(updatedData), // Send the updated data
        }
      );

      if (response.ok) {
        // Show success SweetAlert
        Swal.fire({
          title: "Good job!",
          text: "User updated successfully!",
          icon: "success",
          confirmButtonText: "OK",
        }).then(() => {
          // Close the modal and refresh user list if needed
          setShowEditModal(false);
        });
        fetchUsers();
      } else {
        const errorData = await response.json();
        // Show error SweetAlert
        Swal.fire({
          title: "Failed to update user",
          text: errorData.message || "Unknown error occurred",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    } catch (err) {
      console.error("Error updating user:", err);
      // Handle error with SweetAlert
      Swal.fire({
        title: "Error!",
        text: "An unexpected error occurred while updating the user.",
        icon: "error",
        confirmButtonText: "OK",
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
    if (!selectedBranch) return; // avoid empty branch fetch

    fetch(
      `https://gks-yjdc.onrender.com/api/users?branch_id=${selectedBranch}`,
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
  }, [selectedBranch]);

  // ✅ Define table columns
  const tableColumns = [
    {
      name: "User ID",
      selector: (row) => row.id,
      sortable: true,
      center: true,
    },
    {
      name: "GKS ID",
      selector: (row) => row.gks_id,
      sortable: true,
      center: true,
    },
    { name: "Name", selector: (row) => row.name, sortable: true, center: true },
    {
      name: "Phone",
      selector: (row) => row.phone,
      sortable: true,
      center: true,
    },
    {
      name: "Email",
      selector: (row) => row.email,
      sortable: true,
      center: true,
    },
    {
      name: "Action",
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

          {/* Edit icon */}
          <span
            onClick={() => handleEdit(row.id)}
            style={{ cursor: "pointer" }}
            title="Edit"
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
            title="Delete"
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
              title="Re-register"
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
            <span title="User not discharged">
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
    if (!selectedBranch) return;

    fetch(
      `https://gks-yjdc.onrender.com/api/ipd/active-ipd-entries?branch_id=${selectedBranch}`,
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
            <span style={{ color: "#28a745", fontWeight: "500" }}>
              {new Date(entry.discharge_date).toLocaleDateString()}
            </span>
          ) : (
            <span style={{ color: "#dc3545", fontWeight: "500" }}>
              Not Discharge yet
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
  }, [selectedBranch]);

  // ✅ Define table columns
  const tableIPDColumns = [
    {
      name: "User ID",
      selector: (row) => row.id,
      sortable: true,
      center: true,
    },
    {
      name: "GKS ID",
      selector: (row) => row.gks_id,
      sortable: true,
      center: true,
    },
    { name: "Name", selector: (row) => row.name, sortable: true, center: true },
    {
      name: "Phone",
      selector: (row) => row.phone,
      sortable: true,
      center: true,
    },
    {
      name: "Email",
      selector: (row) => row.email,
      sortable: true,
      center: true,
    },
    {
      name: "Ward Name",
      selector: (row) => row.wardName,
      sortable: true,
      center: true,
    },
    {
      name: "Discharge Date",
      selector: (row) => row.dischargeDate,
      sortable: true,
      center: true,
      classNames:"Discharge"
    },
    {
      name: "Action",
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

    const filtered = data.filter((item) => {
      return (
        item.name?.toLowerCase().includes(value) ||
        item.email?.toLowerCase().includes(value) ||
        item.phone?.toString().includes(value) ||
        item.id?.toString().includes(value) ||
        item.gks_id?.toLowerCase().includes(value) // Only if gks_id is a string
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

    const IPDfiltered = allIPDData.filter((item) => {
      return (
        item.name?.toLowerCase().includes(value) ||
        item.email?.toLowerCase().includes(value) ||
        item.phone?.toString().includes(value) ||
        item.id?.toString().includes(value) ||
        item.gks_id?.toLowerCase().includes(value) ||
        item.wardName?.toLowerCase().includes(value) ||
        item.dischargeDate?.toLowerCase().includes(value)
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
          toast.success("Download complete!");
          element.classList.remove("pdf-scale");
  
          setTimeout(() => {
            setpfaDownload(false);
          }, 2000);
        });
    };


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
                    title="Registered Patient List"
                    className="p-0"
                    qweq
                  />
                  <Btn attrBtn={{ color: "primary", onClick: toggle }}>
                    {registerYourDetail}
                  </Btn>
                </div>
                <div className="row pb-2">
                  <div className="col-md-4">
                    <InputGroup>
                      <Input
                        className="form-control"
                        type="text"
                        placeholder="Search......."
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
                    title="All Registered Patient List"
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
                        placeholder="Search......."
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
                    Data is fetching from server. Please wait...
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
        title={patientRegisterTitle}
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
                      {dateOfAdmission}
                    </Label>
                    <Col xl="5" sm="12">
                      {/* <DatePicker
                        className="form-control digits"
                        selected={formData.date_of_admission}
                        onChange={(date) =>
                          handleDateChange("dateOfAdmission", date)
                        }
                      /> */}
                      {/* <DatePicker
    className="form-control digits"
    dateFormat="yyyy/MM/dd"
    selected={formData.date_of_admission}
    onChange={(date) =>
      handleDateChange("dateOfAdmission", date)
    }
  /> */}

                      <DatePicker
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
                      {patientName}
                    </Label>
                    <Col xl="5" sm="12">
                      <Input
                        type="text"
                        name="patientName"
                        value={formData.patientName}
                        onChange={handleChange}
                        placeholder="Patient Name"
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
                      {patientRelativeName}
                    </Label>
                    <Col xl="5" sm="12">
                      <Input
                        type="text"
                        name="patientRelativeName"
                        value={formData.patientRelativeName}
                        onChange={handleChange}
                        placeholder="Patient Relative Name"
                      />
                    </Col>
                  </FormGroup>
                </div>

                {/* Gender */}
                <div className="col-md-6">
                  <Label>{patientSex}</Label>
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

              <div className="row">
                <div className="col-md-6">
                  {/* DOB */}
                  <div className="col-md-12">
                    <FormGroup className="form-group row">
                      <Label className="col-sm-12 col-form-label col-xl-6">
                        {patientDateOfBirth}
                      </Label>
                      <Col xl="5" sm="12">
                        {/* <DatePicker
                          className="form-control digits"
                          selected={formData.dob}
                          onChange={(date) => handleDateChange("dob", date)}
                        /> */}
                        <DatePicker
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
                  {/* Phone */}
                  <div className="col-md-12">
                    <FormGroup className="form-group row">
                      <Label className="col-sm-12 col-form-label col-xl-6">
                        {patientRelativePhoneNumber}
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
                          placeholder="Phone Number"
                          maxLength={10}
                        />
                        {formData.phone.length > 0 &&
                          formData.phone.length !== 10 && (
                            <small className="text-danger">
                              Phone number must be 10 digits.
                            </small>
                          )}
                      </Col>
                    </FormGroup>
                  </div>

                  {/* WhatsApp Option */}
                  <div className="col-md-12">
                    <Label>Is it WhatsApp?</Label>
                    <div className="radio radio-primary d-flex gap-3">
                      <Input
                        type="radio"
                        id="whatsappYes"
                        name="isWhatsApp"
                        value="yes"
                        checked={formData.isWhatsApp}
                        onChange={handleWhatsAppToggle}
                      />
                      <Label for="whatsappYes">Yes</Label>

                      <Input
                        type="radio"
                        id="whatsappNo"
                        name="isWhatsApp"
                        value="no"
                        checked={!formData.isWhatsApp}
                        onChange={handleWhatsAppToggle}
                      />
                      <Label for="whatsappNo">No</Label>
                    </div>
                  </div>

                  {/* WhatsApp Number */}
                  {!formData.isWhatsApp && (
                    <div className="col-md-12">
                      <FormGroup className="form-group row">
                        <Label className="col-sm-12 col-form-label col-xl-6">
                          WhatsApp Number
                        </Label>
                        <Col xl="5" sm="12">
                          <Input
                            type="text"
                            name="whatsapp_no"
                            value={formData.whatsapp_no}
                            onChange={handleChange}
                            placeholder="Enter WhatsApp Number"
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
                        {patientRelativeEmailAddr}
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
                          placeholder="Enter Email"
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
                        {Password}
                      </Label>
                      <Col xl="5" sm="12">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <label htmlFor="password">Password</label>
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
                            placeholder="Enter Password"
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
                      Select Role
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
                      <option value="">Select a role</option>
                      {/* <option value="1">SuperAdmin</option>
                      <option value="2">BranchAdmin</option>
                      <option value="3">BranchOperator</option> */}
                      <option value="4">Patient</option>
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
                </div>
              </div>

              {/* Wards details */}
              <div className="col-md-6">
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
              </div>

              {/* Address */}
              <div className="col-md-12">
                <FormGroup>
                  <Label>{pateintAddress}</Label>
                  <Input
                    type="textarea"
                    rows="3"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </FormGroup>
              </div>

              {/* Submit */}
              <div className="col-md-6">
                <Button color="primary" type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <div
                      className="spinner-border spinner-border-sm"
                      role="status"
                    >
                      <span className="sr-only">Loading...</span>
                    </div>
                  ) : (
                    "Register"
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
        title={"User view data"}
        toggler={closeUserViewModal}
        maxWidth="1200px"
      >
    <div className="table-responsive p-4" ref={pdfRef}>
      <h4
        style={{
          textAlign: "center",
          textDecoration: "underline",
          padding: "20px 0",
        }}
      >
        User Details / उपयोगकर्ता विवरण
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
              <tr>
                <th className="text-start p-3">Name</th>
                <td className="border p-3">{selectedUser.name}</td>
              </tr>
              <tr>
                <th className="text-start p-3">Email</th>
                <td className="border p-3">{selectedUser.email}</td>
              </tr>
              <tr>
                <th className="text-start p-3">Phone</th>
                <td className="border p-3">{selectedUser.phone}</td>
              </tr>
              <tr>
                <th className="text-start p-3">WhatsApp No</th>
                <td className="border p-3">{selectedUser.whatsapp_no}</td>
              </tr>
              <tr>
                <th className="text-start p-3">Date of Birth</th>
                <td className="border p-3">
                  {selectedUser.dob
                    ? new Date(selectedUser.dob).toLocaleDateString()
                    : ""}
                </td>
              </tr>
              <tr>
                <th className="text-start p-3">Gender</th>
                <td className="border p-3">{selectedUser.gender}</td>
              </tr>
              <tr>
                <th className="text-start p-3">Address</th>
                <td className="border p-3">{selectedUser.address}</td>
              </tr>
              <tr>
                <th className="text-start p-3">Relative Name</th>
                <td className="border p-3">{selectedUser.relative_name}</td>
              </tr>
              <tr>
                <th className="text-start p-3">Date of Admission</th>
                <td className="border p-3">
                  {selectedUser.date_of_admission
                    ? new Date(selectedUser.date_of_admission).toLocaleDateString()
                    : ""}
                </td>
              </tr>
              <tr>
                <th className="text-start p-3">Ward Name</th>
                <td className="border p-3">{selectedUser.ward_name || "N/A"}</td>
              </tr>
              <tr>
                <th className="text-start p-3">User Role</th>
                <td className="border p-3">
                  {{
                    1: "SuperAdmin",
                    2: "BranchAdmin",
                    3: "BranchOperator",
                    4: "Patient",
                  }[selectedUser.isRole] || "N/A"}
                </td>
              </tr>
            </>
          ) : (
            <tr>
              <td colSpan="2" className="text-center">
                No data available
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
        ? "Your patient report is being downloaded... / आपका patient रिपोर्ट डाउनलोड हो रहा है..."
        : "Download patient registered report"}
    </button>
  </div>

      </CommonModal>

      <CommonModal
        isOpen={showEditModal}
        title={"Update Patient Registration Data"}
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
                      <Label>Name</Label>
                      <Input
                        type="text"
                        placeholder="Name"
                        value={editData.name}
                        onChange={(e) =>
                          setEditData({ ...editData, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <Label>Relative Name</Label>
                      <Input
                        type="text"
                        placeholder="Relative Name"
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

                  <div className="form-group col-md-6">
                    <Label>Gender</Label>
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
                      <Label>Phone</Label>
                      <Input
                        type="text"
                        placeholder="Phone"
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
                        Is WhatsApp?
                      </Label>
                    </div>
                    <div className="col-md-5">
                      <Label>WhatsApp No.</Label>
                      <Input
                        type="text"
                        placeholder="WhatsApp No."
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
                      <Label>Email</Label>
                      <Input
                        type="email"
                        placeholder="Email"
                        value={editData.email}
                        onChange={(e) =>
                          setEditData({ ...editData, email: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-md-6 d-flex align-items-end gap-4">
                      <Label>Date of Birth</Label>
                      <DatePicker
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
                  <Label>Address</Label>
                  <Input
                    type="textarea"
                    rows="3"
                    placeholder="Address"
                    value={editData.address}
                    onChange={(e) =>
                      setEditData({ ...editData, address: e.target.value })
                    }
                  ></Input>

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
                        "Update"
                      )}
                    </Button>
                    <Button
                      color="primary"
                      type="button"
                      onClick={() => setShowEditModal(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </Form>
              </div>
            </div>
          </div>
        )}
      </CommonModal>

      {/* Readmission/Re-register modal pass ward name and type to backend for re-enter user registration field */}
      <CommonModal
        isOpen={reregisterModal}
        title={"Re-Registeration User"}
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
                  "Re-Admission"
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
