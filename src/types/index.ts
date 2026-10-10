// src/types/index.ts

export type UserRole = 'superadmin' | 'ca_admin' | 'staff' | 'client';

export type MonthlyRequestStatus =
  | 'Requested'
  | 'Awaiting Uploads'
  | 'Processing'
  | 'Missing Documents'
  | 'Needs Review'
  | 'Awaiting Client Confirmation'
  | 'Corrections Requested'
  | 'Client Confirmed'
  | 'CA Approved';

export interface DirectorKYC {
  id: string;
  name: string;
  din?: string;
  phone?: string;
  email?: string;
  aadharNumber?: string;
  panNumber?: string;
  bankDetails?: string; // cancel cheque ref
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
}

export interface ClientAttachedDoc {
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
}

export interface ContactPerson {
  id: string;
  name: string;
  email: string;
  countryCode: string;
  phone: string;
  phoneType?: 'Mobile' | 'Work' | 'Personal';
  skypeNumber?: string;
  designation?: string;
  department?: string;
  isPrimary?: boolean;
}

export interface ClientNote {
  id: string;
  text: string;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  authorName: string;
  createdAt: string;
}

export interface ClientRequestItem {
  id: string;
  requestNumber: number;
  title: string;
  assignedTo: string;
  status: 'Open' | 'In Progress' | 'Needs Review' | 'Completed';
  priority: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Urgent';
  clientName: string;
  associatedApp: 'Books' | 'GST' | 'Expense' | 'Inventory' | 'Payroll';
  createdAt: string;
  dueDate?: string;
}

export interface Client {
  id: string;
  businessName: string;
  contactPerson: string;
  gstin: string;
  cin?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  registeredPhone: string;
  email: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  active: boolean;
  directors?: DirectorKYC[];
  attachedDocuments?: ClientAttachedDoc[];
  requiredChecklist: string[];
  expectedBankAccounts: Array<{
    bankName: string;
    accountNumber: string;
    ifsc?: string;
    accountType?: string;
  }>;
  whatsappConsent: boolean;
  whatsappConsentDate?: string;
  reminderCadenceDays: number;
  maxReminders: number;
  remindersPaused: boolean;
  googleDriveFolderId?: string;
  googleDriveUrl?: string;

  // Parameters matching screenshots
  displayName?: string;
  contactPersons?: ContactPerson[];
  notes?: ClientNote[];
  managedBy?: Array<{ id: string; name: string; role: string; avatarUrl?: string }>;
  associatedApps?: Array<'Books' | 'Expense' | 'Inventory' | 'Payroll'>;
  unbilledTasksCount?: number;
  totalHoursLogged?: number;
  onboardingProgressPercent?: number;
  pendingTasksCount?: number;
  openClientRequestsCount?: number;
  insightsData?: {
    agedReceivablesOver45Days: number;
    agedPayablesOver45Days: number;
    cashFlowTrend: string;
    averageDebtorAgeDays: number;
    generalLedgerIssues: number;
    relativeSizeFactor: number;
    topExpenses: Array<{ category: string; amount: number }>;
  };
  clientRequests?: ClientRequestItem[];
}

export type AdhocServiceCategory =
  | 'GST Registration'
  | 'GST Amendment etc'
  | 'Company Registration'
  | 'Trademark'
  | 'FSSAI'
  | 'ROC work (Director KYC, Name change, objective amendment, etc)'
  | 'MSME registration'
  | 'Startup india registration'
  | 'Professional tax'
  | 'Projected Report'
  | 'PnL and Balancesheet'
  | 'Income Tax Notice Reply'
  | 'Other Advisory';

export interface AdhocRequestItem {
  id: string;
  clientId: string;
  clientName: string;
  clientGstin?: string;
  serviceCategory: AdhocServiceCategory;
  title: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Review' | 'Completed' | 'Delivered';
  priority: 'High' | 'Medium' | 'Low';
  assignedStaffName?: string;
  assignedStaffId?: string;
  feeQuote?: number;
  targetDeadline?: string;
  completedDate?: string;
  deliverableFile?: string;
  createdAt: string;
  notes?: string;
}

export type StatutoryCategory =
  | 'GST'
  | 'TDS'
  | 'Income Tax'
  | 'ROC'
  | 'Audit'
  | 'EPFO'
  | 'ESIC'
  | 'Labour'
  | 'RBI'
  | 'DPIIT'
  | 'DGFT'
  | 'CBIC'
  | 'IP India'
  | string;

export interface RegulatoryPortalInfo {
  id: string;
  name: string;
  domain: string;
  url: string;
  category: string;
  ministry: string;
  badgeColor: string;
  description: string;
  lastSyncedAt?: string;
  status: 'online' | 'synced' | 'connecting';
}

