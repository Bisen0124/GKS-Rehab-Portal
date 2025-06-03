import React, { Fragment, useState, useEffect } from "react";
import {
  dateOfAdmission,
  patientName,
  patientSex,
  patientAge,
  yes,
  no,
  male,
  female,
  other,
  consent,
  name,
  relationship,
  signature,
  prepared,
  patientPersonalInformation,
  UID,
  dateOfFormFilling,
  occupationStatus,
  maritalStatus,
  relation,
  occupation,
  livingSituation,
  living,
  religionOptions,
  religion,
  substanceDependency,
  durationOfRegularUse,
  dailySpentSubstance,
  patienMonthlyIncome,
  familyMonthlyIncome,
  sourceOfMoney,
  moneySources,
  Ifarrange,
  mentionYear,
  action,
  Residence,
  experiencedTrauma,
  occurredPatientBehavior,
  sociality,
  effectOfSubstance,
  ChiefComplaint,
  TreatmentOfSubstance,
  howManyTimes,
  year,
  placeOfTreatment,
  durationOfTime,
  daysOfSobriety,
  cheifAction,
  absuingSubstance,
  influenceStop,
  whenStopUsing,
  itReplaceWhenWhom,
  afterRelapse,
  haveDisorder,
  isProblmeOrInjury,
  DiagnosedOnTreatment,
  DoctorPlaceDuration,
  ifGone,
  YouFamiliar,
  relationshipFamilyStatus,
  relationshipOptions,
  relationshipStatus,
  MarriageArrangement,
  afterMerriageLife,
  isThereInterference,
  nameisThere,
  relationisThere,
  livingStatus,
  AnyPhysicalDisorder,
  familyHistorySubstanceAbuse,
  motherSide,
  Alc,
  Drug,
  Psych,
  fatherSide,
  grandMother,
  grandFather,
  mother,
  father,
  aunt,
  aunt1,
  uncle,
  uncle1,
  anyOtherPlsMention,
  ifAnyDisorder,
  anyOtherPlsMention1,
  currentStatus,
  currentstatusObject,
  howWasBonding,
  familyBehaviorPatient,
  monitoringFamily,
  ralationshipFamilyMember,
  childhood,
  birthConditions,
  parentingHistory,
  wasThereAnyConflict,
  socialityWhere,
  riskOptions,
  highRiskBehavior,
  whatWasImpect,
  hasAnyoneEverAbused,
  academicsOccupationalDetails,
  educationOptions,
  EducationStatus,
  occupationOptions,
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
  marital,
  relationisAge,
  friendSocialStatus,
  tableNumber,
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
  Button,
  InputGroup,
  Spinner,
} from "reactstrap";
import { H5, Btn } from "../../AbstractElements";
import DatePicker from "react-datepicker";
import CommonModal from "../UiKits/Modals/common/modal";
import { toast } from "react-toastify";
import HeaderCard from "../Common/Component/HeaderCard";
import DataTable from "react-data-table-component";
import { Data } from "../UiKits/Spinners/SpinnerData";
import Swal from "sweetalert2"; // ✅ Make sure this is imported at the top

//Calculate age by DOB custom hook
import useCalculateAge from "../../CustomHook/useCalculateAge";

//Show pateint/user common info like name, age and DOB by custom hook
import PatientCommonInfo from "../../CustomHook/PatientCommonInfo";

