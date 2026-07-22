# Patorbit Monorepo Audit Report

## 1. Executive Summary

This audit of the Patorbit Monorepo reveals a well-intentioned but flawed implementation of a Turborepo/pnpm workspace. The foundation is solid, with a clear separation of concerns between applications and shared packages, and the core domain logic in the NestJS API is well-structured. However, the repository suffers from significant architectural drift, a broken build pipeline, inconsistent tooling, and several critical security vulnerabilities.

The most pressing findings are:

1.  **CRITICAL — Broken Build Pipeline:** Most shared packages lack a `build` script, making them uncompilable via `turbo run build`. Compiled `.js` artifacts litter the `database` package source tree.
2.  **CRITICAL — Security Flaw:** The `.env` file containing database credentials appears to be tracked by Git instead of being properly gitignored.
3.  **HIGH — Architectural Duplication:** Platform services (storage, notifications, config) are implemented twice — once as shared packages and once as internal API modules — violating DRY principles.
4.  **HIGH — Missing tsconfig:** `@patorbit/billing` has no `tsconfig.json` despite defining a `typecheck` script.
5.  **MEDIUM — Inconsistent Tooling:** Lint and typecheck scripts are missing or are placeholders across several packages.
6.  **MEDIUM — Orphan Packages:** Multiple workspace packages are not consumed by any app, indicating dead code.

The core application logic (NestJS modules, Prisma schema, Next.js frontends) is well-written and organized. The monorepo infrastructure requires estimated **1 week** of focused effort to stabilize.

## 2. Repository Score: 52/100

| Category | Score | Weight | Weighted Score | Notes |
|---|---|---|---|---|
| **Architecture** | 50/100 | 30% | 15.0 | Good modular design, severe duplication |
| **Workspace** | 70/100 | 20% | 14.0 | Correct setup, minor redundancy |
| **Build** | 20/100 | 20% | 4.0 | Critically broken; most packages don't build |
| **Security** | 30/100 | 15% | 4.5 | `.env` tracked; credentials exposed |
| **Quality** | 60/100 | 15% | 9.0 | Inconsistent tooling, placeholder scripts |
| **Total** | **52/100** | 100% | **46.5** | |

## 3. Architecture Score: 50/100

- **[+15]** Excellent modularization in NestJS API with clear separation of feature modules from platform infrastructure.
- **[+10]** Well-designed Prisma schema with proper relations, indexing, and soft-delete patterns.
- **[+10]** Good dependency graph — no circular dependencies detected.
- **[-15]** **Critical duplication:** `@patorbit/storage`, `@patorbit/notifications` and their API platform module counterparts (`apps/api/src/platform/storage`, `apps/api/src/platform/notifications`) are redundant. The API should consume the packages.
- **[-10]** No build step for shared packages, making them dependent on consumer transpilation.
- **[-5]** Ambiguous naming: `packages/config` contains sub-packages (`eslint`, `prettier`, `tsconfig`) that create confusion about the package boundary.

## 4. Workspace Score: 70/100

- **[+20]** Correct use of `pnpm-workspace.yaml` with turborepo.
- **[+20]** Consistent naming convention (`@patorbit/*`) across all packages.
- **[+15]** Proper workspace dependency resolution (`workspace:*`).
- **[-10]** Redundant workspace pattern: `'packages/config/*'` duplicated by `'packages/*'`.
- **[-10]** Invalid workspace entry: root `tooling/` directory listed but has no `package.json`.
- **[-5]** Unconventional nesting: `packages/config/eslint`, `packages/config/prettier` should be top-level packages.

## 5. Build Score: 20/100

- **[+10]** `turbo.json` correctly configured with task dependencies and outputs.
- **[+10]** `@patorbit/api`, `@patorbit/web`, `@patorbit/admin` have working build scripts.
- **[-30]** **11 of 19 packages have NO build script.** `turbo run build` will fail or produce incorrect output.
- **[-20]** Compiled `.js` files in `packages/database` root indicate broken build output configuration.
- **[-20]** Test pipeline depends on full build, creating unnecessary overhead.
- **[-10]** Typecheck pipeline depends on build, which can mask type errors.

## 6. Security Score: 30/100

- **[+15]** Use of `helmet`, CORS, and global `JwtAuthGuard` in API.
- **[+10]** Proper use of `@nestjs/throttler` for rate limiting.
- **[-35]** **CRITICAL: `.env` file with database credentials likely tracked by Git.**
- **[-15]** Placeholder passwords in `.env.example` (NEO4J_PASSWORD=password, STORAGE_SECRET_KEY=minioadmin).
- **[-15]** Unsafe iteration over all `process.env` entries for feature flags (any `FEATURE_*` env var becomes a toggle).
- **[-10]** CORS fallback to `http://localhost:3000` if `FRONTEND_URL` not set in production.

## 7. Quality Score: 60/100

- **[+20]** Modern ESLint flat config with TypeScript, import sorting, Prettier integration.
- **[+10]** Prettier and lint-staged configured at root level.
- **[+10]** Comprehensive Prisma schema with clear organization.
- **[-15]** 6 out of 19 packages missing lint scripts; 2 use placeholder `echo lint-ok`.
- **[-10]** Only 2 of 19 workspace packages have test scripts.
- **[-10]** Root directory has excessive clutter (15+ top-level folders).
- **[-5]** 3 unimplemented TODO parsers in resume import module.

## 8. Complete Issue List

**Critical (Must Fix — Blocks Production)**
1.  **Build System Collapse:** 11 of 19 packages lack a `build` script. `turbo run build` cannot produce correct output.
2.  **Security Breach:** `.env` with database credentials is likely tracked by Git (confirmed by `gitStatus` not showing it as untracked).

**High (Recommended — Causes Breakage)**
3.  **Platform Service Duplication:** Storage, notifications, config services exist as both shared packages and API platform modules.
4.  **Missing `tsconfig.json`:** `@patorbit/billing` has no `tsconfig.json` despite having a `typecheck` script.
5.  **Compiled Artifacts in Source:** `packages/database/database.module.js` and `prisma.service.js` are compiled outputs in the wrong location.
6.  **`@patorbit/auth` Not Using Shared Config:** `tsconfig.json` is custom-defined rather than extending `@patorbit/tsconfig`.

