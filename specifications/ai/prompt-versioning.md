# Prompt Versioning

## Purpose

This document defines the prompt versioning and lifecycle management strategy.

## Scope

Versioning, rollback, A/B testing, and approval workflow.

---

## Prompt Lifecycle

```mermaid
graph LR
    A[Draft] --> B[Review]
    B --> C[Approved]
    C --> D[Active]
    D --> E[Deprecated]
    E --> F[Removed]

    style A fill:#e3f2fd
    style B fill:#bbdefb
    style C fill:#90caf9
    style D fill:#64b5f6
    style E fill:#ffcc80
    style F fill:#ef9a9a
```

## Versioning Strategy

- **Semantic Versioning**: Major.Minor.Patch for prompt templates.
- **Major**: Breaking changes to output format or behavior.
- **Minor**: Additive changes (new fields, additional context).
- **Patch**: Bug fixes, wording improvements.

## Rollback

- Rollback to any previous version within 24 hours (automated).
- Rollback to any version within 30 days (manual).
- Rollback triggers re-evaluation of the previous version.

## A/B Testing

- System supports routing a percentage of traffic to a variant.
- Metrics: quality score, user satisfaction, task completion rate.
- Automated promotion when variant outperforms control.

```mermaid
sequenceDiagram
    participant Router
    participant Control as Control (v1.2.0)
    participant Variant as Variant (v1.3.0-beta)
    participant Eval as Evaluation System

    Router->>Router: Split traffic 90/10
    Router->>Control: 90% of requests
    Router->>Variant: 10% of requests
    Control-->>Eval: Metrics
    Variant-->>Eval: Metrics
    Eval->>Eval: Compare after 7 days
    alt Variant Wins
        Eval->>Router: Promote variant to 100%
    else No Difference
        Eval->>Router: Continue control
    end
```

## Approval Workflow

| Step       | Approver        | Criteria                    |
| ---------- | --------------- | --------------------------- |
| Draft      | Author          | Initial version             |
| Review     | AI Team Lead    | Quality, safety, compliance |
| Approved   | Product Manager | Business alignment          |
| Active     | —               | —                           |
| Deprecated | AI Team Lead    | After 30 days of inactivity |

## References

- [Prompt Architecture](prompt-architecture.md): Prompt structure.
- [Prompt Library](prompt-library.md): Prompt catalog.
- [Experimentation](experimentation.md): A/B testing.
