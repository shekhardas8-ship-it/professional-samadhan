// src/components/common/QuickCreateModal.tsx
import React from 'react';
import {
  Users,
  CheckSquare,
  CreditCard,
  AlertCircle,
  FileSpreadsheet,
  Upload,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (actionKey: string) => void;
}

export const QuickCreateModal: React.FC<QuickCreateModalProps> = ({ isOpen, onClose, onAction }) => {
  if (!isOpen) return null;

  const quickItems = [
    { key: 'new-client', title: 'Onboard New Client', desc: 'Add entity with GSTIN, PAN, CIN, and Directors KYC', icon: Users, color: 'text-emerald-600 bg-emerald-50' },
    { key: 'new-task', title: 'Assign Practice Task', desc: 'Create task with SLA, checklist, and reviewer signoff', icon: CheckSquare, color: 'text-blue-600 bg-blue-50' },
    { key: 'new-invoice', title: 'Generate Tax Invoice', desc: 'Create GST bill for retainers, audits, or adhoc advisory', icon: CreditCard, color: 'text-indigo-600 bg-indigo-50' },
    { key: 'new-notice', title: 'Log Statutory Notice', desc: 'Register GST ASMT-10, Income Tax 148A, or TDS notice', icon: AlertCircle, color: 'text-rose-600 bg-rose-50' },
    { key: 'run-intake', title: 'Trigger Monthly Intake', desc: 'Autonomous WhatsApp intake batch for all active clients', icon: Sparkles, color: 'text-purple-600 bg-purple-50' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4 animate-scaleUp">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-[#00c073] text-white flex items-center justify-center font-bold text-xs">
              +
            </span>
            <h3 className="text-sm font-bold text-slate-800">Quick Practice Creation</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {quickItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onAction(item.key);
                  onClose();
                }}
                className="w-full p-3 rounded-xl border border-slate-200/80 hover:border-[#00c073] hover:bg-emerald-50/30 transition flex items-center gap-3 text-left group"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#00a864] transition">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate">{item.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#00a864] group-hover:translate-x-0.5 transition" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
