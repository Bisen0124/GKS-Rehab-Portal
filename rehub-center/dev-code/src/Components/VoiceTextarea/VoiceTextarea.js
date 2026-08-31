import React, { useRef, useState } from "react";

const VoiceTextarea = ({ label, name, value, onChange, lang = "", rows = 3 }) => {
  const textareaRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  const handleSpeech = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      const spokenText = event.results[0][0].transcript;

      // Update the specific field dynamically
      onChange({
        target: {
          name,
          value: value + (value ? " " : "") + spokenText,
        },
      });
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
          onChange={onChange}
          className="form-control"
          style={{
            paddingRight: "46px",
            borderRadius: "10px",
            fontSize: "13.5px",
          }}
        />

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
