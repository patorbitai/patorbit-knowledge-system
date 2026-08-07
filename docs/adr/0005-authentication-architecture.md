# ADR-0005: Authentication Architecture

**Status:** Accepted  
**Date:** 2026-08-07  
**Type:** Implementation ADR  
**Implements:** `patorbit-docs/04_ADR/ADR-007` (Auth & Identity Ownership)

---

## Context

Sprint 1 implemented authentication as the foundational layer. Several significant technical decisions were made — and several production bugs were encountered and fixed. This ADR documents the choices, the bugs, and the rationale so future engineers understand why the auth layer looks the way it does.

---

## Decisions

### 1. NextAuth.js v4 (not v5)

**Chosen:** NextAuth.js v4.24.x  
**Rejected:** NextAuth.js v5 (Auth.js)

**Reason:** NextAuth v5's `@auth/prisma-adapter` introduced breaking changes in the session callback and `authorize()` return type. Specifically:
- The v5 adapter expected `user.id` to be returned differently from the credentials provider
- Session augmentation (`next-auth.d.ts`) behaved differently between v4 and v5
- The v5 migration guide recommends a full rewrite of the auth config

The project was mid-sprint. v4 was battle-tested, stable, and had clear documentation. **The decision to stay on v4 is intentional, not an oversight.**

Migration to v5/Auth.js is deferred to a dedicated sprint when breaking changes can be addressed systematically.

### 2. Credentials Provider Only (for MVP)

**Chosen:** Credentials provider (email + password)  
**Deferred:** Google OAuth, LinkedIn OAuth, GitHub OAuth

**Reason:** OAuth providers add social login flows, account linking complexity, and third-party dependency for a feature that users need to verify. For MVP, email/password is the simplest path to a working auth system.

The identity ownership model (ADR-007) is designed to be provider-agnostic: `ensureProfessionalIdentity(userId)` is idempotent and works regardless of whether the user authenticated via email, Google, or LinkedIn. Adding OAuth providers in a future sprint requires only adding a new NextAuth provider — no domain logic changes.

### 3. bcryptjs (not bcrypt)

**Chosen:** `bcryptjs` (pure JavaScript)  
**Rejected:** `bcrypt` (native C++ bindings)

**Reason:** `bcrypt` requires native compilation. Vercel's serverless runtime does not provide native module support at build time, causing deployment failures. `bcryptjs` is a pure-JS drop-in replacement with identical API and comparable security characteristics.

This was discovered in production (Sprint 1 deployment failure). The fix was to replace `import bcrypt from "bcrypt"` with `import bcrypt from "bcryptjs"` — a one-line change.

### 4. JWT Session Strategy

**Chosen:** JWT sessions  
**Rejected:** Database sessions

**Reason:** Database sessions require reading the `Session` table on every request to validate the session. JWT sessions are validated at the edge (in middleware) without a database call. For a platform where session validation happens on every page navigation (due to route protection), JWT is significantly more efficient.

**Trade-off:** JWTs cannot be revoked server-side without a denylist. For MVP this is acceptable. Account deletion will need to implement token revocation (or wait for session expiry) — documented in `KNOWN_ISSUES.md`.

### 5. Session Augmentation

NextAuth's default `Session.user` type does not include `id`. The user's database ID is needed in API routes to scope queries to the authenticated user.

**Solution:** `src/types/next-auth.d.ts` augments the `Session` interface:

```ts
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
```

The `id` is injected in `authOptions.callbacks.session`:

```ts
session({ session, token }) {
  if (token.sub) session.user.id = token.sub;
  return session;
}
```

### 6. Prisma Adapter Models

The NextAuth Prisma adapter requires four models:

| Model | Purpose |
|---|---|
| `User` | Auth principal + profile |
| `Account` | OAuth provider accounts (future use) |
| `Session` | Database sessions (unused with JWT, but adapter requires the model) |
| `VerificationToken` | Email verification tokens (not yet wired) |

The `Account` and `Session` models exist to satisfy the adapter's schema requirements even though they are not actively used in the credentials-only, JWT-session MVP.

### 7. Build-Time DATABASE_URL Guard

Prisma generates a client that reads `DATABASE_URL` at import time. This caused build failures on Vercel when the env var was available at runtime but not at build-time image creation.

**Solution:** The Prisma client is instantiated in a singleton pattern that defers connection until the first query:

```ts
// src/lib/prisma.ts
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

The `package.json` build script runs `prisma generate` before `next build` to ensure the generated client is present at build time.

### 8. Route Protection via Middleware

`src/middleware.ts` uses NextAuth's `getToken()` to check for a valid JWT at the edge. This runs before any page component renders, ensuring protected pages never show a flash of unauthenticated content.

```ts
export { default } from "next-auth/middleware";
export const config = {
  matcher: ["/overview/:path*", "/resume-builder/:path*", "/passport/:path*", ...]
};
```

**Alternative considered:** Per-page `getServerSideProps` auth checks. Rejected — adds boilerplate to every page, cannot intercept at the network edge, and is slower (full SSR before redirect).

---

## Known Gaps (from ADR-007 Implementation Roadmap)

| Phase | Status | Notes |
|---|---|---|
| Phase 0: ProfessionalIdentity model | ✅ Done | Prisma schema has `ProfessionalIdentity` model |
| Phase 0.5: `ensureProfessionalIdentity()` | ✅ Done | `src/services/identity.service.ts` |
| Phase 1: NextAuth + middleware | ✅ Done | Deployed |
| Phase 2: Auth modal, Builder gating | ✅ Done | Route protection active |
| Phase 3: Identity migration for existing localStorage data | ❌ Pending | `PRODUCT_BACKLOG.md` I-01 |
| Phase 4: Google / LinkedIn OAuth | ❌ Pending | `PRODUCT_BACKLOG.md` A-05 |
| Phase 5: Security hardening, password recovery, audit logs | ❌ Pending | `PRODUCT_BACKLOG.md` A-01–A-06 |

---

## Consequences

**Positive:**
- Auth is production-stable and tested
- JWT edge validation is fast; no DB round-trip per page load
- Provider-agnostic architecture allows OAuth addition without domain changes

**Technical debt:**
- Email verification not yet wired (tokens exist in schema, flow not built) — `KNOWN_ISSUES.md` M-01
- Password reset not built — `KNOWN_ISSUES.md` M-02
- JWT sessions cannot be revoked server-side

---

## Cross-References

| ADR | Relationship |
|---|---|
| `patorbit-docs/04_ADR/ADR-007` | Strategic auth ownership model this implements |
| `docs/adr/0006-prisma-strategy.md` | Database layer this auth system builds on |
| `docs/adr/0003-dashboard-navigation.md` | Route protection targets |
| `docs/KNOWN_ISSUES.md` | M-01 (no email verify), M-02 (no password reset) |
