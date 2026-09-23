"use client";

/**
 * §5 safety surface — shared by the editor context bar and the export
 * gate.
 *
 * `useResumeSafety` re-derives the provenance findings after EVERY edit
 * (memo keyed on the live resume + baseline), so the user always sees
 * what their master profile cannot substantiate — with both resolution
 * paths: remove from this version, or explicitly add to master.
 */
import { useMemo } from "react";
import { AlertTriangle, Minus, Plus } from "lucide-react";
import { useResumeBuilder } from "@/store/resume-builder";
import {
  getSafetyFindings,
  resolveSafetyBaseline,
  type SafetyFinding,
} from "@/lib/resume-safety";

export function useResumeSafety() {
  const resume = useResumeBuilder((s) => s.resume);
  const lineageEntry = useResumeBuilder((s) => s.lineage[s.activeResumeId]);
  const resumes = useResumeBuilder((s) => s.resumes);
  const removeUnsupportedFinding = useResumeBuilder((s) => s.removeUnsupportedFinding);
  const promoteFindingToMaster = useResumeBuilder((s) => s.promoteFindingToMaster);

  const baseline = useMemo(
    () => resolveSafetyBaseline(resumes, resume, lineageEntry ?? null),
    [resumes, resume, lineageEntry],
  );

  // The provenance re-check of the tailor pipeline, re-run on every edit.
  const findings = useMemo(
    () => getSafetyFindings(baseline, resume),
    [baseline, resume],
  );

  const canPromote =
    !!lineageEntry?.sourceResumeId &&
    resumes.some((r) => r.resumeId === lineageEntry.sourceResumeId);

  return {
    findings,
    baseline,
    canPromote,
    remove: removeUnsupportedFinding,
    promote: promoteFindingToMaster,
  };
}

export function SafetyFindingsList({
  findings,
  canPromote,
  onRemove,
  onPromote,
}: {
  findings: SafetyFinding[];
  canPromote: boolean;
  onRemove: (f: SafetyFinding) => void;
  onPromote: (f: SafetyFinding) => void;
}) {
  if (findings.length === 0) return null;
  return (
    <ul className="space-y-1.5" data-testid="safety-findings">
      {findings.map((f) => (
        <li
          key={f.label}
          className="flex flex-wrap items-center gap-2 text-xs"
        >
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-medium">
            <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden="true" />
            {f.value}
          </span>
          <button
            type="button"
            onClick={() => onRemove(f)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-gray-600 dark:text-slate-300 border border-gray-300 dark:border-white/[0.1] hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            <Minus className="w-3 h-3" aria-hidden="true" />
            Remove from this version
          </button>
          {canPromote && (
            <button
              type="button"
              onClick={() => onPromote(f)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/10 transition-colors"
            >
              <Plus className="w-3 h-3" aria-hidden="true" />
              Add to master
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
