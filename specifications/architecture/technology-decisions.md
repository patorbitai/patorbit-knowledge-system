# Technology Decisions

## Purpose

This document records the technology decisions for the Patorbit platform. Each decision includes the selected technology, rationale, alternatives considered, and trade-offs.

## Scope

This document covers all major technology choices across frontend, backend, AI, data, and infrastructure layers.

---

## Technology Stack Overview

| Layer                       | Technology                | Status      |
| --------------------------- | ------------------------- | ----------- |
| **Frontend Framework**      | Next.js 14+ (React)       | ✅ Selected |
| **Language**                | TypeScript                | ✅ Selected |
| **Backend Framework**       | NestJS                    | ✅ Selected |
| **API Architecture**        | REST (primary) + Webhooks | ✅ Selected |
| **Primary Database**        | PostgreSQL 16+            | ✅ Selected |
| **Graph Database**          | Neo4j 5.x                 | ✅ Selected |
| **Search Engine**           | OpenSearch 2.x            | ✅ Selected |
| **Cache**                   | Redis 7.x                 | ✅ Selected |
| **Object Storage**          | AWS S3 / Cloudflare R2    | ✅ Selected |
| **LLM Provider**            | Claude API (Anthropic)    | ✅ Selected |
| **Vector Store**            | pgvector / Pinecone       | ✅ Selected |
| **Message Broker**          | RabbitMQ                  | ✅ Selected |
| **Container Orchestration** | Kubernetes (EKS / GKE)    | ✅ Selected |
| **CI/CD**                   | GitHub Actions            | ✅ Selected |
| **Observability**           | OpenTelemetry             | ✅ Selected |
| **Monitoring**              | Prometheus + Grafana      | ✅ Selected |
| **CDN/DNS**                 | Cloudflare                | ✅ Selected |

---

## Detailed Decisions

### 1. Next.js 14+ (React Framework)

**Decision**: Use Next.js with the App Router for the primary web application.

**Rationale**:

- Provides server-side rendering (SSR) and static site generation (SSG) out of the box.
- Excellent developer experience with TypeScript, file-system routing, and API routes.
- Built-in image optimization, font optimization, and ISR.
- Strong community and ecosystem.

**Alternatives Considered**:

- **Create React App**: Deprecated, no SSR.
- **Remix**: Good alternative but smaller ecosystem.
- **Gatsby**: Better suited for static sites, less optimal for dynamic, user-specific pages.

**Trade-Offs**:

- Heavier than a simple React SPA.
- Server-side rendering requires Node.js server capacity.

### 2. NestJS (Backend Framework)

**Decision**: Use NestJS for all backend services.

**Rationale**:

- Opinionated architecture (modules, controllers, providers) aligns with Clean Architecture.
- Built-in dependency injection.
- Excellent TypeScript support.
- Rich ecosystem (authentication, validation, queues, ORM).
- Compatible with Express.js and Fastify.

**Alternatives Considered**:

- **Express.js**: Too lightweight, requires significant architectural decisions.
- **Fastify**: Good performance, but fewer enterprise features.
- **AdonisJS**: Full-featured, but smaller ecosystem.

**Trade-Offs**:

- Opinionated design may feel restrictive for some use cases.
- Learning curve for developers not familiar with Angular-style DI.

### 3. PostgreSQL (Primary Database)

**Decision**: Use PostgreSQL 16+ as the primary operational database.

**Rationale**:

- Mature, reliable, and feature-rich relational database.
- JSONB support for flexible, semi-structured data.
- Extensions like pgvector (vector store) and TimescaleDB (time-series).
- Strong ACID compliance, important for financial transactions.
- Rich indexing options (B-tree, GIN, GiST, BRIN).

**Alternatives Considered**:

- **MySQL**: Similar, but lacks JSONB depth and certain features.
- **CockroachDB**: Spanner-compatible, but higher complexity for initial development.

**Trade-Offs**:

- Read scaling requires application-level read replicas (not automatic).
- Full-text search is less feature-rich than OpenSearch.

### 4. Neo4j (Knowledge Graph)

**Decision**: Use Neo4j 5.x for the Knowledge Graph.

**Rationale**:

- Native graph storage and querying (not just a relational database pretending to be a graph).
- Cypher query language is expressive for graph traversals.
- ACID compliance.
- Managed service (AuraDB) reduces operational overhead.

**Alternatives Considered**:

