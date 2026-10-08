// src/components/settings/CustomCaModulesView.tsx
import React, { useState } from 'react';
import {
  Layers,
  FileCheck2,
  KeyRound,
  Scale,
  ShieldAlert,
  Award,
  CheckCircle2,
  Save,
  RotateCcw,
  Sparkles,
  Calendar,
  AlertCircle,
  HelpCircle,
  Check,
  Building,
  FileText,
  Clock,
  Briefcase,
} from 'lucide-react';
import { FirmBrandingConfig } from '../../services/brandingService';

export interface CustomModulesConfig {
  rocMcaModule: {
    enabled: boolean;
    trackAoc4: boolean;
    trackMgt7: boolean;
    trackDpt3: boolean;
    trackDir3Kyc: boolean;
    autoLateFeeCalc: boolean;
    whatsAppReminders: boolean;
    advanceReminderDays: number;
  };
  dscTokenModule: {
    enabled: boolean;
    alertThresholdDays: number;
    requirePhysicalTokenLocation: boolean;
    notifyDirectorWhatsApp: boolean;
  };
  litigationModule: {
    enabled: boolean;
    trackGstNotices: boolean;
    trackIncomeTax148: boolean;
    hearingCalendarIntegration: boolean;
    seniorPartnerEscalation: boolean;
  };
  taxAuditModule: {
    enabled: boolean;
    form3CdChecklist: boolean;
    caro2020Checklist: boolean;
    mrlAutoDrafting: boolean;
  };
  trademarkModule: {
    enabled: boolean;
    trackOppositionPeriod: boolean;
  };
}

const DEFAULT_CONFIG: CustomModulesConfig = {
  rocMcaModule: {
    enabled: true,
    trackAoc4: true,
    trackMgt7: true,
    trackDpt3: true,
    trackDir3Kyc: true,
    autoLateFeeCalc: true,
    whatsAppReminders: true,
    advanceReminderDays: 15,
  },
  dscTokenModule: {
    enabled: true,
    alertThresholdDays: 30,
    requirePhysicalTokenLocation: true,
    notifyDirectorWhatsApp: true,
  },
  litigationModule: {
    enabled: true,
    trackGstNotices: true,
    trackIncomeTax148: true,
    hearingCalendarIntegration: true,
    seniorPartnerEscalation: true,
  },
  taxAuditModule: {
    enabled: true,
    form3CdChecklist: true,
    caro2020Checklist: true,
    mrlAutoDrafting: true,
  },
  trademarkModule: {
    enabled: false,
    trackOppositionPeriod: true,
  },
};

interface CustomCaModulesViewProps {
  firmBranding: FirmBrandingConfig;
  currentUser?: any;
  onSavedNotification?: (msg: string) => void;
  onClose?: () => void;
  isDialogMode?: boolean;
}

