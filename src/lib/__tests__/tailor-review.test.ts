"use strict";

import { describe, expect, it } from "vitest";
import type { Resume } from "@/types/resume";
import {
  acceptAllSafe,
  acceptAllSafeWithCount,
  applyTailorSuggestions,
  buildSuggestions,
  detectUnsupportedAdditions,
  suggestionEventFor,
} from "@/lib/tailor-review";
import type { QualificationMatch } from "@/types/qualification-match";

/* ── Fixtures ──────────────────────────────────────────────────────────── */

function baseResume(): Resume {
  return {
    name: "Jordan Rivera",
    title: "Backend Engineer",
    email: "jordan@example.com",
    phone: "555-0100",
    address: "",
    nationality: "",
    pronouns: "",
    summary: "Backend engineer building internal services.",
    social: { github: "", linkedin: "", twitter: "", portfolio: "", stackoverflow: "" },
    experience: [
      {
        id: "exp1",
        company: "Brightloop",
        position: "Software Engineer",
        location: "",
        employmentType: "",
        industry: "",
        startDate: "2021",
        endDate: "2024",
        current: false,
        duration: "",
        description: "",
        achievements: "",
        techUsed: "Python, PostgreSQL",
        bulletPoints: ["Built Python-based REST APIs for internal services."],
      },
    ],
    education: [
      { id: "edu1", school: "State University", degree: "BSc Computer Science", year: "2021", field: "", gpa: "", minor: "", honors: "", activities: "", location: "" },
    ],
    skills: [
      { id: "sk1", name: "Python", level: "Advanced", category: "Programming", years: "" },
      { id: "sk2", name: "PostgreSQL", level: "Advanced", category: "Database", years: "" },
      { id: "sk3", name: "AWS", level: "Intermediate", category: "Cloud", years: "" },
    ],
    projects: [],
    certifications: [],
    languages: [],
    interests: [],
    achievements: [],
    references: [],
    portfolio: [],
    templateId: "modern-clean",
  } as unknown as Resume;
}

function matchFixture(): QualificationMatch {
  const src = {
    itemType: "resume-import" as const,
    sourceRef: "resume:skills",
    sourceType: "resume-import",
    capturedAt: "2026-01-01T00:00:00.000Z",
    claimIds: [],
    evidenceIds: [],
  } as never;
  const item = (
    id: string,
    requirement: string,
    classification: QualificationMatch["items"][number]["classification"],
    evidence: QualificationMatch["items"][number]["evidence"] = [],
  ) => ({
    id,
    sourceGroup: "skill" as const,
    classification,
    requirement,
    reason: `${requirement}: ${classification}`,
    evidence,
    jdSource: src,
    detectedAt: "2026-01-01T00:00:00.000Z",
  });
  return {
    id: "m1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    version: 1,
    sourceLength: 500,
    summary: { proven: 1, related: 0, communicationGap: 0, missing: 1, total: 2 },
    items: [
      item("i1", "Python", "PROVEN", [
        {
          itemId: "cp_skill_python",
          itemKind: "skill",
          text: "Python",
          source: src,
        },
      ]),
      item("i2", "Kubernetes", "MISSING", []),
    ],
  } as unknown as QualificationMatch;
}

const jobProfileStub = {
  skills: [
    { name: "Python", source: { itemType: "job-input", sourceRef: "jd:skill:0", sourceType: "user-input", capturedAt: "2026-01-01T00:00:00.000Z" } },
    { name: "Kubernetes", source: { itemType: "job-input", sourceRef: "jd:skill:1", sourceType: "user-input", capturedAt: "2026-01-01T00:00:00.000Z" } },
  ],
} as never;

const buildInput = (original: Resume, tailored: Resume) => ({
  original,
  tailored,
  match: matchFixture(),
  profile: null,
  jobProfile: jobProfileStub,
});

/* ── Case 1: job requires Python, user has Python evidence → strong ────── */

