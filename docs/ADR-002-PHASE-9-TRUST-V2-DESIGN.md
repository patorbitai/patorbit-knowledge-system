# ADR-002 Phase 9 — Trust Algorithm v2: Design & Decision Report

**Document ID:** ADR-002-PHASE-9
**Status:** ✅ Design Complete — Ready for Implementation
**Date:** 2026-09-07
**Type:** Architecture Design & Decision
**Depends on:** ADR-002 Phases 1–8 (all complete)
**Scope:** Design only — no production code changes

---

## 1. Executive Summary

Trust v1 measures **profile completeness** — how much information the user has provided. Trust v2 redesigns Trust to measure what it should mean:

> **"How strongly Patorbit's canonical evidence and verification history support this person's professional claims."**

The key architectural change is a **two-layer model**: individual Claim Trust scores are computed first, then aggregated into an overall Professional Trust score. This enables per-claim explainability, conflict integration, and evidence-strength differentiation that v1 cannot support.

v2 requires **no schema changes**. It operates entirely on existing canonical data: Claims, EvidenceRecords, VerificationEvents, and ConflictRecords.

**Decision status:** All core architectural decisions are DECIDED. Numerical weights are marked as RECOMMENDED and require product confirmation before implementation.

---

## 2. Current Trust v1 Audit

### 2.1 Files Inspected

| File | Role |
|------|------|
| `src/lib/trust/derivation.ts` | Trust v1 algorithm (350 lines) |
| `src/lib/trust/types.ts` | Trust types and constants |
| `src/lib/trust/canonical-loader.ts` | Canonical data loader (Phase 8) |
| `src/lib/trust/__tests__/derivation.test.ts` | 18 derivation tests |
| `src/app/api/trust/route.ts` | `GET /api/trust` endpoint |
| `src/app/api/trust/share/route.ts` | Trust share enable/disable |
| `src/components/identity/TrustView.tsx` | Trust display UI |
| `src/components/hub/widgets/TrustWidget.tsx` | Dashboard widget |
| `src/lib/conflict/types.ts` | Conflict types |
| `src/lib/conflict/detection.ts` | Conflict detection algorithm |
| `src/services/claim.service.ts` | Claim CRUD |
| `src/services/verification-event.service.ts` | Verification lifecycle |
| `src/lib/passport/projection.ts` | Passport projection |

### 2.2 Current v1 Inputs

Trust v1 consumes a flat `TrustDerivationInput`:

```
claims: CanonicalClaimForTrust[]
evidence: CanonicalEvidenceForTrust[]
verificationEvents: CanonicalVerificationEventForTrust[]
```

Notably **absent**: ConflictRecords are not consumed by v1.

### 2.3 Current v1 Weights

| Component | Weight | What it measures |
|-----------|--------|------------------|
| Verification Strength | 35% | Ratio of `verified` claims vs total; penalty for `disputed`/`revoked` |
| Evidence Coverage | 25% | % of claims with at least one EvidenceRecord + density bonus |
| Claim Completeness | 20% | Acceptance ratio + average confidence (self-reported) |
| Evidence Diversity | 10% | Number of distinct `evidenceKind` values (max 4) |
| Review Activity | 10% | Verification events per claim ratio |

### 2.4 Current Status Semantics

| Status | Trust contribution | Treatment |
|--------|-------------------|-----------|
| `suggested` | neutral | No penalty, no benefit |
| `accepted` | neutral | No penalty, no benefit |
| `evidence-added` | neutral | No penalty, no benefit |
| `under-review` | neutral | No penalty, no benefit |
| `verified` | positive | Contributes to verification ratio (35% weight) |
| `expired` | excluded | Counted toward coverage but not verification |
| `revoked` | penalized | Reduces verification score |
| `disputed` | penalized | Reduces verification score |
| `rejected` | penalized | Reduces verification score |

### 2.5 Key v1 Weaknesses

