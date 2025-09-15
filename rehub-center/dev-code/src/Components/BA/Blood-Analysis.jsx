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

const BloodAnalysis = () => {

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
            const BADate = user.recent_blood_analysis_date
              ? new Date(user.recent_blood_analysis_date)
              : null;
  
              let isBACompleted = false;
            let userStatus = (
              <p className="badge bg-warning text-dark p-2">{"Pending"}</p>
            );
            if (admitDate && BADate && admitDate > BADate) {
              isBACompleted = true;
              userStatus = <p className="badge bg-success p-2">{"Completed"}</p>;
            }
  
            const dischargeStatus = user.discharge_status_text || "Unknown";
  
            return {
              id: user.user_id,
              gks_id: user.gks_id || "N/A",
              recentBAId: user.recent_blood_analysis_id || " ",
              name: user.name,
              status: userStatus,
              isBACompleted,
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
      // {
      //   name: "Recent BA ID's",
      //   selector: (row) => row.recentBAId,
      //   sortable: true,
      //   center: true,
      // },
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
                  onClick={() => handleBAprefill(row.recentBAId)}
                  style={{ cursor: "pointer" }}
                  title="Readmission FDA Form"
                >
                  ✏️
                </span>
              )}

              {/* <span
                  onClick={() => handleBAprefill(row.recentBAId)}
                  style={{ cursor: "pointer" }}
                  title="Readmission FDA Form"
                >
                  ✏️
                </span> */}
  
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
    onClick={() => (row.isBACompleted ? null : createSUDBrief(row.id))}
    style={{
      cursor: row.isBACompleted ? "not-allowed" : "pointer",
      opacity: row.isBACompleted ? 0.5 : 1,
    }}
    title={row.isBACompleted ? "BA Completed" : "Create BA"}
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
        `https://gks-yjdc.onrender.com/api/blood-analysis/all-entries?branch_id=${selectedBranch}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        }
      )
        .then((response) => {
          if (!response.ok) throw new Error("Failed to fetch Blood Analysis entries list");
          return response.json();
        })
        .then((res) => {
          const baEntries = res.data || [];
    
          const formattedBAPatients = baEntries.map((item) => ({
            // top level
            blood_analysis_id: item.blood_analysis_id,
            status: item.status,
    
            // user details
            user_id: item.user_id || null,
            name: item.name || "",
            phone: item.phone || "",
            email: item.email || "",
            gks_id: item.gks_id || "",
            dob: item.dob || null,
            gender: item.gender || "",
            branch_name: item.branch_name || "",
            custom_code: item.custom_code || "",
    
            // entry details
            entry_id: item.entry_id || null,
            visit_no: item.visit_no || null,
            admit_date: item.admit_date || null,
            ward_name: item.ward_name || "",
    
            // assessment details
            date_of_assessment: item.date_of_assessment || null,
            sample_collected: item.sample_collected || "No",
            package_name: item.package_name || "",
            package_description: item.package_description || "",
            severity_name: item.severity_name || "",
            severity_description: item.severity_description || "",
    
            // report details
            report_file_path: item.report_file_path || "",
            report_file_type: item.report_file_type || "",
            remarks: item.remarks || "",
    
            // audit (meta info)
            created_at: item.created_at || null,
            updated_at: item.updated_at || null,
          }));
    
          console.log("Formatted Blood Analysis Patients:", formattedBAPatients);
    
          setTimeout(() => {
            setfdaData(formattedBAPatients);
            setFilteredDataone(formattedBAPatients);
            setstillLoading(false);
          }, 500);
        })
        .catch((error) => {
          console.error("Error fetching Blood Analysis entries:", error);
          setstillLoading(true);
        });
    }, [selectedBranch]);
    
  
    const tableColumnsBAList = [
      {
        name: "BA ID",
        selector: (row) => row.blood_analysis_id,
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
            <p className="badge bg-success p-2">BA {row.status}</p>
          </span>
        ),
      },
      {
        name: "Action",
        center: true,
        cell: (row) => (
          <div className="d-flex gap-2">
            <span
              onClick={() => viewBAFormData(row.blood_analysis_id)}
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
              onClick={() => handleBAindividualEdit(row.blood_analysis_id)}
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


 



  //Crete BA form function start
  //Loading spinner
    const [isBAModalOpen, setIsBAModalOpen] = useState(false);
    const createSUDBrief = async (userId = null) => {
      setIsBAModalOpen(true);
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
   //Create BA form function start


   
   //spinner extract from other file
     const selectedSpinner = Data.find(
       (item) => item.spinnerClass === "loader-37"
     );
     //Loading spinner

     //Submit BA form hanlder start

     //Get packages from API start
     const [packages, setPackages] = useState([]);
     
     useEffect(() => {
      const fetchPackages = async () => {
        const token = localStorage.getItem("Authorization");
        // use selectedBranch from props
        const branch_id = selectedBranch;
  
        try {
          const res = await fetch(
            `https://gks-yjdc.onrender.com/api/blood-analysis/package-types?branch_id=${branch_id}`,
            {
              method: "GET", // changed to GET if API supports it
              headers: {
                "Content-Type": "application/json",
                Authorization: `${token}`,
              },
              // body: JSON.stringify(payload), // remove if not needed
            }
          );
  
          const data = await res.json();
  
          if (data.success && data.data) {
            setPackages(data.data); // no filter, all packages
          }
          
        } catch (error) {
          console.error("Error fetching packages:", error);
        }
      };
  
      if (selectedBranch) fetchPackages();
    }, [selectedBranch]); // dependency fixed

    //Get packages from API end


    //Get severity from API start
    const [severity, setSeverity] = useState([]);
     
    useEffect(() => {
     const fetchSeverity = async () => {
       const token = localStorage.getItem("Authorization");
       // use selectedBranch from props
       const branch_id = selectedBranch;
 
       try {
         const res = await fetch(
           `https://gks-yjdc.onrender.com/api/blood-analysis/severity-levels?branch_id=${branch_id}`,
           {
             method: "GET", // changed to GET if API supports it
             headers: {
               "Content-Type": "application/json",
               Authorization: `${token}`,
             },
             // body: JSON.stringify(payload), // remove if not needed
           }
         );
 
         const data = await res.json();
 
         if (data.success && data.data) {
          setSeverity(data.data); // no filter, all Severity
         }
         
       } catch (error) {
         console.error("Error fetching Severity:", error);
       }
     };
 
     if (selectedBranch) fetchSeverity();
   }, [selectedBranch]); // dependency fixed

   //Get severity from API end

   const [isLoading, setIsLoading] = useState(false);

   const [formData, setFormData] = useState({
    date_of_assessment: new Date(),
    package_type_id: "",
    package_name: "",
    sample_collected: false,
    sample_collection_time: new Date().toISOString(),
    severity_id: "",
    severity_name: "",
    report_file: "Dummt.pdf",
    report_file_type: "",
    remarks: "",
  });
  
 
 // Generic handler
