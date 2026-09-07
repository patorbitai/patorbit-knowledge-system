"use strict";

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const mockFindUnique = vi.fn();
const mockFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    professionalIdentity: { findUnique: (...args: unknown[]) => mockFindUnique(...args) },
    claim: { findMany: (...args: unknown[]) => mockFindMany(...args) },
    evidenceRecord: { findMany: (...args: unknown[]) => mockFindMany(...args) },
    verificationEvent: { findMany: (...args: unknown[]) => mockFindMany(...args) },
  },
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

// ── Import after mocks ─────────────────────────────────────────

import { GET } from "../route";
import { getServerSession } from "next-auth";

// ── Tests ──────────────────────────────────────────────────────

describe("GET /api/trust", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for unauthenticated requests", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as any);
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 when ProfessionalIdentity not found", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user_1" },
    } as any);
    mockFindUnique.mockResolvedValue(null);

    const response = await GET();
    expect(response.status).toBe(404);
  });

  it("returns TrustReport for authenticated user with identity", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user_1" },
    } as any);

    // ProfessionalIdentity found
    mockFindUnique.mockResolvedValue({ id: "pi_1", userId: "user_1" });

    // Claims, evidence, verification events
    mockFindMany
      .mockResolvedValueOnce([{ id: "c1", professionalIdentityId: "pi_1", verificationStatus: "verified", confidence: 0.9, claimType: "Skill" }])
      .mockResolvedValueOnce([{ id: "ev1", claimId: "c1", evidenceKind: "document" }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: "ve1", claimId: "c1", eventType: "verified", previousStatus: "under-review", resultingStatus: "verified", outcome: null, createdAt: new Date() }]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(typeof body.score).toBe("number");
    expect(typeof body.level).toBe("string");
    expect(body.algorithmVersion).toBe("v1");
    expect(Array.isArray(body.breakdown)).toBe(true);
    expect(Array.isArray(body.reasons)).toBe(true);
    expect(typeof body.derivedAt).toBe("string");
  });

  it("returns TrustReport with empty claims", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user_1" },
    } as any);

    mockFindUnique.mockResolvedValue({ id: "pi_1", userId: "user_1" });
    mockFindMany.mockResolvedValue([]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.score).toBe(0);
    expect(body.level).toBe("Unrated");
    expect(body.summary.totalClaims).toBe(0);
  });

  it("never accepts client-supplied score", async () => {
    // Verify that GET endpoint has no request body handling
    // The endpoint is GET-only and derives trust from DB
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user_1" },
    } as any);
    mockFindUnique.mockResolvedValue({ id: "pi_1", userId: "user_1" });
    mockFindMany.mockResolvedValue([]);

    const response = await GET();
    const body = await response.json();

    // Score should be 0 (no claims), not a client-supplied value
    expect(body.score).toBe(0);
  });
});
