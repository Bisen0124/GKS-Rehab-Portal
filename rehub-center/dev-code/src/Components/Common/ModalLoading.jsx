import React from "react";
import { Spinner } from "reactstrap";
import { useLang } from "../../contexts/LangContext";
import { getTranslation } from "../../utils/translator";

const ModalLoading = ({ message, height = "280px" }) => {
  const { lang } = useLang();
  const displayMsg =
    message ||
    getTranslation(
      "Loading details, please wait... / विवरण लोड हो रहा है, कृपया प्रतीक्षा करें...",
      lang
    );

  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center w-100 py-5"
      style={{
        minHeight: height,
        background: "transparent",
      }}
    >
      <div
        className="d-flex align-items-center justify-content-center mb-3 position-relative"
        style={{
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          background: "rgba(213, 99, 55, 0.08)",
          boxShadow: "0 0 20px rgba(213, 99, 55, 0.15)",
        }}
      >
        <Spinner
          style={{
            width: "38px",
            height: "38px",
            color: "#d56337",
            borderWidth: "3.5px",
          }}
        />
      </div>
      <h6
        className="fw-semibold text-dark mb-1 text-center"
        style={{ fontSize: "14.5px", letterSpacing: "0.2px" }}
      >
        {displayMsg}
      </h6>
      <span className="text-muted text-center" style={{ fontSize: "12px" }}>
        {getTranslation(
          "Fetching latest records from server... / सर्वर से नवीनतम रिकॉर्ड प्राप्त किए जा रहे हैं...",
          lang
        )}
      </span>
    </div>
  );
};

export default ModalLoading;
