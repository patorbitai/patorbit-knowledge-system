"use strict";

import { describe, it, expect, beforeEach } from "vitest";
import { useResumeBuilder, defaultResume } from "../resume-builder";
import { DEFAULT_STYLE_CONFIG } from "@/lib/resume-design-system/style-config";

describe("Resume Style Config Store (Phase 1)", () => {
  beforeEach(() => {
    useResumeBuilder.setState({
      resumes: [{ ...defaultResume, resumeId: "r1", resumeName: "My Resume" }],
      activeResumeId: "r1",
      resume: { ...defaultResume, resumeId: "r1", resumeName: "My Resume" },
      styleConfigs: {},
    });
  });

  it("stores a style config per resume without touching resume content", () => {
    useResumeBuilder.getState().setStyleConfig("r1", { fontFamily: "playfair" });
    const cfg = useResumeBuilder.getState().styleConfigs["r1"];
    expect(cfg).toBeDefined();
    expect(cfg?.fontFamily).toBe("playfair");
    // Resume content is untouched — style settings live separately.
    const resume = useResumeBuilder.getState().resume;
    expect(resume.name).toBe("");
    expect(resume.experience).toEqual([]);
    expect(resume.templateId).toBe("modern-clean");
  });

  it("merges patches onto the previous config", () => {
    const s = useResumeBuilder.getState();
    s.setStyleConfig("r1", { fontFamily: "playfair", lineHeight: 1.8 });
    s.setStyleConfig("r1", { accentColor: "#7c3aed" });
    const cfg = useResumeBuilder.getState().styleConfigs["r1"];
    expect(cfg?.fontFamily).toBe("playfair");
    expect(cfg?.lineHeight).toBe(1.8);
    expect(cfg?.accentColor).toBe("#7c3aed");
    expect(cfg?.headingColor).toBe(DEFAULT_STYLE_CONFIG.headingColor);
  });

  it("isolates style configs between resumes", () => {
    useResumeBuilder.getState().setStyleConfig("r1", { fontFamily: "playfair" });
    const r2 = useResumeBuilder.getState().createResume("Second");
    expect(useResumeBuilder.getState().styleConfigs[r2]).toBeUndefined();
    expect(useResumeBuilder.getState().styleConfigs["r1"]?.fontFamily).toBe("playfair");
  });

  it("resetStyleConfig removes the per-resume override (back to defaults)", () => {
    useResumeBuilder.getState().setStyleConfig("r1", { fontFamily: "playfair" });
    useResumeBuilder.getState().resetStyleConfig("r1");
    expect(useResumeBuilder.getState().styleConfigs["r1"]).toBeUndefined();
  });

  it("clamps unsafe values at the store boundary", () => {
    useResumeBuilder.getState().setStyleConfig("r1", { fontScale: 4, pageMargin: 1 });
    const cfg = useResumeBuilder.getState().styleConfigs["r1"];
    expect(cfg?.fontScale).toBe(1.1);
    expect(cfg?.pageMargin).toBe(24);
  });
});
