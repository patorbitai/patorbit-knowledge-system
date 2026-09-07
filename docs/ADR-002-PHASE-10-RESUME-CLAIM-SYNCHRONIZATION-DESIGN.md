# ADR-002 Phase 10 — Resume ↔ Claim Synchronization Design

**Document ID:** ADR-002-PHASE-10
**Status:** 📋 DESIGN ONLY — not yet implemented
**Date:** 2026-09-07
**Type:** Architecture design (synchronization semantics)
**Basis:** Phase 10 Architecture Audit (commit 45cbd99), ADR-001, ADR-002

---

## 1. Context

Phase 10 Architecture Audit identified the primary remaining architectural/product gap:

> Resume edits do not reliably create or synchronize canonical Claims, leaving the Trust system with little or no canonical claim data.

The identity/trust architecture is **structurally complete**:

```
ProfessionalIdentity → Claims → Evidence → Verification → Conflicts → Trust v2 → Passport
```

But the product has a critical gap: **Resume data doesn't flow into Claims**. Users build rich resumes but don't create Claims, so:
- Trust Score = 0 (no claims → no trust)
- Passport is empty
- The entire identity/trust pipeline has no data

This design determines the safest architecture for connecting Resume data to canonical Claims.

---

## 2. Problem

Resume is the primary user-facing data model. Users edit resumes in the builder. But Claims (the canonical identity assertions) are a separate domain that must be created/maintained independently.

Currently:
1. A user can have a rich Resume with 10 years of experience but zero Claims
2. Trust Score will be 0 (no claims → no trust)
3. The Passport will be empty
4. The entire identity/trust pipeline is architecturally complete but product-useless

---

## 3. Current Architecture

### Resume (User Editing Layer)

Resume is a JSONB payload stored in PostgreSQL under ProfessionalIdentity:

```typescript
interface Resume {
  resumeId?: string;
  resumeName?: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  // ... contact info
  experience: Experience[];    // Employment items
  education: Education[];      // Education items
  skills: Skill[];             // Skills
  projects: Project[];         // Projects
  certifications: Certification[]; // Certifications
  achievements: Achievement[]; // Achievements
  languages: Language[];
  portfolio: Portfolio[];
  claims: Claim[];             // Builder-scoped claims (client-only)
}
```

Each Resume section item has a **stable client-side `id`** field:
- `experience[].id`
- `education[].id`
- `skills[].id`
- `projects[].id`
- `certifications[].id`

### Claim (Canonical Identity Assertion)

Claim is a first-class server entity under ProfessionalIdentity:

```typescript
interface Claim {
  id: string;
  professionalIdentityId: string;
  assertionText: string;
  claimType: "Employment" | "Education" | "Project" | "Skill" | "Certification" | "Contribution";
  sourceActivityId?: string;   // Links to resume/activity information
  confidence: number;          // 0-1
  reasoning?: string;
  verificationStatus: "suggested" | "accepted" | "evidence-added" | "under-review" | "verified" | "expired" | "revoked" | "disputed";
  reviewed: boolean;
  accepted: boolean;
}
```

### The Gap

Resume and Claim are **independent domains** with no synchronization:
- Resume edits do NOT create Claims
- Resume experience entries do NOT become Employment Claims
- Resume education entries do NOT become Education Claims
- Resume skills do NOT become Skill Claims
- Resume certifications do NOT become Certification Claims

---

## 4. Design Goals

1. **Resume edits automatically create/update Claims** — users shouldn't need to manually create Claims
2. **Claims remain canonical** — Resume is the editing interface, Claims are the source of truth
3. **Verification is preserved** — editing a Resume doesn't silently destroy verified professional facts
4. **Evidence is preserved** — evidence stays attached to Claims regardless of Resume edits
5. **No duplicate Claims** — the same professional fact shouldn't create multiple Claims
6. **Idempotent synchronization** — running sync multiple times produces the same result
7. **Failure isolation** — Resume save succeeds even if Claim sync fails
8. **No schema changes** — use existing `sourceActivityId` for linkage

