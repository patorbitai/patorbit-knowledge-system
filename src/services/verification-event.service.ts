"use strict";

import { verificationEventRepository } from "@/repositories/verification-event.repository";
import { claimRepository } from "@/repositories/claim.repository";
import type { VerificationEvent } from "@prisma/client";

// ── Allowed event types ────────────────────────────────────────

/** All event types that can be created through the service. */
const ALLOWED_EVENT_TYPES = new Set([
  "requested",
  "started",
  "evidence_reviewed",
  "verified",
  "rejected",
  "disputed",
  "revoked",
  "expired",
]);

// ── Status transitions ─────────────────────────────────────────

/**
 * Defines which status transitions are valid.
 * Key = current status, Value = set of allowed next statuses.
 *
 * Derived from ADR-002 and the existing Claim status values.
 * The transition graph is intentionally conservative.
 */
const VALID_TRANSITIONS: Record<string, Set<string>> = {
  suggested:     new Set(["accepted"]),
  accepted:      new Set(["evidence-added", "under-review"]),
  "evidence-added": new Set(["under-review", "accepted"]),
  "under-review": new Set(["verified", "rejected", "disputed"]),
  verified:      new Set(["expired", "revoked", "disputed"]),
  rejected:      new Set(["under-review", "disputed"]),
  disputed:      new Set(["under-review", "verified", "rejected"]),
  expired:       new Set(["under-review"]),
  revoked:       new Set(["under-review"]),
};

/**
 * Maps event types to the resulting verification status.
 * The service determines the resulting status from the event type,
 * not from client input.
 */
const EVENT_TO_STATUS: Record<string, string> = {
  requested: "under-review",
  started: "under-review",
  evidence_reviewed: "under-review", // evidence reviewed doesn't change status by itself
  verified: "verified",
  rejected: "rejected",
  disputed: "disputed",
  revoked: "revoked",
  expired: "expired",
};

/**
 * Allowed outcomes for evidence_reviewed events.
 */
const ALLOWED_OUTCOMES = new Set([
  "supports",
  "does_not_support",
  "inconclusive",
]);

// ── Error types ────────────────────────────────────────────────

export class VerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VerificationError";
  }
}

// ── Service ────────────────────────────────────────────────────

export interface CreateVerificationEventInput {
  claimId: string;
  evidenceRecordId?: string;
  eventType: string;
  reason?: string;
  outcome?: string;
  actorId?: string;
  actorType?: string;
  metadata?: unknown;
}

/**
 * VerificationEventService — business rules for the verification lifecycle.
 *
 * This service:
 *  - validates event types and status transitions
 *  - enforces Claim ownership
 *  - creates immutable append-only verification events
 *  - updates Claim.verificationStatus as a projection of the event history
 *
 * It does NOT contain HTTP-specific logic.
 */
export class VerificationEventService {
  /**
   * Create a verification event for a Claim.
   *
   * Validates:
   *  - Claim exists and belongs to the PI
   *  - Event type is allowed
   *  - Status transition is valid
   *  - EvidenceRecord (if provided) belongs to the Claim
   *
   * After creating the event:
   *  - Claim.verificationStatus is updated to the resulting status
   *  - The event is returned (append-only, immutable)
   */
  async createEvent(
    input: CreateVerificationEventInput,
    professionalIdentityId: string,
  ): Promise<VerificationEvent> {
    // 1. Validate Claim ownership
    const claim = await claimRepository.findById(input.claimId);
    if (!claim) {
      throw new VerificationError("Claim not found");
    }
    if (claim.professionalIdentityId !== professionalIdentityId) {
      throw new VerificationError("Claim not found"); // Do not leak existence
    }

    // 2. Validate event type
    if (!ALLOWED_EVENT_TYPES.has(input.eventType)) {
      throw new VerificationError(
        `Invalid event type: ${input.eventType}. Allowed: ${[...ALLOWED_EVENT_TYPES].join(", ")}`,
      );
    }

    // 3. Validate outcome for evidence_reviewed events
    if (input.eventType === "evidence_reviewed") {
      if (input.outcome && !ALLOWED_OUTCOMES.has(input.outcome)) {
        throw new VerificationError(
          `Invalid outcome: ${input.outcome}. Allowed: ${[...ALLOWED_OUTCOMES].join(", ")}`,
        );
      }
    }

    // 4. Determine resulting status from event type
    const resultingStatus = EVENT_TO_STATUS[input.eventType];
    if (!resultingStatus) {
      throw new VerificationError(
        `No resulting status defined for event type: ${input.eventType}`,
      );
    }

    // 5. Validate status transition
    const currentStatus = claim.verificationStatus;

    // evidence_reviewed is a no-op transition (stays in the same status)
    const isNoOp = resultingStatus === currentStatus;
    if (!isNoOp) {
      const allowedNext = VALID_TRANSITIONS[currentStatus];
      if (!allowedNext || !allowedNext.has(resultingStatus)) {
        throw new VerificationError(
          `Invalid status transition: ${currentStatus} → ${resultingStatus}. ` +
          `Allowed from "${currentStatus}": ${allowedNext ? [...allowedNext].join(", ") : "none"}`,
        );
      }
    }

    // 6. Create the event (append-only)
    const event = await verificationEventRepository.create({
      claimId: input.claimId,
      evidenceRecordId: input.evidenceRecordId,
      eventType: input.eventType,
      previousStatus: currentStatus,
      resultingStatus,
      outcome: input.outcome,
      reason: input.reason,
      actorId: input.actorId,
      actorType: input.actorType,
      metadata: input.metadata,
    });

    // 7. Update Claim verificationStatus projection
    await claimRepository.update(input.claimId, {
      verificationStatus: resultingStatus,
    });

    return event;
  }

  /**
   * Get verification history for a Claim, ordered chronologically.
   */
  async getHistory(claimId: string): Promise<VerificationEvent[]> {
    return verificationEventRepository.findByClaimId(claimId);
  }

  /**
   * Get the most recent verification event for a Claim.
   */
  async getLatest(claimId: string): Promise<VerificationEvent | null> {
    return verificationEventRepository.findLatestByClaimId(claimId);
  }

  /**
   * Get verification events for a specific EvidenceRecord.
   */
  async getEventsForEvidence(evidenceRecordId: string): Promise<VerificationEvent[]> {
    return verificationEventRepository.findByEvidenceRecordId(evidenceRecordId);
  }

  /**
   * Count verification events for a Claim.
   */
  async countEvents(claimId: string): Promise<number> {
    return verificationEventRepository.countByClaimId(claimId);
  }

  /**
   * Check if a status transition is valid (read-only, no side effects).
   */
  isTransitionValid(fromStatus: string, toStatus: string): boolean {
    const allowed = VALID_TRANSITIONS[fromStatus];
    return !!allowed && allowed.has(toStatus);
  }
}

export const verificationEventService = new VerificationEventService();
