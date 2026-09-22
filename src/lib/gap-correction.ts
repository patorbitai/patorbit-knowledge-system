"use strict";

/**
 * Requirement correction (Phase 1.5).
 *
 * When the matcher reports "no evidence" for a requirement, the user may
 * legitimately tell Patorbit they *do* have it. This module turns that
 * correction into:
 *
 *   1. a user-provided addition to the MASTER resume (skills / domain skill /
 *      certification / education / experience bullet), and
 *   2. a Claim with `verificationStatus: "suggested"` — i.e. awaiting evidence
 *      and review.
 *
 * Hard rules:
 *   - A correction can NEVER produce `verified` status. Only the platform's
 *     verification mechanism can (VerificationEvent pipeline).
 *   - The claim is never auto-`accepted`: user-provided ≠ reviewed fact.
 *   - Everything is written on a clone — the caller decides which section of
 *     the master to persist (§7 master-profile protection).
 */

import type { Claim, ClaimType, Resume } from "@/types/resume";

export type CorrectionKind =
  | "skill"
  | "domain-skill"
  | "certification"
  | "education"
  | "experience-bullet";

export interface CorrectionInput {
  kind: CorrectionKind;
  /** The requirement text as stated by the job — prefilled, user-editable. */
  text: string;
  /** Required for `experience-bullet`: index into resume.experience. */
  experienceIndex?: number;
}

export interface CorrectionResult {
  /** Full resume copy with the addition applied (caller persists sections). */
  resume: Resume;
  /** The user-provided claim — always `suggested`, never verified. */
  claim: Claim;
  /** Human label of the destination section (used in confirmation copy). */
  sectionLabel: string;
}

export const CORRECTION_KIND_LABELS: Record<CorrectionKind, string> = {
  skill: "Skill",
  "domain-skill": "Domain expertise",
  certification: "Certification",
  education: "Education",
  "experience-bullet": "Experience detail",
};

const CLAIM_TYPE: Record<CorrectionKind, ClaimType> = {
  skill: "Skill",
  "domain-skill": "Skill",
  certification: "Certification",
  education: "Education",
  "experience-bullet": "Employment",
};

const SECTION_LABEL: Record<CorrectionKind, string> = {
  skill: "Skills",
  "domain-skill": "Skills",
  certification: "Certifications",
  education: "Education",
  "experience-bullet": "Experience",
};

function assertionFor(kind: CorrectionKind, text: string): string {
  switch (kind) {
    case "skill":
    case "domain-skill":
      return `I have experience with ${text}`;
    case "certification":
      return `I hold ${text}`;
    case "education":
      return `I completed ${text}`;
    case "experience-bullet":
      return text;
  }
}

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Apply a correction to a COPY of the resume.
 * Returns null for empty text or an invalid experience index — callers must
 * validate before showing the button as enabled.
 */
export function applyRequirementCorrection(
  original: Resume,
  input: CorrectionInput,
): CorrectionResult | null {
  const text = input.text.trim();
  if (!text) return null;

  const resume: Resume = structuredClone(original);

  switch (input.kind) {
    case "skill":
    case "domain-skill": {
      const skills = resume.skills ?? [];
      if (skills.some((s) => s.name.trim().toLowerCase() === text.toLowerCase())) {
        return null; // already present — nothing to correct
      }
      resume.skills = [
        ...skills,
        {
          id: uid("s"),
          name: text,
          level: "Intermediate",
          category: input.kind === "domain-skill" ? "Domain" : "",
          years: "",
        },
      ];
      break;
    }
    case "certification": {
      resume.certifications = [
        ...(resume.certifications ?? []),
        {
          id: uid("cert"),
          name: text,
          issuer: "",
          date: "",
          link: "",
          description: "Added by you while reviewing a job-match gap.",
          expiryDate: "",
          skills: "",
        },
      ];
      break;
    }
    case "education": {
      resume.education = [
        ...(resume.education ?? []),
        {
          id: uid("edu"),
          school: text,
          degree: "",
          year: "",
          field: "",
          gpa: "",
          minor: "",
          honors: "",
          activities: "",
          location: "",
        },
      ];
      break;
    }
    case "experience-bullet": {
      const idx = input.experienceIndex;
      if (idx === undefined || idx < 0 || idx >= (resume.experience ?? []).length) {
        return null;
      }
      const entry = resume.experience[idx];
      if ((entry.bulletPoints ?? []).some((b) => b.trim().toLowerCase() === text.toLowerCase())) {
        return null; // duplicate bullet
      }
      entry.bulletPoints = [...(entry.bulletPoints ?? []), text];
      break;
    }
  }

  const claim: Claim = {
    id: uid("cl"),
    assertionText: assertionFor(input.kind, text),
    claimType: CLAIM_TYPE[input.kind],
    sourceActivityId: "job-gap-review",
    confidence: 0.7,
    reasoning:
      "You provided this while reviewing a job-match gap. It is user-provided and awaits evidence/review — it is not verified.",
    // NEVER "verified" here: verification requires the real verification
    // pipeline. User-provided corrections enter as suggestions (§P1.5/§P4).
    verificationStatus: "suggested",
    reviewed: false,
    accepted: false,
    createdAt: new Date().toISOString(),
  };

  return { resume, claim, sectionLabel: SECTION_LABEL[input.kind] };
}

/**
 * Which section of the master resume a correction writes to — lets the panel
 * persist only the touched field instead of the whole resume.
 */
export function correctionField(
  kind: CorrectionKind,
): "skills" | "certifications" | "education" | "experience" {
  if (kind === "skill" || kind === "domain-skill") return "skills";
  if (kind === "certification") return "certifications";
  if (kind === "education") return "education";
  return "experience";
}
