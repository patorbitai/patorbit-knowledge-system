# Coding Standards

## Purpose

Code style and conventions for the Patorbit platform.

## General Rules

- **Language**: TypeScript for all code.
- **Formatting**: Prettier with consistent config.
- **Linting**: ESLint with strict rules.
- **Naming**: camelCase for variables, PascalCase for types/components, kebab-case for files.

## File Organization

- One file per logical unit.
- Files under 300 lines.
- Related files grouped in directories.

## Naming Conventions

| Element    | Convention  | Example            |
| ---------- | ----------- | ------------------ |
| Variables  | camelCase   | `userName`         |
| Functions  | camelCase   | `getUser()`        |
| Classes    | PascalCase  | `UserService`      |
| Types      | PascalCase  | `UserProfile`      |
| Interfaces | PascalCase  | `IClaimRepository` |
| Enums      | PascalCase  | `ClaimStatus`      |
| Files      | kebab-case  | `user-service.ts`  |
| Constants  | UPPER_SNAKE | `MAX_CLAIMS`       |

## References

- [TypeScript Standards](typescript-standards.md): TS-specific rules.
- [Backend Standards](backend-standards.md): Backend conventions.
