/**
 * Centralized Form Draft Manager using LocalStorage
 * Retains form input data across session timeouts, browser refreshes, and logouts.
 */

const DRAFT_PREFIX = "gks_form_draft_";

/**
 * Generate a consistent storage key for a form and target record/patient.
 */
export const getDraftKey = (formKey, targetId = "new") => {
  const safeFormKey = String(formKey || "form").trim().toLowerCase();
  const safeId = targetId !== null && targetId !== undefined && targetId !== "" 
    ? String(targetId).trim() 
    : "new";
  return `${DRAFT_PREFIX}${safeFormKey}_${safeId}`;
};

/**
 * Save form state to localStorage with a timestamp
 */
export const saveDraft = (formKey, targetId, formData) => {
  if (!formKey || !formData) return false;
  try {
    const key = getDraftKey(formKey, targetId);
    const payload = {
      formKey,
      targetId: targetId || "new",
      data: formData,
      savedAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.error("Error saving form draft to localStorage:", err);
    return false;
  }
};

/**
 * Safely parse any value into a valid Date instance or return null.
 * Prevents RangeError: Invalid time value in react-datepicker.
 */
export const safeDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Load saved draft from localStorage
 */
export const loadDraft = (formKey, targetId) => {
  if (!formKey) return null;
  try {
    const key = getDraftKey(formKey, targetId);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw, (k, value) => {
      // Auto-revive ISO timestamp strings to Date objects
      if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        const d = new Date(value);
        if (!isNaN(d.getTime())) return d;
      }
      return value;
    });
    if (!parsed || !parsed.data) return null;
    return parsed;
  } catch (err) {
    console.error("Error loading form draft from localStorage:", err);
    return null;
  }
};

/**
 * Check if a draft exists and has non-empty values
 */
export const hasDraft = (formKey, targetId) => {
  const draft = loadDraft(formKey, targetId);
  if (!draft || !draft.data) return false;
  if (typeof draft.data === "object") {
    // Check if at least one field has non-empty value
    return Object.values(draft.data).some((val) => {
      if (val === null || val === undefined) return false;
      if (typeof val === "string") return val.trim() !== "";
      if (typeof val === "number" || typeof val === "boolean") return true;
      if (Array.isArray(val)) return val.length > 0;
      if (typeof val === "object") return Object.keys(val).length > 0;
      return false;
    });
  }
  return true;
};

/**
 * Clear a specific form draft from localStorage
 */
export const clearDraft = (formKey, targetId) => {
  if (!formKey) return;
  try {
    const key = getDraftKey(formKey, targetId);
    localStorage.removeItem(key);
  } catch (err) {
    console.error("Error clearing form draft from localStorage:", err);
  }
};

/**
 * Format savedAt timestamp into a human-readable date/time string
 */
export const formatDraftTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
