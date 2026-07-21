# DevSecOps

## Purpose

Integrating security into CI/CD pipelines.

## Pipeline Security Gates

```yaml
security-gates:
  - stage: lint
    tools: [semgrep, eslint-security]
  - stage: test
    tools: [dependency-check, snyk]
  - stage: build
    tools: [trivy, sbom-generate]
  - stage: deploy
    tools: [kube-bench, conftest]
```

## Tool Integration

| Tool     | Stage      | Purpose                          |
| -------- | ---------- | -------------------------------- |
| Semgrep  | Lint       | SAST for custom code             |
| Snyk     | Test       | Dependency vulnerability scan    |
| Trivy    | Build      | Container image scan             |
| Conftest | Deploy     | Policy-as-code for K8s manifests |
| Gitleaks | Pre-commit | Secret leak prevention           |

## Break the Build

- Critical vulnerabilities: Block pipeline.
- High vulnerabilities: Warning, manual review required.
- Medium/low: Logged, tracked.

## References

- [Secure Development Lifecycle](secure-development-lifecycle.md): SSDLC.
