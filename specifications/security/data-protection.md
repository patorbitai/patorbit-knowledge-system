# Data Protection

## Purpose

Protection controls for PII, sensitive documents, AI artifacts, and backups.

## Data Classification

| Class        | Examples                               | Controls                              |
| ------------ | -------------------------------------- | ------------------------------------- |
| Public       | Organization name, published passports | Standard encryption                   |
| Internal     | Feature flags, internal docs           | Access controls                       |
| Confidential | Claims, evidence metadata              | Encryption at rest, access logging    |
| Restricted   | PII, payment data, AI prompts          | Field-level encryption, audit logging |
| Critical     | Encryption keys, secrets               | KMS, privileged access                |

## Controls by Class

| Class        | Encryption            | Access               | Retention  |
| ------------ | --------------------- | -------------------- | ---------- |
| Public       | TLS                   | Public               | As needed  |
| Internal     | TLS + AES-256         | Authenticated        | 90 days    |
| Confidential | AES-256               | Role-based           | 7 years    |
| Restricted   | Field-level + AES-256 | Need-to-know + audit | 7 years    |
| Critical     | KMS                   | Break-glass          | Indefinite |

## References

- [Encryption](encryption.md): Encryption implementation.
- [Privacy](privacy.md): Privacy controls.
