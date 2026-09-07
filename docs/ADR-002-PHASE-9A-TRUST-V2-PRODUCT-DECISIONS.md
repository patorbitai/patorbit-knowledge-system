# ADR-002 Phase 9A — Trust v2 Product Decision Matrix

**Document ID:** ADR-002-PHASE-9A
**Status:** ✅ Design Complete — IMPLEMENTED (Phase 9B verification pass)
**Date:** 2026-09-07
**Type:** Product Decision Matrix
**Depends on:** ADR-002 Phase 9 (Trust v2 Design)
**Scope:** Design only — no production code changes

---

## 1. Executive Summary

This document finalizes all product decisions required to implement Trust v2. It reviews the Phase 9 design, challenges assumptions, and produces a clear decision matrix where every numerical value is either DECIDED or explicitly marked RECOMMENDED.

The key refinements from Phase 9 are:

1. **Removed generic verification freshness bonus** — recency is not inherently more trustworthy
2. **Clarified evidence strength levels** — mapped to actual data model capabilities
3. **Finalized conflict treatment** — hybrid penalty/cap model
4. **Hardened double-counting rules** — explicit hierarchy
5. **Challenged simple average aggregation** — added claim-count gaming protection
6. **Separated trust tiers from highest-tier requirements**

**Production code changed:** NO
**Prisma schema changed:** NO
**Migration created:** NO
**API behavior changed:** NO
**Trust v1 changed:** NO
**Trust v2 implemented:** NO

---

## 2. Product Definition of Trust

### DECIDED

> **Patorbit Trust represents the strength of canonical evidence and verification history supporting a person's professional claims.**

Trust does **not** measure:
- Truthfulness probability ("80% chance this person is honest")
- Employability
- Resume quality
- Profile completeness
- Intelligence or skill level
- Career success
- Personal character

Trust specifically answers: **"Given what Patorbit's canonical system knows, how well-supported are this person's professional claims?"**

A score of 75 means: "The canonical evidence and verification history provide strong support for this person's professional claims." It does NOT mean: "There is a 75% chance this person is telling the truth."

---

## 3. Trust Unit

### DECIDED — Claim-Level Scoring

The fundamental unit of Trust is the **Claim**. Individual Claim Trust scores are computed first, then aggregated into overall Professional Trust.

```
ProfessionalIdentity
       ↓
Claim[] → ClaimTrust (per claim)
       ↓
Aggregate → Professional Trust
```

**Why Claim-level is preferable:**

1. **Explainability**: "Your employment claim at Google scored 85 because..." vs "Your Trust is 74."
2. **Conflict integration**: Conflicts affect specific Claims, not an arbitrary global score.
3. **Actionable guidance**: "Your certification claim needs more evidence" is actionable.
4. **Selective presentation**: Passport can present Trust per-claim.
5. **Future extensibility**: External verification targets specific claims.

**ClaimTrust computation:**

```
ClaimTrust(claim) =
    EvidenceSupport(claim)      [0–70]
  + VerificationStrength(claim) [0–30]
  - ConflictPenalty(claim)      [0–20]
  → apply StatusCap(claim)      [hard ceiling]
  → apply CriticalConflictCap   [hard ceiling]
  → clamp(0, 100)
```

**Professional Trust aggregation:**

```
ProfessionalTrust = mean(ClaimTrust scores)
                  → apply OverallGate (if any claim is revoked/disputed)
                  → clamp(0, 100)
```

---

## 4. Evidence Strength Decision

### DECIDED — Four Levels Mapped to Existing Data

| Evidence Level | Exists in Data Model? | Data Source | Trust Contribution |
|---------------|----------------------|-------------|-------------------|
| **Self-asserted** | YES | Claim exists, no linked EvidenceRecord | Baseline (0 from evidence) |
| **Attached** | YES | EvidenceRecord.claimId = this Claim | Moderate positive |
| **Reviewed** | YES | VerificationEvent.eventType = "evidence_reviewed" AND outcome = "supports" | Strong positive |
| **Verified** | YES | Claim.verificationStatus = "verified" | Strongest (via verification, not evidence) |

**Key distinction:** Uploaded evidence is NOT verified. Evidence reviewed with "supports" outcome is NOT verified. Only a Claim that has gone through the full verification lifecycle to `verified` status counts as verified.

