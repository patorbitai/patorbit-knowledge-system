# Patorbit Master Architecture

**Document ID:** PKS-ARCH-MASTER-1
**Version:** 1.0.0
**Last Updated:** 2026-08-16
**Status:** Active — living project-direction document
**Owner:** Patorbit Founding Team
**Relationship:** This document is the **project-direction layer** for the working
repository. It does **not** replace the canonical frozen documents in
`patorbit-docs/` (PKS-SRS-PIP-1, ADR-003, ADR-006). Where this document and the
canonical docs overlap, the canonical documents govern the frozen core domain
model; this document records **what is implemented today** vs. **what the
architecture will become**, and why.

---

## 1. Architecture Status

| Layer | Status |
|---|---|
| **Canonical source of truth (PostgreSQL-first)** | ✅ **IMPLEMENTED — ADR-001; Resume table + API live; server is authoritative** |
| **Professional Identity domain model** | ✅ **IMPLEMENTED — ADR-002; PI model with profileData, onboarding, resume seeding** |
| **Resume server persistence (Phase 0 foundation)** | ✅ **IMPLEMENTED — ADR-003; Resume table under PI with hybrid relational metadata + JSON payload** |
| **Resume server read parity (Phase 1A)** | ✅ **IMPLEMENTED — ADR-004; server-authoritative tailoring (C33.2)** |
| **Safe local resume migration (Phase 1B)** | ✅ **IMPLEMENTED — ADR-005; local→server migration with verification** |
| **AI Provider (Gemini)** | ✅ **IMPLEMENTED — C33.3; Google Gemini as primary provider** |
| **Job Tailoring (server-authoritative)** | ✅ **IMPLEMENTED — C33/C33.2; `/api/ai/tailor` with trust/factuality safeguards** |
| **Job Application Workspace** | ✅ **IMPLEMENTED — C55/C55.1; persistent applications with tailoring integration** |
| **Authenticated Home (`/solutions`)** | ✅ **IMPLEMENTED — C54; post-login destination with resume + application management** |
| **Landing Page (accurate positioning)** | ✅ **IMPLEMENTED — C52; PI→resumes→tailoring story; fabricated claims removed** |
| Resume Builder (32 templates, 7 layouts, gallery, customization) | ✅ **CURRENT — implemented** |
| A4 page-frame / pagination architecture | ✅ **CURRENT — implemented** |
| Gallery ↔ Preview ↔ PDF parity | ✅ **CURRENT — implemented** |
| Resume import pipeline + review flow | ✅ **CURRENT — implemented** |
| Claims (suggested/accepted in builder store) | ✅ **CURRENT — partial (builder-scoped)** |
| Evidence (upload/link, badge, IndexedDB storage) | ✅ **CURRENT — partial (builder-scoped)** |
| Trust Score backend pipeline (services, graph, coordinator) | ✅ **CURRENT — backend implemented, UI wiring partial** |
| **Server-side Trust derivation** | ✅ **IMPLEMENTED — ADR-002 Phase 4 + Phase 9B (Trust v2); `GET /api/trust` derives Trust from canonical Claims + Evidence + VerificationEvents + Conflicts; per-claim Trust scoring with evidence strength, verification status, conflict integration; pure algorithm in `src/lib/trust/v2/derivation.ts`** |
| Professional Passport surface | ✅ **IMPLEMENTED — ADR-002 Phase 6; `buildPassport()` derives from canonical data; public share derives server-side; client-submitted data no longer accepted** |
| **First-class Claim server entity** | ✅ **IMPLEMENTED — ADR-002 Phase 2; Claim table under ProfessionalIdentity with repository, service, API** |
| **Evidence → Claim FK enforcement** | ✅ **IMPLEMENTED — ADR-002 Phase 2; EvidenceRecord.claimId is nullable FK with ON DELETE SET NULL** |
| **Verification history / audit trail** | ✅ **IMPLEMENTED — ADR-002 Phase 3; VerificationEvent append-only table with status transitions** |
| **Verification status transition control** | ✅ **IMPLEMENTED — ADR-002 Phase 3; controlled state machine with ownership enforcement** |
| **Canonical Trust input isolation** | ✅ **IMPLEMENTED — ADR-002 Phase 8; single canonical loader (`canonical-loader.ts`) shared across Trust, Share, Passport; cross-user unclaimed evidence eliminated** |
| **Claim verification lifecycle enforcement** | ✅ **IMPLEMENTED — ADR-002 Phase 8; `claimService.update()` blocks verificationStatus changes; must go through VerificationEvent service** |
| **Verification evidence ownership** | ✅ **IMPLEMENTED — ADR-002 Phase 8; `verificationEventService` validates evidenceRecordId belongs to the target claim** |
| **Passport share token rotation** | ✅ **IMPLEMENTED — ADR-002 Phase 8; new token generated on every share enable; old token invalidated on disable** |
| Verification levels L0–L3 | 🔶 **FUTURE — proposed** |
| **Conflict Detection Engine** | ✅ **IMPLEMENTED — ADR-002 Phase 5; `ConflictRecord` model + pure detection algorithm; detects overlapping dates, contradictory employers, duplicate credentials, status mismatches** |
| Trusted Issuer Network / verifiable credentials | 🔶 **FUTURE — proposed** |
| Scalable Core Platform service separation | 🔶 **FUTURE — proposed** |

