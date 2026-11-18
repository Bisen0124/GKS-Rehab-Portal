import React, { Fragment, useState, useEffect, useRef, useCallback } from "react";
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
  InputGroup,
  Button,
  Badge,
} from "reactstrap";
import DatePicker from "react-datepicker";
import HeaderCard from "../Common/Component/HeaderCard";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import useCalculateAge from "../../CustomHook/useCalculateAge";
import CommonModal from "../UiKits/Modals/common/modal";
import html2pdf from "html2pdf.js";
import PatientCommonInfo from "../../CustomHook/PatientCommonInfo";
import { useBranch } from "../../contexts/BranchContext";
import { useLang } from "../../contexts/LangContext";
import { getTranslation } from "../../utils/translator";
import VoiceTextarea from "../VoiceTextarea/VoiceTextarea";
import { printElementAsPdf } from "../../utils/pdfPrintHelper";
import PatientViewHeader from "../Common/PatientViewHeader";
import TableExportButtons from "../Common/TableExportButtons";
import ModalLoading from "../Common/ModalLoading";
import UserDetailsModal from "../Common/UserDetailsModal";
import { SaveDraftButton, DraftNoticeBanner } from "../Common/SaveDraftButton";
import { loadDraft, clearDraft, safeDate } from "../../utils/formDraftManager";
import ModalActionButtons from "../Common/ModalActionButtons";
import { validateCompulsoryFields, showApiErrorAlert } from "../../utils/formValidationHelper";
import { fetchActiveDetoxSubstances } from "../../Services/detoxSubstanceService";
import { fetchAssessmentParameters } from "../../Services/detoxParameterService";
import {
  Plus,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  RefreshCw,
} from "react-feather";

// Tabbed Clinical Withdrawal Scales matching clinical assessment sheets (Alcohol CIWA-Ar, Cannabis CWAS, Opioids COWS, ATS AWQ)
const SUBSTANCE_WITHDRAWAL_SCALES = {
  alcohol: {
    key: "alcohol",
    tabLabel: "Alcohol",
    matchKeywords: ["alcohol", "liquor", "ethanol", "ciwa"],
    scaleTitle: "Clinical Alcohol Withdrawal Scale (CIWA-Ar Adaptation)",
    subtitle:
      "For each item, click/select the number that best describes the patient's signs or symptoms. Rate on just the apparent relationship to alcohol withdrawal.",
    benchmarks: [
      { range: "0 - 9", min: 0, max: 9, label: "Mild Alcohol Withdrawal", color: "#166534", bg: "#f0fdf4", border: "#bbf7d0" },
      { range: "10 - 15", min: 10, max: 15, label: "Moderate Alcohol Withdrawal", color: "#92400e", bg: "#fffbeb", border: "#fde68a" },
      { range: "16 - 20", min: 16, max: 20, label: "Severe Alcohol Withdrawal", color: "#c2410c", bg: "#fff7ed", border: "#fed7aa" },
      { range: "21+", min: 21, max: 999, label: "Very Severe Alcohol Withdrawal / Risk of DTs", color: "#991b1b", bg: "#fef2f2", border: "#fecaca" },
    ],
    sampleDemo: {
      nausea_vomiting: { score: 2, notes: "Mild morning dry heaves" },
      tremor: { score: 2, notes: "Visible fine hand tremor" },
      paroxysmal_sweats: { score: 2, notes: "Beads of sweat on forehead" },
      anxiety: { score: 4, notes: "Tense, hypervigilant" },
      agitation: { score: 1, notes: "Slightly fidgety in chair" },
      tactile_disturbances: { score: 0, notes: "None reported" },
      auditory_disturbances: { score: 0, notes: "None reported" },
      visual_disturbances: { score: 1, notes: "Mild light sensitivity" },
      headache: { score: 2, notes: "Mild frontal headache" },
      orientation: { score: 0, notes: "Oriented x3" },
    },
    items: [
      {
        itemNo: 1,
        key: "nausea_vomiting",
        title: "Nausea and Vomiting",
        sub: "(Over last 1/2 hour)",
        options: [
          { value: 0, label: "No nausea and no vomiting" },
          { value: 1, label: "Mild nausea with no vomiting" },
          { value: 2, label: "Moderate nausea with dry heaves" },
          { value: 4, label: "Intermittent nausea with dry heaves" },
          { value: 7, label: "Constant nausea, frequent dry heaves and vomiting" },
        ],
      },
      {
        itemNo: 2,
        key: "tremor",
        title: "Tremor",
        sub: "(Observation of arms extended & fingers spread)",
        options: [
          { value: 0, label: "No tremor" },
          { value: 1, label: "Not visible, but can be felt fingertip to fingertip" },
          { value: 2, label: "Moderate tremor, easily visible with arms extended" },
          { value: 4, label: "Severe tremor, visible even with arms at sides" },
          { value: 7, label: "Gross, severe tremor even with arms not extended" },
        ],
      },
      {
        itemNo: 3,
        key: "paroxysmal_sweats",
        title: "Paroxysmal Sweats",
        sub: "(Over last 1/2 hour)",
        options: [
          { value: 0, label: "No sweat visible" },
          { value: 1, label: "Barely perceptible sweating, palms moist" },
          { value: 2, label: "Beads of sweat obvious on forehead" },
          { value: 4, label: "Drenching sweats, shirts/bedding wet" },
          { value: 7, label: "Profuse, continuous drenching sweat" },
        ],
      },
      {
        itemNo: 4,
        key: "anxiety",
        title: "Anxiety",
        sub: "(Patient observation & report)",
        options: [
          { value: 0, label: "No anxiety, patient relaxed" },
          { value: 1, label: "Mildly anxious, slightly apprehensive" },
          { value: 2, label: "Moderately anxious, tense" },
          { value: 4, label: "Severely anxious, hypervigilant" },
          { value: 7, label: "Acute panic state, severe terror or rage" },
        ],
      },
      {
        itemNo: 5,
        key: "agitation",
        title: "Agitation",
        sub: "(Observation during assessment)",
        options: [
          { value: 0, label: "Normal activity, calm" },
          { value: 1, label: "Somewhat more than normal activity, fidgety" },
          { value: 2, label: "Moderately restless, pacing or shifting" },
          { value: 4, label: "Severely restless, frequent pacing" },
          { value: 7, label: "Paces constantly, thrashing about, uncooperative" },
        ],
      },
      {
        itemNo: 6,
        key: "tactile_disturbances",
        title: "Tactile Disturbances",
        sub: "(Patient report)",
        options: [
          { value: 0, label: "None" },
          { value: 1, label: "Very mild itchiness, pins & needles, burning, or numbness" },
          { value: 2, label: "Mild itchiness, burning, or numbness" },
          { value: 3, label: "Moderate itchiness, burning, or numbness" },
          { value: 4, label: "Severe hallucinations/disturbances (sensations of bugs crawling)" },
          { value: 7, label: "Continuous severe tactile hallucinations" },
        ],
      },
      {
        itemNo: 7,
        key: "auditory_disturbances",
        title: "Auditory Disturbances",
        sub: "(Patient report)",
        options: [
          { value: 0, label: "Not present" },
          { value: 1, label: "Very mild harshness or ability to frighten" },
          { value: 2, label: "Mild harshness or ability to frighten" },
          { value: 3, label: "Moderate auditory sensitivity / fright" },
          { value: 4, label: "Severe hallucinations (hearing voices/sounds)" },
          { value: 7, label: "Continuous severe auditory hallucinations" },
        ],
      },
      {
        itemNo: 8,
        key: "visual_disturbances",
        title: "Visual Disturbances",
        sub: "(Patient report)",
        options: [
          { value: 0, label: "Not present" },
          { value: 1, label: "Very mild sensitivity to light" },
          { value: 2, label: "Mild sensitivity to light / shadow disturbances" },
          { value: 3, label: "Moderate visual sensitivity" },
          { value: 4, label: "Severe visual hallucinations (seeing objects/people)" },
          { value: 7, label: "Continuous severe visual hallucinations" },
        ],
      },
      {
        itemNo: 9,
        key: "headache",
        title: "Headache, Fullness in Head",
        sub: "(Patient report)",
        options: [
          { value: 0, label: "Not present" },
          { value: 1, label: "Very mild headache / tightness" },
          { value: 2, label: "Mild to moderate headache" },
          { value: 4, label: "Moderately severe headache" },
          { value: 7, label: "Extremely severe, blinding headache" },
        ],
      },
      {
        itemNo: 10,
        key: "orientation",
        title: "Orientation and Clouding of Sensorium",
        sub: "(Assessment during interview)",
        options: [
          { value: 0, label: "Oriented and can do serial additions" },
          { value: 1, label: "Cannot do serial additions or uncertain of date" },
          { value: 2, label: "Disoriented for date by no more than 2 calendar days" },
          { value: 3, label: "Disoriented for date by more than 2 calendar days" },
          { value: 4, label: "Disoriented for place and/or person" },
        ],
      },
    ],
  },
  cannabis: {
    key: "cannabis",
    tabLabel: "Cannabis",
    matchKeywords: ["cannabis", "ganja", "marijuana", "thc", "cwas"],
    scaleTitle: "Cannabis Withdrawal Assessment Scale (CWAS Adaptation)",
    subtitle: "Rate each cannabis withdrawal symptom over the past 24 hours by clicking the matching severity level.",
    benchmarks: [
      { range: "0 - 5", min: 0, max: 5, label: "Mild Cannabis Withdrawal", color: "#166534", bg: "#f0fdf4", border: "#bbf7d0" },
      { range: "6 - 10", min: 6, max: 10, label: "Moderate Cannabis Withdrawal", color: "#92400e", bg: "#fffbeb", border: "#fde68a" },
      { range: "11+", min: 11, max: 999, label: "Severe Cannabis Withdrawal", color: "#991b1b", bg: "#fef2f2", border: "#fecaca" },
    ],
    sampleDemo: {
      irritability_anger: { score: 2, notes: "Short-tempered during morning" },
      anxiety_nervousness: { score: 1, notes: "Mildly anxious" },
      sleep_difficulty: { score: 2, notes: "Woke up twice, vivid dreams" },
      decreased_appetite: { score: 1, notes: "Ate half breakfast" },
      restlessness_craving: { score: 2, notes: "Craving reported" },
    },
    items: [
      {
        itemNo: 1,
        key: "irritability_anger",
        title: "Irritability or Anger",
        sub: "(Over last 24 hours)",
        options: [
          { value: 0, label: "None, calm mood" },
          { value: 1, label: "Mild irritability" },
          { value: 2, label: "Moderate irritability / short-tempered" },
          { value: 3, label: "Severe anger or verbal outbursts" },
        ],
      },
      {
        itemNo: 2,
        key: "anxiety_nervousness",
        title: "Nervousness or Anxiety",
        sub: "(Patient observation & report)",
        options: [
          { value: 0, label: "Relaxed, no anxiety" },
          { value: 1, label: "Mild nervousness" },
          { value: 2, label: "Moderately anxious and tense" },
          { value: 3, label: "Severe persistent anxiety" },
        ],
      },
      {
        itemNo: 3,
        key: "sleep_difficulty",
        title: "Sleep Difficulty / Insomnia",
        sub: "(Over last night)",
        options: [
          { value: 0, label: "Normal restful sleep" },
          { value: 1, label: "Difficulty falling asleep" },
          { value: 2, label: "Frequent waking or disturbing dreams" },
          { value: 3, label: "Severe insomnia (< 3 hours sleep)" },
        ],
      },
      {
        itemNo: 4,
        key: "decreased_appetite",
        title: "Decreased Appetite / GI Discomfort",
        sub: "(Over last 24 hours)",
        options: [
          { value: 0, label: "Normal appetite" },
          { value: 1, label: "Slightly reduced appetite" },
          { value: 2, label: "Skipped meals / mild stomach discomfort" },
          { value: 3, label: "No appetite / unable to eat" },
        ],
      },
      {
        itemNo: 5,
        key: "restlessness_craving",
        title: "Restlessness & Craving",
        sub: "(Observation & patient report)",
        options: [
          { value: 0, label: "Calm, no craving" },
          { value: 1, label: "Mild restlessness or occasional craving" },
          { value: 2, label: "Noticeably restless with frequent urges" },
          { value: 3, label: "Intense restlessness and strong craving" },
        ],
      },
    ],
  },
  opioids: {
    key: "opioids",
    tabLabel: "Opioids",
    matchKeywords: ["opioid", "opiod", "opiate", "heroin", "smack", "drugs", "cows"],
    scaleTitle: "Clinical Opiate Withdrawal Scale (COWS Adaptation)",
    subtitle: "Select the observed clinical finding for each opioid withdrawal indicator.",
    benchmarks: [
      { range: "0 - 8", min: 0, max: 8, label: "Mild Opioid Withdrawal", color: "#166534", bg: "#f0fdf4", border: "#bbf7d0" },
      { range: "9 - 16", min: 9, max: 16, label: "Moderate Opioid Withdrawal", color: "#92400e", bg: "#fffbeb", border: "#fde68a" },
      { range: "17+", min: 17, max: 999, label: "Severe Opioid Withdrawal", color: "#991b1b", bg: "#fef2f2", border: "#fecaca" },
    ],
    sampleDemo: {
      resting_pulse: { score: 2, notes: "Pulse 108 bpm" },
      sweating_chills: { score: 2, notes: "Flushed with moist face" },
      restlessness: { score: 3, notes: "Shifting frequently" },
      bone_joint_aches: { score: 2, notes: "Knee and back pain" },
      gi_upset: { score: 2, notes: "Mild nausea" },
      anxiety_irritability: { score: 2, notes: "Irritable" },
    },
    items: [
      {
        itemNo: 1,
        key: "resting_pulse",
        title: "Resting Pulse Rate",
        sub: "(Measured after 1 min sitting)",
        options: [
          { value: 0, label: "Pulse 80 bpm or below" },
          { value: 1, label: "Pulse 81 - 100 bpm" },
          { value: 2, label: "Pulse 101 - 120 bpm" },
          { value: 4, label: "Pulse greater than 120 bpm" },
        ],
      },
      {
        itemNo: 2,
        key: "sweating_chills",
        title: "Sweating / Chills",
        sub: "(Over past 1/2 hour)",
        options: [
          { value: 0, label: "No report of chills or flushing" },
          { value: 1, label: "Subjective report of chills or flushing" },
          { value: 2, label: "Flushed or observable moistness on face" },
          { value: 3, label: "Beads of sweat on brow or face" },
          { value: 4, label: "Sweat streaming off face" },
        ],
      },
      {
        itemNo: 3,
        key: "restlessness",
        title: "Restlessness",
        sub: "(Observation during assessment)",
        options: [
          { value: 0, label: "Able to sit still" },
          { value: 1, label: "Reports difficulty sitting still, but is able to do so" },
          { value: 3, label: "Frequent shifting or extraneous movements of legs/arms" },
          { value: 5, label: "Unable to sit still for more than a few seconds" },
        ],
      },
      {
        itemNo: 4,
        key: "bone_joint_aches",
        title: "Bone or Joint Aches",
        sub: "(If not due to other pain)",
        options: [
          { value: 0, label: "Not present" },
          { value: 1, label: "Mild diffuse discomfort" },
          { value: 2, label: "Patient reports severe diffuse aching of joints/muscles" },
          { value: 4, label: "Patient rubbing joints or muscles, unable to sit still" },
        ],
      },
      {
        itemNo: 5,
        key: "gi_upset",
        title: "GI Upset / Nausea",
        sub: "(Over last 1/2 hour)",
        options: [
          { value: 0, label: "No GI symptoms" },
          { value: 1, label: "Stomach cramps" },
          { value: 2, label: "Nausea or loose stool" },
          { value: 3, label: "Vomiting or diarrhea" },
          { value: 5, label: "Multiple episodes of diarrhea or vomiting" },
        ],
      },
      {
        itemNo: 6,
        key: "anxiety_irritability",
        title: "Anxiety or Irritability",
        sub: "(Observation & report)",
        options: [
          { value: 0, label: "None" },
          { value: 1, label: "Patient reports increasing irritability or anxiousness" },
          { value: 2, label: "Patient obviously irritable or anxious" },
          { value: 4, label: "So irritable or anxious that participation is difficult" },
        ],
      },
    ],
  },
  ats: {
    key: "ats",
    tabLabel: "ATS",
    matchKeywords: ["ats", "amphetamine", "meth", "stimulant", "md", "cocaine"],
    scaleTitle: "Amphetamine-Type Stimulant Withdrawal Scale (AWQ Adaptation)",
    subtitle: "Select the clinical severity level for each ATS / stimulant withdrawal sign.",
    benchmarks: [
      { range: "0 - 6", min: 0, max: 6, label: "Mild ATS Withdrawal", color: "#166534", bg: "#f0fdf4", border: "#bbf7d0" },
      { range: "7 - 12", min: 7, max: 12, label: "Moderate ATS Withdrawal", color: "#92400e", bg: "#fffbeb", border: "#fde68a" },
      { range: "13+", min: 13, max: 999, label: "Severe ATS Withdrawal", color: "#991b1b", bg: "#fef2f2", border: "#fecaca" },
    ],
    sampleDemo: {
      craving: { score: 2, notes: "Moderate afternoon craving" },
      fatigue_energy: { score: 2, notes: "Low energy, drowsy" },
      dysphoric_mood: { score: 2, notes: "Flat affect, low mood" },
      sleep_disturbance: { score: 2, notes: "Slept 11 hours" },
      psychomotor_change: { score: 1, notes: "Slightly slowed speech" },
    },
    items: [
      {
        itemNo: 1,
        key: "craving",
        title: "Craving for Stimulants",
        sub: "(Patient report)",
        options: [
          { value: 0, label: "No craving" },
          { value: 1, label: "Mild occasional thoughts" },
          { value: 2, label: "Moderate frequent urges" },
          { value: 4, label: "Intense, overpowering craving" },
        ],
      },
      {
        itemNo: 2,
        key: "fatigue_energy",
        title: "Fatigue & Lack of Energy",
        sub: "(Observation & report)",
        options: [
          { value: 0, label: "Normal energy level" },
          { value: 1, label: "Mild tiredness" },
          { value: 2, label: "Noticeable lethargy / heavy limbs" },
          { value: 4, label: "Severe exhaustion, unable to perform routine tasks" },
        ],
      },
      {
        itemNo: 3,
        key: "dysphoric_mood",
        title: "Dysphoric Mood / Depression",
        sub: "(Patient report)",
        options: [
          { value: 0, label: "Normal stable mood" },
          { value: 1, label: "Mild low mood or emotional flatness" },
          { value: 2, label: "Moderate sadness / loss of interest" },
          { value: 4, label: "Severe depression / hopelessness" },
        ],
      },
      {
        itemNo: 4,
        key: "sleep_disturbance",
        title: "Sleep Disturbance / Hypersomnia",
        sub: "(Over last 24 hours)",
        options: [
          { value: 0, label: "Normal sleep pattern" },
          { value: 1, label: "Light sleep or vivid dreams" },
          { value: 2, label: "Excessive sleep (hypersomnia) or broken sleep" },
          { value: 4, label: "Severe insomnia or extreme hypersomnia" },
        ],
      },
      {
        itemNo: 5,
        key: "psychomotor_change",
        title: "Psychomotor Agitation / Slowing",
        sub: "(Clinical observation)",
        options: [
          { value: 0, label: "Normal movement and speech" },
          { value: 1, label: "Slightly slowed or mildly restless" },
          { value: 2, label: "Noticeable pacing or slowed speech" },
          { value: 4, label: "Marked agitation or severe slowing" },
        ],
      },
    ],
  },
};

