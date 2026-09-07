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
      jobUrl: data.jobUrl ?? null,
      location: data.location ?? null,
      employmentType: data.employmentType ?? null,
      appliedDate: data.appliedDate ?? null,
      followUpDate: data.followUpDate ?? null,
      notes: data.notes ?? null,
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
      jobUrl: data.jobUrl ?? null,
      location: data.location ?? null,
      employmentType: data.employmentType ?? null,
      appliedDate: data.appliedDate ?? null,
      followUpDate: data.followUpDate ?? null,
      notes: data.notes ?? null,
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

  describe("create — new tracking fields", () => {
    it("creates an application with all six tracking fields", async () => {
      const result = await service.create("pi_user_a", {
        title: "Software Engineer",
        companyName: "Tech Corp",
        jobDescription: "Build great things",
        jobUrl: "https://careers.techcorp.com/job/123",
        location: "San Francisco, CA",
        employmentType: "full_time",
        appliedDate: "2026-09-07",
        followUpDate: "2026-09-14",
        notes: "Applied through referral",
      });

      expect(result).toBeDefined();
      expect(result.jobUrl).toBe("https://careers.techcorp.com/job/123");
      expect(result.location).toBe("San Francisco, CA");
      expect(result.employmentType).toBe("full_time");
      expect(result.appliedDate).toBeDefined();
      expect(result.followUpDate).toBeDefined();
      expect(result.notes).toBe("Applied through referral");
    });

    it("creates an application without tracking fields (backward compatibility)", async () => {
      const result = await service.create("pi_user_a", {
        title: "Software Engineer",
        companyName: "Tech Corp",
        jobDescription: "Build great things",
      });

      expect(result).toBeDefined();
      expect(result.jobUrl).toBeNull();
      expect(result.location).toBeNull();
      expect(result.employmentType).toBeNull();
      expect(result.appliedDate).toBeNull();
      expect(result.followUpDate).toBeNull();
      expect(result.notes).toBeNull();
    });

    it("trims whitespace from jobUrl and location", async () => {
      const result = await service.create("pi_user_a", {
        title: "Software Engineer",
        companyName: "Tech Corp",
        jobDescription: "Build great things",
        jobUrl: "  https://example.com  ",
        location: "  Remote  ",
      });

      expect(result.jobUrl).toBe("https://example.com");
      expect(result.location).toBe("Remote");
    });
  });

  describe("update — new tracking fields", () => {
    it("updates all six tracking fields", async () => {
      const result = await service.update("pi_user_a", "app_123", {
        jobUrl: "https://new-url.com",
        location: "New York, NY",
        employmentType: "part_time",
        appliedDate: "2026-09-07",
        followUpDate: "2026-09-20",
        notes: "Updated notes",
      });

      expect(result).toBeDefined();
    });

    it("clears nullable fields by setting to null", async () => {
      const result = await service.update("pi_user_a", "app_123", {
        jobUrl: null,
        location: null,
        employmentType: null,
        appliedDate: null,
        followUpDate: null,
        notes: null,
      });

      expect(result).toBeDefined();
    });
  });

  describe("validation — jobUrl", () => {
    it("rejects invalid job URL", async () => {
      await expect(
        service.create("pi_user_a", {
          title: "Software Engineer",
          companyName: "Tech Corp",
          jobDescription: "Build great things",
          jobUrl: "not-a-url",
        })
      ).rejects.toThrow(JobApplicationValidationError);

      await expect(
        service.create("pi_user_a", {
          title: "Software Engineer",
          companyName: "Tech Corp",
          jobDescription: "Build great things",
          jobUrl: "not-a-url",
        })
      ).rejects.toThrow("Invalid job URL");
    });

    it("rejects unsafe URL protocol (javascript:)", async () => {
      await expect(
        service.create("pi_user_a", {
          title: "Software Engineer",
          companyName: "Tech Corp",
          jobDescription: "Build great things",
          jobUrl: "javascript:alert(1)",
        })
      ).rejects.toThrow(JobApplicationValidationError);

      await expect(
        service.create("pi_user_a", {
          title: "Software Engineer",
          companyName: "Tech Corp",
          jobDescription: "Build great things",
          jobUrl: "javascript:alert(1)",
        })
      ).rejects.toThrow("only HTTP and HTTPS URLs are allowed");
    });

    it("accepts valid HTTP URL", async () => {
      const result = await service.create("pi_user_a", {
        title: "Software Engineer",
        companyName: "Tech Corp",
        jobDescription: "Build great things",
        jobUrl: "http://example.com/job",
      });

      expect(result.jobUrl).toBe("http://example.com/job");
    });

    it("accepts valid HTTPS URL", async () => {
      const result = await service.create("pi_user_a", {
        title: "Software Engineer",
        companyName: "Tech Corp",
        jobDescription: "Build great things",
        jobUrl: "https://example.com/job",
      });

      expect(result.jobUrl).toBe("https://example.com/job");
    });

    it("returns null for empty jobUrl", async () => {
      const result = await service.create("pi_user_a", {
        title: "Software Engineer",
        companyName: "Tech Corp",
        jobDescription: "Build great things",
        jobUrl: "",
      });

      expect(result.jobUrl).toBeNull();
    });
  });

  describe("validation — employmentType", () => {
    it("rejects invalid employment type", async () => {
      await expect(
        service.create("pi_user_a", {
          title: "Software Engineer",
          companyName: "Tech Corp",
          jobDescription: "Build great things",
          employmentType: "invalid_type",
        })
      ).rejects.toThrow(JobApplicationValidationError);

      await expect(
        service.create("pi_user_a", {
          title: "Software Engineer",
          companyName: "Tech Corp",
          jobDescription: "Build great things",
          employmentType: "invalid_type",
        })
      ).rejects.toThrow("Invalid employment type");
    });

    it("accepts valid employment types", async () => {
      const validTypes = ["full_time", "part_time", "contract", "internship"];
      
      for (const type of validTypes) {
        const result = await service.create("pi_user_a", {
          title: "Software Engineer",
          companyName: "Tech Corp",
          jobDescription: "Build great things",
          employmentType: type,
        });
        expect(result.employmentType).toBe(type);
      }
    });
  });

  describe("validation — dates", () => {
    it("persists date fields correctly", async () => {
      const result = await service.create("pi_user_a", {
        title: "Software Engineer",
        companyName: "Tech Corp",
        jobDescription: "Build great things",
        appliedDate: "2026-09-07",
        followUpDate: "2026-09-14",
      });

      expect(result.appliedDate).toBeDefined();
      expect(result.followUpDate).toBeDefined();
    });

    it("rejects invalid date format", async () => {
      await expect(
        service.create("pi_user_a", {
          title: "Software Engineer",
          companyName: "Tech Corp",
          jobDescription: "Build great things",
          appliedDate: "not-a-date",
        })
      ).rejects.toThrow(JobApplicationValidationError);

      await expect(
        service.create("pi_user_a", {
          title: "Software Engineer",
          companyName: "Tech Corp",
          jobDescription: "Build great things",
          appliedDate: "not-a-date",
        })
      ).rejects.toThrow("Invalid date");
    });
  });

  describe("validation — notes", () => {
    it("persists notes correctly", async () => {
      const result = await service.create("pi_user_a", {
        title: "Software Engineer",
        companyName: "Tech Corp",
        jobDescription: "Build great things",
        notes: "Line 1\nLine 2\nLine 3",
      });

      expect(result.notes).toBe("Line 1\nLine 2\nLine 3");
    });

    it("returns null for empty notes", async () => {
      const result = await service.create("pi_user_a", {
        title: "Software Engineer",
        companyName: "Tech Corp",
        jobDescription: "Build great things",
        notes: "",
      });

      expect(result.notes).toBeNull();
    });
  });
});