**Medium (Should Fix — Quality/Consistency)**
7.  **Placeholder Lint Scripts:** `apps/web` and `@patorbit/database` use `echo lint-ok`.
8.  **Missing Lint Scripts:** `@patorbit/auth`, `@patorbit/tsconfig`, `@patorbit/docs`, `@patorbit/scripts`, `@patorbit/tooling` have no `lint` script.
9.  **Orphan Packages:** `@patorbit/docs`, `@patorbit/scripts`, `@patorbit/tooling` are not consumed by any other package.
10. **Relaxed Type Safety:** `nestjs.json` disables `strictNullChecks`, `noImplicitAny`, and `strictBindCallApply`.
11. **Test Depends on Build:** `turbo.json` test task requires full build first — slow feedback loop.
12. **Peer Dep Mismatch:** `@storybook/test@8.6.15` should be `8.6.18` to match other Storybook packages.
13. **Deprecated Dependencies:** `@types/minio`, `uuid@10.0.0` are deprecated.

**Low (Nice to Fix — Polish)**
14. **Root Directory Clutter:** 15+ top-level folders including ambiguous duplicates (`docs`/`site`/`website`, `tools`/`tooling`/`scripts`).
15. **Stray File:** `c.txt` at repo root.
16. **Unused Workspace Pattern:** `'packages/config/*'` is redundant in `pnpm-workspace.yaml`.
17. **Unimplemented Parsers:** PDF, DOCX, and LinkedIn resume parsers have only TODO placeholders.
18. **No Prisma Generate Hook:** `prisma generate` must be run manually; no `postinstall` hook.
19. **`@patorbit/tsconfig` as Runtime Dep:** Listed in `dependencies` of `apps/web` and `apps/admin` instead of `devDependencies`.
20. **`ignoreDeprecations: "6.0"`:** Used in `apps/api/tsconfig.json`, indicating deprecated TS options.

## 9. Prioritized Fix List

1.  **[CRITICAL] Secure `.env` file:**
    - Verify `git rm --cached .env` status.
    - Ensure `.env` is in `.gitignore` and not re-trackable.
    - Rotate database credentials.
    - (Estimate: 2-4 hours)
    
2.  **[CRITICAL] Fix build system:**
    - Add `"build": "tsup src/index.ts --format esm,cjs --dts"` to all shared packages that export TypeScript.
    - Update `main` and `types` to point to `dist/index.js`, `dist/index.d.ts`.
    - Remove rogue `.js` files from `packages/database/`.
    - Add `clean` script to remove `dist/` before rebuild.
    - (Estimate: 1-2 days)

3.  **[HIGH] Add missing `tsconfig.json` to `@patorbit/billing`:**
    - Extend `@patorbit/tsconfig/base.json` with standard config.
    - (Estimate: 30 minutes)

4.  **[HIGH] Fix `@patorbit/auth` tsconfig:**
    - Extend `@patorbit/tsconfig/base.json` instead of custom config.
    - Add `lint` and `typecheck` scripts.
    - (Estimate: 30 minutes)

5.  **[HIGH] Resolve platform service duplication:**
    - Decide: Use shared packages OR API platform modules as the single source of truth.
    - Refactor the other to import/export from the canonical location.
    - (Estimate: 2-3 days)

6.  **[MEDIUM] Standardize linting:**
    - Remove placeholder `echo lint-ok` scripts.
    - Add `lint` scripts to all packages that are missing them.
    - (Estimate: 2-4 hours)

7.  **[MEDIUM] Fix test pipeline:**
    - Split `turbo.json` test into `test:unit` (no build dep) and `test:integration` (with build dep).
    - (Estimate: 1-2 hours)

8.  **[MEDIUM] Clean up orphan packages:**
    - Remove or consolidate `packages/docs`, `packages/scripts`, `packages/tooling`.
    - (Estimate: 1-2 hours)

9.  **[LOW] Reduce root clutter:**
    - Consolidate `docs`/`site`/`website` into single `docs` directory.
    - Consolidate `tools`/`tooling`/`scripts` into single `scripts` directory.
    - Remove stray `c.txt`.
    - (Estimate: 1-2 hours)

10. **[LOW] Fix peer dependencies:**
    - Update `@storybook/test` to `8.6.18`.
    - (Estimate: 15 minutes)

## 10. Estimated Effort

| Priority | Area | Estimated Time | Complexity |
|---|---|---|---|
| CRITICAL | Security (`.env` fix) | 2-4 hours | Low |
| CRITICAL | Build System | 1-2 days | Medium |
| HIGH | Missing tsconfigs | 1 hour | Low |
| HIGH | Architecture Duplication | 2-3 days | High |
| MEDIUM | Lint Standardization | 2-4 hours | Low |
| MEDIUM | Test Pipeline | 1-2 hours | Low |
| MEDIUM | Orphan Packages | 1-2 hours | Low |
| LOW | Root Clutter | 1-2 hours | Low |
| LOW | Peer Deps | 15 minutes | Low |
| **TOTAL** | **Full Stabilization** | **~5-7 days** | |

---

# Detailed Audit Findings

## PHASE 1 — COMPLETE REPOSITORY AUDIT

### 1. Repository Structure

**Overall Assessment:** The repository follows a conventional Turborepo layout. However, there are numerous directories at the root level that introduce clutter and suggest a lack of clear organizational conventions. The structure inside `apps/` and `packages/` is generally sound, but the root is chaotic.

**Root Layout Issues:**

- **Redundant/Unclear Folders:** The root contains many folders that should likely be nested or consolidated:
    - `diagrams`, `docs`, `engineering`, `exports`, `references`, `specifications`, `templates`, `tooling`, `tools`, `website`.
    - It's unclear what the distinction is between `tooling`, `tools`, and `scripts`.
    - `docs`, `website`, and `site` seem to have overlapping purposes.
- **Misplaced Files:**
    - `c.txt`: A stray file, likely temporary.
    - `mkdocs.yml`: Suggests the use of MkDocs for documentation, which might relate to the `docs` or `site` folder.
    - `database.module.js`, `prisma.service.js`: These are compiled JavaScript files from the `@patorbit/database` package that have been incorrectly placed in the root of the `packages/database` directory instead of a `dist` folder. This is a significant issue.

