# 005. Use OpenSearch for Search

- **Status**: Accepted
- **Date**: 2026-07-21
- **Author**: Platform Team

## Context

The Patorbit platform requires a full-featured search engine for resumes, claims, and candidates.

## Decision Drivers

- Full-text search quality
- Custom analyzers and synonyms
- Index lifecycle management

## Considered Options

1. **OpenSearch**: Apache-licensed, actively maintained fork of Elasticsearch.
2. **Elasticsearch**: Original, but license changes complicate usage.
3. **Algolia**: Managed, expensive at scale.

## Decision Outcome

**Chosen option**: **OpenSearch**, due to its open-source license, feature parity with Elasticsearch, and active community.

## References

- [Data Architecture](../data-architecture.md)
