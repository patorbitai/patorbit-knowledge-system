# Billing Lifecycle

## Purpose

Subscription management and billing process.

## Lifecycle Stages

```mermaid
graph LR
    A[Signup] --> B[Trial]
    B --> C[Active]
    C --> D[Past Due]
    D --> C
    C --> E[Cancelled]
    E --> F[Expired]

    style A fill:#e3f2fd
    style B fill:#bbdefb
    style C fill:#90caf9
    style D fill:#ffcdd2
    style E fill:#ef9a9a
    style F fill:#e0e0e0
```

## Billing Events

| Event         | Action                          |
| ------------- | ------------------------------- |
| Trial starts  | Free tier active                |
| Upgrade       | Charge prorated amount          |
| Renewal       | Charge full amount              |
| Payment fails | Retry 3 times, then downgrade   |
| Cancel        | Service active until period end |

## References

- [Subscription Model](subscription-model.md): Plans.
