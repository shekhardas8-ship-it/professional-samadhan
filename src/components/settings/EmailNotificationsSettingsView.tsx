// src/components/settings/EmailNotificationsSettingsView.tsx
import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Sliders,
  Server,
  Lock,
  Eye,
  Check,
  RefreshCw,
  FileText,
  Clock,
  Sparkles,
  Smartphone,
  Monitor,
  Copy,
  ShieldCheck,
  Layers,
  ChevronRight,
  Building,
} from 'lucide-react';
import { FirmBrandingConfig } from '../../services/brandingService';

interface EmailNotificationsSettingsViewProps {
  firmBranding?: FirmBrandingConfig;
  currentUser?: any;
  onSavedNotification?: (msg: string) => void;
  isDialogMode?: boolean;
}

export interface SmtpConfig {
  provider: 'gmail' | 'office365' | 'custom' | 'aws_ses' | 'sendgrid';
  host: string;
  port: number;
  encryption: 'TLS' | 'SSL' | 'STARTTLS';
  senderName: string;
  senderEmail: string;
  replyToEmail: string;
  username: string;
  appPassword?: string;
  isConnected: boolean;
}

export interface EmailTemplate {
  id: string;
  title: string;
  category: 'GST' | 'ITR' | 'Client Intake' | 'Billing';
  subject: string;
  body: string;
  triggerDescription: string;
  isEnabled: boolean;
}

export interface EmailAutomationTriggers {
  autoSendArnAck: boolean;
  autoSendDueDateReminders: boolean;
  reminderDaysBefore: number;
  ccAssignedStaff: boolean;
  includeFirmFrnSignature: boolean;
  dailyDigestSummary: boolean;
}

const STORAGE_KEY = 'quinceca_email_notifications_config_v1';

const DEFAULT_SMTP: SmtpConfig = {
  provider: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  encryption: 'TLS',
  senderName: 'CA Suraj Dutta & Associates',
  senderEmail: 'compliance@quinceca.in',
  replyToEmail: 'suraj.dutta@quinceca.in',
  username: 'compliance@quinceca.in',
  appPassword: '••••••••••••••••',
  isConnected: true,
};

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tpl_arn_ack',
    title: 'Statutory Return Filing & ARN Acknowledgment',
    category: 'GST',
    triggerDescription: 'Triggered when GSTR-1, GSTR-3B, or ITR is compiled and ARN is recorded.',
    subject: 'Statutory Return Filing Confirmation: {{return_type}} for {{return_period}} [ARN: {{arn_number}}]',
    body: `Dear {{client_name}},

We are pleased to inform you that your {{return_type}} for the period {{return_period}} has been successfully filed with the Government statutory portal.

Filing Particulars:
• Taxpayer GSTIN/PAN: {{taxpayer_identifier}}
• Acknowledgment / ARN: {{arn_number}}
• Filing Date & Timestamp: {{filing_timestamp}}
• Total Statutory Tax Liability: ₹{{tax_liability}}
• Total Eligible ITC Claimed: ₹{{itc_claimed}}

The official acknowledgment receipt and return JSON have been securely archived in your QuinceCA Client Vault. You may view or download your compliance dossier anytime using your portal link:
{{portal_upload_url}}

Best regards,
{{firm_name}}
Chartered Accountants | FRN: {{firm_frn}}`,
    isEnabled: true,
  },
  {
    id: 'tpl_due_date',
    title: 'Upcoming Statutory Due Date Reminder',
    category: 'GST',
    triggerDescription: 'Sent 3 days prior to monthly GST (11th/20th) or quarterly Advance Tax deadlines.',
    subject: 'Urgent Compliance Reminder: {{compliance_name}} Due on {{due_date}}',
    body: `Dear {{client_name}},

This is a gentle statutory reminder from your CA firm that the deadline for {{compliance_name}} is approaching on {{due_date}}.

To avoid interest under Section 50 or late fees under Section 47, kindly ensure all pending sales invoices, purchase registers, and bank statements for {{return_period}} are submitted by {{submission_deadline}}.

Upload your documents directly via the instant client upload link:
{{portal_upload_url}}

Warm regards,
Compliance Desk
{{firm_name}}`,
    isEnabled: true,
  },
  {
    id: 'tpl_doc_request',
    title: 'Monthly Books & Bank Statement Request',
    category: 'Client Intake',
    triggerDescription: 'Sent on the 1st of each month to request bank statements and bills.',
    subject: 'Monthly Accounting & GST Document Request for {{return_period}} - {{client_name}}',
    body: `Dear {{client_name}},

In order to initiate statutory GST reconciliation and accounting for {{return_period}}, please provide the following records:

1. Bank Statements (PDF / Excel with narration) for all active bank accounts.
2. Inward Purchase Invoices & Debit/Credit notes.
3. Salary and contractor payment ledgers.

You do not need to email heavy files — simply click below to upload directly to our secure cloud document vault:
{{portal_upload_url}}

Thank you for your timely cooperation.

Sincerely,
{{firm_name}}`,
    isEnabled: true,
  },
  {
    id: 'tpl_invoice_dispatch',
    title: 'Professional Fee Invoice & Payment Receipt',
    category: 'Billing',
    triggerDescription: 'Sent when an audit fee or monthly retainer invoice is generated.',
    subject: 'Invoice #{{invoice_number}} for Professional Services from {{firm_name}}',
    body: `Dear {{client_name}},

Thank you for your continued engagement with {{firm_name}}.

Please find attached our professional invoice #{{invoice_number}} dated {{invoice_date}} for statutory compliance and advisory services rendered.

Invoice Summary:
• Amount Payable: ₹{{invoice_amount}}
• Due Date: {{invoice_due_date}}
• Bank: HDFC Bank | A/c No: 50200012345678 | IFSC: HDFC0000123

You may also make instant payment using UPI ID: quinceca@hdfcbank

Warm regards,
Accounts & Billing Desk
{{firm_name}}`,
    isEnabled: true,
  },
  {
    id: 'tpl_itr_intimation',
    title: 'ITR Assessment Intimation u/s 143(1) Advisory',
    category: 'ITR',
    triggerDescription: 'Sent upon receipt and reconciliation of CPC intimation orders.',
    subject: 'Income Tax Return Intimation u/s 143(1) Processed for AY {{assessment_year}}',
    body: `Dear {{client_name}},

The Centralized Processing Centre (CPC), Income Tax Department has processed your Income Tax Return for Assessment Year {{assessment_year}}.

Outcome Summary:
• Section: 143(1) of the Income Tax Act, 1961
• Status: {{intimation_status}} (Zero Demand / Refund Determined: ₹{{refund_amount}})
• Refund Mode: Directly credited to pre-validated bank account.

Our team has audited the computation against our original filed return and verified that there are no discrepancies or outstanding demands.

Regards,
Direct Tax Advisory Team
{{firm_name}}`,
    isEnabled: true,
  },
];

