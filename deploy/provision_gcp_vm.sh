#!/usr/bin/env bash
# ==============================================================================
# QuinceCA - Google Cloud Platform (GCP) Free Tier e2-micro VM Provisioner
# 100% Eligible for GCP Always-Free Tier ($0/month)
# Specs:
#   - VM: e2-micro (2 vCPU, 1 GB RAM)
#   - Region: us-central1 (Iowa)
#   - Disk: 30 GB Standard Persistent Disk (pd-standard)
#   - Cost: $0.00 / month
# ==============================================================================

set -euo pipefail

INSTANCE_NAME="quinceca-free-vm"
ZONE="us-central1-a"
REGION="us-central1"
DISK_SIZE="30GB"
MACHINE_TYPE="e2-micro"

echo "=================================================================="
echo "    QUINCECA - GCP FREE TIER (e2-micro + Google Drive) DEPLOY    "
echo "=================================================================="

# 1. Verify gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI not found."
    echo "Please run this command inside Google Cloud Shell:"
    echo "  👉 https://shell.cloud.google.com"
    exit 1
fi

# 2. Verify or select GCP project
PROJECT_ID=$(gcloud config get-value project 2>/dev/null || true)
if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "(unset)" ]; then
    echo "Scanning available projects in your Google Cloud account..."
    PROJECTS=$(gcloud projects list --format="value(projectId)" 2>/dev/null || true)
    COUNT=$(echo "$PROJECTS" | grep -v '^$' | wc -l || echo "0")

    if [ "$COUNT" -eq 1 ]; then
        PROJECT_ID=$(echo "$PROJECTS" | tr -d '[:space:]')
        echo "✓ Auto-selected active project: $PROJECT_ID"
        gcloud config set project "$PROJECT_ID"
    elif [ "$COUNT" -gt 1 ]; then
        echo ""
        echo "Available Projects:"
        gcloud projects list --format="table(projectId, name)"
        echo ""
        echo "Please type or paste one of the Project IDs from the table above:"
        read -r PROJECT_ID
        PROJECT_ID=$(echo "$PROJECT_ID" | tr -d '[:space:]')
        gcloud config set project "$PROJECT_ID"
    else
        echo "No existing project detected. Creating new project 'quinceca-app-$RANDOM'..."
        PROJECT_ID="quinceca-app-$RANDOM"
        gcloud projects create "$PROJECT_ID" --name="QuinceCA"
        gcloud config set project "$PROJECT_ID"
        echo "✓ Created and selected new project: $PROJECT_ID"
    fi
fi

echo "✓ Using GCP Project: $PROJECT_ID"

# 3. Enable necessary Google Cloud APIs
echo "Enabling Compute Engine and Google Drive APIs..."
gcloud services enable compute.googleapis.com drive.googleapis.com --project="$PROJECT_ID"

# 4. Create Firewall Rules for Web Access (Port 80 and 443)
echo "Configuring firewall rules for HTTP and HTTPS..."
if ! gcloud compute firewall-rules describe allow-http-https --project="$PROJECT_ID" &>/dev/null; then
    gcloud compute firewall-rules create allow-http-https \
        --project="$PROJECT_ID" \
        --direction=INGRESS \
        --priority=1000 \
        --network=default \
        --action=ALLOW \
        --rules=tcp:80,tcp:443,tcp:3000 \
        --source-ranges=0.0.0.0/0 \
        --target-tags=http-server,https-server \
        --description="Allow incoming HTTP/HTTPS traffic to QuinceCA"
    echo "✓ Firewall rule allow-http-https created."
else
    echo "✓ Firewall rule allow-http-https already exists."
fi

# 5. Check if instance already exists
if gcloud compute instances describe "$INSTANCE_NAME" --zone="$ZONE" --project="$PROJECT_ID" &>/dev/null; then
    echo "⚠️ Instance '$INSTANCE_NAME' already exists in $ZONE."
else
    echo "Creating Free-Tier e2-micro instance '$INSTANCE_NAME' in $ZONE..."
    gcloud compute instances create "$INSTANCE_NAME" \
        --project="$PROJECT_ID" \
        --zone="$ZONE" \
        --machine-type="$MACHINE_TYPE" \
        --image-family="ubuntu-2404-lts-amd64" \
        --image-project="ubuntu-os-cloud" \
        --boot-disk-size="$DISK_SIZE" \
        --boot-disk-type="pd-standard" \
        --boot-disk-device-name="$INSTANCE_NAME" \
        --tags="http-server,https-server" \
        --metadata=enable-oslogin=TRUE \
        --description="QuinceCA CA Practice Management Free Tier Server"

    echo "✓ Instance '$INSTANCE_NAME' created successfully!"
fi

# 6. Retrieve External Public IP
EXTERNAL_IP=$(gcloud compute instances describe "$INSTANCE_NAME" \
    --zone="$ZONE" \
    --project="$PROJECT_ID" \
    --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo "=================================================================="
echo "🎉 SUCCESS: QuinceCA e2-micro VM is LIVE!"
echo "   External Public IP: http://$EXTERNAL_IP"
echo "   SSH Command: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE"
echo "=================================================================="
echo ""
echo "Next Step: Connect to the VM and run the bootstrap script:"
echo "  1. SSH into the VM:"
echo "     gcloud compute ssh $INSTANCE_NAME --zone=$ZONE"
echo "  2. Run the one-line setup command:"
echo "     curl -sSL https://raw.githubusercontent.com/.../deploy/vm_bootstrap.sh | sudo bash"
echo "=================================================================="
