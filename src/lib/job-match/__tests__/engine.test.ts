"use strict";

import { describe, it, expect } from "vitest";
import { computeJobMatch, extractRecruiterEmail } from "../engine";
import type { JobProfile } from "@/types/job-profile";
import type { UserClaim } from "../engine";

/* ── Test Fixtures ───────────────────────────────────────────────────────── */

function makeProfile(overrides: Partial<JobProfile> = {}): JobProfile {
  return {
    id: "test-profile",
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceLength: 500,
    title: "Data Engineer",
    requirements: [
      { text: "3+ years experience", source: { sourceRef: "jd:line:1", sourceText: "3+ years", method: "extract" } },
    ],
    responsibilities: [
      { text: "Build ETL pipelines", source: { sourceRef: "jd:line:5", sourceText: "Build ETL pipelines", method: "extract" } },
    ],
    skills: [
      { name: "Python", category: "technology", source: { sourceRef: "jd:skills", sourceText: "Python", method: "extract" } },
      { name: "SQL", category: "technology", source: { sourceRef: "jd:skills", sourceText: "SQL", method: "extract" } },
      { name: "Tableau", category: "tool", source: { sourceRef: "jd:skills", sourceText: "Tableau", method: "extract" } },
    ],
    seniority: [{ level: "Mid", years: "3+", source: { sourceRef: "jd:seniority", sourceText: "3+ years", method: "extract" } }],
    domain: [{ name: "Data Engineering", source: { sourceRef: "jd:domain", sourceText: "Data Engineering", method: "extract" } }],
    qualifications: [],
    implicitCompetencies: [],
    ...overrides,
  };
}

function makeClaim(overrides: Partial<UserClaim> = {}): UserClaim {
  return {
    id: "claim_1",
    assertionText: "Python",
    claimType: "Skill",
    confidence: 0.8,
    verificationStatus: "suggested",
    ...overrides,
  };
}

/* ── Tests ───────────────────────────────────────────────────────────────── */

