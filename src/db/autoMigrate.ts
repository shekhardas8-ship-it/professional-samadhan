// src/db/autoMigrate.ts
import { createPool } from './index.ts';

export async function ensureTablesExist() {
  const pool = createPool();
  if (!pool) return;

  const ddl = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      display_name TEXT,
      role TEXT NOT NULL DEFAULT 'staff',
      phone TEXT,
      active BOOLEAN NOT NULL DEFAULT true,
      assigned_client_ids JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      business_name TEXT NOT NULL,
      contact_person TEXT NOT NULL,
      gstin TEXT NOT NULL,
      cin TEXT,
      address TEXT,
      registered_phone TEXT NOT NULL,
      email TEXT NOT NULL,
      assigned_staff_id TEXT,
      assigned_staff_name TEXT,
      active BOOLEAN NOT NULL DEFAULT true,
      directors JSONB DEFAULT '[]'::jsonb,
      attached_documents JSONB DEFAULT '[]'::jsonb,
      required_checklist JSONB DEFAULT '["sales_invoices","purchase_invoices","bank_statements","debit_credit_notes"]'::jsonb,
      expected_bank_accounts JSONB DEFAULT '[]'::jsonb,
      whatsapp_consent BOOLEAN NOT NULL DEFAULT true,
      whatsapp_consent_date TIMESTAMP DEFAULT NOW(),
      reminder_cadence_days INTEGER NOT NULL DEFAULT 3,
      max_reminders INTEGER NOT NULL DEFAULT 3,
      reminders_paused BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    ALTER TABLE clients ADD COLUMN IF NOT EXISTS cin TEXT;
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS address TEXT;
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS directors JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS attached_documents JSONB DEFAULT '[]'::jsonb;

    CREATE TABLE IF NOT EXISTS adhoc_requests (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id),
      client_name TEXT NOT NULL,
      client_gstin TEXT,
      service_category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'Pending',
      priority TEXT NOT NULL DEFAULT 'High',
      assigned_staff_name TEXT,
      assigned_staff_id TEXT,
      fee_quote NUMERIC(12, 2) DEFAULT 5000.00,
      target_deadline TEXT,
      completed_date TEXT,
      deliverable_file TEXT,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS compliance_calendar (
      id TEXT PRIMARY KEY,
      due_date TEXT NOT NULL,
      display_date TEXT NOT NULL,
      event_title TEXT NOT NULL,
      category TEXT NOT NULL,
      applicable_to TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Upcoming',
      description TEXT,
      penalty_info TEXT,
      is_auto_generated BOOLEAN NOT NULL DEFAULT true,
      affected_clients_count INTEGER DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS billing_invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT NOT NULL UNIQUE,
      client_id TEXT NOT NULL REFERENCES clients(id),
      client_name TEXT NOT NULL,
      service_description TEXT NOT NULL,
      service_category TEXT NOT NULL,
      period TEXT,
      professional_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
      gst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
      total_payable NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
      invoice_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      payment_mode TEXT,
      receipt_number TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS monthly_requests (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id),
      reporting_month TEXT NOT NULL,
      year INTEGER NOT NULL,
      month_number INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'Requested',
      secure_upload_token TEXT NOT NULL,
      token_expires_at TIMESTAMP NOT NULL,
      requested_at TIMESTAMP DEFAULT NOW(),
      reminder_count INTEGER NOT NULL DEFAULT 0,
      last_reminder_at TIMESTAMP,
      next_reminder_at TIMESTAMP,
      reminders_paused BOOLEAN NOT NULL DEFAULT false,
      no_transactions_declared BOOLEAN NOT NULL DEFAULT false,
      declaration_notes TEXT,
      declared_at TIMESTAMP,
      declared_by TEXT,
      ca_reviewed_declaration BOOLEAN NOT NULL DEFAULT false,
      category_declarations JSONB DEFAULT '{}'::jsonb,
      total_files_received INTEGER NOT NULL DEFAULT 0,
      total_invoices_extracted INTEGER NOT NULL DEFAULT 0,
      unresolved_exceptions_count INTEGER NOT NULL DEFAULT 0,
      active_workbook_version INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS document_files (
      id TEXT PRIMARY KEY,
      monthly_request_id TEXT NOT NULL REFERENCES monthly_requests(id),
      original_filename TEXT NOT NULL,
      stored_filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      google_drive_file_id TEXT,
      file_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      file_hash_sha256 TEXT NOT NULL,
      received_time TIMESTAMP NOT NULL DEFAULT NOW(),
      channel TEXT NOT NULL DEFAULT 'client_portal',
      target_category TEXT DEFAULT 'auto',
      detected_doc_type TEXT,
      ocr_status TEXT NOT NULL DEFAULT 'pending',
      is_password_protected BOOLEAN NOT NULL DEFAULT false,
      password_hint TEXT,
      resolved_password TEXT,
      ocr_error_message TEXT,
      processed_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS extracted_documents (
      id TEXT PRIMARY KEY,
      monthly_request_id TEXT NOT NULL REFERENCES monthly_requests(id),
      document_file_id TEXT REFERENCES document_files(id),
      doc_type TEXT NOT NULL,
      doc_number TEXT,
      doc_date TEXT,
      supplier_name TEXT,
      supplier_gstin TEXT,
      supplier_address TEXT,
      buyer_name TEXT,
      buyer_gstin TEXT,
      buyer_address TEXT,
      place_of_supply TEXT,
      taxable_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
      cgst_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
      sgst_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
      igst_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
      cess_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
      round_off NUMERIC(15, 2) NOT NULL DEFAULT 0,
      total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
      reverse_charge BOOLEAN NOT NULL DEFAULT false,
      raw_text TEXT,
      scan_method TEXT DEFAULT 'pdf_parse',
      extraction_confidence NUMERIC(5, 2) DEFAULT 0.95,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS extracted_line_items (
      id TEXT PRIMARY KEY,
      extracted_document_id TEXT NOT NULL REFERENCES extracted_documents(id) ON DELETE CASCADE,
      item_description TEXT NOT NULL,
      hsn_sac TEXT,
      quantity NUMERIC(12, 3),
      unit TEXT,
      rate NUMERIC(15, 2),
      discount NUMERIC(15, 2) DEFAULT 0,
      taxable_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
      tax_rate_percent NUMERIC(5, 2),
      cgst_amount NUMERIC(15, 2) DEFAULT 0,
      sgst_amount NUMERIC(15, 2) DEFAULT 0,
      igst_amount NUMERIC(15, 2) DEFAULT 0,
      cess_amount NUMERIC(15, 2) DEFAULT 0,
      total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS bank_transactions (
      id TEXT PRIMARY KEY,
      monthly_request_id TEXT NOT NULL REFERENCES monthly_requests(id),
      document_file_id TEXT REFERENCES document_files(id),
      bank_name TEXT NOT NULL,
      account_number TEXT NOT NULL,
      transaction_date TEXT NOT NULL,
      value_date TEXT,
      narration TEXT NOT NULL,
      reference_number TEXT,
      debit_amount NUMERIC(15, 2) DEFAULT 0,
      credit_amount NUMERIC(15, 2) DEFAULT 0,
      balance NUMERIC(15, 2),
      suggested_category TEXT,
      gst_relevant BOOLEAN DEFAULT false,
      matched_invoice_number TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS validation_exceptions (
      id TEXT PRIMARY KEY,
      monthly_request_id TEXT NOT NULL REFERENCES monthly_requests(id),
      extracted_document_id TEXT REFERENCES extracted_documents(id),
      rule_id TEXT NOT NULL,
      severity TEXT NOT NULL,
      description TEXT NOT NULL,
      affected_fields JSONB DEFAULT '[]'::jsonb,
      suggested_action TEXT,
      resolution_status TEXT NOT NULL DEFAULT 'open',
      resolved_by TEXT,
      resolved_at TIMESTAMP,
      resolution_notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS generated_workbooks (
      id TEXT PRIMARY KEY,
      monthly_request_id TEXT NOT NULL REFERENCES monthly_requests(id),
      version INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      google_drive_file_id TEXT,
      size_bytes INTEGER NOT NULL,
      summary_stats JSONB DEFAULT '{}'::jsonb,
      sheet_names JSONB DEFAULT '[]'::jsonb,
      status TEXT NOT NULL DEFAULT 'Draft',
      client_confirmation_status TEXT NOT NULL DEFAULT 'Pending',
      client_signed_off_by TEXT,
      client_signed_off_at TIMESTAMP,
      client_feedback_notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS audit_notifications (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id),
      monthly_request_id TEXT REFERENCES monthly_requests(id),
      notification_type TEXT NOT NULL,
      channel TEXT NOT NULL DEFAULT 'whatsapp',
      recipient_phone TEXT NOT NULL,
      message_body TEXT NOT NULL,
      meta_message_id TEXT,
      delivery_status TEXT NOT NULL DEFAULT 'simulated',
      status_updated_at TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS govt_filings (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      client_name TEXT NOT NULL,
      identifier TEXT NOT NULL,
      return_type TEXT NOT NULL,
      financial_year TEXT NOT NULL,
      return_period TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'JSON Generated',
      arn_number TEXT,
      filing_date TEXT,
      filed_by TEXT,
      total_taxable_value NUMERIC(15, 2) DEFAULT 0,
      total_tax_liability NUMERIC(15, 2) DEFAULT 0,
      total_itc_claimed NUMERIC(15, 2) DEFAULT 0,
      json_file_name TEXT,
      json_payload JSONB DEFAULT '{}'::jsonb,
      drive_file_id TEXT,
      drive_web_view_link TEXT,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    ALTER TABLE govt_filings DROP CONSTRAINT IF EXISTS govt_filings_client_id_clients_id_fk;
    ALTER TABLE govt_filings DROP CONSTRAINT IF EXISTS govt_filings_client_id_fkey;
  `;

  try {
    await pool.query(ddl);
    console.log('[AutoMigrate] PostgreSQL tables verified/created successfully.');
  } catch (err: any) {
    console.error('[AutoMigrate] Error initializing tables:', err.message);
  }
}
