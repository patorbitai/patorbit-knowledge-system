# Monitoring

## Purpose

Comprehensive monitoring across all platform layers.

## Monitoring Types

| Type           | Examples                                   | Tool                      |
| -------------- | ------------------------------------------ | ------------------------- |
| Infrastructure | CPU, memory, disk, network                 | Prometheus Node Exporter  |
| Application    | Latency, RPS, error rate                   | Prometheus + kube-metrics |
| Database       | Connections, query time, replication lag   | Database exporter         |
| AI             | Token usage, cost, cache hit rate          | Custom metrics            |
| Business       | Active users, registrations, verifications | Custom metrics            |
| Synthetic      | Playwright health checks                   | Grafana Synthetics        |

## Monitors

- **Infrastructure**: Every node, pod, and persistent volume.
- **Database**: Every database instance.
- **Synthetic**: Critical user journeys every 5 minutes.

## References

- [Observability](observability.md): Overall strategy.
- [Alerting](alerting.md): Alert rules.