### Evidence Support Scoring

| Level | Base Score | Rationale |
|-------|-----------|-----------|
| Self-asserted | 0 | No external support |
| Attached | 40 | User provided supporting artifact |
| Reviewed | 40 + 15 review bonus = up to 55 | Someone examined the evidence |
| Verified | 30 (from verification, not evidence) | Full verification lifecycle completed |

**Status:** DECIDED — the levels exist in the data model and are distinguishable.

---

## 5. Evidence Quantity Decision

### DECIDED — Diminishing Returns

| Evidence Count | Cumulative Score | Rationale |
|---------------|-----------------|-----------|
| 0 | 0 | No evidence |
| 1 | 40 | First evidence provides strong signal |
| 2 | 55 (+15) | Second evidence adds corroboration |
| 3 | 63 (+8) | Diminishing returns begin |
| 4 | 66 (+3) | Marginal value decreases further |
| 5+ | min(70, 66 + (n-4)) | Near-ceiling; more evidence has minimal impact |

**Cap:** Evidence support is capped at 70 regardless of quantity. The remaining 30 must come from verification activity.

**Why diminishing returns:** Uploading 10 copies of the same document should not produce 10× the trust of uploading 1. The first evidence record is the most informative; subsequent records provide diminishing corroboration.

**Status:** DECIDED

---

## 6. Evidence Diversity Decision

### DECIDED — Diversity Multiplier

| Distinct evidenceKind Count | Multiplier | Rationale |
|---------------------------|-----------|-----------|
| 1 | ×1.0 | Same type repeated |
| 2 | ×1.1 | Two different evidence types |
| 3+ | ×1.2 | Genuinely diverse evidence |

**Data model support:** `EvidenceRecord.evidenceKind` is a free-form string (e.g., "GitHub Repository", "Document", "Link"). The distinct count of `evidenceKind` values across a Claim's evidence records provides a reasonable diversity signal.

**Limitation:** The schema cannot determine whether two records with different `evidenceKind` values are substantively different. This is acceptable for v2 — diversity of types is a useful heuristic even without content analysis.

**Status:** DECIDED

---

## 7. Verification Strength Decision

### DECIDED — Current Claim Status is Authoritative

The algorithm uses **only the current `Claim.verificationStatus`** to determine verification strength. Historical VerificationEvents are used for:
1. Detecting whether a `evidence_reviewed` event with `outcome: "supports"` exists
2. Nothing else for Trust calculation purposes

A Claim that was verified but later revoked has `verificationStatus = "revoked"` and is treated as revoked. The historical "verified" event does NOT contribute positively.

### Verification Strength Values

| Status | Score | Rationale |
|--------|-------|-----------|
| `verified` | 30 | Full verification lifecycle completed |
| `accepted` | 10 | User confirmed the claim |
| `evidence-added` | 8 | Evidence attached, not yet reviewed |
| `under-review` | 5 | In verification pipeline |
| `suggested` | 3 | Claim exists but not yet acted on |
| `expired` | 5 | Was valid, now expired (not penalized like revoked) |
| `rejected` | 0 | Verification process rejected the claim |
| `disputed` | 0 | Claim is under dispute |
| `revoked` | 0 | Verification was revoked |

**Status:** DECIDED

---

## 8. Generic Verification Freshness — REJECTED

### DECIDED — No Generic Freshness Bonus

The Phase 9 design proposed a +5 bonus for verified claims with recent verification events. **This is rejected.**

**Rationale:**

A verified claim does not become more trustworthy merely because it was verified recently. A 5-year-old degree that was independently verified remains verified. A certification that was verified last week is not inherently more trustworthy than one verified 2 years ago.

Freshness may matter for:
- **Expiration tracking**: handled by the `expired` status (not a freshness bonus)
- **Audit trail completeness**: useful for explanation, not for Trust scoring

What does matter:
- Whether the Claim is currently `verified` (current state = authoritative)
- Whether the Claim has `expired` (current state = authoritative)

The current Claim status already captures whether verification is active. Adding a separate freshness bonus introduces an unprincipled time-decay that contradicts the Trust definition.

