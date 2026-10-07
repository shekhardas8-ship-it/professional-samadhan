// src/services/clientAiSettingsService.ts

export type AiSubscriptionTier = 'starter' | 'growth' | 'enterprise';
export type AiProviderId = 'gemini' | 'openai' | 'claude' | 'deepseek' | 'ollama';

export interface AiModelOption {
  id: string;
  name: string;
  tag: string;
  description: string;
  minTier: AiSubscriptionTier;
  contextWindow: string;
}

export interface ProviderConfig {
  id: AiProviderId;
  name: string;
  subtitle: string;
  badge: string;
  enabled: boolean;
  minTier: AiSubscriptionTier;
  apiKey: string;
  baseUrl?: string;
  selectedModel: string;
  availableModels: AiModelOption[];
  isConnected: boolean;
  latencyMs?: number;
  lastTestedAt?: string;
}

export interface ClientAiAllocation {
  clientId: string;
  clientName: string;
  tradeName?: string;
  gstin: string;
  subscriptionTier: AiSubscriptionTier;
  assignedProvider: AiProviderId;
  assignedModel: string;
  isCustomKeyConnected: boolean;
  customApiKeyMasked?: string;
  monthlyQuota: number;
  quotaUsed: number;
  status: 'active' | 'quota_warning' | 'paused';
  allowClientOverride: boolean;
}

export interface ClientAiSettingsConfig {
  enabled: boolean;
  firmPlanTier: AiSubscriptionTier;
  activeProvider: AiProviderId;
  activeModel: string;
  allowClientsToChooseAi: boolean;
  allowClientsToBringOwnKey: boolean;
  defaultClientTier: AiSubscriptionTier;
  defaultClientProvider: AiProviderId;
  defaultClientModel: string;
  allowedProvidersForClients: AiProviderId[];
  providers: Record<AiProviderId, ProviderConfig>;
  clientAllocations: ClientAiAllocation[];
  enablePortalTaxCopilot: boolean;
  enableInvoiceQualityScanner: boolean;
  enableGstr2bExplainer: boolean;
  enableWhatsAppAutoResponder: boolean;
  requirePartnerApprovalForDispatches: boolean;
  appendLegalDisclaimer: boolean;
  disclaimerText: string;
  customSystemPrompt: string;
  confidenceThreshold: number;
}

const STORAGE_KEY = 'ps_client_ai_integration_settings';

export const AI_PROVIDERS_METADATA: Record<AiProviderId, { name: string; logoColor: string; description: string }> = {
  gemini: {
    name: 'Google Gemini AI',
    logoColor: 'from-blue-600 to-indigo-600',
    description: 'Native multimodal vision for tax invoice OCR, GSTR-2B matching, and high-speed statutory copilot.',
  },
  openai: {
    name: 'OpenAI (ChatGPT)',
    logoColor: 'from-emerald-600 to-teal-700',
    description: 'GPT-4o and o1 reasoning models for complex legal tax drafting and scrutiny defense submissions.',
  },
  claude: {
    name: 'Anthropic Claude',
    logoColor: 'from-amber-600 to-orange-700',
    description: 'Claude 3.5 Sonnet for long financial audit working papers, bank statements, and executive analysis.',
  },
  deepseek: {
    name: 'DeepSeek AI',
    logoColor: 'from-sky-600 to-blue-800',
    description: 'DeepSeek-R1 specialized chain-of-thought statutory reasoning with high cost-efficiency.',
  },
  ollama: {
    name: 'Private On-Premise LLM',
    logoColor: 'from-purple-600 to-slate-800',
    description: 'Self-hosted Ollama / vLLM endpoint for strict ICAI confidentiality and zero cloud data leakage.',
  },
};

