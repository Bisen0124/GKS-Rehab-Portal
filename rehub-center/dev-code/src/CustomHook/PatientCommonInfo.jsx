import React from "react";
import { Col, Label, FormGroup } from "reactstrap";

const PatientCommonInfo = ({ selectedUser = [], labels = {} }) => {
  
  const user = Array.isArray(selectedUser) && selectedUser.length > 0
  ? selectedUser[0]
  : selectedUser;

  

  return (
    <div className="row modal-header common__info__header pb-3">
      {/* Date of Admission */}
      <div className="col-md-6 d-flex">
        <Label className="col-form-label form-control-plaintext">
          {labels?.date_of_admission || "Date of Admission"}
        </Label>
        <div className="form-control-plaintext">
          {user?.date_of_admission
            ? new Date(user.date_of_admission).toLocaleDateString()
            : "N/A"}
        </div>
      </div>

      {/* Patient Name */}
      <div className="col-md-6">
        <FormGroup className="form-group row m-b-0">
          <Label className="col-sm-12 col-form-label col-xl-6">
            {labels?.name || "Patient Name"}
          </Label>
          <Col xl="5" sm="12" className="d-flex align-items-center">
            <span className="form-control-plaintext text-capitalize">
            <span>{user?.name || "N/A"}</span>
 

            </span>
          </Col>
        </FormGroup>
      </div>

      {/* Gender */}
      <div className="col-md-6 d-flex">
        <Label className="col-form-label form-control-plaintext">
          {labels?.sex || "Gender"}
        </Label>
        <div className="form-control-plaintext">
          {user?.gender || "N/A"}
        </div>
      </div>

      {/* Age */}
      <div className="col-md-6 d-flex">
        <Label className="col-form-label form-control-plaintext">
          {labels?.age || "Age"}
        </Label>
        <div className="form-control-plaintext">
          {labels?.ageValue || "N/A"}
        </div>
      </div>
    </div>
  );
};

export default PatientCommonInfo;