> Reading rule: a row marked **CURRENT** describes behavior that exists in this
> repository today. A row marked **FUTURE** describes direction that has been
> agreed as product intent but **is not yet implemented**. Nothing in the
> FUTURE sections below should be read as shipping functionality.

---

## 2. Core Product Vision

**Patorbit is not a resume builder.** A resume is one *presentation layer* of a
professional identity — it is **not** the ultimate source of truth.

The long-term purpose of Patorbit is:

> Build a verifiable professional identity from claims and evidence, preserve
> provenance and history, detect conflicts, and provide trustworthy
> professional information that users can selectively share.

The deeper source of truth is the professional identity pipeline:

```
Professional Identity
    ↓
Claims
    ↓
Evidence
    ↓
Verification
    ↓
Conflict Detection
    ↓
Trust / Confidence
    ↓
Professional Passport / Shareable Identity
```

This mirrors the frozen canonical pipeline in `patorbit-docs/04_ADR/ADR-006`
(`Sources → Claims → Evidence → Verification → Trust → ... → Projections`) and
PKS-SRS-PIP-1. The Master Architecture document adds the **current-vs-future
implementation status** and the **product principles** below.

---

## 3. Core Product Principles (non-negotiable)

1. **User editable does not mean verified.** Editing the resume changes the
   presentation layer only.
2. **Uploaded evidence does not automatically mean verified.** An uploaded file
   initially represents "evidence provided by the user."
3. **Latest information does not automatically override historical evidence.**
   A newer resume edit does not rewrite the historical verified record.
4. **Historical evidence / provenance must be preserved.**
5. **Conflicts should be surfaced, not silently resolved.**
6. **Patorbit should explain verification decisions.**
7. **Employer manual verification should be the exception, not the default.**
8. **Trusted issuer integrations should scale verification.**
9. **The resume is a presentation layer, not the ultimate source of truth.**
10. **Privacy and selective disclosure are fundamental.**
11. **Current implementation and future architecture must remain clearly
    separated in the documentation.**
12. **Do not build future complexity before the current product needs it.**

### 3.1 The Resume Edit vs. Verified Truth Principle

This principle is central and deserves its own section.

Users **must** be allowed to edit their resumes. Editing a resume does **not**
automatically make the new information verified.

Example:

- Previously verified historical evidence: **Google, 2019–2023**.
- The user later edits the resume to: **Microsoft, 2019–2023**.

Patorbit must **not** silently rewrite the historical verified evidence.
Instead:

- The **current resume claim** becomes: Microsoft.
- The **historical verified evidence** remains: Google, 2019–2023.
- The system should be able to detect the difference and mark the new claim as
  **requiring evidence / re-verification** where appropriate.

Therefore:

> **Resume content ≠ Verified truth.**

---

## 4. Data Separation

Resume data and evidence data are **not** the same thing. They are logical
domains that can evolve independently:

| Domain | Role |
|---|---|
| **Resume** | Presentation of professional information |
| **Claims** | Assertions about identity |
| **Evidence** | Supporting artifacts / signals |
| **Verification** | Evaluation of evidence |
| **Trust** | Derived state |
| **Passport** | Shareable presentation of verified professional identity |

This is a **logical** separation. It does not claim these are separate
databases today; they are described as domains/services that can evolve
independently (see §12 Platform Architecture).

---

## 5. Claim Model (implemented — ADR-002 Phase 2)

A **Claim** is an assertion about the user's professional identity. Examples:

- Worked at Google
- Held title Senior Software Engineer
- Graduated from University X
- Holds certification Y
- Completed project Z

**Status: IMPLEMENTED.** Claim is now a first-class server-side entity under
ProfessionalIdentity (`ProfessionalIdentity 1:N Claim`). The builder-scoped
`Claim` type in `src/types/resume.ts` coexists with the server entity during
the transition period.

### Implemented fields

- `id` — stable unique identifier
- `professionalIdentityId` — FK to ProfessionalIdentity (ownership)
- `assertionText` — the claim as a clear, specific sentence
- `claimType` — Employment | Education | Project | Skill | Certification | Contribution
- `sourceActivityId` — optional link to resume/activity information
- `confidence` — 0–1, how strongly the underlying data supports the claim
- `reasoning` — one sentence on why this is verifiable
- `verificationStatus` — current projected state (suggested | accepted | evidence-added | under-review | verified | expired | revoked | disputed)
- `reviewed` — whether accepted/rejected by the user via Claims Review
- `accepted` — whether the claim was accepted
- `createdAt` / `updatedAt`

### Relationships

```
Claim
  ├── ProfessionalIdentity (required FK, CASCADE delete)
  ├── EvidenceRecord[] (one-to-many)
  └── VerificationEvent[] (one-to-many, append-only audit trail)
```

### API endpoints

- `GET /api/claims` — list claims for authenticated user
- `POST /api/claims` — create a claim
- `GET /api/claims/[claimId]` — get a specific claim
- `PATCH /api/claims/[claimId]` — update a claim
- `DELETE /api/claims/[claimId]` — delete a claim

All endpoints enforce ProfessionalIdentity ownership via session authentication.

---

## 6. Evidence Model (current + future)

Evidence is **separate from claims**. Evidence examples:

- Experience letter
- Offer letter
- Relieving letter
- Degree certificate
- Certification
- Payslip (where appropriate)
- Employer-issued credential
- Institution-issued credential
- Verified professional source
- Other supporting documents

### 6.1 Current implementation

**Server-side (ADR-002 Phase 2):**
- `EvidenceRecord` is a first-class PostgreSQL entity with an enforceable FK to `Claim`.
- `claimId` is nullable (`String?`) with `ON DELETE SET NULL` — deleting a Claim
  sets `claimId` to NULL rather than deleting the evidence.
- Evidence ownership is enforced: the Evidence API validates that the supplied
  `claimId` belongs to the authenticated user's ProfessionalIdentity.
- `evidenceRepository` provides CRUD operations; `evidenceStorageService` handles
  server-side file storage.
- `GET/POST /api/evidence` and `GET/DELETE /api/evidence/[id]` routes exist with
  authentication and entitlement checks.

**Client-side (still in use):**
- Evidence records also exist in the builder store (`evidence: Evidence[]` in
  `src/store/resume-builder.ts`), persisted via Zustand `persist`.
- `src/lib/evidence/` provides validation (`validate.ts`), storage
  (`storage.ts`, IndexedDB-backed file persistence), and badge derivation
  (`badge.ts`).
- The `VerificationBadge` derives its state from the claim + its evidence
  (`deriveBadgeStatus`).
- Upload flows (`AddEvidenceModal`, `EvidencePanel`) exist in
  `src/components/identity/`.

### 6.2 The "user uploaded ≠ verified" principle

An uploaded document initially represents **"evidence provided by the user."**
It must **not** automatically become verified truth.

Evidence should eventually preserve:

- original artifact
- evidence ID
- owner
- source
- issuer
- upload timestamp
- file hash / fingerprint
- extracted facts
- related claims
- verification events
- status
- confidence
- history