export const AVAILABLE_MODELS_BY_PROVIDER: Record<AiProviderId, AiModelOption[]> = {
  gemini: [
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      tag: 'Fast & Multimodal',
      description: 'Ultra-low latency invoice OCR, quick GST FAQ, and automated client intake.',
      minTier: 'starter',
      contextWindow: '1M tokens',
    },
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      tag: 'Complex Reasoning',
      description: 'Deep multi-page ledger cross-reconciliation, balance sheet audit, and tax notice drafting.',
      minTier: 'growth',
      contextWindow: '2M tokens',
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      tag: 'Ultra Context',
      description: 'Handles 100+ page annual reports, company incorporation filings, and case law precedents.',
      minTier: 'growth',
      contextWindow: '2M tokens',
    },
  ],
  openai: [
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o mini',
      tag: 'Cost Efficient',
      description: 'Fast conversational client inquiries and instant invoice classification.',
      minTier: 'growth',
      contextWindow: '128k tokens',
    },
    {
      id: 'gpt-4o',
      name: 'GPT-4o (Omni)',
      tag: 'Flagship Multimodal',
      description: 'Highest precision statutory reasoning, bilingual Hindi/English client conversations.',
      minTier: 'growth',
      contextWindow: '128k tokens',
    },
    {
      id: 'o1-preview',
      name: 'OpenAI o1',
      tag: 'Deep Reasoning',
      description: 'Specialized for complex litigation defense under Section 148 and ASMT-10 disputes.',
      minTier: 'enterprise',
      contextWindow: '128k tokens',
    },
  ],
  claude: [
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      tag: 'Forensic Audit',
      description: 'Industry-leading benchmark in analytical writing and nuanced statutory interpretation.',
      minTier: 'enterprise',
      contextWindow: '200k tokens',
    },
    {
      id: 'claude-3-5-haiku-20241022',
      name: 'Claude 3.5 Haiku',
      tag: 'High Throughput',
      description: 'High-speed WhatsApp responses and instant invoice metadata extraction.',
      minTier: 'enterprise',
      contextWindow: '200k tokens',
    },
  ],
  deepseek: [
    {
      id: 'deepseek-chat',
      name: 'DeepSeek-V3',
      tag: 'Balanced & Economical',
      description: 'General tax assistance and document summarization at fractional token cost.',
      minTier: 'starter',
      contextWindow: '64k tokens',
    },
    {
      id: 'deepseek-reasoner',
      name: 'DeepSeek-R1',
      tag: 'Chain-of-Thought',
      description: 'Step-by-step statutory mathematical derivations and multi-tier tax computations.',
      minTier: 'growth',
      contextWindow: '64k tokens',
    },
  ],
  ollama: [
    {
      id: 'llama3.3:70b',
      name: 'Llama 3.3 70B (Local)',
      tag: 'Air-Gapped Private',
      description: 'Runs on firm on-premise GPU workstation. Complete client data privacy.',
      minTier: 'enterprise',
      contextWindow: '128k tokens',
    },
    {
      id: 'deepseek-r1:14b',
      name: 'DeepSeek-R1 14B (Local)',
      tag: 'Air-Gapped Reasoner',
      description: 'Local reasoning model running via private Ollama container.',
      minTier: 'enterprise',
      contextWindow: '64k tokens',
    },
  ],
};

