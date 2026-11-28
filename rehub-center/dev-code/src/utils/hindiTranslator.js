// src/utils/hindiTranslator.js
// Reusable Hindi phonetic transliteration (typing) + bidirectional Hindi <-> English translation utility

const DEVANAGARI_REGEX = /[\u0900-\u097F]/;
const LATIN_REGEX = /[A-Za-z]/;

// In-memory caches to keep repeated lookups instantaneous
const translationMemoryCache = new Map();
const translitMemoryCache = new Map();

const TRANSLATION_CACHE_PREFIX = "gks_tr_v1_";
const TRANSLIT_CACHE_PREFIX = "gks_tl_v1_";

export function hasDevanagari(text) {
  return typeof text === "string" && DEVANAGARI_REGEX.test(text);
}

export function hasLatin(text) {
  return typeof text === "string" && LATIN_REGEX.test(text);
}

// Keys whose values are IDs, codes, dates, enums, or booleans and must NEVER be machine-translated
const NON_TRANSLATABLE_KEYS = new Set([
  "id",
  "user_id",
  "gks_id",
  "gen_fam_id",
  "gen_family_id",
  "branch_id",
  "uid",
  "genUID",
  "custom_code",
  "email",
  "phone",
  "mobile",
  "secondary_phone",
  "whatsapp_no",
  "password",
  "isRole",
  "aadhar_number",
  "aadhar",
  "dob",
  "date_of_birth",
  "patient_type",
  "dependent_to",
  "ward_type_id",
  "gender",
  "profile_pic",
  "profile_image",
  "admission_form",
  "id_proof",
  "date_of_admission",
  "date_of_filling",
  "dateOfAdmission",
  "dateOfFormFilling",
  "created_at",
  "updated_at",
  "isActive",
  "status",
  "marital_status",
  "relationship_status",
  "how_many_times",
  "patient_monthly_income",
  "family_monthly_income",
  "daily_expense_on_substance",
  "year",
  "days_of_sobriety",
  "age",
  "source_family",
  "source_friends",
  "source_borrowings",
  "source_theft",
  "source_theft_home",
  "source_bluff",
  "source_illegal",
  "source_other",
  "source_self_earnings",
  "dependent_friends_count",
  "is_due_to_dependency",
  "patient_behavior",
  "alc",
  "drug",
  "psych",
]);

const EXACT_ENUM_VALUES = new Set([
  "Yes",
  "No",
  "Single",
  "Married",
  "Separated",
  "Widower",
  "Committed",
  "Broke up",
  "With Family",
  "Joint Family",
  "Others",
  "Other",
  "Alone",
  "In addict Community",
  "With Friends",
  "Physically",
  "Emotionally",
  "Sexually",
  "Male",
  "Female",
  "N/A",
  "NA",
  "null",
  "undefined",
]);

