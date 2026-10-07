// src/components/NoticesDscView.tsx
import React, { useState } from 'react';
import {
  Shield,
  Key,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Building,
  User,
  ExternalLink,
  Plus,
  Search,
  FileText,
  BadgeAlert,
} from 'lucide-react';

interface NoticeItem {
  id: string;
  clientName: string;
  department: 'GST' | 'Income Tax' | 'TDS' | 'MCA';
  noticeNumber: string;
  issuedDate: string;
  hearingDeadline: string;
  priority: 'High' | 'Critical' | 'Medium';
  assignedStaff: string;
  status: 'Pending Response' | 'Drafting' | 'Submitted' | 'Closed';
  penaltyRisk: string;
}

interface DscItem {
  id: string;
  holderName: string;
  clientName: string;
  role: 'Director' | 'Partner CA' | 'Authorized Signatory';
  dscType: 'Class 3 USB Token' | 'Signing DSC' | 'DIN KYC';
  expiryDate: string;
  daysRemaining: number;
  status: 'Urgent' | 'Attention' | 'Valid';
}

export const NoticesDscView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'notices' | 'dsc'>('notices');
  const [searchQuery, setSearchQuery] = useState('');

  const [notices, setNotices] = useState<NoticeItem[]>([
    {
      id: 'not_01',
      clientName: 'Briopox Technologies Pvt Ltd',
      department: 'GST',
      noticeNumber: 'DRC-01A/2026/0912',
      issuedDate: '24 Sep 2026',
      hearingDeadline: '14 Oct 2026',
      priority: 'Critical',
      assignedStaff: 'CA Suraj Dutta',
      status: 'Drafting',
      penaltyRisk: '₹1,42,000 (GSTR-2B vs 3B ITC mismatch)',
    },
    {
      id: 'not_02',
      clientName: 'AeroLogistics Supply Chain',
      department: 'Income Tax',
      noticeNumber: 'ITBA/AST/S/148A/2026-27',
      issuedDate: '15 Sep 2026',
      hearingDeadline: '20 Oct 2026',
      priority: 'High',
      assignedStaff: 'Pooja Verma',
      status: 'Pending Response',
      penaltyRisk: 'Information gathering under Sec 148A',
    },
    {
      id: 'not_03',
      clientName: 'Zenith Engineering Works',
      department: 'TDS',
      noticeNumber: 'TRACES/200A/26Q-Q1',
      issuedDate: '28 Sep 2026',
      hearingDeadline: '30 Oct 2026',
      priority: 'Medium',
      assignedStaff: 'Pooja Verma',
      status: 'Pending Response',
      penaltyRisk: 'Late deduction interest ₹4,850',
    },
  ]);

  const [dscs, setDscs] = useState<DscItem[]>([
    {
      id: 'dsc_01',
      holderName: 'Rahul Mehra',
      clientName: 'Briopox Technologies Pvt Ltd',
      role: 'Director',
      dscType: 'Class 3 USB Token',
      expiryDate: '19 Oct 2026',
      daysRemaining: 14,
      status: 'Urgent',
    },
    {
      id: 'dsc_02',
      holderName: 'CA Suraj Dutta (FCA)',
      clientName: 'Internal Practice Firm',
      role: 'Partner CA',
      dscType: 'Signing DSC',
      expiryDate: '27 Oct 2026',
      daysRemaining: 22,
      status: 'Attention',
    },
    {
      id: 'dsc_03',
      holderName: 'Priya Sharma',
      clientName: 'AeroLogistics Supply Chain',
      role: 'Authorized Signatory',
      dscType: 'Class 3 USB Token',
      expiryDate: '12 Nov 2026',
      daysRemaining: 38,
      status: 'Valid',
    },
  ]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-xl p-6 text-white border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Department Scrutiny & Credentials
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Notices & DSC Expiry Management
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Centralized scrutiny tracking for Income Tax, GST, TDS, and MCA notices along with 90-day DSC expiration radar.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('notices')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'notices'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              Department Notices ({notices.length})
            </button>
            <button
              onClick={() => setActiveTab('dsc')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'dsc'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              DSC Expiry Radar ({dscs.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'notices' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Active Department Notices & Scrutinies</h2>
            <button
              onClick={() => alert('Log Notice Dialog initialized.')}
              className="px-3 py-1.5 bg-[#00C975] text-white rounded-lg text-xs font-bold hover:bg-[#00B066] flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log New Notice</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-bold">Client Company</th>
                  <th className="py-3 px-4 font-bold">Department</th>
                  <th className="py-3 px-4 font-bold">Notice Ref / Number</th>
                  <th className="py-3 px-4 font-bold">Deadline</th>
                  <th className="py-3 px-4 font-bold">Assigned To</th>
                  <th className="py-3 px-4 font-bold">Risk / Cause</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notices.map(n => (
                  <tr key={n.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{n.clientName}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold px-2 py-0.5 rounded text-[10px] bg-slate-100 border border-slate-200">
                        {n.department}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-700">{n.noticeNumber}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-rose-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{n.hearingDeadline}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{n.assignedStaff}</td>
                    <td className="py-3 px-4 text-slate-600 text-[11px] max-w-[200px] truncate">{n.penaltyRisk}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        {n.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">DSC, DIN & Digital Token Tracker</h2>
              <p className="text-[11px] text-slate-500">
                Automated 90/60/30/15/7-day renewal warnings to prevent statutory filing blocks.
              </p>
            </div>
            <button
              onClick={() => alert('Register DSC Dialog initialized.')}
              className="px-3 py-1.5 bg-[#00C975] text-white rounded-lg text-xs font-bold hover:bg-[#00B066] flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Certificate</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-bold">Signatory / Holder</th>
                  <th className="py-3 px-4 font-bold">Client / Entity</th>
                  <th className="py-3 px-4 font-bold">Role</th>
                  <th className="py-3 px-4 font-bold">Token Type</th>
                  <th className="py-3 px-4 font-bold">Expiry Date</th>
                  <th className="py-3 px-4 font-bold">Countdown</th>
                  <th className="py-3 px-4 font-bold">Alert Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dscs.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{d.holderName}</td>
                    <td className="py-3 px-4 text-slate-700">{d.clientName}</td>
                    <td className="py-3 px-4 text-slate-600">{d.role}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{d.dscType}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{d.expiryDate}</td>
                    <td className="py-3 px-4">
                      <span className={`font-bold ${d.daysRemaining <= 15 ? 'text-rose-600' : 'text-amber-600'}`}>
                        {d.daysRemaining} Days Left
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          d.status === 'Urgent'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : d.status === 'Attention'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
