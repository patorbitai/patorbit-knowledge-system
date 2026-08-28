"use client";

import { clsx } from "clsx";
import { useState } from "react";
import { createPortal } from "react-dom";
import { Upload } from "lucide-react";

import { useResumeBuilder } from "@/store/resume-builder";
import { ImportReviewScreen } from "./ImportReviewScreen";
import type { ImportMeta } from "./ImportReviewScreen";
import type { Resume } from "@/types/resume";
import { mergeImportedResume } from "@/utils/normalize-import";

interface PendingImport {
  resume: Resume;
  meta: ImportMeta;
}

type ImportButtonProps = {
  variant?: "sidebar" | "hero" | "card";
  label?: string;
  className?: string;
};

const stages = [
  { label: "Uploading resume", progress: 15 },
  { label: "Reading document", progress: 30 },
  { label: "Extracting text", progress: 55 },
  { label: "Analyzing resume structure", progress: 75 },
  { label: "Mapping resume fields", progress: 90 },
  { label: "Preparing review", progress: 95 },
  { label: "Import complete", progress: 100 },
];

function CircularProgress({ progress }: { progress: number }) {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-8 h-8 shrink-0">
      <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 36 36">
        <path
          className="text-white/10"
          strokeWidth="3.5"
          stroke="currentColor"
          fill="none"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        <path
          className="text-cyan-400 transition-all duration-300 ease-out"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeWidth="3.5"
          strokeLinecap="round"
          stroke="currentColor"
          fill="none"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">
        {progress}%
      </div>
    </div>
  );
}

export function ImportButton({ variant = "sidebar", label, className }: ImportButtonProps) {
  const setResume = useResumeBuilder((s) => s.setResume);
  const [importing, setImporting] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingImport | null>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setCurrentStageIndex(0);
    setError(null);

    const interval = setInterval(() => {
      setCurrentStageIndex((prev) => (prev < 4 ? prev + 1 : prev));
    }, 400);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/import", { method: "POST", body: formData });
      clearInterval(interval);
      if (!res.ok) throw new Error((await res.json()).error || "Import failed");

      setCurrentStageIndex(5); // Preparing review
      const data = await res.json();

      setCurrentStageIndex(6); // Import complete
      await new Promise((r) => setTimeout(r, 200));

      setPending({
        resume: data.resume ?? data,
        meta: data.meta ?? { path: "regex", truncated: false, charCount: 0, rawText: "" },
      });
    } catch (err: unknown) {
      clearInterval(interval);
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const handleConfirm = (draft: Resume) => {
    const currentResume = useResumeBuilder.getState().resume;
    const merged = mergeImportedResume(currentResume, draft);
    setResume(merged);
    setPending(null);
  };

  const currentStage = stages[currentStageIndex];

  return (
    <>
      <div>
        <label
          className={clsx(
            "flex items-center transition-all",
            importing ? "cursor-wait opacity-90" : "cursor-pointer",
            variant === "hero"
              ? "w-full flex-col gap-3 rounded-xl border border-cyan-400/25 bg-cyan-500/[0.06] px-5 py-6 text-center hover:border-cyan-400/50 hover:bg-cyan-500/[0.1]"
              : variant === "card"
              ? "inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-gradient-to-br from-[#0a1424] to-[#070d18] px-3.5 py-1.5 text-xs font-semibold text-cyan-300 shadow-sm hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all whitespace-nowrap"
              : "gap-2 rounded-lg px-2.5 py-1.5 text-[10px] font-medium text-slate-500 hover:bg-white/[0.04] hover:text-slate-300",
            className
          )}
        >
          {importing ? (
            <>
              <CircularProgress progress={currentStage.progress} />
              <span
                className={clsx(
                  variant === "hero"
                    ? "text-sm font-semibold text-white"
                    : "text-[10px] font-medium"
                )}
              >
                Importing your resume...
              </span>
            </>
          ) : (
            <>
               <span
                 className={clsx(
                   "flex items-center justify-center rounded-lg",
                   variant === "hero"
                     ? "h-10 w-10 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 text-white shadow-lg shadow-cyan-500/20"
                     : ""
                 )}
               >
                 <Upload className={variant === "hero" ? "h-5 w-5" : variant === "card" ? "h-4 w-4 text-cyan-400 shrink-0" : "h-3 w-3"} />
               </span>
               <span
                 className={clsx(
                   variant === "hero"
                     ? "text-sm font-semibold text-white"
                     : variant === "card"
                     ? "text-xs font-semibold text-cyan-300 whitespace-nowrap"
                     : "text-[10px] font-medium"
                 )}
               >
                 {label || "Import Resume"}
               </span>
            </>
          )}
          {variant === "hero" && !importing && (
            <span className="text-[11px] font-normal text-slate-400">
              Upload a PDF, DOCX, or JSON file to auto-fill your resume
            </span>
          )}
          <input
            type="file"
            accept=".json,.pdf,.docx"
            onChange={handleImport}
            className="hidden"
            disabled={importing}
          />
        </label>
        {error && (
          <div
            role="alert"
            className={clsx(
              "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs font-medium leading-snug",
              "border-red-500/30 bg-red-500/10 text-red-400",
              variant === "hero"
                ? "mt-2 text-center justify-center"
                : "mt-2"
            )}
          >
            <span>{error}</span>
            <span className="shrink-0 ml-2 underline cursor-pointer hover:text-white" onClick={() => setError(null)}>Dismiss</span>
          </div>
        )}
      </div>
      {pending && createPortal(
        <ImportReviewScreen
          resume={pending.resume}
          meta={pending.meta}
          onConfirm={handleConfirm}
          onCancel={() => setPending(null)}
        />,
        document.body,
      )}
    </>
  );
}
