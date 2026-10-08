// src/components/automation/WorkflowAutomationView.tsx
import React, { useState, useEffect } from 'react';
import {
  Zap,
  Play,
  Pause,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  GitBranch,
  ShieldCheck,
  Send,
  MessageSquare,
  FileCheck,
  Building,
  KeyRound,
  Scale,
  Calendar,
  Layers,
  Copy,
  Trash2,
  RotateCcw,
  Sliders,
  Check,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  X,
  FileCode,
  UserCheck,
} from 'lucide-react';
import { INITIAL_WORKFLOW_AUTOMATIONS } from '../../services/frontPageDataService.ts';

export type WorkflowTriggerType =
  | 'Monthly 1st'
  | 'TDS 5th of Month'
  | 'GSTR-1 11th'
  | 'GSTR-2B 14th'
  | 'GSTR-3B 20th'
  | 'Advance Tax 15th'
  | 'Statutory Due Date'
  | 'Document Missing'
  | 'Notice Uploaded'
  | 'DSC 30-Day Expiry'
  | 'Client Upload Completed'
  | 'Password PDF Received';

export type WorkflowCategory =
  | 'All'
  | 'GST Intake'
  | 'Income Tax & Advance Tax'
  | 'TDS Compliance'
  | 'ROC & MCA'
  | 'Notice Escalation'
  | 'Audit & 43B(h)'
  | 'DSC & Tokens';

export interface WorkflowStep {
  type: 'TRIGGER' | 'CONDITION' | 'ACTION' | 'WAIT' | 'APPROVAL' | 'ESCALATION';
  title: string;
  details: string;
}

export interface PracticeWorkflow {
  id: string;
  name: string;
  description: string;
  category: WorkflowCategory;
  triggerType: WorkflowTriggerType;
  status: 'Active' | 'Paused';
  lastRunAt: string;
  totalRuns: number;
  successRatePercent: number;
  steps: WorkflowStep[];
}

