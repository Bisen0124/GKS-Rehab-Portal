import React from 'react';
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
import { patientPersonalInformation } from '../../Constant';

function PersonalDetails() {
  return (
    <form className="container">
      <h4 className="mb-4">{patientPersonalInformation}</h4>

      <div className="row">
        <div className="col-md-6">
          <FormGroup className="form-group">
            <Label>Patient ID / मरीज आईडी</Label>
            <Input type="text" name="patientId" />
          </FormGroup>
        </div>
        <div className="col-md-6">
          <FormGroup className="form-group">
            <Label>Name of Patient / मरीज का नाम</Label>
            <Input type="text" name="patientName" />
          </FormGroup>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <FormGroup className="form-group">
            <Label>Date of Admission / प्रवेश की तिथि</Label>
            <Input type="date" name="admissionDate" />
          </FormGroup>
        </div>
        <div className="col-md-6">
          <FormGroup className="form-group">
            <Label>Date of Form Filling / फॉर्म भरने की तिथि</Label>
            <Input type="date" name="formDate" />
          </FormGroup>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <FormGroup className="form-group">
            <Label>Sex / Age / लिंग / उम्र</Label>
            <Input type="text" name="sexAge" />
          </FormGroup>
        </div>
        <div className="col-md-6">
          <FormGroup className="form-group">
            <Label>Duration of Interview / साक्षात्कार की अवधि</Label>
            <Input type="text" name="interviewDuration" />
          </FormGroup>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <FormGroup className="form-group">
            <Label>Occupational / Education? / व्यवसाय/शिक्षा?</Label>
            <Input type="text" name="occupationEducation" />
          </FormGroup>
        </div>
        <div className="col-md-6">
          <FormGroup className="form-group">
            <Label>Marital Status / वैवाहिक स्थिति?</Label>
            <Input type="text" name="maritalStatus" />
          </FormGroup>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <FormGroup className="form-group">
            <Label>Father's Name / पिता का नाम</Label>
            <Input type="text" name="fatherName" />
          </FormGroup>
        </div>
        <div className="col-md-6">
          <FormGroup className="form-group">
            <Label>Father's Occupation / पिता का पेशा</Label>
            <Input type="text" name="fatherOccupation" />
          </FormGroup>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <FormGroup className="form-group">
            <Label>Living Situation / रहने की स्थिति</Label>
            <Input type="text" name="livingSituation" />
          </FormGroup>
        </div>
        <div className="col-md-6">
          <FormGroup className="form-group">
            <Label>Religion / धर्म</Label>
            <Input type="text" name="religion" />
          </FormGroup>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <FormGroup className="form-group">
            <Label>Address / Contact No: / पता / फ़ोन नंबर</Label>
            <Input type="text" name="addressContact" />
          </FormGroup>
        </div>
      </div>
    </form>
  )
}

export default PersonalDetails
