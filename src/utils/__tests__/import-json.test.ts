"use strict";

/**
 * Regression tests for the JSON resume import path (/api/import).
 *
 * Regression: importing a JSON resume failed with HTTP 500 "Invalid resume
 * format" whenever an array item carried a string id (the app's own uid()
 * format, e.g. "id_123_abc") or no id at all, because ResumeSchema required
 * numeric ids and the JSON branch fed raw data straight into it.
 */

import { describe, it, expect } from "vitest";
import { ensureItemIds } from "../import-json";
import { parseResumeJson } from "../resume-schema";

const base = {
  name: "Jane Doe",
  email: "jane@example.com",
  templateId: "executive-pro",
};

describe("ensureItemIds (JSON import normalization)", () => {
  it("preserves string ids from the app's uid() format", () => {
    const data = {
      ...base,
      experience: [{ id: "id_1_a", company: "Acme" }],
      skills: [{ id: "id_2_b", name: "TypeScript" }],
    };
    const out = ensureItemIds(data) as { experience: { id: string }[]; skills: { id: string }[] };
    expect(out.experience[0].id).toBe("id_1_a");
    expect(out.skills[0].id).toBe("id_2_b");
  });

  it("preserves numeric ids", () => {
    const data = { ...base, experience: [{ id: 7, company: "Acme" }] };
    const out = ensureItemIds(data) as { experience: { id: number }[] };
    expect(out.experience[0].id).toBe(7);
  });

  it("assigns sequential ids to items that are missing one", () => {
    const data = {
      ...base,
      experience: [{ company: "Acme" }, { company: "Stripe" }],
      skills: [{ name: "JS" }],
    };
    const out = ensureItemIds(data) as { experience: { id: number }[]; skills: { id: number }[] };
    expect(out.experience.map((e) => e.id)).toEqual([1, 2]);
    expect(out.skills[0].id).toBe(1);
  });

  it("handles a mix of items with and without ids", () => {
    const data = {
      ...base,
      experience: [{ id: "keep_me", company: "Acme" }, { company: "Stripe" }],
    };
    const out = ensureItemIds(data) as { experience: { id: number | string }[] };
    expect(out.experience[0].id).toBe("keep_me");
    expect(out.experience[1].id).toBe(2);
  });

  it("leaves non-array fields untouched", () => {
    const out = ensureItemIds({ ...base, summary: "Hello" });
    expect(out.summary).toBe("Hello");
    expect(out.name).toBe("Jane Doe");
  });
});

describe("parseResumeJson with imported id shapes", () => {
  it("accepts string ids (app uid format) and preserves the data", () => {
    const parsed = parseResumeJson(
      ensureItemIds({
        ...base,
        experience: [{ id: "id_1_a", company: "Acme", position: "Dev" }],
        education: [{ id: "id_2_b", school: "MIT", degree: "BSc" }],
        skills: [{ id: "id_3_c", name: "TypeScript" }],
        projects: [{ id: "id_4_d", name: "Portal" }],
        certifications: [{ id: "id_5_e", name: "AWS" }],
        languages: [{ id: "lang_1", name: "English" }],
        portfolio: [{ id: "port_1", title: "Site" }],
        claims: [{ id: "cl_1", assertionText: "x" }],
      }),
    );
    expect(parsed.experience[0].id).toBe("id_1_a");
    expect(parsed.education[0].id).toBe("id_2_b");
    expect(parsed.skills[0].id).toBe("id_3_c");
    expect(parsed.projects[0].id).toBe("id_4_d");
    expect(parsed.certifications[0].id).toBe("id_5_e");
    expect(parsed.languages[0].id).toBe("lang_1");
    expect(parsed.portfolio[0].id).toBe("port_1");
    expect(parsed.claims[0].id).toBe("cl_1");
    expect(parsed.name).toBe("Jane Doe");
    expect(parsed.templateId).toBe("executive-pro");
  });

  it("accepts items whose ids were filled in by ensureItemIds", () => {
    const parsed = parseResumeJson(
      ensureItemIds({
        ...base,
        experience: [{ company: "Acme", position: "Dev" }],
        skills: [{ name: "Go" }],
      }),
    );
    expect(parsed.experience[0].id).toBe(1);
    expect(parsed.skills[0].id).toBe(1);
  });
});
