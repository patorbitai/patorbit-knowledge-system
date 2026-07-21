# 002. Use NestJS for Backend Framework

- **Status**: Accepted
- **Date**: 2026-07-21
- **Author**: Platform Team

## Context

The Patorbit platform requires a modern backend framework. The framework must support TypeScript, Clean Architecture, and dependency injection, and have a rich ecosystem.

## Decision Drivers

- TypeScript support
- Clean Architecture alignment
- Dependency injection
- Ecosystem maturity

## Considered Options

1. **NestJS**: A progressive Node.js framework with strong architectural patterns.
2. **Express.js**: A minimalist framework but lacking architectural opinion.
3. **Fastify**: A fast and low-overhead framework.

## Decision Outcome

**Chosen option**: **NestJS**, because its opinionated architecture aligns perfectly with our Clean Architecture approach and its built-in support for DI, modules, and decorators accelerates development.

## References

- [Backend Architecture](../backend-architecture.md)
