# Audit Module

Logs domain-relevant actions to the database.

- `AuditService.log()` persists audit events via Prisma.
- `AuditInterceptor` captures request metadata (user, action, resource, outcome) and delegates to `AuditService`. It also publishes audit events to a configurable webhook and forwards to `LoggingService`.

## Usage

The `AuditModule` depends on `DatabaseModule` (Prisma availability). Register it where you need audit tracking and inject `AuditService` or apply `AuditInterceptor` globally.

### Roles

| Component | Responsibility |
|-----------|---------------|
| `AuditService` | Database persistence |
| `AuditInterceptor` | HTTP request wrapping, metadata extraction, webhook dispatch |
| `AuditConstants` | Injection token (`AuditService`) |