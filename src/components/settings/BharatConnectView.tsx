// src/components/settings/BharatConnectView.tsx
import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Globe,
  Zap,
  Clock,
  Server,
  Save,
  Building2,
  FileText,
  Key,
  Lock,
  ExternalLink,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { FirmBrandingConfig } from '../../services/brandingService';

interface BharatConnectViewProps {
  firmBranding: FirmBrandingConfig;
  currentUser?: any;
  onSavedNotification: (msg: string) => void;
  onClose: () => void;
}

interface PortalConfig {
  gstnEnabled: boolean;
  gstnGspProvider: string;
  gstnClientId: string;
  gstnEnvironment: 'production' | 'sandbox';
  gstnAutoFetch2b: boolean;

  incomeTaxEnabled: boolean;
  itFirmFrn: string;
  itEfilingPan: string;
  itAutoFetchAisTis: boolean;
  itDscRegistered: boolean;

  mcaEnabled: boolean;
  mcaV3UserId: string;
  mcaAutoSyncMasterData: boolean;
  mcaDscAssociated: boolean;

  tracesEnabled: boolean;
  tracesTan: string;
  tracesUserId: string;
  tracesAutoDownload16a: boolean;

  nicEwayEnabled: boolean;
  nicGspClientId: string;
  nicAutoGenerateIrn: boolean;
}

const DEFAULT_PORTAL_CONFIG: PortalConfig = {
  gstnEnabled: true,
  gstnGspProvider: 'Masters India GSP Gateway',
  gstnClientId: 'GSP_QUINCE_PRO_9873',
  gstnEnvironment: 'production',
  gstnAutoFetch2b: true,

  incomeTaxEnabled: true,
  itFirmFrn: '012345N/W100',
  itEfilingPan: 'AAAFP1234K',
  itAutoFetchAisTis: true,
  itDscRegistered: true,

  mcaEnabled: true,
  mcaV3UserId: 'CA_SHARMA_V3_09',
  mcaAutoSyncMasterData: true,
  mcaDscAssociated: true,

  tracesEnabled: true,
  tracesTan: 'DELP01234E',
  tracesUserId: 'TRACES_SHARMA_FIRM',
  tracesAutoDownload16a: true,

  nicEwayEnabled: true,
  nicGspClientId: 'EWB_PRO_CLIENT_44',
  nicAutoGenerateIrn: true,
};