export interface ComplianceCalendarItem {
  id: string;
  dueDate: string; // e.g., "2026-10-05"
  displayDate: string; // e.g. "5 Oct"
  eventTitle: string; // e.g., "GSTR-1 filing"
  category: StatutoryCategory;
  portalName?: string;
  portalDomain?: string;
  portalUrl?: string;
  formNumber?: string;
  actLaw?: string;
  frequency?: string;
  applicableTo: string;
  status: 'Upcoming' | 'Urgent' | 'Action Required' | 'Completed' | 'Overdue';
  daysRemaining?: number;
  description?: string;
  penaltyInfo?: string;
  isAutoGenerated: boolean;
  affectedClientsCount?: number;
  lastSyncedAt?: string;
}

export interface PendingTaxItem {
  id: string;
  clientId: string;
  clientName: string;
  clientGstin: string;
  taxType: 'GSTR-1' | 'TDS Deposit' | 'GSTR-7' | 'Advance Tax' | 'GSTR-3B' | 'TDS Return Q2' | 'Tax Audit';
  dueDate: string;
  daysRemaining: number;
  estimatedTaxAmount: number;
  status: 'Pending Files' | 'Under Computation' | 'Ready for Payment' | 'Filed / Challan Generated';
  registeredPhone: string;
  assignedStaff: string;
  lastReminderSent?: string;
}

export interface PendingTaskItem {
  id: string;
  sourceSection: 'statutory_tax' | 'gst_intake' | 'client_approval' | 'staff_review' | 'billing' | 'adhoc';
  sourceSectionName: string;
  clientId?: string;
  clientName: string;
  clientGstin?: string;
  taskTitle: string;
  taskDescription: string;
  dueDate: string;
  daysRemaining: number;
  urgency: 'critical' | 'urgent' | 'upcoming';
  estimatedAmount?: number;
  amountLabel?: string;
  status: string;
  registeredPhone?: string;
  assignedStaff?: string;
  lastReminderSent?: string;
  actionType: 'whatsapp_client' | 'notify_ca' | 'view_section' | 'open_portal';
  targetTab?: string;
}

export interface BillingInvoiceItem {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  serviceDescription: string;
  serviceCategory: 'Routine GST Filing' | 'Adhoc Service' | 'Tax Audit' | 'ROC Filing' | 'Annual Retainer';
  period?: string;
  professionalFee: number;
  gstAmount: number;
  totalPayable: number;
  invoiceDate: string;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  paymentMode?: string;
  receiptNumber?: string;
}

export interface MonthlyRequest {
  id: string;
  clientId: string;
  reportingMonth: string;
  year: number;
  monthNumber: number;
  status: MonthlyRequestStatus;
  secureUploadToken: string;
  tokenExpiresAt: string;
  requestedAt: string;
  reminderCount: number;
  lastReminderAt?: string;
  nextReminderAt?: string;
  remindersPaused: boolean;
  noTransactionsDeclared?: boolean;
  declarationNotes?: string;
  declaredAt?: string;
  declaredBy?: string;
  caReviewedDeclaration?: boolean;
  totalFilesReceived: number;
  totalInvoicesExtracted: number;
  unresolvedExceptionsCount: number;
  activeWorkbookVersion: number;
  categoryDeclarations?: Record<string, { status: 'nil' | 'uploaded' | 'pending'; notes?: string; declaredAt?: string; declaredBy?: string }>;
  clientName?: string;
  clientGstin?: string;
  contactPerson?: string;
  registeredPhone?: string;
  assignedStaffName?: string;
  googleDriveUrl?: string;
  googleDriveFolderId?: string;
}

export interface ChecklistCategoryItem {
  id: string;
  label: string;
  description: string;
  required: boolean;
  status: 'uploaded' | 'missing' | 'nil_declared';
  uploadedCount: number;
  uploadedFiles: string[];
  missingReason?: string;
  nilNotes?: string;
  documentPassword?: string;
}

export interface DocumentFile {
  id: string;
  monthlyRequestId: string;
  clientId: string;
  gstin: string;
  reportingPeriod: string;
  originalFilename: string;
  storagePath: string;
  fileHash: string;
  mimeType: string;
  sizeBytes: number;
  receivedTime: string;
  source: 'client_portal' | 'staff_upload' | 'whatsapp_webhook';
  uploaderName: string;
  status: 'received' | 'processing' | 'processed' | 'error' | 'duplicate_flagged' | 'password_protected';
  isDuplicate: boolean;
  duplicateOfId?: string;
  scanMethod?: string;
  isPasswordProtected?: boolean;
  scanNotes?: string;
  fileData?: string;
  driveFileId?: string;
  driveWebViewLink?: string;
}

