# Professional Samadhan - GST Document Collection & Review Application
## Complete Beginner-Friendly Installation, Architecture & Operations Manual

---

### 1. System Overview & Architecture

"Professional Samadhan" is a production-grade Chartered Accountant (CA) firm document collection, OCR extraction, reconciliation, and client confirmation platform.

```
+---------------------------------------------------------------------------------------------------------+
|                                    PROFESSIONAL SAMADHAN ARCHITECTURE                                   |
+---------------------------------------------------------------------------------------------------------+
|                                                                                                         |
|   +--------------------------+    +---------------------------+    +--------------------------------+   |
|   |   CA ADMIN DASHBOARD     |    |   STAFF WORKSPACE         |    |   RESTRICTED CLIENT PORTAL     |   |
|   |   - All active clients   |    |   - Assigned clients only |    |   - Scoped secure upload token |   |
|   |   - Statutory approval   |    |   - Side-by-side review   |    |   - Multi-business switcher    |   |
|   |   - Schedule & overrides |    |   - Line-item adjustments |    |   - Checklist & declarations   |   |
|   +------------+-------------+    +-------------+-------------+    +---------------+----------------+   |
|                |                                |                                  |                    |
|                +--------------------------------+----------------------------------+                    |
|                                                 |                                                       |
|                                         [ Express REST API ]                                            |
|                                                 |                                                       |
|                        +------------------------+-----------------------+                               |
|                        |                                                |                               |
|            [ PostgreSQL / Cloud SQL ]                         [ Local File Storage ]                    |
|            (Drizzle ORM Source of Truth)                      (/local_storage/uploads)                  |
|            - clients & users                                  (/local_storage/workbooks)                |
|            - monthly_requests & tokens                                  |                               |
|            - extracted_documents                                        v                               |
|            - line items & bank txns                   [ Extraction & OCR Engine ]                       |
|            - validation_exceptions                    - Native PDF parser (pdfplumber/text)             |
|            - versioned workbooks                      - Local PaddleOCR (scanned bills)                 |
|            - audit notifications                      - Spreadsheet parser (CSV/XLSX)                   |
|                        |                                                |                               |
|                        +------------------------+-----------------------+                               |
|                                                 |                                                       |
|                     +---------------------------+---------------------------+                           |
|                     |                                                       |                           |
|           [ ExcelJS 10-Sheet Generator ]                         [ WhatsApp Orchestration ]             |
|           - Frozen headers & totals                              - Mode A: Manual click-to-send         |
|           - Formula injection protection                         - Mode B: Meta Cloud API               |
|           - Versioned snapshots (v1, v2)                         - n8n Community Edition Cron           |
|                                                                                                         |
+---------------------------------------------------------------------------------------------------------+
```

---

### 2. Free vs. Paid Components Breakdown

| Component | Technology | Cost / License | Notes |
| :--- | :--- | :--- | :--- |
| **Frontend & API Backend** | Vite + React + Express + TypeScript | **100% Free** (MIT) | Self-hosted or Cloud Run |
| **Primary Relational Database** | PostgreSQL via Drizzle ORM | **Free tier available** | Cloud SQL Developer Edition / Self-hosted PG |
| **Document OCR Engine** | Local PaddleOCR + Native PDF | **100% Free** (Apache 2.0) | Runs on-premise without cloud API costs |
| **Excel Workbook Generation** | ExcelJS / openpyxl | **100% Free** (MIT) | Full multi-sheet formatting & formula defense |
| **Workflow Orchestration** | n8n Community Edition | **100% Free** (Fair-code) | Self-hosted docker container |
| **WhatsApp Mode A (Manual)** | Direct `wa.me` deep links | **100% Free** | Staff clicks and sends via WhatsApp Web |
| **WhatsApp Mode B (Automated)** | Meta WhatsApp Cloud API | **Optional Paid** | Meta charges per 24-hr utility conversation (~$0.004/msg) |
| **Paid AI APIs (e.g. GPT-4/Vision)**| Cloud LLM endpoints | **Disabled by default** | Zero vendor lock-in |

---

### 3. Step-by-Step Installation for Beginners

#### Step 3.1: Prerequisites
- **Node.js**: Version 20.x or higher
- **PostgreSQL**: PostgreSQL 15+ (or Cloud SQL instance)
- **Python**: Version 3.10+ (for local PaddleOCR scripts)

