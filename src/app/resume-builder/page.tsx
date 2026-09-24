"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useResumeBuilder } from "@/store/resume-builder";
import { useResumeAutosave } from "@/hooks/useResumeAutosave";
import { VersionHistoryPanel } from "@/components/resume-builder/VersionHistoryPanel";
import { LeftSidebar, CenterWorkspace, ClaimsReview } from "@/components/resume-builder";
import MobileSectionNav from "@/components/resume-builder/MobileSectionNav";
import { SaveStatusIndicator } from "@/components/resume-builder/SaveStatusIndicator";
import { ResumeServerSyncMonitor } from "@/components/resume-builder/ResumeServerSyncMonitor";
import { ResumeMigrationUI } from "@/components/resume-builder/ResumeMigrationUI";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import AccountMenu from "@/components/hub/AccountMenu";
import { WorkflowStatusBar } from "@/components/resume-builder/WorkflowStatusBar";
import { JobApplicationSelector } from "@/components/resume-builder/JobApplicationSelector";
import { Eye, ArrowLeft, ChevronRight, History, PenLine, Target, Download } from "lucide-react";
import { PreviewErrorBoundary } from "@/components/resume-builder/PreviewErrorBoundary";
import { MobilePreview } from "@/components/resume-builder/MobilePreview";
import { TailorResumeModal } from "@/components/resume-builder/TailorResumeModal";
import { ExportModal } from "@/components/resume-builder/ExportModal";