export function shouldSkipTranslation(value, key = "", targetLang = "en") {
  if (typeof value !== "string") return true;
  const trimmed = value.trim();
  if (!trimmed) return true;

  if (key && NON_TRANSLATABLE_KEYS.has(key)) return true;
  if (key && (key.endsWith("_id") || key.endsWith("_date") || key.startsWith("date_"))) {
    return true;
  }

  // Skip exact enum / code / date / numeric / URL / email strings
  if (EXACT_ENUM_VALUES.has(trimmed)) return true;
  if (/^[0-9.,:/\-+\s₹$%]+$/.test(trimmed)) return true;
  if (/^GKS_/i.test(trimmed)) return true;
  if (/^https?:\/\//i.test(trimmed)) return true;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return true;
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return true;

  // Skip if already in the target script
  if (targetLang === "en" && !hasDevanagari(trimmed)) return true;
  if (targetLang === "hi" && hasDevanagari(trimmed) && !hasLatin(trimmed)) return true;

  return false;
}

function readLocalCache(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocalCache(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore quota errors
  }
}

/**
 * Bidirectional Hindi <-> English text translation using Google Translate public endpoint
 * with MyMemory fallback and localStorage + memory caching.
 */
export async function translateText(text, targetLang = "en") {
  if (typeof text !== "string") return text;
  const trimmed = text.trim();
  if (!trimmed) return text;

  const target = targetLang === "hi" ? "hi" : "en";
  if (target === "en" && !hasDevanagari(trimmed)) return text;
  if (target === "hi" && hasDevanagari(trimmed) && !hasLatin(trimmed)) return text;

  const cacheKey = `${TRANSLATION_CACHE_PREFIX}${target}_${trimmed}`;
  if (translationMemoryCache.has(cacheKey)) {
    return translationMemoryCache.get(cacheKey);
  }
  const stored = readLocalCache(cacheKey);
  if (stored) {
    translationMemoryCache.set(cacheKey, stored);
    return stored;
  }

  const source = target === "en" ? "hi" : "en";

  // 1) Primary: Google Translate public client endpoint (CORS-friendly, fast, accurate)
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(
      trimmed
    )}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0]
          .map((part) => (Array.isArray(part) ? part[0] : ""))
          .join("")
          .trim();
        if (translated) {
          translationMemoryCache.set(cacheKey, translated);
          writeLocalCache(cacheKey, translated);
          // Also cache reverse mapping so switching back restores the original phrasing instantly
          const reverseTarget = target === "en" ? "hi" : "en";
          const reverseKey = `${TRANSLATION_CACHE_PREFIX}${reverseTarget}_${translated}`;
          if (!translationMemoryCache.has(reverseKey)) {
            translationMemoryCache.set(reverseKey, trimmed);
            writeLocalCache(reverseKey, trimmed);
          }
          return translated;
        }
      }
    }
  } catch {
    // Fall through to MyMemory fallback
  }

  // 2) Fallback: MyMemory free public API
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      trimmed
    )}&langpair=${source}|${target}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const translated = data?.responseData?.translatedText?.trim();
      if (translated && !translated.toUpperCase().includes("MYMEMORY WARNING")) {
        translationMemoryCache.set(cacheKey, translated);
        writeLocalCache(cacheKey, translated);
        return translated;
      }
    }
  } catch {
    // Return original text on network failure
  }

  return text;
}

/**
 * Translates a single form field value while preserving structured enum prefixes
 * used in Gen Family (living_situation, abuse_history, with_whom_spend_time).
 */
export async function translateStructuredField(key, value, targetLang = "en") {
  if (typeof value !== "string" || !value.trim()) return value;

  // living_situation: "Others: <custom text>"
  if (key === "living_situation") {
    if (EXACT_ENUM_VALUES.has(value.trim())) return value;
    if (value.startsWith("Others:")) {
      const rest = value.slice("Others:".length).trim();
      if (!rest) return value;
      const tr = await translateText(rest, targetLang);
      return `Others: ${tr}`;
    }
    return translateText(value, targetLang);
  }

  // abuse_history: "Physically, Emotionally | <description>"
  if (key === "abuse_history") {
    const pipeIdx = value.indexOf("|");
    if (pipeIdx !== -1) {
      const prefix = value.slice(0, pipeIdx).trim();
      const desc = value.slice(pipeIdx + 1).trim();
      if (!desc) return value;
      const tr = await translateText(desc, targetLang);
      return `${prefix} | ${tr}`;
    }
    // Check if it's only comma-separated enum tokens
    const tokens = value.split(",").map((t) => t.trim()).filter(Boolean);
    if (tokens.length > 0 && tokens.every((t) => EXACT_ENUM_VALUES.has(t))) {
      return value;
    }
    return translateText(value, targetLang);
  }

  // with_whom_spend_time: "Alone, With Family, Other: <custom text>"
  if (key === "with_whom_spend_time") {
    const otherMatch = value.match(/(^|,\s*)Other:\s*(.+)$/i);
    if (otherMatch) {
      const customText = otherMatch[2].trim();
      if (!customText) return value;
      const tr = await translateText(customText, targetLang);
      return value.replace(/(^|,\s*)Other:\s*.+$/i, `$1Other: ${tr}`);
    }
    const tokens = value.split(",").map((t) => t.trim()).filter(Boolean);
    if (tokens.length > 0 && tokens.every((t) => EXACT_ENUM_VALUES.has(t))) {
      return value;
    }
    return translateText(value, targetLang);
  }

  if (shouldSkipTranslation(value, key, targetLang)) return value;
  return translateText(value, targetLang);
}

