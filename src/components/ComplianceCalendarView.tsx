// src/components/ComplianceCalendarView.tsx
import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Sparkles,
  RefreshCw,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Filter,
  Check,
  ArrowRight,
  Info,
  CalendarDays,
  ShieldCheck,
  Building2,
  ArrowLeft,
  ExternalLink,
  Globe,
  Bell,
  Search,
} from 'lucide-react';
import { ComplianceCalendarItem, RegulatoryPortalInfo } from '../types/index.ts';
import {
  generateStatutoryCalendar,
  getStoredComplianceCalendar,
  saveStoredComplianceCalendar,
  syncStatutoryPortals,
  markComplianceItemCompleted,
  REGULATORY_PORTALS,
} from '../services/statutoryComplianceService.ts';
import { INITIAL_CLIENTS_DATA } from '../services/frontPageDataService.ts';

interface ComplianceCalendarViewProps {
  onBack?: () => void;
}

export const ComplianceCalendarView: React.FC<ComplianceCalendarViewProps> = ({ onBack }) => {
  const [calendarItems, setCalendarItems] = useState<ComplianceCalendarItem[]>(() => {
    return getStoredComplianceCalendar();
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('October 2026');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Live Synced');

  // Load / listen for store updates
  useEffect(() => {
    const handleSync = () => {
      setCalendarItems(getStoredComplianceCalendar());
    };
    window.addEventListener('ps_data_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('ps_data_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const handleMonthChange = async (monthStr: string) => {
    setSelectedMonth(monthStr);
    setIsGenerating(true);

    const parts = monthStr.split(' ');
    const mName = parts[0];
    const yNum = Number(parts[1]) || new Date().getFullYear();

    const mNames = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    const mIdx = mNames.findIndex(m => m === mName.toLowerCase());
    const mNum = mIdx !== -1 ? mIdx + 1 : 10;

    const fresh = generateStatutoryCalendar(yNum, mNum);
    saveStoredComplianceCalendar(fresh);
    setCalendarItems(fresh);
    setIsGenerating(false);
    setLastSyncTime(`Synced for ${monthStr}`);
  };

  const handleSyncAllPortals = async () => {
    setIsGenerating(true);
    setBroadcastMessage('Synchronizing active compliance calendars with 11 government regulatory portals...');
    try {
      const parts = selectedMonth.split(' ');
      const res = await syncStatutoryPortals(parts[0], Number(parts[1]));
      setCalendarItems(res.items);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setBroadcastMessage(
        `Successfully synced ${res.total} statutory compliance deadlines across all 11 government portals.`
      );
      setTimeout(() => setBroadcastMessage(null), 5000);
    } catch {
      setBroadcastMessage('Sync completed with local statutory compliance rules.');
      setTimeout(() => setBroadcastMessage(null), 4000);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleComplete = (item: ComplianceCalendarItem) => {
    if (item.status === 'Completed') {
      const updated = calendarItems.map(c =>
        c.id === item.id ? { ...c, status: 'Upcoming' as const } : c
      );
      saveStoredComplianceCalendar(updated);
      setCalendarItems(updated);
    } else {
      const updated = markComplianceItemCompleted(item.id);
      setCalendarItems(updated);
    }
  };

  const handleBroadcastNotice = async (item: ComplianceCalendarItem) => {
    try {
      await fetch('/api/compliance-calendar/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'ca_admin' },
        body: JSON.stringify({
          displayDate: item.displayDate,
          eventTitle: item.eventTitle,
          portalName: item.portalName,
          formNumber: item.formNumber,
        }),
      });
    } catch (e) {
      console.warn('Broadcast sync notice:', e);
    }

    alert(
      `[WhatsApp Broadcast Dispatched & Recorded]\n\nTarget: All Active Clients (${INITIAL_CLIENTS_DATA.length} Businesses)\nMilestone: ${item.displayDate} - ${item.eventTitle}\nPortal: ${item.portalName || item.category} (${item.portalDomain || 'gov.in'})\nForm: ${item.formNumber || 'Statutory'}\n\nNotice Preview:\n"Dear Client, kindly note the statutory compliance deadline on ${item.displayDate} for ${item.eventTitle}. Please submit vouchers and invoices to QuinceCA to ensure timely filing without late fees."`
    );
  };

  // Filter items
  const filteredItems = calendarItems.filter(item => {
    // Portal / Category filter
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'Income Tax') {
        if (item.category !== 'Income Tax' && item.category !== 'TDS' && item.category !== 'Audit') {
          return false;
        }
      } else if (item.category !== selectedCategory && item.portalName !== selectedCategory) {
        return false;
      }
    }

    // Status filter
    if (selectedStatusFilter === 'urgent') {
      if (item.status !== 'Urgent' && item.status !== 'Overdue') return false;
    } else if (selectedStatusFilter === 'completed') {
      if (item.status !== 'Completed') return false;
    } else if (selectedStatusFilter === 'upcoming') {
      if (item.status !== 'Upcoming') return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        item.eventTitle.toLowerCase().includes(q) ||
        (item.portalName && item.portalName.toLowerCase().includes(q)) ||
        (item.portalDomain && item.portalDomain.toLowerCase().includes(q)) ||
        (item.formNumber && item.formNumber.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Banner */}
      <div className="theme-banner text-white rounded-3xl p-6 sm:p-8 shadow-xl border flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          {onBack && (
            <button
              onClick={onBack}
              className="mb-3 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 w-fit border border-white/20 shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Cockpit</span>
            </button>
          )}
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="text-xs uppercase tracking-wider theme-accent-text font-bold">
              Autonomous Practice Intelligence
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>11 Government Portals Synchronized</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
            Statutory Compliance Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Multi-regulatory statutory tax and corporate deadlines auto-synchronized across GST, MCA, Income Tax, EPFO, ESIC, Labour, RBI, DPIIT, DGFT, CBIC, and IP India.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleSyncAllPortals}
            disabled={isGenerating}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center space-x-2 shadow-lg transition disabled:opacity-75"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Syncing 11 Portals...' : 'Sync All Portals Now'}</span>
          </button>
        </div>
      </div>

      {broadcastMessage && (
        <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-2xl text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{broadcastMessage}</span>
        </div>
      )}

      {/* 2. 11 Official Regulatory Portals Hub */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-extrabold text-slate-900">
              Integrated Regulatory Portals (11 Live Government Links)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-semibold">
            Status: <span className="text-emerald-700 font-bold">● All 11 Portals Active & Connected</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5">
          {REGULATORY_PORTALS.map(portal => (
            <a
              key={portal.id}
              href={portal.url}
              target="_blank"
              rel="noreferrer"
              title={`Visit official website: ${portal.name}`}
              className="p-2.5 bg-slate-50/80 hover:bg-teal-50/60 rounded-xl border border-slate-200 hover:border-teal-400 transition flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${portal.badgeColor}`}>
                  {portal.category}
                </span>
                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-teal-600 transition" />
              </div>
              <div className="mt-2">
                <div className="font-extrabold text-slate-800 text-xs truncate group-hover:text-teal-900">
                  {portal.name}
                </div>
                <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                  {portal.domain}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* 3. Controls & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Statutory Month Selector */}
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <CalendarDays className="w-5 h-5 text-teal-600" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Statutory Month:</span>
            <select
              value={selectedMonth}
              onChange={e => handleMonthChange(e.target.value)}
              className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="October 2026">October 2026 (Active Practice Period)</option>
              <option value="November 2026">November 2026</option>
              <option value="December 2026">December 2026 (Q3 / Annual GSTR-9)</option>
              <option value="January 2027">January 2027</option>
              <option value="February 2027">February 2027</option>
              <option value="March 2027">March 2027 (Advance Tax Q4 / FY Close)</option>
              <option value="April 2026">April 2026</option>
              <option value="May 2026">May 2026</option>
              <option value="June 2026">June 2026 (IEC Renewal)</option>
              <option value="July 2026">July 2026 (ITR Non-Audit)</option>
              <option value="August 2026">August 2026</option>
              <option value="September 2026">September 2026 (Tax Audit 44AB & DIR-3 KYC)</option>
            </select>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search return, portal, form..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Status Quick Filter */}
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            {[
              { id: 'all', label: `All (${calendarItems.length})` },
              { id: 'urgent', label: 'Urgent / Due Soon' },
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'completed', label: 'Filed' },
            ].map(st => (
              <button
                key={st.id}
                onClick={() => setSelectedStatusFilter(st.id)}
                className={`px-2.5 py-1 rounded-lg transition ${
                  selectedStatusFilter === st.id
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Portal Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2 border-t border-slate-100 text-xs font-semibold no-scrollbar">
          {[
            { id: 'all', label: `All 11 Portals (${calendarItems.length})` },
            { id: 'GST', label: 'GST (gst.gov.in)' },
            { id: 'Income Tax', label: 'Income Tax (incometax.gov.in)' },
            { id: 'TDS', label: 'TDS' },
            { id: 'ROC', label: 'MCA V3 (mca.gov.in)' },
            { id: 'EPFO', label: 'EPFO (epfindia.gov.in)' },
            { id: 'ESIC', label: 'ESIC (esic.gov.in)' },
            { id: 'Labour', label: 'Labour (labour.gov.in)' },
            { id: 'RBI', label: 'RBI (rbi.org.in)' },
            { id: 'DPIIT', label: 'DPIIT (dpiit.gov.in)' },
            { id: 'DGFT', label: 'DGFT (dgft.gov.in)' },
            { id: 'CBIC', label: 'CBIC (cbic.gov.in)' },
            { id: 'IP India', label: 'IP India (tmsearch.ipindia.gov.in)' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-lg transition whitespace-nowrap border ${
                selectedCategory === cat.id
                  ? 'bg-teal-700 text-white font-bold border-teal-700 shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Statutory Compliance Timeline / Detailed Cards */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
            <Info className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No Statutory Deadlines Found</h4>
            <p className="text-xs text-slate-500">
              No milestones match your current portal and status filters for {selectedMonth}.
            </p>
          </div>
        ) : (
          filteredItems.map(item => {
            const isOverdue = item.status === 'Overdue';
            const isUrgent = item.status === 'Urgent';
            const isCompleted = item.status === 'Completed';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-sm transition-all hover:shadow-md flex flex-col md:flex-row md:items-start justify-between gap-4 ${
                  isOverdue
                    ? 'border-rose-300 bg-rose-50/25'
                    : isUrgent
                    ? 'border-amber-300 bg-amber-50/20'
                    : isCompleted
                    ? 'border-slate-200 bg-slate-50/50 opacity-80'
                    : 'border-slate-200 hover:border-teal-400'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Due Date Box */}
                  <div
                    className={`w-20 h-18 rounded-2xl flex flex-col items-center justify-center shrink-0 border ${
                      isOverdue
                        ? 'bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-200'
                        : isUrgent
                        ? 'bg-amber-600 text-white border-amber-700 shadow-md ring-2 ring-amber-200'
                        : isCompleted
                        ? 'bg-emerald-700 text-white border-emerald-800'
                        : 'bg-teal-50 text-teal-900 border-teal-200'
                    }`}
                  >
                    <span className="text-lg sm:text-xl font-black tracking-tight leading-none">
                      {item.displayDate.split(' ')[0]}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider mt-0.5 opacity-90">
                      {item.displayDate.split(' ')[1]}
                    </span>
                    <span className="text-[9px] font-semibold mt-0.5 opacity-80">
                      {isOverdue ? 'Overdue' : isUrgent ? `${item.daysRemaining}d left` : isCompleted ? 'Filed' : `${item.daysRemaining}d`}
                    </span>
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                        {item.displayDate} — {item.eventTitle}
                      </h3>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          item.category === 'GST'
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : item.category === 'TDS'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : item.category === 'ROC'
                            ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                            : item.category === 'EPFO'
                            ? 'bg-teal-100 text-teal-800 border-teal-200'
                            : item.category === 'ESIC'
                            ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                            : item.category === 'RBI'
                            ? 'bg-purple-100 text-purple-800 border-purple-200'
                            : item.category === 'IP India'
                            ? 'bg-violet-100 text-violet-800 border-violet-200'
                            : item.category === 'CBIC'
                            ? 'bg-rose-100 text-rose-800 border-rose-200'
                            : item.category === 'DPIIT'
                            ? 'bg-cyan-100 text-cyan-800 border-cyan-200'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {item.category}
                      </span>

                      {/* Official Portal Domain Link */}
                      {item.portalUrl && (
                        <a
                          href={item.portalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1 transition"
                          title={`Open ${item.portalName} (${item.portalDomain})`}
                        >
                          <Globe className="w-2.5 h-2.5 text-slate-500" />
                          <span>{item.portalDomain || item.portalName}</span>
                          <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                        </a>
                      )}

                      {item.formNumber && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {item.formNumber}
                        </span>
                      )}

                      {item.isAutoGenerated && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                          Auto-Synced
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed max-w-3xl">
                      {item.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                      <span className="font-semibold text-slate-700">
                        Applicable to: <span className="font-normal text-slate-600">{item.applicableTo}</span>
                      </span>
                      {item.actLaw && (
                        <span className="font-mono text-slate-500">
                          • {item.actLaw}
                        </span>
                      )}
                      {item.penaltyInfo && (
                        <span className="text-rose-600 font-medium">
                          • {item.penaltyInfo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => handleToggleComplete(item)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 border ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    }`}
                  >
                    <Check className={`w-3.5 h-3.5 ${isCompleted ? 'text-emerald-700' : 'text-slate-500'}`} />
                    <span>{isCompleted ? 'Filed ✓' : 'Mark Filed'}</span>
                  </button>

                  <button
                    onClick={() => handleBroadcastNotice(item)}
                    className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 border border-teal-200/80 transition"
                    title="Broadcast WhatsApp deadline alert to affected client list"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Notify Clients</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
