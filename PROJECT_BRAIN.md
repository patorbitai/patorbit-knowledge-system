# Patorbit Knowledge System — Engineering Memory

## Sprint 0 — Development Stabilization

### Completed

- Fixed backend TypeScript compilation errors in `event-bus.service.ts` and `event-bus.module.ts`.
- Created `apps/web/src/app/globals.css` with `@tailwind` directives and theme CSS variables.
- Created Developer Mode page at `/dev`.
- Fixed redirect loop on homepage.

---

## Sprint 1 — Zustand Store Refactoring

### Completed

- Extracted UI state (`isAddSectionModalOpen`, `selectedSectionId`) from local component state into the existing Zustand store.
- Removed `CustomEvent` communication between `ResumeSectionNav` and `ResumeEditor` in favor of store-driven state.
- Created `SPRINT_1_COMPLETION_REPORT.md`.
- Validated zero TypeScript errors across all modified files.

---

## Sprint 2 — Resume Builder Production Readiness

### Completed

**Phase 1: Architecture Review**

- Analyzed resume API endpoints, service layer, API client (`api.ts`), Zustand store, and existing save logic.
- Documented data flow, missing pieces, and implementation plan in `ARCHITECTURE_REVIEW.md`.

**Phase 2: Resume Persistence**

- Added `createResume` action to `useResumeStore` (POST `/resumes`).
- Existing `loadResume`, `updateSectionContent`, `flushSection` already covered load/update/save.

**Phase 3: Auto Save**

- Reduced debounce from 1200ms → 800ms.
- Added `AbortController`-based request cancellation to prevent race conditions on rapid typing.
- Created `ResumeSaveIndicator` component showing save status: idle → saving → saved → error.
- Added `saveState` namespace to store: `status`, `isDirty`, `lastSaved`, `error`.

**Phase 4: Dirty State**

- Added `isDirty` flag to store, set on any content change, cleared on successful save.
- Created `useWarnOnUnsavedChanges` hook with `beforeunload` event listener.
- Integrated unsaved-changes warning into `ResumeEditorLayout`.

**Phase 5: Validation**

- Created `apps/web/src/lib/validation/resume.ts` with Zod schemas for all 12 section types.
- Added `validateSection` and `clearValidation` actions to store.
- Validation runs automatically on every `updateSectionContent` call (real-time inline validation).
- Added `validationErrors` state to store keyed by section ID.

**Phase 6: Error Handling**

- Added `withRetry` helper: exponential backoff (1s, 2s), 2 retries, AbortError-aware.
- Added `navigator.onLine` check to detect offline state and skip retries.
- Transient failures do not cause data loss.

**Phase 7: State Management**

- Organized store into clear namespaces: `resume`, `ui`, `saveState`, `validationErrors`.
- No new global stores created — all state remains in existing `useResumeStore`.

**Phase 8: Performance**

- Removed stale `useEffect` custom event listeners.
- Efficient store selectors prevent unnecessary re-renders.
- Preview stays synchronized via the existing reactive Zustand pattern.

**API Client Changes**

- Extended `api.ts` with `ApiOptions` type supporting `signal` parameter.
- Updated `post`, `get`, `patch`, `del` to pass `options` through to `request`.

### Files Added

- `apps/web/src/lib/validation/resume.ts`
- `apps/web/src/components/resume/resume-save-indicator.tsx`
- `apps/web/src/lib/hooks/use-warn-unsaved.ts`
- `ARCHITECTURE_REVIEW.md`

### Files Modified

- `apps/web/src/lib/stores/use-resume-store.ts` — Core refactor
- `apps/web/src/lib/api.ts` — Signal support
- `apps/web/src/components/resume/resume-editor-layout.tsx` — Save indicator + unsaved warning

### Critical Decisions

