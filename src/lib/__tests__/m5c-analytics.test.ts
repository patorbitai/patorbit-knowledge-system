/**
 * M5C §H — the four milestone events must exist in the typed analytics
 * registry (they were audited as missing before M5C). Registration makes
 * them pipeline through `track` and appear in the /settings/funnel workflow
 * list automatically (server report iterates WORKFLOW_EVENTS).
 */
import { describe, it, expect } from "vitest";
import { WORKFLOW_EVENTS, WORKFLOW_SET } from "@/lib/analytics";

const M5C_EVENTS = [
  "builder_customize_opened",
  "customization_changed",
  "builder_preview_opened",
  "builder_template_changed",
] as const;

describe("M5C — analytics registration", () => {
  it("registers the four workflow events in the typed registry", () => {
    for (const name of M5C_EVENTS) {
      expect(WORKFLOW_EVENTS).toContain(name);
      expect(WORKFLOW_SET.has(name)).toBe(true);
    }
  });

  it("keeps the events out of the funnel list (workflow, not funnel)", () => {
    // §24 convention: WORKFLOW_EVENTS are engagement events reported outside
    // the onboarding funnel report.
    expect(WORKFLOW_EVENTS.length).toBeGreaterThan(0);
    for (const name of M5C_EVENTS) {
      expect(WORKFLOW_EVENTS.filter((e) => e === name)).toHaveLength(1);
    }
  });
});