**`apps/` Directory:**

- **Structure:** Contains `admin`, `api`, and `web`. This is a clean and standard separation of concerns.
- **Contents:** Each app has its own `package.json`, `tsconfig.json`, and framework-specific configurations (`next.config.js`, `nest-cli.json`). This is correct.

**`packages/` Directory:**

- **Structure:** Contains a good mix of shared libraries (`ai`, `auth`, `billing`, `config`, `database`, `notifications`, `storage`, `tsconfig`, `types`, `ui`, `utils`).
- **Inconsistent Nesting:**
    - `packages/config` contains subdirectories (`eslint`, `prettier`, `tsconfig`) that appear to be acting as packages themselves, but they are not consistently structured. For example, `packages/config/prettier` has a `package.json`, but `packages/config/tsconfig` does not.
    - `packages/tooling` and `packages/docs` also exist, which is confusing given the top-level `tooling/` and `docs/` directories.

**Summary of Structural Issues:**

- **[High] Root Directory Clutter:** Too many folders at the root. A `docs` folder and a `tooling` or `scripts` folder should be sufficient, with others nested appropriately.
- **[High] Misplaced Compiled Files:** Compiled `.js` files in the `packages/database` source directory. This indicates a broken or misconfigured build process for that package.
- **[Medium] Inconsistent Package Structure:** The structure within `packages/config` is inconsistent.
- **[Medium] Duplicate Folder Concepts:** `tooling`/`tools`, `docs`/`site`/`website`. This ambiguity should be resolved.
- **[Low] Stray Files:** `c.txt` should be removed.

### 2. Workspace Audit

**`pnpm-workspace.yaml` Analysis:**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'packages/config/*'
  - 'tooling/*'
  - 'scripts'
