"use strict";

/**
 * Career Profile (M1) public API.
 *
 * Pure, deterministic functions only — no side effects, no AI, no network.
 */

export {
  buildCareerProfile,
  type BuildCareerProfileOptions,
} from "./build";
export {
  extractIndustries,
  extractLeadershipFromText,
  extractOutcomesFromText,
  splitTechnologies,
  clean,
  profileItemId,
} from "./extract";
export type {
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
  ProfileItem,
  ProfileSource,
  ProfileSourceType,
  ProfileVerification,
  VerificationState,
  Derivation,
  DerivationKind,
  SkillLevel,
} from "@/types/career-profile";