1. **Flat structure** — no per-claim Trust scores, so no per-claim explainability
2. **Conflicts ignored** — conflicting claims don't reduce Trust
3. **Self-reported confidence counts** — `ClaimCompleteness` rewards high self-assessed confidence
4. **Evidence gaming** — uploading many files increases the `densityBonus` linearly with no diminishing returns
5. **No evidence strength differentiation** — a screenshot and an external verification event count the same
6. **Historical verification leaks** — a claim that was verified but later revoked may still benefit from historical events in the `ReviewActivity` component
7. **No hard gates** — a disputed claim with a critical conflict still contributes the same way as any other disputed claim

---

## 3. Trust Definition

### DECIDED

Patorbit Trust measures:

> **The strength of canonical evidence and verification history supporting a person's professional claims.**

Trust does **not** measure:
- Profile completeness
- Resume quality
- Employability
- Honesty
- Whether uploaded documents are authentic
- Whether the person is a good professional

Trust specifically measures: **How well-supported are the claims, given what Patorbit's canonical system knows?**

---

## 4. Claim-Level Trust Model

### DECIDED — Model B: Claim-Level Scoring

Trust v2 computes **per-Claim Trust**, then aggregates into overall Professional Trust.

```
ProfessionalIdentity
       ↓
Claim[] → ClaimTrust (per claim)
       ↓
Aggregate → Professional Trust
```

### Why Claim-level scoring is preferable

1. **Explainability**: The system can say "Your employment claim at Google scored 85 because..." rather than just "Your Trust is 74."
2. **Conflict integration**: Conflicts affect specific Claims, not an arbitrary global score.
3. **Actionable guidance**: "Your certification claim needs more evidence" is actionable; "your Trust is low" is not.
4. **Selective presentation**: Passport can present Trust per-claim, letting viewers assess each claim independently.
5. **Future extensibility**: External verification targets specific claims, not a global score.

### ClaimTrust Output

For each Claim:

```ts
interface ClaimTrust {
  claimId: string;
  score: number;          // 0–100
  confidence: number;     // 0–1 (how confident is the Trust derivation itself)
  factors: ClaimFactor[]; // explaining what contributed
  gateBlocked: boolean;   // whether a hard gate prevents full trust
  gateReason: string | null;
}
```

---

## 5. Evidence Strength Model

### DECIDED — Four Evidence Levels

| Level | Definition | Data Source | Trust Contribution |
|-------|-----------|-------------|-------------------|
| **Self-asserted** | Claim exists, no evidence attached | Claim.verificationStatus in {suggested, accepted} | Baseline only |
| **Evidence attached** | At least one EvidenceRecord linked to Claim | EvidenceRecord.count > 0 | Moderate positive |
| **Evidence reviewed** | A `evidence_reviewed` VerificationEvent exists with outcome `supports` | VerificationEvent.eventType = "evidence_reviewed" AND outcome = "supports" | Strong positive |
| **Independently verified** | Claim status is `verified` through the verification lifecycle | Claim.verificationStatus = "verified" | Strongest positive |

### Evidence does NOT equal verification

This principle is preserved. Evidence attached is weaker than evidence reviewed, which is weaker than independently verified.

### Evidence Strength Scoring

| Level | Contribution to Evidence Support (0–100) |
|-------|------------------------------------------|
| Self-asserted | 0 |
| Evidence attached | 40 |
| Evidence reviewed | 70 |
| Independently verified | 100 |

### Multiple Evidence Records

**DECIDED** — Diminishing returns with diversity bonus:

- First evidence record: full contribution (40)
- Second evidence record: +15
- Third evidence record: +8
- Fourth+: +3 each (capped at 60 total from evidence count alone)

**Diversity multiplier**: If evidence records have different `evidenceKind` values, multiply evidence support by:
- 1 kind: ×1.0
- 2 kinds: ×1.1
- 3+ kinds: ×1.2

This prevents gaming by uploading duplicate documents while rewarding genuinely diverse evidence.

### Duplicate Handling

**LIMITATION**: The current schema cannot determine whether two evidence records are the same document. Duplicate detection is deferred to a future phase (evidence fingerprinting/hashing). For now, the diminishing returns curve is the primary defense against evidence-count gaming.

---

## 6. Verification Model

### DECIDED — Current State Rules

The Trust algorithm uses **only the current Claim.verificationStatus** — not historical events — to determine verification strength.

Historical VerificationEvents are used for:
1. **Evidence review detection**: whether a `evidence_reviewed` event with `outcome: "supports"` exists
2. **Review activity signal**: whether the claim has been through the verification lifecycle

