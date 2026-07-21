# Cloud Architecture

## Purpose

Cloud-provider-agnostic architecture design for compute, networking, storage, and managed services.

## Compute

- **Primary**: Kubernetes (EKS/GKE) for container orchestration.
- **GPU**: GPU node pool for AI inference workloads.
- **Spot Instances**: GPU batch jobs on spot instances.

## Networking

- **VPC**: Single VPC with public and private subnets across 3 AZs.
- **Service Mesh**: Istio or Linkerd for mTLS and traffic management.
- **Private Links**: VPC endpoints for managed services.

## Managed vs Self-Managed

| Service        | Managed                           | Reason              |
| -------------- | --------------------------------- | ------------------- |
| PostgreSQL     | Managed (RDS/Cloud SQL)           | Reduced ops burden  |
| Redis          | Managed (ElastiCache/Memorystore) | Auto-failover       |
| OpenSearch     | Managed                           | Auto-scaling        |
| Object Storage | S3/GCS                            | Infinite durability |

## References

- [Infrastructure Overview](infrastructure-overview.md): Architecture.
- [Networking](networking.md): Network design.
