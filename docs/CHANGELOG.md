# Changelog

All notable changes to Patorbit are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versions follow [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

Changes staged for Sprint 5.

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
