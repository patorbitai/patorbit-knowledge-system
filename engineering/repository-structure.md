# Repository Structure

## Purpose

Monorepo organization and folder conventions.

## Top-Level Structure

```
patorbit/
  .github/            # GitHub Actions, templates
  engineering/         # This engineering handbook
  specifications/      # All architecture specifications
  apps/                # Application packages
    web/               # Next.js web app
    admin/             # Admin portal
  packages/            # Shared packages
    ui/                # Design system components (@patorbit/ui)
    api-client/        # API client (@patorbit/api-client)
    shared/            # Shared types and utilities
    config/            # Shared configs (eslint, tsconfig)
  services/            # Backend services
    auth/              # Auth service
    passport/          # Passport service
    resume/            # Resume service
    verification/      # Verification service
    organizations/     # Organization service
    billing/           # Billing service
    ai/                # AI orchestration service
    notifications/     # Notification service
  tools/               # Internal tools and scripts
  docs/                # Published documentation content
```

## Naming Conventions

- Packages: `@patorbit/{name}`
- Services: kebab-case directory names
- Apps: short, descriptive names

## References

- [Monorepo Strategy](monorepo-strategy.md): Monorepo decisions.
