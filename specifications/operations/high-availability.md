# High Availability

## Purpose

Multi-zone and multi-region readiness for the platform.

## Availability Zones

- Every component is deployed across 3 AZs.
- Database multi-AZ failover is automatic.
- Load balancers distribute traffic across AZs.

## Multi-Region (Future)

- **Active-Passive**: Secondary region for failover.
- **Data Replication**: Asynchronous replication to secondary region.
- **DNS Failover**: Automated via Cloudflare.

## Service-Level Targets

| Component   | Target Availability |
| ----------- | ------------------- |
| API         | 99.95%              |
| Frontend    | 99.95%              |
| Database    | 99.99%              |
| AI Services | 99.9%               |

## References

- [Disaster Recovery](disaster-recovery.md): Full recovery plan.
- [Reliability](reliability.md): Fault tolerance.
