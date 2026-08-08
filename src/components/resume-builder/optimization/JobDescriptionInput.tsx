"use client";

import { clsx } from "clsx";
import { useState, useId } from "react";
import { Search, X, Loader2 } from "lucide-react";
import type { Resume } from "@/types/resume";
import type { KeywordAnalysis } from "@/lib/ai/types";
import { KeywordCloud } from "./KeywordCloud";
import { ErrorBox, KeywordCloudSkeleton } from "./shared";

const MAX_CHARS = 8000;

// ── Props ─────────────────────────────────────────────────────────────────────

export interface JobDescriptionInputProps {
  resume: Resume;
  analysis: KeywordAnalysis | null;
  loading: boolean;
  error: string | null;
  onAnalyze: (resume: Resume, jobDescription: string) => Promise<void>;
  onReset: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function JobDescriptionInput({
  resume,
  analysis,
  loading,
  error,
  onAnalyze,
  onReset,
}: JobDescriptionInputProps) {
  const [text, setText] = useState("");
  const textareaId = useId();
  const charCount = text.length;
  const overLimit = charCount > MAX_CHARS;
  const canSubmit = text.trim().length > 0 && !overLimit && !loading;

  const handleAnalyze = () => {
    if (canSubmit) void onAnalyze(resume, text.trim());
  };

  const handleClear = () => {
    setText("");
    onReset();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd + Enter submits
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleAnalyze();
    }
  };

  return (
    <div className="space-y-3">
      {/* Textarea */}
      <div className="relative">
        <label htmlFor={textareaId} className="sr-only">
          Job description
        </label>
        <textarea
          id={textareaId}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          rows={6}
          placeholder="Paste the Job Description here..."
          aria-label="Job description"
          aria-describedby={`${textareaId}-count`}
          className={clsx(
            "w-full resize-none rounded-xl px-3.5 py-3 pr-8",
            "bg-white/[0.03] border text-[11px] text-slate-200 placeholder:text-slate-600",
            "leading-relaxed focus:outline-none focus:ring-1",
            "transition-colors scrollbar-thin scrollbar-thumb-white/10",
            overLimit
              ? "border-rose-500/40 focus:ring-rose-500/30"
              : "border-white/[0.08] focus:border-violet-500/40 focus:ring-violet-500/20",
            loading && "opacity-60 cursor-not-allowed",
          )}
        />
        {/* Inline clear button */}
        {text.length > 0 && !loading && (
          <button
            onClick={handleClear}
            aria-label="Clear job description"
            className={clsx(
              "absolute top-2.5 right-2.5",
              "p-1 rounded-md text-slate-600 hover:text-slate-300",
              "hover:bg-white/[0.06] transition-colors",
            )}
          >
            <X className="w-3 h-3" aria-hidden />
          </button>
        )}
      </div>

      {/* Footer row: char count + actions */}
      <div className="flex items-center justify-between gap-2">
        <p
          id={`${textareaId}-count`}
          className={clsx(
            "text-[10px] tabular-nums",
            overLimit ? "text-rose-400" : "text-slate-600",
          )}
          aria-live="polite"
        >
          {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
        </p>

        <div className="flex items-center gap-2">
          {text.length > 0 && !loading && (
            <button
              onClick={handleClear}
              className="text-[10px] text-slate-600 hover:text-slate-300 transition-colors"
            >
              Clear
            </button>
          )}
          <button
            onClick={handleAnalyze}
            disabled={!canSubmit}
            aria-label="Analyse keywords against job description"
            className={clsx(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
              "text-[10px] font-semibold transition-all",
              canSubmit
                ? "bg-violet-600/80 hover:bg-violet-600 active:scale-[0.97] text-white border border-violet-500/30"
                : "bg-white/[0.03] text-slate-600 border border-white/[0.05] cursor-not-allowed",
            )}
          >
            {loading
              ? <Loader2 className="w-3 h-3 animate-spin" aria-hidden />
              : <Search className="w-3 h-3" aria-hidden />}
            {loading ? "Analysing…" : "Analyse Keywords"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && !loading && (
        <ErrorBox
          message={error}
          onRetry={canSubmit ? handleAnalyze : undefined}
          retryLabel="Retry"
        />
      )}

      {/* Loading skeleton */}
      {loading && <KeywordCloudSkeleton />}

      {/* Results */}
      {analysis && !loading && (
        <KeywordCloud analysis={analysis} />
      )}
    </div>
  );
}