describe("evidence-first matching for suggestions", () => {
  it("attaches user evidence when the JD focus term is supported (§6/§11)", () => {
    const original = baseResume();
    const tailored: Resume = {
      ...original,
      summary: "Python backend engineer focused on REST APIs.",
      experience: [
        {
          ...original.experience[0],
          bulletPoints: ["Developed REST APIs using Python for internal services."],
        },
      ],
    };
    const sugs = buildSuggestions(buildInput(original, tailored));
    const summary = sugs.find((s) => s.id === "summary");
    expect(summary).toBeDefined();
    expect(summary!.why).toContain("Python");
    expect(summary!.evidence.length).toBeGreaterThan(0);
    expect(summary!.evidence[0].quote.length).toBeGreaterThan(0);
  });

  it("generates no suggestion when nothing changed", () => {
    const original = baseResume();
    expect(buildSuggestions(buildInput(original, { ...original }))).toHaveLength(0);
  });
});

/* ── Case 2: job requires Kubernetes, user has none → never appears ────── */

describe("fabrication guard (§12)", () => {
  it("blocks a skill the profile has no evidence for, even when accepted", () => {
    const original = baseResume();
    const tailored: Resume = {
      ...original,
      skills: [...original.skills, { id: "x", name: "Kubernetes", level: "Intermediate" as const, category: "", years: "" }],
    };

    // Detection surfaces the addition.
    expect(detectUnsupportedAdditions(original, tailored)).toContain("Skill: Kubernetes");

    const sugs = buildSuggestions(buildInput(original, tailored));
    const skillsSug = sugs.find((s) => s.id === "skills")!;
    expect(skillsSug.blocked).toContain("Skill: Kubernetes");
    expect(skillsSug.safe).toBe(false);

    // Even an explicit Accept cannot smuggle it in.
    const applied = applyTailorSuggestions(original, tailored, sugs, {
      skills: { status: "accepted" },
    });
    expect(applied.resume.skills.map((s) => s.name)).not.toContain("Kubernetes");
    expect(applied.blocked).toBeGreaterThan(0);
  });

  it("blocks invented experience entries (extra jobs) entirely", () => {
    const original = baseResume();
    const tailored: Resume = {
      ...original,
      experience: [
        original.experience[0],
        {
          ...original.experience[0],
          id: "fake",
          company: "Invented Corp",
          position: "Lead Engineer",
        },
      ],
    };
    expect(detectUnsupportedAdditions(original, tailored)).toContain("Employer: Invented Corp");

    const applied = applyTailorSuggestions(original, tailored, [], {});
    expect(applied.resume.experience).toHaveLength(1);
    expect(applied.resume.experience[0].company).toBe("Brightloop");
  });

  it("never changes the employer on an accepted rewrite", () => {
    const original = baseResume();
    const tailored: Resume = {
      ...original,
      experience: [
        {
          ...original.experience[0],
          company: "Other Corp",
          bulletPoints: ["Built internal REST APIs."],
        },
      ],
    };
    const sugs = buildSuggestions(buildInput(original, tailored));
    const exp = sugs.find((s) => s.id === "exp:0")!;
    expect(exp.blocked).toContain("Employer: Other Corp");

    const applied = applyTailorSuggestions(original, tailored, sugs, {
      "exp:0": { status: "accepted" },
    });
    expect(applied.resume.experience[0].company).toBe("Brightloop");
    expect(applied.blocked).toBeGreaterThan(0);
  });

  it("strips unsupported tech tokens from accepted bullet lines", () => {
    const original = baseResume();
    const tailored: Resume = {
      ...original,
      experience: [
        {
          ...original.experience[0],
          bulletPoints: [
            "Built Python-based REST APIs for internal services.",
            "Orchestrated Kubernetes clusters across regions.",
          ],
        },
      ],
    };
    const sugs = buildSuggestions(buildInput(original, tailored));
    const exp = sugs.find((s) => s.id === "exp:0")!;
    expect(exp.blocked.some((b) => b.includes("Kubernetes"))).toBe(true);

    const applied = applyTailorSuggestions(original, tailored, sugs, {
      "exp:0": { status: "accepted" },
    });
    const bullets = applied.resume.experience[0].bulletPoints;
    expect(bullets.join("\n")).not.toContain("Kubernetes");
    expect(bullets.join("\n")).toContain("Python");
    expect(applied.blocked).toBeGreaterThan(0);
  });
});

