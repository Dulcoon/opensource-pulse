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

# Explicitly ensure web container is started (preventing it from lingering in Created state)
docker compose -f docker-compose.yml up -d web

echo "==> [4/5] Cleaning up dangling and unused Docker images..."
docker image prune -f

echo "==> [5/5] Verifying services health..."

# Check Backend API endpoint (poll up to 30s)
echo "Checking Backend API health (http://127.0.0.1:9001/health)..."
API_READY=false
for i in {1..15}; do
  if curl -sf http://127.0.0.1:9001/health > /dev/null; then
    API_READY=true
    echo "✔ Backend API is HEALTHY (attempt $i)"
    break
  fi
  sleep 2
done
if [ "$API_READY" = false ]; then
  echo "⚠ Warning: Backend API health check failed after 30s!"
fi

# Check Frontend Web endpoint (poll up to 30s)
echo "Checking Frontend Web (http://127.0.0.1:3001)..."
WEB_READY=false
for i in {1..15}; do
  if curl -sf http://127.0.0.1:3001 > /dev/null; then
    WEB_READY=true
    echo "✔ Frontend Web is HEALTHY (attempt $i)"
    break
  fi
  # Re-assert web container if delayed
  docker compose -f docker-compose.yml up -d web >/dev/null 2>&1 || true
  sleep 2
done
if [ "$WEB_READY" = false ]; then
  echo "⚠ Warning: Frontend Web check failed (port 3001) after 30s!"
fi

# Show final container status
echo "==> Container status:"
docker ps --filter "name=opensource_pulse"

echo "=============================================================================="
echo "✔ Deployment completed successfully at $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "=============================================================================="
