# SRE Practices

## Purpose

Site Reliability Engineering practices for the platform.

## SLIs & SLOs

| SLI                 | Target  | Window  |
| ------------------- | ------- | ------- |
| API Availability    | 99.95%  | 30 days |
| API Latency (P95)   | < 500ms | 30 days |
| Passport Retrieval  | 99.99%  | 30 days |
| Event Delivery      | 99.99%  | 30 days |
| AI Analysis Success | 99%     | 30 days |

## Error Budgets

- Monthly error budget = (1 - SLO) * total requests.
- Budget consumed by 5xx errors.
- When budget is 50% depleted, deployment velocity is reduced.

## Reliability Reviews

- Monthly: SLO compliance, error budget review.
- Quarterly: Full reliability review with action items.
- Annual: Tier 1 SLO revision based on business needs.

## References

- [Incident Management](incident-management.md): Incident management.
- [High Availability](high-availability.md): HA targets.
