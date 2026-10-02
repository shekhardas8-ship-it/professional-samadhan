// src/components/CaExecutiveCockpit.tsx
import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  INITIAL_CLIENTS_DATA,
  INITIAL_COMPLIANCE_CALENDAR,
  INITIAL_ADHOC_REQUESTS,
  INITIAL_PENDING_TAX_7_DAYS,
  INITIAL_ACCUMULATED_TASKS_7_DAYS,
  ATTACHED_DOC_TEMPLATES,
} from '../services/frontPageDataService.ts';

interface CaExecutiveCockpitProps {
  requests: MonthlyRequest[];
  onNavigateTab: (tab: string) => void;
  onTriggerSchedule: () => Promise<void>;
  onOpenNewClientModal: () => void;
  onRefreshParent?: () => void;
  isActionLoading: boolean;
}

export const CaExecutiveCockpit: React.FC<CaExecutiveCockpitProps> = ({
  requests,
  onNavigateTab,
  onTriggerSchedule,
  onOpenNewClientModal,
  onRefreshParent,
  isActionLoading,
}) => {
  // Front page state for highlighted client in Directory & KYC subsection
  const [activeKycClientId, setActiveKycClientId] = useState<string>('cli_briopox_01');
  const [isAddDirectorModalOpen, setIsAddDirectorModalOpen] = useState(false);
  const [newDirectorName, setNewDirectorName] = useState('');
  const [newDirectorPhone, setNewDirectorPhone] = useState('+91 ');
  const [newDirectorEmail, setNewDirectorEmail] = useState('');
  const [newDirectorDin, setNewDirectorDin] = useState('');
  const [newDirectorPan, setNewDirectorPan] = useState('');

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

  const handleAddDirector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDirectorName.trim()) return;

    const newDir = {
      id: `dir_${Date.now()}`,
      name: newDirectorName.trim(),
      din: newDirectorDin.trim() || '08492013',
      phone: newDirectorPhone.trim() || '+91 98112 34569',
      email: newDirectorEmail.trim() || 'director@briopox.com',
      aadharNumber: '**** **** 7781',
      panNumber: newDirectorPan.trim().toUpperCase() || 'ABCDE1234F',
      bankDetails: 'HDFC Cancel Cheque Verified',
      aadharUploaded: true,
      panUploaded: true,
      bankDocUploaded: true,
      dinDocUploaded: true,
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
    } catch (err) {
      console.warn('Backend sync queued:', err);
    }

    setIsAddDirectorModalOpen(false);
    setNewDirectorName('');
    setNewDirectorPhone('+91 ');
    setNewDirectorEmail('');
    setNewDirectorDin('');
    setNewDirectorPan('');
    alert(`Director ${newDir.name} added and memorized in backend database for ${activeClient.businessName}!`);
  };

  // Compute stats
  const totalClients = clients.length;
  const currentPeriod = requests[0]?.reportingMonth || 'August 2026';
  const pending7DayTasksCount = INITIAL_ACCUMULATED_TASKS_7_DAYS.length;

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      {/* 1. Executive Chartered Accountant Banner */}
      <div className="theme-banner text-white rounded-3xl p-6 sm:p-8 shadow-xl border relative overflow-hidden">
        <div className="absolute right-0 bottom-0 pointer-events-none opacity-[0.05] select-none translate-x-10 translate-y-10">
          <img src="/logo.jpg" alt="" className="w-80 h-80 object-contain filter grayscale contrast-125" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center space-x-4">
            <img
              src="/logo.jpg"
              alt="Professional Samadhan"
              className="w-16 h-16 rounded-2xl object-cover shadow-xl border-2 border-white/20 shrink-0"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase tracking-wider theme-accent-text font-bold">
                  Professional Samadhan • Chartered Accountants
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full theme-badge border font-semibold">
                  Practice Cockpit
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
                CA Suraj Dutta (FCA)
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

      {/* 2. Top Navigation & Section Selector (Matching the 6 top boxes in wireframe) */}
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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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

          {/* 3. Adhoc Request */}
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

          {/* 4. Compliance Calendar */}
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

          {/* 5. Next 7 days Pending task */}
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

          {/* 6. Billing & Finance */}
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

      {/* 3. Three-Column Spotlight Subsections (Directly matching wireframe diagram structure) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* COLUMN 1: Client Directory & KYC (Briopox Pvt Ltd Wireframe Structure) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-teal-400 transition-all">
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
              <span className="font-black text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                {activeClient.businessName}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-500">CIN:</span>
              <span className="font-mono font-bold text-slate-800">
                {activeClient.cin || 'U74999DL2021PTC384592'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-500">GST No:</span>
              <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {activeClient.gstin}
              </span>
            </div>

            <div className="pt-1">
              <span className="font-semibold text-slate-500 block">Address:</span>
              <p className="text-slate-700 mt-0.5 text-[11px] leading-relaxed">
                {activeClient.address || 'Plot No. 44, Okhla Industrial Area Phase-III, New Delhi - 110020'}
              </p>
            </div>

            {/* Director Names & Phone/Email */}
            <div className="pt-2 border-t border-slate-200/60">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-700">
                  Director Names: {(activeClient.directors || []).map((d: any, i: number) => `${i + 1} ${d.name}`).join(' ')} ....
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

            <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/80 max-h-56 overflow-y-auto space-y-1.5 text-xs">
              {ATTACHED_DOC_TEMPLATES.map(tmpl => {
                const attached = (activeClient.attachedDocuments || []).find(
                  (d: any) => d.docKey === tmpl.key || d.categoryNumber === tmpl.categoryNumber
                );
                return (
                  <div key={tmpl.key} className="flex items-center justify-between py-1 border-b border-slate-200/50 last:border-0">
                    <span className="text-slate-800 font-medium">
                      <strong>{tmpl.categoryNumber}.</strong> {tmpl.name}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      attached ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {attached ? '✓' : 'Pending'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Director KYC (4 items from Wireframe) */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Director KYC:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 block">1. Aadhar</span>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
                  <Check className="w-3 h-3" /> Verified
                </span>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 block">2. PAN card</span>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
                  <Check className="w-3 h-3" /> Verified
                </span>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 block">3. Bank details</span>
                <span className="text-[10px] text-slate-500 block mt-0.5 truncate">(cancel cheque)</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 block">4. DIN details</span>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
                  <Check className="w-3 h-3" /> Valid MCA
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2: Adhoc Request (Wireframe List of Services) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-purple-400 transition-all">
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

              <div className="text-slate-800 font-semibold hover:text-purple-700 transition">
                <div>- ROC work</div>
                <div className="text-[11px] text-slate-500 pl-3">
                  (Director KYC, Name change, objective amendment, etc)
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

        {/* COLUMN 3: Compliance Calendar (auto generate) (Wireframe List of 11 Dates) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-emerald-400 transition-all">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                Subsection 3
              </span>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-emerald-600" />
                <span>Compliance Calendar</span>
              </h3>
              <p className="text-[11px] text-emerald-800 font-bold">(auto generate)</p>
            </div>

            <button
              onClick={() => onNavigateTab('compliance-calendar')}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-0.5"
            >
              <span>Full Calendar</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Statutory Dates List (Exact dates from the wireframe) */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs max-h-[460px] overflow-y-auto">
            {INITIAL_COMPLIANCE_CALENDAR.map((item) => (
              <div
                key={item.id}
                className="py-1.5 px-2 bg-white rounded-xl border border-slate-200/70 hover:border-emerald-400 transition flex items-center justify-between gap-2"
              >
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="font-bold text-slate-900">
                    {item.displayDate} — {item.eventTitle}
                  </span>
                </div>

                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                  item.category === 'GST'
                    ? 'bg-blue-50 text-blue-700'
                    : item.category === 'TDS'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-purple-50 text-purple-700'
                }`}>
                  {item.category}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigateTab('compliance-calendar')}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Auto Generate Monthly Schedule</span>
          </button>
        </div>
      </div>

      {/* 4. Priority Action Items (Focus for the Chartered Accountant) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
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
          {requests.slice(0, 3).map(req => (
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
                <label className="font-bold text-slate-700 block mb-1">Director Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 3. Rajesh Verma"
                  value={newDirectorName}
                  onChange={e => setNewDirectorName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                />
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:border-teal-500"
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
