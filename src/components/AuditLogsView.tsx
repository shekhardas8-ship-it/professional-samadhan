// src/components/AuditLogsView.tsx
import React, { useState, useEffect } from 'react';
import { AuditNotification } from '../types/index.ts';
import {
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  ExternalLink,
  Smartphone,
  RefreshCw,
} from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      searchTerm === '' ||
      log.clientBusinessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.recipient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.messageBody?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesChannel = channelFilter === 'all' || log.channel === channelFilter;
    return matchesSearch && matchesChannel;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Communication & Audit Trail Register</h2>
          <p className="text-xs text-slate-500 mt-1">
            Statutory log of all prepared WhatsApp links, automated messages, delivery receipts, and confirmation events.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => setChannelFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              channelFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Channels ({logs.length})
          </button>
          <button
            onClick={() => setChannelFilter('whatsapp_manual')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              channelFilter === 'whatsapp_manual' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Manual WhatsApp
          </button>
          <button
            onClick={() => setChannelFilter('whatsapp_cloud_api')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              channelFilter === 'whatsapp_cloud_api' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Meta Cloud API
          </button>
          <button
            onClick={() => setChannelFilter('portal')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              channelFilter === 'portal' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Client Portal
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search recipient, text..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading audit events...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">No audit events match your filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Client Business</th>
                  <th className="p-3">Event Type</th>
                  <th className="p-3">Channel</th>
                  <th className="p-3">Recipient</th>
                  <th className="p-3">Message Content</th>
                  <th className="p-3">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map(log => {
                  return (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="p-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {new Date(log.createdAt).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-slate-900 font-medium whitespace-nowrap">
                        {log.clientBusinessName || 'System'}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="font-semibold text-slate-700 capitalize">
                          {log.eventType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {log.channel}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-600 text-[11px] whitespace-nowrap">
                        {log.recipient || '-'}
                      </td>
                      <td className="p-3 text-slate-600 max-w-sm truncate" title={log.messageBody}>
                        {log.messageBody || '-'}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            log.status === 'sent'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.status === 'prepared' || log.status === 'simulated_dev'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
