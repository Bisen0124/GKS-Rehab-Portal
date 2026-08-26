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

import {
  dateOfAssessment,
  tableNumber,
  tableNumber2,
  yes1,
  no1,
  prepared,
  fda,
  mentalBehaviour,
  mentalBehavioursData,
  fdaAdsiction,
  addictionSeverity,
  Remarks,
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

import VoiceTextarea from "../VoiceTextarea/VoiceTextarea";

import { useReactToPrint } from "react-to-print";

function SUDBrief() {

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
          const FDADate = user.recent_fda_date
            ? new Date(user.recent_fda_date)
            : null;

            let isSUDBriefCompleted = false;

          let userStatus = (
            <p className="badge bg-warning text-dark p-2">{getTranslation("Pending/लंबित",lang)}</p>
          );
          if (admitDate && FDADate && admitDate > FDADate) {
             isSUDBriefCompleted = true;
            userStatus = <p className="badge bg-success p-2">{getTranslation("Completed/पुरा होना।",lang)}</p>;
          }

          const dischargeStatus = user.discharge_status_text || "Unknown";

          return {
            id: user.user_id,
            gks_id: user.gks_id || "N/A",
            name: user.name,
            status: userStatus,
            isSUDBriefCompleted,
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
      name: `${getTranslation('GKS ID/GKS आईडी' , lang)}`,
      selector: (row) => row.gks_id,
      sortable: true,
      center: true,
    },
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
                // onClick={() => handleFDAPreFill(row.recent_fda_id)}
                style={{ cursor: "pointer" }}
                title={getTranslation("Readmission Substance Use Dependency (SUD) Form/पुनः प्रवेश पदार्थ उपयोग निर्भरता (SUD) प्रपत्र",lang)}
              >
                ✏️
              </span>
            )}

            {/* Show Create PFA if not discharged and not readmission */}
            {/* {row.dischargeStatus === 0 && row.isReadmission === 0 && (
              <span
                onClick={() => createSUDBrief(row.id)}
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
    onClick={() => (row.isSUDBriefCompleted ? null : createSUDBrief(row.id))}
    style={{
      cursor: row.isSUDBriefCompleted ? "not-allowed" : "pointer",
      opacity: row.isSUDBriefCompleted ? 0.5 : 1,
    }}
    title={row.isSUDBriefCompleted ? getTranslation("SUDBrief Completed/एसयूडीब्रीफ पूरा हुआ",lang) : getTranslation("Create SUD Brief/SUD संक्षिप्त विवरण बनाएँ",lang)}
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
      `https://gks-yjdc.onrender.com/api/intake-sud/all-entries?branch_id=${selectedBranch}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      }
    )
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch SUD entries list");
        return response.json();
      })
      .then((res) => {
        const sudEntries = res.data || [];

        const formattedSUDPatient = sudEntries.map((item) => ({
          // top level
          intake_sud_id: item.intake_sud_id,
          status: item.status,

          // user details
          user_id: item.user?.user_id || null,
          name: item.user?.name || "",
          phone: item.user?.phone || "",
          email: item.user?.email || "",

          // entry details
          entry_id: item.entry?.entry_id || null,
          visit_no: item.entry?.visit_no || null,
          admit_date: item.entry?.admit_date || null,
          discharge_date: item.entry?.discharge_date || null,
          discharge_status: item.entry?.discharge_status || null,

          // assessment details
          date_of_assessment: item.assessment?.date_of_assessment || null,
          dependent_to: item.assessment?.dependent_to || "",
          recurrence_of_substance_use:
            item.assessment?.recurrence_of_substance_use || null,
          substance_daily_quantity:
            item.assessment?.substance_daily_quantity || "",
          last_30_days_quantity: item.assessment?.last_30_days_quantity || "",

          // financial details
          patient_monthly_income:
            item.financial?.patient_monthly_income || null,
          monthly_family_income: item.financial?.monthly_family_income || null,
          daily_spent_on_substance:
            item.financial?.daily_spent_on_substance || null,

          // treatment history
          prior_treatment: item.treatment_history?.prior_treatment || "",
          how_many_times: item.treatment_history?.how_many_times || null,
          treatment_records: item.treatment_history?.treatment_records || [],
          chief_complaints: item.treatment_history?.chief_complaints || "",

          // audit (meta info)
          branch_id: item.audit?.branch_id || null,
          created_by: item.audit?.created_by || "",
          updated_by: item.audit?.updated_by || "",
          created_at: item.audit?.created_at || null,
          updated_at: item.audit?.updated_at || null,
        }));

        console.log("Formatted SUD Patients:", formattedSUDPatient);

        setTimeout(() => {
          setfdaData(formattedSUDPatient);
          setFilteredDataone(formattedSUDPatient);
          setstillLoading(false);
        }, 500);
      })
      .catch((error) => {
        console.error("Error fetching SUD entries:", error);
        setstillLoading(true);
      });
  }, [selectedBranch]);

  const tableColumnsFDAList = [
    {
      name: `${getTranslation('Substance Use Dependen ID/पदार्थ उपयोग निर्भरता आईसीडी' , lang)}`,
      selector: (row) => row.intake_sud_id,
      sortable: true,
      center: true,
    },
    // { name: "GKS ID", selector: (row) => row.gks_id, sortable: true, center: true },
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
          <p className="badge bg-success p-2">SUD Brief {row.status}</p>
        </span>
      ),
    },
    {
      name: `${getTranslation('Action/क्रिया' , lang)}`,
      center: true,
      cell: (row) => (
        <div className="d-flex gap-2">
          <span
            onClick={() => viewSUDBriefFormData(row.intake_sud_id)}
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
            onClick={() => handleSUDBriefindividualEdit(row.intake_sud_id)}
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

  {
    /*  Prior Treatment for substance use Dependency / पदार्थ के उपयोग पर निर्भरता के लिए पूर्व उपचार start */
  }
  const [rows, setRows] = useState([
    {
      treatment_year: "",
      treatment_place: "",
      treatment_duration: "",
      days_of_sobriety: "",
    },
  ]);

  const handleAssesmentDateChange = (name, date) => {
    setFormData((prev) => ({
      ...prev,
      [name]: date,
    }));
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle table row change
  const handleRowChange = (index, field, value) => {
    const updatedRows = [...rows];
    updatedRows[index][field] = value;
    setRows(updatedRows);
  };

  // Add new row
  const addRow = () => {
    setRows([
      ...rows,
      {
        treatment_year: "",
        treatment_place: "",
        treatment_duration: "",
        days_of_sobriety: "",
      },
    ]);
  };

  // Delete row
  const deleteRow = (index) => {
    const updatedRows = [...rows];
    updatedRows.splice(index, 1);
    setRows(updatedRows);
  };
  {
    /*  Prior Treatment for substance use Dependency / पदार्थ के उपयोग पर निर्भरता के लिए पूर्व उपचार end */
  }

  //Crete SUD brief form function start
  const [isSUDbriefModalOpen, setIsSUDbriefModalOpen] = useState(false);
  const createSUDBrief = async (userId = null) => {
    setIsSUDbriefModalOpen(true);
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

  //Post Submit SUD brief from data to DB via API Handeler
  const [formData, setFormData] = useState({
    dateOfAssessment: new Date(),
    dependent_to: "",
    substance_daily_quantity: "",
    used_first_time: "",
    patient_monthly_income: "",
    daily_spent_on_substance: "",
    recurrence_of_substance_use: "",
    last_30_days_quantity: "",
    duration_of_regular_use: "",
    monthly_family_income: "",
    source_of_money: "",
    expense_more_than_income_arrangement: "",
    substance_abuse_started_when: "",
    alcohol_tobacco_experience: "",
    first_substance_experience: "",
    second_time_abuse_frequency: "",
    mental_obsession_started_when: "",
    trauma_effect_on_substance_use: "",
    regular_use_when_with_whom: "",
    residence_status_regular_use: "",
    friends_regular_use: "",
    multiple_substances_early_stage: "",
    touch_friends_current_relationship: "",
    family_friends_reaction: "",
    substance_effect_physical: "",
    chief_complaints: "",
    prior_treatment: "Yes",
    how_many_times: "",
    substance_stop_tried: "",
    coping_mechanisms: "",
    work_after_stop: "",
    influence_reason_to_stop: "",
    why_relapse: "",
    substance_change_quantity: "",
    mental_physical_disorders: "",
    diagnosed_on_treatment: "",
    doctor_treatment_details: "",
    traditional_healer_treatment: "",
    how_long_when: "",
    treatment_effect_result: "",
  });

  //spinner extract from other file
  const selectedSpinner = Data.find(
    (item) => item.spinnerClass === "loader-37"
  );
  //Loading spinner
  const [isLoading, setIsLoading] = useState(false);
  const SubmitSUDBriefFormHandler = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Start loader

    const payload = {
      user_id: selectedUser?.user_id, // ✅ corrected
      date_of_assessment: formData.dateOfAssessment?.toISOString(),
      ...formData,
      patient_monthly_income: parseFloat(formData.patient_monthly_income) || 0,
      monthly_family_income: parseFloat(formData.monthly_family_income) || 0,
      daily_spent_on_substance:
        parseFloat(formData.daily_spent_on_substance) || 0,
      recurrence_of_substance_use:
        parseInt(formData.recurrence_of_substance_use) || 0,
      how_many_times: parseInt(formData.how_many_times) || 0,
      treatment_records: rows,
    };

    try {
      const token = localStorage.getItem("Authorization");
      const branch_id = selectedBranch;
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/intake-sud/create-assessment?branch_id=${branch_id}`,
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
        title: getTranslation("SUD Brief Created Successfully/SUD संक्षिप्त विवरण सफलतापूर्वक बनाया गया",lang),
        text: getTranslation("The SUD Brief assessment was submitted successfully./एसयूडी संक्षिप्त मूल्यांकन सफलतापूर्वक प्रस्तुत किया गया।",lang),
      }).then(() => setIsSUDbriefModalOpen(false));

      console.log("SUD Brief Data", data);
      console.log("SUD Brief Payload", payload);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      Swal.fire({
        icon: "error",
        title: getTranslation("Unexpected Error/अप्रत्याशित त्रुटि",lang),
        text: getTranslation("Failed to submit. Check console for error./सबमिट करने में विफल. त्रुटि के लिए कंसोल की जाँच करें.",lang),
      });
    }
  };

  const [viewSUDBriefData, setViewSUDBriefData] = useState(null);
  const [viewSUDBriefModal, setviewSUDBriefModal] = useState(false);
  const viewSUDBriefFormData = async (SUDID) => {
    setviewSUDBriefModal(true);
    console.log("SUD ID =>", SUDID);

    if (typeof SUDID === "object" && SUDID !== null) {
      SUDID = SUDID.intake_sud_id;
    }

    if (!SUDID) {
      console.error("Invalid SUD ID provided");
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem("Authorization");

    try {
      const branch_id = selectedBranch;
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/intake-sud/assessment/${SUDID}?branch_id=${branch_id}`,
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
      const ViewSUDDataEntry = data.data || null;
      console.log("Extracted SUD Data Entry:", ViewSUDDataEntry); // ✅ should show full assessment object

      if (!ViewSUDDataEntry) {
        console.warn("No SUD assessment data found.");
        return;
      }

      setViewSUDBriefData(ViewSUDDataEntry);
      console.log("SUD Data Fetched ID:", ViewSUDDataEntry.intake_sud_id);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  //Re-Admission FDA Form Handler
  //🔧 Convert DD/MM/YYYY to Date Object:
  const parseDateString = (dateStr) => {
    if (!dateStr) return null;

    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  };
  // Edit individual SUD assessment form handler
  // Define label mapping at top of your component
const fieldLabels = {
  substance_daily_quantity: "Substance daily Quantity? / पदार्थ की दैनिक मात्रा?",
  used_first_time: "Used first time? / पहली बार पदार्थ कब लिया?",
  patient_monthly_income: "Patient Monthly Income / मरीज की मासिक आय",
  daily_spent_on_substance: "Daily spent on substance? / पदार्थ पर दैनिक खर्च",
  recurrence_of_substance_use: "Recurrence of substance use / पदार्थ उपयोग की पुनरावृत्ति",
  last_30_days_quantity: "Last 30 days Quantity? / पिछले 30 दिनों की मात्रा",
  duration_of_regular_use: "Duration of regular use? / नियमित उपयोग की अवधि",
  monthly_family_income: "Monthly family income / परिवार की मासिक आय",
  source_of_money: "Source of money? / धन का स्रोत",
};

const textareaLabels = {
  expense_more_than_income_arrangement:
    "If expenses more than income where do you arrange? / यदि आपके खर्च आय से ज्यादा हैं तो व्यवस्था कहाँ से करते हैं?",
  substance_abuse_started_when:
    "Substance abuse Started When? Why? Where? With Whom (No of Person)? Place? Substance? Quantity? Brand? / मादक पदार्थ का सेवन कब शुरू हुआ? क्यों? कहाँ? किसके साथ (कितने लोग) ? स्थान? पदार्थ? मात्रा? ब्रांड?",
  alcohol_tobacco_experience:
    "If started with Tobacco after how much time you moved to other Substance (like Alcohol Ganja etc) & why? / यदि तम्बाकू से शुरुआत की थी तो कितने समय बाद आप अन्य मादक पदार्थ (जैसे शराब,गांजा आदि) की ओर चले गए और क्यों?",
  first_substance_experience:
    "How was your first experience of Substance abuse? / मादक पदार्थ के सेवन का आपका पहला अनुभव कैसा था?",
  second_time_abuse_frequency:
    "In how much time abuse Substance 2nd time & with whom? How often did you take Substance in the first year? / आपने कितनी बार और किसके साथ मिलकर दूसरी बार मादक पदार्थ का सेवन किया? आपने पहले वर्ष में कितनी बार मादक पदार्थ का सेवन किया?",
  mental_obsession_started_when:
    "Mental obsession for Substance started on? / मादक पदार्थ के प्रति मानसिक जुनून की शुरुआत कब हुयी?",
  trauma_effect_on_substance_use:
    " Experienced any Trauma, if yes when & what, what effect on Substance use? Reason for regular use was shock/Trauma? कोई सदमा,यदि हाँ तो कब और क्या, मादक पदार्थ के उपयोग पर इसका क्या प्रभाव पड़ा? क्नियमित उपयोग का कारण सदमा था?",
  regular_use_when_with_whom:
    "Why & When started Regular use & with Whom? / नियमित उपयोग क्यों और कब शुरू हुआ? किसके साथ ?",
  residence_status_regular_use:
    " Residence status of patient when started regularly / ? नियमित रूपसे शुरू होने पर रोगी की आवासीय स्थिति?",
  friends_regular_use:
    " list the friends with whom you started regular use. Were they are same friends you started with? / उन दोस्तों की सूची बनाएँ जिनके साथ आपने नियमित उपयोग शुरू किया था। क्या वे वही दोस्त थे जिनके साथ शुरुवात की ?",
  multiple_substances_early_stage:
    "if tried multiple Substance in early stage mention?(if yes why with whom?) / क्या आपने कई मादक पदार्थ का इस्तेमाल किया है?(यदि हां तो क्यों किसके साथ?)",
  touch_friends_current_relationship:
    "Are you in touch with those friends with whom you initially used Substance ? Current relationship with those? Are they Dependent, social Dependent or Sober. / क्या आप उन दोस्तों के संपर्क में हैं जिनके साथ आपने शुरू में मादक पदार्थ लिया था? उनके साथ वर्तमान संबंध क्या हैं? क्या वे आश्रित, सामाजिक आश्रित या संयमित हैं?",
  family_friends_reaction:
    "What is reaction of family & friends (who are sober) when they know? What was reaction of patient? / जब परिवार और दोस्तों (जो संयमी हैं) को पता चला तो उनकी क्या प्रतिक्रिया थी? मरीज़ की क्या प्रतिक्रिया थी?",
  substance_effect_physical:
    " Effect of Substance in Physical, personal, married, Educational,Professional Life & Family ? & Your Reaction? / शारीरिक, व्यक्तिगत, विवाहित, शैक्षिक, व्यावसायिक जीवन और परिवार पर मादक पदार्थ का प्रभाव और आपकी प्रतिक्रिया?",
  chief_complaints:
    "Chief complaints / मुख्य शिकायतें",
  substance_stop_tried:
    "How Many times tried to stop Substance dependency ?how many times Succeeded & for how much time? / कितनी बार मादक पदार्थों का सेवन बंद  के लिए?",
  coping_mechanisms:
    "Coping mechanism during stop using Substance / पदार्थ के उपयोग बंद करने के दौरान मुकाबला तंत्र",
  work_after_stop:
    " When Stopped using, what work did you do? (In life) / जब पदार्थ के उपयोग बंद कर दिया तो आपने क्या काम किया?(जीवन में)",
  influence_reason_to_stop:
    "What Influence made you stop? / किस प्रभाव ने आपको रुकने रुकने के लिए प्रेरित किया?",
  why_relapse:
    "If Relapse When? Why? With Whom? / यदि रिलैप्स हुए कब? क्यों? किसके साथ ?",
  substance_change_quantity:
    "After Relapse did you change your substance and is your Substance quantity increased? / रिलैप्स के बाद क्या आपने अपना मादक पदार्थ बदल दिया और क्या आपकी मादक पदार्थ मात्रा की बढ़ गई है?",
  mental_physical_disorders:
    "Have any mental or physical disorder any accident or injury /रोगी को कोई मानसिक या शारीरिक रोग है?दुर्घटना या चोट?",
  diagnosed_on_treatment:
    "Diagnosed on? Treatment? if took or Undergoing / बीमारी का पता कब चला? कोई उपचार लिया या चल रहा हो तो जानकारी",
  doctor_treatment_details:
    " Doctor, Place and duration & Result of Treatment? / चिकित्सक का नाम, अस्पताल, उपचार का समय और परिणाम?",
  traditional_healer_treatment:
    "If gone under any treatment for Substance abuse? (any Psychiatrist, baba, jadi buti, Religious etc) / क्या आपने मादक पदार्थ के सेवन के लिए कोई उपचार करवाया है? (किसी मनोचिकित्सक, बाबा, जड़ी बूटी, धार्मिक आदि से)",
  how_long_when:
    " If yes where? When? For how much Time? / अगर हाँ तो कहाँ? कब? कितने समय के लिए?",
  treatment_effect_result:
    "You familiar with treatment? Effect of the treatment? / क्या इलाज के बारे में आपको पहले पता था? परिणाम क्या रहा?",
};

  const [SUDBriefEditData, setSUDBriefEditData] = useState(null);
  const [SUDBriefeditModal, setSUDBriefeditModal] = useState(false);
  const handleSUDBriefindividualEdit = async (editSUDID = null) => {
    setSUDBriefeditModal(true);

    if (typeof editSUDID === "object" && editSUDID !== null) {
      editSUDID = editSUDID.intake_sud_id;
    }

    if (!editSUDID) {
      console.error("Invalid editSUDID provided");
      return;
    }

    console.log("SUD ID For Edit:", editSUDID);
    const token = localStorage.getItem("Authorization");

    try {
      const branch_id = selectedBranch;
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/intake-sud/assessment/${editSUDID}?branch_id=${branch_id}`,
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
        console.warn("No assessment found for this SUD ID.");
        return;
      }

      setSelectedUser(latestAssessment);
      console.log("Selected SUD User Assessment for edit:", latestAssessment);

      // ✅ Map payload into your form structure
      setSUDBriefEditData({
        intake_sud_id: latestAssessment.intake_sud_id,
        user_id: latestAssessment.user_id,
        entry_id: latestAssessment.entry_id,
        branch_id: latestAssessment.branch_id,
        visit_no: latestAssessment.visit_no,

        date_of_assessment: latestAssessment.date_of_assessment
          ? parseDateString(latestAssessment.date_of_assessment)
          : "",

        dependent_to: latestAssessment.dependent_to,
        recurrence_of_substance_use:
          latestAssessment.recurrence_of_substance_use,
        substance_daily_quantity: latestAssessment.substance_daily_quantity,
        last_30_days_quantity: latestAssessment.last_30_days_quantity,
        used_first_time: latestAssessment.used_first_time,
        duration_of_regular_use: latestAssessment.duration_of_regular_use,
        patient_monthly_income: latestAssessment.patient_monthly_income,
        monthly_family_income: latestAssessment.monthly_family_income,
        daily_spent_on_substance: latestAssessment.daily_spent_on_substance,
        source_of_money: latestAssessment.source_of_money,
        expense_more_than_income_arrangement:
          latestAssessment.expense_more_than_income_arrangement,
        substance_abuse_started_when:
          latestAssessment.substance_abuse_started_when,
        alcohol_tobacco_experience: latestAssessment.alcohol_tobacco_experience,
        first_substance_experience: latestAssessment.first_substance_experience,
        second_time_abuse_frequency:
          latestAssessment.second_time_abuse_frequency,
        mental_obsession_started_when:
          latestAssessment.mental_obsession_started_when,
        trauma_effect_on_substance_use:
          latestAssessment.trauma_effect_on_substance_use,
        regular_use_when_with_whom: latestAssessment.regular_use_when_with_whom,
        residence_status_regular_use:
          latestAssessment.residence_status_regular_use,
        friends_regular_use: latestAssessment.friends_regular_use,
        multiple_substances_early_stage:
          latestAssessment.multiple_substances_early_stage,
        touch_friends_current_relationship:
          latestAssessment.touch_friends_current_relationship,
        family_friends_reaction: latestAssessment.family_friends_reaction,
        substance_effect_physical: latestAssessment.substance_effect_physical,
        chief_complaints: latestAssessment.chief_complaints,
        prior_treatment: latestAssessment.prior_treatment,
        how_many_times: latestAssessment.how_many_times,
        treatment_records: latestAssessment.treatment_records || [],
        substance_stop_tried: latestAssessment.substance_stop_tried,
        coping_mechanisms: latestAssessment.coping_mechanisms,
        work_after_stop: latestAssessment.work_after_stop,
        influence_reason_to_stop: latestAssessment.influence_reason_to_stop,
        why_relapse: latestAssessment.why_relapse,
        substance_change_quantity: latestAssessment.substance_change_quantity,
        mental_physical_disorders: latestAssessment.mental_physical_disorders,
        diagnosed_on_treatment: latestAssessment.diagnosed_on_treatment,
        doctor_treatment_details: latestAssessment.doctor_treatment_details,
        traditional_healer_treatment:
          latestAssessment.traditional_healer_treatment,
        how_long_when: latestAssessment.how_long_when,
        treatment_effect_result: latestAssessment.treatment_effect_result,

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
      });

      console.log("Mapped Edit Data:", latestAssessment);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };



  // ✅ Update SUD Assessment Handler
const handleSUDBriefUpdate = async () => {
  if (!SUDBriefEditData?.intake_sud_id) {
    console.error("SUD ID is not available yet.");
    return;
  }

  console.log("SUD ID for update:", SUDBriefEditData.intake_sud_id);
  setIsLoading(true);

  // ✅ Build payload from full form data
  const payload = {
    dependent_to: SUDBriefEditData?.dependent_to || "",
    recurrence_of_substance_use: SUDBriefEditData?.recurrence_of_substance_use || null,
    substance_daily_quantity: SUDBriefEditData?.substance_daily_quantity || "",
    last_30_days_quantity: SUDBriefEditData?.last_30_days_quantity || "",
    used_first_time: SUDBriefEditData?.used_first_time || "",
    duration_of_regular_use: SUDBriefEditData?.duration_of_regular_use || "",
    patient_monthly_income: SUDBriefEditData?.patient_monthly_income || null,
    monthly_family_income: SUDBriefEditData?.monthly_family_income || null,
    daily_spent_on_substance: SUDBriefEditData?.daily_spent_on_substance || null,
    source_of_money: SUDBriefEditData?.source_of_money || "",
    expense_more_than_income_arrangement: SUDBriefEditData?.expense_more_than_income_arrangement || "",
    substance_abuse_started_when: SUDBriefEditData?.substance_abuse_started_when || "",
    alcohol_tobacco_experience: SUDBriefEditData?.alcohol_tobacco_experience || "",
    first_substance_experience: SUDBriefEditData?.first_substance_experience || "",
    second_time_abuse_frequency: SUDBriefEditData?.second_time_abuse_frequency || "",
    mental_obsession_started_when: SUDBriefEditData?.mental_obsession_started_when || "",
    trauma_effect_on_substance_use: SUDBriefEditData?.trauma_effect_on_substance_use || "",
    regular_use_when_with_whom: SUDBriefEditData?.regular_use_when_with_whom || "",
    residence_status_regular_use: SUDBriefEditData?.residence_status_regular_use || "",
    friends_regular_use: SUDBriefEditData?.friends_regular_use || "",
    multiple_substances_early_stage: SUDBriefEditData?.multiple_substances_early_stage || "",
    touch_friends_current_relationship: SUDBriefEditData?.touch_friends_current_relationship || "",
    family_friends_reaction: SUDBriefEditData?.family_friends_reaction || "",
    substance_effect_physical: SUDBriefEditData?.substance_effect_physical || "",
    chief_complaints: SUDBriefEditData?.chief_complaints || "",
    prior_treatment: SUDBriefEditData?.prior_treatment || "",
    how_many_times: SUDBriefEditData?.how_many_times || null,
    treatment_records:
      SUDBriefEditData?.treatment_records?.map((t) => ({
        treatment_year: t.treatment_year || "",
        treatment_place: t.treatment_place || "",
        treatment_duration: t.treatment_duration || "",
        days_of_sobriety: t.days_of_sobriety || "",
      })) || [],
    substance_stop_tried: SUDBriefEditData?.substance_stop_tried || "",
    coping_mechanisms: SUDBriefEditData?.coping_mechanisms || "",
    work_after_stop: SUDBriefEditData?.work_after_stop || "",
    influence_reason_to_stop: SUDBriefEditData?.influence_reason_to_stop || "",
    why_relapse: SUDBriefEditData?.why_relapse || "",
    substance_change_quantity: SUDBriefEditData?.substance_change_quantity || "",
    mental_physical_disorders: SUDBriefEditData?.mental_physical_disorders || "",
    diagnosed_on_treatment: SUDBriefEditData?.diagnosed_on_treatment || "",
    doctor_treatment_details: SUDBriefEditData?.doctor_treatment_details || "",
    traditional_healer_treatment: SUDBriefEditData?.traditional_healer_treatment || "",
    how_long_when: SUDBriefEditData?.how_long_when || "",
    treatment_effect_result: SUDBriefEditData?.treatment_effect_result || "",
  };

  try {
    const branch_id = selectedBranch; // from BranchContext
    const token = localStorage.getItem("Authorization");

    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/intake-sud/update-assessment/${SUDBriefEditData.intake_sud_id}?branch_id=${branch_id}`,
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
    console.log("✅ SUD Update Response:", data);
    console.log("📦 SUD Update Payload Sent:", payload);

    setIsLoading(false);

    Swal.fire({
      icon: "success",
      title: getTranslation("SUD Update Successfully!/SUD अद्यतन सफलतापूर्वक!",lang),
      text: getTranslation("Substance Use Dependency assessment has been updated successfully!/पदार्थ उपयोग निर्भरता मूल्यांकन सफलतापूर्वक अद्यतन किया गया है!",lang),
    }).then(() => {
      setSUDBriefeditModal(false); // ✅ Close modal after success
    });
  } catch (err) {
    console.error("❌ SUD Update Error:", err);
    setIsLoading(false);

    Swal.fire({
      icon: "error",
      title: getTranslation("Unexpected Error/अप्रत्याशित त्रुटि",lang),
      text: getTranslation("Failed to update SUD assessment. Check console for details./SUD मूल्यांकन अपडेट करने में विफल। विवरण के लिए कंसोल देखें।",lang),
    });
  }
};


  //Close all modal handler
  const closeAllmodal = () => {
    setIsSUDbriefModalOpen(false);
    setviewSUDBriefModal(false);
    setSUDBriefeditModal(false);
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
      filename: `user_data_${viewSUDBriefData?.name}_${viewSUDBriefData?.user_id}.pdf`,
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
                     {getTranslation(" Data is fetching from server. Please wait.../सर्वर से डेटा प्राप्त किया जा रहा है। कृपया प्रतीक्षा करें...",lang)}
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
                    <HeaderCard title={getTranslation("All Substance Use Dependenc Patient Data List/सभी पदार्थ उपयोग निर्भरता रोगी डेटा सूची",lang)} className="p-0" />
                  </div>
                  <div className="row pb-2">
                    <div className="col-md-4">
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
                  </div>
                  {stillLoading ? (
                    <div className="loading-text">
                     {getTranslation(" Data is fetching from server. Please wait.../सर्वर से डेटा प्राप्त किया जा रहा है। कृपया प्रतीक्षा करें...",lang)}
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

      {/* SUD Brief create form start */}
      <CommonModal
        isOpen={isSUDbriefModalOpen}
        title={getTranslation("Create Substance Use Dependency / मादक पदार्थ उपयोग निर्भरता",lang)}
        toggler={closeAllmodal}
        maxWidth="1200px"
      >
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
          <form className="theme-form" onSubmit={SubmitSUDBriefFormHandler}>
            <div class="row">
              <div class="col-md-6 mb-3">
                <Label className="col-sm-12 col-form-label  col-xl-6">
                  {getTranslation(dateOfAssessment,lang)}
                </Label>
                <Col xl="5" sm="12">
                  <div className="input-group">
                    <DatePicker showMonthDropdown showYearDropdown dropdownMode="select"
                      className="form-control digits"
                      selected={formData.dateOfAssessment}
                      onChange={(date) =>
                        handleAssesmentDateChange("dateOfAssessment", date)
                      }
                    />
                  </div>
                </Col>
              </div>

              <div class="col-md-6 mb-3">
                <div class="form-group">
                  <label class="form-label">
                    {getTranslation("Dependent To / निर्भरता का प्रकार",lang)}
                  </label>
                  <Input
                    name="dependent_to"
                    type="text"
                    class="form-control"
                    value={formData.dependent_to}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div class="col-md-6 mb-3">
                <div class="form-group">
                  <label class="form-label">
                    {getTranslation("Substance daily Quantity? / पदार्थ की दैनिक मात्रा?",lang)}
                  </label>
                  <Input
                    name="substance_daily_quantity"
                    type="text"
                    class="form-control"
                    value={formData.substance_daily_quantity}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div class="col-md-6 mb-3">
                <div class="form-group">
                  <label class="form-label">
                    {getTranslation("Used first time? / पहली बार पदार्थ कब लिया?",lang)}
                  </label>
                  <Input
                    name="used_first_time"
                    type="text"
                    class="form-control"
                    value={formData.used_first_time}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div class="col-md-6 mb-3">
                <div class="form-group">
                  <label class="form-label">
                    {getTranslation("Patient Month income / रोगी की मासिक आय",lang)}
                  </label>
                  <Input
                    name="patient_monthly_income"
                    type="text"
                    class="form-control"
                    value={formData.patient_monthly_income}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div class="col-md-6 mb-3">
                <div class="form-group">
                  <label class="form-label">
                    {getTranslation("Daily spent on substance? / पदार्थ पर प्रतिदिन खर्च?",lang)}
                  </label>
                  <Input
                    name="daily_spent_on_substance"
                    type="text"
                    class="form-control"
                    value={formData.daily_spent_on_substance}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div class="col-md-6 mb-3">
                <div class="form-group">
                  <label class="form-label">
                    {getTranslation("Recurrence of substance use / पदार्थ के प्रयोग की पुनरावृत्ति",lang)}
                  </label>
                  <Input
                    name="recurrence_of_substance_use"
                    type="text"
                    class="form-control"
                    value={formData.recurrence_of_substance_use}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div class="col-md-6 mb-3">
                <div class="form-group">
                  <label class="form-label">
                    {getTranslation("Last 30 days Quantity? / पिछले 30 दिनों की मात्रा?",lang)}
                  </label>
                  <Input
                    name="last_30_days_quantity"
                    type="text"
                    class="form-control"
                    value={formData.last_30_days_quantity}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div class="col-md-6 mb-3">
                <div class="form-group">
                  <label class="form-label">
                    {getTranslation("Duration of regular use? / नियमित सेवन कब कर रहे हैं?",lang)}
                  </label>
                  <Input
                    name="duration_of_regular_use"
                    type="text"
                    class="form-control"
                    value={formData.duration_of_regular_use}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div class="col-md-6 mb-3">
                <div class="form-group">
                  <label class="form-label">
                   {getTranslation(" Monthly family income / मासिक पारिवारिक आय",lang)}
                  </label>
                  <Input
                    name="monthly_family_income"
                    type="text"
                    class="form-control"
                    value={formData.monthly_family_income}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div class="col-md-6 mb-3">
                <div class="form-group">
                  <label class="form-label">
                    {getTranslation("Source of money? / पैसे का स्रोत:",lang)}
                  </label>
                  <Input
                    name="source_of_money"
                    type="text"
                    class="form-control"
                    value={formData.source_of_money}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* <!-- Full Width Inputs from here onward --> */}
            <div class="mb-3">
              <label class="form-label">
               {getTranslation(" If expenses more than income where do you arrange? / यदि आपके खर्च आय से ज्यादा हैं तो व्यवस्था कँहा से करते हैं?",lang)}
              </label>
              {/* <textarea
                name="expense_more_than_income_arrangement"
                class="form-control"
                rows="2"
                value={formData.expense_more_than_income_arrangement}
                onChange={handleInputChange}
              ></textarea> */}


<VoiceTextarea
      name="expense_more_than_income_arrangement"
      class="form-control"
      rows="2"
      value={formData.expense_more_than_income_arrangement}
      onChange={handleInputChange}
/>

            </div>

            <div class="mb-3">
              <label class="form-label">
               {getTranslation(" Substance abuse Started When? Why? Where? With Whom (No of Person)? Place? Substance? Quantity? Brand? / मादक पदार्थ कांपना सेवन कब शुरू हुआ? क्यों? कहाँ? किसके साथ (कितने लोग) ? स्थान? पदार्थ?मात्रा? ब्रांड?",lang)}
              </label>
              {/* <textarea
                name="substance_abuse_started_when"
                class="form-control"
                rows="3"
                value={formData.substance_abuse_started_when}
                onChange={handleInputChange}
              ></textarea> */}

<VoiceTextarea
      name="substance_abuse_started_when"
      class="form-control"
      rows="3"
      value={formData.substance_abuse_started_when}
      onChange={handleInputChange}
/>
            </div>

            <div class="mb-3">
              <label class="form-label">
                {getTranslation("If started with Tobacco after how much time you moved to other Substance (like Alcohol Ganja etc) & why? / यदि तम्बाकू से शुरुआत की थी तो कितने समय बाद आप अन्य मादक पदार्थ (जैसे शराब,गांजा आदि) की ओर चले गए और क्यों?",lang)}
              </label>
              {/* <textarea
                name="alcohol_tobacco_experience"
                class="form-control"
                rows="3"
                value={formData.alcohol_tobacco_experience}
                onChange={handleInputChange}
              ></textarea> */}

<VoiceTextarea
   name="alcohol_tobacco_experience"
   class="form-control"
   rows="3"
   value={formData.alcohol_tobacco_experience}
   onChange={handleInputChange}
/>

            </div>

            <div class="mb-3">
              <label class="form-label">
              {getTranslation("  How was your first experience of Substance abuse? / मादक पदार्थ के सेवन का आपका पहला अनुभव कैसा था?",lang)}
              </label>
              {/* <textarea
                name="first_substance_experience"
                class="form-control"
                rows="3"
                value={formData.first_substance_experience}
                onChange={handleInputChange}
              ></textarea> */}

<VoiceTextarea
   name="first_substance_experience"
   class="form-control"
   rows="3"
   value={formData.first_substance_experience}
   onChange={handleInputChange}
/>

            </div>

            <div class="mb-3">
              <label class="form-label">
               {getTranslation(" In how much time abuse Substance 2nd time & with whom? How often did you take Substance in the first year? / आपने कितनी बार और किसके साथ मिलकर दूसरी बार मादक पदार्थ का सेवन किया? आपने पहले वर्ष में कितनी बार मादक पदार्थ का सेवन किया?",lang)}
              </label>
              {/* <textarea
                name="second_time_abuse_frequency"
                class="form-control"
                rows="3"
                value={formData.second_time_abuse_frequency}
                onChange={handleInputChange}
              ></textarea> */}

<VoiceTextarea
   name="second_time_abuse_frequency"
   class="form-control"
   rows="3"
   value={formData.second_time_abuse_frequency}
   onChange={handleInputChange}
/>

            </div>

            <div class="mb-3">
              <label class="form-label">
                {getTranslation("Mental obsession for Substance started on? / मादक पदार्थ के प्रति मानसिक जुनून की शुरुआत कब हुयी?",lang)}
              </label>
              {/* <textarea
                name="mental_obsession_started_when"
                class="form-control"
                rows="3"
                value={formData.mental_obsession_started_when}
                onChange={handleInputChange}
              ></textarea> */}

<VoiceTextarea
   name="mental_obsession_started_when"
   class="form-control"
   rows="3"
   value={formData.mental_obsession_started_when}
   onChange={handleInputChange}
/>

            </div>

            <div class="mb-3">
              <label class="form-label">
                {getTranslation("Experienced any Trauma, if yes when & what, what effect on Substance use? Reason for regular use was shock/Trauma? कोई सदमा,यदि हाँ तो कब और क्या, मादक पदार्थ के उपयोग पर इसका क्या प्रभाव पड़ा? क्नियमित उपयोग का कारण सदमा था?",lang)}
              </label>
              {/* <textarea
                name="trauma_effect_on_substance_use"
                class="form-control"
                rows="3"
                value={formData.trauma_effect_on_substance_use}
                onChange={handleInputChange}
              ></textarea> */}

<VoiceTextarea
  name="trauma_effect_on_substance_use"
  class="form-control"
  rows="3"
  value={formData.trauma_effect_on_substance_use}
  onChange={handleInputChange}
/>

            </div>

            <div class="mb-3">
              <label class="form-label">
                {getTranslation("Why & When started Regular use & with Whom? / नियमित उपयोग क्यों और कब शुरू हुआ? किसके साथ ?",lang)}
              </label>
              {/* <textarea
                name="regular_use_when_with_whom"
                class="form-control"
                rows="3"
                value={formData.regular_use_when_with_whom}
                onChange={handleInputChange}
              ></textarea> */}

<VoiceTextarea
  name="regular_use_when_with_whom"
  class="form-control"
  rows="3"
  value={formData.regular_use_when_with_whom}
  onChange={handleInputChange}
/>

            </div>

            <div class="mb-3">
              <label class="form-label">
                {getTranslation("Residence status of patient when started regularly / ?नियमित रूप से शुरू होने पर रोगी की आवासीय स्थिति?",lang)}
              </label>
              {/* <textarea
                name="residence_status_regular_use"
                class="form-control"
                rows="3"
                value={formData.residence_status_regular_use}
                onChange={handleInputChange}
              ></textarea> */}

<VoiceTextarea
 name="residence_status_regular_use"
 class="form-control"
 rows="3"
 value={formData.residence_status_regular_use}
 onChange={handleInputChange}
/>

            </div>

            <div class="mb-3">
              <label class="form-label">
               {getTranslation(" list the friends with whom you started regular use. Were they are same friends you started with? / उन दोस्तों की सूची बनाएँ जिनके साथ आपने नियमित उपयोग शुरू किया था। क्या वे वही दोस्त थे जिनके साथ शुरुवात की ?",lang)}
              </label>
              {/* <textarea
                name="friends_regular_use"
                class="form-control"
                rows="3"
                value={formData.friends_regular_use}
                onChange={handleInputChange}
              ></textarea> */}

<VoiceTextarea
 name="friends_regular_use"
 class="form-control"
 rows="3"
 value={formData.friends_regular_use}
 onChange={handleInputChange}
/>

            </div>

            <div class="mb-3">
              <label class="form-label">
               {getTranslation(" if tried multiple Substance in early stage mention?(if yes why with whom?) / क्या आपने कई मादक पदार्थ का इस्तेमाल किया है?(यदि हां तो क्यों किसके साथ?)",lang)}
              </label>
              {/* <textarea
                name="multiple_substances_early_stage"
                class="form-control"
                rows="3"
                value={formData.multiple_substances_early_stage}
                onChange={handleInputChange}
              ></textarea> */}

<VoiceTextarea
 name="multiple_substances_early_stage"
 class="form-control"
 rows="3"
 value={formData.multiple_substances_early_stage}
 onChange={handleInputChange}
/>

            </div>

            <div class="mb-3">
              <label class="form-label">
                {getTranslation("Are you in touch with those friends with whom you initially used Substance ? Current relationship with those? Are they Dependent, social Dependent or Sober. / क्या आप उन दोस्तों के संपर्क में हैं जिनके साथ आपने शुरू में मादक पदार्थ लिया था? उनके साथ वर्तमान संबंध क्या हैं? क्या वे आश्रित, सामाजिक आश्रित या संयमित हैं?",lang)}
              </label>
              {/* <textarea
                name="touch_friends_current_relationship"
                class="form-control"
                rows="3"
                value={formData.touch_friends_current_relationship}
                onChange={handleInputChange}
              ></textarea> */}

<VoiceTextarea
 name="touch_friends_current_relationship"
 class="form-control"
 rows="3"
 value={formData.touch_friends_current_relationship}
 onChange={handleInputChange}
/>

            </div>

            <div class="mb-3">
              <label class="form-label">
                {getTranslation("What is reaction of family & friends (who are sober) when they know? What was reaction of patient? / जब परिवार और दोस्तों (जो संयमी हैं) को पता चला तो उनकी क्या प्रतिक्रिया थी? मरीज़ की क्या प्रतिक्रिया थी?",lang)}
              </label>
              {/* <textarea
                name="family_friends_reaction"
                class="form-control"
                rows="3"
                value={formData.family_friends_reaction}
                onChange={handleInputChange}
              ></textarea> */}

<VoiceTextarea
 name="family_friends_reaction"
 class="form-control"
 rows="3"
 value={formData.family_friends_reaction}
 onChange={handleInputChange}
/>

            </div>

            <div class="mb-3">
              <label class="form-label">
               {getTranslation(" Effect of Substance in Physical, personal, married, Educational, Professional Life & Family ? & Your Reaction? / शारीरिक, व्यक्तिगत, विवाहित, शैक्षिक, व्यावसायिक जीवन और परिवार पर मादक पदार्थ का प्रभाव और आपकी प्रतिक्रिया?",lang)}
              </label>
              {/* <textarea
                name="substance_effect_physical"
                class="form-control"
                rows="3"
                value={formData.substance_effect_physical}
                onChange={handleInputChange}
              ></textarea> */}

<VoiceTextarea
 name="substance_effect_physical"
 class="form-control"
 rows="3"
 value={formData.substance_effect_physical}
 onChange={handleInputChange}
/>

            </div>

            <div class="mb-3">
              <label class="form-label">
                {getTranslation("Chief Complaints: / मुख्य शिकायतें:",lang)}
              </label>
              {/* <textarea
                name="chief_complaints"
                class="form-control"
                rows="3"
                value={formData.chief_complaints}
                onChange={handleInputChange}
              ></textarea> */}

<VoiceTextarea
 name="chief_complaints"
 class="form-control"
 rows="3"
 value={formData.chief_complaints}
 onChange={handleInputChange}
/>

            </div>

            {/*  Prior Treatment for substance use Dependency / पदार्थ के उपयोग पर निर्भरता के लिए पूर्व उपचार start */}
            <div className="mb-4">
              <label className="form-label fw-bold">
               {getTranslation(" Prior Treatment for substance use Dependency / पदार्थ के उपयोग पर निर्भरता के लिए पूर्व उपचार",lang)}
              </label>

              <table className="table table-bordered">
                <thead className="table-light">
                  <tr>
                    <th colspan="2">
                      {getTranslation("Prior Treatment for substance use Dependency / पदार्थ के उपयोग पर निर्भरता के लिए पूर्व उपचार",lang)}
                    </th>
                    <th colspan="2">{getTranslation("How Many Times / कितनी बार?",lang)}</th>
                  </tr>
                  <tr>
                    <th>
                      {getTranslation("Year/वर्ष",lang)}
                      <br />
                     
                    </th>
                    <th>
                     {getTranslation(" Place of Treatment/उपचार का स्थान",lang)}
                      <br />
                     
                    </th>
                    <th>
                      {getTranslation("Duration & No. of Times/अवधि एवं संख्या",lang)}
                      <br />
                      
                    </th>
                    <th>
                     {getTranslation(" Days of Sobriety/संयमित दिन",lang)}
                      <br />
                       
                    </th>
                    <th>{getTranslation("Action/कार्रवाई",lang)}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={index}>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          value={row.treatment_year}
                          onChange={(e) =>
                            handleRowChange(
                              index,
                              "treatment_year",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          value={row.treatment_place}
                          onChange={(e) =>
                            handleRowChange(
                              index,
                              "treatment_place",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          value={row.treatment_duration}
                          onChange={(e) =>
                            handleRowChange(
                              index,
                              "treatment_duration",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          value={row.days_of_sobriety}
                          onChange={(e) =>
                            handleRowChange(
                              index,
                              "days_of_sobriety",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td>
                        {index === 0 ? (
                          <button
                            type="button"
                            className="btn btn-success btn-sm"
                            onClick={addRow}
                          >
                           {getTranslation(" Add/जोड़ना",lang)}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => deleteRow(index)}
                          >
                            {getTranslation("Delete/मिटाना",lang)}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/*  Prior Treatment for substance use Dependency / पदार्थ के उपयोग पर निर्भरता के लिए पूर्व उपचार end */}

            <div class="mb-3">
              <label class="form-label">
               {getTranslation(" How Many times tried to stop Substance dependency ?how many times Succeeded & for how much time? / कितनी बार मादक पदार्थों का सेवन बंद करने की कोशिश की? कितनी बार सफलता मिली और कितने समय के लिए?",lang)}
              </label>
              {/* <textarea
                name="substance_stop_tried"
                class="form-control"
                rows="3"
                value={formData.substance_stop_tried}
                onChange={handleInputChange}
              ></textarea> */}

<VoiceTextarea
 name="substance_stop_tried"
 class="form-control"
 rows="3"
 value={formData.substance_stop_tried}
 onChange={handleInputChange}
/>

            </div>

            <div class="mb-3">
              <label class="form-label">
                {" "}
                {getTranslation("Coping mechanism during stop using Substance / पदार्थ के उपयोग बंद करने के दौरान मुकाबला तंत्र",lang)}
              </label>
              {/* <textarea
                name="coping_mechanisms"
                class="form-control"
                rows="3"
                value={formData.coping_mechanisms}
                onChange={handleInputChange}
              ></textarea> */}

<VoiceTextarea
  name="coping_mechanisms"
  class="form-control"
  rows="3"
  value={formData.coping_mechanisms}
  onChange={handleInputChange}
/>

            </div>

            <div class="mb-3">
              <label class="form-label">
               {getTranslation(" When Stopped using, what work did you do? (In life) / जब पदार्थ के उपयोग बंद कर दिया तो आपने क्या काम किया?(जीवन में)",lang)}
              </label>
              {/* <textarea
                name="work_after_stop"
                class="form-control"
                rows="3"
                value={formData.work_after_stop}
                onChange={handleInputChange}
              ></textarea> */}

<VoiceTextarea
 name="work_after_stop"
 class="form-control"
 rows="3"
 value={formData.work_after_stop}
 onChange={handleInputChange}
/>

            </div>

            <div class="mb-3">
              <label class="form-label">
               {getTranslation(" What Influence made you stop? / किस प्रभाव ने आपको रुकने रुकने के लिए प्रेरित किया?",lang)}
              </label>
              {/* <textarea
                name="influence_reason_to_stop"
                class="form-control"
                rows="3"
                value={formData.influence_reason_to_stop}
                onChange={handleInputChange}
              ></textarea> */}

<VoiceTextarea
name="influence_reason_to_stop"
class="form-control"
rows="3"
value={formData.influence_reason_to_stop}
onChange={handleInputChange}
/>

            </div>

            <div class="mb-3">
              <label class="form-label">
               {getTranslation(" If Relapse When? Why? With Whom? / यदि रिलैप्स हुए कब? क्यों? किसके साथ ?",lang)}
              </label>
              {/* <textarea
                name="why_relapse"
                class="form-control"
                rows="3"
                value={formData.why_relapse}
                onChange={handleInputChange}
              ></textarea> */}

<VoiceTextarea
name="why_relapse"
class="form-control"
rows="3"
value={formData.why_relapse}
onChange={handleInputChange}
/>

            </div>

            <div class="mb-3">
              <label class="form-label">
              {getTranslation("  After Relapse did you change your substance and is your Substance quantity increased? / रिलैप्स के बाद क्या आपने अपना मादक पदार्थ बदल दिया और क्या आपकी मादक पदार्थ मात्रा की बढ़ गई है?",lang)}
              </label>
              {/* <textarea
                name="substance_change_quantity"
                class="form-control"
                rows="3"
                value={formData.substance_change_quantity}
                onChange={handleInputChange}
              ></textarea> */}

<VoiceTextarea
name="substance_change_quantity"
class="form-control"
rows="3"
value={formData.substance_change_quantity}
onChange={handleInputChange}
/>

            </div>

            <H4>{getTranslation("Patient Health / रोगी का स्वास्थ्य",lang)}</H4>

            <div class="mb-3">
              <label class="form-label">
                {" "}
               {getTranslation(" Have any mental or physical disorder any accident or injury / रोगी को कोई मानसिक या शारीरिक रोग है?दुर्घटना या चोट?",lang)}
              </label>
              {/* <textarea
                name="mental_physical_disorders"
                class="form-control"
                rows="3"
                value={formData.mental_physical_disorders}
                onChange={handleInputChange}
              ></textarea> */}

<VoiceTextarea
 name="mental_physical_disorders"
 class="form-control"
 rows="3"
 value={formData.mental_physical_disorders}
 onChange={handleInputChange}
/>

            </div>

            <div class="mb-3">
              <label class="form-label">
                {getTranslation("Diagnosed on? Treatment? if took or Undergoing / बीमारी का पता कब चला? कोई उपचार लिया या चल रहा हो तो जानकारी",lang)}
              </label>
              {/* <textarea
                name="diagnosed_on_treatment"
                class="form-control"
                rows="3"
                value={formData.diagnosed_on_treatment}
                onChange={handleInputChange}
              ></textarea> */}

<VoiceTextarea
 name="diagnosed_on_treatment"
 class="form-control"
 rows="3"
 value={formData.diagnosed_on_treatment}
 onChange={handleInputChange}
/>

            </div>

            <div class="mb-3">
              <label class="form-label">
                {getTranslation("Doctor, Place and duration & Result of Treatment? / चिकित्सक का नाम, अस्पताल, उपचार का समय और परिणाम?",lang)} {" "}
              </label>
              {/* <textarea
                name="doctor_treatment_details"
                class="form-control"
                rows="3"
                value={formData.doctor_treatment_details}
                onChange={handleInputChange}
              ></textarea> */}

<VoiceTextarea
 name="doctor_treatment_details"
 class="form-control"
 rows="3"
 value={formData.doctor_treatment_details}
 onChange={handleInputChange}
/>


            </div>

            <div class="mb-3">
              <label class="form-label">
               {getTranslation(" If gone under any treatment for Substance abuse? (any Psychiatrist, baba, jadi buti, Religious etc) / क्या आपने मादक पदार्थ के सेवन के लिए कोई उपचार करवाया है? (किसी मनोचिकित्सक, बाबा, जड़ी बूटी, धार्मिक आदि से)",lang)}
              </label>
              {/* <textarea
                name="traditional_healer_treatment"
                class="form-control"
                rows="3"
                value={formData.traditional_healer_treatment}
                onChange={handleInputChange}
              ></textarea> */}

<VoiceTextarea
  name="traditional_healer_treatment"
  class="form-control"
  rows="3"
  value={formData.traditional_healer_treatment}
  onChange={handleInputChange}
/>

            </div>

            <div class="mb-3">
              <label class="form-label">
                {getTranslation("If yes where? When? For how much Time? / अगर हाँ तो कहाँ? कब? कितने समय के लिए?",lang)}
              </label>
              {/* <textarea
                name="how_long_when"
                class="form-control"
                rows="3"
                value={formData.how_long_when}
                onChange={handleInputChange}
              ></textarea> */}

<VoiceTextarea
 name="how_long_when"
 class="form-control"
 rows="3"
 value={formData.how_long_when}
 onChange={handleInputChange}
/>

            </div>

            <div class="mb-3">
              <label class="form-label">
               {getTranslation(" You familiar with treatment? Effect of the treatment? / क्या इलाज के बारे में आपको पहले पता था? परिणाम क्या रहा?",lang)}
              </label>
              {/* <textarea
                name="treatment_effect_result"
                class="form-control"
                rows="3"
                value={formData.treatment_effect_result}
                onChange={handleInputChange}
              ></textarea> */}

<VoiceTextarea
 name="treatment_effect_result"
 class="form-control"
 rows="3"
 value={formData.treatment_effect_result}
 onChange={handleInputChange}
/>

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
                  getTranslation("Create SUD Brief/SUD संक्षिप्त विवरण बनाएँ",lang)
                )}
              </Button>
            </div>
          </form>
        </div>
      </CommonModal>
      {/* SUD Brief create form end */}

      {/* View SUD Brief data into modal start */}
      <CommonModal
        isOpen={viewSUDBriefModal}
        title={getTranslation("View Intake SUD Brief Assessmen/सेवन SUD संक्षिप्त मूल्यांकन देखें",lang)}
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
            {getTranslation("Substance Use Dependency / मादक पदार्थ उपयोग निर्भरता",lang)}
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
              ) : viewSUDBriefData ? (
                <>
                  <tr>
                    <th className="text-start p-3">{getTranslation("Name/नाम",lang)}</th>
                    <td className="border p-3">{viewSUDBriefData.name}</td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("Relative Name/रिश्तेदार का नाम",lang)}</th>
                    <td className="border p-3">
                      {viewSUDBriefData.relative_name}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("Gender/लिंग",lang)}</th>
                    <td className="border p-3">{viewSUDBriefData.gender}</td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("Phone/फ़ोन",lang)}</th>
                    <td className="border p-3">{viewSUDBriefData.phone}</td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("Email/ईमेल",lang)}</th>
                    <td className="border p-3">{viewSUDBriefData.email}</td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("Assessment Date/मूल्यांकन तिथि",lang)}</th>
                    <td className="border p-3">
                      {viewSUDBriefData.date_of_assessment
                        ? new Date(
                            viewSUDBriefData.date_of_assessment
                          ).toLocaleDateString()
                        : ""}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("Dependent To/आश्रित",lang)}</th>
                    <td className="border p-3">
                      {viewSUDBriefData.dependent_to}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">
                     {getTranslation("Recurrence of Substance Use/पदार्थ के उपयोग की पुनरावृत्ति",lang)}
                    </th>
                    <td className="border p-3">
                      {viewSUDBriefData.recurrence_of_substance_use}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("Daily Quantity/दैनिक मात्रा",lang)}</th>
                    <td className="border p-3">
                      {viewSUDBriefData.substance_daily_quantity}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("Last 30 Days Quantity/पिछले 30 दिनों की मात्रा",lang)}</th>
                    <td className="border p-3">
                      {viewSUDBriefData.last_30_days_quantity}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("First Use/पहला उपयोग",lang)}</th>
                    <td className="border p-3">
                      {viewSUDBriefData.used_first_time}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("Duration of Regular Use/नियमित उपयोग की अवधि",lang)}</th>
                    <td className="border p-3">
                      {viewSUDBriefData.duration_of_regular_use}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("Monthly Income/मासिक आय",lang)}</th>
                    <td className="border p-3">
                      {viewSUDBriefData.patient_monthly_income}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("Family Income/पारिवारिक आय",lang)}</th>
                    <td className="border p-3">
                      {viewSUDBriefData.monthly_family_income}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("Daily Spent on Substance/पदार्थ पर दैनिक खर्च",lang)}</th>
                    <td className="border p-3">
                      {viewSUDBriefData.daily_spent_on_substance}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("Source of Money/धन का स्रोत",lang)}</th>
                    <td className="border p-3">
                      {viewSUDBriefData.source_of_money}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("Expense Arrangement/व्यय व्यवस्था",lang)}</th>
                    <td className="border p-3">
                      {viewSUDBriefData.expense_more_than_income_arrangement}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("Substance Abuse Started/मादक द्रव्यों का सेवन शुरू",lang)}</th>
                    <td className="border p-3">
                      {viewSUDBriefData.substance_abuse_started_when}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">
                   {getTranslation(" Alcohol or Tobacco Experience/शराब या तंबाकू का अनुभव",lang)}
                    </th>
                    <td className="border p-3">
                      {viewSUDBriefData.alcohol_tobacco_experience}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("First Experience/पहला अनुभव",lang)}</th>
                    <td className="border p-3">
                      {viewSUDBriefData.first_substance_experience}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("Second Time Frequency/दूसरी बार आवृत्ति",lang)}</th>
                    <td className="border p-3">
                      {viewSUDBriefData.second_time_abuse_frequency}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("Mental Obsession Started/मानसिक जुनून शुरू हुआ",lang)}</th>
                    <td className="border p-3">
                      {viewSUDBriefData.mental_obsession_started_when}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("Chief Complaints/मुख्य शिकायतें",lang)}</th>
                    <td className="border p-3">
                      {viewSUDBriefData.chief_complaints}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-start p-3">{getTranslation("Status/स्थिति",lang)}</th>
                    <td className="border p-3">{viewSUDBriefData.status}</td>
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

        <div style={{ margin: "0 20px 20px 20px" }}>
          <button
            disabled={pfaDownload}
            id="download-btn"
            className="btn btn-primary"
            onClick={handleDownloadPDF}
          >
            {pfaDownload
              ? getTranslation("Your SUD Brief is being downloaded.../ आपका SUD डाउनलोड हो रहा है...",lang)
              : getTranslation("Download SUD Brief/SUD संक्षिप्त विवरण डाउनलोड करें",lang)}
          </button>

