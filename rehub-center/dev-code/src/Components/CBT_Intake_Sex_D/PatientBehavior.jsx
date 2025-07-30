import { React, useState } from 'react';
import {
  FormGroup,
  Label,
  Input,
  Button,
  Table,
} from "reactstrap";
import { H5 } from "../../AbstractElements";

const attitudeOptions = [
  "Cooperative / सहयोगी", "Confident / आत्मविश्वासी", "Interested / दिलचस्पी रखने वाला",
  "Attentive / चौकस", "Frank / स्पष्टवादी", "Playful / चंचल",
  "Ingratiating / कृपालु", "Suspicious / संदेह", "Seductive / मोहक",
  "Defensive / रक्षात्मक", "Secretive / गुप्त", "Uncooperative / असहयोगी",
  "Evasive / टालमटोल करने वाला", "Inhibited / संकोची", "Shy / शर्मीला",
  "Childish / बचकाना", "Guarded / सतर्क", "Attention-seeking / ध्यान आकर्षित करने वाला",
  "Exhibitionistic / प्रदर्शनकारी", "Hostile / शत्रुतापूर्ण"
];

const silentBehaviorOptions = [
  "Anger / क्रोध", "Perfectionism / पूर्णतावाद", "Dishonesty / बेईमानी",
  "Jealousy / ईर्ष्या", "Self-pity / आत्म-दया", "Self-justification / आत्म-औचित्य",
  "Codependence / सह-निर्भरता", "Resentment / नाराजगी", "Egotism / अहंकारवाद",
  "Defensiveness / रक्षात्मकता", "Impatience / अधीरता", "Fear / डर",
  "Selfishness / स्वार्थ", "Close mindedness / संकीर्ण मानसिकता", "Blaming / दोष लगाना",
  "Denial / अस्वीकार"
];


const questions = [
  {
    en: "Do ever use Substance alone?",
    hi: "क्या अकेले मादक पदार्थ उपयोग करते हैं?"
  },
  {
    en: "Moody personality?",
    hi: "मिज़ाजी स्वभाव?"
  },
  {
    en: "Always worried?",
    hi: "हमेशा चिंतित रहते हैं?"
  },
  {
    en: "Always Sad?",
    hi: "हमेशा उदास रहते हैं?"
  },
  {
    en: "Lack of confidence?",
    hi: "आत्मविश्वास की कमी?"
  },
  {
    en: "Stubborn nature?",
    hi: "हठी स्वभाव?"
  },
  {
    en: "Instant and too much aggressive?",
    hi: "तुरंत और अधिक आक्रामक?"
  },
  {
    en: "Uses Slang language? (Bad words)",
    hi: "गाली गलौज करता है?"
  },
  {
    en: "Disrespects parents?",
    hi: "माता-पिता का अनादर करता है?"
  },
  {
    en: "Vandalizes the house?",
    hi: "घर का नुकसान करता है?"
  },
  {
    en: "Does fight at home? (with mother, wife, children, brother, sister)",
    hi: "घर पर झगड़ा करता है? (माता, पत्नी, बच्चे, भाई, बहन के साथ)"
  }
  // Add more if needed
];


