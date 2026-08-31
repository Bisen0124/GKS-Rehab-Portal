import React, { Fragment, useState, useEffect, useRef } from "react";
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
  Badge,
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

//editPFA download PDF library
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import html2pdf from "html2pdf.js";

import { useBranch } from "../../contexts/BranchContext";


import Translated from "../Translated";
import { useLang } from "../../contexts/LangContext";
import { getTranslation } from "../../utils/translator";

import VoiceTextarea from "../VoiceTextarea/VoiceTextarea";

import UserDetailsModal from "../Common/UserDetailsModal";
import ModalLoading from "../Common/ModalLoading";
import TableExportButtons from "../Common/TableExportButtons";
import { SaveDraftButton, DraftNoticeBanner } from "../Common/SaveDraftButton";
import { loadDraft, clearDraft, safeDate } from "../../utils/formDraftManager";
import { useReactToPrint } from "react-to-print";
import ModalActionButtons from "../Common/ModalActionButtons";

function GenFamily() {

    const { lang } = useLang(); // get current language from context

   //Branches selection
    const { selectedBranch } = useBranch();
    const [viewUserDetailsModal, setViewUserDetailsModal] = useState(false);
    const [selectedViewUserId, setSelectedViewUserId] = useState(null);

    const handleViewUserDetails = (userId) => {
      setSelectedViewUserId(userId);
      setViewUserDetailsModal(true);
    };

  const pdfRef = useRef();
   //PDf view download pdf code handler
    const [pfaDownload, setpfaDownload] = useState(false);
    const handleDownloadPDF = () => {
      const element = pdfRef.current;
      setpfaDownload(true);
  
      // Add a temporary class to scale fonts if needed
      element.classList.add("pdf-scale");

      const patientName =
        viewgenData?.gen_family?.name ||
        viewgenData?.name ||
        viewgenData?.patient_name ||
        viewgenData?.user?.name ||
        "Patient";
      const gksId =
        viewgenData?.gen_family?.custom_code ||
        viewgenData?.gen_family?.gks_id ||
        viewgenData?.gks_id ||
        viewgenData?.custom_code ||
        viewgenData?.gen_family?.uid ||
        viewgenData?.uid ||
        viewgenData?.gen_family?.user_id ||
        viewgenData?.user_id ||
        "";
      const safeName = String(patientName).trim().replace(/\s+/g, "_");
      const safeId = String(gksId).trim().replace(/\s+/g, "_");
  
      const opt = {
        margin: [10, 10, 10, 10], // top, left, bottom, right
        filename: `patient_${safeName}_${safeId || "data"}.pdf`,
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
  const [draftTimestamp, setDraftTimestamp] = useState(null);
  const [currentGenFamilyUserId, setCurrentGenFamilyUserId] = useState(null);

  const createGenFamilyToggle = async (userId = null) => {
    // Always open the modal immediately
    setgetFamilyModal(true);
    const targetId = userId || currentGenFamilyUserId;
    if (userId) setCurrentGenFamilyUserId(userId);

    if (targetId) {
      const saved = loadDraft("general_family", targetId);
      if (saved && saved.data) {
        setFormData(saved.data);
        setDraftTimestamp(saved.savedAt);
      } else {
        setFormData(initialGenFamilyFormData);
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
        const result = await response.json();

        if (response.ok) {
          console.log(selectedUser);
        }

        if (!response.ok) {
          console.error("User fetch error:", result);
          return;
        }
       // If your API wraps user data in `data`
       const userData = result.data || result; 
  
       setSelectedUser(userData);
       console.log("Fetched user:", userData);
       console.log("User DOB:", userData?.dob);
     } catch (error) {
       console.error("Fetch error:", error);
     }
    }
  };

  //This React hook calculates a user's age based on their date of birth (dob) and returns the age on General family form by create.
  const dob = selectedUser?.[0]?.dob;
  const patientCalAge = useCalculateAge(dob);
  console.log("DOB", patientCalAge);

  const closeGenFamily = () => {
    setgetFamilyModal(false);
    setviewGenFamilyModel(false);
    setGeneditModal(false);
    setEditIndividualmodal(false);
  };

  //Datatable column data start
  const tableColumns = [
    {  name: `${getTranslation('GKS ID/GKS आईडी' , lang)}`, selector: (row) => row.gks_id || row.custom_code || row.uid || "N/A", sortable: true, center: true },
    {
     name: `${getTranslation('Patient name/रोगी का नाम' , lang)}`,
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
    { name: `${getTranslation('Email/ईमेल' , lang)}`, selector: (row) => row.email, sortable: true, center: true },
    { name: `${getTranslation('Patient Phone/मरीज़ का फ़ोन' , lang)}`, selector: (row) => row.phone, sortable: true, center: true },
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
      name: `${getTranslation('Action/क्रिया' , lang)}`,
      center: true,
      cell: (row) => {
        // Hide all actions if discharged
        if (row.dischargeStatus === 1) {
          return null;
        }

        return (
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
                onClick={() => handleGenEditPreeFillData(row.recentGenfamID)}
                style={{ cursor: "pointer" }}
                title={getTranslation("Readmission PFA/पुनः प्रवेश पीएफए",lang)}
              >
                ✏️
              </span>
            )}

            {/* Show Create PFA if not discharged and not readmission */}
            {/* {row.dischargeStatus === 0 && row.isReadmission === 0 && (
              <span
                onClick={() => createGenFamilyToggle(row.id)}
                style={{ cursor: "pointer" }}
                title="Create Gen Family Form"
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
    onClick={() => createGenFamilyToggle(row.id)}
    style={{
      cursor: "pointer",
    }}
    title={getTranslation("Create Gen Family Form/जनरल फैमिली फॉर्म बनाएं",lang)}
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
    { name: `${getTranslation('GKS ID/GKS आईडी' , lang)}`, selector: (row) => row.gks_id, sortable: true, center: true },
    {
      name: `${getTranslation('Patient name/रोगी का नाम' , lang)}`,
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
    { name: `${getTranslation('Email/ईमेल' , lang)}`,  selector: (row) => row.genfamiltEmail, sortable: true, center: true },
    { name: `${getTranslation('Patient Phone/मरीज़ का फ़ोन' , lang)}`, selector: (row) => row.genfamiltNumber, sortable: true, center: true },
    {
     name: `${getTranslation('Status/स्थिति' , lang)}`,
      selector: (row) => row.genFammiltStatus,
      cell: (row) => (
        <span className="badge bg-success p-2 text-white" style={{ color: row.disabled ? "#999" : "#000" }}>
          {row.genFammiltStatus}
        </span>
      ),
    },
    {
     name: `${getTranslation('Action/क्रिया' , lang)}`,
      center: true,
      cell: (row) => (
        <div className="d-flex gap-2">
          {row.status === "Pending" ? (
            // Show only Create icon for Pending
            <span
              onClick={() => createGenFamilyToggle(row.id)}
              style={{ cursor: "pointer" }}
              title={getTranslation("Create PFA/पीएफए ​​बनाएं",lang)}
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
                onClick={() => viewGenFamily(row.user_id)}
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
                onClick={() => handleGenFamilyData(row.user_id)}
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


            </>
          )}
        </div>
      ),
    },
  ];


  //Registered Patient Data
  const [data, setData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [stillLoading, setstillLoading] = useState(true);
  useEffect(() => {

    if (!selectedBranch) return; // avoid empty branch fetch

    const token = localStorage.getItem("Authorization");

    fetch(`https://gks-yjdc.onrender.com/api/users?branch_id=${selectedBranch}`, {
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
        const users = res.data || []; // <-- FIXED

        const formatted = users.map((user) => {
          const admitDate = user.recent_admit_date
            ? new Date(user.recent_admit_date)
            : null;
          const genfamilyDate = user.recent_gen_fam_date
            ? new Date(user.recent_gen_fam_date)
            : null;

            let isGenFamCompleted = false;

          let userStatus = <p className="badge bg-warning text-dark p-2">{getTranslation("Pending/लंबित",lang)}</p>;
          if (admitDate && genfamilyDate && admitDate > genfamilyDate) {
            isGenFamCompleted = true;
            userStatus = <p className="badge bg-success p-2">{getTranslation("Completed/पुरा होना।",lang)}</p>;
          }

          const dischargeStatus = user.discharge_status_text || "Unknown";

          return {
            id: user.user_id,
            recentGenfamID: user.recent_gen_fam_id,
            gks_id: user.gks_id || user.custom_code || user.uid || "N/A",
            name: user.name,
            email: user.email,
            phone: user.phone,
            status: userStatus,
            isGenFamCompleted,
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
  }, [selectedBranch]);

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

  const initialGenFamilyFormData = {
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
        uses_alone: "No",
        moody: "No",
        worried: "No",
        sad: "No",
        lacks_confidence: "No",
        stubborn: "No",
        aggressive: "No",
        uses_slang: "No",
        disrespects_parents: "No",
        fights_argue: "No",
        vandalizes: "No",
        fights_at_home: "No",
        tells_lies: "No",
        too_expensive: "No",
        theft: "No",
        borrows: "No",
        gambles: "No",
        bluffs: "No",
        admits_mistake: "No",
        irresponsible: "No",
        selfish: "No",
        has_empathy: "No",
        lazy: "No",
        nervous_anxiety_symptoms: "No",
        emotional_post_use: "No",
        prioritizes_substance: "No",
        feels_guilty: "No",
        avoids_people: "No",
        sleep_eat_problem: "No",
        uses_knowing_consequence: "No",
        suicide_thoughts: "No",
        loved_one_dependence: "No",
      },

    
    // patient_behavior: {
    //   life_priority: "",
    //   life_aim: "",
    //   //Patient behaviour table options
    //   uses_alone: "",
    //   moody: "",
    //   worried: "",
    //   sad: "",
    //   lacks_confidence: "",
    //   stubborn: "",
    //   aggressive: "",
    //   uses_slang: "",
    //   disrespects_parents: "",
    //   fights_argue: "",
    //   vandalizes: "",
    //   fights_at_home: "",
    //   tells_lies: "",
    //   too_expensive: "",
    //   theft: "",
    //   borrows: "",
    //   gambles: "",
    //   bluffs: "",
    //   admits_mistake: "",
    //   irresponsible: "",
    //   selfish: "",
    //   has_empathy: "",
    //   lazy: "",
    //   nervous_anxiety_symptoms: "",
    //   emotional_post_use: "",
    //   prioritizes_substance: "",
    //   feels_guilty: "",
    //   avoids_people: "",
    //   sleep_eat_problem: "",
    //   uses_knowing_consequence: "",
    //   suicide_thoughts: "",
    //   loved_one_dependence: "",
    // },

    //consents info value
    consent: "Yes",
    consent_name: "",
    relationship: "",
    signature: "",
    prepared_by: "",
  };

  const [formData, setFormData] = useState(initialGenFamilyFormData);

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
  
    // Update formData safely
    const updated = [...formData.treatment_records];
    updated[index][name] = value;
  
    setFormData((prev) => ({
      ...prev,
      treatment_records: updated,
    }));
  
    // ✅ Only update GenfamiltEditData if it exists
    if (GenfamiltEditData) {
      const updatedRecords = [...(GenfamiltEditData.treatment_records || [])];
      if (!updatedRecords[index]) updatedRecords[index] = {};
      updatedRecords[index][name] = value;
  
      setGenfamilyEditData((prev) => ({
        ...prev,
        treatment_records: updatedRecords,
      }));
    }
  };
  

  // const handleTreatmentInputChange = (index, e) => {
  //   const { name, value } = e.target;
  //   //Chief Complaint
  //   const updated = [...formData.treatment_records];
  //   updated[index][name] = value;
  //   setFormData((prev) => ({
  //     ...prev,
  //     treatment_records: updated,
  //   }));

  //   const updatedRecords = [...GenfamiltEditData.treatment_records];
  //   updatedRecords[index][name] = value;

  //   setGenfamilyEditData((prev) => ({
  //     ...prev,
  //     treatment_records: updatedRecords,
  //   }));
  // };



  // {/*Chief Complaint*/} and
  // Relationship & Family Status table  row data
  const handleMemberInputChange = (index, e) => {
    const { name, value } = e.target;
  
    // ✅ Update formData safely
    const updatedMembers = [...(formData.members || [])];
    if (!updatedMembers[index]) updatedMembers[index] = {}; // ensure row exists
    updatedMembers[index][name] = value;
  
    setFormData((prev) => ({
      ...prev,
      members: updatedMembers,
    }));
  
    // ✅ Update GenfamiltEditData safely
    setGenfamilyEditData((prev) => {
      const prevMembers = prev?.members || [];
      const editupdatedMembers = [...prevMembers];
      if (!editupdatedMembers[index]) editupdatedMembers[index] = {};
      editupdatedMembers[index][name] = value;
  
      return {
        ...prev,
        members: editupdatedMembers,
      };
    });
  };
  

  // const handleMemberInputChange = (index, e) => {
  //   const { name, value } = e.target;

  //   const updatedMembers = [...formData.members];
  //   updatedMembers[index][name] = value;

  //   setFormData((prev) => ({
  //     ...prev,
  //     members: updatedMembers,
  //   }));

  //   const editupdatedMembers = [...GenfamiltEditData.members];
  //   editupdatedMembers[index][name] = value;

  //   setGenfamilyEditData((prev) => ({
  //     ...prev,
  //     members: editupdatedMembers,
  //   }));
  // };

  // ✅ Add a new treatment record row
  // {/*Chief Complaint*/}
  const addTreatmentRow = () => {
    const newRow = {
      treatment_year: "",
      treatment_place: "",
      treatment_duration: "",
      days_of_sobriety: "",
    };
  
    // Always safe for formData (you already initialize it)
    setFormData((prev) => ({
      ...prev,
      treatment_records: [...prev.treatment_records, newRow],
    }));
  
    // ✅ Safe check for GenfamilyEditData
    setGenfamilyEditData((prev) => {
      const prevRecords = prev?.treatment_records || [];
      return {
        ...prev,
        treatment_records: [...prevRecords, newRow],
      };
    });
  };
  
  // const addTreatmentRow = () => {
  //   setFormData((prev) => ({
  //     ...prev,
  //     treatment_records: [
  //       ...prev.treatment_records,
  //       {
  //         treatment_year: "",
  //         treatment_place: "",
  //         treatment_duration: "",
  //         days_of_sobriety: "",
  //       },
  //     ],
  //   }));

  //   setGenfamilyEditData((prev) => ({
  //     ...prev,
  //     treatment_records: [
  //       ...prev.treatment_records,
  //       {
  //         treatment_year: "",
  //         treatment_place: "",
  //         treatment_duration: "",
  //         days_of_sobriety: "",
  //       },
  //     ],
  //   }));
  // };
  

  //Interference relation table add row
  // const addInterferenceRow = () => {
  //   setFormData((prev) => ({
  //     ...prev,
  //     members: [
  //       ...prev.members,
  //       {
  //         name: "",
  //         relation: "",
  //         age: "",
  //         living_status: "",
  //         physical_disorder: "",
  //       },
  //     ],
  //   }));

  //   //gen family pre fill data
  //   setGenfamilyEditData((prev) => ({
  //     ...prev,
  //     members: [
  //       ...prev.members,
  //       {
  //         name: "",
  //         relation: "",
  //         age: "",
  //         living_status: "",
  //         physical_disorder: "",
  //       },
  //     ],
  //   }));
  // };
  // Interference relation table add row
const addInterferenceRow = () => {
  setFormData((prev) => ({
    ...prev,
    members: [
      ...(prev.members || []), // fallback to [] if undefined
      {
        name: "",
        relation: "",
        age: "",
        living_status: "",
        physical_disorder: "",
      },
    ],
  }));

  // gen family pre fill data
  setGenfamilyEditData((prev) => {
    const safePrev = prev || {}; // fallback to empty object
    return {
      ...safePrev,
      members: [
        ...(safePrev.members || []), // fallback to []
        {
          name: "",
          relation: "",
          age: "",
          living_status: "",
          physical_disorder: "",
        },
      ],
    };
  });
  
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
  // const handleFamilyHistoryChange = (side, relation, field, value) => {
  //   setFormData((prev) => ({
  //     ...prev,
  //     family_history_data: {
  //       ...prev.family_history_data,
  //       [side]: {
  //         ...prev.family_history_data[side],
  //         [relation]: {
  //           ...prev.family_history_data[side][relation],
  //           [field]: value,
  //         },
  //       },
  //     },
  //   }));

  //   setGenfamilyEditData((prev) => ({
  //     ...prev,
  //     family_history_data: {
  //       ...prev.family_history_data,
  //       [side]: {
  //         ...prev.family_history_data[side],
  //         [relation]: {
  //           ...prev.family_history_data[side][relation],
  //           [field]: value,
  //         },
  //       },
  //     },
  //   }));
  // };
  // Family History change handler
const handleFamilyHistoryChange = (side, relation, field, value) => {
  // ✅ Update formData safely
  setFormData((prev) => {
    const prevHistory = prev.family_history_data || {};
    const prevSide = prevHistory[side] || {};
    const prevRelation = prevSide[relation] || {};

    return {
      ...prev,
      family_history_data: {
        ...prevHistory,
        [side]: {
          ...prevSide,
          [relation]: {
            ...prevRelation,
            [field]: value,
          },
        },
      },
    };
  });

  // ✅ Update GenfamilyEditData safely
  setGenfamilyEditData((prev) => {
    const prevHistory = prev?.family_history_data || {};
    const prevSide = prevHistory[side] || {};
    const prevRelation = prevSide[relation] || {};

    return {
      ...prev,
      family_history_data: {
        ...prevHistory,
        [side]: {
          ...prevSide,
          [relation]: {
            ...prevRelation,
            [field]: value,
          },
        },
      },
    };
  });
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
        ...(formData.source_any_other === "Yes" && formData.source_other_text && formData.source_other_text.trim() !== ""
          ? { source_other_text: formData.source_other_text.trim() }
          : {}),
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
      const branch_id = selectedBranch; // make sure `selectedBranch` 
      const token = localStorage.getItem("Authorization");

      console.log("Payload to be sent:", JSON.stringify(payload));

      //Normal create gen family
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/gen-family/create-gen-family?branch_id=${branch_id}`,
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
          title: getTranslation("Submission Failed/सबमिशन विफल",lang),
          text: result.message || getTranslation("Server error/सर्वर त्रुटि",lang),
        });
        return;
      }


      setIsLoading(false);
      const userTargetId = selectedUser?.[0]?.user_id || selectedUser?.[0]?.id || selectedUser?.user_id || selectedUser?.id || currentGenFamilyUserId;
      clearDraft("general_family", userTargetId);
      setDraftTimestamp(null);
      setgetFamilyModal(false);

      Swal.fire({
        icon: "success",
        title: getTranslation("Assessment Submitted/मूल्यांकन प्रस्तुत किया गया", lang),
      });

      // ✅ Fetch all users and update table in 1 single fast API call
      try {
        const usersResponse = await fetch(
          `https://gks-yjdc.onrender.com/api/users?branch_id=${branch_id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `${token}`,
            },
          }
        );

        if (usersResponse.ok) {
          const res = await usersResponse.json();
          const users = res.data || [];
          const formatted = users.map((user) => {
            const admitDate = user.recent_admit_date ? new Date(user.recent_admit_date) : null;
            const genfamilyDate = user.recent_gen_fam_date ? new Date(user.recent_gen_fam_date) : null;
            let isGenFamCompleted = false;
            let userStatus = <p className="badge bg-warning text-dark p-2">{getTranslation("Pending/लंबित", lang)}</p>;
            if (admitDate && genfamilyDate && admitDate > genfamilyDate) {
              isGenFamCompleted = true;
              userStatus = <p className="badge bg-success p-2">{getTranslation("Completed/पुरा होना।", lang)}</p>;
            }
            const dischargeStatus = user.discharge_status_text || "Unknown";
            return {
              id: user.user_id,
              recentGenfamID: user.recent_gen_fam_id,
              gks_id: user.gks_id || user.custom_code || user.uid || "N/A",
              name: user.name,
              email: user.email,
              phone: user.phone,
              status: userStatus,
              isGenFamCompleted,
              dischargeStatus: user.discharge_status,
              dischargeStatusText: dischargeStatus,
              isReadmission: user.is_readmission,
              recent_gen_fam_id: user.recent_gen_fam_id,
            };
          });
          setData(formatted);
          setFilteredData(formatted);
        }
      } catch (refreshErr) {
        console.error("Failed to refresh table:", refreshErr);
      }
    } catch (error) {
      setIsLoading(false);
      Swal.fire({
        icon: "error",
        title: getTranslation("Unexpected Error/अप्रत्याशित त्रुटि",lang),
        text: getTranslation("Gen Family failed! Unknown error occurred./जनरल फ़ैमिली फ़ेल हो गई! अनजान एरर हुआ",lang),
      });
    }
  };



  const [viewGenFamilyModel, setviewGenFamilyModel] = useState(false);
  const [viewgenData, setviewgenData] = useState(null);

  const viewGenFamily = async (userId = null) => {
    if (typeof userId === "object" && userId !== null) {
      userId = userId.id || userId.user_id;
    }

    if (!userId) {
      console.error("Invalid userId provided");
      return;
    }

    setviewgenData(null);
    setviewGenFamilyModel(true);
    setIsLoading(true);

    const token = localStorage.getItem("Authorization");
    const branch_id = selectedBranch?.branch_id || selectedBranch?.id || selectedBranch || "";

    try {
      // Step 1: get gen_fam_id
      let response = await fetch(
        `https://gks-yjdc.onrender.com/api/gen-family/user-gen-families/${userId}?branch_id=${branch_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        }
      );

      let famIdData = await response.json();

      if (!response.ok || !famIdData.data || !famIdData.data.length) {
        const fallbackRes = await fetch(
          `https://gks-yjdc.onrender.com/api/gen-family/user-gen-families/${userId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `${token}`,
            },
          }
        );
        if (fallbackRes.ok) {
          famIdData = await fallbackRes.json();
        }
      }

      if (!famIdData.data || !famIdData.data.length) {
        console.error("Failed to get gen_fam_id");
        return;
      }

      const gen_fam_id = famIdData.data[0].gen_family.gen_fam_id;

      // Step 2: Get full gen-family data
      let fullDataResponse = await fetch(
        `https://gks-yjdc.onrender.com/api/gen-family/gen-family/${gen_fam_id}?branch_id=${branch_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        }
      );

      let fullData = await fullDataResponse.json();

      if (!fullDataResponse.ok || !fullData.data) {
        const fallbackFull = await fetch(
          `https://gks-yjdc.onrender.com/api/gen-family/gen-family/${gen_fam_id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `${token}`,
            },
          }
        );
        if (fallbackFull.ok) {
          fullData = await fallbackFull.json();
        }
      }

      if (fullData.data) {
        setviewgenData(fullData.data);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
 



  //state variable for readmission gen family
  const [GenfamiltEditData, setGenfamilyEditData] = useState(null);
  const [GeneditModal, setGeneditModal] = useState(false);

  const handleGenEditPreeFillData = async (recentGenfamID = null) => {
    if (typeof recentGenfamID === "object" && recentGenfamID !== null) {
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
    const branch_id = selectedBranch; // make sure `selectedBranch` 
    try {
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/gen-family/gen-family/${recentGenfamID}?branch_id=${branch_id}`,
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

      console.log("occupational_status", GenfamiltEditData.occupational_status)

    } catch (error) {
      console.error("Fetch error:", error);
    }

    setviewGenFamilyModel((setGeneditModal) => !setGeneditModal);
  }

  //Recreate the GenFamily entry using the latest ID, and fetch all data to refill the form for editing when the pending icon is clicked.



  const handleGenFamilyReadmission = async () => {
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
        ...(GenfamiltEditData.source_any_other === "Yes" && GenfamiltEditData.source_other_text && GenfamiltEditData.source_other_text.trim() !== ""
          ? { source_other_text: GenfamiltEditData.source_other_text.trim() }
          : {}),
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
      const branch_id = selectedBranch; // make sure `selectedBranch` 
      const token = localStorage.getItem("Authorization");

      //Readmission PFA API
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/gen-family/create-gen-family?branch_id=${branch_id}`,
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
        const errorMsg =
          result.errors && Array.isArray(result.errors) && result.errors.length > 0
            ? result.errors.map((e) => e.message || e.msg || JSON.stringify(e)).join("\n")
            : (result.message || getTranslation("Server error/सर्वर त्रुटि", lang));
        Swal.fire({
          icon: "error",
          title: getTranslation("Readmission Submission Failed/पुनः प्रवेश सबमिशन विफल", lang),
          text: errorMsg,
        }).then(() => {
          setIsLoading(false);
        });
        return;
      }
      // ✅ Success Case
      setIsLoading(false);
      Swal.fire({
        icon: "success",
        title: getTranslation("Gen Familt Readmission Created Successfully/Gen Familt रीडमिशन सफलतापूर्वक बनाया गया",lang),
        text: getTranslation("The Gen Family readmission was submitted successfully./जेन फैमिली का रीडमिशन सफलतापूर्वक सबमिट कर दिया गया।",lang),
      }).then(() => {
        // This runs after the user clicks "OK"
        // setModal(false);
      });
    } catch (error) {
      setIsLoading(false);
      Swal.fire({
        icon: "error",
        title: getTranslation("Unexpected Error/अप्रत्याशित त्रुटि",lang),
        text: getTranslation("Gen Family Readmission failed! Unknown error occurred./Gen Family Readmission फेल हो गया! कोई अनजान एरर हुआ।",lang),
      });
    }
  }



  //Get all gen family data
  const [getgenfamData, setgenfamData] = useState([]);
  const [genFilterData, setgenFilterData] = useState([]);

  useEffect(() => {

    if (!selectedBranch) return; // avoid empty branch fetch

    const token = localStorage.getItem("Authorization");

    fetch(`https://gks-yjdc.onrender.com/api/gen-family/all-entries?branch_id=${selectedBranch}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch Gen Family all list details data");
        return response.json();
      })
      .then((res) => {
        const genfamiltEntries = res.data || [];
        console.log("genfamily all data", genfamiltEntries)

        const genfamiltallEntriesData = genfamiltEntries.map((list) => {
          return {
            // gen_fam_id:list.gen_fam_id,
            genFamilyPateintname: list.user?.name || list.name || "Patient",
            genFammiltStatus: list.consent?.status || list.status || "Pending",
            genfamiltEmail: list.user?.email || list.email || "N/A",
            genfamiltNumber: list.user?.phone || list.phone || "N/A",
            gks_id: list.user?.gks_id || list.user?.custom_code || list.user?.uid || list.gks_id || list.custom_code || list.uid || list.user?.user_id || "N/A",
            user_id: list.user?.user_id || list.user_id || list.id,

          }
        });

        console.log("genfamiltallEntriesData", genfamiltallEntriesData);
        setTimeout(() => {
          setgenfamData(genfamiltallEntriesData);
          setgenFilterData(genfamiltallEntriesData);
          setstillLoading(false);
        }, 1000);
      })
      .catch((error) => {
        console.error("Error fetching Gen Family data:", error);
        setstillLoading(true);
      })
  }, [selectedBranch])




  //Edit individual gen family from data hanlder
  const [genEditIndividualmodal,setEditIndividualmodal]=useState(false);

  const handleGenFamilyData = async (userId = null) => {
    setEditIndividualmodal(true);
    console.log("userId =>", userId);
  
    if (typeof userId === "object" && userId !== null) {
      userId = userId.id;
    }
  
    if (!userId) {
      console.error("Invalid userId provided");
      return;
    }
  
    const token = localStorage.getItem("Authorization");
    const branch_id = selectedBranch; // make sure `selectedBranch` comes from your BranchContext
  
    try {
     
      // Step 1: Get gen_fam_id from user-gen-family
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/gen-family/user-gen-families/${userId}?branch_id=${branch_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        }
      );
  
      const famIdData = await response.json();
  
      if (!response.ok || !famIdData.data || !famIdData.data.length) {
        console.error("Failed to get gen_fam_id");
        return;
      }
  
      console.log("famIdData By User ID:=>", famIdData);
  
      const gen_fam_id = famIdData.data[0].gen_family.gen_fam_id;
      console.log("gen_fam_id =>", gen_fam_id);
  
      // Step 2: Fetch full GenFamily data using gen_fam_id
      const genFamResponse = await fetch(
        `https://gks-yjdc.onrender.com/api/gen-family/gen-family/${gen_fam_id}?branch_id=${branch_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        }
      );
  
      const data = await genFamResponse.json();
console.log("Latest GenFamily Data:", data);

if (!genFamResponse.ok || !data || !data.data) {
  console.error("Failed to fetch GenFamily details");
  return;
}

// ✅ Extract actual payload
const latestGenFamilyData = data.data;

console.log(latestGenFamilyData.substance_use_dependency)
  
      if (!latestGenFamilyData) {
        console.warn("No GenFamily data found");
        return;
      }
  
      setGenfamilyEditData({
        ...latestGenFamilyData?.gen_family,   // basic info

      
        treatment_records: latestGenFamilyData.treatment_history?.treatment_records || [],

        ...latestGenFamilyData?.treatment_history, 

        members: latestGenFamilyData.family_members?.members || [],
        family_history_data: latestGenFamilyData.family_members?.family_history_data || {},

        ...latestGenFamilyData?.family_info,
        ...latestGenFamilyData?.family_members,
        ...latestGenFamilyData?.childhood_history,
        ...latestGenFamilyData?.education_employment,
        ...latestGenFamilyData?.social_behavior,
        ...latestGenFamilyData?.legal_history,
        ...latestGenFamilyData?.consent_info,

        
        

        
        
      
        // ✅ Substance Use Dependency mapping added
        ...latestGenFamilyData.substance_use_dependency,
        
         
      
        // ✅ Patient behaviour mapping stays the same

        ...latestGenFamilyData.patient_behavior,

        patientBehaviour: {
          life_priority: latestGenFamilyData.patient_behavior?.life_priority,
        life_aim: latestGenFamilyData.patient_behavior?.life_aim,
          uses_alone: latestGenFamilyData.patient_behavior?.uses_alone,
          moody: latestGenFamilyData.patient_behavior?.moody,
          worried: latestGenFamilyData.patient_behavior?.worried,
          sad: latestGenFamilyData.patient_behavior?.sad,
          lacks_confidence: latestGenFamilyData.patient_behavior?.lacks_confidence,
          stubborn: latestGenFamilyData.patient_behavior?.stubborn,
          aggressive: latestGenFamilyData.patient_behavior?.aggressive,
          uses_slang: latestGenFamilyData.patient_behavior?.uses_slang,
          disrespects_parents: latestGenFamilyData.patient_behavior?.disrespects_parents,
          fights_argue: latestGenFamilyData.patient_behavior?.fights_argue,
          vandalizes: latestGenFamilyData.patient_behavior?.vandalizes,
          fights_at_home: latestGenFamilyData.patient_behavior?.fights_at_home,
          tells_lies: latestGenFamilyData.patient_behavior?.tells_lies,
          too_expensive: latestGenFamilyData.patient_behavior?.too_expensive,
          theft: latestGenFamilyData.patient_behavior?.theft,
          borrows: latestGenFamilyData.patient_behavior?.borrows,
          gambles: latestGenFamilyData.patient_behavior?.gambles,
          bluffs: latestGenFamilyData.patient_behavior?.bluffs,
          admits_mistake: latestGenFamilyData.patient_behavior?.admits_mistake,
          irresponsible: latestGenFamilyData.patient_behavior?.irresponsible,
          selfish: latestGenFamilyData.patient_behavior?.selfish,
          has_empathy: latestGenFamilyData.patient_behavior?.has_empathy,
          lazy: latestGenFamilyData.patient_behavior?.lazy,
          nervous_anxiety_symptoms: latestGenFamilyData.patient_behavior?.nervous_anxiety_symptoms,
          emotional_post_use: latestGenFamilyData.patient_behavior?.emotional_post_use,
          prioritizes_substance: latestGenFamilyData.patient_behavior?.prioritizes_substance,
          feels_guilty: latestGenFamilyData.patient_behavior?.feels_guilty,
          avoids_people: latestGenFamilyData.patient_behavior?.avoids_people,
          sleep_eat_problem: latestGenFamilyData.patient_behavior?.sleep_eat_problem,
          uses_knowing_consequence: latestGenFamilyData.patient_behavior?.uses_knowing_consequence,
          suicide_thoughts: latestGenFamilyData.patient_behavior?.suicide_thoughts,
          loved_one_dependence: latestGenFamilyData.patient_behavior?.loved_one_dependence,
        }
      });
      
      
  
      
      console.log("patientBehaviour", latestGenFamilyData.patientBehaviour);
      console.log("occupational_status", latestGenFamilyData.occupational_status);
  
    } catch (error) {
      console.error("Fetch error:", error);
    }
  
    
  };



  const handleUpdateIndividualGenFammilyData = async () => {
    setIsLoading(true);
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
        // entry_id: GenfamiltEditData.entry_id,
        // visit_no: GenfamiltEditData.visit_no,
        // isActive: GenfamiltEditData.isActive,
        // name: GenfamiltEditData.name,
        // relative_name: GenfamiltEditData.relative_name,
        // email: GenfamiltEditData.email,
        // gender: GenfamiltEditData.gender,
        // phone: GenfamiltEditData.phone,
        // Branch_id: GenfamiltEditData.Branch_id,
        // dob: GenfamiltEditData.dob,
        // custom_code: GenfamiltEditData.custom_code,
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
        ...(GenfamiltEditData.source_any_other === "Yes" && GenfamiltEditData.source_other_text && GenfamiltEditData.source_other_text.trim() !== ""
          ? { source_other_text: GenfamiltEditData.source_other_text.trim() }
          : {}),
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
      const branch_id = selectedBranch; // make sure `selectedBranch` comes from your BranchContext
      const token = localStorage.getItem("Authorization");

      //Readmission PFA API
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/gen-family/update-gen-family/${GenfamiltEditData.gen_fam_id}?branch_id=${branch_id}`,
        {
          method: "PUT",
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
        const errorMsg =
          result.errors && Array.isArray(result.errors) && result.errors.length > 0
            ? result.errors.map((e) => e.message || e.msg || JSON.stringify(e)).join("\n")
            : (result.message || getTranslation("Server error/सर्वर त्रुटि", lang));
        Swal.fire({
          icon: "error",
          title: getTranslation("Readmission Submission Failed/पुनः प्रवेश सबमिशन विफल", lang),
          text: errorMsg,
        }).then(() => {
          setIsLoading(false);
        });
        return;
      }
      // ✅ Success Case
      
      Swal.fire({
        icon: "success",
        title: getTranslation("Gen Familt Readmission Created Successfully/Gen Familt रीडमिशन सफलतापूर्वक बनाया गया",lang),
        text: getTranslation("The Gen Family readmission was submitted successfully./जेन फैमिली का रीडमिशन सफलतापूर्वक सबमिट कर दिया गया।",lang),
      }).then(() => {
        // This runs after the user clicks "OK"
        setEditIndividualmodal(false);
      });
    } catch (error) {
      setIsLoading(false);
      Swal.fire({
        icon: "error",
        title: getTranslation("Unexpected Error/अप्रत्याशित त्रुटि",lang),
        text: getTranslation("Gen Family Readmission failed! Unknown error occurred./Gen Family Readmission फेल हो गया! कोई अनजान एरर हुआ।",lang),
      });
    }
  }

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
      {/* Fill general family form start */}
      {/* <Btn attrBtn={{ color: "primary", onClick: getfamiltToggle }}>
        {"General Family Form"}
      </Btn> */}
      <CommonModal
        isOpen={genFamilyModal}
        title={getTranslation(patientPersonalInformation,lang)}
        toggler={closeGenFamily}
        maxWidth="1200px"
      >
        <div className="genFamily__wrapper container">
          <DraftNoticeBanner
            draftTimestamp={draftTimestamp}
            formKey="general_family"
            targetId={selectedUser?.[0]?.user_id || selectedUser?.[0]?.id || selectedUser?.user_id || selectedUser?.id || currentGenFamilyUserId}
            onDiscard={() => {
              setFormData(initialGenFamilyFormData);
              setDraftTimestamp(null);
            }}
          />
          {/* <h5>{patientPersonalInformation}</h5> */}
          <Form className="theme-form" onSubmit={handleGeneralFamilySubmit}>

            {/*Patient Name and sex/age section*/}
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

            {/* <Form className="theme-form"> */}
            {/*UID*/}
            {/*UID & Date of Form Filling*/}
            <div className="row g-3 pt-3 pb-2">
              <div className="col-12 col-md-6">
                <FormGroup className="mb-3">
                  <Label>
                    {getTranslation(UID,lang)}
                  </Label>
                  <Input
                    className="form-control"
                    type="text"
                    name="genUID"
                    value={formData.genUID}
                    onChange={onChangeEventHandler}
                  />
                </FormGroup>
              </div>

              <div className="col-12 col-md-6">
                <FormGroup className="mb-3">
                  <Label>
                    {getTranslation(dateOfFormFilling,lang)}
                  </Label>
                  <DatePicker 
                    showMonthDropdown 
                    showYearDropdown 
                    dropdownMode="select"
                    className="form-control digits"
                    selected={safeDate(formData.dateOfFormFilling)}
                    onChange={(date) =>
                      handleChangeFormFilling("dateOfFormFilling", date)
                    }
                  />
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
                      <DatePicker showMonthDropdown showYearDropdown dropdownMode="select"
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
                <Label>{getTranslation(occupation,lang)}</Label>
                {/* <Input
                  type="text"
                  className="form-control mt-2"
                  // placeholder="Enter your occupational status/"
                  name="occupational_status"
                  value={formData.occupational_status}
                  onChange={onChangeEventHandler}
                /> */}
                <select
  className="form-control mt-2"
  name="occupational_status"
  value={formData.occupational_status}
  onChange={onChangeEventHandler}
>
  <option value="">{getTranslation("Select / चुनें",lang)}</option>
  <option value="Business">{getTranslation("Business/व्यापार",lang)}</option>
  <option value="Student">{getTranslation("Student/विद्यार्थी",lang)}</option>
  <option value="Family Business">{getTranslation("Family Business/पारिवारिक व्यवसाय",lang)}</option>
  <option value="Farming">{getTranslation("Farming/खेती",lang)}</option>
  <option value="Not Working">{getTranslation("Not Working/काम नहीं कर",lang)}</option>
  <option value="NA">{getTranslation("NA/ना",lang)}</option>
</select>

              </div>

              {/*Marital Status*/}
              <div className="col-md-3">
                <Label>{getTranslation(marital,lang)}</Label>
                {/* <Input
                  type="text"
                  className="form-control mt-2"
                  // placeholder="Enter your marital status"
                  name="marital_status"
                  value={formData.marital_status}
                  onChange={onChangeEventHandler}
                /> */}
                <select
  className="form-control mt-2"
  name="marital_status"
  value={formData.marital_status}
  onChange={onChangeEventHandler}
>
  <option value="">
    {getTranslation("Select / चुनें", lang)}
  </option>
  <option value="Single">
    {getTranslation("Single / अकेला", lang)}
  </option>
  <option value="Married">
    {getTranslation("Married / विवाहित", lang)}
  </option>
  <option value="Separated">
    {getTranslation("Separated / अलग किए", lang)}
  </option>
  <option value="Separated due to addiction">
    {getTranslation("Separated due to addiction / नशे की लत के कारण अलग हो गए", lang)}
  </option>
  <option value="Widower">
    {getTranslation("Widower / विधुर", lang)}
  </option>
</select>

              </div>

              {/*Living Situation*/}
              <div className="col-md-3">
                <Label>{getTranslation(living,lang)}</Label>
                {/* <Input
                  type="text"
                  className="form-control mt-2"
                  // placeholder="Enter your living situation"
                  name="living_situation"
                  value={formData.living_situation}
                  onChange={onChangeEventHandler}
                /> */}

<select
  className="form-control mt-2"
  name="living_situation"
  value={formData.living_situation}
  onChange={onChangeEventHandler}
>
  <option value="">
    {getTranslation("Select / चुनें", lang)}
  </option>
  <option value="With Family">
    {getTranslation("With Family / परिवार के साथ", lang)}
  </option>
  <option value="Single for Job">
    {getTranslation("Single for Job / नौकरी के लिए सिंगल", lang)}
  </option>
  <option value="Single for Study">
    {getTranslation("Single for Study / पढ़ाई के लिए सिंगल", lang)}
  </option>
</select>


              </div>
              {/*Religion*/}
              <div className="col-md-3">
                <Label>{getTranslation(religion,lang)}</Label>
                <Input
                  type="text"
                  className="form-control mt-2"
                  // placeholder="Enter your your religion"
                  name="your_religion"
                  value={formData.your_religion}
                  onChange={onChangeEventHandler}
                />
              </div>
            </div>


            {/*End Living Situation and Religion*/}
            {/*Substance Use Dependency / नशीले पदार्थ उपयोग निर्भरता */}
            <h5 className="mt-3">{getTranslation(substanceDependency,lang)}</h5>
            <div className="row pt-3 pb-3">
              {/*Duration of regular use? / कब से पदार्थ निर्भर हैं? */}
              <div className="col-md-3">
                <Label for="custom-duration">{getTranslation(durationOfRegularUse,lang)}</Label>
                <Input
                  type="text"
                  id="custom-duration"
                  name="duration_of_use"
                  value={formData.duration_of_use}
                  onChange={onChangeEventHandler}
                  // placeholder="e.g., 2 years, 6 months"
                />
              </div>
              {/*Daily Spent? / दिनमा कितना पदार्थ उपयोग कर रहे हैं? */}
              <div className="col-md-3">
                <Label for="daily-spent">{getTranslation(dailySpentSubstance,lang)}</Label>
                <Input
                  type="number"
                  id="daily-spent"
                  name="daily_spent_amount"
                  min="0"
                  step="0.01"
                  value={formData.daily_spent_amount}
                  onChange={onChangeEventHandler}
                  // placeholder="Enter amount"
                />
              </div>
              {/*Patient Monthly Income? / महीने में कितना आय हैं? */}
              <div className="col-md-3">
                <Label for="monthly-income">{getTranslation(patienMonthlyIncome,lang)}</Label>
                <Input
                  type="number"
                  id="monthly-income"
                  name="patient_monthly_income"
                  min="0"
                  step="100"
                  value={formData.patient_monthly_income}
                  onChange={onChangeEventHandler}
                  // placeholder="Enter amount"
                />
              </div>
              {/*Family Monthly Income? / महीने में कितना आय हैं? */}
              <div className="col-md-3">
                <Label for="family-income">{getTranslation(familyMonthlyIncome,lang)}</Label>
                <Input
                  type="number"
                  id="family-income"
                  name="family_monthly_income"
                  min="0"
                  step="100"
                  // placeholder="Enter amount"
                  value={formData.family_monthly_income}
                  onChange={onChangeEventHandler}
                />
              </div>
            </div>
            {/*End Substance Use Dependency*/}
            {/*Source of money? Kindly mention which are applicable?पैसे का अरैंजमेंट? कृपया बताएं कि कौन से लागू हैं?*/}
            <h5 className="mt-3">{getTranslation(sourceOfMoney,lang)}</h5>
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
                  <Label htmlFor={source.id}>{getTranslation(source.label,lang)}</Label>

                  {source.id === "source_any_other" &&
                    formData[source.id] === "Yes" && (
                      // <textarea
                      //   className="form-control mt-2"
                      //   rows="3"
                      //   placeholder="Please specify"
                      //   name="source_other_text"
                      //   value={formData.source_other_text || ""}
                      //   onChange={onChangeEventHandler}
                      // />
                      <VoiceTextarea
                      className="form-control mt-2"
                      // label={<Translated text={pateintAddress} />}
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
                  {/* <Label>{getTranslation(Ifarrange,lang)}</Label> */}
                  {/* <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="family_reaction"
                    value={formData.family_reaction}
                    onChange={onChangeEventHandler}
                  /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(Ifarrange,lang)} />}
  name="family_reaction"
  value={formData.family_reaction}
  onChange={onChangeEventHandler}
/>

                </FormGroup>
              </div>
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  {/* <Label>{getTranslation(mentionYear,lang)}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="first_action_when_known"
                    value={formData.first_action_when_known}
                    onChange={onChangeEventHandler}
                  /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(mentionYear,lang)} />}
  name="first_action_when_known"
  value={formData.first_action_when_known}
  onChange={onChangeEventHandler}
/>

                </FormGroup>
              </div>
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  {/* <Label>{getTranslation(action,lang)}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="pattern_of_use"
                    value={formData.pattern_of_use}
                    onChange={onChangeEventHandler}
                  /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(action,lang)} />}
  name="pattern_of_use"
  value={formData.pattern_of_use}
  onChange={onChangeEventHandler}
/>

                </FormGroup>
              </div>
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  {/* <Label>{getTranslation(Residence,lang)}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="residence_status_during_use"
                    value={formData.residence_status_during_use}
                    onChange={onChangeEventHandler}
                  /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(Residence,lang)} />}
  name="residence_status_during_use"
  value={formData.residence_status_during_use}
  onChange={onChangeEventHandler}
/>

                </FormGroup>
              </div>
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  {/* <Label>{getTranslation(experiencedTrauma,lang)}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="trauma_experience"
                    value={formData.trauma_experience}
                    onChange={onChangeEventHandler}
                  /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(experiencedTrauma,lang)} />}
  name="trauma_experience"
  value={formData.trauma_experience}
  onChange={onChangeEventHandler}
/>

                </FormGroup>
              </div>
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  {/* <Label>{getTranslation(occurredPatientBehavior,lang)}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="behavior_change"
                    value={formData.behavior_change}
                    onChange={onChangeEventHandler}
                  /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(occurredPatientBehavior,lang)} />}
  name="behavior_change"
  value={formData.behavior_change}
  onChange={onChangeEventHandler}
/>

                </FormGroup>
              </div>
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  {/* <Label>{getTranslation(sociality,lang)}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="social_circle_change"
                    value={formData.social_circle_change}
                    onChange={onChangeEventHandler}
                  /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(sociality,lang)} />}
  name="social_circle_change"
  value={formData.social_circle_change}
  onChange={onChangeEventHandler}
/>


                </FormGroup>
              </div>
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  {/* <Label>{getTranslation(effectOfSubstance,lang)}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="life_effect"
                    value={formData.life_effect}
                    onChange={onChangeEventHandler}
                  /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(effectOfSubstance,lang)} />}
  name="life_effect"
  value={formData.life_effect}
  onChange={onChangeEventHandler}
/>
                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  {/* <Label>{getTranslation(ChiefComplaint,lang)}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="chief_complaints"
                    value={formData.chief_complaints}
                    onChange={onChangeEventHandler}
                  /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(ChiefComplaint,lang)} />}
  className="form-control"
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
                <h5 className="mt-3 mb-3">{getTranslation(ChiefComplaint,lang)}</h5>

                <Table bordered>
                  <thead>
                    <tr>
                      <th scope="col">{getTranslation(TreatmentOfSubstance,lang)}</th>
                      <th scope="col">{getTranslation(howManyTimes,lang)}</th>
                    </tr>
                    <tr>
                      <th scope="col">{getTranslation(year,lang)}</th>
                      <th scope="col">{getTranslation(placeOfTreatment,lang)}</th>
                      <th scope="col">{getTranslation(durationOfTime,lang)}</th>
                      <th scope="col">{getTranslation(daysOfSobriety,lang)}</th>
                      <th scope="col">{getTranslation(cheifAction,lang)}</th>
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
                            // placeholder="Year"
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
                            // placeholder="Place"
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
                            // placeholder="Duration"
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
                            // placeholder="Sobriety Days"
                          />
                        </td>
                        <td>
                          {index > 0 && (
                            <Button
                              type="button"
                              className="btn btn-danger"
                              onClick={() => removeTreatmentRow(index)}
                            >
                             {getTranslation(" Remove/निकालना",lang)}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                <Button type="button" className="btn btn-secondary mt-3 mb-3" onClick={addTreatmentRow}>
                {getTranslation("+ Add More/ + अधिक जोड़ें",lang)}
                </Button>
              </div>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                {/* <Label>{getTranslation(absuingSubstance,lang)}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="asked_to_stop"
                  value={formData.asked_to_stop}
                  onChange={onChangeEventHandler}
                /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(absuingSubstance,lang)} />}
  className="form-control"
  name="asked_to_stop"
  value={formData.asked_to_stop}
  onChange={onChangeEventHandler}
/>

              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                {/* <Label>{getTranslation(influenceStop,lang)}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="reason_to_stop"
                  value={formData.reason_to_stop}
                  onChange={onChangeEventHandler}
                /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(influenceStop,lang)} />}
  className="form-control"
  name="reason_to_stop"
  value={formData.reason_to_stop}
  onChange={onChangeEventHandler}
/>

              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                {/* <Label>{getTranslation(whenStopUsing,lang)}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="work_after_stop"
                  value={formData.work_after_stop}
                  onChange={onChangeEventHandler}
                /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(whenStopUsing,lang)} />}
  className="form-control"
  name="work_after_stop"
  value={formData.work_after_stop}
  onChange={onChangeEventHandler}
/>

              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                {/* <Label>{getTranslation(itReplaceWhenWhom,lang)}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="relapse_details"
                  value={formData.relapse_details}
                  onChange={onChangeEventHandler}
                /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(itReplaceWhenWhom,lang)} />}
  className="form-control"
  name="relapse_details"
  value={formData.relapse_details}
  onChange={onChangeEventHandler}
/>

              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                {/* <Label>{getTranslation(afterRelapse,lang)}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="post_relapse_change"
                  value={formData.post_relapse_change}
                  onChange={onChangeEventHandler}
                /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(afterRelapse,lang)} />}
  className="form-control"
  name="post_relapse_change"
  value={formData.post_relapse_change}
  onChange={onChangeEventHandler}
/>

              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                {/* <Label>{getTranslation(haveDisorder,lang)}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="mental_physical_issues"
                  value={formData.mental_physical_issues}
                  onChange={onChangeEventHandler}
                /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(haveDisorder,lang)} />}
  className="form-control"
  name="mental_physical_issues"
  value={formData.mental_physical_issues}
  onChange={onChangeEventHandler}
/>

              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                {/* <Label>{getTranslation(isProblmeOrInjury,lang)}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="injuries_due_to_substance"
                  value={formData.injuries_due_to_substance}
                  onChange={onChangeEventHandler}
                /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(isProblmeOrInjury,lang)} />}
  className="form-control"
  name="injuries_due_to_substance"
  value={formData.injuries_due_to_substance}
  onChange={onChangeEventHandler}
/>


              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                {/* <Label>{getTranslation(DiagnosedOnTreatment,lang)}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="diagnosis_treatment"
                  value={formData.diagnosis_treatment}
                  onChange={onChangeEventHandler}
                /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(DiagnosedOnTreatment,lang)} />}
  className="form-control"
  name="diagnosis_treatment"
  value={formData.diagnosis_treatment}
  onChange={onChangeEventHandler}
/>

              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                {/* <Label>{getTranslation(DoctorPlaceDuration,lang)}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="doctor_info"
                  value={formData.doctor_info}
                  onChange={onChangeEventHandler}
                /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(DoctorPlaceDuration,lang)} />}
  className="form-control"
  name="doctor_info"
  value={formData.doctor_info}
  onChange={onChangeEventHandler}
/>

              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                {/* <Label>{getTranslation(ifGone,lang)}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="traditional_treatment"
                  value={formData.traditional_treatment}
                  onChange={onChangeEventHandler}
                /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(ifGone,lang)} />}
  className="form-control"
  name="traditional_treatment"
  value={formData.traditional_treatment}
  onChange={onChangeEventHandler}
/>

              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                {/* <Label>{getTranslation(YouFamiliar,lang)}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="effect_of_treatment"
                  value={formData.effect_of_treatment}
                  onChange={onChangeEventHandler}
                /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(YouFamiliar,lang)} />}
  className="form-control"
  name="effect_of_treatment"
  value={formData.effect_of_treatment}
  onChange={onChangeEventHandler}
/>

              </FormGroup>
            </div>

            {/*Relationship status: रिलेशनशिप स्टेटस ?: */}
            <div className="row">
              <H5 className="mt-3 mb-3">{getTranslation(relationshipFamilyStatus,lang)}</H5>
              <div className="col-md-6">
                <Label htmlFor="marital_status">{getTranslation(relationshipStatus,lang)}</Label>
                {/* <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="relationship_status"
                  value={formData.relationship_status}
                  onChange={onChangeEventHandler}
                /> */}
                <select
  className="form-control"
  name="relationship_status"
  value={formData.relationship_status}
  onChange={onChangeEventHandler}
>
  <option value="">{getTranslation("Select / चुनें", lang)}</option>

  <option value="Single">
    {getTranslation("Single / सिंगल", lang)}
  </option>

  <option value="Married">
    {getTranslation("Married / शादीशुदा", lang)}
  </option>

  <option value="Separated">
    {getTranslation("Separated / अलग", lang)}
  </option>

  <option value="Widower">
    {getTranslation("Widower / विधवा", lang)}
  </option>

  <option value="Committed">
    {getTranslation("Committed / कमिटेड", lang)}
  </option>

  <option value="Broke up">
    {getTranslation("Broke up / ब्रेक अप", lang)}
  </option>
</select>


{/* <VoiceTextarea
  label={<Translated text={getTranslation(relationshipStatus,lang)} />}
  className="form-control"
  name="relationship_status"
  value={formData.relationship_status}
  onChange={onChangeEventHandler}
/> */}

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
                  <Label>{getTranslation(MarriageArrangement,lang)}</Label>
                  {/* <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="marriage_arrangement"
                    value={formData.marriage_arrangement}
                    onChange={onChangeEventHandler}
                  /> */}
                  <select
  className="form-control"
  name="marriage_arrangement"
  value={formData.marriage_arrangement}
  onChange={onChangeEventHandler}
>
  <option value="">{getTranslation("Select / चुनें", lang)}</option>

  <option value="NA">
    {getTranslation("NA / लागू नहीं", lang)}
  </option>

  <option value="Arrange">
    {getTranslation("Arrange / व्यवस्था", lang)}
  </option>

  <option value="Love">
    {getTranslation("Love / प्यार", lang)}
  </option>

  <option value="Love Cum Arrange">
    {getTranslation("Love Cum Arrange / प्यार सह व्यवस्था", lang)}
  </option>
</select>


{/* <VoiceTextarea
  label={<Translated text={getTranslation(MarriageArrangement,lang)} />}
  className="form-control"
  name="marriage_arrangement"
  value={formData.marriage_arrangement}
  onChange={onChangeEventHandler}
/> */}

                </FormGroup>
              </div>

              {/*After marriage life or relationship Status*/}
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  {/* <Label>{getTranslation(afterMerriageLife,lang)}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="post_marriage_status"
                    value={formData.post_marriage_status}
                    onChange={onChangeEventHandler}
                  /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(afterMerriageLife,lang)} />}
  className="form-control"
  name="post_marriage_status"
  value={formData.post_marriage_status}
  onChange={onChangeEventHandler}
/>

                </FormGroup>
              </div>

              {/*Is there interference of wife's family or any relative in the internal matters of your family. If yes than whom & in which affairs*/}
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  {/* <Label>{getTranslation(isThereInterference,lang)}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="relatives_interference"
                    value={formData.relatives_interference}
                    onChange={onChangeEventHandler}
                  /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(isThereInterference,lang)} />}
  className="form-control"
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
                        <th scope="col">{getTranslation(nameisThere,lang)}</th>
                        <th scope="col">{getTranslation(relationisThere,lang)}</th>
                        <th scope="col">{getTranslation(relationisAge,lang)}</th>
                        <th scope="col">{getTranslation(livingStatus,lang)}</th>
                        <th scope="col">{getTranslation(AnyPhysicalDisorder,lang)}</th>
                        <th scope="col">{getTranslation(cheifAction,lang)}</th>
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
                              // placeholder="Name / नाम "
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
                              // placeholder="Relation / संबंध "
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
                              // placeholder="age / आयु "
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
                              // placeholder="Living Status / रहने की स्तिथि"
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
                              // placeholder="ny physical Disorder & disease कोई भी शारीरिक विकार एवं रोग"
                            />
                          </td>
                          <td>
                            {index > 0 && (
                              <Button
                                type="button"
                                className="btn btn-danger" onClick={() => removeInterferenceRow(index)}
                              >
                                {getTranslation(" Remove/निकालना",lang)}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  <Button type="button" className="btn btn-secondary mt-4 mb-3" onClick={addInterferenceRow}>
                  {getTranslation("+ Add More/ + अधिक जोड़ें",lang)}
                  </Button>
                </div>

                <FormGroup className="mb-0">
                  {/* <Label>{getTranslation(ifAnyDisorder,lang)}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="disorder_desc"
                    value={formData.disorder_desc}
                    onChange={onChangeEventHandler}
                  /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(ifAnyDisorder,lang)} />}
  className="form-control"
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
                  <p className="mt-3 mb-3">{getTranslation(familyHistorySubstanceAbuse,lang)}</p>
                  <Table bordered>
                    <thead>
                      <tr>
                      <th>{getTranslation("Mother Side/मातृ पक्ष",lang)}</th>
                          <th>{getTranslation("Alcohol/शराब",lang)}</th>
                          <th>{getTranslation("Drug/दवाई",lang)}</th>
                          <th>{getTranslation("Psych/साइक",lang)}</th>
                          <th>{getTranslation("Father Side/पिता पक्ष",lang)}</th>
                          <th>{getTranslation("Alcohol/शराब",lang)}</th>
                          <th>{getTranslation("Drug/दवाई",lang)}</th>
                          <th>{getTranslation("Psych/साइक",lang)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{getTranslation("Grandmother/दादी",lang)}</td>
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
                        <td>{getTranslation("Grandmother/दादी",lang)}</td>
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
                        <td>{getTranslation("Grandfather/दादाजी",lang)}</td>
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
                        <td>{getTranslation("Grandfather/दादाजी",lang)}</td>
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
                        <td>{getTranslation("Mother/माँ",lang)}</td>
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
                        <td>{getTranslation("Father/पिता",lang)}</td>
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
                        <td>{getTranslation("Aunt / मामी",lang)}</td>
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
                        <td>{getTranslation("Aunt / चाची",lang)}</td>
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
                        <td>{getTranslation("Uncle / मामा",lang)}</td>
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
                        <td>{getTranslation("Uncle / चाचा",lang)}</td>
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
                        <td>{getTranslation(anyOtherPlsMention,lang)}</td>
                        <td colSpan={3}>
                          <Input
                            type="text"
                            // placeholder="If any from mother side"
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
                        <td>{getTranslation(anyOtherPlsMention,lang)}</td>
                        <td colSpan={3}>
                          <Input
                            type="text"
                            // placeholder="If any from father side"
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
                {/* <Label>{getTranslation(anyOtherPlsMention1,lang)}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="psych_problem_desc"
                  value={formData.psych_problem_desc}
                  onChange={onChangeEventHandler}
                /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(anyOtherPlsMention1,lang)} />}
  className="form-control"
  name="psych_problem_desc"
  value={formData.psych_problem_desc}
  onChange={onChangeEventHandler}
/>

              </div>

              {/*Current Status? वर्तमान स्थिति?*/}

              <div className="col-md-12 mt-3 mb-3">
                <Label>{getTranslation(currentStatus,lang)}</Label>
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
                {/* <Input
                  type="text"
                  name="current_status"
                  className="form-control"
                  value={formData.current_status}
                  onChange={onChangeEventHandler}
                /> */}
                <select
  name="current_status"
  className="form-control"
  value={formData.current_status}
  onChange={onChangeEventHandler}
>
  <option value="">{getTranslation("Select / चुनें", lang)}</option>

  <option value="Active">
    {getTranslation("Active / एक्टिव", lang)}
  </option>

  <option value="Non Active">
    {getTranslation("Non Active / नॉन एक्टिव", lang)}
  </option>

  <option value="Passed Away">
    {getTranslation("Passed Away / निधन हो गया", lang)}
  </option>

  <option value="Seprated">
    {getTranslation("Seprated / अलग हो गया", lang)}
  </option>

  <option value="Others">
    {getTranslation("Others / अन्य", lang)}
  </option>
</select>

              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  {/* <Label>{getTranslation(howWasBonding,lang)}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="relationship_with_user"
                    value={formData.relationship_with_user}
                    onChange={onChangeEventHandler}
                  /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(howWasBonding,lang)} />}
  className="form-control"
  name="relationship_with_user"
  value={formData.relationship_with_user}
  onChange={onChangeEventHandler}
/>

                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  {/* <Label>{getTranslation(familyBehaviorPatient,lang)}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="family_behavior"
                    value={formData.family_behavior}
                    onChange={onChangeEventHandler}
                  /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(familyBehaviorPatient,lang)} />}
  className="form-control"
  name="family_behavior"
  value={formData.family_behavior}
  onChange={onChangeEventHandler}
/>

                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  {/* <Label>{getTranslation(monitoringFamily,lang)}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="head_of_family"
                    value={formData.head_of_family}
                    onChange={onChangeEventHandler}
                  /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(monitoringFamily,lang)} />}
  className="form-control"
  name="head_of_family"
  value={formData.head_of_family}
  onChange={onChangeEventHandler}
/>

                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  {/* <Label>{getTranslation(ralationshipFamilyMember,lang)}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="relationships_with_family"
                    value={formData.relationships_with_family}
                    onChange={onChangeEventHandler}
                  /> */}


<VoiceTextarea
  label={<Translated text={getTranslation(ralationshipFamilyMember,lang)} />}
  className="form-control"
  name="relationships_with_family"
  value={formData.relationships_with_family}
  onChange={onChangeEventHandler}
/>

                </FormGroup>
              </div>

              {/* Childhood /बचपन */}

              <H5 className="mt-3 mb-3">{getTranslation(childhood,lang)}</H5>
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{getTranslation(birthConditions,lang)}</Label>
                  {/* <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="birth_conditions"
                    value={formData.childhood_history.birth_conditions}
                    onChange={childhoodHandleChange}
                  /> */}
                  <select
  className="form-control"
  name="birth_conditions"
  value={formData.childhood_history.birth_conditions}
  onChange={childhoodHandleChange}
>
  <option value="">{getTranslation("Select / चुनें", lang)}</option>

  <option value="Normal">{getTranslation("Normal / नॉर्मल", lang)}</option>
  <option value="Cesarean">{getTranslation("Cesarean / सिजेरियन", lang)}</option>
  <option value="Pre Mature">{getTranslation("Pre Mature / प्रीमैच्योर", lang)}</option>
</select>


{/* <VoiceTextarea
  label={<Translated text={getTranslation(birthConditions,lang)} />}
  className="form-control"
  name="birth_conditions"
  value={formData.childhood_history.birth_conditions}
  onChange={childhoodHandleChange}
/> */}

                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{getTranslation(parentingHistory,lang)}</Label>
                  {/* <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="parenting_history"
                    value={formData.childhood_history.parenting_history}
                    onChange={childhoodHandleChange}
                  /> */}
<select
  className="form-control"
  name="parenting_history"
  value={formData.childhood_history.parenting_history}
  onChange={childhoodHandleChange}
>
  <option value="">{getTranslation("Select / चुनें", lang)}</option>

  <option value="With Mother Father">
    {getTranslation("With Mother Father / माँ-बाप के साथ", lang)}
  </option>

  <option value="With Grandparent">
    {getTranslation("With Grandparent / दादा-दादी के साथ", lang)}
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

{/* <VoiceTextarea
  label={<Translated text={getTranslation(parentingHistory,lang)} />}
  className="form-control"
  name="parenting_history"
  value={formData.childhood_history.parenting_history}
  onChange={childhoodHandleChange}
/> */}

                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  {/* <Label>{getTranslation(wasThereAnyConflict,lang)}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="family_conflict"
                    value={formData.childhood_history.family_conflict}
                    onChange={childhoodHandleChange}
                  /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(wasThereAnyConflict,lang)} />}
  className="form-control"
  name="family_conflict"
  value={formData.childhood_history.family_conflict}
  onChange={childhoodHandleChange}
/>

                </FormGroup>
              </div>

              {/*Sociality  where born & Living?
सामाजिकता जहां पैदा हुआ और रहा  है?*/}
              <div className="col-md-12">
                <Label htmlFor="birthPlace">{getTranslation(socialityWhere,lang)}</Label>
                {/* <Input
                  type="text"
                  id="birthPlace"
                  name="sociality_living"
                  value={formData.childhood_history.sociality_living}
                  onChange={childhoodHandleChange}
                  // placeholder="Enter birth place..."
                /> */}
                <select
  className="form-control"
  id="birthPlace"
  name="sociality_living"
  value={formData.childhood_history.sociality_living}
  onChange={childhoodHandleChange}
>
  <option value="">{getTranslation("Select / चुनें", lang)}</option>

  <option value="Addict Surrounding">
    {getTranslation("Addict Surrounding / नशेड़ी आस-पास", lang)}
  </option>

  <option value="Social Atmosphere">
    {getTranslation("Social Atmosphere / सामाजिक माहौल", lang)}
  </option>

  <option value="Anti Social Locality">
    {getTranslation("Anti Social Locality / असामाजिक इलाका", lang)}
  </option>
</select>


                <br />
                <Label htmlFor="birthPlace">{getTranslation(highRiskBehavior,lang)}</Label>
                <Input
                  type="text"
                  id="currentLocation"
                  name="high_risk_behavior"
                  value={formData.childhood_history.high_risk_behavior}
                  onChange={childhoodHandleChange}
                  // placeholder="Enter current location..."
                />
              </div>

              <div className="col-md-12 mt-3 mb-3">
                <FormGroup className="mb-0">
                  {/* <Label>{getTranslation(whatWasImpect,lang)}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="impact_of_movies"
                    value={formData.childhood_history.impact_of_movies}
                    onChange={childhoodHandleChange}
                  /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(whatWasImpect,lang)} />}
  className="form-control"
  name="impact_of_movies"
  value={formData.childhood_history.impact_of_movies}
  onChange={childhoodHandleChange}
/>

                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  {/* <Label>{getTranslation(hasAnyoneEverAbused,lang)}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="abuse_history"
                    value={formData.childhood_history.abuse_history}
                    onChange={childhoodHandleChange}
                  /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(hasAnyoneEverAbused,lang)} />}
  className="form-control"
  name="abuse_history"
  value={formData.childhood_history.abuse_history}
  onChange={childhoodHandleChange}
/>

                </FormGroup>
              </div>

              {/* Academics Occupational Details Start */}

              {/*Academics Occupational Details/ शैक्षणिक व्यावसायिक विवरण*/}
              <H5 className="mt-3 mb-3">{getTranslation(academicsOccupationalDetails,lang)}</H5>
              <div className="col-md-6">
                <Label htmlFor="educationStatus">{getTranslation(EducationStatus,lang)}</Label>
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
                {/* <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="education_status"
                  value={formData.education_employment.education_status}
                  onChange={academicOccupationHandler}
                /> */}
                {/* <VoiceTextarea
  label={<Translated text={getTranslation(EducationStatus,lang)} />}
  className="form-control"
  name="education_status"
  value={formData.education_employment.education_status}
  onChange={academicOccupationHandler}
/> */}

<select
  className="form-control"
  name="education_status"
  value={formData.education_employment.education_status}
  onChange={academicOccupationHandler}
>
  <option value="">{getTranslation("Select Education Status: / चुनें शिक्षा की स्थिति:", lang)}</option>

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

              {/*Occupational status? कार्य की स्थिति?*/}
              <div className="col-md-6">
                <Label htmlFor="occupation">{getTranslation(OcuStatus,lang)}</Label>
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
                {/* <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="occupation_status"
                  value={formData.education_employment.occupation_status}
                  onChange={academicOccupationHandler}
                /> */}

{/* <VoiceTextarea
  label={<Translated text={getTranslation(OcuStatus,lang)} />}
  className="form-control"
  name="occupation_status"
  value={formData.education_employment.occupation_status}
  onChange={academicOccupationHandler}
/> */}
                
                <select
  className="form-control"
  name="occupation_status"
  value={formData.education_employment.occupation_status}
  onChange={academicOccupationHandler}
>
<option value="">{getTranslation("Select Occupational status? / चुनें कार्य की स्थिति?", lang)}</option>

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

              {/*If dropout what is the reason यदि ड्रॉपआउट हुआ तो क्या कारण है?*/}
              <div className="col-md-12 mt-3">
                <FormGroup className="mb-0">
                  <Label>{getTranslation(ifDropout,lang)}</Label>
                  {/* <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="dropout_reason"
                    value={formData.education_employment.dropout_reason}
                    onChange={academicOccupationHandler}
                  /> */}

{/* <VoiceTextarea
  label={<Translated text={getTranslation(ifDropout,lang)} />}
  className="form-control"
  name="dropout_reason"
  value={formData.education_employment.dropout_reason}
  onChange={academicOccupationHandler}
/> */}

<select
  className="form-control"
  name="dropout_reason"
  value={formData.education_employment.dropout_reason}
  onChange={academicOccupationHandler}
>
<option value="">{getTranslation("Select If dropout what is the reason / / चुनें यदि ड्रॉपआउट हुआ तो क्या कारण है?", lang)}</option>

  <option value="Addiction">
    {getTranslation("Addiction / लत", lang)}
  </option>

  <option value="Personal">
    {getTranslation("Personal / पर्सनल", lang)}
  </option>

  <option value="NA">
    {getTranslation("NA / ना", lang)}
  </option>
</select>


                </FormGroup>
              </div>

              {/*Study/Work Details: (what was job frequency)  /अध्ययन/कार्य विवरण: (नौकरी की फ्रीक्वेंसी क्या थी?)*/}
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  {/* <Label>{getTranslation(studyWorkDetails,lang)}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="work_details"
                    value={formData.education_employment.work_details}
                    onChange={academicOccupationHandler}
                  /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(studyWorkDetails,lang)} />}
  className="form-control"
  name="work_details"
  value={formData.education_employment.work_details}
  onChange={academicOccupationHandler}
/>

                </FormGroup>
              </div>

              {/*Hobbies : शौक:*/}
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  {/* <Label>{getTranslation(Hobbies1,lang)}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="hobbies"
                    value={formData.education_employment.hobbies}
                    onChange={academicOccupationHandler}
                  /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(Hobbies1,lang)} />}
  className="form-control"
  name="hobbies"
  value={formData.education_employment.hobbies}
  onChange={academicOccupationHandler}
/>

                </FormGroup>
              </div>

              {/*Extra skills if any: अतिरिक्त कौशल कोई हो:*/}
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  {/* <Label>{getTranslation(extraSkills,lang)}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="skills"
                    value={formData.education_employment.skills}
                    onChange={academicOccupationHandler}
                  /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(extraSkills,lang)} />}
  className="form-control"
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
                  {/* <Label>{getTranslation(achievemntInLife,lang)}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="achievements"
                    value={formData.education_employment.achievements}
                    onChange={academicOccupationHandler}
                  /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(achievemntInLife,lang)} />}
  className="form-control"
  name="achievements"
  value={formData.education_employment.achievements}
  onChange={academicOccupationHandler}
/>

                </FormGroup>
              </div>

              {/* Academics Occupational Details End */}

              {/* Social Behavior Start */}
              {/* Social Behavior / सामाजिक व्यवहार */}
              <H5 className="mt-3 mb-3">{getTranslation(socialBehavior,lang)}</H5>
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{getTranslation(socialBehavior1,lang)}</Label>
                  {/* <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="social_behavior"
                    value={formData.social_behavior.social_behavior}
                    onChange={socialBehaviorHandler}
                  /> */}

{/* <VoiceTextarea
  label={<Translated text={getTranslation(socialBehavior1,lang)} />}
  className="form-control"
  name="social_behavior"
  value={formData.social_behavior.social_behavior}
  onChange={socialBehaviorHandler}
/> */}

<select
  className="form-control"
  name="social_behavior"
  value={formData.social_behavior.social_behavior}
  onChange={socialBehaviorHandler}
>
  <option value="">{getTranslation("Select / चुनें", lang)}</option>

  <option value="Social">
    {getTranslation("Social / सामाजिक", lang)}
  </option>

  <option value="Anti Social">
    {getTranslation("Anti Social / असामाजिक", lang)}
  </option>
</select>

                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{getTranslation(withWhomSpendFreeTime,lang)}</Label>
                  {/* <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="with_whom_spend_time"
                    value={formData.social_behavior.with_whom_spend_time}
                    onChange={socialBehaviorHandler}
                  /> */}

{/* <VoiceTextarea
  label={<Translated text={getTranslation(withWhomSpendFreeTime,lang)} />}
  className="form-control"
  name="with_whom_spend_time"
  value={formData.social_behavior.with_whom_spend_time}
  onChange={socialBehaviorHandler}
/> */}

<select
  className="form-control"
  name="with_whom_spend_time"
  value={formData.social_behavior.with_whom_spend_time}
  onChange={socialBehaviorHandler}
>
  <option value="">{getTranslation("Select / चुनें", lang)}</option>

  <option value="Alone">
    {getTranslation("Alone / अकेले", lang)}
  </option>

  <option value="With Family">
    {getTranslation("With Family / परिवार के साथ", lang)}
  </option>

  <option value="In addict Community">
    {getTranslation("In addict Community / नशेड़ी समुदाय में", lang)}
  </option>

  <option value="With Friends">
    {getTranslation("With Friends / दोस्तों के साथ", lang)}
  </option>
</select>


                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{getTranslation(howManyFriends,lang)}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="number_of_friends"
                    value={formData.social_behavior.number_of_friends}
                    onChange={socialBehaviorHandler}
                  />

{/* <VoiceTextarea
  label={<Translated text={getTranslation(howManyFriends,lang)} />}
  className="form-control"
  name="number_of_friends"
  value={formData.social_behavior.number_of_friends}
  onChange={socialBehaviorHandler}
/> */}

                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  {/* <Label>{getTranslation(friendSocialStatus,lang)}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="friends_social_status"
                    value={formData.social_behavior.friends_social_status}
                    onChange={socialBehaviorHandler}
                  /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(friendSocialStatus,lang)} />}
  className="form-control"
  name="friends_social_status"
  value={formData.social_behavior.friends_social_status}
  onChange={socialBehaviorHandler}
/>

                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  {/* <Label>{getTranslation(howMuchDependent,lang)}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="substance_dependent_friends"
                    value={formData.social_behavior.substance_dependent_friends}
                    onChange={socialBehaviorHandler}
                  /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(howMuchDependent,lang)} />}
  className="form-control"
  name="substance_dependent_friends"
  value={formData.social_behavior.substance_dependent_friends}
  onChange={socialBehaviorHandler}
/>

                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  {/* <Label>{getTranslation(whoClosedWellWisher,lang)}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="well_wisher_person"
                    value={formData.social_behavior.well_wisher_person}
                    onChange={socialBehaviorHandler}
                  /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(whoClosedWellWisher,lang)} />}
  className="form-control"
  name="well_wisher_person"
  value={formData.social_behavior.well_wisher_person}
  onChange={socialBehaviorHandler}
/>

                </FormGroup>
              </div>

              {/* Social Behavior End */}

              {/* Legal History Start */}
              {/* Legal History / लीगल इतिहास */}
              <H5 className="mt-3 mb-3">{getTranslation(legalHistory,lang)}</H5>
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  {/* <Label>{getTranslation(domesticViolence,lang)}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="domestic_violence"
                    value={formData.legal_history.domestic_violence}
                    onChange={legalHistoryHandler}
                  /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(domesticViolence,lang)} />}
  className="form-control"
  name="domestic_violence"
  value={formData.legal_history.domestic_violence}
  onChange={legalHistoryHandler}
/>

                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  {/* <Label>{getTranslation(reasonBehindDomesticViolence,lang)}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="violence_reason"
                    value={formData.legal_history.violence_reason}
                    onChange={legalHistoryHandler}
                  /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(reasonBehindDomesticViolence,lang)} />}
  className="form-control"
  name="violence_reason"
  value={formData.legal_history.violence_reason}
  onChange={legalHistoryHandler}
/>

                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  {/* <Label>{getTranslation(drugStatus,lang)}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="drug_status_qty"
                    value={formData.legal_history.drug_status_qty}
                    onChange={legalHistoryHandler}
                  /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(drugStatus,lang)} />}
  className="form-control"
  name="drug_status_qty"
  value={formData.legal_history.drug_status_qty}
  onChange={legalHistoryHandler}
/>

                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  {/* <Label>{getTranslation(ifThereIsAnyCriminalCase,lang)}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="criminal_case"
                    value={formData.legal_history.criminal_case}
                    onChange={legalHistoryHandler}
                  /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(ifThereIsAnyCriminalCase,lang)} />}
  className="form-control"
  name="criminal_case"
  value={formData.legal_history.criminal_case}
  onChange={legalHistoryHandler}
/>

                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  {/* <Label>{getTranslation(specificCaseDetails,lang)}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="case_details"
                    value={formData.legal_history.case_details}
                    onChange={legalHistoryHandler}
                  /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(specificCaseDetails,lang)} />}
  className="form-control"
  name="case_details"
  value={formData.legal_history.case_details}
  onChange={legalHistoryHandler}
/>

                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  {/* <Label>{getTranslation(currentCaseStatus,lang)}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="case_status"
                    value={formData.legal_history.case_status}
                    onChange={legalHistoryHandler}
                  /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(currentCaseStatus,lang)} />}
  className="form-control"
  name="case_status"
  value={formData.legal_history.case_status}
  onChange={legalHistoryHandler}
/>

                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  {/* <Label>{getTranslation(ifWentToJail,lang)}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="jail_duration"
                    value={formData.legal_history.jail_duration}
                    onChange={legalHistoryHandler}
                  /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(ifWentToJail,lang)} />}
  className="form-control"
  name="jail_duration"
  value={formData.legal_history.jail_duration}
  onChange={legalHistoryHandler}
/>

                </FormGroup>
              </div>

              {/* Legal History End */}

              {/* Patient behavior Start */}
              {/* Patient behavior / रोगी का व्यवहार */}

              <H5 className="mt-3 mb-3">{getTranslation(patientBeh,lang)}</H5>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  {/* <Label>{getTranslation(whatIsTheMostImportantThing,lang)}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="life_priority"
                    value={formData.patient_behavior.life_priority}
                    onChange={onChangeEventHandler}
                  /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(whatIsTheMostImportantThing,lang)} />}
  className="form-control"
  name="life_priority"
  value={formData.patient_behavior.life_priority}
  onChange={onChangeEventHandler}
/>

                </FormGroup>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  {/* <Label>{getTranslation(lifeAim,lang)}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="life_aim"
                    value={formData.patient_behavior.life_aim}
                    onChange={onChangeEventHandler}
                  /> */}


<VoiceTextarea
  label={<Translated text={getTranslation(lifeAim,lang)} />}
  className="form-control"
  name="life_aim"
  value={formData.patient_behavior.life_aim}
  onChange={onChangeEventHandler}
/>

                </FormGroup>
              </div>

              <H5 className="mt-3 mb-3">{getTranslation(patientBehavior,lang)}</H5>
              <div className="col-md-12 table-responsive">
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>{getTranslation(tableNumber,lang)}</th>
                      <th>{getTranslation(patientBehavior,lang)}</th>
                      <th>{getTranslation(yes,lang)}</th>
                      <th>{getTranslation(no,lang)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientBehaviorFormattedList.map(({ key, label }, index) => {
                      return (
                        <tr key={key}>
                          <td>{index + 1}</td>
                          <td className="w-75">{getTranslation(label,lang)}</td>
                          {[getTranslation("Yes/हाँ",lang), getTranslation("No/नहीं",lang)].map((value) => {
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
                    {getTranslation(consent,lang)}
                  </Label>
                </div>
              </div>

              {/*Content section start*/}
              <div className="row mt-3 mb-3">
                <div className="col-md-4">
                  <Label>{getTranslation(name,lang)}</Label>
                  <Input
                    type="text"
                    // placeholder="Name"
                    name="consent_name"
                    value={formData.consent_name}
                    onChange={onChangeEventHandler}
                  />
                </div>
                <div className="col-md-4">
                  <Label>{getTranslation(relationship,lang)}</Label>
                  <Input
                    type="text"
                    // placeholder="Relationship"
                    name="relationship"
                    value={formData.relationship}
                    onChange={onChangeEventHandler}
                  />
                </div>
                <div className="col-md-4">
                  <Label>{getTranslation(signature,lang)}</Label>
                  <Input
                    type="text"
                    // placeholder="Signature"
                    name="signature"
                    value={formData.signature}
                    onChange={onChangeEventHandler}
                  />
                </div>
                <div className="col-md-12 mt-3 mb-3">
                  <Label>{getTranslation(prepared,lang)}</Label>
                  <Input
                    type="text"
                    // placeholder="Prepared By"
                    name="prepared_by"
                    value={formData.prepared_by}
                    onChange={onChangeEventHandler}
                  />
                </div>
              </div>
              {/* Submit & Save Draft */}
              <div className="col-md-12 mb-4 d-flex align-items-center gap-2 flex-wrap">
                <SaveDraftButton
                  formKey="general_family"
                  targetId={selectedUser?.[0]?.user_id || selectedUser?.[0]?.id || selectedUser?.user_id || selectedUser?.id || currentGenFamilyUserId}
                  formData={formData}
                  onDraftSaved={() => setDraftTimestamp(Date.now())}
                  style={{ height: "38px", padding: "6px 16px" }}
                />

                <Button color="primary" type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    ></span>
                  ) : (
                    getTranslation("Submit Gen Family Form/सामान्य परिवार फॉर्म जमा करें",lang)
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
                    <HeaderCard title={getTranslation("General Family Form/सामान्य परिवार प्रपत्र",lang)} className="p-0" />
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
                        filename="General_Family_Registration_List"
                        title={getTranslation("General Family Form Registration List / सामान्य परिवार प्रपत्र पंजीकरण सूची", lang)}
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
                    <HeaderCard title={getTranslation("All General Family Data List/सभी सामान्य पारिवारिक डेटा सूची",lang)} className="p-0" />
                  </div>
                  <div className="row pb-3 align-items-center">
                    <div className="col-md-5 col-12 mb-2 mb-md-0">
                      <InputGroup>
                        <Input
                          className="form-control"
                          type="text"
                          placeholder={getTranslation("Search......./खोज.......",lang)}
                          value={searchgenText}
                          onChange={handleSearchGenFamily}
                        />
                        <span className="input-group-text">
                          <i className="fa fa-search"></i>
                        </span>
                      </InputGroup>
                    </div>
                    <div className="col-md-7 col-12 d-flex justify-content-md-end justify-content-start">
                      <TableExportButtons
                        data={genFilterData}
                        columns={tableGenFamilyListColumns}
                        filename="All_General_Family_Data_List"
                        title={getTranslation("All General Family Data List / सभी सामान्य पारिवारिक डेटा सूची", lang)}
                      />
                    </div>
                  </div>
                  {stillLoading ? (
                    <div className="loading-text">
                      {getTranslation("Data is fetching from server. Please wait.../सर्वर से डेटा प्राप्त किया जा रहा है। कृपया प्रतीक्षा करें...",lang)}
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
        title={getTranslation(patientPersonalInformation, lang)}
        toggler={closeGenFamily}
        maxWidth="1100px"
      >
        <div className="p-3 p-md-4 print-area" ref={pdfRef} style={{ background: "#f8fafc" }}>
          {isLoading ? (
            <ModalLoading message={getTranslation("Loading General Family details... / विवरण लोड हो रहा है...", lang)} />
          ) : viewgenData ? (
            <div className="genFamily__content">
              {/* Header Profile Banner Card with Profile Photo & GKS ID */}
              {(() => {
                const genFamObj = viewgenData.gen_family || viewgenData;
                const patientName = genFamObj.name || genFamObj.patient_name || viewgenData.name || "Patient";
                const gksId = genFamObj.custom_code || genFamObj.gks_id || genFamObj.uid || viewgenData.custom_code || viewgenData.gks_id || viewgenData.uid || genFamObj.user_id || viewgenData.user_id || "";
                const profilePic = genFamObj.profile_pic || genFamObj.profile_image || viewgenData.profile_pic || viewgenData.profile_image || "";
                const initial = typeof patientName === "string" && patientName.trim() ? patientName.trim().charAt(0).toUpperCase() : "P";

                return (
                  <div
                    className="card shadow-sm border-0 mb-4"
                    style={{
                      borderRadius: "16px",
                      background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                      borderLeft: "6px solid #24695c",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div className="card-body p-4">
                      <div className="d-flex flex-column flex-sm-row align-items-center gap-4">
                        {profilePic ? (
                          <img
                            src={profilePic}
                            crossOrigin="anonymous"
                            alt="Patient Profile"
                            style={{
                              width: "90px",
                              height: "90px",
                              borderRadius: "50%",
                              objectFit: "cover",
                              border: "3px solid #24695c",
                              boxShadow: "0 4px 12px rgba(36, 105, 92, 0.2)",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "90px",
                              height: "90px",
                              borderRadius: "50%",
                              background: "#eaf2f0",
                              color: "#24695c",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "32px",
                              fontWeight: "700",
                              border: "3px solid #24695c",
                              boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                            }}
                          >
                            {initial}
                          </div>
                        )}

                        <div className="text-center text-sm-start flex-grow-1">
                          <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-sm-start gap-2 mb-1">
                            <h3 className="mb-0 fw-bold text-dark" style={{ fontSize: "1.4rem" }}>
                              {patientName}
                            </h3>
                            {gksId && (
                              <Badge
                                style={{
                                  borderRadius: "10px",
                                  fontSize: "12.5px",
                                  fontWeight: "700",
                                  backgroundColor: "#24695c",
                                  color: "#ffffff",
                                  padding: "5px 12px",
                                  letterSpacing: "0.4px",
                                }}
                              >
                                GKS ID: {gksId}
                              </Badge>
                            )}
                          </div>
                          <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-sm-start gap-3 mt-2 text-muted" style={{ fontSize: "13px" }}>
                            {genFamObj.phone && <span>📞 {genFamObj.phone}</span>}
                            {genFamObj.email && <span>✉️ {genFamObj.email}</span>}
                            {genFamObj.gender && <span>👤 {genFamObj.gender}</span>}
                            {genFamObj.form_fill_date && <span>📅 Form Date: {genFamObj.form_fill_date}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {Object.entries(viewgenData).map(([key, value]) => {
                let parsed = value;
                try {
                  if (typeof value === "string" && (value.startsWith("{") || value.startsWith("["))) {
                    parsed = JSON.parse(value);
                  }
                } catch (e) {}

                const sectionTitle = key
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase());

                return (
                  <div
                    key={key}
                    className="card shadow-sm border-0 mb-4"
                    style={{
                      borderRadius: "14px",
                      overflow: "hidden",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      className="card-header bg-white py-3 px-4 border-bottom d-flex align-items-center justify-content-between"
                      style={{
                        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                        borderLeft: "5px solid #d56337",
                      }}
                    >
                      <h6 className="fw-bold text-dark mb-0" style={{ fontSize: "15px" }}>
                        📋 {sectionTitle}
                      </h6>
                      <Badge color="light" className="text-muted border px-2 py-1" style={{ fontSize: "11px" }}>
                        {Array.isArray(parsed?.members)
                          ? `${parsed.members.length} Members`
                          : Array.isArray(parsed?.treatment_records)
                          ? `${parsed.treatment_records.length} Records`
                          : "Section Details"}
                      </Badge>
                    </div>

                    <div className="card-body p-3 p-md-4">
                      {/* Family Members Table */}
                      {key === "family_members" && parsed?.members && (
                        <div className="table-responsive rounded-3 border">
                          <table className="table table-hover align-middle mb-0">
                            <thead style={{ backgroundColor: "#f1f5f9" }}>
                              <tr>
                                <th className="py-2 px-3 text-secondary text-uppercase fw-semibold" style={{ fontSize: "12px" }}>#</th>
                                <th className="py-2 px-3 text-secondary text-uppercase fw-semibold" style={{ fontSize: "12px" }}>Name</th>
                                <th className="py-2 px-3 text-secondary text-uppercase fw-semibold" style={{ fontSize: "12px" }}>Relation</th>
                                <th className="py-2 px-3 text-secondary text-uppercase fw-semibold" style={{ fontSize: "12px" }}>Age</th>
                                <th className="py-2 px-3 text-secondary text-uppercase fw-semibold" style={{ fontSize: "12px" }}>Living Status</th>
                                <th className="py-2 px-3 text-secondary text-uppercase fw-semibold" style={{ fontSize: "12px" }}>Physical Disorder</th>
                              </tr>
                            </thead>
                            <tbody>
                              {parsed.members.map((m, i) => (
                                <tr key={i}>
                                  <td className="py-2 px-3 fw-semibold text-muted">{i + 1}</td>
                                  <td className="py-2 px-3 fw-semibold text-dark">{m.name || "-"}</td>
                                  <td className="py-2 px-3">
                                    <Badge color="light" className="text-dark border">
                                      {m.relation || "-"}
                                    </Badge>
                                  </td>
                                  <td className="py-2 px-3">{m.age ? `${m.age} Yrs` : "-"}</td>
                                  <td className="py-2 px-3">{m.living_status || "-"}</td>
                                  <td className="py-2 px-3">{m.physical_disorder || "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Family History */}
                      {key === "family_members" && parsed?.family_history_data && (
                        <div className="mt-3">
                          {Object.entries(parsed.family_history_data).map(([side, members]) => (
                            <div key={side} className="mb-3">
                              <h6 className="fw-bold text-dark text-capitalize mb-2" style={{ fontSize: "13.5px" }}>
                                🔹 {side.replace(/_/g, " ")}
                              </h6>
                              <div className="row g-2">
                                {Object.entries(members).map(([role, details]) => (
                                  <div key={role} className="col-12 col-md-6">
                                    <div className="p-2 px-3 rounded-3 bg-light border">
                                      <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                                        {role.replace(/_/g, " ")}
                                      </div>
                                      <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13px" }}>
                                        {typeof details === "object"
                                          ? Object.entries(details)
                                              .map(([k, v]) => `${k}: ${v}`)
                                              .join(" | ")
                                          : details || "-"}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Treatment History */}
                      {key === "treatment_history" && (
                        <div>
                          {/* Summary fields */}
                          <div className="row g-3 mb-3">
                            {Object.entries(parsed)
                              .filter(([k]) => k !== "treatment_records")
                              .map(([k, v]) => (
                                <div key={k} className="col-12 col-sm-6 col-lg-4">
                                  <div className="p-2 px-3 rounded-3 bg-light border">
                                    <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>
                                      {k.replace(/_/g, " ")}
                                    </div>
                                    <div className="fw-semibold text-dark mt-1" style={{ fontSize: "13.5px" }}>
                                      {v && v !== "null" ? String(v) : "-"}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>

                          {/* Records table */}
                          {Array.isArray(parsed.treatment_records) && parsed.treatment_records.length > 0 && (
                            <div className="table-responsive rounded-3 border">
                              <table className="table table-hover align-middle mb-0">
                                <thead style={{ backgroundColor: "#f1f5f9" }}>
                                  <tr>
                                    <th className="py-2 px-3 text-secondary text-uppercase fw-semibold" style={{ fontSize: "12px" }}>Treatment Year</th>
                                    <th className="py-2 px-3 text-secondary text-uppercase fw-semibold" style={{ fontSize: "12px" }}>Place</th>
                                    <th className="py-2 px-3 text-secondary text-uppercase fw-semibold" style={{ fontSize: "12px" }}>Duration</th>
                                    <th className="py-2 px-3 text-secondary text-uppercase fw-semibold" style={{ fontSize: "12px" }}>Days of Sobriety</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {parsed.treatment_records.map((r, i) => (
                                    <tr key={i}>
                                      <td className="py-2 px-3 fw-semibold">{r.treatment_year || "-"}</td>
                                      <td className="py-2 px-3">{r.treatment_place || "-"}</td>
                                      <td className="py-2 px-3">{r.treatment_duration || "-"}</td>
                                      <td className="py-2 px-3">
                                        <Badge color="success" pill>
                                          {r.days_of_sobriety || "-"}
                                        </Badge>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Generic Object key-value pairs */}
                      {typeof parsed === "object" &&
                        !Array.isArray(parsed) &&
                        key !== "family_members" &&
                        key !== "treatment_history" && (
                          <div className="row g-3">
                            {Object.entries(parsed).map(([k, v]) => {
                              if (k === "is_active" || k === "entry_id") return null;
                              let valStr = "-";
                              if (v !== null && v !== undefined && v !== "null") {
                                if (typeof v === "string" && v.match(/^\d{4}-\d{2}-\d{2}T/)) {
                                  valStr = new Date(v).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  });
                                } else if (typeof v === "object") {
                                  valStr = JSON.stringify(v);
                                } else {
                                  valStr = String(v);
                                }
                              }

                              return (
                                <div key={k} className="col-12 col-sm-6 col-lg-4">
                                  <div className="p-2 px-3 rounded-3 bg-light border" style={{ minHeight: "62px" }}>
                                    <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px", letterSpacing: "0.3px" }}>
                                      {k.replace(/_/g, " ")}
                                    </div>
                                    <div className="fw-semibold text-dark text-break mt-1" style={{ fontSize: "13.5px" }}>
                                      {valStr}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                      {/* Simple primitive text */}
                      {typeof parsed !== "object" && (
                        <div className="p-3 rounded-3 bg-light border">
                          <span className="fw-semibold text-dark">{parsed || "-"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-5">
              <p className="text-muted mb-0">
                {getTranslation("No data available / कोई डेटा मौजूद नहीं", lang)}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <ModalActionButtons
          onClose={closeGenFamily}
          onPrint={handlePrint}
          onDownload={handleDownloadPDF}
          isDownloading={pfaDownload}
          downloadText={getTranslation("Download PDF / डाउनलोड करें", lang)}
        />
      </CommonModal>



      {/* View Gen Family Data Modal End */}

      {/* Edit gen family data / data will fetch by latest gen family id and showing into edit modal like pre fetch fill data into form for create re admission of genfamily form start*/}
      <CommonModal
        isOpen={GeneditModal}
        title={getTranslation("Gen Family Re admission form/सामान्य परिवार पुनः प्रवेश फॉर्म",lang)}
        toggler={closeGenFamily}
        maxWidth="1200px"
      >
        {GenfamiltEditData ? (
          <form className="theme-form" onSubmit={(e) => {
            e.preventDefault();
            handleGenFamilyReadmission();
          }}>
            {/* UID & Form Fill Date */}
            <div className="row g-3 pt-3 pb-2">
              <div className="col-12 col-md-6">
                <FormGroup className="mb-3">
                  <Label>
                    {getTranslation(UID,lang)}
                  </Label>
                  <Input
                    className="form-control"
                    type="text"
                    name="genUID"
                    value={GenfamiltEditData.uid || ""}
                    onChange={(e) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        uid: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </div>

              <div className="col-12 col-md-6">
                <FormGroup className="mb-3">
                  <Label>
                    {getTranslation(dateOfFormFilling,lang)}
                  </Label>
                  <DatePicker 
                    showMonthDropdown 
                    showYearDropdown 
                    dropdownMode="select"
                    className="form-control digits"
                    selected={safeDate(GenfamiltEditData?.form_fill_date)}
                    onChange={(date) =>
                      setGenfamilyEditData({
                        ...GenfamiltEditData,
                        form_fill_date: date,
                      })
                    }
                  />
                </FormGroup>
              </div>
            </div>

            {/* Occupation Status */}
            <div className="row pt-3 pb-3">
              <div className="col-md-3">
                <Label>{getTranslation(relation,lang)}</Label>
                {/* <Input
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
                /> */}
                <select
  className="form-control mt-2"
  name="occupational_status"
  value={GenfamiltEditData.occupational_status}
  onChange={(e) =>
    setGenfamilyEditData({
      ...GenfamiltEditData,
      occupational_status: e.target.value,
    })
  }
>
  <option value="">
    {getTranslation("Select / चुनें", lang)}
  </option>
  <option value="Business">
    {getTranslation("Business/व्यापार", lang)}
  </option>
  <option value="Student">
    {getTranslation("Student/विद्यार्थी", lang)}
  </option>
  <option value="Family Business">
    {getTranslation("Family Business/पारिवारिक व्यवसाय", lang)}
  </option>
  <option value="Farming">
    {getTranslation("Farming/खेती", lang)}
  </option>
  <option value="Not Working">
    {getTranslation("Not Working/काम नहीं कर", lang)}
  </option>
  <option value="NA">
    {getTranslation("NA/ना", lang)}
  </option>
</select>

              </div>

              {/* Marital Status */}
              <div className="col-md-3">
                <Label>{getTranslation(marital,lang)}</Label>
                {/* <Input
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
                /> */}
                <select
  className="form-control mt-2"
  name="marital_status"
  value={GenfamiltEditData.marital_status}
  onChange={(e) =>
    setGenfamilyEditData({
      ...GenfamiltEditData,
      marital_status: e.target.value,
    })
  }
>
  <option value="">
    {getTranslation("Select / चुनें", lang)}
  </option>
  <option value="Single">
    {getTranslation("Single / अकेला", lang)}
  </option>
  <option value="Married">
    {getTranslation("Married / विवाहित", lang)}
  </option>
  <option value="Separated">
    {getTranslation("Separated / अलग किए", lang)}
  </option>
  <option value="Separated due to addiction">
    {getTranslation("Separated due to addiction / नशे की लत के कारण अलग हो गए", lang)}
  </option>
  <option value="Widower">
    {getTranslation("Widower / विधुर", lang)}
  </option>
</select>

              </div>

              {/* Living Situation */}
              <div className="col-md-3">
                <Label>{getTranslation(living,lang)}</Label>
                {/* <Input
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
                /> */}

<select
  className="form-control mt-2"
  name="living_situation"
  value={GenfamiltEditData.living_situation}
  onChange={(e) =>
    setGenfamilyEditData({
      ...GenfamiltEditData,
      living_situation: e.target.value,
    })
  }
>
  <option value="">
    {getTranslation("Select / चुनें", lang)}
  </option>
  <option value="With Family">
    {getTranslation("With Family / परिवार के साथ", lang)}
  </option>
  <option value="Single for Job">
    {getTranslation("Single for Job / नौकरी के लिए सिंगल", lang)}
  </option>
  <option value="Single for Study">
    {getTranslation("Single for Study / पढ़ाई के लिए सिंगल", lang)}
  </option>
</select>


              </div>

              {/* Religion */}
              <div className="col-md-3">
                <Label>{getTranslation(religion,lang)}</Label>
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
              <h5 className="mt-3">{getTranslation(substanceDependency,lang)}</h5>
              <div className="row pt-3 pb-3">
                {/*Duration of regular use? / कब से पदार्थ निर्भर हैं? */}
                <div className="col-md-3">
                  <Label for="custom-duration">{getTranslation(durationOfRegularUse,lang)}</Label>
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
                  <Label for="daily-spent">{getTranslation(dailySpentSubstance,lang)}</Label>
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
                  <Label for="monthly-income">{getTranslation(patienMonthlyIncome,lang)}</Label>
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
                  <Label for="family-income">{getTranslation(familyMonthlyIncome,lang)}</Label>
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
              <h5 className="mt-3">{getTranslation(sourceOfMoney,lang)}</h5>
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
                    <Label htmlFor={source.id}>{getTranslation(source.label,lang)}</Label>

                    {source.id === "source_any_other" &&
                      GenfamiltEditData[source.id] === "Yes" && (
                        <VoiceTextarea
                        className="form-control mt-2"
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
                    {/* <Label>{getTranslation(Ifarrange,lang)}</Label>
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
                    /> */}
                    <VoiceTextarea
  label={<Translated text={getTranslation(Ifarrange,lang)} />}
  className="form-control"
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
                    <Label>{getTranslation(mentionYear,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
  className="form-control"
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
                    <Label>{getTranslation(action,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
  className="form-control"
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
                    <Label>{getTranslation(Residence,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
  className="form-control"
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
                    <Label>{getTranslation(experiencedTrauma,lang)}</Label>
                    {/* <Input
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
                    /> */}


<VoiceTextarea
  className="form-control"
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
                    <Label>{getTranslation(occurredPatientBehavior,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
  className="form-control"
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
                    <Label>{getTranslation(sociality,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
  className="form-control"
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
                    <Label>{getTranslation(effectOfSubstance,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
  className="form-control"
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
                    <Label>{getTranslation(ChiefComplaint,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
  className="form-control"
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
                  <h5 className="mt-3 mb-3">{getTranslation(ChiefComplaint,lang)}</h5>

                  <Table bordered>
                    <thead>
                      <tr>
                        <th scope="col">{getTranslation(TreatmentOfSubstance,lang)}</th>
                        <th scope="col">{getTranslation(howManyTimes,lang)}</th>
                      </tr>
                      <tr>
                        <th scope="col">{getTranslation(year,lang)}</th>
                        <th scope="col">{getTranslation(placeOfTreatment,lang)}</th>
                        <th scope="col">{getTranslation(durationOfTime,lang)}</th>
                        <th scope="col">{getTranslation(daysOfSobriety,lang)}</th>
                        <th scope="col">{getTranslation(cheifAction,lang)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* {GenfamiltEditData.treatment_records.map((treatment, index) => ( 
                        */}
                        {(GenfamiltEditData.treatment_records || []).map((treatment, index) => (
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
                                {getTranslation("Remove/निकालना",lang)}
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
                    {getTranslation("+ Add More/ + अधिक जोड़ें",lang)}
                  </Button>
                </div>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{getTranslation(absuingSubstance,lang)}</Label>
                  {/* <Input
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
                  /> */}

<VoiceTextarea
  className="form-control"
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
                  <Label>{getTranslation(influenceStop,lang)}</Label>
                  {/* <Input
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
                  /> */}

<VoiceTextarea
  className="form-control"
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
                  <Label>{getTranslation(whenStopUsing,lang)}</Label>
                  {/* <Input
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
                  /> */}

<VoiceTextarea
  className="form-control"
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
                  <Label>{getTranslation(itReplaceWhenWhom,lang)}</Label>
                  {/* <Input
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
                  /> */}

<VoiceTextarea
  className="form-control"
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
                  <Label>{getTranslation(afterRelapse,lang)}</Label>
                  {/* <Input
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
                  /> */}

<VoiceTextarea
  className="form-control"
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
                  <Label>{getTranslation(haveDisorder,lang)}</Label>
                  {/* <Input
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
                  /> */}


<VoiceTextarea
  className="form-control"
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
                  <Label>{getTranslation(isProblmeOrInjury,lang)}</Label>
                  {/* <Input
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
                  /> */}

<VoiceTextarea
  className="form-control"
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
                  <Label>{getTranslation(DiagnosedOnTreatment,lang)}</Label>
                  {/* <Input
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
                  /> */}

<VoiceTextarea
  className="form-control"
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
                  <Label>{getTranslation(DoctorPlaceDuration,lang)}</Label>
                  {/* <Input
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
                  /> */}

<VoiceTextarea
  className="form-control"
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
                  <Label>{getTranslation(ifGone,lang)}</Label>
                  {/* <Input
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
                  /> */}

<VoiceTextarea
  className="form-control"
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
                  <Label>{getTranslation(YouFamiliar,lang)}</Label>
                  {/* <Input
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
                  /> */}

<VoiceTextarea
  className="form-control"
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
                <H5 className="mt-3 mb-3">{getTranslation(relationshipFamilyStatus,lang)}</H5>
                <div className="col-md-6">
                  <Label htmlFor="marital_status">{getTranslation(relationshipStatus,lang)}</Label>
                  {/* <Input
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
                  /> */}
                  <select
  className="form-control"
  name="relationship_status"
  value={GenfamiltEditData.relationship_status}
  onChange={(e) =>
    setGenfamilyEditData({
      ...GenfamiltEditData,
      relationship_status: e.target.value,
    })
  }
>
  <option value="">{getTranslation("Select / चुनें", lang)}</option>

  <option value="Single">
    {getTranslation("Single / सिंगल", lang)}
  </option>

  <option value="Married">
    {getTranslation("Married / शादीशुदा", lang)}
  </option>

  <option value="Separated">
    {getTranslation("Separated / अलग", lang)}
  </option>

  <option value="Widower">
    {getTranslation("Widower / विधवा", lang)}
  </option>

  <option value="Committed">
    {getTranslation("Committed / कमिटेड", lang)}
  </option>

  <option value="Broke up">
    {getTranslation("Broke up / ब्रेक अप", lang)}
  </option>
</select>


{/* <VoiceTextarea
  className="form-control"
  name="effect_of_treatment"
  value={GenfamiltEditData.traditional_treatment}
  onChange={(e) =>
    setGenfamilyEditData({
      ...GenfamiltEditData,
      traditional_treatment: e.target.value,
    })
  }
/> */}

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
                    <Label>{getTranslation(MarriageArrangement,lang)}</Label>
                    {/* <Input
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
                    /> */}
                    <select
  className="form-control"
  name="marriage_arrangement"
  value={GenfamiltEditData.marriage_arrangement}
  onChange={(e) =>
    setGenfamilyEditData({
      ...GenfamiltEditData,
      marriage_arrangement: e.target.value,
    })
  }
>
  <option value="">{getTranslation("Select / चुनें", lang)}</option>

  <option value="NA">
    {getTranslation("NA / लागू नहीं", lang)}
  </option>

  <option value="Arrange">
    {getTranslation("Arrange / व्यवस्था", lang)}
  </option>

  <option value="Love">
    {getTranslation("Love / प्यार", lang)}
  </option>

  <option value="Love Cum Arrange">
    {getTranslation("Love Cum Arrange / प्यार सह व्यवस्था", lang)}
  </option>
</select>


{/* <VoiceTextarea
  className="form-control"
  name="marriage_arrangement"
  value={GenfamiltEditData.traditional_treatment}
  onChange={(e) =>
    setGenfamilyEditData({
      ...GenfamiltEditData,
      traditional_treatment: e.target.value,
    })
  }
/> */}

                  </FormGroup>
                </div>

                {/*After marriage life or relationship Status*/}
                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{getTranslation(afterMerriageLife,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
  className="form-control"
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
                    <Label>{getTranslation(isThereInterference,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
  className="form-control"
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
                          <th scope="col">{getTranslation(nameisThere,lang)}</th>
                          <th scope="col">{getTranslation(relationisThere,lang)}</th>
                          <th scope="col">{getTranslation(relationisAge,lang)}</th>
                          <th scope="col">{getTranslation(livingStatus,lang)}</th>
                          <th scope="col">{getTranslation(AnyPhysicalDisorder,lang)}</th>
                          <th scope="col">{getTranslation(cheifAction,lang)}</th>
                        </tr>
                      </thead>
                      <tbody>
  {(GenfamiltEditData?.members || []).map((inter, index) => (
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
            {getTranslation(" Remove/निकालना",lang)}
          </Button>
        )}
      </td>
    </tr>
  ))}
</tbody>

                      {/* <tbody>
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
                      </tbody> */}

                    </Table>

                    <Button
                      type="button"
                      className="btn btn-secondary mt-4 mb-3"
                      onClick={addInterferenceRow}
                    >
                      {getTranslation("+ Add More/+ और जोड़ें",lang)}
                    </Button>
                  </div>

                  <FormGroup className="mb-0">
                    <Label>{getTranslation(ifAnyDisorder,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
  className="form-control"
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
                    <p className="mt-3 mb-3">{getTranslation(familyHistorySubstanceAbuse,lang)}</p>
                    <Table bordered>
                      <thead>
                        <tr>
                        <th>{getTranslation("Mother Side/मातृ पक्ष",lang)}</th>
                          <th>{getTranslation("Alcohol/शराब",lang)}</th>
                          <th>{getTranslation("Drug/दवाई",lang)}</th>
                          <th>{getTranslation("Psych/साइक",lang)}</th>
                          <th>{getTranslation("Father Side/पिता पक्ष",lang)}</th>
                          <th>{getTranslation("Alcohol/शराब",lang)}</th>
                          <th>{getTranslation("Drug/दवाई",lang)}</th>
                          <th>{getTranslation("Psych/साइक",lang)}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                        <td>{getTranslation("Grandmother/दादी",lang)}</td>
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
                          <td>{getTranslation("Grandmother/दादी",lang)}</td>
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
                        <td>{getTranslation("Grandfather/दादाजी",lang)}</td>
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
                          <td>{getTranslation("Grandfather/दादाजी",lang)}</td>
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
                        <td>{getTranslation("Mother/माँ",lang)}</td>
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
                          <td>{getTranslation("Father/पिता",lang)}</td>
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
                          <td>{getTranslation("Aunt / मामी",lang)}</td>
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
                          <td>{getTranslation("Aunt / चाची",lang)}</td>
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
                          <td>{getTranslation("Uncle / मामा",lang)}</td>
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
                          <td>{getTranslation("Uncle / चाचा",lang)}</td>
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
                  <Label>{getTranslation(anyOtherPlsMention1,lang)}</Label>
                  {/* <Input
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
                  /> */}

<VoiceTextarea
  className="form-control"
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
                  <Label>{getTranslation(currentStatus,lang)}</Label>
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
                  {/* <Input
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
                  /> */}
                  <select
  name="current_status"
  className="form-control"
  value={GenfamiltEditData.current_status}
  onChange={(e) =>
    setGenfamilyEditData({
      ...GenfamiltEditData,
      current_status: e.target.value,
    })
  }
>
  <option value="">{getTranslation("Select / चुनें", lang)}</option>

  <option value="Active">
    {getTranslation("Active / एक्टिव", lang)}
  </option>

  <option value="Non Active">
    {getTranslation("Non Active / नॉन एक्टिव", lang)}
  </option>

  <option value="Passed Away">
    {getTranslation("Passed Away / निधन हो गया", lang)}
  </option>

  <option value="Seprated">
    {getTranslation("Seprated / अलग हो गया", lang)}
  </option>

  <option value="Others">
    {getTranslation("Others / अन्य", lang)}
  </option>
</select>

                </div>

                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{getTranslation(howWasBonding,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
  className="form-control"
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
                    <Label>{getTranslation(familyBehaviorPatient,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
  className="form-control"
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
                    <Label>{getTranslation(monitoringFamily,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
  className="form-control"
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
                    <Label>{getTranslation(ralationshipFamilyMember,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
  className="form-control"
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

                <H5 className="mt-3 mb-3">{getTranslation(childhood,lang)}</H5>
                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{getTranslation(birthConditions,lang)}</Label>
                    {/* <Input
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
                    /> */}
                    <select
  className="form-control"
  name="birth_conditions"
  value={GenfamiltEditData.birth_conditions}
  onChange={(e) =>
    setGenfamilyEditData({
      ...GenfamiltEditData,
      birth_conditions: e.target.value,
    })
  }
>
  <option value="">{getTranslation("Select / चुनें", lang)}</option>

  <option value="Normal">{getTranslation("Normal / नॉर्मल", lang)}</option>
  <option value="Cesarean">{getTranslation("Cesarean / सिजेरियन", lang)}</option>
  <option value="Pre Mature">{getTranslation("Pre Mature / प्रीमैच्योर", lang)}</option>
</select>


{/* <VoiceTextarea
  className="form-control"
  name="birth_conditions"
  value={GenfamiltEditData.birth_conditions}
  onChange={(e) =>
    setGenfamilyEditData({
      ...GenfamiltEditData,
      birth_conditions: e.target.value,
    })
  }
/> */}

                  </FormGroup>
                </div>

                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{getTranslation(parentingHistory,lang)}</Label>
                    {/* <Input
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
                    /> */}
                    <select
  className="form-control"
  name="parenting_history"
  value={GenfamiltEditData.parenting_history}
  onChange={(e) =>
    setGenfamilyEditData({
      ...GenfamiltEditData,
      parenting_history: e.target.value,
    })
  }
>
  <option value="">{getTranslation("Select / चुनें", lang)}</option>

  <option value="With Mother Father">
    {getTranslation("With Mother Father / माँ-बाप के साथ", lang)}
  </option>

  <option value="With Grandparent">
    {getTranslation("With Grandparent / दादा-दादी के साथ", lang)}
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


{/* <VoiceTextarea
  className="form-control"
  name="parenting_history"
  value={GenfamiltEditData.parenting_history}
  onChange={(e) =>
    setGenfamilyEditData({
      ...GenfamiltEditData,
      parenting_history: e.target.value,
    })
  }
/> */}

                  </FormGroup>
                </div>

                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{getTranslation(wasThereAnyConflict,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
  className="form-control"
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
                  <Label htmlFor="birthPlace">{getTranslation(socialityWhere,lang)}</Label>
                  {/* <Input
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
                  /> */}

<select
  className="form-control"
  id="birthPlace"
  name="sociality_living"
  value={GenfamiltEditData.sociality_living}
  onChange={(e) =>
    setGenfamilyEditData({
      ...GenfamiltEditData,
      sociality_living: e.target.value,
    })
  }
>
  <option value="">{getTranslation("Select / चुनें", lang)}</option>

  <option value="Addict Surrounding">
    {getTranslation("Addict Surrounding / नशेड़ी आस-पास", lang)}
  </option>

  <option value="Social Atmosphere">
    {getTranslation("Social Atmosphere / सामाजिक माहौल", lang)}
  </option>

  <option value="Anti Social Locality">
    {getTranslation("Anti Social Locality / असामाजिक इलाका", lang)}
  </option>
</select>


                  <br />
                  <Label htmlFor="birthPlace">{getTranslation(highRiskBehavior,lang)}</Label>
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
                    <Label>{getTranslation(whatWasImpect,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
  className="form-control"
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
                    <Label>{getTranslation(hasAnyoneEverAbused,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
  className="form-control"
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
                <H5 className="mt-3 mb-3">{getTranslation(academicsOccupationalDetails,lang)}</H5>
                <div className="col-md-6">
                  <Label htmlFor="educationStatus">{getTranslation(EducationStatus,lang)}</Label>
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
                  {/* <Input
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
                  /> */}

{/* <VoiceTextarea
  className="form-control"
  name="education_status"
  value={GenfamiltEditData.education_status}
  onChange={(e) =>
    setGenfamilyEditData({
      ...GenfamiltEditData,
      education_status: e.target.value,
    })
  }
/> */}
<select
  className="form-control"
  name="education_status"
  value={GenfamiltEditData.education_status}
  onChange={(e) =>
    setGenfamilyEditData({
      ...GenfamiltEditData,
      education_status: e.target.value,
    })
  }
>
<option value="">{getTranslation("Select Education Status: / चुनें शिक्षा की स्थिति:", lang)}</option>

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

                {/*Occupational status? कार्य की स्थिति?*/}
                <div className="col-md-6">
                  <Label htmlFor="occupation">{getTranslation(OcuStatus,lang)}</Label>
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
                  {/* <Input
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
                  /> */}

{/* <VoiceTextarea
  className="form-control"
  name="occupation_status"
  value={GenfamiltEditData.occupation_status}
  onChange={(e) =>
    setGenfamilyEditData({
      ...GenfamiltEditData,
      occupation_status: e.target.value,
    })
  }
/> */}

<select
  className="form-control"
  name="occupation_status"
  value={GenfamiltEditData.occupation_status}
  onChange={(e) =>
    setGenfamilyEditData({
      ...GenfamiltEditData,
      occupation_status: e.target.value,
    })
  }
>
<option value="">{getTranslation("Select Occupational status? / चुनें कार्य की स्थिति?", lang)}</option>

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

                {/*If dropout what is the reason यदि ड्रॉपआउट हुआ तो क्या कारण है?*/}
                <div className="col-md-12 mt-3">
                  <FormGroup className="mb-0">
                    <Label>{getTranslation(ifDropout,lang)}</Label>
                    {/* <Input
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
                    /> */}

{/* <VoiceTextarea
  className="form-control"
  name="dropout_reason"
  value={GenfamiltEditData.dropout_reason}
  onChange={(e) =>
    setGenfamilyEditData({
      ...GenfamiltEditData,
      dropout_reason: e.target.value,
    })
  }
/> */}
<select
  className="form-control"
  name="dropout_reason"
  value={GenfamiltEditData.dropout_reason}
  onChange={(e) =>
    setGenfamilyEditData({
      ...GenfamiltEditData,
      dropout_reason: e.target.value,
    })
  }
>
<option value="">{getTranslation("Select If dropout what is the reason / / चुनें यदि ड्रॉपआउट हुआ तो क्या कारण है?", lang)}</option>

  <option value="Addiction">
    {getTranslation("Addiction / लत", lang)}
  </option>

  <option value="Personal">
    {getTranslation("Personal / पर्सनल", lang)}
  </option>

  <option value="NA">
    {getTranslation("NA / ना", lang)}
  </option>
</select>


                  </FormGroup>
                </div>

                {/*Study/Work Details: (what was job frequency)  /अध्ययन/कार्य विवरण: (नौकरी की फ्रीक्वेंसी क्या थी?)*/}
                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{getTranslation(studyWorkDetails,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
  className="form-control"
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
                    <Label>{getTranslation(Hobbies1,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
  className="form-control"
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
                    <Label>{getTranslation(extraSkills,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
  className="form-control"
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
                    <Label>{getTranslation(achievemntInLife,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
  className="form-control"
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
                <H5 className="mt-3 mb-3">{getTranslation(socialBehavior,lang)}</H5>
                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{getTranslation(socialBehavior1,lang)}</Label>
                    {/* <Input
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
                    /> */}

{/* <VoiceTextarea
  className="form-control"
  name="social_behavior"
  value={GenfamiltEditData.social_behavior}
  onChange={(e) =>
    setGenfamilyEditData({
      ...GenfamiltEditData,
      social_behavior: e.target.value,
    })
  }
/> */}

<select
  className="form-control"
  name="social_behavior"
  value={GenfamiltEditData.social_behavior}
  onChange={(e) =>
    setGenfamilyEditData({
      ...GenfamiltEditData,
      social_behavior: e.target.value,
    })
  }
>
  <option value="">{getTranslation("Select / चुनें", lang)}</option>

  <option value="Social">
    {getTranslation("Social / सामाजिक", lang)}
  </option>

  <option value="Anti Social">
    {getTranslation("Anti Social / असामाजिक", lang)}
  </option>
</select>


                  </FormGroup>
                </div>

                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{getTranslation(withWhomSpendFreeTime,lang)}</Label>
                    {/* <Input
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
                    /> */}
{/* 
<VoiceTextarea
  className="form-control"
  name="with_whom_spend_time"
  value={GenfamiltEditData.with_whom_spend_time}
  onChange={(e) =>
    setGenfamilyEditData({
      ...GenfamiltEditData,
      with_whom_spend_time: e.target.value,
    })
  }
/> */}

<select
  className="form-control"
  name="with_whom_spend_time"
  value={GenfamiltEditData.with_whom_spend_time}
  onChange={(e) =>
    setGenfamilyEditData({
      ...GenfamiltEditData,
      with_whom_spend_time: e.target.value,
    })
  }
>
  <option value="">{getTranslation("Select / चुनें", lang)}</option>

  <option value="Alone">
    {getTranslation("Alone / अकेले", lang)}
  </option>

  <option value="With Family">
    {getTranslation("With Family / परिवार के साथ", lang)}
  </option>

  <option value="In addict Community">
    {getTranslation("In addict Community / नशेड़ी समुदाय में", lang)}
  </option>

  <option value="With Friends">
    {getTranslation("With Friends / दोस्तों के साथ", lang)}
  </option>
</select>


                  </FormGroup>
                </div>

                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{getTranslation(howManyFriends,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
  className="form-control"
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
                    <Label>{getTranslation(friendSocialStatus,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
  className="form-control"
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
                    <Label>{getTranslation(howMuchDependent,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
  className="form-control"
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
                    <Label>{getTranslation(whoClosedWellWisher,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
  className="form-control"
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
                <H5 className="mt-3 mb-3">{getTranslation(legalHistory,lang)}</H5>
                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{getTranslation(domesticViolence,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
  className="form-control"
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
                    <Label>{getTranslation(reasonBehindDomesticViolence,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
  className="form-control"
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
                    <Label>{getTranslation(drugStatus,lang)}</Label>
                    {/* <Input
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
                    /> */}


<VoiceTextarea
  className="form-control"
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
                    <Label>{getTranslation(ifThereIsAnyCriminalCase,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
  className="form-control"
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
                    <Label>{getTranslation(specificCaseDetails,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
  className="form-control"
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
                    <Label>{getTranslation(currentCaseStatus,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
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
                    <Label>{getTranslation(ifWentToJail,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
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

                <H5 className="mt-3 mb-3">{getTranslation(patientBeh,lang)}</H5>

                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{getTranslation(whatIsTheMostImportantThing,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
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
                    <Label>{getTranslation(lifeAim,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
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

                <H5 className="mt-3 mb-3">{getTranslation(patientBehavior,lang)}</H5>
                <div className="col-md-12 table-responsive">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>{getTranslation(tableNumber,lang)}</th>
                        <th>{getTranslation(patientBehavior,lang)}</th>
                        <th>{getTranslation(yes,lang)}</th>
                        <th>{getTranslation(no,lang)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientBehaviorFormattedList.map(({ key, label }, index) => (
                        <tr key={key}>
                          <td>{index + 1}</td>
                          <td className="w-75">{getTranslation(label,lang)}</td>
                          {[getTranslation("Yes/हाँ",lang), getTranslation("No/नहीं",lang)].map((value) => {
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
                      {getTranslation(consent,lang)}
                    </Label>
                  </div>
                </div>

                {/*Content section start*/}
                <div className="row mt-3 mb-3">
                  <div className="col-md-4">
                    <Label>{getTranslation(name,lang)}</Label>
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
                    <Label>{getTranslation(relationship,lang)}</Label>
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
                    <Label>{getTranslation(signature,lang)}</Label>
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
                    <Label>{getTranslation(prepared,lang)}</Label>
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
                      getTranslation("Recreate General Family Admission/सामान्य पारिवारिक प्रवेश को पुनः बनाएँ",lang)
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
      {/* Edit gen family data / data will fetch by latest gen family id and showing into edit modal like pre fetch fill data into form for create re admission of genfamily form end*/}


{/* Edit individual gen family data by gen_fam_id  */}
<CommonModal
        isOpen={genEditIndividualmodal}
        title={getTranslation("Edit General Family Data/सामान्य पारिवारिक डेटा संपादित करें",lang)}
        toggler={closeGenFamily}
        maxWidth="1200px"
      >
        {GenfamiltEditData ? (
          <form className="theme-form" onSubmit={(e) => {
            e.preventDefault();
            handleUpdateIndividualGenFammilyData();
          }}>
            {/* UID */}
            <div className="row pt-3 pb-3">
              <FormGroup className="form-group row col-md-6">
                <Label className="col-sm-12 col-form-label  col-xl-6">
                  {getTranslation(UID,lang)}
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
                  {getTranslation(dateOfFormFilling,lang)}
                </Label>
                <Col xl="5" sm="12">
                  <div className="input-group">
                    <DatePicker showMonthDropdown showYearDropdown dropdownMode="select"
                      className="form-control digits"
                      selected={safeDate(GenfamiltEditData?.form_fill_date)}
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
                <Label>{getTranslation(relation,lang)}</Label>
                {/* <Input
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
                /> */}
                <select
  className="form-control mt-2"
  name="occupational_status"
  value={GenfamiltEditData.occupational_status}
  onChange={(e) =>
    setGenfamilyEditData({
      ...GenfamiltEditData,
      occupational_status: e.target.value,
    })
  }
>
  <option value="">
    {getTranslation("Select / चुनें", lang)}
  </option>
  <option value="Business">
    {getTranslation("Business / व्यापार", lang)}
  </option>
  <option value="Student">
    {getTranslation("Student / विद्यार्थी", lang)}
  </option>
  <option value="Family Business">
    {getTranslation("Family Business / पारिवारिक व्यवसाय", lang)}
  </option>
  <option value="Farming">
    {getTranslation("Farming / खेती", lang)}
  </option>
  <option value="Not Working">
    {getTranslation("Not Working / काम नहीं कर", lang)}
  </option>
  <option value="NA">
    {getTranslation("NA / ना", lang)}
  </option>
</select>

              </div>

              {/* Marital Status */}
              <div className="col-md-3">
                <Label>{getTranslation(marital,lang)}</Label>
                {/* <Input
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
                /> */}
                <select
  className="form-control mt-2"
  name="marital_status"
  value={GenfamiltEditData.marital_status}
  onChange={(e) =>
    setGenfamilyEditData({
      ...GenfamiltEditData,
      marital_status: e.target.value,
    })
  }
>
  <option value="">
    {getTranslation("Select / चुनें", lang)}
  </option>
  <option value="Single">
    {getTranslation("Single / अकेला", lang)}
  </option>
  <option value="Married">
    {getTranslation("Married / विवाहित", lang)}
  </option>
  <option value="Separated">
    {getTranslation("Separated / अलग किए", lang)}
  </option>
  <option value="Separated due to addiction">
    {getTranslation("Separated due to addiction / नशे की लत के कारण अलग हो गए", lang)}
  </option>
  <option value="Widower">
    {getTranslation("Widower / विधुर", lang)}
  </option>
</select>

              </div>

              {/* Living Situation */}
              <div className="col-md-3">
                <Label>{getTranslation(living,lang)}</Label>
                {/* <Input
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
                /> */}
                <select
  className="form-control mt-2"
  name="living_situation"
  value={GenfamiltEditData.living_situation}
  onChange={(e) =>
    setGenfamilyEditData({
      ...GenfamiltEditData,
      living_situation: e.target.value,
    })
  }
>
  <option value="">
    {getTranslation("Select / चुनें", lang)}
  </option>
  <option value="With Family">
    {getTranslation("With Family / परिवार के साथ", lang)}
  </option>
  <option value="Single for Job">
    {getTranslation("Single for Job / नौकरी के लिए सिंगल", lang)}
  </option>
  <option value="Single for Study">
    {getTranslation("Single for Study / पढ़ाई के लिए सिंगल", lang)}
  </option>
</select>

              </div>

              {/* Religion */}
              <div className="col-md-3">
                <Label>{getTranslation(religion,lang)}</Label>
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
              <h5 className="mt-3">{getTranslation(substanceDependency,lang)}</h5>
              <div className="row pt-3 pb-3">
                {/*Duration of regular use? / कब से पदार्थ निर्भर हैं? */}
                <div className="col-md-3">
                  <Label for="custom-duration">{getTranslation(durationOfRegularUse,lang)}</Label>
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
                  <Label for="daily-spent">{getTranslation(dailySpentSubstance,lang)}</Label>
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
                  <Label for="monthly-income">{getTranslation(patienMonthlyIncome,lang)}</Label>
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
                  <Label for="family-income">{getTranslation(familyMonthlyIncome,lang)}</Label>
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
              <h5 className="mt-3">{getTranslation(sourceOfMoney,lang)}</h5>
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
                    <Label htmlFor={source.id}>{getTranslation(source.label,lang)}</Label>

                    {source.id === "source_any_other" &&
                      GenfamiltEditData[source.id] === "Yes" && (
                        // <textarea
                        //   className="form-control mt-2"
                        //   rows="3"
                        //   placeholder="Please specify"
                        //   name="source_other_text"
                        //   value={GenfamiltEditData.source_other_text || ""}
                        //   onChange={(e) =>
                        //     setGenfamilyEditData((prev) => ({
                        //       ...prev,
                        //       source_other_text: e.target.value,
                        //     }))
                        //   }
                        // />
                        <VoiceTextarea
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
                    <Label>{getTranslation(Ifarrange,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
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
                    <Label>{getTranslation(mentionYear,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
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
                    <Label>{getTranslation(action,lang)}</Label>
                    {/* <Input
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
                    /> */}


<VoiceTextarea
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
                    <Label>{getTranslation(Residence,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
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
                    <Label>{getTranslation(experiencedTrauma,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
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
                    <Label>{getTranslation(occurredPatientBehavior,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
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
                    <Label>{getTranslation(sociality,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
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
                    <Label>{getTranslation(effectOfSubstance,lang)}</Label>
                    {/* <Input
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
                    /> */}


<VoiceTextarea
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
                    <Label>{getTranslation(ChiefComplaint,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
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
                  <h5 className="mt-3 mb-3">{getTranslation(ChiefComplaint,lang)}</h5>

                  <Table bordered>
                    <thead>
                      <tr>
                        <th scope="col">{getTranslation(TreatmentOfSubstance,lang)}</th>
                        <th scope="col">{getTranslation(howManyTimes,lang)}</th>
                      </tr>
                      <tr>
                        <th scope="col">{getTranslation(year,lang)}</th>
                        <th scope="col">{getTranslation(placeOfTreatment,lang)}</th>
                        <th scope="col">{getTranslation(durationOfTime,lang)}</th>
                        <th scope="col">{getTranslation(daysOfSobriety)}</th>
                        <th scope="col">{getTranslation(cheifAction,lang)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* {GenfamiltEditData.treatment_records.map((treatment, index) => ( */}
                      {(GenfamiltEditData.treatment_records || []).map((treatment, index) => (
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
                                {getTranslation("Remove/निकालना",lang)}
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
                    {getTranslation("+ Add More/+ और जोड़ें",lang)}
                  </Button>
                </div>
              </div>

              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{getTranslation(absuingSubstance,lang)}</Label>
                  {/* <Input
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
                  /> */}

<VoiceTextarea
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
                  <Label>{getTranslation(influenceStop,lang)}</Label>
                  {/* <Input
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
                  /> */}

<VoiceTextarea
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
                  <Label>{getTranslation(whenStopUsing,lang)}</Label>
                  {/* <Input
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
                  /> */}

<VoiceTextarea
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
                  <Label>{getTranslation(itReplaceWhenWhom,lang)}</Label>
                  {/* <Input
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
                  /> */}

<VoiceTextarea
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
                  <Label>{getTranslation(afterRelapse,lang)}</Label>
                  {/* <Input
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
                  /> */}

<VoiceTextarea
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
                  <Label>{getTranslation(haveDisorder,lang)}</Label>
                  {/* <Input
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
                  /> */}

<VoiceTextarea
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
                  <Label>{getTranslation(isProblmeOrInjury,lang)}</Label>
                  {/* <Input
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
                  /> */}

<VoiceTextarea
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
                  <Label>{getTranslation(DiagnosedOnTreatment,lang)}</Label>
                  {/* <Input
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
                  /> */}

<VoiceTextarea
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
                  <Label>{getTranslation(DoctorPlaceDuration,lang)}</Label>
                  {/* <Input
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
                  /> */}

<VoiceTextarea
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
                  <Label>{getTranslation(ifGone,lang)}</Label>
                  {/* <Input
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
                  /> */}

<VoiceTextarea
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
                  <Label>{getTranslation(YouFamiliar,lang)}</Label>
                  {/* <Input
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
                  /> */}

<VoiceTextarea
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
                <H5 className="mt-3 mb-3">{getTranslation(relationshipFamilyStatus,lang)}</H5>
                <div className="col-md-6">
                  <Label htmlFor="marital_status">{getTranslation(relationshipStatus,lang)}</Label>
                  {/* <Input
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
                  /> */}
                  <select
  className="form-control"
  name="traditional_treatment"
  value={GenfamiltEditData.traditional_treatment}
  onChange={(e) =>
    setGenfamilyEditData({
      ...GenfamiltEditData,
      traditional_treatment: e.target.value,
    })
  }
>
  <option value="">
    {getTranslation("Select / चुनें", lang)}
  </option>
  <option value="Single">
    {getTranslation("Single / सिंगल", lang)}
  </option>
  <option value="Married">
    {getTranslation("Married / शादीशुदा", lang)}
  </option>
  <option value="Separated">
    {getTranslation("Separated / अलग", lang)}
  </option>
  <option value="Widower">
    {getTranslation("Widower / विधवा", lang)}
  </option>
  <option value="Committed">
    {getTranslation("Committed / कमिटेड", lang)}
  </option>
  <option value="Broke up">
    {getTranslation("Broke up / ब्रेक अप", lang)}
  </option>
</select>


{/* <VoiceTextarea
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
/> */}

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
                    <Label>{getTranslation(relationshipStatus,lang)}</Label>
                    {/* <Input
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
                    /> */}
                    <select
  className="form-control"
  name="marriage_arrangement"
  value={GenfamiltEditData.marriage_arrangement}
  onChange={(e) =>
    setGenfamilyEditData({
      ...GenfamiltEditData,
      marriage_arrangement: e.target.value,
    })
  }
>
  <option value="">{getTranslation("Select / चुनें", lang)}</option>

  <option value="Love Marriage">
    {getTranslation("Love Marriage / लव मैरिज", lang)}
  </option>

  <option value="Arrange Marriage">
    {getTranslation("Arrange Marriage / अरेंज मैरिज", lang)}
  </option>

  <option value="Not Married">
    {getTranslation("Not Married / अविवाहित", lang)}
  </option>

  <option value="Separated">
    {getTranslation("Separated / अलग", lang)}
  </option>

  <option value="Widower">
    {getTranslation("Widower / विधवा", lang)}
  </option>
</select>


{/* <VoiceTextarea
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
/> */}

                  </FormGroup>
                </div>

                {/*After marriage life or relationship Status*/}
                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{getTranslation(afterMerriageLife,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
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
                    <Label>{getTranslation(isThereInterference,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
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
                          <th scope="col">{getTranslation(nameisThere,lang)}</th>
                          <th scope="col">{getTranslation(relationisThere,lang)}</th>
                          <th scope="col">{getTranslation(relationisAge,lang)}</th>
                          <th scope="col">{getTranslation(livingStatus,lang)}</th>
                          <th scope="col">{getTranslation(AnyPhysicalDisorder,lang)}</th>
                          <th scope="col">{getTranslation(cheifAction,lang)}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* {GenfamiltEditData.members.map((inter, index) => ( */}
                        {(GenfamiltEditData?.members || []).map((inter, index) => (
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
                                  {getTranslation("Remove/निकालना",lang)}
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
                      {getTranslation("Add More / और जोड़ें",lang)}
                    </Button>
                  </div>

                  <FormGroup className="mb-0">
                    <Label>{getTranslation(ifAnyDisorder,lang)}</Label>
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
                    <p className="mt-3 mb-3">{getTranslation(familyHistorySubstanceAbuse,lang)}</p>
                    <Table bordered>
                      <thead>
                        <tr>
                          <th>{getTranslation("Mother Side/मातृ पक्ष",lang)}</th>
                          <th>{getTranslation("Alcohol/शराब",lang)}</th>
                          <th>{getTranslation("Drug/दवाई",lang)}</th>
                          <th>{getTranslation("Psych/साइक",lang)}</th>
                          <th>{getTranslation("Father Side/पिता पक्ष",lang)}</th>
                          <th>{getTranslation("Alcohol/शराब",lang)}</th>
                          <th>{getTranslation("Drug/दवाई",lang)}</th>
                          <th>{getTranslation("Psych/साइक",lang)}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{getTranslation("Grandmother/दादी",lang)}</td>
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
                          <td>{getTranslation("Grandmother/दादी",lang)}</td>
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
                          <td>{getTranslation("Grandfather/दादाजी",lang)}</td>
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
                          <td>{getTranslation("Grandfather/दादाजी",lang)}</td>
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
                          <td>{getTranslation("Mother/माँ",lang)}</td>
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
                          <td>{getTranslation("Aunt / मामी",lang)}</td>
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
                          <td>{getTranslation("Aunt / चाची",lang)}</td>
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
                          <td>{getTranslation("Uncle / मामा",lang)}</td>
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
                          <td>{getTranslation("Uncle / चाचा",lang)}</td>
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
                  <Label>{getTranslation(anyOtherPlsMention1,lang)}</Label>
                  {/* <Input
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
                  /> */}

<VoiceTextarea
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
                  <Label>{getTranslation(currentStatus,lang)}</Label>
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
                  {/* <Input
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
                  /> */}
                  <select
  name="current_status"
  className="form-control"
  value={GenfamiltEditData.current_status}
  onChange={(e) =>
    setGenfamilyEditData({
      ...GenfamiltEditData,
      current_status: e.target.value,
    })
  }
>
  <option value="">{getTranslation("Select / चुनें", lang)}</option>

  <option value="Active">
    {getTranslation("Active / एक्टिव", lang)}
  </option>

  <option value="Non Active">
    {getTranslation("Non Active / नॉन एक्टिव", lang)}
  </option>

  <option value="Passed Away">
    {getTranslation("Passed Away / निधन हो गया", lang)}
  </option>

  <option value="Seprated">
    {getTranslation("Seprated / अलग हो गया", lang)}
  </option>

  <option value="Others">
    {getTranslation("Others / अन्य", lang)}
  </option>
</select>

                </div>

                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{getTranslation(howWasBonding,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
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
                    <Label>{getTranslation(familyBehaviorPatient,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
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
                    <Label>{getTranslation(monitoringFamily,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
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
                    <Label>{getTranslation(ralationshipFamilyMember,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
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

                <H5 className="mt-3 mb-3">{getTranslation(childhood,lang)}</H5>
                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{getTranslation(birthConditions,lang)}</Label>
                    {/* <Input
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
                    /> */}
                    <select
  className="form-control"
  name="birth_conditions"
  value={GenfamiltEditData.birth_conditions}
  onChange={(e) =>
    setGenfamilyEditData({
      ...GenfamiltEditData,
      birth_conditions: e.target.value,
    })
  }
>
  <option value="">{getTranslation("Select / चुनें", lang)}</option>

  <option value="Normal">{getTranslation("Normal / नॉर्मल", lang)}</option>
  <option value="Cesarean">{getTranslation("Cesarean / सिजेरियन", lang)}</option>
  <option value="Pre Mature">{getTranslation("Pre Mature / प्रीमैच्योर", lang)}</option>
</select>


{/* <VoiceTextarea
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
/> */}

                  </FormGroup>
                </div>

                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{getTranslation(parentingHistory,lang)}</Label>
                    {/* <Input
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
                    /> */}

<select
  className="form-control"
  name="parenting_history"
  value={GenfamiltEditData.parenting_history}
  onChange={(e) =>
    setGenfamilyEditData({
      ...GenfamiltEditData,
      parenting_history: e.target.value,
    })
  }
>
  <option value="">{getTranslation("Select / चुनें", lang)}</option>

  <option value="With Mother Father">
    {getTranslation("With Mother Father / माँ-बाप के साथ", lang)}
  </option>

  <option value="With Grandparent">
    {getTranslation("With Grandparent / दादा-दादी के साथ", lang)}
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


{/* <VoiceTextarea
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
/> */}

                  </FormGroup>
                </div>

                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{getTranslation(wasThereAnyConflict,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
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
                  <Label htmlFor="birthPlace">{getTranslation(socialityWhere,lang)}</Label>
                  {/* <Input
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
                  /> */}
                  <select
  className="form-control"
  id="birthPlace"
  name="sociality_living"
  value={GenfamiltEditData.sociality_living}
  onChange={(e) =>
    setGenfamilyEditData({
      ...GenfamiltEditData,
      sociality_living: e.target.value,
    })
  }
>
  <option value="">{getTranslation("Select / चुनें", lang)}</option>

  <option value="Addict Surrounding">
    {getTranslation("Addict Surrounding / नशेड़ी आस-पास", lang)}
  </option>

  <option value="Social Atmosphere">
    {getTranslation("Social Atmosphere / सामाजिक माहौल", lang)}
  </option>

  <option value="Anti Social Locality">
    {getTranslation("Anti Social Locality / असामाजिक इलाका", lang)}
  </option>
</select>


                  <br />
                  <Label htmlFor="birthPlace">{getTranslation(highRiskBehavior,lang)}</Label>
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
                    <Label>{getTranslation(whatWasImpect,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
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
                    <Label>{getTranslation(hasAnyoneEverAbused,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
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
                <H5 className="mt-3 mb-3">{getTranslation(academicsOccupationalDetails,lang)}</H5>
                <div className="col-md-6">
                  <Label htmlFor="educationStatus">{getTranslation(EducationStatus,lang)}</Label>
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
                  {/* <Input
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
                  /> */}

{/* <VoiceTextarea
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
/> */}

<select
  className="form-control"
  name="education_status"
  value={GenfamiltEditData.education_status}
  onChange={(e) =>
    setGenfamilyEditData({
      ...GenfamiltEditData,
      education_status: e.target.value,
    })
  }
>
<option value="">{getTranslation("Select Education Status: / चुनें शिक्षा की स्थिति:", lang)}</option>

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

                {/*Occupational status? कार्य की स्थिति?*/}
                <div className="col-md-6">
                  <Label htmlFor="occupation">{getTranslation(OcuStatus,lang)}</Label>
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
                  {/* <Input
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
                  /> */}

{/* <VoiceTextarea
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
/> */}

<select
  className="form-control"
  name="occupation_status"
  value={GenfamiltEditData.occupation_status}
  onChange={(e) =>
    setGenfamilyEditData({
      ...GenfamiltEditData,
      occupation_status: e.target.value,
    })
  }
>
<option value="">{getTranslation("Select Occupational status? / चुनें कार्य की स्थिति?", lang)}</option>

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

                {/*If dropout what is the reason यदि ड्रॉपआउट हुआ तो क्या कारण है?*/}
                <div className="col-md-12 mt-3">
                  <FormGroup className="mb-0">
                    <Label>{getTranslation(ifDropout,lang)}</Label>
                    {/* <Input
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
                    /> */}

{/* <VoiceTextarea
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
/> */}

<select
  className="form-control"
  name="dropout_reason"
  value={GenfamiltEditData.dropout_reason}
  onChange={(e) =>
    setGenfamilyEditData({
      ...GenfamiltEditData,
      dropout_reason: e.target.value,
    })
  }
>
<option value="">{getTranslation("Select If dropout what is the reason / / चुनें यदि ड्रॉपआउट हुआ तो क्या कारण है?", lang)}</option>

  <option value="Addiction">
    {getTranslation("Addiction / लत", lang)}
  </option>

  <option value="Personal">
    {getTranslation("Personal / पर्सनल", lang)}
  </option>

  <option value="NA">
    {getTranslation("NA / ना", lang)}
  </option>
</select>

                  </FormGroup>
                </div>

                {/*Study/Work Details: (what was job frequency)  /अध्ययन/कार्य विवरण: (नौकरी की फ्रीक्वेंसी क्या थी?)*/}
                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{getTranslation(studyWorkDetails,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
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
                    <Label>{getTranslation(Hobbies1,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
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
                    <Label>{getTranslation(extraSkills,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
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
                    <Label>{getTranslation(achievemntInLife,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
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
                <H5 className="mt-3 mb-3">{getTranslation(socialBehavior,lang)}</H5>
                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{getTranslation(socialBehavior1,lang)}</Label>
                    {/* <Input
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
                    /> */}

{/* <VoiceTextarea
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
/> */}

<select
  className="form-control"
  name="social_behavior"
  value={GenfamiltEditData.social_behavior}
  onChange={(e) =>
    setGenfamilyEditData({
      ...GenfamiltEditData,
      social_behavior: e.target.value,
    })
  }
>
  <option value="">{getTranslation("Select / चुनें", lang)}</option>

  <option value="Social">
    {getTranslation("Social / सामाजिक", lang)}
  </option>

  <option value="Anti Social">
    {getTranslation("Anti Social / असामाजिक", lang)}
  </option>
</select>


                  </FormGroup>
                </div>

                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{getTranslation(withWhomSpendFreeTime,lang)}</Label>
                    {/* <Input
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
                    /> */}

{/* <VoiceTextarea
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
/> */}

<select
  className="form-control"
  name="with_whom_spend_time"
  value={GenfamiltEditData.with_whom_spend_time}
  onChange={(e) =>
    setGenfamilyEditData({
      ...GenfamiltEditData,
      with_whom_spend_time: e.target.value,
    })
  }
>
  <option value="">{getTranslation("Select / चुनें", lang)}</option>

  <option value="Alone">
    {getTranslation("Alone / अकेले", lang)}
  </option>

  <option value="With Family">
    {getTranslation("With Family / परिवार के साथ", lang)}
  </option>

  <option value="In addict Community">
    {getTranslation("In addict Community / नशेड़ी समुदाय में", lang)}
  </option>

  <option value="With Friends">
    {getTranslation("With Friends / दोस्तों के साथ", lang)}
  </option>
</select>


                  </FormGroup>
                </div>

                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{getTranslation(howManyFriends,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
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
                    <Label>{getTranslation(friendSocialStatus,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
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
                    <Label>{getTranslation(howMuchDependent,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
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
                    <Label>{getTranslation(whoClosedWellWisher,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
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
                <H5 className="mt-3 mb-3">{getTranslation(legalHistory,lang)}</H5>
                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{getTranslation(domesticViolence,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
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
                    <Label>{getTranslation(reasonBehindDomesticViolence,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
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
                    <Label>{getTranslation(drugStatus,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
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
                    <Label>{getTranslation(ifThereIsAnyCriminalCase,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
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
                    <Label>{getTranslation(specificCaseDetails,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
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
                    <Label>{getTranslation(currentCaseStatus,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
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
                    <Label>{getTranslation(ifWentToJail,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
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

                <H5 className="mt-3 mb-3">{getTranslation(patientBeh,lang)}</H5>

                <div className="col-md-12">
                  <FormGroup className="mb-0">
                    <Label>{getTranslation(whatIsTheMostImportantThing,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
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
                    <Label>{getTranslation(lifeAim,lang)}</Label>
                    {/* <Input
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
                    /> */}

<VoiceTextarea
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

                <H5 className="mt-3 mb-3">{getTranslation(patientBehavior,lang)}</H5>
                <div className="col-md-12 table-responsive">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>{getTranslation(tableNumber,lang)}</th>
                        <th>{getTranslation(patientBehavior,lang)}</th>
                        <th>{getTranslation(yes,lang)}</th>
                        <th>{getTranslation(no,lang)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientBehaviorFormattedList.map(({ key, label }, index) => (
                        <tr key={key}>
                          <td>{index + 1}</td>
                          <td className="w-75">{getTranslation(label,lang)}</td>
                          {[getTranslation("Yes/हाँ",lang), getTranslation("No/नहीं",lang)].map((value) => {
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
                      {getTranslation(consent,lang)}
                    </Label>
                  </div>
                </div>

                {/*Content section start*/}
                <div className="row mt-3 mb-3">
                  <div className="col-md-4">
                    <Label>{getTranslation(name,lang)}</Label>
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
                    <Label>{getTranslation(relationship,lang)}</Label>
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
                    <Label>{getTranslation(signature,lang)}</Label>
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
                    <Label>{getTranslation(prepared,lang)}</Label>
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
                      getTranslation("Update Gen Family Details/जनरल परिवार विवरण अपडेट करें",lang)
                    )}
                  </Button>
                </div>
              </div>

            </div>
          </form>
        ) : (
          <p className="text-center p-4">{getTranslation("Loading data.../डेटा लोड हो रहा है...",lang)}</p>
        )}
      </CommonModal>

      {/* View user details modal */}
      <UserDetailsModal
        isOpen={viewUserDetailsModal}
        userId={selectedViewUserId}
        toggler={() => setViewUserDetailsModal(false)}
      />

    </Fragment>
  );
}

export default GenFamily;
