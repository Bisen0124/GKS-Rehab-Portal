import React, {
    useEffect,
    useState,
    Fragment,
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
    sud,
    consent,
    signature,
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
import DatePicker from "react-datepicker";
import CommonModal from "../UiKits/Modals/common/modal";
import HeaderCard from "../Common/Component/HeaderCard";
import DataTable from "react-data-table-component";

import Swal from "sweetalert2"; // ✅ Make sure this is imported at the top

//Calculate age by DOB custom hook
import useCalculateAge from "../../CustomHook/useCalculateAge";

//Show pateint/user common info like name, age and DOB by custom hook
import PatientCommonInfo from "../../CustomHook/PatientCommonInfo";

//editPFA download PDF library
// import html2canvas from "html2canvas";
// import jsPDF from "jspdf";
// import html2pdf from "html2pdf.js";
import { substanceList } from '../../Constant/index';

function SUD() {
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
                        // recent_sda_id: user.recent_sda_id,
                        recent_sda_id: user.recent_sda_id
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
                                onClick={() => handleSUDPreFill(row.recent_sda_id)}
                                style={{ cursor: "pointer" }}
                                title="Readmission FDA Form"
                            >
                                ✏️
                            </span>
                        )}

                        {/* Show Create PFA if not discharged and not readmission */}
                        {row.dischargeStatus === 0 && row.isReadmission === 0 && (
                            <span
                                onClick={() => createSUD(row.id)}
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


    //Create SUD form handler
    const createSUD = async (userId = null) => {
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
    }

    //Close all modal handler
    const closePFAModal = () => {
        setModal(false);
    };


    const [substances, setSubstances] = useState(
        substanceList.map((name, index) => ({
            substance_id: index + 1,
            substance_name: name,
            ever_used: "",
            duration: "",
            current_use: "",
            current_use_pattern: "",
            usual_dose: "",
            remarks: "",
        }))
    );

    const handleSubstances = (index, field, value) => {
        const updated = [...substances];
        updated[index][field] = value;
        setSubstances(updated);
    };



    const [formData, setformData] = useState({
        sudDateOfAssessment: new Date(),
        consent: "No", // or "Yes" if checked by default
        SUDsignature: ""
    })
    // const handleChanges = (e) => {
    //     const { name, value } = e.target.value;
    //     setformData((prev) => ({
    //         ...prev,
    //         [name]: value,
    //     }));
    // }
    const handleAssesmentDateChange = (name, date) => {
        setformData((prev) => ({
            ...prev,
            [name]: date,
        }));
    };
    const handleSubmitSUD = async (e) => {
        e.preventDefault();
        setIsLoading(true); // Start loader

        const payload = {
            user_id: selectedUser[0]?.user_id,
            date_of_assessment: formData.sudDateOfAssessment,
            patient_name: selectedUser[0].name,
            substance_details: substances,
            consent: formData.consent,
            signature: formData.SUDsignature
        };

        console.log("Submitting data to API:", payload);

        try {
            const token = localStorage.getItem("Authorization");

            const response = await fetch("https://gks-yjdc.onrender.com/api/sda/create-assessment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error("Failed to submit form data.");
            }

            const result = await response.json();
            console.log("API Response:", result);
                // ✅ Success Case
  setIsLoading(false);
             Swal.fire({
               icon: "success",
               title: "SUD Created Successfully",
               text: "The SUD assessment was submitted successfully.",
             }).then(() => {
             // This runs after the user clicks "OK"
             setModal(false);
           });
        } catch (error) {
            console.error("Submission error:", error);
            setIsLoading(false);
            Swal.fire({
                   icon: "error",
                   title: "Unexpected Error",
                   text: "SUD failed! Unknown error occurred.",
                 });
        }
    };



    //On click pencil icon like edit icon on form will open where all pre fill data to your form by recent_sda_id. 
    const [SUDeditModal, setSUDeditModal]=useState(false);
    const handleSUDPreFill= async (recentSUDID)=>{
        setSUDeditModal(true)
       if(typeof recentSUDID === "object" && recentSUDID !== null){
        recentSUDID = recentSUDID.recent_sda_id;
       }
       if (!recentSUDID) {
        console.error("Invalid recentSUDID provided");
        return;
      }
       console.log("recentSUDID =>", recentSUDID);
       const token = localStorage.getItem("Authorization");
       
           try {
             const response = await fetch(
               `https://gks-yjdc.onrender.com/api/sda/assessment/${recentSUDID}`,
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
             console.log("SUD => ", latestAssessment);
       
             if (!latestAssessment) {
               console.warn("No assessment found for this FDA ID.");
               return;
             }
       
           } catch (error) {
             console.error("Fetch error:", error);
           }
    }

     //close view data modal
  const closeSUDmodal = () => {
    setSUDeditModal(false)
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
                                            title="Substance Use Dependecny (SUD) Patient List"
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
            {/* SUD all user entries data list into data table end */}


            {/* Create SUD form popup modal start */}
            <CommonModal
                isOpen={modal}
                title={sud}
                toggler={closePFAModal}
                maxWidth="1200px"
            >
                <div className="col-md-12 table-responsive">
                    <Form onSubmit={handleSubmitSUD} className="theme-form">
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
                                                selected={formData.sudDateOfAssessment}
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
                        <Table className="table table-bordered">
                            <thead>
                                <tr>
                                    <th>S.No</th>
                                    <th>Substance<br />मादक पदार्थ</th>
                                    <th>Ever Used<br />उपयोग किया</th>
                                    <th>Duration<br />अवधि</th>
                                    <th>Current Use<br />वर्तमान उपयोग</th>
                                    <th>Current Use Pattern<br />यूज़ पैटर्न</th>
                                    <th>Usual Dose<br />मात्रा</th>
                                    <th>Remarks<br />टिप्पणियाँ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {substances.map((item, index) => (
                                    <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>{item.substance_name}</td>
                                        <td width={'10%'}>
                                            <select
                                                className="form-control"
                                                value={item.ever_used}
                                                onChange={(e) => handleSubstances(index, "ever_used", e.target.value)}
                                            >
                                                <option value="">Select</option>
                                                <option value="Yes">Yes</option>
                                                <option value="No">No</option>
                                            </select>
                                        </td>

                                        <td>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={item.duration}
                                                onChange={(e) =>
                                                    handleSubstances(index, "duration", e.target.value)
                                                }
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={item.current_use}
                                                onChange={(e) =>
                                                    handleSubstances(index, "current_use", e.target.value)
                                                }
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={item.current_use_pattern}
                                                onChange={(e) =>
                                                    handleSubstances(index, "current_use_pattern", e.target.value)
                                                }
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={item.usual_dose}
                                                onChange={(e) =>
                                                    handleSubstances(index, "usual_dose", e.target.value)
                                                }
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={item.remarks}
                                                onChange={(e) =>
                                                    handleSubstances(index, "remarks", e.target.value)
                                                }
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>


                        <div className="checkbox ms-3 mb-2">
                            <Input
                                id="checkbox1"
                                type="checkbox"
                                checked={formData.consent === "Yes"}
                                onChange={(e) =>
                                    setformData((prev) => ({
                                        ...prev,
                                        consent: e.target.checked ? "Yes" : "No",
                                    }))
                                }
                            />
                            <Label className="text-muted" for="checkbox1">
                                {consent}
                            </Label>
                        </div>
                        <div className="col-md-12">
                            <Col md="4">
                                <FormGroup>
                                    <Label>{signature}</Label>
                                    <Input
                                        type="text"
                                        placeholder="Signature"
                                        name="SUDsignature"
                                        value={formData.SUDsignature}
                                        onChange={(e) =>
                                            setformData((prev) => ({
                                                ...prev,
                                                SUDsignature: e.target.value,
                                            }))
                                        }
                                    />
                                </FormGroup>
                            </Col>
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
                                    "Create substance use dependency (SUD)"
                                )}
                            </Button>
                        </div>
                    </Form>
                </div>
            </CommonModal>
 {/* Create SUD form popup modal end */}


 {/* Readmission SUD form modal start */}
 <CommonModal
        isOpen={SUDeditModal}
        title="Readmission SUD"
        toggler={closeSUDmodal}
        maxWidth="1200px"
      >
        <p>Hello Readmision form by recent SUD ID's</p>
      </CommonModal>
 {/* Readmission SUD form modal end */}

        </Fragment>
    )
}
export default SUD;