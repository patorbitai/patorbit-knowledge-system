import { saveAs } from "file-saver";

// --- PDF Export ---
// Uses the browser's native print system. Print CSS in globals.css handles
// A4 sizing, page breaks, and hiding all app chrome except #pdf-export-target.
export const exportToPdf = (_elementId: string, fileName: string) => {
  const prev = document.title;
  document.title = fileName;
  // Double-rAF: lets React commit the closed-modal state before the
  // print dialog opens, so the modal doesn't appear in the output.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.print();
      document.title = prev;
    });
  });
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
