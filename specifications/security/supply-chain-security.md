# Supply Chain Security

## Purpose

Managing security risks across the software supply chain.

## Supply Chain Controls

| Control                      | Implementation                               |
| ---------------------------- | -------------------------------------------- |
| SBOM Generation              | Generate on every build                      |
| Dependency Scanning          | Automated scanning for known vulnerabilities |
| Container Image Signing      | Sign images in registry                      |
| Image Vulnerability Scanning | Scan before deployment                       |
| Base Image Policy            | Use minimal, approved base images            |
| Registry Access Control      | Private registry with access controls        |

## Vendor Assessment

- Security questionnaire for all third-party vendors.
- Annual review of vendor security posture.
- Contractual security requirements (DPA, SLA).

## References

- [Dependency Security](dependency-security.md): Code-level dependencies.
- [Third-Party Risk](third-party-risk.md): Vendor risk.
