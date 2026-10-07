// src/components/SidebarZoho.tsx
import React, { useState } from 'react';
import {
  Home,
  Users,
  Inbox,
  BarChart3,
  CheckSquare,
  Clock,
  FileSpreadsheet,
  FolderLock,
  Calendar,
  CreditCard,
  FileText,
  Shield,
  Sparkles,
  GitBranch,
  Activity,
  Layers,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Pin,
  MessageCircle,
  Contact2,
  Tv2,
  ExternalLink,
  Bot,
  Landmark,
  FileCode2,
} from 'lucide-react';

interface SidebarZohoProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenLiveTour?: () => void;
  userRole?: string;
}

export const SidebarZoho: React.FC<SidebarZohoProps> = ({
  activeTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
  onOpenLiveTour,
  userRole = 'ca_admin',
}) => {
  const mainMenuItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
    },
    {
      id: 'clients',
      label: 'Clients',
      icon: Users,
      badge: '25',
    },
    {
      id: 'client-requests',
      label: 'Client Requests',
      icon: Inbox,
      badge: '3 Due',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      id: 'insights',
      label: 'Insights',
      icon: BarChart3,
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: CheckSquare,
      badge: '17',
    },
    {
      id: 'time-tracking',
      label: 'Time Tracking',
      icon: Clock,
    },
    {
      id: 'workpaper',
      label: 'Workpaper',
      icon: FileSpreadsheet,
      badge: 'Auto GST',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FolderLock,
    },
  ];

  const complianceMenuItems = [
    {
      id: 'compliance-calendar',
      label: 'Compliance Calendar',
      icon: Calendar,
      badge: '5 Oct',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
    {
      id: 'gst-itr-filing',
      label: 'Govt E-Filing Hub',
      icon: Landmark,
      badge: '₹0 Free',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'notices-dsc',
      label: 'Notices & DSC Radar',
      icon: Shield,
      badge: '2 Expiring',
    },
    {
      id: 'billing-finance',
      label: 'Billing & Invoices',
      icon: CreditCard,
    },
    {
      id: 'adhoc-requests',
      label: 'Adhoc Advisory Desk',
      icon: FileText,
    },
  ];

  const automationMenuItems = [
    {
      id: 'ai-copilot',
      label: 'AI CA Copilot',
      icon: Sparkles,
      badge: 'Gemini AI',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    },
    {
      id: 'workflow-builder',
      label: 'Workflow Automation',
      icon: GitBranch,
    },
    {
      id: 'super-admin',
      label: 'Super Admin Console',
      icon: Layers,
      badge: 'SaaS',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    },
    {
      id: 'diagnostics',
      label: 'System Diagnostics',
      icon: Activity,
    },
  ];

  return (
    <aside
      className={`bg-[#182232] text-slate-300 flex flex-col justify-between shrink-0 transition-all duration-300 border-r border-[#263345] z-30 select-none relative ${
        collapsed ? 'w-[72px]' : 'w-[250px]'
      }`}
      style={{ minHeight: '100vh' }}
    >
      {/* 1. Brand Logo Header */}
      <div>
        <div className="h-14 border-b border-[#263345] flex items-center px-4 justify-between gap-3">
          <div
            onClick={() => onTabChange('home')}
            className="flex items-center gap-3 cursor-pointer overflow-hidden"
            title="QuinceCA AI Home"
          >
            {/* Hexagon/Diamond Brand Mark */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/20 shrink-0">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 text-[#0a1f1c]"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-white font-sans">
                    Quince<span className="text-emerald-400">CA</span>
                  </span>
                  <span className="text-[10px] font-bold px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                    AI
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                  Practice OS
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 2. Navigation Items */}
        <div className="py-3 px-2 space-y-0.5 overflow-y-auto max-h-[calc(100vh-270px)] custom-scrollbar">
          {/* Main Items */}
          {mainMenuItems.map(item => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id ||
              (item.id === 'home' && (activeTab === 'cockpit' || activeTab === 'dashboard')) ||
              (item.id === 'workpaper' && activeTab === 'gst-pipeline');

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all group ${
                  isActive
                    ? 'bg-[#00C975] text-white font-semibold shadow-sm shadow-[#00C975]/30'
                    : 'text-slate-300 hover:text-white hover:bg-[#223046]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                  }`}
                />
                {!collapsed && (
                  <span className="flex-1 text-left truncate">{item.label}</span>
                )}
                {!collapsed && item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                      isActive
                        ? 'bg-white/20 text-white border-white/30'
                        : item.badgeColor || 'bg-slate-700 text-slate-300 border-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Section Divider: Compliance & Legal */}
          {!collapsed && (
            <div className="pt-3 pb-1 px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Compliance & Legal
            </div>
          )}

          {complianceMenuItems.map(item => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id ||
              (item.id === 'compliance-calendar' && activeTab === 'pending-tax');

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all group ${
                  isActive
                    ? 'bg-[#00C975] text-white font-semibold shadow-sm shadow-[#00C975]/30'
                    : 'text-slate-300 hover:text-white hover:bg-[#223046]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                  }`}
                />
                {!collapsed && (
                  <span className="flex-1 text-left truncate">{item.label}</span>
                )}
                {!collapsed && item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                      isActive
                        ? 'bg-white/20 text-white border-white/30'
                        : item.badgeColor || 'bg-slate-700 text-slate-300 border-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Section Divider: AI & Automation */}
          {!collapsed && (
            <div className="pt-3 pb-1 px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              AI & Automations
            </div>
          )}

          {automationMenuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all group ${
                  isActive
                    ? 'bg-[#00C975] text-white font-semibold shadow-sm shadow-[#00C975]/30'
                    : 'text-slate-300 hover:text-white hover:bg-[#223046]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                  }`}
                />
                {!collapsed && (
                  <span className="flex-1 text-left truncate">{item.label}</span>
                )}
                {!collapsed && item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                      isActive
                        ? 'bg-white/20 text-white border-white/30'
                        : item.badgeColor || 'bg-slate-700 text-slate-300 border-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Bottom Area: Live Product Tour Card & Quick Pins */}
      <div>
        {!collapsed && (
          <div className="px-3 pb-3">
            <div className="bg-gradient-to-br from-[#1c2c44] to-[#162337] rounded-xl p-3 border border-indigo-500/20 shadow-md relative overflow-hidden group">
              <div className="absolute top-2 right-2 text-indigo-400/30 group-hover:text-indigo-400/60 transition">
                <Tv2 className="w-8 h-8" />
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-300 tracking-wide uppercase mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
                <span>Live Product Tour</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug mb-2 font-normal">
                Join our webinar & discover automated GST & Practice OS capabilities.
              </p>
              <button
                onClick={() => {
                  if (onOpenLiveTour) onOpenLiveTour();
                  else onTabChange('guide');
                }}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition group-hover:translate-x-0.5"
              >
                <span>Register Now</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Sidebar Collapse Toggle & Mini Bar */}
        <div className="border-t border-[#263345] px-2 py-2 flex items-center justify-between text-slate-400 text-xs bg-[#131b28]">
          {!collapsed ? (
            <>
              <div className="flex items-center gap-3 px-1 text-[11px]">
                <button
                  onClick={() => onTabChange('audit-logs')}
                  className="hover:text-white flex items-center gap-1 transition"
                  title="Audit Trail"
                >
                  <Pin className="w-3.5 h-3.5" />
                  <span>Pins</span>
                </button>
                <button
                  onClick={() => onTabChange('ai-copilot')}
                  className="hover:text-white flex items-center gap-1 transition"
                  title="AI Copilot Chat"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Chat</span>
                </button>
                <button
                  onClick={() => onTabChange('clients')}
                  className="hover:text-white flex items-center gap-1 transition"
                  title="Client Directory"
                >
                  <Contact2 className="w-3.5 h-3.5" />
                  <span>Directory</span>
                </button>
              </div>
              <button
                onClick={onToggleCollapse}
                className="p-1.5 hover:text-white hover:bg-[#223046] rounded-md transition"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={onToggleCollapse}
              className="w-full flex justify-center p-1.5 hover:text-white hover:bg-[#223046] rounded-md transition"
              title="Expand Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
