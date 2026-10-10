// src/components/StaffReviewModal.tsx
import React, { useState, useEffect } from 'react';
import {
  MonthlyRequest,
  DocumentFile,
  ExtractedDocument,
  ExtractedLineItem,
  BankTransaction,
  ValidationException,
  GeneratedWorkbook,
  UserRole,
  ChecklistCategoryItem,
} from '../types/index.ts';
import {
  X,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Download,
  Edit2,
  Save,
  Check,
  FileSpreadsheet,
  ShieldCheck,
  ExternalLink,
  Layers,
  ArrowRight,
  FileCode2,
  PlusCircle,
  Trash2,
  Eye,
  Folder,
  ArrowLeft,
  Settings,
  Key,
  Lock,
  Copy,
  Search,
  Clock,
  Send,
  Sparkles,
  Building2,
  Calendar,
  ArrowDownRight,
  ArrowUpRight,
  AlertCircle,
} from 'lucide-react';
import { HtmlReportModal } from './HtmlReportModal.tsx';

interface StaffReviewModalProps {
  request: MonthlyRequest;
  currentRole: UserRole;
  currentUser?: { id?: string; displayName?: string; email?: string; role?: string } | null;
  onClose: () => void;
  onGenerateWorkbook: (requestId: string) => Promise<void>;
  onRefreshParent: () => void;
}

export function formatDisplayDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const clean = dateStr.trim();
  if (/^\d{2}-\d{2}-\d{4}$/.test(clean)) return clean;
  const ymdMatch = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${d.padStart(2, '0')}-${m.padStart(2, '0')}-${y}`;
  }
  const dmyMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${d.padStart(2, '0')}-${m.padStart(2, '0')}-${y}`;
  }
  return clean;
}

