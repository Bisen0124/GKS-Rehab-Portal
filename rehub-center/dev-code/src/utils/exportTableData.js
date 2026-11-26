import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";

/**
 * Extract clean string text from React elements or raw values.
 */
export const extractText = (val) => {
  if (val === null || val === undefined) return "";
  if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
    return String(val).trim();
  }
  if (React.isValidElement(val)) {
    if (val.props && val.props.children) {
      if (Array.isArray(val.props.children)) {
        return val.props.children.map(extractText).filter(Boolean).join(" ").trim();
      }
      return extractText(val.props.children);
    }
    return "";
  }
  if (typeof val === "object") {
    if (val instanceof Date) return val.toLocaleDateString();
    return "";
  }
  return String(val).trim();
};

/**
 * Sanitize filename
 */
export const cleanFilename = (name) => {
  if (!name) return "table_export";
  const cleaned = String(name)
    .trim()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s+/g, "_");
  return cleaned || "table_export";
};

/**
 * Filter out Action/buttons columns from export
 */
export const getExportableColumns = (columns = []) => {
  return columns.filter((col) => {
    if (!col) return false;
    if (col.ignoreExport || col.omitExport) return false;
    const nameStr = String(col.name || "").toLowerCase();
    if (
      nameStr.includes("action") ||
      nameStr.includes("क्रिया") ||
      nameStr.includes("delete") ||
      nameStr.includes("edit") ||
      nameStr === "#" ||
      nameStr === ""
    ) {
      return false;
    }
    return Boolean(col.name && (col.selector || col.cell));
  });
};

/**
 * Get clean header string for a column
 */
export const getColumnHeader = (col) => {
  if (!col || !col.name) return "";
  let name = String(col.name).trim();
  // Strip HTML if any
  name = name.replace(/<[^>]*>?/gm, "");
  return name;
};

/**
 * Get cell raw/resolved value for a row and column
 */
export const getCellValue = (row, col) => {
  if (!row || !col) return "";
  if (typeof col.selector === "function") {
    try {
      const val = col.selector(row);
      if (val !== undefined && val !== null) {
        const textVal = extractText(val);
        if (textVal !== "") return textVal;
      }
    } catch (e) {
      // ignore
    }
  }

  // Fallback field inspection
  const headerLower = String(col.name || "").toLowerCase();
  if (headerLower.includes("user id")) return row.user_id || row.id || "";
  if (headerLower.includes("gks id") || headerLower.includes("gks"))
    return row.gks_id || row.custom_code || row.uid || "";
  if (headerLower.includes("patient") && headerLower.includes("name"))
    return row.name || row.genFamilyPateintname || row.patient_name || "";
  if (headerLower.includes("email")) return row.email || row.genfamiltEmail || "";
  if (headerLower.includes("phone"))
    return row.phone || row.genfamiltNumber || row.mobile || "";
  if (headerLower.includes("status"))
    return row.dischargeStatusText || row.genFammiltStatus || row.status || "";

  return "";
};

/**
 * Trigger file download via browser Blob
 */
const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/**
 * Sort data rows in ascending order based on ID / User ID / S.No. / primary numeric key
 */
export const sortDataAscending = (data = [], columns = []) => {
  if (!Array.isArray(data) || data.length <= 1) return [...data];

  const exportableCols = getExportableColumns(columns);
  const idCol =
    exportableCols.find((col) => {
      const name = String(col?.name || "").toLowerCase();
      return (
        name.includes("user id") ||
        name.includes("user_id") ||
        name.includes("gks id") ||
        name.includes("id") ||
        name === "#" ||
        name.includes("sr") ||
        name.includes("no") ||
        name.includes("क्र")
      );
    }) || exportableCols[0];

  return [...data].sort((a, b) => {
    // 1. Direct row ID lookup
    const idA =
      a?.user_id !== undefined
        ? a.user_id
        : a?.id !== undefined
        ? a.id
        : a?.uid !== undefined
        ? a.uid
        : null;
    const idB =
      b?.user_id !== undefined
        ? b.user_id
        : b?.id !== undefined
        ? b.id
        : b?.uid !== undefined
        ? b.uid
        : null;

    if (idA !== null && idB !== null && idA !== "" && idB !== "") {
      const numA = Number(idA);
      const numB = Number(idB);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
    }

    // 2. Cell value evaluation
    if (idCol) {
      const valA = extractText(getCellValue(a, idCol));
      const valB = extractText(getCellValue(b, idCol));

      const numValA = Number(valA);
      const numValB = Number(valB);
      if (!isNaN(numValA) && !isNaN(numValB) && valA !== "" && valB !== "") {
        return numValA - numValB;
      }

      // Extract trailing digits if string (e.g. GKS_20250811_52)
      const extractNum = (str) => {
        const matches = String(str).match(/\d+/g);
        if (matches && matches.length > 0) {
          return Number(matches[matches.length - 1]);
        }
        return NaN;
      };

      const extractedA = extractNum(valA);
      const extractedB = extractNum(valB);
      if (!isNaN(extractedA) && !isNaN(extractedB)) {
        return extractedA - extractedB;
      }

      return String(valA).localeCompare(String(valB), undefined, {
        numeric: true,
        sensitivity: "base",
      });
    }

    return 0;
  });
};

