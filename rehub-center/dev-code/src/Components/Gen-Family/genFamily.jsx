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
  };

  //Datatable column data start
  const tableColumns = [
    { name: "ID", selector: (row) => row.id, sortable: true, center: true },
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
    {
      name: "Action",
      center: true,
      cell: (row) => (
        <div className="d-flex gap-2">
          {row.status === "Pending" ? (
            // Show only Create icon for Pending
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
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </span>
          ) : (
            // Show View, Edit, Delete for Completed
            <>
              <span
                onClick={() => viewGenFamily(row.id)}
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
                // onClick={() => handleFAEdit(row.id)}
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

              <span
                // onClick={() => handlePFADelete(row.id)}
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
              </span>
            </>
          )}
        </div>
      ),
    },
  ];

  //Loader for fetching data inside data table
  const [stillLoading, setstillLoading] = useState(true);
  //Datatable column data end

  //Fetch register user data ino datatable by user API & display Updated status completed or pending from create-gen-family API start
  const [data, setData] = useState([]);
  // const [selectedRows, setSelectedRows] = useState([]);
  useEffect(() => {
    const token = localStorage.getItem("Authorization"); // Assuming you stored token like this during login

    fetch("https://gks-yjdc.onrender.com/api/users", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        return response.json();
      })
      .then(async (resData) => {
        const formatted = await Promise.all(
          resData.map(async (user) => {
            // Fetch individual user's assessment status
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
              console.log("genFamilyDetails:", assessmentData); // Debugging

              const status =
                assessmentData?.genFamilyDetails?.consent_info?.status ===
                "Completed"
                  ? "Completed"
                  : "Pending";

              return {
                id: user.user_id,
                name: user.name,
                status: status,
              };
            } catch (err) {
              console.error(
                `Failed to fetch status for user ${user.user_id}`,
                err
              );
              return {
                id: user.user_id,
                name: user.name,
                status: "Unknown", // fallback if something fails
              };
            }
          })
        );
        setTimeout(() => {
          setData(formatted);
          setFilteredData(formatted);
          setstillLoading(false);
        }, 3000);
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
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
  };

  const handleOthersChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      family_history_data: {
        ...prev.family_history_data,
        others: e.target.value,
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

      const userId = selectedUser[0].user_id;

      const statusResponse = await fetch(
        `https://gks-yjdc.onrender.com/api/gen-family/gen-family-details/${userId}`,
        {
          headers: {
            Authorization: `${token}`,
          },
        }
      );

      const userAssessmentData = await statusResponse.json();
      console.log("Single user assessmentData:", userAssessmentData);

      const status =
        userAssessmentData?.consent_info?.status === "Completed"
          ? "Completed"
          : "Pending";

      setIsLoading(false);

      Swal.fire({
        icon: "success",
        title: "Assessment Submitted",
        text: `Status: ${status}`,
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



  const [viewGenFamilyModel , setviewGenFamilyModel] = useState(false)
  const [viewgenData, setviewgenData] = useState(null)

  const viewGenFamily = async (userId = null)=>{
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
        console.log("selectedUser ",selectedUser);
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
          <h5>{patientPersonalInformation}</h5>
          <Form className="theme-form" onSubmit={handleGeneralFamilySubmit}>
            {/* <Form className="theme-form"> */}
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
                      value={formData.genUID}
                      onChange={onChangeEventHandler}
                    />
                  </div>
                </Col>
              </FormGroup>
            </div>

            {/*Date of Admission section/प्रवेश की तिथि :*/}
            <div className="row">
              {/*Date of Admission section/प्रवेश की तिथि :*/}
              <div className="col-md-6">
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
              </div>
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
            {/*Patient Name and sex/age section*/}
            <PatientCommonInfo
              selectedUser={selectedUser}
              labels={{
                name: "प्रयासक का नाम :",
                sex: "प्रयासक का लिंग :",
                age: "प्रयासक का उम्र :",
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
                  value={formData.occupational_status}
                  onChange={onChangeEventHandler}
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
                  value={formData.marital_status}
                  onChange={onChangeEventHandler}
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
                  value={formData.living_situation}
                  onChange={onChangeEventHandler}
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
                  value={formData.your_religion}
                  onChange={onChangeEventHandler}
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
                  value={formData.duration_of_use}
                  onChange={onChangeEventHandler}
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
                  value={formData.daily_spent_amount}
                  onChange={onChangeEventHandler}
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
                  value={formData.patient_monthly_income}
                  onChange={onChangeEventHandler}
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
                  value={formData.family_monthly_income}
                  onChange={onChangeEventHandler}
                />
              </div>
            </div>
            {/*End Substance Use Dependency*/}
            {/*Source of money? Kindly mention which are applicable?पैसे का अरैंजमेंट? कृपया बताएं कि कौन से लागू हैं?*/}
            <H5>{sourceOfMoney}</H5>
            <div className="row">
              {moneySources.map((source) => (
                <div key={source.id} className="moneySource col-md-4">
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
                            <button
                              type="button"
                              className="btn btn-danger"
                              onClick={() => removeTreatmentRow(index)}
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                <button type="button" onClick={addTreatmentRow}>
                  + Add More
                </button>
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
                                ): viewgenData ? (
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

                <button type="button" onClick={addTreatmentRow}>
                  + Add More
                </button>
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

    </Fragment>
  );
}

export default GenFamily;
