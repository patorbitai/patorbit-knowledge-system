# AI Platform Overview

## Purpose

This document describes the end-to-end AI architecture for the Patorbit platform, showing how user requests are processed through the AI pipeline.

## Scope

This document covers all major AI components, their interactions, and the data flow from request to response.

---

## AI Architecture (C4 Level 1)

```mermaid
graph TB
    subgraph "User Layer"
        USER[User / Application]
    end

    subgraph "AI Gateway"
        GW[AI Gateway]
        AUTH[Auth / Rate Limit]
        ROUTE[Model Router]
        CACHE[Semantic Cache]
    end

    subgraph "Orchestration"
        ORCH[AI Orchestrator]
        AGENT[Agent Manager]
        TOOLS[Tool Registry]
        PROMPT[Prompt Manager]
    end

    subgraph "Retrieval"
        RAG[RAG Engine]
        VEC[(Vector Store)]
        EMB[Embedding Service]
        KG[(Knowledge Graph)]
        DOC[(Document Store)]
    end

    subgraph "Models"
        CLAUDE[Claude API]
        OPENAI[OpenAI API]
        MIXTRAL[Future Provider]
        EMB_MODEL[Embedding Model]
    end

    subgraph "Quality"
        GUARD[Guardrails]
        EVAL[Evaluation]
        MON[Monitoring]
    end

    subgraph "Human Review"
        HITL[Human Review Queue]
    end

    USER --> GW
    GW --> AUTH
    AUTH --> CACHE
    CACHE --> ROUTE
    ROUTE --> ORCH
    ORCH --> AGENT
    ORCH --> PROMPT
    AGENT --> TOOLS
    TOOLS --> RAG
    RAG --> VEC
    RAG --> EMB
    RAG --> KG
    RAG --> DOC
    ORCH --> CLAUDE
    ORCH --> OPENAI
    ORCH --> MIXTRAL
    ORCH --> GUARD
    GUARD --> EVAL
    EVAL --> MON
    GUARD --> HITL
    EMB --> EMB_MODEL

    style USER fill:#e3f2fd
    style GW fill:#bbdefb
    style ORCH fill:#90caf9
    style AGENT fill:#64b5f6
    style TOOLS fill:#42a5f5
    style RAG fill:#2196f3
    style VEC fill:#81c784
    style KG fill:#66bb6a
    style CLAUDE fill:#ce93d8
    style OPENAI fill:#ce93d8
    style GUARD fill:#ef5350
    style EVAL fill:#ffa726
    style HITL fill:#ff8a65
```

---

## Core Components

### AI Gateway

The entry point for all AI requests. Responsibilities:

- **Authentication**: Validate API tokens, enforce rate limits.
- **Semantic Cache**: Cache semantically similar requests to reduce cost and latency.
- **Model Router**: Route to the appropriate model based on capability, cost, and availability.

### AI Orchestrator

The brain of the AI platform. Responsibilities:

- **Agent Management**: Create and manage AI agent instances.
- **Prompt Assembly**: Compile prompt templates with context and instructions.
- **Tool Invocation**: Execute tools (search, Knowledge Graph, resume builder) during generation.
- **Multi-Step Reasoning**: Chain multiple AI operations for complex tasks.
- **Fallback Handling**: Retry with alternative models on failure.

### RAG Engine

Retrieves relevant context to ground AI responses. Responsibilities:

- **Query Construction**: Build search queries from user intent.
- **Multi-Source Retrieval**: Search across vector store, Knowledge Graph, and document store.
- **Chunking and Embedding**: Process documents into searchable chunks.
- **Re-ranking**: Order retrieved results by relevance.
- **Context Assembly**: Compose retrieved information into the prompt context window.

### Guardrails

Enforces safety and policy on all AI interactions. Responsibilities:

- **Input Guard**: Detect prompt injection, PII, and inappropriate content in user input.
- **Output Guard**: Filter harmful, biased, or ungrounded content from AI output.
- **Policy Enforcement**: Apply workspace and organization AI usage policies.

---

## Request Flow

```mermaid
sequenceDiagram
    participant App as Application
    participant GW as AI Gateway
    participant Cache as Semantic Cache
    participant ORCH as Orchestrator
    participant RAG as RAG Engine
    participant LLM as LLM
    participant GUARD as Guardrails

    App->>GW: generateResume(userId, config)
    GW->>GW: Authenticate, rate limit

    GW->>Cache: Lookup cache
    alt Cache hit
        Cache-->>GW: Cached response
        GW-->>App: Response
    else Cache miss
        Cache-->>GW: Miss

        GW->>ORCH: Execute resume generation

        ORCH->>RAG: Retrieve user claims, skills
        RAG->>RAG: Query vector store + KG
        RAG-->>ORCH: Context

        ORCH->>ORCH: Assemble prompt
        ORCH->>LLM: Generate
        LLM-->>ORCH: Response

        ORCH->>GUARD: Validate output
        GUARD-->>ORCH: Safe output

        ORCH->>Cache: Store response
        ORCH-->>GW: Result
        GW-->>App: Response
    end
```

## References

- [Model Abstraction](model-abstraction.md): Provider-agnostic layer.
- [RAG Architecture](rag-architecture.md): Retrieval details.
- [Agent Architecture](agent-architecture.md): Agent design.
- [Orchestration](orchestration.md): Orchestration engine.
