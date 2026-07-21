# Incident Response

## Purpose

Incident management lifecycle for security events.

## IR Lifecycle

```mermaid
graph LR
    A[Preparation] --> B[Detection]
    B --> C[Containment]
    C --> D[Eradication]
    D --> E[Recovery]
    E --> F[Post-Incident Review]

    style A fill:#e3f2fd
    style B fill:#bbdefb
    style C fill:#ffcdd2
    style D fill:#ef9a9a
    style E fill:#90caf9
    style F fill:#64b5f6
```

## Severity Levels

| Level | Examples                                       | Response          |
| ----- | ---------------------------------------------- | ----------------- |
| SEV-1 | Data breach, service outage                    | Immediate, 24/7   |
| SEV-2 | Suspicious activity, single account compromise | < 4 hours         |
| SEV-3 | Low-risk vulnerability                         | Next business day |
| SEV-4 | Policy violation, minor issue                  | Next sprint       |

## IR Team

| Role                | Responsibility          |
| ------------------- | ----------------------- |
| Incident Commander  | Coordinates response    |
| Security Lead       | Technical investigation |
| Communications Lead | Stakeholder updates     |
| Legal               | Regulatory notification |

## Post-Incident

- Root cause analysis documented.
- Remediation items tracked to closure.
- Lessons learned shared with engineering.

## References

- [Security Monitoring](security-monitoring.md): Detection sources.
- [Business Continuity](business-continuity.md): Continuity planning.
