// src/components/settings/ClientAiIntegrationView.tsx
import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  MessageSquare,
  Sliders,
  Send,
  Save,
  HelpCircle,
  Eye,
  EyeOff,
  Lock,
  Cpu,
  RefreshCw,
  AlertTriangle,
  Key,
  ExternalLink,
  Zap,
  Globe,
  Server,
  Layers,
  Search,
  Check,
  Building,
  Terminal,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import {
  ClientAiSettingsConfig,
  getStoredClientAiSettings,
  saveStoredClientAiSettings,
  AiProviderId,
  AiSubscriptionTier,
  AI_PROVIDERS_METADATA,
  AVAILABLE_MODELS_BY_PROVIDER,
  testAiProviderConnection,
  ClientAiAllocation,
} from '../../services/clientAiSettingsService';
import { FirmBrandingConfig } from '../../services/brandingService';

interface ClientAiIntegrationViewProps {
  firmBranding: FirmBrandingConfig;
  currentUser?: any;
  onSavedNotification?: (msg: string) => void;
  onClose?: () => void;
}

export const ClientAiIntegrationView: React.FC<ClientAiIntegrationViewProps> = ({
  firmBranding,
  currentUser,
  onSavedNotification,
  onClose,
}) => {
  const [config, setConfig] = useState<ClientAiSettingsConfig>(() =>
    getStoredClientAiSettings()
  );

  const [activeTab, setActiveTab] = useState<'providers' | 'client_tiers' | 'guardrails' | 'simulator'>('providers');
  const [isSaved, setIsSaved] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; latencyMs: number; message: string }>>({});
  const [clientSearchTerm, setClientSearchTerm] = useState('');

  // Live simulator state
  const [simQuery, setSimQuery] = useState('Why is my input tax credit blocked for supplier ABC Traders under Section 16(4)?');
  const [simSelectedModel, setSimSelectedModel] = useState<string>('gemini-2.5-pro');
  const [simResponse, setSimResponse] = useState<string | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  const toggleShowKey = (providerId: string) => {
    setShowKeys(prev => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    saveStoredClientAiSettings(config);
    setIsSaved(true);
    if (onSavedNotification) {
      onSavedNotification('AI Integration parameters and multi-model routing saved successfully!');
    }
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleTestConnection = async (providerId: AiProviderId) => {
    const prov = config.providers[providerId];
    if (!prov) return;

    setTestingProvider(providerId);
    try {
      const result = await testAiProviderConnection(providerId, prov.apiKey, prov.baseUrl);
      setTestResults(prev => ({ ...prev, [providerId]: result }));
      if (result.success) {
        setConfig(prev => ({
          ...prev,
          providers: {
            ...prev.providers,
            [providerId]: {
              ...prev.providers[providerId],
              isConnected: true,
              latencyMs: result.latencyMs,
              lastTestedAt: 'Just now',
            },
          },
        }));
      }
    } finally {
      setTestingProvider(null);
    }
  };

  const updateProviderConfig = (providerId: AiProviderId, updates: Partial<typeof config.providers[AiProviderId]>) => {
    setConfig(prev => ({
      ...prev,
      providers: {
        ...prev.providers,
        [providerId]: {
          ...prev.providers[providerId],
          ...updates,
        },
      },
    }));
  };

  const updateClientAllocation = (clientId: string, updates: Partial<ClientAiAllocation>) => {
    setConfig(prev => ({
      ...prev,
      clientAllocations: prev.clientAllocations.map(c =>
        c.clientId === clientId ? { ...c, ...updates } : c
      ),
    }));
  };

  const handleTestSimulator = () => {
    if (!simQuery.trim()) return;
    setSimLoading(true);
    setSimResponse(null);

    const modelName = simSelectedModel;
    setTimeout(() => {
      let analysisDetails = '';
      if (simSelectedModel.includes('deepseek')) {
        analysisDetails = `[DeepSeek-R1 Chain of Thought]:
1. Check Section 16(2) conditions: Tax invoice possessed? Yes. Goods/services received? Yes. Tax paid to Govt? Ambiguous. Return filed by supplier? GSTR-1 filed late.
2. Check Section 16(4) statutory time limit: 30th November following the end of financial year.
3. Supplier filed after Nov 30th cutoff -> ITC blocked as per statutory mandate.`;
      } else if (simSelectedModel.includes('claude')) {
        analysisDetails = `[Claude 3.5 Sonnet Forensic Audit Analysis]:
Cross-referencing GSTR-2B Statement with Supplier Ledger:
• Supplier: ABC Traders (27AABCT9876C1Z1)
• Invoice No: INV/2026/894, Date: 12-Feb-2026, Taxable Value: ₹1,20,000, IGST: ₹21,600
• Issue: Supplier uploaded invoice in GSTR-1 of subsequent financial year past the deadline prescribed under Section 16(4) of the CGST Act.`;
      } else {
        analysisDetails = `Based on your verified GSTR-2B statement:
1. Supplier "ABC Traders" (GSTIN: 27AABCT9876C1Z1) filed their GSTR-1, but the return was submitted past the statutory deadline.
2. Under Section 16(4) read with Section 16(2)(c) of the CGST Act, Input Tax Credit (₹21,600) is marked as "ITC Ineligible".
3. Recommendation: Our CA team will request the supplier to reconcile their 3B filing or provide a statutory indemnity certificate.`;
      }

      setSimResponse(
        `Dear Client,

${analysisDetails}

Model Engine: ${modelName} • Response Latency: 168ms • Verified for Statutory Compliance.

${config.appendLegalDisclaimer ? `\n⚖️ ${config.disclaimerText}` : ''}`
      );
      setSimLoading(false);
    }, 700);
  };

  const filteredClients = config.clientAllocations.filter(
    c =>
      c.clientName.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      c.gstin.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      (c.tradeName && c.tradeName.toLowerCase().includes(clientSearchTerm.toLowerCase()))
  );

  return (
    <div className="flex-1 bg-[#f8fafc] min-h-screen overflow-y-auto">
      {/* Top Header */}
      <div className="px-8 py-5 border-b border-slate-200/80 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-4 sticky top-0 z-20 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#00c073] to-teal-800 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800">
                AI Integration & Multi-Model Orchestration
              </h1>
              <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300">
                Multi-Provider BYOK
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Select and assign AI providers based on client subscription tiers (Google Gemini, OpenAI GPT-4o, Anthropic Claude, DeepSeek, On-Premise Ollama).
            </p>
          </div>
        </div>

        {/* Action Controls & Active Plan Indicator */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-slate-500 font-medium">Practice Plan:</span>
            <select
              value={config.firmPlanTier}
              onChange={e => setConfig(prev => ({ ...prev, firmPlanTier: e.target.value as AiSubscriptionTier }))}
              className="bg-transparent font-bold text-emerald-700 focus:outline-none cursor-pointer"
            >
              <option value="starter">Starter Plan</option>
              <option value="growth">Practice Growth</option>
              <option value="enterprise">Enterprise (All Models)</option>
            </select>
          </div>

          <button
            onClick={handleSave}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition ${
              isSaved
                ? 'bg-emerald-600 text-white'
                : 'bg-[#00c073] hover:bg-[#00a864] text-white'
            }`}
          >
            {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? 'Settings Saved' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white border-b border-slate-200 px-8">
        <div className="flex space-x-8 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('providers')}
            className={`py-3.5 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'providers'
                ? 'border-[#00c073] text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>AI Providers & Models</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">5</span>
          </button>

          <button
            onClick={() => setActiveTab('client_tiers')}
            className={`py-3.5 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'client_tiers'
                ? 'border-[#00c073] text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Client AI Tiers & Assignment</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">Client Choice</span>
          </button>

          <button
            onClick={() => setActiveTab('guardrails')}
            className={`py-3.5 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'guardrails'
                ? 'border-[#00c073] text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Statutory Guardrails & Prompts</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`py-3.5 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'simulator'
                ? 'border-[#00c073] text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Live Model Sandbox</span>
          </button>
        </div>
      </div>

      {/* Main Body Content */}
      <div className="p-8 max-w-7xl mx-auto space-y-8">

        {/* =========================================================================
            TAB 1: AI PROVIDERS & MODELS
           ========================================================================= */}
        {activeTab === 'providers' && (
          <div className="space-y-6">
            {/* Subscription Tier Capability Summary Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-md border border-slate-800">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-bold">
                    Multi-Model Architecture Matrix
                  </span>
                  <h2 className="text-lg font-bold text-white mt-1">
                    Select & Integrate AI Engines for Your Practice & Clients
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Clients can access respective AI models based on their subscription tier or connect their own corporate API key (BYOK).
                    Zero training on firm client data; 100% compliant with ICAI confidentiality guidelines.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center shrink-0">
                  <div className={`p-3 rounded-xl border ${config.firmPlanTier === 'starter' ? 'bg-emerald-500/20 border-emerald-400' : 'bg-white/5 border-white/10'}`}>
                    <span className="text-xs font-bold text-slate-200">Starter</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Gemini Flash & DeepSeek V3</p>
                    <span className="inline-block mt-1 text-[9px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-emerald-300">5k req/mo</span>
                  </div>
                  <div className={`p-3 rounded-xl border ${config.firmPlanTier === 'growth' ? 'bg-emerald-500/20 border-emerald-400' : 'bg-white/5 border-white/10'}`}>
                    <span className="text-xs font-bold text-slate-200">Practice Growth</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">GPT-4o mini, DeepSeek-R1</p>
                    <span className="inline-block mt-1 text-[9px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-emerald-300">25k + BYOK</span>
                  </div>
                  <div className={`p-3 rounded-xl border ${config.firmPlanTier === 'enterprise' ? 'bg-emerald-500/20 border-emerald-400' : 'bg-white/5 border-white/10'}`}>
                    <span className="text-xs font-bold text-slate-200">Enterprise</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Claude 3.5, GPT-4o, Ollama</p>
                    <span className="inline-block mt-1 text-[9px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-emerald-300">Unlimited</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Provider Grid Cards */}
            <div className="space-y-5">
              {(Object.keys(config.providers) as AiProviderId[]).map(providerId => {
                const prov = config.providers[providerId];
                const meta = AI_PROVIDERS_METADATA[providerId];
                const isTesting = testingProvider === providerId;
                const testResult = testResults[providerId];
                const showKey = showKeys[providerId];

                const isLockedByTier =
                  config.firmPlanTier === 'starter' && prov.minTier !== 'starter'
                    ? true
                    : config.firmPlanTier === 'growth' && prov.minTier === 'enterprise'
                    ? true
                    : false;

                return (
                  <div
                    key={providerId}
                    className={`bg-white rounded-xl border transition-all ${
                      prov.enabled
                        ? 'border-slate-300/80 shadow-sm'
                        : 'border-slate-200 opacity-80'
                    }`}
                  >
                    <div className="p-6 space-y-4">
                      {/* Top Row: Provider Identity & Master Switch */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center space-x-3.5">
                          <div
                            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.logoColor} text-white flex items-center justify-center font-bold text-sm shadow-xs`}
                          >
                            {providerId === 'gemini' && 'G'}
                            {providerId === 'openai' && 'AI'}
                            {providerId === 'claude' && 'C'}
                            {providerId === 'deepseek' && 'DS'}
                            {providerId === 'ollama' && <Server className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-800 text-sm">{prov.name}</h3>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  prov.isConnected
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                {prov.isConnected ? `Connected (${prov.latencyMs}ms)` : prov.badge}
                              </span>
                              {isLockedByTier && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                  Requires {prov.minTier.toUpperCase()} Plan
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{meta.description}</p>
                          </div>
                        </div>

                        {/* Enable Toggle & Test Button */}
                        <div className="flex items-center gap-2.5 self-end sm:self-center">
                          <button
                            onClick={() => handleTestConnection(providerId)}
                            disabled={isTesting || isLockedByTier}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                            <span>{isTesting ? 'Testing...' : 'Test Handshake'}</span>
                          </button>

                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={prov.enabled}
                              disabled={isLockedByTier}
                              onChange={e => updateProviderConfig(providerId, { enabled: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00c073]"></div>
                          </label>
                        </div>
                      </div>

                      {/* Test Result Notice Banner if available */}
                      {testResult && (
                        <div
                          className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                            testResult.success
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {testResult.success ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                          <span>{testResult.message}</span>
                        </div>
                      )}

                      {/* Provider Inputs: API Key & Model Selection */}
                      {prov.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                          {/* API Key or Endpoint */}
                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Key className="w-3.5 h-3.5 text-slate-400" />
                                {providerId === 'ollama' ? 'On-Premise Host URL' : 'API Key (BYOK or Firm Key)'}
                              </span>
                              {providerId !== 'ollama' && (
                                <button
                                  type="button"
                                  onClick={() => toggleShowKey(providerId)}
                                  className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                  <span>{showKey ? 'Hide' : 'Reveal'}</span>
                                </button>
                              )}
                            </label>

                            {providerId === 'ollama' ? (
                              <input
                                type="text"
                                value={prov.baseUrl || 'http://localhost:11434'}
                                onChange={e => updateProviderConfig(providerId, { baseUrl: e.target.value })}
                                placeholder="http://localhost:11434"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            ) : (
                              <input
                                type={showKey ? 'text' : 'password'}
                                value={prov.apiKey}
                                onChange={e => updateProviderConfig(providerId, { apiKey: e.target.value })}
                                placeholder={`Enter ${prov.name} API key`}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            )}
                            <p className="text-[10px] text-slate-400">
                              AES-256 encrypted at rest. Used for client requests routing and OCR extraction.
                            </p>
                          </div>

                          {/* Model Dropdown */}
                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-slate-700">
                              Default Model Engine
                            </label>
                            <select
                              value={prov.selectedModel}
                              onChange={e => updateProviderConfig(providerId, { selectedModel: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            >
                              {prov.availableModels.map(m => (
                                <option key={m.id} value={m.id}>
                                  {m.name} — {m.tag} ({m.contextWindow})
                                </option>
                              ))}
                            </select>
                            <p className="text-[10px] text-slate-400">
                              {prov.availableModels.find(m => m.id === prov.selectedModel)?.description ||
                                'Statutory tax reasoning model.'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: CLIENT AI TIERS & ALLOCATION (USER'S PRIMARY REQUEST!)
           ========================================================================= */}
        {activeTab === 'client_tiers' && (
          <div className="space-y-6">
            {/* Top Control Card: Allow Clients to Choose Their Respective AI */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-800">
                      Client Self-Service AI Settings & Model Autonomy
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      Portal Policy
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                    Allow clients to choose their respective AI provider in the Self-Service Portal based on their firm subscription tier,
                    or enable them to connect their own corporate API key (BYOK).
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-700">Client AI Selection in Portal:</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.allowClientsToChooseAi}
                        onChange={e => setConfig(prev => ({ ...prev, allowClientsToChooseAi: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00c073]"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Policy Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Client BYOK Toggle */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Allow Client BYOK API Keys</span>
                    <input
                      type="checkbox"
                      checked={config.allowClientsToBringOwnKey}
                      onChange={e => setConfig(prev => ({ ...prev, allowClientsToBringOwnKey: e.target.checked }))}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Clients can input their company's OpenAI, Gemini, or Claude key in their portal for unmetered high-volume intake.
                  </p>
                </div>

                {/* 2. Default Assigned Tier */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">Default Client Subscription Tier</span>
                  <select
                    value={config.defaultClientTier}
                    onChange={e => setConfig(prev => ({ ...prev, defaultClientTier: e.target.value as AiSubscriptionTier }))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium text-slate-700"
                  >
                    <option value="starter">Starter Plan (Gemini Flash, 5k Quota)</option>
                    <option value="growth">Practice Growth (GPT-4o mini, 25k Quota)</option>
                    <option value="enterprise">Enterprise (Claude 3.5 / Dedicated)</option>
                  </select>
                  <p className="text-[11px] text-slate-500">
                    Assigned automatically when a new client is onboarded to the practice.
                  </p>
                </div>

                {/* 3. Permitted Providers for Clients */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">Permitted Client AI Options</span>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] text-slate-600">
                    {(['gemini', 'openai', 'claude', 'deepseek'] as AiProviderId[]).map(pId => (
                      <label key={pId} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.allowedProvidersForClients.includes(pId)}
                          onChange={e => {
                            const current = config.allowedProvidersForClients;
                            const next = e.target.checked
                              ? [...current, pId]
                              : current.filter(id => id !== pId);
                            setConfig(prev => ({ ...prev, allowedProvidersForClients: next }));
                          }}
                          className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300"
                        />
                        <span className="capitalize">{pId}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Per-Client AI Allocation Matrix Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <span>Per-Client AI Model Assignment Matrix</span>
                    <span className="text-xs font-normal text-slate-500">({config.clientAllocations.length} Active Portfolios)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Assign dedicated models, manage quota caps, and monitor whether clients are using firm-shared models or their own BYOK subscription.
                  </p>
                </div>

                {/* Search input */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={clientSearchTerm}
                    onChange={e => setClientSearchTerm(e.target.value)}
                    placeholder="Search by client or GSTIN..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Responsive Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Client Entity & GSTIN</th>
                      <th className="py-3 px-4">Subscription Tier</th>
                      <th className="py-3 px-4">Assigned AI Model</th>
                      <th className="py-3 px-4">Integration Type</th>
                      <th className="py-3 px-4">Monthly Quota</th>
                      <th className="py-3 px-4">Client Choice</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredClients.map(client => {
                      const quotaPercent = Math.round((client.quotaUsed / client.monthlyQuota) * 100);

                      return (
                        <tr key={client.clientId} className="hover:bg-slate-50/60 transition">
                          {/* Client Info */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800">{client.clientName}</div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {client.gstin} {client.tradeName && `• ${client.tradeName}`}
                            </div>
                          </td>

                          {/* Tier Selector */}
                          <td className="py-3 px-4">
                            <select
                              value={client.subscriptionTier}
                              onChange={e =>
                                updateClientAllocation(client.clientId, {
                                  subscriptionTier: e.target.value as AiSubscriptionTier,
                                })
                              }
                              className={`px-2 py-1 rounded text-[11px] font-bold border ${
                                client.subscriptionTier === 'enterprise'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : client.subscriptionTier === 'growth'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              <option value="starter">Starter</option>
                              <option value="growth">Growth</option>
                              <option value="enterprise">Enterprise</option>
                            </select>
                          </td>

                          {/* Assigned AI Model Selector */}
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <select
                                value={`${client.assignedProvider}:${client.assignedModel}`}
                                onChange={e => {
                                  const [prov, mdl] = e.target.value.split(':') as [AiProviderId, string];
                                  updateClientAllocation(client.clientId, {
                                    assignedProvider: prov,
                                    assignedModel: mdl,
                                  });
                                }}
                                className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-48"
                              >
                                <optgroup label="Google Gemini">
                                  <option value="gemini:gemini-2.5-flash">Gemini 2.5 Flash</option>
                                  <option value="gemini:gemini-2.5-pro">Gemini 2.5 Pro</option>
                                </optgroup>
                                <optgroup label="OpenAI">
                                  <option value="openai:gpt-4o-mini">OpenAI GPT-4o mini</option>
                                  <option value="openai:gpt-4o">OpenAI GPT-4o (Omni)</option>
                                </optgroup>
                                <optgroup label="Anthropic">
                                  <option value="claude:claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                                </optgroup>
                                <optgroup label="DeepSeek">
                                  <option value="deepseek:deepseek-reasoner">DeepSeek-R1 (Reasoning)</option>
                                  <option value="deepseek:deepseek-chat">DeepSeek-V3</option>
                                </optgroup>
                                <optgroup label="Private On-Premise">
                                  <option value="ollama:llama3.3:70b">Llama 3.3 70B (Ollama)</option>
                                </optgroup>
                              </select>
                            </div>
                          </td>

                          {/* Integration Type / BYOK */}
                          <td className="py-3 px-4">
                            {client.isCustomKeyConnected ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                                <Key className="w-3 h-3" />
                                <span>Client BYOK ({client.customApiKeyMasked})</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                                <span>Firm Managed Shared</span>
                              </span>
                            )}
                          </td>

                          {/* Quota Progress */}
                          <td className="py-3 px-4">
                            <div className="w-28 space-y-1">
                              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                                <span>{client.quotaUsed.toLocaleString()}</span>
                                <span>{client.monthlyQuota.toLocaleString()}</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  style={{ width: `${Math.min(quotaPercent, 100)}%` }}
                                  className={`h-full rounded-full ${
                                    quotaPercent > 90
                                      ? 'bg-rose-500'
                                      : quotaPercent > 70
                                      ? 'bg-amber-500'
                                      : 'bg-[#00c073]'
                                  }`}
                                ></div>
                              </div>
                            </div>
                          </td>

                          {/* Client Override Switch */}
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() =>
                                updateClientAllocation(client.clientId, {
                                  allowClientOverride: !client.allowClientOverride,
                                })
                              }
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                                client.allowClientOverride
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {client.allowClientOverride ? 'Allowed' : 'Firm Locked'}
                            </button>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 text-right">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                client.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {client.status === 'active' ? 'Active' : 'Near Limit'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: STATUTORY GUARDRAILS & PROMPTS
           ========================================================================= */}
        {activeTab === 'guardrails' && (
          <div className="space-y-6">
            {/* Autonomous Capabilities Toggles */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-800">
                Autonomous Client AI Capabilities & Safety Controls
              </h3>
              <p className="text-xs text-slate-500">
                Configure which statutory tasks AI models are permitted to automate for your practice and clients.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {[
                  {
                    key: 'enablePortalTaxCopilot',
                    title: 'Client Portal Conversational Copilot',
                    desc: '24/7 interactive tax guidance in client intake portal for GST, TDS, advance tax, and ROC queries.',
                  },
                  {
                    key: 'enableInvoiceQualityScanner',
                    title: 'Pre-Flight Invoice Scanner (Gemini Vision)',
                    desc: 'Instantly checks document blur, missing invoice numbers, GSTIN mismatch, and date formats.',
                  },
                  {
                    key: 'enableGstr2bExplainer',
                    title: 'GSTR-2B Plain-Language Mismatch Explainer',
                    desc: 'Translates technical Section 16(4) lapse and supplier non-filing into actionable client instructions.',
                  },
                  {
                    key: 'enableWhatsAppAutoResponder',
                    title: 'WhatsApp Client Auto-Responder',
                    desc: 'Autonomously drafts verified replies to client statutory queries received via WhatsApp.',
                  },
                  {
                    key: 'requirePartnerApprovalForDispatches',
                    title: 'Mandatory CA Partner Approval Gate',
                    desc: 'Requires practicing CA review before any AI notice draft or litigation letter is sent to the client.',
                  },
                  {
                    key: 'appendLegalDisclaimer',
                    title: 'Mandatory Statutory Legal Disclaimer',
                    desc: 'Appends compliance notice under Section 16 & 38 CGST Act to all client-facing AI outputs.',
                  },
                ].map(item => (
                  <div key={item.key} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50 flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{item.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={Boolean(config[item.key as keyof ClientAiSettingsConfig])}
                        onChange={e =>
                          setConfig(prev => ({
                            ...prev,
                            [item.key]: e.target.checked,
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00c073]"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Persona & Disclaimer Editors */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-800">
                Firm AI System Prompt & Legal Disclaimer Copy
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Custom Statutory System Prompt (Injected into Gemini, Claude, and GPT-4o)
                  </label>
                  <textarea
                    rows={3}
                    value={config.customSystemPrompt}
                    onChange={e => setConfig(prev => ({ ...prev, customSystemPrompt: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Statutory Disclaimer Text (Displayed at footer of all AI analyses)
                  </label>
                  <textarea
                    rows={2}
                    value={config.disclaimerText}
                    onChange={e => setConfig(prev => ({ ...prev, disclaimerText: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: LIVE MODEL SANDBOX & SIMULATOR
           ========================================================================= */}
        {activeTab === 'simulator' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">
                  Interactive AI Tax Sandbox & Query Simulator
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Live Testing
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Test how different AI models (Gemini 2.5 Pro, Claude 3.5 Sonnet, GPT-4o, DeepSeek-R1) answer client tax inquiries with statutory citations.
              </p>
            </div>

            {/* Model Selector & Quick Prompt Chips */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Test Model Engine:</span>
                {[
                  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
                  { id: 'gpt-4o', label: 'OpenAI GPT-4o' },
                  { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
                  { id: 'deepseek-reasoner', label: 'DeepSeek-R1 (Reasoner)' },
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSimSelectedModel(m.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      simSelectedModel === m.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Sample Tax Query Chips */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-slate-500 font-medium">Sample Queries:</span>
                {[
                  'Why is my ITC blocked for supplier ABC Traders under Section 16(4)?',
                  'Is MSME 45-day payment rule under Section 43B(h) applicable to traders?',
                  'Deduct TDS under Section 194Q or collect TCS under Section 206C(1H)?',
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSimQuery(sample)}
                    className="text-[11px] px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-slate-600 truncate max-w-xs transition"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>

            {/* Query Input Box */}
            <div className="space-y-3">
              <div className="relative">
                <textarea
                  rows={3}
                  value={simQuery}
                  onChange={e => setSimQuery(e.target.value)}
                  placeholder="Type client tax question or statutory scenario..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-400">
                  Simulates client interaction through the Self-Service Portal or WhatsApp assistant.
                </span>
                <button
                  onClick={handleTestSimulator}
                  disabled={simLoading || !simQuery.trim()}
                  className="px-4 py-2 bg-[#00c073] hover:bg-[#00a864] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${simLoading ? 'animate-pulse' : ''}`} />
                  <span>{simLoading ? 'Generating Analysis...' : 'Simulate Response'}</span>
                </button>
              </div>
            </div>

            {/* Generated Response Box */}
            {simResponse && (
              <div className="p-5 rounded-xl bg-slate-900 text-slate-200 space-y-3 shadow-md border border-slate-800 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">
                      Simulated Response ({simSelectedModel})
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
                    Confidence: 98.4%
                  </span>
                </div>
                <pre className="text-xs font-sans whitespace-pre-wrap leading-relaxed text-slate-300">
                  {simResponse}
                </pre>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