The original evidence / provenance must **not** be silently overwritten when
the user edits a resume.

---

## 7. Verification Levels (proposed / future)

A layered verification model so Patorbit is **not** dependent on manual
employer verification for every employee. The system must scale.

| Level | Name | Meaning | Examples |
|---|---|---|---|
| **L0** | User-provided information | The user asserted it; no independent check | Resume edit, manual entry |
| **L1** | Document integrity / authenticity checks | The artifact is intact and internally consistent | file integrity, hash, metadata, document structure, digital signatures where available, QR/verification links where available, tampering indicators, internal consistency |
| **L2** | Independent corroboration | Multiple independent signals agree | multiple independent sources, verified professional sources, matching records, identity consistency, timeline consistency |
| **L3** | Issuer-verified / cryptographically verifiable credential | A trusted issuer digitally asserts the fact | employer-issued employment credential, university-issued education credential, certification issuer credential |

### 7.1 Scalability rule

Patorbit should **not** require Google, Microsoft, TCS, etc. to manually verify
every employee. Instead, the long-term architecture supports companies and
institutions integrating **once** as trusted issuers; their systems can then
issue machine-verifiable credentials automatically.

---

## 8. Verifiable Credential / Issuer Network (proposed / future)

The future **Patorbit Network** concept:

```
Company / Institution
    ↓
Trusted Issuer Integration
    ↓
Digitally Signed Credential
    ↓
User Identity
    ↓
Patorbit
    ↓
Cryptographic Verification
```

Example employment credential:

- **Issuer:** Google
- **Credential:** Employment
- **Person:** User
- **Role:** Software Engineer
- **Start:** 2019
- **End:** 2023
- **Issued:** …
- **Digital signature:** …

Patorbit verifies the credential **without requiring an HR employee to
manually respond to every verification request**. The same architecture can
eventually support employers, universities, certification providers,
professional organizations, and other trusted issuers.

Credentials should support **status / revocation** where technically
appropriate.

---

## 9. Conflict Engine (implemented — ADR-002 Phase 5)

**Status: IMPLEMENTED.** The Conflict Detection Engine identifies inconsistencies
between Claims within the same ProfessionalIdentity.

### Current implementation

- `ConflictRecord` is a PostgreSQL table with FK to ProfessionalIdentity.
- A pure detection algorithm (`src/lib/conflict/detection.ts`) compares Claims
  and surfaces conflicts — it NEVER silently resolves them.
- Conflicts are persisted for user review (new → reviewing → dismissed/resolved).
- The user decides how to handle each conflict.

### Detected conflict types

- **overlapping_dates** — Employment claims with overlapping date ranges
- **contradictory_employer** — Different employers during overlapping periods
- **contradictory_title** — Different job titles during overlapping periods
- **contradictory_dates** — Same employer but different date ranges
- **duplicate_credential** — Similar certifications or same degree from different schools
- **education_inconsistency** — Same school but different degrees
- **status_mismatch** — Verified claim contradicts disputed claim about same topic
- **location_inconsistency** — Same employer period but different locations

### Severity levels

- **info** — Minor inconsistency, likely legitimate (e.g., title change)
- **warning** — Potential conflict requiring review (e.g., overlapping employment)
- **critical** — Verified claim contradicts disputed claim

### Key principle

Patorbit must **not** use "latest uploaded evidence wins."
The system surfaces conflicts for user review:

> **CONFLICT / CLARIFICATION REQUIRED**

rather than silently choosing one claim. Possible legitimate explanations
include part-time work, consulting, concurrent roles, subsidiaries,
or simple data entry errors.

### API endpoints

- `GET /api/conflicts` — list all conflicts for authenticated user
- `POST /api/conflicts` — run conflict detection across all Claims
- `GET /api/conflicts/[conflictId]` — get a specific conflict
- `PATCH /api/conflicts/[conflictId]` — update status (reviewing, dismissed, resolved)
- `DELETE /api/conflicts/[conflictId]` — delete a conflict

### What this does NOT yet provide

- Automatic conflict resolution
- AI-powered conflict analysis
- Evidence-level conflict detection (currently claim-level only)
- Cross-identity conflict detection
- Timeline visualization of conflicts

