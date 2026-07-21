# Commit Conventions

## Purpose

Commit message format.

## Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

## Types

| Type       | Usage                               |
| ---------- | ----------------------------------- |
| `feat`     | New feature                         |
| `fix`      | Bug fix                             |
| `docs`     | Documentation                       |
| `style`    | Formatting                          |
| `refactor` | Code change with no behavior change |
| `test`     | Adding tests                        |
| `chore`    | Maintenance                         |

## Example

```
feat(passport): add claim verification workflow

Implement evidence upload, verification request, and verdict recording.
Closes #123
```

## References

- [Branching Strategy](branching-strategy.md): Branch naming.
