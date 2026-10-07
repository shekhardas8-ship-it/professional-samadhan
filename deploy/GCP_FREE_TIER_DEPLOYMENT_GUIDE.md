# QuinceCA — Google Cloud Platform (GCP) e2-micro + Google Drive Deployment Guide
## Complete Production Blueprint: 100% Free Tier ($0/Month) Setup with Real-Time Google Drive Sync

---

## 1. Architecture & Free Tier Specifications ($0.00 / month)

| Component | Specification | Free Tier Allowance | Monthly Cost |
| :--- | :--- | :--- | :--- |
| **Compute Engine (VM)** | `e2-micro` (2 vCPU burstable, 1 GB RAM) | 1 instance per month in `us-central1`, `us-east1`, or `us-west1` | **$0.00** |
| **Persistent Boot Disk** | 30 GB Standard Persistent Disk (`pd-standard`) | 30 GB/month free under GCP Always-Free | **$0.00** |
| **Cloud Document Storage** | Google Drive (Personal or Google Workspace) | 15 GB free included on every Google account | **$0.00** |
| **Database** | Neon Cloud Serverless PostgreSQL | Always-Free tier (0.5 GiB storage, auto-suspend, instant wake) | **$0.00** |
| **Runtime & Process** | Node.js 20 LTS + Python 3 (openpyxl/pypdf) + PM2 | Open Source / Local daemon | **$0.00** |
| **Web Server & SSL** | Nginx Reverse Proxy + Let's Encrypt Certbot | Free automated SSL certificates | **$0.00** |
| **Total Practice Cost** | **Full 24/7 CA Practice Management & Automation OS** | **Always Free** | **$0.00 / month** |

---

## 2. Low-Memory (1 GB RAM) Optimization Architecture

Running a modern Node.js 20 backend alongside Python on a 1 GB RAM VM can trigger the Linux Out-Of-Memory (OOM) killer without careful tuning. QuinceCA includes pre-configured optimizations:

1. **4 GB Virtual Swapfile (`/swapfile`)**:
   - Created with `sysctl vm.swappiness=10` and `vm.vfs_cache_pressure=50`.
   - Allows memory surges during Vite production compilation, PDF OCR parsing, and multi-sheet Excel generation without crashing.
2. **Node.js Heap Ceiling**:
   - `NODE_OPTIONS="--max-old-space-size=768"` prevents V8 garbage collection spikes from exceeding VM limits.
