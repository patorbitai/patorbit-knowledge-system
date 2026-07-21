# Testing Standards

## Purpose

Testing requirements for all code.

## Test Coverage Targets

| Layer        | Coverage       |
| ------------ | -------------- |
| Domain logic | 90%+           |
| Controllers  | 80%+           |
| Services     | 85%+           |
| Components   | 80%+           |
| E2E          | Critical paths |

## Test Types

| Type        | Tool                  | When           |
| ----------- | --------------------- | -------------- |
| Unit        | Vitest                | Every PR       |
| Component   | React Testing Library | Every PR       |
| Integration | Vitest + DB           | Every PR       |
| E2E         | Playwright            | Staging deploy |
| Visual      | Percy / Chromatic     | Every PR       |

## Naming

- Test files: `{name}.test.ts`.
- Test suites describe the module.
- Test cases describe the expected behavior.

## References

- [Quality Architecture](../specifications/quality/README.md): Testing strategy.
