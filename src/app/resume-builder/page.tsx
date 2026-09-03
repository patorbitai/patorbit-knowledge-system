"use client";

import { useEffect, useCallback, useState, Suspense } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useResumeBuilder } from "@/store/resume-builder";
import { ai } from "@/lib/ai/client";
import { LeftSidebar, CenterWorkspace, ClaimsReview } from "@/components/resume-builder";
import MobileSectionNav from "@/components/resume-builder/MobileSectionNav";
import { SaveStatusIndicator } from "@/components/resume-builder/SaveStatusIndicator";
import { ImportButton } from "@/components/resume-builder/ImportButton";
import { ResumeServerSyncMonitor } from "@/components/resume-builder/ResumeServerSyncMonitor";
import { ResumeMigrationUI } from "@/components/resume-builder/ResumeMigrationUI";
import AccountMenu from "@/components/hub/AccountMenu";
import { Eye, ArrowLeft, ChevronRight, Sparkles, PenLine, Target } from "lucide-react";
import { PreviewErrorBoundary } from "@/components/resume-builder/PreviewErrorBoundary";
import { MobilePreview } from "@/components/resume-builder/MobilePreview";
import { TailorResumeModal } from "@/components/resume-builder/TailorResumeModal";
import { debounce } from "@/lib/debounce";

/* ── Dynamic imports for heavy panels (SSR=false to avoid layout-effect crashes) ── */
const LiveStylePreview = dynamic(
  () => import("@/components/resume-builder/LiveStylePreview").then((m) => m.LiveStylePreview),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full text-xs text-gray-400 dark:text-slate-500">Loading preview…</div> },
);
const RightCopilot = dynamic(
  () => import("@/components/resume-builder/RightCopilot").then((m) => m.RightCopilot),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full text-xs text-gray-400 dark:text-slate-500">Loading AI Copilot…</div> },
);

