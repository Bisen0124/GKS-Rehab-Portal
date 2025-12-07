import React, { useEffect, useState } from "react";
import { useLang } from "../contexts/LangContext";
import { translateApiText } from "../utils/apiTranslator";

export default function ApiTranslated({ text }) {
  const { lang } = useLang();
  const [output, setOutput] = useState(text);

  useEffect(() => {
    async function doTranslate() {
      if (lang === "en") {
        setOutput(text);
      } else {
        const translated = await translateApiText(text, lang);
        setOutput(translated);
      }
    }

    doTranslate();
  }, [lang, text]);

  return <>{output}</>;
}
