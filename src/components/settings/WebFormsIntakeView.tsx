// src/components/settings/WebFormsIntakeView.tsx
import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  CheckCircle2,
  Share2,
  Save,
  Users,
  Eye,
  Layers,
  Sparkles,
  Shield,
  Download,
} from 'lucide-react';
import { FirmBrandingConfig } from '../../services/brandingService';

interface WebFormsIntakeViewProps {
  firmBranding: FirmBrandingConfig;
  currentUser?: any;
  onSavedNotification: (msg: string) => void;
  onClose: () => void;
}

interface IntakeForm {
  id: string;
  title: string;
  category: 'onboarding' | 'gst' | 'audit' | 'roc';
  description: string;
  slug: string;
  active: boolean;
  submissionsCount: number;
  lastSubmission: string;
  fieldsCount: number;
}

const DEFAULT_FORMS: IntakeForm[] = [
  {
    id: 'form-1',
    title: 'New Client Onboarding & KYC Intake Form',
    category: 'onboarding',
    description: 'Collects legal entity name, PAN, GSTIN, Incorporation Certificate, Director KYC, and cancel cheque.',
    slug: 'onboard-kyc',
    active: true,
    submissionsCount: 18,
    lastSubmission: 'Yesterday at 04:12 PM',
    fieldsCount: 12,
  },
  {
    id: 'form-2',
    title: 'Monthly GST Data & Invoice Drop Portal',
    category: 'gst',
    description: 'Passwordless client upload link for monthly sales/purchase ZIP files and bank statement PDFs.',
    slug: 'gst-intake',
    active: true,
    submissionsCount: 42,
    lastSubmission: 'Today at 10:45 AM',
    fieldsCount: 6,
  },
  {
    id: 'form-3',
    title: 'Tax Audit Form 3CD Statutory Questionnaire',
    category: 'audit',
    description: 'Self-declaration questionnaire covering Clause 13, 21, 26, 34 (TDS), and Clause 44 (MSME) reporting.',
    slug: 'audit-3cd-intake',
    active: true,
    submissionsCount: 9,
    lastSubmission: '3 days ago',
    fieldsCount: 24,
  },
  {
    id: 'form-4',
    title: 'ROC Annual Compliance & Director Disclosure Form',
    category: 'roc',
    description: 'Annual return inputs for MGT-7, AOC-4, DIR-3 KYC, and MBP-1 director disclosure collection.',
    slug: 'roc-intake',
    active: true,
    submissionsCount: 14,
    lastSubmission: 'Oct 5, 2026',
    fieldsCount: 16,
  },
];

export const WebFormsIntakeView: React.FC<WebFormsIntakeViewProps> = ({
  firmBranding,
  currentUser,
  onSavedNotification,
  onClose,
}) => {
  const [forms, setForms] = useState<IntakeForm[]>(() => {
    try {
      const saved = localStorage.getItem('quinceca_webforms_config');
      return saved ? JSON.parse(saved) : DEFAULT_FORMS;
    } catch {
      return DEFAULT_FORMS;
    }
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedForm, setSelectedForm] = useState<IntakeForm>(forms[1]); // default to GST intake
  const [showQrModal, setShowQrModal] = useState(false);

  const getFullUrl = (slug: string) => {
    const host = window.location.origin || 'https://quinceca.quinceautomation.com';
    return `${host}/portal/${slug}`;
  };

  const handleCopyLink = (form: IntakeForm) => {
    const url = getFullUrl(form.slug);
    navigator.clipboard.writeText(url);
    setCopiedId(form.id);
    onSavedNotification(`Public link copied: ${url}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleForm = (id: string) => {
    const updated = forms.map((f) => (f.id === id ? { ...f, active: !f.active } : f));
    setForms(updated);
    localStorage.setItem('quinceca_webforms_config', JSON.stringify(updated));
    if (selectedForm.id === id) {
      setSelectedForm({ ...selectedForm, active: !selectedForm.active });
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] text-slate-800">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200/60 shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Web Forms & Client Intake Portal
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-purple-100 text-purple-800 border border-purple-200">
                  Public Links Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate branded public web forms for new client KYC onboarding, monthly GST document drops, and audit questionnaires.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => handleCopyLink(selectedForm)}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Copy Active Form Link</span>
          </button>
          <button
            onClick={() => onSavedNotification('Web form configurations and intake routes updated.')}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#00c073] hover:bg-[#00ab66] text-white shadow-xs transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-6xl mx-auto w-full">
        {/* Metric summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold text-slate-500 uppercase">Submissions This Month</p>
            <h3 className="text-xl font-bold text-slate-900 mt-1">83 Files & Records</h3>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Processed by AI OCR pipeline</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold text-slate-500 uppercase">Active Intake Links</p>
            <h3 className="text-xl font-bold text-slate-900 mt-1">4 Live Public Portals</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Encrypted with 256-bit TLS</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold text-slate-500 uppercase">Client Drop Turnaround</p>
            <h3 className="text-xl font-bold text-slate-900 mt-1">&lt; 3.2 Minutes</h3>
            <p className="text-[10px] text-purple-600 font-semibold mt-0.5">Zero client login barriers</p>
          </div>
        </div>

        {/* Forms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {forms.map((form) => {
            const isCopied = copiedId === form.id;
            const fullUrl = getFullUrl(form.slug);

            return (
              <div
                key={form.id}
                onClick={() => setSelectedForm(form)}
                className={`bg-white rounded-xl border p-5 shadow-xs transition cursor-pointer flex flex-col justify-between ${
                  selectedForm.id === form.id
                    ? 'border-purple-500 ring-2 ring-purple-500/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs border border-purple-200">
                        <FileText className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs font-bold text-slate-900">{form.title}</h3>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleForm(form.id);
                      }}
                      className="cursor-pointer"
                    >
                      {form.active ? (
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-slate-100 text-slate-500">
                          Paused
                        </span>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">{form.description}</p>

                  <div className="mt-3 p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-[11px] font-mono text-slate-600">
                    <span className="truncate pr-2">{fullUrl}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyLink(form);
                      }}
                      className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-700 transition flex items-center space-x-1 shrink-0"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span className="text-[10px]">{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{form.submissionsCount} submissions received</span>
                  <span>Last: {form.lastSubmission}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
