import React, { useEffect, useState, useCallback, Fragment } from "react";
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
import { H5, Btn, P } from "../../AbstractElements";
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

function PFA() {
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
  // const [selectedRows, setSelectedRows] = useState([]);
  const [stillLoading, setstillLoading] = useState(true);
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
            // Fetch the latest assessment entry from user-assessment based on the latest ID, and update the status individually for each user using their latest assessment ID
            try {
              const statusResponse = await fetch(
                `https://gks-yjdc.onrender.com/api/pfa/user-assessment/${user.user_id}`,
                {
                  headers: {
                    Authorization: `${token}`,
                  },
                }
              );

              const assessmentData = await statusResponse.json();

              const latest = assessmentData?.assessments?.sort(
                (a, b) => new Date(b.created_at) - new Date(a.created_at)
              )[0];
        
              const userStatus = latest?.status === "Completed" ? "Completed" : "Pending";
              console.log(userStatus);

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
    { name: "ID", selector: (row) => row.id, sortable: true, center: true },
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
      cell: (row) => (
        <div className="d-flex gap-2">
          {row.status === "Pending" ? (
            // Show only Create icon for Pending
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
                onClick={() => viewPFAToggle(row.id)}
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
                onClick={() => handleFAEdit(row.id)}
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
              </span>
            </>
          )}
        </div>
      ),
    },
  ];

  //view pfa handler
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

      setSelectedUser(data.assessment); // ✅ extract assessment object
      console.log("Selected User Assessment:", data.assessment);
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
      patientId: selectedRow.patient_id, // or selectedRow.patientId if that’s what you named it
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
  const [isActionEnabled, setIsActionEnabled] = useState(false);
  //maintain status based on form sumit or not into table
  const [trackStatus, setrackStatus] = useState("Pending"); // Initially set to 'Pending'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Start loader

    const requiredFields = [
      // formData.dependentToData,
      // formData.substanceUsePatternData,
      // formData.last30DaysQuantityData,
      // formData.medicalConfirmationData,
      // formData.bloodConfirmationData,
      // formData.weight,
      // formData.pulse_rate,
      // formData.blood_pressure,
      // formData.temperature,
      // formData.bloodTransfusionHistoryData,
      // formData.complications.ulcer,
      // formData.complications.respiratory_problem,
      // formData.complications.jaundice,
      // formData.complications.haematemesis,
      // formData.complications.abdominal_complaints,
      // formData.complications.cardiovascular,
      // formData.complication_description,
      // formData.neurological.delirium,
      // formData.neurological.seizure,
      // formData.neurological.blackout,
      // formData.neurological.memory_loss,
      // formData.neurological.trembling,
      // formData.neurological.epilepsy,
      // formData.neurological.neuropathy,
      // formData.neuro_description,
      // formData.other_findings,
      // formData.consent,
      // formData.consent_name,
      // formData.consent_relationship,
      // formData.consent_signature,
      // formData.prepared_by,
    ];

    const allFieldsFilled = requiredFields.every(
      (field) => field !== "" && field !== null && field !== undefined
    );

    setrackStatus(allFieldsFilled ? "Completed" : "Pending");

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
        });
        return;
      }

      setIsActionEnabled(true);
      // const userId = selectedUser[0].user_id;

      // const statusResponse = await fetch(
      //   `https://gks-yjdc.onrender.com/api/pfa/user-assessment/${userId}`,
      //   {
      //     headers: {
      //       Authorization: `${token}`,
      //     },
      //   }
      // );

      // const userAssessmentData = await statusResponse.json();
      // const status =
      //   userAssessmentData?.assessments?.status === "Completed"
      //     ? "Completed"
      //     : "Pending";

      // setIsLoading(false);

      // Swal.fire({
      //   icon: "success",
      //   title: "Assessment Submitted",
      //   text: `Status: ${status}`,
      // }).then(() => {
      //   setModal(false);
      // });

      // console.log("Get data of PFA after submit by particular ID's ", userAssessmentData)

      // ✅ Inline fetch to update table data
      // const usersResponse = await fetch(
      //   "https://gks-yjdc.onrender.com/api/users",
      //   {
      //     method: "GET",
      //     headers: {
      //       "Content-Type": "application/json",
      //       Authorization: `${token}`,
      //     },
      //   }
      // );

      // if (!usersResponse.ok) {
      //   throw new Error("Failed to fetch users");
      // }

      // const usersData = await usersResponse.json();

      // const formatted = await Promise.all(
      //   usersData.map(async (user) => {
      //     try {
      //       const statusResponse = await fetch(
      //         `https://gks-yjdc.onrender.com/api/pfa/user-assessment/${user.user_id}`,
      //         {
      //           headers: {
      //             Authorization: `${token}`,
      //           },
      //         }
      //       );
      //       const assessmentData = await statusResponse.json();

      //       // Get latest assessment from assessments array
      //       const latest = assessmentData?.assessments?.sort(
      //         (a, b) => new Date(b.created_at) - new Date(a.created_at)
      //       )[0];
      
      //       const userStatus = latest?.status === "Completed" ? "Completed" : "Pending";

      //       return {
      //         id: user.user_id,
      //         name: user.name,
      //         status: userStatus,
      //       };
      //     } catch (err) {
      //       console.error(
      //         `Failed to fetch status for user ${user.user_id}`,
      //         err
      //       );
      //       return {
      //         id: user.user_id,
      //         name: user.name,
      //         status: "Unknown",
      //       };
      //     }
      //   })
      // );

      // setData(formatted);
      // setFilteredData(formatted);
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
      // First, get patientId using userId
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

      const patientId = data.assessment.patient_id;
      console.log("Fetched patientId:", patientId);

      // Now delete using patientId
      const delResponse = await fetch(
        `https://gks-yjdc.onrender.com/api/pfa/delete-assessment/${patientId}`,
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
  const handleFAEdit = async (userId = null) => {
    if (typeof userId === "object" && userId !== null) {
      userId = userId.id;
    }

    if (!userId) {
      console.error("Invalid userId provided to toggle");
      return;
    }
    setPFAEditModal(true);

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

      setSelectedUser(data.assessment);
      console.log("Selected User Assessment:", data.assessment);

      setPFAeditData({
        patientId: data.assessment.patient_id,
        dependent_to: data.assessment.dependent_to,
        substance_use_pattern: data.assessment.substance_use_pattern,
        last_30_days_quantity: data.assessment.last_30_days_quantity,

        medicalConfirmationData: data?.assessment?.medical_history || "",
        bloodConfirmationData:
          data?.assessment?.blood_transfusion_history || "",
        weight: data?.assessment?.weight || "",
        pulse_rate: data?.assessment?.pulse_rate || "",
        blood_pressure: data?.assessment?.blood_pressure || "",
        temperature: data?.assessment?.temperature || "",
        temperature: data?.assessment?.lymphadenopathy || "",

        medical_or_blood_history_details:
          data.assessment.medical_or_blood_history_details,
        complication_description: data.assessment.complication_description,
        neuro_description: data.assessment.neuro_description,
        other_findings: data.assessment.other_findings,
        consent_name: data.assessment.consent_name,
        consent_relationship: data.assessment.consent_relationship,
        consent_signature: data.assessment.consent_signature,
        prepared_by: data.assessment.prepared_by,

        // 👇 Preserve nested structure

        complications: {
          ulcer: data.assessment.ulcer,
          respiratory_problem: data.assessment.respiratory_problem,
          jaundice: data.assessment.jaundice,
          haematemesis: data.assessment.haematemesis,
          abdominal_complaints: data.assessment.abdominal_complaints,
          cardiovascular: data.assessment.cardiovascular,
        },

        neurological: {
          delirium: data.assessment.delirium,
          seizure: data.assessment.seizure,
          blackout: data.assessment.blackout,
          memory_loss: data.assessment.memory_loss,
          trembling: data.assessment.trembling,
          epilepsy: data.assessment.epilepsy,
          neuropathy: data.assessment.neuropathy,
        },
      });
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  //PFA update patient assessment handler
  const handleUpdateAssessment = async () => {
    setIsLoading(true); // Start loading
    const token = localStorage.getItem("Authorization");

    const payload = {
      dependent_to: PFAeditData.dependent_to,
      substance_use_pattern: PFAeditData.substance_use_pattern,
      last_30_days_quantity: PFAeditData.last_30_days_quantity,
      medical_history: PFAeditData.medical_history,
      blood_transfusion_history: PFAeditData.blood_transfusion_history,
      medical_or_blood_history_details:
        PFAeditData.medical_or_blood_history_details,

      weight: PFAeditData.weight,
      pulse_rate: PFAeditData.pulse_rate,
      blood_pressure: PFAeditData.blood_pressure,
      temperature: PFAeditData.temperature,
      temperature: PFAeditData.lymphadenopathy,

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
    };

    try {
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/pfa/update-assessment/${PFAeditData.patientId}`,
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
          title: "Update Failed",
          text: data.errors?.[0]?.message || "Unknown error occurred.",
        });
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Assessment Updated",
        text: "The assessment was updated successfully!",
      });

      setPFAEditModal(false);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while updating the assessment.",
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
            title={"User Assessment Details"}
            toggler={closeUserViewModal}
            maxWidth="800px"
          >
            <Col sm="12">
              <Card>
                <div className="table-responsive">
                  <Table size="sm" className="table-bordered">
                    <tbody>
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
                          <tr>
                            <th>User ID</th>
                            <td>{selectedUser.user_id}</td>
                          </tr>
                          <tr>
                            <th>Name</th>
                            <td>{selectedUser.name}</td>
                          </tr>
                          <tr>
                            <th>Date of Assessment</th>
                            <td>
                              {new Date(
                                selectedUser.date_of_assessment
                              ).toLocaleDateString()}
                            </td>
                          </tr>
                          <tr>
                            <th>Age</th>
                            <td>{selectedUser.age}</td>
                          </tr>
                          <tr>
                            <th>Dependent To</th>
                            <td>{selectedUser.dependent_to}</td>
                          </tr>
                          <tr>
                            <th>Substance Use Pattern</th>
                            <td>{selectedUser.substance_use_pattern}</td>
                          </tr>
                          <tr>
                            <th>Last 30 Days Quantity</th>
                            <td>{selectedUser.last_30_days_quantity}</td>
                          </tr>
                          <tr>
                            <th>Medical History</th>
                            <td>{selectedUser.medical_history}</td>
                          </tr>
                          <tr>
                            <th>Blood Transfusion History</th>
                            <td>{selectedUser.blood_transfusion_history}</td>
                          </tr>
                          <tr>
                            <th>Medical/Blood History Details</th>
                            <td>
                              {selectedUser.medical_or_blood_history_details}
                            </td>
                          </tr>
                          <tr>
                            <th>Ulcer</th>
                            <td>{selectedUser.ulcer}</td>
                          </tr>
                          <tr>
                            <th>Respiratory Problem</th>
                            <td>{selectedUser.respiratory_problem}</td>
                          </tr>
                          <tr>
                            <th>Jaundice</th>
                            <td>{selectedUser.jaundice}</td>
                          </tr>
                          <tr>
                            <th>Haematemesis</th>
                            <td>{selectedUser.haematemesis}</td>
                          </tr>
                          <tr>
                            <th>Abdominal Complaints</th>
                            <td>{selectedUser.abdominal_complaints}</td>
                          </tr>
                          <tr>
                            <th>Cardiovascular</th>
                            <td>{selectedUser.cardiovascular}</td>
                          </tr>
                          <tr>
                            <th>Complication Description</th>
                            <td>{selectedUser.complication_description}</td>
                          </tr>
                          <tr>
                            <th>Seizure</th>
                            <td>{selectedUser.seizure}</td>
                          </tr>
                          <tr>
                            <th>Epilepsy</th>
                            <td>{selectedUser.epilepsy}</td>
                          </tr>
                          <tr>
                            <th>Delirium</th>
                            <td>{selectedUser.delirium}</td>
                          </tr>
                          <tr>
                            <th>Trembling</th>
                            <td>{selectedUser.trembling}</td>
                          </tr>
                          <tr>
                            <th>Memory Loss</th>
                            <td>{selectedUser.memory_loss}</td>
                          </tr>
                          <tr>
                            <th>Neuropathy</th>
                            <td>{selectedUser.neuropathy}</td>
                          </tr>
                          <tr>
                            <th>Blackout</th>
                            <td>{selectedUser.blackout}</td>
                          </tr>
                          <tr>
                            <th>Neuro Description</th>
                            <td>{selectedUser.neuro_description}</td>
                          </tr>
                          <tr>
                            <th>Other Findings</th>
                            <td>{selectedUser.other_findings}</td>
                          </tr>
                          <tr>
                            <th>Consent</th>
                            <td>{selectedUser.consent}</td>
                          </tr>
                          <tr>
                            <th>Consent Name</th>
                            <td>{selectedUser.consent_name}</td>
                          </tr>
                          <tr>
                            <th>Consent Relationship</th>
                            <td>{selectedUser.consent_relationship}</td>
                          </tr>
                          <tr>
                            <th>Consent Signature</th>
                            <td>{selectedUser.consent_signature}</td>
                          </tr>
                          <tr>
                            <th>Prepared By</th>
                            <td>{selectedUser.prepared_by}</td>
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
              </Card>
            </Col>
          </CommonModal>

          {/* PFA Edit Modal */}
          <CommonModal
            isOpen={PFAEditModal}
            title={"Update Your PFA Data"}
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
                  {/* Dependent To */}
                  <div className="col-md-12">
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
                            name: "Weight",
                          },
                          {
                            id: "8",
                            question: PulseRate,
                            name: "PulseRate",
                          },
                          {
                            id: "9",
                            question: Bloodpressure,
                            name: "Bloodpressure",
                          },
                          {
                            id: "10",
                            question: Temperature,
                            name: "Temperature",
                          },
                        ].map(({ id, question, name }) => (
                          <tr key={id}>
                            <td>{id}</td>
                            <td>{question}</td>
                            <td>
                              <Input
                                type="text"
                                name={name}
                                value={PFAeditData[name] || ""}
                                onChange={(e) =>
                                  setPFAeditData({
                                    ...PFAeditData,
                                    [name]: e.target.value,
                                  })
                                }
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
                        "Update"
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
