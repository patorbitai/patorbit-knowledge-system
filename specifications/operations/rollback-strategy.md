# Rollback Strategy

## Purpose

Strategies for rolling back different components.

## Application Rollback

| Type         | Method              | Time    |
| ------------ | ------------------- | ------- |
| Full version | Revert deployment   | 2 min   |
| Feature      | Feature flag        | Instant |
| Canary       | Stop canary traffic | Instant |

## Database Rollback

- **Forward-only by default**: Migrations are always forward-compatible.
- **Rollback Migration**: Separate migration script for rollback.
- **Point-in-Time Recovery**: For data corruption scenarios.

## AI Model Rollback

- Model versions are stored in a registry.
- Rollback by pointing the orchestrator to the previous model version.
- A/B test the rollback before full deployment.

## References

- [Deployment Strategy](deployment-strategy.md): Deployment models.
