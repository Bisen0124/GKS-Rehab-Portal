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
  substanceStatus,
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

import { Btn, H5, Breadcrumbs, H4 } from "../../AbstractElements";

import Translated from "../Translated";
import { useLang } from "../../contexts/LangContext";
import { getTranslation } from "../../utils/translator";

function RelationshipFamily() {

   const { lang } = useLang(); // get current language from context

  //Branches selection
  const { selectedBranch } = useBranch();

  //Pring vide data in pdf format
  const pdfRef = useRef();

  //This React hook calculates a user's age based on their date of birth (dob) and returns the age on PFA form by create.
  const [selectedUser, setSelectedUser] = useState(null); // User data
  const dob = selectedUser?.dob;
  const patientCalAge = useCalculateAge(dob);
  console.log("DOB", patientCalAge);

  //spinner extract from other file
  const selectedSpinner = Data.find(
    (item) => item.spinnerClass === "loader-37"
  );
  //Loading spinner
  const [isLoading, setIsLoading] = useState(false);

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
          const IRFDate = user.recent_irf_date
            ? new Date(user.recent_irf_date)
            : null;

            let isIRFCompleted = false;
          let userStatus = (
            <p className="badge bg-warning text-dark p-2">{"Pending"}</p>
          );
          if (admitDate && IRFDate && admitDate > IRFDate) {
             isIRFCompleted = true;
            userStatus = <p className="badge bg-success p-2">{"Completed"}</p>;
          }

          const dischargeStatus = user.discharge_status_text || "Unknown";

          return {
            id: user.user_id,
            gks_id: user.gks_id || "N/A",
            IRFrecentIds: user.recent_irf_id,
            name: user.name,
            status: userStatus,
            isIRFCompleted,
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
      name: `${getTranslation('User ID/उपयोगकर्ता आईडी' , lang)}`,
      selector: (row) => row.id,
      sortable: true,
      center: true,
    },
    {
    name: `${getTranslation('Patient name/रोगी का नाम' , lang)}`,
      selector: (row) => row.gks_id,
      sortable: true,
      center: true,
    },
    {
     name: `${getTranslation('Email/ईमेल' , lang)}`,
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
      name: `${getTranslation('Status/स्थिति' , lang)}`,
      selector: (row) => row.status,
      sortable: true,
      cell: (row) => (
        <span style={{ color: row.disabled ? "#999" : "#000" }}>
          {row.status}
        </span>
      ),
    },

    {
      name: `${getTranslation('Action/क्रिया' , lang)}`,
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
                onClick={() => handleIRFprefill(row.IRFrecentIds)}
                style={{ cursor: "pointer" }}
                title="Readmission FDA Form"
              >
                ✏️
              </span>
            )}


{/* <span
                onClick={() => handleIRFprefill(row.IRFrecentIds)}
                style={{ cursor: "pointer" }}
                title="Readmission FDA Form"
              >
                ✏️
              </span> */}
            {/* Show Create PFA if not discharged and not readmission */}
            {/* {row.dischargeStatus === 0 && row.isReadmission === 0 && (
              <span
                onClick={() => createIRFForm(row.id)}
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
            )} */}

