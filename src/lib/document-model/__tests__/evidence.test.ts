"use strict";

/**
 * Focused regression tests for deterministic EvidenceFact extraction.
 *
 * Regression: extractEvidenceFacts called extractLine with the wrong argument
 * list (block, line, add instead of block, line, index, add), so the
 * person/role/other discrimination received a function in the `index` slot and
 * fact extraction threw or mislabelled facts. This path had no prior coverage.
 */

import { describe, it, expect } from "vitest";
import { extractEvidenceFacts } from "../evidence";
import type { DocumentBlock, DocumentLine, SectionKind } from "../types";

const lineOf = (raw: string, lno: number): DocumentLine => ({
  page: 1,
  lno,
  raw,
  column: undefined,
});
const block = (kind: SectionKind, lines: DocumentLine[], id: string): DocumentBlock => ({
  id,
  kind,
  title: "",
  page: 1,
  startLine: lines[0]?.lno ?? 0,
  endLine: lines.at(-1)?.lno ?? 0,
  uncertain: false,
  confidence: 1,
  lines,
});

describe("extractEvidenceFacts", () => {
  it("labels the first name-block line as person and later title lines as role", () => {
    const facts = extractEvidenceFacts([
      block("name", [lineOf("Jane Doe", 1), lineOf("Senior Engineer", 2)], "blk"),
    ]);
    const person = facts.filter((f) => f.type === "person");
    const roles = facts.filter((f) => f.type === "role");
    expect(person).toHaveLength(1);
    expect(person[0].value).toBe("Jane Doe");
    expect(roles.some((r) => r.value === "Senior Engineer")).toBe(true);
  });

  it("keeps source order and carries provenance on every fact", () => {
    const facts = extractEvidenceFacts([
      block("name", [lineOf("Jane Doe", 1)], "blk_name"),
      block("contact", [lineOf("jane@example.com", 2)], "blk_contact"),
    ]);
    expect(facts.map((f) => f.type)).toEqual(["person", "contact"]);
    for (const f of facts) {
      expect(f.provenance.blockId).toMatch(/^blk/);
      expect(f.provenance.line).toBeGreaterThan(0);
      expect(f.source).toBeTruthy();
    }
  });

  it("never drops a content line — unmatched lines become other", () => {
    const facts = extractEvidenceFacts([
      block("summary", [lineOf("Plain prose sentence with no tokens.", 1)], "blk"),
    ]);
    const others = facts.filter((f) => f.type === "other");
    expect(others.length).toBe(1);
    expect(others[0].value).toBe("Plain prose sentence with no tokens.");
  });
});