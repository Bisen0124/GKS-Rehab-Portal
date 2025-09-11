import { React, useState, useEffect, Fragment, useRef } from "react";
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
import { consent, dateOfAssessment, prepared, signature } from "../../Constant";

const attitudeOptions = [
  "Cooperative / सहयोगी",
  "Confident / आत्मविश्वासी",
  "Interested / दिलचस्पी रखने वाला",
  "Attentive / चौकस",
  "Frank / स्पष्टवादी",
  "Playful / चंचल",
  "Ingratiating / कृपालु",
  "Suspicious / संदेह",
  "Seductive / मोहक",
  "Defensive / रक्षात्मक",
  "Secretive / गुप्त",
  "Uncooperative / असहयोगी",
  "Evasive / टालमटोल करने वाला",
  "Inhibited / संकोची",
  "Shy / शर्मीला",
  "Childish / बचकाना",
  "Guarded / सतर्क",
  "Attention-seeking / ध्यान आकर्षित करने वाला",
  "Exhibitionistic / प्रदर्शनकारी",
  "Hostile / शत्रुतापूर्ण",
];

const silentBehaviorOptions = [
  "Anger / क्रोध",
  "Perfectionism / पूर्णतावाद",
  "Dishonesty / बेईमानी",
  "Jealousy / ईर्ष्या",
  "Self-pity / आत्म-दया",
  "Self-justification / आत्म-औचित्य",
  "Codependence / सह-निर्भरता",
  "Resentment / नाराजगी",
  "Egotism / अहंकारवाद",
  "Defensiveness / रक्षात्मकता",
  "Impatience / अधीरता",
  "Fear / डर",
  "Selfishness / स्वार्थ",
  "Close mindedness / संकीर्ण मानसिकता",
  "Blaming / दोष लगाना",
  "Denial / अस्वीकार",
];

const questions = [
  {
    en: "Do ever use Substance alone?",
    hi: "क्या अकेले मादक पदार्थ उपयोग करते हैं?",
  },
  {
    en: "Moody personality?",
    hi: "मिज़ाजी स्वभाव?",
  },
  {
    en: "Always worried?",
    hi: "हमेशा चिंतित रहते हैं?",
  },
  {
    en: "Always Sad?",
    hi: "हमेशा उदास रहते हैं?",
  },
  {
    en: "Lack of confidence?",
    hi: "आत्मविश्वास की कमी?",
  },
  {
    en: "Stubborn nature?",
    hi: "हठी स्वभाव?",
  },
  {
    en: "Instant and too much aggressive?",
    hi: "तुरंत और अधिक आक्रामक?",
  },
  {
    en: "Uses Slang language? (Bad words)",
    hi: "गाली गलौज करता है?",
  },
  {
    en: "Disrespects parents?",
    hi: "माता-पिता का अनादर करता है?",
  },
  {
    en: "Vandalizes the house?",
    hi: "घर का नुकसान करता है?",
  },
  {
    en: "Does fight at home? (with mother, wife, children, brother, sister)",
    hi: "घर पर झगड़ा करता है? (माता, पत्नी, बच्चे, भाई, बहन के साथ)",
  },
  // Add more if needed
];

function PatientBehavior() {
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
          const recentPBDate = user.recent_intake_patient_behavior_date
            ? new Date(user.recent_intake_patient_behavior_date)
            : null;

          let userStatus = (
            <p className="badge bg-warning text-dark p-2">{"Pending"}</p>
          );
          if (admitDate && recentPBDate && admitDate > recentPBDate) {
            userStatus = <p className="badge bg-success p-2">{"Completed"}</p>;
          }

          const dischargeStatus = user.discharge_status_text || "Unknown";

          return {
            id: user.user_id,
            gks_id: user.gks_id || "N/A",
            name: user.name,
            recentPBIds: user.recent_intake_patient_behavior_id,
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
                onClick={() => handlePatientBehaviourPreFill(row.recent_intake_patient_behavior_id)}
                style={{ cursor: "pointer" }}
                title="Readmission FDA Form"
              >
                ✏️
              </span>
            )}

{/* <span
                onClick={() => handlePatientBehaviourPreFill(row.recentPBIds)}
                style={{ cursor: "pointer" }}
                title="Readmission FDA Form"
              >
                ✏️
              </span> */}

            {/* Show Create PFA if not discharged and not readmission */}
            {row.dischargeStatus === 0 && row.isReadmission === 0 && (
              <span
                onClick={() => createPatientBehaviour(row.id)}
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
      `https://gks-yjdc.onrender.com/api/intake-patient-behavior/all-entries?branch_id=${selectedBranch}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      }
    )
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch IPB entries list");
        return response.json();
      })
      .then((res) => {
        const ipbEntries = res.data || [];
  
        const formattedPatients = ipbEntries.map((item) => ({
          // top level
          ipb_id: item.ipb_id,
          status: item.status,
  
          // user details
          user_id: item.user_id || null,
          name: item.name || "",
          phone: item.phone || "",
          email: item.email || "",
          gks_id: item.gks_id || "",
          dob: item.dob || null,
          gender: item.gender || "",
  
          // branch & ward
          branch_name: item.branch_name || "",
          ward_name: item.ward_name || "",
          custom_code: item.custom_code || "",
  
          // entry details
          entry_id: item.entry_id || null,
          visit_no: item.visit_no || null,
          admit_date: item.admit_date || null,
  
          // assessment details
          date_of_assessment: item.date_of_assessment || null,
          most_important_thing_life: item.most_important_thing_life || "",
          life_aim: item.life_aim || "",
  
          // consent & footer
          consent: item.consent || "No",
          prepared_by: item.prepared_by || "",
          substance_dependent_think: item.substance_dependent_think || "No",
  
          // audit
          created_at: item.created_at || null,
          updated_at: item.updated_at || null,
        }));
  
        console.log("Formatted IPB Patients:", formattedPatients);
  
        setTimeout(() => {
          setfdaData(formattedPatients);
          setFilteredDataone(formattedPatients);
          setstillLoading(false);
        }, 500);
      })
      .catch((error) => {
        console.error("Error fetching IPB entries:", error);
        setstillLoading(true);
      });
  }, [selectedBranch]);
  

  const tableColumnsFDAList = [
    {
      name: "PB ID",
      selector: (row) => row.ipb_id,
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
          <p className="badge bg-success p-2">PB {row.status}</p>
        </span>
      ),
    },
    {
      name: "Action",
      center: true,
      cell: (row) => (
        <div className="d-flex gap-2">
          <span
            onClick={() => viewPBFormData(row.ipb_id)}
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
            onClick={() => handlePBIndividualEdit(row.ipb_id)}
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

  const handleMentalStageChange = (stage) => {
    setFormData((prevState) => {
      const isSelected = prevState.mentalStage.includes(stage);
      const updated = isSelected
        ? prevState.mentalStage.filter((item) => item !== stage)
        : [...prevState.mentalStage, stage];

      return { ...prevState, mentalStage: updated };
    });
  };

  const [formData, setFormData] = useState({
    dateOfAssessment: new Date(),
    lifeAim: "",
    mostImportantThingLife:"",
    mentalStatus: "",
    dischargePlan: "",
    familyExpectations: "",
    attitude: [],
    silentBehaviors: [],
    mentalStage: [], // ✅ Add mentalStage here
    questions: {},
    consent: "Yes",
    prepared_by: "",
    signature: "",
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (field, option) => {
    setFormData((prevState) => {
      const selected = prevState[field];
      const isSelected = selected.includes(option);
      const updated = isSelected
        ? selected.filter((item) => item !== option)
        : [...selected, option];
      return { ...prevState, [field]: updated };
    });
  };

  // ✅ Handle Yes/No selection
  const handleQuestionChange = (qIndex, value) => {
    setFormData((prevState) => ({
      ...prevState,
      questions: { ...prevState.questions, [qIndex]: value },
    }));
  };

  const handleAssesmentDateChange = (name, date) => {
    setFormData((prev) => ({
      ...prev,
      [name]: date,
    }));
  };

  //Create Patient form function start
  const [isPatientBehaviourModalOpen, setIsPatientBehaviourModalOpen] =
    useState(false);
  const createPatientBehaviour = async (userId = null) => {
    setIsPatientBehaviourModalOpen(true);
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
  //Create Patient from function end

  //Loading spinner
  //spinner extract from other file
    const selectedSpinner = Data.find(
      (item) => item.spinnerClass === "loader-37"
    );
  const [isLoading, setIsLoading] = useState(false);
// ✅ Submit patient behaviour form handler

// ✅ Normalize function for DB format
const normalizeValue = (item) => {
  return item
    .split("/")[0]        // take English part
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_"); // replace spaces or hyphens with underscore
};

const handlePBFormSubmit = async (e) => {
  e.preventDefault();
  console.log("Form Data:", formData);

  // 🛠️ Construct payload in correct format (matching API structure)
  const payload = {
    user_id: selectedUser?.user_id,
    date_of_assessment: formData.dateOfAssessment
      ?.toISOString()
      .split("T")[0] || "", // "YYYY-MM-DD"
  
    // ✅ Map fields properly
    most_important_thing_life: formData.mostImportantThingLife || "",
    life_aim: formData.lifeAim || "",
    current_mental_status_center: formData.mentalStatus || "",
    planned_after_discharge: formData.dischargePlan || "",
    family_expectations_after_discharge: formData.familyExpectations || "",
  
    attitude_during_interview: (formData.attitude || []).map(normalizeValue),
    silent_behavior_observations: (formData.silentBehaviors || []).map(normalizeValue),
    patient_mental_stage: (formData.mentalStage || []).map(normalizeValue),
  
    // ✅ Questions → Yes/No mapping
    uses_alone: formData.questions[1] || "No",
    moody: formData.questions[2] || "No",
    always_worried: formData.questions[3] || "No",
    always_sad: formData.questions[4] || "No",
    lack_of_confidence: formData.questions[5] || "No",
    stubborn_nature: formData.questions[6] || "No",
    instant_aggressive: formData.questions[7] || "No",
    uses_slang_language: formData.questions[8] || "No",
    disrespects_parents: formData.questions[9] || "No",
    vandalizes_house: formData.questions[10] || "No",
    fights_at_home: formData.questions[11] || "No",
    tells_lies: formData.questions[12] || "No",
    too_expensive: formData.questions[13] || "No",
    steals_theft: formData.questions[14] || "No",
    borrows_money: formData.questions[15] || "No",
    gambles_speculates: formData.questions[16] || "No",
    bluffs_people: formData.questions[17] || "No",
    admits_mistakes: formData.questions[18] || "No",
    sense_of_responsibility: formData.questions[19] || "No",
    compassion_sympathy: formData.questions[20] || "No",
    lazy_careless: formData.questions[21] || "No",
    negative_thoughts_others: formData.questions[22] || "No",
    criminal_nature: formData.questions[23] || "No",
    substance_affected_sexual_relation: formData.questions[24] || "No",
    nervous_anxiety_without_substance: formData.questions[25] || "No",
    concentrate_work_after_substance: formData.questions[26] || "No",
    better_feelings_after_substance: formData.questions[27] || "No",
    financial_responsibility_ahead: formData.questions[28] || "No",
    guilty_ashamed_substance_abuse: formData.questions[29] || "No",
    avoid_people_places: formData.questions[30] || "No",
    substance_making_life_sad: formData.questions[31] || "No",
    sleeping_eating_problems: formData.questions[32] || "No",
    stop_control_substance_abuse: formData.questions[33] || "No",
    bad_result_abuse_substance: formData.questions[34] || "No",
    talked_tried_suicide: formData.questions[35] || "No",
    substance_dependent_think: formData.questions[36] || "No",
  
    // ✅ Footer fields
    consent: formData.consent || "No",
    prepared_by: formData.prepared_by || "",
    signature: formData.signature || "",
  };
  

  console.log("📦 Final Payload:", payload);

  try {
    const token = localStorage.getItem("Authorization");
    const branch_id = selectedBranch;

    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/intake-patient-behavior/create-assessment?branch_id=${branch_id}`,
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
    }).then(() => setIsPatientBehaviourModalOpen(false));

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
  //Submit patient behaviour handler end


