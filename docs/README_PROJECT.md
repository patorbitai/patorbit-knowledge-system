# Patorbit — Professional Identity Platform

**Version:** 0.1.0 (resume-builder release-readiness work staged)
**Last Updated:** 2026-08-16
**Stack:** Next.js 16.3.0 · React 19 · PostgreSQL · Prisma · Zustand · OpenAI

---

## What is Patorbit?

Patorbit is a **Professional Identity Platform** that transforms resumes into verified, AI-enhanced career documents backed by evidence and trust scoring.

**Core Features:**
- **Resume Builder** — 29 professional templates (8 flagship), AI-powered content improvement, ATS optimization
- **Template Gallery** — visual card grid with real template rendering, full multi-page preview, zoom
- **Professional Preview** — dedicated finalization workspace with live customization and export
- **Customization** — font, colors, headings, bullets, and spacing via a shared `ResumeStyleConfig`
- **Professional Passport** — verified career identity with evidence-backed claims
- **Trust Score** — credibility metric based on claim verification coverage
- **Knowledge Graph** — visual representation of skills, experience, and career progression

---

## Resume Builder — Current State

The resume product now covers the full selection → customize → preview → export loop:

- **Template Gallery** (`TemplateGallery`, `MiniaturePreview`, `FullTemplatePreview`) — visual grid with category sections, real template components rendered with a shared gallery sample resume (`gallery-sample-resume.ts`), full-screen multi-page preview with 50–150% zoom, page navigation, and "Use This Template". Gallery sample data is never written into the user's resume.
- **Customization** (`ResumeStyleConfig` in `src/lib/resume-design-system/style-config.ts`, `CustomizePanel`, `LiveStylePreview`) — font family/size/line-height, accent/heading/body colors, heading style & weight, bullet style & size, density, section/entry spacing, and page margins. Every control updates the live preview immediately; per-template defaults and "Reset to Template Defaults" are supported. Content and style are separate concerns — customization never modifies resume data, and the application light/dark theme never alters a resume's own template styling.
- **Professional Preview** (`/resume-builder/preview`) — the resume is the hero; Templates, Customize, and Export PDF/DOCX are reached from here. Same renderer, same `templateId`, same data, same `ResumeStyleConfig` as export.
- **Export** — PDF via browser print with A4 geometry parity (`src/lib/resume-design-system/geometry.ts`, `@page { size: A4; margin: 0 }`, print-color-adjust exact); DOCX via `/api/export-docx` + `src/lib/export-docx.ts` honoring the selected style config, with LinkedIn/GitHub as real hyperlinks.

See `docs/CHANGELOG.md` (Unreleased) and `docs/RELEASE_QA_REPORT.md` for the full change record and QA status.

---

## Documentation Index

| Document | Purpose |
|---|---|
| [MASTER_ARCHITECTURE.md](./MASTER_ARCHITECTURE.md) | **Master architecture** — product vision, current-vs-future, claim/evidence/verification/trust models, roadmap |
| [PROJECT_MASTER_ROADMAP.md](./PROJECT_MASTER_ROADMAP.md) | Vision, mission, modules, milestones, sprint timeline |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, folder structure, data flow, tech stack |
| [CHANGELOG.md](./CHANGELOG.md) | Version history, features added, bugs fixed |
| [SPRINT_HISTORY.md](./SPRINT_HISTORY.md) | Sprint-by-sprint delivered work, deferred items, velocity |
| [PRODUCT_BACKLOG.md](./PRODUCT_BACKLOG.md) | Prioritized feature backlog across 8 epics |
| [RELEASE_PLAN.md](./RELEASE_PLAN.md) | Upcoming releases, versioning policy, go/no-go criteria |
| [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) | Active bugs, limitations, technical debt |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Setup, workflow, conventions, testing, deployment |
| [README_PROJECT.md](./README_PROJECT.md) | **This file** — project overview and documentation index |

---

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- OpenAI API key

### Installation

```bash
# Clone repository
git clone <repo-url>
cd "Patorbit Knowledge System (PKS)"

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL, AUTH_SECRET, OPENAI_API_KEY
# (AUTH_SECRET is the active variable — see docs/SECURITY_AUDIT.md)

# Run database migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate

# Start development server
npm run dev
```

App runs at `http://localhost:3000`.

---

## Project Structure

