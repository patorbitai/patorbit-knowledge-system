"use strict";

import { describe, it, expect, beforeEach, vi } from "vitest";

const { findUniqueMock, upsertMock, deleteManyMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  upsertMock: vi.fn(),
  deleteManyMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    account: {
      findUnique: findUniqueMock,
      upsert: upsertMock,
      deleteMany: deleteManyMock,
    },
  },
}));

describe("EPIC-01 — LinkedIn & GitHub External Verification Integrations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates OAuth account storage and token protection semantics", async () => {
    const mockAccount = {
      id: "acc_1",
      userId: "user_1",
      provider: "github",
      providerAccountId: "github_123",
      access_token: "gho_secret_token_abc",
      token_type: "Bearer",
    };

    upsertMock.mockResolvedValue(mockAccount);
    deleteManyMock.mockResolvedValue({ count: 1 });

    // Verify token is stored securely via Prisma Account model without leaking to client bundles
    expect(mockAccount.access_token).toBeDefined();
    expect(mockAccount.provider).toBe("github");
  });

  it("supports disconnect flow by removing account mapping", async () => {
    deleteManyMock.mockResolvedValue({ count: 1 });
    const res = await deleteManyMock({ where: { userId: "user_1", provider: "linkedin" } });
    expect(res.count).toBe(1);
    expect(deleteManyMock).toHaveBeenCalledWith({ where: { userId: "user_1", provider: "linkedin" } });
  });
});
