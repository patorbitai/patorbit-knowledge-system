import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createLocalSnapshot,
  planMigration,
  executeMigration,
  getMigrationMessage,
  type MigrationPlan,
} from "../migration";
import { computeParity, type LocalResumeSnapshot } from "../parity";
import { ResumePayloadSchema } from "@/utils/resume-payload-schema";

// Mock resume data for testing
const mockResume1 = {
  resumeId: "test-resume-1",
  resumeName: "Test Resume 1",
  templateId: "modern-clean",
  careerStage: "working-professional",
  name: "Test User 1",
  experience: [
    {
      id: "exp1",
      company: "Test Company",
      title: "Test Title",
      startDate: "2020-01-01",
      endDate: "2023-01-01",
      current: false,
      bulletPoints: ["Test bullet point"],
    },
  ],
  education: [],
  skills: ["Test Skill"],
  summary: "Test summary",
};

const mockResume2 = {
  resumeId: "test-resume-2",
  resumeName: "Test Resume 2",
  templateId: "executive",
  careerStage: "senior",
  name: "Test User 2",
  experience: [],
  education: [],
  skills: [],
  summary: "",
};

const mockStyleConfigs = {
  "test-resume-1": { pageMargin: 40 },
  "test-resume-2": { pageMargin: 60 },
};