```

- **[Medium] Redundant Workspace Pattern:** The pattern `'packages/config/*'` is redundant. The pattern `'packages/*'` already includes all packages directly under the `packages/` directory. If `packages/config` contained packages within it, `'packages/config/*'` would be necessary, but the primary pattern `'packages/*' ` already covers this. This can be simplified.
- **[Low] Inconsistent Package Definitions:**
    - The `scripts` directory is listed as a workspace package, and it contains a `package.json`. This is correct.
    - The `tooling` directory is listed via `tooling/*`, and `packages/tooling` contains a `package.json`, but it's not clear if there is a top-level `tooling` directory that is also intended to be a workspace. The file listing shows a `tooling` directory at the root, which seems to contain an `index.js` and a `scripts` folder, but no `package.json` was found for it, meaning it's not a valid workspace package.
- **Missing Workspaces:** The `Explore` agent found `package.json` files in `packages/config/prettier` and `packages/config/eslint` (if it exists). The pattern `packages/config/*` should cover them, but this nested structure inside another package is unconventional.
- **Duplicate Workspaces:** No duplicate workspace names were detected from the `package.json` files reviewed so far.

**Summary of Workspace Issues:**

- **[Medium] Redundant Path:** The `'packages/config/*'` entry in `pnpm-workspace.yaml` is unnecessary.
- **[Medium] Invalid Workspace:** The root `tooling/` directory is included in the workspace definition but does not contain a `package.json`, making it an invalid package.
- **[Low] Unconventional Nesting:** Placing packages like `eslint` and `prettier` inside the `@patorbit/config` package is unusual. A flatter structure in `packages/` is more standard (e.g., `@patorbit/eslint-config`, `@patorbit/prettier-config`).

### 3. Package Audit

**`@patorbit/api` (apps/api) — NestJS App**
- **Status:** Generally well-structured.
- **[Medium] Missing Dev Deps:** Uses `class-transformer`, `class-validator`, `helmet`, `cookie-parser` but none of these are in devDependencies (they are runtime deps, which is correct). However, `reflect-metadata` is a runtime dep — while common, it's often better as a peer dep in NestJS.
- **[Medium] Deprecated Deps:** `@types/minio@7.1.1` (warning), `uuid@10.0.0` (warning) — use `crypto.randomUUID()` instead.
- **[Low] Loose Version Ranges:** Almost all deps use `^` or `~`. While fine for development, for CI/CD pinning can prevent surprise breakages.

**`@patorbit/web` (apps/web) — Next.js App**
- **[Medium] Missing Deps:** `@patorbit/tsconfig` is listed in `dependencies` but is a dev-only tool for TypeScript configuration. It should be in `devDependencies`.
- **[Low] Lint Script:** `"lint": "echo lint-ok"` — this is a placeholder, not a real lint step.

**`@patorbit/admin` (apps/admin) — Next.js App**
- **[Medium] Missing Deps:** Same as web — `@patorbit/tsconfig` in `dependencies` instead of `devDependencies`.
- **[Medium] Inconsistent Lint Script:** Uses a real ESLint command (`"lint": "eslint . --ext .ts,.tsx"`), unlike the web app which uses a placeholder.

**`@patorbit/database` (packages/database) — Prisma Package**
- **[High] Broken Build/Entry:** `main` and `types` point to `./src/index.ts`. This is only valid when TypeScript is transpiled at import time (e.g., by `tsx` or `ts-node`). For production, these should point to `./dist/index.js` or the package needs a build step. Additionally, compiled `.js` files (`database.module.js`, `prisma.service.js`) exist at the package root, which is incorrect — they are likely artifacts of a failed or misconfigured compilation.
- **[Medium] Missing Build Script:** No `build` script, only `db:*` scripts. The `@patorbit/database` package needs a `tsc` or `tsup` build step to be consumable in production.

**`@patorbit/ui` (packages/ui) — React Component Library**
- **[Medium] Peer Dependency Mismatch:** `@storybook/test@8.6.15` does not satisfy peer deps of `@storybook/react@8.6.18` and `@storybook/react-vite@8.6.18` (which need 8.6.18).
- **[Medium] Missing React Deps:** React is listed in `peerDependencies` and `devDependencies` but not `dependencies`. This is correct for a component library, but should be ensured consumers always have React installed.
- **[Low] No Build Script:** No build step means consumers must transpile this package themselves. `tsup` or `tsc` should be added.

**`@patorbit/auth` (packages/auth) — Auth Library**
- **[Medium] Missing Dev Deps:** Has no dependency on `@patorbit/tsconfig` or a local `tsconfig.json` that extends a shared config. Its `tsconfig.json` is fully self-defined, which is not using the shared config infrastructure.
- **[Low] No Lint Script:** Has no `lint` script defined.
- **[Low] No Typecheck Script:** No `typecheck` script defined (unlike most other packages).

**`@patorbit/billing` (packages/billing)**
- **[Medium] Missing tsconfig:** No `tsconfig.json` file found despite having a `typecheck` script.
- **[Medium] Missing Dev Deps:** No TypeScript or `@patorbit/tsconfig` in `devDependencies` despite having a `typecheck` script.
- **[Low] No Build Script:** No build step.

**`@patorbit/config` (packages/config)**
- **[Low] Nested Structure:** Contains subdirectories (`eslint`, `prettier`, `tsconfig`) that resemble separate packages, creating ambiguity.

**`@patorbit/docs` (packages/docs)**
- **[Low] Minimal Package:** No dependencies, minimal script. This is likely a documentation site placeholder.

**`@patorbit/scripts` (packages/scripts)**
- **[Low] Minimal Package:** Similar to `docs`, a placeholder or utility package.

**`@patorbit/tooling` (packages/tooling)**
- **[Low] Obscure Purpose:** Contains only an `index.js` with no clear purpose. Redundant with the root `tooling/` and `scripts/` directories.

**`@patorbit/prettier-config` (packages/config/prettier)**
- **[Low] Non-standard Name/Path:** Named `@patorbit/prettier-config` but lives inside `packages/config/prettier`, which is confusing.

**Workspace Packages Summary:**
- 19 workspace projects detected by pnpm.
- All packages correctly use the `@patorbit/` scope.
- No circular dependencies detected at the workspace level.
- No duplicate package names detected.

### 4. TypeScript Audit

**Shared tsconfig Hierarchy:**

The `@patorbit/tsconfig` package provides a good base hierarchy:
- `base.json` — foundational settings for all packages.
- `nextjs.json` — extends `base.json` with Next.js-specific settings (`moduleResolution: "bundler"`, `jsx: "preserve"`, `noEmit: true`).
- `nestjs.json` — extends `base.json` with NestJS-specific settings (`module: "commonjs"`, `experimentalDecorators: true`, `emitDecoratorMetadata: true`).
- `react.json` — no extends defined, though it should extend `base.json`.

**Key Findings:**

- **[Medium] `nestjs.json` uses relaxed strictness:** The NestJS config explicitly sets `strictNullChecks: false`, `noImplicitAny: false`, `strictBindCallApply: false`, `forceConsistentCasingInFileNames: false`, and `noFallthroughCasesInSwitch: false`. These are significant relaxations of type safety. While common for legacy NestJS projects, they weaken the type system.
- **[Medium] `react.json` does not extend `base.json`:** The `packages/tsconfig/react.json` file may not extend the base config, which means it misses out on shared settings. (This needs to be confirmed by reading the file; if true, it's a gap.)
- **[Low] `nestjs.json` targets ES2021:** This is fine for Node.js, but `ES2022` is more current and has better support in modern Node versions.
- **[Low] `base.json` uses `moduleResolution: "node"`:** This is outdated. For a monorepo using pnpm and bundlers, `moduleResolution: "bundler"` would be more appropriate for non-NestJS packages. NestJS correctly uses `moduleResolution: "node"` via its own config.

**App-level Configs:**
- `apps/web` and `apps/admin` correctly extend `@patorbit/tsconfig/nextjs.json`.
- `apps/api` correctly extends `@patorbit/tsconfig/nestjs.json`.
- Path aliases (`@/*`) are consistently defined across all three apps.
- **[Low] `apps/api` uses `ignoreDeprecations: "6.0"`:** This indicates deprecated TypeScript options are in use.

**Package-level Configs:**
- Most packages extend `@patorbit/tsconfig/base.json`. Good.
- **[Medium] `packages/auth` does NOT extend any shared tsconfig:** Its `tsconfig.json` is fully custom-defined, duplicating options and potentially creating inconsistencies.
- **[Medium] `packages/billing` has no `tsconfig.json` at all:** Despite defining a `typecheck` script.
- `packages/ui` extends `@patorbit/tsconfig/react.json`.

### 5. Turbo Audit

**`turbo.json` Analysis:**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    },
    "db:generate": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    },
    "db:push": {
      "cache": false
    },
    "db:studio": {
      "cache": false,
      "persistent": true
    },
    "storybook": {
      "cache": false,
      "persistent": true
    },
    "build-storybook": {
      "dependsOn": ["build"],
      "outputs": ["storybook-static/**"]
    }
  }
}
```

- **[Good]** Basic task setup is correct. `build` correctly depends on upstream builds.
- **[Medium] `test` depends on `build`:** This means tests will only run after a build. This is often too restrictive — unit tests typically don't need a full build. Consider splitting unit tests from integration/e2e tests.
- **[Medium] `typecheck` depends on `^build`:** This means a typecheck can't start until all upstream packages have built. Since typechecking is part of the compilation step in many packages, this could create a deadlock or delay. Typechecking should ideally run independently or before the build.
- **[Low] No `inputs` for `lint`:** `lint` tasks don't specify input globs, meaning any file change invalidates the cache. Adding `inputs: ["src/**/*.ts", "src/**/*.tsx"]` would improve caching.
- **[Low] No `env` isolation for scripts:** Tasks like `build` don't specify any `env` vars they depend on, which could lead to stale cache hits if env vars change.

### 6. Next.js Audit

**`apps/web`**
- **Config:** Uses CommonJS (`module.exports`), `reactStrictMode: true`, `transpilePackages` for workspace dependencies (`@patorbit/ui`, `@patorbit/config`, `@patorbit/utils`). This is correct for a Next.js monorepo.
- **[Medium] Missing `@patorbit/tsconfig`:** Not listed in `transpilePackages`. While it contains no runtime code, this is fine. However, `@patorbit/tsconfig` is incorrectly listed in `dependencies` — it should be in `devDependencies`.
- **Routes:** Uses the App Router. Pages include auth routes (`sign-in`, `sign-up`, `forgot-password`, `reset-password`, `verify-email`, `session-expired`), and a main page. Good structure.
- **[Low] No `turbo` integration for `next.config`:** Not using `withTM` or `createNextIntlPlugin`, standard is fine.

