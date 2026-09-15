import Swal from "sweetalert2";
import { getTranslation } from "./translator";

/**
 * Extracts a flat list of readable error messages from any backend API response shape.
 * Handles:
 * - result.errors: Array<{ field, message, msg, error }>
 * - result.errors: Array<string>
 * - result.errors: Object<{ [field]: string | string[] }>
 * - result.error / result.message / result.details
 * @param {any} result
 * @returns {string[]}
 */
export function extractApiErrorList(result) {
  if (!result) return [];
  const list = [];

  if (Array.isArray(result.errors) && result.errors.length > 0) {
    for (const item of result.errors) {
      if (!item) continue;
      if (typeof item === "string") {
        if (item.trim()) list.push(item.trim());
      } else if (typeof item === "object") {
        if (item.message && typeof item.message === "string") {
          list.push(item.message.trim());
        } else if (item.msg && typeof item.msg === "string") {
          list.push(item.msg.trim());
        } else if (item.error && typeof item.error === "string") {
          list.push(item.error.trim());
        } else if (item.field && typeof item.field === "string") {
          const readableField = item.field
            .split(".")
            .pop()
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());
          list.push(`${readableField} is required or invalid`);
        } else {
          list.push(JSON.stringify(item));
        }
      }
    }
  } else if (result.errors && typeof result.errors === "object") {
    for (const [key, val] of Object.entries(result.errors)) {
      const readableKey = key
        .split(".")
        .pop()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      if (Array.isArray(val)) {
        val.forEach((v) => {
          if (typeof v === "string") {
            list.push(v);
          } else if (v && typeof v === "object" && (v.message || v.msg)) {
            list.push(v.message || v.msg);
          } else {
            list.push(`${readableKey}: ${JSON.stringify(v)}`);
          }
        });
      } else if (typeof val === "string") {
        list.push(val.toLowerCase().includes(readableKey.toLowerCase()) ? val : `${readableKey}: ${val}`);
      } else if (val && typeof val === "object" && (val.message || val.msg)) {
        list.push(val.message || val.msg);
      }
    }
  }

  // If no detailed errors in result.errors, check details / error / message
  if (list.length === 0) {
    if (result.details?.message && result.details.message !== "An unexpected error occurred") {
      list.push(result.details.message.trim());
    } else if (typeof result.error === "string" && result.error.trim() && result.error !== "Internal Server Error") {
      list.push(result.error.trim());
    } else if (typeof result.message === "string" && result.message.trim() && result.message !== "Validation failed") {
      list.push(result.message.trim());
    }
  }

  return list;
}

/**
 * Displays a SweetAlert popup with full backend error details so the user knows exactly
 * which field is missing or invalid.
 * @param {any} result - API response json
 * @param {string} lang - Current language ("en" | "hi")
 * @param {string|null} customTitle - Optional modal title
 */
export function showApiErrorAlert(result, lang = "en", customTitle = null) {
  const errorList = extractApiErrorList(result);
  const isValidationFailure =
    (result?.message && result.message.toLowerCase().includes("validation")) ||
    (Array.isArray(result?.errors) && result.errors.length > 0) ||
    (result?.errors && typeof result.errors === "object" && Object.keys(result.errors).length > 0);

  let title = customTitle;
  // Defensively sanitize title in case component mistakenly passes a success title string on failure
  if (
    !title ||
    title.toLowerCase().includes("success") ||
    title.includes("सफलता") ||
    title.toLowerCase().includes("created") ||
    title.toLowerCase().includes("updated")
  ) {
    title = isValidationFailure
      ? getTranslation("Validation Failed / सत्यापन में त्रुटियां", lang)
      : getTranslation("Submission Failed / सबमिशन विफल", lang);
  }

  if (errorList.length > 1 || (errorList.length === 1 && isValidationFailure)) {
    const errorHtml = `
      <div style="text-align: left; margin-top: 10px; font-family: inherit;">
        <div style="background: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; font-size: 13.5px; color: #991b1b; font-weight: 600;">
          ${getTranslation("Please check and fill the following compulsory field(s): / कृपया निम्नलिखित अनिवार्य फ़ील्ड जांचें और भरें:", lang)}
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px; max-height: 260px; overflow-y: auto; padding-right: 4px;">
          ${errorList
            .map(
              (err) => `
            <div style="display: flex; align-items: flex-start; gap: 8px; background: #ffffff; border: 1px solid #fecaca; border-radius: 6px; padding: 8px 12px; font-size: 13px; color: #1e293b; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
              <span style="color: #ef4444; font-size: 14px; line-height: 1.3; flex-shrink: 0;">⚠️</span>
              <span style="font-weight: 500; line-height: 1.3; word-break: break-word;">${err}</span>
            </div>`
            )
            .join("")}
        </div>
      </div>
    `;

    return Swal.fire({
      icon: "error",
      title: title,
      html: errorHtml,
      confirmButtonText: getTranslation("OK / ठीक है", lang),
      confirmButtonColor: "#3085d6",
    });
  }

  // Single scalar error or fallback
  let singleMessage =
    errorList[0] ||
    result?.message ||
    result?.error;

  if (!singleMessage || singleMessage.toLowerCase() === "validation failed") {
    singleMessage = getTranslation(
      "Validation failed. Please ensure all required fields and options are filled. / सत्यापन विफल रहा। कृपया सुनिश्चित करें कि सभी आवश्यक फ़ील्ड और विकल्प भरे गए हैं।",
      lang
    );
  }

  return Swal.fire({
    icon: "error",
    title: title,
    text: singleMessage,
    confirmButtonText: getTranslation("OK / ठीक है", lang),
    confirmButtonColor: "#3085d6",
  });
}

/**
 * Validates compulsory fields and shows a beautiful alert with missing field names if any are empty.
 * @param {Array<{label: string, value: any}>} fieldDefinitions - Array of field objects { label, value }
 * @param {string} lang - Current language ("en" | "hi")
 * @returns {boolean} - Returns true if valid (no missing fields), false if invalid
 */
export function validateCompulsoryFields(fieldDefinitions, lang = "en") {
  const missingFields = [];

  for (const field of fieldDefinitions) {
    const val = field.value;
    const isEmpty =
      val === null ||
      val === undefined ||
      (typeof val === "string" && val.trim() === "") ||
      (typeof val === "number" && isNaN(val)) ||
      (Array.isArray(val) && val.length === 0);

    if (isEmpty) {
      missingFields.push(field.label);
    }
  }

  if (missingFields.length > 0) {
    const missingListHtml = `
      <div style="text-align: left; margin-top: 10px; font-family: inherit;">
        <div style="background: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; font-size: 13.5px; color: #991b1b; font-weight: 600;">
          ${getTranslation("Please fill in the following compulsory field(s): / कृपया निम्नलिखित अनिवार्य फ़ील्ड भरें:", lang)}
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px; max-height: 240px; overflow-y: auto; padding-right: 4px;">
          ${missingFields
            .map(
              (f) => `
            <div style="display: flex; align-items: center; gap: 8px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 7px 12px; font-size: 13px; color: #334155;">
              <span style="color: #ef4444; font-size: 14px;">⚠️</span>
              <span style="font-weight: 500;">${f}</span>
            </div>`
            )
            .join("")}
        </div>
      </div>
    `;

    Swal.fire({
      icon: "warning",
      title: getTranslation(
        "Required field(s) missing! / आवश्यक फ़ील्ड खाली हैं!",
        lang
      ),
      html: missingListHtml,
      confirmButtonText: getTranslation("OK / ठीक है", lang),
      confirmButtonColor: "#3085d6",
    });
    return false;
  }

  return true;
}
