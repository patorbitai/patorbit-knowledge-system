"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { TEMPLATES, type ResumeTemplate } from "../templates";
import { exportToPdf, exportToDocx } from "@/utils/export";
import { ResumePreview, loadResume, type Resume } from "@/components/resume/ResumePreview";

/* ── Analysis data (simulated) ── */
const ANALYSIS = {
  resumeScore: 78,
  atsScore: 82,
  trustScore: 71,
  evidenceCoverage: 65,
  missingSkills: ["Python", "AWS", "Docker", "GraphQL"],
  keywordMatch: 74,
  suggestions: [
    "Add quantifiable achievements to each role — numbers increase credibility by 40%",
    "Your summary could highlight domain expertise more prominently",
    "Consider adding a Projects section for practical proof of skills",
    "Include at least 3 certifications relevant to your target role",
  ],
};

const DEFAULT_TEMPLATE_ID = "modern-clean";

export default function ResumePreviewPage() {
  const [resume, setResume] = useState<Resume | null>(null);
  const [template, setTemplate] = useState<ResumeTemplate>(TEMPLATES.find(t => t.id === DEFAULT_TEMPLATE_ID) || TEMPLATES[0]);
  const [zoom, setZoom] = useState(1);
  const [page, setPage] = useState(1);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load resume from localStorage or shared URL data
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedData = params.get("data");
    if (sharedData) {
      try {
        const decoded = JSON.parse(atob(sharedData));
        setResume(decoded);
        const t = TEMPLATES.find(tmpl => tmpl.id === decoded.templateId);
        if (t) setTemplate(t);
        return;
      } catch {}
    }
    const saved = loadResume();
    if (saved) {
      setResume(saved);
      const t = TEMPLATES.find(tmpl => tmpl.id === saved.templateId);
      if (t) setTemplate(t);
    }
  }, []);

  const handleTemplateChange = useCallback((id: string) => {
    const t = TEMPLATES.find(tmpl => tmpl.id === id);
    if (t && resume) {
      setTemplate(t);
      setResume({ ...resume, templateId: id });
      localStorage.setItem("patorbit-resume-data", JSON.stringify({ ...resume, templateId: id }));
    }
    setShowTemplatePicker(false);
  }, [resume]);

  const handleShare = async () => {
    try {
      const data = loadResume();
      if (!data) return;
      // Encode resume data into URL so it's actually shareable
      const encoded = btoa(JSON.stringify(data));
      const url = `${window.location.origin}/resume-builder/preview?data=${encoded}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback — try shorter URL without data
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {}
    }
  };

  if (!resume) {
    return (
      <main className="min-h-screen bg-[#070B14] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <p className="text-slate-400 text-sm mb-4">No resume data found</p>
          <Link href="/resume-builder" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:from-blue-500 hover:to-indigo-500 transition-all">
            Go to Builder
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070B14] text-white flex flex-col">
      {/* ── Header ── */}
      <div className="sticky top-16 z-30 bg-[#070B14]/90 backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_1px_40px_-12px_rgba(0,0,0,0.6)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/resume-builder" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to Builder
              </Link>
              <div className="h-4 w-px bg-white/[0.08]" />
              <h1 className="text-sm font-semibold text-white tracking-tight">Resume Preview</h1>
            </div>
            <div className="flex items-center gap-2">
              {/* Template Selector */}
              <div className="relative">
                <button onClick={() => setShowTemplatePicker(!showTemplatePicker)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-xs text-slate-300 hover:bg-white/[0.1] transition-colors flex items-center gap-1.5">
                  <span>{template.preview}</span>
                  <span className="hidden sm:inline">{template.name}</span>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showTemplatePicker && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowTemplatePicker(false)} />
                    <div className="absolute left-0 top-full mt-1.5 z-20 w-64 bg-[#0F1629] border border-white/[0.1] rounded-xl shadow-2xl max-h-80 overflow-y-auto p-1.5">
                      {TEMPLATES.map(t => (
                        <button key={t.id} onClick={() => handleTemplateChange(t.id)}
                          className={clsx("w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 transition-colors text-xs",
                            template.id === t.id ? "bg-blue-500/20 text-blue-400" : "text-slate-300 hover:bg-white/[0.06]")}>
                          <span className="text-base">{t.preview}</span>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium block">{t.name}</span>
                            <span className="text-[10px] text-slate-500 block truncate">{t.description}</span>
                          </div>
                          {template.id === t.id && <svg className="w-3 h-3 ml-auto text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Zoom controls */}
              <div className="hidden sm:flex items-center gap-1">
                <button onClick={() => setZoom(z => Math.max(0.4, z - 0.1))} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                </button>
                <span className="text-xs text-slate-400 w-8 text-center font-mono">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                </button>
                <button onClick={() => setZoom(1)} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all ml-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" /></svg>
                </button>
              </div>

              <div className="h-4 w-px bg-white/[0.08]" />

              {/* Actions */}
              <button onClick={() => setShowPdfModal(true)}
                className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/25 text-red-400 text-xs font-medium hover:bg-red-500/25 transition-all flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                PDF
              </button>
              <button onClick={() => exportToDocx(resume, `resume-${new Date().toISOString().slice(0, 10)}`)}
                className="px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/25 text-blue-400 text-xs font-medium hover:bg-blue-500/25 transition-all flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                DOCX
              </button>
              <button onClick={handleShare}
                className="px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-slate-300 text-xs font-medium hover:bg-white/[0.1] transition-all flex items-center gap-1.5">
                {copied ? (
                  <><svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> Copied</>
                ) : (
                  <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg> Share</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 gap-8">
        {/* ── Resume Preview (center) ── */}
        <div className="flex-1 min-w-0 flex flex-col items-center">
          {/* Page indicator */}
          <div className="flex items-center gap-2 mb-4 text-xs text-slate-500">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="font-mono text-slate-400">Page {page}</span>
            <button onClick={() => setPage(p => Math.min(3, p + 1))} disabled={page >= 3} className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          {/* A4 Paper Mockup */}
          <div
            id="resume-preview-content"
            className="w-full max-w-[210mm] bg-white rounded-lg shadow-[0_8px_40px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.05)] overflow-hidden transition-all"
            style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
          >
            <ResumePreview resume={resume} template={template} />
          </div>
        </div>

        {/* ── Right Sidebar: AI Analysis ── */}
        <aside className="hidden xl:block w-80 shrink-0">
          <div className="sticky top-32 space-y-5">
            {/* Scores */}
            <div className="rounded-xl border border-slate-800 bg-[#0F1629] p-5">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
                <span className="text-xs font-semibold text-white uppercase tracking-wider">AI Resume Analysis</span>
              </div>

              <div className="space-y-4">
                <ScoreBar label="Resume Score" value={ANALYSIS.resumeScore} color="bg-blue-500" />
                <ScoreBar label="ATS Compatibility" value={ANALYSIS.atsScore} color="bg-emerald-500" />
                <ScoreBar label="Trust Score" value={ANALYSIS.trustScore} color="bg-amber-500" />
                <ScoreBar label="Evidence Coverage" value={ANALYSIS.evidenceCoverage} color="bg-purple-500" />
                <ScoreBar label="Keyword Match" value={ANALYSIS.keywordMatch} color="bg-cyan-500" />
              </div>
            </div>

            {/* Missing Skills */}
            <div className="rounded-xl border border-slate-800 bg-[#0F1629] p-5">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Missing Skills</h3>
              <div className="flex flex-wrap gap-2">
                {ANALYSIS.missingSkills.map(skill => (
                  <span key={skill} className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Suggestions */}
            <div className="rounded-xl border border-slate-800 bg-[#0F1629] p-5">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Suggestions</h3>
              <ul className="space-y-2.5">
                {ANALYSIS.suggestions.map((s, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Passport CTA */}
            <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 p-5 text-center">
              <p className="text-sm font-medium text-white mb-1">Turn this into a Career Passport</p>
              <p className="text-xs text-slate-400 mb-4">Verify your claims and build a trusted professional identity.</p>
              <Link href="/" className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-semibold text-white hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20">
                Get Your Passport
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {/* ── PDF Export Modal ── */}
      {showPdfModal && (
        <PdfExportModal
          onClose={() => setShowPdfModal(false)}
          onExport={(name) => {
            exportToPdf("resume-preview-content", name);
            setShowPdfModal(false);
          }}
        />
      )}
    </main>
  );
}

/* ── PDF Export Modal ── */
function PdfExportModal({ onClose, onExport }: { onClose: () => void; onExport: (name: string) => void }) {
  const [name, setName] = useState(`resume-${new Date().toISOString().slice(0, 10)}`);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0F1629] border border-white/[0.08] rounded-2xl p-6 max-w-md mx-4 shadow-2xl w-full" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-white mb-1.5">Export as PDF</h3>
        <p className="text-xs text-slate-400 mb-5">Choose a name for your resume file.</p>
        <div className="mb-5">
          <label className="block text-[10px] font-medium text-slate-500 mb-1.5">File Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none placeholder:text-slate-500 transition-all"
            placeholder="My Resume" autoFocus />
          <p className="text-[10px] text-slate-600 mt-1.5">File will be saved as <span className="font-mono text-slate-400">{name}.pdf</span></p>
        </div>
        <div className="flex gap-2.5 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-white/[0.08] text-slate-300 hover:bg-white/[0.06] text-xs font-medium transition-all">Cancel</button>
          <button onClick={() => onExport(name)} className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-500 text-xs font-semibold transition-all shadow-lg shadow-red-600/20">
            Download PDF
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Score Bar ── */
function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-xs font-semibold text-white tabular-nums">{value}/100</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
