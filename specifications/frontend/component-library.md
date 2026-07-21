# Component Library

## Purpose

This document catalogs the component library for the Patorbit design system — all reusable UI elements organized by category.

## Component Categories

### Basic Inputs

- **Button**: Primary, Secondary, Ghost, Danger, Link — sizes: sm, md, lg.
- **Input**: Text, Email, Password, Number, Search — with label, helper, error states.
- **Select**: Native select with custom styling, searchable select variant.
- **Textarea**: Multi-line input with character count.
- **Checkbox**: Single checkbox, checkbox group.
- **Radio**: Radio group with vertical/horizontal layout.
- **Toggle**: On/off switch with label.
- **DatePicker**: Single date, date range.
- **FileUpload**: Drag-and-drop zone, browse button, progress indicator.

### Navigation

- **Tabs**: Horizontal tabs with content panel.
- **Breadcrumbs**: Page hierarchy navigation.
- **Pagination**: Page number and cursor-based pagination.
- **Stepper / Wizard**: Multi-step progress indicator.
- **Sidebar Navigation**: Collapsible sidebar menu.

### Data Display

- **Table**: Sortable columns, row selection, expandable rows, sticky headers, empty state.
- **Card**: Container with optional header, footer, image.
- **List**: Simple and grouped list items.
- **Badge**: Status badges, count badges, notification dots.
- **Avatar**: Initials, photo, online indicator.
- **Timeline**: Chronological list of events — used for passport career history.
- **Progress Bar**: Linear and circular progress.
- **Skeleton**: Loading placeholder variants.

### Feedback

- **Alert**: Info, success, warning, error — dismissible, with action.
- **Toast**: Temporary notification, auto-dismiss, multiple positions.
- **Modal / Dialog**: Confirmation, form modal, full-screen modal.
- **Drawer**: Slide-in panel from left, right, bottom.
- **Tooltip**: Hover tooltip with delay.
- **Popover**: Rich content on click/hover.

### Layout

- **Container**: Max-width centered wrapper.
- **Grid**: 12-column responsive grid system.
- **Stack**: Vertical and horizontal flex layouts with gap control.
- **Divider**: Horizontal and vertical rules.

### Domain-Specific Widgets

- **PassportViewer**: Structured display of Career Passport with version indicator, claim list, trust badges.
- **PassportEditor**: Interactive editor for passport claims with add/reorder/remove capability.
- **ResumePreview**: Rendered resume preview with page simulation.
- **ClaimCard**: Individual claim with status badge, evidence count, trust score indicator.
- **EvidenceUploader**: Multi-file upload with progress, preview, and delete.
- **VerificationBadge**: Verification status icon with hover detail.
- **TimelineViewer**: Interactive career timeline with zoom, filter by type.
- **KnowledgeGraphWidget**: Graph visualization of connected claims, skills, organizations.
- **SkillTag**: Auto-complete skill input with confidence indicator.
- **CandidateCard**: Search result card with key claims, match score.
- **RecruiterSearchBar**: Advanced search with filters, facets, saved searches.
- **OrgSwitcher**: Multi-workspace selector dropdown.

### AI Widgets

- **AIAssistantPanel**: Collapsible chat panel for AI interactions.
- **SuggestionChip**: Inline AI suggestion with accept/dismiss.
- **AnalysisProgress**: AI processing progress indicator.
- **ConfidenceIndicator**: Visual confidence bar for AI outputs.

## Component Metadata

Every component is specified by:

- **Name**: PascalCase component name.
- **Description**: One-line purpose.
- **Props**: TypeScript interface with descriptions.
- **Variants**: Style variants (color, size).
- **States**: Default, hover, active, disabled, loading, error, empty.
- **Accessibility**: ARIA roles, keyboard interactions, focus management.
- **Examples**: Code usage examples.
- **Related**: Cross-references to similar components.

## References

- [Component Guidelines](component-guidelines.md): Lifecycle and composition.
- [Design System](design-system.md): Philosophy and governance.
- [Forms](forms.md): Form-specific components.
