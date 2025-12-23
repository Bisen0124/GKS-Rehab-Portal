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
  patientPersonalInformation
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

import { useBranch } from "../../contexts/BranchContext";


import Translated from "../Translated";
import { useLang } from "../../contexts/LangContext";
import { getTranslation } from "../../utils/translator";

import VoiceTextarea from "../VoiceTextarea/VoiceTextarea";

import { useReactToPrint } from "react-to-print";

function PersonalDetails() {
     const { lang } = useLang(); // get current language from context
      //Branches selections
       const {selectedBranch}=useBranch();
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
      if (!selectedBranch) return; // avoid empty branch fetch
      const token = localStorage.getItem("Authorization");
  
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
  
              let isCBTCompleted = false;
  
            let userStatus = <p className="badge bg-warning text-dark p-2">{getTranslation("Pending/लंबित",lang)}</p>;
  
            if (admitDate && CBTDate && admitDate > CBTDate) {
              isCBTCompleted = true;
              userStatus = <p className="badge bg-success p-2">{getTranslation("Completed/पुरा होना।",lang)}</p>;
            }
  
            // const dischargeStatusText = user.discharge_status_text || "Unknown";
  
            return {
              id: user.user_id,
              gks_id: user.gks_id || "N/A",
              name: user.name,
              status: userStatus,
              isCBTCompleted,
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
    }, [selectedBranch]);
  
  
    //Getting registred patient data into table row 
    const tableColumns = [
      { name: `${getTranslation('User ID/उपयोगकर्ता आईडी' , lang)}`, selector: (row) => row.id, sortable: true, center: true },
      { name: `${getTranslation('GKS ID/GKS आईडी' , lang)}`, selector: (row) => row.gks_id, sortable: true, center: true },
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
                // onClick={() => handleCBTPreFill(row.recent_cbt_id)}
                style={{ cursor: "pointer" }}
                title={getTranslation("Readmission CBT Form/पुनः प्रवेश सीबीटी फॉर्म",lang)}
                >
                  ✏️
                </span>
              )}
  
              {/* Show Create PFA if not discharged and not readmission */}
              {/* {row.dischargeStatus === 0 && row.isReadmission === 0 && (
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
              )} */}
  
  {row.dischargeStatus === 0 && row.isReadmission === 0 && (
    <span
      onClick={() => (row.isCBTCompleted ? null : createPDHandler(row.id))}
      style={{
        cursor: row.isCBTCompleted ? "not-allowed" : "pointer",
        opacity: row.isCBTCompleted ? 0.5 : 1,
      }}
      title={row.isCBTCompleted ? getTranslation("Personal Data Form Completed/पर्सनल डेटा फ़ॉर्म पूरा हुआ",lang) : getTranslation("Create Personal Data Form/व्यक्तिगत डेटा फ़ॉर्म बनाएँ",lang)}
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

     //Create CBT form handler
  const createPDHandler = async (userId = null) => {
    console.log("Personal Details Data =>", userId);
    setModal(true);
    if (userId) {
      const token = localStorage.getItem("Authorization");
      try {
        const branch_id = selectedBranch; // make sure `selectedBranch` 
        const response = await fetch(`https://gks-yjdc.onrender.com/api/users/${userId}?branch_id=${branch_id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        });
        const result = await response.json();
        console.log("API Response:", result);
        if (!response.ok) throw new Error("User fetch failed");
        // ✅ Pick the first user object from response
      if (result.success && result.data && result.data.length > 0) {
        setSelectedUser(result.data[0]);
      }
      else {
        console.error("No user found in response");
      }
      } catch (error) {
        console.error("Fetch error:", error);
      }
    }
  }

    //Close all modal handler
    const closeAllModal = () => {
      setModal(false);
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

{/* Create and submit PD from start  */}
<CommonModal
        isOpen={modal}
        title={getTranslation(patientPersonalInformation,lang)}
        toggler={closeAllModal}
        maxWidth="1200px"
      >

        <div className="cbt__wrapper">
          <Form className="theme-form">
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
      {/* <h4 className="mb-4">{patientPersonalInformation}</h4> */}

      <div className="row">
        <div className="col-md-6">
          <FormGroup className="form-group">
            <Label>{getTranslation("Patient ID / मरीज आईडी",lang)}</Label>
            <Input type="text" name="patientId" />
          </FormGroup>
        </div>
        <div className="col-md-6">
          <FormGroup className="form-group">
            <Label>{getTranslation("Name of Patient / मरीज का नाम",lang)}</Label>
            <Input type="text" name="patientName" />
          </FormGroup>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <FormGroup className="form-group">
            <Label>{getTranslation("Date of Admission / प्रवेश की तिथि",lang)}</Label>
            <Input type="date" name="admissionDate" />
          </FormGroup>
        </div>
        <div className="col-md-6">
          <FormGroup className="form-group">
            <Label>{getTranslation("Date of Form Filling / फॉर्म भरने की तिथि",lang)}</Label>
            <Input type="date" name="formDate" />
          </FormGroup>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <FormGroup className="form-group">
            <Label>{getTranslation("Sex & Age / लिंग & उम्र",lang)}</Label>
            <Input type="text" name="sexAge" />
          </FormGroup>
        </div>
        <div className="col-md-6">
          <FormGroup className="form-group">
            <Label>{getTranslation("Duration of Interview / साक्षात्कार की अवधि",lang)}</Label>
            <Input type="text" name="interviewDuration" />
          </FormGroup>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <FormGroup className="form-group">
            <Label>{getTranslation("Occupational / Education? / व्यवसाय/शिक्षा?",lang)}</Label>
            <Input type="text" name="occupationEducation" />
          </FormGroup>
        </div>
        <div className="col-md-6">
          <FormGroup className="form-group">
            <Label>{getTranslation("Marital Status / वैवाहिक स्थिति?",lang)}</Label>
            <Input type="text" name="maritalStatus" />
          </FormGroup>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <FormGroup className="form-group">
            <Label>{getTranslation("Father's Name / पिता का नाम",lang)}</Label>
            <Input type="text" name="fatherName" />
          </FormGroup>
        </div>
        <div className="col-md-6">
          <FormGroup className="form-group">
            <Label>{getTranslation("Father's Occupation / पिता का पेशा",lang)}</Label>
            <Input type="text" name="fatherOccupation" />
          </FormGroup>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <FormGroup className="form-group">
            <Label>{getTranslation("Living Situation / रहने की स्थिति",lang)}</Label>
            <Input type="text" name="livingSituation" />
          </FormGroup>
        </div>
        <div className="col-md-6">
          <FormGroup className="form-group">
            <Label>{getTranslation("Religion / धर्म",lang)}</Label>
            <Input type="text" name="religion" />
          </FormGroup>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <FormGroup className="form-group">
            <Label>{getTranslation("Address & Contact No: / पता & फ़ोन नंबर",lang)}</Label>
            <Input type="text" name="addressContact" />
          </FormGroup>
        </div>
      </div>
            {/* Submit Button */}
            <div className="d-flex gap-3 mt-4 mb-3 px-3">
              <Button color="primary" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  ></span>
                ) : (
                  getTranslation("Create Personal Data Form/व्यक्तिगत डेटा फ़ॉर्म बनाएँ",lang)
                )}
              </Button>
            </div>
  </Form>
        </div>
      </CommonModal>
{/* Create and submit PD from end  */}

    </Fragment>
   
  )
}

export default PersonalDetails
