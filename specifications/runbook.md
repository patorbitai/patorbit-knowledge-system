# Runbook - Patorbit Knowledge System

## Status: Draft

## Overview

This runbook details operational procedures for monitoring, maintaining, and troubleshooting the Patorbit Knowledge System in production.

## Application Health Checks

### Primary Health Endpoint

```bash
# Public endpoint, no authentication required
GET http://localhost:4000/health

# Expected response (HTTP 200):
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up",
      "responseTime": 45
    },
    "redis": {
      "status": "up",
      "responseTime": 12
    },
    "storage": {
      "status": "up",
      "responseTime": 78
    }
  },
  "error": {},
  "details": {
    "database": { "status": "up", "responseTime": 45 },
    "redis": { "status": "up", "responseTime": 12 },
    "storage": { "status": "up", "responseTime": 78 }
  }
}

# Health check failure (HTTP 503):
{
  "status": "error",
  "info": {},
  "error": {
    "database": {
      "status": "down",
      "message": "ECONNREFUSED 127.0.0.1:5432"
    }
  },
  "details": {
    "database": {
      "status": "down",
      "message": "ECONNREFUSED 127.0.0.1:5432"
    }
  }
}
```

### Health Indicators

The health endpoint checks three dependencies:

| Indicator | Checks                       | Implementation                       |
| --------- | ---------------------------- | ------------------------------------ |
| database  | Prisma database connectivity | `await prisma.$queryRaw\`SELECT 1\`` |
| redis     | Redis connectivity           | Redis ping command                   |
| storage   | S3-compatible storage        | Bucket head request or object list   |

## Common Alert Responses

### Alert: Database Connection Failures

**Trigger:** Health check fails for `database` indicator three consecutive times.

**Severity:** P1 (Critical)

**Immediate Actions:**

1. Verify database is running

   ```bash
   systemctl status postgresql
   pg_isready -h localhost -p 5432
   ```

2. Check PostgreSQL logs

   ```bash
   journalctl -u postgresql -n 100 --no-pager
   tail -100 /var/log/postgresql/postgresql-16-main.log
   ```

3. Check connection count

   ```bash
   psql -U patorbit -d patorbit -c "SELECT count(*) FROM pg_stat_activity;"
   psql -U patorbit -d patorbit -c "SELECT state, count(*) FROM pg_stat_activity GROUP BY state;"
   ```

4. Restart if necessary
   ```bash
   systemctl restart postgresql
   ```

**Root Causes:**

- Connection pool exhausted
- PostgreSQL service crash (OOM)
- Network partition between API and database
- Disk full on database volume

**Resolution:**

- Increase max_connections in postgresql.conf
- Restart service
- Clear idle connections
- Free disk space

### Alert: High API Error Rate

**Trigger:** >1% of HTTP requests return 5xx errors over 5-minute window.

**Severity:** P2 (High)

**Immediate Actions:**

1. Check recent error logs

   ```bash
   journalctl -u patorbit-api -n 200 --no-pager | grep -E "ERROR|500"
   ```

2. Check API health

   ```bash
   curl -f http://localhost:4000/health
   ```

3. Check database health

   ```bash
   psql -U patorbit -d patorbit -c "SELECT 1;"
   ```

4. Review recent deployments
   ```bash
   git log --oneline -10
   kubectl rollout history deployment/patorbit-api
   ```

**Root Causes:**

- Recent code deployment with regression
- Database migration causing query failures
- Downstream service unavailability
- Memory leak causing crash loops

**Resolution:**

- Rollback deployment
- Apply hotfix
- Scale up resources
- Restart service

### Alert: Slow API Response Time

**Trigger:** p95 response time exceeds 2 seconds over 5-minute window.

**Severity:** P2 (High)

**Immediate Actions:**

1. Check database query performance

   ```sql
   SELECT query, calls, total_time, mean_time
   FROM pg_stat_statements
   ORDER BY mean_time DESC
   LIMIT 20;
   ```

