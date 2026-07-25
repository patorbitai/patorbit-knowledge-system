# Patorbit Beta v0.9 — Deployment Guide

## Prerequisites

### Infrastructure Requirements

- **Node.js** 20+ (LTS recommended)
- **pnpm** 9.15+
- **PostgreSQL** 16+
- **Redis** 7+

### Optional Services

- **OpenSearch** — Full-text search (optional, graceful fallback)
- **Neo4j** — Knowledge graph (optional, feature-gated)
- **MinIO / S3** — File storage (required for upload features)
- **Stripe** — Subscription billing (optional, feature-gated)
- **SMTP Server** — Email delivery (required for password reset, email verification)

## Environment Setup

### 1. Clone & Install

```bash
git clone <repository-url> patorbit
cd patorbit
pnpm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

**Required variables:**

| Variable             | Description              | Default                                                  |
| -------------------- | ------------------------ | -------------------------------------------------------- |
| `NODE_ENV`           | Environment              | `development`                                            |
| `API_PORT`           | API server port          | `4000`                                                   |
| `DATABASE_URL`       | PostgreSQL connection    | `postgresql://postgres:postgres@localhost:5432/patorbit` |
| `REDIS_URL`          | Redis connection         | `redis://localhost:6379`                                 |
| `JWT_ACCESS_SECRET`  | JWT access token secret  | (generate random)                                        |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | (generate random)                                        |
| `AUTH_URL`           | Frontend auth URL        | `http://localhost:3000`                                  |

**Optional variables:**

| Variable                                      | Description           | Fallback                |
| --------------------------------------------- | --------------------- | ----------------------- |
| `FRONTEND_URL`                                | Frontend URL for CORS | `http://localhost:3000` |
| `OPENSEARCH_URL`                              | OpenSearch endpoint   | Search falls back to DB |
| `NEO4J_URI` / `NEO4J_USER` / `NEO4J_PASSWORD` | Neo4j graph           | Graph feature disabled  |
| `STORAGE_*`                                   | S3-compatible storage | Local filesystem        |
| `STRIPE_*`                                    | Stripe billing        | Billing disabled        |
| `SMTP_*`                                      | Email delivery        | Logged to console       |
| `FEATURE_*`                                   | Feature flags         | All disabled by default |

### 3. Database Setup

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# (Optional) Seed with sample data
pnpm db:seed
```

## Build & Deploy

### Production Build

```bash
pnpm build
```

This produces:

- `apps/api/dist/` — Compiled NestJS API
- `apps/web/.next/` — Compiled Next.js web application
- `apps/admin/.next/` — Compiled Next.js admin panel
- `packages/*/dist/` — Compiled shared packages

### Deployment Topology

**Option A — Monolithic (single server):**

```
PORT=4000  → API server
PORT=3000  → Web application (standalone or via reverse proxy)
PORT=3001  → Admin panel (internal)
```

**Option B — Separated services:**

```
Load Balancer → API Servers (horizontal scale)
              → Web Servers (CDN + Node.js)
              → Admin Server (internal only)
```

### Running in Production

**API Server:**

```bash
cd apps/api
NODE_ENV=production node dist/main.js
```

**Web Application:**

```bash
cd apps/web
NODE_ENV=production npx next start -p 3000
```

**Admin Panel:**

```bash
cd apps/admin
NODE_ENV=production npx next start -p 3001
```

## Verification Steps

After deployment, verify:

1. **Health check:** `GET /health` — responds with `{"status":"ok"}`
2. **Database:** Health check includes `database` indicator
3. **Redis:** Health check includes `redis` indicator
4. **Auth flow:** Sign-up → Verify email → Sign-in → Access protected routes
5. **Resume CRUD:** Create → Edit → Export → Delete
6. **Workspace:** Folder creation, item organization

## Monitoring

- **Health endpoint:** `GET /health` (public, no auth)
- **Structured logging:** Winston-based (`apps/api/src/platform/logging/`)
- **Audit events:** Security-relevant actions logged via Audit module

## Rollback Procedure

### Application Rollback

```bash
# Deploy previous version
git checkout <previous-release-tag>
pnpm install
pnpm build
pnpm db:migrate  # if needed
# Restart services
```

### Database Rollback

```bash
# Revert the last migration
pnpm db:migrate --down
```

### Full Rollback Steps

1. Stop all Patorbit services
2. Revert code to previous tag: `git checkout v0.8.0`
3. Rebuild: `pnpm install && pnpm build`
4. Revert database: `pnpm db:migrate --down`
5. Restart services
6. Verify health endpoint responds

---

_Generated 2026-07-25 for Patorbit Beta v0.9 RC1_
