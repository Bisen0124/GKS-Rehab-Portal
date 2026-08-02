import React, { Fragment, useState, useEffect, useRef } from "react";
import {
  patientPersonalInformation,
} from "../../Constant";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Form,
  FormGroup,
  Label,
  Input,
  InputGroup,
  Button,
  Table,
  Spinner,
} from "reactstrap";
import CommonModal from "../UiKits/Modals/common/modal";
import HeaderCard from "../Common/Component/HeaderCard";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";

//Calculate age by DOB custom hook
import useCalculateAge from "../../CustomHook/useCalculateAge";

//Show patient/user common info like name, age and DOB by custom hook
import PatientCommonInfo from "../../CustomHook/PatientCommonInfo";

import { useBranch } from "../../contexts/BranchContext";
import { useLang } from "../../contexts/LangContext";
import { getTranslation } from "../../utils/translator";

const BASE_URL = "https://gks-yjdc.onrender.com";

const initialFormData = {
  date_of_form_filling: "",
  occupation: "",
  father_name: "",
  father_occupation: "",
  marital_status: "",
  religion: "",
  duration_of_interview: "",
  living_situation: "",
};

//Pull a scalar error message out of any backend response shape (message, error, errors[])
const extractErrorMessage = (result, response) => {
  if (!result) return `Request failed with status ${response?.status || "unknown"}`;
  if (result.message) return result.message;
  if (result.error) return result.error;
  if (Array.isArray(result.errors) && result.errors.length) {
    return result.errors
      .map((e) => (typeof e === "string" ? e : e.message || JSON.stringify(e)))
      .join(", ");
  }
  return `Request failed with status ${response?.status || "unknown"}`;
};