---

## 10. Verification History / Audit Trail (implemented — ADR-002 Phase 3)

Historical verification decisions are preserved as an append-only audit trail.

**Status: IMPLEMENTED.** The `VerificationEvent` model provides immutable,
chronological verification history for each Claim.

### Current implementation

- `VerificationEvent` is a PostgreSQL table with FK to `Claim` and optional FK
  to `EvidenceRecord`.
- Events are append-only: there are no update or delete operations in the
  repository.
- Each event records: event type, previous status, resulting status, outcome
  (for evidence review), reason, actor, and timestamp.
- `Claim.verificationStatus` is the current projected state; `VerificationEvent[]`
  is the source of audit history.

### Event types

`requested`, `started`, `evidence_reviewed`, `verified`, `rejected`,
`disputed`, `revoked`, `expired`

### Example audit trail

```
2026-09-01: verification requested (accepted → under-review)
2026-09-02: evidence reviewed — supports (under-review → under-review)
2026-09-03: verified (under-review → verified)
2028-01-15: revoked — evidence found to be fabricated (verified → revoked)
```

Event 1 and Event 3 are **not mutated** when Event 2 is added. The history
is immutable.

### API endpoints

- `GET /api/claims/[claimId]/verification` — list verification history
- `POST /api/claims/[claimId]/verification` — create a verification event

### What this does NOT yet provide

- External verification providers
- AI verification
- Evidence authenticity determination
- Evidence hashing/fingerprinting
- Automated verification workflows

> Evidence upload ≠ verification. Verification events record application
> decisions/actions; they do not independently prove that an uploaded
> document is authentic.

---

## 11. Trust Engine (current + future)

Trust should **not** simply be "how complete is the resume?".

### 11.1 Current implementation

- **Server-side Trust derivation (ADR-002 Phase 4):** `GET /api/trust`
  returns a `ServerTrustReport` derived from canonical Claims + Evidence + VerificationEvents.
  Pure algorithm in `src/lib/trust/derivation.ts` — deterministic, side-effect-free, no DB queries.
- `TrustView` and `TrustWidget` fetch from `GET /api/trust` on mount
  (client no longer calculates authoritative Trust).
- Share flow (`/api/trust/share`) now derives Trust server-side before caching;
  client-supplied `trustReport` is no longer accepted.
- Legacy client-side `TrustService` / `GraphService` pipeline remains in the
  codebase but is no longer the authoritative Trust source.

### 11.2 Future direction

Trust / Confidence should eventually consider:

- evidence quality
- source reliability
- issuer verification
- independent corroboration
- identity binding
- temporal consistency
- claim consistency
- conflicts
- suspicious changes
- credential status
- evidence history

The system should **explain why** a claim has its current verification state.
Avoid presenting an unexplained single number as truth.

---

## 12. Platform Architecture (current + proposed)

The architectural separation:

- **Patorbit Website** = USER INTERFACE
- **Patorbit Core Platform** = SOURCE OF TRUTH / SERVICES
- **Patorbit Network** = EXTERNAL TRUSTED ISSUERS AND INTEGRATIONS

Conceptual architecture:

```
Browser
    ↓
Patorbit Web App
    ↓
Patorbit API / Core Platform
    ├── Identity
    ├── Resume
    ├── Claims
    ├── Evidence
    ├── Verification
    ├── Credentials
    ├── Conflict Engine
    ├── Trust Engine
    └── Audit / Provenance
            ↓
        Central Data Layer

External Network:

Employers · Universities · Certification Providers · Professional Organizations
        ↓
Trusted Issuer Integrations
        ↓
Patorbit Core
```

> The website must **not** become the source of truth for identity/evidence.
> The web application is **one interface** to the Patorbit identity.

**Status:** The current repository implements the **Web App** layer with a
client-scoped Zustand store as the working data layer. The Core Platform
service separation and the Issuer Network are **proposed future** architecture.

---

## 13. Resume Import (current implementation)

Desired product behavior:

```
ONE DOCUMENT
    ↓
Automatic extraction
    ↓
Complete structured Resume
    ↓
Review
    ↓
ONE APPLY ACTION
    ↓
Real user's Resume Builder
```

