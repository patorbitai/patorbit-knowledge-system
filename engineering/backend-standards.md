# Backend Standards

## Purpose

Backend development conventions using NestJS.

## Architecture

- **Layers**: Controller → Service → Repository.
- **Modules**: One NestJS module per bounded context.
- **Dependency Injection**: Built-in NestJS DI.

## Conventions

| Concern       | Standard                    |
| ------------- | --------------------------- |
| Validation    | `class-validator` DTOs      |
| Serialization | `class-transformer`         |
| Auth          | NestJS Guards               |
| Logging       | Pino logger                 |
| Testing       | Jest with factory functions |

## Error Handling

- HTTP exceptions for API errors.
- Domain exceptions for business logic errors.
- Global exception filter for unhandled errors.

## References

- [Backend Architecture](../specifications/architecture/backend-architecture.md): Architecture.
