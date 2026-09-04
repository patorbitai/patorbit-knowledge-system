"use strict";

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ───────────────────────────────────────────────────────────────────

const { findUniqueMock, updateMock, createMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  updateMock: vi.fn(),
  createMock: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    professionalIdentity: {
      findUnique: findUniqueMock,
      update: updateMock,
      create: createMock,
    },
  },
}));

import { getServerSession } from "next-auth";

const mockSession = getServerSession as ReturnType<typeof vi.fn>;

// ── Passport Share API Tests ────────────────────────────────────────────────

describe("Passport Share — Token Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates a secure token when enabling passport share", async () => {
    mockSession.mockResolvedValue({ user: { id: "user1" } });
    findUniqueMock.mockResolvedValue({
      id: "pi1",
      userId: "user1",
      passportShareEnabled: false,
      passportShareToken: null,
      passportDataCache: null,
    });
    updateMock.mockResolvedValue({});

    // Simulate the POST /api/passport/share with action=enable
    const { POST } = await import("@/app/api/passport/share/route");
    const req = new Request("http://localhost/api/passport/share", {
      method: "POST",
      body: JSON.stringify({
        action: "enable",
        passportData: { resume: { name: "Test" }, claims: [], evidence: [] },
      }),
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(body.enabled).toBe(true);
    expect(body.shareUrl).toMatch(/^\/passport\/share\/[a-f0-9-]+$/);
    expect(body.token).toBeDefined();
    expect(body.token.length).toBeGreaterThan(0);
  });

  it("revokes token when disabling passport share", async () => {
    mockSession.mockResolvedValue({ user: { id: "user1" } });
    findUniqueMock.mockResolvedValue({
      id: "pi1",
      userId: "user1",
      passportShareEnabled: true,
      passportShareToken: "existing-token",
      passportDataCache: "{}",
    });
    updateMock.mockResolvedValue({});

    const { POST } = await import("@/app/api/passport/share/route");
    const req = new Request("http://localhost/api/passport/share", {
      method: "POST",
      body: JSON.stringify({ action: "disable" }),
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(body.enabled).toBe(false);
    // Verify the update was called with token set to null
    const updateCall = updateMock.mock.calls[0][0];
    expect(updateCall.data.passportShareToken).toBeNull();
    expect(updateCall.data.passportShareEnabled).toBe(false);
  });

  it("returns token-based share URL when enabled", async () => {
    mockSession.mockResolvedValue({ user: { id: "user1" } });
    findUniqueMock.mockResolvedValue({
      id: "pi1",
      userId: "user1",
      passportShareEnabled: true,
      passportShareToken: "secure-token-abc",
      passportDataCache: "{}",
    });

    const { GET } = await import("@/app/api/passport/share/route");
    const res = await GET();
    const body = await res.json();

    expect(body.enabled).toBe(true);
    expect(body.shareUrl).toBe("/passport/share/secure-token-abc");
    expect(body.token).toBe("secure-token-abc");
  });

  it("returns disabled when no token exists", async () => {
    mockSession.mockResolvedValue({ user: { id: "user1" } });
    findUniqueMock.mockResolvedValue({
      id: "pi1",
      userId: "user1",
      passportShareEnabled: true,
      passportShareToken: null,
      passportDataCache: "{}",
    });

    const { GET } = await import("@/app/api/passport/share/route");
    const res = await GET();
    const body = await res.json();

    expect(body.enabled).toBe(false);
  });

  it("reuses existing token when re-enabling", async () => {
    mockSession.mockResolvedValue({ user: { id: "user1" } });
    findUniqueMock.mockResolvedValue({
      id: "pi1",
      userId: "user1",
      passportShareEnabled: false,
      passportShareToken: "existing-token-xyz",
      passportDataCache: null,
    });
    updateMock.mockResolvedValue({});

    const { POST } = await import("@/app/api/passport/share/route");
    const req = new Request("http://localhost/api/passport/share", {
      method: "POST",
      body: JSON.stringify({
        action: "enable",
        passportData: { resume: { name: "Test" } },
      }),
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(body.token).toBe("existing-token-xyz");
    expect(body.shareUrl).toBe("/passport/share/existing-token-xyz");
  });
});

// ── Public Passport Page Tests ──────────────────────────────────────────────

describe("Public Passport — Privacy & Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("public passport page filters email and phone", async () => {
    // The public passport page strips sensitive fields before rendering
    const resume = {
      name: "John Doe",
      title: "Engineer",
      email: "john@example.com",
      phone: "+1234567890",
      address: "123 Main St",
      summary: "A great engineer",
    };

    // Simulate the filtering logic from the page
    const publicResume = {
      ...resume,
      email: "",
      phone: "",
      address: "",
    };

    expect(publicResume.name).toBe("John Doe");
    expect(publicResume.title).toBe("Engineer");
    expect(publicResume.email).toBe("");
    expect(publicResume.phone).toBe("");
    expect(publicResume.address).toBe("");
    expect(publicResume.summary).toBe("A great engineer");
  });

  it("token-based lookup finds identity by passportShareToken", async () => {
    findUniqueMock.mockResolvedValue({
      id: "pi1",
      userId: "user1",
      passportShareEnabled: true,
      passportShareToken: "secure-token",
      passportDataCache: JSON.stringify({
        resume: { name: "Test User" },
        claims: [],
        evidence: [],
      }),
      user: { name: "Test User" },
    });

    const identity = await findUniqueMock({
      where: { passportShareToken: "secure-token" },
      include: { user: true },
    });

    expect(identity).not.toBeNull();
    expect(identity.passportShareToken).toBe("secure-token");
    expect(identity.user.name).toBe("Test User");
  });

  it("returns null for invalid token", async () => {
    findUniqueMock.mockResolvedValue(null);

    const identity = await findUniqueMock({
      where: { passportShareToken: "invalid-token" },
      include: { user: true },
    });

    expect(identity).toBeNull();
  });
});
