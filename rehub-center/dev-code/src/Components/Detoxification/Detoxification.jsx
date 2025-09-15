import React, { Fragment, useState, useEffect, useRef } from "react";
import {
  DatePickers,
  SelectDateWithTime,
  CustomDateFormat,
  TodayButton,
  DisableDaysOfWeek,
  SpecificDateRange,
  MinDate,
  MaxDate,
  DateRange,
  InlineVersion,
  DisableDatepicker,
  SelectTimeOnly,
  Default,
  patientFirstAssessment,
  dateOfAdmission,
  dateOfAssessment,
  patientName,
  patientSex,
  patientAge,
  dependentTo,
  substanceUsePattern,
  last30DaysQuantity,
  tableNumber,
  genralPhysicalExamination,
  Observation,
  anyMedicalHistory,
  anyBloodTransfusionHistory,
  mentionIfAny,
  tableNumber2,
  complicationDetails,
  yes,
  no,
  ulcers,
  respiratoryProblem,
  jaundice,
  Haematemesis,
  mentionIfAny2,
  tableNumber3,
  neurological,
  yes1,
  male,
  female,
  other,
  no1,
  otherAbdominalComplaints,
  cardiovascular,
  seizure,
  epilepsy,
  delirium,
  shaking,
  memory,
  neuropathy,
  blackout,
  consent,
  name,
  relationship,
  signature,
  anyOtherFindings,
  prepared,
  SexualHistory,
  SexualHistoryID,
  SexualHistoryanswer,
  SexualHistoryquestion,
  SexuaQuesData,
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
  Table,
  InputGroup,
  Button,
} from "reactstrap";
import { H5 } from "../../AbstractElements";
import DatePicker from "react-datepicker";

import HeaderCard from "../Common/Component/HeaderCard";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2"; // ✅ Make sure this is imported at the top

import { Data } from "../UiKits/Spinners/SpinnerData";
import { toast } from "react-toastify";

//Calculate age by DOB custom hook
import useCalculateAge from "../../CustomHook/useCalculateAge";
import CommonModal from "../UiKits/Modals/common/modal";

//editPFA download PDF library
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import html2pdf from "html2pdf.js";

//Show pateint/user common info like name, age and DOB by custom hook
import PatientCommonInfo from "../../CustomHook/PatientCommonInfo";

import { useBranch } from "../../contexts/BranchContext";

