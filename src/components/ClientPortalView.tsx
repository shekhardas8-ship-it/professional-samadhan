// src/components/ClientPortalView.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Building2,
  Check,
  Send,
  MessageSquare,
  Clock,
  Shield,
  Layers,
  FileCode2,
  Trash2,
  Plus,
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  X,
  FileCheck,
  FolderPlus,
} from 'lucide-react';
import { HtmlReportModal } from './HtmlReportModal.tsx';

interface ClientPortalProps {
  initialToken?: string;
  isStandaloneClient?: boolean;
}

export const ClientPortalView: React.FC<ClientPortalProps> = ({ initialToken, isStandaloneClient = false }) => {
  const [token, setToken] = useState<string>(initialToken || '');
  const [availableClients, setAvailableClients] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // File Upload & Queue State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [pdfPassword, setPdfPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUploadAreaOpen, setIsUploadAreaOpen] = useState(true);
  const [targetCategory, setTargetCategory] = useState<'sales_invoices' | 'purchase_invoices' | 'bank_statements' | 'debit_credit_notes' | 'auto'>('auto');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadSectionRef = useRef<HTMLDivElement>(null);

  // Nil Transaction Declaration State
  const [showNilDeclaration, setShowNilDeclaration] = useState(false);
  const [declarationNotes, setDeclarationNotes] = useState('');
  const [declaredByName, setDeclaredByName] = useState('');

  // Workbook Approval State
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showCorrectionsDialog, setShowCorrectionsDialog] = useState(false);
  const [confirmationSignatory, setConfirmationSignatory] = useState('');
  const [correctionComments, setCorrectionComments] = useState('');
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [activeHtmlReport, setActiveHtmlReport] = useState<{
    isOpen: boolean;
    reportUrl: string;
    downloadUrl: string;
    title: string;
    subtitle: string;
  } | null>(null);

  const [uploadAckData, setUploadAckData] = useState<{
    ackReferenceId: string;
    ackMessage: string;
    filesUploaded: number;
    extractedCount: number;
    missingItems?: string[];
    isFullySatisfied?: boolean;
    dispatchResult?: any;
  } | null>(null);

  const handleCategoryNilToggle = async (categoryId: string, status: 'nil' | 'pending') => {
    if (!session) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/monthly-requests/${session.request.id}/declare-category`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: categoryId,
          status,
          declaredBy: session.client.contactPerson,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update category declaration');
      await fetchSession(token);
      setSuccessMsg(status === 'nil' ? `Marked "${categoryId.replace('_', ' ')}" as Nil / None this month.` : `Reset declaration for "${categoryId.replace('_', ' ')}".`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSession = async (currentToken: string) => {
    try {
      setLoading(true);
      setError(null);
      const queryParam = currentToken ? `?token=${encodeURIComponent(currentToken)}` : '';
      const res = await fetch(`/api/client-portal/session${queryParam}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to authenticate secure portal link.');
      }
      const data = await res.json();
      setSession(data);
      if (data.client?.id && !token) {
        setToken(data.client.id);
      }
      if (data.client?.contactPerson) {
        setDeclaredByName(data.client.contactPerson);
        setConfirmationSignatory(data.client.contactPerson);
      }
    } catch (err: any) {
      setError(err.message);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available real clients for switching
  useEffect(() => {
    fetch('/api/clients')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAvailableClients(data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const activeVal = initialToken || token || '';
    if (initialToken) {
      setToken(initialToken);
    }
    fetchSession(activeVal);
  }, [initialToken]);

  const removeSelectedFile = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const clearAllSelectedFiles = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  };

  const openUploadSection = () => {
    setIsUploadAreaOpen(true);
    setTimeout(() => {
      uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  };

  const handleUploadCategoryClick = (categoryId?: string) => {
    if (categoryId && ['sales_invoices', 'purchase_invoices', 'bank_statements', 'debit_credit_notes'].includes(categoryId)) {
      setTargetCategory(categoryId as any);
    } else {
      setTargetCategory('auto');
    }
    openUploadSection();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const incoming = Array.from(e.target.files);
      const existingQueueKeys = new Set(selectedFiles.map(f => `${f.name}_${f.size}`));
      const previouslyUploadedKeys = new Set(
        (session?.files || []).map((f: any) => `${f.originalFilename}_${f.sizeBytes}`)
      );

      const duplicatesInQueue: string[] = [];
      const duplicatesPreviouslyUploaded: string[] = [];
      const newFilesToStage: File[] = [];

      for (const file of incoming) {
        const key = `${file.name}_${file.size}`;
        if (existingQueueKeys.has(key)) {
          duplicatesInQueue.push(file.name);
        } else {
          existingQueueKeys.add(key);
          newFilesToStage.push(file);
          if (previouslyUploadedKeys.has(key)) {
            duplicatesPreviouslyUploaded.push(file.name);
          }
        }
      }

      if (duplicatesInQueue.length > 0) {
        setError(`Ignored ${duplicatesInQueue.length} duplicate file(s) already in your selection queue (${duplicatesInQueue.slice(0, 2).join(', ')}${duplicatesInQueue.length > 2 ? '...' : ''}).`);
      } else if (duplicatesPreviouslyUploaded.length > 0) {
        setError(`⚠️ Notice: ${duplicatesPreviouslyUploaded.length} selected file(s) were already uploaded previously for this period. Our system will automatically detect and skip duplicates to prevent double-counting.`);
      }

      setSelectedFiles(prev => [...prev, ...newFilesToStage]);
      setIsUploadAreaOpen(true);
      // Reset input value so same files can be re-selected if removed
      e.target.value = '';
    }
  };

  const handleUploadSubmit = async () => {
    if (selectedFiles.length === 0 || !session) return;

    try {
      setIsUploading(true);
      setError(null);
      setSuccessMsg(null);

      const formData = new FormData();
      formData.append('monthlyRequestId', session.request.id);
      formData.append('uploaderName', session.client.contactPerson);
      formData.append('source', 'client_portal');
      formData.append('targetCategory', targetCategory);

      if (pdfPassword.trim()) {
        formData.append('pdfPassword', pdfPassword.trim());
        formData.append('bankStatementPassword', pdfPassword.trim());
      }

      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setUploadAckData({
        ackReferenceId: data.ackReferenceId,
        ackMessage: data.ackMessage,
        filesUploaded: data.filesUploaded,
        extractedCount: data.extractedCount,
        missingItems: data.missingItems || [],
        isFullySatisfied: data.isFullySatisfied,
        dispatchResult: data.dispatchResult,
      });

      if (data.duplicateCount && data.duplicateCount > 0) {
        const newCount = data.filesUploaded - data.duplicateCount;
        setSuccessMsg(
          `Processed ${newCount} new document(s) (${data.extractedCount} invoices extracted). Notice: ${data.duplicateCount} duplicate file(s) were safely skipped to protect against duplicate GST calculations.`
        );
      } else if (data.missingItems && data.missingItems.length > 0) {
        setSuccessMsg(`Uploaded ${selectedFiles.length} file(s) (${data.extractedCount} invoices extracted). Notice: ${data.missingItems.length} document(s) still required to complete filing.`);
      } else {
        setSuccessMsg(`Successfully uploaded and scanned ${selectedFiles.length} document(s)! All monthly checklist requirements are complete.`);
      }
      setSelectedFiles([]);
      setPdfPassword('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchSession(token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleNilDeclarationSubmit = async () => {
    try {
      const res = await fetch(`/api/monthly-requests/${session.request.id}/declaration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noTransactions: true,
          declarationNotes,
          declaredBy: declaredByName,
        }),
      });
      if (!res.ok) throw new Error('Failed to record declaration');
      setShowNilDeclaration(false);
      setSuccessMsg('Nil transaction declaration recorded for CA audit review.');
      await fetchSession(token);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleClientConfirmWorkbook = async (action: 'approve' | 'request_corrections', workbookId: string) => {
    try {
      setIsSubmittingApproval(true);
      const res = await fetch(`/api/workbooks/${workbookId}/client-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          clientName: confirmationSignatory,
          comments: correctionComments,
          confirmationText: 'I confirm all applicable documents for this period have been supplied and the compiled figures are verified.',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit confirmation');

      setShowApproveDialog(false);
      setShowCorrectionsDialog(false);
      setSuccessMsg(action === 'approve' ? 'Workbook officially approved by client!' : 'Corrections request submitted to CA firm.');
      await fetchSession(token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const latestWorkbook = session?.workbooks?.[0];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Banner / Secure Link Switcher */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs text-slate-600">
          <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
          {isStandaloneClient ? (
            <span className="font-medium">
              Verified Client Session: <strong className="text-slate-900">{session?.client?.businessName || 'Loading...'}</strong>
            </span>
          ) : (
            <span>Restricted Client Portal (Protected via Scoped Upload Token)</span>
          )}
        </div>
        {isStandaloneClient ? (
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md font-mono text-[11px] font-semibold border border-emerald-200">
              GSTIN: {session?.client?.gstin || '...'}
            </span>
          </div>
        ) : (
          /* Business Picker for testing and portal navigation */
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-medium">Switch Business Client:</span>
            <select
              value={session?.client?.id || token}
              onChange={e => {
                setToken(e.target.value);
                fetchSession(e.target.value);
              }}
              className="text-xs border border-slate-300 rounded-lg p-1.5 bg-slate-50 font-medium text-slate-800"
            >
              {availableClients.length > 0 ? (
                availableClients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.businessName} ({c.gstin})
                  </option>
                ))
              ) : (
                <option value={session?.client?.id || ''}>
                  {session?.client?.businessName || 'Active Client'} ({session?.client?.gstin || 'GSTIN'})
                </option>
              )}
            </select>
          </div>
        )}
      </div>

      {loading && (
        <div className="text-center py-16 text-slate-500">Loading client records and upload portal...</div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-800 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          {uploadAckData && (
            <span className="font-mono text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-bold border border-emerald-300">
              {uploadAckData.ackReferenceId}
            </span>
          )}
        </div>
      )}

      {/* Digital Receipt & Automated Acknowledgement Card */}
      {uploadAckData && (
        <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-emerald-600 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-emerald-800/80 pb-3">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-base text-emerald-100">Official Document Receipt & Acknowledgement</h3>
            </div>
            <span className="font-mono text-xs bg-emerald-800/60 border border-emerald-500/40 text-emerald-200 px-2.5 py-1 rounded-md font-bold">
              Ref: {uploadAckData.ackReferenceId}
            </span>
          </div>

          <div className="text-xs text-slate-200 whitespace-pre-wrap font-mono bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            {uploadAckData.ackMessage}
          </div>

          {/* Missing items warning if any still pending */}
          {uploadAckData.missingItems && uploadAckData.missingItems.length > 0 ? (
            <div className="bg-amber-950/70 border border-amber-500/60 rounded-xl p-3 text-xs text-amber-200 space-y-1.5">
              <div className="font-bold flex items-center space-x-1.5 text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Notice: Additional Documents Still Required for {session?.request?.reportingMonth}</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-amber-100">
                {uploadAckData.missingItems.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
              <p className="text-[11px] text-amber-300">
                A WhatsApp notification has been dispatched to your phone listing these missing items.
              </p>
            </div>
          ) : (
            <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-3 text-xs text-emerald-200 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>All mandatory checklist items are complete! CA staff will now compile your returns.</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
            <div className="text-emerald-300">
              Status: <strong>{uploadAckData.dispatchResult?.mode === 'automated_meta_api' ? 'WhatsApp Sent Automatically via Meta API' : 'Acknowledgement Logged & Prepared'}</strong>
            </div>

            {uploadAckData.dispatchResult?.whatsappDeepLink && (
              <a
                href={uploadAckData.dispatchResult.whatsappDeepLink}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1"
              >
                <span>Open Receipt in WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      )}

      {session && !loading && (
        <>
          {/* Business Profile & Multi-Business Notice */}
          <div className="theme-banner text-white rounded-2xl p-6 shadow-xl border space-y-4 relative overflow-hidden">
            {/* Subtle card watermark */}
            <div className="absolute right-0 bottom-0 pointer-events-none opacity-[0.06] select-none translate-x-6 translate-y-6">
              <img src="/logo.jpg" alt="" className="w-60 h-60 object-contain filter grayscale contrast-125" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
              <div className="flex items-center space-x-4">
                <img
                  src="/logo.jpg"
                  alt="Professional Samadhan"
                  className="w-14 h-14 rounded-xl object-cover shadow-md border border-white/20 shrink-0"
                />
                <div>
                  <span className="text-xs uppercase tracking-wider theme-accent-text font-semibold">Professional Samadhan • Client GST Portal</span>
                  <h1 className="text-2xl font-bold tracking-tight mt-0.5">{session.client.businessName}</h1>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-1 font-mono">
                    <span>GSTIN: <strong>{session.client.gstin}</strong></span>
                    <span>Contact: {session.client.contactPerson}</span>
                    <span>Reporting Period: <strong className="text-white">{session.request.reportingMonth}</strong></span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-600/80 text-white border border-blue-400/40">
                  {session.request.status}
                </span>
                <div className="text-[11px] text-slate-400 mt-1">
                  Assigned CA Staff: {session.client.assignedStaffName || 'Professional Samadhan Team'}
                </div>
              </div>
            </div>

            {/* Sister Businesses notice if multiple businesses under same phone */}
            {session.sisterBusinesses && session.sisterBusinesses.length > 1 && (
              <div className="bg-blue-900/40 border border-blue-700/50 rounded-lg p-3 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>
                    Your contact number is linked to <strong>{session.sisterBusinesses.length} businesses</strong>. You are currently viewing <strong>{session.client.businessName}</strong>.
                  </span>
                </div>
                <span className="text-blue-300 font-medium">Verified isolation</span>
              </div>
            )}
          </div>

          {/* Missing Documents Alert Banner */}
          {session.missingItems && session.missingItems.length > 0 ? (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 shadow-xs flex items-start space-x-3 text-amber-900 animate-in fade-in">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <div className="font-bold text-sm flex items-center justify-between">
                  <span>Filing Action Required: {session.missingItems.length} Document(s) Still Missing for {session.request.reportingMonth}</span>
                  <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded font-semibold">Missing Documents</span>
                </div>
                <p className="text-xs text-amber-800">
                  Please upload the following required documents or confirm Nil below to complete your return:
                </p>
                <ul className="list-disc list-inside text-xs font-semibold text-amber-900 space-y-0.5 pt-1">
                  {session.missingItems.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 shadow-xs flex items-center space-x-3 text-emerald-900 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="flex-1">
                <div className="font-bold text-sm">All Monthly Documents Received & Complete!</div>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Your sales invoices, purchase bills, and bank statements for {session.request.reportingMonth} are complete. CA audit team is preparing your working paper.
                </p>
              </div>
            </div>
          )}

          {/* 1. Primary Highlight: Monthly Document Checklist (Full Width) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-blue-600" />
                  <span>Monthly Document Checklist</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Audit requirements for <strong>{session.request.reportingMonth}</strong> ({session.client.businessName})
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {session.missingItems?.length > 0 ? (
                  <span className="px-2.5 py-1 rounded-full text-xs bg-rose-100 text-rose-800 font-bold border border-rose-200 flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>{session.missingItems.length} Missing Requirements</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>All Requirements Complete</span>
                  </span>
                )}

                <button
                  onClick={() => {
                    openUploadSection();
                    fileInputRef.current?.click();
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Upload Documents</span>
                </button>

                <button
                  onClick={() => setShowNilDeclaration(true)}
                  className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition"
                  title="Declare zero business transactions for the entire month"
                >
                  Declare Entire Month Nil
                </button>
              </div>
            </div>

            {/* Checklist Category Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {session.checklist && session.checklist.length > 0 ? (
                session.checklist.map((item: any) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                      item.status === 'uploaded'
                        ? 'bg-emerald-50/50 border-emerald-300 shadow-xs'
                        : item.status === 'nil_declared'
                        ? 'bg-slate-50 border-slate-300'
                        : 'bg-rose-50/60 border-rose-300 shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                          {item.status === 'uploaded' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                          {item.status === 'missing' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
                          {item.status === 'nil_declared' && <Clock className="w-4 h-4 text-slate-400 shrink-0" />}
                          <span className="leading-tight">{item.label}</span>
                        </div>

                        <div className="shrink-0">
                          {item.status === 'uploaded' && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                              {item.uploadedCount} Extracted
                            </span>
                          )}
                          {item.status === 'missing' && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800 font-bold border border-rose-200">
                              Not Uploaded
                            </span>
                          )}
                          {item.status === 'nil_declared' && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-200 text-slate-700 font-semibold">
                              Nil / None
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-600 line-clamp-2">{item.description}</p>

                      {item.missingReason && (
                        <div className="mt-2 p-1.5 bg-rose-100/70 border border-rose-200 rounded text-[11px] text-rose-800 font-medium">
                          ⚠️ {item.missingReason}
                        </div>
                      )}
                      {item.nilNotes && (
                        <p className="text-[11px] text-slate-500 italic mt-1.5">Note: {item.nilNotes}</p>
                      )}
                    </div>

                    {/* Action buttons per checklist card */}
                    <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
                      {item.status === 'missing' ? (
                        <>
                          <button
                            onClick={() => handleUploadCategoryClick(item.id)}
                            className="font-bold text-blue-700 hover:text-blue-900 flex items-center space-x-1 py-0.5 px-1.5 rounded hover:bg-blue-100/60 transition"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Upload File</span>
                          </button>
                          <button
                            onClick={() => handleCategoryNilToggle(item.id, 'nil')}
                            className="text-slate-500 hover:text-slate-800 text-[11px] hover:underline"
                            title="Confirm no bills or transactions for this category this month"
                          >
                            Mark as Nil / None
                          </button>
                        </>
                      ) : item.status === 'nil_declared' ? (
                        <>
                          <span className="text-slate-400 text-[11px]">Confirmed Nil</span>
                          <button
                            onClick={() => handleCategoryNilToggle(item.id, 'pending')}
                            className="text-blue-600 hover:underline text-[11px] font-medium"
                          >
                            Undo / Upload File
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-emerald-700 font-medium text-[11px] flex items-center space-x-1">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Verified</span>
                          </span>
                          <button
                            onClick={() => handleUploadCategoryClick(item.id)}
                            className="text-slate-500 hover:text-blue-600 text-[11px] hover:underline"
                          >
                            + Upload More
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-center py-4 col-span-3">No checklist items configured.</div>
              )}
            </div>
          </div>

          {/* 2. Squeezed, Compact & Collapsible Upload Area */}
          <div ref={uploadSectionRef} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UploadCloud className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">
                  Upload Monthly Documents
                </h3>
                <span className="hidden sm:inline-block text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                  Up to 150 files per batch
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-400 hidden md:inline">PDF, JPG, PNG, XLSX, CSV (Max 25MB each)</span>
                <button
                  onClick={() => setIsUploadAreaOpen(!isUploadAreaOpen)}
                  className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center space-x-1 transition font-medium"
                >
                  <span>{isUploadAreaOpen ? 'Squeeze / Minimize' : 'Expand Upload Box'}</span>
                  {isUploadAreaOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.xlsx,.csv"
              className="hidden"
            />

            {!isUploadAreaOpen && selectedFiles.length === 0 ? (
              <div className="p-3 bg-slate-50 hover:bg-blue-50/40 border border-dashed border-slate-300 hover:border-blue-400 rounded-xl flex items-center justify-between transition cursor-pointer"
                   onClick={() => fileInputRef.current?.click()}>
                <div className="flex items-center space-x-2 text-xs text-slate-600">
                  <UploadCloud className="w-4 h-4 text-blue-600" />
                  <span>Click to select files (accepts multiple sales invoices, expense bills, and bank statements)</span>
                </div>
                <button
                  type="button"
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Select Files
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Target Section Selector */}
                <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-700 text-xs mr-1">Upload To Section:</span>
                  <button
                    type="button"
                    onClick={() => setTargetCategory('auto')}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center space-x-1.5 ${
                      targetCategory === 'auto'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span>✨ Smart Auto-Detect (Recommended)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetCategory('sales_invoices')}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center space-x-1.5 ${
                      targetCategory === 'sales_invoices'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span>Sales Invoices / Outward (GSTR-1)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetCategory('purchase_invoices')}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center space-x-1.5 ${
                      targetCategory === 'purchase_invoices'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span>Purchase Bills / Inward (ITC)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetCategory('bank_statements')}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center space-x-1.5 ${
                      targetCategory === 'bank_statements'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span>Bank Statements</span>
                  </button>
                </div>

                {/* Compact Dropzone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-4 sm:p-5 text-center cursor-pointer bg-slate-50 hover:bg-blue-50/40 transition space-y-1"
                >
                  <UploadCloud className="w-7 h-7 mx-auto text-blue-600" />
                  <div className="text-xs font-semibold text-slate-700">
                    Click to browse or drop files here (select multiple files at once)
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Supports high-volume batch uploads (up to 150 files), multi-page PDFs, bank statements, Excel workbooks & scanned bills.
                  </p>
                </div>

                {/* Staged Files Queue Editor (Add more, delete individual files, clear all) */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                      <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                        <span>Files Staged for Upload ({selectedFiles.length})</span>
                        <span className="text-slate-400 font-normal">
                          • Total {formatFileSize(selectedFiles.reduce((acc, f) => acc + f.size, 0))}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-blue-700 text-xs font-semibold rounded border border-blue-200 flex items-center space-x-1 transition shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add More Files</span>
                        </button>
                        <button
                          type="button"
                          onClick={clearAllSelectedFiles}
                          className="px-2 py-1 text-rose-600 hover:text-rose-800 text-xs hover:bg-rose-50 rounded transition"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    {/* Scrollable file list with Delete Option per file */}
                      {selectedFiles.map((file, idx) => {
                        const isAlreadyUploaded = session?.files?.some((f: any) => f.originalFilename === file.name && f.sizeBytes === file.size);
                        return (
                          <div
                            key={idx}
                            className={`text-xs p-2.5 rounded-lg border flex items-center justify-between group transition ${
                              isAlreadyUploaded
                                ? 'bg-amber-50/70 border-amber-300 hover:border-amber-400'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center space-x-2 min-w-0 flex-1 pr-2">
                              <FileText className={`w-4 h-4 shrink-0 ${isAlreadyUploaded ? 'text-amber-600' : 'text-blue-500'}`} />
                              <span className="font-medium text-slate-800 truncate" title={file.name}>
                                {file.name}
                              </span>
                              {isAlreadyUploaded && (
                                <span className="px-1.5 py-0.5 bg-amber-200 text-amber-900 text-[10px] font-bold rounded shrink-0">
                                  Already Uploaded (Will Skip)
                                </span>
                              )}
                            </div>

                            <div className="flex items-center space-x-3 shrink-0">
                              <span className="text-[11px] text-slate-400">{formatFileSize(file.size)}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeSelectedFile(idx);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                                title="Delete / remove this file from upload"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                    {/* Bank Statement Password Option */}
                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-1.5">
                      <div className="flex items-center space-x-1.5">
                        <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                        <span className="text-xs font-bold text-amber-900">
                          Bank Statement / Encrypted PDF Password (Optional)
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-tight">
                        Bank statements (SBI, HDFC, ICICI, Axis, PNB) are typically password-protected. Provide the password below so our OCR scanner can decrypt and scan it for your report.
                      </p>
                      <div className="relative mt-1">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={pdfPassword}
                          onChange={(e) => setPdfPassword(e.target.value)}
                          placeholder="e.g. PAN card number in CAPITALS or DOB (DDMMYYYY)"
                          className="w-full text-xs px-3 py-2 pr-10 border border-amber-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                          title={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Submit Upload Button */}
                    <button
                      onClick={handleUploadSubmit}
                      disabled={isUploading}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow transition flex items-center justify-center space-x-1.5"
                    >
                      {isUploading ? (
                        <span>Scanning & Extracting with PaddleOCR...</span>
                      ) : (
                        <>
                          <UploadCloud className="w-4 h-4" />
                          <span>Upload & Scan {selectedFiles.length} Document(s)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section: Compiled Excel Workbook Review & Client Confirmation */}
          {latestWorkbook ? (
            <div className="bg-white rounded-2xl shadow-sm border-2 border-blue-200 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Compiled GST Working Paper & Excel Workbook</h3>
                    <p className="text-xs text-slate-500">
                      Version: <strong>v{latestWorkbook.version}</strong> | Generated on {new Date(latestWorkbook.generatedAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() =>
                      setActiveHtmlReport({
                        isOpen: true,
                        reportUrl: `/api/workbooks/${latestWorkbook.id}/export-html`,
                        downloadUrl: `/api/workbooks/${latestWorkbook.id}/export-html?download=true`,
                        title: `GST Working Paper HTML Report (v${latestWorkbook.version})`,
                        subtitle: `${session.client.businessName} • Period: ${session.request.reportingMonth}`,
                      })
                    }
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 transition flex items-center space-x-1.5"
                    title="View and download standalone HTML statutory working paper"
                  >
                    <FileCode2 className="w-4 h-4 text-indigo-600" />
                    <span>View / Export HTML Report</span>
                  </button>

                  <a
                    href={`/api/workbooks/${latestWorkbook.id}/download`}
                    download
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition flex items-center space-x-1.5"
                  >
                    <Download className="w-4 h-4 text-blue-600" />
                    <span>Download Excel Workbook</span>
                  </a>
                </div>
              </div>

              {/* Status Banner */}
              {latestWorkbook.status === 'client_confirmed' ? (
                <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 text-xs text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center space-x-1.5 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>You have officially confirmed this workbook (v{latestWorkbook.version})</span>
                  </div>
                  <p>Confirmation recorded: &quot;{latestWorkbook.clientConfirmationText}&quot; by {latestWorkbook.clientConfirmedBy}</p>
                </div>
              ) : latestWorkbook.status === 'corrections_requested' ? (
                <div className="bg-orange-50 border border-orange-300 rounded-xl p-4 text-xs text-orange-900 space-y-1">
                  <div className="font-bold text-orange-800">Corrections Requested</div>
                  <p>Comments: &quot;{latestWorkbook.clientCorrectionComments}&quot;. Team Professional Samadhan is reviewing.</p>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                  <div className="text-xs text-blue-900">
                    Please review the 10-sheet Excel workbook. Confirm that all sales invoices, purchase invoices, and bank statements have been included accurately.
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setShowApproveDialog(true)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow transition flex items-center space-x-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirm & Approve Workbook</span>
                    </button>
                    <button
                      onClick={() => setShowCorrectionsDialog(true)}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-lg shadow transition flex items-center space-x-1.5"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Request Adjustments / Corrections</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center text-slate-500 space-y-3">
              <Clock className="w-8 h-8 mx-auto text-slate-400" />
              <div className="text-sm font-semibold text-slate-700">Workbook Pending Staff Compilation</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Once our CA staff reviews your uploaded documents and runs OCR reconciliation, the official 10-sheet Excel workbook will appear here for your review and approval.
              </p>
              <div>
                <button
                  onClick={() =>
                    setActiveHtmlReport({
                      isOpen: true,
                      reportUrl: `/api/monthly-requests/${session.request.id}/export-html`,
                      downloadUrl: `/api/monthly-requests/${session.request.id}/export-html?download=true`,
                      title: `Interim GST Working Paper HTML Report — ${session.client.businessName}`,
                      subtitle: `Period: ${session.request.reportingMonth} • Status: ${session.request.status}`,
                    })
                  }
                  className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 transition inline-flex items-center space-x-1.5"
                >
                  <FileCode2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Preview Uploaded Data as HTML</span>
                </button>
              </div>
            </div>
          )}

          {/* Upload History Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold text-slate-800 text-sm">Uploaded Document Register ({session.files?.length || 0})</h3>
              {session.files && session.files.length > 0 && session.request?.id && (
                <a
                  href={`/api/monthly-requests/${session.request.id}/download-zip`}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 transition inline-flex items-center space-x-1.5 shadow-sm"
                  title="Download all uploaded documents for this period as a single ZIP file"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Save All to PC (.ZIP)</span>
                </a>
              )}
            </div>
            {session.files?.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">No documents uploaded yet for this period.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                      <th className="py-2">Filename</th>
                      <th className="py-2">Source</th>
                      <th className="py-2">Upload Time</th>
                      <th className="py-2">Status</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {session.files.map((file: any) => {
                      const isDup = file.isDuplicate || file.status === 'duplicate_skipped' || file.status === 'duplicate_flagged';
                      return (
                        <tr key={file.id} className={isDup ? 'bg-amber-50/40' : ''}>
                          <td className="py-2 font-medium text-slate-800">
                            <div>{file.originalFilename}</div>
                            {isDup && (
                              <span className="text-[10px] text-amber-700 block font-normal">
                                ⚠️ Skipped duplicate (prevents double-counting in GST)
                              </span>
                            )}
                          </td>
                          <td className="py-2 text-slate-500 uppercase text-[11px]">{file.source}</td>
                          <td className="py-2 text-slate-500">{new Date(file.receivedTime).toLocaleString('en-IN')}</td>
                          <td className="py-2">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-semibold rounded uppercase ${
                                isDup
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : file.status === 'processed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {isDup ? 'Duplicate (Skipped)' : file.status}
                            </span>
                          </td>
                        <td className="py-2 text-right">
                          <div className="inline-flex items-center space-x-1.5">
                            <a
                              href={`/api/documents/${file.id}/download`}
                              download={file.originalFilename}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded border border-blue-200 transition inline-flex items-center space-x-1"
                              title="Save file directly to your PC"
                            >
                              <Download className="w-3 h-3 text-blue-600" />
                              <span>Save to PC</span>
                            </a>
                            <a
                              href={`/api/documents/${file.id}/preview`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded transition"
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
            )}
          </div>

          {/* Modal: Nil Declaration */}
          {showNilDeclaration && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900">Declare &quot;No Transactions / Nil Return&quot;</h3>
                <p className="text-xs text-slate-600">
                  By declaring nil transactions, you confirm that no sales invoices, purchase bills, or bank transactions were made during <strong>{session.request.reportingMonth}</strong>.
                </p>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Authorised Person Name</label>
                  <input
                    type="text"
                    value={declaredByName}
                    onChange={e => setDeclaredByName(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Reason / Notes</label>
                  <textarea
                    rows={2}
                    value={declarationNotes}
                    onChange={e => setDeclarationNotes(e.target.value)}
                    placeholder="e.g. Factory closed for annual maintenance..."
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2 border-t">
                  <button
                    onClick={() => setShowNilDeclaration(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleNilDeclarationSubmit}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow"
                  >
                    Submit Declaration
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal: Approve Workbook */}
          {showApproveDialog && latestWorkbook && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
                <div className="flex items-center space-x-2 text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-bold">Client Confirmation & Approval</h3>
                </div>
                <p className="text-xs text-slate-600">
                  You are approving <strong>{latestWorkbook.filename} (v{latestWorkbook.version})</strong> for <strong>{session.request.reportingMonth}</strong>.
                </p>
                <div className="bg-slate-50 p-3 rounded text-xs text-slate-700 italic border border-slate-200">
                  &quot;I confirm all applicable documents for this period have been supplied and the compiled figures are verified.&quot;
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Authorised Signatory Name</label>
                  <input
                    type="text"
                    value={confirmationSignatory}
                    onChange={e => setConfirmationSignatory(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2 border-t">
                  <button
                    onClick={() => setShowApproveDialog(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleClientConfirmWorkbook('approve', latestWorkbook.id)}
                    disabled={isSubmittingApproval || !confirmationSignatory}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow"
                  >
                    {isSubmittingApproval ? 'Submitting...' : 'Confirm & Approve'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal: Request Corrections */}
          {showCorrectionsDialog && latestWorkbook && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900">Request Adjustments / Corrections</h3>
                <p className="text-xs text-slate-600">
                  State the discrepancies or missing invoices so our staff can adjust the records and issue a new workbook version (v{latestWorkbook.version + 1}).
                </p>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Correction Details</label>
                  <textarea
                    rows={3}
                    value={correctionComments}
                    onChange={e => setCorrectionComments(e.target.value)}
                    placeholder="e.g. Sales invoice 042 was cancelled; please exclude from sales register..."
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg mt-1"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2 border-t">
                  <button
                    onClick={() => setShowCorrectionsDialog(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleClientConfirmWorkbook('request_corrections', latestWorkbook.id)}
                    disabled={isSubmittingApproval || !correctionComments}
                    className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-lg shadow"
                  >
                    {isSubmittingApproval ? 'Submitting...' : 'Send Correction Request'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
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
  );
};
