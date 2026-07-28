# Patorbit Knowledge System

## Overview

Patorbit is a Next.js-based application that builds infrastructure for trustworthy digital information. It focuses on creating a platform where claims, evidence, and reasoning combine to create reliable digital trust.

## Main Features

- **Knowledge Graph Infrastructure**: Building a unified system for representing knowledge, claims, and evidence
- **Trust-Based Platform**: Designing systems that prioritize evidence-based trust over traditional document-based verification
- **Career Development Tools**: Creating the "Career Passport" and related professional identity management
- **Enterprise Solutions**: Building modular components that can be integrated into existing enterprise workflows

## Technology Stack

- **Framework**: Next.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Forms**: React Hook Form with Zod validation
- **UI**: Tailwind CSS with utility classes, Framer Motion animations
- **Styling**: CSS custom properties for theming
- **Deployment**: Vercel

## Project Structure

The project follows a clean, layered architecture:

### Source Code
```
src/
  components/           # React components
    landing/            # Landing page sections
    layout/             # Site-wide layout components
    ui/                 # UI primitives
    common/             # Common/shared components
    auth/               # Authentication components

src/app/
  (marketing)/        # Marketing/public-facing pages
  (auth)/             # Authentication pages
  (dashboard)/        # User dashboard

src/
  actions/             # Server actions for form submissions
  services/            # Business logic services
  schemas/             # Zod validation schemas
  schemas/             # Custom validation functions
  repositories/        # Prisma repositories
  lib/                 # Library code
  prisma/              # Prisma schema and client
  src/validators/      # Validation utilities
```

### Documentation & Config
- `README.md` - This README file
- `CLAUDE.md` - Instructions for Claude integration
- `AGENTS.md` - Agent instructions
- `package.json` - Package configuration and scripts

### Project Root
- `docs/` - Project documentation
- `prisma/` - Database schemas
- `public/` - Static assets
- `node_modules/` - Dependencies

## Core Domain Concepts

Based on the Patorbit Knowledge System (PKS) philosophy:

**Six Core Concepts:**
1. **Identity** - The foundation of trust
2. **Claims** - Structured assertions about skills and experiences
3. **Evidence** - Supporting data that validates claims
4. **Reasoning** - Logical connections between claims and evidence
5. **Confidence** - Statistical confidence in claims
6. **Trust** - The ultimate outcome of the verification process

## Key Pages

### Landing Page (Home)
- Hero section with animated claims display
- Platform overview and value proposition
- Integrated career passport showcase

### Marketing Pages
- `/platform` - Platform architecture overview
- `/features` - Feature descriptions and capabilities
- `/solutions` - Use cases and solutions
- `/pricing` - Subscription plans
- `/about` - Company information
- `/careers` - Job opportunities
- `/blog` - Technical articles and updates
- `/press` - Press releases
- `/contact` - Contact information

### User Pages
- `/login` - User authentication
- `/register` - User registration
- `/dashboard` - User dashboard

## Development and Deployment

### Development
1. Clone the repository
2. `cd patorbit`
3  `npm install`
4. Set up `.env` file with environment variables
5. `npm run dev`

### Database Setup
1. Install Prisma
2. Set up PostgreSQL database
3. Configure `.env` file with DATABASE_URL
4. Run Prisma setup commands

### Deployment
The project is configured for Vercel deployment with modern Next.js features.

## Key Design Philosophy

1. **Evidence-First**: Every claim requires supporting evidence
2. **Trust-Built on Transparency**: Open reasoning and auditable decisions
3. **User-Centric**: Full control over one's digital identity and data
4. **Scalable Architecture**: Modular design that supports various use cases
5. **Developer-Friendly**: Comprehensive APIs and SDKs for integration

## Future Enhancements

- Advanced AI verification systems
- Cross-platform identity sync
- Decentralized identifier (DID) support
- Integration with blockchain verification

## Getting Started

To begin working on this project:

1. Clone the repository
2. Create a `.env` file with the required environment variables
3. Set up the database with the provided SQL script
4. Run `npm run dev` to start the application
5. Explore the documentation and codebase

## Assistance

If you encounter any issues while setting up or working with this project, please reach out through the project's issue tracking system or contact the maintainers directly.

The Patorbit project is designed to be comprehensive and production-ready,
incorporating modern best practices for full-stack development.
