# Sprint 4: Architecture Audit & Cleanup

## Goal

This sprint focused on a comprehensive architecture audit and cleanup of the PKS monorepo. The primary objective was to streamline the codebase, remove obsolete packages, refactor key services for better testability, and align the project with a more focused, maintainable structure.

## Completed

- **Package Consolidation**:
  - Removed the `@patorbit/ai` and `@patorbit/notifications` packages. Their functionality was either deprecated or absorbed into the API.
  - Simplified the `platform` module within the API, removing the `events` and `observability` sub-modules.

- **API Refactoring**:
  - **`EventBusService`**: Refactored to be more test-friendly by using an in-memory handler store and `ModuleRef` for dynamic provider resolution. This removed complex `require()` calls.
  - **`RetryService`**: Clarified the `maxRetries` logic to mean total attempts and added `executeWithCallback` for easier testing.
  - **`StorageService`**: Adapted client code to match the new, more generic API provided by the `@patorbit/storage` package.
  - **Resume Parsing**: Improved resume import logic by adding `rawText` and `metadata` to the `ImportResultDto` and ensuring correct type mapping.

- **Dependency Management**:
  - Removed duplicate `@types/node` from `apps/web`.
  - Aligned the root TypeScript version with all workspace packages to ensure consistency.

- **Deployment & CI/CD**:
  - Added a `render.yaml` configuration for deployment on the Render platform.
  - Introduced a GitHub Actions workflow for continuous integration and deployment.

- **Documentation**:
  - Initialized the project's formal documentation structure, including `CLAUDE.md` and a project "brain" to centralize knowledge.

## Files Removed

- `packages/ai/`
- `packages/notifications/`
- `apps/api/src/platform/events/`
- `apps/api/src/platform/observability/`
- Obsolete Claude worktree metadata (`.claude/`)

## Files Modified

- `pnpm-lock.yaml` and `package.json` files across the repo to reflect removed packages.
- `apps/api/src/platform/event-bus/event-bus.service.ts`
- `apps/api/src/platform/retry/retry.service.ts`
- `apps/api/src/modules/resume/import.service.ts`
- `apps/api/src/modules/storage/storage.service.ts`
- `apps/web/package.json`
- `tsconfig.json` (root)

## Technical Decisions

- **Focus on Core Features**: The removal of `ai` and `notifications` packages was a strategic decision to focus the project on its core knowledge management and career passport capabilities.
- **Testability First**: Refactoring services like `EventBusService` and `RetryService` was prioritized to improve the overall test coverage and reliability of the API.
- **Standardized Deployment**: Choosing GitHub Actions and Render provides a modern, maintainable, and scalable CI/CD and hosting solution.

## Verification

- All builds are passing.
- Tests related to refactored services were updated and are passing.
- The application remains deployable and functional after the significant cleanup.

## Recommended Sprint 5 Scope

With the codebase now cleaner and more focused, Sprint 5 should pivot back to user-facing features and resume-builder enhancements.

1.  **Resume Theme Engine**: Implement a dynamic theme engine for the resume preview.
    - Create a template registry and a `TemplateFactory` component.
    - Develop at least two distinct resume themes (e.g., "Modern", "Classic").
    - Allow users to switch themes and see the preview update in real-time.
2.  **PDF Export**: Add functionality to export the resume preview as a PDF.
    - Integrate a library like `@react-pdf/renderer` or `html2pdf.js`.
    - Create a `usePdfExport` hook to manage the export process.
    - Add a "Download PDF" button to the UI.
3.  **UI for Validation Errors**: Connect the existing validation logic from Sprint 2 to the UI, displaying error messages next to the relevant fields in the resume editor.