<button
                          className="btn btn-primary mx-3"
                          onClick={handlePrint}
                        >
                          {getTranslation("Print Your Data/अपना डेटा प्रिंट करें", lang)}
                        </button>

        </div>
      </CommonModal>
      {/* View SUD Brief data into modal end */}

      {/* Edit SUD Brief individual form data start */}
      {/* Edit FDA individual form data start */}
      <CommonModal
        isOpen={SUDBriefeditModal}
        title={getTranslation("Edit Create Substance Use Dependency / मादक पदार्थ उपयोग निर्भरता",lang)}
        toggler={closeAllmodal}
        maxWidth="1200px"
      >
        
         <div className="row px-3 pt-4 pb-3">
        <form onSubmit={(e) => {
          e.preventDefault();
          handleSUDBriefUpdate();
           
        }} className="theme-form">
          <div className="row">
            {/* Date of Assessment */}
            <div class="col-md-6 mb-3">
              <Label className="col-sm-12 col-form-label  col-xl-6">
                {getTranslation(dateOfAssessment,lang)}
              </Label>
              <Col xl="5" sm="12">
                <div className="input-group">
                  <DatePicker showMonthDropdown showYearDropdown dropdownMode="select"
                    className="form-control digits"
                    selected={SUDBriefEditData?.date_of_assessment}
                    onChange={(date) =>
                      setSUDBriefEditData((prev) => ({
                        ...prev,
                        date_of_assessment: date,
                      }))
                    }
                  />
                </div>
              </Col>
            </div>

            {/* Example Input */}
            <div className="col-md-6 mb-3">
              <div className="form-group">
              <label class="form-label">
                    {getTranslation("Dependent To / निर्भरता का प्रकार",lang)}
                  </label>
                <Input
                  type="text"
                  className="form-control"
                  value={SUDBriefEditData?.dependent_to || ""}
                  onChange={(e) =>
                    setSUDBriefEditData((prev) => ({
                      ...prev,
                      dependent_to: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {/* Repeat for ALL short inputs */}
            {[
              "substance_daily_quantity",
              "used_first_time",
              "patient_monthly_income",
              "daily_spent_on_substance",
              "recurrence_of_substance_use",
              "last_30_days_quantity",
              "duration_of_regular_use",
              "monthly_family_income",
              "source_of_money",
            ].map((field, idx) => (
              <div key={idx} className="col-md-6 mb-3">
                <div className="form-group">
                <label className="form-label">{getTranslation(fieldLabels[field],lang)}</label>
                  <Input
                    type="text"
                    className="form-control"
                    value={SUDBriefEditData?.[field] || ""}
                    onChange={(e) =>
                      setSUDBriefEditData((prev) => ({
                        ...prev,
                        [field]: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Textareas */}
          {[
            "expense_more_than_income_arrangement",
            "substance_abuse_started_when",
            "alcohol_tobacco_experience",
            "first_substance_experience",
            "second_time_abuse_frequency",
            "mental_obsession_started_when",
            "trauma_effect_on_substance_use",
            "regular_use_when_with_whom",
            "residence_status_regular_use",
            "friends_regular_use",
            "multiple_substances_early_stage",
            "touch_friends_current_relationship",
            "family_friends_reaction",
            "substance_effect_physical",
            "chief_complaints",
            "substance_stop_tried",
            "coping_mechanisms",
            "work_after_stop",
            "influence_reason_to_stop",
            "why_relapse",
            "substance_change_quantity",
            "mental_physical_disorders",
            "diagnosed_on_treatment",
            "doctor_treatment_details",
            "traditional_healer_treatment",
            "how_long_when",
            "treatment_effect_result",
          ].map((field, idx) => (
            <div key={idx} className="mb-3">
                <label className="form-label">{getTranslation(textareaLabels[field],lang)}</label>
              {/* <textarea
                className="form-control"
                rows="3"
                value={SUDBriefEditData?.[field] || ""}
                onChange={(e) =>
                  setSUDBriefEditData((prev) => ({
                    ...prev,
                    [field]: e.target.value,
                  }))
                }
              /> */}

<VoiceTextarea
      className="form-control"
      rows="3"
      value={SUDBriefEditData?.[field] || ""}
      onChange={(e) =>
        setSUDBriefEditData((prev) => ({
          ...prev,
          [field]: e.target.value,
        }))
      }
/>


            </div>
          ))}

          {/* Treatment Records */}
          <div className="mb-4">
            <label className="form-label fw-bold">
              {getTranslation("Prior Treatment for substance use Dependency/पदार्थ उपयोग निर्भरता के लिए पूर्व उपचार",lang)}
            </label>
            <table className="table table-bordered">
              <thead className="table-light">
                <tr>
                  <th>{getTranslation("Year/वर्ष",lang)}</th>
                  <th>{getTranslation("Place/जगह",lang)}</th>
                  <th>{getTranslation("Duration/अवधि",lang)}</th>
                  <th>{getTranslation("Days of Sobriety/संयम के दिन",lang)}</th>
                  <th>{getTranslation("Action/कार्रवाई",lang)}</th>
                </tr>
              </thead>
              <tbody>
                {SUDBriefEditData?.treatment_records?.map((row, index) => (
                  <tr key={index}>
                    {[
                      "treatment_year",
                      "treatment_place",
                      "treatment_duration",
                      "days_of_sobriety",
                    ].map((field, i) => (
                      <td key={i}>
                        <input
                          type="text"
                          className="form-control"
                          value={row[field] || ""}
                          onChange={(e) => {
                            const updated = [
                              ...SUDBriefEditData.treatment_records,
                            ];
                            updated[index][field] = e.target.value;
                            setSUDBriefEditData((prev) => ({
                              ...prev,
                              treatment_records: updated,
                            }));
                          }}
                        />
                      </td>
                    ))}
                    <td>
                      {index === 0 ? (
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          onClick={addRow}
                        >
                          {getTranslation("Add/जोड़ना",lang)}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => deleteRow(index)}
                        >
                          {getTranslation("Delete/मिटाना",lang)}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                getTranslation("Update SUD Brief/SUD संक्षिप्त अद्यतन",lang)
              )}
            </Button>
          </div>
        </form>
        </div>
      </CommonModal>
      {/* Edit SUD Brief individual form data end */}
    </Fragment>
  );
}

export default SUDBrief;
