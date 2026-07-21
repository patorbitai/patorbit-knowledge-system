# Secrets Management

## Purpose

Secure storage, rotation, and access control for secrets.

## Technology

AWS Secrets Manager / HashiCorp Vault.

## Secret Types

| Type                 | Example                      | Rotation |
| -------------------- | ---------------------------- | -------- |
| Database credentials | PostgreSQL user/password     | 90 days  |
| API keys             | Stripe, SendGrid, Claude API | 90 days  |
| JWT signing keys     | RS256 private key            | 180 days |
| Encryption keys      | Envelope encryption KEK      | Annually |

## Access Control

- Secrets accessed via IAM roles, not static credentials.
- Audit logging on all secret access.
- Secrets never logged or committed to source control.

## References

- [Key Management](key-management.md): Key lifecycle.
