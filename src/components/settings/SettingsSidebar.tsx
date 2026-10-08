// src/components/settings/SettingsSidebar.tsx
import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Building2,
  Users,
  Sliders,
  Palette,
  Zap,
  CheckSquare,
  Layers,
  Plug,
  Terminal,
} from 'lucide-react';
import { FirmBrandingConfig } from '../../services/brandingService';

export type SettingsSubViewId =
  | 'grid'
  | 'org_profile'
  | 'org_branding'
  | 'org_branches'
  | 'org_ai'
  | 'org_subscription'
  | 'users_list'
  | 'users_roles'
  | 'user_preferences'
  | 'config_clients'
  | 'config_requests'
  | 'config_portal'
  | 'config_chart_accounts'
  | 'custom_pdf'
  | 'custom_email'
  | 'auto_rules'
  | 'auto_actions'
  | 'auto_logs'
  | 'auto_schedules'
  | 'mod_tasks'
  | 'mod_overview'
  | 'int_client_ai'
  | 'int_whatsapp'
  | 'int_accounting'
  | 'int_other'
  | 'dev_data_mgmt'
  | 'dev_deluge'
  | 'dev_webforms';

interface SettingsSidebarProps {
  activeViewId: SettingsSubViewId;
  onSelectView: (viewId: SettingsSubViewId) => void;
  onBackToGrid: () => void;
  firmBranding: FirmBrandingConfig;
  currentUser?: any;
}

