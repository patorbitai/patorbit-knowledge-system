# Phase 10 — Architecture & Product Readiness Audit

**Date:** 2026-09-07
**Repository:** patorbitai/patorbit-knowledge-system
**Branch:** main
**Commit:** 2a3e4c3 (latest), 99c752a (Phase 9B Trust v2)
**Status:** READ-ONLY AUDIT — no production changes

---

## 1. Executive Summary

Patorbit's canonical identity/trust architecture is **structurally complete** through Phase 9B. The chain `ProfessionalIdentity → Claims → Evidence → VerificationEvents → Conflicts → Trust v2 → Passport → Public Share` is implemented, server-authoritative, and tested.

However, the product has a **critical architectural gap**: the Resume domain (the primary user-facing data) and the Claim domain (the canonical identity) are **not synchronized**. Users edit resumes, but claims must be created separately. This disconnect means the Trust system, while architecturally correct, has limited real-world data to work with.

**Key findings:**
- **0 P0 findings** (no critical security/data integrity issues)
- **2 P1 findings** (Resume↔Claim disconnect; stale passport cache in public API)
- **5 P2 findings** (legacy routes, dual evidence sources, missing rate limits, etc.)
- **6 P3 findings** (technical debt, documentation, cleanup)

**Recommended Phase 10:** Resume ↔ Claim Synchronization — the bridge that makes the Trust system actually useful.

---

## 2. Current Architecture

### Canonical Chain (Verified)

```
Authenticated User
       ↓
ProfessionalIdentity (PostgreSQL, 1:1 with User)
       ↓
Resume[] (PostgreSQL, JSONB payload, client Zustand still authoritative for builder)
       ↓
Claim[] (PostgreSQL, 1:N with PI, server-authoritative)
       ↓
EvidenceRecord[] (PostgreSQL, nullable FK to Claim, userId-scoped)
       ↓
VerificationEvent[] (PostgreSQL, append-only, claim-scoped)
       ↓
ConflictRecord[] (PostgreSQL, PI-scoped, pure detection algorithm)
       ↓
Trust v2 (Server-derived, no persisted entity, canonical-loader.ts)
       ↓
Professional Passport (Pure projection, cached in passportDataCache)
       ↓
Public Share (UUID token, server-derived on enable, cached snapshot)
```

### What Is Canonical

| Domain | Canonical Source | Client Editable? | Server Authoritative? | Derived? |
|--------|-----------------|-------------------|----------------------|----------|
| ProfessionalIdentity | PostgreSQL | No (server-created) | Yes | No |
| Resume | PostgreSQL + Zustand (dual) | Yes (Zustand) | Partially | No |
| Claim | PostgreSQL | Yes (API) | Yes | No |
| Evidence | PostgreSQL | Yes (API) | Yes | No |
| Verification | PostgreSQL | No (append-only) | Yes | No |
| Conflict | PostgreSQL | No (detection only) | Yes | No |
| Trust | Derived from canonical | No | Yes | Yes |
| Passport | Derived from canonical | No | Yes | Yes |

### What Still Bypasses Canonical Architecture

1. **Resume builder uses Zustand as primary source** — The Resume table exists but the builder still reads/writes from localStorage. Server persistence is a backup, not the authority.
2. **Resume ↔ Claim disconnect** — Resume edits do NOT create or update Claims. The two domains are independent.
3. **Evidence also exists in Zustand** — Builder-scoped evidence in `resume-builder.ts` coexists with server EvidenceRecords.

---

## 3. Canonical Source-of-Truth Matrix

| Domain | Source of Truth | Duplicated? | Stale Risk | Inconsistency Risk |
|--------|----------------|-------------|------------|-------------------|
| ProfessionalIdentity | PostgreSQL | No | Low | Low |
| Resume | Zustand (client) + PostgreSQL (server backup) | Yes (dual) | Medium | **HIGH** — client and server can diverge |
| Claim | PostgreSQL | No | Low | Low |
| Evidence | PostgreSQL + Zustand (builder) | Yes (dual) | Medium | Medium — builder evidence ≠ server evidence |
| Verification | PostgreSQL | No | Low | Low |
| Conflict | PostgreSQL | No | Low | Low |
| Trust | Derived (no storage) | No | None | None — always fresh |
| Passport | Derived + cached snapshot | Yes (cache) | Medium | Medium — public API reads cache, page derives fresh |

