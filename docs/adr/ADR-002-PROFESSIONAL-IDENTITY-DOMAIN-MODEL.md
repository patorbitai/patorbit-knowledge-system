# ADR-002 — Professional Identity Domain Model

**Document ID:** ADR-002
**Status:** ✅ Accepted
**Date:** 2026-08-16
**Type:** Foundational domain-model architecture (ownership relationships)
**Basis:** Existing-System Audit (2026-08-16) · ADR-001 (Canonical Source of
Truth) · Professional Identity Ownership Analysis (2026-08-16)
**Related:**
- `docs/adr/ADR-001-CANONICAL-SOURCE-OF-TRUTH.md` (accepted)
- `docs/MASTER_ARCHITECTURE.md` (project direction)
- `patorbit-docs/04_ADR/ADR-003` (identity-centric model), `ADR-006` (constitutional architecture)
- `patorbit-docs/03_SRS/Patorbit-Professional-Identity-Platform-Specification.md` (PKS-SRS-PIP-1)

---

## Context

The Existing-System Audit and the Professional Identity Ownership Analysis
established how professional identity data actually lives in the current
codebase. The system is **client-first today**: the resume (with claims nested
inside it) lives in the Zustand store + localStorage; evidence exists across
three surfaces; trust and passport are derived views with server-side share
caches.

ADR-001 decided that PostgreSQL / Patorbit Core becomes the canonical persistent
source of truth, and that client state (Zustand, localStorage, IndexedDB) is a
cache/session representation. ADR-002 formalizes **what the canonical domain
model is** — the ownership relationships between ProfessionalIdentity, Resume,
Claim, Evidence, Verification, Trust, Knowledge Graph, and Passport — based on
the structures that already emerged in the code.

## Existing System (verified, unchanged)

| Domain | Current location | Status |
|---|---|---|
| ProfessionalIdentity | PostgreSQL row (`userId` 1:1, share tokens/flags, trust/passport caches) | Exists, mostly a shell |
| Resume | Zustand store + localStorage (`resumes[]`, `resumeId`, `resumeName`, multi-resume actions) | Client-only; no server entity |
| Claims | Nested `resume.claims` + `suggestedClaims` (client-only); `claim.repository.ts` empty | Client-only; no server entity |
| Evidence | Store `evidence[]` + IndexedDB blobs + PostgreSQL `EvidenceRecord` (`userId`, `claimId` as unenforced String) | Partially server-side; `claimId` has no FK |
| Verification | `Claim.verificationStatus` + `EvidenceStatus` (status-based) | Status-only |
| Trust | Derived client-side (`TrustService` over `resumeToGraph`); `trustReportCache` share copy in PostgreSQL | Derived + cache |
| Passport | Live client data; `passportDataCache` share copy in PostgreSQL | Derived + cache |
| Knowledge Graph | Derived in-memory (`resumeToGraph`, `GraphService`) | Derived in-memory |

## Problem

The current shapes are client-scoped and misaligned with the accepted
canonical-source-of-truth direction:

1. **Claims are nested inside Resume** — deleting a resume would destroy
   identity-level claims and evidence (they do not belong to the resume).
2. **Resume is client-only** — no server entity, no multi-device support, no
   versioning foundation.
3. **`EvidenceRecord.claimId` is an unenforced String** — no Claim entity exists
   to reference.
4. **Trust and Passport caches** hold client-authored snapshots that can diverge
   from canonical data.
5. **Knowledge Graph nodes** (`ClaimNode`, `EvidenceNode`) risk being mistaken
   for a canonical store instead of the derived projection they are.

## Decision

ProfessionalIdentity is the **root canonical identity domain**. It owns (or
references) Resumes, Claims, Evidence (through Claims), Verification, and
identity history/provenance. Resume, Claim, and Evidence become **server
entities**; Trust, Knowledge Graph, and Passport remain **derived projections**.

### Domain ownership

```
                    PROFESSIONAL IDENTITY
                            │
            ┌───────────────┼────────────────┐
            │               │                │
            ▼               ▼                ▼
         RESUMES          CLAIMS          HISTORY
            │               │
            │               ▼
            │           EVIDENCE
            │               │
            │               ▼
            │         VERIFICATION
            │               │
            └───────┐       │
                    ▼       ▼
                 PRESENTATION
                    │
          ┌─────────┼──────────┐
          ▼         ▼          ▼
       Resume     Trust     Passport
       Views     Report      View
```

And separately, the derived relationship layer:

```
Claims + Evidence
       ↓
Knowledge Graph
       ↓
Derived relationships / reasoning
```

### Decision 1 — Professional Identity

- One `ProfessionalIdentity` per user (existing 1:1 row remains the root
  identity domain).
- It should eventually own/reference: Resumes, Claims, Evidence (through
  Claims), Verification, and identity history/provenance.
- Existing share controls/tokens (`trustShareToken`, `trustShareEnabled`,
  `passportShareEnabled`) remain associated with ProfessionalIdentity.
- Existing trust/passport serialized fields (`trustReportCache`,
  `passportDataCache`) are **caches, not canonical identity data**.
