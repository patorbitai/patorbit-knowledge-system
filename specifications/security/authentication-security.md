# Authentication Security

## Purpose

This document defines the secure authentication mechanisms for the Patorbit platform.

## Scope

OAuth 2.1, OIDC, JWT, MFA, and risk-based authentication.

---

## Authentication Methods

| Method           | Security Level | Use Case                    |
| ---------------- | -------------- | --------------------------- |
| OAuth 2.1 + PKCE | High           | Web and mobile apps         |
| JWT              | High           | Session tokens              |
| API Keys         | High           | Machine-to-machine          |
| MFA (TOTP)       | Very High      | Admin, verification actions |
| Passkeys         | Very High      | Passwordless login          |
| Risk-Based       | Variable       | Step-up authentication      |

## JWT Best Practices

- Short-lived access tokens (15 minutes).
- Refresh tokens rotated on each use.
- Tokens stored in HTTP-only cookies.
- JWT signed with RS256.

## References

- [Identity Security](identity-security.md): Identity lifecycle.
- [Session Management](session-management.md): Session handling.
