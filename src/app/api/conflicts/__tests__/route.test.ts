"use strict";

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const mockEnsureIdentity = vi.fn();
const mockDetectConflicts = vi.fn();
const mockListConflicts = vi.fn();

vi.mock("@/services/identity.service", () => ({
  identityService: {
    ensureProfessionalIdentity: (...args: unknown[]) => mockEnsureIdentity(...args),
  },
}));

vi.mock("@/services/conflict.service", () => ({
  conflictService: {
    detectConflicts: (...args: unknown[]) => mockDetectConflicts(...args),
    listConflicts: (...args: unknown[]) => mockListConflicts(...args),
  },
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

// ── Import after mocks ─────────────────────────────────────────

import { GET, POST } from "../route";
import { getServerSession } from "next-auth";

// ── Tests ──────────────────────────────────────────────────────

describe("GET /api/conflicts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for unauthenticated requests", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as any);
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("returns conflicts for authenticated user", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "user_1" } } as any);
    mockEnsureIdentity.mockResolvedValue({ id: "pi_1" });
    mockListConflicts.mockResolvedValue([]);

    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.conflicts).toEqual([]);
  });
});

describe("POST /api/conflicts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for unauthenticated requests", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as any);
    const response = await POST({} as any);
    expect(response.status).toBe(401);
  });

  it("runs detection and returns result", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "user_1" } } as any);
    mockEnsureIdentity.mockResolvedValue({ id: "pi_1" });
    mockDetectConflicts.mockResolvedValue({
      newConflicts: [],
      totalDetected: 0,
      claimsCompared: 3,
      detectedAt: new Date().toISOString(),
    });

    const response = await POST({} as any);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.totalDetected).toBe(0);
    expect(body.claimsCompared).toBe(3);
  });
});
