# Changelog

All notable changes to Patorbit are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versions follow [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

Changes staged for the next commit (resume-builder release-readiness work).

### Added
- **Visual Template Gallery** — replaced the template dropdown as the primary selection experience with a professional card grid (category sections: Recommended, ATS & Professional, Engineering, Business & Consulting, Executive, Academic, Creative, More Templates). Cards render the actual template components with a shared realistic gallery sample resume — no fake screenshots.
- **Full-template preview modal** — full-screen overlay rendering the real multi-page resume with page navigation, previous/next controls, 50–150% zoom (`+`/`=`/`-`/`0` keyboard shortcuts, Reset/Fit), and "Use This Template" (preserves the user's existing resume data).
- **Template customization system** (`ResumeStyleConfig`) — font family, font size, line height, accent/heading/body colors, heading style & weight, bullet style & size, density, section spacing, entry spacing, and page margins. Curated options only; per-template supported options; "Reset to Template Defaults".
- **Live customization workspace** — split-screen Customize panel with an always-live preview of the user's actual resume (never gallery sample data), independent scrolling, preview zoom and page navigation.
- **Professional Preview workspace** (`/resume-builder/preview`) — single-header redesign; resume is the visual hero; Templates, Customize, and Export PDF/DOCX are secondary controls; compact tab row keeps Passport/Knowledge Graph/Trust Timeline accessible; quiet save-status indicator; contain-fit auto-scaling.
- **A4 geometry parity module** (`src/lib/resume-design-system/geometry.ts`) — single source of truth for A4 dimensions shared by preview, gallery, and print; `@page { size: A4; margin: 0 }` and `print-color-adjust: exact` so browser Print → Save as PDF matches the preview.
- **DOCX export rebuild** — server-safe `src/lib/export-docx.ts` + rewritten `/api/export-docx` that receives `templateId` and the resolved `ResumeStyleConfig` (fonts, colors, heading style, bullet glyph, spacing, margins) and emits LinkedIn/GitHub as real hyperlinks.
- **Application theme switching** — "Switch to Light/Dark Mode" in the profile menu now re-themes the whole app (Tailwind `dark:` variant wired, extended `.light` CSS layer), persisted in `localStorage`; resume template styling is isolated from the app theme.
- **LinkedIn/GitHub hyperlinks** — all templates render real `<a href>` links (normalized URLs, `target="_blank"`, `rel="noopener noreferrer"`) through a shared helper.
- **Regression tests** — preview/export consistency, print geometry, DOCX route, theme layer, and gallery structure suites.

### Fixed
- **DOCX export failure** — removed the unnecessary `"use client"` directive from `style-config.ts`; the route was throwing a server/client boundary error under Turbopack (`Attempted to call resolveStyleConfig() from the server`), surfacing as "Failed to generate DOCX". Now verified end-to-end with a real authenticated request (HTTP 200, valid OOXML).
- **Print/export mismatch** — print CSS dropped all background colors unless "Background graphics" was checked; `@page` margin and `break-inside: avoid` shifted page breaks vs. the preview. Print block now pins exact A4 geometry with zero browser margins.
- **Preview vs export styling divergence** — DOCX route hardcoded Calibri/navy/fixed margins; now resolves the same `ResumeStyleConfig` as the preview via `resolveHeadingHex`.
- **Template Gallery React key warning** — missing `key` on the sidebar section fragment.
- **Dead settings button** — removed the gear button and orphaned `SettingsModal.tsx` (its four written fields had zero consumers); the header now shows Saved · Preview · Profile, with the real `AccountMenu`.
- **React hooks/static-components lint issues** in the flagship templates (components hoisted to module scope).
- **Conditional hook in `NetworkView`** — refactored so every hook is called unconditionally.
- **Vitest Windows worker-pool flakiness** — stabilized thread-pool config; suite runs green repeatedly.

### Changed
- **Resume Builder header** — `Templates` / `Customize` moved out of the primary header; `Preview` is the primary presentation action and hosts Templates, Customize, and Export.
- **ExportModal** — mounts the print-target `ResumePreview` only while printing (conditional mount), awaits `document.fonts.ready` before printing, and passes the resolved style config to DOCX.
- **`@page` / print block** — explicit A4, margin 0, no width/scale/font overrides; `border-radius`/shadow stripping removed.
- **Legacy `NEXTAUTH_SECRET` references** — middleware and auth config now consistently use `AUTH_SECRET`.
- **`Placeholder` component typing** in the preview page (`any` → `LucideIcon`).

---

## [0.1.0] — Sprint 4 Polish — 2026-08-07

### Added
- **Deployment version detection** — polls `/api/version` every 12 minutes and on tab focus/reconnect; shows a glassmorphism premium update banner (bottom-right toast) with current/new SHA, relative time, and "Refresh Now" CTA
- **Dashboard breadcrumb navigation** — Resume Builder header now shows `← Dashboard > Resume Builder [name]` with hover animation on back arrow
- **Print CSS** — `@media print` block in `globals.css` with `@page { size: A4 }`, `break-inside: avoid` on `section`/`article`, orphan/widow control, app chrome hidden on print
- **Auto-expand newly added items** — Experience, Education, Projects, and Certifications sections now open the newly created accordion item automatically on add

### Fixed
- **Misleading "Cloud Synced" status** — `SaveStatusIndicator` now shows `HardDrive` icon with "Saved locally" label instead of a cloud icon implying remote sync
- **Duplicate localStorage autosave** — removed manual `debouncedSave` that was writing an incomplete state shape (`{ state: { resume } }` only); Zustand persist is now the single writer
- **Dark Elegance template** — redesigned to use white paper background with charcoal ink; eliminates dark rectangles in PDF export; removes ATS-hostile emoji contact icons
- **Hover scale jitter on inputs** — removed `whileHover={{ scale: 1.01 }}` wrappers from Full Name and Professional Title fields in `PersonalSection`
- **Browser `alert()` calls** — replaced two remaining `alert()` calls with inline `role="alert"` error components (DOCX export error in `ExportModal`, import failure in `LeftSidebar`)
- **Stale localStorage key** — removed dead `loadResume()` function using `"patorbit-resume-data"` key; entire codebase now reads from single Zustand persist key `"patorbit-resume-v2"`
- **Platform timeline alignment** — timeline circles now use `top-1/2 -translate-y-1/2` (was hardcoded `top-8`), aligning nodes with card vertical midpoint at any card height

### Changed
- `SaveStatus` union type: removed `"cloud-synced"` variant
- `export.ts` DOCX function: re-throws errors instead of swallowing with `alert()`
- `ExportModal`: `handleExportDocx` made `async`, keeps modal open on failure and shows inline error banner

---

## [0.0.9] — Authentication Polish — 2026-07

### Added
- Production authentication flow with onboarding improvements
- Dashboard entry improvements post-login

### Fixed
- bcrypt replaced with bcryptjs for Vercel compatibility
- Removed broken NextAuth v5 adapter; aligned to v4
- Removed `user.image` from authorize return value (caused type error)
- Deferred `DATABASE_URL` check to runtime in `prisma.config.ts`
- Added `prisma generate` to build script

---

## [0.0.8] — Overview Redesign — 2026-07

### Changed
- **Overview page redesigned** as Professional Identity command center with widgets: Resume Health, Trust Score summary, Quick Actions, Recent Activity

---

## [0.0.7] — AI Integration — 2026-06

### Added
- Complete AI integration into Resume Builder
  - Summary generation
  - Bullet point generation and improvement
  - ATS optimization
  - Job description matching
  - Resume analysis (full scoring)
  - Tone rewriting (5 modes: ATS, impact, concise, expanded, professional)
- AI Copilot panel (`RightCopilot`) with streaming action states
- `SmartSuggestion` component for AI-proposed rewrites (accept/reject/regenerate)

### Fixed
- Normalized persisted resume state during rehydration (missing array fields)
- Normalized claims and experience selectors

---

## [0.0.6] — Trust System Foundation — 2026-06

### Added
- **Identity Pipeline Coordinator** — orchestrates claim → evidence → knowledge graph flow
- **Identity Pipeline Subscriber** — reactive pipeline for automatic score refresh
- **Trust Report aggregation** — snapshot + verification coverage + weak claim detection
- **Graph Service** — knowledge graph nodes for claims and evidence
- **Graph Mapper** — maps resume structure to graph edges/nodes
- `idb-keyval` integration for evidence attachment storage (IndexedDB)

---

## [0.0.5] — Resume Builder Templates — 2026-05

### Added
- 22 professional resume templates:
  - `executive`, `modern-clean`, `split-vibrant`, `classic-serif`, `tech-mono`
  - `creative-burst`, `compact-pro`, `corporate-blue`, `minimal-edge`, `banner-bold`
  - `sidebar-elegance`, `gradient-flow`, `academic-formal`, `startup-vibe`, `dark-elegance`
  - `timeline-pro`, `premium-slate`, `nature-green`, `luxury-gold`, `swiss-design`
  - `scientific`, `creative-portfolio`
- 14 font options (Inter, Playfair, SF Mono, etc.)
- 12 color palettes (Navy, Emerald, Royal Purple, Ocean Blue, etc.)
- Template gallery with live preview
- ATS rating per template (79–94 range)

### Changed
- `modern-clean` elevated to flagship default template

---

## [0.0.4] — Resume Builder Core — 2026-05

### Added
- Zustand store with persist middleware (`patorbit-resume-v2`)
- Section editors: Personal, Experience, Education, Skills, Projects, Certifications, Achievements, Languages, Portfolio, Review
- Auto-save with debounce
- Save status indicator (saving/saved/offline states)
- Export modal with PDF and DOCX options
- PDF export via html2canvas + jsPDF (multi-page slicing)
- DOCX export via server-side `/api/export-docx` endpoint
- Resume import (JSON/PDF/DOCX) via `/api/import`
- AI action states per field (loading/success/error)
- Drag-and-drop bullet ordering (react-dnd, partially wired)

---

## [0.0.3] — Marketing Site — 2026-04

### Added
- Homepage with hero section, benefits, and social proof
- Pricing page (3-tier: Starter/Professional/Enterprise)
- Platform page with feature timeline
- Solutions page (use cases by audience)
- Legal pages: Privacy Policy, Terms of Service, Security, Compliance
- Footer with full navigation
- `/coming-soon` holding page
- Glassmorphism dark-theme design system

### Fixed
- Footer navigation links repaired
- Legal pages added to site
- How It Works timeline alignment

---

## [0.0.2] — Authentication & Database — 2026-03

### Added
- NextAuth.js v4 with credentials provider
- User registration with bcryptjs password hashing
- Login with email/password
- Prisma ORM with PostgreSQL schema
  - `User`, `Account`, `Session`, `VerificationToken`, `ProfessionalIdentity` models
- Route protection via `src/middleware.ts` (guards `/overview`, `/resume-builder`, etc.)
- Server actions: `login.ts`, `register.ts`
- Zod validation schemas for auth forms

---

## [0.0.1] — Project Initialization — 2026-02

### Added
- Next.js 16.2.12 project scaffold (App Router, TypeScript, Tailwind CSS)
- Turbopack development server
- Repository initialized
- Base folder structure: `src/app/`, `src/components/`, `src/lib/`, `src/store/`
- ESLint + TypeScript configuration
- Vitest + Playwright test infrastructure

---

[Unreleased]: https://github.com/patorbit/pks/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/patorbit/pks/compare/v0.0.9...v0.1.0
