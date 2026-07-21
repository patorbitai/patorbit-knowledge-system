# Auto-Scaling

## Purpose

Auto-scaling policies for all platform components.

## Compute Auto-Scaling

| Metric              | Target             | Action          |
| ------------------- | ------------------ | --------------- |
| CPU utilization     | 70% target         | Scale pods      |
| Memory utilization  | 70% target         | Scale pods      |
| Requests per second | Depends on service | Scale pods      |
| Queue depth         | 1000               | Scale consumers |

## Database Auto-Scaling

- **Storage**: Automatic storage scaling.
- **Read Replicas**: Add replicas when CPU > 70%.
- **Vertical Scaling**: Manual, with failover.

## Cluster Auto-Scaling

- **Node Scaling**: Cluster Autoscaler adds/removes nodes.
- **Node Pools**: Separate pools for CPU, memory, GPU workloads.
- **Spot Instances**: GPU batch jobs on spot with fallback.

## References

- [Scalability](scalability.md): Scaling architecture.
