"use strict";

/**
 * M4 Evidence-Based Optimizer — Anti-Fabrication Validator (Patorbit Phase 1).
 *
 * After the AI generates optimization changes, this validator checks that
 * no unsupported facts have been introduced. It compares the AI output
 * against the candidate's Career Profile to detect fabrication.
 *
 * This is a DETERMINISTIC validation — no AI involved. It uses exact and
 * fuzzy matching to detect potential fabrication.
 */

import type { CareerProfile } from "@/types/career-profile";
import type {
  OptimizerChange,
  ValidationResult,
  ValidationViolation,
} from "@/types/evidence-optimizer";

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
}

function tokenize(text: string): Set<string> {
  return new Set(
    normalize(text)
      .split(/\s+/)
      .filter((t) => t.length >= 2),
  );
}

/** Check if a word/phrase appears anywhere in the career profile text集合. */
function existsInProfile(
  term: string,
  profileTexts: Set<string>,
): boolean {
  const normalized = normalize(term);
  if (normalized.length < 2) return false;

  // Exact match
  if (profileTexts.has(normalized)) return true;

  // Token overlap — at least 70% of the term's tokens appear in the profile
  const termTokens = tokenize(normalized);
  let matchCount = 0;
  for (const t of termTokens) {
    if (profileTexts.has(t)) matchCount++;
  }
  return termTokens.size > 0 && matchCount / termTokens.size >= 0.7;
}

/* ── Career Profile text extraction ──────────────────────────────────────── */

/**
 * Extract all meaningful text from a Career Profile into a set for fast lookup.
 * This includes skills, companies, positions, schools, degrees, certifications,
 * project names, achievement text, and technologies.
 */
function extractProfileTexts(profile: CareerProfile): Set<string> {
  const texts = new Set<string>();

  // Skills
  for (const skill of profile.skills) {
    texts.add(normalize(skill.name));
    for (const token of tokenize(skill.name)) {
      texts.add(token);
    }
  }

  // Experiences
  for (const exp of profile.experiences) {
    if (exp.company) {
      texts.add(normalize(exp.company));
      for (const token of tokenize(exp.company)) texts.add(token);
    }
    if (exp.position) {
      texts.add(normalize(exp.position));
      for (const token of tokenize(exp.position)) texts.add(token);
    }
    for (const achievement of exp.achievements) {
      texts.add(normalize(achievement));
      for (const token of tokenize(achievement)) texts.add(token);
    }
    if (exp.summary) {
      for (const token of tokenize(exp.summary)) texts.add(token);
    }
  }

  // Education
  for (const edu of profile.educations) {
    if (edu.school) {
      texts.add(normalize(edu.school));
      for (const token of tokenize(edu.school)) texts.add(token);
    }
    if (edu.degree) {
      texts.add(normalize(edu.degree));
      for (const token of tokenize(edu.degree)) texts.add(token);
    }
    if (edu.field) {
      texts.add(normalize(edu.field));
      for (const token of tokenize(edu.field)) texts.add(token);
    }
  }

  // Certifications
  for (const cert of profile.certifications) {
    if (cert.name) {
      texts.add(normalize(cert.name));
      for (const token of tokenize(cert.name)) texts.add(token);
    }
    if (cert.issuer) {
      texts.add(normalize(cert.issuer));
      for (const token of tokenize(cert.issuer)) texts.add(token);
    }
  }

  // Projects
  for (const proj of profile.projects) {
    if (proj.name) {
      texts.add(normalize(proj.name));
      for (const token of tokenize(proj.name)) texts.add(token);
    }
    if (proj.description) {
      for (const token of tokenize(proj.description)) texts.add(token);
    }
  }

  // Languages
  for (const lang of profile.languages) {
    texts.add(normalize(lang.name));
  }

  return texts;
}

/* ── Specific fabrication detectors ──────────────────────────────────────── */

/**
 * Detect if the optimized text introduces a company/employer name
 * not present in the career profile.
 */
