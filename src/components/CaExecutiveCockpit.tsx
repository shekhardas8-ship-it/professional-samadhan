// src/components/CaExecutiveCockpit.tsx
import React, { useState } from 'react';
import { MonthlyRequest, Client } from '../types/index.ts';
import {
  Users,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquare,
  ShieldCheck,
  HardDrive,
  Play,
  ArrowRight,
  TrendingUp,
  PlusCircle,
  Building2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { ClientManagementModal } from './ClientManagementModal.tsx';

interface CaExecutiveCockpitProps {
  requests: MonthlyRequest[];
  onNavigateTab: (tab: string) => void;
  onTriggerSchedule: () => Promise<void>;
  onOpenNewClientModal: () => void;
  onRefreshParent?: () => void;
  isActionLoading: boolean;
}

export const CaExecutiveCockpit: React.FC<CaExecutiveCockpitProps> = ({
  requests,
  onNavigateTab,
  onTriggerSchedule,
  onOpenNewClientModal,
  onRefreshParent,
  isActionLoading,
}) => {
  // Compute high-level executive statistics
  const totalClients = requests.length;
  const awaitingUploads = requests.filter(r => r.status === 'Awaiting Uploads' || r.status === 'Requested').length;
  const needsReview = requests.filter(r => r.status === 'Needs Review' || r.status === 'Missing Documents').length;
  const readyOrApproved = requests.filter(r => r.status === 'Client Confirmed' || r.status === 'CA Approved').length;
  const currentPeriod = requests[0]?.reportingMonth || 'August 2026';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Executive Chartered Accountant Banner */}
      <div className="theme-banner text-white rounded-3xl p-6 sm:p-8 shadow-xl border relative overflow-hidden">
        {/* Subtle Watermark */}
        <div className="absolute right-0 bottom-0 pointer-events-none opacity-[0.05] select-none translate-x-10 translate-y-10">
          <img src="/logo.jpg" alt="" className="w-80 h-80 object-contain filter grayscale contrast-125" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center space-x-4">
            <img
              src="/logo.jpg"
              alt="Professional Samadhan"
              className="w-16 h-16 rounded-2xl object-cover shadow-xl border-2 border-white/20 shrink-0"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase tracking-wider theme-accent-text font-bold">
                  Professional Samadhan • Chartered Accountants
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full theme-badge border font-semibold">
                  Practice Cockpit
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
                CA Suraj Dutta (FCA)
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-teal-300" />
                <span>Active Statutory Period: <strong>{currentPeriod}</strong></span>
                <span>•</span>
                <span>Firms in Portfolio: <strong>{totalClients} Companies</strong></span>
              </p>
            </div>
          </div>

          {/* Quick Primary Actions for Chartered Accountant */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenNewClientModal}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition flex items-center space-x-2"
              title="Register a new business under practice management"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Onboard Client</span>
            </button>

            <button
              onClick={onTriggerSchedule}
              disabled={isActionLoading}
              className="px-4 py-2.5 theme-btn-primary text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition flex items-center space-x-2"
              title="Trigger automatic 1st-of-month GST intake schedule"
            >
              <Play className="w-4 h-4" />
              <span>{isActionLoading ? 'Processing...' : 'Run 1st-of-Month Intake'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. High-Level Executive Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Clients */}
        <div
          onClick={() => onNavigateTab('clients')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Clients Portfolio</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalClients}</span>
            <span className="text-xs font-medium text-emerald-600 flex items-center">
              Active Businesses
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center group-hover:text-blue-600 transition-colors">
            <span>Manage Master Directory</span>
            <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 2: Awaiting Uploads */}
        <div
          onClick={() => onNavigateTab('gst-pipeline')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Uploads</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{awaitingUploads}</span>
            <span className="text-xs font-medium text-amber-600">Awaiting Files</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center group-hover:text-amber-600 transition-colors">
            <span>View GST Intake Status</span>
            <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 3: Audit Review */}
        <div
          onClick={() => onNavigateTab('gst-pipeline')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Needs Review</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{needsReview}</span>
            <span className="text-xs font-medium text-purple-600">Workbooks</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center group-hover:text-purple-600 transition-colors">
            <span>Perform CA Review</span>
            <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 4: Compliance Ready */}
        <div
          onClick={() => onNavigateTab('gst-pipeline')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Statutory Ready</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{readyOrApproved}</span>
            <span className="text-xs font-medium text-emerald-600">Ready to File</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center group-hover:text-emerald-600 transition-colors">
            <span>Approved & Confirmed</span>
            <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* 3. Core Chartered Accountant Modules (Clean, Uncluttered Navigation) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Practice Management Modules</h2>
            <p className="text-xs text-slate-500">Access focused operational areas for your statutory client accounts</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Module 1: Clients Directory */}
          <div
            onClick={() => onNavigateTab('clients')}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-500/60 transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                Clients Directory & KYC
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                View client master profiles, GSTIN numbers, contact details, assigned staff, bank accounts, and required document checklists.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-700">
              <span>{totalClients} Registered Businesses</span>
              <span className="flex items-center group-hover:translate-x-1 transition-transform">
                Open Directory <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </span>
            </div>
          </div>

          {/* Module 2: GST Document Intake & Compliance */}
          <div
            onClick={() => onNavigateTab('gst-pipeline')}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-500/60 transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                GST Document Pipeline
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Track monthly document intake, purchase vs sales classifications, duplicate invoice suppression, and statutory workbooks.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-700">
              <span>Period: {currentPeriod}</span>
              <span className="flex items-center group-hover:translate-x-1 transition-transform">
                View Filings <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </span>
            </div>
          </div>

          {/* Module 3: Communications & WhatsApp Logs */}
          <div
            onClick={() => onNavigateTab('audit-logs')}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-500/60 transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                WhatsApp & Audit Dispatches
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Inspect statutory notice dispatches, automated reminder cadences, client receipts, and verifiable delivery audit logs.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700">
              <span>Delivery Audit Trail</span>
              <span className="flex items-center group-hover:translate-x-1 transition-transform">
                Inspect Logs <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Priority Action Items (Focus for the Chartered Accountant) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">Priority Action Items for Partner Attention</h3>
          </div>
          <button
            onClick={() => onNavigateTab('gst-pipeline')}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800"
          >
            View Complete Pipeline
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {requests.slice(0, 3).map(req => (
            <div
              key={req.id}
              onClick={() => onNavigateTab('gst-pipeline')}
              className="py-3 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-xl transition cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs">
                  {req.clientName?.charAt(0) || 'C'}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{req.clientName}</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    GSTIN: {req.clientGstin} • Period: {req.reportingMonth}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {req.status}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