- **No fields are added in this ADR.**

### Decision 2 — Resume

- Resume is a **separate persistent entity** associated with
  ProfessionalIdentity: `ProfessionalIdentity 1:N Resume`.
- The application already supports multiple resumes (`resumeId`, `resumeName`,
  `resumes[]`, `createResume`/`switchResume`/`renameResume`/`deleteResume`) —
  so resumes are **not** serialized into a single JSON field on
  ProfessionalIdentity.
- The existing `resumeId` remains the stable application-level identifier
  unless a later migration analysis proves otherwise.
- **Future:** `ResumeVersion` belongs to Resume
  (`ProfessionalIdentity → Resume → ResumeVersion`). **Not implemented here.**

### Decision 3 — Claim

- Claim becomes a **first-class domain entity owned by ProfessionalIdentity**:
  `ProfessionalIdentity 1:N Claim`.
- Claims must **not** remain permanently nested inside Resume.
  - Current: `Resume → claims[]`
  - Target: `ProfessionalIdentity → claims[]`
- A Resume **selects/projects** the relevant claims it presents — the same
  identity can produce multiple specialized resumes:

```
ProfessionalIdentity
    ├── Claim: Google — Software Engineer
    ├── Claim: AWS Certified
    ├── Claim: Python
    ├── Claim: Product Strategy
    ├── Resume A: Software Engineer  → Google, AWS, Python
    └── Resume B: Product Manager    → Google, Product Strategy
```

- Not every claim must appear in every resume. The selection mechanism is a
  future design detail.

### Decision 4 — Claim Source

- The existing `Claim.sourceActivityId` is **preserved conceptually** — it
  connects claims to resume/activity information.
- **No new source system is created in this ADR.**
- Future source/provenance modeling must allow a Claim to originate from:
  resume/activity information, imported information, evidence, an external
  source, an issuer credential, or future identity sources.
- The exact Source model is **FUTURE** unless already implemented.

### Decision 5 — Evidence

- Evidence belongs to **Claims**:
  `ProfessionalIdentity → Claim → Evidence`.
- The existing `EvidenceRecord` already carries `userId` and `claimId`, but
  `claimId` is currently only a String with no FK (because Claim does not yet
  exist in PostgreSQL). The future canonical relationship should make
  `Claim → Evidence` enforceable.
- The uploaded file/blob is an **artifact**; `EvidenceRecord` is the canonical
  **metadata record**:

```
Claim
  │
  └── EvidenceRecord
         │
         └── file/blob reference
```

- **No new evidence database is created.**

### Decision 6 — Verification

- Verification is associated with **Claims and Evidence**.
  - Current: `Claim.verificationStatus`, `EvidenceStatus`.
  - Target: `Claim → Verification records/events`.
- `verificationStatus` should eventually become a **derived summary** of
  verification events/evidence — not the ultimate source of verification
  history.
- The verification engine and issuer infrastructure are **not designed here** —
  only ownership is established.

### Decision 7 — Trust

- Trust is a **derived projection**. It is **not** user-editable, not a primary
  source of truth, and not an independent identity record.

```
Claims + Evidence + Verification + Consistency + Future provenance
        ↓
     TrustService
        ↓
   Trust Report
```

- `ProfessionalIdentity.trustReportCache` remains a **cache for public
  sharing** — not canonical Trust.

### Decision 8 — Knowledge Graph

- The Knowledge Graph is a **derived relationship/projection layer**.
- `resumeToGraph()` creates `ClaimNode`, `EvidenceNode`, and edges
  (`HAS_CLAIM`, `SUPPORTED_BY`, `VERIFIED_BY`, `DERIVED_FROM`, `CONTRADICTS`,
  `CHALLENGED_BY`).
- Graph nodes must **not** become the canonical Claim/Evidence store:
  - Canonical: `Claim` entity, `EvidenceRecord`.
  - Derived: `ClaimNode`, `EvidenceNode`, graph edges.
- The graph may later support conflict reasoning; a conflict engine is FUTURE.

### Decision 9 — Passport

- Passport is a **derived presentation/sharing projection**:

```
ProfessionalIdentity
    ↓
Resume / Claims / Evidence / Verification / Trust
    ↓
Passport projection
```

- The current `passportDataCache` remains a share cache.
- Future behavior: the server generates share snapshots from canonical server
  data rather than accepting an entire client-authored canonical payload.
- **Not implemented here.**

### Decision 10 — Multiple Resumes

- ProfessionalIdentity is the single identity; it may have **multiple resumes**.
- A resume is a **presentation/context** of the identity.
- Changing or deleting a resume must **not** delete the underlying professional
  claims or evidence:

```
Delete "Software Engineer Resume"
  must NOT delete Claim "Worked at Google"
  must NOT delete Evidence "Google Experience Letter"
```

Those belong to the Professional Identity.

### Decision 11 — Trust / Passport with Multiple Resumes

- The active resume is **not** the definition of the person's professional
  truth.
- Long-term: identity-level Trust derives from the canonical
  identity/claims/evidence/verification state; a specific Resume or Passport
  presentation may select which claims it presents.
