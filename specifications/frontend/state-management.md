# State Management

## Purpose

This document defines the frontend state management architecture, ensuring predictable, maintainable, and performant state handling.

## Scope

This document covers server state, client state, session state, and UI state.

---

## State Architecture

```mermaid
graph TB
    subgraph "State Types"
        SERVER[Server State]
        CLIENT[Client State]
        SESSION[Session State]
        UI[UI State]
        URL[URL State]
    end

    subgraph "Libraries"
        RQ[React Query]
        ZUST[Zustand]
        NEXT[NextAuth.js]
        RHForm[React Hook Form]
        NextRouter[Next.js Router]
    end

    SERVER --> RQ
    CLIENT --> ZUST
    SESSION --> NEXT
    UI --> RHForm
    URL --> NextRouter

    style SERVER fill:#e3f2fd
    style CLIENT fill:#e3f2fd
    style SESSION fill:#e3f2fd
    style UI fill:#e3f2fd
    style URL fill:#e3f2fd
    style RQ fill:#90caf9
    style ZUST fill:#90caf9
    style NEXT fill:#90caf9
    style RHForm fill:#90caf9
    style NextRouter fill:#90caf9
```

---

## Server State

- **Library**: TanStack Query (React Query)
- **Purpose**: Manage data from the API (caching, refetching, invalidation).
- **Rules**: All data fetched from the API must be managed by React Query.

## Client State

- **Library**: Zustand
- **Purpose**: Manage global client state (theme, user preferences, sidebar state).
- **Rules**: Use for shared state that is not persisted on the server.

## Session State

- **Library**: NextAuth.js
- **Purpose**: Manage user session, authentication status, and roles.
- **Rules**: Access session via `useSession()` hook.

## UI State

- **Library**: React Hook Form, `useState`
- **Purpose**: Manage local component state (form inputs, modals, toggles).
- **Rules**: UI state should be co-located with the component that uses it.

## URL State

- **Library**: Next.js Router
- **Purpose**: Manage state that needs to be shareable (filters, search queries, pagination).
- **Rules**: Update URL via `useRouter` hook.

## References

- [Data Fetching](data-fetching.md): Server state interaction.
- [Application Architecture](application-architecture.md): State layer.