const Detoxification = () => {
  //Branches selection
  const { selectedBranch } = useBranch();

  //Downloading view sexual desire form into pdf format
  const pdfRef = useRef();
  //PDf view download pdf code handler
  const [pfaDownload, setpfaDownload] = useState(false);
  const handleDownloadPDF = () => {
    const element = pdfRef.current;
    setpfaDownload(true);

    // Add a temporary class to scale fonts if needed
    element.classList.add("pdf-scale");

    const opt = {
      margin: [10, 10, 10, 10], // top, left, bottom, right
      filename: `user_data_${viewDetoxData?.name}_${viewDetoxData?.user_id}.pdf`,
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

  //Loading spinner
  const [isLoading, setIsLoading] = useState(false);

  //This React hook calculates a user's age based on their date of birth (dob) and returns the age on PFA form by create.
  const [selectedUser, setSelectedUser] = useState(null); // single user

  const dob = selectedUser?.dob; // no [0] anymore
  const patientCalAge = useCalculateAge(dob);

  console.log("DOB", dob);
  console.log("Calculated Age", patientCalAge);

  {
    /*First Table Registered Patient List Start */
  }

  //Search filter on register datalist
  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  //This search filter for above table where we are listing all register user list from user API
  const handleSearchChange = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchText(value);

    const filtered = data.filter((item) =>
      item.name.toLowerCase().includes(value)
    );

    setFilteredData(filtered);
  };

  //Registered Patient data
  const [data, setData] = useState([]);
  const [stillLoading, setstillLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem("Authorization");

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
        if (!response.ok) throw new Error("Failed to fetch FDA user details");
        return response.json();
      })
      .then((res) => {
        const users = res.data || [];

        const formatted = users.map((user) => {
          const admitDate = user.recent_admit_date
            ? new Date(user.recent_admit_date)
            : null;
          const DetoxRecentDate = user.recent_detox_end_date
            ? new Date(user.recent_detox_end_date)
            : null;

            let isDetoxCompleted = false;
          let userStatus = (
            <p className="badge bg-warning text-dark p-2">{"Pending"}</p>
          );
          if (admitDate && DetoxRecentDate && admitDate > DetoxRecentDate) {
             isDetoxCompleted = true;
            userStatus = <p className="badge bg-success p-2">{"Completed"}</p>;
          }

          // const dischargeStatusText = user.discharge_status_text || "Unknown";

          return {
            id: user.user_id,
            gks_id: user.gks_id || "N/A",
            recentDetoxId: user.recent_detox_id,
            name: user.name,
            status: userStatus,
            isDetoxCompleted,
            dischargeStatus: user.discharge_status,
            dischargeStatusText: user.discharge_status_text,
            isReadmission: user.is_readmission,
            // recent_sda_id: user.recent_sda_id,
            // recent_cbt_id: user.recent_cbt_id,
            recent_sha_id: user.recent_sha_id,
          };
        });

        setTimeout(() => {
          setData(formatted);
          setFilteredData(formatted);
          setstillLoading(false);
        }, 1000); // You can reduce this to 1s
      })
      .catch((error) => {
        console.error("Error fetching Sexsual Desire user data:", error);
        setstillLoading(true);
      });
  }, []);

  //Getting registred patient data into table row
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
    {
      name: "Name",
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
      name: "Status",
      selector: (row) => row.status,
      sortable: true,
      cell: (row) => (
        <span style={{ color: row.disabled ? "#999" : "#000" }}>
          {row.status}
        </span>
      ),
    },

    {
      name: "Action",
      center: true,
      cell: (row) => {
        // Hide all actions if discharged
        if (row.dischargeStatus === 1) {
          return null;
        }
        return (
          //Showing action buttons on register user list on FDA page
          <div className="d-flex gap-2">
            {/* Show Edit only if not discharged and readmission */}
            {row.dischargeStatus === 0 && row.isReadmission === 1 && (
              <span
                onClick={() => handleDetoxPrefill(row.recentDetoxId)}
                style={{ cursor: "pointer" }}
                title="Readmission Sexsual Desire Form"
              >
                ✏️
              </span>
            )}

{/* <span
                onClick={() => handleDetoxPrefill(row.recentDetoxId)}
                style={{ cursor: "pointer" }}
                title="Readmission Sexsual Desire Form"
              >
                ✏️
              </span> */}

            {/* Show Create PFA if not discharged and not readmission */}
            {/* {row.dischargeStatus === 0 && row.isReadmission === 0 && (
              <span
                onClick={() => createDetoxificationHandler(row.id)}
                style={{ cursor: "pointer" }}
                title="Create Sexsual Desire From"
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
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="12" y1="8" x2="12" y2="16"></line>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
              </span>
            )} */}


{row.dischargeStatus === 0 && row.isReadmission === 0 && (
  <span
    onClick={() => (row.isDetoxCompleted ? null : createDetoxificationHandler(row.id))}
    style={{
      cursor: row.isDetoxCompleted ? "not-allowed" : "pointer",
      opacity: row.isDetoxCompleted ? 0.5 : 1,
    }}
    title={row.isDetoxCompleted ? "Detox Completed" : "Create Detoxification Form"}
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
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="12" y1="8" x2="12" y2="16"></line>
      <line x1="8" y1="12" x2="16" y2="12"></line>
    </svg>
  </span>
)}
          </div>
        );
      },
    },
  ];
  {
    /*First Table Registered Patient List end */
  }

  {
    /*Second Table Registered Patient List Start */
  }

  //Search filter on register datalist
  const [searchTextSecondTbl, setsearchTextSecondTbl] = useState("");
  const [filteredSecondTblData, setFilteredSecondTblData] = useState([]);
  //This search filter for above table where we are listing all register user list from user API
  const handleSearchSecondTbl = (e) => {
    const value = e.target.value.toLowerCase();
    setsearchTextSecondTbl(value);

    const filteredsecondTbl = dataSecondTbl.filter((item) =>
      item.name.toLowerCase().includes(value)
    );

    setFilteredSecondTblData(filteredsecondTbl);
  };

  //Registered Patient data list in table format
  const [dataSecondTbl, setDataSecondTbl] = useState([]);
  useEffect(() => {
    const token = localStorage.getItem("Authorization");

    if (!selectedBranch) return; // avoid empty branch fetch

    fetch(
      `https://gks-yjdc.onrender.com/api/detoxification/all-entries?branch_id=${selectedBranch}`,
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
          throw new Error("Failed to fetch Detoxification entries");
        }
        return response.json();
      })
      .then((res) => {
        const entries = res.data || [];

        console.log("Detoxification Response =>", res);

        const formatted = entries.map((entry) => {
          const admitDate = entry.admit_date
            ? new Date(entry.admit_date)
            : null;
          const startDate = entry.start_date
            ? new Date(entry.start_date)
            : null;
          const endDate = entry.end_date ? new Date(entry.end_date) : null;

          // ✅ Calculate Age
          let age = "N/A";
          if (entry.dob) {
            const dob = new Date(entry.dob);
            const today = new Date();
            age = today.getFullYear() - dob.getFullYear();
            const m = today.getMonth() - dob.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
              age--;
            }
          }

          // ✅ Status Badge
          let userStatus = (
            <p className="badge bg-warning text-dark p-2">{"Pending"}</p>
          );
          if (entry.status === "Completed") {
            userStatus = <p className="badge bg-success p-2">{"Completed"}</p>;
          }

          return {
            detox_id: entry?.detox_id || "N/A",
            id: entry?.user_id || "N/A",
            gks_id: entry?.gks_id || "N/A",
            name: entry?.name || "N/A",
            phone: entry?.phone || "N/A",
            email: entry?.email || "N/A",
            ward: entry?.ward_name || "N/A",
            branch: entry?.branch_name || "N/A",
            custom_code: entry?.custom_code || "N/A",
            status: userStatus,
            is_detoxified: entry?.is_detoxified || "N/A",
            start_date: startDate
              ? startDate.toISOString().split("T")[0]
              : "N/A",
            end_date: endDate ? endDate.toISOString().split("T")[0] : "N/A",
            start_remark: entry?.start_remark || "N/A",
            end_remark: entry?.end_remark || "N/A",
            admit_date: admitDate
              ? admitDate.toISOString().split("T")[0]
              : "N/A",
            age,
            gender: entry?.gender || "N/A",
          };
        });

        setTimeout(() => {
          setDataSecondTbl(formatted);
          setFilteredSecondTblData(formatted);
          setstillLoading(false);
        }, 1000);
      })
      .catch((error) => {
        console.error("Error fetching Detoxification entries:", error);
        setstillLoading(true);
      });
  }, [selectedBranch]);

  //Getting registred patient data into table row
  const tableColumnsSecoundTbl = [
    {
      name: "User ID",
      selector: (row) => row.id,
      sortable: true,
      center: true,
    },
    {
      name: "Detox ID",
      selector: (row) => row.detox_id,
      sortable: true,
      center: true,
    },
    {
      name: "GKS ID",
      selector: (row) => row.gks_id,
      sortable: true,
      center: true,
    },
    {
      name: "Name",
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
      name: "Email",
      selector: (row) => row.email,
      sortable: true,
      center: true,
    },
    {
      name: "Phone",
      selector: (row) => row.phone,
      sortable: true,
      center: true,
    },

    {
      name: "Status",
      selector: (row) => row.status,
      sortable: true,
      cell: (row) => (
        <span style={{ color: row.disabled ? "#999" : "#000" }}>
          {row.status}
        </span>
      ),
    },
    {
      name: "Action",
      center: true,
      cell: (row) => (
        <div className="d-flex gap-2">
          <>
            <span
              onClick={() => ViewDetoxindividualData(row.detox_id)}
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
            <span
              onClick={() => handleEditDetoxIndividualData(row.detox_id)}
              style={{ cursor: "pointer", marginLeft: "10px" }}
              title="Edit"
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
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </span>
            {/* <span
                onClick={() => handlePFADelete(row.id)}
                style={{ cursor: "pointer", marginLeft: "10px" }}
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
              </span> */}
          </>
        </div>
      ),
    },
  ];

  {
    /*Second Table Registered Patient List End */
  }

  //Create sexual desire form handler start
  const [isopenDetoxCreateForm, SetisopenDetoxCreateForm] = useState(false);
  const createDetoxificationHandler = async (userId = null) => {
    console.log("Sexual Desire =>", userId);
    SetisopenDetoxCreateForm(true);
    if (userId) {
      const token = localStorage.getItem("Authorization");
      const branch_id = selectedBranch;
      try {
        const response = await fetch(
          `https://gks-yjdc.onrender.com/api/users/${userId}?branch_id=${branch_id}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `${token}`,
            },
          }
        );
        const data = await response.json();
        console.log(data);
        if (!response.ok) throw new Error("User fetch failed");
        setSelectedUser(data.data[0]); // instead of `data`
      } catch (error) {
        console.error("Fetch error:", error);
      }
    }
  };

  //Create sexual desire form handler end

  const [formData, setFormData] = useState({
    dateOfAssessment: new Date(),
    is_detoxified: "",
    start_date: "",
    end_date: "",
    start_remark: "",
    end_remark: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAssesmentDateChange = (name, date) => {
    setFormData((prev) => ({
      ...prev,
      [name]: date,
    }));
  };

  // Submit detoxification form handler start
  const handleDetoxSubmit = async (e) => {
    e.preventDefault(); // prevent page reload
    setIsLoading(true);

    try {
      // Build payload for Detoxification
      const payload = {
        user_id: selectedUser?.user_id || selectedUser?.[0]?.user_id, // support object or array
        is_detoxified: formData.is_detoxified === "yes" ? "Yes" : "No",
        start_date: formData.is_detoxified === "yes" ? formData.start_date : "", // only when yes
        end_date: formData.end_date || "",
        start_remark: formData.start_remark || "",
        end_remark: formData.end_remark || "",
        status:
          formData.is_detoxified === "yes" && formData.end_date
            ? "Completed"
            : "Pending",
      };

      console.log("Submitting Detoxification Payload =>", payload);

      // Post create detoxification form data into backend
      const token = localStorage.getItem("Authorization");
      const branch_id = selectedBranch;

      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/detoxification/create-assessment?branch_id=${branch_id}`,
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

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Detoxification Submitted",
          text: "The detoxification form has been submitted successfully.",
        });
      } else {
        console.error("Error Response:", result);
        Swal.fire({
          icon: "error",
          title: "Submission Failed",
          text: result.message || "There was an error submitting the form.",
        });
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Network or server issue occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  // Submit detoxification form handler end

  // View detoxification form data start
  const [viewDetoxDataModal, setDetoxDataModal] = useState(false);
  const [viewDetoxData, setDetoxData] = useState(null);

  const ViewDetoxindividualData = async (detoxId = null) => {
    console.log("View Detoxification =>", detoxId);
    setDetoxDataModal(true);

    if (detoxId) {
      const token = localStorage.getItem("Authorization");
      const branch_id = selectedBranch;

      try {
        const response = await fetch(
          `https://gks-yjdc.onrender.com/api/detoxification/assessment/${detoxId}?branch_id=${branch_id}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `${token}`,
            },
          }
        );

        const data = await response.json();
        if (!response.ok) throw new Error("Detoxification fetch failed");

        const viewData = data.data; // ✅ API returns "data", not "assessment"

        console.log("View Detoxification Data =>", viewData);

        setDetoxData(viewData); // ✅ store into correct state
      } catch (error) {
        console.error("Fetch error:", error);
      }
    }
  };
  // View detoxification form data end

  // Edit detoxification form handler start
  const [editDetoxModal, setEditDetoxModal] = useState(false);
  const [editDetoxData, setEditDetoxData] = useState(null);

  const handleEditDetoxIndividualData = async (detoxId) => {
    setEditDetoxModal(true);

    if (typeof detoxId === "object" && detoxId !== null) {
      detoxId = detoxId.detox_id; // fallback if object passed
    }

    if (!detoxId) {
      console.error("Invalid detoxId provided");
      return;
    }

    console.log("Editing Detox ID =>", detoxId);

    const token = localStorage.getItem("Authorization");
    const branch_id = selectedBranch;

    try {
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/detoxification/assessment/${detoxId}?branch_id=${branch_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Detox fetch error:", data);
        return;
      }

      const latestAssessment = data.data; // API response has `data` not `assessment`

      if (!latestAssessment) {
        console.warn("No assessment found for this detoxId.");
        return;
      }

      // Pre-fill detox data
      setEditDetoxData({
        dateOfAssessment: latestAssessment.admit_date || null, // ISO string from API
        detox_id: latestAssessment.detox_id,
        user_id: latestAssessment.user_id,
        visit_no: latestAssessment.visit_no,
        is_detoxified: latestAssessment.is_detoxified,
        start_date: latestAssessment.start_date
          ? new Date(latestAssessment.start_date).toISOString().split("T")[0]
          : "",
        end_date: latestAssessment.end_date
          ? new Date(latestAssessment.end_date).toISOString().split("T")[0]
          : "",
        start_remark: latestAssessment.start_remark || "",
        end_remark: latestAssessment.end_remark || "",
        status: latestAssessment.status,
        name: latestAssessment.name,
        phone: latestAssessment.phone,
        email: latestAssessment.email,
        dob: latestAssessment.dob,
        gender: latestAssessment.gender,
        address: latestAssessment.address,
        admit_date: latestAssessment.admit_date,
        branch_name: latestAssessment.branch_name,
        ward_name: latestAssessment.ward_name,
      });

      setSelectedUser(latestAssessment); // so PatientCommonInfo also works

      console.log("Detox Prefill Data =>", latestAssessment);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };
  // Edit detoxification form handler end


// Update Detox Form Data Handler start
const updateDetoxHandler = async (e) => {
  e.preventDefault();
  setIsLoading(true);

  // Prepare payload from editDetoxData
  const payload = {
    user_id: editDetoxData?.user_id || "",
    is_detoxified: editDetoxData?.is_detoxified || "",
    start_date: editDetoxData?.start_date
      ? new Date(editDetoxData.start_date).toISOString().split("T")[0]
      : "",
    end_date: editDetoxData?.end_date
      ? new Date(editDetoxData.end_date).toISOString().split("T")[0]
      : "",
    start_remark: editDetoxData?.start_remark || "",
    end_remark: editDetoxData?.end_remark || "",
    status: editDetoxData?.status || "",
  };

  console.log("Update Detox Payload =>", payload);

  try {
    const token = localStorage.getItem("Authorization");
    const detoxId = editDetoxData?.detox_id;
    const branch_id = selectedBranch; // from BranchContext

    if (!detoxId) {
      console.error("No detox_id found for update.");
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: "No detoxification record selected for update.",
      });
      return;
    }

    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/detoxification/update-assessment/${detoxId}?branch_id=${branch_id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    if (response.ok) {
      Swal.fire({
        icon: "success",
        title: "Detoxification Updated",
        text: "The detoxification form has been successfully updated.",
      });
      // Optionally close modal or refresh data here
      setEditDetoxModal(false);
    } else {
      console.error("Error Response:", result);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: result.message || "There was an error submitting the form.",
      });
    }
  } catch (error) {
    console.error("Fetch Error:", error);
    Swal.fire({
      icon: "error",
      title: "Network Error",
      text: "A network or server issue occurred.",
    });
  } finally {
    setIsLoading(false);
  }
};
// Update Detox Form Data Handler end



// ✅ Prefill Detox form handler start
const [DetoxPrefillData, setDetoxPrefillData] = useState({});
const [DetoxPrefillModal, setDetoxPrefillModal] = useState(false);

const handleDetoxPrefill = async (prefillDetoxID = null) => {
  // Normalize ID if object
  if (typeof prefillDetoxID === "object" && prefillDetoxID !== null) {
    prefillDetoxID = prefillDetoxID.detox_id || prefillDetoxID.id;
  }

  // ✅ If no valid ID, stop here
  if (!prefillDetoxID) {
    Swal.fire({
      icon: "warning",
      title: "Missing Detox ID",
      text: "Please provide a valid Detox ID before opening the form.",
    });
    return; // ⛔ stop execution
  }

  console.log("Detox ID For Prefill:", prefillDetoxID);
  const token = localStorage.getItem("Authorization");

  try {
    const branch_id = selectedBranch;
    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/detoxification/assessment/${prefillDetoxID}?branch_id=${branch_id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      }
    );

    const data = await response.json();
    console.log("Raw Detox API Response:", data);

    if (!response.ok) {
      Swal.fire({
        icon: "error",
        title: "Fetch Failed",
        text: data.message || "Unable to fetch detoxification data for prefill.",
      });
      return;
    }

    const latestAssessment = data.data || null;
    if (!latestAssessment) {
      Swal.fire({
        icon: "info",
        title: "No Data Found",
        text: "No detoxification data available for this ID.",
      });
      return;
    }

    // ✅ Open modal only when valid data
    setDetoxPrefillModal(true);

    // ✅ Wrap in array so PatientCommonInfo works (expects [0])
    setSelectedUser([latestAssessment]);

    // ✅ Map Detox-specific fields
    const mappedData = {
      detox_id: latestAssessment.detox_id,
      user_id: latestAssessment.user_id,
      branch_id: latestAssessment.branch_id,
      entry_id: latestAssessment.entry_id,
      visit_no: latestAssessment.visit_no,

      is_detoxified: latestAssessment.is_detoxified || "No",
    

      start_date: latestAssessment?.start_date
      ? new Date(latestAssessment.start_date).toISOString().split("T")[0]
      : "",
    end_date: latestAssessment?.end_date
      ? new Date(latestAssessment.end_date).toISOString().split("T")[0]
      : "",


      start_remark: latestAssessment.start_remark || "",
      end_remark: latestAssessment.end_remark || "",

      status: latestAssessment.status || "",
      isActive: latestAssessment.isActive || 0,

      // User Info
      patient_name: latestAssessment.name || "",
      dob: latestAssessment.dob ? new Date(latestAssessment.dob) : null,
      gender: latestAssessment.gender || "",
      address: latestAssessment.address || "",
      gks_id: latestAssessment.gks_id || "",
      phone: latestAssessment.phone || "",
      email: latestAssessment.email || "",
      branch_name: latestAssessment.branch_name || "",
      custom_code: latestAssessment.custom_code || "",
      admit_date: latestAssessment.admit_date
        ? new Date(latestAssessment.admit_date)
        : null,
      ward_name: latestAssessment.ward_name || "",
    };

    setDetoxPrefillData(mappedData);

    console.log("✅ Mapped Detox Prefill Data:", mappedData);
  } catch (error) {
    console.error("Prefill Detox fetch error:", error);
    Swal.fire({
      icon: "error",
      title: "Network Error",
      text: "Unable to fetch detoxification data due to a network issue.",
    });
  }
};
// ✅ Prefill Detox form handler end



// Utility → return ISO string or null
const toISODate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString(); // full ISO string
};

// Submit detoxification readmission form handler start
const handleDetoxReadmissionSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const startDate =
      DetoxPrefillData.is_detoxified === "yes"
        ? toISODate(DetoxPrefillData.start_date)
        : null;

    const endDate = DetoxPrefillData.end_date
      ? toISODate(DetoxPrefillData.end_date)
      : null;

    // Build payload
    const payload = {
      user_id: selectedUser?.user_id || selectedUser?.[0]?.user_id,
      is_detoxified: DetoxPrefillData.is_detoxified === "yes" ? "Yes" : "No",
      start_date: startDate,
      end_date: endDate,
      start_remark: DetoxPrefillData.start_remark || "",
      end_remark: DetoxPrefillData.end_remark || "",
      status:
        DetoxPrefillData.is_detoxified === "yes" && endDate
          ? "Completed"
          : "Pending",
    };

    console.log("Submitting Detoxification Payload =>", payload);

    const token = localStorage.getItem("Authorization");
    const branch_id = selectedBranch;

    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/detoxification/create-assessment?branch_id=${branch_id}`,
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

    if (response.ok) {
      Swal.fire({
        icon: "success",
        title: "Detoxification Submitted",
        text: "The detoxification form has been submitted successfully.",
      });
    } else {
      console.error("Error Response:", result);
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: result.message || "There was an error submitting the form.",
      });
    }
  } catch (error) {
    console.error("Fetch Error:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Network or server issue occurred.",
    });
  } finally {
    setIsLoading(false);
  }
};
// Submit detoxification readmission form handler end








  //Close all modal handler
  const closeAllModal = () => {
    SetisopenDetoxCreateForm(false);
    setDetoxDataModal(false);
    setEditDetoxModal(false);
    setDetoxPrefillModal(false);
  };
  return (
    <frameElement>
      {/* register user data into data table format start */}
      <Container fluid={true} className="datatables">
        <Row>
          <Col sm="12">
            <CardBody>
              {/* Register pateint list/user list */}
              <Card>
                {/* <HeaderCard title="User Data Table with Multiple Selection" /> */}
                <CardBody>
                  <div class="d-flex pb-2 justify-content-between">
                    <HeaderCard
                      title="Registered Patient List"
                      className="p-0"
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
                          onChange={handleSearchChange}
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
                      // onSelectedRowsChange={handleRowSelected}
                      // selectableRowDisabled={selectableRowDisabled}
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
      {/* register user data into data table format end */}

      {/* Detoxification all user entries data list into data table start */}

      <Container fluid={true} className="datatables">
        <Row>
          <Col sm="12">
            <CardBody>
              {/* Register pateint list/user list */}
              <Card>
                {/* <HeaderCard title="User Data Table with Multiple Selection" /> */}
                <CardBody>
                  <div class="d-flex pb-2 justify-content-between">
                    <HeaderCard
                      title="All Detoxification Patient Lists"
                      className="p-0"
                    />
                  </div>
                  <div className="row pb-2">
                    <div className="col-md-4">
                      <InputGroup>
                        <Input
                          className="form-control"
                          type="text"
                          placeholder="Search......."
                          value={searchTextSecondTbl}
                          onChange={handleSearchSecondTbl}
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
                      data={filteredSecondTblData}
                      columns={tableColumnsSecoundTbl}
                      striped
                      center
                      highlightOnHover
                      pagination
                      persistTableHead
                      // onSelectedRowsChange={handleRowSelected}
                      // selectableRowDisabled={selectableRowDisabled}
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
      {/* Detoxification all user entries data list into data table end */}

      {/* Create and submit Detoxification from start  */}
      <CommonModal
        isOpen={isopenDetoxCreateForm}
        title="Create Detoxification Form"
        toggler={closeAllModal}
        maxWidth="1200px"
      >
        <div className="sd__wrapper">
          <Form className="theme-form" onSubmit={handleDetoxSubmit}>
            {/* Patient name and date of assessment */}
            <PatientCommonInfo
              selectedUser={selectedUser}
              labels={{
                name: "Patient name/प्रयासक का नाम :",
                sex: "Gender/प्रयासक का लिंग :",
                age: "Age/प्रयासक का उम्र :",
                date_of_admission: "Date of Admission/प्रवेश की तिथि :",
                ageValue: patientCalAge,
              }}
            />

            <div className="container mt-4">
              {/*Date of Assessment section/परीक्षण की तारीख :*/}
              <div className="col-md-6">
                <FormGroup className="form-group row">
                  <Label className="col-sm-12 col-form-label  col-xl-6">
                    {dateOfAssessment}
                  </Label>
                  <Col xl="5" sm="12">
                    <div className="input-group">
                      <DatePicker
                        className="form-control digits"
                        selected={formData.dateOfAssessment}
                        onChange={(date) =>
                          handleAssesmentDateChange("dateOfAssessment", date)
                        }
                      />
                    </div>
                  </Col>
                </FormGroup>
              </div>{" "}
              {/*Date of Admission section/प्रवेश की तिथि :*/}
              {/* Detoxified Yes/No */}
              <div className="mb-3">
                <label>Is Detoxified?</label>
                <select
                  id="is_detoxified"
                  name="is_detoxified"
                  className="form-control"
                  value={formData.is_detoxified}
                  onChange={handleChange}
                >
                  <option value="">-- Select --</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              {/* If Yes → Show start_date, end_date */}
              {formData.is_detoxified === "yes" && (
                <>
                  <div className="mb-3">
                    <label htmlFor="start_date">Start Date</label>
                    <input
                      type="date"
                      id="start_date"
                      name="start_date"
                      className="form-control"
                      value={formData.start_date}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="end_date">End Date</label>
                    <input
                      type="date"
                      id="end_date"
                      name="end_date"
                      className="form-control"
                      value={formData.end_date}
                      onChange={handleChange}
                    />
                  </div>
                </>
              )}
              {/* If No → Show only end_date */}
              {formData.is_detoxified === "no" && (
                <div className="mb-3">
                  <label htmlFor="end_date">End Date</label>
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    className="form-control"
                    value={formData.end_date}
                    onChange={handleChange}
                  />
                </div>
              )}
              {/* Start Remark */}
              <div className="mb-3">
                <label htmlFor="start_remark">Start Remark</label>
                <textarea
                  id="start_remark"
                  name="start_remark"
                  className="form-control"
                  placeholder="Enter start remark"
                  value={formData.start_remark}
                  onChange={handleChange}
                />
              </div>
              {/* End Remark */}
              <div className="mb-3">
                <label htmlFor="end_remark">End Remark</label>
                <textarea
                  id="end_remark"
                  name="end_remark"
                  className="form-control"
                  placeholder="Enter end remark"
                  value={formData.end_remark}
                  onChange={handleChange}
                />
              </div>
              {/* Submit */}
              <div className="d-flex gap-3 mt-3">
                <Button color="primary" type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <span className="spinner-border spinner-border-sm"></span>
                  ) : (
                    "Create Detoxification"
                  )}
                </Button>
              </div>
            </div>
          </Form>
        </div>
      </CommonModal>
      {/* Create and submit Detoxification from end  */}

      {/* View detoxification data form start */}
      <CommonModal
        isOpen={viewDetoxDataModal}
        title="View Detoxification"
        toggler={closeAllModal}
        maxWidth="1200px"
      >
        <Col sm="12"></Col>
        {viewDetoxDataModal && (
          <div className="table-responsive p-4" ref={pdfRef}>
            <h4
              style={{
                textAlign: "center",
                textDecoration: "underline",
                padding: "20px 0",
              }}
            >
              Detoxification Form
            </h4>
            {viewDetoxData ? (
              <Table className="table table-bordered table-striped">
                <thead className="table-light">
                  <tr>
                    <th>Field</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries({
                    Name: viewDetoxData.name,
                    Phone: viewDetoxData.phone,
                    Email: viewDetoxData.email,
                    Gender: viewDetoxData.gender,
                    DOB: viewDetoxData.dob,
                    Address: viewDetoxData.address,
                    Branch: viewDetoxData.branch_name,
                    "Ward Name": viewDetoxData.ward_name,
                    "GKS ID": viewDetoxData.gks_id,
                    "Custom Code": viewDetoxData.custom_code,
                    "Admission Date": viewDetoxData.admit_date,
                    "Visit No": viewDetoxData.visit_no,
                    "Is Detoxified": viewDetoxData.is_detoxified,
                    "Start Date": viewDetoxData.start_date,
                    "End Date": viewDetoxData.end_date,
                    "Start Remark": viewDetoxData.start_remark,
                    "End Remark": viewDetoxData.end_remark,
                    Status: viewDetoxData.status,
                    "Created At": viewDetoxData.created_at,
                    "Updated At": viewDetoxData.updated_at,
                  }).map(([key, value]) => (
                    <tr key={key}>
                      <td className="fw-bold">{key}</td>
                      <td>
                        {value || <span className="text-muted">N/A</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <p className="text-center text-danger">No data available.</p>
            )}
          </div>
        )}

        <div style={{ margin: "20px" }}>
          <button
            disabled={pfaDownload}
            id="download-btn"
            className="btn btn-primary"
            onClick={handleDownloadPDF}
          >
            {pfaDownload
              ? "Your Detoxification report is being downloaded... / आपका डिटॉक्स रिपोर्ट डाउनलोड हो रहा है..."
              : "Download Your Detoxification Report / डिटॉक्स रिपोर्ट डाउनलोड करें"}
          </button>
        </div>
      </CommonModal>
      {/* View detoxification data form end */}

      {/* Update Detoxification Form Start */}
<CommonModal
  isOpen={editDetoxModal}
  title="Update Detoxification Form"
  toggler={closeAllModal}
  maxWidth="1200px"
>
  <div className="sd__wrapper">
    <Form
      className="theme-form"
      onSubmit={updateDetoxHandler}
    >
      {/* Patient Info */}
      {/* <PatientCommonInfo
        selectedUser={selectedUser}
        labels={{
          name: "Patient name/प्रयासक का नाम :",
          sex: "Gender/प्रयासक का लिंग :",
          age: "Age/प्रयासक का उम्र :",
          date_of_admission: "Date of Admission/प्रवेश की तिथि :",
          ageValue: patientCalAge,
        }}
      /> */}

      <div className="container mt-4">
        {/* Date of Assessment */}
        <div className="col-md-6">
          <FormGroup className="form-group row">
            <Label className="col-sm-12 col-form-label col-xl-6">
              {dateOfAssessment}
            </Label>
            <Col xl="5" sm="12">
              <div className="input-group">
                <DatePicker
                  className="form-control digits"
                  selected={
                    editDetoxData?.dateOfAssessment
                      ? new Date(editDetoxData.dateOfAssessment)
                      : null
                  }
                  onChange={(date) =>
                    setEditDetoxData((prev) => ({
                      ...prev,
                      dateOfAssessment: date,
                    }))
                  }
                />
              </div>
            </Col>
          </FormGroup>
        </div>

        {/* Detoxified Yes/No */}
        <div className="mb-3">
          <label>Is Detoxified?</label>
          <select
            id="is_detoxified"
            name="is_detoxified"
            className="form-control"
            value={editDetoxData?.is_detoxified || ""}
            onChange={(e) =>
              setEditDetoxData((prev) => ({
                ...prev,
                is_detoxified: e.target.value,
              }))
            }
          >
            <option value="">-- Select --</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        {/* If Yes → Show start_date, end_date */}
        {editDetoxData?.is_detoxified === "Yes" && (
          <>
            <div className="mb-3">
              <label htmlFor="start_date">Start Date</label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                className="form-control"
                value={
                  editDetoxData?.start_date
                    ? new Date(editDetoxData.start_date)
                        .toISOString()
                        .split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setEditDetoxData((prev) => ({
                    ...prev,
                    start_date: e.target.value,
                  }))
                }
              />
            </div>

            <div className="mb-3">
              <label htmlFor="end_date">End Date</label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                className="form-control"
                value={
                  editDetoxData?.end_date
                    ? new Date(editDetoxData.end_date)
                        .toISOString()
                        .split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setEditDetoxData((prev) => ({
                    ...prev,
                    end_date: e.target.value,
                  }))
                }
              />
            </div>
          </>
        )}

        {/* If No → Show only end_date */}
        {editDetoxData?.is_detoxified === "No" && (
          <div className="mb-3">
            <label htmlFor="end_date">End Date</label>
            <input
              type="date"
              id="end_date"
              name="end_date"
              className="form-control"
              value={
                editDetoxData?.end_date
                  ? new Date(editDetoxData.end_date).toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) =>
                setEditDetoxData((prev) => ({
                  ...prev,
                  end_date: e.target.value,
                }))
              }
            />
          </div>
        )}

        {/* Start Remark */}
        <div className="mb-3">
          <label htmlFor="start_remark">Start Remark</label>
          <textarea
            id="start_remark"
            name="start_remark"
            className="form-control"
            placeholder="Enter start remark"
            value={editDetoxData?.start_remark || ""}
            onChange={(e) =>
              setEditDetoxData((prev) => ({
                ...prev,
                start_remark: e.target.value,
              }))
            }
          />
        </div>

        {/* End Remark */}
        <div className="mb-3">
          <label htmlFor="end_remark">End Remark</label>
          <textarea
            id="end_remark"
            name="end_remark"
            className="form-control"
            placeholder="Enter end remark"
            value={editDetoxData?.end_remark || ""}
            onChange={(e) =>
              setEditDetoxData((prev) => ({
                ...prev,
                end_remark: e.target.value,
              }))
            }
          />
        </div>

        {/* Submit */}
        <div className="d-flex gap-3 mt-4 pb-3">
          <Button color="primary" type="submit" disabled={isLoading}>
            {isLoading ? (
              <span className="spinner-border spinner-border-sm"></span>
            ) : (
              "Update Detoxification"
            )}
          </Button>
        </div>
      </div>
    </Form>
  </div>
</CommonModal>
{/* Update Detoxification Form End */}


{/* ✅ Readmission Detoxification Form Start */}
<CommonModal
  isOpen={DetoxPrefillModal}
  title="Readmission Detoxification Form"
  toggler={closeAllModal}
  maxWidth="1200px"
>
  <div className="sd__wrapper">
    <Form className="theme-form" onSubmit={handleDetoxReadmissionSubmit}>
      {/* Patient Info */}
      {/* <PatientCommonInfo
        selectedUser={selectedUser}
        labels={{
          name: "Patient name/प्रयासक का नाम :",
          sex: "Gender/प्रयासक का लिंग :",
          age: "Age/प्रयासक का उम्र :",
          date_of_admission: "Date of Admission/प्रवेश की तिथि :",
          ageValue: patientCalAge,
        }}
      /> */}

      <div className="container mt-4">
        {/* Detoxified Yes/No */}
        <div className="mb-3">
          <label>Is Detoxified?</label>
          <select
            id="is_detoxified"
            name="is_detoxified"
            className="form-control"
            value={DetoxPrefillData?.is_detoxified || ""}
            onChange={(e) =>
              setDetoxPrefillData((prev) => ({
                ...prev,
                is_detoxified: e.target.value,
              }))
            }
          >
            <option value="">-- Select --</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        {/* If Yes → Show start_date + end_date */}
        {DetoxPrefillData?.is_detoxified === "Yes" && (
          <>
            <div className="mb-3">
              <label htmlFor="start_date">Start Date</label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                className="form-control"
                value={
                  DetoxPrefillData?.start_date
                    ? new Date(DetoxPrefillData.start_date)
                        .toISOString()
                        .split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setDetoxPrefillData((prev) => ({
                    ...prev,
                    start_date: e.target.value,
                  }))
                }
              />
            </div>

            <div className="mb-3">
              <label htmlFor="end_date">End Date</label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                className="form-control"
                value={
                  DetoxPrefillData?.end_date
                    ? new Date(DetoxPrefillData.end_date)
                        .toISOString()
                        .split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setDetoxPrefillData((prev) => ({
                    ...prev,
                    end_date: e.target.value,
                  }))
                }
              />
            </div>
          </>
        )}

        {/* If No → Show only end_date */}
        {DetoxPrefillData?.is_detoxified === "No" && (
          <div className="mb-3">
            <label htmlFor="end_date">End Date</label>
            <input
              type="date"
              id="end_date"
              name="end_date"
              className="form-control"
              value={
                DetoxPrefillData?.end_date
                  ? new Date(DetoxPrefillData.end_date)
                      .toISOString()
                      .split("T")[0]
                  : ""
              }
              onChange={(e) =>
                setDetoxPrefillData((prev) => ({
                  ...prev,
                  end_date: e.target.value,
                }))
              }
            />
          </div>
        )}

        {/* Start Remark */}
        <div className="mb-3">
          <label htmlFor="start_remark">Start Remark</label>
          <textarea
            id="start_remark"
            name="start_remark"
            className="form-control"
            placeholder="Enter start remark"
            value={DetoxPrefillData?.start_remark || ""}
            onChange={(e) =>
              setDetoxPrefillData((prev) => ({
                ...prev,
                start_remark: e.target.value,
              }))
            }
          />
        </div>

        {/* End Remark */}
        <div className="mb-3">
          <label htmlFor="end_remark">End Remark</label>
          <textarea
            id="end_remark"
            name="end_remark"
            className="form-control"
            placeholder="Enter end remark"
            value={DetoxPrefillData?.end_remark || ""}
            onChange={(e) =>
              setDetoxPrefillData((prev) => ({
                ...prev,
                end_remark: e.target.value,
              }))
            }
          />
        </div>

        {/* Submit */}
        <div className="d-flex gap-3 mt-3">
          <Button color="primary" type="submit" disabled={isLoading}>
            {isLoading ? (
              <span className="spinner-border spinner-border-sm"></span>
            ) : (
              "Readmission Detoxification Form"
            )}
          </Button>
        </div>
      </div>
    </Form>
  </div>
</CommonModal>
{/* ✅ Readmission Detoxification Form End */}


    </frameElement>
  );
};

export default Detoxification;
