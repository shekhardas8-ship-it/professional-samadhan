// src/components/QuickCreateModal.tsx
import React, { useState } from 'react';
import {
  X,
  Plus,
  Users,
  CheckSquare,
  CreditCard,
  Shield,
  FileText,
  Calendar,
  Building,
} from 'lucide-react';

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
  onOpenNewClientModal: () => void;
}

export const QuickCreateModal: React.FC<QuickCreateModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenNewClientModal,
}) => {
  if (!isOpen) return null;

  const quickActions = [
    {
      title: 'New Client Entity',
      desc: 'Onboard a company, LLP, firm or individual with PAN, GSTIN & KYC',
      icon: Users,
      color: 'bg-emerald-500 text-white',
      action: () => {
        onClose();
        onOpenNewClientModal();
      },
    },
    {
      title: 'Create Task',
      desc: 'Assign statutory compliance, audit or adhoc task with due date & SLA',
      icon: CheckSquare,
      color: 'bg-blue-500 text-white',
      action: () => {
        onClose();
        onNavigateTab('tasks');
      },
    },
    {
      title: 'Generate Tax Invoice',
      desc: 'Bill client for professional fees, GST compliance, audit or advisory',
      icon: CreditCard,
      color: 'bg-purple-500 text-white',
      action: () => {
        onClose();
        onNavigateTab('billing-finance');
      },
    },
    {
      title: 'Record Department Notice',
      desc: 'Log Income Tax, GST, TDS or ROC notice with hearing deadline & risk',
      icon: Shield,
      color: 'bg-rose-500 text-white',
      action: () => {
        onClose();
        onNavigateTab('notices-dsc');
      },
    },
    {
      title: 'New Adhoc Request',
      desc: 'Log advisory, trademark, startup, projection or ROC change request',
      icon: FileText,
      color: 'bg-amber-500 text-white',
      action: () => {
        onClose();
        onNavigateTab('adhoc-requests');
      },
    },
    {
      title: 'Compliance Schedule',
      desc: 'View statutory due dates and map applicable client companies',
      icon: Calendar,
      color: 'bg-teal-500 text-white',
      action: () => {
        onClose();
        onNavigateTab('compliance-calendar');
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#00C975] text-white flex items-center justify-center">
              <Plus className="w-4 h-4 stroke-[3]" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Quick Create</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto">
          {quickActions.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                onClick={item.action}
                className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500/50 hover:bg-emerald-50/20 cursor-pointer transition group flex flex-col justify-between"
              >
                <div>
                  <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center mb-3 shadow-xs`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
