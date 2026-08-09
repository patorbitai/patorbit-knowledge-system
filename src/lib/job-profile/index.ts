"use strict";

/**
 * Job Profile (M2) public API.
 *
 * Pure, deterministic functions only — no side effects, no AI, no network.
 */

export { buildJobProfile, type BuildJobProfileOptions } from "./build";
export {
  normalize,
  splitLines,
  splitBullets,
  extractTitle,
  classifyLine,
  isRequirementLine,
  isResponsibilityLine,
  isQualificationLine,
  extractSkills,
  extractSeniority,
  extractDomain,
  extractImplicitCompetencies,
} from "./extract";
export type {
  JobProfile,
  JobRequirement,
  JobResponsibility,
  JobSkill,
  JobSeniority,
  JobSeniorityLevel,
  JobDomain,
  JobQualification,
  JobImplicitCompetency,
  JobSource,
  JobDerivation,
  JobDerivationKind,
} from "@/types/job-profile";
