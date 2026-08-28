/**
 * Real-database integration test for the Resume API (Phase 0.5 verification).
 *
 * This test drives the REAL route handlers → real service → real repository →
 * real PostgreSQL. The ONLY things mocked are `getServerSession` (representing
 * an authenticated dev account) and `@/lib/auth` config.
 *
 * It is guarded by RUN_DB_TESTS=1 so it NEVER runs in the normal suite:
 *   RUN_DB_TESTS=1 npx vitest run src/app/api/resumes/__tests__/real-db.integration.test.ts
 *
 * All rows are created under dedicated test users and deleted afterwards; no
 * existing user data is touched.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";

const RUN_DB = process.env.RUN_DB_TESTS === "1";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

import { GET, POST } from "@/app/api/resumes/route";
import {
  GET as GET_ITEM,
  PUT,
  DELETE as DELETE_ITEM,
} from "@/app/api/resumes/[resumeId]/route";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { identityService } from "@/services/identity.service";

const mockedSession = getServerSession as ReturnType<typeof vi.fn>;

const RUN_ID = `${Date.now()}`;
const RESUME_ID = "phase0-real-db-test";
const RESUME_ID2 = "phase0-real-db-test-dup";
const USER_A_EMAIL = `phase0-a-${RUN_ID}@patorbit.test`;
const USER_B_EMAIL = `phase0-b-${RUN_ID}@patorbit.test`;

const FULL_PAYLOAD = {
  name: "Phase 0 Real DB Test",
  title: "Verification Engineer",
  email: `phase0-${RUN_ID}@patorbit.test`,
  phone: "+1-555-0100",
  address: "Test City",
  nationality: "Test",
  pronouns: "they/them",
  summary: "Synthetic resume used to verify Phase 0 server persistence.",
  social: {
    linkedin: "linkedin.com/in/phase0",
    github: "github.com/phase0",
    website: "phase0.dev",
    twitter: "",
    portfolio: "",
    stackoverflow: "",
  },
  experience: [
    {
      id: "exp-1",
      company: "Phase0 Corp",
      position: "Staff Engineer",
      location: "Remote",
      employmentType: "Full-time",
      industry: "SaaS",
      duration: "2022 – Present",
      description: "Led platform work.",
      achievements: "Shipped major initiative",
      techUsed: "TypeScript, Postgres",
    },
  ],
  education: [
    {
      id: "edu-1",
      school: "Phase0 University",
      degree: "BSc",
      year: "2018",
      field: "Computer Science",
      gpa: "3.8",
      minor: "",
      honors: "",
      activities: "",
      location: "",
    },
  ],
  skills: [{ id: "sk-1", name: "TypeScript", level: "Advanced", category: "Engineering", years: "6" }],
  projects: [
    {
      id: "prj-1",
      name: "Patorbit",
      description: "Verifiable identity platform",
      tech: "Next.js, Prisma",
      link: "https://patorbit.dev",
      startDate: "2024",
      endDate: "",
      role: "Owner",
      teamSize: "3",
      status: "Ongoing",
    },
  ],
  certifications: [{ id: "cert-1", name: "AWS SA", issuer: "AWS", date: "2023", link: "", description: "", expiryDate: "", skills: "" }],
  languages: [{ id: "lang-1", name: "English", proficiency: "Fluent" }],
  interests: [{ id: "int-1", name: "Open source" }],
  achievements: [{ id: "ach-1", description: "Published a paper" }],
  references: [],
  portfolio: [{ id: "pf-1", title: "Portfolio", description: "", url: "phase0.dev", type: "website" }],
  templateId: "modern-clean",
  careerStage: "working-professional",
  fontPreference: "inter",
  palettePreference: "slate",
  exportFormat: "pdf",
  pageSize: "letter",
  claims: [
    {
      id: "claim-phase0-1",
      assertionText: "Worked at Phase0 Corp",
      claimType: "Employment",
      sourceActivityId: "experience-0",
      confidence: 0.85,
      reasoning: "Listed in experience section",
      verificationStatus: "suggested",
      reviewed: false,
      accepted: false,
      createdAt: "2026-08-16T00:00:00.000Z",
    },
  ],
  styleConfigs: {
    [RESUME_ID]: { fontFamily: "inter", fontScale: 1, lineHeight: 1.6, density: "standard", pageMargin: 48 },
  },
};

function makeRequest(body: unknown, url = "http://localhost/api/resumes"): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function itemContext(resumeId: string) {
  return { params: Promise.resolve({ resumeId }) };
}

describe.skipIf(!RUN_DB)("Resume API — real database (Phase 0.5)", () => {
  let userA: { id: string };
  let userB: { id: string };
  let identityA: { id: string };
  let identityB: { id: string };

  beforeAll(async () => {
    userA = await prisma.user.create({
      data: { id: `phase0-user-a-${RUN_ID}`, name: "Phase0 A", email: USER_A_EMAIL, passwordHash: "test-only" },
    });
    userB = await prisma.user.create({
      data: { id: `phase0-user-b-${RUN_ID}`, name: "Phase0 B", email: USER_B_EMAIL, passwordHash: "test-only" },
    });
    identityA = await identityService.ensureProfessionalIdentity(userA.id);
    identityB = await identityService.ensureProfessionalIdentity(userB.id);
  });

  afterAll(async () => {
    // Remove ONLY rows created by this test (resumes cascade with identity delete).
    await prisma.resume.deleteMany({
      where: { resumeId: { in: [RESUME_ID, RESUME_ID2] } },
    }).catch(() => {});
    await prisma.professionalIdentity.deleteMany({
      where: { userId: { in: [userA.id, userB.id] } },
    }).catch(() => {});
    await prisma.user.deleteMany({
      where: { id: { in: [userA.id, userB.id] } },
    }).catch(() => {});

    // Post-cleanup residue verification — surfaces as a failure if any row survived.
    const leftoverResumes = await prisma.resume.count({
      where: { resumeId: { in: [RESUME_ID, RESUME_ID2] } },
    });
    const leftoverIdentities = await prisma.professionalIdentity.count({
      where: { userId: { in: [userA.id, userB.id] } },
    });
    const leftoverUsers = await prisma.user.count({
      where: { id: { in: [userA.id, userB.id] } },
    });
    expect(leftoverResumes).toBe(0);
    expect(leftoverIdentities).toBe(0);
    expect(leftoverUsers).toBe(0);
  });

  it("rejects unauthenticated requests", async () => {
    mockedSession.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    expect((await POST(makeRequest({ resumeId: RESUME_ID, resume: FULL_PAYLOAD }))).status).toBe(401);
  });

  it("creates a resume via POST against the real database", async () => {
    mockedSession.mockResolvedValue({ user: { id: userA.id } });
    const res = await POST(
      makeRequest({
        resumeId: RESUME_ID,
        resumeName: "Phase 0 Real DB Test",
        templateId: "modern-clean",
        // Client-supplied ownership must be ignored:
        professionalIdentityId: identityB.id,
        resume: FULL_PAYLOAD,
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.resumeId).toBe(RESUME_ID);
    expect(body.templateId).toBe("modern-clean");
    expect(body.resume.name).toBe("Phase 0 Real DB Test");

    const row = await prisma.resume.findUnique({
      where: { professionalIdentityId_resumeId: { professionalIdentityId: identityA.id, resumeId: RESUME_ID } },
    });
    expect(row).not.toBeNull();
    // Ownership came from the session identity, not the body.
    expect(row!.professionalIdentityId).toBe(identityA.id);
  });

  it("is idempotent: re-POSTing the same resumeId returns the same resume, one row only", async () => {
    mockedSession.mockResolvedValue({ user: { id: userA.id } });
    const res = await POST(makeRequest({ resumeId: RESUME_ID, resumeName: "Phase 0 Real DB Test", templateId: "modern-clean", resume: FULL_PAYLOAD }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.resumeId).toBe(RESUME_ID);

    const count = await prisma.resume.count({ where: { resumeId: RESUME_ID } });
    expect(count).toBe(1);
  });

  it("lists the user's resumes via GET", async () => {
    mockedSession.mockResolvedValue({ user: { id: userA.id } });
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.resumes.some((r: { resumeId: string }) => r.resumeId === RESUME_ID)).toBe(true);
  });

  it("reads the resume back with claims + styleConfigs intact (payload round-trip)", async () => {
    mockedSession.mockResolvedValue({ user: { id: userA.id } });
    const res = await GET_ITEM(makeRequest({}), itemContext(RESUME_ID));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.resume.claims).toHaveLength(1);
    expect(body.resume.claims[0].assertionText).toBe("Worked at Phase0 Corp");
    expect(body.resume.styleConfigs[RESUME_ID]).toMatchObject({
      fontFamily: "inter",
      pageMargin: 48,
    });
    expect(body.resume.experience[0].company).toBe("Phase0 Corp");
    expect(body.resume.skills[0].name).toBe("TypeScript");
    expect(body.resume.careerStage).toBe("working-professional");
  });

  it("updates the resume: createdAt unchanged, updatedAt changes", async () => {
    mockedSession.mockResolvedValue({ user: { id: userA.id } });
    const before = await GET_ITEM(makeRequest({}), itemContext(RESUME_ID));
    const beforeBody = await before.json();

    await new Promise((r) => setTimeout(r, 1100)); // TIMESTAMP(3) ms precision

    const res = await PUT(
      makeRequest({ resumeName: "Phase 0 Real DB Test (Updated)", resume: { ...FULL_PAYLOAD, name: "Phase 0 Real DB Test (Updated)" } }),
      itemContext(RESUME_ID),
    );
    expect(res.status).toBe(200);
    const afterBody = await res.json();
    expect(afterBody.resumeName).toBe("Phase 0 Real DB Test (Updated)");
    expect(afterBody.resume.name).toBe("Phase 0 Real DB Test (Updated)");
    expect(afterBody.createdAt).toBe(beforeBody.createdAt);
    expect(afterBody.updatedAt).not.toBe(beforeBody.updatedAt);
  });

  it("enforces ownership: User B cannot read/update/delete User A's resume (404)", async () => {
    mockedSession.mockResolvedValue({ user: { id: userB.id } });
    expect((await GET_ITEM(makeRequest({}), itemContext(RESUME_ID))).status).toBe(404);
    expect((await PUT(makeRequest({ resumeName: "hacked" }), itemContext(RESUME_ID))).status).toBe(404);
    expect((await DELETE_ITEM(makeRequest({}), itemContext(RESUME_ID))).status).toBe(404);
  });

  it("rejects an unknown templateId with 400", async () => {
    mockedSession.mockResolvedValue({ user: { id: userA.id } });
    const res = await POST(
      makeRequest({ resumeId: RESUME_ID2, templateId: "not-a-real-template", resume: FULL_PAYLOAD }),
    );
    expect(res.status).toBe(400);
  });

  it("deletes the user's own resume via DELETE", async () => {
    mockedSession.mockResolvedValue({ user: { id: userA.id } });
    const res = await DELETE_ITEM(makeRequest({}), itemContext(RESUME_ID));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect((await GET_ITEM(makeRequest({}), itemContext(RESUME_ID))).status).toBe(404);
    const count = await prisma.resume.count({ where: { resumeId: RESUME_ID } });
    expect(count).toBe(0);
  });

  it("leaves no test resume residue behind", async () => {
    const count = await prisma.resume.count({
      where: { resumeId: { in: [RESUME_ID, RESUME_ID2] } },
    });
    expect(count).toBe(0);
  });
});
