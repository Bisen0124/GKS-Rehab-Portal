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
  SexualHistory,
  SexualHistoryID,
  SexualHistoryanswer,
  SexualHistoryquestion,
  SexuaQuesData,
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

function SexualDesire() {
  //Date of Assessment State
  const [startDateOfAssessment, setstartDateOfAssessment] = useState(
    new Date()
  );
  const handleChangeAssessment = (date) => {
    setstartDateOfAssessment(date);
    console.log("Date of Assessment", date);
  };

  //Sexual History / यौन इतिहास
  const [responses, setResponses] = useState({});

  const handleChange = (index, value) => {
    setResponses({ ...responses, [index]: value });
  };
  return (
    <Fragment>
      <H5>{SexualHistory}</H5>
      <div className="sd__wrapper">
        <Form className="theme-form">
          {/* Patient name and date of assessment */}
          <div className="row">
            {/*Patient Name section/प्रयासक का नाम :*/}
            <div className="col-md-6">
              <FormGroup className="form-group row">
                <Label className="col-sm-12 col-form-label  col-xl-6">
                  {patientName}
                </Label>
                <Col xl="5" sm="12">
                  <div className="input-group">
                    <Input
                      className="form-control"
                      type="text"
                      placeholder="Patient Name"
                      name="patientName"
                    />
                  </div>
                </Col>
              </FormGroup>
            </div>
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
                      selected={startDateOfAssessment}
                      onChange={handleChangeAssessment}
                    />
                  </div>
                </Col>
              </FormGroup>
            </div>
          </div>
          {/* Sexual History / यौन इतिहास Questions */}
          <div className="table-responsive">
            <Table bordered>
              <thead>
                <tr>
                  <th scope="col">{SexualHistoryID}</th>
                  <th scope="col">{SexualHistoryquestion}</th>
                  <th scope="col">{SexualHistoryanswer}</th>
                </tr>
              </thead>
              <tbody>
                {SexuaQuesData.map((q, index) => (
                  <tr key={index} className="border">
                    <td className="border px-4 py-2 text-center">
                      {index + 1}
                    </td>
                    <td className="border px-4 py-2">
                      <strong>{q.en}</strong>
                      <br />
                      <span className="text-gray-600">{q.hi}</span>
                    </td>
                    <td className="border px-4 py-2">
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={responses[index] || ""}
                        onChange={(e) => handleChange(index, e.target.value)}
                        placeholder="Enter your answer"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          <br/>
          <div className="row">
            <div className="consent__wrapper col-md-8">
              <Label className="d-block" for="chk-ani">
                <Input
                  className="checkbox_animated"
                  id="chk-ani"
                  type="checkbox"
                  defaultChecked
                />
                {consent}
              </Label>
            </div>
            <div className="col-md-4">
              <Label>{signature}</Label>
              <Input type="text" className="form-control" />
            </div>
            <div className="col-md-12">
              <Label>{prepared}</Label>
              <Input type="text" className="form-control" />
            </div>
          </div>
          <br/>
        </Form>
      </div>
    </Fragment>
  );
}

export default SexualDesire;
