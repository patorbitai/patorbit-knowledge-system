"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Download } from "lucide-react";
import { useResumeBuilder } from "@/store/resume-builder";
import { ResumePreview, getActiveTemplate } from "@/components/resume/ResumePreview";
import { exportToPdf, exportToDocx } from "@/utils/export";

export function ExportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const resume = useResumeBuilder((s) => s.resume);
  const template = getActiveTemplate(resume);

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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[360px] z-50 bg-[#0A0E1B] rounded-2xl border border-white/[0.06] shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-white">Export Resume</h2>
              </div>
              <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-2">
               {exportOptions.map((opt) => (
                <button
                  key={opt.label}
                  onClick={opt.action}
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
          <div id="pdf-export-target" className="fixed -left-[9999px] top-0" style={{ width: "210mm", backgroundColor: "#fff" }}>
            <ResumePreview resume={resume} template={template} />
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
