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

  const canvas = await html2canvas(resumeElement, {
    scale: 2, // Higher scale for better quality
    useCORS: true,
    logging: false,
    backgroundColor: null, // Use element's background
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const ratio = imgWidth / imgHeight;
  const height = pdfWidth / ratio;

  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, height);
  pdf.save(`${fileName}.pdf`);
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
    alert("Failed to generate DOCX file. Please try again.");
  }
};
