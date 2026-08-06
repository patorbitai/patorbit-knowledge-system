"use strict";

import { describe, it, expect } from "vitest";
import {
  transitionStatus,
  canTransition,
  nextStatus,
  isJourneyStatus,
  JOURNEY_LIFECYCLE_ORDER,
} from "@/lib/careerjourney/lifecycle";
import { JourneyError } from "@/lib/careerjourney/journey.errors";

describe("Career Journey lifecycle", () => {
  it("defines the canonical order: draft → reviewing → approved → published", () => {
    expect(JOURNEY_LIFECYCLE_ORDER).toEqual([
      "draft",
      "reviewing",
      "approved",
      "published",
    ]);
  });

  it("advances a valid lifecycle draft → reviewing → approved → published", () => {
    expect(transitionStatus("draft", "reviewing")).toBe("reviewing");
    expect(transitionStatus("reviewing", "approved")).toBe("approved");
    expect(transitionStatus("approved", "published")).toBe("published");
  });

  it("rejects skipping a state (draft → approved)", () => {
    expect(() => transitionStatus("draft", "approved")).toThrow(JourneyError);
    expect(() => transitionStatus("draft", "approved")).toThrow(/Illegal transition/);
  });

  it("rejects moving backwards (published → approved)", () => {
    expect(() => transitionStatus("published", "approved")).toThrow(/Illegal transition/);
    expect(() => transitionStatus("reviewing", "draft")).toThrow(/Illegal transition/);
  });

  it("rejects an invalid target state name", () => {
    expect(() => transitionStatus("draft", "not-a-status" as never)).toThrow(/Unknown/);
  });

  it("rejects an invalid current state name", () => {
    expect(() => transitionStatus("invalid" as never, "draft")).toThrow(/Unknown/);
  });

  it("rejects a same-state transition (no self-loop)", () => {
    expect(() => transitionStatus("draft", "draft")).toThrow(/Illegal transition/);
  });

  it("canTransition reports legality without throwing", () => {
    expect(canTransition("draft", "reviewing")).toBe(true);
    expect(canTransition("draft", "approved")).toBe(false);
    expect(canTransition("published", "approved")).toBe(false);
    expect(canTransition("bogus" as never, "draft")).toBe(false);
  });

  it("nextStatus returns the single legal successor (or null at the end)", () => {
    expect(nextStatus("draft")).toBe("reviewing");
    expect(nextStatus("reviewing")).toBe("approved");
    expect(nextStatus("approved")).toBe("published");
    expect(nextStatus("published")).toBeNull();
  });

  it("isJourneyStatus recognizes only valid statuses", () => {
    expect(isJourneyStatus("draft")).toBe(true);
    expect(isJourneyStatus("published")).toBe(true);
    expect(isJourneyStatus("invalid")).toBe(false);
    expect(isJourneyStatus(42)).toBe(false);
  });
});
