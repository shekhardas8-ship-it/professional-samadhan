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
  Settings,
  ArrowLeft,
} from 'lucide-react';
import { HtmlReportModal } from './HtmlReportModal.tsx';

interface StaffReviewModalProps {
  request: MonthlyRequest;
  currentRole: UserRole;
  onClose: () => void;
  onGenerateWorkbook: (requestId: string) => Promise<void>;
  onRefreshParent: () => void;
}

export const StaffReviewModal: React.FC<StaffReviewModalProps> = ({
  request,
  currentRole,
  onClose,
  onGenerateWorkbook,
  onRefreshParent,
}) => {
  const [activeTab, setActiveTab] = useState<'checklist' | 'invoices' | 'bank' | 'files' | 'exceptions' | 'workbooks'>('checklist');
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<{
    files: DocumentFile[];
    extractedDocuments: ExtractedDocument[];
    lineItems: ExtractedLineItem[];
    bankTransactions: BankTransaction[];
    exceptions: ValidationException[];
    workbooks: GeneratedWorkbook[];
    checklist?: ChecklistCategoryItem[];
    missingItems?: string[];
    isFullySatisfied?: boolean;
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
  const [clientDriveUrl, setClientDriveUrl] = useState<string | null>(null);
  const [showDriveUrlModal, setShowDriveUrlModal] = useState(false);
  const [inputDriveUrl, setInputDriveUrl] = useState('');

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
        const docNo = match[1].trim().toLowerCase();
        targetDoc = details.extractedDocuments.find(d => d.docNumber && d.docNumber.toLowerCase().includes(docNo));
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

    // 2. Identify target exception matching this document unit, file id, or invoice number
    const targetEx = details?.exceptions.find(ex => {
      if (ex.documentUnitId && ex.documentUnitId === doc.id) return true;
      if (ex.documentFileId && ex.documentFileId === doc.documentFileId) return true;
      if (doc.docNumber && ex.message && ex.message.toLowerCase().includes(doc.docNumber.toLowerCase())) return true;
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
      const matchingDoc = details?.extractedDocuments.find(d => d.id === docId);
      const docExceptions = details?.exceptions.filter(ex => {
        if (ex.resolved) return false;
        if (ex.documentUnitId && ex.documentUnitId === docId) return true;
        if (matchingDoc && ex.documentFileId && ex.documentFileId === matchingDoc.documentFileId) return true;
        if (matchingDoc?.docNumber && ex.message && ex.message.toLowerCase().includes(matchingDoc.docNumber.toLowerCase())) return true;
        return false;
      }) || [];

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
      docDate: doc.docDate,
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
      const res = await fetch(`/api/extracted-documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
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

  const handleResolveException = async (exceptionId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/validation-exceptions/${exceptionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolved: !currentStatus,
          resolutionNotes: !currentStatus ? 'Manually verified and confirmed by staff.' : '',
        }),
      });
      if (!res.ok) throw new Error('Failed to update exception');
      await fetchDetails();
      onRefreshParent();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
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

            {/* Direct 1-Click Google Drive Access (Dedicated per Client) */}
            <a
              href={
                clientDriveUrl ||
                `https://drive.google.com/drive/search?q=${encodeURIComponent(
                  (request.clientName || '') + ' ' + (request.clientGstin || '')
                )}`
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
            className={`p-3 text-xs font-medium flex items-center justify-between ${
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
        <div className="bg-slate-100 px-6 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
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
              href={`/api/monthly-requests/${request.id}/download-package?purge=true`}
              download
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-lg border border-amber-300 transition flex items-center space-x-1.5"
              title="Download entire client package (.zip) to PC and purge server disk"
            >
              <Download className="w-3.5 h-3.5 text-amber-700" />
              <span>Save to PC (.zip)</span>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 1: INVOICES & NOTES */}
              {activeTab === 'invoices' && (
                <div className="space-y-4">
                  {details?.extractedDocuments.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">No invoices or debit/credit notes extracted yet.</div>
                  ) : (
                    details?.extractedDocuments.map(doc => {
                      const isEditing = editingDocId === doc.id;
                      const lineItems = details.lineItems.filter(l => l.documentUnitId === doc.id);

                      // Match all validation exceptions for this specific invoice
                      const docExceptions = details.exceptions.filter(ex => {
                        if (ex.documentUnitId && ex.documentUnitId === doc.id) return true;
                        if (ex.documentFileId && ex.documentFileId === doc.documentFileId) return true;
                        if (doc.docNumber && ex.message && ex.message.toLowerCase().includes(doc.docNumber.toLowerCase())) return true;
                        return false;
                      });
                      const unresolvedExceptions = docExceptions.filter(ex => !ex.resolved);

                      const isGstinMismatch = Boolean(
                        (doc.docType === 'sales_invoice' && doc.supplierGstin && request.clientGstin && doc.supplierGstin.trim().toUpperCase() !== request.clientGstin.trim().toUpperCase()) ||
                        (doc.docType === 'purchase_invoice' && doc.buyerGstin && request.clientGstin && doc.buyerGstin.trim().toUpperCase() !== request.clientGstin.trim().toUpperCase())
                      );

                      const isValidationRequired = unresolvedExceptions.length > 0 || isGstinMismatch || doc.reviewStatus === 'flagged';
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
                                    : 'bg-purple-100 text-purple-900 border-purple-300'
                                }`}
                              >
                                {doc.docType === 'sales_invoice'
                                  ? 'Sales Invoice (GSTR-1 Outward)'
                                  : doc.docType === 'purchase_invoice'
                                  ? 'Purchase Bill (ITC Inward)'
                                  : doc.docType === 'credit_note'
                                  ? 'Credit Note'
                                  : doc.docType === 'debit_note'
                                  ? 'Debit Note'
                                  : (doc.docType || 'Document')}
                              </span>
                              <span className="font-bold text-slate-800">{doc.docNumber || 'No Doc Number'}</span>
                              <span className="text-xs text-slate-400">Date: {doc.docDate || 'N/A'}</span>
                              <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                Conf: {doc.extractionConfidence}%
                              </span>

                              {/* Highlighted Status Buttons: Green [OK] and Red [Validation Required] */}
                              <div className="flex items-center space-x-1.5 ml-1">
                                {/* Green OK Button */}
                                <button
                                  onClick={() => handleMarkInvoiceOk(doc.id)}
                                  disabled={isSubmitting}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 transition cursor-pointer shadow-2xs ${
                                    isOk
                                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-600 ring-2 ring-emerald-300 shadow-sm'
                                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  }`}
                                  title={isOk ? "Invoice verified & validated OK. Click to re-confirm." : "Click to mark this invoice as OK & Verified"}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                  <span>OK</span>
                                </button>

                                {/* Red Validation Required Button */}
                                <button
                                  onClick={() => handleNavigateToValidationFromInvoice(doc)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-2xs ${
                                    isValidationRequired
                                      ? 'bg-rose-600 hover:bg-rose-500 text-white border border-rose-600 ring-2 ring-rose-300 shadow-sm animate-pulse'
                                      : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                  }`}
                                  title="Validation issues detected for this invoice. Click to redirect to Validation Exceptions page."
                                >
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                  <span>Validation Required</span>
                                  {unresolvedExceptions.length > 0 && (
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${isValidationRequired ? 'bg-white text-rose-700' : 'bg-rose-200 text-rose-800'}`}>
                                      {unresolvedExceptions.length}
                                    </span>
                                  )}
                                </button>
                              </div>

                              {isGstinMismatch && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs" title={`Invoice GST does not match client profile GST (${request.clientGstin}). File accepted and marked for CA verification.`}>
                                  <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                  <span>Not Matching Client GST</span>
                                </span>
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
                                  <label className="font-semibold text-slate-700">Invoice Date</label>
                                  <input
                                    type="text"
                                    value={editFormData.docDate || ''}
                                    onChange={e => setEditFormData({ ...editFormData, docDate: e.target.value })}
                                    className="w-full mt-1 p-2 border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-blue-500"
                                    placeholder="YYYY-MM-DD"
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
                                      step="0.01"
                                      value={editFormData.taxableAmount ?? 0}
                                      onChange={e => {
                                        const val = parseFloat(e.target.value) || 0;
                                        setEditFormData(prev => ({ ...prev, taxableAmount: val }));
                                      }}
                                      className="w-full mt-1 p-2 border border-slate-300 rounded-lg bg-white font-medium"
                                    />
                                  </div>
                                  <div>
                                    <label className="font-semibold text-slate-700">Central GST / CGST (₹)</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={editFormData.cgstAmount ?? 0}
                                      onChange={e => {
                                        const val = parseFloat(e.target.value) || 0;
                                        setEditFormData(prev => ({ ...prev, cgstAmount: val }));
                                      }}
                                      className="w-full mt-1 p-2 border border-slate-300 rounded-lg bg-white font-medium"
                                    />
                                  </div>
                                  <div>
                                    <label className="font-semibold text-slate-700">State GST / SGST (₹)</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={editFormData.sgstAmount ?? 0}
                                      onChange={e => {
                                        const val = parseFloat(e.target.value) || 0;
                                        setEditFormData(prev => ({ ...prev, sgstAmount: val }));
                                      }}
                                      className="w-full mt-1 p-2 border border-slate-300 rounded-lg bg-white font-medium"
                                    />
                                  </div>
                                  <div>
                                    <label className="font-semibold text-slate-700">Integrated GST / IGST (₹)</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={editFormData.igstAmount ?? 0}
                                      onChange={e => {
                                        const val = parseFloat(e.target.value) || 0;
                                        setEditFormData(prev => ({ ...prev, igstAmount: val }));
                                      }}
                                      className="w-full mt-1 p-2 border border-slate-300 rounded-lg bg-white font-medium"
                                    />
                                  </div>
                                  <div>
                                    <label className="font-semibold text-slate-700">Cess (₹)</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={editFormData.cessAmount ?? 0}
                                      onChange={e => {
                                        const val = parseFloat(e.target.value) || 0;
                                        setEditFormData(prev => ({ ...prev, cessAmount: val }));
                                      }}
                                      className="w-full mt-1 p-2 border border-slate-300 rounded-lg bg-white font-medium"
                                    />
                                  </div>
                                  <div>
                                    <label className="font-semibold text-slate-900">Total Invoice (₹)</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={editFormData.totalAmount ?? 0}
                                      onChange={e => {
                                        const val = parseFloat(e.target.value) || 0;
                                        setEditFormData(prev => ({ ...prev, totalAmount: val }));
                                      }}
                                      className="w-full mt-1 p-2 border border-slate-400 rounded-lg bg-white font-bold text-slate-900"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
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
                                  CGST: ₹{Number(doc.cgstAmount).toFixed(2)} | SGST: ₹{Number(doc.sgstAmount).toFixed(2)}
                                </div>
                                <div className="text-slate-600">IGST: ₹{Number(doc.igstAmount).toFixed(2)}</div>
                              </div>
                              <div>
                                <span className="text-slate-400">Total Value:</span>
                                <div className="text-base font-bold text-slate-900">
                                  ₹{Number(doc.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </div>
                                <div className="text-[11px] text-slate-400">Taxable: ₹{Number(doc.taxableAmount).toFixed(2)}</div>
                              </div>
                            </div>
                          )}

                          {/* Line Items Table */}
                          {lineItems.length > 0 && (
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
                                        <td className="py-1 text-slate-700">{l.itemDescription}</td>
                                        <td className="py-1 font-mono text-slate-500">{l.hsnSac || '-'}</td>
                                        <td className="py-1">{l.quantity ? `${l.quantity} ${l.unit || ''}` : '-'}</td>
                                        <td className="py-1">₹{Number(l.rate || 0).toFixed(2)}</td>
                                        <td className="py-1">₹{Number(l.taxableValue).toFixed(2)}</td>
                                        <td className="py-1">{Number(l.taxRatePercent || 18)}%</td>
                                        <td className="py-1 text-right font-medium text-slate-800">
                                          ₹{Number(l.totalAmount).toFixed(2)}
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
                    })
                  )}
                </div>
              )}

              {/* TAB 2: BANK TRANSACTIONS */}
              {activeTab === 'bank' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Extracted bank statement transactions reconciled against statements</span>
                    <span>Total Extracted: {details?.bankTransactions.length || 0}</span>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="min-w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Date</th>
                          <th className="p-3">Bank & Account</th>
                          <th className="p-3">Narration / Description</th>
                          <th className="p-3">Reference No</th>
                          <th className="p-3 text-right">Debit (₹)</th>
                          <th className="p-3 text-right">Credit (₹)</th>
                          <th className="p-3 text-right">Balance (₹)</th>
                          <th className="p-3 text-center w-12">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {details?.bankTransactions.map(tx => (
                          <tr key={tx.id} className="hover:bg-slate-50">
                            <td className="p-3 text-slate-700 whitespace-nowrap">{tx.transactionDate}</td>
                            <td className="p-3 text-slate-800">
                              <div className="font-medium">{tx.bankName}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{tx.accountNumber}</div>
                            </td>
                            <td className="p-3 text-slate-700 font-mono text-[11px] max-w-xs truncate">{tx.narration}</td>
                            <td className="p-3 font-mono text-slate-500 text-[11px]">{tx.referenceNumber || '-'}</td>
                            <td className="p-3 text-right text-rose-600 font-medium">
                              {Number(tx.debitAmount) > 0 ? `₹${Number(tx.debitAmount).toFixed(2)}` : '-'}
                            </td>
                            <td className="p-3 text-right text-emerald-600 font-medium">
                              {Number(tx.creditAmount) > 0 ? `₹${Number(tx.creditAmount).toFixed(2)}` : '-'}
                            </td>
                            <td className="p-3 text-right text-slate-900 font-semibold">
                              {tx.balance ? `₹${Number(tx.balance).toFixed(2)}` : '-'}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleDeleteBankTx(tx.id)}
                                disabled={isSubmitting}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                                title="Delete this bank transaction"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

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
                    details?.exceptions.map(ex => (
                      <div
                        key={ex.id}
                        id={`exception-card-${ex.id}`}
                        className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition duration-300 ${
                          highlightedExceptionId === ex.id
                            ? 'border-rose-500 ring-4 ring-rose-400 bg-rose-50/90 shadow-lg'
                            : ex.resolved
                            ? 'bg-slate-50 border-slate-200 opacity-60'
                            : ex.severity === 'critical'
                            ? 'bg-rose-50 border-rose-200'
                            : 'bg-amber-50 border-amber-200'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
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
                            <span className="text-xs font-semibold text-slate-700">Check: {ex.checkType}</span>
                            {ex.resolved && (
                              <span className="text-xs text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                                RESOLVED
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-medium text-slate-800">{ex.message}</p>
                          {ex.resolutionNotes && (
                            <p className="text-[11px] text-slate-500 italic">Resolution: {ex.resolutionNotes}</p>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          {/* Requirement 3: Source Invoice / Notes Button */}
                          <button
                            onClick={() => handleNavigateToInvoiceFromException(ex)}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition cursor-pointer"
                            title="Open specific invoice & notes to inspect and correct on same page"
                          >
                            <FileText className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Source Invoice / Notes</span>
                            <ArrowRight className="w-3 h-3 text-indigo-600" />
                          </button>

                          <button
                            onClick={() => handleResolveException(ex.id, ex.resolved)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                              ex.resolved
                                ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                : 'bg-blue-600 text-white hover:bg-blue-500'
                            }`}
                          >
                            {ex.resolved ? 'Reopen Exception' : 'Mark Resolved'}
                          </button>
                        </div>
                      </div>
                    ))
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
                      href={`/api/monthly-requests/${request.id}/download-package?purge=true`}
                      download
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shadow-xs inline-flex items-center space-x-1.5 self-start sm:self-auto transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Package & Purge Server (.zip)</span>
                    </a>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="min-w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
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
                          const isDup = f.isDuplicate || f.status === 'duplicate_skipped' || f.status === 'duplicate_flagged';
                          const isRejected = f.status === 'rejected_gstin_mismatch';
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
                  href={`https://drive.google.com/drive/search?q=${encodeURIComponent((request.clientName || '') + ' ' + (request.clientGstin || ''))}`}
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
      </div>
    </div>
  );
};
