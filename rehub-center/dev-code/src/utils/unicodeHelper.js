// src/utils/unicodeHelper.js
// Guards against Latin-1 '?' corruption of Devanagari/Hindi & Unicode text across API requests/responses.
import {
  hasDevanagari,
  translateFormDataObject,
  translateStructuredField,
} from "./hindiTranslator";

const CACHE_KEY = "gks_utf8_field_cache_v1";
const MAX_ENTITY_ENTRIES = 250;

const FIELD_ALIASES = {
  name: ["patientName", "patient_name", "user_name"],
  patientName: ["name", "patient_name"],
  patient_name: ["name", "patientName"],
  relative_name: ["patientRelativeName"],
  patientRelativeName: ["relative_name"],
  relative_address: ["relativeaddress"],
  relativeaddress: ["relative_address"],
  address: ["patient_address"],
  patient_address: ["address"],
};

export function hasNonAscii(val) {
  return typeof val === "string" && /[^\x00-\x7F]/.test(val);
}

export function isGarbledQuestionMarks(val) {
  if (typeof val !== "string") return false;
  const trimmed = val.trim();
  if (!trimmed || trimmed.length < 2) return false;

  // Classic MySQL latin1 corruption: only question marks & punctuation/spaces (e.g. "?????? ???????", "???????")
  if (/^\?{2,}(\s*[,./\-()|•:;]*\s*\?+)*$/.test(trimmed)) {
    return true;
  }

  // Partial mix containing repeated "???" where >= 50% of non-whitespace characters are '?'
  if (/\?\?\?/.test(trimmed)) {
    const nonSpace = trimmed.replace(/\s+/g, "");
    const qCount = (nonSpace.match(/\?/g) || []).length;
    if (nonSpace.length > 0 && qCount / nonSpace.length >= 0.5) {
      return true;
    }
  }

  return false;
}

export function pickCleanText(...candidates) {
  for (const c of candidates) {
    if (
      typeof c === "string" &&
      c.trim() !== "" &&
      c.trim() !== "N/A" &&
      !isGarbledQuestionMarks(c)
    ) {
      return c;
    }
  }
  return "";
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return { byEntity: {}, byPhone: {}, byFieldRecent: {} };
    const parsed = JSON.parse(raw);
    return {
      byEntity: parsed?.byEntity && typeof parsed.byEntity === "object" ? parsed.byEntity : {},
      byPhone: parsed?.byPhone && typeof parsed.byPhone === "object" ? parsed.byPhone : {},
      byFieldRecent:
        parsed?.byFieldRecent && typeof parsed.byFieldRecent === "object"
          ? parsed.byFieldRecent
          : {},
    };
  } catch {
    return { byEntity: {}, byPhone: {}, byFieldRecent: {} };
  }
}

function pruneMap(mapObj, maxEntries) {
  const keys = Object.keys(mapObj);
  if (keys.length <= maxEntries) return mapObj;
  const sorted = keys.sort(
    (a, b) => (mapObj[a]?._updatedAt || 0) - (mapObj[b]?._updatedAt || 0)
  );
  const toRemove = sorted.length - maxEntries;
  for (let i = 0; i < toRemove; i++) {
    delete mapObj[sorted[i]];
  }
  return mapObj;
}

function writeCache(cache) {
  try {
    pruneMap(cache.byEntity, MAX_ENTITY_ENTRIES);
    pruneMap(cache.byPhone, MAX_ENTITY_ENTRIES);
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage quota errors
  }
}

function getUrlResourceInfo(urlStr) {
  const cleanUrl = String(urlStr || "").split("?")[0];
  const itemMatch = cleanUrl.match(/\/api\/([a-z0-9_-]+)\/(\d+)(?:\/|$)/i);
  if (itemMatch) {
    return {
      resource: itemMatch[1].toLowerCase(),
      urlEntityKey: `${itemMatch[1].toLowerCase()}:${itemMatch[2]}`,
    };
  }
  const colMatch = cleanUrl.match(/\/api\/([a-z0-9_-]+)/i);
  return {
    resource: colMatch ? colMatch[1].toLowerCase() : "users",
    urlEntityKey: null,
  };
}

