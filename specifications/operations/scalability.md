# Scalability

## Purpose

Horizontal and vertical scaling strategy for all platform components.

## Component Scaling

| Component        | Method                                   | Trigger          |
| ---------------- | ---------------------------------------- | ---------------- |
| Frontend         | HPA                                      | CPU > 70%, RPS   |
| Backend Services | HPA                                      | CPU > 70%, RPS   |
| AI Inference     | HPA + GPU node pool                      | Queue depth, RPS |
| PostgreSQL       | Read replicas (reads), vertical (writes) | CPU, connections |
| Redis            | Cluster mode                             | Memory usage     |
| OpenSearch       | Data nodes                               | Shard size, QPS  |

## Key Metrics

- Target: RPS supported = 10x average load.
- Scale-out cooldown: 60 seconds.
- Scale-in cooldown: 180 seconds.

## References

- [Auto-Scaling](auto-scaling.md): Auto-scaling policies.
- [Capacity Planning](capacity-planning.md): Forecasting.
