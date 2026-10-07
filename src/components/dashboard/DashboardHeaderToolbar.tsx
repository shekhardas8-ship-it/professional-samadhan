// src/components/dashboard/DashboardHeaderToolbar.tsx
// Front-page header toolbar allowing 1-click dashboard switching and customization

import React from 'react';
import {
  Building2,
  BarChart3,
  Zap,
  Sliders,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  DashboardPreferences,
  DashboardLayoutMode,
} from '../../services/dashboardPreferencesService.ts';

interface DashboardHeaderToolbarProps {
  preferences: DashboardPreferences;
  onModeChange: (mode: DashboardLayoutMode) => void;
  onOpenCustomizer: () => void;
}

export const DashboardHeaderToolbar: React.FC<DashboardHeaderToolbarProps> = ({
  preferences,
  onModeChange,
  onOpenCustomizer,
}) => {
  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-sm p-2 sm:p-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      {/* Left: View Mode Segmented Switcher */}
      <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl overflow-x-auto">
        <button
          onClick={() => onModeChange('statutory_cockpit')}
          className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 shrink-0 ${
            preferences.layoutMode === 'statutory_cockpit'
              ? 'bg-white text-teal-800 shadow-sm border border-slate-200/80 ring-1 ring-teal-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
          title="Switch to Statutory Practice Cockpit (Client Directory, Adhoc Requests & Compliance Calendar)"
        >
          <Building2 className={`w-3.5 h-3.5 ${preferences.layoutMode === 'statutory_cockpit' ? 'text-teal-600' : 'text-slate-500'}`} />
          <span>Statutory Practice Cockpit</span>
        </button>

        <button
          onClick={() => onModeChange('operations_overview')}
          className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 shrink-0 ${
            preferences.layoutMode === 'operations_overview'
              ? 'bg-white text-blue-800 shadow-sm border border-slate-200/80 ring-1 ring-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
          title="Switch to Operations Overview (Routine Work Pipeline, Task SLAs & Financial Radar)"
        >
          <BarChart3 className={`w-3.5 h-3.5 ${preferences.layoutMode === 'operations_overview' ? 'text-blue-600' : 'text-slate-500'}`} />
          <span>Operations Overview</span>
        </button>

        <button
          onClick={() => onModeChange('unified_hybrid')}
          className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 shrink-0 ${
            preferences.layoutMode === 'unified_hybrid'
              ? 'bg-white text-purple-800 shadow-sm border border-slate-200/80 ring-1 ring-purple-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
          title="Switch to Unified Hybrid View (Statutory Cockpit + Operations Overview in one page)"
        >
          <Zap className={`w-3.5 h-3.5 ${preferences.layoutMode === 'unified_hybrid' ? 'text-purple-600' : 'text-slate-500'}`} />
          <span>Unified Hybrid View</span>
        </button>
      </div>

      {/* Right: Customization Action & Active Badge */}
      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
        <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 px-2">
          <Layers className="w-3 h-3 text-teal-600" />
          <span>
            {preferences.layoutMode === 'statutory_cockpit'
              ? 'Statutory Mode'
              : preferences.layoutMode === 'operations_overview'
              ? 'Operations Mode'
              : 'Combined Hybrid Mode'}
          </span>
        </span>

        <button
          onClick={onOpenCustomizer}
          className="px-3.5 py-1.5 bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-800 text-xs font-bold rounded-xl border border-slate-200/90 hover:border-teal-300 shadow-sm transition flex items-center gap-1.5 group"
          title="Customize dashboard layout, show/hide subsections, and configure preferences"
        >
          <Sliders className="w-3.5 h-3.5 text-teal-600 group-hover:rotate-45 transition-transform" />
          <span>Customize Dashboard</span>
        </button>
      </div>
    </div>
  );
};
