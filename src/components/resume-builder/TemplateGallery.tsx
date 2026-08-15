"use client";

import { Fragment, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { X, Check, Eye, Shield, Layers, AlertTriangle, Sparkles, Search } from "lucide-react";
import { TEMPLATES } from "@/app/resume-builder/templates";
import { useResumeBuilder } from "@/store/resume-builder";
import { MiniaturePreview } from "@/components/resume-builder/MiniaturePreview";
import { FullTemplatePreview } from "@/components/resume-builder/FullTemplatePreview";
import { filterTemplates } from "@/lib/template-search";

const SIDEBAR_SECTIONS = [
  { id: "Recommended", label: "Recommended", emoji: "⭐" },
  { id: "ATS & Professional", label: "ATS & Professional", emoji: "📄" },
  { id: "Engineering",  label: "Engineering",  emoji: "💻" },
  { id: "Business & Consulting", label: "Business & Consulting", emoji: "📊" },
  { id: "Executive", label: "Executive", emoji: "🏛️" },
  { id: "Academic",     label: "Academic",     emoji: "🎓" },
  { id: "Creative",     label: "Creative",     emoji: "🎨" },
  { id: "More Templates", label: "More Templates", emoji: "📚" },
];

const PREMIUM_IDS = new Set(["patorbit-modern", "executive-pro", "minimal-ats", "engineering-clean"]);

const SECTION_IDS: Record<string, string[]> = {
  Recommended: ["patorbit-modern", "executive-pro", "minimal-ats", "engineering-clean"],
  "ATS & Professional": ["minimal-ats", "modern-clean", "corporate-blue", "premium-slate", "swiss-design"],
  Engineering:  ["engineering-clean", "tech-mono", "compact-pro", "minimal-edge", "gradient-flow", "timeline-pro"],
  "Business & Consulting": ["consulting-elite", "product-manager", "executive", "corporate-blue", "classic-serif"],
  Executive: ["executive-pro", "executive", "luxury-gold", "dark-elegance"],
  Academic:     ["academic-cv", "academic-formal", "scientific", "classic-serif"],
  Creative:     ["creative-professional", "creative-burst", "creative-portfolio", "sidebar-elegance", "gradient-flow"],
};

// Templates not explicitly filed under a topical section — the "More
// Templates" catch-all. Every one of the 29 templates stays reachable.
const TOPICAL_IDS = new Set(Object.values(SECTION_IDS).flat());

function AtsBadge({ score }: { score: number }) {
  const { dot, style } =
    score >= 95
      ? { dot: "🟢", style: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" }
      : score >= 90
      ? { dot: "🔵", style: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" }
      : score >= 85
      ? { dot: "🟡", style: "bg-amber-500/15 text-amber-400 border-amber-500/30" }
      : { dot: "⚪", style: "bg-slate-500/15 text-slate-400 border-slate-500/30" };
  return (
    <div className={clsx("flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-semibold tracking-wide", style)}>
      <span className="text-[9px] leading-none">{dot}</span>
      <span>ATS Score</span>
      <span className="opacity-70">{score}%</span>
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
  const [activeCategory, setActiveCategory] = useState("Recommended");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [confirmOverwrite, setConfirmOverwrite] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const handleSelect = (id: string) => {
    if (hasResumeData(resume)) {
      // Close the full preview so the overwrite confirm dialog stays visible.
      setPreviewing(null);
      setConfirmOverwrite(id);
    } else {
      applyTemplate(id);
      setPreviewing(null);
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

  const filteredTemplates = useMemo(() => {
    const bySection =
      activeCategory === "More Templates"
        ? TEMPLATES.filter((t) => !TOPICAL_IDS.has(t.id))
        : activeCategory in SECTION_IDS
          ? TEMPLATES.filter((t) => SECTION_IDS[activeCategory].includes(t.id))
          : TEMPLATES;
    const ordered = activeCategory in SECTION_IDS
      ? SECTION_IDS[activeCategory]
          .map((id) => bySection.find((t) => t.id === id))
          .filter(Boolean) as typeof TEMPLATES
      : bySection;
    return filterTemplates(ordered, { query: searchQuery });
  }, [activeCategory, searchQuery]);

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
            <div className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.06] shrink-0 backdrop-blur-sm"
              style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-white/[0.08]">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="hidden sm:block">
                  <h2 className="text-base font-semibold text-white tracking-tight">Choose a Resume Template</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {filteredTemplates.length} template{filteredTemplates.length !== 1 ? "s" : ""} available
                  </p>
                </div>
              </div>

              {/* Smart search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Escape") searchRef.current?.blur(); }}
                  placeholder="Search templates…"
                  className="w-full bg-white/[0.04] border border-white/[0.07] rounded-lg pl-8 pr-4 py-2 text-[12px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/40 focus:bg-white/[0.06] transition-all"
                  aria-label="Search templates"
                />
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(""); searchRef.current?.focus(); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-500 hover:text-slate-300 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <button
                onClick={() => { if (!confirmOverwrite) onClose(); }}
                className="p-2 shrink-0 text-slate-500 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main */}
            <div className="flex flex-1 overflow-hidden">
              {/* Audience Sidebar */}
              <div className="w-44 shrink-0 border-r border-white/[0.05] overflow-y-auto p-3 space-y-0.5">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 px-3 pt-1 pb-2">Browse</p>
                {SIDEBAR_SECTIONS.map((section, i) => (
                  <Fragment key={section.id}>
                    {i === SIDEBAR_SECTIONS.length - 1 && (
                      <div className="my-2 border-t border-white/[0.05]" />
                    )}
                    <button
                      onClick={() => setActiveCategory(section.id)}
                      className={clsx(
                        "w-full text-left px-3 py-2 rounded-lg text-[11px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50 flex items-center gap-2",
                        activeCategory === section.id
                          ? "bg-gradient-to-r from-cyan-500/10 to-violet-500/10 text-white border border-white/[0.07]"
                          : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                      )}
                    >
                      <span>{section.emoji}</span>
                      <span>{section.label}</span>
                    </button>
                  </Fragment>
                ))}
              </div>

              {/* Grid */}
              <div className="flex-1 overflow-y-auto p-5">
                {filteredTemplates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-16">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.06]">
                      <Search className="w-5 h-5 text-slate-600" />
                    </div>
                    <p className="text-sm font-medium text-slate-400">No templates match &ldquo;{searchQuery}&rdquo;</p>
                    <p className="text-[11px] text-slate-600">Try 'minimal', 'executive', 'ats', or 'creative'</p>
                    <button
                      onClick={() => setSearchQuery("")}
                      className="mt-1 px-3 py-1.5 rounded-lg text-[11px] font-medium text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all"
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredTemplates.map((t) => {
                    const isActive = resume.templateId === t.id;
                    return (
                      <motion.div
                        key={t.id}
                        data-template-id={t.id}
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

                        {/* Premium badge */}
                        {PREMIUM_IDS.has(t.id) && (
                          <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-400/30 text-amber-300 text-[9px] font-semibold tracking-wide">
                            ⭐ Premium
                          </div>
                        )}

                        {/* Selected badge */}
                        {isActive && (
                          <div className="absolute top-2.5 right-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-[0_0_12px_rgba(6,182,212,0.5)]">
                            <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                          </div>
                        )}

                        {/* Live miniature preview — clicking it opens the full resume preview */}
                        <button
                          type="button"
                          onClick={() => setPreviewing(t.id)}
                          title={`Preview ${t.name}`}
                          aria-label={`Preview ${t.name} — open full resume preview`}
                          className="p-3 pb-0 block w-full text-left cursor-pointer"
                        >
                          <MiniaturePreview templateId={t.id} />
                        </button>

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
                          {t.recommendedFor && (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-300 border-amber-500/20 text-[10px] font-medium mt-1.5 w-fit">
                              <Sparkles className="w-2.5 h-2.5 shrink-0" />
                              <span className="text-amber-500/70">Best for:</span>&nbsp;{t.recommendedFor}
                            </div>
                          )}

                          {/* Selected info panel */}
                          {isActive && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              transition={{ duration: 0.18 }}
                              className="mt-2.5 rounded-lg border border-cyan-500/20 bg-cyan-500/[0.04] px-3 py-2.5 space-y-1.5 overflow-hidden"
                            >
                              {[
                                { label: "Best For",        value: t.category },
                                { label: "ATS Score",       value: `${t.atsRating}%` },
                                { label: "Experience",      value: t.experienceLevel },
                                { label: "Recommended For", value: t.recommendedFor ?? "—" },
                                { label: "One Page",        value: "✓" },
                                { label: "Multi Page",      value: "✓" },
                              ].map(({ label, value }) => (
                                <div key={label} className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] text-slate-500">{label}</span>
                                  <span className="text-[10px] font-medium text-slate-300 text-right">{value}</span>
                                </div>
                              ))}
                            </motion.div>
                          )}

                          {/* Action area — always visible, primary action first */}
                          <div className="flex flex-col sm:flex-row gap-2 mt-3">
                            {isActive ? (
                              <div
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30"
                                role="status"
                              >
                                <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                                Current Template
                              </div>
                            ) : (
                              <button
                                onClick={() => handleSelect(t.id)}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold text-white bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 shadow-[0_4px_14px_rgba(6,182,212,0.2)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                                Use This Template
                              </button>
                            )}
                            <button
                              onClick={() => setPreviewing(t.id)}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold text-slate-300 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-white transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Preview Full Resume
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                )}
              </div>
            </div>

            {/* Full resume preview — full-screen modal rendered via portal.
                No AnimatePresence here: the preview unmounts immediately on
                close so state transitions stay deterministic. */}
            {previewing && !confirmOverwrite && (
              <FullTemplatePreview
                key={previewing}
                templateId={previewing}
                templates={filteredTemplates}
                onClose={() => setPreviewing(null)}
                onUseTemplate={handleSelect}
              />
            )}

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
