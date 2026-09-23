"use strict";

/**
 * Resume safety (§5 of the editing/review spec).
 *
 * Re-runs the EXISTING provenance check (tailor-review's
 * detectUnsupportedAdditions) against a baseline and adds the two
 * resolution paths a user needs after editing a job-specific resume:
 *
 *   Remove from this version  → strip the unsupported item from the resume
 *   Add to master             → explicitly promote it into the master
 *                                profile (the ONLY way a tailored edit can
 *                                ever touch the master — never silent)
 *
 * Baseline model (documented decision):
 *   - Tailored resume → its master (lineage). Findings = content the master
 *     cannot substantiate (AI leftovers or pasted content).
 *   - Master resume   → no findings by definition: the master IS the source
 *     of truth and its content is user-provided (§8 provenance class).
 *
 * All functions are pure: inputs are deep-cloned before mutation, nothing
 * here ever writes to the store itself.
 */

import type { Resume, Skill } from "@/types/resume";
import { detectUnsupportedAdditions, resumeTechTokens, techCovered } from "@/lib/tailor-review";

export type SafetyFindingKind =
  | "skill"
  | "employer"
  | "certification"
  | "education"
  | "technology";

/**
 * §2 — explicit lineage of a job-specific resume back to the master it was
 * derived from. Stored on the RESUME-BUILDER store (per tailored resume).
 */
export interface ResumeLineage {
  /** resumeId of the master professional profile. */
  sourceResumeId: string;
  sourceResumeName?: string;
  jobTitle?: string;
  tailoredAt: number;
}

/**
 * Resolve the safety baseline for `resume`: the master content it must stay
 * consistent with.
 *
 * - Exact lineage (set at tailor-approval time) wins.
 * - Legacy tailored resumes pre-dating lineage fall back to the SAME name
 *   heuristic the workflow-state layer uses ("<master> — Tailored").
 *   The match must be unambiguous or no baseline is claimed — we never
 *   guess a master for a false positive.
 * - Master resumes (and unmatched names) return null: their own content is
 *   the truth, so nothing can be "unsupported" against itself.
 */
export function resolveSafetyBaseline(
  resumes: Resume[],
  resume: Resume | null | undefined,
  lineageEntry: ResumeLineage | null | undefined
): Resume | null {
  if (!resume) return null;
  if (lineageEntry) {
    return resumes.find((r) => r.resumeId === lineageEntry.sourceResumeId) ?? null;
  }
  const name = resume.resumeName || resume.name || "";
  const m = /^(.*) (?:—|-|–) Tailored$/.exec(name);
  if (!m) return null;
  const sourceName = m[1];
  const matches = resumes.filter(
    (r) =>
      r.resumeId !== resume.resumeId &&
      (r.resumeName || r.name) === sourceName
  );
  return matches.length === 1 ? matches[0] : null;
}

export interface SafetyFinding {
  kind: SafetyFindingKind;
  /** The offending name/token: "Kubernetes", "Invented Corp", "BS, MIT". */
  value: string;
  /** Exact label produced by detectUnsupportedAdditions (stable identity). */
  label: string;
}

const FINDING_PREFIXES: Array<[string, SafetyFindingKind]> = [
  ["Skill: ", "skill"],
  ["Employer: ", "employer"],
  ["Certification: ", "certification"],
  ["Education: ", "education"],
  ["Technology not in your profile: ", "technology"],
];

const norm = (s: string): string => (s ?? "").trim().toLowerCase();

export function parseFindingLabel(label: string): SafetyFinding | null {
  for (const [prefix, kind] of FINDING_PREFIXES) {
    if (label.startsWith(prefix)) {
      const value = label.slice(prefix.length).trim();
      if (value) return { kind, value, label };
    }
  }
  return null;
}

/**
 * Re-run the provenance check of the existing tailor pipeline.
 * `baseline === null` (master resume, or a deleted master) → no findings:
 * there is nothing to contradict, and master content is user-provided truth.
 */
export function getSafetyFindings(
  baseline: Resume | null | undefined,
  candidate: Resume | null | undefined,
): SafetyFinding[] {
  if (!baseline || !candidate) return [];
  if (baseline.resumeId && candidate.resumeId && baseline.resumeId === candidate.resumeId) {
    return []; // comparing a resume to itself can never produce findings
  }
  return detectUnsupportedAdditions(baseline, candidate)
    .map(parseFindingLabel)
    .filter((f): f is SafetyFinding => f !== null);
}

