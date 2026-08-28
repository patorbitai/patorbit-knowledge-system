# ADR-003 — Resume Server Persistence (Phase 0 Foundation)

**Document ID:** ADR-003
**Status:** ✅ Accepted
**Date:** 2026-08-16
**Type:** Persistence architecture — server-side Resume foundation (Phase 0)
**Basis:** ADR-001 (Canonical Source of Truth) · ADR-002 (Professional Identity
Domain Model) · Resume Server Persistence Migration Design (2026-08-16)
**Related:**
- `docs/adr/ADR-001-CANONICAL-SOURCE-OF-TRUTH.md` (accepted)
- `docs/adr/ADR-002-PROFESSIONAL-IDENTITY-DOMAIN-MODEL.md` (accepted)
- `docs/MASTER_ARCHITECTURE.md` (project direction)
- `patorbit-docs/04_ADR/ADR-003` (identity-centric model), `ADR-006` (constitutional architecture)

---

## Context

The resume system is **client-first today**: all resume content (with claims
nested inside it) lives in the Zustand store, persisted to localStorage
(`patorbit-resume-v2`) with per-resume `styleConfigs`. There is no resume API, no
resume database table, and no server entity — multi-device access, server-side
validation, and canonical history are impossible.

ADR-001 decided PostgreSQL / Patorbit Core is the canonical persistent source of
truth. ADR-002 decided Resume is a separate entity under ProfessionalIdentity
(`ProfessionalIdentity 1:N Resume`), that `resumeId` remains the stable
application-level identifier, and that the existing resume data must not be
destroyed during migration.

This ADR covers **Phase 0 only**: the server-side Resume persistence foundation.
The table/API are safe and tested but are **not** yet connected to the client —
the UI continues to behave exactly as before and localStorage remains
authoritative from the UI's perspective.

## Current client-first Resume persistence (verified, unchanged)

| Aspect | Current implementation |
|---|---|
| Content | `Resume` type (`src/types/resume.ts`) in the Zustand store (`src/store/resume-builder.ts`) |
| Multi-resume | `resumes[]`, `activeResumeId`, `createResume` / `switchResume` / `renameResume` / `deleteResume` |
| Persistence | localStorage `patorbit-resume-v2` (`partialize: { resumes, activeResumeId, evidence, styleConfigs }`) |
| Style | `styleConfigs: Record<resumeId, ResumeStyleConfig>` (per-resume) in the store |
| Template | `templateId` inside each resume document |
| Claims | Nested `resume.claims[]` (client-only; no server Claim entity yet) |
| Server | No Resume table, no Resume API — nothing server-side |

## Decision

Create the server-side Resume persistence foundation only. The approved design
decisions (Resume Server Persistence Migration Design, 2026-08-16) are adopted
verbatim:

1. PostgreSQL is the canonical persistent source of truth (ADR-001).
2. Resume is a separate entity under ProfessionalIdentity (ADR-002).
3. Existing `resumeId` remains the stable public/domain ID.
4. PostgreSQL uses a separate internal primary key (`id`).
5. Resume uses the **hybrid model**: relational metadata + validated JSON payload.
6. `templateId` is server-canonical (relational column, authoritative).
7. `styleConfigs` are included in the Phase-1 Resume payload.
8. Dormant UI fields are preserved for compatibility for now.
9. Claims/evidence migration happens later; claims inside the existing payload
   are preserved, not destroyed or silently dropped.
10. Import remains review → Apply → server write later (unchanged in Phase 0).
11. ResumeVersion is deferred to a future ADR.
12. Phase-1 conflict handling will include `updatedAt`/staleness detection;
    Phase 0 returns `updatedAt` and uses last-write-wins.
13. Offline handling is initially a resume-level dirty flag (future).
14. Existing localStorage remains untouched and authoritative from the UI
    perspective during Phase 0.

### Resume domain relationship

```
ProfessionalIdentity (1) ── (N) Resume
                              ├── resumeId      stable public/domain ID (unique)
                              ├── resumeName    relational metadata
                              ├── templateId    relational metadata (authoritative)
                              ├── careerStage   relational metadata (authoritative)
                              ├── payload       validated JSON document (ResumeSchema + styleConfigs)
                              ├── createdAt
                              └── updatedAt     returned by the API; staleness signal
```

### Hybrid relational + JSON payload

- **Relational columns** (`resumeId`, `resumeName`, `templateId`, `careerStage`,
  timestamps): stable metadata used for scoping, listing, and future
  server-side queries.
- **`payload` (JSONB)**: the full resume document, validated with the existing
  `ResumeSchema` (extended only by an additive, optional `styleConfigs` record —
  no second, incompatible schema).
- **Authoritative representation:** where a field exists both as a column and in
  the payload (`templateId`, `careerStage`), the **relational column is
  authoritative**. The service syncs the column values into the payload on every
  read/write so the two representations cannot diverge.

### Stable resumeId

