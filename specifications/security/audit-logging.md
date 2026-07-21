# Audit Logging

## Purpose

Immutable audit trails for security, compliance, and operational visibility.

## Audit Events

| Event Type        | Examples                                                |
| ----------------- | ------------------------------------------------------- |
| Authentication    | Login (success/failure), MFA challenge, password change |
| Authorization     | Role change, permission assignment                      |
| Data Access       | Passport view, evidence access, admin data access       |
| Data Modification | Claim create/update/delete, evidence submission         |
| AI Interaction    | Prompt sent, response generated, human review           |
| Configuration     | Feature flag change, security policy change             |

## Log Format

```
{
  "id": "aud_abc123",
  "timestamp": "2026-07-21T14:30:00Z",
  "actor": { "id": "user_123", "type": "user" },
  "action": "passport.published",
  "resource": { "id": "pass_456", "type": "passport" },
  "context": { "ip": "203.0.113.0", "userAgent": "..." },
  "correlationId": "corr_xyz",
  "changes": { "before": null, "after": { "status": "published" } }
}
```

## Immutability

- Audit logs stored in write-once, append-only store (S3 + OpenSearch).
- Cryptographic chaining for tamper detection.
- Access restricted to security team only.

## References

- [Security Monitoring](security-monitoring.md): Alerting on audit events.
- [Incident Response](incident-response.md): Investigation.