/** Word-boundary, case-insensitive removal of a tech token from free text. */
function stripToken(text: string, token: string): string {
  if (!text) return text;
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text
    .replace(new RegExp(`\\b${escaped}\\b`, "gi"), " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}

function educationLabel(e: { degree?: string; school?: string }): string {
  return [e.degree, e.school].filter(Boolean).join(", ");
}

/**
 * Remove the unsupported finding from `resume`, returning a NEW resume.
 *
 * Employer findings are resolved conservatively: if the baseline has an
 * entry at the same index, that entry's employer is reverted to the
 * baseline's (keeps the job, drops the fabricated company — matching §13's
 * "employer identity can never change"); otherwise the extra entry is
 * removed outright.
 */
export function removeFinding(
  resume: Resume,
  finding: SafetyFinding,
  baseline?: Resume | null,
): Resume {
  const next = structuredClone(resume);
  switch (finding.kind) {
    case "skill":
      next.skills = (next.skills ?? []).filter((s) => norm(s.name) !== norm(finding.value));
      break;
    case "certification":
      next.certifications = (next.certifications ?? []).filter(
        (c) => norm(c.name) !== norm(finding.value),
      );
      break;
    case "education":
      next.education = (next.education ?? []).filter(
        (e) => educationLabel(e) !== finding.value,
      );
      break;
    case "employer": {
      // detectUnsupportedAdditions labels an extra entry whose company AND
      // position are empty as "entry #N" (N = 1-based index at detect time).
      const entryNum = /^entry #(\d+)$/.exec(finding.value);
      if (entryNum) {
        const idx = Number(entryNum[1]) - 1;
        const exp = [...(next.experience ?? [])];
        if (idx >= 0 && idx < exp.length) {
          exp.splice(idx, 1);
          next.experience = exp;
        }
        break;
      }
      const baseEntry =
        baseline?.experience?.find(
          (e) => norm(e.company) === norm(finding.value) || norm(e.position) === norm(finding.value),
        ) ?? null;
      const idx = (next.experience ?? []).findIndex(
        (e) => norm(e.company) === norm(finding.value) || norm(e.position) === norm(finding.value),
      );
      if (idx >= 0) {
        if (baseEntry) {
          next.experience[idx] = { ...next.experience[idx], company: baseEntry.company };
        } else {
          next.experience.splice(idx, 1);
        }
      }
      break;
    }
    case "technology": {
      const t = finding.value;
      next.summary = stripToken(next.summary ?? "", t);
      next.skills = (next.skills ?? []).filter((s) => norm(s.name) !== norm(t));
      next.experience = (next.experience ?? []).map((e) => ({
        ...e,
        description: stripToken(e.description ?? "", t),
        bulletPoints: (e.bulletPoints ?? []).map((b) => stripToken(b, t)),
      }));
      break;
    }
  }
  return next;
}

function makeSkill(name: string): Skill {
  return {
    id: `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    level: "Intermediate",
    category: "",
    years: "",
  };
}

/**
 * The explicit promote action: copy the finding's backing data from
 * `source` (the tailored resume) into `master`, so the baseline can now
 * substantiate it and the finding clears on the next re-run.
 * Returns a NEW master; `master` is never mutated.
 */
export function promoteFindingToMaster(
  master: Resume,
  source: Resume,
  finding: SafetyFinding,
): Resume {
  const next = structuredClone(master);
  switch (finding.kind) {
    case "skill": {
      const existing = (next.skills ?? []).some((s) => norm(s.name) === norm(finding.value));
      if (!existing) {
        const fromSource = (source.skills ?? []).find((s) => norm(s.name) === norm(finding.value));
        next.skills = [...(next.skills ?? []), fromSource ? structuredClone(fromSource) : makeSkill(finding.value)];
      }
      break;
    }
    case "technology": {
      // Cover the token the same way detectUnsupportedAdditions judges it:
      // a skill named after the token puts it into the master's tech tokens.
      if (!techCovered(resumeTechTokens(next), finding.value)) {
        const fromSource = (source.skills ?? []).find((s) => norm(s.name) === norm(finding.value));
        next.skills = [...(next.skills ?? []), fromSource ? structuredClone(fromSource) : makeSkill(finding.value)];
      }
      break;
    }
    case "certification": {
      const fromSource = (source.certifications ?? []).find(
        (c) => norm(c.name) === norm(finding.value),
      );
      const exists = (next.certifications ?? []).some((c) => norm(c.name) === norm(finding.value));
      if (fromSource && !exists) {
        next.certifications = [...(next.certifications ?? []), structuredClone(fromSource)];
      }
      break;
    }
    case "education": {
      const fromSource = (source.education ?? []).find(
        (e) => educationLabel(e) === finding.value,
      );
      const exists = (next.education ?? []).some((e) => educationLabel(e) === finding.value);
      if (fromSource && !exists) {
        next.education = [...(next.education ?? []), structuredClone(fromSource)];
      }
      break;
    }
    case "employer": {
      // "entry #N" (empty company+position) → adopt the whole entry from the
      // tailored version by its detect-time index.
      const entryNum = /^entry #(\d+)$/.exec(finding.value);
      if (entryNum) {
        const fromSource = (source.experience ?? [])[Number(entryNum[1]) - 1];
        if (fromSource) {
          next.experience = [...(next.experience ?? []), structuredClone(fromSource)];
        }
        break;
      }
      const fromSource = (source.experience ?? []).find(
        (e) => norm(e.company) === norm(finding.value) || norm(e.position) === norm(finding.value),
      );
      const exists = (next.experience ?? []).some(
        (e) => norm(e.company) === norm(finding.value) || norm(e.position) === norm(finding.value),
      );
      if (fromSource && !exists) {
        next.experience = [...(next.experience ?? []), structuredClone(fromSource)];
      }
      break;
    }
  }
  return next;
}

/**
 * Content fields copied by the whole-resume "Promote edits to master"
 * action. Presentation (template/fonts), identity (claims) and keys
 * (resumeId/resumeName) are deliberately EXCLUDED — promoting edits never
 * rebrands or re-keys the master profile.
 */
export const PROMOTE_CONTENT_FIELDS = [
  "name",
  "title",
  "email",
  "phone",
  "address",
  "nationality",
  "pronouns",
  "summary",
  "social",
  "experience",
  "education",
  "skills",
  "projects",
  "certifications",
  "languages",
  "interests",
  "achievements",
  "references",
  "portfolio",
  "careerStage",
] as const satisfies readonly (keyof Resume)[];

/** Whole-resume promote: master adopts the tailored version's CONTENT. */
export function promoteResumeContent(master: Resume, source: Resume): Resume {
  const next = structuredClone(master) as Resume;
  for (const field of PROMOTE_CONTENT_FIELDS) {
    (next as unknown as Record<string, unknown>)[field] = structuredClone(
      (source as unknown as Record<string, unknown>)[field],
    );
  }
  return next;
}
