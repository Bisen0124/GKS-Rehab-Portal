import React, { Fragment, useState, useEffect, useRef} from "react";
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
  CognitiveTitle,
  Questions,
  MaximumScore,
  PatientScore,
  Cognitivequestions,
  CognitivequestionsTotal,
  Spaceforwork,
  Remarks,
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
import { H5 } from "../../AbstractElements";
import DatePicker from "react-datepicker";
import CommonModal from "../UiKits/Modals/common/modal";
import HeaderCard from "../Common/Component/HeaderCard";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2"; // ✅ Make sure this is imported at the top

import { Data } from "../UiKits/Spinners/SpinnerData";
import { toast } from "react-toastify";


//Calculate age by DOB custom hook
import useCalculateAge from "../../CustomHook/useCalculateAge";

//Show pateint/user common info like name, age and DOB by custom hook
import PatientCommonInfo from "../../CustomHook/PatientCommonInfo";

//editPFA download PDF library
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import html2pdf from "html2pdf.js";

function CBT() {
  const pdfRef = useRef();
   //spinner extract from other file
    const selectedSpinner = Data.find(
      (item) => item.spinnerClass === "loader-37"
    );


    //PDf view download pdf code handler
        const [pfaDownload, setpfaDownload] = useState(false);
        const handleDownloadPDF = () => {
          const element = pdfRef.current;
          setpfaDownload(true);
      
          // Add a temporary class to scale fonts if needed
          element.classList.add("pdf-scale");
      
          const opt = {
            margin: [10, 10, 10, 10], // top, left, bottom, right
            filename: `user_data_${viewCBTData?.name}_${viewCBTData?.user_id}.pdf`,
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


  //Modal
  const [modal, setModal] = useState(false);
  //Loading spinner
  const [isLoading, setIsLoading] = useState(false);

  //This React hook calculates a user's age based on their date of birth (dob) and returns the age on PFA form by create.
  const [selectedUser, setSelectedUser] = useState(null); // User data
  const dob = selectedUser?.[0]?.dob;
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

    fetch("https://gks-yjdc.onrender.com/api/users", {
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
        const users = res.users || [];

        const formatted = users.map((user) => {
          const admitDate = user.recent_admit_date
            ? new Date(user.recent_admit_date)
            : null;
          const CBTDate = user.recent_cbt_date
            ? new Date(user.recent_cbt_date)
            : null;

          let userStatus = <p className="badge bg-warning text-dark p-2">{"Pending"}</p>;
          if (admitDate && CBTDate && admitDate > CBTDate) {
            userStatus = <p className="badge bg-success p-2">{"Completed"}</p>;
          }

          // const dischargeStatusText = user.discharge_status_text || "Unknown";

          return {
            id: user.user_id,
            gks_id: user.gks_id || "N/A",
            name: user.name,
            status: userStatus,
            dischargeStatus: user.discharge_status,
            dischargeStatusText: user.discharge_status_text,
            isReadmission: user.is_readmission,
            // recent_sda_id: user.recent_sda_id,
            recent_cbt_id: user.recent_cbt_id
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


  //Getting registred patient data into table row 
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
              onClick={() => handleCBTPreFill(row.recent_cbt_id)}
              style={{ cursor: "pointer" }}
              title="Readmission FDA Form"
              >
                ✏️
              </span>
            )}

            {/* Show Create PFA if not discharged and not readmission */}
            {row.dischargeStatus === 0 && row.isReadmission === 0 && (
              <span
                onClick={() => createCBTHandler(row.id)}
                style={{ cursor: "pointer" }}
                title="Create CBT From"
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

  //Registered Patient data list in taable format
  const [dataSecondTbl, setDataSecondTbl] = useState([]);
  useEffect(() => {
    const token = localStorage.getItem("Authorization");

    fetch("https://gks-yjdc.onrender.com/api/cbt/all-cbt-entries", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch CBT entries");
        return response.json();
      })
      .then((res) => {
        const entries = res.entries || [];

        console.log("CBT Response =>", res);

        const formatted = entries.map((entry) => {
          const admitDate = entry.admit_date ? new Date(entry.admit_date) : null;
          const CBTDate = entry.date_of_assessment ? new Date(entry.date_of_assessment) : null;

          let userStatus = <p className="badge bg-warning text-dark p-2">{"Pending"}</p>;
          if (admitDate && CBTDate && admitDate < CBTDate) {
            userStatus = <p className="badge bg-success p-2">{"Completed"}</p>;
          }

          const dischargeStatusText = entry.discharge_status === 1 ? "Discharged" : "Not Discharged";

          return {
            id: entry.user?.user_id || "N/A",
            gks_id: entry.user?.gks_id || "N/A",
            name: entry.user?.name || "N/A",
            status: userStatus,
            dischargeStatus: entry.entry?.discharge_status || 0,
            dischargeStatusText: dischargeStatusText,
            isReadmission: false, // still assuming
            recent_sda_id: entry.cbt_id || "N/A",
            ward: entry.entry?.ward_name || "N/A",
            phone: entry.user?.phone || "N/A",
            email: entry.user?.email || "N/A",
            cbt_id:entry?.cbt_id || "N/A",
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
    { name: "User ID", selector: (row) => row.id, sortable: true, center: true },
    { name: "CBT ID", selector: (row) => row.cbt_id, sortable: true, center: true },
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

    { name: "Email", selector: (row) => row.email, sortable: true, center: true },
    { name: "Phone", selector: (row) => row.phone, sortable: true, center: true },

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
              <>
                <span
                  onClick={() => ViewCBTindividualData(row.cbt_id)}
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
                  onClick={() => handleEditCBTIndividualData(row.cbt_id)}
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






  //Date of Assessment State
  const [startDateOfAssessment, setstartDateOfAssessment] = useState(
    new Date()
  );
  const handleChangeAssessment = (date) => {
    setstartDateOfAssessment(date);
    console.log("Date of Assessment", date);
  };

  //Questions
  const [patientScores, setPatientScores] = useState({});
  // Handle score change
  const handleScoreChange = (id, maxScore, value) => {
    const score = Math.min(Math.max(parseInt(value) || 0, 0), maxScore);
    setPatientScores((prev) => ({ ...prev, [id]: score }));
  };


  // Calculate total score
  const totalScore = Cognitivequestions.reduce(
    (sum, q) => sum + (patientScores[q.id] || 0),
    0
  );


  //Create CBT form handler
  const createCBTHandler = async (userId = null) => {
    console.log("CBT =>", userId);
    setModal(true);
    if (userId) {
      const token = localStorage.getItem("Authorization");
      try {
        const response = await fetch(`https://gks-yjdc.onrender.com/api/users/${userId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        });
        const data = await response.json();
        console.log(data)
        if (!response.ok) throw new Error("User fetch failed");
        setSelectedUser(data);
      } catch (error) {
        console.error("Fetch error:", error);
      }
    }
  }


  //Close all modal handler
  const closePFAModal = () => {
    setModal(false);
    setCBTpreefillModal(false);
    setCBTDataModal(false);
    setCBTindividuallUpdateDataModal(false);
  };


  const [spaceForWork, setSpaceForWork] = useState("");
  const [remarks, setRemarks] = useState("");
  const [preparedBy, setPreparedBy] = useState("");


  const handleSubmitCBT = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const payload = {
      user_id: selectedUser[0]?.user_id, // From PatientCommonInfo
      date_of_assessment: startDateOfAssessment
        ? startDateOfAssessment.toISOString().split("T")[0]
        : "",

      orientation_score: patientScores[1] || 0,
      word_recall_score: patientScores[2] || 0,
      months_backwards_score: patientScores[3] || 0,
      serial_3_score: patientScores[4] || 0,
      serial_7_score: patientScores[5] || 0,
      backward_counting_score: patientScores[6] || 0,
      dinner_question_score: patientScores[7] || 0,
      breakfast_question_score: patientScores[8] || 0,
      independence_day_score: patientScores[9] || 0,
      object_naming_score: patientScores[10] || 0,
      written_instruction_score: patientScores[11] || 0,
      prime_minister_score: patientScores[12] || 0,
      chief_minister_score: patientScores[13] || 0,

      space_for_work: spaceForWork,
      remarks: remarks,
      prepared_by: preparedBy,
    };

    console.log("CBT Payload =>", payload);

    try {
      const token = localStorage.getItem("Authorization");
      const response = await fetch(
        "https://gks-yjdc.onrender.com/api/cbt/create-assessment",
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
      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "CBT Assessment Success!",
          text: "CBT Assessment submitted successfully",
        }).then(() => {
          // This runs after the user clicks "OK"
          setModal(false);
        });
        console.log("CBT Success:", result);
      } else {
        setIsLoading(false);
        Swal.fire({
          icon: "error",
          title: "Error submitting CBT!",
          text: "Error submitting CBT Assessment",
        });
        console.error("CBT Error:", result);

      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };


  //CBT form pree fill by click on pencil icon handler
  const [CBTpreefillData, setCBTpreefillData] = useState(null);
  const [CBTpreefillModal, setCBTpreefillModal]=useState(false);
  const handleCBTPreFill = async (recentCBTid)=>{
    setCBTpreefillModal(true);
    if (typeof recentCBTid === "object" && recentCBTid !== null) {
      recentCBTid = recentCBTid.recent_cbt_id;
  }

  if (!recentCBTid) {
      console.error("Invalid recentCBTid provided");
      return;
  }

  console.log("recentCBTid =>", recentCBTid);

  const token = localStorage.getItem("Authorization");
  
          try {
              const response = await fetch(
                  `https://gks-yjdc.onrender.com/api/cbt/assessment/${recentCBTid}`,
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
  
              console.log("CBT => ", latestAssessment);
  
              if (!latestAssessment) {
                  console.warn("No assessment found for this CBT ID.");
                  return;
              }
  
              setCBTpreefillData({
                user_id: latestAssessment.user_id,
                date_of_assessment: latestAssessment.date_of_assessment
                  ? parseDateString(latestAssessment.date_of_assessment)
                  : "",
                substance_details: latestAssessment.substance_details?.map((item) => ({
                  substance_id: item.substance_id,
                  substance_name: item.substance_name,
                  ever_used: item.ever_used,
                  duration: item.duration,
                  current_use: item.current_use,
                  current_use_pattern: item.current_use_pattern,
                  usual_dose: item.usual_dose,
                  remarks: item.remarks,
                })) || [],
                consent: latestAssessment.consent,
                signature: latestAssessment.signature,
              
                // New fields added from CBT assessment response
                cbt_id: latestAssessment.cbt_id,
                branch_id: latestAssessment.branch_id,
                entry_id: latestAssessment.entry_id,
                visit_no: latestAssessment.visit_no,
                orientation_score: latestAssessment.orientation_score,
                word_recall_score: latestAssessment.word_recall_score,
                months_backwards_score: latestAssessment.months_backwards_score,
                serial_3_score: latestAssessment.serial_3_score,
                serial_7_score: latestAssessment.serial_7_score,
                backward_counting_score: latestAssessment.backward_counting_score,
                dinner_question_score: latestAssessment.dinner_question_score,
                breakfast_question_score: latestAssessment.breakfast_question_score,
                independence_day_score: latestAssessment.independence_day_score,
                object_naming_score: latestAssessment.object_naming_score,
                written_instruction_score: latestAssessment.written_instruction_score,
                prime_minister_score: latestAssessment.prime_minister_score,
                chief_minister_score: latestAssessment.chief_minister_score,
                total_score: latestAssessment.total_score,
                space_for_work: latestAssessment.space_for_work,
                remarks: latestAssessment.remarks,
                prepared_by: latestAssessment.prepared_by,
                status: latestAssessment.status,
              });

              console.log("CBTpreefillData =>" ,CBTpreefillData);
              console.log("Date Of Assssment =>" ,CBTpreefillData.date_of_assessment);

          } catch (error) {
              console.error("Fetch error:", error);
          }
  }


  //CBT readmission form hanlder
  const handleReadmissionCBT = async (e) => {
    e.preventDefault();
    setIsLoading(true);
  
    const payload = {
      user_id: CBTpreefillData.user_id,
      date_of_assessment: CBTpreefillData.date_of_assessment
        ? new Date(CBTpreefillData.date_of_assessment).toISOString().split("T")[0]
        : "",
  
      orientation_score: CBTpreefillData.orientation_score || 0,
      word_recall_score: CBTpreefillData.word_recall_score || 0,
      months_backwards_score: CBTpreefillData.months_backwards_score || 0,
      serial_3_score: CBTpreefillData.serial_3_score || 0,
      serial_7_score: CBTpreefillData.serial_7_score || 0,
      backward_counting_score: CBTpreefillData.backward_counting_score || 0,
      dinner_question_score: CBTpreefillData.dinner_question_score || 0,
      breakfast_question_score: CBTpreefillData.breakfast_question_score || 0,
      independence_day_score: CBTpreefillData.independence_day_score || 0,
      object_naming_score: CBTpreefillData.object_naming_score || 0,
      written_instruction_score: CBTpreefillData.written_instruction_score || 0,
      prime_minister_score: CBTpreefillData.prime_minister_score || 0,
      chief_minister_score: CBTpreefillData.chief_minister_score || 0,
  
      total_score: CBTpreefillData.total_score || 0,
      space_for_work: CBTpreefillData.space_for_work || "",
      remarks: CBTpreefillData.remarks || "",
      prepared_by: CBTpreefillData.prepared_by || "",
    };
  
    console.log("CBT Payload =>", payload);
  //Readmission CBT API
    try {
      const token = localStorage.getItem("Authorization");
      const response = await fetch(
        "https://gks-yjdc.onrender.com/api/cbt/create-assessment",
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

      console.log("readmission cbt result", result);

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "CBT Readmission Assessment Success!",
          text: "CBT Readmission Assessment Created successfully",
        }).then(() => {
          setCBTpreefillModal(false); // Close the modal
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error submitting CBT!",
          text: "Error Readmission CBT Assessment",
        });
        console.error("CBT Error:", result);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  


  //🔧 Convert DD/MM/YYYY to Date Object:
  const parseDateString = (dateStr) => {
    if (!dateStr) return null;

    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
};


// View cbt individual form data hanlder
const [viewCBTDataModal,setCBTDataModal]=useState(false);
const [viewCBTData,setCBTData]=useState(null);
const ViewCBTindividualData = async (CBTID) =>{
  setCBTDataModal(true);
  if (typeof CBTID === "object" && CBTID !== null) {
    CBTID = CBTID.cbt_id;
  }

  console.log("CBTID =>" , CBTID);

  if (!CBTID) {
    console.error("Invalid CBTID provided to toggle");
    return;
  }
  const token = localStorage.getItem("Authorization");
  try {
    const response = await fetch(
        `https://gks-yjdc.onrender.com/api/cbt/assessment/${CBTID}`,
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
        console.error("Fetch error:", data);
        return;
    }

    const ViewCBTDataEntry = data.assessment || null;

    if (!ViewCBTDataEntry) {
        console.warn("No CBT View assessment data found.");
        return;
    }

    setCBTData(ViewCBTDataEntry); // ✅ Correct
    console.log("CBT Data Fetched:", ViewCBTDataEntry.name); // ✅ Log the correct data
    console.log("CBT Data Fetched:", ViewCBTDataEntry.relative_name); // ✅ Log the correct data
     
} catch (error) {
    console.error("Fetch error:", error);
} finally {
    setIsLoading(false);
}
}


// Edit cbt individual form data handler
const [CBTindividuallUpdateData, setCBTindividuallUpdateData] = useState(null);
const [CBTindividuallUpdateDataModal, setCBTindividuallUpdateDataModal]=useState(false);
const handleEditCBTIndividualData = async (CBTID)=>{
  setCBTindividuallUpdateDataModal(true);
  if (typeof CBTID === "object" && CBTID !== null) {
    CBTID = CBTID.cbt_id;
}

if (!CBTID) {
    console.error("Invalid CBTID provided");
    return;
}

console.log("CBTID =>", CBTID);

const token = localStorage.getItem("Authorization");

        try {
            const response = await fetch(
                `https://gks-yjdc.onrender.com/api/cbt/assessment/${CBTID}`,
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

            console.log("CBT => ", latestAssessment);

            if (!latestAssessment) {
                console.warn("No assessment found for this CBT ID.");
                return;
            }

            setCBTindividuallUpdateData({
              user_id: latestAssessment.user_id,
              date_of_assessment: latestAssessment.date_of_assessment
                ? parseDateString(latestAssessment.date_of_assessment)
                : "",
              substance_details: latestAssessment.substance_details?.map((item) => ({
                substance_id: item.substance_id,
                substance_name: item.substance_name,
                ever_used: item.ever_used,
                duration: item.duration,
                current_use: item.current_use,
                current_use_pattern: item.current_use_pattern,
                usual_dose: item.usual_dose,
                remarks: item.remarks,
              })) || [],
              consent: latestAssessment.consent,
              signature: latestAssessment.signature,
            
              // New fields added from CBT assessment response
              cbt_id: latestAssessment.cbt_id,
              branch_id: latestAssessment.branch_id,
              entry_id: latestAssessment.entry_id,
              visit_no: latestAssessment.visit_no,
              orientation_score: latestAssessment.orientation_score,
              word_recall_score: latestAssessment.word_recall_score,
              months_backwards_score: latestAssessment.months_backwards_score,
              serial_3_score: latestAssessment.serial_3_score,
              serial_7_score: latestAssessment.serial_7_score,
              backward_counting_score: latestAssessment.backward_counting_score,
              dinner_question_score: latestAssessment.dinner_question_score,
              breakfast_question_score: latestAssessment.breakfast_question_score,
              independence_day_score: latestAssessment.independence_day_score,
              object_naming_score: latestAssessment.object_naming_score,
              written_instruction_score: latestAssessment.written_instruction_score,
              prime_minister_score: latestAssessment.prime_minister_score,
              chief_minister_score: latestAssessment.chief_minister_score,
              total_score: latestAssessment.total_score,
              space_for_work: latestAssessment.space_for_work,
              remarks: latestAssessment.remarks,
              prepared_by: latestAssessment.prepared_by,
              status: latestAssessment.status,
            });

            console.log("CBTpreefillData =>" ,CBTindividuallUpdateData);
            console.log("Date Of Assssment =>" ,CBTindividuallUpdateData.date_of_assessment);

        } catch (error) {
            console.error("Fetch error:", error);
        }
}



 //CBT update form hanlder
 const handleUpdateCBTAssessment = async (e) => {
  e.preventDefault();
  setIsLoading(true);

  const payload = {
    user_id: CBTindividuallUpdateData.user_id,
    date_of_assessment: CBTindividuallUpdateData.date_of_assessment
      ? new Date(CBTindividuallUpdateData.date_of_assessment).toISOString().split("T")[0]
      : "",

    orientation_score: CBTindividuallUpdateData.orientation_score || 0,
    word_recall_score: CBTindividuallUpdateData.word_recall_score || 0,
    months_backwards_score: CBTindividuallUpdateData.months_backwards_score || 0,
    serial_3_score: CBTindividuallUpdateData.serial_3_score || 0,
    serial_7_score: CBTindividuallUpdateData.serial_7_score || 0,
    backward_counting_score: CBTindividuallUpdateData.backward_counting_score || 0,
    dinner_question_score: CBTindividuallUpdateData.dinner_question_score || 0,
    breakfast_question_score: CBTindividuallUpdateData.breakfast_question_score || 0,
    independence_day_score: CBTindividuallUpdateData.independence_day_score || 0,
    object_naming_score: CBTindividuallUpdateData.object_naming_score || 0,
    written_instruction_score: CBTindividuallUpdateData.written_instruction_score || 0,
    prime_minister_score: CBTindividuallUpdateData.prime_minister_score || 0,
    chief_minister_score: CBTindividuallUpdateData.chief_minister_score || 0,

    total_score: CBTindividuallUpdateData.total_score || 0,
    space_for_work: CBTindividuallUpdateData.space_for_work || "",
    remarks: CBTindividuallUpdateData.remarks || "",
    prepared_by: CBTindividuallUpdateData.prepared_by || "",
  };

  console.log("CBT Updated Assessment Payload =>", payload);
//Readmission CBT API
  try {
    const token = localStorage.getItem("Authorization");
    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/cbt/update-assessment/${viewCBTData.cbt_id}`,
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

    console.log("Updated cbt result", result);

    if (response.ok) {
      Swal.fire({
        icon: "success",
        title: "CBT Assessment Update!",
        text: "CBT Assessment has been update",
      }).then(() => {
        setCBTindividuallUpdateDataModal(false); // Close the modal
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Error Updating CBT!",
        text: "Error Updating CBT Assessment",
      });
      console.error("CBT Error:", result);
    }
  } catch (error) {
    console.error("Fetch error:", error);
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

      {/* CBT all user entries data list into data table start */}

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
                                            title="Cognitive Behavioral Test/ संज्ञानात्मक व्यवहार परीक्षण Patient List"
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
                                            Data is fetching from server. Please wait...
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

      {/* CBT all user entries data list into data table end */}


{/* Create and submit CBT from start  */}
      <CommonModal
        isOpen={modal}
        title={CognitiveTitle}
        toggler={closePFAModal}
        maxWidth="1200px"
      >

        <div className="cbt__wrapper">
          <Form className="theme-form" onSubmit={handleSubmitCBT}>
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
            <div className="row">


              {/*Date of Assessment section/परीक्षण की तारीख :*/}
              <div className="col-md-12 mt-4">
                <FormGroup className="form-group row">
                  <Label className="col-sm-12 col-form-label col-xl-3">
                    {dateOfAssessment}
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
            {/* Questions */}
            <div className="table-responsive">
              <Table bordered>
                <thead>
                  <tr>
                    <th>{tableNumber}</th>
                    <th>{Questions}</th>
                    <th>{MaximumScore}</th>
                    <th>{PatientScore}</th>
                  </tr>
                </thead>
                <tbody>
                  {Cognitivequestions.map((q, index) => (
                    <tr key={q.id}>
                      <td>{index + 1}</td>
                      <td>{q.question}</td>
                      <td>{q.maxScore}</td>
                      <td>
                        <Input
                          type="number"
                          min="0"
                          max={q.maxScore}
                          value={patientScores[q.id] || ""}
                          onChange={(e) =>
                            handleScoreChange(q.id, q.maxScore, e.target.value)
                          }
                          className="form-control"
                        />
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td></td>
                    <td>{CognitivequestionsTotal}</td>
                    <td>{30}</td>
                    <td>{totalScore}</td>
                  </tr>
                </tbody>
              </Table>
            </div>
            <div className="row">
              <div className="col-md-12 mt-4">
                <FormGroup className="mb-0">
                  <Label>{Spaceforwork}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    value={spaceForWork}
                    onChange={(e) => setSpaceForWork(e.target.value)}
                  />
                </FormGroup>
              </div>
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{Remarks}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </FormGroup>
              </div>
              <div className="col-md-12">
                <Label>{prepared}</Label>
                <Input
                  type="text"
                  className="form-control"
                  value={preparedBy}
                  onChange={(e) => setPreparedBy(e.target.value)}
                />
              </div>
            </div>
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
                  "Create Cognitive Behavioral Test (CBT)"
                )}
              </Button>
            </div>
          </Form>
        </div>
      </CommonModal>
{/* Create and submit CBT from end  */}


{/* Pre-fill readmisson CBT from start  */}
<CommonModal
        isOpen={CBTpreefillModal}
        title={`Edit ${CognitiveTitle}`}
        toggler={closePFAModal}
        maxWidth="1200px"
      >

        <div className="cbt__wrapper">
        {CBTpreefillData && (
        <Form className="theme-form" onSubmit={handleReadmissionCBT}>
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

  <div className="row">
    {/* Date of Assessment */}
    <div className="col-md-12 mt-4">
      <FormGroup className="form-group row">
        <Label className="col-sm-12 col-form-label col-xl-3">
          {dateOfAssessment}
        </Label>
        <Col xl="5" sm="12">
          <div className="input-group">
            <DatePicker
              className="form-control digits"
              selected={CBTpreefillData?.date_of_assessment instanceof Date && !isNaN(CBTpreefillData?.date_of_assessment)
                ? CBTpreefillData?.date_of_assessment
                : null}
              onChange={(date) =>
                setCBTpreefillData({
                  ...CBTpreefillData,
                  date_of_assessment: date,
                })
              }
            />
          </div>
        </Col>
      </FormGroup>
    </div>
  </div>

  {/* Questions Table */}
  <div className="table-responsive">
    <Table bordered>
      <thead>
        <tr>
          <th>{tableNumber}</th>
          <th>{Questions}</th>
          <th>{MaximumScore}</th>
          <th>{PatientScore}</th>
        </tr>
      </thead>
      <tbody>
        {Cognitivequestions.map((q, index) => {
          const scoreKeys = [
            "orientation_score",
            "word_recall_score",
            "months_backwards_score",
            "serial_3_score",
            "serial_7_score",
            "backward_counting_score",
            "dinner_question_score",
            "breakfast_question_score",
            "independence_day_score",
            "object_naming_score",
            "written_instruction_score",
            "prime_minister_score",
            "chief_minister_score",
          ];
          const score_key = scoreKeys[index];
          return (
            <tr key={q.id}>
              <td>{index + 1}</td>
              <td>{q.question}</td>
              <td>{q.maxScore}</td>
              <td>
                <Input
                  type="number"
                  min="0"
                  max={q.maxScore}
                  value={CBTpreefillData[score_key] || ""}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 0 && val <= q.maxScore) {
                      const updatedData = {
                        ...CBTpreefillData,
                        [score_key]: val,
                      };
                      updatedData.total_score = scoreKeys.reduce(
                        (sum, key) => sum + (updatedData[key] || 0),
                        0
                      );
                      setCBTpreefillData(updatedData);
                    }
                  }}
                  className="form-control"
                />
              </td>
            </tr>
          );
        })}
        <tr>
          <td></td>
          <td>{CognitivequestionsTotal}</td>
          <td>30</td>
          <td>{CBTpreefillData.total_score || 0}</td>
        </tr>
      </tbody>
    </Table>
  </div>
  <div className="row">
    {/* Each editable field */}
    <div className="col-md-12 mt-4">
      <FormGroup className="mb-0">
        <Label>{Spaceforwork}</Label>
        <Input
          type="textarea"
          className="form-control"
          rows="3"
          value={CBTpreefillData?.space_for_work || ""}
          onChange={(e) =>
            setCBTpreefillData({
              ...CBTpreefillData,
              space_for_work: e.target.value,
            })
          }
        />
      </FormGroup>
    </div>
    <div className="col-md-12">
      <FormGroup className="mb-0">
        <Label>{Remarks}</Label>
        <Input
          type="textarea"
          className="form-control"
          rows="3"
          value={CBTpreefillData?.remarks || ""}
          onChange={(e) =>
            setCBTpreefillData({
              ...CBTpreefillData,
              remarks: e.target.value,
            })
          }
        />
      </FormGroup>
    </div>
    <div className="col-md-12">
      <Label>{prepared}</Label>
      <Input
        type="text"
        className="form-control"
        value={CBTpreefillData?.prepared_by || ""}
        onChange={(e) =>
          setCBTpreefillData({
            ...CBTpreefillData,
            prepared_by: e.target.value,
          })
        }
      />
    </div>
  </div>

  {/* Submit Button */}
  <div className="d-flex gap-3 mt-4 mb-3">
    <Button color="primary" type="submit" disabled={isLoading}>
      {isLoading ? (
        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      ) : (
        "Readmission Cognitive Behavioral Test (CBT)"
      )}
    </Button>
  </div>
</Form>
)}

        </div>
      </CommonModal>
{/* Pre-fill readmisson CBT from end  */}


{/* View/Display CBT form data start */}
<CommonModal
        isOpen={viewCBTDataModal}
        title={`View ${CognitiveTitle}`}
        toggler={closePFAModal}
        maxWidth="1200px"
      >
 <Col sm="12">
 
 {viewCBTData && (
  <div className="table-responsive p-4" ref={pdfRef}>
    <h4
      style={{
        textAlign: "center",
        textDecoration: "underline",
        padding: "20px 0",
      }}
    >
      {CognitiveTitle}
    </h4>
    <Table bordered className="table-striped">
      <tbody>
        <tr>
          <th>Patient Name</th>
          <td>{viewCBTData.name}</td>
          <th>Gender</th>
          <td>{viewCBTData.gender}</td>
        </tr>
        <tr>
          <th>Phone</th>
          <td>{viewCBTData.phone}</td>
          <th>Email</th>
          <td>{viewCBTData.email}</td>
        </tr>
        <tr>
          <th>Date of Birth</th>
          <td>{new Date(viewCBTData.dob).toLocaleDateString()}</td>
          <th>Date of Assessment</th>
          <td>{new Date(viewCBTData.date_of_assessment).toLocaleDateString()}</td>
        </tr>
        <tr>
          <th>Entry ID</th>
          <td>{viewCBTData.entry_gks_id}</td>
          <th>Visit No</th>
          <td>{viewCBTData.visit_no}</td>
        </tr>
        <tr>
          <th>Prepared By</th>
          <td colSpan={3}>{viewCBTData.prepared_by}</td>
        </tr>
        <tr>
          <th colSpan={4} className="bg-light text-center">
            <strong>Individual Cognitive Scores</strong>
          </th>
        </tr>
        <tr>
          <td>Orientation</td>
          <td>{viewCBTData.orientation_score}</td>
          <td>Word Recall</td>
          <td>{viewCBTData.word_recall_score}</td>
        </tr>
        <tr>
          <td>Months Backward</td>
          <td>{viewCBTData.months_backwards_score}</td>
          <td>Serial 3</td>
          <td>{viewCBTData.serial_3_score}</td>
        </tr>
        <tr>
          <td>Serial 7</td>
          <td>{viewCBTData.serial_7_score}</td>
          <td>Backward Counting</td>
          <td>{viewCBTData.backward_counting_score}</td>
        </tr>
        <tr>
          <td>Dinner Question</td>
          <td>{viewCBTData.dinner_question_score}</td>
          <td>Breakfast Question</td>
          <td>{viewCBTData.breakfast_question_score}</td>
        </tr>
        <tr>
          <td>Independence Day</td>
          <td>{viewCBTData.independence_day_score}</td>
          <td>Object Naming</td>
          <td>{viewCBTData.object_naming_score}</td>
        </tr>
        <tr>
          <td>Written Instruction</td>
          <td>{viewCBTData.written_instruction_score}</td>
          <td>Prime Minister</td>
          <td>{viewCBTData.prime_minister_score}</td>
        </tr>
        <tr>
          <td>Chief Minister</td>
          <td>{viewCBTData.chief_minister_score}</td>
          <td><strong>Total Score</strong></td>
          <td><strong>{viewCBTData.total_score}</strong></td>
        </tr>
        <tr>
          <th>Space for Work</th>
          <td colSpan={3}>{viewCBTData.space_for_work}</td>
        </tr>
        <tr>
          <th>Remarks</th>
          <td colSpan={3}>{viewCBTData.remarks}</td>
        </tr>
        <tr>
          <th>Status</th>
          <td>{viewCBTData.status}</td>
          <th>Created By</th>
          <td>{viewCBTData.created_by_name}</td>
        </tr>
      </tbody>
    </Table>
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
                    ? "Your CBT is being downloaded.../ आपका CBT डाउनलोड हो रहा है..."
                    : "Download Your Cognitive Behavioral Test/ संज्ञानात्मक व्यवहार परीक्षण डाउनलोड करें"}
                </button>
              </div>
 
 </Col>
      </CommonModal>
      
      {/* View/Display CBT form data end */}



      {/* Update/Edit individual CBT from start  */}
<CommonModal
        isOpen={CBTindividuallUpdateDataModal}
        title={`Update ${CognitiveTitle}`}
        toggler={closePFAModal}
        maxWidth="1200px"
      >

        <div className="cbt__wrapper">
        {CBTindividuallUpdateData && (
        <Form className="theme-form" onSubmit={handleUpdateCBTAssessment}>
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

  <div className="row">
    {/* Date of Assessment */}
    <div className="col-md-12 mt-4">
      <FormGroup className="form-group row">
        <Label className="col-sm-12 col-form-label col-xl-3">
          {dateOfAssessment}
        </Label>
        <Col xl="5" sm="12">
          <div className="input-group">
            <DatePicker
              className="form-control digits"
              selected={CBTindividuallUpdateData?.date_of_assessment instanceof Date && !isNaN(CBTindividuallUpdateData?.date_of_assessment)
                ? CBTindividuallUpdateData?.date_of_assessment
                : null}
              onChange={(date) =>
                setCBTindividuallUpdateData({
                  ...CBTindividuallUpdateData,
                  date_of_assessment: date,
                })
              }
            />
          </div>
        </Col>
      </FormGroup>
    </div>
  </div>

  {/* Questions Table */}
  <div className="table-responsive">
    <Table bordered>
      <thead>
        <tr>
          <th>{tableNumber}</th>
          <th>{Questions}</th>
          <th>{MaximumScore}</th>
          <th>{PatientScore}</th>
        </tr>
      </thead>
      <tbody>
        {Cognitivequestions.map((q, index) => {
          const scoreKeys = [
            "orientation_score",
            "word_recall_score",
            "months_backwards_score",
            "serial_3_score",
            "serial_7_score",
            "backward_counting_score",
            "dinner_question_score",
            "breakfast_question_score",
            "independence_day_score",
            "object_naming_score",
            "written_instruction_score",
            "prime_minister_score",
            "chief_minister_score",
          ];
          const score_key = scoreKeys[index];
          return (
            <tr key={q.id}>
              <td>{index + 1}</td>
              <td>{q.question}</td>
              <td>{q.maxScore}</td>
              <td>
                <Input
                  type="number"
                  min="0"
                  max={q.maxScore}
                  value={CBTindividuallUpdateData[score_key] || ""}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 0 && val <= q.maxScore) {
                      const updatedData = {
                        ...CBTindividuallUpdateData,
                        [score_key]: val,
                      };
                      updatedData.total_score = scoreKeys.reduce(
                        (sum, key) => sum + (updatedData[key] || 0),
                        0
                      );
                      setCBTindividuallUpdateData(updatedData);
                    }
                  }}
                  className="form-control"
                />
              </td>
            </tr>
          );
        })}
        <tr>
          <td></td>
          <td>{CognitivequestionsTotal}</td>
          <td>30</td>
          <td>{CBTindividuallUpdateData.total_score || 0}</td>
        </tr>
      </tbody>
    </Table>
  </div>
  <div className="row">
    {/* Each editable field */}
    <div className="col-md-12 mt-4">
      <FormGroup className="mb-0">
        <Label>{Spaceforwork}</Label>
        <Input
          type="textarea"
          className="form-control"
          rows="3"
          value={CBTindividuallUpdateData?.space_for_work || ""}
          onChange={(e) =>
            setCBTindividuallUpdateData({
              ...CBTindividuallUpdateData,
              space_for_work: e.target.value,
            })
          }
        />
      </FormGroup>
    </div>
    <div className="col-md-12">
      <FormGroup className="mb-0">
        <Label>{Remarks}</Label>
        <Input
          type="textarea"
          className="form-control"
          rows="3"
          value={CBTindividuallUpdateData?.remarks || ""}
          onChange={(e) =>
            setCBTindividuallUpdateData({
              ...CBTindividuallUpdateData,
              remarks: e.target.value,
            })
          }
        />
      </FormGroup>
    </div>
    <div className="col-md-12">
      <Label>{prepared}</Label>
      <Input
        type="text"
        className="form-control"
        value={CBTindividuallUpdateData?.prepared_by || ""}
        onChange={(e) =>
          setCBTindividuallUpdateData({
            ...CBTindividuallUpdateData,
            prepared_by: e.target.value,
          })
        }
      />
    </div>
  </div>

  {/* Submit Button */}
  <div className="d-flex gap-3 mt-4 mb-3">
    <Button color="primary" type="submit" disabled={isLoading}>
      {isLoading ? (
        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      ) : (
        "Update Cognitive Behavioral Test (CBT)"
      )}
    </Button>
  </div>
</Form>
)}

        </div>
      </CommonModal>
{/* Update/Edit individual CBT from end  */}

    </Fragment>
  );
}

export default CBT;
