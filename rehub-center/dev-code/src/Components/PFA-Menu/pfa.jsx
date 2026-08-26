import React, {
  useEffect,
  useState,
  useCallback,
  Fragment,
  useRef,
} from "react";
import {
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
  consent,
  name,
  relationship,
  signature,
  anyOtherFindings,
  prepared,
  Simple,
  neurologicalOptions,
  Weight,
  PulseRate,
  Bloodpressure,
  Temperature,
  Lymphadenopathy,
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
import { H5, Btn, P, H4 } from "../../AbstractElements";
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

import { useReactToPrint } from "react-to-print";

function PFA() {
  const { lang } = useLang(); // get current language from context


 //Branches selection
  const { selectedBranch } = useBranch();

  const pdfRef = useRef();
  const [isDownloading, setIsDownloading] = useState(false);

  //spinner extract from other file
  const selectedSpinner = Data.find(
    (item) => item.spinnerClass === "loader-37"
  );

  //PFA form data
  const [formData, setFormData] = useState({
    dateOfAdmission: new Date(),
    dateOfAssessment: new Date(),
    dependentToData: "",
    substanceUsePatternData: "",
    last30DaysQuantityData: "",

    medicalConfirmationData: "", // for anyMedicalHistory
    bloodConfirmationData: "", // for anyBloodTransfusionHistory
    weight: "",
    pulse_rate: "",
    blood_pressure: "",
    temperature: "",

    lymphadenopathy: "",

    bloodTransfusionHistoryData: "",

    complications: {
      ulcer: "",
      respiratory_problem: "",
      jaundice: "",
      haematemesis: "",
      abdominal_complaints: "",
      cardiovascular: "",
    },
    complication_description: "",

    neurological: {
      delirium: "",
      seizure: "",
      blackout: "",
      memory_loss: "",
      trembling: "",
      epilepsy: "",
      neuropathy: "",
    },
    neuro_description: "",

    nutritional_status: "",

    other_findings: "",

    consent: "No", // or "Yes" if checked by default
    consent_name: "",
    consent_relationship: "",
    consent_signature: "",
    prepared_by: "",

    verification: "No",
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

  //Registered Patient data
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
          const pfaDate = user.recent_pfa_date
            ? new Date(user.recent_pfa_date)
            : null;
        
          let isPFACompleted = false;
          let userStatus = (
            <p className="badge bg-warning text-dark p-2">{getTranslation("Pending/लंबित",lang)}</p>
          );
        
          if (admitDate && pfaDate && admitDate > pfaDate) {
            isPFACompleted = true;
            userStatus = <p className="badge bg-success p-2">{getTranslation("Completed/पुरा होना।",lang)}</p>;
          }
        
          const dischargeStatus = user.discharge_status_text || "Unknown";
        
          return {
            id: user.user_id,
            gks_id: user.gks_id || "N/A",
            name: user.name,
            status: userStatus,
            isPFACompleted,   // ✅ new flag
            dischargeStatus: user.discharge_status,
            dischargeStatusText: dischargeStatus,
            isReadmission: user.is_readmission,
            recent_pfa_id: user.recent_pfa_id,
          };
        });
        
  
        setTimeout(() => {
          setData(formatted);
          setFilteredData(formatted);
          setstillLoading(false);
        }, 1000);
      })
      .catch((error) => {
        console.error("Error fetching PFA user data:", error);
        setstillLoading(true);
      });
  }, [selectedBranch]);
  
  




  //PFA view
  const [viewModal, setViewModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  //close view data modal
  const closeUserViewModal = () => {
    setViewModal(false);
    setPFAEditModal(false);
    setPFAEditIndividualDataModal(false);
  };


//Getting registred patient data into table row 
  const tableColumns = [
  {  name: `${getTranslation('User ID/उपयोगकर्ता आईडी' , lang)}`, selector: (row) => row.id, sortable: true, center: true },
  { name: `${getTranslation('GKS ID/GKS आईडी' , lang)}`, selector: (row) => row.gks_id, sortable: true, center: true },
  {
    name: `${getTranslation('Patient name/रोगी का नाम' , lang)}`,
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
  //Old code
// {
//   name: "Action",
//   center: true,
//   cell: (row) => (
//     <div className="d-flex gap-2">
//       <span
//             onClick={() => toggle(row.id)}
//             style={{ cursor: "pointer" }}
//             title="View"
//           >
//           <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 width="24"
//                 height="24"
//                 viewBox="0 0 24 24"
//                 fill="none"
//                 stroke="currentColor"
//                 stroke-width="2"
//                 stroke-linecap="round"
//                 stroke-linejoin="round"
//               >
//                 <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
//                 <line x1="12" y1="8" x2="12" y2="16"></line>
//                 <line x1="8" y1="12" x2="16" y2="12"></line>
//               </svg>
//         </span>
//         <>
//           {/* <span
//             onClick={() => viewPFAToggle(row.id)}
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
//             onClick={() => handleFAEdit(row.id)}
//             style={{ cursor: "pointer", marginLeft: "10px" }}
//             title="Edit"
//           >
//           <svg
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
//             onClick={() => handlePFADelete(row.id)}
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
//           </span> */}
          
//         </>
      
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
        {/* Show Edit only if not discharged and readmission */}
        {row.dischargeStatus === 0 && row.isReadmission === 1 && (
          <span
            onClick={() => handlePreeFillCreateReadmissionPFA(row.recent_pfa_id)}
            style={{ cursor: "pointer" }}
            title={getTranslation("Readmission PFA/पुनः प्रवेश पीएफए",lang)}
          >
            ✏️
          </span>
        )}

 
          {/* <span
            onClick={() => handlePreeFillCreateReadmissionPFA(row.recent_pfa_id)}
            style={{ cursor: "pointer" }}
            title="Readmission PFA"
          >
            ✏️
          </span> */}
     

        {/* Show Create PFA if not discharged and not readmission */}
        {/* {row.dischargeStatus === 0 && row.isReadmission === 0 && (
          <span
            onClick={() => toggle(row.id)}
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
        )} */}

{row.dischargeStatus === 0 && row.isReadmission === 0 && (
  <span
    onClick={() => (row.isPFACompleted ? null : toggle(row.id))}
    style={{
      cursor: row.isPFACompleted ? "not-allowed" : "pointer",
      opacity: row.isPFACompleted ? 0.5 : 1,
    }}
    title={row.isPFACompleted ? getTranslation("PFA Completed/पीएफए ​​पूरा हुआ",lang) : getTranslation("Create PFA/पीएफए ​​बनाएं",lang)}
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

const tablePFAPatientListColumns = [
  { name: `${getTranslation('User ID/उपयोगकर्ता आईडी' , lang)}`, selector: (row) => row.user_id, sortable: true, center: true },
  { name: "PFA ID/रोगी का प्रथम मूल्यांकन आईडी", selector: (row) => row.pfa_id, sortable: true, center: true },
  { name: `${getTranslation('GKS ID/GKS आईडी' , lang)}`, selector: (row) => row.gks_id, sortable: true, center: true },
  { name: `${getTranslation('Patient Phone/मरीज़ का फ़ोन' , lang)}`, selector: (row) => row.phone, sortable: true, center: true },
  { name: `${getTranslation('Email/ईमेल' , lang)}`, selector: (row) => row.email, sortable: true, center: true },
  {
    name: `${getTranslation('Patient name/रोगी का नाम' , lang)}`,
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
        <p className="badge bg-success p-2">PFA {row.status}</p>
      </span>
    ),
  },
  {
    name: `${getTranslation('Action/क्रिया' , lang)}`,
    center: true,
    cell: (row) => (
      <div className="d-flex gap-2">
          <>
            <span
              onClick={() => viewPFAToggle(row.user_id)}
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
              onClick={() => handleAllPFAEditData(row.user_id)}
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

  //view pfa handler
  //fetch the latest assessment based on created_at, then simply sort the assessments and pick the first one:
  const viewPFAToggle = async (userId = null) => {
    if (typeof userId === "object" && userId !== null) {
      userId = userId.id;
    }
  
    if (!userId) {
      console.error("Invalid userId provided to toggle");
      return;
    }
  
    setViewModal(true);
    setIsLoading(true);
  
    const branch_id = selectedBranch;
    const token = localStorage.getItem("Authorization");
  
    try {
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/pfa/user-assessments/${userId}?branch_id=${branch_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        }
      );
  
      const result = await response.json();
  
      if (!response.ok) {
        console.error("User fetch error:", result);
        return;
      }
  
      // API returns assessments array in result.data
      const latestAssessment = (result.data || []).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      )[0];
  
      if (!latestAssessment) {
        console.warn("No assessments found for this user.");
        return;
      }
  
      setSelectedUser(latestAssessment);
      console.log("Selected User Assessment:", latestAssessment);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  

  const selectableRowDisabled = (row) => row.disabled === true;

  const handleRowSelected = (state) => {
    const selectedRow = state.selectedRows[0];
    if (!selectedRow) return;

    if (selectedRow.disabled) {
      Swal.fire("Disabled", "This user's assessment is deleted.", "info");
      return;
    }

    setSelectedUser(selectedRow);
    setPFAEditModal(true);

    // Make sure this is set correctly
    setPFAeditData({
      pfa_id: selectedRow.pfa_id, // or selectedRow.pfa_id if that’s what you named it
      name: selectedRow.name,
      // include other fields if needed
    });
  };

  // //Date of Admission State/प्रवेश की तिथि
  // const [startDateOfAdmission, setstartDateOfAdmission] = useState(new Date());
  // const handleChangeAdmission = (date) => {
  //   setstartDateOfAdmission(date);
  //   console.log("Date of Admission", date);
  // };
  // //Date of Assessment State
  // const [startDateOfAssessment, setstartDateOfAssessment] = useState(
  //   new Date()
  // );
  // const handleChangeAssessment = (date) => {
  //   setstartDateOfAssessment(date);
  //   console.log("Date of Assessment", date);
  // };

  //Modal
  const [modal, setModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // User data

  //Auto fetch dob and calculate age based on dob
  //This React hook calculates a user's age based on their date of birth (dob) and returns the age on PFA form by create.
  const dob = selectedUser?.[0]?.dob;
  const patientCalAge = useCalculateAge(dob);
  console.log("DOB", patientCalAge);
  // const [patientCalAge, setPatientAge] = useState("");
  // useEffect(() => {
  //   if (selectedUser && selectedUser[0]?.dob) {
  //     const age = calculateAge(selectedUser[0].dob);
  //     setPatientAge(age);
  //   }
  // }, [selectedUser]);
  // const calculateAge = (dob) => {
  //   const birthDate = new Date(dob);
  //   const today = new Date();
  //   let age = today.getFullYear() - birthDate.getFullYear();
  //   const monthDiff = today.getMonth() - birthDate.getMonth();

  //   if (
  //     monthDiff < 0 ||
  //     (monthDiff === 0 && today.getDate() < birthDate.getDate())
  //   ) {
  //     age--;
  //   }

  //   return age;
  // };

  const closePFAModal = () => {
    setModal(false);
   

  };
  const toggle = async (userId = null) => {
    // Always open modal
    setModal(true);
  
    if (userId) {
      const branch_id = selectedBranch;
      const token = localStorage.getItem("Authorization");
  
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
  
        const result = await response.json();
  
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
  

  //PFA POST data API call

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Start loader

    const requiredFields = [
      formData.dependentToData,
      formData.substanceUsePatternData,
      formData.last30DaysQuantityData,
      formData.medicalConfirmationData,
      formData.bloodConfirmationData,
      formData.weight,
      formData.pulse_rate,
      formData.blood_pressure,
      formData.temperature,
      formData.bloodTransfusionHistoryData,
      formData.complications.ulcer,
      formData.complications.respiratory_problem,
      formData.complications.jaundice,
      formData.complications.haematemesis,
      formData.complications.abdominal_complaints,
      formData.complications.cardiovascular,
      formData.complication_description,
      formData.neurological.delirium,
      formData.neurological.seizure,
      formData.neurological.blackout,
      formData.neurological.memory_loss,
      formData.neurological.trembling,
      formData.neurological.epilepsy,
      formData.neurological.neuropathy,
      formData.neuro_description,
      formData.other_findings,
      formData.consent,
      formData.consent_name,
      formData.consent_relationship,
      formData.consent_signature,
      formData.prepared_by,
    ];

    const allFieldsFilled = requiredFields.every(
      (field) => field !== "" && field !== null && field !== undefined
    );

    if (!allFieldsFilled) {
      setIsLoading(false);
      Swal.fire({
        icon: "warning",
        title: getTranslation("Missing Fields/लापता फ़ील्ड",lang),
        text: getTranslation("Please fill all required fields before submitting./सबमिट करने से पहले कृपया सभी ज़रूरी फ़ील्ड भरें।",lang),
      });
      return;
    }

    const payload = {
      user_id: selectedUser[0].user_id,
      // date_of_admission: formData.dateOfAdmission?.toISOString(),
      date_of_assessment: formData.dateOfAssessment?.toISOString(),
      dependent_to: formData.dependentToData,
      substance_use_pattern: formData.substanceUsePatternData,
      last_30_days_quantity: formData.last30DaysQuantityData,
      medical_history: formData.medicalConfirmationData,
      weight: Number(formData.weight) || 0,
      pulse_rate: Number(formData.pulse_rate) || 0,
      blood_pressure: formData.blood_pressure || "", // usually string like "120/80"
      temperature: Number(formData.temperature) || 0,
      lymphadenopathy: formData.lymphadenopathy,
      blood_transfusion_history: formData.bloodConfirmationData,
      medical_or_blood_history_details: formData.bloodTransfusionHistoryData,
      ...formData.complications,
      ...formData.neurological,
      complication_description: formData.complication_description,
      neuro_description: formData.neuro_description,
      other_findings: formData.other_findings,
      consent: formData.consent,
      verification: formData.verification,
      consent_name: formData.consent_name,
      consent_relationship: formData.consent_relationship,
      consent_signature: formData.consent_signature,
      prepared_by: formData.prepared_by,
      nutritional_status: formData.nutritional_status,
    };

    try {
      const branch_id = selectedBranch; // make sure `selectedBranch` 
      const token = localStorage.getItem("Authorization");

      //new pfa API 
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/pfa/create-assessment?branch_id=${branch_id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      console.log("payload", payload);
      const result = await response.json();
      console.log("result", result);

      if (!response.ok) {
        setIsLoading(false);
        Swal.fire({
          icon: "error",
          title: getTranslation("Submission Failed/सबमिशन विफल",lang),
          text: result.message || getTranslation("Server error/सर्वर त्रुटि",lang),
        }).then(() => {
  // This runs after the user clicks "OK"
  setModal(false);
});
        return;
      }
      // ✅ Success Case
  setIsLoading(false);
  Swal.fire({
    icon: "success",
    title: getTranslation("PFA Created Successfully/PFA सफलतापूर्वक बनाया गया",lang),
    text: getTranslation("The PFA assessment was submitted successfully./PFA असेसमेंट सक्सेसफुली सबमिट हो गया।",lang),
  }).then(() => {
  // This runs after the user clicks "OK"
  setModal(false);
});
    } catch (error) {
      setIsLoading(false);
      Swal.fire({
        icon: "error",
        title: getTranslation("Unexpected Error/अप्रत्याशित त्रुटि",lang),
        text: getTranslation("PFA failed! Unknown error occurred./PFA फेल हो गया! कोई अनजान एरर हुआ।",lang),
      });
    }
  };

  //Partially delete, delete row will show but it's disbaled

  // const handlePFADelete = async (userId) => {
  //   const token = localStorage.getItem("Authorization");

  //   if (!userId) {
  //     console.error("No userId provided for deletion");
  //     Swal.fire("Error", "No user selected for deletion", "error");
  //     return;
  //   }

  //   console.log("Delete called with userId:", userId);

  //   const confirm = await Swal.fire({
  //     title: "Are you sure?",
  //     text: "You are about to delete this assessment.",
  //     icon: "warning",
  //     showCancelButton: true,
  //     confirmButtonText: "Yes, delete it!",
  //   });

  //   if (!confirm.isConfirmed) return;

  //   try {
  //     // First, get pfa_id using userId
  //     const getResponse = await fetch(
  //       `https://gks-yjdc.onrender.com/api/pfa/user-assessment/${userId}`,
  //       {
  //         method: "GET",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: `${token}`,
  //         },
  //       }
  //     );

  //     const data = await getResponse.json();

  //     if (!getResponse.ok || !data?.assessment?.patient_id) {
  //       console.error("Failed to get assessment data:", data);
  //       Swal.fire("Error", "Could not fetch assessment info.", "error");
  //       return;
  //     }

  //     const pfa_id = data.assessment.patient_id;
  //     console.log("Fetched pfa_id:", pfa_id);

  //     // Now delete using pfa_id
  //     const delResponse = await fetch(
  //       `https://gks-yjdc.onrender.com/api/pfa/delete-assessment/${pfa_id}`,
  //       {
  //         method: "DELETE",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: `${token}`,
  //         },
  //       }
  //     );

  //     const result = await delResponse.json();

  //     if (!delResponse.ok) {
  //       console.error("Delete failed:", result);
  //       Swal.fire("Error", "Assessment deletion failed!", "error");
  //       return;
  //     }

  //     Swal.fire("Deleted!", "Assessment has been deleted.", "success");

  //     // // Disable that row
  //     // setData((prev) =>
  //     //   prev.map((user) =>
  //     //     user.id === userId ? { ...user, disabled: true } : user
  //     //   )
  //     // );
  //     // setFilteredData((prev) =>
  //     //   prev.map((user) =>
  //     //     user.id === userId ? { ...user, disabled: true } : user
  //     //   )
  //     // );/
  //     // Completely remove the row
  //     setData((prev) => prev.filter((user) => user.id !== userId));
  //     setFilteredData((prev) => prev.filter((user) => user.id !== userId));
  //   } catch (error) {
  //     console.error("Error deleting assessment:", error);
  //     Swal.fire("Error", "Something went wrong.", "error");
  //   }
  // };

  //PFA edit handler
  const [PFAeditData, setPFAeditData] = useState({});
  const [PFAEditModal, setPFAEditModal] = useState(false);

  const [PFAEditIndividualDataModal, setPFAEditIndividualDataModal] = useState(false);
  //fetch the latest assessment based on created_at, then simply sort the assessments and pick the first one: - Not applicable
  //Re-admission patient by handlePDAEdit
    //🔧 Convert DD/MM/YYYY to Date Object:
const parseDateString = (dateStr) => {
  if (!dateStr) return null;

  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};
 const handlePreeFillCreateReadmissionPFA = async (recentPFAiD = null) => {
  if (typeof recentPFAiD === "object" && recentPFAiD !== null) {
    recentPFAiD = recentPFAiD.recent_pfa_id;
  }

  if (!recentPFAiD) {
    console.error("Invalid userId provided to toggle");
    return;
  }

  setPFAEditModal(true);

  const token = localStorage.getItem("Authorization");
  try {
    const branch_id = selectedBranch; // make sure `selectedBranch` 
    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/pfa/assessment/${recentPFAiD}?branch_id=${branch_id}`,
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

    const latestAssessment = data.assessment || data;

    if (!latestAssessment) {
      console.warn("No assessment found for this user.");
      return;
    }

    setSelectedUser(latestAssessment);
    console.log("Selected User Assessment:", latestAssessment);

    console.log(latestAssessment.date_of_assessment)
    

    setPFAeditData({
      date_of_assessment: latestAssessment.date_of_assessment
        ? new Date(latestAssessment.date_of_assessment) // ✅ always Date object
        : null,
    
      dependent_to: latestAssessment.dependent_to || "",
      substance_use_pattern: latestAssessment.substance_use_pattern || "",
      last_30_days_quantity: latestAssessment.last_30_days_quantity || "",
    
      medicalConfirmationData: latestAssessment?.medical_history || "",
      bloodConfirmationData: latestAssessment?.blood_transfusion_history || "",
    
      weight: Number(latestAssessment?.weight) || 0,
      pulse_rate: Number(latestAssessment?.pulse_rate) || 0,
      blood_pressure: latestAssessment?.blood_pressure || "",
      temperature: Number(latestAssessment?.temperature) || 0,
      lymphadenopathy: latestAssessment?.lymphadenopathy || "",
    
      medical_or_blood_history_details:
        latestAssessment.medical_or_blood_history_details || "",
      complication_description: latestAssessment.complication_description || "",
      neuro_description: latestAssessment.neuro_description || "",
      other_findings: latestAssessment.other_findings || "",
      consent_name: latestAssessment.consent_name || "",
      consent_relationship: latestAssessment.consent_relationship || "",
      consent_signature: latestAssessment.consent_signature || "",
      prepared_by: latestAssessment.prepared_by || "",
    
      complications: {
        ulcer: latestAssessment.ulcer || "No",
        respiratory_problem: latestAssessment.respiratory_problem || "No",
        jaundice: latestAssessment.jaundice || "No",
        haematemesis: latestAssessment.haematemesis || "No",
        abdominal_complaints: latestAssessment.abdominal_complaints || "No",
        cardiovascular: latestAssessment.cardiovascular || "No",
      },
    
      neurological: {
        delirium: latestAssessment.delirium || "No",
        seizure: latestAssessment.seizure || "No",
        blackout: latestAssessment.blackout || "No",
        memory_loss: latestAssessment.memory_loss || "No",
        trembling: latestAssessment.trembling || "No",
        epilepsy: latestAssessment.epilepsy || "No",
        neuropathy: latestAssessment.neuropathy || "No",
      },
    
      nutritional_status: latestAssessment.nutritional_status || "",
    
      readmissionConsent: latestAssessment.consent || "No",
      readmissionVerification: latestAssessment.verification || "No",
      readmissionUserId: latestAssessment.user_id || null,
    });
    
  } catch (error) {
    console.error("Fetch error:", error);
  }
};


  //PFA update patient assessment handler - Not applicable
  //Readmission patient PFA Handler
  const handleReadmissionAssessment = async () => {
    setIsLoading(true); // Start loading

    const payload = {
      date_of_assessment: PFAeditData.date_of_assessment?.toISOString(),
      dependent_to: PFAeditData.dependent_to,
      substance_use_pattern: PFAeditData.substance_use_pattern,
      last_30_days_quantity: PFAeditData.last_30_days_quantity,
      medical_history: PFAeditData.medical_history,
      blood_transfusion_history: PFAeditData.blood_transfusion_history,
      medical_or_blood_history_details:
        PFAeditData.medical_or_blood_history_details,

      weight: Number(PFAeditData.weight) || 0,
      pulse_rate: Number(PFAeditData.pulse_rate) || 0,
      blood_pressure: PFAeditData.blood_pressure,
      temperature: Number(PFAeditData?.temperature) || 0,
      lymphadenopathy: PFAeditData.lymphadenopathy,

      // Complications
      ulcer: PFAeditData.complications?.ulcer || "",
      respiratory_problem: PFAeditData.complications?.respiratory_problem || "",
      jaundice: PFAeditData.complications?.jaundice || "",
      haematemesis: PFAeditData.complications?.haematemesis || "",
      abdominal_complaints:
        PFAeditData.complications?.abdominal_complaints || "",
      cardiovascular: PFAeditData.complications?.cardiovascular || "",
      complication_description: PFAeditData.complication_description,

      // Neurological
      seizure: PFAeditData.neurological?.seizure || "",
      epilepsy: PFAeditData.neurological?.epilepsy || "",
      delirium: PFAeditData.neurological?.delirium || "",
      trembling: PFAeditData.neurological?.trembling || "",
      memory_loss: PFAeditData.neurological?.memory_loss || "",
      neuropathy: PFAeditData.neurological?.neuropathy || "",
      blackout: PFAeditData.neurological?.blackout || "",
      neuro_description: PFAeditData.neuro_description,

      other_findings: PFAeditData.other_findings,

      consent_name: PFAeditData.consent_name,
      consent_relationship: PFAeditData.consent_relationship,
      consent_signature: PFAeditData.consent_signature,
      prepared_by: PFAeditData.prepared_by,

      nutritional_status: PFAeditData.nutritional_status,

      consent:PFAeditData.readmissionConsent,

      verification:PFAeditData.readmissionVerification,
      user_id: PFAeditData.readmissionUserId,
    };

    // try {
    //   const response = await fetch(
    //     `https://gks-yjdc.onrender.com/api/pfa/update-assessment/${PFAeditData.pfa_id}`,
    //     {
    //       method: "PUT",
    //       headers: {
    //         "Content-Type": "application/json",
    //         Authorization: `${token}`,
    //       },
    //       body: JSON.stringify(payload),
    //     }
    //   );

    //   const data = await response.json();

    //   if (!response.ok) {
    //     Swal.fire({
    //       icon: "error",
    //       title: "Update Failed",
    //       text: data.errors?.[0]?.message || "Unknown error occurred.",
    //     });
    //     return;
    //   }

    //   Swal.fire({
    //     icon: "success",
    //     title: "Assessment Updated",
    //     text: "The assessment was updated successfully!",
    //   });

    //   setPFAEditModal(false);
    // } catch (error) {
    //   Swal.fire({
    //     icon: "error",
    //     title: "Error",
    //     text: "An error occurred while updating the assessment.",
    //   });
    // }
    try {
      const token = localStorage.getItem("Authorization");
      const branch_id = selectedBranch; // make sure `selectedBranch` comes from your BranchContext
      //Readmission PFA API
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/pfa/create-assessment?branch_id=${branch_id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      console.log("payload", payload);
      const result = await response.json();
      console.log("result", result);

      if (!response.ok) {
        setIsLoading(false);
        Swal.fire({
          icon: "error",
          title: getTranslation("Readmission Submission Failed/पुनः प्रवेश सबमिशन विफल",lang),
          text: result.message || getTranslation("Server error/सर्वर त्रुटि",lang),
        }).then(() => {
  // This runs after the user clicks "OK"
  setModal(false);
});
        return;
      }
      // ✅ Success Case
  setIsLoading(false);
  Swal.fire({
    icon: "success",
    title: getTranslation("PFA Readmission Created Successfully/PFA रीडमिशन सफलतापूर्वक बनाया गया",lang),
    text: getTranslation("The PFA readmission was submitted successfully./PFA रीएडमिशन सफलतापूर्वक सबमिट कर दिया गया।",lang),
  }).then(() => {
  // This runs after the user clicks "OK"
  setModal(false);
});
    } catch (error) {
      setIsLoading(false);
      Swal.fire({
        icon: "error",
        title: getTranslation("Unexpected Error/अप्रत्याशित त्रुटि",lang),
        text: getTranslation("PFA Readmission failed! Unknown error occurred./PFA रीडमिशन फेल हो गया! कोई अनजान एरर हुआ।",lang),
      });
    }
  };


  //Edit like view PFA data by userID and get pateint id through user id and pass to update edit PFA to backend hanlder
  const handleAllPFAEditData = async (userId = null) => {
    // Open modal right away
    setPFAEditIndividualDataModal(true);
    setIsLoading(true); 
  
    // Handle if userId is an object
    if (typeof userId === "object" && userId !== null) {
      userId = userId.id;
    }
    if (!userId) {
      console.error("Invalid userId provided to toggle");
      setIsLoading(false);
      return;
    }
  
    console.log("Edit userId", userId);
  
    const branch_id = selectedBranch;
    const token = localStorage.getItem("Authorization");
  
    try {
      // Step 1: Fetch user's assessments list
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/pfa/user-assessments/${userId}?branch_id=${branch_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        }
      );
  
      const result = await response.json();
      if (!response.ok) {
        console.error("User fetch error:", result);
        return;
      }
  
      const assessmentsArray = Array.isArray(result.data)
        ? result.data
        : result.assessments || [];
  
      if (!Array.isArray(assessmentsArray) || assessmentsArray.length === 0) {
        console.warn("No assessments found for this user.");
        return;
      }
  
      // Step 2: Pick latest assessment by created_at
      const latestAssessmentMeta = assessmentsArray.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      )[0];
  
      const pfaId = Number(latestAssessmentMeta?.pfa_id);
      if (!pfaId) {
        console.error("Invalid or missing pfa_id:", latestAssessmentMeta);
        return;
      }
  
      // Step 3: Fetch full assessment details
      const detailResponse = await fetch(
        `https://gks-yjdc.onrender.com/api/pfa/assessment/${pfaId}?branch_id=${branch_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        }
      );
  
      const detailData = await detailResponse.json();

      console.log("detailData Edit Data", detailData.date_of_assessment);

      if (!detailResponse.ok) {
        console.error("Detail fetch error:", detailData);
        return;
      }
  
      const latestAssessment = detailData?.data || detailData.assessment;

      console.log(latestAssessment.date_of_assessment)

      if (!latestAssessment) {
        console.warn("No detailed assessment found.");
        return;
      }
  
      // Save data into state
      setSelectedUser(latestAssessment);
      setPFAeditData({
        pfa_id: pfaId,
        ...latestAssessment,
        date_of_assessment: latestAssessment.date_of_assessment
          ? new Date(latestAssessment.date_of_assessment) // Convert string → Date object
          : null,
      });
  
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  
  
  
  


  //Edit and submit PFA individual assessment data hanlder
  const handlerEditPFAIndividualAssessmentData = async () => {
    setIsLoading(true);
  
    const yesNo = (val) => (val === "Yes" ? "Yes" : "No"); // Ensures Yes/No only
  
    const payload = {
      date_of_assessment: PFAeditData.date_of_assessment
      ? PFAeditData.date_of_assessment.toISOString()
      : null,
  
      dependent_to: PFAeditData.dependent_to,
      substance_use_pattern: PFAeditData.substance_use_pattern,
      last_30_days_quantity: PFAeditData.last_30_days_quantity,
      medical_history: PFAeditData.medical_history,
      blood_transfusion_history: PFAeditData.blood_transfusion_history,
      medical_or_blood_history_details: PFAeditData.medical_or_blood_history_details,
  
      weight: Number(PFAeditData.weight) || 0,
      pulse_rate: Number(PFAeditData.pulse_rate) || 0,
      blood_pressure: PFAeditData.blood_pressure,
      temperature: Number(PFAeditData.temperature) || 0,
      lymphadenopathy: PFAeditData.lymphadenopathy,
  
      // Complications - flat
  ulcer: yesNo(PFAeditData.ulcer),
  respiratory_problem: yesNo(PFAeditData.respiratory_problem),
  jaundice: yesNo(PFAeditData.jaundice),
  haematemesis: yesNo(PFAeditData.haematemesis),
  abdominal_complaints: yesNo(PFAeditData.abdominal_complaints),
  cardiovascular: yesNo(PFAeditData.cardiovascular),
  complication_description: PFAeditData.complication_description,

  // Neurological - flat
  seizure: yesNo(PFAeditData.seizure),
  epilepsy: yesNo(PFAeditData.epilepsy),
  delirium: yesNo(PFAeditData.delirium),
  trembling: yesNo(PFAeditData.trembling),
  memory_loss: yesNo(PFAeditData.memory_loss),
  neuropathy: yesNo(PFAeditData.neuropathy),
  blackout: yesNo(PFAeditData.blackout),
  neuro_description: PFAeditData.neuro_description,
  
      other_findings: PFAeditData.other_findings,
      consent_name: PFAeditData.consent_name,
      consent_relationship: PFAeditData.consent_relationship,
      consent_signature: PFAeditData.consent_signature,
      prepared_by: PFAeditData.prepared_by,
      nutritional_status: PFAeditData.nutritional_status,
  
      consent: yesNo(PFAeditData.readmissionConsent),
      // verification: yesNo(PFAeditData.readmissionVerification),
      verification:PFAeditData.verification,
  
      user_id: PFAeditData.readmissionUserId,
      pfa_id: PFAeditData.pfa_id,
    };
  
    try {
      const branch_id = selectedBranch;
      const token = localStorage.getItem("Authorization");
  
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/pfa/update-assessment/${PFAeditData.pfa_id}?branch_id=${branch_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
  
      const data = await response.json();
  
      if (!response.ok) {
        Swal.fire({
          icon: "error",
          title: getTranslation("Update Failed/भार बढ़ाना विफल हुवा",lang),
          text: data.errors?.[0]?.message || getTranslation("Unknown error occurred./अनजान एरर हुआ।",lang),
        });
        return;
      }
  
      Swal.fire({
        icon: "success",
        title: getTranslation("Assessment Updated/मूल्यांकन अद्यतन",lang),
        text: getTranslation("The assessment was updated successfully!/मूल्यांकन सफलतापूर्वक अद्यतन किया गया!",lang),
      });
  
      setPFAEditIndividualDataModal(false);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: getTranslation("Error/गलती",lang),
        text: getTranslation("An error occurred while updating the assessment./मूल्यांकन अद्यतन करते समय एक त्रुटि हुई.",lang),
      });
    } finally {
      setTimeout(() => setIsLoading(false), 300); // show spinner at least 300ms
    }
  };
  

  //Search filter on register datalist
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

  //All pfa patient list data search 
  const [PFAallDatasearchText, PFAallDatasetSearchText] = useState("");
  const handlePFASearchChange = (e) => {
    const value = e.target.value.toLowerCase();
    PFAallDatasetSearchText(value);

    const filtered = getpfaData.filter((item) =>{
      return(
        item.name?.toLowerCase().includes(value) ||
        item.gks_id?.toLowerCase().includes(value) ||
        item.pfa_id?.toString().includes(value) ||
        item.user_id?.toString().includes(value) ||
        item.phone?.toLowerCase().includes(value) ||
        item.email?.toLowerCase().includes(value) 
      );
    }
    );

    setpfaFilterData(filtered);
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
        toast.success(getTranslation("Download complete!/डाउनलोड पूर्ण!",lang));
        element.classList.remove("pdf-scale");

        setTimeout(() => {
          setpfaDownload(false);
        }, 2000);
      });
  };


    // All pfa patient data list state
    const [getpfaData, setgetpfaData]=useState([]);
    const [pfaFilterData, setpfaFilterData]=useState([]);
    useEffect(() => {

      if (!selectedBranch) return; // avoid empty branch fetch

      const token = localStorage.getItem("Authorization");
    
      fetch(`https://gks-yjdc.onrender.com/api/pfa/all-entries?branch_id=${selectedBranch}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      })
        .then((response) => {
          if (!response.ok) throw new Error(getTranslation("Failed to fetch PFA all list user details/PFA की सभी लिस्ट के यूज़र डिटेल्स नहीं मिल पाए",lang));
          return response.json();
        })
        .then((res) => {
          // const pfaPatient = res.entries || [];
          const pfaPatient = res.data || [];

          console.log("All Patient First Assessment (PFA) List =>", pfaPatient )
    
          const formattedPFAPatient = pfaPatient.map((item) => {
            return {
              pfa_id: item.pfa_id,
              status: item.status,
    
              user_id: item.user?.user_id,
              name: item.user?.name,
              phone: item.user?.phone,
              email: item.user?.email,
              gks_id: item.user?.gks_id,
    
              entry_id: item.entry?.entry_id,
              visit_no: item.entry?.visit_no,
              admit_date: item.entry?.admit_date,
              discharge_date: item.entry?.discharge_date,
              discharge_status: item.entry?.discharge_status,
              ward_name: item.entry?.ward_name,
    
              assessment_date: item.assessment?.date_of_assessment,
              age: item.assessment?.age,
              dependent_to: item.assessment?.dependent_to,
              substance_use_pattern: item.assessment?.substance_use_pattern,
              last_30_days_quantity: item.assessment?.last_30_days_quantity,
    
              medical_history: item.medical_history?.medical_history,
              blood_transfusion_history: item.medical_history?.blood_transfusion_history,
              medical_or_blood_history_details: item.medical_history?.medical_or_blood_history_details,
    
              ulcer: item.medical_conditions?.ulcer,
              respiratory_problem: item.medical_conditions?.respiratory_problem,
              jaundice: item.medical_conditions?.jaundice,
              haematemesis: item.medical_conditions?.haematemesis,
              abdominal_complaints: item.medical_conditions?.abdominal_complaints,
              cardiovascular: item.medical_conditions?.cardiovascular,
              complication_description: item.medical_conditions?.complication_description,
    
              seizure: item.neurological_conditions?.seizure,
              epilepsy: item.neurological_conditions?.epilepsy,
              delirium: item.neurological_conditions?.delirium,
              trembling: item.neurological_conditions?.trembling,
              memory_loss: item.neurological_conditions?.memory_loss,
              neuropathy: item.neurological_conditions?.neuropathy,
              blackout: item.neurological_conditions?.blackout,
              neuro_description: item.neurological_conditions?.neuro_description,
    
              weight: item.health_metrics?.weight,
              pulse_rate: item.health_metrics?.pulse_rate,
              blood_pressure: item.health_metrics?.blood_pressure,
              temperature: item.health_metrics?.temperature,
              lymphadenopathy: item.health_metrics?.lymphadenopathy,
              nutritional_status: item.health_metrics?.nutritional_status,
              other_findings: item.health_metrics?.other_findings,
    
              consent: item.consent?.consent,
              consent_name: item.consent?.consent_name,
              consent_relationship: item.consent?.consent_relationship,
              consent_signature: item.consent?.consent_signature,
              prepared_by: item.consent?.prepared_by,
              verification: item.consent?.verification,
    
              created_by: item.audit?.created_by,
              updated_by: item.audit?.updated_by,
              created_at: item.audit?.created_at,
              updated_at: item.audit?.updated_at,
              branch_id: item.audit?.branch_id,
            };
          });

          console.log(formattedPFAPatient)
    
          setTimeout(() => {
            setgetpfaData(formattedPFAPatient);
            setpfaFilterData(formattedPFAPatient);
            setstillLoading(false);
          }, 1000);
        })
        .catch((error) => {
          console.error("Error fetching PFA user data:", error);
          setstillLoading(true);
        });
    }, [selectedBranch]);
    


      //Print Data handler
  //Print Data handler
  // const handlePrint = () => {
  //   window.print();
  //   // setviweFormPrint(false); // modal will close correctly
  // };

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
      <div className="pfa__wrapper">
        {/* <H5>{patientFirstAssessment}</H5> */}

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
                        
                         title={getTranslation("Patient First Assessment (PFA)/ रोगी प्रथम मूल्यांकन (पीएफए)" , lang)}
                        className="p-0"
                      />
                    </div>
                    <div className="row pb-2">
                      <div className="col-md-4">
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
                    </div>
                    {stillLoading ? (
                      <div className="loading-text">
                        {getTranslation("Data is fetching from server. Please wait.../सर्वर से डेटा लिया जा रहा है। कृपया इंतज़ार करें...",lang)}
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
                        onSelectedRowsChange={handleRowSelected}
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

{/* PFA pateint all list */}
                <Card>
                  {/* <HeaderCard title="User Data Table with Multiple Selection" /> */}
                  <CardBody>
                    <div class="d-flex pb-2 justify-content-between">
                      <HeaderCard
                        // title="All Patient First Assessment (PFA) List"
                        title={getTranslation("All Patient First Assessment (PFA) List/ सभी रोगी प्रथम मूल्यांकन (पीएफए) सूची" , lang)}
                        className="p-0"
                      />
                    </div>
                    <div className="row pb-2">
                      <div className="col-md-4">
                        <InputGroup>
                          <Input
                            className="form-control"
                            type="text"
                            placeholder={getTranslation("Search......./खोज.......",lang)}
                            value={PFAallDatasearchText}
                            onChange={handlePFASearchChange}
                          />
                          <span className="input-group-text">
                            <i className="fa fa-search"></i>
                          </span>
                        </InputGroup>
                      </div>
                    </div>
                    {stillLoading ? (
                      <div className="loading-text">
                        {getTranslation("Data is fetching from server. Please wait.../सर्वर से डेटा लिया जा रहा है। कृपया इंतज़ार करें...",lang)}
                      </div>
                    ) : (
                      <DataTable
                        data={pfaFilterData}
                        columns={tablePFAPatientListColumns}
                        striped
                        center
                        highlightOnHover
                        pagination
                        persistTableHead
                        onSelectedRowsChange={handleRowSelected}
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

{/* register user data into data table format end */}


{/* all pfa patient data into data table format start */}



{/* all pfa patient data into data table format end */}


        <div className="generalInfo__section">
          {/* PFA data form modal */}
          <CommonModal
            isOpen={modal}
            title={getTranslation(patientFirstAssessment,lang)}
            toggler={closePFAModal}
            maxWidth="1200px"
          >
            {selectedUser && selectedUser.length > 0 ? (
              <>
                {/* <p><strong>Name:</strong> {selectedUser[0].name}</p>
                <p><strong>Email:</strong> {selectedUser[0].gender}</p>
                <p>
                  <strong>DOB:</strong>{" "}
                  {selectedUser[0]?.dob ? new Date(selectedUser[0].dob).toLocaleDateString("en-IN") : ""}
                </p> */}

                {/* add more fields as needed */}
                <Form className="theme-form" onSubmit={handleSubmit}>
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
                    {/*Date of Assessment section/परीक्षण की तारीख :*/}
                    <div className="col-md-6">
                      <FormGroup className="form-group row">
                        <Label className="col-sm-12 col-form-label  col-xl-6">
                          {getTranslation(dateOfAssessment,lang)}
                        </Label>
                        <Col xl="5" sm="12">
                          <div className="input-group">
                            <DatePicker showMonthDropdown showYearDropdown dropdownMode="select"
                              className="form-control digits"
                              selected={formData.dateOfAssessment}
                              onChange={(date) =>
                                handleAssesmentDateChange(
                                  "dateOfAssessment",
                                  date
                                )
                              }
                            />
                          </div>
                        </Col>
                      </FormGroup>
                    </div>{" "}
                    {/*Date of Admission section/प्रवेश की तिथि :*/}
                    <div className="col-md-6">
                      {/* <FormGroup className="form-group row">
                        <Label className="col-sm-12 col-form-label  col-xl-6">
                          {dateOfAdmission}
                        </Label>
                        <Col xl="5" sm="12">
                          <div className="input-group">
                            <DatePicker showMonthDropdown showYearDropdown dropdownMode="select"
                              className="form-control digits"
                              selected={formData.dateOfAdmission}
                              onChange={(date) =>
                                handleAssesmentDateChange(
                                  "dateOfAdmission",
                                  date
                                )
                              }
                            />
                          </div>
                        </Col>
                      </FormGroup> */}
                    </div>
                  </div>
                  <div className="row px-3">
                    {/*Dependent to section/उपयोगकर्ता :*/}
                    <div className="col-md-12">
                      <FormGroup className="mb-4">
                        <Label>{getTranslation(dependentTo,lang)}</Label>
                        {/* <Input
                          type="textarea"
                          className="form-control"
                          rows="3"
                          name="dependentToData"
                          value={formData.dependentToData}
                          onChange={handleChange}
                        /> */}
                        <select
  className="form-control"
  name="dependentToData"
  value={formData.dependentToData}
  onChange={handleChange}
>
  <option value="">
    {getTranslation("Select Dependency / निर्भरता चुनें", lang)}
  </option>

  <option value="Alcohol">
    {getTranslation("Alcohol / शराब", lang)}
  </option>

  <option value="Afeem, Doada Chura">
    {getTranslation("Afeem, Doada Chura / अफीम, डोडा चुरा", lang)}
  </option>

  <option value="Samke Heroin">
    {getTranslation("Samke Heroin / समके हेरोइन", lang)}
  </option>

  <option value="Coacine">
    {getTranslation("Coacine / कोकीन", lang)}
  </option>

  <option value="MD">
    {getTranslation("MD / एमडी", lang)}
  </option>

  <option value="Ganja, Bhang, Charas, Munnka">
    {getTranslation("Ganja, Bhang, Charas, Munnka / गांजा, भांग, चरस, मुन्नका", lang)}
  </option>

  <option value="Inhalant Abuse">
    {getTranslation("Inhalant Abuse / इनहेलेंट का दुरुपयोग", lang)}
  </option>

  <option value="Medical Abuse">
    {getTranslation("Medical Abuse / चिकित्सा दुरुपयोग", lang)}
  </option>

  <option value="Multi Addict">
    {getTranslation("Multi Addict / मल्टी एडिक्ट", lang)}
  </option>
</select>



{/* <VoiceTextarea
  label={<Translated text={getTranslation(dependentTo,lang)} />}
  name="dependentToData"
  value={formData.dependentToData}
  onChange={handleChange}
/> */}
                      </FormGroup>
                    </div>
                    {/*Substance Use Pattern section/उपयोगकर्ता :*/}
                    <div className="col-md-12">
                      <FormGroup className="mb-4 mt-4">
                        {/* <Label>{getTranslation(substanceUsePattern,lang)}</Label> */}
                        {/* <Input
                          type="textarea"
                          className="form-control"
                          rows="3"
                          name="substanceUsePatternData"
                          value={formData.substanceUsePatternData}
                          onChange={handleChange}
                        /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(substanceUsePattern,lang)} />}
  name="substanceUsePatternData"
  value={formData.substanceUsePatternData}
  onChange={handleChange}
/>

                      </FormGroup>
                    </div>
                    {/*Last 30 Days Quantity section/उपयोगकर्ता :*/}
                    <div className="col-md-12">
                      <FormGroup className="mb-4 mt-4">
                        {/* <Label>{getTranslation(last30DaysQuantity,lang)}</Label>
                        <Input
                          type="textarea"
                          className="form-control"
                          rows="3"
                          name="last30DaysQuantityData"
                          value={formData.last30DaysQuantityData}
                          onChange={handleChange}
                        /> */}
                        <VoiceTextarea
  label={<Translated text={getTranslation(last30DaysQuantity,lang)} />}
  name="last30DaysQuantityData"
  value={formData.last30DaysQuantityData}
  onChange={handleChange}
/>
                      </FormGroup>
                    </div>
                    {/* General Physical Examination / सामान्य शारीरिक परीक्षण */}
                    <div className="table-responsive">
                      <Table bordered>
                        <thead>
                          <tr>
                            <th scope="col">{getTranslation(tableNumber,lang)}</th>
                            <th scope="col">{getTranslation(genralPhysicalExamination,lang)}</th>
                            <th scope="col">{getTranslation(Observation,lang)}</th>
                          </tr>
                        </thead>
                        <tbody>
  {[
    {
      id: "5",
      question: getTranslation(anyMedicalHistory, lang),
      name: "medicalConfirmationData",
      type: "yesno",
    },
    {
      id: "6",
      question: getTranslation(anyBloodTransfusionHistory, lang),
      name: "bloodConfirmationData",
      type: "yesno",
    },
    {
      id: "7",
      question: getTranslation(Weight, lang),
      name: "weight",
    },
    {
      id: "8",
      question: getTranslation(PulseRate, lang),
      name: "pulse_rate",
    },
    {
      id: "9",
      question: getTranslation(Bloodpressure, lang),
      name: "blood_pressure",
    },
    {
      id: "10",
      question: getTranslation(Temperature, lang),
      name: "temperature",
    },
  ].map(({ id, question, name, type }) => (
    <tr key={id}>
      <td>{id}</td>
      <td>{question}</td>
      <td>
        {type === "yesno" ? (
          <select
            className="form-control"
            name={name}
            value={formData[name]}
            onChange={(e) =>
              setFormData((prevData) => ({
                ...prevData,
                [name]: e.target.value,
              }))
            }
          >
            <option value="">
              {getTranslation("Select / चुनें", lang)}
            </option>
            <option value="Yes">{getTranslation("Yes / हाँ", lang)}</option>
            <option value="No">{getTranslation("No / नहीं", lang)}</option>
          </select>
        ) : (
          <Input
            type={["weight", "pulse_rate", "temperature"].includes(name) ? "number" : "text"}
            name={name}
            value={formData[name]}
            onChange={(e) =>
              setFormData((prevData) => ({
                ...prevData,
                [name]: e.target.value,
              }))
            }
            placeholder={getTranslation("Enter details / विवरण दर्ज करें", lang)}
            className="form-control"
          />
        )}
      </td>
    </tr>
  ))}
</tbody>

                        {/* <tbody>
                          {[
                            {
                              id: "5",
                              question: getTranslation(anyMedicalHistory,lang),
                              name: "medicalConfirmationData",
                            },
                            {
                              id: "6",
                              question: getTranslation(anyBloodTransfusionHistory,lang),
                              name: "bloodConfirmationData",
                            },
                            {
                              id: "7",
                              question: getTranslation(Weight,lang),
                              name: "weight",
                            },
                            {
                              id: "8",
                              question: getTranslation(PulseRate,lang),
                              name: "pulse_rate",
                            },
                            {
                              id: "9",
                              question: getTranslation(Bloodpressure,lang),
                              name: "blood_pressure",
                            },
                            {
                              id: "10",
                              question: getTranslation(Temperature,lang),
                              name: "temperature",
                            },
                          ].map(({ id, question, name }) => (
                            <tr key={id}>
                              <td>{id}</td>
                              <td>{question}</td>
                              <td>
                                <Input
                                  type={
                                    [
                                      "weight",
                                      "pulse_rate",
                                      "temperature",
                                    ].includes(name)
                                      ? "number"
                                      : "text"
                                  }
                                  name={name}
                                  value={formData[name]}
                                  onChange={(e) =>
                                    setFormData((prevData) => ({
                                      ...prevData,
                                      [name]: e.target.value,
                                    }))
                                  }
                                  placeholder={getTranslation("Enter details/विवरण दर्ज करें",lang)}
                                  className="form-control"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody> */}
                      </Table>

                      <div className="col-md-12">
                        <FormGroup className="mb-4 mt-4">
                          {/* <Label>{getTranslation(mentionIfAny,lang)}</Label>
                          <Input
                            type="textarea"
                            className="form-control"
                            rows="3"
                            name="bloodTransfusionHistoryData"
                            value={formData.bloodTransfusionHistoryData}
                            onChange={handleChange}
                          /> */}
                          <VoiceTextarea
  label={<Translated text={getTranslation(mentionIfAny,lang)} />}
  name="bloodTransfusionHistoryData"
  value={formData.bloodTransfusionHistoryData}
  onChange={handleChange}
/>
                        </FormGroup>
                      </div>
                    </div>

                    {/* Complication Details / जटिलता विवरण */}
                    <div className="table-responsive">
                      <Table bordered>
                        <thead>
                          <tr>
                            <th scope="col">{getTranslation(tableNumber2,lang)}</th>
                            <th scope="col">{getTranslation(complicationDetails,lang)}</th>
                            <th scope="col">{getTranslation(yes1,lang)}</th>
                            <th scope="col">{getTranslation(no1,lang)}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { key: "ulcer", label: getTranslation(ulcers,lang) },
                            {
                              key: "respiratory_problem",
                              label: getTranslation(respiratoryProblem,lang),
                            },
                            { key: "jaundice", label: getTranslation(jaundice,lang) },
                            { key: "haematemesis", label: getTranslation(Haematemesis,lang) },
                            {
                              key: "abdominal_complaints",
                              label: getTranslation(otherAbdominalComplaints,lang),
                            },
                            { key: "cardiovascular", label: getTranslation(cardiovascular,lang) },
                          ].map(({ key, label }, index) => (
                            <tr key={key}>
                              <td>{index + 1}</td>
                              <td>{label}</td>
                              {[getTranslation("Yes/हाँ",lang), getTranslation("No/नहीं",lang)].map((value) => {
                                const inputId = `complication_${key}_${value}`;
                                return (
                                  <td
                                    key={inputId}
                                    className="radio radio-primary"
                                  >
                                    <Input
                                      id={inputId}
                                      type="radio"
                                      name={`complication_${key}`}
                                      value={value}
                                      checked={
                                        formData.complications[key] === value
                                      }
                                      onChange={() =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          complications: {
                                            ...prev.complications,
                                            [key]: value,
                                          },
                                        }))
                                      }
                                    />
                                    <Label for={inputId}>
                                      {value === getTranslation("Yes/हाँ",lang) ? getTranslation("Yes/हाँ",lang) : getTranslation("No/नहीं",lang)}
                                    </Label>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </Table>

                      <div className="col-md-12">
                        <FormGroup className="mb-4 mt-4">
                          {/* <Label>{getTranslation(mentionIfAny2,lang)}</Label>
                          <Input
                            type="textarea"
                            className="form-control"
                            rows="3"
                            name="complication_description"
                            value={formData.complication_description}
                            onChange={handleChange}
                          /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(mentionIfAny2,lang)} />}
  name="complication_description"
  value={formData.complication_description}
  onChange={handleChange}
/>

                        </FormGroup>
                      </div>
                    </div>

                    {/*Neurological section / न्यूरोलॉजिकल*/}
                    <div className="table-responsive">
                      <Table bordered>
                        <thead>
                          <tr>
                            <th scope="col">{getTranslation(tableNumber3,lang)}</th>
                            <th scope="col">{getTranslation(neurological,lang)}</th>
                            <th scope="col">{getTranslation(yes1,lang)}</th>
                            <th scope="col">{getTranslation(no1,lang)}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {neurologicalOptions.map((option, index) => (
                            <tr key={option.key}>
                              <td>{index + 1}</td>
                              <td>{getTranslation(option.label,lang)}</td>
                              {[getTranslation("Yes/हाँ",lang), getTranslation("No/नहीं",lang)].map((value) => {
                                const inputId = `neuro_${option.key}_${value}`;
                                return (
                                  <td
                                    key={inputId}
                                    className="radio radio-primary"
                                  >
                                    <Input
                                      id={inputId}
                                      type="radio"
                                      name={`neuro_${option.key}`}
                                      value={value}
                                      checked={
                                        formData.neurological[option.key] ===
                                        value
                                      }
                                      onChange={() =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          neurological: {
                                            ...prev.neurological,
                                            [option.key]: value,
                                          },
                                        }))
                                      }
                                    />
                                    <Label for={inputId}>
                                      {value === getTranslation("Yes/हाँ",lang) ? getTranslation("Yes/हाँ",lang) : getTranslation("No/नहीं",lang)}
                                    </Label>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </Table>

                      <div className="col-md-12">
                        <FormGroup className="mb-4 mt-4">
                          {/* <Label>{getTranslation(mentionIfAny2,lang)}</Label>
                          <Input
                            type="textarea"
                            className="form-control"
                            rows="3"
                            name="neuro_description"
                            value={formData.neuro_description}
                            onChange={handleChange}
                          /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(mentionIfAny2,lang)} />}
  name="neuro_description"
  value={formData.neuro_description}
  onChange={handleChange}
/>

                        </FormGroup>
                      </div>
                    </div>

                    {/* Any Other Findings */}
                    <div className="col-md-12">
                      <FormGroup className="mb-4 mt-4">
                        {/* <Label>{getTranslation(anyOtherFindings,lang)}</Label>
                        <Input
                          type="textarea"
                          className="form-control"
                          rows="3"
                          name="other_findings"
                          value={formData.other_findings}
                          onChange={handleChange}
                        /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(anyOtherFindings,lang)} />}
  name="other_findings"
  value={formData.other_findings}
  onChange={handleChange}
/>

                      </FormGroup>
                    </div>

                    {/* Nutritional Status / नुट्रिशन स्तिथि */}
                    <div className="col-md-6">
                      <Label>{getTranslation("Nutritional Status / नुट्रिशन स्तिथि",lang)}</Label>
                      <div className="radio radio-primary d-flex gap-3">
                        {[getTranslation("Good/अच्छा",lang), getTranslation("Average/औसत",lang), getTranslation("Poor/गरीब",lang)].map((Nstatus) => (
                          <div key={Nstatus}>
                            <Input
                              type="radio"
                              id={`nutritionalStatus-${Nstatus}`}
                              name="nutritional_status"
                              value={Nstatus}
                              checked={formData.nutritional_status === Nstatus}
                              onChange={handleChange}
                            />
                            <Label htmlFor={`nutritionalStatus-${Nstatus}`}>
                              {Nstatus}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="col-md-12">
                      <FormGroup className="mb-2 mt-4">
                        {/* <Label>{getTranslation(Lymphadenopathy,lang)}</Label>
                        <Input
                          type="textarea"
                          className="form-control"
                          rows="3"
                          name="lymphadenopathy"
                          value={formData.lymphadenopathy}
                          onChange={handleChange}
                        /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(Lymphadenopathy,lang)} />}
  name="lymphadenopathy"
  value={formData.lymphadenopathy}
  onChange={handleChange}
/>

                      </FormGroup>
                    </div>

                    {/* Consent Section */}
                    <div className="col-md-12 mb-2">
                      <div className="checkbox ms-3 mb-2">
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

                      <Row>
                        <Col md="4">
                          <FormGroup>
                            <Label>{getTranslation(name,lang)}</Label>
                            <Input
                              type="text"
                              placeholder={getTranslation("Name/नाम",lang)}
                              name="consent_name"
                              value={formData.consent_name}
                              onChange={handleChange}
                            />
                          </FormGroup>
                        </Col>
                        <Col md="4">
                          <FormGroup>
                            <Label>{getTranslation(relationship,lang)}</Label>
                            <Input
                              type="text"
                              placeholder={getTranslation("Relationship/संबंध",lang)}
                              name="consent_relationship"
                              value={formData.consent_relationship}
                              onChange={handleChange}
                            />
                          </FormGroup>
                        </Col>
                        <Col md="4">
                          <FormGroup>
                            <Label>{getTranslation(signature,lang)}</Label>
                            <Input
                              type="text"
                              placeholder={getTranslation("Signature/हस्ताक्षर",lang)}
                              name="consent_signature"
                              value={formData.consent_signature}
                              onChange={handleChange}
                            />
                          </FormGroup>
                        </Col>
                      </Row>
                    </div>

                    <div className="row align-items-center">
                      {/* Prepared By Section */}
                      <div className="col-md-6 mt-3">
                        <FormGroup>
                          <Label>{getTranslation(prepared,lang)}</Label>
                          <Input
                            type="text"
                            placeholder={getTranslation("Prepared By/द्वारा तैयार",lang)}
                            name="prepared_by"
                            value={formData.prepared_by}
                            onChange={handleChange}
                          />
                        </FormGroup>
                      </div>

                      {/* verification Section */}
                      <div className="col-md-6 mt-4">
                        <div className="checkbox ms-3">
                          <Input
                            id="checkbox2"
                            type="checkbox"
                            checked={formData.verification === "Yes"}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                verification: e.target.checked ? "Yes" : "No",
                              }))
                            }
                          />
                          <Label className="text-muted" for="checkbox2">
                            {
                              getTranslation("Varification from parent side before PFA submitting/पीएफए ​​जमा करने से पहले माता-पिता की ओर से सत्यापन",lang)
                            }
                          </Label>
                        </div>
                      </div>
                    </div>
                    {/* Submit */}
                    <div className="col-md-12 mt-3 mb-3">
                      <Button
                        color="primary"
                        type="submit"
                        disabled={isLoading || formData.verification !== "Yes"}
                      >
                        {isLoading ? (
                          <span
                            className="spinner-border spinner-border-sm"
                            role="status"
                            aria-hidden="true"
                          ></span>
                        ) : (
                          getTranslation("Submit Patient First Assessment (PFA) Form/रोगी प्रथम मूल्यांकन (पीएफए) फॉर्म जमा करें",lang)
                        )}
                      </Button>
                    </div>
                  </div>
                </Form>
              </>
            ) : (
              <div className="loader-box">
                <Spinner
                  className={selectedSpinner?.spinnerClass || "spinner-border"}
                />
              </div>
            )}
          </CommonModal>

          {/* PFA view data modal */}
          <CommonModal
            isOpen={viewModal}
            title={
              getTranslation("View First Physical Assessment / पहला शारीरिक मूल्यांकन देखें",lang)
            }
            toggler={closeUserViewModal}
            maxWidth="1200px"
          >
            <Col sm="12">
              <div className="table-responsive p-4" ref={pdfRef}>
                <h4
                  style={{
                    textAlign: "center",
                    textDecoration: "underline",
                    padding: "20px 0",
                  }}
                >
                  {getTranslation("First Physical Assessment / प्रथम शारीरिक मूल्यांकन",lang)}
                </h4>
                <Table size="sm" className="table-bordered">
                  <tbody style={{ fontSize: "14px" }}>
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
                    ) : selectedUser ? (
                      <>
                        <tr className="fw-bold">
                          <td colSpan="2" className="p-3">
                            {getTranslation("Date of Assessment / मूल्यांकन की तारीख:",lang)}
                          </td>
                          <td colSpan="2" className="p-3">
                            {new Date(
                              selectedUser.date_of_assessment
                            ).toLocaleDateString()}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan="2" className="fw-semibold p-3">
                            {getTranslation("Name of Patient / मरीज का नाम:",lang)}
                          </td>
                          <td colSpan="2" className="p-3">
                            <span colSpan="2" className="fw-normal">
                              {selectedUser.name}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td colSpan="2" className="fw-semibold p-3">
                            {getTranslation("Age / उम्र:",lang)}
                          </td>
                          <td colSpan="2" className="p-3">
                            <span colSpan="2" className="fw-normal">
                              {selectedUser.age}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td colSpan="2" className="fw-semibold p-3">
                            {getTranslation("Dependent To / निर्भरता का प्रकार:",lang)}
                          </td>
                          <td colSpan="2" className="p-3">
                            <span colSpan="2" className="fw-normal">
                              {selectedUser.dependent_to}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td colSpan="2" className="fw-semibold p-3">
                            {getTranslation("Substance Use Pattern / उपयोग का पैटर्न:",lang)}
                          </td>
                          <td colSpan="2" className="p-3">
                            <span colSpan="2" className="fw-normal">
                              {selectedUser.substance_use_pattern}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td colSpan="2" className="fw-semibold p-3">
                            {getTranslation("Last 30 Days Quantity / पिछले 30 दिनों की मात्रा:",lang)}
                          </td>
                          <td colSpan="2" className="p-3">
                            <span colSpan="2" className="fw-normal">
                              {selectedUser.last_30_days_quantity}
                            </span>
                          </td>
                        </tr>

                        <br />
                        <br />
                        <tr className="table-secondary text-center fw-bold">
                          <td colSpan="4" className="p-3">
                            {getTranslation("General Physical Examination / सामान्य शारीरिक परीक्षण",lang)}
                          </td>
                        </tr>
                        {[
                          {
                            label: getTranslation("Weight / वजन",lang),
                            value: selectedUser.weight,
                          },
                          {
                            label: getTranslation("Pulse Rate / पल्स रेट",lang),
                            value: selectedUser.pulse_rate,
                          },
                          {
                            label: getTranslation("Blood pressure / रक्तचाप",lang),
                            value: selectedUser.blood_pressure,
                          },
                          {
                            label: getTranslation("Temperature / तापमान",lang),
                            value: selectedUser.temperature,
                          },
                          {
                            label: getTranslation("Medical History / चिकित्सा इतिहास",lang),
                            value: selectedUser.medical_history,
                          },
                          {
                            label:
                              getTranslation("Blood Transfusion History / रक्त संक्रमण इतिहास",lang),
                            value: selectedUser.blood_transfusion_history,
                          },
                          {
                            label: getTranslation("Medical or Blood History Details / चिकित्सा या रक्त इतिहास विवरण",lang),
                            value:
                              selectedUser.medical_or_blood_history_details,
                          },
                        ].map((item, i) => (
                          <tr key={i}>
                            <td colSpan="2" className="fw-semibold p-3">
                              {item.label}
                            </td>
                            <td colSpan="2" className="p-3">
                              {item.value || "—"}
                            </td>
                          </tr>
                        ))}

                        <br />
                        <br />

                        <tr className="table-secondary text-center fw-bold">
                          <td colSpan="4" className="p-3">
                            {getTranslation("Complication Details / जटिलता विवरण",lang)}
                          </td>
                        </tr>
                        {[
                          {
                            label: getTranslation("Ulcers / अल्सर",lang),
                            value: selectedUser.ulcer,
                          },
                          {
                            label: getTranslation("Respiratory Problem / श्वसन समस्या",lang),
                            value: selectedUser.respiratory_problem,
                          },
                          {
                            label: getTranslation("Jaundice / पीलिया",lang),
                            value: selectedUser.jaundice,
                          },
                          {
                            label: getTranslation("Haematemesis / मलैना",lang),
                            value: selectedUser.haematemesis,
                          },
                          {
                            label: getTranslation("Abdominal Complaints / पेट की शिकायतें",lang),
                            value: selectedUser.abdominal_complaints,
                          },
                          {
                            label: getTranslation("Cardiovascular / हृदय संबंधी",lang),
                            value: selectedUser.cardiovascular,
                          },
                          {
                            label: getTranslation("Complication Description / जटिलता विवरण",lang),
                            value: selectedUser.complication_description,
                          },
                        ].map((item, i) => (
                          <tr key={i}>
                            <td colSpan="2" className="fw-semibold p-3">
                              {item.label}
                            </td>
                            <td colSpan="2" className="p-3">
                              {item.value || "—"}
                            </td>
                          </tr>
                        ))}

                        <br />
                        <br />

                        <tr
                          className="table-secondary text-center fw-bold"
                          style={{
                            pageBreakInside: "avoid",
                            border: "1px solid #ccc",
                            padding: "10px",
                          }}
                        >
                          <td colSpan="4" className="p-3">
                            {getTranslation("Neurological / न्यूरोलॉजिकल",lang)}
                          </td>
                        </tr>
                        {[
                          {
                            label: getTranslation("Seizure / फिट्स",lang),
                            value: selectedUser.seizure,
                          },
                          {
                            label: getTranslation("Epilepsy / मिर्गी",lang),
                            value: selectedUser.epilepsy,
                          },
                          {
                            label: getTranslation("Delirium / भ्रम",lang),
                            value: selectedUser.delirium,
                          },
                          {
                            label: getTranslation("Trembling / कांपना",lang),
                            value: selectedUser.trembling,
                          },
                          {
                            label: getTranslation("Memory Loss / स्मृति हानि",lang),
                            value: selectedUser.memory_loss,
                          },
                          {
                            label: getTranslation("Neuropathy / स्नायु रोग",lang),
                            value: selectedUser.neuropathy,
                          },
                          {
                            label: getTranslation("Blackout / बेहोशी",lang),
                            value: selectedUser.blackout,
                          },
                          {
                            label: getTranslation("Neuro Description / न्यूरो विवरण",lang),
                            value: selectedUser.neuro_description,
                          },
                        ].map((item, i) => (
                          <tr
                            key={i}
                            style={{
                              pageBreakInside: "avoid",
                              border: "1px solid #ccc",
                              padding: "10px",
                            }}
                          >
                            <td colSpan="2" className="fw-semibold p-3">
                              {item.label}
                            </td>
                            <td colSpan="2" className="p-3">
                              {item.value || "—"}
                            </td>
                          </tr>
                        ))}

                        <br />
                        <br />

                        <tr>
                          <td colSpan="2" className="fw-semibold p-3">
                            {getTranslation("Nutritional Status / पोषण स्थिति:",lang)}
                          </td>
                          <td colSpan="2" className="p-3">
                            {selectedUser.nutritional_status}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan="2" className="fw-semibold p-3">
                            {getTranslation("Lymphadenopathy (mention): / लिम्फैडेनोपैथी (उल्लेख):",lang)}
                          </td>
                          <td colSpan="2" className="p-3">
                            {selectedUser.lymphadenopathy}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan="2" className="fw-semibold p-3">
                            {getTranslation("Other Findings / अन्य खोज:",lang)}
                          </td>
                          <td colSpan="2" className="p-3">
                            {selectedUser.other_findings}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan="2" className="fw-semibold p-3">
                            {getTranslation("Consent: / सहमति:",lang)}
                          </td>
                          <td colSpan="2" className="p-3">
                            {selectedUser.consent}
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-semibold p-3">{getTranslation("Consent Name:/सहमति नाम:",lang)}</td>
                          <td className="p-3">{selectedUser.consent_name}</td>
                          <td className="fw-semibold p-3">{getTranslation("Relationship:/संबंध:",lang)}</td>
                          <td className="p-3">
                            {selectedUser.consent_relationship}
                          </td>
                        </tr>
                        <tr className="table-light fw-bold">
                          <td colSpan="1" className="fw-semibold p-3">
                            {getTranslation("Prepared by:/द्वारा तैयार:",lang)}{" "}
                          </td>
                          <td className="p-3" colSpan="3">
                            {selectedUser.prepared_by}
                          </td>
                        </tr>
                      </>
                    ) : (
                      <tr>
                        <td colSpan="2" className="text-center">
                         {getTranslation(" No data available / कोई डेटा मौजूद नहीं",lang)}
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
                    ? getTranslation("Your PFA is being downloaded.../ आपका PFA डाउनलोड हो रहा है...",lang)
                    : getTranslation("Download Your First Physical Assessment (PFA) / अपना प्रथम शारीरिक मूल्यांकन डाउनलोड करें",lang)}
                </button>
                 <button
                      id="download-btn"
                      className="btn btn-primary mx-3"
                      onClick={handlePrint}
                    >
                       {getTranslation("Print Your Data/अपना डेटा प्रिंट करें", lang)}
                    </button>
              </div>
            </Col>
          </CommonModal>

          {/* Readmission PFA Edit Modal */}
          <CommonModal
            isOpen={PFAEditModal}
            title={getTranslation("Readmission Patient First Assessment (PFA)/पुनः प्रवेश रोगी प्रथम मूल्यांकन (पीएफए)",lang)}
            toggler={closeUserViewModal}
            maxWidth="1200px"
          >
            {PFAEditModal && PFAeditData && (
              <div className="row">
                <Form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleReadmissionAssessment();
                  }}
                >
                  {/* Date of assesment */}
                    <div className="col-md-6 mt-3">
                      <FormGroup className="form-group row">
                        <Label className="col-sm-12 col-form-label  col-xl-6">
                          {dateOfAssessment}
                        </Label>
                        <Col xl="5" sm="12">
                          <div className="input-group">
                            <DatePicker showMonthDropdown showYearDropdown dropdownMode="select"
                              className="form-control digits"
                              selected={PFAeditData.date_of_assessment instanceof Date && !isNaN(PFAeditData.date_of_assessment)
                            ? PFAeditData.date_of_assessment
                            : null }
                              onChange={(date) =>
  setPFAeditData({
    ...PFAeditData,
    date_of_assessment: date, // this is already a Date object
  })
}

                            />
                          </div>
                        </Col>
                      </FormGroup>
                    </div>
                  {/* Dependent To */}
                  <div className="col-md-12 pt-3">
                    <FormGroup className="mb-0">
                      <Label>{getTranslation(dependentTo,lang)}</Label>
                      {/* <Input
                        type="textarea"
                        rows="3"
                        name="dependentToData"
                        value={PFAeditData.dependent_to}
                        onChange={(e) =>
                          setPFAeditData({
                            ...PFAeditData,
                            dependent_to: e.target.value,
                          })
                        }
                      /> */}

<select
  className="form-control"
  name="dependentToData"
  value={PFAeditData.dependent_to}
  onChange={(e) =>
    setPFAeditData({
      ...PFAeditData,
      dependent_to: e.target.value,
    })
  }
>
  <option value="">
    {getTranslation("Select Dependency / निर्भरता चुनें", lang)}
  </option>

  <option value="Alcohol">
    {getTranslation("Alcohol / शराब", lang)}
  </option>

  <option value="Afeem, Doada Chura">
    {getTranslation("Afeem, Doada Chura / अफीम, डोडा चुरा", lang)}
  </option>

  <option value="Samke Heroin">
    {getTranslation("Samke Heroin / समके हेरोइन", lang)}
  </option>

  <option value="Coacine">
    {getTranslation("Coacine / कोकीन", lang)}
  </option>

  <option value="MD">
    {getTranslation("MD / एमडी", lang)}
  </option>

  <option value="Ganja, Bhang, Charas, Munnka">
    {getTranslation("Ganja, Bhang, Charas, Munnka / गांजा, भांग, चरस, मुन्नका", lang)}
  </option>

  <option value="Inhalant Abuse">
    {getTranslation("Inhalant Abuse / इनहेलेंट का दुरुपयोग", lang)}
  </option>

  <option value="Medical Abuse">
    {getTranslation("Medical Abuse / चिकित्सा दुरुपयोग", lang)}
  </option>

  <option value="Multi Addict">
    {getTranslation("Multi Addict / मल्टी एडिक्ट", lang)}
  </option>
</select>


                      {/* <VoiceTextarea
  label={<Translated text={getTranslation(dependentTo,lang)} />}
  name="dependentToData"
  value={PFAeditData.dependent_to}
  onChange={(e) =>
    setPFAeditData({
      ...PFAeditData,
      dependent_to: e.target.value,
    })
  }
/> */}
                    </FormGroup>
                  </div>

                  {/* Substance Use Pattern */}
                  <div className="col-md-12">
                    <FormGroup className="mb-0">
                      {/* <Label>{getTranslation(substanceUsePattern,lang)}</Label>
                      <Input
                        type="textarea"
                        rows="3"
                        name="substanceUsePatternData"
                        value={PFAeditData.substance_use_pattern}
                        onChange={(e) =>
                          setPFAeditData({
                            ...PFAeditData,
                            substance_use_pattern: e.target.value,
                          })
                        }
                      /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(substanceUsePattern,lang)} />}
  name="substanceUsePatternData"
  value={PFAeditData.substance_use_pattern}
  onChange={(e) =>
    setPFAeditData({
      ...PFAeditData,
      substance_use_pattern: e.target.value,
    })
  }
/>

                    </FormGroup>
                  </div>

                  {/* Last 30 Days Quantity */}
                  <div className="col-md-12">
                    <FormGroup className="mb-0">
                      {/* <Label>{getTranslation(last30DaysQuantity,lang)}</Label>
                      <Input
                        type="textarea"
                        rows="3"
                        name="last30DaysQuantityData"
                        value={PFAeditData.last_30_days_quantity}
                        onChange={(e) =>
                          setPFAeditData({
                            ...PFAeditData,
                            last_30_days_quantity: e.target.value,
                          })
                        }
                      /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(last30DaysQuantity,lang)} />}
  name="last30DaysQuantityData"
                        value={PFAeditData.last_30_days_quantity}
                        onChange={(e) =>
                          setPFAeditData({
                            ...PFAeditData,
                            last_30_days_quantity: e.target.value,
                          })
                        }
/>

                    </FormGroup>
                  </div>

                  {/* General Physical Examination */}
                  <div className="table-responsive">
                    <Table bordered>
                      <thead>
                        <tr>
                          <th>{getTranslation(tableNumber,lang)}</th>
                          <th>{getTranslation(genralPhysicalExamination,lang)}</th>
                          <th>{getTranslation(Observation,lang)}</th>
                        </tr>
                      </thead>
                      <tbody>
  {[
    {
      id: "5",
      question: getTranslation(anyMedicalHistory, lang),
      name: "medical_history",
      type: "yesno", // added type
    },
    {
      id: "6",
      question: getTranslation(anyBloodTransfusionHistory, lang),
      name: "blood_transfusion_history",
      type: "yesno", // added type
    },
    {
      id: "7",
      question: getTranslation(Weight, lang),
      name: "weight",
    },
    {
      id: "8",
      question: getTranslation(PulseRate, lang),
      name: "pulse_rate",
    },
    {
      id: "9",
      question: getTranslation(Bloodpressure, lang),
      name: "blood_pressure",
    },
    {
      id: "10",
      question: getTranslation(Temperature, lang),
      name: "temperature",
    },
  ].map(({ id, question, name, type }) => (
    <tr key={id}>
      <td>{id}</td>
      <td>{question}</td>
      <td>
        {type === "yesno" ? (
          <select
            className="form-control"
            name={name}
            value={PFAeditData[name] || ""}
            onChange={(e) => {
              const { name, value } = e.target;
              setPFAeditData((prev) => ({
                ...prev,
                [name]: value,
              }));
            }}
          >
            <option value="">
              {getTranslation("Select / चुनें", lang)}
            </option>
            <option value="Yes">{getTranslation("Yes / हाँ", lang)}</option>
            <option value="No">{getTranslation("No / नहीं", lang)}</option>
          </select>
        ) : (
          <Input
            type={["weight", "pulse_rate", "temperature"].includes(name) ? "number" : "text"}
            name={name}
            value={PFAeditData[name] || ""}
            onChange={(e) => {
              const { name, value, type } = e.target;
              setPFAeditData((prev) => ({
                ...prev,
                [name]: type === "number" ? Number(value) : value,
              }));
            }}
          />
        )}
      </td>
    </tr>
  ))}
</tbody>

                      {/* <tbody>
                        {[
                          {
                            id: "5",
                            question: getTranslation(anyMedicalHistory,lang),
                            name: "medical_history",
                          },
                          {
                            id: "6",
                            question: getTranslation(anyBloodTransfusionHistory,lang),
                            name: "blood_transfusion_history",
                          },
                          {
                            id: "7",
                            question: getTranslation(Weight,lang),
                            name: "weight",
                          },
                          {
                            id: "8",
                            question: getTranslation(PulseRate,lang),
                            name: "pulse_rate",
                          },
                          {
                            id: "9",
                            question: getTranslation(Bloodpressure,lang),
                            name: "blood_pressure",
                          },
                          {
                            id: "10",
                            question: getTranslation(Temperature,lang),
                            name: "temperature",
                          },
                        ].map(({ id, question, name }) => (
                          <tr key={id}>
                            <td>{id}</td>
                            <td>{question}</td>
                            <td>
                              <Input
                                type={
                                  [
                                    "weight",
                                    "pulse_rate",
                                    "temperature",
                                  ].includes(name)
                                    ? "number"
                                    : "text"
                                }
                                name={name}
                                value={PFAeditData[name] || ""}
                                onChange={(e) => {
                                  const { name, value, type } = e.target;
                                  setPFAeditData((prev) => ({
                                    ...prev,
                                    [name]:
                                      type === "number" ? Number(value) : value,
                                  }));
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody> */}
                    </Table>

                    <div className="col-md-12">
                      <FormGroup className="mb-0">
                        {/* <Label>{getTranslation(mentionIfAny,lang)}</Label>
                        <Input
                          type="textarea"
                          rows="3"
                          name="bloodTransfusionHistoryData"
                          value={PFAeditData.medical_or_blood_history_details}
                          onChange={(e) =>
                            setPFAeditData({
                              ...PFAeditData,
                              medical_or_blood_history_details: e.target.value,
                            })
                          }
                        /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(mentionIfAny,lang)} />}
  name="bloodTransfusionHistoryData"
  value={PFAeditData.medical_or_blood_history_details}
  onChange={(e) =>
    setPFAeditData({
      ...PFAeditData,
      medical_or_blood_history_details: e.target.value,
    })
  }
/>

                      </FormGroup>
                    </div>
                  </div>

                  {/* Complication Details */}
                  <div className="table-responsive">
                    <Table bordered>
                      <thead>
                        <tr>
                          <th>{getTranslation(tableNumber2,lang)}</th>
                          <th>{getTranslation(complicationDetails,lang)}</th>
                          <th>{getTranslation(yes1,lang)}</th>
                          <th>{getTranslation(no1,lang)}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { key: "ulcer", label: getTranslation(ulcers,lang) },
                          {
                            key: "respiratory_problem",
                            label: getTranslation(respiratoryProblem,lang),
                          },
                          { key: "jaundice", label: getTranslation(jaundice,lang) },
                          { key: "haematemesis", label: getTranslation(Haematemesis,lang) },
                          {
                            key: "abdominal_complaints",
                            label: getTranslation(otherAbdominalComplaints,lang),
                          },
                          { key: "cardiovascular", label: getTranslation(cardiovascular,lang) },
                        ].map(({ key, label }, index) => (
                          <tr key={key}>
                            <td>{index + 1}</td>
                            <td>{label}</td>
                            <td colSpan="2">
                              <div className="radio radio-primary d-flex gap-3">
                                {[getTranslation("Yes/हाँ",lang), getTranslation("No/नहीं",lang)].map((value) => {
                                  const inputId = `complication_${key}_${value}`;
                                  return (
                                    <div
                                      key={inputId}
                                      className="form-check form-check-inline"
                                    >
                                      <Input
                                        id={inputId}
                                        type="radio"
                                        className="form-check-input"
                                        name={`complication_${key}`}
                                        value={value}
                                        checked={
                                          PFAeditData?.complications?.[
                                            key
                                          ]?.toString() === value.toString()
                                        }
                                        onChange={() => {
                                          console.log(
                                            `Setting complication ${key} to:`,
                                            value
                                          );
                                          setPFAeditData((prev) => ({
                                            ...prev,
                                            complications: {
                                              ...prev.complications,
                                              [key]: value,
                                            },
                                          }));
                                        }}
                                      />

                                      <Label
                                        className="form-check-label"
                                        for={inputId}
                                      >
                                        {value}
                                      </Label>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>

                    <div className="col-md-12">
                      <FormGroup className="mb-0">
                        {/* <Label>{getTranslation(mentionIfAny2,lang)}</Label>
                        <Input
                          type="textarea"
                          rows="3"
                          name="complication_description"
                          value={PFAeditData.complication_description}
                          onChange={(e) =>
                            setPFAeditData({
                              ...PFAeditData,
                              complication_description: e.target.value,
                            })
                          }
                        /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(mentionIfAny2,lang)} />}
  name="complication_description"
                          value={PFAeditData.complication_description}
                          onChange={(e) =>
                            setPFAeditData({
                              ...PFAeditData,
                              complication_description: e.target.value,
                            })
                          }
/>

                      </FormGroup>
                    </div>
                  </div>

                  {/* Neurological Section */}
                  <div className="table-responsive">
                    <Table bordered>
                      <thead>
                        <tr>
                          <th>{getTranslation(tableNumber3,lang)}</th>
                          <th>{getTranslation(neurological,lang)}</th>
                          <th>{getTranslation(yes1,lang)}</th>
                          <th>{getTranslation(no1,lang)}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {neurologicalOptions.map((option, index) => (
                          <tr key={option.key}>
                            <td>{index + 1}</td>
                            <td>{getTranslation(option.label,lang)}</td>
                            {[getTranslation("Yes/हाँ",lang), getTranslation("No/नहीं",lang)].map((value) => {
                              const inputId = `neuro_${option.key}_${value}`;
                              return (
                                <td key={inputId}>
                                  <div className="radio radio-primary d-flex gap-3">
                                    <div className="form-check form-check-inline">
                                      <Input
                                        id={inputId}
                                        type="radio"
                                        className="form-check-input"
                                        name={`neuro_${option.key}`}
                                        value={value}
                                        checked={
                                          PFAeditData?.neurological?.[
                                            option.key
                                          ]?.toString() === value.toString()
                                        }
                                        onChange={() =>
                                          setPFAeditData((prev) => ({
                                            ...prev,
                                            neurological: {
                                              ...prev.neurological,
                                              [option.key]: value,
                                            },
                                          }))
                                        }
                                      />
                                      <Label
                                        className="form-check-label"
                                        htmlFor={inputId}
                                      >
                                        {value}
                                      </Label>
                                    </div>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </Table>

                    <div className="col-md-12">
                      <FormGroup className="mb-0">
                        {/* <Label>{getTranslation(mentionIfAny2,lang)}</Label>
                        <Input
                          type="textarea"
                          rows="3"
                          name="neuro_description"
                          value={PFAeditData.neuro_description}
                          onChange={(e) =>
                            setPFAeditData({
                              ...PFAeditData,
                              neuro_description: e.target.value,
                            })
                          }
                        /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(mentionIfAny2,lang)} />}
  name="neuro_description"
  value={PFAeditData.neuro_description}
  onChange={(e) =>
    setPFAeditData({
      ...PFAeditData,
      neuro_description: e.target.value,
    })
  }
/>

                      </FormGroup>
                    </div>
                  </div>

                  {/* Any Other Findings */}
                  <div className="col-md-12">
                    <FormGroup className="mb-0">
                      {/* <Label>{getTranslation(anyOtherFindings,lang)}</Label>
                      <Input
                        type="textarea"
                        rows="3"
                        name="other_findings"
                        value={PFAeditData.other_findings}
                        onChange={(e) =>
                          setPFAeditData({
                            ...PFAeditData,
                            other_findings: e.target.value,
                          })
                        }
                      /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(anyOtherFindings,lang)} />}
  name="other_findings"
                        value={PFAeditData.other_findings}
                        onChange={(e) =>
                          setPFAeditData({
                            ...PFAeditData,
                            other_findings: e.target.value,
                          })
                        }
/>

                    </FormGroup>
                  </div>

                  {/* Lymphadenopathy */}
                  <div className="col-md-12">
                    <FormGroup className="mb-0">
                      {/* <Label>{getTranslation(Lymphadenopathy,lang)}</Label>
                      <Input
                        type="textarea"
                        rows="3"
                        name="lymphadenopathy"
                        value={PFAeditData.lymphadenopathy}
                        onChange={(e) =>
                          setPFAeditData({
                            ...PFAeditData,
                            lymphadenopathy: e.target.value,
                          })
                        }
                      /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(Lymphadenopathy,lang)} />}
  name="lymphadenopathy"
                        value={PFAeditData.lymphadenopathy}
                        onChange={(e) =>
                          setPFAeditData({
                            ...PFAeditData,
                            lymphadenopathy: e.target.value,
                          })
                        }
/>

                    </FormGroup>
                  </div>

                  {/* Nutritional Status / नुट्रिशन स्तिथि */}
                  <div className="col-md-6">
                    <Label>{getTranslation("Nutritional Status / नुट्रिशन स्तिथि,",lang)}</Label>
                    <div className="radio radio-primary d-flex gap-3">
                      {[getTranslation("Good/अच्छा",lang), getTranslation("Average/औसत",lang), getTranslation("Poor/गरीब",lang)].map((Nstatus) => (
                        <div key={Nstatus}>
                          <Input
                            type="radio"
                            id={`nutritionalStatus-${Nstatus}`}
                            name="nutritional_status"
                            value={Nstatus}
                            checked={PFAeditData.nutritional_status === Nstatus}
                            onChange={(e) =>
                              setPFAeditData({
                                ...PFAeditData,
                                nutritional_status: e.target.value,
                              })
                            }
                          />
                          <Label htmlFor={`nutritionalStatus-${Nstatus}`}>
                            {Nstatus}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Consent Section */}
                  <div className="col-md-12 mt-4">
                    <div className="checkbox ms-3">
                    <Input
                      id="checkbox1"
                      type="checkbox"
                      checked={PFAeditData.readmissionConsent === "Yes"}
                      onChange={(e) =>
                        setPFAeditData({
                          ...PFAeditData,
                          readmissionConsent: e.target.checked ? "Yes" : "No",
                        })
                      }
                    />
                    <Label className="text-muted" for="checkbox1">
                      {getTranslation(consent,lang)}
                    </Label>
                  </div>

                    <Row>
                      <Col md="4">
                        <FormGroup>
                          <Label>{getTranslation(name,lang)}</Label>
                          <Input
                            type="text"
                            name="consent_name"
                            placeholder={getTranslation("Name/नाम",lang)}
                            value={PFAeditData.consent_name}
                            onChange={(e) =>
                              setPFAeditData({
                                ...PFAeditData,
                                consent_name: e.target.value,
                              })
                            }
                          />
                        </FormGroup>
                      </Col>
                      <Col md="4">
                        <FormGroup>
                          <Label>{getTranslation(relationship,lang)}</Label>
                          <Input
                            type="text"
                            name="consent_relationship"
                            placeholder={getTranslation("Relationship/संबंध",lang)}
                            value={PFAeditData.consent_relationship}
                            onChange={(e) =>
                              setPFAeditData({
                                ...PFAeditData,
                                consent_relationship: e.target.value,
                              })
                            }
                          />
                        </FormGroup>
                      </Col>
                      <Col md="4">
                        <FormGroup>
                          <Label>{getTranslation(signature,lang)}</Label>
                          <Input
                            type="text"
                            name="consent_signature"
                            placeholder={getTranslation("Signature/हस्ताक्षर",lang)}
                            value={PFAeditData.consent_signature}
                            onChange={(e) =>
                              setPFAeditData({
                                ...PFAeditData,
                                consent_signature: e.target.value,
                              })
                            }
                          />
                        </FormGroup>
                      </Col>
                    </Row>
                  </div>

                  {/* Prepared By Section */}
                  <div className="col-md-12 mt-3">
                    <FormGroup>
                      <Label>{getTranslation(prepared,lang)}</Label>
                      <Input
                        type="text"
                        name="prepared_by"
                        placeholder={getTranslation("Prepared By/द्वारा तैयार",lang)}
                        value={PFAeditData.prepared_by}
                        onChange={(e) =>
                          setPFAeditData({
                            ...PFAeditData,
                            prepared_by: e.target.value,
                          })
                        }
                      />
                    </FormGroup>
                  </div>

                  <div className="col-md-12 mt-4">
                        <div className="checkbox ms-3">
                          <Input
                            id="checkbox3"
                            type="checkbox"
                            checked={PFAeditData.readmissionVerification === "Yes"}
                            onChange={(e) =>
                              setPFAeditData((prev) => ({
                                ...prev,
                                readmissionVerification: e.target.checked ? "Yes" : "No",
                              }))
                            }
                          />
                          <Label className="text-muted" for="checkbox3">
                            {
                              getTranslation("Varification from parent side before PFA submitting/PFA सबमिट करने से पहले माता-पिता की तरफ से वेरिफिकेशन",lang)
                            }
                          </Label>
                        </div>
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
                        getTranslation("Recreate PFA Form / पीएफए ​​को पुनः बनाएँ",lang)
                      )}
                    </Button>
                  </div>
                </Form>
              </div>
            )}
          </CommonModal>



           {/* Edit individual PFA by user_id modal */}
           <CommonModal
            isOpen={PFAEditIndividualDataModal}
            title={getTranslation("Edit Patient First Assessment (PFA)/रोगी प्रथम मूल्यांकन (PFA) संपादित करें",lang)}
            toggler={closeUserViewModal}
            maxWidth="1200px"
          >

 
  {PFAEditIndividualDataModal && (
      <div className="row p-3">
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            handlerEditPFAIndividualAssessmentData();
          }}
        >
          {/* Date of assesment */}
            <div className="col-md-6 mt-3">
              <FormGroup className="form-group row">
                <Label className="col-sm-12 col-form-label  col-xl-6">
                  {getTranslation(dateOfAssessment,lang)}
                </Label>
                <Col xl="5" sm="12">
                  <div className="input-group">
                  <DatePicker showMonthDropdown showYearDropdown dropdownMode="select"
  className="form-control digits"
  selected={PFAeditData?.date_of_assessment} // Always Date object or null
  onChange={(date) =>
    setPFAeditData({
      ...PFAeditData,
      date_of_assessment: date, // Store as Date object
    })
  }
  
/>

                  </div>
                </Col>
              </FormGroup>
            </div>
          {/* Dependent To */}
          <div className="col-md-12 pt-3">
            <FormGroup className="mb-0">
              {/* <Label>{getTranslation(dependentTo,lang)}</Label>
              <Input
                type="textarea"
                rows="3"
                name="dependentToData"
                value={PFAeditData?.dependent_to}
                onChange={(e) =>
                  setPFAeditData({
                    ...PFAeditData,
                    dependent_to: e.target.value,
                  })
                }
              /> */}

              {/* <Label>{getTranslation(dependentTo, lang)}</Label> */}
<Label>{getTranslation("Dependent To / किस पर निर्भर", lang)}</Label>

<select
  className="form-control"
  name="dependentToData"
  value={PFAeditData?.dependent_to}
  onChange={(e) =>
    setPFAeditData({
      ...PFAeditData,
      dependent_to: e.target.value,
    })
  }
>
  <option value="">
    {getTranslation("Select Dependency / निर्भरता चुनें", lang)}
  </option>

  <option value="Alcohol">
    {getTranslation("Alcohol / शराब", lang)}
  </option>

  <option value="Afeem, Doada Chura">
    {getTranslation("Afeem, Doada Chura / अफीम, डोडा चुरा", lang)}
  </option>

  <option value="Samke Heroin">
    {getTranslation("Samke Heroin / समके हेरोइन", lang)}
  </option>

  <option value="Coacine">
    {getTranslation("Coacine / कोकीन", lang)}
  </option>

  <option value="MD">
    {getTranslation("MD / एमडी", lang)}
  </option>

  <option value="Ganja, Bhang, Charas, Munnka">
    {getTranslation("Ganja, Bhang, Charas, Munnka / गांजा, भांग, चरस, मुन्नका", lang)}
  </option>

  <option value="Inhalant Abuse">
    {getTranslation("Inhalant Abuse / इनहेलेंट का दुरुपयोग", lang)}
  </option>

  <option value="Medical Abuse">
    {getTranslation("Medical Abuse / चिकित्सा दुरुपयोग", lang)}
  </option>

  <option value="Multi Addict">
    {getTranslation("Multi Addict / मल्टी एडिक्ट", lang)}
  </option>
</select>


{/* <VoiceTextarea
  label={<Translated text={getTranslation(dependentTo,lang)} />}
  name="dependentToData"
                value={PFAeditData?.dependent_to}
                onChange={(e) =>
                  setPFAeditData({
                    ...PFAeditData,
                    dependent_to: e.target.value,
                  })
                }
/> */}

            </FormGroup>
          </div>

          {/* Substance Use Pattern */}
          <div className="col-md-12">
            <FormGroup className="mb-0">
              {/* <Label>{getTranslation(substanceUsePattern,lang)}</Label>
              <Input
                type="textarea"
                rows="3"
                name="substanceUsePatternData"
                value={PFAeditData?.substance_use_pattern}
                onChange={(e) =>
                  setPFAeditData({
                    ...PFAeditData,
                    substance_use_pattern: e.target.value,
                  })
                }
              /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(substanceUsePattern,lang)} />}
  name="substanceUsePatternData"
                value={PFAeditData?.substance_use_pattern}
                onChange={(e) =>
                  setPFAeditData({
                    ...PFAeditData,
                    substance_use_pattern: e.target.value,
                  })
                }
/>
            </FormGroup>
          </div>

          {/* Last 30 Days Quantity */}
          <div className="col-md-12">
            <FormGroup className="mb-0">
              {/* <Label>{getTranslation(last30DaysQuantity,lang)}</Label>
              <Input
                type="textarea"
                rows="3"
                name="last30DaysQuantityData"
                value={PFAeditData?.last_30_days_quantity}
                onChange={(e) =>
                  setPFAeditData({
                    ...PFAeditData,
                    last_30_days_quantity: e.target.value,
                  })
                }
              /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(last30DaysQuantity,lang)} />}
  name="last30DaysQuantityData"
  value={PFAeditData?.last_30_days_quantity}
  onChange={(e) =>
    setPFAeditData({
      ...PFAeditData,
      last_30_days_quantity: e.target.value,
    })
  }
/>
            </FormGroup>
          </div>

          {/* General Physical Examination */}
          <div className="table-responsive">
            <Table bordered>
              <thead>
                <tr>
                  <th>{getTranslation(tableNumber,lang)}</th>
                  <th>{getTranslation(genralPhysicalExamination,lang)}</th>
                  <th>{getTranslation(Observation,lang)}</th>
                </tr>
              </thead>
              <tbody>
  {[
    {
      id: "5",
      question: getTranslation(anyMedicalHistory, lang),
      name: "medical_history",
      type: "yesno", // added type
    },
    {
      id: "6",
      question: getTranslation(anyBloodTransfusionHistory, lang),
      name: "blood_transfusion_history",
      type: "yesno", // added type
    },
    {
      id: "7",
      question: getTranslation(Weight, lang),
      name: "weight",
    },
    {
      id: "8",
      question: getTranslation(PulseRate, lang),
      name: "pulse_rate",
    },
    {
      id: "9",
      question: getTranslation(Bloodpressure, lang),
      name: "blood_pressure",
    },
    {
      id: "10",
      question: getTranslation(Temperature, lang),
      name: "temperature",
    },
  ].map(({ id, question, name, type }) => (
    <tr key={id}>
      <td>{id}</td>
      <td>{question}</td>
      <td>
        {type === "yesno" ? (
          <select
            className="form-control"
            name={name}
            value={PFAeditData[name] || ""}
            onChange={(e) => {
              const { name, value } = e.target;
              setPFAeditData((prev) => ({
                ...prev,
                [name]: value,
              }));
            }}
          >
            <option value="">
              {getTranslation("Select / चुनें", lang)}
            </option>
            <option value="Yes">{getTranslation("Yes / हाँ", lang)}</option>
            <option value="No">{getTranslation("No / नहीं", lang)}</option>
          </select>
        ) : (
          <Input
            type={["weight", "pulse_rate", "temperature"].includes(name) ? "number" : "text"}
            name={name}
            value={PFAeditData[name] || ""}
            onChange={(e) => {
              const { name, value, type } = e.target;
              setPFAeditData((prev) => ({
                ...prev,
                [name]: type === "number" ? Number(value) : value,
              }));
            }}
          />
        )}
      </td>
    </tr>
  ))}
</tbody>

              {/* <tbody>
                {[
                  {
                    id: "5",
                    question: getTranslation(anyMedicalHistory,lang),
                    name: "medical_history",
                  },
                  {
                    id: "6",
                    question: getTranslation(anyBloodTransfusionHistory,lang),
                    name: "blood_transfusion_history",
                  },
                  {
                    id: "7",
                    question: getTranslation(Weight,lang),
                    name: "weight",
                  },
                  {
                    id: "8",
                    question: getTranslation(PulseRate,lang),
                    name: "pulse_rate",
                  },
                  {
                    id: "9",
                    question: getTranslation(Bloodpressure,lang),
                    name: "blood_pressure",
                  },
                  {
                    id: "10",
                    question: getTranslation(Temperature,lang),
                    name: "temperature",
                  },
                ].map(({ id, question, name }) => (
                  <tr key={id}>
                    <td>{id}</td>
                    <td>{question}</td>
                    <td>
                      <Input
                        type={
                          [
                            "weight",
                            "pulse_rate",
                            "temperature",
                          ].includes(name)
                            ? "number"
                            : "text"
                        }
                        name={name}
                        value={PFAeditData[name] || ""}
                        onChange={(e) => {
                          const { name, value, type } = e.target;
                          setPFAeditData((prev) => ({
                            ...prev,
                            [name]:
                              type === "number" ? Number(value) : value,
                          }));
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody> */}
            </Table>

            <div className="col-md-12">
              <FormGroup className="mb-0 mt-4 mb-4">
                {/* <Label>{getTranslation(mentionIfAny,lang)}</Label>
                <Input
                  type="textarea"
                  rows="3"
                  name="bloodTransfusionHistoryData"
                  value={PFAeditData?.medical_or_blood_history_details}
                  onChange={(e) =>
                    setPFAeditData({
                      ...PFAeditData,
                      medical_or_blood_history_details: e.target.value,
                    })
                  }
                /> */}
                <VoiceTextarea
  label={<Translated text={getTranslation(mentionIfAny,lang)} />}
  name="bloodTransfusionHistoryData"
  value={PFAeditData?.medical_or_blood_history_details}
  onChange={(e) =>
    setPFAeditData({
      ...PFAeditData,
      medical_or_blood_history_details: e.target.value,
    })
  }
/>
              </FormGroup>
            </div>
          </div>

          {/* Complication Details */}
          <div className="table-responsive">
  <Table bordered>
    <thead>
      <tr>
        <th>{getTranslation(tableNumber2,lang)}</th>
        <th>{getTranslation(complicationDetails,lang)}</th>
        <th>{getTranslation(yes1,lang)}</th>
        <th>{getTranslation(no1,lang)}</th>
      </tr>
    </thead>
    <tbody>
      {[
        { key: "ulcer", label: getTranslation(ulcers,lang) },
        { key: "respiratory_problem", label: getTranslation(respiratoryProblem,lang) },
        { key: "jaundice", label: getTranslation(jaundice,lang) },
        { key: "haematemesis", label: getTranslation(Haematemesis,lang) },
        { key: "abdominal_complaints", label: getTranslation(otherAbdominalComplaints,lang) },
        { key: "cardiovascular", label: getTranslation(cardiovascular,lang) },
      ].map(({ key, label }, index) => (
        <tr key={key}>
          <td>{index + 1}</td>
          <td>{label}</td>
          <td colSpan="2">
            <div className="radio radio-primary d-flex gap-3">
              {[getTranslation("Yes/हाँ",lang), getTranslation("No/नहीं",lang)].map((value) => {
                const inputId = `complication_${key}_${value}`;
                return (
                  <div
                    key={inputId}
                    className="form-check form-check-inline"
                  >
                    <Input
                      id={inputId}
                      type="radio"
                      className="form-check-input"
                      name={`complication_${key}`}
                      value={value}
                      checked={
                        PFAeditData?.[key]?.toString() === value.toString()
                      }
                      onChange={() => {
                        console.log(`Setting complication ${key} to:`, value);
                        setPFAeditData((prev) => ({
                          ...prev,
                          [key]: value, // store directly in flat structure
                        }));
                      }}
                    />

                    <Label
                      className="form-check-label"
                      for={inputId}
                    >
                      {value}
                    </Label>
                  </div>
                );
              })}
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </Table>

  <div className="col-md-12">
    <FormGroup className="mb-0 mt-4 mb-4">
      <Label>{getTranslation(mentionIfAny2,lang)}</Label>
      {/* <Input
        type="textarea"
        rows="3"
        name="complication_description"
        value={PFAeditData?.complication_description || ""}
        onChange={(e) =>
          setPFAeditData({
            ...PFAeditData,
            complication_description: e.target.value,
          })
        }
      /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(mentionIfAny2,lang)} />}
  name="complication_description"
        value={PFAeditData?.complication_description || ""}
        onChange={(e) =>
          setPFAeditData({
            ...PFAeditData,
            complication_description: e.target.value,
          })
        }
/>

    </FormGroup>
  </div>
</div>


          {/* Neurological Section */}
          <div className="table-responsive">
  <Table bordered>
    <thead>
      <tr>
        <th>{getTranslation(tableNumber3,lang)}</th>
        <th>{getTranslation(neurological,lang)}</th>
        <th>{getTranslation(yes1,lang)}</th>
        <th>{getTranslation(no1,lang)}</th>
      </tr>
    </thead>
    <tbody>
      {neurologicalOptions.map((option, index) => (
        <tr key={option.key}>
          <td>{index + 1}</td>
          <td>{getTranslation(option.label,lang)}</td>
          {[getTranslation("Yes/हाँ",lang), getTranslation("No/नहीं",lang)].map((value) => {
            const inputId = `neuro_${option.key}_${value}`;
            return (
              <td key={inputId}>
                <div className="radio radio-primary d-flex gap-3">
                  <div className="form-check form-check-inline">
                    <Input
                      id={inputId}
                      type="radio"
                      className="form-check-input"
                      name={`neuro_${option.key}`}
                      value={value}
                      checked={
                        PFAeditData?.[option.key]?.toString() === value.toString()
                      }
                      onChange={() =>
                        setPFAeditData((prev) => ({
                          ...prev,
                          [option.key]: value, // store in flat structure
                        }))
                      }
                    />
                    <Label
                      className="form-check-label"
                      htmlFor={inputId}
                    >
                      {value}
                    </Label>
                  </div>
                </div>
              </td>
            );
          })}
        </tr>
      ))}
    </tbody>
  </Table>

  <div className="col-md-12">
    <FormGroup className="mb-0 mt-4 mb-4">
      {/* <Label>{getTranslation(mentionIfAny2,lang)}</Label>
      <Input
        type="textarea"
        rows="3"
        name="neuro_description"
        value={PFAeditData?.neuro_description || ""}
        onChange={(e) =>
          setPFAeditData({
            ...PFAeditData,
            neuro_description: e.target.value,
          })
        }
      /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(mentionIfAny2,lang)} />}
  name="neuro_description"
        value={PFAeditData?.neuro_description || ""}
        onChange={(e) =>
          setPFAeditData({
            ...PFAeditData,
            neuro_description: e.target.value,
          })
        }
/>

    </FormGroup>
  </div>
</div>


          {/* Any Other Findings */}
          <div className="col-md-12">
            <FormGroup className="mb-0">
              {/* <Label>{getTranslation(anyOtherFindings,lang)}</Label>
              <Input
                type="textarea"
                rows="3"
                name="other_findings"
                value={PFAeditData?.other_findings}
                onChange={(e) =>
                  setPFAeditData({
                    ...PFAeditData,
                    other_findings: e.target.value,
                  })
                }
              /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(anyOtherFindings,lang)} />}
  name="other_findings"
                value={PFAeditData?.other_findings}
                onChange={(e) =>
                  setPFAeditData({
                    ...PFAeditData,
                    other_findings: e.target.value,
                  })
                }
/>

            </FormGroup>
          </div>

          {/* Lymphadenopathy */}
          <div className="col-md-12">
            <FormGroup className="mb-0">
              {/* <Label>{getTranslation(Lymphadenopathy,lang)}</Label>
              <Input
                type="textarea"
                rows="3"
                name="lymphadenopathy"
                value={PFAeditData?.lymphadenopathy}
                onChange={(e) =>
                  setPFAeditData({
                    ...PFAeditData,
                    lymphadenopathy: e.target.value,
                  })
                }
              /> */}

<VoiceTextarea
  label={<Translated text={getTranslation(Lymphadenopathy,lang)} />}
  name="lymphadenopathy"
  value={PFAeditData?.lymphadenopathy}
  onChange={(e) =>
    setPFAeditData({
      ...PFAeditData,
      lymphadenopathy: e.target.value,
    })
  }
/>

            </FormGroup>
          </div>

          {/* Nutritional Status / नुट्रिशन स्तिथि */}
          <div className="col-md-6">
            <Label>{getTranslation("Nutritional Status / नुट्रिशन स्तिथि",lang)}</Label>
            <div className="radio radio-primary d-flex gap-3">
              {[getTranslation("Good/अच्छा",lang), getTranslation("Average/औसत",lang), getTranslation("Poor/गरीब",lang)].map((Nstatus) => (
                <div key={Nstatus}>
                  <Input
                    type="radio"
                    id={`nutritionalStatus-${Nstatus}`}
                    name="nutritional_status"
                    value={Nstatus}
                    checked={PFAeditData?.nutritional_status === Nstatus}
                    onChange={(e) =>
                      setPFAeditData({
                        ...PFAeditData,
                        nutritional_status: e.target.value,
                      })
                    }
                  />
                  <Label htmlFor={`nutritionalStatus-${Nstatus}`}>
                    {Nstatus}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Consent Section */}
          <div className="col-md-12 mt-4">
            <div className="checkbox ms-3">
            <Input
              id="checkbox1"
              type="checkbox"
              checked={PFAeditData?.consent === "Yes"}
              onChange={(e) =>
                setPFAeditData({
                  ...PFAeditData,
                  consent: e.target.checked ? "Yes" : "No",
                })
              }
            />
            <Label className="text-muted" for="checkbox1">
              {getTranslation(consent,lang)}
            </Label>
          </div>

            <Row>
              <Col md="4">
                <FormGroup>
                  <Label>{getTranslation(name,lang)}</Label>
                  <Input
                    type="text"
                    name="consent_name"
                    placeholder={getTranslation("Name/नाम",lang)}
                    value={PFAeditData?.consent_name}
                    onChange={(e) =>
                      setPFAeditData({
                        ...PFAeditData,
                        consent_name: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </Col>
              <Col md="4">
                <FormGroup>
                  <Label>{getTranslation(relationship,lang)}</Label>
                  <Input
                    type="text"
                    name="consent_relationship"
                    placeholder={getTranslation("Relationship/संबंध",lang)}
                    value={PFAeditData?.consent_relationship}
                    onChange={(e) =>
                      setPFAeditData({
                        ...PFAeditData,
                        consent_relationship: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </Col>
              <Col md="4">
                <FormGroup>
                  <Label>{getTranslation(signature,lang)}</Label>
                  <Input
                    type="text"
                    name="consent_signature"
                    placeholder={getTranslation("Signature/हस्ताक्षर",lang)}
                    value={PFAeditData?.consent_signature}
                    onChange={(e) =>
                      setPFAeditData({
                        ...PFAeditData,
                        consent_signature: e.target.value,
                      })
                    }
                  />
                </FormGroup>
              </Col>
            </Row>
          </div>

          {/* Prepared By Section */}
          <div className="col-md-12 mt-3">
            <FormGroup>
              <Label>{getTranslation(prepared,lang)}</Label>
              <Input
                type="text"
                name="prepared_by"
                placeholder={getTranslation("Prepared By/द्वारा तैयार",lang)}
                value={PFAeditData?.prepared_by}
                onChange={(e) =>
                  setPFAeditData({
                    ...PFAeditData,
                    prepared_by: e.target.value,
                  })
                }
              />
            </FormGroup>
          </div>

          <div className="col-md-12 mt-4">
                <div className="checkbox ms-3">
                  <Input
                    id="checkbox3"
                    type="checkbox"
                    checked={PFAeditData?.verification === "Yes"}
                    onChange={(e) =>
                      setPFAeditData((prev) => ({
                        ...prev,
                        verification: e.target.checked ? "Yes" : "No",
                      }))
                    }
                  />
                  <Label className="text-muted" for="checkbox3">
                    {
                      getTranslation("Varification from parent side before PFA submitting/पीएफए ​​जमा करने से पहले माता-पिता की ओर से सत्यापन",lang)
                    }
                  </Label>
                </div>
              </div>

          {/* Submit Button */}
          <div className="d-flex gap-3 pt-4">
            <Button color="primary" type="submit" disabled={isLoading}>
              {isLoading ? (
                <span
                  className="spinner-border spinner-border-sm"
                  role="status"
                  aria-hidden="true"
                ></span>
              ) : (
                getTranslation("Update Patient First Assessment (PFA)/रोगी प्रथम मूल्यांकन (पीएफए) को अद्यतन करें",lang)
              )}
            </Button>
          </div>
        </Form>
      </div>
  )}
    



            
          </CommonModal>
        </div>
      </div>
    </Fragment>

   
  );
}

export default PFA;
