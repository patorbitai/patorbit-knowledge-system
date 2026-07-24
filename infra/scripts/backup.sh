#!/usr/bin/env bash
set -euo pipefail

# ── Patorbit Backup Script ──
# Run daily via cron: 0 3 * * * /opt/patorbit/infra/scripts/backup.sh

BACKUP_DIR="${BACKUP_DIR:-/opt/patorbit/backups}"
RETENTION_DAYS=14
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"/{database,storage}

echo "📦 Starting backup at $(date)..."

# ── Database backup ──
echo "  - Dumping database..."
docker compose exec -T postgres \
  pg_dump -U "${POSTGRES_USER:-patorbit}" "${POSTGRES_DB:-patorbit}" \
  | gzip > "$BACKUP_DIR/database/patorbit_$TIMESTAMP.sql.gz"

echo "  - Database backup saved: patorbit_$TIMESTAMP.sql.gz"

# ── Prune old backups ──
find "$BACKUP_DIR/database" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "  - Pruned backups older than $RETENTION_DAYS days"

echo "✅ Backup completed at $(date)"
echo "   Total database backups: $(ls -1 "$BACKUP_DIR/database"/*.sql.gz 2>/dev/null | wc -l)"
