"use client";

import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Loader2, RotateCcw, Wand2, ChevronDown, ChevronUp, Square, FileText } from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import type { Resume } from "@/types/resume";
import { useOptimization } from "@/lib/ai/useOptimization";
import { ScoreCard, ScoreCardSkeleton } from "./ScoreCard";
import { BulletDiff } from "./BulletDiff";
import { ErrorBox } from "./shared";

// ── Props ─────────────────────────────────────────────────────────────────────

export interface OptimizationPanelProps {
  resume: Resume;
  isOpen: boolean;
  onClose: () => void;
  onResumeChange: (updated: Resume) => void;
  /** Optional pre-filled job description. */
  jobDescription?: string;
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-white/[0.02] transition-colors"
        aria-expanded={open}
      >
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        {open
          ? <ChevronUp className="w-3 h-3 text-slate-600" aria-hidden />
          : <ChevronDown className="w-3 h-3 text-slate-600" aria-hidden />}
      </button>
      {open && <div className="px-3.5 pb-3.5 space-y-3">{children}</div>}
    </div>
  );
}

// ── Bullet improvement section for one entry ──────────────────────────────────

function EntryBulletSection({
  entry,
  resume,
  hook,
  onResumeChange,
}: {
  entry: Resume["experience"][number];
  resume: Resume;
  hook: ReturnType<typeof useOptimization>;
  onResumeChange: (r: Resume) => void;
}) {
  const { improveBullets, isBulletsLoading, getBulletsError, bulletSuggestions, dismissBullet } = hook;

  const loading    = isBulletsLoading(entry.id);
  const error      = getBulletsError(entry.id);
  const suggestions = bulletSuggestions[entry.id] ?? [];
  const hasBullets  = entry.bulletPoints && entry.bulletPoints.length > 0;

  const handleAccept = (bulletIndex: number, improved: string) => {
    const updatedExperience = resume.experience.map((exp) => {
      if (exp.id !== entry.id) return exp;
      const newBullets = [...exp.bulletPoints];
      newBullets[bulletIndex] = improved;
      return { ...exp, bulletPoints: newBullets };
    });
    onResumeChange({ ...resume, experience: updatedExperience });
    dismissBullet(entry.id, bulletIndex);
  };

  return (
    <div className="space-y-2">
      {/* Entry header + trigger */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-slate-300 truncate">
            {entry.position || entry.company || "Untitled role"}
          </p>
          {entry.company && entry.position && (
            <p className="text-[10px] text-slate-600 truncate">{entry.company}</p>
          )}
        </div>
        <button
          onClick={() => improveBullets(resume, entry.id)}
          disabled={loading || !hasBullets}
          aria-label={`Improve bullets for ${entry.position || entry.company}`}
          className={clsx(
            "shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg",
            "text-[10px] font-semibold transition-all",
            hasBullets
              ? "bg-violet-600/70 hover:bg-violet-600 text-white border border-violet-500/30 active:scale-[0.97]"
              : "bg-white/[0.03] text-slate-600 border border-white/[0.05] cursor-not-allowed",
          )}
        >
          {loading
            ? <Loader2 className="w-3 h-3 animate-spin" aria-hidden />
            : <Wand2 className="w-3 h-3" aria-hidden />}
          {loading ? "Generating…" : "Improve"}
        </button>
      </div>

      {!hasBullets && !loading && (
        <p className="text-[10px] text-slate-600 italic">
          Add bullet points to this role to unlock improvements.
        </p>
      )}

      {/* Error */}
      {error && !loading && (
        <ErrorBox
          message={error}
          onRetry={() => improveBullets(resume, entry.id)}
          retryLabel="Retry"
          size="sm"
        />
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 py-3 justify-center">
          <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
          <p className="text-[10px] text-slate-500">Generating improvements…</p>
        </div>
      )}

      {/* Empty state after generation */}
      {!loading && !error && suggestions.length === 0 && bulletSuggestions[entry.id] !== undefined && (
        <p className="text-[10px] text-slate-500 italic text-center py-2">
          No improvements suggested — bullets look great!
        </p>
      )}

      {/* Suggestion cards */}
      {!loading && suggestions.length > 0 && (
        <div className="space-y-2.5">
          {suggestions.map((s) => (
            <BulletDiff
              key={`${s.entryId}-${s.bulletIndex}`}
              suggestion={s}
              onAccept={() => handleAccept(s.bulletIndex, s.improved)}
              onDismiss={() => dismissBullet(s.entryId, s.bulletIndex)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export function OptimizationPanel({
  resume,
  isOpen,
  onClose,
  onResumeChange,
  jobDescription,
}: OptimizationPanelProps) {
  const hook = useOptimization();
  const { score, scoreLoading, scoreError, analyze, resetScore } = hook;
  const {
    summaryDraft,
    summaryStreaming,
    summaryError,
    generateSummary,
    cancelSummary,
    clearSummary,
  } = hook;

  // Sync refs so timeout callbacks read live values without becoming reactive deps
  const isOpenRef = useRef(isOpen);
  const scoreLoadingRef = useRef(scoreLoading);
  isOpenRef.current = isOpen;
  scoreLoadingRef.current = scoreLoading;

  // Auto-score: 3 s debounce after resume changes, only while panel is open and no request is in flight
  useEffect(() => {
    if (!isOpen) return;
    const id = setTimeout(() => {
      if (!isOpenRef.current || scoreLoadingRef.current) return;
      analyze(resume, jobDescription);
    }, 3000);
    return () => clearTimeout(id);
  }, [resume, isOpen, analyze, jobDescription]);

  const [summaryTone, setSummaryTone] = useState<"professional" | "technical" | "creative" | "academic">("professional");
  // Accumulate streamed chunks and push to resume.summary on each chunk
  const summaryAccRef = useRef("");

  const handleGenerateSummary = useCallback(async () => {
    summaryAccRef.current = "";
    await generateSummary(
      resume,
      summaryTone,
      jobDescription,
    );
  }, [resume, summaryTone, jobDescription, generateSummary]);

  // Forward each new draft state to resume when streaming
  useEffect(() => {
    if (summaryStreaming && summaryDraft) {
      onResumeChange({ ...resume, summary: summaryDraft });
    }
  }, [summaryDraft, summaryStreaming, resume, onResumeChange]);

  const handleAcceptSummary = () => {
    if (summaryDraft) onResumeChange({ ...resume, summary: summaryDraft });
    clearSummary();
  };

  const handleAnalyze = () => analyze(resume, jobDescription);

  const totalSuggestions = Object.values(hook.bulletSuggestions).reduce(
    (sum, arr) => sum + arr.length,
    0,
  );

  const handleApplyAll = useCallback(() => {
    let updated = resume;
    for (const [entryId, entrySuggestions] of Object.entries(hook.bulletSuggestions)) {
      if (!entrySuggestions.length) continue;
      updated = {
        ...updated,
        experience: updated.experience.map((e) => {
          if (e.id !== entryId) return e;
          const bullets = [...e.bulletPoints];
          for (const s of entrySuggestions) {
            if (s.bulletIndex >= 0 && s.bulletIndex < bullets.length) {
              bullets[s.bulletIndex] = s.improved;
            }
          }
          return { ...e, bulletPoints: bullets };
        }),
      };
    }
    onResumeChange(updated);
    hook.clearAllBullets();
  }, [resume, hook, onResumeChange]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop (mobile only) */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.aside
            key="panel"
            role="complementary"
            aria-label="AI Resume Optimization"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            className={clsx(
              "fixed right-0 top-0 bottom-0 z-40 flex flex-col",
              "w-full max-w-[340px] sm:max-w-[360px]",
              "bg-[#0d1117] border-l border-white/[0.06]",
              "shadow-2xl",
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-5 pb-3 border-b border-white/[0.06] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-6 w-6 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-white">Resume Optimizer</h2>
                  <p className="text-[9px] text-slate-500">AI-powered scoring & improvements</p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close optimization panel"
                className="rounded-md p-1.5 text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

              {/* ── SCORE SECTION ── */}
              <Section title="Resume Score">
                {!score && !scoreLoading && (
                  <button
                    onClick={handleAnalyze}
                    className={clsx(
                      "w-full inline-flex items-center justify-center gap-2",
                      "px-4 py-2.5 rounded-xl",
                      "bg-violet-600/80 hover:bg-violet-600 active:scale-[0.98]",
                      "text-white text-xs font-semibold",
                      "transition-all border border-violet-500/30",
                    )}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Analyze Resume
                  </button>
                )}

                {scoreLoading && <ScoreCardSkeleton />}

                {scoreError && !scoreLoading && (
                  <ErrorBox message={scoreError} onRetry={handleAnalyze} retryLabel="Try again" />
                )}

                {score && !scoreLoading && (
                  <div className="space-y-4">
                    <ScoreCard score={score} />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAnalyze}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] text-[10px] font-semibold text-slate-400 hover:text-slate-200 transition-all"
                      >
                        <Sparkles className="w-3 h-3" />
                        Re-analyze
                      </button>
                      <button
                        onClick={resetScore}
                        aria-label="Clear score"
                        className="px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] text-slate-500 hover:text-slate-200 transition-all"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </Section>

              {/* ── BULLET IMPROVEMENT SECTION ── */}
              {resume.experience.length > 0 && (
                <Section title="Improve Bullets" defaultOpen={true}>
                  <p className="text-[10px] text-slate-600 -mt-1 mb-1">
                    Select a role and click Improve to get AI-rewritten bullet points.
                  </p>
                  {totalSuggestions > 0 && (
                    <button
                      onClick={handleApplyAll}
                      aria-label={`Apply all ${totalSuggestions} bullet improvements`}
                      className={clsx(
                        "w-full inline-flex items-center justify-center gap-1.5",
                        "px-3 py-2 rounded-lg text-[10px] font-semibold",
                        "bg-emerald-600/70 hover:bg-emerald-600 text-white",
                        "border border-emerald-500/30 transition-all active:scale-[0.97]",
                      )}
                    >
                      <Wand2 className="w-3 h-3" aria-hidden />
                      Apply All ({totalSuggestions})
                    </button>
                  )}
                  <div className="space-y-4 divide-y divide-white/[0.04]">
                    {resume.experience.map((entry, i) => (
                      <div key={entry.id} className={clsx(i > 0 && "pt-4")}>
                        <EntryBulletSection
                          entry={entry}
                          resume={resume}
                          hook={hook}
                          onResumeChange={onResumeChange}
                        />
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {resume.experience.length === 0 && (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-4 text-center">
                  <p className="text-[11px] text-slate-500">
                    Add experience entries to unlock bullet improvement.
                  </p>
                </div>
              )}

              {/* ── SUMMARY GENERATION SECTION ── */}
              <Section title="Generate Summary" defaultOpen={true}>
                {/* Tone selector */}
                <div className="flex gap-1.5 flex-wrap">
                  {(["professional", "technical", "creative", "academic"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setSummaryTone(t)}
                      disabled={summaryStreaming}
                      className={clsx(
                        "px-2 py-1 rounded-md text-[10px] font-semibold capitalize transition-all",
                        summaryTone === t
                          ? "bg-violet-600/80 text-white border border-violet-500/30"
                          : "bg-white/[0.04] text-slate-500 border border-white/[0.06] hover:text-slate-300 hover:bg-white/[0.07]",
                        summaryStreaming && "cursor-not-allowed opacity-50",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* Generate / Cancel button */}
                {!summaryStreaming ? (
                  <button
                    onClick={handleGenerateSummary}
                    className={clsx(
                      "w-full inline-flex items-center justify-center gap-2",
                      "px-4 py-2.5 rounded-xl",
                      "bg-violet-600/80 hover:bg-violet-600 active:scale-[0.98]",
                      "text-white text-xs font-semibold",
                      "transition-all border border-violet-500/30",
                    )}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Generate Summary
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin shrink-0" />
                      <p className="text-[10px] text-slate-400 truncate">Writing summary…</p>
                    </div>
                    <button
                      onClick={cancelSummary}
                      aria-label="Cancel summary generation"
                      className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 border border-white/[0.06] hover:border-rose-500/30 text-slate-500 hover:text-rose-400 transition-all"
                    >
                      <Square className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Error state */}
                {summaryError && !summaryStreaming && (
                  <ErrorBox message={summaryError} onRetry={handleGenerateSummary} retryLabel="Retry" />
                )}

                {/* Draft preview + accept/clear */}
                {summaryDraft && !summaryStreaming && !summaryError && (
                  <div className="space-y-2">
                    <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-3.5 py-3">
                      <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {summaryDraft}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAcceptSummary}
                        className={clsx(
                          "flex-1 inline-flex items-center justify-center gap-1.5",
                          "px-3 py-2 rounded-lg text-[10px] font-semibold",
                          "bg-violet-600/70 hover:bg-violet-600 text-white border border-violet-500/30",
                          "transition-all active:scale-[0.97]",
                        )}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => { clearSummary(); onResumeChange({ ...resume, summary: resume.summary }); }}
                        className="px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] text-slate-500 hover:text-slate-200 transition-all"
                        aria-label="Discard generated summary"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Live streaming preview */}
                {summaryDraft && summaryStreaming && (
                  <div className="rounded-xl border border-violet-500/15 bg-violet-500/5 px-3.5 py-3">
                    <p className="text-[11px] text-slate-400 leading-relaxed whitespace-pre-wrap">
                      {summaryDraft}
                      <span className="inline-block w-[2px] h-[12px] bg-violet-400 ml-0.5 animate-pulse" aria-hidden />
                    </p>
                  </div>
                )}
              </Section>

            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
