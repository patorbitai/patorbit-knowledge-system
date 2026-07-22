# Health Module

The `HealthModule` exposes a `GET /health` endpoint that aggregates health checks for core dependencies.

## Currently monitored

- **Database** -- runs `SELECT 1` against the Prisma-connected database via `PrismaHealthIndicator`.

The controller uses `@nestjs/terminus` `HealthCheck` and the `@Public()` decorator so the endpoint is accessible without authentication.
