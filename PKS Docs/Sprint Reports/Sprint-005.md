# Sprint 5: Resume Theme Engine & PDF Export

## Goal

This sprint will focus on implementing a dynamic theme engine for the Resume Builder and adding PDF export functionality. This will give users creative control over their resume's appearance and allow them to share it externally.

## Key Features & User Stories

- **As a user, I want to choose from different visual themes for my resume so I can select a style that fits my personality and industry.**
- **As a user, I want to see a live preview of my resume update instantly when I switch themes.**
- **As a user, I want to download a high-quality PDF of my resume to share with recruiters and upload to job applications.**

## Technical Plan

### 1. Resume Theme Engine

- **Theme Registry (`apps/web/src/components/resume/templates/registry.ts`)**:
  - Create a central registry to define and export all available resume templates. Each template entry will include a `name`, a `component` (the React component for the template), and a `thumbnail` image.

- **Template Components (`apps/web/src/components/resume/templates/`)**:
  - Create individual template components (e.g., `TemplateDefault.tsx`, `TemplateModern.tsx`).
  - These components will be responsible for rendering the resume data in a specific visual style. They will receive resume data as props.

- **Section Renderers (`apps/web/src/components/resume/templates/section-renderers.tsx`)**:
  - Develop a set of shared components for rendering common resume sections (e.g., `ExperienceSection`, `EducationSection`).
  - These renderers will be used by the main template components to ensure consistency and reduce code duplication.

- **Theme Panel (`apps/web/src/components/resume/resume-theme-panel.tsx`)**:
  - Build a new UI panel that displays the available themes from the registry.
  - Clicking a theme in the panel will update the `theme` state in the `useResumeStore`.

- **Template Factory (`apps/web/src/components/resume/templates/template-factory.tsx`)**:
  - Create a "factory" component that dynamically renders the selected theme's component based on the `theme` state from the Zustand store.
  - This component will act as the bridge between the theme selection UI and the resume preview area.

- **State Management (`apps/web/src/lib/stores/use-resume-store.ts`)**:
  - Add a `theme` property to the resume store to track the currently selected theme.
  - Add an action to update the theme.

### 2. PDF Export

- **PDF Export Hook (`apps/web/src/lib/hooks/use-pdf-export.ts`)**:
  - Create a custom hook that encapsulates the logic for exporting a React component to a PDF.
  - This hook will likely use a library like `html2canvas` and `jspdf` or a more integrated solution like `@react-pdf/renderer`.
  - It should expose a function to trigger the download and manage the loading state.

- **Integration**:
  - Add a "Download PDF" button to the `ResumeEditorLayout`.
  - The button will use the `usePdfExport` hook to capture the `ResumePreview` component and initiate the download.
  - The file name should be dynamically generated (e.g., `Resume-John-Doe.pdf`).

## Out of Scope

- Creating more than 2-3 initial themes.
- Advanced theme customization (e.g., changing colors, fonts).
- Server-side PDF generation.

## Verification & Definition of Done

- The "Themes" panel is visible in the resume editor.
- Users can click a theme and the resume preview updates instantly to the new style.
- The selected theme is persisted as part of the resume data.
- Clicking the "Download PDF" button successfully downloads a PDF file that accurately matches the on-screen preview.
- The implementation introduces no new TypeScript errors or linting violations.
