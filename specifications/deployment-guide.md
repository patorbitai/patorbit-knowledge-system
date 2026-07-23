# Deployment Guide - Patorbit Knowledge System

## Status: Draft

## Overview

This guide covers production deployment of the Patorbit Knowledge System, including prerequisites, configuration, database setup, deployment strategies, and ongoing operations.

## Prerequisites

### Software Requirements

- **Node.js:** 20.0+ (LTS)
- **pnpm:** 9.0+ (package manager)
- **PostgreSQL:** 16+ (database)
- **Redis:** 7+ (caching and session storage)
- **Docker:** 20+ (optional, for containerized deployment)

### Hardware Recommendations

**Development/Testing:**

- CPU: 4+ cores
- RAM: 8+ GB
- Storage: 50+ GB SSD

**Production:**

- CPU: 8+ cores (load balanced)
- RAM: 16+ GB
- Storage: 200+ GB SSD
- Network: 1+ Gbps

## Environment Variables

### Core Configuration (.env)

```bash
# Node/Platform
NODE_ENV=production
LOG_LEVEL=info
API_PORT=4000

# Database - Primary
DATABASE_URL=postgresql://patorbit:patorbit_password@localhost:5432/patorbit

# Database - Read Replicas (optional)
DATABASE_READ_REPLICA_URL=postgresql://patorbit_replica:patorbit_password@localhost:5432/patorbit_replica

# Cache
REDIS_URL=redis://localhost:6379

# OpenSearch (for search functionality)
OPENSEARCH_URL=http://localhost:9200

# Neo4j (for knowledge graph)
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=strong_password

# Storage
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_REGION=us-east-1
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_BUCKET=patorbit

# Authentication
JWT_ACCESS_SECRET=very_long_and_secure_access_secret_key_here
JWT_REFRESH_SECRET=very_long_and_secure_refresh_secret_key_here
AUTH_URL=https://patorbit.example.com

# Security
CSRF_SECRET=csrf_secret_key_here
ENCRYPTION_KEY=encryption_key_here

# Monitoring
SENTRY_DSN=https://key@sentry.io/project
PROMETHEUS_URL=http://localhost:9090
GRAFANA_URL=http://localhost:3000

# Email (for verification and notifications)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=email@example.com
SMTP_PASS=server_password
SMTP_FROM=no-reply@example.com
```

### Optional Services

```bash
# Message Queue (BullMQ)
REDIS_QUEUE_URL=redis://localhost:6379/1

# File Storage (S3-compatible)
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_DEFAULT_REGION=us-east-1
S3_ENDPOINT=http://localhost:9000

# AI/ML Models
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
GEMINI_API_KEY=your_gemini_key_here
```

## Database Setup

### PostgreSQL Initialization

```sql
-- Create database
dropdb patorbit
createdb patorbit

-- Grant privileges
grant all privileges on database patorbit to patorbit;

-- Extensions (if needed)
extension vector;
extension pg_stat_statements;
```

### Migration Process

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Push schema (if using development approach)
pnpm db:push

# Verify database state
pnpm db:studio
```

### Database Backup Strategy

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR=/backups/patorbit
DATE=$(date +%Y%m%d)

# PostgreSQL backup
pg_dump -U patorbit -h localhost -d patorbit > $BACKUP_DIR/backup_${DATE}.sql

# Compress backup
cd $BACKUP_DIR
bzip2 backup_${DATE}.sql

# Clean up old backups
find $BACKUP_DIR -name "backup_*.sql.bz2" -mtime +30 -delete
```

## Deployment Strategies

### 1. Direct Server Deployment

```bash
# Install dependencies
pnpm install

# Build application
pnpm build

# Start services
pnpm --filter @patorbit/api start
pnpm --filter @patorbit/web start
pnpm --filter @patorbit/admin start
```

### 2. Docker Deployment

**Dockerfile (API):**

