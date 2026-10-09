// src/App.tsx
import React, { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { UserRole, MonthlyRequest, AuthUser } from './types/index.ts';
import { Header } from './components/Header.tsx';
import { SidebarZoho } from './components/SidebarZoho.tsx';
import { HeaderZoho } from './components/HeaderZoho.tsx';
import { ZohoDashboardView } from './components/ZohoDashboardView.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import { CaExecutiveCockpit } from './components/CaExecutiveCockpit.tsx';
import { ClientsHubView } from './components/ClientsHubView.tsx';
import { ClientDirectoryKycView } from './components/ClientDirectoryKycView.tsx';
import { AdhocRequestsView } from './components/AdhocRequestsView.tsx';
import { ComplianceCalendarView } from './components/ComplianceCalendarView.tsx';
import { Next7DaysPendingTaxView } from './components/Next7DaysPendingTaxView.tsx';
import { BillingFinanceView } from './components/BillingFinanceView.tsx';
import { CaDashboard } from './components/CaDashboard.tsx';
import { StaffReviewModal } from './components/StaffReviewModal.tsx';
import { ClientPortalView } from './components/ClientPortalView.tsx';
import { WhatsAppSenderModal } from './components/WhatsAppSenderModal.tsx';
import { AuditLogsView } from './components/AuditLogsView.tsx';
import { SetupGuideView } from './components/SetupGuideView.tsx';
import { ClientManagementModal } from './components/ClientManagementModal.tsx';
import { WhatsAppDeviceLinkModal } from './components/WhatsAppDeviceLinkModal.tsx';
import { PracticeLayout } from './components/layout/PracticeLayout.tsx';
import { PracticeOverviewDashboard } from './components/dashboard/PracticeOverviewDashboard.tsx';
import { TasksView } from './components/tasks/TasksView.tsx';
import { TimeTrackingView } from './components/timetracking/TimeTrackingView.tsx';
import { WorkpaperView } from './components/workpaper/WorkpaperView.tsx';
import { GstItrFilingHubView } from './components/filing/GstItrFilingHubView.tsx';
import { DocumentsVaultView } from './components/documents/DocumentsVaultView.tsx';
import { StatutoryNoticesView } from './components/notices/StatutoryNoticesView.tsx';
import { DscLicenceTrackerView } from './components/dsc/DscLicenceTrackerView.tsx';
import { WorkflowAutomationView } from './components/automation/WorkflowAutomationView.tsx';
import { AiCopilotView } from './components/ai/AiCopilotView.tsx';
import { SuperAdminConsoleView } from './components/superadmin/SuperAdminConsoleView.tsx';
import { SystemDiagnosticsView } from './components/diagnostics/SystemDiagnosticsView.tsx';
import { AllSettingsView } from './components/settings/AllSettingsView.tsx';
import { BrandingCustomizerModal } from './components/common/BrandingCustomizerModal.tsx';
import { DashboardHeaderToolbar } from './components/dashboard/DashboardHeaderToolbar.tsx';
import { DashboardCustomizerModal } from './components/dashboard/DashboardCustomizerModal.tsx';
import {
  DashboardPreferences,
  DashboardLayoutMode,
  getStoredDashboardPreferences,
  saveStoredDashboardPreferences,
  resetStoredDashboardPreferences,
} from './services/dashboardPreferencesService.ts';
import {
  FirmBrandingConfig,
  getStoredFirmBranding,
  saveStoredFirmBranding,
  resetStoredFirmBranding,
} from './services/brandingService.ts';

export default function App() {
  // Check if opened via unique client portal link with token or direct client path
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const tokenFromUrl = urlParams.get('token') || urlParams.get('client') || urlParams.get('clientId');
  const isDirectClientRoute = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/client-portal') ||
    window.location.pathname.startsWith('/client') ||
    window.location.pathname.startsWith('/portal') ||
    window.location.hash.includes('client')
  );
  const isClientOnlyMode = !!tokenFromUrl || isDirectClientRoute;

  // Firm White-Label & Branding State
  const [firmBranding, setFirmBranding] = useState<FirmBrandingConfig>(getStoredFirmBranding);

  // Authentication State (with Super Admin recognition for shekhardas8@gmail.com)
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthUser | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('ps_auth_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.email?.toLowerCase() === 'shekhardas8@gmail.com' || parsed?.role === 'superadmin') {
          return { ...parsed, role: 'superadmin', isSuperAdmin: true };
        }
        return parsed;
      } catch {
        return null;
      }
    }
    return null;
  });

  const isSuperAdmin =
    authenticatedUser?.role === 'superadmin' ||
    authenticatedUser?.email?.toLowerCase() === 'shekhardas8@gmail.com' ||
    authenticatedUser?.isSuperAdmin === true;

  const [currentRole, setCurrentRole] = useState<UserRole>(
    isClientOnlyMode
      ? 'client'
      : isSuperAdmin
      ? 'superadmin'
      : authenticatedUser?.role || 'ca_admin'
  );

  const [activeTab, setActiveTab] = useState<string>(
    isClientOnlyMode
      ? 'client-portal'
      : authenticatedUser?.role === 'client'
      ? 'client-portal'
      : 'home'
  );

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [requests, setRequests] = useState<MonthlyRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Active Modals
  const [selectedRequestForReview, setSelectedRequestForReview] = useState<MonthlyRequest | null>(null);
  const [whatsappModalData, setWhatsappModalData] = useState<{
    request: MonthlyRequest;
    actionType: 'initial' | 'reminder';
  } | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isWhatsAppDeviceModalOpen, setIsWhatsAppDeviceModalOpen] = useState(false);
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
  const [isDashboardCustomizerOpen, setIsDashboardCustomizerOpen] = useState(false);
  const [activePortalToken, setActivePortalToken] = useState<string | undefined>(
    tokenFromUrl || authenticatedUser?.token || undefined
  );

  // Front-Page Dashboard Customization & Preference State
  const [dashboardPreferences, setDashboardPreferences] = useState<DashboardPreferences>(getStoredDashboardPreferences);

  useEffect(() => {
    const handlePrefChange = (e: any) => {
      if (e.detail) setDashboardPreferences(e.detail);
    };
    window.addEventListener('quinceca_dashboard_pref_changed', handlePrefChange);
    return () => window.removeEventListener('quinceca_dashboard_pref_changed', handlePrefChange);
  }, []);

  const handleUpdateDashboardMode = (mode: DashboardLayoutMode) => {
    const updated = { ...dashboardPreferences, layoutMode: mode };
    setDashboardPreferences(updated);
    saveStoredDashboardPreferences(updated);
  };

  const handleSaveDashboardPreferences = (updated: DashboardPreferences) => {
    setDashboardPreferences(updated);
    saveStoredDashboardPreferences(updated);
  };

  const handleResetDashboardPreferences = () => {
    const def = resetStoredDashboardPreferences();
    setDashboardPreferences(def);
  };

  const fetchMonthlyRequests = async () => {
    // Never fetch CA pipeline if in client mode
    if (isClientOnlyMode || currentRole === 'client') return;

    try {
      setLoading(true);
      const res = await fetch('/api/monthly-requests', {
        headers: {
          'x-user-role': currentRole,
          'x-user-id': authenticatedUser?.id || (currentRole === 'staff' ? 'staff_pooja_02' : 'ca_rajesh_01'),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error('Failed to load monthly requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authenticatedUser && !isClientOnlyMode && currentRole !== 'client') {
      fetchMonthlyRequests();
    }
  }, [currentRole, authenticatedUser, isClientOnlyMode]);

  const handleLoginSuccess = (user: AuthUser) => {
    const isSuper =
      user.role === 'superadmin' ||
      user.email?.toLowerCase() === 'shekhardas8@gmail.com' ||
      user.isSuperAdmin === true;

    const finalUser: AuthUser = isSuper
      ? { ...user, role: 'superadmin', isSuperAdmin: true }
      : user;

    setAuthenticatedUser(finalUser);
    setCurrentRole(finalUser.role);
    if (finalUser.role === 'client') {
      setActivePortalToken(finalUser.token);
      setActiveTab('client-portal');
    } else {
      setActiveTab('home');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('ps_auth_user');
    setAuthenticatedUser(null);
    setCurrentRole('ca_admin');
    setActiveTab('home');
  };

  const handleTriggerSchedule = async () => {
    try {
      setActionLoading(true);
      const res = await fetch('/api/monthly-requests/schedule-trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentRole,
        },
        body: JSON.stringify({ mode: 'manual' }),
      });
      const data = await res.json();
      alert(`Autonomous Intake Batch Complete!\nProcessed: ${data.totalClients} clients for ${data.period?.reportingMonth}.`);
      await fetchMonthlyRequests();
    } catch (err: any) {
      alert('Schedule trigger error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateWorkbook = async (requestId: string) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/monthly-requests/${requestId}/generate-workbook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentRole,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate workbook');
      alert(`Working Paper Workbook v${data.version} successfully compiled and snapshot preserved!\nFilename: ${data.filename}`);
      await fetchMonthlyRequests();
    } catch (err: any) {
      alert('Generation failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePauseReminders = async (requestId: string, paused: boolean) => {
    try {
      const res = await fetch(`/api/monthly-requests/${requestId}/pause-reminders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentRole,
        },
        body: JSON.stringify({ paused }),
      });
      if (res.ok) {
        await fetchMonthlyRequests();
      }
    } catch (err) {
      console.error('Failed to toggle reminder status:', err);
    }
  };

  const handleOpenClientPortal = (token: string) => {
    setActivePortalToken(token);
    setActiveTab('client-portal');
  };

  // If not authenticated and not accessing via direct client portal, show Login Screen
  if (!authenticatedUser && !isClientOnlyMode && activeTab !== 'client-portal') {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        branding={firmBranding}
        onUpdateBranding={setFirmBranding}
        onDirectClientAccess={() => {
          if (typeof window !== 'undefined') {
            window.history.pushState({}, '', '/client-portal');
          }
          setCurrentRole('client');
          setActiveTab('client-portal');
        }}
      />
    );
  }

  // If client-only mode, render standalone portal without internal CA office sidebar
  if (isClientOnlyMode) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
        <ClientPortalView initialToken={activePortalToken} isStandaloneClient={true} />
      </div>
    );
  }

  return (
    <PracticeLayout
      currentRole={currentRole}
      currentUser={authenticatedUser}
      firmBranding={firmBranding}
      onUpdateBranding={setFirmBranding}
      activeTab={activeTab}
      onTabChange={tab => {
        if (tab === 'cockpit') setActiveTab('home');
        else setActiveTab(tab);
      }}
      onLogout={handleLogout}
      onRefresh={fetchMonthlyRequests}
      isLoading={loading}
      onTriggerIntake={handleTriggerSchedule}
      onOpenNewClientModal={() => setIsClientModalOpen(true)}
    >
      {/* 1. Home / Practice Dashboard with User Preference & View Customization */}
      {(activeTab === 'home' || activeTab === 'cockpit') && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Front-Page Dashboard Header Toolbar (View Mode Switcher + Customize Button) */}
          <DashboardHeaderToolbar
            preferences={dashboardPreferences}
            onModeChange={handleUpdateDashboardMode}
            onOpenCustomizer={() => setIsDashboardCustomizerOpen(true)}
          />

          {/* Mode 1: Statutory Practice Cockpit (Requested Wireframe / Screenshot Dashboard) */}
          {dashboardPreferences.layoutMode === 'statutory_cockpit' && (
            <CaExecutiveCockpit
              requests={requests}
              currentUser={authenticatedUser}
              firmBranding={firmBranding}
              preferences={dashboardPreferences}
              onNavigateTab={tab => setActiveTab(tab)}
              onTriggerSchedule={handleTriggerSchedule}
              onOpenNewClientModal={() => setIsClientModalOpen(true)}
              onRefreshParent={fetchMonthlyRequests}
              isActionLoading={actionLoading}
            />
          )}

          {/* Mode 2: Practice Operations Overview */}
          {dashboardPreferences.layoutMode === 'operations_overview' && (
            <PracticeOverviewDashboard
              requests={requests}
              currentUser={authenticatedUser}
              firmBranding={firmBranding}
              preferences={dashboardPreferences}
              onNavigateTab={tab => setActiveTab(tab)}
              onTriggerSchedule={handleTriggerSchedule}
              onOpenNewClientModal={() => setIsClientModalOpen(true)}
              onRefreshParent={fetchMonthlyRequests}
              isActionLoading={actionLoading}
            />
          )}

          {/* Mode 3: Unified Hybrid View (Statutory Cockpit + Operations Overview in one page) */}
          {dashboardPreferences.layoutMode === 'unified_hybrid' && (
            <div className="space-y-8">
              <CaExecutiveCockpit
                requests={requests}
                currentUser={authenticatedUser}
                firmBranding={firmBranding}
                preferences={dashboardPreferences}
                onNavigateTab={tab => setActiveTab(tab)}
                onTriggerSchedule={handleTriggerSchedule}
                onOpenNewClientModal={() => setIsClientModalOpen(true)}
                onRefreshParent={fetchMonthlyRequests}
                isActionLoading={actionLoading}
              />
              <PracticeOverviewDashboard
                requests={requests}
                currentUser={authenticatedUser}
                firmBranding={firmBranding}
                preferences={dashboardPreferences}
                isEmbedded={true}
                onNavigateTab={tab => setActiveTab(tab)}
                onTriggerSchedule={handleTriggerSchedule}
                onOpenNewClientModal={() => setIsClientModalOpen(true)}
                onRefreshParent={fetchMonthlyRequests}
                isActionLoading={actionLoading}
              />
            </div>
          )}
        </div>
      )}

      {/* 1b. Direct Access to Executive Cockpit */}
      {activeTab === 'executive-cockpit' && (
        <CaExecutiveCockpit
          requests={requests}
          currentUser={authenticatedUser}
          firmBranding={firmBranding}
          preferences={dashboardPreferences}
          onNavigateTab={tab => setActiveTab(tab)}
          onTriggerSchedule={handleTriggerSchedule}
          onOpenNewClientModal={() => setIsClientModalOpen(true)}
          onRefreshParent={fetchMonthlyRequests}
          isActionLoading={actionLoading}
        />
      )}

      {/* 2. Clients Hub & KYC Directory (Includes Client Requests under Clients) */}
      {(activeTab === 'clients' || activeTab === 'client-requests') && (
        <ClientDirectoryKycView
          onBack={() => setActiveTab('home')}
          onOpenClientPortal={handleOpenClientPortal}
          onRefreshParent={fetchMonthlyRequests}
          initialSubTab={activeTab === 'client-requests' ? 'client-requests' : undefined}
          requests={requests}
          onOpenReview={req => setSelectedRequestForReview(req)}
          onOpenWhatsApp={(req, actionType) => setWhatsappModalData({ request: req, actionType })}
          onGenerateWorkbook={handleGenerateWorkbook}
          onTriggerSchedule={handleTriggerSchedule}
          onTogglePauseReminders={handleTogglePauseReminders}
          isActionLoading={actionLoading}
        />
      )}

      {/* 3. Direct Routine Work (GST Filing Pipeline) */}
      {activeTab === 'gst-pipeline' && (
        <CaDashboard
          onBack={() => setActiveTab('clients')}
          requests={requests}
          onOpenReview={req => setSelectedRequestForReview(req)}
          onOpenWhatsApp={(req, actionType) => setWhatsappModalData({ request: req, actionType })}
          onGenerateWorkbook={handleGenerateWorkbook}
          onTriggerSchedule={handleTriggerSchedule}
          onTogglePauseReminders={handleTogglePauseReminders}
          onOpenClientPortal={handleOpenClientPortal}
          onRefresh={fetchMonthlyRequests}
          isActionLoading={actionLoading}
        />
      )}

      {/* 4. Insights & Statutory Compliance Calendar */}
      {(activeTab === 'insights' || activeTab === 'compliance-calendar') && (
        <ComplianceCalendarView onBack={() => setActiveTab('home')} />
      )}

      {/* 5. Enterprise Tasks & SLA */}
      {activeTab === 'tasks' && (
        <TasksView onBack={() => setActiveTab('home')} />
      )}

      {/* 6. Time Tracking & Timesheets */}
      {activeTab === 'time-tracking' && (
        <TimeTrackingView />
      )}

      {/* 7. Statutory Audit Working Paper Engine */}
      {activeTab === 'workpaper' && (
        <WorkpaperView
          requests={requests}
          onOpenReview={req => setSelectedRequestForReview(req)}
          onGenerateWorkbook={handleGenerateWorkbook}
          isActionLoading={actionLoading}
        />
      )}

      {/* 7b. Direct GST & ITR Government E-Filing Hub */}
      {(activeTab === 'gst-itr-filing' || activeTab === 'govt-efiling') && (
        <GstItrFilingHubView onBack={() => setActiveTab('home')} />
      )}

      {/* 8. Documents Vault & AI Intelligence */}
      {activeTab === 'documents' && (
        <DocumentsVaultView />
      )}

      {/* 9. Reports & Audit Logs */}
      {(activeTab === 'reports' || activeTab === 'audit-logs') && (
        <AuditLogsView onBack={() => setActiveTab('home')} />
      )}

      {/* 10. Statutory Notices & Litigation */}
      {activeTab === 'notices' && (
        <StatutoryNoticesView />
      )}

      {/* 11. Billing, Retainers & Finance */}
      {(activeTab === 'billing' || activeTab === 'billing-finance') && (
        <BillingFinanceView onBack={() => setActiveTab('home')} />
      )}

      {/* 12. Workflow Automation No-Code Builder */}
      {activeTab === 'automation' && (
        <WorkflowAutomationView />
      )}

      {/* 13. DSC & Licence Expiry Radar */}
      {activeTab === 'dsc' && (
        <DscLicenceTrackerView />
      )}

      {/* 14. AI CA Copilot & Multi-Agent Network */}
      {activeTab === 'ai-copilot' && (
        <AiCopilotView />
      )}

      {/* 15. Super Admin Console & Plans (Restricted to Super Administrator: shekhardas8@gmail.com) */}
      {activeTab === 'super-admin' && (
        isSuperAdmin ? (
          <SuperAdminConsoleView />
        ) : (
          <div className="p-8 max-w-xl mx-auto my-12 bg-white rounded-2xl border border-rose-200 shadow-sm text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Restricted Access</h3>
            <p className="text-sm text-slate-600 mt-2">
              The Super Admin Console is strictly restricted to Super Administrators (shekhardas8@gmail.com).
            </p>
            <button
              onClick={() => setActiveTab('home')}
              className="mt-5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Return to Practice Dashboard
            </button>
          </div>
        )
      )}

      {/* 16. System Health & Diagnostics Panel (Restricted to Super Administrator: shekhardas8@gmail.com) */}
      {(activeTab === 'diagnostics' || activeTab === 'crashlytics' || activeTab === 'bug-scrub') && (
        isSuperAdmin ? (
          <SystemDiagnosticsView
            initialSubTab={activeTab === 'crashlytics' || activeTab === 'bug-scrub' ? 'crashlytics' : 'architecture'}
          />
        ) : (
          <div className="p-8 max-w-xl mx-auto my-12 bg-white rounded-2xl border border-rose-200 shadow-sm text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Restricted Access</h3>
            <p className="text-sm text-slate-600 mt-2">
              System Diagnostics & Observability are strictly restricted to Super Administrators (shekhardas8@gmail.com).
            </p>
            <button
              onClick={() => setActiveTab('home')}
              className="mt-5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Return to Practice Dashboard
            </button>
          </div>
        )
      )}

      {/* 17. Adhoc Requests */}
      {activeTab === 'adhoc-requests' && (
        <AdhocRequestsView onBack={() => setActiveTab('home')} />
      )}

      {/* 18. Pending Tax Radar */}
      {(activeTab === 'pending-tax' || activeTab === 'pending-task') && (
        <Next7DaysPendingTaxView
          onBack={() => setActiveTab('home')}
          onNavigateTab={setActiveTab}
        />
      )}

      {/* 19. Client Portal View inside CA session */}
      {activeTab === 'client-portal' && (
        <ClientPortalView
          initialToken={activePortalToken}
          onBack={() => setActiveTab('home')}
        />
      )}

      {/* 20. Firm Onboarding & Setup Guide */}
      {activeTab === 'guide' && (
        <SetupGuideView onBack={() => setActiveTab('home')} />
      )}

      {/* 21. All Settings Hub (QuinceCA Practice System) */}
      {(activeTab === 'settings' ||
        activeTab === 'settings-profile' ||
        activeTab === 'settings-roles' ||
        activeTab === 'settings-portal' ||
        activeTab === 'settings-whatsapp' ||
        activeTab === 'settings-client-ai') && (
        <AllSettingsView
          key={activeTab}
          onClose={() => setActiveTab('home')}
          firmBranding={firmBranding}
          onUpdateBranding={setFirmBranding}
          onOpenBrandingCustomizer={() => setIsBrandingModalOpen(true)}
          onOpenClientsDirectory={() => setIsClientModalOpen(true)}
          onOpenWhatsAppModal={() => setIsWhatsAppDeviceModalOpen(true)}
          onNavigateTab={tab => setActiveTab(tab)}
          currentUser={authenticatedUser}
          initialSubView={
            activeTab === 'settings-profile'
              ? 'org_profile'
              : activeTab === 'settings-roles'
              ? 'users_roles'
              : activeTab === 'settings-portal'
              ? 'config_portal'
              : activeTab === 'settings-whatsapp'
              ? 'int_whatsapp'
              : activeTab === 'settings-client-ai'
              ? 'int_client_ai'
              : 'grid'
          }
        />
      )}

      {/* Onboard / Edit Client Modal */}
      {isClientModalOpen && (
        <ClientManagementModal
          isOpen={isClientModalOpen}
          onClose={() => setIsClientModalOpen(false)}
          onClientAddedOrUpdated={() => {
            fetchMonthlyRequests();
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('ps_data_updated'));
            }
          }}
        />
      )}

      {/* Staff Review Modal (Admin/Staff only) */}
      {!isClientOnlyMode && selectedRequestForReview && (
        <StaffReviewModal
          request={selectedRequestForReview}
          currentRole={currentRole}
          currentUser={authenticatedUser}
          onClose={() => setSelectedRequestForReview(null)}
          onGenerateWorkbook={handleGenerateWorkbook}
          onRefreshParent={fetchMonthlyRequests}
        />
      )}

      {/* WhatsApp Sender Modal (Admin/Staff only) */}
      {!isClientOnlyMode && whatsappModalData && (
        <WhatsAppSenderModal
          request={whatsappModalData.request}
          actionType={whatsappModalData.actionType}
          onClose={() => setWhatsappModalData(null)}
          onRefreshParent={fetchMonthlyRequests}
          onOpenDeviceLinkModal={() => {
            setWhatsappModalData(null);
            setIsWhatsAppDeviceModalOpen(true);
          }}
        />
      )}

      {/* Open-Source WhatsApp Device Link Modal (Admin/Staff only) */}
      {!isClientOnlyMode && (
        <WhatsAppDeviceLinkModal
          isOpen={isWhatsAppDeviceModalOpen}
          onClose={() => setIsWhatsAppDeviceModalOpen(false)}
        />
      )}

      {/* White-Label Branding Customizer Modal */}
      {isBrandingModalOpen && (
        <BrandingCustomizerModal
          isOpen={isBrandingModalOpen}
          onClose={() => setIsBrandingModalOpen(false)}
          currentBranding={firmBranding}
          onSaveBranding={updated => {
            setFirmBranding(updated);
            saveStoredFirmBranding(updated);
          }}
          onResetBranding={() => {
            const def = resetStoredFirmBranding();
            setFirmBranding(def);
          }}
        />
      )}

      {/* Front-Page Dashboard Customizer Modal */}
      <DashboardCustomizerModal
        isOpen={isDashboardCustomizerOpen}
        onClose={() => setIsDashboardCustomizerOpen(false)}
        preferences={dashboardPreferences}
        onSavePreferences={handleSaveDashboardPreferences}
        onResetPreferences={handleResetDashboardPreferences}
      />
    </PracticeLayout>
  );
}
