"use strict";

/**
 * Career Profile builder (M1).
 *
 * `buildCareerProfile` is a pure, deterministic function that maps the
 * canonical Resume (plus any Claims/Evidence) into a CareerProfile.
 *
 * Rules enforced here:
 *  - Nothing is invented. Every item is either a faithful copy of source data
 *    or a rule-based extraction whose exact source text is preserved.
 *  - Every item carries provenance (`source`), pointing at the exact source
 *    item. Claims/Evidence are referenced by id — never duplicated.
 *  - Provenance does NOT equal verification. Everything is "candidate-stated";
 *    nothing is auto-verified.
 *  - Derived items (industries, leadership, outcomes) are explicitly marked
 *    `derived` with a `derivation` record containing the exact source text.
 */

import type { Resume, Claim, Evidence } from "@/types/resume";
import type {
  CareerProfile,
  CareerProfileIdentity,
  CareerExperience,
  CareerEducation,
  CareerProject,
  CareerSkill,
  CareerCertification,
  CareerLanguage,
  CareerIndustry,
  CareerLeadership,
  CareerOutcome,
  ProfileSource,
  ProfileVerification,
} from "@/types/career-profile";
import {
  extractIndustries,
  extractLeadershipFromText,
  extractOutcomesFromText,
  clean,
  profileItemId,
} from "./extract";

/* ── Options ─────────────────────────────────────────────────────────────── */

export interface BuildCareerProfileOptions {
  /** Claims supporting the resume. Matched to items via `sourceActivityId`. */
  claims?: Claim[];
  /** Evidence attached to the given claims. */
  evidence?: Evidence[];
  /** ISO timestamp used as `capturedAt` / `createdAt` / `updatedAt`. */
  capturedAt?: string;
  /** Optional stable profile id. Defaults to a deterministic id. */
  id?: string;
  /** Profile version. Defaults to 1. */
  version?: number;
}

/* ── Deterministic identity helper ───────────────────────────────────────── */

