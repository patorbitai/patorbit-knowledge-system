"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { X, Check, Shield, Layers, AlertTriangle, Sparkles } from "lucide-react";
import { TEMPLATES } from "@/app/resume-builder/templates";
import { useResumeBuilder } from "@/store/resume-builder";
import { MiniaturePreview } from "@/components/resume-builder/MiniaturePreview";

const CATEGORIES = [
  "All",
  "Software Engineer",
  "AI/ML Engineer",
  "Data Scientist",
  "Product Manager",
  "Designer",
  "Student",
  "Fresher",
  "DevOps",
  "Cybersecurity",
];

function AtsBadge({ score }: { score: number }) {
  const color =
    score > 90
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      : score > 80
      ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
      : "bg-amber-500/15 text-amber-400 border-amber-500/30";
  return (
    <div className={clsx("flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold tracking-wide", color)}>
      <Shield className="w-2.5 h-2.5" />
      ATS {score}
    </div>
  );
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border bg-violet-500/10 text-violet-300 border-violet-500/20 text-[10px] font-medium truncate max-w-[110px]">
      <Layers className="w-2.5 h-2.5 shrink-0" />
      <span className="truncate">{category}</span>
    </div>
  );
}


function hasResumeData(resume: any): boolean {
  return !!(
    resume.name || resume.email || resume.phone || resume.summary ||
    resume.experience?.length || resume.education?.length ||
    resume.skills?.length || resume.projects?.length || resume.certifications?.length
  );
}

export function TemplateGallery({ open, onClose }: { open: boolean; onClose: () => void }) {
  const resume = useResumeBuilder((s) => s.resume);
  const applyTemplate = useResumeBuilder((s) => s.applyTemplate);
  const [activeCategory, setActiveCategory] = useState("All");
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [confirmOverwrite, setConfirmOverwrite] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    if (hasResumeData(resume)) {
      setConfirmOverwrite(id);
    } else {
      applyTemplate(id);
      onClose();
    }
  };

  const confirmApply = () => {
    if (confirmOverwrite) {
      applyTemplate(confirmOverwrite);
      setConfirmOverwrite(null);
      onClose();
    }
  };

  const filteredTemplates =
    activeCategory === "All" ? TEMPLATES : TEMPLATES.filter((t) => t.category === activeCategory);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
            onClick={() => { if (!confirmOverwrite) onClose(); }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 24 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-4 md:inset-8 z-50 rounded-2xl border border-white/[0.07] shadow-[0_32px_80px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col"
            style={{ background: "linear-gradient(160deg, #0c1122 0%, #080d1a 100%)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0 backdrop-blur-sm"
              style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-white/[0.08]">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white tracking-tight">Choose a Template</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {filteredTemplates.length} template{filteredTemplates.length !== 1 ? "s" : ""} available
                  </p>
                </div>
              </div>
              <button
                onClick={() => { if (!confirmOverwrite) onClose(); }}
                className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main */}
            <div className="flex flex-1 overflow-hidden">
              {/* Category Sidebar */}
              <div className="w-44 shrink-0 border-r border-white/[0.05] overflow-y-auto p-3 space-y-0.5">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 px-3 pt-1 pb-2">Category</p>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={clsx(
                      "w-full text-left px-3 py-2 rounded-lg text-[11px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50",
                      activeCategory === cat
                        ? "bg-gradient-to-r from-cyan-500/10 to-violet-500/10 text-white border border-white/[0.07]"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Grid */}
              <div className="flex-1 overflow-y-auto p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredTemplates.map((t) => {
                    const isActive = resume.templateId === t.id;
                    return (
                      <motion.div
                        key={t.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18 }}
                        className={clsx(
                          "group relative flex flex-col rounded-xl border transition-all duration-200 overflow-hidden cursor-pointer focus-within:ring-2 focus-within:ring-cyan-500/40",
                          isActive
                            ? "border-cyan-500/50 bg-gradient-to-b from-cyan-500/[0.06] to-violet-500/[0.04] shadow-[0_0_24px_rgba(6,182,212,0.12)]"
                            : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.04] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:-translate-y-0.5"
                        )}
                      >
                        {/* Selected glow ring */}
                        {isActive && (
                          <div className="absolute inset-0 rounded-xl pointer-events-none"
                            style={{ boxShadow: "inset 0 0 0 1px rgba(6,182,212,0.3)" }} />
                        )}

                        {/* Selected badge */}
                        {isActive && (
                          <div className="absolute top-2.5 right-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-[0_0_12px_rgba(6,182,212,0.5)]">
                            <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                          </div>
                        )}

                        {/* Live miniature preview */}
                        <div className="p-3 pb-0">
                          <MiniaturePreview templateId={t.id} />
                        </div>

                        {/* Card body */}
                        <div className="flex flex-col flex-1 p-3 pt-2.5">
                          <span className="text-[13px] font-semibold text-slate-100 leading-snug tracking-tight">
                            {t.name}
                          </span>
                          <span className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2 flex-1">
                            {t.description}
                          </span>

                          {/* Badges */}
                          <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                            <AtsBadge score={t.atsRating} />
                            <CategoryBadge category={t.category} />
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 mt-3">
                            <button
                              onClick={() => setPreviewing(t.id)}
                              className="flex-1 px-2 py-1.5 rounded-lg text-[11px] font-medium bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-slate-200 transition-all border border-white/[0.06] hover:border-white/[0.12] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
                            >
                              Preview
                            </button>
                            <button
                              onClick={() => handleSelect(t.id)}
                              className={clsx(
                                "flex-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-1",
                                isActive
                                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 focus-visible:ring-cyan-500/50"
                                  : "bg-gradient-to-r from-cyan-500/15 to-violet-500/15 text-slate-200 border border-white/[0.08] hover:from-cyan-500/25 hover:to-violet-500/25 hover:border-white/[0.14] focus-visible:ring-cyan-500/40"
                              )}
                            >
                              {isActive ? "Selected" : "Use"}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Preview Modal */}
            <AnimatePresence>
              {previewing && !confirmOverwrite && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
                  onClick={() => setPreviewing(null)}
                >
                  <motion.div
                    initial={{ scale: 0.92, y: 8 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.92, y: 8 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-3xl aspect-[1/1.414] bg-white rounded-xl shadow-2xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="text-black/40 text-sm text-center pt-20">
                      Full preview coming soon.
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Confirm Overwrite Dialog */}
            <AnimatePresence>
              {confirmOverwrite && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 bg-black/75 backdrop-blur-md flex items-center justify-center p-6"
                >
                  <motion.div
                    initial={{ scale: 0.92, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.92, y: 20 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-sm w-full rounded-2xl border border-white/[0.08] p-6 shadow-2xl"
                    style={{ background: "linear-gradient(160deg, #0e1525 0%, #090e1a 100%)" }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">Switch Template?</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Your content will be preserved.</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                      Switching templates updates the layout, fonts, and colour scheme. All your resume data stays intact.
                    </p>
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setConfirmOverwrite(null)}
                        className="px-4 py-2 rounded-lg text-[11px] font-medium text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmApply}
                        className="px-4 py-2 rounded-lg text-[11px] font-semibold bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-300 border border-cyan-500/30 hover:from-cyan-500/30 hover:to-violet-500/30 transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50"
                      >
                        Apply Template
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
