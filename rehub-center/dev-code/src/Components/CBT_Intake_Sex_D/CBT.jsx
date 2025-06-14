import React, { Fragment, useState, useEffect } from "react";
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
} from "reactstrap";
import { H5 } from "../../AbstractElements";
import DatePicker from "react-datepicker";
import CommonModal from "../UiKits/Modals/common/modal";
import HeaderCard from "../Common/Component/HeaderCard";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2"; // ✅ Make sure this is imported at the top

//Calculate age by DOB custom hook
import useCalculateAge from "../../CustomHook/useCalculateAge";

//Show pateint/user common info like name, age and DOB by custom hook
import PatientCommonInfo from "../../CustomHook/PatientCommonInfo";

function CBT() {

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
                            // onClick={() => handleSUDPreFill(row.recent_sda_id)}
                            // style={{ cursor: "pointer" }}
                            // title="Readmission FDA Form"
                        >
                            ✏️
                        </span>
                    )}

                    {/* Show Create PFA if not discharged and not readmission */}
                    {row.dischargeStatus === 0 && row.isReadmission === 0 && (
                        <span
                            onClick={() => createSUD(row.id)}
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

    fetch("https://gks-yjdc.onrender.com/api/sda/all-sda-entries", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
        },
    })
        .then((response) => {
            if (!response.ok) throw new Error("Failed to fetch SDA entries");
            return response.json();
        })
        .then((res) => {
            const entries = res.entries || [];

            console.log("SDA Response =>", res);

            const formatted = entries.map((entry) => {
                const admitDate = entry.admit_date ? new Date(entry.admit_date) : null;
                const sdaDate = entry.date_of_assessment ? new Date(entry.date_of_assessment) : null;

                let userStatus = <p className="badge bg-warning text-dark p-2">{"Pending"}</p>;
                if (admitDate && sdaDate && admitDate < sdaDate) {
                    userStatus = <p className="badge bg-success p-2">{"Completed"}</p>;
                }

                const dischargeStatusText = entry.discharge_status === 1 ? "Discharged" : "Not Discharged";

                return {
                    id: entry.user_id,
                    gks_id: entry.gks_id || "N/A",
                    name: entry.user_name || "N/A",
                    status: userStatus,
                    dischargeStatus: entry.discharge_status,
                    dischargeStatusText: dischargeStatusText,
                    isReadmission: false, // Assuming this data is not present in response
                    recent_sda_id: entry.sda_id,
                    ward: entry.ward_name || "N/A",
                    phone: entry.phone,
                    email: entry.email,
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
const createSUD = async (userId = null) => {
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

            {/* SUD all user entries data list into data table start */}
            
            {/* Coming soon!! */}

            {/* SUD all user entries data list into data table end */}


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
      
    </Fragment>
  );
}

export default CBT;
