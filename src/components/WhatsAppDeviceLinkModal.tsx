// src/components/WhatsAppDeviceLinkModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  Send,
  ShieldCheck,
  Zap,
  X,
  QrCode,
  KeyRound,
  Copy,
  Check,
  Sparkles,
  PhoneCall,
} from 'lucide-react';

interface WhatsAppDeviceLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppDeviceLinkModal: React.FC<WhatsAppDeviceLinkModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'pairing'>('qr');
  const [statusData, setStatusData] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [pairingPhone, setPairingPhone] = useState('+91 98738 75138');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [testPhone, setTestPhone] = useState('+91 98738 75138');
  const [testMessage, setTestMessage] = useState('Hello from QuinceCA GST Platform! 1-time WhatsApp automation is active.');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/device-status');
      if (res.ok) {
        const data = await res.json();
        setStatusData(data);
      }
    } catch (err) {
      console.error('Failed to fetch WhatsApp device status:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      const interval = setInterval(fetchStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleInitialize = async () => {
    try {
      setActionLoading(true);
      setTestResult(null);
      const res = await fetch('/api/whatsapp/device-initialize', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setStatusData(data);
      }
    } catch (err: any) {
      console.error('Failed to initialize:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestPairingCode = async () => {
    try {
      setActionLoading(true);
      setPairingCode(null);
      setTestResult(null);
      const res = await fetch('/api/whatsapp/device-pairing-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: pairingPhone }),
      });
      const data = await res.json();
      if (res.ok && data.pairingCode) {
        setPairingCode(data.pairingCode);
      } else {
        alert(data.error || 'Failed to generate pairing code');
      }
    } catch (err: any) {
      alert('Error requesting pairing code: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyPairingCode = () => {
    if (!pairingCode) return;
    navigator.clipboard.writeText(pairingCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleLogout = async () => {
    if (!window.confirm('Disconnect WhatsApp device? You will need to link again.')) return;
    try {
      setActionLoading(true);
      setTestResult(null);
      setPairingCode(null);
      const res = await fetch('/api/whatsapp/device-logout', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setStatusData(data);
      }
    } catch (err: any) {
      console.error('Failed to logout:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!testPhone || !testMessage) return;
    try {
      setActionLoading(true);
      setTestResult(null);
      const res = await fetch('/api/whatsapp/device-send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPhone, messageText: testMessage }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({ success: true, message: `✅ Test message delivered successfully to ${testPhone} (ID: ${data.messageId})` });
      } else {
        setTestResult({ success: false, message: data.error || 'Failed to send test message' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  const isConnected = statusData?.status === 'connected';
  const hasQrCode = Boolean(statusData?.qrCodeDataUrl);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold">WhatsApp Device Link</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1 ${
                    isConnected
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : hasQrCode
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : hasQrCode ? 'bg-amber-400' : 'bg-slate-400'}`} />
                  <span>{isConnected ? 'Connected' : hasQrCode ? 'Scan QR Ready' : statusData?.status?.replace('_', ' ') || 'Ready'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Zero Meta Fees • 1-Time Setup • 100% Free Automated Reminders
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* STATE 1: CONNECTED */}
          {isConnected ? (
            <div className="space-y-4">
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 text-emerald-950 space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600 shrink-0">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-emerald-900">
                      WhatsApp Connected & Active!
                    </h4>
                    <p className="text-xs text-emerald-700">
                      Active Phone: <strong className="font-mono text-emerald-950">{statusData.connectedPhone || '+91 98738 75138'}</strong>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-emerald-200">
                  <div className="flex items-center space-x-1.5 text-emerald-800">
                    <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Auto 1st-of-month reminders active</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-emerald-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Auto upload receipts active</span>
                  </div>
                </div>
              </div>

              {/* Test Message Dispatcher */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-xs text-slate-800 flex items-center space-x-1.5">
                    <Send className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Send Live Test Message</span>
                  </h5>
                  <span className="text-[11px] text-slate-400">Dispatched from your phone</span>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Recipient Phone</label>
                  <input
                    type="text"
                    value={testPhone}
                    onChange={e => setTestPhone(e.target.value)}
                    placeholder="e.g. +91 98738 75138"
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white mt-1 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Message Text</label>
                  <textarea
                    rows={2}
                    value={testMessage}
                    onChange={e => setTestMessage(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white mt-1"
                  />
                </div>

                <button
                  onClick={handleSendTestMessage}
                  disabled={actionLoading}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center justify-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{actionLoading ? 'Sending...' : 'Send Live WhatsApp Message'}</span>
                </button>

                {testResult && (
                  <div
                    className={`p-2.5 rounded-lg text-xs font-medium border ${
                      testResult.success
                        ? 'bg-emerald-100/70 border-emerald-300 text-emerald-900'
                        : 'bg-rose-100/70 border-rose-300 text-rose-900'
                    }`}
                  >
                    {testResult.message}
                  </div>
                )}
              </div>

              {/* Logout button */}
              <div className="flex justify-end pt-1">
                <button
                  onClick={handleLogout}
                  disabled={actionLoading}
                  className="px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg font-semibold flex items-center space-x-1.5 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Unlink WhatsApp Device</span>
                </button>
              </div>
            </div>
          ) : (
            /* STATE 2: NOT CONNECTED (QR CODE OR 8-DIGIT PAIRING CODE) */
            <div className="space-y-4">
              {/* Method Switcher Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setActiveTab('qr')}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition ${
                    activeTab === 'qr'
                      ? 'bg-white text-teal-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5 text-teal-600" />
                  <span>Option 1: Scan QR Code</span>
                </button>
                <button
                  onClick={() => setActiveTab('pairing')}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition ${
                    activeTab === 'pairing'
                      ? 'bg-white text-teal-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Option 2: 8-Digit Pairing Code</span>
                </button>
              </div>

              {activeTab === 'qr' ? (
                /* TAB 1: QR CODE */
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col items-center space-y-3.5 text-center">
                  {hasQrCode ? (
                    <div className="bg-white p-2.5 rounded-2xl shadow-sm border-2 border-teal-500 inline-block animate-in zoom-in-95 duration-200">
                      <img
                        src={statusData.qrCodeDataUrl}
                        alt="Scan WhatsApp QR Code"
                        className="w-52 h-52 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-52 h-52 bg-white rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-4 space-y-2 text-slate-400">
                      <QrCode className="w-10 h-10 animate-pulse text-teal-600" />
                      <span className="text-xs font-medium text-slate-600">Generating live QR code...</span>
                    </div>
                  )}

                  <div className="space-y-1 max-w-sm text-left bg-white p-3 rounded-xl border border-slate-200 w-full">
                    <p className="text-xs font-bold text-slate-800">How to connect:</p>
                    <ol className="text-[11px] text-slate-600 list-decimal list-inside space-y-0.5">
                      <li>Open <strong>WhatsApp</strong> on your phone (<strong>+91 98738 75138</strong>)</li>
                      <li>Tap <strong>Settings</strong> (iOS) or <strong>Menu ⋮</strong> (Android)</li>
                      <li>Tap <strong>Linked Devices</strong> $\rightarrow$ <strong>Link a Device</strong></li>
                      <li>Point camera at the QR code above</li>
                    </ol>
                  </div>

                  <button
                    onClick={handleInitialize}
                    disabled={actionLoading}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 flex items-center justify-center space-x-1.5 transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
                    <span>{actionLoading ? 'Generating...' : 'Refresh / Generate Fresh QR Code'}</span>
                  </button>
                </div>
              ) : (
                /* TAB 2: PAIRING CODE (NO CAMERA NEEDED) */
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                      <PhoneCall className="w-3.5 h-3.5 text-indigo-600" />
                      <span>WhatsApp Phone Number</span>
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={pairingPhone}
                        onChange={e => setPairingPhone(e.target.value)}
                        placeholder="+91 98738 75138"
                        className="flex-1 text-xs p-2.5 border border-slate-300 rounded-xl bg-white font-mono font-bold text-slate-800 focus:outline-teal-600"
                      />
                      <button
                        onClick={handleRequestPairingCode}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition shrink-0 flex items-center space-x-1.5"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>{actionLoading ? 'Generating...' : 'Get 8-Digit Code'}</span>
                      </button>
                    </div>
                  </div>

                  {pairingCode ? (
                    <div className="bg-indigo-50 border-2 border-indigo-300 rounded-2xl p-4 text-center space-y-2 animate-in zoom-in-95 duration-200">
                      <p className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">Your Pairing Code:</p>
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-2xl font-black font-mono tracking-widest text-indigo-950 bg-white px-4 py-2 rounded-xl border border-indigo-200 shadow-xs">
                          {pairingCode}
                        </span>
                        <button
                          onClick={handleCopyPairingCode}
                          className="p-2 bg-white hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-200 transition"
                          title="Copy pairing code"
                        >
                          {copiedCode ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                        </button>
                      </div>

                      <div className="text-[11px] text-indigo-800 text-left bg-white/80 p-3 rounded-xl border border-indigo-200/60 space-y-1">
                        <p className="font-bold">Enter this on your phone:</p>
                        <ol className="list-decimal list-inside space-y-0.5">
                          <li>Open WhatsApp $\rightarrow$ <strong>Linked Devices</strong> $\rightarrow$ <strong>Link a Device</strong></li>
                          <li>Tap <strong>&ldquo;Link with phone number instead&rdquo;</strong> at the bottom</li>
                          <li>Type the 8-character code shown above</li>
                        </ol>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                      <p className="font-bold text-slate-800">💡 No camera scan needed with Pairing Code:</p>
                      <p>Click <strong>&ldquo;Get 8-Digit Code&rdquo;</strong> and enter the 8 characters directly inside WhatsApp on your mobile phone.</p>
                    </div>
                  )}
                </div>
              )}

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-[11px] text-teal-900 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
                <span>
                  <strong>1-Time Setup:</strong> Once linked, session credentials persist in <code className="font-mono bg-white px-1 py-0.5 rounded border border-teal-200">./wa_auth_session</code> across reboots.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>End-to-End Encrypted Baileys Multi-Device Engine</span>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-lg border border-slate-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