---

## 4. Security Audit

### Authentication

- ✅ All API routes require `getServerSession(authOptions)` except public passport share
- ✅ JWT strategy with 7-day max age
- ✅ OAuth account linking has security guards (no auto-link to password accounts)
- ✅ Email verification required before login

### Authorization / Ownership Chain

- ✅ `User → ProfessionalIdentity` resolved from `session.user.id` (never from client)
- ✅ `PI → Claim` enforced via `professionalIdentityId` in all Claim operations
- ✅ `Claim → Evidence` enforced: POST validates `claimService.getById(claimId, identity.id)`
- ✅ `Claim → VerificationEvent` enforced: ownership check via PI chain
- ✅ `PI → Conflict` enforced: all conflict operations scoped to PI
- ✅ Trust derivation uses `canonical-loader.ts` which resolves PI from `userId`
- ✅ Passport share uses UUID tokens (unpredictable, not enumerable)

### Client Forgery Resistance

- ✅ `trustScore` / `trustLevel` — never accepted from client (server-derived)
- ✅ `verificationStatus` — blocked in Claim PATCH (Phase 8 P2-1 fix)
- ✅ `passportData` — ignored in passport share POST (Phase 8)
- ✅ `conflictSeverity` — never set by client (pure detection algorithm)
- ✅ Evidence `confidence` — hardcoded server-side (0.7/0.8/0.9 based on type)

### IDOR Protection

- ✅ Claim GET/PATCH/DELETE: ownership verified via PI chain
- ✅ Evidence GET: ownership check (`record.userId === session.user.id`)
- ✅ Evidence DELETE: ownership check
- ✅ Conflict GET/PATCH/DELETE: ownership verified via PI chain
- ✅ Passport share: UUID token lookup (no enumerable IDs)
- ✅ All "not found" errors return 404 (not 403) to prevent existence leakage

---

## 5. Trust v2 Audit

### Canonical Loader

- ✅ Single entry point: `deriveTrustForUserV2(userId)` in `canonical-loader.ts`
- ✅ Resolves PI from `userId` (never trusts client)
- ✅ Loads Claims, Evidence, VerificationEvents, Conflicts all scoped to PI
- ✅ Unclaimed evidence scoped to `userId` (P1-1 fix from Phase 8)
- ✅ Both `GET /api/trust` and Trust Share use the same loader (P1-2 parity)

### Algorithm

- ✅ Pure deterministic function: `deriveTrustV2(input)` in `v2/derivation.ts`
- ✅ `algorithmVersion: "v2"` in output
- ✅ Evidence support: diminishing returns, diversity multiplier, cap at 70
- ✅ Verification strength: based on current Claim status (not historical events)
- ✅ Conflict penalties: info=-3, warning=-10, critical=cap 60
- ✅ Status caps: revoked=20, disputed=30, expired=40
- ✅ Double-counting protection: most restrictive constraint wins
- ✅ Highest-tier gate: requires no revoked/disputed, ≥1 verified, no critical conflicts
- ✅ Insufficient data flag for < 3 claims

### Trust Consumers

- ✅ `GET /api/trust` — returns v2
- ✅ `TrustView` — renders v2 per-claim breakdown
- ✅ `TrustWidget` — displays v2 score
- ✅ Trust Share — derives v2 server-side
- ✅ Passport projection — consumes v2 via structural typing
- ✅ No legacy Trust v1 code on authoritative path

---

## 6. Claims Lifecycle Audit

### Status Transition Map

```
suggested → accepted → evidence-added → under-review → verified
                                                  ↓ rejected
                                                  ↓ disputed
verified → expired | revoked | disputed
rejected → under-review | disputed
disputed → under-review | verified | rejected
expired → under-review
revoked → under-review
```

