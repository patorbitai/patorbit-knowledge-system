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
| Professional Passport surface | ✅ **CURRENT — surface exists; data wiring partial** |
| First-class Claim/Identity domain model with provenance | 🔶 **FUTURE — proposed (PKS-SRS-PIP-1 Part 2)** |
| Verification levels L0–L3 | 🔶 **FUTURE — proposed** |
| Conflict Detection Engine | 🔶 **FUTURE — proposed** |
| Evidence History / Audit Ledger | 🔶 **FUTURE — proposed** |
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

## 5. Claim Model (proposed / future)

A **Claim** is an assertion about the user's professional identity. Examples:

- Worked at Google
- Held title Senior Software Engineer
- Graduated from University X
- Holds certification Y
- Completed project Z

**Status: FUTURE (first-class model).** A builder-scoped `Claim` type exists in
`src/types/resume.ts` and is used by the Claims Review flow today, but the
first-class, identity-centric Claim model from PKS-SRS-PIP-1 Part 2 is **not**
yet implemented as the canonical domain object.

A first-class Claim should eventually support concepts such as:

- `claimId`
- `identityId`
- `type`
- `subject`
- `predicate`
- `value`
- `validFrom`
- `validTo`
- `status`
- `confidence`
- `createdAt`
- `updatedAt`
- `provenance` / `history`

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

- Evidence records (uploaded file or link) exist in the builder store
  (`evidence: Evidence[]` in `src/store/resume-builder.ts`), persisted via
  Zustand `persist` (`partialize` includes `evidence`).
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

## 9. Conflict Engine (proposed / future)

Patorbit must **not** use "latest uploaded evidence wins."

Example:

- Evidence A: Google, 2019–2023
- Evidence B: XYZ Technologies, 2021–2025

The system should detect the **timeline overlap**. It must **not**
automatically accuse the user of fraud. Possible legitimate explanations:

- part-time employment
- consulting
- contracting
- concurrent roles
- subsidiary
- incorrect dates
- other legitimate circumstances

Therefore the system should surface:

> **CONFLICT / CLARIFICATION REQUIRED**

rather than silently choosing one claim.

Potential conflict types:

- overlapping employment
- contradictory dates
- contradictory employer
- contradictory job title
- duplicate credential
- education inconsistency
- location inconsistency
- changed historical information
- revoked credential
- suspicious evidence
- identity mismatch

---

## 10. Evidence History / Audit Ledger (proposed / future)

Historical evidence must be preserved.

Example:

- 2026: Google experience letter uploaded
- 2026: Evidence checked
- 2026: Credential verified
- 2028: User edits resume

The original evidence remains in the evidence history. Patorbit should be able
to answer: *"Why does Patorbit currently consider this claim verified?"*

This requires **provenance / history**. An immutable blockchain is **not**
required; the initial implementation can use normal secure backend storage plus
an audit/event history.

---

## 11. Trust Engine (current + future)

Trust should **not** simply be "how complete is the resume?".

### 11.1 Current implementation

- `src/services/trust-service.ts`, `graph-service.ts`, `graph-mapper.ts`
- `identity-pipeline-coordinator.ts` + `identity-pipeline-subscriber.ts`
  orchestrate a debounced refresh pipeline
- The store exposes `trustScore` / `trustReport` snapshots; UI wiring is
  partial (see §1 Architecture Status)

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

### 15.2 PROPOSED / FUTURE

- First-class Claim model with provenance/history (PKS-SRS-PIP-1 Part 2)
- First-class Professional Identity / Career Journey domain model
- Evidence Ledger (hashes/fingerprints, verification events, audit history)
- Advanced provenance
- Conflict Detection Engine
- Trust Engine with issuer/corroboration inputs + full explainability
- Cryptographically verifiable credentials
- Trusted issuer network (employer, university, certification, professional
  organization integrations)
- Credential revocation / status infrastructure
- Scalable Patorbit API / Core Platform service separation
- Shareable verified professional identity / Passport with selective
  disclosure

> Nothing in 15.2 is implemented today. These items are agreed product
> direction, not shipping functionality.

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

### PHASE 2 — Evidence + Provenance foundation (future)

- Evidence records (first-class)
- Evidence storage (secure backend)
- hashes / fingerprints
- provenance
- claim ↔ evidence relationships
- history

### PHASE 3 — Verification engine (future)

- document checks (L1)
- corroboration (L2)
- identity binding
- conflict detection
- verification states

### PHASE 4 — Professional Passport (future)

- verified claims
- evidence-backed profile
- explainable trust
- selective sharing

### PHASE 5 — Issuer Network (future)

- employer issuer integrations
- university issuer integrations
- certification issuers
- digitally signed credentials
- credential status / revocation

### PHASE 6 — Patorbit Platform (future)

- scalable API
- service / domain separation
- external integrations
- employer / ATS integrations
- third-party verification ecosystem

---

## 17. Document Quality

- **Last Updated:** 2026-08-16
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
