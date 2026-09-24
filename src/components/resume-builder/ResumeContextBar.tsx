"use client";

/**
 * §2 + §5 editor context bar — the slim strip above the section editors.
 *
 * Master resume:  "Master profile — source of truth".
 * Job version:    "Job version — derived from <master>" + Open master +
 *                 the EXPLICIT promote action (the only sanctioned way a
 *                 tailored edit reaches the master).
 * Findings:       unsupported-claim list, re-checked after every edit.
 *
 * Mobile: also carries the save-state pill (the header indicator is
 * hidden on small screens).
 */
import { useState } from "react";
import { ArrowUpRight, Crown, GitBranch, ShieldAlert, Target } from "lucide-react";
import { useResumeBuilder } from "@/store/resume-builder";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { SaveToIdentityButton } from "./SaveToIdentityButton";
import { SafetyFindingsList, useResumeSafety } from "./SafetyFindingsList";

export function ResumeContextBar() {
  const activeResumeId = useResumeBuilder((s) => s.activeResumeId);
  const resume = useResumeBuilder((s) => s.resume);
  const lineage = useResumeBuilder((s) => s.lineage[s.activeResumeId]);
  const resumes = useResumeBuilder((s) => s.resumes);
  const saveStatus = useResumeBuilder((s) => s.saveStatus);
  const switchResume = useResumeBuilder((s) => s.switchResume);
  const promoteResumeToMaster = useResumeBuilder((s) => s.promoteResumeToMaster);
  const safety = useResumeSafety();
  const [confirmPromote, setConfirmPromote] = useState(false);

  const master = lineage
    ? resumes.find((r) => r.resumeId === lineage.sourceResumeId)
    : undefined;

  const savePill = (
    <span
      className="sm:hidden ml-auto inline-flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-slate-400"
      data-testid="mobile-save-state"
    >
      <span
        className={
          "w-1.5 h-1.5 rounded-full " +
          (saveStatus === "saved"
            ? "bg-emerald-500"
            : saveStatus === "saving"
              ? "bg-cyan-500 animate-pulse"
              : "bg-amber-500")
        }
        aria-hidden="true"
      />
      {saveStatus === "saved"
        ? "Saved"
        : saveStatus === "saving"
          ? "Saving…"
          : "Unsaved changes"}
    </span>
  );

  return (
    <div className="pb-3 mb-1 border-b border-gray-200 dark:border-white/[0.06]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
        {lineage ? (
          <>
            <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 font-medium text-[10px]">
              <GitBranch className="w-3 h-3" aria-hidden="true" />
              Job version
            </span>
            <span className="text-gray-500 dark:text-slate-400">
              derived from{" "}
              <span className="font-medium text-gray-700 dark:text-slate-300">
                {lineage.sourceResumeName || "your master profile"}
              </span>
            </span>
            {master?.resumeId && (
              <button
                type="button"
                onClick={() => switchResume(master.resumeId!)}
                className="inline-flex items-center gap-0.5 text-[11px] font-medium text-gray-500 dark:text-slate-400 hover:text-cyan-700 dark:hover:text-cyan-400 transition-colors underline-offset-2 hover:underline"
              >
                Open master
                <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
              </button>
            )}
            {master && (
              <button
                type="button"
                onClick={() => setConfirmPromote(true)}
                className="inline-flex items-center gap-0.5 text-[11px] font-medium text-gray-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                Promote edits to master…
              </button>
            )}
          </>
        ) : (
          <>
            <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/[0.06] text-gray-700 dark:text-slate-300 font-medium text-[10px]">
              <Crown className="w-3 h-3" aria-hidden="true" />
              Master profile
            </span>
            <span className="text-gray-500 dark:text-slate-400">
              source of truth — job versions are tailored from this
            </span>
          </>
        )}
        {savePill}

        {/* Actions: secondary utility quiet, ONE obvious primary (§7). */}
        <span className="ml-auto flex items-center gap-1.5">
          <span className="hidden sm:inline-flex">
            <SaveToIdentityButton />
          </span>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("patorbit:open-tailor"))}
            className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md bg-cyan-600 hover:bg-cyan-700 text-white text-[11px] font-medium transition-colors cursor-pointer"
          >
            <Target className="w-3.5 h-3.5" aria-hidden="true" />
            Tailor to job
          </button>
        </span>
      </div>

      {safety.findings.length > 0 && (
        <div
          className="mt-2.5 p-2.5 rounded-lg bg-amber-500/[0.06] border border-amber-500/20"
          data-testid="context-safety-panel"
        >
          <p className="flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-300 mb-2">
            <ShieldAlert
              className="w-3.5 h-3.5 mt-px shrink-0"
              aria-hidden="true"
            />
            <span>
              These items are not in your master profile — re-checked after
              every edit. Your master never changes unless you choose it.
            </span>
          </p>
          <SafetyFindingsList
            findings={safety.findings}
            canPromote={safety.canPromote}
            onRemove={safety.remove}
            onPromote={(f) => safety.promote(f)}
          />
        </div>
      )}

      <ConfirmationDialog
        open={confirmPromote}
        title="Promote edits to master?"
        message={`The master profile will adopt the CONTENT of "${resume.resumeName || resume.name || "this version"}" (its name, history and identity stay). This is the only way edits from a job version reach your master.`}
        confirmLabel="Promote to master"
        variant="warning"
        onConfirm={() => {
          promoteResumeToMaster(activeResumeId);
          setConfirmPromote(false);
        }}
        onCancel={() => setConfirmPromote(false)}
      />
    </div>
  );
}
