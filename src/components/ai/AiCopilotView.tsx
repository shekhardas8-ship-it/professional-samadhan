// src/components/ai/AiCopilotView.tsx
import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Layers,
  FileText,
  User,
  Zap,
} from 'lucide-react';
import { INITIAL_AI_AGENT_ACTIONS } from '../../services/frontPageDataService.ts';

export const AiCopilotView: React.FC = () => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; agent?: string; timestamp: string }>>([
    {
      role: 'assistant',
      text: "Good day, CA Shekhar Das. I am your QuinceCA Autonomous Copilot. I have indexed your firm's active clients, September GST filings, statutory notices, and DSC expiry radar. How can I assist you today?",
      agent: 'Orchestrator Agent',
      timestamp: '10:00 AM',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [agentActions, setAgentActions] = useState(INITIAL_AI_AGENT_ACTIONS);

  const quickPrompts = [
    'Which clients have not submitted September GST documents?',
    'Show GST filings due this week.',
    'Which clients have outstanding fees above ₹50,000?',
    'Show DSCs expiring within 30 days.',
    'Prepare reminders for clients with missing documents.',
    "Summarize today's critical work.",
  ];

  const handleSendMessage = (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim()) return;

    const userMsg = {
      role: 'user' as const,
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    // Simulate intelligent multi-agent routing
    setTimeout(() => {
      let botResponse = '';
      let agent = 'Orchestrator Agent';

      const lower = textToSend.toLowerCase();
      if (lower.includes('missing') || lower.includes('not submitted')) {
        agent = 'Follow-Up Agent';
        botResponse = `🔍 **Missing Document Analysis (September 2026 Filing Cycle)**:\n\n• **Briopox Pvt Ltd** (07AABCB9123D1ZX): Bank Statement & Credit Notes are pending.\n• **Aggarwal & Sons Trading Co.** (07AAACA4491E1ZQ): Purchase Invoices Batch 2 pending.\n• **Apex Healthtech LLP** (07AABFA8941N1Z3): Bank statements missing.\n\nAutomated Day-3 WhatsApp follow-up reminders are queued and ready for your confirmation.`;
      } else if (lower.includes('due') || lower.includes('filing') || lower.includes('gst')) {
        agent = 'Compliance Agent';
        botResponse = `📅 **Statutory Due Dates (Next 7 Days)**:\n\n1. **GSTR-1 (Monthly)**: Due 11th Oct (12 clients applicable).\n2. **TDS Challan Deposit (ITNS 281)**: Due 7th Oct (18 clients applicable).\n3. **DIR-3 KYC**: Due today (Completed for all directors).\n\nFiling progress is currently at 58% overall completion.`;
      } else if (lower.includes('fee') || lower.includes('outstanding') || lower.includes('50,000')) {
        agent = 'Billing Agent';
        botResponse = `💰 **Outstanding Fee Radar (> ₹50,000)**:\n\n• **Briopox Pvt Ltd**: ₹85,000 (Tax Audit & Retainer for 2 months)\n• **Aggarwal & Sons**: ₹54,000 (Notice representation)\n\nTotal firm outstanding across all clients: **₹2.40 Lakhs**. Payment reminders can be scheduled automatically.`;
      } else if (lower.includes('dsc') || lower.includes('expiring')) {
        agent = 'Security & Verification Agent';
        botResponse = `🔑 **DSCs Expiring Within 30 Days**:\n\n• **Ramesh Aggarwal** (Class 3 Combo) - Expiry: 12-Oct-2026 (7 Days remaining)\n• **SN Biswas** (Class 3 Signing) - Expiry: 25-Oct-2026 (20 Days remaining)\n\nBoth client authorized signatories have received initial renewal notifications.`;
      } else {
        botResponse = `✅ I have processed your request across the **QuinceCA Practice Engine**. All client records, GST logs, and audit workpapers are updated. No critical compliance breaches detected.`;
      }

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: botResponse,
          agent: agent,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsTyping(false);
    }, 700);
  };

  const handleApproveAction = (actionId: string) => {
    setAgentActions(agentActions.map(a => {
      if (a.id === actionId) {
        return { ...a, status: 'Approved & Executed' as const };
      }
      return a;
    }));
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">AI CA Copilot & Autonomous Agents</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Gemini Vision & Multi-Agent Network
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise conversational intelligence, autonomous document extraction, and human-in-the-loop safety approval gates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>RBAC & Safety Gates Active</span>
          </span>
        </div>
      </div>

      {/* 2-Column Layout: Chat on Left, AI Safety Gate & Agent Hub on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Conversational Copilot */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-[650px] overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800">QuinceCA Autonomous Copilot</h3>
                <p className="text-[10px] text-slate-500">Connected to Neon PostgreSQL & Gemini 2.0</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Zero Leakage Isolated Tenant
            </span>
          </div>

          {/* Quick Prompts Carousel */}
          <div className="p-3 bg-slate-50/40 border-b border-slate-100 flex gap-2 overflow-x-auto custom-scrollbar">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-700 text-[11px] font-medium whitespace-nowrap transition shadow-2xs"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs custom-scrollbar">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                {m.agent && (
                  <span className="text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-500" /> {m.agent} • {m.timestamp}
                  </span>
                )}
                <div
                  className={`p-3.5 rounded-xl max-w-xl leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-emerald-600 text-white font-medium rounded-tr-none shadow-xs'
                      : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/80 whitespace-pre-line'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-slate-400 text-xs italic">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                <span>Specialist agents consulting practice database...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="p-3 border-t border-slate-100 bg-white">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={e => setInputQuery(e.target.value)}
                placeholder="Ask about compliance due dates, client documents, notices, or fees..."
                className="flex-1 p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#00c073]"
              />
              <button
                type="submit"
                className="p-2.5 bg-[#00c073] hover:bg-[#00a864] text-white rounded-lg transition shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: AI Safety Gate & Pending Approvals */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">AI Safety Approval Gate</h3>
              </div>
              <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                Human-in-the-Loop
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-tight">
              High-risk & sensitive actions (bulk WhatsApp broadcasts, financial entries, portal submissions) require Partner approval before execution.
            </p>

            <div className="space-y-3 pt-2">
              {agentActions.map(action => (
                <div
                  key={action.id}
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{action.agentName}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      action.riskLevel === 'READ ONLY'
                        ? 'bg-slate-200 text-slate-700'
                        : action.riskLevel === 'SENSITIVE'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {action.riskLevel}
                    </span>
                  </div>

                  <p className="text-[11px] font-semibold text-slate-700">{action.actionTitle}</p>
                  <p className="text-[10px] text-slate-500">{action.summary}</p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px]">
                    <span className="text-slate-400 font-mono">{action.timestamp}</span>
                    {action.status === 'Pending Approval' ? (
                      <button
                        onClick={() => handleApproveAction(action.id)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold transition shadow-xs"
                      >
                        Approve & Execute
                      </button>
                    ) : (
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {action.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