/**
 * Recursively translates all free-text fields in a form state object or API record
 * into targetLang ("en" or "hi"), preserving IDs, dates, numbers, and enum tokens.
 */
export async function translateFormDataObject(obj, targetLang = "en") {
  if (!obj || typeof obj !== "object") return obj;

  // Deep clone via recursive traversal while collecting translation tasks
  const tasks = [];

  function isPlainObject(val) {
    if (!val || typeof val !== "object") return false;
    if (val instanceof Date || val instanceof RegExp) return false;
    if (typeof File !== "undefined" && val instanceof File) return false;
    if (typeof Blob !== "undefined" && val instanceof Blob) return false;
    const proto = Object.getPrototypeOf(val);
    return proto === Object.prototype || proto === null;
  }

  function cloneAndCollect(node, parentKey = "") {
    if (Array.isArray(node)) {
      return node.map((item) => {
        if (typeof item === "string") {
          const holder = { val: item };
          if (!shouldSkipTranslation(item, parentKey, targetLang)) {
            tasks.push(async () => {
              holder.val = await translateStructuredField(parentKey, item, targetLang);
            });
          }
          return holder;
        }
        return cloneAndCollect(item, parentKey);
      });
    }

    if (isPlainObject(node)) {
      const out = {};
      for (const [k, v] of Object.entries(node)) {
        if (typeof v === "string") {
          const holder = { val: v };
          if (
            k === "living_situation" ||
            k === "abuse_history" ||
            k === "with_whom_spend_time" ||
            !shouldSkipTranslation(v, k, targetLang)
          ) {
            tasks.push(async () => {
              holder.val = await translateStructuredField(k, v, targetLang);
            });
          }
          out[k] = holder;
        } else if (Array.isArray(v) || isPlainObject(v)) {
          out[k] = cloneAndCollect(v, k);
        } else {
          out[k] = v;
        }
      }
      return out;
    }

    return node;
  }

  function unwrap(node) {
    if (Array.isArray(node)) {
      return node.map((item) =>
        isPlainObject(item) && Object.keys(item).length === 1 && "val" in item
          ? item.val
          : unwrap(item)
      );
    }
    if (isPlainObject(node)) {
      if (Object.keys(node).length === 1 && "val" in node) return node.val;
      const out = {};
      for (const [k, v] of Object.entries(node)) {
        out[k] = unwrap(v);
      }
      return out;
    }
    return node;
  }

  const skeleton = cloneAndCollect(obj);

  // Run translation tasks with bounded concurrency (6 at a time)
  const CONCURRENCY = 6;
  let idx = 0;
  async function worker() {
    while (idx < tasks.length) {
      const current = idx++;
      await tasks[current]();
    }
  }

  if (tasks.length > 0) {
    const workers = Array.from(
      { length: Math.min(CONCURRENCY, tasks.length) },
      () => worker()
    );
    await Promise.all(workers);
  }

  return unwrap(skeleton);
}

// ---------------- Phonetic Hindi Transliteration (for Hindi typing) ----------------

/**
 * Lightweight offline fallback phonetic transliterator (Latin -> Devanagari)
 * used only if Google Input Tools API is unreachable.
 */
