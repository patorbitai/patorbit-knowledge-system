# ADR-0002: Resume Builder Workspace

**Status:** Accepted  
**Date:** 2026-08-07  
**Type:** Implementation ADR  
**Implements:** `patorbit-docs/04_ADR/ADR-001` (AI Provider), `ADR-004` (Hub separation)

---

## Context

The Resume Builder is the first feature users encounter after registering. It must work fast, offline, and with zero data loss on browser refresh. It also houses the AI Copilot (ADR-001), template system, and export pipeline.

This ADR records the implementation decisions for the Resume Builder workspace: layout, state, persistence, AI integration, templates, and export.

---

## Decisions

### 1. Three-Column Layout

```
┌──────────────┬──────────────────────┬────────────────┐
│ LeftSidebar  │  CenterWorkspace     │  RightCopilot  │
│  (240px)     │  (flex 1)            │  (320px)       │
│              │                      │                │
│ Section nav  │  Active section      │  AI analysis   │
│ Progress     │  editor              │  Job match     │
│ Import       │                      │  Suggestions   │
│ Templates    │                      │                │
└──────────────┴──────────────────────┴────────────────┘
```

- Left and right panels are collapsible
- Center workspace is the primary editing surface
- Template preview renders in a separate tab/route (`/resume-builder/preview`)

### 2. Zustand Store as Single Source of Truth

**Key:** `"patorbit-resume-v2"`  
**File:** `src/store/resume-builder.ts`  
**Partialize:** `{ resume, evidence }` only (AI/UI state is ephemeral, not persisted)

The store is the **only** thing that writes to `localStorage`. All section editors mutate the store; no component writes directly to storage.

**Auto-expand pattern (Sprint 4.4):**  
After adding a new section item, the new item's ID is read synchronously via `useResumeBuilder.getState()` (direct store access, bypasses React render cycle) and added to `expandedIds`. This avoids a double-click UX without introducing async delays.

```ts
const handleAddExperience = () => {
  addExperience();
  const newId = useResumeBuilder.getState().resume.experience.at(-1)?.id;
  if (newId) setExpandedIds((prev) => new Set([...prev, newId]));
};
```

### 3. Accordion Section Pattern

Every section editor (Experience, Education, Projects, Certifications, etc.) uses a local `expandedIds: Set<string>` state. This state is **not persisted** — sections open collapsed on load, encouraging focused editing.

### 4. AI Integration

Follows ADR-001's single endpoint pattern:

```
Component → ai.generateSummary(resume)
         → POST /api/ai { action, data }
         → AIService.handle(action, data)
         → OpenAI GPT-4
         → { success: true, data: { content } }
         → Component updates Zustand store
```

13 action types available. AI state (loading, results, errors) is ephemeral Zustand state, not persisted.

### 5. Template System

**22 templates** registered in `src/app/resume-builder/templates.ts`. Each has:
- `id` — stable kebab-case identifier (frozen per ADR-0004)
- `name` — display name
- `component` — React component reference
- `atsRating` — numeric 79–94
- `category` — `professional` | `creative` | `minimal` | `executive`
- `fonts` — supported font subset
- `palettes` — supported color palette subset

Template components live in `src/app/resume-builder/template-components/`. Each receives a `Resume` object and renders it as a styled document (white background, print-safe).

### 6. Export Pipeline

Three export paths, each with different capabilities:

| Path | Trigger | Engine | Page-break control |
|---|---|---|---|
| PDF | Export button | html2canvas + jsPDF | ❌ None (pixel capture) |
| Browser print | Ctrl+P | CSS `@media print` | ✅ `break-inside: avoid` |
| DOCX | Export button | `docx` npm (server-side) | ✅ Paragraph control |

**Known limitation:** html2canvas is pixel-based; CSS `break-inside` has no effect on PDF export. This is documented as `KNOWN_ISSUES.md` H-01. The long-term fix requires replacing html2canvas with a layout-aware renderer.

**PDF target:** `#pdf-export-target` div is rendered off-screen at 210mm width before capture.

### 7. Error Handling

- All `alert()` calls replaced with inline `role="alert"` error components (Sprint 4.6)
- `exportToDocx` re-throws errors; callers own error display
- Import errors surface in `LeftSidebar` below the import button
- DOCX export errors surface in `ExportModal` as an inline banner

---

## Consequences

**Positive:**
- Offline-first: zero data loss on browser refresh or network drop
- Fast editing: no server round-trips for state changes
- Simple mental model: one store, one persist key

**Trade-offs:**
- No multi-device sync (localStorage is per-browser)
- No multi-resume support (single resume per user, MVP constraint)
- PDF quality limited by html2canvas pixel capture

**Future migration path:**
- Add `Resume` model to Prisma → sync Zustand to DB on save
- Resume data becomes `{ resume, evidence }` fetched from API on hydration
- Zustand store transitions from primary storage to local cache

---

## Cross-References

| ADR | Relationship |
|---|---|
| `patorbit-docs/04_ADR/ADR-001` | AI provider abstraction this implements |
| `patorbit-docs/04_ADR/ADR-004` | Hub separation: Resume Builder is an input, not the Hub |
| `patorbit-docs/04_ADR/ADR-005` | Evidence panel placed in VerificationBadge (interim) |
| `docs/adr/0004-template-id-policy.md` | Template IDs are frozen |
| `docs/KNOWN_ISSUES.md` | H-01: PDF page-break limitation |