#### Step 3.2: Clone & Install Dependencies
```bash
git clone <repository_url>
cd professional-samadhan-gst
npm install
```

#### Step 3.3: Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your database parameters (`SQL_HOST`, `SQL_DB_NAME`, `SQL_USER`, `SQL_PASSWORD`) are populated.

#### Step 3.4: Apply Database Schema & Run Migrations
Run Drizzle schema push or execute the migration tool:
```bash
npm run dev
```
The server will automatically detect the database and seed initial test clients, users, and August 2026 requests if empty.

---

### 4. Backup & Restore Procedures

#### Database Backup (PostgreSQL)
Run `pg_dump` to create an encrypted, compressed snapshot:
```bash
# Export schema and data
pg_dump -h $SQL_HOST -U $SQL_USER -d $SQL_DB_NAME -F c -b -v -f "/backup/ps_gst_backup_$(date +%Y%m%d_%H%M%S).dump"
```

#### File Storage Backup (Original Uploads & Excel Workbooks)
Archive the local storage directory with checksums:
```bash
tar -czvf "/backup/ps_filestore_$(date +%Y%m%d_%H%M%S).tar.gz" ./local_storage/
```

#### Database Restore
```bash
# Restore PostgreSQL dump
pg_restore -h $SQL_HOST -U $SQL_USER -d $SQL_DB_NAME -v "/backup/ps_gst_backup_20260927.dump"
```

---

### 5. WhatsApp Integration Configuration

#### Mode A: Manual Mode (Default & Zero Cost)
1. In the CA Dashboard or Client Detail view, click **"Prepare WhatsApp Request"** or **"Send Reminder"**.
2. The system formats the message with client name, reporting month, pending documents, and secure upload link.
3. Click **"Open in WhatsApp Web"**. A prefilled chat opens directly with the client's registered phone. Staff clicks Send.
4. The system logs the audit record as `prepared` / `whatsapp_manual`.

#### Mode B: Automated Meta WhatsApp Business Cloud API
1. Create a Meta Developer account at [developers.facebook.com](https://developers.facebook.com).
2. Create a WhatsApp Business App and obtain:
   - `META_WHATSAPP_TOKEN`: Permanent System User Access Token
   - `META_PHONE_NUMBER_ID`: WhatsApp Registered Phone ID
   - `META_WEBHOOK_VERIFY_TOKEN`: Verification token matching `.env`
3. Add the Webhook URL in Meta Developer Dashboard:
   `https://<your-app-domain>/api/whatsapp/webhook`
4. Subscribe to the `messages` event.
5. In `.env`, populate `META_WHATSAPP_TOKEN` and `META_PHONE_NUMBER_ID`. The application will automatically switch to automated dispatch!

---

### 6. Test Scenarios & Verification Matrix

| Test Scenario | Test Steps | Expected Result |
| :--- | :--- | :--- |
| **1. Client Isolation** | Staff logs in with assigned clients; queries `/api/clients`. | Only assigned clients appear. Database foreign keys enforce tenant isolation. |
| **2. Duplicate Detection** | Upload the same file twice to the same monthly request. | SHA-256 match flags second file as `duplicate_flagged` and creates a warning exception. No silent overwrite. |
| **3. Missing Documents** | Create request; client uploads only sales invoice. | Validation engine marks `bank_statements` and `purchase_invoices` missing. Automated reminder lists pending items. |
| **4. Multi-Page & Split PDF** | Upload a multi-invoice PDF. | Extractor generates separate `extracted_documents` units linked to respective page numbers. |
| **5. Unreadable Scans / Password** | Upload password-protected PDF. | File flagged as `password_protected` with critical exception prompting usable copy. |
| **6. Year Rollover** | Trigger request on 1 January 2027. | System automatically calculates previous month as "December 2026" with year 2026 and month 12. |
| **7. Repeated Webhooks** | Meta sends duplicate webhook payload. | Webhook deduplication using message ID ensures duplicate entries are rejected. |
| **8. Re-approval after Correction** | Client requests corrections on v1; staff adjusts line item and regenerates. | Version increments to v2. Previous v1 preserved in audit table. Fresh client confirmation required. |