function extractEntityKeys(urlStr, obj) {
  const { resource, urlEntityKey } = getUrlResourceInfo(urlStr);
  const entityKeys = [];
  const phones = [];

  if (urlEntityKey) {
    entityKeys.push(urlEntityKey);
  }

  if (obj && typeof obj === "object") {
    if (obj.user_id !== undefined && obj.user_id !== null && String(obj.user_id).trim() !== "") {
      entityKeys.push(`users:${String(obj.user_id).trim()}`);
      entityKeys.push(`${resource}:user:${String(obj.user_id).trim()}`);
    }
    if (obj.patient_id !== undefined && obj.patient_id !== null && String(obj.patient_id).trim() !== "") {
      entityKeys.push(`users:${String(obj.patient_id).trim()}`);
    }
    if (obj.insertId !== undefined && obj.insertId !== null && String(obj.insertId).trim() !== "") {
      entityKeys.push(`${resource}:${String(obj.insertId).trim()}`);
    }
    if (obj.id !== undefined && obj.id !== null && String(obj.id).trim() !== "") {
      entityKeys.push(`${resource}:${String(obj.id).trim()}`);
      if (resource === "ipd") {
        entityKeys.push(`users:${String(obj.id).trim()}`);
      }
    }
    if (obj.gks_id && typeof obj.gks_id === "string" && obj.gks_id.trim()) {
      entityKeys.push(`gks:${obj.gks_id.trim()}`);
    }
    if (obj.phone && (typeof obj.phone === "string" || typeof obj.phone === "number")) {
      const p = String(obj.phone).trim();
      if (p) phones.push(p);
    }
  }

  return {
    entityKeys: Array.from(new Set(entityKeys)),
    phones: Array.from(new Set(phones)),
  };
}

function collectNonAsciiFromValue(key, val, bucket) {
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return;
    if (hasNonAscii(trimmed) && !isGarbledQuestionMarks(trimmed)) {
      bucket[key] = val;
    }
    if ((trimmed.startsWith("[") || trimmed.startsWith("{")) && trimmed.length > 2) {
      try {
        const parsed = JSON.parse(trimmed);
        collectNonAsciiFromObject(parsed, bucket);
      } catch {
        // Not valid JSON
      }
    }
  } else if (Array.isArray(val)) {
    val.forEach((item, idx) => {
      if (item && typeof item === "object") {
        collectNonAsciiFromObject(item, bucket);
      } else {
        collectNonAsciiFromValue(`${key}[${idx}]`, item, bucket);
      }
    });
  } else if (val && typeof val === "object") {
    collectNonAsciiFromObject(val, bucket);
  }
}

function collectNonAsciiFromObject(obj, bucket) {
  if (!obj || typeof obj !== "object") return;
  Object.entries(obj).forEach(([k, v]) => {
    collectNonAsciiFromValue(k, v, bucket);
  });
}

function extractPayloadInfo(initBody) {
  const nonAsciiFields = {};
  let phone = "";

  if (!initBody) return { nonAsciiFields, phone };

  if (typeof initBody === "string") {
    try {
      const parsed = JSON.parse(initBody);
      if (parsed && typeof parsed === "object") {
        if (parsed.phone) phone = String(parsed.phone).trim();
        collectNonAsciiFromObject(parsed, nonAsciiFields);
      }
    } catch {
      // ignore non-JSON string bodies
    }
  } else if (typeof FormData !== "undefined" && initBody instanceof FormData) {
    initBody.forEach((val, key) => {
      if (typeof val === "string") {
        if (key === "phone" && val.trim()) {
          phone = val.trim();
        }
        collectNonAsciiFromValue(key, val, nonAsciiFields);
      }
    });
  }

  return { nonAsciiFields, phone };
}

function storeFieldsInCache(entityKeys, phones, fields) {
  const keysToStore = Object.keys(fields).filter((k) => k !== "_updatedAt");
  if (keysToStore.length === 0) return;

  const cache = readCache();
  const now = Date.now();

  const applyToBucket = (bucketMap, bucketKey) => {
    if (!bucketKey) return;
    const prev = bucketMap[bucketKey] || {};
    const next = { ...prev, _updatedAt: now };
    keysToStore.forEach((k) => {
      next[k] = fields[k];
      if (Array.isArray(FIELD_ALIASES[k])) {
        FIELD_ALIASES[k].forEach((alias) => {
          next[alias] = fields[k];
        });
      }
    });
    bucketMap[bucketKey] = next;
  };

  entityKeys.forEach((ek) => applyToBucket(cache.byEntity, ek));
  phones.forEach((ph) => applyToBucket(cache.byPhone, ph));

  keysToStore.forEach((k) => {
    cache.byFieldRecent[k] = fields[k];
  });

  writeCache(cache);
}

