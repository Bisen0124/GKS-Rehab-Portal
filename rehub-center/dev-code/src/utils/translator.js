// src/utils/translator.js
export function splitBilingual(text) {
  const s = text == null ? "" : String(text).trim();
  // preserve simple trailing punctuation like ":" or "：" or " *"
  const trailingMatch = s.match(/([:：*]+)\s*$/);
  const trailing = trailingMatch ? trailingMatch[1].charAt(0) : "";
  const core = s.replace(/([:：*]+)\s*$/, "").trim();

  // Only split on the bilingual "/" separator right before Devanagari (Hindi) text,
  // so English units & terms containing "/" (like "mg/dL", "g/dL", "WhatsApp/SMS", "PDF/Image") stay intact.
  const firstDevanagariIdx = core.search(/[\u0900-\u097F]/);
  let idx = -1;
  if (firstDevanagariIdx !== -1) {
    idx = core.lastIndexOf("/", firstDevanagariIdx);
  }

  if (idx === -1) {
    const cleanCore = core.replace(/[:：]+$/, "").trim();
    return { en: cleanCore + trailing, hi: cleanCore + trailing };
  }
  const en = core.slice(0, idx).trim().replace(/[:：]+$/, "").trim();
  const hi = core.slice(idx + 1).trim().replace(/[:：]+$/, "").trim();
  return { en: en + (trailing || ""), hi: hi + (trailing || "") };
}

export function getTranslation(text, lang = "en") {
  const { en, hi } = splitBilingual(text);
  return lang === "hi" ? hi : en;
}