But the **current Claim status** is what determines whether a claim is treated as verified, disputed, revoked, etc.

### How revoked/expired claims are handled

A Claim that was verified but later revoked has:
- `verificationStatus = "revoked"` (current state)
- Historical events showing it was once verified

Trust v2 treats it as **revoked** (penalized). The historical "verified" event does NOT contribute positively because the current status overrides it.

### How disputed claims are handled

A disputed claim with a critical conflict:
- `verificationStatus = "disputed"`
- Active ConflictRecord of type `status_mismatch` with severity `critical`

Trust v2 treats this as the **lowest possible trust for that claim** (hard gate).

---

## 7. Conflict Integration

### DECIDED — Conflicts affect Claim Trust, not global Trust

Conflicts are mapped to specific Claims via `ConflictRecord.claimIds`. Each conflict affects the Trust of the Claims it involves.

### Conflict Treatment Matrix

| Conflict Type | Severity | Trust Effect | Rationale |
|---------------|----------|-------------|-----------|
| `overlapping_dates` | warning | Soft signal: −10 to affected claim(s) | Could be part-time work or data entry error |
| `contradictory_employer` | warning | Soft signal: −15 to affected claim(s) | Material inconsistency but possible legitimate explanation |
| `contradictory_title` | info | Soft signal: −5 to affected claim(s) | Could be promotion or role change |
| `contradictory_dates` | warning | Soft signal: −10 to affected claim(s) | Could be resume update |
| `duplicate_credential` | warning | Soft signal: −5 to affected claim(s) | Could be dual enrollment or error |
| `education_inconsistency` | info | Soft signal: −3 to affected claim(s) | Could be multiple degrees |
| `status_mismatch` | critical | **Hard gate**: claim cannot exceed 60 | Verified claim contradicts disputed claim — requires review |
| `location_inconsistency` | info | Soft signal: −2 to affected claim(s) | Could be remote work |

### Conflict Status Modifiers

| Conflict Status | Effect on Trust Impact |
|----------------|----------------------|
| `new` | Full impact applied |
| `reviewing` | Full impact applied (user is aware) |
| `dismissed` | No impact (user determined it was not a real conflict) |
| `resolved` | No impact (conflict was resolved) |

### Why conflicts affect Claim Trust rather than global Trust

If a conflict between two employment claims reduced the global score, it would penalize unrelated claims (education, skills, certifications). By affecting only the specific Claims involved, the Trust system remains accurate and explainable.

### Double-counting prevention

If a Claim is `disputed` AND has an active `status_mismatch` conflict, only the **stronger** signal applies:

- Disputed status penalty: Claim Trust cannot exceed 40
- Critical conflict gate: Claim Trust cannot exceed 60
- The disputed status penalty (40 cap) is stronger, so it applies

The algorithm uses `max(gate, penalty)` — the most restrictive constraint wins. This prevents a disputed claim from being penalized twice.

---

## 8. Double-Counting Protection

### DECIDED — Hierarchy of constraints

For each Claim, the algorithm applies constraints in this order:

1. **Hard gates** (strongest — can prevent a tier)
2. **Status penalties** (override soft signals)
3. **Conflict penalties** (applied unless already overridden by a stronger signal)
4. **Evidence support** (positive contribution)
5. **Diversity bonus** (additive)

At each step, the algorithm checks whether a previous constraint already imposed a stronger limit. This prevents:

- A disputed claim + conflict being double-penalized
- An expired claim + missing evidence being double-counted
- Revoked status + critical conflict applying both penalties

**Rule**: If a Claim's Trust is already capped at X by a status penalty, a conflict can only reduce it further if the conflict penalty is stronger than X. Otherwise, the conflict is noted but does not reduce the score below the status-imposed cap.

---

## 9. Multiple Evidence Records

### DECIDED — Diminishing returns + diversity bonus

| Evidence Count | Marginal Contribution |
|---------------|----------------------|
| 1st record | 40 points |
| 2nd record | +15 (total 55) |
| 3rd record | +8 (total 63) |
| 4th record | +3 (total 66) |
| 5th+ record | +1 each (cap at 70) |