The user must **not** manually import each section. Supported data should
include all fields supported by the canonical Resume schema.

**Current implementation:**

- `/api/import` (route) + `src/utils/resume-parser.ts` (regex path) and
  AI-assisted extraction; `src/utils/import-json.ts` for JSON resumes
- `ImportButton` → `ImportReviewScreen` → **one Apply action** →
  `mergeImportedResume(current, imported)` → `setResume` in the canonical
  store (`src/store/resume-builder.ts`), persisted to localStorage
  (`patorbit-resume-v2`)
- The Apply step preserves the user's real resume content and **templateId**
  unless the import explicitly carries a real template ID; gallery sample data
  is never written into the real resume.

### 13.1 Import vs. Verification

Resume Import should eventually preserve provenance where appropriate.
Imported information should **not** automatically become "verified." The
import pipeline and verification pipeline are **related but distinct**.

---

## 14. Template Gallery / A4 Architecture (current implementation)

Preserved architectural decision — this section is **CURRENT, implemented**:

```
A4 geometry (src/lib/resume-design-system/geometry.ts — 794×1123px, 210×297mm)
    ↓
Canonical page frame (src/lib/resume-design-system/page-frame.ts)
    ↓
Template content (29 templates, untouched)
    ↓
PaginatedResumeSheet (src/components/resume/PaginatedResumeSheet.tsx)
    ↓
Gallery · Professional Preview · PDF export
```

- **Canonical A4 geometry** is the single source of truth — one A4 size
  definition shared by screen and print.
- **Real DOM pagination** (`PaginatedResumeSheet`) — content is distributed
  across real A4 pages; page navigation shows the actual number of rendered
  pages; top/bottom safe space is consistent per page; no content is clipped
  or hidden by overflow tricks.
- **Gallery** (`TemplateGallery`, `FullTemplatePreview`) uses the same
  paginator as the Professional Preview.
- **PDF export** renders the same paginated DOM through the browser print
  path (`@page { size: A4; margin: 0 }`, `#pdf-export-target` 210mm × 297mm).
- **Templates remain untouched** — no per-template pagination hacks.

Template pagination is a **presentation-layer** concern and is intentionally
kept separate from the future Identity/Claims/Evidence architecture.

---

## 15. Current vs. Future

### 15.1 CURRENT / IMPLEMENTED

- Resume Builder (29 templates — 8 flagship)
- Template Gallery (visual grid, real template rendering, category sections)
- Full-template preview (multi-page, page navigation, 50–150% zoom,
  "Use This Template")
- A4 page-frame / pagination architecture (`geometry.ts`, `page-frame.ts`,
  `PaginatedResumeSheet.tsx`)
- Gallery ↔ Professional Preview ↔ PDF parity
- Resume import pipeline (PDF/DOCX/JSON, regex + AI paths)
- Import review flow (review → one Apply action)
- Canonical resume state + persistence (`patorbit-resume-v2` localStorage,
  multi-resume shape)
- Resume customization (`ResumeStyleConfig` — fonts, colors, headings,
  bullets, density, spacing, page margins)
- Claims Review (suggested → accept/edit/reject; builder-scoped)
- Evidence records (upload/link, validation, IndexedDB storage, badge
  derivation; builder-scoped)
- Trust Score backend pipeline (services, graph, coordinator, subscriber)
- Professional Passport surface + share control (wiring partial)
- **First-class Claim server entity** (ADR-002 Phase 2) — `Claim` table under
  ProfessionalIdentity with repository, service, and API
- **Evidence → Claim FK enforcement** (ADR-002 Phase 2) — `EvidenceRecord.claimId`
  is nullable FK with `ON DELETE SET NULL`
- **VerificationEvent audit trail** (ADR-002 Phase 3) — append-only verification
  history with controlled status transitions and ownership enforcement

### 15.2 PROPOSED / FUTURE

- Trust server-side derivation — ✅ **COMPLETE** (ADR-002 Phase 4)
- Conflict Detection Engine — ✅ **COMPLETE** (ADR-002 Phase 5)
- Professional Passport — ✅ **COMPLETE** (ADR-002 Phase 6)
- Cryptographically verifiable credentials
- Trusted issuer network (employer, university, certification, professional
  organization integrations)