function hashString(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(h, 31) + input.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

function defaultProfileId(resume: Resume): string {
  const seed = `${resume.name}|${resume.email}`;
  return `career-profile-${hashString(seed)}`;
}

/* ── Static provenance helpers ───────────────────────────────────────────── */

function candidateStated(): ProfileVerification {
  return { state: "candidate-stated" };
}

function source(
  sourceRef: string,
  capturedAt: string,
  opts: { claimIds?: string[]; evidenceIds?: string[]; note?: string } = {},
): ProfileSource {
  return {
    sourceType: "user-input",
    sourceRef,
    capturedAt,
    note: opts.note,
    claimIds: opts.claimIds ?? [],
    evidenceIds: opts.evidenceIds ?? [],
  };
}

/* ── Claim/evidence linking ──────────────────────────────────────────────── */

interface ClaimLink {
  claimIds: string[];
  evidenceIds: string[];
}

/**
 * Match claims to a source item. `sourceActivityId` is an index-based slug
 * (e.g. "experience-0"); we also accept the item's raw id as a fallback.
 */
function linkClaims(
  section: string,
  index: number,
  itemId: string,
  claims: Claim[],
  evidence: Evidence[],
): ClaimLink {
  const slugs = new Set([`${section}-${index}`, itemId]);
  const claimIds = claims.filter((c) => slugs.has(c.sourceActivityId)).map((c) => c.id);
  const evidenceIds = evidence.filter((e) => claimIds.includes(e.claimId)).map((e) => e.id);
  return { claimIds, evidenceIds };
}

/* ── Section builders ────────────────────────────────────────────────────── */

function buildIdentity(
  resume: Resume,
  capturedAt: string,
  claims: Claim[],
  evidence: Evidence[],
): CareerProfileIdentity {
  const link = linkClaims("profile", 0, "profile", claims, evidence);
  return {
    name: resume.name,
    title: resume.title || undefined,
    summary: resume.summary || undefined,
    careerStage: resume.careerStage,
    social: {
      linkedin: resume.social.linkedin,
      github: resume.social.github,
      website: resume.social.website,
      twitter: resume.social.twitter,
      portfolio: resume.social.portfolio,
      stackoverflow: resume.social.stackoverflow,
    },
    source: source("resume:profile", capturedAt, {
      claimIds: link.claimIds,
      evidenceIds: link.evidenceIds,
    }),
    verification: candidateStated(),
  };
}

function buildExperiences(
  resume: Resume,
  capturedAt: string,
  claims: Claim[],
  evidence: Evidence[],
): CareerExperience[] {
  return resume.experience.map((exp, index) => {
    const link = linkClaims("experience", index, exp.id, claims, evidence);
    const achievements = exp.bulletPoints.length > 0
      ? exp.bulletPoints
      : (exp.achievements ? exp.achievements.split(/\r?\n/).map((s) => s.trim()).filter(Boolean) : []);
    return {
      id: profileItemId("exp", exp.id),
      company: exp.company,
      position: exp.position,
      location: clean(exp.location) || undefined,
      startDate: exp.startDate || undefined,
      endDate: exp.endDate || undefined,
      current: exp.current,
      industry: clean(exp.industry) || undefined,
      summary: clean(exp.description) || undefined,
      achievements,
      source: source(`resume:experience:${exp.id}`, capturedAt, {
        claimIds: link.claimIds,
        evidenceIds: link.evidenceIds,
      }),
      verification: candidateStated(),
      derived: false,
    };
  });
}

function buildEducations(
  resume: Resume,
  capturedAt: string,
  claims: Claim[],
  evidence: Evidence[],
): CareerEducation[] {
  return resume.education.map((edu, index) => {
    const link = linkClaims("education", index, edu.id, claims, evidence);
    return {
      id: profileItemId("edu", edu.id),
      school: edu.school,
      degree: edu.degree,
      field: clean(edu.field) || undefined,
      year: edu.year || undefined,
      gpa: clean(edu.gpa) || undefined,
      honors: clean(edu.honors) || undefined,
      source: source(`resume:education:${edu.id}`, capturedAt, {
        claimIds: link.claimIds,
        evidenceIds: link.evidenceIds,
      }),
      verification: candidateStated(),
      derived: false,
    };
  });
}

function buildProjects(
  resume: Resume,
  capturedAt: string,
  claims: Claim[],
  evidence: Evidence[],
): CareerProject[] {
  return resume.projects.map((proj, index) => {
    const link = linkClaims("project", index, proj.id, claims, evidence);
    return {
      id: profileItemId("proj", proj.id),
      name: proj.name,
      description: clean(proj.description) || undefined,
      role: clean(proj.role) || undefined,
      link: proj.link || undefined,
      dates: {
        start: proj.startDate || undefined,
        end: proj.endDate || undefined,
      },
      source: source(`resume:project:${proj.id}`, capturedAt, {
        claimIds: link.claimIds,
        evidenceIds: link.evidenceIds,
      }),
      verification: candidateStated(),
      derived: false,
    };
  });
}

function buildSkills(
  resume: Resume,
  capturedAt: string,
  claims: Claim[],
  evidence: Evidence[],
): CareerSkill[] {
  return resume.skills.map((skill, index) => {
    const link = linkClaims("skill", index, skill.id, claims, evidence);
    return {
      id: profileItemId("skill", skill.id),
      name: skill.name,
      category: skill.category || "General",
      proficiency: skill.level,
      years: skill.years || undefined,
      source: source(`resume:skill:${skill.id}`, capturedAt, {
        claimIds: link.claimIds,
        evidenceIds: link.evidenceIds,
      }),
      verification: candidateStated(),
      derived: false,
    };
  });
}

function buildCertifications(
  resume: Resume,
  capturedAt: string,
  claims: Claim[],
  evidence: Evidence[],
): CareerCertification[] {
  return resume.certifications.map((cert, index) => {
    const link = linkClaims("certification", index, cert.id, claims, evidence);
    return {
      id: profileItemId("cert", cert.id),
      name: cert.name,
      issuer: clean(cert.issuer) || undefined,
      date: cert.date || undefined,
      link: cert.link || undefined,
      source: source(`resume:certification:${cert.id}`, capturedAt, {
        claimIds: link.claimIds,
        evidenceIds: link.evidenceIds,
      }),
      verification: candidateStated(),
      derived: false,
    };
  });
}

function buildLanguages(resume: Resume, capturedAt: string): CareerLanguage[] {
  return resume.languages.map((lang) => ({
    id: profileItemId("lang", lang.id),
    name: lang.name,
    proficiency: lang.proficiency,
    source: source(`resume:language:${lang.id}`, capturedAt),
    verification: candidateStated(),
    derived: false,
  }));
}

function buildIndustries(resume: Resume, capturedAt: string): CareerIndustry[] {
  const byName = new Map<string, string[]>();
  for (const cand of extractIndustries(resume.experience)) {
    const contexts = byName.get(cand.name) ?? [];
    contexts.push(`resume:experience:${cand.sourceRef}`);
    byName.set(cand.name, contexts);
  }
  return [...byName.entries()].map(([name, contexts]) => ({
    id: profileItemId("industry", name),
    name,
    contexts,
    source: source(`resume:industry:${name}`, capturedAt),
    verification: candidateStated(),
    derived: true,
    derivation: {
      kind: "industry",
      sourceText: name,
      method: "collected from the experience.industry fields",
    },
  }));
}

function buildLeadership(resume: Resume, capturedAt: string): CareerLeadership[] {
  const items: CareerLeadership[] = [];
  for (const exp of resume.experience) {
    const text = [exp.description, exp.achievements, ...exp.bulletPoints]
      .filter((t): t is string => !!t)
      .join("\n");
    for (const cand of extractLeadershipFromText(text)) {
      items.push({
        id: profileItemId("lead", `${exp.id}-${items.length}`),
        context: cand.context,
        role: cand.role,
        teamSize: cand.teamSize,
        source: source(`resume:experience:${exp.id}:leadership`, capturedAt),
        verification: candidateStated(),
        derived: true,
        derivation: {
          kind: "leadership",
          sourceText: cand.context,
          method: "detected a leadership verb in the experience text",
        },
      });
    }
  }
  return items;
}

function buildOutcomes(resume: Resume, capturedAt: string): CareerOutcome[] {
  const items: CareerOutcome[] = [];
  for (const exp of resume.experience) {
    const text = [exp.description, exp.achievements, ...exp.bulletPoints]
      .filter((t): t is string => !!t)
      .join("\n");
    for (const cand of extractOutcomesFromText(text)) {
      items.push({
        id: profileItemId("outcome", `${exp.id}-${items.length}`),
        description: cand.description,
        metric: cand.metric,
        unit: cand.unit,
        source: source(`resume:experience:${exp.id}:outcome`, capturedAt),
        verification: candidateStated(),
        derived: true,
        derivation: {
          kind: "outcome",
          sourceText: cand.description,
          method: "detected a measurable metric in the experience text",
        },
      });
    }
  }
  for (const proj of resume.projects) {
    const text = [proj.description, ...proj.bulletPoints]
      .filter((t): t is string => !!t)
      .join("\n");
    for (const cand of extractOutcomesFromText(text)) {
      items.push({
        id: profileItemId("outcome", `${proj.id}-${items.length}`),
        description: cand.description,
        metric: cand.metric,
        unit: cand.unit,
        source: source(`resume:project:${proj.id}:outcome`, capturedAt),
        verification: candidateStated(),
        derived: true,
        derivation: {
          kind: "outcome",
          sourceText: cand.description,
          method: "detected a measurable metric in the project text",
        },
      });
    }
  }
  return items;
}

/* ── Public builder ──────────────────────────────────────────────────────── */

export function buildCareerProfile(
  resume: Resume,
  options: BuildCareerProfileOptions = {},
): CareerProfile {
  const capturedAt = options.capturedAt ?? new Date().toISOString();
  const claims = options.claims ?? [];
  const evidence = options.evidence ?? [];

  const identity = buildIdentity(resume, capturedAt, claims, evidence);

  return {
    id: options.id ?? defaultProfileId(resume),
    version: options.version ?? 1,
    createdAt: capturedAt,
    updatedAt: capturedAt,
    identity,
    experiences: buildExperiences(resume, capturedAt, claims, evidence),
    educations: buildEducations(resume, capturedAt, claims, evidence),
    projects: buildProjects(resume, capturedAt, claims, evidence),
    skills: buildSkills(resume, capturedAt, claims, evidence),
    certifications: buildCertifications(resume, capturedAt, claims, evidence),
    languages: buildLanguages(resume, capturedAt),
    industries: buildIndustries(resume, capturedAt),
    leadership: buildLeadership(resume, capturedAt),
    outcomes: buildOutcomes(resume, capturedAt),
  };
}
