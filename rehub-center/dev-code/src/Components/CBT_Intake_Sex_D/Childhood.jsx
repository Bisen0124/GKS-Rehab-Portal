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


import Translated from "../Translated";
import { useLang } from "../../contexts/LangContext";
import { getTranslation } from "../../utils/translator";

import PatientViewHeader from "../Common/PatientViewHeader";
import TableExportButtons from "../Common/TableExportButtons";
import { SaveDraftButton, DraftNoticeBanner } from "../Common/SaveDraftButton";
import { loadDraft, clearDraft, safeDate } from "../../utils/formDraftManager";
import ModalActionButtons from "../Common/ModalActionButtons";
import UserDetailsModal from "../Common/UserDetailsModal";
import VoiceTextarea from "../VoiceTextarea/VoiceTextarea";
import { useReactToPrint } from "react-to-print";

function Childhood() {

   const { lang } = useLang(); // get current language from context


  //spinner extract from other file
  const selectedSpinner = Data.find(
    (item) => item.spinnerClass === "loader-37"
  );
  //Loading spinner
  const [isLoading, setIsLoading] = useState(false);
  //Branches selection
  const { selectedBranch } = useBranch();
  const [viewUserDetailsModal, setViewUserDetailsModal] = useState(false);
  const [selectedViewUserId, setSelectedViewUserId] = useState(null);

  const handleViewUserDetails = (userId) => {
    setSelectedViewUserId(userId);
    setViewUserDetailsModal(true);
  };

  //Pring vide data in pdf format
  const pdfRef = useRef();

  //This React hook calculates a user's age based on their date of birth (dob) and returns the age on PFA form by create.
  const [selectedUser, setSelectedUser] = useState(null); // User data
  const dob = selectedUser?.dob;
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
        if (!response.ok) throw new Error(getTranslation("Failed to fetch childhood user details/बचपन के यूज़र की जानकारी नहीं मिल पाई",lang));
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

            let isChildhoodCompleted = false;

          let userStatus = (
            <p className="badge bg-warning text-dark p-2">{getTranslation("Pending/लंबित",lang)}</p>
          );
          if (admitDate && RecentChildhoodDate && RecentChildhoodDate > RecentChildhoodDate) {
             isChildhoodCompleted = true;
            userStatus = <p className="badge bg-success p-2">{getTranslation("Completed/पुरा होना।",lang)}</p>;
          }

          const dischargeStatus = user.discharge_status_text || "Unknown";

          return {
            id: user.user_id,
            gks_id: user.gks_id || "N/A",
            name: user.name,
            recentChildhoodIDs: user.recent_intake_childhood_id,
            status: userStatus,
            isChildhoodCompleted,
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
        console.error("Error fetching childhood user data:", error);
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
      name: getTranslation("GKS ID/जीकेएस आईडी",lang),
      selector: (row) => row.gks_id,
      sortable: true,
      center: true,
    },
    {
      name: getTranslation("Patient name/रोगी का नाम",lang),
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
      name: getTranslation("Action/कार्रवाई",lang),
      center: true,
      cell: (row) => {
        // Hide all actions if discharged
        if (row.dischargeStatus === 1) {
          return null;
        }
        return (
          //Showing action buttons on register user list on FDA page
          <div className="d-flex gap-2">
            {/* View User Details Icon */}
            <span
              onClick={() => handleViewUserDetails(row.id)}
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
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </span>

            {/* Show Edit only if not discharged and readmission */}
            {row.dischargeStatus === 0 && row.isReadmission === 1 && (
              <span
                onClick={() => handleChildhoodPreFill(row.recentChildhoodIDs)}
                style={{ cursor: "pointer" }}
                title={getTranslation("Readmission Childhood Form/पुनः प्रवेश बचपन फॉर्म",lang)}
              >
                ✏️
              </span>
            )}

{row.dischargeStatus === 0 && row.isReadmission === 0 && (
  <span
    onClick={() => CreateChildHoodHandler(row.id)}
    style={{
      cursor: "pointer",
    }}
    title={getTranslation("Create Childhood Form/बचपन प्रपत्र बनाएं",lang)}
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
      name: getTranslation("Childhood ID's/बचपन आईडी",lang),
      selector: (row) => row.intake_childhood_id,
      sortable: true,
      center: true,
    },
    // { name: "GKS ID", selector: (row) => row.gks_id, sortable: true, center: true },
    {
      name: getTranslation("Name/नाम",lang),
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
      name: getTranslation("Email/ईमेल",lang),
      selector: (row) => row.email,
      sortable: true,
      center: true,
    },
    {
      name: getTranslation("Phone/फ़ोन",lang),
      selector: (row) => row.phone,
      sortable: true,
      center: true,
    },
    {
      name: getTranslation("Status/स्थिति",lang),
      selector: (row) => row.status,
      sortable: true,
      cell: (row) => (
        <span style={{ color: row.disabled ? "#999" : "#000" }}>
          <p className="badge bg-success p-2">Childhood {row.status}</p>
        </span>
      ),
    },
    {
      name: getTranslation("Action/कार्रवाई",lang),
      center: true,
      cell: (row) => (
        <div className="d-flex gap-2">
          <span
            onClick={() => viewChildhoodFormData(row.intake_childhood_id)}
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
          <span
            onClick={() =>
              handleChildhoodindividualEdit(row.intake_childhood_id)
            }
            style={{ cursor: "pointer", marginLeft: "10px" }}
            title={getTranslation("Edit/संपादन करना",lang)}
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
  const [draftTimestamp, setDraftTimestamp] = useState(null);
  const [currentChildhoodUserId, setCurrentChildhoodUserId] = useState(null);

  const initialChildhoodFormData = {
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
  };

  const CreateChildHoodHandler = async (userId = null) => {
    setIsChildhoodModalOpen(true);
    const targetId = userId || currentChildhoodUserId;
    if (userId) setCurrentChildhoodUserId(userId);

    if (targetId) {
      const saved = loadDraft("childhood", targetId);
      if (saved && saved.data) {
        setFormData(saved.data);
        setDraftTimestamp(saved.savedAt);
      } else {
        setFormData(initialChildhoodFormData);
        setDraftTimestamp(null);
      }

      const token = localStorage.getItem("Authorization");
      const branch_id = selectedBranch;

      try {
        const response = await fetch(
          `https://gks-yjdc.onrender.com/api/users/${targetId}?branch_id=${branch_id}`,
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
  const [formData, setFormData] = useState(initialChildhoodFormData);
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
      const userTargetId = selectedUser?.user_id || selectedUser?.id || currentChildhoodUserId;
      clearDraft("childhood", userTargetId);
      setDraftTimestamp(null);

      Swal.fire({
        icon: "success",
        title: getTranslation("Childhood Assessment Created Successfully/बचपन का मूल्यांकन सफलतापूर्वक बनाया गया",lang),
        text: getTranslation("The childhood assessment was submitted successfully./बचपन का मूल्यांकन सफलतापूर्वक प्रस्तुत किया गया।",lang),
      }).then(() => setIsChildhoodModalOpen(false));

      console.log("Childhood API Data", data);
      console.log("Childhood Payload Sent", payload);
    } catch (err) {
      console.error("Childhood API Error:", err);
      setIsLoading(false);
      Swal.fire({
        icon: "error",
        title: getTranslation("Unexpected Error/अप्रत्याशित त्रुटि",lang),
        text: getTranslation("Failed to submit. Check console for error./सबमिट करने में विफल. त्रुटि के लिए कंसोल की जाँच करें.",lang),
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
        title: getTranslation("Childhood Updated Successfully!/बचपन सफलतापूर्वक अपडेट किया गया!",lang),
        text: getTranslation("Childhood assessment has been updated successfully!/बचपन का मूल्यांकन सफलतापूर्वक अद्यतन कर दिया गया है!",lang),
      }).then(() => {
        setChildhoodeditModal(false); // ✅ Close modal after success
      });
    } catch (err) {
      console.error("❌ Childhood Update Error:", err);
      setIsLoading(false);

      Swal.fire({
        icon: "error",
        title: getTranslation("Unexpected Error/अप्रत्याशित त्रुटि",lang),
        text: getTranslation("Failed to update Childhood assessment. Check console for details./बचपन का आकलन अपडेट करने में विफल। विवरण के लिए कंसोल देखें।",lang),
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
      title: getTranslation("Missing Childhood ID/गुमशुदा बचपन की आईडी",lang),
      text: getTranslation("No valid Childhood ID was provided for prefill./प्रीफिल के लिए कोई वैध चाइल्डहुड आईडी प्रदान नहीं की गई।",lang),
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
        title: getTranslation("Fetch Failed/प्राप्त करना विफल",lang),
        text: data.message || getTranslation("Unable to fetch Childhood data for prefill./प्रीफ़िल के लिए बचपन का डेटा प्राप्त करने में असमर्थ.",lang),
      });
      return;
    }

    const latestAssessment = data.data || null;
    if (!latestAssessment) {
      Swal.fire({
        icon: "info",
        title: getTranslation("No Data Found/डाटा प्राप्त नहीं हुआ",lang),
        text: getTranslation("No Childhood data available for this ID./इस आईडी के लिए कोई बचपन संबंधी डेटा उपलब्ध नहीं है।",lang),
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
      title: getTranslation("Network Error/नेटवर्क त्रुटि",lang),
      text: getTranslation("Unable to fetch Childhood data due to a network issue./नेटवर्क समस्या के कारण बचपन का डेटा प्राप्त करने में असमर्थ.",lang),
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
      title: getTranslation("Childhood Re-Assessment Created Successfully/बचपन का पुनर्मूल्यांकन सफलतापूर्वक बनाया गया",lang),
      text: getTranslation("The childhood re-Assessment was submitted successfully./बचपन का पुनः मूल्यांकन सफलतापूर्वक प्रस्तुत किया गया।",lang),
    }).then(() => setIsChildhoodModalOpen(false));

    console.log("Childhood API Data", data);
    console.log("Childhood Payload Sent", payload);
  } catch (err) {
    console.error("Childhood API Error:", err);
    setIsLoading(false);
    Swal.fire({
      icon: "error",
      title: getTranslation("Unexpected Error/अप्रत्याशित त्रुटि",lang),
      text: getTranslation("Failed to submit. Check console for error./सबमिट करने में विफल. त्रुटि के लिए कंसोल की जाँच करें.",lang),
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

    const patientName = viewChildhoodData?.name || viewChildhoodData?.patient_name || "Patient";
    const gksId = viewChildhoodData?.custom_code || viewChildhoodData?.gks_id || viewChildhoodData?.uid || viewChildhoodData?.user_id || "";
    const safeName = String(patientName).trim().replace(/\s+/g, "_");
    const safeId = String(gksId).trim().replace(/\s+/g, "_");

    const opt = {
      margin: [10, 10, 10, 10], // top, left, bottom, right
      filename: `patient_${safeName}_${safeId || "childhood_report"}.pdf`,
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
                      title={getTranslation("Registered Patient List/पंजीकृत रोगी सूची",lang)}
                      className="p-0"
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
                          onChange={handleSearchChange}
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
                        filename="Childhood_History_Registration_List"
                        title={getTranslation("Childhood History Registration List / बचपन का इतिहास पंजीकरण सूची", lang)}
                      />
                    </div>
                  </div>
                  {stillLoading ? (
                    <div className="loading-text">
                      {getTranslation("Data is fetching from server. Please wait.../सर्वर से डेटा प्राप्त किया जा रहा है। कृपया प्रतीक्षा करें...",lang)}
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
                    <HeaderCard title={getTranslation("All Childhood /बचपन Patient Data List",lang)} className="p-0" />
                  </div>
                  <div className="row pb-3 align-items-center">
                    <div className="col-md-5 col-12 mb-2 mb-md-0">
                      <InputGroup>
                        <Input
                          className="form-control"
                          type="text"
                         placeholder={getTranslation("Search......./खोज.......",lang)}
                          value={searchTextone}
                          onChange={handleSearchChangeone}
                        />
                        <span className="input-group-text">
                          <i className="fa fa-search"></i>
                        </span>
                      </InputGroup>
                    </div>
                    <div className="col-md-7 col-12 d-flex justify-content-md-end justify-content-start">
                      <TableExportButtons
                        data={filteredDataone}
                        columns={tableColumnsFDAList}
                        filename="All_Childhood_Patient_List"
                        title={getTranslation("All Childhood Patient Data List / सभी बचपन रोगी डेटा सूची", lang)}
                      />
                    </div>
                  </div>
                  {stillLoading ? (
                    <div className="loading-text">
                      {getTranslation("Data is fetching from server. Please wait.../सर्वर से डेटा प्राप्त किया जा रहा है। कृपया प्रतीक्षा करें...",lang)}
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
        title={getTranslation("Create Childhood Form /बचपन का फॉर्म बनाएँ",lang)}
        toggler={closeAllmodal}
        maxWidth="1200px"
      >
        <DraftNoticeBanner
          draftTimestamp={draftTimestamp}
          formKey="childhood"
          targetId={selectedUser?.user_id || selectedUser?.id || currentChildhoodUserId}
          onDiscard={() => {
            setFormData(initialChildhoodFormData);
            setDraftTimestamp(null);
          }}
        />
        <PatientCommonInfo
          selectedUser={selectedUser}
          labels={{
            name: getTranslation("Patient name/प्रयासक का नाम :",lang),
            sex: getTranslation("Gender/प्रयासक का लिंग :",lang),
            age: getTranslation("Age/प्रयासक का उम्र :",lang),
            date_of_admission: getTranslation("Date of Admission/प्रवेश की तिथि :",lang),
            ageValue: patientCalAge,
          }}
        />
        <div className="row px-3 pt-4 pb-3">
          <form className="theme-form" onSubmit={SubmitChildhoodFormHandler}>
            <div class="col-md-6 mb-3">
              <Label className="col-sm-12 col-form-label  col-xl-6">
                {getTranslation(dateOfAssessment,lang)}
              </Label>
              <Col xl="5" sm="12">
                <div className="input-group">
                  <DatePicker showMonthDropdown showYearDropdown dropdownMode="select"
                    className="form-control digits"
                    selected={safeDate(formData.dateOfAssessment)}
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
                <Label>{getTranslation("Parenting History / पालन-पोषण का इतिहास",lang)}</Label>
                {/* <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="parenting_history"
                  value={formData.parenting_history || ""}
                  onChange={handleChange}
                /> */}

{/* <VoiceTextarea
  className="form-control"
  rows="3"
  name="parenting_history"
  value={formData.parenting_history || ""}
  onChange={handleChange}
/> */}

<select
  className="form-control"
  name="parenting_history"
  value={formData.parenting_history || ""}
  onChange={handleChange}
>
  <option value="">{getTranslation("Select / चुनें", lang)}</option>

  <option value="With Mother Father">
    {getTranslation("With Mother Father / माँ-बाप के साथ", lang)}
  </option>

  <option value="With Grand Parent">
    {getTranslation("With Grand Parent / दादा-दादी के साथ", lang)}
  </option>

  <option value="In Hostel">
    {getTranslation("In Hostel / हॉस्टल में", lang)}
  </option>

  <option value="With Relatives">
    {getTranslation("With Relatives / रिश्तेदारों के साथ", lang)}
  </option>

  <option value="With Single Parent">
    {getTranslation("With Single Parent / सिंगल पेरेंट के साथ", lang)}
  </option>
</select>

              </FormGroup>
            </div>

            {/* Family Dispute */}
            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>
                 {getTranslation(" If there was a dispute in the family in childhood describe? / बचपन में परिवार में कोई विवाद हुआ हो तो उसका वर्णन करें?",lang)}
                </Label>
                {/* <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="family_dispute_childhood"
                  value={formData.family_dispute_childhood || ""}
                  onChange={handleChange}
                /> */}

<VoiceTextarea
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
                {getTranslation("Sociality (where born & living?) / सामाजिकता (जहां पैदा हुआ और रहा?)",lang)}
              </Label>
              {/* <Input
                type="textarea"
                name="sociality_born_living"
                value={formData.sociality_born_living || ""}
                onChange={handleChange}
                placeholder="Enter sociality details..."
              /> */}

{/* <VoiceTextarea
  className="form-control"
  rows="3"
  name="sociality_born_living"
  value={formData.sociality_born_living || ""}
  onChange={handleChange}
  placeholder="Enter sociality details..."
/> */}

<select
  className="form-control"
  name="sociality_born_living"
  value={formData.sociality_born_living || ""}
  onChange={handleChange}
>
  <option value="">{getTranslation("Select / चुनें", lang)}</option>

  <option value="Sociality">
    {getTranslation("Sociality / सामाजिकता", lang)}
  </option>

  <option value="Addict Surrounding">
    {getTranslation("Addict Surrounding / आस-पास की लत", lang)}
  </option>

  <option value="Social Atmosphere">
    {getTranslation("Social Atmosphere / सामाजिक माहौल", lang)}
  </option>

  <option value="Anti Social Locality">
    {getTranslation("Anti Social Locality / असामाजिक इलाका", lang)}
  </option>
</select>


              <br />
              <Label>{getTranslation("High Risk Behavior / उच्च जोखिम व्यवहार",lang)}</Label>
              {/* <Input
                type="textarea"
                name="high_risk_behavior"
                value={formData.high_risk_behavior || ""}
                onChange={handleChange}
                placeholder="Enter high risk behavior..."
              /> */}

<VoiceTextarea
  className="form-control"
  rows="3"
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
                  {getTranslation("What was impact of movies? / फिल्मों का क्या प्रभाव पड़ा?",lang)}
                </Label>
                {/* <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="impact_substance_movies"
                  value={formData.impact_substance_movies || ""}
                  onChange={handleChange}
                /> */}

<VoiceTextarea
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
                  {getTranslation("Has anyone ever abused you? 1.Emotionally? 2.Physically? 3.Sexually? / क्या कभी किसी ने आपके साथ दुर्व्यवहार किया है? 1. भावनात्मक रूप से? 2. शारीरिक रूप से? 3. यौन रूप से?",lang)}
                </Label>
                {/* <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="abuse_history_description"
                  value={formData.abuse_history_description || ""}
                  onChange={handleChange}
                /> */}

<VoiceTextarea
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
                {getTranslation("Academics & Occupational Details / शैक्षणिक एवं व्यावसायिक विवरण",lang)}
              </H5>

              <div className="col-md-6">
                <Label>{getTranslation("Education Status / शैक्षणिक स्थिति",lang)}</Label>
                {/* <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="education_status"
                  value={formData.education_status || ""}
                  onChange={handleChange}
                /> */}

{/* <VoiceTextarea
  className="form-control"
  rows="3"
  name="education_status"
  value={formData.education_status || ""}
  onChange={handleChange}
/> */}

<select
  className="form-control"
  name="education_status"
  value={formData.education_status || ""}
  onChange={handleChange}
>
  <option value="">{getTranslation("Select / चुनें", lang)}</option>

  <option value="Illiterate">
    {getTranslation("Illiterate / अनपढ़", lang)}
  </option>

  <option value="Student">
    {getTranslation("Student / स्टूडेंट", lang)}
  </option>

  <option value="5th">
    {getTranslation("5th / 5वीं", lang)}
  </option>

  <option value="10th">
    {getTranslation("10th / 10वीं", lang)}
  </option>

  <option value="12th">
    {getTranslation("12th / 12वीं", lang)}
  </option>

  <option value="Graduate">
    {getTranslation("Graduate / ग्रेजुएट", lang)}
  </option>

  <option value="Post Graduate">
    {getTranslation("Post Graduate / पोस्ट ग्रेजुएट", lang)}
  </option>

  <option value="Dropout">
    {getTranslation("Dropout / ड्रॉपआउट", lang)}
  </option>
</select>


              </div>

              <div className="col-md-6">
                <Label>{getTranslation("Occupational Status / कार्य की स्थिति",lang)}</Label>
                {/* <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="occupational_status"
                  value={formData.occupational_status || ""}
                  onChange={handleChange}
                /> */}

{/* <VoiceTextarea
   className="form-control"
   rows="3"
   name="occupational_status"
   value={formData.occupational_status || ""}
   onChange={handleChange}
/> */}

<select
  className="form-control"
  name="occupational_status"
  value={formData.occupational_status || ""}
  onChange={handleChange}
>
  <option value="">{getTranslation("Select / चुनें", lang)}</option>

  <option value="Working">
    {getTranslation("Working / काम कर रहा है", lang)}
  </option>

  <option value="Dropout">
    {getTranslation("Dropout / ड्रॉपआउट", lang)}
  </option>

  <option value="Student">
    {getTranslation("Student / स्टूडेंट", lang)}
  </option>

  <option value="Expelled due to addiction">
    {getTranslation("Expelled due to addiction / लत की वजह से निकाला गया", lang)}
  </option>

  <option value="Switched due to addiction">
    {getTranslation("Switched due to addiction / लत की वजह से स्विच किया गया", lang)}
  </option>

  <option value="NA">
    {getTranslation("NA / ना", lang)}
  </option>
</select>


              </div>
            </div>

            {/* Dropout Reason */}
            <div className="col-md-12 mt-3">
              <FormGroup className="mb-0">
                <Label>
                  {getTranslation("If dropout what is the reason? / यदि ड्रॉपआउट हुआ तो क्या कारण है?",lang)}
                </Label>
                {/* <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="dropout_reason"
                  value={formData.dropout_reason || ""}
                  onChange={handleChange}
                /> */}

{/* <VoiceTextarea
   className="form-control"
   rows="3"
   name="dropout_reason"
   value={formData.dropout_reason || ""}
   onChange={handleChange}
/> */}

<select
  className="form-control"
  name="dropout_reason"
  value={formData.dropout_reason || ""}
  onChange={handleChange}
>
<option value="">{getTranslation("Select / चुनें", lang)}</option>

<option value="Addiction">
  {getTranslation("Addiction / लत", lang)}
</option>

<option value="Personal">
  {getTranslation("Personal / पर्सनल", lang)}
</option>

<option value="NA">
  {getTranslation("NA", lang)}
</option>

</select>


              </FormGroup>
            </div>

            {/* Study/Work Details */}
            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{getTranslation("Study or Work Details/अध्ययन या कार्य विवरण",lang)}</Label>
                {/* <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="study_work_details"
                  value={formData.study_work_details || ""}
                  onChange={handleChange}
                /> */}

{/* <VoiceTextarea
   className="form-control"
   rows="3"
   name="study_work_details"
   value={formData.study_work_details || ""}
   onChange={handleChange}
/> */}
<select
  className="form-control"
  name="study_work_details"
  value={formData.study_work_details || ""}
  onChange={handleChange}
>
  <option value="">
    {getTranslation("Select / चुनें", lang)}
  </option>

  <option value="Average">
    {getTranslation("Average / औसत", lang)}
  </option>

  <option value="Below average">
    {getTranslation("Below average / औसत से नीचे", lang)}
  </option>

  <option value="Above average">
    {getTranslation("Above average / औसत से ऊपर", lang)}
  </option>
</select>


              </FormGroup>
            </div>

            {/* Hobbies */}
            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{getTranslation("Hobbies / शौक",lang)}</Label>
                {/* <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="hobbies"
                  value={formData.hobbies || ""}
                  onChange={handleChange}
                /> */}

<VoiceTextarea
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
                <Label>{getTranslation("Extra Skills / अतिरिक्त कौशल",lang)}</Label>
                {/* <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="extra_skills"
                  value={formData.extra_skills || ""}
                  onChange={handleChange}
                /> */}

<VoiceTextarea
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
                <Label>{getTranslation("Achievement in life / जीवन में उपलब्धियां",lang)}</Label>
                {/* <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="achievement_life"
                  value={formData.achievement_life || ""}
                  onChange={handleChange}
                /> */}

<VoiceTextarea
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
                <Label>{getTranslation("Why are you here? / आप यहाँ क्यों हैं?",lang)}</Label>
                {/* <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="why_here"
                  value={formData.why_here || ""}
                  onChange={handleChange}
                /> */}

<VoiceTextarea
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
                <Label>{getTranslation("Why family sent? / परिवार ने क्यों भेजा?",lang)}</Label>
                {/* <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="why_family_sent"
                  value={formData.why_family_sent || ""}
                  onChange={handleChange}
                /> */}

<VoiceTextarea
   className="form-control"
   rows="3"
   name="why_family_sent"
   value={formData.why_family_sent || ""}
   onChange={handleChange}
/>

              </FormGroup>
            </div>

            {/* Submit & Save Draft */}
            <div className="d-flex align-items-center gap-3 mt-3 flex-wrap">
              <SaveDraftButton
                formKey="childhood"
                targetId={selectedUser?.user_id || selectedUser?.id || currentChildhoodUserId}
                formData={formData}
                onDraftSaved={() => setDraftTimestamp(Date.now())}
                style={{ height: "38px", padding: "6px 16px" }}
              />

              <Button color="primary" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : (
                  getTranslation("Create Childhood/बचपन बनाएँ",lang)
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
        title={getTranslation("View Childhood Form/ बचपन का फॉर्म देखें",lang)}
        toggler={closeAllmodal}
        maxWidth="1200px"
      >
        <div className="table-responsive p-4" ref={pdfRef} style={{ background: "#f8fafc" }}>
          {viewChildhoodData && <PatientViewHeader data={viewChildhoodData} />}

          <h4
            style={{
              textAlign: "center",
              textDecoration: "underline",
              padding: "20px 0",
            }}
          >
            {getTranslation("Childhood / बचपन",lang)}
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
                    <th className="text-start p-3">{getTranslation("Name/नाम",lang)}</th>
                    <td className="border p-3">{viewChildhoodData.name}</td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("Gender/लिंग",lang)}</th>
                    <td className="border p-3">{viewChildhoodData.gender}</td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("Phone/फ़ोन",lang)}</th>
                    <td className="border p-3">{viewChildhoodData.phone}</td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("Email/ईमेल",lang)}</th>
                    <td className="border p-3">{viewChildhoodData.email}</td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("Assessment Date/मूल्यांकन तिथि",lang)}</th>
                    <td className="border p-3">
                      {viewChildhoodData.date_of_assessment
                        ? new Date(
                            viewChildhoodData.date_of_assessment
                          ).toLocaleDateString()
                        : ""}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("Parenting History/पालन-पोषण का इतिहास",lang)}</th>
                    <td className="border p-3">
                      {viewChildhoodData.parenting_history}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">
                      {getTranslation("Family Dispute (Childhood)/पारिवारिक विवाद (बचपन)",lang)}
                    </th>
                    <td className="border p-3">
                      {viewChildhoodData.family_dispute_childhood}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">
                      {getTranslation("Sociality (Born & Living)/सामाजिकता (जन्म और जीवन)",lang)}
                    </th>
                    <td className="border p-3">
                      {viewChildhoodData.sociality_born_living}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("High Risk Behavior/उच्च जोखिम वाला व्यवहार",lang)}</th>
                    <td className="border p-3">
                      {viewChildhoodData.high_risk_behavior}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("Impact of Movies/फिल्मों का प्रभाव",lang)}</th>
                    <td className="border p-3">
                      {viewChildhoodData.impact_substance_movies}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">
                     {getTranslation("Abuse History Description/दुर्व्यवहार इतिहास विवरण",lang)}
                    </th>
                    <td className="border p-3">
                      {viewChildhoodData.abuse_history_description}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("Education Status/शिक्षा की स्थिति",lang)}</th>
                    <td className="border p-3">
                      {viewChildhoodData.education_status}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("Occupational Status/व्यावसायिक स्थिति",lang)}</th>
                    <td className="border p-3">
                      {viewChildhoodData.occupational_status}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("Dropout Reason/ड्रॉपआउट का कारण",lang)}</th>
                    <td className="border p-3">
                      {viewChildhoodData.dropout_reason}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("Study/Work Details/अध्ययन/कार्य विवरण",lang)}</th>
                    <td className="border p-3">
                      {viewChildhoodData.study_work_details}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("Hobbies/शौक",lang)}</th>
                    <td className="border p-3">{viewChildhoodData.hobbies}</td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("Extra Skills/अतिरिक्त कौशल",lang)}</th>
                    <td className="border p-3">
                      {viewChildhoodData.extra_skills}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("Achievement in Life/जीवन में उपलब्धियाँ",lang)}</th>
                    <td className="border p-3">
                      {viewChildhoodData.achievement_life}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("Why Here?/यहां क्यों?",lang)}</th>
                    <td className="border p-3">{viewChildhoodData.why_here}</td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("Why Family Sent?/परिवार ने क्यों भेजा?",lang)}</th>
                    <td className="border p-3">
                      {viewChildhoodData.why_family_sent}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("Status/स्थिति",lang)}</th>
                    <td className="border p-3">{viewChildhoodData.status}</td>
                  </tr>
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

        <ModalActionButtons
          onClose={closeAllmodal}
          onPrint={handlePrint}
          onDownload={handleDownloadPDF}
          isDownloading={pfaDownload}
          downloadText={getTranslation("Download Childhood / बचपन फॉर्म", lang)}
        />
      </CommonModal>
      {/* View Childhood data into modal end */}

      {/* Edit Childhood individual form data start */}
      <CommonModal
        isOpen={SUDChildhoodeditModal}
        title={getTranslation("Edit Childhood /बचपन",lang)}
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
                {getTranslation("Date of Assessment / मूल्यांकन की तिथि",lang)}
              </Label>
              <Col xl="5" sm="12">
                <div className="input-group">
                  <DatePicker showMonthDropdown showYearDropdown dropdownMode="select"
                    className="form-control digits"
                    selected={safeDate(ChildhoodEditData?.date_of_assessment)}
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
                <Label>{getTranslation("Parenting History / पालन-पोषण का इतिहास",lang)}</Label>
                {/* <Input
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
                /> */}

{/* <VoiceTextarea
   className="form-control"
   rows="3"
   name="parenting_history"
   value={ChildhoodEditData?.parenting_history || ""}
   onChange={(e) =>
     setChildhoodEditData((prev) => ({
       ...prev,
       parenting_history: e.target.value,
     }))
   }
/> */}

<select
  className="form-control"
  name="parenting_history"
  value={ChildhoodEditData?.parenting_history || ""}
  onChange={(e) =>
    setChildhoodEditData((prev) => ({
      ...prev,
      parenting_history: e.target.value,
    }))
  }
>
  <option value="">{getTranslation("Select / चुनें", lang)}</option>

  <option value="With Mother Father">
    {getTranslation("With Mother Father / माँ-बाप के साथ", lang)}
  </option>

  <option value="With Grand Parent">
    {getTranslation("With Grand Parent / दादा-दादी के साथ", lang)}
  </option>

  <option value="In Hostel">
    {getTranslation("In Hostel / हॉस्टल में", lang)}
  </option>

  <option value="With Relatives">
    {getTranslation("With Relatives / रिश्तेदारों के साथ", lang)}
  </option>

  <option value="With Single Parent">
    {getTranslation("With Single Parent / सिंगल पेरेंट के साथ", lang)}
  </option>
</select>


              </FormGroup>
            </div>

            {/* Family Dispute */}
            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>
                  {getTranslation("If there was a dispute in the family in childhood describe? / बचपन में परिवार में कोई विवाद हुआ हो तो उसका वर्णन करें?",lang)}
                </Label>
                {/* <Input
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
                /> */}

<VoiceTextarea
   className="form-control"
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
                {getTranslation("Sociality (where born & living?) / सामाजिकता (जहां पैदा हुआ और रहा?)",lang)}
              </Label>
              {/* <Input
                type="textarea"
                name="sociality_born_living"
                value={ChildhoodEditData?.sociality_born_living || ""}
                onChange={(e) =>
                  setChildhoodEditData((prev) => ({
                    ...prev,
                    sociality_born_living: e.target.value,
                  }))
                }
              /> */}
{/* <VoiceTextarea
   className="form-control"
   rows="3"
   name="sociality_born_living"
   value={ChildhoodEditData?.sociality_born_living || ""}
   onChange={(e) =>
     setChildhoodEditData((prev) => ({
       ...prev,
       sociality_born_living: e.target.value,
     }))
   }
/> */}

<select
  className="form-control"
  name="sociality_born_living"
  value={ChildhoodEditData?.sociality_born_living || ""}
  onChange={(e) =>
    setChildhoodEditData((prev) => ({
      ...prev,
      sociality_born_living: e.target.value,
    }))
  }
>
  <option value="">{getTranslation("Select / चुनें", lang)}</option>

  <option value="Sociality">
    {getTranslation("Sociality / सामाजिकता", lang)}
  </option>

  <option value="Addict Surrounding">
    {getTranslation("Addict Surrounding / आस-पास की लत", lang)}
  </option>

  <option value="Social Atmosphere">
    {getTranslation("Social Atmosphere / सामाजिक माहौल", lang)}
  </option>

  <option value="Anti Social Locality">
    {getTranslation("Anti Social Locality / असामाजिक इलाका", lang)}
  </option>
</select>


              <br />
              <Label>{getTranslation("High Risk Behavior / उच्च जोखिम व्यवहार",lang)}</Label>
              {/* <Input
                type="textarea"
                name="high_risk_behavior"
                value={ChildhoodEditData?.high_risk_behavior || ""}
                onChange={(e) =>
                  setChildhoodEditData((prev) => ({
                    ...prev,
                    high_risk_behavior: e.target.value,
                  }))
                }
              /> */}

<VoiceTextarea
   className="form-control"
   rows="3"
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
                 {getTranslation(" What was impact of movies? / फिल्मों का क्या प्रभाव पड़ा?",lang)}
                </Label>
                {/* <Input
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
                /> */}

<VoiceTextarea
   className="form-control"
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
                  {getTranslation("Has anyone ever abused you? 1.Emotionally? 2.Physically? 3.Sexually? / क्या कभी किसी ने आपके साथ दुर्व्यवहार किया है? 1. भावनात्मक रूप से? 2. शारीरिक रूप से? 3. यौन रूप से?",lang)}
                </Label>
                {/* <Input
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
                /> */}

<VoiceTextarea
   className="form-control"
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
                {getTranslation("Academics & Occupational Details / शैक्षणिक एवं व्यावसायिक विवरण",lang)}
              </H5>

              <div className="col-md-6">
                <Label>{getTranslation("Education Status / शैक्षणिक स्थिति",lang)}</Label>
                {/* <Input
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
                /> */}

{/* <VoiceTextarea
   className="form-control"
   rows="3"
   name="education_status"
   value={ChildhoodEditData?.education_status || ""}
   onChange={(e) =>
     setChildhoodEditData((prev) => ({
       ...prev,
       education_status: e.target.value,
     }))
   }
/> */}
<select
  className="form-control"
  name="education_status"
  value={ChildhoodEditData?.education_status || ""}
  onChange={(e) =>
    setChildhoodEditData((prev) => ({
      ...prev,
      education_status: e.target.value,
    }))
  }
>
  <option value="">{getTranslation("Select / चुनें", lang)}</option>

  <option value="Illiterate">
    {getTranslation("Illiterate / अनपढ़", lang)}
  </option>

  <option value="Student">
    {getTranslation("Student / स्टूडेंट", lang)}
  </option>

  <option value="5th">
    {getTranslation("5th / 5वीं", lang)}
  </option>

  <option value="10th">
    {getTranslation("10th / 10वीं", lang)}
  </option>

  <option value="12th">
    {getTranslation("12th / 12वीं", lang)}
  </option>

  <option value="Graduate">
    {getTranslation("Graduate / ग्रेजुएट", lang)}
  </option>

  <option value="Post Graduate">
    {getTranslation("Post Graduate / पोस्ट ग्रेजुएट", lang)}
  </option>

  <option value="Dropout">
    {getTranslation("Dropout / ड्रॉपआउट", lang)}
  </option>
</select>


              </div>

              <div className="col-md-6">
                <Label>{getTranslation("Occupational Status / कार्य की स्थिति",lang)}</Label>
                {/* <Input
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
                /> */}

{/* <VoiceTextarea
   className="form-control"
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
          */}

<select
  className="form-control"
  name="education_status"
  value={ChildhoodEditData?.education_status || ""}
  onChange={(e) =>
    setChildhoodEditData((prev) => ({
      ...prev,
      education_status: e.target.value,
    }))
  }
>
  <option value="">{getTranslation("Select / चुनें", lang)}</option>

  <option value="Illiterate">
    {getTranslation("Illiterate / अनपढ़", lang)}
  </option>

  <option value="Student">
    {getTranslation("Student / स्टूडेंट", lang)}
  </option>

  <option value="5th">
    {getTranslation("5th / 5वीं", lang)}
  </option>

  <option value="10th">
    {getTranslation("10th / 10वीं", lang)}
  </option>

  <option value="12th">
    {getTranslation("12th / 12वीं", lang)}
  </option>

  <option value="Graduate">
    {getTranslation("Graduate / ग्रेजुएट", lang)}
  </option>

  <option value="Post Graduate">
    {getTranslation("Post Graduate / पोस्ट ग्रेजुएट", lang)}
  </option>

  <option value="Dropout">
    {getTranslation("Dropout / ड्रॉपआउट", lang)}
  </option>
</select>

              </div>
            </div>

            {/* Dropout Reason */}
            <div className="col-md-12 mt-3">
              <FormGroup className="mb-0">
                <Label>
                 {getTranslation(" If dropout what is the reason? / यदि ड्रॉपआउट हुआ तो क्या कारण है?",lang)}
                </Label>
                {/* <Input
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
                /> */}

{/* <VoiceTextarea
   className="form-control"
   rows="3"
   name="dropout_reason"
                  value={ChildhoodEditData?.dropout_reason || ""}
                  onChange={(e) =>
                    setChildhoodEditData((prev) => ({
                      ...prev,
                      dropout_reason: e.target.value,
                    }))
                  }
/>  */}

<select
  className="form-control"
  name="dropout_reason"
  value={ChildhoodEditData?.dropout_reason || ""}
  onChange={(e) =>
    setChildhoodEditData((prev) => ({
      ...prev,
      dropout_reason: e.target.value,
    }))
  }
>
<option value="">{getTranslation("Select / चुनें", lang)}</option>

<option value="Addiction">
  {getTranslation("Addiction / लत", lang)}
</option>

<option value="Personal">
  {getTranslation("Personal / पर्सनल", lang)}
</option>

<option value="NA">
  {getTranslation("NA", lang)}
</option>

</select>


              </FormGroup>
            </div>

            {/* Study/Work Details */}
            <div className="col-md-12">
              <FormGroup className="mb-0">
              <Label>{getTranslation("Study or Work Details/अध्ययन या कार्य विवरण",lang)}</Label>
                {/* <Input
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
                /> */}

{/* <VoiceTextarea
   className="form-control"
   rows="3"
   name="study_work_details"
   value={ChildhoodEditData?.study_work_details || ""}
   onChange={(e) =>
     setChildhoodEditData((prev) => ({
       ...prev,
       study_work_details: e.target.value,
     }))
   }
/>  */}

<select
  className="form-control"
  name="study_work_details"
  value={ChildhoodEditData?.study_work_details || ""}
  onChange={(e) =>
    setChildhoodEditData((prev) => ({
      ...prev,
      study_work_details: e.target.value,
    }))
  }
>
  <option value="">
    {getTranslation("Select / चुनें", lang)}
  </option>

  <option value="Average">
    {getTranslation("Average / औसत", lang)}
  </option>

  <option value="Below average">
    {getTranslation("Below average / औसत से नीचे", lang)}
  </option>

  <option value="Above average">
    {getTranslation("Above average / औसत से ऊपर", lang)}
  </option>
</select>

              </FormGroup>
            </div>

            {/* Hobbies */}
            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{getTranslation("Hobbies / शौक",lang)}</Label>
                {/* <Input
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
                /> */}

<VoiceTextarea
   className="form-control"
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
                <Label>{getTranslation("Extra Skills / अतिरिक्त कौशल",lang)}</Label>
                {/* <Input
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
                /> */}

<VoiceTextarea
   className="form-control"
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
                <Label>{getTranslation("Achievement in life / जीवन में उपलब्धियां",lang)}</Label>
                {/* <Input
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
                /> */}

<VoiceTextarea
   className="form-control"
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
                <Label>{getTranslation("Why are you here? / आप यहाँ क्यों हैं?",lang)}</Label>
                {/* <Input
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
                /> */}

<VoiceTextarea
   className="form-control"
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
                <Label>{getTranslation("Why family sent? / परिवार ने क्यों भेजा?",lang)}</Label>
                {/* <Input
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
                /> */}

<VoiceTextarea
   className="form-control"
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
                  getTranslation("Update Childhood Form Data/बचपन के फ़ॉर्म का डेटा अपडेट करें",lang)
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
  title={getTranslation("Readmission Childhood / पुनः प्रवेश बचपन फॉर्म",lang)}
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
          {getTranslation("Date of Assessment / मूल्यांकन की तिथि",lang)}
        </Label>
        <Col xl="5" sm="12">
          <div className="input-group">
            <DatePicker showMonthDropdown showYearDropdown dropdownMode="select"
              className="form-control digits"
              selected={safeDate(ChildhoodPrefillData?.date_of_assessment)}
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
          <Label>{getTranslation("Parenting History / पालन-पोषण का इतिहास",lang)}</Label>
          {/* <Input
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
          /> */}

{/* <VoiceTextarea
   className="form-control"
   rows="3"
   name="parenting_history"
            value={ChildhoodPrefillData?.parenting_history || ""}
            onChange={(e) =>
              setChildhoodPrefillData((prev) => ({
                ...prev,
                parenting_history: e.target.value,
              }))
            }
/>  */}

<select
  className="form-control"
  name="parenting_history"
  value={ChildhoodPrefillData?.parenting_history || ""}
  onChange={(e) =>
    setChildhoodPrefillData((prev) => ({
      ...prev,
      parenting_history: e.target.value,
    }))
  }
>
  <option value="">{getTranslation("Select / चुनें", lang)}</option>

  <option value="With Mother Father">
    {getTranslation("With Mother Father / माँ-बाप के साथ", lang)}
  </option>

  <option value="With Grand Parent">
    {getTranslation("With Grand Parent / दादा-दादी के साथ", lang)}
  </option>

  <option value="In Hostel">
    {getTranslation("In Hostel / हॉस्टल में", lang)}
  </option>

  <option value="With Relatives">
    {getTranslation("With Relatives / रिश्तेदारों के साथ", lang)}
  </option>

  <option value="With Single Parent">
    {getTranslation("With Single Parent / सिंगल पेरेंट के साथ", lang)}
  </option>
</select>


        </FormGroup>
      </div>

      {/* Family Dispute */}
      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>
            {getTranslation("If there was a dispute in the family in childhood describe? / बचपन में परिवार में कोई विवाद हुआ हो तो उसका वर्णन करें?",lang)}
          </Label>
          {/* <Input
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
          /> */}

<VoiceTextarea
   className="form-control"
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
          {getTranslation("Sociality (where born & living?) / सामाजिकता (जहां पैदा हुआ और रहा?)",lang)}
        </Label>
        {/* <Input
          type="textarea"
          name="sociality_born_living"
          value={ChildhoodPrefillData?.sociality_born_living || ""}
          onChange={(e) =>
            setChildhoodPrefillData((prev) => ({
              ...prev,
              sociality_born_living: e.target.value,
            }))
          }
        /> */}

{/* <VoiceTextarea
   className="form-control"
   rows="3"
   name="sociality_born_living"
   value={ChildhoodPrefillData?.sociality_born_living || ""}
   onChange={(e) =>
     setChildhoodPrefillData((prev) => ({
       ...prev,
       sociality_born_living: e.target.value,
     }))
   }
/>  */}
<select
  className="form-control"
  name="sociality_born_living"
  value={ChildhoodPrefillData?.sociality_born_living || ""}
  onChange={(e) =>
    setChildhoodPrefillData((prev) => ({
      ...prev,
      sociality_born_living: e.target.value,
    }))
  }
>
  <option value="">{getTranslation("Select / चुनें", lang)}</option>

  <option value="Sociality">
    {getTranslation("Sociality / सामाजिकता", lang)}
  </option>

  <option value="Addict Surrounding">
    {getTranslation("Addict Surrounding / आस-पास की लत", lang)}
  </option>

  <option value="Social Atmosphere">
    {getTranslation("Social Atmosphere / सामाजिक माहौल", lang)}
  </option>

  <option value="Anti Social Locality">
    {getTranslation("Anti Social Locality / असामाजिक इलाका", lang)}
  </option>
</select>


        <br />
        <Label>{getTranslation("High Risk Behavior / उच्च जोखिम व्यवहार",lang)}</Label>
        {/* <Input
          type="textarea"
          name="high_risk_behavior"
          value={ChildhoodPrefillData?.high_risk_behavior || ""}
          onChange={(e) =>
            setChildhoodPrefillData((prev) => ({
              ...prev,
              high_risk_behavior: e.target.value,
            }))
          }
        /> */}

<VoiceTextarea
   className="form-control"
   rows="3"
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
          <Label>{getTranslation("What was impact of movies? / फिल्मों का क्या प्रभाव पड़ा?",lang)}</Label>
          {/* <Input
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
          /> */}

<VoiceTextarea
   className="form-control"
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
            {getTranslation("Has anyone ever abused you? 1.Emotionally? 2.Physically? 3.Sexually? / क्या कभी किसी ने आपके साथ दुर्व्यवहार किया है? 1. भावनात्मक रूप से? 2. शारीरिक रूप से? 3. यौन रूप से?",lang)}
          </Label>
          {/* <Input
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
          /> */}

<VoiceTextarea
   className="form-control"
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
          {getTranslation("Academics & Occupational Details / शैक्षणिक एवं व्यावसायिक विवरण",lang)}
        </H5>

        <div className="col-md-6">
          <Label>{getTranslation("Education Status / शैक्षणिक स्थिति",lang)}</Label>
          {/* <Input
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
          /> */}

{/* <VoiceTextarea
   className="form-control"
   rows="3"
   name="education_status"
            value={ChildhoodPrefillData?.education_status || ""}
            onChange={(e) =>
              setChildhoodPrefillData((prev) => ({
                ...prev,
                education_status: e.target.value,
              }))
            }
/>  */}
<select
  className="form-control"
  name="education_status"
  value={ChildhoodPrefillData?.education_status || ""}
  onChange={(e) =>
    setChildhoodPrefillData((prev) => ({
      ...prev,
      education_status: e.target.value,
    }))
  }
>
  <option value="">{getTranslation("Select / चुनें", lang)}</option>

  <option value="Illiterate">
    {getTranslation("Illiterate / अनपढ़", lang)}
  </option>

  <option value="Student">
    {getTranslation("Student / स्टूडेंट", lang)}
  </option>

  <option value="5th">
    {getTranslation("5th / 5वीं", lang)}
  </option>

  <option value="10th">
    {getTranslation("10th / 10वीं", lang)}
  </option>

  <option value="12th">
    {getTranslation("12th / 12वीं", lang)}
  </option>

  <option value="Graduate">
    {getTranslation("Graduate / ग्रेजुएट", lang)}
  </option>

  <option value="Post Graduate">
    {getTranslation("Post Graduate / पोस्ट ग्रेजुएट", lang)}
  </option>

  <option value="Dropout">
    {getTranslation("Dropout / ड्रॉपआउट", lang)}
  </option>
</select>


        </div>

        <div className="col-md-6">
          <Label>{getTranslation("Occupational Status / कार्य की स्थिति",lang)}</Label>
          {/* <Input
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
          /> */}

{/* <VoiceTextarea
   className="form-control"
   rows="3"
   name="occupational_status"
   value={ChildhoodPrefillData?.occupational_status || ""}
   onChange={(e) =>
     setChildhoodPrefillData((prev) => ({
       ...prev,
       occupational_status: e.target.value,
     }))
   }
/>  */}

<select
  className="form-control"
  name="occupational_status"
  value={ChildhoodPrefillData?.occupational_status || ""}
  onChange={(e) =>
    setChildhoodPrefillData((prev) => ({
      ...prev,
      occupational_status: e.target.value,
    }))
  }
>
  <option value="">{getTranslation("Select / चुनें", lang)}</option>

  <option value="Working">
    {getTranslation("Working / काम कर रहा है", lang)}
  </option>

  <option value="Dropout">
    {getTranslation("Dropout / ड्रॉपआउट", lang)}
  </option>

  <option value="Student">
    {getTranslation("Student / स्टूडेंट", lang)}
  </option>

  <option value="Expelled due to addiction">
    {getTranslation(
      "Expelled due to addiction / लत की वजह से निकाला गया",
      lang
    )}
  </option>

  <option value="Switched due to addiction">
    {getTranslation(
      "Switched due to addiction / लत की वजह से स्विच किया गया",
      lang
    )}
  </option>

  <option value="NA">
    {getTranslation("NA", lang)}
  </option>
</select>


        </div>
      </div>

      {/* Dropout Reason */}
      <div className="col-md-12 mt-3">
        <FormGroup className="mb-0">
          <Label>
            {getTranslation("If dropout what is the reason? / यदि ड्रॉपआउट हुआ तो क्या कारण है?",lang)}
          </Label>
          {/* <Input
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
          /> */}

{/* <VoiceTextarea
   className="form-control"
   rows="3"
   name="dropout_reason"
   value={ChildhoodPrefillData?.dropout_reason || ""}
   onChange={(e) =>
     setChildhoodPrefillData((prev) => ({
       ...prev,
       dropout_reason: e.target.value,
     }))
   }
/>  */}

<select
  className="form-control"
  name="dropout_reason"
  value={ChildhoodPrefillData?.dropout_reason || ""}
  onChange={(e) =>
    setChildhoodPrefillData((prev) => ({
      ...prev,
      dropout_reason: e.target.value,
    }))
  }
>
<option value="">{getTranslation("Select / चुनें", lang)}</option>

<option value="Addiction">
  {getTranslation("Addiction / लत", lang)}
</option>

<option value="Personal">
  {getTranslation("Personal / पर्सनल", lang)}
</option>

<option value="NA">
  {getTranslation("NA", lang)}
</option>

</select>


        </FormGroup>
      </div>

      {/* Study/Work Details */}
      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>{getTranslation("Study/Work Details / अध्ययन / कार्य विवरण",lang)}</Label>
          {/* <Input
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
          /> */}

{/* <VoiceTextarea
   className="form-control"
   rows="3"
   name="study_work_details"
   value={ChildhoodPrefillData?.study_work_details || ""}
   onChange={(e) =>
     setChildhoodPrefillData((prev) => ({
       ...prev,
       study_work_details: e.target.value,
     }))
   }
/>  */}
<select
  className="form-control"
  name="study_work_details"
  value={ChildhoodPrefillData?.study_work_details || ""}
  onChange={(e) =>
    setChildhoodPrefillData((prev) => ({
      ...prev,
      study_work_details: e.target.value,
    }))
  }
>
  <option value="">
    {getTranslation("Select / चुनें", lang)}
  </option>

  <option value="Average">
    {getTranslation("Average / औसत", lang)}
  </option>

  <option value="Below average">
    {getTranslation("Below average / औसत से नीचे", lang)}
  </option>

  <option value="Above average">
    {getTranslation("Above average / औसत से ऊपर", lang)}
  </option>
</select>


        </FormGroup>
      </div>

      {/* Hobbies */}
      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>{getTranslation("Hobbies / शौक",lang)}</Label>
          {/* <Input
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
          /> */}

<VoiceTextarea
   className="form-control"
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
          <Label>{getTranslation("Extra Skills / अतिरिक्त कौशल",lang)}</Label>
          {/* <Input
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
          /> */}

<VoiceTextarea
   className="form-control"
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
          <Label>{getTranslation("Achievement in life / जीवन में उपलब्धियां",lang)}</Label>
          {/* <Input
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
          /> */}

<VoiceTextarea
   className="form-control"
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
          <Label>{getTranslation("Why are you here? / आप यहाँ क्यों हैं?",lang)}</Label>
          {/* <Input
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
          /> */}

<VoiceTextarea
   className="form-control"
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
          <Label>{getTranslation("Why family sent? / परिवार ने क्यों भेजा?",lang)}</Label>
          {/* <Input
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
          /> */}

<VoiceTextarea
   className="form-control"
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
            getTranslation("Readmission Childhood Form Data/पुनः प्रवेश बचपन फॉर्म डेटा",lang)
          )}
        </Button>
      </div>
    </form>
  </div>
</CommonModal>
{/* Prefill readmission Childhood individual form data end */}

      {/* View user details modal */}
      <UserDetailsModal
        isOpen={viewUserDetailsModal}
        userId={selectedViewUserId}
        toggler={() => setViewUserDetailsModal(false)}
      />

    </Fragment>
  );
}

export default Childhood;
