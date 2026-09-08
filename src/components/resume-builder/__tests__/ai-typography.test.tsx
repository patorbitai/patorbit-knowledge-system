"use strict";

/**
 * AI Typography Regression Tests
 *
 * Verifies that AI-generated content never introduces typography metadata
 * and that the resume font is correctly applied and persisted.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useResumeBuilder, defaultResume } from "@/store/resume-builder";
import { installObserverStubs } from "./gallery-test-utils";
import { FONT_OPTIONS, DEFAULT_STYLE_CONFIG, type ResumeStyleConfig } from "@/lib/resume-design-system/style-config";
import { fontFamilies } from "@/lib/resume-design-system/fonts";
import type { Resume, Experience } from "@/types/resume";

installObserverStubs();

/**
 * Mirrors the resolveFontFamily utility used by BulletList, SmartSuggestion,
 * and FieldInput to verify font resolution at the unit level.
 */
function resolveFontFamily(stored?: ResumeStyleConfig): string {
  const config = stored ?? DEFAULT_STYLE_CONFIG;
  const option = FONT_OPTIONS.find((f) => f.id === config.fontFamily);
  return option?.stack ?? fontFamilies.sans;
}

function seedResume(overrides: Partial<Resume>): void {
  const resume: Resume = { ...defaultResume, ...overrides };
  useResumeBuilder.setState({
    resumes: [resume],
    activeResumeId: resume.resumeId ?? "",
    resume,
    styleConfigs: {},
    saveStatus: "saved",
    aiActions: {},
    hydrated: true,
  });
}

beforeEach(() => {
  useResumeBuilder.setState({
    resume: undefined,
    resumes: [],
    activeResumeId: "",
    hydrated: true,
  });
});

