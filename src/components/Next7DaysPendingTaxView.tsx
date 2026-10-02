// src/components/Next7DaysPendingTaxView.tsx
import React, { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  Send,
  CheckCircle2,
  Phone,
  Building2,
  Calendar,
  IndianRupee,
  ShieldAlert,
  ArrowRight,
  Filter,
  ArrowLeft,
  BellRing,
  Sparkles,
  Briefcase,
  FileSpreadsheet,
  Receipt,
  HelpCircle,
  ExternalLink,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import { PendingTaskItem } from '../types/index.ts';
import { INITIAL_ACCUMULATED_TASKS_7_DAYS } from '../services/frontPageDataService.ts';

interface Next7DaysPendingTaskViewProps {
  onBack?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const Next7DaysPendingTaxView: React.FC<Next7DaysPendingTaskViewProps> = ({ onBack, onNavigateTab }) => {
  const [tasks, setTasks] = useState<PendingTaskItem[]>(() => {
    const saved = localStorage.getItem('ps_pending_tasks_7days');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_ACCUMULATED_TASKS_7_DAYS;
      }
    }
    return INITIAL_ACCUMULATED_TASKS_7_DAYS;
  });

  const [filterSection, setFilterSection] = useState<string>('all');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [isNotifyingCa, setIsNotifyingCa] = useState(false);
  const [caNotificationPhone, setCaNotificationPhone] = useState('+919873875138');

  const persistTasks = (updated: PendingTaskItem[]) => {
    setTasks(updated);
    localStorage.setItem('ps_pending_tasks_7days', JSON.stringify(updated));
  };

  // Compile full CA 7-Day Digest message
  const generateCaDigestMessage = () => {
    const criticalTasks = tasks.filter(t => t.urgency === 'critical');
    const urgentTasks = tasks.filter(t => t.urgency === 'urgent');
    const totalAmount = tasks.reduce((sum, t) => sum + (t.estimatedAmount || 0), 0);

    let msg = `📋 *PROFESSIONAL SAMADHAN — 7-DAY CA EXECUTIVE TASK DIGEST*\n`;
    msg += `📅 Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | Alert Window: Next 7 Days\n\n`;
    msg += `🚨 *TOTAL PENDING TASKS:* ${tasks.length} Items\n`;
    msg += `• 🔴 Critical / Urgent: ${criticalTasks.length + urgentTasks.length} Tasks\n`;
    msg += `• 💰 Cumulative Financial Dues / Base: ₹${totalAmount.toLocaleString('en-IN')}\n\n`;

    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `⏳ *NEXT UPCOMING PENDING TASKS:*\n`;

    tasks.slice(0, 8).forEach((task, idx) => {
      const sectionBadge =
        task.sourceSection === 'statutory_tax'
          ? '🏛️ Tax Filing'
          : task.sourceSection === 'gst_intake'
          ? '📥 GST Intake'
          : task.sourceSection === 'client_approval'
          ? '⚖️ Sign-Off'
          : task.sourceSection === 'billing'
          ? '💼 Fee Due'
          : '❓ Request';

      msg += `${idx + 1}. [${sectionBadge}] *${task.clientName}*\n`;
      msg += `   • *Task:* ${task.taskTitle}\n`;
      msg += `   • *Due:* ${task.dueDate} (${task.daysRemaining}d remaining) | *Status:* ${task.status}\n`;
      if (task.estimatedAmount) {
        msg += `   • *${task.amountLabel || 'Amount'}:* ₹${task.estimatedAmount.toLocaleString('en-IN')}\n`;
      }
      msg += `\n`;
    });

    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `👉 *Executive Action Required:* Please review pending client approvals, unfiled returns & intake reminders.\n`;
    msg += `🔗 *Portal:* http://localhost:3000\n`;
    return msg;
  };

  // Dispatch full digest to CA via WhatsApp
  const handleNotifyCaFullDigest = async () => {
    try {
      setIsNotifyingCa(true);
      const msg = generateCaDigestMessage();
      const res = await fetch('/api/whatsapp/device-send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: caNotificationPhone, messageText: msg }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ 7-Day CA Executive Task Digest dispatched to CA Admin (${caNotificationPhone}) via WhatsApp!`);
      } else {
        window.open(`https://wa.me/${caNotificationPhone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
      }
    } catch {
      const msg = generateCaDigestMessage();
      window.open(`https://wa.me/${caNotificationPhone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    } finally {
      setIsNotifyingCa(false);
    }
  };

  // Fast notify CA for the single next most urgent task
  const handleNotifyNextUrgentTask = async () => {
    const nextUrgent = tasks[0];
    if (!nextUrgent) return;

    const msg = `⚡ *URGENT CA TASK ALERT: NEXT IMMINENT TASK*\n\n` +
      `🏢 *Client:* ${nextUrgent.clientName} (${nextUrgent.clientGstin || 'GST'})\n` +
      `📌 *Section:* ${nextUrgent.sourceSectionName}\n` +
      `🎯 *Task:* ${nextUrgent.taskTitle}\n` +
      `⏳ *Due Date:* ${nextUrgent.dueDate} (${nextUrgent.daysRemaining} days remaining)\n` +
      `📊 *Status:* ${nextUrgent.status}\n` +
      `👤 *Assigned:* ${nextUrgent.assignedStaff || 'CA Team'}\n\n` +
      `Please ensure timely clearance.\n- Professional Samadhan Automation`;

    try {
      const res = await fetch('/api/whatsapp/device-send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: caNotificationPhone, messageText: msg }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`⚡ Sent Next Urgent Task Alert to CA Admin (${caNotificationPhone})!`);
      } else {
        window.open(`https://wa.me/${caNotificationPhone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
      }
    } catch {
      window.open(`https://wa.me/${caNotificationPhone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  // Notify individual task to CA or Client
  const handleTaskAction = async (task: PendingTaskItem, notifyTarget: 'ca' | 'client') => {
    const targetPhone = notifyTarget === 'ca' ? caNotificationPhone : (task.registeredPhone || caNotificationPhone);
    const recipientName = notifyTarget === 'ca' ? 'CA Admin' : task.clientName;

    const msg = notifyTarget === 'ca'
      ? `🚨 *PENDING TASK NOTICE FOR CA*\n\n` +
        `Client: ${task.clientName}\n` +
        `Section: ${task.sourceSectionName}\n` +
        `Task: ${task.taskTitle}\n` +
        `Due: ${task.dueDate} (${task.daysRemaining}d left)\n` +
        `Status: ${task.status}\n` +
        `Staff: ${task.assignedStaff}\n\n` +
        `- Professional Samadhan System`
      : `🚨 *URGENT COMPLIANCE & TASK NOTICE*\n\n` +
        `Dear ${task.clientName},\n` +
        `This is a priority reminder regarding your *${task.taskTitle}*.\n` +
        `Due Date: ${task.dueDate} (${task.daysRemaining} days remaining).\n` +
        `Status: ${task.status}\n\n` +
        `Kindly complete required submissions / sign-offs to prevent statutory penalties.\n\n` +
        `Regards,\nTeam Professional Samadhan`;

    try {
      const res = await fetch('/api/whatsapp/device-send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: targetPhone, messageText: msg }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ WhatsApp Alert dispatched to ${recipientName} (${targetPhone})!`);
      } else {
        window.open(`https://wa.me/${targetPhone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
      }
    } catch {
      window.open(`https://wa.me/${targetPhone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    }

    const today = new Date().toISOString().split('T')[0];
    const updated = tasks.map(t => (t.id === task.id ? { ...t, lastReminderSent: today } : t));
    persistTasks(updated);
  };

  const handleCopySummary = () => {
    const msg = generateCaDigestMessage();
    navigator.clipboard.writeText(msg);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // Filtered task items
  const filteredTasks = tasks.filter(t => {
    if (filterSection === 'all') return true;
    return t.sourceSection === filterSection;
  });

  // KPI calculations across all sections
  const statutoryTaxCount = tasks.filter(t => t.sourceSection === 'statutory_tax').length;
  const gstIntakeCount = tasks.filter(t => t.sourceSection === 'gst_intake').length;
  const clientApprovalCount = tasks.filter(t => t.sourceSection === 'client_approval').length;
  const billingDuesCount = tasks.filter(t => t.sourceSection === 'billing').length;
  const adhocCount = tasks.filter(t => t.sourceSection === 'adhoc').length;
  const totalFinancialAmount = tasks.reduce((sum, t) => sum + (t.estimatedAmount || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Banner */}
      <div className="theme-banner text-white rounded-3xl p-6 sm:p-8 shadow-xl border flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
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
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase tracking-wider theme-accent-text font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Unified Practice Task Radar
            </span>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-400/30 font-semibold">
              7-Day Alert Window
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
            Next 7 Days Pending Tasks
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Accumulated real-time tracking of pending tasks across all sections: Statutory Tax Filings, GST Document Intake, Client Workbook Approvals, Overdue Billing Collections, and Adhoc Services.
          </p>
        </div>

        {/* CA Notification Action Center */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleNotifyNextUrgentTask}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-lg transition active:scale-95"
            title="Fast alert CA on the single next urgent task"
          >
            <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
            <span>Notify Next Task</span>
          </button>

          <button
            onClick={handleNotifyCaFullDigest}
            disabled={isNotifyingCa}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg transition active:scale-95"
            title="Dispatch full 7-Day CA Executive Task Digest via WhatsApp"
          >
            <BellRing className="w-4 h-4 text-emerald-100" />
            <span>{isNotifyingCa ? 'Dispatching...' : 'Dispatch CA 7-Day Digest'}</span>
          </button>

          <button
            onClick={handleCopySummary}
            className="p-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition border border-white/20"
            title="Copy formatted 7-day task summary to clipboard"
          >
            {copiedSummary ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards (Accumulated Across All Sections) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div
          onClick={() => setFilterSection('all')}
          className={`rounded-2xl p-4 border transition cursor-pointer shadow-sm ${
            filterSection === 'all'
              ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-indigo-500'
              : 'bg-white text-slate-900 border-slate-200 hover:border-slate-400'
          }`}
        >
          <div className="text-[11px] font-semibold uppercase opacity-75">Total Pending Tasks</div>
          <div className="text-2xl sm:text-3xl font-black mt-1">{tasks.length}</div>
          <div className="text-[11px] text-rose-500 font-bold mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Across all 5 sections
          </div>
        </div>

        <div
          onClick={() => setFilterSection('statutory_tax')}
          className={`rounded-2xl p-4 border transition cursor-pointer shadow-sm ${
            filterSection === 'statutory_tax'
              ? 'bg-teal-900 text-white border-teal-900 ring-2 ring-teal-500'
              : 'bg-white text-slate-900 border-slate-200 hover:border-teal-400'
          }`}
        >
          <div className="text-[11px] font-semibold uppercase text-teal-600">🏛️ Statutory Tax</div>
          <div className="text-2xl sm:text-3xl font-black mt-1">{statutoryTaxCount}</div>
          <div className="text-[11px] opacity-75 mt-1">GSTR-1, TDS & Filings</div>
        </div>

        <div
          onClick={() => setFilterSection('gst_intake')}
          className={`rounded-2xl p-4 border transition cursor-pointer shadow-sm ${
            filterSection === 'gst_intake'
              ? 'bg-indigo-900 text-white border-indigo-900 ring-2 ring-indigo-500'
              : 'bg-white text-slate-900 border-slate-200 hover:border-indigo-400'
          }`}
        >
          <div className="text-[11px] font-semibold uppercase text-indigo-600">📥 GST Intake</div>
          <div className="text-2xl sm:text-3xl font-black mt-1">{gstIntakeCount}</div>
          <div className="text-[11px] opacity-75 mt-1">Pending client uploads</div>
        </div>

        <div
          onClick={() => setFilterSection('client_approval')}
          className={`rounded-2xl p-4 border transition cursor-pointer shadow-sm ${
            filterSection === 'client_approval'
              ? 'bg-amber-900 text-white border-amber-900 ring-2 ring-amber-500'
              : 'bg-white text-slate-900 border-slate-200 hover:border-amber-400'
          }`}
        >
          <div className="text-[11px] font-semibold uppercase text-amber-600">⚖️ Client Sign-Off</div>
          <div className="text-2xl sm:text-3xl font-black mt-1">{clientApprovalCount}</div>
          <div className="text-[11px] opacity-75 mt-1">Workbooks awaiting OK</div>
        </div>

        <div
          onClick={() => setFilterSection('billing')}
          className={`rounded-2xl p-4 border transition cursor-pointer shadow-sm ${
            filterSection === 'billing'
              ? 'bg-emerald-900 text-white border-emerald-900 ring-2 ring-emerald-500'
              : 'bg-white text-slate-900 border-slate-200 hover:border-emerald-400'
          }`}
        >
          <div className="text-[11px] font-semibold uppercase text-emerald-600">💼 Billing & Dues</div>
          <div className="text-2xl sm:text-3xl font-black mt-1 font-mono">
            {billingDuesCount}
          </div>
          <div className="text-[11px] opacity-75 mt-1">Pending fees clearance</div>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Filter Section:</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap text-xs font-semibold">
          {[
            { key: 'all', label: `All Sections (${tasks.length})` },
            { key: 'statutory_tax', label: `🏛️ Statutory Tax (${statutoryTaxCount})` },
            { key: 'gst_intake', label: `📥 GST Intake (${gstIntakeCount})` },
            { key: 'client_approval', label: `⚖️ Approvals (${clientApprovalCount})` },
            { key: 'billing', label: `💼 Billing (${billingDuesCount})` },
            { key: 'adhoc', label: `❓ Adhoc (${adhocCount})` },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilterSection(f.key)}
              className={`px-3 py-1.5 rounded-xl transition ${
                filterSection === f.key
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Accumulated Tasks Cards List */}
      <div className="space-y-3">
        {filteredTasks.map(task => {
          const isCritical = task.urgency === 'critical';
          const isUrgent = task.urgency === 'urgent';

          return (
            <div
              key={task.id}
              className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                isCritical
                  ? 'border-rose-300 bg-rose-50/15'
                  : isUrgent
                  ? 'border-amber-300 bg-amber-50/15'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Days remaining badge */}
                <div
                  className={`w-12 h-12 rounded-2xl font-black flex flex-col items-center justify-center text-xs shrink-0 border shadow-xs ${
                    task.daysRemaining <= 3
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : task.daysRemaining <= 5
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  <span className="text-sm font-black leading-none">{task.daysRemaining}d</span>
                  <span className="text-[9px] uppercase font-bold text-slate-500">Left</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        task.sourceSection === 'statutory_tax'
                          ? 'bg-teal-100 text-teal-800 border border-teal-200'
                          : task.sourceSection === 'gst_intake'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : task.sourceSection === 'client_approval'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : task.sourceSection === 'billing'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-purple-100 text-purple-800 border border-purple-200'
                      }`}
                    >
                      {task.sourceSectionName}
                    </span>

                    <h3 className="text-base font-extrabold text-slate-900">{task.clientName}</h3>

                    {task.clientGstin && (
                      <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-semibold">
                        {task.clientGstin}
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-slate-800 leading-snug">
                    {task.taskTitle}
                  </p>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    {task.taskDescription}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <strong>Due:</strong> {task.dueDate}
                    </span>

                    <span className="flex items-center gap-1">
                      <strong>Status:</strong>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {task.status}
                      </span>
                    </span>

                    {task.assignedStaff && (
                      <span className="text-slate-500">
                        <strong>Staff:</strong> {task.assignedStaff}
                      </span>
                    )}

                    {task.lastReminderSent && (
                      <span className="text-[11px] text-emerald-700 font-medium">
                        ✓ Last Alert: {task.lastReminderSent}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons & Financial Amount */}
              <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 shrink-0 self-end lg:self-center">
                {task.estimatedAmount ? (
                  <div className="text-right pr-2">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">{task.amountLabel || 'Estimated Amount'}</div>
                    <div className="text-base sm:text-lg font-black text-slate-900 font-mono">
                      ₹{task.estimatedAmount.toLocaleString('en-IN')}
                    </div>
                  </div>
                ) : null}

                {/* Notify CA button */}
                <button
                  onClick={() => handleTaskAction(task, 'ca')}
                  className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                  title="Notify CA Admin on WhatsApp about this specific task"
                >
                  <BellRing className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Notify CA</span>
                </button>

                {/* Remind Client button */}
                {task.registeredPhone && (
                  <button
                    onClick={() => handleTaskAction(task, 'client')}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
                    title="Send automated reminder to client"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>WhatsApp Client</span>
                  </button>
                )}

                {/* Open Section link */}
                {task.targetTab && onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab(task.targetTab!)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                    title="Open task in its respective section"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-slate-800">No Pending Tasks in This Category</h4>
            <p className="text-xs">All statutory deadlines and client workflows are up to date for this section.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Export alias for seamless backwards compatibility
export const Next7DaysPendingTaskView = Next7DaysPendingTaxView;
