# Security Development

## Purpose

Security requirements during development.

## Development Security Checklist

- [ ] Input validation on all API endpoints.
- [ ] Authentication required for all non-public endpoints.
- [ ] Authorization enforced for data access.
- [ ] No secrets in code.
- [ ] SQL injection prevention (parameterized queries).
- [ ] XSS prevention (output encoding).
- [ ] CSRF protection.
- [ ] Rate limiting for sensitive endpoints.
- [ ] Audit logging for data modifications.
- [ ] Dependency vulnerability scan passed.

## Security Review

- Security review required for: auth, payments, PII handling.
- Security review recommended for: major features.

## References

- [Security Architecture](../specifications/security/README.md): Security design.