const handleChange = (e) => {
  const { name, type, value, checked, files } = e.target;
  if (type === "checkbox") {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  } else if (type === "file") {
    setFormData((prev) => ({ ...prev, report_file: files[0] }));
  } else {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }
};

// Handle file change
const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    // detect type properly
    let fileType = "FILE";
    if (file.type.includes("pdf")) fileType = "PDF";
    else if (
      file.type.includes("jpg") ||
      file.type.includes("jpeg") ||
      file.type.includes("png")
    ) {
      fileType = "IMAGE";
    }

    setFormData((prev) => ({
      ...prev,
      report_file_path: file.name, // just "report.pdf"
      report_file_type: fileType,
    }));
  }
};


// Handle Package Selection
const handlePackageChange = (e) => {
  const selectedPackage = packages.find(
    (pkg) => pkg.package_type_id.toString() === e.target.value
  );
  if (selectedPackage) {
    setFormData((prev) => ({
      ...prev,
      package_type_id: selectedPackage.package_type_id,
      package_name: selectedPackage.package_name,
    }));
  }
};

// Handle Severity Selection
const handleSeverityChange = (e) => {
  const selected = severity.find(
    (sev) => sev.severity_id.toString() === e.target.value
  );
  if (selected) {
    setFormData((prev) => ({
      ...prev,
      severity_id: selected.severity_id,
      severity_name: selected.severity_name,
    }));
  }
};

const handleAssesmentDateChange = (name, date) => {
  setFormData((prev) => ({
    ...prev,
    [name]: date,
  }));
};

