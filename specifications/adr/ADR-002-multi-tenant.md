# ADR-002: Multi-tenant Architecture

## Status: Accepted

## Context

The Patorbit Knowledge System supports multiple organizations (tenants) where each organization has its own isolated data, users, and configurations. Tenants need to be:

- **Data isolated:** Organizations cannot access each other's data
- **Resource controlled:** Each tenant can have different quotas and limitations
- **Administrated independently:** Organizations manage their own users and settings
- **Scalable:** Support for hundreds of organizations with thousands of users

## Decision

We will implement a multi-tenant architecture using organization-scoped data models, tenant resolution via Profile → OrganizationMember chain, AsyncLocalStorage for request-scoped context, and row-level security via TenantMiddleware + TenantGuard.

### Organization-scoped Data Model

**Core Entities:**

```typescript
// Organization (main tenant entity)
interface Organization {
  id: string;
  name: string;
  description?: string;
  website?: string;
  logoUrl?: string;
  deletedAt?: Date;
  members: OrganizationMember[];
  workspaces: Workspace[];
  subscriptions: Subscription[];
}

// OrganizationMember (links users to organizations with roles)
interface OrganizationMember {
  id: string;
  organizationId: string;
  profileId: string;
  role: OrganizationRole; // OWNER, ADMIN, MEMBER
  createdAt: Date;
  profile: Profile;
}

// Profile (user's profile within an organization)
interface Profile {
  id: string;
  userId: string;
  name: string;
  avatarUrl?: string;
  bio?: string;
  title?: string;
  department?: string;
  isActive: boolean;
}
```

### Tenant Resolution

**Request Flow:**

1. **Initial Request:** Extract organization context from request
2. **Profile Resolution:** Use `Profile → OrganizationMember` relationship
3. **Organization Lookup:** Validate user has membership in resolved organization
4. **Context Storage:** Store resolved tenant in AsyncLocalStorage for request lifecycle

**Implementation:**

```typescript
// Tenant resolution middleware
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Extract organization from request (header, param, or session)
    const organizationId = this.extractOrganizationId(req);

    // Resolve user's profile in that organization
    const profile = await this.resolveProfile(req.userId, organizationId);

    // Store tenant context in AsyncLocalStorage
    TenantContext.set({
      organizationId,
      profileId: profile.id,
      role: profile.organizationMember.role,
    });

    next();
  }
}
```

### AsyncLocalStorage for Request-scoped Context

**Purpose:**

- Maintain tenant context across async boundaries
- Avoid passing tenant context through every method parameter
- Support nested request handling (like after-webhooks)

**Implementation:**

```typescript
// Tenant context singleton
export class TenantContext {
  private static store = new AsyncLocalStorage<TenantContextData>();

  static get(): TenantContextData | undefined {
    return this.store.getStore();
  }

  static set(data: TenantContextData): void {
    this.store.enterWith(data);
  }

  static run<T>(data: TenantContextData, fn: () => T): T {
    return this.store.run(data, fn);
  }
}

interface TenantContextData {
  organizationId: string;
  profileId: string;
  role: OrganizationRole;
}
```

### Row-level Security

**Middleware:**

```typescript
// Tenant middleware for route protection
@Injectable()
export class TenantMiddleware implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes('organization/*', 'workspace/*', 'profile/*', 'knowledge/*', 'trust/*');
  }
}
```

**Guard:**

```typescript
// Tenant guard for permission checking
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const organizationId = request.params.organizationId;

    // Check if user has access to this organization
    return this.hasOrganizationAccess(user, organizationId);
  }
}
```

**Database Filtering:**

All database queries automatically filter by organization:

```typescript
// Example repository method
async findOrganizationKnowledge(profileId: string) {
  const context = TenantContext.get();

  return this.knowledgeEntity.findMany({
    where: {
      workspace: {
        organizationId: context.organizationId,
      },
      shared: true, // Include globally shared items
      OR: [
        {
          workspace: {
            organizationId: context.organizationId,
          },
        },
        {
          sharedByProfileId: profileId,
        }
      ]
    },
    include: { workspace: { select: { name: true } } },
  });
}
```