- The selection mechanism is a **future design detail** — not implemented here.

### Decision 12 — Source of Truth (reconfirmation of ADR-001)

| Layer | Role |
|---|---|
| PostgreSQL / Patorbit Core | **CANONICAL PERSISTENT TRUTH** |
| API | Access + mutation boundary |
| Zustand | Client UI/session cache |
| localStorage | Temporary client state / preferences / cache |
| IndexedDB | Local file/blob cache or offline support |
| Knowledge Graph | **Derived projection** |
| Trust | **Derived projection** |
| Passport | **Derived projection** |

## Current vs Target

| Domain | CURRENT | TARGET |
|---|---|---|
| ProfessionalIdentity | Exists but is mostly a shell (share flags + caches) | Root persistent identity |
| Resume | Client-only (Zustand + localStorage) | Server entity under ProfessionalIdentity |
| Claim | Nested in Resume / client-only | Server entity under ProfessionalIdentity |
| Evidence | `EvidenceRecord` server-side; `claimId` unenforced | `EvidenceRecord` belongs to Claim (enforceable) |
| Verification | Status-based | Verification history belongs to Claim/Evidence |
| Trust | Derived client-side + share cache | Derived |
| Passport | Live client data + share cache | Derived |
| Knowledge Graph | Derived in-memory | Derived |

## Consequences

**Positive:**
- Deleting a resume can no longer destroy identity-level claims/evidence.
- Multiple specialized resumes project from one canonical identity.
- Verification, trust, and passport can be computed from canonical claims and
  evidence.
- The existing `resumeId`, `sourceActivityId`, and `EvidenceRecord` shapes map
  cleanly onto the target model — no throwaway redesign.
- The graph remains a projection; no second claim/evidence store.

**Trade-offs / obligations:**
- Moving claims out of `resume.claims` touches the store shape, `graph-mapper`,
  ClaimsReview, evidence wiring, and the persisted `mergePersistedResumeState`
  — the migration must be backward-compatible.
- `EvidenceRecord.claimId` references must be back-filled/validated once a Claim
  entity exists.
- Client code must keep working through the transition (dual-read/dual-write).

## Migration Principles

**Do not migrate in one giant change.** Future sequence:

1. ProfessionalIdentity domain foundation
2. Resume server entity
3. Claims server entity
4. Evidence Claim FK
5. Verification records/events
6. Trust server-side derivation
7. Passport server-side projection

For every migration:

```
Existing data
    ↓
Backward-compatible migration
    ↓
Dual-read / dual-write where necessary
    ↓
Tests
    ↓
Real browser validation
    ↓
Promote server to authority
    ↓
Remove old duplicate authority
```

**Never remove localStorage/IndexedDB behavior before the server path is
proven.**

## Risks

1. Claims de-nesting from Resume is the highest-risk migration (store shape,
   persistence merge, graph mapping, evidence wiring all touch it).
2. `EvidenceRecord.claimId` dangling references need a validation/back-fill
   strategy.
3. Client-uploaded share caches (trust/passport) can serve stale or
   client-authored data until regenerated server-side.
4. Multiple resumes + `activeResumeId` need a server rule for which resume is
   "current" for presentation.
5. localStorage is the only durability for resume/claims today — a broken
   persist `merge` silently loses user data.
6. Numbering/governance drift between the working ADR series and the frozen
   canonical series (see below).

## Open Decisions (preserved, not decided)

1. Exact Resume ID / server ID strategy.
2. Exact Claim ↔ Resume presentation/selection model.
3. Which resume feeds a specific Passport presentation.
4. ResumeVersion design.
5. Source/provenance model.
6. Verification event schema.
7. Credential/issuer architecture.
8. Share-cache regeneration strategy.
9. Offline synchronization strategy.
10. localStorage migration/versioning strategy.
11. Style/template persistence ownership.

## ADR Numbering Conflict (documented)

The working tree (`docs/adr/`) uses a non-destructive convention established by
ADR-001: `ADR-001-CANONICAL-SOURCE-OF-TRUTH.md`. This file follows that
convention: `ADR-002-PROFESSIONAL-IDENTITY-DOMAIN-MODEL.md`.

**Conflict:** the frozen canonical tree (`patorbit-docs/04_ADR/`) already has an
`ADR-002-evidence-engine-beta-path.md` (and its ADR-001 is the AI provider
abstraction). These are separate document series; this ADR does **not**
overwrite, rename, or modify any canonical ADR. The shared numbers are a
governance concern for the PKS submodule and remain open.

## Related ADRs / Documents

- `docs/adr/ADR-001-CANONICAL-SOURCE-OF-TRUTH.md`
- `docs/MASTER_ARCHITECTURE.md` (project direction, §1 Architecture Status)
- `patorbit-docs/04_ADR/ADR-003` (identity-centric model)
- `patorbit-docs/04_ADR/ADR-006` (constitutional architecture)
- `patorbit-docs/03_SRS/Patorbit-Professional-Identity-Platform-Specification.md`