2. Check Redis performance

   ```bash
   redis-cli info stats | grep -E "keyspace|hit_rate|miss_rate"
   ```

3. Check CPU/Memory usage

   ```bash
   top -b -n 1 | head -20
   free -m
   ```

4. Check connection pool
   ```bash
   psql -U patorbit -d patorbit -c "SELECT count(*) FROM pg_stat_activity;"
   ```

**Root Causes:**

- Missing database index
- Inefficient query
- Resource saturation
- Memory pressure / swapping

**Resolution:**

- Add missing indexes
- Optimize slow queries
- Increase resources
- Restart service to clear cache

### Alert: Redis Connection Failures

**Trigger:** Health check fails for `redis` indicator.

**Severity:** P2 (High) - Degraded performance, auth may fail

**Immediate Actions:**

1. Check Redis status

   ```bash
   redis-cli ping
   systemctl status redis
   ```

2. Check Redis logs

   ```bash
   journalctl -u redis -n 50
   ```

3. Check memory usage
   ```bash
   redis-cli info memory
   ```

**Root Causes:**

- Redis service crash
- OOM killer
- Configuration issue
- Network issue

**Resolution:**

- Restart Redis
- Increase maxmemory
- Clear keyspace
- Verify configuration

### Alert: Storage Connection Failures

**Trigger:** Health check fails for `storage` indicator.

**Severity:** P3 (Medium) - File uploads/downloads affected

**Immediate Actions:**

1. Check storage endpoint

   ```bash
   curl -f http://localhost:9000/minio/health/live
   ```

2. Verify credentials
   ```bash
   mc alias set patorbit http://localhost:9000 $ACCESS_KEY $SECRET_KEY
   mc ls patorbit/patorbit
   ```

**Resolution:**

- Restart storage service
- Regenerate credentials
- Check network connectivity

## Scaling Guidelines

### Horizontal Scaling

**API Service:**

- Scale based on CPU utilization (>70%)
- Scale based on request latency (>500ms p95)
- Recommended: 3-10 pods per cluster

```yaml
# HPA configuration
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: patorbit-api-hpa
spec:
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

**Web Application:**

- Scale based on request count
- Recommended: 2-6 pods per cluster

**Database:**

- Scale vertically for read-heavy workloads
- Add read replicas for query distribution
- Connection pooling via PgBouncer for high concurrency

**Redis:**

- Scale vertically for cache-heavy workloads
- Redis Cluster for sharding

### Vertical Scaling Thresholds

| Component          | Scale Up | Scale Down | Max      |
| ------------------ | -------- | ---------- | -------- |
| API (CPU)          | >70%     | <40%       | 10 pods  |
| API (Memory)       | >80%     | <50%       | 4GB/pod  |
| Database (CPU)     | >60%     | <30%       | 16 cores |
| Database (Storage) | >80%     | <50%       | 500GB    |
| Redis (Memory)     | >75%     | <50%       | 32GB     |

## Log Locations and Querying

### Log Locations

| Service    | Log Path                                                | Format |
| ---------- | ------------------------------------------------------- | ------ |
| API        | `logs/api.log`                                          | JSON   |
| Web        | `logs/web.log`                                          | JSON   |
| Admin      | `logs/admin.log`                                        | JSON   |
| PostgreSQL | `/var/log/postgresql/postgresql-16-main.log`            | Text   |
| Redis      | `/var/log/redis/redis-server.log`                       | Text   |
| Nginx      | `/var/log/nginx/access.log`, `/var/log/nginx/error.log` | Text   |

### Systemd Journal

```bash
# API service logs
journalctl -u patorbit-api -n 100 --no-pager
journalctl -u patorbit-api --since "1 hour ago"
journalctl -u patorbit-api -f

