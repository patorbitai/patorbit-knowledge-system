import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";

// --- PDF Export ---
export const exportToPdf = async (elementId: string, fileName: string) => {
  const resumeElement = document.getElementById(elementId);
  if (!resumeElement) {
    console.error("Resume element not found!");
    return;
  }

  // Store original transforms and reset them temporarily for clean capture
  const origTransform = resumeElement.style.transform;
  const origOrigin = resumeElement.style.transformOrigin;
  resumeElement.style.transform = "none";
  resumeElement.style.transformOrigin = "unset";

  try {
    const canvas = await html2canvas(resumeElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfW = pdf.internal.pageSize.getWidth();   // 210mm
    const pdfH = pdf.internal.pageSize.getHeight();  // 297mm
    const aspect = canvas.width / canvas.height;
    let renderedH = pdfW / aspect; // height if width fills A4

    // If it fits on one page
    if (renderedH <= pdfH) {
      pdf.addImage(imgData, "PNG", 0, 0, pdfW, renderedH);
    } else {
      // Multi-page: render at full width, page by page
      const pagePx = (pdfH / renderedH) * canvas.height; // pixels per A4 page
      let srcY = 0;
      let pageNum = 0;
      while (srcY < canvas.height) {
        const sliceH = Math.min(pagePx, canvas.height - srcY);
        // Crop a slice from the canvas
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceH;
        const ctx = pageCanvas.getContext("2d")!;
        ctx.drawImage(canvas, 0, srcY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
        const pageData = pageCanvas.toDataURL("image/png");

        if (pageNum > 0) pdf.addPage();
        const sliceRenderedH = (sliceH / canvas.height) * renderedH;
        pdf.addImage(pageData, "PNG", 0, 0, pdfW, sliceRenderedH);
        srcY += sliceH;
        pageNum++;
      }
    }

    pdf.save(`${fileName}.pdf`);
  } finally {
    // Restore original transforms
    resumeElement.style.transform = origTransform;
    resumeElement.style.transformOrigin = origOrigin;
  }
};

// --- DOCX Export ---
export const exportToDocx = async (resumeData: any, fileName: string) => {
  try {
    const response = await fetch("/api/export-docx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resumeData),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const blob = await response.blob();
    saveAs(blob, `${fileName}.docx`);
  } catch (error) {
    console.error("Failed to export DOCX:", error);
    throw error;
  }
};
