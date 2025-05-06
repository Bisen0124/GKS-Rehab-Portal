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
  FirstPhysicalAssessment,
  Weight,
  PulseRate,
  Bloodpressure,
  Temperature,
  AnyMedicalHistory,
  AnyBloodTransfusionHistory,
  ComplicationTitle,
  complicationsDetailsData,
  NeurologicalTitle,
  neurologicalComplications,
  mentionIfAny3,
  NutritionalStatus,
  good,
  average,
  poor,
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

function FPA() {
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

  //Complication Details / जटिलता विवरण
  const [selectedValues, setSelectedValues] = useState({});
  // Function to update state when a radio button is clicked
  const handleRadioChange = (id, value) => {
    setSelectedValues((prevState) => ({
      ...prevState,
      [id]: value,
    }));
  };

  //Neurological / न्यूरोलॉजिकल
  const [selectedNeuroValues, setselectedNeuroValues] = useState({});
  const handleNeuroRadioChange = (id, value) => {
    setselectedNeuroValues((prevState) => ({
      ...prevState,
      [id]: value,
    }));
  };
  return (
    <Fragment>
      <div className="fpa__wrapper p-20">
        <H5>{FirstPhysicalAssessment}</H5>
        <Form className="theme-form">
          <div className="row">
            {/*Date of Admission section/प्रवेश की तिथि :*/}
            <div className="col-md-6">
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
            {/*Patient Sex section/प्रयासक का लिंग :*/}
            <div className="col-md-3">
              <Label>{patientSex}</Label>
              <div className="radio radio-primary d-flex">
                <Input id="radio1" type="radio" name="gender" value={male} />
                <Label for="radio1">
                  {male}
                  <span className="digits"></span>
                </Label>

                <Input id="radio2" type="radio" name="gender" value={female} />
                <Label for="radio2">
                  {female}
                  <span className="digits"></span>
                </Label>

                <Input id="radio3" type="radio" name="gender" value={other} />
                <Label for="radio3">
                  {other}
                  <span className="digits"></span>
                </Label>
              </div>
            </div>
            {/*Patient Age section/प्रयासक का उम्र :*/}
            <div className="col-md-3">
              <Label>{patientAge}</Label>
              <div className="age__wrapper">
                <Input
                  id="age"
                  type="number"
                  name="age"
                  min="1"
                  max="120"
                  placeholder="Enter your age"
                />
              </div>
            </div>
            {/*Dependent to section/उपयोगकर्ता :*/}
            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{dependentTo}</Label>
                <Input type="textarea" className="form-control" rows="3" />
              </FormGroup>
            </div>
            {/*Substance Use Pattern section/उपयोगकर्ता :*/}
            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{substanceUsePattern}</Label>
                <Input type="textarea" className="form-control" rows="3" />
              </FormGroup>
            </div>
            {/*Last 30 Days Quantity section/उपयोगकर्ता :*/}
            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{anyOtherFindings}</Label>
                <Input type="textarea" className="form-control" rows="3" />
              </FormGroup>
            </div>
          </div>
          {/* Genral Physical Examination / सामान्य शारीरिक परीक्षण */}
          <div className="table-responsive">
            <Table bordered>
              <thead>
                <tr>
                  <th scope="col">{tableNumber}</th>
                  <th scope="col">{genralPhysicalExamination}</th>
                  <th scope="col">{Observation}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{"1"}</td>
                  <td>{Weight}</td>
                  <td>
                    {" "}
                    <Input type="text" className="form-control" />
                  </td>
                </tr>
                <tr>
                  <td>{"2"}</td>
                  <td>{PulseRate}</td>
                  <td>
                    {" "}
                    <Input type="text" className="form-control" />
                  </td>
                </tr>
                <tr>
                  <td>{"3"}</td>
                  <td>{Bloodpressure}</td>
                  <td>
                    {" "}
                    <Input type="text" className="form-control" />
                  </td>
                </tr>
                <tr>
                  <td>{"4"}</td>
                  <td>{Temperature}</td>
                  <td>
                    {" "}
                    <Input type="text" className="form-control" />
                  </td>
                </tr>
                <tr>
                  <td>{"5"}</td>
                  <td>{AnyMedicalHistory}</td>
                  <td>
                    {" "}
                    <Input type="text" className="form-control" />
                  </td>
                </tr>
                <tr>
                  <td>{"6"}</td>
                  <td>{AnyBloodTransfusionHistory}</td>
                  <td>
                    {" "}
                    <Input type="text" className="form-control" />
                  </td>
                </tr>
              </tbody>
            </Table>
            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{mentionIfAny}</Label>
                <Input type="textarea" className="form-control" rows="3" />
              </FormGroup>
            </div>
          </div>
          {/* Complication Details / जटिलता विवरण */}
          <div className="table-responsive">
            <Table bordered>
              <thead>
                <tr>
                  <th scope="col">{tableNumber}</th>
                  <th scope="col">{ComplicationTitle}</th>
                  <th scope="col">{yes}</th>
                  <th scope="col">{no}</th>
                </tr>
              </thead>
              <tbody>
                {complicationsDetailsData.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.label}</td>
                    <td className="radio radio-primary">
                      <Input
                        id={`radio_yes_${item.id}`}
                        type="radio"
                        name={`complication_${item.id}`}
                        value="Yes"
                        checked={selectedValues[item.id] === "Yes"}
                        onChange={() => handleRadioChange(item.id, "Yes")}
                      />
                      <Label for={`radio_yes_${item.id}`}>Yes</Label>
                    </td>
                    <td className="radio radio-primary">
                      <Input
                        id={`radio_no_${item.id}`}
                        type="radio"
                        name={`complication_${item.id}`}
                        value="No"
                        checked={selectedValues[item.id] === "No"}
                        onChange={() => handleRadioChange(item.id, "No")}
                      />
                      <Label for={`radio_no_${item.id}`}>No</Label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{mentionIfAny2}</Label>
                <Input type="textarea" className="form-control" rows="3" />
              </FormGroup>
            </div>
          </div>
          {/* Neurological / न्यूरोलॉजिकल */}
          <div className="table-responsive">
            <Table bordered>
              <thead>
                <tr>
                  <th scope="col">{tableNumber}</th>
                  <th scope="col">{NeurologicalTitle}</th>
                  <th scope="col">{yes}</th>
                  <th scope="col">{no}</th>
                </tr>
              </thead>
              <tbody>
                {neurologicalComplications.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.label}</td>
                    <td className="radio radio-primary">
                      <Input
                        id={`radio_yes_${item.id}`}
                        type="radio"
                        name={`complication_${item.id}`}
                        value="Yes"
                        checked={selectedNeuroValues[item.id] === "Yes"}
                        onChange={() => handleNeuroRadioChange(item.id, "Yes")}
                      />
                      <Label for={`radio_yes_${item.id}`}>Yes</Label>
                    </td>
                    <td className="radio radio-primary">
                      <Input
                        id={`radio_no_${item.id}`}
                        type="radio"
                        name={`complication_${item.id}`}
                        value="No"
                        checked={selectedNeuroValues[item.id] === "No"}
                        onChange={() => handleNeuroRadioChange(item.id, "No")}
                      />
                      <Label for={`radio_no_${item.id}`}>No</Label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{mentionIfAny3}</Label>
                <Input type="textarea" className="form-control" rows="3" />
              </FormGroup>
            </div>
          </div>
          {/* Nutritional Status / नुट्रिशन स्तिथि  */}
          <div className="row">
            <div className="col-md-12">
              <Label>{NutritionalStatus}</Label>
            </div>
            <div className="col-md-3 radio radio-primary">
              <Input id="radio4" type="radio" name="" value={good} />
              <Label for="radio4">
                {good}
                <span className="digits"></span>
              </Label>
            </div>
            <div className="col-md-3 radio radio-primary">
              <Input id="radio5" type="radio" name="" value={average} />
              <Label for="radio5">
                {average}
                <span className="digits"></span>
              </Label>
            </div>
            <div className="col-md-3 radio radio-primary">
              <Input id="radio6" type="radio" name="" value={poor} />
              <Label for="radio6">
                {poor}
                <span className="digits"></span>
              </Label>
            </div>
            {/* Any Other Findings  / कोई अन्य निष्कर्ष */}
            <div className="col-md-12">
              <FormGroup className="mb-0">
                <Label>{anyOtherFindings}</Label>
                <Input type="textarea" className="form-control" rows="3" />
              </FormGroup>
            </div>
            {/* Prepared By/प्रिपेर्ड बाय : */}
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

export default FPA;
