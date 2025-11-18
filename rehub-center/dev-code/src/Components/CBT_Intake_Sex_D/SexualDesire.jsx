import React, { Fragment, useState, useEffect, useRef } from "react";
import {
  DatePickers,
  SelectDateWithTime,
  CustomDateFormat,
  TodayButton,
  DisableDaysOfWeek,
  SpecificDateRange,
  MinDate,
  MaxDate,
  DateRange,
  InlineVersion,
  DisableDatepicker,
  SelectTimeOnly,
  Default,
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
  seizure,
  epilepsy,
  delirium,
  shaking,
  memory,
  neuropathy,
  blackout,
  consent,
  name,
  relationship,
  signature,
  anyOtherFindings,
  prepared,
  SexualHistory,
  SexualHistoryID,
  SexualHistoryanswer,
  SexualHistoryquestion,
  SexuaQuesData,
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
  InputGroup,
  Button,
} from "reactstrap";
import { H5 } from "../../AbstractElements";
import DatePicker from "react-datepicker";

import HeaderCard from "../Common/Component/HeaderCard";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2"; // ✅ Make sure this is imported at the top

import { Data } from "../UiKits/Spinners/SpinnerData";
import { toast } from "react-toastify";

//Calculate age by DOB custom hook
import useCalculateAge from "../../CustomHook/useCalculateAge";
import CommonModal from "../UiKits/Modals/common/modal";


//editPFA download PDF library
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import html2pdf from "html2pdf.js";



//Show pateint/user common info like name, age and DOB by custom hook
import PatientCommonInfo from "../../CustomHook/PatientCommonInfo";

import { useBranch } from "../../contexts/BranchContext";

import Translated from "../Translated";
import { useLang } from "../../contexts/LangContext";
import { getTranslation } from "../../utils/translator";

