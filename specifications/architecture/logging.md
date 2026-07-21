# Logging

## Purpose

This document defines the logging strategy for the Patorbit platform, ensuring that logs are structured, searchable, and secure.

## Scope

This document covers structured logging, log levels, correlation IDs, PII handling, and retention policies.

---

## Structured Logging

**Format**: JSON

**Rationale**: Structured logs are machine-readable, making them easy to parse, search, and analyze in a log management system.

**Example Log Entry**:

```json
{
  "timestamp": "2026-07-21T14:30:00Z",
  "level": "INFO",
  "service": "passport-service",
  "traceId": "trac_abc123",
  "correlationId": "corr_xyz789",
  "userId": "user_123",
  "organizationId": "org_456",
  "message": "Passport published",
  "details": {
    "passportId": "pass_789",
    "version": "1.2.0"
  }
}
```

## Log Levels

| Level     | Purpose                                        | Example                                                 |
| --------- | ---------------------------------------------- | ------------------------------------------------------- |
| **DEBUG** | Detailed information for debugging             | `Entering function foo with args: ...`                  |
| **INFO**  | Significant application events                 | `User registered`, `Passport published`                 |
| **WARN**  | Potential issues or unexpected situations      | `Cache miss`, `Rate limit approached`                   |
| **ERROR** | Unhandled exceptions and errors                | `Database connection failed`, `Failed to process event` |
| **FATAL** | Critical errors that cause service termination | `Failed to bind to port`                                |

### Environment Configuration

| Environment     | Log Level                                                        |
| --------------- | ---------------------------------------------------------------- |
| **Development** | DEBUG                                                            |
| **Staging**     | INFO                                                             |
| **Production**  | INFO (can be dynamically changed to DEBUG for specific services) |

## Correlation IDs

- **`traceId`**: A unique ID for an entire request chain, propagated across all services.
- **`correlationId`**: A unique ID for a business workflow or process.
- **Purpose**: Enables tracing a request through multiple services and a business process across multiple events.
- **Propagation**: Propagated via HTTP headers (`traceparent`) and message headers.

## PII Handling

**Principle**: Never log Personally Identifiable Information (PII) in plaintext.

| PII Data         | Handling Strategy                                              |
| ---------------- | -------------------------------------------------------------- |
| Email            | Log hashed value or user ID instead                            |
| Password         | Never logged                                                   |
| API Keys         | Masked (e.g., `sk_...1234`)                                    |
| JWTs             | Log only payload claims, not the full token                    |
| Names            | Avoid logging unless necessary for debugging; mask if possible |
| Evidence Content | Never logged                                                   |

## Log Storage and Retention

- **Technology**: OpenSearch / Loki.
- **Retention**:
  - **Hot Storage (Searchable)**: 30 days.
  - **Warm Storage**: 90 days.
  - **Cold Storage (Archive)**: 365 days in S3 Glacier.

## Log Search

- Logs are searchable by all structured fields (`service`, `level`, `traceId`, etc.).
- Full-text search on the `message` field.
- Dashboards in Grafana for visualizing log data.

## Best Practices

1. **Log in English**: All log messages must be in English.
2. **Be Concise**: Keep log messages short and to the point.
3. **Use Structured Data**: Put contextual data in the `details` object.
4. **Log Errors with Stack Traces**: All unhandled exceptions should be logged with a full stack trace.
5. **Log at the Right Level**: Use log levels appropriately.
6. **No Sensitive Data**: Never log secrets, passwords, or PII.

## References

- [Observability](observability.md): How logs fit into the overall observability strategy.
- [Security Architecture](security-architecture.md): PII and data handling policies.
- [Monitoring](monitoring.md): Using logs for alerting.
