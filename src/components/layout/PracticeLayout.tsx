// src/components/layout/PracticeLayout.tsx
import React, { useState, useEffect } from 'react';
import {
  Home,
  Users,
  MessageSquare,
  BarChart2,
  CheckSquare,
  Clock,
  FileSpreadsheet,
  Folder,
  FileText,
  Calendar,
  AlertCircle,
  CreditCard,
  Zap,
  Key,
  Sparkles,
  ShieldAlert,
  Activity,
  Search,
  Bell,
  Settings,
  ChevronDown,
  ChevronRight,
  Plus,
  Play,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Pin,
  MessageCircle,
  Contact2,
  Sliders,
  Building2,
  Shield,
  Bot,
  LayoutDashboard,
  Flame,
} from 'lucide-react';
import { UserRole, AuthUser } from '../../types/index.ts';
import { QuickCreateModal } from '../common/QuickCreateModal.tsx';
import { GlobalSearchModal } from '../common/GlobalSearchModal.tsx';
import { NotificationsDrawer } from '../common/NotificationsDrawer.tsx';
import {
  FirmBrandingConfig,
  getStoredFirmBranding,
  saveStoredFirmBranding,
  resetStoredFirmBranding,
} from '../../services/brandingService.ts';
import { BrandingCustomizerModal } from '../common/BrandingCustomizerModal.tsx';

interface PracticeLayoutProps {
  currentRole: UserRole;
  currentUser?: AuthUser | null;
  firmBranding?: FirmBrandingConfig;
  onUpdateBranding?: (b: FirmBrandingConfig) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  onTriggerIntake?: () => void;
  onOpenNewClientModal?: () => void;
  children: React.ReactNode;
}

