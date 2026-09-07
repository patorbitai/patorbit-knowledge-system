"use strict";

/**
 * M4 Evidence-Based Optimizer — Apply Accepted Changes (Patorbit Phase 1).
 *
 * Converts accepted OptimizerChange[] into a new Resume by applying each
 * change to the appropriate section. The original Resume is NEVER modified.
 *
 * Change application rules:
 *  - "summary" changes replace the summary text
 *  - "experience" changes rewrite bullet points for the matching experience entry
 *  - "skills" changes reorder skills (JD-relevant first)
 *  - "education", "projects", "certifications" changes are applied as text rewrites
 *  - "general" changes are applied only if they match an existing field
 *
 * SAFETY:
 *  - Only changes the user explicitly accepted are applied
 *  - The original resume is deep-cloned, never mutated
 *  - Missing sections are not created — only existing content is modified
 */

import type { Resume } from "@/types/resume";
import type { OptimizerChange } from "@/types/evidence-optimizer";

/**
 * Deep-clone a Resume to prevent mutation of the original.
 */
function cloneResume(resume: Resume): Resume {
  return JSON.parse(JSON.stringify(resume)) as Resume;
}

/**
 * Find the best matching experience entry for a change.
 *
 * Strategy:
 *  1. If the change.original text appears verbatim in any experience description/achievements, match that.
 *  2. Otherwise, fall back to the first experience entry (changes apply to the most relevant entry).
 */
function findExperienceIndex(
  resume: Resume,
  change: OptimizerChange,
): number {
  const originalLower = change.original.toLowerCase().trim();
  if (!originalLower) return 0;

  // Exact match in description
  for (let i = 0; i < resume.experience.length; i++) {
    const exp = resume.experience[i];
    if (exp.description?.toLowerCase().includes(originalLower)) return i;
    // Check bullet points
    if (exp.bulletPoints?.some((bp) => bp.toLowerCase().includes(originalLower))) return i;
    // Check achievements string
    if (exp.achievements?.toLowerCase().includes(originalLower)) return i;
  }

  return 0;
}

/**
 * Apply a summary change to the resume.
 */
function applySummaryChange(
  resume: Resume,
  change: OptimizerChange,
): Resume {
  const updated = cloneResume(resume);
  updated.summary = change.optimized;
  return updated;
}

/**
 * Apply an experience change to the resume.
 *
 * The change.optimized text replaces the matching content in the experience entry.
 * If the original text is found in bulletPoints, the matching bullet is replaced.
 * If found in description, the description is updated.
 * Otherwise, the optimized text is appended to the description.
 */
function applyExperienceChange(
  resume: Resume,
  change: OptimizerChange,
): Resume {
  const updated = cloneResume(resume);
  if (updated.experience.length === 0) return updated;

  const idx = findExperienceIndex(resume, change);
  const exp = { ...updated.experience[idx] };

  const originalLower = change.original.toLowerCase().trim();

  // Try to replace in bulletPoints
  if (exp.bulletPoints && exp.bulletPoints.length > 0 && originalLower) {
    const bulletIdx = exp.bulletPoints.findIndex((bp) =>
      bp.toLowerCase().includes(originalLower),
    );
    if (bulletIdx >= 0) {
      exp.bulletPoints = [...exp.bulletPoints];
      exp.bulletPoints[bulletIdx] = change.optimized;
      updated.experience[idx] = exp;
      return updated;
    }
  }

  // Try to replace in description
  if (exp.description && originalLower) {
    const descLower = exp.description.toLowerCase();
    const matchIdx = descLower.indexOf(originalLower);
    if (matchIdx >= 0) {
      exp.description =
        exp.description.slice(0, matchIdx) +
        change.optimized +
        exp.description.slice(matchIdx + change.original.length);
      updated.experience[idx] = exp;
      return updated;
    }
  }

  // Try to replace in achievements
  if (exp.achievements && originalLower) {
    const achLower = exp.achievements.toLowerCase();
    const matchIdx = achLower.indexOf(originalLower);
    if (matchIdx >= 0) {
      exp.achievements =
        exp.achievements.slice(0, matchIdx) +
        change.optimized +
        exp.achievements.slice(matchIdx + change.original.length);
      updated.experience[idx] = exp;
      return updated;
    }
  }

  // Fallback: append optimized text to description
  exp.description = exp.description
    ? `${exp.description}\n${change.optimized}`
    : change.optimized;
  updated.experience[idx] = exp;
  return updated;
}

/**
 * Apply a skills change to the resume.
 *
 * Skills changes typically reorder skills to prioritize JD-relevant ones.
 * If the change.optimized text is a comma-separated list of skill names,
 * we reorder the existing skills to match.
 * Otherwise, we apply the change as a description-level modification.
 */
