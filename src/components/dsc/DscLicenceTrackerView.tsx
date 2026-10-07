// src/components/dsc/DscLicenceTrackerView.tsx
import React, { useState } from 'react';
import {
  Key,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  Calendar,
  User,
  HardDrive,
  RefreshCw,
  Award,
} from 'lucide-react';
import { INITIAL_DSC_LICENCES } from '../../services/frontPageDataService.ts';

export const DscLicenceTrackerView: React.FC = () => {
  const [licences, setLicences] = useState(INITIAL_DSC_LICENCES);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [newHolder, setNewHolder] = useState('');
  const [newClient, setNewClient] = useState('Briopox Pvt Ltd');
  const [newType, setNewType] = useState<'Class 3 DSC (Signing)' | 'Class 3 DSC (Combo)' | 'DIN' | 'FSSAI'>('Class 3 DSC (Signing)');
  const [newExpiry, setNewExpiry] = useState('2026-11-30');
  const [newIssuer, setNewIssuer] = useState('eMudhra Ltd');
  const [newLocation, setNewLocation] = useState('Locker Safe #B-14');

  const filteredLicences = licences.filter(l => {
    const matchesType = filterType === 'all' || l.certType.toLowerCase().includes(filterType.toLowerCase());
    const matchesSearch =
      l.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.holderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.certType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const expiringSoonCount = licences.filter(l => l.daysToExpiry <= 30 && l.daysToExpiry >= 0).length;

  const handleAddLicence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolder.trim()) return;

    const diffDays = Math.ceil((new Date(newExpiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    const newCert = {
      id: `dsc_${Date.now()}`,
      clientId: 'cli_briopox_01',
      clientName: newClient,
      holderName: newHolder.trim(),
      holderDesignation: 'Director / Authorized Signatory',
      holderPan: 'ABCDE1234F',
      certType: newType,
      issuer: newIssuer,
      validFrom: new Date().toISOString().split('T')[0],
      expiryDate: newExpiry,
      daysToExpiry: diffDays,
      status: diffDays <= 30 ? 'Expiring Soon' : 'Active',
      storageLocation: newLocation,
      renewalStatus: 'Not Started',
    };

    setLicences([newCert, ...licences]);
    setNewHolder('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">DSC & Statutory Licence Expiry Radar</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Hardware & Token Registry
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track Class 3 DSC USB tokens, DIN KYC status, FSSAI, Trade Licences, and automate 90/60/30/15/7 day client renewal reminders.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-2 bg-[#00c073] hover:bg-[#00a864] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Register Token / Licence</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Active Certificates</span>
            <div className="text-2xl font-extrabold text-slate-800 mt-1">{licences.length} Tokens</div>
            <span className="text-xs text-slate-400">Class 3 & DIN master list</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Key className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Expiring in 30 Days</span>
            <div className="text-2xl font-extrabold text-amber-600 mt-1">{expiringSoonCount} Tokens</div>
            <span className="text-xs text-amber-600 font-semibold">Immediate renewal alert</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Token Locker Custody</span>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1">100% Tracked</div>
            <span className="text-xs text-slate-400">Physical locker mapping</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Radar Interval Badges */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-bold text-slate-700">Statutory Radar Thresholds:</span>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded bg-slate-200 text-slate-700 font-mono font-bold">90 Days Alert</span>
          <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-800 font-mono font-bold">60 Days Follow-up</span>
          <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-800 font-mono font-bold">30 Days WhatsApp</span>
          <span className="px-2.5 py-1 rounded bg-orange-100 text-orange-800 font-mono font-bold">15 Days Urgent</span>
          <span className="px-2.5 py-1 rounded bg-rose-100 text-rose-800 font-mono font-bold animate-pulse">7 Days Final Notice</span>
        </div>
      </div>

      {/* Registry Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="p-3.5">Certificate Type</th>
                <th className="p-3.5">Holder Name & Entity</th>
                <th className="p-3.5">Cert Authority</th>
                <th className="p-3.5">Expiry Date</th>
                <th className="p-3.5">Days to Expiry</th>
                <th className="p-3.5">Physical Locker Custody</th>
                <th className="p-3.5">Renewal Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLicences.map(l => (
                <tr key={l.id} className="hover:bg-slate-50/70 transition">
                  <td className="p-3.5">
                    <span className="font-bold text-slate-800 block text-xs">{l.certType}</span>
                    <span className="font-mono text-[10px] text-slate-400">Valid from: {l.validFrom}</span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-bold text-slate-800 block text-xs">{l.holderName}</span>
                    <span className="text-[11px] text-slate-500 font-medium">{l.clientName}</span>
                  </td>
                  <td className="p-3.5 text-slate-600 font-medium">
                    {l.issuer}
                  </td>
                  <td className="p-3.5 font-bold font-mono text-slate-800">
                    {l.expiryDate}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      l.daysToExpiry <= 7
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : l.daysToExpiry <= 30
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      {l.daysToExpiry} Days Remaining
                    </span>
                  </td>
                  <td className="p-3.5 text-xs text-slate-600 font-medium">
                    {l.storageLocation}
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {l.renewalStatus}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => alert(`Initiating renewal notification for ${l.holderName} via WhatsApp`)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold"
                    >
                      Notify Client
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Certificate Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-800">Register DSC Token / Licence</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleAddLicence} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Holder Name</label>
                <input
                  type="text"
                  required
                  value={newHolder}
                  onChange={e => setNewHolder(e.target.value)}
                  placeholder="e.g. SN Biswas (Director)"
                  className="w-full p-2.5 border rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Client Entity</label>
                  <select
                    value={newClient}
                    onChange={e => setNewClient(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                  >
                    <option value="Briopox Pvt Ltd">Briopox Pvt Ltd</option>
                    <option value="Aggarwal & Sons Trading Co.">Aggarwal & Sons Trading Co.</option>
                    <option value="Apex Healthtech LLP">Apex Healthtech LLP</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Certificate Type</label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value as any)}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                  >
                    <option value="Class 3 DSC (Signing)">Class 3 DSC (Signing)</option>
                    <option value="Class 3 DSC (Combo)">Class 3 DSC (Combo)</option>
                    <option value="DIN">DIN</option>
                    <option value="FSSAI">FSSAI Licence</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Issuer / Cert Authority</label>
                  <input
                    type="text"
                    value={newIssuer}
                    onChange={e => setNewIssuer(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={newExpiry}
                    onChange={e => setNewExpiry(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Physical Locker / Token Safe Slot</label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                  placeholder="e.g. Locker Safe Slot #B-14 (ProxKey Token)"
                  className="w-full p-2.5 border rounded-lg focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00c073] hover:bg-[#00a864] text-white rounded-lg font-bold shadow-xs"
                >
                  Save Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
