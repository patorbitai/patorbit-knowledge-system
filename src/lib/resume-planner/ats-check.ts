"use strict";

/**
 * Internal ATS structure check (§19). Static, structural — no parsing of
 * rendered output. Returns the same QualityIssue shape as the quality pass
 * so the export modal can show one combined list.
 */

import type { QualityIssue } from "./types";

export interface AtsCheckInput {
  templateId: string;
  /** Archetype family id (7-family taxonomy). */
  familyId?: string;
  /** Raw layout from the template registry. */
  layout?: string;
}

const COLUMN_LAYOUTS = new Set([
  "two-column",
  "sidebar-right",
  "sidebar-left",
  "two-column-balanced",
]);

export function runAtsCheck(input: AtsCheckInput): QualityIssue[] {
  const issues: QualityIssue[] = [];

  if (input.familyId === "classic-ats") {
    issues.push({
      id: "ats-safe-structure",
      severity: "positive",
      message: "ATS-safe structure: single column, plain text headings, no tables or images.",
    });
  } else if (input.layout && COLUMN_LAYOUTS.has(input.layout)) {
    issues.push({
      id: "ats-columns",
      severity: "info",
      message: "This layout uses columns — some strict ATS parsers read them out of order.",
      hint: "The Classic ATS family is the safest choice for systems you can't verify.",
    });
  } else if (input.layout === "banner") {
    issues.push({
      id: "ats-banner",
      severity: "info",
      message: "The banner header is visually strong; text inside it is still plain and readable.",
      hint: "For maximum parse safety choose the Classic ATS family.",
    });
  }

  return issues;
}