**Status:** DECIDED — freshness bonus removed from v2 design

---

## 9. Conflict Treatment Decision

### DECIDED — Hybrid Penalty/Cap Model

Conflicts affect Claim Trust, not global Trust. The treatment uses:

- **Info severity**: soft penalty (points subtracted)
- **Warning severity**: soft penalty (points subtracted)
- **Critical severity**: hard cap (Claim Trust cannot exceed a ceiling)

### Conflict Treatment Matrix

| Conflict Type | Severity | Classification | Trust Effect | Value | Rationale |
|---------------|----------|---------------|-------------|-------|-----------|
| `overlapping_dates` | warning | Material | Soft penalty | −10 | Could be part-time work, but materially relevant |
| `contradictory_employer` | warning | Material | Soft penalty | −15 | Strongest warning — different employers in same period |
| `contradictory_title` | info | Informational | Soft penalty | −5 | Could be promotion or role change |
| `contradictory_dates` | warning | Material | Soft penalty | −10 | Could be resume update |
| `duplicate_credential` | warning | Material | Soft penalty | −5 | Could be dual enrollment or error |
| `education_inconsistency` | info | Informational | Soft penalty | −3 | Could be multiple degrees |
| `status_mismatch` | critical | Critical | Hard cap | cap at 60 | Verified contradicts disputed — requires review |
| `location_inconsistency` | info | Informational | Soft penalty | −2 | Could be remote work |

### Why Conflicts Affect Claim Trust, Not Global Trust

If a conflict between two employment claims reduced the global score, it would penalize unrelated claims (education, skills, certifications). By affecting only the specific Claims involved, Trust remains accurate and explainable.

### Conflict Status Modifiers

| Conflict Status | Effect on Trust Impact |
|----------------|----------------------|
| `new` | Full impact applied |
| `reviewing` | Full impact applied (user is aware) |
| `dismissed` | No impact (user determined it was not a real conflict) |
| `resolved` | No impact (conflict was resolved) |

**Status:** DECIDED — severity classifications and treatment are architectural decisions. Numerical penalty values (3/5/10/15) are RECOMMENDED.

---

## 10. Status Caps Decision

### DECIDED — Hard Caps for Critical Conditions

| Status | Cap | Rationale |
|--------|-----|-----------|
| `revoked` | 20 | Verification was actively revoked — strong negative signal |
| `disputed` | 30 | Claim is under dispute — needs resolution |
| `expired` | 40 | Was valid, now expired — not as severe as revoked |
| `rejected` | 15 | Verification process rejected the claim |
| All other | 100 | No cap applied |

**Why hard caps instead of point deductions:**

A point deduction system could allow a revoked claim to still score 50+ if it has lots of evidence. That would be misleading — a revoked claim should never appear well-supported regardless of evidence. Hard caps make definitive statements about critical conditions.

**Status:** DECIDED — caps are architectural decisions. Numerical values (15/20/30/40) are RECOMMENDED.

---

## 11. Double-Counting Rule

### DECIDED — Most Restrictive Constraint Wins

For each Claim, the algorithm applies constraints in this order:

```
rawScore = evidenceSupport + verificationStrength

conflictPenalty = max penalty from active conflicts
afterConflict = max(0, rawScore - conflictPenalty)

statusCap = cap from current verification status
afterStatusCap = min(afterConflict, statusCap)

criticalConflictCap = cap from active critical conflicts
finalScore = min(afterStatusCap, criticalConflictCap)
```

**The most restrictive constraint always wins.** If a Claim is `disputed` (cap 30) AND has an active `status_mismatch` conflict (cap 60), the disputed cap (30) applies because it is more restrictive.

**Rule:** Never apply two penalties that affect the same dimension. Status cap and conflict cap operate on the same axis (maximum Claim Trust), so only the tighter one applies.

**Status:** DECIDED

---

## 12. Claim Aggregation Decision

### RECOMMENDED — Equal Average with Claim-Count Protection

**Base formula:**

```
ProfessionalTrust = mean(ClaimTrust scores)
```

**Claim-count gaming protection:**

The simple average is vulnerable to gaming through many weak claims:

- 1 strong claim (score 90) → Professional Trust = 90
- 1 strong claim (90) + 9 weak claims (10 each) → Professional Trust = 18

