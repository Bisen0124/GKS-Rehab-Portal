import React from "react";
import { Button, Alert } from "reactstrap";
import { toast } from "react-toastify";
import { useLang } from "../../contexts/LangContext";
import { getTranslation } from "../../utils/translator";
import { saveDraft, clearDraft, formatDraftTime } from "../../utils/formDraftManager";

/**
 * Save as Draft Button Component
 */
export const SaveDraftButton = ({
  formKey,
  targetId = "new",
  formData = {},
  onDraftSaved,
  className = "",
  size = "md",
  disabled = false,
  style = {},
}) => {
  const { lang } = useLang();

  const handleSave = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (disabled) return;

    const success = saveDraft(formKey, targetId, formData);
    if (success) {
      toast.info(
        getTranslation(
          "Draft saved! You can close or resume anytime./ड्राफ्ट सहेजा गया! आप कभी भी फिर से शुरू कर सकते हैं।",
          lang
        )
      );
      if (typeof onDraftSaved === "function") {
        onDraftSaved();
      }
    } else {
      toast.error(
        getTranslation(
          "Failed to save draft./ड्राफ्ट सहेजने में विफल।",
          lang
        )
      );
    }
  };

  return (
    <Button
      type="button"
      color="outline-secondary"
      size={size}
      onClick={handleSave}
      disabled={disabled}
      className={`d-inline-flex align-items-center gap-1 fw-semibold ${className}`}
      style={{
        borderColor: "#94a3b8",
        color: "#334155",
        backgroundColor: "#f8fafc",
        borderRadius: "6px",
        transition: "all 0.2s ease",
        ...style,
      }}
      title={getTranslation(
        "Save progress as draft in local storage/स्थानीय मेमोरी में ड्राफ्ट के रूप में सहेजें",
        lang
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginRight: "3px" }}
      >
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
      </svg>
      <span>
        {getTranslation("Save as Draft/ड्राफ्ट के रूप में सहेजें", lang)}
      </span>
    </Button>
  );
};

/**
 * Notice Banner displayed at top of form when a draft is restored
 */
export const DraftNoticeBanner = ({
  draftTimestamp,
  formKey,
  targetId,
  onDiscard,
}) => {
  const { lang } = useLang();

  if (!draftTimestamp) return null;

  const handleDiscard = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    clearDraft(formKey, targetId);
    toast.info(
      getTranslation(
        "Draft discarded./ड्राफ्ट हटा दिया गया।",
        lang
      )
    );
    if (typeof onDiscard === "function") {
      onDiscard();
    }
  };

  return (
    <Alert
      color="info"
      className="d-flex align-items-center justify-content-between p-2 mb-3 shadow-sm border"
      style={{
        borderRadius: "8px",
        backgroundColor: "#f0f9ff",
        borderColor: "#bae6fd",
        color: "#0369a1",
        fontSize: "13px",
      }}
    >
      <div className="d-flex align-items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>
          <strong>{getTranslation("Restored unsaved draft/असुरक्षित ड्राफ्ट पुनर्स्थापित:", lang)}</strong>{" "}
          {formatDraftTime(draftTimestamp)}
        </span>
      </div>
      <Button
        color="link"
        size="sm"
        onClick={handleDiscard}
        className="p-0 text-danger text-decoration-none fw-semibold"
        style={{ fontSize: "12.5px" }}
      >
        {getTranslation("Discard Draft/ड्राफ्ट हटाएं", lang)}
      </Button>
    </Alert>
  );
};

export default SaveDraftButton;