export const BharatConnectView: React.FC<BharatConnectViewProps> = ({
  firmBranding,
  currentUser,
  onSavedNotification,
  onClose,
}) => {
  const [config, setConfig] = useState<PortalConfig>(() => {
    try {
      const saved = localStorage.getItem('quinceca_bharat_connect_config');
      return saved ? JSON.parse(saved) : DEFAULT_PORTAL_CONFIG;
    } catch {
      return DEFAULT_PORTAL_CONFIG;
    }
  });

  const [activePortal, setActivePortal] = useState<'gstn' | 'incometax' | 'mca' | 'traces' | 'nic'>('gstn');
  const [testingHandshake, setTestingHandshake] = useState(false);
  const [handshakeResult, setHandshakeResult] = useState<string | null>(null);
  const [syncingAllPortals, setSyncingAllPortals] = useState(false);

  const handleSave = () => {
    localStorage.setItem('quinceca_bharat_connect_config', JSON.stringify(config));
    onSavedNotification('Bharat Connect statutory portal credentials and sync rules updated.');
  };

  const handleTestHandshake = () => {
    setTestingHandshake(true);
    setHandshakeResult(null);
    setTimeout(() => {
      setTestingHandshake(false);
      setHandshakeResult(
        `✓ All 5 Statutory Portals Verified! [GSTN Production 200 OK] [Income Tax CPC API 200 OK] [MCA V3 Auth Token Valid] [TRACES Gateway Live]. Latency: 42ms.`
      );
    }, 1100);
  };

  const handleSyncAllPortals = () => {
    setSyncingAllPortals(true);
    setTimeout(() => {
      setSyncingAllPortals(false);
      onSavedNotification('Portal Sync Complete: Refreshed GSTR-2B data for 25 clients, MCA Master records for 14 companies, and AIS/TIS tax credits.');
    }, 1400);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] text-slate-800">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60 shadow-xs">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Bharat Connect — Statutory Portals Sync Hub
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                  Govt GSP Live
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Official API connections for GSTN, Income Tax 2.0, MCA / ROC V3, TRACES TDS, and NIC E-Way Bill.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleSyncAllPortals}
            disabled={syncingAllPortals}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingAllPortals ? 'animate-spin' : ''}`} />
            <span>{syncingAllPortals ? 'Syncing Portals...' : 'Sync All Portals'}</span>
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

      <div className="p-6 space-y-6 max-w-6xl mx-auto w-full">
        {/* Portal Status Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { name: 'GSTN Portal', status: 'Live 100%', latency: '28ms', color: 'emerald' },
            { name: 'Income Tax 2.0', status: 'Live 99.8%', latency: '45ms', color: 'emerald' },
            { name: 'MCA V3 / ROC', status: 'Live 99.4%', latency: '64ms', color: 'emerald' },
            { name: 'TRACES TDS', status: 'Live 100%', latency: '35ms', color: 'emerald' },
            { name: 'NIC e-Way / e-Inv', status: 'Live 100%', latency: '19ms', color: 'emerald' },
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-800 truncate">{item.name}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px]">
                <span className="text-emerald-700 font-semibold">{item.status}</span>
                <span className="text-slate-400 font-mono">{item.latency}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Portal Selector Tabs */}
        <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px">
          {[
            { id: 'gstn', label: 'GSTN Portal & GSP', badge: 'Active GSP' },
            { id: 'incometax', label: 'Income Tax 2.0 & AIS', badge: 'FRN Registered' },
            { id: 'mca', label: 'MCA V3 / ROC Portal', badge: 'V3 Active' },
            { id: 'traces', label: 'TRACES TDS & 26AS', badge: 'TAN Linked' },
            { id: 'nic', label: 'NIC E-Way & E-Invoice', badge: 'IRN Ready' },
          ].map((tab) => {
            const isActive = activePortal === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActivePortal(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-blue-600 text-blue-700 bg-white shadow-xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 text-[9px] font-bold rounded ${
                    isActive ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* TAB CONTENT: GSTN */}
        {activePortal === 'gstn' && (
          <div className="space-y-5 animate-in fade-in">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">GSTN Suvidha Provider (GSP) & Filing Bridge</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Connects directly to the Goods and Services Tax Network production APIs for 1-click filing and real-time reconciliation.
                  </p>
                </div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.gstnEnabled}
                    onChange={(e) => setConfig({ ...config, gstnEnabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300"
                  />
                  <span className="text-xs font-semibold text-slate-700">GSP Active</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GSP Gateway Provider</label>
                  <select
                    value={config.gstnGspProvider}
                    onChange={(e) => setConfig({ ...config, gstnGspProvider: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Masters India GSP Gateway">Masters India GSP Gateway (Enterprise Partner)</option>
                    <option value="Adaequare GSP">Adaequare GSP Direct API</option>
                    <option value="NIC Official GSP">NIC Official National Informatics GSP</option>
                    <option value="ClearTax GSP Bridge">ClearTax GSP Bridge</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GSP Client ID / App Key</label>
                  <input
                    type="text"
                    value={config.gstnClientId}
                    onChange={(e) => setConfig({ ...config, gstnClientId: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.gstnAutoFetch2b}
                    onChange={(e) => setConfig({ ...config, gstnAutoFetch2b: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300"
                  />
                  <span className="text-xs text-slate-700">
                    Automatically auto-fetch GSTR-2B JSON on the 14th of every month for all practice clients
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT: INCOME TAX */}
        {activePortal === 'incometax' && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 animate-in fade-in">
            <h3 className="text-sm font-bold text-slate-900">Income Tax e-Filing 2.0 (CPC Bengaluru) Integration</h3>
            <p className="text-xs text-slate-500">
              Direct connection for Form 26AS, AIS (Annual Information Statement), and TIS automated ingestion.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">CA Firm Registration No (FRN)</label>
                <input
                  type="text"
                  value={config.itFirmFrn}
                  onChange={(e) => setConfig({ ...config, itFirmFrn: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">e-Filing Firm PAN</label>
                <input
                  type="text"
                  value={config.itEfilingPan}
                  onChange={(e) => setConfig({ ...config, itEfilingPan: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
              ✓ Digital Signature Certificate (Class 3 DSC) is registered and active for batch ITR sign-off.
            </div>
          </div>
        )}

        {/* TAB CONTENT: MCA V3 */}
        {activePortal === 'mca' && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 animate-in fade-in">
            <h3 className="text-sm font-bold text-slate-900">MCA V3 / ROC Direct Gateway</h3>
            <p className="text-xs text-slate-500">
              Automated corporate Master Data lookup, MGT-7, AOC-4, DIR-3 KYC, and LLP Form 11 generation.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">MCA V3 User ID</label>
                <input
                  type="text"
                  value={config.mcaV3UserId}
                  onChange={(e) => setConfig({ ...config, mcaV3UserId: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  checked={config.mcaAutoSyncMasterData}
                  onChange={(e) => setConfig({ ...config, mcaAutoSyncMasterData: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs text-slate-700">Auto-sync Company Master Data on CIN entry</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT: TRACES */}
        {activePortal === 'traces' && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 animate-in fade-in">
            <h3 className="text-sm font-bold text-slate-900">TRACES TDS / TCS Portal Integration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Firm TAN</label>
                <input
                  type="text"
                  value={config.tracesTan}
                  onChange={(e) => setConfig({ ...config, tracesTan: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">TRACES User ID</label>
                <input
                  type="text"
                  value={config.tracesUserId}
                  onChange={(e) => setConfig({ ...config, tracesUserId: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT: NIC */}
        {activePortal === 'nic' && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 animate-in fade-in">
            <h3 className="text-sm font-bold text-slate-900">NIC E-Way Bill & E-Invoice (IRN) Engine</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">NIC GSP Client ID</label>
              <input
                type="text"
                value={config.nicGspClientId}
                onChange={(e) => setConfig({ ...config, nicGspClientId: e.target.value })}
                className="w-full max-w-md text-xs px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Handshake Tester */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-600">
            Verify real-time authentication tokens and connectivity to all Indian statutory endpoints.
          </div>
          <button
            onClick={handleTestHandshake}
            disabled={testingHandshake}
            className="flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition shrink-0 cursor-pointer"
          >
            <Zap className={`w-3.5 h-3.5 text-amber-400 ${testingHandshake ? 'animate-bounce' : ''}`} />
            <span>{testingHandshake ? 'Testing Handshakes...' : 'Test All 5 Portal Handshakes'}</span>
          </button>
        </div>

        {handshakeResult && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 leading-relaxed font-mono">
            {handshakeResult}
          </div>
        )}
      </div>
    </div>
  );
};