### Enforcement

- ✅ Claim PATCH blocks all verification lifecycle statuses (Phase 8 P2-1)
- ✅ Only `suggested` and `accepted` allowed through normal PATCH
- ✅ All lifecycle transitions require `POST /api/claims/[claimId]/verification`
- ✅ `VerificationEventService` validates transition rules
- ✅ Events are append-only (no update/delete in repository)
- ✅ Claim.verificationStatus updated as projection of latest event

### Gaps

- ⚠️ No automated claim creation from resume data
- ⚠️ Claims are manually created via API or UI — no sync from resume edits

---

## 7. Evidence Audit

### Architecture

- ✅ `EvidenceRecord` is a first-class PostgreSQL entity
- ✅ Nullable FK to Claim (`ON DELETE SET NULL`)
- ✅ userId-scoped (ownership enforced)
- ✅ Evidence POST validates claimId belongs to authenticated user's PI
- ✅ Evidence DELETE checks ownership
- ✅ File storage via `evidenceStorageService` (server-side)

### Trust Contribution

- ✅ Evidence level classification: self-asserted → attached → reviewed → verified
- ✅ Evidence count with diminishing returns (cap at 70)
- ✅ Diversity multiplier (distinct evidenceKind)
- ✅ Review bonus (evidence_reviewed event with supports outcome)

### Gaps

- ⚠️ No file hashing/fingerprinting (integrity not provable)
- ⚠️ No evidence provenance chain (upload timestamp only)
- ⚠️ Evidence also exists in Zustand builder store (dual source)
- ⚠️ No evidence-level conflict detection (only claim-level)

---

## 8. Verification Audit

### Properties

- ✅ Append-only (no update/delete in repository)
- ✅ Immutable (events are never modified after creation)
- ✅ Claim-scoped (FK to Claim)
- ✅ Evidence-scoped (optional FK to EvidenceRecord)
- ✅ Ownership enforced via PI chain
- ✅ Status transitions validated (valid transition graph)
- ✅ Event type determines resulting status (not client input)

### Evidence Ownership Validation

- ✅ Phase 8 P2-2: `evidenceRecordId.claimId === input.claimId` enforced
- ✅ Cross-user evidence cannot be attached to another user's claim

---

## 9. Conflict Audit

### Properties

- ✅ Pure detection algorithm (deterministic, no side effects)
- ✅ PI-scoped (all conflicts belong to a ProfessionalIdentity)
- ✅ Deduplication on detection (existing unresolved conflicts checked)
- ✅ User-driven resolution (new → reviewing → dismissed/resolved)
- ✅ 8 conflict types detected (overlapping dates, contradictory employer, etc.)
- ✅ 3 severity levels (info, warning, critical)
- ✅ Trust v2 consumes active conflicts (new/reviewing only)

### Gaps

- ⚠️ No evidence-level conflict detection (only claim-level)
- ⚠️ No cross-identity conflict detection
- ⚠️ No automatic conflict resolution

---

## 10. Passport Audit

### Architecture

- ✅ Pure projection function (`buildPassport()`)
- ✅ Server-derived from Claims + Evidence + Verification + Conflicts + Trust
- ✅ Public share derives from canonical data (no client-submitted data)
- ✅ UUID token-based sharing (unpredictable)
- ✅ Token rotation on re-enable (Phase 8 P2-3)
- ✅ Privacy: email, phone, address never exposed; raw evidence never exposed

### Gaps

- ⚠️ Public API (`/api/passport/share/[token]`) reads from `passportDataCache` (stale snapshot)
- ⚠️ Public page (`/passport/share/[token]/page.tsx`) derives fresh data (correct)
- ⚠️ Legacy `/passport/[userId]` route still exists (backward compat)
- ⚠️ `passportDataCache` is write-only artifact (retained for snapshot semantics)

---

## 11. Resume Audit

### Current State

- ✅ Resume table exists in PostgreSQL (ADR-003)
- ✅ Hybrid model: relational metadata + JSONB payload
- ✅ Stable `resumeId` used by client
- ✅ ProfessionalIdentity owns Resumes (1:N)