```dockerfile
FROM node:20-alpine
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build --filter @patorbit/api

EXPOSE 4000
CMD ["node", "dist/apps/api/src/main.js"]
```

**Docker Compose:**

```yaml
version: '3.8'
services:
  api:
    build: ./apps/api
    ports:
      - '4000:4000'
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://patorbit:patorbit_password@postgres:5432/patorbit
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  web:
    build: ./apps/web
    ports:
      - '3000:3000'
    environment:
      - NEXT_PUBLIC_API_URL=https://patorbit.example.com/api
    depends_on:
      - api
    restart: unless-stopped

  admin:
    build: ./apps/admin
    ports:
      - '3001:3000'
    environment:
      - NEXT_PUBLIC_API_URL=https://patorbit.example.com/api
    depends_on:
      - api
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=patorbit
      - POSTGRES_USER=patorbit
      - POSTGRES_PASSWORD=patorbit_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/postgresql.conf:/etc/postgresql.conf
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 3. Cloud Provider Deployment

**Kubernetes:**

```yaml
# k8s/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: patorbit-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: patorbit-api
  template:
    metadata:
      labels:
        app: patorbit-api
    spec:
      containers:
        - name: api
          image: patorbit/api:latest
          ports:
            - containerPort: 4000
          env:
            - name: NODE_ENV
              value: 'production'
          resources:
            requests:
              memory: '512Mi'
              cpu: '250m'
            limits:
              memory: '2Gi'
              cpu: '1000m'
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ secrets.DOCKER_REGISTRY }}/patorbit:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/patorbit-api api=${{ secrets.DOCKER_REGISTRY }}/patorbit:latest
          kubectl rollout status deployment/patorbit-api
```

## Health Checks

### API Health Endpoint

```bash
# Check API health
curl -f http://localhost:4000/health

