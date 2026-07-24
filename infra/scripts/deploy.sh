#!/usr/bin/env bash
set -euo pipefail

# ── Patorbit Beta Deployment Script ──
# Runs on the VPS via SSH from GitHub Actions.
#
# Prerequisites:
#   - Docker & Docker Compose installed
#   - .env.production file present at DEPLOY_PATH
#   - Nginx SSL certificates in place (or use bootstrap-ssl.sh first)

DEPLOY_PATH="${DEPLOY_PATH:-/opt/patorbit}"
RELEASE_TAG="${RELEASE_TAG:-latest}"
REGISTRY="${REGISTRY:-ghcr.io}"

cd "$DEPLOY_PATH"

echo "📥 Pulling images..."
docker compose pull api web

echo "🔄 Migrating database..."
docker compose run --rm api sh -c "npx prisma migrate deploy --schema=./packages/database/prisma/schema.prisma"

echo "🚀 Starting services..."
docker compose up -d api web nginx --remove-orphans

echo "🧹 Pruning old images..."
docker image prune -f

echo "✅ Deploy complete — tag: $RELEASE_TAG"
