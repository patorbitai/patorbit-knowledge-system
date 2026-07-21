# 009. Use REST as Primary API Architecture

- **Status**: Accepted
- **Date**: 2026-07-21
- **Author**: Platform Team

## Context

The Patorbit platform requires a well-defined API strategy. The API must be simple, well-understood, and easy to version.

## Decision Drivers

- Developer familiarity
- Consistency
- Ease of versioning
- Caching

## Considered Options

1. **REST**: Mature, well-understood, easy to cache.
2. **GraphQL**: Flexible queries, but harder to cache and version.
3. **gRPC**: High performance, but less suitable for public APIs.

## Decision Outcome

**Chosen option**: **REST**, for its simplicity, broad adoption, and excellent caching characteristics. GraphQL may be added later for specific use cases.

## References

- [API Architecture](../api-architecture.md)
