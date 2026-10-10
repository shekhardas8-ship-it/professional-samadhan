// src/components/CaExecutiveCockpit.tsx
import React, { useState, useEffect } from 'react';
import { MonthlyRequest } from '../types/index.ts';
import {
  Users,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Play,
  ArrowRight,
  PlusCircle,
  Building2,
  Calendar,
  Sparkles,
  Briefcase,
  CalendarDays,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Check,
  Send,
  Plus,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  Globe,
  Edit2,
  Upload,
  Download,
  Trash2,
} from 'lucide-react';
import {
  INITIAL_CLIENTS_DATA,
  INITIAL_COMPLIANCE_CALENDAR,
  INITIAL_ADHOC_REQUESTS,
  INITIAL_PENDING_TAX_7_DAYS,
  INITIAL_ACCUMULATED_TASKS_7_DAYS,
  ATTACHED_DOC_TEMPLATES,
} from '../services/frontPageDataService.ts';
import { getAccumulated7DaysPendingTasks } from '../services/pendingTasksService.ts';
import {
  getStoredComplianceCalendar,
  syncStatutoryPortals,
  REGULATORY_PORTALS,
} from '../services/statutoryComplianceService.ts';
import { DashboardPreferences } from '../services/dashboardPreferencesService.ts';
import { FirmBrandingConfig } from '../services/brandingService.ts';
import { AuthUser, ComplianceCalendarItem } from '../types/index.ts';

export interface CaExecutiveCockpitProps {
  requests: MonthlyRequest[];
  currentUser?: AuthUser | null;
  firmBranding?: FirmBrandingConfig;
  preferences?: DashboardPreferences;
  isEmbedded?: boolean;
  onNavigateTab: (tab: string) => void;
  onTriggerSchedule: () => Promise<void>;
  onOpenNewClientModal: () => void;
  onRefreshParent?: () => void;
  isActionLoading: boolean;
}

