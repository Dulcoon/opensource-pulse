#!/bin/bash
cd "$(dirname "$0")/apps/web"
echo "[WEB] Installing deps..."
bun install --silent 2>/dev/null
echo "[WEB] Starting Vite dev server..."
bun run dev
