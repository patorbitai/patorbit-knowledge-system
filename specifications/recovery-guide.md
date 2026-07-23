# Recovery Guide - Patorbit Knowledge System

## Status: Draft

## Overview

This guide provides comprehensive procedures for recovering from various failure scenarios in the Patorbit Knowledge System, including database failures, deployment issues, stuck migrations, and incident response.

## Incident Response Framework

### Severity Levels

1. **Critical (P1)** - System unavailable, >50% of users affected
   - Database down, complete service outage
   - Data corruption or loss

2. **High (P2)** - Major functionality unavailable, >25% affected
   - Single service down, authentication failures
   - Severely degraded performance

3. **Medium (P3)** - Partial functionality affected, <25% affected
   - Slow queries, broken UI elements
   - Non-critical features degraded

4. **Low (P4)** - Minor issues, cosmetic problems
   - Log formatting, minor UI bugs

### Incident Response Steps

**For all incidents:**

1. **Alert Notification**
   - Alerts trigger via health check endpoint or monitoring system
   - On-call team notified through configured channels

2. **Triage**
   - Identify affected services and scope
   - Check health endpoint: `GET /health`
   - Review application and system logs

3. **Communication**
   - Internal notification to engineering team
   - User-facing status communication if public impact
   - Regular status updates during extended incidents

4. **Resolution**
   - Apply recovery procedure
   - Verify service restoration
   - Post-incident review

## Database Recovery

### Connection Issues

**Symptom:** Connection timeout, "connection refused", ECONNREFUSED

**Recovery Steps:**

```bash
# 1. Check database status
pg_isready -h localhost -p 5432

# 2. Check PostgreSQL service
systemctl status postgresql
journalctl -u postgresql -n 50 --no-pager

# 3. Restart database if needed
systemctl restart postgresql

# 4. Check disk space
df -h /var/lib/postgresql

# 5. Check connection pool
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
```

### Database Corruption

**Symptom:** Query errors, constraint violations, missing data

**Recovery Steps:**

```bash
# 1. Stop application services
systemctl stop patorbit-api

# 2. Take immediate backup of current state
pg_dump -U patorbit -h localhost -d patorbit > /backups/emergency/corrupted_dump_$(date +%Y%m%d_%H%M%S).sql

# 3. Attempt pg_dump of intact tables
pg_dump -U patorbit -h localhost -d patorbit --exclude-table-data=corrupted_table > /backups/partial_restore.sql

# 4. Restore from latest known good backup
dropdb patorbit
createdb patorbit
psql -U patorbit -d patorbit < /backups/latest_clean_backup.sql

# 5. Run database migrations forward
pnpm db:migrate

# 6. Verify data integrity
psql -U patorbit -d patorbit -c "SELECT count(*) FROM user"
psql -U patorbit -d patorbit -c "SELECT count(*) FROM organization"

# 7. Restart services
systemctl start patorbit-api
```

### Full Data Loss

**Symptom:** Database empty, tables missing

**Recovery Steps:**

```bash
# 1. Stop all application services
systemctl stop patorbit-api patorbit-web patorbit-admin

# 2. Verify backup availability
ls -la /backups/patorbit/
# Check both local and remote backup locations

# 3. Create fresh database
dropdb patorbit
createdb patorbit

# 4. Restore from backup
pg_restore --clean --no-owner --verbose -U patorbit -d patorbit /backups/patorbit/latest_backup.dump

# Alternative: SQL restore
psql -U patorbit -d patorbit < /backups/patorbit/latest_backup.sql

# 5. Check database state
psql -U patorbit -d patorbit -c "\dt"
psql -U patorbit -d patorbit -c "SELECT count(*) FROM user"

# 6. Start services and verify
systemctl start patorbit-api
curl -f http://localhost:4000/health
```

## Failed Deployment Rollback

### Application Rollback

```bash
# Docker-based deployment
# Option 1: Revert to previous image tag
docker pull patorbit/api:previous-stable-tag
docker compose up -d api

# Option 2: Git-based rollback
git checkout <previous-stable-tag>
pnpm install --frozen-lockfile
pnpm build
pnpm --filter @patorbit/api start

# Option 3: Systemd service
# Stop current version
systemctl stop patorbit-api

# Replace with previous build
cp -r /opt/patorbit/api/previous/ /opt/patorbit/api/current/

# Start previous version
systemctl start patorbit-api
```

### Database Migration Rollback

```bash
# 1. Identify current migration state
pnpm db:studio
# Check _prisma_migrations table

# 2. Rollback specific migration
# Prisma does not natively support rollback.
# Apply reverse migration manually if needed:

# Option A: Restore database from pre-migration backup
psql -U patorbit -d patorbit < /backups/pre_migration_backup.sql

# Option B: Push previous schema state (destructive)
# Checkout previous code state
git checkout <commit-before-migration>
pnpm install --frozen-lockfile
pnpm db:generate
pnpm db:push --force-reset
# WARNING: This drops all data. Only use if backup is available.

# 3. Verify schema state
psql -U patorbit -d patorbit -c "\dt"
```

## Stuck Migration Recovery

### Identifying Stuck Migrations

