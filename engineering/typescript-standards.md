# TypeScript Standards

## Purpose

TypeScript best practices for the Patorbit platform.

## Strict Mode

- `strict: true` in tsconfig.
- `noUncheckedIndexedAccess: true`.
- `exactOptionalPropertyTypes: true`.

## Type Rules

- Prefer `type` over `interface` for unions and intersections.
- Use `interface` for public API contracts.
- Avoid `any`. Use `unknown` when the type is truly unknown.
- Use branded types for domain IDs (`type UserId = string & { readonly __brand: 'UserId' }`).

## Imports

- Use `import type` for type-only imports.
- No default exports (named exports only).
- Path aliases for workspace packages (`@patorbit/`).

## References

- [Coding Standards](coding-standards.md): General conventions.
