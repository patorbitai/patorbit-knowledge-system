import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Hoisted mocks (vitest hoists factory calls above top-level variables).
const { findManyMock, findUniqueMock, createMock, updateMock, deleteMock } =
  vi.hoisted(() => ({
    findManyMock: vi.fn(),
    findUniqueMock: vi.fn(),
    createMock: vi.fn(),
    updateMock: vi.fn(),
    deleteMock: vi.fn(),
  }));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));
vi.mock("@/services/identity.service", () => ({
  identityService: {
    ensureProfessionalIdentity: vi.fn(),
  },
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    resume: {
      findMany: findManyMock,
      findUnique: findUniqueMock,
      create: createMock,
      update: updateMock,
      delete: deleteMock,
    },
    professionalIdentity: {
      findUnique: vi.fn().mockResolvedValue({ id: "pi_test", resumes: [] }),
    },
  },
}));

vi.mock("@/services/entitlement.service", () => ({
  entitlementService: {
    getUserEntitlements: vi.fn().mockResolvedValue({
      tier: "Professional",
      status: "active",
      isActive: true,
      features: { maxResumes: -1 },
    }),
    hasFeature: vi.fn().mockResolvedValue(true),
    checkResumeLimit: vi.fn().mockResolvedValue({ allowed: true, current: 0, max: -1 }),
  },
}));

import { GET, POST } from "@/app/api/resumes/route";
import {
  GET as GET_ITEM,
  PUT,
  PATCH,
  DELETE as DELETE_ITEM,
} from "@/app/api/resumes/[resumeId]/route";
import { getServerSession } from "next-auth";
import { identityService } from "@/services/identity.service";

const mockedSession = getServerSession as ReturnType<typeof vi.fn>;
const mockEnsureIdentity = identityService.ensureProfessionalIdentity as ReturnType<
  typeof vi.fn
>;

const IDENTITY_A = "identity_a";
const IDENTITY_B = "identity_b";

function makeRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "res_1",
    resumeId: "resume-1",
    professionalIdentityId: IDENTITY_A,
    resumeName: "Arvind Test",
    templateId: "modern-clean",
    careerStage: "working-professional",
    payload: {
      name: "Arvind Test",
      title: "Senior Engineer",
      email: "arvind@example.com",
      templateId: "modern-clean",
      careerStage: "working-professional",
      claims: [
        {
          id: "claim-1",
          assertionText: "Worked at ACME",
          claimType: "Employment",
          sourceActivityId: "experience-0",
          confidence: 0.8,
          reasoning: "From resume",
          verificationStatus: "suggested",
          reviewed: false,
          accepted: false,
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      styleConfigs: { "resume-1": { fontFamily: "inter", density: "standard" } },
    },
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

const validBody = {
  resumeId: "resume-1",
  resumeName: "Arvind Test",
  templateId: "modern-clean",
  // The client must never be trusted with ownership — this field is ignored.
  professionalIdentityId: IDENTITY_B,
  resume: {
    name: "Arvind Test",
    title: "Senior Engineer",
    email: "arvind@example.com",
    templateId: "modern-clean",
    careerStage: "working-professional",
    claims: [
      {
        id: "claim-1",
        assertionText: "Worked at ACME",
        claimType: "Employment",
        sourceActivityId: "experience-0",
        confidence: 0.8,
        reasoning: "From resume",
        verificationStatus: "suggested",
        reviewed: false,
        accepted: false,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    styleConfigs: { "resume-1": { fontFamily: "inter", density: "standard" } },
  },
};

function makeRequest(body: unknown, url = "http://localhost/api/resumes"): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function itemContext(resumeId = "resume-1") {
  return { params: Promise.resolve({ resumeId }) };
}

describe("/api/resumes", () => {
  beforeEach(() => {
    mockedSession.mockReset();
    mockEnsureIdentity.mockReset();
    findManyMock.mockReset();
    findUniqueMock.mockReset();
    createMock.mockReset();
    updateMock.mockReset();
    deleteMock.mockReset();
    mockEnsureIdentity.mockResolvedValue({
      id: IDENTITY_A,
      userId: "user_a",
    });
  });

  describe("authentication", () => {
    it("rejects unauthenticated GET", async () => {
      mockedSession.mockResolvedValue(null);
      const res = await GET();
      expect(res.status).toBe(401);
    });

    it("rejects unauthenticated POST", async () => {
      mockedSession.mockResolvedValue(null);
      const res = await POST(makeRequest(validBody));
      expect(res.status).toBe(401);
    });

    it("rejects unauthenticated PUT", async () => {
      mockedSession.mockResolvedValue(null);
      const res = await PUT(makeRequest(validBody), itemContext());
      expect(res.status).toBe(401);
    });

    it("rejects unauthenticated DELETE", async () => {
      mockedSession.mockResolvedValue(null);
      const res = await DELETE_ITEM(makeRequest(validBody), itemContext());
      expect(res.status).toBe(401);
    });
  });

  describe("create (POST)", () => {
    it("creates a resume for the authenticated user (ownership from session)", async () => {
      mockedSession.mockResolvedValue({ user: { id: "user_a" } });
      findUniqueMock.mockResolvedValue(null);
      createMock.mockResolvedValue(makeRecord());

      const res = await POST(makeRequest(validBody));

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.resumeId).toBe("resume-1");
      expect(body.templateId).toBe("modern-clean");
      // Ownership was derived from the session identity, NOT the client body.
      expect(createMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ professionalIdentityId: IDENTITY_A }),
        }),
      );
    });

    it("is idempotent: duplicate resumeId returns the existing resume (200-equivalent behavior)", async () => {
      mockedSession.mockResolvedValue({ user: { id: "user_a" } });
      findUniqueMock.mockResolvedValue(makeRecord());

      const res = await POST(makeRequest(validBody));

      expect(res.status).toBe(201);
      expect(createMock).not.toHaveBeenCalled();
      const body = await res.json();
      expect(body.resumeId).toBe("resume-1");
    });

    it("rejects an invalid ResumeSchema payload with 400", async () => {
      mockedSession.mockResolvedValue({ user: { id: "user_a" } });
      const bad = {
        ...validBody,
        resume: { ...validBody.resume, careerStage: "not-a-stage" },
      };
      const res = await POST(makeRequest(bad));
      expect(res.status).toBe(400);
    });

    it("rejects an unknown templateId with 400", async () => {
      mockedSession.mockResolvedValue({ user: { id: "user_a" } });
      const res = await POST(
        makeRequest({ ...validBody, templateId: "not-a-real-template" }),
      );
      expect(res.status).toBe(400);
    });

    it("preserves claims inside the transitional payload", async () => {
      mockedSession.mockResolvedValue({ user: { id: "user_a" } });
      findUniqueMock.mockResolvedValue(null);
      createMock.mockResolvedValue(makeRecord());

      const res = await POST(makeRequest(validBody));
      const body = await res.json();
      expect(body.resume.claims).toHaveLength(1);
      expect(body.resume.claims[0].assertionText).toBe("Worked at ACME");
    });

    it("preserves styleConfigs inside the transitional payload", async () => {
      mockedSession.mockResolvedValue({ user: { id: "user_a" } });
      findUniqueMock.mockResolvedValue(null);
      createMock.mockResolvedValue(makeRecord());

      const res = await POST(makeRequest(validBody));
      const body = await res.json();
      expect(body.resume.styleConfigs["resume-1"]).toEqual({
        fontFamily: "inter",
        density: "standard",
      });
    });
  });

  describe("read (GET)", () => {
    it("lists the authenticated user's resumes", async () => {
      mockedSession.mockResolvedValue({ user: { id: "user_a" } });
      findManyMock.mockResolvedValue([makeRecord()]);

      const res = await GET();

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.resumes).toHaveLength(1);
      expect(findManyMock).toHaveBeenCalledWith(
        expect.objectContaining({ where: { professionalIdentityId: IDENTITY_A } }),
      );
    });

    it("reads one of the user's own resumes", async () => {
      mockedSession.mockResolvedValue({ user: { id: "user_a" } });
      findUniqueMock.mockResolvedValue(makeRecord());

      const res = await GET_ITEM(makeRequest({}), itemContext());

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.resumeId).toBe("resume-1");
    });

    it("cannot read another user's resume (scoped 404, never leaks existence)", async () => {
      mockedSession.mockResolvedValue({ user: { id: "user_a" } });
      findUniqueMock.mockResolvedValue(null);

      const res = await GET_ITEM(makeRequest({}), itemContext("foreign-resume"));

      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: "Resume not found" });
    });
  });

  describe("update (PUT/PATCH)", () => {
    it("updates the authenticated user's own resume", async () => {
      mockedSession.mockResolvedValue({ user: { id: "user_a" } });
      findUniqueMock.mockResolvedValue(makeRecord());
      updateMock.mockResolvedValue(
        makeRecord({
          resumeName: "Renamed",
          templateId: "executive-pro",
          updatedAt: new Date("2026-02-01T00:00:00.000Z"),
        }),
      );

      const res = await PUT(
        makeRequest({ resumeName: "Renamed", templateId: "executive-pro" }),
        itemContext(),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.resumeName).toBe("Renamed");
      expect(body.templateId).toBe("executive-pro");
      expect(body.updatedAt).toBe("2026-02-01T00:00:00.000Z");
    });

    it("PATCH behaves like PUT", async () => {
      mockedSession.mockResolvedValue({ user: { id: "user_a" } });
      findUniqueMock.mockResolvedValue(makeRecord());
      updateMock.mockResolvedValue(makeRecord());

      const res = await PATCH(makeRequest({ resumeName: "X" }), itemContext());

      expect(res.status).toBe(200);
    });

    it("cannot update another user's resume (404)", async () => {
      mockedSession.mockResolvedValue({ user: { id: "user_a" } });
      findUniqueMock.mockResolvedValue(null);

      const res = await PUT(
        makeRequest({ resumeName: "Hacked" }),
        itemContext("foreign-resume"),
      );

      expect(res.status).toBe(404);
    });

    it("rejects invalid updates with 400", async () => {
      mockedSession.mockResolvedValue({ user: { id: "user_a" } });
      findUniqueMock.mockResolvedValue(makeRecord());

      const res = await PUT(
        makeRequest({ templateId: "not-a-real-template" }),
        itemContext(),
      );

      expect(res.status).toBe(400);
    });
  });

  describe("delete (DELETE)", () => {
    it("deletes the authenticated user's own resume", async () => {
      mockedSession.mockResolvedValue({ user: { id: "user_a" } });
      findUniqueMock.mockResolvedValue(makeRecord());
      deleteMock.mockResolvedValue(makeRecord());

      const res = await DELETE_ITEM(makeRequest({}), itemContext());

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true });
      expect(deleteMock).toHaveBeenCalledTimes(1);
    });

    it("cannot delete another user's resume (404)", async () => {
      mockedSession.mockResolvedValue({ user: { id: "user_a" } });
      findUniqueMock.mockResolvedValue(null);

      const res = await DELETE_ITEM(makeRequest({}), itemContext("foreign-resume"));

      expect(res.status).toBe(404);
    });
  });
});
