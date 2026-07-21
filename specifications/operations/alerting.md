# Alerting

## Purpose

Alert hierarchy, escalation, and noise reduction.

## Alert Severity

| Severity      | Response  | Channel   |
| ------------- | --------- | --------- |
| P1 (Critical) | Immediate | PagerDuty | Call |
| P2 (High)     | < 15 min  | PagerDuty |
| P3 (Medium)   | < 1 hour  | Slack     |
| P4 (Low)      | Next day  | Jira      |

## Key Alert Rules

| Rule               | Severity | Condition                    |
| ------------------ | -------- | ---------------------------- |
| High Error Rate    | P1       | Error > 5% for 5 min         |
| High Latency       | P2       | P95 > 2s for 5 min           |
| Service Down       | P1       | Health check fails for 1 min |
| Queue Growth       | P2       | Queue > 5000 for 5 min       |
| Certificate Expiry | P2       | Expires in < 7 days          |

## Noise Reduction

- No alert without a documented runbook.
- Alerts fire only when action is required.
- Silencing during planned maintenance.

## References

- [Incident Management](incident-management.md): Incident response.
