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
 * Allowed verification statuses — matches the client-side
 * ClaimVerificationStatus union. The service prevents clients from
 * arbitrarily setting "verified" — that requires the future verification
 * engine. Clients may only set statuses up to "accepted".
 */
const ALLOWED_STATUSES_FOR_CREATE = new Set([
  "suggested",
  "accepted",
]);

const ALLOWED_STATUSES_FOR_UPDATE = new Set([
  "suggested",
  "accepted",
  "evidence-added",
  "under-review",
  "expired",
  "revoked",
  "disputed",
]);

/** Statuses that only the server verification engine should set. */
const SERVER_ONLY_STATUSES = new Set(["verified"]);

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

    // Prevent clients from setting "verified" status
    if (input.verificationStatus !== undefined) {
      if (SERVER_ONLY_STATUSES.has(input.verificationStatus)) {
        throw new ClaimValidationError(
          "Cannot set verification status to 'verified' directly. Use the verification engine.",
        );
      }
      if (!ALLOWED_STATUSES_FOR_UPDATE.has(input.verificationStatus)) {
        throw new ClaimValidationError(
          `Invalid verification status: ${input.verificationStatus}`,
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
