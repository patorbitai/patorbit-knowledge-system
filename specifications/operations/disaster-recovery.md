# Disaster Recovery

## Purpose

Recovery objectives and procedures for disaster scenarios.

## Recovery Objectives

| Metric          | Target             |
| --------------- | ------------------ |
| RPO (Data Loss) | 5 minutes          |
| RTO (Downtime)  | 1 hour             |
| Critical RPO    | 0 (zero tolerance) |
| Critical RTO    | 15 minutes         |

## Failover Scenarios

| Scenario            | RTO       | Procedure                     |
| ------------------- | --------- | ----------------------------- |
| Single AZ failure   | Automatic | Multi-AZ deployment           |
| Regional failure    | 1 hour    | DNS change, promote DR region |
| Data corruption     | 15 min    | Point-in-time recovery        |
| Application failure | 2 min     | Rolling rollback              |

## Recovery Drills

| Type              | Frequency |
| ----------------- | --------- |
| Database restore  | Monthly   |
| Regional failover | Quarterly |
| Full DR test      | Annually  |

## References

- [Backup Strategy](backup-strategy.md): Backup details.