## Implementation Details

### Organization Membership API

```typescript
// Organization management endpoints
@Controller('organization')
@UseGuards(TenantGuard)
export class OrganizationController {
  // Create new organization
  @Post()
  create(@Body() dto: CreateOrganizationDto) {...}

  // Get current user's organizations
  @Get('my-organizations')
  getMyOrganizations(@CurrentUser() user: JwtPayload) {...}

  // Switch to another organization
  @Post('switch')
  switchOrganization(@Body() { organizationId }: SwitchOrganizationDto) {...}
}
```

### Profile Management

```typescript
// Profile within organization
@Controller('organization/:organizationId/profile')
@UseGuards(TenantGuard)
export class ProfileController {
  // Get current user's profile
  @Get('me')
  getMyProfile(@CurrentTenant() tenant: TenantContextData) {...}

  // Update profile
  @Patch('me')
  updateProfile(@CurrentTenant() tenant: TenantContextData, @Body() dto: UpdateProfileDto) {...}
}
```

### Permission System

**Role-based Access Control:**

- **OWNER:** Full control (invite members, delete organization)
- **ADMIN:** Administrative access (manage members, configure)
- **MEMBER:** Standard access (create/manage own data)

**Permission Checks:**

```typescript
@Injectable()
export class PermissionService {
  async canAccessProfile(profileId: string, action: 'read' | 'write' | 'delete'): boolean {
    const context = TenantContext.get();

    // Check if user is profile owner
    if (profile.userId === context.userId) {
      return true;
    }

    // Check organization role permissions
    const member = await this.getOrganizationMember(context.organizationId, context.userId);

    switch (member.role) {
      case OrganizationRole.OWNER:
        return true;
      case OrganizationRole.ADMIN:
        return action !== 'delete';
      case OrganizationRole.MEMBER:
        return action === 'read';
    }
  }
}
```

## Security Considerations

1. **Data Isolation:** All queries automatically filter by organization
2. **Permission Validation:** Middleware and guards enforce access control
3. **Context Propagation:** AsyncLocalStorage ensures context across async calls
4. **Audit Trails:** All organization access is logged with tenant context
5. **RBAC Implementation:** Role-based access control with hierarchy

## Migration Path

- Existing single-tenant installation can be converted by creating a default organization
- Users gradually migrate to organization-based membership model
- Data migration tools for existing user data
- Gradual rollout with mixed single and multi-tenant support

## Related Documents

- ADR-001: Authentication Architecture (references user management)
- deployment-guide.md (tenant-specific configuration)
- runbook.md (multi-tenant monitoring)
- specifications/organization/organization.module.md (organization implementation)

## Decision Rationale

This architecture provides:

1. **Strong Isolation:** Compulsory row-level security prevents data leakage
2. **Scalability:** Supports growth to hundreds of organizations
3. **Flexibility:** Role-based permissions allow various organizational structures
4. **Performance:** Request-scoped context avoids complex joins in queries
5. **Maintainability:** Clear boundaries between tenants simplify code

## Future Considerations

- Implement tenant quotas and resource limits
- Add tenant configuration and settings management
- Support for sub-organizations or nested structures
- Multi-geo distribution with regional tenant management
- Tenant-specific branding and customization

## References

1. OWASP Multi-tenant Architecture Guide
2. AWS Well-Architected Framework - Multi-tenant design
3. Google Cloud Platform - Multi-tenant patterns
4. PostgreSQL Row-Level Security documentation
5. Spring Boot Security - Multi-tenancy support

## Technical Implementation Status

- [x] Organization model and relationships
- [x] Profile and membership management
- [x] Tenant resolution middleware
- [x] Request-scoped context with AsyncLocalStorage
- [x] Row-level security implementation
- [ ] Tenant configuration management
- [ ] Advanced RBAC with permissions hierarchy
- [ ] Organization audit and compliance reporting