/* ── Case 3: AWS vs Azure → no Azure claim is produced ─────────────────── */

describe("adjacent-skill safety", () => {
  it("never marks an unrelated cloud token as covered", () => {
    const original = baseResume();
    const tailored: Resume = {
      ...original,
      experience: [
        {
          ...original.experience[0],
          bulletPoints: ["Built Python APIs deployed on Azure infrastructure."],
        },
      ],
    };
    const sugs = buildSuggestions(buildInput(original, tailored));
    const exp = sugs.find((s) => s.id === "exp:0")!;
    expect(exp.blocked.some((b) => b.includes("Azure"))).toBe(true);

    const applied = applyTailorSuggestions(original, tailored, sugs, {
      "exp:0": { status: "accepted" },
    });
    expect(applied.resume.experience[0].bulletPoints.join("\n")).not.toContain("Azure");
  });
});

/* ── Cases 5 & 6: reject / edit decisions are honored on export data ───── */

describe("user decisions (§15/§17)", () => {
  const setup = () => {
    const original = baseResume();
    const tailored: Resume = {
      ...original,
      summary: "Python backend engineer partnering with product teams.",
      experience: [
        {
          ...original.experience[0],
          bulletPoints: ["Developed REST APIs using Python for internal services."],
        },
      ],
    };
    const sugs = buildSuggestions(buildInput(original, tailored));
    return { original, tailored, sugs };
  };

  it("Case 5 — a rejected suggestion never appears in the applied resume", () => {
    const { original, tailored, sugs } = setup();
    const applied = applyTailorSuggestions(original, tailored, sugs, {
      summary: { status: "rejected" },
      "exp:0": { status: "rejected" },
    });
    expect(applied.resume.summary).toBe(original.summary);
    expect(applied.resume.experience[0].bulletPoints).toEqual(
      original.experience[0].bulletPoints,
    );
    expect(applied.rejected).toBe(2);
    expect(applied.accepted).toBe(0);
  });

  it("Case 6 — an edited suggestion exports the user's wording", () => {
    const { original, tailored, sugs } = setup();
    const applied = applyTailorSuggestions(original, tailored, sugs, {
      "exp:0": { status: "edited", text: "Custom wording the user typed." },
    });
    expect(applied.resume.experience[0].bulletPoints).toEqual([
      "Custom wording the user typed.",
    ]);
    expect(applied.resume.summary).toBe(original.summary); // untouched
    expect(applied.edited).toBe(1);
  });

  it("Case 6b — edit-then-accepted exports the USER's wording, not the AI's", () => {
    const { original, tailored, sugs } = setup();
    const applied = applyTailorSuggestions(original, tailored, sugs, {
      "exp:0": { status: "accepted", text: "Reworded by the user, then accepted." },
    });
    expect(applied.resume.experience[0].bulletPoints).toEqual([
      "Reworded by the user, then accepted.",
    ]);
    expect(applied.accepted).toBe(1);
  });

  it("Case 6c — user wording survives the §12 summary block (user-provided provenance)", () => {
    const original = baseResume();
    const tailored: Resume = {
      ...original,
      summary: "Kubernetes platform engineer scaling large clusters.",
    };
    const sugs = buildSuggestions(buildInput(original, tailored));
    const summarySug = sugs.find((s) => s.id === "summary")!;
    expect(summarySug.blocked.length).toBeGreaterThan(0); // carries unsupported tech

    // The AI's wording alone is withheld (§12)…
    const aiOnly = applyTailorSuggestions(original, tailored, sugs, {
      summary: { status: "accepted" },
    });
    expect(aiOnly.resume.summary).toBe(original.summary);
    expect(aiOnly.blocked).toBeGreaterThan(0);

    // …but the user's own edit-then-accepted wording applies as-is.
    const userText = applyTailorSuggestions(original, tailored, sugs, {
      summary: { status: "accepted", text: "My own summary, no unsupported claims." },
    });
    expect(userText.resume.summary).toBe("My own summary, no unsupported claims.");
  });

  it("undecided suggestions leave the original untouched", () => {
    const { original, tailored, sugs } = setup();
    const applied = applyTailorSuggestions(original, tailored, sugs, {});
    expect(applied.pending).toBe(sugs.length);
    expect(applied.resume.summary).toBe(original.summary);
    expect(applied.resume.experience[0].bulletPoints).toEqual(
      original.experience[0].bulletPoints,
    );
  });

  it("acceptAllSafe accepts only safe suggestions and preserves decisions", () => {
    const { sugs } = setup();
    const decisions = acceptAllSafe(sugs, { summary: { status: "rejected" } });
    expect(decisions.summary.status).toBe("rejected");
    for (const s of sugs) {
      if (s.id === "summary") continue;
      if (s.safe) expect(decisions[s.id]?.status).toBe("accepted");
      else expect(decisions[s.id]).toBeUndefined();
    }
  });
});

