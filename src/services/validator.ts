// src/services/validator.ts
import { isValidGstinFormat } from './extractor.ts';

export interface ValidationItem {
  severity: 'critical' | 'warning' | 'info';
  checkType: 'category_missing' | 'gstin_mismatch' | 'arithmetic_discrepancy' | 'sequence_gap' | 'duplicate_invoice' | 'bank_balance_mismatch' | 'period_coverage_gap' | 'unreadable_scan';
  message: string;
  documentFileId?: string;
  documentUnitId?: string;
  details?: Record<string, any>;
}

export function runValidationChecks(params: {
  client: {
    id: string;
    businessName: string;
    gstin: string;
    requiredChecklist: string[];
    expectedBankAccounts: Array<{ bankName: string; accountNumber: string }>;
  };
  request: {
    id: string;
    reportingMonth: string;
    noTransactionsDeclared?: boolean | null;
  };
  files: Array<{
    id: string;
    originalFilename: string;
    isDuplicate: boolean;
    isPasswordProtected?: boolean | null;
    status: string;
  }>;
  extractedDocs: Array<{
    id: string;
    documentFileId: string;
    docType: string;
    docNumber?: string | null;
    docDate?: string | null;
    supplierGstin?: string | null;
    buyerGstin?: string | null;
    taxableAmount?: string | number | null;
    cgstAmount?: string | number | null;
    sgstAmount?: string | number | null;
    igstAmount?: string | number | null;
    cessAmount?: string | number | null;
    roundOff?: string | number | null;
    totalAmount?: string | number | null;
    lineItems?: Array<{
      itemDescription: string;
      taxableValue: string | number;
      totalAmount: string | number;
      cgstAmount?: string | number | null;
      sgstAmount?: string | number | null;
      igstAmount?: string | number | null;
    }>;
  }>;
  bankTransactions: Array<{
    bankName: string;
    accountNumber: string;
    transactionDate: string;
    debitAmount?: string | number | null;
    creditAmount?: string | number | null;
    balance?: string | number | null;
  }>;
}): ValidationItem[] {
  const exceptions: ValidationItem[] = [];
  const { client, request, files, extractedDocs, bankTransactions } = params;

  // 1. Password Protected or unreadable files
  for (const f of files) {
    const hasExtractedDocs = extractedDocs.some(d => (d as any).fileId === f.id || (d as any).documentFileId === f.id);
    if (f.isPasswordProtected && (f.status === 'password_protected' || !hasExtractedDocs)) {
      exceptions.push({
        severity: 'critical',
        checkType: 'unreadable_scan',
        message: `File "${f.originalFilename}" is password-protected. Please provide password or re-upload unprotected copy.`,
        documentFileId: f.id,
      });
    }
    if (f.isDuplicate || f.status === 'duplicate_skipped' || f.status === 'duplicate_flagged') {
      exceptions.push({
        severity: 'warning',
        checkType: 'duplicate_invoice',
        message: `Duplicate file skipped: "${f.originalFilename}". Exact copy already uploaded for this period.`,
        documentFileId: f.id,
      });
    }
  }

  // 2. Category Checklist Validation (unless client declared no transactions)
  if (!request.noTransactionsDeclared) {
    const hasSales = extractedDocs.some(d => d.docType === 'sales_invoice');
    const hasPurchase = extractedDocs.some(d => d.docType === 'purchase_invoice');
    const hasBank = extractedDocs.some(d => d.docType === 'bank_statement') || bankTransactions.length > 0;

    if (client.requiredChecklist?.includes('sales_invoices') && !hasSales) {
      exceptions.push({
        severity: 'critical',
        checkType: 'category_missing',
        message: 'No sales invoices received for reporting month ' + request.reportingMonth + '. If nil sales, please declare in portal.',
      });
    }
    if (client.requiredChecklist?.includes('purchase_invoices') && !hasPurchase) {
      exceptions.push({
        severity: 'warning',
        checkType: 'category_missing',
        message: 'No purchase invoices received for ' + request.reportingMonth + '. Input Tax Credit cannot be claimed without purchase invoices.',
      });
    }
    if (client.requiredChecklist?.includes('bank_statements') && !hasBank) {
      exceptions.push({
        severity: 'critical',
        checkType: 'category_missing',
        message: 'Bank statement for the reporting month has not been submitted.',
      });
    }
  }

  // 3. Expected Bank Accounts Coverage Check
  if (client.expectedBankAccounts && client.expectedBankAccounts.length > 0 && !request.noTransactionsDeclared) {
    for (const expectedAcc of client.expectedBankAccounts) {
      const found = bankTransactions.some(tx => 
        tx.accountNumber.endsWith(expectedAcc.accountNumber.slice(-4)) || 
        tx.bankName.toLowerCase().includes(expectedAcc.bankName.toLowerCase())
      );
      if (!found) {
        exceptions.push({
          severity: 'warning',
          checkType: 'period_coverage_gap',
          message: `Expected bank statement missing for ${expectedAcc.bankName} (Account ending in ${expectedAcc.accountNumber.slice(-4)}).`,
          details: { bankName: expectedAcc.bankName, accountNumber: expectedAcc.accountNumber },
        });
      }
    }
  }

  // 4. Duplicate Invoice Detection (checks sales and purchase invoices by number)
  const invoiceKeys = new Map<string, string>();
  for (const doc of extractedDocs) {
    if (doc.docNumber) {
      const cleanNo = doc.docNumber.trim().toUpperCase();
      if (cleanNo.length >= 3 && !['INVOICE', 'BILL', 'TAX INVOICE', 'CASH MEMO'].includes(cleanNo)) {
        const partyGstin = (doc.supplierGstin || doc.buyerGstin || client.gstin || 'CLIENT').trim().toUpperCase();
        const key = `${doc.docType || 'doc'}__${partyGstin}__${cleanNo}`;
        if (invoiceKeys.has(key)) {
          exceptions.push({
            severity: 'critical',
            checkType: 'duplicate_invoice',
            message: `Duplicate Invoice Number detected: "${doc.docNumber}" (${(doc.docType || 'invoice').replace('_', ' ')}).`,
            documentUnitId: doc.id,
            documentFileId: doc.documentFileId,
          });
        } else {
          invoiceKeys.set(key, doc.id);
        }
      }
    }
  }

  // 5. Line Item Arithmetic & Total Reconciliation (with tolerance +- 1.00 INR for rounding)
  for (const doc of extractedDocs) {
    if (doc.docType === 'sales_invoice' || doc.docType === 'purchase_invoice' || doc.docType === 'debit_note' || doc.docType === 'credit_note') {
      const headerTotal = Number(doc.totalAmount || 0);
      const headerTaxable = Number(doc.taxableAmount || 0);
      const cgst = Number(doc.cgstAmount || 0);
      const sgst = Number(doc.sgstAmount || 0);
      const igst = Number(doc.igstAmount || 0);
      const cess = Number(doc.cessAmount || 0);
      const roundOff = Number(doc.roundOff || 0);

      const calculatedHeaderTotal = headerTaxable + cgst + sgst + igst + cess + roundOff;
      if (Math.abs(calculatedHeaderTotal - headerTotal) > 1.0) {
        exceptions.push({
          severity: 'critical',
          checkType: 'arithmetic_discrepancy',
          message: `Invoice ${doc.docNumber || 'Unknown'}: Header total (₹${headerTotal.toFixed(2)}) does not match sum of taxable + taxes (₹${calculatedHeaderTotal.toFixed(2)}). Difference: ₹${(headerTotal - calculatedHeaderTotal).toFixed(2)}.`,
          documentUnitId: doc.id,
          documentFileId: doc.documentFileId,
        });
      }

      // Check GSTIN format validation
      if (doc.supplierGstin && !isValidGstinFormat(doc.supplierGstin)) {
        exceptions.push({
          severity: 'warning',
          checkType: 'gstin_mismatch',
          message: `Supplier GSTIN "${doc.supplierGstin}" on doc ${doc.docNumber} does not match standard 15-character statutory format.`,
          documentUnitId: doc.id,
          documentFileId: doc.documentFileId,
        });
      }
      if (doc.buyerGstin && !isValidGstinFormat(doc.buyerGstin)) {
        exceptions.push({
          severity: 'warning',
          checkType: 'gstin_mismatch',
          message: `Buyer GSTIN "${doc.buyerGstin}" on doc ${doc.docNumber} does not match standard 15-character statutory format.`,
          documentUnitId: doc.id,
          documentFileId: doc.documentFileId,
        });
      }

      // Check Sales invoice supplier GSTIN matches client GSTIN
      if (doc.docType === 'sales_invoice' && doc.supplierGstin && doc.supplierGstin.toUpperCase() !== client.gstin.toUpperCase()) {
        exceptions.push({
          severity: 'critical',
          checkType: 'gstin_mismatch',
          message: `Sales invoice ${doc.docNumber} supplier GSTIN (${doc.supplierGstin}) does not match Client GSTIN (${client.gstin}). Verify if classified correctly.`,
          documentUnitId: doc.id,
          documentFileId: doc.documentFileId,
        });
      }

      // Check line items sum vs header taxable
      if (doc.lineItems && doc.lineItems.length > 0) {
        const lineTaxableSum = doc.lineItems.reduce((acc, it) => acc + Number(it.taxableValue || 0), 0);
        if (Math.abs(lineTaxableSum - headerTaxable) > 1.0) {
          exceptions.push({
            severity: 'warning',
            checkType: 'arithmetic_discrepancy',
            message: `Invoice ${doc.docNumber}: Sum of line item taxable values (₹${lineTaxableSum.toFixed(2)}) differs from header taxable amount (₹${headerTaxable.toFixed(2)}).`,
            documentUnitId: doc.id,
            documentFileId: doc.documentFileId,
          });
        }
      }
    }
  }

  // 6. Sequence Gaps Analysis on Sales Invoices
  const salesInvoices = extractedDocs
    .filter(d => d.docType === 'sales_invoice' && d.docNumber)
    .map(d => {
      const match = d.docNumber!.match(/(\d+)$/);
      return {
        docNumber: d.docNumber!,
        num: match ? parseInt(match[1], 10) : null,
      };
    })
    .filter(d => d.num !== null)
    .sort((a, b) => a.num! - b.num!);

  if (salesInvoices.length > 1) {
    for (let i = 0; i < salesInvoices.length - 1; i++) {
      const curr = salesInvoices[i].num!;
      const next = salesInvoices[i + 1].num!;
      if (next - curr > 1) {
        exceptions.push({
          severity: 'info',
          checkType: 'sequence_gap',
          message: `Possible invoice sequence gap between ${salesInvoices[i].docNumber} and ${salesInvoices[i + 1].docNumber} (${next - curr - 1} missing numbers). Flagged for staff review.`,
          details: { gapStart: curr, gapEnd: next },
        });
      }
    }
  }

  return exceptions;
}
