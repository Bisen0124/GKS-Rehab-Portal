import {React,useState} from 'react';
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

import { Btn, H5, Breadcrumbs, H4 } from "../../AbstractElements";

function SUDBrief() {

{/*  Prior Treatment for substance use Dependency / पदार्थ के उपयोग पर निर्भरता के लिए पूर्व उपचार start */}
  const [rows, setRows] = useState([
    { year: '', place: '', duration: '', sobriety: '' }
  ]);

  const handleChange = (index, field, value) => {
    const updatedRows = [...rows];
    updatedRows[index][field] = value;
    setRows(updatedRows);
  };

  const addRow = () => {
    setRows([...rows, { year: '', place: '', duration: '', sobriety: '' }]);
  };

  const deleteRow = (index) => {
    const updatedRows = [...rows];
    updatedRows.splice(index, 1);
    setRows(updatedRows);
  };
{/*  Prior Treatment for substance use Dependency / पदार्थ के उपयोग पर निर्भरता के लिए पूर्व उपचार end */}

  return (
    <form>
    <h4 className="mb-4">Substance Use Dependency / मादक पदार्थ उपयोग निर्भरता</h4>
    <div class="row">
  <div class="col-md-6 mb-3">
    <div class="form-group">
      <label class="form-label">Dependent To / निर्भरता का प्रकार</label>
      <Input name="dependent_to" type="text" class="form-control"/>
    </div>
  </div>

  <div class="col-md-6 mb-3">
    <div class="form-group">
      <label class="form-label">Substance daily Quantity? / पदार्थ की दैनिक मात्रा?</label>
      <Input name="substance_quantity_daily" type="text" class="form-control"/>
    </div>
  </div>

  <div class="col-md-6 mb-3">
    <div class="form-group">
      <label class="form-label">Used first time? / पहली बार पदार्थ कब लिया?</label>
      <Input name="first_use" type="text" class="form-control"/>
    </div>
  </div>

  <div class="col-md-6 mb-3">
    <div class="form-group">
      <label class="form-label">Patient Month income / रोगी की मासिक आय</label>
      <Input name="patient_income" type="text" class="form-control"/>
    </div>
  </div>

  <div class="col-md-6 mb-3">
    <div class="form-group">
      <label class="form-label">Daily spent on substance? / पदार्थ पर प्रतिदिन खर्च?</label>
      <Input name="daily_spent" type="text" class="form-control"/>
    </div>
  </div>

  <div class="col-md-6 mb-3">
    <div class="form-group">
      <label class="form-label">Recurrence of substance use / पदार्थ के प्रयोग की पुनरावृत्ति</label>
      <Input name="recurrence" type="text" class="form-control"/>
    </div>
  </div>

  <div class="col-md-6 mb-3">
    <div class="form-group">
      <label class="form-label">Last 30 days Quantity? / पिछले 30 दिनों की मात्रा?</label>
      <Input name="last_30_days_qty" type="text" class="form-control"/>
    </div>
  </div>

  <div class="col-md-6 mb-3">
    <div class="form-group">
      <label class="form-label">Duration of regular use? / नियमित सेवन कब कर रहे हैं?</label>
      <Input name="duration" type="text" class="form-control"/>
    </div>
  </div>

  <div class="col-md-6 mb-3">
    <div class="form-group">
      <label class="form-label">Monthly family income / मासिक पारिवारिक आय</label>
      <Input name="family_income" type="text" class="form-control"/>
    </div>
  </div>

  <div class="col-md-6 mb-3">
    <div class="form-group">
      <label class="form-label">Source of money? / पैसे का स्रोत:</label>
      <Input name="money_source" type="text" class="form-control"/>
    </div>
  </div>
</div>

{/* <!-- Full Width Inputs from here onward --> */}
<div class="mb-3">
  <label class="form-label">If expenses more than income where do you arrange? / यदि आपके खर्च आय से ज्यादा हैं तो व्यवस्था कँहा से करते हैं?</label>
  <textarea name="arrange_expenses" class="form-control" rows="2"></textarea>
</div>

<div class="mb-3">
  <label class="form-label">Substance abuse Started When? Why? Where? With Whom (No of Person)? Place? Substance? Quantity? Brand? / मादक पदार्थ का सेवन कब शुरू हुआ? क्यों? कहाँ? किसके साथ (कितने लोग) ? स्थान? पदार्थ? मात्रा? ब्रांड?
  </label>
  <textarea name="substance_started_details" class="form-control" rows="3"></textarea>
</div>

<div class="mb-3">
  <label class="form-label">If started with Tobacco after how much time you moved to other Substance (like Alcohol Ganja etc) & why? / यदि तम्बाकू से शुरुआत की थी तो कितने समय बाद आप अन्य मादक पदार्थ (जैसे शराब, गांजा आदि) की ओर चले गए और क्यों?
  </label>
  <textarea name="tobacco_to_other" class="form-control" rows="3"></textarea>
</div>

<div class="mb-3">
  <label class="form-label">How was your first experience of Substance abuse? / मादक पदार्थ के सेवन का आपका पहला अनुभव कैसा था?</label>
  <textarea name="first_experience" class="form-control" rows="3"></textarea>
</div>

<div class="mb-3">
  <label class="form-label">In how much time abuse Substance 2nd time & with whom? How often did you take Substance in the first year? / आपने कितनी बार और किसके साथ मिलकर दूसरी बार मादक पदार्थ का सेवन किया? आपने पहले वर्ष में कितनी बार मादक पदार्थ का सेवन किया?</label>
  <textarea name="abuse_second_time" class="form-control" rows="3"></textarea>
</div>

<div class="mb-3">
  <label class="form-label">Mental obsession for Substance started on? / मादक पदार्थ के प्रति मानसिक जुनून की शुरुआत कब हुयी?</label>
  <textarea name="abuse_second_time" class="form-control" rows="3"></textarea>
</div>

<div class="mb-3">
  <label class="form-label">Why & When started Regular use & with Whom? / नियमित उपयोग क्यों और कब शुरू हुआ? किसके साथ ?</label>
  <textarea name="abuse_second_time" class="form-control" rows="3"></textarea>
</div>

<div class="mb-3">
  <label class="form-label">Residence status of patient when started regularly / ?नियमित रूप से शुरू होने पर रोगी की आवासीय स्थिति?</label>
  <textarea name="abuse_second_time" class="form-control" rows="3"></textarea>
</div>

<div class="mb-3">
  <label class="form-label">list the friends with whom you started regular use. Were they are same friends you started with? / उन दोस्तों की सूची बनाएँ जिनके साथ आपने नियमित उपयोग शुरू किया था। क्या वे वही दोस्त थे जिनके साथ शुरुवात की ?</label>
  <textarea name="abuse_second_time" class="form-control" rows="3"></textarea>
</div>

<div class="mb-3">
  <label class="form-label">if tried multiple Substance  in early stage mention?(if yes why with whom?) / 
  क्या आपने कई मादक पदार्थ का इस्तेमाल किया है?(यदि हां तो क्यों किसके साथ?)</label>
  <textarea name="abuse_second_time" class="form-control" rows="3"></textarea>
</div>

<div class="mb-3">
  <label class="form-label">Are you in touch with those friends with whom you initially used Substance ? Current relationship with those? Are they Dependent, social Dependent or Sober. / क्या आप उन दोस्तों के संपर्क में हैं जिनके साथ आपने शुरू में मादक पदार्थ लिया था? उनके साथ वर्तमान संबंध क्या हैं? क्या वे आश्रित, सामाजिक आश्रित या संयमित हैं?  </label>
  <textarea name="abuse_second_time" class="form-control" rows="3"></textarea>
</div>

<div class="mb-3">
  <label class="form-label">What is reaction of family & friends (who are sober) when they know? What was reaction of patient? / जब परिवार और दोस्तों (जो संयमी हैं) को पता चला तो उनकी क्या प्रतिक्रिया थी? मरीज़ की क्या प्रतिक्रिया थी?</label>
  <textarea name="abuse_second_time" class="form-control" rows="3"></textarea>
</div>

<div class="mb-3">
  <label class="form-label">Effect of Substance  in Physical, personal, married, Educational, Professional Life & Family ? & Your Reaction? / शारीरिक, व्यक्तिगत, विवाहित, शैक्षिक, व्यावसायिक जीवन और परिवार पर मादक पदार्थ का प्रभाव और आपकी प्रतिक्रिया?</label>
  <textarea name="abuse_second_time" class="form-control" rows="3"></textarea>
</div>


<div class="mb-3">
  <label class="form-label">Chief Complaints: / मुख्य शिकायतें:</label>
  <textarea name="abuse_second_time" class="form-control" rows="3"></textarea>
</div>





{/*  Prior Treatment for substance use Dependency / पदार्थ के उपयोग पर निर्भरता के लिए पूर्व उपचार start */}
<div className="mb-4">
      <label className="form-label fw-bold">
        Prior Treatment for substance use Dependency / पदार्थ के उपयोग पर निर्भरता के लिए पूर्व उपचार
      </label>

      <table className="table table-bordered">
        <thead className="table-light">
          <tr>
            <th colspan="2">Prior Treatment for substance use Dependency / 
            पदार्थ के उपयोग पर निर्भरता के लिए पूर्व उपचार</th>
            <th colspan="2">How Many Times / कितनी बार?</th>
          </tr>
          <tr>
            <th>Year<br /><small>वर्ष</small></th>
            <th>Place of Treatment<br /><small>उपचार का स्थान</small></th>
            <th>Duration & No. of Times<br /><small>अवधि एवं संख्या</small></th>
            <th>Days of Sobriety<br /><small>संयमित दिन</small></th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              <td>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Year"
                  value={row.year}
                  onChange={(e) => handleChange(index, 'year', e.target.value)}
                  name={`year[${index}]`}
                />
              </td>
              <td>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Place of Treatment"
                  value={row.place}
                  onChange={(e) => handleChange(index, 'place', e.target.value)}
                  name={`place[${index}]`}
                />
              </td>
              <td>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Duration & Times"
                  value={row.duration}
                  onChange={(e) => handleChange(index, 'duration', e.target.value)}
                  name={`duration[${index}]`}
                />
              </td>
              <td>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Days of Sobriety"
                  value={row.sobriety}
                  onChange={(e) => handleChange(index, 'sobriety', e.target.value)}
                  name={`sobriety[${index}]`}
                />
              </td>
              <td>
                {index === 0 ? (
                  <button type="button" className="btn btn-success btn-sm" onClick={addRow}>
                    Add
                  </button>
                ) : (
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => deleteRow(index)}>
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {/*  Prior Treatment for substance use Dependency / पदार्थ के उपयोग पर निर्भरता के लिए पूर्व उपचार end */}


    <div class="mb-3">
  <label class="form-label">How Many times tried to stop Substance dependency ?how many times Succeeded & for how much time? / कितनी बार मादक पदार्थों का सेवन बंद करने की कोशिश की? कितनी बार सफलता मिली और कितने समय के लिए?</label>
  <textarea name="abuse_second_time" class="form-control" rows="3"></textarea>
</div>

<div class="mb-3">
  <label class="form-label"> Coping mechanism during stop using Substance / पदार्थ के उपयोग बंद करने के दौरान मुकाबला तंत्र</label>
  <textarea name="abuse_second_time" class="form-control" rows="3"></textarea>
</div>

<div class="mb-3">
  <label class="form-label">When Stopped using, what work did you do? (In life) / जब पदार्थ के उपयोग बंद कर दिया तो आपने क्या काम किया?(जीवन में)</label>
  <textarea name="abuse_second_time" class="form-control" rows="3"></textarea>
</div>

<div class="mb-3">
  <label class="form-label">What Influence made you stop? / किस प्रभाव ने आपको रुकने रुकने के लिए  प्रेरित किया?</label>
  <textarea name="abuse_second_time" class="form-control" rows="3"></textarea>
</div>

<div class="mb-3">
  <label class="form-label">If Relapse When? Why? With Whom? / यदि रिलैप्स हुए कब? क्यों? किसके साथ ?
  </label>
  <textarea name="abuse_second_time" class="form-control" rows="3"></textarea>
</div>

<div class="mb-3">
  <label class="form-label">After Relapse did you change your substance and is your Substance quantity increased? / रिलैप्स के बाद क्या आपने अपना मादक पदार्थ बदल दिया और क्या आपकी मादक पदार्थ मात्रा की बढ़ गई है?</label>
  <textarea name="abuse_second_time" class="form-control" rows="3"></textarea>
</div>

<H4>Patient Health / रोगी का स्वास्थ्य</H4>

<div class="mb-3">
  <label class="form-label"> Have any mental or physical disorder any accident or injury / रोगी को कोई मानसिक या शारीरिक रोग है?दुर्घटना या चोट?</label>
  <textarea name="abuse_second_time" class="form-control" rows="3"></textarea>
</div>

<div class="mb-3">
  <label class="form-label">Diagnosed on? Treatment? if took or Undergoing / बीमारी का पता कब चला? कोई उपचार लिया या चल रहा हो तो जानकारी 
  </label>
  <textarea name="abuse_second_time" class="form-control" rows="3"></textarea>
</div>

<div class="mb-3">
  <label class="form-label">Doctor, Place and duration & Result of Treatment? / चिकित्सक का नाम, अस्पताल, उपचार का समय और परिणाम?                  </label>
  <textarea name="abuse_second_time" class="form-control" rows="3"></textarea>
</div>

<div class="mb-3">
  <label class="form-label">If gone under any treatment for Substance abuse? (any Psychiatrist, baba, jadi buti, Religious  etc) / क्या आपने मादक पदार्थ के सेवन के लिए कोई उपचार करवाया है? (किसी मनोचिकित्सक, बाबा, जड़ी बूटी, धार्मिक आदि से)</label>
  <textarea name="abuse_second_time" class="form-control" rows="3"></textarea>
</div>

<div class="mb-3">
  <label class="form-label">If yes where? When? For how much Time? / अगर हाँ तो कहाँ? कब? कितने समय के लिए?</label>
  <textarea name="abuse_second_time" class="form-control" rows="3"></textarea>
</div>

<div class="mb-3">
  <label class="form-label">You familiar with treatment? Effect of the treatment? / क्या इलाज के बारे में आपको पहले पता था? परिणाम क्या रहा?
</label>
  <textarea name="abuse_second_time" class="form-control" rows="3"></textarea>
</div>

  </form>
  )
}

export default SUDBrief
