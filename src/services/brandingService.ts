// src/services/brandingService.ts
export interface FirmBrandingConfig {
  id: string;
  firmName: string;
  subtitle: string;
  logoUrl: string;
  themeColor: string;
  planName: 'Starter' | 'Professional' | 'AI Automation' | 'Enterprise';
  partnerName: string;
  partnerRole: string;
  staffName: string;
  staffRole: string;
  customDomain?: string;
  portalTitle?: string;
  watermarkVisible: boolean;
  whiteLabelEnabled: boolean;
}

// Preset Logos (Self-contained SVG data URIs for offline consistency)
export const PRESET_LOGOS = {
  quinceCA: '/logo.jpg',
  apexTax: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="20" fill="%231e3a8a"/><path d="M50 18 L80 75 L20 75 Z" fill="none" stroke="%2360a5fa" stroke-width="6" stroke-linejoin="round"/><circle cx="50" cy="45" r="12" fill="%2338bdf8"/><path d="M38 75 L50 52 L62 75" fill="%231d4ed8"/></svg>`,
  sharmaSinghania: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="20" fill="%23064e3b"/><circle cx="50" cy="50" r="32" fill="none" stroke="%23f59e0b" stroke-width="4"/><text x="50" y="58" font-family="serif" font-size="28" font-weight="bold" fill="%23fbbf24" text-anchor="middle">S%26S</text><path d="M25 72 L75 72" stroke="%23d97706" stroke-width="3"/></svg>`,
  vanguardTax: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="20" fill="%234c1d95"/><path d="M50 20 L78 32 L78 58 C78 72 50 82 50 82 C50 82 22 72 22 58 L22 32 Z" fill="%236d28d9" stroke="%23a78bfa" stroke-width="4"/><path d="M40 50 L48 58 L64 42" fill="none" stroke="%23c4b5fd" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

export const DEFAULT_FIRM_BRANDING: FirmBrandingConfig = {
  id: 'firm_quinceca',
  firmName: 'QuinceCA',
  subtitle: 'Chartered Accountants • Practice System',
  logoUrl: '/logo.jpg',
  themeColor: '#00c073',
  planName: 'Enterprise',
  partnerName: 'CA Suraj Dutta (FCA)',
  partnerRole: 'Senior Managing Partner',
  staffName: 'Pooja Verma (Associate)',
  staffRole: 'Senior Associate (GST & Audit)',
  customDomain: 'app.quinceca.com',
  portalTitle: 'QuinceCA • Client GST Portal',
  watermarkVisible: true,
  whiteLabelEnabled: true,
};

export const PRESET_FIRM_BRANDINGS: FirmBrandingConfig[] = [
  DEFAULT_FIRM_BRANDING,
  {
    id: 'firm_apex',
    firmName: 'Apex Tax Advisory & Partners',
    subtitle: 'Statutory GST & Corporate Tax Practice',
    logoUrl: PRESET_LOGOS.apexTax,
    themeColor: '#2563eb',
    planName: 'AI Automation',
    partnerName: 'CA Rajesh Agarwal (FCA)',
    partnerRole: 'Founding Partner',
    staffName: 'Vikram Seth (Associate)',
    staffRole: 'Tax Specialist',
    customDomain: 'portal.apextax.in',
    portalTitle: 'Apex Tax Advisory • Client Portal',
    watermarkVisible: false,
    whiteLabelEnabled: true,
  },
  {
    id: 'firm_sharma',
    firmName: 'Sharma & Singhania Chartered Accountants',
    subtitle: 'Audit, Compliance & Forensic Accounting',
    logoUrl: PRESET_LOGOS.sharmaSinghania,
    themeColor: '#d97706',
    planName: 'Enterprise',
    partnerName: 'CA Neeraj Sharma (Senior Partner)',
    partnerRole: 'Managing Partner',
    staffName: 'Aditi Singhania (Audit Lead)',
    staffRole: 'Audit In-Charge',
    customDomain: 'ca.sharmasinghania.com',
    portalTitle: 'Sharma & Singhania • Client Audit Hub',
    watermarkVisible: false,
    whiteLabelEnabled: true,
  },
  {
    id: 'firm_vanguard',
    firmName: 'Vanguard Corporate Tax Advisors',
    subtitle: 'AI-Powered Tax Intelligence & Practice OS',
    logoUrl: PRESET_LOGOS.vanguardTax,
    themeColor: '#8b5cf6',
    planName: 'Professional',
    partnerName: 'CA Priya Mehta (FCA)',
    partnerRole: 'Principal Partner',
    staffName: 'Rohan Verma (Associate)',
    staffRole: 'GST Associate',
    customDomain: 'tax.vanguardadvisory.in',
    portalTitle: 'Vanguard Tax • Digital Client Portal',
    watermarkVisible: false,
    whiteLabelEnabled: false,
  },
];

const STORAGE_KEY = 'quinceca_firm_branding';
const LEGACY_STORAGE_KEY = 'ps_firm_branding';

export const getStoredFirmBranding = (): FirmBrandingConfig => {
  if (typeof window === 'undefined') return DEFAULT_FIRM_BRANDING;

  // 1. Check URL query parameters for dynamic tenant / firm override
  const urlParams = new URLSearchParams(window.location.search);
  const tenantParam = urlParams.get('tenant') || urlParams.get('firm');
  if (tenantParam) {
    const matched = PRESET_FIRM_BRANDINGS.find(
      p => p.id.includes(tenantParam.toLowerCase()) || p.firmName.toLowerCase().includes(tenantParam.toLowerCase())
    );
    if (matched) return matched;
  }

  // 2. Check localStorage (with legacy fallback migration)
  let saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    const legacySaved = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacySaved) {
      saved = legacySaved;
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  }

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Migrate old default firm name to QuinceCA if it was the old default
      if (parsed.firmName === 'Professional Samadhan') {
        parsed.firmName = 'QuinceCA';
      }
      if (parsed.portalTitle && parsed.portalTitle.includes('Professional Samadhan')) {
        parsed.portalTitle = parsed.portalTitle.replace(/Professional Samadhan/g, 'QuinceCA');
      }
      if (parsed.customDomain && parsed.customDomain.includes('professionalsamadhan')) {
        parsed.customDomain = 'app.quinceca.com';
      }
      return { ...DEFAULT_FIRM_BRANDING, ...parsed };
    } catch (e) {
      console.error('Error parsing stored firm branding:', e);
    }
  }

  return DEFAULT_FIRM_BRANDING;
};

export const saveStoredFirmBranding = (config: FirmBrandingConfig): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));

  // Sync to server in background
  try {
    fetch('/api/firm-branding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    }).catch(() => {});
  } catch (e) {
    // Non-blocking
  }
};

export const resetStoredFirmBranding = (): FirmBrandingConfig => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  }
  return DEFAULT_FIRM_BRANDING;
};
