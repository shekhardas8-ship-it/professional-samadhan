# Remote sync script to execute on GCP VM
$sshKey = "$env:USERPROFILE\.ssh\id_quinceca"
$vmUser = "quinceca"
$vmIp = "34.60.10.149"

$remoteCommands = @"
sudo bash -c '
set -e
cd /var/www/quinceca
git config --global --add safe.directory /var/www/quinceca
if [ ! -d .git ]; then
    git init
fi
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/shekhardas8-ship-it/professional-samadhan.git
echo "Fetching latest main from GitHub..."
git fetch origin main
echo "Resetting code to latest commit..."
git reset --hard origin/main

# Restore sensitive files if missing
if [ ! -f .env ] && [ -f /root/quinceca_backup/.env ]; then
    cp /root/quinceca_backup/.env .env
fi
if [ ! -f service-account.json ] && [ -f /root/quinceca_backup/service-account.json ]; then
    cp /root/quinceca_backup/service-account.json service-account.json
fi

echo "Installing any dependencies..."
export NODE_OPTIONS="--max-old-space-size=768"
npm install --legacy-peer-deps --no-audit

echo "Building production bundle..."
npm run build

echo "Restarting PM2 quinceca process..."
pm2 restart quinceca

echo "Checking status..."
pm2 status quinceca
'
"@

$remoteCommands | ssh -i $sshKey -o StrictHostKeyChecking=no "$vmUser@$vmIp" "bash -s"
