import { describe, it, expect } from "vitest";
import {
  FUNNEL_EVENTS,
  ACTIVATION_FUNNEL,
  buildFunnelReport,
  isFunnelEvent,
  sanitizeProps,
  type AnalyticsRecord,
} from "@/lib/analytics";

function rec(event: string, sessionId: string): AnalyticsRecord {
  return { event: event as AnalyticsRecord["event"], ts: "2026-09-22T00:00:00.000Z", sessionId };
}

describe("funnel events (§16)", () => {
  it("covers every event named in the brief", () => {
    const required = [
      "landing_view",
      "signup_started",
      "signup_completed",
      "resume_upload_started",
      "resume_upload_completed",
      "profile_created",
      "job_analysis_started",
      "job_analysis_completed",
      "tailoring_started",
      "tailoring_completed",
      "resume_exported",
      "upgrade_viewed",
      "checkout_started",
      "subscription_completed",
    ];
    for (const event of required) {
      expect(FUNNEL_EVENTS).toContain(event);
      expect(isFunnelEvent(event)).toBe(true);
    }
  });

  it("rejects unknown events", () => {
    expect(isFunnelEvent("drop_off")).toBe(false);
    expect(isFunnelEvent(42)).toBe(false);
    expect(isFunnelEvent(undefined)).toBe(false);
  });

  it("activation funnel excludes monetization events", () => {
    expect(ACTIVATION_FUNNEL).not.toContain("upgrade_viewed");
    expect(ACTIVATION_FUNNEL).not.toContain("checkout_started");
    expect(ACTIVATION_FUNNEL).not.toContain("subscription_completed");
    expect(ACTIVATION_FUNNEL).toContain("landing_view");
    expect(ACTIVATION_FUNNEL).toContain("resume_exported");
  });
});

describe("sanitizeProps (no PII leaves the browser)", () => {
  it("strips PII-ish keys", () => {
    const out = sanitizeProps({
      email: "a@b.com",
      fullName: "Ada Lovelace",
      phone: "123",
      password: "x",
      resumeText: "long text",
      score: 82,
      format: "pdf",
    });
    expect(out).toEqual({ score: 82, format: "pdf" });
  });

  it("truncates long strings", () => {
    const out = sanitizeProps({ note: "x".repeat(500) });
    expect((out!.note as string).length).toBeLessThanOrEqual(201);
  });

  it("drops empty results to undefined", () => {
    expect(sanitizeProps({ email: "a@b.com" })).toBeUndefined();
    expect(sanitizeProps(undefined)).toBeUndefined();
  });
});

describe("buildFunnelReport (§17 drop-off answers)", () => {
  it("counts totals and unique sessions per step", () => {
    const report = buildFunnelReport([
      rec("landing_view", "s1"),
      rec("landing_view", "s2"),
      rec("landing_view", "s2"), // duplicate — unique stays 2
      rec("signup_started", "s1"),
      rec("signup_completed", "s1"),
    ]);

    expect(report.steps[0]).toMatchObject({ event: "landing_view", total: 3, unique: 2 });
    expect(report.steps[1]).toMatchObject({ event: "signup_started", total: 1, unique: 1 });
    expect(report.steps[1].conversionFromPrevious).toBe(50);
    expect(report.totalRecords).toBe(5);
  });

  it("computes step-to-step conversion and shows where users drop", () => {
    const report = buildFunnelReport([
      rec("landing_view", "s1"),
      rec("landing_view", "s2"),
      rec("signup_started", "s1"),
      rec("signup_started", "s2"),
      rec("signup_completed", "s1"),
    ]);
    const steps = Object.fromEntries(report.steps.map((s) => [s.event, s]));
    expect(steps.landing_view.unique).toBe(2);
    expect(steps.signup_started.unique).toBe(2);
    expect(steps.signup_completed.unique).toBe(1);
    expect(steps.signup_completed.conversionFromPrevious).toBe(50);
  });

  it("returns zeros rather than NaN when a step has no data", () => {
    const report = buildFunnelReport([rec("landing_view", "s1")]);
    const signup = report.steps.find((s) => s.event === "signup_started")!;
    expect(signup.unique).toBe(0);
    expect(signup.conversionFromPrevious).toBe(0);
  });

  it("ignores unknown events", () => {
    const report = buildFunnelReport([rec("totally_bogus", "s1")]);
    expect(report.totalRecords).toBe(0);
    expect(report.steps.every((s) => s.total === 0)).toBe(true);
  });

  it("reports monetization events separately", () => {
    const report = buildFunnelReport([
      rec("upgrade_viewed", "s1"),
      rec("checkout_started", "s1"),
      rec("subscription_completed", "s1"),
    ]);
    expect(report.conversion.map((c) => c.event)).toEqual([
      "upgrade_viewed",
      "checkout_started",
      "subscription_completed",
    ]);
    expect(report.conversion.every((c) => c.unique === 1)).toBe(true);
  });
});