function PersonalDetails() {
  const { lang } = useLang();
  const { selectedBranch } = useBranch();
  const branchId =
    selectedBranch?.branch_id || selectedBranch?.id || selectedBranch || "";

  console.log("branchId =>", branchId);

  // ─── Modal states ────────────────────────────────────────────────────────────
  const [modal, setModal] = useState(false);         // Create / Edit modal
  const [viewModal, setViewModal] = useState(false); // View (read-only) modal

  // ─── Loading states ───────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [stillLoading, setstillLoading] = useState(true);
  const [viewLoading, setViewLoading] = useState(false);

  // ─── Selected user for PatientCommonInfo header ───────────────────────────────
  const [selectedUser, setSelectedUser] = useState(null);
  const dob = selectedUser?.dob;
  const patientCalAge = useCalculateAge(dob);

  // ─── View-modal data ──────────────────────────────────────────────────────────
  const [viewData, setViewData] = useState(null);

  // ─── Create / Edit form state ─────────────────────────────────────────────────
  const [formData, setFormData] = useState(initialFormData);
  const [isEditMode, setIsEditMode] = useState(false);
  const [personalDetailsId, setPersonalDetailsId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  // ─── Table 1 – Registered Patient List ───────────────────────────────────────
  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [data, setData] = useState([]);

  const handleSearchChange = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchText(value);
    setFilteredData(data.filter((item) => item.name.toLowerCase().includes(value)));
  };

  // ─── Table 2 – All PD Entries List ───────────────────────────────────────────
  const [pdListSearchText, setPdListSearchText] = useState("");
  const [allPDEntries, setAllPDEntries] = useState([]);
  const [pdFilterData, setPdFilterData] = useState([]);

  const handlePDListSearchChange = (e) => {
    const value = e.target.value.toLowerCase();
    setPdListSearchText(value);
    const filtered = allPDEntries.filter((item) =>
      item.name?.toLowerCase().includes(value) ||
      item.gks_id?.toLowerCase().includes(value) ||
      item.personal_details_id?.toString().includes(value) ||
      item.user_id?.toString().includes(value)
    );
    setPdFilterData(filtered);
  };

  // ─── Common auth headers ──────────────────────────────────────────────────────
  const getAuthHeaders = () => {
    const token = localStorage.getItem("Authorization");
    if (!branchId) {
      console.warn("PersonalDetails: no branchId resolved from selectedBranch =>", selectedBranch);
    }
    return {
      "Content-Type": "application/json",
      Authorization: `${token}`,
      "x-target-branch": branchId,
    };
  };

  // ─── Fetch Table 1 (registered users) ────────────────────────────────────────
  const fetchUsers = () => {
    if (!branchId) return;
    const token = localStorage.getItem("Authorization");

    fetch(`${BASE_URL}/api/users?branch_id=${branchId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch user details");
        return response.json();
      })
      .then((res) => {
        const users = res.data || [];
        const formatted = users.map((user) => {
          const admitDate = user.recent_admit_date ? new Date(user.recent_admit_date) : null;
          const CBTDate = user.recent_cbt_date ? new Date(user.recent_cbt_date) : null;

          let isCBTCompleted = false;
          let userStatus = (
            <p className="badge bg-warning text-dark p-2">
              {getTranslation("Pending/लंबित", lang)}
            </p>
          );

          if (admitDate && CBTDate && admitDate > CBTDate) {
            isCBTCompleted = true;
            userStatus = (
              <p className="badge bg-success p-2">
                {getTranslation("Completed/पुरा होना।", lang)}
              </p>
            );
          }

          return {
            id: user.user_id,
            gks_id: user.gks_id || "N/A",
            name: user.name,
            status: userStatus,
            isCBTCompleted,
            dischargeStatus: user.discharge_status,
            dischargeStatusText: user.discharge_status_text,
            isReadmission: user.is_readmission,
            recent_cbt_id: user.recent_cbt_id,
          };
        });

        setTimeout(() => {
          setData(formatted);
          setFilteredData(formatted);
          setstillLoading(false);
        }, 1000);
      })
      .catch((error) => {
        console.error("Error fetching PD user data:", error);
        setstillLoading(true);
      });
  };

  // ─── Fetch Table 2 (all PD entries) ──────────────────────────────────────────
  const fetchAllPDEntries = () => {
    if (!branchId) return;
    const token = localStorage.getItem("Authorization");

    fetch(`${BASE_URL}/api/personal-details/all-entries`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`,
        "x-target-branch": branchId,
      },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch PD entries");
        return response.json();
      })
      .then((res) => {
        const entries = res.data || [];

        const formatted = entries.map((item) => ({
          personal_details_id: item.personal_details_id,
          user_id: item.user?.user_id || item.user_id,
          name: item.user?.name || item.name || "N/A",
          gks_id: item.user?.gks_id || item.gks_id || "N/A",
          phone: item.user?.phone || item.phone || "N/A",
          email: item.user?.email || item.email || "N/A",
          status: item.status || "Completed",
          date_of_form_filling: item.date_of_form_filling || "",
          occupation: item.occupation || "",
          father_name: item.father_name || "",
          father_occupation: item.father_occupation || "",
          marital_status: item.marital_status || "",
          religion: item.religion || "",
          duration_of_interview: item.duration_of_interview || "",
          living_situation: item.living_situation || "",
        }));

        setAllPDEntries(formatted);
        setPdFilterData(formatted);
      })
      .catch((error) => {
        console.error("Error fetching PD entries:", error);
      });
  };

  useEffect(() => {
    fetchUsers();
    fetchAllPDEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  // ─── Table 1 columns (Registered Patient List) ───────────────────────────────
  const tableColumns = [
    {
      name: `${getTranslation("User ID/उपयोगकर्ता आईडी", lang)}`,
      selector: (row) => row.id,
      sortable: true,
      center: true,
    },
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
      cell: (row) => (
        <span
          style={{
            color: row.disabled ? "#999" : "#000",
            fontStyle: row.disabled ? "italic" : "normal",
          }}
        >
          {row.name} {row.disabled && "(disabled)"}
        </span>
      ),
    },
    {
      name: `${getTranslation("Status/स्थिति", lang)}`,
      selector: (row) => row.status,
      sortable: true,
      cell: (row) => (
        <span style={{ color: row.disabled ? "#999" : "#000" }}>
          {row.status}
        </span>
      ),
    },
    {
      name: `${getTranslation("Action/क्रिया", lang)}`,
      center: true,
      cell: (row) => {
        if (row.dischargeStatus === 1) return null;

        return (
          <div className="d-flex gap-2">
            {row.dischargeStatus === 0 && row.isReadmission === 1 && (
              <span
                style={{ cursor: "pointer" }}
                title={getTranslation(
                  "Readmission CBT Form/पुनः प्रवेश सीबीटी फॉर्म",
                  lang
                )}
              >
                ✏️
              </span>
            )}

            {row.dischargeStatus === 0 && row.isReadmission === 0 && (
              row.isCBTCompleted ? (
                <>
                  <span
                    onClick={() => editPDHandler(row.id)}
                    style={{ cursor: "pointer" }}
                    title={getTranslation(
                      "Edit Personal Data Form/व्यक्तिगत डेटा फ़ॉर्म संपादित करें",
                      lang
                    )}
                  >
                    ✏️
                  </span>
                  <span
                    onClick={() => deletePDHandler(row.id)}
                    style={{ cursor: "pointer" }}
                    title={getTranslation(
                      "Delete Personal Data Form/व्यक्तिगत डेटा फ़ॉर्म हटाएँ",
                      lang
                    )}
                  >
                    🗑️
                  </span>
                </>
              ) : (
                <span
                  onClick={() => createPDHandler(row.id)}
                  style={{ cursor: "pointer" }}
                  title={getTranslation(
                    "Create Personal Data Form/व्यक्तिगत डेटा फ़ॉर्म बनाएँ",
                    lang
                  )}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </span>
              )
            )}
          </div>
        );
      },
    },
  ];

  // ─── Table 2 columns (All PD Entries List) ───────────────────────────────────
  const tablePDPatientListColumns = [
    {
      name: `${getTranslation("User ID/उपयोगकर्ता आईडी", lang)}`,
      selector: (row) => row.user_id,
      sortable: true,
      center: true,
    },
    {
      name: "PD ID/व्यक्तिगत विवरण आईडी",
      selector: (row) => row.personal_details_id,
      sortable: true,
      center: true,
    },
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
      cell: (row) => (
        <span
          style={{
            color: row.disabled ? "#999" : "#000",
            fontStyle: row.disabled ? "italic" : "normal",
          }}
        >
          {row.name} {row.disabled && "(disabled)"}
        </span>
      ),
    },
    {
      name: `${getTranslation("Status/स्थिति", lang)}`,
      selector: (row) => row.status,
      sortable: true,
      cell: (row) => (
        <span style={{ color: row.disabled ? "#999" : "#000" }}>
          <p className="badge bg-success p-2">PD {row.status}</p>
        </span>
      ),
    },
    {
      name: `${getTranslation("Action/क्रिया", lang)}`,
      center: true,
      cell: (row) => (
        <div className="d-flex gap-2">
          {/* View */}
          <span
            onClick={() => viewPDToggle(row.user_id)}
            style={{ cursor: "pointer" }}
            title={getTranslation("View/देखना", lang)}
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
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </span>

          {/* Edit */}
          <span
            onClick={() => editPDHandler(row.user_id)}
            style={{ cursor: "pointer", marginLeft: "10px" }}
            title={getTranslation("Edit/संपादन करना", lang)}
          >
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
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </span>

          {/* Delete */}
          <span
            onClick={() => deletePDHandler(row.user_id)}
            style={{ cursor: "pointer", marginLeft: "10px" }}
            title={getTranslation(
              "Delete Personal Data Form/व्यक्तिगत डेटा फ़ॉर्म हटाएँ",
              lang
            )}
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
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </span>
        </div>
      ),
    },
  ];

  // ─── View PD Toggle ───────────────────────────────────────────────────────────
  const viewPDToggle = async (userId) => {
    if (!userId) return;
    setViewModal(true);
    setViewLoading(true);
    setViewData(null);

    try {
      const response = await fetch(
        `${BASE_URL}/api/personal-details/latest-assessment/${userId}`,
        { method: "GET", headers: getAuthHeaders() }
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch Personal Details");
      }
      setViewData(result.data || null);
    } catch (error) {
      console.error("View fetch error:", error);
      Swal.fire({
        icon: "error",
        title: getTranslation("Error/त्रुटि", lang),
        text: error.message,
      });
      setViewModal(false);
    } finally {
      setViewLoading(false);
    }
  };

  const closeViewModal = () => {
    setViewModal(false);
    setViewData(null);
  };

  // ─── Reset form ───────────────────────────────────────────────────────────────
  const resetForm = () => {
    setFormData(initialFormData);
    setIsEditMode(false);
    setPersonalDetailsId(null);
  };

  // ─── Fetch user common info (for form header) ─────────────────────────────────
  const fetchUserCommonInfo = async (userId) => {
    const token = localStorage.getItem("Authorization");
    const branch_id = selectedBranch;
    try {
      const response = await fetch(
        `${BASE_URL}/api/users/${userId}?branch_id=${branch_id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error("User fetch failed");
      if (result.success && result.data && result.data.length > 0) {
        setSelectedUser(result.data[0]);
      } else {
        console.error("No user found in response");
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  // ─── CREATE flow ──────────────────────────────────────────────────────────────
  const createPDHandler = async (userId = null) => {
    resetForm();
    setCurrentUserId(userId);
    setModal(true);
    if (userId) await fetchUserCommonInfo(userId);
  };

  // ─── EDIT flow ────────────────────────────────────────────────────────────────
  const editPDHandler = async (userId) => {
    setModal(true);
    setIsEditMode(true);
    setCurrentUserId(userId);
    await fetchUserCommonInfo(userId);

    try {
      const response = await fetch(
        `${BASE_URL}/api/personal-details/latest-assessment/${userId}`,
        { method: "GET", headers: getAuthHeaders() }
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch latest Personal Details assessment");
      }

      const record = result.data || {};
      setPersonalDetailsId(record.personal_details_id);
      setFormData({
        date_of_form_filling: record.date_of_form_filling
          ? record.date_of_form_filling.split("T")[0]
          : "",
        occupation: record.occupation || "",
        father_name: record.father_name || "",
        father_occupation: record.father_occupation || "",
        marital_status: record.marital_status || "",
        religion: record.religion || "",
        duration_of_interview: record.duration_of_interview || "",
        living_situation: record.living_situation || "",
      });
    } catch (error) {
      console.error("Edit fetch error:", error);
      Swal.fire({
        icon: "error",
        title: getTranslation("Error/त्रुटि", lang),
        text:
          error.message ||
          getTranslation(
            "Unable to load Personal Details form/व्यक्तिगत डेटा फ़ॉर्म लोड नहीं हो सका",
            lang
          ),
      });
      closeAllModal();
    }
  };

  // ─── Generic controlled-input handler ────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ─── CREATE / UPDATE submit ───────────────────────────────────────────────────
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formData.date_of_form_filling) {
      Swal.fire({
        icon: "warning",
        title: getTranslation("Missing field/आवश्यक जानकारी छूट गई", lang),
        text: getTranslation(
          "Date of Form Filling is required/फॉर्म भरने की तिथि आवश्यक है",
          lang
        ),
      });
      return;
    }

    setIsLoading(true);
    try {
      const isUpdate = isEditMode && personalDetailsId;
      const url = isUpdate
        ? `${BASE_URL}/api/personal-details/update-assessment/${personalDetailsId}`
        : `${BASE_URL}/api/personal-details/create-assessment`;

      const payload = isUpdate
        ? { ...formData }
        : { user_id: currentUserId, ...formData };

      const response = await fetch(url, {
        method: isUpdate ? "PUT" : "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      console.log("Status:", response.status);
      console.log("Payload Sent:", payload);
      console.log("Response:", result);

      if (!response.ok) {
        throw new Error(
          result.message || result.error || JSON.stringify(result)
        );
      }

      Swal.fire({
        icon: "success",
        title: getTranslation("Success/सफलता", lang),
        text: isUpdate
          ? getTranslation(
              "Personal Details updated successfully/व्यक्तिगत विवरण सफलतापूर्वक अद्यतन किया गया",
              lang
            )
          : getTranslation(
              "Personal Details created successfully/व्यक्तिगत विवरण सफलतापूर्वक बनाया गया",
              lang
            ),
        timer: 1800,
        showConfirmButton: false,
      });

      closeAllModal();
      fetchUsers();
      fetchAllPDEntries();
    } catch (error) {
      console.error("Submit error:", error);
      Swal.fire({
        icon: "error",
        title: getTranslation("Error/त्रुटि", lang),
        text: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── DELETE flow ──────────────────────────────────────────────────────────────
  const deletePDHandler = async (userId) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: getTranslation("Are you sure?/क्या आप सुनिश्चित हैं?", lang),
      text: getTranslation(
        "This will delete the Personal Details form for this patient./यह इस रोगी के व्यक्तिगत विवरण फ़ॉर्म को हटा देगा।",
        lang
      ),
      showCancelButton: true,
      confirmButtonText: getTranslation("Yes, delete it/हाँ, हटाएँ", lang),
      cancelButtonText: getTranslation("Cancel/रद्द करें", lang),
      confirmButtonColor: "#d33",
    });

    if (!confirm.isConfirmed) return;

    try {
      const lookupResponse = await fetch(
        `${BASE_URL}/api/personal-details/latest-assessment/${userId}`,
        { method: "GET", headers: getAuthHeaders() }
      );
      const lookupResult = await lookupResponse.json();
      if (!lookupResponse.ok || !lookupResult.success || !lookupResult.data) {
        throw new Error(
          lookupResult.message || "No Personal Details assessment found to delete"
        );
      }

      const idToDelete = lookupResult.data.personal_details_id;

      const deleteResponse = await fetch(
        `${BASE_URL}/api/personal-details/delete-assessment/${idToDelete}`,
        { method: "DELETE", headers: getAuthHeaders() }
      );
      const deleteResult = await deleteResponse.json();
      if (!deleteResponse.ok || !deleteResult.success) {
        throw new Error(
          deleteResult.message || "Failed to delete Personal Details assessment"
        );
      }

      Swal.fire({
        icon: "success",
        title: getTranslation("Deleted/हटाया गया", lang),
        text: getTranslation(
          "Personal Details form deleted successfully/व्यक्तिगत विवरण फ़ॉर्म सफलतापूर्वक हटाया गया",
          lang
        ),
        timer: 1800,
        showConfirmButton: false,
      });

      fetchUsers();
      fetchAllPDEntries();
    } catch (error) {
      console.error("Delete error:", error);
      Swal.fire({
        icon: "error",
        title: getTranslation("Error/त्रुटि", lang),
        text: error.message,
      });
    }
  };

  // ─── Close create/edit modal ──────────────────────────────────────────────────
  const closeAllModal = () => {
    setModal(false);
    setSelectedUser(null);
    setCurrentUserId(null);
    resetForm();
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <Fragment>

      {/* ── Table 1: Registered Patient List ─────────────────────────────────── */}
      <Container fluid={true} className="datatables">
        <Row>
          <Col sm="12">
            <CardBody>
              <Card>
                <CardBody>
                  <div className="d-flex pb-2 justify-content-between">
                    <HeaderCard
                      title={getTranslation(
                        "Registered Patient List/पंजीकृत रोगी सूची",
                        lang
                      )}
                      className="p-0"
                    />
                  </div>
                  <div className="row pb-2">
                    <div className="col-md-4">
                      <InputGroup>
                        <Input
                          className="form-control"
                          type="text"
                          placeholder={getTranslation(
                            "Search......./खोज.......",
                            lang
                          )}
                          value={searchText}
                          onChange={handleSearchChange}
                        />
                        <span className="input-group-text">
                          <i className="fa fa-search" />
                        </span>
                      </InputGroup>
                    </div>
                  </div>
                  {stillLoading ? (
                    <div className="loading-text">
                      {getTranslation(
                        "Data is fetching from server. Please wait.../सर्वर से डेटा प्राप्त किया जा रहा है। कृपया प्रतीक्षा करें...",
                        lang
                      )}
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
                      conditionalRowStyles={[
                        {
                          when: (row) => row.disabled,
                          style: {
                            backgroundColor: "#f5f5f5",
                            color: "#999",
                            pointerEvents: "none",
                          },
                        },
                      ]}
                    />
                  )}
                </CardBody>
              </Card>

              {/* ── Table 2: All PD Entries List ──────────────────────────────── */}
              <Card>
                <CardBody>
                  <div className="d-flex pb-2 justify-content-between">
                    <HeaderCard
                      title={getTranslation(
                        "All Patient Personal Details (PD) List/सभी रोगी व्यक्तिगत विवरण (पीडी) सूची",
                        lang
                      )}
                      className="p-0"
                    />
                  </div>
                  <div className="row pb-2">
                    <div className="col-md-4">
                      <InputGroup>
                        <Input
                          className="form-control"
                          type="text"
                          placeholder={getTranslation(
                            "Search......./खोज.......",
                            lang
                          )}
                          value={pdListSearchText}
                          onChange={handlePDListSearchChange}
                        />
                        <span className="input-group-text">
                          <i className="fa fa-search" />
                        </span>
                      </InputGroup>
                    </div>
                  </div>
                  {stillLoading ? (
                    <div className="loading-text">
                      {getTranslation(
                        "Data is fetching from server. Please wait.../सर्वर से डेटा लिया जा रहा है। कृपया इंतज़ार करें...",
                        lang
                      )}
                    </div>
                  ) : (
                    <DataTable
                      data={pdFilterData}
                      columns={tablePDPatientListColumns}
                      striped
                      center
                      highlightOnHover
                      pagination
                      persistTableHead
                      conditionalRowStyles={[
                        {
                          when: (row) => row.disabled,
                          style: {
                            backgroundColor: "#f5f5f5",
                            color: "#999",
                            pointerEvents: "none",
                          },
                        },
                      ]}
                    />
                  )}
                </CardBody>
              </Card>
            </CardBody>
          </Col>
        </Row>
      </Container>

      {/* ── Create / Edit PD Form Modal ────────────────────────────────────────── */}
      <CommonModal
        isOpen={modal}
        title={
          isEditMode
            ? getTranslation(
                "Edit Personal Information/व्यक्तिगत जानकारी संपादित करें",
                lang
              )
            : getTranslation(patientPersonalInformation, lang)
        }
        toggler={closeAllModal}
        maxWidth="1200px"
      >
        <div className="cbt__wrapper">
          <Form className="theme-form" onSubmit={handleFormSubmit}>
            <PatientCommonInfo
              selectedUser={selectedUser}
              labels={{
                name: getTranslation("Patient name/प्रयासक का नाम :", lang),
                sex: getTranslation("Gender/प्रयासक का लिंग :", lang),
                age: getTranslation("Age/प्रयासक का उम्र :", lang),
                date_of_admission: getTranslation(
                  "Date of Admission/प्रवेश की तिथि :",
                  lang
                ),
                ageValue: patientCalAge,
              }}
            />

            <div className="row">
              <div className="col-md-6">
                <FormGroup className="form-group">
                  <Label>
                    {getTranslation(
                      "Date of Form Filling / फॉर्म भरने की तिथि",
                      lang
                    )}
                  </Label>
                  <Input
                    type="date"
                    name="date_of_form_filling"
                    value={formData.date_of_form_filling}
                    onChange={handleInputChange}
                    required
                  />
                </FormGroup>
              </div>
              <div className="col-md-6">
                <FormGroup className="form-group">
                  <Label>
                    {getTranslation(
                      "Duration of Interview / साक्षात्कार की अवधि",
                      lang
                    )}
                  </Label>
                  <Input
                    type="text"
                    name="duration_of_interview"
                    placeholder={getTranslation(
                      "e.g. 45 minutes/उदा. 45 मिनट",
                      lang
                    )}
                    value={formData.duration_of_interview}
                    onChange={handleInputChange}
                  />
                </FormGroup>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <FormGroup className="form-group">
                  <Label>
                    {getTranslation("Occupation / व्यवसाय", lang)}
                  </Label>
                  <Input
                    type="text"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleInputChange}
                  />
                </FormGroup>
              </div>
              <div className="col-md-6">
                <FormGroup className="form-group">
                  <Label>
                    {getTranslation("Marital Status / वैवाहिक स्थिति", lang)}
                  </Label>
                  <Input
                    type="select"
                    name="marital_status"
                    value={formData.marital_status}
                    onChange={handleInputChange}
                  >
                    <option value="">
                      {getTranslation("Select/चुनें", lang)}
                    </option>
                    <option value="Single">
                      {getTranslation("Single/अविवाहित", lang)}
                    </option>
                    <option value="Married">
                      {getTranslation("Married/विवाहित", lang)}
                    </option>
                    <option value="Divorced">
                      {getTranslation("Divorced/तलाकशुदा", lang)}
                    </option>
                    <option value="Widowed">
                      {getTranslation("Widowed/विधवा/विधुर", lang)}
                    </option>
                    <option value="Separated">
                      {getTranslation("Separated/अलग हुआ", lang)}
                    </option>
                  </Input>
                </FormGroup>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <FormGroup className="form-group">
                  <Label>
                    {getTranslation("Father's Name / पिता का नाम", lang)}
                  </Label>
                  <Input
                    type="text"
                    name="father_name"
                    value={formData.father_name}
                    onChange={handleInputChange}
                  />
                </FormGroup>
              </div>
              <div className="col-md-6">
                <FormGroup className="form-group">
                  <Label>
                    {getTranslation("Father's Occupation / पिता का पेशा", lang)}
                  </Label>
                  <Input
                    type="text"
                    name="father_occupation"
                    value={formData.father_occupation}
                    onChange={handleInputChange}
                  />
                </FormGroup>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <FormGroup className="form-group">
                  <Label>
                    {getTranslation("Living Situation / रहने की स्थिति", lang)}
                  </Label>
                  <Input
                    type="textarea"
                    name="living_situation"
                    value={formData.living_situation}
                    onChange={handleInputChange}
                  />
                </FormGroup>
              </div>
              <div className="col-md-6">
                <FormGroup className="form-group">
                  <Label>
                    {getTranslation("Religion / धर्म", lang)}
                  </Label>
                  <Input
                    type="text"
                    name="religion"
                    value={formData.religion}
                    onChange={handleInputChange}
                  />
                </FormGroup>
              </div>
            </div>

            <div className="d-flex gap-3 mt-4 mb-3 px-3">
              <Button color="primary" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  />
                ) : isEditMode ? (
                  getTranslation(
                    "Update Personal Data Form/व्यक्तिगत डेटा फ़ॉर्म अद्यतन करें",
                    lang
                  )
                ) : (
                  getTranslation(
                    "Create Personal Data Form/व्यक्तिगत डेटा फ़ॉर्म बनाएँ",
                    lang
                  )
                )}
              </Button>
              <Button
                color="secondary"
                type="button"
                onClick={closeAllModal}
                disabled={isLoading}
              >
                {getTranslation("Cancel/रद्द करें", lang)}
              </Button>
            </div>
          </Form>
        </div>
      </CommonModal>

      {/* ── View PD Modal (read-only) ──────────────────────────────────────────── */}
      <CommonModal
        isOpen={viewModal}
        title={getTranslation(
          "View Personal Details / व्यक्तिगत विवरण देखें",
          lang
        )}
        toggler={closeViewModal}
        maxWidth="900px"
      >
        <Col sm="12">
          <div className="table-responsive p-4">
            <h4
              style={{
                textAlign: "center",
                textDecoration: "underline",
                padding: "20px 0",
              }}
            >
              {getTranslation(
                "Personal Details Form / व्यक्तिगत विवरण फ़ॉर्म",
                lang
              )}
            </h4>

            <Table size="sm" className="table-bordered">
              <tbody style={{ fontSize: "14px" }}>
                {viewLoading ? (
                  <tr>
                    <td colSpan="2" className="text-center py-4">
                      <Spinner className="spinner-border" />
                    </td>
                  </tr>
                ) : viewData ? (
                  <>
                    {[
                      {
                        label: getTranslation(
                          "Date of Form Filling / फॉर्म भरने की तिथि",
                          lang
                        ),
                        value: viewData.date_of_form_filling
                          ? new Date(
                              viewData.date_of_form_filling
                            ).toLocaleDateString("en-IN")
                          : "—",
                      },
                      {
                        label: getTranslation(
                          "Duration of Interview / साक्षात्कार की अवधि",
                          lang
                        ),
                        value: viewData.duration_of_interview || "—",
                      },
                      {
                        label: getTranslation("Occupation / व्यवसाय", lang),
                        value: viewData.occupation || "—",
                      },
                      {
                        label: getTranslation(
                          "Marital Status / वैवाहिक स्थिति",
                          lang
                        ),
                        value: viewData.marital_status || "—",
                      },
                      {
                        label: getTranslation(
                          "Father's Name / पिता का नाम",
                          lang
                        ),
                        value: viewData.father_name || "—",
                      },
                      {
                        label: getTranslation(
                          "Father's Occupation / पिता का पेशा",
                          lang
                        ),
                        value: viewData.father_occupation || "—",
                      },
                      {
                        label: getTranslation("Religion / धर्म", lang),
                        value: viewData.religion || "—",
                      },
                      {
                        label: getTranslation(
                          "Living Situation / रहने की स्थिति",
                          lang
                        ),
                        value: viewData.living_situation || "—",
                      },
                    ].map((item, i) => (
                      <tr key={i}>
                        <td className="fw-semibold p-3" style={{ width: "40%" }}>
                          {item.label}
                        </td>
                        <td className="p-3">{item.value}</td>
                      </tr>
                    ))}
                  </>
                ) : (
                  <tr>
                    <td colSpan="2" className="text-center py-4">
                      {getTranslation(
                        "No data available / कोई डेटा मौजूद नहीं",
                        lang
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          <div style={{ margin: "0 20px 20px 20px" }}>
            <Button color="secondary" onClick={closeViewModal}>
              {getTranslation("Close / बंद करें", lang)}
            </Button>
          </div>
        </Col>
      </CommonModal>
    </Fragment>
  );
}

export default PersonalDetails;