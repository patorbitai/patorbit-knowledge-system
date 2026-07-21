# Feature Flags

## Purpose

Feature management strategy for controlled rollouts.

## Flag Types

| Type              | Example             | Lifespan  |
| ----------------- | ------------------- | --------- |
| Release Flags     | New feature rollout | Weeks     |
| Experiment Flags  | A/B test variant    | Weeks     |
| Operational Flags | Kill switch         | Permanent |
| Permission Flags  | Beta user access    | Ongoing   |

## Governance

- Flag naming follows a convention.
- Flags are documented with owner, purpose, and expiry.
- Stale flags are cleaned up regularly.

## References

- [Experimentation](experimentation.md): A/B testing.
- [Release Strategy](release-strategy.md): Release management.
