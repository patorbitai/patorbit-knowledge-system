# Sprint 2 — Architecture Review

## 1. Current Data Flow

### Resume Loading

```
Component → store.loadResume(id) → api.get('/resumes/:id')
                                  → store.set({ resume: data, isLoading: false })
                                  → UI re-renders
```

### Resume Saving (Content Change)

```
User types in editor → updateSectionContent(id, content)
                      → Immediate: store.resume.sections updated → preview refreshes
                      → Debounced (1200ms): scheduleFlush → flushSection(id)
                                               → api.patch('/resumes/:id/sections/:id', { content })
                                               → store.set({ lastSaved: new Date(), isSaving: false })
```

### Resume Saving (Title)

```
User edits title → setTitle(title)
                  → Immediate: store.resume.title updated
                  → Debounced (1200ms): flushTitle → api.patch('/resumes/:id', { title })
```

### Section Add/Delete/Reorder

```
Add:   optimistic local update → api.post → rollback on failure
Delete: optimistic local update → api.del → rollback on failure
Reorder: optimistic local update → api.patch('/reorder') → rollback on failure
```

### UI State (Sprint 1)

- `ui.isAddSectionModalOpen` — modal visibility
- `ui.selectedSectionId` — active section in nav

## 2. API Endpoints (Existing)

| Method | Path                                     | Purpose                                        |
| ------ | ---------------------------------------- | ---------------------------------------------- |
| POST   | `/resumes`                               | Create resume                                  |
| GET    | `/resumes`                               | List (paginated)                               |
| GET    | `/resumes/:id`                           | Get single resume with sections                |
| PATCH  | `/resumes/:id`                           | Update resume (title, status, theme, metadata) |
| DELETE | `/resumes/:id`                           | Soft delete                                    |
| POST   | `/resumes/:id/duplicate`                 | Duplicate                                      |
| POST   | `/resumes/:id/archive`                   | Archive                                        |
| POST   | `/resumes/:id/versions`                  | Create snapshot                                |
| GET    | `/resumes/:id/versions`                  | List versions                                  |
| POST   | `/resumes/:resumeId/sections`            | Add section                                    |
| PATCH  | `/resumes/:resumeId/sections/:id`        | Update section                                 |
| PATCH  | `/resumes/:resumeId/sections/reorder`    | Reorder sections                               |
| DELETE | `/resumes/:resumeId/sections/:id`        | Delete section                                 |
| PATCH  | `/resumes/:resumeId/sections/:id/toggle` | Toggle visibility                              |

**Auth:** All endpoints guarded by `@UseGuards(JwtAuthGuard)`.

## 3. Prisma Models (Key Fields)

### Resume

- `id` (String, CUID), `profileId` (FK→Profile), `title` (String)
- `status` (DRAFT | ACTIVE | ARCHIVED)
- `templateId` (String?), `theme` (Json?), `metadata` (Json?)
- `version` (Int, default 1) — **optimistic locking available but unused**
- Soft delete via `deletedAt`

### ResumeSection

- `id`, `resumeId` (FK→Resume), `type` (enum SectionType)
- `title`, `sortOrder`, `isVisible`, `isCollapsible`, `isCollapsed`
- `content` (Json?), `metadata` (Json?)
- `version` (Int, default 1) — **optimistic locking available but unused**

## 4. Existing Save Logic Analysis

### Strengths

- Immediate local update for responsive UX
- Debounced auto-save prevents excessive API calls
- Optimistic updates with rollback on failure
- Error messages displayed to user

### Weaknesses / Missing Pieces

| Gap                                 | Impact                                                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **No dirty state tracking**         | No `beforeunload` warning; users can navigate away and lose work                                             |
| **No save status indicator**        | Users see no "Saved"/"Saving..." feedback                                                                    |
| **No centralized validation**       | Validation only in `resume-form-provider.tsx` (Zod + react-hook-form); no inline field validation            |
| **No request cancellation**         | Race conditions possible: PATCH 1 (slow) → PATCH 2 (fast) → PATCH 1 resolves → stale data overwrites PATCH 2 |
| **No retry logic**                  | Network failures cause data loss (optimistic changes roll back, user re-types)                               |
| **No offline detection**            | No indication when user is offline                                                                           |
| **`version` field unused**          | No optimistic concurrency control; simultaneous edits can silently conflict                                  |
| **Debounce too long (1200ms)**      | Users wait over a second for save confirmation                                                               |
| **`createResume` missing**          | No API action to create a new resume from the store                                                          |
| **No `ResumeProvider` integration** | Provider exists but store is accessed directly in parallel                                                   |

## 5. Implementation Plan

### Phase 1 — Architecture Review (this document) ✅

### Phase 2 — Resume Persistence

1. Add `createResume` action to useResumeStore
2. No other changes needed — load/update/save already exist

### Phase 3 — Auto Save (Refinement)

1. Reduce debounce from 1200ms → 800ms
2. Add AbortController for request cancellation
3. Track save status in store: `saveStatus: 'idle' | 'saving' | 'saved' | 'error'`
4. Create `ResumeSaveIndicator` component
5. Integrate indicator into `resume-editor-layout.tsx`

### Phase 4 — Dirty State

1. Add `isDirty` tracking to store
2. Add `hasPendingChanges` flag
3. Add `beforeunload` event listener
4. Track changed section IDs

### Phase 5 — Validation

1. Create validation schemas per section type (Zod)
2. Extract validation from `resume-form-provider.tsx` into reusable utilities
3. Add inline validation display to editors
4. Prevent save of invalid data

### Phase 6 — Error Handling

1. Add retry wrapper for failed API calls (3 attempts, exponential backoff)
2. Add offline detection
3. Store pending changes in sessionStorage for crash recovery
4. Graceful degradation when offline

### Phase 7 — State Management

1. Organize store into clear namespaces:
   - `resume` — resume data
   - `ui` — UI state (existing)
   - `saveState` — save status, isDirty, lastSavedAt
   - `validation` — validation errors per field
   - No new store creation

### Phase 8 — Performance

1. Add React.memo to section editors and cards
2. Add `shallow` equality check for store selectors
3. Optimize preview synchronization
4. Prevent unnecessary re-renders

## 6. Files to Modify

| File                                                       | Changes                                                                                     |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `apps/web/src/lib/stores/use-resume-store.ts`              | Add `createResume`, `saveStatus`, `isDirty`, validation state, AbortController, retry logic |
| `apps/web/src/lib/validation/resume.ts`                    | **New:** Validation schemas per section type                                                |
| `apps/web/src/components/resume/resume-editor.tsx`         | Add inline validation, show errors, connect save status                                     |
| `apps/web/src/components/resume/resume-editor-layout.tsx`  | Add `ResumeSaveIndicator`, `beforeunload` hook                                              |
| `apps/web/src/components/resume/resume-save-indicator.tsx` | **New:** "Saving..."/"Saved"/"Error" badge                                                  |
| `apps/web/src/components/resume/resume-section-nav.tsx`    | Show validation errors per section                                                          |
| `apps/web/src/components/resume/index.ts`                  | Export new component                                                                        |