### Architectural Problem

**Resume and Claims are not synchronized.**

The Resume is the primary user-facing data model. Users edit resumes in the builder. But Claims (the canonical identity assertions) are a separate domain that must be created/maintained independently.

This means:
1. A user can have a rich Resume with 10 years of experience but zero Claims
2. Trust Score will be 0 (no claims → no trust)
3. The Passport will be empty
4. The entire identity/trust pipeline has no data to work with

**This is the single biggest product gap.**

### Resume → Claim Sync (Not Implemented)

Currently missing:
- Resume edits do NOT automatically create Claims
- Resume experience entries do NOT become Employment Claims
- Resume education entries do NOT become Education Claims
- Resume skills do NOT become Skill Claims
- Resume certifications do NOT become Certification Claims

---

## 12. Client State Audit

### Zustand Stores

- `src/store/resume-builder.ts` — Primary resume builder store
  - Contains resume data, evidence array, claims array (builder-scoped)
  - Persisted to localStorage (`patorbit-resume-v2`)
  - **Authoritative for the builder UI** (server is backup)

### Legacy Code

- `src/services/graph-mapper.ts` — Maps resume to KnowledgeGraph (legacy)
- `src/services/ai-reasoning-service.ts` — Stub with TODOs
- `src/app/passport/[userId]/page.tsx` — Legacy passport route

### No Client Trust Calculations

- ✅ No `TrustService` on authoritative path
- ✅ No `GraphService` on authoritative path
- ✅ No client-side trust score calculations
- ✅ All Trust is server-derived

---

## 13. Database Audit

### Schema Summary

| Model | Purpose | Owner | Relations | Canonical? | Risks |
|-------|---------|-------|-----------|------------|-------|
| User | Auth | System | PI, Accounts, Sessions, EvidenceRecords | Yes | — |
| ProfessionalIdentity | Root identity | User | User, Resumes, Claims, Conflicts | Yes | — |
| Resume | Presentation | PI | PI, JSONB payload | Partially | Client Zustand still authoritative |
| Claim | Identity assertion | PI | PI, EvidenceRecords, VerificationEvents | Yes | No auto-sync from Resume |
| EvidenceRecord | Supporting artifact | User | User, Claim (nullable), VerificationEvents | Yes | Dual source (Zustand + DB) |
| VerificationEvent | Audit trail | Claim | Claim, EvidenceRecord (optional) | Yes | — |
| ConflictRecord | Inconsistency | PI | PI | Yes | — |
| JobApplication | Application tracking | PI | PI, ApplicationEvents | Yes | — |
| ApplicationEvent | Application history | Application | Application | Yes | — |
| CareerMemory | Derived insights | PI | PI | Derived | — |
| Subscription | Payment | User | User | Yes | — |

### Schema Risks

- ⚠️ `Resume.payload` is JSONB — no schema validation at DB level
- ⚠️ `ConflictRecord.claimIds` is `String[]` — no FK enforcement at DB level
- ⚠️ `EvidenceRecord.claimId` is nullable — orphaned evidence possible (by design)
- ⚠️ `passportDataCache` / `trustReportCache` are `String? @db.Text` — large serialized blobs

---

## 14. Privacy Audit

### Data Classification

| Data | Private | Auth-Only | Public (Passport) | Internal |
|------|---------|-----------|-------------------|----------|
| email | ✅ | ✅ | ❌ Never | — |
| phone | ✅ | ✅ | ❌ Never | — |
| address | ✅ | ✅ | ❌ Never | — |
| raw evidence | ✅ | ✅ | ❌ Never | — |
| sourceActivityId | ✅ | ✅ | ❌ Never | — |
| internal reasoning | ✅ | ✅ | ❌ Never | — |
| conflict details | ✅ | ✅ | ❌ Never (summary only) | — |
| Trust score | — | ✅ | ✅ (if shared) | — |
| Claims | — | ✅ | ✅ (if shared) | — |
| verificationStatus | — | ✅ | ✅ (if shared) | — |

