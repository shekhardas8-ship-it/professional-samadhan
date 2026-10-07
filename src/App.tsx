// src/App.tsx
import React, { useState, useEffect } from 'react';
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
import { QuickCreateModal } from './components/QuickCreateModal.tsx';
import { SuperAdminView } from './components/SuperAdminView.tsx';
import { AiCopilotDrawer } from './components/AiCopilotDrawer.tsx';
import { WorkflowBuilderView } from './components/WorkflowBuilderView.tsx';
import { NoticesDscView } from './components/NoticesDscView.tsx';
import { DevDiagnosticsView } from './components/DevDiagnosticsView.tsx';
import { GovtEfilingHubView } from './components/GovtEfilingHubView.tsx';
import { MessageSquare, ChevronUp } from 'lucide-react';

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

  // Authentication State
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthUser | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('ps_auth_user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(
    isClientOnlyMode
      ? 'client'
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
  const [activePortalToken, setActivePortalToken] = useState<string | undefined>(
    tokenFromUrl || authenticatedUser?.token || undefined
  );

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
    setAuthenticatedUser(user);
    setCurrentRole(user.role);
    if (user.role === 'client') {
      setActivePortalToken(user.token);
      setActiveTab('client-portal');
    } else {
      setActiveTab('home'); // Zoho Practice styled primary home
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
      alert(`Intake Trigger Complete!\nProcessed: ${data.totalClients} clients for ${data.period?.reportingMonth}.`);
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
      alert(`Workbook v${data.version} successfully generated and snapshot stored in database! Filename: ${data.filename}`);
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

  // 1. Client-Only Standalone Mode
  if (isClientOnlyMode || activeTab === 'client-portal') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
        <Header
          currentRole={currentRole}
          currentUser={authenticatedUser}
          onRoleChange={setCurrentRole}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onRefresh={fetchMonthlyRequests}
          onLogout={handleLogout}
          isLoading={loading}
          isClientOnlyMode={true}
        />
        <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6">
          <ClientPortalView
            initialToken={activePortalToken}
            isStandaloneClient={isClientOnlyMode}
            onBack={isClientOnlyMode ? undefined : () => setActiveTab('home')}
          />
        </main>
      </div>
    );
  }

  // 2. CA Firm Practice OS Layout (Matching attached Zoho Practice design)
  return (
    <div className="min-h-screen bg-[#f4f6fa] flex font-sans text-slate-800 antialiased overflow-x-hidden">
      {/* Left Navigation Sidebar (Zoho Practice style) */}
      <SidebarZoho
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onOpenLiveTour={() => setActiveTab('guide')}
        userRole={currentRole}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Bar */}
        <HeaderZoho
          currentUser={authenticatedUser}
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
          onLogout={handleLogout}
          onRefresh={fetchMonthlyRequests}
          isLoading={loading}
          onOpenQuickCreate={() => setIsQuickCreateOpen(true)}
          onOpenWhatsAppDevice={() => setIsWhatsAppDeviceModalOpen(true)}
          onOpenNotifications={() => setActiveTab('audit-logs')}
          onOpenSettings={() => setActiveTab('super-admin')}
          onSearchQuery={setSearchQuery}
        />

        {/* Dynamic View Body */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto pb-14">
          {/* Zoho Practice Main Dashboard View */}
          {activeTab === 'home' && (
            <ZohoDashboardView
              requests={requests}
              onNavigateTab={setActiveTab}
              onOpenQuickCreate={() => setIsQuickCreateOpen(true)}
              onTriggerSchedule={handleTriggerSchedule}
              isActionLoading={actionLoading}
            />
          )}

          {/* CA Executive Cockpit */}
          {activeTab === 'cockpit' && (
            <CaExecutiveCockpit
              requests={requests}
              onNavigateTab={setActiveTab}
              onTriggerSchedule={handleTriggerSchedule}
              onOpenNewClientModal={() => setIsClientModalOpen(true)}
              onRefreshParent={fetchMonthlyRequests}
              isActionLoading={actionLoading}
            />
          )}

          {/* Client Directory & 360 KYC */}
          {activeTab === 'clients' && (
            <ClientDirectoryKycView
              onBack={() => setActiveTab('home')}
              onOpenClientPortal={handleOpenClientPortal}
              onRefreshParent={fetchMonthlyRequests}
            />
          )}

          {/* Client Requests & Routine Work (GST Intake Pipeline) */}
          {(activeTab === 'client-requests' || activeTab === 'gst-pipeline') && (
            <CaDashboard
              onBack={() => setActiveTab('home')}
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

          {/* Workpaper Engine */}
          {activeTab === 'workpaper' && (
            <CaDashboard
              onBack={() => setActiveTab('home')}
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

          {/* Tasks & Next 7 Days Radar */}
          {(activeTab === 'tasks' || activeTab === 'pending-tax' || activeTab === 'pending-task') && (
            <Next7DaysPendingTaxView
              onBack={() => setActiveTab('home')}
              onNavigateTab={setActiveTab}
            />
          )}

          {/* Time Tracking / Timesheet */}
          {activeTab === 'time-tracking' && (
            <Next7DaysPendingTaxView
              onBack={() => setActiveTab('home')}
              onNavigateTab={setActiveTab}
            />
          )}

          {/* Statutory Compliance Calendar */}
          {activeTab === 'compliance-calendar' && (
            <ComplianceCalendarView onBack={() => setActiveTab('home')} />
          )}

          {/* Government Return E-Filing Hub (GST & ITR) */}
          {activeTab === 'govt-efiling' && (
            <GovtEfilingHubView onBack={() => setActiveTab('home')} />
          )}

          {/* Department Notices & DSC Expiry Management */}
          {activeTab === 'notices-dsc' && (
            <NoticesDscView />
          )}

          {/* Billing & Finance */}
          {activeTab === 'billing-finance' && (
            <BillingFinanceView onBack={() => setActiveTab('home')} />
          )}

          {/* Adhoc Request Service Desk */}
          {activeTab === 'adhoc-requests' && (
            <AdhocRequestsView onBack={() => setActiveTab('home')} />
          )}

          {/* AI CA Copilot */}
          {activeTab === 'ai-copilot' && (
            <div className="max-w-4xl mx-auto">
              <AiCopilotDrawer
                isOpen={true}
                onClose={() => setActiveTab('home')}
                onNavigateTab={setActiveTab}
              />
            </div>
          )}

          {/* Workflow Automation Builder */}
          {activeTab === 'workflow-builder' && (
            <WorkflowBuilderView />
          )}

          {/* Super Admin Console */}
          {activeTab === 'super-admin' && (
            <SuperAdminView />
          )}

          {/* System Diagnostics */}
          {activeTab === 'diagnostics' && (
            <DevDiagnosticsView />
          )}

          {/* Audit Logs */}
          {activeTab === 'audit-logs' && (
            <AuditLogsView onBack={() => setActiveTab('home')} />
          )}

          {/* Setup Guide */}
          {activeTab === 'guide' && (
            <SetupGuideView onBack={() => setActiveTab('home')} />
          )}

          {/* Insights / Reports */}
          {(activeTab === 'insights' || activeTab === 'documents') && (
            <CaExecutiveCockpit
              requests={requests}
              onNavigateTab={setActiveTab}
              onTriggerSchedule={handleTriggerSchedule}
              onOpenNewClientModal={() => setIsClientModalOpen(true)}
              onRefreshParent={fetchMonthlyRequests}
              isActionLoading={actionLoading}
            />
          )}
        </main>

        {/* Bottom Fixed Status Bar (Matching Zoho Screenshot) */}
        <footer className="fixed bottom-0 right-0 left-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 sm:px-6 py-2 flex items-center justify-between text-xs text-slate-500 z-20 shadow-xs">
          <div className="flex items-center gap-4">
            <span className="font-medium text-slate-600">
              Mon to Fri 9:00AM - 7:00PM
            </span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="hidden sm:inline text-slate-500">
              QuinceCA AI Practice Engine v3.0 • Multi-Tenant Enterprise
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('ai-copilot')}
              className="bg-[#1e88e5] hover:bg-[#1976d2] text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat with our experts</span>
            </button>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition"
              title="Back to Top"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </footer>
      </div>

      {/* Quick Create "+" Modal */}
      <QuickCreateModal
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
        onNavigateTab={setActiveTab}
        onOpenNewClientModal={() => setIsClientModalOpen(true)}
      />

      {/* Onboard / Edit Client Modal */}
      {isClientModalOpen && (
        <ClientManagementModal
          isOpen={isClientModalOpen}
          onClose={() => setIsClientModalOpen(false)}
          onClientAddedOrUpdated={fetchMonthlyRequests}
        />
      )}

      {/* Staff Review Modal (Admin/Staff only) */}
      {!isClientOnlyMode && selectedRequestForReview && (
        <StaffReviewModal
          request={selectedRequestForReview}
          currentRole={currentRole}
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
    </div>
  );
}
