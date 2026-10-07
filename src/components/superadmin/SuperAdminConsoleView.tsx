// src/components/superadmin/SuperAdminConsoleView.tsx
import React, { useState } from 'react';
import {
  ShieldAlert,
  Building,
  Users,
  DollarSign,
  TrendingUp,
  Cpu,
  MessageSquare,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Eye,
  Sliders,
  Play,
  Pause,
} from 'lucide-react';
import { INITIAL_SUPER_ADMIN_TENANTS, INITIAL_SUBSCRIPTION_PLANS } from '../../services/frontPageDataService.ts';

export const SuperAdminConsoleView: React.FC = () => {
  const [tenants, setTenants] = useState(INITIAL_SUPER_ADMIN_TENANTS);
  const [plans, setPlans] = useState(INITIAL_SUBSCRIPTION_PLANS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState(false);
  const [newFirmName, setNewFirmName] = useState('');
  const [newPlan, setNewPlan] = useState<'Starter' | 'Professional' | 'AI Automation' | 'Enterprise'>('Professional');
  const [newEmail, setNewEmail] = useState('');
  const [newContact, setNewContact] = useState('');

  const totalMrr = tenants.reduce((sum, t) => sum + t.mrrAmount, 0);
  const totalArr = totalMrr * 12;
  const totalClients = tenants.reduce((sum, t) => sum + t.clientsCount, 0);
  const totalUsers = tenants.reduce((sum, t) => sum + t.usersCount, 0);

  const toggleTenantStatus = (id: string) => {
    setTenants(tenants.map(t => {
      if (t.id === id) {
        return { ...t, status: t.status === 'Active' ? 'Suspended' : 'Active' };
      }
      return t;
    }));
  };

  const handleAddTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirmName.trim()) return;

    const newTen = {
      id: `ten_${Date.now()}`,
      firmName: newFirmName.trim(),
      slug: newFirmName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      planName: newPlan,
      status: 'Active' as const,
      usersCount: 3,
      clientsCount: 15,
      storageMb: 240,
      aiTokensUsed: 12000,
      whatsappMessagesSent: 80,
      mrrAmount: newPlan === 'Starter' ? 1999 : newPlan === 'Professional' ? 4999 : 9999,
      renewalDate: '2027-10-01',
      contactPerson: newContact.trim() || 'Managing Partner',
      contactEmail: newEmail.trim() || 'admin@cafirm.in',
    };

    setTenants([...tenants, newTen]);
    setNewFirmName('');
    setIsAddTenantModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Platform Super Admin & SaaS Engine</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
              Multi-Tenant Cloud Master
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Global tenant provisioning, subscription lifecycle, AI token meters, WhatsApp quotas, and MRR/ARR analytics.
          </p>
        </div>

        <button
          onClick={() => setIsAddTenantModalOpen(true)}
          className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New CA Firm</span>
        </button>
      </div>

      {/* Global SaaS Financial & Usage Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Monthly Recurring Revenue</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">₹{totalMrr.toLocaleString('en-IN')}</div>
          <span className="text-[11px] text-slate-400">ARR: ₹{(totalArr / 100000).toFixed(2)} Lakhs</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Active CA Firm Tenants</span>
          <div className="text-2xl font-extrabold text-slate-800 mt-1">{tenants.length} Firms</div>
          <span className="text-[11px] text-emerald-600 font-semibold">{totalUsers} Active Staff Members</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Total Clients Managed</span>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">{totalClients} Businesses</div>
          <span className="text-[11px] text-slate-400">Across GST, TDS & ROC</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">AI Tokens Consumed</span>
          <div className="text-2xl font-extrabold text-purple-600 mt-1">300.9k</div>
          <span className="text-[11px] text-slate-400">Gemini Vision AI Engine</span>
        </div>
      </div>

      {/* Tenants Registry */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800">Provisioned CA Firm Tenants</h3>
          <span className="text-xs text-slate-500">Strict PostgreSQL Tenant Isolation</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="p-3.5">CA Firm & Domain</th>
                <th className="p-3.5">Subscription Plan</th>
                <th className="p-3.5">Users / Clients</th>
                <th className="p-3.5">AI Token Usage</th>
                <th className="p-3.5">WhatsApp Volume</th>
                <th className="p-3.5">MRR</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {tenants.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/70 transition">
                  <td className="p-3.5">
                    <span className="font-bold text-slate-800 block text-xs">{t.firmName}</span>
                    <span className="font-mono text-[10px] text-slate-400">portal.{t.slug}.quinceca.com</span>
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.planName === 'AI Automation'
                        ? 'bg-purple-100 text-purple-800'
                        : t.planName === 'Enterprise'
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {t.planName}
                    </span>
                  </td>
                  <td className="p-3.5 text-xs text-slate-700">
                    <strong>{t.usersCount}</strong> staff / <strong>{t.clientsCount}</strong> clients
                  </td>
                  <td className="p-3.5 font-mono text-slate-600">
                    {(t.aiTokensUsed / 1000).toFixed(1)}k tokens
                  </td>
                  <td className="p-3.5 font-mono text-slate-600">
                    {t.whatsappMessagesSent} msgs
                  </td>
                  <td className="p-3.5 font-bold font-mono text-slate-800">
                    ₹{t.mrrAmount.toLocaleString('en-IN')}/mo
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      t.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : t.status === 'Trial'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => alert(`Audited Impersonation initiated for ${t.firmName}. Security audit entry generated.`)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold"
                        title="Audited Impersonation for Support"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => toggleTenantStatus(t.id)}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                          t.status === 'Active' ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        }`}
                      >
                        {t.status === 'Active' ? 'Suspend' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Plans Configuration */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-800">Subscription Plans & Quota Management</h3>
            <p className="text-xs text-slate-500">Super Admin configurable pricing, limits, and feature flags.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {plans.map(p => (
            <div key={p.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-800">{p.name}</span>
                <span className="font-mono text-xs font-bold text-emerald-600">₹{p.priceMonthly}/mo</span>
              </div>
              <div className="space-y-1 text-xs text-slate-600">
                <div>• Users limit: <strong>{p.maxUsers}</strong></div>
                <div>• Clients limit: <strong>{p.maxClients}</strong></div>
                <div>• AI Vision credits: <strong>{p.aiCredits}</strong></div>
                <div>• WhatsApp quota: <strong>{p.whatsappCredits}</strong></div>
                <div>• Storage: <strong>{p.maxStorageGb} GB</strong></div>
              </div>
              <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500">
                {p.supportLevel}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Provision Tenant Modal */}
      {isAddTenantModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-800">Provision New CA Firm Tenant</h3>
              <button onClick={() => setIsAddTenantModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleAddTenant} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">CA Firm Name</label>
                <input
                  type="text"
                  required
                  value={newFirmName}
                  onChange={e => setNewFirmName(e.target.value)}
                  placeholder="e.g. Singhania & Partners Chartered Accountants"
                  className="w-full p-2.5 border rounded-lg focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subscription Plan</label>
                <select
                  value={newPlan}
                  onChange={e => setNewPlan(e.target.value as any)}
                  className="w-full p-2.5 border rounded-lg focus:outline-none"
                >
                  <option value="Starter">Starter (₹1,999/mo)</option>
                  <option value="Professional">Professional (₹4,999/mo)</option>
                  <option value="AI Automation">AI Automation (₹9,999/mo)</option>
                  <option value="Enterprise">Enterprise Dedicated (₹24,999/mo)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Managing Partner</label>
                  <input
                    type="text"
                    value={newContact}
                    onChange={e => setNewContact(e.target.value)}
                    placeholder="e.g. CA VK Singhania"
                    className="w-full p-2.5 border rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Admin Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="partner@firm.in"
                    className="w-full p-2.5 border rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddTenantModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-xs"
                >
                  Provision Firm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
