#!/usr/bin/env bash
set -euo pipefail

# ── Patorbit Beta Rollback Script ──
# Usage: ./rollback.sh [previous-tag]
# If no tag is given, redeploys the 'latest' tag (which should point to the previous stable).

DEPLOY_PATH="${DEPLOY_PATH:-/opt/patorbit}"
PREVIOUS_TAG="${1:-latest}"
REGISTRY="${REGISTRY:-ghcr.io}"

cd "$DEPLOY_PATH"

echo "⏪ Rolling back to tag: $PREVIOUS_TAG"
RELEASE_TAG=$PREVIOUS_TAG docker compose pull api web

echo "⚠️  Database rollback may be required if migrations were destructive."
echo "   If needed, restore from: pg_dump backup or run migration rollback manually."

echo "🔄 Restarting services..."
RELEASE_TAG=$PREVIOUS_TAG docker compose up -d api web nginx --remove-orphans

echo "✅ Rollback complete — tag: $PREVIOUS_TAG"
echo ""
echo "Manual DB rollback commands (if needed):"
echo "  1. List migration history: docker compose exec api npx prisma migrate status --schema=./packages/database/prisma/schema.prisma"
echo "  2. Roll back one: docker compose exec api npx prisma migrate resolve --rolled-back <migration-name>"
