# Release Management

## Purpose

Release cadence, versioning, approvals, and release notes.

## Release Cadence

- **Major**: Quarterly (breaking changes).
- **Minor**: Bi-weekly (features).
- **Patch**: As needed (bug fixes, security).

## Approval Gates

| Stage             | Approver        |
| ----------------- | --------------- |
| PR Merge          | Code review     |
| Deploy Staging    | CI passes       |
| Deploy Production | Release manager |

## Release Notes

- Automatically generated from conventional commits.
- Categorized by type (feature, fix, security).
- Published to developer portal.

## References

- [Rollback Strategy](rollback-strategy.md): Rollback procedures.
