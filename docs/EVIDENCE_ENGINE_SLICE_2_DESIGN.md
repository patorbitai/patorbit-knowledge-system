# Evidence & Verification Foundation — Slice 2 Implementation Design

**Status:** Draft for approval — the implementation contract for **Slice 2 (Evidence & Verification Foundation)**.
**Related:** ADR-002 (Evidence Engine Beta path), ADR-003 (Identity-centric model), ADR-004 (Identity Hub), PKS-SRS-PIP-1 (v1.0), commit `26a4c7a` (Knowledge Graph refactor).
**Date:** 2026-08-03

> **How to read this doc.** Every requirement below is reconciled against the **frozen** architecture:
> the SRS domain types in `src/types/resume.ts` (§2.3 Claims, §2.4 Evidence) and the graph domain in
> `src/types/knowledge-graph.ts` (`ClaimNode`, `EvidenceNode`, `VerifierNode`, `SourceNode`) consumed by
> `TrustService`/`GraphService`. Anything marked **Beta extension** is a field the frozen type did not carry but
> this slice adds to satisfy the spec below — additive, never a rename or behavioral change to the frozen shape.

---

## 0. Decisions requiring your approval

These are the three genuine forks the design resolves. Everything else follows mechanically from the frozen types.

| # | Decision | Resolution chosen | Rationale |
|---|----------|-------------------|-----------|
| D1 | User's "Rejected" verification state vs. frozen statuses | **Map "Rejected" to the frozen `EvidenceStatus` `revoked`** (resume domain), presented in the UI as **"Rejected"**. No new domain status added. | `resume.ts` already ships `revoked`; `knowledge-graph.ts` ships `disputed`. Adding `rejected` would invent vocabulary. "Rejected" is the honest Beta reading of `revoked` (evidence refused at review). |
| D2 | Where evidence state lives | **Extend the existing `resume-builder` Zustand store** (claims already live there) with an `evidence` array + claim↔evidence wiring. No new store. | ADR-002 #2: "Persist claims + evidence in the resume store (local state)". Claims were added there in Slice 1; evidence must co-locate for a single persisted unit. |
| D3 | Full Hub route in scope? | **No.** Slice 2 wires evidence into the surfaces that exist (ClaimsReview + Preview's Passport tab). The ADR-004 top-level Hub **route + navigation** is a follow-up slice. | Slice 2 is scoped to the Evidence Engine. The Hub *organizes* the identity domain; building it is a navigation task, not an evidence task. Flagged so it isn't silently forgotten. |

---

## 1. Evidence Data Model

### 1.1 The reconciled model

The frozen `Evidence` interface (`src/types/resume.ts:199-209`) is extended. Field provenance is explicit:

| Field | Frozen? | Type | Description |
|-------|:------:|------|-------------|
| `id` | ✅ | `string` | Unique evidence id (`evd_<nano>`), generated in the store. |
| `claimId` | ✅ | `string` | Id of the accepted `Claim` this evidence supports. Enforced: evidence is created only against an `accepted` claim. |
| `evidenceType` | ✅ | `"file" \| "link" \| "document"` | **Transport kind** — how the evidence is carried. Frozen semantics preserved. Auto-derived from the user's chosen evidence kind (see §2 mapping) so the user never picks it directly. |
| `evidenceKind` | 🆕 Beta ext. | `EvidenceKind` (§2, 16-value union) | **Content kind** — the user-facing taxonomy the user asked for ("Experience Letter", "Degree", "GitHub Repository"…). This is the field the Add Evidence UI binds to. |
| `content` | ✅ | `string` | **Source.** File: an IndexedDB key (Beta, see §3.2). Link: the URL. (Frozen field `content` = "URL or file identifier".) |
| `format` | ✅ | `string` | **File/link metadata (part 1).** For files: mime/extension (`"application/pdf"`); for links: `"url"`. Used by the badge icon + graph `EvidenceNode.format` derivation. |
| `metadata` | 🆕 Beta ext. | `{ fileName?: string; fileSize?: number; mimeType?: string; linkTitle?: string; }` | **File/link metadata (part 2).** Display details only — no persistence of the blob here. |
| `uploadedBy` | 🆕 Beta ext. | `string` | Actor. Beta has no session id in the builder store, so `"self"` (honest placeholder until auth threads through). |
| `createdAt` | ✅ | `string` (ISO) | Creation timestamp. |
| `updatedAt` | 🆕 Beta ext. | `string` (ISO) | Last touch (status change, consent toggle, notes edit). Drives "last verified" in the badge tooltip. |
| `status` | ✅ | `EvidenceStatus` | **Verification status** (the field the spec calls `verificationStatus` — frozen name `status` kept). Extended in §4. Values map to `VerificationBadge` states. |
| `confidence` | 🆕 Beta ext. | `number` (0–1) | Per-evidence support strength. **Not user-editable in Beta** — derived: `0.9` for `document`, `0.8` for `file`, `0.7` for `link`, modulated by review outcome. Kept on the record so Trust can explain *why*. |
| `notes` | 🆕 Beta ext. | `string` | Optional user note ("Uploaded the offer letter PDF; HR email on file"). Surfaced in Passport's "supported by" tooltip. |
| `visibility` | 🆕 Beta ext. | `"public" \| "private"` (default `private`) | Who may see it on a shared Passport. Beta UI: toggle per evidence card. `public` is only meaningful once Passport sharing exists — stored now, surfaced later. |
| `consent` | 🆕 Beta ext. | `boolean` (default `false`) | **Explicit user consent** that this data may be used for verification/display. The Add Evidence submit is **blocked until true** — an unchecked consent checkbox prevents submission. Nothing about the evidence is claimable/displayable until `consent === true`. |

```ts
// src/types/resume.ts — extension (frozen fields untouched)
export interface Evidence {
  id: string;
  claimId: string;
  evidenceType: EvidenceType;          // "file" | "link" | "document"  (frozen)
  evidenceKind: EvidenceKind;          // NEW — Beta taxonomy (§2)
  content: string;                     // IndexedDB key (file) | URL (link)  (frozen)
  format: string;                      // mime / "url"  (frozen)
  metadata: {                          // NEW
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    linkTitle?: string;
  };
  uploadedBy: string;                  // NEW — "self" in Beta
  createdAt: string;                   // frozen
  updatedAt: string;                   // NEW
  status: EvidenceStatus;              // frozen name; semantics per §4
  confidence: number;                  // NEW — derived, not user-editable
  notes: string;                       // NEW
  visibility: "public" | "private";    // NEW
  consent: boolean;                    // NEW — required true to submit
}
```

`EvidenceStatus` is extended by one value: `"revoked"` (frozen) is now a **reachable** Beta state via the review simulation (§4), and `EvidenceStatus` gains **no new members** — the six frozen values (`none | evidence-added | under-review | verified | expired | revoked`) cover the entire pipeline. `EvidenceKind` is the only genuinely new type.

---

## 2. Supported Beta Evidence Types

`EvidenceKind` is a **closed 16-value union** — no free text, no future integrations. Each kind declares its transport (`evidenceType`), its graph `format` (§5/Trust), and which `ClaimType` it legitimately supports. The user picks a kind; transport is auto-derived, so the form asks for exactly one thing: the file or URL.

| Kind (user-facing) | Category | `evidenceType` (auto) | Graph `EvidenceNode.format` | Supports ClaimType(s) |
|--------------------|----------|----------------------|------------------------------|------------------------|
| Experience Letter | Employment | `document` | `document` | Employment |
| Offer Letter | Employment | `document` | `document` | Employment |
| Payslip | Employment | `document` | `document` | Employment |
| Company Email | Employment | `file` | `document` | Employment |
| Degree | Education | `document` | `document` | Education |
| Transcript | Education | `document` | `document` | Education |
| Student ID | Education | `file` | `document` | Education |
| GitHub Repository | Projects | `link` | `artifact` | Project, Skill |
| Live Demo | Projects | `link` | `artifact` | Project |
| Screenshots | Projects | `file` | `artifact` | Project |
| Demo Video | Projects | `file` | `artifact` | Project |
| Certificate | Skills | `document` | `document` | Skill, Certification |
| Assessment | Skills | `document` | `document` | Skill, Certification |
| Portfolio | Skills | `link` | `artifact` | Project, Contribution |
| Website | Portfolio | `link` | `link` | Project, Contribution |
| Behance | Portfolio | `link` | `artifact` | Project, Contribution |
| Dribbble | Portfolio | `link` | `artifact` | Project, Contribution |

**Not in Beta** (explicitly excluded, belong to V2): LinkedIn employment verification, registrar/credential-check integration, third-party verifiers, GitHub OAuth import, any automated source. The taxonomy stays exactly this 17-row table (16 kinds).

---

## 3. User Workflow

```
User accepts claim (ClaimsReview)                 ── Slice 1, done
        │
        ▼
User adds evidence  (Add Evidence modal)          ── Slice 2
        │
        ▼
Evidence stored (Zustand + IndexedDB for files)
        │
        ▼
Claim status: accepted → evidence-added → under-review
        │
        ▼
Trust recalculated (TrustService on evidence-aware graph)
        │
        ▼
Passport updated (real data, no more sample rows)
```

### 3.1 Step-by-step with all four UI states

**Step 1 — Accept claim** (exists). `acceptClaim` creates a `Claim` with `verificationStatus: "accepted"`, `evidence: []`.

**Step 2 — Add evidence.** The claim's `VerificationBadge` (state `no-evidence`) opens the **Add Evidence modal**:
- Kind picker (17-row taxonomy from §2, grouped by category).
- Entry widget switches on `evidenceType`: link → URL input with inline validation + auto-title fetch (title optional); file → dropzone.
- Consent checkbox — **mandatory**; disabled submit until checked.
- Notes textarea (optional).

**Loading states:**
- Modal opens instantly (state-local). Kind selection never blocks.
- Link entry: `linkValidating` spinner on the URL field; failure is non-blocking (title optional).
- File entry: per-file `uploading` progress on the dropzone; file is written to IndexedDB *before* the submit button enables.
- Submit: `saving` on the modal footer; store write + status recompute; closes on success only.

**Empty states:**
- Claim detail: zero evidence → centered empty card: icon + "No evidence yet" + "Add the first document to start building trust on this claim" + **Add Evidence** button. (Nothing pretends a claim is stronger than it is.)
- Passport: zero accepted claims → full empty state, no sample rows (ADR-002 #4/#5).

**Error states:**
- File too large (IndexedDB quota / > ~20MB): inline error, no silent truncation.
- IndexedDB write failure: modal stays open, evidence NOT created, error toast. The in-memory record and the blob are written as one unit — on blob failure the record is rolled back.
- Link validation failure (only for `link` kinds): inline error; **links without a URL cannot be submitted**.
- Consent unchecked: submit disabled + helper text ("You must agree to let Patorbit use this document for verification").

**Success states:**
- Toast "Evidence added — claim now pending review".
- The claim's badge re-renders to `evidence-added`/`under-review`; the evidence card list updates.
- Trust panel recomputes; the Passport tab reflects the change when visited.

### 3.2 Beta persistence (honest answer)

- **Metadata + links**: in the Zustand `resume-builder` store (already persisted to `localStorage` as `patorbit-resume-v2`). Survives reload.
- **File blobs**: `localStorage` cannot hold blobs safely (5MB cap, no binary). Files go to **IndexedDB** (via `idb-keyval`, already-sized) keyed by `content = evd_<id>`. Metadata in the store references that key. On reload, the evidence card fetches the blob by key and renders a thumbnail/preview; a missing blob degrades to a metadata-only card with a clear "file unavailable" state — never a broken image.
- **No server**: `api/ai` is AI-only; evidence is fully client-side in Beta (DB-backed persistence is V2 per ADR-002).

### 3.3 Status transitions on the claim

```
accepted ──add evidence──▶ evidence-added ──(user marks ready)──▶ under-review
                                                                    │
                              ┌─────────────────────────────────────┘
                              ▼
              review simulation (admin/dev-only, §4)
              ├─ approve  → verified
              ├─ expire   → expired
              └─ reject   → revoked   (evidence-level)
                              │
                              └─ add new evidence → back to evidence-added
```

---

## 4. Verification States

Two layers: **claim-level** (`Claim.verificationStatus`, frozen union) and **evidence-level** (`Evidence.status`, frozen union). Beta state is driven by the evidence layer, projected up to the claim.

| Beta state | Evidence `status` | Claim `verificationStatus` | Behavior in Beta |
|-----------|-------------------|----------------------------|------------------|
| **No Evidence** | `none` (no records) | `accepted` | Default after accept. Badge shows `no-evidence`; claim contributes **no** verification weight (§6). CTA: add evidence. |
| **Evidence Added** | `evidence-added` | `evidence-added` | First evidence recorded. Badge `evidence-added`; claim now carries evidence weight. This is the honest "user has done their part" state. |
| **Pending Review** | `under-review` | `under-review` | User marks evidence "ready for review" (or Beta auto-flags when a document kind is present). Badge `under-review`. Trust treats it as pending verification. |
| **Verified (Future)** | `verified` | `verified` | **Not reachable by normal user action in Beta.** Reachable only via the documented **review simulation** (dev/admin control) to exercise the UI. Max trust contribution. Badge `verified`. |
| **Expired** | `expired` | `expired` | Time-sensitive kinds (Certificate with `expiryDate`) can be marked expired by the review simulation. Trust contribution nulled. Badge `expired`; CTA to renew. |
| **Rejected** | `revoked` (frozen) | `revoked` | A reviewer refused the evidence (review simulation). UI label **"Rejected"**. Evidence card shows reviewer-style note (`notes`). Claim drops back to needing evidence (its `evidence-added` weight is removed). Badge `rejected`. |

**Beta honesty rule:** no state labels anything "verified" unless it actually went through the review simulation. Marketing copy already soft-pedals this (ADR-002 trade-off); the UI must not overclaim.

---

## 5. Verification Badge

The badge is **never decorative** — every state is an interactive control with a defined icon, color, tooltip, and action. It is refactored from the current 4-state hardcoded version (`VerificationBadge.tsx`) to a derived model: a pure `deriveBadgeStatus(claim, evidence[]) → BadgeStatus` maps domain data → badge state, and the badge renders from a single config table.

| Badge state | Icon | Color | Tooltip | Action |
|------------|------|-------|---------|--------|
| `no-evidence` | `ShieldAlert` | Rose | "This claim has no evidence. Add a document to start building trust." | Opens **Add Evidence modal**. |
| `evidence-added` | `Shield` + amber dot | Amber | "Evidence added — pending review. (N documents)" | Opens **evidence list** for the claim. |
| `under-review` | `Shield` + clock | Blue | "Evidence submitted for review." | Opens evidence list + review progress hint. |
| `verified` | `ShieldCheck` | Emerald | "Verified [date] via review simulation." | Opens evidence list; shows verifier-style note. |
| `expired` | `ShieldOff` | Slate | "Supporting evidence has expired. Renew to keep this claim strong." | Opens Add Evidence (renewal path). |
| `rejected` | `ShieldX` | Rose (solid) | "Evidence was rejected. Review the note and add a new document." | Opens evidence list with the rejection note + Add Evidence. |
| `not-connected` | `ShieldOff` | Slate | (Source-account state, **V2** — retained in the union but unreachable in Beta.) | No-op in Beta; hidden. |

- The badge's `status` prop becomes a **derived value** — sections pass `deriveBadgeStatus(...)`, never a hardcoded `"pending"` (fixes ADR-002 finding #1).
- **Tooltip** = native `title` + an accessible `aria-label`; the **action** is always a clickable affordance.
- **Zero-evidence claims never render a "Verified" badge.** The config table makes this structurally impossible.

---

## 6. Trust Integration

`TrustService` already exists and is already evidence-aware at the component level (`scoreClaims` counts verified + evidence-supported claims). The Slice 2 gap is that **it is never fed a real graph** (ADR-002 finding #2) and **the graph has no claim/evidence nodes** (finding #3). Fix both; enhance the formula to honor evidence richness.

### 6.1 Wiring

1. **Graph-mapper** gains claim/evidence/verifier/source node creation (§7, Task 2): `resumeToGraph` emits `ClaimNode` (from accepted `Claim`s), `EvidenceNode` (from `Evidence`), `SourceNode` (`user-input` provenance), and — only in the review simulation — `VerifierNode`. Edges: `HAS_CLAIM` (profile→claim), `SUPPORTED_BY` (claim→evidence), `DERIVED_FROM` (evidence→source), `VERIFIED_BY` (evidence→verifier when verified).
2. A memoized client-side `buildTrustGraph(resume)` constructs `GraphService` → `TrustService` whenever the persisted store changes. `scoreClaims`, `getEvidenceCoverage`, `findWeakClaims` become live.

### 6.2 Evidence-aware scoring (the formula the UI explains)

Replace the current `scoreClaims` 50/50 split with an evidence-weighted formula so the user's three examples hold:

```
scoreClaims =  round(  (verifiedClaims/totalClaims)  * 40     // verified is king
                     + min(1, evidenceClaims/totalClaims) * 30  // coverage
                     + min(1, avgEvidencePerClaim / 2)   * 20   // richness: 2+ docs = full
                     + min(1, documentWeight / evidenceClaims)* 10 )  // strength
```

- **No evidence** → `0/30/20/10` terms → low confidence. ✅ matches "No evidence → low confidence".
- **One document** → coverage 30 + richness ~10 + strength 10 ≈ **medium**. ✅
- **Multiple supporting evidence** → richness 20 + strength 10 → **higher**. ✅

**Explainability is built in** — every claim contributes a `TrustScoreComponent` with `explanation` + `improvementTip` + `potentialGain` (types already exist). The Trust panel renders, per claim: "Trust score up because you added an **Offer Letter** (document)"; and for a weak claim: "This claim has no evidence. Adding a document is worth +N points." No unexplained number, ever.

### 6.3 Reference table (evidence → trust delta, Beta values)

| Evidence state | Per-claim trust effect |
|----------------|------------------------|
| `none` | 0 (claim contributes nothing to verification component) |
| 1 × link | coverage +30; richness ~10; strength 0 → low-medium |
| 1 × document | coverage +30; richness ~10; strength +10 → medium |
| 2+ documents | coverage +30; richness +20; strength +10 → higher |
| `verified` (simulated) | +40 term up to full 100 |
| `expired` / `revoked` | that evidence's terms drop to 0; claim reverts to needing evidence |

---

## 7. Passport Integration

The Passport tab (`preview/page.tsx`) is rebuilt from **real store data** — the current `PassportPreview` renders hardcoded "Verified Skills"/"Verified Credentials" sample rows, which ADR-002 finding #5 calls a Beta blocker. New rendering:

**Header strip** (three honest counts):
- **Verified** (green): claims with `status: "verified"` — count + list.
- **Supported** (amber): claims with evidence in `evidence-added`/`under-review` — count + per-claim evidence chips (kind + file/link icon + link-out).
- **Missing** (rose): accepted claims with no evidence — count + inline **Add Evidence** CTA per claim.

**Claim cards** (each accepted claim):
- `assertionText` + `claimType` + `VerificationBadge` (derived, §5).
- Expand → evidence list: kind label, format icon, notes, `visibility` toggle, `consent` status ("Shared with consent ✓ / consent required"), and a "last updated" stamp from `updatedAt`.
- **What is verified / supported / missing** is therefore literal: green = went through review simulation, amber = evidence attached but not verified, rose = still nothing. The Passport never claims otherwise.

**Share** (Beta): the `visibility`/`consent` fields are stored per evidence and shown, but no sharing surface ships in Slice 2 — the toggle is present and honest ("Visible on shared Passport" is grayed with an explainer) so nothing overclaims a capability that doesn't exist yet.

---

## 8. Implementation Plan

Ordered by dependency. Each task is independently shippable; T4–T8 all depend on T1–T3.

### Task 1 — Evidence domain model + taxonomy
- **Objective:** Add `EvidenceKind` (17-row §2 table), extend `Evidence` (frozen fields untouched), extend store types. No behavior.
- **Files:** `src/types/resume.ts` (extension), new `src/types/evidence-kinds.ts` (taxonomy table + `kindToTransport`/`kindToGraphFormat` pure helpers).
- **Dependencies:** None.
- **Acceptance criteria:** `EvidenceKind` is a closed 16-literal union; `Evidence` compiles with the §1.1 shape; helpers map every kind to transport+format (property-based test over all 16).
- **Risk:** Low — additive, no consumers yet.
- **Effort:** 0.5 day.

### Task 2 — Graph-mapper: claim/evidence/verifier/source nodes
- **Objective:** `resumeToGraph` emits claim/evidence/source nodes + `HAS_CLAIM`/`SUPPORTED_BY`/`DERIVED_FROM` edges; `graphToResume` round-trips them (removes hardcoded `claims: []`). Fixes ADR-002 finding #3.
- **Files:** `src/services/graph-mapper.ts`, `src/services/__tests__/graph-mapper.test.ts`, `src/services/__tests__/fixtures.ts` (claims/evidence fixtures).
- **Dependencies:** T1.
- **Acceptance criteria:** A resume with 2 accepted claims + 3 evidence maps to 2 `ClaimNode` + 3 `EvidenceNode` + 3 `SourceNode`; edges valid; round-trip preserves all; existing tests stay green.
- **Risk:** Medium — the mapper is the anti-corruption layer; must not perturb the resume↔graph round-trip the suite already locks.
- **Effort:** 1.5 days.

### Task 3 — Store: evidence actions + derived selectors
- **Objective:** `addEvidence`, `updateEvidence`, `removeEvidence`, `setEvidenceStatus`, `setEvidenceConsent`, `setEvidenceVisibility`, `markClaimReadyForReview`, and `deriveBadgeStatus`/`evidenceForClaim` selectors. Claim status projection (§3.3). Persist with the store.
- **Files:** `src/store/resume-builder.ts`.
- **Dependencies:** T1.
- **Acceptance criteria:** Adding evidence flips the claim `accepted → evidence-added`; removing last evidence reverts to `accepted`; `deriveBadgeStatus` covers all §5 states; state survives reload (IndexedDB keys referenced, not blob contents).
- **Risk:** Medium — store is central; the claim-status projection must be the single source of truth, not duplicated in components.
- **Effort:** 1.5 days.

### Task 4 — Add Evidence UI + IndexedDB file persistence
- **Objective:** The modal (§3.1): kind picker, link/file entry, consent gate, notes. File blobs → IndexedDB, metadata → store, rollback on blob failure.
- **Files:** new `src/components/identity/AddEvidenceModal.tsx`, `src/lib/evidence/storage.ts` (IndexedDB wrapper), `src/lib/evidence/validate.ts` (URL/kind/consent validation).
- **Dependencies:** T1, T3.
- **Acceptance criteria:** All four UI states (§3.1) behave as specified; submit blocked until consent; file over-quota shows inline error; reload renders file cards from IndexedDB with a graceful missing-blob state.
- **Risk:** Medium — IndexedDB quota + binary handling are the classic failure points.
- **Effort:** 2 days.

### Task 5 — Evidence list + claim detail surface
- **Objective:** Per-claim evidence panel (cards, add/replace/remove, notes, visibility, rejection note). Reachable from the claim's badge action and the Passport.
- **Files:** new `src/components/identity/EvidencePanel.tsx`, `src/components/identity/ClaimCard.tsx`; update `src/components/resume-builder/ClaimsReview.tsx` (post-accept affordance: accepted claims can now open evidence).
- **Dependencies:** T3, T4.
- **Acceptance criteria:** Empty/loading/error/success per §3.1; remove-last-evidence reverts claim status; rejection note renders on `revoked`.
- **Risk:** Low-Medium — UI assembly over settled state logic.
- **Effort:** 2 days.

### Task 6 — VerificationBadge v2
- **Objective:** 7-state derived badge (§5). `deriveBadgeStatus` consumed by all sections; no hardcoded `pending`. Fixes ADR-002 finding #1.
- **Files:** `src/components/resume-builder/fields/VerificationBadge.tsx`, `src/lib/evidence/badge.ts` (deriver + config table).
- **Dependencies:** T3.
- **Acceptance criteria:** Every state renders icon/color/tooltip/action; badge in Experience/Education/Projects/Certifications sections shows the claim's true derived state; `no-evidence` never shows verified.
- **Risk:** Low — pure mapping + presentational change.
- **Effort:** 1 day.

### Task 7 — Trust integration + explainability panel
- **Objective:** `buildTrustGraph(resume)` memoized; evidence-aware `scoreClaims` (§6.2); Trust panel showing per-claim `explanation`/`improvementTip`/`potentialGain`. Fixes ADR-002 finding #2.
- **Files:** `src/services/trust-service.ts` (scoreClaims v2), new `src/lib/evidence/trust.ts` (graph builder), new `src/components/identity/TrustPanel.tsx`.
- **Dependencies:** T2, T3.
- **Acceptance criteria:** Trust score changes when evidence added/removed per §6.3; every number on screen has an explanation string; existing trust tests updated, no regressions.
- **Risk:** Medium — scoring change is the one behavioral edit to a tested service; keep the old function under a test that pins the new formula.
- **Effort:** 2 days.

### Task 8 — Passport from real data
- **Objective:** Rebuild Passport tab (§7) from store claims/evidence; remove all sample rows (ADR-002 finding #5).
- **Files:** `src/app/resume-builder/preview/page.tsx` (PassportPreview replaced), new `src/components/identity/Passport.tsx`.
- **Dependencies:** T5, T6, T7.
- **Acceptance criteria:** Verified/Supported/Missing counts match store truth; claim cards expand to evidence; empty state renders when no claims; no hardcoded "alex@patorbit.ai" or sample data anywhere.
- **Risk:** Medium — replaces a currently-rendering (fake) component; needs the empty/hydration states right.
- **Effort:** 2 days.

### Task 9 — Tests + polish
- **Objective:** Store unit tests, badge-deriver tests (all 7 states), storage integration test (IndexedDB round-trip), trust formula property test, hydration/empty-state pass.
- **Files:** `src/store/__tests__/*`, `src/lib/evidence/__tests__/*`, `src/services/__tests__/trust-service.test.ts`.
- **Dependencies:** T3–T8.
- **Acceptance criteria:** `npm run test` green; badge/trust/store behaviors pinned; no console errors on hydration; each §3 state demonstrable in the running app.
- **Risk:** Low.
- **Effort:** 1.5 days.

**Total: ~14 days.**

---

## 9. Out of scope (explicitly not Slice 2)

- LinkedIn/GitHub/portfolio **account verification** integrations (ADR-002 finding #6 → V2).
- DB-backed evidence persistence, upload endpoints, object storage (ADR-002 → V2).
- Third-party verifiers, registrar checks, blockchain verification (V2).
- The ADR-004 top-level Hub route + navigation (follow-up slice, per D3).
- Passport sharing surface (fields stored; UI ships read-only).