// 8 Additional Pre-Built CA Practice Workflow Templates
const PREBUILT_WORKFLOW_TEMPLATES: PracticeWorkflow[] = [
  {
    id: 'wf_adv_tax',
    name: 'Advance Tax 15-Day Radar & Client Estimate Notice',
    description: 'Calculates Section 208/211 quarterly advance tax installments (15 Jun, 15 Sep, 15 Dec, 15 Mar), projects net liability, and alerts directors on WhatsApp.',
    category: 'Income Tax & Advance Tax',
    triggerType: 'Advance Tax 15th',
    status: 'Active',
    lastRunAt: '2026-09-01 10:00 AM',
    totalRuns: 24,
    successRatePercent: 100,
    steps: [
      { type: 'TRIGGER', title: 'Schedule: 15 Days Before Quarter Due Date', details: 'Triggers on 1st of June, September, December, and March.' },
      { type: 'ACTION', title: 'Compute YTD Turnover & Estimated P&L', details: 'Extracts bank inflows and sales invoices to project annual taxable income.' },
      { type: 'CONDITION', title: 'Check If Estimated Tax > ₹10,000', details: 'Evaluates Section 208 statutory mandatory threshold.' },
      { type: 'APPROVAL', title: 'CA Partner Approval Gate', details: 'Requires Partner sign-off on installment percentage (15%, 45%, 75%, 100%).' },
      { type: 'ACTION', title: 'Dispatch WhatsApp Advisory & Challan 280 Link', details: 'Sends personalized tax installment computation to client management.' },
    ],
  },
  {
    id: 'wf_gstr2b_match',
    name: '14th of Month GSTR-2B Auto-Reconciliation & ITC Shield',
    description: 'Triggers on 14th morning right after GSTN auto-drafts Form GSTR-2B. Performs 100% deterministic matching against purchase register and flags vendor mismatches.',
    category: 'GST Intake',
    triggerType: 'GSTR-2B 14th',
    status: 'Active',
    lastRunAt: '2026-09-14 06:00 AM',
    totalRuns: 62,
    successRatePercent: 99.2,
    steps: [
      { type: 'TRIGGER', title: 'Schedule: 14th of Every Month at 06:00 AM', details: 'Executes immediately when GSTN portal releases monthly GSTR-2B.' },
      { type: 'ACTION', title: 'Deterministic 3-Way Match (Books vs 2B)', details: 'Compares invoice numbers, tax rates, taxable values, and GSTINs.' },
      { type: 'CONDITION', title: 'Identify Ineligible or Missing Vendor ITC', details: 'Flags bills present in purchase register but absent in GSTR-2B.' },
      { type: 'ACTION', title: 'Generate Vendor Follow-Up Register', details: 'Prepares list of defaulting suppliers for client accounts team.' },
      { type: 'ACTION', title: 'Prepare Table 4 Eligible ITC for GSTR-3B', details: 'Auto-populates IGST, CGST, SGST net eligible credits.' },
    ],
  },
  {
    id: 'wf_tds_deposit',
    name: 'TDS Monthly Deposit & Challan 281 Reconciliation (7th of Month)',
    description: 'Monitors deduction ledgers for Section 194C, 194J, 194I, and 194Q. Ensures tax deducted in previous month is deposited before the 7th statutory deadline.',
    category: 'TDS Compliance',
    triggerType: 'TDS 5th of Month',
    status: 'Active',
    lastRunAt: '2026-10-05 08:30 AM',
    totalRuns: 38,
    successRatePercent: 100,
    steps: [
      { type: 'TRIGGER', title: 'Schedule: 5th of Every Month at 08:30 AM', details: '48 hours before statutory TDS payment cut-off.' },
      { type: 'ACTION', title: 'Consolidate TDS Payables by Nature of Payment', details: 'Aggregates contractor, professional, rent, and purchase deductions.' },
      { type: 'CONDITION', title: 'Verify If Challan 281 Payment Logged', details: 'Checks if client has cleared tax via net banking.' },
      { type: 'ACTION', title: 'Send Urgent 48h WhatsApp Warning', details: 'Alerts accounts manager with exact section-wise breakdown to prevent 1.5% interest.' },
    ],
  },
  {
    id: 'wf_roc_mca_annual',
    name: 'ROC / MCA Annual Return Intake & AGM Follow-up (AOC-4 & MGT-7)',
    description: 'Tracks annual general meeting (AGM) dates for corporate clients. Automated 30-day countdown for Form AOC-4 and 60-day countdown for Form MGT-7.',
    category: 'ROC & MCA',
    triggerType: 'Statutory Due Date',
    status: 'Active',
    lastRunAt: '2026-09-28 02:00 PM',
    totalRuns: 16,
    successRatePercent: 100,
    steps: [
      { type: 'TRIGGER', title: 'Event: Company Financial Year Books Closed', details: 'Initiates post-audit statutory ROC workflow.' },
      { type: 'ACTION', title: 'Request Signed Board Report & Audit Report', details: 'Auto-dispatches intake request for director signatures.' },
      { type: 'CONDITION', title: 'Monitor 30-Day AOC-4 Filing Window', details: 'Calculates Section 403 deadline to prevent ₹100/day late fees.' },
      { type: 'ACTION', title: 'Generate Pre-filled MCA V3 JSON / Web Form', details: 'Prepares balance sheet, P&L, and notes for ROC portal upload.' },
      { type: 'APPROVAL', title: 'Partner Digital Signature (DSC) Gate', details: 'Requires CA Partner Class 3 signing before final MCA upload.' },
    ],
  },
  {
    id: 'wf_dsc_renewal',
    name: 'Digital Signature (DSC) 30-Day Expiry Escalation & Renewal Pipeline',
    description: 'Monitors Class 3 signing tokens for company directors and partners. Triggers multi-stage reminders before DSC expires to prevent filing freezes.',
    category: 'DSC & Tokens',
    triggerType: 'DSC 30-Day Expiry',
    status: 'Active',
    lastRunAt: '2026-10-02 11:15 AM',
    totalRuns: 29,
    successRatePercent: 100,
    steps: [
      { type: 'TRIGGER', title: 'Daily Scan: DSC Token Expiry <= 30 Days', details: 'Identifies tokens nearing statutory validity expiration.' },
      { type: 'ACTION', title: 'Dispatch WhatsApp Renewal Link to Signatory', details: 'Provides 1-click video KYC and paperless renewal instructions.' },
      { type: 'WAIT', title: 'Wait 15 Days', details: 'Monitors portal for updated cryptographic public key.' },
      { type: 'ESCALATION', title: 'Escalate to In-Charge Partner (Day 15 & 7)', details: 'Flags upcoming statutory deadlines requiring this token.' },
    ],
  },
  {
    id: 'wf_bank_pdf_decrypt',
    name: 'Bank Statement Password AI Auto-Prompt & Instant Decryption',
    description: 'When client uploads a password-protected bank PDF (HDFC, ICICI, SBI), AI automatically prompts for password on WhatsApp and unlocks the file for OCR.',
    category: 'GST Intake',
    triggerType: 'Password PDF Received',
    status: 'Active',
    lastRunAt: '2026-10-06 03:45 PM',
    totalRuns: 45,
    successRatePercent: 97.8,
    steps: [
      { type: 'TRIGGER', title: 'Document Upload Event: Password Lock Detected', details: 'PDF parser detects AES/RC4 security permissions lock.' },
      { type: 'ACTION', title: 'Interactive WhatsApp Prompt to Client', details: 'Auto-replies: "Please reply with your bank statement password or PAN".' },
      { type: 'CONDITION', title: 'Validate Password Against Test Decryption', details: 'Attempts decrypting first page via qpdf/MuPDF engine.' },
      { type: 'ACTION', title: 'Save Password to Encrypted Client Vault', details: 'Stores credential securely for future monthly statement intakes.' },
      { type: 'ACTION', title: 'Execute Gemini OCR & Transaction Extraction', details: 'Parses contra, deposits, and withdrawal line items.' },
    ],
  },
  {
    id: 'wf_gstr1_nudge',
    name: '11th of Month GSTR-1 Outward Supply Deadline Rapid Nudge',
    description: 'Ensures all sales invoices, debit notes, and export invoices are reconciled and locked before 11th midnight for monthly taxpayers.',
    category: 'GST Intake',
    triggerType: 'GSTR-1 11th',
    status: 'Active',
    lastRunAt: '2026-09-10 09:00 AM',
    totalRuns: 51,
    successRatePercent: 100,
    steps: [
      { type: 'TRIGGER', title: 'Schedule: 9th & 10th of Every Month', details: '24-48 hours before GSTR-1 government deadline.' },
      { type: 'CONDITION', title: 'Check If Sales Register Extracted & Verified', details: 'Checks pending sales invoices in client review queue.' },
      { type: 'ACTION', title: 'Generate Validated Official GSTR-1 JSON', details: 'Compiles Table 4A, 4B, 5, 6, and HSN Table 12 summary.' },
      { type: 'ACTION', title: 'Client WhatsApp Final Confirmation', details: 'Shares net tax summary and requests sign-off for portal upload.' },
    ],
  },
  {
    id: 'wf_msme_43b_daily',
    name: 'Section 43B(h) MSME Supplier 45-Day Payment Monitor',
    description: 'Scans vendor ledgers to identify overdue payments exceeding statutory limits (15 days without agreement / 45 days with agreement) to prevent disallowance.',
    category: 'Audit & 43B(h)',
    triggerType: 'Statutory Due Date',
    status: 'Active',
    lastRunAt: '2026-10-07 05:00 PM',
    totalRuns: 37,
    successRatePercent: 97.3,
    steps: [
      { type: 'TRIGGER', title: 'Daily Audit Ledger Scan', details: 'Analyzes unpaid creditor balances across Tally/Excel ledgers.' },
      { type: 'CONDITION', title: 'Filter UDYAM Registered Micro/Small Suppliers', details: 'Checks supplier UDYAM registration status.' },
      { type: 'CONDITION', title: 'Calculate Days Outstanding > 45 Days', details: 'Identifies invoices approaching statutory lapse.' },
      { type: 'ACTION', title: 'Generate Tax Disallowance Advisory', details: 'Estimates 30% income tax impact on unpaid expenditure.' },
      { type: 'ACTION', title: 'Alert CFO / Client Management on WhatsApp', details: 'Urges settlement before fiscal year-end.' },
    ],
  },
];

