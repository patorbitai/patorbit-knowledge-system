# CLAUDE.md - Patorbit Knowledge System Developer Guide

## Project Overview

The Patorbit Knowledge System is a comprehensive AI-powered knowledge management platform built as a monorepo with the following structure:

```
/apps
  api     - NestJS API (Node.js/TypeScript)
  web     - Next.js web application (React)
  admin   - Next.js admin panel (React)
/packages
  auth          - Authentication utilities and password hashing
  config        - Environment configuration and validation (@patorbit/config)
  database      - Prisma ORM with PostgreSQL (@patorbit/database)
  tsconfig      - Shared TypeScript configuration
  types         - Shared type definitions
  ui            - UI components library (@patorbit/ui)
  utils         - Shared utility functions (@patorbit/utils)
  billing       - Billing and subscription services
  notifications - Notification delivery services
  storage       - File storage abstractions
  ai            - AI/ML service integrations
```

**Key Technologies:**

- **API:** NestJS framework with TypeScript, JWT-based authentication
- **Frontend:** Next.js 14+ with React
- **Database:** PostgreSQL + Prisma ORM + Redis caching
- **Build Tools:** pnpm workspaces, Turborepo, ESLint + Prettier, Vitest
- **AI Services:** OpenSearch for search, Neo4j for knowledge graph
- **Observability:** Structured logging (Winston), health checks, metrics

## Architecture

### API Layer (apps/api)

- RESTful API built with NestJS modules
- JWT token authentication with access/refresh token rotation
- CSRF protection using double-submit cookie pattern (csrf-token / __Host-csrf-token)
- Rate limiting and throttling (10 requests/60s default)
- Multi-tenant architecture with organization scoping
- Request-scoped context using AsyncLocalStorage
- Global exception filter with structured error responses

**Domain Modules:** analytics, audit, auth, career-passport, claim, confidence, credential, evidence, identity, knowledge, organization, permission, profile, resume, session, timeline, trust, user, verification, workspace

**Platform Module:** cache, config, email, errors, event-bus, events, feature-flags, graph, health, jobs, logging, metrics, notifications, observability, rate-limiting, scheduler, search, storage

### Frontend Layer (apps/web)

- Next.js 14+ application
- Client-side authentication and API integration
- Resume builder, career passport, and profile management

### Admin Layer (apps/admin)

- Next.js admin interface
- Organization and user management panels

### Database Layer (packages/database)

- PostgreSQL with Prisma ORM
- Redis for caching and session management
- Soft delete pattern on all entities

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9.15+
- PostgreSQL 16+
- Redis 7+

### Setup

```bash
# Clone the repository
cd /path/to/patorbit

# Install dependencies
pnpm install

# Start all services (API + Web)
pnpm dev

# Individual service starts
pnpm --filter @patorbit/api dev      # API server on port 4000
pnpm --filter @patorbit/web dev       # Web application on port 3000
pnpm --filter @patorbit/admin dev     # Admin panel

# Database migration
pnpm db:migrate

# Generate Prisma client
pnpm db:generate
```

### Environment Variables

Copy `.env.example` to `.env` and update:

```bash
NODE_ENV=development
LOG_LEVEL=debug
API_PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/patorbit
REDIS_URL=redis://localhost:6379
OPENSEARCH_URL=http://localhost:9200
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_REGION=us-east-1
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_BUCKET=patorbit
JWT_ACCESS_SECRET=change-me-to-a-random-secret
JWT_REFRESH_SECRET=change-me-to-a-random-secret
AUTH_URL=http://localhost:3000
```

## Key Commands

### Development

- `pnpm dev` - Start all services (via Turbo)
- `pnpm --filter @patorbit/api dev` - Start API only
- `pnpm --filter @patorbit/web dev` - Start web app only
- `pnpm --filter @patorbit/admin dev` - Start admin panel only

### Build

- `pnpm build` - Build all projects
- `pnpm --filter @patorbit/api build` - Build API only

### Testing

- `pnpm test` - Run all tests
- `pnpm --filter @patorbit/api test` - Run API tests

### Database

