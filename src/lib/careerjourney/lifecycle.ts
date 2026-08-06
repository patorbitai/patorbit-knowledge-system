"use strict";

import type { JourneyStatus } from "@/types/careerjourney";
import { JourneyError } from "./journey.errors";

/**
 * Career Journey — Lifecycle.
 *
 * Deterministic transition rules for the Journey status state machine:
 *
 *   draft → reviewing → approved → published
 *
 * Every transition is validated against the allowed adjacency map. Illegal
 * transitions (skipping a state, moving backwards, unknown target names)
 * are rejected deterministically.
 */

/** Ordered lifecycle — the only allowed direction of travel. */
export const JOURNEY_LIFECYCLE_ORDER: readonly JourneyStatus[] = [
  "draft",
  "reviewing",
  "approved",
  "published",
] as const;

/** Check a value is a valid JourneyStatus literal. */
export function isJourneyStatus(value: unknown): value is JourneyStatus {
  return (
    typeof value === "string" &&
    (JOURNEY_LIFECYCLE_ORDER as readonly string[]).includes(value)
  );
}

/** Given a current status, the single legal next status. Returns null if none. */
export function nextStatus(current: JourneyStatus): JourneyStatus | null {
  const idx = JOURNEY_LIFECYCLE_ORDER.indexOf(current);
  if (idx < 0) return null;
  const nxt = JOURNEY_LIFECYCLE_ORDER[idx + 1];
  return nxt ?? null;
}

/** Whether a transition from `from` to `to` is legal (non-throwing). */
export function canTransition(from: JourneyStatus, to: JourneyStatus): boolean {
  const fromIdx = JOURNEY_LIFECYCLE_ORDER.indexOf(from);
  const toIdx = JOURNEY_LIFECYCLE_ORDER.indexOf(to);
  if (fromIdx < 0 || toIdx < 0) return false;
  // Allow only an advance to exactly the next state (no skipping, no backwards).
  return toIdx === fromIdx + 1;
}

/**
 * Attempt a lifecycle transition.
 *
 * @throws JourneyError (code ILLEGAL_TRANSITION) for illegal transitions or
 *   unknown status names. Returns the new status on success.
 */
export function transitionStatus(from: JourneyStatus, to: JourneyStatus): JourneyStatus {
  if (!isJourneyStatus(from)) {
    throw new JourneyError("UNKNOWN_STATUS", `Unknown current status: "${String(from)}".`, { from });
  }
  if (!isJourneyStatus(to)) {
    throw new JourneyError("UNKNOWN_STATUS", `Unknown target status: "${String(to)}".`, { to });
  }
  if (!canTransition(from, to)) {
    throw new JourneyError(
      "ILLEGAL_TRANSITION",
      `Illegal transition from "${from}" to "${to}". Allowed: ${JOURNEY_LIFECYCLE_ORDER.join(" → ")}.`,
      { from, to },
    );
  }
  return to;
}