const SubmitBAFormHandler = async (e) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const token = localStorage.getItem("Authorization");
    const branch_id = selectedBranch;

    const payload = {
      user_id: selectedUser?.user_id,
      date_of_assessment: formData.date_of_assessment?.toISOString(),
      package_type_id: formData.package_type_id,
      package_name: formData.package_name,
      sample_collected: formData.sample_collected ? "Yes" : "No",
      sample_collection_time: formData.sample_collection_time,
      severity_id: formData.severity_id,
      severity_name: formData.severity_name,
      report_file_path: formData.report_file, // TODO: handle upload if needed
      report_file_type: formData.report_file_type,
      remarks: formData.remarks,
    };

    console.log("Payload to submit:", payload);

    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/blood-analysis/create-assessment?branch_id=${branch_id}`,
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
      title: "Blood Analysis Form Created Successfully",
      text: "The form was submitted successfully.",
    }).then(() => closeAllmodal());

    console.log("Response Data:", data);
  } catch (err) {
    console.error(err);
    setIsLoading(false);
    Swal.fire({
      icon: "error",
      title: "Unexpected Error",
      text: "Failed to submit. Check console for error.",
    });
  }
};


     //Submit BA form function end


     // View BA form function start
const [viewBAData, setViewBAData] = useState(null);
const [viewBAModal, setViewBAModal] = useState(false);

const viewBAFormData = async (bloodAnalysisId) => {
  setViewBAModal(true);
  console.log("Blood Analysis ID =>", bloodAnalysisId);

  if (!bloodAnalysisId) {
    console.error("Invalid Blood Analysis ID provided");
    return;
  }

  setIsLoading(true);
  const token = localStorage.getItem("Authorization");

  try {
    const branch_id = selectedBranch;
    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/blood-analysis/assessment/${bloodAnalysisId}?branch_id=${branch_id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      }
    );

    const data = await response.json();
    console.log("Raw BA API Response:", data);

    if (!response.ok) {
      console.error("Fetch error:", data);
      return;
    }

    // ✅ Extract from data.data
    const ViewBADataEntry = data.data || null;
    console.log("Extracted BA Data Entry:", ViewBADataEntry);

    if (!ViewBADataEntry) {
      console.warn("No Blood Analysis assessment data found.");
      return;
    }

    setViewBAData(ViewBADataEntry);
    console.log("Blood Analysis Data Fetched ID:", ViewBADataEntry.blood_analysis_id);
  } catch (error) {
    console.error("Fetch error:", error);
  } finally {
    setIsLoading(false);
  }
};
// View BA form function end



// Edit BA form function start
const parseDateString = (dateStr) => {
  if (!dateStr) return null;

  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};
const [BAEditData, setBAEditData] = useState(null);
const [IsBAEditModal, setIsBAEditModal] = useState(false);

const handleBAindividualEdit = async (editBAID = null) => {
  setIsBAEditModal(true);

  if (typeof editBAID === "object" && editBAID !== null) {
    editBAID = editBAID.blood_analysis_id;
  }

  if (!editBAID) {
    console.error("Invalid editBAID provided");
    return;
  }

  console.log("BA ID For Edit:", editBAID);
  const token = localStorage.getItem("Authorization");

  try {
    const branch_id = selectedBranch;
    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/blood-analysis/assessment/${editBAID}?branch_id=${branch_id}`,
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
      console.error("BA fetch error:", data);
      return;
    }

    // ✅ Correct: pick from data.data
    const latestAssessment = data.data || null;

    if (!latestAssessment) {
      console.warn("No BA assessment found for this ID.");
      return;
    }

    setSelectedUser(latestAssessment);
    console.log("Selected BA User Assessment for edit:", latestAssessment);

    // ✅ Map payload into your BA form structure
    setBAEditData({
      blood_analysis_id: latestAssessment.blood_analysis_id,
      user_id: latestAssessment.user_id,
      entry_id: latestAssessment.entry_id,
      branch_id: latestAssessment.branch_id,
      visit_no: latestAssessment.visit_no,

      date_of_assessment: latestAssessment.date_of_assessment
        ? parseDateString(latestAssessment.date_of_assessment)
        : "",

      package_type_id: latestAssessment.package_type_id,
      package_name: latestAssessment.package_name,
      package_description: latestAssessment.package_description,

      sample_collected: latestAssessment.sample_collected,
      sample_collection_time: latestAssessment.sample_collection_time
        ? parseDateString(latestAssessment.sample_collection_time)
        : "",

      report_file_path: latestAssessment.report_file_path,
      report_file_type: latestAssessment.report_file_type,

      remarks: latestAssessment.remarks,

      severity_id: latestAssessment.severity_id,
      severity_name: latestAssessment.severity_name,
      severity_level_name: latestAssessment.severity_level_name,
      severity_description: latestAssessment.severity_description,

      status: latestAssessment.status,
      isActive: latestAssessment.isActive,
      created_by: latestAssessment.created_by,
      updated_by: latestAssessment.updated_by,
      created_at: latestAssessment.created_at,
      updated_at: latestAssessment.updated_at,

      // User details from API
      name: latestAssessment.name,
      phone: latestAssessment.phone,
      email: latestAssessment.email,
      gks_id: latestAssessment.gks_id,
      dob: latestAssessment.dob
        ? parseDateString(latestAssessment.dob)
        : "",
      gender: latestAssessment.gender,
      address: latestAssessment.address,
      custom_code: latestAssessment.custom_code,
      admit_date: latestAssessment.admit_date
        ? parseDateString(latestAssessment.admit_date)
        : "",
      ward_name: latestAssessment.ward_name,
      branch_name: latestAssessment.branch_name,
      user_branch_id: latestAssessment.user_branch_id,
    });

    console.log("Mapped BA Edit Data:", latestAssessment);
  } catch (error) {
    console.error("Fetch error:", error);
  }
};
// Edit BA form function end


