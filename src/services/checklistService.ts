// src/services/checklistService.ts
import { ChecklistCategoryItem } from '../types/index.ts';

export interface EvaluateChecklistParams {
  client: {
    requiredChecklist?: string[];
    expectedBankAccounts?: Array<{ bankName: string; accountNumber: string; ifsc?: string }>;
  };
  request: {
    reportingMonth: string;
    noTransactionsDeclared?: boolean | null;
    categoryDeclarations?: Record<string, { status: 'nil' | 'uploaded' | 'pending'; notes?: string }>;
  };
  extractedDocs: Array<{
    docType: string;
    supplierName?: string | null;
    docNumber?: string | null;
    totalAmount?: string | number | null;
  }>;
  files: Array<{
    originalFilename: string;
    status: string;
  }>;
  bankTransactions: Array<{
    bankName: string;
    accountNumber: string;
  }>;
  manualExceptions?: Array<{
    checkType: string;
    message: string;
    resolved: boolean;
  }>;
}

export interface ChecklistEvaluationResult {
  checklist: ChecklistCategoryItem[];
  missingItems: string[];
  isFullySatisfied: boolean;
  uploadedItemsSummary: string[];
}

export function evaluateMonthlyChecklist(params: EvaluateChecklistParams): ChecklistEvaluationResult {
  const { client, request, extractedDocs, files, bankTransactions, manualExceptions = [] } = params;
  const checklist: ChecklistCategoryItem[] = [];
  const missingItems: string[] = [];
  const uploadedItemsSummary: string[] = [];

  const reqChecklist = client.requiredChecklist || ['sales_invoices', 'purchase_invoices', 'bank_statements', 'debit_credit_notes'];
  const catDeclarations = request.categoryDeclarations || {};
  const isGlobalNil = Boolean(request.noTransactionsDeclared);

  // 1. SALES INVOICES (Outward Supplies / GSTR-1)
  const salesDocs = extractedDocs.filter(d => d.docType === 'sales_invoice');
  const salesCount = salesDocs.length;
  const isSalesRequired = reqChecklist.includes('sales_invoices');
  const salesNil = isGlobalNil || catDeclarations['sales_invoices']?.status === 'nil';

  if (salesCount > 0) {
    checklist.push({
      id: 'sales_invoices',
      label: 'Sales Invoices / Outward Supplies',
      description: 'Tax invoices, bills of supply, and export invoices for GSTR-1',
      required: isSalesRequired,
      status: 'uploaded',
      uploadedCount: salesCount,
      uploadedFiles: files.map(f => f.originalFilename).slice(0, 3),
    });
    uploadedItemsSummary.push(`• Sales Invoices: ${salesCount} invoices extracted`);
  } else if (salesNil) {
    checklist.push({
      id: 'sales_invoices',
      label: 'Sales Invoices / Outward Supplies',
      description: 'Tax invoices, bills of supply, and export invoices for GSTR-1',
      required: isSalesRequired,
      status: 'nil_declared',
      uploadedCount: 0,
      uploadedFiles: [],
      nilNotes: catDeclarations['sales_invoices']?.notes || 'Client confirmed Nil Outward Sales for the month',
    });
  } else if (isSalesRequired) {
    checklist.push({
      id: 'sales_invoices',
      label: 'Sales Invoices / Outward Supplies',
      description: 'Tax invoices, bills of supply, and export invoices for GSTR-1',
      required: isSalesRequired,
      status: 'missing',
      uploadedCount: 0,
      uploadedFiles: [],
      missingReason: `Sales invoices not received for ${request.reportingMonth}`,
    });
    missingItems.push(`Sales Invoices / Outward Supplies for ${request.reportingMonth}`);
  }

  // 2. PURCHASE INVOICES (Inward Supplies / GSTR-3B ITC)
  const purchaseDocs = extractedDocs.filter(d => d.docType === 'purchase_invoice');
  const purchaseCount = purchaseDocs.length;
  const isPurchaseRequired = reqChecklist.includes('purchase_invoices');
  const purchaseNil = isGlobalNil || catDeclarations['purchase_invoices']?.status === 'nil';

  if (purchaseCount > 0) {
    checklist.push({
      id: 'purchase_invoices',
      label: 'Purchase Invoices / Expense Bills',
      description: 'Vendor tax invoices required to claim Input Tax Credit (ITC)',
      required: isPurchaseRequired,
      status: 'uploaded',
      uploadedCount: purchaseCount,
      uploadedFiles: files.map(f => f.originalFilename).slice(0, 3),
    });
    uploadedItemsSummary.push(`• Purchase Invoices: ${purchaseCount} vendor bills extracted`);
  } else if (purchaseNil) {
    checklist.push({
      id: 'purchase_invoices',
      label: 'Purchase Invoices / Expense Bills',
      description: 'Vendor tax invoices required to claim Input Tax Credit (ITC)',
      required: isPurchaseRequired,
      status: 'nil_declared',
      uploadedCount: 0,
      uploadedFiles: [],
      nilNotes: catDeclarations['purchase_invoices']?.notes || 'Client confirmed Nil Purchases this month',
    });
  } else if (isPurchaseRequired) {
    checklist.push({
      id: 'purchase_invoices',
      label: 'Purchase Invoices / Expense Bills',
      description: 'Vendor tax invoices required to claim Input Tax Credit (ITC)',
      required: isPurchaseRequired,
      status: 'missing',
      uploadedCount: 0,
      uploadedFiles: [],
      missingReason: 'Purchase bills required to verify & claim Input Tax Credit (ITC)',
    });
    missingItems.push('Purchase Invoices (Required for Input Tax Credit claim)');
  }

  // 3. BANK STATEMENTS
  const bankDocs = extractedDocs.filter(d => d.docType === 'bank_statement');
  const hasBankData = bankDocs.length > 0 || bankTransactions.length > 0;
  const isBankRequired = reqChecklist.includes('bank_statements');
  const bankNil = isGlobalNil || catDeclarations['bank_statements']?.status === 'nil';

  const expectedBanks = client.expectedBankAccounts || [];
  let bankMissingDescription = '';

  if (expectedBanks.length > 0 && !bankNil) {
    const missingBankNames = expectedBanks
      .filter(exp => !bankTransactions.some(tx => 
        tx.accountNumber?.endsWith(exp.accountNumber?.slice(-4)) || 
        tx.bankName?.toLowerCase().includes(exp.bankName?.toLowerCase())
      ))
      .map(exp => `${exp.bankName} (ending in ${exp.accountNumber?.slice(-4)})`);

    if (missingBankNames.length > 0 && !hasBankData) {
      bankMissingDescription = `Missing for: ${missingBankNames.join(', ')}`;
    }
  }

  if (hasBankData) {
    checklist.push({
      id: 'bank_statements',
      label: 'Bank Statements',
      description: expectedBanks.length > 0 ? `Expected accounts: ${expectedBanks.map(b => b.bankName).join(', ')}` : 'Monthly bank statements for current accounts',
      required: isBankRequired,
      status: 'uploaded',
      uploadedCount: bankTransactions.length > 0 ? bankTransactions.length : bankDocs.length,
      uploadedFiles: files.map(f => f.originalFilename).slice(0, 3),
    });
    uploadedItemsSummary.push(`• Bank Statement: Received (${bankTransactions.length || bankDocs.length} transactions/pages)`);
  } else if (bankNil) {
    checklist.push({
      id: 'bank_statements',
      label: 'Bank Statements',
      description: 'Monthly bank statements for current accounts',
      required: isBankRequired,
      status: 'nil_declared',
      uploadedCount: 0,
      uploadedFiles: [],
      nilNotes: catDeclarations['bank_statements']?.notes || 'Client confirmed no bank activity or statement not available',
    });
  } else if (isBankRequired) {
    checklist.push({
      id: 'bank_statements',
      label: 'Bank Statements',
      description: 'Monthly bank statements for current accounts',
      required: isBankRequired,
      status: 'missing',
      uploadedCount: 0,
      uploadedFiles: [],
      missingReason: bankMissingDescription || `Bank statement not received for ${request.reportingMonth}`,
    });
    missingItems.push(bankMissingDescription ? `Bank Statement (${bankMissingDescription})` : `Bank Statement for ${request.reportingMonth}`);
  }

  // 4. DEBIT & CREDIT NOTES
  const noteDocs = extractedDocs.filter(d => d.docType === 'debit_note' || d.docType === 'credit_note');
  const noteCount = noteDocs.length;
  const noteNil = isGlobalNil || catDeclarations['debit_credit_notes']?.status === 'nil';

  if (noteCount > 0) {
    checklist.push({
      id: 'debit_credit_notes',
      label: 'Debit & Credit Notes',
      description: 'Adjustment notes for rate/quantity modifications and sales returns',
      required: false,
      status: 'uploaded',
      uploadedCount: noteCount,
      uploadedFiles: files.map(f => f.originalFilename).slice(0, 3),
    });
    uploadedItemsSummary.push(`• Debit/Credit Notes: ${noteCount} notes extracted`);
  } else if (noteNil) {
    checklist.push({
      id: 'debit_credit_notes',
      label: 'Debit & Credit Notes',
      description: 'Adjustment notes for rate/quantity modifications and sales returns',
      required: false,
      status: 'nil_declared',
      uploadedCount: 0,
      uploadedFiles: [],
      nilNotes: catDeclarations['debit_credit_notes']?.notes || 'Nil: No debit or credit notes issued this month',
    });
  } else {
    // If not declared and not uploaded, default to nil_declared with friendly text or optional
    checklist.push({
      id: 'debit_credit_notes',
      label: 'Debit & Credit Notes',
      description: 'Adjustment notes for rate/quantity modifications and sales returns',
      required: false,
      status: 'nil_declared',
      uploadedCount: 0,
      uploadedFiles: [],
      nilNotes: 'Optional (none uploaded this month)',
    });
  }

  // 5. MANUAL CA FLAGS & CUSTOM EXCEPTIONS
  const activeMissingExceptions = manualExceptions.filter(e => 
    !e.resolved && (e.checkType === 'category_missing' || e.checkType === 'period_coverage_gap')
  );

  for (const ex of activeMissingExceptions) {
    // Avoid exact duplicate wording with standard items
    const alreadyIncluded = missingItems.some(m => m.toLowerCase().includes(ex.message.toLowerCase()) || ex.message.toLowerCase().includes(m.toLowerCase()));
    if (!alreadyIncluded) {
      missingItems.push(`CA Flagged: ${ex.message}`);
      checklist.push({
        id: `custom_${Math.random().toString(36).substring(2, 7)}`,
        label: 'CA Requested Document',
        description: 'Specific document requested by Chartered Accountant audit staff',
        required: true,
        status: 'missing',
        uploadedCount: 0,
        uploadedFiles: [],
        missingReason: ex.message,
      });
    }
  }

  return {
    checklist,
    missingItems,
    isFullySatisfied: missingItems.length === 0,
    uploadedItemsSummary,
  };
}
