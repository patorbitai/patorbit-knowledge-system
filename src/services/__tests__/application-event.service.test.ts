"use strict";

/**
 * M5 Application Event Service Tests
 *
 * Tests the ApplicationEventService public behavior:
 *  - Event creation and persistence
 *  - Status transition validation
 *  - Interview event creation
 *  - Outcome recording
 *  - Chronological event retrieval
 *  - Ownership isolation
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock Prisma (hoisted) ──────────────────────────────────────────────────

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    jobApplication: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    applicationEvent: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

// ── Import after mock ──────────────────────────────────────────────────────

import { ApplicationEventService } from "../application-event.service";

// ── Test fixtures ──────────────────────────────────────────────────────────

const TEST_IDENTITY_ID = "identity-123";
const TEST_APPLICATION_ID = "app-456";

function makeApplication(overrides?: { status?: string }) {
  return {
    id: "db-id-1",
    applicationId: TEST_APPLICATION_ID,
    professionalIdentityId: TEST_IDENTITY_ID,
    title: "Software Engineer",
    companyName: "Acme Corp",
    jobDescription: "Build things",
    status: overrides?.status ?? "applied",
    resumeId: null,
    matchScore: null,
    matchData: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makeEvent(overrides?: Record<string, unknown>) {
  return {
    id: "event-1",
    applicationId: TEST_APPLICATION_ID,
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

// ── Tests ──────────────────────────────────────────────────────────────────

describe("ApplicationEventService", () => {
  let service: ApplicationEventService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ApplicationEventService();
  });

  describe("recordEvent", () => {
    it("creates an event with correct ownership", async () => {
      mockPrisma.jobApplication.findFirst.mockResolvedValue(makeApplication());
      mockPrisma.applicationEvent.create.mockResolvedValue(makeEvent());

      const result = await service.recordEvent(TEST_IDENTITY_ID, {
        applicationId: TEST_APPLICATION_ID,
        eventType: "status_change",
        previousStatus: "applied",
        newStatus: "interview",
      });

      expect(result.applicationId).toBe(TEST_APPLICATION_ID);
      expect(mockPrisma.applicationEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            applicationId: TEST_APPLICATION_ID,
            professionalIdentityId: TEST_IDENTITY_ID,
          }),
        }),
      );
    });

    it("rejects event for application belonging to another identity", async () => {
      mockPrisma.jobApplication.findFirst.mockResolvedValue(null);

      await expect(
        service.recordEvent("other-identity", {
          applicationId: TEST_APPLICATION_ID,
          eventType: "status_change",
        }),
      ).rejects.toThrow("Application not found");
    });

    it("validates status transitions", async () => {
      mockPrisma.jobApplication.findFirst.mockResolvedValue(
        makeApplication({ status: "applied" }),
      );
      mockPrisma.applicationEvent.create.mockResolvedValue(makeEvent());

      // Valid: applied → interview
      await expect(
        service.recordEvent(TEST_IDENTITY_ID, {
          applicationId: TEST_APPLICATION_ID,
          eventType: "status_change",
          previousStatus: "applied",
          newStatus: "interview",
        }),
      ).resolves.toBeDefined();
    });

    it("rejects invalid status transition", async () => {
      mockPrisma.jobApplication.findFirst.mockResolvedValue(
        makeApplication({ status: "saved" }),
      );

      // Invalid: saved → offer (must go through applied/interview first)
      await expect(
        service.recordEvent(TEST_IDENTITY_ID, {
          applicationId: TEST_APPLICATION_ID,
          eventType: "status_change",
          previousStatus: "saved",
          newStatus: "offer",
        }),
      ).rejects.toThrow("Invalid status transition");
    });

    it("updates application status on status_change event", async () => {
      mockPrisma.jobApplication.findFirst.mockResolvedValue(
        makeApplication({ status: "applied" }),
      );
      mockPrisma.applicationEvent.create.mockResolvedValue(makeEvent());
      mockPrisma.jobApplication.update.mockResolvedValue({});

      await service.recordEvent(TEST_IDENTITY_ID, {
        applicationId: TEST_APPLICATION_ID,
        eventType: "status_change",
        previousStatus: "applied",
        newStatus: "interview",
      });

      expect(mockPrisma.jobApplication.update).toHaveBeenCalledWith({
        where: { applicationId: TEST_APPLICATION_ID },
        data: { status: "interview" },
      });
    });

    it("persists notes correctly", async () => {
      mockPrisma.jobApplication.findFirst.mockResolvedValue(makeApplication());
      mockPrisma.applicationEvent.create.mockResolvedValue(makeEvent());

      await service.recordEvent(TEST_IDENTITY_ID, {
        applicationId: TEST_APPLICATION_ID,
        eventType: "interview_completed",
        notes: "Interview went well, discussed system design",
      });

      expect(mockPrisma.applicationEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            notes: "Interview went well, discussed system design",
          }),
        }),
      );
    });
  });

  describe("recordInterview", () => {
    it("creates interview_scheduled event", async () => {
      mockPrisma.jobApplication.findFirst.mockResolvedValue(makeApplication());
      mockPrisma.applicationEvent.create.mockResolvedValue(makeEvent());

      await service.recordInterview(TEST_IDENTITY_ID, TEST_APPLICATION_ID, {
        stage: "technical",
        type: "video",
        date: "2026-09-15",
        notes: "System design interview",
      });

      expect(mockPrisma.applicationEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: "interview_scheduled",
            interviewStage: "technical",
            interviewType: "video",
          }),
        }),
      );
    });

    it("creates interview_completed event when completed=true", async () => {
      mockPrisma.jobApplication.findFirst.mockResolvedValue(makeApplication());
      mockPrisma.applicationEvent.create.mockResolvedValue(makeEvent());

      await service.recordInterview(TEST_IDENTITY_ID, TEST_APPLICATION_ID, {
        stage: "final",
        type: "in_person",
        completed: true,
        notes: "Final round completed",
      });

      expect(mockPrisma.applicationEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: "interview_completed",
          }),
        }),
      );
    });
  });

  describe("recordOutcome", () => {
    it("creates outcome_recorded event with correct outcome", async () => {
      mockPrisma.jobApplication.findFirst.mockResolvedValue(makeApplication());
      mockPrisma.applicationEvent.create.mockResolvedValue(makeEvent());

      await service.recordOutcome(TEST_IDENTITY_ID, TEST_APPLICATION_ID, "offer", "Got the offer!");

      expect(mockPrisma.applicationEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: "outcome_recorded",
            outcome: "offer",
            notes: "Got the offer!",
          }),
        }),
      );
    });

    it("maps rejected outcome to rejected status", async () => {
      mockPrisma.jobApplication.findFirst.mockResolvedValue(makeApplication());
      mockPrisma.applicationEvent.create.mockResolvedValue(makeEvent());
      mockPrisma.jobApplication.update.mockResolvedValue({});

      await service.recordOutcome(TEST_IDENTITY_ID, TEST_APPLICATION_ID, "rejected");

      expect(mockPrisma.applicationEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            newStatus: "rejected",
          }),
        }),
      );
    });

    it("maps ghosted outcome to no_response status", async () => {
      mockPrisma.jobApplication.findFirst.mockResolvedValue(makeApplication());
      mockPrisma.applicationEvent.create.mockResolvedValue(makeEvent());
      mockPrisma.jobApplication.update.mockResolvedValue({});

      await service.recordOutcome(TEST_IDENTITY_ID, TEST_APPLICATION_ID, "ghosted");

      expect(mockPrisma.applicationEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            newStatus: "no_response",
          }),
        }),
      );
    });
  });

  describe("listEvents", () => {
    it("returns events in chronological order", async () => {
      mockPrisma.jobApplication.findFirst.mockResolvedValue(makeApplication());
      mockPrisma.applicationEvent.findMany.mockResolvedValue([
        makeEvent({ id: "e1", createdAt: new Date("2026-09-01T10:00:00Z") }),
        makeEvent({ id: "e2", createdAt: new Date("2026-09-02T10:00:00Z") }),
        makeEvent({ id: "e3", createdAt: new Date("2026-09-03T10:00:00Z") }),
      ]);

      const events = await service.listEvents(TEST_IDENTITY_ID, TEST_APPLICATION_ID);

      expect(events).toHaveLength(3);
      expect(mockPrisma.applicationEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "asc" },
        }),
      );
    });

    it("rejects listing events for another identity's application", async () => {
      mockPrisma.jobApplication.findFirst.mockResolvedValue(null);

      await expect(
        service.listEvents("other-identity", TEST_APPLICATION_ID),
      ).rejects.toThrow("Application not found");
    });
  });

  describe("valid status transitions", () => {
    const validTransitions = [
      ["saved", "ready_to_apply"],
      ["saved", "applied"],
      ["ready_to_apply", "applied"],
      ["ready_to_apply", "saved"],
      ["applied", "interview"],
      ["applied", "rejected"],
      ["applied", "withdrawn"],
      ["applied", "no_response"],
      ["interview", "offer"],
      ["interview", "rejected"],
      ["offer", "rejected"],
      ["offer", "withdrawn"],
    ];

    it.each(validTransitions)(
      "allows %s → %s",
      async (from, to) => {
        mockPrisma.jobApplication.findFirst.mockResolvedValue(
          makeApplication({ status: from }),
        );
        mockPrisma.applicationEvent.create.mockResolvedValue(makeEvent());
        mockPrisma.jobApplication.update.mockResolvedValue({});

        await expect(
          service.recordEvent(TEST_IDENTITY_ID, {
            applicationId: TEST_APPLICATION_ID,
            eventType: "status_change",
            previousStatus: from,
            newStatus: to,
          }),
        ).resolves.toBeDefined();
      },
    );

    const invalidTransitions = [
      ["rejected", "applied"],
      ["rejected", "interview"],
      ["withdrawn", "applied"],
      ["saved", "offer"],
    ];

    it.each(invalidTransitions)(
      "rejects %s → %s",
      async (from, to) => {
        mockPrisma.jobApplication.findFirst.mockResolvedValue(
          makeApplication({ status: from }),
        );

        await expect(
          service.recordEvent(TEST_IDENTITY_ID, {
            applicationId: TEST_APPLICATION_ID,
            eventType: "status_change",
            previousStatus: from,
            newStatus: to,
          }),
        ).rejects.toThrow("Invalid status transition");
      },
    );
  });
});
