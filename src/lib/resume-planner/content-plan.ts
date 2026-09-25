"use strict";

/**
 * Resume Content Plan (§3) — decides WHAT a resume should present for a
 * particular job before anything is rendered.
 *
 * Inputs: the Resume (source of truth) + the deterministic QualificationMatch
 * (M3) when a job is in play. Outputs: an ordered content plan with
 * emphasis, budgets and honest reasons.
 *
 * Invariants (tested):
 *  - Never mutates or invents resume data — selection and order only.
 *  - Nothing classified MISSING can be promoted (emphasis tokens come
 *    exclusively from non-MISSING items with evidence).
 *  - Highlighted skills/projects/certs are always subsets of the profile.
 */

import type { QualificationMatch } from "@/types/qualification-match";
import type { Resume } from "@/types/resume";
import { ROLE_STRATEGIES, detectRoleStrategy } from "./role-strategies";
import type {
  PlannedSection,
  ResumeContentPlan,
  SectionType,
  SkillGroup,
} from "./types";

export interface ContentPlanContext {
  /** Deterministic M3 result, when a job has been analyzed. */
  qualificationMatch?: QualificationMatch | null;
  /** Target job title / company for "preview for this job" (§22). */
  jobTitle?: string;
  jobCompany?: string;
  /**
   * Force job-aware emphasis off (preview without job context).
   * Default: job-aware whenever a match with items exists.
   */
  jobAware?: boolean;
  /** Explicit strategy override; otherwise detected from titles. */
  roleHint?: string;
}

/* ── Text utilities (deterministic, shared) ───────────────────────────── */

const STOPWORDS = new Set([
  "and", "the", "for", "with", "you", "our", "are", "will", "has", "have",
  "this", "that", "your", "from", "work", "team", "who", "all", "can",
  "job", "role", "years", "year", "strong", "good", "great", "within",
  "using", "use", "must", "plus", "etc", "least", "least", "own", "new",
]);

