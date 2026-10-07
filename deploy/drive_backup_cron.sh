#!/usr/bin/env bash
# deploy/drive_backup_cron.sh
# Automated Nightly Maintenance, Log Rotation & Drive Verification for e2-micro

set -euo pipefail

APP_DIR="/var/www/quinceca"
LOG_DIR="/var/log"
DATE=$(date +"%Y-%m-%d_%H%M%S")

echo "[Maintenance $DATE] Starting QuinceCA health and storage maintenance..."

# 1. Truncate PM2 logs if exceeding 50 MB
if [ -f "$LOG_DIR/quinceca-out.log" ]; then
    find "$LOG_DIR" -name "quinceca-*.log" -size +50M -exec truncate -s 5M {} \;
fi

# 2. Check Disk Space Usage (Warn if > 80% of 30 GB used)
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
echo "Disk Usage: ${DISK_USAGE}%"
if [ "$DISK_USAGE" -gt 85 ]; then
    echo "⚠️ Warning: Disk usage is high. Cleaning apt cache and npm cache..."
    apt-get clean
    npm cache clean --force 2>/dev/null || true
    journalctl --vacuum-time=3d
fi

# 3. Verify Memory & PM2 process health
pm2 ping || pm2 restart quinceca

echo "[Maintenance $DATE] Completed successfully."