To prevent this without adding complexity:

**Minimum claim threshold:** With fewer than 3 Claims, Professional Trust is flagged as "Insufficient data" in the explanation. A numerical score is still provided but labeled as preliminary.

**Rejected alternatives:**

- **Weighted by claim type**: Unfair to users with only skill claims; introduces subjective type rankings
- **Capped per claim**: Adds complexity without clear benefit
- **Claim-type floor**: Same problems as weighting

**Status:** RECOMMENDED — equal average is the simplest, most explainable approach. Claim-count protection (minimum 3 Claims) is RECOMMENDED.

---

## 13. Claim-Count Gaming Protection

### DECIDED — Simple Defenses

| Attack | Defense |
|--------|---------|
| Many weak claims | Equal-weight average means each weak claim reduces the average |
| Duplicate claims | Conflict detection identifies `duplicate_credential` |
| Claim type flooding | No type weighting, so flooding one type doesn't help |
| Low-effort claims | Claims without evidence score near 0, reducing average |

**The equal average IS the defense.** Adding a strong claim (90) while adding 4 weak claims (10 each) changes the average from 90 to 34. Users are naturally incentivized to have fewer, stronger claims.

**Status:** DECIDED

---

## 14. Claim Recreation Limitation

### DOCUMENTED — Architectural Limitation

When a Claim is deleted and recreated:
1. All VerificationEvents are lost (they reference the old Claim ID)
2. All EvidenceRecords have their `claimId` set to NULL (onDelete: SetNull)
3. The new Claim starts with `verificationStatus: "suggested"` and no evidence
4. Trust for the new Claim starts at 0

**The current architecture does NOT preserve semantic identity across deletion/recreation.** A user who deletes a verified Claim and recreates an equivalent Claim loses all Trust for that Claim.

**Future consideration:** Claim semantic fingerprinting or claim-linking could preserve identity across recreation. This is OUT OF SCOPE for v2.

**Status:** DOCUMENTED LIMITATION

---

## 15. Recency and Expiration Policy

### DECIDED — Separated Concerns

| Factor | Affects Trust? | Mechanism | Rationale |
|--------|---------------|-----------|-----------|
| Evidence age | **NO** | Not used | A 2010 degree doesn't become less trustworthy with age |
| Claim validity | **YES** | `expired` status | Expired claims are handled by the expired cap (40) |
| Verification history | **NO** (for Trust) | Audit trail only | Useful for explanation, not for scoring |

**The current Claim status is the authoritative source for validity.** If a Claim should be marked expired, the verification lifecycle handles it. Trust does not introduce its own time-decay.

**Status:** DECIDED

---

## 16. Trust Tiers

### RECOMMENDED — Tier Names and Thresholds

| Range | Level | Meaning | Status |
|-------|-------|---------|--------|
| 0 | Unrated | No claims or no data | DECIDED |
| 1–39 | Developing | Claims exist but lack evidence and verification | RECOMMENDED |
| 40–69 | Supported | Claims have evidence and some verification | RECOMMENDED |
| 70–89 | Strong | Claims have good evidence and verification | RECOMMENDED |
| 90–100 | Highly Supported | Claims are well-evidenced, verified, and conflict-free | RECOMMENDED |

**The score does NOT represent a probability or percentage.** "Highly Supported" means "The canonical evidence and verification history provide very strong support for this person's professional claims."

**Status:** RECOMMENDED — tier names and thresholds need product sign-off

---

## 17. Highest-Tier Requirements

### RECOMMENDED — Gate for "Highly Supported"

To reach the "Highly Supported" tier (90–100), the Professional Trust must satisfy:

1. **No revoked claims** in the identity
2. **No disputed claims** in the identity
3. **At least one verified claim**
4. **No unresolved critical conflicts**

If any condition fails, Professional Trust is capped at 89 (the maximum of "Strong").

**Rationale:** "Highly Supported" should mean the identity is in excellent standing. A single revoked or disputed claim, even if others are strong, indicates unresolved issues that prevent the highest tier.

**Status:** RECOMMENDED — gate conditions need product sign-off

---

## 18. Final Formula

### Evidence Support (per Claim)

