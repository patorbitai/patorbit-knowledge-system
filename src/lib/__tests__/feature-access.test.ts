"use strict";

import { describe, it, expect } from "vitest";
import { getRestrictionMessage, isFeatureAvailable, restrictionTypeForFeature } from "../feature-access";
import type { PlanFeatures } from "@/services/entitlement.service";

const FREE_FEATURES: PlanFeatures = {
  maxResumes: 2,
  allTemplates: false,
  aiBasic: true,
  aiAdvanced: false,
  jobAnalysisBasic: true,
  jobAnalysisAdvanced: false,
  qualificationMatchBasic: true,
  qualificationMatchFull: false,
  careerProfileBasic: true,
  careerProfileFull: false,
  careerInsights: false,
  passport: false,
  evidence: false,
  knowledgeGraph: false,
  trustScore: false,
  careerTimeline: false,
  atsBasic: true,
  atsAdvanced: false,
  pdfExport: true,
  prioritySupport: false,
  organizationFeatures: false,
  apiAccess: false,
  sso: false,
  customIntegrations: false,
};

const PRO_FEATURES: PlanFeatures = {
  ...FREE_FEATURES,
  maxResumes: -1,
  allTemplates: true,
  aiAdvanced: true,
  jobAnalysisAdvanced: true,
  qualificationMatchFull: true,
  careerProfileFull: true,
  careerInsights: true,
  passport: true,
  evidence: true,
  knowledgeGraph: true,
  trustScore: true,
  careerTimeline: true,
  atsAdvanced: true,
  prioritySupport: true,
};

describe("Feature Access", () => {
  describe("getRestrictionMessage", () => {
    it("returns template restriction message", () => {
      const msg = getRestrictionMessage({ type: "template", featureName: "Executive Pro" });
      expect(msg.title).toBe("Pro Template");
      expect(msg.description).toContain("Executive Pro");
      expect(msg.actionLabel).toBe("Upgrade to Pro");
      expect(msg.actionHref).toBe("/pricing");
    });

    it("returns resume limit message", () => {
      const msg = getRestrictionMessage({ type: "resume-limit", detail: "2 of 2 resumes used" });
      expect(msg.title).toBe("Resume Limit Reached");
      expect(msg.description).toContain("2 of 2 resumes used");
    });

    it("returns AI feature message", () => {
      const msg = getRestrictionMessage({ type: "ai-feature", featureName: "Smart Tailor" });
      expect(msg.title).toBe("AI Feature Unavailable");
      expect(msg.description).toContain("Smart Tailor");
    });

    it("returns evidence message", () => {
      const msg = getRestrictionMessage({ type: "evidence" });
      expect(msg.title).toBe("Evidence Management");
      expect(msg.description).toContain("Pro");
    });

    it("returns trust message", () => {
      const msg = getRestrictionMessage({ type: "trust" });
      expect(msg.title).toBe("Trust Score");
    });

    it("returns passport message", () => {
      const msg = getRestrictionMessage({ type: "passport" });
      expect(msg.title).toBe("Professional Passport");
    });

    it("returns general message as fallback", () => {
      const msg = getRestrictionMessage({ type: "general", featureName: "Something" });
      expect(msg.title).toBe("Premium Feature");
      expect(msg.description).toContain("Something");
    });
  });

  describe("isFeatureAvailable", () => {
    it("returns true for unlimited numeric feature", () => {
      expect(isFeatureAvailable(PRO_FEATURES, "maxResumes")).toBe(true);
    });

    it("returns true for limited numeric feature", () => {
      expect(isFeatureAvailable(FREE_FEATURES, "maxResumes")).toBe(true);
    });

    it("returns false for disabled boolean feature", () => {
      expect(isFeatureAvailable(FREE_FEATURES, "allTemplates")).toBe(false);
    });

    it("returns true for enabled boolean feature", () => {
      expect(isFeatureAvailable(PRO_FEATURES, "allTemplates")).toBe(true);
    });

    it("returns true for basic AI on free plan", () => {
      expect(isFeatureAvailable(FREE_FEATURES, "aiBasic")).toBe(true);
    });

    it("returns false for advanced AI on free plan", () => {
      expect(isFeatureAvailable(FREE_FEATURES, "aiAdvanced")).toBe(false);
    });
  });

  describe("restrictionTypeForFeature", () => {
    it("maps allTemplates to template", () => {
      expect(restrictionTypeForFeature("allTemplates")).toBe("template");
    });

    it("maps aiAdvanced to ai-feature", () => {
      expect(restrictionTypeForFeature("aiAdvanced")).toBe("ai-feature");
    });

    it("maps evidence to evidence", () => {
      expect(restrictionTypeForFeature("evidence")).toBe("evidence");
    });

    it("maps trustScore to trust", () => {
      expect(restrictionTypeForFeature("trustScore")).toBe("trust");
    });

    it("maps passport to passport", () => {
      expect(restrictionTypeForFeature("passport")).toBe("passport");
    });

    it("returns general for unknown features", () => {
      expect(restrictionTypeForFeature("pdfExport")).toBe("export");
    });
  });
});
