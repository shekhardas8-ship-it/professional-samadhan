# deploy/provision_gcp_vm.ps1
# Windows PowerShell Native Provisioner for GCP Free Tier e2-micro

$ErrorActionPreference = "Stop"

$InstanceName = "quinceca-free-vm"
$Zone = "us-central1-a"
$Region = "us-central1"
$DiskSize = "30GB"
$MachineType = "e2-micro"

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "    QUINCECA - GCP FREE TIER (e2-micro) POWERSHELL DEPLOYER     " -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

# 1. Check if gcloud is installed
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "`n[!] gcloud CLI is not found on your Windows PC." -ForegroundColor Yellow
    Write-Host "You have two easy choices:" -ForegroundColor White
    Write-Host "  Option 1 (Fastest / Zero Install): Use Google Cloud Shell in your browser:" -ForegroundColor Green
    Write-Host "    👉 https://shell.cloud.google.com" -ForegroundColor Cyan
    Write-Host "    (Cloud Shell already has gcloud, git, python pre-installed and authenticated!)`n" -ForegroundColor Gray
    Write-Host "  Option 2: Install Google Cloud SDK on this Windows PC right now via winget:" -ForegroundColor Green
    Write-Host "    winget install Google.CloudSDK --silent`n" -ForegroundColor Cyan
    
    $installChoice = Read-Host "Would you like to install gcloud on this PC now? (y/N)"
    if ($installChoice -match '^[Yy]') {
        Write-Host "Installing Google Cloud SDK via winget... Please wait..." -ForegroundColor Cyan
        winget install Google.CloudSDK --accept-package-agreements --accept-source-agreements
        Write-Host "`nInstallation finished! Please restart PowerShell and run 'gcloud auth login' and this script again." -ForegroundColor Green
        return
    } else {
        Write-Host "Exiting. Please use Google Cloud Shell at https://shell.cloud.google.com" -ForegroundColor Yellow
        return
    }
}

# 2. Get active GCP project
$ProjectId = gcloud config get-value project 2>$null
if (-not $ProjectId -or $ProjectId -eq "(unset)") {
    $ProjectId = Read-Host "Enter your Google Cloud Project ID"
    gcloud config set project $ProjectId
}

Write-Host "`n✓ Using GCP Project: $ProjectId" -ForegroundColor Green

# 3. Enable APIs
Write-Host "Enabling Compute Engine & Google Drive APIs..." -ForegroundColor Cyan
gcloud services enable compute.googleapis.com drive.googleapis.com --project=$ProjectId

# 4. Firewall Rule
Write-Host "Configuring firewall rules for HTTP/HTTPS..." -ForegroundColor Cyan
$existingFw = gcloud compute firewall-rules list --filter="name=allow-http-https" --format="value(name)" --project=$ProjectId 2>$null
if (-not $existingFw) {
    gcloud compute firewall-rules create allow-http-https `
        --project=$ProjectId `
        --direction=INGRESS `
        --priority=1000 `
        --network=default `
        --action=ALLOW `
        --rules=tcp:80,tcp:443,tcp:3000 `
        --source-ranges=0.0.0.0/0 `
        --target-tags=http-server,https-server `
        --description="Allow incoming HTTP/HTTPS traffic to QuinceCA"
    Write-Host "✓ Firewall rule allow-http-https created." -ForegroundColor Green
} else {
    Write-Host "✓ Firewall rule allow-http-https already exists." -ForegroundColor Green
}

# 5. Create Free Tier e2-micro VM
$existingVm = gcloud compute instances list --filter="name=$InstanceName AND zone:$Zone" --format="value(name)" --project=$ProjectId 2>$null
if (-not $existingVm) {
    Write-Host "Creating Free-Tier e2-micro instance '$InstanceName' in $Zone..." -ForegroundColor Cyan
    gcloud compute instances create $InstanceName `
        --project=$ProjectId `
        --zone=$Zone `
        --machine-type=$MachineType `
        --image-family="ubuntu-2404-lts-amd64" `
        --image-project="ubuntu-os-cloud" `
        --boot-disk-size=$DiskSize `
        --boot-disk-type="pd-standard" `
        --boot-disk-device-name=$InstanceName `
        --tags="http-server,https-server" `
        --metadata="enable-oslogin=TRUE" `
        --description="QuinceCA Free Tier Production Server"
    Write-Host "✓ VM Instance '$InstanceName' created successfully!" -ForegroundColor Green
} else {
    Write-Host "✓ VM Instance '$InstanceName' already exists." -ForegroundColor Green
}

# 6. Retrieve External IP
$ExternalIp = (gcloud compute instances describe $InstanceName --zone=$Zone --project=$ProjectId --format='get(networkInterfaces[0].accessConfigs[0].natIP)').Trim()

Write-Host "`n==================================================================" -ForegroundColor Green
Write-Host "🎉 SUCCESS: QuinceCA e2-micro VM is LIVE!" -ForegroundColor Green
Write-Host "   External IP: http://$ExternalIp" -ForegroundColor Yellow
Write-Host "   SSH Command: gcloud compute ssh $InstanceName --zone=$Zone" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Green
