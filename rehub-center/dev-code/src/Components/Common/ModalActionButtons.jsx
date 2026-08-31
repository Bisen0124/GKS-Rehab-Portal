import React from "react";
import { Button } from "reactstrap";
import { useLang } from "../../contexts/LangContext";
import { getTranslation } from "../../utils/translator";

const ModalActionButtons = ({
  onClose,
  onPrint,
  onDownload,
  isDownloading = false,
  downloadText,
  printText,
  closeText,
  style = {},
  className = "d-flex justify-content-end align-items-center gap-2 p-3 border-top bg-white flex-wrap",
}) => {
  const { lang } = useLang();

  return (
    <div className={className} style={{ margin: "0 10px 10px 10px", ...style }}>
      {onClose && (
        <Button
          color="light"
          type="button"
          className="border fw-semibold px-4 shadow-sm"
          onClick={onClose}
          style={{
            borderRadius: "8px",
            height: "42px",
            backgroundColor: "#ffffff",
            borderColor: "#cbd5e1",
            color: "#1e293b",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          {closeText || getTranslation("Close / बंद करें", lang)}
        </Button>
      )}

      {onPrint && (
        <Button
          type="button"
          className="fw-semibold px-4 d-inline-flex align-items-center gap-2 text-white shadow-sm border-0"
          onClick={onPrint}
          style={{
            borderRadius: "8px",
            height: "42px",
            backgroundColor: "#d56337",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: "16px" }}>🖨️</span>
          <span>
            {printText || getTranslation("Print Your Data / प्रिंट करें", lang)}
          </span>
        </Button>
      )}

      {onDownload && (
        <Button
          type="button"
          disabled={isDownloading}
          onClick={onDownload}
          className="fw-semibold px-4 d-inline-flex align-items-center gap-2 text-white shadow-sm border-0"
          style={{
            borderRadius: "8px",
            height: "42px",
            backgroundColor: "#1E6554",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: "600",
            cursor: isDownloading ? "not-allowed" : "pointer",
          }}
        >
          {isDownloading ? (
            <>
              <span
                className="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              ></span>
              <span>
                {getTranslation("Downloading... / डाउनलोड हो रहा है...", lang)}
              </span>
            </>
          ) : (
            <>
              <span style={{ fontSize: "16px" }}>📥</span>
              <span>
                {downloadText ||
                  getTranslation("Download PDF / डाउनलोड करें", lang)}
              </span>
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default ModalActionButtons;
