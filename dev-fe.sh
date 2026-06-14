#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

cd "$(dirname "$0")/apps/web"
[ -s ".nvmrc" ] && nvm use 2>/dev/null

echo "[WEB] Starting Vite dev server (node $(node -v))..."
npm run dev
