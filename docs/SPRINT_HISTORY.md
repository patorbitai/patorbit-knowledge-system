# Sprint History

**Last Updated:** 2026-08-07  
**Format:** Sprint goals → delivered → deferred → notes

---

## Sprint 4 — Production Polish

**Period:** 2026-07 → 2026-08-07  
**Goal:** Eliminate rough edges before Sprint 5 feature work; production-ready UX

### Delivered

#### Sprint 4.1 — Deployment Version Detection
- Added `/api/version` endpoint returning `{ sha, timestamp }`
- `useDeploymentVersion` hook polls every 12 minutes + on `visibilitychange` and `online` events
- `DeploymentUpdateBanner` component: glassmorphism toast (bottom-right), shows current/new SHA, relative time, "Refresh Now" CTA
- **Files:** `src/hooks/useDeploymentVersion.ts`, `src/components/common/DeploymentUpdateBanner.tsx`, `src/app/api/version/route.ts`, `src/app/layout.tsx`

#### Sprint 4.2 — Dashboard Breadcrumb & Timeline Fix
- Resume Builder header breadcrumb: `← Dashboard > Resume Builder [name]` with animated back arrow
- Platform timeline circles: changed from hardcoded `top-8` to `top-1/2 -translate-y-1/2`; nodes now align with card midpoint regardless of card height
- `SaveStatusIndicator`: replaced cloud icon + "Cloud Synced" with `HardDrive` icon + "Saved locally" to accurately reflect localStorage-only persistence
- Duplicate localStorage autosave removed: deleted `debouncedSave` function that was writing incomplete state shape; Zustand persist is now sole writer
- **Files:** `src/components/resume-builder/SaveStatusIndicator.tsx`, `src/app/resume-builder/page.tsx`, marketing platform page

#### Sprint 4.3 — Dark Elegance Template Print Redesign
- Complete rewrite of `dark-elegance.tsx`: white paper background (`bg-white`), charcoal ink (`#111827`), charcoal left-border accent on header section
- Removed: dark background rectangles (caused black blobs in PDF export), ATS-hostile emoji contact icons, light-on-dark text
- Added: `break-inside-avoid` on every `article`, `print:shadow-none print:rounded-none`
- Uses `FormattedDescription` and `SocialLinks` from `shared.tsx`
- **Files:** `src/app/resume-builder/template-components/dark-elegance.tsx`

#### Sprint 4.4 — Auto-Expand Newly Added Section Items
- Problem: adding Experience/Education/Project/Certification item required two clicks (Add then manually expand)
- Solution: synchronous Zustand state read via `useResumeBuilder.getState()` after mutating action; new ID extracted and added to `expandedIds` Set immediately
- All four section editors updated with `handleAddX` wrappers
- Removed stale top-level `resume` selector from `ProjectsSection.tsx` (was unused after refactor)
- **Files:** `ExperienceSection.tsx`, `EducationSection.tsx`, `ProjectsSection.tsx`, `CertificationsSection.tsx`

#### Sprint 4.5 — Remove Hover Scale Jitter from Inputs
- Problem: `whileHover={{ scale: 1.01 }}` on Full Name and Professional Title field wrappers caused visual jitter while typing
- Removed two `motion.div` wrappers; replaced with plain `div`
- Removed now-unused `framer-motion` import from `PersonalSection.tsx`
- Focus rings, border animations, glow, validation indicators unchanged
- **Files:** `src/components/resume-builder/sections/PersonalSection.tsx`

#### Sprint 4.6 — Replace Browser alert() Calls
- Audit found two `alert()` calls in the resume builder codebase
- `src/utils/export.ts` DOCX function: replaced `alert("Failed to generate DOCX...")` with `throw error` (callers now own error display)
- `ExportModal.tsx`: made `handleExportDocx` async; added `docxError` state; inline `role="alert"` error banner with `AlertCircle` icon
- `LeftSidebar.tsx` `ImportButton`: added `error` state; `role="alert"` paragraph below import label; removed unused `Layout` import
- **Files:** `src/utils/export.ts`, `src/components/resume-builder/ExportModal.tsx`, `src/components/resume-builder/LeftSidebar.tsx`

#### Sprint 4.7 — Fix Stale localStorage Key
- Discovery: `ResumePreview.tsx` contained a dead `loadResume()` function referencing `"patorbit-resume-data"` key (never called anywhere)
- Active key is `"patorbit-resume-v2"` (Zustand persist in `store/resume-builder.ts`)
- Decision: delete dead code entirely (no migration needed; function was never called)
- Removed: `STORAGE_KEY` constant, full `loadResume()` function (23 lines)
- **Files:** `src/components/resume/ResumePreview.tsx`

#### Sprint 4.8 — Print CSS for A4 Page-Break Control
- Added comprehensive `@media print` block to `globals.css`:
  - `@page { size: A4 portrait; margin: 12mm 15mm }`
  - White background, black text (strips glassmorphism dark theme)
  - App chrome hidden: `header, nav, aside, footer, [data-print-hide], .print-hide`
  - `break-inside: avoid` on `section` and `article` elements
  - `h1–h4 { break-after: avoid }` to keep headings with content
  - Orphan/widow control on `p` and `li`
  - `#pdf-export-target` forced to 210mm width for correct A4 render
- **Known limitation:** `@media print` CSS does not affect html2canvas PDF export (pixel-based). Benefits apply to browser Ctrl+P / Save as PDF only.
- **Files:** `src/app/globals.css`

