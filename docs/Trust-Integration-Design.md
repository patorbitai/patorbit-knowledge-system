# Trust Integration Design

**Status:** Approved as implementation contract — pending founder freeze
**Grounded in:** `src/services/trust-service.ts`, `src/services/graph-service.ts`, `src/store/resume-builder.ts`, `src/services/graph-mapper.ts`, `src/types/knowledge-graph.ts`, `src/components/identity/Passport.tsx`

---

## 1. Trust Ownership

**Answer: Trust is owned by a dedicated `TrustService` that operates on a derived Knowledge Graph.** It does **not** live inside `ResumeBuilderStore`, `GraphService`, or any UI component.

Rationale, from code:
- `TrustService` consumes `GraphService` (`constructor(graphService: GraphService)`), not store state. Its methods (`calculateTrustScore`, `getEvidenceCoverage`, `getVerificationSummary`) read the graph.
- `GraphService` is explicitly "pure graph traversal... No business logic, no scoring" (`graph-service.ts:37`) — trust scoring is out of its scope by its own contract.
- `ResumeBuilderStore` is a UI-state store (resume editing, saveStatus). Baking a scoring engine into it couples persistence, editing, and reasoning.

**The canonical business data is the domain objects** — `Professional Identity → Claims → Evidence → Verification`. The graph is a **derived reasoning model** rebuilt from those objects, optimized for traversal, **not** the canonical source of truth.

---

## 2. The Coordinator Is a Concrete Component: `IdentityPipelineCoordinator`

The former "coordinator" is now a named, first-class architectural component with one explicit responsibility:

**`IdentityPipelineCoordinator` — converts store state → graph → trust, and caches the trust snapshot.**

```
Store (resume, claims, evidence, verification status)
    ↓
IdentityPipelineCoordinator
    ↓
GraphMapper (resumeToGraph → ClaimNode, EvidenceNode, SUPPORTED_BY edges)
    ↓
GraphService (holds the derived graph)
    ↓
TrustService (calculateTrustScore on the graph)
    ↓
Store Cache (trustScore snapshot for UI)
```

Responsibilities (and only these):
1. Subscribe to the store.
2. On a named trigger (below), rebuild the graph from canonical domain objects via `resumeToGraph`.
3. Run `TrustService.calculateTrustScore()` against the graph.
4. Write the result to the store cache (`setTrustScore`).
5. Handle errors (keep prior value) and debounce rapid triggers.

**Explicitly out of scope:** it does not own the graph (GraphService does), does not score (TrustService does), does not map source→graph (GraphMapper does). It only *orchestrates* the handoff. This prevents it becoming an anonymous blob.

---

## 3. Trust Lifecycle — Exactly When Trust Is Recomputed

Recompute only on discrete events that change what the graph expresses:

| Trigger | Store Action (verified) | Graph Effect |
|---------|------------------------|--------------|
| Claim accepted | `acceptClaim` | new ClaimNode |
| Claim edited | `acceptEditedClaim` | ClaimNode assertion change |
| Claim rejected | `rejectClaim` | (no node created) |
| Evidence added | `addEvidence` | new EvidenceNode + SUPPORTED_BY edge |
| Evidence removed | `removeEvidence` | EvidenceNode + edge removed |
| Evidence status change | `setEvidenceStatus` / `markClaimReadyForReview` | ClaimNode.verificationStatus change |
| Evidence consent/visibility | `setEvidenceConsent` / `setEvidenceVisibility` | — (privacy only; optional recompute) |

Debounce lives in the coordinator, not in each action.

---

## 4. Source of Truth — Stored or Derived?

**Trust is always derived, never stored as canonical.**

- Canonical truth = domain objects: Claims, Evidence, Verification.
- The graph is a **derived intermediate** — regenerable from those objects at any time.
- Trust is a function of the graph: `TrustService.calculateTrustScore()`.
- The computed result is **cached** in the store only as a presentation snapshot for the UI. It is not authoritative and is invalidated whenever the graph regenerates.

**Consequence:** because the graph can always be regenerated from Claims/Evidence/Verification, those domain objects remain canonical, and the graph (and trust) are derived. This matches ADR-006's pipeline ordering.

---

## 5. Dependency Graph — How Trust Consumes Verification

Trust consumes Verification **through the graph, via `SUPPORTED_BY` edges and claim `verificationStatus`** — not through the store or events.

Verified code path (`trust-service.ts`):
- `scoreClaims()` reads `this.graph.findClaims()`, filters by `c.verificationStatus === "verified"`, calls `this.graph.findEvidenceForClaim(c.id)`.
- `getEvidenceCoverage()` reads `this.graph.findEvidence()` and `this.graph.getIncomingEdges(ev.id, "SUPPORTED_BY")`.

**Blocking precondition (Phase 0, mandatory):** `resumeToGraph` must be extended to emit `ClaimNode`, `EvidenceNode`, and `SUPPORTED_BY` edges from the store's claims and evidence. Today it hardcodes `claims: []` (`graph-mapper.ts:347`) — verified. Without this, TrustService has zero claims/evidence to evaluate.