```
computeEvidenceSupport(claim, evidenceRecords, verificationEvents):
  linkedEvidence = evidenceRecords.filter(e => e.claimId === claim.id)
  count = linkedEvidence.length

  // Diminishing returns curve
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

### Verification Strength (per Claim)

```
computeVerificationStrength(claim):
  switch claim.verificationStatus:
    case "verified":      return 30
    case "accepted":      return 10
    case "evidence-added": return 8
    case "under-review":  return 5
    case "suggested":     return 3
    case "expired":       return 5
    case "rejected":      return 0
    case "disputed":      return 0
    case "revoked":       return 0
    default:              return 3
```

### Conflict Penalty (per Claim)

```
computeConflictPenalty(claim, conflicts):
  relevant = conflicts.filter(
    c => c.claimIds.includes(claim.id)
    && c.status in ["new", "reviewing"]
  )

  maxPenalty = 0
  for conflict in relevant:
    switch conflict.severity:
      case "critical": maxPenalty = max(maxPenalty, 20)
      case "warning":  maxPenalty = max(maxPenalty, 10)
      case "info":     maxPenalty = max(maxPenalty, 3)

  return maxPenalty
```

### Status Cap (per Claim)

```
getStatusCap(status):
  switch status:
    case "revoked":  return 20
    case "disputed": return 30
    case "expired":  return 40
    case "rejected": return 15
    default:         return 100
```

### Critical Conflict Cap (per Claim)

```
getCriticalConflictCap(claim, conflicts):
  hasCritical = conflicts.some(
    c => c.claimIds.includes(claim.id)
    && c.conflictType === "status_mismatch"
    && c.severity === "critical"
    && c.status in ["new", "reviewing"]
  )
  return hasCritical ? 60 : 100
```

### Per-Claim Trust Assembly

```
claimTrust(claim):
  ev = computeEvidenceSupport(claim)
  vs = computeVerificationStrength(claim)
  raw = ev + vs

  cp = computeConflictPenalty(claim)
  afterConflict = max(0, raw - cp)

  sc = getStatusCap(claim.verificationStatus)
  afterStatus = min(afterConflict, sc)

  cc = getCriticalConflictCap(claim, conflicts)
  final = min(afterStatus, cc)

  return clamp(final, 0, 100)
```

### Professional Trust Aggregation

```
professionalTrust(claimTrusts):
  if claimTrusts.length === 0: return 0

  average = mean(claimTrusts.map(ct => ct.score))

  // Highest-tier gate
  hasRevoked = claimTrusts.some(ct => ct.verificationStatus === "revoked")
  hasDisputed = claimTrusts.some(ct => ct.verificationStatus === "disputed")
  hasCriticalConflict = claimTrusts.some(ct =>
    conflicts.some(c =>
      c.claimIds.includes(ct.claimId)
      && c.conflictType === "status_mismatch"
      && c.severity === "critical"
      && c.status in ["new", "reviewing"]
    )
  )

  if hasRevoked || hasDisputed || hasCriticalConflict:
    average = min(average, 89)

  return clamp(round(average), 0, 100)
```

### All Numerical Values

| Value | Purpose | Status |
|-------|---------|--------|
| 0 | Self-asserted evidence base | DECIDED |
| 40 | First evidence record | RECOMMENDED |
| 55 | Second evidence record | RECOMMENDED |
| 63 | Third evidence record | RECOMMENDED |
| 66 | Fourth evidence record | RECOMMENDED |
| 70 | Evidence support cap | RECOMMENDED |
| 1.0/1.1/1.2 | Diversity multipliers | RECOMMENDED |
| 15 | Evidence review bonus | RECOMMENDED |
| 30 | Verified verification strength | DECIDED |
| 10 | Accepted verification strength | DECIDED |
| 8 | Evidence-added verification strength | DECIDED |
| 5 | Under-review/expired verification strength | DECIDED |
| 3 | Suggested verification strength | DECIDED |
| 0 | Rejected/disputed/revoked verification strength | DECIDED |
| 3 | Info conflict penalty | RECOMMENDED |
| 10 | Warning conflict penalty | RECOMMENDED |
| 20 | Critical conflict penalty | RECOMMENDED |
| 60 | Critical conflict cap | RECOMMENDED |
| 15 | Rejected status cap | RECOMMENDED |
| 20 | Revoked status cap | RECOMMENDED |
| 30 | Disputed status cap | RECOMMENDED |
| 40 | Expired status cap | RECOMMENDED |
| 89 | Highest-tier gate cap | RECOMMENDED |
| 3 | Minimum claims for meaningful Trust | RECOMMENDED |

---

## 19. Explainability Requirements

### DECIDED — Per-Claim Factors + Overall Explanation

The Trust report must include:

1. **Overall score and level**
2. **Per-claim Trust scores** with factors explaining each
3. **Overall supporting factors** (what helped)
4. **Overall reducing factors** (what hurt)
5. **Summary counts** (claims, evidence, conflicts)

The explanation MUST be generated from the same calculation inputs as the Trust score. Never calculate one score and generate an unrelated explanation.

**Example output:**

```
Overall Trust: 72 (Strong)

