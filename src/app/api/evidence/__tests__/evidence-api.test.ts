"use strict";

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ───────────────────────────────────────────────────────────────────

const { findUniqueMock, findManyMock, createMock, deleteMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  findManyMock: vi.fn(),
  createMock: vi.fn(),
  deleteMock: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    evidenceRecord: {
      findUnique: findUniqueMock,
      findMany: findManyMock,
      create: createMock,
      delete: deleteMock,
    },
  },
}));
vi.mock("@/services/entitlement.service", () => ({
  entitlementService: {
    getUserEntitlements: vi.fn().mockResolvedValue({
      tier: "Professional", status: "active", isActive: true,
      features: { evidence: true },
    }),
    hasFeature: vi.fn().mockResolvedValue(true),
    checkResumeLimit: vi.fn().mockResolvedValue({ allowed: true, current: 0, max: -1 }),
  },
}));
vi.mock("@/services/usage.service", () => ({
  usageService: {
    checkAndIncrementUsage: vi.fn().mockResolvedValue({ allowed: true, current: 1, limit: -1, remaining: -1 }),
    getCurrentPeriodKey: vi.fn().mockReturnValue("2026-09"),
  },
}));
vi.mock("@/services/evidence-storage.service", () => ({
  evidenceStorageService: {
    uploadFile: vi.fn().mockResolvedValue("evd_test_key"),
    getFile: vi.fn(),
    deleteFile: vi.fn(),
  },
}));

import { getServerSession } from "next-auth";
import { GET, POST } from "@/app/api/evidence/route";
import { NextRequest } from "next/server";

const mockSession = getServerSession as ReturnType<typeof vi.fn>;

function makeRequest(body?: unknown, method = "POST"): NextRequest {
  const init: { method: string; body?: string; headers?: Record<string, string> } = { method };
  if (body && method === "POST") {
    init.body = JSON.stringify(body);
    init.headers = { "content-type": "application/json" };
  }
  return new NextRequest("http://localhost/api/evidence", init as any);
}

function makeIdRequest(id: string, method = "GET"): NextRequest {
  return new NextRequest(`http://localhost/api/evidence/${id}`, { method });
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Evidence API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET /api/evidence ────────────────────────────────────────────

  it("GET returns 401 when unauthenticated", async () => {
    mockSession.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("GET returns evidence list for authenticated user", async () => {
    mockSession.mockResolvedValue({ user: { id: "user1" } });
    findManyMock.mockResolvedValue([
      {
        id: "evd_1", userId: "user1", claimId: "c1", evidenceType: "link",
        evidenceKind: "GitHub Repository", content: "https://github.com/test",
        format: "link", metadata: '{"linkTitle":"test"}', status: "evidence-added",
        confidence: 0.7, notes: "", visibility: "private", consent: true,
        createdAt: new Date(), updatedAt: new Date(),
      },
    ]);
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.evidence).toHaveLength(1);
    expect(body.evidence[0].id).toBe("evd_1");
  });

  // ── POST /api/evidence ───────────────────────────────────────────

  it("POST returns 401 when unauthenticated", async () => {
    mockSession.mockResolvedValue(null);
    const res = await POST(makeRequest({ claimId: "c1", evidenceKind: "GitHub Repository", consent: true }));
    expect(res.status).toBe(401);
  });

  it("POST creates evidence record", async () => {
    mockSession.mockResolvedValue({ user: { id: "user1" } });
    createMock.mockResolvedValue({
      id: "evd_new", userId: "user1", claimId: "c1", evidenceType: "link",
      evidenceKind: "GitHub Repository", content: "https://github.com/test",
      format: "link", metadata: '{"linkTitle":"test"}', status: "evidence-added",
      confidence: 0.7, notes: "", visibility: "private", consent: true,
      createdAt: new Date(), updatedAt: new Date(),
    });
    const res = await POST(makeRequest({
      claimId: "c1", evidenceKind: "GitHub Repository", link: "https://github.com/test", consent: true,
    }));
    expect(res.status).toBe(201);
    expect(createMock).toHaveBeenCalled();
  });

  it("POST returns 400 when claimId missing", async () => {
    mockSession.mockResolvedValue({ user: { id: "user1" } });
    const res = await POST(makeRequest({ evidenceKind: "GitHub Repository", consent: true }));
    expect(res.status).toBe(400);
  });

  it("POST returns 400 when consent not given", async () => {
    mockSession.mockResolvedValue({ user: { id: "user1" } });
    const res = await POST(makeRequest({ claimId: "c1", evidenceKind: "GitHub Repository", consent: false }));
    expect(res.status).toBe(400);
  });


});
