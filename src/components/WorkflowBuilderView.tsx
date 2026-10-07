// src/components/WorkflowBuilderView.tsx
import React, { useState } from 'react';
import {
  GitBranch,
  Play,
  Plus,
  Clock,
  Send,
  Mail,
  FileCheck,
  AlertTriangle,
  ArrowDown,
  Settings,
  CheckCircle2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Sparkles,
} from 'lucide-react';

interface WorkflowStep {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'wait' | 'escalation';
  title: string;
  description: string;
  iconName: string;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  category: 'GST' | 'ITR' | 'TDS' | 'Payment';
  active: boolean;
  trigger: string;
  runsCount: number;
  lastRun: string;
  steps: WorkflowStep[];
}

export const WorkflowBuilderView: React.FC = () => {
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>([
    {
      id: 'wf_01',
      name: 'Monthly GST Document Intake & Reminder Cadence',
      category: 'GST',
      active: true,
      trigger: '1st of every month at 09:00 AM',
      runsCount: 142,
      lastRun: '1 Oct 2026',
      steps: [
        {
          id: 's1',
          type: 'trigger',
          title: 'TRIGGER: 1st of Every Month',
          description: 'Identifies all active clients with GSTIN registrations',
          iconName: 'Clock',
        },
        {
          id: 's2',
          type: 'action',
          title: 'ACTION: Dispatch WhatsApp Request',
          description: 'Sends prefilled checklist & secure upload token to registered director number',
          iconName: 'Send',
        },
        {
          id: 's3',
          type: 'wait',
          title: 'WAIT: 3 Calendar Days',
          description: 'Monitors upload portal for incoming invoices & bank statements',
          iconName: 'Clock',
        },
        {
          id: 's4',
          type: 'condition',
          title: 'CONDITION: Missing Documents Detected?',
          description: 'Checks if sales, purchase or bank statements are pending',
          iconName: 'FileCheck',
        },
        {
          id: 's5',
          type: 'action',
          title: 'ACTION: Automated Follow-Up WhatsApp',
          description: 'Sends polite WhatsApp reminder detailing exact missing files',
          iconName: 'Send',
        },
        {
          id: 's6',
          type: 'escalation',
          title: 'ESCALATION: Day 7 Staff Assignment',
          description: 'Alerts assigned manager & creates high-priority call task',
          iconName: 'AlertTriangle',
        },
      ],
    },
    {
      id: 'wf_02',
      name: 'Overdue Fee Collections Reminder Automation',
      category: 'Payment',
      active: true,
      trigger: 'Invoice Overdue > 15 Days',
      runsCount: 56,
      lastRun: '3 Oct 2026',
      steps: [
        {
          id: 's2_1',
          type: 'trigger',
          title: 'TRIGGER: Invoice Unpaid Past Due Date',
          description: 'Scans billing invoices where status == Pending & days > 15',
          iconName: 'Clock',
        },
        {
          id: 's2_2',
          type: 'action',
          title: 'ACTION: Send Payment Reminder Email & WhatsApp',
          description: 'Includes invoice PDF attachment, bank details & UPI payment QR link',
          iconName: 'Mail',
        },
        {
          id: 's2_3',
          type: 'escalation',
          title: 'ESCALATION: Notify Partner',
          description: 'Adds client to Weekly Partner Collections Briefing',
          iconName: 'AlertTriangle',
        },
      ],
    },
  ]);

  const [activeWorkflowId, setActiveWorkflowId] = useState<string>('wf_01');
  const activeWorkflow = workflows.find(w => w.id === activeWorkflowId) || workflows[0];

  const handleToggleActive = (id: string) => {
    setWorkflows(prev =>
      prev.map(w => (w.id === id ? { ...w, active: !w.active } : w))
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-xl p-6 text-white border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GitBranch className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Autonomous CA Practice Automation
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              No-Code Workflow Builder
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Construct TRIGGER → CONDITION → ACTION → WAIT → ESCALATION workflows to automate client reminders, filing deadlines & document collection.
            </p>
          </div>

          <button
            onClick={() => alert('New Custom Workflow Wizard initialized.')}
            className="px-3.5 py-2 bg-[#00C975] hover:bg-[#00B066] text-white font-bold rounded-lg text-xs transition shadow-sm flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Workflow</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Workflows List */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Active Workflows ({workflows.length})
          </h2>

          {workflows.map(wf => (
            <div
              key={wf.id}
              onClick={() => setActiveWorkflowId(wf.id)}
              className={`p-3.5 rounded-xl border cursor-pointer transition ${
                activeWorkflowId === wf.id
                  ? 'border-emerald-500 bg-emerald-50/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-bold text-slate-900 leading-snug">
                  {wf.name}
                </span>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleToggleActive(wf.id);
                  }}
                  className="text-slate-500 hover:text-slate-800"
                >
                  {wf.active ? (
                    <ToggleRight className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-400" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <span className="bg-slate-100 px-1.5 py-0.5 rounded font-medium text-slate-700">
                  {wf.category}
                </span>
                <span>{wf.runsCount} executions</span>
                <span>Last run: {wf.lastRun}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Visual Pipeline Canvas */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">{activeWorkflow.name}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Trigger rule: <span className="font-semibold text-slate-700">{activeWorkflow.trigger}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {activeWorkflow.active ? 'Status: Running' : 'Status: Paused'}
              </span>
            </div>
          </div>

          {/* Visual Step Sequence */}
          <div className="space-y-4 relative">
            {activeWorkflow.steps.map((step, idx) => (
              <React.Fragment key={step.id}>
                <div
                  className={`p-4 rounded-xl border transition ${
                    step.type === 'trigger'
                      ? 'border-blue-200 bg-blue-50/50'
                      : step.type === 'action'
                      ? 'border-emerald-200 bg-emerald-50/50'
                      : step.type === 'condition'
                      ? 'border-amber-200 bg-amber-50/50'
                      : step.type === 'wait'
                      ? 'border-slate-200 bg-slate-50'
                      : 'border-rose-200 bg-rose-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            step.type === 'trigger'
                              ? 'bg-blue-600 text-white'
                              : step.type === 'action'
                              ? 'bg-emerald-600 text-white'
                              : step.type === 'condition'
                              ? 'bg-amber-600 text-white'
                              : step.type === 'wait'
                              ? 'bg-slate-600 text-white'
                              : 'bg-rose-600 text-white'
                          }`}
                        >
                          Step {idx + 1} • {step.type}
                        </span>
                        <h3 className="text-xs font-bold text-slate-900">{step.title}</h3>
                      </div>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        {step.description}
                      </p>
                    </div>

                    <span className="text-[10px] font-semibold text-slate-400">
                      Auto-Configured
                    </span>
                  </div>
                </div>

                {idx < activeWorkflow.steps.length - 1 && (
                  <div className="flex justify-center py-1">
                    <ArrowDown className="w-4 h-4 text-slate-400" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
