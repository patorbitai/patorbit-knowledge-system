# Branching Strategy

## Purpose

Branch naming and rules.

## Branch Naming

| Pattern                  | Example                       |
| ------------------------ | ----------------------------- |
| `feat/{description}`     | `feat/add-claim-verification` |
| `fix/{description}`      | `fix/passport-version-bug`    |
| `chore/{description}`    | `chore/update-dependencies`   |
| `docs/{description}`     | `docs/api-versioning`         |
| `refactor/{description}` | `refactor/claim-service`      |

## Rules

- `main` is protected — no direct pushes.
- Feature branches branch from `main`.
- Hotfix branches branch from `main`.
- Release branches (`release/v1.x`) for patch management.

## References

- [Git Workflow](git-workflow.md): Workflow details.
