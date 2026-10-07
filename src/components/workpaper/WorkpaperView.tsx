// src/components/workpaper/WorkpaperView.tsx
import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileCode2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { MonthlyRequest } from '../../types/index.ts';

interface WorkpaperViewProps {
  requests: MonthlyRequest[];
  onOpenReview: (request: MonthlyRequest) => void;
  onGenerateWorkbook: (requestId: string) => Promise<void>;
  isActionLoading: boolean;
}

export const WorkpaperView: React.FC<WorkpaperViewProps> = ({
  requests,
  onOpenReview,
  onGenerateWorkbook,
  isActionLoading,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'ready' | 'approved'>('all');

  const filteredRequests = requests.filter(r => {
    if (selectedFilter === 'ready') return r.totalInvoicesExtracted > 0;
    if (selectedFilter === 'approved') return r.status === 'CA Approved' || r.status === 'Client Confirmed';
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Statutory Audit Working Paper Engine</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              10-Sheet Excel Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated generation of standardized CA working papers with frozen headers, tax reconciliation, formula injection guards, and client digital confirmations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">Filter:</span>
          <select
            value={selectedFilter}
            onChange={e => setSelectedFilter(e.target.value as any)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none"
          >
            <option value="all">All Clients ({requests.length})</option>
            <option value="ready">Extracted & Ready for Generation</option>
            <option value="approved">CA Approved Workpapers</option>
          </select>
        </div>
      </div>

      {/* Feature Highlights Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 rounded-xl p-5 text-white shadow-md border border-emerald-900/60">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-emerald-300">Standardized 10-Sheet Working Paper Structure</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Every generated client workbook automatically includes: (1) Executive Summary, (2) B2B Sales Register, (3) Purchase Register, (4) Bank Transactions, (5) Debit Notes, (6) Credit Notes, (7) GSTR-2B ITC Match, (8) Rate-wise Tax Summary, (9) Checkpoint Exceptions, and (10) Partner Audit Trail with SHA-256 integrity stamp.
            </p>
          </div>
        </div>
      </div>

      {/* Working Paper Generation Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="p-3.5">Client & GSTIN</th>
                <th className="p-3.5">Filing Period</th>
                <th className="p-3.5">Extracted Invoices</th>
                <th className="p-3.5">Exceptions</th>
                <th className="p-3.5">Workbook Version</th>
                <th className="p-3.5">Compliance Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRequests.map(req => (
                <tr key={req.id} className="hover:bg-slate-50/70 transition">
                  <td className="p-3.5">
                    <span className="font-bold text-slate-800 block text-xs">{req.clientName || 'Briopox Pvt Ltd'}</span>
                    <span className="font-mono text-[11px] text-slate-400">{req.clientGstin || '07AABCB9123D1ZX'}</span>
                  </td>
                  <td className="p-3.5 font-bold font-mono text-slate-800">{req.reportingMonth}</td>
                  <td className="p-3.5">
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {req.totalInvoicesExtracted || 142} Invoices
                    </span>
                  </td>
                  <td className="p-3.5">
                    {req.unresolvedExceptionsCount > 0 ? (
                      <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1 w-max">
                        <AlertTriangle className="w-3 h-3" /> {req.unresolvedExceptionsCount} Checkpoints
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 100% Reconciled
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 font-mono font-bold text-slate-700">
                    v{req.activeWorkbookVersion || 1}.0
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      req.status === 'CA Approved' || req.status === 'Client Confirmed'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : req.status === 'Needs Review'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-blue-100 text-blue-800 border border-blue-300'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onOpenReview(req)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center gap-1 transition"
                        title="Side-by-Side Document Reviewer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>

                      <button
                        onClick={() => onGenerateWorkbook(req.id)}
                        disabled={isActionLoading}
                        className="px-2.5 py-1 bg-[#00c073] hover:bg-[#00a864] text-white rounded text-xs font-bold flex items-center gap-1 transition shadow-xs disabled:opacity-50"
                        title="Generate Multi-Sheet Excel Working Paper"
                      >
                        <FileSpreadsheet className="w-3 h-3" />
                        <span>Compile Excel</span>
                      </button>

                      <a
                        href={`/api/monthly-requests/${req.id}/download-excel`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                        title="Download Last Compiled XLSX"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
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
