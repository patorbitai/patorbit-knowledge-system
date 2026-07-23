#!/usr/bin/env bash
# ── Patorbit API — Docker Deployment Script ──────────────────────────────
# Builds & pushes the Docker image, then deploys to the target environment.
# Usage: ./apps/api/scripts/deploy.sh <staging|production>

set -euo pipefail

ENV="${1:-staging}"
IMAGE_NAME="patorbit/api"
TAG="${ENV}-$(date +%Y%m%d-%H%M%S)"

echo "==> Building Docker image: ${IMAGE_NAME}:${TAG}"
docker build -f apps/api/Dockerfile -t "${IMAGE_NAME}:${TAG}" -t "${IMAGE_NAME}:latest" .

if [ "$ENV" = "staging" ]; then
  echo "==> Deploying to staging..."
  # Adjust for your container registry & host
  # docker tag "${IMAGE_NAME}:${TAG}" "registry.example.com/${IMAGE_NAME}:${TAG}"
  # docker push "registry.example.com/${IMAGE_NAME}:${TAG}"
  # ssh deploy@staging-host "docker pull registry.example.com/${IMAGE_NAME}:${TAG} && docker compose up -d api"
  echo "    [staging] Push & deploy commands go here."
elif [ "$ENV" = "production" ]; then
  echo "==> Deploying to production..."
  # docker tag "${IMAGE_NAME}:${TAG}" "registry.example.com/${IMAGE_NAME}:${TAG}"
  # docker push "registry.example.com/${IMAGE_NAME}:${TAG}"
  # ssh deploy@prod-host "docker pull registry.example.com/${IMAGE_NAME}:${TAG} && docker compose up -d api"
  echo "    [production] Push & deploy commands go here."
fi

echo "==> Done: ${IMAGE_NAME}:${TAG}"