/**
 * Export data array to CSV file in ascending order
 */
export const exportToCSV = ({
  data = [],
  columns = [],
  filename = "table_data",
  title = "Table Data",
}) => {
  if (!data || data.length === 0) return;
  const exportableCols = getExportableColumns(columns);
  if (exportableCols.length === 0) return;

  const sortedData = sortDataAscending(data, columns);
  const headers = exportableCols.map((col) => getColumnHeader(col));
  const rows = sortedData.map((row) => {
    return exportableCols
      .map((col) => {
        const val = extractText(getCellValue(row, col));
        return `"${val.replace(/"/g, '""')}"`;
      })
      .join(",");
  });

  const csvContent = [
    headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(","),
    ...rows,
  ].join("\r\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  downloadBlob(blob, `${cleanFilename(filename)}.csv`);
};

/**
 * Export data array to genuine Excel (.xlsx) file using SheetJS (XLSX) in ascending order
 */
export const exportToExcel = ({
  data = [],
  columns = [],
  filename = "table_data",
  title = "Table Data",
}) => {
  if (!data || data.length === 0) return;
  const exportableCols = getExportableColumns(columns);
  if (exportableCols.length === 0) return;

  const sortedData = sortDataAscending(data, columns);
  const headers = exportableCols.map((col) => getColumnHeader(col));

  const rows = sortedData.map((row) => {
    return exportableCols.map((col) => {
      return extractText(getCellValue(row, col));
    });
  });

  // Create sheet array of arrays
  const aoa = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(aoa);

  // Set nice column widths
  const colWidths = headers.map((h, i) => {
    let maxLen = h.length;
    rows.forEach((r) => {
      if (r[i] && r[i].length > maxLen) {
        maxLen = Math.min(r[i].length, 45);
      }
    });
    return { wch: Math.max(maxLen + 4, 12) };
  });
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  const safeSheetName = String(title || "Data").slice(0, 31).replace(/[\\/?*[\]]/g, "");
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName || "Data");

  XLSX.writeFile(workbook, `${cleanFilename(filename)}.xlsx`);
};

const escapeHtml = (str) =>
  String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Export data array to PDF document using pure jsPDF + autoTable (or HTML canvas fallback for Hindi/Unicode text) in ascending order
 */
