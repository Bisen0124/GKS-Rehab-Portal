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

function Legal() {
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
          const FDADate = user.recent_fda_date
            ? new Date(user.recent_fda_date)
            : null;

          let userStatus = (
            <p className="badge bg-warning text-dark p-2">{"Pending"}</p>
          );
          if (admitDate && FDADate && admitDate > FDADate) {
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
                // onClick={() => handleFDAPreFill(row.recent_fda_id)}
                style={{ cursor: "pointer" }}
                title="Readmission FDA Form"
              >
                ✏️
              </span>
            )}

            {/* Show Create PFA if not discharged and not readmission */}
            {row.dischargeStatus === 0 && row.isReadmission === 0 && (
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
      name: "SUD ID",
      selector: (row) => row.ilh_id,
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
          <p className="badge bg-success p-2">Legal {row.status}</p>
        </span>
      ),
    },
    {
      name: "Action",
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
        title: "Legal History Created Successfully",
        text: "The Legal History assessment was submitted successfully.",
      }).then(() => setIsLegalModalOpen(false));

      console.log("✅ Legal History Data", data);
      console.log("📦 Legal History Payload Sent", payload);
    } catch (err) {
      console.error("❌ Legal History Submit Error:", err);
      setIsLoading(false);
      Swal.fire({
        icon: "error",
        title: "Unexpected Error",
        text: "Failed to submit Legal History. Check console for error.",
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
      title: "Legal History Updated Successfully!",
      text: "Patient's legal history has been updated successfully!",
    }).then(() => {
      setLegalEditModal(false); // ✅ Close modal after success
    });
  } catch (err) {
    console.error("❌ Legal Update Error:", err);
    setIsLoading(false);

    Swal.fire({
      icon: "error",
      title: "Unexpected Error",
      text: "Failed to update Legal History. Check console for details.",
    });
  }
};



  //Close all modal handler
  const closeAllmodal = () => {
    setIsLegalModalOpen(false);
    setViewLegalModal(false);
    setLegalEditModal(false);
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

      {/* SUD Brief create form start */}
      <CommonModal
        isOpen={isLegalModalOpen}
        title={`Create ${legalHistory}`}
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
          <form className="theme-form" onSubmit={SubmitLegalFormHandler}>
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
                      handleAssessmentDateChange("dateOfAssessment", date)
                    }
                  />
                </div>
              </Col>
            </div>

            {/* Legal History Start */}
            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{domesticViolence}</Label>
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
                <Label>{reasonBehindDomesticViolence}</Label>
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
                <Label>{drugStatus}</Label>
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
                <Label>{ifThereIsAnyCriminalCase}</Label>
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
                <Label>{specificCaseDetails}</Label>
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
                <Label>{currentCaseStatus}</Label>
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
                <Label>{drugStatus}</Label>
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
                <Label>{ifWentToJail}</Label>
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
              "Create Legal History / लीगल इतिहास"
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
  title={"View Legal History"}
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
      Legal History / लीगल इतिहास
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
              <th className="text-start p-3">Name</th>
              <td className="border p-3">{viewLegalData.name}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Gender</th>
              <td className="border p-3">{viewLegalData.gender}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Phone</th>
              <td className="border p-3">{viewLegalData.phone}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Email</th>
              <td className="border p-3">{viewLegalData.email}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Assessment Date</th>
              <td className="border p-3">
                {viewLegalData.date_of_assessment
                  ? new Date(viewLegalData.date_of_assessment).toLocaleDateString()
                  : ""}
              </td>
            </tr>
            <tr>
              <th className="text-start p-3">Domestic Violence Case</th>
              <td className="border p-3">{viewLegalData.domestic_violence_case}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Reason Behind Domestic Violence</th>
              <td className="border p-3">{viewLegalData.reason_behind_domestic_violence}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Drug Status Quantity (At Time)</th>
              <td className="border p-3">{viewLegalData.drug_status_quantity_at_time}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Any Criminal Case</th>
              <td className="border p-3">{viewLegalData.any_criminal_case}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Case Details</th>
              <td className="border p-3">{viewLegalData.case_details_specify}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Current Case Status</th>
              <td className="border p-3">{viewLegalData.current_case_status}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Drug Status Quantity (Current)</th>
              <td className="border p-3">{viewLegalData.drug_status_quantity_current}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Jail Period Duration</th>
              <td className="border p-3">{viewLegalData.jail_period_duration}</td>
            </tr>
            <tr>
              <th className="text-start p-3">Status</th>
              <td className="border p-3">{viewLegalData.status}</td>
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
</CommonModal>
{/* View Legal History data into modal end */}

{/* Legal update form start */}
<CommonModal
  isOpen={LegalEditModal}
  title={`Edit ${legalHistory}`}
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
    <form className="theme-form" onSubmit={(e)=>{
      e.preventDefault();
      handleLegalUpdate();
    }}>
      {/* Date of Assessment */}
      <div className="col-md-6 mb-3">
        <Label className="col-sm-12 col-form-label col-xl-6">
          {dateOfAssessment}
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
          <Label>{domesticViolence}</Label>
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
          <Label>{reasonBehindDomesticViolence}</Label>
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
          <Label>{drugStatus}</Label>
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
          <Label>{ifThereIsAnyCriminalCase}</Label>
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
          <Label>{specificCaseDetails}</Label>
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
          <Label>{currentCaseStatus}</Label>
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
          <Label>{drugStatus}</Label>
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
          <Label>{ifWentToJail}</Label>
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
            "Update Legal History / लीगल इतिहास अपडेट करें"
          )}
        </Button>
      </div>
    </form>
  </div>
</CommonModal>
{/* Legal update form end */}




    </Fragment>
  );
}

export default Legal;
