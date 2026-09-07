import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoisted mock fns for Prisma
const { resumeFindFirstMock, applicationCreateMock, applicationUpdateMock } =
  vi.hoisted(() => ({
    resumeFindFirstMock: vi.fn(),
    applicationCreateMock: vi.fn(),
    applicationUpdateMock: vi.fn(),
  }));

// Mock Prisma client BEFORE importing the service
vi.mock("@/lib/prisma", () => ({
  prisma: {
    resume: {
      findFirst: resumeFindFirstMock,
    },
    jobApplication: {
      create: applicationCreateMock,
      update: applicationUpdateMock,
    },
  },
}));

// Mock the repository to use our Prisma mocks
vi.mock("@/repositories/job-application.repository", () => ({
  jobApplicationRepository: {
    create: vi.fn().mockImplementation(async (data: any) => ({
      id: data.id,
      applicationId: data.applicationId,
      professionalIdentityId: data.professionalIdentityId,
      title: data.title,
      companyName: data.companyName,
      jobDescription: data.jobDescription,
      status: "saved",
      resumeId: data.resumeId ?? null,
      matchScore: null,
      matchData: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    update: vi.fn().mockImplementation(async (appId: string, piId: string, data: any) => ({
      id: "approw_123",
      applicationId: appId,
      professionalIdentityId: piId,
      title: "Updated Title",
      companyName: "Updated Company",
      jobDescription: "Updated Description",
      status: data.status || "saved",
      resumeId: data.resumeId ?? null,
      matchScore: null,
      matchData: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    findByApplicationIdAndIdentity: vi.fn(),
    findAllByProfessionalIdentity: vi.fn().mockResolvedValue([]),
    deleteByApplicationIdAndIdentity: vi.fn().mockResolvedValue(true),
    updateMatchData: vi.fn(),
  },
}));

import { JobApplicationService, JobApplicationValidationError } from "@/services/job-application.service";

describe("JobApplicationService — Resume Ownership Validation", () => {
  let service: JobApplicationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new JobApplicationService();
  });

  describe("create — resume ownership", () => {
    it("allows creating an application with a resumeId belonging to the user", async () => {
      // Resume belongs to User A
      resumeFindFirstMock.mockResolvedValue({
        id: "resume_1",
        resumeId: "resume_user_a",
        professionalIdentityId: "pi_user_a",
      });

      const result = await service.create("pi_user_a", {
        title: "Software Engineer",
        companyName: "Tech Corp",
        jobDescription: "Build great things",
        resumeId: "resume_user_a",
      });

      expect(result).toBeDefined();
      expect(result.resumeId).toBe("resume_user_a");
      expect(resumeFindFirstMock).toHaveBeenCalledWith({
        where: {
          resumeId: "resume_user_a",
          professionalIdentityId: "pi_user_a",
        },
      });
    });

    it("rejects resumeId belonging to another Professional Identity", async () => {
      // Resume belongs to User B, but User A is trying to use it
      resumeFindFirstMock.mockResolvedValue(null); // Resume not found for User A

      await expect(
        service.create("pi_user_a", {
          title: "Software Engineer",
          companyName: "Tech Corp",
          jobDescription: "Build great things",
          resumeId: "resume_user_b", // This resume belongs to User B
        })
      ).rejects.toThrow(JobApplicationValidationError);

      await expect(
        service.create("pi_user_a", {
          title: "Software Engineer",
          companyName: "Tech Corp",
          jobDescription: "Build great things",
          resumeId: "resume_user_b",
        })
      ).rejects.toThrow("The selected resume does not belong to your account");

      // Verify the query was made with User A's identity
      expect(resumeFindFirstMock).toHaveBeenCalledWith({
        where: {
          resumeId: "resume_user_b",
          professionalIdentityId: "pi_user_a",
        },
      });
    });

    it("allows creating an application without a resumeId", async () => {
      const result = await service.create("pi_user_a", {
        title: "Software Engineer",
        companyName: "Tech Corp",
        jobDescription: "Build great things",
      });

      expect(result).toBeDefined();
      expect(result.resumeId).toBeNull();
      // Should NOT query for resume ownership
      expect(resumeFindFirstMock).not.toHaveBeenCalled();
    });
  });

  describe("update — resume ownership", () => {
    it("allows updating an application with a resumeId belonging to the user", async () => {
      resumeFindFirstMock.mockResolvedValue({
        id: "resume_1",
        resumeId: "resume_user_a",
        professionalIdentityId: "pi_user_a",
      });

      const result = await service.update("pi_user_a", "app_123", {
        resumeId: "resume_user_a",
      });

      expect(result).toBeDefined();
      expect(resumeFindFirstMock).toHaveBeenCalledWith({
        where: {
          resumeId: "resume_user_a",
          professionalIdentityId: "pi_user_a",
        },
      });
    });

    it("rejects resumeId update belonging to another Professional Identity", async () => {
      resumeFindFirstMock.mockResolvedValue(null);

      await expect(
        service.update("pi_user_a", "app_123", {
          resumeId: "resume_user_b",
        })
      ).rejects.toThrow(JobApplicationValidationError);

      await expect(
        service.update("pi_user_a", "app_123", {
          resumeId: "resume_user_b",
        })
      ).rejects.toThrow("The selected resume does not belong to your account");
    });

    it("allows clearing resumeId (setting to null)", async () => {
      const result = await service.update("pi_user_a", "app_123", {
        resumeId: null,
      });

      expect(result).toBeDefined();
      // Should NOT query for resume ownership when setting to null
      expect(resumeFindFirstMock).not.toHaveBeenCalled();
    });
  });
});
