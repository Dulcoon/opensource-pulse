#!/bin/bash
set -e

# ==============================================================================
# OpenSource Pulse - Server Deployment Script
# ==============================================================================

PROJECT_DIR="/var/www/opensource-pulse"
BRANCH="main"

echo "==> [1/5] Navigating to project directory: $PROJECT_DIR"
cd "$PROJECT_DIR" || { echo "Directory $PROJECT_DIR not found!"; exit 1; }

echo "==> [2/5] Fetching and updating latest code from git ($BRANCH)..."
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "==> [3/5] Building and updating Docker containers..."
cd docker
docker compose -f docker-compose.yml up -d --build --remove-orphans

echo "==> [4/5] Cleaning up dangling and unused Docker images..."
docker image prune -f

echo "==> [5/5] Verifying services health..."
sleep 5

# Check container status
docker ps --filter "name=opensource_pulse"

# Verify API health endpoint
if curl -sf http://127.0.0.1:9001/health > /dev/null; then
  echo "✔ Backend API is HEALTHY (http://127.0.0.1:9001/health)"
else
  echo "⚠ Warning: Backend API health check failed!"
fi

echo "=============================================================================="
echo "✔ Deployment completed successfully at $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "=============================================================================="
