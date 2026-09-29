// src/components/Header.tsx
import React from 'react';
import { UserRole } from '../types/index.ts';
import { Building2, ShieldCheck, UserCheck, Smartphone, RefreshCw, BookOpen } from 'lucide-react';
import { PaletteSwitcher } from './PaletteSwitcher.tsx';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  isClientOnlyMode?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  activeTab,
  onTabChange,
  onRefresh,
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

            {/* Right side controls: Palette switcher & security badge */}
            <div className="flex items-center space-x-3">
              <PaletteSwitcher />
              <div className="flex items-center space-x-2 bg-black/20 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-teal-300 font-medium">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span className="hidden sm:inline">256-Bit Encrypted Statutory Session</span>
                <span className="sm:hidden">Secure Upload</span>
              </div>
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
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onTabChange('dashboard')}>
            <img
              src="/logo.jpg"
              alt="Professional Samadhan Logo"
              className="w-10 h-10 rounded-lg object-cover shadow border border-slate-700/60 shrink-0"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">Professional Samadhan</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded theme-badge border">
                  CA Firm
                </span>
              </div>
              <p className="text-xs text-slate-300">GST Compliance & Document Intake System</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex space-x-1">
            <button
              onClick={() => onTabChange('dashboard')}
              style={{ backgroundColor: activeTab === 'dashboard' ? 'var(--theme-primary)' : 'transparent' }}
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                activeTab === 'dashboard'
                  ? 'text-white shadow-sm'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              CA Pipeline
            </button>
            <button
              onClick={() => onTabChange('client-portal')}
              style={{ backgroundColor: activeTab === 'client-portal' ? 'var(--theme-primary)' : 'transparent' }}
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                activeTab === 'client-portal'
                  ? 'text-white shadow-sm'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              Client Portal
            </button>
            <button
              onClick={() => onTabChange('audit-logs')}
              style={{ backgroundColor: activeTab === 'audit-logs' ? 'var(--theme-primary)' : 'transparent' }}
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                activeTab === 'audit-logs'
                  ? 'text-white shadow-sm'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              WhatsApp & Audit Logs
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
              Setup & Architecture
            </button>
          </nav>

          {/* Palette Switcher, Role Switcher & Refresh */}
          <div className="flex items-center space-x-3">
            <PaletteSwitcher />

            <div className="flex items-center bg-black/30 p-1 rounded-lg border border-white/10">
              <span className="text-xs text-slate-400 px-2 font-medium hidden sm:inline">Role:</span>
              <button
                onClick={() => onRoleChange('ca_admin')}
                style={{ backgroundColor: currentRole === 'ca_admin' ? 'var(--theme-primary)' : 'transparent' }}
                className={`px-2.5 py-1 text-xs font-medium rounded transition flex items-center space-x-1 ${
                  currentRole === 'ca_admin'
                    ? 'text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="CA Administrator - Full control, statutory approvals"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>CA Admin</span>
              </button>
              <button
                onClick={() => onRoleChange('staff')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition flex items-center space-x-1 ${
                  currentRole === 'staff'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Staff Account - Assigned clients only"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Staff</span>
              </button>
              <button
                onClick={() => {
                  onRoleChange('client');
                  onTabChange('client-portal');
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded transition flex items-center space-x-1 ${
                  currentRole === 'client'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Client Portal Mode"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Client</span>
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
          </div>
        </div>
      </div>

      {/* Sub-bar showing active persona */}
      <div className="theme-subheader px-4 py-1 text-xs text-slate-400 border-t flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
          <span>Logged in as:</span>
          <span className="font-semibold text-slate-200">
            {currentRole === 'ca_admin'
              ? 'CA Rajesh Sharma (FCA) - Partner'
              : currentRole === 'staff'
              ? 'Pooja Verma (Senior Associate) - Assigned 2 Clients'
              : 'Client Upload Portal (Secure Token Access)'}
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