function GenFamily() {

  const selectedSpinner = Data.find(
    (item) => item.spinnerClass === "loader-37"
  );


  //Loading state on buttons
  const [isLoading, setIsLoading] = useState(false);

  //Date of Admission State/प्रवेश की तिथि
  const handleChangeAdmission = (name, date) => {
    setFormData((prev) => ({
      ...prev,
      [name]: date,
    }));
  };
  //Date of Assessment State
  const handleChangeFormFilling = (name, date) => {
    setFormData((prev) => ({
      ...prev,
      [name]: date,
    }));
  };

  //Marital Status? वैवाहिक स्थिति?
  const [MaritalStatus, setMaritalStatus] = useState("");
  const [customMaritalStatus, setCustomMaritalStatus] = useState("");

  //Occupation Status? वैवाहिक स्थिति?
  const [OccupationStatus, setOccupationStatus] = useState("");
  const [customOccupationStatus, setCustomOccupationStatus] = useState("");

  //Living Situation रहने की स्थिति
  const [LivingSituation, setLivingSituation] = useState("");
  const [customLivingSituation, setCustomLivingSituation] = useState("");

  //Religion/धर्म
  const [selectedReligion, setSelectedReligion] = useState("");
  const [customReligion, setCustomReligion] = useState("");

  //Source of money? Kindly mention which are applicable?पैसे का अरैंजमेंट? कृपया बताएं कि कौन से लागू हैं?
  const [selectedMoneySource, setSelectedMoneySource] = useState("");

  //Chief Complaints: मुख्य शिकायतें:
  const [treatments, setTreatments] = useState([
    { year: "", place: "", duration: "", sobrietyDays: "" },
  ]);
  // Handle input change
  const handleInputChange = (index, event) => {
    const { name, value } = event.target;
    const newTreatments = [...treatments];
    newTreatments[index][name] = value;
    setTreatments(newTreatments);
  };

  // Add a new row
  const ChiefaddRow = () => {
    setTreatments([
      ...treatments,
      { year: "", place: "", duration: "", sobrietyDays: "" },
    ]);
  };

  // Remove a row
  const CheifremoveRow = (index) => {
    const newTreatments = treatments.filter((_, i) => i !== index);
    setTreatments(newTreatments);
  };

  const handleCheckboxChange = (e) => {
    if (e.target.id === "other") {
      setSelectedMoneySource(e.target.checked);
    }
  };

  //Relationship status: रिलेशनशिप स्टेटस ?:
  const [selectedRelationshipStatus, setSelectedRelationshipStatus] =
    useState("");
  const [cutsomRelationshipText, setcustomRelationshipText] = useState("");

  const handleChange = (e) => {
    setSelectedRelationshipStatus(e.target.value);
    if (e.target.value !== "other") setcustomRelationshipText("");
  };

  //Is there any interfrence of wife's
  const [interfrence, setinterfrence] = useState([
    { name: "", age: "", living_status: "", any_physical_disorder_disease: "" },
  ]);
  // Handle input change
  const handleinterfrenceInputChange = (index, event) => {
    const { name, value } = event.target;
    const newInterfrence = [...interfrence];
    newInterfrence[index][name] = value;
    setinterfrence(newInterfrence);
  };

  // Add a new row
  const interfrenceaddRow = () => {
    setinterfrence([
      ...interfrence,
      {
        name: "",
        age: "",
        living_status: "",
        any_physical_disorder_disease: "",
      },
    ]);
  };

  // Remove a row
  const interfrenceremoveRow = (index) => {
    const newInterfrence = interfrence.filter((_, i) => i !== index);
    setinterfrence(newInterfrence);
  };

  //Current Status? वर्तमान स्थिति?
  const [currentStatusData, setcurrentStatusData] = useState("");
  const [customeCurrentStatus, setcustomeCurrentStatus] = useState("");

  //Sociality  where born & Living? सामाजिकता जहां पैदा हुआ और रहा  है?

  // const [sociality, setSociality] = useState({
  //   birthPlace: "",
  //   currentLocation: "",
  // });

  // const handlesocialityChange = (event) => {
  //   const { name, value } = event.target;
  //   setSociality((prev) => ({
  //     ...prev,
  //     [name]: value,
  //   }));
  // };

  /*High risk behavior?
  उच्च जोखिम वाला व्यवहार?*/
  const [riskBehavior, setRiskBehavior] = useState({
    selectedRisks: [],
    otherRisk: "",
  });

  const handleRiskCheckboxChange = (event) => {
    const { value, checked } = event.target;
    setRiskBehavior((prev) => ({
      ...prev,
      selectedRisks: checked
        ? [...prev.selectedRisks, value]
        : prev.selectedRisks.filter((risk) => risk !== value),
      otherRisk: value === "Other / अन्य" && !checked ? "" : prev.otherRisk,
    }));
  };

  const handleRiskOtherRiskChange = (event) => {
    setRiskBehavior((prev) => ({
      ...prev,
      otherRisk: event.target.value,
    }));
  };

  /*Academics Occupational Details/ शैक्षणिक व्यावसायिक विवरण*/
  const [educationStatus, setEducationStatus] = useState({
    selectedStatus: "",
    otherEducation: "",
  });

  const handleEducationalSelectChange = (event) => {
    const { value } = event.target;
    setEducationStatus({
      selectedStatus: value,
      otherEducation:
        value === "Other / अन्य" ? "" : educationStatus.otherEducation,
    });
  };

  const handleEducationalOtherEducationChange = (event) => {
    setEducationStatus((prev) => ({
      ...prev,
      otherEducation: event.target.value,
    }));
  };

  /*Occupational status? कार्य की स्थिति?*/
  const [OccupationalStatus, setOccupationalStatus] = useState({
    selectedStatus: "",
    otherOccupational: "",
  });

  const handleOccupationalSelectChange = (event) => {
    const { value } = event.target;
    setOccupationalStatus({
      selectedStatus: value,
      otherOccupational:
        value === "Other / अन्य" ? "" : OccupationalStatus.otherOccupational,
    });
  };

  const handleOccupationalOtherEducationChange = (event) => {
    setOccupationalStatus((prev) => ({
      ...prev,
      otherOccupational: event.target.value,
    }));
  };

  //section Patient behavior (According to him)  / रोगी का व्यवहार (उनके अनुसार)

  // const handlePatientAnswerChange = (id, value) => {
  //   setPatientanswers((prevAnswers) => ({
  //     ...prevAnswers,
  //     [id]: value,
  //   }));
  // };

  //Selecter user state by create general family form
  const [selectedUser, setSelectedUser] = useState(null); // User data
  //Gen family form submit handler
  const [genFamilyModal, setgetFamilyModal] = useState(false);
  const createGenFamilyToggle = async (userId = null) => {
    // Always open the modal immediately
    setgetFamilyModal(true);
    if (userId) {
      const token = localStorage.getItem("Authorization");
      try {
        const response = await fetch(
          `https://gks-yjdc.onrender.com/api/users/${userId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `${token}`,
            },
          }
        );
        const data = await response.json();

        if (response.ok) {
          console.log(selectedUser);
        }

        if (!response.ok) {
          console.error("User fetch error:", data);
          return;
        }
        setSelectedUser(data);
        console.log(selectedUser);
      } catch (error) {
        console.error("Fetch error:", error);
      }
    }
    setgetFamilyModal(!genFamilyModal);
  };

  //This React hook calculates a user's age based on their date of birth (dob) and returns the age on General family form by create.
  const dob = selectedUser?.[0]?.dob;
  const patientCalAge = useCalculateAge(dob);
  console.log("DOB", patientCalAge);

  const closeGenFamily = () => {
    setgetFamilyModal(false);
    setviewGenFamilyModel(false);
    setGeneditModal(false);
  };

  //Datatable column data start
  const tableColumns = [
    { name: "ID", selector: (row) => row.id, sortable: true, center: true },
    {
      name: "Name",
      selector: (row) => row.name,
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
      cell: (row) => (
        <span style={{ color: row.disabled ? "#999" : "#000" }}>
          {row.status}
        </span>
      ),
    },
    //old code
    // {
    //   name: "Action",
    //   center: true,
    //   cell: (row) => (
    //     <div className="d-flex gap-2">
    //       {row.status === "Pending" ? (
    //         // Show only Create icon for Pending
    //         <span
    //           onClick={() => createGenFamilyToggle(row.id)}
    //           style={{ cursor: "pointer" }}
    //           title="Create PFA"
    //         >
    //           <svg
    //             xmlns="http://www.w3.org/2000/svg"
    //             width="24"
    //             height="24"
    //             viewBox="0 0 24 24"
    //             fill="none"
    //             stroke="currentColor"
    //             stroke-width="2"
    //             stroke-linecap="round"
    //             stroke-linejoin="round"
    //           >
    //             <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    //             <line x1="12" y1="8" x2="12" y2="16"></line>
    //             <line x1="8" y1="12" x2="16" y2="12"></line>
    //           </svg>
    //         </span>
    //       ) : (
    //         // Show View, Edit, Delete for Completed
    //         <>
    //           <span
    //             onClick={() => viewGenFamily(row.id)}
    //             style={{ cursor: "pointer" }}
    //             title="View"
    //           >
    //             <svg
    //               style={{ color: "#d56337" }}
    //               xmlns="http://www.w3.org/2000/svg"
    //               width="20"
    //               height="20"
    //               viewBox="0 0 24 24"
    //               fill="none"
    //               stroke="currentColor"
    //               strokeWidth="2"
    //               strokeLinecap="round"
    //               strokeLinejoin="round"
    //               className="feather feather-eye"
    //             >
    //               <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    //               <circle cx="12" cy="12" r="3"></circle>
    //             </svg>
    //           </span>

    //           <span
    //             // onClick={() => handleFAEdit(row.id)}
    //             style={{ cursor: "pointer", marginLeft: "10px" }}
    //             title="Edit"
    //           >
    //             <svg
    //               style={{ color: "green" }}
    //               xmlns="http://www.w3.org/2000/svg"
    //               width="20"
    //               height="20"
    //               viewBox="0 0 24 24"
    //               fill="none"
    //               stroke="currentColor"
    //               strokeWidth="2"
    //               strokeLinecap="round"
    //               strokeLinejoin="round"
    //               className="feather feather-edit"
    //             >
    //               <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    //               <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    //             </svg>
    //           </span>

    //           <span
    //             // onClick={() => handlePFADelete(row.id)}
    //             style={{ cursor: "pointer", marginLeft: "10px" }}
    //             title="Delete"
    //           >
    //             <svg
    //               style={{ color: "red" }}
    //               xmlns="http://www.w3.org/2000/svg"
    //               width="20"
    //               height="20"
    //               viewBox="0 0 24 24"
    //               fill="none"
    //               stroke="currentColor"
    //               strokeWidth="2"
    //               strokeLinecap="round"
    //               strokeLinejoin="round"
    //               className="feather feather-trash-2"
    //             >
    //               <polyline points="3 6 5 6 21 6"></polyline>
    //               <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    //               <line x1="10" y1="11" x2="10" y2="17"></line>
    //               <line x1="14" y1="11" x2="14" y2="17"></line>
    //             </svg>
    //           </span>
    //         </>
    //       )}
    //     </div>
    //   ),
    // },

    //Updated code
    {
      name: "Action",
      center: true,
      cell: (row) => {
        // Hide all actions if discharged
        if (row.dischargeStatus === 1) {
          return null;
        }
    
        return (
          <div className="d-flex gap-2">
            {/* Show Edit only if not discharged and readmission */}
            {row.dischargeStatus === 0 && row.isReadmission === 1 && (
              <span
                onClick={() => handleGenEdit(row.recentGenfamID)}
                style={{ cursor: "pointer" }}
                title="Readmission PFA"
              >
                ✏️
              </span>
            )}
    
            {/* Show Create PFA if not discharged and not readmission */}
            {row.dischargeStatus === 0 && row.isReadmission === 0 && (
              <span
                onClick={() => createGenFamilyToggle(row.id)}
                style={{ cursor: "pointer" }}
                title="Create PFA"
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
    }
  ];

  //All gen family data into datatabble column 
  const tableGenFamilyListColumns = [
    { name: "GKS ID's", selector: (row) => row.gks_id, sortable: true, center: true },  
    {
      name: "Name",
      selector: (row) => row.genFamilyPateintname,
      sortable: true,
      cell: (row) => (
        <span
          style={{
            color: row.disabled ? "#999" : "#000",
            fontStyle: row.disabled ? "italic" : "normal",
          }}
        >
          {row.genFamilyPateintname} {row.disabled && "(disabled)"}
        </span>
      ),
    },
    { name: "Email", selector: (row) => row.genfamiltEmail, sortable: true, center: true },  
    { name: "Number", selector: (row) => row.genfamiltNumber, sortable: true, center: true },  
    {
      name: "Status",
      selector: (row) => row.genFammiltStatus,
      cell: (row) => (
        <span className="badge bg-success p-2 text-white" style={{ color: row.disabled ? "#999" : "#000" }}>
          {row.genFammiltStatus}
        </span>
      ),
    },
  ];


 //Registered Patient Data
   const [data, setData] = useState([]);
   const [selectedRows, setSelectedRows] = useState([]);
   const [stillLoading, setstillLoading] = useState(true);
 useEffect(() => {
   const token = localStorage.getItem("Authorization");
 
   fetch("https://gks-yjdc.onrender.com/api/users", {
     method: "GET",
     headers: {
       "Content-Type": "application/json",
       Authorization: `${token}`,
     },
   })
     .then((response) => {
       if (!response.ok) throw new Error("Failed to fetch PFA user details");
       return response.json();
     })
     .then((res) => {
       const users = res.users || [];
 
       const formatted = users.map((user) => {
         const admitDate = user.recent_admit_date
           ? new Date(user.recent_admit_date)
           : null;
         const genfamilyDate = user.recent_gen_fam_date
           ? new Date(user.recent_gen_fam_date)
           : null;
 
         let userStatus = <p className="badge bg-warning text-dark p-2">{"Pending"}</p>;
         if (admitDate && genfamilyDate && admitDate > genfamilyDate) {
           userStatus = <p className="badge bg-success p-2">{"Completed"}</p>;
         }
 
         const dischargeStatus = user.discharge_status_text || "Unknown";
 
         return {
           id: user.user_id,
           recentGenfamID: user.recent_gen_fam_id,
           gks_id: user.gks_id || "N/A",
           name: user.name,
           status: userStatus,
           dischargeStatus: user.discharge_status,
           dischargeStatusText: dischargeStatus,
           isReadmission: user.is_readmission,
           recent_gen_fam_id: user.recent_gen_fam_id,
         };
       });
 
       setTimeout(() => {
         setData(formatted);
         setFilteredData(formatted);
         setstillLoading(false);
       }, 1000); // You can reduce this to 1s
     })
     .catch((error) => {
       console.error("Error fetching PFA user data:", error);
       setstillLoading(true);
     });
 }, []);

  //Fetch register user data ino datatable by user API & display Updated status completed or pending from create-gen-family API end

  //Search filter on register user list table start
  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  //User data search filter function
  const handleSearchChange = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchText(value);

    const filtered = data.filter((item) =>
      item.name.toLowerCase().includes(value)
    );

    setFilteredData(filtered);
  };

  //Filter all gen familt data from data table
  const [searchgenText, setgenSearchText] = useState("");
  const handleSearchGenFamily = (e) => {
    const value = e.target.value.toLowerCase();
    setgenSearchText(value);

    const genfamilyFiltered = getgenfamData.filter((item) =>
      item.genFamilyPateintname?.toLowerCase().includes(value) ||
      item.genFammiltStatus?.toLowerCase().includes(value) ||
      item.genfamiltEmail?.toLowerCase().includes(value) ||
      item.genfamiltNumber?.toString().includes(value) ||
      item.gks_id?.toString().includes(value)
    );

    setgenFilterData(genfamilyFiltered);
  };

  //Search filter on register user list table end

  //disabled row from datatable list after status completed
  const selectableRowDisabled = (row) => row.disabled === true;

  const [formData, setFormData] = useState({
    genUID: "",
    dateOfAdmission: new Date(),
    dateOfFormFilling: new Date(),
    occupational_status: "",
    marital_status: "",
    living_situation: "",
    your_religion: "",
    duration_of_use: "",
    daily_spent_amount: "",
    patient_monthly_income: "",
    family_monthly_income: "",
    //source of money
    source_family: "No",
    source_friends: "No",
    source_borrowings: "No",
    source_thefting: "No",
    source_theft_in_home: "No",
    source_by_bluff: "No",
    source_illegal: "No",
    source_any_other: "No",
    source_other_text: "",

    family_reaction: "",
    first_action_when_known: "",
    pattern_of_use: "",
    residence_status_during_use: "",
    trauma_experience: "",
    behavior_change: "",
    social_circle_change: "",
    life_effect: "",

    //Chief Complaint
    prior_treatment: "Yes",
    how_many_times: 2,
    chief_complaints: "",
    treatment_records: [
      {
        treatment_year: "",
        treatment_place: "",
        treatment_duration: "",
        days_of_sobriety: "",
      },
    ],

    asked_to_stop: "",
    reason_to_stop: "",
    work_after_stop: "",
    relapse_details: "",
    post_relapse_change: "",
    mental_physical_issues: "",
    injuries_due_to_substance: "",
    diagnosis_treatment: "",
    doctor_info: "",
    traditional_treatment: "",
    effect_of_treatment: "",

    //Relationship & Family Status / रिश्ते और पारिवारिक स्थिति
    relationship_status: "",
    marriage_arrangement: "",
    post_marriage_status: "",
    relatives_interference: "",

    //Relationship & Family Status table  row data
    members: [
      {
        name: "",
        relation: "",
        age: "",
        living_status: "",
        physical_disorder: "",
      },
    ],
    disorder_desc: "",

    //Family History
    family_history_data: {
      mother_side: {
        grandmother: { alcohol: "No", drug: "No", psych: "No" },
        grandfather: { alcohol: "No", drug: "No", psych: "No" },
        mother: { alcohol: "No", drug: "No", psych: "No" },
        aunt: { alcohol: "No", drug: "No", psych: "No" },
        uncle: { alcohol: "No", drug: "No", psych: "No" },
        mother_side_if_any: "",
      },
      father_side: {
        grandmother: { alcohol: "No", drug: "No", psych: "No" },
        grandfather: { alcohol: "No", drug: "No", psych: "No" },
        father: { alcohol: "No", drug: "No", psych: "No" },
        aunt: { alcohol: "No", drug: "No", psych: "No" },
        uncle: { alcohol: "No", drug: "No", psych: "No" },
        father_side_if_any: "",
      },
    },
    psych_problem_desc: "",
    current_status: "",
    relationship_with_user: "",
    family_behavior: "",
    head_of_family: "",
    relationships_with_family: "",

    //Childhood /बचपन
    childhood_history: {
      birth_conditions: "",
      parenting_history: "",
      family_conflict: "",
      sociality_living: "",
      high_risk_behavior: "",
      impact_of_movies: "",
      abuse_history: "",
    },

    //Academics Occupational Details

    education_employment: {
      education_status: "",
      occupation_status: "",
      dropout_reason: "",
      work_details: "",
      hobbies: "",
      skills: "",
      achievements: "",
    },

    //Social Behavior / सामाजिक व्यवहार
    social_behavior: {
      social_behavior: "",
      with_whom_spend_time: "",
      number_of_friends: "",
      friends_social_status: "",
      substance_dependent_friends: "",
      well_wisher_person: "",
    },

    //Legal History / लीगल इतिहास

    legal_history: {
      domestic_violence: "",
      violence_reason: "",
      drug_status_qty: "",
      criminal_case: "",
      case_details: "",
      case_status: "",
      jail_duration: "",
    },
    //Patient behaviour

    patient_behavior: {
      life_priority: "",
      life_aim: "",
      //Patient behaviour table options
      uses_alone: "",
      moody: "",
      worried: "",
      sad: "",
      lacks_confidence: "",
      stubborn: "",
      aggressive: "",
      uses_slang: "",
      disrespects_parents: "",
      fights_argue: "",
      vandalizes: "",
      fights_at_home: "",
      tells_lies: "",
      too_expensive: "",
      theft: "",
      borrows: "",
      gambles: "",
      bluffs: "",
      admits_mistake: "",
      irresponsible: "",
      selfish: "",
      has_empathy: "",
      lazy: "",
      nervous_anxiety_symptoms: "",
      emotional_post_use: "",
      prioritizes_substance: "",
      feels_guilty: "",
      avoids_people: "",
      sleep_eat_problem: "",
      uses_knowing_consequence: "",
      suicide_thoughts: "",
      loved_one_dependence: "",
    },
    //consents info value
    consent: "Yes",
    consent_name: "",
    relationship: "",
    signature: "",
    prepared_by: "",
  });

  //source of money
  const handleSourceOfMoney = (e) => {
    const { name, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: checked ? "Yes" : "No",
      ...(name === "source_any_other" && !checked
        ? { source_other_text: "" }
        : {}),
    }));
  };

  // const onChangeEventHandler = (e) => {
  //   const { name, value } = e.target;
  //   setFormData((prev) => ({
  //     ...prev,
  //     [name]: value,
  //   }));
  // };

  const onChangeEventHandler = (e) => {
    const { name, value } = e.target;

    if (name === "life_priority" || name === "life_aim") {
      setFormData((prev) => ({
        ...prev,
        patient_behavior: {
          ...prev.patient_behavior,
          [name]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // ✅ Handle dynamic treatment field changes

  const handleTreatmentInputChange = (index, e) => {
    const { name, value } = e.target;
    //Chief Complaint
    const updated = [...formData.treatment_records];
    updated[index][name] = value;
    setFormData((prev) => ({
      ...prev,
      treatment_records: updated,
    }));

    const updatedRecords = [...GenfamiltEditData.treatment_records];
    updatedRecords[index][name] = value;

    setGenfamilyEditData((prev) => ({
      ...prev,
      treatment_records: updatedRecords,
    }));
  };

  // {/*Chief Complaint*/} and
  // Relationship & Family Status table  row data

  const handleMemberInputChange = (index, e) => {
    const { name, value } = e.target;

    const updatedMembers = [...formData.members];
    updatedMembers[index][name] = value;

    setFormData((prev) => ({
      ...prev,
      members: updatedMembers,
    }));

    const editupdatedMembers = [...GenfamiltEditData.members];
    editupdatedMembers[index][name] = value;

  setGenfamilyEditData((prev) => ({
    ...prev,
    members: editupdatedMembers,
  }));
  };

  // ✅ Add a new treatment record row
  // {/*Chief Complaint*/}
  const addTreatmentRow = () => {
    setFormData((prev) => ({
      ...prev,
      treatment_records: [
        ...prev.treatment_records,
        {
          treatment_year: "",
          treatment_place: "",
          treatment_duration: "",
          days_of_sobriety: "",
        },
      ],
    }));

    setGenfamilyEditData((prev) => ({
      ...prev,
      treatment_records: [
        ...prev.treatment_records,
        {
          treatment_year: "",
          treatment_place: "",
          treatment_duration: "",
          days_of_sobriety: "",
        },
      ],
    }));
  };

  //Interference relation table add row
  const addInterferenceRow = () => {
    setFormData((prev) => ({
      ...prev,
      members: [
        ...prev.members,
        {
          name: "",
          relation: "",
          age: "",
          living_status: "",
          physical_disorder: "",
        },
      ],
    }));

    //gen family pre fill data
    setGenfamilyEditData((prev) => ({
      ...prev,
      members: [
        ...prev.members,
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

  // ✅ Remove a treatment record row
  // {/*Chief Complaint*/}
  const removeTreatmentRow = (index) => {
    const updated = [...formData.treatment_records];
    updated.splice(index, 1);
    setFormData((prev) => ({
      ...prev,
      treatment_records: updated,
    }));

    const updatedRecords = GenfamiltEditData.treatment_records.filter(
      (_, i) => i !== index
    );
    setGenfamilyEditData((prev) => ({
      ...prev,
      treatment_records: updatedRecords,
    }));
  };

  // Interference relation add table row handler
  const removeInterferenceRow = (index) => {
    const updated = [...formData.members];
    updated.splice(index, 1);
    setFormData((prev) => ({
      ...prev,
      members: updated,
    }));

    const updatedMembers = GenfamiltEditData.members.filter((_, i) => i !== index);

  setGenfamilyEditData((prev) => ({
    ...prev,
    members: updatedMembers,
  }));
  };


  //Family History
  const handleFamilyHistoryChange = (side, relation, field, value) => {
    setFormData((prev) => ({
      ...prev,
      family_history_data: {
        ...prev.family_history_data,
        [side]: {
          ...prev.family_history_data[side],
          [relation]: {
            ...prev.family_history_data[side][relation],
            [field]: value,
          },
        },
      },
    }));

    setGenfamilyEditData((prev) => ({
      ...prev,
      family_history_data: {
        ...prev.family_history_data,
        [side]: {
          ...prev.family_history_data[side],
          [relation]: {
            ...prev.family_history_data[side][relation],
            [field]: value,
          },
        },
      },
    }));
  };



  //Childhood handle chnage
  const childhoodHandleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      childhood_history: {
        ...prevData.childhood_history,
        [name]: value,
      },
    }));
  };

  //Academics Occupational Details
  const academicOccupationHandler = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      education_employment: {
        ...prevData.education_employment,
        [name]: value,
      },
    }));
  };

  //Social Behavior / सामाजिक व्यवहार
  const socialBehaviorHandler = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      social_behavior: {
        ...prevData.social_behavior,
        [name]: value,
      },
    }));
  };

  //Legal History / लीगल इतिहास
  const legalHistoryHandler = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      legal_history: {
        ...prevData.legal_history,
        [name]: value,
      },
    }));
  };

  //General Family Submit Handler
  const handleGeneralFamilySubmit = async (e) => {
    e.preventDefault();
    console.log("Gen Form Data: ", formData);
    const payload = {
      user_id: selectedUser[0].user_id,

      gen_family: {
        uid: formData.genUID,
        form_fill_date: formData.dateOfFormFilling,
        occupational_status: formData.occupational_status,
        marital_status: formData.marital_status,
        living_situation: formData.living_situation,
        religion: formData.your_religion,
      },

      substance_use_dependency: {
        duration_of_use: formData.duration_of_use,
        daily_spent_amount: formData.daily_spent_amount,
        patient_monthly_income: formData.patient_monthly_income,
        family_monthly_income: formData.family_monthly_income,
        source_family: formData.source_family,
        source_friends: formData.source_friends,
        source_borrowings: formData.source_borrowings,
        source_thefting: formData.source_thefting,
        source_theft_in_home: formData.source_theft_in_home,
        source_by_bluff: formData.source_by_bluff,
        source_illegal: formData.source_illegal,
        source_any_other: formData.source_any_other,
        source_other_text: formData.source_other_text,
        family_reaction: formData.family_reaction,
        first_action_when_known: formData.first_action_when_known,
        pattern_of_use: formData.pattern_of_use,
        residence_status_during_use: formData.residence_status_during_use,
        trauma_experience: formData.trauma_experience,
        behavior_change: formData.behavior_change,
        social_circle_change: formData.social_circle_change,
        life_effect: formData.life_effect,
      },

      treatment_history: {
        chief_complaints: formData.chief_complaints,
        prior_treatment: formData.prior_treatment,
        how_many_times: formData.how_many_times,
        treatment_records: formData.treatment_records.map((record) => ({
          treatment_year: record.treatment_year.trim(),
          treatment_place: record.treatment_place.trim(),
          treatment_duration: record.treatment_duration.trim(),
          days_of_sobriety: record.days_of_sobriety.trim(),
        })),

        asked_to_stop: formData.asked_to_stop,
        reason_to_stop: formData.reason_to_stop,
        work_after_stop: formData.work_after_stop,
        relapse_details: formData.relapse_details,
        post_relapse_change: formData.post_relapse_change,
        mental_physical_issues: formData.mental_physical_issues,
        injuries_due_to_substance: formData.injuries_due_to_substance,
        diagnosis_treatment: formData.diagnosis_treatment,
        doctor_info: formData.doctor_info,
        traditional_treatment: formData.traditional_treatment,
        effect_of_treatment: formData.effect_of_treatment,
      },

      family_info: {
        relationship_status: formData.relationship_status,
        marriage_arrangement: formData.marriage_arrangement,
        post_marriage_status: formData.post_marriage_status,
        relatives_interference: formData.relatives_interference,
      },

      family_members: {
        members: formData.members,
        disorder_desc: formData.disorder_desc,
        family_history_data: formData.family_history_data,
        psych_problem_desc: formData.psych_problem_desc,
        current_status: formData.current_status,
        relationship_with_user: formData.relationship_with_user,
        family_behavior: formData.family_behavior,
        head_of_family: formData.head_of_family,
        relationships_with_family: formData.relationships_with_family,
      },

      childhood_history: {
        birth_conditions: formData.childhood_history.birth_conditions,
        parenting_history: formData.childhood_history.parenting_history,
        family_conflict: formData.childhood_history.family_conflict,
        sociality_living: formData.childhood_history.sociality_living,
        high_risk_behavior: formData.childhood_history.high_risk_behavior,
        impact_of_movies: formData.childhood_history.impact_of_movies,
        abuse_history: formData.childhood_history.abuse_history,
      },

      education_employment: {
        education_status: formData.education_employment.education_status,
        occupation_status: formData.education_employment.occupation_status,
        dropout_reason: formData.education_employment.dropout_reason,
        work_details: formData.education_employment.work_details,
        hobbies: formData.education_employment.hobbies,
        skills: formData.education_employment.skills,
        achievements: formData.education_employment.achievements,
      },

      social_behavior: {
        social_behavior: formData.social_behavior.social_behavior,
        with_whom_spend_time: formData.social_behavior.with_whom_spend_time,
        number_of_friends: formData.social_behavior.number_of_friends,
        friends_social_status: formData.social_behavior.friends_social_status,
        substance_dependent_friends:
          formData.social_behavior.substance_dependent_friends,
        well_wisher_person: formData.social_behavior.well_wisher_person,
      },

      legal_history: {
        domestic_violence: formData.legal_history.domestic_violence,
        violence_reason: formData.legal_history.violence_reason,
        drug_status_qty: formData.legal_history.drug_status_qty,
        criminal_case: formData.legal_history.criminal_case,
        case_details: formData.legal_history.case_details,
        case_status: formData.legal_history.case_status,
        jail_duration: formData.legal_history.jail_duration,
      },

      patient_behavior: {
        life_priority: formData.patient_behavior.life_priority,
        life_aim: formData.patient_behavior.life_aim,
        uses_alone: formData.patient_behavior.uses_alone,
        moody: formData.patient_behavior.moody,
        worried: formData.patient_behavior.worried,
        sad: formData.patient_behavior.sad,
        lacks_confidence: formData.patient_behavior.lacks_confidence,
        stubborn: formData.patient_behavior.stubborn,
        aggressive: formData.patient_behavior.aggressive,
        uses_slang: formData.patient_behavior.uses_slang,
        disrespects_parents: formData.patient_behavior.disrespects_parents,
        fights_argue: formData.patient_behavior.fights_argue,
        vandalizes: formData.patient_behavior.vandalizes,
        fights_at_home: formData.patient_behavior.fights_at_home,
        tells_lies: formData.patient_behavior.tells_lies,
        too_expensive: formData.patient_behavior.too_expensive,
        theft: formData.patient_behavior.theft,
        borrows: formData.patient_behavior.borrows,
        gambles: formData.patient_behavior.gambles,
        bluffs: formData.patient_behavior.bluffs,
        admits_mistake: formData.patient_behavior.admits_mistake,
        irresponsible: formData.patient_behavior.irresponsible,
        selfish: formData.patient_behavior.selfish,
        has_empathy: formData.patient_behavior.has_empathy,
        lazy: formData.patient_behavior.lazy,
        nervous_anxiety_symptoms:
          formData.patient_behavior.nervous_anxiety_symptoms,
        emotional_post_use: formData.patient_behavior.emotional_post_use,
        prioritizes_substance: formData.patient_behavior.prioritizes_substance,
        feels_guilty: formData.patient_behavior.feels_guilty,
        avoids_people: formData.patient_behavior.avoids_people,
        sleep_eat_problem: formData.patient_behavior.sleep_eat_problem,
        uses_knowing_consequence:
          formData.patient_behavior.uses_knowing_consequence,
        suicide_thoughts: formData.patient_behavior.suicide_thoughts,
        loved_one_dependence: formData.patient_behavior.loved_one_dependence,
      },

      consent_info: {
        consent: formData.consent,
        consent_name: formData.consent_name,
        relationship: formData.relationship,
        prepared_by: formData.prepared_by,
        signature: formData.signature,
      },
    };

    try {
      const token = localStorage.getItem("Authorization");

      console.log("Payload to be sent:", JSON.stringify(payload));

      const response = await fetch(
        "https://gks-yjdc.onrender.com/api/gen-family/create-gen-family",
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
      console.log("Response from server:", result);

      if (!response.ok) {
        setIsLoading(false);
        Swal.fire({
          icon: "error",
          title: "Submission Failed",
          text: result.message || "Server error",
        });
        return;
      }


      setIsLoading(false);

      Swal.fire({
        icon: "success",
        title: "Assessment Submitted",
      }).then(() => {
        setgetFamilyModal(false);
      });

      // ✅ Fetch all users and update their status
      const usersResponse = await fetch(
        "https://gks-yjdc.onrender.com/api/users",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        }
      );

      if (!usersResponse.ok) {
        throw new Error("Failed to fetch users");
      }

      const usersData = await usersResponse.json();

      const formatted = await Promise.all(
        usersData.map(async (user) => {
          try {
            const statusResponse = await fetch(
              `https://gks-yjdc.onrender.com/api/gen-family/gen-family-details/${user.user_id}`,
              {
                headers: {
                  Authorization: `${token}`,
                },
              }
            );

            const assessmentData = await statusResponse.json();
            console.log("assessmentData:", assessmentData);

            const userStatus =
              assessmentData?.genFamilyDetails?.consent_info?.status ===
                "Completed"
                ? "Completed"
                : "Pending";

            console.log("userStatus:", userStatus);

            return {
              id: user.user_id,
              name: user.name,
              status: userStatus,
            };
          } catch (err) {
            console.error(
              `Failed to fetch status for user ${user.user_id}`,
              err
            );
            return {
              id: user.user_id,
              name: user.name,
              status: "Unknown",
            };
          }
        })
      );

      setData(formatted);
      setFilteredData(formatted);
    } catch (error) {
      setIsLoading(false);
      Swal.fire({
        icon: "error",
        title: "Unexpected Error",
        text: "PFA failed! Unknown error occurred.",
      });
    }
  };



  const [viewGenFamilyModel, setviewGenFamilyModel] = useState(false)
  const [viewgenData, setviewgenData] = useState(null)

  const viewGenFamily = async (userId = null) => {
    if (typeof userId === "object" && userId !== null) {
      userId = userId.id;
    }

    if (!userId) {
      console.error("Invalid userId provided to toggle");
      return;
    }

    const token = localStorage.getItem("Authorization");
    try {
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/gen-family/gen-family-details/${userId}`,
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

      setviewgenData(data.genFamilyDetails)
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
    }

    //get user Id and pre fill patient name, age and sex
    try {
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/users/${userId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        }
      );
      const data = await response.json();

      if (response.ok) {
        console.log("selectedUser ", selectedUser);
      }

      if (!response.ok) {
        console.error("User fetch error:", data);
        return;
      }
      setSelectedUser(data);
      console.log(selectedUser);
    } catch (error) {
      console.error("Fetch error:", error);
    }

    setviewGenFamilyModel(!genFamilyModal);
  }


  //state variable for readmission gen family
  const [GenfamiltEditData, setGenfamilyEditData]=useState(null);
  const [GeneditModal, setGeneditModal] = useState(false);

  const handleGenEdit = async (recentGenfamID = null)=>{
    if (typeof recentGenfamID === "object" && recentGenfamID !==null){
      recentGenfamID = recentGenfamID.recent_gen_fam_id;
    }

    if (!recentGenfamID) {
      console.error("Invalid userId provided to toggle");
      return;
    }

    console.log(recentGenfamID);
    // alert("Hello");

    //Getting latest genfamily data like if current ID's is 5 so the latest previous id will be 4 and through this id we can get latest genfamily data for readmission gen family form

    const token = localStorage.getItem("Authorization");
  try {
    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/gen-family/gen-family/${recentGenfamID}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      }
    );

    const data = await response.json();
    console.log("Latest PFA:", data);

    if (!response.ok) {
      console.error("User fetch error:", data);
      return;
    }

    const latestGenFamilyData = data.genFamily || data;

    if (!latestGenFamilyData) {
      console.warn("No genfamily data found for this user.");
      return;
    }

    // setSelectedUser(latestAssessment);
    console.log("Selected Genfamily data:", latestGenFamilyData);

    // console.log(latestGenFamilyData.achievements);

    setGenfamilyEditData({
      gen_fam_id: latestGenFamilyData.gen_fam_id,
      uid: latestGenFamilyData.uid,
      form_fill_date: latestGenFamilyData.form_fill_date,
      occupational_status: latestGenFamilyData.occupational_status,
      marital_status: latestGenFamilyData.marital_status,
      living_situation: latestGenFamilyData.living_situation,
      religion: latestGenFamilyData.religion,
      user_id: latestGenFamilyData.user_id,
      entry_id: latestGenFamilyData.entry_id,
      visit_no: latestGenFamilyData.visit_no,
      isActive: latestGenFamilyData.isActive,
      name: latestGenFamilyData.name,
      relative_name: latestGenFamilyData.relative_name,
      email: latestGenFamilyData.email,
      gender: latestGenFamilyData.gender,
      phone: latestGenFamilyData.phone,
      Branch_id: latestGenFamilyData.Branch_id,
      dob: latestGenFamilyData.dob,
      custom_code: latestGenFamilyData.custom_code,
      duration_of_use: latestGenFamilyData.duration_of_use,
      daily_spent_amount: latestGenFamilyData.daily_spent_amount,
      patient_monthly_income: latestGenFamilyData.patient_monthly_income,
      family_monthly_income: latestGenFamilyData.family_monthly_income,
      
        source_family: latestGenFamilyData.source_family,
        source_friends: latestGenFamilyData.source_friends,
        source_borrowings: latestGenFamilyData.source_borrowings,
        source_thefting: latestGenFamilyData.source_thefting,
        source_theft_in_home: latestGenFamilyData.source_theft_in_home,
        source_by_bluff: latestGenFamilyData.source_by_bluff,
        source_illegal: latestGenFamilyData.source_illegal,
        source_any_other: latestGenFamilyData.source_any_other,
        source_other_text: latestGenFamilyData.source_other_text,
      
      family_reaction: latestGenFamilyData.family_reaction,
      first_action_when_known: latestGenFamilyData.first_action_when_known,
      pattern_of_use: latestGenFamilyData.pattern_of_use,
      residence_status_during_use: latestGenFamilyData.residence_status_during_use,
      trauma_experience: latestGenFamilyData.trauma_experience,
      behavior_change: latestGenFamilyData.behavior_change,
      social_circle_change: latestGenFamilyData.social_circle_change,
      life_effect: latestGenFamilyData.life_effect,
      chief_complaints: latestGenFamilyData.chief_complaints,
      prior_treatment: latestGenFamilyData.prior_treatment,
      how_many_times: latestGenFamilyData.how_many_times,
      treatment_records: JSON.parse(latestGenFamilyData.treatment_records || "[]"),
      asked_to_stop: latestGenFamilyData.asked_to_stop,
      reason_to_stop: latestGenFamilyData.reason_to_stop,
      work_after_stop: latestGenFamilyData.work_after_stop,
      relapse_details: latestGenFamilyData.relapse_details,
      post_relapse_change: latestGenFamilyData.post_relapse_change,
      mental_physical_issues: latestGenFamilyData.mental_physical_issues,
      injuries_due_to_substance: latestGenFamilyData.injuries_due_to_substance,
      diagnosis_treatment: latestGenFamilyData.diagnosis_treatment,
      doctor_info: latestGenFamilyData.doctor_info,
      traditional_treatment: latestGenFamilyData.traditional_treatment,
      effect_of_treatment: latestGenFamilyData.effect_of_treatment,
      relationship_status: latestGenFamilyData.relationship_status,
      marriage_arrangement: latestGenFamilyData.marriage_arrangement,
      post_marriage_status: latestGenFamilyData.post_marriage_status,
      relatives_interference: latestGenFamilyData.relatives_interference,
      members: JSON.parse(latestGenFamilyData.members || "[]"),
      disorder_desc: latestGenFamilyData.disorder_desc,
      family_history_data: JSON.parse(latestGenFamilyData.family_history_data || "{}"),
      psych_problem_desc: latestGenFamilyData.psych_problem_desc,
      current_status: latestGenFamilyData.current_status,
      relationship_with_user: latestGenFamilyData.relationship_with_user,
      family_behavior: latestGenFamilyData.family_behavior,
      head_of_family: latestGenFamilyData.head_of_family,
      relationships_with_family: latestGenFamilyData.relationships_with_family,
      birth_conditions: latestGenFamilyData.birth_conditions,
      parenting_history: latestGenFamilyData.parenting_history,
      family_conflict: latestGenFamilyData.family_conflict,
      sociality_living: latestGenFamilyData.sociality_living,
      high_risk_behavior: latestGenFamilyData.high_risk_behavior,
      impact_of_movies: latestGenFamilyData.impact_of_movies,
      abuse_history: latestGenFamilyData.abuse_history,
      education_status: latestGenFamilyData.education_status,
      occupation_status: latestGenFamilyData.occupation_status,
      dropout_reason: latestGenFamilyData.dropout_reason,
      work_details: latestGenFamilyData.work_details,
      hobbies: latestGenFamilyData.hobbies,
      skills: latestGenFamilyData.skills,
      achievements: latestGenFamilyData.achievements,
      social_behavior: latestGenFamilyData.social_behavior,
      with_whom_spend_time: latestGenFamilyData.with_whom_spend_time,
      number_of_friends: latestGenFamilyData.number_of_friends,
      friends_social_status: latestGenFamilyData.friends_social_status,
      substance_dependent_friends: latestGenFamilyData.substance_dependent_friends,
      well_wisher_person: latestGenFamilyData.well_wisher_person,
      domestic_violence: latestGenFamilyData.domestic_violence,
      violence_reason: latestGenFamilyData.violence_reason,
      drug_status_qty: latestGenFamilyData.drug_status_qty,
      criminal_case: latestGenFamilyData.criminal_case,
      case_details: latestGenFamilyData.case_details,
      case_status: latestGenFamilyData.case_status,
      jail_duration: latestGenFamilyData.jail_duration,
      life_priority: latestGenFamilyData.life_priority,
      life_aim: latestGenFamilyData.life_aim,
      uses_alone: latestGenFamilyData.uses_alone,
      moody: latestGenFamilyData.moody,
      worried: latestGenFamilyData.worried,
      sad: latestGenFamilyData.sad,
      lacks_confidence: latestGenFamilyData.lacks_confidence,
      stubborn: latestGenFamilyData.stubborn,
      aggressive: latestGenFamilyData.aggressive,
      uses_slang: latestGenFamilyData.uses_slang,
      disrespects_parents: latestGenFamilyData.disrespects_parents,
      fights_argue: latestGenFamilyData.fights_argue,
      vandalizes: latestGenFamilyData.vandalizes,
      fights_at_home: latestGenFamilyData.fights_at_home,
      tells_lies: latestGenFamilyData.tells_lies,
      too_expensive: latestGenFamilyData.too_expensive,
      theft: latestGenFamilyData.theft,
      borrows: latestGenFamilyData.borrows,
      gambles: latestGenFamilyData.gambles,
      bluffs: latestGenFamilyData.bluffs,
      admits_mistake: latestGenFamilyData.admits_mistake,
      irresponsible: latestGenFamilyData.irresponsible,
      selfish: latestGenFamilyData.selfish,
      has_empathy: latestGenFamilyData.has_empathy,
      lazy: latestGenFamilyData.lazy,
      nervous_anxiety_symptoms: latestGenFamilyData.nervous_anxiety_symptoms,
      emotional_post_use: latestGenFamilyData.emotional_post_use,
      prioritizes_substance: latestGenFamilyData.prioritizes_substance,
      feels_guilty: latestGenFamilyData.feels_guilty,
      avoids_people: latestGenFamilyData.avoids_people,
      sleep_eat_problem: latestGenFamilyData.sleep_eat_problem,
      uses_knowing_consequence: latestGenFamilyData.uses_knowing_consequence,
      suicide_thoughts: latestGenFamilyData.suicide_thoughts,
      loved_one_dependence: latestGenFamilyData.loved_one_dependence,
      consent: latestGenFamilyData.consent,
      consent_name: latestGenFamilyData.consent_name,
      relationship: latestGenFamilyData.relationship,
      prepared_by: latestGenFamilyData.prepared_by,
      signature: latestGenFamilyData.signature,
      status: latestGenFamilyData.status,
      created_by: latestGenFamilyData.created_by,
      updated_by: latestGenFamilyData.updated_by,


      //Patient Behaviour 
      patientBehaviour: {
        uses_alone: latestGenFamilyData.uses_alone,
        moody: latestGenFamilyData.moody,
        worried: latestGenFamilyData.worried,
        sad: latestGenFamilyData.sad,
        lacks_confidence: latestGenFamilyData.lacks_confidence,
        stubborn: latestGenFamilyData.stubborn,
        aggressive: latestGenFamilyData.aggressive,
        uses_slang: latestGenFamilyData.uses_slang,
        disrespects_parents: latestGenFamilyData.disrespects_parents,
        fights_argue: latestGenFamilyData.fights_argue,
        vandalizes: latestGenFamilyData.vandalizes,
        fights_at_home: latestGenFamilyData.fights_at_home,
        tells_lies: latestGenFamilyData.tells_lies,
        too_expensive: latestGenFamilyData.too_expensive,
        theft: latestGenFamilyData.theft,
        borrows: latestGenFamilyData.borrows,
        gambles: latestGenFamilyData.gambles,
        bluffs: latestGenFamilyData.bluffs,
        admits_mistake: latestGenFamilyData.admits_mistake,
        irresponsible: latestGenFamilyData.irresponsible,
        selfish: latestGenFamilyData.selfish,
        has_empathy: latestGenFamilyData.has_empathy,
        lazy: latestGenFamilyData.lazy,
        nervous_anxiety_symptoms: latestGenFamilyData.nervous_anxiety_symptoms,
        emotional_post_use: latestGenFamilyData.emotional_post_use,
        prioritizes_substance: latestGenFamilyData.prioritizes_substance,
        feels_guilty: latestGenFamilyData.feels_guilty,
        avoids_people: latestGenFamilyData.avoids_people,
        sleep_eat_problem: latestGenFamilyData.sleep_eat_problem,
        uses_knowing_consequence: latestGenFamilyData.uses_knowing_consequence,
        suicide_thoughts: latestGenFamilyData.suicide_thoughts,
        loved_one_dependence: latestGenFamilyData.loved_one_dependence,
      }
    });

     // Only open modal after data is ready
     setGeneditModal(true);


    console.log(GenfamiltEditData.gen_fam_id)

    console.log("patientBehaviour", GenfamiltEditData.patientBehaviour)

    console.log("occupational_status" ,GenfamiltEditData.occupational_status)

    } catch (error) {
      console.error("Fetch error:", error);
    }

    setviewGenFamilyModel((setGeneditModal)=>!setGeneditModal);
  }

  //Recreate the GenFamily entry using the latest ID, and fetch all data to refill the form for editing when the pending icon is clicked.

  

  const handlereGenfamily = async () => {
    const payload = {
      user_id: GenfamiltEditData.user_id,
    
      gen_family: {
        gen_fam_id: GenfamiltEditData.gen_fam_id,
        uid: GenfamiltEditData.uid,
        form_fill_date: GenfamiltEditData.form_fill_date,
        occupational_status: GenfamiltEditData.occupational_status,
        marital_status: GenfamiltEditData.marital_status,
        living_situation: GenfamiltEditData.living_situation,
        religion: GenfamiltEditData.religion,
        entry_id: GenfamiltEditData.entry_id,
        visit_no: GenfamiltEditData.visit_no,
        isActive: GenfamiltEditData.isActive,
        name: GenfamiltEditData.name,
        relative_name: GenfamiltEditData.relative_name,
        email: GenfamiltEditData.email,
        gender: GenfamiltEditData.gender,
        phone: GenfamiltEditData.phone,
        Branch_id: GenfamiltEditData.Branch_id,
        dob: GenfamiltEditData.dob,
        custom_code: GenfamiltEditData.custom_code,
      },
    
      substance_use_dependency: {
        duration_of_use: GenfamiltEditData.duration_of_use,
        daily_spent_amount: GenfamiltEditData.daily_spent_amount,
        patient_monthly_income: GenfamiltEditData.patient_monthly_income,
        family_monthly_income: GenfamiltEditData.family_monthly_income,
        source_family: GenfamiltEditData.source_family,
        source_friends: GenfamiltEditData.source_friends,
        source_borrowings: GenfamiltEditData.source_borrowings,
        source_thefting: GenfamiltEditData.source_thefting,
        source_theft_in_home: GenfamiltEditData.source_theft_in_home,
        source_by_bluff: GenfamiltEditData.source_by_bluff,
        source_illegal: GenfamiltEditData.source_illegal,
        source_any_other: GenfamiltEditData.source_any_other,
        source_other_text: GenfamiltEditData.source_other_text,
        family_reaction: GenfamiltEditData.family_reaction,
        first_action_when_known: GenfamiltEditData.first_action_when_known,
        pattern_of_use: GenfamiltEditData.pattern_of_use,
        residence_status_during_use: GenfamiltEditData.residence_status_during_use,
        trauma_experience: GenfamiltEditData.trauma_experience,
        behavior_change: GenfamiltEditData.behavior_change,
        social_circle_change: GenfamiltEditData.social_circle_change,
        life_effect: GenfamiltEditData.life_effect,
      },
    
      treatment_history: {
        chief_complaints: GenfamiltEditData.chief_complaints,
        prior_treatment: GenfamiltEditData.prior_treatment,
        how_many_times: GenfamiltEditData.how_many_times,
        // treatment_records: JSON.parse(GenfamiltEditData.treatment_records || '[]'),
        treatment_records: GenfamiltEditData.treatment_records.map((record) => ({
          treatment_year: record.treatment_year.trim(),
          treatment_place: record.treatment_place.trim(),
          treatment_duration: record.treatment_duration.trim(),
          days_of_sobriety: record.days_of_sobriety.trim(),
        })),


        asked_to_stop: GenfamiltEditData.asked_to_stop,
        reason_to_stop: GenfamiltEditData.reason_to_stop,
        work_after_stop: GenfamiltEditData.work_after_stop,
        relapse_details: GenfamiltEditData.relapse_details,
        post_relapse_change: GenfamiltEditData.post_relapse_change,
        mental_physical_issues: GenfamiltEditData.mental_physical_issues,
        injuries_due_to_substance: GenfamiltEditData.injuries_due_to_substance,
        diagnosis_treatment: GenfamiltEditData.diagnosis_treatment,
        doctor_info: GenfamiltEditData.doctor_info,
        traditional_treatment: GenfamiltEditData.traditional_treatment,
        effect_of_treatment: GenfamiltEditData.effect_of_treatment,
      },
    
      family_info: {
        relationship_status: GenfamiltEditData.relationship_status,
        marriage_arrangement: GenfamiltEditData.marriage_arrangement,
        post_marriage_status: GenfamiltEditData.post_marriage_status,
        relatives_interference: GenfamiltEditData.relatives_interference,
      },
    
      family_members: {
        members: GenfamiltEditData.members,
        disorder_desc: GenfamiltEditData.disorder_desc,
        family_history_data: GenfamiltEditData.family_history_data,
        psych_problem_desc: GenfamiltEditData.psych_problem_desc,
        current_status: GenfamiltEditData.current_status,
        relationship_with_user: GenfamiltEditData.relationship_with_user,
        family_behavior: GenfamiltEditData.family_behavior,
        head_of_family: GenfamiltEditData.head_of_family,
        relationships_with_family: GenfamiltEditData.relationships_with_family,
      },
    
      childhood_history: {
        birth_conditions: GenfamiltEditData.birth_conditions,
        parenting_history: GenfamiltEditData.parenting_history,
        family_conflict: GenfamiltEditData.family_conflict,
        sociality_living: GenfamiltEditData.sociality_living,
        high_risk_behavior: GenfamiltEditData.high_risk_behavior,
        impact_of_movies: GenfamiltEditData.impact_of_movies,
        abuse_history: GenfamiltEditData.abuse_history,
      },
    
      education_employment: {
        education_status: GenfamiltEditData.education_status,
        occupation_status: GenfamiltEditData.occupation_status,
        dropout_reason: GenfamiltEditData.dropout_reason,
        work_details: GenfamiltEditData.work_details,
        hobbies: GenfamiltEditData.hobbies,
        skills: GenfamiltEditData.skills,
        achievements: GenfamiltEditData.achievements,
      },
    
      social_behavior: {
        social_behavior: GenfamiltEditData.social_behavior,
        with_whom_spend_time: GenfamiltEditData.with_whom_spend_time,
        number_of_friends: GenfamiltEditData.number_of_friends,
        friends_social_status: GenfamiltEditData.friends_social_status,
        substance_dependent_friends: GenfamiltEditData.substance_dependent_friends,
        well_wisher_person: GenfamiltEditData.well_wisher_person,
      },
    
      legal_history: {
        domestic_violence: GenfamiltEditData.domestic_violence,
        violence_reason: GenfamiltEditData.violence_reason,
        drug_status_qty: GenfamiltEditData.drug_status_qty,
        criminal_case: GenfamiltEditData.criminal_case,
        case_details: GenfamiltEditData.case_details,
        case_status: GenfamiltEditData.case_status,
        jail_duration: GenfamiltEditData.jail_duration,
      },
    
      patient_behavior: {
        life_priority: GenfamiltEditData.life_priority,
        life_aim: GenfamiltEditData.life_aim,
        uses_alone: GenfamiltEditData.patientBehaviour.uses_alone,
        moody: GenfamiltEditData.patientBehaviour.moody,
        worried: GenfamiltEditData.patientBehaviour.worried,
        sad: GenfamiltEditData.patientBehaviour.sad,
        lacks_confidence: GenfamiltEditData.patientBehaviour.lacks_confidence,
        stubborn: GenfamiltEditData.patientBehaviour.stubborn,
        aggressive: GenfamiltEditData.patientBehaviour.aggressive,
        uses_slang: GenfamiltEditData.patientBehaviour.uses_slang,
        disrespects_parents: GenfamiltEditData.patientBehaviour.disrespects_parents,
        fights_argue: GenfamiltEditData.patientBehaviour.fights_argue,
        vandalizes: GenfamiltEditData.patientBehaviour.vandalizes,
        fights_at_home: GenfamiltEditData.patientBehaviour.fights_at_home,
        tells_lies: GenfamiltEditData.patientBehaviour.tells_lies,
        too_expensive: GenfamiltEditData.patientBehaviour.too_expensive,
        theft: GenfamiltEditData.patientBehaviour.theft,
        borrows: GenfamiltEditData.patientBehaviour.borrows,
        gambles: GenfamiltEditData.patientBehaviour.gambles,
        bluffs: GenfamiltEditData.patientBehaviour.bluffs,
        admits_mistake: GenfamiltEditData.patientBehaviour.admits_mistake,
        irresponsible: GenfamiltEditData.patientBehaviour.irresponsible,
        selfish: GenfamiltEditData.patientBehaviour.selfish,
        has_empathy: GenfamiltEditData.patientBehaviour.has_empathy,
        lazy: GenfamiltEditData.patientBehaviour.lazy,
        nervous_anxiety_symptoms: GenfamiltEditData.patientBehaviour.nervous_anxiety_symptoms,
        emotional_post_use: GenfamiltEditData.patientBehaviour.emotional_post_use,
        prioritizes_substance: GenfamiltEditData.patientBehaviour.prioritizes_substance,
        feels_guilty: GenfamiltEditData.patientBehaviour.feels_guilty,
        avoids_people: GenfamiltEditData.patientBehaviour.avoids_people,
        sleep_eat_problem: GenfamiltEditData.patientBehaviour.sleep_eat_problem,
        uses_knowing_consequence: GenfamiltEditData.patientBehaviour.uses_knowing_consequence,
        suicide_thoughts: GenfamiltEditData.patientBehaviour.suicide_thoughts,
        loved_one_dependence: GenfamiltEditData.patientBehaviour.loved_one_dependence,
      },
    
      consent_info: {
        consent: GenfamiltEditData.consent,
        consent_name: GenfamiltEditData.consent_name,
        relationship: GenfamiltEditData.relationship,
        prepared_by: GenfamiltEditData.prepared_by,
        signature: GenfamiltEditData.signature,
      },
    
    };
    
    try {
          const token = localStorage.getItem("Authorization");
    
          //Readmission PFA API
          const response = await fetch(
            "https://gks-yjdc.onrender.com/api/gen-family/create-gen-family",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `${token}`,
              },
              body: JSON.stringify(payload),
            }
          );
    
          console.log("Gen Family Re admission", payload);
          const result = await response.json();
          console.log("result", result);
    
          if (!response.ok) {
            setIsLoading(false);
            Swal.fire({
              icon: "error",
              title: "Readmission Submission Failed",
              text: result.message || "Server error",
            }).then(() => {
      // This runs after the user clicks "OK"
      // setModal(false);
    });
            return;
          }
          // ✅ Success Case
      setIsLoading(false);
      Swal.fire({
        icon: "success",
        title: "Gen Familt Readmission Created Successfully",
        text: "The Gen Family readmission was submitted successfully.",
      }).then(() => {
      // This runs after the user clicks "OK"
      // setModal(false);
    });
        } catch (error) {
          setIsLoading(false);
          Swal.fire({
            icon: "error",
            title: "Unexpected Error",
            text: "Gen Family Readmission failed! Unknown error occurred.",
          });
        }
  }



  //Get all gen family data
  const [getgenfamData, setgenfamData]=useState([]);
  const [genFilterData, setgenFilterData]=useState([]);

  useEffect(()=>{
    const token = localStorage.getItem("Authorization");

    fetch("https://gks-yjdc.onrender.com/api/gen-family/all-gen-family-entries",{
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`,
      },
    })
    .then((response)=>{
      if(!response.ok) throw new Error("Failed to fetch Gen Family all list details data");
      return response.json();
    })
    .then((res)=>{
      const genfamiltEntries = res.entries || [];
      console.log("genfamily all data", genfamiltEntries)

      const genfamiltallEntriesData = genfamiltEntries.map((list)=>{
        return {
          // gen_fam_id:list.gen_fam_id,
          genFamilyPateintname:list.user.name,
          genFammiltStatus:list.consent.status,
          genfamiltEmail:list.user.email,
          genfamiltNumber:list.user.phone,
          gks_id:list.user.gks_id,

        }
      });

      console.log("genfamiltallEntriesData", genfamiltallEntriesData);
      setTimeout(() => {
        setgenfamData(genfamiltallEntriesData);
        setgenFilterData(genfamiltallEntriesData);
            setstillLoading(false);
      }, 1000);
    })
    .catch((error)=>{
      console.error("Error fetching Gen Family data:", error);
          setstillLoading(true);
    })
  },[])

  return (
    <Fragment>
      {/* Fill general family form start */}
      {/* <Btn attrBtn={{ color: "primary", onClick: getfamiltToggle }}>
        {"General Family Form"}
      </Btn> */}
      <CommonModal
        isOpen={genFamilyModal}
        title={patientPersonalInformation}
        toggler={closeGenFamily}
        maxWidth="1200px"
      >
        <div className="genFamily__wrapper container">
          {/* <h5>{patientPersonalInformation}</h5> */}
          <Form className="theme-form" onSubmit={handleGeneralFamilySubmit}>

            {/*Patient Name and sex/age section*/}
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

            {/* <Form className="theme-form"> */}
            {/*UID*/}
            <div className="row pt-3 pb-3">
              <FormGroup className="form-group row col-md-6">
                <Label className="col-sm-12 col-form-label  col-xl-6">
                  {UID}
                </Label>
                <Col xl="5" sm="12">
                  <div className="input-group">
                    <Input
                      className="form-control"
                      type="text"
                      name="genUID"
                      value={formData.genUID}
                      onChange={onChangeEventHandler}
                    />
                  </div>
                </Col>
              </FormGroup>
              {/*Date of Form Filling फॉर्म भरने की तिथि section/परीक्षण की तारीख :*/}
              <div className="col-md-6">
                <FormGroup className="form-group row">
                  <Label className="col-sm-12 col-form-label  col-xl-6">
                    {dateOfFormFilling}
                  </Label>
                  <Col xl="5" sm="12">
                    <div className="input-group">
                      <DatePicker
                        className="form-control digits"
                        selected={formData.dateOfFormFilling}
                        onChange={(date) =>
                          handleChangeFormFilling("dateOfFormFilling", date)
                        }
                      />
                    </div>
                  </Col>
                </FormGroup>
              </div>
            </div>

            {/*Date of Admission section/प्रवेश की तिथि :*/}
            <div className="row">
              {/*Date of Admission section/प्रवेश की तिथि :*/}
              {/* <div className="col-md-6">
                <FormGroup className="form-group row">
                  <Label className="col-sm-12 col-form-label  col-xl-6">
                    {dateOfAdmission}
                  </Label>
                  <Col xl="5" sm="12">
                    <div className="input-group">
                      <DatePicker
                        className="form-control digits"
                        selected={formData.dateOfAdmission}
                        onChange={(date) =>
                          handleChangeAdmission("dateOfAdmission", date)
                        }
                      />
                    </div>
                  </Col>
                </FormGroup>
              </div> */}

            </div>

            {/*Occupation Status*/}
            <div className="row pt-3 pb-3">
              <div className="col-md-3">
                <Label>{relation}</Label>
                <Input
                  type="text"
                  className="form-control mt-2"
                  placeholder="Enter your occupational status"
                  name="occupational_status"
                  value={formData.occupational_status}
                  onChange={onChangeEventHandler}
                />
              </div>

              {/*Marital Status*/}
              <div className="col-md-3">
                <Label>{marital}</Label>
                <Input
                  type="text"
                  className="form-control mt-2"
                  placeholder="Enter your marital status"
                  name="marital_status"
                  value={formData.marital_status}
                  onChange={onChangeEventHandler}
                />
              </div>

              {/*Living Situation*/}
              <div className="col-md-3">
                <Label>{living}</Label>
                <Input
                  type="text"
                  className="form-control mt-2"
                  placeholder="Enter your living situation"
                  name="living_situation"
                  value={formData.living_situation}
                  onChange={onChangeEventHandler}
                />
              </div>
              {/*Religion*/}
              <div className="col-md-3">
                <Label>{religion}</Label>
                <Input
                  type="text"
                  className="form-control mt-2"
                  placeholder="Enter your your religion"
                  name="your_religion"
                  value={formData.your_religion}
                  onChange={onChangeEventHandler}
                />
              </div>
            </div>


            {/*End Living Situation and Religion*/}
            {/*Substance Use Dependency / नशीले पदार्थ उपयोग निर्भरता */}
            <h5 className="mt-3">{substanceDependency}</h5>
            <div className="row pt-3 pb-3">
              {/*Duration of regular use? / कब से पदार्थ निर्भर हैं? */}
              <div className="col-md-3">
                <Label for="custom-duration">{durationOfRegularUse}</Label>
                <Input
                  type="text"
                  id="custom-duration"
                  name="duration_of_use"
                  value={formData.duration_of_use}
                  onChange={onChangeEventHandler}
                  placeholder="e.g., 2 years, 6 months"
                />
              </div>
              {/*Daily Spent? / दिनमा कितना पदार्थ उपयोग कर रहे हैं? */}
              <div className="col-md-3">
                <Label for="daily-spent">{dailySpentSubstance}</Label>
                <Input
                  type="number"
                  id="daily-spent"
                  name="daily_spent_amount"
                  min="0"
                  step="0.01"
                  value={formData.daily_spent_amount}
                  onChange={onChangeEventHandler}
                  placeholder="Enter amount"
                />
              </div>
              {/*Patient Monthly Income? / महीने में कितना आय हैं? */}
              <div className="col-md-3">
                <Label for="monthly-income">{patienMonthlyIncome}</Label>
                <Input
                  type="number"
                  id="monthly-income"
                  name="patient_monthly_income"
                  min="0"
                  step="100"
                  value={formData.patient_monthly_income}
                  onChange={onChangeEventHandler}
                  placeholder="Enter amount"
                />
              </div>
              {/*Family Monthly Income? / महीने में कितना आय हैं? */}
              <div className="col-md-3">
                <Label for="family-income">{familyMonthlyIncome}</Label>
                <Input
                  type="number"
                  id="family-income"
                  name="family_monthly_income"
                  min="0"
                  step="100"
                  placeholder="Enter amount"
                  value={formData.family_monthly_income}
                  onChange={onChangeEventHandler}
                />
              </div>
            </div>
            {/*End Substance Use Dependency*/}
            {/*Source of money? Kindly mention which are applicable?पैसे का अरैंजमेंट? कृपया बताएं कि कौन से लागू हैं?*/}
            <h5 className="mt-3">{sourceOfMoney}</h5>
            <div className="row pt-3 pb-3 ">
              {moneySources.map((source) => (
                <div key={source.id} className="moneySource col-md-3">
                  <Input
                    type="checkbox"
                    id={source.id}
                    name={source.id}
                    checked={formData[source.id] === "Yes"}
                    className="checkbox_animated"
                    onChange={handleSourceOfMoney}
                  />
                  <Label htmlFor={source.id}>{source.label}</Label>

                  {source.id === "source_any_other" &&
                    formData[source.id] === "Yes" && (
                      <textarea
                        className="form-control mt-2"
                        rows="3"
                        placeholder="Please specify"
                        name="source_other_text"
                        value={formData.source_other_text || ""}
                        onChange={onChangeEventHandler}
                      />
                    )}
                </div>
              ))}
            </div>

            {/*End Source of money? Kindly mention which are applicable?*/}
            {/*Arrangements? / अरैंजमेंट्स?*/}
            <div className="row">
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{Ifarrange}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="family_reaction"
                    value={formData.family_reaction}
                    onChange={onChangeEventHandler}
                  />
                </FormGroup>
              </div>
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{mentionYear}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="first_action_when_known"
                    value={formData.first_action_when_known}
                    onChange={onChangeEventHandler}
                  />
                </FormGroup>
              </div>
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{action}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="pattern_of_use"
                    value={formData.pattern_of_use}
                    onChange={onChangeEventHandler}
                  />
                </FormGroup>
              </div>
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{Residence}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="residence_status_during_use"
                    value={formData.residence_status_during_use}
                    onChange={onChangeEventHandler}
                  />
                </FormGroup>
              </div>
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{experiencedTrauma}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="trauma_experience"
                    value={formData.trauma_experience}
                    onChange={onChangeEventHandler}
                  />
                </FormGroup>
              </div>
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{occurredPatientBehavior}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="behavior_change"
                    value={formData.behavior_change}
                    onChange={onChangeEventHandler}
                  />
                </FormGroup>
              </div>
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{sociality}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="social_circle_change"
                    value={formData.social_circle_change}
                    onChange={onChangeEventHandler}
                  />
                </FormGroup>
              </div>
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{effectOfSubstance}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="life_effect"
                    value={formData.life_effect}
                    onChange={onChangeEventHandler}
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{ChiefComplaint}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="chief_complaints"
                    value={formData.chief_complaints}
                    onChange={onChangeEventHandler}
                  />
                </FormGroup>
              </div>
            </div>
            {/*End Arrangements? / अरैंजमेंट्स?*/}

            {/*Chief Complaint*/}
            <div className="cheif__complaint">
              <div className="table-responsive">
                <h5 className="mt-3 mb-3">{ChiefComplaint}</h5>

                <Table bordered>
                  <thead>
                    <tr>
                      <th scope="col">{TreatmentOfSubstance}</th>
                      <th scope="col">{howManyTimes}</th>
                    </tr>
                    <tr>
                      <th scope="col">{year}</th>
                      <th scope="col">{placeOfTreatment}</th>
                      <th scope="col">{durationOfTime}</th>
                      <th scope="col">{daysOfSobriety}</th>
                      <th scope="col">{cheifAction}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.treatment_records.map((treatment, index) => (
                      <tr key={index}>
                        <td>
                          <Input
                            type="text"
                            name="treatment_year"
                            value={treatment.treatment_year}
                            onChange={(e) =>
                              handleTreatmentInputChange(index, e)
                            }
                            placeholder="Year"
                          />
                        </td>
                        <td>
                          <Input
                            type="text"
                            name="treatment_place"
                            value={treatment.treatment_place}
                            onChange={(e) =>
                              handleTreatmentInputChange(index, e)
                            }
                            placeholder="Place"
                          />
                        </td>
                        <td>
                          <Input
                            type="text"
                            name="treatment_duration"
                            value={treatment.treatment_duration}
                            onChange={(e) =>
                              handleTreatmentInputChange(index, e)
                            }
                            placeholder="Duration"
                          />
                        </td>
                        <td>
                          <Input
                            type="text"
                            name="days_of_sobriety"
                            value={treatment.days_of_sobriety}
                            onChange={(e) =>
                              handleTreatmentInputChange(index, e)
                            }
                            placeholder="Sobriety Days"
                          />
                        </td>
                        <td>
                          {index > 0 && (
                            <Button
                              type="button"
                              className="btn btn-danger"
                              onClick={() => removeTreatmentRow(index)}
                            >
                              Remove
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                <Button type="button" className="btn btn-secondary mt-3 mb-3" onClick={addTreatmentRow}>
                  + Add More
                </Button>
              </div>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{absuingSubstance}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="asked_to_stop"
                  value={formData.asked_to_stop}
                  onChange={onChangeEventHandler}
                />
              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{influenceStop}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="reason_to_stop"
                  value={formData.reason_to_stop}
                  onChange={onChangeEventHandler}
                />
              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{whenStopUsing}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="work_after_stop"
                  value={formData.work_after_stop}
                  onChange={onChangeEventHandler}
                />
              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{itReplaceWhenWhom}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="relapse_details"
                  value={formData.relapse_details}
                  onChange={onChangeEventHandler}
                />
              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{afterRelapse}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="post_relapse_change"
                  value={formData.post_relapse_change}
                  onChange={onChangeEventHandler}
                />
              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{haveDisorder}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="mental_physical_issues"
                  value={formData.mental_physical_issues}
                  onChange={onChangeEventHandler}
                />
              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{isProblmeOrInjury}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="injuries_due_to_substance"
                  value={formData.injuries_due_to_substance}
                  onChange={onChangeEventHandler}
                />
              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{DiagnosedOnTreatment}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="diagnosis_treatment"
                  value={formData.diagnosis_treatment}
                  onChange={onChangeEventHandler}
                />
              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{DoctorPlaceDuration}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="doctor_info"
                  value={formData.doctor_info}
                  onChange={onChangeEventHandler}
                />
              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{ifGone}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="traditional_treatment"
                  value={formData.traditional_treatment}
                  onChange={onChangeEventHandler}
                />
              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{YouFamiliar}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="effect_of_treatment"
                  value={formData.effect_of_treatment}
                  onChange={onChangeEventHandler}
                />
              </FormGroup>
            </div>

            {/*Relationship status: रिलेशनशिप स्टेटस ?: */}
            <div className="row">
              <H5 className="mt-3 mb-3">{relationshipFamilyStatus}</H5>
              <div className="col-md-6">
                <Label htmlFor="marital_status">{relationshipStatus}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="relationship_status"
                  value={formData.relationship_status}
                  onChange={onChangeEventHandler}
                />
                {/* <Input
                  id="marital_status"
                  name="select"
                  type="select"
                  value={selectedRelationshipStatus}
                  onChange={(e) =>
                    setSelectedRelationshipStatus(e.target.value)
                  }
                  className="form-control form-control-primary btn-square"
                >
                  <option value="">Select Marital Status</option>
                  {relationshipOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </Input> */}

                {/* Show text input if 'Other' is selected
                {selectedRelationshipStatus === "other" && (
                  <Input
                    type="textarea"
                    className="form-control mt-2"
                    placeholder="Please specify"
                    value={cutsomRelationshipText}
                    handleChange={(e) =>
                      setcustomRelationshipText(e.target.value)
                    }
                  />
                )} */}
              </div>

              {/*Marriage Arrangement &Since वैवाहिक व्यवस्था और कब से*/}
              <div className="col-md-6">
                <FormGroup className="mb-0">
                  <Label>{MarriageArrangement}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="marriage_arrangement"
                    value={formData.marriage_arrangement}
                    onChange={onChangeEventHandler}
                  />
                </FormGroup>
              </div>

              {/*After marriage life or relationship Status*/}
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{afterMerriageLife}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="post_marriage_status"
                    value={formData.post_marriage_status}
                    onChange={onChangeEventHandler}
                  />
                </FormGroup>
              </div>

              {/*Is there interference of wife's family or any relative in the internal matters of your family. If yes than whom & in which affairs*/}
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{isThereInterference}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="relatives_interference"
                    value={formData.relatives_interference}
                    onChange={onChangeEventHandler}
                  />
                </FormGroup>
              </div>

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
                      {formData.members.map((inter, index) => (
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
                              placeholder="ny physical Disorder & disease कोई भी शारीरिक विकार एवं रोग"
                            />
                          </td>
                          <td>
                            {index > 0 && (
                              <Button
                                type="button"
                                className="btn btn-danger" onClick={() => removeInterferenceRow(index)}
                              >
                                Remove
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  <Button type="button" className="btn btn-secondary mt-4 mb-3" onClick={addInterferenceRow}>
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
                    onChange={onChangeEventHandler}
                  />
                </FormGroup>
              </div>

              {/*FAMILY HISTORY :Drinking, Substance abuse or psychiatric problem?  
पारिवारिक इतिहास: शराब पीना, मादक पदार्थ का प्रयोग या मानसिक समस्या?*/}
              <div className="col-md-12 mb-4">
                <div className="table-responsive">
                  <p className="mt-3 mb-3">{familyHistorySubstanceAbuse}</p>
                  <Table bordered>
                    <thead>
                      <tr>
                        <th>Mother Side</th>
                        <th>Alcohol</th>
                        <th>Drug</th>
                        <th>Psych</th>
                        <th>Father Side</th>
                        <th>Alcohol</th>
                        <th>Drug</th>
                        <th>Psych</th>
                      </tr>
                    </thead>
                    <tbody>
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
                                .grandmother.drug === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "mother_side",
                                "grandmother",
                                "drug",
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
                                .grandmother.drug === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "father_side",
                                "grandmother",
                                "drug",
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
                                .grandfather.drug === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "mother_side",
                                "grandfather",
                                "drug",
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
                                .grandfather.drug === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "father_side",
                                "grandfather",
                                "drug",
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
                                .drug === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "mother_side",
                                "mother",
                                "drug",
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
                                .drug === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "father_side",
                                "father",
                                "drug",
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
                                .drug === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "mother_side",
                                "aunt",
                                "drug",
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
                                .drug === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "father_side",
                                "aunt",
                                "drug",
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
                                .drug === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "mother_side",
                                "uncle",
                                "drug",
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
                                .drug === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "father_side",
                                "uncle",
                                "drug",
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
                      <tr>
                        {/* Mother side */}
                        <td>{anyOtherPlsMention}</td>
                        <td colSpan={3}>
                          <Input
                            type="text"
                            placeholder="If any from mother side"
                            name="mother_side_if_any"
                            value={
                              formData.family_history_data.mother_side
                                .mother_side_if_any
                            }
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                family_history_data: {
                                  ...prev.family_history_data,
                                  mother_side: {
                                    ...prev.family_history_data.mother_side,
                                    mother_side_if_any: e.target.value,
                                  },
                                },
                              }))
                            }
                          />
                        </td>
                        {/* Father side */}
                        <td>{anyOtherPlsMention}</td>
                        <td colSpan={3}>
                          <Input
                            type="text"
                            placeholder="If any from father side"
                            name="father_side_if_any"
                            value={
                              formData.family_history_data.father_side
                                .father_side_if_any
                            }
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                family_history_data: {
                                  ...prev.family_history_data,
                                  father_side: {
                                    ...prev.family_history_data.father_side,
                                    father_side_if_any: e.target.value,
                                  },
                                },
                              }))
                            }
                          />
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              </div>

              {/*Current Status? वर्तमान स्थिति?*/}
              <div className="col-md-12 mt-3">
                <Label>{anyOtherPlsMention1}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="psych_problem_desc"
                  value={formData.psych_problem_desc}
                  onChange={onChangeEventHandler}
                />
              </div>

              {/*Current Status? वर्तमान स्थिति?*/}
              
              <div className="col-md-12 mt-3 mb-3">
                 <Label>{currentStatus}</Label>
                {/* <Input
                  className="form-control form-control-primary btn-square"
                  name="select"
                  type="select"
                  onChange={(e) => setcurrentStatusData(e.target.value)}
                >
                  <option value="">{currentStatus}</option>
                  {currentstatusObject.map((status, index) => (
                    <option key={index} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </Input>
                {currentStatusData === "Other" && (
                  <Input
                    type="textarea"
                    className="form-control mt-2"
                    rows="3"
                    placeholder="Please specify"
                    value={customeCurrentStatus}
                    onChange={(e) => setcustomeCurrentStatus(e.target.value)}
                  />
                )} */}
                <Input
                  type="text"
                  name="current_status"
                  className="form-control"
                  value={formData.current_status}
                  onChange={onChangeEventHandler}
                />
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{howWasBonding}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="relationship_with_user"
                    value={formData.relationship_with_user}
                    onChange={onChangeEventHandler}
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{familyBehaviorPatient}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="family_behavior"
                    value={formData.family_behavior}
                    onChange={onChangeEventHandler}
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{monitoringFamily}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="head_of_family"
                    value={formData.head_of_family}
                    onChange={onChangeEventHandler}
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{ralationshipFamilyMember}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="relationships_with_family"
                    value={formData.relationships_with_family}
                    onChange={onChangeEventHandler}
                  />
                </FormGroup>
              </div>

              {/* Childhood /बचपन */}

              <H5 className="mt-3 mb-3">{childhood}</H5>
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{birthConditions}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="birth_conditions"
                    value={formData.childhood_history.birth_conditions}
                    onChange={childhoodHandleChange}
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{parentingHistory}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="parenting_history"
                    value={formData.childhood_history.parenting_history}
                    onChange={childhoodHandleChange}
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{wasThereAnyConflict}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="family_conflict"
                    value={formData.childhood_history.family_conflict}
                    onChange={childhoodHandleChange}
                  />
                </FormGroup>
              </div>

              {/*Sociality  where born & Living?
सामाजिकता जहां पैदा हुआ और रहा  है?*/}
              <div className="col-md-12">
                <Label htmlFor="birthPlace">{socialityWhere}</Label>
                <Input
                  type="text"
                  id="birthPlace"
                  name="sociality_living"
                  value={formData.childhood_history.sociality_living}
                  onChange={childhoodHandleChange}
                  placeholder="Enter birth place..."
                />

                <br />
                <Label htmlFor="birthPlace">{highRiskBehavior}</Label>
                <Input
                  type="text"
                  id="currentLocation"
                  name="high_risk_behavior"
                  value={formData.childhood_history.high_risk_behavior}
                  onChange={childhoodHandleChange}
                  placeholder="Enter current location..."
                />
              </div>

              <div className="col-md-12 mt-3 mb-3">
                <FormGroup className="mb-0">
                  <Label>{whatWasImpect}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="impact_of_movies"
                    value={formData.childhood_history.impact_of_movies}
                    onChange={childhoodHandleChange}
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{hasAnyoneEverAbused}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="abuse_history"
                    value={formData.childhood_history.abuse_history}
                    onChange={childhoodHandleChange}
                  />
                </FormGroup>
              </div>

              {/* Academics Occupational Details Start */}

              {/*Academics Occupational Details/ शैक्षणिक व्यावसायिक विवरण*/}
              <H5 className="mt-3 mb-3">{academicsOccupationalDetails}</H5>
              <div className="col-md-6">
                <Label htmlFor="educationStatus">{EducationStatus}</Label>
                {/* <Input
                  id="educationStatus"
                  className="form-control form-control-primary btn-square"
                  name="select"
                  type="select"
                  value={educationStatus.selectedStatus}
                  onChange={handleEducationalSelectChange}
                >
                  <option value="">-- Select --</option>
                  {educationOptions.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </Input>
                {educationStatus.selectedStatus === "Other / अन्य" && (
                  <div>
                    <Label htmlFor="otherEducation">
                      Specify Other / अन्य बताएं:
                    </Label>
                    <Input
                      type="textarea"
                      id="otherEducation"
                      value={educationStatus.otherEducation}
                      onChange={handleEducationalOtherEducationChange}
                      placeholder="Enter education status"
                    />
                  </div>
                )} */}
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="education_status"
                  value={formData.education_employment.education_status}
                  onChange={academicOccupationHandler}
                />
              </div>

              {/*Occupational status? कार्य की स्थिति?*/}
              <div className="col-md-6">
                <Label htmlFor="occupation">{OcuStatus}</Label>
                {/* <Input
                  id="occupation"
                  className="form-control form-control-primary btn-square"
                  name="select"
                  type="select"
                  value={OccupationalStatus.selectedStatus}
                  onChange={handleOccupationalSelectChange}
                >
                  <option value="">-- Select --</option>
                  {occupationOptions.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </Input>
                {OccupationalStatus.selectedStatus === "Other / अन्य" && (
                  <div>
                    <Label htmlFor="other Occupational">
                      Specify Other / अन्य बताएं:
                    </Label>
                    <Input
                      type="textarea"
                      id="otherEducation"
                      value={OccupationalStatus.otherOccupational}
                      onChange={handleOccupationalOtherEducationChange}
                      placeholder="Enter occupational status"
                    />
                  </div>
                )} */}
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="occupation_status"
                  value={formData.education_employment.occupation_status}
                  onChange={academicOccupationHandler}
                />
              </div>

              {/*If dropout what is the reason यदि ड्रॉपआउट हुआ तो क्या कारण है?*/}
              <div className="col-md-12 mt-3">
                <FormGroup className="mb-0">
                  <Label>{ifDropout}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="dropout_reason"
                    value={formData.education_employment.dropout_reason}
                    onChange={academicOccupationHandler}
                  />
                </FormGroup>
              </div>

              {/*Study/Work Details: (what was job frequency)  /अध्ययन/कार्य विवरण: (नौकरी की फ्रीक्वेंसी क्या थी?)*/}
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{studyWorkDetails}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="work_details"
                    value={formData.education_employment.work_details}
                    onChange={academicOccupationHandler}
                  />
                </FormGroup>
              </div>

              {/*Hobbies : शौक:*/}
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{Hobbies1}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="hobbies"
                    value={formData.education_employment.hobbies}
                    onChange={academicOccupationHandler}
                  />
                </FormGroup>
              </div>

              {/*Extra skills if any: अतिरिक्त कौशल कोई हो:*/}
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{extraSkills}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="skills"
                    value={formData.education_employment.skills}
                    onChange={academicOccupationHandler}
                  />
                </FormGroup>
              </div>

              {/*Achievement in life: जीवन में कोई उपलब्धि:
               */}
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{achievemntInLife}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="achievements"
                    value={formData.education_employment.achievements}
                    onChange={academicOccupationHandler}
                  />
                </FormGroup>
              </div>

              {/* Academics Occupational Details End */}

              {/* Social Behavior Start */}
              {/* Social Behavior / सामाजिक व्यवहार */}
              <H5 className="mt-3 mb-3">{socialBehavior}</H5>
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{socialBehavior1}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="social_behavior"
                    value={formData.social_behavior.social_behavior}
                    onChange={socialBehaviorHandler}
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
                    value={formData.social_behavior.with_whom_spend_time}
                    onChange={socialBehaviorHandler}
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
                    name="number_of_friends"
                    value={formData.social_behavior.number_of_friends}
                    onChange={socialBehaviorHandler}
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
                    name="friends_social_status"
                    value={formData.social_behavior.friends_social_status}
                    onChange={socialBehaviorHandler}
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
                    name="substance_dependent_friends"
                    value={formData.social_behavior.substance_dependent_friends}
                    onChange={socialBehaviorHandler}
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
                    value={formData.social_behavior.well_wisher_person}
                    onChange={socialBehaviorHandler}
                  />
                </FormGroup>
              </div>

              {/* Social Behavior End */}

              {/* Legal History Start */}
              {/* Legal History / लीगल इतिहास */}
              <H5 className="mt-3 mb-3">{legalHistory}</H5>
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{domesticViolence}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="domestic_violence"
                    value={formData.legal_history.domestic_violence}
                    onChange={legalHistoryHandler}
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{reasonBehindDomesticViolence}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="violence_reason"
                    value={formData.legal_history.violence_reason}
                    onChange={legalHistoryHandler}
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{drugStatus}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="drug_status_qty"
                    value={formData.legal_history.drug_status_qty}
                    onChange={legalHistoryHandler}
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{ifThereIsAnyCriminalCase}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="criminal_case"
                    value={formData.legal_history.criminal_case}
                    onChange={legalHistoryHandler}
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{specificCaseDetails}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="case_details"
                    value={formData.legal_history.case_details}
                    onChange={legalHistoryHandler}
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{currentCaseStatus}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="case_status"
                    value={formData.legal_history.case_status}
                    onChange={legalHistoryHandler}
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{ifWentToJail}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="jail_duration"
                    value={formData.legal_history.jail_duration}
                    onChange={legalHistoryHandler}
                  />
                </FormGroup>
              </div>

              {/* Legal History End */}

              {/* Patient behavior Start */}
              {/* Patient behavior / रोगी का व्यवहार */}

              <H5 className="mt-3 mb-3">{patientBeh}</H5>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{whatIsTheMostImportantThing}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="life_priority"
                    value={formData.patient_behavior.life_priority}
                    onChange={onChangeEventHandler}
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{lifeAim}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="life_aim"
                    value={formData.patient_behavior.life_aim}
                    onChange={onChangeEventHandler}
                  />
                </FormGroup>
              </div>

              <H5 className="mt-3 mb-3">{patientBehavior}</H5>
              <div className="col-md-12 table-responsive">
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>{tableNumber}</th>
                      <th>{patientBehavior}</th>
                      <th>{yes}</th>
                      <th>{no}</th>
                    </tr>
                  </thead>
                  <tbody>
                  {patientBehaviorFormattedList.map(({ key, label }, index) => {
  return (
    <tr key={key}>
      <td>{index + 1}</td>
      <td className="w-75">{label}</td>
      {["Yes", "No"].map((value) => {
        const inputId = `patientBehavior_${key}_${value}`;
        return (
          <td key={inputId} className="radio radio-primary">
            <Input
              id={inputId}
              type="radio"
              name={`patientBehavior_${key}`}
              value={value}
              checked={GenfamiltEditData?.patient_behavior?.[key] === value}
              onChange={() =>
                setGenfamilyEditData((prev) => ({
                  ...prev,
                  patient_behavior: {
                    ...prev.patient_behavior,
                    [key]: value,
                  },
                }))
              }
            />
            <Label htmlFor={inputId}>{value}</Label>
          </td>
        );
      })}
    </tr>
  );
})}

                  </tbody>
                </table>
              </div>

              <div className="col-md-12 mt-3 mb-3">
                <div className="checkbox ms-3">
                  <Input
                    id="checkbox1"
                    type="checkbox"
                    checked={formData.consent === "Yes"}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        consent: e.target.checked ? "Yes" : "No",
                      }))
                    }
                  />
                  <Label className="text-muted" for="checkbox1">
                    {consent}
                  </Label>
                </div>
              </div>

              {/*Content section start*/}
              <div className="row mt-3 mb-3">
                <div className="col-md-4">
                  <Label>{name}</Label>
                  <Input
                    type="text"
                    placeholder="Name"
                    name="consent_name"
                    value={formData.consent_name}
                    onChange={onChangeEventHandler}
                  />
                </div>
                <div className="col-md-4">
                  <Label>{relationship}</Label>
                  <Input
                    type="text"
                    placeholder="Relationship"
                    name="relationship"
                    value={formData.relationship}
                    onChange={onChangeEventHandler}
                  />
                </div>
                <div className="col-md-4">
                  <Label>{signature}</Label>
                  <Input
                    type="text"
                    placeholder="Signature"
                    name="signature"
                    value={formData.signature}
                    onChange={onChangeEventHandler}
                  />
                </div>
                <div className="col-md-12 mt-3 mb-3">
                  <Label>{prepared}</Label>
                  <Input
                    type="text"
                    placeholder="Prepared By"
                    name="prepared_by"
                    value={formData.prepared_by}
                    onChange={onChangeEventHandler}
                  />
                </div>
              </div>
              {/* Submit */}
              <div className="col-md-12 mb-4">
                <Button color="primary" type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    ></span>
                  ) : (
                    "Submit PFA"
                  )}
                </Button>
              </div>
            </div>
          </Form>
        </div>
      </CommonModal>
      {/* Fill general family form end */}

      {/* Showing user list data list by register start */}
      <Container fluid={true} className="datatables">
        <Row>
          <Col sm="12">
            <CardBody>
              <Card>
                {/* <HeaderCard title="User Data Table with Multiple Selection" /> */}
                <CardBody>
                  <div class="d-flex pb-2 justify-content-between">
                    <HeaderCard title="General Family Form" className="p-0" />
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
                      selectableRowDisabled={selectableRowDisabled}
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
      {/* Showing user list data list by register end */}



      {/* Showing all gen family data start */}
      <Container fluid={true} className="datatables">
        <Row>
          <Col sm="12">
            <CardBody>
              <Card>
                {/* <HeaderCard title="User Data Table with Multiple Selection" /> */}
                <CardBody>
                  <div class="d-flex pb-2 justify-content-between">
                    <HeaderCard title="Showing All Gen Family Data" className="p-0" />
                  </div>
                  <div className="row pb-2">
                    <div className="col-md-4">
                      <InputGroup>
                        <Input
                          className="form-control"
                          type="text"
                          placeholder="Search......."
                          value={searchgenText}
                          onChange={handleSearchGenFamily}
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
                      data={genFilterData}
                      columns={tableGenFamilyListColumns}
                      striped
                      center
                      highlightOnHover
                      pagination
                      persistTableHead
                      // onSelectedRowsChange={handleRowSelected}
                      selectableRowDisabled={selectableRowDisabled}
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
      {/* Showing all gen family data end */}



      {/* View Gen Family Data Modal start */}
      <CommonModal
        isOpen={viewGenFamilyModel}
        title={patientPersonalInformation}
        toggler={closeGenFamily}
        maxWidth="1200px"
      >
        <div className="genFamily__wrapper container">
          <h5>{patientPersonalInformation}</h5>
          {isLoading ? (
            <tr>
              <td colSpan="2" className="text-center">
                <div className="loader-box">
                  <Spinner
                    className={
                      selectedSpinner?.spinnerClass ||
                      "spinner-border"
                    }
                  />
                </div>
              </td>
            </tr>
          ) : viewgenData ? (
            <Form className="theme-form">
              {console.log("viewgenData ", viewgenData)}
              {/*UID*/}
              <div className="row">
                <FormGroup className="form-group row col-md-12">
                  <Label className="col-sm-12 col-form-label  col-xl-6">
                    {UID}
                  </Label>
                  <Col xl="5" sm="12">
                    <div className="input-group">
                      <Input
                        className="form-control"
                        type="text"
                        name="genUID"
                        value={viewgenData.gen_family.uid}
                      // onChange={onChangeEventHandler}
                      />
                    </div>
                  </Col>
                </FormGroup>
              </div>

              {/*Date of Admission section/प्रवेश की तिथि :*/}
              <div className="row">
                {/*Date of Admission section/प्रवेश की तिथि :*/}
                {/* <div className="col-md-6">
                <FormGroup className="form-group row">
                  <Label className="col-sm-12 col-form-label  col-xl-6">
                    {dateOfAdmission}
                  </Label>
                  <Col xl="5" sm="12">
                    <div className="input-group">
                      <DatePicker
                        className="form-control digits"
                        selected={formData.dateOfAdmission}
                        onChange={(date) =>
                          handleChangeAdmission("dateOfAdmission", date)
                        }
                      />
                      {new Date(
                                viewgenData.gen_family.form_fill_date
                              ).toLocaleDateString()}
                    </div>
                  </Col>
                </FormGroup>
              </div> */}
                {/*Date of Form Filling फॉर्म भरने की तिथि section/परीक्षण की तारीख :*/}
                <div className="col-md-6">
                  <FormGroup className="form-group row">
                    <Label className="col-sm-12 col-form-label  col-xl-6">
                      {dateOfFormFilling}
                    </Label>
                    <Col xl="5" sm="12">
                      <div className="input-group">
                        {/* <DatePicker
                        className="form-control digits"
                        selected={formData.dateOfFormFilling}
                        onChange={(date) =>
                          handleChangeFormFilling("dateOfFormFilling", date)
                        }
                      /> */}
                        {new Date(
                          viewgenData.gen_family.form_fill_date
                        ).toLocaleDateString()}
                      </div>
                    </Col>
                  </FormGroup>
                </div>
              </div>
              {/*Patient Name and sex/age section*/}
              <PatientCommonInfo
                selectedUser={selectedUser}
                labels={{
                  name: "प्रयासक का नाम :",
                  sex: "प्रयासक का लिंग :",
                  age: "प्रयासक का उम्र :",
                  date_of_admission: "प्रवेश की तिथि:",
                  ageValue: patientCalAge,
                }}
              />
              {/*Occupation Status*/}
              <div className="row">
                <div className="col-md-6">
                  <Label>{relation}</Label>
                  <Input
                    type="text"
                    className="form-control mt-2"
                    placeholder="Enter your occupational status"
                    name="occupational_status"
                    value={viewgenData.gen_family.occupational_status}
                  // onChange={onChangeEventHandler}
                  />
                </div>

                {/*Marital Status*/}
                <div className="col-md-6">
                  <Label>{marital}</Label>
                  <Input
                    type="text"
                    className="form-control mt-2"
                    placeholder="Enter your marital status"
                    name="marital_status"
                    value={viewgenData.gen_family.marital_status}
                  // onChange={onChangeEventHandler}
                  />
                </div>
              </div>

              {/*Living Situation and Religion*/}
              <div className="row">
                {/*Living Situation*/}
                <div className="col-md-6">
                  <Label>{living}</Label>
                  <Input
                    type="text"
                    className="form-control mt-2"
                    placeholder="Enter your living situation"
                    name="living_situation"
                    value={viewgenData.gen_family.living_situation}
                  // onChange={onChangeEventHandler}
                  />
                </div>
                {/*Religion*/}
                <div className="col-md-6">
                  <Label>{religion}</Label>
                  <Input
                    type="text"
                    className="form-control mt-2"
                    placeholder="Enter your your religion"
                    name="your_religion"
                    value={viewgenData.gen_family.religion}
                  // onChange={onChangeEventHandler}
                  />
                </div>
              </div>
              {/*End Living Situation and Religion*/}
              {/*Substance Use Dependency / नशीले पदार्थ उपयोग निर्भरता */}
              <H5>{substanceDependency}</H5>
              <div className="row">
                {/*Duration of regular use? / कब से पदार्थ निर्भर हैं? */}
                <div className="col-md-6">
                  <Label for="custom-duration">{durationOfRegularUse}</Label>
                  <Input
                    type="text"
                    id="custom-duration"
                    name="duration_of_use"
                    value={viewgenData.substance_use_dependency.duration_of_use}
                    // onChange={onChangeEventHandler}
                    placeholder="e.g., 2 years, 6 months"
                  />
                </div>
                {/*Daily Spent? / दिनमा कितना पदार्थ उपयोग कर रहे हैं? */}
                <div className="col-md-6">
                  <Label for="daily-spent">{dailySpentSubstance}</Label>
                  <Input
                    type="number"
                    id="daily-spent"
                    name="daily_spent_amount"
                    min="0"
                    step="0.01"
                    value={viewgenData.substance_use_dependency.daily_spent_amount}
                    // onChange={onChangeEventHandler}
                    placeholder="Enter amount"
                  />
                </div>
                {/*Patient Monthly Income? / महीने में कितना आय हैं? */}
                <div className="col-md-6">
                  <Label for="monthly-income">{patienMonthlyIncome}</Label>
                  <Input
                    type="number"
                    id="monthly-income"
                    name="patient_monthly_income"
                    min="0"
                    step="100"
                    value={viewgenData.substance_use_dependency.patient_monthly_income}
                    // onChange={onChangeEventHandler}
                    placeholder="Enter amount"
                  />
                </div>
                {/*Family Monthly Income? / महीने में कितना आय हैं? */}
                <div className="col-md-6">
                  <Label for="family-income">{familyMonthlyIncome}</Label>
                  <Input
                    type="number"
                    id="family-income"
                    name="family_monthly_income"
                    min="0"
                    step="100"
                    placeholder="Enter amount"
                    value={viewgenData.substance_use_dependency.family_monthly_income}
                  // onChange={onChangeEventHandler}
                  />
                </div>
              </div>
              {/*End Substance Use Dependency*/}
              {/*Source of money? Kindly mention which are applicable?पैसे का अरैंजमेंट? कृपया बताएं कि कौन से लागू हैं?*/}
              <H5>{sourceOfMoney}</H5>
              <div className="row">
                <ul>
                  {moneySources.map((source) => {
                    const value = viewgenData.substance_use_dependency?.[source.id] || "No";

                    return (
                      <li key={source.id}>
                        {source.label}: <strong>{value}</strong>

                        {source.id === "source_any_other" &&
                          value === "Yes" &&
                          viewgenData.substance_use_dependency?.source_other_text && (
                            <div className="mt-2">
                              <strong>Other:</strong> {viewgenData.substance_use_dependency.source_other_text}
                            </div>
                          )}
                      </li>
                    );
                  })}
                </ul>




              </div>


              {/*End Source of money? Kindly mention which are applicable?*/}
              {/*Arrangements? / अरैंजमेंट्स?*/}
              <div className="row">
                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{Ifarrange}</Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      rows="3"
                      name="family_reaction"
                      value={viewgenData.substance_use_dependency.family_reaction}
                    // onChange={onChangeEventHandler}
                    />
                  </FormGroup>
                </div>
                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{mentionYear}</Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      rows="3"
                      name="first_action_when_known"
                      value={viewgenData.substance_use_dependency.first_action_when_known}
                    // onChange={onChangeEventHandler}
                    />
                  </FormGroup>
                </div>
                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{action}</Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      rows="3"
                      name="pattern_of_use"
                      value={viewgenData.substance_use_dependency.pattern_of_use}
                    // onChange={onChangeEventHandler}
                    />
                  </FormGroup>
                </div>
                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{Residence}</Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      rows="3"
                      name="residence_status_during_use"
                      value={viewgenData.substance_use_dependency.residence_status_during_use}
                    // onChange={onChangeEventHandler}
                    />
                  </FormGroup>
                </div>
                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{experiencedTrauma}</Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      rows="3"
                      name="trauma_experience"
                      value={viewgenData.substance_use_dependency.trauma_experience}
                    // onChange={onChangeEventHandler}
                    />
                  </FormGroup>
                </div>
                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{occurredPatientBehavior}</Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      rows="3"
                      name="behavior_change"
                      value={viewgenData.substance_use_dependency.behavior_change}
                    // onChange={onChangeEventHandler}
                    />
                  </FormGroup>
                </div>
                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{sociality}</Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      rows="3"
                      name="social_circle_change"
                      value={viewgenData.substance_use_dependency.social_circle_change}
                    // onChange={onChangeEventHandler}
                    />
                  </FormGroup>
                </div>
                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{effectOfSubstance}</Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      rows="3"
                      name="life_effect"
                      value={viewgenData.substance_use_dependency.life_effect}
                    // onChange={onChangeEventHandler}
                    />
                  </FormGroup>
                </div>

                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{ChiefComplaint}</Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      rows="3"
                      name="chief_complaints"
                      value={viewgenData.treatment_history.chief_complaints}
                    // onChange={onChangeEventHandler}
                    />
                  </FormGroup>
                </div>
              </div>
              {/*End Arrangements? / अरैंजमेंट्स?*/}

              {/*Chief Complaint*/}
              <div className="cheif__complaint">
                <div className="table-responsive">
                  <H5>{ChiefComplaint}</H5>

                  <Table bordered>
                    <thead>
                      <tr>
                        <th scope="col">{TreatmentOfSubstance}</th>
                        <th scope="col">{howManyTimes}</th>
                      </tr>
                      <tr>
                        <th scope="col">{year}</th>
                        <th scope="col">{placeOfTreatment}</th>
                        <th scope="col">{durationOfTime}</th>
                        <th scope="col">{daysOfSobriety}</th>
                        <th scope="col">{cheifAction}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {
                        console.log(viewgenData?.treatment_history?.treatment_records)
                      }
                      {Array.isArray(viewgenData?.treatment_history?.treatment_records) ? (
                        viewgenData.treatment_history.treatment_records.map((treatment, index) => (
                          <tr key={index}>
                            <td>{treatment.treatment_year}</td>
                            <td>{treatment.treatment_place}</td>
                            <td>{treatment.treatment_duration}</td>
                            <td>{treatment.days_of_sobriety}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center">
                            No treatment records available.
                          </td>
                        </tr>
                      )}
                    </tbody>

                  </Table>



                </div>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{absuingSubstance}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="asked_to_stop"
                    value={formData.asked_to_stop}
                    onChange={onChangeEventHandler}
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{influenceStop}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="reason_to_stop"
                    value={formData.reason_to_stop}
                    onChange={onChangeEventHandler}
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{whenStopUsing}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="work_after_stop"
                    value={formData.work_after_stop}
                    onChange={onChangeEventHandler}
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{itReplaceWhenWhom}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="relapse_details"
                    value={formData.relapse_details}
                    onChange={onChangeEventHandler}
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{afterRelapse}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="post_relapse_change"
                    value={formData.post_relapse_change}
                    onChange={onChangeEventHandler}
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{haveDisorder}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="mental_physical_issues"
                    value={formData.mental_physical_issues}
                    onChange={onChangeEventHandler}
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{isProblmeOrInjury}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="injuries_due_to_substance"
                    value={formData.injuries_due_to_substance}
                    onChange={onChangeEventHandler}
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{DiagnosedOnTreatment}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="diagnosis_treatment"
                    value={formData.diagnosis_treatment}
                    onChange={onChangeEventHandler}
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{DoctorPlaceDuration}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="doctor_info"
                    value={formData.doctor_info}
                    onChange={onChangeEventHandler}
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{ifGone}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="traditional_treatment"
                    value={formData.traditional_treatment}
                    onChange={onChangeEventHandler}
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{YouFamiliar}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="effect_of_treatment"
                    value={formData.effect_of_treatment}
                    onChange={onChangeEventHandler}
                  />
                </FormGroup>
              </div>

              {/*Relationship status: रिलेशनशिप स्टेटस ?: */}
              <div className="row">
                <H5>{relationshipFamilyStatus}</H5>
                <div className="col-md-6">
                  <Label htmlFor="marital_status">{relationshipStatus}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="relationship_status"
                    value={formData.relationship_status}
                    onChange={onChangeEventHandler}
                  />
                  {/* <Input
                  id="marital_status"
                  name="select"
                  type="select"
                  value={selectedRelationshipStatus}
                  onChange={(e) =>
                    setSelectedRelationshipStatus(e.target.value)
                  }
                  className="form-control form-control-primary btn-square"
                >
                  <option value="">Select Marital Status</option>
                  {relationshipOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </Input> */}

                  {/* Show text input if 'Other' is selected
                {selectedRelationshipStatus === "other" && (
                  <Input
                    type="textarea"
                    className="form-control mt-2"
                    placeholder="Please specify"
                    value={cutsomRelationshipText}
                    handleChange={(e) =>
                      setcustomRelationshipText(e.target.value)
                    }
                  />
                )} */}
                </div>

                {/*Marriage Arrangement &Since वैवाहिक व्यवस्था और कब से*/}
                <div className="col-md-6">
                  <FormGroup className="mb-0">
                    <Label>{MarriageArrangement}</Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      rows="3"
                      name="marriage_arrangement"
                      value={formData.marriage_arrangement}
                      onChange={onChangeEventHandler}
                    />
                  </FormGroup>
                </div>

                {/*After marriage life or relationship Status*/}
                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{afterMerriageLife}</Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      rows="3"
                      name="post_marriage_status"
                      value={formData.post_marriage_status}
                      onChange={onChangeEventHandler}
                    />
                  </FormGroup>
                </div>

                {/*Is there interference of wife's family or any relative in the internal matters of your family. If yes than whom & in which affairs*/}
                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{isThereInterference}</Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      rows="3"
                      name="relatives_interference"
                      value={formData.relatives_interference}
                      onChange={onChangeEventHandler}
                    />
                  </FormGroup>
                </div>

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
                        </tr>
                      </thead>
                      <tbody>
                        {formData.members.map((inter, index) => (
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
                                placeholder="ny physical Disorder & disease कोई भी शारीरिक विकार एवं रोग"
                              />
                            </td>
                            <td>
                              {index > 0 && (
                                <button
                                  type="button"
                                  onClick={() => interfrenceremoveRow(index)}
                                >
                                  Remove
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>

                    <button type="button" onClick={interfrenceaddRow}>
                      + Add More
                    </button>
                  </div>

                  <FormGroup className="mb-0">
                    <Label>{ifAnyDisorder}</Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      rows="3"
                      name="disorder_desc"
                      value={formData.disorder_desc}
                      onChange={onChangeEventHandler}
                    />
                  </FormGroup>
                </div>

                {/*FAMILY HISTORY :Drinking, Substance abuse or psychiatric problem?  
पारिवारिक इतिहास: शराब पीना, मादक पदार्थ का प्रयोग या मानसिक समस्या?*/}
                <div className="col-md-12">
                  <div className="table-responsive">
                    {familyHistorySubstanceAbuse}
                    <Table bordered>
                      <thead>
                        <tr>
                          <th>Mother Side</th>
                          <th>Alcohol</th>
                          <th>Drug</th>
                          <th>Psych</th>
                          <th>Father Side</th>
                          <th>Alcohol</th>
                          <th>Drug</th>
                          <th>Psych</th>
                        </tr>
                      </thead>
                      <tbody>
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
                                  .grandmother.drug === "Yes"
                              }
                              onChange={(e) =>
                                handleFamilyHistoryChange(
                                  "mother_side",
                                  "grandmother",
                                  "drug",
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
                                  .grandmother.drug === "Yes"
                              }
                              onChange={(e) =>
                                handleFamilyHistoryChange(
                                  "father_side",
                                  "grandmother",
                                  "drug",
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
                                  .grandfather.drug === "Yes"
                              }
                              onChange={(e) =>
                                handleFamilyHistoryChange(
                                  "mother_side",
                                  "grandfather",
                                  "drug",
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
                                  .grandfather.drug === "Yes"
                              }
                              onChange={(e) =>
                                handleFamilyHistoryChange(
                                  "father_side",
                                  "grandfather",
                                  "drug",
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
                                  .drug === "Yes"
                              }
                              onChange={(e) =>
                                handleFamilyHistoryChange(
                                  "mother_side",
                                  "mother",
                                  "drug",
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
                                  .drug === "Yes"
                              }
                              onChange={(e) =>
                                handleFamilyHistoryChange(
                                  "father_side",
                                  "father",
                                  "drug",
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
                                  .drug === "Yes"
                              }
                              onChange={(e) =>
                                handleFamilyHistoryChange(
                                  "mother_side",
                                  "aunt",
                                  "drug",
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
                                  .drug === "Yes"
                              }
                              onChange={(e) =>
                                handleFamilyHistoryChange(
                                  "father_side",
                                  "aunt",
                                  "drug",
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
                                  .drug === "Yes"
                              }
                              onChange={(e) =>
                                handleFamilyHistoryChange(
                                  "mother_side",
                                  "uncle",
                                  "drug",
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
                                  .drug === "Yes"
                              }
                              onChange={(e) =>
                                handleFamilyHistoryChange(
                                  "father_side",
                                  "uncle",
                                  "drug",
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
                        <tr>
                          {/* Mother side */}
                          <td>{anyOtherPlsMention}</td>
                          <td colSpan={3}>
                            <Input
                              type="text"
                              placeholder="If any from mother side"
                              name="mother_side_if_any"
                              value={
                                formData.family_history_data.mother_side
                                  .mother_side_if_any
                              }
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  family_history_data: {
                                    ...prev.family_history_data,
                                    mother_side: {
                                      ...prev.family_history_data.mother_side,
                                      mother_side_if_any: e.target.value,
                                    },
                                  },
                                }))
                              }
                            />
                          </td>
                          {/* Father side */}
                          <td>{anyOtherPlsMention}</td>
                          <td colSpan={3}>
                            <Input
                              type="text"
                              placeholder="If any from father side"
                              name="father_side_if_any"
                              value={
                                formData.family_history_data.father_side
                                  .father_side_if_any
                              }
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  family_history_data: {
                                    ...prev.family_history_data,
                                    father_side: {
                                      ...prev.family_history_data.father_side,
                                      father_side_if_any: e.target.value,
                                    },
                                  },
                                }))
                              }
                            />
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                  </div>
                </div>

                {/*Current Status? वर्तमान स्थिति?*/}
                <div className="col-md-12">
                  <Label>{anyOtherPlsMention1}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="psych_problem_desc"
                    value={formData.psych_problem_desc}
                    onChange={onChangeEventHandler}
                  />
                </div>

                {/*Current Status? वर्तमान स्थिति?*/}
                <div className="col-md-12">
                  <Label>{currentStatus}</Label>
                </div>
                <div className="col-md-12">
                  {/* <Input
                  className="form-control form-control-primary btn-square"
                  name="select"
                  type="select"
                  onChange={(e) => setcurrentStatusData(e.target.value)}
                >
                  <option value="">{currentStatus}</option>
                  {currentstatusObject.map((status, index) => (
                    <option key={index} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </Input>
                {currentStatusData === "Other" && (
                  <Input
                    type="textarea"
                    className="form-control mt-2"
                    rows="3"
                    placeholder="Please specify"
                    value={customeCurrentStatus}
                    onChange={(e) => setcustomeCurrentStatus(e.target.value)}
                  />
                )} */}
                  <Input
                    type="text"
                    name="current_status"
                    className="form-control"
                    value={formData.current_status}
                    onChange={onChangeEventHandler}
                  />
                </div>

                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{howWasBonding}</Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      rows="3"
                      name="relationship_with_user"
                      value={formData.relationship_with_user}
                      onChange={onChangeEventHandler}
                    />
                  </FormGroup>
                </div>

                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{familyBehaviorPatient}</Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      rows="3"
                      name="family_behavior"
                      value={formData.family_behavior}
                      onChange={onChangeEventHandler}
                    />
                  </FormGroup>
                </div>

                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{monitoringFamily}</Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      rows="3"
                      name="head_of_family"
                      value={formData.head_of_family}
                      onChange={onChangeEventHandler}
                    />
                  </FormGroup>
                </div>

                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{ralationshipFamilyMember}</Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      rows="3"
                      name="relationships_with_family"
                      value={formData.relationships_with_family}
                      onChange={onChangeEventHandler}
                    />
                  </FormGroup>
                </div>

                {/* Childhood /बचपन */}

                <H5>{childhood}</H5>
                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{birthConditions}</Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      rows="3"
                      name="birth_conditions"
                      value={formData.childhood_history.birth_conditions}
                      onChange={childhoodHandleChange}
                    />
                  </FormGroup>
                </div>

                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{parentingHistory}</Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      rows="3"
                      name="parenting_history"
                      value={formData.childhood_history.parenting_history}
                      onChange={childhoodHandleChange}
                    />
                  </FormGroup>
                </div>

                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{wasThereAnyConflict}</Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      rows="3"
                      name="family_conflict"
                      value={formData.childhood_history.family_conflict}
                      onChange={childhoodHandleChange}
                    />
                  </FormGroup>
                </div>

                {/*Sociality  where born & Living?
सामाजिकता जहां पैदा हुआ और रहा  है?*/}
                <div className="col-md-12">
                  <Label htmlFor="birthPlace">{socialityWhere}</Label>
                  <Input
                    type="text"
                    id="birthPlace"
                    name="sociality_living"
                    value={formData.childhood_history.sociality_living}
                    onChange={childhoodHandleChange}
                    placeholder="Enter birth place..."
                  />

                  <br />
                  <Label htmlFor="birthPlace">{highRiskBehavior}</Label>
                  <Input
                    type="text"
                    id="currentLocation"
                    name="high_risk_behavior"
                    value={formData.childhood_history.high_risk_behavior}
                    onChange={childhoodHandleChange}
                    placeholder="Enter current location..."
                  />
                </div>

                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{whatWasImpect}</Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      rows="3"
                      name="impact_of_movies"
                      value={formData.childhood_history.impact_of_movies}
                      onChange={childhoodHandleChange}
                    />
                  </FormGroup>
                </div>

                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{hasAnyoneEverAbused}</Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      rows="3"
                      name="abuse_history"
                      value={formData.childhood_history.abuse_history}
                      onChange={childhoodHandleChange}
                    />
                  </FormGroup>
                </div>

                {/* Academics Occupational Details Start */}

                {/*Academics Occupational Details/ शैक्षणिक व्यावसायिक विवरण*/}
                <H5>{academicsOccupationalDetails}</H5>
                <div className="col-md-6">
                  <Label htmlFor="educationStatus">{EducationStatus}</Label>
                  {/* <Input
                  id="educationStatus"
                  className="form-control form-control-primary btn-square"
                  name="select"
                  type="select"
                  value={educationStatus.selectedStatus}
                  onChange={handleEducationalSelectChange}
                >
                  <option value="">-- Select --</option>
                  {educationOptions.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </Input>
                {educationStatus.selectedStatus === "Other / अन्य" && (
                  <div>
                    <Label htmlFor="otherEducation">
                      Specify Other / अन्य बताएं:
                    </Label>
                    <Input
                      type="textarea"
                      id="otherEducation"
                      value={educationStatus.otherEducation}
                      onChange={handleEducationalOtherEducationChange}
                      placeholder="Enter education status"
                    />
                  </div>
                )} */}
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="education_status"
                    value={formData.education_employment.education_status}
                    onChange={academicOccupationHandler}
                  />
                </div>

                {/*Occupational status? कार्य की स्थिति?*/}
                <div className="col-md-6">
                  <Label htmlFor="occupation">{OcuStatus}</Label>
                  {/* <Input
                  id="occupation"
                  className="form-control form-control-primary btn-square"
                  name="select"
                  type="select"
                  value={OccupationalStatus.selectedStatus}
                  onChange={handleOccupationalSelectChange}
                >
                  <option value="">-- Select --</option>
                  {occupationOptions.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </Input>
                {OccupationalStatus.selectedStatus === "Other / अन्य" && (
                  <div>
                    <Label htmlFor="other Occupational">
                      Specify Other / अन्य बताएं:
                    </Label>
                    <Input
                      type="textarea"
                      id="otherEducation"
                      value={OccupationalStatus.otherOccupational}
                      onChange={handleOccupationalOtherEducationChange}
                      placeholder="Enter occupational status"
                    />
                  </div>
                )} */}
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="occupation_status"
                    value={formData.education_employment.occupation_status}
                    onChange={academicOccupationHandler}
                  />
                </div>

                {/*If dropout what is the reason यदि ड्रॉपआउट हुआ तो क्या कारण है?*/}
                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{ifDropout}</Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      rows="3"
                      name="dropout_reason"
                      value={formData.education_employment.dropout_reason}
                      onChange={academicOccupationHandler}
                    />
                  </FormGroup>
                </div>

                {/*Study/Work Details: (what was job frequency)  /अध्ययन/कार्य विवरण: (नौकरी की फ्रीक्वेंसी क्या थी?)*/}
                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{studyWorkDetails}</Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      rows="3"
                      name="work_details"
                      value={formData.education_employment.work_details}
                      onChange={academicOccupationHandler}
                    />
                  </FormGroup>
                </div>

                {/*Hobbies : शौक:*/}
                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{Hobbies1}</Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      rows="3"
                      name="hobbies"
                      value={formData.education_employment.hobbies}
                      onChange={academicOccupationHandler}
                    />
                  </FormGroup>
                </div>

                {/*Extra skills if any: अतिरिक्त कौशल कोई हो:*/}
                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{extraSkills}</Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      rows="3"
                      name="skills"
                      value={formData.education_employment.skills}
                      onChange={academicOccupationHandler}
                    />
                  </FormGroup>
                </div>

                {/*Achievement in life: जीवन में कोई उपलब्धि:
               */}
                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{achievemntInLife}</Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      rows="3"
                      name="achievements"
                      value={formData.education_employment.achievements}
                      onChange={academicOccupationHandler}
                    />
                  </FormGroup>
                </div>

                {/* Academics Occupational Details End */}

                {/* Social Behavior Start */}
                {/* Social Behavior / सामाजिक व्यवहार */}
                <H5>{socialBehavior}</H5>
                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{socialBehavior1}</Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      rows="3"
                      name="social_behavior"
                      value={formData.social_behavior.social_behavior}
                      onChange={socialBehaviorHandler}
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
                      value={formData.social_behavior.with_whom_spend_time}
                      onChange={socialBehaviorHandler}
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
                      name="number_of_friends"
                      value={formData.social_behavior.number_of_friends}
                      onChange={socialBehaviorHandler}
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
                      name="friends_social_status"
                      value={formData.social_behavior.friends_social_status}
                      onChange={socialBehaviorHandler}
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
                      name="substance_dependent_friends"
                      value={formData.social_behavior.substance_dependent_friends}
                      onChange={socialBehaviorHandler}
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
                      value={formData.social_behavior.well_wisher_person}
                      onChange={socialBehaviorHandler}
                    />
                  </FormGroup>
                </div>

                {/* Social Behavior End */}

                {/* Legal History Start */}
                {/* Legal History / लीगल इतिहास */}
                <H5>{legalHistory}</H5>
                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{domesticViolence}</Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      rows="3"
                      name="domestic_violence"
                      value={formData.legal_history.domestic_violence}
                      onChange={legalHistoryHandler}
                    />
                  </FormGroup>
                </div>

                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{reasonBehindDomesticViolence}</Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      rows="3"
                      name="violence_reason"
                      value={formData.legal_history.violence_reason}
                      onChange={legalHistoryHandler}
                    />
                  </FormGroup>
                </div>

                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{drugStatus}</Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      rows="3"
                      name="drug_status_qty"
                      value={formData.legal_history.drug_status_qty}
                      onChange={legalHistoryHandler}
                    />
                  </FormGroup>
                </div>

                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{ifThereIsAnyCriminalCase}</Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      rows="3"
                      name="criminal_case"
                      value={formData.legal_history.criminal_case}
                      onChange={legalHistoryHandler}
                    />
                  </FormGroup>
                </div>

                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{specificCaseDetails}</Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      rows="3"
                      name="case_details"
                      value={formData.legal_history.case_details}
                      onChange={legalHistoryHandler}
                    />
                  </FormGroup>
                </div>

                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{currentCaseStatus}</Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      rows="3"
                      name="case_status"
                      value={formData.legal_history.case_status}
                      onChange={legalHistoryHandler}
                    />
                  </FormGroup>
                </div>

                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{ifWentToJail}</Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      rows="3"
                      name="jail_duration"
                      value={formData.legal_history.jail_duration}
                      onChange={legalHistoryHandler}
                    />
                  </FormGroup>
                </div>

                {/* Legal History End */}

                {/* Patient behavior Start */}
                {/* Patient behavior / रोगी का व्यवहार */}

                <H5>{patientBeh}</H5>

                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{whatIsTheMostImportantThing}</Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      rows="3"
                      name="life_priority"
                      value={formData.patient_behavior.life_priority}
                      onChange={onChangeEventHandler}
                    />
                  </FormGroup>
                </div>

                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{lifeAim}</Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      rows="3"
                      name="life_aim"
                      value={formData.patient_behavior.life_aim}
                      onChange={onChangeEventHandler}
                    />
                  </FormGroup>
                </div>

                <H5>{patientBehavior}</H5>
                <div className="col-md-12 table-responsive">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>{patientBehavior}</th>
                        <th>{yes}</th>
                        <th>{no}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientBehaviorFormattedList.map(
                        ({ key, label }, index) => (
                          <tr key={key}>
                            <td>{index + 1}</td>
                            <td>{label}</td>
                            {["Yes", "No"].map((value) => {
                              const inputId = `patientBhehaviour${key}_${value}`;
                              return (
                                <td key={inputId} className="radio radio-primary">
                                  <Input
                                    id={inputId}
                                    type="radio"
                                    name={`patientBhehaviour${key}`}
                                    value={value}
                                    checked={
                                      formData.patient_behavior[key] === value
                                    }
                                    onChange={() =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        patient_behavior: {
                                          ...prev.patient_behavior,
                                          [key]: value,
                                        },
                                      }))
                                    }
                                  />
                                  <Label for={inputId}>
                                    {value === "Yes" ? "Yes" : "No"}
                                  </Label>
                                </td>
                              );
                            })}
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="col-md-12">
                  <div className="checkbox ms-3">
                    <Input
                      id="checkbox1"
                      type="checkbox"
                      checked={formData.consent === "Yes"}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          consent: e.target.checked ? "Yes" : "No",
                        }))
                      }
                    />
                    <Label className="text-muted" for="checkbox1">
                      {consent}
                    </Label>
                  </div>
                </div>

                {/*Content section start*/}
                <div className="row">
                  <div className="col-md-4">
                    <Label>{name}</Label>
                    <Input
                      type="text"
                      placeholder="Name"
                      name="consent_name"
                      value={formData.consent_name}
                      onChange={onChangeEventHandler}
                    />
                  </div>
                  <div className="col-md-4">
                    <Label>{relationship}</Label>
                    <Input
                      type="text"
                      placeholder="Relationship"
                      name="relationship"
                      value={formData.relationship}
                      onChange={onChangeEventHandler}
                    />
                  </div>
                  <div className="col-md-4">
                    <Label>{signature}</Label>
                    <Input
                      type="text"
                      placeholder="Signature"
                      name="signature"
                      value={formData.signature}
                      onChange={onChangeEventHandler}
                    />
                  </div>
                  <div className="col-md-12">
                    <Label>{prepared}</Label>
                    <Input
                      type="text"
                      placeholder="Prepared By"
                      name="prepared_by"
                      value={formData.prepared_by}
                      onChange={onChangeEventHandler}
                    />
                  </div>
                </div>
                {/* Submit */}
                <div className="col-md-12">
                  <Button color="primary" type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                      ></span>
                    ) : (
                      "Submit PFA"
                    )}
                  </Button>
                </div>
              </div>
            </Form>
          ) : (
            <div>No data available</div>
          )}
        </div>
      </CommonModal>
      {/* View Gen Family Data Modal End */}

      {/* Edit gen family data / data will fetch by latest gen family id and showing into edit modal like pre fetch fill data into form for create re admission of genfamily form*/}
      <CommonModal
  isOpen={GeneditModal}
  title={"Gen Family Re admission form"}
  toggler={closeGenFamily}
  maxWidth="1200px"
>
  {GenfamiltEditData ? (
    <form className="theme-form" onSubmit={(e)=>{
      e.preventDefault();
      handlereGenfamily();
    }}>
      {/* UID */}
      <div className="row pt-3 pb-3">
        <FormGroup className="form-group row col-md-6">
          <Label className="col-sm-12 col-form-label  col-xl-6">
            {UID}
          </Label>
          <Col xl="5" sm="12">
            <div className="input-group">
              <Input
                className="form-control"
                type="text"
                name="genUID"
                value={GenfamiltEditData.uid}
                onChange={(e) =>
                  setGenfamilyEditData({
                    ...GenfamiltEditData,
                    uid: e.target.value,
                  })
                }
              />
            </div>
          </Col>
        </FormGroup>
      </div>

      {/* Form Fill Date */}
      <div className="col-md-6">
        <FormGroup className="form-group row">
          <Label className="col-sm-12 col-form-label col-xl-6">
            {dateOfFormFilling}
          </Label>
          <Col xl="5" sm="12">
            <div className="input-group">
              <DatePicker
                className="form-control digits"
                selected={
                  GenfamiltEditData?.form_fill_date
                    ? new Date(GenfamiltEditData.form_fill_date)
                    : null
                }
                onChange={(date) =>
                  setGenfamilyEditData({
                    ...GenfamiltEditData,
                    form_fill_date: date,
                  })
                }
              />
            </div>
          </Col>
        </FormGroup>
      </div>

      {/* Occupation Status */}
      <div className="row pt-3 pb-3">
        <div className="col-md-3">
          <Label>{relation}</Label>
          <Input
            type="text"
            className="form-control mt-2"
            placeholder="Enter your occupational status"
            name="occupational_status"
            value={GenfamiltEditData.occupational_status}
            onChange={(e) =>
              setGenfamilyEditData({
                ...GenfamiltEditData,
                occupational_status: e.target.value,
              })
            }
          />
        </div>

        {/* Marital Status */}
        <div className="col-md-3">
          <Label>{marital}</Label>
          <Input
            type="text"
            className="form-control mt-2"
            placeholder="Enter your marital status"
            name="marital_status"
            value={GenfamiltEditData.marital_status}
            onChange={(e) =>
              setGenfamilyEditData({
                ...GenfamiltEditData,
                marital_status: e.target.value,
              })
            }
          />
        </div>

        {/* Living Situation */}
        <div className="col-md-3">
          <Label>{living}</Label>
          <Input
            type="text"
            className="form-control mt-2"
            placeholder="Enter your living situation"
            name="living_situation"
            value={GenfamiltEditData.living_situation}
            onChange={(e) =>
              setGenfamilyEditData({
                ...GenfamiltEditData,
                living_situation: e.target.value,
              })
            }
          />
        </div>

        {/* Religion */}
        <div className="col-md-3">
          <Label>{religion}</Label>
          <Input
            type="text"
            className="form-control mt-2"
            placeholder="Enter your religion"
            name="religion"
            value={GenfamiltEditData.religion}
            onChange={(e) =>
              setGenfamilyEditData({
                ...GenfamiltEditData,
                religion: e.target.value,
              })
            }
          />
        </div>

           {/*End Living Situation and Religion*/}
            {/*Substance Use Dependency / नशीले पदार्थ उपयोग निर्भरता */}
            <h5 className="mt-3">{substanceDependency}</h5>
            <div className="row pt-3 pb-3">
              {/*Duration of regular use? / कब से पदार्थ निर्भर हैं? */}
              <div className="col-md-3">
                <Label for="custom-duration">{durationOfRegularUse}</Label>
                <Input
                  type="text"
                  id="custom-duration"
                  name="duration_of_use"
                  value={GenfamiltEditData.duration_of_use}
                  onChange={(e) =>
                    setGenfamilyEditData({
                      ...GenfamiltEditData,
                      duration_of_use: e.target.value,
                    })
                  }
                />
              </div>
              {/*Daily Spent? / दिनमा कितना पदार्थ उपयोग कर रहे हैं? */}
              <div className="col-md-3">
                <Label for="daily-spent">{dailySpentSubstance}</Label>
                <Input
                  type="number"
                  id="daily-spent"
                  name="daily_spent_amount"
                  min="0"
                  step="0.01"
                  value={GenfamiltEditData.daily_spent_amount}
                  onChange={(e) =>
                    setGenfamilyEditData({
                      ...GenfamiltEditData,
                      daily_spent_amount: e.target.value,
                    })
                  }
                />
              </div>
              {/*Patient Monthly Income? / महीने में कितना आय हैं? */}
              <div className="col-md-3">
                <Label for="monthly-income">{patienMonthlyIncome}</Label>
                <Input
                  type="number"
                  id="monthly-income"
                  name="patient_monthly_income"
                  min="0"
                  step="100"
                  value={GenfamiltEditData.patient_monthly_income}
                 onChange={(e) =>
                    setGenfamilyEditData({
                      ...GenfamiltEditData,
                      patient_monthly_income: e.target.value,
                    })
                  }
                />
              </div>
              {/*Family Monthly Income? / महीने में कितना आय हैं? */}
              <div className="col-md-3">
                <Label for="family-income">{familyMonthlyIncome}</Label>
                <Input
                  type="number"
                  id="family-income"
                  name="family_monthly_income"
                  min="0"
                  step="100"
                  placeholder="Enter amount"
                  value={GenfamiltEditData.family_monthly_income}
                  onChange={(e) =>
                    setGenfamilyEditData({
                      ...GenfamiltEditData,
                      family_monthly_income: e.target.value,
                    })
                  }
                />
              </div>
            </div>
 {/*End Substance Use Dependency*/}
            {/*Source of money? Kindly mention which are applicable?पैसे का अरैंजमेंट? कृपया बताएं कि कौन से लागू हैं?*/}
            <h5 className="mt-3">{sourceOfMoney}</h5>
            <div className="row pt-3 pb-3 ">
            {moneySources.map((source) => (
  <div key={source.id} className="moneySource col-md-3">
    <Input
      type="checkbox"
      id={source.id}
      name={source.id}
      checked={GenfamiltEditData[source.id] === "Yes"}
      className="checkbox_animated"
      onChange={(e) =>
        setGenfamilyEditData((prev) => ({
          ...prev,
          [e.target.name]: e.target.checked ? "Yes" : "No",
        }))
      }
    />
    <Label htmlFor={source.id}>{source.label}</Label>

    {source.id === "source_any_other" &&
      GenfamiltEditData[source.id] === "Yes" && (
        <textarea
          className="form-control mt-2"
          rows="3"
          placeholder="Please specify"
          name="source_other_text"
          value={GenfamiltEditData.source_other_text || ""}
          onChange={(e) =>
            setGenfamilyEditData((prev) => ({
              ...prev,
              source_other_text: e.target.value,
            }))
          }
        />
      )}
  </div>
))}

            </div>


             {/*End Source of money? Kindly mention which are applicable?*/}
            {/*Arrangements? / अरैंजमेंट्स?*/}
            <div className="row">
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{Ifarrange}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="family_reaction"
                    value={GenfamiltEditData.family_reaction}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        family_reaction: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </div>
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{mentionYear}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="first_action_when_known"
                    value={GenfamiltEditData.first_action_when_known}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        first_action_when_known: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </div>
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{action}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="pattern_of_use"
                    value={GenfamiltEditData.pattern_of_use}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        pattern_of_use: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </div>
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{Residence}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="residence_status_during_use"
                    value={GenfamiltEditData.residence_status_during_use}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        residence_status_during_use: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </div>
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{experiencedTrauma}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="trauma_experience"
                    value={GenfamiltEditData.trauma_experience}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        trauma_experience: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </div>
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{occurredPatientBehavior}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="behavior_change"
                    value={GenfamiltEditData.behavior_change}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        behavior_change: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </div>
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{sociality}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="social_circle_change"
                    value={GenfamiltEditData.social_circle_change}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        social_circle_change: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </div>
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{effectOfSubstance}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="life_effect"
                    value={GenfamiltEditData.life_effect}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        life_effect: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{ChiefComplaint}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="chief_complaints"
                    value={GenfamiltEditData.chief_complaints}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        chief_complaints: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </div>
            </div>
            {/*End Arrangements? / अरैंजमेंट्स?*/}

            {/*Chief Complaint*/}
<div className="cheif__complaint">
  <div className="table-responsive">
    <h5 className="mt-3 mb-3">{ChiefComplaint}</h5>

    <Table bordered>
      <thead>
        <tr>
          <th scope="col">{TreatmentOfSubstance}</th>
          <th scope="col">{howManyTimes}</th>
        </tr>
        <tr>
          <th scope="col">{year}</th>
          <th scope="col">{placeOfTreatment}</th>
          <th scope="col">{durationOfTime}</th>
          <th scope="col">{daysOfSobriety}</th>
          <th scope="col">{cheifAction}</th>
        </tr>
      </thead>
      <tbody>
        {GenfamiltEditData.treatment_records.map((treatment, index) => (
          <tr key={index}>
            <td>
              <Input
                type="text"
                name="treatment_year"
                value={treatment.treatment_year}
                onChange={(e) => handleTreatmentInputChange(index, e)}
                placeholder="Year"
              />
            </td>
            <td>
              <Input
                type="text"
                name="treatment_place"
                value={treatment.treatment_place}
                onChange={(e) => handleTreatmentInputChange(index, e)}
                placeholder="Place"
              />
            </td>
            <td>
              <Input
                type="text"
                name="treatment_duration"
                value={treatment.treatment_duration}
                onChange={(e) => handleTreatmentInputChange(index, e)}
                placeholder="Duration"
              />
            </td>
            <td>
              <Input
                type="text"
                name="days_of_sobriety"
                value={treatment.days_of_sobriety}
                onChange={(e) => handleTreatmentInputChange(index, e)}
                placeholder="Sobriety Days"
              />
            </td>
            <td>
              {index > 0 && (
                <Button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => removeTreatmentRow(index)}
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
      className="btn btn-secondary mt-3 mb-3"
      onClick={addTreatmentRow}
    >
      + Add More
    </Button>
  </div>
</div>

<div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{absuingSubstance}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="asked_to_stop"
                  value={GenfamiltEditData.asked_to_stop}
                  onChange={(e) =>
                    setGenfamilyEditData({
                      ...GenfamiltEditData,
                      asked_to_stop: e.target.value,
                    })
                  }
                />
              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{influenceStop}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="reason_to_stop"
                  value={GenfamiltEditData.reason_to_stop}
                  onChange={(e) =>
                    setGenfamilyEditData({
                      ...GenfamiltEditData,
                      reason_to_stop: e.target.value,
                    })
                  }
                />
              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{whenStopUsing}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="work_after_stop"
                  value={GenfamiltEditData.work_after_stop}
                  onChange={(e) =>
                    setGenfamilyEditData({
                      ...GenfamiltEditData,
                      work_after_stop: e.target.value,
                    })
                  }
                />
              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{itReplaceWhenWhom}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="relapse_details"
                  value={GenfamiltEditData.relapse_details}
                  onChange={(e) =>
                    setGenfamilyEditData({
                      ...GenfamiltEditData,
                      relapse_details: e.target.value,
                    })
                  }
                />
              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{afterRelapse}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="post_relapse_change"
                  value={GenfamiltEditData.post_relapse_change}
                  onChange={(e) =>
                    setGenfamilyEditData({
                      ...GenfamiltEditData,
                      post_relapse_change: e.target.value,
                    })
                  }
                />
              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{haveDisorder}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="mental_physical_issues"
                  value={GenfamiltEditData.mental_physical_issues}
                  onChange={(e) =>
                    setGenfamilyEditData({
                      ...GenfamiltEditData,
                      mental_physical_issues: e.target.value,
                    })
                  }
                />
              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{isProblmeOrInjury}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="injuries_due_to_substance"
                  value={GenfamiltEditData.injuries_due_to_substance}
                  onChange={(e) =>
                    setGenfamilyEditData({
                      ...GenfamiltEditData,
                      injuries_due_to_substance: e.target.value,
                    })
                  }
                />
              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{DiagnosedOnTreatment}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="diagnosis_treatment"
                  value={GenfamiltEditData.diagnosis_treatment}
                  onChange={(e) =>
                    setGenfamilyEditData({
                      ...GenfamiltEditData,
                      diagnosis_treatment: e.target.value,
                    })
                  }
                />
              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{DoctorPlaceDuration}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="doctor_info"
                  value={GenfamiltEditData.doctor_info}
                  onChange={(e) =>
                    setGenfamilyEditData({
                      ...GenfamiltEditData,
                      doctor_info: e.target.value,
                    })
                  }
                />
              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{ifGone}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="traditional_treatment"
                  value={GenfamiltEditData.traditional_treatment}
                  onChange={(e) =>
                    setGenfamilyEditData({
                      ...GenfamiltEditData,
                      traditional_treatment: e.target.value,
                    })
                  }
                />
              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{YouFamiliar}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="effect_of_treatment"
                  value={GenfamiltEditData.traditional_treatment}
                  onChange={(e) =>
                    setGenfamilyEditData({
                      ...GenfamiltEditData,
                      traditional_treatment: e.target.value,
                    })
                  }
                />
              </FormGroup>
            </div>

{/*Relationship status: रिलेशनशिप स्टेटस ?: */}
<div className="row">
              <H5 className="mt-3 mb-3">{relationshipFamilyStatus}</H5>
              <div className="col-md-6">
                <Label htmlFor="marital_status">{relationshipStatus}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="relationship_status"
                  value={GenfamiltEditData.traditional_treatment}
                  onChange={(e) =>
                    setGenfamilyEditData({
                      ...GenfamiltEditData,
                      traditional_treatment: e.target.value,
                    })
                  }
                />
                {/* <Input
                  id="marital_status"
                  name="select"
                  type="select"
                  value={selectedRelationshipStatus}
                  onChange={(e) =>
                    setSelectedRelationshipStatus(e.target.value)
                  }
                  className="form-control form-control-primary btn-square"
                >
                  <option value="">Select Marital Status</option>
                  {relationshipOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </Input> */}

                {/* Show text input if 'Other' is selected
                {selectedRelationshipStatus === "other" && (
                  <Input
                    type="textarea"
                    className="form-control mt-2"
                    placeholder="Please specify"
                    value={cutsomRelationshipText}
                    handleChange={(e) =>
                      setcustomRelationshipText(e.target.value)
                    }
                  />
                )} */}
              </div>

              {/*Marriage Arrangement &Since वैवाहिक व्यवस्था और कब से*/}
              <div className="col-md-6">
                <FormGroup className="mb-0">
                  <Label>{MarriageArrangement}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="marriage_arrangement"
                    value={GenfamiltEditData.traditional_treatment}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        traditional_treatment: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </div>

              {/*After marriage life or relationship Status*/}
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{afterMerriageLife}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="post_marriage_status"
                    value={GenfamiltEditData.traditional_treatment}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        traditional_treatment: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </div>

              {/*Is there interference of wife's family or any relative in the internal matters of your family. If yes than whom & in which affairs*/}
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{isThereInterference}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="relatives_interference"
                    value={GenfamiltEditData.traditional_treatment}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        traditional_treatment: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </div>

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
        {GenfamiltEditData.members.map((inter, index) => (
          <tr key={index}>
            <td>
              <Input
                type="text"
                name="name"
                value={inter.name}
                onChange={(e) => handleMemberInputChange(index, e)}
                placeholder="Name / नाम"
              />
            </td>
            <td>
              <Input
                type="text"
                name="relation"
                value={inter.relation}
                onChange={(e) => handleMemberInputChange(index, e)}
                placeholder="Relation / संबंध"
              />
            </td>
            <td>
              <Input
                type="text"
                name="age"
                value={inter.age}
                onChange={(e) => handleMemberInputChange(index, e)}
                placeholder="Age / आयु"
              />
            </td>
            <td>
              <Input
                type="text"
                name="living_status"
                value={inter.living_status}
                onChange={(e) => handleMemberInputChange(index, e)}
                placeholder="Living Status / रहने की स्तिथि"
              />
            </td>
            <td>
              <Input
                type="text"
                name="physical_disorder"
                value={inter.physical_disorder}
                onChange={(e) => handleMemberInputChange(index, e)}
                placeholder="Any physical Disorder / कोई भी शारीरिक विकार"
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
      value={GenfamiltEditData.disorder_desc}
      onChange={(e) =>
        setGenfamilyEditData((prev) => ({
          ...prev,
          disorder_desc: e.target.value,
        }))
      }
    />
  </FormGroup>
</div>


              {/*FAMILY HISTORY :Drinking, Substance abuse or psychiatric problem?  
पारिवारिक इतिहास: शराब पीना, मादक पदार्थ का प्रयोग या मानसिक समस्या?*/}
              <div className="col-md-12 mb-4">
                <div className="table-responsive">
                  <p className="mt-3 mb-3">{familyHistorySubstanceAbuse}</p>
                  <Table bordered>
                    <thead>
                      <tr>
                        <th>Mother Side</th>
                        <th>Alcohol</th>
                        <th>Drug</th>
                        <th>Psych</th>
                        <th>Father Side</th>
                        <th>Alcohol</th>
                        <th>Drug</th>
                        <th>Psych</th>
                      </tr>
                    </thead>
                    <tbody>
                    <tr>
  <td>Grandmother</td>
  <td>
    <Input
      type="checkbox"
      className="checkbox_animated"
      checked={
        GenfamiltEditData.family_history_data?.mother_side?.grandmother?.alcohol === "Yes"
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
        GenfamiltEditData.family_history_data?.mother_side?.grandmother?.drug === "Yes"
      }
      onChange={(e) =>
        handleFamilyHistoryChange(
          "mother_side",
          "grandmother",
          "drug",
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
        GenfamiltEditData.family_history_data?.mother_side?.grandmother?.psych === "Yes"
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
        GenfamiltEditData.family_history_data?.father_side?.grandmother?.alcohol === "Yes"
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
        GenfamiltEditData.family_history_data?.father_side?.grandmother?.drug === "Yes"
      }
      onChange={(e) =>
        handleFamilyHistoryChange(
          "father_side",
          "grandmother",
          "drug",
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
        GenfamiltEditData.family_history_data?.father_side?.grandmother?.psych === "Yes"
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

                      <tr>
                        <td>Grandfather</td>
                        <td>
                          <Input
                            type="checkbox"
                            className="checkbox_animated"
                            checked={
                              GenfamiltEditData.family_history_data?.mother_side
                                ?.grandfather?.alcohol === "Yes"
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
                              GenfamiltEditData.family_history_data?.mother_side
                                ?.grandfather?.drug === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "mother_side",
                                "grandfather",
                                "drug",
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
                              GenfamiltEditData.family_history_data?.mother_side
                                ?.grandfather?.psych === "Yes"
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
                              GenfamiltEditData.family_history_data?.father_side
                                ?.grandfather?.alcohol === "Yes"
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
                              GenfamiltEditData.family_history_data?.father_side
                                ?.grandfather?.drug === "Yes"
                            }
                            onChange={(e) =>
                              handleFamilyHistoryChange(
                                "father_side",
                                "grandfather",
                                "drug",
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
                              GenfamiltEditData.family_history_data?.father_side
                                ?.grandfather?.psych === "Yes"
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


                      <tr>
  <td>Mother</td>
  <td>
    <Input
      type="checkbox"
      className="checkbox_animated"
      checked={
        GenfamiltEditData.family_history_data?.mother_side?.mother?.alcohol === "Yes"
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
        GenfamiltEditData.family_history_data?.mother_side?.mother?.drug === "Yes"
      }
      onChange={(e) =>
        handleFamilyHistoryChange(
          "mother_side",
          "mother",
          "drug",
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
        GenfamiltEditData.family_history_data?.mother_side?.mother?.psych === "Yes"
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
        GenfamiltEditData.family_history_data?.father_side?.father?.alcohol === "Yes"
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
        GenfamiltEditData.family_history_data?.father_side?.father?.drug === "Yes"
      }
      onChange={(e) =>
        handleFamilyHistoryChange(
          "father_side",
          "father",
          "drug",
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
        GenfamiltEditData.family_history_data?.father_side?.father?.psych === "Yes"
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

<tr>
  <td>Aunt / मामी</td>
  <td>
    <Input
      type="checkbox"
      className="checkbox_animated"
      checked={
        GenfamiltEditData.family_history_data?.mother_side?.aunt?.alcohol === "Yes"
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
        GenfamiltEditData.family_history_data?.mother_side?.aunt?.drug === "Yes"
      }
      onChange={(e) =>
        handleFamilyHistoryChange(
          "mother_side",
          "aunt",
          "drug",
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
        GenfamiltEditData.family_history_data?.mother_side?.aunt?.psych === "Yes"
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
        GenfamiltEditData.family_history_data?.father_side?.aunt?.alcohol === "Yes"
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
        GenfamiltEditData.family_history_data?.father_side?.aunt?.drug === "Yes"
      }
      onChange={(e) =>
        handleFamilyHistoryChange(
          "father_side",
          "aunt",
          "drug",
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
        GenfamiltEditData.family_history_data?.father_side?.aunt?.psych === "Yes"
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

<tr>
  <td>Uncle / मामा</td>
  <td>
    <Input
      type="checkbox"
      className="checkbox_animated"
      checked={
        (GenfamiltEditData.family_history_data?.mother_side?.uncle?.alcohol ?? "No") === "Yes"
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
        (GenfamiltEditData.family_history_data?.mother_side?.uncle?.drug ?? "No") === "Yes"
      }
      onChange={(e) =>
        handleFamilyHistoryChange(
          "mother_side",
          "uncle",
          "drug",
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
        (GenfamiltEditData.family_history_data?.mother_side?.uncle?.psych ?? "No") === "Yes"
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
        (GenfamiltEditData.family_history_data?.father_side?.uncle?.alcohol ?? "No") === "Yes"
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
        (GenfamiltEditData.family_history_data?.father_side?.uncle?.drug ?? "No") === "Yes"
      }
      onChange={(e) =>
        handleFamilyHistoryChange(
          "father_side",
          "uncle",
          "drug",
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
        (GenfamiltEditData.family_history_data?.father_side?.uncle?.psych ?? "No") === "Yes"
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





                  
                    </tbody>
                  </Table>
                </div>
              </div>

              {/*Current Status? वर्तमान स्थिति?*/}
              <div className="col-md-12 mt-3">
                <Label>{anyOtherPlsMention1}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="psych_problem_desc"
                  value={GenfamiltEditData.psych_problem_desc}
                  onChange={(e) =>
                    setGenfamilyEditData({
                      ...GenfamiltEditData,
                      psych_problem_desc: e.target.value,
                    })
                  }
                />
              </div>

              {/*Current Status? वर्तमान स्थिति?*/}
              
              <div className="col-md-12 mt-3 mb-3">
                 <Label>{currentStatus}</Label>
                {/* <Input
                  className="form-control form-control-primary btn-square"
                  name="select"
                  type="select"
                  onChange={(e) => setcurrentStatusData(e.target.value)}
                >
                  <option value="">{currentStatus}</option>
                  {currentstatusObject.map((status, index) => (
                    <option key={index} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </Input>
                {currentStatusData === "Other" && (
                  <Input
                    type="textarea"
                    className="form-control mt-2"
                    rows="3"
                    placeholder="Please specify"
                    value={customeCurrentStatus}
                    onChange={(e) => setcustomeCurrentStatus(e.target.value)}
                  />
                )} */}
                <Input
                  type="text"
                  name="current_status"
                  className="form-control"
                  value={GenfamiltEditData.current_status}
                  onChange={(e) =>
                    setGenfamilyEditData({
                      ...GenfamiltEditData,
                      current_status: e.target.value,
                    })
                  }
                />
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{howWasBonding}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="relationship_with_user"
                    value={GenfamiltEditData.relationship_with_user}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        relationship_with_user: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{familyBehaviorPatient}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="family_behavior"
                    value={GenfamiltEditData.family_behavior}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        family_behavior: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{monitoringFamily}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="head_of_family"
                    value={GenfamiltEditData.head_of_family}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        head_of_family: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{ralationshipFamilyMember}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="relationships_with_family"
                    value={GenfamiltEditData.relationships_with_family}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        relationships_with_family: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </div>

              {/* Childhood /बचपन */}

              <H5 className="mt-3 mb-3">{childhood}</H5>
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{birthConditions}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="birth_conditions"
                    value={GenfamiltEditData.birth_conditions}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        birth_conditions: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{parentingHistory}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="parenting_history"
                    value={GenfamiltEditData.parenting_history}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        parenting_history: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{wasThereAnyConflict}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="family_conflict"
                    value={GenfamiltEditData.family_conflict}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        family_conflict: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </div>

              {/*Sociality  where born & Living?
सामाजिकता जहां पैदा हुआ और रहा  है?*/}
              <div className="col-md-12">
                <Label htmlFor="birthPlace">{socialityWhere}</Label>
                <Input
                  type="text"
                  id="birthPlace"
                  name="sociality_living"
                  value={GenfamiltEditData.sociality_living}
                  onChange={(e) =>
                    setGenfamilyEditData({
                      ...GenfamiltEditData,
                      sociality_living: e.target.value,
                    })
                  }
                />

                <br />
                <Label htmlFor="birthPlace">{highRiskBehavior}</Label>
                <Input
                  type="text"
                  id="currentLocation"
                  name="high_risk_behavior"
                  value={GenfamiltEditData.high_risk_behavior}
                  onChange={(e) =>
                    setGenfamilyEditData({
                      ...GenfamiltEditData,
                      high_risk_behavior: e.target.value,
                    })
                  }
                />
              </div>

              <div className="col-md-12 mt-3 mb-3">
                <FormGroup className="mb-0">
                  <Label>{whatWasImpect}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="impact_of_movies"
                    value={GenfamiltEditData.impact_of_movies}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        impact_of_movies: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{hasAnyoneEverAbused}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="abuse_history"
                    value={GenfamiltEditData.abuse_history}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        abuse_history: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </div>

              {/* Academics Occupational Details Start */}

              {/*Academics Occupational Details/ शैक्षणिक व्यावसायिक विवरण*/}
              <H5 className="mt-3 mb-3">{academicsOccupationalDetails}</H5>
              <div className="col-md-6">
                <Label htmlFor="educationStatus">{EducationStatus}</Label>
                {/* <Input
                  id="educationStatus"
                  className="form-control form-control-primary btn-square"
                  name="select"
                  type="select"
                  value={educationStatus.selectedStatus}
                  onChange={handleEducationalSelectChange}
                >
                  <option value="">-- Select --</option>
                  {educationOptions.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </Input>
                {educationStatus.selectedStatus === "Other / अन्य" && (
                  <div>
                    <Label htmlFor="otherEducation">
                      Specify Other / अन्य बताएं:
                    </Label>
                    <Input
                      type="textarea"
                      id="otherEducation"
                      value={educationStatus.otherEducation}
                      onChange={handleEducationalOtherEducationChange}
                      placeholder="Enter education status"
                    />
                  </div>
                )} */}
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="education_status"
                  value={GenfamiltEditData.education_status}
                  onChange={(e) =>
                    setGenfamilyEditData({
                      ...GenfamiltEditData,
                      education_status: e.target.value,
                    })
                  }
                />
              </div>

              {/*Occupational status? कार्य की स्थिति?*/}
              <div className="col-md-6">
                <Label htmlFor="occupation">{OcuStatus}</Label>
                {/* <Input
                  id="occupation"
                  className="form-control form-control-primary btn-square"
                  name="select"
                  type="select"
                  value={OccupationalStatus.selectedStatus}
                  onChange={handleOccupationalSelectChange}
                >
                  <option value="">-- Select --</option>
                  {occupationOptions.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </Input>
                {OccupationalStatus.selectedStatus === "Other / अन्य" && (
                  <div>
                    <Label htmlFor="other Occupational">
                      Specify Other / अन्य बताएं:
                    </Label>
                    <Input
                      type="textarea"
                      id="otherEducation"
                      value={OccupationalStatus.otherOccupational}
                      onChange={handleOccupationalOtherEducationChange}
                      placeholder="Enter occupational status"
                    />
                  </div>
                )} */}
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="occupation_status"
                  value={GenfamiltEditData.occupation_status}
                  onChange={(e) =>
                    setGenfamilyEditData({
                      ...GenfamiltEditData,
                      occupation_status: e.target.value,
                    })
                  }
                />
              </div>

              {/*If dropout what is the reason यदि ड्रॉपआउट हुआ तो क्या कारण है?*/}
              <div className="col-md-12 mt-3">
                <FormGroup className="mb-0">
                  <Label>{ifDropout}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="dropout_reason"
                    value={GenfamiltEditData.dropout_reason}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        dropout_reason: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </div>

              {/*Study/Work Details: (what was job frequency)  /अध्ययन/कार्य विवरण: (नौकरी की फ्रीक्वेंसी क्या थी?)*/}
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{studyWorkDetails}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="work_details"
                    value={GenfamiltEditData.work_details}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        work_details: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </div>

              {/*Hobbies : शौक:*/}
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{Hobbies1}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="hobbies"
                    value={GenfamiltEditData.hobbies}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        hobbies: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </div>

              {/*Extra skills if any: अतिरिक्त कौशल कोई हो:*/}
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{extraSkills}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="skills"
                    value={GenfamiltEditData.skills}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        skills: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </div>

              {/*Achievement in life: जीवन में कोई उपलब्धि:
               */}
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{achievemntInLife}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="achievements"
                    value={GenfamiltEditData.achievements}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        achievements: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </div>

              {/* Academics Occupational Details End */}

              {/* Social Behavior Start */}
              {/* Social Behavior / सामाजिक व्यवहार */}
              <H5 className="mt-3 mb-3">{socialBehavior}</H5>
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{socialBehavior1}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="social_behavior"
                    value={GenfamiltEditData.social_behavior}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        social_behavior: e.target.value,
                      })
                    }
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
                    value={GenfamiltEditData.with_whom_spend_time}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        with_whom_spend_time: e.target.value,
                      })
                    }
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
                    name="number_of_friends"
                    value={GenfamiltEditData.number_of_friends}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        number_of_friends: e.target.value,
                      })
                    }
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
                    name="friends_social_status"
                    value={GenfamiltEditData.friends_social_status}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        friends_social_status: e.target.value,
                      })
                    }
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
                    name="substance_dependent_friends"
                    value={GenfamiltEditData.substance_dependent_friends}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        substance_dependent_friends: e.target.value,
                      })
                    }
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
                    value={GenfamiltEditData.well_wisher_person}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        well_wisher_person: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </div>

              {/* Social Behavior End */}

              {/* Legal History Start */}
              {/* Legal History / लीगल इतिहास */}
              <H5 className="mt-3 mb-3">{legalHistory}</H5>
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{domesticViolence}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="domestic_violence"
                    value={GenfamiltEditData.domestic_violence}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        domestic_violence: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{reasonBehindDomesticViolence}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="violence_reason"
                    value={GenfamiltEditData.violence_reason}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        violence_reason: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{drugStatus}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="drug_status_qty"
                    value={GenfamiltEditData.drug_status_qty}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        drug_status_qty: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{ifThereIsAnyCriminalCase}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="criminal_case"
                    value={GenfamiltEditData.criminal_case}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        criminal_case: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{specificCaseDetails}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="case_details"
                    value={GenfamiltEditData.case_details}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        case_details: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{currentCaseStatus}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="case_status"
                    value={GenfamiltEditData.case_status}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        case_status: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{ifWentToJail}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="jail_duration"
                    value={GenfamiltEditData.jail_duration}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        jail_duration: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </div>

              {/* Legal History End */}

              {/* Patient behavior Start */}
              {/* Patient behavior / रोगी का व्यवहार */}

              <H5 className="mt-3 mb-3">{patientBeh}</H5>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{whatIsTheMostImportantThing}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="life_priority"
                    value={GenfamiltEditData.life_priority}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        life_priority: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{lifeAim}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="life_aim"
                    value={GenfamiltEditData.life_aim}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        life_aim: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </div>

              <H5 className="mt-3 mb-3">{patientBehavior}</H5>
              <div className="col-md-12 table-responsive">
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>{tableNumber}</th>
                      <th>{patientBehavior}</th>
                      <th>{yes}</th>
                      <th>{no}</th>
                    </tr>
                  </thead>
                  <tbody>
                  {patientBehaviorFormattedList.map(({ key, label }, index) => (
  <tr key={key}>
    <td>{index + 1}</td>
    <td className="w-75">{label}</td>
    {["Yes", "No"].map((value) => {
      const inputId = `patientBehavior_${key}_${value}`;
      return (
        <td key={inputId} className="radio radio-primary">
          <Input
            id={inputId}
            type="radio"
            className="form-check-input"
            name={`patientBehavior_${key}`}
            value={value}
            checked={
              GenfamiltEditData?.patientBehaviour?.[key]?.toString() === value.toString()
            }
            onChange={() =>
              setGenfamilyEditData((prev) => ({
                ...prev,
                patientBehaviour: {
                  ...prev.patientBehaviour,
                  [key]: value,
                },
              }))
            }
          />
          <Label className="form-check-label" htmlFor={inputId}>{value}</Label>
        </td>
      );
    })}
  </tr>
))}

                  </tbody>
                </table>
              </div>

              <div className="col-md-12 mt-3 mb-3">
                <div className="checkbox ms-3">
                  <Input
                    id="checkbox1"
                    type="checkbox"
                    checked={formData.consent === "Yes"}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        consent: e.target.checked ? "Yes" : "No",
                      }))
                    }
                  />
                  <Label className="text-muted" for="checkbox1">
                    {consent}
                  </Label>
                </div>
              </div>

              {/*Content section start*/}
              <div className="row mt-3 mb-3">
                <div className="col-md-4">
                  <Label>{name}</Label>
                  <Input
                    type="text"
                    placeholder="Name"
                    name="consent_name"
                    value={GenfamiltEditData.consent_name}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        consent_name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="col-md-4">
                  <Label>{relationship}</Label>
                  <Input
                    type="text"
                    placeholder="Relationship"
                    name="relationship"
                    value={GenfamiltEditData.relationship}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        relationship: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="col-md-4">
                  <Label>{signature}</Label>
                  <Input
                    type="text"
                    placeholder="Signature"
                    name="signature"
                    value={GenfamiltEditData.signature}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        signature: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="col-md-12 mt-3 mb-3">
                  <Label>{prepared}</Label>
                  <Input
                    type="text"
                    placeholder="Prepared By"
                    name="prepared_by"
                    value={GenfamiltEditData.prepared_by}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        prepared_by: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              {/* Submit */}
              <div className="col-md-12 mb-4">
                <Button color="primary" type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    ></span>
                  ) : (
                    "Create Re Gen Family Admission"
                  )}
                </Button>
              </div>
            </div>

      </div>
    </form>
  ) : (
    <p className="text-center">Loading data...</p>
  )}
</CommonModal>

    </Fragment>
  );
}

export default GenFamily;
