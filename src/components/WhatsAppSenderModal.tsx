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
  onOpenDeviceLinkModal?: () => void;
}

export const WhatsAppSenderModal: React.FC<WhatsAppSenderModalProps> = ({
  request,
  actionType,
  onClose,
  onRefreshParent,
  onOpenDeviceLinkModal,
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
Team QuinceCA`;

  const reminderMessage = `Dear ${request.contactPerson || 'Client'},

For ${request.reportingMonth}, the following items are still pending:

1. Remaining Sales / Purchase Invoices
2. Bank Statement for ${request.reportingMonth}

Please upload them here: ${uploadLink}

If an item is not applicable, please confirm in the portal.

Regards,
Team QuinceCA`;

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

  const handleSendModeA = async () => {
    try {
      setIsSending(true);
      const res = await fetch(`/api/monthly-requests/${request.id}/reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'manual', messageText }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch message');
      setDispatchResult({
        status: 'sent',
        mode: 'manual',
        details: 'Opened in WhatsApp Web / App. Reminder count and audit trail successfully logged.',
      });
      onRefreshParent();
      window.open(manualWhatsAppWebUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      setDispatchResult({
        status: 'failed',
        details: err.message,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDispatch = async () => {
    try {
      setIsSending(true);
      const res = await fetch(`/api/monthly-requests/${request.id}/reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: messagingMode, messageText }),
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

  const isOpenWADisconnected =
    dispatchResult &&
    dispatchResult.status === 'failed' &&
    (dispatchResult.details?.includes('not currently connected') ||
      dispatchResult.details?.includes('OpenWA') ||
      dispatchResult.details?.includes('link device'));

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
              <div className="text-[11px] text-slate-500 mt-0.5">Click-to-chat deep link. Sends directly to ANY client via WhatsApp Web/App with 1 click.</div>
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
                <span>Mode B: Automated WhatsApp Bot</span>
                <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded">Direct Push</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Automated push from OpenWA linked number (+91 98738 75138). Delivers to client instantly with 0 fees.</div>
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
            className={`p-3.5 rounded-xl text-xs space-y-2 border ${
              dispatchResult.status === 'sent'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : dispatchResult.status === 'prepared' || dispatchResult.status === 'simulated_dev'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="font-bold uppercase tracking-wider text-[10px] flex items-center justify-between">
              <span>Dispatch Status: {dispatchResult.status}</span>
              {dispatchResult.status === 'sent' && (
                <span className="flex items-center gap-1 text-emerald-700 font-semibold lowercase">
                  <CheckCircle2 className="w-3.5 h-3.5" /> delivered
                </span>
              )}
            </div>

            {dispatchResult.status === 'sent' ? (
              <div className="space-y-1.5 text-xs text-emerald-900">
                <p className="font-semibold">{dispatchResult.details}</p>
                {dispatchResult.mode === 'manual' && (
                  <p className="text-[11px] text-slate-600">
                    Opened in WhatsApp Web / App. Audit trail and reminder counter updated successfully.
                  </p>
                )}
              </div>
            ) : isOpenWADisconnected ? (
              <div className="space-y-2 text-xs text-rose-900">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>OpenWA WhatsApp Bot Device Disconnected</span>
                </p>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  Your OpenWA WhatsApp session (+91 98738 75138) is currently not connected to the server. You can link it now via QR/Pairing code, or immediately deliver this message using <strong>Mode A (WhatsApp Web)</strong>:
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  {onOpenDeviceLinkModal && (
                    <button
                      type="button"
                      onClick={onOpenDeviceLinkModal}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow-sm transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Link OpenWA WhatsApp Device</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSendModeA}
                    disabled={isSending}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow-sm transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Send via Mode A (WhatsApp Web)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-rose-900 font-medium">{dispatchResult.details}</p>
                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSendModeA}
                    disabled={isSending}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow-sm transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Send via Mode A (WhatsApp Web)</span>
                  </button>
                  <span className="text-[10px] text-slate-500">1-click instant delivery</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="text-[11px] text-slate-500">
            {messagingMode === 'manual' ? (
              <span>Staff launches WhatsApp Web chat with prefilled text.</span>
            ) : (
              <span>OpenWA Linked Device (+91 98738 75138) • 100% Free.</span>
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
              <button
                type="button"
                onClick={handleSendModeA}
                disabled={isSending}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow transition flex items-center space-x-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{isSending ? 'Logging...' : 'Open in WhatsApp Web'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDispatch}
                disabled={isSending}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow transition flex items-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'Sending via OpenWA...' : 'Dispatch via OpenWA Bot'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