// ✅ View Patient Behaviour (PB) handler start
const [viewPBData, setViewPBData] = useState(null);
const [viewPBModal, setViewPBModal] = useState(false);

const viewPBFormData = async (pbID) => {
  setViewPBModal(true);
  console.log("PB ID =>", pbID);

  if (typeof pbID === "object" && pbID !== null) {
    pbID = pbID.intake_pb_id; // ✅ correct field for patient behaviour
  }

  if (!pbID) {
    console.error("Invalid PB ID provided");
    return;
  }

  setIsLoading(true);
  const token = localStorage.getItem("Authorization");

  try {
    const branch_id = selectedBranch;
    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/intake-patient-behavior/assessment/${pbID}?branch_id=${branch_id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      }
    );

    const data = await response.json();
    console.log("Raw API Response:", data); // ✅ always log full response

    if (!response.ok) {
      console.error("Fetch error:", data);
      return;
    }

    // ✅ fix: pick from data.data
    const viewPBEntry = data.data || null;
    console.log("Extracted PB Data Entry:", viewPBEntry); // ✅ should show full PB object

    if (!viewPBEntry) {
      console.warn("No PB assessment data found.");
      return;
    }

    setViewPBData(viewPBEntry);
    console.log("PB Data Fetched ID:", viewPBEntry.intake_pb_id);
  } catch (error) {
    console.error("Fetch error:", error);
  } finally {
    setIsLoading(false);
  }
};
// ✅ View PB handler end

// ✅ Edit Patient Behavior form data handler start
const questions = [
  { key: "uses_alone", en: "Do you use substance alone?", hi: "क्या आप अकेले मादक पदार्थ का सेवन करते हैं?" },
  { key: "moody", en: "Moody personality?", hi: "क्या आप मिज़ाजी स्वभाव के हैं?" },
  { key: "always_worried", en: "Always worried?", hi: "क्या आप हमेशा चिंतित रहते हैं?" },
  { key: "always_sad", en: "Always sad?", hi: "क्या आप हमेशा उदास रहते हैं?" },
  { key: "lack_of_confidence", en: "Lack of confidence?", hi: "क्या आत्मविश्वास की कमी है?" },
  { key: "stubborn_nature", en: "Stubborn nature?", hi: "क्या जिद्दी स्वभाव है?" },
  { key: "aggressive", en: "Instant and too much aggressive?", hi: "क्या आप तुरंत और अत्यधिक आक्रामक हो जाते हैं?" },
  { key: "slang_language", en: "Uses slang language? (Bad words)", hi: "क्या आप गाली-गलौज करते हैं?" },
  { key: "disrespects_parents", en: "Disrespects parents?", hi: "क्या आप माता-पिता का अनादर करते हैं?" },
  { key: "vandalizes_house", en: "Vandalizes the house?", hi: "क्या आप घर का नुकसान करते हैं?" },
  { key: "fights_at_home", en: "Does fight at home? (with mother, wife, children, brother, sister)", hi: "क्या आप घर पर झगड़ा करते हैं? (माता, पत्नी, बच्चे, भाई, बहन के साथ)" }
];

const [PBEditData, setPBEditData] = useState(null);
const [PBEditModal, setPBEditModal] = useState(false);

