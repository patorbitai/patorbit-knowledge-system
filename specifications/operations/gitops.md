# GitOps

## Purpose

GitOps workflow for infrastructure and application deployment.

## GitOps Principles

1. **Desired State in Git**: The entire system configuration is stored in Git.
2. **Automated Reconciliation**: A GitOps operator continuously reconciles actual state with desired state.
3. **Pull-based Deployments**: The cluster pulls changes from Git, not pushed from CI.

## Repository Strategy

```
patorbit/               # Organization
  patorbit-platform/      # Infrastructure (Terraform)
    terraform/
    envs/
  patorbit-k8s/           # Kubernetes manifests
    clusters/
    namespaces/
  patorbit-apps/          # Application deployments
    passport/
    resume/
```

## Promotion Flow

```mermaid
graph LR
    A[Feature Branch] --> B[Main]
    B --> C[ArgoCD]
    C --> D[Development]
    D --> E[Staging]
    E --> F[Production]

    style A fill:#e3f2fd
    style B fill:#bbdefb
    style C fill:#90caf9
    style D fill:#64b5f6
    style E fill:#42a5f5
    style F fill:#2196f3
```

## References

- [CI/CD Architecture](ci-cd-architecture.md): CI/CD integration.
- [Infrastructure as Code](infrastructure-as-code.md): IaC.