---

## 5. Non-Goals

- AI-powered claim extraction (Phase 11+)
- External verification providers (Phase 12+)
- Cryptographic evidence integrity (Phase 11+)
- Automatic truth determination
- New Trust algorithms
- New Passport redesign

---

## 6. Canonical Ownership

### Current Ownership Chain

```
Authenticated User
       ↓
ProfessionalIdentity (1:1)
       ↓
Resume[] (1:N)
Claim[] (1:N)
       ↓
EvidenceRecord[] (1:N, nullable FK)
VerificationEvent[] (1:N, append-only)
```

### Proposed Addition

Resume and Claim remain **separate entities** under ProfessionalIdentity. The linkage is:

```
Resume item
    ↓ (via sourceActivityId)
Claim
```

**No `resumeId` field is added to Claim.** Claims are independent canonical assertions. The `sourceActivityId` provides the conceptual link to the Resume item that originated the Claim.

### Why No `resumeId`?

1. **Multi-Resume Sharing**: The same Claim can appear in multiple Resumes. Adding `resumeId` would require duplicating Claims.

2. **Claim Independence**: Claims belong to ProfessionalIdentity, not to Resume. Deleting a Resume must NOT destroy Claims.

3. **Historical Integrity**: A Claim may outlive the Resume item that created it (if the user removes an experience entry but the Claim remains verified).

4. **Future Sources**: Claims may originate from sources other than Resume (import, issuer credentials, manual entry). `sourceActivityId` is source-agnostic.

---

## 7. Resume ↔ Claim Relationship

### Mapping Rules

| Resume Section | Claim Type | Assertion Text Pattern |
|----------------|------------|------------------------|
| `experience[i]` | Employment | "Worked at {company} as {position} ({startDate}–{endDate})" |
| `education[i]` | Education | "Studied {degree} in {field} at {school} ({year})" |
| `skills[i]` | Skill | "Skilled in {name} ({level})" |
| `projects[i]` | Project | "Completed project {name} using {tech}" |
| `certifications[i]` | Certification | "Holds {name} certification from {issuer}" |
| `achievements[i]` | Contribution | "Achieved {title}" |

### Source Activity ID Convention

Each Resume item's `id` field becomes the Claim's `sourceActivityId`:

```
Resume experience[0].id = "id_12345_abc"
    → Claim.sourceActivityId = "id_12345_abc"
```

This provides:
- **Stable linkage** — the `id` is generated once and persists across edits
- **Deduplication key** — find existing Claim by `sourceActivityId`
- **Source-agnostic** — works for Resume items, imported items, future sources

---

## 8. Claim Identity

### Deduplication Strategy

Use `sourceActivityId` as the **primary deduplication key**:

```
For each Resume section item:
  1. Look up Claim by sourceActivityId
  2. If found → UPDATE existing Claim
  3. If not found → CREATE new Claim
```

This prevents:
- Same job → every resume save → duplicate Claim
- Multiple saves → multiple Claims

### Edge Cases