function lookupCachedField(cache, entityKeys, phones, fieldKey) {
  const candidates = [fieldKey, ...(FIELD_ALIASES[fieldKey] || [])];

  for (const ek of entityKeys) {
    const entry = cache.byEntity[ek];
    if (entry && typeof entry === "object") {
      for (const cKey of candidates) {
        if (entry[cKey] && typeof entry[cKey] === "string" && !isGarbledQuestionMarks(entry[cKey])) {
          return entry[cKey];
        }
      }
    }
  }

  for (const ph of phones) {
    const entry = cache.byPhone[ph];
    if (entry && typeof entry === "object") {
      for (const cKey of candidates) {
        if (entry[cKey] && typeof entry[cKey] === "string" && !isGarbledQuestionMarks(entry[cKey])) {
          return entry[cKey];
        }
      }
    }
  }

  return null;
}

function walkAndProcessResponseNode(node, urlStr, cache, state, inheritedKeys = { entityKeys: [], phones: [] }) {
  if (!node || typeof node !== "object") return node;

  if (Array.isArray(node)) {
    return node.map((item) =>
      walkAndProcessResponseNode(item, urlStr, cache, state, inheritedKeys)
    );
  }

  const own = extractEntityKeys(urlStr, node);
  const mergedEntityKeys = Array.from(new Set([...own.entityKeys, ...inheritedKeys.entityKeys]));
  const mergedPhones = Array.from(new Set([...own.phones, ...inheritedKeys.phones]));
  const freshAuthoritative = {};

  Object.keys(node).forEach((k) => {
    const v = node[k];
    if (typeof v === "string") {
      // Repair / record JSON-stringified fields like relative_contacts
      const trimmed = v.trim();
      if ((trimmed.startsWith("[") || trimmed.startsWith("{")) && trimmed.length > 2) {
        try {
          const parsed = JSON.parse(trimmed);
          const innerState = { repaired: false };
          const processedInner = walkAndProcessResponseNode(
            parsed,
            urlStr,
            cache,
            innerState,
            { entityKeys: mergedEntityKeys, phones: mergedPhones }
          );
          if (innerState.repaired) {
            node[k] = JSON.stringify(processedInner);
            state.repaired = true;
          }
          return;
        } catch {
          // treat as plain string
        }
      }

      if (hasNonAscii(v) && !isGarbledQuestionMarks(v)) {
        freshAuthoritative[k] = v;
      } else if (isGarbledQuestionMarks(v)) {
        const cachedVal = lookupCachedField(cache, mergedEntityKeys, mergedPhones, k);
        if (cachedVal) {
          node[k] = cachedVal;
          state.repaired = true;
        }
      }
    } else if (v && typeof v === "object") {
      node[k] = walkAndProcessResponseNode(v, urlStr, cache, state, {
        entityKeys: mergedEntityKeys,
        phones: mergedPhones,
      });
    }
  });

  if (Object.keys(freshAuthoritative).length > 0 && (mergedEntityKeys.length > 0 || mergedPhones.length > 0)) {
    state.newCacheEntries.push({
      entityKeys: mergedEntityKeys,
      phones: mergedPhones,
      fields: freshAuthoritative,
    });
  }

  return node;
}

