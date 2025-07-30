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

function SocialBehavior() {
  return (
    <form>
      {/* Social Behavior Start */}
              {/* Social Behavior / सामाजिक व्यवहार */}
              <H5 className="mt-3 mb-3">{socialBehavior}</H5>
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{socialBehavior1}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="social_behavior"
                  //  value={formData.social_behavior.social_behavior}
                  //  onChange={socialBehaviorHandler}
                  />
                </FormGroup>
              </div>
      
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{withWhomSpendFreeTime}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="with_whom_spend_time"
                  //  value={formData.social_behavior.with_whom_spend_time}
                  //  onChange={socialBehaviorHandler}
                  />
                </FormGroup>
              </div>
      
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{howManyFriends}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="number_of_friends"
                  //  value={formData.social_behavior.number_of_friends}
                  //  onChange={socialBehaviorHandler}
                  />
                </FormGroup>
              </div>
      
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{friendSocialStatus}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="friends_social_status"
                  //  value={formData.social_behavior.friends_social_status}
                  //  onChange={socialBehaviorHandler}
                  />
                </FormGroup>
              </div>
      
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{howMuchDependent}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="substance_dependent_friends"
                  //  value={formData.social_behavior.substance_dependent_friends}
                  //  onChange={socialBehaviorHandler}
                  />
                </FormGroup>
              </div>
      
              <div className="col-md-12">
                <FormGroup className="mb-0">
                  <Label>{whoClosedWellWisher}</Label>
                  <Input
                    type="textarea"
                    className="form-control"
                    rows="3"
                    name="well_wisher_person"
                  //  value={formData.social_behavior.well_wisher_person}
                  //  onChange={socialBehaviorHandler}
                  />
                </FormGroup>
              </div>
      
              {/* Social Behavior End */}
    </form>
  )
}

export default SocialBehavior
