# 004. Use Neo4j for Knowledge Graph

- **Status**: Accepted
- **Date**: 2026-07-21
- **Author**: Platform Team

## Context

The Knowledge Graph requires a database optimized for highly connected data and relationship traversal queries.

## Decision Drivers

- Graph traversal performance
- Query expressiveness
- ACID compliance

## Considered Options

1. **Neo4j**: Mature graph database.
2. **Amazon Neptune**: Managed, but query languages less expressive.
3. **PostgreSQL + recursive CTEs**: Not suitable for deep graph traversals.

## Decision Outcome

**Chosen option**: **Neo4j**, for its native graph storage and expressive Cypher query language.

## References

- [Data Architecture](../data-architecture.md)
- [Knowledge Graph Specification](../domain/knowledge-graph.md)
