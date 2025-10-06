// src/contexts/LangContext.js
import React, { createContext, useContext, useEffect, useState } from "react";

const LangContext = createContext();

export function LangProvider({ children, defaultLang = "en" }) {
  const [lang, setLang] = useState(() => localStorage.getItem("appLang") || defaultLang);

  useEffect(() => {
    localStorage.setItem("appLang", lang);
  }, [lang]);

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