/* ── Resume Selector Dropdown ── */
function ResumeSelector() {
  const resumes = useResumeBuilder((s) => s.resumes);
  const activeResumeId = useResumeBuilder((s) => s.activeResumeId);
  const switchResume = useResumeBuilder((s) => s.switchResume);
  const createResume = useResumeBuilder((s) => s.createResume);
  const renameResume = useResumeBuilder((s) => s.renameResume);
  const deleteResume = useResumeBuilder((s) => s.deleteResume);
  const [isOpen, setIsOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createName, setCreateName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const activeResume = resumes.find((r) => r.resumeId === activeResumeId) || resumes[0];

  const cancelRename = () => { setRenamingId(null); setRenameValue(""); };
  const commitRename = () => {
    if (renamingId) { const trimmed = renameValue.trim(); if (trimmed) renameResume(renamingId, trimmed); }
    cancelRename();
  };
  const commitCreate = () => { createResume(createName.trim() || undefined); setCreating(false); setCreateName(""); setIsOpen(false); };

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} aria-label="Select resume" aria-expanded={isOpen} aria-haspopup="listbox"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 dark:bg-white/[0.04] border border-gray-300 dark:border-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-all text-xs font-medium text-gray-900 dark:text-white cursor-pointer">
        <span className="max-w-[120px] truncate">{activeResume?.resumeName || "My Resume"}</span>
        <ChevronRight className={`w-3 h-3 transition-transform ${isOpen ? "rotate-90" : ""}`} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setIsOpen(false)} />
          <div role="listbox" aria-label="My Resumes"             className="absolute left-0 mt-1.5 w-64 rounded-xl bg-white dark:bg-[#0C1222] border border-gray-200 dark:border-white/[0.08] shadow-2xl py-1 z-50">
            <div className="px-3 py-1.5 border-b border-gray-200 dark:border-white/[0.06] text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              My Resumes ({resumes.length})
            </div>
            <div className="max-h-48 overflow-y-auto py-1">
              {resumes.map((r) => {
                const isActive = r.resumeId === activeResumeId;
                const isRenaming = renamingId === r.resumeId;
                const templateName = r.templateId ? r.templateId.replace(/-/g, " ") : "modern clean";
                const itemCount = (r.experience?.length || 0) + (r.skills?.length || 0) + (r.education?.length || 0);
                return (
                  <div key={r.resumeId} role="option" aria-selected={isActive}
                    className={`flex items-center justify-between px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-white/[0.06] group cursor-pointer ${isActive ? "text-cyan-600 dark:text-cyan-400 font-semibold bg-gray-100 dark:bg-white/[0.04]" : "text-gray-600 dark:text-slate-300"}`}
                    onClick={() => { if (r.resumeId) switchResume(r.resumeId); setIsOpen(false); }}>
                    <div className="flex-col truncate flex-1 pr-2">
                      {isRenaming ? (
                        <input autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") commitRename(); if (e.key === "Escape") cancelRename(); }}
                          onBlur={commitRename} onClick={(e) => e.stopPropagation()} aria-label="Resume name"
                          className="w-full px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/[0.08] border border-cyan-500/40 text-xs text-gray-900 dark:text-white outline-none" />
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="truncate font-medium">{r.resumeName || "Untitled Resume"}</span>
                          {isActive && <span className="text-[10px] px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-normal">Active</span>}
                        </div>
                      )}
                      <span className="text-[10px] text-gray-500 dark:text-slate-500 capitalize">{templateName} • {itemCount} items</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button title="Rename" onClick={(e) => { e.stopPropagation(); setRenamingId(r.resumeId || null); setRenameValue(r.resumeName || ""); }}
                        className="p-1 hover:text-gray-900 dark:hover:text-white text-gray-400 dark:text-slate-400 rounded cursor-pointer">✏️</button>
                      {resumes.length > 1 && (
                        <button title="Delete" onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${r.resumeName}"?`) && r.resumeId) deleteResume(r.resumeId); }}
                          className="p-1 hover:text-red-400 text-gray-400 dark:text-slate-400 rounded cursor-pointer">🗑️</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-1.5 border-t border-gray-200 dark:border-white/[0.06]">
              {creating ? (
                <input autoFocus value={createName} onChange={(e) => setCreateName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") commitCreate(); if (e.key === "Escape") { setCreating(false); setCreateName(""); } }}
                  onBlur={commitCreate} placeholder={`Resume ${resumes.length + 1}`} aria-label="New resume name"
                  className="w-full px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/[0.08] border border-cyan-500/40 text-xs text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-slate-500" />
              ) : (
                <button onClick={() => { setCreating(true); setCreateName(""); }} aria-label="Create new resume"
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-cyan-400 bg-cyan-500/[0.1] hover:bg-cyan-500/[0.2] transition-all cursor-pointer">
                  + New Resume
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Right Panel: Preview or AI Copilot ── */
function RightPanel({ mode, onModeChange }: { mode: "preview" | "copilot"; onModeChange: (m: "preview" | "copilot") => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center border-b border-gray-200 dark:border-white/[0.08] shrink-0 bg-white dark:bg-[#0C1222]">
        <button onClick={() => onModeChange("preview")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer border-b-2 ${mode === "preview" ? "text-cyan-600 dark:text-cyan-300 border-cyan-500" : "text-gray-500 dark:text-slate-400 border-transparent hover:text-gray-700 dark:hover:text-white"}`}>
          <Eye className="w-3.5 h-3.5" /> Preview
        </button>
        <button onClick={() => onModeChange("copilot")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer border-b-2 ${mode === "copilot" ? "text-cyan-600 dark:text-cyan-300 border-cyan-500" : "text-gray-500 dark:text-slate-400 border-transparent hover:text-gray-700 dark:hover:text-white"}`}>
          <Sparkles className="w-3.5 h-3.5" /> AI Copilot
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        {mode === "preview" ? (
          <PreviewErrorBoundary>
            <Suspense fallback={<div className="flex items-center justify-center h-full text-xs text-gray-400">Loading…</div>}>
              <LiveStylePreview fitMode="contain" maxFit={1} />
            </Suspense>
          </PreviewErrorBoundary>
        ) : (
          <Suspense fallback={<div className="flex items-center justify-center h-full text-xs text-gray-400">Loading…</div>}>
            <RightCopilot />
          </Suspense>
        )}
      </div>
    </div>
  );
}

/* ── Mobile Mode Toggle ── */
function MobileModeToggle({ mode, onModeChange }: { mode: "edit" | "preview"; onModeChange: (m: "edit" | "preview") => void }) {
  return (
    <div className="relative z-[60] flex md:hidden items-center border-t border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#0C1222] shrink-0">
      <button onClick={() => onModeChange("edit")}
        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer ${mode === "edit" ? "text-cyan-600 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-500/[0.08]" : "text-gray-500 dark:text-slate-400"}`}>
        <PenLine className="w-3.5 h-3.5" /> Edit
      </button>
      <div className="h-4 w-px bg-gray-200 dark:bg-white/[0.08]" />
      <button onClick={() => onModeChange("preview")}
        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer ${mode === "preview" ? "text-cyan-600 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-500/[0.08]" : "text-gray-500 dark:text-slate-400"}`}>
        <Eye className="w-3.5 h-3.5" /> Preview
      </button>
    </div>
  );
}

/* ── App Header ── */
function AppHeader({ onOpenTailor }: { onOpenTailor: () => void }) {
  return (
    <header className="sticky top-0 z-40 h-12 bg-white/90 dark:bg-[#070d18]/90 backdrop-blur-xl border-b border-gray-200 dark:border-white/[0.08]">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-2.5">
          <Link href="/overview" className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all group">
            <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
            <span>Dashboard</span>
          </Link>
          <div className="h-3 w-px bg-gray-300 dark:bg-white/[0.08]" />
          <ResumeSelector />
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onOpenTailor}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 transition-all"
          >
            <Target className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tailor to Job</span>
            <span className="sm:hidden">Tailor</span>
          </button>
          <ImportButton variant="card" label="Import Resume" />
          <SaveStatusIndicator />
          <div className="hidden sm:block h-3 w-px bg-gray-300 dark:bg-white/[0.08]" />
          <Link href="/resume-builder/preview"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 bg-cyan-50 dark:bg-cyan-500/[0.08] hover:bg-cyan-100 dark:hover:bg-cyan-500/[0.16] hover:border-cyan-500/50 transition-all">
            <Eye className="w-3.5 h-3.5" />
            <span>Full Preview</span>
          </Link>
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}

/* ── Main Page ── */
export default function ResumeBuilderPage() {
  const resume = useResumeBuilder((s) => s.resume);
  const setAnalysis = useResumeBuilder((s) => s.setAnalysis);
  const setAnalysisLoading = useResumeBuilder((s) => s.setAnalysisLoading);
  const saveStatus = useResumeBuilder((s) => s.saveStatus);
  const setSaveStatus = useResumeBuilder((s) => s.setSaveStatus);
  const setSuggestedClaims = useResumeBuilder((s) => s.setSuggestedClaims);

  const [rightMode, setRightMode] = useState<"preview" | "copilot">("preview");
  const [mobileMode, setMobileMode] = useState<"edit" | "preview">("edit");
  const [tailorOpen, setTailorOpen] = useState(false);

  const debouncedAnalysis = useCallback(
    debounce(async (currentResume) => {
      setAnalysisLoading(true);
      try { const result = await ai.analyzeResume(currentResume); setAnalysis(result); }
      catch { setAnalysis(null); } finally { setAnalysisLoading(false); }
    }, 1500),
    [setAnalysis, setAnalysisLoading],
  );

  const debouncedMarkSaved = useCallback(debounce(() => { setSaveStatus("saved"); }, 1200), [setSaveStatus]);

  const debouncedClaimGen = useCallback(
    debounce(async (currentResume) => {
      if (!currentResume?.name && !currentResume?.summary && currentResume?.experience?.length === 0) return;
      try { const result = await ai.generateClaims(currentResume, currentResume.claims); if (result?.claims?.length) setSuggestedClaims(result.claims); } catch { /* silent */ }
    }, 2500),
    [setSuggestedClaims],
  );

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
      <div className="h-screen w-full bg-gray-50 dark:bg-[#070d18] text-gray-900 dark:text-white font-sans antialiased flex flex-col overflow-hidden selection:bg-cyan-500/30">
        <AppHeader onOpenTailor={() => setTailorOpen(true)} />

        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar — section navigation (hidden on mobile) */}
          <div className="hidden md:block w-[20%] min-w-[240px] max-w-[300px] border-r border-gray-200 dark:border-white/[0.08] overflow-y-auto bg-white dark:bg-[#070d18]">
            <LeftSidebar />
          </div>

          {/* Center — editing forms */}
          <div className={`flex-1 overflow-y-auto min-w-0 ${mobileMode === "preview" ? "hidden md:block" : ""}`}>
            <CenterWorkspace />
          </div>

          {/* Right panel — Preview or AI Copilot (desktop only) */}
          <div className="hidden md:flex md:flex-col w-[35%] min-w-[320px] max-w-[520px] border-l border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#070d18]">
            <RightPanel mode={rightMode} onModeChange={setRightMode} />
          </div>
        </div>

        {/* Mobile section nav (edit mode only) */}
        {mobileMode === "edit" && <MobileSectionNav />}

        {/* Mobile Edit/Preview toggle */}
        <MobileModeToggle mode={mobileMode} onModeChange={setMobileMode} />

        {/* Mobile Preview overlay — only mounts when Preview is active */}
        {mobileMode === "preview" && (
          <div className="md:hidden fixed inset-0 z-30 bg-gray-50 dark:bg-[#070d18] pt-12 pb-12 overflow-y-auto">
            <PreviewErrorBoundary>
              <MobilePreview />
            </PreviewErrorBoundary>
          </div>
        )}

        <ClaimsReview />
        <ResumeServerSyncMonitor />
        <ResumeMigrationUI />
        <TailorResumeModal open={tailorOpen} onClose={() => setTailorOpen(false)} />
      </div>
    </DndProvider>
  );
}