**Diversity multiplier** (applied to the evidence support score):

| Distinct evidenceKind count | Multiplier |
|---------------------------|-----------|
| 1 | ×1.0 |
| 2 | ×1.1 |
| 3+ | ×1.2 |

**Cap**: Evidence support contribution to Claim Trust is capped at 70 (even with many diverse records). The remaining 30 must come from verification activity.

This ensures evidence attachment helps but cannot alone produce high Trust.

---

## 10. Claim Aggregation

### RECOMMENDED — Option A: Equal Claim Weight with Type Floor

**Option A — Equal Claim Weight** (RECOMMENDED):

```
Professional Trust = weighted average of all ClaimTrust scores
```

Each Claim contributes equally to the overall score. This is:
- Simple
- Explainable
- Fair (no implicit ranking of claim types)
- Resistant to gaming (cannot inflate by adding low-value claims)

**Option B — Claim-Type Weighting** (NOT RECOMMENDED for v2):

Assign different weights to Employment, Education, Skill, etc. This introduces:
- Subjective decisions about which types are "more important"
- Unfairness (a person with only skill claims would be penalized)
- Complexity without clear benefit

### Aggregation Formula

```
Professional Trust = (Σ ClaimTrust.score) / count(Claims)
```

If there are 0 Claims: Trust = 0 (Unrated).

### Claim Count Floor

**DECIDED**: A minimum of 3 Claims is recommended for a meaningful Trust score. With fewer than 3 Claims, the overall Trust is flagged as "Insufficient data" in the explanation, though a numerical score is still provided.

---

## 11. Trust Score Range

### DECIDED — 0–100 with semantic meaning

| Range | Level | Meaning |
|-------|-------|---------|
| 0 | Unrated | No claims or no data |
| 1–25 | Developing | Claims exist but lack evidence and verification |
| 26–50 | Supported | Claims have some evidence but limited verification |
| 51–75 | Strong | Claims have good evidence and active verification |
| 76–100 | Highly Supported | Claims are well-evidenced, verified, and conflict-free |

The score does **not** represent a probability or percentage. It represents the strength of canonical support under Trust Algorithm v2.

---

## 12. Trust Gates

### DECIDED — Hard gates for critical conditions

| Gate | Condition | Effect |
|------|-----------|--------|
| **Revoked gate** | Claim.verificationStatus = "revoked" | Claim Trust capped at 20 |
| **Disputed gate** | Claim.verificationStatus = "disputed" | Claim Trust capped at 30 |
| **Critical conflict gate** | Active `status_mismatch` conflict involving this Claim | Claim Trust capped at 60 |
| **Expired gate** | Claim.verificationStatus = "expired" | Claim Trust capped at 40 (but not penalized like revoked) |
| **Overall Excellent gate** | Any Claim has `disputed` or `revoked` status | Overall Professional Trust cannot reach "Highly Supported" (76+) |

### Why hard gates instead of just point deductions

A point deduction system could allow a revoked claim to still score 50+ if it has lots of evidence. That would be misleading — a revoked claim should never appear well-supported regardless of evidence. Hard gates ensure the Trust system makes definitive statements about critical conditions.

---

## 13. Recency

### DECIDED — Verification freshness matters; evidence age does not

| Factor | Affects Trust? | Rationale |
|--------|---------------|-----------|
| Evidence age | **No** | A 5-year-old degree doesn't become less trustworthy with age |
| Claim validity | **Yes** (via status) | Expired claims are handled by the expired gate |
| Verification freshness | **Yes** (soft signal) | Recent verification activity (events in last 180 days) provides a small bonus |

### Verification Freshness Bonus

Claims with a `verified` status AND a verification event in the last 180 days receive a +5 bonus to their Claim Trust (capped at 100).

Claims with `verified` status but no recent verification events receive no freshness bonus. They are still fully verified — they just don't get the freshness boost.

This is a **soft signal**, not a gate. Old verified claims still contribute fully to Trust.

---

## 14. Algorithm Versioning

### DECIDED

```ts
TRUST_ALGORITHM_VERSION = "v2";
```

Every `ServerTrustReport` includes the algorithm version. Same canonical inputs + same algorithm version → same Trust result.

