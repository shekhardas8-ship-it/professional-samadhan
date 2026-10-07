// src/services/portalSettingsService.ts

export interface CustomPortalModuleConfig {
  id: string;
  name: string;
  category: string;
  description: string;
  enabled: boolean;
  allowDownload: boolean;
}

export interface PortalPreferencesConfig {
  portalName: string;
  portalSlug: string;
  portalUrl: string;
  bannerMessage: string;
  enableMfa: boolean;
  allowDocUploadAndEdit: boolean;
  enableBulkPayments: boolean;
  enableClientReviews: boolean;
  enableIdentityVerification: boolean;
  customModules: CustomPortalModuleConfig[];
}

const STORAGE_KEY = 'ps_self_service_portal_settings';

export const DEFAULT_PORTAL_PREFERENCES: PortalPreferencesConfig = {
  portalName: 'shekhar60090767342',
  portalSlug: 'shekhar60090767342',
  portalUrl: 'https://portal.quinceca.com/portal/shekhar60090767342',
  bannerMessage:
    'Welcome to QuinceCA Client Portal. Please upload your monthly purchase bills, sales registers, and bank statements for statutory GST & TDS compliance before the 10th of this month.',
  enableMfa: false,
  allowDocUploadAndEdit: true,
  enableBulkPayments: true,
  enableClientReviews: false,
  enableIdentityVerification: true,
  customModules: [
    {
      id: 'mod_gst',
      name: 'GST Compliance & Returns',
      category: 'Taxation',
      description: 'Monthly GSTR-1, GSTR-3B filings, and 2B ITC mismatch summaries.',
      enabled: true,
      allowDownload: true,
    },
    {
      id: 'mod_it_tds',
      name: 'Income Tax & TDS Certificates',
      category: 'Direct Tax',
      description: 'Quarterly Form 26AS/AIS summaries, 16A TDS certificates, and advance tax chalans.',
      enabled: true,
      allowDownload: true,
    },
    {
      id: 'mod_audit',
      name: 'Statutory Audit Working Papers',
      category: 'Audit & Assurance',
      description: 'Executive audit observations, 3-way reconciliation signs, and management reports.',
      enabled: true,
      allowDownload: false,
    },
    {
      id: 'mod_roc',
      name: 'ROC & MCA Company Secretarial',
      category: 'Corporate Compliance',
      description: 'Annual AOC-4 / MGT-7 filings, Director DIN KYC status, and registered charges.',
      enabled: false,
      allowDownload: true,
    },
    {
      id: 'mod_invoices',
      name: 'Practice Invoices & Retainers',
      category: 'Billing',
      description: 'Monthly CA professional fees, payment receipts, and GST tax invoices.',
      enabled: true,
      allowDownload: true,
    },
  ],
};

export function getStoredPortalPreferences(defaultName?: string): PortalPreferencesConfig {
  if (typeof window === 'undefined') return DEFAULT_PORTAL_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      if (defaultName) {
        return {
          ...DEFAULT_PORTAL_PREFERENCES,
          portalName: defaultName,
          portalSlug: defaultName.toLowerCase().replace(/[^a-z0-9]/g, ''),
          portalUrl: `https://portal.quinceca.com/portal/${defaultName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        };
      }
      return DEFAULT_PORTAL_PREFERENCES;
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PORTAL_PREFERENCES,
      ...parsed,
      customModules: Array.isArray(parsed.customModules) && parsed.customModules.length > 0
        ? parsed.customModules
        : DEFAULT_PORTAL_PREFERENCES.customModules,
    };
  } catch {
    return DEFAULT_PORTAL_PREFERENCES;
  }
}

export function saveStoredPortalPreferences(config: PortalPreferencesConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.warn('Could not save portal preferences to localStorage:', err);
  }
}
