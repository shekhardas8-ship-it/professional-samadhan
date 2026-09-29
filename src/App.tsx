// src/App.tsx
import React, { useState, useEffect } from 'react';
import { UserRole, MonthlyRequest, AuthUser } from './types/index.ts';
import { Header } from './components/Header.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import { CaExecutiveCockpit } from './components/CaExecutiveCockpit.tsx';
import { ClientsHubView } from './components/ClientsHubView.tsx';
import { CaDashboard } from './components/CaDashboard.tsx';
import { StaffReviewModal } from './components/StaffReviewModal.tsx';
import { ClientPortalView } from './components/ClientPortalView.tsx';
import { WhatsAppSenderModal } from './components/WhatsAppSenderModal.tsx';
import { AuditLogsView } from './components/AuditLogsView.tsx';
import { SetupGuideView } from './components/SetupGuideView.tsx';
import { ClientManagementModal } from './components/ClientManagementModal.tsx';

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
      : 'cockpit'
  );

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
      setActiveTab('cockpit'); // Always take CA/Staff to the clean Executive Cockpit
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('ps_auth_user');
    setAuthenticatedUser(null);
    setCurrentRole('ca_admin');
    setActiveTab('cockpit');
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

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 relative overflow-x-hidden">
      {/* Professional Samadhan Official Watermark */}
      <div
        className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden select-none"
        aria-hidden="true"
      >
        <div className="relative flex items-center justify-center">
          <img
            src="/logo.jpg"
            alt=""
            className="w-[420px] sm:w-[600px] h-[420px] sm:h-[600px] object-contain opacity-[0.045] filter grayscale contrast-125 rotate-[-12deg]"
          />
        </div>
      </div>

      {/* Navigation Header */}
      <Header
        currentRole={currentRole}
        currentUser={authenticatedUser}
        onRoleChange={role => {
          if (isClientOnlyMode) return;
          setCurrentRole(role);
          if (role === 'client') {
            setActiveTab('client-portal');
          } else if (activeTab === 'client-portal') {
            setActiveTab('cockpit');
          }
        }}
        activeTab={activeTab}
        onTabChange={tab => {
          if (isClientOnlyMode) return;
          setActiveTab(tab);
        }}
        onRefresh={fetchMonthlyRequests}
        onLogout={handleLogout}
        isLoading={loading}
        isClientOnlyMode={isClientOnlyMode}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 relative z-10">
        {isClientOnlyMode ? (
          <ClientPortalView initialToken={activePortalToken} isStandaloneClient={true} />
        ) : (
          <>
            {/* Front Page / Chartered Accountant Executive Cockpit */}
            {activeTab === 'cockpit' && (
              <CaExecutiveCockpit
                requests={requests}
                onNavigateTab={tab => setActiveTab(tab)}
                onTriggerSchedule={handleTriggerSchedule}
                onOpenNewClientModal={() => setIsClientModalOpen(true)}
                onRefreshParent={fetchMonthlyRequests}
                isActionLoading={actionLoading}
              />
            )}

            {/* Dedicated Clients Hub & KYC Directory */}
            {activeTab === 'clients' && (
              <ClientsHubView
                onOpenClientPortal={handleOpenClientPortal}
                onRefreshParent={fetchMonthlyRequests}
              />
            )}

            {/* Detailed GST Filing Pipeline */}
            {activeTab === 'gst-pipeline' && (
              <CaDashboard
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

            {activeTab === 'client-portal' && (
              <ClientPortalView initialToken={activePortalToken} />
            )}

            {activeTab === 'audit-logs' && <AuditLogsView />}

            {activeTab === 'guide' && <SetupGuideView />}
          </>
        )}
      </main>

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
        />
      )}

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-center text-xs text-slate-400 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>Professional Samadhan Chartered Accountants</strong> -{' '}
            {isClientOnlyMode ? 'Statutory Client GST Document Portal' : 'GST Practice Management System'}
          </div>
          <div className="flex items-center space-x-4 text-slate-500">
            <span>{isClientOnlyMode ? '256-Bit Encrypted Client Session' : 'Statutory Audit Working Paper Engine'}</span>
            <span>Version 2.5.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
