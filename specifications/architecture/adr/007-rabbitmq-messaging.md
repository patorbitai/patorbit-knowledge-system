# 007. Use RabbitMQ for Async Messaging

- **Status**: Accepted
- **Date**: 2026-07-21
- **Author**: Platform Team

## Context

The Patorbit platform requires a message broker for reliable, asynchronous communication between services.

## Decision Drivers

- Flexible routing
- Durable persistence
- Proven scalability

## Considered Options

1. **RabbitMQ**: Flexible routing with exchanges, durable, proven at scale.
2. **Apache Kafka**: Higher throughput, but overkill for simple messaging.
3. **Amazon SQS**: Simple, but limited routing features.

## Decision Outcome

**Chosen option**: **RabbitMQ**, for its flexibility in routing and proven reliability.

## References

- [Messaging](../messaging.md)
