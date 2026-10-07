// src/components/automation/WorkflowAutomationView.tsx
import React, { useState } from 'react';
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
} from 'lucide-react';
import { INITIAL_WORKFLOW_AUTOMATIONS } from '../../services/frontPageDataService.ts';

export const WorkflowAutomationView: React.FC = () => {
  const [workflows, setWorkflows] = useState(INITIAL_WORKFLOW_AUTOMATIONS);
  const [selectedWorkflow, setSelectedWorkflow] = useState(workflows[0]);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newWfName, setNewWfName] = useState('');
  const [newWfTrigger, setNewWfTrigger] = useState<'Monthly 1st' | 'Statutory Due Date' | 'Document Missing' | 'Notice Uploaded'>('Monthly 1st');

  const toggleWorkflowStatus = (id: string) => {
    setWorkflows(workflows.map(w => {
      if (w.id === id) {
        return { ...w, status: w.status === 'Active' ? 'Paused' : 'Active' };
      }
      return w;
    }));
  };

  const handleCreateWorkflow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWfName.trim()) return;

    const newWf = {
      id: `wf_${Date.now()}`,
      name: newWfName.trim(),
      description: 'Custom autonomous CA compliance workflow created via Visual Builder.',
      category: 'GST Intake' as const,
      triggerType: newWfTrigger,
      status: 'Active' as const,
      lastRunAt: 'Never run yet',
      totalRuns: 0,
      successRatePercent: 100,
      steps: [
        { type: 'TRIGGER' as const, title: `Trigger: ${newWfTrigger}`, details: 'Initiates autonomous rule evaluation.' },
        { type: 'CONDITION' as const, title: 'Evaluate Compliance Status', details: 'Filters clients matching criteria.' },
        { type: 'ACTION' as const, title: 'Execute Automated Action', details: 'Dispatches WhatsApp or prepares task.' },
      ],
    };

    setWorkflows([...workflows, newWf]);
    setSelectedWorkflow(newWf);
    setNewWfName('');
    setIsNewModalOpen(false);
  };

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

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="px-3.5 py-2 bg-[#00c073] hover:bg-[#00a864] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Workflow</span>
        </button>
      </div>

      {/* 2-Column Visual Builder Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left List of Workflows */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Active Practice Workflows</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
              {workflows.length} Configured
            </span>
          </div>

          <div className="space-y-2">
            {workflows.map(wf => (
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
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{wf.category}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    wf.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
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
              </div>
              <p className="text-xs text-slate-500 mt-1">{selectedWorkflow.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleWorkflowStatus(selectedWorkflow.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  selectedWorkflow.status === 'Active'
                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                }`}
              >
                {selectedWorkflow.status === 'Active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{selectedWorkflow.status === 'Active' ? 'Pause Automation' : 'Resume'}</span>
              </button>
            </div>
          </div>

          {/* Visual Step-by-Step Canvas Pipeline */}
          <div className="space-y-4 relative">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Autonomous Execution Canvas
            </div>

            <div className="space-y-3 relative pl-4 border-l-2 border-emerald-500">
              {selectedWorkflow.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-1 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
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
                    }`}>
                      Step {idx + 1} — {step.type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Autonomous Execution</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 pt-1">{step.title}</h4>
                  <p className="text-xs text-slate-600">{step.details}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Execution History */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Last executed: <strong className="text-slate-700">{selectedWorkflow.lastRunAt}</strong></span>
            <span className="font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Zero failed executions in 30 days
            </span>
          </div>
        </div>
      </div>

      {/* New Workflow Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-800">Create Autonomous Workflow</h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreateWorkflow} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Workflow Name</label>
                <input
                  type="text"
                  required
                  value={newWfName}
                  onChange={e => setNewWfName(e.target.value)}
                  placeholder="e.g. Advance Tax 15-Day Radar & Client Notice"
                  className="w-full p-2.5 border rounded-lg focus:outline-none focus:border-[#00c073]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trigger Event</label>
                <select
                  value={newWfTrigger}
                  onChange={e => setNewWfTrigger(e.target.value as any)}
                  className="w-full p-2.5 border rounded-lg focus:outline-none"
                >
                  <option value="Monthly 1st">1st of Every Month (Scheduled)</option>
                  <option value="Statutory Due Date">Statutory Due Date Approaching</option>
                  <option value="Document Missing">Missing Document Detected by AI</option>
                  <option value="Notice Uploaded">Department Notice Logged</option>
                </select>
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
                  className="px-4 py-2 bg-[#00c073] hover:bg-[#00a864] text-white rounded-lg font-bold shadow-xs"
                >
                  Save & Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