Trust v2 replaces v1. There is no need to support both versions simultaneously because Trust is dynamically derived (no persisted Trust entity). The algorithm version changes, and all consumers immediately see the new result.

---

## 15. Explainability Model

### DECIDED — Per-claim factors + overall explanation

```ts
interface ServerTrustReportV2 {
  score: number;                    // 0–100
  level: TrustLevel;                // Unrated | Developing | Supported | Strong | Highly Supported
  algorithmVersion: "v2";
  derivedAt: string;                // ISO 8601
  
  // Per-claim breakdown
  claimTrusts: ClaimTrust[];
  
  // Overall explanation
  summary: TrustSummaryV2;
  
  // Human-readable reasons
  reasons: string[];
  
  // Supporting/reducing factors
  factors: TrustFactor[];
}

interface ClaimTrust {
  claimId: string;
  claimType: string;
  assertionText: string;            // for display
  score: number;                    // 0–100
  evidenceLevel: EvidenceLevel;     // self-asserted | attached | reviewed | verified
  evidenceCount: number;
  evidenceDiversity: number;        // distinct kinds
  verificationStatus: string;
  conflictCount: number;
  activeConflictCount: number;
  gateBlocked: boolean;
  gateReason: string | null;
  factors: ClaimFactor[];
}

interface ClaimFactor {
  type: "supporting" | "reducing" | "neutral";
  label: string;
  description: string;
  impact: number;                   // signed points
}

interface TrustFactor {
  type: "supporting" | "reducing" | "neutral";
  label: string;
  description: string;
}

interface TrustSummaryV2 {
  totalClaims: number;
  verifiedClaims: number;
  claimsWithEvidence: number;
  claimsWithoutEvidence: number;
  totalEvidence: number;
  totalVerificationEvents: number;
  activeConflicts: number;
  evidenceCoveragePercent: number;
  verificationRate: number;
}
```

### Explanation Generation

The explanation is derived from the same calculation — never generated separately. Each ClaimTrust includes factors that explain exactly what contributed to its score.

Example:

```
Overall Trust: 72 (Strong)

Supporting factors:
- 3 claims have verified status
- 5 claims have reviewed evidence
- 2 claims have diverse evidence types

Reducing factors:
- 1 employment claim has an active date conflict
- 1 certification claim is expired
- 2 claims lack any evidence

Claim breakdown:
- "Worked at Google 2021-2024": 85 (verified, 3 evidence records, diverse)
- "AWS Solutions Architect": 72 (evidence reviewed, 2 records)
- "Python proficiency": 55 (evidence attached, 1 record)
- "Contributed to React": 40 (accepted, no evidence)
- "PMP Certification": 35 (expired, evidence exists)
```

---

## 16. Gaming Analysis

### 16.1 Uploading many files

**v1 vulnerability**: `densityBonus = Math.min(20, evidenceCount * 2)` — linear growth.

**v2 defense**: Diminishing returns curve (40, +15, +8, +3, +1...) with cap at 70. Uploading 20 files produces nearly the same score as uploading 4.

### 16.2 Creating many claims

**v1 vulnerability**: More claims = more evidence coverage opportunities.

**v2 defense**: Equal-weight aggregation. Adding a weak claim with no evidence reduces the average. The claim count floor (3) means you need at least 3 meaningful claims.

### 16.3 Creating duplicate claims

**v1 vulnerability**: Duplicate claims each count separately.

**v2 defense**: Conflicts detect `duplicate_credential`. Duplicate claims reduce Trust via conflict penalties.

### 16.4 Repeatedly requesting verification

**v1 vulnerability**: `ReviewActivity` rewards event count per claim.

**v2 defense**: Review activity is a minor factor (5% weight). Repeated events on the same claim don't compound — only the current Claim status matters.

### 16.5 Adding weak evidence

**v2 defense**: Evidence support is capped at 70 regardless of quantity. Weak evidence (e.g., self-written notes) still counts as "evidence attached" but doesn't reach "evidence reviewed" without a `evidence_reviewed` event.

### 16.6 Creating fake conflicts

**v2 defense**: Conflicts are detected by the server-side pure algorithm from Claim text parsing. A user cannot fabricate a `ConflictRecord` directly — it must be detected by `detectConflicts()`.

