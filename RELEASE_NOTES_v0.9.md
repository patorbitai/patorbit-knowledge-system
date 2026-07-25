# Patorbit Beta v0.9 — Release Notes

**Release Date:** 2026-07-25
**Version:** v0.9.0-rc1
**Status:** Release Candidate 1

## Overview

Patorbit Beta v0.9 marks the first public-facing release of the Patorbit Knowledge System — an AI-powered knowledge management platform for building resumes, cover letters, and career passports. This release focuses on core functionality, stability, and a solid foundation for future enhancements.

## What's Included

### Core Features

- **User Authentication** — Sign-up, sign-in, password reset, email verification, session management with JWT access/refresh token rotation
- **Resume Builder** — Create, edit, and manage resumes with 30+ layout templates; rich text editing, section reordering, offline queue
- **Cover Letters** — Create and manage cover letters alongside resumes
- **Workspace Management** — Folder-based organization, search, sort, and filter for resumes and cover letters
- **AI-Assisted Features** — AI-powered resume analysis and suggestions (requires AI service integration)
- **PDF Export** — Export resumes as PDF via browser-native API
- **Theme/Template System** — 30 template layouts across Classic, Modern, and Minimal categories; customizable themes (fonts, colors, spacing)
- **Organization & Team Features** — Multi-tenant organizations with member roles (Owner, Admin, Member)
- **Trust & Verified Credentials** — Credential verification, trust scoring, confidence scoring
- **Version History** — Snapshot-based versioning for resumes

### Architecture

- NestJS API with modular domain-driven design
- Next.js 14 web application with App Router
- PostgreSQL + Prisma ORM for data persistence
- Redis for caching and session management
- Turborepo monorepo with pnpm workspaces
- Full TypeScript across all packages

### Shared Packages

- `@patorbit/types` — Shared type definitions
- `@patorbit/database` — Prisma schema and database utilities
- `@patorbit/auth` — Authentication primitives (bcrypt hashing, Zod schemas)
- `@patorbit/config` — Environment configuration with Zod validation
- `@patorbit/ui` — React component library (WIP)
- `@patorbit/billing` — Stripe-based subscription management
- `@patorbit/ai` — AI service integrations
- `@patorbit/storage` — File storage abstractions
- `@patorbit/notifications` — Notification delivery services
- `@patorbit/utils` — Shared utility functions

## Known Limitations

- See [KNOWN_ISSUES.md](KNOWN_ISSUES.md) for complete list
- Resume parsers for PDF, DOCX, and LinkedIn imports are stubbed (not yet implemented)
- AI features require external service API key configuration
- PDF export uses browser print-to-PDF (no headless server-side rendering)
- Real-time collaboration is not yet supported

## Upgrade Guide

No upgrade from a prior version is possible; this is the initial release.

## Rollback

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for rollback procedures.

## Release Artifacts

- Git Tag: `v0.9.0-rc1`
- Commit: `994b2e6`
- Branch: `master`

---

_Generated 2026-07-25 for Patorbit Beta v0.9 RC1_
