"use client";

import { clsx } from "clsx";
import { useRef, useState } from "react";
import { track } from "@/lib/analytics";
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

/* ── Import stages ── */

const STAGE_LABELS = [
  "Receiving file",
  "Reading content",
  "Organizing sections",
  "Preparing review",
  "Import complete",
] as const;

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {STAGE_LABELS.map((label, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full transition-all ${
              done ? "bg-cyan-400" : active ? "bg-cyan-400 animate-pulse" : "bg-white/20"
            }`} />
            {active && (
              <span className="text-[11px] font-medium text-cyan-300 whitespace-nowrap">
                {label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ImportButton({ variant = "sidebar", label, className }: ImportButtonProps) {
  const setResume = useResumeBuilder((s) => s.setResume);
  const [importing, setImporting] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingImport | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setCurrentStageIndex(0);
    setError(null);
    track("resume_upload_started", {
      format: (file.name.split(".").pop() || "unknown").toLowerCase(),
    });

    // Advance stages at realistic intervals (no fake percentage)
    const stageTimers: ReturnType<typeof setTimeout>[] = [
      setTimeout(() => setCurrentStageIndex(1), 600),   // Reading content
      setTimeout(() => setCurrentStageIndex(2), 1400),  // Organizing sections
    ];

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/import", { method: "POST", body: formData });
      stageTimers.forEach(clearTimeout);

      if (!res.ok) {
        let msg = "We couldn\u2019t read this file. Please try a different resume.";
        try {
          const body = await res.json();
          if (body.error) msg = body.error;
        } catch { /* use default */ }
        throw new Error(msg);
      }

      setCurrentStageIndex(3); // Preparing review
      const data = await res.json();

      setCurrentStageIndex(4); // Import complete
      await new Promise((r) => setTimeout(r, 200));

      const parsed: Resume = data.resume ?? data;
      setPending({
        resume: parsed,
        meta: data.meta ?? { path: "regex", truncated: false, charCount: 0, rawText: "" },
      });
      track("resume_upload_completed", {
        experience: parsed.experience?.length ?? 0,
        skills: parsed.skills?.length ?? 0,
        education: parsed.education?.length ?? 0,
        path: data.meta?.path ?? "regex",
      });
    } catch (err: unknown) {
      stageTimers.forEach(clearTimeout);
      setError(err instanceof Error ? err.message : "Something went wrong while importing. Please try again.");
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
    // The write-back subscription only lives in the resume-builder layout, but
    // import often happens on /overview — push explicitly so the server never
    // keeps an empty skeleton (server-authoritative AI would then run on nothing).
    void import("@/lib/resume-write-back")
      .then(({ forceSaveNow }) => forceSaveNow())
      .catch(() => {
        /* offline — the normal write-back path will retry later */
      });
  };



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
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={clsx(
                    variant === "hero"
                      ? "text-sm font-semibold text-white"
                      : "text-[10px] font-medium"
                  )}
                >
                  Reading your resume...
                </span>
                {variant === "hero" && <StepIndicator currentStep={currentStageIndex} />}
              </div>
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
                     ? "text-xs font-semibold text-cyan-300 whitespace-nowrap hidden sm:inline"
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
            ref={inputRef}
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
            <span className="flex items-center gap-2 shrink-0 ml-2">
              <button
                type="button"
                className="underline cursor-pointer hover:text-white"
                onClick={() => {
                  setError(null);
                  inputRef.current?.click();
                }}
              >
                Try another file
              </button>
              <button className="underline cursor-pointer hover:text-white" onClick={() => setError(null)}>
                Dismiss
              </button>
            </span>
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
