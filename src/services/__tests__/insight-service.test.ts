"use strict";

import { describe, it, expect, beforeEach } from "vitest";
import { GraphService } from "../graph-service";
import { InsightService } from "../insight-service";
import { resumeToGraph } from "../graph-mapper";
import { createMinimalResume, createEmptyResume, createLargeResume } from "./fixtures";

/**
 * Seed a GraphService from a resume fixture.
 */
function seeded(gs: GraphService, resume: ReturnType<typeof createMinimalResume>): GraphService {
  gs.setGraph(resumeToGraph(resume));
  return gs;
}

describe("InsightService", () => {
  let service: InsightService;
  let gs: GraphService;

  beforeEach(() => {
    gs = new GraphService();
    seeded(gs, createMinimalResume());
    service = new InsightService(gs);
  });

  // ═══════════════════════════════════════════════════
  // 1. getATSInsights()
  // ═══════════════════════════════════════════════════

  describe("getATSInsights", () => {
    it("returns a valid shape on a full resume", () => {
      const r = service.getATSInsights();
      expect(typeof r.score).toBe("number");
      expect(typeof r.keywordDensity).toBe("number");
      expect(Array.isArray(r.sectionCoverage)).toBe(true);
      expect(Array.isArray(r.missingKeywords)).toBe(true);
      expect(typeof r.formatScore).toBe("number");
      expect(Array.isArray(r.recommendations)).toBe(true);
      expect(r.sectionCoverage).toHaveLength(6);
    });

    it("reports all sections present for a full resume", () => {
      const r = service.getATSInsights();
      const present = r.sectionCoverage.filter((s) => s.present).map((s) => s.section);
      expect(present).toContain("Summary");
      expect(present).toContain("Experience");
      expect(present).toContain("Education");
      expect(present).toContain("Skills");
      expect(present).toContain("Projects");
      expect(present).toContain("Certifications");
    });

    it("empty graph → score 0, no sections present", () => {
      const empty = new InsightService(new GraphService());
      const r = empty.getATSInsights();
      expect(r.sectionCoverage.every((s) => !s.present)).toBe(true);
      expect(r.score).toBe(0);
      expect(r.recommendations.length).toBeGreaterThan(0);
    });

    it("score is capped at 100", () => {
      const bigGs = new GraphService();
      seeded(bigGs, createLargeResume(20, 50, 10));
      const big = new InsightService(bigGs);
      expect(big.getATSInsights().score).toBeLessThanOrEqual(100);
    });

    it("missing current role produces a recommendation", () => {
      // Minimal resume has no current role (current: false)
      const r = service.getATSInsights();
      expect(r.recommendations).toContain("Mark your current role");
    });
  });

  // ═══════════════════════════════════════════════════
  // 2. getSkillInsights()
  // ═══════════════════════════════════════════════════

  describe("getSkillInsights", () => {
    it("returns a valid shape", () => {
      const r = service.getSkillInsights();
      expect(r.total).toBeGreaterThanOrEqual(1);
      expect(typeof r.byCategory).toBe("object");
      expect(typeof r.byProficiency).toBe("object");
      expect(Array.isArray(r.mostUsed)).toBe(true);
      expect(Array.isArray(r.unusedSkills)).toBe(true);
      expect(Array.isArray(r.duplicateSkills)).toBe(true);
      expect(Array.isArray(r.gaps)).toBe(true);
    });

    it("empty graph → total 0, no gaps flagged as present", () => {
      const empty = new InsightService(new GraphService());
      const r = empty.getSkillInsights();
      expect(r.total).toBe(0);
      expect(Object.keys(r.byCategory)).toHaveLength(0);
      expect(r.unusedSkills).toHaveLength(0);
      expect(r.gaps.length).toBeGreaterThan(0); // all common gaps missing
    });

    it("groups by category", () => {
      const r = service.getSkillInsights();
      const langCount = r.byCategory["Programming Languages"] ?? 0;
      expect(langCount).toBeGreaterThanOrEqual(2); // JavaScript, TypeScript
    });

    it("groups by proficiency", () => {
      const r = service.getSkillInsights();
      const advanced = r.byProficiency["Advanced"] ?? 0;
      expect(advanced).toBeGreaterThanOrEqual(2); // JavaScript, React
    });

    it("detects duplicate skills with fuzzy matching", () => {
      const dupGs = new GraphService();
      seeded(dupGs, createMinimalResume());
      // The mapper dedupes resume input, but duplicates can enter from other
      // sources (linkedin-import, resume-parse, direct graph mutation).
      // Add a duplicate "TypeScript" node directly to the graph.
      const profile = dupGs.getProfile();
      dupGs.addNode({
        id: "skill-dup",
        type: "skill",
        label: "TypeScript",
        lastUpdated: new Date().toISOString(),
        source: "linkedin-import",
        proficiency: "Expert",
        category: "Lang",
      });
      dupGs.addEdge(profile.id, "skill-dup", "HAS_SKILL");
      const r = new InsightService(dupGs).getSkillInsights();
      expect(r.duplicateSkills.length).toBeGreaterThanOrEqual(1);
      const dup = r.duplicateSkills.find((d) => d.duplicates.includes("TypeScript"));
      expect(dup).toBeDefined();
    });

    it("handles a large graph quickly", () => {
      const bigGs = new GraphService();
      seeded(bigGs, createLargeResume());
      const start = performance.now();
      const r = new InsightService(bigGs).getSkillInsights();
      const elapsed = performance.now() - start;
      expect(r.total).toBe(createLargeResume().skills.length);
      expect(elapsed).toBeLessThan(1000);
    });
  });

  // ═══════════════════════════════════════════════════
  // 3. getCareerInsights()
  // ═══════════════════════════════════════════════════

  describe("getCareerInsights", () => {
    it("returns the profile career stage", () => {
      const r = service.getCareerInsights();
      expect(r.careerStage).toBe("working-professional");
    });

    it("empty graph → no missing critical sections", () => {
      const empty = new InsightService(new GraphService());
      const r = empty.getCareerInsights();
      expect(r.roleProgression).toHaveLength(0);
      expect(r.missingCriticalSections).toContain("Experience");
      expect(r.missingCriticalSections).toContain("Education");
      expect(r.missingCriticalSections).toContain("Skills");
      expect(r.missingCriticalSections).toContain("Professional Summary");
    });

    it("sorts role progression newest first", () => {
      const multiGs = new GraphService();
      const resume = createMinimalResume();
      resume.experience.push({
        id: "exp-2", company: "Old Co", position: "Junior Dev", location: "", employmentType: "Full-time",
        industry: "", startDate: "2015-01-01", endDate: "2018-12-31", current: false, duration: "",
        description: "", achievements: "", techUsed: "", bulletPoints: [],
      });
      seeded(multiGs, resume);
      const r = new InsightService(multiGs).getCareerInsights();
      expect(r.roleProgression[0]).toBe("Senior Developer"); // newest first
      expect(r.roleProgression[1]).toBe("Junior Dev");
    });

    it("reports industry summary from organizations", () => {
      const r = service.getCareerInsights();
      expect(r.industrySummary).toContain("Technology");
    });
  });

  // ═══════════════════════════════════════════════════
  // 4. getLearningRecommendations()
  // ═══════════════════════════════════════════════════

  describe("getLearningRecommendations", () => {
    it("returns recommendations for a working professional", () => {
      const r = service.getLearningRecommendations();
      expect(r.length).toBeGreaterThan(0);
      const skills = r.map((rec) => rec.skill);
      // The profile has skills, so gaps (Git, Agile, etc.) should appear as recommendations
      expect(skills.some((s) => s === "Git" || s === "Agile")).toBe(true);
    });

    it("does not recommend skills already in the profile", () => {
      const r = service.getLearningRecommendations();
      expect(r.some((rec) => rec.skill === "TypeScript")).toBe(false);
    });

    it("empty graph → gaps all recommended", () => {
      const empty = new InsightService(new GraphService());
      const r = empty.getLearningRecommendations();
      // working-professional stage recs + all gaps
      expect(r.length).toBeGreaterThan(0);
    });
  });

  // ═══════════════════════════════════════════════════
  // 5. getResumeCompleteness()
  // ═══════════════════════════════════════════════════

  describe("getResumeCompleteness", () => {
    it("returns overall percentage and section scores", () => {
      const r = service.getResumeCompleteness();
      expect(r.overall).toBeGreaterThan(0);
      expect(r.overall).toBeLessThanOrEqual(100);
      expect(r.sections.length).toBeGreaterThan(0);
    });

    it("empty resume → overall 0", () => {
      const emptyGs = new GraphService();
      seeded(emptyGs, createEmptyResume());
      const r = new InsightService(emptyGs).getResumeCompleteness();
      expect(r.overall).toBe(0);
    });

    it("full resume → high overall score", () => {
      const r = service.getResumeCompleteness();
      expect(r.overall).toBeGreaterThan(50);
    });

    it("reports missing personal fields", () => {
      const partialGs = new GraphService();
      const resume = createMinimalResume();
      resume.phone = "";
      seeded(partialGs, resume);
      const r = new InsightService(partialGs).getResumeCompleteness();
      const personal = r.sections.find((s) => s.id === "personal")!;
      expect(personal.missing).toContain("Phone");
    });
  });

  // ═══════════════════════════════════════════════════
  // 6. Cross-cutting: empty graph behavior
  // ═══════════════════════════════════════════════════

  describe("empty graph behavior (all methods)", () => {
    it("does not throw for any method", () => {
      const empty = new InsightService(new GraphService());
      expect(() => empty.getATSInsights()).not.toThrow();
      expect(() => empty.getSkillInsights()).not.toThrow();
      expect(() => empty.getCareerInsights()).not.toThrow();
      expect(() => empty.getLearningRecommendations()).not.toThrow();
      expect(() => empty.getResumeCompleteness()).not.toThrow();
    });
  });
});