const SUBSTANCE_TAB_ORDER = ["alcohol", "cannabis", "opioids", "ats"];

// Standard Clinical Institute Withdrawal Assessment (CIWA-Ar) parameter fallbacks
const DEFAULT_CIWA_PARAMETERS = [
  {
    sub_id: 1,
    name: "nausea",
    display_name: "Nausea and Vomiting / मतली और उल्टी",
    description: "Nausea and vomiting assessment",
    scoring_bands: [
      { score_id: 1, min_score: 0, max_score: 0, description: "No nausea and no vomiting" },
      { score_id: 2, min_score: 1, max_score: 1, description: "Mild nausea with no vomiting" },
      { score_id: 3, min_score: 2, max_score: 3, description: "Intermittent nausea with dry heaves" },
      { score_id: 4, min_score: 4, max_score: 7, description: "Constant nausea, frequent dry heaves and vomiting" },
    ],
  },
  {
    sub_id: 2,
    name: "tremor",
    display_name: "Tremor / कंपकंपी",
    description: "Tremor with arms extended and fingers spread apart",
    scoring_bands: [
      { score_id: 5, min_score: 0, max_score: 0, description: "No tremor" },
      { score_id: 6, min_score: 1, max_score: 1, description: "Not visible, but can be felt fingertip to fingertip" },
      { score_id: 7, min_score: 2, max_score: 4, description: "Moderate, with patient's arms extended" },
      { score_id: 8, min_score: 5, max_score: 7, description: "Severe, even with arms not extended" },
    ],
  },
  {
    sub_id: 3,
    name: "paroxysmal_sweats",
    display_name: "Paroxysmal Sweats / पसीना आना",
    description: "Sweating and perspiration rate",
    scoring_bands: [
      { score_id: 9, min_score: 0, max_score: 0, description: "No sweat visible" },
      { score_id: 10, min_score: 1, max_score: 1, description: "Barely perceptible sweating, palms moist" },
      { score_id: 11, min_score: 2, max_score: 4, description: "Beads of sweat obvious on forehead" },
      { score_id: 12, min_score: 5, max_score: 7, description: "Drenching sweats" },
    ],
  },
  {
    sub_id: 4,
    name: "anxiety",
    display_name: "Anxiety / चिंता",
    description: "Subjective anxiety or nervousness",
    scoring_bands: [
      { score_id: 13, min_score: 0, max_score: 0, description: "No anxiety, at ease" },
      { score_id: 14, min_score: 1, max_score: 1, description: "Mildly anxious" },
      { score_id: 15, min_score: 2, max_score: 4, description: "Moderately anxious or guarded" },
      { score_id: 16, min_score: 5, max_score: 7, description: "Equivalent to acute panic state" },
    ],
  },
  {
    sub_id: 5,
    name: "agitation",
    display_name: "Agitation / उत्तेजना",
    description: "Restlessness and physical pacing",
    scoring_bands: [
      { score_id: 17, min_score: 0, max_score: 0, description: "Normal activity" },
      { score_id: 18, min_score: 1, max_score: 2, description: "Somewhat more than normal activity" },
      { score_id: 19, min_score: 3, max_score: 5, description: "Moderately fidgety and restless" },
      { score_id: 20, min_score: 6, max_score: 7, description: "Paces back and forth during most of the interview" },
    ],
  },
  {
    sub_id: 6,
    name: "headache",
    display_name: "Headache / सिरदर्द",
    description: "Headache, fullness in head",
    scoring_bands: [
      { score_id: 21, min_score: 0, max_score: 0, description: "Not present" },
      { score_id: 22, min_score: 1, max_score: 2, description: "Very mild to mild" },
      { score_id: 23, min_score: 3, max_score: 5, description: "Moderate to moderately severe" },
      { score_id: 24, min_score: 6, max_score: 7, description: "Extremely severe" },
    ],
  },
  {
    sub_id: 7,
    name: "orientation",
    display_name: "Orientation / अभिविन्यास",
    description: "Orientation and clouding of sensorium",
    scoring_bands: [
      { score_id: 25, min_score: 0, max_score: 0, description: "Oriented and knows date and place" },
      { score_id: 26, min_score: 1, max_score: 1, description: "Cannot do serial additions or is uncertain about date" },
      { score_id: 27, min_score: 2, max_score: 2, description: "Disoriented for date by no more than 2 calendar days" },
      { score_id: 28, min_score: 3, max_score: 4, description: "Disoriented for date by more than 2 calendar days or place" },
    ],
  },
];

const parseAssessmentResult = (raw) => {
  if (!raw) return [];
  let parsed = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.map((item) => {
    if (item.parameter || item.substance) {
      return {
        parameter: item.parameter || item.substance || item.name,
        score: item.score,
        description: item.description,
      };
    }
    const keys = Object.keys(item);
    if (keys.length > 0) {
      const param = keys[0];
      const inner = item[param];
      if (typeof inner === "object" && inner !== null) {
        const scoreKey = Object.keys(inner)[0];
        return {
          parameter: param,
          score: scoreKey,
          description: inner[scoreKey],
        };
      }
    }
    return { parameter: "Parameter", score: "—", description: "—" };
  });
};

