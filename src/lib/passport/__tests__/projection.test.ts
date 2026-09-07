"use strict";

import { describe, it, expect } from "vitest";
import { buildPassport } from "../projection";
import { PASSPORT_SCHEMA_VERSION } from "../types";
import type { PassportProjectionInput } from "../types";

// ── Fixtures ───────────────────────────────────────────────────

function emptyInput(): PassportProjectionInput {
  return {
    displayName: "Test User",
    headline: null,
    summary: null,
    location: null,
    claims: [],
    evidence: [],
    verificationEvents: [],
    conflicts: [],
    trustReport: null,
  };
}

// ── Tests ──────────────────────────────────────────────────────

describe("Passport Projection", () => {
  describe("Empty state", () => {
    it("returns valid Passport for empty input", () => {
      const passport = buildPassport(emptyInput());
      expect(passport.schemaVersion).toBe(PASSPORT_SCHEMA_VERSION);
      expect(passport.identity.displayName).toBe("Test User");
      expect(passport.claims).toHaveLength(0);
      expect(passport.trust).toBeNull();
      expect(passport.conflicts.activeConflicts).toBe(0);
      expect(passport.evidence.totalEvidence).toBe(0);
    });

    it("includes generatedAt as ISO string", () => {
      const passport = buildPassport(emptyInput());
      expect(typeof passport.generatedAt).toBe("string");
      expect(new Date(passport.generatedAt).toISOString()).toBe(passport.generatedAt);
    });

    it("uses display name fallback", () => {
      const passport = buildPassport({ ...emptyInput(), displayName: "" });
      expect(passport.identity.displayName).toBe("Professional");
    });
  });

  describe("Identity", () => {
    it("includes headline and summary when provided", () => {
      const passport = buildPassport({
        ...emptyInput(),
        headline: "Senior Engineer",
        summary: "Building great things",
        location: "San Francisco",
      });
      expect(passport.identity.headline).toBe("Senior Engineer");
      expect(passport.identity.summary).toBe("Building great things");
      expect(passport.identity.location).toBe("San Francisco");
    });
  });

  describe("Claims", () => {
    it("includes claims with evidence count", () => {
      const passport = buildPassport({
        ...emptyInput(),
        claims: [
          { id: "c1", assertionText: "Worked at Google", claimType: "Employment", verificationStatus: "verified", confidence: 0.9, createdAt: new Date() },
          { id: "c2", assertionText: "AWS Certified", claimType: "Certification", verificationStatus: "accepted", confidence: 0.8, createdAt: new Date() },
        ],
        evidence: [
          { id: "ev1", claimId: "c1", evidenceKind: "document", metadata: "{}" },
        ],
      });
      expect(passport.claims).toHaveLength(2);
      expect(passport.claims[0].evidenceCount).toBe(1);
      expect(passport.claims[0].hasEvidence).toBe(true);
      expect(passport.claims[1].evidenceCount).toBe(0);
      expect(passport.claims[1].hasEvidence).toBe(false);
    });

    it("includes verification status in claim summary", () => {
      const passport = buildPassport({
        ...emptyInput(),
        claims: [
          { id: "c1", assertionText: "Test", claimType: "Skill", verificationStatus: "verified", confidence: 0.9, createdAt: new Date() },
        ],
        evidence: [],
        verificationEvents: [
          { claimId: "c1", eventType: "verified", resultingStatus: "verified", createdAt: new Date() },
        ],
      });
      expect(passport.claims[0].verificationStatus).toBe("verified");
      expect(passport.claims[0].latestVerificationEvent).toBe("verified");
    });
  });

  describe("Trust", () => {
    it("includes trust when provided", () => {
      const passport = buildPassport({
        ...emptyInput(),
        trustReport: {
          score: 75,
          level: "Strong",
          algorithmVersion: "v2",
        },
      });
      expect(passport.trust).not.toBeNull();
      expect(passport.trust!.score).toBe(75);
      expect(passport.trust!.level).toBe("Strong");
      expect(passport.trust!.algorithmVersion).toBe("v2");
    });

    it("returns null trust when not provided", () => {
      const passport = buildPassport(emptyInput());
      expect(passport.trust).toBeNull();
    });
  });

  describe("Conflicts", () => {
    it("counts active/dismissed/resolved conflicts", () => {
      const passport = buildPassport({
        ...emptyInput(),
        conflicts: [
          { status: "new", severity: "warning" },
          { status: "reviewing", severity: "info" },
          { status: "dismissed", severity: "warning" },
          { status: "resolved", severity: "critical" },
        ],
      });
      expect(passport.conflicts.activeConflicts).toBe(2);
      expect(passport.conflicts.dismissedConflicts).toBe(1);
      expect(passport.conflicts.resolvedConflicts).toBe(1);
    });

    it("does NOT expose conflict details (privacy)", () => {
      const passport = buildPassport({
        ...emptyInput(),
        conflicts: [
          { status: "new", severity: "critical" },
        ],
      });
      // Only summary counts, no detailed conflict records
      expect(passport.conflicts.activeConflicts).toBe(1);
      expect(typeof passport.conflicts).toBe("object");
      // Verify no individual conflict details are exposed
      expect((passport.conflicts as any).conflicts).toBeUndefined();
    });
  });

  describe("Evidence", () => {
    it("counts evidence by kind", () => {
      const passport = buildPassport({
        ...emptyInput(),
        evidence: [
          { id: "ev1", claimId: "c1", evidenceKind: "document", metadata: "{}" },
          { id: "ev2", claimId: "c1", evidenceKind: "link", metadata: "{}" },
          { id: "ev3", claimId: "c2", evidenceKind: "document", metadata: "{}" },
        ],
      });
      expect(passport.evidence.totalEvidence).toBe(3);
      expect(passport.evidence.evidenceKinds.document).toBe(2);
      expect(passport.evidence.evidenceKinds.link).toBe(1);
    });
  });

  describe("Privacy", () => {
    it("never exposes raw evidence documents", () => {
      const passport = buildPassport({
        ...emptyInput(),
        evidence: [
          { id: "ev1", claimId: "c1", evidenceKind: "document", metadata: "{\"fileName\":\"secret.pdf\"}" },
        ],
      });
      // Only aggregate counts, no raw metadata
      expect(passport.evidence.totalEvidence).toBe(1);
      expect(JSON.stringify(passport)).not.toContain("secret.pdf");
    });

    it("never exposes internal claim details", () => {
      const passport = buildPassport({
        ...emptyInput(),
        claims: [
          { id: "c1", assertionText: "Test", claimType: "Skill", verificationStatus: "verified", confidence: 0.9, createdAt: new Date() },
        ],
      });
      // No sourceActivityId, no reasoning
      expect(JSON.stringify(passport)).not.toContain("sourceActivityId");
      expect(JSON.stringify(passport)).not.toContain("reasoning");
    });
  });

  describe("Determinism", () => {
    it("same input produces same output (except generatedAt)", () => {
      const input = {
        ...emptyInput(),
        claims: [
          { id: "c1", assertionText: "Test", claimType: "Skill", verificationStatus: "verified", confidence: 0.9, createdAt: new Date("2026-01-01") },
        ],
      };
      const p1 = buildPassport(input);
      const p2 = buildPassport(input);
      expect(p1.schemaVersion).toBe(p2.schemaVersion);
      expect(p1.identity).toEqual(p2.identity);
      expect(p1.claims).toEqual(p2.claims);
      expect(p1.trust).toEqual(p2.trust);
      expect(p1.conflicts).toEqual(p2.conflicts);
      expect(p1.evidence).toEqual(p2.evidence);
    });
  });

  describe("Schema version", () => {
    it("every Passport includes schema version", () => {
      const passport = buildPassport(emptyInput());
      expect(passport.schemaVersion).toBe("v1");
    });
  });
});
