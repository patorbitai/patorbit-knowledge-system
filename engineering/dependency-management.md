# Dependency Management

## Purpose

Dependency update policy and process.

## Update Cadence

| Type        | Frequency |
| ----------- | --------- |
| Minor/patch | Weekly    |
| Major       | Quarterly |

## Process

1. **Scan**: Automated dependency scan via Snyk.
2. **Review**: Review new versions for breaking changes.
3. **Test**: Run tests with updated dependencies.
4. **Merge**: Merge updates into `main`.

## Security

- Critical vulnerabilities are patched within 24 hours.
- High vulnerabilities are patched within 7 days.

## References

- [Package Management](package-management.md): Package manager.
