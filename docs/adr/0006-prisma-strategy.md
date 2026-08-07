# ADR-0006: Prisma & Database Strategy

**Status:** Accepted  
**Date:** 2026-08-07  
**Type:** Implementation ADR  
**Related:** `patorbit-docs/04_ADR/ADR-007` (Auth & Identity Ownership)

---

## Context

Patorbit needs a persistent data layer for authentication, session management, and professional identity data. The MVP constraint was to move fast without over-engineering the schema, while keeping the architecture open for the full domain model (Claims, Evidence, Trust, Passport) to be added incrementally.

---

## Decisions

### 1. PostgreSQL via Prisma ORM

**Chosen:** PostgreSQL + Prisma 6.x  
**Rejected:** MongoDB, SQLite, Supabase client-only

**Reasons:**
- PostgreSQL is the most capable relational database for complex queries the Trust pipeline will need (aggregations, joins across Claims/Evidence/Verification)
- Prisma provides type-safe database access, auto-generated migrations, and strong TypeScript integration
- Vercel Postgres is managed (no operational overhead)
- Prisma's schema-first approach enforces domain model discipline

**MongoDB rejected** because the relational structure of `User → ProfessionalIdentity → Claims → Evidence → Verification` is naturally relational and benefits from foreign key constraints and join operations.

### 2. Minimal Schema — Grow Incrementally

The current schema (`prisma/schema.prisma`) contains only the models required for the MVP:

```
User                   Auth principal
Account                OAuth accounts (NextAuth adapter — future use)
Session                JWT sessions (NextAuth adapter — presently empty)
VerificationToken      Email verification (not yet wired)
ProfessionalIdentity   Domain root aggregate (1:1 with User)
```

Domain models (`Resume`, `Claim`, `Evidence`, `Verification`, `Passport`, `KnowledgeGraph`) do **not** exist in Prisma yet. For MVP, resume data is stored in `localStorage`. This is a deliberate scope constraint, not an oversight.

**Resume migration path** (future sprint):

```
Add to schema.prisma:
  model Resume {
    id          String   @id @default(cuid())
    identityId  String
    data        Json     (serialized Resume object)
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
    identity    ProfessionalIdentity @relation(...)
  }
```

Once the `Resume` model exists, the Zustand persist layer becomes a local cache synced to the database on save.

### 3. Ownership Model: ProfessionalIdentity as Root

Per ADR-007, **no business data attaches directly to `User`**. The `User` model is auth-only.

```
User.id ─────────────── auth principal
  └── ProfessionalIdentity.userId (1:1, @unique)
        └── [all future domain models].identityId
```

All future Prisma models must use `identityId` as their foreign key, never `userId`. This is enforced by convention (code review), not a Prisma constraint, but should be validated in PRs.

### 4. Prisma Client Singleton

To avoid exhausting the database connection pool in Next.js development (hot-reload creates new module instances), the Prisma client is a global singleton:

```ts
// src/lib/prisma.ts
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

In production, module caching prevents re-instantiation. In development, the global reference persists across hot reloads.

### 5. Migration Strategy

**Development:** `npx prisma migrate dev --name <description>`  
Creates a new migration file in `prisma/migrations/` and applies it to the local database.

**Production:** `npx prisma migrate deploy`  
Applies pending migrations. Must be run manually before deploying any release that includes schema changes. (Vercel does not run this automatically — only `prisma generate` runs in the build script.)

**Seeding:** Not implemented. Initial data is created via the auth registration flow (User record) and `ensureProfessionalIdentity()` on first login.

### 6. Repository Pattern

Database access is abstracted through repository classes in `src/repositories/`:

```
src/repositories/
  user.repository.ts
  claim.repository.ts       (empty — MVP stub)
  evidence.repository.ts    (empty — MVP stub)
  identity.repository.ts
```

Repositories:
- Accept and return domain objects, not Prisma types
- Never import from `next-auth`, `cookies()`, or session utilities
- Are the only files that import `prisma` from `src/lib/prisma.ts`
- Are injected into services (not called directly from API routes)

**Empty repositories (`claim.repository.ts`, `evidence.repository.ts`)** exist as stubs. They will be populated when the corresponding Prisma models are added. See `patorbit-docs/04_ADR/ADR-002` for the evidence engine beta path.

### 7. No ORM Magic — Explicit Queries

Prisma's `include` and `select` are used explicitly. No `findFirst` without a `where` clause. No raw SQL without justification. Every query must be scoped to an `identityId` to prevent cross-user data leakage.

---

## Consequences

**Positive:**
- Type-safe database access with Prisma (TypeScript errors if query shape changes)
- Clean domain boundary: `User` is auth, `ProfessionalIdentity` owns business data
- Incremental schema growth: new domain models added without breaking existing auth layer

**Trade-offs:**
- Resume data in localStorage means no cross-device sync until `Resume` model is added (Backlog I-01)
- Empty repository stubs may confuse developers who find them
- Manual migration deployment to production (risk of forgetting before pushing schema changes)

**Risks:**
- Connection pool exhaustion under high load (Vercel Postgres connection limits) — mitigate with PgBouncer or connection pooler when traffic warrants
- `prisma migrate deploy` must be run before deploying schema-changing releases — add to release checklist

---

## Cross-References

| ADR | Relationship |
|---|---|
| `patorbit-docs/04_ADR/ADR-007` | Domain ownership model that dictates schema structure |
| `patorbit-docs/04_ADR/ADR-002` | Evidence engine beta path; empty repositories are intentional |
| `docs/adr/0005-authentication-architecture.md` | Auth layer built on this database strategy |
| `docs/RELEASE_PLAN.md` | Migration deployment step in pre-release checklist |
| `docs/PRODUCT_BACKLOG.md` | I-01: Resume DB sync; T-02: Evidence storage migration |