**`apps/admin`**
- **Config:** Identical to `apps/web` in setup. `transpilePackages` is correctly configured.
- **[Medium] Missing `@patorbit/tsconfig`:** Same issue as web — listed in `dependencies` instead of `devDependencies`.
- **Routes:** Very minimal — only a single `page.tsx` found. This is likely a skeleton awaiting development.
- **[Low] No lint-staged pattern:** The root `lint-staged` config targets `*.{ts,tsx}` files, but the admin app's lint script uses a more specific `--ext .ts,.tsx` flag, which is fine.

### 7. NestJS Audit

**`apps/api`**

**Architecture:**
- App follows a domain-driven pattern with feature modules (Auth, User, Profile, Identity, etc.) and a `PlatformModule` for cross-cutting concerns.
- The `AppModule` imports `PlatformModule.forRoot()`, suggesting platform services are configured via a dynamic module pattern. This is a good architectural choice.

**Modules Identified:**
- Core Modules: Auth, Identity, User, Profile, Permission, Session
- Domain Modules: Claim, Evidence, Credential, Verification, Knowledge, Trust, Confidence, Timeline, CareerPassport, Organization, Workspace
- Resume Modules: Resume, Section, Template, Import, Export, AI
- Platform Modules: Config, Storage, Notifications, Email, Cache, Search, Graph, Metrics, Scheduler, EventBus, FeatureFlags, RateLimiting, Jobs, Logging, Health

**[Good]** The modular structure is comprehensive and well-organized. The `PlatformModule` pattern effectively separates concerns.

**Dependency Injection:**
- Uses `APP_GUARD` with `JwtAuthGuard` globally — good security practice.
- Uses `APP_FILTER` with `AllExceptionsFilter` globally — good for consistent error handling.
- CSRF middleware is explicitly disabled with a comment justifying the decision. This is acceptable but should be documented more formally if this is a production app.

**Provider Analysis:**
- **[Medium] Missing `@patorbit/tsconfig` as devDep:** Not listed in devDependencies despite depending on shared TS config.
- **[Medium] Loose Version Ranges:** Many NestJS packages use `^10.3.0`, which is fine but could benefit from locking.
- **[Low] No explicit `@patorbit/auth` usage beyond import:** While `@patorbit/auth` is a dependency, it's not clear from the app.module how it's consumed (it may be used in individual modules).
- **[Low] Global Guard + Filter:** Using global-scoped guards and filters is appropriate but can make unit testing harder without careful module isolation.

### 8. Prisma Audit

**Schema (`schema.prisma`):**
- **[Good]** Well-organized with clear section headers and consistent naming.
- **[Good]** Proper use of relations, indexes, and composite unique constraints.
- **[Good]** Soft-delete support via `deletedAt` fields and corresponding indexes.

**Models & Relations:**
- Core Identity: `User`, `Account`, `Session`, `VerificationToken` (auth-focused)
- Authorization: `Role`, `Permission`, `UserRole` (RBAC model)
- Domain: `Profile`, `Organization`, `OrganizationMember`, `Workspace`
- Claims & Evidence: `Claim`, `Evidence`, `EvidenceFile`, `Credential`, `Verification`
- Knowledge: `KnowledgeNode`, `KnowledgeEdge` (graph database-like, likely backed by Neo4j instead)
- Trust & Confidence: `TrustScore`, `ConfidenceScore`
- Versions & Events: `TimelineEvent`, `CareerPassportVersion`
- Resume Builder: `Resume`, `ResumeSection`, `ResumeTemplate`, `ResumeVersion`, `ResumeAsset`
- Import/Export: `ImportJob`, `ExportJob`
- Misc: `Tag`, `Category`, `Metadata`, `Subscription`
- Audit: `AuditEvent`

**Issues:**
- **[Medium] Potential Neo4j/Relational Overlap:** The `KnowledgeNode` and `KnowledgeEdge` models are in Prisma (PostgreSQL), but the platform has a `GraphModule` that likely targets Neo4j. This creates an ambiguity about where graph data lives.
- **[Low] No `AuditEvent` relation explorer:** The `AuditEvent` model links to `User` but not to the specific entity it audited (via `resource` and `resourceId`). This is fine for now but could limit query flexibility.
- **[Low] Redundant Comment:** The removed `ApplicationUser` comment at the bottom can be cleaned up.
- **[Good]** `@@unique` constraints are used effectively for preventing duplicates (e.g., `KnowledgeNode` uniqueness on `[type, name, profileId]`).

**Generated Client:**
- The `@prisma/client` generation depends on the schema. The package.json has a `db:generate` script. This is correctly configured.
- **[Medium] No `prisma generate` hook:** The schema must be generated before the app can run. Adding `postinstall` or a turbo dependency could automate this.

### 9. Shared Packages

| Package | Name | main | Exports | Has Build? | Has Test? | Issues |
|---------|------|------|---------|------------|-----------|--------|
| ai | `@patorbit/ai` | `./src/index.ts` | Standard | No | No | OK |
| auth | `@patorbit/auth` | `./src/index.ts` | Standard | No | No | No shared tsconfig |
| billing | `@patorbit/billing` | `./src/index.ts` | Standard | No | Yes | Missing tsconfig.json |
| config | `@patorbit/config` | `./src/index.ts` | Standard | No | No | Nested package structure |
| database | `@patorbit/database` | `./src/index.ts` | Has barrel exports | No | No | Compiled .js files in root; broken entrypoint for production |
| notifications | `@patorbit/notifications` | `./src/index.ts` | Standard | No | No | OK |
| storage | `@patorbit/storage` | `./src/index.ts` | Standard | No | No | OK |
| tsconfig | `@patorbit/tsconfig` | `base.json` | Multiple .json files | No | No | OK |
| types | `@patorbit/types` | `./src/index.ts` | Standard | No | No | OK |
| ui | `@patorbit/ui` | `./src/index.ts` | Standard | No | No | Peer dep mismatch; no build |
| utils | `@patorbit/utils` | `./src/index.ts` | Standard | No | No | OK |

