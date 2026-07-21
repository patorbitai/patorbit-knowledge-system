# 011. Use Transactional Outbox for Reliable Events

- **Status**: Accepted
- **Date**: 2026-07-21
- **Author**: Platform Team

## Context

The Patorbit platform uses events for inter-service communication. Events must be reliably published to avoid data inconsistency.

## Decision Drivers

- At-least-once delivery
- No distributed transactions
- Simple to implement

## Considered Options

1. **Transactional Outbox**: Write events to a database table in the same transaction, then publish from the table.
2. **2PC (Two-Phase Commit)**: Distributed transactions, high complexity.
3. **Choreography Saga**: Event-driven saga, but still needs reliable publishing.

## Decision Outcome

**Chosen option**: **Transactional Outbox**, for its simplicity and reliability.

## References

- [Event Architecture](../event-architecture.md)
