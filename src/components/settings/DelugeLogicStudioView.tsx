// src/components/settings/DelugeLogicStudioView.tsx
import React, { useState } from 'react';
import {
  Terminal,
  Code2,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Cpu,
  Layers,
  Save,
  RotateCcw,
  Plus,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  FileCode,
} from 'lucide-react';
import { FirmBrandingConfig } from '../../services/brandingService';

interface DelugeLogicStudioViewProps {
  firmBranding: FirmBrandingConfig;
  currentUser?: any;
  onSavedNotification: (msg: string) => void;
  onClose: () => void;
}

interface DelugeScript {
  id: string;
  name: string;
  triggerEvent: string;
  description: string;
  code: string;
  active: boolean;
  executionsThisMonth: number;
  lastRun: string;
}

const DEFAULT_SCRIPTS: DelugeScript[] = [
  {
    id: 'script-1',
    name: 'GSTR-2B vs Books ITC Discrepancy Guard',
    triggerEvent: 'on_gstr2b_reconciliation',
    description: 'Flags red alert if vendor ITC in GSTR-2B differs from purchase register by > ₹5,000 or GSTIN is cancelled.',
    code: `// Deluge Script: ITC Discrepancy Checker
books_itc = input.books_purchase_tax;
gstr2b_itc = input.gstr2b_eligible_tax;
variance = math.abs(books_itc - gstr2b_itc);

if (variance > 5000) {
    create_exception({
        "severity": "CRITICAL",
        "category": "ITC_VARIANCE",
        "message": "GSTR-2B mismatch exceeds ₹5,000 threshold",
        "variance_amount": variance
    });
    notify_partner(input.client_id, "High ITC Mismatch Detected");
}`,
    active: true,
    executionsThisMonth: 842,
    lastRun: '10 mins ago',
  },
  {
    id: 'script-2',
    name: 'Section 43B(h) MSME 45-Day Payment Watcher',
    triggerEvent: 'on_purchase_bill_record',
    description: 'Enforces statutory compliance under Section 43B(h) for MSME micro/small enterprise vendors.',
    code: `// Deluge Script: Section 43B(h) MSME Compliance
if (input.vendor_udyam_status == "MICRO" || input.vendor_udyam_status == "SMALL") {
    overdue_days = date.days_between(input.bill_date, input.current_date);
    if (overdue_days > 45 && input.payment_status != "PAID") {
        flag_tax_disallowance({
            "vendor": input.vendor_name,
            "days_overdue": overdue_days,
            "amount": input.invoice_amount,
            "section": "43B(h)"
        });
    }
}`,
    active: true,
    executionsThisMonth: 1240,
    lastRun: '1 hour ago',
  },
  {
    id: 'script-3',
    name: 'Quarterly Advance Tax 15/45/75/100% Calculator',
    triggerEvent: 'on_quarter_end',
    description: 'Computes mandatory advance tax instalments under Section 208/211 based on estimated net profit.',
    code: `// Deluge Script: Advance Tax Estimation
estimated_net_profit = input.turnover * input.net_profit_ratio;
gross_tax = calculate_corporate_tax(estimated_net_profit);
net_tax = gross_tax - input.tds_credits;

if (net_tax > 10000) {
    schedule_client_reminder({
        "quarter": input.current_quarter,
        "due_date": input.instalment_due_date,
        "amount_due": net_tax * input.quarter_percentage
    });
}`,
    active: true,
    executionsThisMonth: 320,
    lastRun: 'Yesterday',
  },
];