```bash
# Check migration status
pnpm db:migrate --status

# Check database migration table
psql -U patorbit -d patorbit -c "SELECT * FROM _prisma_migrations ORDER BY started_at;"
```

### Recovery Procedures

**Scenario 1: Migration failed mid-execution**

```bash
# 1. Check migration error
pnpm db:migrate
# Review the error message and failed migration name

# 2. Manually mark migration as rolled back
psql -U patorbit -d patorbit -c "
UPDATE _prisma_migrations
SET rolled_back_at = NOW()
WHERE migration_name = '<failed_migration_name>';
"

# 3. Attempt to fix migration SQL and re-run
pnpm db:migrate
```

**Scenario 2: Migration succeeded but application incompatible**

```bash
# 1. Check application compatibility
pnpm typecheck

# 2. If incompatible, rollback database
psql -U patorbit -d patorbit < /backups/pre_migration.sql

# 3. Mark migration as rolled back
psql -U patorbit -d patorbit -c "
UPDATE _prisma_migrations
SET rolled_back_at = NOW()
WHERE migration_name = '<incompatible_migration_name>';
"
```

**Scenario 3: Multiple stuck migrations**

```bash
# 1. Check if any have rolled_back_at
psql -U patorbit -d patorbit -c "SELECT * FROM _prisma_migrations WHERE rolled_back_at IS NOT NULL;"

# 2. If issues persist, reset schema
pnpm db:migrate reset
pnpm db:migrate

# WARNING: This drops all data. Only use in development or with confirmed backups.
```

## PostgreSQL Point-in-Time Recovery (PITR)

### Prerequisites

```bash
# Ensure WAL archiving is enabled
# Check postgresql.conf:
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/archive/%f'

# Verify WAL files exist
ls -la /var/lib/postgresql/archive/
```

### PITR Procedure

```bash
# 1. Stop the database
systemctl stop postgresql

# 2. Move current data directory
mv /var/lib/postgresql/16/main /var/lib/postgresql/16/main_corrupted

# 3. Restore base backup
# Assuming base backup at /backups/patorbit/base_backup/
cp -r /backups/patorbit/base_backup /var/lib/postgresql/16/main

# 4. Create recovery.conf (or set in postgresql.auto.conf)
cat > /var/lib/postgresql/16/main/recovery.conf << EOF
restore_command = 'cp /var/lib/postgresql/archive/%f %p'
recovery_target_time = '2024-01-15 14:30:00 UTC'
recovery_target_action = 'promote'
EOF

# 5. Start database in recovery mode
systemctl start postgresql

# 6. Check logs for recovery status
journalctl -u postgresql -n 50

# 7. Once complete, verify data
psql -U patorbit -d patorbit -c "SELECT NOW();"
psql -U patorbit -d patorbit -c "SELECT count(*) FROM user;"
```

## Service Recovery Procedures

### API Service Crash

```bash
# 1. Check service status
systemctl status patorbit-api

# 2. Check logs
journalctl -u patorbit-api -n 100 --no-pager

# 3. Restart service
systemctl restart patorbit-api

# 4. Verify health
curl -f http://localhost:4000/health

# 5. If crash loop, rollback deployment
kubectl rollout undo deployment/patorbit-api
# or
systemctl stop patorbit-api
cp -r /opt/patorbit/api/previous/ /opt/patorbit/api/current/
systemctl start patorbit-api
```

### Redis Failure

```bash
# 1. Check Redis status
redis-cli ping

# 2. Start Redis
systemctl start redis

# 3. Verify connection
redis-cli ping
# Should return PONG

# 4. Check RDB/AOF persistence
redis-cli info persistence
```

### Storage (S3-compatible) Failure

```bash
# 1. Check endpoint connectivity
curl -f http://localhost:9000/minio/health/live

# 2. Verify credentials
mc alias set patorbit http://localhost:9000 access_key secret_key
mc ls patorbit/patorbit

# 3. Restart storage service
systemctl restart minio
# or
docker compose restart storage
```

## Post-Incident Procedures

### Data Integrity Verification

```bash
# 1. Verify user accounts
SELECT count(*), is_locked FROM user GROUP BY is_locked;
SELECT count(*) FROM organization_member;

# 2. Check for orphaned records
SELECT u.id, u.email FROM user u
LEFT JOIN organization_member om ON om.user_id = u.id
WHERE om.id IS NULL;

# 3. Verify migration state
SELECT count(*) FROM _prisma_migrations WHERE rolled_back_at IS NULL;
```

### Audit Trail Verification

```bash
# Check audit log completeness
SELECT count(*) FROM audit_log WHERE timestamp > NOW() - INTERVAL '1 day';
SELECT action, count(*) FROM audit_log GROUP BY action;
```

### Compliance Requirements

- Document incident timeline and actions taken
- Note any data loss and affected users
- Identify root cause and preventive measures
- Update recovery procedures based on learnings

## Contact Information

### Escalation Contacts

- **Platform Engineering Lead:** On-call via PagerDuty
- **Database Administrator:** On-call DBA
- **Security Incident:** Security team

### Availability

- **Business Hours:** 9 AM - 5 PM EST (Mon-Fri)
- **After Hours:** Emergency response only
- **SLA:** 99.9% uptime target

This recovery guide is a living document and should be updated after each significant incident with lessons learned.
