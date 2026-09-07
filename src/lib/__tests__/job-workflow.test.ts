import { describe, it, expect } from "vitest";
import {
  getFollowUpState,
  getFollowUpLabel,
  getNextAction,
  getNextActionLabel,
  isNeedsAttention,
  calculateSummaryMetrics,
  toLocalDateString,
  type JobApplicationLike,
} from "@/lib/job-workflow";

/* ── Helper ─────────────────────────────────────────────────────────────── */

function makeApp(overrides: Partial<JobApplicationLike> = {}): JobApplicationLike {
  return {
    status: "saved",
    followUpDate: null,
    ...overrides,
  };
}

/* ── Follow-up State ────────────────────────────────────────────────────── */

describe("getFollowUpState", () => {
  it("returns 'none' for offer status", () => {
    const app = makeApp({ status: "offer", followUpDate: "2026-01-01" });
    expect(getFollowUpState(app, "2026-09-07")).toBe("none");
  });

  it("returns 'none' for rejected status", () => {
    const app = makeApp({ status: "rejected", followUpDate: "2026-01-01" });
    expect(getFollowUpState(app, "2026-09-07")).toBe("none");
  });

  it("returns 'none' when no follow-up date", () => {
    const app = makeApp({ status: "applied", followUpDate: null });
    expect(getFollowUpState(app, "2026-09-07")).toBe("none");
  });

  it("returns 'overdue' for past follow-up date", () => {
    const app = makeApp({ status: "applied", followUpDate: "2026-09-01" });
    expect(getFollowUpState(app, "2026-09-07")).toBe("overdue");
  });

  it("returns 'today' for today's follow-up date", () => {
    const app = makeApp({ status: "applied", followUpDate: "2026-09-07" });
    expect(getFollowUpState(app, "2026-09-07")).toBe("today");
  });

  it("returns 'upcoming' for future follow-up date", () => {
    const app = makeApp({ status: "applied", followUpDate: "2026-09-14" });
    expect(getFollowUpState(app, "2026-09-07")).toBe("upcoming");
  });

  it("handles ISO datetime strings correctly", () => {
    const app = makeApp({ status: "applied", followUpDate: "2026-09-07T14:30:00.000Z" });
    expect(getFollowUpState(app, "2026-09-07")).toBe("today");
  });
});

/* ── Follow-up Label ────────────────────────────────────────────────────── */

describe("getFollowUpLabel", () => {
  it("returns 'Follow-up overdue' for overdue state", () => {
    expect(getFollowUpLabel("overdue")).toBe("Follow-up overdue");
  });

  it("returns 'Follow up today' for today state", () => {
    expect(getFollowUpLabel("today")).toBe("Follow up today");
  });

  it("returns date label for upcoming state", () => {
    const label = getFollowUpLabel("upcoming", "2026-09-14");
    expect(label).toContain("Follow up:");
    // Date format varies by locale, just check it contains a date
    expect(label).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
  });

  it("returns empty string for none state", () => {
    expect(getFollowUpLabel("none")).toBe("");
  });
});

/* ── Next Action ────────────────────────────────────────────────────────── */

describe("getNextAction", () => {
  it("saved → review and prepare", () => {
    const app = makeApp({ status: "saved" });
    expect(getNextAction(app, "2026-09-07")).toBe("review_and_prepare");
  });

  it("ready_to_apply → submit application", () => {
    const app = makeApp({ status: "ready_to_apply" });
    expect(getNextAction(app, "2026-09-07")).toBe("submit_application");
  });

  it("applied + overdue → follow up", () => {
    const app = makeApp({ status: "applied", followUpDate: "2026-09-01" });
    expect(getNextAction(app, "2026-09-07")).toBe("follow_up");
  });

  it("applied + today → follow up", () => {
    const app = makeApp({ status: "applied", followUpDate: "2026-09-07" });
    expect(getNextAction(app, "2026-09-07")).toBe("follow_up");
  });

  it("applied + future → wait for response", () => {
    const app = makeApp({ status: "applied", followUpDate: "2026-09-14" });
    expect(getNextAction(app, "2026-09-07")).toBe("wait_for_response");
  });

  it("applied + no follow-up → wait for response", () => {
    const app = makeApp({ status: "applied", followUpDate: null });
    expect(getNextAction(app, "2026-09-07")).toBe("wait_for_response");
  });

  it("interview → prepare for interview", () => {
    const app = makeApp({ status: "interview" });
    expect(getNextAction(app, "2026-09-07")).toBe("prepare_for_interview");
  });

  it("offer → review offer", () => {
    const app = makeApp({ status: "offer" });
    expect(getNextAction(app, "2026-09-07")).toBe("review_offer");
  });

  it("rejected → closed", () => {
    const app = makeApp({ status: "rejected" });
    expect(getNextAction(app, "2026-09-07")).toBe("closed");
  });
});