- Credential revocation / status infrastructure
- Scalable Patorbit API / Core Platform service separation
- Shareable verified professional identity / Passport with selective
  disclosure

> Items in 15.2 are agreed product direction, not shipping functionality.

---

## 16. Roadmap (proposed phases)

The implementation sequence for the identity/trust direction. Phase 1 is
largely what the current repository already covers; Phases 2–6 are future.

### PHASE 1 — Stabilize the Resume Builder (current)

- Template Gallery
- A4 pagination
- Preview / PDF parity
- Import reliability
- Resume editing

> Do not over-engineer Phase 1 with future infrastructure unless needed.

### PHASE 2 — Evidence + Provenance foundation (✅ COMPLETE)

- ✅ Evidence records (first-class server entity)
- ✅ Evidence storage (secure backend)
- ✅ Claim ↔ Evidence relationships (enforceable FK)
- ✅ Ownership enforcement
- hashes / fingerprints — 🔶 FUTURE
- provenance — 🔶 FUTURE

### PHASE 3 — Verification history / audit trail (✅ COMPLETE)

- ✅ VerificationEvent model (append-only)
- ✅ Status transition control
- ✅ Audit trail with ownership enforcement
- document checks (L1) — 🔶 FUTURE
- corroboration (L2) — 🔶 FUTURE
- identity binding — 🔶 FUTURE
- conflict detection — 🔶 FUTURE

### PHASE 4 — Trust Server-Side Derivation (✅ COMPLETE → Trust v2)

- ✅ Trust v1: Pure derivation algorithm (`src/lib/trust/derivation.ts`)
- ✅ Trust v2: Per-claim Trust with evidence strength, verification, conflicts (`src/lib/trust/v2/derivation.ts`)
- ✅ `GET /api/trust` returns Trust v2 (`algorithmVersion: "v2"`)
- ✅ TrustView + TrustWidget migrated to v2 (per-claim breakdown, supporting/reducing factors)
- ✅ Share flow derives Trust v2 server-side
- ✅ Passport projection accepts Trust v2 reports
- ✅ Deterministic, auditable, explainable Trust from canonical data
- ✅ v2 constants from approved Phase 9A Product Decision Matrix

### PHASE 5 — Conflict Detection Engine (✅ COMPLETE)

- ✅ ConflictRecord model
- ✅ Pure detection algorithm (overlapping dates, contradictory employers, duplicate credentials, etc.)
- ✅ API routes for detection and management
- ✅ User-driven resolution (reviewing, dismissed, resolved)
- ✅ Ownership enforcement

### PHASE 6 — Professional Passport (✅ COMPLETE)

- ✅ Pure projection function (`src/lib/passport/projection.ts`)
- ✅ Server-derived Passport from Claims + Evidence + Verification + Conflicts + Trust
- ✅ Public share endpoint derives from canonical data (no client-submitted data)
- ✅ Privacy: email, phone, address never exposed; raw evidence never exposed
- ✅ Trust integration with algorithm version
- ✅ Conflict summary (neutral, never accusatory)
- ✅ Schema versioning

### PHASE 7 — Issuer Network (future)

- employer issuer integrations
- university issuer integrations
- certification issuers
- digitally signed credentials
- credential status / revocation

### PHASE 8 — Patorbit Platform (future)

- scalable API
- service / domain separation
- external integrations
- employer / ATS integrations
- third-party verification ecosystem

---

## 17. Document Quality

- **Last Updated:** 2026-09-07
- **Architecture Status:** see §1
- **Current vs Future:** see §15
- **Canonical source of truth:** `docs/adr/ADR-001-CANONICAL-SOURCE-OF-TRUTH.md`
  (accepted — PostgreSQL/Patorbit Core is authoritative; client state is cache;
  domain-by-domain migration; no parallel identity stores)
- **Professional Identity domain model:** `docs/adr/ADR-002-PROFESSIONAL-IDENTITY-DOMAIN-MODEL.md`
  (accepted — ProfessionalIdentity is the root identity domain owning Resumes
  1:N and Claims 1:N; Evidence belongs to Claims; Trust/Knowledge Graph/Passport
  are derived projections; claims are de-nested from Resume; no parallel identity
  stores)