async function normalizeOutgoingHindiBody(body) {
  if (!body) return body;

  // 1) JSON string payload
  if (typeof body === "string") {
    if (!hasDevanagari(body)) return body;
    try {
      const parsed = JSON.parse(body);
      if (parsed && typeof parsed === "object") {
        const translated = await translateFormDataObject(parsed, "en");
        return JSON.stringify(translated);
      }
    } catch {
      // Non-JSON string body
      return translateStructuredField("", body, "en");
    }
    return body;
  }

  // 2) Multipart FormData payload (e.g. Register patient with files)
  if (typeof FormData !== "undefined" && body instanceof FormData) {
    const entries = [];
    let needsTranslation = false;
    body.forEach((val, key) => {
      entries.push([key, val]);
      if (typeof val === "string" && hasDevanagari(val)) {
        needsTranslation = true;
      }
    });

    if (!needsTranslation) return body;

    const nextFormData = new FormData();
    for (const [key, val] of entries) {
      if (typeof val !== "string" || !hasDevanagari(val)) {
        nextFormData.append(key, val);
        continue;
      }

      const trimmed = val.trim();
      if ((trimmed.startsWith("[") || trimmed.startsWith("{")) && trimmed.length > 2) {
        try {
          const parsed = JSON.parse(trimmed);
          const translatedInner = await translateFormDataObject(parsed, "en");
          nextFormData.append(key, JSON.stringify(translatedInner));
          continue;
        } catch {
          // Fall through to plain string translation
        }
      }

      const translatedVal = await translateStructuredField(key, val, "en");
      nextFormData.append(key, translatedVal);
    }
    return nextFormData;
  }

  return body;
}

export function installUnicodeFetchGuard() {
  if (typeof window === "undefined" || window.__gksUnicodeFetchInstalled) return;
  window.__gksUnicodeFetchInstalled = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const urlStr = typeof input === "string" ? input : input?.url || "";
    const isTargetApi = urlStr.includes("gks-yjdc.onrender.com/api/");

    if (!isTargetApi) {
      return originalFetch(input, init);
    }

    const method = String(init?.method || (typeof input !== "string" ? input?.method : "GET") || "GET").toUpperCase();
    let sentNonAscii = {};
    let sentPhone = "";
    let finalInit = init;

    if (["POST", "PUT", "PATCH"].includes(method)) {
      const payloadInfo = extractPayloadInfo(init?.body);
      sentNonAscii = payloadInfo.nonAsciiFields;
      sentPhone = payloadInfo.phone;

      if (Object.keys(sentNonAscii).length > 0) {
        const { entityKeys } = extractEntityKeys(urlStr, null);
        storeFieldsInCache(
          entityKeys,
          sentPhone ? [sentPhone] : [],
          sentNonAscii
        );
      }

      // Translate any Devanagari Hindi fields to ASCII English BEFORE sending to backend MySQL
      // so Latin-1 DB columns never corrupt Hindi into "???? ??????".
      if (init?.body) {
        try {
          const normalizedBody = await normalizeOutgoingHindiBody(init.body);
          if (normalizedBody !== init.body) {
            finalInit = { ...init, body: normalizedBody };
          }
        } catch {
          // Keep original body if normalization fails
        }
      }
    }

    const response = await originalFetch(input, finalInit);
    const contentType = String(response.headers?.get("content-type") || "").toLowerCase();
    if (!contentType.includes("application/json")) {
      return response;
    }

    try {
      const cloned = response.clone();
      const json = await cloned.json();
      if (!json || typeof json !== "object") {
        return response;
      }

      // Bind any sent non-ASCII fields to IDs/phone returned in POST/PUT response
      if (Object.keys(sentNonAscii).length > 0) {
        const dataNode = json.data && typeof json.data === "object" && !Array.isArray(json.data)
          ? json.data
          : json;
        const respKeys = extractEntityKeys(urlStr, dataNode);
        const allPhones = sentPhone
          ? Array.from(new Set([sentPhone, ...respKeys.phones]))
          : respKeys.phones;
        storeFieldsInCache(respKeys.entityKeys, allPhones, sentNonAscii);
      }

      const cache = readCache();
      const state = { repaired: false, newCacheEntries: [] };
      const processedJson = walkAndProcessResponseNode(json, urlStr, cache, state);

      if (state.newCacheEntries.length > 0) {
        state.newCacheEntries.forEach((entry) => {
          storeFieldsInCache(entry.entityKeys, entry.phones, entry.fields);
        });
      }

      if (state.repaired) {
        const newHeaders = new Headers(response.headers);
        newHeaders.delete("content-length");
        newHeaders.delete("content-encoding");
        if (!newHeaders.get("content-type")?.includes("charset")) {
          newHeaders.set("content-type", "application/json; charset=utf-8");
        }
        return new Response(JSON.stringify(processedJson), {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });
      }
    } catch {
      // Never break fetch flow if cloning or parsing fails
    }

    return response;
  };
}
