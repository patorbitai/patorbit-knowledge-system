import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted so these are available when vi.mock is hoisted
const { mockFindUnique, mockCreate, mockPfFindUnique } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockCreate: vi.fn(),
  mockPfFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: mockFindUnique },
    professionalIdentity: { create: mockCreate, findUnique: mockPfFindUnique },
  },
}));

import { identityRepository } from "../identity.repository";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("identityRepository.create", () => {
  it("creates ProfessionalIdentity when User exists", async () => {
    mockFindUnique.mockResolvedValue({ id: "user-123" });
    mockCreate.mockResolvedValue({ id: "identity-456", userId: "user-123" });

    const result = await identityRepository.create("user-123");

    // Should check User exists first
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: "user-123" },
      select: { id: true },
    });

    // Should create identity
    expect(mockCreate).toHaveBeenCalledWith({
      data: { userId: "user-123" },
    });

    expect(result.userId).toBe("user-123");
  });

  it("throws safe error when User does not exist", async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(identityRepository.create("nonexistent-user")).rejects.toThrow(
      "User not found",
    );

    // Should NOT attempt to create ProfessionalIdentity
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("error message does not expose internal details", async () => {
    mockFindUnique.mockResolvedValue(null);

    try {
      await identityRepository.create("nonexistent-user");
      expect.fail("Should have thrown");
    } catch (err: unknown) {
      const message = (err as Error).message;
      // Should NOT contain Prisma details, table names, constraint names
      expect(message).not.toContain("prisma");
      expect(message).not.toContain("ProfessionalIdentity");
      expect(message).not.toContain("fkey");
      expect(message).not.toContain("foreign key");
      // Should contain safe, user-friendly guidance
      expect(message).toContain("session");
      expect(message).toContain("sign in");
    }
  });
});

describe("identityRepository.findByUserId", () => {
  it("returns identity when it exists", async () => {
    mockPfFindUnique.mockResolvedValue({ id: "identity-1", userId: "user-1" });
    const result = await identityRepository.findByUserId("user-1");
    expect(result).toBeDefined();
  });

  it("returns null when identity does not exist", async () => {
    mockPfFindUnique.mockResolvedValue(null);
    const result = await identityRepository.findByUserId("nonexistent");
    expect(result).toBeNull();
  });
});
