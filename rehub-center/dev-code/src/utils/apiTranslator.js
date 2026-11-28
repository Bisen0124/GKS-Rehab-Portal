import { translateText } from "./hindiTranslator";

export async function translateApiText(text, targetLang = "hi") {
  if (!text) return "";
  return translateText(String(text), targetLang);
}