- **Amazon Neptune**: Managed, but uses SPARQL and Gremlin, smaller player ecosystem.
- **ArangoDB**: Multi-model, but graph features are less mature.
- **PostgreSQL + Recursive CTEs**: Good for simple trees, not ideal for complex graphs.

**Trade-Offs**:

- Additional operational cost for a separate database.
- Requires team expertise in graph modeling and Cypher.

### 5. OpenSearch (Search Engine)

**Decision**: Use OpenSearch 2.x for full-text search.

**Rationale**:

- Full-featured search engine with custom analyzers, synonyms, and relevance tuning.
- Ecosystem of plugins and tools.
- Active community and enterprise support.
- Built-in index lifecycle management.

**Alternatives Considered**:

- **Elasticsearch**: The original, but recent licensing changes complicate usage.
- **Algolia**: Excellent as a service, but expensive at scale and less customizable.

**Trade-Offs**:

- Operational overhead of managing the cluster.
- Data synchronization complexity (dual write to database and search index).

### 6. Redis (Cache/Queue)

**Decision**: Use Redis 7.x for caching, session storage, and task queue.

**Rationale**:

- Extremely fast in-memory data store.
- Support for multiple data types (strings, sets, sorted sets, streams).
- Widely used for caching, rate limiting, and session storage.
- Redis Streams provides a reliable queue.

**Alternatives Considered**:

- **Memcached**: Simpler, but lacks data structures.
- **KeyDB**: Redis-compatible, but smaller community.

**Trade-Offs**:

- In-memory storage is expensive for large datasets.
- Not intended as a primary data store.
- Redis Cluster adds operational complexity.

### 7. Claude API (LLM Provider)

**Decision**: Use Anthropic's Claude API as the primary LLM provider.

**Rationale**:

- Superior understanding of resume structures and professional contexts.
- Strong reasoning capabilities for claim extraction and analysis.
- Tool use (structured output) for reliable data extraction.
- Lower hallucination rates for factual tasks.
- Strong safety features and content filtering.

**Alternatives Considered**:

- **OpenAI API**: Good alternative, strong ecosystem, but less suitable for factual analysis.
- **Open-Source Models**: Llama, Mistral. Lower cost but require self-hosting and have lower quality.

**Trade-Offs**:

- API pricing can be significant at scale (mitigated by caching and prompt optimization).
- Vendor lock-in risk (mitigated by abstraction layer).

### 8. RabbitMQ (Message Broker)

**Decision**: Use RabbitMQ for asynchronous messaging.

**Rationale**:

- Flexible routing (direct, topic, fanout).
- Durable queues with persistence.
- Supports publisher confirms and consumer acknowledgements.
- Proven at scale in production environments.

**Alternatives Considered**:

- **Apache Kafka**: Better for event streaming and high throughput, but higher complexity for simple messaging.
- **Amazon SQS**: Simple, but limited routing.

**Trade-Offs**:

- Requires operational knowledge of RabbitMQ.
- Lower throughput than Kafka for event streaming use cases.

### 9. Kubernetes (Container Orchestration)

**Decision**: Use Kubernetes (EKS/GKE) for container orchestration.

**Rationale**:

- Industry standard for container orchestration.
- Strong ecosystem of tools (Helm, Istio, Prometheus).
- Horizontal autoscaling, rolling updates, self-healing.
- Cloud-agnostic at the orchestration layer.

**Alternatives Considered**:

- **ECS (AWS)**: Simpler, but vendor lock-in.
- **App Runner**: Even simpler, but less flexible.
- **Nomad**: Simpler but smaller ecosystem.

**Trade-Offs**:

- Operational complexity.
- Requires dedicated DevOps/SRE expertise.

### 10. Cloudflare (CDN/DNS/Security)

**Decision**: Use Cloudflare for CDN, DNS, DDoS protection, and WAF.

**Rationale**:

- Global CDN network for low-latency content delivery.
- Excellent DDoS protection.
- DNS management with high reliability.
- WAF with managed rules.

**Alternatives Considered**:

- **AWS CloudFront + Route 53**: Tighter AWS integration, but more expensive and less performant CDN.
- **Fastly**: Niche CDN features, but smaller platform.

**Trade-Offs**:

- Less integrated with cloud provider.

## References

- [Architecture Decision Records](architecture-decision-records.md): Formal ADR process.
- [Architecture Principles](architecture-principles.md): Principles guiding technology decisions.
- [System Overview](system-overview.md): How technologies fit together.
