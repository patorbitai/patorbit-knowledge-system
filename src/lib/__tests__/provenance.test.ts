import { describe, it, expect } from "vitest";
import { classifySupport, confidenceTone, confidenceWord, getSupportBadge } from "@/lib/provenance";

describe("confidenceWord (§5 — 0.87 → High)", () => {
  it("maps scores to user words", () => {
    expect(confidenceWord(0.87)).toBe("High");
    expect(confidenceWord(0.7)).toBe("High");
    expect(confidenceWord(0.69)).toBe("Medium");
    expect(confidenceWord(0.4)).toBe("Medium");
    expect(confidenceWord(0.39)).toBe("Low");
    expect(confidenceWord(0)).toBe("Low");
  });

  it("keeps tone aligned with the word", () => {
    expect(confidenceTone(0.9)).toBe("high");
    expect(confidenceTone(0.5)).toBe("medium");
    expect(confidenceTone(0.1)).toBe("low");
  });
});

describe("classifySupport (§8 — never present inferred as fact)", () => {
  it("user-input wins: labelled as entered by the user", () => {
    const badge = classifySupport({ hasEvidence: true, sourceType: "user-input" });
    expect(badge.level).toBe("user-provided");
    expect(badge.label).toBe("You entered this");
  });

  it("resume-sourced facts are Supported", () => {
    expect(classifySupport({ hasEvidence: true, sourceType: "resume-import" }).level).toBe("supported");
    expect(classifySupport({ hasEvidence: true }).level).toBe("supported");
  });

  it("derived facts are Inferred, never Supported", () => {
    const badge = classifySupport({ hasEvidence: true, derived: true, sourceType: "ai-extraction" });
    expect(badge.level).toBe("inferred");
    expect(badge.description).toMatch(/not stated verbatim/i);
  });

  it("no evidence ⇒ Missing with an explicit refusal to assert", () => {
    const badge = classifySupport({ hasEvidence: false });
    expect(badge.level).toBe("missing");
    expect(badge.description).toMatch(/will not present it as fact/i);
  });

  it("every badge carries a label and an explanation", () => {
    for (const level of ["user-provided", "supported", "inferred", "missing"] as const) {
      const badge = getSupportBadge(level);
      expect(badge.label.length).toBeGreaterThan(0);
      expect(badge.description.length).toBeGreaterThan(20);
      expect(badge.chipClass.length).toBeGreaterThan(0);
    }
  });
});
