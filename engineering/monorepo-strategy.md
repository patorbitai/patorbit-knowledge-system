# Monorepo Strategy

## Purpose

Monorepo tooling, decisions, and conventions.

## Tools

- **Package Manager**: pnpm (fast, disk-efficient).
- **Build System**: Turborepo for task orchestration.
- **Changesets**: For versioning and changelogs.

## Decisions

| Decision        | Choice               | Rationale                        |
| --------------- | -------------------- | -------------------------------- |
| Monorepo tool   | Turborepo            | Native support for pnpm, caching |
| Package manager | pnpm                 | Disk efficiency, strictness      |
| Versioning      | Changesets           | Automated semver, changelogs     |
| Shared config   | `@patorbit/config-*` | Single source of truth           |

## Workspace Organization

```
apps/*       # Deployable applications
packages/*   # Shared libraries
services/*   # Backend services (modular monolith)
```

## References

- [Repository Structure](repository-structure.md): Folder layout.