#### Documentation Sprint
- Created `/docs/` directory as project single source of truth
- Files created: `PROJECT_MASTER_ROADMAP.md`, `CHANGELOG.md`, `ARCHITECTURE.md`, `PRODUCT_BACKLOG.md`, `SPRINT_HISTORY.md`, `RELEASE_PLAN.md`, `KNOWN_ISSUES.md`, `CONTRIBUTING.md`, `README_PROJECT.md`

### Deferred from Sprint 4

- **Template color/font picker UI** — deferred to Sprint 5/6 (needs multi-resume work first)
- **PDF export quality improvement** — deferred (large effort, requires renderer replacement)
- **Mobile responsiveness** — deferred to Sprint 6

---

## Sprint 3 — Professional Identity & Dashboard

**Period:** 2026-06 → 2026-07  
**Goal:** Build Trust Score pipeline; redesign dashboard as identity command center

### Delivered

- **Overview redesign** — Professional Identity command center with widgets: Resume Health, Trust Score summary, Quick Actions, Recent Activity
- **Identity Pipeline Coordinator** — orchestrates claim → evidence → knowledge graph flow (`src/services/identity-pipeline-coordinator.ts`)
- **Identity Pipeline Subscriber** — reactive pipeline for automatic score refresh (`src/services/identity-pipeline-subscriber.ts`)
- **Trust Report aggregation** — snapshot + verification coverage + weak claim detection (`src/services/trust-service.ts`)
- **Graph Service** — knowledge graph node/edge management (`src/services/graph-service.ts`)
- **Graph Mapper** — maps resume structure to graph nodes/edges (`src/services/graph-mapper.ts`)
- **AI Reasoning Service** — identity-aware AI reasoning layer (`src/services/ai-reasoning-service.ts`)
- **Evidence storage** — `idb-keyval` integration for IndexedDB evidence attachment storage (`src/lib/evidence/`)
- **Career Journey state machine** — career progression state tracking (`src/lib/careerjourney/`)

### Known Issues from Sprint 3

- Trust Score UI surfaces data from the pipeline but live wiring to the `/trust` page is incomplete
- Knowledge Graph visualization not yet implemented (services ready, React component missing)
- Evidence attachment upload flow not yet complete (storage layer ready)

---

## Sprint 2 — Resume Builder MVP

**Period:** 2026-05  
**Goal:** Ship core resume builder with AI assistance and export

### Delivered

- **Zustand store** with persist middleware (`patorbit-resume-v2`), partializing `{ resume, evidence }`
- **22 professional templates**: executive, modern-clean, split-vibrant, classic-serif, tech-mono, creative-burst, compact-pro, corporate-blue, minimal-edge, banner-bold, sidebar-elegance, gradient-flow, academic-formal, startup-vibe, dark-elegance, timeline-pro, premium-slate, nature-green, luxury-gold, swiss-design, scientific, creative-portfolio
- **14 font options** and **12 color palettes**
- **Section editors**: Personal, Experience, Education, Skills, Projects, Certifications, Achievements, Languages, Portfolio, Review
- **Auto-save** with 2s debounce + save status indicator
- **Export modal**: PDF (html2canvas + jsPDF multi-page), DOCX (server-side `/api/export-docx`)
- **Resume import**: JSON/PDF/DOCX parsing via `/api/import`
- **AI integration**: summary generation, bullet improvement, ATS optimization, tone rewriting, job match analysis, full resume analysis
- **AI Copilot panel** (`RightCopilot`) with streaming action states and `SmartSuggestion` accept/reject/regenerate flow
- **Template gallery** with live preview and ATS rating display
- Normalized persisted resume state during rehydration (missing array fields)

### Deferred from Sprint 2

- Multi-resume support (localStorage key per resume — needs architecture change)
- Template customization UI (color/font pickers)
- Drag-and-drop bullet reordering (react-dnd partially wired; disabled)

---

## Sprint 1 — Foundation

**Period:** 2026-02 → 2026-04  
**Goal:** Authentication, database, landing site, base infrastructure

### Delivered

- Next.js 16.2.12 project scaffold (App Router, TypeScript, Tailwind CSS v4, Turbopack)
- **Authentication**: NextAuth.js v4 with credentials provider, bcryptjs password hashing, JWT sessions, Prisma adapter
- **Database**: PostgreSQL + Prisma ORM, models: User, Account, Session, VerificationToken, ProfessionalIdentity
- **Route protection**: `src/middleware.ts` guards all authenticated routes
- **Server actions**: `login.ts`, `register.ts` with Zod validation
- **Marketing site**: Homepage, pricing (3-tier), platform, solutions, features, about, contact, legal pages
- **Glassmorphism design system**: dark theme, CSS custom properties, animation utilities
- **Footer + navigation**: full site nav, legal pages linked

### Production Issues Fixed in Sprint 1

- **bcrypt → bcryptjs**: bcrypt native module fails on Vercel (Node.js edge runtime). Replaced with pure-JS bcryptjs
- **NextAuth v5 → v4**: v5 adapter had breaking changes; reverted to stable v4 + `@auth/prisma-adapter`
- **`user.image` type error**: removed from `authorize()` return (not in Credentials type)
- **`DATABASE_URL` build-time error**: deferred Prisma client check to runtime in `prisma.config.ts`
- **`prisma generate` missing from build**: added to `package.json` build script

---

## Sprint Velocity Summary

| Sprint | Stories Delivered | Points | Duration |
|---|---|---|---|
| Sprint 1 | 12 | 34 | ~8 weeks |
| Sprint 2 | 18 | 52 | ~4 weeks |
| Sprint 3 | 14 | 44 | ~4 weeks |
| Sprint 4 | 11 | 28 | ~3 weeks |

*Point estimates are retrospective approximations, not tracked during sprints.*
