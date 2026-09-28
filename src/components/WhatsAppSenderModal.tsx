// src/components/WhatsAppSenderModal.tsx
import React, { useState } from 'react';
import { MonthlyRequest } from '../types/index.ts';
import {
  X,
  Send,
  ExternalLink,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Info,
  Copy,
  Check,
} from 'lucide-react';

interface WhatsAppSenderModalProps {
  request: MonthlyRequest;
  actionType: 'initial' | 'reminder';
  onClose: () => void;
  onRefreshParent: () => void;
}

export const WhatsAppSenderModal: React.FC<WhatsAppSenderModalProps> = ({
  request,
  actionType,
  onClose,
  onRefreshParent,
}) => {
  const [messagingMode, setMessagingMode] = useState<'manual' | 'automated'>('manual');
  const [isSending, setIsSending] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Compute preview message
  const uploadLink = `${window.location.origin}/client-portal?token=${request.secureUploadToken}`;
  const initialMessage = `Good morning Sir/Madam,

Kindly send the following documents for GST filing for ${request.reportingMonth}:

1. Sales invoices
2. Purchase invoices
3. Bank statements for the previous month
4. Debit notes and credit notes, if any

Please upload documents here: ${uploadLink}

If there were no transactions or no debit/credit notes, please confirm this in the portal.

Regards,
Team Professional Samadhan`;

  const reminderMessage = `Dear ${request.contactPerson || 'Client'},

For ${request.reportingMonth}, the following items are still pending:

1. Remaining Sales / Purchase Invoices
2. Bank Statement for ${request.reportingMonth}

Please upload them here: ${uploadLink}

If an item is not applicable, please confirm in the portal.

Regards,
Team Professional Samadhan`;

  const [messageText, setMessageText] = useState(
    actionType === 'initial' ? initialMessage : reminderMessage
  );

  const cleanPhone = (request.registeredPhone || '919820112345').replace(/\D/g, '');
  const manualWhatsAppWebUrl = `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(messageText)}`;

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDispatch = async () => {
    try {
      setIsSending(true);
      const res = await fetch(`/api/monthly-requests/${request.id}/reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: messagingMode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch message');
      setDispatchResult(data.dispatchResult);
      onRefreshParent();
    } catch (err: any) {
      setDispatchResult({
        status: 'failed',
        details: err.message,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2 text-emerald-800">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-lg text-slate-900">
              {actionType === 'initial' ? 'Prepare WhatsApp Monthly Request' : 'Dispatch WhatsApp Reminder'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Client details info bar */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500">Recipient:</span>{' '}
            <strong className="text-slate-800">{request.clientName}</strong> ({request.contactPerson})
          </div>
          <div className="font-mono text-emerald-700 font-semibold">{request.registeredPhone}</div>
        </div>

        {/* Mode Selector */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">Messaging Mode</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMessagingMode('manual')}
              className={`p-2.5 rounded-lg border text-xs font-medium text-left transition ${
                messagingMode === 'manual'
                  ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-1 ring-emerald-600'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="font-bold flex items-center justify-between">
                <span>Mode A: WhatsApp Web / App</span>
                <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded">100% Delivery</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Click-to-chat. Delivers to ANY client immediately without Meta 24-hr restrictions.</div>
            </button>

            <button
              type="button"
              onClick={() => setMessagingMode('automated')}
              className={`p-2.5 rounded-lg border text-xs font-medium text-left transition ${
                messagingMode === 'automated'
                  ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-1 ring-emerald-600'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="font-bold flex items-center justify-between">
                <span>Mode B: Meta Cloud API</span>
                <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-800 font-bold rounded">Automated Bot</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Automated API. Delivers if client messaged in last 24h or template is approved.</div>
            </button>
          </div>
        </div>

        {/* Editable Message Body */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">Message Body (Statutory Template)</label>
            <button
              onClick={handleCopyMessage}
              className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>
          </div>
          <textarea
            rows={8}
            value={messageText}
            onChange={e => setMessageText(e.target.value)}
            className="w-full text-xs font-mono p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-slate-800 leading-relaxed"
          />
        </div>

        {/* Status Callout if dispatched */}
        {dispatchResult && (
          <div
            className={`p-3 rounded-lg text-xs space-y-2 border ${
              dispatchResult.status === 'sent'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : dispatchResult.status === 'prepared' || dispatchResult.status === 'simulated_dev'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="font-bold uppercase tracking-wider text-[10px]">
              Dispatch Status: {dispatchResult.status}
            </div>
            {dispatchResult.details?.includes('131030') ? (
              <div className="space-y-1.5 text-xs text-rose-900">
                <p className="font-semibold">
                  ⚠️ Meta Developer Sandbox Limitation (Code 131030):
                </p>
                <p className="text-[11px] text-slate-700">
                  This recipient phone number ({request.registeredPhone}) is not in your Meta Developer test whitelist. While your Meta App is in Developer/Sandbox mode, Meta only allows sending to up to 5 verified test numbers.
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <a
                    href={manualWhatsAppWebUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleDispatch}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow-sm transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Send via Mode A (WhatsApp Web)</span>
                  </a>
                  <span className="text-[10px] text-slate-500">Works 100% free with any phone number!</span>
                </div>
              </div>
            ) : dispatchResult.status === 'sent' && dispatchResult.mode === 'automated_meta_api' ? (
              <div className="space-y-2 text-xs">
                <p className="font-medium text-emerald-900">{dispatchResult.details}</p>
                <div className="p-2.5 bg-white/80 rounded border border-emerald-300 text-slate-800 space-y-1.5 shadow-sm">
                  <p className="font-semibold text-emerald-900 text-[11px] flex items-center gap-1">
                    <span>📱 Note on Client Phone Delivery:</span>
                  </p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Meta accepted the API dispatch. Under WhatsApp Business policies, Meta delivers free-text messages to phones that have messaged your WhatsApp Business number within the last 24 hours (or numbers on your Meta test list).
                  </p>
                  <p className="text-[11px] text-slate-700 font-medium">
                    If this client has not messaged you recently and did not see the message, send directly with 1 click:
                  </p>
                  <div className="pt-1">
                    <a
                      href={manualWhatsAppWebUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold shadow-sm transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in WhatsApp Web / App (Guaranteed 100% Delivery)</span>
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <p>{dispatchResult.details}</p>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="text-[11px] text-slate-400">
            {messagingMode === 'manual' ? (
              <span>Staff explicitly clicks to launch WhatsApp chat.</span>
            ) : (
              <span>Uses official Meta Graph API v19.0.</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Close
            </button>

            {messagingMode === 'manual' ? (
              <a
                href={manualWhatsAppWebUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDispatch}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow transition flex items-center space-x-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in WhatsApp Web</span>
              </a>
            ) : (
              <button
                type="button"
                onClick={handleDispatch}
                disabled={isSending}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow transition flex items-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'Sending API Request...' : 'Dispatch via Meta API'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
