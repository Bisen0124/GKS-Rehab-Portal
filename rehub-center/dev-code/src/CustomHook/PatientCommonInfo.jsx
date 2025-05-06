import React from "react";
import { Col, Label, FormGroup } from "reactstrap";

const PatientCommonInfo = ({ selectedUser = [], labels = {} }) => {
  const user = selectedUser?.[0] || {};

  return (
    <div className="row modal-header common__info__header pb-3">
      {/* Date of admission */}
      <div className="col-md-6 d-flex">
        <Label className="col-form-label form-control-plaintext">
          {labels.date_of_admission || "date_of_admission"}
        </Label>
        <div className="form-control-plaintext">
          {/* {user.date_of_admission || "N/A"} */}
          {new Date(
                                user.date_of_admission
                              ).toLocaleDateString() || "N/A"}
        </div>
      </div>

      {/* Patient Name */}
      <div className="col-md-6">
        <FormGroup className="form-group row m-b-0">
          <Label className="col-sm-12 col-form-label col-xl-6">
            {labels.name || "Patient Name"}
          </Label>
          <Col xl="5" sm="12" className="d-flex align-items-center">
            <span className="form-control-plaintext text-capitalize">
              {user.name || "N/A"}
            </span>
          </Col>
        </FormGroup>
      </div>

      {/* Patient Gender */}
      <div className="col-md-6 d-flex">
        <Label className="col-form-label form-control-plaintext">
          {labels.sex || "Gender"}
        </Label>
        <div className="form-control-plaintext">
          {user.gender || "N/A"}
        </div>
      </div>

      {/* Patient Age*/}
      <div className="col-md-6 d-flex">
        <Label className="col-form-label form-control-plaintext">
          {labels.age || "Age"}
        </Label>
        <div className="form-control-plaintext">
          {labels.ageValue || "N/A"}
        </div>
      </div>
    </div>
  );
};

export default PatientCommonInfo;
