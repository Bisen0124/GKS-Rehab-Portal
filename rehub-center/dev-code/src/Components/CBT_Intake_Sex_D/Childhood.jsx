import { React, useState, useRef, useEffect, Fragment } from "react";
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
import { H5 } from "../../AbstractElements";

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

function Childhood() {
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
          const RecentChildhoodDate = user.recent_intake_childhood_date
            ? new Date(user.recent_intake_childhood_date)
            : null;

          let userStatus = (
            <p className="badge bg-warning text-dark p-2">{"Pending"}</p>
          );
          if (admitDate && RecentChildhoodDate && RecentChildhoodDate > RecentChildhoodDate) {
            userStatus = <p className="badge bg-success p-2">{"Completed"}</p>;
          }

          const dischargeStatus = user.discharge_status_text || "Unknown";

          return {
            id: user.user_id,
            gks_id: user.gks_id || "N/A",
            name: user.name,
            recentChildhoodIDs: user.recent_intake_childhood_id,
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
                onClick={() => handleChildhoodPreFill(row.recentChildhoodIDs)}
                style={{ cursor: "pointer" }}
                title="Readmission FDA Form"
              >
                ✏️
              </span>
            )}

{/* <span
                onClick={() => handleChildhoodPreFill(row.recentChildhoodIDs)}
                style={{ cursor: "pointer" }}
                title="Readmission FDA Form"
              >
                ✏️
              </span> */}

            {/* Show Create PFA if not discharged and not readmission */}
            {row.dischargeStatus === 0 && row.isReadmission === 0 && (
              <span
                onClick={() => CreateChildHoodHandler(row.id)}
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
      `https://gks-yjdc.onrender.com/api/intake-childhood/all-entries?branch_id=${selectedBranch}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      }
    )
      .then((response) => {
        if (!response.ok)
          throw new Error("Failed to fetch Childhood entries list");
        return response.json();
      })
      .then((res) => {
        const childhoodEntries = res.data || [];

        const formattedChildhoodPatients = childhoodEntries.map((item) => ({
          // top-level
          intake_childhood_id: item.intake_childhood_id,
          status: item.status,

          // user details
          user_id: item.user_id || null,
          name: item.name || "",
          phone: item.phone || "",
          email: item.email || "",
          gks_id: item.gks_id || "",
          dob: item.dob || null,
          gender: item.gender || "",
          branch_name: item.branch_name || "",
          custom_code: item.custom_code || "",

          // entry details
          entry_id: item.entry_id || null,
          visit_no: item.visit_no || null,
          admit_date: item.admit_date || null,
          ward_name: item.ward_name || "",

          // childhood assessment details
          date_of_assessment: item.date_of_assessment || null,
          parenting_history: item.parenting_history || "",
          education_status: item.education_status || "",
          occupational_status: item.occupational_status || "",
          abuse_history_types: item.abuse_history_types || [],
          why_here: item.why_here || "",
          why_family_sent: item.why_family_sent || "",

          // audit (meta info)
          created_at: item.created_at || null,
          updated_at: item.updated_at || null,
        }));

        console.log(
          "Formatted Childhood Patients:",
          formattedChildhoodPatients
        );

        setTimeout(() => {
          setfdaData(formattedChildhoodPatients);
          setFilteredDataone(formattedChildhoodPatients);
          setstillLoading(false);
        }, 500);
      })
      .catch((error) => {
        console.error("Error fetching Childhood entries:", error);
        setstillLoading(true);
      });
  }, [selectedBranch]);

  const tableColumnsFDAList = [
    {
      name: "Childhood ID",
      selector: (row) => row.intake_childhood_id,
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
            onClick={() => viewChildhoodFormData(row.intake_childhood_id)}
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
            onClick={() =>
              handleChildhoodindividualEdit(row.intake_childhood_id)
            }
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

  //Create Childhood form function start
  const [isChildhoodModalOpen, setIsChildhoodModalOpen] = useState(false);
  const CreateChildHoodHandler = async (userId = null) => {
    setIsChildhoodModalOpen(true);
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

  //Submit childhood form data
  const [formData, setFormData] = useState({
    dateOfAssessment: new Date(),
    parenting_history: "",
    family_dispute_childhood: "",
    sociality_born_living: "",
    high_risk_behavior: "",
    impact_substance_movies: "",
    abuse_history_types: [], // ✅ checkboxes
    abuse_history_description: "",
    education_status: "",
    occupational_status: "",
    dropout_reason: "",
    study_work_details: "",
    hobbies: "",
    extra_skills: "",
    achievement_life: "",
    why_here: "",
    why_family_sent: "",
  });
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const SubmitChildhoodFormHandler = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const payload = {
      user_id: selectedUser?.user_id,
      date_of_assessment: formData.dateOfAssessment
        ? formData.dateOfAssessment.toISOString().split("T")[0]
        : null,

      parenting_history: formData.parenting_history || "",
      family_dispute_childhood: formData.family_dispute_childhood || "",
      sociality_born_living: formData.sociality_born_living || "",
      high_risk_behavior: formData.high_risk_behavior || "",
      impact_substance_movies: formData.impact_substance_movies || "",
      abuse_history_types: formData.abuse_history_types || [], // If checkboxes
      abuse_history_description: formData.abuse_history_description || "",

      education_status: formData.education_status || "",
      occupational_status: formData.occupational_status || "",
      dropout_reason: formData.dropout_reason || "",
      study_work_details: formData.study_work_details || "",
      hobbies: formData.hobbies || "",
      extra_skills: formData.extra_skills || "",
      achievement_life: formData.achievement_life || "",
      why_here: formData.why_here || "",
      why_family_sent: formData.why_family_sent || "",
    };

    try {
      const token = localStorage.getItem("Authorization");
      const branch_id = selectedBranch;

      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/intake-childhood/create-assessment?branch_id=${branch_id}`,
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
        title: "Childhood Assessment Created Successfully",
        text: "The childhood assessment was submitted successfully.",
      }).then(() => setIsChildhoodModalOpen(false));

      console.log("Childhood API Data", data);
      console.log("Childhood Payload Sent", payload);
    } catch (err) {
      console.error("Childhood API Error:", err);
      setIsLoading(false);
      Swal.fire({
        icon: "error",
        title: "Unexpected Error",
        text: "Failed to submit. Check console for error.",
      });
    }
  };

  //Create Childhood form function end

  //View Childhood form function start
  const [viewChildhoodData, setViewChildhoodData] = useState(null);
  const [viewChildhoodModal, setViewChildhoodModal] = useState(false);
  const viewChildhoodFormData = async (ChildhoodID) => {
    setViewChildhoodModal(true);
    console.log("Childhood ID =>", ChildhoodID);

    if (typeof ChildhoodID === "object" && ChildhoodID !== null) {
      ChildhoodID = ChildhoodID.intake_sud_id;
    }

    if (!ChildhoodID) {
      console.error("Invalid Childhood ID provided");
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem("Authorization");

    try {
      const branch_id = selectedBranch;
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/intake-childhood/assessment/${ChildhoodID}?branch_id=${branch_id}`,
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
      const ViewChildhoodDataEntry = data.data || null;
      console.log("Extracted Childhood Data Entry:", ViewChildhoodDataEntry); // ✅ should show full assessment object

      if (!ViewChildhoodDataEntry) {
        console.warn("No Childhood assessment data found.");
        return;
      }

      setViewChildhoodData(ViewChildhoodDataEntry);
      console.log(
        "Childhood Data Fetched ID:",
        ViewChildhoodDataEntry.intake_sud_id
      );
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  //View Childhood form function end

  //Edit childhood form function start
  const [ChildhoodEditData, setChildhoodEditData] = useState(null);
  const [SUDChildhoodeditModal, setChildhoodeditModal] = useState(false);
  const handleChildhoodindividualEdit = async (editChildhoodID = null) => {
    setChildhoodeditModal(true);

    if (typeof editChildhoodID === "object" && editChildhoodID !== null) {
      editChildhoodID = editChildhoodID.intake_sud_id;
    }

    if (!editChildhoodID) {
      console.error("Invalid editChildhoodID provided");
      return;
    }

    console.log("Childhood ID For Edit:", editChildhoodID);
    const token = localStorage.getItem("Authorization");

    try {
      const branch_id = selectedBranch;
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/intake-childhood/assessment/${editChildhoodID}?branch_id=${branch_id}`,
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

      // ✅ Correct: pick from data.data (not data.assessment)
      const latestAssessment = data.data || null;

      if (!latestAssessment) {
        console.warn("No assessment found for this Childhood ID.");
        return;
      }

      setSelectedUser(latestAssessment);
      console.log(
        "Selected Childhood User Assessment for edit:",
        latestAssessment
      );

      // ✅ Map payload into your form structure
      setChildhoodEditData({
        intake_childhood_id: latestAssessment.intake_childhood_id,
        user_id: latestAssessment.user_id,
        entry_id: latestAssessment.entry_id,
        branch_id: latestAssessment.branch_id,
        visit_no: latestAssessment.visit_no,

        // Dates
        date_of_assessment: latestAssessment.date_of_assessment
          ? parseDateString(latestAssessment.date_of_assessment)
          : "",

        // Childhood-specific fields
        parenting_history: latestAssessment.parenting_history || "",
        family_dispute_childhood:
          latestAssessment.family_dispute_childhood || "",
        sociality_born_living: latestAssessment.sociality_born_living || "",
        high_risk_behavior: latestAssessment.high_risk_behavior || "",
        impact_substance_movies: latestAssessment.impact_substance_movies || "",
        abuse_history_types: latestAssessment.abuse_history_types || [],
        abuse_history_description:
          latestAssessment.abuse_history_description || "",
        education_status: latestAssessment.education_status || "",
        occupational_status: latestAssessment.occupational_status || "",
        dropout_reason: latestAssessment.dropout_reason || "",
        study_work_details: latestAssessment.study_work_details || "",
        hobbies: latestAssessment.hobbies || "",
        extra_skills: latestAssessment.extra_skills || "",
        achievement_life: latestAssessment.achievement_life || "",
        why_here: latestAssessment.why_here || "",
        why_family_sent: latestAssessment.why_family_sent || "",

        // Meta info
        status: latestAssessment.status,
        isActive: latestAssessment.isActive,
        created_by: latestAssessment.created_by,
        updated_by: latestAssessment.updated_by,
        created_at: latestAssessment.created_at,
        updated_at: latestAssessment.updated_at,

        // User details
        name: latestAssessment.name || "",
        gender: latestAssessment.gender || "",
        phone: latestAssessment.phone || "",
        email: latestAssessment.email || "",
        dob: latestAssessment.dob ? parseDateString(latestAssessment.dob) : "",
        gks_id: latestAssessment.gks_id || "",
        custom_code: latestAssessment.custom_code || "",
        branch_name: latestAssessment.branch_name || "",
        ward_name: latestAssessment.ward_name || "",
        address: latestAssessment.address || "",
      });

      console.log("Mapped Edit Data:", latestAssessment);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  //Edit childhood form function end

  // ✅ Update Childhood Assessment Handler start
  const handleChildhoodUpdate = async () => {
    if (!ChildhoodEditData?.intake_childhood_id) {
      console.error("Childhood ID is not available yet.");
      return;
    }

    console.log(
      "Childhood ID for update:",
      ChildhoodEditData.intake_childhood_id
    );
    setIsLoading(true);

    // ✅ Build payload from Childhood form data
    const payload = {
      user_id: ChildhoodEditData?.user_id || null,
      date_of_assessment: ChildhoodEditData?.date_of_assessment || null,
      parenting_history: ChildhoodEditData?.parenting_history || "",
      family_dispute_childhood:
        ChildhoodEditData?.family_dispute_childhood || "",
      sociality_born_living: ChildhoodEditData?.sociality_born_living || "",
      high_risk_behavior: ChildhoodEditData?.high_risk_behavior || "",
      impact_substance_movies: ChildhoodEditData?.impact_substance_movies || "",
      abuse_history_types: ChildhoodEditData?.abuse_history_types || [], // ✅ array
      abuse_history_description:
        ChildhoodEditData?.abuse_history_description || "",
      education_status: ChildhoodEditData?.education_status || "",
      occupational_status: ChildhoodEditData?.occupational_status || "",
      dropout_reason: ChildhoodEditData?.dropout_reason || "",
      study_work_details: ChildhoodEditData?.study_work_details || "",
      hobbies: ChildhoodEditData?.hobbies || "",
      extra_skills: ChildhoodEditData?.extra_skills || "",
      achievement_life: ChildhoodEditData?.achievement_life || "",
      why_here: ChildhoodEditData?.why_here || "",
      why_family_sent: ChildhoodEditData?.why_family_sent || "",
    };

    try {
      const branch_id = selectedBranch; // from BranchContext
      const token = localStorage.getItem("Authorization");

      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/intake-childhood/update-assessment/${ChildhoodEditData.intake_childhood_id}?branch_id=${branch_id}`,
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
      console.log("✅ Childhood Update Response:", data);
      console.log("📦 Childhood Update Payload Sent:", payload);

      setIsLoading(false);

      Swal.fire({
        icon: "success",
        title: "Childhood Updated Successfully!",
        text: "Childhood assessment has been updated successfully!",
      }).then(() => {
        setChildhoodeditModal(false); // ✅ Close modal after success
      });
    } catch (err) {
      console.error("❌ Childhood Update Error:", err);
      setIsLoading(false);

      Swal.fire({
        icon: "error",
        title: "Unexpected Error",
        text: "Failed to update Childhood assessment. Check console for details.",
      });
    }
  };
  // ✅ Update Childhood Assessment Handler end



// ✅ Prefill Childhood form handler start
const [ChildhoodPrefillData, setChildhoodPrefillData] = useState({});
const [ChildhoodPrefillModal, setChildhoodPrefillModal] = useState(false);

const handleChildhoodPreFill = async (prefillChildhoodID = null) => {
  // Normalize ID if object
  if (typeof prefillChildhoodID === "object" && prefillChildhoodID !== null) {
    prefillChildhoodID =
      prefillChildhoodID.intake_childhood_id || prefillChildhoodID.entry_id;
  }

  if (!prefillChildhoodID) {
    Swal.fire({
      icon: "warning",
      title: "Missing Childhood ID",
      text: "No valid Childhood ID was provided for prefill.",
    });
    return;
  }

  console.log("Childhood ID For Prefill:", prefillChildhoodID);
  const token = localStorage.getItem("Authorization");

  try {
    const branch_id = selectedBranch;
    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/intake-childhood/assessment/${prefillChildhoodID}?branch_id=${branch_id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      }
    );

    const data = await response.json();
    console.log("Raw Childhood API Response:", data);

    if (!response.ok) {
      Swal.fire({
        icon: "error",
        title: "Fetch Failed",
        text: data.message || "Unable to fetch Childhood data for prefill.",
      });
      return;
    }

    const latestAssessment = data.data || null;
    if (!latestAssessment) {
      Swal.fire({
        icon: "info",
        title: "No Data Found",
        text: "No Childhood data available for this ID.",
      });
      return;
    }

    // ✅ Open modal only when we have valid data
    setChildhoodPrefillModal(true);

    // ✅ Wrap in array so PatientCommonInfo works
    setSelectedUser([latestAssessment]);

    // ✅ Build mapped data for Childhood Assessment
    const mappedData = {
      intake_childhood_id: latestAssessment.intake_childhood_id,
      user_id: latestAssessment.user_id,
      entry_id: latestAssessment.entry_id,
      branch_id: latestAssessment.branch_id,
      visit_no: latestAssessment.visit_no,

      date_of_assessment: latestAssessment.date_of_assessment
        ? new Date(latestAssessment.date_of_assessment)
        : null,

      parenting_history: latestAssessment.parenting_history || "",
      family_dispute_childhood: latestAssessment.family_dispute_childhood || "",
      sociality_born_living: latestAssessment.sociality_born_living || "",
      high_risk_behavior: latestAssessment.high_risk_behavior || "",
      impact_substance_movies: latestAssessment.impact_substance_movies || "",
      abuse_history_types: latestAssessment.abuse_history_types || [],
      abuse_history_description:
        latestAssessment.abuse_history_description || "",
      education_status: latestAssessment.education_status || "",
      occupational_status: latestAssessment.occupational_status || "",
      dropout_reason: latestAssessment.dropout_reason || "",
      study_work_details: latestAssessment.study_work_details || "",
      hobbies: latestAssessment.hobbies || "",
      extra_skills: latestAssessment.extra_skills || "",
      achievement_life: latestAssessment.achievement_life || "",
      why_here: latestAssessment.why_here || "",
      why_family_sent: latestAssessment.why_family_sent || "",
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

    setChildhoodPrefillData(mappedData);

    console.log("Mapped Childhood Prefill Data:", mappedData);
  } catch (error) {
    console.error("Prefill fetch error:", error);
    Swal.fire({
      icon: "error",
      title: "Network Error",
      text: "Unable to fetch Childhood data due to a network issue.",
    });
  }
};
// ✅ Prefill Childhood form handler end


// Readmission childhood form handler start
const SubmitChildhoodReadmissonFormHandler = async (e) => {
  e.preventDefault();
  setIsLoading(true);

  const payload = {
    user_id: ChildhoodPrefillData?.user_id,

    date_of_assessment: ChildhoodPrefillData?.date_of_assessment
      ? new Date(ChildhoodPrefillData.date_of_assessment)
          .toISOString()
          .split("T")[0]
      : null,

    parenting_history: ChildhoodPrefillData?.parenting_history || "",
    family_dispute_childhood:
      ChildhoodPrefillData?.family_dispute_childhood || "",
    sociality_born_living: ChildhoodPrefillData?.sociality_born_living || "",
    high_risk_behavior: ChildhoodPrefillData?.high_risk_behavior || "",
    impact_substance_movies:
      ChildhoodPrefillData?.impact_substance_movies || "",
    abuse_history_types: ChildhoodPrefillData?.abuse_history_types || [], // if checkboxes
    abuse_history_description:
      ChildhoodPrefillData?.abuse_history_description || "",

    education_status: ChildhoodPrefillData?.education_status || "",
    occupational_status: ChildhoodPrefillData?.occupational_status || "",
    dropout_reason: ChildhoodPrefillData?.dropout_reason || "",
    study_work_details: ChildhoodPrefillData?.study_work_details || "",
    hobbies: ChildhoodPrefillData?.hobbies || "",
    extra_skills: ChildhoodPrefillData?.extra_skills || "",
    achievement_life: ChildhoodPrefillData?.achievement_life || "",
    why_here: ChildhoodPrefillData?.why_here || "",
    why_family_sent: ChildhoodPrefillData?.why_family_sent || "",
  };

  try {
    const token = localStorage.getItem("Authorization");
    const branch_id = selectedBranch;

    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/intake-childhood/create-assessment?branch_id=${branch_id}`,
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
      title: "Childhood Re-Assessment Created Successfully",
      text: "The childhood re-Assessment was submitted successfully.",
    }).then(() => setIsChildhoodModalOpen(false));

    console.log("Childhood API Data", data);
    console.log("Childhood Payload Sent", payload);
  } catch (err) {
    console.error("Childhood API Error:", err);
    setIsLoading(false);
    Swal.fire({
      icon: "error",
      title: "Unexpected Error",
      text: "Failed to submit. Check console for error.",
    });
  }
};
// Readmission childhood form handler end

  


  //Close all modal handler
  const closeAllmodal = () => {
    setIsChildhoodModalOpen(false);
    setViewChildhoodModal(false);
    setChildhoodeditModal(false);
    setChildhoodPrefillModal(false);
  };

  //Universal data handler
  const handleAssesmentDateChange = (name, date) => {
    setFormData((prev) => ({
      ...prev,
      [name]: date,
    }));
  };

  //🔧 Convert DD/MM/YYYY to Date Object:
  const parseDateString = (dateStr) => {
    if (!dateStr) return null;

    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
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
      filename: `user_data_${viewChildhoodData?.name}_${viewChildhoodData?.user_id}.pdf`,
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

      {/* Childhood create form start */}
      <CommonModal
        isOpen={isChildhoodModalOpen}
        title={childhood}
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
          <form className="theme-form" onSubmit={SubmitChildhoodFormHandler}>
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

            {/* Childhood / बचपन */}

            {/* Parenting History */}
            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>Parenting History / पालन-पोषण का इतिहास</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="parenting_history"
                  value={formData.parenting_history || ""}
                  onChange={handleChange}
                />
              </FormGroup>
            </div>

            {/* Family Dispute */}
            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>
                  If there was a dispute in the family in childhood describe? /
                  बचपन में परिवार में कोई विवाद हुआ हो तो उसका वर्णन करें?
                </Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="family_dispute_childhood"
                  value={formData.family_dispute_childhood || ""}
                  onChange={handleChange}
                />
              </FormGroup>
            </div>

            {/* Sociality */}
            <div className="col-md-12">
              <Label>
                Sociality (where born & living?) / सामाजिकता (जहां पैदा हुआ और
                रहा?)
              </Label>
              <Input
                type="textarea"
                name="sociality_born_living"
                value={formData.sociality_born_living || ""}
                onChange={handleChange}
                placeholder="Enter sociality details..."
              />

              <br />
              <Label>High Risk Behavior / उच्च जोखिम व्यवहार</Label>
              <Input
                type="textarea"
                name="high_risk_behavior"
                value={formData.high_risk_behavior || ""}
                onChange={handleChange}
                placeholder="Enter high risk behavior..."
              />
            </div>

            {/* Impact of Movies */}
            <div className="col-md-12 mt-3 mb-3">
              <FormGroup className="mb-0">
                <Label>
                  What was impact of movies? / फिल्मों का क्या प्रभाव पड़ा?
                </Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="impact_substance_movies"
                  value={formData.impact_substance_movies || ""}
                  onChange={handleChange}
                />
              </FormGroup>
            </div>

            {/* Abuse History */}
            <div className="col-md-12 mt-3 mb-3">
              <FormGroup className="mb-0">
                <Label>
                  Has anyone ever abused you? 1.Emotionally? 2.Physically?
                  3.Sexually? / क्या कभी किसी ने आपके साथ दुर्व्यवहार किया है?
                </Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="abuse_history_description"
                  value={formData.abuse_history_description || ""}
                  onChange={handleChange}
                />
              </FormGroup>
            </div>

            {/* Academics & Occupation */}
            <div className="row">
              <H5 className="mt-3 mb-3">
                Academics & Occupational Details / शैक्षणिक एवं व्यावसायिक विवरण
              </H5>

              <div className="col-md-6">
                <Label>Education Status / शैक्षणिक स्थिति</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="education_status"
                  value={formData.education_status || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-6">
                <Label>Occupational Status / कार्य की स्थिति</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="occupational_status"
                  value={formData.occupational_status || ""}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Dropout Reason */}
            <div className="col-md-12 mt-3">
              <FormGroup className="mb-0">
                <Label>
                  If dropout what is the reason? / यदि ड्रॉपआउट हुआ तो क्या कारण
                  है?
                </Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="dropout_reason"
                  value={formData.dropout_reason || ""}
                  onChange={handleChange}
                />
              </FormGroup>
            </div>

            {/* Study/Work Details */}
            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>Study/Work Details / अध्ययन / कार्य विवरण</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="study_work_details"
                  value={formData.study_work_details || ""}
                  onChange={handleChange}
                />
              </FormGroup>
            </div>

            {/* Hobbies */}
            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>Hobbies / शौक</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="hobbies"
                  value={formData.hobbies || ""}
                  onChange={handleChange}
                />
              </FormGroup>
            </div>

            {/* Extra Skills */}
            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>Extra Skills / अतिरिक्त कौशल</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="extra_skills"
                  value={formData.extra_skills || ""}
                  onChange={handleChange}
                />
              </FormGroup>
            </div>

            {/* Achievement in Life */}
            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>Achievement in life / जीवन में उपलब्धियां</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="achievement_life"
                  value={formData.achievement_life || ""}
                  onChange={handleChange}
                />
              </FormGroup>
            </div>

            {/* Why Here */}
            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>Why are you here? / आप यहाँ क्यों हैं?</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="why_here"
                  value={formData.why_here || ""}
                  onChange={handleChange}
                />
              </FormGroup>
            </div>

            {/* Why Family Sent */}
            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>Why family sent? / परिवार ने क्यों भेजा?</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="why_family_sent"
                  value={formData.why_family_sent || ""}
                  onChange={handleChange}
                />
              </FormGroup>
            </div>

            {/* Submit */}
            <div className="d-flex gap-3 mt-3">
              <Button color="primary" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : (
                  "Create Childhood"
                )}
              </Button>
            </div>
          </form>
        </div>
      </CommonModal>
      {/* Childhood create form end */}

      {/* View Childhood data into modal start */}
      <CommonModal
        isOpen={viewChildhoodModal}
        title="Childhood / बचपन View Form Data"
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
            Childhood / बचपन
          </h4>

          <Table size="sm" className="table-auto table-bordered">
            <tbody style={{ fontSize: "14px" }}>
              {isLoading ? (
                <tr>
                  <td colSpan="2" className="text-center">
                    <div className="loader-box">
                      <Spinner
                        className={
                          selectedSpinner?.spinnerClass || "spinner-border"
                        }
                      />
                    </div>
                  </td>
                </tr>
              ) : viewChildhoodData ? (
                <>
                  <tr>
                    <th className="text-start p-3">Name</th>
                    <td className="border p-3">{viewChildhoodData.name}</td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">Gender</th>
                    <td className="border p-3">{viewChildhoodData.gender}</td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">Phone</th>
                    <td className="border p-3">{viewChildhoodData.phone}</td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">Email</th>
                    <td className="border p-3">{viewChildhoodData.email}</td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">Assessment Date</th>
                    <td className="border p-3">
                      {viewChildhoodData.date_of_assessment
                        ? new Date(
                            viewChildhoodData.date_of_assessment
                          ).toLocaleDateString()
                        : ""}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">Parenting History</th>
                    <td className="border p-3">
                      {viewChildhoodData.parenting_history}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">
                      Family Dispute (Childhood)
                    </th>
                    <td className="border p-3">
                      {viewChildhoodData.family_dispute_childhood}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">
                      Sociality (Born & Living)
                    </th>
                    <td className="border p-3">
                      {viewChildhoodData.sociality_born_living}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">High Risk Behavior</th>
                    <td className="border p-3">
                      {viewChildhoodData.high_risk_behavior}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">Impact of Movies</th>
                    <td className="border p-3">
                      {viewChildhoodData.impact_substance_movies}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">
                      Abuse History Description
                    </th>
                    <td className="border p-3">
                      {viewChildhoodData.abuse_history_description}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">Education Status</th>
                    <td className="border p-3">
                      {viewChildhoodData.education_status}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">Occupational Status</th>
                    <td className="border p-3">
                      {viewChildhoodData.occupational_status}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">Dropout Reason</th>
                    <td className="border p-3">
                      {viewChildhoodData.dropout_reason}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">Study/Work Details</th>
                    <td className="border p-3">
                      {viewChildhoodData.study_work_details}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">Hobbies</th>
                    <td className="border p-3">{viewChildhoodData.hobbies}</td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">Extra Skills</th>
                    <td className="border p-3">
                      {viewChildhoodData.extra_skills}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">Achievement in Life</th>
                    <td className="border p-3">
                      {viewChildhoodData.achievement_life}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">Why Here?</th>
                    <td className="border p-3">{viewChildhoodData.why_here}</td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">Why Family Sent?</th>
                    <td className="border p-3">
                      {viewChildhoodData.why_family_sent}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">Status</th>
                    <td className="border p-3">{viewChildhoodData.status}</td>
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
              ? "Your Childhood / बचपन form is being downloaded.../ आपका Childhood / बचपन form डाउनलोड हो रहा है..."
              : "Download Childhood / बचपन Form"}
          </button>
        </div>
      </CommonModal>
      {/* View Childhood data into modal end */}

      {/* Edit Childhood individual form data start */}
      <CommonModal
        isOpen={SUDChildhoodeditModal}
        title="Edit Childhood /बचपन"
        toggler={closeAllmodal}
        maxWidth="1200px"
      >
        <div className="row px-3 pt-4 pb-3">
          <form
            className="theme-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleChildhoodUpdate();
            }}
          >
            {/* Date of Assessment */}
            <div className="col-md-6 mb-3">
              <Label className="col-sm-12 col-form-label col-xl-6">
                Date of Assessment / मूल्यांकन की तिथि
              </Label>
              <Col xl="5" sm="12">
                <div className="input-group">
                  <DatePicker
                    className="form-control digits"
                    selected={ChildhoodEditData?.date_of_assessment || null}
                    onChange={(date) =>
                      setChildhoodEditData((prev) => ({
                        ...prev,
                        date_of_assessment: date,
                      }))
                    }
                  />
                </div>
              </Col>
            </div>

            {/* Parenting History */}
            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>Parenting History / पालन-पोषण का इतिहास</Label>
                <Input
                  type="textarea"
                  rows="3"
                  name="parenting_history"
                  value={ChildhoodEditData?.parenting_history || ""}
                  onChange={(e) =>
                    setChildhoodEditData((prev) => ({
                      ...prev,
                      parenting_history: e.target.value,
                    }))
                  }
                />
              </FormGroup>
            </div>

            {/* Family Dispute */}
            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>
                  If there was a dispute in the family in childhood describe? /
                  बचपन में परिवार में कोई विवाद हुआ हो तो उसका वर्णन करें?
                </Label>
                <Input
                  type="textarea"
                  rows="3"
                  name="family_dispute_childhood"
                  value={ChildhoodEditData?.family_dispute_childhood || ""}
                  onChange={(e) =>
                    setChildhoodEditData((prev) => ({
                      ...prev,
                      family_dispute_childhood: e.target.value,
                    }))
                  }
                />
              </FormGroup>
            </div>

            {/* Sociality */}
            <div className="col-md-12">
              <Label>
                Sociality (where born & living?) / सामाजिकता (जहां पैदा हुआ और
                रहा?)
              </Label>
              <Input
                type="textarea"
                name="sociality_born_living"
                value={ChildhoodEditData?.sociality_born_living || ""}
                onChange={(e) =>
                  setChildhoodEditData((prev) => ({
                    ...prev,
                    sociality_born_living: e.target.value,
                  }))
                }
              />

              <br />
              <Label>High Risk Behavior / उच्च जोखिम व्यवहार</Label>
              <Input
                type="textarea"
                name="high_risk_behavior"
                value={ChildhoodEditData?.high_risk_behavior || ""}
                onChange={(e) =>
                  setChildhoodEditData((prev) => ({
                    ...prev,
                    high_risk_behavior: e.target.value,
                  }))
                }
              />
            </div>

            {/* Impact of Movies */}
            <div className="col-md-12 mt-3 mb-3">
              <FormGroup className="mb-0">
                <Label>
                  What was impact of movies? / फिल्मों का क्या प्रभाव पड़ा?
                </Label>
                <Input
                  type="textarea"
                  rows="3"
                  name="impact_substance_movies"
                  value={ChildhoodEditData?.impact_substance_movies || ""}
                  onChange={(e) =>
                    setChildhoodEditData((prev) => ({
                      ...prev,
                      impact_substance_movies: e.target.value,
                    }))
                  }
                />
              </FormGroup>
            </div>

            {/* Abuse History */}
            <div className="col-md-12 mt-3 mb-3">
              <FormGroup className="mb-0">
                <Label>
                  Has anyone ever abused you? 1.Emotionally? 2.Physically?
                  3.Sexually? / क्या कभी किसी ने आपके साथ दुर्व्यवहार किया है?
                </Label>
                <Input
                  type="textarea"
                  rows="3"
                  name="abuse_history_description"
                  value={ChildhoodEditData?.abuse_history_description || ""}
                  onChange={(e) =>
                    setChildhoodEditData((prev) => ({
                      ...prev,
                      abuse_history_description: e.target.value,
                    }))
                  }
                />
              </FormGroup>
            </div>

            {/* Academics & Occupation */}
            <div className="row">
              <H5 className="mt-3 mb-3">
                Academics & Occupational Details / शैक्षणिक एवं व्यावसायिक विवरण
              </H5>

              <div className="col-md-6">
                <Label>Education Status / शैक्षणिक स्थिति</Label>
                <Input
                  type="textarea"
                  rows="3"
                  name="education_status"
                  value={ChildhoodEditData?.education_status || ""}
                  onChange={(e) =>
                    setChildhoodEditData((prev) => ({
                      ...prev,
                      education_status: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="col-md-6">
                <Label>Occupational Status / कार्य की स्थिति</Label>
                <Input
                  type="textarea"
                  rows="3"
                  name="occupational_status"
                  value={ChildhoodEditData?.occupational_status || ""}
                  onChange={(e) =>
                    setChildhoodEditData((prev) => ({
                      ...prev,
                      occupational_status: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {/* Dropout Reason */}
            <div className="col-md-12 mt-3">
              <FormGroup className="mb-0">
                <Label>
                  If dropout what is the reason? / यदि ड्रॉपआउट हुआ तो क्या कारण
                  है?
                </Label>
                <Input
                  type="textarea"
                  rows="3"
                  name="dropout_reason"
                  value={ChildhoodEditData?.dropout_reason || ""}
                  onChange={(e) =>
                    setChildhoodEditData((prev) => ({
                      ...prev,
                      dropout_reason: e.target.value,
                    }))
                  }
                />
              </FormGroup>
            </div>

            {/* Study/Work Details */}
            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>Study/Work Details / अध्ययन / कार्य विवरण</Label>
                <Input
                  type="textarea"
                  rows="3"
                  name="study_work_details"
                  value={ChildhoodEditData?.study_work_details || ""}
                  onChange={(e) =>
                    setChildhoodEditData((prev) => ({
                      ...prev,
                      study_work_details: e.target.value,
                    }))
                  }
                />
              </FormGroup>
            </div>

            {/* Hobbies */}
            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>Hobbies / शौक</Label>
                <Input
                  type="textarea"
                  rows="3"
                  name="hobbies"
                  value={ChildhoodEditData?.hobbies || ""}
                  onChange={(e) =>
                    setChildhoodEditData((prev) => ({
                      ...prev,
                      hobbies: e.target.value,
                    }))
                  }
                />
              </FormGroup>
            </div>

            {/* Extra Skills */}
            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>Extra Skills / अतिरिक्त कौशल</Label>
                <Input
                  type="textarea"
                  rows="3"
                  name="extra_skills"
                  value={ChildhoodEditData?.extra_skills || ""}
                  onChange={(e) =>
                    setChildhoodEditData((prev) => ({
                      ...prev,
                      extra_skills: e.target.value,
                    }))
                  }
                />
              </FormGroup>
            </div>

            {/* Achievement in Life */}
            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>Achievement in life / जीवन में उपलब्धियां</Label>
                <Input
                  type="textarea"
                  rows="3"
                  name="achievement_life"
                  value={ChildhoodEditData?.achievement_life || ""}
                  onChange={(e) =>
                    setChildhoodEditData((prev) => ({
                      ...prev,
                      achievement_life: e.target.value,
                    }))
                  }
                />
              </FormGroup>
            </div>

            {/* Why Here */}
            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>Why are you here? / आप यहाँ क्यों हैं?</Label>
                <Input
                  type="textarea"
                  rows="3"
                  name="why_here"
                  value={ChildhoodEditData?.why_here || ""}
                  onChange={(e) =>
                    setChildhoodEditData((prev) => ({
                      ...prev,
                      why_here: e.target.value,
                    }))
                  }
                />
              </FormGroup>
            </div>

            {/* Why Family Sent */}
            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>Why family sent? / परिवार ने क्यों भेजा?</Label>
                <Input
                  type="textarea"
                  rows="3"
                  name="why_family_sent"
                  value={ChildhoodEditData?.why_family_sent || ""}
                  onChange={(e) =>
                    setChildhoodEditData((prev) => ({
                      ...prev,
                      why_family_sent: e.target.value,
                    }))
                  }
                />
              </FormGroup>
            </div>

            {/* Submit */}
            <div className="d-flex gap-3 mt-3">
              <Button color="primary" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : (
                  "Update Childhood Form Data"
                )}
              </Button>
            </div>
          </form>
        </div>
      </CommonModal>
     {/* Edit Childhood individual form data end */}

     {/* Prefill readmission Childhood individual form data start */}
<CommonModal
  isOpen={ChildhoodPrefillModal}
  title="Readmission Childhood / बचपन"
  toggler={closeAllmodal}
  maxWidth="1200px"
>
  <div className="row px-3 pt-4 pb-3">
    <form
      className="theme-form"
      onSubmit={SubmitChildhoodReadmissonFormHandler}
    >
      {/* Date of Assessment */}
      <div className="col-md-6 mb-3">
        <Label className="col-sm-12 col-form-label col-xl-6">
          Date of Assessment / मूल्यांकन की तिथि
        </Label>
        <Col xl="5" sm="12">
          <div className="input-group">
            <DatePicker
              className="form-control digits"
              selected={ChildhoodPrefillData?.date_of_assessment || null}
              onChange={(date) =>
                setChildhoodPrefillData((prev) => ({
                  ...prev,
                  date_of_assessment: date,
                }))
              }
            />
          </div>
        </Col>
      </div>

      {/* Parenting History */}
      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>Parenting History / पालन-पोषण का इतिहास</Label>
          <Input
            type="textarea"
            rows="3"
            name="parenting_history"
            value={ChildhoodPrefillData?.parenting_history || ""}
            onChange={(e) =>
              setChildhoodPrefillData((prev) => ({
                ...prev,
                parenting_history: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>

      {/* Family Dispute */}
      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>
            If there was a dispute in the family in childhood describe? / बचपन
            में परिवार में कोई विवाद हुआ हो तो उसका वर्णन करें?
          </Label>
          <Input
            type="textarea"
            rows="3"
            name="family_dispute_childhood"
            value={ChildhoodPrefillData?.family_dispute_childhood || ""}
            onChange={(e) =>
              setChildhoodPrefillData((prev) => ({
                ...prev,
                family_dispute_childhood: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>

      {/* Sociality */}
      <div className="col-md-12">
        <Label>
          Sociality (where born & living?) / सामाजिकता (जहां पैदा हुआ और रहा?)
        </Label>
        <Input
          type="textarea"
          name="sociality_born_living"
          value={ChildhoodPrefillData?.sociality_born_living || ""}
          onChange={(e) =>
            setChildhoodPrefillData((prev) => ({
              ...prev,
              sociality_born_living: e.target.value,
            }))
          }
        />

        <br />
        <Label>High Risk Behavior / उच्च जोखिम व्यवहार</Label>
        <Input
          type="textarea"
          name="high_risk_behavior"
          value={ChildhoodPrefillData?.high_risk_behavior || ""}
          onChange={(e) =>
            setChildhoodPrefillData((prev) => ({
              ...prev,
              high_risk_behavior: e.target.value,
            }))
          }
        />
      </div>

      {/* Impact of Movies */}
      <div className="col-md-12 mt-3 mb-3">
        <FormGroup className="mb-0">
          <Label>What was impact of movies? / फिल्मों का क्या प्रभाव पड़ा?</Label>
          <Input
            type="textarea"
            rows="3"
            name="impact_substance_movies"
            value={ChildhoodPrefillData?.impact_substance_movies || ""}
            onChange={(e) =>
              setChildhoodPrefillData((prev) => ({
                ...prev,
                impact_substance_movies: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>

      {/* Abuse History */}
      <div className="col-md-12 mt-3 mb-3">
        <FormGroup className="mb-0">
          <Label>
            Has anyone ever abused you? 1.Emotionally? 2.Physically? 3.Sexually?
            / क्या कभी किसी ने आपके साथ दुर्व्यवहार किया है?
          </Label>
          <Input
            type="textarea"
            rows="3"
            name="abuse_history_description"
            value={ChildhoodPrefillData?.abuse_history_description || ""}
            onChange={(e) =>
              setChildhoodPrefillData((prev) => ({
                ...prev,
                abuse_history_description: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>

      {/* Academics & Occupation */}
      <div className="row">
        <H5 className="mt-3 mb-3">
          Academics & Occupational Details / शैक्षणिक एवं व्यावसायिक विवरण
        </H5>

        <div className="col-md-6">
          <Label>Education Status / शैक्षणिक स्थिति</Label>
          <Input
            type="textarea"
            rows="3"
            name="education_status"
            value={ChildhoodPrefillData?.education_status || ""}
            onChange={(e) =>
              setChildhoodPrefillData((prev) => ({
                ...prev,
                education_status: e.target.value,
              }))
            }
          />
        </div>

        <div className="col-md-6">
          <Label>Occupational Status / कार्य की स्थिति</Label>
          <Input
            type="textarea"
            rows="3"
            name="occupational_status"
            value={ChildhoodPrefillData?.occupational_status || ""}
            onChange={(e) =>
              setChildhoodPrefillData((prev) => ({
                ...prev,
                occupational_status: e.target.value,
              }))
            }
          />
        </div>
      </div>

      {/* Dropout Reason */}
      <div className="col-md-12 mt-3">
        <FormGroup className="mb-0">
          <Label>
            If dropout what is the reason? / यदि ड्रॉपआउट हुआ तो क्या कारण है?
          </Label>
          <Input
            type="textarea"
            rows="3"
            name="dropout_reason"
            value={ChildhoodPrefillData?.dropout_reason || ""}
            onChange={(e) =>
              setChildhoodPrefillData((prev) => ({
                ...prev,
                dropout_reason: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>

      {/* Study/Work Details */}
      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>Study/Work Details / अध्ययन / कार्य विवरण</Label>
          <Input
            type="textarea"
            rows="3"
            name="study_work_details"
            value={ChildhoodPrefillData?.study_work_details || ""}
            onChange={(e) =>
              setChildhoodPrefillData((prev) => ({
                ...prev,
                study_work_details: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>

      {/* Hobbies */}
      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>Hobbies / शौक</Label>
          <Input
            type="textarea"
            rows="3"
            name="hobbies"
            value={ChildhoodPrefillData?.hobbies || ""}
            onChange={(e) =>
              setChildhoodPrefillData((prev) => ({
                ...prev,
                hobbies: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>

      {/* Extra Skills */}
      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>Extra Skills / अतिरिक्त कौशल</Label>
          <Input
            type="textarea"
            rows="3"
            name="extra_skills"
            value={ChildhoodPrefillData?.extra_skills || ""}
            onChange={(e) =>
              setChildhoodPrefillData((prev) => ({
                ...prev,
                extra_skills: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>

      {/* Achievement in Life */}
      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>Achievement in life / जीवन में उपलब्धियां</Label>
          <Input
            type="textarea"
            rows="3"
            name="achievement_life"
            value={ChildhoodPrefillData?.achievement_life || ""}
            onChange={(e) =>
              setChildhoodPrefillData((prev) => ({
                ...prev,
                achievement_life: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>

      {/* Why Here */}
      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>Why are you here? / आप यहाँ क्यों हैं?</Label>
          <Input
            type="textarea"
            rows="3"
            name="why_here"
            value={ChildhoodPrefillData?.why_here || ""}
            onChange={(e) =>
              setChildhoodPrefillData((prev) => ({
                ...prev,
                why_here: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>

      {/* Why Family Sent */}
      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>Why family sent? / परिवार ने क्यों भेजा?</Label>
          <Input
            type="textarea"
            rows="3"
            name="why_family_sent"
            value={ChildhoodPrefillData?.why_family_sent || ""}
            onChange={(e) =>
              setChildhoodPrefillData((prev) => ({
                ...prev,
                why_family_sent: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>

      {/* Submit */}
      <div className="d-flex gap-3 mt-3">
        <Button color="primary" type="submit" disabled={isLoading}>
          {isLoading ? (
            <span className="spinner-border spinner-border-sm"></span>
          ) : (
            "Readmission Childhood Form Data"
          )}
        </Button>
      </div>
    </form>
  </div>
</CommonModal>
{/* Prefill readmission Childhood individual form data end */}

    </Fragment>
  );
}

export default Childhood;
