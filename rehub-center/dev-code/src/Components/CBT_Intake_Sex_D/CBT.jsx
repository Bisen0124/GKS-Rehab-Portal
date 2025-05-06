import React, { Fragment, useState } from "react";
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
} from "reactstrap";
import { H5 } from "../../AbstractElements";
import DatePicker from "react-datepicker";

function CBT() {
  //Date of Admission State/प्रवेश की तिथि
  const [startDateOfAdmission, setstartDateOfAdmission] = useState(new Date());
  const handleChangeAdmission = (date) => {
    setstartDateOfAdmission(date);
    console.log("Date of Admission", date);
  };
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
    const score = Math.min(Math.max(0, Number(value)), maxScore); // Ensure score is within range
    setPatientScores((prev) => ({ ...prev, [id]: score }));
  };

  // Calculate total score
  const totalScore = Cognitivequestions.reduce(
    (sum, q) => sum + (patientScores[q.id] || 0),
    0
  );

  return (
    <Fragment>
      <H5>{CognitiveTitle}</H5>
      <div className="cbt__wrapper">
        <Form className="theme-form">
          <div className="row">
            {/*Date of Admission section/प्रवेश की तिथि :*/}
            <div className="col-md-12">
              <FormGroup className="form-group row">
                <Label className="col-sm-12 col-form-label  col-xl-6">
                  {dateOfAdmission}
                </Label>
                <Col xl="5" sm="12">
                  <div className="input-group">
                    <DatePicker
                      className="form-control digits"
                      selected={startDateOfAdmission}
                      onChange={handleChangeAdmission}
                    />
                  </div>
                </Col>
              </FormGroup>
            </div>
            {/*Date of Assessment section/परीक्षण की तारीख :*/}
            <div className="col-md-12">
              <FormGroup className="form-group row">
                <Label className="col-sm-12 col-form-label  col-xl-6">
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
            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{Spaceforwork}</Label>
                <Input type="textarea" className="form-control" rows="3" />
              </FormGroup>
            </div>
            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{Remarks}</Label>
                <Input type="textarea" className="form-control" rows="3" />
              </FormGroup>
            </div>
            <div className="col-md-12">
              <Label>{prepared}</Label>
              <Input type="text" className="form-control" />
            </div>
          </div>
        </Form>
      </div>
    </Fragment>
  );
}

export default CBT;
