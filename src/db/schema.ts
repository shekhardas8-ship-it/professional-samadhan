// src/db/schema.ts
import { relations } from 'drizzle-orm';
import { boolean, integer, jsonb, numeric, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

// 1. App Users (Staff, CA Admins, Clients)
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Firebase Auth UID or system ID
  email: text('email').notNull(),
  displayName: text('display_name'),
  role: text('role').notNull().default('staff'), // 'ca_admin' | 'staff' | 'client'
  phone: text('phone'),
  active: boolean('active').notNull().default(true),
  designation: text('designation'),
  status: text('status').default('active'),
  assignedClientIds: jsonb('assigned_client_ids').$type<string[]>().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Clients
export const clients = pgTable('clients', {
  id: text('id').primaryKey(),
  businessName: text('business_name').notNull(),
  contactPerson: text('contact_person').notNull(),
  gstin: text('gstin').notNull(),
  cin: text('cin'),
  address: text('address'),
  registeredPhone: text('registered_phone').notNull(), // WhatsApp number with country code
  email: text('email').notNull(),
  assignedStaffId: text('assigned_staff_id'),
  assignedStaffName: text('assigned_staff_name'),
  active: boolean('active').notNull().default(true),
  // Director KYC lists
  directors: jsonb('directors').$type<Array<{
    id: string;
    name: string;
    din?: string;
    phone?: string;
    email?: string;
    aadharNumber?: string;
    panNumber?: string;
    bankDetails?: string;
    aadharUploaded?: boolean;
    panUploaded?: boolean;
    bankDocUploaded?: boolean;
    dinDocUploaded?: boolean;
    aadharDocFileName?: string;
    aadharDocUrl?: string;
    panDocFileName?: string;
    panDocUrl?: string;
    bankDocFileName?: string;
    bankDocUrl?: string;
    dinDocFileName?: string;
    dinDocUrl?: string;
  }>>().default([]),
  // 13 Attached Documents
  attachedDocuments: jsonb('attached_documents').$type<Array<{
    id: string;
    docKey: string;
    docName: string;
    categoryNumber: number;
    fileName?: string;
    fileSize?: string;
    uploadedAt?: string;
    status: 'uploaded' | 'pending' | 'verified';
    expiryDate?: string;
    notes?: string;
    fileUrl?: string;
    fileId?: string;
  }>>().default([]),
  // Document checklist configuration
  requiredChecklist: jsonb('required_checklist').$type<string[]>().default([
    'sales_invoices',
    'purchase_invoices',
    'bank_statements',
    'debit_credit_notes',
  ]),
  // Expected bank accounts
  expectedBankAccounts: jsonb('expected_bank_accounts').$type<Array<{
    bankName: string;
    accountNumber: string;
    ifsc?: string;
    accountType?: string;
  }>>().default([]),
  // WhatsApp & reminder preferences
  whatsappConsent: boolean('whatsapp_consent').notNull().default(true),
  whatsappConsentDate: timestamp('whatsapp_consent_date').defaultNow(),
  reminderCadenceDays: integer('reminder_cadence_days').notNull().default(3),
  maxReminders: integer('max_reminders').notNull().default(3),
  remindersPaused: boolean('reminders_paused').notNull().default(false),
  googleDriveFolderId: text('google_drive_folder_id'),
  googleDriveUrl: text('google_drive_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2b. Adhoc Service Requests
export const adhocRequests = pgTable('adhoc_requests', {
  id: text('id').primaryKey(),
  clientId: text('client_id').notNull().references(() => clients.id),
  clientName: text('client_name').notNull(),
  clientGstin: text('client_gstin'),
  serviceCategory: text('service_category').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('Pending'), // 'Pending' | 'In Progress' | 'Review' | 'Completed' | 'Delivered'
  priority: text('priority').notNull().default('High'), // 'High' | 'Medium' | 'Low'
  assignedStaffName: text('assigned_staff_name'),
  assignedStaffId: text('assigned_staff_id'),
  feeQuote: numeric('fee_quote', { precision: 12, scale: 2 }).default('5000.00'),
  targetDeadline: text('target_deadline'),
  completedDate: text('completed_date'),
  deliverableFile: text('deliverable_file'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2c. Statutory Compliance Calendar
export const complianceCalendar = pgTable('compliance_calendar', {
  id: text('id').primaryKey(),
  dueDate: text('due_date').notNull(), // '2026-10-05'
  displayDate: text('display_date').notNull(), // '5 Oct'
  eventTitle: text('event_title').notNull(), // 'GSTR-1 filing'
  category: text('category').notNull(), // 'GST' | 'TDS' | 'Income Tax' | 'ROC' | 'Audit' | 'EPFO' | 'ESIC' | 'Labour' | 'RBI' | 'DPIIT' | 'DGFT' | 'CBIC' | 'IP India'
  portalName: text('portal_name'),
  portalDomain: text('portal_domain'),
  portalUrl: text('portal_url'),
  formNumber: text('form_number'),
  actLaw: text('act_law'),
  frequency: text('frequency'),
  applicableTo: text('applicable_to').notNull(),
  status: text('status').notNull().default('Upcoming'), // 'Upcoming' | 'Urgent' | 'Action Required' | 'Completed' | 'Overdue'
  description: text('description'),
  penaltyInfo: text('penalty_info'),
  isAutoGenerated: boolean('is_auto_generated').notNull().default(true),
  affectedClientsCount: integer('affected_clients_count').default(0),
  lastSyncedAt: text('last_synced_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2d. Billing & Tax Invoices
export const billingInvoices = pgTable('billing_invoices', {
  id: text('id').primaryKey(),
  invoiceNumber: text('invoice_number').notNull().unique(),
  clientId: text('client_id').notNull().references(() => clients.id),
  clientName: text('client_name').notNull(),
  serviceDescription: text('service_description').notNull(),
  serviceCategory: text('service_category').notNull(),
  period: text('period'),
  professionalFee: numeric('professional_fee', { precision: 12, scale: 2 }).notNull().default('0.00'),
  gstAmount: numeric('gst_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  totalPayable: numeric('total_payable', { precision: 12, scale: 2 }).notNull().default('0.00'),
  invoiceDate: text('invoice_date').notNull(),
  dueDate: text('due_date').notNull(),
  status: text('status').notNull().default('Pending'), // 'Paid' | 'Pending' | 'Overdue'
  paymentMode: text('payment_mode'),
  receiptNumber: text('receipt_number'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 3. Monthly Document Requests
export const monthlyRequests = pgTable('monthly_requests', {
  id: text('id').primaryKey(),
  clientId: text('client_id').notNull().references(() => clients.id),
  reportingMonth: text('reporting_month').notNull(), // e.g. "2026-08" (August 2026)
  year: integer('year').notNull(),
  monthNumber: integer('month_number').notNull(), // 1 to 12
  status: text('status').notNull().default('Requested'),
  // Possible statuses: 'Requested', 'Awaiting Uploads', 'Processing', 'Missing Documents',
  // 'Needs Review', 'Awaiting Client Confirmation', 'Corrections Requested', 'Client Confirmed', 'CA Approved'
  secureUploadToken: text('secure_upload_token').notNull().unique(),
  tokenExpiresAt: timestamp('token_expires_at').notNull(),
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  reminderCount: integer('reminder_count').notNull().default(0),
  lastReminderAt: timestamp('last_reminder_at'),
  nextReminderAt: timestamp('next_reminder_at'),
  remindersPaused: boolean('reminders_paused').notNull().default(false),
  // Client Declaration
  noTransactionsDeclared: boolean('no_transactions_declared').default(false),
  declarationNotes: text('declaration_notes'),
  declaredAt: timestamp('declared_at'),
  declaredBy: text('declared_by'),
  caReviewedDeclaration: boolean('ca_reviewed_declaration').default(false),
  categoryDeclarations: jsonb('category_declarations').$type<Record<string, {
    status: 'nil' | 'uploaded' | 'pending';
    notes?: string;
    declaredAt?: string;
    declaredBy?: string;
  }>>().default({}),
  // Summary counts
  totalFilesReceived: integer('total_files_received').notNull().default(0),
  totalInvoicesExtracted: integer('total_invoices_extracted').notNull().default(0),
  unresolvedExceptionsCount: integer('unresolved_exceptions_count').notNull().default(0),
  activeWorkbookVersion: integer('active_workbook_version').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 4. Stored Document Files
export const documentFiles = pgTable('document_files', {
  id: text('id').primaryKey(),
  monthlyRequestId: text('monthly_request_id').notNull().references(() => monthlyRequests.id),
  clientId: text('client_id').notNull().references(() => clients.id),
  gstin: text('gstin').notNull(),
  reportingPeriod: text('reporting_period').notNull(),
  originalFilename: text('original_filename').notNull(),
  storagePath: text('storage_path').notNull(),
  fileHash: text('file_hash').notNull(), // SHA256 for duplicate detection
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  receivedTime: timestamp('received_time').defaultNow().notNull(),
  source: text('source').notNull().default('client_portal'), // 'client_portal' | 'staff_upload' | 'whatsapp_webhook'
  uploaderName: text('uploader_name').notNull(),
  status: text('status').notNull().default('received'), // 'received' | 'processing' | 'processed' | 'error' | 'password_protected'
  isDuplicate: boolean('is_duplicate').notNull().default(false),
  duplicateOfId: text('duplicate_of_id'),
  pageCount: integer('page_count').default(1),
  scanMethod: text('scan_method').default('native_pdf'), // 'native_pdf' | 'paddle_ocr' | 'spreadsheet_parse'
  isPasswordProtected: boolean('is_password_protected').default(false),
  scanNotes: text('scan_notes'),
  fileData: text('file_data'), // Base64 persistent cloud backup: immune to container restarts!
  driveFileId: text('drive_file_id'),
  driveWebViewLink: text('drive_web_view_link'),
  documentPassword: text('document_password'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 5. Extracted Document Units (Invoices, Debit/Credit Notes, Bank Statements)
export const extractedDocuments = pgTable('extracted_documents', {
  id: text('id').primaryKey(),
  documentFileId: text('document_file_id').notNull().references(() => documentFiles.id),
  monthlyRequestId: text('monthly_request_id').notNull().references(() => monthlyRequests.id),
  clientId: text('client_id').notNull().references(() => clients.id),
  gstin: text('gstin').notNull(),
  pageStart: integer('page_start').default(1),
  pageEnd: integer('page_end').default(1),
  // Classified Document Type
  docType: text('doc_type').notNull(), // 'sales_invoice' | 'purchase_invoice' | 'bank_statement' | 'debit_note' | 'credit_note' | 'other_uncertain'
  docNumber: text('doc_number'),
  docDate: text('doc_date'), // YYYY-MM-DD
  // Supplier & Buyer details
  supplierName: text('supplier_name'),
  supplierGstin: text('supplier_gstin'),
  supplierAddress: text('supplier_address'),
  buyerName: text('buyer_name'),
  buyerGstin: text('buyer_gstin'),
  buyerAddress: text('buyer_address'),
  placeOfSupply: text('place_of_supply'),
  originalInvoiceRef: text('original_invoice_ref'), // For Debit/Credit Notes
  reverseCharge: boolean('reverse_charge').default(false),
  currency: text('currency').default('INR'),
  // Amounts
  taxableAmount: numeric('taxable_amount', { precision: 14, scale: 2 }).default('0.00'),
  cgstAmount: numeric('cgst_amount', { precision: 14, scale: 2 }).default('0.00'),
  sgstAmount: numeric('sgst_amount', { precision: 14, scale: 2 }).default('0.00'),
  igstAmount: numeric('igst_amount', { precision: 14, scale: 2 }).default('0.00'),
  cessAmount: numeric('cess_amount', { precision: 14, scale: 2 }).default('0.00'),
  roundOff: numeric('round_off', { precision: 8, scale: 2 }).default('0.00'),
  totalAmount: numeric('total_amount', { precision: 14, scale: 2 }).default('0.00'),
  // Extraction & Review Metadata
  rawText: text('raw_text'),
  extractionConfidence: numeric('extraction_confidence', { precision: 5, scale: 2 }).default('95.00'),
  reviewStatus: text('review_status').notNull().default('auto_extracted'), // 'auto_extracted' | 'verified' | 'flagged' | 'rejected'
  reviewerNotes: text('reviewer_notes'),
  additionalFields: jsonb('additional_fields').$type<Record<string, any>>().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 6. Extracted Line Items
export const extractedLineItems = pgTable('extracted_line_items', {
  id: text('id').primaryKey(),
  documentUnitId: text('document_unit_id').notNull().references(() => extractedDocuments.id),
  itemDescription: text('item_description').notNull(),
  hsnSac: text('hsn_sac'),
  quantity: numeric('quantity', { precision: 12, scale: 2 }),
  unit: text('unit'),
  rate: numeric('rate', { precision: 12, scale: 2 }),
  discount: numeric('discount', { precision: 12, scale: 2 }).default('0.00'),
  taxableValue: numeric('taxable_value', { precision: 14, scale: 2 }).notNull().default('0.00'),
  taxRatePercent: numeric('tax_rate_percent', { precision: 5, scale: 2 }).default('18.00'),
  cgstAmount: numeric('cgst_amount', { precision: 12, scale: 2 }).default('0.00'),
  sgstAmount: numeric('sgst_amount', { precision: 12, scale: 2 }).default('0.00'),
  igstAmount: numeric('igst_amount', { precision: 12, scale: 2 }).default('0.00'),
  cessAmount: numeric('cess_amount', { precision: 12, scale: 2 }).default('0.00'),
  totalAmount: numeric('total_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
});

// 7. Bank Transactions
export const bankTransactions = pgTable('bank_transactions', {
  id: text('id').primaryKey(),
  documentUnitId: text('document_unit_id').notNull().references(() => extractedDocuments.id),
  monthlyRequestId: text('monthly_request_id').notNull().references(() => monthlyRequests.id),
  bankName: text('bank_name').notNull(),
  accountNumber: text('account_number').notNull(),
  transactionDate: text('transaction_date').notNull(), // YYYY-MM-DD
  valueDate: text('value_date'),
  narration: text('narration').notNull(),
  referenceNumber: text('reference_number'),
  debitAmount: numeric('debit_amount', { precision: 14, scale: 2 }).default('0.00'),
  creditAmount: numeric('credit_amount', { precision: 14, scale: 2 }).default('0.00'),
  balance: numeric('balance', { precision: 14, scale: 2 }),
  documentPassword: text('document_password'),
});

// 8. Validation Exceptions & Audit Checkpoints
export const validationExceptions = pgTable('validation_exceptions', {
  id: text('id').primaryKey(),
  monthlyRequestId: text('monthly_request_id').notNull().references(() => monthlyRequests.id),
  documentFileId: text('document_file_id'),
  documentUnitId: text('document_unit_id'),
  severity: text('severity').notNull().default('warning'), // 'critical' | 'warning' | 'info'
  checkType: text('check_type').notNull(), // 'category_missing' | 'gstin_mismatch' | 'arithmetic_discrepancy' | 'sequence_gap' | 'duplicate_invoice' | 'bank_balance_mismatch' | 'period_coverage_gap' | 'unreadable_scan'
  message: text('message').notNull(),
  details: jsonb('details').$type<Record<string, any>>().default({}),
  resolved: boolean('resolved').notNull().default(false),
  resolvedBy: text('resolved_by'),
  resolvedByName: text('resolved_by_name'),
  resolvedByRole: text('resolved_by_role'),
  resolvedAt: timestamp('resolved_at'),
  seniorApprovedBy: text('senior_approved_by'),
  seniorApprovedByName: text('senior_approved_by_name'),
  seniorApprovedAt: timestamp('senior_approved_at'),
  approvalStatus: text('approval_status').default('none'), // 'none' | 'resolved_by_staff' | 'pending_senior_approval' | 'senior_approved' | 'rejected'
  correctionCategory: text('correction_category').default('arithmetic'), // 'arithmetic_minor' | 'major_discrepancy'
  resolutionNotes: text('resolution_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 9. Generated Excel Workbooks
export const generatedWorkbooks = pgTable('generated_workbooks', {
  id: text('id').primaryKey(),
  monthlyRequestId: text('monthly_request_id').notNull().references(() => monthlyRequests.id),
  clientId: text('client_id').notNull().references(() => clients.id),
  gstin: text('gstin').notNull(),
  reportingPeriod: text('reporting_period').notNull(),
  version: integer('version').notNull().default(1),
  filename: text('filename').notNull(),
  filePath: text('file_path').notNull(),
  status: text('status').notNull().default('draft'), // 'draft' | 'awaiting_client_confirmation' | 'client_confirmed' | 'corrections_requested' | 'ca_approved'
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
  generatedBy: text('generated_by').notNull(),
  clientConfirmationText: text('client_confirmation_text'),
  clientConfirmedAt: timestamp('client_confirmed_at'),
  clientConfirmedBy: text('client_confirmed_by'),
  clientCorrectionComments: text('client_correction_comments'),
  caApprovedAt: timestamp('ca_approved_at'),
  caApprovedBy: text('ca_approved_by'),
  caApprovalNotes: text('ca_approval_notes'),
  caOverrideReason: text('ca_override_reason'),
  dataSnapshot: jsonb('data_snapshot').$type<Record<string, any>>(),
});

// 10. Audit & Notification Logs
export const auditNotifications = pgTable('audit_notifications', {
  id: text('id').primaryKey(),
  monthlyRequestId: text('monthly_request_id').references(() => monthlyRequests.id),
  clientId: text('client_id').references(() => clients.id),
  eventType: text('event_type').notNull(), // 'request_prepared' | 'reminder_prepared' | 'whatsapp_sent' | 'webhook_received' | 'workbook_generated' | 'client_confirmed' | 'ca_approved'
  channel: text('channel').notNull().default('whatsapp_manual'), // 'whatsapp_manual' | 'whatsapp_cloud_api' | 'email' | 'portal'
  recipient: text('recipient'),
  messageBody: text('message_body'),
  status: text('status').notNull().default('prepared'), // 'prepared' | 'sent' | 'failed' | 'simulated_dev'
  details: jsonb('details').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 11. Government E-Filings (GST & ITR Returns)
export const govtFilings = pgTable('govt_filings', {
  id: text('id').primaryKey(),
  clientId: text('client_id').notNull(),
  clientName: text('client_name').notNull(),
  identifier: text('identifier').notNull(), // GSTIN or PAN
  returnType: text('return_type').notNull(), // 'GSTR-1' | 'GSTR-3B' | 'ITR-1' | 'ITR-4'
  financialYear: text('financial_year').notNull(),
  returnPeriod: text('return_period').notNull(),
  status: text('status').notNull().default('JSON Generated'),
  arnNumber: text('arn_number'),
  filingDate: text('filing_date'),
  filedBy: text('filed_by'),
  totalTaxableValue: numeric('total_taxable_value', { precision: 15, scale: 2 }),
  totalTaxLiability: numeric('total_tax_liability', { precision: 15, scale: 2 }),
  totalItcClaimed: numeric('total_itc_claimed', { precision: 15, scale: 2 }),
  jsonFileName: text('json_file_name'),
  jsonPayload: jsonb('json_payload').$type<Record<string, any>>(),
  driveFileId: text('drive_file_id'),
  driveWebViewLink: text('drive_web_view_link'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ==========================================
// 12. SAAS MULTI-TENANT ARCHITECTURE TABLES
// ==========================================

// 12a. Tenants (CA Firms & Individual Practitioners)
export const tenants = pgTable('tenants', {
  id: text('id').primaryKey(), // e.g. 'ten_quinceca_01', 'ten_mehta_02'
  firmName: text('firm_name').notNull(),
  firmType: text('firm_type').notNull().default('partnership_firm'), // 'sole_practitioner' | 'partnership_firm' | 'llp' | 'multi_branch'
  slug: text('slug').notNull().unique(), // e.g. 'duttaca'
  ownerEmail: text('owner_email').notNull(),
  ownerName: text('owner_name').notNull(),
  contactPhone: text('contact_phone'),
  status: text('status').notNull().default('active'), // 'active' | 'trial' | 'suspended' | 'cancelled'
  planTier: text('plan_tier').notNull().default('growth'), // 'starter' | 'growth' | 'automation_pro' | 'enterprise'
  billingCycle: text('billing_cycle').notNull().default('monthly'), // 'monthly' | 'annual'
  storageQuotaGb: integer('storage_quota_gb').notNull().default(25),
  storageUsedBytes: numeric('storage_used_bytes', { precision: 20, scale: 0 }).default('0'),
  storageProvider: text('storage_provider').notNull().default('managed_local'), // 'managed_local' | 'tenant_google_drive' | 'tenant_aws_s3' | 'tenant_r2'
  customDomain: text('custom_domain'),
  logoUrl: text('logo_url'),
  themeColor: text('theme_color').default('#00c073'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 12b. Tenant Subscriptions & Preference Modules (A-la-carte Services)
export const tenantSubscriptions = pgTable('tenant_subscriptions', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  basePlan: text('base_plan').notNull().default('growth'),
  // Modular features selected by the CA firm
  activeModules: jsonb('active_modules').$type<{
    gst_filing_pipeline: boolean;
    ai_vision_ocr: boolean;
    whatsapp_automation: boolean;
    notices_scrutiny_counsel: boolean;
    itr_tax_audit: boolean;
    mca_roc_compliance: boolean;
    billing_timesheets: boolean;
    multi_user_staff_review: boolean;
  }>().default({
    gst_filing_pipeline: true,
    ai_vision_ocr: true,
    whatsapp_automation: true,
    notices_scrutiny_counsel: true,
    itr_tax_audit: true,
    mca_roc_compliance: false,
    billing_timesheets: true,
    multi_user_staff_review: true,
  }),
  storageQuotaGb: integer('storage_quota_gb').notNull().default(25),
  monthlyPriceInr: numeric('monthly_price_inr', { precision: 10, scale: 2 }).default('3999.00'),
  aiCreditsMonthlyLimit: integer('ai_credits_monthly_limit').default(2000),
  aiCreditsUsed: integer('ai_credits_used').default(0),
  whatsappMonthlyLimit: integer('whatsapp_monthly_limit').default(1000),
  whatsappMessagesUsed: integer('whatsapp_messages_used').default(0),
  billingCycle: text('billing_cycle').default('monthly'),
  renewsAt: timestamp('renews_at'),
  status: text('status').default('active'), // 'active' | 'past_due' | 'cancelled'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 12c. Isolated Storage Configurations (Separate Storage per Tenant / School / Entity)
export const tenantStorageConfigs = pgTable('tenant_storage_configs', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  storageType: text('storage_type').notNull().default('managed_local'), // 'managed_local' | 'tenant_google_drive' | 'tenant_aws_s3' | 'tenant_r2'
  isolatedFolderName: text('isolated_folder_name'), // e.g. 'ten_quinceca_01'
  // Google Drive custom firm folder credentials
  googleDriveFolderId: text('google_drive_folder_id'),
  googleDriveClientEmail: text('google_drive_client_email'),
  googleDriveRefreshToken: text('google_drive_refresh_token'),
  // AWS S3 / Cloudflare R2 credentials
  s3BucketName: text('s3_bucket_name'),
  s3Region: text('s3_region'),
  s3Endpoint: text('s3_endpoint'),
  s3AccessKeyId: text('s3_access_key_id'),
  s3SecretAccessKeyMasked: text('s3_secret_access_key_masked'),
  quotaAlertThresholdPercent: integer('quota_alert_threshold_percent').default(80),
  autoPurgeOldCache: boolean('auto_purge_old_cache').default(true),
  lastHealthCheck: timestamp('last_health_check'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const clientsRelations = relations(clients, ({ many }) => ({
  monthlyRequests: many(monthlyRequests),
  documentFiles: many(documentFiles),
  generatedWorkbooks: many(generatedWorkbooks),
}));

export const monthlyRequestsRelations = relations(monthlyRequests, ({ one, many }) => ({
  client: one(clients, {
    fields: [monthlyRequests.clientId],
    references: [clients.id],
  }),
  documentFiles: many(documentFiles),
  extractedDocuments: many(extractedDocuments),
  validationExceptions: many(validationExceptions),
  generatedWorkbooks: many(generatedWorkbooks),
}));

export const documentFilesRelations = relations(documentFiles, ({ one, many }) => ({
  monthlyRequest: one(monthlyRequests, {
    fields: [documentFiles.monthlyRequestId],
    references: [monthlyRequests.id],
  }),
  client: one(clients, {
    fields: [documentFiles.clientId],
    references: [clients.id],
  }),
  extractedDocuments: many(extractedDocuments),
}));

export const extractedDocumentsRelations = relations(extractedDocuments, ({ one, many }) => ({
  documentFile: one(documentFiles, {
    fields: [extractedDocuments.documentFileId],
    references: [documentFiles.id],
  }),
  lineItems: many(extractedLineItems),
  bankTransactions: many(bankTransactions),
}));
