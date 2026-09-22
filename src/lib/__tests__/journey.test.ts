import { describe, it, expect } from "vitest";
import { deriveJourney, JOURNEY_STEP_DEFS, type JourneyInput } from "@/lib/journey";

const EMPTY: JourneyInput = {
  profileComplete: false,
  experienceAdded: false,
  jobAdded: false,
  matchReady: false,
  tailored: false,
  exported: false,
};

describe("deriveJourney (§2 activation progression)", () => {
  it("defines exactly the six briefed steps, in order", () => {
    expect(JOURNEY_STEP_DEFS.map((s) => s.id)).toEqual([
      "profile",
      "experience",
      "job",
      "match",
      "tailor",
      "export",
    ]);
    expect(JOURNEY_STEP_DEFS[0].title).toBe("Build your Professional Profile");
    expect(JOURNEY_STEP_DEFS[2].title).toBe("Paste a job description");
    expect(JOURNEY_STEP_DEFS[5].title).toBe("Export");
  });

  it("starts at 0% with the profile step as the current action", () => {
    const journey = deriveJourney(EMPTY);
    expect(journey.completedCount).toBe(0);
    expect(journey.percent).toBe(0);
    expect(journey.current?.id).toBe("profile");
    expect(journey.complete).toBe(false);
  });

  it("computes percent from completed steps", () => {
    const journey = deriveJourney({ ...EMPTY, profileComplete: true, experienceAdded: true, jobAdded: true });
    expect(journey.completedCount).toBe(3);
    expect(journey.percent).toBe(50);
    expect(journey.current?.id).toBe("match");
  });

  it("marks steps complete and advances the current step in order", () => {
    const journey = deriveJourney({
      profileComplete: true,
      experienceAdded: true,
      jobAdded: false,
      matchReady: false,
      tailored: false,
      exported: false,
    });
    expect(journey.steps[0].complete).toBe(true);
    expect(journey.steps[1].complete).toBe(true);
    expect(journey.steps[2].complete).toBe(false);
    expect(journey.current?.id).toBe("job");
  });

  it("reports a finished journey with no current step", () => {
    const journey = deriveJourney({
      profileComplete: true,
      experienceAdded: true,
      jobAdded: true,
      matchReady: true,
      tailored: true,
      exported: true,
    });
    expect(journey.completedCount).toBe(6);
    expect(journey.percent).toBe(100);
    expect(journey.current).toBeNull();
    expect(journey.complete).toBe(true);
  });

  it("every step carries user-facing copy and a destination", () => {
    for (const def of JOURNEY_STEP_DEFS) {
      expect(def.description.length).toBeGreaterThan(20);
      expect(def.actionLabel.length).toBeGreaterThan(2);
      expect(def.actionHref.startsWith("/")).toBe(true);
    }
  });
});
