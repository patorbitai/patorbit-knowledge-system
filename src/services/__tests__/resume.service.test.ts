import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoisted mocks for the Prisma client (see identity.service.test.ts convention).
const { findManyMock, findUniqueMock, createMock, updateMock, deleteMock } =
  vi.hoisted(() => ({
    findManyMock: vi.fn(),
    findUniqueMock: vi.fn(),
    createMock: vi.fn(),
    updateMock: vi.fn(),
    deleteMock: vi.fn(),
  }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    resume: {
      findMany: findManyMock,
      findUnique: findUniqueMock,
      create: createMock,
      update: updateMock,
      delete: deleteMock,
    },
  },
}));

import {
  ResumeService,
  ResumeNotFoundError,
  ResumeValidationError,
} from "@/services/resume.service";

const IDENTITY_A = "identity_a";
const IDENTITY_B = "identity_b";

function makeRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "res_1",
    resumeId: "resume-1",
    professionalIdentityId: IDENTITY_A,
    resumeName: "Arvind Test",
    templateId: "modern-clean",
    careerStage: "working-professional",
    payload: {
      name: "Arvind Test",
      title: "Senior Engineer",
      email: "arvind@example.com",
      templateId: "modern-clean",
      careerStage: "working-professional",
      claims: [
        {
          id: "claim-1",
          assertionText: "Worked at ACME",
          claimType: "Employment",
          sourceActivityId: "experience-0",
          confidence: 0.8,
          reasoning: "From resume",
          verificationStatus: "suggested",
          reviewed: false,
          accepted: false,
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      styleConfigs: { "resume-1": { fontFamily: "inter", density: "standard" } },
    },
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

const validInput = {
  resumeId: "resume-1",
  resumeName: "Arvind Test",
  templateId: "modern-clean",
  resume: {
    name: "Arvind Test",
    title: "Senior Engineer",
    email: "arvind@example.com",
    templateId: "modern-clean",
    careerStage: "working-professional",
    claims: [
      {
        id: "claim-1",
        assertionText: "Worked at ACME",
        claimType: "Employment",
        sourceActivityId: "experience-0",
        confidence: 0.8,
        reasoning: "From resume",
        verificationStatus: "suggested",
        reviewed: false,
        accepted: false,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    styleConfigs: { "resume-1": { fontFamily: "inter", density: "standard" } },
  },
};

describe("ResumeService", () => {
  let service: ResumeService;

  beforeEach(() => {
    findManyMock.mockReset();
    findUniqueMock.mockReset();
    createMock.mockReset();
    updateMock.mockReset();
    deleteMock.mockReset();
    service = new ResumeService();
  });

  describe("create", () => {
    it("creates a resume and returns the canonical server representation", async () => {
      findUniqueMock.mockResolvedValue(null);
      createMock.mockResolvedValue(makeRecord());

      const result = await service.create(IDENTITY_A, validInput);

      expect(createMock).toHaveBeenCalledTimes(1);
      expect(createMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            professionalIdentityId: IDENTITY_A,
            resumeId: "resume-1",
            resumeName: "Arvind Test",
            templateId: "modern-clean",
          }),
        }),
      );
      expect(result.resumeId).toBe("resume-1");
      expect(result.templateId).toBe("modern-clean");
      // Column values are authoritative and synced into the payload.
      expect(result.resume.templateId).toBe("modern-clean");
      expect(result.resume.name).toBe("Arvind Test");
    });

    it("is idempotent: a duplicate resumeId returns the existing resume", async () => {
      const existing = makeRecord();
      findUniqueMock.mockResolvedValue(existing);

      const result = await service.create(IDENTITY_A, validInput);

      expect(createMock).not.toHaveBeenCalled();
      expect(result.resumeId).toBe("resume-1");
    });

    it("treats a concurrent P2002 duplicate as idempotent success", async () => {
      const existing = makeRecord();
      findUniqueMock
        .mockResolvedValueOnce(null) // first existence check
        .mockResolvedValueOnce(existing); // after-race re-fetch
      createMock.mockRejectedValue(
        Object.assign(new Error("Unique constraint failed"), { code: "P2002" }),
      );

      const result = await service.create(IDENTITY_A, validInput);

      expect(result.resumeId).toBe("resume-1");
      expect(createMock).toHaveBeenCalledTimes(1);
    });

    it("rejects a missing resumeId", async () => {
      await expect(
        service.create(IDENTITY_A, { ...validInput, resumeId: "" }),
      ).rejects.toThrow(ResumeValidationError);
    });

    it("rejects an unknown templateId (template registry rules)", async () => {
      await expect(
        service.create(IDENTITY_A, {
          ...validInput,
          templateId: "not-a-real-template",
        }),
      ).rejects.toThrow(ResumeValidationError);
    });

    it("rejects an invalid ResumeSchema payload", async () => {
      await expect(
        service.create(IDENTITY_A, {
          ...validInput,
          resume: { ...validInput.resume, careerStage: "not-a-stage" },
        }),
      ).rejects.toThrow(ResumeValidationError);
    });

    it("preserves claims inside the transitional payload", async () => {
      findUniqueMock.mockResolvedValue(null);
      createMock.mockResolvedValue(makeRecord());

      const result = await service.create(IDENTITY_A, validInput);

      expect(result.resume.claims).toHaveLength(1);
      expect(result.resume.claims?.[0]?.assertionText).toBe("Worked at ACME");
    });

    it("preserves styleConfigs inside the payload", async () => {
      findUniqueMock.mockResolvedValue(null);
      createMock.mockResolvedValue(makeRecord());

      const result = await service.create(IDENTITY_A, validInput);

      expect(result.resume.styleConfigs).toEqual({
        "resume-1": { fontFamily: "inter", density: "standard" },
      });
    });

    it("defaults styleConfigs to {} when absent (additive, non-breaking)", async () => {
      findUniqueMock.mockResolvedValue(null);
      createMock.mockResolvedValue(
        makeRecord({
          payload: { name: "X", templateId: "modern-clean", careerStage: "student" },
        }),
      );

      const result = await service.create(IDENTITY_A, {
        ...validInput,
        resume: { name: "X", templateId: "modern-clean", careerStage: "student" },
      });

      expect(result.resume.styleConfigs).toEqual({});
    });
  });

  describe("get / list", () => {
    it("lists all resumes for an identity", async () => {
      findManyMock.mockResolvedValue([makeRecord()]);

      const result = await service.list(IDENTITY_A);

      expect(result).toHaveLength(1);
      expect(findManyMock).toHaveBeenCalledWith(
        expect.objectContaining({ where: { professionalIdentityId: IDENTITY_A } }),
      );
    });

    it("returns a scoped resume by resumeId", async () => {
      findUniqueMock.mockResolvedValue(makeRecord());

      const result = await service.get(IDENTITY_A, "resume-1");

      expect(findUniqueMock).toHaveBeenCalledWith({
        where: {
          professionalIdentityId_resumeId: {
            professionalIdentityId: IDENTITY_A,
            resumeId: "resume-1",
          },
        },
      });
      expect(result.resumeId).toBe("resume-1");
    });

    it("throws ResumeNotFoundError for a foreign/missing resume (no cross-user read)", async () => {
      findUniqueMock.mockResolvedValue(null);

      await expect(service.get(IDENTITY_B, "resume-1")).rejects.toThrow(
        ResumeNotFoundError,
      );
    });
  });

  describe("update", () => {
    it("updates own resume and returns a new updatedAt", async () => {
      const existing = makeRecord();
      const updated = makeRecord({
        updatedAt: new Date("2026-02-01T00:00:00.000Z"),
        templateId: "executive-pro",
        resumeName: "Renamed",
      });
      findUniqueMock.mockResolvedValue(existing);
      updateMock.mockResolvedValue(updated);

      const result = await service.update(IDENTITY_A, "resume-1", {
        resumeName: "Renamed",
        templateId: "executive-pro",
      });

      expect(updateMock).toHaveBeenCalledTimes(1);
      expect(result.resumeName).toBe("Renamed");
      expect(result.templateId).toBe("executive-pro");
      // updatedAt changed (Phase-0 staleness signal).
      expect(result.updatedAt).toBe("2026-02-01T00:00:00.000Z");
    });

    it("merges: absent fields keep their current values", async () => {
      const existing = makeRecord();
      findUniqueMock.mockResolvedValue(existing);
      updateMock.mockResolvedValue(
        makeRecord({
          payload: { ...existing.payload, name: "New Name" },
        }),
      );

      const result = await service.update(IDENTITY_A, "resume-1", {
        resume: { ...validInput.resume, name: "New Name" },
      });

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "res_1" },
          data: expect.objectContaining({
            templateId: "modern-clean", // from existing row
            careerStage: "working-professional", // from existing row
          }),
        }),
      );
      expect(result.resume.name).toBe("New Name");
    });

    it("rejects an unknown templateId on update", async () => {
      findUniqueMock.mockResolvedValue(makeRecord());

      await expect(
        service.update(IDENTITY_A, "resume-1", { templateId: "bogus" }),
      ).rejects.toThrow(ResumeValidationError);
    });

    it("throws ResumeNotFoundError when updating a foreign/missing resume", async () => {
      findUniqueMock.mockResolvedValue(null);

      await expect(
        service.update(IDENTITY_B, "resume-1", { resumeName: "X" }),
      ).rejects.toThrow(ResumeNotFoundError);
    });
  });

  describe("delete", () => {
    it("deletes own resume", async () => {
      findUniqueMock.mockResolvedValue(makeRecord());
      deleteMock.mockResolvedValue(makeRecord());

      await expect(service.delete(IDENTITY_A, "resume-1")).resolves.toBe(true);
    });

    it("throws ResumeNotFoundError when deleting a foreign/missing resume", async () => {
      findUniqueMock.mockResolvedValue(null);

      await expect(service.delete(IDENTITY_B, "resume-1")).rejects.toThrow(
        ResumeNotFoundError,
      );
    });
  });
});
