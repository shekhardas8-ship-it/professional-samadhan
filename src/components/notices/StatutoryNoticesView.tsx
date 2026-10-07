// src/components/notices/StatutoryNoticesView.tsx
import React, { useState } from 'react';
import {
  AlertCircle,
  FileText,
  Calendar,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  DollarSign,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { INITIAL_STATUTORY_NOTICES } from '../../services/frontPageDataService.ts';

export const StatutoryNoticesView: React.FC = () => {
  const [notices, setNotices] = useState<any[]>(() => {
    if (typeof window === 'undefined') return INITIAL_STATUTORY_NOTICES;
    const saved = localStorage.getItem('ps_statutory_notices');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return INITIAL_STATUTORY_NOTICES;
  });

  const persistNotices = (updated: any[]) => {
    setNotices(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ps_statutory_notices', JSON.stringify(updated));
      window.dispatchEvent(new Event('ps_data_updated'));
    }
  };

  React.useEffect(() => {
    const handleSync = () => {
      const saved = localStorage.getItem('ps_statutory_notices');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setNotices(parsed);
        } catch {}
      }
    };
    window.addEventListener('ps_data_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('ps_data_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNoticeForReply, setSelectedNoticeForReply] = useState<any | null>(null);
  const [isNewNoticeModalOpen, setIsNewNoticeModalOpen] = useState(false);
  const [replyText, setReplyText] = useState('');

  // New Notice form states
  const [newNoticeClient, setNewNoticeClient] = useState('Briopox Pvt Ltd');
  const [newNoticeDept, setNewNoticeDept] = useState<'GST' | 'Income Tax' | 'TDS' | 'ROC'>('GST');
  const [newNoticeNumber, setNewNoticeNumber] = useState('');
  const [newNoticeType, setNewNoticeType] = useState('ASMT-10 (Discrepancy in GSTR-3B vs 2B)');
  const [newNoticeDueDate, setNewNoticeDueDate] = useState('2026-10-25');
  const [newNoticeDemand, setNewNoticeDemand] = useState('50000');

  const filteredNotices = notices.filter(n => {
    const matchesDept = departmentFilter === 'all' || n.department.toLowerCase() === departmentFilter.toLowerCase();
    const matchesSearch =
      n.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.noticeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.noticeType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const totalDemand = notices.reduce((sum, n) => sum + (n.demandAmount || 0), 0);

  const handleCreateNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeNumber.trim()) return;

    const newNotice = {
      id: `not_${Date.now()}`,
      clientId: 'cli_briopox_01',
      clientName: newNoticeClient,
      clientGstin: '07AABCB9123D1ZX',
      department: newNoticeDept,
      noticeNumber: newNoticeNumber.trim(),
      noticeDate: new Date().toISOString().split('T')[0],
      dueDate: newNoticeDueDate,
      daysRemaining: 15,
      noticeType: newNoticeType,
      status: 'Received',
      assignedEmployeeName: 'Pooja Verma (Senior Associate)',
      demandAmount: parseFloat(newNoticeDemand) || 0,
      penaltyAmount: 0,
      priority: 'High',
      responseNotes: 'Notice received and logged. Initial assessment initiated.',
      documentsCount: 1,
    };

    persistNotices([newNotice, ...notices]);
    setNewNoticeNumber('');
    setIsNewNoticeModalOpen(false);
  };

  const handleSaveReply = () => {
    if (!selectedNoticeForReply) return;
    const updated = notices.map(n => {
      if (n.id === selectedNoticeForReply.id) {
        return {
          ...n,
          status: 'Replied',
          responseNotes: replyText.trim() || n.responseNotes,
        };
      }
      return n;
    });
    persistNotices(updated);
    setSelectedNoticeForReply(null);
    setReplyText('');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Statutory Notices & Litigation Management</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
              High Risk / Statutory Radar
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Centralized register for GST (ASMT-10, DRC-01), Income Tax (148A, 143(1)), TDS Defaults, and ROC intimation notices with deadline tracking.
          </p>
        </div>

        <button
          onClick={() => setIsNewNoticeModalOpen(true)}
          className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Log Department Notice</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Active Notices</span>
            <div className="text-2xl font-extrabold text-slate-800 mt-1">{notices.length} Notices</div>
            <span className="text-xs text-amber-600 font-semibold">Across GST, IT & TDS</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Aggregated Tax Demand</span>
            <div className="text-2xl font-extrabold text-rose-600 mt-1">
              ₹{totalDemand.toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-slate-400">Total departmental exposure</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Replies Submitted</span>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1">
              {notices.filter(n => n.status === 'Replied' || n.status === 'Closed').length} / {notices.length}
            </div>
            <span className="text-xs text-emerald-600 font-semibold">100% On-Time Record</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by client, DIN/Notice number, or type..."
            className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>Department:</span>
          <select
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs font-semibold focus:outline-none"
          >
            <option value="all">All Departments</option>
            <option value="gst">GST</option>
            <option value="income tax">Income Tax</option>
            <option value="tds">TDS</option>
            <option value="roc">ROC</option>
          </select>
        </div>
      </div>

      {/* Notices List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Notice Number & Type</th>
                <th className="p-3.5">Client & GSTIN</th>
                <th className="p-3.5">Due Date & SLA</th>
                <th className="p-3.5">Demand Amount</th>
                <th className="p-3.5">Assigned Counsel</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredNotices.map(n => (
                <tr key={n.id} className="hover:bg-slate-50/70 transition">
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      n.department === 'GST'
                        ? 'bg-blue-100 text-blue-800'
                        : n.department === 'Income Tax'
                        ? 'bg-indigo-100 text-indigo-800'
                        : n.department === 'TDS'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {n.department}
                    </span>
                  </td>
                  <td className="p-3.5 max-w-xs">
                    <span className="font-bold text-slate-800 block text-xs font-mono">{n.noticeNumber}</span>
                    <span className="text-[11px] text-slate-500 line-clamp-1" title={n.noticeType}>
                      {n.noticeType}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-bold text-slate-800 block text-xs">{n.clientName}</span>
                    <span className="font-mono text-[10px] text-slate-400">{n.clientGstin}</span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-bold text-slate-800 font-mono block">{n.dueDate}</span>
                    <span className={`text-[10px] font-semibold ${
                      n.daysRemaining <= 5 ? 'text-rose-600' : 'text-slate-400'
                    }`}>
                      {n.daysRemaining} days remaining
                    </span>
                  </td>
                  <td className="p-3.5 font-bold font-mono text-slate-800">
                    ₹{n.demandAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3.5 text-xs text-slate-600">
                    {n.assignedEmployeeName}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      n.status === 'Replied'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : n.status === 'Drafting Reply'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}>
                      {n.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => {
                        setSelectedNoticeForReply(n);
                        setReplyText(n.responseNotes || '');
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold inline-flex items-center gap-1 transition"
                    >
                      <span>Draft Reply</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reply Modal */}
      {selectedNoticeForReply && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">Statutory Notice Legal Response</h3>
                <p className="text-xs text-slate-500 font-mono">{selectedNoticeForReply.noticeNumber}</p>
              </div>
              <button onClick={() => setSelectedNoticeForReply(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Client:</span>
                <strong className="text-slate-800">{selectedNoticeForReply.clientName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department / Type:</span>
                <span className="font-semibold text-slate-700">{selectedNoticeForReply.department} - {selectedNoticeForReply.noticeType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Alleged Tax Demand:</span>
                <strong className="text-rose-600">₹{selectedNoticeForReply.demandAmount.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Legal Response & Supporting Submissions
              </label>
              <textarea
                rows={5}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Draft clause-by-clause reply, case law citations, and document attachments..."
                className="w-full p-2.5 border rounded-lg text-xs focus:outline-none focus:border-rose-500"
              ></textarea>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2 text-xs">
              <button
                onClick={() => setSelectedNoticeForReply(null)}
                className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReply}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs"
              >
                Mark as Replied & Log Submission
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Notice Modal */}
      {isNewNoticeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-800">Log Department Statutory Notice</h3>
              <button onClick={() => setIsNewNoticeModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreateNotice} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Client Entity</label>
                  <select
                    value={newNoticeClient}
                    onChange={e => setNewNoticeClient(e.target.value)}
                    className="w-full p-2.5 border rounded-lg focus:outline-none"
                  >
                    <option value="Briopox Pvt Ltd">Briopox Pvt Ltd</option>
                    <option value="Aggarwal & Sons Trading Co.">Aggarwal & Sons Trading Co.</option>
                    <option value="Apex Healthtech LLP">Apex Healthtech LLP</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={newNoticeDept}
                    onChange={e => setNewNoticeDept(e.target.value as any)}
                    className="w-full p-2.5 border rounded-lg focus:outline-none"
                  >
                    <option value="GST">GST</option>
                    <option value="Income Tax">Income Tax</option>
                    <option value="TDS">TDS</option>
                    <option value="ROC">ROC</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">DIN / Notice Number</label>
                <input
                  type="text"
                  required
                  value={newNoticeNumber}
                  onChange={e => setNewNoticeNumber(e.target.value)}
                  placeholder="e.g. ZA0709260018921 or ITBA/AST/S/148/..."
                  className="w-full p-2.5 border rounded-lg focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notice Subject / Section</label>
                <input
                  type="text"
                  required
                  value={newNoticeType}
                  onChange={e => setNewNoticeType(e.target.value)}
                  placeholder="e.g. ASMT-10 (Discrepancy in GSTR-3B vs 2B)"
                  className="w-full p-2.5 border rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Alleged Tax Demand (₹)</label>
                  <input
                    type="number"
                    value={newNoticeDemand}
                    onChange={e => setNewNoticeDemand(e.target.value)}
                    className="w-full p-2.5 border rounded-lg focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Response Due Date</label>
                  <input
                    type="date"
                    required
                    value={newNoticeDueDate}
                    onChange={e => setNewNoticeDueDate(e.target.value)}
                    className="w-full p-2.5 border rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewNoticeModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-xs"
                >
                  Log Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
