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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeHtmlReport, setActiveHtmlReport] = useState<{
    isOpen: boolean;
    reportUrl: string;
    downloadUrl: string;
    title: string;
    subtitle: string;
  } | null>(null);

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
  }, [request.id]);

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
      totalAmount: doc.totalAmount,
      reviewStatus: 'verified',
    });
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
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
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

                      return (
                        <div
                          key={doc.id}
                          className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3 hover:border-blue-300 transition"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <select
                                value={doc.docType}
                                onChange={e => handleQuickChangeDocType(doc.id, e.target.value)}
                                className={`px-2 py-0.5 text-xs font-bold uppercase rounded border transition cursor-pointer ${
                                  doc.docType === 'sales_invoice'
                                    ? 'bg-blue-100 text-blue-900 border-blue-300'
                                    : doc.docType === 'purchase_invoice'
                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                    : 'bg-purple-100 text-purple-900 border-purple-300'
                                }`}
                                title="Click to reclassify (Sales Invoice vs Purchase Bill)"
                              >
                                <option value="sales_invoice">Sales Invoice (GSTR-1 Outward)</option>
                                <option value="purchase_invoice">Purchase Bill (ITC Inward)</option>
                                <option value="credit_note">Credit Note</option>
                                <option value="debit_note">Debit Note</option>
                              </select>
                              <span className="font-bold text-slate-800">{doc.docNumber || 'No Doc Number'}</span>
                              <span className="text-xs text-slate-400">Date: {doc.docDate || 'N/A'}</span>
                              <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                Conf: {doc.extractionConfidence}%
                              </span>
                              {((doc.docType === 'sales_invoice' && doc.supplierGstin && request.clientGstin && doc.supplierGstin.trim().toUpperCase() !== request.clientGstin.trim().toUpperCase()) ||
                                (doc.docType === 'purchase_invoice' && doc.buyerGstin && request.clientGstin && doc.buyerGstin.trim().toUpperCase() !== request.clientGstin.trim().toUpperCase())) && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs" title={`Invoice GST does not match client profile GST (${request.clientGstin}). File accepted and marked for CA verification.`}>
                                  <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                  <span>Not Matching Client GST</span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center space-x-2">
                              {isEditing ? (
                                <button
                                  onClick={() => handleSaveDoc(doc.id)}
                                  disabled={isSubmitting}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  <span>Save Changes</span>
                                </button>
                              ) : (
                                <div className="flex items-center space-x-1.5">
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
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg text-xs">
                              <div>
                                <label className="font-semibold text-slate-600">Document Type</label>
                                <select
                                  value={editFormData.docType || 'sales_invoice'}
                                  onChange={e => setEditFormData({ ...editFormData, docType: e.target.value as any })}
                                  className="w-full mt-1 p-1.5 border rounded bg-white font-medium"
                                >
                                  <option value="sales_invoice">Sales Invoice (Outward)</option>
                                  <option value="purchase_invoice">Purchase Invoice (Inward)</option>
                                  <option value="credit_note">Credit Note</option>
                                  <option value="debit_note">Debit Note</option>
                                </select>
                              </div>
                              <div>
                                <label className="font-semibold text-slate-600">Invoice Number</label>
                                <input
                                  type="text"
                                  value={editFormData.docNumber || ''}
                                  onChange={e => setEditFormData({ ...editFormData, docNumber: e.target.value })}
                                  className="w-full mt-1 p-1.5 border rounded bg-white"
                                />
                              </div>
                              <div>
                                <label className="font-semibold text-slate-600">Invoice Date</label>
                                <input
                                  type="text"
                                  value={editFormData.docDate || ''}
                                  onChange={e => setEditFormData({ ...editFormData, docDate: e.target.value })}
                                  className="w-full mt-1 p-1.5 border rounded bg-white"
                                />
                              </div>
                              <div>
                                <label className="font-semibold text-slate-600">Supplier Name</label>
                                <input
                                  type="text"
                                  value={editFormData.supplierName || ''}
                                  onChange={e => setEditFormData({ ...editFormData, supplierName: e.target.value })}
                                  className="w-full mt-1 p-1.5 border rounded bg-white"
                                />
                              </div>
                              <div>
                                <label className="font-semibold text-slate-600">Supplier GSTIN</label>
                                <input
                                  type="text"
                                  value={editFormData.supplierGstin || ''}
                                  onChange={e => setEditFormData({ ...editFormData, supplierGstin: e.target.value })}
                                  className="w-full mt-1 p-1.5 border rounded bg-white font-mono"
                                />
                              </div>
                              <div>
                                <label className="font-semibold text-slate-600">Buyer Name</label>
                                <input
                                  type="text"
                                  value={editFormData.buyerName || ''}
                                  onChange={e => setEditFormData({ ...editFormData, buyerName: e.target.value })}
                                  className="w-full mt-1 p-1.5 border rounded bg-white"
                                />
                              </div>
                              <div>
                                <label className="font-semibold text-slate-600">Buyer GSTIN</label>
                                <input
                                  type="text"
                                  value={editFormData.buyerGstin || ''}
                                  onChange={e => setEditFormData({ ...editFormData, buyerGstin: e.target.value })}
                                  className="w-full mt-1 p-1.5 border rounded bg-white font-mono"
                                />
                              </div>
                              <div>
                                <label className="font-semibold text-slate-600">Taxable Value (₹)</label>
                                <input
                                  type="number"
                                  value={editFormData.taxableAmount || 0}
                                  onChange={e => setEditFormData({ ...editFormData, taxableAmount: parseFloat(e.target.value) })}
                                  className="w-full mt-1 p-1.5 border rounded bg-white"
                                />
                              </div>
                              <div>
                                <label className="font-semibold text-slate-600">Total Invoice (₹)</label>
                                <input
                                  type="number"
                                  value={editFormData.totalAmount || 0}
                                  onChange={e => setEditFormData({ ...editFormData, totalAmount: parseFloat(e.target.value) })}
                                  className="w-full mt-1 p-1.5 border rounded bg-white"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
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
                        className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                          ex.resolved
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

                        <button
                          onClick={() => handleResolveException(ex.id, ex.resolved)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            ex.resolved
                              ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                              : 'bg-blue-600 text-white hover:bg-blue-500'
                          }`}
                        >
                          {ex.resolved ? 'Reopen Exception' : 'Mark Resolved'}
                        </button>
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
      </div>
    </div>
  );
};
