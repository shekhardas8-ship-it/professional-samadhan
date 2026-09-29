// src/components/CaDashboard.tsx
import React, { useState, useEffect } from 'react';
import { MonthlyRequest, MonthlyRequestStatus } from '../types/index.ts';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  Download,
  Eye,
  ExternalLink,
  PlusCircle,
  Play,
  FileSpreadsheet,
  Pause,
  AlertCircle,
  FileCode2,
  UserPlus,
  Users,
  Settings2,
  HardDrive,
  Trash2,
  X,
  Edit2,
} from 'lucide-react';
import { HtmlReportModal } from './HtmlReportModal.tsx';
import { ClientManagementModal } from './ClientManagementModal.tsx';

interface CaDashboardProps {
  requests: MonthlyRequest[];
  onOpenReview: (request: MonthlyRequest) => void;
  onOpenWhatsApp: (request: MonthlyRequest, actionType: 'initial' | 'reminder') => void;
  onGenerateWorkbook: (requestId: string) => Promise<void>;
  onTriggerSchedule: () => Promise<void>;
  onTogglePauseReminders: (requestId: string, paused: boolean) => Promise<void>;
  onOpenClientPortal: (token: string) => void;
  onRefresh?: () => void;
  isActionLoading: boolean;
}

export const CaDashboard: React.FC<CaDashboardProps> = ({
  requests,
  onOpenReview,
  onOpenWhatsApp,
  onGenerateWorkbook,
  onTriggerSchedule,
  onTogglePauseReminders,
  onOpenClientPortal,
  onRefresh,
  isActionLoading,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<string | null>(null);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [activeHtmlReport, setActiveHtmlReport] = useState<{
    isOpen: boolean;
    reportUrl: string;
    downloadUrl: string;
    title: string;
    subtitle: string;
  } | null>(null);

  // Client Deletion Confirmation State
  const [clientToDelete, setClientToDelete] = useState<{ id: string; name: string; gstin: string } | null>(null);
  const [isDeletingClient, setIsDeletingClient] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  const handleConfirmDeleteClient = async () => {
    if (!clientToDelete) return;
    try {
      setIsDeletingClient(true);
      setDeleteErrorMessage(null);
      const res = await fetch(`/api/clients/${clientToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete client');
      setClientToDelete(null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setDeleteErrorMessage(err.message);
    } finally {
      setIsDeletingClient(false);
    }
  };

  // Storage Health & Zero-Bloat Manager State
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const [storageInfo, setStorageInfo] = useState<{
    uploadCount: number;
    uploadSizeMB: number;
    workbookCount: number;
    workbookSizeMB: number;
    totalSizeMB: number;
    status: string;
  } | null>(null);
  const [isPurging, setIsPurging] = useState(false);
  const [storageMessage, setStorageMessage] = useState<string | null>(null);

  const fetchStorageInfo = async () => {
    try {
      const res = await fetch('/api/system/storage-info');
      if (res.ok) {
        const data = await res.json();
        setStorageInfo(data);
      }
    } catch (e) {
      console.error('Failed to fetch storage info:', e);
    }
  };

  useEffect(() => {
    fetchStorageInfo();
  }, []);

  const handlePurgeStorage = async () => {
    if (!window.confirm('Clean temporary files from cloud server? All extracted GST invoice records, tax numbers, and audit trails remain 100% safe in PostgreSQL.')) return;
    try {
      setIsPurging(true);
      setStorageMessage(null);
      const res = await fetch('/api/system/purge-storage', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setStorageMessage(data.message);
        fetchStorageInfo();
      } else {
        setStorageMessage(data.error || 'Failed to purge storage');
      }
    } catch (err: any) {
      setStorageMessage(err.message);
    } finally {
      setIsPurging(false);
    }
  };

  const statusList: { key: string; label: string; color: string }[] = [
    { key: 'all', label: 'All Filings', color: 'bg-slate-800 text-slate-200' },
    { key: 'Requested', label: 'Requested', color: 'bg-blue-100 text-blue-800' },
    { key: 'Awaiting Uploads', label: 'Awaiting Uploads', color: 'bg-amber-100 text-amber-800' },
    { key: 'Missing Documents', label: 'Missing Documents', color: 'bg-rose-100 text-rose-800' },
    { key: 'Needs Review', label: 'Needs Review', color: 'bg-purple-100 text-purple-800' },
    { key: 'Awaiting Client Confirmation', label: 'Awaiting Confirmation', color: 'bg-indigo-100 text-indigo-800' },
    { key: 'Corrections Requested', label: 'Corrections Requested', color: 'bg-orange-100 text-orange-800' },
    { key: 'Client Confirmed', label: 'Client Confirmed', color: 'bg-teal-100 text-teal-800' },
    { key: 'CA Approved', label: 'CA Approved', color: 'bg-emerald-100 text-emerald-800' },
  ];

  const getStatusBadge = (status: MonthlyRequestStatus) => {
    switch (status) {
      case 'Requested':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">Requested</span>;
      case 'Awaiting Uploads':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">Awaiting Uploads</span>;
      case 'Missing Documents':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Missing Documents</span>;
      case 'Needs Review':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1"><Clock className="w-3 h-3" /> Needs Review</span>;
      case 'Awaiting Client Confirmation':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">Awaiting Confirmation</span>;
      case 'Corrections Requested':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 border border-orange-200">Corrections Requested</span>;
      case 'Client Confirmed':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-800 border border-teal-200 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Client Confirmed</span>;
      case 'CA Approved':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> CA Approved</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const filteredRequests = requests.filter(r => {
    const matchesStatus = selectedStatus === 'all' || r.status === selectedStatus;
    const matchesSearch =
      searchTerm === '' ||
      r.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.clientGstin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reportingMonth?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Trigger Bar */}
      <div className="theme-banner text-white rounded-2xl p-6 shadow-xl border flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative overflow-hidden">
        {/* Subtle background watermark on banner */}
        <div className="absolute right-0 bottom-0 pointer-events-none opacity-[0.06] select-none translate-x-8 translate-y-8">
          <img src="/logo.jpg" alt="" className="w-64 h-64 object-contain filter grayscale contrast-125" />
        </div>

        <div className="flex items-center space-x-4 relative z-10">
          <img
            src="/logo.jpg"
            alt="Professional Samadhan"
            className="w-14 h-14 rounded-xl object-cover shadow-md border border-white/20 shrink-0"
          />
          <div>
            <span className="text-xs uppercase tracking-wider theme-accent-text font-semibold">Professional Samadhan • Chartered Accountants</span>
            <h1 className="text-2xl font-bold tracking-tight mt-0.5">GST Document Collection & Filing Pipeline</h1>
            <p className="text-sm text-slate-300 mt-1">
              Period: <strong>August 2026</strong> (Scheduled 1st of month at 9:00 AM IST. Automatic year rollover enabled).
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={() => {
              setIsStorageModalOpen(true);
              fetchStorageInfo();
            }}
            className="px-4 py-2 bg-black/30 hover:bg-black/40 text-slate-200 text-sm font-semibold rounded-lg border border-white/10 shadow transition flex items-center space-x-2"
            title="Inspect server disk usage and free up space"
          >
            <HardDrive className="w-4 h-4 text-amber-400" />
            <span>Storage: {storageInfo ? `${storageInfo.totalSizeMB} MB` : 'Checking...'}</span>
          </button>

          <button
            onClick={() => {
              setClientToEdit(null);
              setIsClientModalOpen(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow transition flex items-center space-x-2"
            title="Manage, search, edit existing clients or register new companies"
          >
            <Users className="w-4 h-4" />
            <span>Manage & Edit Clients</span>
          </button>

          <button
            onClick={onTriggerSchedule}
            disabled={isActionLoading}
            className="px-4 py-2 theme-btn-primary text-white text-sm font-semibold rounded-lg shadow transition flex items-center space-x-2"
            title="Create requests for previous month for all active clients"
          >
            <Play className="w-4 h-4" />
            <span>Trigger 1st-of-Month Intake</span>
          </button>
        </div>
      </div>

      {/* Bulk Selection Action Bar */}
      {selectedClientIds.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-xl p-3.5 px-5 shadow-lg flex flex-wrap items-center justify-between gap-3 border border-indigo-700 animate-in fade-in">
          <div className="flex items-center space-x-3 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{selectedClientIds.length} Client(s) Selected</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsClientModalOpen(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center space-x-1.5 transition"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Batch Update Selected Clients</span>
            </button>
            <button
              onClick={() => setSelectedClientIds([])}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Active Clients</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">{requests.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Under CA compliance audit</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="text-xs font-medium text-amber-600 uppercase tracking-wider">Awaiting Uploads</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {requests.filter(r => r.status === 'Requested' || r.status === 'Awaiting Uploads' || r.status === 'Missing Documents').length}
          </div>
          <div className="text-[11px] text-amber-500 mt-1">Automated reminders scheduled</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="text-xs font-medium text-purple-600 uppercase tracking-wider">Needs Review</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            {requests.filter(r => r.status === 'Needs Review' || r.status === 'Processing').length}
          </div>
          <div className="text-[11px] text-purple-500 mt-1">OCR done, check exceptions</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="text-xs font-medium text-indigo-600 uppercase tracking-wider">In Confirmation</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">
            {requests.filter(r => r.status === 'Awaiting Client Confirmation' || r.status === 'Corrections Requested').length}
          </div>
          <div className="text-[11px] text-indigo-500 mt-1">Excel workbook v1 generated</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 col-span-2 sm:col-span-4 lg:col-span-1">
          <div className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Confirmed & CA Approved</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {requests.filter(r => r.status === 'Client Confirmed' || r.status === 'CA Approved').length}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1">Ready for GSTR-1 & 3B return</div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {statusList.map(item => {
              const count = item.key === 'all' ? requests.length : requests.filter(r => r.status === item.key).length;
              return (
                <button
                  key={item.key}
                  onClick={() => setSelectedStatus(item.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 ${
                    selectedStatus === item.key
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedStatus === item.key ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search business, GSTIN..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Requests Table / Cards */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
            <AlertCircle className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="font-medium">No requests match the selected status.</p>
            <p className="text-xs text-slate-400 mt-1">Try switching to &quot;All Filings&quot; or trigger a monthly run.</p>
          </div>
        ) : (
          filteredRequests.map(req => {
            const hasExceptions = req.unresolvedExceptionsCount > 0;
            return (
              <div
                key={req.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 hover:border-blue-300 transition p-5 space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedClientIds.includes(req.clientId)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedClientIds([...selectedClientIds, req.clientId]);
                          } else {
                            setSelectedClientIds(selectedClientIds.filter(id => id !== req.clientId));
                          }
                        }}
                        title="Select client for batch update"
                        className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <h2 className="text-lg font-bold text-slate-900">{req.clientName}</h2>
                      <button
                        onClick={() => {
                          setClientToEdit(req.clientId);
                          setIsClientModalOpen(true);
                        }}
                        className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md text-xs font-semibold inline-flex items-center space-x-1 transition shadow-2xs cursor-pointer"
                        title={`Edit profile, phone number, GSTIN, and settings for ${req.clientName}`}
                      >
                        <Edit2 className="w-3 h-3 text-blue-600" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => {
                          setDeleteErrorMessage(null);
                          setClientToDelete({ id: req.clientId, name: req.clientName, gstin: req.clientGstin });
                        }}
                        className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-xs font-semibold inline-flex items-center space-x-1 transition shadow-2xs cursor-pointer"
                        title={`Delete client ${req.clientName} and associated filing records`}
                      >
                        <Trash2 className="w-3 h-3 text-rose-600" />
                        <span>Delete</span>
                      </button>
                      {getStatusBadge(req.status)}
                      {req.noTransactionsDeclared && (
                        <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-amber-50 text-amber-700 border border-amber-300">
                          Nil Return Declared
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                      <span>GSTIN: <strong className="text-slate-700 font-mono">{req.clientGstin}</strong></span>
                      <span>Contact: <strong>{req.contactPerson}</strong> ({req.registeredPhone})</span>
                      <span>Assigned Staff: <strong>{req.assignedStaffName || 'Pooja Verma'}</strong></span>
                      <span>Period: <strong>{req.reportingMonth}</strong></span>
                    </div>
                  </div>

                  {/* Right Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        setClientToEdit(req.clientId);
                        setIsClientModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition flex items-center space-x-1.5"
                      title="Edit client business name, phone, GSTIN, or assigned staff"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => onOpenReview(req)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 transition flex items-center space-x-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review Data & OCR</span>
                    </button>

                    <a
                      href={`/api/monthly-requests/${req.id}/download-package?purge=true`}
                      download
                      onClick={() => setTimeout(fetchStorageInfo, 3000)}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-lg border border-amber-300 transition flex items-center space-x-1.5"
                      title="Download complete zip package directly to local PC and auto-free server disk"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-700" />
                      <span>Save to PC (.zip)</span>
                    </a>

                    <button
                      onClick={() => onOpenWhatsApp(req, req.status === 'Requested' ? 'initial' : 'reminder')}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-300 transition flex items-center space-x-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>WhatsApp {req.reminderCount > 0 ? `Reminder (${req.reminderCount})` : 'Request'}</span>
                    </button>

                    <button
                      onClick={() => onGenerateWorkbook(req.id)}
                      disabled={isActionLoading}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition flex items-center space-x-1.5"
                      title="Compile and generate versioned 10-sheet Excel workbook"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                      <span>{req.activeWorkbookVersion > 0 ? `Regenerate (v${req.activeWorkbookVersion + 1})` : 'Generate Excel'}</span>
                    </button>

                    <button
                      onClick={() =>
                        setActiveHtmlReport({
                          isOpen: true,
                          reportUrl: `/api/monthly-requests/${req.id}/export-html`,
                          downloadUrl: `/api/monthly-requests/${req.id}/export-html?download=true`,
                          title: `GST Working Paper HTML Report — ${req.clientName}`,
                          subtitle: `GSTIN: ${req.clientGstin} • Period: ${req.reportingMonth} • Version: v${req.activeWorkbookVersion || 1}`,
                        })
                      }
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 transition flex items-center space-x-1.5"
                      title="Preview and Export Working Paper as interactive standalone HTML report"
                    >
                      <FileCode2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Export HTML</span>
                    </button>

                    <button
                      onClick={() => onOpenClientPortal(req.secureUploadToken)}
                      className="px-3 py-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 text-xs font-medium rounded-lg transition flex items-center space-x-1"
                      title="Open client's restricted upload portal in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Client Portal</span>
                    </button>
                  </div>
                </div>

                {/* Status Progress & Audit Bar */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-6">
                    <div>
                      <span className="text-slate-400">Files Uploaded:</span>{' '}
                      <strong className="text-slate-700">{req.totalFilesReceived} documents</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Extracted Invoices:</span>{' '}
                      <strong className="text-slate-700">{req.totalInvoicesExtracted} records</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Workbook:</span>{' '}
                      <strong className="text-slate-700">
                        {req.activeWorkbookVersion > 0 ? `v${req.activeWorkbookVersion}` : 'Not generated yet'}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {hasExceptions ? (
                      <span className="text-rose-600 font-semibold flex items-center space-x-1 bg-rose-50 px-2 py-1 rounded border border-rose-200">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{req.unresolvedExceptionsCount} Validation Exceptions</span>
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-medium flex items-center space-x-1 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Zero Exceptions</span>
                      </span>
                    )}

                    <button
                      onClick={() => onTogglePauseReminders(req.id, !req.remindersPaused)}
                      className={`px-2 py-1 rounded text-[11px] font-medium border flex items-center space-x-1 transition ${
                        req.remindersPaused
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Pause className="w-3 h-3" />
                      <span>{req.remindersPaused ? 'Reminders Paused' : 'Pause Reminders'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Standalone HTML Report Preview & Export Modal */}
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

      {/* Client Management & Bulk Operations Modal */}
      <ClientManagementModal
        isOpen={isClientModalOpen}
        onClose={() => {
          setIsClientModalOpen(false);
          setClientToEdit(null);
        }}
        onClientAddedOrUpdated={() => {
          if (onRefresh) onRefresh();
          setSelectedClientIds([]);
          setClientToEdit(null);
        }}
        selectedClientIds={selectedClientIds}
        initialEditClientId={clientToEdit}
        onClearEditClientId={() => setClientToEdit(null)}
      />

      {/* Server Storage Health & Zero-Bloat Purge Modal */}
      {isStorageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <HardDrive className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Server Storage & Zero-Bloat Manager</h3>
              </div>
              <button
                onClick={() => setIsStorageModalOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 space-y-1.5">
                <div className="font-bold flex items-center space-x-1.5 text-blue-800">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Point-to-Point Device Storage Model</span>
                </div>
                <p>
                  Client documents are parsed and validated immediately upon receipt, with 100% of GST invoices, line items, and tax numbers stored safely in your <strong>Neon PostgreSQL Cloud Database</strong>.
                </p>
                <p className="text-blue-700">
                  Click <strong>&quot;Save to PC (.zip)&quot;</strong> on any client card to stream all files directly into your local machine and automatically purge temporary copies from the cloud server.
                </p>
              </div>

              {storageInfo ? (
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-[11px] text-slate-500 font-medium uppercase">Client Uploads on Server</div>
                    <div className="text-xl font-bold text-slate-800 mt-1">{storageInfo.uploadSizeMB} MB</div>
                    <div className="text-xs text-slate-400">{storageInfo.uploadCount} files on temporary disk</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-[11px] text-slate-500 font-medium uppercase">Excel Workbooks</div>
                    <div className="text-xl font-bold text-slate-800 mt-1">{storageInfo.workbookSizeMB} MB</div>
                    <div className="text-xs text-slate-400">{storageInfo.workbookCount} compiled sheets</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-sm text-slate-400">Loading storage metrics...</div>
              )}

              {storageMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{storageMessage}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  Total Container Disk: <strong>{storageInfo ? `${storageInfo.totalSizeMB} MB` : '0 MB'}</strong>
                </div>
                <button
                  onClick={handlePurgeStorage}
                  disabled={isPurging}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow transition flex items-center space-x-1.5 disabled:opacity-50"
                  title="Purge temporary physical files while preserving 100% of database records"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isPurging ? 'Purging...' : '1-Click Free Server Space'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Client Confirmation Modal Popup */}
      {clientToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-rose-600 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>Confirm Client Deletion</span>
              </div>
              <button
                onClick={() => setClientToDelete(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <p className="text-slate-800 font-medium text-sm">
                Are you sure you want to permanently delete <strong className="text-rose-600 font-bold">{clientToDelete.name}</strong>?
              </p>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 font-mono text-[11px] text-slate-700">
                <div>Client ID: <strong>{clientToDelete.id}</strong></div>
                <div>GSTIN: <strong>{clientToDelete.gstin}</strong></div>
              </div>
              <p className="text-rose-700 font-medium pt-1">
                ⚠️ Warning: This will permanently remove this client profile along with all their monthly filing requests, OCR extracted invoices, bank statements, and WhatsApp audit history. This action cannot be undone.
              </p>
            </div>

            {deleteErrorMessage && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs">
                {deleteErrorMessage}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                disabled={isDeletingClient}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteClient}
                disabled={isDeletingClient}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingClient ? 'Deleting Client...' : 'Yes, Permanently Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
