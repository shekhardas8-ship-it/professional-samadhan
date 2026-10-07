// src/components/timetracking/TimeTrackingView.tsx
import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  Plus,
  TrendingUp,
  DollarSign,
  User,
  Filter,
  Download,
} from 'lucide-react';
import { INITIAL_TIMESHEETS } from '../../services/frontPageDataService.ts';

export const TimeTrackingView: React.FC = () => {
  const [timesheets, setTimesheets] = useState(INITIAL_TIMESHEETS);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logClient, setLogClient] = useState('Briopox Pvt Ltd');
  const [logCategory, setLogCategory] = useState('GST Compliance');
  const [logHours, setLogHours] = useState('2.5');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logSummary, setLogSummary] = useState('');
  const [isBillable, setIsBillable] = useState(true);

  const totalHours = timesheets.reduce((acc, curr) => acc + curr.hoursSpent, 0);
  const billableHours = timesheets.filter(t => t.isBillable).reduce((acc, curr) => acc + curr.hoursSpent, 0);
  const billableRate = 2500; // ₹2500 / hr standard CA billing rate
  const billableAmount = billableHours * billableRate;

  const handleLogTime = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logSummary.trim()) return;

    const newEntry = {
      id: `ts_${Date.now()}`,
      employeeId: 'staff_pooja_02',
      employeeName: 'Pooja Verma',
      clientId: 'cli_briopox_01',
      clientName: logClient,
      serviceCategory: logCategory,
      date: logDate,
      hoursSpent: parseFloat(logHours) || 1.0,
      isBillable: isBillable,
      workSummary: logSummary.trim(),
      status: 'Submitted',
    };

    setTimesheets([newEntry, ...timesheets]);
    setLogSummary('');
    setIsLogModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Time Tracking & Timesheets</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Staff Productivity
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Log billable hours, client service allocation, and monitor partner/associate productivity.
          </p>
        </div>

        <button
          onClick={() => setIsLogModalOpen(true)}
          className="px-3.5 py-2 bg-[#00c073] hover:bg-[#00a864] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Log Time Entry</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Total Hours Logged</span>
            <div className="text-2xl font-extrabold text-slate-800 mt-1">{totalHours.toFixed(1)} hrs</div>
            <span className="text-xs text-slate-400">Current pay cycle</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Billable Productivity</span>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1">
              {((billableHours / (totalHours || 1)) * 100).toFixed(0)}%
            </div>
            <span className="text-xs text-emerald-600 font-semibold">{billableHours.toFixed(1)} hrs billable</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Recoverable Fee Value</span>
            <div className="text-2xl font-extrabold text-indigo-600 mt-1">
              ₹{billableAmount.toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-slate-400">At standard hourly billing rate</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Timesheet Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800">Recent Timesheet Entries</h3>
          <span className="text-xs text-slate-500">{timesheets.length} verified submissions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="p-3.5">Staff Member</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Client & Service</th>
                <th className="p-3.5">Hours</th>
                <th className="p-3.5">Work Summary</th>
                <th className="p-3.5">Billing</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {timesheets.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/70 transition">
                  <td className="p-3.5 font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                      {t.employeeName.charAt(0)}
                    </span>
                    {t.employeeName}
                  </td>
                  <td className="p-3.5 font-mono text-slate-500">{t.date}</td>
                  <td className="p-3.5">
                    <span className="font-bold text-slate-800 block">{t.clientName}</span>
                    <span className="text-[11px] text-slate-400">{t.serviceCategory}</span>
                  </td>
                  <td className="p-3.5 font-bold font-mono text-slate-800">{t.hoursSpent} hrs</td>
                  <td className="p-3.5 max-w-xs text-slate-600 truncate" title={t.workSummary}>
                    {t.workSummary}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.isBillable ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {t.isBillable ? 'Billable' : 'Non-Billable'}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Time Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-800">Log Timesheet Entry</h3>
              <button onClick={() => setIsLogModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleLogTime} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Client Entity</label>
                <select
                  value={logClient}
                  onChange={e => setLogClient(e.target.value)}
                  className="w-full p-2.5 border rounded-lg focus:outline-none"
                >
                  <option value="Briopox Pvt Ltd">Briopox Pvt Ltd</option>
                  <option value="Aggarwal & Sons Trading Co.">Aggarwal & Sons Trading Co.</option>
                  <option value="Apex Healthtech LLP">Apex Healthtech LLP</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Service Category</label>
                  <select
                    value={logCategory}
                    onChange={e => setLogCategory(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                  >
                    <option value="GST Compliance">GST Compliance</option>
                    <option value="TDS Compliance">TDS Compliance</option>
                    <option value="Income Tax Return">Income Tax Return</option>
                    <option value="Statutory Audit">Statutory Audit</option>
                    <option value="Litigation / Notice">Litigation / Notice</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hours Spent</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="16"
                    value={logHours}
                    onChange={e => setLogHours(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={logDate}
                  onChange={e => setLogDate(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Work Description / Milestones</label>
                <textarea
                  required
                  rows={3}
                  value={logSummary}
                  onChange={e => setLogSummary(e.target.value)}
                  placeholder="Describe specific compliance work executed, invoices reconciled, or portal filings done..."
                  className="w-full p-2 border rounded-lg focus:outline-none"
                ></textarea>
              </div>

              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={isBillable}
                  onChange={e => setIsBillable(e.target.checked)}
                  className="rounded text-[#00c073] focus:ring-0"
                />
                <span>Billable Time (Apply to Client Invoicing)</span>
              </label>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00c073] hover:bg-[#00a864] text-white rounded-lg font-bold shadow-xs"
                >
                  Log Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
