# Tracing

## Purpose

Distributed tracing across all platform services.

## Technology

- **Standard**: OpenTelemetry.
- **Storage**: Tempo / Jaeger.
- **Propagation**: W3C trace context.

## Sampling

| Environment | Rate                 |
| ----------- | -------------------- |
| Development | 100%                 |
| Staging     | 10%                  |
| Production  | 5% (100% for errors) |

## Trace Context

- `traceId`: Identifies the entire request chain.
- `spanId`: Identifies a single service call.
- Headers: `traceparent`, `tracestate`.

## References

- [Observability](observability.md): Observability strategy.
- [Logging](logging.md): Correlation with logs.
