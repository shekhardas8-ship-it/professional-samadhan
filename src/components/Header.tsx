// src/components/Header.tsx
import React from 'react';
import { UserRole, AuthUser } from '../types/index.ts';
import {
  Building2,
  ShieldCheck,
  UserCheck,
  Smartphone,
  RefreshCw,
  BookOpen,
  LogOut,
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  MessageSquare,
} from 'lucide-react';
import { PaletteSwitcher } from './PaletteSwitcher.tsx';

interface HeaderProps {
  currentRole: UserRole;
  currentUser?: AuthUser | null;
  onRoleChange: (role: UserRole) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onRefresh: () => void;
  onLogout?: () => void;
  isLoading: boolean;
  isClientOnlyMode?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  currentUser,
  onRoleChange,
  activeTab,
  onTabChange,
  onRefresh,
  onLogout,
  isLoading,
  isClientOnlyMode = false,
}) => {
  if (isClientOnlyMode) {
    return (
      <header className="theme-header text-white border-b sticky top-0 z-40 shadow-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Name */}
            <div className="flex items-center space-x-3">
              <img
                src="/logo.jpg"
                alt="Professional Samadhan Logo"
                className="w-10 h-10 rounded-lg object-cover shadow border border-white/20 shrink-0"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-lg text-white tracking-tight">Professional Samadhan</span>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded theme-badge border">
                    Client Portal
                  </span>
                </div>
                <p className="text-xs text-slate-300">Statutory GST Document Upload & Review</p>
              </div>
            </div>

            {/* Right side controls: Palette switcher, security badge, and sign out if applicable */}
            <div className="flex items-center space-x-3">
              <PaletteSwitcher />
              <div className="flex items-center space-x-2 bg-black/20 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-teal-300 font-medium">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span className="hidden sm:inline">256-Bit Encrypted Statutory Session</span>
                <span className="sm:hidden">Secure Upload</span>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="px-2.5 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-700/60 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                  title="Sign Out of Client Portal"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Exit</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="theme-header text-white border-b sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onTabChange('cockpit')}>
            <img
              src="/logo.jpg"
              alt="Professional Samadhan Logo"
              className="w-10 h-10 rounded-lg object-cover shadow border border-white/20 shrink-0"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">Professional Samadhan</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded theme-badge border">
                  CA Firm
                </span>
              </div>
              <p className="text-xs text-slate-300">GST Compliance & Practice Management</p>
            </div>
          </div>

          {/* Navigation Tabs - Focused Chartered Accountant Modules */}
          <nav className="hidden md:flex space-x-1">
            <button
              onClick={() => onTabChange('cockpit')}
              style={{ backgroundColor: activeTab === 'cockpit' ? 'var(--theme-primary)' : 'transparent' }}
              className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center space-x-1.5 ${
                activeTab === 'cockpit'
                  ? 'text-white shadow-sm font-bold'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>CA Cockpit</span>
            </button>

            <button
              onClick={() => onTabChange('clients')}
              style={{ backgroundColor: activeTab === 'clients' ? 'var(--theme-primary)' : 'transparent' }}
              className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center space-x-1.5 ${
                activeTab === 'clients'
                  ? 'text-white shadow-sm font-bold'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Clients</span>
            </button>

            <button
              onClick={() => onTabChange('gst-pipeline')}
              style={{ backgroundColor: activeTab === 'gst-pipeline' ? 'var(--theme-primary)' : 'transparent' }}
              className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center space-x-1.5 ${
                activeTab === 'gst-pipeline'
                  ? 'text-white shadow-sm font-bold'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>GST Pipeline</span>
            </button>

            <button
              onClick={() => onTabChange('audit-logs')}
              style={{ backgroundColor: activeTab === 'audit-logs' ? 'var(--theme-primary)' : 'transparent' }}
              className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center space-x-1.5 ${
                activeTab === 'audit-logs'
                  ? 'text-white shadow-sm font-bold'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp & Logs</span>
            </button>

            <button
              onClick={() => onTabChange('guide')}
              style={{ backgroundColor: activeTab === 'guide' ? 'var(--theme-primary)' : 'transparent' }}
              className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center space-x-1 ${
                activeTab === 'guide'
                  ? 'text-white shadow-sm'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4 mr-1" />
              <span>Docs</span>
            </button>
          </nav>

          {/* Palette Switcher, User Persona & Sign Out */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <PaletteSwitcher />

            {/* Role indicator / fast toggle */}
            <div className="hidden sm:flex items-center bg-black/30 p-1 rounded-lg border border-white/10">
              <span className="text-[11px] text-slate-400 px-1.5 font-medium">Role:</span>
              <button
                onClick={() => onRoleChange('ca_admin')}
                style={{ backgroundColor: currentRole === 'ca_admin' ? 'var(--theme-primary)' : 'transparent' }}
                className={`px-2 py-0.5 text-xs font-semibold rounded transition flex items-center space-x-1 ${
                  currentRole === 'ca_admin'
                    ? 'text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="CA Administrator - Full control, statutory approvals"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
              <button
                onClick={() => onRoleChange('staff')}
                className={`px-2 py-0.5 text-xs font-semibold rounded transition flex items-center space-x-1 ${
                  currentRole === 'staff'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Staff Account - Assigned clients only"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Staff</span>
              </button>
            </div>

            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-teal-400' : ''}`} />
            </button>

            {/* Logout button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="px-2.5 py-1.5 bg-rose-950/70 hover:bg-rose-900 text-rose-200 border border-rose-800/60 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs"
                title="Log Out of CA Practice System"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-bar showing active persona */}
      <div className="theme-subheader px-4 py-1 text-xs text-slate-400 border-t flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
          <span>Logged in as:</span>
          <span className="font-semibold text-slate-200">
            {currentUser?.displayName || (
              currentRole === 'ca_admin'
                ? 'CA Rajesh Sharma (FCA) - Partner'
                : currentRole === 'staff'
                ? 'Pooja Verma (Senior Associate) - Assigned 2 Clients'
                : 'Client Upload Portal (Secure Token Access)'
            )}
          </span>
        </div>
        <div className="hidden sm:flex items-center space-x-4 text-[11px]">
          <span>Database: <strong className="text-slate-300">PostgreSQL (Drizzle ORM)</strong></span>
          <span>Messaging: <strong className="text-slate-300">WhatsApp Mode A & B Active</strong></span>
        </div>
      </div>
    </header>
  );
};
