# Security Architecture

## Purpose

This document defines the security architecture for the Patorbit platform. Security is designed by default, embedded into every layer of the architecture.

## Scope

This document covers threat modeling, encryption, secrets management, security headers, input validation, audit logging, and compliance readiness.

---

## Security Principles

1. **Defense in Depth**: Multiple layers of security controls protect the platform.
2. **Least Privilege**: Every component has only the permissions it needs.
3. **Minimize Attack Surface**: Only necessary ports, services, and endpoints are exposed.
4. **Assume Breach**: Design for the worst case. Internal traffic is not inherently trusted.
5. **Zero Trust (In Progress)**: No implicit trust. Every request must authenticate.

---

## Threat Model (High Level)

| Threat                                | Mitigation                                                                      |
| ------------------------------------- | ------------------------------------------------------------------------------- |
| **Identity Theft**                    | Strong authentication (OAuth, MFA), session management, anomaly detection       |
| **Data Breach**                       | Encryption at rest and in transit, least privilege access, audit logging        |
| **API Abuse**                         | Rate limiting, authentication, CAPTCHA for sensitive endpoints                  |
| **Injection Attacks**                 | Parameterized queries, input validation, content security policy                |
| **Cross-Site Scripting (XSS)**        | Content Security Policy (CSP), output encoding, React's built-in XSS protection |
| **Cross-Site Request Forgery (CSRF)** | SameSite cookies, CSRF tokens for state-changing requests                       |
| **Man-in-the-Middle (MITM)**          | HTTPS with HSTS, certificate pinning                                            |
| **Denial of Service (DoS)**           | Rate limiting, CDN protection, auto-scaling                                     |
| **AI Prompt Injection**               | Input sanitization, output validation, safety guardrails                        |
| **Insecure Storage**                  | Encrypted object storage, pre-signed URLs, versioning                           |

---

## Encryption

### Encryption in Transit

| Layer                    | Protocol | Details                            |
| ------------------------ | -------- | ---------------------------------- |
| External API             | TLS 1.3  | All client-to-server communication |
| Inter-Service (Internal) | TLS 1.3  | Service mesh mTLS                  |
| Database                 | TLS 1.3  | Client-to-database connections     |
| Message Broker           | TLS 1.3  | Publisher/consumer to broker       |
| Cache (Redis)            | TLS 1.3  | App to Redis Encryption in Transit |

### Encryption at Rest

| Storage        | Algorithm                    | Key Management         |
| -------------- | ---------------------------- | ---------------------- |
| PostgreSQL     | AES-256 (TDE / column-level) | AWS KMS / Cloud KMS    |
| Neo4j          | AES-256 (disk encryption)    | Cloud provider managed |
| Object Storage | AES-256 (SSE-S3 / SSE-KMS)   | Cloud provider managed |
| Redis          | AES-256 (disk encryption)    | Cloud provider managed |
| Backups        | AES-256                      | Customer-managed key   |

---

## Secrets Management

**Technology**: AWS Secrets Manager / HashiCorp Vault

**Types of Secrets**:

- Database credentials
- API keys (Stripe, SendGrid, Claude API, etc.)
- JWT signing keys
- Encryption keys
- OAuth client secrets

**Lifecycle**:

- **Rotation**: Automated rotation for machine-to-machine secrets. Rotation period: 90 days.
- **Access**: Granular IAM policies control which services can access which secrets.
- **Versioning**: Secrets Manager maintains multiple versions for rotation safety.

---

## Security Headers

All HTTP responses must include the following security headers:

| Header                      | Value                                          |
| --------------------------- | ---------------------------------------------- |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| `Content-Security-Policy`   | `default-src 'self'; ...`                      |
| `X-Frame-Options`           | `DENY`                                         |
| `X-Content-Type-Options`    | `nosniff`                                      |
| `Referrer-Policy`           | `same-origin`                                  |
| `Permissions-Policy`        | `camera=(), microphone=()`                     |
| `Cache-Control`             | As appropriate for the resource                |

---

## Input Validation

- **API Input**: Validated at controller boundary using `class-validator` DTOs.
- **Database Input**: Parameterized queries prevent SQL injection. All input validated against schema.
- **File Upload**: File type validation, size limits, virus scanning.
- **AI Input**: Sanitized to prevent prompt injection. Output validated against safety policies.

## Audit Logging

All security-relevant events are logged to an immutable audit log:

| Event Type           | Examples                                            | Retention |
| -------------------- | --------------------------------------------------- | --------- |
| Authentication       | Login (success/failure), password change, MFA setup | 365 days  |
| Authorization        | Permission change, role assignment                  | 365 days  |
| Data Access          | Admin view of user data, data export                | 365 days  |
| Configuration Change | Feature flag toggle, security policy change         | 365 days  |
| AI Interaction       | Prompt sent, response received                      | 90 days   |

Audit logs are stored in a separate, append-only log store (S3 + OpenSearch) with restricted access.

## Compliance Readiness

The architecture is designed to support compliance with:

| Framework     | Relevance            | Key Requirements                                           |
| ------------- | -------------------- | ---------------------------------------------------------- |
| **GDPR**      | User data in EU      | Data minimization, right to erasure, data portability, DPA |
| **CCPA**      | California users     | Right to know, right to delete, opt-out of sale            |
| **SOC 2**     | Enterprise customers | Security, availability, confidentiality, integrity         |
| **ISO 27001** | Enterprise customers | ISMS, risk assessment, security controls                   |

## Vulnerability Management

- **Dependency Scanning**: Automated scanning of dependencies for known vulnerabilities (Dependabot, Snyk).
- **Container Scanning**: Container images are scanned at build time (Trivy, Clair).
- **Penetration Testing**: Annual penetration testing by a third-party security firm.
- **Bug Bounty**: Responsible disclosure program for security researchers.

## References

- [Authentication](authentication.md): Authentication mechanisms.
- [Authorization](authorization.md): Authorization model.
- [Event Architecture](event-architecture.md): Security events.
- [Infrastructure](infrastructure.md): Network security controls.