interface NavSection {
  id: string;
  categoryTitle: string;
  groups: {
    id: string;
    label: string;
    icon: any;
    items: {
      id: SettingsSubViewId;
      label: string;
      badge?: string;
    }[];
  }[];
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  activeViewId,
  onSelectView,
  onBackToGrid,
  firmBranding,
  currentUser,
}) => {
  // Expanded accordions state - keep active group expanded by default
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    organization: true,
    users_roles: true,
    setup_config: true,
    customization: false,
    automation: false,
    general_module: false,
    custom_modules: false,
    integrations: false,
    developer_data: false,
  });

  // Auto-expand group containing activeViewId
  React.useEffect(() => {
    if (
      activeViewId === 'config_portal' ||
      activeViewId === 'config_clients' ||
      activeViewId === 'config_requests' ||
      activeViewId === 'config_chart_accounts'
    ) {
      setExpandedGroups(prev => ({ ...prev, setup_config: true }));
    } else if (activeViewId.startsWith('org_')) {
      setExpandedGroups(prev => ({ ...prev, organization: true }));
    } else if (activeViewId.startsWith('users_') || activeViewId === 'user_preferences') {
      setExpandedGroups(prev => ({ ...prev, users_roles: true }));
    } else if (activeViewId.startsWith('int_')) {
      setExpandedGroups(prev => ({ ...prev, integrations: true }));
    } else if (activeViewId.startsWith('dev_')) {
      setExpandedGroups(prev => ({ ...prev, developer_data: true }));
    }
  }, [activeViewId]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const navSections: NavSection[] = [
    {
      id: 'org_settings',
      categoryTitle: 'ORGANIZATION SETTINGS',
      groups: [
        {
          id: 'organization',
          label: 'Organization',
          icon: Building2,
          items: [
            { id: 'org_profile', label: 'Profile' },
            { id: 'org_branding', label: 'Branding' },
            { id: 'org_branches', label: 'Branches' },
            { id: 'org_ai', label: 'AI Integration', badge: 'Multi-Model' },
            { id: 'org_subscription', label: 'Manage Subscription' },
          ],
        },
        {
          id: 'users_roles',
          label: 'Users & Roles',
          icon: Users,
          items: [
            { id: 'users_list', label: 'Users' },
            { id: 'users_roles', label: 'Roles' },
            { id: 'user_preferences', label: 'User Preferences' },
          ],
        },
        {
          id: 'setup_config',
          label: 'Setup & Configurations',
          icon: Sliders,
          items: [
            { id: 'config_clients', label: 'Clients' },
            { id: 'config_requests', label: 'Client Requests' },
            { id: 'config_portal', label: 'Self Service Portal' },
            { id: 'config_chart_accounts', label: 'Chart of Accounts' },
          ],
        },
        {
          id: 'customization',
          label: 'Customization',
          icon: Palette,
          items: [
            { id: 'custom_pdf', label: 'PDF Templates' },
            { id: 'custom_email', label: 'Email Notifications' },
          ],
        },
        {
          id: 'automation',
          label: 'Automation',
          icon: Zap,
          items: [
            { id: 'auto_rules', label: 'Workflow Rules' },
            { id: 'auto_actions', label: 'Workflow Actions' },
            { id: 'auto_logs', label: 'Workflow Logs' },
            { id: 'auto_schedules', label: 'Schedules' },
          ],
        },
      ],
    },
    {
      id: 'module_settings',
      categoryTitle: 'MODULE SETTINGS',
      groups: [
        {
          id: 'general_module',
          label: 'General',
          icon: CheckSquare,
          items: [
            { id: 'mod_tasks', label: 'Tasks' },
            { id: 'config_chart_accounts', label: 'Chart of Accounts', badge: 'Active' },
          ],
        },
        {
          id: 'custom_modules',
          label: 'Custom Modules',
          icon: Layers,
          items: [{ id: 'mod_overview', label: 'Overview', badge: 'ROC' }],
        },
      ],
    },
    {
      id: 'ext_developer_data',
      categoryTitle: 'EXTENSION AND DEVELOPER DATA',
      groups: [
        {
          id: 'integrations',
          label: 'Integrations',
          icon: Plug,
          items: [
            { id: 'int_client_ai', label: 'Client AI Copilot', badge: 'BYOK' },
            { id: 'int_whatsapp', label: 'WhatsApp', badge: 'Active' },
            { id: 'int_accounting', label: 'Accounting' },
            { id: 'int_other', label: 'Other Apps' },
          ],
        },
        {
          id: 'developer_data',
          label: 'Developer Data',
          icon: Terminal,
          items: [
            { id: 'dev_data_mgmt', label: 'Data Management', badge: 'Active' },
            { id: 'dev_deluge', label: 'Deluge Usage' },
            { id: 'dev_webforms', label: 'Web Forms' },
          ],
        },
      ],
    },
  ];

  const userName = currentUser?.displayName || currentUser?.username || 'shekhar';

  return (
    <aside className="w-64 bg-[#f8fafc] border-r border-slate-200/80 flex flex-col shrink-0 min-h-screen text-slate-700 select-none">
      {/* Top Back Link to Settings Overview */}
      <div className="p-4 border-b border-slate-200/80 bg-white">
        <button
          onClick={onBackToGrid}
          className="flex items-center space-x-2 text-left group cursor-pointer w-full"
        >
          <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-emerald-50 text-slate-500 group-hover:text-emerald-600 flex items-center justify-center transition border border-slate-200/60">
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-600 transition flex items-center gap-1.5">
              <span>All Settings</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium truncate max-w-[170px]">
              {userName}
            </div>
          </div>
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 text-xs">
        {navSections.map(section => (
          <div key={section.id} className="space-y-1">
            {/* Category Header */}
            <h4 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-2 mb-1.5">
              {section.categoryTitle}
            </h4>

            {/* Groups in Category */}
            <div className="space-y-0.5">
              {section.groups.map(group => {
                const isExpanded = expandedGroups[group.id] ?? false;
                const hasActiveChild = group.items.some(it => it.id === activeViewId);

                return (
                  <div key={group.id} className="space-y-0.5">
                    {/* Group Header Toggle */}
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        hasActiveChild && !isExpanded
                          ? 'text-emerald-700 bg-emerald-50/60'
                          : 'text-slate-700 hover:bg-slate-200/50 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>{group.label}</span>
                      </div>
                    </button>

                    {/* Accordion Sub-items */}
                    {isExpanded && (
                      <div className="pl-6 pr-1 space-y-0.5 py-0.5">
                        {group.items.map(item => {
                          const isActive = activeViewId === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => onSelectView(item.id)}
                              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                                isActive
                                  ? 'bg-[#00c073] text-white font-semibold shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                              }`}
                            >
                              <span className="truncate">{item.label}</span>
                              {item.badge && !isActive && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-600 font-semibold">
                                  {item.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Firm footer label */}
      <div className="p-3 border-t border-slate-200/80 bg-slate-50 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="truncate">{firmBranding.firmName}</span>
        <span className="text-[10px] font-bold text-emerald-600 px-1.5 py-0.5 bg-emerald-50 rounded border border-emerald-200/60">
          v2.6
        </span>
      </div>
    </aside>
  );
};