### Exposure Risks

- ✅ Public passport page strips email, phone, address
- ✅ Public passport shows conflict summary counts only (not details)
- ✅ Public passport shows evidence counts only (not raw documents)
- ⚠️ Evidence GET route allows public access if `visibility === "public"` (intentional but should be documented)

---

## 15. Data Integrity Audit

### Identified Inconsistencies

| ID | Severity | Location | Problem | Impact |
|----|----------|----------|---------|--------|
| DI-1 | P1 | Resume ↔ Claim | Resume edits don't create/update Claims | Trust has no data; Passport empty |
| DI-2 | P1 | Passport public API | Reads from stale `passportDataCache` instead of fresh derivation | Public passport may show outdated Trust |
| DI-3 | P2 | Evidence dual source | Builder Zustand evidence ≠ server EvidenceRecords | Evidence counts may differ |
| DI-4 | P2 | Resume dual source | Builder Zustand resume ≠ server Resume | Resume data may diverge |
| DI-5 | P3 | Legacy passport route | `/passport/[userId]` renders from cache without token security | Backward compat risk |
| DI-6 | P3 | `trustReportCache` | Write-only artifact, never read by authoritative path | Dead code |

---

## 16. Testing Audit

### Current Coverage

| Area | Tests | Status |
|------|-------|--------|
| Trust v2 derivation | 69 | ✅ Comprehensive |
| Trust API | 5 | ✅ |
| Claim service | 17 | ✅ |
| Verification events | 15 | ✅ |
| Conflict service | 14 | ✅ |
| Passport projection | 15 | ✅ |
| Passport share | 5 | ✅ |
| Evidence API | 5 | ✅ |
| Phase 8 security | 14 | ✅ |
| Canonical loader | 8 | ✅ |
| Trust UI components | 10 | ✅ |
| **Total relevant** | **182** | **✅** |

### Missing Tests

