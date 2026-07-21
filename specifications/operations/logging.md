# Logging

## Purpose

Structured logging standards for the platform.

## Format

All logs are structured JSON with the following fields:

| Field            | Required | Description              |
| ---------------- | -------- | ------------------------ |
| `timestamp`      | Yes      | RFC 3339 timestamp       |
| `level`          | Yes      | DEBUG, INFO, WARN, ERROR |
| `service`        | Yes      | Service name             |
| `message`        | Yes      | Human-readable message   |
| `traceId`        | Yes      | Distributed trace ID     |
| `userId`         | No       | User identifier          |
| `organizationId` | No       | Organization identifier  |

## PII Handling

- PII must never be logged in plaintext.
- Use `[REDACTED]` or the entity ID instead.

## Retention

| Environment | Hot Storage | Archive       |
| ----------- | ----------- | ------------- |
| Development | 7 days      | N/A           |
| Staging     | 14 days     | N/A           |
| Production  | 30 days     | 365 days (S3) |

## References

- [Observability](observability.md): Observability strategy.
