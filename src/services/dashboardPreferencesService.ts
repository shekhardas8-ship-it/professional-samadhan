// src/services/dashboardPreferencesService.ts
// QuinceCA - User Dashboard Customization & Preference Persistence

export type DashboardLayoutMode = 'statutory_cockpit' | 'operations_overview' | 'unified_hybrid';

export interface DashboardPreferences {
  layoutMode: DashboardLayoutMode;
  // Statutory Cockpit Subsections & Widgets
  showTopModuleCards: boolean;        // 6 core practice modules (Client Directory, Routine Work, Adhoc, Calendar, 7-day Tasks, Billing)
  showClientKycSpotlight: boolean;    // Subsection 1: Client Directory & KYC Spotlight
  showAdhocCatalog: boolean;          // Subsection 2: Active Adhoc Service Catalog
  showComplianceCalendar: boolean;    // Subsection 3: Statutory Compliance Calendar (Auto Generate)
  showPartnerActionItems: boolean;    // Priority Action Items for Partner Attention
  
  // Operations Overview Subsections & Widgets
  showKpiStatCards: boolean;          // High-level KPI stat counter cards
  showOperationsPipeline: boolean;    // Routine GST Work & filing status pipeline
  showEnterpriseTasksRadar: boolean;  // 7-day urgent tasks & SLA radar
  showStatutoryNoticesRadar: boolean; // Statutory notices & litigation alerts
  showBillingFinanceRadar: boolean;   // Invoices, unbilled hours & retainers radar

  // Layout presentation
  density: 'comfortable' | 'compact';
}

export const DEFAULT_DASHBOARD_PREFERENCES: DashboardPreferences = {
  // Default to the Statutory Cockpit requested by the user, with 1-click toggle to Operations or Unified
  layoutMode: 'statutory_cockpit',
  showTopModuleCards: true,
  showClientKycSpotlight: true,
  showAdhocCatalog: true,
  showComplianceCalendar: true,
  showPartnerActionItems: true,
  showKpiStatCards: true,
  showOperationsPipeline: true,
  showEnterpriseTasksRadar: true,
  showStatutoryNoticesRadar: true,
  showBillingFinanceRadar: true,
  density: 'comfortable',
};

const STORAGE_KEY = 'quinceca_dashboard_preference';

export function getStoredDashboardPreferences(): DashboardPreferences {
  if (typeof window === 'undefined') return DEFAULT_DASHBOARD_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DASHBOARD_PREFERENCES;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_DASHBOARD_PREFERENCES,
      ...parsed,
    };
  } catch (err) {
    console.warn('[DashboardPreferences] Failed to load preferences from storage:', err);
    return DEFAULT_DASHBOARD_PREFERENCES;
  }
}

export function saveStoredDashboardPreferences(prefs: DashboardPreferences): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    // Dispatch custom event for real-time reactivity
    window.dispatchEvent(new CustomEvent('quinceca_dashboard_pref_changed', { detail: prefs }));
  } catch (err) {
    console.warn('[DashboardPreferences] Failed to save preferences to storage:', err);
  }
}

export function resetStoredDashboardPreferences(): DashboardPreferences {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('quinceca_dashboard_pref_changed', { detail: DEFAULT_DASHBOARD_PREFERENCES }));
    } catch {}
  }
  return DEFAULT_DASHBOARD_PREFERENCES;
}