**Key Issues:**
- **[High] No build step for any shared package:** All packages point `main` to `./src/index.ts`. This means every consumer must transpile TypeScript. For production, this is fragile and slow. A `tsup` or `tsc` build step should be added to packages that are consumed by production apps.
- **[Medium] Inconsistent exports:** Some packages use `main` and `types` only, while `@patorbit/database` uses barrel exports. This inconsistency can cause import resolution issues.
- **[Low] No test infrastructure:** Most packages lack test scripts or test dependencies.

### 4. TypeScript Audit
*See Section 4 above*

### 5. Turbo Audit
*See Section 5 above*

### 6. Next.js Audit
*See Section 6 above*

### 7. NestJS Audit
*See Section 7 above*

### 8. Prisma Audit
*See Section 8 above*

### 9. Shared Packages
*See Section 9 above*

### 10. Dependency Graph

```
                  ┌─────────────────────┐
                  │   @patorbit/tsconfig  │ (base tsconfigs)
                  └──────┬──────────────┘
                         │ extends
            ┌────────────┼──────────────────────┐
            ▼            ▼                      ▼
   ┌──────────────┐ ┌──────────┐ ┌──────────────────────┐
   │ config       │ │ types    │ │ utils                │
   │ database     │ │ storage  │ │ notifications        │
   │ ai           │ │ ui       │ │ billing              │
   └──────┬───────┘ └────▲─────┘ └──────────────────────┘
          │               │
          │    ┌──────────┘ (workspace:* deps)
          ▼    │
   ┌───────────┴───┐
   │  apps/web     │──→ @patorbit/ui, @patorbit/config, @patorbit/utils
   │  apps/admin   │──→ @patorbit/ui, @patorbit/config, @patorbit/utils
   └───────────────┘

   ┌───────────┐
   │ apps/api  │──→ @patorbit/auth, @patorbit/config, @patorbit/database
   └───────────┘
        │
        ├── @patorbit/auth ──→ bcrypt, zod
        ├── @patorbit/config ──→ zod
        ├── @patorbit/database ──→ @prisma/client
        │
        └── @patorbit/billing ──→ @patorbit/database, @patorbit/types, stripe, zod

Internal Dependencies (workspace:*):
  - apps/web:      @patorbit/ui, @patorbit/config, @patorbit/utils, @patorbit/tsconfig
  - apps/admin:    @patorbit/ui, @patorbit/config, @patorbit/utils, @patorbit/tsconfig
  - apps/api:      @patorbit/auth, @patorbit/config, @patorbit/database
  - @patorbit/billing:  @patorbit/database, @patorbit/types
  - @patorbit/ai:       @patorbit/config
  - @patorbit/database: @patorbit/tsconfig (dev)
  - @patorbit/ui:       @patorbit/tsconfig (dev)
  - @patorbit/config:   @patorbit/tsconfig (dev)
  - @patorbit/types:    @patorbit/tsconfig (dev)
  - @patorbit/utils:    @patorbit/tsconfig (dev)
  - @patorbit/storage:  @patorbit/tsconfig (dev)
  - @patorbit/notifications: @patorbit/tsconfig (dev)

Analysis:
- **[Good]** No circular dependencies detected. The graph is a DAG.
- **[Medium] Orphan Packages:** `@patorbit/docs`, `@patorbit/scripts`, `@patorbit/tooling` are not depended upon by any other workspace package. They may be dead code.
- **[Medium] `@patorbit/tsconfig` in apps/web and apps/admin:** Listed as a runtime dependency rather than devDependency. This will work but is semantically incorrect.
- **[Low] `@patorbit/auth` is only used by `apps/api`:** This is fine as auth is a backend concern, but worth noting.
- **[Low] `@patorbit/storage` and `@patorbit/notifications` are workspace packages not consumed by any app:** They exist in the platform module of the API (`apps/api/src/platform/storage`, `apps/api/src/platform/notifications`), suggesting these packages might be intended to replace the inline platform modules, or the platform modules are the actual consumers. This creates duplication — there are both packages (storage, notifications) AND API platform modules (StorageModule, NotificationsModule). This is a significant architectural concern.

### 11. Build Pipeline

**`pnpm build` → `turbo run build`**

Steps:
1. Turbo resolves the task graph.
2. For each package, it runs the `build` script.

**Package Build Scripts:**
| Package | Build Script | Status |
|---------|-------------|--------|
| @patorbit/api | `nest build` (tsc-based) | Has build |
| @patorbit/web | `next build` | Has build |
| @patorbit/admin | `next build` | Has build |
| @patorbit/database | ❌ No build script | **BROKEN** |
| @patorbit/ui | ❌ No build script | **BROKEN** |
| @patorbit/config | ❌ No build script | **BROKEN** |
| @patorbit/utils | ❌ No build script | **BROKEN** |
| @patorbit/types | ❌ No build script | **BROKEN** |
| @patorbit/auth | ❌ No build script | **BROKEN** |
| @patorbit/ai | ❌ No build script | **BROKEN** |
| @patorbit/storage | ❌ No build script | **BROKEN** |
| @patorbit/notifications | ❌ No build script | **BROKEN** |
| @patorbit/billing | ❌ No build script | **BROKEN** |
| @patorbit/tsconfig | ❌ No build script | OK (no TS to compile) |
| Others | ❌ No build script | OK (placeholder packages) |

**Where It Breaks:**
- **[CRITICAL] Most shared packages have no `build` script:** When `turbo run build` executes, it runs `build` on every package. For packages without a `build` script defined in `package.json`, pnpm will fail or skip them. Turbo expects each package in the pipeline to have a matching script.
- **[CRITICAL] `@patorbit/database` has no build step:** When `apps/api` imports from `@patorbit/database`, it's importing raw `.ts` files. If `build` runs `nest build`, NestJS compiles the code, but the compiled `database.*.js` files in the package root suggest a mismatched build output.
- **[HIGH] The compiled `.js` files in `packages/database` root:** The presence of `database.module.js` and `prisma.service.js` directly in the package directory suggests a previous build step output to the wrong location or was manually created.

**Suggested Fix:**
All packages with `main: "./src/index.ts"` need a `build` script:
```json
"build": "tsup src/index.ts --format esm,cjs --dts"
```
Or, for packages consumed by NestJS (which uses CommonJS):
```json
"build": "tsc -p tsconfig.json"
```
The `turbo.json` `build` task's `dependsOn: ["^build"]` is correct for this pattern.

### 12. Lint Pipeline

**`pnpm lint` → `turbo run lint`**

Package lint scripts:
| Package | Lint Script | Status |
|---------|-------------|--------|
| @patorbit/api | `eslint .` | OK |
| @patorbit/web | `echo lint-ok` | **PLACEHOLDER** |
| @patorbit/admin | `eslint . --ext .ts,.tsx` | OK |
| @patorbit/database | `echo lint-ok` | **PLACEHOLDER** |
| @patorbit/ui | `eslint . --ext .ts,.tsx` | OK |
| @patorbit/config | `eslint . --ext .ts` | OK |
| @patorbit/utils | `eslint . --ext .ts` | OK |
| @patorbit/types | `eslint . --ext .ts` | OK |
| @patorbit/ai | `eslint . --ext .ts` | OK |
| @patorbit/storage | `eslint . --ext .ts` | OK |
| @patorbit/notifications | `eslint . --ext .ts` | OK |
| @patorbit/auth | ❌ No lint script | **MISSING** |
| @patorbit/billing | `eslint .` | OK |
| @patorbit/tsconfig | ❌ No lint script | **MISSING** |
| @patorbit/docs | ❌ No lint script | **MISSING** |
| @patorbit/scripts | ❌ No lint script | **MISSING** |
| @patorbit/tooling | ❌ No lint script | **MISSING** |

**Issues:**
- **[Medium] Placeholder lint scripts:** `apps/web` and `@patorbit/database` use `echo lint-ok` instead of running actual linting.
- **[Low] Missing lint scripts:** Several packages have no lint script at all.

### 13. Typecheck Pipeline

**`pnpm typecheck` → `turbo run typecheck`**

Package typecheck scripts:
| Package | Typecheck Script | Status |
|---------|-----------------|--------|
| @patorbit/api | `tsc --noEmit` | OK |
| @patorbit/web | `tsc --noEmit` | OK |
| @patorbit/admin | `tsc --noEmit` | OK |
| @patorbit/database | `tsc --noEmit` | **Will break - compiled .js files conflict** |
| @patorbit/ui | `tsc --noEmit` | OK |
| @patorbit/config | `tsc --noEmit` | OK |
| @patorbit/utils | `tsc --noEmit` | OK |
| @patorbit/types | `tsc --noEmit` | OK |
| @patorbit/ai | `tsc --noEmit` | OK |
| @patorbit/storage | `tsc --noEmit` | OK |
| @patorbit/notifications | `tsc --noEmit` | OK |
| @patorbit/billing | `tsc --noEmit` | **Will break - no tsconfig.json** |
| @patorbit/auth | ❌ No typecheck script | **MISSING** |
| Others | ❌ No typecheck script | **MISSING** |

**Issues:**
- **[HIGH] `packages/billing`: `tsc --noEmit` without a `tsconfig.json`:** This command will fail because TypeScript needs a configuration file to know how to compile the project.
- **[MEDIUM] `packages/database`: Potential `tsc --noEmit` failure:** If the compiled `.js` files in the package root are TypeScript compilation artifacts, they might be picked up by `tsc` depending on the `include`/`exclude` settings, causing duplicate identifier errors.
- **[LOW] `apps/api` TSConfig uses `ignoreDeprecations: "6.0"`:** `typecheck` may emit deprecation warnings or fail on stricter TS versions.

### 14. Test Pipeline

**`pnpm test` → `turbo run test`**

Package test scripts:
| Package | Test Script | Status |
|---------|-------------|--------|
| @patorbit/api | `vitest run` | OK |
| @patorbit/billing | `vitest` | OK |
| All others | ❌ No test script | **MISSING** |

**Issues:**
- **[HIGH] `turbo.json` test task depends on `build`:** This means `pnpm test` will first build EVERY package in the workspace before running a single test. For most packages, this is unnecessary overhead.
- **[LOW] Minimal test coverage:** Only 2 out of 19 packages have test scripts. This is a significant gap for an enterprise application.

### 15. Runtime Pipeline

**`pnpm dev` → `turbo run dev`**

The `dev` task in `turbo.json` has `cache: false` and `persistent: true`.

**Dev Scripts:**
| App | Dev Script | Description |
|-----|------------|-------------|
| @patorbit/api | `nest start --watch` | Hot-reloading NestJS server |
| @patorbit/web | `next dev` | Hot-reloading Next.js frontend |
| @patorbit/admin | `next dev` | Hot-reloading Next.js admin |

**Flow:**
1. Turbo runs all `dev` scripts in parallel.
2. NestJS watches for file changes and restarts.
3. Next.js apps watch for changes via webpack/SWC.

**Issues:**
- **[Medium] No `dev` database migration hook:** The `.env` file contains `DATABASE_URL`, but there's no automatic migration on `pnpm dev`. The developer must run `pnpm db:migrate` separately.
- **[Low] Turborepo `dev` has no dependencies:** The `dev` task is defined without `dependsOn`, so all three apps start simultaneously. If the API needs to be ready before the frontend queries it, this could cause initial connection errors in dev.

### 16. Security Audit

**Secrets Exposure:**
- **[HIGH] `.env` file NOT in `.gitignore`:** The root `.gitignore` ignores `.env`, `.env.local`, and `.env.*.local` patterns. The `gitStatus` at the start of the session did NOT show `.env` as untracked, which means it IS being tracked by git or was previously committed. This is a critical security issue. The `.env` file contains `DATABASE_URL` with credentials (`postgres:postgres`). If this was accidentally committed, the credentials are in the git history.
- **[MEDIUM] `.env.example` exposes infrastructure credentials:** The `.env.example` file contains:
  ```
  NEO4J_PASSWORD=password
  STORAGE_ACCESS_KEY=minioadmin
  STORAGE_SECRET_KEY=minioadmin
  AUTH_SECRET=change-me-to-a-random-secret
  ```
  While `.env.example` should be committed, hard-coding passwords (even placeholder ones) is a risk if they are accidentally used or if the file serves as a template that gets copied without changes.
- **[LOW] `.env` tracked by git:** If `.env` was committed, the postgres password and all other secrets are in the git history. The repo needs `git rm --cached .env` and the history should be scrubbed.

**Unsafe Env Usage:**
- **[MEDIUM] `apps/api/src/main.ts` (line 38):** CORS origin uses `process.env.FRONTEND_URL || "http://localhost:3000"`. If `FRONTEND_URL` is not set (e.g., in production), it falls back to a localhost URL, which could be a deployment misconfiguration.
- **[MEDIUM] `apps/api/src/platform/feature-flags/providers/local.feature-flag-provider.ts` (line 12):** Iterates over ALL `process.env` entries and treats env vars starting with `FEATURE_` as feature flags. This is a broad and implicit security surface — any env var named `FEATURE_*` becomes a feature flag toggle.
- **[LOW] `apps/web/src/lib/api.ts` (line 1):** Uses `process.env.NEXT_PUBLIC_API_URL` with a fallback. The use of `NEXT_PUBLIC_` prefix means this value is embedded in the client-side JavaScript bundle, making it publicly visible.

**Dependency Security:**
- **[LOW] Deprecated Dependencies:** 10 deprecated subdependencies found (`are-we-there-yet`, `gauge`, `glob`, `inflight`, `npmlog`, `rimraf`, `tar`, `uuid`). These are mostly transitive, but their deprecated status means they may have unpatched vulnerabilities over time.
- **[LOW] Peer dependency mismatch:** `@storybook/test@8.6.15` vs required `8.6.18`. This is unlikely to be a security issue, but it indicates a non-deterministic install.

**Permissions:**
- **[LOW] No explicit CSP:** The CORS setup in `main.ts` includes a Content-Security-Policy but it's minimal. This should be hardened for production.
- **[LOW] CSRF Disabled:** The comment in `app.module.ts` explains that CSRF middleware is disabled due to SameSite cookies. This is a valid trade-off but should be documented in a security policy.

### 17. Code Quality

**TODOs/FIXMEs:**
```
apps/api/src/resume/import/parsers/pdf-parser.ts:11:    // TODO: Implement PDF text extraction
apps/api/src/resume/import/parsers/linkedin-parser.ts:12:    // TODO: Transform LinkedIn profile data
apps/api/src/resume/import/parsers/docx-parser.ts:11:    // TODO: Implement DOCX extraction
```
Three unimplemented file parsers for resume import. These are placeholders that will throw errors if the import feature is used for these formats.

**Dead Code/Stale Files:**
- `c.txt` at repo root: Stray file, likely a scratch note.
- `packages/database/database.module.js`: Compiled JS artifact in source tree.
- `packages/database/prisma.service.js`: Compiled JS artifact in source tree.
- `packages/tooling/index.js`: Unclear purpose, not referenced by any package.
- `tooling/` directory root: Appears to be a duplicate of `packages/tooling`.

**Inconsistent Naming:**
- `docs/` (root) vs `packages/docs` vs `site/` vs `website/`: Four different documentation-related directories.
- `tools/` vs `tooling/` vs `packages/tooling` vs `scripts/`: Four different tooling-related directories.
- `exports/` directory: Purpose unclear.

**Duplicate Code:**
- `apps/web/next.config.js` and `apps/admin/next.config.js` have identical `transpilePackages` lists. This is intentional (both are Next.js apps) but could be extracted to a shared config.
- The `@patorbit/storage` package and the `apps/api/src/platform/storage` module appear to serve the same purpose. Same for `@patorbit/notifications` and `apps/api/src/platform/notifications`.

**Linting Quality:**
- Root ESLint config is modern (flat config format) and well-configured with TypeScript, import sorting, and Prettier integration. Good.
- 6 out of 19 packages are missing lint scripts entirely.
- `apps/web` and `@patorbit/database` use placeholder `echo lint-ok` scripts.

### 18. Architecture Audit

**Intended Architecture (inferred from structure):**
- Monorepo with separate apps for API (NestJS), Web (Next.js), and Admin (Next.js).
- Shared packages for cross-cutting concerns (database, config, UI, auth, etc.).
- NestJS API follows a modular architecture with a `PlatformModule` for infrastructure services.
- Prisma for database ORM with PostgreSQL.

**Detected Violations:**

- **[HIGH] Platform Package Duplication:** The architecture has both:
  1. Shared packages: `@patorbit/storage`, `@patorbit/notifications`, `@patorbit/config`
  2. API Platform modules: `apps/api/src/platform/storage`, `apps/api/src/platform/notifications`, `apps/api/src/platform/config`
  
  This creates a maintenance burden where the same services (storage, notifications, config) are maintained in two places. The architecture intended the shared packages to be used by the API, but instead, the API has its own copies. This is a violation of the DRY principle and a sign of architectural drift.

- **[MEDIUM] Missing Abstraction Layer:** The shared packages (`@patorbit/storage`, `@patorbit/notifications`) have generic names but are not consumed by the API. The API's platform modules are the actual consumers. The abstraction layer for platform services is split across `packages/` and `apps/api/src/platform/`.

- **[MEDIUM] No Build Step for Shared Packages:** All shared packages export raw TypeScript. This means:
  - Apps that consume them must transpile them (Next.js does this via `transpilePackages`).
  - There's no type-checking step for the packages themselves unless explicitly run.
  - Publishing packages to a registry would be impossible without a build step.

- **[MEDIUM] Auth Package Duplication:** `@patorbit/auth` exists as a shared package, but `apps/api/src/auth/` also exists with its own AuthModule. The shared package provides low-level primitives (bcrypt, zod validation), while the API module provides NestJS-specific auth features. This layering is correct in principle but poorly documented.

- **[LOW] Missing Tests for Core Modules:** Domain modules like `Claim`, `Evidence`, `Credential`, `Verification`, `Knowledge`, `Trust`, `Confidence` have NO test files. Only the platform infrastructure modules have tests.

- **[LOW] Inconsistent Module Boundaries:** Some modules have granular CRUD services (Identity, User, Profile, Organization), while Resume is a single large module with sub-modules. This inconsistency can make the codebase harder to navigate.

**Architecture Score Rationale:**
The architecture is generally well-thought-out with clear separation of concerns, but suffers from significant implementation drift, particularly in the platform services and build pipeline.