`resumeId` is unique globally and scoped per identity
(`@@unique([professionalIdentityId, resumeId])`). It is never reassigned.
Create is **idempotent by resumeId** (existing row returned unchanged); a
concurrent duplicate race is treated as idempotent success via the unique
constraint (`P2002` → re-fetch → return existing).

### ProfessionalIdentity ownership & authentication boundary

- Ownership is always derived from the authenticated session
  (`getServerSession` → `identityService.ensureProfessionalIdentity(user.id)`).
- The client can never supply `professionalIdentityId` or `userId` as authority;
  any such body fields are ignored.
- Every repository/service/API operation is scoped through the authenticated
  identity. A foreign or missing resume is a **404** — never observable.

### Transitional claims preservation

Claims stay inside `payload.claims` during this phase so no existing data is
lost. No new canonical Claim relation is created (that is a later phase under
ADR-002). The service round-trips `claims` verbatim.

### styleConfigs handling

`styleConfigs` is included in the payload as an additive, optional
`Record<string, unknown>` defaulting to `{}`. It preserves the store's
per-resume style slice losslessly so a future sync can round-trip it. It is not
validated field-by-field in Phase 0 (content-free presentation data).

### API boundary

| Method | Route | Behavior |
|---|---|---|
| GET | `/api/resumes` | List authenticated user's resumes |
| POST | `/api/resumes` | Create (idempotent by `resumeId`) |
| GET | `/api/resumes/[resumeId]` | Read own resume (404 for foreign/missing) |
| PUT / PATCH | `/api/resumes/[resumeId]` | Merge-update own resume (404 foreign, 400 invalid) |
| DELETE | `/api/resumes/[resumeId]` | Delete own resume (404 foreign) |

Validation: `resumeId` required; `templateId` must be one of the 29 registry
template IDs; the resume document is validated with the canonical payload
schema; malformed/missing/duplicate inputs return 400.

### updatedAt

`createdAt`/`updatedAt` exist on the row and the API returns `updatedAt` on every
response. Phase-0 writes are last-write-wins. **Staleness/optimistic-lock
detection is explicitly deferred to Phase 1** (approved decision #12) — no
`If-Unmodified-Since`/version header is implemented yet.

## Migration stages

The approved staged sequence (not yet executed beyond Stage A):

1. **Stage A (Phase 0 — THIS ADR):** server model/API with no client authority
   change. Table may remain empty; the app runs unchanged without it.
2. **Stage B:** on authenticated-user hydration, load server resumes when
   present; when the server is empty and local resumes exist, import local
   resumes to the server safely (one-time, non-destructive).
3. **Stage C:** dual-write resume mutations to the server + existing
   Zustand/localStorage.
4. **Stage D:** validate server/client parity.
5. **Stage E:** server becomes authority for authenticated users.
6. **Stage F:** localStorage becomes cache/fallback rather than authority.

Each stage must: preserve existing data, keep backward compatibility, include
tests, include real browser validation, and remove duplicate authority only
after the new path is proven. Never remove localStorage/IndexedDB behavior
before the server path is proven.

## Rollback principles

- No destructive migration runs until parity is proven.
- Disabling server authority falls back to the existing local system: the
  client store is untouched by Phase 0, so the UI is unaffected if the API is
  removed or disabled.
- The new table is additive; dropping it loses nothing (it holds no
  client-authoritative data in Phase 0).

## Consequences

- Multi-device resume access becomes possible (after later phases).
- Server-side validation of resume documents exists today.
- The API is safe and tested but is NOT the source of truth yet — it must not
  be connected to Zustand, ImportButton, the gallery, or the builder until the
  staged migration proves parity.
- The `templateId` registry is enforced server-side (29 template IDs).
- Existing user data is never deleted, transformed, or auto-migrated by Phase 0.

## Future ResumeVersion

Deferred by explicit decision (#11). When designed, `ResumeVersion` belongs to
`Resume` (`Resume 1:N ResumeVersion`) and will likely build on the `payload`
document plus `updatedAt`.

## Risks

- Race conditions on idempotent create are handled via `P2002` re-fetch; the
  compound unique index is the real guard.
- `payload` JSONB vs fully normalized tables: payload evolution is managed by
  the existing `ResumeSchema` (zod) — schema changes must remain
  backward-compatible while the client is the authority.
- `careerStage` column is a plain string; write-time validation keeps it
  constrained to the enum values.
- The API is untested against a real PostgreSQL until `migrate deploy` runs;
  the SQL migration is hand-written to match Prisma conventions.

## Related ADRs / documents

- `docs/adr/ADR-001-CANONICAL-SOURCE-OF-TRUTH.md` — canonical source of truth
- `docs/adr/ADR-002-PROFESSIONAL-IDENTITY-DOMAIN-MODEL.md` — domain ownership
- `docs/MASTER_ARCHITECTURE.md` — project direction & current/future status
- Resume Server Persistence Migration Design (2026-08-16) — the approved design
  this ADR implements (Phase 0 only)
