"use strict";

/**
 * M7B — discovery analytics registration.
 *
 * Follows the established §24 convention (mirrors m5c-analytics.test.ts):
 * new workflow events must be registered exactly once in WORKFLOW_EVENTS so
 * the server report iterates them and normalizeBatch accepts them. Payload
 * privacy is enforced centrally by sanitizeProps (scalar allowlisted fields
 * only — no user ids, resume/profile data, query text, or job descriptions).
 */

import { describe, it, expect } from "vitest";
import {
  WORKFLOW_EVENTS,
  isTrackedEvent,
  sanitizeProps,
} from "@/lib/analytics";

const M7B_EVENTS = ["job_search_performed", "job_viewed"] as const;

describe("M7B discovery analytics events", () => {
  it.each(M7B_EVENTS)("registers %s exactly once in WORKFLOW_EVENTS", (name) => {
    expect(WORKFLOW_EVENTS).toContain(name);
    expect(WORKFLOW_EVENTS.filter((e) => e === name)).toHaveLength(1);
  });

  it("isTrackedEvent accepts both events (server normalizeBatch will persist them)", () => {
    for (const name of M7B_EVENTS) {
      expect(isTrackedEvent(name)).toBe(true);
    }
  });

  it("keeps discovery payloads privacy-safe: scalar allowlisted props only", () => {
    const sanitized = sanitizeProps({
      source: "greenhouse",
      page: 2,
      result_count: 14,
      freshness: "active",
      // Must be dropped if anyone ever passes it: PII-ish key.
      email: "person@example.com",
      resume_text: "secret resume content",
    });
    expect(sanitized).toEqual({
      source: "greenhouse",
      page: 2,
      result_count: 14,
      freshness: "active",
    });
  });
});
