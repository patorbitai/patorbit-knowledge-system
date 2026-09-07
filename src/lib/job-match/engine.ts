"use strict";

import type { JobProfile, JobSkill } from "@/types/job-profile";

/* ── User Profile (minimal shape from /api/claims) ───────────────────────── */

export interface UserClaim {
  id: string;
  assertionText: string;
  claimType: string;
  confidence: number;
  verificationStatus: string;
}

/* ── Match Result ────────────────────────────────────────────────────────── */

export type MatchLevel = "strong" | "good" | "partial" | "limited" | "insufficient-data";

export interface SkillMatch {
  skill: string;
  matched: boolean;
  /** The user claim that supports this skill, if any. */
  supportingClaim?: UserClaim;
}

export interface MatchResult {
  level: MatchLevel;
  score: number; // 0–100, deterministic
  explanation: string;
  matchedSkills: SkillMatch[];
  missingSkills: string[];
  experienceAssessment: string;
  relevantClaims: UserClaim[];
  /** Recruiter email extracted from JD, if any. */
  recruiterEmail?: string;
}

/* ── Normalization ───────────────────────────────────────────────────────── */

/** Normalize a skill name for comparison. */
function normalizeSkill(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9+#\s]/g, "")
    .replace(/\s+/g, " ");
}

/** Build a set of normalized skill names from user claims. */
function extractUserSkills(claims: UserClaim[]): Map<string, UserClaim> {
  const skills = new Map<string, UserClaim>();

  for (const claim of claims) {
    if (claim.claimType !== "Skill") continue;
    const normalized = normalizeSkill(claim.assertionText);
    if (normalized && !skills.has(normalized)) {
      skills.set(normalized, claim);
    }
  }

  return skills;
}

/** Build a set of normalized keywords from employment claims. */
function extractUserKeywords(claims: UserClaim[]): Set<string> {
  const keywords = new Set<string>();

  for (const claim of claims) {
    if (claim.claimType !== "Employment" && claim.claimType !== "Project") continue;
    const words = claim.assertionText
      .toLowerCase()
      .split(/[\s,;.()\-]+/)
      .filter((w) => w.length > 2);
    for (const word of words) {
      keywords.add(word);
    }
  }

  return keywords;
}

/* ── Skill Matching ──────────────────────────────────────────────────────── */

/**
 * Determine if a JD skill matches a user skill.
 * Uses both exact and fuzzy matching.
 */
function skillsMatch(jdSkill: string, userSkill: string): boolean {
  const normJd = normalizeSkill(jdSkill);
  const normUser = normalizeSkill(userSkill);

  // Exact match
  if (normJd === normUser) return true;

  // One contains the other (e.g. "sql" matches "mysql")
  if (normJd.includes(normUser) || normUser.includes(normJd)) return true;

  // Common aliases
  const ALIASES: Record<string, string[]> = {
    sql: ["mysql", "postgresql", "postgres", "tsql", "plsql", "sql server"],
    python: ["python3", "python2"],
    js: ["javascript", "typescript", "ts"],
    react: ["reactjs", "react.js"],
    node: ["nodejs", "node.js"],
    "machine learning": ["ml", "deep learning", "dl"],
    aws: ["amazon web services"],
    gcp: ["google cloud", "google cloud platform"],
    "data engineering": ["etl", "data pipeline", "data pipelines"],
  };

  for (const [key, aliases] of Object.entries(ALIASES)) {
    const group = [key, ...aliases];
    if (group.includes(normJd) && group.includes(normUser)) return true;
  }

  return false;
}

/* ── Recruiter Email Extraction ──────────────────────────────────────────── */

/** Extract email addresses from raw JD text. */
export function extractRecruiterEmail(jdText: string): string | undefined {
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const matches = jdText.match(emailRegex);
  if (!matches || matches.length === 0) return undefined;
  // Return the first email found
  return matches[0];
}

/* ── Experience Assessment ───────────────────────────────────────────────── */

function assessExperience(
  profile: JobProfile,
  claims: UserClaim[],
): { text: string; hasData: boolean } {
  const seniorityInfo = profile.seniority.find((s) => s.years);
  if (!seniorityInfo?.years) {
    return { text: "Experience requirements could not be determined from the job description.", hasData: false };
  }

  const requiredYears = seniorityInfo.years.replace(/[^0-9]/g, "");
  if (!requiredYears) {
    return { text: `Seniority level: ${seniorityInfo.level || "Not specified"}.`, hasData: false };
  }

  const numYears = parseInt(requiredYears, 10);

  // Count employment claims as a rough proxy
  const employmentClaims = claims.filter((c) => c.claimType === "Employment");

  if (employmentClaims.length === 0) {
    return {
      text: `The job requires ${numYears}+ years of experience. Your profile does not yet contain employment history to compare against.`,
      hasData: false,
    };
  }

  return {
    text: `The job requires approximately ${numYears}+ years of experience. Your profile contains ${employmentClaims.length} employment record${employmentClaims.length !== 1 ? "s" : ""}.`,
    hasData: true,
  };
}

