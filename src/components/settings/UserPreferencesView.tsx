// src/components/settings/UserPreferencesView.tsx
import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Calendar,
  Clock,
  Bell,
  Volume2,
  Monitor,
  CheckCircle2,
  Save,
  RotateCcw,
  Sparkles,
  Shield,
  Layers,
  Table,
  Check,
  Smartphone,
  Mail,
  Zap,
} from 'lucide-react';
import { FirmBrandingConfig } from '../../services/brandingService';

export interface UserPreferencesConfig {
  dateFormat: 'DD-MM-YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  fiscalYearFormat: 'april_march' | 'calendar_year';
  currencyFormat: 'inr_lakhs' | 'international_millions';
  defaultLandingPage: 'client-review' | 'dashboard' | 'tasks' | 'calendar' | 'advisory';
  tableDensity: 'compact' | 'comfortable' | 'spacious';
  clientSortDefault: 'due_date' | 'name' | 'exceptions';
  enableSoundAlerts: boolean;
  enableKeyboardShortcuts: boolean;
  autoSaveIntervalSeconds: number;
  whatsAppAlerts: 'instant' | 'daily_digest' | 'off';
  statutoryDeadlineAlertDays: number[];
  dailyMorningBriefing: boolean;
  themeStyle: 'slate' | 'emerald' | 'dark';
}

const DEFAULT_PREFERENCES: UserPreferencesConfig = {
  dateFormat: 'DD-MM-YYYY',
  fiscalYearFormat: 'april_march',
  currencyFormat: 'inr_lakhs',
  defaultLandingPage: 'client-review',
  tableDensity: 'compact',
  clientSortDefault: 'due_date',
  enableSoundAlerts: true,
  enableKeyboardShortcuts: true,
  autoSaveIntervalSeconds: 15,
  whatsAppAlerts: 'instant',
  statutoryDeadlineAlertDays: [7, 3, 1],
  dailyMorningBriefing: true,
  themeStyle: 'emerald',
};

interface UserPreferencesViewProps {
  firmBranding: FirmBrandingConfig;
  currentUser?: any;
  onSavedNotification?: (msg: string) => void;
  onClose?: () => void;
  isDialogMode?: boolean;
}