export interface ExtractedDocument {
  id: string;
  documentFileId: string;
  monthlyRequestId: string;
  clientId: string;
  gstin: string;
  pageStart?: number;
  pageEnd?: number;
  docType: 'sales_invoice' | 'purchase_invoice' | 'bank_statement' | 'debit_note' | 'credit_note' | 'other_uncertain';
  docNumber?: string;
  docDate?: string;
  supplierName?: string;
  supplierGstin?: string;
  supplierAddress?: string;
  buyerName?: string;
  buyerGstin?: string;
  buyerAddress?: string;
  placeOfSupply?: string;
  originalInvoiceRef?: string;
  reverseCharge?: boolean;
  currency?: string;
  taxableAmount: string | number;
  cgstAmount: string | number;
  sgstAmount: string | number;
  igstAmount: string | number;
  cessAmount: string | number;
  roundOff?: string | number;
  totalAmount: string | number;
  rawText?: string;
  extractionConfidence?: string | number;
  reviewStatus: 'auto_extracted' | 'verified' | 'flagged' | 'rejected';
  reviewerNotes?: string;
}

export interface ExtractedLineItem {
  id: string;
  documentUnitId: string;
  itemDescription: string;
  hsnSac?: string;
  quantity?: string | number;
  unit?: string;
  rate?: string | number;
  discount?: string | number;
  taxableValue: string | number;
  taxRatePercent?: string | number;
  cgstAmount?: string | number;
  sgstAmount?: string | number;
  igstAmount?: string | number;
  cessAmount?: string | number;
  totalAmount: string | number;
}

export interface BankTransaction {
  id: string;
  documentUnitId: string;
  monthlyRequestId: string;
  bankName: string;
  accountNumber: string;
  transactionDate: string;
  valueDate?: string;
  narration: string;
  referenceNumber?: string;
  debitAmount: string | number;
  creditAmount: string | number;
  balance?: string | number;
}

export interface ValidationException {
  id: string;
  monthlyRequestId: string;
  documentFileId?: string;
  documentUnitId?: string;
  severity: 'critical' | 'warning' | 'info';
  checkType: string;
  message: string;
  details?: Record<string, any>;
  resolved: boolean;
  resolvedBy?: string;
  resolvedByName?: string;
  resolvedByRole?: string;
  resolvedAt?: string;
  seniorApprovedBy?: string;
  seniorApprovedByName?: string;
  seniorApprovedAt?: string;
  approvalStatus?: 'none' | 'resolved_by_staff' | 'pending_senior_approval' | 'senior_approved' | 'rejected';
  correctionCategory?: 'arithmetic_minor' | 'major_discrepancy';
  resolutionNotes?: string;
  createdAt: string;
}

export interface GeneratedWorkbook {
  id: string;
  monthlyRequestId: string;
  clientId: string;
  gstin: string;
  reportingPeriod: string;
  version: number;
  filename: string;
  filePath: string;
  status: 'draft' | 'awaiting_client_confirmation' | 'client_confirmed' | 'corrections_requested' | 'ca_approved';
  generatedAt: string;
  generatedBy: string;
  clientConfirmationText?: string;
  clientConfirmedAt?: string;
  clientConfirmedBy?: string;
  clientCorrectionComments?: string;
  caApprovedAt?: string;
  caApprovedBy?: string;
  caApprovalNotes?: string;
  caOverrideReason?: string;
}

export interface AuditNotification {
  id: string;
  monthlyRequestId?: string;
  clientId?: string;
  clientBusinessName?: string;
  clientGstin?: string;
  eventType: string;
  channel: string;
  recipient?: string;
  messageBody?: string;
  status: 'prepared' | 'sent' | 'failed' | 'simulated_dev';
  details?: Record<string, any>;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  token?: string;
  assignedClientIds?: string[];
  lastLogin?: string;
  designation?: string;
  firmName?: string;
  logoUrl?: string;
  isSuperAdmin?: boolean;
}

// Enterprise Practice Extensions for QuinceCA
export interface StatutoryNoticeItem {
  id: string;
  clientId: string;
  clientName: string;
  clientGstin?: string;
  department: 'GST' | 'Income Tax' | 'TDS' | 'ROC' | 'PF/ESI';
  noticeNumber: string;
  noticeDate: string;
  dueDate: string;
  noticeType: string;
  status: 'Received' | 'Under Review' | 'Drafting Reply' | 'Replied' | 'Closed';
  assignedEmployeeName: string;
  demandAmount: number;
  penaltyAmount: number;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  responseNotes?: string;
  documentsCount?: number;
  daysRemaining?: number;
}

