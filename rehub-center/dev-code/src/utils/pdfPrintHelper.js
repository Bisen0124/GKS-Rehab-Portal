import html2canvas from "html2canvas";

/**
 * Finds the cleanest (whitest) horizontal row near `targetY` within `+-searchBand`
 * so multi-page canvas slicing avoids cutting right through text or card borders.
 */
function findCleanBreakY(ctx, width, targetY, totalHeight, searchBand = 90) {
  const minY = Math.max(20, Math.floor(targetY - searchBand));
  const maxY = Math.min(totalHeight - 1, Math.floor(targetY + 12));
  if (minY >= maxY) return Math.min(targetY, totalHeight);

  const sampleHeight = maxY - minY + 1;
  const imgData = ctx.getImageData(0, minY, width, sampleHeight).data;

  let bestY = targetY;
  let bestScore = -1;

  // Sample every 4th pixel horizontally for speed while staying accurate
  const stepX = 4;
  for (let row = 0; row < sampleHeight; row++) {
    let whitePixels = 0;
    let totalSampled = 0;
    const rowOffset = row * width * 4;
    for (let x = 0; x < width; x += stepX) {
      const idx = rowOffset + x * 4;
      const r = imgData[idx];
      const g = imgData[idx + 1];
      const b = imgData[idx + 2];
      if (r >= 245 && g >= 245 && b >= 245) {
        whitePixels++;
      }
      totalSampled++;
    }
    const whiteness = totalSampled > 0 ? whitePixels / totalSampled : 0;
    // Slight preference for rows closer to targetY when whiteness ties
    const distPenalty = Math.abs(minY + row - targetY) * 0.0002;
    const score = whiteness - distPenalty;
    if (score > bestScore) {
      bestScore = score;
      bestY = minY + row;
    }
  }

  return bestY;
}

/**
 * Prints any DOM ref element so that the Print Preview matches Download PDF identically:
 * - Captures full desktop layout via html2canvas (preventing Bootstrap print mobile-collapse).
 * - Preserves all colors, cards, badges & styling regardless of browser "Background graphics" toggle.
 * - Fits comfortably onto 1 A4 page when near-single-page (<= 1.25x A4 height), or slices cleanly across A4 pages.
 * - Removes ugly browser URL/date headers via @page { margin: 0 }.
 */
export async function printElementAsPdf(element, options = {}) {
  if (!element) return;

  const {
    title = document.title || "GKS Rehab Portal Report",
    marginMm = 10,
    singlePageFitThreshold = 1.25,
  } = options;

  const hadPdfScale = element.classList.contains("pdf-scale");
  if (!hadPdfScale) {
    element.classList.add("pdf-scale");
  }

  let canvas;
  try {
    canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      scrollY: 0,
      backgroundColor: "#ffffff",
      logging: false,
    });
  } finally {
    if (!hadPdfScale) {
      element.classList.remove("pdf-scale");
    }
  }

  const pageWidthMm = 210;
  const pageHeightMm = 297;
  const printableWidthMm = pageWidthMm - marginMm * 2;
  const printableHeightMm = pageHeightMm - marginMm * 2;
  const a4Aspect = printableHeightMm / printableWidthMm;

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const singlePageHeightPx = Math.floor(canvasWidth * a4Aspect);

  const pageImages = [];

  if (canvasHeight <= singlePageHeightPx * singlePageFitThreshold) {
    // Fit cleanly on a single A4 page (matches compact Download PDF look, zero spill onto page 2)
    pageImages.push(canvas.toDataURL("image/jpeg", 0.96));
  } else {
    // Slice cleanly across proper A4 pages at whitespace boundaries
    const fullCtx = canvas.getContext("2d", { willReadFrequently: true });
    let currentY = 0;

    while (currentY < canvasHeight) {
      const remaining = canvasHeight - currentY;
      let sliceHeight;

      if (remaining <= singlePageHeightPx * 1.05) {
        sliceHeight = remaining;
      } else {
        const idealEndY = currentY + singlePageHeightPx;
        const cleanEndY = findCleanBreakY(fullCtx, canvasWidth, idealEndY, canvasHeight, 100);
        sliceHeight = Math.max(Math.floor(singlePageHeightPx * 0.5), cleanEndY - currentY);
      }

      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvasWidth;
      sliceCanvas.height = sliceHeight;
      const sliceCtx = sliceCanvas.getContext("2d");
      sliceCtx.fillStyle = "#ffffff";
      sliceCtx.fillRect(0, 0, canvasWidth, sliceHeight);
      sliceCtx.drawImage(
        canvas,
        0,
        currentY,
        canvasWidth,
        sliceHeight,
        0,
        0,
        canvasWidth,
        sliceHeight
      );

      pageImages.push(sliceCanvas.toDataURL("image/jpeg", 0.96));
      currentY += sliceHeight;
    }
  }

  const safeTitle = String(title).replace(/[<>&"]/g, "");

  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${safeTitle}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * {
      box-sizing: border-box;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 210mm;
      background: #ffffff;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .print-pdf-page {
      width: 210mm;
      height: 296mm;
      padding: ${marginMm}mm;
      margin: 0 auto;
      background: #ffffff;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      overflow: hidden;
      page-break-after: always;
      break-after: page;
    }
    .print-pdf-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .print-pdf-page img {
      max-width: ${printableWidthMm}mm;
      max-height: ${printableHeightMm - 1}mm;
      width: auto;
      height: auto;
      display: block;
      object-fit: contain;
    }
  </style>
</head>
<body>
  ${pageImages
    .map((src) => `<div class="print-pdf-page"><img src="${src}" alt="Report Page" /></div>`)
    .join("")}
</body>
</html>`);
    doc.close();

    const cleanup = () => {
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 1500);
      resolve();
    };

    const imgs = Array.from(doc.querySelectorAll("img"));
    let loadedCount = 0;
    let printTriggered = false;

    const triggerPrint = () => {
      if (printTriggered) return;
      printTriggered = true;
      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.onafterprint = cleanup;
          iframe.contentWindow.print();
          // Fallback cleanup if onafterprint does not fire
          setTimeout(cleanup, 60000);
        } catch (err) {
          console.error("Print trigger error:", err);
          cleanup();
        }
      }, 120);
    };

    if (imgs.length === 0) {
      triggerPrint();
      return;
    }

    imgs.forEach((img) => {
      if (img.complete) {
        loadedCount++;
        if (loadedCount === imgs.length) triggerPrint();
      } else {
        img.onload = () => {
          loadedCount++;
          if (loadedCount === imgs.length) triggerPrint();
        };
        img.onerror = () => {
          loadedCount++;
          if (loadedCount === imgs.length) triggerPrint();
        };
      }
    });

    // Safety fallback in case onload events already fired
    setTimeout(triggerPrint, 800);
  });
}