export const UserPreferencesView: React.FC<UserPreferencesViewProps> = ({
  firmBranding,
  currentUser,
  onSavedNotification,
  onClose,
  isDialogMode = false,
}) => {
  const [prefs, setPrefs] = useState<UserPreferencesConfig>(() => {
    try {
      const stored = localStorage.getItem('quinceca_user_preferences');
      if (stored) return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    } catch (e) {
      // fallback
    }
    return DEFAULT_PREFERENCES;
  });

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const handleSave = (updated: UserPreferencesConfig) => {
    setPrefs(updated);
    try {
      localStorage.setItem('quinceca_user_preferences', JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
    setSaveSuccessMsg('Personal CA workstation preferences saved successfully.');
    if (onSavedNotification) onSavedNotification('User preferences saved.');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all personal preferences to recommended CA Practice OS defaults?')) {
      handleSave(DEFAULT_PREFERENCES);
    }
  };

  const toggleDeadlineDay = (day: number) => {
    const exists = prefs.statutoryDeadlineAlertDays.includes(day);
    const updatedDays = exists
      ? prefs.statutoryDeadlineAlertDays.filter(d => d !== day)
      : [...prefs.statutoryDeadlineAlertDays, day].sort((a, b) => b - a);
    setPrefs({ ...prefs, statutoryDeadlineAlertDays: updatedDays });
  };

  return (
    <div className={`${isDialogMode ? 'p-2' : 'p-6 max-w-5xl mx-auto'} space-y-6 animate-in fade-in duration-150`}>
      {/* Header Bar */}
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-xl shadow-md shadow-rose-500/20">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">CA Workstation & User Preferences</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Personalized locale, Indian fiscal year view, high-density tables, and notification channels.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-2xs flex items-center space-x-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>
          <button
            type="button"
            onClick={() => handleSave(prefs)}
            className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Preferences</span>
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

      {/* 1. Indian CA Regional & Fiscal Settings */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
        <div className="flex items-center space-x-2 text-slate-800">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider">Indian CA Regional & Fiscal Settings</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Standard Date Format</label>
            <select
              value={prefs.dateFormat}
              onChange={e => setPrefs({ ...prefs, dateFormat: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500"
            >
              <option value="DD-MM-YYYY">DD-MM-YYYY (e.g. 08-10-2026 - ICAI Standard)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 08/10/2026)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (ISO System Format)</option>
            </select>
            <span className="text-[11px] text-slate-500 mt-1 block">Used across invoices, filings & notices.</span>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Fiscal Year Standard</label>
            <select
              value={prefs.fiscalYearFormat}
              onChange={e => setPrefs({ ...prefs, fiscalYearFormat: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500"
            >
              <option value="april_march">April to March (Indian FY 2026-27 / AY 2027-28)</option>
              <option value="calendar_year">Calendar Year (Jan to Dec)</option>
            </select>
            <span className="text-[11px] text-slate-500 mt-1 block">Directly aligns with Income Tax & GST cycles.</span>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Currency & Number Formatting</label>
            <select
              value={prefs.currencyFormat}
              onChange={e => setPrefs({ ...prefs, currencyFormat: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500"
            >
              <option value="inr_lakhs">₹ INR Lakhs & Crores (₹1,25,000.00)</option>
              <option value="international_millions">International Millions (₹125,000.00)</option>
            </select>
            <span className="text-[11px] text-slate-500 mt-1 block">Display Indian comma separation for large figures.</span>
          </div>
        </div>
      </div>

      {/* 2. Practice OS Default Views & Table Density */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
        <div className="flex items-center space-x-2 text-slate-800">
          <Table className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider">Practice View & Table Density</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Default Landing Screen</label>
            <select
              value={prefs.defaultLandingPage}
              onChange={e => setPrefs({ ...prefs, defaultLandingPage: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="client-review">Client Review Pipeline (GST/ITR Workpapers)</option>
              <option value="dashboard">Executive Practice Dashboard</option>
              <option value="tasks">Statutory Tasks & Staff SLAs</option>
              <option value="calendar">Compliance Due Date Calendar</option>
              <option value="advisory">Advisory & Notice Desk</option>
            </select>
            <span className="text-[11px] text-slate-500 mt-1 block">The first page opened upon login.</span>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Table Information Density</label>
            <select
              value={prefs.tableDensity}
              onChange={e => setPrefs({ ...prefs, tableDensity: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="compact">Compact (Maximum rows visible - High CA Density)</option>
              <option value="comfortable">Comfortable (Balanced spacing)</option>
              <option value="spacious">Spacious (Touch friendly)</option>
            </select>
            <span className="text-[11px] text-slate-500 mt-1 block">Controls padding in invoice & transaction lists.</span>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Default Client Pipeline Sorting</label>
            <select
              value={prefs.clientSortDefault}
              onChange={e => setPrefs({ ...prefs, clientSortDefault: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="due_date">Nearest Statutory Due Date First</option>
              <option value="exceptions">Highest Unresolved Exceptions First</option>
              <option value="name">Client Name (A to Z)</option>
            </select>
            <span className="text-[11px] text-slate-500 mt-1 block">Automated pipeline prioritization.</span>
          </div>
        </div>
      </div>

      {/* 3. Notification & Alert Channels */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
        <div className="flex items-center space-x-2 text-slate-800">
          <Bell className="w-4 h-4 text-purple-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider">Statutory Notifications & Alert Channels</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="font-semibold text-slate-800 flex items-center space-x-1.5">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp Document Intake Alerts</span>
            </span>
            <select
              value={prefs.whatsAppAlerts}
              onChange={e => setPrefs({ ...prefs, whatsAppAlerts: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500"
            >
              <option value="instant">Instant Notification (When any client finishes uploading)</option>
              <option value="daily_digest">Daily Evening Digest (Summary of all uploads at 6:00 PM)</option>
              <option value="off">Off (In-App notifications only)</option>
            </select>
            <p className="text-[11px] text-slate-500">
              Notifies staff assigned to the client when zip or invoices are received.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="font-semibold text-slate-800 flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Statutory Due Date Escalation Warnings</span>
            </span>
            <div className="flex items-center space-x-3 pt-1">
              {[
                { day: 7, label: '7 Days Before' },
                { day: 3, label: '3 Days Before' },
                { day: 1, label: '1 Day Before' },
              ].map(({ day, label }) => {
                const isSelected = prefs.statutoryDeadlineAlertDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDeadlineDay(day)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1 transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-indigo-600" />}
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500">
              Nudges pending clients who haven't uploaded bank statements or purchase bills.
            </p>
          </div>
        </div>

        {/* Toggles */}
        <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <label className="flex items-center space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={prefs.dailyMorningBriefing}
              onChange={e => setPrefs({ ...prefs, dailyMorningBriefing: e.target.checked })}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-slate-700 font-medium">
              Enable Daily Morning Briefing Digest at 09:00 AM (Pending filings & reviews)
            </span>
          </label>

          <label className="flex items-center space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={prefs.enableSoundAlerts}
              onChange={e => setPrefs({ ...prefs, enableSoundAlerts: e.target.checked })}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-slate-700 font-medium">
              Audio Chimes for High-Severity Invoice Validation Exceptions
            </span>
          </label>

          <label className="flex items-center space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={prefs.enableKeyboardShortcuts}
              onChange={e => setPrefs({ ...prefs, enableKeyboardShortcuts: e.target.checked })}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-slate-700 font-medium">
              Enable Quick Keyboard Shortcuts (<kbd className="font-mono bg-slate-100 px-1 border rounded">/</kbd> Search, <kbd className="font-mono bg-slate-100 px-1 border rounded">Esc</kbd> Close)
            </span>
          </label>

          <div className="flex items-center space-x-2">
            <span className="text-slate-700 font-medium">Form Drafting Auto-Save Interval:</span>
            <select
              value={prefs.autoSaveIntervalSeconds}
              onChange={e => setPrefs({ ...prefs, autoSaveIntervalSeconds: Number(e.target.value) })}
              className="px-2 py-1 border border-slate-300 rounded text-xs"
            >
              <option value={10}>10 Seconds</option>
              <option value={15}>15 Seconds (Default)</option>
              <option value={30}>30 Seconds</option>
              <option value={60}>60 Seconds</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