export interface EnterpriseTaskItem {
  id: string;
  clientId: string;
  clientName: string;
  clientGstin?: string;
  title: string;
  description: string;
  serviceType: 'GST' | 'TDS' | 'Income Tax' | 'ROC' | 'Audit' | 'Adhoc' | 'Litigation';
  priority: 'Urgent' | 'High' | 'Medium' | 'Low';
  status: 'Created' | 'Assigned' | 'In Progress' | 'Awaiting Client' | 'Under Review' | 'Changes Requested' | 'Approved' | 'Completed';
  executorName: string;
  reviewerName: string;
  managerName?: string;
  startDate: string;
  dueDate: string;
  timeSpentHours: number;
  slaHours: number;
  isOverdue: boolean;
  checklistItems: Array<{ id: string; label: string; completed: boolean }>;
}

export interface TimesheetItem {
  id: string;
  employeeId: string;
  employeeName: string;
  taskId?: string;
  taskTitle?: string;
  clientId: string;
  clientName: string;
  serviceCategory: string;
  date: string;
  hoursSpent: number;
  isBillable: boolean;
  workSummary: string;
  status: 'Logged' | 'Submitted' | 'Approved';
}

export interface DscLicenceItem {
  id: string;
  clientId: string;
  clientName: string;
  holderName: string;
  holderDesignation: string;
  holderPan: string;
  certType: 'Class 3 DSC (Signing)' | 'Class 3 DSC (Combo)' | 'DIN' | 'Trade Licence' | 'FSSAI' | 'Import Export Code (IEC)';
  issuer: string;
  validFrom: string;
  expiryDate: string;
  daysToExpiry: number;
  status: 'Active' | 'Expiring Soon' | 'Expired';
  storageLocation: string;
  renewalStatus: 'Not Started' | 'In Process' | 'Documents Collected' | 'Renewed';
}

export interface WorkflowAutomationItem {
  id: string;
  name: string;
  description: string;
  category: 'GST Intake' | 'Document Follow-Up' | 'Notice Escalation' | 'Billing Collection' | 'Tax Reminder';
  triggerType: 'Monthly 1st' | 'Statutory Due Date' | 'Document Missing' | 'Notice Uploaded' | 'Payment Overdue';
  status: 'Active' | 'Paused' | 'Draft';
  lastRunAt: string;
  totalRuns: number;
  successRatePercent: number;
  steps: Array<{
    type: 'TRIGGER' | 'CONDITION' | 'ACTION' | 'WAIT' | 'APPROVAL' | 'ESCALATION';
    title: string;
    details: string;
  }>;
}

export interface AiAgentActionItem {
  id: string;
  timestamp: string;
  agentName: 'Orchestrator' | 'Document Agent' | 'Compliance Agent' | 'Follow-Up Agent' | 'Notice Agent' | 'Reconciliation Agent' | 'Billing Agent';
  actionTitle: string;
  riskLevel: 'READ ONLY' | 'LOW RISK' | 'SENSITIVE' | 'HIGH RISK';
  status: 'Auto Executed' | 'Pending Approval' | 'Approved & Executed' | 'Rejected';
  summary: string;
  targetEntity: string;
  proposedChanges: string;
}

export interface SuperAdminTenantItem {
  id: string;
  firmName: string;
  slug: string;
  planName: 'Starter' | 'Professional' | 'AI Automation' | 'Enterprise';
  status: 'Active' | 'Trial' | 'Suspended';
  usersCount: number;
  clientsCount: number;
  storageMb: number;
  aiTokensUsed: number;
  whatsappMessagesSent: number;
  mrrAmount: number;
  renewalDate: string;
  contactPerson: string;
  contactEmail: string;
}

export type GovtReturnType = 'GSTR-1' | 'GSTR-3B' | 'ITR-1' | 'ITR-4';
export type GovtFilingStatus = 'Generated (Offline JSON)' | 'Filed with EVC/DSC' | 'Rejected / Needs Review';

export interface GovtValidationCheck {
  id: string;
  label: string;
  status: 'passed' | 'warning' | 'failed';
  message: string;
}

export interface GovtValidationResult {
  score: number;
  isPortalReady: boolean;
  checks: GovtValidationCheck[];
}

export interface GovtFilingRecord {
  id: string;
  clientId: string;
  clientName: string;
  identifier: string;
  returnType: GovtReturnType;
  period: string;
  financialYear: string;
  status: GovtFilingStatus;
  arnNumber?: string;
  filingDate?: string;
  filedBy?: string;
  totalTaxLiability?: number;
  jsonFileName: string;
  jsonFilePath?: string;
  createdAt: string;
  notes?: string;
}

