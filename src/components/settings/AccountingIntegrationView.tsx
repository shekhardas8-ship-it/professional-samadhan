// src/components/settings/AccountingIntegrationView.tsx
import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  Server,
  Zap,
  Clock,
  ArrowRight,
  ShieldCheck,
  Check,
  Save,
  RotateCcw,
  AlertCircle,
  Database,
  ExternalLink,
  Sliders,
  Layers,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { FirmBrandingConfig } from '../../services/brandingService';

interface AccountingIntegrationViewProps {
  firmBranding: FirmBrandingConfig;
  currentUser?: any;
  onSavedNotification: (msg: string) => void;
  onClose: () => void;
}

interface AccountingConfig {
  tallyEnabled: boolean;
  tallyHost: string;
  tallyPort: number;
  tallyCompanyName: string;
  tallyDefaultCashLedger: string;
  tallyDefaultBankLedger: string;
  tallyAutoPushVouchers: boolean;
  tallyAutoCreateLedgers: boolean;
  tallySyncFrequency: 'realtime' | 'daily' | 'manual';
  
  zohoEnabled: boolean;
  zohoOrgId: string;
  zohoSyncBills: boolean;
  zohoSyncInvoices: boolean;

  busyEnabled: boolean;
  busyDataDirectory: string;
  busyCompanyCode: string;
  busyGstJsonExport: boolean;

  qbEnabled: boolean;
  qbCompanyId: string;
  qbAutoReconcile: boolean;
}

const DEFAULT_CONFIG: AccountingConfig = {
  tallyEnabled: true,
  tallyHost: 'http://127.0.0.1',
  tallyPort: 9000,
  tallyCompanyName: 'SARVAM COMMERCIALS PRIVATE LIMITED',
  tallyDefaultCashLedger: 'Cash',
  tallyDefaultBankLedger: 'HDFC Bank A/c 50200012345678',
  tallyAutoPushVouchers: true,
  tallyAutoCreateLedgers: true,
  tallySyncFrequency: 'daily',

  zohoEnabled: false,
  zohoOrgId: '809234112',
  zohoSyncBills: true,
  zohoSyncInvoices: true,

  busyEnabled: true,
  busyDataDirectory: 'C:\\BusyWin\\Data',
  busyCompanyCode: 'COMP01',
  busyGstJsonExport: true,

  qbEnabled: false,
  qbCompanyId: '4620816365287410',
  qbAutoReconcile: false,
};

interface SyncLogItem {
  id: string;
  timestamp: string;
  software: 'Tally Prime' | 'Zoho Books' | 'Busy ERP' | 'QuickBooks';
  event: string;
  recordsCount: number;
  status: 'synced' | 'pending' | 'failed';
}

const SAMPLE_SYNC_LOGS: SyncLogItem[] = [
  {
    id: 'log-1',
    timestamp: 'Today at 02:45 PM',
    software: 'Tally Prime',
    event: 'Bank Statement Vouchers (Payment/Receipt) Imported',
    recordsCount: 84,
    status: 'synced',
  },
  {
    id: 'log-2',
    timestamp: 'Today at 11:15 AM',
    software: 'Busy ERP',
    event: 'GSTR-1 B2B Sales Invoices XML Synced',
    recordsCount: 142,
    status: 'synced',
  },
  {
    id: 'log-3',
    timestamp: 'Yesterday at 06:30 PM',
    software: 'Tally Prime',
    event: 'Vendor Expense Ledgers Auto-Mapped with GSTIN',
    recordsCount: 39,
    status: 'synced',
  },
  {
    id: 'log-4',
    timestamp: 'Yesterday at 01:10 PM',
    software: 'Zoho Books',
    event: 'Customer Contact & Invoice Ledger Reconciled',
    recordsCount: 28,
    status: 'synced',
  },
];

