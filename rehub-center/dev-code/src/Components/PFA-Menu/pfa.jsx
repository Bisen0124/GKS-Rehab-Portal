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

function PFA() {
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
        const pfaDate = user.recent_pfa_date
          ? new Date(user.recent_pfa_date)
          : null;

        let userStatus = <p className="badge bg-warning text-dark p-2">{"Pending"}</p>;
        if (admitDate && pfaDate && admitDate > pfaDate) {
          userStatus = <p className="badge bg-success p-2">{"Completed"}</p>;
        }

        const dischargeStatus = user.discharge_status_text || "Unknown";

        return {
          id: user.user_id,
          gks_id: user.gks_id || "N/A",
          name: user.name,
          status: userStatus,
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
      }, 1000); // You can reduce this to 1s
    })
    .catch((error) => {
      console.error("Error fetching PFA user data:", error);
      setstillLoading(true);
    });
}, []);




  //PFA view
  const [viewModal, setViewModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  //close view data modal
  const closeUserViewModal = () => {
    setViewModal(false);
    setPFAEditModal(false);
  };

  //status track for action button of PFA

  const tableColumns = [
  { name: "User ID", selector: (row) => row.id, sortable: true, center: true },
  { name: "GKS ID", selector: (row) => row.gks_id, sortable: true, center: true },
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
            onClick={() => handleFAEdit(row.recent_pfa_id)}
            style={{ cursor: "pointer" }}
            title="Readmission PFA"
          >
            ✏️
          </span>
        )}

        {/* Show Create PFA if not discharged and not readmission */}
        {row.dischargeStatus === 0 && row.isReadmission === 0 && (
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
        )}
      </div>
    );
  },
}



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

    const token = localStorage.getItem("Authorization");

    try {
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/pfa/user-assessment/${userId}`,
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

      const latestAssessment = (data.assessments || []).sort(
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
    // Always open the modal immediately
    setModal(true);
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
        console.log(selectedUser?.dob);
      } catch (error) {
        console.error("Fetch error:", error);
      }
    }

    // Toggle modal open/close
    setModal(!modal);
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
        title: "Missing Fields",
        text: "Please fill all required fields before submitting.",
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
      const token = localStorage.getItem("Authorization");

      const response = await fetch(
        "https://gks-yjdc.onrender.com/api/pfa/create-assessment",
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
          title: "Submission Failed",
          text: result.message || "Server error",
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
    title: "PFA Created Successfully",
    text: "The PFA assessment was submitted successfully.",
  }).then(() => {
  // This runs after the user clicks "OK"
  setModal(false);
});
    } catch (error) {
      setIsLoading(false);
      Swal.fire({
        icon: "error",
        title: "Unexpected Error",
        text: "PFA failed! Unknown error occurred.",
      });
    }
  };

  //Partially delete, delete row will show but it's disbaled

  const handlePFADelete = async (userId) => {
    const token = localStorage.getItem("Authorization");

    if (!userId) {
      console.error("No userId provided for deletion");
      Swal.fire("Error", "No user selected for deletion", "error");
      return;
    }

    console.log("Delete called with userId:", userId);

    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "You are about to delete this assessment.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;

    try {
      // First, get pfa_id using userId
      const getResponse = await fetch(
        `https://gks-yjdc.onrender.com/api/pfa/user-assessment/${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        }
      );

      const data = await getResponse.json();

      if (!getResponse.ok || !data?.assessment?.patient_id) {
        console.error("Failed to get assessment data:", data);
        Swal.fire("Error", "Could not fetch assessment info.", "error");
        return;
      }

      const pfa_id = data.assessment.patient_id;
      console.log("Fetched pfa_id:", pfa_id);

      // Now delete using pfa_id
      const delResponse = await fetch(
        `https://gks-yjdc.onrender.com/api/pfa/delete-assessment/${pfa_id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        }
      );

      const result = await delResponse.json();

      if (!delResponse.ok) {
        console.error("Delete failed:", result);
        Swal.fire("Error", "Assessment deletion failed!", "error");
        return;
      }

      Swal.fire("Deleted!", "Assessment has been deleted.", "success");

      // // Disable that row
      // setData((prev) =>
      //   prev.map((user) =>
      //     user.id === userId ? { ...user, disabled: true } : user
      //   )
      // );
      // setFilteredData((prev) =>
      //   prev.map((user) =>
      //     user.id === userId ? { ...user, disabled: true } : user
      //   )
      // );/
      // Completely remove the row
      setData((prev) => prev.filter((user) => user.id !== userId));
      setFilteredData((prev) => prev.filter((user) => user.id !== userId));
    } catch (error) {
      console.error("Error deleting assessment:", error);
      Swal.fire("Error", "Something went wrong.", "error");
    }
  };

  //PFA edit handler
  const [PFAeditData, setPFAeditData] = useState(null);
  const [PFAEditModal, setPFAEditModal] = useState(false);
  //fetch the latest assessment based on created_at, then simply sort the assessments and pick the first one: - Not applicable
  //Re-admission patient by handlePDAEdit
    //🔧 Convert DD/MM/YYYY to Date Object:
const parseDateString = (dateStr) => {
  if (!dateStr) return null;

  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};
 const handleFAEdit = async (recentPFAiD = null) => {
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
    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/pfa/patient-assessment/${recentPFAiD}`,
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
      pfa_id: latestAssessment.pfa_id,
      // date_of_assessment: latestAssessment.date_of_assessment,
       date_of_assessment: latestAssessment.date_of_assessment ? parseDateString(latestAssessment.date_of_assessment) : "", // Use your date parser here
      dependent_to: latestAssessment.dependent_to,
      substance_use_pattern: latestAssessment.substance_use_pattern,
      last_30_days_quantity: latestAssessment.last_30_days_quantity,

      medicalConfirmationData: latestAssessment?.medical_history || "",
      bloodConfirmationData: latestAssessment?.blood_transfusion_history || "",

      weight: Number(latestAssessment?.weight) || 0,
      pulse_rate: Number(latestAssessment?.pulse_rate) || 0,
      blood_pressure: latestAssessment?.blood_pressure || "",
      temperature: Number(latestAssessment?.temperature) || 0,
      lymphadenopathy: latestAssessment?.lymphadenopathy || "",

      medical_or_blood_history_details:
        latestAssessment.medical_or_blood_history_details,
      complication_description: latestAssessment.complication_description,
      neuro_description: latestAssessment.neuro_description,
      other_findings: latestAssessment.other_findings,
      consent_name: latestAssessment.consent_name,
      consent_relationship: latestAssessment.consent_relationship,
      consent_signature: latestAssessment.consent_signature,
      prepared_by: latestAssessment.prepared_by,

      complications: {
        ulcer: latestAssessment.ulcer,
        respiratory_problem: latestAssessment.respiratory_problem,
        jaundice: latestAssessment.jaundice,
        haematemesis: latestAssessment.haematemesis,
        abdominal_complaints: latestAssessment.abdominal_complaints,
        cardiovascular: latestAssessment.cardiovascular,
      },

      neurological: {
        delirium: latestAssessment.delirium,
        seizure: latestAssessment.seizure,
        blackout: latestAssessment.blackout,
        memory_loss: latestAssessment.memory_loss,
        trembling: latestAssessment.trembling,
        epilepsy: latestAssessment.epilepsy,
        neuropathy: latestAssessment.neuropathy,
      },

      lymphadenopathy: latestAssessment.lymphadenopathy,
      nutritional_status: latestAssessment.nutritional_status,
    });
  } catch (error) {
    console.error("Fetch error:", error);
  }
};


  //PFA update patient assessment handler - Not applicable
  //Readmission patient PFA Handler
  const handleUpdateAssessment = async () => {
    setIsLoading(true); // Start loading

    const payload = {
      // user_id: selectedUser[0].user_id,
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

      const response = await fetch(
        "https://gks-yjdc.onrender.com/api/pfa/create-assessment",
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
          title: "Readmission Submission Failed",
          text: result.message || "Server error",
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
    title: "PFA Readmission Created Successfully",
    text: "The PFA readmission was submitted successfully.",
  }).then(() => {
  // This runs after the user clicks "OK"
  setModal(false);
});
    } catch (error) {
      setIsLoading(false);
      Swal.fire({
        icon: "error",
        title: "Unexpected Error",
        text: "PFA Readmission failed! Unknown error occurred.",
      });
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
        toast.success("Download complete!");
        element.classList.remove("pdf-scale");

        setTimeout(() => {
          setpfaDownload(false);
        }, 2000);
      });
  };

  return (
    <Fragment>
      <div className="pfa__wrapper p-20">
        {/* <H5>{patientFirstAssessment}</H5> */}

        <Container fluid={true} className="datatables">
          <Row>
            <Col sm="12">
              <CardBody>
                <Card>
                  {/* <HeaderCard title="User Data Table with Multiple Selection" /> */}
                  <CardBody>
                    <div class="d-flex pb-2 justify-content-between">
                      <HeaderCard
                        title="Patient First Assessment (PFA)"
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

        <div className="generalInfo__section">
          {/* PFA data form modal */}
          <CommonModal
            isOpen={modal}
            title={patientFirstAssessment}
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
                      name: "Patient name/प्रयासक का नाम :",
                      sex: "Gender/प्रयासक का लिंग :",
                      age: "Age/प्रयासक का उम्र :",
                      date_of_admission: "Date of Admission/प्रवेश की तिथि :",
                      ageValue: patientCalAge,
                    }}
                  />

                  <div className="row px-3 pt-4 pb-3">
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
                            <DatePicker
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
                        <Label>{dependentTo}</Label>
                        <Input
                          type="textarea"
                          className="form-control"
                          rows="3"
                          name="dependentToData"
                          value={formData.dependentToData}
                          onChange={handleChange}
                        />
                      </FormGroup>
                    </div>
                    {/*Substance Use Pattern section/उपयोगकर्ता :*/}
                    <div className="col-md-12">
                      <FormGroup className="mb-4 mt-4">
                        <Label>{substanceUsePattern}</Label>
                        <Input
                          type="textarea"
                          className="form-control"
                          rows="3"
                          name="substanceUsePatternData"
                          value={formData.substanceUsePatternData}
                          onChange={handleChange}
                        />
                      </FormGroup>
                    </div>
                    {/*Last 30 Days Quantity section/उपयोगकर्ता :*/}
                    <div className="col-md-12">
                      <FormGroup className="mb-4 mt-4">
                        <Label>{last30DaysQuantity}</Label>
                        <Input
                          type="textarea"
                          className="form-control"
                          rows="3"
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
                            <th scope="col">{tableNumber}</th>
                            <th scope="col">{genralPhysicalExamination}</th>
                            <th scope="col">{Observation}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            {
                              id: "5",
                              question: anyMedicalHistory,
                              name: "medicalConfirmationData",
                            },
                            {
                              id: "6",
                              question: anyBloodTransfusionHistory,
                              name: "bloodConfirmationData",
                            },
                            {
                              id: "7",
                              question: Weight,
                              name: "weight",
                            },
                            {
                              id: "8",
                              question: PulseRate,
                              name: "pulse_rate",
                            },
                            {
                              id: "9",
                              question: Bloodpressure,
                              name: "blood_pressure",
                            },
                            {
                              id: "10",
                              question: Temperature,
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
                                  placeholder="Enter details"
                                  className="form-control"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>

                      <div className="col-md-12">
                        <FormGroup className="mb-4 mt-4">
                          <Label>{mentionIfAny}</Label>
                          <Input
                            type="textarea"
                            className="form-control"
                            rows="3"
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
                            <th scope="col">{tableNumber2}</th>
                            <th scope="col">{complicationDetails}</th>
                            <th scope="col">{yes1}</th>
                            <th scope="col">{no1}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { key: "ulcer", label: ulcers },
                            {
                              key: "respiratory_problem",
                              label: respiratoryProblem,
                            },
                            { key: "jaundice", label: jaundice },
                            { key: "haematemesis", label: Haematemesis },
                            {
                              key: "abdominal_complaints",
                              label: otherAbdominalComplaints,
                            },
                            { key: "cardiovascular", label: cardiovascular },
                          ].map(({ key, label }, index) => (
                            <tr key={key}>
                              <td>{index + 1}</td>
                              <td>{label}</td>
                              {["Yes", "No"].map((value) => {
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
                                      {value === "Yes" ? "Yes" : "No"}
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
                          <Label>{mentionIfAny2}</Label>
                          <Input
                            type="textarea"
                            className="form-control"
                            rows="3"
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
                            <th scope="col">{tableNumber3}</th>
                            <th scope="col">{neurological}</th>
                            <th scope="col">{yes1}</th>
                            <th scope="col">{no1}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {neurologicalOptions.map((option, index) => (
                            <tr key={option.key}>
                              <td>{index + 1}</td>
                              <td>{option.label}</td>
                              {["Yes", "No"].map((value) => {
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
                                      {value === "Yes" ? "Yes" : "No"}
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
                          <Label>{mentionIfAny2}</Label>
                          <Input
                            type="textarea"
                            className="form-control"
                            rows="3"
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
                        <Label>{anyOtherFindings}</Label>
                        <Input
                          type="textarea"
                          className="form-control"
                          rows="3"
                          name="other_findings"
                          value={formData.other_findings}
                          onChange={handleChange}
                        />
                      </FormGroup>
                    </div>

                    {/* Nutritional Status / नुट्रिशन स्तिथि */}
                    <div className="col-md-6">
                      <Label>Nutritional Status / नुट्रिशन स्तिथि</Label>
                      <div className="radio radio-primary d-flex gap-3">
                        {["Good", "Average", "Poor"].map((Nstatus) => (
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
                        <Label>{Lymphadenopathy}</Label>
                        <Input
                          type="textarea"
                          className="form-control"
                          rows="3"
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
                          {consent}
                        </Label>
                      </div>

                      <Row>
                        <Col md="4">
                          <FormGroup>
                            <Label>{name}</Label>
                            <Input
                              type="text"
                              placeholder="Name"
                              name="consent_name"
                              value={formData.consent_name}
                              onChange={handleChange}
                            />
                          </FormGroup>
                        </Col>
                        <Col md="4">
                          <FormGroup>
                            <Label>{relationship}</Label>
                            <Input
                              type="text"
                              placeholder="Relationship"
                              name="consent_relationship"
                              value={formData.consent_relationship}
                              onChange={handleChange}
                            />
                          </FormGroup>
                        </Col>
                        <Col md="4">
                          <FormGroup>
                            <Label>{signature}</Label>
                            <Input
                              type="text"
                              placeholder="Signature"
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
                          <Label>{prepared}</Label>
                          <Input
                            type="text"
                            placeholder="Prepared By"
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
                              "Varification from parent side before PFA submitting"
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
                          "Submit Patient First Assessment (PFA) Form"
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
              "First Physical Assessment / प्रथम शारीरिक मूल्यांकन Details"
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
                  First Physical Assessment / प्रथम शारीरिक मूल्यांकन
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
                            Date of Assessment / मूल्यांकन की तारीख:
                          </td>
                          <td colSpan="2" className="p-3">
                            {new Date(
                              selectedUser.date_of_assessment
                            ).toLocaleDateString()}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan="2" className="fw-semibold p-3">
                            Name of Patient / मरीज का नाम:
                          </td>
                          <td colSpan="2" className="p-3">
                            <span colSpan="2" className="fw-normal">
                              {selectedUser.name}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td colSpan="2" className="fw-semibold p-3">
                            Sex / Age / लिंग / उम्र:
                          </td>
                          <td colSpan="2" className="p-3">
                            <span colSpan="2" className="fw-normal">
                              {selectedUser.age}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td colSpan="2" className="fw-semibold p-3">
                            Dependent To / निर्भरता का प्रकार:
                          </td>
                          <td colSpan="2" className="p-3">
                            <span colSpan="2" className="fw-normal">
                              {selectedUser.dependent_to}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td colSpan="2" className="fw-semibold p-3">
                            Substance Use Pattern / उपयोग का पैटर्न:
                          </td>
                          <td colSpan="2" className="p-3">
                            <span colSpan="2" className="fw-normal">
                              {selectedUser.substance_use_pattern}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td colSpan="2" className="fw-semibold p-3">
                            Last 30 Days Quantity / पिछले 30 दिनों की मात्रा:
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
                            General Physical Examination / सामान्य शारीरिक
                            परीक्षण
                          </td>
                        </tr>
                        {[
                          {
                            label: "Weight / वजन",
                            value: selectedUser.weight,
                          },
                          {
                            label: "Pulse Rate / पल्स रेट",
                            value: selectedUser.pulse_rate,
                          },
                          {
                            label: "Blood pressure / रक्तचाप",
                            value: selectedUser.blood_pressure,
                          },
                          {
                            label: "Temperature / तापमान",
                            value: selectedUser.temperature,
                          },
                          {
                            label: "Medical History / चिकित्सा इतिहास",
                            value: selectedUser.medical_history,
                          },
                          {
                            label:
                              "Blood Transfusion History / रक्त संक्रमण इतिहास",
                            value: selectedUser.blood_transfusion_history,
                          },
                          {
                            label: "Medical or Blood History Details",
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
                            Complication Details / जटिलता विवरण
                          </td>
                        </tr>
                        {[
                          {
                            label: "Ulcers / अल्सर",
                            value: selectedUser.ulcer,
                          },
                          {
                            label: "Respiratory Problem / श्वसन समस्या",
                            value: selectedUser.respiratory_problem,
                          },
                          {
                            label: "Jaundice / पीलिया",
                            value: selectedUser.jaundice,
                          },
                          {
                            label: "Haematemesis / मलैना",
                            value: selectedUser.haematemesis,
                          },
                          {
                            label: "Abdominal Complaints / पेट की शिकायतें",
                            value: selectedUser.abdominal_complaints,
                          },
                          {
                            label: "Cardiovascular / हृदय संबंधी",
                            value: selectedUser.cardiovascular,
                          },
                          {
                            label: "Complication Description",
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
                            Neurological / न्यूरोलॉजिकल
                          </td>
                        </tr>
                        {[
                          {
                            label: "Seizure / फिट्स",
                            value: selectedUser.seizure,
                          },
                          {
                            label: "Epilepsy / मिर्गी",
                            value: selectedUser.epilepsy,
                          },
                          {
                            label: "Delirium / भ्रम",
                            value: selectedUser.delirium,
                          },
                          {
                            label: "Trembling / कांपना",
                            value: selectedUser.trembling,
                          },
                          {
                            label: "Memory Loss / स्मृति हानि",
                            value: selectedUser.memory_loss,
                          },
                          {
                            label: "Neuropathy / स्नायु रोग",
                            value: selectedUser.neuropathy,
                          },
                          {
                            label: "Blackout / बेहोशी",
                            value: selectedUser.blackout,
                          },
                          {
                            label: "Neuro Description",
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
                            Nutritional Status / पोषण स्थिति:
                          </td>
                          <td colSpan="2" className="p-3">
                            {selectedUser.nutritional_status}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan="2" className="fw-semibold p-3">
                            Lymphadenopathy (mention):
                          </td>
                          <td colSpan="2" className="p-3">
                            {selectedUser.lymphadenopathy}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan="2" className="fw-semibold p-3">
                            Other Findings / अन्य खोज:
                          </td>
                          <td colSpan="2" className="p-3">
                            {selectedUser.other_findings}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan="2" className="fw-semibold p-3">
                            Consent:
                          </td>
                          <td colSpan="2" className="p-3">
                            {selectedUser.consent}
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-semibold p-3">Consent Name:</td>
                          <td className="p-3">{selectedUser.consent_name}</td>
                          <td className="fw-semibold p-3">Relationship:</td>
                          <td className="p-3">
                            {selectedUser.consent_relationship}
                          </td>
                        </tr>
                        <tr className="table-light fw-bold">
                          <td colSpan="1" className="fw-semibold p-3">
                            Prepared by:{" "}
                          </td>
                          <td className="p-3" colSpan="3">
                            {selectedUser.prepared_by}
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
                    ? "Your PFA is being downloaded.../ आपका PFA डाउनलोड हो रहा है..."
                    : "Download Your First Physical Assessment (PFA) / अपना प्रथम शारीरिक मूल्यांकन डाउनलोड करें"}
                </button>
              </div>
            </Col>
          </CommonModal>

          {/* PFA Edit Modal */}
          <CommonModal
            isOpen={PFAEditModal}
            title={"Readmission PFA"}
            toggler={closeUserViewModal}
            maxWidth="800px"
          >
            {PFAEditModal && PFAeditData && (
              <div className="row">
                <Form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdateAssessment();
                  }}
                >
                  {/* Date of assesment */}
                    <div className="col-md-6">
                      <FormGroup className="form-group row">
                        <Label className="col-sm-12 col-form-label  col-xl-6">
                          {dateOfAssessment}
                        </Label>
                        <Col xl="5" sm="12">
                          <div className="input-group">
                            <DatePicker
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
                      <Label>{dependentTo}</Label>
                      <Input
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
                      />
                    </FormGroup>
                  </div>

                  {/* Substance Use Pattern */}
                  <div className="col-md-12">
                    <FormGroup className="mb-0">
                      <Label>{substanceUsePattern}</Label>
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
                      />
                    </FormGroup>
                  </div>

                  {/* Last 30 Days Quantity */}
                  <div className="col-md-12">
                    <FormGroup className="mb-0">
                      <Label>{last30DaysQuantity}</Label>
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
                      />
                    </FormGroup>
                  </div>

                  {/* General Physical Examination */}
                  <div className="table-responsive">
                    <Table bordered>
                      <thead>
                        <tr>
                          <th>{tableNumber}</th>
                          <th>{genralPhysicalExamination}</th>
                          <th>{Observation}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          {
                            id: "5",
                            question: anyMedicalHistory,
                            name: "medicalConfirmationData",
                          },
                          {
                            id: "6",
                            question: anyBloodTransfusionHistory,
                            name: "bloodConfirmationData",
                          },
                          {
                            id: "7",
                            question: Weight,
                            name: "weight",
                          },
                          {
                            id: "8",
                            question: PulseRate,
                            name: "pulse_rate",
                          },
                          {
                            id: "9",
                            question: Bloodpressure,
                            name: "blood_pressure",
                          },
                          {
                            id: "10",
                            question: Temperature,
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
                      </tbody>
                    </Table>

                    <div className="col-md-12">
                      <FormGroup className="mb-0">
                        <Label>{mentionIfAny}</Label>
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
                        />
                      </FormGroup>
                    </div>
                  </div>

                  {/* Complication Details */}
                  <div className="table-responsive">
                    <Table bordered>
                      <thead>
                        <tr>
                          <th>{tableNumber2}</th>
                          <th>{complicationDetails}</th>
                          <th>{yes1}</th>
                          <th>{no1}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { key: "ulcer", label: ulcers },
                          {
                            key: "respiratory_problem",
                            label: respiratoryProblem,
                          },
                          { key: "jaundice", label: jaundice },
                          { key: "haematemesis", label: Haematemesis },
                          {
                            key: "abdominal_complaints",
                            label: otherAbdominalComplaints,
                          },
                          { key: "cardiovascular", label: cardiovascular },
                        ].map(({ key, label }, index) => (
                          <tr key={key}>
                            <td>{index + 1}</td>
                            <td>{label}</td>
                            <td colSpan="2">
                              <div className="radio radio-primary d-flex gap-3">
                                {["Yes", "No"].map((value) => {
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
                        <Label>{mentionIfAny2}</Label>
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
                        />
                      </FormGroup>
                    </div>
                  </div>

                  {/* Neurological Section */}
                  <div className="table-responsive">
                    <Table bordered>
                      <thead>
                        <tr>
                          <th>{tableNumber3}</th>
                          <th>{neurological}</th>
                          <th>{yes1}</th>
                          <th>{no1}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {neurologicalOptions.map((option, index) => (
                          <tr key={option.key}>
                            <td>{index + 1}</td>
                            <td>{option.label}</td>
                            {["Yes", "No"].map((value) => {
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
                        <Label>{mentionIfAny2}</Label>
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
                        />
                      </FormGroup>
                    </div>
                  </div>

                  {/* Any Other Findings */}
                  <div className="col-md-12">
                    <FormGroup className="mb-0">
                      <Label>{anyOtherFindings}</Label>
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
                      />
                    </FormGroup>
                  </div>

                  {/* Lymphadenopathy */}
                  <div className="col-md-12">
                    <FormGroup className="mb-0">
                      <Label>{Lymphadenopathy}</Label>
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
                      />
                    </FormGroup>
                  </div>

                  {/* Nutritional Status / नुट्रिशन स्तिथि */}
                  <div className="col-md-6">
                    <Label>Nutritional Status / नुट्रिशन स्तिथि</Label>
                    <div className="radio radio-primary d-flex gap-3">
                      {["Good", "Average", "Poor"].map((Nstatus) => (
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
                    {/* <div className="checkbox ms-3">
                    <Input
                      id="checkbox1"
                      type="checkbox"
                      checked={PFAeditData.consent === "Yes"}
                      onChange={(e) =>
                        setPFAeditData({
                          ...PFAeditData,
                          consent: e.target.checked ? "Yes" : "No",
                        })
                      }
                    />
                    <Label className="text-muted" for="checkbox1">
                      {consent}
                    </Label>
                  </div> */}

                    <Row>
                      <Col md="4">
                        <FormGroup>
                          <Label>{name}</Label>
                          <Input
                            type="text"
                            name="consent_name"
                            placeholder="Name"
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
                          <Label>{relationship}</Label>
                          <Input
                            type="text"
                            name="consent_relationship"
                            placeholder="Relationship"
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
                          <Label>{signature}</Label>
                          <Input
                            type="text"
                            name="consent_signature"
                            placeholder="Signature"
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
                      <Label>{prepared}</Label>
                      <Input
                        type="text"
                        name="prepared_by"
                        placeholder="Prepared By"
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
                        "Create PFA"
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
