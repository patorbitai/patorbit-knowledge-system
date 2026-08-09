"use strict";

/**
 * M3 (Patorbit Phase 1) — Deterministic qualification matching between a
 * Career Profile (M1) and a Job Profile (M2).
 *
 * This module is a PURE, deterministic rule engine. It never invents
 * candidate facts: every result is derived by explicit rule from the verbatim
 * JD item (Job Profile) and the candidate's own Career Profile items.
 *
 * Classification semantics (see also the type docstring):
 *  - `PROVEN`            — the JD item is directly and literally satisfied by a
 *                          discrete candidate skill item.
 *  - `RELATED`           — candidate evidence is adjacent: a candidate skill
 *                          tree-preceeds the JD term (e.g. "React" vs
 *                          "React Native"), but isn't an exact fit.
 *  - `COMMUNICATION_GAP` — the JD wording turns up in the candidate's *free
 *                          text* (experience/project/cert prose) yet is NOT
 *                          listed as a discrete skill. Capability exists but is
 *                          under-represented on the profile.
 *  - `MISSING`           — no candidate evidence exists for the JD item.
 *
 * Provenance invariants:
 *  - Every JD item records its source (JobSource) verbatim.
 *  - Every candidate match points at the specific Career item (`itemId`,
 *    `kind`, verbatim `text`, and its ProfileSource).
 *  - `MISSING` results always carry an empty `evidence` list.
 *  - The matcher is a pure function: same inputs ⇒ deep-equal result.
 */

import type { CareerProfile } from "@/types/career-profile";
import type { JobProfile } from "@/types/job-profile";
import type {
  QualificationMatch,
  QualificationMatchItem,
  QualificationMatchSummary,
  QualificationSourceGroup,
  QualificationClassification,
  QualificationEvidenceRef,
  QualificationEvidenceKind,
} from "@/types/qualification-match";
import type { ProfileSource } from "@/types/career-profile";
import type { JobSource } from "@/types/job-profile";

/* ── Options ─────────────────────────────────────────────────────────────── */

export interface BuildQualificationMatchOptions {
  /** ISO timestamp used as `createdAt` / `updatedAt`. */
  capturedAt?: string;
  /** Optional stable match id. Defaults to a deterministic id. */
  id?: string;
  /** Match version. Defaults to 1. */
  version?: number;
}

/* ── Deterministic id helper ─────────────────────────────────────────────── */

