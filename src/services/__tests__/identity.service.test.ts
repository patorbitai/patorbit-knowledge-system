import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoisted mock fns are available inside the vi.mock factory (vitest hoists
// factory calls above top-level variables, so define them with vi.hoisted).
const { findUniqueMock, createMock, userFindUniqueMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  createMock: vi.fn(),
  userFindUniqueMock: vi.fn(),
}));

// Mock the Prisma client BEFORE importing the modules under test.
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: userFindUniqueMock },
    professionalIdentity: {
      findUnique: findUniqueMock,
      create: createMock,
    },
  },
}));

import { IdentityService } from "@/services/identity.service";
import { identityRepository } from "@/repositories/identity.repository";

const identity = {
  id: "identity_1",
  userId: "user_1",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("IdentityService.ensureProfessionalIdentity", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    createMock.mockReset();
  });

  it("returns the existing identity when one exists (idempotent)", async () => {
    findUniqueMock.mockResolvedValue(identity);

    const service = new IdentityService();
    const result = await service.ensureProfessionalIdentity("user_1");

    expect(result).toEqual(identity);
    expect(findUniqueMock).toHaveBeenCalledTimes(1);
    expect(findUniqueMock).toHaveBeenCalledWith({ where: { userId: "user_1" } });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("creates a new identity when none exists", async () => {
    findUniqueMock.mockResolvedValue(null);
    userFindUniqueMock.mockResolvedValue({ id: "user_1" });
    createMock.mockResolvedValue(identity);

    const service = new IdentityService();
    const result = await service.ensureProfessionalIdentity("user_1");

    expect(result).toEqual(identity);
    expect(findUniqueMock).toHaveBeenCalledTimes(1);
    expect(createMock).toHaveBeenCalledTimes(1);
    expect(createMock).toHaveBeenCalledWith({ data: { userId: "user_1" } });
  });

  it("throws when userId is missing", async () => {
    const service = new IdentityService();
    await expect(service.ensureProfessionalIdentity("")).rejects.toThrow(
      "ensureProfessionalIdentity: userId is required."
    );
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
  });
});

describe("IdentityRepository", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    createMock.mockReset();
  });

  it("findByUserId queries by userId", async () => {
    findUniqueMock.mockResolvedValue(identity);

    const result = await identityRepository.findByUserId("user_1");

    expect(result).toEqual(identity);
    expect(findUniqueMock).toHaveBeenCalledWith({ where: { userId: "user_1" } });
  });

  it("findById queries by id", async () => {
    findUniqueMock.mockResolvedValue(identity);

    const result = await identityRepository.findById("identity_1");

    expect(result).toEqual(identity);
    expect(findUniqueMock).toHaveBeenCalledWith({ where: { id: "identity_1" } });
  });

  it("create persists a new identity for the userId", async () => {
    userFindUniqueMock.mockResolvedValue({ id: "user_1" });
    createMock.mockResolvedValue(identity);

    const result = await identityRepository.create("user_1");

    expect(result).toEqual(identity);
    expect(createMock).toHaveBeenCalledWith({ data: { userId: "user_1" } });
  });
});
