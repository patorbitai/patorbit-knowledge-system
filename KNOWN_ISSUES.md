# Patorbit Beta v0.9 — Known Issues

## Critical (P0)

_None — all critical issues resolved for RC1._

## High (P1)

### Platform Service Duplication

Storage, notifications, and config services exist as both shared packages (`@patorbit/storage`, `@patorbit/notifications`, `@patorbit/config`) and API platform modules (`apps/api/src/platform/storage`, `apps/api/src/platform/notifications`). This creates maintenance overhead. Resolution planned for v0.10.

**Impact:** Maintainability; does not block user functionality.

### Missing Build Scripts for Shared Packages

Several shared packages (auth, ai, types, utils) lacked build scripts in the original audit. These now have `tsup`-based builds.

**Impact:** Resolved for RC1; remaining packages may need updates in future releases.

### Missing tsconfig for `@patorbit/billing`

The billing package had no `tsconfig.json`. A minimal config was added, but strict type compliance is not yet verified.

**Impact:** Low — billing is optional and feature-gated.

## Medium (P2)

### Placeholder Lint Scripts Removed

- `apps/web` and `@patorbit/database` used `echo lint-ok` placeholders. The web app now runs real ESLint. Database package uses real lint.

**Impact:** Minor — lint warnings in web app persist (~40 warnings, mostly `no-explicit-any` and unused variables).

### Test Files Excluded from Build

The following test/development files were moved out of the build path to unblock RC1:

- `apps/web/src/lib/validation/resume.spec.ts` → `.../disabled/resume.spec.ts`
- `apps/web/tests/` → `web-tests-backup/` (at repo root)
- `apps/web/src/lib/stores/use-application-store.ts` — removed (unfinished feature)
- `apps/web/src/app/(dashboard)/applications/page.tsx` — removed (unfinished feature)
- `apps/web/src/app/(dashboard)/dev/page.tsx` — removed (dev-only page)

**Restore plan:** These will be re-enabled when a proper test pipeline (not dependent on production build) is configured.

### Compiled Artifacts in `packages/database/`

Historical `.js` and `.js.map` files may remain in `packages/database/src/`. These are ignored by git but may confuse some tools.

### Missing Lint Scripts

- `@patorbit/tsconfig` — no lint script (no source code to lint)
- `@patorbit/scripts` — no lint script (placeholder package)
- `@patorbit/tooling` — no lint script (placeholder package)

### Test Pipeline Depends on Build

The `turbo.json` test task requires `build` to complete first. This slows down `pnpm test`. CI configuration should run unit tests separately.

### Deprecated Dependencies

- `uuid@10.0.0` (deprecated; use `crypto.randomUUID()`)
- `@types/minio` (deprecated)
- Several transitive deprecations (`glob`, `rimraf`, `inflight`, etc.)

### Peer Dependency Mismatch

- `@storybook/test@8.6.15` vs required `8.6.18` — minor, non-blocking.

## Low (P3)

### Root Directory Clutter

Multiple top-level directories with overlapping purposes: `docs`/`site`/`website`, `tools`/`tooling`/`scripts`, `specifications`/`references`. Cleanup planned for future sprint.

### Unimplemented Resume Parsers

PDF, DOCX, and LinkedIn resume parsers in `apps/api/src/resume/import/parsers/` contain only TODO placeholders.

### `@patorbit/tsconfig` Listed as Runtime Dependency

Listed in `dependencies` of `apps/web` and `apps/admin` instead of `devDependencies`. Functionally correct but semantically incorrect.

### CORS Fallback

API uses `process.env.FRONTEND_URL || "http://localhost:3000"` as CORS origin. In production, `FRONTEND_URL` must be explicitly set.

### Feature Flag Surface

All `FEATURE_*` env vars become feature flags, creating a broad implicit API surface. Should have an explicit allowlist.

### No CSP Header

Content-Security-Policy is not explicitly configured beyond defaults. Should be hardened for production.

### CSRF Documentation Gap

CSRF middleware is intentionally disabled (SameSite cookie pattern), but this decision is only documented in inline comments.

---

_Generated 2026-07-25 for Patorbit Beta v0.9 RC1_
