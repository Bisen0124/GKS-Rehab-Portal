import React, {
  useEffect,
  useState,
  Fragment,
  useRef,
} from "react";
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

function FDA() {
    const pdfRef = useRef();
  //spinner extract from other file
  const selectedSpinner = Data.find(
    (item) => item.spinnerClass === "loader-37"
  );
  //Modal
  const [modal, setModal] = useState(false);
  //Loading spinner
  const [isLoading, setIsLoading] = useState(false);



  //This React hook calculates a user's age based on their date of birth (dob) and returns the age on PFA form by create.
  const [selectedUser, setSelectedUser] = useState(null); // User data
  const dob = selectedUser?.[0]?.dob;
  const patientCalAge = useCalculateAge(dob);
  console.log("DOB", patientCalAge);


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

  //Get All Patient Register Data
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

    fetch("https://gks-yjdc.onrender.com/api/fda/all-fda-entries", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`,
      },
    })
      .then((response) => {
        if (!response.ok)
          throw new Error("Failed to fetch FDA all register user details list");
        return response.json();
      })
      .then((res) => {
        const fdaPatient = res.entries || [];

        const formattedFDAPatient = fdaPatient.map((item) => ({
          fda_id: item.fda_id,
          user_id: item.user_id,
          branch_id: item.branch_id,
          entry_id: item.entry_id,
          visit_no: item.visit_no,
          date_of_assessment: item.date_of_assessment,
          substance_type_id: item.substance_type_id,
          substance_code: item.substance_code,

          desire_to_quit: item.desire_to_quit,
          lack_control: item.lack_control,
          lack_responsibility: item.lack_responsibility,
          time_purchasing_using: item.time_purchasing_using,
          cravings: item.cravings,
          relationship_problems: item.relationship_problems,
          using_dangerously: item.using_dangerously,
          losing_interest: item.losing_interest,
          increasing_tolerance: item.increasing_tolerance,
          experiencing_withdrawal: item.experiencing_withdrawal,
          addiction_severity_rating: item.addiction_severity_rating,
          remarks: item.remarks,

          prepared_by: item.prepared_by,
          status: item.status,
          isActive: item.isActive,

          created_by: item.created_by,
          updated_by: item.updated_by,
          created_at: item.created_at,
          updated_at: item.updated_at,

          // Additional joined user & entry data
          name: item.user_name,
          phone: item.phone,
          email: item.email,
          gks_id: item.gks_id,
          admit_date: item.admit_date,
          discharge_date: item.discharge_date,
          discharge_status: item.discharge_status,
          ward_name: item.ward_name,

          substance_description: item.substance_description,
          substance_description_hindi: item.substance_description_hindi,

          created_by_name: item.created_by_name,
          updated_by_name: item.updated_by_name,
        }));

        console.log(formattedFDAPatient);

        setTimeout(() => {
          setfdaData(formattedFDAPatient);
          setFilteredDataone(formattedFDAPatient);
          setstillLoading(false);
        }, 1000);
      })
      .catch((error) => {
        console.error("Error fetching FDA user data:", error);
        setstillLoading(true);
      });
  }, []);



  const tableColumnsFDAList = [
    { name: "FDA ID", selector: (row) => row.fda_id, sortable: true, center: true },
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
          <p className="badge bg-success p-2">FDA {row.status}</p>
        </span>
      ),
    },
    {
      name: "Action",
      center: true,
      cell: (row) => (
        <div className="d-flex gap-2">
          <span
            onClick={() => viewFDAFamily(row.fda_id)}
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
        </div>
      ),
    },



  ];



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
        if (!response.ok) throw new Error("Failed to fetch FDA user details");
        return response.json();
      })
      .then((res) => {
        const users = res.users || [];

        const formatted = users.map((user) => {
          const admitDate = user.recent_admit_date
            ? new Date(user.recent_admit_date)
            : null;
          const FDADate = user.recent_fda_date
            ? new Date(user.recent_fda_date)
            : null;

          let userStatus = <p className="badge bg-warning text-dark p-2">{"Pending"}</p>;
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
        }, 1000); // You can reduce this to 1s
      })
      .catch((error) => {
        console.error("Error fetching PFA user data:", error);
        setstillLoading(true);
      });
  }, []);


  //Close all modal handler
  const closePFAModal = () => {
    setModal(false);
    setviewDADataModal(false);
  };

  //Accepting fda form data state
  const [formData, setFormData] = useState({
    addiction: {},
    remarks: "",
    prepared_by: "",
    dateOfAssessment: new Date(),

  });

  const handleRadioChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      addiction: {
        ...prev.addiction,
        [key]: value,
      },
    }));
  };

  const handleAssesmentDateChange = (name, date) => {
    setFormData((prev) => ({
      ...prev,
      [name]: date,
    }));
  };


  //FDA data post/submit hanlder


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
                onClick={() => handleFDAPreFill(row.recent_fda_id)}
                style={{ cursor: "pointer" }}
                title="Readmission FDA Form"
              >
                ✏️
              </span>
            )}

            {/* Show Create PFA if not discharged and not readmission */}
            {row.dischargeStatus === 0 && row.isReadmission === 0 && (
              <span
                onClick={() => createFDA(row.id)}
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
    }



  ];



  const createFDA = async (userId = null) => {
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
        if (!response.ok) throw new Error("User fetch failed");
        setSelectedUser(data);
      } catch (error) {
        console.error("Fetch error:", error);
      }
    }
  };

  const handleSubmit = async (e) => {
    setIsLoading(true); // Start loader
    e.preventDefault();

    const payload = {
      user_id: selectedUser[0]?.user_id,
      date_of_assessment: formData.dateOfAssessment?.toISOString(),
      substance_type_id: 1,
      addiction_severity_rating: Object.values(formData.addiction).filter((v) => v === "Yes").length,
      remarks: formData.remarks,
      prepared_by: formData.prepared_by,
      ...formData.addiction,
    };

    try {
      const token = localStorage.getItem("Authorization");
      const response = await fetch("https://gks-yjdc.onrender.com/api/fda/create-assessment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            `${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("API call failed");

      const data = await response.json();
      setIsLoading(false);
      Swal.fire({
        icon: "success",
        title: "FDA Created Successfully",
        text: "The FDA assessment was submitted successfully.",
      }).then(() => {
        // This runs after the user clicks "OK"
        setModal(false);
      });
      console.log("FAD Data", data);
      console.log("FAD Payload", payload);
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Unexpected Error",
        text: "Failed to submit. Check console for error.",
      });
    }
  };


  //Re-Admission FDA Form Handler
  //🔧 Convert DD/MM/YYYY to Date Object:
  const parseDateString = (dateStr) => {
    if (!dateStr) return null;

    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  };
  const [FDAEditData, setFDAEditData] = useState(null);
  const [FDAeditModal, setFDAeditModal] = useState(false);

  const handleFDAPreFill = async (recentFDAiD = null) => {
    setFDAeditModal(true)
    if (typeof recentFDAiD === "object" && recentFDAiD !== null) {
      recentFDAiD = recentFDAiD.recent_fda_id;
    }

    if (!recentFDAiD) {
      console.error("Invalid recentFDAiD provided");
      return;
    }

    console.log("Recent FDA ID:", recentFDAiD);
    const token = localStorage.getItem("Authorization");

    try {
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/fda/assessment/${recentFDAiD}`,
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

      if (!latestAssessment) {
        console.warn("No assessment found for this FDA ID.");
        return;
      }

      setSelectedUser(latestAssessment);
      console.log("Selected User Assessment:", latestAssessment);

      setFDAEditData({
        user_id: latestAssessment.user_id,
        date_of_assessment: latestAssessment.date_of_assessment
          ? parseDateString(latestAssessment.date_of_assessment)
          : "",

        addictionSeverity: {
          desire_to_quit: latestAssessment.desire_to_quit,
          lack_control: latestAssessment.lack_control,
          lack_responsibility: latestAssessment.lack_responsibility,
          time_purchasing_using: latestAssessment.time_purchasing_using,
          cravings: latestAssessment.cravings,
          relationship_problems: latestAssessment.relationship_problems,
          using_dangerously: latestAssessment.using_dangerously,
          losing_interest: latestAssessment.losing_interest,
          increasing_tolerance: latestAssessment.increasing_tolerance,
          experiencing_withdrawal: latestAssessment.experiencing_withdrawal,
          addiction_severity_rating: latestAssessment.addiction_severity_rating
        },
        remarks: latestAssessment.remarks,
        prepared_by: latestAssessment.prepared_by,
      });


      console.log(FDAEditData?.addictionSeverity)
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };


  //FDA Readmission Hanlder
  const handleFDAReadmission = async () => {
    setIsLoading(true); // Start loading

    const payload = {
      user_id: FDAEditData.user_id,
      date_of_assessment: FDAEditData?.date_of_assessment || null,
      substance_type_id: 1,
      desire_to_quit: FDAEditData?.addictionSeverity?.desire_to_quit,
      lack_control: FDAEditData?.addictionSeverity?.lack_control,
      lack_responsibility: FDAEditData?.addictionSeverity?.lack_responsibility,
      time_purchasing_using: FDAEditData?.addictionSeverity?.time_purchasing_using,
      cravings: FDAEditData?.addictionSeverity?.cravings,
      relationship_problems: FDAEditData?.addictionSeverity?.relationship_problems,
      using_dangerously: FDAEditData?.addictionSeverity?.using_dangerously,
      losing_interest: FDAEditData?.addictionSeverity?.losing_interest,
      increasing_tolerance: FDAEditData?.addictionSeverity?.increasing_tolerance,
      experiencing_withdrawal: FDAEditData?.addictionSeverity?.experiencing_withdrawal,
      addiction_severity_rating: FDAEditData?.addictionSeverity?.addiction_severity_rating,
      remarks: FDAEditData?.remarks || "",
      prepared_by: FDAEditData?.prepared_by || ""
    };

    try {
      const token = localStorage.getItem("Authorization");
      const response = await fetch("https://gks-yjdc.onrender.com/api/fda/create-assessment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            `${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("API call failed");

      const data = await response.json();
      setIsLoading(false);
      Swal.fire({
        icon: "success",
        title: "FDA Readmission Created Successfully",
        text: "The FDA Reassessment was submitted successfully.",
      }).then(() => {
        // This runs after the user clicks "OK"
        setModal(false);
      });
      console.log("FAD Readmission Data", data);
      console.log("FAD Readmission Payload", payload);
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Unexpected Error",
        text: "Failed to submit. Check console for error.",
      });
    }
  }


  //close view data modal
  const closeUserViewModal = () => {
    setFDAeditModal(false)
  };

  const [viewFDAData, setviewFDAData] = useState(null)
  const [viewFDADataModal, setviewDADataModal] = useState(false);
  const viewFDAFamily = async (FDAID) => {
    setviewDADataModal(true);
    console.log("FDAID =>", FDAID);

    if (typeof FDAID === "object" && FDAID !== null) {
      FDAID = FDAID.fda_id;
    }

    if (!FDAID) {
      console.error("Invalid FDA ID provided");
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem("Authorization");

    try {
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/fda/assessment/${FDAID}`,
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

      const ViewFdaDataEntry = data.assessment || null;

      if (!ViewFdaDataEntry) {
        console.warn("No FDA assessment data found.");
        return;
      }

      setviewFDAData(ViewFdaDataEntry); // ✅ Correct
      console.log("FDA Data Fetched:", ViewFdaDataEntry); // ✅ Log the correct data
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
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
        filename: `user_data_${viewFDAData?.name}_${viewFDAData?.user_id}.pdf`,
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
                    <HeaderCard
                      title="All Patient Data List"
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

      {/* FDA   */}
      <CommonModal
        isOpen={modal}
        title={fda}
        toggler={closePFAModal}
        maxWidth="1200px"
      >
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
            </div>


          </div>

          <div className="col-md-12 pt-5 table-responsive">
            <Table bordered>
              <thead>
                <tr>
                  <th>{tableNumber}</th>
                  <th style={{ width: "10%" }}>Code</th>
                  <th>{mentalBehaviour}</th>
                </tr>
              </thead>
              <tbody>
                {mentalBehavioursData.map(({ code, english, hindi, index }) => (
                  <tr key={code}>
                    <td>{index}</td>
                    <td>{code}</td>
                    <td>
                      <div>{english}</div>
                      <div className="text-muted">{hindi}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>



          <div className="col-md-12 table-responsive">
            <Table bordered>
              <thead>
                <tr>
                  <th>{tableNumber2}</th>
                  <th>{addictionSeverity}</th>
                  <th>{yes1}</th>
                  <th>{no1}</th>
                </tr>
              </thead>
              <tbody>
                {fdaAdsiction.map(({ key, label }, index) => (
                  <tr key={key}>
                    <td>{index + 1}</td>
                    <td>{label}</td>
                    {["Yes", "No"].map((value) => {
                      const inputId = `addiction_${key}_${value}`;
                      return (
                        <td key={inputId} className="radio radio-primary">
                          <Input
                            id={inputId}
                            type="radio"
                            className="form-check-input"
                            name={`addiction_${key}`}
                            value={value}
                            checked={formData.addiction[key] === value}
                            onChange={() => handleRadioChange(key, value)}
                          />
                          <Label className="form-check-label" for={inputId}>{value}</Label>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          <div className="col-md-12">
            <FormGroup className="mb-4 mt-4">
              <Label>{Remarks}</Label>
              <Input
                type="text"
                className="form-control"
                rows="3"
                name="remarks"
                value={formData.remarks}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, remarks: e.target.value }))
                }
              />
            </FormGroup>
          </div>
          <div className="col-md-12">
            <FormGroup className="mb-4 mt-4">
              <Label>{prepared}</Label>
              <Input
                type="text"
                className="form-control"
                rows="3"
                name="prepared_by"
                value={formData.prepared_by}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, prepared_by: e.target.value }))
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
                "Create FDA"
              )}
            </Button>
          </div>
        </Form>
      </CommonModal>

      {/* Readmission FDA Edit Modal */}
      <CommonModal
        isOpen={FDAeditModal}
        title="Readmission PFA"
        toggler={closeUserViewModal}
        maxWidth="1200px"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          handleFDAReadmission();
        }}>
          <div className="row px-3 pt-4 pb-3">

            <div className="col-md-6">
              <FormGroup className="form-group row">
                <Label className="col-sm-12 col-form-label col-xl-6">
                  Date of Assessment
                </Label>
                <Col xl="5" sm="12">
                  <div className="input-group">
                    <DatePicker
                      className="form-control digits"
                      selected={FDAEditData?.date_of_assessment || null}
                      onChange={(date) =>
                        setFDAEditData((prev) => ({
                          ...prev,
                          date_of_assessment: date,
                        }))
                      }
                    />
                  </div>
                </Col>
              </FormGroup>
            </div>
          </div>

          <div className="col-md-12 table-responsive">
            <Table bordered>
              <thead>
                <tr>
                  <th>{tableNumber2}</th>
                  <th>{addictionSeverity}</th>
                  <th>{yes1}</th>
                  <th>{no1}</th>
                </tr>
              </thead>
              <tbody>
                {fdaAdsiction.map(({ key, label }, index) => (
                  <tr key={key}>
                    <td>{index + 1}</td>
                    <td>{label}</td>
                    {["Yes", "No"].map((value) => {
                      const inputId = `addiction_${key}_${value}`;
                      const currentValue = FDAEditData?.addictionSeverity?.[key] || "";

                      return (
                        <td key={inputId} className="radio radio-primary">
                          <Input
                            id={inputId}
                            type="radio"
                            name={`addiction_${key}`}
                            value={value}
                            checked={currentValue === value}
                            onChange={() =>
                              setFDAEditData((prev) => ({
                                ...prev,
                                addictionSeverity: {
                                  ...prev.addictionSeverity,
                                  [key]: value,
                                },
                              }))
                            }
                          />
                          <Label for={inputId}>{value}</Label>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          <div className="col-md-12">
            <FormGroup className="mb-4 mt-4">
              <Label>Remarks</Label>
              <Input
                type="text"
                className="form-control"
                value={FDAEditData?.remarks || ""}
                onChange={(e) =>
                  setFDAEditData((prev) => ({ ...prev, remarks: e.target.value }))
                }
              />
            </FormGroup>
          </div>

          <div className="col-md-12">
            <FormGroup className="mb-4 mt-4">
              <Label>Prepared By</Label>
              <Input
                type="text"
                className="form-control"
                value={FDAEditData?.prepared_by || ""}
                onChange={(e) =>
                  setFDAEditData((prev) => ({
                    ...prev,
                    prepared_by: e.target.value,
                  }))
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
                "Create Re-FDA"
              )}
            </Button>
          </div>

        </form>
      </CommonModal>


      {/* View FDA data into modal start */}
      <CommonModal
        isOpen={viewFDADataModal}
        title={"First Dependency Assessment / प्रथम निर्भरता मूल्यांकन Details"}
        toggler={closePFAModal}
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
            First Dependency Assessment / प्रथम निर्भरता मूल्यांकन
          </h4>

          <Table size="sm" className="table-auto table-bordered">
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
              ) : viewFDAData ? (
                <>

                  <tr><th className="text-start p-3">Name</th><td className="border p-3">{viewFDAData.name}</td></tr>
                  <tr><th className="text-start p-3">Relative Name</th><td className="border p-3">{viewFDAData.relative_name}</td></tr>
                  <tr><th className="text-start p-3">Gender</th><td className="border p-3">{viewFDAData.gender}</td></tr>
                  <tr><th className="text-start p-3">Phone</th><td className="border p-3">{viewFDAData.phone}</td></tr>
                  <tr><th className="text-start p-3">Email</th><td className="border p-3">{viewFDAData.email}</td></tr>
                  <tr><th className="text-start p-3">User GKS ID</th><td className="border p-3">{viewFDAData.user_gks_id}</td></tr>
                  <tr><th className="text-start p-3">Entry GKS ID</th><td className="border p-3">{viewFDAData.entry_gks_id}</td></tr>
                  <tr><th className="text-start p-3">Visit No</th><td className="border p-3">{viewFDAData.visit_no}</td></tr>
                  <tr><th className="text-start p-3">Substance Type</th><td className="border p-3">{viewFDAData.substance_description}</td></tr>
                  <tr><th className="text-start p-3">Substance Code</th><td className="border p-3">{viewFDAData.substance_code}</td></tr>
                  <tr><th className="text-start p-3">Desire to Quit</th><td className="border p-3">{viewFDAData.desire_to_quit}</td></tr>
                  <tr><th className="text-start p-3">Lack of Control</th><td className="border p-3">{viewFDAData.lack_control}</td></tr>
                  <tr><th className="text-start p-3">Lack of Responsibility</th><td className="border p-3">{viewFDAData.lack_responsibility}</td></tr>
                  <tr><th className="text-start p-3">Time Spent Using</th><td className="border p-3">{viewFDAData.time_purchasing_using}</td></tr>
                  <tr><th className="text-start p-3">Cravings</th><td className="border p-3">{viewFDAData.cravings}</td></tr>
                  <tr><th className="text-start p-3">Relationship Problems</th><td className="border p-3">{viewFDAData.relationship_problems}</td></tr>
                  <tr><th className="text-start p-3">Using Dangerously</th><td className="border p-3">{viewFDAData.using_dangerously}</td></tr>
                  <tr><th className="text-start p-3">Losing Interest</th><td className="border p-3">{viewFDAData.losing_interest}</td></tr>
                  <tr><th className="text-start p-3">Increasing Tolerance</th><td className="border p-3">{viewFDAData.increasing_tolerance}</td></tr>
                  <tr><th className="text-start p-3">Experiencing Withdrawal</th><td className="border p-3">{viewFDAData.experiencing_withdrawal}</td></tr>
                  <tr><th className="text-start p-3">Addiction Severity</th><td className="border p-3">{viewFDAData.addiction_severity_rating}</td></tr>
                  <tr><th className="text-start p-3">Remarks</th><td className="border p-3">{viewFDAData.remarks}</td></tr>
                  <tr><th className="text-start p-3">Prepared By</th><td className="border p-3">{viewFDAData.prepared_by}</td></tr>
                  <tr><th className="text-start p-3">Assessment Date</th><td className="border p-3">{new Date(viewFDAData.date_of_assessment).toLocaleDateString()}</td></tr>
                  <tr><th className="text-start p-3">Created By</th><td className="border p-3">{viewFDAData.created_by_name}</td></tr>
                  <tr><th className="text-start p-3">Updated By</th><td className="border p-3">{viewFDAData.updated_by_name}</td></tr>
                  <tr><th className="text-start p-3">Status</th><td className="border p-3">{viewFDAData.status}</td></tr>
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
                    ? "Your FDA is being downloaded.../ आपका FDA डाउनलोड हो रहा है..."
                    : "Download Your First Dependency Assessment / प्रथम निर्भरता मूल्यांकन डाउनलोड करें"}
                </button>
              </div>
      </CommonModal>
      {/* View FDA data into modal end */}

    </Fragment>
  )
}

export default FDA;
