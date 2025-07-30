import { React, useState } from 'react';
import {
  FormGroup,
  Label,
  Input,
  Button,
  Table,
} from "reactstrap";
import { H5 } from "../../AbstractElements";
import {
  yes,
  no,
  consent,
  name,
  relationship,
  signature,
  prepared,
  cheifAction,
  relationshipFamilyStatus,
  relationshipStatus,
  MarriageArrangement,
  afterMerriageLife,
  isThereInterference,
  nameisThere,
  relationisThere,
  livingStatus,
  AnyPhysicalDisorder,
  familyHistorySubstanceAbuse,
  anyOtherPlsMention,
  ifAnyDisorder,
  anyOtherPlsMention1,
  currentStatus,
  howWasBonding,
  familyBehaviorPatient,
  monitoringFamily,
  ralationshipFamilyMember,
  childhood,
  birthConditions,
  parentingHistory,
  wasThereAnyConflict,
  socialityWhere,
  highRiskBehavior,
  whatWasImpect,
  hasAnyoneEverAbused,
  academicsOccupationalDetails,
  EducationStatus,
  OcuStatus,
  ifDropout,
  studyWorkDetails,
  Hobbies1,
  extraSkills,
  achievemntInLife,
  socialBehavior,
  socialBehavior1,
  withWhomSpendFreeTime,
  howManyFriends,
  howMuchDependent,
  whoClosedWellWisher,
  legalHistory,
  domesticViolence,
  reasonBehindDomesticViolence,
  drugStatus,
  ifThereIsAnyCriminalCase,
  specificCaseDetails,
  currentCaseStatus,
  ifWentToJail,
  patientBeh,
  whatIsTheMostImportantThing,
  lifeAim,
  patientBehavior,
  patientBehaviorFormattedList,
  relationisAge,
  friendSocialStatus,
  tableNumber,
} from "../../Constant";

function Legal() {
  return (
    <form>
      {/* Legal History Start */}
        {/* Legal History / लीगल इतिहास */}
        <H5 className="mt-3 mb-3">{legalHistory}</H5>
        <div className="col-md-12">
          <FormGroup className="mb-0">
            <Label>{domesticViolence}</Label>
            <Input
              type="textarea"
              className="form-control"
              rows="3"
              name="domestic_violence"
            //  value={formData.legal_history.domestic_violence}
            //  onChange={legalHistoryHandler}
            />
          </FormGroup>
        </div>

        <div className="col-md-12">
          <FormGroup className="mb-0">
            <Label>{reasonBehindDomesticViolence}</Label>
            <Input
              type="textarea"
              className="form-control"
              rows="3"
              name="violence_reason"
            //  value={formData.legal_history.violence_reason}
            //  onChange={legalHistoryHandler}
            />
          </FormGroup>
        </div>

        <div className="col-md-12">
          <FormGroup className="mb-0">
            <Label>{drugStatus}</Label>
            <Input
              type="textarea"
              className="form-control"
              rows="3"
              name="drug_status_qty"
            //  value={formData.legal_history.drug_status_qty}
            //  onChange={legalHistoryHandler}
            />
          </FormGroup>
        </div>

        <div className="col-md-12">
          <FormGroup className="mb-0">
            <Label>{ifThereIsAnyCriminalCase}</Label>
            <Input
              type="textarea"
              className="form-control"
              rows="3"
              name="criminal_case"
            //  value={formData.legal_history.criminal_case}
            //  onChange={legalHistoryHandler}
            />
          </FormGroup>
        </div>

        <div className="col-md-12">
          <FormGroup className="mb-0">
            <Label>{specificCaseDetails}</Label>
            <Input
              type="textarea"
              className="form-control"
              rows="3"
              name="case_details"
            //  value={formData.legal_history.case_details}
            //  onChange={legalHistoryHandler}
            />
          </FormGroup>
        </div>

        <div className="col-md-12">
          <FormGroup className="mb-0">
            <Label>{currentCaseStatus}</Label>
            <Input
              type="textarea"
              className="form-control"
              rows="3"
              name="case_status"
            //  value={formData.legal_history.case_status}
            //  onChange={legalHistoryHandler}
            />
          </FormGroup>
        </div>

        <div className="col-md-12">
          <FormGroup className="mb-0">
            <Label>{ifWentToJail}</Label>
            <Input
              type="textarea"
              className="form-control"
              rows="3"
              name="jail_duration"
            //  value={formData.legal_history.jail_duration}
            //  onChange={legalHistoryHandler}
            />
          </FormGroup>
        </div>

        {/* Legal History End */}
    </form>
  )
}

export default Legal
