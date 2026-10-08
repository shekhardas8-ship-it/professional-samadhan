#!/usr/bin/env bash
# ==============================================================================
# QuinceCA - Cloud Re-sync & Build Script for GCP VM
# Usage:
#   bash deploy/update_cloud.sh
# ==============================================================================
set -euo pipefail

echo "=================================================================="
echo "    QUINCECA - LIVE CLUSTER RE-SYNC & PRODUCTION REBUILD          "
echo "=================================================================="

# Detect application root
if [ -d "/var/www/quinceca" ]; then
    APP_DIR="/var/www/quinceca"
elif [ -d "$HOME/quinceca" ]; then
    APP_DIR="$HOME/quinceca"
else
    APP_DIR="$(pwd)"
fi

echo ">>> Navigating to $APP_DIR..."
cd "$APP_DIR"

echo ">>> [1/4] Pulling latest updates from GitHub..."
git pull origin main

echo ">>> [2/4] Verifying dependencies..."
export NODE_OPTIONS="--max-old-space-size=768"
npm install --legacy-peer-deps --no-audit --prefer-offline 2>/dev/null || npm install --legacy-peer-deps

echo ">>> [3/4] Rebuilding client production assets..."
npm run build

echo ">>> [4/4] Restarting QuinceCA under PM2..."
if pm2 describe quinceca > /dev/null 2>&1; then
    pm2 restart quinceca
else
    pm2 start deploy/ecosystem.config.cjs || pm2 start server.ts --name quinceca --interpreter npx --interpreter-args "tsx" --max-memory-restart 750M
fi

pm2 save

echo "=================================================================="
echo "✅ QUINCECA SUCCESSFULLY UPDATED & RUNNING LATEST CODE!"
echo "   Visit: https://quinceca.quinceautomation.com"
echo "=================================================================="
