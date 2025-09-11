import { Fragment, React, useState, useRef, useEffect } from "react";
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
import { H5 } from "../../AbstractElements";
import {
  yes,
  no,
  consent,
  name,
  relationship,
  signature,
  prepared,
  cheifAction,
  relationshipFamilyStatus,
  relationshipStatus,
  MarriageArrangement,
  afterMerriageLife,
  isThereInterference,
  nameisThere,
  relationisThere,
  livingStatus,
  AnyPhysicalDisorder,
  familyHistorySubstanceAbuse,
  anyOtherPlsMention,
  ifAnyDisorder,
  anyOtherPlsMention1,
  currentStatus,
  howWasBonding,
  familyBehaviorPatient,
  monitoringFamily,
  ralationshipFamilyMember,
  childhood,
  birthConditions,
  parentingHistory,
  wasThereAnyConflict,
  socialityWhere,
  highRiskBehavior,
  whatWasImpect,
  hasAnyoneEverAbused,
  academicsOccupationalDetails,
  EducationStatus,
  OcuStatus,
  ifDropout,
  studyWorkDetails,
  Hobbies1,
  extraSkills,
  achievemntInLife,
  socialBehavior,
  socialBehavior1,
  withWhomSpendFreeTime,
  howManyFriends,
  howMuchDependent,
  whoClosedWellWisher,
  legalHistory,
  domesticViolence,
  reasonBehindDomesticViolence,
  drugStatus,
  ifThereIsAnyCriminalCase,
  specificCaseDetails,
  currentCaseStatus,
  ifWentToJail,
  patientBeh,
  whatIsTheMostImportantThing,
  lifeAim,
  patientBehavior,
  patientBehaviorFormattedList,
  relationisAge,
  friendSocialStatus,
  tableNumber,
  dateOfAssessment,
} from "../../Constant";

import DatePicker from "react-datepicker";
import CommonModal from "../UiKits/Modals/common/modal";
import HeaderCard from "../Common/Component/HeaderCard";
import DataTable from "react-data-table-component";
import { Data } from "../UiKits/Spinners/SpinnerData";
import { toast } from "react-toastify";

import Swal from "sweetalert2"; // ✅ Make sure this is imported at the top

//Calculate age by DOB custom hook
import useCalculateAge from "../../CustomHook/useCalculateAge";

//Show pateint/user common info like name, age and DOB by custom hook
import PatientCommonInfo from "../../CustomHook/PatientCommonInfo";

//editPFA download PDF library
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import html2pdf from "html2pdf.js";

import { useBranch } from "../../contexts/BranchContext";

import { Btn, Breadcrumbs, H4 } from "../../AbstractElements";

function SocialBehavior() {
  //spinner extract from other file
  const selectedSpinner = Data.find(
    (item) => item.spinnerClass === "loader-37"
  );
  //Loading spinner
  const [isLoading, setIsLoading] = useState(false);

  //Branches selection
  const { selectedBranch } = useBranch();

  //Pring vide data in pdf format
  const pdfRef = useRef();

  //This React hook calculates a user's age based on their date of birth (dob) and returns the age on PFA form by create.
  const [selectedUser, setSelectedUser] = useState(null); // User data
  const dob = selectedUser?.[0]?.dob;
  const patientCalAge = useCalculateAge(dob);
  console.log("DOB", patientCalAge);

  //All registered data list for creating SUD brif form
  //Registered Patient data
  const [data, setData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
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
        const users = res.data || []; // <-- Corrected from res.users

        const formatted = users.map((user) => {
          const admitDate = user.recent_admit_date
            ? new Date(user.recent_admit_date)
            : null;
          const SBDate = user.recent_intake_social_behavior_date
            ? new Date(user.recent_intake_social_behavior_date)
            : null;

          let userStatus = (
            <p className="badge bg-warning text-dark p-2">{"Pending"}</p>
          );
          if (admitDate && SBDate && admitDate > SBDate) {
            userStatus = <p className="badge bg-success p-2">{"Completed"}</p>;
          }

          const dischargeStatus = user.discharge_status_text || "Unknown";

          return {
            id: user.user_id,
            gks_id: user.gks_id || "N/A",
            name: user.name,
            recentSbIds: user.recent_intake_social_behavior_id,
            status: userStatus,
            dischargeStatus: user.discharge_status,
            dischargeStatusText: dischargeStatus,
            isReadmission: user.is_readmission,
            recent_fda_id: user.recent_fda_id,
          };
        });

        setTimeout(() => {
          setData(formatted);
          setFilteredData(formatted);
          setstillLoading(false);
        }, 1000); // optional delay
      })
      .catch((error) => {
        console.error("Error fetching FDA user data:", error);
        setstillLoading(true);
      });
  }, [selectedBranch]);

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
                onClick={() => handleSBPreFill(row.recentSbIds)}
                style={{ cursor: "pointer" }}
                title="Readmission FDA Form"
              >
                ✏️
              </span>
            )}

