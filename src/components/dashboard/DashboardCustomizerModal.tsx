// src/components/dashboard/DashboardCustomizerModal.tsx
// Interactive Customization Modal for User Dashboard Preferences

import React, { useState } from 'react';
import {
  X,
  Sliders,
  Building2,
  BarChart3,
  Zap,
  CheckCircle2,
  RotateCcw,
  Eye,
  Layers,
  Sparkles,
  CalendarDays,
  Briefcase,
  Users,
  Clock,
  CreditCard,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import {
  DashboardPreferences,
  DashboardLayoutMode,
  DEFAULT_DASHBOARD_PREFERENCES,
} from '../../services/dashboardPreferencesService.ts';

interface DashboardCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: DashboardPreferences;
  onSavePreferences: (updated: DashboardPreferences) => void;
  onResetPreferences: () => void;
}

export const DashboardCustomizerModal: React.FC<DashboardCustomizerModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onSavePreferences,
  onResetPreferences,
}) => {
  const [draft, setDraft] = useState<DashboardPreferences>({ ...preferences });
  const [activeTab, setActiveTab] = useState<'layout' | 'sections' | 'density'>('layout');

  if (!isOpen) return null;

  const handleToggle = (key: keyof DashboardPreferences) => {
    setDraft(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    onSavePreferences(draft);
    onClose();
  };

  const handleReset = () => {
    setDraft({ ...DEFAULT_DASHBOARD_PREFERENCES });
    onResetPreferences();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-teal-50/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <span>Customize Front Page Dashboard</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold border border-teal-200">
                  User Preferences
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Personalize your default view, toggle statutory subsections, and arrange widgets.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center space-x-2 px-6 pt-3 border-b border-slate-100 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('layout')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'layout'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Dashboard Layout View</span>
          </button>

          <button
            onClick={() => setActiveTab('sections')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'sections'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Widgets & Subsections</span>
          </button>

          <button
            onClick={() => setActiveTab('density')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'density'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Display Density</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: LAYOUT SELECTION */}
          {activeTab === 'layout' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Choose Default Front Page Dashboard</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select which dashboard should load when you open QuinceCA. You can also switch between them instantly at any time from the top bar.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                {/* 1. Statutory Practice Cockpit */}
                <div
                  onClick={() => setDraft(prev => ({ ...prev, layoutMode: 'statutory_cockpit' }))}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                    draft.layoutMode === 'statutory_cockpit'
                      ? 'border-teal-600 bg-teal-50/40 shadow-md ring-2 ring-teal-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                        <Building2 className="w-4 h-4" />
                      </div>
                      {draft.layoutMode === 'statutory_cockpit' && (
                        <CheckCircle2 className="w-5 h-5 text-teal-600" />
                      )}
                    </div>
                    <h4 className="text-xs font-black text-slate-900">Statutory Practice Cockpit</h4>
                    <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                      Standard Wireframe
                    </span>
                    <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                      The core 6 practice modules, Subsection 1 (Client Directory & KYC), Subsection 2 (Adhoc Service Catalog), and Subsection 3 (Compliance Calendar).
                    </p>
                  </div>
                </div>

                {/* 2. Operations Overview */}
                <div
                  onClick={() => setDraft(prev => ({ ...prev, layoutMode: 'operations_overview' }))}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                    draft.layoutMode === 'operations_overview'
                      ? 'border-teal-600 bg-teal-50/40 shadow-md ring-2 ring-teal-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      {draft.layoutMode === 'operations_overview' && (
                        <CheckCircle2 className="w-5 h-5 text-teal-600" />
                      )}
                    </div>
                    <h4 className="text-xs font-black text-slate-900">Practice Operations Overview</h4>
                    <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      Operations & Metrics
                    </span>
                    <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                      KPI cards, routine GST filing pipeline progress, task SLA radar, statutory notices, time-tracking, and billing radar.
                    </p>
                  </div>
                </div>

                {/* 3. Unified Hybrid Mode */}
                <div
                  onClick={() => setDraft(prev => ({ ...prev, layoutMode: 'unified_hybrid' }))}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                    draft.layoutMode === 'unified_hybrid'
                      ? 'border-purple-600 bg-purple-50/40 shadow-md ring-2 ring-purple-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                        <Zap className="w-4 h-4" />
                      </div>
                      {draft.layoutMode === 'unified_hybrid' && (
                        <CheckCircle2 className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                    <h4 className="text-xs font-black text-slate-900">Unified Hybrid View</h4>
                    <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                      All-in-One Command Center
                    </span>
                    <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                      Displays the Statutory Cockpit at the top, seamlessly followed by the Operations Overview metrics below.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WIDGETS & SUBSECTIONS */}
          {activeTab === 'sections' && (
            <div className="space-y-6">
              {/* Statutory Cockpit Sections */}
              <div>
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 mb-3">
                  <Building2 className="w-4 h-4 text-teal-600" />
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Statutory Practice Cockpit Sections
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {/* Top Module Cards */}
                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition">
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                        <Layers className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Core Practice Modules Bar</div>
                        <div className="text-[11px] text-slate-500">The 6 top tiles: Client Directory, Routine Work, Adhoc Requests, Calendar, 7-day Tasks, Billing</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={draft.showTopModuleCards}
                      onChange={() => handleToggle('showTopModuleCards')}
                      className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                    />
                  </label>

                  {/* Subsection 1 */}
                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition">
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Subsection 1: Client Directory & KYC Spotlight</div>
                        <div className="text-[11px] text-slate-500">Client details, CIN, GSTIN, directors, attached docs (13 templates), and director KYC checklist</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={draft.showClientKycSpotlight}
                      onChange={() => handleToggle('showClientKycSpotlight')}
                      className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                    />
                  </label>

                  {/* Subsection 2 */}
                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition">
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                        <Briefcase className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Subsection 2: Active Adhoc Service Catalog</div>
                        <div className="text-[11px] text-slate-500">Service catalog (GST Reg, Trademark, SPICe+, FSSAI, MSME, CMA Model) + Launch Request button</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={draft.showAdhocCatalog}
                      onChange={() => handleToggle('showAdhocCatalog')}
                      className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                    />
                  </label>

                  {/* Subsection 3 */}
                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition">
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <CalendarDays className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Subsection 3: Statutory Compliance Calendar</div>
                        <div className="text-[11px] text-slate-500">Auto-generated statutory tax dates (GST, TDS, Advance Tax, Audit) + Monthly Schedule trigger</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={draft.showComplianceCalendar}
                      onChange={() => handleToggle('showComplianceCalendar')}
                      className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                    />
                  </label>

                  {/* Priority Action Items */}
                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition">
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Priority Action Items for Partner Attention</div>
                        <div className="text-[11px] text-slate-500">Live queue of pending client returns needing partner review or intake action</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={draft.showPartnerActionItems}
                      onChange={() => handleToggle('showPartnerActionItems')}
                      className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Operations Overview Sections */}
              <div>
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 mb-3">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Practice Operations & Intelligence Sections
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {/* KPI Stat Cards */}
                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition">
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">KPI Metric Counter Cards</div>
                        <div className="text-[11px] text-slate-500">High-level summary counters (Active Clients, Filings Progress, Tasks, Revenue)</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={draft.showKpiStatCards}
                      onChange={() => handleToggle('showKpiStatCards')}
                      className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                    />
                  </label>

                  {/* Routine GST Pipeline */}
                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition">
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Routine GST Work & Filing Pipeline</div>
                        <div className="text-[11px] text-slate-500">Monthly GSTR-1, GSTR-3B intake status with WhatsApp deep links and review actions</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={draft.showOperationsPipeline}
                      onChange={() => handleToggle('showOperationsPipeline')}
                      className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                    />
                  </label>

                  {/* 7-Day Urgent Tasks */}
                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition">
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Enterprise Tasks & SLA Radar</div>
                        <div className="text-[11px] text-slate-500">Tasks due within the next 7 days, assigned staff, and priority tags</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={draft.showEnterpriseTasksRadar}
                      onChange={() => handleToggle('showEnterpriseTasksRadar')}
                      className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                    />
                  </label>

                  {/* Statutory Notices Radar */}
                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition">
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Statutory Notices & Litigation Radar</div>
                        <div className="text-[11px] text-slate-500">Income Tax and GST ASMT-10 notices with penalty risk and hearing dates</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={draft.showStatutoryNoticesRadar}
                      onChange={() => handleToggle('showStatutoryNoticesRadar')}
                      className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                    />
                  </label>

                  {/* Billing Radar */}
                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition">
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <CreditCard className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Billing, Retainers & Invoices Radar</div>
                        <div className="text-[11px] text-slate-500">Recent statutory fee collections, outstanding retainers, and payment links</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={draft.showBillingFinanceRadar}
                      onChange={() => handleToggle('showBillingFinanceRadar')}
                      className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DENSITY */}
          {activeTab === 'density' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Display Spacing & Information Density</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Adjust visual padding to show more items on screen or keep generous breathing room.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div
                  onClick={() => setDraft(prev => ({ ...prev, density: 'comfortable' }))}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition ${
                    draft.density === 'comfortable'
                      ? 'border-teal-600 bg-teal-50/40 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-900">Comfortable Spacing</span>
                    {draft.density === 'comfortable' && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Standard spacing with balanced padding, ideal for everyday laptops and standard screens.
                  </p>
                </div>

                <div
                  onClick={() => setDraft(prev => ({ ...prev, density: 'compact' }))}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition ${
                    draft.density === 'compact'
                      ? 'border-teal-600 bg-teal-50/40 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-900">Compact Density</span>
                    {draft.density === 'compact' && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Tighter padding and condensed rows, allowing more clients and tasks to fit on large monitors.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Apply Preferences</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
