# Patorbit Knowledge System

A comprehensive AI-powered knowledge management platform built with NestJS, Next.js, and PostgreSQL. The Patorbit Knowledge System (PKS) enables organizations to manage, verify, and leverage their collective knowledge with AI-powered insights, credential verification, and career development tools.

## Architecture

```
/apps
  api     - NestJS REST API (port 4000)
  web     - Next.js web application (port 3000)
  admin   - Next.js admin panel (port 3001)

/packages
  auth          - Authentication & password hashing
  billing       - Billing and subscription management
  config        - Environment configuration & validation
  database      - Prisma ORM & PostgreSQL schema
  notifications - Email & notification delivery
  storage       - File storage (S3-compatible)
  ui            - Shared UI component library
  utils         - Shared utility functions
  ai            - AI/ML service integrations
  types         - Shared type definitions
  tsconfig      - Shared TypeScript configuration
```

### Tech Stack

- **Backend:** NestJS (Node.js / TypeScript), RESTful API
- **Frontend:** Next.js 14+, React
- **Database:** PostgreSQL 16 + Prisma ORM
- **Cache:** Redis 7
- **Search:** OpenSearch
- **Knowledge Graph:** Neo4j
- **File Storage:** S3-compatible (MinIO for development)
- **Build:** pnpm workspaces, Turborepo

## Features

### Core Platform

- Multi-tenant organization management
- Role-based access control (Owner, Admin, Member)
- User profile management
- Session management with refresh token rotation
- Audit logging for security events

### Resume & Career Tools

- Resume builder with templates
- Career passport (verifiable credentials)
- Resume import from PDF, DOCX, LinkedIn, JSON
- AI-powered resume optimization

### Knowledge Management

- Knowledge graph construction and querying
- Claim and evidence management
- Trust and confidence scoring
- Contextual timeline tracking

### Credential Verification

- Identity verification and management
- Credential issuance and verification
- Verification token management
- Trust network building

### AI Platform

- Document intelligence
- Evidence analysis
- Career recommendations
- Knowledge graph integration
- Hallucination mitigation
- Human-in-the-loop workflows

### Platform Services

- Rate limiting (10 requests/60 seconds)
- CSRF protection (double-submit cookie pattern)
- Health checks (database, Redis, storage)
- Event bus for distributed processing
- Scheduled job execution
- Feature flags

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9.15+
- PostgreSQL 16+
- Redis 7+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd patorbit-knowledge-system

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
pnpm db:migrate

# Generate Prisma client
pnpm db:generate

# Start development servers
pnpm dev
```

### Environment Variables

Key environment variables (see `.env.example` for full list):

| Variable             | Description                                   |
| -------------------- | --------------------------------------------- |
| `DATABASE_URL`       | PostgreSQL connection string                  |
| `REDIS_URL`          | Redis connection string                       |
| `JWT_ACCESS_SECRET`  | Secret for signing access tokens (32+ chars)  |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens (32+ chars) |
| `API_PORT`           | API server port (default: 4000)               |
| `NODE_ENV`           | Environment: development, production, test    |
| `LOG_LEVEL`          | Logging level: debug, info, warn, error       |

### Development

```bash
# Start all services
pnpm dev

# Start individual services
pnpm --filter @patorbit/api dev
pnpm --filter @patorbit/web dev
pnpm --filter @patorbit/admin dev
```

## Available Commands

### Core

- `pnpm dev` - Start all development servers
- `pnpm build` - Build all packages and applications
- `pnpm test` - Run all tests
- `pnpm lint` - Lint all projects
- `pnpm format` - Format code with Prettier
- `pnpm typecheck` - TypeScript type checking

### Database

- `pnpm db:migrate` - Run database migrations
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:push` - Push schema to database
- `pnpm db:studio` - Open Prisma Studio

### Package Management

- `pnpm clean` - Clean all build artifacts

## API Endpoints

### Health

```
GET /health - System health check (database, Redis, storage)
```

### Authentication

```
POST /auth/register           - Register new user
POST /auth/login               - Login (returns access token + refresh cookie)
POST /auth/refresh             - Refresh access token
POST /auth/logout              - Logout (revokes session)
GET  /auth/me                  - Get current user profile
POST /auth/send-verification   - Send email verification
POST /auth/verify-email        - Verify email
POST /auth/forgot-password     - Request password reset
POST /auth/reset-password      - Reset password
GET  /auth/sessions            - List active sessions
DELETE /auth/sessions/:id      - Revoke session
DELETE /auth/sessions          - Revoke all sessions
```

### CSRF

```
GET /api/auth/csrf - Get CSRF token
```

## Security

- **Authentication:** JWT-based with access (15min) and refresh (7-90 days) tokens
- **Session Management:** Refresh token rotation with database tracking
- **CSRF Protection:** Double-submit cookie pattern with `X-CSRF-Token` header
- **Password Hashing:** bcrypt with 12 rounds
- **Account Lockout:** 5 failed attempts triggers 15-minute lockout
- **Rate Limiting:** 10 requests per 60 seconds per IP
- **Audit Logging:** All authentication events logged

## Documentation

- **API Docs:** Available at the API server `/api` endpoint
- **Architecture Decision Records:** `specifications/adr/`
- **Deployment Guide:** `specifications/deployment-guide.md`
- **Runbook:** `specifications/runbook.md`
- **Recovery Guide:** `specifications/recovery-guide.md`
- **Full Documentation:** Published from `/docs` directory

## Project Standards

### Code Quality

- ESLint with TypeScript strict mode
- Prettier for consistent formatting
- Husky pre-commit hooks with lint-staged
- Vitest for testing (unit, integration, e2e)

### Branch Strategy

- `main`: Production-ready code
- Feature branches: `feature/*`, `fix/*`, `docs/*`
- Pull requests required for all changes

### Commit Convention

```
<type>(<scope>): <description>
```

Types: feat, fix, docs, refactor, test, chore, style, perf

## License

This project is proprietary software. All rights reserved.

## Resources

- **[Knowledge System Portal](https://patorbitai.github.io/patorbit-knowledge-system/)**
- **[Contribution Guide](docs/CONTRIBUTING.md)**
- **[Roadmap](docs/ROADMAP.md)**
- **[Architecture Overview](docs/index.md)**
