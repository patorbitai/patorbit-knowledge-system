# Security Architecture

## Purpose

This document defines the end-to-end security architecture of the Patorbit platform, showing how security controls are applied at every layer.

## Scope

This document covers all security layers from user to data.

---

## Security Architecture Overview

```mermaid
graph TB
    subgraph "User"
        U[End User]
        D[Device]
    end

    subgraph "Edge"
        WAF[WAF / DDoS Protection]
        CDN[CDN / TLS Termination]
        RATE[Rate Limiting]
    end

    subgraph "Application"
        AUTH[Authentication]
        AZ[Authorization]
        SESS[Session Management]
        VALID[Input Validation]
        CSP[CSP Headers]
    end

    subgraph "Service"
        SVC[Service Mesh\nmTLS]
        HARD[Service Hardening]
        QUOTA[Quota Management]
    end

    subgraph "Data"
        E_REST[Encryption at Rest]
        E_TRANSIT[Encryption in Transit]
        AUDIT[Audit Logging]
        ACCESS[Access Controls]
    end

    subgraph "Infrastructure"
        NET[Network Policies]
        SEV[Secrets Management]
        KMS[Key Management]
        MON[Security Monitoring]
    end

    U -->|HTTPS TLS 1.3| WAF
    D -->|Device Trust| AUTH
    WAF --> CDN
    CDN --> RATE
    RATE --> AUTH
    AUTH --> AZ
    AZ --> SESS
    SESS --> VALID
    VALID --> CSP
    CSP --> SVC
    SVC --> E_REST
    SVC --> AUDIT
    SVC --> NET
    SVC --> SEV
    E_REST --> KMS

    style U fill:#e3f2fd
    style WAF fill:#ffcdd2
    style CDN fill:#ffcdd2
    style AUTH fill:#90caf9
    style AZ fill:#90caf9
    style VALID fill:#90caf9
    style SVC fill:#64b5f6
    style E_REST fill:#81c784
    style AUDIT fill:#81c784
    style SEV fill:#f48fb1
    style KMS fill:#f48fb1
    style MON fill:#fff9c4
```

---

## Layer Controls

### 1. Edge Layer

| Control         | Implementation                                  |
| --------------- | ----------------------------------------------- |
| WAF             | Cloudflare WAF blocking SQLi, XSS, OWASP top 10 |
| DDoS Protection | Cloudflare DDoS mitigation                      |
| TLS Termination | TLS 1.3 minimum, HSTS                           |
| Rate Limiting   | Per user/IP/API key                             |

### 2. Application Layer

| Control            | Implementation                       |
| ------------------ | ------------------------------------ |
| Authentication     | OAuth 2.1, JWT, MFA                  |
| Authorization      | RBAC + ABAC via policy engine        |
| Session Management | HTTP-only cookies, short TTL         |
| Input Validation   | Zod schemas, class-validator         |
| CSRF Protection    | SameSite cookies, CSRF tokens        |
| CSP                | Strict Content Security Policy       |
| XSS Protection     | React auto-escaping, output encoding |

### 3. Service Layer

| Control           | Implementation                      |
| ----------------- | ----------------------------------- |
| mTLS              | Istio/Linkerd service mesh          |
| Service Hardening | Minimal base images, non-root users |
| Quota Management  | Resource limits per service         |

### 4. Data Layer

| Control               | Implementation               |
| --------------------- | ---------------------------- |
| Encryption at Rest    | AES-256, envelope encryption |
| Encryption in Transit | TLS 1.3 for all connections  |
| Access Controls       | Row-level security, IAM      |
| Audit Logging         | Immutable audit trail        |
| Data Retention        | Automated lifecycle policies |

### 5. Infrastructure Layer

| Control             | Implementation                               |
| ------------------- | -------------------------------------------- |
| Network Policies    | Kubernetes network policies, security groups |
| Secrets Management  | HashiCorp Vault / AWS Secrets Manager        |
| Key Management      | AWS KMS / Cloud KMS with rotation            |
| Security Monitoring | SIEM integration, alerting                   |

## References

- [Threat Model](threat-model.md): Threats addressed by this architecture.
- [Identity Security](identity-security.md): Identity protection.
- [Encryption](encryption.md): Encryption details.
- [Audit Logging](audit-logging.md): Audit implementation.
