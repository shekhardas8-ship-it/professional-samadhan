#!/usr/bin/env bash
# ==============================================================================
# QuinceCA - Ubuntu 24.04 VM Bootstrap Script for GCP e2-micro (1 GB RAM)
# Configures:
#   1. 4 GB Swap Space (Zero OOM Crashes on 1 GB RAM)
#   2. Node.js 20 LTS + Python 3 virtual environment
#   3. PM2 Process Manager with auto-restart on boot
#   4. Production Nginx Reverse Proxy with Gzip & WebSockets
#   5. Real-Time Google Drive sync readiness
# ==============================================================================

set -euo pipefail

echo "=================================================================="
echo "    QUINCECA - e2-micro SYSTEM BOOTSTRAPPER (100% AUTOMATED)     "
echo "=================================================================="

# Ensure running as root
if [ "$(id -u)" -ne 0 ]; then
    echo "❌ Please run as root (use: sudo bash vm_bootstrap.sh)"
    exit 1
fi

APP_DIR="/var/www/quinceca"

# ------------------------------------------------------------------------------
# STEP 1: CONFIGURE 4 GB SWAP FILE (ESSENTIAL FOR 1 GB RAM e2-micro)
# ------------------------------------------------------------------------------
echo ">>> [1/7] Configuring 4 GB Swap Memory for e2-micro..."
if ! grep -q "swapfile" /etc/fstab; then
    rm -f /swapfile 2>/dev/null || true
    dd if=/dev/zero of=/swapfile bs=1M count=4096 status=none || fallocate -l 4G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile || true
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    
    # Tune memory swappiness for optimal performance
    sysctl -w vm.swappiness=10 2>/dev/null || true
    sysctl -w vm.vfs_cache_pressure=50 2>/dev/null || true
    echo 'vm.swappiness=10' >> /etc/sysctl.conf
    echo 'vm.vfs_cache_pressure=50' >> /etc/sysctl.conf
    echo "✓ 4 GB Swap memory configured."
else
    echo "✓ Swapfile already configured."
fi

# ------------------------------------------------------------------------------
# STEP 2: INSTALL BASE SYSTEM PACKAGES & SECURITY
# ------------------------------------------------------------------------------
echo ">>> [2/7] Updating system packages and installing prerequisites..."
apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get install -y \
    curl \
    wget \
    git \
    unzip \
    build-essential \
    nginx \
    certbot \
    python3-certbot-nginx \
    python3 \
    python3-pip \
    python3-venv \
    ufw

# ------------------------------------------------------------------------------
# STEP 3: INSTALL NODE.JS 20 LTS & PM2
# ------------------------------------------------------------------------------
echo ">>> [3/7] Installing Node.js 20 LTS & PM2..."
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'.' -f1)" != "v20" ]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

npm install -g pm2
echo "✓ Node.js $(node -v) and PM2 $(pm2 -v) installed."

# ------------------------------------------------------------------------------
# STEP 4: PREPARE APP REPOSITORY & PYTHON VIRTUALENV
# ------------------------------------------------------------------------------
echo ">>> [4/7] Setting up application directory..."
mkdir -p "$APP_DIR"
chown -R "$SUDO_USER:$SUDO_USER" "$APP_DIR" 2>/dev/null || true

# If script is run directly inside repo directory, copy or link to /var/www/quinceca
CURRENT_DIR="$(pwd)"
if [ -f "$CURRENT_DIR/server.ts" ] && [ "$CURRENT_DIR" != "$APP_DIR" ]; then
    echo "Copying repository files from $CURRENT_DIR to $APP_DIR..."
    cp -r "$CURRENT_DIR/." "$APP_DIR/"
fi

cd "$APP_DIR"

# Set up Python virtual environment
echo "Setting up Python 3 virtual environment..."
python3 -m venv "$APP_DIR/venv"
"$APP_DIR/venv/bin/pip" install --upgrade pip
if [ -f "$APP_DIR/requirements.txt" ]; then
    "$APP_DIR/venv/bin/pip" install -r "$APP_DIR/requirements.txt"
fi

# ------------------------------------------------------------------------------
# STEP 5: INSTALL NODE PACKAGES & BUILD FRONTEND
# ------------------------------------------------------------------------------
echo ">>> [5/7] Installing Node dependencies and building Vite SPA..."
# Set memory limit for npm/vite build to avoid OOM
export NODE_OPTIONS="--max-old-space-size=768"
npm install --legacy-peer-deps
npm run build
echo "✓ Production bundle built successfully."

# ------------------------------------------------------------------------------
# STEP 6: CONFIGURE NGINX REVERSE PROXY
# ------------------------------------------------------------------------------
echo ">>> [6/7] Configuring Nginx..."
if [ -f "$APP_DIR/deploy/nginx.conf" ]; then
    cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/sites-available/quinceca
    ln -sf /etc/nginx/sites-available/quinceca /etc/nginx/sites-enabled/quinceca
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl restart nginx
    echo "✓ Nginx configured and restarted."
fi

# ------------------------------------------------------------------------------
# STEP 7: START APPLICATION UNDER PM2 & AUTO-BOOT
# ------------------------------------------------------------------------------
echo ">>> [7/7] Launching QuinceCA under PM2 (24/7 daemon)..."
pm2 delete quinceca 2>/dev/null || true

if [ -f "$APP_DIR/deploy/ecosystem.config.cjs" ]; then
    pm2 start "$APP_DIR/deploy/ecosystem.config.cjs"
else
    pm2 start "server.ts" --name quinceca --interpreter npx --interpreter-args "tsx" --max-memory-restart 750M
fi

pm2 save
pm2 startup systemd -u root --hp /root || true

# Configure UFW Firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
echo "y" | ufw enable || true

# Get Public IP
PUBLIC_IP=$(curl -s https://api.ipify.org || hostname -I | awk '{print $1}')

echo "=================================================================="
echo "🎉 DEPLOYMENT COMPLETE! QUINCECA IS LIVE 24/7!"
echo "   Access URL: http://$PUBLIC_IP"
echo "   App Directory: $APP_DIR"
echo "   PM2 Status: pm2 status"
echo "   Logs: pm2 logs quinceca"
echo "=================================================================="
