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

function RelationshipFamily() {

  const [formData, setFormData] = useState({
     //Relationship & Family Status table  row data
        members: [
          {
            name: "",
            relation: "",
            age: "",
            living_status: "",
            physical_disorder: "",
          },
        ],
        disorder_desc: "",
    //Family History
    family_history_data: {
      mother_side: {
        grandmother: { alcohol: "No", drug: "No", psych: "No" },
        grandfather: { alcohol: "No", drug: "No", psych: "No" },
        mother: { alcohol: "No", drug: "No", psych: "No" },
        aunt: { alcohol: "No", drug: "No", psych: "No" },
        uncle: { alcohol: "No", drug: "No", psych: "No" },
        mother_side_if_any: "",
      },
      father_side: {
        grandmother: { alcohol: "No", drug: "No", psych: "No" },
        grandfather: { alcohol: "No", drug: "No", psych: "No" },
        father: { alcohol: "No", drug: "No", psych: "No" },
        aunt: { alcohol: "No", drug: "No", psych: "No" },
        uncle: { alcohol: "No", drug: "No", psych: "No" },
        father_side_if_any: "",
      },
    },
  })

  //Family History
  const handleFamilyHistoryChange = (side, relation, field, value) => {
    setFormData((prev) => ({
      ...prev,
      family_history_data: {
        ...prev.family_history_data,
        [side]: {
          ...prev.family_history_data[side],
          [relation]: {
            ...prev.family_history_data[side][relation],
            [field]: value,
          },
        },
      },
    }));
  }

  // Interference relation add table row handler
  const removeInterferenceRow = (index) => {
    const updated = [...formData.members];
    updated.splice(index, 1);
    setFormData((prev) => ({
      ...prev,
      members: updated,
    }));
  };

  const addInterferenceRow = () => {
    setFormData((prev) => ({
      ...prev,
      members: [
        ...prev.members,
        {
          name: "",
          relation: "",
          age: "",
          living_status: "",
          physical_disorder: "",
        },
      ],
    }));
  }
  return (
    <form>
      <h4 className="mb-4"> Relationship & Family Status / रिश्ते और पारिवारिक स्थिति</h4>
      <div className="row">
        <H5 className="mt-3 mb-3">{relationshipFamilyStatus}</H5>
        <div className="col-md-6">
          <Label htmlFor="marital_status">{relationshipStatus}</Label>
          <Input
            type="textarea"
            className="form-control"
            rows="3"
            name="relationship_status"
          //  value={formData.relationship_status}
          //  onChange={onChangeEventHandler}
          />
          {/* <Input
                     id="marital_status"
                     name="select"
                     type="select"
                     value={selectedRelationshipStatus}
                     onChange={(e) =>
                       setSelectedRelationshipStatus(e.target.value)
                     }
                     className="form-control form-control-primary btn-square"
                   >
                     <option value="">Select Marital Status</option>
                     {relationshipOptions.map((option) => (
                       <option key={option.id} value={option.id}>
                         {option.label}
                       </option>
                     ))}
                   </Input> */}

          {/* Show text input if 'Other' is selected
                   {selectedRelationshipStatus === "other" && (
                     <Input
                       type="textarea"
                       className="form-control mt-2"
                       placeholder="Please specify"
                       value={cutsomRelationshipText}
                       handleChange={(e) =>
                         setcustomRelationshipText(e.target.value)
                       }
                     />
                   )} */}
        </div>

        {/*Marriage Arrangement &Since वैवाहिक व्यवस्था और कब से*/}
        <div className="col-md-6">
          <FormGroup className="mb-0">
            <Label>{MarriageArrangement}</Label>
            <Input
              type="textarea"
              className="form-control"
              rows="3"
              name="marriage_arrangement"
            //  value={formData.marriage_arrangement}
            //  onChange={onChangeEventHandler}
            />
          </FormGroup>
        </div>

        {/*After marriage life or relationship Status*/}
        <div className="col-md-12">
          <FormGroup className="mb-0">
            <Label>{afterMerriageLife}</Label>
            <Input
              type="textarea"
              className="form-control"
              rows="3"
              name="post_marriage_status"
            //  value={formData.post_marriage_status}
            //  onChange={onChangeEventHandler}
            />
          </FormGroup>
        </div>

        
        <div className="col-md-12">
          <div className="table-responsive">
            <Table bordered>
              <thead>
                <tr>
                  <th scope="col">{nameisThere}</th>
                  <th scope="col">{relationisThere}</th>
                  <th scope="col">{relationisAge}</th>
                  <th scope="col">{livingStatus}</th>
                  <th scope="col">{AnyPhysicalDisorder}</th>
                  <th scope="col">{cheifAction}</th>
                </tr>
              </thead>
              <tbody>
                {formData.members.map((inter, index) => (
                  <tr key={index}>
                    <td>
                      <Input
                        type="text"
                        name="name"
                        value={inter.name}
                        //  onChange={(e) =>
                        //    handleMemberInputChange(index, e)
                        //  }
                        placeholder="Name / नाम "
                      />
                    </td>
                    <td>
                      <Input
                        type="text"
                        name="relation"
                        value={inter.relation}
                        //  onChange={(e) =>
                        //    handleMemberInputChange(index, e)
                        //  }
                        placeholder="Relation / संबंध "
                      />
                    </td>
                    <td>
                      <Input
                        type="text"
                        name="age"
                        value={inter.age}
                        //  onChange={(e) =>
                        //    handleMemberInputChange(index, e)
                        //  }
                        placeholder="age / आयु "
                      />
                    </td>
                    <td>
                      <Input
                        type="text"
                        name="living_status"
                        value={inter.living_status}
                        //  onChange={(e) =>
                        //    handleMemberInputChange(index, e)
                        //  }
                        placeholder="Living Status / रहने की स्तिथि"
                      />
                    </td>
                    <td>
                      <Input
                        type="text"
                        name="physical_disorder"
                        value={inter.physical_disorder}
                        //  onChange={(e) =>
                        //    handleMemberInputChange(index, e)
                        //  }
                        placeholder="Any physical Disorder & disease कोई भी शारीरिक विकार एवं रोग"
                      />
                    </td>
                    <td>
                      {index > 0 && (
                        <Button
                          type="button"
                          className="btn btn-danger" onClick={() => removeInterferenceRow(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <Button type="button" className="btn btn-secondary mt-4 mb-3" onClick={addInterferenceRow}>
              + Add More
            </Button>
          </div>

          <FormGroup className="mb-0">
            <Label>{ifAnyDisorder}</Label>
            <Input
              type="textarea"
              className="form-control"
              rows="3"
              name="disorder_desc"
            //  value={formData.disorder_desc}
            //  onChange={onChangeEventHandler}
            />
          </FormGroup>
        </div>

        {/*FAMILY HISTORY :Drinking, Substance abuse or psychiatric problem?  
   पारिवारिक इतिहास: शराब पीना, मादक पदार्थ का प्रयोग या मानसिक समस्या?*/}
        <div className="col-md-12 mb-4">
          <div className="table-responsive">
            <p className="mt-3 mb-3">{familyHistorySubstanceAbuse}</p>
            <Table bordered>
              <thead>
                <tr>
                  <th>Mother Side</th>
                  <th>Alcohol</th>
                  <th>Drug</th>
                  <th>Psych</th>
                  <th>Father Side</th>
                  <th>Alcohol</th>
                  <th>Drug</th>
                  <th>Psych</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Grandmother</td>
                  <td>
                    <Input
                      type="checkbox"
                      className="checkbox_animated"
                      checked={
                        formData.family_history_data.mother_side
                          .grandmother.alcohol === "Yes"
                      }
                      onChange={(e) =>
                        handleFamilyHistoryChange(
                          "mother_side",
                          "grandmother",
                          "alcohol",
                          e.target.checked ? "Yes" : "No"
                        )
                      }
                    />
                  </td>
                  <td>
                    <Input
                      type="checkbox"
                      className="checkbox_animated"
                      checked={
                        formData.family_history_data.mother_side
                          .grandmother.drug === "Yes"
                      }
                      onChange={(e) =>
                        handleFamilyHistoryChange(
                          "mother_side",
                          "grandmother",
                          "drug",
                          e.target.checked ? "Yes" : "No"
                        )
                      }
                    />
                  </td>
                  <td>
                    <Input
                      type="checkbox"
                      className="checkbox_animated"
                      checked={
                        formData.family_history_data.mother_side
                          .grandmother.psych === "Yes"
                      }
                      onChange={(e) =>
                        handleFamilyHistoryChange(
                          "mother_side",
                          "grandmother",
                          "psych",
                          e.target.checked ? "Yes" : "No"
                        )
                      }
                    />
                  </td>
                  <td>Grandmother</td>
                  <td>
                    <Input
                      type="checkbox"
                      className="checkbox_animated"
                      checked={
                        formData.family_history_data.father_side
                          .grandmother.alcohol === "Yes"
                      }
                      onChange={(e) =>
                        handleFamilyHistoryChange(
                          "father_side",
                          "grandmother",
                          "alcohol",
                          e.target.checked ? "Yes" : "No"
                        )
                      }
                    />
                  </td>
                  <td>
                    <Input
                      type="checkbox"
                      className="checkbox_animated"
                      checked={
                        formData.family_history_data.father_side
                          .grandmother.drug === "Yes"
                      }
                      onChange={(e) =>
                        handleFamilyHistoryChange(
                          "father_side",
                          "grandmother",
                          "drug",
                          e.target.checked ? "Yes" : "No"
                        )
                      }
                    />
                  </td>
                  <td>
                    <Input
                      type="checkbox"
                      className="checkbox_animated"
                      checked={
                        formData.family_history_data.father_side
                          .grandmother.psych === "Yes"
                      }
                      onChange={(e) =>
                        handleFamilyHistoryChange(
                          "father_side",
                          "grandmother",
                          "psych",
                          e.target.checked ? "Yes" : "No"
                        )
                      }
                    />
                  </td>
                </tr>
                <tr>
                  <td>Grandfather</td>
                  <td>
                    <Input
                      type="checkbox"
                      className="checkbox_animated"
                      checked={
                        formData.family_history_data.mother_side
                          .grandfather.alcohol === "Yes"
                      }
                      onChange={(e) =>
                        handleFamilyHistoryChange(
                          "mother_side",
                          "grandfather",
                          "alcohol",
                          e.target.checked ? "Yes" : "No"
                        )
                      }
                    />
                  </td>
                  <td>
                    <Input
                      type="checkbox"
                      className="checkbox_animated"
                      checked={
                        formData.family_history_data.mother_side
                          .grandfather.drug === "Yes"
                      }
                      onChange={(e) =>
                        handleFamilyHistoryChange(
                          "mother_side",
                          "grandfather",
                          "drug",
                          e.target.checked ? "Yes" : "No"
                        )
                      }
                    />
                  </td>
                  <td>
                    <Input
                      type="checkbox"
                      className="checkbox_animated"
                      checked={
                        formData.family_history_data.mother_side
                          .grandfather.psych === "Yes"
                      }
                      onChange={(e) =>
                        handleFamilyHistoryChange(
                          "mother_side",
                          "grandfather",
                          "psych",
                          e.target.checked ? "Yes" : "No"
                        )
                      }
                    />
                  </td>
                  <td>Grandfather</td>
                  <td>
                    <Input
                      type="checkbox"
                      className="checkbox_animated"
                      checked={
                        formData.family_history_data.father_side
                          .grandfather.alcohol === "Yes"
                      }
                      onChange={(e) =>
                        handleFamilyHistoryChange(
                          "father_side",
                          "grandfather",
                          "alcohol",
                          e.target.checked ? "Yes" : "No"
                        )
                      }
                    />
                  </td>
                  <td>
                    <Input
                      type="checkbox"
                      className="checkbox_animated"
                      checked={
                        formData.family_history_data.father_side
                          .grandfather.drug === "Yes"
                      }
                      onChange={(e) =>
                        handleFamilyHistoryChange(
                          "father_side",
                          "grandfather",
                          "drug",
                          e.target.checked ? "Yes" : "No"
                        )
                      }
                    />
                  </td>
                  <td>
                    <Input
                      type="checkbox"
                      className="checkbox_animated"
                      checked={
                        formData.family_history_data.father_side
                          .grandfather.psych === "Yes"
                      }
                      onChange={(e) =>
                        handleFamilyHistoryChange(
                          "father_side",
                          "grandfather",
                          "psych",
                          e.target.checked ? "Yes" : "No"
                        )
                      }
                    />
                  </td>
                </tr>
                <tr>
                  <td>Mother</td>
                  <td>
                    <Input
                      type="checkbox"
                      className="checkbox_animated"
                      checked={
                        formData.family_history_data.mother_side.mother
                          .alcohol === "Yes"
                      }
                      onChange={(e) =>
                        handleFamilyHistoryChange(
                          "mother_side",
                          "mother",
                          "alcohol",
                          e.target.checked ? "Yes" : "No"
                        )
                      }
                    />
                  </td>
                  <td>
                    <Input
                      type="checkbox"
                      className="checkbox_animated"
                      checked={
                        formData.family_history_data.mother_side.mother
                          .drug === "Yes"
                      }
                      onChange={(e) =>
                        handleFamilyHistoryChange(
                          "mother_side",
                          "mother",
                          "drug",
                          e.target.checked ? "Yes" : "No"
                        )
                      }
                    />
                  </td>
                  <td>
                    <Input
                      type="checkbox"
                      className="checkbox_animated"
                      checked={
                        formData.family_history_data.mother_side.mother
                          .psych === "Yes"
                      }
                      onChange={(e) =>
                        handleFamilyHistoryChange(
                          "mother_side",
                          "mother",
                          "psych",
                          e.target.checked ? "Yes" : "No"
                        )
                      }
                    />
                  </td>
                  <td>Father</td>
                  <td>
                    <Input
                      type="checkbox"
                      className="checkbox_animated"
                      checked={
                        formData.family_history_data.father_side.father
                          .alcohol === "Yes"
                      }
                      onChange={(e) =>
                        handleFamilyHistoryChange(
                          "father_side",
                          "father",
                          "alcohol",
                          e.target.checked ? "Yes" : "No"
                        )
                      }
                    />
                  </td>
                  <td>
                    <Input
                      type="checkbox"
                      className="checkbox_animated"
                      checked={
                        formData.family_history_data.father_side.father
                          .drug === "Yes"
                      }
                      onChange={(e) =>
                        handleFamilyHistoryChange(
                          "father_side",
                          "father",
                          "drug",
                          e.target.checked ? "Yes" : "No"
                        )
                      }
                    />
                  </td>
                  <td>
                    <Input
                      type="checkbox"
                      className="checkbox_animated"
                      checked={
                        formData.family_history_data.father_side.father
                          .psych === "Yes"
                      }
                      onChange={(e) =>
                        handleFamilyHistoryChange(
                          "father_side",
                          "father",
                          "psych",
                          e.target.checked ? "Yes" : "No"
                        )
                      }
                    />
                  </td>
                </tr>
                <tr>
                  <td>Aunt / मामी</td>
                  <td>
                    <Input
                      type="checkbox"
                      className="checkbox_animated"
                      checked={
                        formData.family_history_data.mother_side.aunt
                          .alcohol === "Yes"
                      }
                      onChange={(e) =>
                        handleFamilyHistoryChange(
                          "mother_side",
                          "aunt",
                          "alcohol",
                          e.target.checked ? "Yes" : "No"
                        )
                      }
                    />
                  </td>
                  <td>
                    <Input
                      type="checkbox"
                      className="checkbox_animated"
                      checked={
                        formData.family_history_data.mother_side.aunt
                          .drug === "Yes"
                      }
                      onChange={(e) =>
                        handleFamilyHistoryChange(
                          "mother_side",
                          "aunt",
                          "drug",
                          e.target.checked ? "Yes" : "No"
                        )
                      }
                    />
                  </td>
                  <td>
                    <Input
                      type="checkbox"
                      className="checkbox_animated"
                      checked={
                        formData.family_history_data.mother_side.aunt
                          .psych === "Yes"
                      }
                      onChange={(e) =>
                        handleFamilyHistoryChange(
                          "mother_side",
                          "aunt",
                          "psych",
                          e.target.checked ? "Yes" : "No"
                        )
                      }
                    />
                  </td>
                  <td>Aunt / चाची</td>
                  <td>
                    <Input
                      type="checkbox"
                      className="checkbox_animated"
                      checked={
                        formData.family_history_data.father_side.aunt
                          .alcohol === "Yes"
                      }
                      onChange={(e) =>
                        handleFamilyHistoryChange(
                          "father_side",
                          "aunt",
                          "alcohol",
                          e.target.checked ? "Yes" : "No"
                        )
                      }
                    />
                  </td>
                  <td>
                    <Input
                      type="checkbox"
                      className="checkbox_animated"
                      checked={
                        formData.family_history_data.father_side.aunt
                          .drug === "Yes"
                      }
                      onChange={(e) =>
                        handleFamilyHistoryChange(
                          "father_side",
                          "aunt",
                          "drug",
                          e.target.checked ? "Yes" : "No"
                        )
                      }
                    />
                  </td>
                  <td>
                    <Input
                      type="checkbox"
                      className="checkbox_animated"
                      checked={
                        formData.family_history_data.father_side.aunt
                          .psych === "Yes"
                      }
                      onChange={(e) =>
                        handleFamilyHistoryChange(
                          "father_side",
                          "aunt",
                          "psych",
                          e.target.checked ? "Yes" : "No"
                        )
                      }
                    />
                  </td>
                </tr>
                <tr>
                  <td>Uncle / मामा</td>
                  <td>
                    <Input
                      type="checkbox"
                      className="checkbox_animated"
                      checked={
                        formData.family_history_data.mother_side.uncle
                          .alcohol === "Yes"
                      }
                      onChange={(e) =>
                        handleFamilyHistoryChange(
                          "mother_side",
                          "uncle",
                          "alcohol",
                          e.target.checked ? "Yes" : "No"
                        )
                      }
                    />
                  </td>
                  <td>
                    <Input
                      type="checkbox"
                      className="checkbox_animated"
                      checked={
                        formData.family_history_data.mother_side.uncle
                          .drug === "Yes"
                      }
                      onChange={(e) =>
                        handleFamilyHistoryChange(
                          "mother_side",
                          "uncle",
                          "drug",
                          e.target.checked ? "Yes" : "No"
                        )
                      }
                    />
                  </td>
                  <td>
                    <Input
                      type="checkbox"
                      className="checkbox_animated"
                      checked={
                        formData.family_history_data.mother_side.uncle
                          .psych === "Yes"
                      }
                      onChange={(e) =>
                        handleFamilyHistoryChange(
                          "mother_side",
                          "uncle",
                          "psych",
                          e.target.checked ? "Yes" : "No"
                        )
                      }
                    />
                  </td>
                  <td>Uncle / चाचा</td>
                  <td>
                    <Input
                      type="checkbox"
                      className="checkbox_animated"
                      checked={
                        formData.family_history_data.father_side.uncle
                          .alcohol === "Yes"
                      }
                      onChange={(e) =>
                        handleFamilyHistoryChange(
                          "father_side",
                          "uncle",
                          "alcohol",
                          e.target.checked ? "Yes" : "No"
                        )
                      }
                    />
                  </td>
                  <td>
                    <Input
                      type="checkbox"
                      className="checkbox_animated"
                      checked={
                        formData.family_history_data.father_side.uncle
                          .drug === "Yes"
                      }
                      onChange={(e) =>
                        handleFamilyHistoryChange(
                          "father_side",
                          "uncle",
                          "drug",
                          e.target.checked ? "Yes" : "No"
                        )
                      }
                    />
                  </td>
                  <td>
                    <Input
                      type="checkbox"
                      className="checkbox_animated"
                      checked={
                        formData.family_history_data.father_side.uncle
                          .psych === "Yes"
                      }
                      onChange={(e) =>
                        handleFamilyHistoryChange(
                          "father_side",
                          "uncle",
                          "psych",
                          e.target.checked ? "Yes" : "No"
                        )
                      }
                    />
                  </td>
                </tr>
                <tr>
                  {/* Mother side */}
                  <td>{anyOtherPlsMention}</td>
                  <td colSpan={3}>
                    <Input
                      type="text"
                      placeholder="If any from mother side"
                      name="mother_side_if_any"
                      value={
                        formData.family_history_data.mother_side
                          .mother_side_if_any
                      }
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          family_history_data: {
                            ...prev.family_history_data,
                            mother_side: {
                              ...prev.family_history_data.mother_side,
                              mother_side_if_any: e.target.value,
                            },
                          },
                        }))
                      }
                    />
                  </td>
                  {/* Father side */}
                  <td>{anyOtherPlsMention}</td>
                  <td colSpan={3}>
                    <Input
                      type="text"
                      placeholder="If any from father side"
                      name="father_side_if_any"
                      value={
                        formData.family_history_data.father_side
                          .father_side_if_any
                      }
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          family_history_data: {
                            ...prev.family_history_data,
                            father_side: {
                              ...prev.family_history_data.father_side,
                              father_side_if_any: e.target.value,
                            },
                          },
                        }))
                      }
                    />
                  </td>
                </tr>
              </tbody>
            </Table>
          </div>
        </div>

        {/*Current Status? वर्तमान स्थिति?*/}
        <div className="col-md-12 mt-3">
          <Label>{anyOtherPlsMention1}</Label>
          <Input
            type="textarea"
            className="form-control"
            rows="3"
            name="psych_problem_desc"
          //  value={formData.psych_problem_desc}
          //  onChange={onChangeEventHandler}
          />
        </div>

        {/*Current Status? वर्तमान स्थिति?*/}

        <div className="col-md-12 mt-3 mb-3">
          <Label>{currentStatus}</Label>
          {/* <Input
                     className="form-control form-control-primary btn-square"
                     name="select"
                     type="select"
                     onChange={(e) => setcurrentStatusData(e.target.value)}
                   >
                     <option value="">{currentStatus}</option>
                     {currentstatusObject.map((status, index) => (
                       <option key={index} value={status.value}>
                         {status.label}
                       </option>
                     ))}
                   </Input>
                   {currentStatusData === "Other" && (
                     <Input
                       type="textarea"
                       className="form-control mt-2"
                       rows="3"
                       placeholder="Please specify"
                       value={customeCurrentStatus}
                       onChange={(e) => setcustomeCurrentStatus(e.target.value)}
                     />
                   )} */}
          <Input
            type="text"
            name="current_status"
            className="form-control"
          //  value={formData.current_status}
          //  onChange={onChangeEventHandler}
          />
        </div>

        <div className="col-md-12">
          <FormGroup className="mb-0">
            <Label>{howWasBonding}</Label>
            <Input
              type="textarea"
              className="form-control"
              rows="3"
              name="relationship_with_user"
            //  value={formData.relationship_with_user}
            //  onChange={onChangeEventHandler}
            />
          </FormGroup>
        </div>

        <div className="col-md-12">
          <FormGroup className="mb-0">
            <Label>{familyBehaviorPatient}</Label>
            <Input
              type="textarea"
              className="form-control"
              rows="3"
              name="family_behavior"
            //  value={formData.family_behavior}
            //  onChange={onChangeEventHandler}
            />
          </FormGroup>
        </div>

        <div className="col-md-12">
          <FormGroup className="mb-0">
            <Label>{monitoringFamily}</Label>
            <Input
              type="textarea"
              className="form-control"
              rows="3"
              name="head_of_family"
            //  value={formData.head_of_family}
            //  onChange={onChangeEventHandler}
            />
          </FormGroup>
        </div>

        <div className="col-md-12">
          <FormGroup className="mb-0">
            <Label>{ralationshipFamilyMember}</Label>
            <Input
              type="textarea"
              className="form-control"
              rows="3"
              name="relationships_with_family"
            //  value={formData.relationships_with_family}
            //  onChange={onChangeEventHandler}
            />
          </FormGroup>
        </div>

        

        {/* Academics Occupational Details End */}

        

        

        
        {/* Submit */}
        <div className="col-md-12 mb-4">
<Button color="primary" type="submit">
  Submit Relationship & Family Status / रिश्ते और पारिवारिक स्थिति
</Button>

          {/* <Button color="primary" type="submit" disabled={isLoading}>
            {isLoading ? (
              <span
                className="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              ></span>
            ) : (
              "Submit PFA"
            )}
          </Button> */}
        </div>
      </div>
    </form>
  )
}

export default RelationshipFamily
