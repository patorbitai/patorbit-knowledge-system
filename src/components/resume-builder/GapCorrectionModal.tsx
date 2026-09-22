"use client";

/**
 * §P1.5 — requirement correction for NON-skill gaps.
 *
 * Skills keep the one-click "Actually I have this" path; certifications,
 * education, responsibilities, experience details, and domain expertise go
 * through this modal so the user explicitly chooses what they're claiming.
 *
 * Hard rules (§P4/§P12):
 *   - whatever is written is user-provided, `suggested`, never verified
 *   - the copy says so, plainly
 *   - after saving, the parent opens evidence capture for the new claim
 */

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { AlertTriangle, Loader2, X } from "lucide-react";
import {
  applyRequirementCorrection,
  correctionField,
  CORRECTION_KIND_LABELS,
  type CorrectionKind,
} from "@/lib/gap-correction";
import { useResumeBuilder } from "@/store/resume-builder";
import type { Claim } from "@/types/resume";

const KINDS = Object.keys(CORRECTION_KIND_LABELS) as CorrectionKind[];

const KIND_HELP: Record<CorrectionKind, string> = {
  skill: "A concrete skill you have used (tools, languages, platforms).",
  "domain-skill":
    "Breadth in an area or industry (e.g. fintech, data engineering).",
  certification: "A certification or license you actually hold.",
  education: "A degree, diploma, or completed program.",
  "experience-bullet": "A responsibility or achievement from a past role.",
};

export function GapCorrectionModal({
  open,
  requirement,
  defaultKind,
  experienceLabels,
  onClose,
  onSaved,
}: {
  open: boolean;
  /** The job requirement text — prefilled, user-editable. */
  requirement: string;
  defaultKind: CorrectionKind;
  /** "Software Engineer — Brightloop" labels, index-aligned with experience. */
  experienceLabels: string[];
  onClose: () => void;
  /** Called with the new user-provided claim so the parent can chain evidence capture. */
  onSaved: (claim: Claim) => void;
}) {
  const [kind, setKind] = useState<CorrectionKind>(defaultKind);
  const [text, setText] = useState(requirement);
  const [experienceIndex, setExperienceIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Re-seed when the modal opens for a different requirement.
  useEffect(() => {
    if (open) {
      setKind(defaultKind);
      setText(requirement);
      setExperienceIndex(0);
      setError(null);
      setSaving(false);
    }
  }, [open, defaultKind, requirement]);

  if (!open) return null;

  const needsExperience = kind === "experience-bullet";

  const submit = () => {
    const state = useResumeBuilder.getState();
    const result = applyRequirementCorrection(state.resume, {
      kind,
      text,
      experienceIndex,
    });
    if (!result) {
      setError(
        kind === "skill"
          ? "That already appears in your profile — nothing to correct."
          : "Please describe what you'd like to add.",
      );
      return;
    }
    setSaving(true);
    const field = correctionField(kind);
    state.updateField(field, result.resume[field]);
    state.updateField("claims", [
      ...(state.resume.claims ?? []),
      result.claim,
    ]);
    onSaved(result.claim);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add this to your profile"
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0b1220] p-5 space-y-4 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Add this to your profile
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              The job asks for:{" "}
              <span className="text-slate-200">&ldquo;{requirement}&rdquo;</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* What kind of information is this? */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
            What is this?
          </label>
          <div className="grid grid-cols-1 gap-1">
            {KINDS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={clsx(
                  "text-left rounded-lg border px-3 py-2 transition-colors",
                  kind === k
                    ? "border-blue-500/50 bg-blue-500/10"
                    : "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]",
                )}
              >
                <span className="block text-[11px] font-semibold text-slate-100">
                  {CORRECTION_KIND_LABELS[k]}
                </span>
                <span className="block text-[10px] text-slate-500 leading-snug">
                  {KIND_HELP[k]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {needsExperience && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
              Which role?
            </label>
            {experienceLabels.length === 0 ? (
              <p className="text-[10px] text-amber-400/90">
                No experience entries yet — add a role to your profile first,
                or choose a different type above.
              </p>
            ) : (
              <select
                value={experienceIndex}
                onChange={(e) => setExperienceIndex(Number(e.target.value))}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs text-white px-3 py-2 outline-none focus:border-blue-500/50"
              >
                {experienceLabels.map((label, i) => (
                  <option key={i} value={i} className="bg-[#0b1220]">
                    {label}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
            How should it read?
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs text-white px-3 py-2 outline-none focus:border-blue-500/50 resize-none"
          />
        </div>

        {/* Provenance disclosure — §P4: never implied as verified. */}
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.07] px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[10px] leading-relaxed text-amber-200/90">
            This will be saved as <strong>information you provided</strong> —
            not as independently verified. You&apos;ll be prompted to attach
            supporting evidence next, and it enters your master profile.
          </p>
        </div>

        {error && (
          <p role="alert" className="text-[10px] text-rose-400">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-lg text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving || !text.trim() || (needsExperience && experienceLabels.length === 0)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold transition-colors disabled:opacity-50"
          >
            {saving && <Loader2 className="w-3 h-3 animate-spin" />}
            Add to my profile
          </button>
        </div>
      </div>
    </div>
  );
}
