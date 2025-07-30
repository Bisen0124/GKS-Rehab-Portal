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


function Childhood() {
  return (
    <form>
      {/* Childhood /बचपन */}

      <H5 className="mt-3 mb-3">{childhood}</H5>
        <div className="col-md-12">
          <FormGroup className="mb-0">
            <Label>{parentingHistory}</Label>
            <Input
              type="textarea"
              className="form-control"
              rows="3"
              name="birth_conditions"
            //  value={formData.childhood_history.birth_conditions}
            //  onChange={childhoodHandleChange}
            />
          </FormGroup>
        </div>

        <div className="col-md-12">
          <FormGroup className="mb-0">
            <Label>If there was a dispute in the family in childhood  (mom-dad, uncle -aunt, any grandparents) describe? /
            बचपन में परिवार में कोई विवाद हुआ हो (माँ-पिताजी, चाचा-चाची, कोई दादा-दादी) तो उसका वर्णन करें?
            </Label>
            <Input
              type="textarea"
              className="form-control"
              rows="3"
              name="parenting_history"
            //  value={formData.childhood_history.parenting_history}
            //  onChange={childhoodHandleChange}
            />
          </FormGroup>
        </div>

        {/*Sociality  where born & Living?
   सामाजिकता जहां पैदा हुआ और रहा  है?*/}
        <div className="col-md-12">
          <Label htmlFor="birthPlace">{socialityWhere}</Label>
          <Input
            type="textarea"
            id="birthPlace"
            name="sociality_living"
            //  value={formData.childhood_history.sociality_living}
            //  onChange={childhoodHandleChange}
            placeholder="Enter birth place..."
          />

          <br />
          <Label htmlFor="birthPlace">{highRiskBehavior}</Label>
          <Input
            type="textarea"
            id="currentLocation"
            name="high_risk_behavior"
            //  value={formData.childhood_history.high_risk_behavior}
            //  onChange={childhoodHandleChange}
            placeholder="Enter current location..."
          />
        </div>

        <div className="col-md-12 mt-3 mb-3">
          <FormGroup className="mb-0">
            <Label>{whatWasImpect}</Label>
            <Input
              type="textarea"
              className="form-control"
              rows="3"
              name="impact_of_movies"
            //  value={formData.childhood_history.impact_of_movies}
            //  onChange={childhoodHandleChange}
            />
          </FormGroup>
        </div>

        <div className="col-md-12 mt-3 mb-3">
          <FormGroup className="mb-0">
            <Label>Has anyone ever abused you? 1.Emotionally? 2.Physically? 3.Sexually?
            क्या कभी किसी ने आपके साथ दुर्व्यवहार किया है? / 1.भावनात्मक रूप से? / 2.शारीरिक रूप से? / 3.यौन रूप से?</Label>
            <Input
              type="textarea"
              className="form-control"
              rows="3"
              name="impact_of_movies"
            //  value={formData.childhood_history.impact_of_movies}
            //  onChange={childhoodHandleChange}
            />
          </FormGroup>
        </div>

        <div className="col-md-12">
          <FormGroup className="mb-0">
            <Label>{hasAnyoneEverAbused}</Label>
            <Input
              type="textarea"
              className="form-control"
              rows="3"
              name="abuse_history"
            //  value={formData.childhood_history.abuse_history}
            //  onChange={childhoodHandleChange}
            />
          </FormGroup>
        </div>

        {/* Academics Occupational Details Start */}

        {/*Academics Occupational Details/ शैक्षणिक व्यावसायिक विवरण*/}
        <H5 className="mt-3 mb-3">{academicsOccupationalDetails}</H5>
        <div className="col-md-6">
          <Label htmlFor="educationStatus">{EducationStatus}</Label>
          {/* <Input
                     id="educationStatus"
                     className="form-control form-control-primary btn-square"
                     name="select"
                     type="select"
                     value={educationStatus.selectedStatus}
                     onChange={handleEducationalSelectChange}
                   >
                     <option value="">-- Select --</option>
                     {educationOptions.map((option, index) => (
                       <option key={index} value={option}>
                         {option}
                       </option>
                     ))}
                   </Input>
                   {educationStatus.selectedStatus === "Other / अन्य" && (
                     <div>
                       <Label htmlFor="otherEducation">
                         Specify Other / अन्य बताएं:
                       </Label>
                       <Input
                         type="textarea"
                         id="otherEducation"
                         value={educationStatus.otherEducation}
                         onChange={handleEducationalOtherEducationChange}
                         placeholder="Enter education status"
                       />
                     </div>
                   )} */}
          <Input
            type="textarea"
            className="form-control"
            rows="3"
            name="education_status"
          //  value={formData.education_employment.education_status}
          //  onChange={academicOccupationHandler}
          />
        </div>

        {/*Occupational status? कार्य की स्थिति?*/}
        <div className="col-md-6">
          <Label htmlFor="occupation">{OcuStatus}</Label>
          {/* <Input
                     id="occupation"
                     className="form-control form-control-primary btn-square"
                     name="select"
                     type="select"
                     value={OccupationalStatus.selectedStatus}
                     onChange={handleOccupationalSelectChange}
                   >
                     <option value="">-- Select --</option>
                     {occupationOptions.map((option, index) => (
                       <option key={index} value={option}>
                         {option}
                       </option>
                     ))}
                   </Input>
                   {OccupationalStatus.selectedStatus === "Other / अन्य" && (
                     <div>
                       <Label htmlFor="other Occupational">
                         Specify Other / अन्य बताएं:
                       </Label>
                       <Input
                         type="textarea"
                         id="otherEducation"
                         value={OccupationalStatus.otherOccupational}
                         onChange={handleOccupationalOtherEducationChange}
                         placeholder="Enter occupational status"
                       />
                     </div>
                   )} */}
          <Input
            type="textarea"
            className="form-control"
            rows="3"
            name="occupation_status"
          //  value={formData.education_employment.occupation_status}
          //  onChange={academicOccupationHandler}
          />
        </div>

        {/*If dropout what is the reason यदि ड्रॉपआउट हुआ तो क्या कारण है?*/}
        <div className="col-md-12 mt-3">
          <FormGroup className="mb-0">
            <Label>{ifDropout}</Label>
            <Input
              type="textarea"
              className="form-control"
              rows="3"
              name="dropout_reason"
            //  value={formData.education_employment.dropout_reason}
            //  onChange={academicOccupationHandler}
            />
          </FormGroup>
        </div>

        {/*Study/Work Details: (what was job frequency)  /अध्ययन/कार्य विवरण: (नौकरी की फ्रीक्वेंसी क्या थी?)*/}
        <div className="col-md-12">
          <FormGroup className="mb-0">
            <Label>{studyWorkDetails}</Label>
            <Input
              type="textarea"
              className="form-control"
              rows="3"
              name="work_details"
            //  value={formData.education_employment.work_details}
            //  onChange={academicOccupationHandler}
            />
          </FormGroup>
        </div>

        {/*Hobbies : शौक:*/}
        <div className="col-md-12">
          <FormGroup className="mb-0">
            <Label>{Hobbies1}</Label>
            <Input
              type="textarea"
              className="form-control"
              rows="3"
              name="hobbies"
            //  value={formData.education_employment.hobbies}
            //  onChange={academicOccupationHandler}
            />
          </FormGroup>
        </div>

        {/*Extra skills if any: अतिरिक्त कौशल कोई हो:*/}
        <div className="col-md-12">
          <FormGroup className="mb-0">
            <Label>{extraSkills}</Label>
            <Input
              type="textarea"
              className="form-control"
              rows="3"
              name="skills"
            //  value={formData.education_employment.skills}
            //  onChange={academicOccupationHandler}
            />
          </FormGroup>
        </div>

        {/*Achievement in life: जीवन में कोई उपलब्धि:
                  */}
        <div className="col-md-12">
          <FormGroup className="mb-0">
            <Label>{achievemntInLife}</Label>
            <Input
              type="textarea"
              className="form-control"
              rows="3"
              name="achievements"
            //  value={formData.education_employment.achievements}
            //  onChange={academicOccupationHandler}
            />
          </FormGroup>
        </div>

        <div className="col-md-12">
          <FormGroup className="mb-0">
            <Label>Why are you here? / आप यहाँ क्यों हैं?</Label>
            <Input
              type="textarea"
              className="form-control"
              rows="3"
              name="achievements"
            //  value={formData.education_employment.achievements}
            //  onChange={academicOccupationHandler}
            />
          </FormGroup>
        </div>


        <div className="col-md-12">
          <FormGroup className="mb-0">
            <Label>Why family sent ? / परिवार ने क्यों भेजा?</Label>
            <Input
              type="textarea"
              className="form-control"
              rows="3"
              name="achievements"
            //  value={formData.education_employment.achievements}
            //  onChange={academicOccupationHandler}
            />
          </FormGroup>
        </div>
    </form>
  )
}

export default Childhood