/* ── Batch acceptance analytics (§24 / Phase 1.2) ─────────────────────── */

describe("accept-all-safe analytics contract", () => {
  const setup = () => {
    const original = baseResume();
    const tailored: Resume = {
      ...original,
      summary: "Python backend engineer partnering with product teams.",
      experience: [
        { ...original.experience[0], bulletPoints: ["Developed REST APIs using Python for internal services."] },
      ],
    };
    return buildSuggestions(buildInput(original, tailored));
  };

  it("counts exactly the newly accepted safe suggestions", () => {
    const sugs = setup();
    const first = acceptAllSafeWithCount(sugs, {});
    const expectedSafe = sugs.filter((s) => s.safe).length;
    expect(first.acceptedCount).toBe(expectedSafe);
    expect(first.acceptedCount).toBeGreaterThan(0);

    // Running the batch again with its own output must report 0 — the
    // suggestion_accepted batch event can never fire twice for one action.
    const second = acceptAllSafeWithCount(sugs, first.decisions);
    expect(second.acceptedCount).toBe(0);
    expect(second.decisions).toEqual(first.decisions);
  });

  it("never overrides an explicit user decision during the batch", () => {
    const sugs = setup();
    const { decisions, acceptedCount } = acceptAllSafeWithCount(sugs, {
      summary: { status: "rejected" },
      "exp:0": { status: "edited", text: "mine" },
    });
    expect(decisions.summary).toEqual({ status: "rejected" });
    expect(decisions["exp:0"]).toEqual({ status: "edited", text: "mine" });
    const safeUntouched = sugs.filter(
      (s) => s.safe && s.id !== "summary" && s.id !== "exp:0",
    ).length;
    expect(acceptedCount).toBe(safeUntouched);
  });

  it("does not accept unsafe suggestions in the batch", () => {
    const sugs = setup();
    const { decisions } = acceptAllSafeWithCount(sugs, {});
    for (const s of sugs) {
      if (!s.safe) expect(decisions[s.id]).toBeUndefined();
    }
  });

  it("maps every decision status to its §24 event", () => {
    expect(suggestionEventFor("accepted")).toBe("suggestion_accepted");
    expect(suggestionEventFor("rejected")).toBe("suggestion_rejected");
    expect(suggestionEventFor("edited")).toBe("suggestion_edited");
  });
});

/* ── Master profile preservation (§13) ─────────────────────────────────── */

describe("master preservation (§13)", () => {
  it("apply never mutates the original resume object", () => {
    const original = baseResume();
    const before = JSON.stringify(original);
    const tailored: Resume = {
      ...original,
      summary: "Totally new summary.",
      skills: original.skills.map((s) => ({ ...s })),
      experience: [
        { ...original.experience[0], bulletPoints: ["New bullet wording here."] },
      ],
    };
    const sugs = buildSuggestions(buildInput(original, tailored));
    applyTailorSuggestions(original, tailored, sugs, {
      summary: { status: "accepted" },
      "exp:0": { status: "accepted" },
      skills: { status: "accepted" },
    });
    expect(JSON.stringify(original)).toBe(before);
  });
});
