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
import { H5 } from "../../AbstractElements";
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

function Legal() {

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
          const recentLegalData = user.recent_intake_legal_history_date
            ? new Date(user.recent_intake_legal_history_date)
            : null;

            let isLegalCompleted = false;

          let userStatus = (
            <p className="badge bg-warning text-dark p-2">{getTranslation("Pending/लंबित",lang)}</p>
          );
          if (admitDate && recentLegalData && admitDate > recentLegalData) {
            isLegalCompleted = true;
            userStatus = <p className="badge bg-success p-2">{getTranslation("Completed/पुरा होना।",lang)}</p>;
          }

          const dischargeStatus = user.discharge_status_text || "Unknown";

          return {
            id: user.user_id,
            gks_id: user.gks_id || "N/A",
            name: user.name,
            legalRecentIds: user.recent_intake_legal_history_id,
            status: userStatus,
            isLegalCompleted,
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
                onClick={() => handleLegalPreFill(row.legalRecentIds)}
                style={{ cursor: "pointer" }}
                title={getTranslation("Readmission Legal Form/पुनः प्रवेश कानूनी प्रपत्र",lang)}
              >
                ✏️
              </span>
            )}

{/* <span
                onClick={() => handleLegalPreFill(row.legalRecentIds)}
                style={{ cursor: "pointer" }}
                title="Readmission FDA Form"
              >
                ✏️
              </span> */}

            {/* Show Create PFA if not discharged and not readmission */}
            {/* {row.dischargeStatus === 0 && row.isReadmission === 0 && (
              <span
                onClick={() => createLegalForm(row.id)}
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
    onClick={() => (row.isLegalCompleted ? null : createLegalForm(row.id))}
    style={{
      cursor: row.isLegalCompleted ? "not-allowed" : "pointer",
      opacity: row.isLegalCompleted ? 0.5 : 1,
    }}
    title={row.isLegalCompleted ? getTranslation("Legal Completed/कानूनी रूप से पूर्ण",lang) : getTranslation("Create Legal Form/कानूनी प्रपत्र बनाएँ",lang)}
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
      `https://gks-yjdc.onrender.com/api/intake-legal-history/all-entries?branch_id=${selectedBranch}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      }
    )
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch Legal History entries");
        return response.json();
      })
      .then((res) => {
        const legalEntries = res.data || [];
  
        const formattedLegalPatients = legalEntries.map((item) => ({
          // top level
          ilh_id: item.ilh_id,
          status: item.status,
  
          // user details
          user_id: item.user_id,
          name: item.name || "",
          phone: item.phone || "",
          email: item.email || "",
          dob: item.dob || null,
          gender: item.gender || "",
          gks_id: item.gks_id || "",
          custom_code: item.custom_code || "",
          branch_name: item.branch_name || "",
  
          // entry details
          entry_id: item.entry_id,
          visit_no: item.visit_no,
          admit_date: item.admit_date || null,
          ward_name: item.ward_name || "",
  
          // legal assessment details
          date_of_assessment: item.date_of_assessment || null,
          domestic_violence_case: item.domestic_violence_case || "",
          reason_behind_domestic_violence:
            item.reason_behind_domestic_violence || "",
          drug_status_quantity_at_time: item.drug_status_quantity_at_time || "",
          any_criminal_case: item.any_criminal_case || "",
          case_details_specify: item.case_details_specify || "",
          current_case_status: item.current_case_status || "",
          drug_status_quantity_current: item.drug_status_quantity_current || "",
          jail_period_duration: item.jail_period_duration || "",
  
          // audit
          created_at: item.created_at || null,
          updated_at: item.updated_at || null,
        }));
  
        console.log("Formatted Legal History Patients:", formattedLegalPatients);
  
        setTimeout(() => {
          setfdaData(formattedLegalPatients); // 👈 or setLegalData if you want clearer naming
          setFilteredDataone(formattedLegalPatients);
          setstillLoading(false);
        }, 500);
      })
      .catch((error) => {
        console.error("Error fetching Legal History entries:", error);
        setstillLoading(true);
      });
  }, [selectedBranch]);
  

  const tableColumnsFDAList = [
    {
      name: `${getTranslation('Legal ID/कानूनी आईडी' , lang)}`,
      selector: (row) => row.ilh_id,
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
          <p className="badge bg-success p-2">Legal {row.status}</p>
        </span>
      ),
    },
    {
      name: `${getTranslation('Action/क्रिया' , lang)}`,
      center: true,
      cell: (row) => (
        <div className="d-flex gap-2">
          <span
            onClick={() => viewLegalFormData(row.ilh_id)}
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
            onClick={() => handleLegalindividualEdit(row.ilh_id)}
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

  //spinner extract from other file
  const selectedSpinner = Data.find(
    (item) => item.spinnerClass === "loader-37"
  );
  //Loading spinner
  const [isLoading, setIsLoading] = useState(false);
  //Create SUD brief form function start
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const createLegalForm = async (userId = null) => {
    setIsLegalModalOpen(true);
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
  //Create SUD brief form function end

  // ✅ Submit Legal Form Data Start
  // ✅ Legal History form data state
  const [formData, setFormData] = useState({
    dateOfAssessment: new Date(),
    domestic_violence_case: "",
    reason_behind_domestic_violence: "",
    drug_status_quantity_at_time: "",
    any_criminal_case: "",
    case_details_specify: "",
    current_case_status: "",
    drug_status_quantity_current: "",
    jail_period_duration: "",
  });

  // ✅ Universal input change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const SubmitLegalFormHandler = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Start loader

    const payload = {
      user_id: selectedUser?.user_id, // ✅ corrected
      date_of_assessment: formData.dateOfAssessment
        ? formData.dateOfAssessment.toISOString().split("T")[0] // YYYY-MM-DD
        : null,

      // ✅ Map formData fields to correct API keys
      domestic_violence_case: formData.domestic_violence_case || "",
      reason_behind_domestic_violence:
        formData.reason_behind_domestic_violence || "",
      drug_status_quantity_at_time: formData.drug_status_quantity_at_time || "",
      any_criminal_case: formData.any_criminal_case || "",
      case_details_specify: formData.case_details_specify || "",
      current_case_status: formData.current_case_status || "",
      drug_status_quantity_current: formData.drug_status_quantity_current || "",
      jail_period_duration: formData.jail_period_duration || "",
    };

    try {
      const token = localStorage.getItem("Authorization");
      const branch_id = selectedBranch;

      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/intake-legal-history/create-assessment?branch_id=${branch_id}`,
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
        title: getTranslation("Legal History Created Successfully/कानूनी इतिहास सफलतापूर्वक रचा गया",lang),
        text: getTranslation("The Legal History assessment was submitted successfully./कानूनी इतिहास मूल्यांकन सफलतापूर्वक प्रस्तुत किया गया।",lang),
      }).then(() => setIsLegalModalOpen(false));

      console.log("✅ Legal History Data", data);
      console.log("📦 Legal History Payload Sent", payload);
    } catch (err) {
      console.error("❌ Legal History Submit Error:", err);
      setIsLoading(false);
      Swal.fire({
        icon: "error",
        title: getTranslation("Unexpected Error/अप्रत्याशित त्रुटि",lang),
        text: getTranslation("Failed to submit Legal History. Check console for error./कानूनी इतिहास सबमिट करने में विफल. त्रुटि के लिए कंसोल की जाँच करें.",lang),
      });
    }
  };
  // ✅ Submit Legal Form Data End


  // View legal data handler start
const [viewLegalData, setViewLegalData] = useState(null);
const [viewLegalModal, setViewLegalModal] = useState(false);

const viewLegalFormData = async (LegalID) => {
  setViewLegalModal(true);
  console.log("Legal ID =>", LegalID);

  if (typeof LegalID === "object" && LegalID !== null) {
    LegalID = LegalID.ilh_id;
  }

  if (!LegalID) {
    console.error("Invalid Legal ID provided");
    return;
  }

  setIsLoading(true);
  const token = localStorage.getItem("Authorization");

  try {
    const branch_id = selectedBranch;
    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/intake-legal-history/assessment/${LegalID}?branch_id=${branch_id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      }
    );

    const data = await response.json();
    console.log("Raw Legal API Response:", data);

    if (!response.ok) {
      console.error("Fetch error:", data);
      return;
    }

    const ViewLegalDataEntry = data.data || null;
    console.log("Extracted Legal Data Entry:", ViewLegalDataEntry);

    if (!ViewLegalDataEntry) {
      console.warn("No Legal assessment data found.");
      return;
    }

    setViewLegalData(ViewLegalDataEntry);
  } catch (error) {
    console.error("Fetch error:", error);
  } finally {
    setIsLoading(false);
  }
};
// View legal data handler end



// Edit Legal data handler start
const [LegalEditData, setLegalEditData] = useState(null);
const [LegalEditModal, setLegalEditModal] = useState(false);

const handleLegalindividualEdit = async (editLegalID = null) => {
  setLegalEditModal(true);

  if (typeof editLegalID === "object" && editLegalID !== null) {
    editLegalID = editLegalID.ilh_id; // ✅ correct key for Legal
  }

  if (!editLegalID) {
    console.error("Invalid editLegalID provided");
    return;
  }

  console.log("Legal ID For Edit:", editLegalID);
  const token = localStorage.getItem("Authorization");

  try {
    const branch_id = selectedBranch;
    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/intake-legal-history/assessment/${editLegalID}?branch_id=${branch_id}`,
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

    // ✅ pick from data.data
    const latestAssessment = data.data || null;

    if (!latestAssessment) {
      console.warn("No legal history found for this ID.");
      return;
    }

    setSelectedUser(latestAssessment);
    console.log("Selected Legal User Assessment for edit:", latestAssessment);

    // ✅ Map payload into your form structure
    setLegalEditData({
      ilh_id: latestAssessment.ilh_id,
      user_id: latestAssessment.user_id,
      entry_id: latestAssessment.entry_id,
      branch_id: latestAssessment.branch_id,
      visit_no: latestAssessment.visit_no,

      date_of_assessment: latestAssessment.date_of_assessment
        ? new Date(latestAssessment.date_of_assessment).toISOString().split("T")[0]
        : "",

      domestic_violence_case: latestAssessment.domestic_violence_case || "",
      reason_behind_domestic_violence: latestAssessment.reason_behind_domestic_violence || "",
      drug_status_quantity_at_time: latestAssessment.drug_status_quantity_at_time || "",
      any_criminal_case: latestAssessment.any_criminal_case || "",
      case_details_specify: latestAssessment.case_details_specify || "",
      current_case_status: latestAssessment.current_case_status || "",
      drug_status_quantity_current: latestAssessment.drug_status_quantity_current || "",
      jail_period_duration: latestAssessment.jail_period_duration || "",

      status: latestAssessment.status,
      isActive: latestAssessment.isActive,
      created_by: latestAssessment.created_by,
      updated_by: latestAssessment.updated_by,
      created_at: latestAssessment.created_at,
      updated_at: latestAssessment.updated_at,

      // user details
      name: latestAssessment.name || "",
      phone: latestAssessment.phone || "",
      email: latestAssessment.email || "",
      dob: latestAssessment.dob || "",
      gender: latestAssessment.gender || "",
      address: latestAssessment.address || "",
      branch_name: latestAssessment.branch_name || "",
      custom_code: latestAssessment.custom_code || "",
      admit_date: latestAssessment.admit_date || "",
      ward_name: latestAssessment.ward_name || "",
    });

    console.log("Mapped Legal Edit Data:", latestAssessment);
  } catch (error) {
    console.error("Fetch error:", error);
  }
};
// Edit Legal data handler end


// ✅ Update Legal History Handler
const handleLegalUpdate = async () => {
  if (!LegalEditData?.ilh_id) {
    console.error("Legal History ID is not available yet.");
    return;
  }

  console.log("📝 Legal History ID for update:", LegalEditData.ilh_id);
  setIsLoading(true);

  // ✅ Build payload for Legal History update
  const payload = {
    user_id: LegalEditData?.user_id || null,
    date_of_assessment: LegalEditData?.date_of_assessment
      ? new Date(LegalEditData.date_of_assessment).toISOString().split("T")[0] // YYYY-MM-DD
      : null,
    domestic_violence_case: LegalEditData?.domestic_violence_case || "",
    reason_behind_domestic_violence:
      LegalEditData?.reason_behind_domestic_violence || "",
    drug_status_quantity_at_time:
      LegalEditData?.drug_status_quantity_at_time || "",
    any_criminal_case: LegalEditData?.any_criminal_case || "",
    case_details_specify: LegalEditData?.case_details_specify || "",
    current_case_status: LegalEditData?.current_case_status || "",
    drug_status_quantity_current:
      LegalEditData?.drug_status_quantity_current || "",
    jail_period_duration: LegalEditData?.jail_period_duration || "",
  };

  try {
    const branch_id = selectedBranch; // ✅ from BranchContext
    const token = localStorage.getItem("Authorization");

    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/intake-legal-history/update-assessment/${LegalEditData.ilh_id}?branch_id=${branch_id}`,
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
    console.log("✅ Legal History Update Response:", data);
    console.log("📦 Payload Sent:", payload);

    setIsLoading(false);

    Swal.fire({
      icon: "success",
      title: getTranslation("Legal History Updated Successfully!/कानूनी इतिहास सफलतापूर्वक अपडेट किया गया!",lang),
      text: getTranslation("Patient's legal history has been updated successfully!/रोगी का कानूनी इतिहास सफलतापूर्वक अद्यतन कर दिया गया है!",lang),
    }).then(() => {
      setLegalEditModal(false); // ✅ Close modal after success
    });
  } catch (err) {
    console.error("❌ Legal Update Error:", err);
    setIsLoading(false);

    Swal.fire({
      icon: "error",
      title: getTranslation("Unexpected Error/अप्रत्याशित त्रुटि",lang),
      text: getTranslation("Failed to update Legal History. Check console for details./कानूनी इतिहास अपडेट करने में विफल. विवरण के लिए कंसोल देखें.",lang),
    });
  }
};


// Prefill Legal History form handler start
const [LegalPrefillData, setLegalPrefillData] = useState({});
const [LegalPrefillModal, setLegalPrefillModal] = useState(false);

const handleLegalPreFill = async (prefillLegalID = null) => {
  // Normalize ID if object
  if (typeof prefillLegalID === "object" && prefillLegalID !== null) {
    prefillLegalID = prefillLegalID.ilh_id || prefillLegalID.entry_id;
  }

  if (!prefillLegalID) {
    Swal.fire({
      icon: "warning",
      title: getTranslation("Missing Legal ID/कानूनी आईडी गुम होना",lang),
      text: getTranslation("No valid Legal History ID was provided for prefill./प्रीफ़िल के लिए कोई वैध कानूनी इतिहास आईडी प्रदान नहीं की गई थी।",lang),
    });
    return;
  }

  console.log("Legal ID For Prefill:", prefillLegalID);
  const token = localStorage.getItem("Authorization");

  try {
    const branch_id = selectedBranch;
    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/intake-legal-history/assessment/${prefillLegalID}?branch_id=${branch_id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      }
    );

    const data = await response.json();
    console.log("Raw Legal API Response:", data);

    if (!response.ok) {
      Swal.fire({
        icon: "error",
        title: getTranslation("Fetch Failed/प्राप्त करना विफल",lang),
        text: data.message || getTranslation("Unable to fetch Legal data for prefill./प्रीफ़िल के लिए कानूनी डेटा प्राप्त करने में असमर्थ.",lang),
      });
      return;
    }

    const latestAssessment = data.data || null;
    if (!latestAssessment) {
      Swal.fire({
        icon: "info",
        title: getTranslation("No Data Found/डाटा प्राप्त नहीं हुआ",lang),
        text: getTranslation("No Legal data available for this ID./इस आईडी के लिए कोई कानूनी डेटा उपलब्ध नहीं है।",lang),
      });
      return;
    }

    // ✅ Open modal only when we have valid data
    setLegalPrefillModal(true);

    // ✅ Wrap in array so PatientCommonInfo works
    setSelectedUser([latestAssessment]);

    // ✅ Build mapped data for Legal History
    const mappedData = {
      ilh_id: latestAssessment.ilh_id,
      user_id: latestAssessment.user_id,
      entry_id: latestAssessment.entry_id,
      branch_id: latestAssessment.branch_id,
      visit_no: latestAssessment.visit_no,

      date_of_assessment: latestAssessment.date_of_assessment
        ? new Date(latestAssessment.date_of_assessment)
        : null,

      domestic_violence_case: latestAssessment.domestic_violence_case || "",
      reason_behind_domestic_violence:
        latestAssessment.reason_behind_domestic_violence || "",
      drug_status_quantity_at_time:
        latestAssessment.drug_status_quantity_at_time || "",
      any_criminal_case: latestAssessment.any_criminal_case || "",
      case_details_specify: latestAssessment.case_details_specify || "",
      current_case_status: latestAssessment.current_case_status || "",
      drug_status_quantity_current:
        latestAssessment.drug_status_quantity_current || "",
      jail_period_duration: latestAssessment.jail_period_duration || "",

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

    setLegalPrefillData(mappedData);

    console.log("Mapped Legal Prefill Data:", mappedData);
  } catch (error) {
    console.error("Prefill fetch error:", error);
    Swal.fire({
      icon: "error",
      title: getTranslation("Network Error/नेटवर्क त्रुटि",lang),
      text: getTranslation("Unable to fetch Legal data due to a network issue./नेटवर्क समस्या के कारण कानूनी डेटा प्राप्त करने में असमर्थ.",lang),
    });
  }
};
// Prefill Legal History form handler end


// Legal readmission form handler start
const SubmitLegalReadmissionFormHandler = async (e) => {
  e.preventDefault();
  setIsLoading(true); // Start loader

  const payload = {
    user_id: LegalPrefillData?.user_id, // ✅ corrected
    date_of_assessment: LegalPrefillData.date_of_assessment
      ? new Date(LegalPrefillData.date_of_assessment)
          .toISOString()
          .split("T")[0] // YYYY-MM-DD
      : null,

    // ✅ Map LegalPrefillData fields to correct API keys
    domestic_violence_case: LegalPrefillData.domestic_violence_case || "",
    reason_behind_domestic_violence:
      LegalPrefillData.reason_behind_domestic_violence || "",
    drug_status_quantity_at_time:
      LegalPrefillData.drug_status_quantity_at_time || "",
    any_criminal_case: LegalPrefillData.any_criminal_case || "",
    case_details_specify: LegalPrefillData.case_details_specify || "",
    current_case_status: LegalPrefillData.current_case_status || "",
    drug_status_quantity_current:
      LegalPrefillData.drug_status_quantity_current || "",
    jail_period_duration: LegalPrefillData.jail_period_duration || "",
  };

  try {
    const token = localStorage.getItem("Authorization");
    const branch_id = selectedBranch;

    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/intake-legal-history/create-assessment?branch_id=${branch_id}`,
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
      title: getTranslation("Legal History Created Successfully/कानूनी इतिहास सफलतापूर्वक रचा गया",lang),
      text: getTranslation("The Legal History readmission form was submitted successfully./कानूनी इतिहास पुनः प्रवेश फॉर्म सफलतापूर्वक प्रस्तुत किया गया।",lang),
    }).then(() => setLegalPrefillModal(false)); // ✅ close prefill modal

    console.log("✅ Legal History Data", data);
    console.log("📦 Legal History Payload Sent", payload);
  } catch (err) {
    console.error("❌ Legal History Submit Error:", err);
    setIsLoading(false);
    Swal.fire({
      icon: "error",
      title: getTranslation("Unexpected Error/अप्रत्याशित त्रुटि",lang),
      text: getTranslation("Failed to submit Legal History. Check console for error./कानूनी इतिहास सबमिट करने में विफल. त्रुटि के लिए कंसोल की जाँच करें.",lang),
    });
  }
};
// Legal readmission form handler end




  //Close all modal handler
  const closeAllmodal = () => {
    setIsLegalModalOpen(false);
    setViewLegalModal(false);
    setLegalEditModal(false);
    setLegalPrefillModal(false);
  };

  const handleAssessmentDateChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      dateOfAssessment: date,
    }));
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
                    <HeaderCard title={getTranslation("All Legal History Patient Data List/सभी कानूनी इतिहास रोगी डेटा सूची",lang)} className="p-0" />
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

      {/* SUD Brief create form start */}
      <CommonModal
        isOpen={isLegalModalOpen}
        title={getTranslation(`Create ${legalHistory}`,lang)}
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
          <form className="theme-form" onSubmit={SubmitLegalFormHandler}>
            <div class="col-md-6 mb-3">
              <Label className="col-sm-12 col-form-label  col-xl-6">
                {getTranslation(dateOfAssessment,lang)}
              </Label>
              <Col xl="5" sm="12">
                <div className="input-group">
                  <DatePicker
                    className="form-control digits"
                    selected={formData.dateOfAssessment}
                    onChange={(date) =>
                      handleAssessmentDateChange("dateOfAssessment", date)
                    }
                  />
                </div>
              </Col>
            </div>

            {/* Legal History Start */}
            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{getTranslation(domesticViolence,lang)}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="domestic_violence_case"
                  value={formData.domestic_violence_case || ""}
                  onChange={handleChange}
                />
              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{getTranslation(reasonBehindDomesticViolence,lang)}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="reason_behind_domestic_violence"
                  value={formData.reason_behind_domestic_violence || ""}
                  onChange={handleChange}
                />
              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{getTranslation(drugStatus,lang)}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="drug_status_quantity_at_time"
                  value={formData.drug_status_quantity_at_time || ""}
                  onChange={handleChange}
                />
              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{getTranslation(ifThereIsAnyCriminalCase,lang)}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="any_criminal_case"
                  value={formData.any_criminal_case || ""}
                  onChange={handleChange}
                />
              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{getTranslation(specificCaseDetails,lang)}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="case_details_specify"
                  value={formData.case_details_specify || ""}
                  onChange={handleChange}
                />
              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{getTranslation(currentCaseStatus,lang)}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="current_case_status"
                  value={formData.current_case_status || ""}
                  onChange={handleChange}
                />
              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{getTranslation(drugStatus,lang)}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="drug_status_quantity_current"
                  value={formData.drug_status_quantity_current || ""}
                  onChange={handleChange}
                />
              </FormGroup>
            </div>

            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{getTranslation(ifWentToJail,lang)}</Label>
                <Input
                  type="textarea"
                  className="form-control"
                  rows="3"
                  name="jail_period_duration"
                  value={formData.jail_period_duration || ""}
                  onChange={handleChange}
                />
              </FormGroup>
            </div>
            {/* Legal History End */}

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
              getTranslation("Create Legal History / कानूनी इतिहास बनाएँ",lang)
            )}
          </Button>
        </div>
          </form>
        </div>
        
      </CommonModal>
      {/* SUD Brief create form end */}

     {/* View Legal History data into modal start */}