{/* <span
                onClick={() => handleSBPreFill(row.recentSbIds)}
                style={{ cursor: "pointer" }}
                title="Readmission FDA Form"
              >
                ✏️
              </span> */}

            {/* Show Create PFA if not discharged and not readmission */}
            {row.dischargeStatus === 0 && row.isReadmission === 0 && (
              <span
                onClick={() => createSUDBrief(row.id)}
                style={{ cursor: "pointer" }}
                title="Create PDA"
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

  //Get All Patient SUD Register Data
  const [searchTextone, setSearchTextone] = useState("");
  const [filteredDataone, setFilteredDataone] = useState([]);
  const [getfdaData, setfdaData] = useState([]);
  //This search filter for below one table where we are listing all FDA data entered by patient
  const handleSearchChangeone = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTextone(value);

    const allRegisterListFilter = getfdaData.filter((item) =>
      item.name.toLowerCase().includes(value)
    );

    setFilteredDataone(allRegisterListFilter);
  };

  useEffect(() => {
    const token = localStorage.getItem("Authorization");
  
    if (!selectedBranch) return; // avoid empty branch fetch
  
    fetch(
      `https://gks-yjdc.onrender.com/api/intake-social-behavior/all-entries?branch_id=${selectedBranch}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      }
    )
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch Social Behavior entries list");
        return response.json();
      })
      .then((res) => {
        const socialEntries = res.data || [];
  
        const formattedSocialPatients = socialEntries.map((item) => ({
          // top level
          isb_id: item.isb_id,
          status: item.status,
  
          // user details
          user_id: item.user_id || null,
          name: item.name || "",
          phone: item.phone || "",
          email: item.email || "",
  
          // entry details
          entry_id: item.entry_id || null,
          visit_no: item.visit_no || null,
          admit_date: item.admit_date || null,
          ward_name: item.ward_name || "",
          dob: item.dob || null,
          gender: item.gender || "",
          gks_id: item.gks_id || "",
          custom_code: item.custom_code || "",
  
          // assessment details
          date_of_assessment: item.date_of_assessment || null,
          social_behavior: item.social_behavior || "",
          with_whom_spend_time: item.with_whom_spend_time || "",
          how_many_friends: item.how_many_friends || "",
          their_social_status: item.their_social_status || "",
          substance_dependent_friends_count: item.substance_dependent_friends_count || "",
          well_wisher_person: item.well_wisher_person || "",
  
          // audit
          branch_name: item.branch_name || "",
          created_at: item.created_at || null,
          updated_at: item.updated_at || null,
        }));
  
        console.log("Formatted Social Behavior Patients:", formattedSocialPatients);
  
        setTimeout(() => {
          setfdaData(formattedSocialPatients);
          setFilteredDataone(formattedSocialPatients);
          setstillLoading(false);
        }, 500);
      })
      .catch((error) => {
        console.error("Error fetching Social Behavior entries:", error);
        setstillLoading(true);
      });
  }, [selectedBranch]);
  

  const tableColumnsFDAList = [
    {
      name: "Social ID",
      selector: (row) => row.isb_id,
      sortable: true,
      center: true,
    },
    // { name: "GKS ID", selector: (row) => row.gks_id, sortable: true, center: true },
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
          <p className="badge bg-success p-2">SUD Brief {row.status}</p>
        </span>
      ),
    },
    {
      name: "Action",
      center: true,
      cell: (row) => (
        <div className="d-flex gap-2">
          <span
            onClick={() => viewSocialFormData(row.isb_id)}
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
            onClick={() => handleSocialBehaviorEdit(row.isb_id)}
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
        </div>
      ),
    },
  ];

  //Create Social form function start
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const createSUDBrief = async (userId = null) => {
    setIsSocialModalOpen(true);
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
        if (!response.ok) throw new Error("User fetch failed");

        // ✅ store the user object
        setSelectedUser(data.data[0]);
      } catch (error) {
        console.error("Fetch error:", error);
      }
    }
  };
  //Create Social form function end

  // 🚀 Submit Social Behavior Create Form
  // Social Behavior Form Data
  const [formData, setFormData] = useState({
    dateOfAssessment: new Date(),
    social_behavior: "",
    with_whom_spend_time: "",
    how_many_friends: "",
    their_social_status: "",
    substance_dependent_friends_count: "",
    well_wisher_person: "",
  });
  // Universal input change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const SubmitSocialFormHandler = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const payload = {
      user_id: selectedUser?.user_id,
      date_of_assessment: formData.dateOfAssessment
        ? formData.dateOfAssessment.toISOString().split("T")[0]
        : null,

      // ✅ Map fields correctly
      social_behavior: formData.social_behavior || "",
      with_whom_spend_time: formData.with_whom_spend_time || "",
      how_many_friends: formData.how_many_friends || "",
      their_social_status: formData.their_social_status || "",
      substance_dependent_friends_count:
        formData.substance_dependent_friends_count || "",
      well_wisher_person: formData.well_wisher_person || "",
    };

    try {
      const token = localStorage.getItem("Authorization");
      const branch_id = selectedBranch;
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/intake-social-behavior/create-assessment?branch_id=${branch_id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error("API call failed");

      const data = await response.json();
      setIsLoading(false);

      Swal.fire({
        icon: "success",
        title: "Social Behavior Created Successfully",
        text: "The Social Behavior assessment was submitted successfully.",
      }).then(() => setIsSocialModalOpen(false));

      console.log("✅ Social Behavior Response:", data);
      console.log("📦 Payload Sent:", payload);
    } catch (err) {
      console.error("❌ Error:", err);
      setIsLoading(false);
      Swal.fire({
        icon: "error",
        title: "Unexpected Error",
        text: "Failed to submit. Check console for error.",
      });
    }
  };

  // 🚀 Submit Social Behavior Create End



//View Social Behavior handler start
  const [viewSocailData, setViewSocialData] = useState(null);
    const [viewSocailModal, setviewSocialModal] = useState(false);
    const viewSocialFormData = async (SocialID) => {
      setviewSocialModal(true);
      console.log("Social ID =>", SocialID);
  
      if (typeof SocialID === "object" && SocialID !== null) {
        SocialID = SocialID.isb_id;
      }
  
      if (!SocialID) {
        console.error("Invalid Social ID provided");
        return;
      }
  
      setIsLoading(true);
      const token = localStorage.getItem("Authorization");
  
      try {
        const branch_id = selectedBranch;
        const response = await fetch(
          `https://gks-yjdc.onrender.com/api/intake-social-behavior/assessment/${SocialID}?branch_id=${branch_id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `${token}`,
            },
          }
        );
  
        const data = await response.json();
        console.log("Raw API Response:", data); // ✅ always log the full response
  
        if (!response.ok) {
          console.error("Fetch error:", data);
          return;
        }
  
        // ✅ fix: pick from data.data
        const ViewSocailDataEntry = data.data || null;
        console.log("Extracted SUD Data Entry:", ViewSocailDataEntry); // ✅ should show full assessment object
  
        if (!ViewSocailDataEntry) {
          console.warn("No SUD assessment data found.");
          return;
        }
  
        setViewSocialData(ViewSocailDataEntry);
        console.log("SUD Data Fetched ID:", ViewSocailDataEntry.isb_id);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    //View Social Behavior handler end


    // Edit Social Behavior handler start
const [socialBehaviorEditData, setSocialBehaviorEditData] = useState(null);
const [socialBehaviorEditModal, setSocialBehaviorEditModal] = useState(false);

const handleSocialBehaviorEdit = async (editID = null) => {
  setSocialBehaviorEditModal(true);

  if (typeof editID === "object" && editID !== null) {
    editID = editID.isb_id; // ✅ correct: API returns isb_id, not intake_sud_id
  }

  if (!editID) {
    console.error("Invalid editID provided");
    return;
  }

  console.log("Social Behavior ID For Edit:", editID);
  const token = localStorage.getItem("Authorization");

  try {
    const branch_id = selectedBranch;
    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/intake-social-behavior/assessment/${editID}?branch_id=${branch_id}`,
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
      console.error("User fetch error:", data);
      return;
    }

    // ✅ Correct: pick data.data
    const latestAssessment = data.data || null;

    if (!latestAssessment) {
      console.warn("No assessment found for this Social Behavior ID.");
      return;
    }

    setSelectedUser(latestAssessment);
    console.log("Selected Social Behavior for edit:", latestAssessment);

    // ✅ Map payload into your form structure
    setSocialBehaviorEditData({
      isb_id: latestAssessment.isb_id,
      user_id: latestAssessment.user_id,
      entry_id: latestAssessment.entry_id,
      branch_id: latestAssessment.branch_id,
      visit_no: latestAssessment.visit_no,

      date_of_assessment: latestAssessment.date_of_assessment
        ? new Date(latestAssessment.date_of_assessment)
        : "",

      // 🔑 Social Behavior specific fields
      social_behavior: latestAssessment.social_behavior,
      with_whom_spend_time: latestAssessment.with_whom_spend_time,
      how_many_friends: latestAssessment.how_many_friends,
      their_social_status: latestAssessment.their_social_status,
      substance_dependent_friends_count:
        latestAssessment.substance_dependent_friends_count,
      well_wisher_person: latestAssessment.well_wisher_person,

      // Meta
      status: latestAssessment.status,
      isActive: latestAssessment.isActive,
      created_by: latestAssessment.created_by,
      updated_by: latestAssessment.updated_by,
      created_at: latestAssessment.created_at,
      updated_at: latestAssessment.updated_at,

      // User details
      name: latestAssessment.name,
      phone: latestAssessment.phone,
      email: latestAssessment.email,
      dob: latestAssessment.dob,
      gender: latestAssessment.gender,
      gks_id: latestAssessment.gks_id,
      custom_code: latestAssessment.custom_code,
      address: latestAssessment.address,
      admit_date: latestAssessment.admit_date,
      ward_name: latestAssessment.ward_name,
      branch_name: latestAssessment.branch_name,
    });

    console.log("Mapped Social Behavior Edit Data:", latestAssessment);
  } catch (error) {
    console.error("Fetch error:", error);
  }
};
// Edit Social Behavior handler end



// ✅ Update Social Behavior Assessment Handler start
const handleSocialBehaviorUpdate = async () => {
  if (!socialBehaviorEditData?.isb_id) {
    console.error("Social Behavior ID is not available yet.");
    return;
  }

  console.log("📝 Social Behavior ID for update:", socialBehaviorEditData.isb_id);
  setIsLoading(true);

  // ✅ Build payload as per API requirements
  const payload = {
    user_id: socialBehaviorEditData?.user_id,
    date_of_assessment: socialBehaviorEditData?.date_of_assessment
      ? new Date(socialBehaviorEditData.date_of_assessment)
          .toISOString()
          .split("T")[0] // ensure YYYY-MM-DD format
      : null,
    social_behavior: socialBehaviorEditData?.social_behavior || "",
    with_whom_spend_time: socialBehaviorEditData?.with_whom_spend_time || "",
    how_many_friends: socialBehaviorEditData?.how_many_friends || "",
    their_social_status: socialBehaviorEditData?.their_social_status || "",
    substance_dependent_friends_count:
      socialBehaviorEditData?.substance_dependent_friends_count || "",
    well_wisher_person: socialBehaviorEditData?.well_wisher_person || "",
  };

  try {
    const branch_id = selectedBranch; // from context/state
    const token = localStorage.getItem("Authorization");

    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/intake-social-behavior/update-assessment/${socialBehaviorEditData.isb_id}?branch_id=${branch_id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) throw new Error("API call failed");

    const data = await response.json();
    console.log("✅ Social Behavior Update Response:", data);
    console.log("📦 Payload Sent:", payload);

    setIsLoading(false);

    Swal.fire({
      icon: "success",
      title: "Updated Successfully!",
      text: "Social Behavior assessment has been updated successfully.",
    }).then(() => {
      setSocialBehaviorEditModal(false); // close modal
    });
  } catch (err) {
    console.error("❌ Social Behavior Update Error:", err);
    setIsLoading(false);

    Swal.fire({
      icon: "error",
      title: "Unexpected Error",
      text: "Failed to update Social Behavior assessment. Check console for details.",
    });
  }
};
// ✅ Update Social Behavior Assessment Handler end


// Prefill Social Behavior form handler start

const [SBPrefillData, setSBPrefillData] = useState({});
const [SBPrefillModal, setSBPrefillModal] = useState(false);

const handleSBPreFill = async (prefillSBID = null) => {
  // Normalize ID if object
  if (typeof prefillSBID === "object" && prefillSBID !== null) {
    prefillSBID = prefillSBID.isb_id || prefillSBID.entry_id;
  }

  if (!prefillSBID) {
    Swal.fire({
      icon: "warning",
      title: "Missing Social Behavior ID",
      text: "No valid Social Behavior ID was provided for prefill.",
    });
    return;
  }

  console.log("Social Behavior ID For Prefill:", prefillSBID);
  const token = localStorage.getItem("Authorization");

  try {
    const branch_id = selectedBranch;
    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/intake-social-behavior/assessment/${prefillSBID}?branch_id=${branch_id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      }
    );

    const data = await response.json();
    console.log("Raw Social Behavior API Response:", data);

    if (!response.ok) {
      Swal.fire({
        icon: "error",
        title: "Fetch Failed",
        text: data.message || "Unable to fetch Social Behavior data for prefill.",
      });
      return;
    }

    const latestAssessment = data.data || null;
    if (!latestAssessment) {
      Swal.fire({
        icon: "info",
        title: "No Data Found",
        text: "No Social Behavior data available for this ID.",
      });
      return;
    }

    // ✅ Open modal only when we have valid data
    setSBPrefillModal(true);

    // ✅ Wrap in array so PatientCommonInfo works
    setSelectedUser([latestAssessment]);

    // ✅ Build mapped data for Social Behavior Assessment
    const mappedData = {
      isb_id: latestAssessment.isb_id,
      user_id: latestAssessment.user_id,
      entry_id: latestAssessment.entry_id,
      branch_id: latestAssessment.branch_id,
      visit_no: latestAssessment.visit_no,

      date_of_assessment: latestAssessment.date_of_assessment
        ? new Date(latestAssessment.date_of_assessment)
        : null,

      social_behavior: latestAssessment.social_behavior || "",
      with_whom_spend_time: latestAssessment.with_whom_spend_time || "",
      how_many_friends: latestAssessment.how_many_friends || "",
      their_social_status: latestAssessment.their_social_status || "",
      substance_dependent_friends_count:
        latestAssessment.substance_dependent_friends_count || "",
      well_wisher_person: latestAssessment.well_wisher_person || "",
      status: latestAssessment.status || "Pending",

      // ✅ Patient details
      patient_name: latestAssessment.name || "",
      dob: latestAssessment.dob ? new Date(latestAssessment.dob) : null,
      gender: latestAssessment.gender || "",
      phone: latestAssessment.phone || "",
      email: latestAssessment.email || "",
      admit_date: latestAssessment.admit_date
        ? new Date(latestAssessment.admit_date)
        : null,
      ward_name: latestAssessment.ward_name || "",
      address: latestAssessment.address || "",
      gks_id: latestAssessment.gks_id || "",
    };

    setSBPrefillData(mappedData);

    console.log("Mapped Social Behavior Prefill Data:", mappedData);
  } catch (error) {
    console.error("Prefill fetch error:", error);
    Swal.fire({
      icon: "error",
      title: "Network Error",
      text: "Unable to fetch Social Behavior data due to a network issue.",
    });
  }
};
// Prefill Social Behavior form handler end



// Social behaviour readmission form handler start
const SubmitSocialReadmissionFormHandler = async (e) => {
  e.preventDefault();
  setIsLoading(true);

  const payload = {
    user_id: SBPrefillData?.user_id,
    date_of_assessment: SBPrefillData?.date_of_assessment
      ? new Date(SBPrefillData.date_of_assessment).toISOString().split("T")[0]
      : null,

    // ✅ Use SBPrefillData instead of formData
    social_behavior: SBPrefillData?.social_behavior || "",
    with_whom_spend_time: SBPrefillData?.with_whom_spend_time || "",
    how_many_friends: SBPrefillData?.how_many_friends || "",
    their_social_status: SBPrefillData?.their_social_status || "",
    substance_dependent_friends_count:
      SBPrefillData?.substance_dependent_friends_count || "",
    well_wisher_person: SBPrefillData?.well_wisher_person || "",
  };

  try {
    const token = localStorage.getItem("Authorization");
    const branch_id = selectedBranch;
    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/intake-social-behavior/create-assessment?branch_id=${branch_id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) throw new Error("API call failed");

    const data = await response.json();
    setIsLoading(false);

    Swal.fire({
      icon: "success",
      title: "Readmission Social Behavior Created Successfully",
      text: "The Readmission Social Behavior assessment was submitted successfully.",
    }).then(() => setIsSocialModalOpen(false));

    console.log("✅ Social Behavior Response:", data);
    console.log("📦 Payload Sent:", payload);
  } catch (err) {
    console.error("❌ Error:", err);
    setIsLoading(false);
    Swal.fire({
      icon: "error",
      title: "Unexpected Error",
      text: "Failed to submit. Check console for error.",
    });
  }
};
// Social behaviour readmission form handler end



  //Close all modal handler
  const closeAllmodal = () => {
    setIsSocialModalOpen(false);
    setviewSocialModal(false);
    setSocialBehaviorEditModal(false);
    setSBPrefillModal(false);
  };

  //Universal getting data handler
  const handleAssesmentDateChange = (name, date) => {
    setFormData((prev) => ({
      ...prev,
      [name]: date,
    }));
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
        filename: `user_data_${viewSocailData?.name}_${viewSocailData?.user_id}.pdf`,
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

      {/* All register data list table start */}
      <Container fluid={true} className="datatables">
        <Row>
          <Col sm="12">
            <CardBody>
              {/* Register pateint list/user list */}
              <Card>
                {/* <HeaderCard title="User Data Table with Multiple Selection" /> */}
                <CardBody>
                  <div class="d-flex pb-2 justify-content-between">
                    <HeaderCard title="All Patient Data List" className="p-0" />
                  </div>
                  <div className="row pb-2">
                    <div className="col-md-4">
                      <InputGroup>
                        <Input
                          className="form-control"
                          type="text"
                          placeholder="Search......."
                          value={searchTextone}
                          onChange={handleSearchChangeone}
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
                      data={filteredDataone}
                      columns={tableColumnsFDAList}
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
      {/* All register data list table end */}

      {/* Social create form start */}
      <CommonModal
        isOpen={isSocialModalOpen}
        title={`Create ${socialBehavior}`}
        toggler={closeAllmodal}
        maxWidth="1200px"
      >
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
        <div className="row px-3 pt-4 pb-3">
          <form className="theme-form" onSubmit={SubmitSocialFormHandler}>
            {/* Social Behavior / सामाजिक व्यवहार */}

 <div class="col-md-6 mb-3">
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
              </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{socialBehavior1}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="social_behavior"
                  value={formData.social_behavior || ""}
                  onChange={handleChange}
                />
              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{withWhomSpendFreeTime}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="with_whom_spend_time"
                  value={formData.with_whom_spend_time || ""}
                  onChange={handleChange}
                />
              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{howManyFriends}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="how_many_friends" // ✅ corrected
                  value={formData.how_many_friends || ""}
                  onChange={handleChange}
                />
              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{friendSocialStatus}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="their_social_status" // ✅ corrected
                  value={formData.their_social_status || ""}
                  onChange={handleChange}
                />
              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{howMuchDependent}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="substance_dependent_friends_count" // ✅ corrected
                  value={formData.substance_dependent_friends_count || ""}
                  onChange={handleChange}
                />
              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{whoClosedWellWisher}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="well_wisher_person"
                  value={formData.well_wisher_person || ""}
                  onChange={handleChange}
                />
              </FormGroup>
            </div>

            {/* Submit Button */}
            <div className="d-flex gap-3">
              <Button color="primary" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  ></span>
                ) : (
                  "Create Social Behavior / सामाजिक व्यवहार"
                )}
              </Button>
            </div>
          </form>
        </div>
      </CommonModal>
      {/* Social create form end */}

{/* View Social Behavior data into modal start */}
<CommonModal
  isOpen={viewSocailModal}
  title={`View ${socialBehavior}`}
  toggler={closeAllmodal}
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
      {`View ${socialBehavior}`}
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
        ) : viewSocailData ? (
          <>
            <tr>
              <th className="text-start p-3">Name</th>
              <td className="border p-3">{viewSocailData.name}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Gender</th>
              <td className="border p-3">{viewSocailData.gender}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Phone</th>
              <td className="border p-3">{viewSocailData.phone}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Email</th>
              <td className="border p-3">{viewSocailData.email}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Assessment Date</th>
              <td className="border p-3">
                {viewSocailData.date_of_assessment
                  ? new Date(viewSocailData.date_of_assessment).toLocaleDateString()
                  : ""}
              </td>
            </tr>
            <tr>
              <th className="text-start p-3">Social Behavior</th>
              <td className="border p-3">{viewSocailData.social_behavior}</td>
            </tr>
            <tr>
              <th className="text-start p-3">With Whom Spend Free Time</th>
              <td className="border p-3">{viewSocailData.with_whom_spend_time}</td>
            </tr>
            <tr>
              <th className="text-start p-3">How Many Friends</th>
              <td className="border p-3">{viewSocailData.how_many_friends}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Friends’ Social Status</th>
              <td className="border p-3">{viewSocailData.their_social_status}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Substance Dependent Friends</th>
              <td className="border p-3">
                {viewSocailData.substance_dependent_friends_count}
              </td>
            </tr>
            <tr>
              <th className="text-start p-3">Well-Wisher Person</th>
              <td className="border p-3">{viewSocailData.well_wisher_person}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Status</th>
              <td className="border p-3">{viewSocailData.status}</td>
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
        ? "Your Social Behavior is being downloaded... / आपका सामाजिक व्यवहार डाउनलोड हो रहा है..."
        : "Download Social Behavior"}
    </button>
  </div>
</CommonModal>
{/* View Social Behavior data into modal end */}


{/* Update Social Behavior Form start */}
<CommonModal
  isOpen={socialBehaviorEditModal}
  title={`Update ${socialBehavior}`}
  toggler={closeAllmodal}
  maxWidth="1200px"
>
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

  <div className="row px-3 pt-4 pb-3">
    <form className="theme-form" onSubmit={(e)=>{
      e.preventDefault();
      handleSocialBehaviorUpdate();
    }}>
      {/* Assessment Date */}
      <div className="col-md-6 mb-3">
        <Label className="col-sm-12 col-form-label col-xl-6">
          {dateOfAssessment}
        </Label>
        <Col xl="5" sm="12">
          <div className="input-group">
            <DatePicker
              className="form-control digits"
              selected={
                socialBehaviorEditData?.date_of_assessment
                  ? new Date(socialBehaviorEditData.date_of_assessment)
                  : null
              }
              onChange={(date) =>
                setSocialBehaviorEditData((prev) => ({
                  ...prev,
                  date_of_assessment: date,
                }))
              }
            />
          </div>
        </Col>
      </div>

      {/* Social Behavior */}
      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>{socialBehavior1}</Label>
          <Input
            type="textarea"
            rows="3"
            name="social_behavior"
            value={socialBehaviorEditData?.social_behavior || ""}
            onChange={(e) =>
              setSocialBehaviorEditData((prev) => ({
                ...prev,
                social_behavior: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>

      {/* With Whom Spend Time */}
      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>{withWhomSpendFreeTime}</Label>
          <Input
            type="textarea"
            rows="3"
            name="with_whom_spend_time"
            value={socialBehaviorEditData?.with_whom_spend_time || ""}
            onChange={(e) =>
              setSocialBehaviorEditData((prev) => ({
                ...prev,
                with_whom_spend_time: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>

      {/* How Many Friends */}
      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>{howManyFriends}</Label>
          <Input
            type="textarea"
            rows="3"
            name="how_many_friends"
            value={socialBehaviorEditData?.how_many_friends || ""}
            onChange={(e) =>
              setSocialBehaviorEditData((prev) => ({
                ...prev,
                how_many_friends: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>

      {/* Friends’ Social Status */}
      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>{friendSocialStatus}</Label>
          <Input
            type="textarea"
            rows="3"
            name="their_social_status"
            value={socialBehaviorEditData?.their_social_status || ""}
            onChange={(e) =>
              setSocialBehaviorEditData((prev) => ({
                ...prev,
                their_social_status: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>

      {/* Substance Dependent Friends Count */}
      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>{howMuchDependent}</Label>
          <Input
            type="textarea"
            rows="3"
            name="substance_dependent_friends_count"
            value={socialBehaviorEditData?.substance_dependent_friends_count || ""}
            onChange={(e) =>
              setSocialBehaviorEditData((prev) => ({
                ...prev,
                substance_dependent_friends_count: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>

      {/* Well-Wisher Person */}
      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>{whoClosedWellWisher}</Label>
          <Input
            type="textarea"
            rows="3"
            name="well_wisher_person"
            value={socialBehaviorEditData?.well_wisher_person || ""}
            onChange={(e) =>
              setSocialBehaviorEditData((prev) => ({
                ...prev,
                well_wisher_person: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>

      {/* Submit Button */}
      <div className="d-flex gap-3 mt-3">
        <Button color="primary" type="submit" disabled={isLoading}>
          {isLoading ? (
            <span
              className="spinner-border spinner-border-sm"
              role="status"
              aria-hidden="true"
            ></span>
          ) : (
            "Update Social Behavior / सामाजिक व्यवहार"
          )}
        </Button>
      </div>
    </form>
  </div>
</CommonModal>
{/* Update Social Behavior Form end */}


{/* Pre-fill Readmission Social Behavior Form start */}
<CommonModal
  isOpen={SBPrefillModal}
  title={`Readmission ${socialBehavior}`}
  toggler={closeAllmodal}
  maxWidth="1200px"
>
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

  <div className="row px-3 pt-4 pb-3">
    <form
      className="theme-form"
      onSubmit={SubmitSocialReadmissionFormHandler}
    >
      {/* Assessment Date */}
      <div className="col-md-6 mb-3">
        <Label className="col-sm-12 col-form-label col-xl-6">
          {dateOfAssessment}
        </Label>
        <Col xl="5" sm="12">
          <div className="input-group">
            <DatePicker
              className="form-control digits"
              selected={
                SBPrefillData?.date_of_assessment
                  ? new Date(SBPrefillData.date_of_assessment)
                  : null
              }
              onChange={(date) =>
                setSBPrefillData((prev) => ({
                  ...prev,
                  date_of_assessment: date,
                }))
              }
            />
          </div>
        </Col>
      </div>

      {/* Social Behavior */}
      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>{socialBehavior1}</Label>
          <Input
            type="textarea"
            rows="3"
            name="social_behavior"
            value={SBPrefillData?.social_behavior || ""}
            onChange={(e) =>
              setSBPrefillData((prev) => ({
                ...prev,
                social_behavior: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>

      {/* With Whom Spend Time */}
      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>{withWhomSpendFreeTime}</Label>
          <Input
            type="textarea"
            rows="3"
            name="with_whom_spend_time"
            value={SBPrefillData?.with_whom_spend_time || ""}
            onChange={(e) =>
              setSBPrefillData((prev) => ({
                ...prev,
                with_whom_spend_time: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>

      {/* How Many Friends */}
      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>{howManyFriends}</Label>
          <Input
            type="textarea"
            rows="3"
            name="how_many_friends"
            value={SBPrefillData?.how_many_friends || ""}
            onChange={(e) =>
              setSBPrefillData((prev) => ({
                ...prev,
                how_many_friends: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>

      {/* Friends’ Social Status */}
      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>{friendSocialStatus}</Label>
          <Input
            type="textarea"
            rows="3"
            name="their_social_status"
            value={SBPrefillData?.their_social_status || ""}
            onChange={(e) =>
              setSBPrefillData((prev) => ({
                ...prev,
                their_social_status: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>

      {/* Substance Dependent Friends Count */}
      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>{howMuchDependent}</Label>
          <Input
            type="textarea"
            rows="3"
            name="substance_dependent_friends_count"
            value={SBPrefillData?.substance_dependent_friends_count || ""}
            onChange={(e) =>
              setSBPrefillData((prev) => ({
                ...prev,
                substance_dependent_friends_count: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>

      {/* Well-Wisher Person */}
      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>{whoClosedWellWisher}</Label>
          <Input
            type="textarea"
            rows="3"
            name="well_wisher_person"
            value={SBPrefillData?.well_wisher_person || ""}
            onChange={(e) =>
              setSBPrefillData((prev) => ({
                ...prev,
                well_wisher_person: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>

      {/* Submit Button */}
      <div className="d-flex gap-3 mt-3">
        <Button color="primary" type="submit" disabled={isLoading}>
          {isLoading ? (
            <span
              className="spinner-border spinner-border-sm"
              role="status"
              aria-hidden="true"
            ></span>
          ) : (
            "Readmission Social Behavior / सामाजिक व्यवहार"
          )}
        </Button>
      </div>
    </form>
  </div>
</CommonModal>
{/* Pre-fill Readmission  Social Behavior Form end */}





      
    </Fragment>
  );
}

export default SocialBehavior;
