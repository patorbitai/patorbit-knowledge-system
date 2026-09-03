"use strict";

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────

const mockIdentity = { id: "pi_test_123", userId: "user_123" };
const mockApplication = {
  id: "approw_123",
  applicationId: "app_123",
  professionalIdentityId: "pi_test_123",
  title: "Senior Data Engineer",
  companyName: "Microsoft",
  jobDescription: "We are looking for a Senior Data Engineer with Python and Azure experience.",
  status: "saved",
  resumeId: null,
  matchScore: null,
  matchData: null,
  createdAt: new Date("2026-09-01"),
  updatedAt: new Date("2026-09-01"),
};

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/services/identity.service", () => ({
  identityService: {
    ensureProfessionalIdentity: vi.fn().mockResolvedValue(mockIdentity),
  },
}));

vi.mock("@/services/job-application.service", () => {
  const applications: Record<string, typeof mockApplication> = {};
  return {
    jobApplicationService: {
      list: vi.fn().mockImplementation(async () => Object.values(applications)),
      get: vi.fn().mockImplementation(async (piId: string, appId: string) => {
        const app = applications[appId];
        if (!app) throw new Error("Application not found");
        return app;
      }),
      create: vi.fn().mockImplementation(async (piId: string, input: any) => {
        const app = {
          ...mockApplication,
          applicationId: `app_${Date.now()}`,
          title: input.title,
          companyName: input.companyName,
          jobDescription: input.jobDescription,
          resumeId: input.resumeId ?? null,
        };
        applications[app.applicationId] = app;
        return app;
      }),
      update: vi.fn().mockImplementation(async (piId: string, appId: string, input: any) => {
        const app = applications[appId];
        if (!app) throw new Error("Application not found");
        Object.assign(app, input, { updatedAt: new Date() });
        return app;
      }),
      delete: vi.fn().mockImplementation(async (piId: string, appId: string) => {
        if (!applications[appId]) throw new Error("Application not found");
        delete applications[appId];
        return true;
      }),
      JobApplicationValidationError: class extends Error {},
      JobApplicationNotFoundError: class extends Error {},
    },
  };
});

// ─── Tests ────────────────────────────────────────────────────

describe("C55 — Job Application API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/applications", () => {
    it("creates a new job application", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: "user_123", name: "Test User", email: "test@example.com" },
      } as any);

      const { POST } = await import("../route");
      const req = new Request("http://localhost/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Senior Data Engineer",
          companyName: "Microsoft",
          jobDescription: "We are looking for a Senior Data Engineer with Python and Azure experience.",
        }),
      });

      const res = await POST(req as any);
      expect(res.status).toBe(201);

      const data = await res.json();
      expect(data.title).toBe("Senior Data Engineer");
      expect(data.companyName).toBe("Microsoft");
    });

    it("returns 401 when not authenticated", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { POST } = await import("../route");
      const req = new Request("http://localhost/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Test",
          companyName: "Test Corp",
          jobDescription: "Test description",
        }),
      });

      const res = await POST(req as any);
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/applications", () => {
    it("returns applications for authenticated user", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: "user_123", name: "Test User", email: "test@example.com" },
      } as any);

      const { GET } = await import("../route");
      const req = new Request("http://localhost/api/applications");

      const res = await GET();
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toHaveProperty("applications");
    });
  });
});
