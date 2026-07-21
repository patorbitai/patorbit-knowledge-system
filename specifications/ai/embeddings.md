# Embeddings

## Purpose

This document defines the embedding strategy for vector-based retrieval and semantic search.

## Scope

Generation, storage, refresh, similarity, and versioning.

---

## Embedding Generation

- **Model**: `text-embedding-3-small` (OpenAI) for general-purpose embeddings.
- **Fallback**: `claude-embeddings` or similar when primary provider unavailable.
- **Dimensions**: 768-1536 dimensions depending on model.

## What Gets Embedded

| Content           | Frequency     | Use Case              |
| ----------------- | ------------- | --------------------- |
| Claims            | On creation   | Semantic claim search |
| Skills            | On creation   | Skill matching        |
| Resume sections   | On generation | Resume search         |
| Evidence metadata | On submission | Evidence retrieval    |
| Job descriptions  | On search     | Candidate matching    |

## Storage

- **Primary**: pgvector (PostgreSQL extension) for operational embeddings.
- **Scalability**: Pinecone for high-scale embedding storage.
- **Cache**: Redis for frequently accessed embedding vectors.

## Refresh Strategy

- **On Update**: Embedding is regenerated when source content changes.
- **Bulk Refresh**: Nightly batch job re-embeds stale content (< 90 days since last embedding).

## Similarity Metrics

- **Cosine Similarity**: Default metric for comparing embedding vectors.
- **Normalization**: All embeddings are L2-normalized before storage.

## Versioning

- **Model Version**: Track which embedding model generated each vector.
- **Migration**: When upgrading the embedding model, re-embed all content.

## References

- [Vector Search](vector-search.md): Search on embeddings.
- [RAG Architecture](rag-architecture.md): Retrieval flow.
