"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { X, Check } from "lucide-react";
import { FONTS, COLOR_PALETTES } from "@/app/resume-builder/templates";
import { useResumeBuilder } from "@/store/resume-builder";

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const resume = useResumeBuilder((s) => s.resume);
  const updateField = useResumeBuilder((s) => s.updateField);
  const [font, setFont] = useState(resume.fontPreference || "inter");
  const [palette, setPalette] = useState(resume.palettePreference || "slate");
  const [exportFormat, setExportFormat] = useState(resume.exportFormat || "pdf");
  const [pageSize, setPageSize] = useState(resume.pageSize || "letter");

  const handleApply = () => {
    updateField("fontPreference", font);
    updateField("palettePreference", palette);
    updateField("exportFormat", exportFormat);
    updateField("pageSize", pageSize);
    onClose();
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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[440px] z-50 bg-[#0A0E1B] rounded-2xl border border-white/[0.06] shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <h2 className="text-sm font-semibold text-white">Settings</h2>
              <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Font Selection */}
              <div>
                <label className="text-xs font-medium text-slate-300 mb-2 block">Default Font</label>
                <div className="grid grid-cols-2 gap-2">
                  {FONTS.slice(0, 8).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFont(f.id)}
                      className={clsx(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-xs border transition-all",
                        font === f.id
                          ? "border-blue-500/40 bg-blue-500/10 text-white"
                          : "border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/[0.12]",
                      )}
                    >
                      {font === f.id && <Check className="w-3 h-3 text-blue-400" />}
                      <span style={{ fontFamily: f.family }}>{f.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Palette */}
              <div>
                <label className="text-xs font-medium text-slate-300 mb-2 block">Color Palette</label>
                <div className="grid grid-cols-3 gap-2">
                  {COLOR_PALETTES.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPalette(p.id)}
                      className={clsx(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
                        palette === p.id
                          ? "border-blue-500/40 bg-blue-500/10"
                          : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]",
                      )}
                    >
                      <div className="flex gap-0.5">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: p.colors.primary }} />
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: p.colors.accent }} />
                      </div>
                      <span className="text-[10px] text-slate-400">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Export Defaults */}
              <div>
                <label className="text-xs font-medium text-slate-300 mb-2 block">Export Defaults</label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-500 mb-1 block">Format</label>
                    <select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                    >
                      <option value="pdf">PDF</option>
                      <option value="docx">DOCX</option>
                      <option value="json">JSON</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-500 mb-1 block">Page Size</label>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                    >
                      <option value="letter">Letter</option>
                      <option value="a4">A4</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/[0.06]">
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all">Cancel</button>
              <button onClick={handleApply} className="px-4 py-2 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all">Apply</button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
