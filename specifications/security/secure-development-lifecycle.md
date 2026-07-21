# Secure Development Lifecycle

## Purpose

Security integrated into every phase of development.

## SSDLC Phases

```mermaid
graph LR
    A[Design] --> B[Develop]
    B --> C[Test]
    C --> D[Release]
    D --> E[Operate]

    style A fill:#e3f2fd
    style B fill:#bbdefb
    style C fill:#90caf9
    style D fill:#64b5f6
    style E fill:#42a5f5
```

| Phase   | Activities                                                  |
| ------- | ----------------------------------------------------------- |
| Design  | Threat modeling, security requirements, architecture review |
| Develop | Secure coding standards, dependency scanning                |
| Test    | SAST, DAST, unit/integration security tests                 |
| Release | Container scanning, secret scanning, sign SBOM              |
| Operate | Vulnerability monitoring, incident response                 |

## Gate Requirements

- **Design**: Security review for major features.
- **Code Review**: Security checklist completed.
- **Pre-Prod**: SAST/DAST scans pass, no critical vulnerabilities.

## References

- [DevSecOps](devsecops.md): CI/CD integration.