- **Resume server persistence:** `docs/adr/ADR-003-RESUME-SERVER-PERSISTENCE.md`
  (accepted — Phase-0 server foundation: `Resume` table under ProfessionalIdentity
  with hybrid relational metadata + validated JSON payload; stable `resumeId`;
  session-derived ownership; idempotent create; transitional claims/styleConfigs
  preservation; NOT yet connected to Zustand — localStorage stays authoritative
  from the UI perspective)
- **Resume server read parity:** `docs/adr/ADR-004-RESUME-SERVER-READ-PARITY.md`
  (accepted — Phase-1A read-only awareness: authenticated builder fetches the
  server snapshot and classifies each resume IDENTICAL / DIFFERENT / LOCAL_ONLY /
  SERVER_ONLY via a shared canonical payload normalization; never uploads,
  never adds server-only resumes to the UI, never overwrites; fail-closed;
  `NEXT_PUBLIC_RESUME_SERVER_SYNC` flag; no authority change)
- **Safe local resume migration:** `docs/adr/ADR-005-RESUME-LOCAL-MIGRATION.md`
  (accepted — Phase-1B explicit migration: only LOCAL_ONLY resumes uploaded;
  idempotent, verifiable, non-destructive; local data preserved; conflicts surfaced;
  UI trigger required; `NEXT_PUBLIC_RESUME_SERVER_SYNC` flag; no authority change)
- **Related canonical docs:** `patorbit-docs/04_ADR/ADR-003`,
  `ADR-006`, `patorbit-docs/03_SRS/Patorbit-Professional-Identity-Platform-Specification.md`

---

## 18. Revision History

| Version | Date | Summary |
|---|---|---|
| 1.0.0 | 2026-08-16 | Initial master architecture document — current-vs-future direction, product principles, claim/evidence/verification/conflict/trust models, platform architecture, resume import, A4 pagination, roadmap. |
| 1.1.0 | 2026-09-07 | Updated architecture status to reflect ADR-002 Phase 2 (Claim server entity, Evidence FK enforcement) and Phase 3 (VerificationEvent audit trail). Updated Current vs Future sections. |
| 1.2.0 | 2026-09-07 | Updated to reflect ADR-002 Phase 4 — Trust Server-Side Derivation. `GET /api/trust` now derives Trust from canonical Claims + Evidence + VerificationEvents. Client TrustService deprecated as authoritative source. Share flow security fixed. |
| 1.3.0 | 2026-09-07 | Updated to reflect ADR-002 Phase 5 — Conflict Detection Engine. `ConflictRecord` model + pure detection algorithm. Detects overlapping dates, contradictory employers, duplicate credentials, status mismatches. Conflicts surfaced for user review, never silently resolved. |
| 1.4.0 | 2026-09-07 | Updated to reflect ADR-002 Phase 6 — Professional Passport server-side projection. `buildPassport()` derives from canonical Claims + Evidence + Verification + Conflicts + Trust. Public share now derives server-side; client-submitted `passportData` no longer accepted. Security fix: eliminated client-supplied Passport data injection. |
| 1.5.0 | 2026-09-07 | Updated to reflect ADR-002 Phase 8 — Security & Canonical Integrity Fixes. Single canonical Trust input loader (`canonical-loader.ts`) eliminates cross-user unclaimed evidence leak (P1-1) and ensures Trust/Share/Passport parity (P1-2). Claim verification lifecycle transitions now require VerificationEvent service (P2-1). VerificationEvent validates evidenceRecordId ownership (P2-2). Passport share tokens rotate on re-enable (P2-3). |
| 1.6.0 | 2026-09-07 | Updated to reflect ADR-002 Phase 9B — Trust v2. Per-claim Trust scoring with evidence strength (4 levels), verification strength, conflict integration, status caps, and evidence diversity. Two-layer model: ClaimTrust → Professional Trust via simple average. Explainable TrustReport with per-claim breakdown, supporting/reducing factors. `algorithmVersion: "v2"`. No schema changes required. |