{row.dischargeStatus === 0 && row.isReadmission === 0 && (
  <span
    onClick={() => (row.isIRFCompleted ? null : createIRFForm(row.id))}
    style={{
      cursor: row.isIRFCompleted ? "not-allowed" : "pointer",
      opacity: row.isIRFCompleted ? 0.5 : 1,
    }}
    title={row.isIRFCompleted ? "RF Completed" : "Create Relationship Family Form"}
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
      `https://gks-yjdc.onrender.com/api/irf/all-entries?branch_id=${selectedBranch}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      }
    )
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch IRF entries list");
        return response.json();
      })
      .then((res) => {
        const irfEntries = res.data || [];

        const formattedIRFPatients = irfEntries.map((item) => ({
          // Top level
          irf_id: item.irf_id,
          status: item.status,

          // User details
          user_id: item.user?.user_id || null,
          name: item.user?.name || "",
          phone: item.user?.phone || "",
          email: item.user?.email || "",

          // Entry details
          entry_id: item.entry?.entry_id || null,
          visit_no: item.entry?.visit_no || null,
          admit_date: item.entry?.admit_date || null,
          discharge_date: item.entry?.discharge_date || null,
          discharge_status: item.entry?.discharge_status || null,
          ward_name: item.entry?.ward_name || "",

          // Assessment
          date_of_assessment: item.assessment?.date_of_assessment || null,
          relationship_status: item.assessment?.relationship_status || "",
          marriage_arrangement: item.assessment?.marriage_arrangement || "",
          after_marriage_status: item.assessment?.after_marriage_status || "",

          // Family Information
          family_members: item.family_information?.family_members || [],
          disorder_desc: item.family_information?.disorder_desc || "",
          family_history_details: item.family_information
            ?.family_history_details || {
            father_side: {},
            mother_side: {},
          },
          any_other_father_side_mention:
            item.family_information?.any_other_father_side_mention || "",
          any_other_mother_side_mention:
            item.family_information?.any_other_mother_side_mention || "",
          psych_problem_desc: item.family_information?.psych_problem_desc || "",

          // Current Status
          current_status: item.current_status?.current_status || "",
          bonding_relation_with_user:
            item.current_status?.bonding_relation_with_user || "",
          family_behavior_with_patient:
            item.current_status?.family_behavior_with_patient || "",
          head_of_family: item.current_status?.head_of_family || "",
          family_relationships: item.current_status?.family_relationships || "",

          // Audit info
          created_by: item.audit?.created_by || "",
          updated_by: item.audit?.updated_by || "",
          created_at: item.audit?.created_at || null,
          updated_at: item.audit?.updated_at || null,
        }));

        console.log("Formatted IRF Patients:", formattedIRFPatients);

        setTimeout(() => {
          setfdaData(formattedIRFPatients);
          setFilteredDataone(formattedIRFPatients);
          setstillLoading(false);
        }, 500);
      })
      .catch((error) => {
        console.error("Error fetching IRF entries:", error);
        setstillLoading(true);
      });
  }, [selectedBranch]);

  const tableColumnsFDAList = [
    {
      name: `${getTranslation('Relationship & Family Status ID / रिश्ते और पारिवारिक स्थिति ID' , lang)}`,
      selector: (row) => row.irf_id,
      sortable: true,
      center: true,
    },
    // { name: "GKS ID", selector: (row) => row.gks_id, sortable: true, center: true },
    {
     name: `${getTranslation('Patient Phone/मरीज़ का फ़ोन' , lang)}`,
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
     name: `${getTranslation('Email/ईमेल' , lang)}`,
      selector: (row) => row.email,
      sortable: true,
      center: true,
    },
    {
     name: `${getTranslation('Patient Phone/मरीज़ का फ़ोन' , lang)}`,
      selector: (row) => row.phone,
      sortable: true,
      center: true,
    },
    {
      name: `${getTranslation('Status/स्थिति' , lang)}`,
      selector: (row) => row.status,
      sortable: true,
      cell: (row) => (
        <span style={{ color: row.disabled ? "#999" : "#000" }}>
          <p className="badge bg-success p-2">IRF {row.status}</p>
        </span>
      ),
    },
    {
      name: `${getTranslation('Action/क्रिया' , lang)}`,
      center: true,
      cell: (row) => (
        <div className="d-flex gap-2">
          <span
            onClick={() => viewIRFFormData(row.irf_id)}
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
            onClick={() => handleIRFIndividualEdit(row.irf_id)}
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

  //Create IRF brief form function start
  const [isIRFModalOpen, setIsIRFModalOpen] = useState(false);
  const createIRFForm = async (userId = null) => {
    setIsIRFModalOpen(true);
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
  //Create IRF brief form function end

  //Submit IRF form handler start
  // ✅ State
  const [formData, setFormData] = useState({
    dateOfAssessment: new Date(),
    relationship_status: "",
    marriage_arrangement: "",
    after_marriage_status: "",
    family_members: [
      {
        name: "",
        relation: "",
        age: "",
        living_status: "",
        physical_disorder: "",
      },
    ],
    disorder_desc: "",
    family_history_data: {
      mother_side: {
        grandmother: { alcohol: "No", substance: "No", psych: "No" },
        grandfather: { alcohol: "No", substance: "No", psych: "No" },
        mother: { alcohol: "No", substance: "No", psych: "No" },
        aunt: { alcohol: "No", substance: "No", psych: "No" }, // 👈 MUST exist
        uncle: { alcohol: "No", substance: "No", psych: "No" }, // 👈 MUST exist
      },
      father_side: {
        grandmother: { alcohol: "No", substance: "No", psych: "No" },
        grandfather: { alcohol: "No", substance: "No", psych: "No" },
        father: { alcohol: "No", substance: "No", psych: "No" },
        aunt: { alcohol: "No", substance: "No", psych: "No" }, // 👈 MUST exist
        uncle: { alcohol: "No", substance: "No", psych: "No" }, // 👈 MUST exist
      },
    },
    any_other_mother_side_mention: "",
    any_other_father_side_mention: "",
    psych_problem_desc: "",
    current_status: "",
    relationship_with_user: "",
    family_behavior: "",
    head_of_family: "",
    relationships_with_family: "",
  });

  //Get data value
  const handleAssesmentDateChange = (name, date) => {
    setFormData((prev) => ({
      ...prev,
      [name]: date,
    }));
  };

  // ✅ Generic input/textarea handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ✅ Family members table handler
  const handleMemberInputChange = (index, e) => {
    const { name, value } = e.target;
    const updated = [...formData.family_members];
    updated[index][name] = value;
    setFormData((prev) => ({
      ...prev,
      family_members: updated,
    }));
  };

  // ✅ Family history handler (checkboxes)
  const handleFamilyHistoryChange = (side, member, field, value) => {
    setFormData((prev) => ({
      ...prev,
      family_history_data: {
        ...prev.family_history_data,
        [side]: {
          ...prev.family_history_data[side],
          [member]: {
            ...prev.family_history_data[side][member],
            [field]: value,
          },
        },
      },
    }));
  };

  // Family history for "if any" text inputs
  // const handleFamilyHistoryIfAny = (side, value) => {
  //   setFormData((prev) => ({
  //     ...prev,
  //     family_history_data: {
  //       ...prev.family_history_data,
  //       [side]: {
  //         ...prev.family_history_data[side],
  //         [`${side}_if_any`]: value,
  //       },
  //     },
  //   }));
  // };

  // ✅ Add/remove family members
  const addInterferenceRow = () => {
    setFormData((prev) => ({
      ...prev,
      family_members: [
        ...prev.family_members,
        {
          name: "",
          relation: "",
          age: "",
          living_status: "",
          physical_disorder: "",
        },
      ],
    }));
  };

  const removeInterferenceRow = (index) => {
    const updated = [...formData.family_members];
    updated.splice(index, 1);
    setFormData((prev) => ({
      ...prev,
      family_members: updated,
    }));
  };

  // IRF Submit handler start
  const SubmitIRFFormHandler = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Start loader

    // 🛠️ Construct payload in correct format
    const payload = {
      user_id: selectedUser?.user_id,
      date_of_assessment: formData.dateOfAssessment
        ?.toISOString()
        .split("T")[0], // "YYYY-MM-DD"
      relationship_status: formData.relationship_status || "",
      marriage_arrangement: formData.marriage_arrangement || "",
      after_marriage_status: formData.after_marriage_status || "",

      // ✅ Array of family members
      family_members:
        formData.family_members?.map((member) => ({
          name: member.name || "",
          relation: member.relation || "",
          age: member.age || "",
          living_status: member.living_status || "",
          physical_disorder: member.physical_disorder || "",
        })) || [],

      disorder_desc: formData.disorder_desc || "",

      // ✅ Family History Details (structured)
      family_history_details: {
        father_side: {
          grandmother: {
            alcohol:
              formData.family_history_data?.father_side?.grandmother?.alcohol ||
              "No",
            substance:
              formData.family_history_data?.father_side?.grandmother
                ?.substance || "No",
            psych:
              formData.family_history_data?.father_side?.grandmother?.psych ||
              "No",
          },
          grandfather: {
            alcohol:
              formData.family_history_data?.father_side?.grandfather?.alcohol ||
              "No",
            substance:
              formData.family_history_data?.father_side?.grandfather
                ?.substance || "No",
            psych:
              formData.family_history_data?.father_side?.grandfather?.psych ||
              "No",
          },
          father: {
            alcohol:
              formData.family_history_data?.father_side?.father?.alcohol ||
              "No",
            substance:
              formData.family_history_data?.father_side?.father?.substance ||
              "No",
            psych:
              formData.family_history_data?.father_side?.father?.psych || "No",
          },
          aunt: {
            alcohol:
              formData.family_history_data?.father_side?.aunt?.alcohol || "No",
            substance:
              formData.family_history_data?.father_side?.aunt?.substance ||
              "No",
            psych:
              formData.family_history_data?.father_side?.aunt?.psych || "No",
          },
          uncle: {
            alcohol:
              formData.family_history_data?.father_side?.uncle?.alcohol || "No",
            substance:
              formData.family_history_data?.father_side?.uncle?.substance ||
              "No",
            psych:
              formData.family_history_data?.father_side?.uncle?.psych || "No",
          },
        },
        mother_side: {
          grandmother: {
            alcohol:
              formData.family_history_data?.mother_side?.grandmother?.alcohol ||
              "No",
            substance:
              formData.family_history_data?.mother_side?.grandmother
                ?.substance || "No",
            psych:
              formData.family_history_data?.mother_side?.grandmother?.psych ||
              "No",
          },
          grandfather: {
            alcohol:
              formData.family_history_data?.mother_side?.grandfather?.alcohol ||
              "No",
            substance:
              formData.family_history_data?.mother_side?.grandfather
                ?.substance || "No",
            psych:
              formData.family_history_data?.mother_side?.grandfather?.psych ||
              "No",
          },
          mother: {
            alcohol:
              formData.family_history_data?.mother_side?.mother?.alcohol ||
              "No",
            substance:
              formData.family_history_data?.mother_side?.mother?.substance ||
              "No",
            psych:
              formData.family_history_data?.mother_side?.mother?.psych || "No",
          },
          aunt: {
            alcohol:
              formData.family_history_data?.mother_side?.aunt?.alcohol || "No",
            substance:
              formData.family_history_data?.mother_side?.aunt?.substance ||
              "No",
            psych:
              formData.family_history_data?.mother_side?.aunt?.psych || "No",
          },
          uncle: {
            alcohol:
              formData.family_history_data?.mother_side?.uncle?.alcohol || "No",
            substance:
              formData.family_history_data?.mother_side?.uncle?.substance ||
              "No",
            psych:
              formData.family_history_data?.mother_side?.uncle?.psych || "No",
          },
        },
      },

      any_other_father_side_mention:
        formData.any_other_father_side_mention || "",
      any_other_mother_side_mention:
        formData.any_other_mother_side_mention || "",
      psych_problem_desc: formData.psych_problem_desc || "",
      current_status: formData.current_status || "",
      bonding_relation_with_user: formData.bonding_relation_with_user || "",
      family_behavior_with_patient: formData.family_behavior_with_patient || "",
      head_of_family: formData.head_of_family || "",
      family_relationships: formData.family_relationships || "",
    };

    console.log("📦 IRF Payload:", payload);

    try {
      const token = localStorage.getItem("Authorization");
      const branch_id = selectedBranch;

      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/irf/create-assessment?branch_id=${branch_id}`,
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
        title: "IRF Created Successfully",
        text: "The IRF assessment was submitted successfully.",
      }).then(() => setIsIRFModalOpen(false));

      console.log("✅ IRF Data:", data);
    } catch (err) {
      console.error("❌ IRF Submit Error:", err);
      setIsLoading(false);

      Swal.fire({
        icon: "error",
        title: "Unexpected Error",
        text: "Failed to submit IRF. Check console for error.",
      });
    }
  };
  // IRF Submit handler end

  //IRF view hanlder start
  const [viewIRFData, setViewIRFData] = useState(null);
  const [viewIRFModal, setviewIRFModal] = useState(false);
  const viewIRFFormData = async (IRFID) => {
    setviewIRFModal(true);
    console.log("IRF ID =>", IRFID);

    if (typeof IRFID === "object" && IRFID !== null) {
      IRFID = IRFID.intake_sud_id;
    }

    if (!IRFID) {
      console.error("Invalid IRF ID provided");
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem("Authorization");

    try {
      const branch_id = selectedBranch;
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/irf/assessment/${IRFID}?branch_id=${branch_id}`,
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
      const ViewIRFDataEntry = data.data || null;
      console.log("Extracted IRF View Data Entry:", ViewIRFDataEntry); // ✅ should show full assessment object

      if (!ViewIRFDataEntry) {
        console.warn("No IRF assessment data found.");
        return;
      }

      setViewIRFData(ViewIRFDataEntry);
      console.log("IRF Data Fetched ID:", ViewIRFDataEntry.intake_sud_id);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  //IRF view hanlder end

  // IRF edit handler start
  const [IRFEditData, setIRFEditData] = useState(null);
  const [IRFEditModal, setIRFEditModal] = useState(false);

  const handleIRFIndividualEdit = async (editIRFID = null) => {
    setIRFEditModal(true);

    if (typeof editIRFID === "object" && editIRFID !== null) {
      editIRFID = editIRFID.irf_id;
    }

    if (!editIRFID) {
      console.error("Invalid IRF ID provided");
      return;
    }

    console.log("IRF ID For Edit:", editIRFID);
    const token = localStorage.getItem("Authorization");

    try {
      const branch_id = selectedBranch;
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/irf/assessment/${editIRFID}?branch_id=${branch_id}`,
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

      const latestAssessment = data.data || null;

      if (!latestAssessment) {
        console.warn("No assessment found for this IRF ID.");
        return;
      }

      setSelectedUser(latestAssessment);
      console.log("Selected IRF Assessment for edit:", latestAssessment);

      // ✅ Map IRF payload into your form structure
      setIRFEditData({
        irf_id: latestAssessment.irf_id,
        user_id: latestAssessment.user_id,
        entry_id: latestAssessment.entry_id,
        branch_id: latestAssessment.branch_id,
        visit_no: latestAssessment.visit_no,

        date_of_assessment: latestAssessment.date_of_assessment
          ? new Date(latestAssessment.date_of_assessment)
          : "",

        relationship_status: latestAssessment.relationship_status || "",
        marriage_arrangement: latestAssessment.marriage_arrangement || "",
        after_marriage_status: latestAssessment.after_marriage_status || "",

        // ✅ Family members
        family_members: latestAssessment.family_members || [],

        disorder_desc: latestAssessment.disorder_desc || "",

        // ✅ Family history
        family_history_details: latestAssessment.family_history_details || {
          father_side: {},
          mother_side: {},
        },

        any_other_father_side_mention:
          latestAssessment.any_other_father_side_mention || "",
        any_other_mother_side_mention:
          latestAssessment.any_other_mother_side_mention || "",

        psych_problem_desc: latestAssessment.psych_problem_desc || "",
        current_status: latestAssessment.current_status || "",
        bonding_relation_with_user:
          latestAssessment.bonding_relation_with_user || "",
        family_behavior_with_patient:
          latestAssessment.family_behavior_with_patient || "",
        head_of_family: latestAssessment.head_of_family || "",
        family_relationships: latestAssessment.family_relationships || "",

        status: latestAssessment.status,
        isActive: latestAssessment.isActive,
        created_by: latestAssessment.created_by,
        updated_by: latestAssessment.updated_by,
        created_at: latestAssessment.created_at,
        updated_at: latestAssessment.updated_at,

        // User details from API
        name: latestAssessment.name,
        relative_name: latestAssessment.relative_name,
        gender: latestAssessment.gender,
        phone: latestAssessment.phone,
        email: latestAssessment.email,
        dob: latestAssessment.dob,
        custom_code: latestAssessment.custom_code,
        discharge_status: latestAssessment.discharge_status,
        ward_name: latestAssessment.ward_name,
      });

      console.log("Mapped IRF Edit Data:", latestAssessment);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };
  // IRF edit handler end



// ✅ Update IRF form Assessment Handler
const handleIRFUpdate = async () => {
  if (!IRFEditData?.irf_id) {
    console.error("IRF ID is not available yet.");
    return;
  }

  console.log("IRF ID for update:", IRFEditData.irf_id);
  setIsLoading(true);

  // ✅ Build payload from IRFEditData
  const payload = {
    user_id: IRFEditData?.user_id,
    date_of_assessment: IRFEditData?.date_of_assessment
      ? new Date(IRFEditData.date_of_assessment).toISOString().split("T")[0]
      : null,

    relationship_status: IRFEditData?.relationship_status || "",
    marriage_arrangement: IRFEditData?.marriage_arrangement || "",
    after_marriage_status: IRFEditData?.after_marriage_status || "",

    // ✅ Family Members Array
    family_members:
      IRFEditData?.family_members?.map((m) => ({
        name: m.name || "",
        relation: m.relation || "",
        age: m.age || "",
        living_status: m.living_status || "",
        physical_disorder: m.physical_disorder || "",
      })) || [],

    disorder_desc: IRFEditData?.disorder_desc || "",

    // ✅ Family History Details (father_side + mother_side)
    family_history_details: {
      father_side: IRFEditData?.family_history_details?.father_side || {},
      mother_side: IRFEditData?.family_history_details?.mother_side || {},
    },

    any_other_father_side_mention:
      IRFEditData?.any_other_father_side_mention || "",
    any_other_mother_side_mention:
      IRFEditData?.any_other_mother_side_mention || "",

    psych_problem_desc: IRFEditData?.psych_problem_desc || "",
    current_status: IRFEditData?.current_status || "",
    bonding_relation_with_user:
      IRFEditData?.bonding_relation_with_user || "",
    family_behavior_with_patient:
      IRFEditData?.family_behavior_with_patient || "",
    head_of_family: IRFEditData?.head_of_family || "",
    family_relationships: IRFEditData?.family_relationships || "",
  };

  try {
    const branch_id = selectedBranch; // from BranchContext
    const token = localStorage.getItem("Authorization");

    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/irf/update-assessment/${IRFEditData.irf_id}?branch_id=${branch_id}`,
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
    console.log("✅ IRF Update Response:", data);
    console.log("📦 IRF Update Payload Sent:", payload);

    setIsLoading(false);

    Swal.fire({
      icon: "success",
      title: "IRF Update Successful!",
      text: "IRF assessment has been updated successfully!",
    }).then(() => {
      setIRFEditModal(false); // ✅ Close modal after success
    });
  } catch (err) {
    console.error("❌ IRF Update Error:", err);
    setIsLoading(false);

    Swal.fire({
      icon: "error",
      title: "Unexpected Error",
      text: "Failed to update IRF assessment. Check console for details.",
    });
  }
};



// ✅ Prefill IRF form handler start
const [IRFPrefillData, setIRFPrefillData] = useState({});
const [IRFPrefillModal, setIRFPrefillModal] = useState(false);

const handleIRFprefill = async (prefillIRFID = null) => {
  // Normalize ID if object
  if (typeof prefillIRFID === "object" && prefillIRFID !== null) {
    prefillIRFID = prefillIRFID.irf_id || prefillIRFID.entry_id;
  }

  if (!prefillIRFID) {
    Swal.fire({
      icon: "warning",
      title: "Missing IRF ID",
      text: "No valid IRF ID was provided for prefill.",
    });
    return;
  }

  console.log("IRF ID For Prefill:", prefillIRFID);
  const token = localStorage.getItem("Authorization");

  try {
    const branch_id = selectedBranch;
    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/irf/assessment/${prefillIRFID}?branch_id=${branch_id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      }
    );

    const data = await response.json();
    console.log("Raw IRF API Response:", data);

    if (!response.ok) {
      Swal.fire({
        icon: "error",
        title: "Fetch Failed",
        text: data.message || "Unable to fetch IRF data for prefill.",
      });
      return;
    }

    const latestAssessment = data.data || null;
    if (!latestAssessment) {
      Swal.fire({
        icon: "info",
        title: "No Data Found",
        text: "No IRF data available for this ID.",
      });
      return;
    }

    // ✅ Open modal only when we have valid data
    setIRFPrefillModal(true);

    // ✅ Wrap in array so PatientCommonInfo works
    setSelectedUser([latestAssessment]);

    // ✅ Build mapped data for IRF
    const mappedData = {
      irf_id: latestAssessment.irf_id,
      user_id: latestAssessment.user_id,
      entry_id: latestAssessment.entry_id,
      branch_id: latestAssessment.branch_id,
      visit_no: latestAssessment.visit_no,

      date_of_assessment: latestAssessment.date_of_assessment
        ? new Date(latestAssessment.date_of_assessment)
        : null,

      relationship_status: latestAssessment.relationship_status || "",
      marriage_arrangement: latestAssessment.marriage_arrangement || "",
      after_marriage_status: latestAssessment.after_marriage_status || "",
      family_members: latestAssessment.family_members || [],

      disorder_desc: latestAssessment.disorder_desc || "",
      family_history_details: latestAssessment.family_history_details || {},
      any_other_father_side_mention:
        latestAssessment.any_other_father_side_mention || "",
      any_other_mother_side_mention:
        latestAssessment.any_other_mother_side_mention || "",
      psych_problem_desc: latestAssessment.psych_problem_desc || "",
      current_status: latestAssessment.current_status || "",
      bonding_relation_with_user:
        latestAssessment.bonding_relation_with_user || "",
      family_behavior_with_patient:
        latestAssessment.family_behavior_with_patient || "",
      head_of_family: latestAssessment.head_of_family || "",
      family_relationships: latestAssessment.family_relationships || "",

      status: latestAssessment.status || "Pending",

      // ✅ Patient details
      patient_name: latestAssessment.name || "",
      dob: latestAssessment.dob || "",
      gender: latestAssessment.gender || "",
      phone: latestAssessment.phone || "",
      email: latestAssessment.email || "",
      admit_date: latestAssessment.admit_date || "",
      ward_name: latestAssessment.ward_name || "",
    };

    setIRFPrefillData(mappedData);

    console.log("Mapped IRF Prefill Data:", mappedData);
  } catch (error) {
    console.error("Prefill fetch error:", error);
    Swal.fire({
      icon: "error",
      title: "Network Error",
      text: "Unable to fetch IRF data due to a network issue.",
    });
  }
};
// ✅ Prefill IRF form handler end



// IRF readmission submit start
const SubmitIRFReadmissionFormHandler = async (e) => {
  e.preventDefault();
  setIsLoading(true); // Start loader

  // 🛠️ Construct payload in correct format
  const payload = {
    user_id: IRFPrefillData?.user_id,
    date_of_assessment: IRFPrefillData?.date_of_assessment
      ? new Date(IRFPrefillData.date_of_assessment).toISOString().split("T")[0] // "YYYY-MM-DD"
      : null,

    relationship_status: IRFPrefillData.relationship_status || "",
    marriage_arrangement: IRFPrefillData.marriage_arrangement || "",
    after_marriage_status: IRFPrefillData.after_marriage_status || "",

    // ✅ Array of family members
    family_members:
      IRFPrefillData.family_members?.map((member) => ({
        name: member.name || "",
        relation: member.relation || "",
        age: member.age || "",
        living_status: member.living_status || "",
        physical_disorder: member.physical_disorder || "",
      })) || [],

    disorder_desc: IRFPrefillData.disorder_desc || "",

    // ✅ Family History Details (structured)
    family_history_details: IRFPrefillData.family_history_details || {
      father_side: {},
      mother_side: {},
    },

    any_other_father_side_mention:
      IRFPrefillData.any_other_father_side_mention || "",
    any_other_mother_side_mention:
      IRFPrefillData.any_other_mother_side_mention || "",
    psych_problem_desc: IRFPrefillData.psych_problem_desc || "",
    current_status: IRFPrefillData.current_status || "",
    bonding_relation_with_user:
      IRFPrefillData.bonding_relation_with_user || "",
    family_behavior_with_patient:
      IRFPrefillData.family_behavior_with_patient || "",
    head_of_family: IRFPrefillData.head_of_family || "",
    family_relationships: IRFPrefillData.family_relationships || "",
  };

  console.log("📦 IRF Payload:", payload);

  try {
    const token = localStorage.getItem("Authorization");
    const branch_id = selectedBranch;

    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/irf/create-assessment?branch_id=${branch_id}`,
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
      title: "IRF Created Successfully",
      text: "The IRF assessment was submitted successfully.",
    }).then(() => setIsIRFModalOpen(false));

    console.log("✅ IRF Data:", data);
  } catch (err) {
    console.error("❌ IRF Submit Error:", err);
    setIsLoading(false);

    Swal.fire({
      icon: "error",
      title: "Unexpected Error",
      text: "Failed to submit IRF. Check console for error.",
    });
  }
};
// IRF readmission submit handler end




  //Close all modal handler
  const closeAllmodal = () => {
    setIsIRFModalOpen(false);
    setviewIRFModal(false);
    setIRFEditModal(false);
    setIRFPrefillModal(false);
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
      filename: `user_data_${viewIRFFormData?.name}_${viewIRFFormData?.user_id}.pdf`,
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

  //Submit IRF from handler end
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
                    <HeaderCard title="All Relationship & Family Status Patient Data List" className="p-0" />
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

      {/* IRF create form start */}
      <CommonModal
        isOpen={isIRFModalOpen}
        title={`Create ${relationshipFamilyStatus}`}
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
          <form onSubmit={SubmitIRFFormHandler}>
            <div className="row">
              <div class="col-md-12 mb-3">
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

              {/* Relationship Status */}
              <div className="col-md-6">
                <Label htmlFor="marital_status">{relationshipStatus}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="relationship_status"
                  value={formData.relationship_status}
                  onChange={handleChange}
                />
              </div>

              {/* Marriage Arrangement */}
              <div className="col-md-6">
                <FormGroup className="mb-0">
                  <Label>{MarriageArrangement}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="marriage_arrangement"
                    value={formData.marriage_arrangement}
                    onChange={handleChange}
                  />
                </FormGroup>
              </div>

              {/* After Marriage Life */}
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{afterMerriageLife}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="after_marriage_status"
                    value={formData.after_marriage_status}
                    onChange={handleChange}
                  />
                </FormGroup>
              </div>

              {/* Members Table */}
              <div className="col-md-12">
                <div className="table-responsive">
                  <Table bordered>
                    <thead>
                      <tr>
                        <th scope="col">{nameisThere}</th>
                        <th scope="col">{relationisThere}</th>
                        <th scope="col">{relationisAge}</th>
                        <th scope="col">{livingStatus}</th>
                        <th scope="col">{AnyPhysicalDisorder}</th>
                        <th scope="col">{cheifAction}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.family_members.map((inter, index) => (
                        <tr key={index}>
                          <td>
                            <Input
                              type="text"
                              name="name"
                              value={inter.name}
                              onChange={(e) =>
                                handleMemberInputChange(index, e)
                              }
                              placeholder="Name / नाम "
                            />
                          </td>
                          <td>
                            <Input
                              type="text"
                              name="relation"
                              value={inter.relation}
                              onChange={(e) =>
                                handleMemberInputChange(index, e)
                              }
                              placeholder="Relation / संबंध "
                            />
                          </td>
                          <td>
                            <Input
                              type="text"
                              name="age"
                              value={inter.age}
                              onChange={(e) =>
                                handleMemberInputChange(index, e)
                              }
                              placeholder="age / आयु "
                            />
                          </td>
                          <td>
                            <Input
                              type="text"
                              name="living_status"
                              value={inter.living_status}
                              onChange={(e) =>
                                handleMemberInputChange(index, e)
                              }
                              placeholder="Living Status / रहने की स्तिथि"
                            />
                          </td>
                          <td>
                            <Input
                              type="text"
                              name="physical_disorder"
                              value={inter.physical_disorder}
                              onChange={(e) =>
                                handleMemberInputChange(index, e)
                              }
                              placeholder="Any physical Disorder & disease कोई भी शारीरिक विकार एवं रोग"
                            />
                          </td>
                          <td>
                            {index > 0 && (
                              <Button
                                type="button"
                                className="btn btn-danger"
                                onClick={() => removeInterferenceRow(index)}
                              >
                                Remove
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  <Button
                    type="button"
                    className="btn btn-secondary mt-4 mb-3"
                    onClick={addInterferenceRow}
                  >
                    + Add More
                  </Button>
                </div>

                <FormGroup className="mb-0">
                  <Label>{ifAnyDisorder}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="disorder_desc"
                    value={formData.disorder_desc}
                    onChange={handleChange}
                  />
                </FormGroup>
              </div>

               
              <div className="col-md-12 mb-4">
                <div className="table-responsive">
                  <p className="mt-3 mb-3">{familyHistorySubstanceAbuse}</p>

                  <Table bordered>
                    <thead>
                      <tr>
                        <th>Mother Side</th>
                        <th>Alcohol</th>
                        <th>substance</th>
                        <th>Psych</th>
                        <th>Father Side</th>
                        <th>Alcohol</th>
                        <th>substance</th>
                        <th>Psych</th>
                      </tr>
                    </thead>

                    <tbody>
                      {/* Grandmother */}
                      <tr>
                        <td>Grandmother</td>
                        <td>
                          <Input
                            type="checkbox"
                            className="checkbox_animated"
                            checked={
                              formData.family_history_data.mother_side
                                .grandmother.alcohol === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "mother_side",
                                "grandmother",
                                "alcohol",
                                e.target.checked ? "Yes" : "No"
                              )
                            }
                          />
                        </td>
                        <td>
                          <Input
                            type="checkbox"
                            className="checkbox_animated"
                            checked={
                              formData.family_history_data.mother_side
                                .grandmother.substance === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "mother_side",
                                "grandmother",
                                "substance",
                                e.target.checked ? "Yes" : "No"
                              )
                            }
                          />
                        </td>
                        <td>
                          <Input
                            type="checkbox"
                            className="checkbox_animated"
                            checked={
                              formData.family_history_data.mother_side
                                .grandmother.psych === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "mother_side",
                                "grandmother",
                                "psych",
                                e.target.checked ? "Yes" : "No"
                              )
                            }
                          />
                        </td>

                        <td>Grandmother</td>
                        <td>
                          <Input
                            type="checkbox"
                            className="checkbox_animated"
                            checked={
                              formData.family_history_data.father_side
                                .grandmother.alcohol === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "father_side",
                                "grandmother",
                                "alcohol",
                                e.target.checked ? "Yes" : "No"
                              )
                            }
                          />
                        </td>
                        <td>
                          <Input
                            type="checkbox"
                            className="checkbox_animated"
                            checked={
                              formData.family_history_data.father_side
                                .grandmother.substance === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "father_side",
                                "grandmother",
                                "substance",
                                e.target.checked ? "Yes" : "No"
                              )
                            }
                          />
                        </td>
                        <td>
                          <Input
                            type="checkbox"
                            className="checkbox_animated"
                            checked={
                              formData.family_history_data.father_side
                                .grandmother.psych === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "father_side",
                                "grandmother",
                                "psych",
                                e.target.checked ? "Yes" : "No"
                              )
                            }
                          />
                        </td>
                      </tr>

                      {/* Grandfather */}
                      <tr>
                        <td>Grandfather</td>
                        <td>
                          <Input
                            type="checkbox"
                            className="checkbox_animated"
                            checked={
                              formData.family_history_data.mother_side
                                .grandfather.alcohol === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "mother_side",
                                "grandfather",
                                "alcohol",
                                e.target.checked ? "Yes" : "No"
                              )
                            }
                          />
                        </td>
                        <td>
                          <Input
                            type="checkbox"
                            className="checkbox_animated"
                            checked={
                              formData.family_history_data.mother_side
                                .grandfather.substance === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "mother_side",
                                "grandfather",
                                "substance",
                                e.target.checked ? "Yes" : "No"
                              )
                            }
                          />
                        </td>
                        <td>
                          <Input
                            type="checkbox"
                            className="checkbox_animated"
                            checked={
                              formData.family_history_data.mother_side
                                .grandfather.psych === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "mother_side",
                                "grandfather",
                                "psych",
                                e.target.checked ? "Yes" : "No"
                              )
                            }
                          />
                        </td>

                        <td>Grandfather</td>
                        <td>
                          <Input
                            type="checkbox"
                            className="checkbox_animated"
                            checked={
                              formData.family_history_data.father_side
                                .grandfather.alcohol === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "father_side",
                                "grandfather",
                                "alcohol",
                                e.target.checked ? "Yes" : "No"
                              )
                            }
                          />
                        </td>
                        <td>
                          <Input
                            type="checkbox"
                            className="checkbox_animated"
                            checked={
                              formData.family_history_data.father_side
                                .grandfather.substance === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "father_side",
                                "grandfather",
                                "substance",
                                e.target.checked ? "Yes" : "No"
                              )
                            }
                          />
                        </td>
                        <td>
                          <Input
                            type="checkbox"
                            className="checkbox_animated"
                            checked={
                              formData.family_history_data.father_side
                                .grandfather.psych === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "father_side",
                                "grandfather",
                                "psych",
                                e.target.checked ? "Yes" : "No"
                              )
                            }
                          />
                        </td>
                      </tr>

                      {/* Mother / Father */}
                      <tr>
                        <td>Mother</td>
                        <td>
                          <Input
                            type="checkbox"
                            className="checkbox_animated"
                            checked={
                              formData.family_history_data.mother_side.mother
                                .alcohol === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "mother_side",
                                "mother",
                                "alcohol",
                                e.target.checked ? "Yes" : "No"
                              )
                            }
                          />
                        </td>
                        <td>
                          <Input
                            type="checkbox"
                            className="checkbox_animated"
                            checked={
                              formData.family_history_data.mother_side.mother
                                .substance === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "mother_side",
                                "mother",
                                "substance",
                                e.target.checked ? "Yes" : "No"
                              )
                            }
                          />
                        </td>
                        <td>
                          <Input
                            type="checkbox"
                            className="checkbox_animated"
                            checked={
                              formData.family_history_data.mother_side.mother
                                .psych === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "mother_side",
                                "mother",
                                "psych",
                                e.target.checked ? "Yes" : "No"
                              )
                            }
                          />
                        </td>

                        <td>Father</td>
                        <td>
                          <Input
                            type="checkbox"
                            className="checkbox_animated"
                            checked={
                              formData.family_history_data.father_side.father
                                .alcohol === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "father_side",
                                "father",
                                "alcohol",
                                e.target.checked ? "Yes" : "No"
                              )
                            }
                          />
                        </td>
                        <td>
                          <Input
                            type="checkbox"
                            className="checkbox_animated"
                            checked={
                              formData.family_history_data.father_side.father
                                .substance === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "father_side",
                                "father",
                                "substance",
                                e.target.checked ? "Yes" : "No"
                              )
                            }
                          />
                        </td>
                        <td>
                          <Input
                            type="checkbox"
                            className="checkbox_animated"
                            checked={
                              formData.family_history_data.father_side.father
                                .psych === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "father_side",
                                "father",
                                "psych",
                                e.target.checked ? "Yes" : "No"
                              )
                            }
                          />
                        </td>
                      </tr>

                      {/* Aunt */}
                      <tr>
                        <td>Aunt / मामी</td>
                        <td>
                          <Input
                            type="checkbox"
                            className="checkbox_animated"
                            checked={
                              formData.family_history_data.mother_side.aunt
                                .alcohol === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "mother_side",
                                "aunt",
                                "alcohol",
                                e.target.checked ? "Yes" : "No"
                              )
                            }
                          />
                        </td>
                        <td>
                          <Input
                            type="checkbox"
                            className="checkbox_animated"
                            checked={
                              formData.family_history_data.mother_side.aunt
                                .substance === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "mother_side",
                                "aunt",
                                "substance",
                                e.target.checked ? "Yes" : "No"
                              )
                            }
                          />
                        </td>
                        <td>
                          <Input
                            type="checkbox"
                            className="checkbox_animated"
                            checked={
                              formData.family_history_data.mother_side.aunt
                                .psych === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "mother_side",
                                "aunt",
                                "psych",
                                e.target.checked ? "Yes" : "No"
                              )
                            }
                          />
                        </td>

                        <td>Aunt / चाची</td>
                        <td>
                          <Input
                            type="checkbox"
                            className="checkbox_animated"
                            checked={
                              formData.family_history_data.father_side.aunt
                                .alcohol === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "father_side",
                                "aunt",
                                "alcohol",
                                e.target.checked ? "Yes" : "No"
                              )
                            }
                          />
                        </td>
                        <td>
                          <Input
                            type="checkbox"
                            className="checkbox_animated"
                            checked={
                              formData.family_history_data.father_side.aunt
                                .substance === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "father_side",
                                "aunt",
                                "substance",
                                e.target.checked ? "Yes" : "No"
                              )
                            }
                          />
                        </td>
                        <td>
                          <Input
                            type="checkbox"
                            className="checkbox_animated"
                            checked={
                              formData.family_history_data.father_side.aunt
                                .psych === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "father_side",
                                "aunt",
                                "psych",
                                e.target.checked ? "Yes" : "No"
                              )
                            }
                          />
                        </td>
                      </tr>

                      {/* Uncle */}
                      <tr>
                        <td>Uncle / मामा</td>
                        <td>
                          <Input
                            type="checkbox"
                            className="checkbox_animated"
                            checked={
                              formData.family_history_data.mother_side.uncle
                                .alcohol === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "mother_side",
                                "uncle",
                                "alcohol",
                                e.target.checked ? "Yes" : "No"
                              )
                            }
                          />
                        </td>
                        <td>
                          <Input
                            type="checkbox"
                            className="checkbox_animated"
                            checked={
                              formData.family_history_data.mother_side.uncle
                                .substance === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "mother_side",
                                "uncle",
                                "substance",
                                e.target.checked ? "Yes" : "No"
                              )
                            }
                          />
                        </td>
                        <td>
                          <Input
                            type="checkbox"
                            className="checkbox_animated"
                            checked={
                              formData.family_history_data.mother_side.uncle
                                .psych === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "mother_side",
                                "uncle",
                                "psych",
                                e.target.checked ? "Yes" : "No"
                              )
                            }
                          />
                        </td>

                        <td>Uncle / चाचा</td>
                        <td>
                          <Input
                            type="checkbox"
                            className="checkbox_animated"
                            checked={
                              formData.family_history_data.father_side.uncle
                                .alcohol === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "father_side",
                                "uncle",
                                "alcohol",
                                e.target.checked ? "Yes" : "No"
                              )
                            }
                          />
                        </td>
                        <td>
                          <Input
                            type="checkbox"
                            className="checkbox_animated"
                            checked={
                              formData.family_history_data.father_side.uncle
                                .substance === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "father_side",
                                "uncle",
                                "substance",
                                e.target.checked ? "Yes" : "No"
                              )
                            }
                          />
                        </td>
                        <td>
                          <Input
                            type="checkbox"
                            className="checkbox_animated"
                            checked={
                              formData.family_history_data.father_side.uncle
                                .psych === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "father_side",
                                "uncle",
                                "psych",
                                e.target.checked ? "Yes" : "No"
                              )
                            }
                          />
                        </td>
                      </tr>

                      {/* Any Other */}
                      <tr>
                        {/* Mother side */}
                        <td>{anyOtherPlsMention}</td>
                        <td colSpan={3}>
                          <Input
                            type="text"
                            placeholder="If any from mother side"
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                any_other_mother_side_mention: e.target.value,
                              })
                            }
                          />
                        </td>

                        {/* Father side */}
                        <td>{anyOtherPlsMention}</td>
                        <td colSpan={3}>
                          <Input
                            type="text"
                            placeholder="If any from father side"
                            value={formData.any_other_father_side_mention}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                any_other_father_side_mention: e.target.value,
                              })
                            }
                          />
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              </div>

              {/* Psychological Problem */}
              <div className="col-md-12 mt-3">
                <Label>{anyOtherPlsMention1}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="psych_problem_desc"
                  value={formData.psych_problem_desc}
                  onChange={handleChange}
                />
              </div>

              {/* Current Status */}
              <div className="col-md-12 mt-3 mb-3">
                <Label>{currentStatus}</Label>
                <Input
                  type="text"
                  name="current_status"
                  className="form-control"
                  value={formData.current_status}
                  onChange={handleChange}
                />
              </div>

              {/* Relationship with User */}
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{howWasBonding}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="bonding_relation_with_user"
                    value={formData.bonding_relation_with_user}
                    onChange={handleChange}
                  />
                </FormGroup>
              </div>

              {/* Family Behavior */}
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{familyBehaviorPatient}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="family_behavior_with_patient"
                    value={formData.family_behavior_with_patient}
                    onChange={handleChange}
                  />
                </FormGroup>
              </div>

              {/* Head of Family */}
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{monitoringFamily}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="head_of_family"
                    value={formData.head_of_family}
                    onChange={handleChange}
                  />
                </FormGroup>
              </div>

              {/* Relationships with Family */}
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{ralationshipFamilyMember}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="family_relationships"
                    value={formData.family_relationships}
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
                    "Submit Relationship & Family Status / रिश्ते और पारिवारिक स्थिति"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </CommonModal>
      {/* IRF create form end */}

      {/* View IRF form data start */}
      <CommonModal
        isOpen={viewIRFModal}
        title={`View ${relationshipFamilyStatus}`}
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
            {relationshipFamilyStatus}
          </h4>

          <Table size="sm" className="table-auto table-bordered">
            <tbody style={{ fontSize: "14px" }}>
              {isLoading ? (
                <tr>
                  <td colSpan="2" className="text-center">
                    <Spinner
                      className={
                        selectedSpinner?.spinnerClass || "spinner-border"
                      }
                    />
                  </td>
                </tr>
              ) : viewIRFData ? (
                <>
                  {/* User Info */}
                  <tr>
                    <th className="text-start p-3">Name</th>
                    <td className="border p-3">{viewIRFData.name}</td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">Relative Name</th>
                    <td className="border p-3">{viewIRFData.relative_name}</td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">Gender</th>
                    <td className="border p-3">{viewIRFData.gender}</td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">Phone</th>
                    <td className="border p-3">{viewIRFData.phone}</td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">Email</th>
                    <td className="border p-3">{viewIRFData.email}</td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">Date of Birth</th>
                    <td className="border p-3">
                      {viewIRFData.dob
                        ? new Date(viewIRFData.dob).toLocaleDateString()
                        : ""}
                    </td>
                  </tr>

                  {/* Admission Details */}
                  <tr>
                    <th className="text-start p-3">Admit Date</th>
                    <td className="border p-3">
                      {viewIRFData.admit_date
                        ? new Date(viewIRFData.admit_date).toLocaleDateString()
                        : ""}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">Ward Name</th>
                    <td className="border p-3">{viewIRFData.ward_name}</td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">Visit No</th>
                    <td className="border p-3">{viewIRFData.visit_no}</td>
                  </tr>

                  {/* Assessment */}
                  <tr>
                    <th className="text-start p-3">Assessment Date</th>
                    <td className="border p-3">
                      {viewIRFData.date_of_assessment
                        ? new Date(
                            viewIRFData.date_of_assessment
                          ).toLocaleDateString()
                        : ""}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">Relationship Status</th>
                    <td className="border p-3">
                      {viewIRFData.relationship_status}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">Marriage Arrangement</th>
                    <td className="border p-3">
                      {viewIRFData.marriage_arrangement}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">After Marriage Status</th>
                    <td className="border p-3">
                      {viewIRFData.after_marriage_status}
                    </td>
                  </tr>

                  {/* Family Members */}
                  <tr>
                    <th className="text-start p-3">Family Members</th>
                    <td className="border p-3">
                      {viewIRFData.family_members?.length > 0 ? (
                        <Table size="sm" bordered>
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Relation</th>
                              <th>Age</th>
                              <th>Living Status</th>
                              <th>Physical Disorder</th>
                            </tr>
                          </thead>
                          <tbody>
                            {viewIRFData.family_members.map((member, i) => (
                              <tr key={i}>
                                <td>{member.name}</td>
                                <td>{member.relation}</td>
                                <td>{member.age}</td>
                                <td>{member.living_status}</td>
                                <td>{member.physical_disorder}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      ) : (
                        "No Family Members"
                      )}
                    </td>
                  </tr>

                  {/* Family History */}
                  <tr>
                    <th className="text-start p-3">
                      Family History (Father Side)
                    </th>
                    <td className="border p-3">
                      <Table size="sm" bordered>
                        <thead>
                          <tr>
                            <th>Member</th>
                            <th>Alcohol</th>
                            <th>Substance</th>
                            <th>Psych</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(
                            viewIRFData.family_history_details?.father_side ||
                              {}
                          ).map(([key, val]) => (
                            <tr key={key}>
                              <td>{key}</td>
                              <td>{val.alcohol}</td>
                              <td>{val.substance}</td>
                              <td>{val.psych}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">
                      Family History (Mother Side)
                    </th>
                    <td className="border p-3">
                      <Table size="sm" bordered>
                        <thead>
                          <tr>
                            <th>Member</th>
                            <th>Alcohol</th>
                            <th>Substance</th>
                            <th>Psych</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(
                            viewIRFData.family_history_details?.mother_side ||
                              {}
                          ).map(([key, val]) => (
                            <tr key={key}>
                              <td>{key}</td>
                              <td>{val.alcohol}</td>
                              <td>{val.substance}</td>
                              <td>{val.psych}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </td>
                  </tr>

                  {/* Other Info */}
                  <tr>
                    <th className="text-start p-3">Disorder Description</th>
                    <td className="border p-3">{viewIRFData.disorder_desc}</td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">
                      Psych Problem Description
                    </th>
                    <td className="border p-3">
                      {viewIRFData.psych_problem_desc}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">
                      Any Other Father Side Mention
                    </th>
                    <td className="border p-3">
                      {viewIRFData.any_other_father_side_mention}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">
                      Any Other Mother Side Mention
                    </th>
                    <td className="border p-3">
                      {viewIRFData.any_other_mother_side_mention}
                    </td>
                  </tr>

                  {/* Current Status */}
                  <tr>
                    <th className="text-start p-3">Current Status</th>
                    <td className="border p-3">{viewIRFData.current_status}</td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">
                      Bonding Relation with User
                    </th>
                    <td className="border p-3">
                      {viewIRFData.bonding_relation_with_user}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">
                      Family Behavior with Patient
                    </th>
                    <td className="border p-3">
                      {viewIRFData.family_behavior_with_patient}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">Head of Family</th>
                    <td className="border p-3">{viewIRFData.head_of_family}</td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">Family Relationships</th>
                    <td className="border p-3">
                      {viewIRFData.family_relationships}
                    </td>
                  </tr>

                  {/* Meta */}
                  <tr>
                    <th className="text-start p-3">Status</th>
                    <td className="border p-3">{viewIRFData.status}</td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">Created At</th>
                    <td className="border p-3">
                      {viewIRFData.created_at
                        ? new Date(viewIRFData.created_at).toLocaleString()
                        : ""}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">Updated At</th>
                    <td className="border p-3">
                      {viewIRFData.updated_at
                        ? new Date(viewIRFData.updated_at).toLocaleString()
                        : ""}
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
              ? "Your IRF Report is being downloaded.../ आपका IRF डाउनलोड हो रहा है..."
              : "Download IRF Report"}
          </button>
        </div>
      </CommonModal>
      {/* View IRF form data end */}

      {/* IRF edit form start */}
      <CommonModal
        isOpen={IRFEditModal}
        title={`Edit ${relationshipFamilyStatus}`}
        toggler={closeAllmodal}
        maxWidth="1200px"
      >

<div className="row px-3 pt-4 pb-3">
        <form onSubmit={(e)=>{
          e.preventDefault();
          handleIRFUpdate();
        }}>
  <div className="row">
    {/* Date of Assessment */}
    <div className="col-md-12 mb-3">
      <Label className="col-sm-12 col-form-label col-xl-6">
        {dateOfAssessment}
      </Label>
      <Col xl="5" sm="12">
        <div className="input-group">
          <DatePicker
            className="form-control digits"
            selected={IRFEditData?.date_of_assessment || null}
            onChange={(date) =>
              setIRFEditData((prev) => ({ ...prev, date_of_assessment: date }))
            }
          />
        </div>
      </Col>
    </div>

    {/* Relationship Status */}
    <div className="col-md-6">
      <Label>{relationshipStatus}</Label>
      <Input
        type="textarea"
        rows="3"
        value={IRFEditData?.relationship_status || ""}
        onChange={(e) =>
          setIRFEditData((prev) => ({
            ...prev,
            relationship_status: e.target.value,
          }))
        }
      />
    </div>

    {/* Marriage Arrangement */}
    <div className="col-md-6">
      <FormGroup className="mb-0">
        <Label>{MarriageArrangement}</Label>
        <Input
          type="textarea"
          rows="3"
          value={IRFEditData?.marriage_arrangement || ""}
          onChange={(e) =>
            setIRFEditData((prev) => ({
              ...prev,
              marriage_arrangement: e.target.value,
            }))
          }
        />
      </FormGroup>
    </div>

    {/* After Marriage Life */}
    <div className="col-md-12">
      <FormGroup className="mb-0">
        <Label>{afterMerriageLife}</Label>
        <Input
          type="textarea"
          rows="3"
          value={IRFEditData?.after_marriage_status || ""}
          onChange={(e) =>
            setIRFEditData((prev) => ({
              ...prev,
              after_marriage_status: e.target.value,
            }))
          }
        />
      </FormGroup>
    </div>

    {/* Members Table */}
    <div className="col-md-12">
      <div className="table-responsive">
        <Table bordered>
          <thead>
            <tr>
              <th>{nameisThere}</th>
              <th>{relationisThere}</th>
              <th>{relationisAge}</th>
              <th>{livingStatus}</th>
              <th>{AnyPhysicalDisorder}</th>
              <th>{cheifAction}</th>
            </tr>
          </thead>
          <tbody>
            {IRFEditData?.family_members?.map((inter, index) => (
              <tr key={index}>
                {["name", "relation", "age", "living_status", "physical_disorder"].map((field) => (
                  <td key={field}>
                    <Input
                      type="text"
                      value={inter[field] || ""}
                      onChange={(e) => {
                        const updated = [...IRFEditData.family_members];
                        updated[index][field] = e.target.value;
                        setIRFEditData((prev) => ({
                          ...prev,
                          family_members: updated,
                        }));
                      }}
                    />
                  </td>
                ))}
                <td>
                  {index > 0 && (
                    <Button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => {
                        const updated = IRFEditData.family_members.filter((_, i) => i !== index);
                        setIRFEditData((prev) => ({
                          ...prev,
                          family_members: updated,
                        }));
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Button
          type="button"
          className="btn btn-secondary mt-4 mb-3"
          onClick={() =>
            setIRFEditData((prev) => ({
              ...prev,
              family_members: [
                ...prev.family_members,
                { name: "", relation: "", age: "", living_status: "", physical_disorder: "" },
              ],
            }))
          }
        >
          + Add More
        </Button>
      </div>

      <FormGroup className="mb-0">
        <Label>{ifAnyDisorder}</Label>
        <Input
          type="textarea"
          rows="3"
          value={IRFEditData?.disorder_desc || ""}
          onChange={(e) =>
            setIRFEditData((prev) => ({ ...prev, disorder_desc: e.target.value }))
          }
        />
      </FormGroup>
    </div>

    {/* Family History Substance Abuse */}
    <div className="col-md-12 mb-4">
      <div className="table-responsive">
        <p className="mt-3 mb-3">{familyHistorySubstanceAbuse}</p>
        <Table bordered>
          <thead>
            <tr>
              <th>Mother Side</th>
              <th>Alcohol</th>
              <th>substance</th>
              <th>Psych</th>
              <th>Father Side</th>
              <th>Alcohol</th>
              <th>substance</th>
              <th>Psych</th>
            </tr>
          </thead>
          <tbody>
  {["grandmother", "grandfather", "mother", "aunt", "uncle"].map((relative) => (
    <tr key={`mother-${relative}`}>
      {/* Mother side */}
      <td>{relative}</td>
      {["alcohol", "substance", "psych"].map((field) => (
        <td key={`mother-${relative}-${field}`}>
          <Input
            type="checkbox"
              className="checkbox_animated"
            checked={IRFEditData?.family_history_details?.mother_side?.[relative]?.[field] === "Yes"}
            onChange={(e) =>
              setIRFEditData((prev) => ({
                ...prev,
                family_history_details: {
                  ...prev.family_history_details,
                  mother_side: {
                    ...prev.family_history_details.mother_side,
                    [relative]: {
                      ...(prev.family_history_details?.mother_side?.[relative] || {}),
                      [field]: e.target.checked ? "Yes" : "No",
                    },
                  },
                },
              }))
            }
          />
        </td>
      ))}

      {/* Father side */}
      <td>{relative === "mother" ? "father" : relative}</td>
      {["alcohol", "substance", "psych"].map((field) => (
        <td key={`father-${relative}-${field}`}>
          <Input
            type="checkbox"
            className="checkbox_animated"
            checked={IRFEditData?.family_history_details?.father_side?.[relative === "mother" ? "father" : relative]?.[field] === "Yes"}
            onChange={(e) =>
              setIRFEditData((prev) => ({
                ...prev,
                family_history_details: {
                  ...prev.family_history_details,
                  father_side: {
                    ...prev.family_history_details.father_side,
                    [relative === "mother" ? "father" : relative]: {
                      ...(prev.family_history_details?.father_side?.[relative === "mother" ? "father" : relative] || {}),
                      [field]: e.target.checked ? "Yes" : "No",
                    },
                  },
                },
              }))
            }
          />
        </td>
      ))}
    </tr>
  ))}
  {/* Any Other */}
  <tr>
    {/* Mother side */}
    <td>{anyOtherPlsMention}</td>
    <td colSpan={3}>
      <Input
        type="text"
        value={IRFEditData?.any_other_mother_side_mention || ""}
        onChange={(e) =>
          setIRFEditData((prev) => ({
            ...prev,
            any_other_mother_side_mention: e.target.value, // ✅ keep at root
          }))
        }
      />
    </td>

    {/* Father side */}
    <td>{anyOtherPlsMention}</td>
    <td colSpan={3}>
      <Input
        type="text"
        value={IRFEditData?.any_other_father_side_mention || ""}
        onChange={(e) =>
          setIRFEditData((prev) => ({
            ...prev,
            any_other_father_side_mention: e.target.value, // ✅ keep at root
          }))
        }
      />
    </td>
  </tr>
</tbody>



        </Table>
      </div>
    </div>

    {/* Psychological Problem */}
    <div className="col-md-12 mt-3">
      <Label>{anyOtherPlsMention1}</Label>
      <Input
        type="textarea"
        rows="3"
        value={IRFEditData?.psych_problem_desc || ""}
        onChange={(e) =>
          setIRFEditData((prev) => ({ ...prev, psych_problem_desc: e.target.value }))
        }
      />
    </div>

    {/* Current Status */}
    <div className="col-md-12 mt-3 mb-3">
      <Label>{currentStatus}</Label>
      <Input
        type="text"
        value={IRFEditData?.current_status || ""}
        onChange={(e) =>
          setIRFEditData((prev) => ({ ...prev, current_status: e.target.value }))
        }
      />
    </div>

    {/* Relationship with User */}
    <div className="col-md-12">
      <FormGroup className="mb-0">
        <Label>{howWasBonding}</Label>
        <Input
          type="textarea"
          rows="3"
          value={IRFEditData?.bonding_relation_with_user || ""}
          onChange={(e) =>
            setIRFEditData((prev) => ({
              ...prev,
              bonding_relation_with_user: e.target.value,
            }))
          }
        />
      </FormGroup>
    </div>

    {/* Family Behavior */}
    <div className="col-md-12">
      <FormGroup className="mb-0">
        <Label>{familyBehaviorPatient}</Label>
        <Input
          type="textarea"
          rows="3"
          value={IRFEditData?.family_behavior_with_patient || ""}
          onChange={(e) =>
            setIRFEditData((prev) => ({
              ...prev,
              family_behavior_with_patient: e.target.value,
            }))
          }
        />
      </FormGroup>
    </div>

    {/* Head of Family */}
    <div className="col-md-12">
      <FormGroup className="mb-0">
        <Label>{monitoringFamily}</Label>
        <Input
          type="textarea"
          rows="3"
          value={IRFEditData?.head_of_family || ""}
          onChange={(e) =>
            setIRFEditData((prev) => ({ ...prev, head_of_family: e.target.value }))
          }
        />
      </FormGroup>
    </div>

    {/* Relationships with Family */}
    <div className="col-md-12">
      <FormGroup className="mb-0">
        <Label>{ralationshipFamilyMember}</Label>
        <Input
          type="textarea"
          rows="3"
          value={IRFEditData?.family_relationships || ""}
          onChange={(e) =>
            setIRFEditData((prev) => ({
              ...prev,
              family_relationships: e.target.value,
            }))
          }
        />
      </FormGroup>
    </div>

    {/* Submit */}
    <div className="d-flex gap-3">
      <Button color="primary" type="submit" disabled={isLoading}>
        {isLoading ? (
          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        ) : (
          "Submit Relationship & Family Status / रिश्ते और पारिवारिक स्थिति"
        )}
      </Button>
    </div>
  </div>
</form>

        </div>
        
      </CommonModal>

      {/* IRF edit form end */}



       {/* IRF Prefill form start */}
<CommonModal
  isOpen={IRFPrefillModal}
  title={`Readmission ${relationshipFamilyStatus}`}
  toggler={closeAllmodal}
  maxWidth="1200px"
>
  <div className="row px-3 pt-4 pb-3">
    <form
      onSubmit={SubmitIRFReadmissionFormHandler}
    >
      <div className="row">
        {/* Date of Assessment */}
        <div className="col-md-12 mb-3">
          <Label className="col-sm-12 col-form-label col-xl-6">
            {dateOfAssessment}
          </Label>
          <Col xl="5" sm="12">
            <div className="input-group">
              <DatePicker
                className="form-control digits"
                selected={IRFPrefillData?.date_of_assessment || null}
                onChange={(date) =>
                  setIRFPrefillData((prev) => ({
                    ...prev,
                    date_of_assessment: date,
                  }))
                }
              />
            </div>
          </Col>
        </div>

        {/* Relationship Status */}
        <div className="col-md-6">
          <Label>{relationshipStatus}</Label>
          <Input
            type="textarea"
            rows="3"
            value={IRFPrefillData?.relationship_status || ""}
            onChange={(e) =>
              setIRFPrefillData((prev) => ({
                ...prev,
                relationship_status: e.target.value,
              }))
            }
          />
        </div>

        {/* Marriage Arrangement */}
        <div className="col-md-6">
          <FormGroup className="mb-0">
            <Label>{MarriageArrangement}</Label>
            <Input
              type="textarea"
              rows="3"
              value={IRFPrefillData?.marriage_arrangement || ""}
              onChange={(e) =>
                setIRFPrefillData((prev) => ({
                  ...prev,
                  marriage_arrangement: e.target.value,
                }))
              }
            />
          </FormGroup>
        </div>

        {/* After Marriage Life */}
        <div className="col-md-12">
          <FormGroup className="mb-0">
            <Label>{afterMerriageLife}</Label>
            <Input
              type="textarea"
              rows="3"
              value={IRFPrefillData?.after_marriage_status || ""}
              onChange={(e) =>
                setIRFPrefillData((prev) => ({
                  ...prev,
                  after_marriage_status: e.target.value,
                }))
              }
            />
          </FormGroup>
        </div>

        {/* Members Table */}
        <div className="col-md-12">
          <div className="table-responsive">
            <Table bordered>
              <thead>
                <tr>
                  <th>{nameisThere}</th>
                  <th>{relationisThere}</th>
                  <th>{relationisAge}</th>
                  <th>{livingStatus}</th>
                  <th>{AnyPhysicalDisorder}</th>
                  <th>{cheifAction}</th>
                </tr>
              </thead>
              <tbody>
                {IRFPrefillData?.family_members?.map((inter, index) => (
                  <tr key={index}>
                    {[
                      "name",
                      "relation",
                      "age",
                      "living_status",
                      "physical_disorder",
                    ].map((field) => (
                      <td key={field}>
                        <Input
                          type="text"
                          value={inter[field] || ""}
                          onChange={(e) => {
                            const updated = [
                              ...IRFPrefillData.family_members,
                            ];
                            updated[index][field] = e.target.value;
                            setIRFPrefillData((prev) => ({
                              ...prev,
                              family_members: updated,
                            }));
                          }}
                        />
                      </td>
                    ))}
                    <td>
                      {index > 0 && (
                        <Button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => {
                            const updated =
                              IRFPrefillData.family_members.filter(
                                (_, i) => i !== index
                              );
                            setIRFPrefillData((prev) => ({
                              ...prev,
                              family_members: updated,
                            }));
                          }}
                        >
                          Remove
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Button
              type="button"
              className="btn btn-secondary mt-4 mb-3"
              onClick={() =>
                setIRFPrefillData((prev) => ({
                  ...prev,
                  family_members: [
                    ...(prev.family_members || []),
                    {
                      name: "",
                      relation: "",
                      age: "",
                      living_status: "",
                      physical_disorder: "",
                    },
                  ],
                }))
              }
            >
              + Add More
            </Button>
          </div>
        </div>

        {/* ...apply same pattern for rest of fields... */}
        <FormGroup className="mb-0">
        <Label>{ifAnyDisorder}</Label>
        <Input
          type="textarea"
          rows="3"
          value={IRFPrefillData?.disorder_desc || ""}
          onChange={(e) =>
            setIRFPrefillData((prev) => ({ ...prev, disorder_desc: e.target.value }))
          }
        />
      </FormGroup>


      {/* Family History Substance Abuse */}
    <div className="col-md-12 mb-4">
      <div className="table-responsive">
        <p className="mt-3 mb-3">{familyHistorySubstanceAbuse}</p>
        <Table bordered>
          <thead>
            <tr>
              <th>Mother Side</th>
              <th>Alcohol</th>
              <th>substance</th>
              <th>Psych</th>
              <th>Father Side</th>
              <th>Alcohol</th>
              <th>substance</th>
              <th>Psych</th>
            </tr>
          </thead>
          <tbody>
  {["grandmother", "grandfather", "mother", "aunt", "uncle"].map((relative) => (
    <tr key={`mother-${relative}`}>
      {/* Mother side */}
      <td>{relative}</td>
      {["alcohol", "substance", "psych"].map((field) => (
        <td key={`mother-${relative}-${field}`}>
          <Input
            type="checkbox"
              className="checkbox_animated"
            checked={IRFPrefillData?.family_history_details?.mother_side?.[relative]?.[field] === "Yes"}
            onChange={(e) =>
              setIRFPrefillData((prev) => ({
                ...prev,
                family_history_details: {
                  ...prev.family_history_details,
                  mother_side: {
                    ...prev.family_history_details.mother_side,
                    [relative]: {
                      ...(prev.family_history_details?.mother_side?.[relative] || {}),
                      [field]: e.target.checked ? "Yes" : "No",
                    },
                  },
                },
              }))
            }
          />
        </td>
      ))}

      {/* Father side */}
      <td>{relative === "mother" ? "father" : relative}</td>
      {["alcohol", "substance", "psych"].map((field) => (
        <td key={`father-${relative}-${field}`}>
          <Input
            type="checkbox"
            className="checkbox_animated"
            checked={IRFPrefillData?.family_history_details?.father_side?.[relative === "mother" ? "father" : relative]?.[field] === "Yes"}
            onChange={(e) =>
              setIRFPrefillData((prev) => ({
                ...prev,
                family_history_details: {
                  ...prev.family_history_details,
                  father_side: {
                    ...prev.family_history_details.father_side,
                    [relative === "mother" ? "father" : relative]: {
                      ...(prev.family_history_details?.father_side?.[relative === "mother" ? "father" : relative] || {}),
                      [field]: e.target.checked ? "Yes" : "No",
                    },
                  },
                },
              }))
            }
          />
        </td>
      ))}
    </tr>
  ))}
  {/* Any Other */}
  <tr>
    {/* Mother side */}
    <td>{anyOtherPlsMention}</td>
    <td colSpan={3}>
      <Input
        type="text"
        value={IRFPrefillData?.any_other_mother_side_mention || ""}
        onChange={(e) =>
          setIRFPrefillData((prev) => ({
            ...prev,
            any_other_mother_side_mention: e.target.value, // ✅ keep at root
          }))
        }
      />
    </td>

    {/* Father side */}
    <td>{anyOtherPlsMention}</td>
    <td colSpan={3}>
      <Input
        type="text"
        value={IRFEditData?.any_other_father_side_mention || ""}
        onChange={(e) =>
          setIRFEditData((prev) => ({
            ...prev,
            any_other_father_side_mention: e.target.value, // ✅ keep at root
          }))
        }
      />
    </td>
  </tr>
</tbody>



        </Table>
      </div>
    </div>



     {/* Psychological Problem */}
     <div className="col-md-12 mt-3">
      <Label>{anyOtherPlsMention1}</Label>
      <Input
        type="textarea"
        rows="3"
        value={IRFPrefillData?.psych_problem_desc || ""}
        onChange={(e) =>
          setIRFPrefillData((prev) => ({ ...prev, psych_problem_desc: e.target.value }))
        }
      />
    </div>

    {/* Current Status */}
    <div className="col-md-12 mt-3 mb-3">
      <Label>{currentStatus}</Label>
      <Input
        type="text"
        value={IRFPrefillData?.current_status || ""}
        onChange={(e) =>
          setIRFPrefillData((prev) => ({ ...prev, current_status: e.target.value }))
        }
      />
    </div>

    {/* Relationship with User */}
    <div className="col-md-12">
      <FormGroup className="mb-0">
        <Label>{howWasBonding}</Label>
        <Input
          type="textarea"
          rows="3"
          value={IRFPrefillData?.bonding_relation_with_user || ""}
          onChange={(e) =>
            setIRFPrefillData((prev) => ({
              ...prev,
              bonding_relation_with_user: e.target.value,
            }))
          }
        />
      </FormGroup>
    </div>

    {/* Family Behavior */}
    <div className="col-md-12">
      <FormGroup className="mb-0">
        <Label>{familyBehaviorPatient}</Label>
        <Input
          type="textarea"
          rows="3"
          value={IRFPrefillData?.family_behavior_with_patient || ""}
          onChange={(e) =>
            setIRFPrefillData((prev) => ({
              ...prev,
              family_behavior_with_patient: e.target.value,
            }))
          }
        />
      </FormGroup>
    </div>

    {/* Head of Family */}
    <div className="col-md-12">
      <FormGroup className="mb-0">
        <Label>{monitoringFamily}</Label>
        <Input
          type="textarea"
          rows="3"
          value={IRFPrefillData?.head_of_family || ""}
          onChange={(e) =>
            setIRFPrefillData((prev) => ({ ...prev, head_of_family: e.target.value }))
          }
        />
      </FormGroup>
    </div>

    {/* Relationships with Family */}
    <div className="col-md-12">
      <FormGroup className="mb-0">
        <Label>{ralationshipFamilyMember}</Label>
        <Input
          type="textarea"
          rows="3"
          value={IRFPrefillData?.family_relationships || ""}
          onChange={(e) =>
            setIRFPrefillData((prev) => ({
              ...prev,
              family_relationships: e.target.value,
            }))
          }
        />
      </FormGroup>
    </div>

        {/* Submit */}
        <div className="d-flex gap-3">
          <Button color="primary" type="submit" disabled={isLoading}>
            {isLoading ? (
              <span
                className="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              ></span>
            ) : (
              "Readmission Relationship & Family Status / रिश्ते और पारिवारिक स्थिति"
            )}
          </Button>
        </div>
      </div>
    </form>
  </div>
</CommonModal>
{/* IRF Prefill form end */}

    </Fragment>
  );
}

export default RelationshipFamily;