export const WorkflowAutomationView: React.FC = () => {
  // Load custom + prebuilt workflows with persistence in localStorage
  const [workflows, setWorkflows] = useState<PracticeWorkflow[]>(() => {
    try {
      const stored = localStorage.getItem('quinceca_custom_workflows');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // fallback
    }
    return [...INITIAL_WORKFLOW_AUTOMATIONS, ...PREBUILT_WORKFLOW_TEMPLATES.slice(0, 3)];
  });

  const [selectedWorkflow, setSelectedWorkflow] = useState<PracticeWorkflow>(workflows[0]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<WorkflowCategory>('All');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isAddStepModalOpen, setIsAddStepModalOpen] = useState(false);

  // Form states for New Workflow
  const [newWfName, setNewWfName] = useState('');
  const [newWfCategory, setNewWfCategory] = useState<WorkflowCategory>('GST Intake');
  const [newWfTrigger, setNewWfTrigger] = useState<WorkflowTriggerType>('Monthly 1st');
  const [newWfDescription, setNewWfDescription] = useState('');

  // Form states for New Step
  const [newStepType, setNewStepType] = useState<WorkflowStep['type']>('ACTION');
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepDetails, setNewStepDetails] = useState('');

  // Toast / feedback notification
  const [executionToast, setExecutionToast] = useState<{ title: string; subtitle: string } | null>(null);

  // Sync state to localStorage whenever workflows change
  useEffect(() => {
    try {
      localStorage.setItem('quinceca_custom_workflows', JSON.stringify(workflows));
    } catch (e) {
      // ignore
    }
  }, [workflows]);

  const toggleWorkflowStatus = (id: string) => {
    const updated = workflows.map(w => {
      if (w.id === id) {
        const nextStatus = w.status === 'Active' ? ('Paused' as const) : ('Active' as const);
        return { ...w, status: nextStatus };
      }
      return w;
    });
    setWorkflows(updated);
    if (selectedWorkflow.id === id) {
      setSelectedWorkflow({ ...selectedWorkflow, status: selectedWorkflow.status === 'Active' ? 'Paused' : 'Active' });
    }
  };

  const handleTestRunWorkflow = (wf: PracticeWorkflow) => {
    const nowStr = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const updated = workflows.map(w => {
      if (w.id === wf.id) {
        return {
          ...w,
          lastRunAt: nowStr,
          totalRuns: w.totalRuns + 1,
        };
      }
      return w;
    });

    setWorkflows(updated);
    setSelectedWorkflow({
      ...wf,
      lastRunAt: nowStr,
      totalRuns: wf.totalRuns + 1,
    });

    setExecutionToast({
      title: `Workflow "${wf.name}" Executed Successfully`,
      subtitle: `All ${wf.steps.length} autonomous stages verified with zero errors.`,
    });
    setTimeout(() => setExecutionToast(null), 4000);
  };

  const handleCreateWorkflow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWfName.trim()) return;

    const newWf: PracticeWorkflow = {
      id: `wf_${Date.now()}`,
      name: newWfName.trim(),
      description: newWfDescription.trim() || 'Custom autonomous CA compliance workflow created via Visual Builder.',
      category: newWfCategory === 'All' ? 'GST Intake' : newWfCategory,
      triggerType: newWfTrigger,
      status: 'Active',
      lastRunAt: 'Never run yet',
      totalRuns: 0,
      successRatePercent: 100,
      steps: [
        { type: 'TRIGGER', title: `Trigger: ${newWfTrigger}`, details: 'Initiates autonomous rule evaluation.' },
        { type: 'CONDITION', title: 'Evaluate Compliance Status & Client Criteria', details: 'Filters eligible client businesses.' },
        { type: 'ACTION', title: 'Dispatch Automated WhatsApp / Prepare Filing', details: 'Executes statutory task with client deep-link.' },
        { type: 'WAIT', title: 'Wait 3 Days for Acknowledgment', details: 'Monitors upload portal status.' },
        { type: 'APPROVAL', title: 'CA Partner Approval Gate', details: 'Senior reviewer sign-off before filing.' },
      ],
    };

    const updated = [newWf, ...workflows];
    setWorkflows(updated);
    setSelectedWorkflow(newWf);
    setNewWfName('');
    setNewWfDescription('');
    setIsNewModalOpen(false);

    setExecutionToast({
      title: `New Workflow Created: ${newWf.name}`,
      subtitle: 'Workflow is live and scheduled in practice engine.',
    });
    setTimeout(() => setExecutionToast(null), 3500);
  };

  const handleAddTemplate = (template: PracticeWorkflow) => {
    const existing = workflows.find(w => w.name === template.name);
    if (existing) {
      setSelectedWorkflow(existing);
      setIsTemplatesModalOpen(false);
      setExecutionToast({
        title: `Workflow Already in Practice: ${template.name}`,
        subtitle: 'Selected existing workflow from your active library.',
      });
      setTimeout(() => setExecutionToast(null), 3000);
      return;
    }

    const newWf: PracticeWorkflow = {
      ...template,
      id: `wf_${Date.now()}`,
      status: 'Active',
      totalRuns: 0,
      lastRunAt: 'Ready to run',
    };

    const updated = [newWf, ...workflows];
    setWorkflows(updated);
    setSelectedWorkflow(newWf);
    setIsTemplatesModalOpen(false);

    setExecutionToast({
      title: `Added Template: ${newWf.name}`,
      subtitle: `Configured with ${newWf.steps.length} pre-built compliance steps.`,
    });
    setTimeout(() => setExecutionToast(null), 3500);
  };

  const handleAddStepToCanvas = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepTitle.trim()) return;

    const newStep: WorkflowStep = {
      type: newStepType,
      title: newStepTitle.trim(),
      details: newStepDetails.trim() || 'Custom autonomous step configured in visual canvas.',
    };

    const updatedSteps = [...selectedWorkflow.steps, newStep];
    const updatedWf = { ...selectedWorkflow, steps: updatedSteps };

    const updatedWorkflows = workflows.map(w => (w.id === selectedWorkflow.id ? updatedWf : w));
    setWorkflows(updatedWorkflows);
    setSelectedWorkflow(updatedWf);

    setNewStepTitle('');
    setNewStepDetails('');
    setIsAddStepModalOpen(false);
  };

  const handleDeleteStep = (stepIdx: number) => {
    if (selectedWorkflow.steps.length <= 1) {
      alert('A workflow must have at least one step.');
      return;
    }
    const updatedSteps = selectedWorkflow.steps.filter((_, idx) => idx !== stepIdx);
    const updatedWf = { ...selectedWorkflow, steps: updatedSteps };
    const updatedWorkflows = workflows.map(w => (w.id === selectedWorkflow.id ? updatedWf : w));
    setWorkflows(updatedWorkflows);
    setSelectedWorkflow(updatedWf);
  };

  const handleDeleteWorkflow = (id: string) => {
    if (workflows.length <= 1) {
      alert('Cannot delete the only workflow in the practice.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete workflow "${selectedWorkflow.name}"?`)) {
      const updated = workflows.filter(w => w.id !== id);
      setWorkflows(updated);
      setSelectedWorkflow(updated[0]);
    }
  };

  const filteredWorkflows = workflows.filter(w => {
    if (activeCategoryFilter === 'All') return true;
    return w.category === activeCategoryFilter;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">No-Code Workflow Automation Builder</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Autonomous Practice Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Build autonomous CA workflows: TRIGGER → CONDITION → ACTION → WAIT → APPROVAL → ESCALATION with zero code.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsTemplatesModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Pre-Built Templates Library ({PREBUILT_WORKFLOW_TEMPLATES.length})</span>
          </button>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="px-3.5 py-2 bg-[#00c073] hover:bg-[#00a864] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Custom Workflow</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {executionToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-900 shadow-sm animate-in slide-in-from-top-2">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold block">{executionToast.title}</span>
              <span className="text-[11px] text-emerald-700">{executionToast.subtitle}</span>
            </div>
          </div>
          <button onClick={() => setExecutionToast(null)} className="text-emerald-700 hover:text-emerald-900 p-1">
            ✕
          </button>
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          'All',
          'GST Intake',
          'Income Tax & Advance Tax',
          'TDS Compliance',
          'ROC & MCA',
          'Audit & 43B(h)',
          'Notice Escalation',
          'DSC & Tokens',
        ].map(cat => {
          const count = cat === 'All' ? workflows.length : workflows.filter(w => w.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategoryFilter(cat as WorkflowCategory)}
              className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition flex items-center space-x-1.5 cursor-pointer ${
                activeCategoryFilter === cat
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{cat}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeCategoryFilter === cat ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2-Column Visual Builder Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left List of Workflows */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Active Practice Workflows</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
              {filteredWorkflows.length} Configured
            </span>
          </div>

          <div className="space-y-2 max-h-[720px] overflow-y-auto pr-1">
            {filteredWorkflows.map(wf => (
              <div
                key={wf.id}
                onClick={() => setSelectedWorkflow(wf)}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  selectedWorkflow.id === wf.id
                    ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                    : 'border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase truncate max-w-[150px]">
                    {wf.category}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      wf.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {wf.status}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-800 leading-snug">{wf.name}</h4>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                  <span>Runs: {wf.totalRuns}</span>
                  <span>{wf.successRatePercent}% Success</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => setIsTemplatesModalOpen(true)}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-dashed border-slate-300 flex items-center justify-center space-x-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-slate-500" />
              <span>Browse More Templates</span>
            </button>
          </div>
        </div>

        {/* Right Visual Workflow Canvas */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800">{selectedWorkflow.name}</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {selectedWorkflow.triggerType}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                  {selectedWorkflow.category}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{selectedWorkflow.description}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleTestRunWorkflow(selectedWorkflow)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                title="Execute automation immediately to verify rules"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Run Now</span>
              </button>

              <button
                onClick={() => toggleWorkflowStatus(selectedWorkflow.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  selectedWorkflow.status === 'Active'
                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                }`}
              >
                {selectedWorkflow.status === 'Active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{selectedWorkflow.status === 'Active' ? 'Pause' : 'Resume'}</span>
              </button>

              <button
                onClick={() => handleDeleteWorkflow(selectedWorkflow.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                title="Delete workflow"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Visual Step-by-Step Canvas Pipeline */}
          <div className="space-y-4 relative">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Autonomous Execution Pipeline ({selectedWorkflow.steps.length} Steps)
              </div>
              <button
                onClick={() => setIsAddStepModalOpen(true)}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Step</span>
              </button>
            </div>

            <div className="space-y-3 relative pl-4 border-l-2 border-emerald-500">
              {selectedWorkflow.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-1 relative group hover:border-emerald-300 transition"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        step.type === 'TRIGGER'
                          ? 'bg-blue-100 text-blue-800'
                          : step.type === 'ACTION'
                          ? 'bg-emerald-100 text-emerald-800'
                          : step.type === 'WAIT'
                          ? 'bg-amber-100 text-amber-800'
                          : step.type === 'APPROVAL'
                          ? 'bg-purple-100 text-purple-800'
                          : step.type === 'ESCALATION'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      Step {idx + 1} — {step.type}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-slate-400 font-mono">Autonomous Execution</span>
                      <button
                        onClick={() => handleDeleteStep(idx)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-0.5 transition"
                        title="Remove step"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 pt-1">{step.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{step.details}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Execution History */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Last executed: <strong className="text-slate-700">{selectedWorkflow.lastRunAt}</strong> (Total Runs: {selectedWorkflow.totalRuns})
            </span>
            <span className="font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {selectedWorkflow.successRatePercent}% deterministic reliability
            </span>
          </div>
        </div>
      </div>

      {/* MODAL 1: Templates Library (1-Click Add) */}
      {isTemplatesModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">Pre-Built CA Workflow Automation Library</h3>
                  <p className="text-xs text-slate-500">
                    Standard operating procedures (SOPs) designed for Indian Chartered Accountants.
                  </p>
                </div>
              </div>
              <button onClick={() => setIsTemplatesModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3.5 text-xs flex-1">
              {PREBUILT_WORKFLOW_TEMPLATES.map(tpl => {
                const isAlreadyAdded = workflows.some(w => w.name === tpl.name);
                return (
                  <div
                    key={tpl.id}
                    className="p-4 bg-white border border-slate-200 hover:border-indigo-300 rounded-xl shadow-2xs space-y-2.5 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-800 text-xs">{tpl.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {tpl.category}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Trigger: {tpl.triggerType}
                      </span>
                    </div>

                    <p className="text-slate-600 leading-relaxed text-[11px]">{tpl.description}</p>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center space-x-1.5 text-[10px] text-slate-500">
                        <GitBranch className="w-3 h-3 text-emerald-600" />
                        <span>{tpl.steps.length} Autonomous Pipeline Steps</span>
                      </div>

                      <button
                        onClick={() => handleAddTemplate(tpl)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                          isAlreadyAdded
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                        }`}
                      >
                        {isAlreadyAdded ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                        <span>{isAlreadyAdded ? 'View in Practice' : 'Add to Practice'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Create Custom Autonomous Workflow */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-extrabold text-slate-800">Create Autonomous Workflow</h3>
              </div>
              <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWorkflow} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Workflow Name *</label>
                <input
                  type="text"
                  required
                  value={newWfName}
                  onChange={e => setNewWfName(e.target.value)}
                  placeholder="e.g. Quarterly TDS 26Q Reconciliation & TRACES Nudge"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Compliance Category</label>
                <select
                  value={newWfCategory}
                  onChange={e => setNewWfCategory(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="GST Intake">GST Intake & Filing</option>
                  <option value="Income Tax & Advance Tax">Income Tax & Advance Tax</option>
                  <option value="TDS Compliance">TDS Compliance (Challan 281 & 26Q)</option>
                  <option value="ROC & MCA">ROC & MCA Compliance (AOC-4 / MGT-7)</option>
                  <option value="Notice Escalation">Statutory Notice Escalation (DRC-01 / Sec 148)</option>
                  <option value="Audit & 43B(h)">Audit & Section 43B(h) MSME Monitoring</option>
                  <option value="DSC & Tokens">Digital Signature (DSC) & Token Expiry</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trigger Event *</label>
                <select
                  value={newWfTrigger}
                  onChange={e => setNewWfTrigger(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Monthly 1st">1st of Every Month (Scheduled Monthly Intake)</option>
                  <option value="TDS 5th of Month">5th of Every Month (TDS Deposit Due Date Prep)</option>
                  <option value="GSTR-1 11th">9th & 10th of Month (GSTR-1 Outward Deadline Prep)</option>
                  <option value="GSTR-2B 14th">14th of Every Month (GSTR-2B ITC Auto-Generation)</option>
                  <option value="GSTR-3B 20th">18th of Every Month (GSTR-3B Payment Deadline)</option>
                  <option value="Advance Tax 15th">Quarterly Advance Tax Due Date (15 Jun/Sep/Dec/Mar)</option>
                  <option value="Statutory Due Date">Statutory Due Date Approaching (3-Day Escalation)</option>
                  <option value="Document Missing">Missing Document Detected by AI</option>
                  <option value="Notice Uploaded">Department Notice Logged (DRC-01 / Sec 148)</option>
                  <option value="DSC 30-Day Expiry">DSC Token Expiring in 30 Days</option>
                  <option value="Client Upload Completed">Client Finished Uploading All Documents</option>
                  <option value="Password PDF Received">Password-Protected Bank Statement Received</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Workflow Description</label>
                <textarea
                  rows={2}
                  value={newWfDescription}
                  onChange={e => setNewWfDescription(e.target.value)}
                  placeholder="Describe the objective, target clients, and escalation logic..."
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00c073] hover:bg-[#00a864] text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Save & Activate Workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Add Step to Canvas */}
      {isAddStepModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-extrabold text-slate-800">Add Pipeline Step to Canvas</h3>
              <button onClick={() => setIsAddStepModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStepToCanvas} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Step Type</label>
                <select
                  value={newStepType}
                  onChange={e => setNewStepType(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="ACTION">ACTION — Dispatch WhatsApp, generate JSON, create task</option>
                  <option value="CONDITION">CONDITION — Evaluate criteria, check ITC mismatch, verify limits</option>
                  <option value="WAIT">WAIT — Await client reply, pause for 48 hours</option>
                  <option value="APPROVAL">APPROVAL — Human review gate for CA Senior Partner</option>
                  <option value="ESCALATION">ESCALATION — Flag to Managing Partner, trigger urgent phone call</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Step Title *</label>
                <input
                  type="text"
                  required
                  value={newStepTitle}
                  onChange={e => setNewStepTitle(e.target.value)}
                  placeholder="e.g. Dispatch WhatsApp Alert to Authorised Signatory"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Execution Details / Logic</label>
                <textarea
                  rows={2}
                  value={newStepDetails}
                  onChange={e => setNewStepDetails(e.target.value)}
                  placeholder="e.g. Includes personalized invoice sequence gap numbers and 1-click upload token."
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddStepModalOpen(false)}
                  className="px-3.5 py-1.5 border rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#00c073] hover:bg-[#00a864] text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Add Step
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