3. **PM2 Supervisor Guard**:
   - Configured in [`deploy/ecosystem.config.cjs`](file:///d:/MyProject/CA%20tools/deploy/ecosystem.config.cjs) with `max_memory_restart: '750M'`.
   - If memory ever spikes, PM2 restarts the process in milliseconds with zero downtime.
4. **Nginx Reverse Proxy & Static Asset Caching**:
   - Offloads static asset delivery, gzip compression, and TLS termination so Node.js only handles JSON APIs and WebSocket connections.

---

## 3. Step-by-Step Deployment (Fastest: via Google Cloud Shell)

### Step 3.1: Open Google Cloud Shell
Google Cloud Shell gives you a free Linux terminal in your browser with `gcloud`, `git`, and `python` pre-installed:
👉 **[https://shell.cloud.google.com](https://shell.cloud.google.com)**

### Step 3.2: Upload the Deployment Archive
1. In Cloud Shell, click the **Three Dots (⋮) menu** in the top-right corner -> Click **Upload**.
2. Select the file:
   [`quinceca-gcp-deploy.tar.gz`](file:///d:/MyProject/CA%20tools/quinceca-gcp-deploy.tar.gz) *(762 KB)*
3. Extract the archive into your Cloud Shell home directory:
   ```bash
   mkdir -p quinceca && tar -xzvf quinceca-gcp-deploy.tar.gz -C quinceca
   cd quinceca
   ```

### Step 3.3: Provision the Free-Tier e2-micro VM
Run the automated GCP provisioning script:
```bash
chmod +x deploy/provision_gcp_vm.sh
./deploy/provision_gcp_vm.sh
```
This script will:
- Enable `compute.googleapis.com` and `drive.googleapis.com`.
- Open firewall ports 80 (HTTP) and 443 (HTTPS).
- Create the `e2-micro` VM with a 30 GB standard disk in `us-central1-a` ($0/mo).
- Print the **External Public IP** of your new server.

### Step 3.4: SSH into the VM and Run Bootstrap
1. Connect to the newly created instance:
   ```bash
   gcloud compute ssh quinceca-free-vm --zone=us-central1-a
   ```
2. Upload or copy your code to the VM:
   *(From your Cloud Shell terminal)*:
   ```bash
   gcloud compute scp --recurse ~/quinceca quinceca-free-vm:~/quinceca --zone=us-central1-a
   ```
3. Inside the VM SSH session, run the automated bootstrap script:
   ```bash
   cd ~/quinceca
   sudo bash deploy/vm_bootstrap.sh
   ```
The bootstrap script automatically:
- Creates the 4 GB swapfile.
- Installs Node.js 20, Python 3, PM2, and Nginx.
- Installs all dependencies and builds the production frontend.
- Starts QuinceCA under PM2 with 24/7 auto-boot.
- Configures Nginx reverse proxy and firewall.

Your server is now live at: `http://<YOUR_EXTERNAL_IP>`!

---

## 4. Google Drive 15 GB Real-Time Sync Setup

QuinceCA has native Google Drive API integration built directly into [`src/services/googleDriveStorage.ts`](file:///d:/MyProject/CA%20tools/src/services/googleDriveStorage.ts). When active, client uploads, extracted invoices, and audit Excel files sync directly to Google Drive in real time.

### Step 4.1: Create a Service Account in GCP
1. In Google Cloud Console, navigate to **IAM & Admin** -> **Service Accounts**.
2. Click **Create Service Account**:
   - Name: `quinceca-drive-sync`
   - Role: **Viewer** (or leave empty)
   - Click **Done**.
3. Click on the created service account -> Go to the **Keys** tab -> Click **Add Key** -> **Create new key** -> Choose **JSON**.
4. Download the JSON key file. Rename it to `service-account.json`.

### Step 4.2: Create and Share your 15 GB Google Drive Folder
1. Open Google Drive ([https://drive.google.com](https://drive.google.com)) using any Google account.
2. Create a new folder named: **`QuinceCA Documents`**.
3. Right-click the folder -> Click **Share** -> **Share**.
4. Paste the Service Account email (e.g. `quinceca-drive-sync@<your-project-id>.iam.gserviceaccount.com`).
5. Set permission to **Editor** and uncheck "Notify people" -> Click **Share**.
6. Open the folder and copy the Folder ID from the URL:
   `https://drive.google.com/drive/folders/`**`1a2b3c4d5e6f7g8h9_ExampleFolderId`**

### Step 4.3: Configure the Environment File
On the server (or locally in your `.env` file):
1. Place `service-account.json` in `/var/www/quinceca/service-account.json`.
2. Add your Google Drive Folder ID to `/var/www/quinceca/.env`:
   ```env
   GOOGLE_DRIVE_FOLDER_ID="1a2b3c4d5e6f7g8h9_ExampleFolderId"
   ```
3. Test connectivity:
   ```bash
   npx tsx scripts/test_google_drive.ts
   ```
   Output:
   ```
   ✓ Found service-account.json in root
   ✓ Connected as: quinceca-drive-sync@...
   ✓ Google Drive Storage Quota: 0.12 GB used / 15.00 GB limit
   ✓ Target Folder Found: "QuinceCA Documents"
   ✓ Test file created successfully
   🎉 ALL TESTS PASSED! Google Drive real-time sync is 100% OPERATIONAL!
   ```
4. Restart PM2 to activate Drive sync:
   ```bash
   pm2 restart quinceca
   ```

---

## 5. Domain Name & Free HTTPS (SSL) Setup

To connect your custom domain (e.g. `app.yourfirm.com` or `app.quinceca.com`) with automated SSL:

1. In your DNS provider (Cloudflare, GoDaddy, Namecheap), add an **A Record**:
   - **Type**: `A`
   - **Name**: `app` (or `@`)
   - **Value**: `<YOUR_EXTERNAL_IP>`
2. Edit `/etc/nginx/sites-available/quinceca` on the server:
   ```nginx
   server_name app.yourfirm.com;
   ```
3. Test and reload Nginx:
   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```
4. Obtain a free Let's Encrypt SSL certificate in one command:
   ```bash
   sudo certbot --nginx -d app.yourfirm.com
   ```
Certbot will automatically install the certificate, configure HTTP -> HTTPS redirect, and set up automatic renewal!

---

## 6. Daily Operations, Maintenance & Monitoring

| Task | Command |
| :--- | :--- |
| **Check App Status** | `pm2 status` |
| **View Live Real-Time Logs** | `pm2 logs quinceca --lines 100` |
| **Restart Application** | `pm2 restart quinceca` |
| **Check Memory & Swap Usage** | `free -h` |
| **Check Disk Space (30 GB limit)** | `df -h /` |
| **Test Google Drive Storage** | `npx tsx scripts/test_google_drive.ts` |
| **Verify Nginx Status** | `sudo systemctl status nginx` |

---

## 7. Zero Cost Safeguards Checklist

To guarantee $0.00/month billing on Google Cloud:
- [x] **Instance Type**: Must be `e2-micro` (not e2-small, e2-medium).
- [x] **Region**: Must be in `us-central1` (Iowa), `us-east1` (S. Carolina), or `us-west1` (Oregon).
- [x] **Disk**: Standard Persistent Disk (`pd-standard`) up to 30 GB (do not choose Balanced SSD or SSD).
- [x] **Egress**: Within 1 GB free internet egress/month (static files cached by Nginx/Cloudflare, heavy document downloads offloaded to Google Drive).
- [x] **Drive Storage**: Stored inside Google Drive (15 GB free tier).
