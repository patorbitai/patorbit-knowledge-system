"use strict";

import { describe, it, expect } from "vitest";
import {
  validateJourney,
  validateChapter,
  validateStatement,
  validateProvenance,
  DEFAULT_JOURNEY_CONFIG,
} from "@/lib/careerjourney/validation";
import { makeJourney, makeChapter, makeStatement, makeProvenance, makeClaim, makeEvidence } from "./fixtures";

describe("validateStatement", () => {
  it("accepts a valid statement", () => {
    const result = validateStatement(makeStatement());
    expect(result.valid).toBe(true);
  });

  it("rejects a statement without an id", () => {
    const result = validateStatement(makeStatement({ id: "" }));
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.path === "statement.id")).toBe(true);
  });

  it("rejects a statement with no claims", () => {
    const result = validateStatement(makeStatement({ claims: [] }));
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.path === "statement.claims")).toBe(true);
  });

  it("rejects a statement with no evidence", () => {
    const result = validateStatement(makeStatement({ evidence: [] }));
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.path === "statement.evidence")).toBe(true);
  });

  it("rejects a statement with confidence out of bounds", () => {
    const result = validateStatement(makeStatement({ confidence: 1.2 }));
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.path === "statement.confidence")).toBe(true);
  });

  it("rejects a statement with confidence below the configured minimum", () => {
    const result = validateStatement(makeStatement({ confidence: 0.1 }), {
      ...DEFAULT_JOURNEY_CONFIG,
      minStatementConfidence: 0.5,
    });
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.path === "statement.confidence")).toBe(true);
  });
});

describe("validateChapter", () => {
  it("accepts a valid chapter", () => {
    const result = validateChapter(makeChapter());
    expect(result.valid).toBe(true);
  });

  it("accepts an empty chapter (semantic divider)", () => {
    const result = validateChapter(makeChapter({ statements: [] }));
    expect(result.valid).toBe(true);
  });

  it("rejects a chapter without an id", () => {
    const result = validateChapter(makeChapter({ id: "" }));
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.path === "chapter.id")).toBe(true);
  });

  it("rejects duplicate statement ids within a chapter", () => {
    const stmt = makeStatement();
    const dup = makeStatement({ statement: "Another statement." });
    const result = validateChapter(makeChapter({ statements: [stmt, { ...dup, id: stmt.id }] }));
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.message.includes("Duplicate statement id"))).toBe(true);
  });
});

describe("validateJourney", () => {
  it("accepts a valid journey", () => {
    const result = validateJourney(makeJourney());
    expect(result.valid).toBe(true);
  });

  it("rejects a journey without identityId", () => {
    const result = validateJourney(makeJourney({ identityId: "" }));
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.path === "journey.identityId")).toBe(true);
  });

  it("rejects a journey without a version", () => {
    const result = validateJourney(makeJourney({ version: NaN }));
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.path === "journey.version")).toBe(true);
  });

  it("rejects a journey with an invalid status", () => {
    const result = validateJourney(makeJourney({ status: "invalid" as never }));
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.path === "journey.status")).toBe(true);
  });

  it("rejects a journey with no chapters", () => {
    const result = validateJourney(makeJourney({ chapters: [] }));
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.path === "journey.chapters")).toBe(true);
  });

  it("rejects duplicate chapter ids", () => {
    const ch1 = makeChapter({ id: "same" });
    const ch2 = makeChapter({ id: "same", title: "Later", sequence: 2 });
    const result = validateJourney(makeJourney({ chapters: [ch1, ch2] }));
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.message.includes("Duplicate chapter id"))).toBe(true);
  });

  it("rejects out-of-order chapter sequences", () => {
    const ch1 = makeChapter({ sequence: 2 });
    const ch2 = makeChapter({ sequence: 1, title: "Earlier" });
    const result = validateJourney(makeJourney({ chapters: [ch1, ch2] }));
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.path.includes("sequence"))).toBe(true);
  });

  it("rejects a journey with an invalid strongestProof", () => {
    const result = validateJourney(makeJourney({ strongestProof: makeStatement({ claims: [] }) }));
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.path.startsWith("journey.strongestProof"))).toBe(true);
  });

  it("accepts a journey with a null strongestProof", () => {
    const result = validateJourney(makeJourney({ strongestProof: null }));
    expect(result.valid).toBe(true);
  });
});

describe("validateProvenance", () => {
  it("accepts a valid provenance", () => {
    const result = validateProvenance(makeProvenance());
    expect(result.valid).toBe(true);
  });

  it("rejects missing provenance", () => {
    const result = validateProvenance(null);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.path === "provenance")).toBe(true);
  });

  it("rejects provenance with no sources", () => {
    const result = validateProvenance(makeProvenance({ sources: [] }));
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.path === "provenance.sources")).toBe(true);
  });

  it("rejects provenance without a journeyId reference", () => {
    const result = validateProvenance(makeProvenance({ journeyId: "" }));
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.path === "provenance.journeyId")).toBe(true);
  });
});
