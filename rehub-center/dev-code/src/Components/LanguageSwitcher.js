// src/components/LanguageSwitcher.js
import React from "react";
import { useLang } from "../contexts/LangContext";

export default function LanguageSwitcher() {
  const { lang, setLang } = useLang();

  return (
    <div
      className="language-switcher-pills d-inline-flex align-items-center p-1"
      style={{
        backgroundColor: "#f1f5f9",
        borderRadius: "10px",
        border: "1px solid #e2e8f0",
        gap: "4px",
      }}
    >
      <button
        type="button"
        onClick={() => setLang("en")}
        style={{
          border: "none",
          padding: "5px 12px",
          borderRadius: "7px",
          fontSize: "12.5px",
          fontWeight: lang === "en" ? "700" : "500",
          backgroundColor: lang === "en" ? "#24695c" : "transparent",
          color: lang === "en" ? "#ffffff" : "#475569",
          boxShadow: lang === "en" ? "0 2px 6px rgba(36, 105, 92, 0.25)" : "none",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      >
        English
      </button>

      <button
        type="button"
        onClick={() => setLang("hi")}
        style={{
          border: "none",
          padding: "5px 12px",
          borderRadius: "7px",
          fontSize: "12.5px",
          fontWeight: lang === "hi" ? "700" : "500",
          backgroundColor: lang === "hi" ? "#24695c" : "transparent",
          color: lang === "hi" ? "#ffffff" : "#475569",
          boxShadow: lang === "hi" ? "0 2px 6px rgba(36, 105, 92, 0.25)" : "none",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      >
        हिन्दी
      </button>
    </div>
  );
}