### 16.7 Manipulating claim text

**v2 defense**: Claim assertions are parsed by the conflict detection algorithm. Changing claim text could avoid conflict detection, but would not increase Trust — it would just remove a conflict penalty. The evidence and verification signals remain unchanged.

### 16.8 Deleting and recreating claims

**v2 defense**: Recreating a claim resets its verification status to `suggested`. All verification history is lost. The new claim starts from zero Trust.

### 16.9 Exploiting status transitions

**v2 defense (Phase 8)**: All status transitions must go through `verificationEventService`. The client cannot directly set `verified`, `revoked`, `disputed`, etc. The verification lifecycle is enforced server-side.

---

## 17. AI Boundary

### DECIDED

Trust v2 is **100% deterministic and server-side**. No LLM/AI model produces the numerical score.

AI may eventually assist with:
- Claim text extraction from documents
- Evidence classification
- Conflict suggestion refinement
- Natural language explanation generation

But the canonical Trust score is always derived from server-side facts through deterministic functions. AI output must never directly become a Trust score.

---

## 18. Proposed Trust v2 Formula

### Step 1: Compute ClaimTrust for each Claim

```
ClaimTrust(claim):
  
  // 1. Evidence Support (0–70)
  evidenceSupport = computeEvidenceSupport(claim, evidenceRecords)
  
  // 2. Verification Strength (0–30)
  verificationStrength = computeVerificationStrength(claim, verificationEvents)
  
  // 3. Raw Claim Trust
  rawScore = evidenceSupport + verificationStrength
  
  // 4. Apply Conflict Penalty
  conflictPenalty = computeConflictPenalty(claim, conflicts)
  afterConflict = max(0, rawScore - conflictPenalty)
  
  // 5. Apply Status Gate (hard cap)
  statusCap = getStatusCap(claim.verificationStatus)
  afterGate = min(afterConflict, statusCap)
  
  // 6. Apply Critical Conflict Gate
  criticalConflictCap = getCriticalConflictCap(claim, conflicts)
  afterCriticalGate = min(afterGate, criticalConflictCap)
  
  // 7. Clamp
  finalScore = clamp(afterCriticalGate, 0, 100)
  
  return ClaimTrust {
    score: finalScore,
    gateBlocked: (afterGate < afterConflict) || (afterCriticalGate < afterGate),
    gateReason: ...,
    factors: [...]
  }
```

### Evidence Support Calculation

```
computeEvidenceSupport(claim, evidenceRecords):
  linkedEvidence = evidenceRecords.filter(e => e.claimId === claim.id)
  count = linkedEvidence.length
  
  // Diminishing returns
  if count === 0: base = 0
  elif count === 1: base = 40
  elif count === 2: base = 55
  elif count === 3: base = 63
  elif count === 4: base = 66
  else: base = min(70, 66 + (count - 4))
  
  // Diversity multiplier
  distinctKinds = distinct(linkedEvidence.map(e => e.evidenceKind))
  if distinctKinds >= 3: multiplier = 1.2
  elif distinctKinds >= 2: multiplier = 1.1
  else: multiplier = 1.0
  
  // Evidence review bonus
  hasReviewEvent = verificationEvents.some(
    e => e.claimId === claim.id 
    && e.eventType === "evidence_reviewed" 
    && e.outcome === "supports"
  )
  reviewBonus = hasReviewEvent ? 15 : 0
  
  return min(70, round(base * multiplier) + reviewBonus)
```

### Verification Strength Calculation

```
computeVerificationStrength(claim, verificationEvents):
  switch claim.verificationStatus:
    case "verified": base = 30
    case "accepted": base = 10
    case "evidence-added": base = 8
    case "under-review": base = 5
    case "suggested": base = 3
    case "expired": base = 5
    case "rejected": base = 0
    case "disputed": base = 0
    case "revoked": base = 0
    default: base = 3
  
  // Freshness bonus (soft)
  if claim.verificationStatus === "verified":
    recentEvent = verificationEvents.find(
      e => e.claimId === claim.id 
      && e.eventType === "verified"
      && (now - e.createdAt) < 180 days
    )
    if recentEvent: base = min(30, base + 5)
  
  return base
```