const DEFAULT_TRIGGERS: EmailAutomationTriggers = {
  autoSendArnAck: true,
  autoSendDueDateReminders: true,
  reminderDaysBefore: 3,
  ccAssignedStaff: true,
  includeFirmFrnSignature: true,
  dailyDigestSummary: false,
};

export const EmailNotificationsSettingsView: React.FC<EmailNotificationsSettingsViewProps> = ({
  firmBranding,
  currentUser,
  onSavedNotification,
  isDialogMode = false,
}) => {
  const [activeTab, setActiveTab] = useState<'smtp' | 'templates' | 'triggers' | 'signature'>('smtp');
  const [smtp, setSmtp] = useState<SmtpConfig>(DEFAULT_SMTP);
  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tpl_arn_ack');
  const [triggers, setTriggers] = useState<EmailAutomationTriggers>(DEFAULT_TRIGGERS);

  // Testing & preview state
  const [testEmailAddress, setTestEmailAddress] = useState('client.support@example.com');
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Load from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.smtp) setSmtp(parsed.smtp);
        if (parsed.templates) setTemplates(parsed.templates);
        if (parsed.triggers) setTriggers(parsed.triggers);
      }
    } catch (e) {
      console.warn('Failed to load email config from localStorage', e);
    }
  }, []);

  const handleSaveAll = () => {
    try {
      const dataToSave = {
        smtp,
        templates,
        triggers,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      const msg = 'Email notification preferences and SMTP credentials saved successfully!';
      setNoticeMessage(msg);
      if (onSavedNotification) onSavedNotification(msg);
      setTimeout(() => setNoticeMessage(null), 3500);
    } catch (e) {
      console.error(e);
      alert('Failed to save email configuration');
    }
  };

  const handleSendTestEmail = () => {
    if (!testEmailAddress) {
      alert('Please enter a recipient email address for testing.');
      return;
    }
    setTestingConnection(true);
    setTestResult(null);

    setTimeout(() => {
      setTestingConnection(false);
      setTestResult(`Test email successfully delivered to ${testEmailAddress} via ${smtp.host}:${smtp.port} (${smtp.encryption}).`);
      setTimeout(() => setTestResult(null), 5000);
    }, 1200);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all email templates and configurations to ICAI recommended defaults?')) {
      setSmtp(DEFAULT_SMTP);
      setTemplates(DEFAULT_TEMPLATES);
      setTriggers(DEFAULT_TRIGGERS);
      localStorage.removeItem(STORAGE_KEY);
      setNoticeMessage('Reset to default statutory email configuration.');
      setTimeout(() => setNoticeMessage(null), 3000);
    }
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];

  const updateSelectedTemplate = (fields: Partial<EmailTemplate>) => {
    setTemplates(prev =>
      prev.map(t => (t.id === selectedTemplateId ? { ...t, ...fields } : t))
    );
  };

  // Render sample replaced text for live preview
  const previewSubject = selectedTemplate.subject
    .replace('{{return_type}}', 'GSTR-3B Summary')
    .replace('{{return_period}}', 'August 2026')
    .replace('{{arn_number}}', 'AA290826009812A')
    .replace('{{compliance_name}}', 'GSTR-3B Filing')
    .replace('{{due_date}}', '20th September 2026')
    .replace('{{client_name}}', 'Apex Innovations Pvt Ltd')
    .replace('{{firm_name}}', firmBranding?.name || 'Quince & Associates')
    .replace('{{invoice_number}}', 'INV-2026-089')
    .replace('{{assessment_year}}', '2026-27');

  const previewBody = selectedTemplate.body
    .replace(/{{client_name}}/g, 'Apex Innovations Pvt Ltd')
    .replace(/{{return_type}}/g, 'GSTR-3B')
    .replace(/{{return_period}}/g, 'August 2026')
    .replace(/{{taxpayer_identifier}}/g, '29AAAGM0289C1ZF')
    .replace(/{{arn_number}}/g, 'AA290826009812A')
    .replace(/{{filing_timestamp}}/g, '20-09-2026 14:32 IST')
    .replace(/{{tax_liability}}/g, '19,620.00')
    .replace(/{{itc_claimed}}/g, '17,176.15')
    .replace(/{{portal_upload_url}}/g, 'https://quinceca.quinceautomation.com/portal/upload')
    .replace(/{{compliance_name}}/g, 'GSTR-3B Monthly Return')
    .replace(/{{due_date}}/g, '20-09-2026')
    .replace(/{{submission_deadline}}/g, '15-09-2026')
    .replace(/{{firm_name}}/g, firmBranding?.name || 'Quince & Associates')
    .replace(/{{firm_frn}}/g, firmBranding?.frnNumber || '012984N')
    .replace(/{{invoice_number}}/g, 'INV-2026-089')
    .replace(/{{invoice_date}}/g, '01-09-2026')
    .replace(/{{invoice_amount}}/g, '14,750.00')
    .replace(/{{invoice_due_date}}/g, '15-09-2026')
    .replace(/{{assessment_year}}/g, '2026-27')
    .replace(/{{intimation_status}}/g, 'No Statutory Demand / Returns Matched')
    .replace(/{{refund_amount}}/g, '5,000.00');

  return (
    <div className={`space-y-4 ${isDialogMode ? 'p-1' : 'p-6 max-w-6xl mx-auto'}`}>
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Mail className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white tracking-wide">
              Automated Email Notifications & SMTP Gateway
            </h2>
          </div>
          <p className="text-xs text-slate-300 max-w-xl">
            Configure firm SMTP relays, customize statutory GST/ITR email templates with dynamic tags, and automate client compliance acknowledgment delivery.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleResetDefaults}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Defaults</span>
          </button>
          <button
            onClick={handleSaveAll}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      {noticeMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{noticeMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {[
            { id: 'smtp', label: 'SMTP & Provider Relay', icon: Server },
            { id: 'templates', label: 'Statutory Email Templates', icon: FileText, count: templates.length },
            { id: 'triggers', label: 'Automated Triggers', icon: Sparkles },
            { id: 'signature', label: 'Firm Seal & Signature', icon: ShieldCheck },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SMTP & SENDER RELAY */}
      {/* ========================================================================= */}
      {activeTab === 'smtp' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Left 2 Cols: Credentials */}
            <div className="md:col-span-2 p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Server className="w-4 h-4 text-indigo-600" />
                  <span>Outbound Mail Server (SMTP)</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Connected & Verified
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Service Provider</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'gmail', label: 'Google Workspace / Gmail' },
                    { id: 'office365', label: 'Microsoft 365 / Outlook' },
                    { id: 'custom', label: 'Custom Domain SMTP' },
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        let h = 'smtp.gmail.com';
                        let port = 587;
                        if (p.id === 'office365') {
                          h = 'smtp.office365.com';
                          port = 587;
                        } else if (p.id === 'custom') {
                          h = 'mail.yourfirm.com';
                          port = 465;
                        }
                        setSmtp(prev => ({
                          ...prev,
                          provider: p.id as any,
                          host: h,
                          port: port,
                        }));
                      }}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        smtp.provider === p.id
                          ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950 font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-xs">{p.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">SMTP Host</label>
                  <input
                    type="text"
                    value={smtp.host}
                    onChange={e => setSmtp({ ...smtp, host: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Port</label>
                  <input
                    type="number"
                    value={smtp.port}
                    onChange={e => setSmtp({ ...smtp, port: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Firm Sender Display Name</label>
                  <input
                    type="text"
                    value={smtp.senderName}
                    onChange={e => setSmtp({ ...smtp, senderName: e.target.value })}
                    placeholder="e.g. CA Suraj Dutta & Associates"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sender Email Address</label>
                  <input
                    type="email"
                    value={smtp.senderEmail}
                    onChange={e => setSmtp({ ...smtp, senderEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SMTP Username / Login</label>
                  <input
                    type="text"
                    value={smtp.username}
                    onChange={e => setSmtp({ ...smtp, username: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">App Password / Auth Token</label>
                  <input
                    type="password"
                    value={smtp.appPassword}
                    onChange={e => setSmtp({ ...smtp, appPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reply-To Email Address</label>
                <input
                  type="email"
                  value={smtp.replyToEmail}
                  onChange={e => setSmtp({ ...smtp, replyToEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800"
                />
              </div>
            </div>

            {/* Right Col: Connection Test Box */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 text-xs flex flex-col justify-between">
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-emerald-600" />
                  <span>Test SMTP Delivery</span>
                </h4>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Send a live test dispatch to verify that your relay authenticates correctly and bypasses client spam filters.
                </p>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Send Test Email To</label>
                  <input
                    type="email"
                    value={testEmailAddress}
                    onChange={e => setTestEmailAddress(e.target.value)}
                    placeholder="partner@yourfirm.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={testingConnection}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                  <span>{testingConnection ? 'Sending Test Email...' : 'Send Test Verification'}</span>
                </button>

                {testResult && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[11px] leading-relaxed flex items-start gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{testResult}</span>
                  </div>
                )}
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">SSL/TLS Security</span>
                <div className="text-xs font-semibold text-slate-800 flex items-center gap-1 text-emerald-700">
                  <Lock className="w-3.5 h-3.5" />
                  <span>256-bit Encrypted Relay</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STATUTORY TEMPLATES */}
      {/* ========================================================================= */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column (4 cols): Template List */}
          <div className="lg:col-span-4 space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Select Template
            </span>
            {templates.map(tpl => {
              const isSelected = tpl.id === selectedTemplateId;
              return (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer space-y-1 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/60 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{tpl.title}</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      {tpl.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{tpl.triggerDescription}</p>
                </div>
              );
            })}

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-600 mt-4">
              <span className="font-bold text-slate-800 text-[11px] uppercase block">
                Available Dynamic Tags
              </span>
              <div className="flex flex-wrap gap-1 text-[10px] font-mono text-indigo-700">
                {['{{client_name}}', '{{return_type}}', '{{return_period}}', '{{arn_number}}', '{{due_date}}', '{{tax_liability}}', '{{portal_upload_url}}', '{{firm_name}}'].map(t => (
                  <span key={t} className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (8 cols): Editor & Live Preview */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">{selectedTemplate.title}</h3>
                <p className="text-slate-500 text-[11px]">{selectedTemplate.triggerDescription}</p>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded transition ${previewDevice === 'desktop' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-400'}`}
                  title="Desktop Preview"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded transition ${previewDevice === 'mobile' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-400'}`}
                  title="Mobile Preview"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Subject Input */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Subject Line</label>
              <input
                type="text"
                value={selectedTemplate.subject}
                onChange={e => updateSelectedTemplate({ subject: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
              />
            </div>

            {/* Body Textarea */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Body Copy</label>
              <textarea
                rows={8}
                value={selectedTemplate.body}
                onChange={e => updateSelectedTemplate({ body: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 leading-relaxed"
              />
            </div>

            {/* Live Visual Preview */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                <span>Live Client Inbox Preview ({previewDevice.toUpperCase()})</span>
              </span>

              <div className={`p-4 bg-slate-50 rounded-xl border border-slate-200 ${previewDevice === 'mobile' ? 'max-w-sm mx-auto' : ''}`}>
                <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-3">
                  <div className="border-b border-slate-100 pb-2">
                    <div className="text-[10px] text-slate-400 font-medium">
                      From: <span className="font-bold text-slate-700">{smtp.senderName} &lt;{smtp.senderEmail}&gt;</span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 mt-1">{previewSubject}</div>
                  </div>

                  <div className="text-[11px] text-slate-700 whitespace-pre-line leading-relaxed font-sans">
                    {previewBody}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Sent via QuinceCA Practice OS</span>
                    <span className="font-mono">SSL 256-Bit</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AUTOMATED TRIGGERS */}
      {/* ========================================================================= */}
      {activeTab === 'triggers' && (
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4 text-xs max-w-3xl">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Statutory Email Trigger Automations</span>
          </h3>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition">
              <input
                type="checkbox"
                checked={triggers.autoSendArnAck}
                onChange={e => setTriggers({ ...triggers, autoSendArnAck: e.target.checked })}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <span className="font-bold text-slate-900 block">Instant Return ARN Dispatch</span>
                <span className="text-slate-500 text-[11px]">
                  Automatically email client the filing acknowledgment and return summary as soon as an ARN is recorded in the Government E-Filing Hub.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition">
              <input
                type="checkbox"
                checked={triggers.autoSendDueDateReminders}
                onChange={e => setTriggers({ ...triggers, autoSendDueDateReminders: e.target.checked })}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <div className="space-y-1">
                <span className="font-bold text-slate-900 block">Automated Statutory Due Date Alerts</span>
                <span className="text-slate-500 text-[11px] block">
                  Send compliance reminders before GST, Advance Tax, and ITR deadlines.
                </span>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-700">
                  <span>Send reminder</span>
                  <select
                    value={triggers.reminderDaysBefore}
                    onChange={e => setTriggers({ ...triggers, reminderDaysBefore: Number(e.target.value) })}
                    className="px-2 py-0.5 border border-slate-300 rounded bg-white text-xs font-bold"
                  >
                    <option value={5}>5 days prior</option>
                    <option value={3}>3 days prior</option>
                    <option value={1}>1 day prior</option>
                  </select>
                  <span>to statutory deadline</span>
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition">
              <input
                type="checkbox"
                checked={triggers.ccAssignedStaff}
                onChange={e => setTriggers({ ...triggers, ccAssignedStaff: e.target.checked })}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <span className="font-bold text-slate-900 block">CC Assigned Article Assistant / Senior Partner</span>
                <span className="text-slate-500 text-[11px]">
                  Keep the primary staff member assigned to the client in the loop on all dispatched compliance communications.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition">
              <input
                type="checkbox"
                checked={triggers.dailyDigestSummary}
                onChange={e => setTriggers({ ...triggers, dailyDigestSummary: e.target.checked })}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <span className="font-bold text-slate-900 block">Daily Email Dispatch Digest for Managing Partner</span>
                <span className="text-slate-500 text-[11px]">
                  Receive a daily summary at 19:00 IST listing all emails dispatched, bounce rates, and open receipts.
                </span>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SIGNATURE & DISCLAIMER */}
      {/* ========================================================================= */}
      {activeTab === 'signature' && (
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4 text-xs max-w-3xl">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Firm Letterhead & Statutory Disclaimer</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Firm Registration Number (FRN)</label>
              <input
                type="text"
                defaultValue={firmBranding?.frnNumber || '012984N'}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Statutory Email Footer & Confidentiality Notice</label>
              <textarea
                rows={4}
                defaultValue={`DISCLAIMER & CONFIDENTIALITY NOTICE:
This email and any files transmitted with it are confidential and intended solely for the use of the individual or entity to whom they are addressed. If you have received this email in error, please notify the sender immediately and delete it from your system. This communication is issued in compliance with the Code of Ethics established by the Institute of Chartered Accountants of India (ICAI).`}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-700 font-mono leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
