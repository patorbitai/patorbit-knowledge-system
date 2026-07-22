# Platform Graph

Provides a global `GraphService` abstraction for creating nodes and edges, deleting nodes, and executing graph queries.

## Usage

Import `GraphModule.forRoot({ provider: "noop" })`, then inject `GraphService`. Graph nodes, edges, paths, and result contracts are exported from this directory.

## Providers and configuration

The currently available provider is `noop`; it requires no connection settings. It accepts mutations without persistence and returns an empty record list with zeroed query counters.

This graceful fallback keeps graph-dependent application paths operational when no graph database is configured. Noop data is intentionally discarded and should not be treated as durable storage.
