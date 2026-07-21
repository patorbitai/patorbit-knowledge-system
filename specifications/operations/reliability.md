# Reliability

## Purpose

Fault tolerance patterns for the platform.

## Patterns

| Pattern                  | Implementation                           |
| ------------------------ | ---------------------------------------- |
| **Circuit Breaker**      | Opossum (Node.js), Istio                 |
| **Retries**              | Exponential backoff + jitter             |
| **Bulkheads**            | Separate connection pools per dependency |
| **Timeouts**             | Per-operation timeouts                   |
| **Graceful Degradation** | Disable non-essential features           |

## Timeouts

| Component          | Timeout |
| ------------------ | ------- |
| API Gateway        | 30s     |
| Backend services   | 10s     |
| Database queries   | 5s      |
| AI API calls       | 60s     |
| External API calls | 10s     |

## Circuit Breaker States

- **Closed**: Normal operation.
- **Open**: Fail fast; trip after 5 failures in 30s.
- **Half-Open**: Probe request after 30s.

## References

- [High Availability](high-availability.md): HA architecture.
