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
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between min-h-[60px] py-2 gap-3">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-3 shrink-0">
              <img
                src="/logo.jpg"
                alt="Professional Samadhan Logo"
                className="w-10 h-10 rounded-xl object-cover shadow border border-white/20 shrink-0"
              />
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base text-white tracking-tight leading-tight">
                    Professional Samadhan
                  </span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded theme-badge border">
                    Client Portal
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-tight mt-0.5">Statutory GST Document Upload & Review</p>
              </div>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-3 shrink-0">
              <PaletteSwitcher />
              <div className="hidden sm:flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-xl border border-white/10 text-xs text-teal-300 font-medium">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>256-Bit Encrypted Session</span>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="px-3 py-1.5 bg-rose-600/90 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                  title="Sign Out of Client Portal"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Exit</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="theme-header text-white border-b sticky top-0 z-40 shadow-lg backdrop-blur-md">
      <div className="w-full max-w-[1536px] mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between min-h-[64px] py-2 gap-2 sm:gap-4 flex-nowrap">
          {/* 1. Left Brand & Logo (Properly Aligned & No Overflow) */}
          <div
            className="flex items-center gap-3 shrink-0 cursor-pointer select-none"
            onClick={() => onTabChange('cockpit')}
            title="Go to CA Executive Cockpit"
          >
            <img
              src="/logo.jpg"
              alt="Professional Samadhan Logo"
              className="w-10 h-10 rounded-xl object-cover shadow-md border border-white/20 shrink-0"
            />
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base text-white tracking-tight leading-none">
                  Professional Samadhan
                </span>
                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded theme-badge border">
                  CA Firm
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-tight mt-1 hidden sm:block">
                GST Compliance & Practice Management
              </p>
            </div>
          </div>

          {/* 2. Center Navigation Tabs (Sleek, Compact Pill Design) */}
          <nav className="hidden md:flex items-center gap-1 shrink-0">
            <button
              onClick={() => onTabChange('cockpit')}
              style={{
                backgroundColor: activeTab === 'cockpit' ? 'var(--theme-primary)' : 'transparent',
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'cockpit'
                  ? 'text-white shadow-sm ring-1 ring-white/20 font-bold'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>CA Cockpit</span>
            </button>

            <button
              onClick={() => onTabChange('clients')}
              style={{
                backgroundColor: activeTab === 'clients' ? 'var(--theme-primary)' : 'transparent',
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'clients'
                  ? 'text-white shadow-sm ring-1 ring-white/20 font-bold'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Clients</span>
            </button>

            <button
              onClick={() => onTabChange('gst-pipeline')}
              style={{
                backgroundColor: activeTab === 'gst-pipeline' ? 'var(--theme-primary)' : 'transparent',
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'gst-pipeline'
                  ? 'text-white shadow-sm ring-1 ring-white/20 font-bold'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>GST Pipeline</span>
            </button>

            <button
              onClick={() => onTabChange('audit-logs')}
              style={{
                backgroundColor: activeTab === 'audit-logs' ? 'var(--theme-primary)' : 'transparent',
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'audit-logs'
                  ? 'text-white shadow-sm ring-1 ring-white/20 font-bold'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp & Logs</span>
            </button>

            <button
              onClick={() => onTabChange('guide')}
              style={{
                backgroundColor: activeTab === 'guide' ? 'var(--theme-primary)' : 'transparent',
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 whitespace-nowrap ${
                activeTab === 'guide'
                  ? 'text-white shadow-sm ring-1 ring-white/20 font-bold'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Docs</span>
            </button>
          </nav>

          {/* 3. Right Action Toolbar (Neatly Balanced) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Palette Switcher */}
            <PaletteSwitcher />

            {/* Role Switcher Pill */}
            <div className="hidden lg:flex items-center bg-black/40 p-0.5 rounded-lg border border-white/10 text-xs">
              <button
                onClick={() => onRoleChange('ca_admin')}
                style={{
                  backgroundColor: currentRole === 'ca_admin' ? 'var(--theme-primary)' : 'transparent',
                }}
                className={`px-2.5 py-1 rounded-md font-semibold transition flex items-center gap-1 ${
                  currentRole === 'ca_admin' ? 'text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
                title="Switch to CA Administrator"
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Admin</span>
              </button>
              <button
                onClick={() => onRoleChange('staff')}
                className={`px-2.5 py-1 rounded-md font-semibold transition flex items-center gap-1 ${
                  currentRole === 'staff' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
                title="Switch to Staff Associate"
              >
                <UserCheck className="w-3 h-3" />
                <span>Staff</span>
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-teal-400' : ''}`} />
            </button>

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="px-3 py-1.5 bg-rose-600/90 hover:bg-rose-600 text-white border border-rose-500/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                title="Sign Out of CA Practice System"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-bar showing active persona: Clearly separated, never colliding */}
      <div className="theme-subheader px-4 sm:px-6 py-1.5 text-xs text-slate-300 border-t flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-400">Partner in Charge:</span>
          <span className="font-bold text-white">
            {currentUser?.displayName || (
              currentRole === 'ca_admin'
                ? 'CA Suraj Dutta (FCA)'
                : currentRole === 'staff'
                ? 'Pooja Verma (Senior Associate)'
                : 'Client Upload Portal'
            )}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[11px] text-slate-400">
          <span>Database: <strong className="text-slate-200">PostgreSQL (Drizzle ORM)</strong></span>
          <span>Messaging: <strong className="text-slate-200">WhatsApp Mode A & B Active</strong></span>
        </div>
      </div>
    </header>
  );
};
