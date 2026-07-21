# Orchestration

## Purpose

Container orchestration strategy using Kubernetes.

## Cluster Design

- Kubernetes (EKS/GKE).
- Node pools: General, memory-optimized, GPU.
- Namespaces per service domain.

## Scheduling

- Pod resource requests and limits enforced.
- Pod anti-affinity for HA.
- Horizontal Pod Autoscaler (HPA) for dynamic scaling.

## Health Checks

| Probe     | Purpose                        |
| --------- | ------------------------------ |
| Liveness  | Restart unhealthy pods         |
| Readiness | Stop traffic to unhealthy pods |
| Startup   | Allow slow-starting containers |

## Self-Healing

- Failed pods are automatically restarted.
- Failed nodes are drained and replaced.
- Persistent volumes are automatically reattached.

## References

- [Container Strategy](container-strategy.md): Container lifecycle.
- [Scalability](scalability.md): Scaling strategy.
