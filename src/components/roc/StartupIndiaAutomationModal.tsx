// src/components/roc/StartupIndiaAutomationModal.tsx
import React, { useState } from 'react';
import {
  Rocket,
  Download,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Building2,
  Calendar,
  Sparkles,
  Terminal,
  CheckCircle2,
  FileCheck,
  FileText,
  AlertCircle,
  Lightbulb,
  Award,
  Zap,
  X,
} from 'lucide-react';
import { AdhocRequestItem, Client } from '../../types/index.ts';
import {
  buildStartupIndiaPayload,
  downloadStartupIndiaJson,
  generateStartupIndiaAutofillScript,
  validateForStartupIndia,
  StartupIndiaJsonPayload,
} from '../../services/startupIndiaAutomationService.ts';

interface StartupIndiaAutomationModalProps {
  request: AdhocRequestItem;
  client?: Partial<Client>;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate?: (status: AdhocRequestItem['status'], notes?: string) => void;
}

export const StartupIndiaAutomationModal: React.FC<StartupIndiaAutomationModalProps> = ({
  request,
  client = {},
  isOpen,
  onClose,
  onStatusUpdate,
}) => {
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [dippNumberInput, setDippNumberInput] = useState('');
  const [activeTab, setActiveTab] = useState<'download' | 'innovation' | 'json' | 'guide'>('download');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const payload: StartupIndiaJsonPayload = buildStartupIndiaPayload(client, request);
  const validation = validateForStartupIndia(client);
  const fileName = `DPIIT_Startup_India_${(client.businessName || 'Zylker_Agriculture').replace(/\s+/g, '_')}_Recognition_Package.json`;

  const handleDownload = () => {
    downloadStartupIndiaJson(fileName, payload);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleCopyScript = () => {
    const script = generateStartupIndiaAutofillScript(payload);
    navigator.clipboard.writeText(script);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleCopyPitchBrief = () => {
    const text = `== STARTUP INDIA (DPIIT) INNOVATION DOSSIER ==
Entity: ${payload.entityDetails.legalName} (${payload.entityDetails.cinOrLlpId})
Sector: ${payload.industryClassification.sector} - ${payload.industryClassification.subCategory}

1. PROBLEM STATEMENT:
${payload.innovationAndScalability.problemStatement}

2. INNOVATIVE SOLUTION:
${payload.innovationAndScalability.innovativeSolution}

3. UNIQUENESS & INTELLECTUAL PROPERTY:
${payload.innovationAndScalability.uniquenessAndIp}

4. REVENUE & COMMERCIALIZATION MODEL:
${payload.innovationAndScalability.revenueModel}

5. SCALABILITY & JOB CREATION:
${payload.innovationAndScalability.scalabilityAndJobs}

TAX BENEFITS CLAIMED:
- Section 80-IAC (3-Year 100% Tax Holiday)
- Section 56(2)(viib) Angel Tax Exemption Form 2
- 80% Rebate on Patent / Trademark Filings
`;
    navigator.clipboard.writeText(text);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2000);
  };

  const handleRecordDippCert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dippNumberInput.trim()) {
      alert('Please enter the DPIIT Recognition Certificate Number (e.g., DIPP102948).');
      return;
    }
    setIsSubmitting(true);
    const notes = `DPIIT Certificate Issued: ${dippNumberInput.trim()}. Section 80-IAC & Angel Tax exemption active. Certified by CA Suraj Dutta on ${new Date().toLocaleDateString('en-IN')}.`;
    if (onStatusUpdate) {
      onStatusUpdate('Completed', notes);
    }
    setTimeout(() => {
      setIsSubmitting(false);
      alert(`Success! Startup India Recognition marked Completed with Certificate #${dippNumberInput.trim()}`);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-linear-to-r from-emerald-950 via-teal-900 to-slate-900 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <Rocket className="w-3.5 h-3.5" />
              Startup India • DPIIT Recognition
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
              Section 80-IAC (3-Yr Tax Holiday)
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-teal-400/20 text-teal-300 border border-teal-400/30">
              Angel Tax Exemption (Form 2)
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Startup India (DPIIT) Registration & Tax Exemption Pipeline
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Automated DPIIT recognition application form, innovation pitch questionnaire, and Section 80-IAC tax holiday filing package for {payload.entityDetails.legalName}.
          </p>

          {/* Quick Client Summary Bar */}
          <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Startup Entity</span>
              <span className="font-bold text-white flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                {payload.entityDetails.legalName}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Corporate CIN</span>
              <span className="font-mono font-bold text-amber-300">
                {payload.entityDetails.cinOrLlpId}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Sector & Stage</span>
              <span className="font-bold text-white">
                {payload.industryClassification.sector} ({payload.industryClassification.stage})
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Certified CA</span>
              <span className="font-bold text-white">
                CA Suraj Dutta (FCA - 058921)
              </span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* DPIIT Eligibility Scorecard */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  DPIIT Statutory Eligibility Criteria Audit
                </h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                {validation.score}% Eligible for DPIIT Recognition
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {validation.checks.map((chk, i) => (
                <div
                  key={i}
                  className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-start gap-2 text-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800 block text-[11px]">{chk.label}</span>
                    <span className="text-[11px] text-slate-500">{chk.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-slate-200 flex gap-4 text-xs font-bold">
            <button
              onClick={() => setActiveTab('download')}
              className={`pb-2.5 border-b-2 transition ${
                activeTab === 'download'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              1. Download Package & Actions
            </button>
            <button
              onClick={() => setActiveTab('innovation')}
              className={`pb-2.5 border-b-2 transition ${
                activeTab === 'innovation'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              2. Innovation & Pitch Brief (DPIIT Questions)
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`pb-2.5 border-b-2 transition ${
                activeTab === 'json'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              3. Full JSON Payload
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`pb-2.5 border-b-2 transition ${
                activeTab === 'guide'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              4. DPIIT Portal Upload Walkthrough
            </button>
          </div>

          {/* TAB 1: Download Package & Actions */}
          {activeTab === 'download' && (
            <div className="space-y-4">
              <div className="bg-linear-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-emerald-700" />
                    <h3 className="font-black text-slate-900 text-base">
                      Complete Startup India DPIIT Package (.json)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Includes company CIN, authorized signatory, Form 1 innovation questionnaire, Section 80-IAC tax holiday declaration, and CA certification statement.
                  </p>
                  <p className="text-[11px] font-mono text-slate-500 mt-1">
                    File: <strong className="text-emerald-700">{fileName}</strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={handleDownload}
                    className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg hover:shadow-emerald-600/25 transition active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download JSON Package</span>
                  </button>
                  <button
                    onClick={handleCopyPitchBrief}
                    className="px-4 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-300 flex items-center gap-1.5 transition shadow-xs"
                  >
                    {copiedPitch ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedPitch ? 'Copied Brief!' : 'Copy Innovation Brief'}</span>
                  </button>
                </div>
              </div>

              {/* Browser AutoFill Script */}
              <div className="bg-slate-900 text-slate-200 rounded-2xl p-4.5 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-amber-400" />
                    <span className="font-extrabold text-xs text-white">
                      Startup India Portal 1-Click AutoFill Snippet
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold">
                      Browser Console Utility
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Paste this snippet into your browser console on <code className="text-amber-300">startupindia.gov.in</code> to instantly pre-fill all entity and pitch details.
                  </p>
                </div>

                <button
                  onClick={handleCopyScript}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shrink-0 shadow-sm"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'Script Copied!' : 'Copy AutoFill Script'}</span>
                </button>
              </div>

              {/* Record DPIIT Certificate */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-600" />
                  Record DPIIT Recognition Certificate & Complete Engagement:
                </h4>
                <form onSubmit={handleRecordDippCert} className="flex flex-col sm:flex-row items-center gap-2.5">
                  <input
                    type="text"
                    value={dippNumberInput}
                    onChange={e => setDippNumberInput(e.target.value.toUpperCase())}
                    placeholder="Enter Certificate No. (e.g., DIPP102948)"
                    className="flex-1 w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-emerald-600"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shrink-0 shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSubmitting ? 'Saving...' : 'Record Certificate & Mark Done'}</span>
                  </button>
                  <a
                    href="https://www.startupindia.gov.in/content/sih/en/startup-scheme.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition shrink-0"
                  >
                    <span>Open Startup Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: Innovation & Pitch Brief */}
          {activeTab === 'innovation' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-700">
                  Pre-drafted Answers for DPIIT Application Form 1:
                </span>
                <button
                  onClick={handleCopyPitchBrief}
                  className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-200 flex items-center gap-1"
                >
                  {copiedPitch ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPitch ? 'Copied!' : 'Copy All Answers'}</span>
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Question 1: What is the problem the startup is solving?
                  </span>
                  <p className="text-slate-800 leading-relaxed font-medium">
                    {payload.innovationAndScalability.problemStatement}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Question 2: How does your startup propose to solve this problem?
                  </span>
                  <p className="text-slate-800 leading-relaxed font-medium">
                    {payload.innovationAndScalability.innovativeSolution}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Question 3: What is the uniqueness of the solution (IP / Innovation)?
                  </span>
                  <p className="text-slate-800 leading-relaxed font-medium">
                    {payload.innovationAndScalability.uniquenessAndIp}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Question 4: How does the startup generate revenue and scale?
                  </span>
                  <p className="text-slate-800 leading-relaxed font-medium">
                    {payload.innovationAndScalability.revenueModel}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Full JSON */}
          {activeTab === 'json' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Formatted schema matching National Startup Portal DPIIT application data structure.
                </span>
                <button
                  onClick={handleCopyJson}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-emerald-400 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-80 border border-slate-800">
                {JSON.stringify(payload, null, 2)}
              </pre>
            </div>
          )}

          {/* TAB 4: Walkthrough */}
          {activeTab === 'guide' && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs">1</span>
                    Download QuinceCA JSON & Brief
                  </div>
                  <p className="text-slate-600">
                    Download the pre-filled DPIIT JSON package or copy the drafted innovation answers.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs">2</span>
                    Login to National Startup Portal
                  </div>
                  <p className="text-slate-600">
                    Visit <a href="https://www.startupindia.gov.in/" target="_blank" rel="noreferrer" className="text-emerald-600 underline font-bold">startupindia.gov.in</a> and login using entity mobile/email OTP.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs">3</span>
                    Fill DPIIT Recognition Form
                  </div>
                  <p className="text-slate-600">
                    Run the 1-click AutoFill script or paste the innovation answers. Upload the Certificate of Incorporation and pitch deck PDF.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs">4</span>
                    Apply for 80-IAC Tax Exemption
                  </div>
                  <p className="text-slate-600">
                    Select <strong>Apply for Tax Exemption</strong> to submit Form 1 & Form 2 for the 3-year 100% tax holiday and angel tax exemption.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Compliant with DPIIT Notification G.S.R. 127(E) & Income Tax Act Section 80-IAC</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold flex items-center gap-1.5 transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
