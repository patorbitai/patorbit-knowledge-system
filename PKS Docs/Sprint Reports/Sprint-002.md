# Sprint 2 — Resume Builder Production Readiness

## Goal

Transform the Resume Builder from a UI prototype into a production-ready editor with reliable persistence, auto-save, validation, and error recovery.

## Completed

- Architecture analysis of resume API endpoints, store, and save logic
- `createResume` action for POST `/resumes`
- Auto-save: 800ms debounce, `AbortController` cancellation, `saveState` status tracking
- `ResumeSaveIndicator` showing Saving/Saved/Error states
- `useWarnOnUnsavedChanges` hook with `beforeunload` protection
- Zod validation schemas for all 12 section types
- `validateSection` / `clearValidation` actions triggered on content change
- `withRetry` helper (2 retries, exponential backoff, offline detection)
- API client extended with `AbortSignal` support
- Store organized into `resume`, `ui`, `saveState`, `validationErrors` namespaces

## Files Added

- `apps/web/src/lib/validation/resume.ts`
- `apps/web/src/components/resume/resume-save-indicator.tsx`
- `apps/web/src/lib/hooks/use-warn-unsaved.ts`
- `ARCHITECTURE_REVIEW.md`

## Files Modified

- `apps/web/src/lib/stores/use-resume-store.ts`
- `apps/web/src/lib/api.ts`
- `apps/web/src/components/resume/resume-editor-layout.tsx`

## Technical Decisions

- **800ms debounce**: balances responsiveness with API reduction
- **AbortController**: prevents ghost saves from stale requests
- **Zod**: already in project dependencies, consistent tooling
- **Single Zustand store**: preserve Sprint 1 architecture
- **`saveState` auto-resets to idle after 2s**: clear feedback without clutter

## Verification

- Zero TypeScript errors across all files
- Validation runs automatically on content change
- Save cancellation prevents race conditions
- Users warned before navigating away with unsaved changes
- Retry logic handles transient network failures

## Known Limitations

- Inline validation errors not yet rendered in section editors (Sprint 3)
- No offline queue beyond save failure messaging
- No `React.memo` on section editor components

## Recommended Sprint 3 Scope

1. Render validation errors inline in editor components
2. Add localStorage persistence for offline crash recovery
3. Unit tests for `useResumeStore` actions
4. `React.memo` for render optimization
