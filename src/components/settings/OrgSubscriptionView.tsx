// src/components/settings/OrgSubscriptionView.tsx
import React, { useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  Users,
  MessageSquare,
  Sparkles,
  Download,
  Calendar,
  Zap,
  ArrowUpRight,
  Plus,
  RefreshCw,
  Building,
  Check,
  RotateCcw,
  Sliders,
} from 'lucide-react';
import { FirmBrandingConfig } from '../../services/brandingService';

interface OrgSubscriptionViewProps {
  firmBranding: FirmBrandingConfig;
  currentUser?: any;
  onSavedNotification?: (msg: string) => void;
  onClose?: () => void;
  isDialogMode?: boolean;
}

export const OrgSubscriptionView: React.FC<OrgSubscriptionViewProps> = ({
  firmBranding,
  currentUser,
  onSavedNotification,
  onClose,
  isDialogMode = false,
}) => {
  const [subConfig, setSubConfig] = useState(() => {
    try {
      const stored = localStorage.getItem('quinceca_subscription_config');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      // fallback
    }
    return {
      planTier: 'Enterprise Practice OS',
      billingCycle: 'Annual (20% Savings)',
      annualCost: '₹49,999',
      renewalDate: '31 March 2027',
      status: 'Active License',
      allocatedSeats: 15,
      activeSeatsUsed: 5,
      whatsappQuota: 15000,
      whatsappUsed: 8420,
      storageQuotaGb: 500,
      storageUsedGb: 1.4,
      gstinForB2b: '27AAAFQ1234M1Z5',
      b2bLegalName: firmBranding.firmName || 'QuinceCA Practice Associates LLP',
    };
  });

  const [showAddSeatsModal, setShowAddSeatsModal] = useState(false);
  const [extraSeatsCount, setExtraSeatsCount] = useState(2);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const saveSubscription = (updated: any) => {
    setSubConfig(updated);
    try {
      localStorage.setItem('quinceca_subscription_config', JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
    setSaveSuccessMsg('Subscription preferences and license configuration updated.');
    if (onSavedNotification) onSavedNotification('Subscription parameters updated.');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleAddSeatsConfirm = () => {
    const updated = {
      ...subConfig,
      allocatedSeats: subConfig.allocatedSeats + Number(extraSeatsCount),
    };
    saveSubscription(updated);
    setShowAddSeatsModal(false);
  };

  const pastInvoices = [
    {
      id: 'INV-SaaS-2026-0891',
      date: '01 Apr 2026',
      period: 'FY 2026 - 2027',
      description: 'QuinceCA Enterprise Practice OS (Annual License)',
      amount: '₹49,999.00',
      tax: '₹8,999.82 (18% GST)',
      total: '₹58,998.82',
      status: 'Paid',
    },
    {
      id: 'INV-SaaS-2025-0412',
      date: '01 Apr 2025',
      period: 'FY 2025 - 2026',
      description: 'QuinceCA Enterprise Practice OS (Annual License)',
      amount: '₹44,999.00',
      tax: '₹8,099.82 (18% GST)',
      total: '₹53,098.82',
      status: 'Paid',
    },
  ];

  return (
    <div className={`${isDialogMode ? 'p-2' : 'p-6 max-w-6xl mx-auto'} space-y-6 animate-in fade-in duration-150`}>
      {/* Top Header */}
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl shadow-md shadow-indigo-500/20">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-extrabold text-slate-800">Practice SaaS Subscription</h2>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                {subConfig.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Active plan entitlements, high-capacity statutory quotas, and B2B GST tax invoices.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowAddSeatsModal(true)}
            className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Staff Seats</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg transition"
            >
              Back
            </button>
          )}
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-800 text-xs animate-in slide-in-from-top-1">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{saveSuccessMsg}</span>
        </div>
      )}

      {/* Hero Plan Status Card */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-md border border-indigo-900/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-indigo-400">
              CURRENT TIER
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              Verified Enterprise
            </span>
          </div>
          <h3 className="text-2xl font-black text-white tracking-tight">{subConfig.planTier}</h3>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Includes multi-partner signoff workflows, automated statutory WhatsApp intake bot, Google Drive cloud sync, Tally Prime integration, and unlimited AI document extraction.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-indigo-200">
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Renews on: <strong className="text-white">{subConfig.renewalDate}</strong></span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Billing: <strong className="text-white">{subConfig.billingCycle}</strong></span>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 shrink-0 min-w-[200px] text-right space-y-2">
          <span className="text-[11px] text-indigo-200 font-semibold uppercase block">Annual Commitment</span>
          <span className="text-3xl font-black text-white">{subConfig.annualCost}</span>
          <span className="text-[11px] text-slate-400 block">+ 18% GST (Input Tax Credit)</span>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => alert('Your Enterprise subscription is active and secured until ' + subConfig.renewalDate)}
              className="w-full py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 text-xs font-extrabold rounded-lg transition shadow-xs cursor-pointer"
            >
              Subscription Active
            </button>
          </div>
        </div>
      </div>

      {/* Quota Usage Meters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Seats Meter */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-xs text-slate-800">CA Staff & Partner Seats</span>
            </div>
            <span className="text-xs font-extrabold text-blue-700">
              {subConfig.activeSeatsUsed} / {subConfig.allocatedSeats} Used
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(subConfig.activeSeatsUsed / subConfig.allocatedSeats) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>{subConfig.allocatedSeats - subConfig.activeSeatsUsed} seats available</span>
            <button
              onClick={() => setShowAddSeatsModal(true)}
              className="text-blue-600 font-semibold hover:underline cursor-pointer"
            >
              Add seats +
            </button>
          </div>
        </div>

        {/* WhatsApp Quota */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-xs text-slate-800">WhatsApp Intake Messages</span>
            </div>
            <span className="text-xs font-extrabold text-emerald-700">
              {subConfig.whatsappUsed.toLocaleString()} / {subConfig.whatsappQuota.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all"
              style={{ width: `${(subConfig.whatsappUsed / subConfig.whatsappQuota) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Resets on 1st of each month</span>
            <span className="text-emerald-600 font-semibold">High Capacity</span>
          </div>
        </div>

        {/* Cloud Storage */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <HardDrive className="w-4 h-4 text-purple-600" />
              <span className="font-bold text-xs text-slate-800">Practice Cloud Storage</span>
            </div>
            <span className="text-xs font-extrabold text-purple-700">
              {subConfig.storageUsedGb} GB / {subConfig.storageQuotaGb} GB
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${(subConfig.storageUsedGb / subConfig.storageQuotaGb) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Google Drive + Neon DB</span>
            <span className="text-purple-600 font-semibold">99.7% Free</span>
          </div>
        </div>
      </div>

      {/* Feature Entitlements Checklist */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Active Enterprise Feature Entitlements</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {[
            'Unlimited Client Businesses & GSTINs',
            'Full Multi-City Branch Office Consolidation',
            'Interactive WhatsApp Statutory Intake Bot',
            'Google Drive & Cloud Document Archival',
            'Multi-Model AI (Gemini 2.5 Flash + DeepSeek OCR)',
            'Tally Prime XML & Excel Accounting Synchronizer',
            'Official Govt GSTR-1, 3B & ITR-1 JSON Exporters',
            'Bank Statement Password Protected PDF Unlocking',
            'ICAI Compliant Audit Dossier & Workpaper Generator',
            'Automated 3-Day & 5-Day Statutory Escalation Crons',
            'Senior Partner Approval & Override Matrix',
            'Priority 24/7 Chartered Accountant Tech Desk',
          ].map((feat, idx) => (
            <div key={idx} className="flex items-center space-x-2 text-slate-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* B2B GST Invoicing Details & Past Invoices */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              B2B GST Tax Invoices & Receipts
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Input Tax Credit (ITC) compliant tax invoices billed to your firm GSTIN.
            </p>
          </div>
          <div className="text-xs text-slate-600 font-mono bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            GSTIN: <strong>{subConfig.gstinForB2b}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-3.5 py-2.5 font-semibold">Invoice No</th>
                <th className="px-3.5 py-2.5 font-semibold">Date</th>
                <th className="px-3.5 py-2.5 font-semibold">Description</th>
                <th className="px-3.5 py-2.5 font-semibold text-right">Taxable</th>
                <th className="px-3.5 py-2.5 font-semibold text-right">Total (Inc. GST)</th>
                <th className="px-3.5 py-2.5 font-semibold text-center">Status</th>
                <th className="px-3.5 py-2.5 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {pastInvoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/50">
                  <td className="px-3.5 py-2.5 font-mono font-semibold text-indigo-700">{inv.id}</td>
                  <td className="px-3.5 py-2.5">{inv.date}</td>
                  <td className="px-3.5 py-2.5 text-slate-800 font-medium">{inv.description}</td>
                  <td className="px-3.5 py-2.5 text-right font-mono">{inv.amount}</td>
                  <td className="px-3.5 py-2.5 text-right font-mono font-bold text-slate-900">{inv.total}</td>
                  <td className="px-3.5 py-2.5 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => alert(`Downloading official GST Tax Invoice receipt ${inv.id} (PDF)...`)}
                      className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition inline-flex items-center space-x-1 cursor-pointer"
                      title="Download GST Receipt"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-semibold">Receipt</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Extra Staff Seats */}
      {showAddSeatsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-800">Add Staff & Article Clerk Seats</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSeatsModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Add additional CA Associate or Article Clerk accounts to your practice. Extra seats are billed pro-rata to your annual cycle.
              </p>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Number of additional seats</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={extraSeatsCount}
                    onChange={e => setExtraSeatsCount(Math.max(1, Number(e.target.value)))}
                    className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-center font-bold text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-slate-500 text-xs">× ₹499 / seat / month (Billed annually)</span>
                </div>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1">
                <div className="flex justify-between font-bold text-indigo-900">
                  <span>Additional Capacity:</span>
                  <span>+{extraSeatsCount} Seats</span>
                </div>
                <div className="flex justify-between text-indigo-700">
                  <span>New Total Staff Seats:</span>
                  <span>{subConfig.allocatedSeats + Number(extraSeatsCount)} Seats</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddSeatsModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg border border-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddSeatsConfirm}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition shadow-xs cursor-pointer"
                >
                  Confirm & Update License
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