/* ── Dynamic imports for heavy panels (SSR=false to avoid layout-effect crashes) ── */
const LiveStylePreview = dynamic(
  () => import("@/components/resume-builder/LiveStylePreview").then((m) => m.LiveStylePreview),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full text-xs text-gray-400 dark:text-slate-500">Loading preview…</div> },
);
const RightCopilot = dynamic(
  () => import("@/components/resume-builder/RightCopilot").then((m) => m.RightCopilot),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full text-xs text-gray-400 dark:text-slate-500">Loading match panel…</div> },
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
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const lineage = useResumeBuilder((s) => s.lineage);
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
        className="flex items-center gap-1.5 px-1.5 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all text-[13px] font-medium text-gray-800 dark:text-slate-100 cursor-pointer">
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
                          {lineage[r.resumeId ?? ""] && (
                            <span title="Job version — tailored from your master profile" className="shrink-0 px-1 py-0.5 rounded bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 text-[9px] font-semibold uppercase tracking-wide">Job</span>
                          )}
                          {isActive && <span className="text-[10px] px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-normal">Active</span>}
                        </div>
                      )}
                      <span className="text-[10px] text-gray-500 dark:text-slate-500 capitalize">{templateName} • {itemCount} items</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button title="Rename" onClick={(e) => { e.stopPropagation(); setRenamingId(r.resumeId || null); setRenameValue(r.resumeName || ""); }}
                        className="p-1 hover:text-gray-900 dark:hover:text-white text-gray-400 dark:text-slate-400 rounded cursor-pointer">✏️</button>
                      {resumes.length > 1 && (
                        <button title="Delete" onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: r.resumeId || "", name: r.resumeName || "" }); }}
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
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer">
                  + New Resume
                </button>
              )}
            </div>
          </div>
        </>
      )}

      <ConfirmationDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.name ?? ""}"?`}
        message="This resume will be permanently deleted. This action cannot be undone."
        confirmLabel="Delete Resume"
        variant="danger"
        onConfirm={() => { if (deleteTarget?.id) deleteResume(deleteTarget.id); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

/* ── Right Panel: Preview or Match ── */
function RightPanel({ mode, onModeChange }: { mode: "preview" | "copilot"; onModeChange: (m: "preview" | "copilot") => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-white/[0.06] shrink-0 bg-white dark:bg-[#070d18] px-2">
        <button onClick={() => onModeChange("preview")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors cursor-pointer border-b-2 -mb-px ${mode === "preview" ? "text-gray-900 dark:text-white border-cyan-500" : "text-gray-400 dark:text-slate-500 border-transparent hover:text-gray-600 dark:hover:text-slate-300"}`}>
          <Eye className="w-3.5 h-3.5" /> Preview
        </button>
        <button onClick={() => onModeChange("copilot")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors cursor-pointer border-b-2 -mb-px ${mode === "copilot" ? "text-gray-900 dark:text-white border-cyan-500" : "text-gray-400 dark:text-slate-500 border-transparent hover:text-gray-600 dark:hover:text-slate-300"}`}>
          <Target className="w-3.5 h-3.5" /> Match
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
          <PreviewErrorBoundary>
            <Suspense fallback={<div className="flex items-center justify-center h-full text-xs text-gray-400">Loading…</div>}>
              <RightCopilot />
            </Suspense>
          </PreviewErrorBoundary>
        )}
      </div>
    </div>
  );
}

/* ── Mobile Mode Toggle ── */
type MobileMode = "edit" | "copilot" | "preview";

function MobileModeToggle({ mode, onModeChange }: { mode: MobileMode; onModeChange: (m: MobileMode) => void }) {
  const base = "flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors cursor-pointer";
  const active = "text-cyan-600 dark:text-cyan-400";
  const idle = "text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300";
  return (
    <div className="relative z-[60] flex md:hidden items-center border-t border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[#070d18] shrink-0">
      <button onClick={() => onModeChange("edit")} className={`${base} ${mode === "edit" ? active : idle}`}>
        <PenLine className="w-3.5 h-3.5" /> Edit
      </button>
      <div className="h-4 w-px bg-gray-200 dark:bg-white/[0.08]" />
      {/* §20: mobile users need the job-analysis/match flow, not just editing. */}
      <button onClick={() => onModeChange("copilot")} className={`${base} ${mode === "copilot" ? active : idle}`}>
        <Target className="w-3.5 h-3.5" /> Match
      </button>
      <div className="h-4 w-px bg-gray-200 dark:bg-white/[0.08]" />
      <button onClick={() => onModeChange("preview")} className={`${base} ${mode === "preview" ? active : idle}`}>
        <Eye className="w-3.5 h-3.5" /> Preview
      </button>
    </div>
  );
}

/* ── App Header ──
 * Deliberately small: where am I (back · resume · job) on the left,
 * where am I in the workflow (subtle dots) in the center, and the
 * core file actions on the right. The PRIMARY action (Tailor) lives
 * in the editor's context bar — one obvious primary at a time. */
function AppHeader({ onOpenHistory }: { onOpenHistory: () => void }) {
  return (
    <header className="sticky top-0 z-40 h-12 bg-white/90 dark:bg-[#070d18]/90 backdrop-blur-xl border-b border-gray-200 dark:border-white/[0.06]">
      <div className="flex items-center justify-between h-full px-3 sm:px-4 gap-2">
        {/* Left: back + resume identity + job context */}
        <div className="flex items-center gap-1.5 min-w-0">
          <Link href="/overview" aria-label="Back to resumes"
            className="flex items-center gap-1 px-1.5 py-1 rounded-md text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors shrink-0">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px] font-medium">Resumes</span>
          </Link>
          <ResumeSelector />
          {/* §20: below sm this selector overflowed its flex box and sat on top
              of the action buttons (positioned elements steal pointer events),
              making them unclickable on phones. */}
          <div className="hidden md:block">
            <JobApplicationSelector />
          </div>
        </div>

        {/* Center: workflow context — subtle progress, not navigation chrome */}
        <div className="hidden lg:flex items-center">
          <WorkflowStatusBar />
        </div>

        {/* Right: save state + core file actions.
            relative z-10 guarantees this group wins hit-testing even if any
            left-side element overflows at narrow widths (§20). */}
        <div className="relative z-10 flex items-center gap-0.5 sm:gap-1 shrink-0">
          <div className="hidden sm:block mr-1">
            <SaveStatusIndicator />
          </div>
          <button
            type="button"
            onClick={onOpenHistory}
            aria-label="Version history"
            title="Version history"
            className="hidden sm:flex items-center justify-center h-8 w-8 rounded-md text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <History className="w-4 h-4" />
          </button>
          <Link href="/resume-builder/preview"
            className="hidden sm:flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[11px] font-medium text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors">
            <Eye className="w-3.5 h-3.5" />
            Preview
          </Link>
          {/* §20: export must stay reachable on mobile. */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("patorbit:open-export"))}
            aria-label="Export resume"
            className="flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-md border border-gray-200 dark:border-white/[0.1] text-[11px] font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}

/* ── Main Page ── */
export default function ResumeBuilderPage() {

  const [rightMode, setRightMode] = useState<"preview" | "copilot">("preview");
  const [mobileMode, setMobileMode] = useState<MobileMode>("edit");
  const [tailorOpen, setTailorOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  // §1.3: the header/copilot opener hands the CURRENT job context to the
  // tailor modal so the user never re-pastes the same JD.
  const sessionJobDescription = useResumeBuilder((s) => s.jobDescription);
  const activeJobApplication = useResumeBuilder((s) => s.activeJobApplication);
  const activeJobApplicationId = useResumeBuilder((s) => s.activeJobApplicationId);
  const tailorPrefillJd =
    sessionJobDescription || activeJobApplication?.jobDescription || undefined;
  const [exportOpen, setExportOpen] = useState(false);

  // Listen for custom events from WorkflowStatusBar
  useEffect(() => {
    const handleOpenTailor = () => setTailorOpen(true);
    const handleOpenExport = () => setExportOpen(true);
    window.addEventListener("patorbit:open-tailor", handleOpenTailor);
    window.addEventListener("patorbit:open-export", handleOpenExport);
    return () => {
      window.removeEventListener("patorbit:open-tailor", handleOpenTailor);
      window.removeEventListener("patorbit:open-export", handleOpenExport);
    };
  }, []);

  // Autosave pipeline + §4 "Edited" version capture — extracted to a
  // hook for testability (see useResumeAutosave).
  useResumeAutosave();

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen w-full bg-gray-50 dark:bg-[#070d18] text-gray-900 dark:text-white font-sans antialiased flex flex-col overflow-hidden selection:bg-cyan-500/30">
        <AppHeader onOpenHistory={() => setHistoryOpen(true)} />

        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar — quiet section outline (xl+; tablet uses the section tab bar) */}
          <div className="hidden xl:block w-[216px] shrink-0 border-r border-gray-200 dark:border-white/[0.06] overflow-y-auto bg-white dark:bg-[#070d18]">
            <LeftSidebar />
          </div>

          {/* Center — editing forms (~57% of remaining space) */}
          <div className={`flex-1 overflow-y-auto min-w-0 ${mobileMode !== "edit" ? "hidden md:block" : ""}`}>
            <CenterWorkspace />
          </div>

          {/* Right — the resume itself, the visual hero (~40% of the
              workspace ≈ 42% of remaining width after the sidebar). */}
          <div className="hidden md:flex md:flex-col w-[37%] min-w-[300px] max-w-[640px] border-l border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[#070d18]">
            <RightPanel mode={rightMode} onModeChange={setRightMode} />
          </div>
        </div>

        {/* Mobile section nav (edit mode only) */}
        {mobileMode === "edit" && <MobileSectionNav />}

        {/* Mobile Edit/Preview toggle */}
        <MobileModeToggle mode={mobileMode} onModeChange={setMobileMode} />

        {/* Mobile Copilot overlay — job paste, match breakdown, Why? (§20) */}
        {mobileMode === "copilot" && (
          <div className="md:hidden fixed inset-0 z-30 bg-gray-50 dark:bg-[#070d18] pt-12 pb-12 overflow-y-auto">
            <PreviewErrorBoundary>
              <RightCopilot />
            </PreviewErrorBoundary>
          </div>
        )}

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
        <TailorResumeModal
          open={tailorOpen}
          onClose={() => setTailorOpen(false)}
          applicationId={activeJobApplicationId ?? undefined}
          initialJobDescription={tailorPrefillJd}
        />
        <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
        <VersionHistoryPanel open={historyOpen} onClose={() => setHistoryOpen(false)} />
      </div>
    </DndProvider>
  );
}
