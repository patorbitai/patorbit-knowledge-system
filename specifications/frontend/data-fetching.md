# Data Fetching

## Purpose

This document defines the API interaction strategy for the frontend, covering caching, optimistic updates, retries, and background refresh.

## Library

- **React Query** (TanStack Query) for all server state management.
- A thin **API client** (using `fetch`) for making HTTP requests.

## Data Fetching Flow

```mermaid
sequenceDiagram
    participant Comp as Component
    participant RQ as React Query
    participant API as API Client
    participant Cache
    participant Server

    Comp->>RQ: useQuery('key')
    RQ->>Cache: Check cache
    alt Cache Miss
        RQ->>API: GET /resource
        API->>Server: Request
        Server-->>API: Response
        API-->>RQ: Data
        RQ->>Cache: Store data
        RQ-->>Comp: data
    else Cache Hit
        Cache-->>RQ: Cached data
        RQ-->>Comp: data
    end
```

## Caching

- **Cache Keys**: Unique keys per query (e.g., `['claims', { passportId: '123' }]`).
- **Cache Invalidation**: On successful mutation (`POST`, `PUT`, `DELETE`), invalidate related query caches.
- **Stale-while-revalidate**: Serve stale data from cache while refetching in the background.

## Optimistic Updates

For high-confidence mutations (e.g., creating a claim), update the UI optimistically before the API responds. Roll back on failure.

## Retries

- Failed queries are retried 3 times with exponential backoff.
- Only retry on network errors or 5xx server errors.
- 4xx client errors are not retried.

## Background Refresh

- Data is automatically refetched on window refocus and network reconnection.
- Configure `staleTime` to control how long data is considered fresh.

## References

- [State Management](state-management.md): Server state.
- [Error Handling](error-handling.md): API errors.
- [Performance](performance.md): Caching for performance.
