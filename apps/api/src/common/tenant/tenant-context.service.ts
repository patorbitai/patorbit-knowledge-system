// apps/api/src/common/tenant/tenant-context.service.ts
import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  /** The active organization ID for the current request. */
  organizationId: string;
  /** The authenticated user's profile ID (UUID). */
  profileId: string;
  /** The authenticated user's user ID (UUID). */
  userId: string;
}

@Injectable()
export class TenantContextService implements OnModuleDestroy {
  private readonly als = new AsyncLocalStorage<TenantContext>();

  /**
   * Run a callback with a given tenant context.
   * All downstream operations (DB queries, services) can retrieve the context.
   */
  run<T>(context: TenantContext, fn: () => T): T {
    return this.als.run(context, fn);
  }

  /** Return the current tenant context or throw if none is set. */
  getCurrent(): TenantContext {
    const ctx = this.als.getStore();
    if (!ctx) {
      throw new Error('No tenant context available. Ensure TenantMiddleware is applied.');
    }
    return ctx;
  }

  /** Return the current org ID or throw. */
  getOrganizationId(): string {
    return this.getCurrent().organizationId;
  }

  /** Return the current profile ID or throw. */
  getProfileId(): string {
    return this.getCurrent().profileId;
  }

  /** Return the current user ID or throw. */
  getUserId(): string {
    return this.getCurrent().userId;
  }

  /** Check if a tenant context is active. */
  hasContext(): boolean {
    return this.als.getStore() !== undefined;
  }

  onModuleDestroy() {
    // AsyncLocalStorage doesn't need explicit cleanup
  }
}
