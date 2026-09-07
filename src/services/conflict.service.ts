"use strict";

import { claimRepository } from "@/repositories/claim.repository";
import { conflictRepository } from "@/repositories/conflict.repository";
import { detectConflicts } from "@/lib/conflict/detection";
import type {
  CanonicalClaimForConflict,
  DetectedConflict,
  ConflictDetectionResult,
} from "@/lib/conflict/types";
import type { ConflictRecord } from "@prisma/client";

/**
 * ConflictService — business rules for conflict detection and management.
 *
 * This service:
 *  - loads canonical Claims for a ProfessionalIdentity
 *  - runs the pure detection algorithm
 *  - persists newly detected conflicts (deduplicating against existing ones)
 *  - manages conflict status (reviewing, dismissed, resolved)
 *  - enforces ProfessionalIdentity ownership
 *
 * It does NOT contain HTTP-specific logic.
 */
export class ConflictService {
  /**
   * Run conflict detection for a ProfessionalIdentity's Claims.
   *
   * 1. Load all Claims for the PI
   * 2. Run pure detection algorithm
   * 3. Deduplicate against existing unresolved conflicts
   * 4. Persist new conflicts
   * 5. Return the detection result
   */
  async detectConflicts(
    professionalIdentityId: string,
  ): Promise<ConflictDetectionResult> {
    // 1. Load canonical Claims
    const claims = await claimRepository.findByProfessionalIdentityId(
      professionalIdentityId,
    );

    // 2. Map to canonical input type
    const canonicalClaims: CanonicalClaimForConflict[] = claims.map((c) => ({
      id: c.id,
      professionalIdentityId: c.professionalIdentityId,
      assertionText: c.assertionText,
      claimType: c.claimType,
      verificationStatus: c.verificationStatus,
      confidence: c.confidence,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    // 3. Run pure detection algorithm
    const result = detectConflicts(canonicalClaims);

    // 4. Deduplicate against existing unresolved conflicts
    const existingConflicts = await conflictRepository.findByProfessionalIdentityId(
      professionalIdentityId,
      { status: "new" },
    );

    const newConflicts: DetectedConflict[] = [];
    for (const detected of result.newConflicts) {
      const isDuplicate = existingConflicts.some(
        (existing) =>
          existing.conflictType === detected.conflictType &&
          existing.claimIds.length === detected.claimIds.length &&
          existing.claimIds.every((id) => detected.claimIds.includes(id)),
      );

      if (!isDuplicate) {
        newConflicts.push(detected);
      }
    }

    // 5. Persist new conflicts
    for (const conflict of newConflicts) {
      await conflictRepository.create({
        professionalIdentityId,
        conflictType: conflict.conflictType,
        severity: conflict.severity,
        description: conflict.description,
        claimIds: conflict.claimIds,
        status: "new",
      });
    }

    return {
      newConflicts,
      totalDetected: newConflicts.length,
      claimsCompared: result.claimsCompared,
      detectedAt: result.detectedAt,
    };
  }

  /**
   * List all conflicts for a ProfessionalIdentity.
   */
  async listConflicts(
    professionalIdentityId: string,
    options?: { status?: string; conflictType?: string },
  ): Promise<ConflictRecord[]> {
    return conflictRepository.findByProfessionalIdentityId(
      professionalIdentityId,
      options,
    );
  }

  /**
   * Get a specific conflict by ID, ensuring ownership.
   */
  async getConflict(
    conflictId: string,
    professionalIdentityId: string,
  ): Promise<ConflictRecord> {
    const conflict = await conflictRepository.findById(conflictId);
    if (!conflict) {
      throw new Error("Conflict not found");
    }
    if (conflict.professionalIdentityId !== professionalIdentityId) {
      throw new Error("Conflict not found"); // Do not leak existence
    }
    return conflict;
  }

  /**
   * Update conflict status (reviewing, dismissed, resolved).
   */
  async updateConflictStatus(
    conflictId: string,
    professionalIdentityId: string,
    status: string,
    resolution?: string,
  ): Promise<ConflictRecord> {
    // Ownership check
    await this.getConflict(conflictId, professionalIdentityId);

    const allowedStatuses = ["new", "reviewing", "dismissed", "resolved"];
    if (!allowedStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Allowed: ${allowedStatuses.join(", ")}`);
    }

    const updateData: Record<string, unknown> = { status };
    if (resolution !== undefined) {
      updateData.resolution = resolution;
    }
    if (status === "resolved" || status === "dismissed") {
      updateData.resolvedAt = new Date();
    }

    return conflictRepository.update(conflictId, updateData as any);
  }

  /**
   * Delete a conflict (admin/cleanup only).
   */
  async deleteConflict(
    conflictId: string,
    professionalIdentityId: string,
  ): Promise<void> {
    await this.getConflict(conflictId, professionalIdentityId);
    await conflictRepository.delete(conflictId);
  }

  /**
   * Count conflicts for a ProfessionalIdentity.
   */
  async countConflicts(professionalIdentityId: string): Promise<number> {
    return conflictRepository.countByProfessionalIdentityId(professionalIdentityId);
  }
}

export const conflictService = new ConflictService();
