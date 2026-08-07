# Patorbit — Professional Identity Platform

**Version:** 0.1.0  
**Last Updated:** 2026-08-07  
**Stack:** Next.js 16.2.12 · React 19 · PostgreSQL · Prisma · Zustand · OpenAI

---

## What is Patorbit?

Patorbit is a **Professional Identity Platform** that transforms resumes into verified, AI-enhanced career documents backed by evidence and trust scoring.

**Core Features:**
- **Resume Builder** — 22 professional templates, AI-powered content improvement, ATS optimization
- **Professional Passport** — verified career identity with evidence-backed claims
- **Trust Score** — credibility metric based on claim verification coverage
- **Knowledge Graph** — visual representation of skills, experience, and career progression

---

## Documentation Index

| Document | Purpose |
|---|---|
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
# Edit .env.local with your DATABASE_URL, NEXTAUTH_SECRET, OPENAI_API_KEY

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

**What's Working:**
- ✅ Resume Builder with 22 templates, auto-save, AI assistance
- ✅ PDF/DOCX export
- ✅ Authentication (register, login, session management)
- ✅ Marketing site (pricing, features, platform pages)
- ✅ Trust Score backend pipeline (services, graph, coordinator)
- ✅ Dashboard Overview redesign
- ✅ Deployment version detection + update banner

**Known Limitations:**
- ⚠️ PDF export does not respect page breaks (use browser print instead)
- ⚠️ Trust Score backend complete but not wired to UI
- ⚠️ Evidence attachment upload not implemented
- ⚠️ No email verification or password reset yet
- ⚠️ Resume data in localStorage only (no multi-device sync)
- ⚠️ Not mobile-responsive

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
| **Export** | html2canvas + jsPDF (PDF), `docx` npm (DOCX) |
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
