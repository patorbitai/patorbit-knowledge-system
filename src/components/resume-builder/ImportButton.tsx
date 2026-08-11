"use client";

import { clsx } from "clsx";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useResumeBuilder } from "@/store/resume-builder";
import { ImportReviewScreen } from "./ImportReviewScreen";
import type { ImportMeta } from "./ImportReviewScreen";
import type { Resume } from "@/types/resume";
import { normalizeImportedResume } from "@/utils/normalize-import";

interface PendingImport {
  resume: Resume;
  meta: ImportMeta;
}

type ImportButtonProps = {
  variant?: "sidebar" | "hero";
};

export function ImportButton({ variant = "sidebar" }: ImportButtonProps) {
  const router = useRouter();
  const setResume = useResumeBuilder((s) => s.setResume);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingImport | null>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/import", { method: "POST", body: formData });
      if (!res.ok) throw new Error((await res.json()).error || "Import failed");
      const data = await res.json();
      // Show review screen instead of writing directly to store
      setPending({
        resume: data.resume ?? data,
        meta: data.meta ?? { path: "regex", truncated: false, charCount: 0, rawText: "" },
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const handleConfirm = (draft: Resume) => {
    setResume(normalizeImportedResume(draft));
    setPending(null);
    router.push("/resume-builder");
  };

  return (
    <>
      <div>
        <label
          className={clsx(
            "flex cursor-pointer items-center transition-all",
            variant === "hero"
              ? "w-full flex-col gap-3 rounded-xl border border-cyan-400/25 bg-cyan-500/[0.06] px-5 py-6 text-center hover:border-cyan-400/50 hover:bg-cyan-500/[0.1]"
              : "gap-2 rounded-lg px-2.5 py-1.5 text-[10px] font-medium text-slate-500 hover:bg-white/[0.04] hover:text-slate-300"
          )}
        >
          <span
            className={clsx(
              "flex items-center justify-center rounded-lg",
              variant === "hero"
                ? "h-10 w-10 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 text-white shadow-lg shadow-cyan-500/20"
                : ""
            )}
          >
            <Upload className={variant === "hero" ? "h-5 w-5" : "h-3 w-3"} />
          </span>
          <span
            className={clsx(
              variant === "hero"
                ? "text-sm font-semibold text-white"
                : "text-[10px] font-medium"
            )}
          >
            {importing ? "Importing..." : "Import Resume"}
          </span>
          {variant === "hero" && (
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
          <p
            role="alert"
            className={clsx(
              "text-red-400 leading-snug",
              variant === "hero"
                ? "mt-2 text-center text-xs"
                : "mt-1 px-2.5 text-[10px]"
            )}
          >
            {error}
          </p>
        )}
      </div>
      <AnimatePresence>
        {pending && (
          <ImportReviewScreen
            resume={pending.resume}
            meta={pending.meta}
            onConfirm={handleConfirm}
            onCancel={() => setPending(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
