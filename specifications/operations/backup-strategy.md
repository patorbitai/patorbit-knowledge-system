# Backup Strategy

## Purpose

Data backup policies and procedures.

## Backup Schedule

| Component      | Type                     | Frequency  | Retention |
| -------------- | ------------------------ | ---------- | --------- |
| PostgreSQL     | Full snapshot            | Daily      | 30 days   |
| PostgreSQL     | WAL archive              | Continuous | 7 days    |
| Neo4j          | Full backup              | Daily      | 14 days   |
| OpenSearch     | Snapshot                 | Daily      | 14 days   |
| Object Storage | Cross-region replication | Continuous | —         |

## Backup Verification

- Automated restore test: Monthly.
- Full recovery drill: Quarterly.
- Integrity verification: Every backup.

## References

- [Disaster Recovery](disaster-recovery.md): Recovery plan.
