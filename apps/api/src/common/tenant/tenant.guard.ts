// apps/api/src/common/tenant/tenant.guard.ts
import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { type Reflector } from '@nestjs/core';
import { type PrismaService } from '@patorbit/database';

import { type TenantContextService } from './tenant-context.service';
import { ORGANIZATION_OWNERSHIP_KEY } from './tenant-scoped.decorator';

/**
 * Guard that validates the authenticated user has a legitimate claim
 * to the organization they are operating within.
 *
 * It checks:
 * 1. That a tenant context exists (user is in an org).
 * 2. Optionally, that a route parameter ID (e.g. :id) resolves to a
 *    resource owned by that organization.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantContext: TenantContextService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get the ownership config from the @TenantScoped() decorator
    const ownership = this.reflector.getAllAndOverride<{
      resource: string;
      param?: string;
      lookupField?: string;
    }>(ORGANIZATION_OWNERSHIP_KEY, [context.getHandler(), context.getClass()]);

    // No ownership check required — allow
    if (!ownership) {
      return true;
    }

    // Must have a tenant context
    if (!this.tenantContext.hasContext()) {
      throw new ForbiddenException('No tenant context available');
    }

    const organizationId = this.tenantContext.getOrganizationId();

    // If no param is specified, we only verify org membership (which
    // TenantMiddleware already did). This is still useful for endpoints
    // that operate within the active org.
    if (!ownership.param) {
      return true;
    }

    // Extract the parameter value from the request
    const request = context.switchToHttp().getRequest();
    const resourceId = request.params[ownership.param];

    if (!resourceId) {
      throw new ForbiddenException(`Missing resource identifier (${ownership.param})`);
    }

    // Look up the resource and verify it belongs to the user's organization.
    // The lookupField tells us how to resolve ownership — either because the
    // model has organizationId directly, or because it chains through a relation.
    const resource = await this.prisma[ownership.resource].findUnique({
      where: { id: resourceId },
      select: { [ownership.lookupField ?? 'organizationId']: true },
    });

    if (!resource) {
      throw new ForbiddenException('Resource not found');
    }

    const actualOrgId = resource[ownership.lookupField ?? 'organizationId'];
    if (actualOrgId !== organizationId) {
      throw new ForbiddenException('Resource does not belong to your organization');
    }

    return true;
  }
}