const handlePBIndividualEdit = async (editPBID = null) => {
  setPBEditModal(true);

  if (typeof editPBID === "object" && editPBID !== null) {
    editPBID = editPBID.ipb_id; // ✅ patient behavior id
  }

  if (!editPBID) {
    console.error("Invalid editPBID provided");
    return;
  }

  console.log("PB ID For Edit:", editPBID);
  const token = localStorage.getItem("Authorization");

  try {
    const branch_id = selectedBranch;
    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/intake-patient-behavior/assessment/${editPBID}?branch_id=${branch_id}`,
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
      console.warn("No assessment found for this PB ID.");
      return;
    }

    setSelectedUser(latestAssessment);
    console.log("Selected PB Assessment for edit:", latestAssessment);

    // ✅ Map payload into your PB form structure
    setPBEditData({
      ipb_id: latestAssessment.ipb_id,
      user_id: latestAssessment.user_id,
      entry_id: latestAssessment.entry_id,
      branch_id: latestAssessment.branch_id,
      visit_no: latestAssessment.visit_no,

      date_of_assessment: latestAssessment.date_of_assessment
        ? parseDateString(latestAssessment.date_of_assessment)
        : "",

      most_important_thing_life: latestAssessment.most_important_thing_life,
      life_aim: latestAssessment.life_aim,
      current_mental_status_center: latestAssessment.current_mental_status_center,
      planned_after_discharge: latestAssessment.planned_after_discharge,
      family_expectations_after_discharge: latestAssessment.family_expectations_after_discharge,

      attitude_during_interview: latestAssessment.attitude_during_interview || [],
      silent_behavior_observations: latestAssessment.silent_behavior_observations || [],
      patient_mental_stage: latestAssessment.patient_mental_stage || [],

      uses_alone: latestAssessment.uses_alone,
      moody: latestAssessment.moody,
      always_worried: latestAssessment.always_worried,
      always_sad: latestAssessment.always_sad,
      lack_of_confidence: latestAssessment.lack_of_confidence,
      stubborn_nature: latestAssessment.stubborn_nature,
      instant_aggressive: latestAssessment.instant_aggressive,
      uses_slang_language: latestAssessment.uses_slang_language,
      disrespects_parents: latestAssessment.disrespects_parents,
      vandalizes_house: latestAssessment.vandalizes_house,
      fights_at_home: latestAssessment.fights_at_home,
      tells_lies: latestAssessment.tells_lies,
      too_expensive: latestAssessment.too_expensive,
      steals_theft: latestAssessment.steals_theft,
      borrows_money: latestAssessment.borrows_money,
      gambles_speculates: latestAssessment.gambles_speculates,
      bluffs_people: latestAssessment.bluffs_people,
      admits_mistakes: latestAssessment.admits_mistakes,
      sense_of_responsibility: latestAssessment.sense_of_responsibility,
      compassion_sympathy: latestAssessment.compassion_sympathy,
      lazy_careless: latestAssessment.lazy_careless,
      negative_thoughts_others: latestAssessment.negative_thoughts_others,
      criminal_nature: latestAssessment.criminal_nature,
      substance_affected_sexual_relation: latestAssessment.substance_affected_sexual_relation,
      nervous_anxiety_without_substance: latestAssessment.nervous_anxiety_without_substance,
      concentrate_work_after_substance: latestAssessment.concentrate_work_after_substance,
      better_feelings_after_substance: latestAssessment.better_feelings_after_substance,
      financial_responsibility_ahead: latestAssessment.financial_responsibility_ahead,
      guilty_ashamed_substance_abuse: latestAssessment.guilty_ashamed_substance_abuse,
      avoid_people_places: latestAssessment.avoid_people_places,
      substance_making_life_sad: latestAssessment.substance_making_life_sad,
      sleeping_eating_problems: latestAssessment.sleeping_eating_problems,
      stop_control_substance_abuse: latestAssessment.stop_control_substance_abuse,
      bad_result_abuse_substance: latestAssessment.bad_result_abuse_substance,
      talked_tried_suicide: latestAssessment.talked_tried_suicide,
      substance_dependent_think: latestAssessment.substance_dependent_think,

      consent: latestAssessment.consent,
      prepared_by: latestAssessment.prepared_by,
      signature: latestAssessment.signature,

      status: latestAssessment.status,
      isActive: latestAssessment.isActive,
      created_by: latestAssessment.created_by,
      updated_by: latestAssessment.updated_by,
      created_at: latestAssessment.created_at,
      updated_at: latestAssessment.updated_at,

      // User details
      name: latestAssessment.name,
      relative_name: latestAssessment.relative_name,
      gender: latestAssessment.gender,
      phone: latestAssessment.phone,
      email: latestAssessment.email,
      dob: latestAssessment.dob,
      custom_code: latestAssessment.custom_code,
      discharge_status: latestAssessment.discharge_status,
      address: latestAssessment.address,
      ward_name: latestAssessment.ward_name,
    });

    console.log("Mapped PB Edit Data:", latestAssessment);
  } catch (error) {
    console.error("Fetch error:", error);
  }
};

// ✅ Edit Patient Behavior form data handler end


// ✅ Update PB Assessment Handler start
const handlePBUpdate = async () => {
  if (!PBEditData?.ipb_id) {
    console.error("PB ID is not available yet.");
    return;
  }

  console.log("PB ID for update:", PBEditData.ipb_id);
  setIsLoading(true);

  // ✅ Build payload directly from PBEditData (not questions[])
  const payload = {
    user_id: selectedUser?.user_id,
    date_of_assessment: PBEditData?.date_of_assessment
      ? new Date(PBEditData.date_of_assessment).toISOString().split("T")[0]
      : "",

    // ✅ Map fields properly
    most_important_thing_life: PBEditData?.most_important_thing_life || "",
    life_aim: PBEditData?.life_aim || "",
    current_mental_status_center: PBEditData?.current_mental_status_center || "",
    planned_after_discharge: PBEditData?.planned_after_discharge || "",
    family_expectations_after_discharge:
      PBEditData?.family_expectations_after_discharge || "",

    attitude_during_interview: (PBEditData?.attitude_during_interview || []).map(normalizeValue),
    silent_behavior_observations: (PBEditData?.silent_behavior_observations || []).map(normalizeValue),
    patient_mental_stage: (PBEditData?.patient_mental_stage || []).map(normalizeValue),

    // ✅ Questions (flat keys)
    uses_alone: PBEditData?.uses_alone || "No",
    moody: PBEditData?.moody || "No",
    always_worried: PBEditData?.always_worried || "No",
    always_sad: PBEditData?.always_sad || "No",
    lack_of_confidence: PBEditData?.lack_of_confidence || "No",
    stubborn_nature: PBEditData?.stubborn_nature || "No",
    instant_aggressive: PBEditData?.instant_aggressive || "No",
    uses_slang_language: PBEditData?.uses_slang_language || "No",
    disrespects_parents: PBEditData?.disrespects_parents || "No",
    vandalizes_house: PBEditData?.vandalizes_house || "No",
    fights_at_home: PBEditData?.fights_at_home || "No",
    tells_lies: PBEditData?.tells_lies || "No",
    too_expensive: PBEditData?.too_expensive || "No",
    steals_theft: PBEditData?.steals_theft || "No",
    borrows_money: PBEditData?.borrows_money || "No",
    gambles_speculates: PBEditData?.gambles_speculates || "No",
    bluffs_people: PBEditData?.bluffs_people || "No",
    admits_mistakes: PBEditData?.admits_mistakes || "No",
    sense_of_responsibility: PBEditData?.sense_of_responsibility || "No",
    compassion_sympathy: PBEditData?.compassion_sympathy || "No",
    lazy_careless: PBEditData?.lazy_careless || "No",
    negative_thoughts_others: PBEditData?.negative_thoughts_others || "No",
    criminal_nature: PBEditData?.criminal_nature || "No",
    substance_affected_sexual_relation: PBEditData?.substance_affected_sexual_relation || "No",
    nervous_anxiety_without_substance: PBEditData?.nervous_anxiety_without_substance || "No",
    concentrate_work_after_substance: PBEditData?.concentrate_work_after_substance || "No",
    better_feelings_after_substance: PBEditData?.better_feelings_after_substance || "No",
    financial_responsibility_ahead: PBEditData?.financial_responsibility_ahead || "No",
    guilty_ashamed_substance_abuse: PBEditData?.guilty_ashamed_substance_abuse || "No",
    avoid_people_places: PBEditData?.avoid_people_places || "No",
    substance_making_life_sad: PBEditData?.substance_making_life_sad || "No",
    sleeping_eating_problems: PBEditData?.sleeping_eating_problems || "No",
    stop_control_substance_abuse: PBEditData?.stop_control_substance_abuse || "No",
    bad_result_abuse_substance: PBEditData?.bad_result_abuse_substance || "No",
    talked_tried_suicide: PBEditData?.talked_tried_suicide || "No",
    substance_dependent_think: PBEditData?.substance_dependent_think || "No",

    // ✅ Footer fields
    consent: PBEditData?.consent || "No",
    prepared_by: PBEditData?.prepared_by || "",
    signature: PBEditData?.signature || "",
  };

  try {
    const branch_id = selectedBranch; // from BranchContext
    const token = localStorage.getItem("Authorization");

    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/intake-patient-behavior/update-assessment/${PBEditData.ipb_id}?branch_id=${branch_id}`,
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
    console.log("✅ PB Update Response:", data);
    console.log("📦 PB Update Payload Sent:", payload);

    setIsLoading(false);

    Swal.fire({
      icon: "success",
      title: "PB Update Successfully!",
      text: "Patient Behavior assessment has been updated successfully!",
    }).then(() => {
      setPBEditModal(false); // ✅ Close modal after success
    });
  } catch (err) {
    console.error("❌ PB Update Error:", err);
    setIsLoading(false);

    Swal.fire({
      icon: "error",
      title: "Unexpected Error",
      text: "Failed to update Patient Behavior assessment. Check console for details.",
    });
  }
};
// ✅ Update PB Assessment Handler end


