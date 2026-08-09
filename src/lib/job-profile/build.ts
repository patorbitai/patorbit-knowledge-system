"use strict";

/**
 * Job Profile builder (M2).
 *
 * `buildJobProfile` is a pure, deterministic function that maps raw job
 * description text into a structured `JobProfile`. No matching happens here —
 * M3 consumes this output.
 *
 * Rules enforced here:
 *  - Nothing is invented. Every item is a faithful copy of JD text or a
 *    rule-based extraction whose exact source line is preserved.
 *  - Every item carries provenance (`source`) with the verbatim JD text.
 *  - Implicit competencies are the only derived items and are always marked
 *    `derived: true` with a `derivation` record.
 */

import type {
  JobProfile,
  JobRequirement,
  JobResponsibility,
  JobSkill,
  JobSeniority,
  JobDomain,
  JobQualification,
  JobImplicitCompetency,
  JobSource,
} from "@/types/job-profile";
import {
  splitLines,
  classifyLine,
  extractTitle,
  extractSkills,
  extractSeniority,
  extractDomain,
  extractImplicitCompetencies,
} from "./extract";

/* ── Options ─────────────────────────────────────────────────────────────── */

export interface BuildJobProfileOptions {
  /** ISO timestamp used as `createdAt` / `updatedAt`. */
  capturedAt?: string;
  /** Optional stable profile id. Defaults to a deterministic id. */
  id?: string;
  /** Profile version. Defaults to 1. */
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

function defaultProfileId(rawText: string): string {
  return `job-profile-${hashString(rawText)}`;
}

/* ── Provenance helper ───────────────────────────────────────────────────── */

function source(ref: string, sourceText: string, method: string): JobSource {
  return { sourceRef: ref, sourceText, method };
}

/* ── Public builder ──────────────────────────────────────────────────────── */

export function buildJobProfile(
  rawText: string,
  options: BuildJobProfileOptions = {},
): JobProfile {
  const capturedAt = options.capturedAt ?? new Date().toISOString();
  const text = rawText ?? "";
  const lines = splitLines(text);

  const requirements: JobRequirement[] = [];
  const responsibilities: JobResponsibility[] = [];
  const qualifications: JobQualification[] = [];

  lines.forEach((line, index) => {
    const ref = `jd:line:${index + 1}`;
    const kind = classifyLine(line);
    if (kind === "requirement") {
      requirements.push({
        text: line,
        source: source(ref, line, "classified as an explicit requirement statement"),
      });
    } else if (kind === "responsibility") {
      responsibilities.push({
        text: line,
        source: source(ref, line, "classified as an action responsibility bullet"),
      });
    } else if (kind === "qualification") {
      qualifications.push({
        text: line,
        source: source(ref, line, "classified as a qualification statement"),
      });
    }
  });

  const skills: JobSkill[] = extractSkills(lines).map(({ name, sourceText }, index) => ({
    name,
    source: source(`jd:skill:${index + 1}`, sourceText, "extracted from an explicit skills list or technology token"),
  }));

  const seniority: JobSeniority[] = extractSeniority(lines).map((item, index) => ({
    level: item.level,
    years: item.years,
    source: source(`jd:seniority:${index + 1}`, item.sourceText, "detected seniority level or explicit years of experience"),
  }));

  const domain: JobDomain[] = extractDomain(lines).map((item, index) => ({
    name: item.name,
    source: source(`jd:domain:${index + 1}`, item.sourceText, "matched a domain term from the JD lexicon"),
  }));

  const implicitCompetencies: JobImplicitCompetency[] = extractImplicitCompetencies(lines).map(
    (item, index) => ({
      name: item.name,
      context: item.context,
      source: source(`jd:implicit:${index + 1}`, item.context, "derived a competency from a contextual phrase"),
      derived: true,
      derivation: {
        kind: "implicit-competency",
        sourceText: item.context,
        method: "mapped a literal JD phrase to a canonical competency",
      },
    }),
  );

  return {
    id: options.id ?? defaultProfileId(text),
    version: options.version ?? 1,
    createdAt: capturedAt,
    updatedAt: capturedAt,
    sourceLength: text.length,
    title: extractTitle(lines),
    requirements,
    responsibilities,
    skills,
    seniority,
    domain,
    qualifications,
    implicitCompetencies,
  };
}
