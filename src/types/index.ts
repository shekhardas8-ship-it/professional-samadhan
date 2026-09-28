// src/types/index.ts

export type UserRole = 'ca_admin' | 'staff' | 'client';

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

export interface Client {
  id: string;
  businessName: string;
  contactPerson: string;
  gstin: string;
  registeredPhone: string;
  email: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  active: boolean;
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
  clientName?: string;
  clientGstin?: string;
  contactPerson?: string;
  registeredPhone?: string;
  assignedStaffName?: string;
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
