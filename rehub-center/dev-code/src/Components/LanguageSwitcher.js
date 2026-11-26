// src/components/LanguageSwitcher.js
import React from "react";
import { useLang } from "../contexts/LangContext";

export default function LanguageSwitcher({ compact = false, className = "" }) {
  const { lang, setLang } = useLang();

  const btnPadding = compact ? "4px 9px" : "5px 11px";
  const btnFontSize = compact ? "11.5px" : "12.5px";
  const btnRadius = compact ? "6px" : "7px";

  return (
    <div
      className={`language-switcher-pills d-inline-flex align-items-center p-1 ${className}`.trim()}
      style={{
        backgroundColor: "#f1f5f9",
        borderRadius: compact ? "8px" : "10px",
        border: "1px solid #e2e8f0",
        gap: "4px",
        flexShrink: 0,
      }}
    >
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-label="Switch language to English"
        style={{
          border: "none",
          padding: btnPadding,
          borderRadius: btnRadius,
          fontSize: btnFontSize,
          lineHeight: 1.2,
          whiteSpace: "nowrap",
          fontWeight: lang === "en" ? "700" : "500",
          backgroundColor: lang === "en" ? "#24695c" : "transparent",
          color: lang === "en" ? "#ffffff" : "#475569",
          boxShadow: lang === "en" ? "0 2px 6px rgba(36, 105, 92, 0.25)" : "none",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      >
        {compact ? "EN" : "English"}
      </button>

      <button
        type="button"
        onClick={() => setLang("hi")}
        aria-label="Switch language to Hindi"
        style={{
          border: "none",
          padding: btnPadding,
          borderRadius: btnRadius,
          fontSize: btnFontSize,
          lineHeight: 1.2,
          whiteSpace: "nowrap",
          fontWeight: lang === "hi" ? "700" : "500",
          backgroundColor: lang === "hi" ? "#24695c" : "transparent",
          color: lang === "hi" ? "#ffffff" : "#475569",
          boxShadow: lang === "hi" ? "0 2px 6px rgba(36, 105, 92, 0.25)" : "none",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      >
        {compact ? "हिं" : "हिन्दी"}
      </button>
    </div>
  );
}
