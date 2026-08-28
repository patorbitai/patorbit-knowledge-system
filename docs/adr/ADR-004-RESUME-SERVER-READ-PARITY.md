# ADR-004 — Resume Server Read Parity (Phase 1A)

**Document ID:** ADR-004
**Status:** ✅ Accepted
**Date:** 2026-08-16
**Type:** Read-only client–server awareness (no authority change)
**Basis:** ADR-001 (Canonical Source of Truth) · ADR-002 (Domain Model) ·
ADR-003 (Resume Server Persistence, Phase 0) · Phase 0.5 real-DB verification
**Related:**
- `docs/adr/ADR-001-CANONICAL-SOURCE-OF-TRUTH.md` (accepted)
- `docs/adr/ADR-002-PROFESSIONAL-IDENTITY-DOMAIN-MODEL.md` (accepted)
- `docs/adr/ADR-003-RESUME-SERVER-PERSISTENCE.md` (accepted)
- `docs/MASTER_ARCHITECTURE.md` (project direction)

---

## Context

Phase 0 created the server-side Resume foundation: `Resume` table under
`ProfessionalIdentity`, a validated JSONB payload, an identity-scoped API
(`/api/resumes`), real-DB migration, and tests. The client is untouched — the
Zustand store + localStorage (`patorbit-resume-v2`) remains the only UI source
of truth.

Phase 1A introduces **read-only awareness** of the server state so the system
can distinguish LOCAL vs SERVER resumes and detect whether they match — without
changing any authority. This establishes the parity vocabulary and the
safety invariants that the Phase-1B reconciliation UI will build on.

## Decision

For authenticated users, the Resume Builder fetches the server resume snapshot
(`GET /api/resumes`) and classifies every resume as **IDENTICAL**,
**DIFFERENT**, **LOCAL_ONLY**, or **SERVER_ONLY**. This is strictly read-only:

- **The server snapshot is never the UI state.** It is a `SERVER_SNAPSHOT`
  held out-of-band from Zustand.
- **Nothing is written.** No upload of local resumes, no server overwrite, no
  store mutation, no dual-write, no automatic migration.
- **Failure is fail-closed.** Network/API/session failures leave the builder
  working exactly as before from localStorage.

## Server snapshot

- Fetched via the client helper `fetchServerResumes()` (GET `/api/resumes`,
  typed `ServerResumeRecord[]`, handles 401 / non-2xx / network failure).
- Run once per builder mount for an authenticated session by the
  `ResumeServerSyncMonitor` (renders nothing).
- The result is a plain data copy passed to the parity engine; the store is
  read with `useResumeBuilder.getState()` (read-only) and never written.

## Local authority during Phase 1A

The existing Zustand/localStorage flow is the UI's only authority and behaves
exactly as before. If both sides hold the same `resumeId` with different
content, the LOCAL version remains the visible one; parity reports DIFFERENT
and records `serverUpdatedAt` metadata for a future reconciliation UI. A
server-only resume is never added to Zustand; a local-only resume is never
uploaded.

## Parity states

| Status | Meaning | Phase-1A behavior |
|---|---|---|
| IDENTICAL | Same resumeId; canonical content matches | No action |
| DIFFERENT | Same resumeId; canonical content differs | Local stays visible; metadata recorded |
| LOCAL_ONLY | resumeId present locally, not on server | **Never uploaded** (safest condition) |
| SERVER_ONLY | resumeId on server, not locally | **Never added to the UI** |

## Compared fields (canonical normalized representation)

- Match key: `resumeId`.
- Compared directly (relational metadata): `resumeName`, `templateId`,
  `careerStage`.
- Compared as the **canonical resume document**: both sides are normalized
  through the shared `ResumePayloadSchema` (ADR-003 payload contract — the
  existing `ResumeSchema` + `styleConfigs`) and compared as stable key-sorted
  JSON. This covers all content fields, **claims**, and **styleConfigs**.
- Relational columns are authoritative: `templateId`/`careerStage` are synced
  into the server payload before comparison so the two representations never
  diverge.
- Known limitation (documented contract): local-only UI extension fields that
  the canonical payload document does not carry — `experience.startDate` /
  `endDate` / `current` / `bulletPoints`, `achievement.title` / `date` /
  `issuer` — are stripped by canonical normalization on both sides.
  Field-level diffing of those extensions is deferred to the Phase-1B
  reconciliation UI. A malformed document can never classify as IDENTICAL
  (DIFFERENT-safe fingerprint).

## Authentication behavior

- The sync runs only for `useSession().status === "authenticated"`.
- Unauthenticated/loading state: no `/api/resumes` call; existing local
  behavior continues.
- The API itself rejects unauthenticated requests with 401 (unchanged).

## Failure behavior (fail closed)

- Network unavailable, API 500, session expiry, timeout: the sync returns an
  `error` outcome, the monitor stays silent, and the builder keeps working
  from localStorage. Nothing is retried or queued in Phase 1A.

## Feature flag

`NEXT_PUBLIC_RESUME_SERVER_SYNC` (default enabled; set to `"false"` to disable
the entire server-read path). Read at call time so it can be toggled without a
rebuild in tests. This is the smallest safe activation mechanism — no flag
framework.

## Debug/development output

Dev-only (non-production builds) console report listing each resumeId + parity
status — never resume content, one line per builder load. There is no existing
debug panel in the repository, so this is the smallest safe inspection
mechanism. Future reconciliation UI will replace it.

## No automatic migration / no overwrite / no dual-write

Phase 1A performs none of these. The parity result exists solely for
observation and future reconciliation. The server table may be empty, partial,
or fully populated — the UI is unaffected either way.

## Future Phase 1B

The reconciliation UI (explicit user action only) will consume the parity
report and its metadata (`serverUpdatedAt`, `localExists`, `serverExists`) to
offer: upload LOCAL_ONLY, restore/import SERVER_ONLY, and resolve DIFFERENT
(server vs local) per resume — after user confirmation. Until then, all
classification is inert.

## Rollback

- Disable `NEXT_PUBLIC_RESUME_SERVER_SYNC=false` — the monitor stops fetching
  and the builder is byte-for-byte pre-Phase-1A behavior.
- The parity engine is a pure module with no side effects; removing it cannot
  affect resume data.
- No data is created, modified, or deleted by Phase 1A on either side.

## Consequences

- The system can now answer "does the user's local resume match the server?"
  deterministically, with multi-resume support.
- The safety invariants (never upload, never add server-only, never overwrite,
  fail closed) are enforced structurally (pure module) and by tests.
- Phase 1B can be built on a proven, tested classification layer.
- The canonical payload schema is now shared client/server
  (`src/utils/resume-payload-schema.ts`), eliminating schema drift.

## Risks

- Over-strict comparisons (e.g. resolved store `styleConfigs` vs partial stored
  style) may report DIFFERENT conservatively — safe for read-only parity.
- The canonical normalization strips local-only extension fields; if a user
  edits only those, parity reports IDENTICAL (documented limitation, Phase-1B
  field-level diffing).
- The monitor adds one authenticated GET per builder mount; disabled via flag
  if that ever matters.

## Related ADRs / documents

- ADR-001 (canonical source of truth) · ADR-002 (domain model) ·
  ADR-003 (server persistence) · `docs/MASTER_ARCHITECTURE.md`
