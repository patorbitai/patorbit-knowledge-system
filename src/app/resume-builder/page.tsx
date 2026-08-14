"use client";

import { useEffect, useCallback, useState } from "react";
import Link from "next/link";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useResumeBuilder, defaultResume } from "@/store/resume-builder";
import { ai } from "@/lib/ai/client";
import { LeftSidebar, CenterWorkspace, RightCopilot, ClaimsReview } from "@/components/resume-builder";
import MobileSectionNav from "@/components/resume-builder/MobileSectionNav";
import { SaveStatusIndicator } from "@/components/resume-builder/SaveStatusIndicator";
import { SettingsModal } from "@/components/resume-builder/SettingsModal";
import { Eye, Settings, User, ArrowLeft, ChevronRight } from "lucide-react";
import { debounce } from "@/lib/debounce";

/* ── Resume Selector Dropdown ── */
function ResumeSelector() {
  const resumes = useResumeBuilder((s) => s.resumes);
  const activeResumeId = useResumeBuilder((s) => s.activeResumeId);
  const switchResume = useResumeBuilder((s) => s.switchResume);
  const createResume = useResumeBuilder((s) => s.createResume);
  const renameResume = useResumeBuilder((s) => s.renameResume);
  const deleteResume = useResumeBuilder((s) => s.deleteResume);
  const [isOpen, setIsOpen] = useState(false);

  const activeResume = resumes.find((r) => r.resumeId === activeResumeId) || resumes[0];

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select resume"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-all text-xs font-medium text-white cursor-pointer"
      >
        <span className="max-w-[120px] truncate">{activeResume?.resumeName || "My Resume"}</span>
        <ChevronRight className={`w-3 h-3 transition-transform ${isOpen ? "rotate-90" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setIsOpen(false)} />
          <div
            role="listbox"
            aria-label="My Resumes"
            className="absolute left-0 mt-1.5 w-64 rounded-xl bg-[#0A0E1B] border border-white/[0.08] shadow-2xl py-1 z-50"
          >
            <div className="px-3 py-1.5 border-b border-white/[0.06] text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              My Resumes ({resumes.length})
            </div>
            <div className="max-h-48 overflow-y-auto py-1">
              {resumes.map((r) => {
                const isActive = r.resumeId === activeResumeId;
                const templateName = r.templateId ? r.templateId.replace(/-/g, " ") : "modern clean";
                const itemCount = (r.experience?.length || 0) + (r.skills?.length || 0) + (r.education?.length || 0);
                return (
                  <div
                    key={r.resumeId}
                    role="option"
                    aria-selected={isActive}
                    className={`flex items-center justify-between px-3 py-2 text-xs hover:bg-white/[0.06] group cursor-pointer ${
                      isActive ? "text-cyan-400 font-semibold bg-white/[0.04]" : "text-slate-300"
                    }`}
                    onClick={() => {
                      if (r.resumeId) switchResume(r.resumeId);
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex flex-col truncate flex-1 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-medium">{r.resumeName || "Untitled Resume"}</span>
                        {isActive && <span className="text-[10px] px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-normal">Active</span>}
                      </div>
                      <span className="text-[10px] text-slate-500 capitalize">
                        {templateName} • {itemCount} items
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        title="Rename resume"
                        aria-label={`Rename ${r.resumeName}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          const newName = prompt("Rename resume:", r.resumeName);
                          if (newName !== null) {
                            const trimmed = newName.trim();
                            if (trimmed && r.resumeId) {
                              renameResume(r.resumeId, trimmed);
                            }
                          }
                        }}
                        className="p-1 hover:text-white text-slate-400 rounded cursor-pointer"
                      >
                        ✏️
                      </button>
                      {resumes.length > 1 && (
                        <button
                          title="Delete resume"
                          aria-label={`Delete ${r.resumeName}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete "${r.resumeName}"? This action cannot be undone.`) && r.resumeId) {
                              deleteResume(r.resumeId);
                            }
                          }}
                          className="p-1 hover:text-red-400 text-slate-400 rounded cursor-pointer"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-1.5 border-t border-white/[0.06]">
              <button
                onClick={() => {
                  const name = prompt("New resume name:", `Resume ${resumes.length + 1}`);
                  if (name !== null) {
                    createResume(name.trim() || undefined);
                    setIsOpen(false);
                  }
                }}
                aria-label="Create new resume"
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-cyan-400 bg-cyan-500/[0.1] hover:bg-cyan-500/[0.2] transition-all cursor-pointer"
              >
                + New Resume
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ── App Header ── */
function AppHeader({ onOpenSettings }: { onOpenSettings: () => void }) {
  const resume = useResumeBuilder((s) => s.resume);

  return (
    <header className="sticky top-0 z-40 h-12 bg-[#070d18]/90 backdrop-blur-xl border-b border-[rgba(148,163,184,.14)]">
      <div className="flex items-center justify-between h-full px-4">
        {/* Left: Logo + breadcrumb nav */}
        <div className="flex items-center gap-2.5">
          {/* Logo mark */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm">
              <span className="text-[10px] font-bold text-white">P</span>
            </div>
            <span className="text-sm font-semibold text-white tracking-tight hidden sm:inline">Patorbit</span>
          </Link>

          <div className="h-3 w-px bg-white/[0.08]" />

          {/* ← Dashboard */}
          <Link
            href="/overview"
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all group"
          >
            <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
            <span>Dashboard</span>
          </Link>

          <ChevronRight className="w-3 h-3 text-slate-700 shrink-0" />

          {/* Current context */}
          <span className="text-[11px] font-medium text-slate-300">Resume Builder</span>

          <div className="h-3 w-px bg-white/[0.08]" />

          {/* Resume Selector */}
          <ResumeSelector />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <SaveStatusIndicator />

          <div className="h-3 w-px bg-white/[0.08]" />

          <Link
            href="/resume-builder/preview"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preview</span>
          </Link>

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all">
            <User className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}

/* ── Main Page ── */
export default function ResumeBuilderPage() {
  const resume = useResumeBuilder((s) => s.resume);
  const setResume = useResumeBuilder((s) => s.setResume);
  const setAnalysis = useResumeBuilder((s) => s.setAnalysis);
  const setAnalysisLoading = useResumeBuilder((s) => s.setAnalysisLoading);
  const saveStatus = useResumeBuilder((s) => s.saveStatus);
  const setSaveStatus = useResumeBuilder((s) => s.setSaveStatus);
  const setSuggestedClaims = useResumeBuilder((s) => s.setSuggestedClaims);
  const [showSettings, setShowSettings] = useState(false);

  const debouncedAnalysis = useCallback(
    debounce(async (currentResume) => {
      setAnalysisLoading(true);
      try {
        const result = await ai.analyzeResume(currentResume);
        setAnalysis(result);
      } catch {
        setAnalysis(null);
      } finally {
        setAnalysisLoading(false);
      }
    }, 1500),
    [setAnalysis, setAnalysisLoading],
  );

  const debouncedMarkSaved = useCallback(
    debounce(() => {
      setSaveStatus("saved");
    }, 1200),
    [setSaveStatus],
  );

  const debouncedClaimGen = useCallback(
    debounce(async (currentResume) => {
      // Only suggest claims when there is enough identity data.
      if (!currentResume?.name && !currentResume?.summary && currentResume?.experience?.length === 0) return;
      try {
        const result = await ai.generateClaims(currentResume, currentResume.claims);
        if (result?.claims?.length) {
          setSuggestedClaims(result.claims);
        }
      } catch {
        // Silently ignore claim generation failures — it must never block resume editing.
      }
    }, 2500),
    [setSuggestedClaims],
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem("patorbit-resume-v2");
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          if (parsed?.state?.resume) setResume(parsed.state.resume);
        } catch {
          setResume(defaultResume);
        }
      }
    }
  }, [setResume]);

  useEffect(() => {
    if (saveStatus === "unsaved") {
      setSaveStatus("saving");
      debouncedAnalysis(resume);
      debouncedMarkSaved();
      debouncedClaimGen(resume);
    }
  }, [resume, saveStatus, setSaveStatus, debouncedAnalysis, debouncedMarkSaved, debouncedClaimGen]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen w-full bg-[#070d18] text-[#f8fafc] font-sans antialiased flex flex-col overflow-hidden selection:bg-cyan-500/30">
        {/* App header */}
        <AppHeader onOpenSettings={() => setShowSettings(true)} />

        {/* Full-height workspace with independent scrolling regions */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar — 20% — scrollable */}
          <div className="hidden md:block w-[20%] min-w-[240px] max-w-[300px] border-r border-[rgba(148,163,184,.14)] overflow-y-auto bg-[#070d18]">
            <LeftSidebar />
          </div>

          {/* Center workspace — 55% — scrollable */}
          <div className="flex-1 overflow-y-auto min-w-0 bg-[#070d18]">
            <CenterWorkspace />
          </div>

          {/* Right copilot — 25% — sticky, never pushed */}
          <div className="hidden lg:block w-[25%] min-w-[300px] max-w-[380px] border-l border-[rgba(148,163,184,.14)] overflow-y-auto bg-[#070d18]">
            <RightCopilot />
          </div>
        </div>

        {/* Mobile section navigation — the LeftSidebar is hidden below md */}
        <MobileSectionNav />

        {/* Claims Review — non-blocking identity workflow surface */}
        <ClaimsReview />

        {/* Settings Modal */}
        <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
      </div>
    </DndProvider>
  );
}