/* ── Main Match Engine ───────────────────────────────────────────────────── */

/**
 * Deterministic job match engine.
 *
 * Compares a parsed JobProfile against the user's canonical Patorbit Claims.
 * No AI, no external APIs, no randomness.
 *
 * @param profile  Parsed job description
 * @param claims   User's canonical professional claims from Patorbit
 * @param jdText   Raw JD text (for email extraction)
 */
export function computeJobMatch(
  profile: JobProfile,
  claims: UserClaim[],
  jdText: string,
): MatchResult {
  const userSkills = extractUserSkills(claims);
  const userKeywords = extractUserKeywords(claims);

  // Match JD skills against user skills
  const matchedSkills: SkillMatch[] = [];
  const missingSkills: string[] = [];

  for (const jdSkill of profile.skills) {
    let matched = false;
    let supportingClaim: UserClaim | undefined;

    // Check against user's Skill claims
    for (const [userSkillName, userClaim] of userSkills) {
      if (skillsMatch(jdSkill.name, userSkillName)) {
        matched = true;
        supportingClaim = userClaim;
        break;
      }
    }

    // Fallback: check if skill keyword appears in any employment/project claim
    if (!matched) {
      const skillNorm = normalizeSkill(jdSkill.name);
      for (const keyword of userKeywords) {
        if (keyword.includes(skillNorm) || skillNorm.includes(keyword)) {
          matched = true;
          break;
        }
      }
    }

    if (matched) {
      matchedSkills.push({ skill: jdSkill.name, matched: true, supportingClaim });
    } else {
      matchedSkills.push({ skill: jdSkill.name, matched: false });
      missingSkills.push(jdSkill.name);
    }
  }

  // Calculate score
  const totalSkills = profile.skills.length;
  const matchedCount = matchedSkills.filter((s) => s.matched).length;
  const skillScore = totalSkills > 0 ? Math.round((matchedCount / totalSkills) * 70) : 0;

  // Experience bonus (up to 20 points)
  const hasEmployment = claims.some((c) => c.claimType === "Employment");
  const experienceScore = hasEmployment ? 20 : 0;

  // Verification bonus (up to 10 points)
  const verifiedClaims = claims.filter((c) => c.verificationStatus === "verified");
  const verificationScore = Math.min(10, verifiedClaims.length * 5);

  const score = Math.min(100, skillScore + experienceScore + verificationScore);

  // Determine level
  let level: MatchLevel;
  let explanation: string;
  if (totalSkills === 0) {
    level = "insufficient-data";
    explanation = "The job description did not contain clearly identifiable skills to match against.";
  } else if (score >= 70) {
    level = "strong";
    explanation = `Strong match — ${matchedCount} of ${totalSkills} required skills found in your profile.`;
  } else if (score >= 50) {
    level = "good";
    explanation = `Good match — ${matchedCount} of ${totalSkills} required skills found in your profile.`;
  } else if (score >= 30) {
    level = "partial";
    explanation = `Partial match — ${matchedCount} of ${totalSkills} required skills found in your profile.`;
  } else {
    level = "limited";
    explanation = `Limited match — only ${matchedCount} of ${totalSkills} required skills found in your profile.`;
  }

  // Collect relevant claims
  const relevantClaims = claims.filter((c) => {
    if (c.claimType === "Skill") {
      return profile.skills.some((s) => skillsMatch(s.name, c.assertionText));
    }
    if (c.claimType === "Employment" || c.claimType === "Project") {
      const keywords = c.assertionText.toLowerCase();
      return profile.skills.some((s) => keywords.includes(normalizeSkill(s.name)));
    }
    return false;
  });

  // Experience assessment
  const experience = assessExperience(profile, claims);

  // Recruiter email
  const recruiterEmail = extractRecruiterEmail(jdText);

  return {
    level,
    score,
    explanation,
    matchedSkills,
    missingSkills,
    experienceAssessment: experience.text,
    relevantClaims: relevantClaims.slice(0, 5), // Limit to top 5
    recruiterEmail,
  };
}
