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
import PatientViewHeader from "../Common/PatientViewHeader";
import TableExportButtons from "../Common/TableExportButtons";

const GetPFAReports = () => {
  //Branches selection
  const { selectedBranch } = useBranch();

  const pdfRef = useRef();
  const [isDownloading, setIsDownloading] = useState(false);

  //spinner extract from other file
  const selectedSpinner = Data.find(
    (item) => item.spinnerClass === "loader-37"
  );
  //Modal
  const [modal, setModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // User data

  const [data, setData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [stillLoading, setstillLoading] = useState(true);
  //Get all PFA  entries
  const tablePFAPatientListColumns = [
    {
      name: "GKS ID",
      selector: (row) => row.gks_id,
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
      name: "Email",
      selector: (row) => row.email,
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
          <p className="badge bg-success p-2">PFA {row.status}</p>
        </span>
      ),
    },
    {
      name: "View / Download Report",
      center: true,
      cell: (row) => (
        <div className="d-flex gap-2">
          <>
            <span
              onClick={() => viewPFAToggle(row.user_id)}
              style={{ cursor: "pointer" }}
              title="View / Download Report"
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
            {/* <span
              onClick={() => handleAllPFAEditData(row.user_id)}
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
            </span> */}
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

  //PFA view
  const [viewModal, setViewModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  //close view data modal
  const closeUserViewModal = () => {
    setViewModal(false);
  };

  //view pfa handler
  //fetch the latest assessment based on created_at, then simply sort the assessments and pick the first one:
  const viewPFAToggle = async (userId = null) => {
    if (typeof userId === "object" && userId !== null) {
      userId = userId.id;
    }

    if (!userId) {
      console.error("Invalid userId provided to toggle");
      return;
    }

    setViewModal(true);
    setIsLoading(true);

    const branch_id = selectedBranch;
    const token = localStorage.getItem("Authorization");

    try {
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/pfa/user-assessments/${userId}?branch_id=${branch_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error("User fetch error:", result);
        return;
      }

      // API returns assessments array in result.data
      const latestAssessment = (result.data || []).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      )[0];

      if (!latestAssessment) {
        console.warn("No assessments found for this user.");
        return;
      }

      setSelectedUser(latestAssessment);
      console.log("Selected User Assessment:", latestAssessment);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectableRowDisabled = (row) => row.disabled === true;

  const handleRowSelected = (state) => {
    const selectedRow = state.selectedRows[0];
    if (!selectedRow) return;

    if (selectedRow.disabled) {
      Swal.fire("Disabled", "This user's assessment is deleted.", "info");
      return;
    }

    setSelectedUser(selectedRow);
    // setPFAEditModal(true);

    // Make sure this is set correctly
    // setPFAeditData({
    //   pfa_id: selectedRow.pfa_id, // or selectedRow.pfa_id if that’s what you named it
    //   name: selectedRow.name,
    //   // include other fields if needed
    // });
  };
  //Search filter on register datalist
  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  //User data search filter function
  const handleSearchChange = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchText(value);

    const filtered = data.filter((item) =>
      item.name.toLowerCase().includes(value)
    );

    setFilteredData(filtered);
  };

  //All pfa patient list data search
  const [PFAallDatasearchText, PFAallDatasetSearchText] = useState("");
  const handlePFASearchChange = (e) => {
    const value = e.target.value.toLowerCase();
    PFAallDatasetSearchText(value);

    const filtered = getpfaData.filter((item) => {
      return (
        item.name?.toLowerCase().includes(value) ||
        item.gks_id?.toLowerCase().includes(value) ||
        item.pfa_id?.toString().includes(value) ||
        item.user_id?.toString().includes(value) ||
        item.phone?.toLowerCase().includes(value) ||
        item.email?.toLowerCase().includes(value)
      );
    });

    setpfaFilterData(filtered);
  };

  //PDf view download pdf code handler
  const [pfaDownload, setpfaDownload] = useState(false);
  const handleDownloadPDF = () => {
    const element = pdfRef.current;
    setpfaDownload(true);

    // Add a temporary class to scale fonts if needed
    element.classList.add("pdf-scale");

    const patientName =
      selectedUser?.name ||
      selectedUser?.patient_name ||
      "Patient";
    const gksId =
      selectedUser?.custom_code ||
      selectedUser?.gks_id ||
      selectedUser?.uid ||
      selectedUser?.user_id ||
      selectedUser?.id ||
      "";
    const safeName = String(patientName).trim().replace(/\s+/g, "_");
    const safeId = String(gksId).trim().replace(/\s+/g, "_");

    const opt = {
      margin: [10, 10, 10, 10], // top, left, bottom, right
      filename: `patient_${safeName}_${safeId || "pfa_report"}.pdf`,
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

  // All pfa patient data list state
  const [getpfaData, setgetpfaData] = useState([]);
  const [pfaFilterData, setpfaFilterData] = useState([]);
  useEffect(() => {
    if (!selectedBranch) return; // avoid empty branch fetch

    const token = localStorage.getItem("Authorization");

    fetch(
      `https://gks-yjdc.onrender.com/api/pfa/all-entries?branch_id=${selectedBranch}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      }
    )
      .then((response) => {
        if (!response.ok)
          throw new Error("Failed to fetch PFA all list user details");
        return response.json();
      })
      .then((res) => {
        // const pfaPatient = res.entries || [];
        const pfaPatient = res.data || [];

        const formattedPFAPatient = pfaPatient.map((item) => {
          return {
            pfa_id: item.pfa_id,
            status: item.status,

            user_id: item.user?.user_id,
            name: item.user?.name,
            phone: item.user?.phone,
            email: item.user?.email,
            gks_id: item.user?.gks_id,

            entry_id: item.entry?.entry_id,
            visit_no: item.entry?.visit_no,
            admit_date: item.entry?.admit_date,
            discharge_date: item.entry?.discharge_date,
            discharge_status: item.entry?.discharge_status,
            ward_name: item.entry?.ward_name,

            assessment_date: item.assessment?.date_of_assessment,
            age: item.assessment?.age,
            dependent_to: item.assessment?.dependent_to,
            substance_use_pattern: item.assessment?.substance_use_pattern,
            last_30_days_quantity: item.assessment?.last_30_days_quantity,

            medical_history: item.medical_history?.medical_history,
            blood_transfusion_history:
              item.medical_history?.blood_transfusion_history,
            medical_or_blood_history_details:
              item.medical_history?.medical_or_blood_history_details,

            ulcer: item.medical_conditions?.ulcer,
            respiratory_problem: item.medical_conditions?.respiratory_problem,
            jaundice: item.medical_conditions?.jaundice,
            haematemesis: item.medical_conditions?.haematemesis,
            abdominal_complaints: item.medical_conditions?.abdominal_complaints,
            cardiovascular: item.medical_conditions?.cardiovascular,
            complication_description:
              item.medical_conditions?.complication_description,

            seizure: item.neurological_conditions?.seizure,
            epilepsy: item.neurological_conditions?.epilepsy,
            delirium: item.neurological_conditions?.delirium,
            trembling: item.neurological_conditions?.trembling,
            memory_loss: item.neurological_conditions?.memory_loss,
            neuropathy: item.neurological_conditions?.neuropathy,
            blackout: item.neurological_conditions?.blackout,
            neuro_description: item.neurological_conditions?.neuro_description,

            weight: item.health_metrics?.weight,
            pulse_rate: item.health_metrics?.pulse_rate,
            blood_pressure: item.health_metrics?.blood_pressure,
            temperature: item.health_metrics?.temperature,
            lymphadenopathy: item.health_metrics?.lymphadenopathy,
            nutritional_status: item.health_metrics?.nutritional_status,
            other_findings: item.health_metrics?.other_findings,

            consent: item.consent?.consent,
            consent_name: item.consent?.consent_name,
            consent_relationship: item.consent?.consent_relationship,
            consent_signature: item.consent?.consent_signature,
            prepared_by: item.consent?.prepared_by,
            verification: item.consent?.verification,

            created_by: item.audit?.created_by,
            updated_by: item.audit?.updated_by,
            created_at: item.audit?.created_at,
            updated_at: item.audit?.updated_at,
            branch_id: item.audit?.branch_id,
          };
        });

        console.log(formattedPFAPatient);

        setTimeout(() => {
          setgetpfaData(formattedPFAPatient);
          setpfaFilterData(formattedPFAPatient);
          setstillLoading(false);
        }, 1000);
      })
      .catch((error) => {
        console.error("Error fetching PFA user data:", error);
        setstillLoading(true);
      });
  }, [selectedBranch]);

  return (
    <>
      {/* PFA pateint all list */}
      <Card>
        {/* <HeaderCard title="User Data Table with Multiple Selection" /> */}
        <CardBody>
          <div class="d-flex pb-2 justify-content-between">
            <HeaderCard
              title="Get All Patient First Assessment (PFA) Reports"
              className="p-0"
            />
          </div>
          <div className="row pb-3 align-items-center">
            <div className="col-md-5 col-12 mb-2 mb-md-0">
              <InputGroup>
                <Input
                  className="form-control"
                  type="text"
                  placeholder="Search......."
                  value={PFAallDatasearchText}
                  onChange={handlePFASearchChange}
                />
                <span className="input-group-text">
                  <i className="fa fa-search"></i>
                </span>
              </InputGroup>
            </div>
            <div className="col-md-7 col-12 d-flex justify-content-md-end justify-content-start">
              <TableExportButtons
                data={pfaFilterData}
                columns={tablePFAPatientListColumns}
                filename="PFA_Reports_List"
                title="All Patient First Assessment (PFA) Reports List"
              />
            </div>
          </div>
          {stillLoading ? (
            <div className="loading-text">
              Data is fetching from server. Please wait...
            </div>
          ) : (
            <DataTable
              data={pfaFilterData}
              columns={tablePFAPatientListColumns}
              striped
              center
              highlightOnHover
              pagination
              persistTableHead
              onSelectedRowsChange={handleRowSelected}
              selectableRowDisabled={selectableRowDisabled}
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

      {/* PFA view data modal */}
      <CommonModal
        isOpen={viewModal}
        title={"First Physical Assessment / प्रथम शारीरिक मूल्यांकन Details"}
        toggler={closeUserViewModal}
        maxWidth="1200px"
      >
        <Col sm="12">
          <div className="table-responsive p-4" ref={pdfRef} style={{ background: "#f8fafc" }}>
            {selectedUser && <PatientViewHeader data={selectedUser} />}

            <h4
              style={{
                textAlign: "center",
                textDecoration: "underline",
                padding: "20px 0",
              }}
            >
              First Physical Assessment / प्रथम शारीरिक मूल्यांकन
            </h4>
            <Table size="sm" className="table-bordered bg-white">
              <tbody style={{ fontSize: "14px" }}>
                {isLoading ? (
                  <tr>
                    <td colSpan="2" className="text-center">
                      <div className="loader-box">
                        <Spinner
                          className={
                            selectedSpinner?.spinnerClass || "spinner-border"
                          }
                        />
                      </div>
                    </td>
                  </tr>
                ) : selectedUser ? (
                  <>
                    <tr className="fw-bold">
                      <td colSpan="2" className="p-3">
                        Date of Assessment / मूल्यांकन की तारीख:
                      </td>
                      <td colSpan="2" className="p-3">
                        {new Date(
                          selectedUser.date_of_assessment
                        ).toLocaleDateString()}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="2" className="fw-semibold p-3">
                        Name of Patient / मरीज का नाम:
                      </td>
                      <td colSpan="2" className="p-3">
                        <span colSpan="2" className="fw-normal">
                          {selectedUser.name}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="2" className="fw-semibold p-3">
                        Sex / Age / लिंग / उम्र:
                      </td>
                      <td colSpan="2" className="p-3">
                        <span colSpan="2" className="fw-normal">
                          {selectedUser.age}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="2" className="fw-semibold p-3">
                        Dependent To / निर्भरता का प्रकार:
                      </td>
                      <td colSpan="2" className="p-3">
                        <span colSpan="2" className="fw-normal">
                          {selectedUser.dependent_to}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="2" className="fw-semibold p-3">
                        Substance Use Pattern / उपयोग का पैटर्न:
                      </td>
                      <td colSpan="2" className="p-3">
                        <span colSpan="2" className="fw-normal">
                          {selectedUser.substance_use_pattern}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="2" className="fw-semibold p-3">
                        Last 30 Days Quantity / पिछले 30 दिनों की मात्रा:
                      </td>
                      <td colSpan="2" className="p-3">
                        <span colSpan="2" className="fw-normal">
                          {selectedUser.last_30_days_quantity}
                        </span>
                      </td>
                    </tr>

                    <br />
                    <br />
                    <tr className="table-secondary text-center fw-bold">
                      <td colSpan="4" className="p-3">
                        General Physical Examination / सामान्य शारीरिक परीक्षण
                      </td>
                    </tr>
                    {[
                      {
                        label: "Weight / वजन",
                        value: selectedUser.weight,
                      },
                      {
                        label: "Pulse Rate / पल्स रेट",
                        value: selectedUser.pulse_rate,
                      },
                      {
                        label: "Blood pressure / रक्तचाप",
                        value: selectedUser.blood_pressure,
                      },
                      {
                        label: "Temperature / तापमान",
                        value: selectedUser.temperature,
                      },
                      {
                        label: "Medical History / चिकित्सा इतिहास",
                        value: selectedUser.medical_history,
                      },
                      {
                        label:
                          "Blood Transfusion History / रक्त संक्रमण इतिहास",
                        value: selectedUser.blood_transfusion_history,
                      },
                      {
                        label: "Medical or Blood History Details",
                        value: selectedUser.medical_or_blood_history_details,
                      },
                    ].map((item, i) => (
                      <tr key={i}>
                        <td colSpan="2" className="fw-semibold p-3">
                          {item.label}
                        </td>
                        <td colSpan="2" className="p-3">
                          {item.value || "—"}
                        </td>
                      </tr>
                    ))}

                    <br />
                    <br />

                    <tr className="table-secondary text-center fw-bold">
                      <td colSpan="4" className="p-3">
                        Complication Details / जटिलता विवरण
                      </td>
                    </tr>
                    {[
                      {
                        label: "Ulcers / अल्सर",
                        value: selectedUser.ulcer,
                      },
                      {
                        label: "Respiratory Problem / श्वसन समस्या",
                        value: selectedUser.respiratory_problem,
                      },
                      {
                        label: "Jaundice / पीलिया",
                        value: selectedUser.jaundice,
                      },
                      {
                        label: "Haematemesis / मलैना",
                        value: selectedUser.haematemesis,
                      },
                      {
                        label: "Abdominal Complaints / पेट की शिकायतें",
                        value: selectedUser.abdominal_complaints,
                      },
                      {
                        label: "Cardiovascular / हृदय संबंधी",
                        value: selectedUser.cardiovascular,
                      },
                      {
                        label: "Complication Description",
                        value: selectedUser.complication_description,
                      },
                    ].map((item, i) => (
                      <tr key={i}>
                        <td colSpan="2" className="fw-semibold p-3">
                          {item.label}
                        </td>
                        <td colSpan="2" className="p-3">
                          {item.value || "—"}
                        </td>
                      </tr>
                    ))}

                    <br />
                    <br />

                    <tr
                      className="table-secondary text-center fw-bold"
                      style={{
                        pageBreakInside: "avoid",
                        border: "1px solid #ccc",
                        padding: "10px",
                      }}
                    >
                      <td colSpan="4" className="p-3">
                        Neurological / न्यूरोलॉजिकल
                      </td>
                    </tr>
                    {[
                      {
                        label: "Seizure / फिट्स",
                        value: selectedUser.seizure,
                      },
                      {
                        label: "Epilepsy / मिर्गी",
                        value: selectedUser.epilepsy,
                      },
                      {
                        label: "Delirium / भ्रम",
                        value: selectedUser.delirium,
                      },
                      {
                        label: "Trembling / कांपना",
                        value: selectedUser.trembling,
                      },
                      {
                        label: "Memory Loss / स्मृति हानि",
                        value: selectedUser.memory_loss,
                      },
                      {
                        label: "Neuropathy / स्नायु रोग",
                        value: selectedUser.neuropathy,
                      },
                      {
                        label: "Blackout / बेहोशी",
                        value: selectedUser.blackout,
                      },
                      {
                        label: "Neuro Description",
                        value: selectedUser.neuro_description,
                      },
                    ].map((item, i) => (
                      <tr
                        key={i}
                        style={{
                          pageBreakInside: "avoid",
                          border: "1px solid #ccc",
                          padding: "10px",
                        }}
                      >
                        <td colSpan="2" className="fw-semibold p-3">
                          {item.label}
                        </td>
                        <td colSpan="2" className="p-3">
                          {item.value || "—"}
                        </td>
                      </tr>
                    ))}

                    <br />
                    <br />

                    <tr>
                      <td colSpan="2" className="fw-semibold p-3">
                        Nutritional Status / पोषण स्थिति:
                      </td>
                      <td colSpan="2" className="p-3">
                        {selectedUser.nutritional_status}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="2" className="fw-semibold p-3">
                        Lymphadenopathy (mention):
                      </td>
                      <td colSpan="2" className="p-3">
                        {selectedUser.lymphadenopathy}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="2" className="fw-semibold p-3">
                        Other Findings / अन्य खोज:
                      </td>
                      <td colSpan="2" className="p-3">
                        {selectedUser.other_findings}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="2" className="fw-semibold p-3">
                        Consent:
                      </td>
                      <td colSpan="2" className="p-3">
                        {selectedUser.consent}
                      </td>
                    </tr>
                    <tr>
                      <td className="fw-semibold p-3">Consent Name:</td>
                      <td className="p-3">{selectedUser.consent_name}</td>
                      <td className="fw-semibold p-3">Relationship:</td>
                      <td className="p-3">
                        {selectedUser.consent_relationship}
                      </td>
                    </tr>
                    <tr className="table-light fw-bold">
                      <td colSpan="1" className="fw-semibold p-3">
                        Prepared by:{" "}
                      </td>
                      <td className="p-3" colSpan="3">
                        {selectedUser.prepared_by}
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
               ? "Your PFA Report is being downloaded... / आपका PFA रिपोर्ट डाउनलोड हो रहा है..."
               : "View / Download Your First Physical Assessment (PFA) Report / अपना प्रथम शारीरिक मूल्यांकन देखें / डाउनलोड करें"
              }               
            </button>
          </div>
        </Col>
      </CommonModal>
    </>
  );
};
export default GetPFAReports;
