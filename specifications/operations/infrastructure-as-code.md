# Infrastructure as Code

## Purpose

IaC principles for managing infrastructure.

## Tooling

- **Terraform / OpenTofu**: Cloud resource provisioning.
- **Helm**: Kubernetes package management.
- **Kustomize**: Kubernetes configuration customization.

## Module Strategy

- Each major component (networking, compute, database) is a Terraform module.
- Modules are versioned and published to a module registry.

## State Management

- Remote state stored in Terraform Cloud / S3 + DynamoDB.
- State file access is locked to prevent concurrent modifications.
- Sensitive outputs are encrypted and stored in Secrets Manager.

## Validation

- Terraform plan runs in CI for every PR.
- Sentinel or OPA policies enforce compliance.
- `terraform plan` is reviewed before apply.

## References

- [GitOps](gitops.md): GitOps workflow.
- [Container Strategy](container-strategy.md): Container management.