function applySkillsChange(
  resume: Resume,
  change: OptimizerChange,
): Resume {
  const updated = cloneResume(resume);

  // If the optimized text looks like a reordered skill list, reorder existing skills
  const optimizedNames = change.optimized
    .split(/[,;|]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (optimizedNames.length >= 2) {
    // Build a name → skill map
    const skillMap = new Map(
      updated.skills.map((s) => [s.name.toLowerCase(), s]),
    );

    // Reorder: skills matching optimizedNames first, then remaining in original order
    const reordered: typeof updated.skills = [];
    const seen = new Set<string>();

    for (const name of optimizedNames) {
      const skill = skillMap.get(name);
      if (skill && !seen.has(name)) {
        reordered.push(skill);
        seen.add(name);
      }
    }

    // Add remaining skills not in the optimized list
    for (const skill of updated.skills) {
      const key = skill.name.toLowerCase();
      if (!seen.has(key)) {
        reordered.push(skill);
        seen.add(key);
      }
    }

    updated.skills = reordered;
    return updated;
  }

  // Fallback: if the change references a specific skill, update its level/category
  // For now, return unchanged (skills changes are typically reorderings)
  return updated;
}

/**
 * Apply an education change to the resume.
 */
function applyEducationChange(
  resume: Resume,
  change: OptimizerChange,
): Resume {
  const updated = cloneResume(resume);
  if (updated.education.length === 0) return updated;

  // Find matching education entry by school/degree/field
  const originalLower = change.original.toLowerCase().trim();
  let idx = 0;

  if (originalLower) {
    for (let i = 0; i < updated.education.length; i++) {
      const edu = updated.education[i];
      if (
        edu.school?.toLowerCase().includes(originalLower) ||
        edu.degree?.toLowerCase().includes(originalLower) ||
        edu.field?.toLowerCase().includes(originalLower)
      ) {
        idx = i;
        break;
      }
    }
  }

  // Apply the optimized text to the degree or field
  const edu = { ...updated.education[idx] };
  if (edu.degree?.toLowerCase().includes(originalLower)) {
    edu.degree = change.optimized;
  } else if (edu.field?.toLowerCase().includes(originalLower)) {
    edu.field = change.optimized;
  } else {
    // Append to degree as fallback
    edu.degree = edu.degree ? `${edu.degree} — ${change.optimized}` : change.optimized;
  }
  updated.education[idx] = edu;
  return updated;
}

/**
 * Apply a projects change to the resume.
 */
function applyProjectsChange(
  resume: Resume,
  change: OptimizerChange,
): Resume {
  const updated = cloneResume(resume);
  if (updated.projects.length === 0) return updated;

  const originalLower = change.original.toLowerCase().trim();
  let idx = 0;

  if (originalLower) {
    for (let i = 0; i < updated.projects.length; i++) {
      const proj = updated.projects[i];
      if (
        proj.name?.toLowerCase().includes(originalLower) ||
        proj.description?.toLowerCase().includes(originalLower)
      ) {
        idx = i;
        break;
      }
    }
  }

  const proj = { ...updated.projects[idx] };
  if (proj.description?.toLowerCase().includes(originalLower)) {
    proj.description = change.optimized;
  } else {
    proj.description = proj.description
      ? `${proj.description}\n${change.optimized}`
      : change.optimized;
  }
  updated.projects[idx] = proj;
  return updated;
}

/**
 * Apply a certifications change to the resume.
 */
function applyCertificationsChange(
  resume: Resume,
  change: OptimizerChange,
): Resume {
  const updated = cloneResume(resume);
  if (updated.certifications.length === 0) return updated;

  const originalLower = change.original.toLowerCase().trim();
  let idx = 0;

  if (originalLower) {
    for (let i = 0; i < updated.certifications.length; i++) {
      const cert = updated.certifications[i];
      if (
        cert.name?.toLowerCase().includes(originalLower) ||
        cert.description?.toLowerCase().includes(originalLower)
      ) {
        idx = i;
        break;
      }
    }
  }

  const cert = { ...updated.certifications[idx] };
  if (cert.description?.toLowerCase().includes(originalLower)) {
    cert.description = change.optimized;
  } else {
    cert.description = cert.description
      ? `${cert.description}\n${change.optimized}`
      : change.optimized;
  }
  updated.certifications[idx] = cert;
  return updated;
}

/**
 * Apply a set of accepted OptimizerChanges to a Resume.
 *
 * Returns a NEW Resume with the changes applied. The original is never modified.
 *
 * @param original - The source Resume (untouched)
 * @param acceptedChanges - The changes the user approved
 * @returns A new Resume with only the accepted changes applied
 */
export function applyAcceptedChanges(
  original: Resume,
  acceptedChanges: OptimizerChange[],
): Resume {
  if (acceptedChanges.length === 0) return cloneResume(original);

  let result = cloneResume(original);

  for (const change of acceptedChanges) {
    switch (change.section) {
      case "summary":
        result = applySummaryChange(result, change);
        break;
      case "experience":
        result = applyExperienceChange(result, change);
        break;
      case "skills":
        result = applySkillsChange(result, change);
        break;
      case "education":
        result = applyEducationChange(result, change);
        break;
      case "projects":
        result = applyProjectsChange(result, change);
        break;
      case "certifications":
        result = applyCertificationsChange(result, change);
        break;
      case "general":
        // General changes are applied to summary as a safe default
        if (change.original && result.summary?.toLowerCase().includes(change.original.toLowerCase())) {
          result = applySummaryChange(result, change);
        }
        break;
    }
  }

  return result;
}