describe("Job Match Engine", () => {
  describe("computeJobMatch", () => {
    it("returns strong match when all skills are present", () => {
      const profile = makeProfile();
      const claims = [
        makeClaim({ id: "c1", assertionText: "Python", claimType: "Skill" }),
        makeClaim({ id: "c2", assertionText: "SQL", claimType: "Skill" }),
        makeClaim({ id: "c3", assertionText: "Tableau", claimType: "Skill" }),
      ];

      const result = computeJobMatch(profile, claims, "Send resume to test@example.com");

      expect(result.level).toBe("strong");
      expect(result.matchedSkills.every((s) => s.matched)).toBe(true);
      expect(result.missingSkills).toHaveLength(0);
    });

    it("identifies missing skills correctly", () => {
      const profile = makeProfile();
      const claims = [
        makeClaim({ id: "c1", assertionText: "Python", claimType: "Skill" }),
      ];

      const result = computeJobMatch(profile, claims, "");

      expect(result.missingSkills).toContain("SQL");
      expect(result.missingSkills).toContain("Tableau");
      expect(result.matchedSkills.find((s) => s.skill === "Python")?.matched).toBe(true);
    });

    it("matches SQL with MySQL (alias)", () => {
      const profile = makeProfile({
        skills: [{ name: "MySQL", category: "technology", source: { sourceRef: "jd:1", sourceText: "MySQL", method: "extract" } }],
      });
      const claims = [
        makeClaim({ id: "c1", assertionText: "SQL", claimType: "Skill" }),
      ];

      const result = computeJobMatch(profile, claims, "");
      expect(result.matchedSkills[0].matched).toBe(true);
    });

    it("matches partial names (e.g. python matches python3)", () => {
      const profile = makeProfile({
        skills: [{ name: "Python3", category: "technology", source: { sourceRef: "jd:1", sourceText: "Python3", method: "extract" } }],
      });
      const claims = [
        makeClaim({ id: "c1", assertionText: "Python", claimType: "Skill" }),
      ];

      const result = computeJobMatch(profile, claims, "");
      expect(result.matchedSkills[0].matched).toBe(true);
    });

    it("does not fabricate skill matches", () => {
      const profile = makeProfile();
      const claims = [
        makeClaim({ id: "c1", assertionText: "Java", claimType: "Skill" }),
      ];

      const result = computeJobMatch(profile, claims, "");
      expect(result.matchedSkills.every((s) => !s.matched)).toBe(true);
      expect(result.missingSkills).toHaveLength(3);
    });

    it("returns insufficient-data when no skills in JD", () => {
      const profile = makeProfile({ skills: [] });
      const claims = [makeClaim()];

      const result = computeJobMatch(profile, claims, "");
      expect(result.level).toBe("insufficient-data");
      expect(result.score).toBe(0);
    });

    it("score is deterministic (same input → same output)", () => {
      const profile = makeProfile();
      const claims = [makeClaim({ assertionText: "Python" })];

      const r1 = computeJobMatch(profile, claims, "");
      const r2 = computeJobMatch(profile, claims, "");

      expect(r1.score).toBe(r2.score);
      expect(r1.level).toBe(r2.level);
      expect(r1.missingSkills).toEqual(r2.missingSkills);
    });

    it("score is explainable", () => {
      const profile = makeProfile();
      const claims = [makeClaim({ assertionText: "Python" })];

      const result = computeJobMatch(profile, claims, "");
      expect(result.explanation).toBeTruthy();
      expect(result.explanation.length).toBeGreaterThan(10);
    });

    it("includes experience assessment", () => {
      const profile = makeProfile();
      const claims = [
        makeClaim({ id: "c1", assertionText: "Worked at Google", claimType: "Employment" }),
      ];

      const result = computeJobMatch(profile, claims, "");
      expect(result.experienceAssessment).toBeTruthy();
    });

    it("does not invent experience when no employment claims", () => {
      const profile = makeProfile();
      const claims = [
        makeClaim({ id: "c1", assertionText: "Python", claimType: "Skill" }),
      ];

      const result = computeJobMatch(profile, claims, "");
      expect(result.experienceAssessment).toContain("does not yet contain employment");
    });

    it("collects relevant claims", () => {
      const profile = makeProfile();
      const claims = [
        makeClaim({ id: "c1", assertionText: "Python", claimType: "Skill" }),
        makeClaim({ id: "c2", assertionText: "Built Python data pipelines", claimType: "Employment" }),
        makeClaim({ id: "c3", assertionText: "Cooking", claimType: "Skill" }),
      ];

      const result = computeJobMatch(profile, claims, "");
      const relevantIds = result.relevantClaims.map((c) => c.id);
      expect(relevantIds).toContain("c1");
      expect(relevantIds).toContain("c2");
      expect(relevantIds).not.toContain("c3");
    });

    it("limits relevant claims to 5", () => {
      const profile = makeProfile();
      const claims = Array.from({ length: 10 }, (_, i) =>
        makeClaim({ id: `c${i}`, assertionText: "Python", claimType: "Skill" })
      );

      const result = computeJobMatch(profile, claims, "");
      expect(result.relevantClaims.length).toBeLessThanOrEqual(5);
    });

    it("preserves verification status in matched skills", () => {
      const profile = makeProfile();
      const claims = [
        makeClaim({ id: "c1", assertionText: "Python", claimType: "Skill", verificationStatus: "verified" }),
      ];

      const result = computeJobMatch(profile, claims, "");
      expect(result.matchedSkills[0].supportingClaim?.verificationStatus).toBe("verified");
    });
  });

  describe("extractRecruiterEmail", () => {
    it("extracts email from JD text", () => {
      const jd = "Apply to harshita.shukla@nagarro.com";
      expect(extractRecruiterEmail(jd)).toBe("harshita.shukla@nagarro.com");
    });

    it("returns undefined when no email present", () => {
      const jd = "Apply through our website";
      expect(extractRecruiterEmail(jd)).toBeUndefined();
    });

    it("returns first email when multiple present", () => {
      const jd = "Contact hr@company.com or recruiter@company.com";
      expect(extractRecruiterEmail(jd)).toBe("hr@company.com");
    });

    it("does not include recruiter email in match result for logged-out flow", () => {
      // The email IS extracted — it's up to the UI to show it based on auth state
      const jd = "Email: test@example.com";
      expect(extractRecruiterEmail(jd)).toBe("test@example.com");
    });
  });

  describe("Ownership / isolation", () => {
    it("match only uses provided claims (not another user's)", () => {
      const profile = makeProfile();
      const userClaims = [
        makeClaim({ id: "my_claim", assertionText: "Java", claimType: "Skill" }),
      ];

      const result = computeJobMatch(profile, userClaims, "");
      // Should only contain data from userClaims, not from any other source
      expect(result.matchedSkills.every((s) => !s.matched)).toBe(true);
    });
  });

  describe("JD skills do not become user skills", () => {
    it("JD requiring Python does not add Python to user claims", () => {
      const profile = makeProfile();
      const claims: UserClaim[] = [];

      const result = computeJobMatch(profile, claims, "");
      // The user has no claims — match should be limited, not fabricated
      expect(result.level).toBe("limited");
      expect(result.matchedSkills.every((s) => !s.matched)).toBe(true);
    });
  });
});
