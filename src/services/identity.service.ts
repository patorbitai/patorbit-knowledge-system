import type { ProfessionalIdentity } from "@prisma/client";
import { identityRepository } from "@/repositories/identity.repository";

/**
 * IdentityService — the bridge between authentication and the domain.
 *
 * Authentication (next-auth) answers "who is this person?" — it knows nothing
 * about the domain. IdentityService answers "who is this person professionally?"
 * and is the canonical entry point for every ProfessionalIdentity operation.
 *
 * This service must NEVER know anything about NextAuth, JWT, sessions, cookies,
 * or providers. It only ensures/loads the identity aggregate.
 *
 * Responsibilities:
 *  - ensure an identity exists (idempotent)
 *  - validation
 *  - orchestration
 *  - future domain events (Phase 0.5)
 */
export class IdentityService {
  /**
   * Idempotently return the ProfessionalIdentity for a user.
   *
   * If one exists → return it. Otherwise → create it.
   * Safe to call from any auth path (email, Google, LinkedIn, future APIs).
   */
  async ensureProfessionalIdentity(userId: string): Promise<ProfessionalIdentity> {
    if (!userId) {
      throw new Error("ensureProfessionalIdentity: userId is required.");
    }

    const existing = await identityRepository.findByUserId(userId);
    if (existing) {
      return existing;
    }

    const created = await identityRepository.create(userId);

    // ──────────────────────────────────────────────────────────────
    // TODO (Phase 0.5): emit an `IdentityCreated` domain event here.
    // Future subscribers may run side effects on first identity:
    //   - welcome email
    //   - default passport / default knowledge graph
    //   - initial trust report
    //   - AI onboarding
    // This public API will NOT change when the event is added.
    // ──────────────────────────────────────────────────────────────

    return created;
  }
}

export const identityService = new IdentityService();