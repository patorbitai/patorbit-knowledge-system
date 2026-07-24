# 012. In-memory Event Bus Outbox and Dead Letter Store

- **Status**: Accepted
- **Date**: 2026-07-23

## Context

The event bus supports retry, outbox, and dead-letter behavior today. However, the current implementation is intentionally in-memory for both outbox and dead-letter storage.

## Decision

We will keep the existing in-memory implementations for `OutboxService` and `DeadLetterService` during the current Platform Stabilization sprint.

These services are production-facing business components, but their persistence layer is intentionally deferred.

## Rationale

- Preserve runtime behavior and avoid broad persistence refactoring during stabilization.
- Keep business logic separate from persistence concerns.
- Allow future replacement with repository-backed persistence in a dedicated persistence sprint.

## Future work

- Replace `OutboxService` with a persistence-backed implementation using a repository abstraction.
- Replace `DeadLetterService` with a persistence-backed implementation using a repository abstraction.
- Add Prisma models for outbox and dead-letter entries.
- Ensure storage is transactional and durable.
