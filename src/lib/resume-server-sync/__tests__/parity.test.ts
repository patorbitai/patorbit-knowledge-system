import { describe, it, expect } from "vitest";
import {
  computeParity,
  canonicalizeLocal,
  stableStringify,
  type LocalResumeSnapshot,
} from "../parity";
import type { ServerResumeRecord } from "../client";
import { ResumePayloadSchema } from "@/utils/resume-payload-schema";
import type { Resume } from "@/types/resume";

/* ── Deterministic fixtures ─────────────────────────────────────────────── */

/**
 * A realistic local resume. It intentionally includes the local-only UI
 * extension fields (experience.startDate/endDate/current/bulletPoints,
 * achievement.title/date/issuer) that are NOT part of the canonical payload
 * document — parity compares the canonical normalized form on both sides.
 */
const BASE_DOC: Resume = {
  resumeId: "resume-A",
  resumeName: "Ada's Resume",
  name: "Ada Lovelace",
  title: "Analytical Engineer",
  email: "ada@example.com",
  phone: "555-0100",
  address: "London",
  nationality: "British",
  pronouns: "she/her",
  summary: "Mathematician and computing pioneer.",
  social: {
    linkedin: "",
    github: "github.com/ada",
    website: "",
    twitter: "",
    portfolio: "",
    stackoverflow: "",
  },
  experience: [
    {
      id: "exp-1",
      company: "Analytical Engine Co",
      position: "Engineer",
      location: "London",
      employmentType: "Full-time",
      industry: "Computing",
      duration: "1837 – 1843",
      description: "Designed algorithms.",
      achievements: "First published algorithm",
      techUsed: "Punched cards",
      // local-only UI extension fields (not in the canonical payload schema):
      startDate: "1837",
      endDate: "1843",
      current: false,
      bulletPoints: [],
    },
  ],
  education: [
    {
      id: "edu-1",
      school: "University of London",
      degree: "BSc",
      year: "1835",
      field: "Mathematics",
      gpa: "",
      minor: "",
      honors: "",
      activities: "",
      location: "",
    },
  ],
  skills: [
    { id: "sk-1", name: "Analysis", level: "Expert", category: "Mathematics", years: "10" },
  ],
  projects: [
    {
      id: "prj-1",
      name: "Analytical Engine",
      description: "A general-purpose machine",
      tech: "Mechanics",
      link: "",
      startDate: "1837",
      endDate: "",
      role: "Collaborator",
      teamSize: "2",
      status: "Ongoing",
      bulletPoints: [],
    },
  ],
  certifications: [
    { id: "cert-1", name: "Member", issuer: "Royal Society", date: "1841", link: "", description: "", expiryDate: "", skills: "" },
  ],
  languages: [{ id: "lang-1", name: "English", proficiency: "Native" }],
  interests: [{ id: "int-1", name: "Poetry" }],
  achievements: [
    { id: "ach-1", description: "Published notes on the engine", title: "Notes", date: "1843", issuer: "Taylor's" },
  ],
  references: [
    { id: "ref-1", name: "Charles Babbage", company: "Analytical Engine Co", position: "Professor", email: "", phone: "" },
  ],
  portfolio: [{ id: "pf-1", title: "Works", description: "", url: "", type: "website" }],
  templateId: "modern-clean",
  careerStage: "working-professional",
  fontPreference: "inter",
  palettePreference: "slate",
  exportFormat: "pdf",
  pageSize: "letter",
  claims: [
    {
      id: "claim-1",
      assertionText: "Worked at Analytical Engine Co",
      claimType: "Employment",
      sourceActivityId: "experience-0",
      confidence: 0.8,
      reasoning: "Listed in experience section",
      verificationStatus: "suggested",
      reviewed: false,
      accepted: false,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ],
};

function localSnapshot(
  overrides: Partial<LocalResumeSnapshot> = {},
): LocalResumeSnapshot {
  return {
    resumeId: "resume-A",
    resumeName: "Ada's Resume",
    templateId: "modern-clean",
    careerStage: "working-professional",
    document: { ...BASE_DOC, resumeId: "resume-A", resumeName: "Ada's Resume" },
    styleConfig: null,
    ...overrides,
  };
}

function serverRecord(
  overrides: Partial<ServerResumeRecord> = {},
): ServerResumeRecord {
  // The server payload is the schema-canonical document (what the API returns).
  const payload = ResumePayloadSchema.parse({ ...BASE_DOC });
  return {
    resumeId: "resume-A",
    resumeName: "Ada's Resume",
    templateId: "modern-clean",
    careerStage: "working-professional",
    resume: { ...payload, templateId: "modern-clean", careerStage: "working-professional" },
    createdAt: "2026-08-16T00:00:00.000Z",
    updatedAt: "2026-08-16T00:00:00.000Z",
    ...overrides,
  };
}

/* ── Tests ──────────────────────────────────────────────────────────────── */

describe("stableStringify", () => {
  it("is key-order independent", () => {
    expect(stableStringify({ b: 1, a: { d: 2, c: 3 } })).toBe(
      stableStringify({ a: { c: 3, d: 2 }, b: 1 }),
    );
  });
});

describe("canonicalizeLocal", () => {
  it("strips local-only UI extension fields deterministically", () => {
    const a = localSnapshot();
    const b = localSnapshot({
      document: {
        ...BASE_DOC,
        experience: [
          { ...BASE_DOC.experience[0], bulletPoints: ["Changed bullet"] },
        ],
      },
    });
    expect(canonicalizeLocal(a)).toBe(canonicalizeLocal(b));
  });
});

describe("computeParity", () => {
  it("reports IDENTICAL for an identical local/server resume", () => {
    const report = computeParity([localSnapshot()], [serverRecord()]);
    expect(report.entries).toEqual([
      expect.objectContaining({ resumeId: "resume-A", status: "IDENTICAL" }),
    ]);
    expect(report.summary).toEqual({ identical: 1, different: 0, localOnly: 0, serverOnly: 0 });
  });

  it("reports DIFFERENT when the payload differs (summary)", () => {
    const local = localSnapshot({
      document: { ...BASE_DOC, summary: "Edited locally." },
    });
    const report = computeParity([local], [serverRecord()]);
    expect(report.entries[0].status).toBe("DIFFERENT");
  });

  it("reports DIFFERENT when claims differ", () => {
    const local = localSnapshot({
      document: {
        ...BASE_DOC,
        claims: [{ ...BASE_DOC.claims[0], assertionText: "Edited claim" }],
      },
    });
    const report = computeParity([local], [serverRecord()]);
    expect(report.entries[0].status).toBe("DIFFERENT");
  });

  it("reports DIFFERENT when styleConfigs differ", () => {
    const local = localSnapshot({ styleConfig: { fontFamily: "inter" } });
    const report = computeParity([local], [serverRecord()]);
    expect(report.entries[0].status).toBe("DIFFERENT");
  });

  it("reports IDENTICAL when styleConfigs match", () => {
    const local = localSnapshot({ styleConfig: { fontFamily: "inter", density: "standard" } });
    const server = serverRecord({
      resume: {
        ...serverRecord().resume,
        styleConfigs: { "resume-A": { fontFamily: "inter", density: "standard" } },
      },
    });
    const report = computeParity([local], [server]);
    expect(report.entries[0].status).toBe("IDENTICAL");
  });

  it("reports DIFFERENT when templateId differs", () => {
    const local = localSnapshot({
      templateId: "executive-pro",
      document: { ...BASE_DOC, templateId: "executive-pro" },
    });
    const report = computeParity([local], [serverRecord()]);
    expect(report.entries[0].status).toBe("DIFFERENT");
  });

  it("reports DIFFERENT when resumeName differs", () => {
    const local = localSnapshot({ resumeName: "Renamed locally" });
    const report = computeParity([local], [serverRecord()]);
    expect(report.entries[0].status).toBe("DIFFERENT");
  });

  it("reports LOCAL_ONLY for a resume absent on the server", () => {
    const report = computeParity([localSnapshot()], []);
    expect(report.entries[0]).toEqual(
      expect.objectContaining({ resumeId: "resume-A", status: "LOCAL_ONLY", serverExists: false }),
    );
    expect(report.summary.localOnly).toBe(1);
  });

  it("reports SERVER_ONLY for a resume absent locally", () => {
    const report = computeParity([], [serverRecord()]);
    expect(report.entries[0]).toEqual(
      expect.objectContaining({ resumeId: "resume-A", status: "SERVER_ONLY", localExists: false }),
    );
    expect(report.summary.serverOnly).toBe(1);
  });

  it("classifies multiple resumes independently (multi-resume support)", () => {
    const localA = localSnapshot();
    const localB = localSnapshot({
      resumeId: "resume-B",
      document: { ...BASE_DOC, resumeId: "resume-B", resumeName: "B" },
      resumeName: "B",
    });
    const serverA = serverRecord();
    const serverC = serverRecord({
      resumeId: "resume-C",
      resumeName: "C",
      resume: { ...serverRecord().resume, resumeId: "resume-C" },
    });

    const report = computeParity([localA, localB], [serverA, serverC]);

    expect(report.entries.map((e) => [e.resumeId, e.status])).toEqual([
      ["resume-A", "IDENTICAL"],
      ["resume-B", "LOCAL_ONLY"],
      ["resume-C", "SERVER_ONLY"],
    ]);
    expect(report.summary).toEqual({ identical: 1, different: 0, localOnly: 1, serverOnly: 1 });
  });

  it("reports an empty report for empty local + empty server", () => {
    const report = computeParity([], []);
    expect(report.entries).toEqual([]);
    expect(report.summary).toEqual({ identical: 0, different: 0, localOnly: 0, serverOnly: 0 });
  });

  it("is deterministic — same inputs, same output order", () => {
    const inputs = [localSnapshot(), localSnapshot({ resumeId: "z", resumeName: "Z" }), localSnapshot({ resumeId: "m", resumeName: "M" })];
    const a = computeParity(inputs, []);
    const b = computeParity([...inputs].reverse(), []);
    expect(a.entries.map((e) => e.resumeId)).toEqual(b.entries.map((e) => e.resumeId));
  });
});
