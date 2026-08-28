# ADR-005 — Safe Local Resume Migration to PostgreSQL

**Status:** Accepted  
**Date:** 2026-08-16  
**Deciders:** Patorbit Core Team  
**Relates to:** ADR-001 (Source of Truth), ADR-002 (Professional Identity Domain Model), ADR-003 (Resume Server Persistence), ADR-004 (Read-Only Server Parity)

---

## Context

Phases 0, 0.5, and 1A are complete:

- PostgreSQL Resume model exists (ADR-003)
- Resume API exists and is verified against real database
- Server snapshot exists (Phase 1A)
- Parity engine exists with LOCAL_ONLY / SERVER_ONLY / DIFFERENT / IDENTICAL classification
- Local Zustand/localStorage remains the UI authority
- No dual-write exists
- No automatic migration exists

Existing users have valuable resume data stored locally in Zustand/localStorage (`patorbit-resume-v2`). This data must be safely migrated to PostgreSQL without:

- Overwriting any existing server data
- Deleting any local data
- Automatically resolving conflicts
- Making PostgreSQL the UI authority prematurely

## Decision

Implement **Safe Local Resume Migration** (Phase 1B) that:

1. **Explicitly requires user action** — no automatic migration on page load
2. **Only migrates LOCAL_ONLY resumes** — resumes not present on the server
3. **Never overwrites DIFFERENT resumes** — conflicts require manual review
4. **Preserves all local data** — no deletion after migration
5. **Verifies each migration** — post-write GET + parity comparison
6. **Is idempotent** — safe for retries and partial failures
7. **Respects authentication** — only authenticated users may migrate
8. **Maintains activeResumeId** — never switches the active resume during migration

## Migration Eligibility

| Parity Status | Migration Action |
|---|---|
| `LOCAL_ONLY` | **SAFE_TO_MIGRATE** — eligible for upload |
| `IDENTICAL` | **ALREADY_MIGRATED** — no action needed |
| `DIFFERENT` | **CONFLICT** — do not overwrite; requires manual review |
| `SERVER_ONLY` | **SERVER_ONLY** — do not import automatically |

## Safety Rules

### NEVER

- Overwrite a `DIFFERENT` server resume
- Overwrite a `DIFFERENT` local resume
- Automatically resolve conflicts
- Delete local resumes after upload
- Delete server resumes
- Migrate `SERVER_ONLY` resumes into local state automatically
- Change `activeResumeId` unexpectedly
- Make PostgreSQL the UI authority yet

### ONLY

- Upload `LOCAL_ONLY` resumes via POST to existing Resume API
- Verify each upload with GET + parity comparison
- Preserve local data during this phase

## Architecture

```
Local Zustand/localStorage
    ↓ createLocalSnapshot (immutable)
    ↓
Migration Planner
    ↓ planMigration (deterministic)
    ↓
Migration Executor
    ↓ executeMigration (with verification)
    ↓
PostgreSQL Resume API
    ↓ verifyMigration (GET + comparison)
    ↓
Migration Report
    ↓
User Feedback (ResumeMigrationUI)
```

## Implementation

### Migration Planner (`src/lib/resume-server-sync/migration.ts`)

- `createLocalSnapshot()` — immutable snapshot without store mutation
- `planMigration()` — deterministic plan based on parity report
- Categories: `SAFE_TO_MIGRATE`, `ALREADY_MIGRATED`, `CONFLICT`, `SERVER_ONLY`

### Migration Executor

- `executeMigration()` — processes only `SAFE_TO_MIGRATE` entries
- `uploadResume()` — POST to existing Resume API
- `verifyMigration()` — GET + field comparison
- Partial failure handling — does not roll back successful migrations

### Migration UI (`src/components/resume-builder/ResumeMigrationUI.tsx`)

- Explicit user action required (no automatic triggers)
- Shows migration status before execution
- Displays verification results after migration
- Preserves local data after successful migration

### Tests

- Unit tests for planner and executor
- Real database integration tests
- Browser validation scenarios
- Idempotency verification
- Partial failure handling

## Consequences

### Positive

- Existing user data is safely migrated to PostgreSQL
- No risk of data loss or corruption
- Conflicts are surfaced rather than silently resolved
- Local data remains available during transition
- Phase 1C (dual-write) can build on this foundation

### Negative

- Users must explicitly trigger migration
- Conflicts require manual resolution
- Local and server data may temporarily diverge during transition

### Risks

- Migration UI must not be intrusive or confusing
- Verification must be reliable (network failures could cause false negatives)
- Partial failures must not leave inconsistent state

## Current vs Target

### CURRENT (Phase 1B)

```
User clicks [Secure My Resumes]
    ↓
Local snapshot (immutable)
    ↓
Parity check (LOCAL_ONLY / IDENTICAL / DIFFERENT / SERVER_ONLY)
    ↓
Migration plan (only LOCAL_ONLY eligible)
    ↓
POST each eligible resume to /api/resumes
    ↓
Verify each upload (GET + comparison)
    ↓
Report results (success/verified/failed)
    ↓
Local data PRESERVED (not deleted)
```

### TARGET (Phase 1C+)

```
Server becomes UI authority for authenticated users
    ↓
Dual-write mutations to server + local cache
    ↓
Local becomes cache/fallback only
    ↓
Eventually: localStorage as temporary client state only
```

## Migration Principles

1. **Existing data first** — never delete or overwrite without explicit user consent
2. **Idempotent operations** — safe for retries and partial failures
3. **Verification required** — confirm each migration before marking complete
4. **Conflict surfacing** — show conflicts rather than silently resolving
5. **Local preservation** — keep local data until server authority is proven

## Related Documents

- [ADR-001: Canonical Source of Truth](./ADR-001-CANONICAL-SOURCE-OF-TRUTH.md)
- [ADR-002: Professional Identity Domain Model](./ADR-002-PROFESSIONAL-IDENTITY-DOMAIN-MODEL.md)
- [ADR-003: Resume Server Persistence](./ADR-003-RESUME-SERVER-PERSISTENCE.md)
- [ADR-004: Resume Server Read Parity](./ADR-004-RESUME-SERVER-READ-PARITY.md)
- [MASTER_ARCHITECTURE.md](../MASTER_ARCHITECTURE.md)