const getCIWASeverity = (score) => {
  const num = Number(score) || 0;
  if (num < 10) {
    return {
      label: "Mild Withdrawal / हल्का विषहरण",
      color: "success",
      badgeColor: "#16a34a",
      badgeBg: "#f0fdf4",
      badgeBorder: "#bbf7d0",
      textColor: "#166534",
      bgClass: "alert-success",
      description: "Supportive care, minimal or no medication typically required.",
    };
  }
  if (num <= 19) {
    return {
      label: "Moderate Withdrawal / मध्यम विषहरण",
      color: "warning",
      badgeColor: "#d97706",
      badgeBg: "#fffbeb",
      badgeBorder: "#fde68a",
      textColor: "#92400e",
      bgClass: "alert-warning",
      description: "Medical detoxification protocol and monitoring recommended.",
    };
  }
  return {
    label: "Severe Withdrawal / गंभीर विषहरण",
    color: "danger",
    badgeColor: "#dc2626",
    badgeBg: "#fef2f2",
    badgeBorder: "#fecaca",
    textColor: "#991b1b",
    bgClass: "alert-danger",
    description: "High risk of delirium tremens/seizures; urgent clinical intervention.",
  };
};

const customTableStyles = {
  table: {
    style: {
      border: "1px solid #dcefe8",
      borderRadius: "8px",
    },
  },
  headRow: {
    style: {
      backgroundColor: "#ebf7f3",
      borderBottom: "2px solid #b7dfd2",
      minHeight: "48px",
    },
  },
  headCells: {
    style: {
      fontSize: "13px",
      fontWeight: "700",
      color: "#23594b",
      letterSpacing: "0.3px",
      paddingLeft: "12px",
      paddingRight: "12px",
      whiteSpace: "nowrap",
      wordBreak: "keep-all",
      overflow: "visible",
      textOverflow: "unset",
    },
  },
  cells: {
    style: {
      fontSize: "13px",
      paddingLeft: "12px",
      paddingRight: "12px",
      paddingTop: "10px",
      paddingBottom: "10px",
    },
  },
  rows: {
    style: {
      minHeight: "54px",
      "&:hover": {
        backgroundColor: "#f8fdfb",
      },
    },
  },
};

