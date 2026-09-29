// src/components/LoginPage.tsx
import React, { useState } from 'react';
import { AuthUser, UserRole } from '../types/index.ts';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  UserCheck,
  Building2,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { PaletteSwitcher } from './PaletteSwitcher.tsx';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
  onDirectClientAccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onDirectClientAccess }) => {
  const [selectedRole, setSelectedRole] = useState<'ca_admin' | 'staff'>('ca_admin');
  const [identifier, setIdentifier] = useState('ca@professionalsamadhan.in');
  const [password, setPassword] = useState('Samadhan@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Switch role tab helper
  const handleRoleSelect = (role: 'ca_admin' | 'staff') => {
    setSelectedRole(role);
    setErrorMessage(null);
    if (role === 'ca_admin') {
      setIdentifier('ca@professionalsamadhan.in');
      setPassword('Samadhan@2026');
    } else {
      setIdentifier('pooja@professionalsamadhan.in');
      setPassword('Staff@2026');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage(selectedRole === 'client' ? 'Please enter your Business GSTIN or Mobile number.' : 'Please enter your professional email address.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password: password.trim(),
          role: selectedRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify your credentials.');
      }

      // Store in localStorage for session persistence
      localStorage.setItem('ps_auth_user', JSON.stringify(data.user));
      onLoginSuccess(data.user);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Watermark */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.035] select-none">
        <img
          src="/logo.jpg"
          alt=""
          className="w-[600px] h-[600px] object-contain filter grayscale contrast-150 rotate-[-12deg]"
        />
      </div>

      {/* Decorative gradient glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-teal-600/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-cyan-600/10 blur-3xl pointer-events-none" />

      {/* Header bar with Palette Switcher */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between px-2 relative z-10">
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>Statutory 256-Bit Encrypted Portal</span>
        </div>
        <PaletteSwitcher />
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        {/* Brand Logo & Title */}
        <div className="text-center mb-6">
          <div className="inline-block relative mb-3">
            <img
              src="/logo.jpg"
              alt="Professional Samadhan Logo"
              className="w-20 h-20 rounded-2xl object-cover shadow-xl border-2 border-white/20 mx-auto"
            />
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-teal-500 border-2 border-slate-900 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-slate-950" />
            </span>
          </div>

          <h1 className="text-2xl font-bold text-white tracking-tight">Professional Samadhan</h1>
          <p className="text-xs text-teal-400 font-medium tracking-wide uppercase mt-1">
            Chartered Accountants • Practice System
          </p>
        </div>

        {/* Persona Selector Tabs: CA Partner and Staff only */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => handleRoleSelect('ca_admin')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              selectedRole === 'ca_admin'
                ? 'bg-[var(--theme-primary)] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>CA Partner (Suraj Dutta)</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleSelect('staff')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              selectedRole === 'staff'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>CA Staff (Pooja Verma)</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-950/80 border border-rose-700/60 rounded-xl text-rose-200 text-xs flex items-start space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Professional Email / Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="name@professionalsamadhan.in"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300">Password</label>
              <span className="text-[11px] text-slate-500">Default: Samadhan@2026</span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your security password"
                className="w-full pl-9 pr-10 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Quick Demo Pre-fill helper */}
          <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              <span>
                {selectedRole === 'ca_admin'
                  ? 'CA Suraj Dutta (Senior Partner)'
                  : 'Pooja Verma (Associate)'}
              </span>
            </span>
            <button
              type="button"
              onClick={() => {
                if (selectedRole === 'ca_admin') {
                  setIdentifier('ca@professionalsamadhan.in');
                  setPassword('Samadhan@2026');
                } else {
                  setIdentifier('pooja@professionalsamadhan.in');
                  setPassword('Staff@2026');
                }
              }}
              className="text-teal-400 hover:text-teal-300 font-semibold"
            >
              Reset Sample
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white shadow-lg flex items-center justify-center space-x-2 transition-all transform active:scale-[0.98] theme-btn-primary"
          >
            {loading ? (
              <span>Verifying Authentic Session...</span>
            ) : (
              <>
                <span>Sign In to CA Practice System</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Direct Client Access Section (No Login Required) */}
        <div className="mt-5 pt-4 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400 mb-2.5">
            Are you a business client looking to upload invoices & review GST filings?
          </p>
          <button
            type="button"
            onClick={() => {
              if (onDirectClientAccess) {
                onDirectClientAccess();
              } else {
                window.location.href = '/client-portal';
              }
            }}
            className="w-full py-2.5 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition shadow-sm"
          >
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>Direct Client Portal (No Login Required)</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-500">
          Statutory Audit Working Paper Engine • Confidential CA Records
        </div>
      </div>
    </div>
  );
};