export const exportToPDF = async ({
  data = [],
  columns = [],
  filename = "table_data",
  title = "Table Data",
}) => {
  if (!data || data.length === 0) return;
  const exportableCols = getExportableColumns(columns);
  if (exportableCols.length === 0) return;

  const sortedData = sortDataAscending(data, columns);
  const headers = exportableCols.map((col) => getColumnHeader(col));

  const rows = sortedData.map((row) => {
    return exportableCols.map((col) => {
      return extractText(getCellValue(row, col));
    });
  });

  const isLandscape = exportableCols.length >= 5;
  const hasNonLatin1 =
    /[^\u0000-\u00FF]/.test(String(title || "")) ||
    headers.some((h) => /[^\u0000-\u00FF]/.test(String(h || ""))) ||
    rows.some((r) => r.some((cell) => /[^\u0000-\u00FF]/.test(String(cell || ""))));

  const dateStr = `Date: ${new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}   |   Total Records: ${sortedData.length}`;

  if (hasNonLatin1 && typeof document !== "undefined") {
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-10000px";
    container.style.top = "0";
    container.style.width = isLandscape ? "1120px" : "790px";
    container.style.padding = "24px 28px";
    container.style.backgroundColor = "#ffffff";
    container.style.color = "#0f172a";
    container.style.fontFamily =
      "'Noto Sans Devanagari', 'Rubik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
    container.style.zIndex = "-1";

    const headerHtml = headers
      .map(
        (h) =>
          `<th style="background:#24695c;color:#ffffff;font-weight:700;font-size:12px;padding:8px 10px;border:1px solid #cbd5e1;text-align:left;">${escapeHtml(
            h
          )}</th>`
      )
      .join("");

    const bodyHtml = rows
      .map(
        (r, idx) =>
          `<tr style="background:${idx % 2 === 1 ? "#f8fafc" : "#ffffff"};">${r
            .map(
              (c) =>
                `<td style="padding:7px 10px;border:1px solid #cbd5e1;font-size:11.5px;color:#1e293b;vertical-align:top;word-break:break-word;">${escapeHtml(
                  c
                )}</td>`
            )
            .join("")}</tr>`
      )
      .join("");

    container.innerHTML = `
      <div style="margin-bottom:14px;border-bottom:2px solid #24695c;padding-bottom:10px;">
        <div style="font-size:18px;font-weight:700;color:#24695c;margin-bottom:4px;">${escapeHtml(
          title || "Report"
        )}</div>
        <div style="display:flex;justify-content:space-between;font-size:12px;color:#64748b;">
          <span>GKS Rehabilitation Center</span>
          <span>${escapeHtml(dateStr)}</span>
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr>${headerHtml}</tr></thead>
        <tbody>${bodyHtml}</tbody>
      </table>
    `;

    document.body.appendChild(container);
    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const doc = new jsPDF({
        orientation: isLandscape ? "landscape" : "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginMm = 10;
      const printableW = pageWidth - marginMm * 2;
      const printableH = pageHeight - marginMm * 2;
      const pageSlicePx = Math.floor(canvas.width * (printableH / printableW));

      let offsetY = 0;
      let pageIndex = 0;
      while (offsetY < canvas.height) {
        const sliceH = Math.min(pageSlicePx, canvas.height - offsetY);
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceH;
        const pCtx = pageCanvas.getContext("2d");
        pCtx.fillStyle = "#ffffff";
        pCtx.fillRect(0, 0, canvas.width, sliceH);
        pCtx.drawImage(canvas, 0, offsetY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

        if (pageIndex > 0) doc.addPage();
        const imgHeightMm = (sliceH * printableW) / canvas.width;
        doc.addImage(pageCanvas.toDataURL("image/jpeg", 0.95), "JPEG", marginMm, marginMm, printableW, imgHeightMm);

        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(`Page ${pageIndex + 1}`, pageWidth - marginMm, pageHeight - 4, { align: "right" });

        offsetY += sliceH;
        pageIndex += 1;
      }

      doc.save(`${cleanFilename(filename)}.pdf`);
      return;
    } finally {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }
  }

  const doc = new jsPDF({
    orientation: isLandscape ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header Title
  doc.setFontSize(14);
  doc.setTextColor(36, 105, 92); // Deep Teal #24695c
  doc.setFont("helvetica", "bold");
  doc.text(String(title || "Report"), 14, 14);

  // Subtitle / Center info
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.text("GKS Rehabilitation Center", 14, 19);

  // Date and total records on right
  doc.text(dateStr, pageWidth - 14, 19, { align: "right" });

  // Draw separator line
  doc.setDrawColor(36, 105, 92);
  doc.setLineWidth(0.4);
  doc.line(14, 22, pageWidth - 14, 22);

  // Generate Table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 25,
    margin: { left: 14, right: 14, bottom: 15 },
    theme: "grid",
    headStyles: {
      fillColor: [36, 105, 92],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: "bold",
      halign: "left",
      valign: "middle",
      cellPadding: 2.2,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 1.8,
      valign: "middle",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    styles: {
      overflow: "linebreak",
      cellWidth: "auto",
      lineWidth: 0.1,
      lineColor: [203, 213, 225],
    },
    didDrawPage: (data) => {
      // Footer page numbering
      const pageNumber = `Page ${doc.internal.getNumberOfPages()}`;
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(pageNumber, pageWidth - 14, pageHeight - 8, {
        align: "right",
      });
    },
  });

  doc.save(`${cleanFilename(filename)}.pdf`);
};