// ✅ Update BA Form Data Handler start
const updateBAHandler = async (e) => {
  e.preventDefault();
  setIsLoading(true);

  const payload = {
    user_id: BAEditData?.user_id || "",
    date_of_assessment: BAEditData?.date_of_assessment
      ? new Date(BAEditData.date_of_assessment).toISOString().split("T")[0]
      : "",

    package_type_id: BAEditData?.package_type_id || "",
    package_name: BAEditData?.package_name || "",
    sample_collected: BAEditData?.sample_collected ? "Yes" : "No",
    sample_collection_time: BAEditData?.sample_collection_time
      ? new Date(BAEditData.sample_collection_time).toISOString()
      : "",

    severity_id: BAEditData?.severity_id || "",
    severity_name: BAEditData?.severity_name || "",
    remarks: BAEditData?.remarks || "",

    report_file_path: BAEditData?.report_file_path || "",
    report_file_type: BAEditData?.report_file_type || "",
  };

  console.log("Update BA Payload =>", payload);

  try {
    const token = localStorage.getItem("Authorization");
    const branch_id = selectedBranch;
    const response = await fetch(
     `https://gks-yjdc.onrender.com/api/blood-analysis/update-assessment/${BAEditData?.blood_analysis_id}?branch_id=${branch_id}`,
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
        title: "Blood Analysis Updated",
        text: "The blood analysis form has been successfully updated.",
      });
    } else {
      console.error("Error Response:", result);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: result.message || "There was an error updating the form.",
      });
    }
  } catch (error) {
    console.error("Fetch Error:", error);
    Swal.fire({
      icon: "error",
      title: "Network Error",
      text: "A network or server issue occurred.",
    });
  } finally {
    setIsLoading(false);
  }
};

// ✅ Update BA Form Data Handler end



// ✅ Prefill BA form handler start
const [BAPrefillData, setBAPrefillData] = useState({});
const [BAPrefillModal, setBAPrefillModal] = useState(false);

const handleBAprefill = async (prefillBAID = null) => {
  setBAPrefillData(true);
  // Normalize ID if object
  if (typeof prefillBAID === "object" && prefillBAID !== null) {
    prefillBAID = prefillBAID.blood_analysis_id || prefillBAID.id;
  }

  // ✅ If no valid ID, stop here and don’t open modal
  if (!prefillBAID) {
    Swal.fire({
      icon: "warning",
      title: "Missing Blood Analysis ID",
      text: "Please provide a valid Blood Analysis ID before opening the form.",
    });
    return; // ⛔ stop execution
  }

  console.log("BA ID For Prefill:", prefillBAID);
  const token = localStorage.getItem("Authorization");

  try {
    const branch_id = selectedBranch;
    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/blood-analysis/assessment/${prefillBAID}?branch_id=${branch_id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      }
    );

    const data = await response.json();
    console.log("Raw BA API Response:", data);

    if (!response.ok) {
      Swal.fire({
        icon: "error",
        title: "Fetch Failed",
        text: data.message || "Unable to fetch blood analysis data for prefill.",
      });
      return;
    }

    const latestAssessment = data.data || null;
    if (!latestAssessment) {
      Swal.fire({
        icon: "info",
        title: "No Data Found",
        text: "No blood analysis data available for this ID.",
      });
      return;
    }

    // ✅ Open modal only when valid data
    setBAPrefillModal(true);

    // ✅ Wrap in array so PatientCommonInfo works (expects [0])
    setSelectedUser([latestAssessment]);

    // ✅ Map BA-specific fields
    const mappedData = {
      blood_analysis_id: latestAssessment.blood_analysis_id,
      user_id: latestAssessment.user_id,
      branch_id: latestAssessment.branch_id,
      entry_id: latestAssessment.entry_id,
      visit_no: latestAssessment.visit_no,

      date_of_assessment: latestAssessment.date_of_assessment
        ? new Date(latestAssessment.date_of_assessment)
        : null,

      package_type_id: latestAssessment.package_type_id,
      package_name: latestAssessment.package_name || "",
      package_description: latestAssessment.package_description || "",

      sample_collected: latestAssessment.sample_collected || "No",
      sample_collection_time: latestAssessment.sample_collection_time
        ? new Date(latestAssessment.sample_collection_time)
        : null,

      report_file_path: latestAssessment.report_file_path || "",
      report_file_type: latestAssessment.report_file_type || "",
      remarks: latestAssessment.remarks || "",

      severity_id: latestAssessment.severity_id,
      severity_name: latestAssessment.severity_name || "",
      severity_description: latestAssessment.severity_description || "",
      severity_level_name: latestAssessment.severity_level_name || "",

      status: latestAssessment.status || "",
      isActive: latestAssessment.isActive || 0,

      // User Info
      patient_name: latestAssessment.name || "",
      dob: latestAssessment.dob ? new Date(latestAssessment.dob) : null,
      gender: latestAssessment.gender || "",
      address: latestAssessment.address || "",
      gks_id: latestAssessment.gks_id || "",
      phone: latestAssessment.phone || "",
      email: latestAssessment.email || "",
      branch_name: latestAssessment.branch_name || "",
      custom_code: latestAssessment.custom_code || "",
      admit_date: latestAssessment.admit_date
        ? new Date(latestAssessment.admit_date)
        : null,
      ward_name: latestAssessment.ward_name || "",
    };

    setBAPrefillData(mappedData);

    console.log("✅ Mapped BA Prefill Data:", mappedData);
  } catch (error) {
    console.error("Prefill BA fetch error:", error);
    Swal.fire({
      icon: "error",
      title: "Network Error",
      text: "Unable to fetch blood analysis data due to a network issue.",
    });
  }
};
// ✅ Prefill BA form handler end


