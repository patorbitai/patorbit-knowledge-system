# ADR-001 — Canonical Source of Truth

**Document ID:** ADR-001
**Status:** ✅ Accepted
**Date:** 2026-08-16
**Type:** Foundational architecture decision (persistent data authority)
**Audit basis:** Existing-System Audit (2026-08-16) — code-verified inventory of
all persistence surfaces (Zustand, localStorage, IndexedDB, PostgreSQL).
**Related:**
- `docs/MASTER_ARCHITECTURE.md` (project direction, §12 Platform Architecture)
- `patorbit-docs/04_ADR/ADR-003` (identity-centric model), `ADR-006` (constitutional architecture)
- `docs/adr/0006-prisma-strategy.md` (PostgreSQL + Prisma chosen)

---

## Context

The Existing-System Audit (2026-08-16) found that professional identity data is
currently spread across **four persistence surfaces**, each of which can look
authoritative to a different part of the application:

| Surface | What it holds today | Role today |
|---|---|---|
| **PostgreSQL (Prisma)** | `User`, `ProfessionalIdentity` (share flags + trust/passport **caches**), `EvidenceRecord`, `UsageRecord`, auth models | Partial persistence; caches are copies, not sources |
| **Zustand store** | `resume`, `resumes[]`, `evidence[]`, `claims`, `trustScore`, `trustReport`, `careerProfile`, `jobProfile`, `qualificationMatch`, `styleConfigs` | De-facto working source of truth for resume/claims/evidence |
| **localStorage** (`patorbit-resume-v2`) | Persisted `partialize`: `resumes`, `activeResumeId`, `evidence`, `styleConfigs` | Durability for the Zustand working copy |
| **IndexedDB** (`idb-keyval`) | Evidence **file blobs** (proofs: PDFs, images, links) | Local file/blob cache + offline |

**Problem statement.** Multiple authoritative-looking copies can diverge. A
reload rebuilds the store from localStorage; a different browser shows a
different resume; claims/evidence exist client-side only; trust and passport
caches in PostgreSQL are snapshots that can go stale. There is no single,
server-side, canonical source from which every surface can be reconstructed.

**Decision.** Patorbit's authoritative persistent source of truth for
professional identity data will be the **server-side PostgreSQL-backed Patorbit
Core**. Client state is a **cache/session representation**, never canonical.

---

## Decision

### 1. Architecture (target)

```
PostgreSQL  (canonical persistent truth)
    ↓
Patorbit API  (controlled access and mutation boundary)
    ↓
Zustand / client state  (UI/session cache, synchronized with server truth)
    ↓
React UI
```

### 2. Storage-layer rules

| Layer | Allowed to hold | Must NOT become |
|---|---|---|
| **PostgreSQL** | Canonical persistent truth for all canonical domains | — |
| **Patorbit API** | Controlled access + mutation boundary over canonical data | An independent duplicate store |
| **Zustand** | Client UI/session cache synchronized with server truth | An independent canonical store |
| **localStorage** | Preferences, UI state, explicitly temporary client state only | A canonical source for professional identity |
| **IndexedDB** | Local file/blob cache and offline workflow support only | An independent canonical source for professional identity |

### 3. Canonical domains (authoritative, long-term)

- User identity
- Professional identity
- Resume
- Resume versions
- Claims
- Evidence metadata (the artifact blob may remain a referenced store; the
  *record* of evidence is canonical)
- Verification
- Trust / verification results
- Passport source data

### 4. Derived / projection domains (never authoritative on their own)

- Knowledge graph projections
- Trust reports
- Passport presentation
- Resume preview
- Template presentation

Derived domains are recomputed from canonical data. They may be cached (e.g. a
trust report snapshot) but a cache is never the source of truth.

### 5. No parallel identity stores

No feature may create a separate independent source of truth for professional
identity. Do not create parallel systems such as:

- `ImportResumeState`
- `GalleryResumeState`
- `PassportResumeState`
- `TrustResumeState`

Instead, every surface consumes the same canonical identity:

```
Canonical Identity
    ↓
Resume · Claims · Evidence · Verification
    ↓
Gallery / Preview / Trust / Passport
```

---

## Consequences

**Positive:**
- **Reload can reconstruct state from server** — a browser refresh rebuilds the
  store from canonical data, not from a fragile local copy.
- **Multiple devices can share the same identity** — no more per-browser
  divergence.
- **Evidence history can be preserved centrally** — provenance lives with the
  canonical record, not in a client cache.
- **Verification can operate on canonical data** — verification workflows need
  one record of the claim + its evidence, not a local mirror.
- **Trust can be recomputed from canonical claims/evidence** — trust becomes a
  derived function of canonical inputs.
- **Passport can become a projection** rather than independent truth.
- **Conflicts can be detected centrally** — the Conflict Engine (future) needs
  a single view of all evidence, which only a canonical store provides.

