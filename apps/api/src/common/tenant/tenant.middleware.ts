// apps/api/src/common/tenant/tenant.middleware.ts
import { Injectable, type NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import { type PrismaService } from '@patorbit/database';
import { type NextFunction, type Request, type Response } from 'express';

import { type TenantContextService } from './tenant-context.service';

/**
 * Middleware that resolves the active tenant (organization) for every
 * authenticated request and stores it in the AsyncLocalStorage context.
 *
 * Strategy:
 * 1. If the user is authenticated (req.user exists), look up their
 *    organization membership via the Profile → OrganizationMember chain.
 * 2. If a header `x-organization-id` is provided, validate the user
 *    belongs to that org and use it.
 * 3. Otherwise, use the user's primary (first) organization.
 * 4. Unauthenticated requests (public endpoints) proceed without tenant
 *    context.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly configService: ConfigService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const user = req.user as { userId?: string; sub?: string } | undefined;
    const userId = user?.userId ?? user?.sub;

    // Public / unauthenticated requests — no tenant context
    if (!userId) {
      next();
      return;
    }

    try {
      // Look up the user's profile to find their organization membership
      const profile = await this.prisma.profile.findUnique({
        where: { userId },
        include: {
          organizationMembers: {
            include: { organization: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!profile || profile.organizationMembers.length === 0) {
        // User has no organization — this is allowed for initial onboarding
        next();
        return;
      }

      // Resolve the organization ID
      let organizationId: string;

      const headerOrgId = req.headers['x-organization-id'] as string | undefined;
      if (headerOrgId) {
        const membership = profile.organizationMembers.find(
          (m) => m.organizationId === headerOrgId,
        );
        if (!membership) {
          throw new UnauthorizedException('You do not belong to this organization');
        }
        organizationId = headerOrgId;
      } else {
        // Default to the user's first organization (their primary org)
        organizationId = profile.organizationMembers[0].organizationId;
      }

      // Run the rest of the request within the tenant context
      this.tenantContext.run({ organizationId, profileId: profile.id, userId }, () => next());
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // If anything goes wrong resolving the tenant, let the request
      // proceed without tenant context rather than breaking every request
      next();
    }
  }
}
