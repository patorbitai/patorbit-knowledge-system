"use strict";

/**
 * M5 Career Memory Service Tests
 *
 * Tests the CareerMemoryService public behavior:
 *  - Minimum evidence thresholds (MIN_EVENTS_FOR_PATTERN=2)
 *  - Trust safety (no unsupported conclusions)
 *  - Identity isolation
 *
 * CRITICAL TRUST TESTS:
 *  - One rejection does NOT create unsupported career conclusions
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock Prisma (hoisted) ──────────────────────────────────────────────────

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    applicationEvent: {
      findMany: vi.fn(),
    },
    jobApplication: {
      findMany: vi.fn(),
    },
    careerMemory: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

// ── Import after mock ──────────────────────────────────────────────────────

import { CareerMemoryService } from "../career-memory.service";

// ── Test fixtures ──────────────────────────────────────────────────────────

const TEST_IDENTITY_ID = "identity-123";

function makeEvent(overrides?: Record<string, unknown>) {
  return {
    id: "event-1",
    applicationId: "app-1",
    professionalIdentityId: TEST_IDENTITY_ID,
    eventType: "status_change",
    previousStatus: "applied",
    newStatus: "interview",
    interviewStage: null,
    interviewType: null,
    interviewDate: null,
    outcome: null,
    notes: null,
    metadata: null,
    createdAt: new Date("2026-09-01T10:00:00Z"),
    ...overrides,
  };
}

function makeApplication(overrides?: Record<string, unknown>) {
  return {
    id: "db-1",
    applicationId: "app-1",
    professionalIdentityId: TEST_IDENTITY_ID,
    title: "Software Engineer",
    companyName: "Acme Corp",
    jobDescription: "Build things",
    status: "applied",
    resumeId: null,
    matchScore: 75,
    matchData: null,
    jobUrl: null,
    location: null,
    employmentType: null,
    appliedDate: null,
    followUpDate: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeMemory(overrides?: Record<string, unknown>) {
  return {
    id: "mem-1",
    professionalIdentityId: TEST_IDENTITY_ID,
    category: "outcome_trend",
    insight: "Test insight",
    confidence: 0.5,
    evidenceCount: 2,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("CareerMemoryService", () => {
  let service: CareerMemoryService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CareerMemoryService();
  });

  describe("analyzeAndUpdate — trust safety", () => {
    it("does NOT create insight from a single rejection", async () => {
      mockPrisma.applicationEvent.findMany.mockResolvedValue([
        makeEvent({
          eventType: "outcome_recorded",
          outcome: "rejected",
          newStatus: "rejected",
        }),
      ]);
      mockPrisma.jobApplication.findMany.mockResolvedValue([
        makeApplication({ status: "rejected" }),
      ]);
      mockPrisma.careerMemory.findMany.mockResolvedValue([]);
      mockPrisma.careerMemory.findFirst.mockResolvedValue(null);
      mockPrisma.careerMemory.create.mockResolvedValue(makeMemory());

      const result = await service.analyzeAndUpdate(TEST_IDENTITY_ID);

      // MIN_EVENTS_FOR_PATTERN = 2, so one rejection should NOT create outcome_trend
      const outcomeTrends = result.topInsights.filter(
        (i) => i.category === "outcome_trend",
      );
      expect(outcomeTrends).toHaveLength(0);
    });

    it("does NOT create 'candidate is weak at Python' from one event", async () => {
      mockPrisma.applicationEvent.findMany.mockResolvedValue([
        makeEvent({
          eventType: "interview_completed",
          notes: "Struggled with Python coding challenge",
        }),
      ]);
      mockPrisma.jobApplication.findMany.mockResolvedValue([
        makeApplication({ status: "rejected" }),
      ]);
      mockPrisma.careerMemory.findMany.mockResolvedValue([]);
      mockPrisma.careerMemory.findFirst.mockResolvedValue(null);
      mockPrisma.careerMemory.create.mockResolvedValue(makeMemory());

      const result = await service.analyzeAndUpdate(TEST_IDENTITY_ID);

      // Should not create any skill_gap insight from a single event
      const skillGaps = result.topInsights.filter(
        (i) => i.category === "skill_gap",
      );
      expect(skillGaps).toHaveLength(0);
    });

    it("does NOT create 'candidate is bad at interviews' from one event", async () => {
      mockPrisma.applicationEvent.findMany.mockResolvedValue([
        makeEvent({
          eventType: "outcome_recorded",
          outcome: "rejected",
        }),
      ]);
      mockPrisma.jobApplication.findMany.mockResolvedValue([
        makeApplication({ status: "rejected" }),
      ]);
      mockPrisma.careerMemory.findMany.mockResolvedValue([]);
      mockPrisma.careerMemory.findFirst.mockResolvedValue(null);
      mockPrisma.careerMemory.create.mockResolvedValue(makeMemory());

      const result = await service.analyzeAndUpdate(TEST_IDENTITY_ID);

      // Should not create interview_pattern from single rejection
      const interviewPatterns = result.topInsights.filter(
        (i) => i.category === "interview_pattern",
      );
      expect(interviewPatterns).toHaveLength(0);
    });

    it("does NOT create 'resume is ineffective' from one event", async () => {
      mockPrisma.applicationEvent.findMany.mockResolvedValue([
        makeEvent({
          eventType: "status_change",
          newStatus: "rejected",
        }),
      ]);
      mockPrisma.jobApplication.findMany.mockResolvedValue([
        makeApplication({ status: "rejected" }),
      ]);
      mockPrisma.careerMemory.findMany.mockResolvedValue([]);
      mockPrisma.careerMemory.findFirst.mockResolvedValue(null);
      mockPrisma.careerMemory.create.mockResolvedValue(makeMemory());

      const result = await service.analyzeAndUpdate(TEST_IDENTITY_ID);

      // Should not create any insight from single event
      expect(result.topInsights).toHaveLength(0);
    });
  });

  describe("analyzeAndUpdate — pattern thresholds", () => {
    it("creates outcome_trend insight with 2+ qualifying events", async () => {
      mockPrisma.applicationEvent.findMany.mockResolvedValue([
        makeEvent({
          id: "e1",
          eventType: "outcome_recorded",
          outcome: "rejected",
          newStatus: "rejected",
        }),
        makeEvent({
          id: "e2",
          eventType: "outcome_recorded",
          outcome: "rejected",
          newStatus: "rejected",
        }),
      ]);
      mockPrisma.jobApplication.findMany.mockResolvedValue([
        makeApplication({ status: "rejected" }),
        makeApplication({ status: "rejected" }),
      ]);
      mockPrisma.careerMemory.findMany.mockResolvedValue([]);
      mockPrisma.careerMemory.findFirst.mockResolvedValue(null);
      mockPrisma.careerMemory.create.mockResolvedValue(makeMemory());

      await service.analyzeAndUpdate(TEST_IDENTITY_ID);

      // Verify create was called (insight was generated)
      expect(mockPrisma.careerMemory.create).toHaveBeenCalled();

      // Now verify the insight was created with correct properties
      const createdInsight = mockPrisma.careerMemory.create.mock.calls[0][0].data;
      expect(createdInsight.category).toBe("outcome_trend");
      expect(createdInsight.confidence).toBe(0.5);
      expect(createdInsight.evidenceCount).toBe(2);
    });

    it("creates higher confidence insight with 3+ events", async () => {
      mockPrisma.applicationEvent.findMany.mockResolvedValue([
        makeEvent({
          id: "e1",
          eventType: "outcome_recorded",
          outcome: "rejected",
          newStatus: "rejected",
        }),
        makeEvent({
          id: "e2",
          eventType: "outcome_recorded",
          outcome: "rejected",
          newStatus: "rejected",
        }),
        makeEvent({
          id: "e3",
          eventType: "outcome_recorded",
          outcome: "rejected",
          newStatus: "rejected",
        }),
      ]);
      mockPrisma.jobApplication.findMany.mockResolvedValue([
        makeApplication({ status: "rejected" }),
        makeApplication({ status: "rejected" }),
        makeApplication({ status: "rejected" }),
      ]);
      mockPrisma.careerMemory.findMany.mockResolvedValue([]);
      mockPrisma.careerMemory.findFirst.mockResolvedValue(null);
      mockPrisma.careerMemory.create.mockResolvedValue(makeMemory());

      await service.analyzeAndUpdate(TEST_IDENTITY_ID);

      // Verify create was called
      expect(mockPrisma.careerMemory.create).toHaveBeenCalled();

      // Verify the insight was created with higher confidence
      const createdInsight = mockPrisma.careerMemory.create.mock.calls[0][0].data;
      expect(createdInsight.category).toBe("outcome_trend");
      expect(createdInsight.confidence).toBe(0.7);
      expect(createdInsight.evidenceCount).toBe(3);
    });
  });

  describe("analyzeAndUpdate — determinism", () => {
    it("produces same insights when run twice with same data", async () => {
      const events = [
        makeEvent({
          id: "e1",
          eventType: "outcome_recorded",
          outcome: "rejected",
          newStatus: "rejected",
        }),
        makeEvent({
          id: "e2",
          eventType: "outcome_recorded",
          outcome: "rejected",
          newStatus: "rejected",
        }),
      ];
      const apps = [
        makeApplication({ status: "rejected" }),
        makeApplication({ status: "rejected" }),
      ];

      mockPrisma.applicationEvent.findMany.mockResolvedValue(events);
      mockPrisma.jobApplication.findMany.mockResolvedValue(apps);
      mockPrisma.careerMemory.findMany.mockResolvedValue([]);
      mockPrisma.careerMemory.findFirst.mockResolvedValue(null);
      mockPrisma.careerMemory.create.mockResolvedValue(makeMemory());

      const result1 = await service.analyzeAndUpdate(TEST_IDENTITY_ID);

      vi.clearAllMocks();
      mockPrisma.applicationEvent.findMany.mockResolvedValue(events);
      mockPrisma.jobApplication.findMany.mockResolvedValue(apps);
      mockPrisma.careerMemory.findMany.mockResolvedValue([]);
      mockPrisma.careerMemory.findFirst.mockResolvedValue(null);
      mockPrisma.careerMemory.create.mockResolvedValue(makeMemory());

      const result2 = await service.analyzeAndUpdate(TEST_IDENTITY_ID);

      expect(result1.topInsights.length).toBe(result2.topInsights.length);
      expect(result1.applicationStats.total).toBe(result2.applicationStats.total);
    });
  });

  describe("analyzeAndUpdate — identity isolation", () => {
    it("does not mix events from different identities", async () => {
      mockPrisma.applicationEvent.findMany.mockResolvedValue([
        makeEvent({
          id: "e1",
          eventType: "outcome_recorded",
          outcome: "rejected",
        }),
        makeEvent({
          id: "e2",
          eventType: "outcome_recorded",
          outcome: "rejected",
        }),
      ]);
      mockPrisma.jobApplication.findMany.mockResolvedValue([
        makeApplication({ status: "rejected" }),
        makeApplication({ status: "rejected" }),
      ]);
      mockPrisma.careerMemory.findMany.mockResolvedValue([]);
      mockPrisma.careerMemory.findFirst.mockResolvedValue(null);
      mockPrisma.careerMemory.create.mockResolvedValue(makeMemory());

      await service.analyzeAndUpdate("identity-A");

      // Verify query was scoped to identity-A
      expect(mockPrisma.applicationEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { professionalIdentityId: "identity-A" },
        }),
      );
    });
  });

  describe("upsertInsight", () => {
    it("updates existing insight when new evidence is stronger", async () => {
      mockPrisma.applicationEvent.findMany.mockResolvedValue([
        makeEvent({
          id: "e1",
          eventType: "outcome_recorded",
          outcome: "rejected",
        }),
        makeEvent({
          id: "e2",
          eventType: "outcome_recorded",
          outcome: "rejected",
        }),
        makeEvent({
          id: "e3",
          eventType: "outcome_recorded",
          outcome: "rejected",
        }),
      ]);
      mockPrisma.jobApplication.findMany.mockResolvedValue([
        makeApplication({ status: "rejected" }),
        makeApplication({ status: "rejected" }),
        makeApplication({ status: "rejected" }),
      ]);

      // Existing insight with lower evidence count
      mockPrisma.careerMemory.findMany.mockResolvedValue([]);
      mockPrisma.careerMemory.findFirst.mockResolvedValue(
        makeMemory({ evidenceCount: 1, confidence: 0.3 }),
      );
      mockPrisma.careerMemory.update.mockResolvedValue(makeMemory());

      await service.analyzeAndUpdate(TEST_IDENTITY_ID);

      // Should update, not create
      expect(mockPrisma.careerMemory.update).toHaveBeenCalled();
      expect(mockPrisma.careerMemory.create).not.toHaveBeenCalled();
    });

    it("creates new insight when none exists", async () => {
      mockPrisma.applicationEvent.findMany.mockResolvedValue([
        makeEvent({
          id: "e1",
          eventType: "outcome_recorded",
          outcome: "rejected",
        }),
        makeEvent({
          id: "e2",
          eventType: "outcome_recorded",
          outcome: "rejected",
        }),
      ]);
      mockPrisma.jobApplication.findMany.mockResolvedValue([
        makeApplication({ status: "rejected" }),
        makeApplication({ status: "rejected" }),
      ]);
      mockPrisma.careerMemory.findMany.mockResolvedValue([]);
      mockPrisma.careerMemory.findFirst.mockResolvedValue(null);
      mockPrisma.careerMemory.create.mockResolvedValue(makeMemory());

      await service.analyzeAndUpdate(TEST_IDENTITY_ID);

      expect(mockPrisma.careerMemory.create).toHaveBeenCalled();
    });
  });

  describe("getSummary", () => {
    it("returns application stats", async () => {
      mockPrisma.careerMemory.findMany.mockResolvedValue([]);
      mockPrisma.jobApplication.findMany.mockResolvedValue([
        makeApplication({ status: "applied" }),
        makeApplication({ status: "interview" }),
        makeApplication({ status: "offer" }),
      ]);
      mockPrisma.applicationEvent.findMany.mockResolvedValue([]);

      const result = await service.getSummary(TEST_IDENTITY_ID);

      expect(result.applicationStats.total).toBe(3);
      expect(result.applicationStats.byStatus["applied"]).toBe(1);
      expect(result.applicationStats.byStatus["interview"]).toBe(1);
      expect(result.applicationStats.byStatus["offer"]).toBe(1);
    });
  });
});