function detectUnsupportedEmployer(
  optimized: string,
  profileTexts: Set<string>,
): string | null {
  // Common employer patterns: "at Google", "for Microsoft", "with Amazon"
  const employerPatterns = [
    /(?:at|for|with|joining|joined)\s+([A-Z][A-Za-z\s&.]+?)(?:\s*[,.]|\s+as\b|\s+where\b|\s+where\b)/gi,
    /([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)\s+(?:as|where|in)\b/gi,
  ];

  for (const pattern of employerPatterns) {
    let match;
    while ((match = pattern.exec(optimized)) !== null) {
      const candidate = match[1]?.trim();
      if (candidate && candidate.length >= 3 && !existsInProfile(candidate, profileTexts)) {
        // Check if it's a common word, not an employer
        const commonWords = new Set([
          "the", "this", "that", "team", "project", "role", "position",
          "company", "organization", "department", "group", "unit",
          "professional", "experience", "career", "industry", "field",
        ]);
        if (!commonWords.has(normalize(candidate))) {
          return candidate;
        }
      }
    }
  }
  return null;
}

/**
 * Detect if the optimized text introduces skills/technologies
 * not present in the career profile.
 */
function detectUnsupportedSkills(
  optimized: string,
  profileTexts: Set<string>,
): string[] {
  const unsupported: string[] = [];

  // Extract capitalized terms and tech-looking terms from the optimized text
  const techPattern = /\b([A-Z][A-Za-z]+(?:\.js|\.ts|\.py|\.net|\.io)?|React|Node|Vue|Angular|Docker|Kubernetes|AWS|GCP|Azure|SQL|NoSQL|REST|GraphQL|CI\/CD|ML|AI|NLP|DevOps|Agile|Scrum|SaaS|PaaS|IaaS)\b/g;

  let match;
  while ((match = techPattern.exec(optimized)) !== null) {
    const term = match[1];
    if (term && !existsInProfile(term, profileTexts)) {
      // Only flag if it looks like a specific technology/skill
      if (term.length >= 3 && /[A-Z]/.test(term[0])) {
        unsupported.push(term);
      }
    }
  }

  return [...new Set(unsupported)];
}

/**
 * Detect if the optimized text introduces dates not in the career profile.
 */
function detectUnsupportedDates(
  optimized: string,
  profileTexts: Set<string>,
): string[] {
  const unsupported: string[] = [];
  const datePattern = /\b(20[0-2]\d|19\d{2})\b/g;

  let match;
  while ((match = datePattern.exec(optimized)) !== null) {
    const year = match[1];
    if (year && !existsInProfile(year, profileTexts)) {
      unsupported.push(year);
    }
  }

  return [...new Set(unsupported)];
}

/**
 * Detect fabricated metrics (percentages, dollar amounts, team sizes)
 * that don't exist in the career profile.
 */
function detectUnsupportedMetrics(
  optimized: string,
  profileTexts: Set<string>,
): string[] {
  const unsupported: string[] = [];

  // Percentage patterns
  const pctPattern = /\b(\d+(?:\.\d+)?%)/g;
  let match;
  while ((match = pctPattern.exec(optimized)) !== null) {
    if (!existsInProfile(match[1], profileTexts)) {
      unsupported.push(match[1]);
    }
  }

  // Dollar amounts
  const dollarPattern = /\$(\d+(?:,\d{3})*(?:\.\d+)?(?:\s*(?:K|M|B|k|m|b))?)/g;
  while ((match = dollarPattern.exec(optimized)) !== null) {
    if (!existsInProfile(match[1], profileTexts)) {
      unsupported.push(`$${match[1]}`);
    }
  }

  // Team sizes
  const teamPattern = /\b(?:team of|led \d+|managed \d+|managed a team of)\s*(\d+)/gi;
  while ((match = teamPattern.exec(optimized)) !== null) {
    const num = match[1];
    if (!existsInProfile(`team of ${num}`, profileTexts) &&
        !existsInProfile(`managed ${num}`, profileTexts)) {
      unsupported.push(`team of ${num}`);
    }
  }

  return [...new Set(unsupported)];
}

/* ── Main validator ──────────────────────────────────────────────────────── */

/**
 * Validate a set of optimizer changes against the Career Profile.
 *
 * Returns a ValidationResult indicating which changes pass and which
 * potentially introduce unsupported facts.
 */
export function validateOptimizerChanges(
  changes: OptimizerChange[],
  careerProfile: CareerProfile,
): ValidationResult {
  const profileTexts = extractProfileTexts(careerProfile);
  const violations: ValidationViolation[] = [];

  for (const change of changes) {
    const text = change.optimized;

    // Skip validation for MISSING qualifications (they should only be in gaps)
    const qual = change.qualification as string;
    if (qual === "MISSING") {
      violations.push({
        changeId: change.id,
        type: "unsupported-skill",
        text: change.optimized,
        description: "MISSING qualifications should not appear as optimization changes",
      });
      continue;
    }

    // Check for unsupported employers
    const employer = detectUnsupportedEmployer(text, profileTexts);
    if (employer) {
      violations.push({
        changeId: change.id,
        type: "unsupported-employer",
        text: employer,
        description: `Employer "${employer}" not found in career profile`,
      });
    }

    // Check for unsupported skills
    const skills = detectUnsupportedSkills(text, profileTexts);
    for (const skill of skills) {
      violations.push({
        changeId: change.id,
        type: "unsupported-skill",
        text: skill,
        description: `Skill/technology "${skill}" not found in career profile`,
      });
    }

    // Check for unsupported dates
    const dates = detectUnsupportedDates(text, profileTexts);
    for (const date of dates) {
      violations.push({
        changeId: change.id,
        type: "unsupported-date",
        text: date,
        description: `Year "${date}" not found in career profile`,
      });
    }

    // Check for unsupported metrics
    const metrics = detectUnsupportedMetrics(text, profileTexts);
    for (const metric of metrics) {
      violations.push({
        changeId: change.id,
        type: "unsupported-metric",
        text: metric,
        description: `Metric "${metric}" not found in career profile`,
      });
    }

    // Check that evidence traceability exists
    if (change.supportingEvidence.length === 0 && change.qualification !== "MISSING") {
      violations.push({
        changeId: change.id,
        type: "unsupported-skill",
        text: change.optimized,
        description: "Change has no supporting evidence references",
      });
    }
  }

  const totalChanges = changes.length;
  const violatingChangeIds = new Set(violations.map((v) => v.changeId));
  const passedChanges = totalChanges - violatingChangeIds.size;

  return {
    valid: violations.length === 0,
    violations,
    totalChanges,
    passedChanges,
  };
}