export const INITIAL_CLIENT_ALLOCATIONS: ClientAiAllocation[] = [
  {
    clientId: 'cli_01',
    clientName: 'Briopox Private Limited',
    tradeName: 'Briopox Tech',
    gstin: '27AABCB1234M1Z2',
    subscriptionTier: 'enterprise',
    assignedProvider: 'gemini',
    assignedModel: 'gemini-2.5-pro',
    isCustomKeyConnected: true,
    customApiKeyMasked: 'AIzaSy...7Xk9',
    monthlyQuota: 100000,
    quotaUsed: 14280,
    status: 'active',
    allowClientOverride: true,
  },
  {
    clientId: 'cli_02',
    clientName: 'Aggarwal & Sons Trading Co.',
    tradeName: 'Aggarwal Traders',
    gstin: '07AAACA9876C1Z8',
    subscriptionTier: 'growth',
    assignedProvider: 'openai',
    assignedModel: 'gpt-4o-mini',
    isCustomKeyConnected: false,
    monthlyQuota: 25000,
    quotaUsed: 8940,
    status: 'active',
    allowClientOverride: true,
  },
  {
    clientId: 'cli_03',
    clientName: 'Sharma Logistics Solutions',
    tradeName: 'Sharma Freightways',
    gstin: '06AAACS5432B1Z1',
    subscriptionTier: 'starter',
    assignedProvider: 'gemini',
    assignedModel: 'gemini-2.5-flash',
    isCustomKeyConnected: false,
    monthlyQuota: 5000,
    quotaUsed: 4620,
    status: 'quota_warning',
    allowClientOverride: false,
  },
  {
    clientId: 'cli_04',
    clientName: 'Tata Tele-Services Franchisee',
    tradeName: 'TTSL Enterprise Hub',
    gstin: '27AAACT1122D1Z5',
    subscriptionTier: 'enterprise',
    assignedProvider: 'claude',
    assignedModel: 'claude-3-5-sonnet-20241022',
    isCustomKeyConnected: true,
    customApiKeyMasked: 'sk-ant-api...99aZ',
    monthlyQuota: 150000,
    quotaUsed: 31200,
    status: 'active',
    allowClientOverride: true,
  },
  {
    clientId: 'cli_05',
    clientName: 'Mehta Textile Mills LLP',
    tradeName: 'Mehta Fabrics',
    gstin: '24AAACM4455E1ZX',
    subscriptionTier: 'growth',
    assignedProvider: 'deepseek',
    assignedModel: 'deepseek-reasoner',
    isCustomKeyConnected: false,
    monthlyQuota: 25000,
    quotaUsed: 12400,
    status: 'active',
    allowClientOverride: true,
  },
];