- `pnpm db:migrate` - Run database migrations
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:push` - Push schema to database
- `pnpm db:studio` - Open Prisma Studio

### Code Quality

- `pnpm lint` - Run ESLint across all projects
- `pnpm format` - Run Prettier on all TS/TSX/MD/JSON files
- `pnpm typecheck` - TypeScript type checking
- `pnpm clean` - Clean all build artifacts

## Code Style

### ESLint + Prettier

- **ESLint** configured with `@typescript-eslint`, `eslint-plugin-import`, `eslint-plugin-simple-import-sort`
- **Prettier** configured with semi, singleQuote, trailingComma all, printWidth 100, tabWidth 2
- Pre-commit hooks via Husky + lint-staged
- Ignored patterns: `node_modules`, `dist`, `.next`, `coverage`, `*.config.*`, `prisma`

### Rules

- `no-unused-vars` off; `@typescript-eslint/no-unused-vars` on (warn, ignore `^_` prefix)
- `@typescript-eslint/no-explicit-any` at warn level
- `@typescript-eslint/consistent-type-imports` error with `prefer: "type-imports"`
- `simple-import-sort/imports` and `simple-import-sort/exports` at error level
- ESLint config is flat (`eslint.config.mjs`)

### Naming Conventions

- **Variables & functions:** camelCase
- **Constants:** UPPER_SNAKE_CASE
- **Interfaces/classes:** PascalCase
- **Files:** kebab-case
- **Directories:** snake_case
- **Packages:** @patorbit/scope naming

### TypeScript

- Strict mode enabled (`strict: true`)
- `noUncheckedIndexedAccess: true` for array safety
- `skipLibCheck: true`, `forceConsistentCasingInFileNames: true`
- Target ES2022, module resolution bundler
- `.eslintrc.js` (legacy), `tsconfig.json` root + per-package configs

## Testing

### Test Commands

- `pnpm test` - Run all tests via Turbo
- `pnpm --filter @patorbit/api test` - Run API tests
- `pnpm --filter @patorbit/api test:watch` - Watch mode
- `pnpm --filter @patorbit/api test:coverage` - Generate coverage report
- `pnpm --filter @patorbit/api test:ci` - CI-optimized test run

### Framework

- **Framework:** Vitest
- **Unit Tests:** Individual module/function tests
- **Integration Tests:** API endpoint tests with Prisma
- **E2E Tests:** Full request lifecycle tests

### Coverage

- Automatic code coverage reporting
- CI pipeline enforces coverage thresholds

### Pre-commit Hooks

- `husky` + `lint-staged` configured
- `*.{ts,tsx}`: prettier --write + eslint --fix
- `*.{json,md,yaml,yml}`: prettier --write

## Project Conventions

### Security

- Password hashing with bcrypt (12 rounds) via `@patorbit/auth`
- Account lockout after 5 failed login attempts (15 minute lockout)
- JWT access tokens (15min) + refresh tokens (7-90 days)
- Refresh token rotation with session tracking
- CSRF protection for state-changing operations
- Rate limiting (10 requests per 60 seconds per IP)
- CORS configured for frontend origins
- Verification tokens for email/password reset

### API Design

- RESTful architecture with NestJS modules
- Public/Guarded route separation (@Public() decorator)
- JwtAuthGuard and RateLimitGuard as global guards
- Global AllExceptionsFilter for error handling
- Request/response DTOs for validation
- Audit logging on all auth operations

### Multi-tenant Design

- Organization-scoped data model
- Profile -> OrganizationMember chain for tenant resolution
- AsyncLocalStorage for request-scoped tenant context
- Soft delete (deletedAt) on organizations

### Database

- PostgreSQL via Prisma ORM (@patorbit/database)
- Redis for caching
- Soft delete pattern for entities
- UUID primary keys
- Timestamp columns (createdAt, updatedAt)

### Logging

- LoggingService (Winston-based) for structured logging
- Log levels: debug, info, warn, error
- Global exception filter logs all errors
- Audit module for security events

### Health Checks

- `/health` endpoint (public, no auth required)
- Health indicators: Prisma (database), Redis, Storage (S3-compatible)
- Checks: `database`, `redis`, `storage`

## Additional Resources

- **Architecture Decisions:** `specifications/adr/` directory
- **Deployment Guide:** `specifications/deployment-guide.md`
- **Runbook:** `specifications/runbook.md`
- **Recovery Guide:** `specifications/recovery-guide.md`

This documentation is continuously updated as the project evolves.
