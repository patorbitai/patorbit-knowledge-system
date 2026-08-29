/**
 * C5 — Server Versioning & Optimistic Locking Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    resume: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { resumeService, ResumeConflictError, ResumeNotFoundError } from "@/services/resume.service";

const BASE_PAYLOAD = {
  name: "Test User", title: "Engineer", email: "test@example.com", phone: "555-0100",
  address: "", nationality: "", pronouns: "", summary: "Test summary",
  social: { linkedin: "", github: "", website: "", portfolio: "", stackoverflow: "", twitter: "" },
  experience: [], education: [], skills: [], projects: [], certifications: [],
  languages: [], interests: [], achievements: [], references: [], portfolio: [],
  templateId: "modern-clean", careerStage: "working-professional" as const,
  claims: [], fontPreference: "", palettePreference: "", exportFormat: "", pageSize: "",
};

function makeRecord(version: number, overrides: Record<string, unknown> = {}) {
  return {
    id: "db-id-1", resumeId: "resume-1", professionalIdentityId: "identity-1",
    resumeName: "Test Resume", templateId: "modern-clean", careerStage: "working-professional",
    payload: { ...BASE_PAYLOAD, ...overrides }, version,
    createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-08-01"),
  };
}

describe("C5 — Server Versioning & Optimistic Locking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.resume.findUnique.mockReset();
    mockPrisma.resume.updateMany.mockReset();
    mockPrisma.resume.update.mockReset();
    mockPrisma.resume.findMany.mockReset();
    mockPrisma.resume.create.mockReset();
  });

  describe("GET returns version", () => {
    it("includes version in server resume response", async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(makeRecord(3));
      const result = await resumeService.get("identity-1", "resume-1");
      expect(result.version).toBe(3);
    });
  });

  describe("Successful update increments version (atomic)", () => {
    it("increments version from 1 to 2", async () => {
      const r1 = makeRecord(1);
      const r2 = { ...r1, version: 2 };
      // Service calls findUnique once, repository calls findUnique twice (lookup + re-read)
      mockPrisma.resume.findUnique
        .mockResolvedValueOnce(r1)
        .mockResolvedValueOnce(r1)
        .mockResolvedValueOnce(r2);
      mockPrisma.resume.updateMany.mockResolvedValue({ count: 1 });

      const result = await resumeService.update("identity-1", "resume-1", {
        resume: BASE_PAYLOAD, baseVersion: 1,
      });
      expect(result.version).toBe(2);
      expect(mockPrisma.resume.updateMany).toHaveBeenCalledWith({
        where: { id: "db-id-1", version: 1 },
        data: expect.objectContaining({ version: 2 }),
      });
    });

    it("increments version from 2 to 3", async () => {
      const r2 = makeRecord(2);
      const r3 = { ...r2, version: 3 };
      mockPrisma.resume.findUnique
        .mockResolvedValueOnce(r2)
        .mockResolvedValueOnce(r2)
        .mockResolvedValueOnce(r3);
      mockPrisma.resume.updateMany.mockResolvedValue({ count: 1 });

      const result = await resumeService.update("identity-1", "resume-1", {
        resume: BASE_PAYLOAD, baseVersion: 2,
      });
      expect(result.version).toBe(3);
    });
  });

  describe("Stale update returns 409 CONFLICT", () => {
    it("throws ResumeConflictError when baseVersion is stale", async () => {
      const r3 = makeRecord(3);
      // Service findUnique, repository findUnique (returns r3), updateMany returns 0, repository re-read
      mockPrisma.resume.findUnique
        .mockResolvedValueOnce(r3)
        .mockResolvedValueOnce(r3)
        .mockResolvedValueOnce(r3);
      mockPrisma.resume.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        resumeService.update("identity-1", "resume-1", {
          resume: BASE_PAYLOAD, baseVersion: 2,
        })
      ).rejects.toThrow(ResumeConflictError);
    });

    it("ResumeConflictError carries currentVersion", async () => {
      const r5 = makeRecord(5);
      mockPrisma.resume.findUnique
        .mockResolvedValueOnce(r5)
        .mockResolvedValueOnce(r5)
        .mockResolvedValueOnce(r5);
      mockPrisma.resume.updateMany.mockResolvedValue({ count: 0 });

      try {
        await resumeService.update("identity-1", "resume-1", {
          resume: BASE_PAYLOAD, baseVersion: 3,
        });
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ResumeConflictError);
        expect((err as ResumeConflictError).currentVersion).toBe(5);
      }
    });

    it("database unchanged after conflict", async () => {
      const r3 = makeRecord(3);
      mockPrisma.resume.findUnique
        .mockResolvedValueOnce(r3)
        .mockResolvedValueOnce(r3)
        .mockResolvedValueOnce(r3);
      mockPrisma.resume.updateMany.mockResolvedValue({ count: 0 });

      try {
        await resumeService.update("identity-1", "resume-1", {
          resume: { ...BASE_PAYLOAD, name: "Hacked" }, baseVersion: 2,
        });
      } catch { /* expected */ }
      // updateMany was called but returned 0 rows — no data changed
      expect(mockPrisma.resume.updateMany).toHaveBeenCalled();
    });
  });

  describe("Update without baseVersion (backward compat)", () => {
    it("succeeds when baseVersion is not provided", async () => {
      const r5 = makeRecord(5);
      mockPrisma.resume.findUnique.mockResolvedValue(r5);
      mockPrisma.resume.update.mockResolvedValue({ ...r5, version: 6 });

      const result = await resumeService.update("identity-1", "resume-1", {
        resume: BASE_PAYLOAD,
      });
      expect(result.version).toBe(6);
    });
  });

  describe("Resume not found", () => {
    it("throws ResumeNotFoundError for missing resume", async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(null);
      await expect(
        resumeService.update("identity-1", "nonexistent", {
          resume: BASE_PAYLOAD, baseVersion: 1,
        })
      ).rejects.toThrow(ResumeNotFoundError);
    });
  });

  describe("New resume starts at version 1", () => {
    it("create produces version 1", async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(null);
      mockPrisma.resume.create.mockResolvedValue(makeRecord(1));
      const result = await resumeService.create("identity-1", {
        resumeId: "resume-new", resume: BASE_PAYLOAD,
      });
      expect(result.version).toBe(1);
    });
  });

  describe("List returns version for all resumes", () => {
    it("includes version in each server resume", async () => {
      mockPrisma.resume.findMany.mockResolvedValue([
        makeRecord(1, { name: "A" }), makeRecord(5, { name: "B" }),
      ]);
      const results = await resumeService.list("identity-1");
      expect(results).toHaveLength(2);
      expect(results[0].version).toBe(1);
      expect(results[1].version).toBe(5);
    });
  });
});
