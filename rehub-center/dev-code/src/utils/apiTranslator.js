export async function translateApiText(text, targetLang = "hi") {
    if (!text) return "";
  
    const cacheKey = `translate_api_${targetLang}_${text}`;
  
    const cached = localStorage.getItem(cacheKey);
    if (cached) return cached;
  
    try {
      const response = await fetch("https://libretranslate.de/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: text,
          source: "en",
          target: targetLang,
          format: "text"
        })
      });
  
      const data = await response.json();
      const translated = data.translatedText;
  
      localStorage.setItem(cacheKey, translated);
  
      return translated;
  
    } catch (err) {
      console.error("Translation failed:", err);
      return text;
    }
  }
  