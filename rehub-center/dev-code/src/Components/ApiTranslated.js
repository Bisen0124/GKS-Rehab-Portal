import React, { useEffect, useState } from "react";
import { useLang } from "../contexts/LangContext";
import { translateText } from "../utils/hindiTranslator";

export default function ApiTranslated({ text }) {
  const { lang } = useLang();
  const [output, setOutput] = useState(text);

  useEffect(() => {
    let cancelled = false;
    async function doTranslate() {
      if (text == null || text === "") {
        if (!cancelled) setOutput("");
        return;
      }
      const str = String(text);
      const translated = await translateText(str, lang);
      if (!cancelled) {
        setOutput(translated);
      }
    }

    doTranslate();
    return () => {
      cancelled = true;
    };
  }, [lang, text]);

  return <>{output}</>;
}
