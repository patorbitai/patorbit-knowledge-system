# Observability

## Purpose

Unified observability strategy covering logs, metrics, and traces.

## Three Pillars

| Pillar  | Tool                   | Purpose              |
| ------- | ---------------------- | -------------------- |
| Logs    | OpenTelemetry -> Loki  | Event records        |
| Metrics | Prometheus             | Numeric measurements |
| Traces  | OpenTelemetry -> Tempo | Request flow         |

## Key Dashboards

| Dashboard      | Audience    | Contains                        |
| -------------- | ----------- | ------------------------------- |
| Service Health | Engineering | Latency, error rate, throughput |
| Business KPIs  | Product     | Active users, claims created    |
| AI Operations  | AI Team     | Token usage, cost, cache hit    |
| Database       | DBA         | Connections, slow queries       |
| Cost           | FinOps      | Spend by service, budget        |

## References

- [Monitoring](monitoring.md): Monitoring details.
- [Logging](logging.md): Logging standards.
- [Tracing](tracing.md): Distributed tracing.