# Expected response:
{
  "status": "ok",
  "checks": [
    {
      "name": "database",
      "status": "pass",
      "responseTime": 45
    },
    {
      "name": "redis",
      "status": "pass",
      "responseTime": 12
    },
    {
      "name": "storage",
      "status": "pass",
      "responseTime": 78
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Health Check Configuration

```typescript
// apps/api/src/platform/health/indicators/
// Multiple health indicators
@Injectable()
export class DatabaseHealthIndicator {
  async isHealthy(name: string): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'up',
        name,
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'down',
        name,
        message: error.message,
        responseTime: Date.now() - startTime,
      };
    }
  }
}
```

## Monitoring Setup

### Metrics Collection

```bash
# Expose metrics endpoint
GET /metrics

# Example metrics
# process_cpu_user_seconds_total
# process_memory_rss_bytes
# http_requests_total
# database_connections_active
# redis_used_memory
```

### Alert Configuration

```yaml
# prometheus.yml
alerting:
  alertmanagers:
    - static_urls:
        - http://localhost:9093/alertmanager

rules:
  - name: APIHighErrorRate
    expr: rate(http_requests_total{status="500"}[5m]) > 0.1
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: 'High error rate in API'
      description: 'Error rate is {{ $value }}% over the last 5 minutes'

  - name: DatabaseHighConnections
    expr: db_connections_active > 80
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: 'High database connection count'
      description: '{{ $value }} database connections active'
```

## Log Management

### Log Locations

- **API Logs:** `logs/api.log`
- **Web Logs:** `logs/web.log`
- **Database Logs:** `logs/database.log`
- **Redis Logs:** `logs/redis.log`

### Log Rotation

```bash
# rsyslog configuration
customers {
    local0.*                        /var/log/customers/info.log
    local1.*                        /var/log/customers/error.log
}

# Logrotate configuration (/etc/logrotate.d/patorbit)
/var/log/customers/*.log {
    daily
    rotate 30
    compress
    missingok
    notifempty
    create 0644 root root
}
```

## Rollback Procedure

### Failed Deployment Recovery

1. **Identify Issue:** Check deployment logs and health checks
2. **Rollback Option A: Previous Version**

   ```bash
   # Roll back to previous deployment
   kubectl rollout undo deployment/patorbit-api
   ```

3. **Rollback Option B: Database Migration Revert**

   ```bash
   # If using migration tools
   pnpm db:migrate reset
   pnpm db:migrate
   ```

4. **Rollback Option C: Manual Fix**

   ```bash
   # For manual intervention
   kubectl exec -it deployment/patorbit-api -- /bin/bash
   # Debug and fix issues
   ```

5. **Post-Rollback Actions**
   - Verify all services are running
   - Check health endpoints
   - Run smoke tests
   - Monitor application logs

## Disaster Recovery

### Recovery Time Objectives (RTO/RPO)

- **API Service RTO:** < 30 minutes
- **API Service RPO:** < 5 minutes
- **Database RTO:** < 15 minutes
- **Database RPO:** < 1 minute

### Recovery Procedures

1. **Database Restoration:**

   ```bash
   # Restore from latest backup
   psql -U patorbit -h localhost -d patorbit < /backups/patorbit/backup_20240115.sql
   ```

2. **Configuration Restoration:**

   ```bash
   # Restore configuration files
   cp /backups/config.yaml /etc/patorbit/config.yaml
   ```

3. **Service Restart:**
   ```bash
   # Start all services
   systemctl start patorbit-api
   systemctl start patorbit-web
   systemctl start patorbit-admin
   ```

## Performance Tuning

### Resource Optimization

```yaml
# kubernetes/horizontal-pod-autoscaler.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: patorbit-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: patorbit-api
  minReplicas: 3
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

### Database Optimization

```sql
-- Performance indexes
CREATE INDEX CONCURRENTLY idx_user_email ON user(email);
CREATE INDEX CONCURRENTLY idx_organization_members_profile ON organization_member(profile_id);
CREATE INDEX CONCURRENTLY idx_knowledge_workspace ON knowledge(workspace_id);

-- Connection pooling
# PostgreSQL: Configure shared buffers and work_mem
# Redis: Configure maxmemory-policy
```

## Security Hardening

### SSL Configuration

```yaml
# kubernetes/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: patorbit-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: 'true'
    nginx.ingress.kubernetes.io/force-ssl-redirect: 'true'
spec:
  tls:
    - hosts:
        - patorbit.example.com
      secretName: patorbit-tls
  rules:
    - host: patorbit.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api
                port:
                  number: 4000
```

## Backup and Restore Operations

### Backup Schedule

```bash
# Daily full backup at 2 AM
0 2 * * * /opt/patorbit/scripts/backup.sh full

# Hourly point-in-time backup (if using PITR)
0 * * * * /opt/patorbit/scripts/backup.sh pitr

# Weekly cleanarchieve
0 0 * * 0 /opt/patorbit/scripts/backup.sh cleanarchieve
```

### Restore Testing

```bash
# Monthly restore test
#!/bin/bash
BACKUP_FILE=/backups/patorbit/test_backup_$(date +%Y%m%d).sql
RESTORE_DIR=/tmp/test_restore

mkdir -p $RESTORE_DIR
cd $RESTORE_DIR

# Test restore
pg_restore --clean --no-owner --verbose $BACKUP_FILE

# Verify data integrity
SELECT COUNT(*) FROM user;
SELECT COUNT(*) FROM organization;
```

## Update Procedures

### Patch Updates

1. Test in staging environment
2. Create database migration if needed
3. Deploy to staging
4. Run integration tests
5. Deploy to production
6. Monitor health checks
7. Gradual traffic shift (if using canary deployment)

### Major Version Upgrades

1. Create upgrade checklist
2. Test all integrations
3. Database migration plan
4. Content migration strategy
5. User notification plan
6. Go-live checklist
7. Post-deployment monitoring

This deployment guide covers the main aspects of deploying the Patorbit Knowledge System in production. Always tailor these instructions to your specific environment and requirements.
