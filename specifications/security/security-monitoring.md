# Security Monitoring

## Purpose

Detection and alerting for security-relevant events.

## Data Sources

| Source              | Tool                       |
| ------------------- | -------------------------- |
| Infrastructure logs | CloudWatch / Cloud Logging |
| Application logs    | OpenTelemetry -> Loki      |
| Audit logs          | S3 -> OpenSearch           |
| Network logs        | VPC Flow Logs              |
| WAF logs            | Cloudflare WAF logs        |
| IDS/IPS             | Cloud provider IDS         |

## Alerting Rules

| Rule                      | Severity | Action                    |
| ------------------------- | -------- | ------------------------- |
| Multiple failed logins    | Medium   | Rate limit, investigate   |
| Impossible travel         | High     | Block session, alert user |
| API key misuse            | High     | Revoke key                |
| Data exfiltration attempt | Critical | Block, incident response  |
| Privilege escalation      | Critical | Block, incident response  |
| WAF evasion attempt       | Medium   | Block IP                  |

## SIEM Integration

- Logs forwarded to SIEM (Splunk / Sentinel / ELK) for correlation.
- Automated playbooks for common scenarios.

## References

- [Incident Response](incident-response.md): Response process.
- [Audit Logging](audit-logging.md): Audit data sources.
