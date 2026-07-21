# Infrastructure

## Purpose

This document defines the cloud infrastructure architecture for the Patorbit platform. It covers networking, DNS, CDN, container orchestration, and cloud provider choices.

## Scope

This document covers all infrastructure components required to run the platform at scale.

---

## Infrastructure Overview

```mermaid
graph TB
    subgraph "Cloud Provider (AWS / GCP)"
        subgraph "Networking"
            VPC[VPC]
            SUBNET[Public Subnet]
            PRIV[Private Subnet]
            NAT[NAT Gateway]
            LB[Load Balancer / Ingress]
        end

        subgraph "Compute"
            EKS[Kubernetes (EKS/GKE)]
            NODES[Node Pool - General]
            GPU[Node Pool - GPU / AI]
        end

        subgraph "Data"
            PSQL[(Amazon RDS / Cloud SQL)]
            NEOJ[(Neo4j Aura / GDS)]
            OSN[(OpenSearch)]
            RS[(ElastiCache / Memorystore)]
            S3[(S3 / GCS)]
        end

        subgraph "Security"
            KMS[Key Management]
            SECRET[Secrets Manager]
            WAF[WAF / DDoS Protection]
        end

        subgraph "Observability"
            OTL[OpenTelemetry Collector]
            CWL[CloudWatch / Cloud Logging]
            XRAY[X-Ray / Cloud Trace]
        end
    end

    subgraph "Edge (Cloudflare)"
        DNS[DNS]
        CDN[CDN]
        DDoS[DDoS Mitigation]
        SSL[TLS Termination]
    end

    subgraph "CI/CD (GitHub Actions)"
        ACT[GitHub Actions Runner]
        REG[Container Registry]
    end

    User --> DNS
    DNS --> CDN
    CDN --> SSL
    SSL --> LB
    LB --> EKS
    EKS --> NODES
    EKS --> GPU
    NODES --> PSQL
    NODES --> NEOJ
    NODES --> OSN
    NODES --> RS
    NODES --> S3

    style VPC fill:#e3f2fd
    style LB fill:#bbdefb
    style EKS fill:#90caf9
    style PSQL fill:#81c784
    style NEOJ fill:#66bb6a
    style OSN fill:#4caf50
    style RS fill:#ffb74d
    style S3 fill:#ff8a65
    style KMS fill:#f48fb1
    style SECRET fill:#f48fb1
    style WAF fill:#f48fb1
    style DNS fill:#4db6ac
    style CDN fill:#4db6ac
    style DDoS fill:#4db6ac
    style SSL fill:#4db6ac
```

---

## Cloud Provider

**Primary**: AWS (or GCP as equivalent alternative).

The infrastructure architecture is cloud-agnostic at the application layer, but we optimize for the chosen provider's managed services for operational efficiency.

---

## Networking

- **VPC**: Single VPC with public and private subnets across 3 Availability Zones (AZs).
- **Public Subnets**: Load balancers, NAT gateways.
- **Private Subnets**: Application pods, databases, caches, message brokers.
- **NAT Gateway**: Outbound internet access for private subnet resources.
- **Security Groups**: Security group per service with least-privilege ingress/egress rules.
- **VPC Endpoints**: Private connectivity to AWS services without internet transit.

## Compute (Kubernetes)

- **Cluster**: Amazon EKS or Google GKE.
- **Node Groups**:
  - General Purpose (on-demand): Application services, BFF.
  - Memory Optimized: Caching sidecars, heavy processing.
  - GPU (spot): AI inference workloads.
- **Autoscaling**: Cluster Autoscaler + Horizontal Pod Autoscaler.
- **Service Mesh**: Istio or Linkerd for mTLS, traffic management, and observability.

## Database Services

| Service        | Managed Offering                      |
| -------------- | ------------------------------------- |
| PostgreSQL     | Amazon RDS for PostgreSQL / Cloud SQL |
| Neo4j          | Neo4j AuraDB (managed)                |
| OpenSearch     | Amazon OpenSearch Service             |
| Redis          | Amazon ElastiCache / Memorystore      |
| Object Storage | Amazon S3 / Google Cloud Storage      |

## DNS and CDN

| Service             | Technology                 |
| ------------------- | -------------------------- |
| **DNS**             | Cloudflare DNS             |
| **CDN**             | Cloudflare CDN             |
| **WAF**             | Cloudflare WAF             |
| **DDoS Protection** | Cloudflare DDoS mitigation |

## Secrets and Key Management

- **Secrets**: AWS Secrets Manager / GCP Secret Manager.
- **Encryption Keys**: AWS KMS / GCP Cloud KMS with automatic rotation.
- **Workload Identity**: Kubernetes Service Accounts mapped to cloud IAM roles.

## Monitoring and Logging

- **Logs**: CloudWatch / Cloud Logging (structured logs shipped via OpenTelemetry).
- **Metrics**: Prometheus + Grafana (managed on GKE, or Amazon Managed Prometheus).
- **Tracing**: OpenTelemetry distributed tracing, exported to Jaeger or similar.

## Backup Infrastructure

- **Databases**: Automated daily snapshots with 30-day retention.
- **Object Storage**: Cross-region replication for disaster recovery.
- **Configuration**: Infrastructure-as-Code (Terraform) stored in Git.

## Infrastructure as Code

- **Tool**: Terraform (or OpenTofu).
- **State**: Stored in a shared backend (Terraform Cloud / S3 with DynamoDB locking).
- **Modularity**: Each major component (database, compute, networking, monitoring) is a separate Terraform module.

## References

- [Deployment Architecture](deployment-architecture.md): How infrastructure is deployed.
- [Security Architecture](security-architecture.md): Network security controls.
- [Scalability](scalability.md): Scaling strategy.
- [Disaster Recovery](disaster-recovery.md): Recovery plan.
