// apps/api/src/audit/audit.decorator.ts
import { SetMetadata } from "@nestjs/common";

/**
 * Metadata key used to store audit configuration on decorated handlers/classes.
 */
export const AUDIT_METADATA = "audit:metadata";

/**
 * Options that can be passed to the @Audit() decorator.
 * All properties are optional -- when omitted the interceptor infers values
 * from the execution context (controller name, handler name, route params).
 */
export interface AuditOptions {
  /** Explicit action string (e.g. "claim.create"). Auto-derived when omitted. */
  action?: string;
  /** Explicit resource type (e.g. "claim"). Auto-derived when omitted. */
  resource?: string;
  /** Explicit resource ID. Falls back to `request.params.id` when omitted. */
  resourceId?: string;
}

/**
 * Decorator that marks a controller class or method for automatic auditing.
 *
 * When the {@link AuditInterceptor} is registered, every request hitting a
 * decorated handler will produce an {@link AuditEvent} row in the database.
 *
 * @example
 * ```ts
 * // Method-level – inherit action/resource from context
 * @Audit()
 * @Post()
 * create() { ... }
 *
 * // With explicit overrides
 * @Audit({ action: 'claim.create', resource: 'claim' })
 * @Post()
 * createClaim() { ... }
 * ```
 */
export const Audit = (options?: AuditOptions) =>
  SetMetadata(AUDIT_METADATA, options ?? {});