| Scenario | Handling |
|----------|----------|
| User creates experience entry | Create Claim with sourceActivityId = entry.id |
| User edits experience entry | Update existing Claim (matched by sourceActivityId) |
| User deletes experience entry | Mark Claim as "superseded" (don't delete) |
| User re-creates similar entry | New entry gets new id → new Claim |
| User imports resume | Imported items get new ids → new Claims |
| User manually creates Claim | sourceActivityId = null (not from Resume) |

---

## 9. Synchronization Direction

### Direction: Resume → Claims

Resume is the **user-facing editing interface**. Claims are **derived canonical facts**.

```
User edits Resume
       ↓
Resume Synchronization Service
       ↓
Claims (created/updated)
       ↓
Evidence / Verification / Conflicts
       ↓
Trust v2
       ↓
Passport
```

### Why Not Claims → Resume?

- Claims are canonical assertions, not editing targets
- Users edit Resumes, not Claims directly
- Claims may exist without Resume items (manual Claims)
- Resume is one presentation of many possible views

### Why Not Bidirectional?

- Creates complexity (who wins on conflict?)
- Resume and Claims have different lifecycles
- Claims may outlive Resume items
- Verification belongs to Claims, not Resume

---

## 10. Create Semantics

### When Resume Creates New Item

Example:
```
User adds:
  Company: Google
  Position: Data Engineer
  Start: 2024-01
  End: 2026-01
```

**System creates:**

```typescript
Claim {
  professionalIdentityId: identity.id,
  assertionText: "Worked at Google as Data Engineer (Jan 2024 – Jan 2026)",
  claimType: "Employment",
  sourceActivityId: "id_12345_abc",  // Resume experience item ID
  confidence: 0.5,                    // User-provided, no verification yet
  reasoning: "Stated in resume",
  verificationStatus: "suggested",    // Needs review
  reviewed: false,
  accepted: false,
}
```

### Assertion Text Generation

Generate human-readable assertion text from Resume fields:

```typescript
function generateClaimText(section: string, item: ResumeItem): string {
  switch (section) {
    case "experience":
      return `Worked at ${item.company} as ${item.position}` +
             (item.startDate ? ` (${formatDate(item.startDate)} – ${item.endDate ? formatDate(item.endDate) : 'Present'})` : '');
    case "education":
      return `Studied ${item.degree} in ${item.field} at ${item.school}` +
             (item.year ? ` (${item.year})` : '');
    case "skills":
      return `Skilled in ${item.name}${item.level ? ` (${item.level})` : ''}`;
    case "projects":
      return `Completed project ${item.name}` +
             (item.tech ? ` using ${item.tech}` : '');
    case "certifications":
      return `Holds ${item.name} certification` +
             (item.issuer ? ` from ${item.issuer}` : '');
    case "achievements":
      return `Achieved ${item.title}`;
    default:
      return item.toString();
  }
}
```

### Initial Verification Status

All auto-created Claims start as:
```typescript
verificationStatus: "suggested"
reviewed: false
accepted: false
```

This means:
- The Claim exists but hasn't been reviewed
- The user needs to accept/reject it via Claims Review
- Trust contribution is minimal (suggested claims have low verification strength)

---

## 11. Update Semantics

### When Resume Edits Existing Item

Example:
```
User edits:
  Position: "Data Engineer" → "Senior Data Engineer"
```

**Decision: Material vs. Minor Edit**

| Edit Type | Examples | Action |
|-----------|----------|--------|
| **Minor** | Typo fix, formatting, description update | Update assertionText, preserve verificationStatus |
| **Material** | Title change, company change, date change | Update assertionText, reset to "accepted" (needs re-verification) |

### Material Edit Detection

```typescript
function isMaterialEdit(oldItem: ResumeItem, newItem: ResumeItem): boolean {
  // Material fields for Employment
  return (
    oldItem.company !== newItem.company ||
    oldItem.position !== newItem.position ||
    oldItem.startDate !== newItem.startDate ||
    oldItem.endDate !== newItem.endDate
  );
}
```

### Update Behavior

```typescript
if (claimExists) {
  if (isMaterialEdit(oldItem, newItem)) {
    // Material change: update assertionText, reset verification
    await claimService.update(claim.id, {
      assertionText: generateClaimText(section, newItem),
      verificationStatus: "accepted",  // Needs re-verification
      reviewed: false,
      accepted: true,  // Auto-accept the update
    });
  } else {
    // Minor change: update assertionText only
    await claimService.update(claim.id, {
      assertionText: generateClaimText(section, newItem),
    });
  }
}
```

### Verification Preservation

**Critical Principle**: Do NOT allow Resume editing to silently destroy verified professional facts.

| Current Status | Material Edit | Minor Edit |
|----------------|---------------|------------|
| `suggested` | → `accepted` | → `accepted` |
| `accepted` | → `accepted` (needs re-review) | → `accepted` |
| `evidence-added` | → `accepted` (needs re-verification) | → `evidence-added` |
| `under-review` | → `accepted` (needs re-verification) | → `under-review` |
| `verified` | → `accepted` (verification lost) | → `verified` (preserved) |
| `expired` | → `accepted` (needs re-verification) | → `expired` |
| `revoked` | → `accepted` (needs re-verification) | → `revoked` |
| `disputed` | → `accepted` (needs re-verification) | → `disputed` |

**Key Insight**: A material edit to a `verified` Claim should **reset verification** because the underlying professional fact has changed. The old verification was for the old fact.

---

## 12. Delete Semantics

### When Resume Deletes Existing Item

**Critical Principle**: Do NOT automatically delete verified canonical history.

Example:
```
User deletes experience entry (Google, 2021-2024)
```

**System behavior:**

```typescript
// DO NOT delete the Claim
// DO NOT delete Evidence
// DO NOT delete VerificationEvents

// Instead: mark the Claim as "superseded"
await claimService.update(claim.id, {
  verificationStatus: "accepted",  // Or a new "superseded" status
  reasoning: "Resume item removed — claim preserved for historical integrity",
});
```

### Why Not Delete?

1. **Historical Integrity**: A verified Claim should not be destroyed by a Resume edit
2. **Evidence Preservation**: Evidence attached to the Claim must remain
3. **Verification Trail**: VerificationEvents must remain for audit
4. **Trust Impact**: Deleting a verified Claim would reduce Trust Score
5. **User May Re-add**: User might re-add the same experience later

### Future: "Superseded" Status

The current Claim lifecycle doesn't have a "superseded" status. Options:

1. **Use `accepted`** — the Claim remains but isn't actively presented
2. **Add `superseded` status** — requires schema change (defer to future phase)
3. **Use `reasoning` field** — document why the Claim is no longer in Resume

**Recommended**: Use `accepted` with updated `reasoning` for now. Add `superseded` status in a future schema update if needed.

---

## 13. Verification Preservation

### Principle

Verification belongs to a **professional assertion**, not merely to a UI object.

### Rules

1. **Minor edits preserve verification** — typo fixes don't change the underlying fact
2. **Material edits reset verification** — changing company/title/dates changes the fact
3. **Deletion preserves verification** — historical facts remain verified
4. **Re-creation starts fresh** — new Resume item = new Claim = suggested status

### Examples

| Scenario | Verification Outcome |
|----------|---------------------|
| Fix typo in job description | Verification preserved |
| Change "Engineer" to "Senior Engineer" | Verification reset to accepted |
| Change "Google" to "Microsoft" | Verification reset to accepted |
| Change dates from "2021-2024" to "2022-2025" | Verification reset to accepted |
| Delete experience entry | Verification preserved (Claim marked superseded) |
| Re-add same experience | New Claim, suggested status |

---

## 14. Evidence Preservation

### Principle

Evidence stays attached to Claims regardless of Resume edits.

### Behavior

| Resume Action | Evidence Outcome |
|---------------|------------------|
| Edit Resume item | Evidence remains attached to Claim |
| Delete Resume item | Evidence remains attached to Claim |
| Material edit | Evidence remains, but verification resets |
| Minor edit | Evidence remains, verification preserved |

### Why Evidence Stays

1. **Evidence supports the Claim**, not the Resume item
2. **Evidence may be independent** — user uploaded evidence manually
3. **Evidence has its own lifecycle** — evidence doesn't disappear when Resume is edited
4. **Historical audit** — evidence trail must remain intact

---

## 15. Conflict Interaction

### Boundary

Resume ↔ Claim synchronization is **separate from** Conflict Detection.

```
Resume Synchronization
       ↓
Claims (created/updated)
       ↓
Conflict Detection (runs separately)
       ↓
Conflicts (detected between Claims)
```

### How Conflicts Are Triggered

After Claims are created/updated by synchronization, the user can run Conflict Detection:

```
POST /api/conflicts
```

This compares Claims and surfaces inconsistencies:
- Overlapping dates (two Employment claims with overlapping periods)
- Contradictory employers (different employers during same period)
- Contradictory titles (different titles at same company)
- etc.

### Why Separate?

1. **Sync is fast, Conflict Detection is expensive** — don't run conflict detection on every Resume save
2. **User controls when to detect** — conflicts are surfaced for review, not auto-detected
3. **Clear separation of concerns** — sync creates Claims, detection finds issues between Claims

---

## 16. Trust Interaction

### Principle

Trust should NOT directly synchronize Resume fields.

### Intended Direction

```
Resume
   ↓ (synchronization)
Claim
   ↓
Evidence / Verification / Conflict
   ↓
Trust v2 (derived)
   ↓
Passport (projection)
```

### What This Means

- Trust consumes **canonical Claim state**, not Resume data
- Trust does NOT become "Resume completeness score" again
- Trust is derived from Claims + Evidence + Verification + Conflicts
- Resume is just the editing interface that creates Claims

---

## 17. Passport Interaction

### Principle

Passport should continue consuming:

```
ProfessionalIdentity → Claims → Evidence → Verification → Conflicts → Trust v2
```

### What Passport Should Display

**Open Product Decision** — needs product approval:

| Option | Description |
|--------|-------------|
| A. All Claims | Show every Claim regardless of status |
| B. Accepted Claims only | Show Claims with `accepted: true` |
| C. Verified Claims only | Show Claims with `verificationStatus: "verified"` |
| D. User-selected Claims | Let user choose which Claims to show |
| E. Visibility state | Add a `visibility` field to Claim (public/private) |

**Recommended**: Option B (Accepted Claims only) for initial implementation. Users accept Claims via Claims Review, then those Claims appear in Passport.

---

## 18. Import Interaction

### Current Import Flow

```
Import file → Parse → Review → Apply → Resume
```

### After Synchronization

```
Import file → Parse → Review → Apply → Resume
                                         ↓ (synchronization)
                                      Claims (created)
```

### Import Behavior

Imported Resume data should create Claims just like manual edits:

1. Imported experience → Employment Claims (suggested status)
2. Imported education → Education Claims (suggested status)
3. Imported skills → Skill Claims (suggested status)
4. etc.

**Critical**: Imported data must NOT mean "verified". All imported Claims start as `suggested`.

---

## 19. Multi-Resume Behavior

### One Claim Can Appear in Multiple Resumes

Example:

```
Claim: "Worked at Google as Data Engineer"
  sourceActivityId: "id_12345_abc"

Resume A (Data Engineer Resume):
  experience[0].id = "id_12345_abc" → links to Claim

Resume B (Backend Developer Resume):
  experience[0].id = "id_12345_abc" → same Claim
```

### Deduplication

The same `sourceActivityId` links to the same Claim. No duplication occurs.

### Resume Deletion

Deleting Resume A does NOT delete the Claim. The Claim remains because:
1. It may be referenced by Resume B
2. It's a canonical professional assertion
3. It may have Evidence and VerificationEvents

---

## 20. Idempotency

### Requirement

```
sync(resume)
sync(resume)
sync(resume)
```

should NOT create:

```
Claim A
Claim B
Claim C
```

### Mechanism

Use `sourceActivityId` as the deduplication key:

```typescript
async function syncResumeSection(resume: Resume, section: string) {
  const items = resume[section];
  for (const item of items) {
    const existing = await claimRepository.findBySourceActivityId(item.id);
    if (existing) {
      // UPDATE existing Claim
      await claimService.update(existing.id, { ... });
    } else {
      // CREATE new Claim
      await claimService.create(identity.id, {
        sourceActivityId: item.id,
        ...
      });
    }
  }
}
```

---

## 21. Failure Handling

### Design Principle

Resume save should succeed even if Claim sync fails.

### Failure Scenarios

| Scenario | Behavior |
|----------|----------|
| Resume saved, Claim sync fails | Resume save succeeds, Claim sync retried later |
| Claim created, Resume update fails | Claim remains, Resume unchanged |
| Network error during sync | Resume save succeeds locally, sync retried on next save |

### Recommended Approach

**Eventual Consistency**:

1. Resume save is **immediate** (client-side + server write-back)
2. Claim sync is **asynchronous** (triggered after Resume save succeeds)
3. Claim sync failures are **retried** on next Resume save
4. Claim sync is **idempotent** (safe to retry)

### Implementation

```typescript
// After successful Resume save:
async function onResumeSaved(resume: Resume) {
  try {
    await syncClaimsFromResume(resume);
  } catch (err) {
    console.error("Claim sync failed, will retry on next save:", err);
    // Don't throw — Resume save already succeeded
  }
}
```

---

## 22. Security

### Ownership Chain

```
Authenticated User
       ↓
ProfessionalIdentity (from session)
       ↓
Resume (owned by PI)
       ↓
Claim (owned by PI)
```

### Required Checks

1. **Resume ownership**: Verify Resume belongs to authenticated user's PI
2. **Claim ownership**: Verify Claim belongs to authenticated user's PI
3. **sourceActivityId validation**: Verify sourceActivityId belongs to a Resume item in the same PI

### Cross-User Protection

A user must never be able to:
- Create Claims against another user's Resume
- Link Claims to another user's Resume items
- Access another user's Claims via sourceActivityId

---

## 23. Schema Impact

### No Schema Changes Required

The existing schema supports synchronization:

1. **Claim.sourceActivityId** — already exists, links to Resume item ID
2. **Claim.professionalIdentityId** — already exists, ensures ownership
3. **Resume.payload** — JSONB, contains Resume items with stable IDs

### Future Schema Changes (Deferred)

| Change | Reason | Deferred To |
|--------|--------|-------------|
| Add `superseded` status | Cleaner deletion semantics | Phase 11+ |
| Add `resumeId` to Claim | Explicit Resume linkage | Not needed (sourceActivityId sufficient) |
| Add `visibility` to Claim | Public/private control | Phase 11+ |

---

## 24. API Design

### No New Endpoints Required

Reuse existing APIs:

| Operation | Existing Endpoint |
|-----------|-------------------|
| Create Claim | `POST /api/claims` |
| Update Claim | `PATCH /api/claims/[claimId]` |
| List Claims | `GET /api/claims` |
| Delete Claim | `DELETE /api/claims/[claimId]` |

### Internal Synchronization Service

```typescript
// src/services/resume-claim-sync.ts

export class ResumeClaimSyncService {
  /**
   * Synchronize Claims from Resume sections.
   * Called after Resume save/update.
   */
  async syncFromResume(
    professionalIdentityId: string,
    resume: Resume
  ): Promise<SyncResult> {
    const results: SyncResult = { created: 0, updated: 0, errors: 0 };
    
    // Sync each section
    for (const section of RESUME_SECTIONS) {
      const items = resume[section] ?? [];
      for (const item of items) {
        try {
          await this.syncItem(professionalIdentityId, section, item);
          results.created++; // or updated++
        } catch (err) {
          results.errors++;
        }
      }
    }
    
    return results;
  }
  
  private async syncItem(
    professionalIdentityId: string,
    section: string,
    item: ResumeItem
  ): Promise<void> {
    const existing = await claimRepository.findBySourceActivityId(item.id);
    
    if (existing) {
      // UPDATE
      await claimService.update(existing.id, professionalIdentityId, {
        assertionText: generateClaimText(section, item),
        // ... material edit detection
      });
    } else {
      // CREATE
      await claimService.create(professionalIdentityId, {
        assertionText: generateClaimText(section, item),
        claimType: mapSectionToClaimType(section),
        sourceActivityId: item.id,
        confidence: 0.5,
        reasoning: "Stated in resume",
      });
    }
  }
}
```

### Trigger Point

```typescript
// In Resume write-back or save handler:
async function onResumeSaved(resume: Resume, identityId: string) {
  // Existing: save Resume to server
  await resumeService.save(resume, identityId);
  
  // New: sync Claims (async, best-effort)
  resumeClaimSyncService.syncFromResume(identityId, resume).catch(err => {
    console.error("Claim sync failed:", err);
    // Will retry on next save
  });
}
```

---

## 25. UI Implications

### No UI Changes Required (Phase 10)

The synchronization is **backend-only**. Users continue editing Resumes as before.

### Future UI Enhancements (Deferred)

| Enhancement | Description | Deferred To |
|-------------|-------------|-------------|
| "Claim created" notification | Show when Resume edit creates a Claim | Phase 11+ |
| "Verification needs review" badge | Show when material edit resets verification | Phase 11+ |
| Resume ↔ Claim link indicator | Show which Resume items have Claims | Phase 11+ |
| Claim source attribution | Show "Created from Resume" on Claims | Phase 11+ |

---

## 26. Product Semantics

### Definitions

| Term | Meaning |
|------|---------|
| **Resume** | Presentation/user editing layer. The primary interface for professional data entry. |
| **Claim** | Canonical professional assertion. The source of truth for identity. |
| **Evidence** | Supporting material attached to Claims. |
| **Verification** | Explicit verification history/status for Claims. |
| **Trust** | Derived support strength from Claims + Evidence + Verification + Conflicts. |
| **Passport** | Public projection of verified professional identity. |

### Relationship

```
Resume (editing interface)
    ↓ (synchronization)
Claim (canonical assertion)
    ↓
Evidence (supporting material)
    ↓
Verification (audit trail)
    ↓
Trust (derived score)
    ↓
Passport (public projection)
```

---

## 27. Open Product Decisions

| Decision | Options | Recommended | Why | Needs Approval? |
|----------|---------|-------------|-----|-----------------|
| Resume → Claim creation | Auto-sync vs. manual | Auto-sync | Reduces user friction | No |
| Claim identity | sourceActivityId vs. other | sourceActivityId | Stable, existing field | No |
| Material edit detection | Heuristic vs. user-defined | Heuristic | Simpler, predictable | No |
| Verification on material edit | Reset to accepted vs. preserve | Reset to accepted | Material change = new fact | No |
| Deletion behavior | Mark superseded vs. delete | Mark superseded | Preserve history | No |
| Multi-resume sharing | Share Claims vs. duplicate | Share Claims | Avoid duplication | No |
| Import behavior | Auto-create Claims vs. manual | Auto-create | Consistent with edits | No |
| Sync trigger | On save vs. background | On save (async) | Simple, reliable | No |
| Failure handling | Retry vs. surface error | Retry silently | Better UX | No |
| User visibility | Show sync status vs. hide | Hide initially | Simpler MVP | No |
| Passport Claim display | All vs. accepted vs. verified | Accepted | Balances completeness/trust | **Yes** |
| Claim selection for Resume | Auto vs. manual | Auto (future) | Better UX | **Yes** |
| Claim independence | Always independent vs. tied to Resume | Always independent | Preserve history | No |

---

## 28. Recommended Architecture

### Conceptual

```
                ProfessionalIdentity
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         │
       Resumes                      │
          │                         │
          │ (synchronization)        │
          ▼                         │
       Claims ◄─────────────────────┘
          │
          ├── Evidence
          ├── Verification
          └── Conflicts
                │
                ▼
            Trust v2
                │
                ▼
           Passport
```

### Implementation Components

```
Resume Builder (Zustand)
       ↓ (on save)
Resume Write-Back Service
       ↓
POST/PUT /api/resumes
       ↓
Resume Repository (PostgreSQL)
       ↓ (async, best-effort)
Resume-Claim Sync Service
       ↓
Claim Service
       ↓
Claim Repository (PostgreSQL)
       ↓ (on next conflict detection)
Conflict Detection Service
       ↓
Trust v2 Derivation
       ↓
Passport Projection
```

---

## 29. Deferred Work

| Item | Deferred To | Reason |
|------|-------------|--------|
| AI claim extraction | Phase 11+ | Requires Gemini integration, cost implications |
| External verification | Phase 12+ | Requires issuer network architecture |
| Cryptographic evidence | Phase 11+ | Requires schema changes, hashing infrastructure |
| `superseded` Claim status | Phase 11+ | Requires schema migration |
| Claim visibility field | Phase 11+ | Requires schema migration |
| Resume ↔ Claim link UI | Phase 11+ | UX enhancement, not architecture |
| Sync status notifications | Phase 11+ | UX enhancement |
| Conflict auto-detection on sync | Phase 11+ | Performance consideration |
| Claim selection for Resume | Phase 11+ | Product decision needed |
| Legacy code cleanup | Phase 10 (optional) | Non-blocking technical debt |

---

## 30. Implementation Plan

### Phase 10A: Core Synchronization (This Design)

1. **Create `ResumeClaimSyncService`** — the synchronization logic
2. **Add claim mapping rules** — Resume section → Claim type mapping
3. **Add assertion text generation** — Resume fields → human-readable Claim text
4. **Add material edit detection** — heuristic for verification reset
5. **Integrate with Resume save** — trigger sync after Resume save
6. **Add idempotency** — deduplication via sourceActivityId
7. **Add failure handling** — retry on next save
8. **Add tests** — sync, dedup, material edit, verification preservation
9. **Update documentation** — MASTER_ARCHITECTURE, roadmap

### Phase 10B: UI Enhancements (Future)

1. Show "Claim created" notifications
2. Show "Verification needs review" badges
3. Show Resume ↔ Claim link indicators
4. Add Claim source attribution

---

## 31. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Sync creates too many Claims | Trust Score inflated | Cap Claims per section, require acceptance |
| Material edit detection too aggressive | Verification lost unnecessarily | Conservative heuristic, user override |
| Sync failures accumulate | Claims out of date | Retry mechanism, manual sync option |
| Multi-resume creates confusion | Same Claim in multiple Resumes | Clear UI, single source of truth |
| Performance impact on save | Resume save slows down | Async sync, background processing |

---

## 32. Final Recommendation

### Architecture Decision

**Resume → Claims synchronization via `sourceActivityId` linkage.**

- No schema changes required
- No new API endpoints required
- Existing `Claim.sourceActivityId` provides the linkage
- Idempotent, eventually consistent, failure-isolated
- Preserves verification, evidence, and historical integrity

### Implementation Priority

**High priority** — this is the single biggest product gap. The entire identity/trust architecture is complete but has no data because Resume edits don't create Claims.

### What This Unlocks

- Trust Score becomes meaningful (has Claims to derive from)
- Passport becomes useful (has professional identity to share)
- Evidence attachment flow becomes natural (evidence attached to Claims)
- Conflict detection becomes useful (Conflicts between Claims)
- The full canonical pipeline has data to work with

---

## 33. Related Documents

- `docs/PHASE-10-ARCHITECTURE-AND-PRODUCT-READINESS-AUDIT.md` — Audit findings
- `docs/adr/ADR-001-CANONICAL-SOURCE-OF-TRUTH.md` — Canonical source of truth
- `docs/adr/ADR-002-PROFESSIONAL-IDENTITY-DOMAIN-MODEL.md` — Domain model
- `docs/MASTER_ARCHITECTURE.md` — Master architecture
- `docs/PATORBIT_PRODUCT_ROADMAP.md` — Product roadmap
