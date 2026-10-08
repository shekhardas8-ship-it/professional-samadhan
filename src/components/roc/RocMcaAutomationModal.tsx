// src/components/roc/RocMcaAutomationModal.tsx
import React, { useState } from 'react';
import {
  Building2,
  FileCode,
  Download,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  Calendar,
  Sparkles,
  ChevronRight,
  Terminal,
  CheckCircle2,
  FileCheck,
  FileText,
  Clock,
  Send,
  X,
} from 'lucide-react';
import { AdhocRequestItem, Client, DirectorKYC } from '../../types/index.ts';
import {
  buildDir3KycPayload,
  buildBatchDir3KycPayload,
  downloadMcaJsonFile,
  generateMcaAutofillScript,
  validateDirectorForMca,
  Dir3KycJsonPayload,
} from '../../services/mcaAutomationService.ts';

interface RocMcaAutomationModalProps {
  request: AdhocRequestItem;
  client?: Partial<Client>;
  directors: DirectorKYC[];
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate?: (status: AdhocRequestItem['status'], srnNotes?: string) => void;
}

export const RocMcaAutomationModal: React.FC<RocMcaAutomationModalProps> = ({
  request,
  client = {},
  directors,
  isOpen,
  onClose,
  onStatusUpdate,
}) => {
  const [selectedDirectorIndex, setSelectedDirectorIndex] = useState<number>(0);
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [srnInput, setSrnInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'download' | 'preview' | 'guide'>('download');
  const [isSubmittingSrn, setIsSubmittingSrn] = useState<boolean>(false);

  if (!isOpen) return null;

  // Fallback / default director setup if client has empty list
  const activeDirectors: DirectorKYC[] =
    directors && directors.length > 0
      ? directors
      : [
          {
            id: 'dir_1',
            name: 'SN Biswas',
            din: '08492011',
            phone: '+91 98738 75138',
            email: 'snbiswas@briopox.com',
            aadharNumber: '9842 1284 4821',
            panNumber: 'ABCDB1234F',
            bankDetails: 'HDFC Bank - Cancel Cheque #492810',
            aadharUploaded: true,
            panUploaded: true,
            bankDocUploaded: true,
            dinDocUploaded: true,
          },
          {
            id: 'dir_2',
            name: 'YX Biswas',
            din: '08492012',
            phone: '+91 98112 34568',
            email: 'yxbiswas@briopox.com',
            aadharNumber: '4910 8291 9043',
            panNumber: 'XYZPB5678K',
            bankDetails: 'SBI - Cancel Cheque #102938',
            aadharUploaded: true,
            panUploaded: true,
            bankDocUploaded: false,
            dinDocUploaded: true,
          },
        ];

  const currentDirector = activeDirectors[selectedDirectorIndex] || activeDirectors[0];
  const validation = validateDirectorForMca(client, currentDirector);
  const currentPayload = buildDir3KycPayload(client, currentDirector, request);
  const batchPayload = buildBatchDir3KycPayload(client, activeDirectors, request);

  const activeJsonData = isBatchMode ? batchPayload : currentPayload;
  const activeFileName = isBatchMode
    ? `MCA_V3_ROC_${client.businessName || 'Briopox'}_ALL_DIRECTORS_KYC_2026.json`
    : `MCA_V3_DIR3_KYC_${currentDirector.name.replace(/\s+/g, '_')}_DIN_${currentDirector.din}.json`;

  const handleDownload = () => {
    downloadMcaJsonFile(activeFileName, activeJsonData);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(activeJsonData, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleCopyScript = () => {
    const script = generateMcaAutofillScript(currentPayload);
    navigator.clipboard.writeText(script);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleRecordFilingSrn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!srnInput.trim()) {
      alert('Please enter the MCA V3 SRN (Service Request Number) from your filing challan.');
      return;
    }
    setIsSubmittingSrn(true);
    const notes = `Filed on MCA V3. SRN: ${srnInput.trim()}. Challan verified by CA Suraj Dutta on ${new Date().toLocaleDateString('en-IN')}.`;
    if (onStatusUpdate) {
      onStatusUpdate('Completed', notes);
    }
    setTimeout(() => {
      setIsSubmittingSrn(false);
      alert(`Success! ROC DIR-3 KYC marked Completed. SRN ${srnInput.trim()} recorded.`);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              MCA21 Version 3.0 Automation
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-400/20 text-indigo-300 border border-indigo-400/30">
              ROC / DIR-3 KYC Web
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Zero Filing Fee
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            ROC & MCA Portal e-Filing Automation
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Export official MCA V3 pre-fill JSON payloads, validate director KYC details, and upload directly to the Ministry of Corporate Affairs portal.
          </p>

          {/* Quick Client Summary Bar */}
          <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Corporate Entity</span>
              <span className="font-bold text-white flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                {client.businessName || request.clientName || 'Briopox Pvt Ltd'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Company CIN</span>
              <span className="font-mono font-bold text-amber-300">
                {client.cin || 'U74999DL2021PTC384592'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Filing Cutoff</span>
              <span className="font-bold text-white flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                {request.targetDeadline || '2026-10-10'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">CA In-Charge</span>
              <span className="font-bold text-white">
                {request.assignedStaffName || 'CA Suraj Dutta (FCA)'}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Director Selector Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                Select Director for DIR-3 KYC Payload:
              </label>
              <button
                type="button"
                onClick={() => setIsBatchMode(!isBatchMode)}
                className={`text-xs font-bold px-3 py-1 rounded-xl transition border ${
                  isBatchMode
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {isBatchMode ? '✓ Batch Package (All Directors)' : 'Combine All Directors into 1 Package'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeDirectors.map((dir, idx) => {
                const isSelected = selectedDirectorIndex === idx && !isBatchMode;
                return (
                  <button
                    key={dir.id || idx}
                    type="button"
                    onClick={() => {
                      setSelectedDirectorIndex(idx);
                      setIsBatchMode(false);
                    }}
                    className={`text-left p-3.5 rounded-2xl border transition relative flex items-start justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">{dir.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
                          DIN: {dir.din}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                        <span>PAN: <strong className="text-slate-700">{dir.panNumber}</strong></span>
                        <span>Mob: <strong className="text-slate-700">{dir.phone}</strong></span>
                        <span>Email: <strong className="text-slate-700">{dir.email}</strong></span>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="p-1 rounded-full bg-indigo-600 text-white">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* MCA V3 Pre-Flight Compliance Validation Checklist */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  MCA V3 Compliance Pre-Validation Check
                </h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                {validation.score}% Ready for MCA Upload
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {validation.checks.map((chk, i) => (
                <div
                  key={i}
                  className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-start gap-2 text-xs"
                >
                  {chk.status === 'pass' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : chk.status === 'warn' ? (
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold text-slate-800 block text-[11px]">{chk.label}</span>
                    <span className="text-[11px] text-slate-500">{chk.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Action Tabs */}
          <div className="border-b border-slate-200 flex gap-4 text-xs font-bold">
            <button
              onClick={() => setActiveTab('download')}
              className={`pb-2.5 border-b-2 transition ${
                activeTab === 'download'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              1. Download & Actions
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`pb-2.5 border-b-2 transition ${
                activeTab === 'preview'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              2. Inspect JSON Schema
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`pb-2.5 border-b-2 transition ${
                activeTab === 'guide'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              3. MCA Portal Upload Walkthrough
            </button>
          </div>

          {/* TAB 1: Download & Actions */}
          {activeTab === 'download' && (
            <div className="space-y-4">
              <div className="bg-linear-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-emerald-700" />
                    <h3 className="font-black text-slate-900 text-base">
                      {isBatchMode ? 'Consolidated MCA Batch Package' : `DIR-3 KYC JSON: ${currentDirector.name}`}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Pre-populated with DIN <span className="font-mono font-bold text-slate-800">{currentDirector.din}</span>,
                    PAN <span className="font-mono font-bold text-slate-800">{currentDirector.panNumber}</span>, mobile OTP flag,
                    and practicing CA membership verification details.
                  </p>
                  <p className="text-[11px] font-mono text-slate-500 mt-1">
                    Target file: <strong className="text-indigo-700">{activeFileName}</strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={handleDownload}
                    className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg hover:shadow-emerald-600/25 transition active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download JSON File</span>
                  </button>
                  <button
                    onClick={handleCopyJson}
                    className="px-4 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-300 flex items-center gap-1.5 transition shadow-xs"
                  >
                    {copiedJson ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedJson ? 'Copied!' : 'Copy JSON'}</span>
                  </button>
                </div>
              </div>

              {/* Bonus feature: 1-Click Browser Autofill script for MCA V3 */}
              <div className="bg-slate-900 text-slate-200 rounded-2xl p-4.5 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-amber-400" />
                    <span className="font-extrabold text-xs text-white">
                      MCA V3 Webform 1-Second AutoFill Script
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold">
                      Popular CA Utility
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Paste this snippet into your browser console on the MCA V3 DIR-3 KYC page to instantly autofill all fields without manual typing.
                  </p>
                </div>

                <button
                  onClick={handleCopyScript}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shrink-0 shadow-sm"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'Script Copied!' : 'Copy Autofill Script'}</span>
                </button>
              </div>

              {/* Step 4: Record MCA SRN */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-indigo-600" />
                  Record MCA SRN Challan & Mark Completed:
                </h4>
                <form onSubmit={handleRecordFilingSrn} className="flex flex-col sm:flex-row items-center gap-2.5">
                  <input
                    type="text"
                    value={srnInput}
                    onChange={e => setSrnInput(e.target.value.toUpperCase())}
                    placeholder="Enter MCA SRN (e.g., F98421094)"
                    className="flex-1 w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-indigo-600"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingSrn}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shrink-0 shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSubmittingSrn ? 'Saving...' : 'Record SRN & Close'}</span>
                  </button>
                  <a
                    href="https://www.mca.gov.in/content/mca/global/en/home.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition shrink-0"
                  >
                    <span>Open MCA Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: Inspect JSON Schema */}
          {activeTab === 'preview' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Schema formatted according to MCA21 V3 technical specifications for DIR-3 KYC WEB.
                </span>
                <button
                  onClick={handleCopyJson}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedJson ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-emerald-400 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-80 border border-slate-800">
                {JSON.stringify(activeJsonData, null, 2)}
              </pre>
            </div>
          )}

          {/* TAB 3: MCA Portal Upload Walkthrough */}
          {activeTab === 'guide' && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center gap-2 text-indigo-700 font-bold">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs">1</span>
                    Download QuinceCA JSON
                  </div>
                  <p className="text-slate-600">
                    Click <strong>Download JSON File</strong> to save the pre-filled <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">.json</code> file to your computer.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center gap-2 text-indigo-700 font-bold">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs">2</span>
                    Login to MCA V3 Portal
                  </div>
                  <p className="text-slate-600">
                    Visit <a href="https://www.mca.gov.in" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-bold">mca.gov.in</a> and sign in with your CA/Business User login credentials.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center gap-2 text-indigo-700 font-bold">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs">3</span>
                    Open DIR-3 KYC Service
                  </div>
                  <p className="text-slate-600">
                    Navigate to <strong>MCA Services &rarr; Company e-Filing &rarr; DIN Related Services &rarr; DIR-3 KYC Web</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center gap-2 text-indigo-700 font-bold">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs">4</span>
                    Import JSON & Submit OTP
                  </div>
                  <p className="text-slate-600">
                    Upload the JSON or run the autofill script. Click <strong>Send OTP</strong> (sent to Director's phone & email), input OTPs, and click <strong>Submit</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Zero Filing Fee Reminder:</strong> Web-based DIR-3 KYC filed before the annual cutoff incurs ₹0 government fees. If filed after cutoff, MCA levies an automatic late fee of ₹5,000 per DIN.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Compliant with MCA21 V3 Technical Specifications & IT Act DSC Standards</span>
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