// Prefill patient behaviour form handler start
const [PBPrefillData, setPBPrefillData] = useState({});
const [PBPrefillModal, setPBPrefillModal] = useState(false);

const handlePatientBehaviourPreFill = async (prefillPBID = null) => {
  // Normalize ID if object
  if (typeof prefillPBID === "object" && prefillPBID !== null) {
    prefillPBID = prefillPBID.ipb_id || prefillPBID.entry_id;
  }

  if (!prefillPBID) {
    Swal.fire({
      icon: "warning",
      title: "Missing Patient Behavior ID",
      text: "No valid Patient Behavior ID was provided for prefill.",
    });
    return;
  }

  console.log("Patient Behavior ID For Prefill:", prefillPBID);
  const token = localStorage.getItem("Authorization");

  try {
    const branch_id = selectedBranch;
    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/intake-patient-behavior/assessment/${prefillPBID}?branch_id=${branch_id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      }
    );

    const data = await response.json();
    console.log("Raw Patient Behavior API Response:", data);

    if (!response.ok) {
      Swal.fire({
        icon: "error",
        title: "Fetch Failed",
        text:
          data.message ||
          "Unable to fetch Patient Behavior data for prefill.",
      });
      return;
    }

    const latestAssessment = data.data || null;
    if (!latestAssessment) {
      Swal.fire({
        icon: "info",
        title: "No Data Found",
        text: "No Patient Behavior data available for this ID.",
      });
      return;
    }

    // ✅ Open modal only when we have valid data
    setPBPrefillModal(true);

    // ✅ Wrap in array so PatientCommonInfo works
    setSelectedUser([latestAssessment]);

    // ✅ Build mapped data for Patient Behavior
    const mappedData = {
      ipb_id: latestAssessment.ipb_id,
      user_id: latestAssessment.user_id,
      entry_id: latestAssessment.entry_id,
      branch_id: latestAssessment.branch_id,
      visit_no: latestAssessment.visit_no,

      date_of_assessment: latestAssessment.date_of_assessment
        ? new Date(latestAssessment.date_of_assessment)
        : null,

      most_important_thing_life:
        latestAssessment.most_important_thing_life || "",
      life_aim: latestAssessment.life_aim || "",
      current_mental_status_center:
        latestAssessment.current_mental_status_center || "",
      planned_after_discharge:
        latestAssessment.planned_after_discharge || "",
      family_expectations_after_discharge:
        latestAssessment.family_expectations_after_discharge || "",

      // Arrays
      attitude_during_interview:
        latestAssessment.attitude_during_interview || [],
      silent_behavior_observations:
        latestAssessment.silent_behavior_observations || [],
      patient_mental_stage: latestAssessment.patient_mental_stage || [],

      // Yes/No values
      uses_alone: latestAssessment.uses_alone || "No",
      moody: latestAssessment.moody || "No",
      always_worried: latestAssessment.always_worried || "No",
      always_sad: latestAssessment.always_sad || "No",
      lack_of_confidence: latestAssessment.lack_of_confidence || "No",
      stubborn_nature: latestAssessment.stubborn_nature || "No",
      instant_aggressive: latestAssessment.instant_aggressive || "No",
      uses_slang_language: latestAssessment.uses_slang_language || "No",
      disrespects_parents: latestAssessment.disrespects_parents || "No",
      vandalizes_house: latestAssessment.vandalizes_house || "No",
      fights_at_home: latestAssessment.fights_at_home || "No",
      tells_lies: latestAssessment.tells_lies || "No",
      too_expensive: latestAssessment.too_expensive || "No",
      steals_theft: latestAssessment.steals_theft || "No",
      borrows_money: latestAssessment.borrows_money || "No",
      gambles_speculates: latestAssessment.gambles_speculates || "No",
      bluffs_people: latestAssessment.bluffs_people || "No",
      admits_mistakes: latestAssessment.admits_mistakes || "No",
      sense_of_responsibility: latestAssessment.sense_of_responsibility || "No",
      compassion_sympathy: latestAssessment.compassion_sympathy || "No",
      lazy_careless: latestAssessment.lazy_careless || "No",
      negative_thoughts_others: latestAssessment.negative_thoughts_others || "No",
      criminal_nature: latestAssessment.criminal_nature || "No",
      substance_affected_sexual_relation:
        latestAssessment.substance_affected_sexual_relation || "No",
      nervous_anxiety_without_substance:
        latestAssessment.nervous_anxiety_without_substance || "No",
      concentrate_work_after_substance:
        latestAssessment.concentrate_work_after_substance || "No",
      better_feelings_after_substance:
        latestAssessment.better_feelings_after_substance || "No",
      financial_responsibility_ahead:
        latestAssessment.financial_responsibility_ahead || "No",
      guilty_ashamed_substance_abuse:
        latestAssessment.guilty_ashamed_substance_abuse || "No",
      avoid_people_places: latestAssessment.avoid_people_places || "No",
      substance_making_life_sad:
        latestAssessment.substance_making_life_sad || "No",
      sleeping_eating_problems:
        latestAssessment.sleeping_eating_problems || "No",
      stop_control_substance_abuse:
        latestAssessment.stop_control_substance_abuse || "No",
      bad_result_abuse_substance:
        latestAssessment.bad_result_abuse_substance || "No",
      talked_tried_suicide: latestAssessment.talked_tried_suicide || "No",
      substance_dependent_think:
        latestAssessment.substance_dependent_think || "No",

      consent: latestAssessment.consent || "No",
      prepared_by: latestAssessment.prepared_by || "",
      signature: latestAssessment.signature || "",

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

    setPBPrefillData(mappedData);

    console.log("Mapped Patient Behavior Prefill Data:", mappedData);
  } catch (error) {
    console.error("Prefill fetch error:", error);
    Swal.fire({
      icon: "error",
      title: "Network Error",
      text: "Unable to fetch Patient Behavior data due to a network issue.",
    });
  }
};
// Prefill patient behaviour form handler end



// Patient behaviour readmission form handler start

const handlePBReadmissionFormSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true); // Start loader
  console.log("Form Data:", PBPrefillData);

  // 🛠️ Construct payload in correct format (matching API structure)
  const payload = {
    user_id: PBPrefillData?.user_id,
    date_of_assessment: PBPrefillData?.date_of_assessment
      ? new Date(PBPrefillData.date_of_assessment).toISOString().split("T")[0]
      : "", // "YYYY-MM-DD"

    // ✅ Map fields from PBPrefillData
    most_important_thing_life: PBPrefillData?.most_important_thing_life || "",
    life_aim: PBPrefillData?.life_aim || "",
    current_mental_status_center: PBPrefillData?.current_mental_status_center || "",
    planned_after_discharge: PBPrefillData?.planned_after_discharge || "",
    family_expectations_after_discharge: PBPrefillData?.family_expectations_after_discharge || "",

    attitude_during_interview: (PBPrefillData?.attitude_during_interview || []).map(normalizeValue),
    silent_behavior_observations: (PBPrefillData?.silent_behavior_observations || []).map(normalizeValue),
    patient_mental_stage: (PBPrefillData?.patient_mental_stage || []).map(normalizeValue),

    // ✅ Questions → Yes/No mapping
    uses_alone: PBPrefillData?.uses_alone || "No",
    moody: PBPrefillData?.moody || "No",
    always_worried: PBPrefillData?.always_worried || "No",
    always_sad: PBPrefillData?.always_sad || "No",
    lack_of_confidence: PBPrefillData?.lack_of_confidence || "No",
    stubborn_nature: PBPrefillData?.stubborn_nature || "No",
    instant_aggressive: PBPrefillData?.instant_aggressive || "No",
    uses_slang_language: PBPrefillData?.uses_slang_language || "No",
    disrespects_parents: PBPrefillData?.disrespects_parents || "No",
    vandalizes_house: PBPrefillData?.vandalizes_house || "No",
    fights_at_home: PBPrefillData?.fights_at_home || "No",
    tells_lies: PBPrefillData?.tells_lies || "No",
    too_expensive: PBPrefillData?.too_expensive || "No",
    steals_theft: PBPrefillData?.steals_theft || "No",
    borrows_money: PBPrefillData?.borrows_money || "No",
    gambles_speculates: PBPrefillData?.gambles_speculates || "No",
    bluffs_people: PBPrefillData?.bluffs_people || "No",
    admits_mistakes: PBPrefillData?.admits_mistakes || "No",
    sense_of_responsibility: PBPrefillData?.sense_of_responsibility || "No",
    compassion_sympathy: PBPrefillData?.compassion_sympathy || "No",
    lazy_careless: PBPrefillData?.lazy_careless || "No",
    negative_thoughts_others: PBPrefillData?.negative_thoughts_others || "No",
    criminal_nature: PBPrefillData?.criminal_nature || "No",
    substance_affected_sexual_relation: PBPrefillData?.substance_affected_sexual_relation || "No",
    nervous_anxiety_without_substance: PBPrefillData?.nervous_anxiety_without_substance || "No",
    concentrate_work_after_substance: PBPrefillData?.concentrate_work_after_substance || "No",
    better_feelings_after_substance: PBPrefillData?.better_feelings_after_substance || "No",
    financial_responsibility_ahead: PBPrefillData?.financial_responsibility_ahead || "No",
    guilty_ashamed_substance_abuse: PBPrefillData?.guilty_ashamed_substance_abuse || "No",
    avoid_people_places: PBPrefillData?.avoid_people_places || "No",
    substance_making_life_sad: PBPrefillData?.substance_making_life_sad || "No",
    sleeping_eating_problems: PBPrefillData?.sleeping_eating_problems || "No",
    stop_control_substance_abuse: PBPrefillData?.stop_control_substance_abuse || "No",
    bad_result_abuse_substance: PBPrefillData?.bad_result_abuse_substance || "No",
    talked_tried_suicide: PBPrefillData?.talked_tried_suicide || "No",
    substance_dependent_think: PBPrefillData?.substance_dependent_think || "No",

    // ✅ Footer fields
    consent: PBPrefillData?.consent || "No",
    prepared_by: PBPrefillData?.prepared_by || "",
    signature: PBPrefillData?.signature || "",
  };

  console.log("📦 Final Payload:", payload);

  try {
    const token = localStorage.getItem("Authorization");
    const branch_id = selectedBranch;

    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/intake-patient-behavior/create-assessment?branch_id=${branch_id}`,
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
      title: "Readmission Form Created Successfully",
      text: "The patient readmission behavior assessment was submitted successfully.",
    }).then(() => setIsPatientBehaviourModalOpen(false));

    console.log("✅ Readmission Data:", data);
  } catch (err) {
    console.error("❌ Readmission Submit Error:", err);
    setIsLoading(false);

    Swal.fire({
      icon: "error",
      title: "Unexpected Error",
      text: "Failed to submit Readmission Form. Check console for error.",
    });
  }
};

// Patient behaviour readmission form handler end



  //Close all modal handler
  const closeAllmodal = () => {
    setIsPatientBehaviourModalOpen(false);
    setViewPBModal(false);
    setPBEditModal(false);
    setPBPrefillModal(false);
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
        filename: `user_data_${viewPBData?.name}_${viewPBData?.user_id}.pdf`,
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

    //🔧 Convert DD/MM/YYYY to Date Object:
  const parseDateString = (dateStr) => {
    if (!dateStr) return null;

    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
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

      {/* Patient behaviour create form start */}
      <CommonModal
        isOpen={isPatientBehaviourModalOpen}
        title="Create Patient behavior  / रोगी का व्यवहार"
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
          <form className="container mt-4 mb-5" onSubmit={handlePBFormSubmit}>
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

            <div className="row align-items-baseline">
            <div class="col-md-6">
                <div className="mb-3">
                  <label htmlFor="mostImportantThingLife" className="form-label">
                  What is the most important thing in life? / जीवन में सबसे महत्वपूर्ण चीज़ क्या है?
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="mostImportantThingLife"
                    name="mostImportantThingLife"
                    value={formData.mostImportantThingLife}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div class="col-md-6">
                <div className="mb-3">
                  <label htmlFor="lifeAim" className="form-label">
                  Life's Aim / जिंदगी का लक्ष्य 
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="lifeAim"
                    name="lifeAim"
                    value={formData.lifeAim}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div class="col-md-6">
                <div className="mb-3">
                  <label htmlFor="mentalStatus" className="form-label">
                    Current Mental Status here in center (वर्तमान मानसिक स्थिति
                    यहाँ केंद्र में)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="mentalStatus"
                    name="mentalStatus"
                    value={formData.mentalStatus}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="dischargePlan" className="form-label">
                    What is planned after discharge from center (डिस्चार्ज के
                    बाद क्या सोचता है?)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="dischargePlan"
                    name="dischargePlan"
                    value={formData.dischargePlan}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <div className="mb-4">
                  <label htmlFor="familyExpectations" className="form-label">
                    What Expectations do you have for family after discharge?
                    (छुट्टी के बाद परिवार से आपकी क्या उम्मीदें हैं?)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="familyExpectations"
                    name="familyExpectations"
                    value={formData.familyExpectations}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <fieldset className="mb-4 border rounded p-3">
              <legend className="fs-5 fw-bold">
                ATTITUDE DURING INTERVIEW / साक्षात्कार के दौरान रवैया
              </legend>
              <div className="row">
                {attitudeOptions.map((option, idx) => (
                  <div className="col-md-3 col-sm-6 mb-2" key={idx}>
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input checkbox_animated"
                        id={`attitude-${idx}`}
                        checked={formData.attitude.includes(option)}
                        onChange={() =>
                          handleCheckboxChange("attitude", option)
                        }
                      />
                      <label
                        className="form-check-label"
                        htmlFor={`attitude-${idx}`}
                      >
                        {option}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </fieldset>

            <fieldset className="mb-4 border rounded p-3">
              <legend className="fs-5 fw-bold">
                Silent Behavior Observations / रोगी मौन का व्यवहार अवलोकन
              </legend>
              <div className="row">
                {silentBehaviorOptions.map((option, idx) => (
                  <div className="col-md-3 col-sm-6 mb-2" key={idx}>
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input checkbox_animated"
                        id={`silent-${idx}`}
                        checked={formData.silentBehaviors.includes(option)}
                        onChange={() =>
                          handleCheckboxChange("silentBehaviors", option)
                        }
                      />
                      <label
                        className="form-check-label"
                        htmlFor={`silent-${idx}`}
                      >
                        {option}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </fieldset>

            <div className="container mt-4">
              <h5 className="mt-4 mb-3">
                Patient's Mental Stage of Patient as per Interviewer (Tick on
                Correct) <br />
                साक्षात्कारकर्ता के अनुसार रोगी की मानसिक अवस्था (सही पर टिक
                करें)
              </h5>
              <table className="table table-bordered text-center">
                <thead className="table-light">
                  <tr>
                    <th>
                      Pre Contemplation <br />
                      पूर्वचिंतन
                    </th>
                    <th>
                      Contemplation <br />
                      चिंतन
                    </th>
                    <th>
                      Preparation <br />
                      तैयारी
                    </th>
                    <th>
                      Action <br />
                      कार्यवाही
                    </th>
                    <th>
                      Maintenance <br />
                      रखरखाव
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {[
                      "Pre Contemplation",
                      "Contemplation",
                      "Preparation",
                      "Action",
                      "Maintenance",
                    ].map((stage) => (
                      <td key={stage}>
                        <input
                          type="checkbox"
                          className="form-check-input checkbox_animated"
                          name="mentalStage"
                          value={stage}
                          checked={formData.mentalStage.includes(stage)}
                          onChange={() => handleMentalStageChange(stage)}
                        />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="table-responsive mb-4">
              <table className="table table-bordered align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: "70%" }}>
                      Patient behavior (According to him)
                      <br />
                      रोगी का व्यवहार (उनके अनुसार)
                    </th>
                    <th className="text-center" style={{ width: "30%" }}>
                      Yes / No <br />
                      हां / नहीं
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q, index) => (
                    <tr key={index}>
                      <td>
                        <strong>{q.en}</strong>
                        <br />
                        <span className="text-muted">{q.hi}</span>
                      </td>
                      <td className="text-center d-flex gap-4 justify-content-center">
                        <div className="form-check form-check-inline">
                          <input
                            className="form-check-input radio_animated"
                            type="radio"
                            name={`q${index}`}
                            id={`q${index}Yes`}
                            value="Yes"
                            checked={formData.questions[index] === "Yes"}
                            onChange={() => handleQuestionChange(index, "Yes")}
                          />
                          <label
                            className="form-check-label"
                            htmlFor={`q${index}Yes`}
                          >
                            Yes / हां
                          </label>
                        </div>
                        <div className="form-check form-check-inline">
                          <input
                            className="form-check-input radio_animated"
                            type="radio"
                            name={`q${index}`}
                            id={`q${index}No`}
                            value="No"
                            checked={formData.questions[index] === "No"}
                            onChange={() => handleQuestionChange(index, "No")}
                          />
                          <label
                            className="form-check-label"
                            htmlFor={`q${index}No`}
                          >
                            No / नहीं
                          </label>
                        </div>
                      </td>
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
                  checked={formData?.consent === "Yes"}
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
                <Label>{signature}</Label>
                <Input
                  type="text"
                  placeholder="Signature"
                  name="signature"
                  value={formData.signature}
                  onChange={handleInputChange}
                />
              </div>

              <div className="col-md-12 mt-3 mb-3">
                <Label>{prepared}</Label>
                <Input
                  type="text"
                  placeholder="Prepared By"
                  name="prepared_by"
                  value={formData.prepared_by}
                  onChange={handleInputChange}
                />
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
                             "Create Patient Behaviour Form"
                           )}
                         </Button>
                       </div>
          </form>
        </div>
      </CommonModal>
      {/* Patient behaviour create form end */}

      {/* View Patient Behaviour data into modal start */}
<CommonModal
  isOpen={viewPBModal}
  title={"Patient Behaviour Assessment"}
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
      Patient Behaviour / रोगी व्यवहार मूल्यांकन
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
        ) : viewPBData ? (
          <>
            <tr>
              <th className="text-start p-3">Name</th>
              <td className="border p-3">{viewPBData.name}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Phone</th>
              <td className="border p-3">{viewPBData.phone}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Email</th>
              <td className="border p-3">{viewPBData.email}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Gender</th>
              <td className="border p-3">{viewPBData.gender}</td>
            </tr>
            <tr>
              <th className="text-start p-3">DOB</th>
              <td className="border p-3">
                {viewPBData.dob
                  ? new Date(viewPBData.dob).toLocaleDateString()
                  : ""}
              </td>
            </tr>
            <tr>
              <th className="text-start p-3">Branch</th>
              <td className="border p-3">{viewPBData.branch_name}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Ward</th>
              <td className="border p-3">{viewPBData.ward_name}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Assessment Date</th>
              <td className="border p-3">
                {viewPBData.date_of_assessment
                  ? new Date(viewPBData.date_of_assessment).toLocaleDateString()
                  : ""}
              </td>
            </tr>
            <tr>
              <th className="text-start p-3">Most Important Thing in Life</th>
              <td className="border p-3">{viewPBData.most_important_thing_life}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Life Aim</th>
              <td className="border p-3">{viewPBData.life_aim}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Current Mental Status</th>
              <td className="border p-3">{viewPBData.current_mental_status_center}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Planned After Discharge</th>
              <td className="border p-3">{viewPBData.planned_after_discharge}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Family Expectations After Discharge</th>
              <td className="border p-3">{viewPBData.family_expectations_after_discharge}</td>
            </tr>

            {/* Arrays */}
            <tr>
              <th className="text-start p-3">Attitude During Interview</th>
              <td className="border p-3">
                {(viewPBData.attitude_during_interview || []).join(", ")}
              </td>
            </tr>
            <tr>
              <th className="text-start p-3">Silent Behaviour Observations</th>
              <td className="border p-3">
                {(viewPBData.silent_behavior_observations || []).join(", ")}
              </td>
            </tr>
            <tr>
              <th className="text-start p-3">Patient Mental Stage</th>
              <td className="border p-3">
                {(viewPBData.patient_mental_stage || []).join(", ")}
              </td>
            </tr>

            {/* Yes/No fields */}
            <tr>
              <th className="text-start p-3">Uses Alone</th>
              <td className="border p-3">{viewPBData.uses_alone}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Moody</th>
              <td className="border p-3">{viewPBData.moody}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Always Worried</th>
              <td className="border p-3">{viewPBData.always_worried}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Always Sad</th>
              <td className="border p-3">{viewPBData.always_sad}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Lack of Confidence</th>
              <td className="border p-3">{viewPBData.lack_of_confidence}</td>
            </tr>

            {/* Add all remaining Yes/No boolean style fields */}
            <tr>
              <th className="text-start p-3">Substance Dependent Think</th>
              <td className="border p-3">{viewPBData.substance_dependent_think}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Consent</th>
              <td className="border p-3">{viewPBData.consent}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Prepared By</th>
              <td className="border p-3">{viewPBData.prepared_by}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Status</th>
              <td className="border p-3">{viewPBData.status}</td>
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
        ? "Your Patient Behaviour Assessment is being downloaded..."
        : "Download Patient Behaviour"}
    </button>
  </div>
</CommonModal>
{/* View Patient Behaviour data into modal end */}

{/* Patient edit behaviour form start */}
<CommonModal
  isOpen={PBEditModal}
  title="Edit Patient behavior / रोगी का व्यवहार / Create Patient behavior / रोगी का व्यवहार"
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
    <form className="container mt-4 mb-5" onSubmit={(e)=>{
      e.preventDefault();
      handlePBUpdate();
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
                PBEditData?.date_of_assessment
                  ? new Date(PBEditData.date_of_assessment)
                  : null
              }
              onChange={(date) =>
                setPBEditData((prev) => ({
                  ...prev,
                  date_of_assessment: date,
                }))
              }
            />
          </div>
        </Col>
      </div>

      {/* Example fields */}
      <div className="row align-items-baseline">
        <div className="col-md-6">
          <div className="mb-3">
            <label htmlFor="mostImportantThingLife" className="form-label">
              What is the most important thing in life? / जीवन में सबसे महत्वपूर्ण चीज़ क्या है?
            </label>
            <input
              type="text"
              className="form-control"
              id="mostImportantThingLife"
              value={PBEditData?.most_important_thing_life || ""}
              onChange={(e) =>
                setPBEditData((prev) => ({
                  ...prev,
                  most_important_thing_life: e.target.value,
                }))
              }
            />
          </div>
        </div>

        <div className="col-md-6">
          <div className="mb-3">
            <label htmlFor="lifeAim" className="form-label">
              Life's Aim / जिंदगी का लक्ष्य
            </label>
            <input
              type="text"
              className="form-control"
              id="lifeAim"
              value={PBEditData?.life_aim || ""}
              onChange={(e) =>
                setPBEditData((prev) => ({
                  ...prev,
                  life_aim: e.target.value,
                }))
              }
            />
          </div>
        </div>

        <div className="col-md-6">
          <div className="mb-3">
            <label htmlFor="mentalStatus" className="form-label">
              Current Mental Status here in center (वर्तमान मानसिक स्थिति यहाँ केंद्र में)
            </label>
            <input
              type="text"
              className="form-control"
              id="current_mental_status_center"
              value={PBEditData?.current_mental_status_center || ""}
              onChange={(e) =>
                setPBEditData((prev) => ({
                  ...prev,
                  current_mental_status_center: e.target.value,
                }))
              }
            />
          </div>
        </div>

        <div className="col-md-6">
          <div className="mb-3">
            <label htmlFor="planned_after_discharge" className="form-label">
              What is planned after discharge from center (डिस्चार्ज के बाद क्या सोचता है?)
            </label>
            <input
              type="text"
              className="form-control"
              id="planned_after_discharge"
              value={PBEditData?.planned_after_discharge || ""}
              onChange={(e) =>
                setPBEditData((prev) => ({
                  ...prev,
                  planned_after_discharge: e.target.value,
                }))
              }
            />
          </div>
        </div>

        <div className="col-md-6">
          <div className="mb-4">
            <label htmlFor="family_expectations_after_discharge" className="form-label">
              What Expectations do you have for family after discharge? (छुट्टी के बाद परिवार से आपकी क्या उम्मीदें हैं?)
            </label>
            <input
              type="text"
              className="form-control"
              id="family_expectations_after_discharge"
              value={PBEditData?.family_expectations_after_discharge || ""}
              onChange={(e) =>
                setPBEditData((prev) => ({
                  ...prev,
                  family_expectations_after_discharge: e.target.value,
                }))
              }
            />
          </div>
        </div>
      </div>

      {/* ✅ Attitude Checkboxes Prefill */}
      <fieldset className="mb-4 border rounded p-3">
        <legend className="fs-5 fw-bold">ATTITUDE DURING INTERVIEW / साक्षात्कार के दौरान रवैया</legend>
        <div className="row">
          {attitudeOptions.map((option, idx) => (
            <div className="col-md-3 col-sm-6 mb-2" key={idx}>
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input checkbox_animated"
                  id={`attitude-${idx}`}
                  checked={
                    PBEditData?.attitude_during_interview?.includes(
                      option.split("/")[0].trim().toLowerCase().replace(/\s+/g, "_")
                    ) || false
                  }
                  onChange={() =>
                    setPBEditData((prev) => {
                      const current = prev.attitude_during_interview || [];
                      const formattedOption = option
                        .split("/")[0]
                        .trim()
                        .toLowerCase()
                        .replace(/\s+/g, "_");
                  
                      return {
                        ...prev,
                        attitude_during_interview: current.includes(formattedOption)
                          ? current.filter((o) => o !== formattedOption)
                          : [...current, formattedOption],
                      };
                    })
                  }
                  
                />
                <label className="form-check-label" htmlFor={`attitude-${idx}`}>
                  {option}
                </label>
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      {/* ✅ Silent Behaviour Prefill */}
<fieldset className="mb-4 border rounded p-3">
  <legend className="fs-5 fw-bold">
    Silent Behavior Observations / रोगी मौन का व्यवहार अवलोकन
  </legend>
  <div className="row">
    {silentBehaviorOptions.map((option, idx) => {
      const slug = option.split("/")[0].trim().toLowerCase().replace(/\s+/g, "_");

      return (
        <div className="col-md-3 col-sm-6 mb-2" key={idx}>
          <div className="form-check">
            <input
              type="checkbox"
              className="form-check-input checkbox_animated"
              id={`silent-${idx}`}
              checked={PBEditData?.silent_behavior_observations?.includes(slug) || false}
              onChange={() =>
                setPBEditData((prev) => {
                  const current = prev.silent_behavior_observations || [];
                  return {
                    ...prev,
                    silent_behavior_observations: current.includes(slug)
                      ? current.filter((o) => o !== slug)
                      : [...current, slug],
                  };
                })
              }
            />
            <label className="form-check-label" htmlFor={`silent-${idx}`}>
              {option}
            </label>
          </div>
        </div>
      );
    })}
  </div>
</fieldset>


      {/* ✅ Mental Stage Prefill */}
      <div className="container mt-4">
        <h5 className="mt-4 mb-3">
          Patient's Mental Stage of Patient as per Interviewer (Tick on Correct)
          <br />
          साक्षात्कारकर्ता के अनुसार रोगी की मानसिक अवस्था (सही पर टिक करें)
        </h5>
        <table className="table table-bordered text-center">
          <thead className="table-light">
            <tr>
              {["Pre Contemplation","Contemplation","Preparation","Action","Maintenance"].map(stage => (
                <th key={stage}>{stage}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {["pre_contemplation","contemplation","preparation","action","maintenance"].map(stageKey => (
                <td key={stageKey}>
                  <input
                    type="checkbox"
                    className="form-check-input checkbox_animated"
                    checked={PBEditData?.patient_mental_stage?.includes(stageKey) || false}
                    onChange={() =>
                      setPBEditData((prev) => {
                        const current = prev.patient_mental_stage || [];
                        return {
                          ...prev,
                          patient_mental_stage: current.includes(stageKey)
                            ? current.filter((s) => s !== stageKey)
                            : [...current, stageKey],
                        };
                      })
                    }
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

     {/* ✅ Patient Behavior Questions Prefill + Update */}
<div className="table-responsive mb-4">
  <table className="table table-bordered align-middle">
    <thead className="table-light">
      <tr>
        <th style={{ width: "70%" }}>
          Patient behavior (According to him) <br />
          रोगी का व्यवहार (उनके अनुसार)
        </th>
        <th className="text-center" style={{ width: "30%" }}>
          Yes / No <br /> हां / नहीं
        </th>
      </tr>
    </thead>
    <tbody>
    {questions.map((q, index) => (
  <tr key={index}>
    <td>
      <strong>{q.en}</strong>
      <br />
      <span className="text-muted">{q.hi}</span>
    </td>
    <td className="text-center d-flex gap-4 justify-content-center">
      {/* ✅ Yes Option */}
      <div className="form-check form-check-inline">
        <input
          className="form-check-input radio_animated"
          type="radio"
          name={q.key}
          id={`${q.key}Yes`}
          value="Yes"
          checked={PBEditData?.[q.key] === "Yes"}
          onChange={() =>
            setPBEditData((prev) => ({
              ...prev,
              [q.key]: "Yes",
            }))
          }
        />
        <label className="form-check-label" htmlFor={`${q.key}Yes`}>
          Yes / हां
        </label>
      </div>

      {/* ✅ No Option */}
      <div className="form-check form-check-inline">
        <input
          className="form-check-input radio_animated"
          type="radio"
          name={q.key}
          id={`${q.key}No`}
          value="No"
          checked={PBEditData?.[q.key] === "No"}
          onChange={() =>
            setPBEditData((prev) => ({
              ...prev,
              [q.key]: "No",
            }))
          }
        />
        <label className="form-check-label" htmlFor={`${q.key}No`}>
          No / नहीं
        </label>
      </div>
    </td>
  </tr>
))}

    </tbody>
  </table>
</div>


      {/* ✅ Consent, Signature, Prepared By */}
      <div className="col-md-12 mt-3 mb-3">
        <div className="checkbox ms-3">
          <Input
            id="checkbox1"
            type="checkbox"
            checked={PBEditData?.consent === "Yes"}
            onChange={(e) =>
              setPBEditData((prev) => ({
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

      <div className="row mt-3 mb-3">
        <div className="col-md-4">
          <Label>{signature}</Label>
          <Input
            type="text"
            placeholder="Signature"
            value={PBEditData?.signature || ""}
            onChange={(e) =>
              setPBEditData((prev) => ({
                ...prev,
                signature: e.target.value,
              }))
            }
          />
        </div>

        <div className="col-md-12 mt-3 mb-3">
          <Label>{prepared}</Label>
          <Input
            type="text"
            placeholder="Prepared By"
            value={PBEditData?.prepared_by || ""}
            onChange={(e) =>
              setPBEditData((prev) => ({
                ...prev,
                prepared_by: e.target.value,
              }))
            }
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="d-flex gap-3">
        <Button color="primary" type="submit" disabled={isLoading}>
          {isLoading ? (
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          ) : PBEditData ? "Update Patient Behaviour Form" : "Create Patient Behaviour Form"}
        </Button>
      </div>
    </form>
  </div>
</CommonModal>
{/* Patient edit behaviour form end */}



{/* Patient readmission behaviour form start */}
<CommonModal
  isOpen={PBPrefillModal}
  title="Readmission Patient behavior / रोगी का व्यवहार / Create Patient behavior / रोगी का व्यवहार"
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
      className="container mt-4 mb-5"
     onSubmit={handlePBReadmissionFormSubmit}
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
                PBPrefillData?.date_of_assessment
                  ? new Date(PBPrefillData.date_of_assessment)
                  : null
              }
              onChange={(date) =>
                setPBPrefillData((prev) => ({
                  ...prev,
                  date_of_assessment: date,
                }))
              }
            />
          </div>
        </Col>
      </div>

      {/* Example fields */}
      <div className="row align-items-baseline">
        <div className="col-md-6">
          <div className="mb-3">
            <label htmlFor="mostImportantThingLife" className="form-label">
              What is the most important thing in life? / जीवन में सबसे महत्वपूर्ण चीज़ क्या है?
            </label>
            <input
              type="text"
              className="form-control"
              id="mostImportantThingLife"
              value={PBPrefillData?.most_important_thing_life || ""}
              onChange={(e) =>
                setPBPrefillData((prev) => ({
                  ...prev,
                  most_important_thing_life: e.target.value,
                }))
              }
            />
          </div>
        </div>

        <div className="col-md-6">
          <div className="mb-3">
            <label htmlFor="lifeAim" className="form-label">
              Life's Aim / जिंदगी का लक्ष्य
            </label>
            <input
              type="text"
              className="form-control"
              id="lifeAim"
              value={PBPrefillData?.life_aim || ""}
              onChange={(e) =>
                setPBPrefillData((prev) => ({
                  ...prev,
                  life_aim: e.target.value,
                }))
              }
            />
          </div>
        </div>

        <div className="col-md-6">
          <div className="mb-3">
            <label htmlFor="mentalStatus" className="form-label">
              Current Mental Status here in center (वर्तमान मानसिक स्थिति यहाँ केंद्र में)
            </label>
            <input
              type="text"
              className="form-control"
              id="current_mental_status_center"
              value={PBPrefillData?.current_mental_status_center || ""}
              onChange={(e) =>
                setPBPrefillData((prev) => ({
                  ...prev,
                  current_mental_status_center: e.target.value,
                }))
              }
            />
          </div>
        </div>

        <div className="col-md-6">
          <div className="mb-3">
            <label htmlFor="planned_after_discharge" className="form-label">
              What is planned after discharge from center (डिस्चार्ज के बाद क्या सोचता है?)
            </label>
            <input
              type="text"
              className="form-control"
              id="planned_after_discharge"
              value={PBPrefillData?.planned_after_discharge || ""}
              onChange={(e) =>
                setPBPrefillData((prev) => ({
                  ...prev,
                  planned_after_discharge: e.target.value,
                }))
              }
            />
          </div>
        </div>

        <div className="col-md-6">
          <div className="mb-4">
            <label htmlFor="family_expectations_after_discharge" className="form-label">
              What Expectations do you have for family after discharge? (छुट्टी के बाद परिवार से आपकी क्या उम्मीदें हैं?)
            </label>
            <input
              type="text"
              className="form-control"
              id="family_expectations_after_discharge"
              value={PBPrefillData?.family_expectations_after_discharge || ""}
              onChange={(e) =>
                setPBPrefillData((prev) => ({
                  ...prev,
                  family_expectations_after_discharge: e.target.value,
                }))
              }
            />
          </div>
        </div>
      </div>

      {/* ✅ Attitude Checkboxes Prefill */}
      <fieldset className="mb-4 border rounded p-3">
        <legend className="fs-5 fw-bold">ATTITUDE DURING INTERVIEW / साक्षात्कार के दौरान रवैया</legend>
        <div className="row">
          {attitudeOptions.map((option, idx) => {
            const slug = option
              .split("/")[0]
              .trim()
              .toLowerCase()
              .replace(/\s+/g, "_");
            return (
              <div className="col-md-3 col-sm-6 mb-2" key={idx}>
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input checkbox_animated"
                    id={`attitude-${idx}`}
                    checked={PBPrefillData?.attitude_during_interview?.includes(slug) || false}
                    onChange={() =>
                      setPBPrefillData((prev) => {
                        const current = prev.attitude_during_interview || [];
                        return {
                          ...prev,
                          attitude_during_interview: current.includes(slug)
                            ? current.filter((o) => o !== slug)
                            : [...current, slug],
                        };
                      })
                    }
                  />
                  <label className="form-check-label" htmlFor={`attitude-${idx}`}>
                    {option}
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </fieldset>

      {/* ✅ Silent Behaviour Prefill */}
      <fieldset className="mb-4 border rounded p-3">
        <legend className="fs-5 fw-bold">
          Silent Behavior Observations / रोगी मौन का व्यवहार अवलोकन
        </legend>
        <div className="row">
          {silentBehaviorOptions.map((option, idx) => {
            const slug = option.split("/")[0].trim().toLowerCase().replace(/\s+/g, "_");
            return (
              <div className="col-md-3 col-sm-6 mb-2" key={idx}>
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input checkbox_animated"
                    id={`silent-${idx}`}
                    checked={PBPrefillData?.silent_behavior_observations?.includes(slug) || false}
                    onChange={() =>
                      setPBPrefillData((prev) => {
                        const current = prev.silent_behavior_observations || [];
                        return {
                          ...prev,
                          silent_behavior_observations: current.includes(slug)
                            ? current.filter((o) => o !== slug)
                            : [...current, slug],
                        };
                      })
                    }
                  />
                  <label className="form-check-label" htmlFor={`silent-${idx}`}>
                    {option}
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </fieldset>

      {/* ✅ Mental Stage Prefill */}
      <div className="container mt-4">
        <h5 className="mt-4 mb-3">
          Patient's Mental Stage of Patient as per Interviewer (Tick on Correct)
          <br />
          साक्षात्कारकर्ता के अनुसार रोगी की मानसिक अवस्था (सही पर टिक करें)
        </h5>
        <table className="table table-bordered text-center">
          <thead className="table-light">
            <tr>
              {["Pre Contemplation", "Contemplation", "Preparation", "Action", "Maintenance"].map((stage) => (
                <th key={stage}>{stage}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {["pre_contemplation", "contemplation", "preparation", "action", "maintenance"].map((stageKey) => (
                <td key={stageKey}>
                  <input
                    type="checkbox"
                    className="form-check-input checkbox_animated"
                    checked={PBPrefillData?.patient_mental_stage?.includes(stageKey) || false}
                    onChange={() =>
                      setPBPrefillData((prev) => {
                        const current = prev.patient_mental_stage || [];
                        return {
                          ...prev,
                          patient_mental_stage: current.includes(stageKey)
                            ? current.filter((s) => s !== stageKey)
                            : [...current, stageKey],
                        };
                      })
                    }
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* ✅ Patient Behavior Questions Prefill */}
      <div className="table-responsive mb-4">
        <table className="table table-bordered align-middle">
          <thead className="table-light">
            <tr>
              <th style={{ width: "70%" }}>
                Patient behavior (According to him) <br />
                रोगी का व्यवहार (उनके अनुसार)
              </th>
              <th className="text-center" style={{ width: "30%" }}>
                Yes / No <br /> हां / नहीं
              </th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q, index) => (
              <tr key={index}>
                <td>
                  <strong>{q.en}</strong>
                  <br />
                  <span className="text-muted">{q.hi}</span>
                </td>
                <td className="text-center d-flex gap-4 justify-content-center">
                  {/* ✅ Yes Option */}
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input radio_animated"
                      type="radio"
                      name={q.key}
                      id={`${q.key}Yes`}
                      value="Yes"
                      checked={PBPrefillData?.[q.key] === "Yes"}
                      onChange={() =>
                        setPBPrefillData((prev) => ({
                          ...prev,
                          [q.key]: "Yes",
                        }))
                      }
                    />
                    <label className="form-check-label" htmlFor={`${q.key}Yes`}>
                      Yes / हां
                    </label>
                  </div>

                  {/* ✅ No Option */}
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input radio_animated"
                      type="radio"
                      name={q.key}
                      id={`${q.key}No`}
                      value="No"
                      checked={PBPrefillData?.[q.key] === "No"}
                      onChange={() =>
                        setPBPrefillData((prev) => ({
                          ...prev,
                          [q.key]: "No",
                        }))
                      }
                    />
                    <label className="form-check-label" htmlFor={`${q.key}No`}>
                      No / नहीं
                    </label>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✅ Consent, Signature, Prepared By */}
      <div className="col-md-12 mt-3 mb-3">
        <div className="checkbox ms-3">
          <Input
            id="checkbox1"
            type="checkbox"
            checked={PBPrefillData?.consent === "Yes"}
            onChange={(e) =>
              setPBPrefillData((prev) => ({
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

      <div className="row mt-3 mb-3">
        <div className="col-md-4">
          <Label>{signature}</Label>
          <Input
            type="text"
            placeholder="Signature"
            value={PBPrefillData?.signature || ""}
            onChange={(e) =>
              setPBPrefillData((prev) => ({
                ...prev,
                signature: e.target.value,
              }))
            }
          />
        </div>

        <div className="col-md-12 mt-3 mb-3">
          <Label>{prepared}</Label>
          <Input
            type="text"
            placeholder="Prepared By"
            value={PBPrefillData?.prepared_by || ""}
            onChange={(e) =>
              setPBPrefillData((prev) => ({
                ...prev,
                prepared_by: e.target.value,
              }))
            }
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="d-flex gap-3">
        <Button color="primary" type="submit" disabled={isLoading}>
          {isLoading ? (
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          ) : PBPrefillData ? "Readmission Patient Behaviour Form" : "Create Patient Behaviour Form"}
        </Button>
      </div>
    </form>
  </div>
</CommonModal>
{/* Patient readmission behaviour form end */}











    </Fragment>
  );
}

export default PatientBehavior;