Supporting factors:
- 3 claims have verified status
- 5 claims have supporting evidence
- 2 claims have diverse evidence types

Reducing factors:
- 1 employment claim has an active warning conflict
- 1 certification claim is expired
- 2 claims lack any evidence

Claim breakdown:
- "Worked at Google 2021-2024": 85 (verified, 3 evidence records)
- "AWS Solutions Architect": 72 (evidence reviewed, 2 records)
- "Python proficiency": 55 (evidence attached, 1 record)
- "Contributed to React": 40 (accepted, no evidence)
- "PMP Certification": 35 (expired, evidence exists)
```

**Status:** DECIDED

---

## 20. AI Boundary

### DECIDED

Trust v2 numerical scoring is **100% deterministic and server-side**. No LLM/AI model produces the numerical score.

AI may eventually assist with:
- Claim text extraction from documents
- Evidence classification
- Conflict suggestion refinement
- Natural language explanation generation

But AI output must never directly become a Trust score. The canonical Trust score is always derived from server-side facts through deterministic functions.

**Status:** DECIDED

---

## 21. Gaming Threat Model

| # | Attack | Current Protection | Trust v2 Protection | Remaining Limitation |
|---|--------|-------------------|--------------------|--------------------|
| 1 | Upload many files | Linear density bonus (v1) | Diminishing returns + cap at 70 | None significant |
| 2 | Upload duplicate evidence | None | Diminishing returns | Cannot detect true duplicates (schema limitation) |
| 3 | Create many claims | More coverage = higher score | Equal average; weak claims reduce average | None significant |
| 4 | Create duplicate claims | None | Conflict detection identifies duplicates | Detection depends on text similarity |
| 5 | Repeated verification attempts | ReviewActivity rewards event count | Only current status matters; events don't compound | None significant |
| 6 | Create fake conflicts | Server-side detection only | User cannot create ConflictRecords directly | None significant |
| 7 | Manipulate claim text | None | Changes don't increase Trust; evidence/verification unchanged | May avoid conflict detection |
| 8 | Delete/recreate claims | Resets verification | Resets to suggested, no evidence, score 0 | Loss of verification history is the intended behavior |
| 9 | Many weak claims | Equal weight | Weak claims reduce average | None significant |
| 10 | Client state manipulation | Phase 8: server-side derivation | Server-side derivation; client not authoritative | None significant |

---

## 22. Product Decision Matrix

| # | Decision | Recommendation | Status |
|---|----------|---------------|--------|
| 1 | Evidence strength levels | 4 levels: self-asserted, attached, reviewed, verified | DECIDED |
| 2 | Evidence diminishing returns | 40, +15, +8, +3, +1 curve, cap at 70 | RECOMMENDED |
| 3 | Evidence diversity | ×1.0 / ×1.1 / ×1.2 multiplier by distinct evidenceKind | RECOMMENDED |
| 4 | Verification strength | Current Claim status: verified=30, accepted=10, etc. | DECIDED |
| 5 | Verification freshness | No freshness bonus (rejected) | DECIDED |
| 6 | Conflict treatment | Hybrid: soft penalties (info/warning) + hard cap (critical) | DECIDED |
| 7 | Conflict penalty values | info=3, warning=10, critical=20 | RECOMMENDED |
| 8 | Conflict→Claim scope | Conflicts affect only the Claims they involve | DECIDED |
| 9 | Status caps | revoked=20, disputed=30, expired=40, rejected=15 | RECOMMENDED |
| 10 | Double-counting | Most restrictive constraint wins | DECIDED |
| 11 | Claim aggregation | Equal average of ClaimTrust scores | RECOMMENDED |
| 12 | Claim-count gaming | Weak claims reduce average; minimum 3 Claims flagged | RECOMMENDED |
| 13 | Trust tiers | 0=Unrated, 1-39=Developing, 40-69=Supported, 70-89=Strong, 90-100=Highly Supported | RECOMMENDED |
| 14 | Highest-tier requirements | No revoked/disputed + at least one verified + no critical conflicts | RECOMMENDED |
| 15 | Evidence age | Does not affect Trust | DECIDED |
| 16 | Claim validity | Handled by expired status | DECIDED |
| 17 | Algorithm version | v2 | DECIDED |
| 18 | Trust definition | Strength of canonical evidence and verification history supporting claims | DECIDED |
| 19 | AI boundary | 100% deterministic, no AI in scoring | DECIDED |
| 20 | Explainability | Per-claim factors + overall explanation from same calculation | DECIDED |

---

## 23. Remaining Open Decisions

All DECIDED items are final. The following RECOMMENDED items require product sign-off:

| # | Item | Current Value | Impact if Changed |
|---|------|--------------|-------------------|
| 1 | Evidence level scores | 0/40/55/63/66/70 | Affects how evidence contributes to Trust |
| 2 | Diversity multipliers | 1.0/1.1/1.2 | Affects how diverse evidence is rewarded |
| 3 | Conflict penalties | 3/10/20 | Affects how conflicts reduce Trust |
| 4 | Status caps | 15/20/30/40 | Affects maximum Trust for revoked/disputed/etc. |
| 5 | Trust tier thresholds | 0/1/40/70/90/100 | Affects how scores map to levels |
| 6 | Highest-tier gate | 89 cap | Affects who reaches "Highly Supported" |
| 7 | Minimum claim threshold | 3 | Affects when Trust is flagged as preliminary |

**These values can be adjusted after implementation without architectural changes.** They are configuration constants, not structural decisions.

---

## 24. Implementation Prerequisites

Before implementing Trust v2:

1. **Product sign-off** on RECOMMENDED numerical values (or acceptance of defaults)
2. **Phase 8** security fixes must be deployed (already done)
3. **ConflictRecords** must be loadable by the canonical loader (query change, not schema change)
4. **TrustView** and **TrustWidget** must be updated to render per-claim breakdown
5. **Passport projection** must be updated to include per-claim Trust

---

## 25. Files Inspected

| File | Purpose |
|------|---------|
| `docs/ADR-002-PHASE-9-TRUST-V2-DESIGN.md` | Phase 9 design |
| `src/lib/trust/derivation.ts` | Trust v1 algorithm |
| `src/lib/trust/types.ts` | Trust v1 types |
| `src/lib/trust/canonical-loader.ts` | Canonical data loader |
| `src/lib/trust/__tests__/derivation.test.ts` | v1 tests |
| `src/lib/conflict/types.ts` | Conflict types |
| `src/lib/conflict/detection.ts` | Conflict detection |
| `src/services/verification-event.service.ts` | Verification lifecycle |
| `src/services/claim.service.ts` | Claim service |
| `src/app/api/trust/route.ts` | Trust API |
| `src/app/api/trust/share/route.ts` | Trust share |

## 26. Files Changed

**None** — this is a design-only phase.

## 27. Tests/Checks Run

**None** — no code was modified.

## 28. Confirmation

✅ No production behavior was changed.
✅ No Prisma schema was modified.
✅ No migrations were created.
✅ No APIs were modified.
✅ No tests were added or modified.
✅ This document is the sole deliverable of Phase 9A.

---

**TRUST V2 IMPLEMENTATION READINESS: READY FOR IMPLEMENTATION**

All architectural decisions are DECIDED. Numerical values are RECOMMENDED with documented defaults that can be adjusted as configuration constants. A separate implementation agent can implement Trust v2 without inventing business rules.
