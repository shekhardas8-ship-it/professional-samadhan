// src/components/settings/AllSettingsView.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Building2,
  Users,
  Sliders,
  Palette,
  Zap,
  CheckSquare,
  Layers,
  Plug,
  Terminal,
  Search,
  X,
  ChevronRight,
  Shield,
  FileText,
  Mail,
  HardDrive,
  Globe,
  Database,
  Smartphone,
  Save,
  Check,
  AlertCircle,
  Sparkles,
  ExternalLink,
  RefreshCw,
  QrCode,
  Copy,
  FolderSync,
  Lock,
  Plus,
  Trash2,
  SlidersHorizontal,
  ChevronLeft,
} from 'lucide-react';
import { FirmBrandingConfig } from '../../services/brandingService';
import { SettingsSidebar, SettingsSubViewId } from './SettingsSidebar';
import { OrganizationProfileView } from './OrganizationProfileView';
import { RolePermissionsMatrixView } from './RolePermissionsMatrixView';
import { UsersManagementView } from './UsersManagementView';
import { SelfServicePortalSettingsView } from './SelfServicePortalSettingsView';
import { WhatsAppIntegrationView } from './WhatsAppIntegrationView';
import { ClientAiIntegrationView } from './ClientAiIntegrationView';
import { ClientDataManagementView } from './ClientDataManagementView';
import { OrgBranchesView } from './OrgBranchesView';
import { OrgSubscriptionView } from './OrgSubscriptionView';
import { UserPreferencesView } from './UserPreferencesView';
import { CustomCaModulesView } from './CustomCaModulesView';
import { PdfAuditTemplatesView } from './PdfAuditTemplatesView';
import { AccountingIntegrationView } from './AccountingIntegrationView';
import { OtherAppsIntegrationView } from './OtherAppsIntegrationView';
import { DelugeLogicStudioView } from './DelugeLogicStudioView';
import { WebFormsIntakeView } from './WebFormsIntakeView';
import { ChartOfAccountsMappingView } from './ChartOfAccountsMappingView';

export interface AllSettingsViewProps {
  onClose: () => void;
  firmBranding: FirmBrandingConfig;
  onUpdateBranding?: (b: FirmBrandingConfig) => void;
  onOpenBrandingCustomizer?: () => void;
  onOpenClientsDirectory?: () => void;
  onOpenWhatsAppModal?: () => void;
  onNavigateTab?: (tab: string) => void;
  currentUser?: any;
  initialSubView?: SettingsSubViewId;
}

interface SettingOption {
  id: SettingsSubViewId;
  name: string;
  badge?: string;
  description: string;
  keywords?: string[];
  actionType: 'subview' | 'modal' | 'tab' | 'dialog';
  targetModal?: 'branding' | 'clients' | 'whatsapp';
  targetTab?: string;
  dialogConfig?: {
    title: string;
    description: string;
    type: string;
  };
}

interface SettingCard {
  id: string;
  title: string;
  icon: any;
  colorScheme: {
    iconBg: string;
    iconText: string;
    badgeBg: string;
    badgeText: string;
    hoverBorder: string;
  };
  options: SettingOption[];
}

interface SettingSection {
  id: string;
  title: string;
  cards: SettingCard[];
}

