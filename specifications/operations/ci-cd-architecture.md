# CI/CD Architecture

## Purpose

Continuous integration and delivery pipeline design.

## Pipeline Overview

```mermaid
graph LR
    A[Code Commit] --> B[Build]
    B --> C[Unit Tests]
    C --> D[SAST/Security]
    D --> E[Container Build]
    E --> F[Integration Tests]
    F --> G[Artifact Registry]
    G --> H[Deploy Dev]
    H --> I[Smoke Tests]
    I --> J[Deploy Staging]
    J --> K[E2E Tests]
    K --> L[Deploy Production]
    L --> M[Canary]
    M --> N[Full Rollout]

    style A fill:#e3f2fd
    style B fill:#bbdefb
    style C fill:#90caf9
    style D fill:#64b5f6
    style E fill:#42a5f5
    style F fill:#2196f3
    style G fill:#1e88e5
    style H fill:#1565c0
    style I fill:#0d47a1
    style J fill:#81c784
    style K fill:#66bb6a
    style L fill:#43a047
    style M fill:#2e7d32
    style N fill:#1b5e20
```

## Stage Details

| Stage             | Tool           | Duration |
| ----------------- | -------------- | -------- |
| Build             | GitHub Actions | 5 min    |
| Unit Tests        | Jest / Vitest  | 5 min    |
| SAST              | Semgrep        | 3 min    |
| Container Build   | Docker         | 3 min    |
| Integration Tests | Playwright     | 10 min   |
| Security Scan     | Trivy          | 2 min    |
| Deploy            | ArgoCD / Helm  | 5 min    |

## Artifact Management

- **Image Registry**: ECR / GCR / Docker Hub.
- **Versioning**: Git SHA + semantic version tag.
- **Retention**: Last 50 images per service.

## References

- [GitOps](gitops.md): GitOps workflow.
- [Deployment Strategy](deployment-strategy.md): Deployment models.
