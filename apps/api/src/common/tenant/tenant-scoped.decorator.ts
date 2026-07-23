// apps/api/src/common/tenant/tenant-scoped.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ORGANIZATION_OWNERSHIP_KEY = 'organization_ownership';

/**
 * Decorator that marks an endpoint as tenant-scoped, optionally
 * validating that the resource specified by a route parameter
 * belongs to the active organization.
 *
 * Basic usage — just requires the user to be in an org:
 *   @TenantScoped()
 *
 * With resource ownership validation — checks :id is owned by the org:
 *   @TenantScoped({ resource: 'workspace', param: 'id' })
 *
 * If the resource model doesn't have `organizationId` directly, use
 * lookupField to specify which field holds the org reference:
 *   @TenantScoped({ resource: 'profile', param: 'profileId', lookupField: 'organizationMember.organizationId' })
 */
export const TenantScoped = (ownership?: {
  resource: string;
  param?: string;
  lookupField?: string;
}) => SetMetadata(ORGANIZATION_OWNERSHIP_KEY, ownership ?? undefined);
