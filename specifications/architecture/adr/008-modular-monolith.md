# 008. Adopt Modular Monolith Architecture

- **Status**: Accepted
- **Date**: 2026-07-21
- **Author**: Platform Team

## Context

The Patorbit platform is in its early stages. We need to balance rapid development velocity with long-term scalability.

## Decision Drivers

- Development velocity
- Operational simplicity
- Future scalability

## Considered Options

1. **Modular Monolith**: Single deployable artifact, separate modules per bounded context.
2. **Full Microservices**: Small, independent services from day one.
3. **Serverless**: Lambda-based architecture.

## Decision Outcome

**Chosen option**: **Modular Monolith**, because it provides the right balance between development speed and architectural discipline, with a clear migration path to microservices.

## References

- [Service Boundaries](../service-boundaries.md)
- [Module Architecture](../module-architecture.md)
