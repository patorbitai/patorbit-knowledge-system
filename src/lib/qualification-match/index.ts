"use strict";

/**
 * Qualification Match (M3) public API.
 *
 * Pure, deterministic functions only — no side effects, no AI, no network.
 */

export {
  buildQualificationMatch,
  type BuildQualificationMatchOptions,
} from "./match";
export type {
  QualificationClassification,
  QualificationSourceGroup,
  QualificationEvidenceKind,
  QualificationEvidenceRef,
  QualificationMatchItem,
  QualificationMatchSummary,
  QualificationMatch,
} from "@/types/qualification-match";