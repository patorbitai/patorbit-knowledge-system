# Environments

## Purpose

Environment strategy for development through production.

## Environment Definitions

| Environment     | Purpose                   | Data                  | Access           |
| --------------- | ------------------------- | --------------------- | ---------------- |
| **Local**       | Local development         | Seeded data           | Developer        |
| **Preview**     | Per-PR testing            | Isolated, synthetic   | Developer        |
| **Development** | Integration testing       | Anonymized production | Engineering team |
| **Staging**     | Pre-production validation | Production clone      | Engineering, QA  |
| **Production**  | Live user-facing          | Live                  | SRE, on-call     |
| **Sandbox**     | Customer experimentation  | Synthetic             | Partners         |
| **Training**    | AI model training         | Production subset     | AI team          |

## Promotion Rules

- Code must pass all tests in Development before staging.
- Staging must pass smoke tests before production.
- Production deployments require approval.

## Data Isolation

- No production data in Development, Preview, or Local environments.
- Anonymization applied to any production data used outside Production.

## References

- [Deployment Strategy](deployment-strategy.md): Deployment across environments.