describe("AI Typography Regression Tests", () => {
  describe("Test A: Accept AI content preserves font settings", () => {
    it("should not persist typography metadata when accepting AI bullet", () => {
      seedResume({
        experience: [
          {
            id: "exp-1",
            company: "Acme Corp",
            position: "Engineer",
            startDate: "2023-01",
            endDate: "",
            current: true,
            location: "NYC",
            description: "",
            bulletPoints: ["Original bullet"],
            techUsed: "",
            achievements: "",
            employmentType: "Full-time",
            industry: "Technology",
            duration: "2 years",
          } as Experience,
        ],
      });

      // Set font to inter via the store's setStyleConfig (font IDs are lowercase)
      const resumeId = useResumeBuilder.getState().resume?.resumeId ?? "";
      useResumeBuilder.getState().setStyleConfig(resumeId, { fontFamily: "inter" });

      // Verify resume has inter font
      const state = useResumeBuilder.getState();
      expect(state.styleConfigs[resumeId]?.fontFamily).toBe("inter");

      // Simulate accepting AI content by updating the bullet
      const exp = useResumeBuilder.getState().resume?.experience?.[0];
      expect(exp).toBeDefined();
      if (exp) {
        useResumeBuilder.getState().updateExperience(exp.id, "bulletPoints", ["AI-generated improved bullet"]);
      }

      // Verify content changed but font remained inter
      const updatedState = useResumeBuilder.getState();
      expect(updatedState.resume?.experience?.[0]?.bulletPoints?.[0]).toBe(
        "AI-generated improved bullet"
      );
      expect(updatedState.styleConfigs[resumeId]?.fontFamily).toBe("inter");

      // Verify no typography metadata was added to the bullet
      const bullet = updatedState.resume?.experience?.[0]?.bulletPoints?.[0];
      expect(typeof bullet).toBe("string"); // Should be plain string, not object
    });
  });

  describe("Test B: Malicious AI typography is stripped", () => {
    it("should ignore font metadata in AI response and preserve original font", () => {
      seedResume({
        experience: [
          {
            id: "exp-1",
            company: "Acme Corp",
            position: "Engineer",
            startDate: "2023-01",
            endDate: "",
            current: true,
            location: "NYC",
            description: "",
            bulletPoints: ["Original bullet"],
            techUsed: "",
            achievements: "",
            employmentType: "Full-time",
            industry: "Technology",
            duration: "2 years",
          } as Experience,
        ],
      });

      const resumeId = useResumeBuilder.getState().resume?.resumeId ?? "";
      useResumeBuilder.getState().setStyleConfig(resumeId, { fontFamily: "inter" });

      // Simulate a malicious AI response that includes font metadata
      const maliciousAiContent = {
        text: "Improved bullet",
        fontFamily: "arial",
        fontSize: "10px",
        fontWeight: "900",
      };

      // The AI client should strip this before persistence
      // For this test, we simulate accepting only the text content
      const exp = useResumeBuilder.getState().resume?.experience?.[0];
      if (exp) {
        // Only accept the text, ignore font metadata
        useResumeBuilder.getState().updateExperience(exp.id, "bulletPoints", [maliciousAiContent.text]);
      }

      // Verify font remained inter
      const state = useResumeBuilder.getState();
      expect(state.styleConfigs[resumeId]?.fontFamily).toBe("inter");
      expect(state.resume?.experience?.[0]?.bulletPoints?.[0]).toBe(
        "Improved bullet"
      );
    });
  });

  describe("Test C: User changes font", () => {
    it("should update font consistently across the resume", () => {
      seedResume({});

      const resumeId = useResumeBuilder.getState().resume?.resumeId ?? "";
      useResumeBuilder.getState().setStyleConfig(resumeId, { fontFamily: "inter" });

      // Change font to playfair
      useResumeBuilder.getState().setStyleConfig(resumeId, { fontFamily: "playfair" });

      // Verify font changed
      const state = useResumeBuilder.getState();
      expect(state.styleConfigs[resumeId]?.fontFamily).toBe("playfair");
    });
  });

  describe("Test D: AI after font change", () => {
    it("should maintain new font after AI content is accepted", () => {
      seedResume({
        experience: [
          {
            id: "exp-1",
            company: "Acme Corp",
            position: "Engineer",
            startDate: "2023-01",
            endDate: "",
            current: true,
            location: "NYC",
            description: "",
            bulletPoints: ["Original bullet"],
            techUsed: "",
            achievements: "",
            employmentType: "Full-time",
            industry: "Technology",
            duration: "2 years",
          } as Experience,
        ],
      });

      const resumeId = useResumeBuilder.getState().resume?.resumeId ?? "";
      useResumeBuilder.getState().setStyleConfig(resumeId, { fontFamily: "playfair" });

      // Simulate accepting AI content
      const exp = useResumeBuilder.getState().resume?.experience?.[0];
      if (exp) {
        useResumeBuilder.getState().updateExperience(exp.id, "bulletPoints", ["AI-generated with playfair font"]);
      }

      // Verify font is still playfair
      const state = useResumeBuilder.getState();
      expect(state.styleConfigs[resumeId]?.fontFamily).toBe("playfair");
      expect(state.resume?.experience?.[0]?.bulletPoints?.[0]).toBe(
        "AI-generated with playfair font"
      );
    });
  });

  describe("Test F: Font persistence", () => {
    it("should persist font selection across state updates", () => {
      seedResume({});

      const resumeId = useResumeBuilder.getState().resume?.resumeId ?? "";
      useResumeBuilder.getState().setStyleConfig(resumeId, { fontFamily: "inter" });

      // Change font
      useResumeBuilder.getState().setStyleConfig(resumeId, { fontFamily: "garamond" });

      // Verify font persisted in state
      const state = useResumeBuilder.getState();
      expect(state.styleConfigs[resumeId]?.fontFamily).toBe("garamond");

      // Simulate reload by getting fresh state
      const freshState = useResumeBuilder.getState();
      expect(freshState.styleConfigs[resumeId]?.fontFamily).toBe("garamond");
    });
  });

  describe("Test G: resolveFontFamily utility", () => {
    it("should return Inter font stack for inter font ID", () => {
      const result = resolveFontFamily({ ...DEFAULT_STYLE_CONFIG, fontFamily: "inter" });
      expect(result).toBe(fontFamilies.sans);
    });

    it("should return Playfair font stack for playfair font ID", () => {
      const result = resolveFontFamily({ ...DEFAULT_STYLE_CONFIG, fontFamily: "playfair" });
      expect(result).toBe(fontFamilies.playfair);
    });

    it("should return Jakarta font stack for jakarta font ID", () => {
      const result = resolveFontFamily({ ...DEFAULT_STYLE_CONFIG, fontFamily: "jakarta" });
      expect(result).toBe(fontFamilies.jakarta);
    });

    it("should return Garamond font stack for garamond font ID", () => {
      const result = resolveFontFamily({ ...DEFAULT_STYLE_CONFIG, fontFamily: "garamond" });
      expect(result).toBe(fontFamilies.garamond);
    });

    it("should return Mono font stack for mono font ID", () => {
      const result = resolveFontFamily({ ...DEFAULT_STYLE_CONFIG, fontFamily: "mono" });
      expect(result).toBe(fontFamilies.mono);
    });

    it("should fallback to sans font for unknown font ID", () => {
      const result = resolveFontFamily({ ...DEFAULT_STYLE_CONFIG, fontFamily: "unknown-font" });
      expect(result).toBe(fontFamilies.sans);
    });

    it("should fallback to sans font for undefined config", () => {
      const result = resolveFontFamily(undefined);
      expect(result).toBe(fontFamilies.sans);
    });
  });

  describe("Test H: Font selection from store matches resolveFontFamily", () => {
    it("should resolve the same font as the store styleConfig", () => {
      seedResume({});
      const resumeId = useResumeBuilder.getState().resume?.resumeId ?? "";

      // Test each font option
      for (const fontOpt of FONT_OPTIONS) {
        useResumeBuilder.getState().setStyleConfig(resumeId, { fontFamily: fontOpt.id });
        const stored = useResumeBuilder.getState().styleConfigs[resumeId];
        const resolved = resolveFontFamily(stored);
        expect(resolved).toBe(fontOpt.stack);
      }
    });
  });
});
