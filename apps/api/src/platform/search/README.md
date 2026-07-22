# Platform Search

Provides a global `SearchService` abstraction for indexing documents, querying, index lifecycle operations, and provider health checks.

## Usage

Import `SearchModule.forRoot({ provider: "noop" })`, then inject `SearchService` and use the typed document and query contracts exported from this directory.

## Providers and configuration

- `noop` (default): accepts every write, reports no indexes, and returns empty search results.
- `opensearch`: accepts `node`, `username`, and `password` for the REST endpoint.
- `typesense`: reserved placeholder; operations report that the integration is not configured.

Use `noop` when search infrastructure is optional or unavailable. It provides stable, empty response shapes so the application can continue without network access or persisted search data.
