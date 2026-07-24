# Changelog

All notable changes to the Patorbit Knowledge System will be documented in this file.

## Sprint 3.5 — Quality Sprint

### Added

- **Testing Infrastructure (`apps/web`)**:
  - Created `vitest.config.ts` with jsdom environment and path aliases.
  - Added test setup (`tests/setup.ts`) with browser API mocks (matchMedia, IntersectionObserver, ResizeObserver).
  - Created reusable test utilities (`tests/test-utils.tsx`) and mock data fixtures (`tests/mocks/resume-data.ts`).
  - Added 87 unit tests across 4 files: validation schemas (51), offline queue (9), API client (15), and Zustand store (12).
- **Test Scripts**: Added `test`, `test:watch`, and `test:ui` commands to `apps/web/package.json`.

### Improved

- **Accessibility (`apps/web`)**:
  - Added `aria-live="polite"` region to `ResumeAutosaveIndicator` for screen reader announcements of save status.
  - Fixed nested interactive controls in `ResumeSectionNav` — separated navigation from visibility toggle.
  - Added `aria-label` attributes to all icon-only buttons (visibility, delete, drag handle, skill remove).
  - Added visually hidden `<label>` to resume title input in `ResumeHeader`.
  - Decorated icon-only content with `aria-hidden="true"` spans.
  - Added `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` to the Add Section modal.
  - Added `aria-expanded`, `aria-controls`, and explicit `aria-label` to the mobile navigation toggle.
  - Added `id="resume-section-nav"` to nav `<aside>` for `aria-controls` linkage.

## Sprint 2 — Production-Ready Resume Builder

### Added

- **Auto-Save Mechanism**: Implemented debounced auto-save (800ms) with request cancellation via `AbortController` to prevent race conditions.
- **Dirty State Tracking**: Added `isDirty` flag and `beforeunload` event listener to warn users before navigating away with unsaved changes.
- **Save Status Indicator**: Created a `ResumeSaveIndicator` component to display save status (`Saving...`, `Saved`, `Error`) in the UI.
- **Inline Validation**: Added Zod schemas for all 12 section types in `apps/web/src/lib/validation/resume.ts`. Validation now runs automatically on content change.
- **Error Handling**: Implemented a `withRetry` helper with exponential backoff and offline detection for all save operations, making data persistence more robust.
- **`createResume` Action**: Added a new action to the Zustand store for creating new resumes via `POST /resumes`.

### Changed

- **Zustand Store (`use-resume-store.ts`)**:
  - Refactored state into clear namespaces: `resume`, `ui`, `saveState`, `validationErrors`.
  - Replaced local `isSaving` and `saveError` state with the centralized `saveState` object.
  - Reduced debounce timer from 1200ms to 800ms for a more responsive feel.
- **API Client (`api.ts`)**:
  - Updated `post`, `get`, `patch`, and `del` methods to accept an `ApiOptions` object with an `AbortSignal`, enabling request cancellation.

### Fixed

- Corrected a bug where the `signal` option was being passed as headers instead of as a dedicated option to `fetch`.

### Improved

- **Decoupling**: State management is now fully centralized in the Zustand store, removing component-level state for save status and modal visibility.
- **Maintainability**: Clearer state organization and dedicated validation schemas improve code clarity and ease of future maintenance.
- **User Experience**: Users now have clear feedback on save status and are protected from accidentally losing work.

## Sprint 1 — Zustand Store Refactoring

### Changed

- Refactored UI state management (`isAddSectionModalOpen`, `selectedSectionId`) from local component state into the existing Zustand store.
- Replaced `CustomEvent` communication between `ResumeSectionNav` and `ResumeEditor` with centralized store actions.

## Sprint 0 — Development Stabilization

### Fixed

- Resolved backend TypeScript compilation errors in the event bus module.
- Corrected a redirect loop on the application's home page.

### Added

- Integrated Tailwind CSS and the global design system.
- Created a development-only page at `/dev` for internal tooling.
