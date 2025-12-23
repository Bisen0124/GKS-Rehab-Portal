import React, { useRef } from "react";

const VoiceTextarea = ({ label, name, value, onChange, lang = "", rows = 3 }) => {
  const textareaRef = useRef(null);

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
    };

    recognition.onerror = () => {
      alert("Mic permission denied or error occurred!");
    };
  };

  return (
    <div className="mb-3 position-relative" style={{ position: "relative" }}>
      {label && <label className="form-label">{label}</label>}

      <textarea
        ref={textareaRef}
        name={name}
        rows={rows}
        value={value}
        onChange={onChange}
        className="form-control"
      />

      <button
        type="button"
        onClick={handleSpeech}
        className="btn btn-light"
        style={{
          position: "absolute",
          right: "10px",
          bottom: "10px",
        }}
      >
        🎤
      </button>
    </div>
  );
};

export default VoiceTextarea;
