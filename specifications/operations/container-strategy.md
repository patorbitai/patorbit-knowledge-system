# Container Strategy

## Purpose

Container lifecycle management from build to runtime.

## Container Lifecycle

```mermaid
graph LR
    A[Build] --> B[Scan]
    B --> C[Tag]
    C --> D[Push]
    D --> E[Deploy]
    E --> F[Runtime]

    style A fill:#e3f2fd
    style B fill:#bbdefb
    style C fill:#90caf9
    style D fill:#64b5f6
    style E fill:#42a5f5
    style F fill:#2196f3
```

## Image Standards

- **Base Image**: `node:20-alpine` for minimal footprint.
- **Multi-stage Builds**: Separate build and runtime stages.
- **Non-root User**: Containers run as non-root user.
- **Read-only Root Filesystem**: Enabled where possible.

## Tagging Strategy

| Tag         | Example       | Use              |
| ----------- | ------------- | ---------------- |
| `git-{sha}` | `git-a1b2c3d` | CI tracking      |
| `{version}` | `1.2.3`       | Release tracking |
| `latest`    | `latest`      | Latest stable    |

## Registry

- Private container registry with access controls.
- Vulnerability scanning on push.
- Image pull secrets managed via Kubernetes.

## References

- [Orchestration](orchestration.md): Container orchestration.
