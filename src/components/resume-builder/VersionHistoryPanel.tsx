"use client";

/**
 * §4 version history — slide-over listing every recorded version for the
 * ACTIVE resume (original / tailored / edit / export), newest first, with
 * a confirmed restore that preserves resume identity and always captures
 * a "Before restore" undo point first.
 */
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Download,
  FileText,
  History,
  PenLine,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { useResumeBuilder } from "@/store/resume-builder";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import type { ResumeVersion, ResumeVersionKind } from "@/lib/resume-versions";

const KIND_META: Record<
  ResumeVersionKind,
  { Icon: typeof FileText; label: string }
> = {
  original: { Icon: FileText, label: "Original" },
  tailored: { Icon: Sparkles, label: "Tailored" },
  edit: { Icon: PenLine, label: "Edit" },
  export: { Icon: Download, label: "Export" },
};

const EMPTY: ResumeVersion[] = [];

function metaLine(v: ResumeVersion): string | null {
  if (!v.meta) return null;
  if (v.kind === "export" && typeof v.meta.format === "string") {
    return String(v.meta.format).toUpperCase();
  }
  if (v.kind === "tailored") {
    const parts: string[] = [];
    if (v.meta.accepted) parts.push(`${v.meta.accepted} accepted`);
    if (v.meta.edited) parts.push(`${v.meta.edited} edited`);
    if (v.meta.rejected) parts.push(`${v.meta.rejected} rejected`);
    if (v.meta.blocked) parts.push(`${v.meta.blocked} blocked`);
    return parts.length ? parts.join(" · ") : null;
  }
  return null;
}

export function VersionHistoryPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const activeResumeId = useResumeBuilder((s) => s.activeResumeId);
  const resumeLabel = useResumeBuilder(
    (s) => s.resume.resumeName || s.resume.name,
  );
  const versions =
    useResumeBuilder((s) => s.versions[s.activeResumeId]) ?? EMPTY;
  const restoreVersion = useResumeBuilder((s) => s.restoreVersion);
  const [target, setTarget] = useState<ResumeVersion | null>(null);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-label="Version history"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[380px] z-50 bg-white dark:bg-[#0A0E1B] border-l border-gray-200 dark:border-white/[0.06] shadow-2xl flex flex-col"
            data-testid="version-history-panel"
          >
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-200 dark:border-white/[0.06]">
              <div className="flex items-center gap-2 min-w-0">
                <History
                  className="w-4 h-4 text-gray-400 dark:text-slate-400 shrink-0"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Version history
                  </h2>
                  <p className="text-[11px] text-gray-500 dark:text-slate-500 truncate">
                    {resumeLabel || "Untitled Resume"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close version history"
                className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              {versions.length === 0 ? (
                <div className="text-center py-8">
                  <History
                    className="w-6 h-6 mx-auto text-gray-300 dark:text-slate-600 mb-2"
                    aria-hidden="true"
                  />
                  <p className="text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                    No versions recorded yet
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-slate-500 leading-relaxed">
                    Versions appear when you import, tailor, edit or export
                    this resume. Each one can be restored.
                  </p>
                </div>
              ) : (
                <ol className="space-y-1.5">
                  {versions.map((v) => {
                    const meta = KIND_META[v.kind];
                    const info = metaLine(v);
                    return (
                      <li
                        key={v.id}
                        className="flex items-start gap-2.5 rounded-lg border border-gray-200 dark:border-white/[0.06] px-3 py-2"
                      >
                        <meta.Icon
                          className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400 dark:text-slate-500"
                          aria-hidden="true"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 dark:text-slate-200 truncate">
                            {v.label}
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-slate-500">
                            {meta.label} · {new Date(v.at).toLocaleString()}
                            {info ? ` · ${info}` : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTarget(v)}
                          className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-gray-600 dark:text-slate-300 border border-gray-300 dark:border-white/[0.1] hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" aria-hidden="true" />
                          Restore
                        </button>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>

            <p className="px-4 py-3 border-t border-gray-200 dark:border-white/[0.06] text-[10px] text-gray-500 dark:text-slate-500 leading-relaxed">
              Restoring keeps this resume&apos;s name and history, and captures
              a &quot;Before restore&quot; version first so you can undo it.
            </p>
          </motion.aside>

          <ConfirmationDialog
            open={!!target}
            title="Restore this version?"
            message={`The current content will be replaced by "${target?.label ?? ""}". A "Before restore" version is captured first, so you can always come back.`}
            confirmLabel="Restore version"
            variant="warning"
            onConfirm={() => {
              if (target) restoreVersion(activeResumeId, target.id);
              setTarget(null);
            }}
            onCancel={() => setTarget(null)}
          />
        </>
      )}
    </AnimatePresence>
  );
}
