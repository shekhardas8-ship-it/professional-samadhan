// src/components/settings/WhatsAppIntegrationView.tsx
import React, { useState } from 'react';
import {
  MessageCircle,
  CheckCircle2,
  ExternalLink,
  Smartphone,
  Send,
  FileText,
  Sliders,
  Sparkles,
  QrCode,
  ShieldCheck,
  Check,
  HelpCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { FirmBrandingConfig } from '../../services/brandingService';

interface WhatsAppIntegrationViewProps {
  firmBranding: FirmBrandingConfig;
  onOpenWhatsAppModal?: () => void;
  onSavedNotification?: (msg: string) => void;
  onClose?: () => void;
}

export const WhatsAppIntegrationView: React.FC<WhatsAppIntegrationViewProps> = ({
  firmBranding,
  onOpenWhatsAppModal,
  onSavedNotification,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'why_whatsapp' | 'how_it_works'>('why_whatsapp');
  const [activeSubSection, setActiveSubSection] = useState<'clients' | 'client_requests'>('clients');
  const [isConnected, setIsConnected] = useState(true);
  const [activePhone, setActivePhone] = useState('+91 98738 75138');

  return (
    <div className="flex-1 bg-white min-h-screen overflow-y-auto">
      {/* Top Header matching Screenshot */}
      <div className="px-8 py-5 border-b border-slate-200 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">WhatsApp</h1>

        <div className="flex items-center space-x-4">
          <a
            href="https://faq.whatsapp.com/general"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 font-medium"
          >
            <span>💡 Learn more about WhatsApp Integration</span>
          </a>

          {onClose && (
            <button
              onClick={onClose}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium cursor-pointer"
            >
              <span>Close Settings</span>
              <span className="text-rose-500 font-bold">✕</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-8 max-w-5xl space-y-8 text-xs text-slate-700">
        {/* Top Connection Card matching Screenshot */}
        <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-sm shadow-[#25D366]/30">
              <MessageCircle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-900">WhatsApp Business</h3>
                {isConnected && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Paired ({activePhone})</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Integrate with WhatsApp Business, an instant messaging platform with over 2 billion users, to communicate with your clients about client requests and promotions.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {isConnected ? (
              <button
                type="button"
                onClick={onOpenWhatsAppModal}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>Pair QR / Device</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenWhatsAppModal}
                className="px-5 py-2 bg-[#00c073] hover:bg-[#00ab66] text-white rounded-lg font-semibold shadow-xs transition cursor-pointer"
              >
                Connect
              </button>
            )}
          </div>
        </div>

        {/* Sub-tabs: Why WhatsApp Business? | How It Works */}
        <div className="border-b border-slate-200">
          <nav className="flex space-x-8">
            <button
              type="button"
              onClick={() => setActiveTab('why_whatsapp')}
              className={`pb-3 text-xs font-semibold transition border-b-2 cursor-pointer ${
                activeTab === 'why_whatsapp'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Why WhatsApp Business?
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('how_it_works')}
              className={`pb-3 text-xs font-semibold transition border-b-2 cursor-pointer ${
                activeTab === 'how_it_works'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              How It Works
            </button>
          </nav>
        </div>

        {/* ===================================================================== */}
        {/* TAB 1: WHY WHATSAPP BUSINESS? (EXACT MATCH TO SCREENSHOT)            */}
        {/* ===================================================================== */}
        {activeTab === 'why_whatsapp' && (
          <div className="space-y-8 animate-in fade-in">
            {/* Section 1: Message instantly and build lasting relationships */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900">
                Message instantly and build lasting relationships
              </h2>
              <ul className="list-disc list-inside text-slate-600 space-y-1 text-xs">
                <li>
                  Engage with your clients, build relationships, and accelerate sales by keeping your clients notified using a platform that has more than 2 billion users around the world.
                </li>
              </ul>

              {/* 3 Value Cards matching Screenshot */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* Card 1: Send Instant Messages */}
                <div className="p-5 border border-slate-200 rounded-2xl bg-white space-y-2 hover:border-slate-300 transition">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-xs">Send Instant Messages</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Update your clients about their transactions with you using WhatsApp.
                  </p>
                </div>

                {/* Card 2: Templates */}
                <div className="p-5 border border-slate-200 rounded-2xl bg-white space-y-2 hover:border-slate-300 transition">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-xs">Templates</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Craft your own personalised message templates that will best reflect your brand.
                  </p>
                </div>

                {/* Card 3: Attach Documents */}
                <div className="p-5 border border-slate-200 rounded-2xl bg-white space-y-2 hover:border-slate-300 transition">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-xs">Attach Documents</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Unlike SMS, you can attach important documents and send them to your clients along with the notifications.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Communicate seamlessly with your clients */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="text-center max-w-xl mx-auto space-y-1">
                <h2 className="text-sm font-bold text-slate-900">
                  Communicate seamlessly with your clients
                </h2>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Explore the possibilities of what faster communication can do for your organisation. Integrate with WhatsApp and build long-lasting relationships with your clients.
                </p>
              </div>

              {/* Graphic Diagram: WhatsApp Icon <----> App Icon */}
              <div className="flex items-center justify-center py-6">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md shadow-[#25D366]/30">
                    <MessageCircle className="w-7 h-7 stroke-[2.5]" />
                  </div>

                  <div className="flex items-center space-x-1 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  </div>

                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-500/30 font-black text-sm">
                    PS
                  </div>
                </div>
              </div>

              {/* Interactive Showcase: Sub-menu Left + Smartphone Mockup Right */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pt-2">
                {/* Left Sub-menu */}
                <div className="md:col-span-4 space-y-2">
                  <button
                    type="button"
                    onClick={() => setActiveSubSection('clients')}
                    className={`w-full text-left p-3 rounded-xl transition cursor-pointer flex items-center justify-between text-xs font-semibold ${
                      activeSubSection === 'clients'
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Clients</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSubSection('client_requests')}
                    className={`w-full text-left p-3 rounded-xl transition cursor-pointer flex items-center justify-between text-xs font-semibold ${
                      activeSubSection === 'client_requests'
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Client Requests</span>
                  </button>

                  <div className="pt-4 text-xs text-slate-600 leading-relaxed pl-1">
                    {activeSubSection === 'clients' ? (
                      <p>
                        <strong>Clients:</strong> Send promotional messages, such as consultation offers, to your clients.
                      </p>
                    ) : (
                      <p>
                        <strong>Client Requests:</strong> Automate monthly GST & TDS document intake dispatches, reminder nudges, and acknowledgement receipts.
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Smartphone Mockup exactly like in Screenshot */}
                <div className="md:col-span-8 flex justify-center">
                  <div className="w-[300px] bg-slate-900 rounded-[36px] p-3 shadow-2xl border-4 border-slate-800 relative">
                    {/* Phone speaker notch */}
                    <div className="w-20 h-3 bg-slate-800 rounded-full mx-auto mb-2"></div>

                    {/* Phone Screen Container */}
                    <div className="bg-[#EFEAE2] rounded-[24px] overflow-hidden flex flex-col h-[380px] shadow-inner text-xs">
                      {/* WhatsApp Chat Header */}
                      <div className="bg-[#075E54] text-white p-3 flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-full bg-slate-300 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                          PS
                        </div>
                        <div className="flex-1 truncate">
                          <div className="font-bold text-xs truncate">
                            {firmBranding.firmName}
                          </div>
                          <div className="text-[9px] text-emerald-200">Official WhatsApp Business</div>
                        </div>
                      </div>

                      {/* Chat Bubbles Area */}
                      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                        <div className="text-center">
                          <span className="bg-white/80 px-2 py-0.5 rounded text-[9px] text-slate-500 font-medium">
                            TODAY
                          </span>
                        </div>

                        {activeSubSection === 'clients' ? (
                          <div className="bg-[#DCF8C6] p-3 rounded-2xl rounded-tr-none text-slate-800 shadow-2xs text-[11px] leading-relaxed space-y-1.5 ml-4">
                            <p>Dear Client,</p>
                            <p>
                              Complimentary Practice Review: Get a 30-minute consultation on input tax credit (ITC) optimization for Q3. Let's discuss how we can streamline your financial strategy.
                            </p>
                            <p className="font-semibold text-slate-700">
                              - {firmBranding.firmName}
                            </p>
                            <span className="text-[9px] text-slate-400 block text-right">09:41 AM ✓✓</span>
                          </div>
                        ) : (
                          <div className="bg-[#DCF8C6] p-3 rounded-2xl rounded-tr-none text-slate-800 shadow-2xs text-[11px] leading-relaxed space-y-1.5 ml-4">
                            <p>Dear Taxpayer,</p>
                            <p>
                              Your monthly GST & TDS filing intake is now active for this period. Please upload purchase bills and bank statements using your secure link:
                            </p>
                            <div className="p-2 bg-white/70 rounded-lg text-blue-600 font-mono text-[10px] underline">
                              https://portal.quinceca.com/portal/intake
                            </div>
                            <p className="font-semibold text-slate-700">
                              - {firmBranding.firmName}
                            </p>
                            <span className="text-[9px] text-slate-400 block text-right">10:15 AM ✓✓</span>
                          </div>
                        )}
                      </div>

                      {/* Fake bottom chat input */}
                      <div className="p-2 bg-slate-100 border-t border-slate-200 flex items-center space-x-2">
                        <div className="flex-1 bg-white rounded-full px-3 py-1 text-[10px] text-slate-400">
                          Type a message...
                        </div>
                        <div className="w-6 h-6 rounded-full bg-[#128C7E] text-white flex items-center justify-center">
                          <Send className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 2: HOW IT WORKS                                                   */}
        {/* ===================================================================== */}
        {activeTab === 'how_it_works' && (
          <div className="space-y-6 animate-in fade-in text-xs leading-relaxed text-slate-700">
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Dual-Engine WhatsApp Architecture</span>
              </div>
              <p>
                QuinceCA connects with WhatsApp using a hybrid architecture designed for zero friction and high delivery rates:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                  <div className="font-bold text-slate-800 text-xs">
                    1. Baileys Open-Source WhatsApp Pairing
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Pair your existing office mobile (+919873875138) in seconds by scanning a QR code with WhatsApp Web. No meta developer verification needed.
                  </p>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                  <div className="font-bold text-slate-800 text-xs">
                    2. Meta Cloud API Enterprise Fallback
                  </div>
                  <p className="text-[11px] text-slate-500">
                    For high-volume monthly bulk dispatches (10,000+ messages), configure your Meta Cloud API Phone Number ID and permanent access token.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-start">
              <button
                type="button"
                onClick={onOpenWhatsAppModal}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold shadow-xs transition cursor-pointer flex items-center space-x-1.5"
              >
                <QrCode className="w-4 h-4" />
                <span>Open Device Pairing Dashboard</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
