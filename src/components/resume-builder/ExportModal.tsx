"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useCallback } from "react";
import { X, FileText, Download } from "lucide-react";
import { useResumeBuilder } from "@/store/resume-builder";
import { ResumePreview, getActiveTemplate } from "@/components/resume/ResumePreview";
import { exportToPdf, exportToDocx } from "@/utils/export";

export function ExportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const resume = useResumeBuilder((s) => s.resume);
  const template = getActiveTemplate(resume);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const handleExportPdf = () => {
    exportToPdf("pdf-export-target", resume.name || "resume");
    onClose();
  };

  const handleExportDocx = () => {
    exportToDocx(resume, resume.name || "resume");
    onClose();
  };

  const exportOptions = [
    { label: "PDF", description: "Download as a polished PDF document", icon: FileText, action: handleExportPdf },
    { label: "DOCX", description: "Export as a Microsoft Word document", icon: FileText, action: handleExportDocx },
  ];

  const moveFocus = useCallback((index: number) => {
    const next = (index + exportOptions.length) % exportOptions.length;
    optionRefs.current[next]?.focus();
  }, [exportOptions.length]);

  // Remember the trigger so we can return focus when closing;
  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement | null;
      const t = setTimeout(() => optionRefs.current[0]?.focus(), 0);
      return () => clearTimeout(t);
    } else {
      triggerRef.current?.focus?.();
    }
  }, [open]);

  // Escape to close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Keep Tab cycling within the dialog.
  const handleDialogKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const focusables = [...optionRefs.current, closeButtonRef.current].filter(Boolean);
    if (focusables.length === 0) return;
    const first = focusables[0] as HTMLElement;
    const last = focusables[focusables.length - 1] as HTMLElement;
    const active = document.activeElement;
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const handleOptionKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      moveFocus(index + 1);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      moveFocus(index - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      moveFocus(0);
    } else if (e.key === "End") {
      e.preventDefault();
      moveFocus(exportOptions.length - 1);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-modal-title"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[360px] z-50 bg-burlap-shadow bg-[#0A0E1B] rounded-2xl border border-white/[0.06] shadow-2xl overflow-hidden"
            onKeyDown={handleDialogKeyDown}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-slate-400" />
                <h2 id="export-modal-title" className="text-sm font-semibold text-white">Export Resume</h2>
              </div>
              <button
                ref={closeButtonRef}
                onClick={onClose}
                aria-label="Close export menu"
                className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-2">
              {exportOptions.map((opt, i) => (
                <button
                  key={opt.label}
                  ref={(el) => { optionRefs.current[i] = el; }}
                  onClick={opt.action}
                  onKeyDown={(e) => handleOptionKeyDown(e, i)}
                  className="w-full flex items-center gap-4 px-5 py-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all text-left"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15">
                    <opt.icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-200">{`Download ${opt.label}`}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{opt.description}</p>
                  </div>
                  <Download className="w-4 h-4 text-slate-500" />
                </button>
              ))}
            </div>
          </motion.div>

          {/* Hidden resume preview for PDF capture */}
          <div id="pdf-export-target" aria-hidden="true" inert className="fixed -left-[9999px] top-0" style={{ width: "210mm", backgroundColor: "#fff" }}>
            <ResumePreview resume={resume} template={template} />
          </div>
        </>
      )}
    </AnimatePresence>
  );
}