export const CustomCaModulesView: React.FC<CustomCaModulesViewProps> = ({
  firmBranding,
  currentUser,
  onSavedNotification,
  onClose,
  isDialogMode = false,
}) => {
  const [config, setConfig] = useState<CustomModulesConfig>(() => {
    try {
      const stored = localStorage.getItem('quinceca_custom_modules_config');
      if (stored) return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    } catch (e) {
      // fallback
    }
    return DEFAULT_CONFIG;
  });

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const handleSave = (updated: CustomModulesConfig) => {
    setConfig(updated);
    try {
      localStorage.setItem('quinceca_custom_modules_config', JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
    setSaveSuccessMsg('Custom CA modules & statutory trackers configured successfully.');
    if (onSavedNotification) onSavedNotification('Custom CA modules updated.');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all custom statutory module configurations to practice defaults?')) {
      handleSave(DEFAULT_CONFIG);
    }
  };

  return (
    <div className={`${isDialogMode ? 'p-2' : 'p-6 max-w-5xl mx-auto'} space-y-6 animate-in fade-in duration-150`}>
      {/* Header bar */}
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-xl shadow-md shadow-indigo-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-extrabold text-slate-800">Custom CA Modules & Statutory Trackers</h2>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                MCA V3 & Practice Trackers
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Enable ROC/MCA compliance, DSC token expiries, Section 148 litigation, and Tax Audit packs.
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
            onClick={() => handleSave(config)}
            className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Configuration</span>
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

      {/* Module 1: ROC & MCA Compliance Hub */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">ROC & MCA Compliance Hub (Companies Act, 2013)</h3>
              <p className="text-xs text-slate-500">
                Track annual MCA returns, Director DIN status, and automated late fee warnings.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.rocMcaModule.enabled}
              onChange={e =>
                setConfig({
                  ...config,
                  rocMcaModule: { ...config.rocMcaModule, enabled: e.target.checked },
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {config.rocMcaModule.enabled && (
          <div className="pt-3 border-t border-slate-100 space-y-3 text-xs">
            <span className="font-semibold text-slate-700 block">Monitored MCA Filing Forms:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { key: 'trackAoc4', label: 'Form AOC-4 (Financial Statements)' },
                { key: 'trackMgt7', label: 'Form MGT-7/7A (Annual Return)' },
                { key: 'trackDpt3', label: 'Form DPT-3 (Return of Deposits)' },
                { key: 'trackDir3Kyc', label: 'DIR-3 KYC (Director Annual KYC)' },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center space-x-2 cursor-pointer hover:bg-slate-100/70"
                >
                  <input
                    type="checkbox"
                    checked={(config.rocMcaModule as any)[key]}
                    onChange={e =>
                      setConfig({
                        ...config,
                        rocMcaModule: { ...config.rocMcaModule, [key]: e.target.checked },
                      })
                    }
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-slate-800 font-medium text-[11px]">{label}</span>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.rocMcaModule.autoLateFeeCalc}
                  onChange={e =>
                    setConfig({
                      ...config,
                      rocMcaModule: { ...config.rocMcaModule, autoLateFeeCalc: e.target.checked },
                    })
                  }
                  className="rounded text-emerald-600"
                />
                <span className="text-slate-700">Auto-calculate MCA Late Fee (₹100/day per Section 403)</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.rocMcaModule.whatsAppReminders}
                  onChange={e =>
                    setConfig({
                      ...config,
                      rocMcaModule: { ...config.rocMcaModule, whatsAppReminders: e.target.checked },
                    })
                  }
                  className="rounded text-emerald-600"
                />
                <span className="text-slate-700">Nudge Company Directors via WhatsApp before AGM</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Module 2: Digital Signature (DSC) & Token Management */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Digital Signature Certificate (DSC) & Token Tracker</h3>
              <p className="text-xs text-slate-500">
                Track Class 3 DSC token validity, physical dongle locations, and expiry renewal alerts.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.dscTokenModule.enabled}
              onChange={e =>
                setConfig({
                  ...config,
                  dscTokenModule: { ...config.dscTokenModule, enabled: e.target.checked },
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {config.dscTokenModule.enabled && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Expiry Alert Threshold</label>
              <select
                value={config.dscTokenModule.alertThresholdDays}
                onChange={e =>
                  setConfig({
                    ...config,
                    dscTokenModule: {
                      ...config.dscTokenModule,
                      alertThresholdDays: Number(e.target.value),
                    },
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value={45}>45 Days Before Expiry</option>
                <option value={30}>30 Days Before Expiry (Recommended)</option>
                <option value={15}>15 Days Before Expiry</option>
                <option value={7}>7 Days (Urgent)</option>
              </select>
            </div>

            <div className="space-y-2 pt-5">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.dscTokenModule.requirePhysicalTokenLocation}
                  onChange={e =>
                    setConfig({
                      ...config,
                      dscTokenModule: {
                        ...config.dscTokenModule,
                        requirePhysicalTokenLocation: e.target.checked,
                      },
                    })
                  }
                  className="rounded text-emerald-600"
                />
                <span className="text-slate-700">Enforce Physical Dongle Locker tracking in inventory</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.dscTokenModule.notifyDirectorWhatsApp}
                  onChange={e =>
                    setConfig({
                      ...config,
                      dscTokenModule: {
                        ...config.dscTokenModule,
                        notifyDirectorWhatsApp: e.target.checked,
                      },
                    })
                  }
                  className="rounded text-emerald-600"
                />
                <span className="text-slate-700">Auto-send WhatsApp Renewal Nudge to Signatory</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Module 3: Income Tax & GST Litigation Tracker */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Tax Litigation & Department Notice Tracker</h3>
              <p className="text-xs text-slate-500">
                Manage Section 148 reassessments, GST DRC-01 demand notices, and hearing appearances.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.litigationModule.enabled}
              onChange={e =>
                setConfig({
                  ...config,
                  litigationModule: { ...config.litigationModule, enabled: e.target.checked },
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {config.litigationModule.enabled && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.litigationModule.trackGstNotices}
                onChange={e =>
                  setConfig({
                    ...config,
                    litigationModule: { ...config.litigationModule, trackGstNotices: e.target.checked },
                  })
                }
                className="rounded text-emerald-600"
              />
              <span className="text-slate-700">GST DRC-01 / DRC-07 Scrutiny & Reply Timelines (30 Days)</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.litigationModule.trackIncomeTax148}
                onChange={e =>
                  setConfig({
                    ...config,
                    litigationModule: { ...config.litigationModule, trackIncomeTax148: e.target.checked },
                  })
                }
                className="rounded text-emerald-600"
              />
              <span className="text-slate-700">Income Tax Section 148 / 148A Reassessment Notice Tracker</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.litigationModule.hearingCalendarIntegration}
                onChange={e =>
                  setConfig({
                    ...config,
                    litigationModule: {
                      ...config.litigationModule,
                      hearingCalendarIntegration: e.target.checked,
                    },
                  })
                }
                className="rounded text-emerald-600"
              />
              <span className="text-slate-700">Sync Hearing Dates to CA Senior Partner Master Calendar</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.litigationModule.seniorPartnerEscalation}
                onChange={e =>
                  setConfig({
                    ...config,
                    litigationModule: {
                      ...config.litigationModule,
                      seniorPartnerEscalation: e.target.checked,
                    },
                  })
                }
                className="rounded text-emerald-600"
              />
              <span className="text-slate-700">Escalate high-demand notices (&gt; ₹10 Lakhs) to Managing Partner</span>
            </label>
          </div>
        )}
      </div>

      {/* Module 4: Statutory & Tax Audit (3CD/CARO) Pack */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Tax Audit & Statutory Audit Pack (3CA/3CB-3CD)</h3>
              <p className="text-xs text-slate-500">
                ICAI compliant 44-clause Form 3CD audit checklist and CARO 2020 verification points.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.taxAuditModule.enabled}
              onChange={e =>
                setConfig({
                  ...config,
                  taxAuditModule: { ...config.taxAuditModule, enabled: e.target.checked },
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {config.taxAuditModule.enabled && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.taxAuditModule.form3CdChecklist}
                onChange={e =>
                  setConfig({
                    ...config,
                    taxAuditModule: { ...config.taxAuditModule, form3CdChecklist: e.target.checked },
                  })
                }
                className="rounded text-emerald-600"
              />
              <span className="text-slate-700">Form 3CD Clause 1 to 44 Checklist</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.taxAuditModule.caro2020Checklist}
                onChange={e =>
                  setConfig({
                    ...config,
                    taxAuditModule: { ...config.taxAuditModule, caro2020Checklist: e.target.checked },
                  })
                }
                className="rounded text-emerald-600"
              />
              <span className="text-slate-700">CARO 2020 Reporting Clauses</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.taxAuditModule.mrlAutoDrafting}
                onChange={e =>
                  setConfig({
                    ...config,
                    taxAuditModule: { ...config.taxAuditModule, mrlAutoDrafting: e.target.checked },
                  })
                }
                className="rounded text-emerald-600"
              />
              <span className="text-slate-700">Auto-draft Management Representation Letter</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
};
