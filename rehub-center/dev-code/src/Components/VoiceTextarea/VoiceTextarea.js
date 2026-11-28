import React, { useRef, useState } from "react";
import { useLang } from "../../contexts/LangContext";
import { transliterateTextToHindi } from "../../utils/hindiTranslator";

const VoiceTextarea = ({
  label,
  name,
  value,
  onChange,
  lang = "",
  rows = 3,
  placeholder = "",
  disableHindiTyping = false,
}) => {
  const textareaRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [phoneticEnabled, setPhoneticEnabled] = useState(true);
  const langCtx = useLang();
  const contextLang = langCtx?.lang || "en";
  const isHindiMode = !disableHindiTyping && (lang ? lang.startsWith("hi") : contextLang === "hi");

  const emitChange = (nextVal) => {
    if (typeof onChange === "function") {
      onChange({
        target: {
          name,
          value: nextVal,
        },
      });
    }
  };

  const handleTextChange = async (e) => {
    const rawVal = e.target.value;
    // Update immediately so typing feels instant
    onChange(e);

    if (isHindiMode && phoneticEnabled && /[A-Za-z]+[\s.,?!;:\n]$/.test(rawVal)) {
      const converted = await transliterateTextToHindi(rawVal, { transliterateAll: false });
      if (converted !== rawVal) {
        emitChange(converted);
      }
    }
  };

  const handleBlur = async (e) => {
    const rawVal = e.target.value;
    if (isHindiMode && phoneticEnabled && /[A-Za-z]/.test(rawVal)) {
      const converted = await transliterateTextToHindi(rawVal, { transliterateAll: true });
      if (converted !== rawVal) {
        emitChange(converted);
      }
    }
  };

  const handleSpeech = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang || (contextLang === "hi" ? "hi-IN" : "en-IN");
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      const spokenText = event.results[0][0].transcript;

      emitChange((value || "") + (value ? " " : "") + spokenText);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      alert("Mic permission denied or error occurred!");
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  return (
    <div className="mb-3 position-relative" style={{ position: "relative" }}>
      {label && (
        <label className="form-label fw-semibold text-dark mb-1" style={{ fontSize: "13px" }}>
          {label}
        </label>
      )}

      <div style={{ position: "relative" }}>
        <textarea
          ref={textareaRef}
          name={name}
          rows={rows}
          value={value || ""}
          placeholder={
            placeholder ||
            (isHindiMode && phoneticEnabled
              ? "हिन्दी में टाइप करें (e.g. mera naam + Space)..."
              : "")
          }
          onChange={handleTextChange}
          onBlur={handleBlur}
          className="form-control"
          style={{
            paddingRight: isHindiMode ? "86px" : "46px",
            borderRadius: "10px",
            fontSize: "13.5px",
          }}
        />

        {isHindiMode && (
          <button
            type="button"
            onClick={() => setPhoneticEnabled((prev) => !prev)}
            title={
              phoneticEnabled
                ? "Hindi phonetic typing ON (click for English)"
                : "Hindi phonetic typing OFF (click for Hindi)"
            }
            style={{
              position: "absolute",
              right: "44px",
              bottom: "8px",
              height: "32px",
              padding: "0 7px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: phoneticEnabled ? "#e6f4ea" : "#f1f5f9",
              border: phoneticEnabled ? "1px solid #1e7e34" : "1px solid #cbd5e1",
              color: phoneticEnabled ? "#1e7e34" : "#64748b",
              cursor: "pointer",
              fontSize: "11px",
              fontWeight: 700,
              zIndex: 3,
            }}
          >
            {phoneticEnabled ? "हिं" : "EN"}
          </button>
        )}

        <button
          type="button"
          onClick={handleSpeech}
          title={isListening ? "Listening... / सुन रहा है..." : "Click to speak / बोलने के लिए क्लिक करें"}
          className={`btn btn-sm voice-mic-btn ${isListening ? "listening" : ""}`}
          style={{
            position: "absolute",
            right: "8px",
            bottom: "8px",
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isListening ? "#fee2e2" : "#f1f5f9",
            border: isListening ? "1px solid #ef4444" : "1px solid #cbd5e1",
            color: isListening ? "#ef4444" : "#475569",
            cursor: "pointer",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            transition: "all 0.2s ease",
            padding: 0,
            zIndex: 3,
          }}
        >
          <span style={{ fontSize: "14px", lineHeight: 1 }}>{isListening ? "🔴" : "🎙️"}</span>
        </button>
      </div>
    </div>
  );
};

export default VoiceTextarea;