export const PracticeLayout: React.FC<PracticeLayoutProps> = ({
  currentRole,
  currentUser,
  firmBranding: externalBranding,
  onUpdateBranding,
  activeTab,
  onTabChange,
  onLogout,
  onRefresh,
  isLoading,
  onTriggerIntake,
  onOpenNewClientModal,
  children,
}) => {
  const [internalBranding, setInternalBranding] = useState<FirmBrandingConfig>(getStoredFirmBranding);
  const activeBranding = externalBranding || internalBranding;
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  const handleSaveBranding = (updated: FirmBrandingConfig) => {
    setInternalBranding(updated);
    saveStoredFirmBranding(updated);
    if (onUpdateBranding) onUpdateBranding(updated);
  };

  const handleResetBranding = () => {
    const def = resetStoredFirmBranding();
    setInternalBranding(def);
    if (onUpdateBranding) onUpdateBranding(def);
  };

  const effectiveFirmName = currentUser?.firmName || activeBranding.firmName || 'QuinceCA';
  const effectiveLogoUrl = currentUser?.logoUrl || activeBranding.logoUrl || '/logo.jpg';
  const effectiveThemeColor = activeBranding.themeColor || '#00c073';

  const splitFirmName = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return { first: parts[0], rest: '' };
    return { first: parts[0], rest: parts.slice(1).join(' ') };
  };
  const firmNameParts = splitFirmName(effectiveFirmName);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Keyboard shortcut '/' to trigger search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsGlobalSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Core Practice Navigation Items
  const primaryNavItems = [
    { key: 'home', label: 'Home', icon: Home },
    { key: 'clients', label: 'Clients', icon: Users, badge: '25' },
    { key: 'insights', label: 'Insights', icon: BarChart2 },
    { key: 'tasks', label: 'Tasks', icon: CheckSquare, badge: '17' },
    { key: 'time-tracking', label: 'Time Tracking', icon: Clock },
    { key: 'workpaper', label: 'Workpaper', icon: FileSpreadsheet, badge: 'Auto GST', badgeColor: 'bg-emerald-500/20 text-emerald-400' },
    { key: 'documents', label: 'Documents', icon: Folder },
    { key: 'reports', label: 'Reports', icon: FileText },
  ];

  // Compliance & Legal Modules matching Attachment 2
  const complianceNavItems = [
    { key: 'compliance-calendar', label: 'Compliance Calendar', icon: Calendar, badge: '5 Oct', badgeColor: 'bg-rose-500/20 text-rose-300' },
    { key: 'gst-itr-filing', label: 'Govt E-Filing Hub', icon: ShieldCheck, badge: '₹0 Free', badgeColor: 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 font-bold' },
    { key: 'notices', label: 'Notices & DSC ...', icon: AlertCircle, badge: '2 Expiring', badgeColor: 'bg-slate-700 text-slate-300' },
    { key: 'billing', label: 'Billing & Invoices', icon: CreditCard },
    { key: 'adhoc-requests', label: 'Adhoc Advisory Desk', icon: FileText },
  ];

  // AI & Automations Section
  const aiNavItems = [
    { key: 'ai-copilot', label: 'AI CA Copilot', icon: Sparkles, badge: 'Gemini AI', badgeColor: 'bg-indigo-500/20 text-indigo-300' },
    { key: 'automation', label: 'Workflow Automation', icon: Zap },
    { key: 'super-admin', label: 'Super Admin Console', icon: ShieldAlert, badge: 'SaaS', badgeColor: 'bg-purple-500/20 text-purple-300' },
    { key: 'diagnostics', label: 'System Diagnostics', icon: Activity },
    { key: 'settings', label: 'All Settings', icon: Settings },
  ];

  const handleQuickAction = (key: string) => {
    if (key === 'new-client') {
      if (onOpenNewClientModal) onOpenNewClientModal();
    } else if (key === 'new-task') {
      onTabChange('tasks');
    } else if (key === 'new-invoice') {
      onTabChange('billing');
    } else if (key === 'new-notice') {
      onTabChange('notices');
    } else if (key === 'run-intake') {
      if (onTriggerIntake) onTriggerIntake();
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-slate-800 flex flex-col font-sans relative antialiased">
      <div className="flex flex-1 overflow-hidden">
        {/* ========================================================================= */}
        {/* LEFT SIDEBAR - QuinceCA Practice OS */}
        {/* ========================================================================= */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#192233] text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:w-64 border-r border-[#232f45] shadow-xl ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* 1. Brand Logo & Title */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-[#232f45] shrink-0">
            <div
              onClick={() => onTabChange('home')}
              className="flex items-center gap-3 cursor-pointer select-none group min-w-0"
              title={`${effectiveFirmName} • Practice OS`}
            >
              <img
                src={effectiveLogoUrl}
                alt={`${effectiveFirmName} Logo`}
                className="w-10 h-10 rounded-xl object-cover shadow-sm border border-white/20 group-hover:scale-105 transition shrink-0 bg-[#005459]"
              />
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm sm:text-base text-white tracking-tight leading-tight truncate">
                    {firmNameParts.first}{' '}
                    <span style={{ color: effectiveThemeColor }}>
                      {firmNameParts.rest}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[10px] font-semibold tracking-wide uppercase"
                    style={{ color: effectiveThemeColor }}
                  >
                    Practice OS
                  </span>
                  <span className="text-[9px] text-slate-500 font-medium hidden sm:inline">
                    • {activeBranding.planName}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 2. Navigation Scroll Area */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 custom-scrollbar">
            {/* Primary Section */}
            <div className="space-y-1">
              {primaryNavItems.map(item => {
                const Icon = item.icon;
                const isActive =
                  activeTab === item.key || (item.key === 'home' && activeTab === 'cockpit');

                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      onTabChange(item.key);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#00c073] text-white shadow-sm font-bold'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-white' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : item.badgeColor || 'bg-slate-700/60 text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* COMPLIANCE & LEGAL Section matching Attachment 2 */}
            <div className="space-y-1 pt-3 border-t border-[#232f45]">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                COMPLIANCE & LEGAL
              </div>
              {complianceNavItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      onTabChange(item.key);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#00c073] text-white shadow-sm font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] shrink-0 ${
                          isActive
                            ? 'bg-white/20 text-white font-bold'
                            : item.badgeColor || 'bg-slate-700/60 text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* AI & AUTOMATIONS Section matching Attachment 2 */}
            <div className="space-y-1 pt-3 border-t border-[#232f45]">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                AI & AUTOMATIONS
              </div>
              {aiNavItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      onTabChange(item.key);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#00c073] text-white shadow-sm font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] shrink-0 ${
                          isActive
                            ? 'bg-white/20 text-white font-bold'
                            : item.badgeColor || 'bg-slate-700/60 text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 3. Product Tour Banner matching screenshot */}
            <div className="pt-2">
              <div className="bg-gradient-to-br from-indigo-900/60 to-blue-950/80 rounded-xl p-3.5 border border-indigo-500/30 text-white relative overflow-hidden shadow-inner">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-md bg-blue-500 text-white flex items-center justify-center">
                    <Play className="w-2.5 h-2.5 fill-current" />
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-300">
                    TAKE A LIVE PRODUCT TOUR
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug mb-2.5">
                  Join us for a free webinar and get an in-depth overview of QuinceCA.
                </p>
                <a
                  href="#webinar"
                  onClick={e => {
                    e.preventDefault();
                    onTabChange('guide');
                  }}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                >
                  Register Now &gt;
                </a>
              </div>
            </div>
          </div>

          {/* 4. Bottom Footer Toolbar (My Pins, Chats, Contacts) */}
          <div className="h-12 border-t border-[#232f45] px-4 flex items-center justify-between text-slate-400 text-xs shrink-0 bg-[#151c2a]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onTabChange('tasks')}
                title="My Pins"
                className="hover:text-white transition flex items-center gap-1"
              >
                <Pin className="w-3.5 h-3.5" />
                <span className="text-[10px]">Pins</span>
              </button>
              <button
                onClick={() => onTabChange('ai-copilot')}
                title="AI Copilot & Chats"
                className="hover:text-white transition flex items-center gap-1"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] text-slate-300">Chats</span>
              </button>
              <button
                onClick={() => onTabChange('clients')}
                title="Client Contacts"
                className="hover:text-white transition flex items-center gap-1"
              >
                <Contact2 className="w-3.5 h-3.5" />
                <span className="text-[10px]">Contacts</span>
              </button>
            </div>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* MAIN BODY AREA (Top Header + Dynamic Page Content) */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Header Bar matching Screenshot */}
          <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-2xs">
            {/* Left: Mobile Toggle & Global Search Bar */}
            <div className="flex items-center gap-3 flex-1 max-w-xl">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden text-slate-600 hover:text-slate-900 p-1"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Exact Search Bar from screenshot */}
              <div
                onClick={() => setIsGlobalSearchOpen(true)}
                className="flex items-center gap-2.5 w-full max-w-md bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 rounded-lg px-3.5 py-1.5 cursor-pointer text-slate-400 transition"
              >
                <Search className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-400 flex-1 truncate">
                  Search in Items ( / )
                </span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-white border border-slate-200 rounded shadow-2xs">
                  /
                </kbd>
              </div>
            </div>

            {/* Right: Actions, Subscription Alert, Quick Add, Notifications, Profile */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              {/* Trial Expiration Alert from screenshot */}
              <div className="hidden md:flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Trial expires in 14 days</span>
                <button
                  onClick={() => onTabChange('super-admin')}
                  className="font-bold text-blue-600 hover:underline"
                >
                  Subscribe
                </button>
              </div>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 py-1 px-2 rounded-lg hover:bg-slate-100 transition"
                >
                  <div className="w-6 h-6 rounded-full bg-[#00c073] text-white flex items-center justify-center font-bold text-[10px] shadow-2xs">
                    {currentUser?.displayName ? currentUser.displayName.replace('CA ', '')[0] : 'S'}
                  </div>
                  <span className="font-semibold text-slate-800">{currentUser?.displayName || 'CA Suraj Dutta (FCA)'}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-2 text-xs z-50 animate-scaleUp divide-y divide-slate-100">
                    {/* Header User Profile Card */}
                    <div className="px-4 py-3 flex items-start gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00c073] to-[#009b5d] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                          {currentUser?.displayName ? currentUser.displayName.replace('CA ', '')[0] : 'S'}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-500/30" title="Online" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 block truncate text-xs">
                            {currentUser?.displayName || 'CA Suraj Dutta (FCA)'}
                          </span>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        </div>
                        <span className="text-[11px] text-slate-500 block truncate font-mono">
                          {currentUser?.email || 'suraj.dutta@quinceca.com'}
                        </span>
                        <span className="inline-block mt-1 text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {currentUser?.designation || (currentRole === 'ca_admin' ? 'Senior Partner / FCA' : 'CA Staff')}
                        </span>
                      </div>
                    </div>

                    {/* Section 1: Executive Cockpit */}
                    <div className="py-1.5 px-1.5 space-y-0.5">
                      <div className="px-2.5 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Executive Cockpit
                      </div>

                      {/* Executive Cockpit / Dashboard Overview */}
                      <button
                        onClick={() => {
                          onTabChange('home');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-lg flex items-center justify-between transition cursor-pointer group"
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <LayoutDashboard className="w-3.5 h-3.5" />
                          </div>
                          <span>Executive Cockpit</span>
                        </span>
                        <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                          Live
                        </span>
                      </button>

                      {/* Organization Profile */}
                      <button
                        onClick={() => {
                          onTabChange('settings-profile');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-lg flex items-center justify-between transition cursor-pointer group"
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Building2 className="w-3.5 h-3.5" />
                          </div>
                          <span>Organization Profile</span>
                        </span>
                        <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-slate-500 transition" />
                      </button>

                      {/* Roles & Access Matrix */}
                      <button
                        onClick={() => {
                          onTabChange('settings-roles');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-lg flex items-center justify-between transition cursor-pointer group"
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Shield className="w-3.5 h-3.5" />
                          </div>
                          <span>Roles & Access Matrix</span>
                        </span>
                        <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-slate-500 transition" />
                      </button>

                      {/* Self Service Portal */}
                      <button
                        onClick={() => {
                          onTabChange('settings-portal');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-lg flex items-center justify-between transition cursor-pointer group"
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <div className="w-6 h-6 rounded-md bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Globe className="w-3.5 h-3.5" />
                          </div>
                          <span>Self Service Portal</span>
                        </span>
                        <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-slate-500 transition" />
                      </button>

                      {/* Client AI Copilot */}
                      <button
                        onClick={() => {
                          onTabChange('settings-client-ai');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-lg flex items-center justify-between transition cursor-pointer group"
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Bot className="w-3.5 h-3.5" />
                          </div>
                          <span>Client AI Copilot</span>
                        </span>
                        <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                          Gemini AI
                        </span>
                      </button>

                      {/* WhatsApp Integration */}
                      <button
                        onClick={() => {
                          onTabChange('settings-whatsapp');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-lg flex items-center justify-between transition cursor-pointer group"
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <MessageCircle className="w-3.5 h-3.5" />
                          </div>
                          <span>WhatsApp Integration</span>
                        </span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Connected" />
                      </button>

                      {/* All Settings */}
                      <button
                        onClick={() => {
                          onTabChange('settings');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 hover:bg-emerald-50/50 text-emerald-800 rounded-lg flex items-center justify-between transition cursor-pointer group"
                      >
                        <span className="flex items-center gap-2 font-semibold">
                          <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Settings className="w-3.5 h-3.5" />
                          </div>
                          <span>All Settings Hub</span>
                        </span>
                        <ChevronRight className="w-3 h-3 text-emerald-500" />
                      </button>
                    </div>

                    {/* Section 2: Plan & Subscriptions */}
                    <div className="py-1.5 px-1.5 space-y-0.5">
                      <div className="px-2.5 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Plan & Subscriptions
                      </div>

                      {/* Plan & Subscriptions */}
                      <button
                        onClick={() => {
                          onTabChange('super-admin');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-lg flex items-center justify-between transition cursor-pointer group"
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <CreditCard className="w-3.5 h-3.5" />
                          </div>
                          <span>Plan & Subscriptions</span>
                        </span>
                        <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                          14 Days Left
                        </span>
                      </button>

                      {/* White-Label Branding */}
                      <button
                        onClick={() => {
                          setIsCustomizerOpen(true);
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-lg flex items-center justify-between transition cursor-pointer group"
                      >
                        <span className="flex items-center gap-2 font-semibold">
                          <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Sliders className="w-3.5 h-3.5" />
                          </div>
                          <span>White-Label Branding</span>
                        </span>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold">
                          {activeBranding.planName || 'Enterprise'}
                        </span>
                      </button>
                    </div>

                    {/* Section 3: Sign Out */}
                    {onLogout && (
                      <div className="py-1 px-1.5">
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onLogout();
                          }}
                          className="w-full text-left px-2.5 py-2 text-rose-600 hover:bg-rose-50 rounded-lg font-bold flex items-center gap-2 transition cursor-pointer group"
                        >
                          <div className="w-6 h-6 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <LogOut className="w-3.5 h-3.5" />
                          </div>
                          <span>Sign Out</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Green Quick Add Button matching Screenshot (+) */}
              <button
                onClick={() => setIsQuickCreateOpen(true)}
                className="w-8 h-8 rounded-lg bg-[#00c073] hover:bg-[#00a864] text-white flex items-center justify-center font-black text-sm shadow-sm transition transform active:scale-95"
                title="Quick Create (Client, Task, Invoice, Notice, Intake)"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </button>

              {/* Notification Bell */}
              <button
                onClick={() => setIsNotificationsOpen(true)}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg relative transition"
                title="Statutory Alerts & Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse"></span>
              </button>

              {/* Settings Gear */}
              <button
                onClick={() => onTabChange('settings')}
                className={`p-2 rounded-lg transition ${
                  activeTab === 'settings'
                    ? 'bg-slate-200 text-slate-800 font-bold'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
                title="Firm Settings & Operations Hub"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
            {children}
          </main>

          {/* Bottom Floating Expert Support / AI Copilot Button from screenshot */}
          <div className="fixed bottom-4 right-4 z-30">
            <button
              onClick={() => onTabChange('ai-copilot')}
              className="px-4 py-2.5 rounded-full bg-[#00c073] hover:bg-[#00a864] text-white text-xs font-bold shadow-lg flex items-center gap-2 transition transform hover:scale-105"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ask AI Copilot</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Modals */}
      <QuickCreateModal
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
        onAction={handleQuickAction}
      />

      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        onNavigate={onTabChange}
      />

      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigate={onTabChange}
      />

      {/* White-Label Branding Customizer Modal */}
      <BrandingCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        currentBranding={activeBranding}
        onSaveBranding={handleSaveBranding}
        onResetBranding={handleResetBranding}
      />
    </div>
  );
};
