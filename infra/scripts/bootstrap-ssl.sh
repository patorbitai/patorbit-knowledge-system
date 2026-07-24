#!/usr/bin/env bash
set -euo pipefail

# ── Initial SSL Bootstrap ──
# Run this once on the server before the first deployment.
# It starts a temporary Nginx to satisfy Certbot's HTTP challenge.

DOMAIN="${1:-beta.patorbit.com}"
EMAIL="${2:-admin@patorbit.com}"

echo "🔐 Bootstrapping SSL certificate for $DOMAIN..."

# Create required directories
mkdir -p /opt/patorbit/infra/nginx/ssl /opt/patorbit/infra/nginx/conf.d

# Start temporary nginx just for the cert challenge
docker run --rm -d \
  --name pks-nginx-bootstrap \
  -v /opt/patorbit/infra/nginx/conf.d:/etc/nginx/conf.d:ro \
  -p 80:80 \
  nginx:1.27-alpine

# Run certbot
docker run --rm \
  -v /opt/patorbit/infra/nginx/ssl:/etc/letsencrypt \
  certbot/certbot:v2.10.0 certonly \
    --webroot -w /var/www/certbot \
    -d "$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive

# Stop temporary nginx
docker kill pks-nginx-bootstrap

echo "✅ SSL certificate obtained for $DOMAIN"
echo ""
echo "Certificates stored at: /opt/patorbit/infra/nginx/ssl/live/$DOMAIN/"
echo ""
echo "Next steps:"
echo "  1. Ensure .env.production has the correct DOMAIN, FRONTEND_URL, and AUTH_URL set to https://$DOMAIN"
echo "  2. Deploy the full stack: docker compose up -d"
