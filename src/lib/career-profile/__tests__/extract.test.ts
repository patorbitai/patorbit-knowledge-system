"use strict";

import { describe, it, expect } from "vitest";
import {
  extractIndustries,
  extractLeadershipFromText,
  extractOutcomesFromText,
  splitTechnologies,
  clean,
  profileItemId,
} from "../extract";

describe("extract industries", () => {
  it("collects explicit non-empty industry values with their source refs", () => {
    const out = extractIndustries([
      { id: "a", industry: "Technology" },
      { id: "b", industry: "  FinTech " },
      { id: "c", industry: "" },
      { id: "d", industry: null },
    ]);
    expect(out).toEqual([
      { name: "Technology", sourceRef: "a" },
      { name: "FinTech", sourceRef: "b" },
    ]);
  });

  it("returns nothing when no industry is stated (never invents)", () => {
    expect(extractIndustries([{ id: "a", industry: "" }])).toEqual([]);
    expect(extractIndustries([])).toEqual([]);
  });
});

describe("extract leadership", () => {
  it("detects leadership verbs and preserves the exact source line", () => {
    const out = extractLeadershipFromText(
      "Led engineering team of 12 to ship the platform.\nWrote documentation.",
    );
    expect(out).toHaveLength(1);
    expect(out[0].context).toBe("Led engineering team of 12 to ship the platform.");
  });

  it("captures the verb object and team size when present", () => {
    const out = extractLeadershipFromText("Managed a team of 8 engineers.");
    expect(out[0].role).toBe("a team of 8 engineers");
    expect(out[0].teamSize).toBe("8");
  });

  it("does not fabricate leadership from non-leadership text", () => {
    expect(extractLeadershipFromText("Wrote documentation.\nFixed bugs.")).toEqual([]);
    expect(extractLeadershipFromText("")).toEqual([]);
  });
});

describe("extract outcomes", () => {
  it("extracts percentage metrics verbatim", () => {
    const out = extractOutcomesFromText("Reduced load time by 40%.");
    expect(out[0]).toEqual({ description: "Reduced load time by 40%.", metric: "40", unit: "%" });
  });

  it("extracts currency metrics verbatim", () => {
    const out = extractOutcomesFromText("Generated $1.2M in revenue.");
    expect(out[0].metric).toBe("1.2");
    expect(out[0].unit).toBe("$M");
  });

  it("extracts countable metrics with their noun unit", () => {
    const out = extractOutcomesFromText("Served 5000 customers.");
    expect(out[0]).toEqual({ description: "Served 5000 customers.", metric: "5000", unit: "customers" });
  });

  it("skips lines without any measurable metric", () => {
    expect(extractOutcomesFromText("Improved the architecture and reliability.")).toEqual([]);
    expect(extractOutcomesFromText("")).toEqual([]);
  });
});

describe("splitTechnologies", () => {
  it("splits comma-separated technology lists", () => {
    expect(splitTechnologies("React, TypeScript, Node.js")).toEqual(["React", "TypeScript", "Node.js"]);
  });

  it("handles empty / missing input", () => {
    expect(splitTechnologies("")).toEqual([]);
    expect(splitTechnologies(null)).toEqual([]);
    expect(splitTechnologies(undefined)).toEqual([]);
  });
});

describe("clean", () => {
  it("collapses internal whitespace and trims", () => {
    expect(clean("  Hello   world  ")).toBe("Hello world");
  });
  it("handles empty / missing input", () => {
    expect(clean("")).toBe("");
    expect(clean(undefined)).toBe("");
  });
});

describe("profileItemId", () => {
  it("preserves store ids (id_..._xxx) verbatim inside the prefixed id", () => {
    expect(profileItemId("exp", "id_1720000000000_abcde")).toBe("cp_exp_id_1720000000000_abcde");
  });

  it("handles numeric import ids", () => {
    expect(profileItemId("exp", "1")).toBe("cp_exp_1");
  });

  it("sanitizes characters that are not alphanumeric, dash or underscore", () => {
    expect(profileItemId("exp", "exp 1!")).toBe("cp_exp_exp_1_");
  });
});