// ✅ Submit BA Readmission form handler start
const SubmitBAReadmissionFormHandler = async (e) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const token = localStorage.getItem("Authorization");
    const branch_id = selectedBranch;

    const payload = {
      user_id: BAPrefillData?.user_id,
      date_of_assessment: BAPrefillData?.date_of_assessment
        ? new Date(BAPrefillData.date_of_assessment).toISOString()
        : null,

      package_type_id: BAPrefillData?.package_type_id || null,
      package_name: BAPrefillData?.package_name || null,

      sample_collected: BAPrefillData?.sample_collected === "Yes" ? "Yes" : "No",
      sample_collection_time: BAPrefillData?.sample_collection_time
        ? new Date(BAPrefillData.sample_collection_time).toISOString()
        : null,

      severity_id: BAPrefillData?.severity_id || null,
      severity_name: BAPrefillData?.severity_name || null,

      report_file_path: BAPrefillData?.report_file_path || "", // TODO: handle file upload separately
      report_file_type: BAPrefillData?.report_file_type || "PDF",

      remarks: BAPrefillData?.remarks?.trim() || null,
    };

    console.log("✅ Payload to submit:", payload);

    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/blood-analysis/create-assessment?branch_id=${branch_id}`,
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
      title: "Blood Analysis Form Created Successfully",
      text: "The form was submitted successfully.",
    }).then(() => closeAllmodal());

    console.log("✅ Response Data:", data);
  } catch (err) {
    console.error("❌ Submit error:", err);
    setIsLoading(false);
    Swal.fire({
      icon: "error",
      title: "Unexpected Error",
      text: "Failed to submit. Check console for error.",
    });
  }
};
// ✅ Submit BA Readmission form handler end





    //Close all modal handler
  const closeAllmodal = () => {
    setIsBAModalOpen(false);
    setViewBAModal(false);
    setIsBAEditModal(false);
    setBAPrefillModal(false);
  }

  //PDf view download pdf code handler
    const [pfaDownload, setpfaDownload] = useState(false);
    const handleDownloadPDF = () => {
      const element = pdfRef.current;
      setpfaDownload(true);
  
      // Add a temporary class to scale fonts if needed
      element.classList.add("pdf-scale");
  
      const opt = {
        margin: [10, 10, 10, 10], // top, left, bottom, right
        filename: `user_data_${viewBAData?.name}_${viewBAData?.user_id}.pdf`,
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
   <frameElement>
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
                    <HeaderCard title="All Blood Analysis Data List" className="p-0" />
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
                      columns={tableColumnsBAList}
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

{/* BA create form start */}
<CommonModal
  isOpen={isBAModalOpen}
  title="Create Blood Analysis Form"
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

  <div className="ow px-3 pt-4 pb-3">
    <form onSubmit={SubmitBAFormHandler}>
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
                              selected={formData.date_of_assessment}
                              onChange={(date) =>
                                handleAssesmentDateChange(
                                  "date_of_assessment",
                                  date
                                )
                              }
                            />
                          </div>
                        </Col>
                      </FormGroup>
                    </div>{" "}
                    {/*Date of Admission section/प्रवेश की तिथि :*/}
      {/* Package Selection */}
      <div className="mb-3">
        <label htmlFor="package_type_id">Package Selection</label>
        <select
          id="package_type_id"
          name="package_type_id"
          className="form-control"
          value={formData.package_type_id}
          onChange={handlePackageChange}
          required
        >
          <option value="">Select Package</option>
          {packages.map((pkg) => (
            <option key={pkg.package_type_id} value={pkg.package_type_id}>
              {pkg.package_name}
            </option>
          ))}
        </select>
      </div>

      {/* Sample Collected */}
      <div className="form-check mb-3">
        <input
          type="checkbox"
          id="sample_collected"
          name="sample_collected"
          className="form-check-input checkbox_animated"
          checked={formData.sample_collected}
          onChange={handleChange}
        />
        <label className="form-check-label" htmlFor="sample_collected">
          Sample Collected
        </label>
      </div>

     {/* Report Upload */}
<div className="mb-3">
  <label htmlFor="reportFile">Upload Report (PDF/Image)</label>
  <input
    type="file"
    id="reportFile"
    name="report_file"
    className="form-control"
    accept=".pdf,.jpg,.png,.jpeg"
    onChange={handleFileChange}
  />
</div>

      {/* Remarks */}
      <div className="mb-3">
        <label htmlFor="remarks">Remarks</label>
        <input
          type="text"
          id="remarks"
          name="remarks"
          className="form-control"
          placeholder="Add any additional remarks"
          value={formData.remarks}
          onChange={handleChange}
        />
      </div>

      {/* Severity Selection */}
      <div className="mb-3">
        <label htmlFor="severity_id">Package Severity</label>
        <select
          id="severity_id"
          name="severity_id"
          className="form-control"
          value={formData.severity_id}
          onChange={handleSeverityChange}
          required
        >
          <option value="">Select Severity</option>
          {severity.map((sev) => (
            <option key={sev.severity_id} value={sev.severity_id}>
              {sev.severity_name}
            </option>
          ))}
        </select>
      </div>

      {/* Submit Button */}
      <div className="d-flex gap-3 pt-3">
        <Button color="primary" type="submit" disabled={isLoading}>
          {isLoading ? (
            <span
              className="spinner-border spinner-border-sm"
              role="status"
              aria-hidden="true"
            ></span>
          ) : (
            "Create Blood Analysis Form"
          )}
        </Button>
      </div>
    </form>
  </div>
</CommonModal>
{/* BA create form end */}

 {/* View BA data into modal start */}
<CommonModal
  isOpen={viewBAModal}
  title={"View Blood Analysis Assessment"}
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
      Blood Analysis Report / रक्त विश्लेषण रिपोर्ट
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
        ) : viewBAData ? (
          <>
            <tr>
              <th className="text-start p-3">Patient Name</th>
              <td className="border p-3">{viewBAData.name}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Phone</th>
              <td className="border p-3">{viewBAData.phone}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Email</th>
              <td className="border p-3">{viewBAData.email}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Gender</th>
              <td className="border p-3">{viewBAData.gender}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Date of Birth</th>
              <td className="border p-3">
                {viewBAData.dob
                  ? new Date(viewBAData.dob).toLocaleDateString()
                  : ""}
              </td>
            </tr>
            <tr>
              <th className="text-start p-3">Assessment Date</th>
              <td className="border p-3">
                {viewBAData.date_of_assessment
                  ? new Date(viewBAData.date_of_assessment).toLocaleDateString()
                  : ""}
              </td>
            </tr>
            <tr>
              <th className="text-start p-3">Package</th>
              <td className="border p-3">
                {viewBAData.package_name} - {viewBAData.package_description}
              </td>
            </tr>
            <tr>
              <th className="text-start p-3">Sample Collected</th>
              <td className="border p-3">{viewBAData.sample_collected}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Sample Collection Time</th>
              <td className="border p-3">
                {viewBAData.sample_collection_time
                  ? new Date(
                      viewBAData.sample_collection_time
                    ).toLocaleString()
                  : ""}
              </td>
            </tr>
            <tr>
              <th className="text-start p-3">Severity</th>
              <td className="border p-3">
                {viewBAData.severity_name} -{" "}
                {viewBAData.severity_description || ""}
              </td>
            </tr>
            <tr>
              <th className="text-start p-3">Remarks</th>
              <td className="border p-3">{viewBAData.remarks}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Status</th>
              <td className="border p-3">{viewBAData.status}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Report File</th>
              <td className="border p-3">
                {viewBAData.report_file_path ? (
                  <a
                    href={viewBAData.report_file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Report ({viewBAData.report_file_type})
                  </a>
                ) : (
                  "Not Uploaded"
                )}
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
        ? "Your BA Report is being downloaded... / आपका BA रिपोर्ट डाउनलोड हो रहा है..."
        : "Download BA Report"}
    </button>
  </div>
</CommonModal>
{/* View BA data into modal end */}



{/* BA edit form start */}
<CommonModal
  isOpen={IsBAEditModal}
  title="Edit Blood Analysis Form"
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
    <form onSubmit={updateBAHandler}>
      {/* Date of Assessment */}
      <div className="col-md-6">
        <FormGroup className="form-group row">
          <Label className="col-sm-12 col-form-label col-xl-6">
            {dateOfAssessment}
          </Label>
          <Col xl="5" sm="12">
            <div className="input-group">
              <DatePicker
                className="form-control digits"
                selected={
                  BAEditData?.date_of_assessment instanceof Date &&
                  !isNaN(BAEditData?.date_of_assessment)
                    ? BAEditData?.date_of_assessment
                    : null
                }
                onChange={(date) =>
                  setBAEditData({
                    ...BAEditData,
                    date_of_assessment: date,
                  })
                }
              />
            </div>
          </Col>
        </FormGroup>
      </div>

      {/* Package Selection */}
      <div className="mb-3">
        <label htmlFor="package_type_id">Package Selection</label>
        <select
          id="package_type_id"
          name="package_type_id"
          className="form-control"
          value={BAEditData?.package_type_id || ""}
          onChange={(e) =>
            setBAEditData({
              ...BAEditData,
              package_type_id: e.target.value,
            })
          }
          required
        >
          <option value="">Select Package</option>
          {packages.map((pkg) => (
            <option key={pkg.package_type_id} value={pkg.package_type_id}>
              {pkg.package_name}
            </option>
          ))}
        </select>
      </div>

      {/* Sample Collected */}
      <div className="form-check mb-3">
        <input
          type="checkbox"
          id="sample_collected"
          name="sample_collected"
          className="form-check-input checkbox_animated"
          checked={BAEditData?.sample_collected === "Yes"}
          onChange={(e) =>
            setBAEditData({
              ...BAEditData,
              sample_collected: e.target.checked ? "Yes" : "No",
            })
          }
        />
        <label className="form-check-label" htmlFor="sample_collected">
          Sample Collected
        </label>
      </div>

      {/* Sample Collection Time */}
      <div className="col-md-6 mb-3">
        <FormGroup className="form-group row">
          <Label className="col-sm-12 col-form-label col-xl-6">
            Sample Collection Time
          </Label>
          <Col xl="5" sm="12">
            <div className="input-group">
              <DatePicker
                className="form-control digits"
                showTimeSelect
                dateFormat="Pp"
                selected={
                  BAEditData?.sample_collection_time instanceof Date &&
                  !isNaN(BAEditData?.sample_collection_time)
                    ? BAEditData?.sample_collection_time
                    : null
                }
                onChange={(date) =>
                  setBAEditData({
                    ...BAEditData,
                    sample_collection_time: date,
                  })
                }
              />
            </div>
          </Col>
        </FormGroup>
      </div>

      {/* Report Upload */}
      <div className="mb-3">
        <label htmlFor="reportFile">Upload Report (PDF/Image)</label>
        <input
          type="file"
          id="reportFile"
          name="report_file"
          className="form-control"
          accept=".pdf,.jpg,.png,.jpeg"
          onChange={handleFileChange}
        />
        {BAEditData?.report_file_path && (
          <small className="text-muted">
            Current File: {BAEditData?.report_file_path}
          </small>
        )}
      </div>

      {/* Remarks */}
      <div className="mb-3">
        <label htmlFor="remarks">Remarks</label>
        <input
          type="text"
          id="remarks"
          name="remarks"
          className="form-control"
          placeholder="Add any additional remarks"
          value={BAEditData?.remarks || ""}
          onChange={(e) =>
            setBAEditData({
              ...BAEditData,
              remarks: e.target.value,
            })
          }
        />
      </div>

      {/* Severity Selection */}
      <div className="mb-3">
        <label htmlFor="severity_id">Package Severity</label>
        <select
          id="severity_id"
          name="severity_id"
          className="form-control"
          value={BAEditData?.severity_id || ""}
          onChange={(e) =>
            setBAEditData({
              ...BAEditData,
              severity_id: e.target.value,
            })
          }
          required
        >
          <option value="">Select Severity</option>
          {severity.map((sev) => (
            <option key={sev.severity_id} value={sev.severity_id}>
              {sev.severity_name}
            </option>
          ))}
        </select>
      </div>

      {/* Submit Button */}
      <div className="d-flex gap-3 pt-3">
        <Button color="primary" type="submit" disabled={isLoading}>
          {isLoading ? (
            <span
              className="spinner-border spinner-border-sm"
              role="status"
              aria-hidden="true"
            ></span>
          ) : (
            "Update Blood Analysis Form"
          )}
        </Button>
      </div>
    </form>
  </div>
</CommonModal>
{/* BA edit form end */}





{/* BA Prefill readmission form start */}
<CommonModal
  isOpen={BAPrefillModal}
  title="Readmission Blood Analysis Form"
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
    <form onSubmit={SubmitBAReadmissionFormHandler}>
      {/* Date of Assessment */}
      <div className="col-md-6">
        <FormGroup className="form-group row">
          <Label className="col-sm-12 col-form-label col-xl-6">
            {dateOfAssessment}
          </Label>
          <Col xl="5" sm="12">
            <div className="input-group">
              <DatePicker
                className="form-control digits"
                selected={
                  BAPrefillData?.date_of_assessment instanceof Date &&
                  !isNaN(BAPrefillData?.date_of_assessment)
                    ? BAPrefillData?.date_of_assessment
                    : null
                }
                onChange={(date) =>
                  setBAPrefillData({
                    ...BAPrefillData,
                    date_of_assessment: date,
                  })
                }
              />
            </div>
          </Col>
        </FormGroup>
      </div>

      {/* Package Selection */}
      <div className="mb-3">
        <label htmlFor="package_type_id">Package Selection</label>
        <select
          id="package_type_id"
          name="package_type_id"
          className="form-control"
          value={BAPrefillData?.package_type_id || ""}
          onChange={(e) =>
            setBAPrefillData({
              ...BAPrefillData,
              package_type_id: e.target.value,
            })
          }
          required
        >
          <option value="">Select Package</option>
          {packages.map((pkg) => (
            <option key={pkg.package_type_id} value={pkg.package_type_id}>
              {pkg.package_name}
            </option>
          ))}
        </select>
      </div>

      {/* Sample Collected */}
      <div className="form-check mb-3">
        <input
          type="checkbox"
          id="sample_collected"
          name="sample_collected"
          className="form-check-input checkbox_animated"
          checked={BAPrefillData?.sample_collected === "Yes"}
          onChange={(e) =>
            setBAPrefillData({
              ...BAPrefillData,
              sample_collected: e.target.checked ? "Yes" : "No",
            })
          }
        />
        <label className="form-check-label" htmlFor="sample_collected">
          Sample Collected
        </label>
      </div>

      {/* Sample Collection Time */}
      <div className="col-md-6 mb-3">
        <FormGroup className="form-group row">
          <Label className="col-sm-12 col-form-label col-xl-6">
            Sample Collection Time
          </Label>
          <Col xl="5" sm="12">
            <div className="input-group">
              <DatePicker
                className="form-control digits"
                showTimeSelect
                dateFormat="Pp"
                selected={
                  BAPrefillData?.sample_collection_time instanceof Date &&
                  !isNaN(BAPrefillData?.sample_collection_time)
                    ? BAPrefillData?.sample_collection_time
                    : null
                }
                onChange={(date) =>
                  setBAPrefillData({
                    ...BAPrefillData,
                    sample_collection_time: date,
                  })
                }
              />
            </div>
          </Col>
        </FormGroup>
      </div>

      {/* Report Upload */}
      <div className="mb-3">
        <label htmlFor="reportFile">Upload Report (PDF/Image)</label>
        <input
          type="file"
          id="reportFile"
          name="report_file"
          className="form-control"
          accept=".pdf,.jpg,.png,.jpeg"
          onChange={handleFileChange}
        />
        {BAPrefillData?.report_file_path && (
          <small className="text-muted">
            Current File: {BAPrefillData?.report_file_path}
          </small>
        )}
      </div>

      {/* Remarks */}
      <div className="mb-3">
        <label htmlFor="remarks">Remarks</label>
        <input
          type="text"
          id="remarks"
          name="remarks"
          className="form-control"
          placeholder="Add any additional remarks"
          value={BAPrefillData?.remarks || ""}
          onChange={(e) =>
            setBAPrefillData({
              ...BAPrefillData,
              remarks: e.target.value,
            })
          }
        />
      </div>

      {/* Severity Selection */}
      <div className="mb-3">
        <label htmlFor="severity_id">Package Severity</label>
        <select
          id="severity_id"
          name="severity_id"
          className="form-control"
          value={BAPrefillData?.severity_id || ""}
          onChange={(e) =>
            setBAPrefillData({
              ...BAPrefillData,
              severity_id: e.target.value,
            })
          }
          required
        >
          <option value="">Select Severity</option>
          {severity.map((sev) => (
            <option key={sev.severity_id} value={sev.severity_id}>
              {sev.severity_name}
            </option>
          ))}
        </select>
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
            "Readmission Blood Analysis Form"
          )}
        </Button>
      </div>
    </form>
  </div>
</CommonModal>
{/* BA Prefill readmission form end */}




    
   </frameElement>
  );
};

export default BloodAnalysis;