<CommonModal
  isOpen={viewLegalModal}
  title={getTranslation("View Legal History/कानूनी इतिहास देखें",lang)}
  toggler={closeAllmodal}
  maxWidth="1200px"
>
  <div className="table-responsive p-4">
    <h4
      style={{
        textAlign: "center",
        textDecoration: "underline",
        padding: "20px 0",
      }}
    >
      {getTranslation("Legal History / लीगल इतिहास",lang)}
    </h4>

    <Table size="sm" className="table-auto table-bordered">
      <tbody style={{ fontSize: "14px" }}>
        {isLoading ? (
          <tr>
            <td colSpan="2" className="text-center">
              <Spinner className={selectedSpinner?.spinnerClass || "spinner-border"} />
            </td>
          </tr>
        ) : viewLegalData ? (
          <>
            <tr>
              <th className="text-start p-3">{getTranslation("Name/नाम",lang)}</th>
              <td className="border p-3">{viewLegalData.name}</td>
            </tr>
            <tr>
              <th className="text-start p-3">{getTranslation("Gender/लिंग",lang)}</th>
              <td className="border p-3">{viewLegalData.gender}</td>
            </tr>
            <tr>
              <th className="text-start p-3">{getTranslation("Phone/फ़ोन",lang)}</th>
              <td className="border p-3">{viewLegalData.phone}</td>
            </tr>
            <tr>
              <th className="text-start p-3">{getTranslation("Email/ईमेल",lang)}</th>
              <td className="border p-3">{viewLegalData.email}</td>
            </tr>
            <tr>
              <th className="text-start p-3">{getTranslation("Assessment Date/मूल्यांकन तिथि",lang)}</th>
              <td className="border p-3">
                {viewLegalData.date_of_assessment
                  ? new Date(viewLegalData.date_of_assessment).toLocaleDateString()
                  : ""}
              </td>
            </tr>
            <tr>
              <th className="text-start p-3">{getTranslation("Domestic Violence Case/घरेलू हिंसा का मामला",lang)}</th>
              <td className="border p-3">{viewLegalData.domestic_violence_case}</td>
            </tr>
            <tr>
              <th className="text-start p-3">{getTranslation("Reason Behind Domestic Violence/घरेलू हिंसा के पीछे का कारण",lang)}</th>
              <td className="border p-3">{viewLegalData.reason_behind_domestic_violence}</td>
            </tr>
            <tr>
              <th className="text-start p-3">{getTranslation("Drug Status Quantity (At Time)/दवा की स्थिति मात्रा (समय पर)",lang)}</th>
              <td className="border p-3">{viewLegalData.drug_status_quantity_at_time}</td>
            </tr>
            <tr>
              <th className="text-start p-3">{getTranslation("Any Criminal Case/कोई भी आपराधिक मामला",lang)}</th>
              <td className="border p-3">{viewLegalData.any_criminal_case}</td>
            </tr>
            <tr>
              <th className="text-start p-3">{getTranslation("Case Details/मामले का विवरण",lang)}</th>
              <td className="border p-3">{viewLegalData.case_details_specify}</td>
            </tr>
            <tr>
              <th className="text-start p-3">{getTranslation("Current Case Status/वर्तमान मामले की स्थिति",lang)}</th>
              <td className="border p-3">{viewLegalData.current_case_status}</td>
            </tr>
            <tr>
              <th className="text-start p-3">{getTranslation("Drug Status Quantity (Current)/दवा की स्थिति मात्रा (वर्तमान)",lang)}</th>
              <td className="border p-3">{viewLegalData.drug_status_quantity_current}</td>
            </tr>
            <tr>
              <th className="text-start p-3">{getTranslation("Jail Period Duration/जेल की अवधि",lang)}</th>
              <td className="border p-3">{viewLegalData.jail_period_duration}</td>
            </tr>
            <tr>
              <th className="text-start p-3">{getTranslation("Status/स्थिति",lang)}</th>
              <td className="border p-3">{viewLegalData.status}</td>
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
</CommonModal>
{/* View Legal History data into modal end */}

{/* Legal update form start */}
<CommonModal
  isOpen={LegalEditModal}
  title={getTranslation(`Edit ${legalHistory}`,lang)}
  toggler={closeAllmodal}
  maxWidth="1200px"
>
  {/* <PatientCommonInfo
    selectedUser={selectedUser}
    labels={{
      name: "Patient name/प्रयासक का नाम :",
      sex: "Gender/प्रयासक का लिंग :",
      age: "Age/प्रयासक का उम्र :",
      date_of_admission: "Date of Admission/प्रवेश की तिथि :",
      ageValue: patientCalAge,
    }}
  /> */}

  <div className="row px-3 pt-4 pb-3">
    <form className="theme-form" onSubmit={(e)=>{
      e.preventDefault();
      handleLegalUpdate();
    }}>
      {/* Date of Assessment */}
      <div className="col-md-6 mb-3">
        <Label className="col-sm-12 col-form-label col-xl-6">
          {getTranslation(dateOfAssessment,lang)}
        </Label>
        <Col xl="5" sm="12">
          <div className="input-group">
            <DatePicker
              className="form-control digits"
              selected={
                LegalEditData?.date_of_assessment
                  ? new Date(LegalEditData.date_of_assessment)
                  : null
              }
              onChange={(date) =>
                setLegalEditData((prev) => ({
                  ...prev,
                  date_of_assessment: date,
                }))
              }
            />
          </div>
        </Col>
      </div>

      {/* Legal History Start */}
      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>{getTranslation(domesticViolence,lang)}</Label>
          <Input
            type="textarea"
            className="form-control"
            rows="3"
            name="domestic_violence_case"
            value={LegalEditData?.domestic_violence_case || ""}
            onChange={(e) =>
              setLegalEditData((prev) => ({
                ...prev,
                domestic_violence_case: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>

      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>{getTranslation(reasonBehindDomesticViolence,lang)}</Label>
          <Input
            type="textarea"
            className="form-control"
            rows="3"
            name="reason_behind_domestic_violence"
            value={LegalEditData?.reason_behind_domestic_violence || ""}
            onChange={(e) =>
              setLegalEditData((prev) => ({
                ...prev,
                reason_behind_domestic_violence: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>

      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>{getTranslation(drugStatus,lang)}</Label>
          <Input
            type="textarea"
            className="form-control"
            rows="3"
            name="drug_status_quantity_at_time"
            value={LegalEditData?.drug_status_quantity_at_time || ""}
            onChange={(e) =>
              setLegalEditData((prev) => ({
                ...prev,
                drug_status_quantity_at_time: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>

      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>{getTranslation(ifThereIsAnyCriminalCase,lang)}</Label>
          <Input
            type="textarea"
            className="form-control"
            rows="3"
            name="any_criminal_case"
            value={LegalEditData?.any_criminal_case || ""}
            onChange={(e) =>
              setLegalEditData((prev) => ({
                ...prev,
                any_criminal_case: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>

      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>{getTranslation(specificCaseDetails,lang)}</Label>
          <Input
            type="textarea"
            className="form-control"
            rows="3"
            name="case_details_specify"
            value={LegalEditData?.case_details_specify || ""}
            onChange={(e) =>
              setLegalEditData((prev) => ({
                ...prev,
                case_details_specify: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>

      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>{getTranslation(currentCaseStatus,lang)}</Label>
          <Input
            type="textarea"
            className="form-control"
            rows="3"
            name="current_case_status"
            value={LegalEditData?.current_case_status || ""}
            onChange={(e) =>
              setLegalEditData((prev) => ({
                ...prev,
                current_case_status: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>

      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>{getTranslation(drugStatus,lang)}</Label>
          <Input
            type="textarea"
            className="form-control"
            rows="3"
            name="drug_status_quantity_current"
            value={LegalEditData?.drug_status_quantity_current || ""}
            onChange={(e) =>
              setLegalEditData((prev) => ({
                ...prev,
                drug_status_quantity_current: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>

      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>{getTranslation(ifWentToJail,lang)}</Label>
          <Input
            type="textarea"
            className="form-control"
            rows="3"
            name="jail_period_duration"
            value={LegalEditData?.jail_period_duration || ""}
            onChange={(e) =>
              setLegalEditData((prev) => ({
                ...prev,
                jail_period_duration: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>
      {/* Legal History End */}

      {/* Submit Button */}
      <div className="d-flex gap-3 mt-3">
        <Button color="primary" type="submit" disabled={isLoading}>
          {isLoading ? (
            <span
              className="spinner-border spinner-border-sm"
              role="status"
              aria-hidden="true"
            ></span>
          ) : (
            getTranslation("Update Legal History / लीगल इतिहास अपडेट करें",lang)
          )}
        </Button>
      </div>
    </form>
  </div>
</CommonModal>
{/* Legal update form end */}



{/* Legal prefill readmission form start */}
<CommonModal
  isOpen={LegalPrefillModal}
  title={getTranslation(`Readmission ${legalHistory}`,lang)}
  toggler={closeAllmodal}
  maxWidth="1200px"
>
  {/* <PatientCommonInfo
    selectedUser={selectedUser}
    labels={{
      name: "Patient name/प्रयासक का नाम :",
      sex: "Gender/प्रयासक का लिंग :",
      age: "Age/प्रयासक का उम्र :",
      date_of_admission: "Date of Admission/प्रवेश की तिथि :",
      ageValue: patientCalAge,
    }}
  /> */}

  <div className="row px-3 pt-4 pb-3">
    <form
      className="theme-form"
      onSubmit={SubmitLegalReadmissionFormHandler}
    >
      {/* Date of Assessment */}
      <div className="col-md-6 mb-3">
        <Label className="col-sm-12 col-form-label col-xl-6">
          {getTranslation(dateOfAssessment,lang)}
        </Label>
        <Col xl="5" sm="12">
          <div className="input-group">
            <DatePicker
              className="form-control digits"
              selected={
                LegalPrefillData?.date_of_assessment
                  ? new Date(LegalPrefillData.date_of_assessment)
                  : null
              }
              onChange={(date) =>
                setLegalPrefillData((prev) => ({
                  ...prev,
                  date_of_assessment: date,
                }))
              }
            />
          </div>
        </Col>
      </div>

      {/* Legal History Start */}
      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>{getTranslation(domesticViolence,lang)}</Label>
          <Input
            type="textarea"
            className="form-control"
            rows="3"
            name="domestic_violence_case"
            value={LegalPrefillData?.domestic_violence_case || ""}
            onChange={(e) =>
              setLegalPrefillData((prev) => ({
                ...prev,
                domestic_violence_case: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>

      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>{getTranslation(reasonBehindDomesticViolence,lang)}</Label>
          <Input
            type="textarea"
            className="form-control"
            rows="3"
            name="reason_behind_domestic_violence"
            value={LegalPrefillData?.reason_behind_domestic_violence || ""}
            onChange={(e) =>
              setLegalPrefillData((prev) => ({
                ...prev,
                reason_behind_domestic_violence: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>

      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>{getTranslation(drugStatus,lang)}</Label>
          <Input
            type="textarea"
            className="form-control"
            rows="3"
            name="drug_status_quantity_at_time"
            value={LegalPrefillData?.drug_status_quantity_at_time || ""}
            onChange={(e) =>
              setLegalPrefillData((prev) => ({
                ...prev,
                drug_status_quantity_at_time: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>

      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>{getTranslation(ifThereIsAnyCriminalCase,lang)}</Label>
          <Input
            type="textarea"
            className="form-control"
            rows="3"
            name="any_criminal_case"
            value={LegalPrefillData?.any_criminal_case || ""}
            onChange={(e) =>
              setLegalPrefillData((prev) => ({
                ...prev,
                any_criminal_case: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>

      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>{getTranslation(specificCaseDetails,lang)}</Label>
          <Input
            type="textarea"
            className="form-control"
            rows="3"
            name="case_details_specify"
            value={LegalPrefillData?.case_details_specify || ""}
            onChange={(e) =>
              setLegalPrefillData((prev) => ({
                ...prev,
                case_details_specify: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>

      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>{getTranslation(currentCaseStatus,lang)}</Label>
          <Input
            type="textarea"
            className="form-control"
            rows="3"
            name="current_case_status"
            value={LegalPrefillData?.current_case_status || ""}
            onChange={(e) =>
              setLegalPrefillData((prev) => ({
                ...prev,
                current_case_status: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>

      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>{getTranslation(drugStatus,lang)}</Label>
          <Input
            type="textarea"
            className="form-control"
            rows="3"
            name="drug_status_quantity_current"
            value={LegalPrefillData?.drug_status_quantity_current || ""}
            onChange={(e) =>
              setLegalPrefillData((prev) => ({
                ...prev,
                drug_status_quantity_current: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>

      <div className="col-md-12">
        <FormGroup className="mb-0">
          <Label>{getTranslation(ifWentToJail,lang)}</Label>
          <Input
            type="textarea"
            className="form-control"
            rows="3"
            name="jail_period_duration"
            value={LegalPrefillData?.jail_period_duration || ""}
            onChange={(e) =>
              setLegalPrefillData((prev) => ({
                ...prev,
                jail_period_duration: e.target.value,
              }))
            }
          />
        </FormGroup>
      </div>
      {/* Legal History End */}

      {/* Submit Button */}
      <div className="d-flex gap-3 mt-3">
        <Button color="primary" type="submit" disabled={isLoading}>
          {isLoading ? (
            <span
              className="spinner-border spinner-border-sm"
              role="status"
              aria-hidden="true"
            ></span>
          ) : (
            getTranslation("Readmission Legal History / लीगल इतिहास अपडेट करें",lang)
          )}
        </Button>
      </div>
    </form>
  </div>
</CommonModal>
{/* Legal prefill readmission form end */}





    </Fragment>
  );
}

export default Legal;