# Database logs
journalctl -u postgresql -n 50 --no-pager
```

### Common Log Queries

```bash
# Find all ERROR level logs in last hour
journalctl -u patorbit-api --since "1 hour ago" | grep -i "error"

# Find all 500 response logs
journalctl -u patorbit-api -n 1000 | grep '"statusCode":5'

# Find authentication failures
journalctl -u patorbit-api -n 1000 | grep -i "unauthorized"

# Find database connection errors
journalctl -u patorbit-api -n 1000 | grep -i "database\|postgres\|prisma"

# Find rate limit hits
journalctl -u patorbit-api -n 1000 | grep -i "rate limit\|throttle"

# Export logs to file for analysis
journalctl -u patorbit-api --since "2024-01-15 00:00:00" --until "2024-01-15 23:59:59" > /tmp/api_logs_export.txt
```

### Structured Log Querying

```bash
# Application structured JSON logs
# Filter by log level
cat logs/api.log | jq 'select(.level == "ERROR")'

# Filter by correlation ID
cat logs/api.log | jq 'select(.correlationId == "abc-123")'

# Filter by module
cat logs/api.log | jq 'select(.module == "AuthService")'

# Count errors by module
cat logs/api.log | jq -r 'select(.level == "ERROR") | .module' | sort | uniq -c | sort -rn
```

### Monitoring Dashboards

| Dashboard      | Metrics                                      | Location             |
| -------------- | -------------------------------------------- | -------------------- |
| API Overview   | Request rate, latency, error rate            | Grafana dashboard #1 |
| Database       | Connections, query time, cache hit ratio     | Grafana dashboard #2 |
| Redis          | Memory usage, hit rate, keyspace             | Grafana dashboard #3 |
| Infrastructure | CPU, memory, disk, network                   | Grafana dashboard #4 |
| Business       | Active users, organizations, knowledge items | Grafana dashboard #5 |

## Maintenance Procedures

### Database Maintenance

```sql
-- Analyze tables for query planner
ANALYZE;

-- VACUUM to reclaim storage
VACUUM ANALYZE;

-- Reindex to reduce index bloat
REINDEX INDEX CONCURRENTLY idx_user_email;

-- View table sizes
SELECT
  relname AS table_name,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

### Redis Maintenance

```bash
# Check memory fragmentation
redis-cli info memory | grep mem_fragmentation

# Clear entire cache (if needed)
redis-cli FLUSHALL

# Monitor keyspace
redis-cli --stat

# Check slow queries
redis-cli SLOWLOG GET 10
```

### Certificate Renewal

```bash
# Check certificate expiry
echo | openssl s_client -connect patorbit.example.com:443 2>/dev/null | openssl x509 -noout -dates

# Renew with cert-manager (Kubernetes)
kubectl cert-manager renew patorbit-tls

# Renew manually
certbot renew --webroot -w /var/www/certbot
```

## On-Call Procedures

### Handover Checklist

- [ ] Check current system status (dashboard)
- [ ] Review any ongoing incidents
- [ ] Verify all health checks pass
- [ ] Check queue depth and processing
- [ ] Review recent deployments
- [ ] Verify backup completion
- [ ] Review any pending alerts

### Escalation Path

1. **Level 1:** On-call engineer (primary)
   - Health check monitoring
   - Common alert responses
   - Service restarts

2. **Level 2:** Platform team lead
   - Complex troubleshooting
   - Deployment issues
   - Performance problems

3. **Level 3:** Engineering manager / SRE
   - Major incidents
   - Architecture decisions
   - Customer communication

4. **Level 4:** Executive / CTO
   - Critical system-wide failures
   - Extended downtime
   - Security incidents

## References

- **Recovery Guide:** `specifications/recovery-guide.md`
- **Deployment Guide:** `specifications/deployment-guide.md`
- **Architecture Decisions:** `specifications/adr/`
- **MkDocs Documentation:** `/docs` directory with mkdocs.yml
- **Health Checks:** `apps/api/src/platform/health/`