const Detoxification = () => {
  const { lang } = useLang();
  const { selectedBranch } = useBranch();

  const [isLoading, setIsLoading] = useState(false);
  const [viewUserDetailsModal, setViewUserDetailsModal] = useState(false);
  const [selectedViewUserId, setSelectedViewUserId] = useState(null);

  // Form options from backend (100% dynamic substances & parameters from Settings -> Detoxification)
  const [formSubstances, setFormSubstances] = useState(DEFAULT_CIWA_PARAMETERS);
  const [dbParametersBySubId, setDbParametersBySubId] = useState({});

  // Registered Patients (Table 1)
  const [registeredPatients, setRegisteredPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [patientSearchText, setPatientSearchText] = useState("");
  const [patientsLoading, setPatientsLoading] = useState(true);

  // Detoxification Assessments (Table 2)
  const [assessments, setAssessments] = useState([]);
  const [filteredAssessments, setFilteredAssessments] = useState([]);
  const [assessmentSearchText, setAssessmentSearchText] = useState("");
  const [assessmentsLoading, setAssessmentsLoading] = useState(true);

  // Create Form State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [draftTimestamp, setDraftTimestamp] = useState(null);
  const [currentDetoxUserId, setCurrentDetoxUserId] = useState(null);

  const initialDetoxForm = {
    sub_id: "",
    dateOfAssessment: new Date(),
    parameterScores: {},
    CIWA_rating: 0,
    remarks: "",
    next_follow_date: "",
  };

  const [formData, setFormData] = useState(initialDetoxForm);

  // Edit Assessment State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  // View Assessment State
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewDetoxData, setViewDetoxData] = useState(null);

  const pdfRef = useRef();
  const [pdfDownloading, setPdfDownloading] = useState(false);

  const dob = selectedUser?.dob;
  const patientCalAge = useCalculateAge(dob);

  const handleViewUserDetails = (userId) => {
    setSelectedViewUserId(userId);
    setViewUserDetailsModal(true);
  };

  // Fetch Form Options (Master Substances & CIWA scoring bands)
  const fetchFormOptions = useCallback(async () => {
    if (!selectedBranch) return;
    const token = localStorage.getItem("Authorization");

    try {
      // 1. Fetch active substances from master API
      let masterSubs = [];
      try {
        const subRes = await fetch(
          `https://gks-yjdc.onrender.com/api/detoxification-substances?branch_id=${selectedBranch}`,
          {
            headers: { "Content-Type": "application/json", Authorization: `${token}` },
          }
        );
        if (subRes.ok) {
          const subJson = await subRes.json();
          masterSubs = subJson.data || (Array.isArray(subJson) ? subJson : []);
        }
      } catch {
        // network fallback
      }

      // Check local cache if network empty
      if (!masterSubs || masterSubs.length === 0) {
        try {
          const cached = await fetchActiveDetoxSubstances(selectedBranch);
          if (cached && cached.length > 0) masterSubs = cached;
        } catch {
          // ignore
        }
      }

      // 2. Fetch form-options if available to get scoring bands mapping
      const bandsMap = {};
      try {
        const res = await fetch(
          `https://gks-yjdc.onrender.com/api/detoxification/form-options?branch_id=${selectedBranch}`,
          {
            headers: { "Content-Type": "application/json", Authorization: `${token}` },
          }
        );
        if (res.ok) {
          const json = await res.json();
          const list = json.data || json.substances || [];
          if (Array.isArray(list)) {
            list.forEach((item) => {
              const idKey = item.sub_id || item.id;
              if (idKey) bandsMap[String(idKey)] = item.scoring_bands || item.scoring;
              if (item.name) bandsMap[item.name.toLowerCase()] = item.scoring_bands || item.scoring;
            });
          }
        }
      } catch {
        // ignore
      }

      // Also incorporate custom configured assessment parameters (grouped dynamically by sub_id)
      const groupedParams = {};
      try {
        const customParams = await fetchAssessmentParameters(selectedBranch);
        if (Array.isArray(customParams) && customParams.length > 0) {
          customParams.forEach((cp) => {
            if (cp.sub_id && cp.scores && cp.scores.length > 0) {
              const scoringBands = cp.scores.map((sc, scIdx) => ({
                score_id: sc.id || scIdx + 1,
                min_score: Number(sc.min_score !== undefined ? sc.min_score : sc.score) || 0,
                max_score: Number(sc.max_score !== undefined ? sc.max_score : sc.score) || 0,
                description: sc.description,
              }));
              bandsMap[String(cp.sub_id)] = scoringBands;
              if (cp.substance_name) bandsMap[cp.substance_name.toLowerCase()] = scoringBands;
              bandsMap[cp.parameter_name.toLowerCase()] = scoringBands;

              const sidKey = String(cp.sub_id);
              if (!groupedParams[sidKey]) groupedParams[sidKey] = [];
              const sortedOpts = [...cp.scores]
                .map((sc) => ({
                  value: Number(sc.min_score !== undefined ? sc.min_score : sc.score) || 0,
                  label: sc.description || `Score ${sc.score}`,
                }))
                .sort((a, b) => a.value - b.value);

              // Deduplicate score values keeping order
              const uniqueOpts = [];
              const seenVals = new Set();
              sortedOpts.forEach((o) => {
                if (!seenVals.has(o.value)) {
                  seenVals.add(o.value);
                  uniqueOpts.push(o);
                }
              });

              groupedParams[sidKey].push({
                itemNo: groupedParams[sidKey].length + 1,
                key: cp.parameter_name
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "_")
                  .replace(/^_|_$/g, "") || `param_${cp.id}`,
                title: cp.parameter_name,
                sub: cp.substance_name ? `(${cp.substance_name})` : "(Live DB Parameter)",
                options: uniqueOpts.length > 0 ? uniqueOpts : [{ value: 0, label: "Normal / None" }],
              });
            }
          });
        }
      } catch {
        // ignore
      }
      setDbParametersBySubId(groupedParams);

      // 3. Merge master substances with scoring bands
      if (masterSubs.length > 0) {
        const merged = masterSubs.map((sub, idx) => {
          const subId = sub.sub_id || sub.id;
          const matchedBands =
            bandsMap[String(subId)] ||
            bandsMap[(sub.name || "").toLowerCase()] ||
            sub.scoring_bands ||
            DEFAULT_CIWA_PARAMETERS[idx % DEFAULT_CIWA_PARAMETERS.length].scoring_bands;

          return {
            sub_id: subId,
            id: subId,
            name: sub.name,
            description: sub.description || sub.name,
            scoring_bands: matchedBands,
          };
        });
        setFormSubstances(merged);
        setFormData((prev) => {
          const validIds = merged.map((m) => String(m.sub_id || m.id));
          if (prev.sub_id && validIds.includes(String(prev.sub_id))) {
            return prev;
          }
          const alc = merged.find((m) =>
            `${m.name || ""} ${m.description || ""}`.toLowerCase().includes("alcohol")
          );
          const picked = alc || merged[0];
          return { ...prev, sub_id: picked?.sub_id || picked?.id || "" };
        });
        return;
      }
    } catch (err) {
      console.warn("Could not fetch dynamic detox form-options, using standard CIWA parameters:", err);
    }
  }, [selectedBranch]);

  // Fetch Registered Patients
  const fetchRegisteredPatients = useCallback(() => {
    if (!selectedBranch) return;
    setPatientsLoading(true);
    const token = localStorage.getItem("Authorization");

    // Fetch active detox users enriched with status & CIWA info (API 22), fallback to /api/users
    fetch(
      `https://gks-yjdc.onrender.com/api/detoxification/active-users-detoxification-details?branch_id=${selectedBranch}`,
      {
        headers: { "Content-Type": "application/json", Authorization: `${token}` },
      }
    )
      .then((res) => {
        if (!res.ok) {
          return fetch(`https://gks-yjdc.onrender.com/api/users?branch_id=${selectedBranch}`, {
            headers: { "Content-Type": "application/json", Authorization: `${token}` },
          });
        }
        return res;
      })
      .then((res) => (res.ok ? res.json() : Promise.reject("Fetch failed")))
      .then((res) => {
        const users = res.data || [];
        const formatted = users.map((user) => ({
          id: user.user_id || user.id,
          user_id: user.user_id || user.id,
          gks_id: user.gks_id || "N/A",
          recentDetoxId: user.recent_detox_id,
          name: user.name || user.patient_name,
          phone: user.phone,
          dischargeStatus: user.discharge_status,
          isReadmission: user.is_readmission,
          has_detoxification: user.has_detoxification,
          recent_status: user.recent_status,
          recent_ciwa_rating: user.recent_ciwa_rating,
        }));
        setRegisteredPatients(formatted);
        setFilteredPatients(formatted);
        setPatientsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching patients:", err);
        setPatientsLoading(false);
      });
  }, [selectedBranch]);

  // Fetch Detoxification Assessments
  const fetchAssessments = useCallback(() => {
    if (!selectedBranch) return;
    setAssessmentsLoading(true);
    const token = localStorage.getItem("Authorization");

    fetch(`https://gks-yjdc.onrender.com/api/detoxification/all-entries?branch_id=${selectedBranch}`, {
      headers: { "Content-Type": "application/json", Authorization: `${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject("Fetch failed")))
      .then((res) => {
        const list = res.data || [];
        setAssessments(list);
        setFilteredAssessments(list);
        setAssessmentsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching detox assessments:", err);
        setAssessmentsLoading(false);
      });
  }, [selectedBranch]);

  useEffect(() => {
    fetchFormOptions();
    fetchRegisteredPatients();
    fetchAssessments();
  }, [fetchFormOptions, fetchRegisteredPatients, fetchAssessments]);

  // Search filter for patients
  const handleSearchPatient = (e) => {
    const val = e.target.value.toLowerCase();
    setPatientSearchText(val);
    const filtered = registeredPatients.filter(
      (item) =>
        (item.name && item.name.toLowerCase().includes(val)) ||
        (item.gks_id && String(item.gks_id).toLowerCase().includes(val)) ||
        (item.phone && String(item.phone).includes(val))
    );
    setFilteredPatients(filtered);
  };

  // Search filter for assessments
  const handleSearchAssessment = (e) => {
    const val = e.target.value.toLowerCase();
    setAssessmentSearchText(val);
    const filtered = assessments.filter((item) => {
      const patientName = (item.name || item.patient_name || "").toLowerCase();
      const subName = (item.substance_name || item.sub_name || "").toLowerCase();
      const status = (item.status || "").toLowerCase();
      const gksId = String(item.gks_id || "").toLowerCase();
      const detoxId = String(item.detox_id || item.id || "").toLowerCase();
      return (
        patientName.includes(val) ||
        subName.includes(val) ||
        status.includes(val) ||
        gksId.includes(val) ||
        detoxId.includes(val)
      );
    });
    setFilteredAssessments(filtered);
  };

  // Match a dynamic DB substance to a built-in clinical template if no custom DB parameters are configured yet
  const matchTemplateForSubstance = (subObj) => {
    if (!subObj) return null;
    const hay = `${subObj.name || ""} ${subObj.description || ""}`.toLowerCase();
    for (const key of SUBSTANCE_TAB_ORDER) {
      if (SUBSTANCE_WITHDRAWAL_SCALES[key].matchKeywords.some((kw) => hay.includes(kw))) {
        return SUBSTANCE_WITHDRAWAL_SCALES[key];
      }
    }
    return null;
  };

  // Dynamically resolve the clinical withdrawal scale for ANY live DB substance (sub_id)
  const getScaleForSubId = useCallback(
    (subId, subsOverride = null) => {
      const subs = subsOverride || formSubstances || [];
      const subObj =
        subs.find((s) => String(s.sub_id || s.id) === String(subId)) || subs[0];

      const subName = subObj?.name || "Alcohol";
      const displayTitle =
        subName.charAt(0).toUpperCase() + subName.slice(1);
      const sidKey = String(subObj?.sub_id || subObj?.id || subId || "");
      const liveDbParams = dbParametersBySubId[sidKey] || [];
      const matchedTemplate = matchTemplateForSubstance(subObj);

      // Priority 1: Live dynamic parameters configured in Settings -> Detoxification for this substance
      if (liveDbParams.length > 0) {
        return {
          key: sidKey,
          tabLabel: displayTitle,
          scaleTitle: `${displayTitle} Withdrawal Assessment Scale`,
          subtitle:
            subObj?.description && subObj.description.toLowerCase() !== subName.toLowerCase()
              ? subObj.description
              : "For each item, click/select the criteria that best describes the patient's signs or symptoms.",
          isLiveDbParams: true,
          benchmarks: matchedTemplate?.benchmarks || SUBSTANCE_WITHDRAWAL_SCALES.alcohol.benchmarks,
          sampleDemo: matchedTemplate?.sampleDemo || {},
          items: liveDbParams,
        };
      }

      // Priority 2: Built-in clinical sample scale template matching the substance name (e.g. Alcohol CIWA-Ar, Cannabis CWAS, Opioids/Drugs COWS, ATS AWQ)
      if (matchedTemplate) {
        return {
          ...matchedTemplate,
          key: sidKey,
          tabLabel: displayTitle,
          isLiveDbParams: false,
        };
      }

      // Priority 3: Build clean table item(s) directly from the substance's own DB scoring_bands
      const bands = Array.isArray(subObj?.scoring_bands) ? subObj.scoring_bands : [];
      const optionsFromBands = [];
      const seen = new Set();
      bands.forEach((b) => {
        const min = Number(b.min_score ?? 0);
        if (!seen.has(min)) {
          seen.add(min);
          optionsFromBands.push({
            value: min,
            label: b.description || `Score ${min}`,
          });
        }
      });
      if (optionsFromBands.length === 0) {
        optionsFromBands.push(
          { value: 0, label: "None / Normal" },
          { value: 1, label: "Mild symptom" },
          { value: 2, label: "Moderate symptom" },
          { value: 4, label: "Severe symptom" },
          { value: 7, label: "Very severe / acute" }
        );
      }
      optionsFromBands.sort((a, b) => a.value - b.value);

      return {
        key: sidKey,
        tabLabel: displayTitle,
        scaleTitle: `${displayTitle} Withdrawal Assessment Scale`,
        subtitle:
          subObj?.description ||
          "Click/select the severity criteria that best describes the patient's current clinical presentation.",
        isLiveDbParams: bands.length > 0,
        benchmarks: SUBSTANCE_WITHDRAWAL_SCALES.alcohol.benchmarks,
        sampleDemo: {},
        items: [
          {
            itemNo: 1,
            key: (subName || "symptom").toLowerCase().replace(/[^a-z0-9]+/g, "_"),
            title: displayTitle,
            sub: subObj?.description ? `(${subObj.description})` : "(Clinical observation)",
            options: optionsFromBands,
          },
        ],
      };
    },
    [formSubstances, dbParametersBySubId]
  );

  const buildZeroScoresForScale = (scale) => {
    const map = {};
    (scale?.items || []).forEach((item) => {
      const zeroOpt = item.options?.[0] || { value: 0, label: "" };
      map[item.key] = { score: zeroOpt.value, description: zeroOpt.label, notes: "" };
    });
    return map;
  };

  // Switch active dynamic substance tab & initialize that substance's withdrawal scale cleanly
  const handleSubstanceTabChange = (subId, isEditing = false) => {
    const updater = isEditing ? setEditData : setFormData;
    const scale = getScaleForSubId(subId);
    const freshScores = buildZeroScoresForScale(scale);

    updater((prev) => ({
      ...prev,
      sub_id: subId,
      parameterScores: freshScores,
      CIWA_rating: 0,
    }));
  };

  // Parameter score updater: updates the score for a specific parameter and re-computes total
  const handleParameterScoreChange = (paramName, scoreNum, desc, isEditing = false) => {
    const updater = isEditing ? setEditData : setFormData;
    updater((prev) => {
      const currentScores = { ...(prev.parameterScores || {}) };
      const existingNotes = currentScores[paramName]?.notes || "";
      currentScores[paramName] = {
        score: Number(scoreNum),
        description: desc,
        notes: existingNotes,
      };

      const newRating = Object.values(currentScores).reduce(
        (sum, item) => sum + (Number(item.score) || 0),
        0
      );

      return {
        ...prev,
        parameterScores: currentScores,
        CIWA_rating: newRating,
      };
    });
  };

  // Parameter notes updater (Notes / Context column)
  const handleParameterNoteChange = (paramName, noteText, isEditing = false) => {
    const updater = isEditing ? setEditData : setFormData;
    updater((prev) => {
      const currentScores = { ...(prev.parameterScores || {}) };
      const existing = currentScores[paramName] || { score: 0, description: "" };
      currentScores[paramName] = {
        ...existing,
        notes: noteText,
      };
      return {
        ...prev,
        parameterScores: currentScores,
      };
    });
  };

  // Fill realistic sample clinical demo values for the active dynamic substance tab
  const handleLoadSampleDemo = (isEditing = false) => {
    const updater = isEditing ? setEditData : setFormData;
    updater((prev) => {
      const scale = getScaleForSubId(prev.sub_id);
      const demo = scale.sampleDemo || {};
      const nextScores = {};
      let total = 0;

      scale.items.forEach((item, idx) => {
        const demoItem = demo[item.key];
        let matchedOpt;
        if (demoItem) {
          matchedOpt =
            item.options.find((o) => o.value === demoItem.score) || item.options[0];
        } else {
          // Pick a realistic mild/moderate option for dynamic DB parameters
          const pickIdx = Math.min(idx % 3 === 0 ? 2 : 1, item.options.length - 1);
          matchedOpt = item.options[pickIdx] || item.options[0];
        }
        nextScores[item.key] = {
          score: matchedOpt.value,
          description: matchedOpt.label,
          notes: demoItem?.notes || (matchedOpt.value > 0 ? "Observed during clinical check" : "Normal"),
        };
        total += Number(matchedOpt.value) || 0;
      });

      return {
        ...prev,
        parameterScores: nextScores,
        CIWA_rating: total,
        remarks:
          prev.remarks ||
          `Sample ${scale.tabLabel} withdrawal assessment: Patient cooperative, vitals monitored, supportive care initiated.`,
      };
    });
    toast.info(getTranslation("Sample demo values loaded — click any row to adjust / सैंपल डेमो डेटा लोड किया गया", lang), {
      autoClose: 2200,
    });
  };

  // Reset all scores for the active substance tab back to 0
  const handleResetScores = (isEditing = false) => {
    const updater = isEditing ? setEditData : setFormData;
    updater((prev) => {
      const scale = getScaleForSubId(prev.sub_id);
      return {
        ...prev,
        parameterScores: buildZeroScoresForScale(scale),
        CIWA_rating: 0,
      };
    });
  };

  // Open Create Modal for Patient
  const handleOpenCreateForm = async (userId) => {
    fetchFormOptions();
    const targetId = userId || currentDetoxUserId;
    if (userId) setCurrentDetoxUserId(userId);

    // Prefer dynamic DB "alcohol" substance as initial active tab if present, else first live DB substance
    const alcoholSub = (formSubstances || []).find((s) =>
      `${s.name || ""} ${s.description || ""}`.toLowerCase().includes("alcohol")
    );
    const defaultSubId =
      alcoholSub?.sub_id ||
      alcoholSub?.id ||
      formSubstances?.[0]?.sub_id ||
      formSubstances?.[0]?.id ||
      "";

    const saved = loadDraft("detoxification", targetId);
    if (saved && saved.data) {
      const subIdToUse = saved.data.sub_id || defaultSubId;
      const scale = getScaleForSubId(subIdToUse);
      setFormData({
        ...saved.data,
        sub_id: subIdToUse,
        parameterScores:
          saved.data.parameterScores && Object.keys(saved.data.parameterScores).length > 0
            ? saved.data.parameterScores
            : buildZeroScoresForScale(scale),
      });
      setDraftTimestamp(saved.savedAt);
    } else {
      const scale = getScaleForSubId(defaultSubId);
      setFormData({
        ...initialDetoxForm,
        sub_id: defaultSubId,
        parameterScores: buildZeroScoresForScale(scale),
        CIWA_rating: 0,
      });
      setDraftTimestamp(null);
    }

    setCreateModalOpen(true);

    if (targetId) {
      const token = localStorage.getItem("Authorization");
      try {
        const response = await fetch(
          `https://gks-yjdc.onrender.com/api/users/${targetId}?branch_id=${selectedBranch}`,
          { headers: { "Content-Type": "application/json", Authorization: `${token}` } }
        );
        const data = await response.json();
        if (response.ok && data.data && data.data[0]) {
          setSelectedUser(data.data[0]);
        }
      } catch (err) {
        console.error("Fetch patient details error:", err);
      }
    }
  };

  // Submit Create Assessment
  const handleSubmitAssessment = async (e) => {
    e.preventDefault();

    const effectiveSubId =
      formData.sub_id ||
      formSubstances?.[0]?.sub_id ||
      formSubstances?.[0]?.id ||
      "";

    const compulsoryFieldDefinitions = [
      {
        label: getTranslation("Primary Substance Under Assessment / मुख्य विषहरण पदार्थ", lang),
        value: effectiveSubId,
      },
    ];

    if (!validateCompulsoryFields(compulsoryFieldDefinitions, lang)) {
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem("Authorization");
    const userId = selectedUser?.user_id || selectedUser?.id || currentDetoxUserId;

    // Build assessment_result array of objects (preserving notes inside description when provided)
    const assessment_result = Object.entries(formData.parameterScores || {})
      .filter(([_, obj]) => obj && obj.score !== "" && obj.score !== undefined && obj.score !== null)
      .map(([param, obj]) => {
        const descText = obj.notes && obj.notes.trim()
          ? `${obj.description || ""} [Note: ${obj.notes.trim()}]`.trim()
          : obj.description || "";
        return {
          [param]: { [String(obj.score)]: descText },
        };
      });

    const payload = {
      user_id: Number(userId),
      sub_id: Number(effectiveSubId),
      assessment_result,
      CIWA_rating: Number(formData.CIWA_rating) || 0,
    };

    if (formData.remarks && formData.remarks.trim()) {
      payload.remarks = formData.remarks.trim();
    }
    if (formData.next_follow_date) {
      payload.next_follow_date = formData.next_follow_date;
    }

    console.log("Submitting Detoxification Payload =>", payload);

    try {
      const response = await fetch(
        `https://gks-yjdc.onrender.com/api/detoxification/create-assessment?branch_id=${selectedBranch}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `${token}` },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setIsLoading(false);
        showApiErrorAlert(
          result,
          lang,
          getTranslation("Detoxification Assessment Failed / विषहरण मूल्यांकन विफल", lang)
        );
        return;
      }

      setIsLoading(false);
      clearDraft("detoxification", userId);
      setDraftTimestamp(null);
      setCreateModalOpen(false);

      Swal.fire({
        icon: "success",
        title: getTranslation("Detoxification Assessment Created / विषहरण मूल्यांकन सफलतापूर्वक दर्ज", lang),
        text: payload.next_follow_date
          ? getTranslation("Status updated to 'Next_follow_up' with scheduled return date.", lang)
          : getTranslation("Status marked as 'Completed'.", lang),
      });

      fetchAssessments();
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      Swal.fire({
        icon: "error",
        title: getTranslation("Unexpected Error / त्रुटि", lang),
        text: getTranslation("Failed to submit assessment.", lang),
      });
    }
  };

  // Open Edit Assessment Modal
  const handleOpenEditModal = async (detoxId) => {
    fetchFormOptions();
    setIsLoading(true);
    const token = localStorage.getItem("Authorization");
    try {
      const res = await fetch(
        `https://gks-yjdc.onrender.com/api/detoxification/assessment/${detoxId}?branch_id=${selectedBranch}`,
        { headers: { "Content-Type": "application/json", Authorization: `${token}` } }
      );
      const data = await res.json();
      if (!res.ok || !data.data) {
        throw new Error("Failed to fetch assessment");
      }
      const record = data.data;

      // Parse existing assessment_result into map (extracting inline notes if present)
      const parsedItems = parseAssessmentResult(record.assessment_result);
      const editSubId =
        record.sub_id ||
        formSubstances?.[0]?.sub_id ||
        formSubstances?.[0]?.id ||
        "";
      const editScale = getScaleForSubId(editSubId);
      const scoresMap = buildZeroScoresForScale(editScale);
      parsedItems.forEach((p) => {
        const rawDesc = String(p.description || "");
        const noteMatch = rawDesc.match(/\[Note:\s*([^\]]+)\]\s*$/);
        const cleanDesc = noteMatch ? rawDesc.replace(/\s*\[Note:\s*[^\]]+\]\s*$/, "").trim() : rawDesc;
        const extractedNote = noteMatch ? noteMatch[1].trim() : "";
        scoresMap[p.parameter] = {
          score: Number(p.score) || 0,
          description: cleanDesc,
          notes: extractedNote,
        };
      });

      setEditData({
        detox_id: record.detox_id || record.id || detoxId,
        user_id: record.user_id,
        name: record.name || record.patient_name,
        sub_id: editSubId,
        CIWA_rating: Number(record.CIWA_rating) || 0,
        remarks: record.remarks || "",
        next_follow_date: record.next_follow_date
          ? new Date(record.next_follow_date).toISOString().split("T")[0]
          : "",
        parameterScores: scoresMap,
        follow_up_visit: record.follow_up_visit || record.visit_no || 1,
      });

      setEditModalOpen(true);
    } catch (err) {
      console.error(err);
      toast.error(getTranslation("Unable to load assessment details.", lang));
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Edit Assessment
  const handleUpdateAssessmentSubmit = async (e) => {
    e.preventDefault();
    if (!editData) return;

    setIsLoading(true);
    const token = localStorage.getItem("Authorization");

    const assessment_result = Object.entries(editData.parameterScores || {})
      .filter(([_, obj]) => obj && obj.score !== "" && obj.score !== undefined && obj.score !== null)
      .map(([param, obj]) => {
        const descText = obj.notes && obj.notes.trim()
          ? `${obj.description || ""} [Note: ${obj.notes.trim()}]`.trim()
          : obj.description || "";
        return {
          [param]: { [String(obj.score)]: descText },
        };
      });

    const payload = {
      sub_id: Number(editData.sub_id || formSubstances?.[0]?.sub_id || formSubstances?.[0]?.id || 1),
      assessment_result,
      CIWA_rating: Number(editData.CIWA_rating) || 0,
    };

    if (editData.remarks && editData.remarks.trim()) {
      payload.remarks = editData.remarks.trim();
    }
    if (editData.next_follow_date) {
      payload.next_follow_date = editData.next_follow_date;
    }

    try {
      const res = await fetch(
        `https://gks-yjdc.onrender.com/api/detoxification/update-assessment/${editData.detox_id}?branch_id=${selectedBranch}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `${token}` },
          body: JSON.stringify(payload),
        }
      );

      const result = await res.json().catch(() => null);

      if (!res.ok) {
        setIsLoading(false);
        showApiErrorAlert(
          result,
          lang,
          getTranslation("Detoxification Update Failed / विषहरण अद्यतन विफल", lang)
        );
        return;
      }

      setIsLoading(false);
      setEditModalOpen(false);

      Swal.fire({
        icon: "success",
        title: getTranslation("Assessment Updated Successfully / मूल्यांकन अद्यतन संपन्न", lang),
      });

      fetchAssessments();
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      toast.error("Failed to update assessment");
    }
  };

  // View Assessment Details Modal
  const handleOpenViewModal = async (detoxId) => {
    setIsLoading(true);
    const token = localStorage.getItem("Authorization");
    try {
      const res = await fetch(
        `https://gks-yjdc.onrender.com/api/detoxification/assessment/${detoxId}?branch_id=${selectedBranch}`,
        { headers: { "Content-Type": "application/json", Authorization: `${token}` } }
      );
      const data = await res.json();
      if (!res.ok || !data.data) {
        throw new Error("Failed to fetch assessment");
      }
      setViewDetoxData(data.data);
      setViewModalOpen(true);
    } catch (err) {
      console.error(err);
      toast.error(getTranslation("Unable to load assessment details.", lang));
    } finally {
      setIsLoading(false);
    }
  };

  // Soft Delete Assessment
  const handleDeleteAssessment = async (detoxId, patientName) => {
    const confirm = await Swal.fire({
      title: getTranslation("Delete Detoxification Assessment? / विषहरण मूल्यांकन हटाएं?", lang),
      text: `${getTranslation("Are you sure you want to delete the assessment for", lang)} ${patientName || "this patient"}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: getTranslation("Yes, Delete / हाँ, हटाएं", lang),
      cancelButtonText: getTranslation("Cancel / रद्द करें", lang),
    });

    if (!confirm.isConfirmed) return;

    const token = localStorage.getItem("Authorization");
    try {
      const res = await fetch(
        `https://gks-yjdc.onrender.com/api/detoxification/delete-assessment/${detoxId}?branch_id=${selectedBranch}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json", Authorization: `${token}` },
        }
      );
      if (!res.ok) {
        throw new Error("Delete failed");
      }
      toast.success(getTranslation("Assessment deleted successfully / मूल्यांकन सफलतापूर्वक हटा दिया गया", lang));
      fetchAssessments();
    } catch (err) {
      console.error(err);
      toast.error(getTranslation("Failed to delete assessment.", lang));
    }
  };

  // Print PDF handler
  const handlePrint = () => printElementAsPdf(pdfRef.current);

  const handleDownloadPDF = () => {
    const element = pdfRef.current;
    if (!element) return;
    setPdfDownloading(true);

    const patientName = viewDetoxData?.name || viewDetoxData?.patient_name || "Patient";
    const safeName = String(patientName).trim().replace(/\s+/g, "_");
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Detox_Assessment_${safeName}_#${viewDetoxData?.detox_id || "report"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        toast.success(getTranslation("Download complete! / डाउनलोड पूर्ण!", lang));
        setPdfDownloading(false);
      })
      .catch(() => setPdfDownloading(false));
  };

  // Columns for Registered Patients Table
  const tableColumnsPatients = [
    {
      name: getTranslation("GKS ID / आईडी", lang),
      selector: (row) => row.gks_id,
      sortable: true,
      center: true,
      minWidth: "120px",
      cell: (row) => (
        <span
          className="badge bg-light text-dark border px-2 py-1.5 fw-bold"
          style={{ fontSize: "12px", borderColor: "#cbd5e1" }}
        >
          {row.gks_id || "—"}
        </span>
      ),
    },
    {
      name: getTranslation("Patient Name / रोगी का नाम", lang),
      selector: (row) => row.name,
      sortable: true,
      minWidth: "180px",
      cell: (row) => (
        <span className="fw-bold text-dark" style={{ fontSize: "13.5px" }}>
          {row.name || "—"}
        </span>
      ),
    },
    {
      name: getTranslation("Phone / फ़ोन", lang),
      selector: (row) => row.phone || "—",
      sortable: true,
      center: true,
      minWidth: "140px",
      cell: (row) => (
        <span className="text-muted fw-semibold" style={{ fontSize: "13px" }}>
          {row.phone || "—"}
        </span>
      ),
    },
    {
      name: getTranslation("Action / कार्य", lang),
      center: true,
      minWidth: "180px",
      cell: (row) => (
        <div className="d-flex align-items-center justify-content-center gap-2">
          <button
            type="button"
            className="btn btn-action-icon btn-action-neutral"
            style={{
              width: "32px",
              height: "32px",
              minWidth: "32px",
              padding: "0",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "7px",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              color: "#475569",
              cursor: "pointer",
            }}
            onClick={() => handleViewUserDetails(row.id)}
            title={getTranslation("View Patient / देखना", lang)}
          >
            <Eye size={16} color="#475569" strokeWidth={2.2} />
          </button>

          <Button
            color="primary"
            size="sm"
            className="py-1 px-2.5 d-inline-flex align-items-center gap-1 shadow-sm"
            style={{ borderRadius: "6px", fontSize: "12.5px" }}
            onClick={() => handleOpenCreateForm(row.id)}
            title={getTranslation("Create Detox Assessment / विषहरण मूल्यांकन बनाएँ", lang)}
          >
            <Plus size={14} />
            <span>{getTranslation("Assess Detox", lang)}</span>
          </Button>
        </div>
      ),
    },
  ];

  // Columns for Detoxification Assessments Table
  const tableColumnsAssessments = [
    {
      name: <span style={{ whiteSpace: "nowrap", display: "inline-block" }}>{getTranslation("Detox ID / आईडी", lang)}</span>,
      selector: (row) => row.detox_id || row.id,
      sortable: true,
      center: true,
      minWidth: "125px",
      cell: (row) => (
        <span
          className="badge bg-light text-dark border px-2 py-1.5 fw-bold"
          style={{ fontSize: "12.5px", borderColor: "#cbd5e1" }}
        >
          #{row.detox_id || row.id}
        </span>
      ),
    },
    {
      name: getTranslation("Patient Name / रोगी का नाम", lang),
      selector: (row) => row.name || row.patient_name,
      sortable: true,
      minWidth: "180px",
      cell: (row) => (
        <div className="py-1">
          <div className="fw-bold text-dark" style={{ fontSize: "13.5px" }}>
            {row.name || row.patient_name || "—"}
          </div>
          <small className="text-muted fw-semibold">
            {row.custom_code || row.gks_id || (row.phone ? `Ph: ${row.phone}` : "")}
          </small>
        </div>
      ),
    },
    {
      name: getTranslation("Primary Substance / मुख्य पदार्थ", lang),
      selector: (row) => row.substance_name || row.sub_name || "—",
      sortable: true,
      center: true,
      minWidth: "170px",
      cell: (row) => (
        <Badge
          color="light"
          className="text-dark border text-capitalize px-2.5 py-1.5 fw-medium text-truncate"
          style={{ fontSize: "12.5px", maxWidth: "160px" }}
        >
          🌿 {row.substance_name || row.sub_name || "Detoxification"}
        </Badge>
      ),
    },
    {
      name: getTranslation("CIWA Rating / सीआईडब्ल्यूए स्कोर", lang),
      selector: (row) => row.CIWA_rating || 0,
      sortable: true,
      center: true,
      minWidth: "220px",
      cell: (row) => {
        const rating = Number(row.CIWA_rating) || 0;
        const sev = getCIWASeverity(rating);
        const sevText = sev.label.split("/")[0].trim();
        return (
          <div
            className="d-inline-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill"
            style={{
              backgroundColor: sev.badgeBg,
              border: `1px solid ${sev.badgeBorder}`,
              maxWidth: "100%",
              whiteSpace: "nowrap",
            }}
          >
            <span
              className="badge rounded-pill fw-bold"
              style={{
                backgroundColor: sev.badgeColor,
                color: "#ffffff",
                fontSize: "12px",
                padding: "3px 8px",
              }}
            >
              {rating}
            </span>
            <span
              className="fw-semibold text-truncate"
              style={{
                color: sev.textColor,
                fontSize: "12px",
                paddingRight: "2px",
              }}
              title={sevText}
            >
              {sevText}
            </span>
          </div>
        );
      },
    },
    {
      name: getTranslation("Visit # / विज़िट", lang),
      selector: (row) => row.follow_up_visit || row.visit_no || 1,
      sortable: true,
      center: true,
      minWidth: "100px",
      cell: (row) => (
        <span
          className="badge bg-light text-dark border px-2 py-1.5 fw-semibold"
          style={{ fontSize: "12px", borderColor: "#cbd5e1" }}
        >
          #{row.follow_up_visit || row.visit_no || 1}
        </span>
      ),
    },
    {
      name: getTranslation("Next Follow-up / अगली तिथि", lang),
      selector: (row) => row.next_follow_date || "—",
      sortable: true,
      center: true,
      minWidth: "140px",
      cell: (row) => (
        <span className="fw-medium text-secondary" style={{ fontSize: "13px" }}>
          {row.next_follow_date ? new Date(row.next_follow_date).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      name: getTranslation("Status / स्थिति", lang),
      selector: (row) => row.status || (row.next_follow_date ? "Next_follow_up" : "Completed"),
      sortable: true,
      center: true,
      minWidth: "155px",
      cell: (row) => {
        const s = row.status || (row.next_follow_date ? "Next_follow_up" : "Completed");
        if (s === "Next_follow_up") {
          return (
            <span
              className="badge px-2.5 py-1.5 fw-semibold"
              style={{
                backgroundColor: "#fef3c7",
                color: "#92400e",
                border: "1px solid #fde68a",
                fontSize: "12px",
              }}
            >
              🗓 Next Follow-Up
            </span>
          );
        }
        return (
          <span
            className="badge px-2.5 py-1.5 fw-semibold"
            style={{
              backgroundColor: "#dcfce7",
              color: "#166534",
              border: "1px solid #bbf7d0",
              fontSize: "12px",
            }}
          >
            ✓ Completed
          </span>
        );
      },
    },
    {
      name: getTranslation("Action / कार्य", lang),
      center: true,
      minWidth: "140px",
      cell: (row) => {
        const detoxId = row.detox_id || row.id;
        const patientName = row.name || row.patient_name;
        return (
          <div className="d-flex align-items-center justify-content-center gap-2">
            <button
              type="button"
              className="btn btn-action-icon btn-action-view"
              style={{
                width: "32px",
                height: "32px",
                minWidth: "32px",
                padding: "0",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "7px",
                backgroundColor: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#166534",
                cursor: "pointer",
              }}
              title={getTranslation("View Assessment / देखना", lang)}
              onClick={() => handleOpenViewModal(detoxId)}
            >
              <Eye size={16} color="#166534" strokeWidth={2.2} />
            </button>
            <button
              type="button"
              className="btn btn-action-icon btn-action-edit"
              style={{
                width: "32px",
                height: "32px",
                minWidth: "32px",
                padding: "0",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "7px",
                backgroundColor: "#ecfdf5",
                border: "1px solid #a7f3d0",
                color: "#059669",
                cursor: "pointer",
              }}
              title={getTranslation("Edit Assessment / संपादित करें", lang)}
              onClick={() => handleOpenEditModal(detoxId)}
            >
              <Edit2 size={16} color="#059669" strokeWidth={2.2} />
            </button>
            <button
              type="button"
              className="btn btn-action-icon btn-action-delete"
              style={{
                width: "32px",
                height: "32px",
                minWidth: "32px",
                padding: "0",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "7px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                cursor: "pointer",
              }}
              title={getTranslation("Delete Assessment / हटाएं", lang)}
              onClick={() => handleDeleteAssessment(detoxId, patientName)}
            >
              <Trash2 size={16} color="#dc2626" strokeWidth={2.2} />
            </button>
          </div>
        );
      },
    },
  ];

  // Render Dynamic Horizontal Substance Tab Bar directly from live DB Master Substances (/api/detoxification-substances)
  const renderSubstanceTabBar = (isEditing = false) => {
    const currentData = isEditing ? editData : formData;
    const activeSubId = String(
      currentData?.sub_id || formSubstances?.[0]?.sub_id || formSubstances?.[0]?.id || ""
    );

    return (
      <div
        className="d-flex align-items-center flex-wrap gap-1 mb-3"
        style={{
          backgroundColor: "#2c3034",
          borderRadius: "10px",
          padding: "6px 10px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
        }}
        role="tablist"
      >
        {(formSubstances || []).map((sub, index) => {
          const sid = String(sub.sub_id || sub.id);
          const isActive = activeSubId === sid;
          const displayLabel = sub.name
            ? sub.name.charAt(0).toUpperCase() + sub.name.slice(1)
            : `Substance #${sid}`;

          return (
            <Fragment key={sid}>
              {index > 0 && (
                <span
                  aria-hidden="true"
                  style={{
                    color: "#6c757d",
                    userSelect: "none",
                    padding: "0 4px",
                    fontSize: "14px",
                  }}
                >
                  |
                </span>
              )}
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleSubstanceTabChange(sub.sub_id || sub.id, isEditing)}
                style={{
                  border: "none",
                  borderRadius: "8px",
                  padding: "7px 20px",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.18s ease-in-out",
                  backgroundColor: isActive ? "#22c55e" : "transparent",
                  color: isActive ? "#ffffff" : "#cbd5e1",
                  boxShadow: isActive ? "0 2px 8px rgba(34, 197, 94, 0.35)" : "none",
                }}
                title={sub.description || displayLabel}
              >
                {displayLabel}
              </button>
            </Fragment>
          );
        })}
      </div>
    );
  };

  // Render the Clinical Withdrawal Scale Table (100% dynamic DB parameters or matching clinical template fallback)
  const renderScoringMatrix = (isEditing = false) => {
    const currentData = isEditing ? editData : formData;
    const scale = getScaleForSubId(currentData?.sub_id);
    const scores = currentData?.parameterScores || {};
    const totalScore = Number(currentData?.CIWA_rating) || 0;
    const activeBenchmark =
      scale.benchmarks.find((b) => totalScore >= b.min && totalScore <= b.max) ||
      scale.benchmarks[scale.benchmarks.length - 1];

    return (
      <div
        className="rounded-3 bg-white mb-4 overflow-hidden"
        style={{
          border: "1px solid #cce3dc",
          boxShadow: "0 2px 10px rgba(30, 101, 84, 0.07)",
        }}
      >
        {/* Clinical Scale Header Banner + Quick Demo / Reset Buttons */}
        <div
          className="px-3 py-3 d-flex justify-content-between align-items-center flex-wrap gap-2"
          style={{
            backgroundColor: "#f2faf7",
            borderBottom: "2px solid #1E6554",
          }}
        >
          <div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <h6
                className="fw-bold mb-0"
                style={{ color: "#1E6554", fontSize: "15.5px", letterSpacing: "0.2px" }}
              >
                {scale.scaleTitle}
              </h6>
              <span
                className="px-2 py-0.5 rounded-pill fw-semibold"
                style={{
                  fontSize: "10.5px",
                  backgroundColor: scale.isLiveDbParams ? "#dcfce7" : "#fef3c7",
                  color: scale.isLiveDbParams ? "#166534" : "#92400e",
                  border: `1px solid ${scale.isLiveDbParams ? "#86efac" : "#fde68a"}`,
                }}
              >
                {scale.isLiveDbParams
                  ? getTranslation("● Live DB Parameters", lang)
                  : getTranslation("● Sample Clinical Template", lang)}
              </span>
            </div>
            <small className="d-block mt-1" style={{ color: "#475569", fontSize: "12px" }}>
              {scale.subtitle}
            </small>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Button
              type="button"
              size="sm"
              color="light"
              className="border fw-semibold px-3"
              onClick={() => handleLoadSampleDemo(isEditing)}
              style={{
                borderRadius: "7px",
                fontSize: "12px",
                color: "#1E6554",
                borderColor: "#86efac",
                backgroundColor: "#ffffff",
              }}
              title={getTranslation("Load sample clinical scores to preview how this scale works", lang)}
            >
              ✨ {getTranslation("Load Sample Demo / सैंपल डेटा", lang)}
            </Button>
            <Button
              type="button"
              size="sm"
              color="light"
              className="border fw-semibold px-3"
              onClick={() => handleResetScores(isEditing)}
              style={{
                borderRadius: "7px",
                fontSize: "12px",
                color: "#475569",
                backgroundColor: "#ffffff",
              }}
            >
              ↺ {getTranslation("Reset (0)", lang)}
            </Button>
          </div>
        </div>

        {/* Clinical Assessment Table (Item # | Assessment Parameter | Score Value & Criteria | Score (Select) | Notes / Context) */}
        <div className="table-responsive">
          <table
            className="table table-bordered mb-0 align-middle detox-clinical-table"
            style={{ fontSize: "12.5px" }}
          >
            <thead>
              <tr style={{ backgroundColor: "#1E6554", color: "#ffffff" }}>
                <th
                  className="text-center py-2 px-2"
                  style={{ width: "68px", color: "#ffffff", backgroundColor: "#1E6554", whiteSpace: "nowrap" }}
                >
                  Item #
                </th>
                <th
                  className="py-2 px-3"
                  style={{ width: "22%", color: "#ffffff", backgroundColor: "#1E6554", whiteSpace: "nowrap" }}
                >
                  Assessment Parameter
                </th>
                <th
                  className="py-2 px-0"
                  style={{ width: "44%", color: "#ffffff", backgroundColor: "#1E6554" }}
                >
                  <div className="d-flex align-items-center">
                    <span
                      className="text-center px-2"
                      style={{
                        width: "90px",
                        flexShrink: 0,
                        color: "#ffffff",
                        whiteSpace: "nowrap",
                        borderRight: "1px solid rgba(255,255,255,0.28)",
                      }}
                    >
                      Score Value
                    </span>
                    <span className="px-3 flex-grow-1" style={{ color: "#ffffff", whiteSpace: "nowrap" }}>
                      Criteria Description (Click row to select)
                    </span>
                  </div>
                </th>
                <th
                  className="text-center py-2 px-2"
                  style={{ width: "110px", color: "#ffffff", backgroundColor: "#1E6554", whiteSpace: "nowrap" }}
                >
                  Score (Select)
                </th>
                <th
                  className="py-2 px-3"
                  style={{ width: "18%", color: "#ffffff", backgroundColor: "#1E6554", whiteSpace: "nowrap" }}
                >
                  Notes / Context
                </th>
              </tr>
            </thead>
            <tbody>
              {scale.items.map((item) => {
                const currentObj = scores[item.key] || {
                  score: item.options[0]?.value ?? 0,
                  description: item.options[0]?.label ?? "",
                  notes: "",
                };
                const selectedVal = Number(currentObj.score ?? 0);

                return (
                  <tr key={item.key}>
                    <td className="text-center fw-bold" style={{ backgroundColor: "#f8fbfa", color: "#1E6554", fontSize: "13px" }}>
                      {item.itemNo}
                    </td>
                    <td className="px-3 py-2" style={{ backgroundColor: "#ffffff" }}>
                      <div className="fw-bold" style={{ color: "#0f172a", fontSize: "13px", lineHeight: 1.35 }}>
                        {item.title}
                      </div>
                      <div className="mt-1" style={{ color: "#64748b", fontSize: "11.5px", lineHeight: 1.25 }}>
                        {item.sub}
                      </div>
                    </td>
                    <td className="p-0" style={{ backgroundColor: "#ffffff" }}>
                      <div className="d-flex flex-column">
                        {item.options.map((opt, optIdx) => {
                          const isSelected = selectedVal === opt.value;
                          return (
                            <div
                              key={opt.value}
                              role="button"
                              tabIndex={0}
                              onClick={() =>
                                handleParameterScoreChange(item.key, opt.value, opt.label, isEditing)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  handleParameterScoreChange(item.key, opt.value, opt.label, isEditing);
                                }
                              }}
                              className={`d-flex align-items-center detox-criteria-row ${isSelected ? "is-selected" : ""}`}
                              style={{
                                cursor: "pointer",
                                borderBottom:
                                  optIdx < item.options.length - 1 ? "1px solid #e2e8f0" : "none",
                                backgroundColor: isSelected ? "#dcfce7" : "transparent",
                              }}
                            >
                              <div
                                className="text-center py-2 px-2 fw-bold"
                                style={{
                                  width: "90px",
                                  flexShrink: 0,
                                  borderRight: "1px solid #e2e8f0",
                                  color: isSelected ? "#166534" : "#334155",
                                  backgroundColor: isSelected ? "#bbf7d0" : "#f8fafc",
                                  fontSize: "12.5px",
                                }}
                              >
                                {opt.value}
                              </div>
                              <div
                                className="py-2 px-3 flex-grow-1 d-flex justify-content-between align-items-center gap-2"
                                style={{
                                  color: isSelected ? "#14532d" : "#1e293b",
                                  fontWeight: isSelected ? 600 : 400,
                                  fontSize: "12.5px",
                                  lineHeight: 1.35,
                                }}
                              >
                                <span>{opt.label}</span>
                                {isSelected && (
                                  <span
                                    style={{
                                      color: "#16a34a",
                                      fontWeight: 700,
                                      fontSize: "13px",
                                      flexShrink: 0,
                                    }}
                                  >
                                    ✓
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="text-center px-2 py-2" style={{ backgroundColor: "#fcfcfd" }}>
                      <Input
                        type="select"
                        bsSize="sm"
                        value={String(selectedVal)}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          const matched = item.options.find((o) => o.value === v) || item.options[0];
                          handleParameterScoreChange(item.key, matched.value, matched.label, isEditing);
                        }}
                        className="text-center fw-bold mx-auto"
                        style={{
                          maxWidth: "74px",
                          borderRadius: "6px",
                          borderColor: selectedVal > 0 ? "#22c55e" : "#cbd5e1",
                          backgroundColor: selectedVal > 0 ? "#f0fdf4" : "#ffffff",
                          color: selectedVal > 0 ? "#166534" : "#1e293b",
                          fontSize: "13px",
                        }}
                      >
                        {item.options.map((opt) => (
                          <option key={opt.value} value={String(opt.value)}>
                            {opt.value}
                          </option>
                        ))}
                      </Input>
                    </td>
                    <td className="px-2 py-2" style={{ backgroundColor: "#ffffff" }}>
                      <Input
                        type="text"
                        bsSize="sm"
                        value={currentObj.notes || ""}
                        onChange={(e) =>
                          handleParameterNoteChange(item.key, e.target.value, isEditing)
                        }
                        placeholder={getTranslation("Add note... / टिप्पणी...", lang)}
                        style={{
                          borderRadius: "6px",
                          fontSize: "12px",
                          borderColor: "#e2e8f0",
                        }}
                      />
                    </td>
                  </tr>
                );
              })}

              {/* TOTAL SCORE Summary Row inside Table (matching Image 3) */}
              <tr style={{ backgroundColor: "#f2faf7" }}>
                <td
                  colSpan={3}
                  className="text-end py-2 px-3 fw-bold"
                  style={{ color: "#1E6554", fontSize: "13.5px" }}
                >
                  TOTAL SCORE (Sum of all {scale.items.length} items):
                </td>
                <td
                  className="text-center py-2 px-2 fw-bold"
                  style={{
                    backgroundColor: activeBenchmark.bg,
                    color: activeBenchmark.color,
                    fontSize: "16px",
                    border: `2px solid ${activeBenchmark.border}`,
                  }}
                >
                  {totalScore}
                </td>
                <td
                  className="py-2 px-2 fw-semibold"
                  style={{ color: activeBenchmark.color, fontSize: "12px" }}
                >
                  {activeBenchmark.label}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Score Interpretation Benchmark Footer (matching Image 3) */}
        <div className="p-3" style={{ backgroundColor: "#f8fafc", borderTop: "1px solid #cbd5e1" }}>
          <div className="fw-bold mb-2" style={{ color: "#1e293b", fontSize: "12.5px" }}>
            Score Interpretation Benchmark ({scale.tabLabel} Standard):
          </div>
          <div className="row g-2">
            {scale.benchmarks.map((b) => {
              const isCurrent = totalScore >= b.min && totalScore <= b.max;
              return (
                <div className="col-md-3 col-sm-6" key={b.range}>
                  <div
                    className="px-2 py-1 rounded d-flex align-items-center justify-content-between gap-2"
                    style={{
                      backgroundColor: isCurrent ? b.bg : "#ffffff",
                      border: isCurrent ? `1.5px solid ${b.color}` : "1px solid #e2e8f0",
                      fontSize: "12px",
                    }}
                  >
                    <div>
                      <span className="fw-bold me-2" style={{ color: b.color }}>
                        {b.range}
                      </span>
                      <span style={{ color: isCurrent ? b.color : "#334155", fontWeight: isCurrent ? 600 : 400 }}>
                        {b.label}
                      </span>
                    </div>
                    {isCurrent && (
                      <Badge pill style={{ backgroundColor: b.color, color: "#fff", fontSize: "10px" }}>
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Total Score & Withdrawal Severity Summary Card (placed after Clinical Remarks at bottom)
  const renderTotalScoreCard = (isEditing = false) => {
    const currentData = isEditing ? editData : formData;
    const rating = Number(currentData?.CIWA_rating) || 0;
    const scale = getScaleForSubId(currentData?.sub_id);
    const activeBenchmark =
      scale.benchmarks.find((b) => rating >= b.min && rating <= b.max) ||
      scale.benchmarks[scale.benchmarks.length - 1];
    const sev = getCIWASeverity(rating);

    return (
      <div
        className="d-flex justify-content-between align-items-center flex-wrap gap-2 p-3 rounded-3 border mt-3 mb-3"
        style={{
          backgroundColor: "#f8fafc",
          borderLeft: `5px solid ${activeBenchmark.color || "#198754"}`,
        }}
      >
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span
            className="fw-bold"
            style={{ color: "#1e293b", fontSize: "15px" }}
          >
            {scale.tabLabel} {getTranslation("Total Score / कुल अंक:", lang)}
          </span>
          <span
            className="px-3 py-1 rounded-pill fw-bold"
            style={{
              fontSize: "14px",
              letterSpacing: "0.2px",
              backgroundColor: activeBenchmark.bg,
              color: activeBenchmark.color,
              border: `1px solid ${activeBenchmark.border}`,
            }}
          >
            {rating} &nbsp;—&nbsp; {activeBenchmark.label}
          </span>
        </div>
        <div className="small fw-semibold" style={{ color: "#475569" }}>
          {sev.description}
        </div>
      </div>
    );
  };

  return (
    <Fragment>
      {/* Top Header */}
      <Container fluid={true} className="pt-3 pb-2">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pb-2 border-bottom">
          <div>
            <h4 className="mb-0 text-primary fw-bold">
              🌿 {getTranslation("Detoxification Module / विषहरण मॉड्यूल", lang)}
            </h4>
            <small className="text-muted">
              {getTranslation("CIWA-Ar Clinical Assessment, Withdrawal Scoring, and Patient Chained Visits", lang)}
            </small>
          </div>
          <Button
            color="outline-primary"
            size="sm"
            onClick={() => {
              fetchFormOptions();
              fetchAssessments();
              fetchRegisteredPatients();
            }}
          >
            <RefreshCw size={14} className="me-1" />
            {getTranslation("Refresh Data", lang)}
          </Button>
        </div>
      </Container>

      {/* Table 1: Registered Patient List (To Create Assessment) */}
      <Container fluid={true} className="datatables mt-2">
        <Row>
          <Col sm="12">
            <Card>
              <CardBody>
                <div className="d-flex pb-2 justify-content-between align-items-center flex-wrap gap-2">
                  <HeaderCard
                    title={getTranslation("Registered Patient List / पंजीकृत रोगी सूची", lang)}
                    className="p-0"
                  />
                </div>
                <div className="row pb-3 align-items-center">
                  <div className="col-md-5 col-12 mb-2 mb-md-0">
                    <InputGroup>
                      <Input
                        className="form-control"
                        type="text"
                        placeholder={getTranslation("Search patient by name, ID, phone... / खोजें...", lang)}
                        value={patientSearchText}
                        onChange={handleSearchPatient}
                      />
                      <span className="input-group-text">
                        <i className="fa fa-search"></i>
                      </span>
                    </InputGroup>
                  </div>
                  <div className="col-md-7 col-12 d-flex justify-content-md-end justify-content-start">
                    <TableExportButtons
                      data={filteredPatients}
                      columns={tableColumnsPatients}
                      filename="Detoxification_Patient_Registration_List"
                      title={getTranslation("Detoxification Patient Registration List", lang)}
                    />
                  </div>
                </div>

                {patientsLoading ? (
                  <div className="loading-text">
                    {getTranslation("Data is fetching from server. Please wait...", lang)}
                  </div>
                ) : (
                  <DataTable
                    data={filteredPatients}
                    columns={tableColumnsPatients}
                    striped
                    center
                    highlightOnHover
                    pagination
                    persistTableHead
                    responsive
                    customStyles={customTableStyles}
                  />
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Table 2: All Detoxification Patient Assessments List */}
      <Container fluid={true} className="datatables mt-2">
        <Row>
          <Col sm="12">
            <Card>
              <CardBody>
                <div className="d-flex pb-2 justify-content-between align-items-center flex-wrap gap-2">
                  <HeaderCard
                    title={getTranslation("All Detoxification Assessments / सभी विषहरण मूल्यांकन", lang)}
                    className="p-0"
                  />
                </div>
                <div className="row pb-3 align-items-center">
                  <div className="col-md-5 col-12 mb-2 mb-md-0">
                    <InputGroup>
                      <Input
                        className="form-control"
                        type="text"
                        placeholder={getTranslation("Search assessments by patient, substance, ID, status... / खोजें...", lang)}
                        value={assessmentSearchText}
                        onChange={handleSearchAssessment}
                      />
                      <span className="input-group-text">
                        <i className="fa fa-search"></i>
                      </span>
                    </InputGroup>
                  </div>
                  <div className="col-md-7 col-12 d-flex justify-content-md-end justify-content-start">
                    <TableExportButtons
                      data={filteredAssessments}
                      columns={tableColumnsAssessments}
                      filename="All_Detoxification_Assessments"
                      title={getTranslation("All Detoxification Assessments", lang)}
                    />
                  </div>
                </div>

                {assessmentsLoading ? (
                  <div className="loading-text">
                    {getTranslation("Data is fetching from server. Please wait...", lang)}
                  </div>
                ) : (
                  <DataTable
                    data={filteredAssessments}
                    columns={tableColumnsAssessments}
                    striped
                    center
                    highlightOnHover
                    pagination
                    persistTableHead
                    responsive
                    customStyles={customTableStyles}
                  />
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Create Detoxification Assessment Modal */}
      <CommonModal
        isOpen={createModalOpen}
        title={getTranslation("Create Detoxification Assessment (CIWA-Ar) / विषहरण मूल्यांकन प्रपत्र", lang)}
        toggler={() => setCreateModalOpen(false)}
        maxWidth="1200px"
      >
        <div className="p-3">
          <DraftNoticeBanner
            draftTimestamp={draftTimestamp}
            formKey="detoxification"
            targetId={selectedUser?.user_id || selectedUser?.id || currentDetoxUserId}
            onDiscard={() => {
              setFormData(initialDetoxForm);
              setDraftTimestamp(null);
            }}
          />

          <PatientCommonInfo
            selectedUser={selectedUser}
            labels={{
              name: getTranslation("Patient name/प्रयासक का नाम :", lang),
              sex: getTranslation("Gender/प्रयासक का लिंग :", lang),
              age: getTranslation("Age/प्रयासक का उम्र :", lang),
              date_of_admission: getTranslation("Date of Admission/प्रवेश की तिथि :", lang),
              ageValue: patientCalAge,
            }}
          />

          <Form className="mt-3" noValidate onSubmit={handleSubmitAssessment}>
            {/* Substance Tab Bar (Alcohol | Cannabis | Opioids | ATS) & Assessment Date */}
            <Row className="mb-3 g-3 align-items-end">
              <Col lg="8" md="7">
                <Label className="fw-semibold mb-1 d-block" style={{ fontSize: "13px" }}>
                  {getTranslation("Select Substance Assessment Tab / पदार्थ मूल्यांकन टैब चुनें", lang)}{" "}
                  <span className="text-danger">*</span>
                </Label>
                {renderSubstanceTabBar(false)}
              </Col>

              <Col lg="4" md="5">
                <FormGroup className="mb-3">
                  <Label className="fw-semibold" style={{ fontSize: "13px" }}>
                    {getTranslation("Date of Assessment / मूल्यांकन की तिथि", lang)}
                  </Label>
                  <div>
                    <DatePicker
                      className="form-control"
                      selected={safeDate(formData.dateOfAssessment)}
                      onChange={(date) => setFormData((prev) => ({ ...prev, dateOfAssessment: date }))}
                    />
                  </div>
                </FormGroup>
              </Col>
            </Row>

            {/* CIWA Scoring Matrix */}
            {renderScoringMatrix(false)}

            {/* Next Follow-up Date & Remarks */}
            <Row className="mb-3 g-3">
              <Col md="6">
                <FormGroup>
                  <Label className="fw-semibold">
                    {getTranslation("Next Follow-up Date (Optional) / अगली अनुवर्ती तिथि", lang)}
                  </Label>
                  <Input
                    type="date"
                    value={formData.next_follow_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, next_follow_date: e.target.value }))}
                  />
                  <small className="text-muted">
                    {formData.next_follow_date
                      ? getTranslation("Setting follow-up marks status as 'Next_follow_up' and chains the next visit.", lang)
                      : getTranslation("Leaving empty will mark this detoxification assessment as 'Completed'.", lang)}
                  </small>
                </FormGroup>
              </Col>

              <Col md="6">
                <FormGroup>
                  <Label className="fw-semibold">
                    {getTranslation("Clinical Remarks / टिप्पणियाँ", lang)}
                  </Label>
                  <VoiceTextarea
                    id="remarks"
                    name="remarks"
                    className="form-control"
                    placeholder={getTranslation("Enter treatment observations, fluid therapy, medications...", lang)}
                    value={formData.remarks}
                    onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
                  />
                </FormGroup>
              </Col>
            </Row>

            {/* Total Score Display (after Clinical Remarks at bottom) */}
            {renderTotalScoreCard(false)}

            {/* Submit & Draft Buttons */}
            <div className="d-flex align-items-center gap-3 mt-4 flex-wrap">
              <SaveDraftButton
                formKey="detoxification"
                targetId={selectedUser?.user_id || selectedUser?.id || currentDetoxUserId}
                formData={formData}
                onDraftSaved={() => setDraftTimestamp(Date.now())}
                style={{ height: "38px", padding: "6px 16px" }}
              />

              <Button color="primary" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <span className="spinner-border spinner-border-sm me-1"></span>
                ) : (
                  <CheckCircle size={16} className="me-1" />
                )}
                {getTranslation("Submit Detoxification Assessment / मूल्यांकन जमा करें", lang)}
              </Button>
            </div>
          </Form>
        </div>
      </CommonModal>

      {/* Edit Detoxification Assessment Modal */}
      <CommonModal
        isOpen={editModalOpen}
        title={getTranslation("Update Detoxification Assessment / विषहरण मूल्यांकन अपडेट करें", lang)}
        toggler={() => setEditModalOpen(false)}
        maxWidth="1200px"
      >
        <div className="p-3">
          {editData && (
            <Form noValidate onSubmit={handleUpdateAssessmentSubmit}>
              <div className="alert alert-light border py-2 px-3 mb-3 d-flex justify-content-between align-items-center">
                <div>
                  <strong>{getTranslation("Patient:", lang)}</strong> {editData.name || "Patient"} &nbsp;|&nbsp;
                  <strong>{getTranslation("Detox ID:", lang)}</strong> #{editData.detox_id} &nbsp;|&nbsp;
                  <strong>{getTranslation("Visit #:", lang)}</strong> #{editData.follow_up_visit}
                </div>
                <Badge
                  color={getCIWASeverity(editData.CIWA_rating).color}
                  className="px-2 py-1"
                >
                  CIWA: {editData.CIWA_rating}
                </Badge>
              </div>

              <Row className="mb-3 g-3 align-items-end">
                <Col lg="8" md="7">
                  <Label className="fw-semibold mb-1 d-block" style={{ fontSize: "13px" }}>
                    {getTranslation("Primary Substance Tab / मुख्य पदार्थ टैब", lang)}
                  </Label>
                  {renderSubstanceTabBar(true)}
                </Col>

                <Col lg="4" md="5">
                  <FormGroup className="mb-3">
                    <Label className="fw-semibold" style={{ fontSize: "13px" }}>
                      {getTranslation("Next Follow-up Date / अगली अनुवर्ती तिथि", lang)}
                    </Label>
                    <Input
                      type="date"
                      value={editData.next_follow_date}
                      onChange={(e) => setEditData((prev) => ({ ...prev, next_follow_date: e.target.value }))}
                    />
                  </FormGroup>
                </Col>
              </Row>

              {/* CIWA Scoring Matrix (Edit) */}
              {renderScoringMatrix(true)}

              <FormGroup className="mb-3">
                <Label className="fw-semibold">
                  {getTranslation("Clinical Remarks / टिप्पणियाँ", lang)}
                </Label>
                <VoiceTextarea
                  id="edit_remarks"
                  name="edit_remarks"
                  className="form-control"
                  value={editData.remarks}
                  onChange={(e) => setEditData((prev) => ({ ...prev, remarks: e.target.value }))}
                />
              </FormGroup>

              {/* Total Score Display (after Clinical Remarks at bottom) */}
              {renderTotalScoreCard(true)}

              <div className="d-flex justify-content-end gap-2 pt-2">
                <Button color="secondary" type="button" onClick={() => setEditModalOpen(false)}>
                  {getTranslation("Cancel / रद्द करें", lang)}
                </Button>
                <Button color="success" type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <span className="spinner-border spinner-border-sm me-1"></span>
                  ) : (
                    <CheckCircle size={16} className="me-1" />
                  )}
                  {getTranslation("Update Assessment / सहेजें", lang)}
                </Button>
              </div>
            </Form>
          )}
        </div>
      </CommonModal>

      {/* View Detoxification Assessment Details Modal */}
      <CommonModal
        isOpen={viewModalOpen}
        title={getTranslation("View Detoxification Assessment / विषहरण मूल्यांकन देखें", lang)}
        toggler={() => setViewModalOpen(false)}
        maxWidth="1000px"
      >
        <div className="p-3 p-md-4 print-area" ref={pdfRef} style={{ background: "#f8fafc" }}>
          {isLoading ? (
            <ModalLoading message={getTranslation("Loading assessment details...", lang)} />
          ) : viewDetoxData ? (
            <div>
              <PatientViewHeader data={viewDetoxData} />

              {/* Assessment Summary Card */}
              <div className="card shadow-sm border-0 mb-4 rounded-3 overflow-hidden">
                <div
                  className="card-header bg-white py-3 px-4 border-bottom d-flex align-items-center justify-content-between"
                  style={{ borderLeft: "5px solid #24695c" }}
                >
                  <h6 className="fw-bold text-dark mb-0">
                    🌿 {getTranslation("Detoxification & CIWA-Ar Evaluation Summary", lang)}
                  </h6>
                  <Badge color="light" className="text-dark border px-3 py-1">
                    Visit #{viewDetoxData.follow_up_visit || viewDetoxData.visit_no || 1}
                  </Badge>
                </div>
                <div className="card-body p-3 p-md-4">
                  <Row className="g-3">
                    <Col sm="6" lg="3">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <small className="text-muted text-uppercase fw-semibold">{getTranslation("Primary Substance", lang)}</small>
                        <div className="fw-bold text-dark mt-1 text-capitalize">
                          {viewDetoxData.substance_name || viewDetoxData.sub_name || "—"}
                        </div>
                      </div>
                    </Col>
                    <Col sm="6" lg="3">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <small className="text-muted text-uppercase fw-semibold">{getTranslation("CIWA-Ar Total Rating", lang)}</small>
                        <div className="mt-1">
                          <Badge
                            color={getCIWASeverity(viewDetoxData.CIWA_rating).color}
                            className="fs-6 px-2 py-1"
                          >
                            Score: {viewDetoxData.CIWA_rating || 0}
                          </Badge>
                        </div>
                      </div>
                    </Col>
                    <Col sm="6" lg="3">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <small className="text-muted text-uppercase fw-semibold">{getTranslation("Status", lang)}</small>
                        <div className="mt-1">
                          <Badge
                            color={viewDetoxData.status === "Next_follow_up" ? "secondary" : "success"}
                            className="p-1 px-2"
                          >
                            {viewDetoxData.status || (viewDetoxData.next_follow_date ? "Next_follow_up" : "Completed")}
                          </Badge>
                        </div>
                      </div>
                    </Col>
                    <Col sm="6" lg="3">
                      <div className="p-2 px-3 rounded-3 bg-light border">
                        <small className="text-muted text-uppercase fw-semibold">{getTranslation("Next Follow-up", lang)}</small>
                        <div className="fw-bold text-dark mt-1">
                          {viewDetoxData.next_follow_date
                            ? new Date(viewDetoxData.next_follow_date).toLocaleDateString()
                            : "—"}
                        </div>
                      </div>
                    </Col>
                  </Row>

                  {/* Severity Banner */}
                  <div className={`alert ${getCIWASeverity(viewDetoxData.CIWA_rating).bgClass} mt-3 mb-0 py-2 px-3`}>
                    <strong>{getCIWASeverity(viewDetoxData.CIWA_rating).label}</strong> &nbsp;—&nbsp;
                    <span>{getCIWASeverity(viewDetoxData.CIWA_rating).description}</span>
                  </div>
                </div>
              </div>

              {/* Detailed Parameter Scoring Breakdown */}
              <div className="card shadow-sm border-0 mb-4 rounded-3 overflow-hidden">
                <div
                  className="card-header bg-white py-3 px-4 border-bottom"
                  style={{ borderLeft: "5px solid #d56337" }}
                >
                  <h6 className="fw-bold text-dark mb-0">
                    📋 {getTranslation("Parameter Scoring Breakdown / पैरामीटर स्कोरिंग विवरण", lang)}
                  </h6>
                </div>
                <div className="card-body p-0">
                  <Table responsive striped className="mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th style={{ width: "30%" }}>{getTranslation("Parameter / लक्षण", lang)}</th>
                        <th style={{ width: "15%" }} className="text-center">{getTranslation("Score / अंक", lang)}</th>
                        <th>{getTranslation("Clinical Description / विवरण", lang)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parseAssessmentResult(viewDetoxData.assessment_result).length > 0 ? (
                        parseAssessmentResult(viewDetoxData.assessment_result).map((item, idx) => (
                          <tr key={idx}>
                            <td className="fw-semibold text-capitalize">{item.parameter}</td>
                            <td className="text-center">
                              <Badge color="primary" pill>
                                {item.score}
                              </Badge>
                            </td>
                            <td>{item.description || "—"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="text-center text-muted py-3">
                            {getTranslation("No individual parameter breakdown recorded.", lang)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </div>

              {/* Remarks Card */}
              {viewDetoxData.remarks && (
                <div className="card shadow-sm border-0 mb-3 rounded-3 overflow-hidden">
                  <div
                    className="card-header bg-white py-2 px-3 border-bottom"
                    style={{ borderLeft: "5px solid #6c757d" }}
                  >
                    <h6 className="fw-bold text-dark mb-0">{getTranslation("Clinical Remarks / टिप्पणियाँ", lang)}</h6>
                  </div>
                  <div className="card-body p-3">
                    <p className="mb-0 text-dark">{viewDetoxData.remarks}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-5">
              <p className="text-muted">{getTranslation("No assessment data available.", lang)}</p>
            </div>
          )}
        </div>

        <ModalActionButtons
          onClose={() => setViewModalOpen(false)}
          onPrint={handlePrint}
          onDownload={handleDownloadPDF}
          isDownloading={pdfDownloading}
          downloadText={getTranslation("Download PDF / डाउनलोड करें", lang)}
        />
      </CommonModal>

      {/* User Details Modal */}
      <UserDetailsModal
        isOpen={viewUserDetailsModal}
        userId={selectedViewUserId}
        toggler={() => setViewUserDetailsModal(false)}
      />
    </Fragment>
  );
};

export default Detoxification;
