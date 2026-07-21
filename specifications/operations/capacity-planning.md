# Capacity Planning

## Purpose

Forecasting and planning for resource capacity.

## Growth Metrics

| Metric         | Current | Forecast (12 mo) |
| -------------- | ------- | ---------------- |
| Active Users   | —       | —                |
| Stored Claims  | —       | —                |
| AI Token Usage | —       | —                |
| Storage        | —       | —                |

## Planning Cadence

- **Monthly**: Resource utilization review.
- **Quarterly**: Capacity forecast.
- **Annually**: Infrastructure budget.

## Triggers for Scaling

| Signal                 | Action               |
| ---------------------- | -------------------- |
| CPU > 70% for 7 days   | Add nodes            |
| Disk > 75% for 14 days | Increase storage     |
| AI cost > budget 80%   | Review model routing |

## References

- [FinOps](finops.md): Cost governance.