- **Debounce at 800ms**: Balances responsiveness with API call reduction; fast enough to feel instant, slow enough to batch adjacent keystrokes.
- **AbortController over ignore-in-flight**: Cancelling stale requests prevents "ghost saves" where an old PATCH resolves after a newer one, overwriting data.
- **withRetry with exponential backoff**: 2 retries at 1s/2s intervals cover transient network blips without excessive waiting.
- **Zod over class-validator**: Already a project dependency via `resume-form-provider.tsx`; consistent tooling.
- **`saveState.status` auto-resets to idle after 2s**: Gives users clear visual feedback without permanent UI clutter.
- **Single Zustand store**: Preserves the Sprint 1 architecture decision to avoid multiple global stores.

### Known Issues

- Field-level validation errors are stored and computed but not yet rendered inline in section editors (Sprint 3 scope).
- No explicit offline indicator beyond failed-save messaging.
- `withRetry` does not persist queued saves to localStorage for crash recovery.

### Next Sprint (Recommended Sprint 4 Scope)

1. Render inline validation error messages in `PersonalInfoEditor`, `SummaryEditor`, etc.
2. Add localStorage persistence for offline queue (crash recovery).
3. Add `React.memo` to section editor components for further render optimization.
4. UI polish for save indicator positioning.

---

## Sprint 3.5 — Quality Sprint

### Completed

**Phase 1: Testing Infrastructure**

- Created `vitest.config.ts` for `apps/web` with jsdom environment
- Set up `tests/setup.ts` with browser API mocks (`matchMedia`, `IntersectionObserver`, `ResizeObserver`)
- Created `tests/test-utils.tsx` with custom render function
- Created `tests/mocks/resume-data.ts` with reusable mock resume fixtures
- Added `test`, `test:watch`, `test:ui` scripts to `apps/web/package.json`

**Phase 2: Unit Tests (87 tests across 4 files)**

- **Validation schemas (51 tests):** Comprehensive coverage for all 12 Zod schemas plus `getSectionSchema` — valid input acceptance, boundary values, and rejection of invalid data
- **Offline queue (9 tests):** IndexedDB-backed queue CRUD operations using `fake-indexeddb` — enqueue, dequeue, getAll (sorted by timestamp), clearAll
- **API client (15 tests):** HTTP method coverage (GET, POST, PATCH, DELETE), authorization header management, error handling (ApiError, network errors), query parameters, abort signal passthrough
- **Zustand store (12 tests):** Resume loading (success/error), optimistic section content updates with debounced flush, offline queuing on save, queue processing (online skip, full replay, partial failure), store reset

**Phase 3: Accessibility Improvements**

- Added `aria-live="polite"` region to `ResumeAutosaveIndicator` so sync status changes are announced to screen readers
- Added proper form labels: visually hidden `<label>` for resume title input in `ResumeHeader`
- Fixed nested interactive elements in `ResumeSectionNav` — separated navigation button from visibility toggle
- Added `aria-label` attributes to all icon-only buttons (delete, visibility toggle, drag handle, skill remove)
- Decorated icon-only content with `aria-hidden="true"` spans
- Added `aria-expanded`, `aria-controls`, `aria-label` to mobile nav toggle button
- Added `id="resume-section-nav"` to nav `<aside>` for aria-controls linkage
- Added `role="dialog"`, `aria-modal="true"`, `aria-labelledby` to Add Section modal

### Files Added

- `apps/web/vitest.config.ts`
- `apps/web/tests/setup.ts`
- `apps/web/tests/test-utils.tsx`
- `apps/web/tests/mocks/resume-data.ts`
- `apps/web/src/lib/validation/resume.spec.ts`
- `apps/web/src/lib/services/offline-queue.spec.ts`
- `apps/web/src/lib/api.spec.ts`
- `apps/web/src/lib/stores/use-resume-store.spec.ts`

### Files Modified

- `apps/web/package.json` — Added test scripts
- `apps/web/tsconfig.json` — Added vitest.config.ts to include
- `apps/web/src/components/resume/resume-autosave-indicator.tsx` — ARIA live region
- `apps/web/src/components/resume/resume-header.tsx` — Form label
- `apps/web/src/components/resume/resume-editor-layout.tsx` — ARIA attributes for nav toggle
- `apps/web/src/components/resume/resume-editor.tsx` — ARIA labels on icon buttons
- `apps/web/src/components/resume/resume-section-nav.tsx` — Fixed nested buttons
