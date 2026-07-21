# Database Standards

## Purpose

Database change process and conventions.

## Migration Process

1. Create migration file with timestamp prefix.
2. Write `up` and `down` migrations.
3. Review migration for backward compatibility.
4. Test migration against staging data.
5. Apply migration as part of deployment.

## Conventions

- Migrations are forward-compatible (additive).
- No data-only migrations in the same PR as schema changes.
- Indexes are created with `CONCURRENTLY` for large tables.
- Foreign keys are added only after data is consistent.

## Naming

| Element      | Convention             |
| ------------ | ---------------------- |
| Table names  | snake_case, plural     |
| Column names | snake_case             |
| Primary keys | `id` (UUID)            |
| Foreign keys | `{table}_id`           |
| Indexes      | `idx_{table}_{column}` |

## References

- [Data Architecture](../specifications/data/README.md): Data model.
