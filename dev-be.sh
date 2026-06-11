#!/bin/bash
cd "$(dirname "$0")/apps/api"
echo "[API] Starting Go server..."
go run ./cmd/api