function basicPhoneticFallback(word) {
  const vowels = {
    aa: "आ",
    ee: "ई",
    oo: "ऊ",
    ai: "ऐ",
    au: "औ",
    a: "अ",
    i: "इ",
    u: "उ",
    e: "ए",
    o: "ओ",
  };
  const matras = {
    aa: "ा",
    ee: "ी",
    oo: "ू",
    ai: "ै",
    au: "ौ",
    a: "",
    i: "ि",
    u: "ु",
    e: "े",
    o: "ो",
  };
  const consonants = {
    ksh: "क्ष",
    gya: "ज्ञ",
    kh: "ख",
    gh: "घ",
    chh: "छ",
    ch: "च",
    jh: "झ",
    th: "थ",
    dh: "ध",
    ph: "फ",
    bh: "भ",
    sh: "श",
    ng: "ङ",
    k: "क",
    g: "ग",
    j: "ज",
    t: "त",
    d: "द",
    n: "न",
    p: "प",
    f: "फ",
    b: "ब",
    m: "म",
    y: "य",
    r: "र",
    l: "ल",
    v: "व",
    w: "व",
    s: "स",
    h: "ह",
    z: "ज़",
    q: "क",
    c: "क",
    x: "क्स",
  };

  const s = word.toLowerCase();
  let out = "";
  let i = 0;
  while (i < s.length) {
    let matched = false;
    // Try consonant (3, 2, 1 chars)
    for (const len of [3, 2, 1]) {
      const sub = s.slice(i, i + len);
      if (consonants[sub]) {
        out += consonants[sub];
        i += len;
        // Check following vowel for matra
        for (const vlen of [2, 1]) {
          const vsub = s.slice(i, i + vlen);
          if (matras[vsub] !== undefined) {
            out += matras[vsub];
            i += vlen;
            break;
          }
        }
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // Try standalone vowel
    for (const vlen of [2, 1]) {
      const vsub = s.slice(i, i + vlen);
      if (vowels[vsub]) {
        out += vowels[vsub];
        i += vlen;
        matched = true;
        break;
      }
    }
    if (!matched) {
      out += s[i];
      i += 1;
    }
  }
  return out || word;
}

/**
 * Transliterates a single English/Roman word (e.g. "namaste", "sharab")
 * into Devanagari Hindi (e.g. "नमस्ते", "शराब") using Google Input Tools.
 */
export async function transliterateWordToHindi(word) {
  if (!word || !/^[A-Za-z]+$/.test(word)) return word;
  const lower = word.toLowerCase();
  const cacheKey = `${TRANSLIT_CACHE_PREFIX}${lower}`;

  if (translitMemoryCache.has(cacheKey)) {
    return translitMemoryCache.get(cacheKey);
  }
  const stored = readLocalCache(cacheKey);
  if (stored) {
    translitMemoryCache.set(cacheKey, stored);
    return stored;
  }

  try {
    const url = `https://inputtools.google.com/request?text=${encodeURIComponent(
      word
    )}&itc=hi-t-i0-und&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data?.[0] === "SUCCESS" && data?.[1]?.[0]?.[1]?.[0]) {
        const hindiWord = data[1][0][1][0];
        translitMemoryCache.set(cacheKey, hindiWord);
        writeLocalCache(cacheKey, hindiWord);
        return hindiWord;
      }
    }
  } catch {
    // Fallback to offline phonetic rules
  }

  const fallback = basicPhoneticFallback(word);
  translitMemoryCache.set(cacheKey, fallback);
  return fallback;
}

/**
 * Transliterates trailing or all Latin words in a string into Hindi.
 * - triggerOnDelimiter: if true, transliterates the word immediately preceding a trailing space/punctuation.
 * - transliterateAll: if true (e.g. onBlur), transliterates every remaining Latin word in the text.
 */
export async function transliterateTextToHindi(text, { transliterateAll = false } = {}) {
  if (typeof text !== "string" || !hasLatin(text)) return text;

  if (transliterateAll) {
    const tokens = text.split(/([A-Za-z]+)/);
    const converted = await Promise.all(
      tokens.map((tok) => (/^[A-Za-z]+$/.test(tok) ? transliterateWordToHindi(tok) : tok))
    );
    return converted.join("");
  }

  // Triggered when user finishes a word with space / newline / punctuation
  const match = text.match(/^(.*?)([A-Za-z]+)([\s.,?!;:\n])$/s);
  if (!match) return text;
  const [, prefix, word, delim] = match;
  const hindiWord = await transliterateWordToHindi(word);
  return `${prefix}${hindiWord}${delim}`;
}