**Trade-offs / obligations:**
- Client state must handle **synchronization correctly** (hydrate from server,
  optimistic updates, conflict resolution, offline queue) — this is the main
  new engineering cost.
- The API must become the **controlled access and mutation boundary** —
  authentication, authorization, validation, and rate limiting at the edge of
  canonical data.
- Caches (localStorage, IndexedDB, in-memory) must be treated as **rebuildable
  artifacts**, never as truth.

---

## Current-System Validation (as built, 2026-08-16)

The following was verified against the actual code (no changes made):

1. **Resume data in Zustand:** `src/store/resume-builder.ts` — `resume: Resume`,
   `resumes: Resume[]`, plus `evidence[]`, `claims` (inside resume), trust
   snapshots, career/job/qualification models, and `styleConfigs`.
2. **Resume data in localStorage:** Zustand `persist` under
   `patorbit-resume-v2`, `partialize: (state) => ({ resumes, activeResumeId,
   evidence, styleConfigs })`.
3. **Resume data in PostgreSQL:** **None.** No `Resume`/`ResumeVersion` table
   exists. The only resume-shaped data in the DB is the serialized
   `ProfessionalIdentity.passportDataCache` (a share copy).
4. **Evidence data in Zustand:** `evidence: Evidence[]` with
   `addEvidence/updateEvidence/removeEvidence/evidenceForClaim`.
5. **Evidence data in IndexedDB:** `src/lib/evidence/storage.ts` wraps
   `idb-keyval` (`get/set/del/clear`, evidence store) for file blobs.
6. **Evidence data in PostgreSQL:** `EvidenceRecord` table + `evidence.repository`
   + `/api/evidence` (auth + entitlement + usage gated).
7. **Claims in PostgreSQL:** **None.** No `Claim` table; `claim.repository.ts`
   is empty (0 bytes). Claims live client-side (`resume.claims`,
   `suggestedClaims`).
8. **ProfessionalIdentity persistence:** PostgreSQL `ProfessionalIdentity`
   (userId 1:1, share tokens/enabled flags, trust/passport data caches);
   created/updated via `/api/trust/share` and `/api/passport/share`.
9. **Trust persistence:** Derived `TrustReport`/`TrustSnapshot` in the Zustand
   store (localStorage) **and** a serialized `trustReportCache` in PostgreSQL
   (`ProfessionalIdentity`) written by `/api/trust/share`.
10. **Passport persistence:** Rendered live from the Zustand resume
    (localStorage) **and** a serialized `passportDataCache` in PostgreSQL
    written by `/api/passport/share` for the public `/passport/[userId]` view.

**Validation conclusion:** the decision is directionally consistent with the
current code — PostgreSQL is already the server-side durable store, and
localStorage/IndexedDB already behave as caches for the store. What does **not**
yet match the decision: resume, claims, verification state, and trust inputs
have no canonical PostgreSQL representation (they are client-only or DB-cached
copies), and the API is not yet a complete mutation boundary for those domains.

---

## Migration Principle

Migration happens **domain-by-domain**, never in one change:

1. Professional Identity
2. Resume
3. Claims
4. Evidence
5. Verification
6. Trust
7. Passport

Each domain migration must:

- **preserve existing data** (no destructive rewrite),
- **maintain backward compatibility** where needed (existing client flows keep
  working during the transition),
- **include tests** (unit + integration for the new server path),
- **include real browser validation** where appropriate (multi-tab, reload,
  offline, second device),
- **remove the duplicate authority only after the new path is proven** (the old
  client-side copy is demoted to a cache, not deleted in the same change).

Until a domain is migrated, its current persistence behavior is **unchanged**
and remains governed by this ADR's rules (client copies are caches; only the
server can become canonical).

---

## Unresolved follow-ups (not decided here)

- **Migration order confirmation** — the domain sequence above is proposed;
  the first concrete migration (recommended next: **Professional Identity**
  row → then **Resume**) needs its own scoped design + founder review before
  any code.
- **Synchronization semantics** for the client cache (hydrate, optimistic
  update, offline queue, conflict policy) — a separate ADR.
- **API boundary shape** (which routes mutate canonical data; authz model) —
  a separate ADR.
- Where the frozen canonical series (`patorbit-docs/04_ADR/ADR-001` =
  AI provider abstraction) and this working-tree ADR-001 relate — numbering
  disposition is a governance question for the PKS submodule.

---

## Related Documents

- `docs/MASTER_ARCHITECTURE.md` — §12 Platform Architecture, §4 Data Separation
- `docs/ARCHITECTURE.md` — current system architecture (implemented state)
- `patorbit-docs/04_ADR/ADR-006` — constitutional architecture (root aggregate: Professional Identity)
- `patorbit-docs/04_ADR/ADR-003` — identity-centric model
- `docs/adr/0006-prisma-strategy.md` — PostgreSQL + Prisma chosen
