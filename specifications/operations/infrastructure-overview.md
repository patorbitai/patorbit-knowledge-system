# Infrastructure Overview

## Purpose

This document describes the end-to-end infrastructure architecture for the Patorbit platform.

## Scope

This document covers all infrastructure components from the user edge to data storage.

---

## Infrastructure Architecture

```mermaid
graph TB
    subgraph "Users"
        U[End Users]
    end

    subgraph "Edge (Cloudflare)"
        DNS[DNS]
        CDN[CDN]
        WAF[WAF / DDoS]
        SSL[TLS Termination]
    end

    subgraph "Load Balancing"
        ELB[Load Balancer]
        APIGW[API Gateway]
    end

    subgraph "Compute (Kubernetes)"
        FE[Frontend Pods]
        BFF[BFF Pods]
        SVC[Service Pods]
        AI[AI Pods]
        GPU[GPU Node Pool]
    end

    subgraph "Data Layer"
        PG[(PostgreSQL)]
        NEO4J[(Neo4j)]
        OS[(OpenSearch)]
        REDIS[(Redis)]
        S3[(Object Storage)]
    end

    subgraph "Observability"
        PROM[Prometheus]
        GRAF[Grafana]
        LOKI[Loki]
        TEMPO[Tempo]
    end

    U --> DNS
    DNS --> CDN
    CDN --> SSL
    SSL --> WAF
    WAF --> ELB
    ELB --> APIGW
    APIGW --> FE
    APIGW --> BFF
    BFF --> SVC
    SVC --> PG
    SVC --> NEO4J
    SVC --> OS
    SVC --> REDIS
    SVC --> S3
    AI --> GPU
    AI --> PG
    AI --> REDIS
    SVC --> PROM
    SVC --> LOKI
    SVC --> TEMPO
    PROM --> GRAF
    LOKI --> GRAF
    TEMPO --> GRAF

    style U fill:#e3f2fd
    style DNS fill:#bbdefb
    style CDN fill:#bbdefb
    style ELB fill:#90caf9
    style APIGW fill:#90caf9
    style FE fill:#64b5f6
    style BFF fill:#64b5f6
    style SVC fill:#64b5f6
    style AI fill:#ce93d8
    style GPU fill:#ce93d8
    style PG fill:#81c784
    style NEO4J fill:#66bb6a
    style OS fill:#4caf50
    style REDIS fill:#ffb74d
    style S3 fill:#ff8a65
    style PROM fill:#fff9c4
    style GRAF fill:#fff9c4
```

---

## Component Responsibilities

### Edge Layer (Cloudflare)

| Component | Role                                      |
| --------- | ----------------------------------------- |
| DNS       | Global DNS resolution                     |
| CDN       | Static asset caching, edge delivery       |
| WAF       | Web application firewall, DDoS protection |
| SSL       | TLS 1.3 termination                       |

### Load Balancing

| Component     | Role                                     |
| ------------- | ---------------------------------------- |
| Load Balancer | Distributes traffic to compute instances |
| API Gateway   | Route, authenticate, rate limit          |

### Compute (Kubernetes)

| Component | Role                          |
| --------- | ----------------------------- |
| Frontend  | Next.js application (SSR)     |
| BFF       | Backend for Frontend services |
| Services  | Domain service pods           |
| AI        | AI inference pods             |

### Data Layer

| Component  | Role                 |
| ---------- | -------------------- |
| PostgreSQL | Operational database |
| Neo4j      | Knowledge Graph      |
| OpenSearch | Search and logging   |
| Redis      | Caching and queueing |
| S3         | Object storage       |

## References

- [Cloud Architecture](cloud-architecture.md): Cloud provider design.
- [Environments](environments.md): Environment architecture.
- [Networking](networking.md): Network design.
