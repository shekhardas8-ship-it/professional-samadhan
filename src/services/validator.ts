// src/services/validator.ts
import { isValidGstinFormat } from './extractor.ts';

export interface ValidationItem {
  severity: 'critical' | 'warning' | 'info';
  checkType: 'category_missing' | 'gstin_mismatch' | 'arithmetic_discrepancy' | 'sequence_gap' | 'duplicate_invoice' | 'bank_balance_mismatch' | 'period_coverage_gap' | 'unreadable_scan' | 'gstin_mismatch_rejected' | 'bank_account_mismatch' | 'bank_holder_mismatch';
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
    contactPerson?: string;
    directors?: Array<{ name: string; panNumber?: string }>;
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
    supplierName?: string | null;
    supplierGstin?: string | null;
    buyerName?: string | null;
    buyerGstin?: string | null;
    reverseCharge?: boolean | null;
    rawText?: string | null;
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
    if (f.status === 'rejected_gstin_mismatch') {
      exceptions.push({
        severity: 'critical',
        checkType: 'gstin_mismatch_rejected',
        message: `❌ File "${f.originalFilename}" REJECTED: GSTIN on document does not match client profile GSTIN (${client.gstin}). Please re-upload with correct GSTIN.`,
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
      const expLast4 = expectedAcc.accountNumber ? expectedAcc.accountNumber.slice(-4) : '';
      const expBankName = (expectedAcc.bankName || '').toLowerCase();
      const found = bankTransactions.some(tx => 
        (expLast4 && tx.accountNumber && tx.accountNumber.endsWith(expLast4)) || 
        (expBankName && tx.bankName && tx.bankName.toLowerCase().includes(expBankName))
      );
      if (!found) {
        exceptions.push({
          severity: 'warning',
          checkType: 'period_coverage_gap',
          message: `Expected bank statement missing for ${expectedAcc.bankName} (Account ending in ${expLast4}).`,
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

      const isRcm = Boolean(doc.reverseCharge) || doc.supplierName?.toLowerCase().includes('porter') || doc.rawText?.toLowerCase().includes('tax summary (rcm)');
      // Under Reverse Charge Mechanism (RCM), the transporter/service provider invoices only the net fare (taxable),
      // and taxes are discharged directly by the recipient to the government. Thus the invoice total matches headerTaxable.
      const isRcmMatch = isRcm && Math.abs(headerTaxable + roundOff - headerTotal) <= 1.0;
      const calculatedHeaderTotal = isRcmMatch
        ? (headerTaxable + roundOff)
        : (headerTaxable + cgst + sgst + igst + cess + roundOff);

      if (Math.abs(calculatedHeaderTotal - headerTotal) > 1.0) {
        exceptions.push({
          severity: 'critical',
          checkType: 'arithmetic_discrepancy',
          message: `Invoice ${doc.docNumber || 'Unknown'}: Header total (₹${headerTotal.toFixed(2)}) does not match sum of taxable + taxes (₹${(headerTaxable + cgst + sgst + igst + cess + roundOff).toFixed(2)}). Difference: ₹${(headerTotal - (headerTaxable + cgst + sgst + igst + cess + roundOff)).toFixed(2)}.`,
          documentUnitId: doc.id,
          documentFileId: doc.documentFileId,
        });
      }

      // Check GSTIN format validation
      if (doc.supplierGstin && !isValidGstinFormat(doc.supplierGstin)) {
        exceptions.push({
          severity: 'warning',
          checkType: 'gstin_mismatch',
          message: `Supplier GSTIN "${doc.supplierGstin}" on doc ${doc.docNumber || 'Unknown'} does not match standard 15-character statutory format. (Accepted with flag).`,
          documentUnitId: doc.id,
          documentFileId: doc.documentFileId,
          details: { isGstinMismatch: true, expectedGstin: client.gstin, foundGstin: doc.supplierGstin },
        });
      }
      if (doc.buyerGstin && !isValidGstinFormat(doc.buyerGstin)) {
        exceptions.push({
          severity: 'warning',
          checkType: 'gstin_mismatch',
          message: `Buyer GSTIN "${doc.buyerGstin}" on doc ${doc.docNumber || 'Unknown'} does not match standard 15-character statutory format. (Accepted with flag).`,
          documentUnitId: doc.id,
          documentFileId: doc.documentFileId,
          details: { isGstinMismatch: true, expectedGstin: client.gstin, foundGstin: doc.buyerGstin },
        });
      }

      // Check Sales invoice supplier GSTIN matches client GSTIN
      if (doc.docType === 'sales_invoice') {
        const supGstin = (doc.supplierGstin || '').trim().toUpperCase();
        if (supGstin && supGstin !== client.gstin.trim().toUpperCase()) {
          exceptions.push({
            severity: 'critical',
            checkType: 'gstin_mismatch',
            message: `⚠️ Sales Bill #${doc.docNumber || 'Unknown'} Supplier GST (${doc.supplierGstin}) does not match Client Profile GST (${client.gstin}). File accepted & marked as NOT MATCHING CLIENT GST for CA verification.`,
            documentUnitId: doc.id,
            documentFileId: doc.documentFileId,
            details: { isGstinMismatch: true, expectedGstin: client.gstin, foundGstin: doc.supplierGstin, mismatchType: 'sales_supplier_mismatch' },
          });
        }
      }

      // Check Purchase invoice buyer GSTIN matches client GSTIN
      if (doc.docType === 'purchase_invoice') {
        const buyGstin = (doc.buyerGstin || '').trim().toUpperCase();
        if (buyGstin && buyGstin !== client.gstin.trim().toUpperCase()) {
          exceptions.push({
            severity: 'warning',
            checkType: 'gstin_mismatch',
            message: `⚠️ Purchase Bill #${doc.docNumber || 'Unknown'} Buyer GST (${doc.buyerGstin}) does not match Client Profile GST (${client.gstin}). File accepted & marked as NOT MATCHING CLIENT GST for CA verification.`,
            documentUnitId: doc.id,
            documentFileId: doc.documentFileId,
            details: { isGstinMismatch: true, expectedGstin: client.gstin, foundGstin: doc.buyerGstin, mismatchType: 'purchase_buyer_mismatch' },
          });
        }
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

  // 5b. Bank Statement Verification (Account Number and Account Holder Name Matching)
  const bankDocs = extractedDocs.filter(d => d.docType === 'bank_statement');
  for (const doc of bankDocs) {
    const af = ((doc as any).additionalFields || {}) as any;
    const stmtAccountNo = String(af.accountNumber || (doc.docNumber?.startsWith('STMT-') ? '' : doc.docNumber) || '').trim();
    const cleanStmtAcc = stmtAccountNo.replace(/[^0-9]/g, '');
    const stmtHolder = String(af.accountHolder || doc.buyerName || '').trim();

    // Check A: Bank Account Number Match against registered accounts in database
    const expectedAccounts = client.expectedBankAccounts || [];
    if (expectedAccounts.length > 0 && cleanStmtAcc) {
      const isAccountMatched = expectedAccounts.some(exp => {
        const cleanExp = (exp.accountNumber || '').replace(/[^0-9]/g, '');
        return cleanExp && (cleanStmtAcc === cleanExp || cleanStmtAcc.endsWith(cleanExp.slice(-4)) || cleanExp.endsWith(cleanStmtAcc.slice(-4)));
      });

      if (!isAccountMatched) {
        const expectedStr = expectedAccounts.map(e => `${e.bankName || 'Bank'} (${e.accountNumber})`).join(', ');
        exceptions.push({
          severity: 'critical',
          checkType: 'bank_account_mismatch',
          message: `❌ Bank Account Mismatch: Statement Account Number "${stmtAccountNo}" does not match any registered bank account for ${client.businessName} in our database. Expected accounts: [${expectedStr}].`,
          documentUnitId: doc.id,
          documentFileId: doc.documentFileId,
          details: {
            isAccountMismatch: true,
            statementAccountNo: stmtAccountNo,
            expectedAccounts: expectedAccounts.map(e => e.accountNumber),
          },
        });
      }
    }

    // Check B: Account Holder Name Match against company name, contact person or directors
    if (stmtHolder) {
      const normalizeName = (str: string) => {
        return (str || '')
          .toUpperCase()
          .replace(/\b(MR|MRS|MS|M\/S|DR|SH|SHRI|SMT|PVT|LTD|LIMITED|LLP|COMPANY|CO|ENTERPRISES|TRADERS|CORP|CORPORATION)\b/gi, '')
          .replace(/[^A-Z0-9]/g, '')
          .trim();
      };

      const normHolder = normalizeName(stmtHolder);
      const normCompany = normalizeName(client.businessName);
      const normContact = normalizeName(client.contactPerson || '');
      const normDirectors = (client.directors || []).map(d => normalizeName(d.name));

      const isHolderMatched = Boolean(
        normHolder && (
          (normCompany && (normHolder === normCompany || normHolder.includes(normCompany) || normCompany.includes(normHolder))) ||
          (normContact && (normHolder === normContact || normHolder.includes(normContact) || normContact.includes(normHolder))) ||
          normDirectors.some(nd => nd && (normHolder === nd || normHolder.includes(nd) || nd.includes(normHolder)))
        )
      );

      if (!isHolderMatched) {
        exceptions.push({
          severity: 'critical',
          checkType: 'bank_holder_mismatch',
          message: `❌ Account Holder Mismatch: Statement Account Holder "${stmtHolder}" does not match Company Name "${client.businessName}" or registered directors/proprietor in our database. Please verify whether this is an unauthorized personal account.`,
          documentUnitId: doc.id,
          documentFileId: doc.documentFileId,
          details: {
            isHolderMismatch: true,
            statementHolder: stmtHolder,
            companyName: client.businessName,
            contactPerson: client.contactPerson,
            directors: client.directors?.map(d => d.name),
          },
        });
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
        // Derive prefix and padding to generate missing invoice numbers
        const prefixMatch = salesInvoices[i].docNumber.match(/^(.*?)(\d+)$/);
        const prefix = prefixMatch ? prefixMatch[1] : '';
        const padLen = prefixMatch ? prefixMatch[2].length : 0;
        const missingInvoices: string[] = [];

        for (let m = curr + 1; m < next; m++) {
          const numStr = padLen > 0 ? String(m).padStart(padLen, '0') : String(m);
          missingInvoices.push(`${prefix}${numStr}`);
        }

        const missingSummary = missingInvoices.length <= 4
          ? missingInvoices.join(', ')
          : `${missingInvoices.slice(0, 3).join(', ')} ... (+${missingInvoices.length - 3} more)`;

        exceptions.push({
          severity: 'warning',
          checkType: 'sequence_gap',
          message: `Missing Invoice Sequence Gap: ${missingInvoices.length} missing invoice(s) [${missingSummary}] between ${salesInvoices[i].docNumber} and ${salesInvoices[i + 1].docNumber}. Remind client to send missing bill(s).`,
          details: {
            gapStart: curr,
            gapEnd: next,
            startDoc: salesInvoices[i].docNumber,
            endDoc: salesInvoices[i + 1].docNumber,
            missingInvoices,
            missingCount: missingInvoices.length,
          },
        });
      }
    }
  }

  return exceptions;
}
