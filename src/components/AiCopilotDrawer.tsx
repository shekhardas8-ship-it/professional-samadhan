// src/components/AiCopilotDrawer.tsx
import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Clock,
  ArrowRight,
  RefreshCw,
  X,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';

interface AiCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  agent?: 'Orchestrator' | 'ComplianceAgent' | 'DocumentAgent' | 'FollowUpAgent' | 'NoticeAgent' | 'BillingAgent';
  text: string;
  timestamp: string;
  actionRequired?: {
    type: 'bulk_whatsapp' | 'status_update' | 'invoice_dispatch';
    summary: string;
    details: string;
    status: 'pending' | 'approved' | 'rejected';
  };
}

export const AiCopilotDrawer: React.FC<AiCopilotDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'assistant',
      agent: 'Orchestrator',
      text: 'Good day! I am your QuinceCA AI Copilot. I can query practice compliance, track missing GST invoices, draft WhatsApp reminder dispatches, inspect notices, and analyze billing collections. How can I assist you?',
      timestamp: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const samplePrompts = [
    'Which clients have not submitted September GST documents?',
    'Show GST filings due this week.',
    'Which clients have outstanding fees above ₹50,000?',
    'Show DSCs expiring within 30 days.',
    'Prepare reminders for clients with missing documents.',
  ];

  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: 'Just now',
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);

    setTimeout(() => {
      let reply: ChatMessage;
      const lower = query.toLowerCase();

      if (lower.includes('september') || lower.includes('missing') || lower.includes('document')) {
        reply = {
          id: `ai_${Date.now()}`,
          sender: 'assistant',
          agent: 'FollowUpAgent',
          text: 'Found 4 clients with pending September 2026 GST documents:\n1. Briopox Technologies Pvt Ltd (Missing Bank Statement & Purchase Invoices)\n2. AeroLogistics Supply Chain (Missing Debit Notes)\n3. Zenith Engineering (Awaiting Sales Register)\n4. Surya Pharma Ltd (Purchase Invoices pending verification)',
          timestamp: 'Just now',
          actionRequired: {
            type: 'bulk_whatsapp',
            summary: 'Dispatch Automated WhatsApp Reminders to 4 Clients',
            details: 'Will send personalized WhatsApp messages with secure upload tokens to registered director numbers.',
            status: 'pending',
          },
        };
      } else if (lower.includes('due') || lower.includes('filing') || lower.includes('week') || lower.includes('compliance')) {
        reply = {
          id: `ai_${Date.now()}`,
          sender: 'assistant',
          agent: 'ComplianceAgent',
          text: 'Statutory filings due this week:\n• 11 Oct: GSTR-1 for monthly filers (18 clients)\n• 13 Oct: GSTR-1 IFF for QRMP scheme (4 clients)\n• 15 Oct: TCS return filing Form 27EQ (2 clients)\nAll checklist workflows have been auto-assigned to Senior Associate Pooja Verma.',
          timestamp: 'Just now',
        };
      } else if (lower.includes('outstanding') || lower.includes('fee') || lower.includes('billing')) {
        reply = {
          id: `ai_${Date.now()}`,
          sender: 'assistant',
          agent: 'BillingAgent',
          text: '2 clients currently exceed ₹50,000 in outstanding professional fees:\n• BrioPox Technologies: ₹64,900 (Invoice #INV-2026-081, 42 days overdue)\n• Zenith Engineering: ₹52,000 (Invoice #INV-2026-074, 31 days overdue)\nTotal collectible amount: ₹1,16,900.',
          timestamp: 'Just now',
        };
      } else if (lower.includes('dsc') || lower.includes('expiring')) {
        reply = {
          id: `ai_${Date.now()}`,
          sender: 'assistant',
          agent: 'NoticeAgent',
          text: 'DSC Expiry Radar:\n• CA Suraj Dutta (Signing Partner DSC Class 3): Expires in 22 days (27 Oct 2026)\n• Director Rahul Mehra (Briopox Technologies DIN: 08492013): Expires in 14 days (19 Oct 2026)\nRenewals can be initiated directly from the Notices & DSC module.',
          timestamp: 'Just now',
        };
      } else {
        reply = {
          id: `ai_${Date.now()}`,
          sender: 'assistant',
          agent: 'Orchestrator',
          text: `Analyzed query across QuinceCA AI practice database for active tenant. All 25 client accounts verified against RBAC scope. Let me know if you would like me to trigger document intake or compile working papers.`,
          timestamp: 'Just now',
        };
      }

      setMessages(prev => [...prev, reply]);
      setIsProcessing(false);
    }, 700);
  };

  const handleApproveAction = (msgId: string) => {
    setMessages(prev =>
      prev.map(m => {
        if (m.id === msgId && m.actionRequired) {
          return {
            ...m,
            actionRequired: { ...m.actionRequired, status: 'approved' },
          };
        }
        return m;
      })
    );
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center text-slate-950 font-bold shadow-xs">
            <Sparkles className="w-4 h-4 text-[#0a1f1c]" />
          </div>
          <div>
            <h2 className="text-sm font-bold flex items-center gap-1.5">
              <span>QuinceCA AI Copilot</span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Active
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Multi-Agent Orchestrator • Gemini Multimodal Vision • Strict RBAC
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 overflow-x-auto flex gap-2 no-scrollbar">
        {samplePrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            className="text-xs font-medium text-slate-700 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 px-3 py-1.5 rounded-lg whitespace-nowrap transition shadow-2xs shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[500px]">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-400">
              {msg.sender === 'user' ? (
                <>
                  <span>You (Partner)</span>
                  <User className="w-3 h-3 text-slate-500" />
                </>
              ) : (
                <>
                  <Bot className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-semibold text-emerald-700">
                    {msg.agent || 'AI Copilot'}
                  </span>
                  <span>• {msg.timestamp}</span>
                </>
              )}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-slate-900 text-white rounded-br-xs'
                  : 'bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200 whitespace-pre-line'
              }`}
            >
              {msg.text}

              {/* High-Risk Action Guardrail Card (Section 20 requirement) */}
              {msg.actionRequired && (
                <div className="mt-3 p-3 bg-white rounded-xl border border-amber-200 text-slate-800 shadow-xs">
                  <div className="flex items-center gap-1.5 text-amber-700 font-bold text-xs mb-1">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>Sensitive Action: Partner Approval Required</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mb-2">
                    {msg.actionRequired.details}
                  </p>

                  {msg.actionRequired.status === 'pending' ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveAction(msg.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition shadow-xs flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Authorize & Dispatch</span>
                      </button>
                      <button
                        onClick={() => {
                          setMessages(prev =>
                            prev.map(m =>
                              m.id === msg.id && m.actionRequired
                                ? { ...m, actionRequired: { ...m.actionRequired, status: 'rejected' } }
                                : m
                            )
                          );
                        }}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition"
                      >
                        Reject
                      </button>
                    </div>
                  ) : msg.actionRequired.status === 'approved' ? (
                    <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Approved & Executed: WhatsApp dispatches queued in Baileys Bot</span>
                    </div>
                  ) : (
                    <div className="text-[11px] font-bold text-rose-700 flex items-center gap-1 bg-rose-50 p-2 rounded-lg border border-rose-200">
                      <span>Action was rejected by user.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            <span>Consulting specialized agents & querying practice database...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-3 bg-slate-50 border-t border-slate-200">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask Copilot anything about clients, GST filings, notices, or tasks..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isProcessing}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl transition shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