### Conflict Penalty Calculation

```
computeConflictPenalty(claim, conflicts):
  relevantConflicts = conflicts.filter(
    c => c.claimIds.includes(claim.id) 
    && c.status in ["new", "reviewing"]
  )
  
  penalty = 0
  hasCritical = false
  
  for conflict in relevantConflicts:
    switch conflict.severity:
      case "critical": hasCritical = true; penalty = max(penalty, 20)
      case "warning": penalty = max(penalty, 10)
      case "info": penalty = max(penalty, 3)
  
  return penalty
```

### Status Gate Caps

```
getStatusCap(status):
  switch status:
    case "revoked": return 20
    case "disputed": return 30
    case "expired": return 40
    case "rejected": return 15
    default: return 100
```

### Critical Conflict Gate

```
getCriticalConflictCap(claim, conflicts):
  hasCriticalConflict = conflicts.some(
    c => c.claimIds.includes(claim.id)
    && c.conflictType === "status_mismatch"
    && c.severity === "critical"
    && c.status in ["new", "reviewing"]
  )
  if hasCriticalConflict: return 60
  return 100
```

### Step 2: Aggregate into Professional Trust

```
aggregateProfessionalTrust(claimTrusts):
  if claimTrusts.length === 0: return 0
  
  // Simple average
  sum = claimTrusts.reduce((s, ct) => s + ct.score, 0)
  average = sum / claimTrusts.length
  
  // Overall Excellent gate: no disputed/revoked claims allowed
  hasRevokedOrDisputed = claimTrusts.some(
    ct => ct.verificationStatus in ["revoked", "disputed"]
  )
  if hasRevokedOrDisputed:
    average = min(average, 75)
  
  return clamp(round(average), 0, 100)
```

---

## 19. v1 vs v2 Comparison

| Dimension | Trust v1 | Trust v2 |
|-----------|----------|----------|
| Unit of trust | Global flat score | Per-Claim Trust → aggregated |
| Inputs | Claims, Evidence, VerificationEvents | + ConflictRecords |
| Evidence | Linear density bonus | Diminishing returns + diversity multiplier |
| Verification | Ratio of verified claims | Per-claim status strength + freshness |
| Conflicts | Not consumed | Per-claim penalty with severity levels |
| Revocation | Penalized (−ratio × 30) | Hard gate (cap at 20) |
| Expiration | Excluded from verification | Hard gate (cap at 40) |
| Multiple evidence | Unlimited linear growth | Capped at 70 with diminishing returns |
| Claim aggregation | Weighted average of 5 flat components | Simple average of per-claim scores |
| Explainability | Component-level explanations | Per-claim factors + overall explanation |
| Gaming resistance | Moderate (evidence count gaming possible) | Strong (diminishing returns, gates, conflict detection) |
| Determinism | Yes | Yes |
| Algorithm version | v1 | v2 |

---

## 20. Schema/API Impact

### DECIDED — No schema changes required

Trust v2 operates on existing canonical data:
- `Claim` (verificationStatus, confidence, claimType)
- `EvidenceRecord` (claimId, evidenceKind)
- `VerificationEvent` (claimId, eventType, outcome, createdAt)
- `ConflictRecord` (claimIds, conflictType, severity, status)

The canonical loader needs to additionally load ConflictRecords. This is a query change, not a schema change.

### API Changes

`GET /api/trust` response changes from `ServerTrustReport` (v1) to `ServerTrustReportV2` (v2). This is a **breaking change** to the API response shape.

The response adds:
- `claimTrusts[]` — per-claim Trust breakdown
- `factors[]` — overall supporting/reducing factors
- `summary.activeConflicts` — new field

The existing `breakdown[]` and `reasons[]` fields are replaced by the new `factors[]` and per-claim `ClaimTrust.factors[]`.

### Migration Strategy

Since Trust is dynamically derived (no persisted entity), the migration is simply:
1. Deploy the new algorithm
2. All consumers immediately see v2 results
3. The API response shape changes
4. TrustView and TrustWidget must be updated to render the new shape

---

## 21. Open Product Decisions

The following require product confirmation before implementation:

