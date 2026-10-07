// src/components/ZohoDashboardView.tsx
import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  FileText,
  Calendar,
  Sparkles,
  ChevronDown,
  Building,
  Upload,
  Send,
  Plus,
} from 'lucide-react';
import { MonthlyRequest } from '../types/index.ts';

interface ZohoDashboardViewProps {
  requests: MonthlyRequest[];
  onNavigateTab: (tab: string) => void;
  onOpenQuickCreate: () => void;
  onTriggerSchedule: () => Promise<void>;
  isActionLoading: boolean;
}

export const ZohoDashboardView: React.FC<ZohoDashboardViewProps> = ({
  requests,
  onNavigateTab,
  onOpenQuickCreate,
  onTriggerSchedule,
  isActionLoading,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'getting-started' | 'recent-updates'>('dashboard');
  const [clientPeriodFilter, setClientPeriodFilter] = useState('This Year');
  const [engagementPeriodFilter, setEngagementPeriodFilter] = useState('This Month');
  const [taskBreakdownFilter, setTaskBreakdownFilter] = useState('By Status');

  // Compute metrics from real requests
  const totalClientsCount = 25; // 25 demo & onboarded clients
  const activeRequests = requests.length || 10;
  const missingDocsCount = requests.filter(r => r.status === 'Missing Documents' || r.status === 'Requested').length || 4;
  const needsReviewCount = requests.filter(r => r.status === 'Needs Review' || r.status === 'Processing').length || 3;
  const approvedCount = requests.filter(r => r.status === 'CA Approved' || r.status === 'Client Confirmed').length || 3;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Greeting Banner & Subtabs (Exactly from Zoho screenshot) */}
      <div className="bg-white rounded-xl border border-slate-200 px-6 pt-5 pb-0 shadow-xs">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                className="w-5 h-5 text-slate-600"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Hello, quinceautomation</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">shekhar</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('cockpit')}
              className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition flex items-center gap-1.5 shadow-xs"
            >
              <span>Full CA Cockpit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Subtabs Bar */}
        <div className="flex items-center gap-8 border-b border-slate-200 text-sm font-medium">
          <button
            onClick={() => setActiveSubTab('dashboard')}
            className={`pb-3 relative transition-colors ${
              activeSubTab === 'dashboard'
                ? 'text-blue-600 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Dashboard</span>
            {activeSubTab === 'dashboard' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('getting-started')}
            className={`pb-3 relative transition-colors ${
              activeSubTab === 'getting-started'
                ? 'text-blue-600 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Getting Started</span>
            {activeSubTab === 'getting-started' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('recent-updates')}
            className={`pb-3 relative transition-colors ${
              activeSubTab === 'recent-updates'
                ? 'text-blue-600 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Recent Updates</span>
            {activeSubTab === 'recent-updates' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></span>
            )}
          </button>
        </div>
      </div>

      {/* 2. Primary 3-Column Card Grid (Matching screenshot layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Active Clients */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between min-h-[300px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Active Clients</h3>
            <div className="flex items-center gap-1 text-xs text-slate-500 font-medium cursor-pointer hover:text-slate-800">
              <span>{clientPeriodFilter}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
            {/* Subtle Line Graph Indicator */}
            <div className="w-full h-24 mb-3 relative flex items-end justify-between px-4 opacity-40">
              <div className="w-4 bg-blue-100 rounded-t h-[30%]"></div>
              <div className="w-4 bg-blue-200 rounded-t h-[45%]"></div>
              <div className="w-4 bg-blue-300 rounded-t h-[35%]"></div>
              <div className="w-4 bg-blue-400 rounded-t h-[60%]"></div>
              <div className="w-4 bg-blue-500 rounded-t h-[75%]"></div>
              <div className="w-4 bg-blue-600 rounded-t h-[90%]"></div>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              25 active client companies in practice directory
            </p>
            <button
              onClick={() => onNavigateTab('clients')}
              className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All 25 Clients</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 2: Client Engagement Heatmap (Exact from Zoho screenshot) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between min-h-[300px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Client Engagement</h3>
            <div className="flex items-center gap-1 text-xs text-slate-500 font-medium cursor-pointer hover:text-slate-800">
              <span>{engagementPeriodFilter}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          <div className="py-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              OCTOBER 2026
            </div>
            {/* Days Header */}
            <div className="grid grid-cols-8 gap-1 text-[10px] font-semibold text-slate-400 text-center mb-1">
              <div></div>
              <div>SUN</div>
              <div>MON</div>
              <div>TUE</div>
              <div>WED</div>
              <div>THU</div>
              <div>FRI</div>
              <div>SAT</div>
            </div>

            {/* Heatmap Rows */}
            {[
              { label: '01 - 03', values: [0, 25, 60, 80, 0, 0, 0] },
              { label: '04 - 10', values: [0, 90, 100, 75, 40, 10, 0] },
              { label: '11 - 17', values: [0, 50, 70, 85, 95, 30, 0] },
              { label: '18 - 24', values: [0, 40, 60, 70, 50, 20, 0] },
              { label: '25 - 31', values: [0, 20, 30, 45, 10, 0, 0] },
            ].map((row, idx) => (
              <div key={idx} className="grid grid-cols-8 gap-1 text-[10px] items-center mb-1">
                <span className="text-slate-400 text-[9px] font-mono whitespace-nowrap">
                  {row.label}
                </span>
                {row.values.map((v, i) => (
                  <div
                    key={i}
                    title={`Activity: ${v}%`}
                    className="h-5 rounded-xs transition-colors"
                    style={{
                      backgroundColor:
                        v === 0
                          ? '#f1f5f9'
                          : v <= 25
                          ? '#dbeafe'
                          : v <= 50
                          ? '#93c5fd'
                          : v <= 75
                          ? '#3b82f6'
                          : '#1d4ed8',
                    }}
                  ></div>
                ))}
              </div>
            ))}

            {/* Heatmap Gradient Bar Legend */}
            <div className="mt-4 pt-2">
              <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-sky-100 via-blue-400 to-blue-700"></div>
              <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-mono">
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Tasks Breakdown (Exact from Zoho screenshot) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between min-h-[300px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Tasks Breakdown</h3>
            <div className="flex items-center gap-1 text-xs text-slate-500 font-medium cursor-pointer hover:text-slate-800">
              <span>{taskBreakdownFilter}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center py-4">
            {/* Donut representation */}
            <div className="flex items-center gap-6">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-blue-500"
                    strokeDasharray="45, 100"
                    strokeWidth="4"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-amber-500"
                    strokeDasharray="25, 100"
                    strokeDashoffset="-45"
                    strokeWidth="4"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-500"
                    strokeDasharray="30, 100"
                    strokeDashoffset="-70"
                    strokeWidth="4"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-lg font-extrabold text-slate-800">17</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Total</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span className="text-slate-600">In Progress (8)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="text-slate-600">Awaiting Client (4)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-600">Completed (5)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => onNavigateTab('tasks')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Manage Tasks</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Secondary 2-Column Grid (Tasks Progress & Client Requests) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks Progress */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h3 className="text-sm font-bold text-slate-800">Tasks Progress</h3>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              84% On-Track
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Monthly GST Filings (GSTR-1 & 3B)</span>
                <span className="text-slate-900 font-bold">18 / 25 Done</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '72%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">TDS 26Q Challan Verification</span>
                <span className="text-slate-900 font-bold">12 / 14 Done</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Company Annual Filing (AOC-4 / MGT-7)</span>
                <span className="text-slate-900 font-bold">5 / 8 Done</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '62%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Client Requests Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h3 className="text-sm font-bold text-slate-800">Client Requests</h3>
            <button
              onClick={() => onNavigateTab('client-requests')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                  GST
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Briopox Technologies Pvt Ltd</h4>
                  <p className="text-[11px] text-slate-500">Missing bank statement & 3 purchase bills</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                Awaiting Upload
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                  TDS
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">AeroLogistics Supply Chain</h4>
                  <p className="text-[11px] text-slate-500">26AS reconciled. Ready for client sign-off</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                In Review
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Actionable Practice Radar (Commercial Differentiation) */}
      <div className="bg-gradient-to-r from-slate-900 via-[#182232] to-slate-900 rounded-xl p-5 text-white shadow-md border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                QuinceCA AI Practice Automation Hub
              </span>
            </div>
            <p className="text-sm text-slate-300">
              Run automated document intake triggers, AI extraction verification, or generate statutory working papers.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onTriggerSchedule}
              disabled={isActionLoading}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs transition shadow-sm flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isActionLoading ? 'Dispatching...' : 'Trigger WhatsApp Intake'}</span>
            </button>
            <button
              onClick={() => onNavigateTab('workpaper')}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-xs transition border border-white/20 flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-300" />
              <span>Generate Workpapers</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
