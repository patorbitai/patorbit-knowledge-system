# 003. Use PostgreSQL as Primary Database

- **Status**: Accepted
- **Date**: 2026-07-21
- **Author**: Platform Team

## Context

The Patorbit platform requires a reliable and feature-rich relational database for transactional data. It must support JSON, full-text search, and advanced indexing.

## Decision Drivers

- ACID compliance
- Feature maturity
- Extensibility (pgvector, etc.)
- Community and ecosystem

## Considered Options

1. **PostgreSQL**: Open-source, highly extensible, reliable.
2. **MySQL**: Similar, but lacks certain features.
3. **CockroachDB**: Spanner-compatible, higher complexity.

## Decision Outcome

**Chosen option**: **PostgreSQL**, for its reliability, extensibility, and community.

## References

- [Data Architecture](../data-architecture.md)