export const AllSettingsView: React.FC<AllSettingsViewProps> = ({
  onClose,
  firmBranding,
  onUpdateBranding,
  onOpenBrandingCustomizer,
  onOpenClientsDirectory,
  onOpenWhatsAppModal,
  onNavigateTab,
  currentUser,
  initialSubView = 'grid',
}) => {
  // Current active subview: 'grid' for full card overview, or specific detail view
  const [activeViewId, setActiveViewId] = useState<SettingsSubViewId>(initialSubView);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDialogSetting, setActiveDialogSetting] = useState<SettingOption | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Synchronize active subview if prop changes (e.g. from top user navigation menu)
  useEffect(() => {
    if (initialSubView) {
      setActiveViewId(initialSubView);
    }
  }, [initialSubView]);

  // Keyboard shortcut '/' to focus search input, and 'Escape' to close/back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        activeViewId === 'grid' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (activeDialogSetting) {
          setActiveDialogSetting(null);
        } else if (activeViewId !== 'grid') {
          setActiveViewId('grid');
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDialogSetting, activeViewId, onClose]);

  // Full Settings Structure for QuinceCA Practice OS
  const settingsSections: SettingSection[] = [
    {
      id: 'org_settings',
      title: 'Organization Settings',
      cards: [
        {
          id: 'organization',
          title: 'Organization',
          icon: Building2,
          colorScheme: {
            iconBg: 'bg-emerald-50 text-emerald-600',
            iconText: 'text-emerald-700',
            badgeBg: 'bg-emerald-100',
            badgeText: 'text-emerald-800',
            hoverBorder: 'hover:border-emerald-300',
          },
          options: [
            {
              id: 'org_profile',
              name: 'Profile',
              description: 'ICAI Firm Registration (FRN), Head Office address, and Managing Partner details',
              keywords: ['profile', 'frn', 'icai', 'address', 'managing partner', 'firm name'],
              actionType: 'subview',
            },
            {
              id: 'org_branding',
              name: 'Branding',
              description: 'Custom firm logo, dual-tone brand name, watermark, and accent colors',
              keywords: ['branding', 'logo', 'theme', 'color', 'whitelabel', 'brand'],
              actionType: 'modal',
              targetModal: 'branding',
            },
            {
              id: 'org_branches',
              name: 'Branches',
              description: 'Multi-city branch offices, jurisdictional circles, and branch partner allocations',
              keywords: ['branches', 'offices', 'mumbai', 'delhi', 'bengaluru', 'locations'],
              actionType: 'subview',
              dialogConfig: {
                title: 'Branch Offices & Regional Jurisdiction',
                description: 'Configure practice locations across multiple GST circles and state tax offices.',
                type: 'branches',
              },
            },
            {
              id: 'org_ai',
              name: 'AI Integration',
              badge: 'Multi-Model',
              description: 'Multi-provider AI integration (Gemini, GPT-4o, Claude, DeepSeek, Ollama), client model selection, and BYOK credentials',
              keywords: ['ai', 'gemini', 'openai', 'claude', 'deepseek', 'ollama', 'ocr', 'copilot', 'byok', 'models'],
              actionType: 'subview',
            },
            {
              id: 'org_subscription',
              name: 'Manage Subscription',
              badge: firmBranding.planName || 'Enterprise',
              description: 'Active practice SaaS plan, quota limits, GST invoices, and license renewal',
              keywords: ['subscription', 'plan', 'billing', 'license', 'enterprise', 'upgrade'],
              actionType: 'subview',
              dialogConfig: {
                title: 'Practice Subscription & SaaS Quotas',
                description: 'Review active license entitlements, high-volume WhatsApp allowances, and storage limits.',
                type: 'subscription',
              },
            },
          ],
        },
        {
          id: 'users_roles',
          title: 'Users & Roles',
          icon: Users,
          colorScheme: {
            iconBg: 'bg-rose-50 text-rose-600',
            iconText: 'text-rose-700',
            badgeBg: 'bg-rose-100',
            badgeText: 'text-rose-800',
            hoverBorder: 'hover:border-rose-300',
          },
          options: [
            {
              id: 'users_list',
              name: 'Users',
              description: 'CA Partners, Senior Associates, Article Clerks, and Staff Accounts',
              keywords: ['users', 'staff', 'partners', 'article clerk', 'employees'],
              actionType: 'subview',
            },
            {
              id: 'users_roles',
              name: 'Roles',
              badge: 'Access Matrix',
              description: 'Segmented access control matrix, filing sign-off approvals, and client assignment rules',
              keywords: ['roles', 'permissions', 'admin', 'partner', 'associate', 'access', 'segmented'],
              actionType: 'subview',
            },
            {
              id: 'user_preferences',
              name: 'User Preferences',
              description: 'Date format (DD/MM/YYYY), Indian Financial Year calendar, and alert sounds',
              keywords: ['preferences', 'date format', 'calendar', 'notifications', 'theme'],
              actionType: 'subview',
              dialogConfig: {
                title: 'Personal CA User Preferences',
                description: 'Customize locale, currency format (₹ INR), fiscal year view, and UI preferences.',
                type: 'preferences',
              },
            },
          ],
        },
        {
          id: 'setup_config',
          title: 'Setup & Configurations',
          icon: Sliders,
          colorScheme: {
            iconBg: 'bg-amber-50 text-amber-600',
            iconText: 'text-amber-700',
            badgeBg: 'bg-amber-100',
            badgeText: 'text-amber-800',
            hoverBorder: 'hover:border-amber-300',
          },
          options: [
            {
              id: 'config_clients',
              name: 'Clients',
              description: 'Client businesses directory, GSTIN validations, and WhatsApp opt-in consents',
              keywords: ['clients', 'directory', 'kyc', 'gstin', 'businesses'],
              actionType: 'modal',
              targetModal: 'clients',
            },
            {
              id: 'config_requests',
              name: 'Client Requests',
              description: 'Monthly intake periods, auto-request triggers, and reminder cadence rules',
              keywords: ['requests', 'intake', 'monthly', 'reminders', 'cadence', 'gst'],
              actionType: 'tab',
              targetTab: 'client-requests',
            },
            {
              id: 'config_portal',
              name: 'Self Service Portal',
              badge: 'Client Web Link',
              description: 'White-labeled statutory upload portal URL, OTP verification, and checklist mandates',
              keywords: ['portal', 'self service', 'upload link', 'client portal', 'magic link'],
              actionType: 'subview',
            },
            {
              id: 'config_chart_accounts',
              name: 'Chart of Accounts',
              description: 'Standard Schedule III Indian CA ledgers, GST tax groups, and Tally mapping',
              keywords: ['chart of accounts', 'ledgers', 'tally', 'schedule iii', 'tax groups'],
              actionType: 'dialog',
              dialogConfig: {
                title: 'Chart of Accounts & GST Ledger Mapping',
                description: 'Map extracted invoices and bank statements to standard Indian accounting ledgers.',
                type: 'chart_accounts',
              },
            },
          ],
        },
        {
          id: 'customization',
          title: 'Customization',
          icon: Palette,
          colorScheme: {
            iconBg: 'bg-orange-50 text-orange-600',
            iconText: 'text-orange-700',
            badgeBg: 'bg-orange-100',
            badgeText: 'text-orange-800',
            hoverBorder: 'hover:border-orange-300',
          },
          options: [
            {
              id: 'custom_pdf',
              name: 'PDF Templates',
              description: 'Executive GST summary layout, firm letterhead seal, and CA digital signature block',
              keywords: ['pdf', 'templates', 'letterhead', 'seal', 'report', 'summary'],
              actionType: 'subview',
              dialogConfig: {
                title: 'PDF Dossier & Audit Report Templates',
                description: 'Configure statutory report header, firm seal watermark, and compliance signature disclaimers.',
                type: 'pdf_templates',
              },
            },
            {
              id: 'custom_email',
              name: 'Email Notifications',
              description: 'Automated SMTP server, client document intake emails, and statutory alert copy',
              keywords: ['email', 'smtp', 'notifications', 'intake email', 'alerts'],
              actionType: 'dialog',
              dialogConfig: {
                title: 'Email Notifications & SMTP Credentials',
                description: 'Set up firm SMTP relay and customize automated compliance reminder emails.',
                type: 'email_templates',
              },
            },
          ],
        },
        {
          id: 'automation',
          title: 'Automation',
          icon: Zap,
          colorScheme: {
            iconBg: 'bg-red-50 text-red-600',
            iconText: 'text-red-700',
            badgeBg: 'bg-red-100',
            badgeText: 'text-red-800',
            hoverBorder: 'hover:border-red-300',
          },
          options: [
            {
              id: 'auto_rules',
              name: 'Workflow Rules',
              description: 'Trigger rules (1st of month intake dispatch, overdue escalation after 15th)',
              keywords: ['workflow rules', 'rules', 'triggers', 'automation', 'escalation'],
              actionType: 'tab',
              targetTab: 'automation',
            },
            {
              id: 'auto_actions',
              name: 'Workflow Actions',
              description: 'WhatsApp template dispatches, SMS nudges, portal lock, and auto-reconciliation',
              keywords: ['actions', 'whatsapp', 'sms', 'reconcile', 'workflow actions'],
              actionType: 'dialog',
              dialogConfig: {
                title: 'Automated Workflow Action Pipeline',
                description: 'Define automated actions taken when clients upload documents or miss filing deadlines.',
                type: 'workflow_actions',
              },
            },
            {
              id: 'auto_logs',
              name: 'Workflow Logs',
              description: 'Audit execution trail of background automations, dispatches, and trigger history',
              keywords: ['logs', 'audit', 'execution', 'history', 'workflow logs'],
              actionType: 'tab',
              targetTab: 'reports',
            },
            {
              id: 'auto_schedules',
              name: 'Schedules',
              badge: 'Cron Active',
              description: 'Automated scheduler timers (09:00 AM monthly dispatches, 3-day reminder interval)',
              keywords: ['schedules', 'cron', 'timers', 'intervals', 'cadence'],
              actionType: 'dialog',
              dialogConfig: {
                title: 'Statutory Scheduler & Cron Timing Engine',
                description: 'Configure automated background timers for client intake and reminder dispatches.',
                type: 'schedules',
              },
            },
          ],
        },
      ],
    },
    {
      id: 'module_settings',
      title: 'Module Settings',
      cards: [
        {
          id: 'general_module',
          title: 'General',
          icon: CheckSquare,
          colorScheme: {
            iconBg: 'bg-teal-50 text-teal-600',
            iconText: 'text-teal-700',
            badgeBg: 'bg-teal-100',
            badgeText: 'text-teal-800',
            hoverBorder: 'hover:border-teal-300',
          },
          options: [
            {
              id: 'mod_tasks',
              name: 'Tasks',
              description: 'Staff task priorities, SLA turnaround targets (48h), and checklist dependencies',
              keywords: ['tasks', 'sla', 'priorities', 'checklist', 'assignments'],
              actionType: 'tab',
              targetTab: 'tasks',
            },
          ],
        },
        {
          id: 'custom_modules',
          title: 'Custom Modules',
          icon: Layers,
          colorScheme: {
            iconBg: 'bg-indigo-50 text-indigo-600',
            iconText: 'text-indigo-700',
            badgeBg: 'bg-indigo-100',
            badgeText: 'text-indigo-800',
            hoverBorder: 'hover:border-indigo-300',
          },
          options: [
            {
              id: 'mod_overview',
              name: 'Overview',
              badge: 'ROC & MCA',
              description: 'Custom practice trackers for ROC/MCA annual filings, DIN tracking, and Tax litigation',
              keywords: ['custom modules', 'overview', 'roc', 'mca', 'litigation', 'notices'],
              actionType: 'subview',
              dialogConfig: {
                title: 'Custom CA Modules & Statutory Trackers',
                description: 'Enable or configure practice-specific modules for ROC Filings, DSC tracking, and Litigation.',
                type: 'custom_modules_overview',
              },
            },
          ],
        },
      ],
    },
    {
      id: 'extension_developer_settings',
      title: 'Extension and Developer Data',
      cards: [
        {
          id: 'integrations',
          title: 'Integrations',
          icon: Plug,
          colorScheme: {
            iconBg: 'bg-emerald-50 text-emerald-600',
            iconText: 'text-emerald-700',
            badgeBg: 'bg-emerald-100',
            badgeText: 'text-emerald-800',
            hoverBorder: 'hover:border-emerald-300',
          },
          options: [
            {
              id: 'int_client_ai',
              name: 'Client AI Copilot',
              badge: 'Gemini 2.5',
              description: 'Client-facing conversational tax assistant, invoice quality scanner, and WhatsApp automated replies',
              keywords: ['client ai', 'copilot', 'ai', 'gemini', 'scanner', 'whatsapp ai', 'assistant'],
              actionType: 'subview',
            },
            {
              id: 'int_whatsapp',
              name: 'WhatsApp',
              badge: 'Baileys Active',
              description: 'Official WhatsApp Business messaging, document intake links, and automated templates',
              keywords: ['whatsapp', 'baileys', 'qr code', 'device', 'pairing', 'messages'],
              actionType: 'subview',
            },
            {
              id: 'int_accounting',
              name: 'Accounting',
              badge: 'Tally Prime',
              description: 'Tally Prime XML live sync, Busy Accounting bridge, and QuickBooks ledger export',
              keywords: ['accounting', 'tally', 'busy', 'quickbooks', 'tally prime', 'xml'],
              actionType: 'subview',
            },
            {
              id: 'int_other',
              name: 'Other Apps',
              badge: 'Google Drive',
              description: 'Google Drive cloud storage, DigiLocker KYC, AWS S3 permanent vault, and SMS gateways',
              keywords: ['google drive', 'digilocker', 'aws s3', 'cloud storage', 'fast2sms'],
              actionType: 'subview',
            },
          ],
        },
        {
          id: 'developer_data',
          title: 'Developer Data',
          icon: Terminal,
          colorScheme: {
            iconBg: 'bg-amber-50 text-amber-600',
            iconText: 'text-amber-700',
            badgeBg: 'bg-amber-100',
            badgeText: 'text-amber-800',
            hoverBorder: 'hover:border-amber-300',
          },
          options: [
            {
              id: 'dev_data_mgmt',
              name: 'Data Management',
              badge: 'Client Cloud Sync',
              description: 'Neon PostgreSQL cloud backup, per-client data retention locks, storage purge, and database snapshots',
              keywords: ['data management', 'backup', 'restore', 'neon', 'postgresql', 'purge', 'client data', 'retention'],
              actionType: 'subview',
            },
            {
              id: 'dev_deluge',
              name: 'Deluge Usage',
              badge: 'Automation Scripts',
              description: 'Custom automation script triggers, webhook endpoints, and API quota usage telemetry',
              keywords: ['deluge', 'scripts', 'webhooks', 'api usage', 'developer', 'telemetry'],
              actionType: 'subview',
            },
            {
              id: 'dev_webforms',
              name: 'Web Forms',
              badge: 'Public KYC Link',
              description: 'Instant client self-onboarding web forms, document intake link generator, and QR codes',
              keywords: ['web forms', 'kyc form', 'onboarding', 'intake link', 'qr code'],
              actionType: 'subview',
            },
          ],
        },
      ],
    },
  ];

  // Search Filter Logic for Overview Grid
  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return settingsSections;

    return settingsSections
      .map(section => {
        const matchingCards = section.cards
          .map(card => {
            const matchesCardTitle = card.title.toLowerCase().includes(q);
            const filteredOptions = card.options.filter(opt => {
              const nameMatch = opt.name.toLowerCase().includes(q);
              const descMatch = opt.description.toLowerCase().includes(q);
              const keywordMatch = opt.keywords?.some(k => k.toLowerCase().includes(q));
              return nameMatch || descMatch || keywordMatch || matchesCardTitle;
            });

            if (filteredOptions.length > 0 || matchesCardTitle) {
              return {
                ...card,
                options: filteredOptions.length > 0 ? filteredOptions : card.options,
              };
            }
            return null;
          })
          .filter(Boolean) as SettingCard[];

        if (matchingCards.length > 0) {
          return {
            ...section,
            cards: matchingCards,
          };
        }
        return null;
      })
      .filter(Boolean) as SettingSection[];
  }, [searchQuery, settingsSections]);

  const handleOptionClick = (option: SettingOption) => {
    if (option.actionType === 'subview') {
      setActiveViewId(option.id);
    } else if (option.actionType === 'modal') {
      if (option.targetModal === 'branding' && onOpenBrandingCustomizer) {
        onOpenBrandingCustomizer();
      } else if (option.targetModal === 'clients' && onOpenClientsDirectory) {
        onOpenClientsDirectory();
      } else if (option.targetModal === 'whatsapp' && onOpenWhatsAppModal) {
        onOpenWhatsAppModal();
      }
    } else if (option.actionType === 'tab' && onNavigateTab && option.targetTab) {
      onNavigateTab(option.targetTab);
    } else if (option.actionType === 'dialog') {
      setActiveDialogSetting(option);
    }
  };

  const handleSidebarSelect = (viewId: SettingsSubViewId) => {
    if (viewId === 'org_branding' && onOpenBrandingCustomizer) {
      onOpenBrandingCustomizer();
      return;
    }
    if (viewId === 'config_clients' && onOpenClientsDirectory) {
      onOpenClientsDirectory();
      return;
    }
    if (viewId === 'config_requests' && onNavigateTab) {
      onNavigateTab('client-requests');
      return;
    }
    if (viewId === 'mod_tasks' && onNavigateTab) {
      onNavigateTab('tasks');
      return;
    }
    if (viewId === 'auto_rules' && onNavigateTab) {
      onNavigateTab('automation');
      return;
    }
    if (viewId === 'auto_logs' && onNavigateTab) {
      onNavigateTab('reports');
      return;
    }

    setActiveViewId(viewId);
  };

  const handleSaveSuccess = (message: string) => {
    setSaveSuccessNotice(message);
    setActiveDialogSetting(null);
    setTimeout(() => setSaveSuccessNotice(null), 4000);
  };

  // =========================================================================
  // RENDER TWO-PANE VIEW IF SUBVIEW IS ACTIVE
  // =========================================================================
  if (activeViewId !== 'grid') {
    return (
      <div className="flex min-h-screen bg-[#f4f6f9] text-slate-800 -m-4 sm:-m-6 lg:-m-8 animate-in fade-in duration-150">
        {/* Left Sidebar */}
        <SettingsSidebar
          activeViewId={activeViewId}
          onSelectView={handleSidebarSelect}
          onBackToGrid={() => setActiveViewId('grid')}
          firmBranding={firmBranding}
          currentUser={currentUser}
        />

        {/* Right Main Content Pane */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {/* Organization Profile Subview (Exact Screenshot 2) */}
          {activeViewId === 'org_profile' && (
            <OrganizationProfileView
              firmBranding={firmBranding}
              onUpdateBranding={onUpdateBranding}
              currentUser={currentUser}
              onSavedNotification={handleSaveSuccess}
            />
          )}

          {/* Roles & Permissions Matrix Subview (Exact Screenshot 3) */}
          {activeViewId === 'users_roles' && (
            <RolePermissionsMatrixView
              onBackToRolesList={() => setActiveViewId('users_roles')}
              onSavedNotification={handleSaveSuccess}
            />
          )}

          {/* Users List Subview */}
          {activeViewId === 'users_list' && <UsersManagementView />}

          {/* Self Service Portal Subview (Exact Screenshot) */}
          {activeViewId === 'config_portal' && (
            <SelfServicePortalSettingsView
              firmBranding={firmBranding}
              currentUser={currentUser}
              onSavedNotification={handleSaveSuccess}
              onClose={onClose}
            />
          )}

          {/* WhatsApp Integration Subview (Exact Screenshot) */}
          {activeViewId === 'int_whatsapp' && (
            <WhatsAppIntegrationView
              firmBranding={firmBranding}
              onOpenWhatsAppModal={onOpenWhatsAppModal}
              onSavedNotification={handleSaveSuccess}
              onClose={onClose}
            />
          )}

          {/* AI Integration & Client Model Orchestration Subview */}
          {(activeViewId === 'int_client_ai' || activeViewId === 'org_ai') && (
            <ClientAiIntegrationView
              firmBranding={firmBranding}
              currentUser={currentUser}
              onSavedNotification={handleSaveSuccess}
              onClose={onClose}
            />
          )}

          {/* Client Data Management Subview */}
          {activeViewId === 'dev_data_mgmt' && (
            <ClientDataManagementView
              firmBranding={firmBranding}
              currentUser={currentUser}
              onSavedNotification={handleSaveSuccess}
              onClose={() => setActiveViewId('grid')}
            />
          )}

          {/* Org Branches Subview */}
          {activeViewId === 'org_branches' && (
            <OrgBranchesView
              firmBranding={firmBranding}
              currentUser={currentUser}
              onSavedNotification={handleSaveSuccess}
              onClose={() => setActiveViewId('grid')}
            />
          )}

          {/* Org Subscription Subview */}
          {activeViewId === 'org_subscription' && (
            <OrgSubscriptionView
              firmBranding={firmBranding}
              currentUser={currentUser}
              onSavedNotification={handleSaveSuccess}
              onClose={() => setActiveViewId('grid')}
            />
          )}

          {/* User Preferences Subview */}
          {activeViewId === 'user_preferences' && (
            <UserPreferencesView
              firmBranding={firmBranding}
              currentUser={currentUser}
              onSavedNotification={handleSaveSuccess}
              onClose={() => setActiveViewId('grid')}
            />
          )}

          {/* Custom CA Modules & Statutory Trackers Subview */}
          {activeViewId === 'mod_overview' && (
            <CustomCaModulesView
              firmBranding={firmBranding}
              currentUser={currentUser}
              onSavedNotification={handleSaveSuccess}
              onClose={() => setActiveViewId('grid')}
            />
          )}

          {/* PDF Dossier & Audit Report Templates Subview */}
          {activeViewId === 'custom_pdf' && (
            <PdfAuditTemplatesView
              firmBranding={firmBranding}
              currentUser={currentUser}
              onSavedNotification={handleSaveSuccess}
              onClose={() => setActiveViewId('grid')}
            />
          )}

          {/* Accounting & ERP Bridges Subview */}
          {activeViewId === 'int_accounting' && (
            <AccountingIntegrationView
              firmBranding={firmBranding}
              currentUser={currentUser}
              onSavedNotification={handleSaveSuccess}
              onClose={() => setActiveViewId('grid')}
            />
          )}

          {/* Other Apps & Cloud Storage Subview */}
          {activeViewId === 'int_other' && (
            <OtherAppsIntegrationView
              firmBranding={firmBranding}
              currentUser={currentUser}
              onSavedNotification={handleSaveSuccess}
              onClose={() => setActiveViewId('grid')}
            />
          )}

          {/* Deluge Logic Studio & Automations Subview */}
          {activeViewId === 'dev_deluge' && (
            <DelugeLogicStudioView
              firmBranding={firmBranding}
              currentUser={currentUser}
              onSavedNotification={handleSaveSuccess}
              onClose={() => setActiveViewId('grid')}
            />
          )}

          {/* Web Forms & Client Intake Portal Subview */}
          {activeViewId === 'dev_webforms' && (
            <WebFormsIntakeView
              firmBranding={firmBranding}
              currentUser={currentUser}
              onSavedNotification={handleSaveSuccess}
              onClose={() => setActiveViewId('grid')}
            />
          )}

          {/* Chart of Accounts & GST Ledger Mapping Subview */}
          {activeViewId === 'config_chart_accounts' && (
            <ChartOfAccountsMappingView
              firmBranding={firmBranding}
              currentUser={currentUser}
              onSavedNotification={handleSaveSuccess}
              isDialogMode={false}
            />
          )}

          {/* Fallback for other subviews: show detail panel */}
          {activeViewId !== 'org_profile' &&
            activeViewId !== 'org_branches' &&
            activeViewId !== 'org_subscription' &&
            activeViewId !== 'user_preferences' &&
            activeViewId !== 'mod_overview' &&
            activeViewId !== 'custom_pdf' &&
            activeViewId !== 'int_accounting' &&
            activeViewId !== 'int_other' &&
            activeViewId !== 'dev_deluge' &&
            activeViewId !== 'dev_webforms' &&
            activeViewId !== 'config_chart_accounts' &&
            activeViewId !== 'users_roles' &&
            activeViewId !== 'users_list' &&
            activeViewId !== 'config_portal' &&
            activeViewId !== 'int_whatsapp' &&
            activeViewId !== 'int_client_ai' &&
            activeViewId !== 'org_ai' &&
            activeViewId !== 'dev_data_mgmt' && (
              <div className="p-8 max-w-4xl space-y-6">
                <div className="pb-4 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 capitalize">
                      {activeViewId.replace(/_/g, ' ')}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Configure parameters for this module. Changes persist to practice settings.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveViewId('grid')}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg transition"
                  >
                    Back to All Settings
                  </button>
                </div>

                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                  <div className="flex items-center space-x-2 text-emerald-700">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    <span className="font-bold text-sm">Active & Configured</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    This module is active in your QuinceCA {firmBranding.planName || 'Enterprise'} subscription.
                    Settings are synchronized across all CA firm workstations.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => handleSaveSuccess('Configuration updated successfully.')}
                      className="px-4 py-2 bg-[#00c073] hover:bg-[#00ab66] text-white text-xs font-semibold rounded-lg shadow-xs"
                    >
                      Save Configuration
                    </button>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER ALL SETTINGS OVERVIEW GRID (WHEN activeViewId === 'grid')
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#f4f6f9] text-slate-800 -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="max-w-[1400px] mx-auto pb-6 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Left: App Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <span>All Settings</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                {firmBranding.planName || 'Enterprise'}
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {firmBranding.firmName} • {currentUser?.displayName || 'CA Suraj Dutta (FCA)'}
            </p>
          </div>
        </div>

        {/* Center: Search Settings Input with Hotkey shortcut */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search settings ( / )"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-10 py-2 text-xs border border-slate-200 rounded-xl bg-white shadow-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-hidden transition"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="absolute right-3 top-2.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 border border-slate-200 rounded-sm">
              /
            </kbd>
          )}
        </div>

        {/* Right: Quick Links & Close Settings Button */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setActiveViewId('org_profile')}
            className="px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-xl border border-emerald-200 transition cursor-pointer shadow-2xs"
          >
            Organization Profile
          </button>
          <button
            onClick={() => setActiveViewId('users_roles')}
            className="px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 rounded-xl border border-blue-200 transition cursor-pointer shadow-2xs"
          >
            Roles & Matrix
          </button>
          <button
            onClick={() => setActiveViewId('config_portal')}
            className="px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50 rounded-xl border border-teal-200 transition cursor-pointer shadow-2xs"
          >
            Portal
          </button>
          <button
            onClick={() => setActiveViewId('int_whatsapp')}
            className="px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-xl border border-emerald-200 transition cursor-pointer shadow-2xs"
          >
            WhatsApp
          </button>
          <button
            onClick={() => setActiveViewId('int_client_ai')}
            className="px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 rounded-xl border border-indigo-200 transition cursor-pointer shadow-2xs"
          >
            Client AI
          </button>
          <button
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-200 transition inline-flex items-center space-x-1.5 cursor-pointer shadow-2xs"
          >
            <span>Close Settings</span>
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Global Success Notification Toast */}
      {saveSuccessNotice && (
        <div className="max-w-[1400px] mx-auto mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between shadow-sm animate-in slide-in-from-top-2">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{saveSuccessNotice}</span>
          </div>
          <button onClick={() => setSaveSuccessNotice(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Settings Sections & Cards Grid */}
      <div className="max-w-[1400px] mx-auto py-8 space-y-10">
        {filteredSections.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs max-w-md mx-auto">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No settings found</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              We couldn't find any settings matching "{searchQuery}".
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
            >
              Clear Search Query
            </button>
          </div>
        ) : (
          filteredSections.map(section => (
            <div key={section.id} className="space-y-4">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider px-1">
                {section.title}
              </h2>

              <div
                className={`grid gap-4 ${
                  section.id === 'org_settings'
                    ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
                    : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4'
                }`}
              >
                {section.cards.map(card => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.id}
                      className={`bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 flex flex-col transition duration-150 ${card.colorScheme.hoverBorder} hover:shadow-sm`}
                    >
                      <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100 mb-3">
                        <div className={`p-1.5 rounded-lg ${card.colorScheme.iconBg}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <h3 className={`text-xs font-bold ${card.colorScheme.iconText}`}>
                          {card.title}
                        </h3>
                      </div>

                      <div className="space-y-1 flex-1">
                        {card.options.map(option => (
                          <button
                            key={option.id}
                            onClick={() => handleOptionClick(option)}
                            className="w-full text-left py-2 px-2.5 rounded-xl hover:bg-slate-50 transition group flex items-center justify-between text-xs text-slate-700 hover:text-slate-900 cursor-pointer"
                            title={option.description}
                          >
                            <span className="font-medium group-hover:text-emerald-700 transition">
                              {option.name}
                            </span>
                            <div className="flex items-center space-x-1.5 shrink-0">
                              {option.badge && (
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${card.colorScheme.badgeBg} ${card.colorScheme.badgeText}`}
                                >
                                  {option.badge}
                                </span>
                              )}
                              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Interactive Detail Dialog for Generic or Modal dialogs */}
      {activeDialogSetting && (
        <SettingDetailDialog
          option={activeDialogSetting}
          firmBranding={firmBranding}
          onClose={() => setActiveDialogSetting(null)}
          onSave={handleSaveSuccess}
        />
      )}
    </div>
  );
};

// ============================================================================
// MODAL / DIALOG COMPONENT FOR ACTIVE SETTING CONFIGURATION
// ============================================================================
interface SettingDetailDialogProps {
  option: SettingOption;
  firmBranding: FirmBrandingConfig;
  onClose: () => void;
  onSave: (msg: string) => void;
}

const SettingDetailDialog: React.FC<SettingDetailDialogProps> = ({
  option,
  firmBranding,
  onClose,
  onSave,
}) => {
  const dialogType = option.dialogConfig?.type || 'generic';

  const [aiConfig, setAiConfig] = useState({
    activeModel: 'gemini-2.5-pro',
    ocrConfidenceMin: 92,
    autoReconcile: true,
    legalCopilotEnabled: true,
    threeWayMatchStrict: true,
  });

  const [portalConfig, setPortalConfig] = useState({
    customDomain: firmBranding.customDomain || 'app.quinceca.com',
    portalTitle: firmBranding.portalTitle || 'QuinceCA • Client GST Portal',
    otpRequired: true,
    expiryDays: 30,
    allowDirectPdfUpload: true,
    allowExcelUpload: true,
  });

  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyPublicLink = () => {
    navigator.clipboard.writeText(`https://${portalConfig.customDomain}/portal/intake`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {option.dialogConfig?.title || option.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {option.dialogConfig?.description || option.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {dialogType === 'ai_integration' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Google Gemini 2.5 Pro Vision engine is actively processing GSTR-2B, purchase invoices, and bank statements.</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Active Reasoning Model</label>
                  <select
                    value={aiConfig.activeModel}
                    onChange={e => setAiConfig({ ...aiConfig, activeModel: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                  >
                    <option value="gemini-2.5-pro">Google Gemini 2.5 Pro (High Precision Statutory Reasoning)</option>
                    <option value="gemini-2.5-flash">Google Gemini 2.5 Flash (Ultra Fast Intake OCR)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Minimum OCR Confidence Threshold ({aiConfig.ocrConfidenceMin}%)
                  </label>
                  <input
                    type="range"
                    min="70"
                    max="99"
                    value={aiConfig.ocrConfidenceMin}
                    onChange={e => setAiConfig({ ...aiConfig, ocrConfidenceMin: Number(e.target.value) })}
                    className="w-full accent-emerald-600"
                  />
                  <span className="text-[10px] text-slate-400">Values below this threshold will flag invoices for manual staff review.</span>
                </div>
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aiConfig.autoReconcile}
                      onChange={e => setAiConfig({ ...aiConfig, autoReconcile: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Automatically execute 3-Way Match (GSTR-2B vs Books vs Bank Statements) on upload</span>
                  </label>
                  <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aiConfig.legalCopilotEnabled}
                      onChange={e => setAiConfig({ ...aiConfig, legalCopilotEnabled: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Enable AI CA Copilot statutory citation references (CGST Act Sections 16, 38, 39)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {dialogType === 'portal' && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Custom Portal Subdomain</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 text-slate-500 text-xs">
                    https://
                  </span>
                  <input
                    type="text"
                    value={portalConfig.customDomain}
                    onChange={e => setPortalConfig({ ...portalConfig, customDomain: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-r-lg text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Portal Display Title</label>
                <input
                  type="text"
                  value={portalConfig.portalTitle}
                  onChange={e => setPortalConfig({ ...portalConfig, portalTitle: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={portalConfig.otpRequired}
                    onChange={e => setPortalConfig({ ...portalConfig, otpRequired: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Enforce WhatsApp / SMS OTP before client can upload confidential financial records</span>
                </label>
                <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={portalConfig.allowDirectPdfUpload}
                    onChange={e => setPortalConfig({ ...portalConfig, allowDirectPdfUpload: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Accept Password-Protected Bank Statement PDFs (AI will auto-prompt for password)</span>
                </label>
              </div>
            </div>
          )}

          {dialogType === 'web_forms' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Public Client KYC & Intake Link</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                    Live
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={`https://${portalConfig.customDomain}/portal/intake`}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono text-xs text-slate-600"
                  />
                  <button
                    onClick={handleCopyPublicLink}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shrink-0 flex items-center space-x-1"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Send this link to new clients via WhatsApp or email. They can submit business GSTIN, PAN, and KYC docs directly into your pipeline.
                </p>
              </div>
            </div>
          )}

          {dialogType === 'data_management' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-slate-500 text-[11px]">Primary Database</span>
                  <div className="font-bold text-slate-800 mt-1 flex items-center space-x-1.5">
                    <Database className="w-4 h-4 text-emerald-600" />
                    <span>Neon PostgreSQL</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold">Connected (SSL Active)</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-slate-500 text-[11px]">Disk Cache Guard</span>
                  <div className="font-bold text-slate-800 mt-1 flex items-center space-x-1.5">
                    <HardDrive className="w-4 h-4 text-blue-600" />
                    <span>Auto-Prune &gt;80%</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Threshold: 150 MB</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                All client working papers, parsed invoices, and director documents are stored with foreign key constraints in Neon PostgreSQL. Local cache files are automatically purged when storage exceeds limits.
              </p>
            </div>
          )}

          {dialogType === 'branches' && (
            <OrgBranchesView
              firmBranding={firmBranding}
              onSavedNotification={msg => onSave(msg)}
              isDialogMode={true}
            />
          )}

          {dialogType === 'subscription' && (
            <OrgSubscriptionView
              firmBranding={firmBranding}
              onSavedNotification={msg => onSave(msg)}
              isDialogMode={true}
            />
          )}

          {dialogType === 'preferences' && (
            <UserPreferencesView
              firmBranding={firmBranding}
              onSavedNotification={msg => onSave(msg)}
              isDialogMode={true}
            />
          )}

          {dialogType === 'custom_modules_overview' && (
            <CustomCaModulesView
              firmBranding={firmBranding}
              onSavedNotification={msg => onSave(msg)}
              isDialogMode={true}
            />
          )}

          {dialogType === 'pdf_templates' && (
            <PdfAuditTemplatesView
              firmBranding={firmBranding}
              onSavedNotification={msg => onSave(msg)}
              isDialogMode={true}
            />
          )}

          {dialogType === 'chart_accounts' && (
            <ChartOfAccountsMappingView
              firmBranding={firmBranding}
              currentUser={currentUser}
              onSavedNotification={msg => onSave(msg)}
              isDialogMode={true}
            />
          )}

          {dialogType !== 'ai_integration' &&
            dialogType !== 'portal' &&
            dialogType !== 'web_forms' &&
            dialogType !== 'data_management' &&
            dialogType !== 'branches' &&
            dialogType !== 'subscription' &&
            dialogType !== 'preferences' &&
            dialogType !== 'custom_modules_overview' &&
            dialogType !== 'pdf_templates' &&
            dialogType !== 'chart_accounts' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="font-bold text-slate-800">{option.name} Settings</span>
                  <p className="text-slate-600">{option.description}</p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-[11px]">
                  Setting parameter active and synchronized with firm profile. Click "Save Configuration" to persist state across sessions.
                </div>
              </div>
            )}
        </div>

        <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg border border-slate-300 hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(`Settings for "${option.name}" updated successfully!`)}
            className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm transition inline-flex items-center space-x-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
};
