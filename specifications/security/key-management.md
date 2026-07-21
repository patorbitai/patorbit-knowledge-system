# Key Management

## Purpose

Encryption key lifecycle management.

## Key Hierarchy

```
Master Key (KMS) → Key Encryption Key (KEK) → Data Encryption Keys (DEK)
```

## Key Lifecycle

| Stage      | Control                                              |
| ---------- | ---------------------------------------------------- |
| Generation | Secure random generation within HSM/KMS              |
| Storage    | KMS-managed, never exposed in plaintext              |
| Rotation   | Automatic rotation (KEK: annual, DEK: per operation) |
| Revocation | Immediate if key compromise suspected                |
| Backup     | Encrypted backup of KEK to secondary region          |

## References

- [Encryption](encryption.md): Encryption implementation.
