"use strict";

import { describe, it, expect } from "vitest";
import {
  splitLines,
  splitBullets,
  classifyLine,
  isRequirementLine,
  isResponsibilityLine,
  isQualificationLine,
  extractTitle,
  extractSkills,
  extractSeniority,
  extractDomain,
  extractImplicitCompetencies,
} from "../extract";

describe("splitLines / splitBullets", () => {
  it("splits into cleaned, non-empty lines", () => {
    expect(splitLines("  Senior Engineer  \n\n\n- Build things")).toEqual([
      "Senior Engineer",
      "- Build things",
    ]);
  });

  it("splits bullets and strips bullet markers", () => {
    const bullets = splitBullets("- TypeScript\n• Python\n3. Go");
    expect(bullets).toContain("TypeScript");
    expect(bullets).toContain("Python");
    expect(bullets).toContain("Go");
  });
});

describe("classifyLine", () => {
  it("classifies requirement statements", () => {
    expect(classifyLine("You must have 5+ years of experience")).toBe("requirement");
    expect(isRequirementLine("Required: strong communication skills")).toBe(true);
  });

  it("classifies responsibility bullets starting with action verbs", () => {
    expect(classifyLine("Build and maintain the core platform")).toBe("responsibility");
    expect(isResponsibilityLine("Design scalable APIs")).toBe(true);
  });

  it("classifies qualification statements", () => {
    expect(classifyLine("Bachelor's degree in Computer Science or equivalent")).toBe("qualification");
    expect(isQualificationLine("5+ years of experience required")).toBe(true);
  });

  it("returns other for prose", () => {
    expect(classifyLine("We are a fast growing startup")).toBe("other");
  });
});

describe("extractTitle", () => {
  it("detects a title heading", () => {
    expect(extractTitle(["Senior Software Engineer", "We build things"])).toBe(
      "Senior Software Engineer",
    );
  });

  it("ignores full sentences with periods", () => {
    const lines = ["We are looking for a great engineer.", "Apply today."];
    expect(extractTitle(lines)).toBeUndefined();
  });
});

describe("extractSkills", () => {
  it("extracts from a dedicated skills section", () => {
    const lines = ["Skills:", "TypeScript, React, Node.js", "What you'll do: build stuff"];
    const skills = extractSkills(lines).map((s) => s.name);
    expect(skills).toContain("TypeScript");
    expect(skills).toContain("React");
    expect(skills).toContain("Node.js");
    expect(skills).not.toContain("build stuff");
  });

  it("extracts from an inline Skills: list", () => {
    const lines = ["Skills: Python, Docker, AWS"];
    const skills = extractSkills(lines).map((s) => s.name);
    expect(skills).toEqual(["Python", "Docker", "AWS"]);
  });

  it("dedupes skills", () => {
    const skills = extractSkills(["Skills:", "Python", "Python, Go"]).map((s) => s.name);
    expect(skills.filter((s) => s === "Python")).toHaveLength(1);
  });
});

describe("extractSeniority", () => {
  it("detects level and years", () => {
    const out = extractSeniority(["Senior Software Engineer with 5+ years of experience"]);
    expect(out[0].level).toBe("Senior");
    expect(out[0].years).toBe("5+");
  });

  it("returns empty when no seniority signal", () => {
    expect(extractSeniority(["We build great software"])).toEqual([]);
  });
});

describe("extractDomain", () => {
  it("detects lexicon domains", () => {
    const out = extractDomain(["Join our fintech team building payments"]);
    expect(out.map((d) => d.name)).toContain("FinTech");
  });

  it("returns empty for unrelated text", () => {
    expect(extractDomain(["Build furniture by hand"])).toEqual([]);
  });
});

describe("extractImplicitCompetencies", () => {
  it("derives competencies from contextual phrases with exact context", () => {
    const out = extractImplicitCompetencies([
      "Work with cross-functional teams to ship features",
      "Hit tight deadlines in a fast-paced environment",
    ]);
    expect(out.map((c) => c.name)).toContain("Collaboration");
    expect(out.map((c) => c.name)).toContain("Time Management");
    expect(out[0].context).toContain("cross-functional teams");
  });

  it("returns empty when no competency phrases present", () => {
    expect(extractImplicitCompetencies(["We provide good coffee"])).toEqual([]);
  });
});
