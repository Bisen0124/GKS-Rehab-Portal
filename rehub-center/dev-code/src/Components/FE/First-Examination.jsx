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

const FirstExamination = () => {
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
              onClick={() => createFEform(row.id)}
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
    `https://gks-yjdc.onrender.com/api/first-evaluation/all-entries?branch_id=${selectedBranch}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`,
      },
    }
  )
    .then((response) => {
      if (!response.ok) throw new Error("Failed to fetch First Evaluation entries");
      return response.json();
    })
    .then((res) => {
      const evalEntries = res.data || [];

      const formattedEvalPatients = evalEntries.map((item) => ({
        first_eval_id: item.first_eval_id,
        user_id: item.user_id,
        entry_id: item.entry_id,
        visit_no: item.visit_no,
        status: item.status,

        // assessment fields
        date_of_assessment: item.date_of_assessment,
        patient_name: item.patient_name,
        weight: item.weight,
        pulse_rate: item.pulse_rate,
        blood_pressure: item.blood_pressure,
        spo2_percentage: item.spo2_percentage,
        location: item.location,
        addiction: item.addiction,
        intoxicated_at_admission: item.intoxicated_at_admission,

        // patient details
        name: item.name,
        phone: item.phone,
        email: item.email,
        gks_id: item.gks_id,
        dob: item.dob,
        gender: item.gender,
        age: item.age,

        // admission details
        date_of_admission: item.date_of_admission,
        admit_date: item.admit_date,
        discharge_date: item.discharge_date,
        ward_name: item.ward_name,

        // branch/meta
        branch_name: item.branch_name,
        custom_code: item.custom_code,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      console.log("Formatted First Eval Patients:", formattedEvalPatients);

      setTimeout(() => {
        setfdaData(formattedEvalPatients);
        setFilteredDataone(formattedEvalPatients);
        setstillLoading(false);
      }, 500);
    })
    .catch((error) => {
      console.error("Error fetching First Evaluation entries:", error);
      setstillLoading(true);
    });
}, [selectedBranch]);


const tableColumnsFDAList = [
  {
    name: "FE ID",
    selector: (row) => row.first_eval_id,
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
        <p className="badge bg-success p-2">FE {row.status}</p>
      </span>
    ),
  },
  {
    name: "Action",
    center: true,
    cell: (row) => (
      <div className="d-flex gap-2">
        <span
          onClick={() => viewFEFormData(row.first_eval_id)}
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
          onClick={() => handleFEindividualEdit(row.first_eval_id)}
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

   //Create FE form function start
   const [formData, setFormData] = useState({
    dateOfAssessment: new Date(),
    patient_name: "",
    weight: "",
    pulse_rate: "",
    blood_pressure: "",
    spo2_percentage: "",
    location: "",
    addiction: "",
    intoxicated_at_admission: "No", // default
  });

  const handleIntoxicatedChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      intoxicated_at_admission: e.target.checked ? "Yes" : "No",
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAssesmentDateChange = (name, date) => {
    setFormData((prev) => ({
      ...prev,
      [name]: date,
    }));
  };

    const [isFEModalOpen, setIsFEModalOpen] = useState(false);
    const createFEform = async (userId = null) => {
      setIsFEModalOpen(true);
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

     //Create FE form function start

     //Submit FE form handler start
     //spinner extract from other file
       const selectedSpinner = Data.find(
         (item) => item.spinnerClass === "loader-37"
       );
       //Loading spinner
       const [isLoading, setIsLoading] = useState(false);
       const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
      
        // ✅ Normalize values before sending
        const payload = {
          user_id: selectedUser?.user_id,
          date_of_assessment: formData.dateOfAssessment
            ? new Date(formData.dateOfAssessment).toISOString().split("T")[0] // YYYY-MM-DD only
            : null,
          patient_name: formData.patient_name?.trim() || null, // must not be empty
          weight: parseFloat(formData.weight) || 0,
          pulse_rate: Math.max(parseInt(formData.pulse_rate) || 0, 30), // >= 30
          blood_pressure: formData.blood_pressure?.trim() || null,
          spo2_percentage: Math.max(parseInt(formData.spo2_percentage) || 0, 70), // >= 70
          location: formData.location?.trim() || null,
          addiction: formData.addiction?.trim() || null,
          intoxicated_at_admission:
            formData.intoxicated_at_admission === "Yes"
              ? "Yes"
              : formData.intoxicated_at_admission === "No"
              ? "No"
              : null,
        };
      
        try {
          const token = localStorage.getItem("Authorization");
          const branch_id = selectedBranch;
      
          const response = await fetch(
            `https://gks-yjdc.onrender.com/api/first-evaluation/create-assessment?branch_id=${branch_id}`,
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
            title: "Patient Behaviour Created",
            text: "The assessment was submitted successfully.",
          }).then(() => setIsFEModalOpen(false));
      
          console.log("✅ Submitted Data:", data);
          console.log("✅ Final Payload:", payload);
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
      
      
  //Submit FE form handler end



// ✅ View FE form handler start
const [viewFEData, setViewFEData] = useState(null);
const [viewFEModal, setViewFEModal] = useState(false);

const viewFEFormData = async (FEID) => {
  setViewFEModal(true);
  console.log("FE ID =>", FEID);

  // ✅ Normalize ID if object is passed
  if (typeof FEID === "object" && FEID !== null) {
    FEID = FEID.first_evaluation_id || FEID.intake_fe_id; // adjust key as per API
  }

  if (!FEID) {
    console.error("Invalid FE ID provided");
    return;
  }

  setIsLoading(true);
  const token = localStorage.getItem("Authorization");
  const branch_id = selectedBranch;

  try {
    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/first-evaluation/assessment/${FEID}?branch_id=${branch_id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      }
    );

    if (!response.ok) {
      const err = await response.json();
      console.error("Fetch error:", err);
      return;
    }

    const data = await response.json();
    console.log("Raw API Response:", data);

    // ✅ Extract FE assessment data
    const fetchedData = data?.data || null;
    console.log("Extracted FE Data Entry:", fetchedData);

    if (!fetchedData) {
      console.warn("No FE assessment data found.");
      return;
    }

    // ✅ Store in state
    setViewFEData(fetchedData);
    setSelectedUser(fetchedData); // direct object, not array

    console.log(
      "FE Data Fetched ID:",
      fetchedData.first_evaluation_id || fetchedData.intake_fe_id
    );
  } catch (error) {
    console.error("Fetch error:", error);
  } finally {
    setIsLoading(false);
  }
};
// ✅ View FE form handler end


// ✅ Edit FE form handler start
const [FEEditData, setFEEditData] = useState(null);
const [FEEditModal, setFEEditModal] = useState(false);

const handleFEindividualEdit = async (editFEID = null) => {
  setFEEditModal(true);

  // ✅ Normalize ID if object passed
  if (typeof editFEID === "object" && editFEID !== null) {
    editFEID = editFEID.first_eval_id || editFEID.intake_fe_id;
  }

  if (!editFEID) {
    console.error("Invalid FE ID provided");
    return;
  }

  console.log("FE ID For Edit:", editFEID);
  const token = localStorage.getItem("Authorization");

  try {
    const branch_id = selectedBranch;
    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/first-evaluation/assessment/${editFEID}?branch_id=${branch_id}`,
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

    // ✅ Correct: pick from data.data
    const latestAssessment = data.data || null;

    if (!latestAssessment) {
      console.warn("No assessment found for this FE ID.");
      return;
    }

    setSelectedUser(latestAssessment);
    console.log("Selected FE User Assessment for edit:", latestAssessment);

    // ✅ Map payload into your form structure (FE fields only)
    setFEEditData({
      first_eval_id: latestAssessment.first_eval_id,
      user_id: latestAssessment.user_id,
      entry_id: latestAssessment.entry_id,
      branch_id: latestAssessment.branch_id,
      visit_no: latestAssessment.visit_no,

      date_of_assessment: latestAssessment.date_of_assessment
        ? parseDateString(latestAssessment.date_of_assessment)
        : "",

      // Vitals
      weight: latestAssessment.weight,
      pulse_rate: latestAssessment.pulse_rate,
      blood_pressure: latestAssessment.blood_pressure,
      spo2_percentage: latestAssessment.spo2_percentage,

      // Other Info
      location: latestAssessment.location,
      addiction: latestAssessment.addiction,
      intoxicated_at_admission: latestAssessment.intoxicated_at_admission,
      status: latestAssessment.status,
      isActive: latestAssessment.isActive,

      // Audit Fields
      created_by: latestAssessment.created_by,
      updated_by: latestAssessment.updated_by,
      created_at: latestAssessment.created_at,
      updated_at: latestAssessment.updated_at,

      // User Details
      patient_name: latestAssessment.patient_name,
      name: latestAssessment.name,
      phone: latestAssessment.phone,
      email: latestAssessment.email,
      dob: latestAssessment.dob,
      gender: latestAssessment.gender,
      address: latestAssessment.address,
      gks_id: latestAssessment.gks_id,
      age: latestAssessment.age,
      branch_name: latestAssessment.branch_name,
      custom_code: latestAssessment.custom_code,
      date_of_admission: latestAssessment.date_of_admission,
      ward_name: latestAssessment.ward_name,
    });

    console.log("Mapped FE Edit Data:", latestAssessment);
  } catch (error) {
    console.error("Fetch error:", error);
  }
};
// ✅ Edit FE form handler end


// ✅ Update FE Assessment Handler start
const handleFEUpdate = async () => {
  if (!FEEditData?.first_eval_id) {
    console.error("FE ID is not available yet.");
    return;
  }

  console.log("FE ID for update:", FEEditData.first_eval_id);
  setIsLoading(true);

  // ✅ Build payload directly from FEEditData
  const payload = {
    user_id: selectedUser?.user_id,
    entry_id: FEEditData?.entry_id,
    branch_id: FEEditData?.branch_id,
    visit_no: FEEditData?.visit_no,

    date_of_assessment: FEEditData?.date_of_assessment
      ? new Date(FEEditData.date_of_assessment).toISOString().split("T")[0]
      : "",

    // ✅ Vitals
    weight: FEEditData?.weight || "",
    pulse_rate: FEEditData?.pulse_rate || "",
    blood_pressure: FEEditData?.blood_pressure || "",
    spo2_percentage: FEEditData?.spo2_percentage || "",

    // ✅ Other Info
    location: FEEditData?.location || "",
    addiction: FEEditData?.addiction || "",
    intoxicated_at_admission: FEEditData?.intoxicated_at_admission || "",
    status: FEEditData?.status || "",
    isActive: FEEditData?.isActive || 1,

    // ✅ Audit
    created_by: FEEditData?.created_by || 1,
    updated_by: FEEditData?.updated_by || 1,
  };

  try {
    const branch_id = selectedBranch; // from BranchContext
    const token = localStorage.getItem("Authorization");

    const response = await fetch(
      `https://gks-yjdc.onrender.com/api/first-evaluation/update-assessment/${FEEditData.first_eval_id}?branch_id=${branch_id}`,
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
    console.log("✅ FE Update Response:", data);
    console.log("📦 FE Update Payload Sent:", payload);

    setIsLoading(false);

    Swal.fire({
      icon: "success",
      title: "FE Updated Successfully!",
      text: "First Evaluation assessment has been updated successfully!",
    }).then(() => {
      setFEEditModal(false); // ✅ Close modal after success
    });
  } catch (err) {
    console.error("❌ FE Update Error:", err);
    setIsLoading(false);

    Swal.fire({
      icon: "error",
      title: "Unexpected Error",
      text: "Failed to update First Evaluation assessment. Check console for details.",
    });
  }
};
// ✅ Update FE Assessment Handler end





     //Close all modal handler
     const closeAllmodal = () => {
      setIsFEModalOpen(false);
      setViewFEModal(false);
      setFEEditModal(false);
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

      {/*FE create form start */}
      <CommonModal
        isOpen={isFEModalOpen}
        title="Create First Examination Form"
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
        <form onSubmit={handleSubmit}>
      <div className="col-md-6 mb-3">
        <label className="col-sm-12 col-form-label col-xl-6">
          Date of Assessment
        </label>
        <div className="col-xl-5 col-sm-12">
          <div className="input-group">
            <DatePicker
              className="form-control digits"
              selected={formData.dateOfAssessment}
              onChange={(date) =>
                handleAssesmentDateChange("dateOfAssessment", date)
              }
            />
          </div>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-6">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="patient_name"
            className="form-control"
            value={formData.patient_name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-3">
          <label htmlFor="weight">Weight (kg)</label>
          <input
            type="number"
            id="weight"
            name="weight"
            className="form-control"
            value={formData.weight}
            step="0.1"
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-2">
          <label htmlFor="pulse">Pulse</label>
          <input
            type="number"
            id="pulse"
            name="pulse_rate"
            className="form-control"
            value={formData.pulse_rate}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-3">
          <label htmlFor="bp">BP</label>
          <input
            type="text"
            id="bp"
            name="blood_pressure"
            className="form-control"
            value={formData.blood_pressure}
            onChange={handleChange}
            placeholder="e.g. 120/80"
            required
          />
        </div>
        <div className="col-md-3">
          <label htmlFor="spo2">SpO2 (%)</label>
          <input
            type="number"
            id="spo2"
            name="spo2_percentage"
            className="form-control"
            value={formData.spo2_percentage}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-6">
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            className="form-control"
            value={formData.location}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="addiction">Addiction</label>
          <input
            type="text"
            id="addiction"
            name="addiction"
            className="form-control"
            value={formData.addiction}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="form-check mb-3">
  <input
    type="checkbox"
    id="intoxicated"
    name="intoxicated_at_admission"
    className="form-check-input checkbox_animated"
    checked={formData.intoxicated_at_admission === "Yes"}
    onChange={handleIntoxicatedChange}
  />
  <label className="form-check-label" htmlFor="intoxicated">
    Intoxicated at the time of admission
  </label>
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
                       "Create FE Form"
                     )}
                   </Button>
                 </div>
    </form>
        </div>
        </CommonModal>
         {/*FE create form end */}


 {/*FE view form start */}
         <CommonModal
        isOpen={viewFEModal}
        title="View First Examination Form"
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
        <div className="table-responsive p-4" ref={pdfRef}>
  <h4
    style={{
      textAlign: "center",
      textDecoration: "underline",
      padding: "20px 0",
    }}
  >
    First Evaluation / प्रथम मूल्यांकन
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
      ) : viewFEData ? (
        <>
          <tr>
            <th className="text-start p-3">Date of admission</th>
            <td className="border p-3">
              {viewFEData.date_of_assessment
                ? new Date(viewFEData.date_of_assessment).toLocaleDateString()
                : ""}
            </td>
          </tr>
          <tr>
            <th className="text-start p-3">Patient Name</th>
            <td className="border p-3">{viewFEData?.patient_name}</td>
          </tr>
           
          <tr>
            <th className="text-start p-3">Weight</th>
            <td className="border p-3">{viewFEData?.weight}</td>
          </tr>
          <tr>
            <th className="text-start p-3">Pulse</th>
            <td className="border p-3">{viewFEData?.pulse_rate}</td>
          </tr>
          <tr>
            <th className="text-start p-3">Blood Pressure</th>
            <td className="border p-3">{viewFEData.blood_pressure}</td>
          </tr>
          
          <tr>
            <th className="text-start p-3">SpO2 (%)</th>
            <td className="border p-3">{viewFEData.spo2_percentage}</td>
          </tr>
    
          <tr>
            <th className="text-start p-3">Location</th>
            <td className="border p-3">{viewFEData.location}</td>
          </tr>
          <tr>
            <th className="text-start p-3">Addiction</th>
            <td className="border p-3">{viewFEData.addiction}</td>
          </tr>
           
          <tr>
            <th className="text-start p-3">Intoxicated at the time of admission</th>
            <td className="border p-3">{viewFEData.intoxicated_at_admission}</td>
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
 {/*FE view form end */}


  {/*FE Edit form start */}
  <CommonModal
        isOpen={FEEditModal}
        title="Edit First Examination Form"
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
        <form onSubmit={(e)=>{
          e.preventDefault();
          handleFEUpdate();
        }}>
      <div className="col-md-6 mb-3">
        <label className="col-sm-12 col-form-label col-xl-6">
          Date of Assessment
        </label>
        <div className="col-xl-5 col-sm-12">
          <div className="input-group">
            <DatePicker
              className="form-control digits"
              selected={FEEditData?.date_of_assessment}
                    onChange={(date) =>
                      setFEEditData((prev) => ({
                        ...prev,
                        date_of_assessment: date,
                      }))
                    }
            />
          </div>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-6">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="patient_name"
            className="form-control"
            value={FEEditData?.patient_name}
            onChange={(e)=>{
              setFEEditData((prev)=>({
                ...prev,
                patient_name:e.target.value,
              }))
            }}
            required
          />
        </div>
        <div className="col-md-3">
          <label htmlFor="weight">Weight (kg)</label>
          <input
            type="number"
            id="weight"
            name="weight"
            className="form-control"
            value={FEEditData?.weight}
            onChange={(e)=>{
              setFEEditData((prev)=>({
                ...prev,
                weight:e.target.value,
              }))
            }}
            required
          />
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-2">
          <label htmlFor="pulse">Pulse</label>
          <input
            type="number"
            id="pulse"
            name="pulse_rate"
            className="form-control"
            value={FEEditData?.pulse_rate}
            onChange={(e)=>{
              setFEEditData((prev)=>({
                ...prev,
                pulse_rate:e.target.value,
              }))
            }}
            required
          />
        </div>
        <div className="col-md-3">
          <label htmlFor="bp">Blood Pressure</label>
          <input
            type="text"
            id="bp"
            name="blood_pressure"
            className="form-control"
            value={FEEditData?.blood_pressure}
            onChange={(e)=>{
              setFEEditData((prev)=>({
                ...prev,
                blood_pressure:e.target.value,
              }))
            }}
            placeholder="e.g. 120/80"
            required
          />
        </div>
        <div className="col-md-3">
          <label htmlFor="spo2">SpO2 (%)</label>
          <input
            type="number"
            id="spo2"
            name="spo2_percentage"
            className="form-control"
            value={FEEditData?.spo2_percentage}
            onChange={(e)=>{
              setFEEditData((prev)=>({
                ...prev,
                spo2_percentage:e.target.value,
              }))
            }}
            required
          />
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-6">
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            className="form-control"
            value={FEEditData?.location}
            onChange={(e)=>{
              setFEEditData((prev)=>({
                ...prev,
                location:e.target.value,
              }))
            }}
            required
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="addiction">Addiction</label>
          <input
            type="text"
            id="addiction"
            name="addiction"
            className="form-control"
            value={FEEditData?.addiction}
            onChange={(e)=>{
              setFEEditData((prev)=>({
                ...prev,
                addiction:e.target.value,
              }))
            }}
          />
        </div>
      </div>

      <div className="form-check mb-3">
  <input
    type="checkbox"
    id="intoxicated"
    name="intoxicated_at_admission"
    className="form-check-input checkbox_animated"
    checked={FEEditData?.intoxicated_at_admission === "Yes"}
                      onChange={(e) =>
                        setFEEditData((prev) => ({
                          ...prev,
                          intoxicated_at_admission: e.target.checked ? "Yes" : "No",
                        }))
                      }
  />
  <label className="form-check-label" htmlFor="intoxicated">
    Intoxicated at the time of admission
  </label>
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
                       "Update FE Form"
                     )}
                   </Button>
                 </div>
    </form>
        </div>
        </CommonModal>
         {/*FE Edit form end */}

</Fragment>


    
  );
};

export default FirstExamination;