---

## 6. Runtime Sequence Diagram

```
[UI] User accepts claim
        │  acceptClaim()
        ▼
[Store] resume.claims updated
        │  IdentityPipelineCoordinator.subscribe fires
        ▼
[Coordinator] rebuildGraph(storeState)
        │  resumeToGraph(resume, claims, evidence)
        ▼
[GraphService] derived graph rebuilt (ClaimNode added, edges)
        │
        ▼
[TrustService] calculateTrustScore() reads graph
        │
        ▼
[Store] trustScore = { overall, components, calculatedAt }   ← cached snapshot
        │  setTrustScore()
        ▼
[UI] Passport.TrustSnapshot re-renders from cache
```

Same sequence for `addEvidence`, `removeEvidence`, `setEvidenceStatus`, `markClaimReadyForReview`.

---

## 7. Store Interaction

The store gains **one** new field and **one** new action:

- `trustScore: { overall: number | null; components: TrustScoreComponent[]; calculatedAt: string } | null` — cached presentation snapshot.
- `setTrustScore(score)` — writes the snapshot.

**No store action calls TrustService directly.** The coordinator subscribes and reacts. The store stays pure UI-state.

---

## 8. Error Handling & Failure Mode

| Scenario | Behavior |
|----------|----------|
| `calculateTrustScore()` throws | Keep previous cached value. Log error. |
| Graph rebuild fails | Keep old graph + old trust; non-fatal log. |
| Store rehydrates, no graph yet | `trustScore` stays `null`; Passport renders empty state. |
| Empty identity (no claims/evidence) | TrustService returns `overall: null`, `status: "missing"` components; Passport shows "No claims yet" insight. |

**Rule:** a failed trust computation never destroys a good prior value.

---

## 9. Persistence Policy

- Graph is **not** persisted — derived, rebuilt on demand.
- Trust snapshot is **not** persisted — function of the graph.
- **On store rehydrate:** coordinator rebuilds graph from persisted `resume` + `evidence`, recomputes trust once.

---

## 10. Performance Strategy

- **Debounce at the coordinator** (~150–250ms), coalescing rapid edits into one rebuild+recompute.
- **Synchronous recompute, async scheduling** — UI never blocked per-keystroke.
- **Cache served to UI** — no component calls TrustService directly.
- Beta data volume is small; no queue/worker needed. Revisit for V2 multi-user/DB.

---

## 11. Integration Tests

One end-to-end suite (e.g., `src/services/__tests__/trust-pipeline.test.ts`) proving the constitutional flow:

1. Empty identity → trust `null`, Passport empty state.
2. `acceptClaim` → one ClaimNode → trust computed.
3. `addEvidence` → ClaimNode + EvidenceNode + `SUPPORTED_BY` edge → coverage > 0.
4. `markClaimReadyForReview` → verificationStatus changes → trust reflects it.
5. `removeEvidence` → edge gone → coverage reverts.
6. Debounce — rapid `addEvidence` calls → one recompute (spy on coordinator).
7. Failure — force `calculateTrustScore` throw → prior value retained.
8. Rehydrate — persisted resume+evidence → graph rebuilt → trust recomputed once.

This test **is the Demo Checkpoint**: proves `Resume → Claim → Evidence → Verification → Trust` in one runnable suite.

---

## 12. Phase 0 — Mandatory Prerequisite

Before any of the above, `resumeToGraph` must be extended to emit `ClaimNode`, `EvidenceNode`, and `SUPPORTED_BY` edges from the store's accepted claims and their evidence. Everything else depends on this.

Deliverable: updated `graph-mapper.ts` + unit test asserting claim/evidence nodes appear in the output graph.

---

## 13. Founder Review Checklist

- [x] Trust owned by dedicated TrustService over the derived graph (not the store)
- [x] Coordinator is a concrete component: `IdentityPipelineCoordinator`, single responsibility
- [x] Graph is a derived reasoning model; domain objects (Claims/Evidence/Verification) are canonical
- [x] Lifecycle: named triggers only; debounce at coordinator
- [x] Trust consumes Verification through the graph (`SUPPORTED_BY` + verificationStatus)
- [x] `resumeToGraph` extended to emit Claim/Evidence nodes (Phase 0 prerequisite)
- [x] Store stays pure; coordinator orchestrates store→graph→trust
- [x] Failure mode: keep old value on error
- [x] Persistence: neither graph nor trust persisted; rebuilt on rehydrate
- [x] Performance: coordinator-level debounce; cache to UI
- [x] Integration test proves the 6-step pipeline end-to-end
- [x] Passport consumes cached trust snapshot, not a parallel AI number

---

## 14. Out of Scope (Deliberately Not Done)

- No core domain object added; no pipeline reorder.
- No invented middleware or `require()` in the store.
- No UI, no Career Journey, no Identity Intelligence — those remain frozen until Trust is operational.