- ⚠️ No Resume ↔ Claim sync tests (feature doesn't exist yet)
- ⚠️ No cross-user evidence isolation integration tests (unit tests cover logic)
- ⚠️ No public passport end-to-end tests
- ⚠️ No rate limiting tests
- ⚠️ No privacy leakage tests (server response audit)

---

## 17. Technical Debt

### Must Fix Before Phase 10

None — no P0 blockers.

### Should Fix During Phase 10

| ID | Item | Location | Risk |
|----|------|----------|------|
| TD-1 | Legacy `/passport/[userId]` route | `src/app/passport/[userId]/page.tsx` | Security (no token) |
| TD-2 | `graph-mapper.ts` legacy code | `src/services/graph-mapper.ts` | Dead code |
| TD-3 | `ai-reasoning-service.ts` stub | `src/services/ai-reasoning-service.ts` | TODO placeholders |
| TD-4 | `trustReportCache` write-only | Prisma schema | Dead field |

### Can Defer

| ID | Item | Risk |
|----|------|------|
| TD-5 | Legacy template components | Low — backward compat |
| TD-6 | Resume builder Zustand persistence | Medium — dual source |
| TD-7 | Evidence Zustand dual source | Medium — dual source |

### Safe Legacy

| ID | Item | Reason |
|----|------|--------|
| TD-8 | Legacy resume shape migration | Necessary for existing users |
| TD-9 | PDF.js legacy imports | Required by library |

---

## 18. Product Readiness

### What Can a User Currently Do?

1. Create account and Professional Identity
2. Build resumes with 32 templates
3. Import resumes (PDF/DOCX/JSON)
4. Tailor resumes to job descriptions (AI)
5. Export as PDF/DOCX
6. Create job applications
7. Track application lifecycle
8. Manually create Claims (via API)
9. Manually attach Evidence (via API)
10. Run conflict detection
11. View Trust Score (if Claims exist)
12. Share Passport publicly (if enabled)

### What Is the Canonical Value Proposition?

> "Build a verifiable professional identity from claims and evidence, preserve provenance and history, detect conflicts, and provide trustworthy professional information that users can selectively share."

### What Can Patorbit Prove?

- That specific Claims exist in the canonical database
- That specific EvidenceRecords are linked to Claims
- That VerificationEvents have been recorded
- That Conflicts have been detected
- That Trust is derived from canonical data (not client-forged)
- That the Passport is a projection of canonical state

### What Can Patorbit NOT Prove?

- That uploaded evidence is authentic
- That a Claim is true (only that it exists and has support)
- That an employer actually employed the person
- That a degree was actually earned
- That a certification is current

### What Makes the Trust Score Useful?

- It is server-derived from canonical data
- It cannot be forged by the client
- It considers evidence, verification, and conflicts
- It is explainable (per-claim breakdown)
- It distinguishes between "user-provided" and "evidence-backed"

### What Makes the Passport Useful?

- It is a server-derived projection (not client-controlled)
- It uses safe public wording (never claims "verified" for uploaded evidence)
- It can be shared via secure UUID tokens
- It shows the professional identity with appropriate trust context

### What Prevents Gaming?

- Server-side Trust derivation (client cannot set Trust score)
- Verification lifecycle enforcement (client cannot set "verified" status)
- Evidence ownership validation (cannot use another user's evidence)
- Conflict detection (inconsistencies are surfaced)
- Diminishing returns on evidence count (uploading 100 files doesn't help)

### What Would Make Another Person/Company Trust the Passport?

- Cryptographic evidence integrity (NOT YET IMPLEMENTED)
- Third-party verification (NOT YET IMPLEMENTED)
- Trusted issuer network (NOT YET IMPLEMENTED)
- Currently: Trust is based on user-provided data with server-enforced structure

### What Important Workflow Is Still Missing?

**Resume → Claim synchronization.** Without this, the Trust system has limited real-world data. Users build rich resumes but don't create Claims, so Trust Score stays at 0.

---

## 19. Trust Boundary / Verification Boundary

### User Assertion → Claim

- **Who controls it:** User (via API)
- **What is required:** Assertion text, claim type
- **What is proven:** The user asserted this fact
- **What Patorbit can say:** "This claim exists in the user's professional identity"

### Claim → Evidence

- **Who controls it:** User (via API)
- **What is required:** EvidenceRecord linked to Claim
- **What is proven:** The user provided supporting evidence
- **What Patorbit can say:** "This claim has supporting evidence attached"

### Evidence → Review

- **Who controls it:** User or system (via VerificationEvent)
- **What is required:** Evidence review event with outcome
- **What is proven:** Someone reviewed the evidence
- **What Patorbit can say:** "This evidence has been reviewed"

### Review → Verification

- **Who controls it:** User or system (via VerificationEvent)
- **What is required:** Verification event with valid transition
- **What is proven:** The verification lifecycle was followed
- **What Patorbit can say:** "This claim has gone through the verification process"

### Verification → Trust

- **Who controls it:** Server (derived)
- **What is required:** Canonical Claims + Evidence + VerificationEvents + Conflicts
- **What is proven:** The canonical data supports this Trust level
- **What Patorbit can say:** "The canonical evidence and verification history provide [level] support for this person's professional claims"

### Critical Distinction

```
Uploaded evidence ≠ Verified evidence
Evidence review ≠ Independent verification
User assertion ≠ Verified fact
Trust score ≠ Probability of truthfulness
Passport ≠ Verified credential
```

---

## 20. Architectural Gaps

### Gap 1: Resume ↔ Claim Synchronization (P1)

**Problem:** Resume edits don't create Claims. The Trust system has no data.

**Impact:** Trust Score is 0 for most users. Passport is empty. The entire identity/trust pipeline is architecturally complete but product-useless.

**Direction:** Implement automatic Claim creation from Resume sections (experience → Employment Claim, education → Education Claim, etc.).

### Gap 2: Evidence Provenance (P2)

**Problem:** No file hashing, no tamper detection, no integrity proof.

**Impact:** Evidence cannot be proven authentic. Trust is based on user-provided data structure, not evidence integrity.

**Direction:** Add file hash (SHA-256) on upload. Store hash in EvidenceRecord. Future: verify hash matches re-uploaded file.

### Gap 3: Verification Levels L0-L3 (P2)

**Problem:** Only L0 (user-provided) is implemented. No L1 (document integrity), L2 (corroboration), or L3 (issuer verification).

**Impact:** All evidence is "user-provided" quality. Trust cannot distinguish between self-asserted and independently verified.

**Direction:** Implement L1 (document integrity checks) as the next verification level.

### Gap 4: Public Trust Share (P2)

**Problem:** Trust Share route exists but no public URL renders the Trust report.

**Impact:** Users can enable Trust sharing but there's no public page to view it.

**Direction:** Create `/trust/share/[token]` public page.

### Gap 5: Career Intelligence Integration (P3)

**Problem:** M1-M5 Career Intelligence is implemented but not fully integrated with the Trust/Claim system.

**Impact:** Career Profile exists but doesn't feed into Claims. Qualification Match doesn't use Trust data.

**Direction:** Future integration milestone.

---

## 21. Prioritized Findings

### P0 — Critical Security/Data Integrity

None.

### P1 — Major Architecture/Product Blocker

| ID | Finding | Area | Impact |
|----|---------|------|--------|
| P1-1 | Resume ↔ Claim not synchronized | Architecture | Trust has no data; Passport empty; product gap |
| P1-2 | Public Passport API reads stale cache | Security/Correctness | Public passport may show outdated Trust |

### P2 — Important Improvement

| ID | Finding | Area | Impact |
|----|---------|------|--------|
| P2-1 | Evidence dual source (Zustand + DB) | Data Integrity | Evidence counts may differ between builder and Trust |
| P2-2 | No file hashing/provenance | Evidence | Evidence integrity not provable |
| P2-3 | Legacy `/passport/[userId]` route | Security | No token-based access control |
| P2-4 | No rate limiting on public passport endpoint | Security | Abuse potential |
| P2-5 | `trustReportCache` is write-only dead code | Technical Debt | Schema bloat |

### P3 — Nice-to-Have / Technical Debt

| ID | Finding | Area | Impact |
|----|---------|------|--------|
| P3-1 | `graph-mapper.ts` legacy code | Dead Code | Confusion |
| P3-2 | `ai-reasoning-service.ts` stub | Dead Code | TODO placeholders |
| P3-3 | Legacy template components | Technical Debt | Maintenance burden |
| P3-4 | Resume builder Zustand dual source | Architecture | Long-term migration needed |
| P3-5 | Documentation inconsistencies | Documentation | Outdated roadmap references |
| P3-6 | Missing privacy leakage tests | Testing | No automated privacy audit |

---

## 22. Phase 10 Candidate Options

| Option | Architectural Importance | Security Importance | User Value | Trust Value | Dependency Readiness | Implementation Risk |
|--------|------------------------|--------------------|-----------|------------|--------------------|--------------------|
| A. Resume ↔ Claim Sync | ★★★★★ | ★★ | ★★★★★ | ★★★★★ | ★★★★ | Medium |
| B. Evidence Provenance (hashing) | ★★★ | ★★★★ | ★★ | ★★★★ | ★★★★★ | Low |
| C. Verification Levels L1-L3 | ★★★★ | ★★★★★ | ★★★ | ★★★★★ | ★★★ | High |
| D. Public Trust Share page | ★★ | ★★ | ★★★★ | ★★★ | ★★★★★ | Low |
| E. Passport UX improvements | ★★ | ★ | ★★★★ | ★★ | ★★★★★ | Low |
| F. Rate limiting / abuse protection | ★★ | ★★★★ | ★ | ★ | ★★★★★ | Low |
| G. Legacy code cleanup | ★ | ★ | ★ | ★ | ★★★★★ | Low |

---

## 23. Recommended Phase 10

### **Resume ↔ Claim Synchronization**

**Why:** This is the single biggest product gap. The entire identity/trust architecture is complete but has no data because Resume edits don't create Claims. Without this, Trust Score stays at 0, Passport is empty, and the product's core value proposition ("verifiable professional identity") is inaccessible.

**What it unlocks:**
- Trust Score becomes meaningful (has Claims to derive from)
- Passport becomes useful (has professional identity to share)
- Evidence attachment flow becomes natural (evidence attached to Claims)
- Conflict detection becomes useful (Conflicts between Claims)
- The full canonical pipeline has data to work with

**What must happen first:**
- Design the Resume → Claim mapping rules
- Define which Resume fields become which Claim types
- Handle deduplication (don't create duplicate Claims)
- Handle updates (Resume edit → Claim update vs. new Claim)
- Preserve existing Claims (don't delete user-created Claims)

**What should NOT be built yet:**
- External verification providers
- AI-powered claim extraction
- Cryptographic evidence integrity
- Trusted issuer network
- Organization/employer verification

---

## 24. Dependencies

### Phase 10 (Resume ↔ Claim Sync) Dependencies

- ✅ Claim server entity (Phase 2) — COMPLETE
- ✅ Claim API (Phase 2) — COMPLETE
- ✅ Claim service with validation (Phase 8) — COMPLETE
- ✅ Resume server persistence (ADR-003) — COMPLETE
- ✅ ProfessionalIdentity ownership (Phase 2) — COMPLETE
- ✅ Conflict detection (Phase 5) — COMPLETE (will detect sync conflicts)
- ✅ Trust v2 (Phase 9B) — COMPLETE (will derive from synced Claims)

### Not Required

- No new Prisma models needed
- No new API endpoints needed (reuse existing Claim API)
- No new services needed (extend existing ClaimService)
- No new migrations needed (schema already supports Claims)

---

## 25. Explicitly Deferred Work

| Item | Deferred To | Reason |
|------|-------------|--------|
| AI claim extraction | Phase 11+ | Requires Gemini integration, cost implications |
| External verification | Phase 12+ | Requires issuer network architecture |
| Cryptographic evidence | Phase 11+ | Requires schema changes, hashing infrastructure |
| Rate limiting | Phase 10 (optional) | Can be added incrementally |
| Legacy code cleanup | Phase 10 (optional) | Non-blocking technical debt |
| SEO pages | Phase 11+ | Marketing milestone, not architecture |
| Analytics platform | Phase 11+ | Product milestone |

---

## 26. Final Verdict

The Patorbit canonical architecture is **structurally sound**. The identity/trust chain is complete, server-authoritative, tested, and secure. The main gap is product-level: Resume data doesn't flow into the Claim system, leaving Trust with no data.

**PHASE 10 STATUS: READY FOR DESIGN**

The recommended Phase 10 (Resume ↔ Claim Synchronization) has all dependencies met and can proceed to design without blocking issues.

---

# Phase 10 Architecture Audit Report

```
Repository: patorbitai/patorbit-knowledge-system
Commit: 2a3e4c3
Branch: main

Files inspected: 35+
Files changed: 0

Canonical architecture: PASS
Security: PASS
Claims: PASS
Evidence: PASS (with dual-source caveat)
Verification: PASS
Conflicts: PASS
Trust: PASS
Passport: PASS (with stale-cache caveat)
Resume: PARTIAL (dual source, no Claim sync)
Client state: PASS (no authoritative Trust on client)
Database: PASS (with schema notes)
Privacy: PASS
Data integrity: PARTIAL (Resume ↔ Claim gap)
Testing: PASS (182 relevant tests)
Technical debt: LOW
Product readiness: PARTIAL (Trust has no data without Claim sync)

P0 findings: 0
P1 findings: 2
P2 findings: 5
P3 findings: 6

Recommended Phase 10: Resume ↔ Claim Synchronization
Why: Single biggest product gap — Trust architecture is complete but has no data

Phase 10 dependencies: ALL MET

Implementation performed: NONE

Tests run: Existing test suites for verification
TypeScript: PASS (existing)

Documentation: This audit document

PHASE 10 STATUS: READY FOR DESIGN
```
