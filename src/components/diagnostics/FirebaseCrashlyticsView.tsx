// src/components/diagnostics/FirebaseCrashlyticsView.tsx
import React, { useState, useEffect } from 'react';
import {
  Flame,
  Bug,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  RefreshCw,
  CheckCircle2,
  Terminal,
  Clock,
  Layers,
  ArrowUpRight,
  Filter,
  Search,
  Download,
  Trash2,
  Eye,
  Check,
  ExternalLink,
  Smartphone,
  Globe,
  Sliders,
  Sparkles,
  ChevronRight,
  User,
  Copy,
  CheckCheck,
} from 'lucide-react';
import { firebaseCrashlytics, CrashReport, Breadcrumb } from '../../services/firebaseCrashlytics.ts';

export const FirebaseCrashlyticsView: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [crashes, setCrashes] = useState<CrashReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalIssues: 0,
    totalCrashes: 0,
    fatalCount: 0,
    nonFatalCount: 0,
    resolvedCount: 0,
    activeCount: 0,
    crashFreeRate: 99.8,
  });

  const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'triaged' | 'resolved' | 'fatal'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrash, setSelectedCrash] = useState<CrashReport | null>(null);
  const [scrubNotesInput, setScrubNotesInput] = useState('');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [isLiveEnabled, setIsLiveEnabled] = useState(true);

  const fetchCrashes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/telemetry/crashes');
      if (res.ok) {
        const data = await res.json();
        setCrashes(data.crashes || []);
        if (data.stats) setStats(data.stats);
      } else {
        // Fallback to local storage if API unreachable
        const local = firebaseCrashlytics.getStoredCrashes();
        setCrashes(local);
        const fatal = local.filter(c => c.fatal).length;
        setStats({
          totalIssues: local.length,
          totalCrashes: local.reduce((a, b) => a + (b.occurrences || 1), 0),
          fatalCount: fatal,
          nonFatalCount: local.length - fatal,
          resolvedCount: local.filter(c => c.status === 'resolved').length,
          activeCount: local.filter(c => c.status !== 'resolved').length,
          crashFreeRate: 99.6,
        });
      }
    } catch (e) {
      const local = firebaseCrashlytics.getStoredCrashes();
      setCrashes(local);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrashes();

    const handleNewReport = (e: any) => {
      if (e.detail) {
        fetchCrashes();
        showNotification('🚨 New crash captured and recorded by Firebase Crashlytics');
      }
    };
    window.addEventListener('quinceca_crashlytics_new_report', handleNewReport);
    return () => window.removeEventListener('quinceca_crashlytics_new_report', handleNewReport);
  }, []);

  const showNotification = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 3000);
  };

  const handleTriggerTestCrash = async (fatal = false) => {
    try {
      const report = firebaseCrashlytics.triggerTestCrash(fatal);
      await fetch('/api/telemetry/test-crash', { method: 'POST' });
      await fetchCrashes();
      showNotification(`Test ${fatal ? 'FATAL' : 'Non-Fatal'} Crash generated & logged successfully`);
    } catch (e: any) {
      showNotification('Test crash registered locally');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: CrashReport['status'], notes?: string) => {
    try {
      await fetch(`/api/telemetry/crashes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, scrubNotes: notes }),
      });
      firebaseCrashlytics.updateCrashStatusLocally(id, newStatus, notes);
      await fetchCrashes();
      if (selectedCrash && selectedCrash.id === id) {
        setSelectedCrash(prev => prev ? { ...prev, status: newStatus, scrubNotes: notes !== undefined ? notes : prev.scrubNotes } : null);
      }
      showNotification(`Issue marked as ${newStatus.toUpperCase()}`);
    } catch (_) {
      firebaseCrashlytics.updateCrashStatusLocally(id, newStatus, notes);
      await fetchCrashes();
    }
  };

  const handleClearResolved = async () => {
    try {
      await fetch('/api/telemetry/crashes', { method: 'DELETE' });
      await fetchCrashes();
      showNotification('Cleared resolved crash reports');
    } catch (_) {
      firebaseCrashlytics.clearLocalCrashes();
      await fetchCrashes();
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(crashes, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `firebase_crashlytics_bug_scrub_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleCopy = (text: string, label: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2000);
    }
  };

  const filteredCrashes = crashes.filter(c => {
    if (filterStatus === 'fatal' && !c.fatal) return false;
    if (filterStatus !== 'all' && filterStatus !== 'fatal' && c.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.message.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.userEmail && c.userEmail.toLowerCase().includes(q)) ||
        c.url.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans antialiased text-slate-800">
      {/* 1. Top Header Banner with Firebase Branding */}
      <div className="bg-[#111827] text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                <Flame className="w-4 h-4 fill-amber-400" />
                Firebase Crashlytics Real-Time Telemetry
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Bug Scrub Studio Active
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Firebase Crashlytics & Bug Scrub Hub
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
              Real-time exception tracking, unhandled Promise capture, session breadcrumbs, and bug triage engine. Detect, analyze, scrub, and resolve rendering failures and statutory pipeline issues before clients report them.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            <button
              onClick={() => handleTriggerTestCrash(false)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 transition shadow-sm"
              title="Simulates a non-fatal caught warning"
            >
              <Bug className="w-4 h-4" />
              <span>Simulate Non-Fatal</span>
            </button>

            <button
              onClick={() => handleTriggerTestCrash(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 transition shadow-sm"
              title="Simulates an unhandled fatal crash"
            >
              <XCircle className="w-4 h-4" />
              <span>Simulate Fatal Crash</span>
            </button>

            <button
              onClick={fetchCrashes}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Success toast notification */}
        {actionSuccessMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionSuccessMessage}</span>
          </div>
        )}
      </div>

      {/* 2. Crashlytics KPI Dashboard Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">CRASH-FREE USERS</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
              {stats.crashFreeRate}%
            </span>
            <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
              Optimal SLA
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Based on active Practice OS sessions</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">TOTAL INCIDENTS</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {stats.totalCrashes}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              ({stats.totalIssues} unique signatures)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Total runtime exceptions registered</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">FATAL CRASHES</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-600">
              {stats.fatalCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              / {stats.nonFatalCount} non-fatal
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Unhandled rendering & core interruptions</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">BUG SCRUB RESOLUTION</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-600">
              {stats.resolvedCount}
            </span>
            <span className="text-xs text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-full">
              {stats.activeCount} In Queue
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Triaged and closed by CA engineers</p>
        </div>
      </div>

      {/* 3. Bug Scrub Action Toolbar & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'All Issues', count: crashes.length },
            { id: 'new', label: 'Active / New', count: crashes.filter(c => c.status === 'new').length },
            { id: 'triaged', label: 'Triaged', count: crashes.filter(c => c.status === 'triaged').length },
            { id: 'resolved', label: 'Resolved', count: crashes.filter(c => c.status === 'resolved').length },
            { id: 'fatal', label: 'Fatal Only', count: crashes.filter(c => c.fatal).length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                filterStatus === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                filterStatus === tab.id ? 'bg-slate-800 text-amber-300' : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search stack, error, user..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <button
            onClick={handleExportJson}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="Export Bug Scrub Report JSON"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleClearResolved}
            className="p-2 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 transition"
            title="Clear Resolved Issues"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. Bug Scrub Queue (Issues List) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug className="w-4 h-4 text-amber-600" />
            <h3 className="font-extrabold text-sm text-slate-900">
              Bug Scrub Triage Register ({filteredCrashes.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Click an issue to inspect stack trace and user breadcrumbs
          </span>
        </div>

        {filteredCrashes.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto" />
            <div className="font-bold text-sm text-slate-800">
              Zero Unresolved Crashes in this Category!
            </div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your practice application is operating smoothly. Click "Simulate Non-Fatal" or "Simulate Fatal Crash" above to test the telemetry pipeline.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredCrashes.map(crash => (
              <div
                key={crash.id}
                className="p-4 sm:p-5 hover:bg-slate-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                onClick={() => {
                  setSelectedCrash(crash);
                  setScrubNotesInput(crash.scrubNotes || '');
                }}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                      crash.fatal
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {crash.fatal ? 'FATAL' : 'NON-FATAL'}
                    </span>

                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                      {crash.name}
                    </span>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      crash.status === 'resolved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : crash.status === 'triaged'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {crash.status.toUpperCase()}
                    </span>

                    <span className="text-[11px] text-slate-400 font-mono">
                      {crash.occurrences} {crash.occurrences === 1 ? 'event' : 'events'}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 truncate">
                    {crash.message}
                  </h4>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(crash.lastSeen || crash.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>

                    <span className="flex items-center gap-1 truncate max-w-[200px]">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      {crash.url ? new URL(crash.url).pathname : '/'}
                    </span>

                    {crash.userEmail && (
                      <span className="flex items-center gap-1 text-indigo-600 font-medium">
                        <User className="w-3.5 h-3.5" />
                        {crash.userEmail}
                      </span>
                    )}

                    {crash.breadcrumbs?.length > 0 && (
                      <span className="text-[11px] text-slate-400 font-mono">
                        {crash.breadcrumbs.length} breadcrumbs recorded
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Bug Scrub Triage Buttons */}
                <div
                  className="flex items-center gap-2 self-start md:self-auto shrink-0"
                  onClick={e => e.stopPropagation()}
                >
                  {crash.status !== 'resolved' ? (
                    <button
                      onClick={() => handleUpdateStatus(crash.id, 'resolved')}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 shadow-xs transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Resolve</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(crash.id, 'new')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
                    >
                      Reopen
                    </button>
                  )}

                  {crash.status === 'new' && (
                    <button
                      onClick={() => handleUpdateStatus(crash.id, 'triaged')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition"
                    >
                      Triage
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setSelectedCrash(crash);
                      setScrubNotesInput(crash.scrubNotes || '');
                    }}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    title="View Stack & Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Issue Detail & Bug Scrub Modal */}
      {selectedCrash && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                    selectedCrash.fatal ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedCrash.fatal ? 'FATAL CRASH' : 'NON-FATAL EXCEPTION'}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-700">
                    {selectedCrash.name}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ID: {selectedCrash.id}
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                  {selectedCrash.message}
                </h3>
              </div>

              <button
                onClick={() => setSelectedCrash(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Environment Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">FIRST SEEN</span>
                  <span className="font-semibold text-slate-800 block mt-0.5">
                    {new Date(selectedCrash.timestamp).toLocaleTimeString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">OCCURRENCES</span>
                  <span className="font-extrabold text-slate-800 block mt-0.5">
                    {selectedCrash.occurrences}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">VIEWPORT</span>
                  <span className="font-mono text-slate-800 block mt-0.5">
                    {selectedCrash.viewport || '1920x1080'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">USER EMAIL</span>
                  <span className="font-medium text-slate-800 truncate block mt-0.5">
                    {selectedCrash.userEmail || 'Anonymous'}
                  </span>
                </div>
              </div>

              {/* Stack Trace Section */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                    Stack Trace
                  </span>
                  <button
                    onClick={() => handleCopy(selectedCrash.stack || selectedCrash.message, 'stack')}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 text-[11px]"
                  >
                    {copiedText === 'stack' ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedText === 'stack' ? 'Copied' : 'Copy Stack'}</span>
                  </button>
                </div>
                <div className="p-3.5 bg-slate-950 text-rose-300 font-mono text-[11px] rounded-xl overflow-x-auto max-h-48 border border-slate-800 leading-relaxed whitespace-pre">
                  {selectedCrash.stack || selectedCrash.message}
                </div>
              </div>

              {/* Component Stack (React) if available */}
              {selectedCrash.componentStack && (
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    React Component Hierarchy
                  </span>
                  <div className="p-3 bg-slate-900 text-slate-300 font-mono text-[11px] rounded-xl overflow-x-auto max-h-28 border border-slate-800 whitespace-pre">
                    {selectedCrash.componentStack}
                  </div>
                </div>
              )}

              {/* User Session Breadcrumbs Timeline */}
              <div className="space-y-2">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  User Session Breadcrumbs (Actions Prior to Crash)
                </span>

                {(!selectedCrash.breadcrumbs || selectedCrash.breadcrumbs.length === 0) ? (
                  <div className="p-3 bg-slate-50 rounded-xl text-slate-500 italic text-[11px]">
                    No breadcrumbs recorded prior to this event.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {selectedCrash.breadcrumbs.map((b, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-[11px]"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                            b.category === 'ui' ? 'bg-blue-100 text-blue-800' :
                            b.category === 'navigation' ? 'bg-purple-100 text-purple-800' :
                            b.category === 'auth' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {b.category}
                          </span>
                          <span className="text-slate-800 font-medium">{b.message}</span>
                        </div>
                        <span className="text-slate-400 font-mono text-[10px]">
                          {new Date(b.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bug Scrub RCA & Developer Notes Section */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-800 block text-xs">
                  Bug Scrub Root Cause Analysis (RCA) Notes
                </span>
                <textarea
                  value={scrubNotesInput}
                  onChange={e => setScrubNotesInput(e.target.value)}
                  placeholder="Document resolution notes, root cause fix commit, or developer triage notes..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-20"
                />
              </div>
            </div>

            {/* Modal Footer with Triage Controls */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold">Status:</span>
                <select
                  value={selectedCrash.status}
                  onChange={e => handleUpdateStatus(selectedCrash.id, e.target.value as any, scrubNotesInput)}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="new">NEW</option>
                  <option value="triaged">TRIAGED</option>
                  <option value="resolved">RESOLVED</option>
                  <option value="ignored">IGNORED</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedCrash(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
                >
                  Close
                </button>

                <button
                  onClick={() => {
                    handleUpdateStatus(selectedCrash.id, 'resolved', scrubNotesInput);
                    setSelectedCrash(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#00c073] hover:bg-emerald-600 text-white flex items-center gap-1.5 shadow transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Notes & Mark Resolved</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
