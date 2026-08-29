/**
 * C5 — Server Versioning & Optimistic Locking Tests
 *
 * Tests the version field behavior and optimistic locking contract:
 * - New resumes start at version 1
 * - GET returns version
 * - Successful update increments version
 * - Stale update returns 409 CONFLICT
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Use vi.hoisted to ensure mock variables are available when vi.mock is hoisted
const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    resume: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { resumeService, ResumeConflictError, ResumeNotFoundError } from "@/services/resume.service";

const BASE_PAYLOAD = {
  name: "Test User",
  title: "Engineer",
  email: "test@example.com",
  phone: "555-0100",
  address: "",
  nationality: "",
  pronouns: "",
  summary: "Test summary",
  social: { linkedin: "", github: "", website: "", portfolio: "", stackoverflow: "", twitter: "" },
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
  interests: [],
  achievements: [],
  references: [],
  portfolio: [],
  templateId: "modern-clean",
  careerStage: "working-professional" as const,
  claims: [],
  fontPreference: "",
  palettePreference: "",
  exportFormat: "",
  pageSize: "",
};

function makeRecord(version: number, overrides: Record<string, unknown> = {}) {
  return {
    id: "db-id-1",
    resumeId: "resume-1",
    professionalIdentityId: "identity-1",
    resumeName: "Test Resume",
    templateId: "modern-clean",
    careerStage: "working-professional",
    payload: { ...BASE_PAYLOAD, ...overrides },
    version,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-08-01"),
  };
}

describe("C5 — Server Versioning & Optimistic Locking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET returns version", () => {
    it("includes version in server resume response", async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(makeRecord(3));

      const result = await resumeService.get("identity-1", "resume-1");

      expect(result.version).toBe(3);
      expect(result).toHaveProperty("resumeId", "resume-1");
    });
  });

  describe("Successful update increments version", () => {
    it("increments version from 1 to 2 on first update", async () => {
      const recordV1 = makeRecord(1);
      mockPrisma.resume.findUnique.mockResolvedValue(recordV1);
      mockPrisma.resume.update.mockResolvedValue({ ...recordV1, version: 2 });

      const result = await resumeService.update("identity-1", "resume-1", {
        resume: BASE_PAYLOAD,
        baseVersion: 1,
      });

      expect(result.version).toBe(2);
      expect(mockPrisma.resume.update).toHaveBeenCalledWith({
        where: { id: "db-id-1" },
        data: expect.objectContaining({ version: 2 }),
      });
    });

    it("increments version from 2 to 3 on second update", async () => {
      const recordV2 = makeRecord(2);
      mockPrisma.resume.findUnique.mockResolvedValue(recordV2);
      mockPrisma.resume.update.mockResolvedValue({ ...recordV2, version: 3 });

      const result = await resumeService.update("identity-1", "resume-1", {
        resume: BASE_PAYLOAD,
        baseVersion: 2,
      });

      expect(result.version).toBe(3);
    });
  });

  describe("Stale update returns 409 CONFLICT", () => {
    it("throws ResumeConflictError when baseVersion is stale", async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(makeRecord(3));

      await expect(
        resumeService.update("identity-1", "resume-1", {
          resume: BASE_PAYLOAD,
          baseVersion: 2,
        })
      ).rejects.toThrow(ResumeConflictError);

      expect(mockPrisma.resume.update).not.toHaveBeenCalled();
    });

    it("ResumeConflictError carries currentVersion", async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(makeRecord(5));

      try {
        await resumeService.update("identity-1", "resume-1", {
          resume: BASE_PAYLOAD,
          baseVersion: 3,
        });
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ResumeConflictError);
        expect((err as ResumeConflictError).currentVersion).toBe(5);
      }
    });

    it("database remains unchanged after conflict", async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(makeRecord(3, { name: "Original" }));

      try {
        await resumeService.update("identity-1", "resume-1", {
          resume: { ...BASE_PAYLOAD, name: "Hacked" },
          baseVersion: 2,
        });
      } catch {
        // expected
      }

      expect(mockPrisma.resume.update).not.toHaveBeenCalled();
    });
  });

  describe("Update without baseVersion (backward compat)", () => {
    it("succeeds when baseVersion is not provided", async () => {
      const record = makeRecord(5);
      mockPrisma.resume.findUnique.mockResolvedValue(record);
      mockPrisma.resume.update.mockResolvedValue({ ...record, version: 6 });

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
          resume: BASE_PAYLOAD,
          baseVersion: 1,
        })
      ).rejects.toThrow(ResumeNotFoundError);
    });
  });

  describe("New resume starts at version 1", () => {
    it("create produces version 1", async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(null);
      mockPrisma.resume.create.mockResolvedValue(makeRecord(1));

      const result = await resumeService.create("identity-1", {
        resumeId: "resume-new",
        resume: BASE_PAYLOAD,
      });

      expect(result.version).toBe(1);
    });
  });

  describe("List returns version for all resumes", () => {
    it("includes version in each server resume", async () => {
      mockPrisma.resume.findMany.mockResolvedValue([
        makeRecord(1, { name: "Resume A" }),
        makeRecord(5, { name: "Resume B" }),
      ]);

      const results = await resumeService.list("identity-1");

      expect(results).toHaveLength(2);
      expect(results[0].version).toBe(1);
      expect(results[1].version).toBe(5);
    });
  });
});
