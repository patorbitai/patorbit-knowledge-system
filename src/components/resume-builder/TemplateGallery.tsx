"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { X, Check, Shield, Cpu, AlertTriangle } from "lucide-react";
import { TEMPLATES } from "@/app/resume-builder/templates";
import { useResumeBuilder } from "@/store/resume-builder";

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
    score > 90 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
    score > 80 ? "bg-sky-500/10 text-sky-400 border-sky-500/20" :
    "bg-amber-500/10 text-amber-400 border-amber-500/20";
  return <div className={clsx("flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[9px] font-bold", color)}><Shield className="w-2.5 h-2.5" />{score}</div>;
}

function ExpBadge({ level }: { level: string }) {
  return <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full border bg-slate-500/10 text-slate-400 border-slate-500/20 text-[9px] font-medium"><Cpu className="w-2.5 h-2.5" />{level}</div>;
}

function hasResumeData(resume: any): boolean {
  return !!(
    resume.name ||
    resume.email ||
    resume.phone ||
    resume.summary ||
    resume.experience?.length ||
    resume.education?.length ||
    resume.skills?.length ||
    resume.projects?.length ||
    resume.certifications?.length
  );
}

export function TemplateGallery({ open, onClose }: { open: boolean; onClose: () => void }) {
  const resume = useResumeBuilder((s) => s.resume);
  const applyTemplate = useResumeBuilder((s) => s.applyTemplate);
  const [activeCategory, setActiveCategory] = useState("All");
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [confirmOverwrite, setConfirmOverwrite] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    const hasData = hasResumeData(resume);
    if (hasData) {
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

  const filteredTemplates = activeCategory === "All" ? TEMPLATES : TEMPLATES.filter(t => t.category === activeCategory);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => { if (!confirmOverwrite) onClose(); }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-4 md:inset-10 z-50 bg-[#0A0E1B] rounded-2xl border border-white/[0.06] shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-white">Choose a Template</h2>
                <p className="text-xs text-slate-500 mt-0.5">Select a design for your resume</p>
              </div>
              <button onClick={() => { if (!confirmOverwrite) onClose(); }} className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
              {/* Category Sidebar */}
              <div className="w-48 border-r border-white/[0.06] overflow-y-auto p-3 space-y-1">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={clsx(
                      "w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      activeCategory === cat ? "bg-blue-500/10 text-white" : "text-slate-400 hover:bg-white/[0.04]"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredTemplates.map((t) => {
                    const isActive = resume.templateId === t.id;
                    return (
                      <div key={t.id} className="flex flex-col relative rounded-xl border p-4 transition-all duration-200 bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04]">
                        {isActive && <div className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500"><Check className="w-3.5 h-3.5 text-white" /></div>}
                        <span className="text-3xl mb-3">{t.preview}</span>
                        <span className="text-sm font-semibold text-slate-200">{t.name}</span>
                        <span className="text-[11px] text-slate-500 mt-1.5 leading-relaxed line-clamp-2 flex-1">{t.description}</span>
                        <div className="flex items-center justify-between mt-4">
                          <AtsBadge score={t.atsRating} />
                          <ExpBadge level={t.experienceLevel} />
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                          <button onClick={() => setPreviewing(t.id)} className="flex-1 px-2 py-1.5 rounded-md text-[10px] font-semibold bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] transition-colors">Preview</button>
                          <button onClick={() => handleSelect(t.id)} className="flex-1 px-2 py-1.5 rounded-md text-[10px] font-semibold bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors">Use</button>
                        </div>
                      </div>
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
                  className="absolute inset-0 z-10 bg-black/60 backdrop-blur-sm flex items-center justify-center"
                  onClick={() => setPreviewing(null)}
                >
                  <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="w-full max-w-3xl aspect-[1/1.414] bg-white rounded-lg shadow-2xl overflow-hidden">
                     <p className="text-black text-center pt-20">A large preview of the resume template would go here.</p>
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
                  className="absolute inset-0 z-20 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="max-w-sm w-full bg-[#0A0E1B] rounded-xl border border-white/[0.08] p-6 shadow-2xl"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">Switch Template?</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Your resume content will remain intact.</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                      Switching templates will update the layout, fonts, and color scheme. Your resume data will be preserved.
                    </p>
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setConfirmOverwrite(null)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmApply}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all"
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
