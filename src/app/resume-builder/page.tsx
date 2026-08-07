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

/* ── App Header ── */
function AppHeader() {
  const resume = useResumeBuilder((s) => s.resume);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <header className="sticky top-0 z-40 h-12 bg-[#070911]/90 backdrop-blur-xl border-b border-white/[0.06]">
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

          {/* Resume name pill */}
          {resume.name && (
            <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06]">
              <span className="text-[11px] text-slate-500 max-w-[140px] truncate">{resume.name}</span>
            </div>
          )}
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
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all">
            <User className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
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

  const debouncedSave = useCallback(
    debounce((currentResume) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("patorbit-resume-v2", JSON.stringify({ state: { resume: currentResume } }));
        setSaveStatus("cloud-synced");
      }
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
      debouncedSave(resume);
      debouncedClaimGen(resume);
    }
  }, [resume, saveStatus, setSaveStatus, debouncedAnalysis, debouncedSave, debouncedClaimGen]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen w-full bg-[#070911] text-slate-300 font-sans antialiased flex flex-col overflow-hidden">
        {/* App header — no marketing links (Issue 1, 4, 7) */}
        <AppHeader />

        {/* Full-height workspace with independent scrolling regions (Issue 3, 5, 6) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar — 20% — scrollable */}
          <div className="hidden md:block w-[20%] min-w-[240px] max-w-[300px] border-r border-white/[0.06] overflow-y-auto bg-[#080C18]">
            <LeftSidebar />
          </div>

          {/* Center workspace — 55% — scrollable (Issue 6) */}
          <div className="flex-1 overflow-y-auto min-w-0">
            <CenterWorkspace />
          </div>

          {/* Right copilot — 25% — sticky, never pushed (Issue 5) */}
          <div className="hidden lg:block w-[25%] min-w-[300px] max-w-[380px] border-l border-white/[0.06] overflow-y-auto bg-[#080C18]">
            <RightCopilot />
          </div>
        </div>

        {/* Mobile section navigation — the LeftSidebar is hidden below md */}
        <MobileSectionNav />

        {/* Claims Review — non-blocking identity workflow surface */}
        <ClaimsReview />
      </div>
    </DndProvider>
  );
}