/** Lowercase, strip punctuation → whitespace, collapse spaces. */
export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9+#.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Significant lowercase tokens (len ≥ 3, not a stopword). */
export function significantWords(s: string): string[] {
  return normalizeText(s)
    .split(" ")
    .map((w) => w.replace(/^\.+|\.+$/g, ""))
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

function wordsIn(needle: string, haystack: Set<string>): number {
  return significantWords(needle).filter((w) => haystack.has(w)).length;
}

/* ── Emphasis token set (§4) ──────────────────────────────────────────── */

/**
 * Tokens that may drive emphasis. Built ONLY from match items whose
 * classification is not MISSING — i.e. the profile already holds evidence.
 */
function buildEmphasisTokens(match: QualificationMatch): Set<string> {
  const tokens = new Set<string>();
  for (const item of match.items) {
    if (item.classification === "MISSING") continue;
    for (const w of significantWords(item.requirement)) tokens.add(w);
    for (const ev of item.evidence) {
      for (const w of significantWords(ev.text)) tokens.add(w);
    }
  }
  return tokens;
}

/**
 * Normalized space-padded corpus of the same non-MISSING material. Used for
 * whole-token matching so 2-letter skills ("Go") and exact phrases still
 * highlight even though significantWords() requires length ≥ 3.
 */
function buildEmphasisCorpus(match: QualificationMatch): string {
  const parts: string[] = [];
  for (const item of match.items) {
    if (item.classification === "MISSING") continue;
    parts.push(normalizeText(item.requirement));
    for (const ev of item.evidence) parts.push(normalizeText(ev.text));
  }
  return ` ${parts.join(" ")} `;
}

function skillIsEmphasized(
  name: string,
  tokens: Set<string>,
  corpus: string,
): boolean {
  if (wordsIn(name, tokens) > 0) return true;
  const norm = normalizeText(name);
  if (!norm) return false;
  return corpus.includes(` ${norm} `);
}

/* ── Profile text helpers ─────────────────────────────────────────────── */

function experienceBlob(exp: Resume["experience"][number]): string {
  return normalizeText(
    [
      exp.company,
      exp.position,
      exp.description,
      exp.achievements,
      exp.techUsed,
      exp.location,
      ...(exp.bulletPoints ?? []),
    ].join(" "),
  );
}

function entryBlobWords(text: string): Set<string> {
  return new Set(significantWords(text));
}

/* ── Section budgets (§9–§15) ─────────────────────────────────────────── */

const BUDGETS = {
  /** §11 — avoid excessive bullet counts; relevance-preferring cap. */
  bulletsPage1: 4,
  bulletsPage2: 6,
  projectsPage1: 3,
  projectsPage2: 5,
  certs: 5,
  achievements: 4,
  /** §13 — keyword-wall guard. Highlighted skills are kept first. */
  maxSkills: 30,
} as const;

/* ── Main builder ─────────────────────────────────────────────────────── */

export function buildContentPlan(
  resume: Resume,
  ctx: ContentPlanContext = {},
): ResumeContentPlan {
  const match =
    ctx.qualificationMatch && ctx.qualificationMatch.items.length > 0
      ? ctx.qualificationMatch
      : null;
  const jobAware = ctx.jobAware !== false && match !== null;

  const targetRole = ctx.jobTitle?.trim() || undefined;
  const targetCompany = ctx.jobCompany?.trim() || undefined;

  const strategyId = ctx.roleHint
    ? (ctx.roleHint as ResumeContentPlan["roleStrategy"])
    : detectRoleStrategy(targetRole, resume.title);
  const strategy = ROLE_STRATEGIES[strategyId] ?? ROLE_STRATEGIES.general;

  /* ── Emphasis (job-aware, evidence-backed only) ── */
  const emphasisTokens = jobAware && match ? buildEmphasisTokens(match) : new Set<string>();
  const corpus = jobAware && match ? buildEmphasisCorpus(match) : "";

  const highlightedSkills = jobAware
    ? resume.skills
        .filter((s) => skillIsEmphasized(s.name, emphasisTokens, corpus))
        .map((s) => s.name)
    : [];

  const highlightedExperienceIds: string[] = [];
  if (jobAware) {
    // Direct evidence refs first (experience-kind), then token density.
    const evidenceNeedles = (match?.items ?? [])
      .filter((i) => i.classification !== "MISSING")
      .flatMap((i) => i.evidence)
      .filter((e) => e.itemKind === "experience")
      .map((e) => normalizeText(e.text).slice(0, 120))
      .filter((t) => t.length >= 8);

    for (const exp of resume.experience) {
      const blob = experienceBlob(exp);
      const blobWords = entryBlobWords(blob);
      const byEvidence = evidenceNeedles.some(
        (n) => blob.includes(n) || wordsIn(n, blobWords) >= 2,
      );
      const overlap = [...emphasisTokens].filter((w) => blobWords.has(w)).length;
      if (byEvidence || overlap >= 3) {
        highlightedExperienceIds.push(exp.id);
      }
    }
  }

  const relevantProjectIds = jobAware
    ? orderIdsByRelevance(
        resume.projects.map((p) => ({
          id: p.id,
          text: normalizeText([p.name, p.tech, p.description].join(" ")),
        })),
        emphasisTokens,
      )
    : resume.projects.map((p) => p.id);

  const relevantCertificationIds = jobAware
    ? orderIdsByRelevance(
        resume.certifications.map((c) => ({
          id: c.id,
          text: normalizeText([c.name, c.issuer, c.skills].join(" ")),
        })),
        emphasisTokens,
      )
    : resume.certifications.map((c) => c.id);

  /* ── Page target & density (§9–§10) ── */
  const roleCount = resume.experience.length;

  const bulletCount = resume.experience.reduce(
    (n, e) => n + (e.bulletPoints?.length ?? 0),
    0,
  );

  // Content-aware two-page target: beyond the role-count rule, a profile
  // whose bullets exceed the one-page budget (4 per role on average)
  // HONESTLY targets two pages instead of planning a trim. Overflow flows to
  // page 2 — we never hide bullets to preserve a one-page layout (§9/§11).
  const overBulletBudget =
    bulletCount > BUDGETS.bulletsPage1 * Math.max(roleCount, 1);
  const pageTarget: 1 | 2 = roleCount >= 4 || overBulletBudget ? 2 : 1;
  const heavyContent =
    bulletCount > 18 ||
    resume.skills.length > BUDGETS.maxSkills ||
    resume.projects.length > BUDGETS.projectsPage2;
  const density: ResumeContentPlan["density"] = heavyContent
    ? "compact"
    : resume.name && roleCount <= 1 && bulletCount <= 4
      ? "spacious"
      : "balanced";

  /* ── Skill grouping (§13) ── */
  const skillGroups = buildSkillGroups(resume, highlightedSkills);

  /* ── Section assembly ── */
  const hasContent = hasSectionContent(resume);
  const excludedSections: SectionType[] = [];
  const compressedSections: SectionType[] = [];

  // Interests are dropped by the executive strategy outright, and on any
  // job-specific resume (space goes to job-relevant evidence — §4/§9).
  if (strategy.drop.includes("interests") || jobAware) {
    excludedSections.push("interests");
  }

  const experienced = roleCount >= 4;
  for (const type of strategy.compressWhenExperienced) {
    if (experienced && !excludedSections.includes(type)) {
      compressedSections.push(type);
    }
  }

  const bulletCap = pageTarget === 1 ? BUDGETS.bulletsPage1 : BUDGETS.bulletsPage2;
  const projectsCap =
    pageTarget === 1 ? BUDGETS.projectsPage1 : BUDGETS.projectsPage2;

  // Early career: education earns prominence (§15).
  let order = [...strategy.order];
  if (roleCount <= 1 && hasContent.education && order[0] === "summary") {
    order = order.filter((t) => t !== "education");
    order.splice(Math.min(1, order.length), 0, "education");
  } else if (roleCount <= 1 && hasContent.education) {
    order = order.filter((t) => t !== "education");
    order.unshift("education");
  }

  const n = order.length;
  const sections: PlannedSection[] = [];
  for (const type of order) {
    if (excludedSections.includes(type)) continue;
    if (!hasContent[type]) continue;

    const rank = order.indexOf(type);
    const priority = n - rank;
    const emphasis: PlannedSection["emphasis"] =
      type === "summary" && jobAware
        ? "highlight"
        : compressedSections.includes(type)
          ? "compact"
          : "normal";

    const planned: PlannedSection = {
      type,
      priority,
      emphasis,
      reason: reasonFor(type, {
        jobAware,
        strategyId,
        compressed: compressedSections.includes(type),
        highlightedCount:
          type === "skills"
            ? highlightedSkills.length
            : type === "experience"
              ? highlightedExperienceIds.length
              : 0,
      }),
    };

    if (type === "experience") {
      // §11's bullet cap is an EXPLICIT planning decision, applied only to a
      // job-targeted plan (§22): the user chose a job to tailor for, so the
      // planner selects the strongest bullets for that target and the quality
      // check reports the trim. The default plan never trims — preview, DOCX
      // and print render every bullet and the paginator flows the overflow
      // onto page 2 (readability-first, no silent truncation).
      if (jobAware) planned.maxBulletsPerItem = bulletCap;
    } else if (type === "projects") {
      planned.maxItems = projectsCap;
    } else if (type === "certs") {
      planned.maxItems = BUDGETS.certs;
    } else if (type === "achievements") {
      planned.maxItems = BUDGETS.achievements;
    }

    sections.push(planned);
  }

  return {
    version: 1,
    roleStrategy: strategyId,
    targetRole,
    targetCompany,
    jobAware,
    sections,
    highlightedSkills,
    highlightedExperienceIds,
    relevantProjectIds,
    relevantCertificationIds,
    excludedSections,
    compressedSections,
    skillGroups,
    maxSkills: BUDGETS.maxSkills,
    emphasisTokens: [...emphasisTokens],
    pageTarget,
    density,
  };
}

/* ── Helpers ──────────────────────────────────────────────────────────── */

function orderIdsByRelevance(
  items: Array<{ id: string; text: string }>,
  tokens: Set<string>,
): string[] {
  const scored = items.map((it, idx) => {
    const words = new Set(significantWords(it.text));
    const overlap = [...tokens].filter((t) => words.has(t)).length;
    return { id: it.id, overlap, idx };
  });
  scored.sort((a, b) => b.overlap - a.overlap || a.idx - b.idx);
  return scored.map((s) => s.id);
}

function buildSkillGroups(resume: Resume, highlighted: string[]): SkillGroup[] {
  const highlightedSet = new Set(highlighted.map((h) => h.toLowerCase()));
  const groups = new Map<string, string[]>();
  const seen = new Set<string>();

  // Highlighted groups first (stable), highlighted skills first within a group.
  const sorted = [...resume.skills].sort((a, b) => {
    const ha = highlightedSet.has(a.name.toLowerCase()) ? 0 : 1;
    const hb = highlightedSet.has(b.name.toLowerCase()) ? 0 : 1;
    return ha - hb;
  });

  for (const s of sorted) {
    const key = s.name.toLowerCase();
    if (seen.has(key)) continue; // §13 — remove duplication
    seen.add(key);
    const label = s.category?.trim() || "Skills";
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(s.name);
  }

  // Groups containing highlighted skills first, otherwise keep encounter order.
  const entries = [...groups.entries()];
  entries.sort(([, aSkills], [, bSkills]) => {
    const aHot = aSkills.some((n) => highlightedSet.has(n.toLowerCase())) ? 0 : 1;
    const bHot = bSkills.some((n) => highlightedSet.has(n.toLowerCase())) ? 0 : 1;
    if (aHot !== bHot) return aHot - bHot;
    return 0; // stable
  });

  return entries.map(([label, skills]) => ({ label, skills }));
}

function hasSectionContent(resume: Resume): Record<SectionType, boolean> {
  return {
    summary: !!resume.summary?.trim(),
    experience: resume.experience.length > 0,
    skills: resume.skills.length > 0,
    projects: resume.projects.length > 0,
    education: resume.education.length > 0,
    certs: resume.certifications.length > 0,
    achievements: resume.achievements.length > 0,
    languages: resume.languages.length > 0,
    interests: resume.interests.length > 0,
  };
}

function reasonFor(
  type: SectionType,
  info: {
    jobAware: boolean;
    strategyId: string;
    compressed: boolean;
    highlightedCount: number;
  },
): string {
  const strategyLabel =
    ROLE_STRATEGIES[info.strategyId as keyof typeof ROLE_STRATEGIES]?.label ??
    "General / Corporate";

  if (type === "experience" && info.highlightedCount > 0) {
    return `${info.highlightedCount} of your roles carry evidence that matches this job.`;
  }
  if (type === "skills" && info.highlightedCount > 0) {
    return `${info.highlightedCount} of your skills are mentioned in this job's requirements.`;
  }
  if (info.compressed) {
    return "Compact — you have enough experience that this section matters less to the reader.";
  }
  if (type === "summary") {
    return info.jobAware
      ? "Opens with what you bring to this specific target role."
      : "Opens with who you are professionally.";
  }
  return info.jobAware
    ? `Placed for a ${strategyLabel} application.`
    : `Standard placement for a ${strategyLabel} resume.`;
}