const PatientBehavior = () => {

  const [behavior, setBehavior] = useState('');
  const [mentalStage, setMentalStage] = useState('');

  const [formData, setFormData] = useState({
    lifeAim: "",
    mentalStatus: "",
    dischargePlan: "",
    familyExpectations: "",
    attitude: [],
    silentBehaviors: [],
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (field, option) => {
    setFormData((prevState) => {
      const selected = prevState[field];
      const isSelected = selected.includes(option);
      const updated = isSelected
        ? selected.filter((item) => item !== option)
        : [...selected, option];
      return { ...prevState, [field]: updated };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Data:", formData);
  };

  return (
    <form className="container mt-4 mb-5" onSubmit={handleSubmit}>
      <h2 className="mb-4">Patient Behavior / रोगी का व्यवहार</h2>

      <div className="mb-3">
        <label htmlFor="lifeAim" className="form-label">
          What is the most important thing in life? (जीवन में सबसे महत्वपूर्ण चीज़ क्या है?)
        </label>
        <input
          type="text"
          className="form-control"
          id="lifeAim"
          name="lifeAim"
          value={formData.lifeAim}
          onChange={handleInputChange}
        />
      </div>

      <div className="mb-3">
        <label htmlFor="mentalStatus" className="form-label">
          Current Mental Status here in center (वर्तमान मानसिक स्थिति यहाँ केंद्र में)
        </label>
        <input
          type="text"
          className="form-control"
          id="mentalStatus"
          name="mentalStatus"
          value={formData.mentalStatus}
          onChange={handleInputChange}
        />
      </div>

      <div className="mb-3">
        <label htmlFor="dischargePlan" className="form-label">
          What is planned after discharge from center (डिस्चार्ज के बाद क्या सोचता है?)
        </label>
        <input
          type="text"
          className="form-control"
          id="dischargePlan"
          name="dischargePlan"
          value={formData.dischargePlan}
          onChange={handleInputChange}
        />
      </div>

      <div className="mb-4">
        <label htmlFor="familyExpectations" className="form-label">
          What Expectations do you have for family after discharge? (छुट्टी के बाद परिवार से आपकी क्या उम्मीदें हैं?)
        </label>
        <input
          type="text"
          className="form-control"
          id="familyExpectations"
          name="familyExpectations"
          value={formData.familyExpectations}
          onChange={handleInputChange}
        />
      </div>

      <fieldset className="mb-4 border rounded p-3">
        <legend className="fs-5 fw-bold">ATTITUDE DURING INTERVIEW / साक्षात्कार के दौरान रवैया</legend>
        <div className="row">
          {attitudeOptions.map((option, idx) => (
            <div className="col-md-3 col-sm-6 mb-2" key={idx}>
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input checkbox_animated"
                  id={`attitude-${idx}`}
                  checked={formData.attitude.includes(option)}
                  onChange={() => handleCheckboxChange("attitude", option)}
                />
                <label className="form-check-label" htmlFor={`attitude-${idx}`}>
                  {option}
                </label>
              </div>
            </div>
          ))}
        </div>
      </fieldset>


      <fieldset className="mb-4 border rounded p-3">
        <legend className="fs-5 fw-bold">Silent Behavior Observations / रोगी मौन का व्यवहार अवलोकन</legend>
        <div className="row">
          {silentBehaviorOptions.map((option, idx) => (
            <div className="col-md-3 col-sm-6 mb-2" key={idx}>
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input checkbox_animated"
                  id={`silent-${idx}`}
                  checked={formData.silentBehaviors.includes(option)}
                  onChange={() => handleCheckboxChange("silentBehaviors", option)}
                />
                <label className="form-check-label" htmlFor={`silent-${idx}`}>
                  {option}
                </label>
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      <div className="container mt-4">
        <h5 className="mt-4 mb-3">
          Patient's Mental Stage of Patient as per Interviewer (Tick on Correct) <br />
          साक्षात्कारकर्ता के अनुसार रोगी की मानसिक अवस्था (सही पर टिक करें)
        </h5>
        <table className="table table-bordered text-center">
          <thead className="table-light">
            <tr>
              <th>Pre Contemplation <br />पूर्वचिंतन</th>
              <th>Contemplation <br />चिंतन</th>
              <th>Preparation <br />तैयारी</th>
              <th>Action <br />कार्यवाही</th>
              <th>Maintenance <br />रखरखाव</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {['Pre Contemplation', 'Contemplation', 'Preparation', 'Action', 'Maintenance'].map((stage) => (
                <td key={stage}>
                  <input
                    type="checkbox"
                    className='checkbox_animated'
                    name="mentalStage"
                    checked={mentalStage === stage}
                    onChange={() => setMentalStage(stage)}
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <h4 className="mb-3 mt-4">Patient behavior (According to him) / रोगी का व्यवहार (उनके अनुसार)</h4>

      <div className="table-responsive mb-4">
        <table className="table table-bordered align-middle">
          <thead className="table-light">
            <tr>
              <th style={{ width: "70%" }}>Patient behavior (According to him)<br />रोगी का व्यवहार (उनके अनुसार)</th>
              <th className="text-center" style={{ width: "30%" }}>Yes / No <br />हां / नहीं</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q, index) => (
              <tr key={index}>
                <td>
                  <strong>{q.en}</strong>
                  <br />
                  <span className="text-muted">{q.hi}</span>
                </td>
                <td className="text-center d-flex">
                  <div className="form-check form-check-inline radio radio-primary d-flex gap-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name={`q${index}`}
                      id={`q${index}Yes`}
                      value="Yes"
                    />
                    <label className="form-check-label" htmlFor={`q${index}Yes`}>Yes / हां</label>
                  </div>
                  <div className="form-check form-check-inline radio radio-primary d-flex gap-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name={`q${index}`}
                      id={`q${index}No`}
                      value="No"
                    />
                    <label className="form-check-label" htmlFor={`q${index}No`}>No / नहीं</label>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

     

      <button type="submit" className="btn btn-primary">Submit</button>
    </form>
  );
};

export default PatientBehavior;
