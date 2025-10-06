// src/components/Translated.js
import React from "react";
import { useLang } from "../contexts/LangContext";
import { getTranslation } from "../utils/translator";

export default function Translated({ text, children }) {
  const { lang } = useLang();
  const source = text ?? (typeof children === "string" ? children : "");
  return <>{getTranslation(source, lang)}</>;
}