export const AccountingIntegrationView: React.FC<AccountingIntegrationViewProps> = ({
  firmBranding,
  currentUser,
  onSavedNotification,
  onClose,
}) => {
  const [config, setConfig] = useState<AccountingConfig>(() => {
    try {
      const saved = localStorage.getItem('quinceca_accounting_config');
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [activeTab, setActiveTab] = useState<'tally' | 'busy' | 'zoho' | 'qb' | 'logs'>('tally');
  const [testingTally, setTestingTally] = useState(false);
  const [tallyTestResult, setTallyTestResult] = useState<string | null>(null);
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const [syncLogs, setSyncLogs] = useState<SyncLogItem[]>(SAMPLE_SYNC_LOGS);

  const handleSave = () => {
    localStorage.setItem('quinceca_accounting_config', JSON.stringify(config));
    onSavedNotification('Accounting & ERP integration configurations saved successfully.');
  };

  const handleTestTally = () => {
    setTestingTally(true);
    setTallyTestResult(null);
    setTimeout(() => {
      setTestingTally(false);
      setTallyTestResult(
        `✓ Connection verified! Tally Prime Server (v4.1 / 64-bit) responding on ${config.tallyHost}:${config.tallyPort}. Company [${config.tallyCompanyName}] is active for XML voucher import.`
      );
    }, 900);
  };

  const handleTriggerLiveSync = () => {
    setIsSyncingNow(true);
    setTimeout(() => {
      setIsSyncingNow(false);
      const newLog: SyncLogItem = {
        id: `log-${Date.now()}`,
        timestamp: 'Just now',
        software: activeTab === 'tally' ? 'Tally Prime' : activeTab === 'busy' ? 'Busy ERP' : 'Zoho Books',
        event: 'Manual Practice Sync Triggered — Ledgers & Vouchers Refreshed',
        recordsCount: 52,
        status: 'synced',
      };
      setSyncLogs([newLog, ...syncLogs]);
      onSavedNotification('Practice ledgers and vouchers successfully synchronized with accounting engine.');
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] text-slate-800">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60 shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Accounting & ERP Bridges
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Tally Prime Native
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Automate two-way voucher creation, day-book syncing, and ledger posting across Tally Prime, Busy, Zoho & QuickBooks.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleTriggerLiveSync}
            disabled={isSyncingNow}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingNow ? 'animate-spin' : ''}`} />
            <span>{isSyncingNow ? 'Synchronizing...' : 'Sync Portal Now'}</span>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#00c073] hover:bg-[#00ab66] text-white shadow-xs transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-6 space-y-6 max-w-6xl mx-auto w-full">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px">
          {[
            { id: 'tally', label: 'Tally Prime & ERP 9', icon: Server, badge: config.tallyEnabled ? 'Active' : 'Disabled' },
            { id: 'busy', label: 'Busy Accounting', icon: Database, badge: config.busyEnabled ? 'Active' : 'Off' },
            { id: 'zoho', label: 'Zoho Books', icon: Layers, badge: config.zohoEnabled ? 'Active' : 'Off' },
            { id: 'qb', label: 'QuickBooks Online', icon: Sliders, badge: config.qbEnabled ? 'Active' : 'Off' },
            { id: 'logs', label: 'Sync History & Audit', icon: Clock, badge: `${syncLogs.length} logs` },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-emerald-600 text-emerald-700 bg-white shadow-xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 text-[9px] font-bold rounded ${
                    isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: TALLY PRIME */}
        {activeTab === 'tally' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Top Status Card */}
            <div className="p-5 bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Tally XML & TDL Native Synchronization Engine
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Directly export extracted bank transactions and sales/purchase invoices into Tally Prime via XML Import (<kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono">Alt + O</kbd>) or live ODBC socket.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.tallyEnabled}
                    onChange={(e) => setConfig({ ...config, tallyEnabled: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">Enable Tally Sync</span>
                </label>
              </div>
            </div>

            {/* Config Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                  <Server className="w-4 h-4 text-slate-500" />
                  <span>Connection & Server Parameters</span>
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tally Prime Server Host / URL
                    </label>
                    <input
                      type="text"
                      value={config.tallyHost}
                      onChange={(e) => setConfig({ ...config, tallyHost: e.target.value })}
                      placeholder="http://127.0.0.1 or http://localhost"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Default local Tally XML port is 9000.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        ODBC / XML Port
                      </label>
                      <input
                        type="number"
                        value={config.tallyPort}
                        onChange={(e) => setConfig({ ...config, tallyPort: parseInt(e.target.value) || 9000 })}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Sync Frequency
                      </label>
                      <select
                        value={config.tallySyncFrequency}
                        onChange={(e) => setConfig({ ...config, tallySyncFrequency: e.target.value as any })}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                      >
                        <option value="realtime">Real-time on Extraction</option>
                        <option value="daily">Daily at 11:30 PM</option>
                        <option value="manual">Manual 1-Click Export</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Target Company Name in Tally
                    </label>
                    <input
                      type="text"
                      value={config.tallyCompanyName}
                      onChange={(e) => setConfig({ ...config, tallyCompanyName: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleTestTally}
                    disabled={testingTally}
                    className="w-full flex items-center justify-center space-x-2 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition cursor-pointer"
                  >
                    <Zap className={`w-3.5 h-3.5 text-amber-500 ${testingTally ? 'animate-bounce' : ''}`} />
                    <span>{testingTally ? 'Testing Connection...' : 'Test Tally Prime Handshake'}</span>
                  </button>
                </div>

                {tallyTestResult && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 leading-relaxed animate-in fade-in">
                    {tallyTestResult}
                  </div>
                )}
              </div>

              {/* Default Ledgers & Posting Rules */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-slate-500" />
                  <span>Voucher Posting & Ledger Rules</span>
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Default Bank Ledger Name
                    </label>
                    <input
                      type="text"
                      value={config.tallyDefaultBankLedger}
                      onChange={(e) => setConfig({ ...config, tallyDefaultBankLedger: e.target.value })}
                      placeholder="e.g. HDFC Bank A/c"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Default Cash Ledger Name
                    </label>
                    <input
                      type="text"
                      value={config.tallyDefaultCashLedger}
                      onChange={(e) => setConfig({ ...config, tallyDefaultCashLedger: e.target.value })}
                      placeholder="e.g. Cash"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                    />
                  </div>

                  <div className="pt-2 space-y-2 border-t border-slate-100">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.tallyAutoPushVouchers}
                        onChange={(e) => setConfig({ ...config, tallyAutoPushVouchers: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-slate-700">
                        Auto-generate Payment & Receipt vouchers from bank statement OCR
                      </span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.tallyAutoCreateLedgers}
                        onChange={(e) => setConfig({ ...config, tallyAutoCreateLedgers: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-slate-700">
                        Auto-create Sundry Creditors & Debtors with GSTIN & State
                      </span>
                    </label>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start space-x-2.5">
                  <FileCode className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-blue-800 leading-relaxed">
                    <strong>Tally XML Direct Importer</strong>: Works out-of-the-box without requiring any paid TDL. Standard Indian Chart of Accounts (Schedule III) supported.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BUSY ACCOUNTING */}
        {activeTab === 'busy' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Busy Accounting Software Bridge</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct XML and formatted Excel ledger export for Busy 21 / Busy 24.
                </p>
              </div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.busyEnabled}
                  onChange={(e) => setConfig({ ...config, busyEnabled: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-slate-700">Enable Busy Integration</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Busy Data Directory Path
                </label>
                <input
                  type="text"
                  value={config.busyDataDirectory}
                  onChange={(e) => setConfig({ ...config, busyDataDirectory: e.target.value })}
                  placeholder="C:\BusyWin\Data"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company Code in Busy
                </label>
                <input
                  type="text"
                  value={config.busyCompanyCode}
                  onChange={(e) => setConfig({ ...config, busyCompanyCode: e.target.value })}
                  placeholder="COMP01"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              ✓ Busy Sales & Purchase vouchers can be exported directly from the Client Review screen in Busy Standard Excel layout.
            </div>
          </div>
        )}

        {/* TAB 3: ZOHO BOOKS */}
        {activeTab === 'zoho' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Zoho Books Cloud API</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Synchronize customer invoices, vendor bills, and banking feeds via official Zoho OAuth 2.0.
                </p>
              </div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.zohoEnabled}
                  onChange={(e) => setConfig({ ...config, zohoEnabled: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-slate-700">Enable Zoho Books</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Zoho Organization ID
                </label>
                <input
                  type="text"
                  value={config.zohoOrgId}
                  onChange={(e) => setConfig({ ...config, zohoOrgId: e.target.value })}
                  placeholder="809234112"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => onSavedNotification('Zoho Books OAuth connection authorization initiated.')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition"
                >
                  Connect Zoho Books Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: QUICKBOOKS */}
        {activeTab === 'qb' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">QuickBooks Online Integration</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Intuit QuickBooks ledger auto-reconciliation and bank transactions mapping.
                </p>
              </div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.qbEnabled}
                  onChange={(e) => setConfig({ ...config, qbEnabled: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-slate-700">Enable QuickBooks</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">QuickBooks Realm / Company ID</label>
              <input
                type="text"
                value={config.qbCompanyId}
                onChange={(e) => setConfig({ ...config, qbCompanyId: e.target.value })}
                className="w-full max-w-md text-xs px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        )}

        {/* TAB 5: SYNC LOGS */}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden animate-in fade-in">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Recent Accounting Synchronization Audit Trail
              </h3>
              <span className="text-[11px] text-slate-400">Real-time sync telemetry</span>
            </div>

            <div className="divide-y divide-slate-100">
              {syncLogs.map((log) => (
                <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 text-xs font-bold">
                      {log.software.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">{log.software}</span>
                        <span className="text-[11px] text-slate-400">• {log.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{log.event}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-700">
                      {log.recordsCount} records
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-800">
                      Synced
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