export const DEFAULT_CLIENT_AI_SETTINGS: ClientAiSettingsConfig = {
  enabled: true,
  firmPlanTier: 'enterprise',
  activeProvider: 'gemini',
  activeModel: 'gemini-2.5-pro',
  allowClientsToChooseAi: true,
  allowClientsToBringOwnKey: true,
  defaultClientTier: 'growth',
  defaultClientProvider: 'gemini',
  defaultClientModel: 'gemini-2.5-flash',
  allowedProvidersForClients: ['gemini', 'openai', 'claude', 'deepseek'],
  providers: {
    gemini: {
      id: 'gemini',
      name: 'Google Gemini AI',
      subtitle: 'Native High-Speed Multimodal Intelligence',
      badge: 'Active & Verified',
      enabled: true,
      minTier: 'starter',
      apiKey: 'AIzaSyPS-QuinceCA-NativeToken-2026',
      selectedModel: 'gemini-2.5-pro',
      availableModels: AVAILABLE_MODELS_BY_PROVIDER.gemini,
      isConnected: true,
      latencyMs: 142,
      lastTestedAt: 'Just now',
    },
    openai: {
      id: 'openai',
      name: 'OpenAI (ChatGPT)',
      subtitle: 'GPT-4o & o1 Reasoning Engine',
      badge: 'Connected',
      enabled: true,
      minTier: 'growth',
      apiKey: 'sk-proj-psCA-OpenAI-Encrypted-Key-9941',
      selectedModel: 'gpt-4o',
      availableModels: AVAILABLE_MODELS_BY_PROVIDER.openai,
      isConnected: true,
      latencyMs: 285,
      lastTestedAt: '2 hours ago',
    },
    claude: {
      id: 'claude',
      name: 'Anthropic Claude',
      subtitle: 'Claude 3.5 Sonnet & Haiku',
      badge: 'Enterprise Active',
      enabled: true,
      minTier: 'enterprise',
      apiKey: 'sk-ant-api03-claude-audit-ps-2026',
      selectedModel: 'claude-3-5-sonnet-20241022',
      availableModels: AVAILABLE_MODELS_BY_PROVIDER.claude,
      isConnected: true,
      latencyMs: 210,
      lastTestedAt: 'Today 11:30 AM',
    },
    deepseek: {
      id: 'deepseek',
      name: 'DeepSeek AI',
      subtitle: 'DeepSeek-R1 Cost-Effective Statutory Reasoning',
      badge: 'Connected',
      enabled: true,
      minTier: 'growth',
      apiKey: 'sk-deepseek-r1-tax-reasoning-2026',
      baseUrl: 'https://api.deepseek.com/v1',
      selectedModel: 'deepseek-reasoner',
      availableModels: AVAILABLE_MODELS_BY_PROVIDER.deepseek,
      isConnected: true,
      latencyMs: 310,
      lastTestedAt: 'Yesterday',
    },
    ollama: {
      id: 'ollama',
      name: 'Private On-Premise LLM',
      subtitle: 'Air-Gapped Local Workstation Engine',
      badge: 'Standby / Local',
      enabled: false,
      minTier: 'enterprise',
      apiKey: '',
      baseUrl: 'http://localhost:11434',
      selectedModel: 'llama3.3:70b',
      availableModels: AVAILABLE_MODELS_BY_PROVIDER.ollama,
      isConnected: false,
      latencyMs: 18,
      lastTestedAt: 'Not tested',
    },
  },
  clientAllocations: INITIAL_CLIENT_ALLOCATIONS,
  enablePortalTaxCopilot: true,
  enableInvoiceQualityScanner: true,
  enableGstr2bExplainer: true,
  enableWhatsAppAutoResponder: true,
  requirePartnerApprovalForDispatches: true,
  appendLegalDisclaimer: true,
  disclaimerText:
    'Notice: AI analysis is generated for statutory compliance assistance under Section 16 & 38 of CGST Act. Final filing sign-off is certified by the practicing Chartered Accountant.',
  customSystemPrompt:
    'You are the AI Tax & Statutory Assistant for QuinceCA. Provide clear, courteous, and accurate guidance on Indian GST, TDS, Income Tax, and ROC compliance. Always cite statutory sections and do not disclose internal CA working papers.',
  confidenceThreshold: 90,
};

export function getStoredClientAiSettings(): ClientAiSettingsConfig {
  if (typeof window === 'undefined') return DEFAULT_CLIENT_AI_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CLIENT_AI_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CLIENT_AI_SETTINGS,
      ...parsed,
      providers: {
        ...DEFAULT_CLIENT_AI_SETTINGS.providers,
        ...(parsed.providers || {}),
      },
      clientAllocations: parsed.clientAllocations || DEFAULT_CLIENT_AI_SETTINGS.clientAllocations,
    };
  } catch {
    return DEFAULT_CLIENT_AI_SETTINGS;
  }
}

export function saveStoredClientAiSettings(config: ClientAiSettingsConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.warn('Could not save client AI settings to localStorage:', err);
  }
}

/**
 * Simulates testing connection to an AI provider with live latency feedback
 */
export async function testAiProviderConnection(
  providerId: AiProviderId,
  apiKey: string,
  baseUrl?: string
): Promise<{ success: boolean; latencyMs: number; message: string }> {
  // Simulate network roundtrip
  await new Promise(r => setTimeout(r, 600));

  if (!apiKey && providerId !== 'ollama') {
    return {
      success: false,
      latencyMs: 0,
      message: `API Key is missing for ${AI_PROVIDERS_METADATA[providerId].name}. Please enter a valid API key.`,
    };
  }

  const latencies: Record<AiProviderId, number> = {
    gemini: 142,
    openai: 230,
    claude: 195,
    deepseek: 280,
    ollama: 15,
  };

  return {
    success: true,
    latencyMs: latencies[providerId] || 200,
    message: `Connected successfully to ${AI_PROVIDERS_METADATA[providerId].name}! Handshake validated and models listed.`,
  };
}
