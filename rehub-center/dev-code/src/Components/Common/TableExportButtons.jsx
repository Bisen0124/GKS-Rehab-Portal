import React, { useState } from "react";
import { Button, Spinner } from "reactstrap";
import { toast } from "react-toastify";
import { useLang } from "../../contexts/LangContext";
import { getTranslation } from "../../utils/translator";
import { exportToCSV, exportToExcel, exportToPDF } from "../../utils/exportTableData";

const TableExportButtons = ({
  data = [],
  columns = [],
  filename = "table_data",
  title = "Table Data Export",
  className = "",
  disabled = false,
}) => {
  const { lang } = useLang();
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const hasData = Array.isArray(data) && data.length > 0;
  const isButtonDisabled = disabled || !hasData;

  const handleCSV = () => {
    if (!hasData) {
      toast.warn(getTranslation("No data available to export/निर्यात करने के लिए कोई डेटा नहीं है", lang));
      return;
    }
    try {
      exportToCSV({ data, columns, filename, title });
      toast.success(getTranslation("CSV export completed!/CSV निर्यात पूरा हुआ!", lang));
    } catch (e) {
      console.error(e);
      toast.error("Failed to export CSV");
    }
  };

  const handleExcel = () => {
    if (!hasData) {
      toast.warn(getTranslation("No data available to export/निर्यात करने के लिए कोई डेटा नहीं है", lang));
      return;
    }
    try {
      exportToExcel({ data, columns, filename, title });
      toast.success(getTranslation("Excel export completed!/एक्सेल निर्यात पूरा हुआ!", lang));
    } catch (e) {
      console.error(e);
      toast.error("Failed to export Excel");
    }
  };

  const handlePDF = async () => {
    if (!hasData) {
      toast.warn(getTranslation("No data available to export/निर्यात करने के लिए कोई डेटा नहीं है", lang));
      return;
    }
    setIsPdfLoading(true);
    try {
      await exportToPDF({ data, columns, filename, title });
      toast.success(getTranslation("PDF export completed!/पीडीएफ निर्यात पूरा हुआ!", lang));
    } catch (e) {
      console.error(e);
      toast.error("Failed to export PDF");
    } finally {
      setIsPdfLoading(false);
    }
  };

  return (
    <div
      className={`d-flex align-items-center flex-wrap gap-2 table-export-btn-group ${className}`}
      style={{ minHeight: "38px" }}
    >
      <span
        className="text-muted fw-semibold d-none d-sm-inline"
        style={{ fontSize: "12.5px", letterSpacing: "0.3px", marginRight: "2px" }}
      >
        {getTranslation("Export/निर्यात:", lang)}
      </span>

      {/* CSV Export Button */}
      <Button
        size="sm"
        disabled={isButtonDisabled}
        onClick={handleCSV}
        className="btn-export-csv d-inline-flex align-items-center justify-content-center gap-1 shadow-sm"
        style={{
          backgroundColor: "#ffffff",
          color: "#24695c",
          borderColor: "#24695c",
          borderWidth: "1.5px",
          borderRadius: "8px",
          fontWeight: "600",
          fontSize: "12px",
          padding: "5px 12px",
          transition: "all 0.2s ease-in-out",
          cursor: isButtonDisabled ? "not-allowed" : "pointer",
          opacity: isButtonDisabled ? 0.6 : 1,
        }}
        title={getTranslation("Export CSV/सीएसवी निर्यात करें", lang)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <span>CSV</span>
      </Button>

      {/* Excel Export Button */}
      <Button
        size="sm"
        disabled={isButtonDisabled}
        onClick={handleExcel}
        className="btn-export-excel d-inline-flex align-items-center justify-content-center gap-1 shadow-sm"
        style={{
          backgroundColor: "#ffffff",
          color: "#107c41",
          borderColor: "#107c41",
          borderWidth: "1.5px",
          borderRadius: "8px",
          fontWeight: "600",
          fontSize: "12px",
          padding: "5px 12px",
          transition: "all 0.2s ease-in-out",
          cursor: isButtonDisabled ? "not-allowed" : "pointer",
          opacity: isButtonDisabled ? 0.6 : 1,
        }}
        title={getTranslation("Export Excel/एक्सेल निर्यात करें", lang)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="8" y1="13" x2="16" y2="17"></line>
          <line x1="16" y1="13" x2="8" y2="17"></line>
        </svg>
        <span>Excel</span>
      </Button>

      {/* PDF Export Button */}
      <Button
        size="sm"
        disabled={isButtonDisabled || isPdfLoading}
        onClick={handlePDF}
        className="btn-export-pdf d-inline-flex align-items-center justify-content-center gap-1 shadow-sm"
        style={{
          backgroundColor: "#ffffff",
          color: "#c53030",
          borderColor: "#c53030",
          borderWidth: "1.5px",
          borderRadius: "8px",
          fontWeight: "600",
          fontSize: "12px",
          padding: "5px 12px",
          transition: "all 0.2s ease-in-out",
          cursor: isButtonDisabled || isPdfLoading ? "not-allowed" : "pointer",
          opacity: isButtonDisabled ? 0.6 : 1,
        }}
        title={getTranslation("Export PDF/पीडीएफ निर्यात करें", lang)}
      >
        {isPdfLoading ? (
          <Spinner size="sm" style={{ width: "12px", height: "12px" }} />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
        )}
        <span>PDF</span>
      </Button>
    </div>
  );
};

export default TableExportButtons;
