'use client';

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useCallback, useRef, useState } from 'react';

export type PageSize = 'a4' | 'letter';

const PAGE_DIMENSIONS: Record<PageSize, { w: number; h: number }> = {
  a4: { w: 210, h: 297 },
  letter: { w: 215.9, h: 279.4 },
};

export function usePdfExport() {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const exportPdf = useCallback(async (pageSize: PageSize = 'a4', filename?: string) => {
    const el = contentRef.current;
    if (!el) return;
    setExporting(true);
    setError(null);
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const dims = PAGE_DIMENSIONS[pageSize];
      const pdf = new jsPDF('p', 'mm', [dims.w, dims.h]);
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pdfW / canvas.width, pdfH / canvas.height);
      const imgW = canvas.width * ratio;
      const imgH = canvas.height * ratio;
      let heightLeft = imgH;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
      heightLeft -= pdfH;
      while (heightLeft > 0) {
        position -= pdfH;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
        heightLeft -= pdfH;
      }
      const safeName = filename
        ? filename.replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'resume'
        : 'resume';
      pdf.save(`${safeName}.pdf`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setExporting(false);
    }
  }, []);

  return { exportPdf, exporting, error, contentRef };
}