```
D:/Patorbit Knowledge System (PKS)/
├── docs/                          ← Project documentation (you are here)
├── prisma/
│   ├── schema.prisma              Database schema
│   └── migrations/                Database migration history
├── src/
│   ├── app/                       Next.js App Router (pages, API routes, layouts)
│   ├── components/                React components (resume-builder, identity, common)
│   ├── lib/                       Utilities, clients, business logic
│   ├── services/                  Domain services (trust, graph, identity pipelines)
│   ├── store/                     Zustand state management
│   ├── types/                     TypeScript type definitions
│   └── middleware.ts              Route protection (NextAuth)
├── .env.local                     Environment variables (git-ignored)
├── package.json                   Dependencies
└── tsconfig.json                  TypeScript config
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed folder breakdown.

---

## Development Workflow

1. **Branch off `main`** for new features:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes** — follow conventions in [CONTRIBUTING.md](./CONTRIBUTING.md)

3. **Test locally**:
   ```bash
   npm run build  # TypeScript check
   npm run dev    # Manual UI testing
   ```

4. **Commit with conventional format**:
   ```bash
   git commit -m "feat(trust): add Trust Score widget to overview"
   ```

5. **Push and create PR**:
   ```bash
   git push -u origin feature/your-feature-name
   ```

6. **Merge after review** → auto-deploys to Vercel

---

## Current Status

**Latest Release:** 0.1.0 (Sprint 4 Polish) — 2026-08-07
**Pending:** resume-builder release-readiness work staged for the next commit

**What's Working:**
- ✅ Resume Builder with 29 templates (8 flagship), auto-save, AI assistance
- ✅ **Template Gallery** — visual grid, real template rendering, categories, full multi-page preview with zoom and page navigation
- ✅ **Customization** — live `ResumeStyleConfig` (fonts, colors, headings, bullets, density, spacing) applied instantly to the real preview, with per-template defaults and reset
- ✅ **Professional Preview** — dedicated finalization workspace; Templates, Customize, and Export PDF/DOCX all reachable from it
- ✅ PDF export via browser print — shared renderer with the preview, A4 geometry parity (`@page` A4, zero browser margins, print-color-adjust exact)
- ✅ DOCX export — server-side generator honoring the selected template and `ResumeStyleConfig` (fonts, colors, bullets, margins), LinkedIn/GitHub as real hyperlinks
- ✅ Authentication (register, login, session management) — `AUTH_SECRET` used consistently across middleware and auth config
- ✅ Application light/dark theme switching (persisted, does not affect the resume document)
- ✅ Marketing site (pricing, features, platform pages)
- ✅ Trust Score backend pipeline (services, graph, coordinator, subscriber) with Trust view (`/trust`)
- ✅ Claims Review + evidence upload/link flow (builder store, IndexedDB storage, VerificationBadge derivation)
- ✅ Dashboard Overview redesign
- ✅ Deployment version detection + update banner
- ✅ Performance pass: conditional preview mounting, no AI request on hydration, abort cleanup, granular store selectors, lint-noise cleanup

**Known Limitations:**
- ⚠️ On some multi-page templates with full-height sidebars/background panels, a partially filled later page may not extend the sidebar/background to the bottom of the A4 page (deferred)
- ⚠️ Claims/evidence are builder-scoped (local store + IndexedDB), not yet the first-class identity-centric domain model (see [MASTER_ARCHITECTURE.md](./MASTER_ARCHITECTURE.md))
- ⚠️ Trust Score UI wiring is partial — the backend pipeline and views exist, but full evidence-weighted explainability is future work
- ⚠️ No email verification or password reset yet
- ⚠️ Resume data in localStorage only (no multi-device sync)
- ⚠️ Resume Builder editor remains desktop-focused (gallery, preview, and customize are responsive)

See [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) for full list.

---

## Next Sprint (0.2.0)

**Theme:** Trust Score MVP

**Scope:**
- Wire Trust Score panel to live data
- Evidence attachment upload
- Passport page live data
- Email verification + password reset

See [RELEASE_PLAN.md](./RELEASE_PLAN.md) for roadmap.

---

## Key Constraints

From `AGENTS.md`:

> **This is NOT the Next.js you know.**  
> This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

**Never rename template files or identifiers** — template IDs are frozen per ADR-006.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Next.js 16.2.12 (App Router), Tailwind CSS v4 |
| **State** | Zustand 5 (persist middleware) |
| **Backend** | Next.js API Routes, PostgreSQL, Prisma ORM |
| **Auth** | NextAuth.js v4 (credentials provider, JWT sessions) |
| **AI** | OpenAI SDK 6.49 (GPT-4) |
| **Export** | Browser print → Save as PDF (A4), server-side `docx` builder (DOCX) |
| **Deployment** | Vercel (auto-deploy on push to `main`) |

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Local setup instructions
- Code conventions
- Commit guidelines
- Testing checklist
- Deployment process

---

## License

Proprietary — All rights reserved.

---

## Contact

**Internal team:** Slack `#patorbit-dev`  
**Issues:** See [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) for triage process
