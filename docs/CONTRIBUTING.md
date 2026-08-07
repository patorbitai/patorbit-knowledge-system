# Contributing to Patorbit

**Welcome!** This guide is for developers working on Patorbit. It covers setup, conventions, workflow, and how to ship changes safely.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Setup](#local-setup)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Code Conventions](#code-conventions)
6. [Commit Guidelines](#commit-guidelines)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

**Required:**
- Node.js 20.x or later
- PostgreSQL 16+ (local or hosted)
- Git
- npm or yarn

**Recommended:**
- VS Code with TypeScript, Tailwind CSS IntelliSense, Prisma extensions
- Postman or similar for API testing

---

## Local Setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd "Patorbit Knowledge System (PKS)"
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create `.env.local` in the project root:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/patorbit"

# NextAuth
NEXTAUTH_SECRET="generate-a-random-32-char-string-here"
NEXTAUTH_URL="http://localhost:3000"

# OpenAI
OPENAI_API_KEY="sk-..."

# Deployment detection (local dev)
NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA="local-dev"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 4. Set up the database

**Option A: Local PostgreSQL**

Create database:
```bash
psql -U postgres
CREATE DATABASE patorbit;
\q
```

Run migrations:
```bash
npx prisma migrate dev
```

**Option B: Vercel Postgres (local dev against prod DB)**

1. Copy `DATABASE_URL` from Vercel dashboard
2. Paste into `.env.local`
3. Run `npx prisma db pull` (no migrations needed)

### 5. Generate Prisma Client

```bash
npx prisma generate
```

### 6. Start development server

```bash
npm run dev
```

App runs at `http://localhost:3000`.

---

## Project Structure

See `ARCHITECTURE.md` for full folder breakdown.

**Key conventions:**
- **`src/app/`** — Next.js App Router pages and API routes
- **`src/components/`** — React components (feature-grouped)
- **`src/lib/`** — Utilities, clients, business logic
- **`src/services/`** — Domain services (trust, graph, identity)
- **`src/store/`** — Zustand state management
- **`src/types/`** — TypeScript type definitions
- **`prisma/`** — Database schema

---

## Development Workflow

### Branch Strategy

- **`main`** — production branch (auto-deploys to Vercel)
- **`feature/[name]`** — feature branches (branch off `main`, merge via PR)

**Do not commit directly to `main` unless it's a hotfix.**

### Feature Development

1. Branch off `main`:
   ```bash
   git checkout main
   git pull
   git checkout -b feature/trust-score-widget
   ```

2. Make changes, commit frequently (see Commit Guidelines below)

3. Test locally:
   ```bash
   npm run build  # Verify no TypeScript errors
   npm run dev    # Manual UI testing
   ```

4. Push branch:
   ```bash
   git push -u origin feature/trust-score-widget
   ```

5. Create PR (GitHub) — request review from team

6. Address feedback, merge when approved

---

## Code Conventions

### TypeScript

- **Strict mode enabled** — no `any` without justification
- Use `interface` for object shapes, `type` for unions/intersections
- Export types from `src/types/` for shared domain models

### React Components

- **Functional components only** (no class components)
- Use `"use client"` directive only when necessary (client-side state, browser APIs)
- Props interfaces: `interface FooProps { ... }`
- Destructure props in function signature: `function Foo({ bar, baz }: FooProps)`

### Styling

- **Tailwind CSS utility classes** — no inline `style` unless dynamic values required
- Use CSS custom properties for theme colors (defined in `globals.css`)
- Mobile-first responsive design: `md:`, `lg:`, `xl:` breakpoints

### File Naming

- **Components:** PascalCase (`TrustScoreWidget.tsx`)
- **Utilities:** camelCase (`resume-parser.ts`)
- **Types:** kebab-case (`knowledge-graph.ts`)
- **API routes:** kebab-case folders (`api/export-docx/route.ts`)

### State Management

- **Zustand for global state** — single store in `src/store/resume-builder.ts`
- **React `useState` for local UI state** (modals, dropdowns, form inputs)
- **Do not duplicate state** — derive from Zustand when possible

---

## Commit Guidelines

Use conventional commit format:

```
<type>(<scope>): <subject>

<body>

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
```

**Types:**
- `feat` — new feature
- `fix` — bug fix
- `docs` — documentation only
- `style` — formatting, whitespace (no code change)
- `refactor` — code change that neither fixes a bug nor adds a feature
- `test` — adding tests
- `chore` — build process, dependencies, tooling

**Examples:**

```
feat(trust): add Trust Score widget to overview dashboard

- Fetches TrustService.getTrustSnapshot(userId)
- Displays score + verification coverage + weak claim count
- Links to /trust page
```

```
fix(export): replace alert() with inline error in ExportModal

- Made handleExportDocx async
- Added docxError state
- Inline error banner with AlertCircle icon

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
```

**Commit frequently.** One commit per logical change (not per file).

---

## Testing

### Manual Testing

**Before every PR:**
1. Run `npm run build` — zero TypeScript errors
2. Test the feature in browser (dev server)
3. Test edge cases (empty state, error state, long content)
4. Check mobile responsiveness (if UI change)

### Automated Testing

**Unit tests** (planned, not yet implemented):
- Jest for service layer (`src/services/__tests__/`)
- Run: `npm run test`

**E2E tests** (planned):
- Playwright for Resume Builder critical paths
- Run: `npm run test:e2e`

---

## Deployment

### Automatic Deployment (Vercel)

Every push to `main` auto-deploys to production.

**Pre-merge checklist:**
- [ ] `npm run build` passes locally
- [ ] No console errors in browser
- [ ] PR approved by reviewer
- [ ] CHANGELOG updated (if user-facing change)

### Database Migrations

**When adding/changing Prisma schema:**

1. Edit `prisma/schema.prisma`
2. Create migration:
   ```bash
   npx prisma migrate dev --name add_resume_table
   ```
3. Commit migration files (`prisma/migrations/`)
4. After merge, run in production:
   ```bash
   npx prisma migrate deploy
   ```

**Vercel automatically runs `prisma generate` during build.** No manual step needed for client generation.

---

## Troubleshooting

### "Module not found" after `npm install`

```bash
rm -rf node_modules package-lock.json
npm install
```

### "Prisma Client did not initialize"

```bash
npx prisma generate
```

### TypeScript errors in `next-auth.d.ts`

Make sure `@auth/prisma-adapter` is installed:
```bash
npm install @auth/prisma-adapter
```

### Build fails with "Cannot find module 'sharp'"

Sharp is optional for Next.js image optimization. Install it:
```bash
npm install sharp
```

### Database connection fails

Check `DATABASE_URL` in `.env.local`. Test connection:
```bash
psql "$DATABASE_URL"
```

### OpenAI API errors (401 Unauthorized)

Verify `OPENAI_API_KEY` in `.env.local` is correct and has credits.

---

## Getting Help

**Internal team:**  
- Slack: `#patorbit-dev`  
- Code review: tag `@reviewers` in PR

**Documentation:**  
- `docs/ARCHITECTURE.md` — system design
- `docs/SPRINT_HISTORY.md` — what was built when
- `docs/KNOWN_ISSUES.md` — current bugs + limitations

**External resources:**  
- [Next.js 16 Docs](https://nextjs.org/docs) (check `/node_modules/next/dist/docs/` for upgrade notes)
- [Prisma Docs](https://www.prisma.io/docs)
- [Zustand Docs](https://zustand-demo.pmnd.rs)
- [NextAuth.js Docs](https://next-auth.js.org)
