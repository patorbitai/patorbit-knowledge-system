# Encryption

## Purpose

Data protection via encryption at rest and in transit.

## At Rest

| Storage        | Algorithm | Key         |
| -------------- | --------- | ----------- |
| PostgreSQL     | AES-256   | KMS-managed |
| Object Storage | AES-256   | SSE-S3/KMS  |
| Cache (Redis)  | AES-256   | KMS-managed |
| Backups        | AES-256   | KMS-managed |

## In Transit

- All external communication: TLS 1.3.
- Inter-service: mTLS via service mesh.
- Database connections: TLS 1.3.
- Cache connections: TLS 1.3.

## Field-Level Encryption

Highly sensitive fields (e.g., SSN, government ID) encrypted with application-level encryption using a separate key.

## References

- [Key Management](key-management.md): Key lifecycle.
- [Data Protection](data-protection.md): Data classification.
