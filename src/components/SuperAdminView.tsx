// src/components/SuperAdminView.tsx
import React, { useState } from 'react';
import {
  Layers,
  Building,
  TrendingUp,
  Users,
  ShieldAlert,
  Server,
  Activity,
  CreditCard,
  MessageSquare,
  HardDrive,
  Cpu,
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MoreVertical,
  ExternalLink,
} from 'lucide-react';

interface TenantRecord {
  id: string;
  firmName: string;
  domain: string;
  adminName: string;
  adminEmail: string;
  plan: 'Starter' | 'Professional' | 'AI Automation' | 'Enterprise';
  status: 'Active' | 'Trial' | 'Suspended';
  usersCount: number;
  clientsCount: number;
  aiCreditsUsed: number;
  aiCreditsLimit: number;
  whatsAppMessagesCount: number;
  storageGb: number;
  joinedDate: string;
}

export const SuperAdminView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');

  const [tenants, setTenants] = useState<TenantRecord[]>([
    {
      id: 'ten_01',
      firmName: 'Suraj Dutta & Associates, CAs',
      domain: 'app.quinceca.ai',
      adminName: 'CA Suraj Dutta (FCA)',
      adminEmail: 'suraj@duttaca.in',
      plan: 'AI Automation',
      status: 'Active',
      usersCount: 8,
      clientsCount: 25,
      aiCreditsUsed: 840,
      aiCreditsLimit: 2000,
      whatsAppMessagesCount: 342,
      storageGb: 4.2,
      joinedDate: '2026-01-15',
    },
    {
      id: 'ten_02',
      firmName: 'KPMG Advisory India Partner Office',
      domain: 'portal.kpmgpartner.in',
      adminName: 'Anil Singhania (Senior Partner)',
      adminEmail: 'anil@kpmgpartner.in',
      plan: 'Enterprise',
      status: 'Active',
      usersCount: 42,
      clientsCount: 180,
      aiCreditsUsed: 8900,
      aiCreditsLimit: 25000,
      whatsAppMessagesCount: 2150,
      storageGb: 45.8,
      joinedDate: '2025-11-20',
    },
    {
      id: 'ten_03',
      firmName: 'Mehta & Goel Chartered Accountants',
      domain: 'mehtagoel.quinceca.ai',
      adminName: 'CA Rajesh Mehta',
      adminEmail: 'rajesh@mehtagoel.com',
      plan: 'Professional',
      status: 'Trial',
      usersCount: 4,
      clientsCount: 14,
      aiCreditsUsed: 120,
      aiCreditsLimit: 500,
      whatsAppMessagesCount: 88,
      storageGb: 1.5,
      joinedDate: '2026-09-28',
    },
    {
      id: 'ten_04',
      firmName: 'Agarwal Tax Consultants LLP',
      domain: 'agarwal.quinceca.ai',
      adminName: 'Sunita Agarwal',
      adminEmail: 'sunita@agarwaltax.in',
      plan: 'Starter',
      status: 'Suspended',
      usersCount: 2,
      clientsCount: 6,
      aiCreditsUsed: 495,
      aiCreditsLimit: 500,
      whatsAppMessagesCount: 15,
      storageGb: 0.8,
      joinedDate: '2026-03-10',
    },
  ]);

  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(t => t.status === 'Active').length;
  const trialTenants = tenants.filter(t => t.status === 'Trial').length;
  const totalPlatformUsers = tenants.reduce((acc, t) => acc + t.usersCount, 0);
  const totalPlatformClients = tenants.reduce((acc, t) => acc + t.clientsCount, 0);
  const mrr = 248500; // INR
  const arr = mrr * 12;

  const handleToggleStatus = (tenantId: string) => {
    setTenants(prev =>
      prev.map(t => {
        if (t.id === tenantId) {
          const nextStatus = t.status === 'Active' ? 'Suspended' : 'Active';
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  const filteredTenants = tenants.filter(t => {
    const matchSearch =
      t.firmName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.adminEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchPlan = filterPlan === 'all' || t.plan.toLowerCase() === filterPlan.toLowerCase();
    return matchSearch && matchPlan;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Banner */}
      <div className="bg-slate-900 rounded-xl p-6 text-white border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Multi-Tenant Architecture Control
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Platform Super Admin Console
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Manage CA firm tenants, subscription tiers, resource quotas, AI tokens, and platform observability.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Platform MRR
              </span>
              <span className="text-xl font-extrabold text-emerald-400 font-mono">
                ₹{mrr.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-400 text-xs font-medium mb-1">Total CA Firms</div>
          <div className="text-xl font-bold text-slate-900">{totalTenants}</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">100% Isolated</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-400 text-xs font-medium mb-1">Active Accounts</div>
          <div className="text-xl font-bold text-emerald-600">{activeTenants}</div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">{trialTenants} Trial</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-400 text-xs font-medium mb-1">Total Users</div>
          <div className="text-xl font-bold text-slate-900">{totalPlatformUsers}</div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">Partners & Staff</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-400 text-xs font-medium mb-1">Total Clients</div>
          <div className="text-xl font-bold text-slate-900">{totalPlatformClients}</div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">Corporate & SME</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-400 text-xs font-medium mb-1">AI Usage</div>
          <div className="text-xl font-bold text-indigo-600">9,860</div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">Tokens & OCR</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-400 text-xs font-medium mb-1">System Health</div>
          <div className="text-xl font-bold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>99.98%</span>
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">Zero Failed Jobs</div>
        </div>
      </div>

      {/* 3. Tenants Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-800">CA Firm Tenants & Subscriptions</h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search firm or admin..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <select
              value={filterPlan}
              onChange={e => setFilterPlan(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-slate-700"
            >
              <option value="all">All Plans</option>
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="ai automation">AI Automation</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 font-bold">CA Firm / Tenant</th>
                <th className="py-3 px-4 font-bold">Admin Contact</th>
                <th className="py-3 px-4 font-bold">Plan Tier</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold">Users / Clients</th>
                <th className="py-3 px-4 font-bold">AI Quota</th>
                <th className="py-3 px-4 font-bold">WhatsApp</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTenants.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{t.firmName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{t.domain}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-800 font-medium">{t.adminName}</div>
                    <div className="text-[11px] text-slate-500">{t.adminEmail}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {t.plan}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[10px] ${
                        t.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : t.status === 'Trial'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    <span className="font-bold">{t.usersCount}</span> users /{' '}
                    <span className="font-bold">{t.clientsCount}</span> clients
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-[11px] font-semibold text-slate-700">
                      {t.aiCreditsUsed} / {t.aiCreditsLimit}
                    </div>
                    <div className="w-20 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${(t.aiCreditsUsed / t.aiCreditsLimit) * 100}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {t.whatsAppMessagesCount} msgs
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleToggleStatus(t.id)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                        t.status === 'Active'
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {t.status === 'Active' ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