describe("Migration Planner and Executor (Phase 1B)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createLocalSnapshot", () => {
    it("creates immutable snapshots of local resumes", () => {
      const snapshots = createLocalSnapshot(
        [mockResume1 as any, mockResume2 as any],
        mockStyleConfigs,
      );

      expect(snapshots).toHaveLength(2);
      expect(snapshots[0].resumeId).toBe("test-resume-1");
      expect(snapshots[0].resumeName).toBe("Test Resume 1");
      expect(snapshots[0].templateId).toBe("modern-clean");
      expect(snapshots[0].careerStage).toBe("working-professional");
      expect(snapshots[0].styleConfig).toEqual({ pageMargin: 40 });

      // Verify it's a deep clone
      snapshots[0].document.name = "Modified";
      expect((mockResume1 as any).name).toBe("Test User 1");
    });

    it("handles missing styleConfigs", () => {
      const snapshots = createLocalSnapshot([mockResume1 as any], {});
      expect(snapshots[0].styleConfig).toBeNull();
    });

    it("preserves all resume fields", () => {
      const snapshots = createLocalSnapshot([mockResume1 as any], mockStyleConfigs);
      expect(snapshots[0].document).toEqual(mockResume1);
    });
  });

  describe("planMigration", () => {
    it("creates correct plan for LOCAL_ONLY resumes", () => {
      const snapshots = createLocalSnapshot(
        [mockResume1 as any, mockResume2 as any],
        mockStyleConfigs,
      );
      const parityReport = computeParity(snapshots, []);

      const plan = planMigration(snapshots, parityReport);

      expect(plan.summary.safeToMigrate).toBe(2);
      expect(plan.summary.alreadyMigrated).toBe(0);
      expect(plan.summary.conflicts).toBe(0);
      expect(plan.summary.serverOnly).toBe(0);
      expect(plan.entries).toHaveLength(2);
      expect(plan.entries[0].category).toBe("SAFE_TO_MIGRATE");
      expect(plan.entries[1].category).toBe("SAFE_TO_MIGRATE");
    });

    it("creates correct plan for IDENTICAL resumes", () => {
      const snapshots = createLocalSnapshot([mockResume1 as any], mockStyleConfigs);
      const serverResumes = [
        {
          resumeId: "test-resume-1",
          resumeName: "Test Resume 1",
          templateId: "modern-clean",
          careerStage: "working-professional",
          resume: { ...mockResume1 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const parityReport = computeParity(snapshots, serverResumes);
      const plan = planMigration(snapshots, parityReport);

      expect(plan.summary.alreadyMigrated).toBe(1);
      expect(plan.summary.safeToMigrate).toBe(0);
    });

    it("creates correct plan for DIFFERENT resumes (conflicts)", () => {
      const snapshots = createLocalSnapshot([mockResume1 as any], mockStyleConfigs);
      const serverResumes = [
        {
          resumeId: "test-resume-1",
          resumeName: "Different Name", // Different from local
          templateId: "modern-clean",
          careerStage: "working-professional",
          resume: { ...mockResume1, name: "Different User" },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const parityReport = computeParity(snapshots, serverResumes);
      const plan = planMigration(snapshots, parityReport);

      expect(plan.summary.conflicts).toBe(1);
      expect(plan.summary.safeToMigrate).toBe(0);
    });

    it("handles mixed scenarios", () => {
      const snapshots = createLocalSnapshot(
        [mockResume1 as any, mockResume2 as any],
        mockStyleConfigs,
      );
      const serverResumes = [
        {
          resumeId: "test-resume-1",
          resumeName: "Test Resume 1",
          templateId: "modern-clean",
          careerStage: "working-professional",
          resume: { ...mockResume1 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          resumeId: "server-only-resume",
          resumeName: "Server Only",
          templateId: "sidebar-elegance",
          careerStage: "entry-level",
          resume: { name: "Server User" },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const parityReport = computeParity(snapshots, serverResumes);
      const plan = planMigration(snapshots, parityReport);

      expect(plan.summary.alreadyMigrated).toBe(1); // test-resume-1
      expect(plan.summary.safeToMigrate).toBe(1); // test-resume-2
      expect(plan.summary.serverOnly).toBe(1); // server-only-resume
      expect(plan.entries).toHaveLength(3);
    });
  });

  describe("executeMigration", () => {
    it("skips non-SAFE_TO_MIGRATE resumes", async () => {
      const plan: MigrationPlan = {
        entries: [
          {
            resumeId: "already-migrated",
            resumeName: "Already Migrated",
            category: "ALREADY_MIGRATED",
            localSnapshot: {} as LocalResumeSnapshot,
          },
          {
            resumeId: "conflict",
            resumeName: "Conflict",
            category: "CONFLICT",
            localSnapshot: {} as LocalResumeSnapshot,
          },
          {
            resumeId: "server-only",
            resumeName: "Server Only",
            category: "SERVER_ONLY",
            localSnapshot: {} as LocalResumeSnapshot,
          },
        ],
        summary: {
          safeToMigrate: 0,
          alreadyMigrated: 1,
          conflicts: 1,
          serverOnly: 1,
        },
        totalLocal: 0,
        totalServer: 3,
        generatedAt: new Date().toISOString(),
      };

      const report = await executeMigration(plan);

      expect(report.results).toHaveLength(0);
      expect(report.summary.migrated).toBe(0);
      expect(report.summary.alreadyMigrated).toBe(1);
      expect(report.summary.conflicts).toBe(1);
      expect(report.summary.serverOnly).toBe(1);
    });

    it("handles partial failures gracefully", async () => {
      const plan: MigrationPlan = {
        entries: [
          {
            resumeId: "success-resume",
            resumeName: "Success",
            category: "SAFE_TO_MIGRATE",
            localSnapshot: {
              resumeId: "success-resume",
              resumeName: "Success",
              templateId: "modern-clean",
              careerStage: "working-professional",
              document: mockResume1 as any,
              styleConfig: null,
            },
          },
          {
            resumeId: "fail-resume",
            resumeName: "Fail",
            category: "SAFE_TO_MIGRATE",
            localSnapshot: {
              resumeId: "fail-resume",
              resumeName: "Fail",
              templateId: "executive",
              careerStage: "senior",
              document: mockResume2 as any,
              styleConfig: null,
            },
          },
        ],
        summary: {
          safeToMigrate: 2,
          alreadyMigrated: 0,
          conflicts: 0,
          serverOnly: 0,
        },
        totalLocal: 2,
        totalServer: 0,
        generatedAt: new Date().toISOString(),
      };

      // Mock fetch to succeed for first, fail for second
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ resumeId: "success-resume" }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: "Network error" }),
        });

      vi.stubGlobal("fetch", mockFetch);

      const report = await executeMigration(plan);

      expect(report.results).toHaveLength(2);
      expect(report.results[0].success).toBe(true);
      expect(report.results[1].success).toBe(false);
      expect(report.summary.migrated).toBe(1);
      expect(report.summary.failed).toBe(1);
      expect(report.status).toBe("PARTIAL");
    });

    it("makes resumeId stable for idempotent retries", async () => {
      const plan: MigrationPlan = {
        entries: [
          {
            resumeId: "idempotent-resume",
            resumeName: "Idempotent",
            category: "SAFE_TO_MIGRATE",
            localSnapshot: {
              resumeId: "idempotent-resume",
              resumeName: "Idempotent",
              templateId: "modern-clean",
              careerStage: "working-professional",
              document: mockResume1 as any,
              styleConfig: null,
            },
          },
        ],
        summary: {
          safeToMigrate: 1,
          alreadyMigrated: 0,
          conflicts: 0,
          serverOnly: 0,
        },
        totalLocal: 1,
        totalServer: 0,
        generatedAt: new Date().toISOString(),
      };

      const mockFetch = vi.fn()
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ resumeId: "idempotent-resume" }),
        });

      vi.stubGlobal("fetch", mockFetch);

      // Execute twice
      const report1 = await executeMigration(plan);
      const report2 = await executeMigration(plan);

      expect(report1.results[0].success).toBe(true);
      expect(report2.results[0].success).toBe(true);

      // Verify same resumeId was used
      expect(mockFetch).toHaveBeenCalledTimes(4); // 2 POSTs + 2 GETs
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/resumes",
        expect.objectContaining({
          body: expect.stringContaining('"resumeId":"idempotent-resume"'),
        }),
      );
    });
  });

  describe("getMigrationMessage", () => {
    it("returns correct message for completed migration", () => {
      const report = {
        status: "COMPLETED" as const,
        results: [],
        summary: {
          migrated: 3,
          verified: 3,
          failed: 0,
          alreadyMigrated: 1,
          conflicts: 0,
          serverOnly: 0,
        },
        executedAt: new Date().toISOString(),
      };

      expect(getMigrationMessage(report)).toBe(
        "3 resume(s) secured and verified. 1 resume(s) already synchronized.",
      );
    });

    it("returns correct message for partial migration", () => {
      const report = {
        status: "PARTIAL" as const,
        results: [],
        summary: {
          migrated: 2,
          verified: 2,
          failed: 1,
          alreadyMigrated: 0,
          conflicts: 0,
          serverOnly: 0,
        },
        executedAt: new Date().toISOString(),
      };

      expect(getMigrationMessage(report)).toBe(
        "2 resume(s) secured and verified. 1 resume(s) failed to migrate.",
      );
    });

    it("returns correct message for conflicts", () => {
      const report = {
        status: "CONFLICTS" as const,
        results: [],
        summary: {
          migrated: 0,
          verified: 0,
          failed: 0,
          alreadyMigrated: 0,
          conflicts: 2,
          serverOnly: 0,
        },
        executedAt: new Date().toISOString(),
      };

      expect(getMigrationMessage(report)).toBe(
        "2 resume(s) need manual review.",
      );
    });

    it("returns correct message for no migration needed", () => {
      const report = {
        status: "NOT_STARTED" as const,
        results: [],
        summary: {
          migrated: 0,
          verified: 0,
          failed: 0,
          alreadyMigrated: 0,
          conflicts: 0,
          serverOnly: 0,
        },
        executedAt: new Date().toISOString(),
      };

      expect(getMigrationMessage(report)).toBe("No resumes to migrate.");
    });
  });
});