export const CaExecutiveCockpit: React.FC<CaExecutiveCockpitProps> = ({
  requests,
  currentUser,
  firmBranding,
  preferences,
  isEmbedded = false,
  onNavigateTab,
  onTriggerSchedule,
  onOpenNewClientModal,
  onRefreshParent,
  isActionLoading,
}) => {
  // Front page state for highlighted client in Directory & KYC subsection
  const [activeKycClientId, setActiveKycClientId] = useState<string>('cli_social_corn_01');
  const [isAddDirectorModalOpen, setIsAddDirectorModalOpen] = useState(false);
  const [newDirectorName, setNewDirectorName] = useState('');
  const [newDirectorPhone, setNewDirectorPhone] = useState('+91 ');
  const [newDirectorEmail, setNewDirectorEmail] = useState('');
  const [newDirectorDin, setNewDirectorDin] = useState('');
  const [newDirectorPan, setNewDirectorPan] = useState('');
  const [newDirectorAadhar, setNewDirectorAadhar] = useState('');
  const [newDirectorBank, setNewDirectorBank] = useState('');
  const [newDirectorAadharFile, setNewDirectorAadharFile] = useState<{ url?: string; name?: string }>({});
  const [isUploadingModalAadhar, setIsUploadingModalAadhar] = useState(false);
  const [modalAadharNotice, setModalAadharNotice] = useState('');

  const [selectedDirIndex, setSelectedDirIndex] = useState(0);
  const [editingCin, setEditingCin] = useState(false);
  const [cinInput, setCinInput] = useState('');
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressInput, setAddressInput] = useState('');

  const [editingAadharDirectorId, setEditingAadharDirectorId] = useState<string | null>(null);
  const [aadharEditValue, setAadharEditValue] = useState('');
  const [editingPanDirectorId, setEditingPanDirectorId] = useState<string | null>(null);
  const [panEditValue, setPanEditValue] = useState('');
  const [editingDinDirectorId, setEditingDinDirectorId] = useState<string | null>(null);
  const [dinEditValue, setDinEditValue] = useState('');
  const [editingBankDirectorId, setEditingBankDirectorId] = useState<string | null>(null);
  const [bankEditValue, setBankEditValue] = useState('');

  const [isProcessingKycDoc, setIsProcessingKycDoc] = useState(false);
  const [kycNoticeMsg, setKycNoticeMsg] = useState('');

  const handleModalAadharUpload = async (file: File) => {
    if (!file) return;
    setIsUploadingModalAadhar(true);
    setModalAadharNotice('Scanning Aadhaar document with AI/OCR...');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('clientId', activeClient?.id || 'client');
      fd.append('targetDocType', 'aadhar');
      const res = await fetch('/api/kyc/upload-and-extract', {
        method: 'POST',
        headers: { 'x-user-role': 'ca_admin' },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      if (data.aadharNumber) {
        setNewDirectorAadhar(data.aadharNumber);
        setModalAadharNotice(`Auto-Detected Aadhaar: ${data.aadharNumber}`);
      } else {
        setModalAadharNotice('Uploaded file successfully. Please verify or enter Aadhaar number.');
      }
      setNewDirectorAadharFile({ url: data.fileUrl, name: data.fileName });
      setTimeout(() => setModalAadharNotice(''), 4500);
    } catch (err: any) {
      setModalAadharNotice('Upload error: ' + err.message);
    } finally {
      setIsUploadingModalAadhar(false);
    }
  };

  // Load clients state from localStorage or defaults
  const [clients, setClients] = useState(() => {
    const saved = localStorage.getItem('ps_clients_kyc_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_CLIENTS_DATA;
      }
    }
    return INITIAL_CLIENTS_DATA;
  });

  const activeClient = clients.find((c: any) => c.id === activeKycClientId) || clients[0];

  // Fetch live clients from database
  const fetchLiveClients = async () => {
    try {
      const res = await fetch('/api/clients');
      if (res.ok) {
        const liveClients = await res.json();
        if (Array.isArray(liveClients) && liveClients.length > 0) {
          setClients(liveClients);
          localStorage.setItem('ps_clients_kyc_data', JSON.stringify(liveClients));
        }
      }
    } catch (err) {
      console.warn('Live clients fetch error:', err);
    }
  };

  useEffect(() => {
    fetchLiveClients();
    window.addEventListener('ps_clients_updated', fetchLiveClients);
    return () => {
      window.removeEventListener('ps_clients_updated', fetchLiveClients);
    };
  }, []);

  const handleSaveCin = async () => {
    try {
      const res = await fetch(`/api/clients/${activeClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cin: cinInput.trim() }),
      });
      if (res.ok) {
        await fetchLiveClients();
        setEditingCin(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveAddress = async () => {
    try {
      const res = await fetch(`/api/clients/${activeClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addressInput.trim() }),
      });
      if (res.ok) {
        await fetchLiveClients();
        setEditingAddress(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUploadKycForDirector = async (file: File, directorId: string, docType: 'aadhar' | 'pan' | 'bank' | 'din') => {
    if (!file) return;
    setIsProcessingKycDoc(true);
    setKycNoticeMsg(`Scanning ${docType.toUpperCase()} file with AI/OCR...`);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('clientId', activeClient.id);
      fd.append('directorId', directorId);
      fd.append('targetDocType', docType);

      const res = await fetch('/api/kyc/upload-and-extract', {
        method: 'POST',
        headers: { 'x-user-role': 'ca_admin' },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      await fetchLiveClients();
      setKycNoticeMsg(
        docType === 'aadhar' && data.aadharNumber
          ? `Aadhaar Auto-Detected: ${data.aadharNumber}`
          : docType === 'pan' && data.panNumber
          ? `PAN Auto-Detected: ${data.panNumber}`
          : 'Document uploaded & verified successfully!'
      );
      setTimeout(() => setKycNoticeMsg(''), 4500);
    } catch (err: any) {
      setKycNoticeMsg('Upload error: ' + err.message);
    } finally {
      setIsProcessingKycDoc(false);
    }
  };

  const handleSaveDirectorField = async (directorId: string, field: string, value: string) => {
    try {
      const res = await fetch(`/api/clients/${activeClient.id}/directors/${directorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value.trim() }),
      });
      if (res.ok) {
        await fetchLiveClients();
        setEditingAadharDirectorId(null);
        setEditingPanDirectorId(null);
        setEditingDinDirectorId(null);
        setEditingBankDirectorId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUploadAttachedDoc = async (file: File, tmplKey: string, categoryNumber: number, docName: string) => {
    if (!file) return;
    setIsProcessingKycDoc(true);
    setKycNoticeMsg(`Uploading ${docName}...`);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('clientId', activeClient.id);
      fd.append('docKey', tmplKey);
      fd.append('docName', docName);
      fd.append('categoryNumber', String(categoryNumber));

      const res = await fetch(`/api/clients/${activeClient.id}/attached-docs/upload`, {
        method: 'POST',
        headers: { 'x-user-role': 'ca_admin' },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      await fetchLiveClients();
      setKycNoticeMsg(`Uploaded ${docName}!`);
      setTimeout(() => setKycNoticeMsg(''), 4000);
    } catch (err: any) {
      setKycNoticeMsg('Upload failed: ' + err.message);
    } finally {
      setIsProcessingKycDoc(false);
    }
  };

  // Dynamic compliance calendar items across all 11 regulatory portals
  const [calendarItems, setCalendarItems] = useState<ComplianceCalendarItem[]>(() => {
    return getStoredComplianceCalendar();
  });
  const [selectedPortalCategory, setSelectedPortalCategory] = useState<string>('all');
  const [isSyncingPortals, setIsSyncingPortals] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string>('');

  React.useEffect(() => {
    const handleSync = () => {
      setCalendarItems(getStoredComplianceCalendar());
    };
    window.addEventListener('ps_data_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('ps_data_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const handleSyncPortalsNow = async () => {
    setIsSyncingPortals(true);
    setSyncStatusMsg('Syncing 11 portals...');
    try {
      const res = await syncStatutoryPortals();
      setCalendarItems(res.items);
      setSyncStatusMsg(`Synced ${res.total} deadlines across 11 portals`);
      setTimeout(() => setSyncStatusMsg(''), 4000);
    } catch {
      setSyncStatusMsg('Synced (cached)');
      setTimeout(() => setSyncStatusMsg(''), 3000);
    } finally {
      setIsSyncingPortals(false);
    }
  };

  const handleAddDirector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDirectorName.trim() && !newDirectorAadhar && !newDirectorDin) {
      alert('Please enter at least a name or ID number');
      return;
    }

    const newDir = {
      id: `dir_${Date.now()}`,
      name: (newDirectorName || 'Director').trim(),
      din: newDirectorDin.trim() || undefined,
      phone: newDirectorPhone.trim() || undefined,
      email: newDirectorEmail.trim() || undefined,
      aadharNumber: newDirectorAadhar.trim() || undefined,
      panNumber: newDirectorPan.trim().toUpperCase() || undefined,
      bankDetails: newDirectorBank.trim() || undefined,
      aadharUploaded: Boolean(newDirectorAadharFile.url || newDirectorAadhar),
      panUploaded: Boolean(newDirectorPan),
      bankDocUploaded: Boolean(newDirectorBank),
      dinDocUploaded: Boolean(newDirectorDin),
      aadharDocFileName: newDirectorAadharFile.name || undefined,
      aadharDocUrl: newDirectorAadharFile.url || undefined,
    };

    const updated = clients.map((c: any) => {
      if (c.id === activeClient.id) {
        return {
          ...c,
          directors: [...(c.directors || []), newDir],
        };
      }
      return c;
    });

    setClients(updated);
    localStorage.setItem('ps_clients_kyc_data', JSON.stringify(updated));

    try {
      await fetch(`/api/clients/${activeClient.id}/directors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'ca_admin' },
        body: JSON.stringify(newDir),
      });
      await fetchLiveClients();
    } catch (err) {
      console.warn('Backend sync queued:', err);
    }

    setIsAddDirectorModalOpen(false);
    setNewDirectorName('');
    setNewDirectorPhone('+91 ');
    setNewDirectorEmail('');
    setNewDirectorDin('');
    setNewDirectorPan('');
    setNewDirectorAadhar('');
    setNewDirectorBank('');
    setNewDirectorAadharFile({});
  };

  // Compute stats
  const totalClients = clients.length;
  const currentPeriod = requests[0]?.reportingMonth || 'August 2026';
  const [pending7DayTasksCount, setPending7DayTasksCount] = useState<number>(() => {
    return getAccumulated7DaysPendingTasks().length;
  });

  useEffect(() => {
    const handleSync = () => {
      setPending7DayTasksCount(getAccumulated7DaysPendingTasks().length);
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('ps_tasks_updated', handleSync);
    window.addEventListener('ps_data_updated', handleSync);
    window.addEventListener('focus', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('ps_tasks_updated', handleSync);
      window.removeEventListener('ps_data_updated', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, []);

  const isCompact = preferences?.density === 'compact';

  return (
    <div className={`${isCompact ? 'space-y-5' : 'space-y-7'} animate-in fade-in duration-300`}>
      {/* 1. Executive Chartered Accountant Banner */}
      {!isEmbedded && (
        <div className={`theme-banner text-white rounded-3xl ${isCompact ? 'p-4 sm:p-5' : 'p-6 sm:p-8'} shadow-xl border relative overflow-hidden`}>
          <div className="absolute right-0 bottom-0 pointer-events-none opacity-[0.05] select-none translate-x-10 translate-y-10">
            <img src={firmBranding?.logoUrl || "/logo.jpg"} alt="" className="w-80 h-80 object-contain filter grayscale contrast-125" />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center space-x-4">
              <img
                src={firmBranding?.logoUrl || "/logo.jpg"}
                alt="QuinceCA"
                className="w-16 h-16 rounded-2xl object-cover shadow-xl border-2 border-white/20 shrink-0"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs uppercase tracking-wider theme-accent-text font-bold">
                    {firmBranding?.firmName || 'QuinceCA • Chartered Accountants'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full theme-badge border font-semibold">
                    Practice Cockpit
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
                  {currentUser?.displayName || firmBranding?.tagline || 'CA Suraj Dutta (FCA)'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-teal-300" />
                  <span>Active Statutory Period: <strong>{currentPeriod}</strong></span>
                  <span>•</span>
                  <span>Portfolio: <strong>{totalClients} Corporate & GST Clients</strong></span>
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigateTab('gst-itr-filing')}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition flex items-center space-x-2 border border-emerald-400/30"
                title="Direct GST & ITR Government E-Filing Hub (₹0 Cost)"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-200" />
                <span>Govt E-Filing Hub</span>
                <span className="bg-white/20 text-emerald-100 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">₹0 Free</span>
              </button>

              <button
                onClick={onOpenNewClientModal}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition flex items-center space-x-2"
                title="Register a new business under practice management"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Onboard Client</span>
              </button>

              <button
                onClick={onTriggerSchedule}
                disabled={isActionLoading}
                className="px-4 py-2.5 theme-btn-primary text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition flex items-center space-x-2"
                title="Trigger automatic 1st-of-month GST intake schedule"
              >
                <Play className="w-4 h-4" />
                <span>{isActionLoading ? 'Processing...' : 'Run 1st-of-Month Intake'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Top Navigation & Section Selector (Matching the 6 top boxes in wireframe) */}
      {(!preferences || preferences.showTopModuleCards) && (
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Core Practice Modules & Statutory Sections
              </h2>
            </div>
            <span className="text-xs text-slate-400">Direct Navigation</span>
          </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {/* 1. Client Directory & KYC */}
          <div
            onClick={() => onNavigateTab('clients')}
            className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-teal-500 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-teal-700 leading-tight">
                Client Directory & kyc.
              </h3>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-teal-700 font-semibold">
              <span>{totalClients} Clients</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 2. Routine work (GST etc) */}
          <div
            onClick={() => onNavigateTab('gst-pipeline')}
            className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-500 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 leading-tight">
                Routine work (GST etc)
              </h3>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-blue-700 font-semibold">
              <span>Monthly Filings</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 3. Govt E-Filing Hub */}
          <div
            onClick={() => onNavigateTab('gst-itr-filing')}
            className="bg-gradient-to-b from-emerald-50/60 to-white rounded-2xl p-4 border-2 border-emerald-500/50 shadow-sm hover:shadow-md hover:border-emerald-600 transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
          >
            <div className="absolute top-2 right-2">
              <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">₹0 Fee</span>
            </div>
            <div>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 leading-tight">
                Govt E-Filing Hub
              </h3>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-emerald-700 font-bold">
              <span>GST & ITR v1.5</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 4. Adhoc Request */}
          <div
            onClick={() => onNavigateTab('adhoc-requests')}
            className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-purple-500 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Briefcase className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-purple-700 leading-tight">
                Adhoc Request
              </h3>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-purple-700 font-semibold">
              <span>{INITIAL_ADHOC_REQUESTS.length} Engagements</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 5. Compliance Calendar */}
          <div
            onClick={() => onNavigateTab('compliance-calendar')}
            className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <CalendarDays className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 leading-tight">
                Compliance Calendar
              </h3>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-emerald-700 font-semibold">
              <span>Auto Generated</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 6. Next 7 days Pending task */}
          <div
            onClick={() => onNavigateTab('pending-task')}
            className="bg-white rounded-2xl p-4 border border-rose-200/80 shadow-sm hover:shadow-md hover:border-rose-500 transition-all cursor-pointer group flex flex-col justify-between bg-rose-50/20"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-rose-700 leading-tight">
                Next 7 days Pending task
              </h3>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-rose-700 font-bold">
              <span>{pending7DayTasksCount} Urgent Alerts</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 7. Billing & Finance */}
          <div
            onClick={() => onNavigateTab('billing-finance')}
            className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-amber-500 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <CreditCard className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-amber-700 leading-tight">
                Billing & Finance
              </h3>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-amber-700 font-semibold">
              <span>Invoices & Fee</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
      )}

      {/* 3. Three-Column Spotlight Subsections (Directly matching wireframe diagram structure) */}
      {((!preferences || preferences.showClientKycSpotlight) ||
        (!preferences || preferences.showAdhocCatalog) ||
        (!preferences || preferences.showComplianceCalendar)) && (
        <div className={`grid grid-cols-1 ${
          ((!preferences || preferences.showClientKycSpotlight ? 1 : 0) +
           (!preferences || preferences.showAdhocCatalog ? 1 : 0) +
           (!preferences || preferences.showComplianceCalendar ? 1 : 0)) === 3
            ? 'lg:grid-cols-3'
            : ((!preferences || preferences.showClientKycSpotlight ? 1 : 0) +
               (!preferences || preferences.showAdhocCatalog ? 1 : 0) +
               (!preferences || preferences.showComplianceCalendar ? 1 : 0)) === 2
            ? 'md:grid-cols-2'
            : 'grid-cols-1'
        } gap-6 items-start`}>
          {/* COLUMN 1: Client Directory & KYC (Briopox Pvt Ltd Wireframe Structure) */}
          {(!preferences || preferences.showClientKycSpotlight) && (
          <div className={`bg-white rounded-3xl border border-slate-200 ${isCompact ? 'p-3.5 space-y-3' : 'p-5 space-y-4'} shadow-sm hover:border-teal-400 transition-all`}>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
                  Subsection 1
                </span>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-teal-600" />
                  <span>Client Directory & kyc.</span>
                </h3>
              </div>

              <button
                onClick={() => onNavigateTab('clients')}
                className="text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center gap-0.5"
              >
                <span>Full View</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Client Details Box */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Client:</span>
                <select
                  value={activeClient.id}
                  onChange={e => {
                    setActiveKycClientId(e.target.value);
                    setSelectedDirIndex(0);
                  }}
                  className="font-black text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 text-xs cursor-pointer hover:border-teal-400 focus:outline-none"
                >
                  {clients.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.businessName || c.displayName}
                    </option>
                  ))}
                </select>
              </div>

              {/* CIN with Edit */}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">CIN:</span>
                {editingCin ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={cinInput}
                      onChange={e => setCinInput(e.target.value)}
                      placeholder="e.g. U74999DL2021PTC384592"
                      className="text-xs px-2 py-0.5 border border-teal-400 rounded bg-white font-mono uppercase focus:outline-none"
                    />
                    <button
                      onClick={handleSaveCin}
                      className="px-2 py-0.5 bg-teal-600 text-white rounded text-[10px] font-bold hover:bg-teal-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingCin(false)}
                      className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px]"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-800">
                      {activeClient.cin || 'U74999DL2021PTC384592'}
                    </span>
                    <button
                      onClick={() => {
                        setCinInput(activeClient.cin || 'U74999DL2021PTC384592');
                        setEditingCin(true);
                      }}
                      className="p-0.5 hover:bg-slate-200 text-slate-400 hover:text-teal-700 rounded"
                      title="Edit CIN"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* GST No */}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">GST No:</span>
                <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {activeClient.gstin}
                </span>
              </div>

              {/* Address with Edit */}
              <div className="pt-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500 block">Address:</span>
                  {!editingAddress && (
                    <button
                      onClick={() => {
                        setAddressInput(activeClient.address || 'Plot No. 44, Okhla Industrial Area Phase-III, New Delhi - 110020');
                        setEditingAddress(true);
                      }}
                      className="p-0.5 hover:bg-slate-200 text-slate-400 hover:text-teal-700 rounded"
                      title="Edit Address"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {editingAddress ? (
                  <div className="mt-1 space-y-1">
                    <textarea
                      value={addressInput}
                      onChange={e => setAddressInput(e.target.value)}
                      rows={2}
                      className="w-full text-[11px] p-1.5 border border-teal-400 rounded bg-white focus:outline-none"
                    />
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={handleSaveAddress}
                        className="px-2 py-0.5 bg-teal-600 text-white rounded text-[10px] font-bold hover:bg-teal-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingAddress(false)}
                        className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px]"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-700 mt-0.5 text-[11px] leading-relaxed">
                    {activeClient.address || 'Plot No. 44, Okhla Industrial Area Phase-III, New Delhi - 110020'}
                  </p>
                )}
              </div>

              {/* Director Names & Phone/Email */}
              <div className="pt-2 border-t border-slate-200/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-700">
                    Director Names: {(activeClient.directors || []).map((d: any, i: number) => `${i + 1}. ${d.name}`).join(' ')} ....
                  </span>
                </div>
                <p className="text-[11px] text-teal-700 font-semibold mb-2">
                  (We can Add other director as well)
                </p>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1 text-[11px]">
                  <div className="font-bold text-slate-800">Director Phone and email id:</div>
                  {(activeClient.directors || []).map((dir: any, idx: number) => (
                    <div key={dir.id || idx} className="text-slate-600 pl-1 border-l-2 border-teal-500">
                      <strong>{dir.name}:</strong> {dir.phone || '+91 98112 34567'} • {dir.email || 'director@briopox.com'}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setIsAddDirectorModalOpen(true)}
                  className="mt-2 w-full py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-bold border border-teal-200 transition flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Other Director</span>
                </button>
              </div>
            </div>

            {/* Attached Documents (1-13 List from Wireframe) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Attached Documents :-
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {(activeClient.attachedDocuments || []).length}/13 Uploaded
                </span>
              </div>

              <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200/80 max-h-56 overflow-y-auto space-y-1.5 text-xs">
                {ATTACHED_DOC_TEMPLATES.map(tmpl => {
                  const attached = (activeClient.attachedDocuments || []).find(
                    (d: any) => d.docKey === tmpl.key || d.categoryNumber === tmpl.categoryNumber
                  );
                  return (
                    <div
                      key={tmpl.key}
                      className="flex items-center justify-between py-1.5 px-2 bg-white rounded-lg border border-slate-100 hover:border-slate-300 transition"
                    >
                      <span className="text-slate-800 font-medium truncate pr-2" title={tmpl.name}>
                        <strong>{tmpl.categoryNumber}.</strong> {tmpl.name}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          attached ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {attached ? '✓ Uploaded' : 'Pending'}
                        </span>

                        {attached?.fileUrl && (
                          <a
                            href={attached.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            download
                            className="p-1 hover:bg-slate-100 text-teal-700 rounded transition"
                            title={`Download ${tmpl.name}`}
                          >
                            <Download className="w-3 h-3" />
                          </a>
                        )}

                        <label
                          className="p-1 hover:bg-slate-100 text-slate-500 hover:text-teal-700 rounded cursor-pointer transition"
                          title={`Upload ${tmpl.name}`}
                        >
                          <Upload className="w-3 h-3" />
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,image/*,.doc,.docx"
                            onChange={e => {
                              if (e.target.files?.[0]) {
                                handleUploadAttachedDoc(e.target.files[0], tmpl.key, tmpl.categoryNumber, tmpl.name);
                                e.target.value = '';
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Director KYC (4 items from Wireframe with Auto-Extraction, Edit and Download) */}
            {(() => {
              const activeDirectors = (activeClient.directors && activeClient.directors.length > 0)
                ? activeClient.directors
                : [{ id: 'dir_default', name: 'Primary Director' }];
              const currentDirector = activeDirectors[selectedDirIndex] || activeDirectors[0];

              return (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                      Director KYC:
                    </span>
                    {activeDirectors.length > 1 && (
                      <div className="flex items-center gap-1">
                        {activeDirectors.map((d: any, idx: number) => (
                          <button
                            key={d.id || idx}
                            onClick={() => setSelectedDirIndex(idx)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
                              selectedDirIndex === idx
                                ? 'bg-teal-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {d.name.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Processing / auto-fetch notice */}
                  {(kycNoticeMsg || isProcessingKycDoc) && (
                    <div className="text-[11px] p-2 bg-teal-50 border border-teal-200 text-teal-800 rounded-xl flex items-center gap-1.5 animate-pulse">
                      <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span className="truncate">{kycNoticeMsg || 'Processing document with AI OCR...'}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* 1. Aadhar Card */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">1. Aadhar</span>
                          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> {currentDirector.aadharUploaded || currentDirector.aadharNumber ? 'Verified' : 'Pending'}
                          </span>
                        </div>

                        {/* Aadhaar Number Display or Edit Form */}
                        {editingAadharDirectorId === currentDirector.id ? (
                          <div className="mt-1.5 space-y-1">
                            <input
                              type="text"
                              value={aadharEditValue}
                              onChange={e => setAadharEditValue(e.target.value)}
                              placeholder="12-digit Aadhaar"
                              className="w-full text-[11px] px-1.5 py-0.5 border border-teal-400 rounded bg-white font-mono focus:outline-none"
                            />
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleSaveDirectorField(currentDirector.id, 'aadharNumber', aadharEditValue)}
                                className="px-1.5 py-0.5 bg-teal-600 text-white rounded text-[9px] font-bold"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingAadharDirectorId(null)}
                                className="px-1 py-0.5 bg-slate-200 text-slate-700 rounded text-[9px]"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="font-mono text-[11px] text-slate-700 mt-1 font-semibold truncate">
                            {currentDirector.aadharNumber || 'Upload card'}
                          </div>
                        )}
                      </div>

                      {/* Action Row: Auto-Upload, Edit, Download */}
                      <div className="mt-2 pt-1 border-t border-slate-200/60 flex items-center justify-end gap-1">
                        <label
                          className="p-1 hover:bg-slate-200 text-slate-600 hover:text-teal-700 rounded cursor-pointer transition"
                          title="Upload Aadhaar (Auto-extracts 12-digit number)"
                        >
                          <Upload className="w-3 h-3" />
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*,.pdf"
                            onChange={e => {
                              if (e.target.files?.[0]) {
                                handleUploadKycForDirector(e.target.files[0], currentDirector.id, 'aadhar');
                                e.target.value = '';
                              }
                            }}
                          />
                        </label>

                        <button
                          onClick={() => {
                            setEditingAadharDirectorId(currentDirector.id);
                            setAadharEditValue(currentDirector.aadharNumber || '');
                          }}
                          className="p-1 hover:bg-slate-200 text-slate-600 hover:text-teal-700 rounded transition"
                          title="Edit Aadhaar Number"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>

                        {(currentDirector.aadharDocUrl || currentDirector.aadharDocFileName) && (
                          <a
                            href={currentDirector.aadharDocUrl || `/api/kyc/download/${currentDirector.id}?filename=Aadhaar_${encodeURIComponent(currentDirector.name)}.pdf`}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 hover:bg-emerald-100 text-emerald-700 rounded transition"
                            title="Download Aadhaar file"
                          >
                            <Download className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* 2. PAN Card */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">2. PAN card</span>
                          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> {currentDirector.panUploaded || currentDirector.panNumber ? 'Verified' : 'Pending'}
                          </span>
                        </div>

                        {editingPanDirectorId === currentDirector.id ? (
                          <div className="mt-1.5 space-y-1">
                            <input
                              type="text"
                              value={panEditValue}
                              onChange={e => setPanEditValue(e.target.value)}
                              placeholder="PAN (ABCDE1234F)"
                              className="w-full text-[11px] px-1.5 py-0.5 border border-teal-400 rounded bg-white font-mono uppercase focus:outline-none"
                            />
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleSaveDirectorField(currentDirector.id, 'panNumber', panEditValue.toUpperCase())}
                                className="px-1.5 py-0.5 bg-teal-600 text-white rounded text-[9px] font-bold"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingPanDirectorId(null)}
                                className="px-1 py-0.5 bg-slate-200 text-slate-700 rounded text-[9px]"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="font-mono text-[11px] text-slate-700 mt-1 font-semibold truncate">
                            {currentDirector.panNumber || 'Upload card'}
                          </div>
                        )}
                      </div>

                      <div className="mt-2 pt-1 border-t border-slate-200/60 flex items-center justify-end gap-1">
                        <label
                          className="p-1 hover:bg-slate-200 text-slate-600 hover:text-teal-700 rounded cursor-pointer transition"
                          title="Upload PAN (Auto-extracts number)"
                        >
                          <Upload className="w-3 h-3" />
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*,.pdf"
                            onChange={e => {
                              if (e.target.files?.[0]) {
                                handleUploadKycForDirector(e.target.files[0], currentDirector.id, 'pan');
                                e.target.value = '';
                              }
                            }}
                          />
                        </label>

                        <button
                          onClick={() => {
                            setEditingPanDirectorId(currentDirector.id);
                            setPanEditValue(currentDirector.panNumber || '');
                          }}
                          className="p-1 hover:bg-slate-200 text-slate-600 hover:text-teal-700 rounded transition"
                          title="Edit PAN"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>

                        {(currentDirector.panDocUrl || currentDirector.panDocFileName) && (
                          <a
                            href={currentDirector.panDocUrl || `/api/kyc/download/${currentDirector.id}?filename=PAN_${encodeURIComponent(currentDirector.name)}.pdf`}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 hover:bg-emerald-100 text-emerald-700 rounded transition"
                            title="Download PAN file"
                          >
                            <Download className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* 3. Bank details */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">3. Bank details</span>
                          <span className="text-[10px] text-slate-500 block truncate">
                            {currentDirector.bankDocUploaded || currentDirector.bankDetails ? '✓ Verified' : '(cancel cheque)'}
                          </span>
                        </div>

                        {editingBankDirectorId === currentDirector.id ? (
                          <div className="mt-1.5 space-y-1">
                            <input
                              type="text"
                              value={bankEditValue}
                              onChange={e => setBankEditValue(e.target.value)}
                              placeholder="A/C No. or IFSC"
                              className="w-full text-[11px] px-1.5 py-0.5 border border-teal-400 rounded bg-white font-mono focus:outline-none"
                            />
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleSaveDirectorField(currentDirector.id, 'bankDetails', bankEditValue)}
                                className="px-1.5 py-0.5 bg-teal-600 text-white rounded text-[9px] font-bold"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingBankDirectorId(null)}
                                className="px-1 py-0.5 bg-slate-200 text-slate-700 rounded text-[9px]"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="font-mono text-[11px] text-slate-700 mt-1 font-semibold truncate">
                            {currentDirector.bankDetails || 'Upload cheque'}
                          </div>
                        )}
                      </div>

                      <div className="mt-2 pt-1 border-t border-slate-200/60 flex items-center justify-end gap-1">
                        <label
                          className="p-1 hover:bg-slate-200 text-slate-600 hover:text-teal-700 rounded cursor-pointer transition"
                          title="Upload Cancel Cheque"
                        >
                          <Upload className="w-3 h-3" />
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*,.pdf"
                            onChange={e => {
                              if (e.target.files?.[0]) {
                                handleUploadKycForDirector(e.target.files[0], currentDirector.id, 'bank');
                                e.target.value = '';
                              }
                            }}
                          />
                        </label>

                        <button
                          onClick={() => {
                            setEditingBankDirectorId(currentDirector.id);
                            setBankEditValue(currentDirector.bankDetails || '');
                          }}
                          className="p-1 hover:bg-slate-200 text-slate-600 hover:text-teal-700 rounded transition"
                          title="Edit Bank Details"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>

                        {(currentDirector.bankDocUrl || currentDirector.bankDocFileName) && (
                          <a
                            href={currentDirector.bankDocUrl || `/api/kyc/download/${currentDirector.id}?filename=Cheque_${encodeURIComponent(currentDirector.name)}.pdf`}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 hover:bg-emerald-100 text-emerald-700 rounded transition"
                            title="Download Cancel Cheque"
                          >
                            <Download className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* 4. DIN details */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">4. DIN details</span>
                          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> {currentDirector.dinDocUploaded || currentDirector.din ? 'Valid MCA' : 'Pending'}
                          </span>
                        </div>

                        {editingDinDirectorId === currentDirector.id ? (
                          <div className="mt-1.5 space-y-1">
                            <input
                              type="text"
                              value={dinEditValue}
                              onChange={e => setDinEditValue(e.target.value)}
                              placeholder="8-digit DIN"
                              className="w-full text-[11px] px-1.5 py-0.5 border border-teal-400 rounded bg-white font-mono focus:outline-none"
                            />
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleSaveDirectorField(currentDirector.id, 'din', dinEditValue)}
                                className="px-1.5 py-0.5 bg-teal-600 text-white rounded text-[9px] font-bold"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingDinDirectorId(null)}
                                className="px-1 py-0.5 bg-slate-200 text-slate-700 rounded text-[9px]"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="font-mono text-[11px] text-slate-700 mt-1 font-semibold truncate">
                            {currentDirector.din || 'Upload DIN'}
                          </div>
                        )}
                      </div>

                      <div className="mt-2 pt-1 border-t border-slate-200/60 flex items-center justify-end gap-1">
                        <label
                          className="p-1 hover:bg-slate-200 text-slate-600 hover:text-teal-700 rounded cursor-pointer transition"
                          title="Upload DIN document"
                        >
                          <Upload className="w-3 h-3" />
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*,.pdf"
                            onChange={e => {
                              if (e.target.files?.[0]) {
                                handleUploadKycForDirector(e.target.files[0], currentDirector.id, 'din');
                                e.target.value = '';
                              }
                            }}
                          />
                        </label>

                        <button
                          onClick={() => {
                            setEditingDinDirectorId(currentDirector.id);
                            setDinEditValue(currentDirector.din || '');
                          }}
                          className="p-1 hover:bg-slate-200 text-slate-600 hover:text-teal-700 rounded transition"
                          title="Edit DIN"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>

                        {(currentDirector.dinDocUrl || currentDirector.dinDocFileName) && (
                          <a
                            href={currentDirector.dinDocUrl || `/api/kyc/download/${currentDirector.id}?filename=DIN_${encodeURIComponent(currentDirector.name)}.pdf`}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 hover:bg-emerald-100 text-emerald-700 rounded transition"
                            title="Download DIN document"
                          >
                            <Download className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Direct MCA Filing Automation Launcher */}
            <button
              onClick={() => onNavigateTab('mca-filing')}
              className="w-full mt-2.5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-500 hover:to-emerald-600 text-white rounded-xl text-xs font-black shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-teal-200" />
              <span>Launch MCA Filing Automation (AOC-4 / MGT-7)</span>
            </button>
          </div>
        )}

        {/* COLUMN 2: Adhoc Request (Wireframe List of Services) */}
        {(!preferences || preferences.showAdhocCatalog) && (
        <div className={`bg-white rounded-3xl border border-slate-200 ${isCompact ? 'p-3.5 space-y-3' : 'p-5 space-y-4'} shadow-sm hover:border-purple-400 transition-all`}>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                Subsection 2
              </span>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-purple-600" />
                <span>Adhoc Request</span>
              </h3>
            </div>

            <button
              onClick={() => onNavigateTab('adhoc-requests')}
              className="text-xs text-purple-700 hover:text-purple-900 font-bold flex items-center gap-0.5"
            >
              <span>Manage All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Adhoc Services List (Exactly matching the list in the wireframe) */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-xs">
            <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider text-purple-900 pb-1 border-b border-slate-200">
              Active Adhoc Service Catalog:
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-slate-800 font-semibold hover:text-purple-700 transition">
                <span>- GST Registration</span>
                <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold">New ARN</span>
              </div>

              <div className="flex items-center justify-between text-slate-800 font-semibold hover:text-purple-700 transition">
                <span>- GST Amendment etc</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">In Progress</span>
              </div>

              <div className="flex items-center justify-between text-slate-800 font-semibold hover:text-purple-700 transition">
                <span>- Company Registration</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">SPICe+</span>
              </div>

              <div className="flex items-center justify-between text-slate-800 font-semibold hover:text-purple-700 transition">
                <span>- Trademark</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">TM-A Class</span>
              </div>

              <div className="flex items-center justify-between text-slate-800 font-semibold hover:text-purple-700 transition">
                <span>- FSSAI</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">FosCos</span>
              </div>

              <div
                onClick={() => onNavigateTab('mca-filing')}
                className="text-slate-800 font-semibold hover:text-purple-700 transition cursor-pointer p-1 rounded hover:bg-purple-50"
              >
                <div className="flex items-center justify-between">
                  <span>- ROC & MCA Filing Automation</span>
                  <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-bold">Auto AOC-4/MGT-7</span>
                </div>
                <div className="text-[11px] text-slate-500 pl-3">
                  (AOC-4, MGT-7, Director KYC, Balance Sheet & P&L extraction)
                </div>
              </div>

              <div className="flex items-center justify-between text-slate-800 font-semibold hover:text-purple-700 transition">
                <span>- MSME registration</span>
                <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-bold">Udyam</span>
              </div>

              <div className="flex items-center justify-between text-slate-800 font-semibold hover:text-purple-700 transition">
                <span>- Startup india registration</span>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-bold">DPIIT</span>
              </div>

              <div className="flex items-center justify-between text-slate-800 font-semibold hover:text-purple-700 transition">
                <span>- Professional tax</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">PTRC/PTEC</span>
              </div>

              <div className="flex items-center justify-between text-slate-800 font-semibold hover:text-purple-700 transition">
                <span>- Projected Report</span>
                <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold">CMA Model</span>
              </div>

              <div className="flex items-center justify-between text-slate-800 font-semibold hover:text-purple-700 transition">
                <span>- PnL and Balancesheet</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Ready</span>
              </div>

              <div className="text-slate-400 font-semibold pl-2">
                etc
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('adhoc-requests')}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center space-x-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Launch New Adhoc Request</span>
          </button>
        </div>
        )}

        {/* COLUMN 3: Compliance Calendar (auto generate & 11 Government Portals Synchronized) */}
        {(!preferences || preferences.showComplianceCalendar) && (
        <div className={`bg-white rounded-3xl border border-slate-200 ${isCompact ? 'p-3.5 space-y-3' : 'p-5 space-y-3.5'} shadow-sm hover:border-emerald-400 transition-all`}>
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                  Subsection 3
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>11 Portals Synced</span>
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5 mt-0.5">
                <CalendarDays className="w-4 h-4 text-emerald-600" />
                <span>Compliance Calendar</span>
              </h3>
              <p className="text-[11px] text-emerald-800 font-bold">(auto generate)</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncPortalsNow}
                disabled={isSyncingPortals}
                title="Sync now across all 11 government statutory portals"
                className="p-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingPortals ? 'animate-spin text-emerald-600' : ''}`} />
              </button>

              <button
                onClick={() => onNavigateTab('compliance-calendar')}
                className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-0.5"
              >
                <span>Full Calendar</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Sync notification message */}
          {syncStatusMsg && (
            <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/60 animate-in fade-in">
              {syncStatusMsg}
            </div>
          )}

          {/* Quick Authority Filter Chips */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-bold no-scrollbar">
            {[
              { id: 'all', label: 'All 11 Portals' },
              { id: 'GST', label: 'GST' },
              { id: 'Income Tax', label: 'Income Tax' },
              { id: 'TDS', label: 'TDS' },
              { id: 'ROC', label: 'MCA / ROC' },
              { id: 'EPFO', label: 'EPFO' },
              { id: 'ESIC', label: 'ESIC' },
              { id: 'RBI', label: 'RBI' },
              { id: 'IP India', label: 'IP India' },
              { id: 'CBIC', label: 'CBIC' },
              { id: 'DPIIT', label: 'DPIIT' },
            ].map(chip => (
              <button
                key={chip.id}
                onClick={() => setSelectedPortalCategory(chip.id)}
                className={`px-2 py-0.5 rounded-md whitespace-nowrap transition border ${
                  selectedPortalCategory === chip.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Statutory Dates List with live portal links */}
          <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200/80 space-y-2 text-xs max-h-[440px] overflow-y-auto">
            {calendarItems
              .filter(item => {
                if (selectedPortalCategory === 'all') return true;
                if (selectedPortalCategory === 'Income Tax') {
                  return item.category === 'Income Tax' || item.category === 'TDS' || item.category === 'Audit';
                }
                return item.category === selectedPortalCategory;
              })
              .map((item) => {
                const isOverdue = item.status === 'Overdue';
                const isUrgent = item.status === 'Urgent';
                const isCompleted = item.status === 'Completed';

                return (
                  <div
                    key={item.id}
                    className={`py-2 px-2.5 bg-white rounded-xl border transition flex flex-col gap-1.5 shadow-2xs ${
                      isOverdue
                        ? 'border-rose-300 bg-rose-50/20'
                        : isUrgent
                        ? 'border-amber-300 bg-amber-50/10'
                        : isCompleted
                        ? 'border-slate-200 opacity-70'
                        : 'border-slate-200/70 hover:border-emerald-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          isOverdue
                            ? 'bg-rose-500 animate-pulse ring-2 ring-rose-200'
                            : isUrgent
                            ? 'bg-amber-500 animate-pulse ring-2 ring-amber-200'
                            : isCompleted
                            ? 'bg-emerald-600'
                            : 'bg-emerald-500'
                        }`} />
                        <span className="font-bold text-slate-900 truncate">
                          {item.displayDate} — {item.eventTitle}
                        </span>
                      </div>

                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                        item.category === 'GST'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : item.category === 'TDS'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : item.category === 'ROC'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : item.category === 'EPFO'
                          ? 'bg-teal-50 text-teal-700 border border-teal-200'
                          : item.category === 'ESIC'
                          ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                          : item.category === 'RBI'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : item.category === 'IP India'
                          ? 'bg-violet-50 text-violet-700 border border-violet-200'
                          : item.category === 'CBIC'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : item.category === 'DPIIT'
                          ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {item.category}
                      </span>
                    </div>

                    {/* Sub-bar: Portal link and form tag */}
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        {item.portalUrl ? (
                          <a
                            href={item.portalUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-0.5 text-teal-700 hover:text-teal-900 font-semibold underline underline-offset-2 hover:no-underline"
                            title={`Open official portal: ${item.portalDomain || item.portalName}`}
                          >
                            <span>{item.portalDomain || item.portalName}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <span className="font-semibold text-slate-600">{item.portalName || 'Gov Portal'}</span>
                        )}
                        {item.formNumber && (
                          <span className="text-slate-400 font-mono">• {item.formNumber}</span>
                        )}
                      </div>

                      <div>
                        {isOverdue && (
                          <span className="text-rose-600 font-bold">Overdue</span>
                        )}
                        {isUrgent && (
                          <span className="text-amber-700 font-bold">Due in {item.daysRemaining}d</span>
                        )}
                        {!isOverdue && !isUrgent && !isCompleted && typeof item.daysRemaining === 'number' && (
                          <span className="text-slate-500">{item.daysRemaining} days left</span>
                        )}
                        {isCompleted && (
                          <span className="text-emerald-700 font-semibold">Filed ✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          <button
            onClick={handleSyncPortalsNow}
            disabled={isSyncingPortals}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center space-x-2 disabled:opacity-75"
          >
            <Sparkles className={`w-4 h-4 ${isSyncingPortals ? 'animate-spin' : ''}`} />
            <span>{isSyncingPortals ? 'Syncing 11 Government Portals...' : 'Auto Generate Monthly Schedule'}</span>
          </button>
        </div>
        )}
      </div>
      )}

      {/* 4. Priority Action Items (Focus for the Chartered Accountant) */}
      {(!preferences || preferences.showPartnerActionItems) && (
      <div className={`bg-white rounded-2xl border border-slate-200 ${isCompact ? 'p-4' : 'p-6'} shadow-sm`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">Priority Action Items for Partner Attention</h3>
          </div>
          <button
            onClick={() => onNavigateTab('gst-pipeline')}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800"
          >
            View Complete Pipeline
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {(requests && requests.length > 0 ? requests.slice(0, 4) : [
            { id: 'req_sc', clientName: 'Social Corn', clientGstin: '07DWAPK0131H1Z1', reportingMonth: 'September 2026', status: 'Needs Review' },
            { id: 'req_ds', clientName: 'dsfdsf', clientGstin: '29AAAGM0289C1ZF', reportingMonth: 'September 2026', status: 'Requested' },
          ]).map(req => (
            <div
              key={req.id}
              onClick={() => onNavigateTab('gst-pipeline')}
              className="py-3 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-xl transition cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs">
                  {req.clientName?.charAt(0) || 'C'}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{req.clientName}</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    GSTIN: {req.clientGstin} • Period: {req.reportingMonth}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {req.status}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* 5. Add Director Modal */}
      {isAddDirectorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-teal-600" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Add Other Director to {activeClient.businessName}
                </h3>
              </div>
              <button
                onClick={() => setIsAddDirectorModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddDirector} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Director Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Verma"
                  value={newDirectorName}
                  onChange={e => setNewDirectorName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Aadhaar Card with Upload, Auto-Fetch, Edit & Download */}
              <div className="p-3 bg-teal-50/50 rounded-2xl border border-teal-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-teal-950 block">Aadhaar Card (Auto-Scan & Verification)</label>
                  {newDirectorAadharFile.url && (
                    <a
                      href={newDirectorAadharFile.url}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-teal-700 hover:text-teal-900 font-bold"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-teal-300 rounded-xl cursor-pointer text-xs font-semibold text-teal-800 transition shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingModalAadhar ? 'Scanning Aadhaar...' : newDirectorAadharFile.name ? `Attached: ${newDirectorAadharFile.name.slice(0, 18)}...` : 'Upload Aadhaar (Auto-Fetch No.)'}</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                      disabled={isUploadingModalAadhar}
                      onChange={e => {
                        if (e.target.files?.[0]) handleModalAadharUpload(e.target.files[0]);
                      }}
                    />
                  </label>
                </div>

                {modalAadharNotice && (
                  <p className="text-[11px] text-teal-700 font-medium animate-pulse">
                    {modalAadharNotice}
                  </p>
                )}

                <div>
                  <label className="text-[11px] text-slate-600 block mb-0.5">
                    12-digit Aadhaar Number <span className="text-slate-400 font-normal">(Editable if OCR misreads)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5432 1098 7654"
                    value={newDirectorAadhar}
                    onChange={e => setNewDirectorAadhar(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono tracking-wider focus:outline-none focus:border-teal-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">DIN</label>
                  <input
                    type="text"
                    placeholder="08492013"
                    value={newDirectorDin}
                    onChange={e => setNewDirectorDin(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">PAN</label>
                  <input
                    type="text"
                    placeholder="ABCDE1234F"
                    value={newDirectorPan}
                    onChange={e => setNewDirectorPan(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono uppercase focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Director Phone & WhatsApp</label>
                <input
                  type="text"
                  placeholder="+91 98112 34569"
                  value={newDirectorPhone}
                  onChange={e => setNewDirectorPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Director Email ID</label>
                <input
                  type="email"
                  placeholder="rverma@briopox.com"
                  value={newDirectorEmail}
                  onChange={e => setNewDirectorEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddDirectorModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold shadow-md transition"
                >
                  Add Director
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
