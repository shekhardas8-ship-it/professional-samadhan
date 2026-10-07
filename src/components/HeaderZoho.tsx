// src/components/HeaderZoho.tsx
import React, { useState } from 'react';
import {
  Search,
  Plus,
  Bell,
  Settings,
  Grid,
  ChevronDown,
  User,
  ShieldCheck,
  Smartphone,
  RefreshCw,
  LogOut,
  Sparkles,
  Command,
} from 'lucide-react';
import { AuthUser, UserRole } from '../types/index.ts';

interface HeaderZohoProps {
  currentUser: AuthUser | null;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onLogout: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  onOpenQuickCreate: () => void;
  onOpenWhatsAppDevice?: () => void;
  onOpenNotifications?: () => void;
  onOpenSettings?: () => void;
  onSearchQuery?: (q: string) => void;
}

export const HeaderZoho: React.FC<HeaderZohoProps> = ({
  currentUser,
  currentRole,
  onRoleChange,
  onLogout,
  onRefresh,
  isLoading,
  onOpenQuickCreate,
  onOpenWhatsAppDevice,
  onOpenNotifications,
  onOpenSettings,
  onSearchQuery,
}) => {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [appsDropdownOpen, setAppsDropdownOpen] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    if (onSearchQuery) onSearchQuery(e.target.value);
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20 shadow-xs select-none">
      {/* 1. Global Search Bar */}
      <div className="flex-1 max-w-md relative">
        <div
          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border text-sm transition-all ${
            searchFocused
              ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/10 shadow-xs'
              : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80 text-slate-500'
          }`}
        >
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search in Items ( / )"
            value={searchValue}
            onChange={handleSearchChange}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 text-xs sm:text-sm"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-200/70 border border-slate-300/80 rounded">
            /
          </kbd>
        </div>
      </div>

      {/* 2. Right Actions Bar (Matching Zoho Screenshot) */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Trial Expiration & Subscribe Link */}
        <div className="hidden md:flex items-center gap-1.5 text-xs">
          <span className="text-slate-500">Trial expires in 14 days...</span>
          <button
            onClick={() => onOpenSettings && onOpenSettings()}
            className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
          >
            Subscribe
          </button>
        </div>

        {/* User / Firm Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 px-2 py-1 rounded-md hover:bg-slate-100 transition"
          >
            <span className="truncate max-w-[120px]">
              {currentUser?.displayName || 'shekhar'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {currentUser?.displayName || 'CA Shekhar Das (FCA)'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {currentUser?.email || 'admin@quinceca.ai'}
                </p>
                <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 w-fit">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>{currentRole === 'ca_admin' ? 'Managing Partner' : 'Senior Associate'}</span>
                </div>
              </div>

              {/* Role Switcher */}
              <div className="px-3 py-2 border-b border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Active Persona
                </span>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => {
                      onRoleChange('ca_admin');
                      setProfileDropdownOpen(false);
                    }}
                    className={`px-2 py-1 rounded text-xs font-semibold text-center transition ${
                      currentRole === 'ca_admin'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    CA Partner
                  </button>
                  <button
                    onClick={() => {
                      onRoleChange('staff');
                      setProfileDropdownOpen(false);
                    }}
                    className={`px-2 py-1 rounded text-xs font-semibold text-center transition ${
                      currentRole === 'staff'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Staff / Article
                  </button>
                </div>
              </div>

              {/* WhatsApp Device Link */}
              {onOpenWhatsAppDevice && (
                <button
                  onClick={() => {
                    onOpenWhatsAppDevice();
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2 transition"
                >
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp Bot (+91 98738 75138)</span>
                </button>
              )}

              {/* Sign Out */}
              <button
                onClick={() => {
                  setProfileDropdownOpen(false);
                  onLogout();
                }}
                className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition border-t border-slate-100 font-semibold"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>

        {/* 3. Green Quick-Create "+" Action Button (Exactly from Zoho screenshot) */}
        <button
          onClick={onOpenQuickCreate}
          className="w-8 h-8 rounded-lg bg-[#00C975] hover:bg-[#00B066] text-white flex items-center justify-center shadow-sm shadow-[#00C975]/30 transition active:scale-95"
          title="Quick Create (Task, Client, Invoice, Notice)"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* 4. Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg relative transition"
          title="Notifications & Alerts"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
        </button>

        {/* 5. Refresh Data Button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
          title="Refresh All Records"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-500' : ''}`} />
        </button>

        {/* 6. Settings Gear */}
        <button
          onClick={onOpenSettings}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
          title="Settings & Firm Configuration"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* 7. User Avatar Circle */}
        <div
          onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
          className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 border border-slate-300 flex items-center justify-center text-slate-700 font-bold text-xs cursor-pointer hover:ring-2 hover:ring-emerald-500/20 transition"
          title="User Profile"
        >
          <User className="w-4 h-4 text-slate-600" />
        </div>

        {/* 8. 9-Dot App Grid */}
        <button
          onClick={() => setAppsDropdownOpen(!appsDropdownOpen)}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
          title="QuinceCA AI Ecosystem"
        >
          <Grid className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
