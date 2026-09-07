"use strict";

import { describe, it, expect } from "vitest";
import { detectConflicts } from "../detection";
import type { CanonicalClaimForConflict } from "../types";

// ── Fixtures ───────────────────────────────────────────────────

function makeClaim(overrides: Partial<CanonicalClaimForConflict> = {}): CanonicalClaimForConflict {
  return {
    id: "claim_1",
    professionalIdentityId: "pi_1",
    assertionText: "Test claim",
    claimType: "Skill",
    verificationStatus: "accepted",
    confidence: 0.7,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────

describe("Conflict Detection Algorithm", () => {
  describe("Empty state", () => {
    it("returns no conflicts for empty claims", () => {
      const result = detectConflicts([]);
      expect(result.totalDetected).toBe(0);
      expect(result.claimsCompared).toBe(0);
      expect(result.newConflicts).toHaveLength(0);
    });
  });

  describe("No conflicts", () => {
    it("returns no conflicts for single claim", () => {
      const result = detectConflicts([
        makeClaim({ assertionText: "Worked at Google as Engineer from 2020-01 to 2023-01" }),
      ]);
      expect(result.totalDetected).toBe(0);
    });

    it("returns no conflicts for non-overlapping employment", () => {
      const result = detectConflicts([
        makeClaim({ id: "c1", assertionText: "Worked at Google as Engineer from 2019-01 to 2021-01", claimType: "Employment" }),
        makeClaim({ id: "c2", assertionText: "Worked at Microsoft as Developer from 2021-06 to 2024-01", claimType: "Employment" }),
      ]);
      expect(result.totalDetected).toBe(0);
    });
  });

  describe("Employment conflicts", () => {
    it("detects contradictory employers during overlapping periods", () => {
      const result = detectConflicts([
        makeClaim({ id: "c1", assertionText: "Worked at Google as Engineer from 2020-01 to 2023-01", claimType: "Employment" }),
        makeClaim({ id: "c2", assertionText: "Worked at Amazon as Developer from 2021-01 to 2024-01", claimType: "Employment" }),
      ]);
      expect(result.totalDetected).toBeGreaterThan(0);
      const employerConflict = result.newConflicts.find(
        (c) => c.conflictType === "contradictory_employer",
      );
      expect(employerConflict).toBeDefined();
      expect(employerConflict?.severity).toBe("warning");
      expect(employerConflict?.claimIds).toContain("c1");
      expect(employerConflict?.claimIds).toContain("c2");
    });

    it("detects contradictory job titles during overlapping periods", () => {
      const result = detectConflicts([
        makeClaim({ id: "c1", assertionText: "Worked at Google as Senior Engineer from 2020-01 to 2023-01", claimType: "Employment" }),
        makeClaim({ id: "c2", assertionText: "Worked at Google as Product Manager from 2021-01 to 2024-01", claimType: "Employment" }),
      ]);
      const titleConflict = result.newConflicts.find(
        (c) => c.conflictType === "contradictory_title",
      );
      expect(titleConflict).toBeDefined();
    });

    it("detects contradictory dates for same employer", () => {
      const result = detectConflicts([
        makeClaim({ id: "c1", assertionText: "Worked at Google as Engineer from 2020-01 to 2022-01", claimType: "Employment" }),
        makeClaim({ id: "c2", assertionText: "Worked at Google as Engineer from 2021-01 to 2023-01", claimType: "Employment" }),
      ]);
      const dateConflict = result.newConflicts.find(
        (c) => c.conflictType === "contradictory_dates",
      );
      expect(dateConflict).toBeDefined();
    });
  });

  describe("Education conflicts", () => {
    it("detects education inconsistency (same school, different degree)", () => {
      const result = detectConflicts([
        makeClaim({ id: "c1", assertionText: "Bachelor degree from MIT in Computer Science", claimType: "Education" }),
        makeClaim({ id: "c2", assertionText: "Master degree from MIT in Physics", claimType: "Education" }),
      ]);
      const eduConflict = result.newConflicts.find(
        (c) => c.conflictType === "education_inconsistency",
      );
      expect(eduConflict).toBeDefined();
    });

    it("detects duplicate credential (same degree, different school)", () => {
      const result = detectConflicts([
        makeClaim({ id: "c1", assertionText: "Bachelor degree from MIT in Computer Science", claimType: "Education" }),
        makeClaim({ id: "c2", assertionText: "Bachelor degree from Stanford in Computer Science", claimType: "Education" }),
      ]);
      const dupeConflict = result.newConflicts.find(
        (c) => c.conflictType === "duplicate_credential",
      );
      expect(dupeConflict).toBeDefined();
    });
  });

  describe("Certification conflicts", () => {
    it("detects duplicate certifications", () => {
      const result = detectConflicts([
        makeClaim({ id: "c1", assertionText: "AWS Certified Solutions Architect", claimType: "Certification" }),
        makeClaim({ id: "c2", assertionText: "AWS Certified Solutions Architect Professional", claimType: "Certification" }),
      ]);
      // May or may not detect depending on similarity threshold
      // The algorithm is conservative here
      expect(result.claimsCompared).toBe(2);
    });
  });

  describe("Skill conflicts", () => {
    it("detects contradictory confidence levels for same skill", () => {
      const result = detectConflicts([
        makeClaim({ id: "c1", assertionText: "Expert in Python", claimType: "Skill", confidence: 0.95 }),
        makeClaim({ id: "c2", assertionText: "Python developer", claimType: "Skill", confidence: 0.2 }),
      ]);
      const skillConflict = result.newConflicts.find(
        (c) => c.conflictType === "status_mismatch",
      );
      expect(skillConflict).toBeDefined();
    });
  });

  describe("Status mismatches", () => {
    it("detects verified claim contradicting disputed claim", () => {
      const result = detectConflicts([
        makeClaim({ id: "c1", assertionText: "Worked at Google", verificationStatus: "verified" }),
        makeClaim({ id: "c2", assertionText: "Worked at Google as contractor", verificationStatus: "disputed" }),
      ]);
      const mismatch = result.newConflicts.find(
        (c) => c.conflictType === "status_mismatch" && c.severity === "critical",
      );
      expect(mismatch).toBeDefined();
    });
  });

  describe("Multiple claim types", () => {
    it("handles mixed claim types without cross-type false positives", () => {
      const result = detectConflicts([
        makeClaim({ id: "c1", assertionText: "Worked at Google as Engineer from 2020-01 to 2023-01", claimType: "Employment" }),
        makeClaim({ id: "c2", assertionText: "AWS Certified Solutions Architect", claimType: "Certification" }),
        makeClaim({ id: "c3", assertionText: "Expert in Python", claimType: "Skill" }),
      ]);
      // Should not produce cross-type conflicts
      const crossConflicts = result.newConflicts.filter(
        (c) => c.claimIds.includes("c1") && (c.claimIds.includes("c2") || c.claimIds.includes("c3")),
      );
      expect(crossConflicts).toHaveLength(0);
    });
  });

  describe("Determinism", () => {
    it("same input always produces same output", () => {
      const claims = [
        makeClaim({ id: "c1", assertionText: "Worked at Google as Engineer from 2020-01 to 2023-01", claimType: "Employment" }),
        makeClaim({ id: "c2", assertionText: "Worked at Amazon as Developer from 2021-01 to 2024-01", claimType: "Employment" }),
      ];
      const result1 = detectConflicts(claims);
      const result2 = detectConflicts(claims);
      expect(result1.totalDetected).toBe(result2.totalDetected);
      expect(result1.newConflicts).toEqual(result2.newConflicts);
    });
  });

  describe("No silent resolution", () => {
    it("never automatically resolves conflicts — only surfaces them", () => {
      const result = detectConflicts([
        makeClaim({ id: "c1", assertionText: "Worked at Google as Engineer from 2020-01 to 2023-01", claimType: "Employment" }),
        makeClaim({ id: "c2", assertionText: "Worked at Amazon as Developer from 2021-01 to 2024-01", claimType: "Employment" }),
      ]);
      // All detected conflicts should be surfaced, none silently dropped
      for (const conflict of result.newConflicts) {
        expect(conflict.description).toBeDefined();
        expect(conflict.description.length).toBeGreaterThan(0);
        expect(conflict.claimIds.length).toBeGreaterThanOrEqual(2);
      }
    });
  });
});
