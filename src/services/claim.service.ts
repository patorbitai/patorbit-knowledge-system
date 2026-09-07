"use strict";

import { claimRepository } from "@/repositories/claim.repository";
import type { Claim, Prisma } from "@prisma/client";

/**
 * Allowed claim types — matches the client-side ClaimType union
 * (src/types/resume.ts) and the PKS-SRS-PIP-1 Beta taxonomy.
 */
const ALLOWED_CLAIM_TYPES = new Set([
  "Employment",
  "Education",
  "Project",
  "Skill",
  "Certification",
  "Contribution",
]);

/**
 * Allowed verification statuses for claim creation.
 * Clients may only create claims as "suggested" or "accepted".
 */
const ALLOWED_STATUSES_FOR_CREATE = new Set([
  "suggested",
  "accepted",
]);

/**
 * Phase 8 (P2-1): Verification lifecycle statuses are NO LONGER allowed
 * through normal Claim PATCH updates.
 *
 * All verification status transitions MUST go through:
 *   POST /api/claims/[claimId]/verification
 *   → verificationEventService.createEvent()
 *
 * This ensures every status change is recorded in the append-only
 * VerificationEvent audit trail.
 *
 * Blocked statuses (must use verification event service):
 *   verified, disputed, revoked, expired, evidence-added, under-review
 */
const VERIFICATION_LIFECYCLE_STATUSES = new Set([
  "verified",
  "evidence-added",
  "under-review",
  "expired",
  "revoked",
  "disputed",
]);

export class ClaimValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClaimValidationError";
  }
}

export interface CreateClaimInput {
  assertionText: string;
  claimType: string;
  sourceActivityId?: string;
  confidence?: number;
  reasoning?: string;
}

export interface UpdateClaimInput {
  assertionText?: string;
  claimType?: string;
  sourceActivityId?: string;
  confidence?: number;
  reasoning?: string;
  verificationStatus?: string;
  reviewed?: boolean;
  accepted?: boolean;
}

/**
 * ClaimService — business rules for the Claim domain.
 *
 * This service enforces:
 *  - input validation
 *  - allowed claim types / statuses
 *  - ProfessionalIdentity ownership
 *  - prevention of arbitrary "verified" status by clients
 *
 * It does NOT contain HTTP-specific logic.
 */
export class ClaimService {
  /**
   * Validate and create a Claim under the given ProfessionalIdentity.
   */
  async create(
    professionalIdentityId: string,
    input: CreateClaimInput,
  ): Promise<Claim> {
    this.validateCreateInput(input);

    return claimRepository.create({
      professionalIdentityId,
      assertionText: input.assertionText.trim(),
      claimType: input.claimType,
      sourceActivityId: input.sourceActivityId,
      confidence: input.confidence ?? 0.5,
      reasoning: input.reasoning,
      verificationStatus: "suggested",
      reviewed: false,
      accepted: false,
    });
  }

  /**
   * Get a Claim by ID, ensuring it belongs to the given ProfessionalIdentity.
   */
  async getById(
    claimId: string,
    professionalIdentityId: string,
  ): Promise<Claim> {
    const claim = await claimRepository.findById(claimId);
    if (!claim) {
      throw new ClaimValidationError("Claim not found");
    }
    if (claim.professionalIdentityId !== professionalIdentityId) {
      throw new ClaimValidationError("Claim not found"); // Do not leak existence
    }
    return claim;
  }

  /**
   * List all Claims for a ProfessionalIdentity.
   */
  async list(
    professionalIdentityId: string,
    options?: { claimType?: string },
  ): Promise<Claim[]> {
    return claimRepository.findByProfessionalIdentityId(
      professionalIdentityId,
      options,
    );
  }

  /**
   * Update a Claim, enforcing ownership and allowed status transitions.
   */
  async update(
    claimId: string,
    professionalIdentityId: string,
    input: UpdateClaimInput,
  ): Promise<Claim> {
    // Ownership check
    await this.getById(claimId, professionalIdentityId);

    // Validate input
    if (input.claimType !== undefined && !ALLOWED_CLAIM_TYPES.has(input.claimType)) {
      throw new ClaimValidationError(
        `Invalid claim type: ${input.claimType}. Allowed: ${[...ALLOWED_CLAIM_TYPES].join(", ")}`,
      );
    }

    if (input.confidence !== undefined && (input.confidence < 0 || input.confidence > 1)) {
      throw new ClaimValidationError("Confidence must be between 0 and 1");
    }

    if (input.assertionText !== undefined && !input.assertionText.trim()) {
      throw new ClaimValidationError("Assertion text cannot be empty");
    }

    // P2-1 FIX: Phase 8 — Block ALL verification lifecycle status changes
    // through normal Claim updates. Status transitions must go through the
    // verification event service to maintain the append-only audit trail.
    if (input.verificationStatus !== undefined) {
      if (VERIFICATION_LIFECYCLE_STATUSES.has(input.verificationStatus)) {
        throw new ClaimValidationError(
          `Cannot set verification status to '${input.verificationStatus}' directly. ` +
          "Use POST /api/claims/[claimId]/verification to record status transitions.",
        );
      }
      // Only "suggested" and "accepted" are allowed for initial claim setup
      if (!ALLOWED_STATUSES_FOR_CREATE.has(input.verificationStatus)) {
        throw new ClaimValidationError(
          `Invalid verification status: ${input.verificationStatus}. ` +
          "Only 'suggested' and 'accepted' may be set directly."
        );
      }
    }

    const updateData: Prisma.ClaimUpdateInput = {};
    if (input.assertionText !== undefined) updateData.assertionText = input.assertionText.trim();
    if (input.claimType !== undefined) updateData.claimType = input.claimType;
    if (input.sourceActivityId !== undefined) updateData.sourceActivityId = input.sourceActivityId;
    if (input.confidence !== undefined) updateData.confidence = input.confidence;
    if (input.reasoning !== undefined) updateData.reasoning = input.reasoning;
    if (input.verificationStatus !== undefined) updateData.verificationStatus = input.verificationStatus;
    if (input.reviewed !== undefined) updateData.reviewed = input.reviewed;
    if (input.accepted !== undefined) updateData.accepted = input.accepted;

    return claimRepository.update(claimId, updateData);
  }

  /**
   * Delete a Claim, enforcing ownership.
   * Evidence records referencing this Claim will have claimId set to NULL
   * (onDelete: SetNull in the schema).
   */
  async delete(
    claimId: string,
    professionalIdentityId: string,
  ): Promise<void> {
    await this.getById(claimId, professionalIdentityId);
    await claimRepository.delete(claimId);
  }

  /**
   * Count Claims for a ProfessionalIdentity.
   */
  async count(professionalIdentityId: string): Promise<number> {
    return claimRepository.countByProfessionalIdentityId(professionalIdentityId);
  }

  // ── Private validation helpers ────────────────────────────────

  private validateCreateInput(input: CreateClaimInput): void {
    if (!input.assertionText?.trim()) {
      throw new ClaimValidationError("Assertion text is required");
    }
    if (!input.claimType) {
      throw new ClaimValidationError("Claim type is required");
    }
    if (!ALLOWED_CLAIM_TYPES.has(input.claimType)) {
      throw new ClaimValidationError(
        `Invalid claim type: ${input.claimType}. Allowed: ${[...ALLOWED_CLAIM_TYPES].join(", ")}`,
      );
    }
    if (input.confidence !== undefined && (input.confidence < 0 || input.confidence > 1)) {
      throw new ClaimValidationError("Confidence must be between 0 and 1");
    }
  }
}

export const claimService = new ClaimService();