function SexualDesire() {

    const { lang } = useLang(); // get current language from context

    //Branches selection
    const { selectedBranch } = useBranch();

  //Downloading view sexual desire form into pdf format
  const pdfRef = useRef();
  //PDf view download pdf code handler
  const [pfaDownload, setpfaDownload] = useState(false);
  const handleDownloadPDF = () => {
    const element = pdfRef.current;
    setpfaDownload(true);

    // Add a temporary class to scale fonts if needed
    element.classList.add("pdf-scale");

    const opt = {
      margin: [10, 10, 10, 10], // top, left, bottom, right
      filename: `user_data_${viewSexualData?.name}_${viewSexualData?.user_id}.pdf`,
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

  //Date of Assessment State
  const [startDateOfAssessment, setstartDateOfAssessment] = useState(
    new Date()
  );
  const handleChangeAssessment = (date) => {
    setstartDateOfAssessment(date);
    // console.log("Date of Assessment", date);
  };

  //Sexual History / यौन इतिहास
  const [responses, setResponses] = useState({});

  const handleSexualChange = (index, value) => {
    setResponses({ ...responses, [index]: value });
    // console.log("responses", responses)
  };

  const [forData, setFormData] = useState({
    consent: "No", // or "Yes" if checked by default
    prepared: "",
    signature: ""
  })
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }


  //Modal
  const [modal, setModal] = useState(false);
  //Loading spinner
  const [isLoading, setIsLoading] = useState(false);

  //This React hook calculates a user's age based on their date of birth (dob) and returns the age on PFA form by create.
  const [selectedUser, setSelectedUser] = useState(null); // User data
  const dob = selectedUser?.dob;
  const patientCalAge = useCalculateAge(dob);
  console.log("DOB", patientCalAge);

  {/*First Table Registered Patient List Start */ }

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

  //Registered Patient data
  const [data, setData] = useState([]);
  const [stillLoading, setstillLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem("Authorization");

    if (!selectedBranch) return; // avoid empty branch fetch

    fetch(`https://gks-yjdc.onrender.com/api/users?branch_id=${selectedBranch}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch FDA user details");
        return response.json();
      })
      .then((res) => {
        const users = res.data || [];

        const formatted = users.map((user) => {
          const admitDate = user.recent_admit_date
            ? new Date(user.recent_admit_date)
            : null;
          const CBTDate = user.recent_cbt_date
            ? new Date(user.recent_cbt_date)
            : null;

            let isSHCompleted = false;

          let userStatus = <p className="badge bg-warning text-dark p-2">{getTranslation("Pending/लंबित",lang)}</p>;
          if (admitDate && CBTDate && admitDate > CBTDate) {
            isSHCompleted = false;
            userStatus = <p className="badge bg-success p-2">{getTranslation("Completed/पुरा होना।",lang)}</p>;
          }

          // const dischargeStatusText = user.discharge_status_text || "Unknown";

          return {
            id: user.user_id,
            gks_id: user.gks_id || "N/A",
            name: user.name,
            status: userStatus,
            isSHCompleted,
            dischargeStatus: user.discharge_status,
            dischargeStatusText: user.discharge_status_text,
            isReadmission: user.is_readmission,
            // recent_sda_id: user.recent_sda_id,
            // recent_cbt_id: user.recent_cbt_id,
            recent_sha_id: user.recent_sha_id
          };
        });

        setTimeout(() => {
          setData(formatted);
          setFilteredData(formatted);
          setstillLoading(false);
        }, 1000); // You can reduce this to 1s
      })
      .catch((error) => {
        console.error("Error fetching Sexsual Desire user data:", error);
        setstillLoading(true);
      });
  }, []);


  //Getting registred patient data into table row 
  const tableColumns = [
    {  name: `${getTranslation('User ID/उपयोगकर्ता आईडी' , lang)}`, selector: (row) => row.id, sortable: true, center: true },
    {  name: `${getTranslation('GKS ID/GKS आईडी' , lang)}`, selector: (row) => row.gks_id, sortable: true, center: true },
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
                onClick={() => handleSDPreFill(row.recent_sha_id)}
                style={{ cursor: "pointer" }}
                title={getTranslation("Readmission Sexsual Desire Form/पुनः प्रवेश यौन इच्छा प्रपत्र",lang)}
              >
                ✏️
              </span>
            )}

            {/* Show Create PFA if not discharged and not readmission */}
            {/* {row.dischargeStatus === 0 && row.isReadmission === 0 && (
              <span
                onClick={() => createSDHandler(row.id)}
                style={{ cursor: "pointer" }}
                title="Create Sexsual Desire From"
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
    onClick={() => (row.isSHCompleted ? null : createSDHandler(row.id))}
    style={{
      cursor: row.isSHCompleted ? "not-allowed" : "pointer",
      opacity: row.isSHCompleted ? 0.5 : 1,
    }}
    title={row.isSHCompleted ? getTranslation("Sexsual Desire Completed/यौन इच्छा पूरी हुई",lang) : getTranslation("Create Sexsual Desire From/यौन इच्छा पैदा करें",lang)}
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
  {/*First Table Registered Patient List end */ }


  {/*Second Table Registered Patient List Start */ }

  //Search filter on register datalist
  const [searchTextSecondTbl, setsearchTextSecondTbl] = useState("");
  const [filteredSecondTblData, setFilteredSecondTblData] = useState([]);
  //This search filter for above table where we are listing all register user list from user API
  const handleSearchSecondTbl = (e) => {
    const value = e.target.value.toLowerCase();
    setsearchTextSecondTbl(value);

    const filteredsecondTbl = dataSecondTbl.filter((item) =>
      item.name.toLowerCase().includes(value)
    );

    setFilteredSecondTblData(filteredsecondTbl);
  };

  //Registered Patient data list in table format
  const [dataSecondTbl, setDataSecondTbl] = useState([]);
  useEffect(() => {
    const token = localStorage.getItem("Authorization");

    if (!selectedBranch) return; // avoid empty branch fetch

    fetch(`https://gks-yjdc.onrender.com/api/sha/all-sha-entries?branch_id=${selectedBranch}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch Sexsual Desire entries");
        return response.json();
      })
      .then((res) => {
        const entries = res.entries || [];

        console.log("Sexsual Desire Response =>", res);

        const formatted = entries.map((entry) => {
          const admitDate = entry.admit_date ? new Date(entry.admit_date) : null;
          const SDDate = entry.date_of_assessment ? new Date(entry.date_of_assessment) : null;

          let userStatus = <p className="badge bg-warning text-dark p-2">{getTranslation("Pending/लंबित",lang)}</p>;
          if (admitDate && SDDate && admitDate < SDDate) {
            userStatus = <p className="badge bg-success p-2">{getTranslation("Completed/पुरा होना।",lang)}</p>;
          }

          const dischargeStatusText = entry.discharge_status === 1 ? getTranslation("Discharged/छुट्टी दे दी गई",lang) : getTranslation("Not Discharged/छुट्टी नहीं दी गई",lang);

          return {
            id: entry?.user_id || "N/A",
            gks_id: entry?.gks_id || "N/A",
            name: entry?.user_name || "N/A",
            status: userStatus,
            dischargeStatus: entry.entry?.discharge_status || 0,
            dischargeStatusText: dischargeStatusText,
            isReadmission: false, // still assuming
            recent_sda_id: entry.cbt_id || "N/A",
            ward: entry.entry?.ward_name || "N/A",
            phone: entry?.phone || "N/A",
            email: entry?.email || "N/A",
            sha_id: entry?.sha_id || "N/A",
          };
        });

        setTimeout(() => {
          setDataSecondTbl(formatted);
          setFilteredSecondTblData(formatted);
          setstillLoading(false);
        }, 1000);
      })
      .catch((error) => {
        console.error("Error fetching SDA entries:", error);
        setstillLoading(true);
      });
  }, []);


  //Getting registred patient data into table row 
  const tableColumnsSecoundTbl = [
    { name: `${getTranslation('User ID/उपयोगकर्ता आईडी' , lang)}`, selector: (row) => row.id, sortable: true, center: true },
    { name: `${getTranslation('Sexual ID/यौन पहचान' , lang)}`, selector: (row) => row.sha_id, sortable: true, center: true },
    {  name: `${getTranslation('GKS ID/GKS आईडी' , lang)}`, selector: (row) => row.gks_id, sortable: true, center: true },
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

    { name: `${getTranslation('Email/ईमेल' , lang)}`, selector: (row) => row.email, sortable: true, center: true },
    { name: `${getTranslation('Patient Phone/मरीज़ का फ़ोन' , lang)}`, selector: (row) => row.phone, sortable: true, center: true },

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
      cell: (row) => (
        <div className="d-flex gap-2">
          <>
            <span
              onClick={() => ViewSDindividualData(row.sha_id)}
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
              onClick={() => handleEditSDIndividualData(row.sha_id)}
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

  {/*Second Table Registered Patient List End */ }


  //Create sexual desire form handler
  const createSDHandler = async (userId = null) => {
    console.log("Sexual Desire =>", userId);
    setModal(true);
    if (userId) {
      const token = localStorage.getItem("Authorization");
      const branch_id = selectedBranch;
      try {
        const response = await fetch(`https://gks-yjdc.onrender.com/api/users/${userId}?branch_id=${branch_id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        });
        const data = await response.json();
        console.log(data)
        if (!response.ok) throw new Error("User fetch failed");
        setSelectedUser(data.data[0]);
      } catch (error) {
        console.error("Fetch error:", error);
      }
    }
  };



  //Submit sexual desire form handler
  const submitSDdataHandler = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const payload = {
      user_id: selectedUser[0]?.user_id, // from PatientCommonInfo
      date_of_assessment: startDateOfAssessment
        ? startDateOfAssessment.toISOString().split("T")[0]
        : "",
      sex_misconceptions: responses[0] || "",
      sexual_games_child: responses[1] || "",
      unpleasant_experiences: responses[2] || "",
      bad_attitude_nudity: responses[3] || "",
      age_first_sexual_activity: responses[4] || "",
      consensual_activity: responses[5] || "",
      current_sexual_functioning: responses[6] || "",
      sex_desire_type: responses[7] || "",
      sexual_identity_comfort: responses[8] || "",
      erotic_material_exposure: responses[9] || "",
      masturbation_history: responses[10] || "",
      masturbation_frequency_years: responses[11] || "",
      intercourse_frequency: responses[12] || "",
      sex_importance_marriage: responses[13] || "",
      tell_partner_preferences: responses[14] || "",
      masturbation_after_marriage: responses[15] || "",
      partner_sexual_problems: responses[16] || "",
      extramarital_affairs: responses[17] || "",
      coitus_outside_marriage: responses[18] || "",
      women_intercourse_thoughts: responses[19] || "",
      external_aids_usage: responses[20] || "",
      upsetting_experiences: responses[21] || "",
      sex_desire_before_after_substance: responses[22] || "",
      premature_ejaculation_substance: responses[23] || "",
      alcohol_drugs_ejaculation_effect: responses[24] || "",
      frequency_comparison_past: responses[25] || "",
      heterosexual_homosexual_activity: responses[26] || "",
      consent: forData.consent,
      prepared_by: forData.prepared,
      signature: forData.signature,
    };

    console.log("Submitting SD Payload =>", payload);

    //Post create sexual desire form data into backend

    try {
      const token = localStorage.getItem("Authorization");

      const branch_id = selectedBranch;

      const response = await fetch(`https://gks-yjdc.onrender.com/api/sha/create-assessment?branch_id=${branch_id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: getTranslation("Sexual History Submitted/यौन इतिहास प्रस्तुत किया गया",lang),
          text: getTranslation("The sexual desire form has been submitted successfully./यौन इच्छा प्रपत्र सफलतापूर्वक प्रस्तुत कर दिया गया है।",lang),
        });
      } else {
        console.error("Error Response:", result);
        Swal.fire({
          icon: "error",
          title: getTranslation("Submission Failed/सबमिशन विफल",lang),
          text: result.message || getTranslation("There was an error submitting the form./फ़ॉर्म जमा करने में एक त्रुटि हुई थी।",lang),
        });
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      Swal.fire({
        icon: "error",
        title: getTranslation("Error/गलती",lang),
        text: getTranslation("Network or server issue occurred./नेटवर्क या सर्वर समस्या उत्पन्न हुई.",lang),
      });
    } finally {
      setIsLoading(false);
    }
  };


  //Prefill from data by recent sexual desire ID hanlder
  const [prefillSDModal, setprefillSDModal] = useState(false);
  const [prefillSDdata, setprefillSDdata] = useState(null);
  const handleSDPreFill = async (recentSexualId = null) => {
    setprefillSDModal(true)
    console.log("Sexual Desire Recent SD ID's =>", recentSexualId);
    if (recentSexualId) {
      const token = localStorage.getItem("Authorization");
      const branch_id = selectedBranch;
      try {
        const response = await fetch(`https://gks-yjdc.onrender.com/api/sha/assessment/${recentSexualId}?branch_id=${branch_id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        });
        const prefillData = await response.json();
        console.log("prefillData=>", prefillData.assessment)
        if (!response.ok) throw new Error("User fetch failed");
        setprefillSDdata(prefillData);
        setSelectedUser(prefillData.assessment);

        const latestAssessment = prefillData.assessment || prefillData;
        console.log("SD => ", latestAssessment);

        if (latestAssessment) {
          setprefillSDdata({
            user_id: latestAssessment?.user_id,
            date_of_assessment: latestAssessment.date_of_assessment
              ? parseDateString(latestAssessment.date_of_assessment)
              : "",
            consent: latestAssessment?.consent,
            signature: latestAssessment?.signature,
            prepared: latestAssessment?.prepared_by,

            sexualData: {
              sex_misconceptions: "Had some misconceptions during teenage years",
              sexual_games_child: "No inappropriate games recalled",
              unpleasant_experiences: "No unpleasant experiences with strangers or family",
              bad_attitude_nudity: "Comfortable with appropriate nudity in medical settings",
              age_first_sexual_activity: "21 years old",
              consensual_activity: "Consensual",
              current_sexual_functioning: "Normal functioning",
              sex_desire_type: "Normal heterosexual desire",
              sexual_identity_comfort: "Yes, comfortable with sexual identity",
              erotic_material_exposure: "Occasional exposure to adult content",
              masturbation_history: "Started at age 16, normal frequency",
              masturbation_frequency_years: "2-3 times per week during teenage years",
              intercourse_frequency: "2-3 times per week with partner",
              sex_importance_marriage: "Important but not the only factor in marriage",
              tell_partner_preferences: "Yes, open communication with partner",
              masturbation_after_marriage: "No, satisfied with partner",
              partner_sexual_problems: "No known sexual problems with partner",
              extramarital_affairs: "No extramarital affairs",
              coitus_outside_marriage: "No sexual relationships outside marriage",
              women_intercourse_thoughts: "Respectful thoughts towards all women",
              external_aids_usage: "No external aids used",
              upsetting_experiences: "No particularly upsetting sexual experiences",
              sex_desire_before_after_substance: "No significant change in desire",
              premature_ejaculation_substance: "No premature ejaculation issues",
              alcohol_drugs_ejaculation_effect: "No significant effect observed",
              frequency_comparison_past: "Frequency has remained consistent",
              heterosexual_homosexual_activity: "Heterosexual"
            }

          })
        }

        console.log("SD prefillSDdata => ", prefillSDdata);

      } catch (error) {
        console.error("Fetch error:", error);
      }
    }
  }


  //Create readmissionform handler
  const readmissionSDhandler = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const payload = {
      user_id: selectedUser[0]?.user_id || prefillSDdata?.user_id || "",

      date_of_assessment: startDateOfAssessment
        ? startDateOfAssessment.toISOString().split("T")[0]
        : prefillSDdata?.date_of_assessment || "",

      sex_misconceptions: responses[0] || prefillSDdata.sexualData?.sex_misconceptions || "",
      sexual_games_child: responses[1] || prefillSDdata.sexualData?.sexual_games_child || "",
      unpleasant_experiences: responses[2] || prefillSDdata.sexualData?.unpleasant_experiences || "",
      bad_attitude_nudity: responses[3] || prefillSDdata.sexualData?.bad_attitude_nudity || "",
      age_first_sexual_activity: responses[4] || prefillSDdata.sexualData?.age_first_sexual_activity || "",
      consensual_activity: responses[5] || prefillSDdata.sexualData?.consensual_activity || "",
      current_sexual_functioning: responses[6] || prefillSDdata.sexualData?.current_sexual_functioning || "",
      sex_desire_type: responses[7] || prefillSDdata.sexualData?.sex_desire_type || "",
      sexual_identity_comfort: responses[8] || prefillSDdata.sexualData?.sexual_identity_comfort || "",
      erotic_material_exposure: responses[9] || prefillSDdata.sexualData?.erotic_material_exposure || "",
      masturbation_history: responses[10] || prefillSDdata.sexualData?.masturbation_history || "",
      masturbation_frequency_years: responses[11] || prefillSDdata.sexualData?.masturbation_frequency_years || "",
      intercourse_frequency: responses[12] || prefillSDdata.sexualData?.intercourse_frequency || "",
      sex_importance_marriage: responses[13] || prefillSDdata.sexualData?.sex_importance_marriage || "",
      tell_partner_preferences: responses[14] || prefillSDdata.sexualData?.tell_partner_preferences || "",
      masturbation_after_marriage: responses[15] || prefillSDdata.sexualData?.masturbation_after_marriage || "",
      partner_sexual_problems: responses[16] || prefillSDdata.sexualData?.partner_sexual_problems || "",
      extramarital_affairs: responses[17] || prefillSDdata.sexualData?.extramarital_affairs || "",
      coitus_outside_marriage: responses[18] || prefillSDdata.sexualData?.coitus_outside_marriage || "",
      women_intercourse_thoughts: responses[19] || prefillSDdata.sexualData?.women_intercourse_thoughts || "",
      external_aids_usage: responses[20] || prefillSDdata.sexualData?.external_aids_usage || "",
      upsetting_experiences: responses[21] || prefillSDdata.sexualData?.upsetting_experiences || "",
      sex_desire_before_after_substance: responses[22] || prefillSDdata.sexualData?.sex_desire_before_after_substance || "",
      premature_ejaculation_substance: responses[23] || prefillSDdata.sexualData?.premature_ejaculation_substance || "",
      alcohol_drugs_ejaculation_effect: responses[24] || prefillSDdata.sexualData?.alcohol_drugs_ejaculation_effect || "",
      frequency_comparison_past: responses[25] || prefillSDdata.sexualData?.frequency_comparison_past || "",
      heterosexual_homosexual_activity: responses[26] || prefillSDdata.sexualData?.heterosexual_homosexual_activity || "",

      consent: forData?.consent || prefillSDdata?.consent || "",
      prepared_by: forData?.prepared || prefillSDdata?.prepared || "",
      signature: forData?.signature || prefillSDdata?.signature || "",
    };


    console.log("Readmisson SD Payload =>", payload);

    //Post create sexual desire form data into backend

    try {
      const token = localStorage.getItem("Authorization");
      const branch_id = selectedBranch;
      const response = await fetch(`https://gks-yjdc.onrender.com/api/sha/create-assessment?branch_id=${branch_id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: getTranslation("Sexual History Readmission Created/यौन इतिहास पुनः प्रवेश बनाया गया",lang),
          text: getTranslation("The sexual desire form readmission has been created successfully./यौन इच्छा प्रपत्र पुनः प्रवेश सफलतापूर्वक बनाया गया है।",lang),
        });
      } else {
        console.error("Error Response:", result);
        Swal.fire({
          icon: "error",
          title: getTranslation("Submission Failed/सबमिशन विफल",lang),
          text: result.message || getTranslation("There was an error submitting the form./फ़ॉर्म जमा करने में एक त्रुटि हुई थी।",lang),
        });
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      Swal.fire({
        icon: "error",
        title: getTranslation("Error/गलती",lang),
        text: getTranslation("Network or server issue occurred./नेटवर्क या सर्वर समस्या उत्पन्न हुई.",lang),
      });
    } finally {
      setIsLoading(false);
    }
  };


  //Close all modal handler
  const closeAllModal = () => {
    setModal(false);
    setprefillSDModal(false);
    setSexualDataModal(false);
    seteditindividualModal(false);
    seteditindividualModal(false);
    
  };


  //🔧 Convert DD/MM/YYYY to Date Object:
  const parseDateString = (dateStr) => {
    if (!dateStr) return null;

    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  };


  //View saxual desire form data
  const [viewSexualDataModal, setSexualDataModal] = useState(false);
  const [viewSexualData, setSexualData] = useState(null);
  const ViewSDindividualData = async (viewSexualId = null) => {
    console.log("View Sexual Desire =>", viewSexualId);
    setSexualDataModal(true);
    if (viewSexualId) {
      const token = localStorage.getItem("Authorization");
      const branch_id = selectedBranch;
      try {
        const response = await fetch(`https://gks-yjdc.onrender.com/api/sha/assessment/${viewSexualId}?branch_id=${branch_id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        });
        const data = await response.json();
        const viewData = data.assessment;
        console.log("View Sexual Desire Data=>", data)
        if (!response.ok) throw new Error("User fetch failed");
        setSexualData(viewData);
      } catch (error) {
        console.error("Fetch error:", error);
      }
    }
  };


  //Edit sexual desire individual form handler
  const [editindividualModal,seteditindividualModal]=useState(false);
  const [editindividualSDData,seteditindividualSDData]=useState(null);
  const handleEditSDIndividualData = async (editIndiSDID) => {
    seteditindividualModal(true);
  
    if (typeof editIndiSDID === "object" && editIndiSDID !== null) {
      editIndiSDID = editIndiSDID.sha_id;
    }
  
    if (!editIndiSDID) {
      console.error("Invalid editIndiSDID provided");
      return;
    }
  
    console.log("editIndiSDID =>", editIndiSDID);
  
    const token = localStorage.getItem("Authorization");
    const branch_id = selectedBranch;
  
    try {
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/sha/assessment/${editIndiSDID}?branch_id=${branch_id}`,
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
  
      const latestAssessment = data.assessment || data;
      setSelectedUser(latestAssessment);
  
      if (!latestAssessment) {
        console.warn("No assessment found for this editIndiSDID.");
        return;
      }
  
      seteditindividualSDData({
        user_id: latestAssessment.user_id,
        date_of_assessment: latestAssessment.date_of_assessment
          ? parseDateString(latestAssessment.date_of_assessment)
          : "",
        consent: latestAssessment.consent,
        signature: latestAssessment.signature,
        prepared: latestAssessment.prepared_by,
        status: latestAssessment.status,
      
        sexualData: {
          sex_misconceptions: latestAssessment.sex_misconceptions,
          sexual_games_child: latestAssessment.sexual_games_child,
          unpleasant_experiences: latestAssessment.unpleasant_experiences,
          bad_attitude_nudity: latestAssessment.bad_attitude_nudity,
          age_first_sexual_activity: latestAssessment.age_first_sexual_activity,
          consensual_activity: latestAssessment.consensual_activity,
          current_sexual_functioning: latestAssessment.current_sexual_functioning,
          sex_desire_type: latestAssessment.sex_desire_type,
          sexual_identity_comfort: latestAssessment.sexual_identity_comfort,
          erotic_material_exposure: latestAssessment.erotic_material_exposure,
          masturbation_history: latestAssessment.masturbation_history,
          masturbation_frequency_years: latestAssessment.masturbation_frequency_years,
          intercourse_frequency: latestAssessment.intercourse_frequency,
          sex_importance_marriage: latestAssessment.sex_importance_marriage,
          tell_partner_preferences: latestAssessment.tell_partner_preferences,
          masturbation_after_marriage: latestAssessment.masturbation_after_marriage,
          partner_sexual_problems: latestAssessment.partner_sexual_problems,
          extramarital_affairs: latestAssessment.extramarital_affairs,
          coitus_outside_marriage: latestAssessment.coitus_outside_marriage,
          women_intercourse_thoughts: latestAssessment.women_intercourse_thoughts,
          external_aids_usage: latestAssessment.external_aids_usage,
          upsetting_experiences: latestAssessment.upsetting_experiences,
          sex_desire_before_after_substance: latestAssessment.sex_desire_before_after_substance,
          premature_ejaculation_substance: latestAssessment.premature_ejaculation_substance,
          alcohol_drugs_ejaculation_effect: latestAssessment.alcohol_drugs_ejaculation_effect,
          frequency_comparison_past: latestAssessment.frequency_comparison_past,
          heterosexual_homosexual_activity: latestAssessment.heterosexual_homosexual_activity,
        }
      });
      
  
      console.log("SexualDesirePrefillData =>", latestAssessment);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };


  //Update Sexual Desire Form Data Handler
  const updateSexualDesireHandler = async (e) => {
    e.preventDefault();
    setIsLoading(true);
  
    const payload = {
      user_id: editindividualSDData?.user_id || "",
      date_of_assessment: editindividualSDData?.date_of_assessment
        ? new Date(editindividualSDData.date_of_assessment).toISOString().split("T")[0]
        : "",
  
      // Sexual Desire Data
      sex_misconceptions: editindividualSDData?.sexualData?.sex_misconceptions || "",
      sexual_games_child: editindividualSDData?.sexualData?.sexual_games_child || "",
      unpleasant_experiences: editindividualSDData?.sexualData?.unpleasant_experiences || "",
      bad_attitude_nudity: editindividualSDData?.sexualData?.bad_attitude_nudity || "",
      age_first_sexual_activity: editindividualSDData?.sexualData?.age_first_sexual_activity || "",
      consensual_activity: editindividualSDData?.sexualData?.consensual_activity || "",
      current_sexual_functioning: editindividualSDData?.sexualData?.current_sexual_functioning || "",
      sex_desire_type: editindividualSDData?.sexualData?.sex_desire_type || "",
      sexual_identity_comfort: editindividualSDData?.sexualData?.sexual_identity_comfort || "",
      erotic_material_exposure: editindividualSDData?.sexualData?.erotic_material_exposure || "",
      masturbation_history: editindividualSDData?.sexualData?.masturbation_history || "",
      masturbation_frequency_years: editindividualSDData?.sexualData?.masturbation_frequency_years || "",
      intercourse_frequency: editindividualSDData?.sexualData?.intercourse_frequency || "",
      sex_importance_marriage: editindividualSDData?.sexualData?.sex_importance_marriage || "",
      tell_partner_preferences: editindividualSDData?.sexualData?.tell_partner_preferences || "",
      masturbation_after_marriage: editindividualSDData?.sexualData?.masturbation_after_marriage || "",
      partner_sexual_problems: editindividualSDData?.sexualData?.partner_sexual_problems || "",
      extramarital_affairs: editindividualSDData?.sexualData?.extramarital_affairs || "",
      coitus_outside_marriage: editindividualSDData?.sexualData?.coitus_outside_marriage || "",
      women_intercourse_thoughts: editindividualSDData?.sexualData?.women_intercourse_thoughts || "",
      external_aids_usage: editindividualSDData?.sexualData?.external_aids_usage || "",
      upsetting_experiences: editindividualSDData?.sexualData?.upsetting_experiences || "",
      sex_desire_before_after_substance: editindividualSDData?.sexualData?.sex_desire_before_after_substance || "",
      premature_ejaculation_substance: editindividualSDData?.sexualData?.premature_ejaculation_substance || "",
      alcohol_drugs_ejaculation_effect: editindividualSDData?.sexualData?.alcohol_drugs_ejaculation_effect || "",
      frequency_comparison_past: editindividualSDData?.sexualData?.frequency_comparison_past || "",
      heterosexual_homosexual_activity: editindividualSDData?.sexualData?.heterosexual_homosexual_activity || "",
  
      // Consent & Signature
      consent: editindividualSDData?.consent || "",
      prepared_by: editindividualSDData?.prepared || "",
      signature: editindividualSDData?.signature || "",
    };
  
    console.log("Update SD Payload =>", payload);
  
    try {
      const token = localStorage.getItem("Authorization");
      const branch_id = selectedBranch;
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/sha/update-assessment/${viewSexualData?.sha_id}?branch_id=${branch_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
  
      const result = await response.json();
  
      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: getTranslation("Sexual History Updated/यौन इतिहास अद्यतन",lang),
          text: getTranslation("The sexual desire form has been successfully updated./यौन इच्छा प्रपत्र को सफलतापूर्वक अद्यतन कर दिया गया है।",lang),
        });
      } else {
        console.error("Error Response:", result);
        Swal.fire({
          icon: "error",
          title: getTranslation("Update Failed/भार बढ़ाना विफल हुवा",lang),
          text: result.message || getTranslation("There was an error submitting the form./फ़ॉर्म जमा करने में एक त्रुटि हुई थी।",lang),
        });
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      Swal.fire({
        icon: "error",
        title: getTranslation("Network Error/नेटवर्क त्रुटि",lang),
        text: getTranslation("A network or server issue occurred./नेटवर्क या सर्वर संबंधी समस्या उत्पन्न हुई.",lang),
      });
    } finally {
      setIsLoading(false);
    }
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

      {/* Sexual desire all user entries data list into data table start */}

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
                      title={getTranslation("All Sexual History Patient Data List/सभी यौन इतिहास रोगी डेटा सूची",lang)}
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
                          value={searchTextSecondTbl}
                          onChange={handleSearchSecondTbl}
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
                      data={filteredSecondTblData}
                      columns={tableColumnsSecoundTbl}
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

      {/* Sexual desire all user entries data list into data table end */}


      {/* Create and submit Sexual desire from start  */}
      <CommonModal
        isOpen={modal}
        title={getTranslation("Create Sexual History Form / यौन इतिहास प्रपत्र बनाएँ",lang)}
        toggler={closeAllModal}
        maxWidth="1200px"
      >
        <div className="sd__wrapper">
          <Form className="theme-form" onSubmit={submitSDdataHandler} >
            {/* Patient name and date of assessment */}
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
            <div className="sd__createWrapper p-3">
              <div className="row">
                {/*Date of Assessment section/परीक्षण की तारीख :*/}
                <div className="col-md-6 mt-3">
                  <FormGroup className="form-group row">
                    <Label className="col-sm-12 col-form-label  col-xl-6">
                      {getTranslation(dateOfAssessment,lang)}
                    </Label>
                    <Col xl="5" sm="12">
                      <div className="input-group">
                        <DatePicker
                          className="form-control digits"
                          selected={startDateOfAssessment}
                          onChange={handleChangeAssessment}
                        />
                      </div>
                    </Col>
                  </FormGroup>
                </div>
              </div>
              {/* Sexual History / यौन इतिहास Questions */}
              <div className="table-responsive">
                <Table bordered>
                  <thead>
                    <tr>
                      <th scope="col">{getTranslation(SexualHistoryID,lang)}</th>
                      <th scope="col">{getTranslation(SexualHistoryquestion,lang)}</th>
                      <th scope="col">{getTranslation(SexualHistoryanswer,lang)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SexuaQuesData.map((q, index) => (
                      <tr key={index} className="border">
                        <td className="border px-4 py-2 text-center">
                          {index + 1}
                        </td>
                        <td className="border px-4 py-2">
                          <strong>{getTranslation(q.en,lang)}</strong>
                          <br />
                          <span className="text-gray-600">{q.hi}</span>
                        </td>
                        <td className="border px-4 py-2">
                          <input
                            type="text"
                            className="w-full p-2 border rounded"
                            value={responses[index] || ""}
                            onChange={(e) => handleSexualChange(index, e.target.value)}
                            placeholder="Enter your answer"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <br />
              <div className="row">
                <div className="consent__wrapper col-md-8">
                  <Label className="d-block" for="chk-ani">
                    <Input
                      className="checkbox_animated"
                      id="chk-ani"
                      type="checkbox"
                      checked={forData.consent === "Yes"}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          consent: e.target.checked ? "Yes" : "No",
                        }))
                      }

                    />
                    {getTranslation(consent,lang)}
                  </Label>
                </div>
                <div className="col-md-12">
                  <Label>{getTranslation(signature,lang)}</Label>
                  <Input type="text" className="form-control"
                    name="signature"
                    value={forData.signature}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-12">
                  <Label>{getTranslation(prepared,lang)}</Label>
                  <Input type="text" className="form-control"
                    name="prepared"
                    value={forData.prepared}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
            <br />
            {/* Submit Button */}
            <div className="d-flex gap-3 mt-4 mb-3">
              <Button color="primary" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  ></span>
                ) : (
                  getTranslation("Create Sexual Desire Form/यौन इच्छा प्रपत्र बनाएँ",lang)
                )}
              </Button>
            </div>
          </Form>
        </div>
      </CommonModal>
      {/* Create and submit Sexual desire from end  */}


      {/* Readmission and submit Sexual desire from start  */}
      <CommonModal
        isOpen={prefillSDModal}
        title={getTranslation(`Readmission ${SexualHistory}`,lang)}
        toggler={closeAllModal}
        maxWidth="1200px"
      >
        <div className="sd__wrapper">
          <Form className="theme-form" onSubmit={readmissionSDhandler} >
            {/* Patient name and date of assessment */}
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
            <div className="sd__createWrapper p-3">
              <div className="row">
                {/*Date of Assessment section/परीक्षण की तारीख :*/}
                <div className="col-md-6 mt-3">
                  <FormGroup className="form-group row">
                    <Label className="col-sm-12 col-form-label  col-xl-6">
                      {getTranslation(dateOfAssessment,lang)}
                    </Label>
                    <Col xl="5" sm="12">
                      <div className="input-group">
                        <DatePicker
                          className="form-control digits"
                          selected={prefillSDdata?.date_of_assessment instanceof Date && !isNaN(prefillSDdata?.date_of_assessment)
                            ? prefillSDdata?.date_of_assessment
                            : null}
                          onChange={(date) =>
                            setprefillSDdata({
                              ...prefillSDdata,
                              date_of_assessment: date,
                            })
                          }
                        />
                      </div>
                    </Col>
                  </FormGroup>
                </div>
              </div>
              {/* Sexual History / यौन इतिहास Questions */}
              <div className="table-responsive">
                <Table bordered>
                  <thead>
                    <tr>
                      <th scope="col">{getTranslation(SexualHistoryID,lang)}</th>
                      <th scope="col">{getTranslation(SexualHistoryquestion,lang)}</th>
                      <th scope="col">{getTranslation(SexualHistoryanswer,lang)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SexuaQuesData.map((q, index) => (
                      <tr key={q.key} className="border">
                        <td className="border px-4 py-2 text-center">{index + 1}</td>
                        <td className="border px-4 py-2">
                          <strong>{getTranslation(q.en,lang)}</strong>
                          <br />
                          <span className="text-gray-600">{q.hi}</span>
                        </td>
                        <td className="border px-4 py-2">
                          <input
                            type="text"
                            className="w-full p-2 border rounded"
                            value={prefillSDdata?.sexualData?.[q.key] || ""}
                            onChange={(e) =>
                              setprefillSDdata((prev) => ({
                                ...prev,
                                sexualData: {
                                  ...prev.sexualData,
                                  [q.key]: e.target.value,
                                },
                              }))
                            }
                            placeholder="Enter your answer"
                          />
                        </td>
                      </tr>
                    ))}

                  </tbody>
                </Table>
              </div>
              <br />
              <div className="row">
                <div className="consent__wrapper col-md-8">
                  <Label className="d-block" for="chk-ani">
                    <Input
                      className="checkbox_animated"
                      id="chk-ani"
                      type="checkbox"
                      checked={prefillSDdata?.consent === "Yes"}
                      onChange={(e) =>
                        setprefillSDdata({
                          ...prefillSDdata,
                          consent: e.target.checked ? "Yes" : "No",
                        })
                      }

                    />
                    {getTranslation(consent,lang)}
                  </Label>
                </div>
                <div className="col-md-12">
                  <Label>{getTranslation(signature,lang)}</Label>
                  <Input type="text" className="form-control"
                    name="signature"
                    value={prefillSDdata?.signature}
                    onChange={(e) => {
                      setprefillSDdata((prev) => ({
                        ...prev,
                        signature: e.target.value,
                      }))
                    }}
                  />
                </div>

                <div className="col-md-12">
                  <br />
                  <Label>{getTranslation(prepared,lang)}</Label>
                  <Input type="text" className="form-control"
                    name="prepared"
                    value={prefillSDdata?.prepared}
                    onChange={(e) => {
                      setprefillSDdata((prev) => ({
                        ...prev,
                        prepared: e.target.value,
                      }))
                    }}
                  />
                </div>
              </div>
            </div>
            <br />
            {/* Submit Button */}
            <div className="d-flex gap-3 mt-4 mb-3">
              <Button color="primary" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  ></span>
                ) : (
                  getTranslation("Readmission Sexual Desire Form/पुनः प्रवेश यौन इच्छा प्रपत्र",lang)
                )}
              </Button>
            </div>
          </Form>
        </div>
      </CommonModal>
      {/* Readmission and submit Sexual desire from end  */}


      {/* View sexual desire data form start */}
      <CommonModal
        isOpen={viewSexualDataModal}
        title={getTranslation(`View ${SexualHistory}`,lang)}
        toggler={closeAllModal}
        maxWidth="1200px"
      >
        <Col sm="12"></Col>
        {viewSexualDataModal && (

          <div className="table-responsive p-4" ref={pdfRef}>
            <h4
                  style={{
                    textAlign: "center",
                    textDecoration: "underline",
                    padding: "20px 0",
                  }}
                >
                  {getTranslation(SexualHistory,lang)}
                </h4>
              {viewSexualData ? (
                
                <Table className="table table-bordered table-striped">
                  <thead className="table-light">
                    <tr>
                      <th>{getTranslation("Field/मैदान",lang)}</th>
                      <th>{getTranslation("Value/कीमत",lang)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries({
                        [getTranslation("Name/नाम",lang)]: viewSexualData.name,
                        [getTranslation("Phone/फ़ोन", lang)]: viewSexualData.phone,
                        [getTranslation("Gender/लिंग", lang)]: viewSexualData.gender,
                        [getTranslation("Sexual Misconceptions/यौन भ्रांतियाँ", lang)]: viewSexualData.sex_misconceptions,
                        [getTranslation("Sexual Games as Child/बचपन के यौन खेल", lang)]: viewSexualData.sexual_games_child,
                        [getTranslation("Unpleasant Experiences/अप्रिय अनुभव", lang)]: viewSexualData.unpleasant_experiences,
                        [getTranslation("Bad Attitude Toward Nudity/नग्नता के प्रति खराब रवैया", lang)]: viewSexualData.bad_attitude_nudity,
                        [getTranslation("Age of First Sexual Activity/पहली यौन गतिविधि की आयु", lang)]: viewSexualData.age_first_sexual_activity,
                        [getTranslation("Consensual Activity/सहमति से गतिविधि", lang)]: viewSexualData.consensual_activity,
                        [getTranslation("Current Sexual Functioning/वर्तमान यौन कार्यप्रणाली", lang)]: viewSexualData.current_sexual_functioning,
                        [getTranslation("Sexual Desire Type/यौन इच्छा का प्रकार", lang)]: viewSexualData.sex_desire_type,
                        [getTranslation("Comfort with Sexual Identity/यौन पहचान के साथ आराम", lang)]: viewSexualData.sexual_identity_comfort,
                        [getTranslation("Erotic Material Exposure/कामुक सामग्री का संपर्क", lang)]: viewSexualData.erotic_material_exposure,
                        [getTranslation("Masturbation History/हस्तमैथुन का इतिहास", lang)]: viewSexualData.masturbation_history,
                        [getTranslation("Masturbation Frequency (Years)/हस्तमैथुन आवृत्ति (वर्ष)", lang)]: viewSexualData.masturbation_frequency_years,
                        [getTranslation("Intercourse Frequency/संभोग की आवृत्ति", lang)]: viewSexualData.intercourse_frequency,
                        [getTranslation("Sex Importance in Marriage/विवाह में सेक्स का महत्व", lang)]: viewSexualData.sex_importance_marriage,
                        [getTranslation("Tell Partner Preferences/साथी को पसंद बताना", lang)]: viewSexualData.tell_partner_preferences,
                        [getTranslation("Masturbation After Marriage/विवाह के बाद हस्तमैथुन", lang)]: viewSexualData.masturbation_after_marriage,
                        [getTranslation("Partner Sexual Problems/साथी की यौन समस्याएँ", lang)]: viewSexualData.partner_sexual_problems,
                        [getTranslation("Extramarital Affairs/बाह्य संबंध", lang)]: viewSexualData.extramarital_affairs,
                        [getTranslation("Coitus Outside Marriage/विवाह के बाहर संभोग", lang)]: viewSexualData.coitus_outside_marriage,
                        [getTranslation("Thoughts About Women/महिलाओं के बारे में विचार", lang)]: viewSexualData.women_intercourse_thoughts,
                        [getTranslation("External Aids Usage/बाहरी सहायक उपयोग", lang)]: viewSexualData.external_aids_usage,
                        [getTranslation("Upsetting Experiences/परेशान करने वाले अनुभव", lang)]: viewSexualData.upsetting_experiences,
                        [getTranslation("Sexual Desire Before Or After Substance/पदार्थ के सेवन से पहले या बाद में यौन इच्छा", lang)]: viewSexualData.sex_desire_before_after_substance,
                        [getTranslation("Premature Ejaculation (Substance)/शीघ्रपतन (पदार्थ)", lang)]: viewSexualData.premature_ejaculation_substance,
                        [getTranslation("Ejaculation Effect Or Alcohol Or Drugs /स्खलन प्रभाव या शराब या ड्रग्स", lang)]: viewSexualData.alcohol_drugs_ejaculation_effect,
                        [getTranslation("Frequency Comparison to Past/अतीत से आवृत्ति तुलना", lang)]: viewSexualData.frequency_comparison_past,
                        [getTranslation("Heterosexual Or Homosexual Activity/विषमलैंगिक या समलैंगिक गतिविधि", lang)]: viewSexualData.heterosexual_homosexual_activity,
                        [getTranslation("Prepared By/द्वारा तैयार", lang)]: viewSexualData.prepared_by,                      
                      [getTranslation("Signature/हस्ताक्षर",lang)]: viewSexualData.signature,
                    }).map(([key, value]) => (
                      <tr key={key}>
                        <td className="fw-bold">{key}</td>
                        <td>{value || <span className="text-muted">N/A</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-center text-danger">{getTranslation("No data available./कोई डेटा मौजूद नहीं।",lang)}</p>
              )}
          </div>
        )}
        <div style={{ margin: "20px" }}>
              <button
                disabled={pfaDownload}
                id="download-btn"
                className="btn btn-primary"
                onClick={handleDownloadPDF}
              >
                {pfaDownload
                  ? getTranslation("Your Sexual Desire is being downloaded.../ आपकी यौन इच्छा डाउनलोड की जा रही है...",lang)
                  : getTranslation("Download Your View Sexual History / यौन इतिहास डाउनलोड करें",lang)}
              </button>
            </div>


      </CommonModal>

      {/* View sexual desire data form end */}



      {/* Update and submit Sexual desire from start  */}
      <CommonModal
        isOpen={editindividualModal}
        title={getTranslation(`Update ${SexualHistory}`,lang)}
        toggler={closeAllModal}
        maxWidth="1200px"
      >
        <div className="sd__wrapper">
          <Form className="theme-form" 
          onSubmit={updateSexualDesireHandler}
           >
            {/* Patient name and date of assessment */}
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
            <div className="sd__createWrapper p-3">
              <div className="row">
                {/*Date of Assessment section/परीक्षण की तारीख :*/}
                <div className="col-md-6 mt-3">
                  <FormGroup className="form-group row">
                    <Label className="col-sm-12 col-form-label  col-xl-6">
                      {getTranslation(dateOfAssessment,lang)}
                    </Label>
                    <Col xl="5" sm="12">
                      <div className="input-group">
                        <DatePicker
                          className="form-control digits"
                          selected={editindividualSDData?.date_of_assessment instanceof Date && !isNaN(editindividualSDData?.date_of_assessment)
                            ? editindividualSDData?.date_of_assessment
                            : null}
                          onChange={(date) =>
                            seteditindividualSDData({
                              ...editindividualSDData,
                              date_of_assessment: date,
                            })
                          }
                        />
                      </div>
                    </Col>
                  </FormGroup>
                </div>
              </div>
              {/* Sexual History / यौन इतिहास Questions */}
              <div className="table-responsive">
                <Table bordered>
                  <thead>
                    <tr>
                      <th scope="col">{getTranslation(SexualHistoryID,lang)}</th>
                      <th scope="col">{getTranslation(SexualHistoryquestion,lang)}</th>
                      <th scope="col">{getTranslation(SexualHistoryanswer,lang)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SexuaQuesData.map((q, index) => (
                      <tr key={q.key} className="border">
                        <td className="border px-4 py-2 text-center">{index + 1}</td>
                        <td className="border px-4 py-2">
                          <strong>{getTranslation(q.en,lang)}</strong>
                          <br />
                          <span className="text-gray-600">{q.hi}</span>
                        </td>
                        <td className="border px-4 py-2">
                          <input
                            type="text"
                            className="w-full p-2 border rounded"
                            value={editindividualSDData?.sexualData?.[q.key] || ""}
                            onChange={(e) =>
                              seteditindividualSDData((prev) => ({
                                ...prev,
                                sexualData: {
                                  ...prev.sexualData,
                                  [q.key]: e.target.value,
                                },
                              }))
                            }
                            placeholder="Enter your answer"
                          />
                        </td>
                      </tr>
                    ))}

                  </tbody>
                </Table>
              </div>
              <br />
              <div className="row">
                <div className="consent__wrapper col-md-8">
                  <Label className="d-block" for="chk-ani">
                    <Input
                      className="checkbox_animated"
                      id="chk-ani"
                      type="checkbox"
                      checked={editindividualSDData?.consent === "Yes"}
                      onChange={(e) =>
                        seteditindividualSDData({
                          ...editindividualSDData,
                          consent: e.target.checked ? "Yes" : "No",
                        })
                      }

                    />
                    {getTranslation(consent,lang)}
                  </Label>
                </div>
                <div className="col-md-12">
                  <Label>{getTranslation(signature,lang)}</Label>
                  <Input type="text" className="form-control"
                    name="signature"
                    value={editindividualSDData?.signature}
                    onChange={(e) => {
                      seteditindividualSDData((prev) => ({
                        ...prev,
                        signature: e.target.value,
                      }))
                    }}
                  />
                </div>

                <div className="col-md-12">
                  <br />
                  <Label>{getTranslation(prepared,lang)}</Label>
                  <Input type="text" className="form-control"
                    name="prepared"
                    value={editindividualSDData?.prepared}
                    onChange={(e) => {
                      seteditindividualSDData((prev) => ({
                        ...prev,
                        prepared: e.target.value,
                      }))
                    }}
                  />
                </div>
              </div>
            </div>
            <br />
            {/* Submit Button */}
            <div className="d-flex gap-3 mt-4 mb-3">
              <Button color="primary" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  ></span>
                ) : (
                  getTranslation("Update Sexual Desire Form/यौन इच्छा फ़ॉर्म अपडेट करें",lang)
                )}
              </Button>
            </div>
          </Form>
        </div>
      </CommonModal>
      {/* Update and submit Sexual desire from end  */}

    </Fragment>
  );
}

export default SexualDesire;