| Decision | Current Recommendation | Status |
|----------|----------------------|--------|
| Numerical weights for evidence levels | 40/55/63/66/70 | RECOMMENDED — needs product sign-off |
| Diminishing returns curve shape | Exponential decay | RECOMMENDED — needs product sign-off |
| Diversity multiplier values | 1.0/1.1/1.2 | RECOMMENDED — needs product sign-off |
| Conflict penalty values | 3/10/20 | RECOMMENDED — needs product sign-off |
| Status gate cap values | 15/20/30/40 | RECOMMENDED — needs product sign-off |
| Trust level names | Unrated/Developing/Supported/Strong/Highly Supported | RECOMMENDED — needs product sign-off |
| Level thresholds | 0/26/51/76 | RECOMMENDED — needs product sign-off |
| Verification freshness window | 180 days | RECOMMENDED — needs product sign-off |
| Claim count floor | 3 | RECOMMENDED — needs product sign-off |
| Overall Excellent gate threshold | 75 (with disputed/revoked) | RECOMMENDED — needs product sign-off |

All weights are explicitly documented as recommendations. They will be labeled as "RECOMMENDED" in code and should be confirmed by product before public launch.

---

## 22. Recommended Implementation Plan

### Phase 9A — Trust v2 types and pure algorithm
- Create `src/lib/trust/v2/types.ts`
- Create `src/lib/trust/v2/derivation.ts`
- Create `src/lib/trust/v2/__tests__/derivation.test.ts`
- Implement ClaimTrust computation
- Implement aggregation
- Implement explanation generation
- Unit tests for all scenarios

### Phase 9B — Canonical loader update
- Update `src/lib/trust/canonical-loader.ts` to load ConflictRecords
- Add ConflictRecord to `TrustDerivationInput`
- Update all consumers to pass conflicts

### Phase 9C — API update
- Update `GET /api/trust` to return v2 shape
- Update `trust/share` route
- API tests

### Phase 9D — Client migration
- Update `TrustView` to render per-claim breakdown
- Update `TrustWidget` to render v2 summary
- Update `Passport` projection
- Component tests

### Phase 9E — Documentation
- Update ADR-002, MASTER_ARCHITECTURE, roadmap
- Mark Trust v1 as replaced

---

## 23. Explicit Invariants

1. Trust is derived server-side from canonical database facts only.
2. Client state is never authoritative for Trust.
3. Same canonical inputs + same algorithm version → same Trust result.
4. Evidence ≠ verification.
5. Conflicts affect only the Claims they involve, not an arbitrary global score.
6. The same underlying issue is never penalized twice (double-counting protection).
7. Hard gates produce definitive statements about critical conditions.
8. Trust score is not a probability or percentage.
9. No AI model produces the Trust score.
10. Trust v2 replaces v1 — no dual-version support needed.

---

## 24. Files Inspected

| File | Purpose |
|------|---------|
| `src/lib/trust/derivation.ts` | Trust v1 algorithm |
| `src/lib/trust/types.ts` | Trust v1 types |
| `src/lib/trust/canonical-loader.ts` | Canonical data loader |
| `src/lib/trust/__tests__/derivation.test.ts` | v1 tests |
| `src/app/api/trust/route.ts` | Trust API |
| `src/app/api/trust/share/route.ts` | Trust share |
| `src/components/identity/TrustView.tsx` | Trust UI |
| `src/components/hub/widgets/TrustWidget.tsx` | Dashboard widget |
| `src/lib/conflict/types.ts` | Conflict types |
| `src/lib/conflict/detection.ts` | Conflict algorithm |
| `src/lib/passport/types.ts` | Passport types |
| `src/lib/passport/projection.ts` | Passport projection |
| `src/services/claim.service.ts` | Claim service |
| `src/services/verification-event.service.ts` | Verification service |
| `src/services/__tests__/trust-report.test.ts` | Legacy Trust tests |

## 25. Files Changed

**None** — this is a design-only phase.

## 26. Tests/Checks Run

**None** — no code was modified.

## 27. Confirmation

✅ No production behavior was changed.
✅ No Prisma schema was modified.
✅ No migrations were created.
✅ No APIs were modified.
✅ No tests were added or modified.
✅ This document is the sole deliverable of Phase 9.
