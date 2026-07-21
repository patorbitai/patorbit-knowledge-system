# React Standards

## Purpose

React and frontend development conventions.

## Component Patterns

- **Function components** with hooks (no class components).
- **Server Components** in Next.js App Router by default.
- **Client Components** only when interactivity is needed.
- **Compound components** for complex UI patterns.

## State Management

- **Server state**: React Query.
- **Client state**: Zustand for global, useState for local.
- **Form state**: React Hook Form.
- **URL state**: Next.js search params.

## Performance

- Dynamic imports for heavy components.
- React.memo only with profiled need.
- useMemo / useCallback only with measured benefit.

## References

- [Frontend Architecture](../specifications/frontend/README.md): UI architecture.
