/**
 * Test for templateId validation in setResume function
 * 
 * This test verifies that setResume properly validates templateId
 * and falls back to the current template if the imported template is invalid.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useResumeBuilder, defaultResume } from "../resume-builder";
import type { Resume } from "@/types/resume";

describe("Template ID Validation", () => {
  beforeEach(() => {
    // Reset store to initial state
    useResumeBuilder.setState({
      resumes: [{ ...defaultResume, resumeId: "initial", resumeName: "Initial Resume", templateId: "modern-clean" }],
      activeResumeId: "initial",
      resume: { ...defaultResume, resumeId: "initial", resumeName: "Initial Resume", templateId: "modern-clean" },
      styleConfigs: {},
    });
  });

  it("preserves valid templateId from import", () => {
    const state = useResumeBuilder.getState();
    
    const importedResume: Resume = {
      ...defaultResume,
      resumeId: "initial", // Same ID
      name: "Imported User",
      templateId: "executive-pro", // Valid template
    };

    state.setResume(importedResume);

    expect(useResumeBuilder.getState().resume.templateId).toBe("executive-pro");
  });

  it("rejects invalid templateId and preserves current", () => {
    const state = useResumeBuilder.getState();
    
    const importedResume: Resume = {
      ...defaultResume,
      resumeId: "initial", // Same ID
      name: "Imported User",
      templateId: "template-1", // Invalid template
    };

    state.setResume(importedResume);

    // Should preserve current templateId (modern-clean) because "template-1" is invalid
    expect(useResumeBuilder.getState().resume.templateId).toBe("modern-clean");
  });

  it("handles corrupted templateId gracefully", () => {
    const state = useResumeBuilder.getState();
    
    const corruptedResume: Resume = {
      ...defaultResume,
      resumeId: "initial",
      name: "Corrupted User",
      templateId: "", // Empty string
    };

    state.setResume(corruptedResume);

    expect(useResumeBuilder.getState().resume.templateId).toBe("modern-clean");
  });

  it("handles undefined templateId gracefully", () => {
    const state = useResumeBuilder.getState();
    
    const undefinedResume: Resume = {
      ...defaultResume,
      resumeId: "initial",
      name: "Undefined User",
      templateId: undefined as any, // undefined
    };

    state.setResume(undefinedResume);

    expect(useResumeBuilder.getState().resume.templateId).toBe("modern-clean");
  });

  it("preserves resume content when templateId is invalid", () => {
    const state = useResumeBuilder.getState();
    
    const importedResume: Resume = {
      ...defaultResume,
      resumeId: "initial",
      name: "Imported User",
      email: "imported@test.com",
      templateId: "invalid-template",
    };

    state.setResume(importedResume);

    // Content should be preserved even though templateId is invalid
    expect(useResumeBuilder.getState().resume.name).toBe("Imported User");
    expect(useResumeBuilder.getState().resume.email).toBe("imported@test.com");
    expect(useResumeBuilder.getState().resume.templateId).toBe("modern-clean"); // Preserved
  });

  it("allows changing to valid template", () => {
    const state = useResumeBuilder.getState();
    
    const newTemplateResume: Resume = {
      ...defaultResume,
      resumeId: "initial",
      name: "User",
      templateId: "executive-pro", // Valid template
    };

    state.setResume(newTemplateResume);

    expect(useResumeBuilder.getState().resume.templateId).toBe("executive-pro");
  });
});