/* ── Next Action Label ──────────────────────────────────────────────────── */

describe("getNextActionLabel", () => {
  it("returns correct labels for all actions", () => {
    expect(getNextActionLabel("review_and_prepare")).toBe("Review job and prepare application");
    expect(getNextActionLabel("submit_application")).toBe("Submit application");
    expect(getNextActionLabel("follow_up")).toBe("Follow up");
    expect(getNextActionLabel("wait_for_response")).toBe("Wait for response");
    expect(getNextActionLabel("prepare_for_interview")).toBe("Prepare for interview");
    expect(getNextActionLabel("review_offer")).toBe("Review offer details");
    expect(getNextActionLabel("closed")).toBe("Closed");
  });
});

/* ── Needs Attention ────────────────────────────────────────────────────── */

describe("isNeedsAttention", () => {
  it("includes overdue application", () => {
    const app = makeApp({ status: "applied", followUpDate: "2026-09-01" });
    expect(isNeedsAttention(app, "2026-09-07")).toBe(true);
  });

  it("includes today's follow-up", () => {
    const app = makeApp({ status: "applied", followUpDate: "2026-09-07" });
    expect(isNeedsAttention(app, "2026-09-07")).toBe(true);
  });

  it("includes interview status", () => {
    const app = makeApp({ status: "interview" });
    expect(isNeedsAttention(app, "2026-09-07")).toBe(true);
  });

  it("excludes future follow-up", () => {
    const app = makeApp({ status: "applied", followUpDate: "2026-09-14" });
    expect(isNeedsAttention(app, "2026-09-07")).toBe(false);
  });

  it("excludes saved without follow-up", () => {
    const app = makeApp({ status: "saved", followUpDate: null });
    expect(isNeedsAttention(app, "2026-09-07")).toBe(false);
  });

  it("excludes offer", () => {
    const app = makeApp({ status: "offer", followUpDate: "2026-09-01" });
    expect(isNeedsAttention(app, "2026-09-07")).toBe(false);
  });

  it("excludes rejected", () => {
    const app = makeApp({ status: "rejected", followUpDate: "2026-09-01" });
    expect(isNeedsAttention(app, "2026-09-07")).toBe(false);
  });
});

/* ── Summary Metrics ────────────────────────────────────────────────────── */

describe("calculateSummaryMetrics", () => {
  it("calculates metrics correctly", () => {
    const apps = [
      makeApp({ status: "saved" }),
      makeApp({ status: "applied", followUpDate: "2026-09-01" }), // overdue
      makeApp({ status: "applied", followUpDate: "2026-09-07" }), // today
      makeApp({ status: "applied", followUpDate: "2026-09-14" }), // upcoming
      makeApp({ status: "interview" }),
      makeApp({ status: "offer" }),
      makeApp({ status: "rejected" }),
    ];

    const metrics = calculateSummaryMetrics(apps, "2026-09-07");

    expect(metrics.total).toBe(7);
    expect(metrics.applied).toBe(3);
    expect(metrics.interviews).toBe(1);
    expect(metrics.offers).toBe(1);
    expect(metrics.followUpsDue).toBe(2); // overdue + today
  });

  it("returns zero metrics for empty array", () => {
    const metrics = calculateSummaryMetrics([], "2026-09-07");
    expect(metrics.total).toBe(0);
    expect(metrics.applied).toBe(0);
    expect(metrics.interviews).toBe(0);
    expect(metrics.offers).toBe(0);
    expect(metrics.followUpsDue).toBe(0);
  });
});

/* ── Date Helpers ───────────────────────────────────────────────────────── */

describe("toLocalDateString", () => {
  it("converts Date to YYYY-MM-DD", () => {
    const date = new Date(2026, 8, 7); // September 7, 2026
    expect(toLocalDateString(date)).toBe("2026-09-07");
  });

  it("converts ISO string to YYYY-MM-DD", () => {
    expect(toLocalDateString("2026-09-07T14:30:00.000Z")).toBe("2026-09-07");
  });
});
