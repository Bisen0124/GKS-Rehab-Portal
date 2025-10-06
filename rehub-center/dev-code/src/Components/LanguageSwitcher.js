// src/components/LanguageSwitcher.js
import React from "react";
import { useLang } from "../contexts/LangContext";

export default function LanguageSwitcher() {
  const { lang, setLang } = useLang();

  return (
    <div style={{ display: "inline-flex", gap: 8 }}>
      <button onClick={() => setLang("en")} disabled={lang === "en"}>English</button>
      <button onClick={() => setLang("hi")} disabled={lang === "hi"}>हिन्दी</button>
    </div>
  );
}