export const DelugeLogicStudioView: React.FC<DelugeLogicStudioViewProps> = ({
  firmBranding,
  currentUser,
  onSavedNotification,
  onClose,
}) => {
  const [scripts, setScripts] = useState<DelugeScript[]>(() => {
    try {
      const saved = localStorage.getItem('quinceca_deluge_scripts');
      return saved ? JSON.parse(saved) : DEFAULT_SCRIPTS;
    } catch {
      return DEFAULT_SCRIPTS;
    }
  });

  const [selectedScript, setSelectedScript] = useState<DelugeScript>(scripts[0]);
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleToggleScript = (id: string) => {
    const updated = scripts.map((s) => (s.id === id ? { ...s, active: !s.active } : s));
    setScripts(updated);
    localStorage.setItem('quinceca_deluge_scripts', JSON.stringify(updated));
    if (selectedScript.id === id) {
      setSelectedScript({ ...selectedScript, active: !selectedScript.active });
    }
  };

  const handleRunTest = () => {
    setIsTesting(true);
    setTestOutput(null);
    setTimeout(() => {
      setIsTesting(false);
      setTestOutput(
        `[DELUGE RUNTIME] Execution ID: d-exec-98723\nTrigger: ${selectedScript.triggerEvent}\nStatus: SUCCESS (200 OK)\nExecution Time: 34ms | Memory: 4.2 MB\nOutput:\n{\n  "status": "COMPLETED",\n  "flags_raised": 1,\n  "audit_exception": "Logged to Practice Ledger",\n  "notified_roles": ["Partner", "Article Assistant"]\n}`
      );
    }, 800);
  };

  const handleSave = () => {
    const updated = scripts.map((s) => (s.id === selectedScript.id ? selectedScript : s));
    setScripts(updated);
    localStorage.setItem('quinceca_deluge_scripts', JSON.stringify(updated));
    onSavedNotification(`Deluge Script [${selectedScript.name}] saved & compiled successfully.`);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] text-slate-800">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60 shadow-xs">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Deluge Logic Studio & CA Automation Scripts
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                  Sandboxed Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Execute custom business rules, 43B(h) compliance checks, and automated statutory tax computations.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleRunTest}
            disabled={isTesting}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 fill-amber-600 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Compiling...' : 'Test Run Script'}</span>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#00c073] hover:bg-[#00ab66] text-white shadow-xs transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save & Compile</span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-6xl mx-auto w-full">
        {/* Resource Telemetry Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Monthly Executions</p>
              <h3 className="text-lg font-bold text-slate-900 mt-1">2,402 / 25,000</h3>
              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">9.6% quota used</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Average Latency</p>
              <h3 className="text-lg font-bold text-slate-900 mt-1">38 ms</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">V8 TurboFan Isolated</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Active Logic Rules</p>
              <h3 className="text-lg font-bold text-slate-900 mt-1">
                {scripts.filter((s) => s.active).length} of {scripts.length} Active
              </h3>
              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Zero runtime faults</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Two-Pane Editor Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Script List */}
          <div className="md:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Installed Scripts</span>
              <span className="text-[11px] text-slate-400">{scripts.length} rules</span>
            </div>

            <div className="divide-y divide-slate-100">
              {scripts.map((script) => (
                <div
                  key={script.id}
                  onClick={() => {
                    setSelectedScript(script);
                    setTestOutput(null);
                  }}
                  className={`p-3.5 cursor-pointer transition ${
                    selectedScript.id === script.id ? 'bg-amber-50/60 border-l-4 border-amber-500' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 truncate">{script.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleScript(script.id);
                      }}
                      className="cursor-pointer"
                    >
                      {script.active ? (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-100 text-slate-500">
                          Off
                        </span>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{script.description}</p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>{script.triggerEvent}</span>
                    <span>{script.executionsThisMonth} runs</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Script Editor Pane */}
          <div className="md:col-span-8 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{selectedScript.name}</h3>
                <span className="text-[11px] text-slate-400 font-mono">Trigger: {selectedScript.triggerEvent}</span>
              </div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedScript.active}
                  onChange={() => handleToggleScript(selectedScript.id)}
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <span className="text-xs font-semibold text-slate-700">Script Active</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Deluge Logic Code</label>
              <textarea
                value={selectedScript.code}
                onChange={(e) => setSelectedScript({ ...selectedScript, code: e.target.value })}
                rows={12}
                className="w-full text-xs font-mono p-3 bg-slate-900 text-emerald-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
                spellCheck={false}
              />
            </div>

            {testOutput && (
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400 whitespace-pre-wrap leading-relaxed animate-in fade-in">
                {testOutput}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