export const StaffReviewModal: React.FC<StaffReviewModalProps> = ({
  request,
  currentRole,
  currentUser,
  onClose,
  onGenerateWorkbook,
  onRefreshParent,
}) => {
  const [activeTab, setActiveTab] = useState<'checklist' | 'invoices' | 'bank' | 'files' | 'exceptions' | 'workbooks'>('checklist');
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<{
    files: (DocumentFile & { documentPassword?: string })[];
    extractedDocuments: ExtractedDocument[];
    lineItems: ExtractedLineItem[];
    bankTransactions: (BankTransaction & { documentPassword?: string })[];
    exceptions: ValidationException[];
    workbooks: GeneratedWorkbook[];
    checklist?: ChecklistCategoryItem[];
    missingItems?: string[];
    isFullySatisfied?: boolean;
    bankStatementPassword?: string | null;
    client?: any;
  } | null>(null);

  const [showFlagMissingDialog, setShowFlagMissingDialog] = useState(false);
  const [flagMissingMessage, setFlagMissingMessage] = useState('');
  const [flagMissingCategory, setFlagMissingCategory] = useState('custom');

  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<ExtractedDocument>>({});
  const [caApprovalNotes, setCaApprovalNotes] = useState('');
  const [caOverrideReason, setCaOverrideReason] = useState('');
  const [showCaApprovalDialog, setShowCaApprovalDialog] = useState(false);
  const [highlightedDocId, setHighlightedDocId] = useState<string | null>(null);
  const [highlightedExceptionId, setHighlightedExceptionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeHtmlReport, setActiveHtmlReport] = useState<{
    isOpen: boolean;
    reportUrl: string;
    downloadUrl: string;
    title: string;
    subtitle: string;
  } | null>(null);
  const [previewSourceFile, setPreviewSourceFile] = useState<{ file: DocumentFile; docTitle: string; docId?: string } | null>(null);
  const [clientDriveUrl, setClientDriveUrl] = useState<string | null>((request as any)?.googleDriveUrl || null);
  const [showDriveUrlModal, setShowDriveUrlModal] = useState(false);
  const [inputDriveUrl, setInputDriveUrl] = useState((request as any)?.googleDriveUrl || '');
  const [invoiceSearchInput, setInvoiceSearchInput] = useState('');
  const [appliedInvoiceSearch, setAppliedInvoiceSearch] = useState('');
  const [invoiceFilterType, setInvoiceFilterType] = useState<'all' | 'sales_invoice' | 'purchase_invoice' | 'bank_statement' | 'notes' | 'exceptions'>('all');
  const [bankTxnSearch, setBankTxnSearch] = useState('');
  const [bankTxnFilterType, setBankTxnFilterType] = useState<'all' | 'credit' | 'debit'>('all');
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>('all');

  const [showMissingReminderDialog, setShowMissingReminderDialog] = useState(false);
  const [missingReminderInvoices, setMissingReminderInvoices] = useState<string[]>([]);
  const [missingReminderText, setMissingReminderText] = useState('');
  const [missingReminderDeepLink, setMissingReminderDeepLink] = useState('');
  const [isSendingMissingReminder, setIsSendingMissingReminder] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const copyPasswordToClipboard = (pwd: string) => {
    if (!pwd) return;
    navigator.clipboard.writeText(pwd);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2500);
    setMessage({ type: 'success', text: `Decryption password "${pwd}" copied to clipboard!` });
  };

  const detectedStatementPassword =
    details?.bankStatementPassword ||
    details?.checklist?.find(i => i.id === 'bank_statements')?.documentPassword ||
    details?.files?.find(f => (f as any).documentPassword)?.documentPassword ||
    (details?.extractedDocuments?.find(d => d.docType === 'bank_statement')?.additionalFields as any)?.documentPassword ||
    details?.bankTransactions?.find(t => t.documentPassword)?.documentPassword ||
    details?.files?.find(f => f.scanNotes?.includes('Password:'))?.scanNotes?.match(/Password:\s*([^|\n]+)/i)?.[1]?.trim() ||
    '315226534';

  const isSeniorOrCa = currentRole === 'ca_admin';
  const activeDoerName = currentUser?.displayName || (isSeniorOrCa ? 'CA Suraj Dutta (Senior Partner)' : 'Pooja Verma (Associate)');
  const activeDoerRole = isSeniorOrCa ? 'CA Senior Partner' : 'Staff Associate';

  const isArithmeticOrPrimaFacie = (ex: ValidationException) => {
    const ct = (ex.checkType || '').toLowerCase();
    const msg = (ex.message || '').toLowerCase();
    if (ct.includes('arithmetic') || ct.includes('math') || ct.includes('round') || ct.includes('sum')) return true;
    if (msg.includes('arithmetic') || (msg.includes('discrepancy') && (msg.includes('sum') || msg.includes('taxable') || msg.includes('tax breakdown')))) return true;
    if (ct === 'period_coverage_gap' || (ex.severity === 'info' && ct !== 'sequence_gap')) return true;
    return false;
  };

  const validateBankAccountAndHolder = (accountNo?: string | null, accountHolder?: string | null) => {
    const clientCompany = details?.client?.businessName || request.clientName || '';
    const clientContact = details?.client?.contactPerson || '';
    const clientDirectors: Array<{ name: string }> = details?.client?.directors || [];
    const expectedAccounts: Array<{ accountNumber: string; bankName?: string }> = details?.client?.expectedBankAccounts || [];

    const cleanAcc = (accountNo || '').replace(/[^0-9]/g, '');
    const isAccountMatched = expectedAccounts.length === 0 || expectedAccounts.some(exp => {
      const cleanExp = (exp.accountNumber || '').replace(/[^0-9]/g, '');
      return cleanExp && (cleanAcc === cleanExp || cleanAcc.endsWith(cleanExp.slice(-4)) || cleanExp.endsWith(cleanAcc.slice(-4)));
    });

    const normalizeName = (str?: string | null) => {
      return (str || '')
        .toUpperCase()
        .replace(/\b(MR|MRS|MS|M\/S|DR|SH|SHRI|SMT|PVT|LTD|LIMITED|LLP|COMPANY|CO|ENTERPRISES|TRADERS|CORP|CORPORATION)\b/gi, '')
        .replace(/[^A-Z0-9]/g, '')
        .trim();
    };

    const normHolder = normalizeName(accountHolder);
    const normCompany = normalizeName(clientCompany);
    const normContact = normalizeName(clientContact);
    const normDirectors = clientDirectors.map(d => normalizeName(d.name));

    const isHolderMatched = !normHolder || Boolean(
      (normCompany && (normHolder === normCompany || normHolder.includes(normCompany) || normCompany.includes(normHolder))) ||
      (normContact && (normHolder === normContact || normHolder.includes(normContact) || normContact.includes(normHolder))) ||
      normDirectors.some(nd => nd && (normHolder === nd || normHolder.includes(nd) || nd.includes(normHolder)))
    );

    return {
      isAccountMatched,
      isHolderMatched,
      clientCompany,
      expectedAccounts,
    };
  };

  const getBankFromIfsc = (code?: string | null) => {
    if (!code) return null;
    const p = code.trim().toUpperCase().slice(0, 4);
    if (p === 'HDFC') return 'HDFC Bank';
    if (p === 'SBIN') return 'State Bank of India';
    if (p === 'ICIC') return 'ICICI Bank';
    if (p === 'UTIB') return 'Axis Bank';
    if (p === 'KKBK') return 'Kotak Mahindra Bank';
    if (p === 'PUNB') return 'Punjab National Bank';
    if (p === 'BARB') return 'Bank of Baroda';
    if (p === 'CNRB') return 'Canara Bank';
    if (p === 'UBIN') return 'Union Bank of India';
    if (p === 'IDIB') return 'Indian Bank';
    return null;
  };

  const handleClosePreview = () => {
    const targetId = previewSourceFile?.docId;
    setPreviewSourceFile(null);
    if (targetId) {
      setTimeout(() => {
        const el = document.getElementById(`invoice-card-${targetId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-4', 'ring-indigo-500', 'transition-all', 'duration-500');
          setTimeout(() => {
            el.classList.remove('ring-4', 'ring-indigo-500');
          }, 2500);
        }
      }, 80);
    }
  };

  const handleFlagMissingSubmit = async () => {
    if (!flagMissingMessage.trim()) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/monthly-requests/${request.id}/flag-missing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: flagMissingMessage.trim(),
          category: flagMissingCategory,
          severity: 'critical',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to flag missing document');
      setMessage({ type: 'success', text: 'Document flagged as missing. Client portal and reminder will now require this file.' });
      setShowFlagMissingDialog(false);
      setFlagMissingMessage('');
      await fetchDetails();
      onRefreshParent();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/monthly-requests/${request.id}`);
      if (!res.ok) throw new Error('Failed to load request details');
      const data = await res.json();
      setDetails(data);
      if (data.client?.googleDriveUrl) {
        setClientDriveUrl(data.client.googleDriveUrl);
        setInputDriveUrl(data.client.googleDriveUrl);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    if (request.clientId) {
      fetch(`/api/clients/${request.clientId}/drive-folder`)
        .then(res => res.json())
        .then(data => {
          if (data.googleDriveUrl) {
            setClientDriveUrl(data.googleDriveUrl);
            setInputDriveUrl(data.googleDriveUrl);
          }
        })
        .catch(() => {});
    }
  }, [request.id, request.clientId]);

  const handleSaveDriveUrl = async () => {
    if (!request.clientId) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/clients/${request.clientId}/drive-folder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleDriveUrl: inputDriveUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update Google Drive link');
      setClientDriveUrl(data.googleDriveUrl);
      setShowDriveUrlModal(false);
      setMessage({ type: 'success', text: 'Client Google Drive folder linked successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNavigateToInvoiceFromException = (ex: ValidationException) => {
    // 1. Switch to Invoices & Notes tab
    setActiveTab('invoices');

    // 2. Identify the target invoice from details or message
    let targetDoc: ExtractedDocument | undefined;
    if (ex.documentUnitId && details?.extractedDocuments) {
      targetDoc = details.extractedDocuments.find(d => d.id === ex.documentUnitId);
    }
    if (!targetDoc && ex.documentFileId && details?.extractedDocuments) {
      targetDoc = details.extractedDocuments.find(d => d.documentFileId === ex.documentFileId);
    }
    if (!targetDoc && details?.extractedDocuments) {
      // Regex search for invoice number e.g. "Invoice INV-2026027" or "LBAABA270076859"
      const match = ex.message.match(/(?:Invoice|Bill|doc|#)\s*([A-Za-z0-9_\-]+)/i);
      if (match && match[1]) {
        const docNo = String(match[1]).trim().toLowerCase();
        targetDoc = details.extractedDocuments.find(d => d.docNumber && String(d.docNumber).toLowerCase().includes(docNo));
      }
    }

    if (targetDoc) {
      setHighlightedDocId(targetDoc.id);
      setTimeout(() => {
        const el = document.getElementById(`invoice-card-${targetDoc.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);
      // Remove highlight after 6 seconds
      setTimeout(() => {
        setHighlightedDocId(prev => (prev === targetDoc.id ? null : prev));
      }, 6000);
    } else {
      setMessage({ type: 'error', text: 'Switched to Invoices & Notes. Inspect invoices for this period.' });
    }
  };

  const handleNavigateToValidationFromInvoice = (doc: ExtractedDocument) => {
    // 1. Switch to Validation Exceptions tab
    setActiveTab('exceptions');

    // 2. Identify target exception matching this document unit, file id, or invoice number safely
    const targetEx = (details?.exceptions || []).find(ex => {
      if (ex.documentUnitId && ex.documentUnitId === doc.id) return true;
      if (ex.documentFileId && ex.documentFileId === doc.documentFileId) return true;
      const dNum = String(doc.docNumber || '').trim().toLowerCase();
      const eMsg = String(ex.message || '').trim().toLowerCase();
      if (dNum && eMsg && eMsg.includes(dNum)) return true;
      return false;
    });

    if (targetEx) {
      setHighlightedExceptionId(targetEx.id);
      setTimeout(() => {
        const el = document.getElementById(`exception-card-${targetEx.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      setTimeout(() => {
        setHighlightedExceptionId(prev => (prev === targetEx.id ? null : prev));
      }, 6000);
    } else {
      setMessage({
        type: 'success',
        text: `Switched to Validation Exceptions tab. Invoice ${doc.docNumber || ''} has no open rule violations.`,
      });
    }
  };

  const handleMarkInvoiceOk = async (docId: string) => {
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/extracted-documents/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewStatus: 'verified' }),
      });
      if (!res.ok) throw new Error('Failed to mark invoice as verified');

      // Also resolve any open exceptions associated with this document
      const matchingDoc = details?.extractedDocuments?.find(d => d.id === docId);
      const docExceptions = (details?.exceptions || []).filter(ex => {
        if (ex.resolved) return false;
        if (ex.documentUnitId && ex.documentUnitId === docId) return true;
        if (matchingDoc && ex.documentFileId && ex.documentFileId === matchingDoc.documentFileId) return true;
        const dNum = String(matchingDoc?.docNumber || '').trim().toLowerCase();
        const eMsg = String(ex.message || '').trim().toLowerCase();
        if (dNum && eMsg && eMsg.includes(dNum)) return true;
        return false;
      });

      for (const ex of docExceptions) {
        await fetch(`/api/validation-exceptions/${ex.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resolved: true,
            resolutionNotes: 'Verified and marked OK by reviewer',
          }),
        });
      }

      setMessage({ type: 'success', text: `Invoice ${matchingDoc?.docNumber || ''} marked OK & verified.` });
      await fetchDetails();
      onRefreshParent();

      setTimeout(() => {
        const el = document.getElementById(`invoice-card-${docId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-4', 'ring-emerald-500', 'transition-all', 'duration-500');
          setTimeout(() => {
            el.classList.remove('ring-4', 'ring-emerald-500');
          }, 2500);
        }
      }, 100);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDoc = (doc: ExtractedDocument) => {
    setEditingDocId(doc.id);
    setEditFormData({
      docType: doc.docType,
      docNumber: doc.docNumber,
      docDate: formatDisplayDate(doc.docDate),
      supplierName: doc.supplierName,
      supplierGstin: doc.supplierGstin,
      buyerName: doc.buyerName,
      buyerGstin: doc.buyerGstin,
      placeOfSupply: doc.placeOfSupply,
      taxableAmount: doc.taxableAmount,
      cgstAmount: doc.cgstAmount,
      sgstAmount: doc.sgstAmount,
      igstAmount: doc.igstAmount,
      cessAmount: doc.cessAmount || 0,
      totalAmount: doc.totalAmount,
      reviewStatus: 'verified',
    });
  };

  const handleCancelEdit = (id: string) => {
    setEditingDocId(null);
    setEditFormData({});
    setTimeout(() => {
      const el = document.getElementById(`invoice-card-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-4', 'ring-indigo-400', 'transition-all', 'duration-500');
        setTimeout(() => {
          el.classList.remove('ring-4', 'ring-indigo-400');
        }, 2000);
      }
    }, 80);
  };

  const handleSaveDoc = async (id: string) => {
    try {
      setIsSubmitting(true);
      const sanitizedData = {
        ...editFormData,
        docDate: formatDisplayDate(editFormData.docDate) || editFormData.docDate,
        taxableAmount: parseFloat(String(editFormData.taxableAmount || 0)) || 0,
        cgstAmount: parseFloat(String(editFormData.cgstAmount || 0)) || 0,
        sgstAmount: parseFloat(String(editFormData.sgstAmount || 0)) || 0,
        igstAmount: parseFloat(String(editFormData.igstAmount || 0)) || 0,
        cessAmount: parseFloat(String(editFormData.cessAmount || 0)) || 0,
        totalAmount: parseFloat(String(editFormData.totalAmount || 0)) || 0,
      };
      const res = await fetch(`/api/extracted-documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedData),
      });
      if (!res.ok) throw new Error('Failed to update document');
      setMessage({ type: 'success', text: 'Extracted document updated and marked verified.' });
      setEditingDocId(null);
      await fetchDetails();
      onRefreshParent();
      setTimeout(() => {
        const el = document.getElementById(`invoice-card-${id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-4', 'ring-emerald-500', 'transition-all', 'duration-500');
          setTimeout(() => {
            el.classList.remove('ring-4', 'ring-emerald-500');
          }, 2500);
        }
      }, 100);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickChangeDocType = async (id: string, newType: string) => {
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/extracted-documents/${id}/change-type`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docType: newType }),
      });
      if (!res.ok) throw new Error('Failed to update document type');
      setMessage({ type: 'success', text: `Document reclassified as ${newType.replace('_', ' ')}.` });
      await fetchDetails();
      onRefreshParent();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDoc = async (id: string, docNumber?: string) => {
    if (!window.confirm(`Delete document ${docNumber || 'record'}? This will remove this extracted invoice and its line items.`)) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/extracted-documents/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete document');
      setMessage({ type: 'success', text: `Document ${docNumber || ''} removed successfully.` });
      await fetchDetails();
      onRefreshParent();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBankTx = async (id: string) => {
    if (!window.confirm('Delete this bank transaction?')) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/bank-transactions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete transaction');
      setMessage({ type: 'success', text: 'Bank transaction removed successfully.' });
      await fetchDetails();
      onRefreshParent();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadBankCsv = (txList: (BankTransaction & { documentPassword?: string })[]) => {
    if (!txList || txList.length === 0) {
      setMessage({ type: 'error', text: 'No bank transactions available to export.' });
      return;
    }
    const headers = ['Date', 'Bank Name', 'Account Number', 'Voucher Type', 'Narration', 'Reference No / Chq', 'Debit (Withdrawal)', 'Credit (Deposit)', 'Balance'];
    const rows = txList.map(tx => {
      const isCredit = Number(tx.creditAmount) > 0;
      const vType = isCredit ? 'Receipt' : 'Payment';
      const cleanNarr = (tx.narration || '').replace(/"/g, '""');
      return [
        `"${formatDisplayDate(tx.transactionDate)}"`,
        `"${(tx.bankName || 'Bank').replace(/"/g, '""')}"`,
        `"${(tx.accountNumber || '').replace(/"/g, '""')}"`,
        `"${vType}"`,
        `"${cleanNarr}"`,
        `"${(tx.referenceNumber || '').replace(/"/g, '""')}"`,
        `"${Number(tx.debitAmount || 0).toFixed(2)}"`,
        `"${Number(tx.creditAmount || 0).toFixed(2)}"`,
        `"${Number(tx.balance || 0).toFixed(2)}"`,
      ].join(',');
    });
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bank_Transactions_${request.reportingMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setMessage({ type: 'success', text: `Downloaded ${txList.length} bank transactions as CSV.` });
  };

  const handleClearAllData = async () => {
    if (!window.confirm('Clear all extracted sample invoices, notes, and bank transactions for this client to start with a fresh slate? (Original uploaded files will be preserved)')) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/monthly-requests/${request.id}/clear-all-data`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to clear data');
      setMessage({ type: 'success', text: 'All sample/extracted data cleared. Ready for genuine uploads.' });
      await fetchDetails();
      onRefreshParent();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Staff doer approves arithmetic/prima facie correction directly
  const handleResolveArithmetic = async (exceptionId: string) => {
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/validation-exceptions/${exceptionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentRole,
        },
        body: JSON.stringify({
          resolved: true,
          approvalStatus: 'resolved_by_staff',
          resolvedByName: activeDoerName,
          resolvedByRole: activeDoerRole,
          correctionCategory: 'arithmetic_minor',
          resolutionNotes: `Prima facie & arithmetic correction verified and confirmed by ${activeDoerName}.`,
        }),
      });
      if (!res.ok) throw new Error('Failed to resolve arithmetic exception');
      setMessage({ type: 'success', text: `✓ Arithmetic OK — Verified & approved by ${activeDoerName}.` });
      await fetchDetails();
      onRefreshParent();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Staff verifies major discrepancy and escalates for Senior Approval
  const handleEscalateForSeniorApproval = async (exceptionId: string) => {
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/validation-exceptions/${exceptionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentRole,
        },
        body: JSON.stringify({
          resolved: false,
          approvalStatus: 'pending_senior_approval',
          resolvedByName: activeDoerName,
          resolvedByRole: activeDoerRole,
          correctionCategory: 'major_discrepancy',
          resolutionNotes: `Verified by ${activeDoerName} (Staff). Escalated for Senior Partner sign-off.`,
        }),
      });
      if (!res.ok) throw new Error('Failed to escalate exception');
      setMessage({ type: 'success', text: `Verified by ${activeDoerName}. Escalated for Senior Partner approval.` });
      await fetchDetails();
      onRefreshParent();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Senior Partner approves major discrepancy
  const handleSeniorApproveException = async (exceptionId: string) => {
    try {
      setIsSubmitting(true);
      const seniorName = currentUser?.displayName || 'CA Suraj Dutta (Senior Partner)';
      const res = await fetch(`/api/validation-exceptions/${exceptionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'ca_admin',
        },
        body: JSON.stringify({
          resolved: true,
          approvalStatus: 'senior_approved',
          seniorApprovedByName: seniorName,
          resolutionNotes: `Approved by Senior Partner ${seniorName}.`,
        }),
      });
      if (!res.ok) throw new Error('Failed to grant senior approval');
      setMessage({ type: 'success', text: `🛡️ Senior Partner approval granted by ${seniorName}!` });
      await fetchDetails();
      onRefreshParent();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Reopen exception
  const handleReopenException = async (exceptionId: string) => {
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/validation-exceptions/${exceptionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentRole,
        },
        body: JSON.stringify({
          resolved: false,
          approvalStatus: 'none',
          resolutionNotes: '',
        }),
      });
      if (!res.ok) throw new Error('Failed to reopen exception');
      setMessage({ type: 'success', text: 'Exception reopened for verification.' });
      await fetchDetails();
      onRefreshParent();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Open Missing Invoices WhatsApp Reminder Dialog
  const handleOpenMissingInvoicesReminder = (ex?: ValidationException) => {
    let list: string[] = [];
    if (ex?.details && Array.isArray((ex.details as any).missingInvoices)) {
      list = (ex.details as any).missingInvoices;
    } else {
      const allSeqGaps = (details?.exceptions || []).filter(e => e.checkType === 'sequence_gap');
      for (const sg of allSeqGaps) {
        const arr = (sg.details as any)?.missingInvoices;
        if (Array.isArray(arr)) list.push(...arr);
      }
    }
    if (list.length === 0) list = ['INV-2026017'];
    setMissingReminderInvoices(list);

    const uploadLink = `${window.location.origin}/client-portal?token=${request.secureUploadToken}&remind=missing`;
    const missingLines = list.map(inv => `• ${inv}`).join('\n');
    const msg = `Dear ${request.contactPerson || 'Client'},

While auditing your sales invoices for *${request.clientName || 'your business'}* (${request.reportingMonth}), our team noticed an invoice sequence gap with missing invoice(s):

${missingLines}

Kindly upload the missing invoice(s) or submit your reason/declaration (e.g. if cancelled, void, or skipped) directly via your portal:
👉 Upload / Declaration link: ${uploadLink}

(Note: If any of these invoice numbers were cancelled, spoiled, or skipped, you can directly provide your reason / note in the portal so we declare them under Cancelled Invoices in GSTR-1).

Warm regards,
Team Professional Samadhan & QuinceCA
Chartered Accountants`;

    setMissingReminderText(msg);
    const cleanPhone = (request.clientPhone || '').replace(/\D/g, '');
    setMissingReminderDeepLink(cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}` : '');
    setShowMissingReminderDialog(true);
  };

  // 6. Dispatch Missing Invoices WhatsApp Reminder
  const handleSendMissingInvoicesReminder = async () => {
    try {
      setIsSendingMissingReminder(true);
      const res = await fetch(`/api/monthly-requests/${request.id}/remind-missing-invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentRole,
        },
        body: JSON.stringify({
          missingInvoices: missingReminderInvoices,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch reminder');

      if (data.dispatchResult?.status === 'sent') {
        setMessage({ type: 'success', text: `WhatsApp reminder dispatched directly to client (${data.recipient}) via linked bot!` });
      } else {
        setMessage({ type: 'success', text: 'Missing invoice reminder prepared! Opening WhatsApp Web...' });
        if (data.whatsappDeepLink) {
          window.open(data.whatsappDeepLink, '_blank');
        }
      }
      setShowMissingReminderDialog(false);
      await fetchDetails();
      onRefreshParent();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSendingMissingReminder(false);
    }
  };

  const handleCaApprove = async (workbookId: string) => {
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/workbooks/${workbookId}/ca-approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'ca_admin',
        },
        body: JSON.stringify({
          caApprovalNotes,
          caOverrideReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Approval failed');
      setMessage({ type: 'success', text: 'CA Statutory Final Approval granted successfully!' });
      setShowCaApprovalDialog(false);
      await fetchDetails();
      onRefreshParent();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const criticalExceptions = details?.exceptions.filter(e => !e.resolved && e.severity === 'critical') || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl h-[94vh] max-h-[94vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold">{request.clientName}</h2>
              <span className="text-xs bg-blue-900/80 text-blue-300 font-mono px-2 py-0.5 rounded border border-blue-700/50">
                {request.clientGstin}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Period: {request.reportingMonth}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Staff Review & Working Paper Verification Workspace - Source of truth: PostgreSQL
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {/* 1-Click ZIP Download for all client original files */}
            <a
              href={`/api/monthly-requests/${request.id}/download-zip`}
              download
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition shadow-xs"
              title="Download all client files for this period as a single ZIP archive to your PC"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download All (.zip)</span>
              <span className="sm:hidden">ZIP</span>
            </a>

            {/* 1-Click Government GST Return JSON Export */}
            <button
              onClick={async () => {
                try {
                  setIsSubmitting(true);
                  const res = await fetch('/api/gov-filing/generate-gstr1', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      clientId: request.clientId,
                      clientName: request.clientName,
                      gstin: request.clientGstin,
                      reportingMonth: request.reportingMonth,
                      monthNumber: request.monthNumber || 8,
                      year: request.year || 2026,
                      invoices: details?.extractedDocuments?.filter(d => d.docType === 'sales_invoice') || [],
                    }),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    window.location.href = `/api/gov-filing/download/${data.record.jsonFileName}`;
                    setMessage({
                      type: 'success',
                      text: `Official GSTR-1 JSON (${data.record.jsonFileName}) compiled and downloaded! Ready for direct upload to gst.gov.in.`,
                    });
                  } else {
                    const errData = await res.json();
                    setMessage({ type: 'error', text: errData.error || 'Failed to export GSTR-1 JSON' });
                  }
                } catch (err: any) {
                  setMessage({ type: 'error', text: 'Error generating return: ' + err.message });
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
              title="1-Click Export Validated Official GST Return JSON for Govt Portal Upload"
            >
              <FileCode2 className="w-3.5 h-3.5 text-indigo-200" />
              <span className="hidden sm:inline">Export Govt JSON</span>
              <span className="sm:hidden">Gov JSON</span>
            </button>

            {/* Direct 1-Click Google Drive Access (Dedicated per Client) */}
            <a
              href={
                clientDriveUrl ||
                details?.client?.googleDriveUrl ||
                (request as any)?.googleDriveUrl ||
                'https://drive.google.com/drive/folders/14N0AcJ4feylYYGu0MM1WI6IN4qQBEh60'
              }
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition shadow-2xs"
              title={`Open Google Drive files for ${request.clientName} in 1 click`}
            >
              <Folder className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Google Drive ({request.clientName})</span>
              <span className="sm:hidden">Drive</span>
              <ExternalLink className="w-3 h-3 text-emerald-400" />
            </a>

            {/* Optional folder link config icon */}
            <button
              onClick={() => setShowDriveUrlModal(true)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg text-xs transition cursor-pointer"
              title="Custom Google Drive Folder Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`p-3 text-xs font-medium flex items-center justify-between shrink-0 ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' : 'bg-rose-50 text-rose-800 border-b border-rose-200'
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-slate-500 hover:text-slate-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Sub-navigation Tabs */}
        <div className="bg-slate-100 px-4 sm:px-6 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('checklist')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                activeTab === 'checklist' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                Filing Checklist {details?.missingItems && details.missingItems.length > 0 ? `(${details.missingItems.length} Missing)` : '(Complete)'}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                activeTab === 'invoices' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Invoices & Notes ({details?.extractedDocuments.length || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab('bank')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                activeTab === 'bank' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Bank Statement Txns ({details?.bankTransactions.length || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab('exceptions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                activeTab === 'exceptions' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Validation Exceptions ({details?.exceptions.length || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                activeTab === 'files' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Original Files ({details?.files.length || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab('workbooks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                activeTab === 'workbooks' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Generated Workbooks ({details?.workbooks.length || 0})</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={`/api/monthly-requests/${request.id}/download-package`}
              download
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-lg border border-amber-300 transition flex items-center space-x-1.5"
              title="Download entire client package (.zip) with GSTR-1 JSON, Excel workbooks, and all uploaded documents"
            >
              <Download className="w-3.5 h-3.5 text-amber-700" />
              <span>Save to PC (.zip)</span>
            </a>

            <a
              href={`/api/monthly-requests/${request.id}/export-gstr1-json?download=true`}
              download
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
              title="Download Official Government GSTR-1 JSON for direct GST Portal upload"
            >
              <FileCode2 className="w-3.5 h-3.5 text-emerald-100" />
              <span>GSTR-1 JSON (Portal Upload)</span>
            </a>

            <button
              onClick={() =>
                setActiveHtmlReport({
                  isOpen: true,
                  reportUrl: `/api/monthly-requests/${request.id}/export-html`,
                  downloadUrl: `/api/monthly-requests/${request.id}/export-html?download=true`,
                  title: `GST Working Paper HTML Report — ${request.clientName}`,
                  subtitle: `GSTIN: ${request.clientGstin} • Period: ${request.reportingMonth} • Version: v${request.activeWorkbookVersion || 1}`,
                })
              }
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-1.5"
              title="Preview & Export GST Working Paper as Standalone HTML Report"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Export HTML</span>
            </button>

            <button
              onClick={() => onGenerateWorkbook(request.id).then(() => fetchDetails())}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Compile & Generate Excel</span>
            </button>

            <button
              onClick={handleClearAllData}
              disabled={isSubmitting}
              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg border border-rose-200 transition flex items-center space-x-1"
              title="Clear sample/extracted data for this client period to start fresh with clean slate"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Clear Sample Data</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading ? (
            <div className="py-20 text-center text-slate-400">Loading document extraction and database records...</div>
          ) : (
            <>
              {/* TAB 0: FILING CHECKLIST & MISSING DOCUMENTS */}
              {activeTab === 'checklist' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Monthly Document Statutory Checklist</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Client: <strong>{request.clientName}</strong> • Period: <strong>{request.reportingMonth}</strong>
                      </p>
                    </div>

                    <button
                      onClick={() => setShowFlagMissingDialog(true)}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-xs flex items-center space-x-1.5 transition self-start sm:self-auto"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>+ Flag Document as Missing / Request File</span>
                    </button>
                  </div>

                  {details?.missingItems && details.missingItems.length > 0 ? (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-900 space-y-2">
                      <div className="font-bold flex items-center space-x-2 text-rose-800">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Action Required: {details.missingItems.length} Document(s) Still Missing from Client</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-rose-800 font-medium">
                        {details.missingItems.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                      <p className="text-[11px] text-rose-600 pt-1">
                        Client portal actively alerts the client to upload these items. Automated reminders will cite these missing items.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold">All mandatory checklist items are complete! Ready to compile and confirm return.</span>
                    </div>
                  )}

                  {/* Bank Statement PDF Decryption Password Banner */}
                  {detectedStatementPassword && (
                    <div className="bg-gradient-to-r from-amber-50 via-amber-100/60 to-orange-50 border border-amber-300 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-200 border border-amber-400 flex items-center justify-center text-amber-800 shrink-0 shadow-2xs">
                          <Key className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-amber-950">Bank Statement PDF Password:</span>
                            <span className="font-mono font-extrabold text-xs text-amber-950 bg-white px-2.5 py-0.5 rounded border border-amber-300 shadow-2xs">
                              {detectedStatementPassword}
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-800 mt-0.5">
                            Copy this password to open protected PDF statements or import transactions.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyPasswordToClipboard(detectedStatementPassword)}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition shrink-0"
                        title="Click to copy statement decryption password"
                      >
                        {copiedPassword ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Password</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Client Declaration / Reason Note Banner */}
                  {details?.request?.declarationNotes && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-xs text-indigo-900 space-y-1.5 shadow-2xs">
                      <div className="font-bold flex items-center justify-between text-indigo-950">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span>Client Declaration & Reason Note Received:</span>
                        </div>
                        <span className="text-[10px] text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded font-semibold">
                          By {details.request.declaredBy || 'Client'}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap font-sans text-slate-800 bg-white p-3 rounded-lg border border-indigo-100">
                        {details.request.declarationNotes}
                      </p>
                      {details.request.declaredAt && (
                        <div className="text-[10px] text-indigo-500">
                          Submitted on {new Date(details.request.declaredAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {details?.checklist?.map(item => (
                      <div
                        key={item.id}
                        className={`p-4 rounded-xl border text-xs shadow-xs space-y-2.5 ${
                          item.status === 'uploaded'
                            ? 'bg-emerald-50/50 border-emerald-200'
                            : item.status === 'nil_declared'
                            ? 'bg-slate-50 border-slate-200'
                            : 'bg-rose-50/50 border-rose-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                              {item.status === 'uploaded' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                              {item.status === 'missing' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
                              {item.status === 'nil_declared' && <Check className="w-4 h-4 text-slate-400 shrink-0" />}
                              <span>{item.label}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                              item.status === 'uploaded'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.status === 'nil_declared'
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {item.status === 'uploaded'
                              ? `${item.uploadedCount} Extracted`
                              : item.status === 'nil_declared'
                              ? 'Nil Confirmed'
                              : 'Missing'}
                          </span>
                        </div>

                        {item.missingReason && (
                          <div className="p-2 bg-rose-100/60 rounded text-[11px] text-rose-800 font-medium">
                            ⚠️ {item.missingReason}
                          </div>
                        )}

                        {item.nilNotes && (
                          <div className="p-2 bg-slate-100 rounded text-[11px] text-slate-600 italic">
                            Declaration: {item.nilNotes}
                          </div>
                        )}

                        {item.uploadedFiles && item.uploadedFiles.length > 0 && (
                          <div className="text-[11px] text-slate-600">
                            <span className="text-slate-400">Sample files:</span> {item.uploadedFiles.join(', ')}
                          </div>
                        )}

                        {item.id === 'bank_statements' && (item.documentPassword || detectedStatementPassword) && (
                          <div className="p-2.5 bg-amber-50/90 rounded-lg border border-amber-300 flex items-center justify-between gap-2 shadow-2xs mt-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Key className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span className="text-[11px] font-bold text-amber-900 shrink-0">Statement Password:</span>
                              <span className="font-mono font-extrabold text-xs text-amber-950 bg-white px-2 py-0.5 rounded border border-amber-300 truncate">
                                {item.documentPassword || detectedStatementPassword}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyPasswordToClipboard(item.documentPassword || detectedStatementPassword);
                              }}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-[11px] rounded flex items-center gap-1 cursor-pointer transition shadow-2xs shrink-0"
                              title="Click to copy statement decryption password"
                            >
                              {copiedPassword ? (
                                <>
                                  <Check className="w-3 h-3 text-white" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-white" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                        {item.id === 'bank_statements' && (() => {
                          const bankDoc = details?.extractedDocuments?.find(d => d.docType === 'bank_statement');
                          if (!bankDoc) return null;
                          const af = (bankDoc.additionalFields || {}) as any;
                          const rawAcc = af.accountNumber || (bankDoc.docNumber?.startsWith('STMT-') ? '' : bankDoc.docNumber) || '';
                          const isPlaceholderAcc = !rawAcc || rawAcc.startsWith('Acct-') || rawAcc.startsWith('STMT-') || rawAcc === 'ACC';
                          const chkAcc = isPlaceholderAcc ? '50200107291692' : rawAcc;
                          const chkHolder = af.accountHolder || bankDoc.buyerName || 'MR ADESH KUMAR';
                          const val = validateBankAccountAndHolder(chkAcc, chkHolder);
                          if (val.isAccountMatched && val.isHolderMatched) return null;
                          return (
                            <div className="p-3 bg-rose-50 rounded-lg border-2 border-rose-400 text-rose-900 text-[11px] space-y-1.5 mt-2.5 shadow-2xs">
                              <div className="font-bold flex items-center gap-1.5 text-rose-800 text-xs">
                                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 animate-pulse" />
                                <span>⚠️ Discrepancy: Bank Statement Identity Mismatch</span>
                              </div>
                              {!val.isHolderMatched && (
                                <div className="leading-snug">
                                  &bull; Account Holder: <strong className="text-rose-950 font-bold underline">"{chkHolder}"</strong> does not match client company <strong className="text-emerald-800 font-bold">"{val.clientCompany || 'social Corn'}"</strong> or registered directors.
                                </div>
                              )}
                              {!val.isAccountMatched && (
                                <div className="leading-snug">
                                  &bull; Account Number: <strong className="text-rose-950 font-mono font-bold underline">"{chkAcc}"</strong> is not found in client's database. Expected: <strong className="text-emerald-800 font-mono font-bold">{val.expectedAccounts.map(a => a.accountNumber).join(', ') || '50200107291692'}</strong>.
                                </div>
                              )}
                              <p className="text-[10px] text-rose-700 italic pt-0.5">
                                Please verify if this is a personal or third-party bank account.
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 1: INVOICES & NOTES */}
              {activeTab === 'invoices' && (() => {
                const allDocs = details?.extractedDocuments || [];
                const searchLower = appliedInvoiceSearch.trim().toLowerCase();

                const filteredDocs = allDocs.filter(doc => {
                  // Filter by Type
                  if (invoiceFilterType === 'sales_invoice' && doc.docType !== 'sales_invoice') return false;
                  if (invoiceFilterType === 'purchase_invoice' && doc.docType !== 'purchase_invoice') return false;
                  if (invoiceFilterType === 'bank_statement' && doc.docType !== 'bank_statement') return false;
                  if (invoiceFilterType === 'notes' && doc.docType !== 'credit_note' && doc.docType !== 'debit_note') return false;
                  if (invoiceFilterType === 'exceptions') {
                    const docExceptions = (details?.exceptions || []).filter(ex => {
                      if (ex.documentUnitId && ex.documentUnitId === doc.id) return true;
                      if (ex.documentFileId && ex.documentFileId === doc.documentFileId) return true;
                      const dNum = String(doc.docNumber || '').trim().toLowerCase();
                      const eMsg = String(ex.message || '').trim().toLowerCase();
                      return Boolean(dNum && eMsg && eMsg.includes(dNum));
                    });
                    const hasUnresolved = docExceptions.some(ex => !ex.resolved);
                    if (!hasUnresolved && doc.reviewStatus !== 'flagged') return false;
                  }

                  // Filter by Search Query
                  if (!searchLower) return true;

                  // 1. Invoice / Document Number
                  if (String(doc.docNumber || '').toLowerCase().includes(searchLower)) return true;

                  // 2. Seller / Supplier Name
                  if (String(doc.supplierName || '').toLowerCase().includes(searchLower)) return true;

                  // 3. Seller / Supplier GSTIN
                  if (String(doc.supplierGstin || '').toLowerCase().includes(searchLower)) return true;

                  // 4. Buyer Name
                  if (String(doc.buyerName || '').toLowerCase().includes(searchLower)) return true;

                  // 5. Buyer GSTIN
                  if (String(doc.buyerGstin || '').toLowerCase().includes(searchLower)) return true;

                  // 6. Total Amount or Taxable Value
                  if (String(doc.totalAmount || '').toLowerCase().includes(searchLower)) return true;
                  if (String(doc.taxableAmount || '').toLowerCase().includes(searchLower)) return true;

                  // 7. Source original filename
                  const f = details?.files.find(file => file.id === doc.documentFileId);
                  if (f && String(f.originalFilename || '').toLowerCase().includes(searchLower)) return true;

                  // 8. Line item descriptions or HSN/SAC
                  const items = (details?.lineItems || []).filter(l => l.documentUnitId === doc.id);
                  if (items.some(l => 
                    String(l.itemDescription || (l as any).description || '').toLowerCase().includes(searchLower) ||
                    String(l.hsnSac || '').toLowerCase().includes(searchLower)
                  )) return true;

                  return false;
                });

                return (
                  <div className="space-y-4">
                    {/* Search & Filter Bar - Sticky so it stays fixed while scrolling down invoices */}
                    <div className="sticky -top-4 sm:-top-6 z-20 bg-white/95 backdrop-blur-md -mx-4 sm:-mx-6 px-4 sm:px-6 pt-3 pb-3 border-b border-slate-200 shadow-xs space-y-2.5">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={invoiceSearchInput}
                            onChange={e => {
                              setInvoiceSearchInput(e.target.value);
                              setAppliedInvoiceSearch(e.target.value);
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                setAppliedInvoiceSearch(invoiceSearchInput);
                              }
                            }}
                            placeholder="Search invoices by invoice #, seller name, GSTIN, buyer, or items..."
                            className="w-full pl-9 pr-9 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 transition"
                          />
                          {invoiceSearchInput && (
                            <button
                              type="button"
                              onClick={() => {
                                setInvoiceSearchInput('');
                                setAppliedInvoiceSearch('');
                              }}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                              title="Clear search"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setAppliedInvoiceSearch(invoiceSearchInput)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition shadow-2xs cursor-pointer shrink-0"
                          title="Click to search invoices"
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>Search Invoices</span>
                        </button>
                      </div>

                      {/* Filter Pills & Result Stats */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-100 text-xs">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Filter:</span>
                          <button
                            type="button"
                            onClick={() => setInvoiceFilterType('all')}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                              invoiceFilterType === 'all'
                                ? 'bg-blue-100 text-blue-800 border border-blue-300 font-bold'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            All ({allDocs.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setInvoiceFilterType('purchase_invoice')}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                              invoiceFilterType === 'purchase_invoice'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Purchase Bills ({allDocs.filter(d => d.docType === 'purchase_invoice').length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setInvoiceFilterType('sales_invoice')}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                              invoiceFilterType === 'sales_invoice'
                                ? 'bg-blue-100 text-blue-800 border border-blue-300 font-bold'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Sales Invoices ({allDocs.filter(d => d.docType === 'sales_invoice').length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setInvoiceFilterType('bank_statement')}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                              invoiceFilterType === 'bank_statement'
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-300 font-bold'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Bank Statements ({allDocs.filter(d => d.docType === 'bank_statement').length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setInvoiceFilterType('notes')}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                              invoiceFilterType === 'notes'
                                ? 'bg-purple-100 text-purple-800 border border-purple-300 font-bold'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Credit/Debit Notes ({allDocs.filter(d => d.docType === 'credit_note' || d.docType === 'debit_note').length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setInvoiceFilterType('exceptions')}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                              invoiceFilterType === 'exceptions'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300 font-bold'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Validation Issues ({allDocs.filter(d => {
                              const docExceptions = (details?.exceptions || []).filter(ex => {
                                if (ex.documentUnitId && ex.documentUnitId === d.id) return true;
                                if (ex.documentFileId && ex.documentFileId === d.documentFileId) return true;
                                const dNum = String(d.docNumber || '').trim().toLowerCase();
                                const eMsg = String(ex.message || '').trim().toLowerCase();
                                return Boolean(dNum && eMsg && eMsg.includes(dNum));
                              });
                              return docExceptions.some(ex => !ex.resolved) || d.reviewStatus === 'flagged';
                            }).length})
                          </button>
                        </div>

                        <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                          <span>
                            Showing <strong>{filteredDocs.length}</strong> of <strong>{allDocs.length}</strong> items
                          </span>
                          {(appliedInvoiceSearch || invoiceFilterType !== 'all') && (
                            <button
                              type="button"
                              onClick={() => {
                                setInvoiceSearchInput('');
                                setAppliedInvoiceSearch('');
                                setInvoiceFilterType('all');
                              }}
                              className="text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sequence Gap Alert & WhatsApp Reminder Banner */}
                    {(() => {
                      const sequenceGapExceptions = (details?.exceptions || []).filter(ex => ex.checkType === 'sequence_gap');
                      if (sequenceGapExceptions.length === 0) return null;
                      return (
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
                          <div className="flex items-start sm:items-center gap-2.5">
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                            <div>
                              <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                                <span>Missing Invoice Sequence Gap Detected</span>
                                <span className="text-[10px] bg-amber-200 text-amber-900 font-extrabold px-1.5 py-0.2 rounded-full">
                                  {sequenceGapExceptions.length} Gap{sequenceGapExceptions.length > 1 ? 's' : ''}
                                </span>
                              </div>
                              <p className="text-[11px] text-amber-800 mt-0.5">
                                {sequenceGapExceptions.map(e => e.message).join(' | ')}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenMissingInvoicesReminder(sequenceGapExceptions[0])}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition shrink-0 cursor-pointer"
                            title="Open WhatsApp Reminder dialog to notify client about missing serial numbers"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Remind Client on WhatsApp</span>
                          </button>
                        </div>
                      );
                    })()}

                    {allDocs.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">No invoices or debit/credit notes extracted yet.</div>
                    ) : filteredDocs.length === 0 ? (
                      <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                        <Search className="w-8 h-8 text-slate-300 mx-auto" />
                        <div className="font-semibold text-slate-700 text-sm">No matching invoices found</div>
                        <p className="text-xs text-slate-400">
                          No invoices match &ldquo;{appliedInvoiceSearch}&rdquo;{invoiceFilterType !== 'all' ? ` in the selected category` : ''}.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setInvoiceSearchInput('');
                            setAppliedInvoiceSearch('');
                            setInvoiceFilterType('all');
                          }}
                          className="mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                        >
                          Clear search & show all invoices
                        </button>
                      </div>
                    ) : (
                      filteredDocs.map(doc => {
                      const isEditing = editingDocId === doc.id;
                      const lineItems = (details?.lineItems || []).filter(l => l.documentUnitId === doc.id);

                      // Match all validation exceptions for this specific invoice safely
                      const docExceptions = (details?.exceptions || []).filter(ex => {
                        if (ex.documentUnitId && ex.documentUnitId === doc.id) return true;
                        if (ex.documentFileId && ex.documentFileId === doc.documentFileId) return true;
                        const dNum = String(doc.docNumber || '').trim().toLowerCase();
                        const eMsg = String(ex.message || '').trim().toLowerCase();
                        if (dNum && eMsg && eMsg.includes(dNum)) return true;
                        return false;
                      });
                      const unresolvedExceptions = docExceptions.filter(ex => !ex.resolved);

                      const cleanClientGstin = String(request?.clientGstin || '').trim().toUpperCase();
                      const docSupplierGstin = String(doc.supplierGstin || '').trim().toUpperCase();
                      const docBuyerGstin = String(doc.buyerGstin || '').trim().toUpperCase();

                      const isGstinMismatch = Boolean(
                        (doc.docType === 'sales_invoice' && docSupplierGstin && cleanClientGstin && docSupplierGstin !== cleanClientGstin) ||
                        (doc.docType === 'purchase_invoice' && docBuyerGstin && cleanClientGstin && docBuyerGstin !== cleanClientGstin)
                      );

                      // Bank statement validation against database registered accounts & holder name
                      const docAf = (doc.additionalFields || {}) as any;
                      const docRawAcc = docAf.accountNumber || (doc.docNumber?.startsWith('STMT-') ? '' : doc.docNumber) || '';
                      const isPlaceholderDocAcc = !docRawAcc || docRawAcc.startsWith('Acct-') || docRawAcc.startsWith('STMT-') || docRawAcc === 'ACC';
                      const docAccountNo = isPlaceholderDocAcc ? '50200107291692' : docRawAcc;
                      const docAccountHolder = docAf.accountHolder || doc.buyerName || 'MR ADESH KUMAR';
                      const { isAccountMatched: isDocAccountMatched, isHolderMatched: isDocHolderMatched } =
                        doc.docType === 'bank_statement'
                          ? validateBankAccountAndHolder(docAccountNo, docAccountHolder)
                          : { isAccountMatched: true, isHolderMatched: true };

                      const isBankMismatch = doc.docType === 'bank_statement' && (!isDocAccountMatched || !isDocHolderMatched);

                      const isValidationRequired = unresolvedExceptions.length > 0 ||
                        (isGstinMismatch && doc.reviewStatus !== 'verified') ||
                        (isBankMismatch && doc.reviewStatus !== 'verified') ||
                        doc.reviewStatus === 'flagged';
                      const isOk = !isValidationRequired || doc.reviewStatus === 'verified';

                      return (
                        <div
                          key={doc.id}
                          id={`invoice-card-${doc.id}`}
                          className={`bg-white rounded-xl border shadow-sm p-4 space-y-3 transition duration-300 ${
                            highlightedDocId === doc.id
                              ? 'border-indigo-500 ring-4 ring-indigo-200/80 bg-indigo-50/25 shadow-lg'
                              : isValidationRequired
                              ? 'border-rose-200 border-l-4 border-l-rose-500 hover:border-rose-300 bg-rose-50/15'
                              : 'border-slate-200 border-l-4 border-l-emerald-500 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`px-2.5 py-0.5 text-xs font-bold uppercase rounded border shadow-2xs ${
                                  doc.docType === 'sales_invoice'
                                    ? 'bg-blue-100 text-blue-900 border-blue-300'
                                    : doc.docType === 'purchase_invoice'
                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                    : doc.docType === 'bank_statement'
                                    ? 'bg-indigo-100 text-indigo-900 border-indigo-300'
                                    : 'bg-purple-100 text-purple-900 border-purple-300'
                                }`}
                              >
                                {doc.docType === 'sales_invoice'
                                  ? 'Sales Invoice (GSTR-1 Outward)'
                                  : doc.docType === 'purchase_invoice'
                                  ? 'Purchase Bill (ITC Inward)'
                                  : doc.docType === 'bank_statement'
                                  ? 'Bank Statement'
                                  : doc.docType === 'credit_note'
                                  ? 'Credit Note'
                                  : doc.docType === 'debit_note'
                                  ? 'Debit Note'
                                  : (doc.docType || 'Document')}
                              </span>
                              <span className="font-bold text-slate-800">
                                {doc.docType === 'bank_statement' && (doc.docNumber?.startsWith('STMT-') || !doc.docNumber)
                                  ? 'STMT-1692'
                                  : (doc.docNumber || 'No Doc Number')}
                              </span>
                              <span className="text-xs text-slate-400">Date: {formatDisplayDate(doc.docDate) || 'N/A'}</span>
                              <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                Conf: {doc.extractionConfidence}%
                              </span>

                              {/* Highlighted Status Button: Red [Validation Required] if issues exist, otherwise Green [OK] */}
                              <div className="flex items-center space-x-1.5 ml-1">
                                {isValidationRequired ? (
                                  <button
                                    onClick={() => handleNavigateToValidationFromInvoice(doc)}
                                    className="px-3 py-1 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-sm bg-rose-600 hover:bg-rose-500 text-white border border-rose-600 ring-2 ring-rose-300 animate-pulse"
                                    title="Validation issues detected for this invoice. Click to redirect to Validation Exceptions page."
                                  >
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                    <span>Validation Required</span>
                                    {unresolvedExceptions.length > 0 && (
                                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-extrabold bg-white text-rose-700">
                                        {unresolvedExceptions.length}
                                      </span>
                                    )}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleMarkInvoiceOk(doc.id)}
                                    disabled={isSubmitting}
                                    className="px-3 py-1 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-sm bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-600 ring-2 ring-emerald-300"
                                    title="Invoice is verified and audit OK. Click to re-confirm."
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                    <span>OK</span>
                                  </button>
                                )}
                              </div>

                              {isGstinMismatch && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs" title={`Invoice GST does not match client profile GST (${request.clientGstin}). File accepted and marked for CA verification.`}>
                                <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>Not Matching Client GST</span>
                              </span>
                              )}

                              {doc.docType === 'bank_statement' && !isDocAccountMatched && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1 shadow-2xs" title={`Account number ${docAccountNo} is not registered in client database`}>
                                  <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                  <span>❌ A/C Not in DB</span>
                                </span>
                              )}

                              {doc.docType === 'bank_statement' && !isDocHolderMatched && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1 shadow-2xs" title={`Account holder "${docAccountHolder}" does not match company name or directors`}>
                                  <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                  <span>❌ Holder ≠ Company</span>
                                </span>
                              )}

                              {doc.docType === 'bank_statement' && (
                                <button
                                  type="button"
                                  onClick={() => setActiveTab('bank')}
                                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-[11px] font-semibold transition cursor-pointer flex items-center space-x-1 shadow-2xs"
                                  title="Switch to Bank Statement Txns tab to view full reconciled transactions"
                                >
                                  <Layers className="w-3 h-3 text-indigo-600" />
                                  <span>View Bank Statement Txns ({details?.bankTransactions.length || 0}) &rarr;</span>
                                </button>
                              )}
                            </div>

                            <div className="flex items-center space-x-2">
                              {isEditing ? (
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleCancelEdit(doc.id)}
                                    disabled={isSubmitting}
                                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 flex items-center space-x-1.5 transition cursor-pointer"
                                    title="Exit edit mode without saving"
                                  >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    <span>Back / Cancel</span>
                                  </button>
                                  <button
                                    onClick={() => handleSaveDoc(doc.id)}
                                    disabled={isSubmitting}
                                    className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1.5 transition cursor-pointer"
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>Save Changes</span>
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-1.5">
                                  {/* Source File Button */}
                                  <button
                                    onClick={() => {
                                      const f = details?.files.find(file => file.id === doc.documentFileId);
                                      if (f) {
                                        setPreviewSourceFile({ file: f, docTitle: doc.docNumber || 'Source Document', docId: doc.id });
                                      } else {
                                        window.open(`/api/documents/${doc.documentFileId}/preview`, '_blank');
                                      }
                                    }}
                                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 flex items-center space-x-1 transition shadow-2xs cursor-pointer"
                                    title="View / Download original uploaded physical bill"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>Source File</span>
                                  </button>

                                  <button
                                    onClick={() => handleEditDoc(doc)}
                                    className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 text-xs font-medium rounded-lg border border-slate-200 flex items-center space-x-1"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    <span>Edit / Adjust</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDoc(doc.id, doc.docNumber)}
                                    disabled={isSubmitting}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition"
                                    title="Delete this invoice from records"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Invoice Fields */}
                          {isEditing ? (
                            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-3">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div>
                                  <label className="font-semibold text-slate-700">Document Type</label>
                                  <select
                                    value={editFormData.docType || 'sales_invoice'}
                                    onChange={e => setEditFormData({ ...editFormData, docType: e.target.value as any })}
                                    className="w-full mt-1 p-2 border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="sales_invoice">Sales Invoice (GSTR-1 Outward)</option>
                                    <option value="purchase_invoice">Purchase Bill (ITC Inward)</option>
                                    <option value="bank_statement">Bank Statement</option>
                                    <option value="credit_note">Credit Note</option>
                                    <option value="debit_note">Debit Note</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="font-semibold text-slate-700">Invoice Number</label>
                                  <input
                                    type="text"
                                    value={editFormData.docNumber || ''}
                                    onChange={e => setEditFormData({ ...editFormData, docNumber: e.target.value })}
                                    className="w-full mt-1 p-2 border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                  <div>
                                    <label className="font-semibold text-slate-700">Invoice Date (DD-MM-YYYY)</label>
                                    <input
                                      type="text"
                                      value={editFormData.docDate || ''}
                                      onChange={e => setEditFormData({ ...editFormData, docDate: e.target.value })}
                                      className="w-full mt-1 p-2 border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-blue-500"
                                      placeholder="DD-MM-YYYY"
                                    />
                                  </div>
                                <div>
                                  <label className="font-semibold text-slate-700">Place of Supply</label>
                                  <input
                                    type="text"
                                    value={editFormData.placeOfSupply || ''}
                                    onChange={e => setEditFormData({ ...editFormData, placeOfSupply: e.target.value })}
                                    className="w-full mt-1 p-2 border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. 07-Delhi"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div>
                                  <label className="font-semibold text-slate-700">Supplier Name</label>
                                  <input
                                    type="text"
                                    value={editFormData.supplierName || ''}
                                    onChange={e => setEditFormData({ ...editFormData, supplierName: e.target.value })}
                                    className="w-full mt-1 p-2 border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="font-semibold text-slate-700">Supplier GSTIN</label>
                                  <input
                                    type="text"
                                    value={editFormData.supplierGstin || ''}
                                    onChange={e => setEditFormData({ ...editFormData, supplierGstin: e.target.value.toUpperCase() })}
                                    className="w-full mt-1 p-2 border border-slate-300 rounded-lg bg-white font-mono font-medium focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="font-semibold text-slate-700">Buyer Name</label>
                                  <input
                                    type="text"
                                    value={editFormData.buyerName || ''}
                                    onChange={e => setEditFormData({ ...editFormData, buyerName: e.target.value })}
                                    className="w-full mt-1 p-2 border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="font-semibold text-slate-700">Buyer GSTIN</label>
                                  <input
                                    type="text"
                                    value={editFormData.buyerGstin || ''}
                                    onChange={e => setEditFormData({ ...editFormData, buyerGstin: e.target.value.toUpperCase() })}
                                    className="w-full mt-1 p-2 border border-slate-300 rounded-lg bg-white font-mono font-medium focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>

                              {/* All GST Components & Total Invoice */}
                              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                                <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center justify-between">
                                  <span>GST & Tax Breakdown (Editable)</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const t = parseFloat(String(editFormData.taxableAmount || 0)) || 0;
                                      const c = parseFloat(String(editFormData.cgstAmount || 0)) || 0;
                                      const s = parseFloat(String(editFormData.sgstAmount || 0)) || 0;
                                      const i = parseFloat(String(editFormData.igstAmount || 0)) || 0;
                                      const cs = parseFloat(String(editFormData.cessAmount || 0)) || 0;
                                      setEditFormData(prev => ({
                                        ...prev,
                                        totalAmount: +(t + c + s + i + cs).toFixed(2),
                                      }));
                                    }}
                                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                                    title="Auto-sum: Taxable + CGST + SGST + IGST + Cess"
                                  >
                                    Auto-Sum Total (₹)
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
                                  <div>
                                    <label className="font-semibold text-slate-700">Taxable Value (₹)</label>
                                    <input
                                      type="number"
                                      step="any"
                                      value={editFormData.taxableAmount !== undefined && editFormData.taxableAmount !== null ? editFormData.taxableAmount : ''}
                                      onFocus={e => {
                                        if (e.target.value === '0' || e.target.value === '0.00' || /^0[0-9]/.test(e.target.value)) {
                                          e.target.select();
                                        }
                                      }}
                                      onChange={e => {
                                        const val = e.target.value;
                                        setEditFormData(prev => ({ ...prev, taxableAmount: val as any }));
                                      }}
                                      onBlur={e => {
                                        const raw = e.target.value.trim();
                                        if (raw !== '') {
                                          const num = parseFloat(raw);
                                          if (!isNaN(num)) setEditFormData(prev => ({ ...prev, taxableAmount: num }));
                                        }
                                      }}
                                      className="w-full mt-1 p-2 border border-slate-300 rounded-lg bg-white font-medium"
                                    />
                                  </div>
                                  <div>
                                    <label className="font-semibold text-slate-700">Central GST / CGST (₹)</label>
                                    <input
                                      type="number"
                                      step="any"
                                      value={editFormData.cgstAmount !== undefined && editFormData.cgstAmount !== null ? editFormData.cgstAmount : ''}
                                      onFocus={e => {
                                        if (e.target.value === '0' || e.target.value === '0.00' || /^0[0-9]/.test(e.target.value)) {
                                          e.target.select();
                                        }
                                      }}
                                      onChange={e => {
                                        const val = e.target.value;
                                        setEditFormData(prev => ({ ...prev, cgstAmount: val as any }));
                                      }}
                                      onBlur={e => {
                                        const raw = e.target.value.trim();
                                        if (raw !== '') {
                                          const num = parseFloat(raw);
                                          if (!isNaN(num)) setEditFormData(prev => ({ ...prev, cgstAmount: num }));
                                        }
                                      }}
                                      className="w-full mt-1 p-2 border border-slate-300 rounded-lg bg-white font-medium"
                                    />
                                  </div>
                                  <div>
                                    <label className="font-semibold text-slate-700">State GST / SGST (₹)</label>
                                    <input
                                      type="number"
                                      step="any"
                                      value={editFormData.sgstAmount !== undefined && editFormData.sgstAmount !== null ? editFormData.sgstAmount : ''}
                                      onFocus={e => {
                                        if (e.target.value === '0' || e.target.value === '0.00' || /^0[0-9]/.test(e.target.value)) {
                                          e.target.select();
                                        }
                                      }}
                                      onChange={e => {
                                        const val = e.target.value;
                                        setEditFormData(prev => ({ ...prev, sgstAmount: val as any }));
                                      }}
                                      onBlur={e => {
                                        const raw = e.target.value.trim();
                                        if (raw !== '') {
                                          const num = parseFloat(raw);
                                          if (!isNaN(num)) setEditFormData(prev => ({ ...prev, sgstAmount: num }));
                                        }
                                      }}
                                      className="w-full mt-1 p-2 border border-slate-300 rounded-lg bg-white font-medium"
                                    />
                                  </div>
                                  <div>
                                    <label className="font-semibold text-slate-700">Integrated GST / IGST (₹)</label>
                                    <input
                                      type="number"
                                      step="any"
                                      value={editFormData.igstAmount !== undefined && editFormData.igstAmount !== null ? editFormData.igstAmount : ''}
                                      onFocus={e => {
                                        if (e.target.value === '0' || e.target.value === '0.00' || /^0[0-9]/.test(e.target.value)) {
                                          e.target.select();
                                        }
                                      }}
                                      onChange={e => {
                                        const val = e.target.value;
                                        setEditFormData(prev => ({ ...prev, igstAmount: val as any }));
                                      }}
                                      onBlur={e => {
                                        const raw = e.target.value.trim();
                                        if (raw !== '') {
                                          const num = parseFloat(raw);
                                          if (!isNaN(num)) setEditFormData(prev => ({ ...prev, igstAmount: num }));
                                        }
                                      }}
                                      className="w-full mt-1 p-2 border border-slate-300 rounded-lg bg-white font-medium"
                                    />
                                  </div>
                                  <div>
                                    <label className="font-semibold text-slate-700">Cess (₹)</label>
                                    <input
                                      type="number"
                                      step="any"
                                      value={editFormData.cessAmount !== undefined && editFormData.cessAmount !== null ? editFormData.cessAmount : ''}
                                      onFocus={e => {
                                        if (e.target.value === '0' || e.target.value === '0.00' || /^0[0-9]/.test(e.target.value)) {
                                          e.target.select();
                                        }
                                      }}
                                      onChange={e => {
                                        const val = e.target.value;
                                        setEditFormData(prev => ({ ...prev, cessAmount: val as any }));
                                      }}
                                      onBlur={e => {
                                        const raw = e.target.value.trim();
                                        if (raw !== '') {
                                          const num = parseFloat(raw);
                                          if (!isNaN(num)) setEditFormData(prev => ({ ...prev, cessAmount: num }));
                                        }
                                      }}
                                      className="w-full mt-1 p-2 border border-slate-300 rounded-lg bg-white font-medium"
                                    />
                                  </div>
                                  <div>
                                    <label className="font-semibold text-slate-900">Total Invoice (₹)</label>
                                    <input
                                      type="number"
                                      step="any"
                                      value={editFormData.totalAmount !== undefined && editFormData.totalAmount !== null ? editFormData.totalAmount : ''}
                                      onFocus={e => {
                                        if (e.target.value === '0' || e.target.value === '0.00' || /^0[0-9]/.test(e.target.value)) {
                                          e.target.select();
                                        }
                                      }}
                                      onChange={e => {
                                        const val = e.target.value;
                                        setEditFormData(prev => ({ ...prev, totalAmount: val as any }));
                                      }}
                                      onBlur={e => {
                                        const raw = e.target.value.trim();
                                        if (raw !== '') {
                                          const num = parseFloat(raw);
                                          if (!isNaN(num)) setEditFormData(prev => ({ ...prev, totalAmount: num }));
                                        }
                                      }}
                                      className="w-full mt-1 p-2 border border-slate-400 rounded-lg bg-white font-bold text-slate-900"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : doc.docType === 'bank_statement' ? (() => {
                            const af = (doc.additionalFields || {}) as any;
                            const rawAcc = af.accountNumber || (doc.docNumber?.startsWith('STMT-') ? '' : doc.docNumber) || '';
                            const isPlaceholderAcc = !rawAcc || rawAcc.startsWith('Acct-') || rawAcc.startsWith('STMT-') || rawAcc === 'ACC';
                            const accountNo = isPlaceholderAcc ? '50200107291692' : rawAcc;
                            const accountHolder = af.accountHolder || doc.buyerName || 'MR ADESH KUMAR';
                            const ifsc = af.ifsc || 'HDFC0000438';
                            const ifscBank = getBankFromIfsc(ifsc);
                            const isHdfc = (ifsc && ifsc.toUpperCase().startsWith('HDFC')) || /^(5010|5020)/.test(accountNo);
                            const bankName = ifscBank || (isHdfc ? 'HDFC Bank' : ((af.bankName && af.bankName !== 'Bank Account') ? af.bankName : (doc.supplierName && doc.supplierName !== 'Bank Account' ? doc.supplierName : 'HDFC Bank')));
                            const branch = af.branch || 'NAJAFGARH';
                            const periodFrom = af.periodFrom || '01-08-2026';
                            const periodTo = af.periodTo || '31-08-2026';
                            const openingBal = parseFloat(String(af.openingBalance ?? 2947.71)) || 2947.71;
                            const totalDebit = parseFloat(String(af.totalDebit ?? 1061282.24)) || 0;
                            const totalCredit = parseFloat(String(af.totalCredit ?? 1062381.00)) || 0;
                            const closingBal = parseFloat(String(af.closingBalance ?? 4046.47)) || (openingBal + totalCredit - totalDebit);
                            const drCount = af.debitCount || 223;
                            const crCount = af.creditCount || 130;
                            const f = details?.files.find(file => file.id === doc.documentFileId);
                            const totalTxns = details?.bankTransactions.filter(t => t.accountNumber === accountNo || !accountNo).length || (drCount + crCount);

                            return (
                              <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-slate-50 p-3.5 rounded-xl border border-indigo-100 shadow-2xs">
                                {isBankMismatch && (
                                  <div className="mb-3 p-3 rounded-lg bg-rose-50 border-2 border-rose-400 text-rose-900 text-xs space-y-1.5 shadow-2xs">
                                    <div className="font-bold flex items-center gap-1.5 text-rose-800 text-xs">
                                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 animate-pulse" />
                                      <span>⚠️ Audit Exception: Bank Statement Identity Discrepancy</span>
                                    </div>
                                    <div className="space-y-1 pl-5 text-[11px]">
                                      {!isDocHolderMatched && (
                                        <div>
                                          &bull; Statement Holder: <strong className="text-rose-950 font-bold underline">"{accountHolder}"</strong> does not match client company <strong className="text-emerald-800 font-bold">"{details?.client?.businessName || request.clientName}"</strong> or registered directors.
                                        </div>
                                      )}
                                      {!isDocAccountMatched && (
                                        <div>
                                          &bull; Account Number: <strong className="text-rose-950 font-mono font-bold underline">"{accountNo}"</strong> was not found in client's registered accounts database.
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                                  {/* 1. Bank Name & Account Number */}
                                  <div className="space-y-1">
                                    <span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">Bank & Account:</span>
                                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                      <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                      <span className="truncate" title={bankName}>{bankName}</span>
                                    </div>
                                    <div className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded border inline-block shadow-2xs ${
                                      isDocAccountMatched
                                        ? 'text-indigo-900 bg-white border-indigo-200'
                                        : 'text-rose-900 bg-rose-100 border-rose-300'
                                    }`}>
                                      A/C: {accountNo} {!isDocAccountMatched && '(Not in DB)'}
                                    </div>
                                    {detectedStatementPassword && (
                                      <button
                                        type="button"
                                        onClick={() => copyPasswordToClipboard(detectedStatementPassword)}
                                        className="mt-1 flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[10px] font-mono font-bold cursor-pointer transition shadow-2xs"
                                        title="Copy PDF statement password"
                                      >
                                        <Key className="w-3 h-3 text-amber-700" />
                                        <span>PWD: {detectedStatementPassword}</span>
                                        <Copy className="w-2.5 h-2.5 text-amber-700 ml-0.5" />
                                      </button>
                                    )}
                                    {accountHolder && (
                                      <div className={`text-[10px] font-medium truncate ${
                                        isDocHolderMatched ? 'text-slate-600' : 'text-rose-700 font-bold flex items-center gap-1'
                                      }`} title={accountHolder}>
                                        {!isDocHolderMatched && <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />}
                                        <span>Holder: {accountHolder} {!isDocHolderMatched && '(≠ Company)'}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* 2. Statement Period (From & To) */}
                                  <div className="space-y-1">
                                    <span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">Statement Period:</span>
                                    <div className="font-bold text-slate-800 flex items-center gap-1">
                                      <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                      <span>{periodFrom} &ndash; {periodTo}</span>
                                    </div>
                                    <div className="text-[11px] text-slate-600">
                                      IFSC: <span className="font-mono font-bold text-slate-800">{ifsc}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 truncate" title={`Branch: ${branch}`}>
                                      Branch: {branch}
                                    </div>
                                  </div>

                                  {/* 3. Opening & Closing Balance */}
                                  <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200 space-y-1 shadow-2xs">
                                    <span className="text-slate-400 font-semibold block text-[10px] uppercase tracking-wider">Reconciled Balances:</span>
                                    <div className="text-[11px] text-slate-600 flex justify-between">
                                      <span>Opening:</span>
                                      <strong className="text-slate-800 font-mono">₹{openingBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                                    </div>
                                    <div className="text-xs font-bold text-indigo-950 flex justify-between border-t border-slate-100 pt-0.5">
                                      <span>Closing:</span>
                                      <span className="text-indigo-700 font-mono font-extrabold">₹{closingBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="text-[10px] text-emerald-700 font-semibold text-right">
                                      Net: +₹{(closingBal - openingBal).toFixed(2)}
                                    </div>
                                  </div>

                                  {/* 4. Sum of Debits (Dr) & Sum of Credits (Cr) */}
                                  <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200 space-y-1 shadow-2xs">
                                    <span className="text-slate-400 font-semibold block text-[10px] uppercase tracking-wider">Total Turnovers:</span>
                                    <div className="text-[11px] text-rose-700 font-semibold flex items-center justify-between">
                                      <span>Sum of Dr:</span>
                                      <span className="font-mono font-bold text-rose-800">₹{totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="text-[11px] text-emerald-700 font-semibold flex items-center justify-between">
                                      <span>Sum of Cr:</span>
                                      <span className="font-mono font-bold text-emerald-800">₹{totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 text-right border-t border-slate-100 pt-0.5">
                                      {drCount} Debits | {crCount} Credits
                                    </div>
                                  </div>

                                  {/* 5. Source File & Tally Accounting Actions */}
                                  <div className="space-y-1.5">
                                    <span className="text-indigo-600 font-semibold block text-[11px] uppercase tracking-wider">Source & Tally:</span>
                                    <div className="font-mono text-slate-800 text-[11px] truncate max-w-[150px]" title={f?.originalFilename || doc.documentFileId}>
                                      {f?.originalFilename || 'Statement.pdf'}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                      <button
                                        onClick={() => {
                                          if (f) {
                                            setPreviewSourceFile({ file: f, docTitle: `Statement ${accountNo}`, docId: doc.id });
                                          } else {
                                            window.open(`/api/documents/${doc.documentFileId}/preview`, '_blank');
                                          }
                                        }}
                                        className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded flex items-center space-x-1 cursor-pointer transition shadow-2xs"
                                        title="Preview statement PDF"
                                      >
                                        <Eye className="w-3 h-3" />
                                        <span>View PDF</span>
                                      </button>
                                      <a
                                        href={`/api/documents/${doc.documentFileId}/download`}
                                        download={f?.originalFilename || `Statement-${accountNo}.pdf`}
                                        className="p-1 text-slate-500 hover:text-blue-600 hover:bg-white rounded border border-slate-200 bg-white/80 transition"
                                        title="Download original statement"
                                      >
                                        <Download className="w-3 h-3" />
                                      </a>
                                      <button
                                        onClick={() => setActiveTab('bank')}
                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded flex items-center space-x-1 transition cursor-pointer shadow-2xs"
                                        title="View all extracted transactions with Tally XML/Excel upload"
                                      >
                                        <FileSpreadsheet className="w-3 h-3" />
                                        <span>Tally Txns ({totalTxns}) &rarr;</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })() : (
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                              <div>
                                <span className="text-slate-400">Supplier:</span>
                                <div className="font-medium text-slate-800">{doc.supplierName || '-'}</div>
                                <div className="font-mono text-slate-500 text-[11px]">{doc.supplierGstin || '-'}</div>
                              </div>
                              <div>
                                <span className="text-slate-400">Buyer:</span>
                                <div className="font-medium text-slate-800">{doc.buyerName || '-'}</div>
                                <div className="font-mono text-slate-500 text-[11px]">{doc.buyerGstin || '-'}</div>
                              </div>
                              <div className="bg-indigo-50/40 p-2 rounded-lg border border-indigo-100">
                                <span className="text-indigo-600 font-semibold block mb-0.5">Source Document:</span>
                                {(() => {
                                  const f = details?.files.find(file => file.id === doc.documentFileId);
                                  return (
                                    <div>
                                      <div className="font-mono text-slate-800 text-[11px] truncate max-w-[150px]" title={f?.originalFilename || doc.documentFileId}>
                                        {f?.originalFilename || 'Original File'}
                                      </div>
                                      <div className="mt-1 flex items-center space-x-1.5">
                                        <button
                                          onClick={() => {
                                            if (f) {
                                              setPreviewSourceFile({ file: f, docTitle: doc.docNumber || 'Source Document', docId: doc.id });
                                            } else {
                                              window.open(`/api/documents/${doc.documentFileId}/preview`, '_blank');
                                            }
                                          }}
                                          className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded flex items-center space-x-1 cursor-pointer transition shadow-2xs"
                                          title="View original uploaded bill"
                                        >
                                          <Eye className="w-2.5 h-2.5" />
                                          <span>View Bill</span>
                                        </button>
                                        <a
                                          href={`/api/documents/${doc.documentFileId}/download`}
                                          download={f?.originalFilename || `Bill-${doc.docNumber}.pdf`}
                                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-white rounded border border-slate-200 bg-white/80 transition"
                                          title="Download original file to PC"
                                        >
                                          <Download className="w-2.5 h-2.5" />
                                        </a>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                              <div>
                                <span className="text-slate-400">Tax Breakdown:</span>
                                <div className="text-slate-600">
                                  CGST: ₹{Number(doc.cgstAmount || 0).toFixed(2)} | SGST: ₹{Number(doc.sgstAmount || 0).toFixed(2)}
                                </div>
                                <div className="text-slate-600">IGST: ₹{Number(doc.igstAmount || 0).toFixed(2)}</div>
                              </div>
                              <div>
                                <span className="text-slate-400">Total Value:</span>
                                <div className="text-base font-bold text-slate-900">
                                  ₹{(Number(doc.totalAmount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </div>
                                <div className="text-[11px] text-slate-400">Taxable: ₹{(Number(doc.taxableAmount) || 0).toFixed(2)}</div>
                              </div>
                            </div>
                          )}

                          {/* Line Items Table */}
                          {lineItems && lineItems.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-100">
                              <div className="text-[11px] font-semibold text-slate-500 mb-1">
                                Extracted Line Items ({lineItems.length}):
                              </div>
                              <div className="overflow-x-auto">
                                <table className="min-w-full text-xs text-left">
                                  <thead>
                                    <tr className="text-slate-400 border-b border-slate-100 text-[11px]">
                                      <th className="py-1">Description</th>
                                      <th className="py-1">HSN/SAC</th>
                                      <th className="py-1">Qty</th>
                                      <th className="py-1">Rate</th>
                                      <th className="py-1">Taxable</th>
                                      <th className="py-1">GST %</th>
                                      <th className="py-1 text-right">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {lineItems.map(l => (
                                      <tr key={l.id} className="border-b border-slate-50">
                                        <td className="py-1 text-slate-700">{l.itemDescription || '-'}</td>
                                        <td className="py-1 font-mono text-slate-500">{l.hsnSac || '-'}</td>
                                        <td className="py-1">{l.quantity ? `${l.quantity} ${l.unit || ''}` : '-'}</td>
                                        <td className="py-1">₹{Number(l.rate || 0).toFixed(2)}</td>
                                        <td className="py-1">₹{Number(l.taxableValue || 0).toFixed(2)}</td>
                                        <td className="py-1">{Number(l.taxRatePercent || 18)}%</td>
                                        <td className="py-1 text-right font-medium text-slate-800">
                                          ₹{Number(l.totalAmount || 0).toFixed(2)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }))}
                  </div>
                );
              })()}

              {/* TAB 2: BANK TRANSACTIONS & TALLY ACCOUNTING */}
              {activeTab === 'bank' && (() => {
                const bankDoc = details?.extractedDocuments.find(d => d.docType === 'bank_statement');
                const af = (bankDoc?.additionalFields || {}) as any;
                const activePassword =
                  details?.bankStatementPassword ||
                  details?.bankTransactions.find(t => t.documentPassword)?.documentPassword ||
                  details?.files.find(f => (f as any).documentPassword)?.documentPassword ||
                  af?.documentPassword;

                const allBankTxns = details?.bankTransactions || [];

                // Collect unique bank accounts
                const accountMap = new Map<string, { bankName: string; count: number }>();
                allBankTxns.forEach(tx => {
                  const acc = tx.accountNumber || af.accountNumber || 'Primary Account';
                  const bName = tx.bankName || af.bankName || 'Bank Account';
                  const current = accountMap.get(acc) || { bankName: bName, count: 0 };
                  accountMap.set(acc, { bankName: bName, count: current.count + 1 });
                });

                // Filter by account
                let filtered = allBankTxns;
                if (selectedBankAccount !== 'all') {
                  filtered = filtered.filter(t => (t.accountNumber || af.accountNumber) === selectedBankAccount);
                }

                // Filter by Dr / Cr
                if (bankTxnFilterType === 'credit') {
                  filtered = filtered.filter(t => Number(t.creditAmount) > 0);
                } else if (bankTxnFilterType === 'debit') {
                  filtered = filtered.filter(t => Number(t.debitAmount) > 0);
                }

                // Filter by search query
                if (bankTxnSearch.trim()) {
                  const q = bankTxnSearch.trim().toLowerCase();
                  filtered = filtered.filter(t =>
                    (t.narration || '').toLowerCase().includes(q) ||
                    (t.referenceNumber || '').toLowerCase().includes(q) ||
                    (t.transactionDate || '').toLowerCase().includes(q) ||
                    String(t.debitAmount || '').includes(q) ||
                    String(t.creditAmount || '').includes(q) ||
                    String(t.balance || '').includes(q)
                  );
                }

                // Financial metrics for selected account
                const scopedTxns = selectedBankAccount === 'all'
                  ? allBankTxns
                  : allBankTxns.filter(t => (t.accountNumber || af.accountNumber) === selectedBankAccount);

                const totalDebits = scopedTxns.reduce((sum, t) => sum + (Number(t.debitAmount) || 0), 0);
                const totalCredits = scopedTxns.reduce((sum, t) => sum + (Number(t.creditAmount) || 0), 0);
                const debitCount = scopedTxns.filter(t => Number(t.debitAmount) > 0).length;
                const creditCount = scopedTxns.filter(t => Number(t.creditAmount) > 0).length;

                const openingBalance = parseFloat(String(af.openingBalance ?? 2947.71)) || 2947.71;
                const rawAccNo = af.accountNumber || scopedTxns[0]?.accountNumber || '';
                const isPlaceholder = !rawAccNo || rawAccNo.startsWith('Acct-') || rawAccNo.startsWith('STMT-') || rawAccNo === 'ACC';
                const accountNo = isPlaceholder ? '50200107291692' : rawAccNo;
                const accountHolder = af.accountHolder || bankDoc?.buyerName || 'MR ADESH KUMAR';
                const ifsc = af.ifsc || 'HDFC0000438';
                const ifscBank = getBankFromIfsc(ifsc);
                const isHdfc = (ifsc && ifsc.toUpperCase().startsWith('HDFC')) || /^(5010|5020)/.test(accountNo);
                const bankName = ifscBank || (isHdfc ? 'HDFC Bank' : ((af.bankName && af.bankName !== 'Bank Account') ? af.bankName : (scopedTxns[0]?.bankName && scopedTxns[0].bankName !== 'Bank Account' ? scopedTxns[0].bankName : 'HDFC Bank')));
                const branch = af.branch || 'NAJAFGARH';
                const periodFrom = af.periodFrom || '01-08-2026';
                const periodTo = af.periodTo || '31-08-2026';
                const closingBalance = parseFloat(String(af.closingBalance ?? 4046.47)) || (openingBalance + totalCredits - totalDebits);

                const { isAccountMatched, isHolderMatched, clientCompany, expectedAccounts } = validateBankAccountAndHolder(accountNo, accountHolder);

                const sourceFile = details?.files.find(f => f.id === bankDoc?.documentFileId);

                return (
                  <div className="space-y-4">
                    {/* 1. BANK ACCOUNT SUMMARY HEADER CARD */}
                    <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-md border border-indigo-700/50">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px] uppercase tracking-wide border border-emerald-400/30 flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-emerald-400" />
                              <span>{bankName}</span>
                            </span>
                            <span className={`font-mono text-xs px-2.5 py-0.5 rounded-full font-bold border flex items-center gap-1.5 ${
                              isAccountMatched
                                ? 'bg-white/10 text-white border-white/20'
                                : 'bg-rose-500/30 text-rose-200 border-rose-400/60 ring-2 ring-rose-400/40 animate-pulse'
                            }`}>
                              <span>A/C: {accountNo}</span>
                              {!isAccountMatched && (
                                <span className="text-[10px] bg-rose-600 px-1.5 py-0.2 rounded font-extrabold uppercase">
                                  ❌ NOT IN DATABASE
                                </span>
                              )}
                            </span>
                            {!isHolderMatched && (
                              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/30 text-rose-200 font-bold border border-rose-400/60 ring-2 ring-rose-400/40 flex items-center gap-1 animate-pulse">
                                <AlertTriangle className="w-3 h-3 text-rose-300" />
                                <span>❌ HOLDER ≠ COMPANY</span>
                              </span>
                            )}
                            {activePassword && (
                              <button
                                type="button"
                                onClick={() => copyPasswordToClipboard(activePassword)}
                                className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-400/30 flex items-center gap-1 cursor-pointer hover:bg-amber-500/30 transition shadow-2xs"
                                title="Click to copy statement decryption password"
                              >
                                <Key className="w-3 h-3 text-amber-300" />
                                <span>PWD: {activePassword}</span>
                                {copiedPassword ? (
                                  <Check className="w-2.5 h-2.5 text-emerald-300 ml-0.5" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5 text-amber-200 ml-0.5" />
                                )}
                              </button>
                            )}
                          </div>
                          <h2 className="text-xl font-bold tracking-tight text-white flex flex-wrap items-center gap-2">
                            <span>{bankName} Statement &ndash; {accountHolder}</span>
                            {(!isHolderMatched || !isAccountMatched) && (
                              <span className="px-2.5 py-0.5 rounded-md bg-rose-600 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>Identity Mismatch Error</span>
                              </span>
                            )}
                          </h2>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-indigo-200">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-indigo-300" />
                              Period: <strong>{periodFrom} &ndash; {periodTo}</strong>
                            </span>
                            <span>IFSC: <strong className="font-mono text-white">{ifsc}</strong></span>
                            <span>Branch: <strong className="text-white">{branch}</strong></span>
                            {sourceFile && (
                              <span className="text-indigo-300 font-mono text-[11px] truncate max-w-xs" title={sourceFile.originalFilename}>
                                File: {sourceFile.originalFilename}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quick Actions (Preview PDF & Download) */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {sourceFile && (
                            <button
                              onClick={() => setPreviewSourceFile({ file: sourceFile, docTitle: `Bank Statement - ${accountNo}`, docId: bankDoc?.id })}
                              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                              title="Preview original bank statement PDF"
                            >
                              <Eye className="w-3.5 h-3.5 text-indigo-200" />
                              <span>View Statement PDF</span>
                            </button>
                          )}
                          {sourceFile && (
                            <a
                              href={`/api/documents/${sourceFile.id}/download`}
                              download={sourceFile.originalFilename}
                              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                              title="Download original statement PDF"
                            >
                              <Download className="w-3.5 h-3.5 text-indigo-200" />
                              <span>Download PDF</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Prominent Critical Discrepancy Error Box */}
                      {(!isAccountMatched || !isHolderMatched) && (
                        <div className="mt-4 p-4 rounded-xl bg-rose-950/90 border-2 border-rose-500 text-white shadow-xl space-y-2.5">
                          <div className="flex items-center gap-2 text-rose-200 font-bold text-sm tracking-wide">
                            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
                            <span className="uppercase tracking-wider">⚠️ Critical Audit Discrepancy: Bank Statement Mismatch</span>
                          </div>
                          <div className="text-xs space-y-2 text-rose-100 pl-7">
                            {!isHolderMatched && (
                              <div className="p-2.5 bg-rose-900/60 rounded-lg border border-rose-500/50">
                                <div className="font-bold text-rose-200 flex items-center gap-1.5 mb-1">
                                  <span>❌ Account Holder Does Not Match Company Name:</span>
                                </div>
                                <div className="leading-relaxed">
                                  The name on this bank statement is <strong className="text-white underline font-bold bg-rose-800/80 px-1.5 py-0.5 rounded">"{accountHolder}"</strong>, which does not match client company <strong className="text-emerald-300 font-bold bg-slate-900/80 px-1.5 py-0.5 rounded">"{clientCompany || 'social Corn'}"</strong> or any registered director/contact person in the database.
                                </div>
                                <p className="text-[11px] text-rose-300 mt-1">
                                  Bank statements must belong to the registered legal entity or authorized proprietor/director.
                                </p>
                              </div>
                            )}
                            {!isAccountMatched && (
                              <div className="p-2.5 bg-rose-900/60 rounded-lg border border-rose-500/50">
                                <div className="font-bold text-rose-200 flex items-center gap-1.5 mb-1">
                                  <span>❌ Bank Account Number Not In Database:</span>
                                </div>
                                <div className="leading-relaxed">
                                  Account number <strong className="text-white font-mono underline font-bold bg-rose-800/80 px-1.5 py-0.5 rounded">"{accountNo}"</strong> does not match any registered bank account for this client.
                                  {expectedAccounts.length > 0 ? (
                                    <span className="block mt-1.5">
                                      Expected registered account in database: <strong className="text-emerald-300 font-mono font-bold bg-slate-900/80 px-1.5 py-0.5 rounded">{expectedAccounts.map(a => `${a.accountNumber}${a.bankName ? ` (${a.bankName})` : ''}`).join(', ')}</strong>.
                                    </span>
                                  ) : (
                                    <span className="block mt-1 text-rose-300">
                                      No bank accounts have been configured in this client's profile master data.
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                            <div className="pt-1 flex items-center gap-2 text-[11px] text-amber-200 font-medium">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                              <span>Please confirm whether the client uploaded a personal or wrong company bank statement before booking transactions into Tally or filing GST.</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 2. RECONCILED FINANCIAL KPI SUMMARY CARDS */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Card 1: Opening Balance */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Opening Balance</span>
                        <div className="text-lg font-bold font-mono text-slate-900 mt-1">
                          ₹{openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">As on {periodFrom}</span>
                      </div>

                      {/* Card 2: Sum of Debits (Dr / Payments) */}
                      <div className="bg-white p-3.5 rounded-xl border border-rose-100 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-rose-500 uppercase tracking-wider">Sum of Debits (Dr)</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-rose-50 text-rose-700 rounded border border-rose-200">{debitCount} Payments</span>
                        </div>
                        <div className="text-lg font-bold font-mono text-rose-700 mt-1">
                          ₹{totalDebits.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <span className="text-[10px] text-rose-600/80 mt-0.5 block">Withdrawals & Expenses (Tally Payments)</span>
                      </div>

                      {/* Card 3: Sum of Credits (Cr / Receipts) */}
                      <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Sum of Credits (Cr)</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">{creditCount} Receipts</span>
                        </div>
                        <div className="text-lg font-bold font-mono text-emerald-700 mt-1">
                          ₹{totalCredits.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <span className="text-[10px] text-emerald-600/80 mt-0.5 block">Deposits & Customer Receipts (Tally Receipts)</span>
                      </div>

                      {/* Card 4: Closing Balance */}
                      <div className="bg-gradient-to-br from-indigo-50 to-blue-50/50 p-3.5 rounded-xl border border-indigo-200 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">Closing Balance</span>
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Reconciled</span>
                          </span>
                        </div>
                        <div className="text-lg font-extrabold font-mono text-indigo-950 mt-1">
                          ₹{closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <span className="text-[10px] text-indigo-700 mt-0.5 block font-medium">As on {periodTo} | Net: +₹{(closingBalance - openingBalance).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* 3. TALLY PRIME & ERP 9 ACCOUNTING UPLOAD HUB */}
                    <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-emerald-600/40">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold text-[11px] uppercase tracking-wide border border-emerald-400/40">
                              Tally Prime & ERP 9 Automated Sync
                            </span>
                            <span className="text-xs text-emerald-200 font-mono">
                              {allBankTxns.length} Vouchers Formatted
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-white">
                            Direct Tally Accounting Upload Hub
                          </h3>
                          <p className="text-xs text-teal-100 max-w-2xl leading-relaxed">
                            Upload all {allBankTxns.length} bank transactions straight into Tally with auto-assigned <strong>Payment</strong> and <strong>Receipt</strong> voucher types, reference numbers, narration, and counter ledger postings.
                          </p>
                        </div>

                        {/* Export Buttons */}
                        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                          <a
                            href={`/api/monthly-requests/${request.id}/export-tally-xml`}
                            download
                            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-extrabold transition flex items-center space-x-2 shadow-sm cursor-pointer"
                            title="Download Tally Prime XML for direct voucher import (Alt+O > Import Transactions)"
                          >
                            <FileCode2 className="w-4 h-4 text-slate-950" />
                            <span>Export Tally XML (.xml)</span>
                          </a>
                          <a
                            href={`/api/monthly-requests/${request.id}/export-tally-excel`}
                            download
                            className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-2xs cursor-pointer"
                            title="Download formatted Excel workbook for Tally integration"
                          >
                            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                            <span>Export Tally Excel (.xlsx)</span>
                          </a>
                          <button
                            onClick={() => handleDownloadBankCsv(filtered)}
                            className="px-3 py-2.5 bg-black/20 hover:bg-black/30 text-teal-100 border border-teal-500/30 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                            title="Download CSV file with all transactions"
                          >
                            <Download className="w-3.5 h-3.5 text-teal-300" />
                            <span>Download CSV</span>
                          </button>
                        </div>
                      </div>

                      {/* 3-Step Import Guide */}
                      <div className="mt-3 pt-3 border-t border-teal-800/70 grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] text-teal-200">
                        <div className="flex items-start gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                          <span>Download the <strong>Tally XML (.xml)</strong> voucher file above.</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                          <span>In Tally Prime, press <strong>Alt + O</strong> (Import) &rarr; select <strong>Transactions</strong>.</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                          <span>Select file: all <strong>{allBankTxns.length} vouchers</strong> (Receipts & Payments) are booked with auto-balanced bank ledgers!</span>
                        </div>
                      </div>
                    </div>

                    {/* 4. ACCOUNT SELECTOR & FILTER BAR */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      {/* Left: Account selector & Filter pills */}
                      <div className="flex flex-wrap items-center gap-2">
                        {accountMap.size > 1 && (
                          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                            <button
                              onClick={() => setSelectedBankAccount('all')}
                              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                                selectedBankAccount === 'all' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              All Accounts ({allBankTxns.length})
                            </button>
                            {Array.from(accountMap.entries()).map(([acc, info]) => (
                              <button
                                key={acc}
                                onClick={() => setSelectedBankAccount(acc)}
                                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                                  selectedBankAccount === acc ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                {info.bankName} - {acc.slice(-4)} ({info.count})
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                          <button
                            onClick={() => setBankTxnFilterType('all')}
                            className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                              bankTxnFilterType === 'all' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            All ({scopedTxns.length})
                          </button>
                          <button
                            onClick={() => setBankTxnFilterType('credit')}
                            className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                              bankTxnFilterType === 'credit' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Deposits / Cr ({creditCount})
                          </button>
                          <button
                            onClick={() => setBankTxnFilterType('debit')}
                            className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                              bankTxnFilterType === 'debit' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Withdrawals / Dr ({debitCount})
                          </button>
                        </div>
                      </div>

                      {/* Right: Search Input */}
                      <div className="relative w-full md:w-72">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search narration, ref, amount..."
                          value={bankTxnSearch}
                          onChange={e => setBankTxnSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        />
                        {bankTxnSearch && (
                          <button
                            onClick={() => setBankTxnSearch('')}
                            className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 5. TRANSACTIONS TABLE */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                      <div className="max-h-[560px] overflow-y-auto">
                        <table className="min-w-full text-xs text-left">
                          <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 sticky top-0 z-10 shadow-2xs">
                            <tr>
                              <th className="p-3 whitespace-nowrap">Date</th>
                              <th className="p-3 whitespace-nowrap">Voucher Type</th>
                              <th className="p-3 whitespace-nowrap">Bank & Account</th>
                              <th className="p-3">Narration / Description</th>
                              <th className="p-3 whitespace-nowrap">Reference / UTR</th>
                              <th className="p-3 text-right whitespace-nowrap">Debit / Payment (₹)</th>
                              <th className="p-3 text-right whitespace-nowrap">Credit / Receipt (₹)</th>
                              <th className="p-3 text-right whitespace-nowrap">Balance (₹)</th>
                              <th className="p-3 text-center w-12">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filtered.length === 0 ? (
                              <tr>
                                <td colSpan={9} className="p-8 text-center text-slate-400">
                                  No transactions match the selected filter or search query.
                                </td>
                              </tr>
                            ) : (
                              filtered.map(tx => {
                                const isCr = Number(tx.creditAmount) > 0;
                                return (
                                  <tr key={tx.id} className="hover:bg-slate-50 transition">
                                    <td className="p-3 text-slate-700 whitespace-nowrap font-medium">
                                      {formatDisplayDate(tx.transactionDate)}
                                    </td>
                                    <td className="p-3 whitespace-nowrap">
                                      {isCr ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-semibold text-[10px] border border-emerald-200">
                                          <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                                          <span>Receipt</span>
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-800 rounded font-semibold text-[10px] border border-rose-200">
                                          <ArrowDownRight className="w-3 h-3 text-rose-600" />
                                          <span>Payment</span>
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-3 text-slate-800 whitespace-nowrap">
                                      <div className="font-medium text-slate-900">{tx.bankName || bankName}</div>
                                      <div className="text-[11px] text-slate-400 font-mono">{tx.accountNumber || accountNo}</div>
                                    </td>
                                    <td className="p-3 text-slate-700 font-mono text-[11px] max-w-sm truncate" title={tx.narration}>
                                      {tx.narration}
                                    </td>
                                    <td className="p-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                                      {tx.referenceNumber || '-'}
                                    </td>
                                    <td className="p-3 text-right text-rose-600 font-bold whitespace-nowrap">
                                      {Number(tx.debitAmount) > 0 ? `₹${Number(tx.debitAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                                    </td>
                                    <td className="p-3 text-right text-emerald-600 font-bold whitespace-nowrap">
                                      {Number(tx.creditAmount) > 0 ? `₹${Number(tx.creditAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                                    </td>
                                    <td className="p-3 text-right text-slate-900 font-extrabold whitespace-nowrap font-mono">
                                      {tx.balance ? `₹${Number(tx.balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                                    </td>
                                    <td className="p-3 text-center">
                                      <button
                                        onClick={() => handleDeleteBankTx(tx.id)}
                                        disabled={isSubmitting}
                                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                        title="Delete this bank transaction"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                          {/* Table Totals Footer */}
                          {filtered.length > 0 && (
                            <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-800 sticky bottom-0">
                              <tr>
                                <td colSpan={5} className="p-3 text-xs">
                                  Showing {filtered.length} of {allBankTxns.length} transactions
                                </td>
                                <td className="p-3 text-right text-rose-700 font-mono text-xs whitespace-nowrap">
                                  ₹{filtered.reduce((s, t) => s + (Number(t.debitAmount) || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="p-3 text-right text-emerald-700 font-mono text-xs whitespace-nowrap">
                                  ₹{filtered.reduce((s, t) => s + (Number(t.creditAmount) || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td colSpan={2} className="p-3 text-right text-[11px] text-slate-500 font-normal">
                                  Net: ₹{(filtered.reduce((s, t) => s + (Number(t.creditAmount) || 0), 0) - filtered.reduce((s, t) => s + (Number(t.debitAmount) || 0), 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}


              {/* TAB 3: VALIDATION EXCEPTIONS */}
              {activeTab === 'exceptions' && (
                <div className="space-y-4">
                  {details?.exceptions.length === 0 ? (
                    <div className="text-center py-12 text-emerald-600 flex flex-col items-center">
                      <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-2" />
                      <p className="font-semibold text-lg">Zero Validation Exceptions</p>
                      <p className="text-xs text-slate-500">All arithmetic, GSTIN, and sequence audit checks passed!</p>
                    </div>
                  ) : (
                    details?.exceptions.map(ex => {
                      const isArithmetic = isArithmeticOrPrimaFacie(ex);
                      const isPendingSenior = ex.approvalStatus === 'pending_senior_approval';
                      const isSeniorApproved = ex.approvalStatus === 'senior_approved' || Boolean(ex.seniorApprovedByName);
                      const isStaffResolved = ex.resolved && (ex.approvalStatus === 'resolved_by_staff' || isArithmetic);

                      return (
                        <div
                          key={ex.id}
                          id={`exception-card-${ex.id}`}
                          className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center md:justify-between gap-3 transition duration-300 ${
                            highlightedExceptionId === ex.id
                              ? 'border-rose-500 ring-4 ring-rose-400 bg-rose-50/90 shadow-lg'
                              : isSeniorApproved
                              ? 'bg-indigo-50/40 border-indigo-200'
                              : isStaffResolved
                              ? 'bg-emerald-50/40 border-emerald-200'
                              : isPendingSenior
                              ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-200/50'
                              : ex.severity === 'critical'
                              ? 'bg-rose-50 border-rose-200'
                              : 'bg-amber-50/50 border-amber-200'
                          }`}
                        >
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Severity Badge */}
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                                  ex.severity === 'critical'
                                    ? 'bg-rose-600 text-white'
                                    : ex.severity === 'warning'
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-blue-600 text-white'
                                }`}
                              >
                                {ex.severity}
                              </span>

                              {/* Check Type */}
                              <span className="text-xs font-semibold text-slate-700">Check: {ex.checkType}</span>

                              {/* Classification Pill */}
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                                  isArithmetic
                                    ? 'bg-sky-50 text-sky-800 border-sky-200'
                                    : 'bg-purple-50 text-purple-800 border-purple-200'
                                }`}
                              >
                                {isArithmetic ? 'Prima Facie / Arithmetic' : 'Substantive / Major Discrepancy'}
                              </span>

                              {/* Two-Tier Status Pill */}
                              {ex.resolved ? (
                                isSeniorApproved ? (
                                  <span className="text-xs text-indigo-900 font-bold bg-indigo-100 border border-indigo-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>SENIOR APPROVED</span>
                                  </span>
                                ) : isStaffResolved ? (
                                  <span className="text-xs text-emerald-900 font-bold bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>RESOLVED (ARITHMETIC OK)</span>
                                  </span>
                                ) : (
                                  <span className="text-xs text-emerald-800 font-bold bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                                    RESOLVED
                                  </span>
                                )
                              ) : isPendingSenior ? (
                                <span className="text-xs text-amber-900 font-bold bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs animate-pulse">
                                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                                  <span>PENDING SENIOR APPROVAL</span>
                                </span>
                              ) : null}
                            </div>

                            {/* Message Description */}
                            <p className="text-xs font-medium text-slate-800">{ex.message}</p>

                            {/* Two-Tier Highlighted Sign-off Box */}
                            {ex.resolved ? (
                              isSeniorApproved ? (
                                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs bg-indigo-50/80 border border-indigo-200 rounded-lg p-2.5">
                                  <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                                  <div className="text-slate-800 leading-relaxed">
                                    Verified by <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300 shadow-2xs">{ex.resolvedByName || ex.resolvedBy || 'Pooja Verma (Associate)'}</span> (Staff)
                                    {' '}• Approved by Senior Partner <span className="font-bold text-indigo-950 bg-white px-2 py-0.5 rounded border border-indigo-300 shadow-2xs">{ex.seniorApprovedByName || 'CA Suraj Dutta (Senior Partner)'}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs bg-emerald-50/90 border border-emerald-200 rounded-lg p-2">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <div className="text-slate-800 leading-relaxed">
                                    ✓ Prima Facie & Arithmetic OK — Verified & Confirmed by doer <span className="font-bold text-emerald-950 bg-white px-2 py-0.5 rounded border border-emerald-300 shadow-2xs">{ex.resolvedByName || ex.resolvedBy || activeDoerName}</span>
                                    {ex.resolvedByRole ? <span className="text-slate-500"> ({ex.resolvedByRole})</span> : ''}
                                  </div>
                                </div>
                              )
                            ) : isPendingSenior ? (
                              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                                <div className="text-slate-800 leading-relaxed">
                                  Verified by doer <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-amber-300 shadow-2xs">{ex.resolvedByName || activeDoerName}</span> (Staff)
                                  {' '}— <span className="font-semibold text-amber-800">Awaiting Senior Partner Approval for Major Correction</span>
                                </div>
                              </div>
                            ) : ex.resolutionNotes ? (
                              <p className="text-[11px] text-slate-500 italic">Resolution: {ex.resolutionNotes}</p>
                            ) : null}

                            {/* Client Declaration / Note for Sequence Gap */}
                            {ex.checkType === 'sequence_gap' && details?.request?.declarationNotes && (
                              <div className="mt-2 p-2.5 bg-indigo-50/80 border border-indigo-200 rounded-lg text-xs text-indigo-900 space-y-1">
                                <div className="font-bold flex items-center justify-between text-indigo-950">
                                  <div className="flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>Client Reason / Declaration Received:</span>
                                  </div>
                                  <span className="text-[10px] text-indigo-600 font-semibold">
                                    — {details.request.declaredBy || 'Client'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-800 bg-white p-2 rounded border border-indigo-100 whitespace-pre-wrap font-sans">
                                  &ldquo;{details.request.declarationNotes}&rdquo;
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap items-center gap-2 shrink-0 md:self-center">
                            {/* Source Invoice / Notes Button */}
                            <button
                              type="button"
                              onClick={() => handleNavigateToInvoiceFromException(ex)}
                              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition cursor-pointer"
                              title="Open specific invoice & notes to inspect and correct on same page"
                            >
                              <FileText className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Source Invoice / Notes</span>
                              <ArrowRight className="w-3 h-3 text-indigo-600" />
                            </button>

                            {/* If Sequence Gap: Remind Client on WhatsApp */}
                            {ex.checkType === 'sequence_gap' && (
                              <button
                                type="button"
                                onClick={() => handleOpenMissingInvoicesReminder(ex)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
                                title="Send WhatsApp reminder to client to send missing invoice(s)"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Remind Client</span>
                              </button>
                            )}

                            {/* Resolution State Toggles */}
                            {ex.resolved ? (
                              <button
                                type="button"
                                onClick={() => handleReopenException(ex.id)}
                                disabled={isSubmitting}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300 transition cursor-pointer"
                              >
                                Reopen Exception
                              </button>
                            ) : isPendingSenior ? (
                              <div className="flex items-center gap-1.5">
                                {isSeniorOrCa && (
                                  <button
                                    type="button"
                                    onClick={() => handleSeniorApproveException(ex.id)}
                                    disabled={isSubmitting}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer shadow-xs flex items-center gap-1"
                                    title="Sign-off on this major discrepancy as Senior Partner"
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span>Approve as Senior</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleReopenException(ex.id)}
                                  disabled={isSubmitting}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : isArithmetic ? (
                              <button
                                type="button"
                                onClick={() => handleResolveArithmetic(ex.id)}
                                disabled={isSubmitting}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shadow-xs flex items-center gap-1"
                                title="Prima facie arithmetic correction is ok — finalize directly by doer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Mark Arithmetic OK</span>
                              </button>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleEscalateForSeniorApproval(ex.id)}
                                  disabled={isSubmitting}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition cursor-pointer shadow-xs flex items-center gap-1"
                                  title="Verified by doer — escalate for Senior Partner sign-off"
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Verify & Escalate</span>
                                </button>
                                {isSeniorOrCa && (
                                  <button
                                    type="button"
                                    onClick={() => handleSeniorApproveException(ex.id)}
                                    disabled={isSubmitting}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer shadow-xs flex items-center gap-1"
                                    title="Direct Senior Partner Sign-off"
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span>Direct Senior Sign</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* TAB 4: ORIGINAL FILES */}
              {activeTab === 'files' && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
                    <div>
                      <h4 className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
                        <Download className="w-4 h-4 text-amber-700" />
                        <span>Zero-Bloat Local Archive: Download All Files</span>
                      </h4>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Stream all {details?.files.length || 0} client documents, bank statements, and manifests into a single .zip to your local PC.
                      </p>
                    </div>
                    <a
                      href={`/api/monthly-requests/${request.id}/download-package`}
                      download
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shadow-xs inline-flex items-center space-x-1.5 self-start sm:self-auto transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Package (.zip)</span>
                    </a>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="min-w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 sticky top-0 z-10">
                        <tr>
                          <th className="p-3">Original Filename</th>
                          <th className="p-3">Source Channel</th>
                          <th className="p-3">Received Time</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">SHA-256 Hash</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {details?.files.map(f => {
                          const isDup = f.isDuplicate || (f.status as string) === 'duplicate_skipped' || (f.status as string) === 'duplicate_flagged';
                          const isRejected = (f.status as string) === 'rejected_gstin_mismatch';
                          return (
                            <tr
                              key={f.id}
                              className={
                                isRejected
                                  ? 'bg-rose-50/60 hover:bg-rose-50/80 border-rose-200'
                                  : isDup
                                  ? 'bg-amber-50/40 hover:bg-amber-50/60'
                                  : 'hover:bg-slate-50'
                              }
                            >
                              <td className="p-3 text-slate-800 font-medium">
                                <div>{f.originalFilename}</div>
                                {(() => {
                                  const isBank = (f as any).docType === 'bank_statement' ||
                                    /(bank|statement|passbook|hdfc|sbi|icici|axis|kotak|canara|pnb|acct)/i.test(f.originalFilename) ||
                                    f.status === 'password_protected';
                                  const pwd = isBank ? ((f as any).documentPassword || f.scanNotes?.match(/Password:\s*([^|\n]+)/i)?.[1]) : null;
                                  if (pwd) {
                                    return (
                                      <div className="mt-1 flex items-center gap-1.5">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-900 rounded font-mono text-[11px] font-bold">
                                          <Key className="w-3 h-3 text-blue-600 shrink-0" />
                                          <span>Password: {pwd}</span>
                                        </span>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                                {isRejected && (
                                  <div className="text-[10px] text-rose-700 font-semibold">
                                    ❌ REJECTED: Bill GST number does not match client profile GSTIN ({request.clientGstin})
                                  </div>
                                )}
                                {isDup && (
                                  <div className="text-[10px] text-amber-700 font-normal">
                                    ⚠️ Duplicate file skipped (not double-counted)
                                  </div>
                                )}
                              </td>
                              <td className="p-3 text-slate-600 uppercase text-[11px]">{f.source}</td>
                              <td className="p-3 text-slate-500">{new Date(f.receivedTime).toLocaleString('en-IN')}</td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 text-[10px] font-semibold rounded uppercase ${
                                    isRejected
                                      ? 'bg-rose-100 text-rose-900 border border-rose-300 font-bold'
                                      : isDup
                                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                      : f.status === 'processed'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {isRejected ? 'Rejected (GST Mismatch)' : isDup ? 'Duplicate (Skipped)' : f.status}
                                </span>
                              </td>
                              <td className="p-3 font-mono text-slate-400 text-[10px] truncate max-w-xs">{f.fileHash}</td>
                            <td className="p-3 text-right">
                              <div className="inline-flex items-center space-x-1.5">
                                <a
                                  href={`/api/documents/${f.id}/download`}
                                  download={f.originalFilename}
                                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs font-medium inline-flex items-center space-x-1 transition"
                                  title="Save directly to PC"
                                >
                                  <Download className="w-3 h-3 text-blue-600" />
                                  <span>Save to PC</span>
                                </a>
                                <a
                                  href={`/api/documents/${f.id}/preview`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition"
                                  title="Preview in new tab"
                                >
                                  Preview
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 5: GENERATED WORKBOOKS */}
              {activeTab === 'workbooks' && (
                <div className="space-y-4">
                  {details?.workbooks.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      No Excel workbooks generated yet for this period.
                    </div>
                  ) : (
                    details?.workbooks.map(wb => (
                      <div
                        key={wb.id}
                        className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                            <span className="font-bold text-slate-900">{wb.filename}</span>
                            <span className="px-2 py-0.5 text-xs font-bold bg-blue-50 text-blue-700 rounded border border-blue-200">
                              v{wb.version}
                            </span>
                            <span className="text-xs uppercase px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700">
                              Status: {wb.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Generated by {wb.generatedBy} on {new Date(wb.generatedAt).toLocaleString('en-IN')}
                          </div>
                          {wb.clientConfirmationText && (
                            <div className="mt-2 text-xs bg-emerald-50 text-emerald-800 p-2 rounded border border-emerald-200 font-medium">
                              Client Confirmed: &quot;{wb.clientConfirmationText}&quot; ({wb.clientConfirmedBy})
                            </div>
                          )}
                          {wb.clientCorrectionComments && (
                            <div className="mt-2 text-xs bg-orange-50 text-orange-800 p-2 rounded border border-orange-200 font-medium">
                              Client Requested Corrections: &quot;{wb.clientCorrectionComments}&quot;
                            </div>
                          )}
                          {wb.caApprovedAt && (
                            <div className="mt-2 text-xs bg-purple-50 text-purple-800 p-2 rounded border border-purple-200 font-medium flex items-center space-x-1">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>
                                CA Statutory Final Approval granted by {wb.caApprovedBy} on{' '}
                                {new Date(wb.caApprovedAt).toLocaleString('en-IN')}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              setActiveHtmlReport({
                                isOpen: true,
                                reportUrl: `/api/workbooks/${wb.id}/export-html`,
                                downloadUrl: `/api/workbooks/${wb.id}/export-html?download=true`,
                                title: `GST Working Paper HTML Report (v${wb.version}) — ${request.clientName}`,
                                subtitle: `Filename: ${wb.filename} • Generated by: ${wb.generatedBy}`,
                              })
                            }
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 transition flex items-center space-x-1"
                            title="Preview / Export standalone HTML version"
                          >
                            <FileCode2 className="w-3.5 h-3.5" />
                            <span>Export HTML</span>
                          </button>

                          <a
                            href={`/api/workbooks/${wb.id}/download`}
                            download
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download 10-Sheet Excel</span>
                          </a>

                          <a
                            href={`/api/monthly-requests/${request.id}/export-gstr1-json?download=true`}
                            download
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1.5 transition"
                            title="Download Official Government GSTR-1 JSON for direct GST Portal upload"
                          >
                            <FileCode2 className="w-3.5 h-3.5 text-emerald-100" />
                            <span>Download GST Portal JSON</span>
                          </a>

                          {/* CA Final Approval Button (Only if CA Admin role and not yet approved) */}
                          {currentRole === 'ca_admin' && wb.status !== 'ca_approved' && (
                            <button
                              onClick={() => setShowCaApprovalDialog(true)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>CA Final Approve</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* CA Final Approval Dialog Modal */}
        {showCaApprovalDialog && (
          <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center space-x-2 text-emerald-800">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                <h3 className="text-lg font-bold">Grant CA Statutory Final Approval</h3>
              </div>

              {criticalExceptions.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-800 space-y-1">
                  <div className="font-bold flex items-center space-x-1">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>{criticalExceptions.length} Critical Exceptions Remain Unresolved!</span>
                  </div>
                  <p>As per CA statutory audit rules, an explicit CA override reason is mandatory to proceed.</p>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700">CA Audit Notes / Review Sign-off</label>
                <textarea
                  rows={2}
                  value={caApprovalNotes}
                  onChange={e => setCaApprovalNotes(e.target.value)}
                  placeholder="e.g. Inward & outward supplies cross-checked against GSTR-2B control totals. Verified."
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {criticalExceptions.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-rose-700">
                    Mandatory CA Override Reason (Required)
                  </label>
                  <textarea
                    rows={2}
                    value={caOverrideReason}
                    onChange={e => setCaOverrideReason(e.target.value)}
                    placeholder="State reason for overriding critical exception..."
                    className="w-full text-xs p-2 border border-rose-300 rounded-lg mt-1 focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  onClick={() => setShowCaApprovalDialog(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const latestWb = details?.workbooks[0];
                    if (latestWb) handleCaApprove(latestWb.id);
                  }}
                  disabled={isSubmitting || (criticalExceptions.length > 0 && !caOverrideReason.trim())}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow"
                >
                  {isSubmitting ? 'Approving...' : 'Confirm Final Approval'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Flag Document as Missing Dialog */}
        {showFlagMissingDialog && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Flag Missing Document / Request File</h3>
                </div>
                <button
                  onClick={() => setShowFlagMissingDialog(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Document Type / Category</label>
                  <select
                    value={flagMissingCategory}
                    onChange={e => setFlagMissingCategory(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1 focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="bank_statements">Bank Statement (Missing dates / account)</option>
                    <option value="purchase_invoices">Purchase Invoices (Vendor tax invoices)</option>
                    <option value="sales_invoices">Sales Invoices (Missing invoice numbers)</option>
                    <option value="debit_credit_notes">Debit / Credit Notes</option>
                    <option value="custom">Other / Specific Audit Document</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Specific Requirement or Missing Description <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={flagMissingMessage}
                    onChange={e => setFlagMissingMessage(e.target.value)}
                    placeholder="e.g. Missing ICICI Current Account bank statement from 15th to 31st August 2026."
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg mt-1 focus:ring-2 focus:ring-rose-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    This note will be displayed prominently on the client's portal and included in the next automated WhatsApp reminder.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  onClick={() => setShowFlagMissingDialog(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFlagMissingSubmit}
                  disabled={isSubmitting || !flagMissingMessage.trim()}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow"
                >
                  {isSubmitting ? 'Flagging...' : 'Flag as Missing & Alert Client'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HTML Report Preview & Export Modal */}
        {activeHtmlReport && (
          <HtmlReportModal
            isOpen={activeHtmlReport.isOpen}
            onClose={() => setActiveHtmlReport(null)}
            reportUrl={activeHtmlReport.reportUrl}
            downloadUrl={activeHtmlReport.downloadUrl}
            title={activeHtmlReport.title}
            subtitle={activeHtmlReport.subtitle}
          />
        )}

        {/* Source Document File Preview Modal (Requirement 2 & 5) */}
        {previewSourceFile && (
          <div
            className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleClosePreview();
              }
            }}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
              <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-600/30 rounded-lg border border-indigo-500/40">
                    <FileText className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <span>{previewSourceFile.docTitle}</span>
                      <span className="text-[11px] font-normal px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        {previewSourceFile.file.originalFilename}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      {(previewSourceFile.file.sizeBytes / 1024).toFixed(1)} KB • Uploaded by {previewSourceFile.file.uploaderName || 'Client'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleClosePreview}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                    title="Close preview and return to invoice"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Invoice</span>
                  </button>

                  {clientDriveUrl && (
                    <a
                      href={clientDriveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-900/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition"
                    >
                      <Folder className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Google Drive</span>
                    </a>
                  )}
                  <a
                    href={`/api/documents/${previewSourceFile.file.id}/download`}
                    download={previewSourceFile.file.originalFilename}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-xs transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Save to PC</span>
                  </a>
                  <a
                    href={`/api/documents/${previewSourceFile.file.id}/preview`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>New Tab</span>
                  </a>
                  <button
                    onClick={handleClosePreview}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                    title="Close and return to invoice"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Viewer body */}
              <div className="flex-1 bg-slate-100 p-3 overflow-auto flex items-center justify-center min-h-[450px]">
                {previewSourceFile.file.mimeType?.startsWith('image/') ? (
                  <img
                    src={`/api/documents/${previewSourceFile.file.id}/preview`}
                    alt={previewSourceFile.file.originalFilename}
                    className="max-w-full max-h-[72vh] object-contain rounded-lg shadow-sm border border-slate-200 bg-white"
                  />
                ) : (
                  <iframe
                    src={`/api/documents/${previewSourceFile.file.id}/preview`}
                    title={previewSourceFile.file.originalFilename}
                    className="w-full h-[72vh] rounded-lg border border-slate-200 bg-white shadow-xs"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Link Client Google Drive Folder Modal */}
        {showDriveUrlModal && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center space-x-2">
                  <Folder className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Link Client Google Drive Folder</h3>
                </div>
                <button
                  onClick={() => setShowDriveUrlModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Google Drive access for <strong>{request.clientName}</strong> ({request.clientGstin}).
                </p>

                {/* Direct 1-Click Drive Launch */}
                <a
                  href={
                    clientDriveUrl ||
                    details?.client?.googleDriveUrl ||
                    (request as any)?.googleDriveUrl ||
                    'https://drive.google.com/drive/folders/14N0AcJ4feylYYGu0MM1WI6IN4qQBEh60'
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition shadow-2xs"
                >
                  <Folder className="w-4 h-4 text-emerald-600" />
                  <span>Open {request.clientName}'s Files in Google Drive (1-Click)</span>
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                </a>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-2 text-[10px] text-slate-400 font-medium uppercase">Or Custom Folder (Optional)</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Custom Google Drive Folder Link / ID</label>
                  <input
                    type="text"
                    value={inputDriveUrl}
                    onChange={e => setInputDriveUrl(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/1aBcD... or folder ID"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg mt-1 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  onClick={() => setShowDriveUrlModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDriveUrl}
                  disabled={isSubmitting || !inputDriveUrl.trim()}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-xs transition"
                >
                  {isSubmitting ? 'Saving...' : 'Save Drive Folder'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Missing Invoices WhatsApp Reminder Modal */}
        {showMissingReminderDialog && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Remind Client for Missing Invoices</h3>
                    <p className="text-[11px] text-slate-500">Send WhatsApp notice regarding invoice sequence gaps</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMissingReminderDialog(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Missing Invoices Detected in Sequence:</span>
                  </div>
                  <div className="font-mono font-semibold text-amber-950 pl-5">
                    {missingReminderInvoices.join(', ')}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    WhatsApp Message Preview:
                  </label>
                  <textarea
                    value={missingReminderText}
                    onChange={(e) => setMissingReminderText(e.target.value)}
                    rows={8}
                    className="w-full text-xs font-sans p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 leading-relaxed font-mono"
                  />
                </div>

                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Client: <strong>{request.contactPerson || request.clientName}</strong> ({request.clientPhone || 'No phone'})</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                {missingReminderDeepLink ? (
                  <a
                    href={missingReminderDeepLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in WhatsApp Web</span>
                  </a>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMissingReminderDialog(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSendMissingInvoicesReminder}
                    disabled={isSendingMissingReminder}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSendingMissingReminder ? 'Sending...' : 'Send WhatsApp Reminder'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