function hashString(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(h, 31) + input.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

function defaultMatchId(careerProfileId: string, jobProfileId: string): string {
  return `qm-${hashString(`${careerProfileId}|${jobProfileId}`)}`;
}

/* ── Text normalization ──────────────────────────────────────────────────── */

function normalize(text: string): string {
  return (text ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9+#./&@-]/g, " ")
    .trim();
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

const STOPWORDS = new Set([
  "the", "and", "for", "with", "you", "your", "will", "that", "this",
  "have", "has", "had", "are", "were", "been", "into", "from", "when",
  "our", "their", "them", "they", "we", "all", "any", "who", "whom",
]);

function meaningfulTokens(text: string): string[] {
  return tokenize(text).filter(
    (token) => token.length >= 3 && !STOPWORDS.has(token),
  );
}

/* ── Candidate evidence snapshot ─────────────────────────────────────────── */

interface SkillRef {
  itemId: string;
  text: string;
  source: ProfileSource;
}

interface TextRef {
  itemId: string;
  kind: QualificationEvidenceKind;
  text: string;
  source: ProfileSource;
}

/** Immutable snapshot of the candidate-side evidence the matcher reasons over. */
interface CandidateSnapshot {
  skills: SkillRef[];
  corpus: TextRef[];
}

function snapshot(careerProfile: CareerProfile): CandidateSnapshot {
  const skills: SkillRef[] = careerProfile.skills.map((skill) => ({
    itemId: skill.id,
    text: skill.name,
    source: skill.source,
  }));

  const corpus: TextRef[] = [];

  const pushText = (
    itemId: string,
    kind: QualificationEvidenceKind,
    text: string | undefined,
    source: ProfileSource,
  ) => {
    if (text && text.trim().length > 0) {
      corpus.push({ itemId, kind, text: text.trim(), source });
    }
  };

  for (const exp of careerProfile.experiences) {
    pushText(exp.id, "experience", exp.position, exp.source);
    pushText(exp.id, "experience", exp.company, exp.source);
    if (exp.summary) pushText(exp.id, "experience", exp.summary, exp.source);
    for (const achievement of exp.achievements) {
      pushText(exp.id, "experience", achievement, exp.source);
    }
  }
  for (const proj of careerProfile.projects) {
    pushText(proj.id, "project", proj.name, proj.source);
    if (proj.role) pushText(proj.id, "project", proj.role, proj.source);
    if (proj.description) pushText(proj.id, "project", proj.description, proj.source);
  }
  for (const edu of careerProfile.educations) {
    pushText(edu.id, "education", edu.school, edu.source);
    pushText(edu.id, "education", edu.degree, edu.source);
    if (edu.field) pushText(edu.id, "education", edu.field, edu.source);
  }
  for (const cert of careerProfile.certifications) {
    pushText(cert.id, "certification", cert.name, cert.source);
    if (cert.issuer) pushText(cert.id, "certification", cert.issuer, cert.source);
  }
  for (const lang of careerProfile.languages) {
    pushText(lang.id, "language", lang.name, lang.source);
  }

  return { skills, corpus };
}

/* ── Matching primitives ─────────────────────────────────────────────────── */

/** Exact phrase equality, after joined normalization. */
function phraseEqual(a: string, b: string): boolean {
  return normalize(a) === normalize(b);
}

/**
 * `skillPhraseIn`: true when the candidate skill's meaningful tokens appear
 * verbatim, in order, inside the JD wording. Handles prose requirements that
 * simply name the skill (e.g. "Strong proficiency with TypeScript and React"
 * contains "TypeScript" and "React").
 */
function skillPhraseIn(skillTokens: string[], jobTokens: string[]): boolean {
  if (skillTokens.length === 0 || jobTokens.length < skillTokens.length) {
    return false;
  }
  for (let i = 0; i <= jobTokens.length - skillTokens.length; i++) {
    let allMatch = true;
    for (let j = 0; j < skillTokens.length; j++) {
      if (jobTokens[i + j] !== skillTokens[j]) {
        allMatch = false;
        break;
      }
    }
    if (allMatch) return true;
  }
  return false;
}

/**
 * Fuzzy relevance: two terms are "related" when, after tokenizing, they share
 * at least one meaningful word or one is a prefix-phrase of the other.
 * Example: "React" vs "React Native" → related. "TypeScript" vs "TypeScript"
 * → equal (handled as proven, not related).
 */
function tokensOverlap(jobText: string, candidateText: string): boolean {
  const jobTokens = meaningfulTokens(jobText);
  const candidateTokens = meaningfulTokens(candidateText);
  for (const jt of jobTokens) {
    for (const ct of candidateTokens) {
      if (jt === ct) return true;
      if (jt.startsWith(ct) || ct.startsWith(jt)) return true;
    }
  }
  return false;
}

/** True when the exact, token-normalized job phrase appears in the corpus. */
function appearsInCorpus(corpus: TextRef[], jobText: string): TextRef[] {
  const jobTokens = meaningfulTokens(jobText);
  const hits: TextRef[] = [];
  for (const ref of corpus) {
    const candidateTokens = meaningfulTokens(ref.text);
    const matched = jobTokens.some((jt) =>
      candidateTokens.some((ct) => jt === ct),
    );
    if (matched) hits.push(ref);
  }
  return hits;
}

/* ── Classification of a single JD item ──────────────────────────────────── */

interface ItemResult {
  classification: QualificationClassification;
  reason: string;
  evidence: QualificationEvidenceRef[];
}

function classifyJobItem(
  jobText: string,
  candidate: CandidateSnapshot,
): ItemResult {
  const trimmed = jobText.trim();
  if (trimmed.length === 0) {
    return {
      classification: "MISSING",
      reason: "the job item has no text to evaluate",
      evidence: [],
    };
  }

  // 1) PROVEN: a discrete candidate skill appears literally in the JD wording
  //    (either the exact phrase, or the phrase contains the candidate's skill).
  const jobTokens = meaningfulTokens(trimmed);
  const proven = candidate.skills.filter((skill) => {
    if (phraseEqual(trimmed, skill.text)) return true;
    const skillTokens = meaningfulTokens(skill.text);
    return skillPhraseIn(skillTokens, jobTokens);
  });
  if (proven.length > 0) {
    return {
      classification: "PROVEN",
      reason: `candidate lists the discrete skill "${proven[0].text}" which the job wording names directly`,
      evidence: proven.map((skill) => ({
        itemId: skill.itemId,
        itemKind: "skill",
        text: skill.text,
        source: skill.source,
      })),
    };
  }

  // 2. RELATED: a candidate skill is adjacent but not exact.
  const related = candidate.skills.filter(
    (skill) => !phraseEqual(skill.text, trimmed) &&
      tokensOverlap(skill.text, trimmed) &&
      !skillPhraseIn(meaningfulTokens(skill.text), jobTokens),
  );
  if (related.length > 0) {
    return {
      classification: "RELATED",
      reason: `candidate skill "${related[0].text}" is related to, but not exactly equal to, the job wording`,
      evidence: related.slice(0, 4).map((skill) => ({
        itemId: skill.itemId,
        itemKind: "skill",
        text: skill.text,
        source: skill.source,
      })),
    };
  }

  // 3) COMMUNICATION_GAP: wording found in candidate free-text, but no discrete
  //    skill names it.
  const corpusHits = appearsInCorpus(candidate.corpus, trimmed);
  if (corpusHits.length > 0) {
    return {
      classification: "COMMUNICATION_GAP",
      reason: "the job wording appears in the candidate's evidence text but is not listed as a discrete skill",
      evidence: corpusHits.slice(0, 3).map((hit) => ({
        itemId: hit.itemId,
        itemKind: hit.kind,
        text: hit.text,
        source: hit.source,
      })),
    };
  }

  return {
    classification: "MISSING",
    reason: "no candidate evidence matches the job wording",
    evidence: [],
  };
}

/* ── Public builder ──────────────────────────────────────────────────────── */

export function buildQualificationMatch(
  careerProfile: CareerProfile,
  jobProfile: JobProfile,
  options: BuildQualificationMatchOptions = {},
): QualificationMatch {
  const capturedAt = options.capturedAt ?? new Date().toISOString();
  const candidate = snapshot(careerProfile);

  const items: QualificationMatchItem[] = [];

  const classify = (
    sourceGroup: QualificationSourceGroup,
    jobText: string,
    jobSource: JobSource,
  ) => {
    const result = classifyJobItem(jobText, candidate);
    items.push({
      id: `${sourceGroup}-${items.length + 1}`,
      sourceGroup,
      classification: result.classification,
      requirement: jobText,
      jobSource,
      reason: result.reason,
      evidence: result.evidence,
    });
  };

  for (const req of jobProfile.requirements) {
    classify("requirement", req.text, req.source);
  }
  for (const skill of jobProfile.skills) {
    classify("skill", skill.name, skill.source);
  }
  for (const qual of jobProfile.qualifications) {
    classify("qualification", qual.text, qual.source);
  }

  const summary: QualificationMatchSummary = {
    total: items.length,
    proven: items.filter((i) => i.classification === "PROVEN").length,
    related: items.filter((i) => i.classification === "RELATED").length,
    communicationGap: items.filter((i) => i.classification === "COMMUNICATION_GAP").length,
    missing: items.filter((i) => i.classification === "MISSING").length,
  };

  return {
    id: options.id ?? defaultMatchId(careerProfile.id, jobProfile.id),
    version: options.version ?? 1,
    createdAt: capturedAt,
    updatedAt: capturedAt,
    careerProfileId: careerProfile.id,
    jobProfileId: jobProfile.id,
    items,
    summary,
  };
}