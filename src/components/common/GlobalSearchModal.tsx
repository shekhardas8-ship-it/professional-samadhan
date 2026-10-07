// src/components/common/GlobalSearchModal.tsx
import React, { useState, useEffect } from 'react';
import { Search, X, Users, CheckSquare, CreditCard, AlertCircle, FileText, ArrowRight } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sampleSearchDatabase = [
    { title: 'Briopox Pvt Ltd', category: 'Client CRM', gstin: '07AABCB9123D1ZX', targetTab: 'clients', icon: Users },
    { title: 'Aggarwal & Sons Trading Co.', category: 'Client CRM', gstin: '07AAACA4491E1ZQ', targetTab: 'clients', icon: Users },
    { title: 'Apex Healthtech LLP', category: 'Client CRM', gstin: '07AABFA8941N1Z3', targetTab: 'clients', icon: Users },
    { title: 'GSTR-1 Monthly Return Filing', category: 'Tasks', gstin: 'Briopox Pvt Ltd', targetTab: 'tasks', icon: CheckSquare },
    { title: 'TDS Challan Deposit ITNS 281', category: 'Tasks', gstin: 'Aggarwal & Sons', targetTab: 'tasks', icon: CheckSquare },
    { title: 'Invoice #PS/2026-27/0412', category: 'Billing & Invoices', gstin: '₹5,900 Pending', targetTab: 'billing', icon: CreditCard },
    { title: 'Notice ASMT-10 (ZA0709260018921)', category: 'Statutory Notices', gstin: '₹48,520 Demand', targetTab: 'notices', icon: AlertCircle },
    { title: 'September_Sales_Register_142_Invoices.pdf', category: 'Documents Vault', gstin: '4.2 MB Extracted', targetTab: 'documents', icon: FileText },
  ];

  const results = sampleSearchDatabase.filter(item =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase()) ||
    item.gstin.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden animate-scaleUp border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search clients, GSTIN, PAN, tasks, invoices, notices, documents... (Esc to exit)"
            className="w-full text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2 space-y-1 divide-y divide-slate-50 custom-scrollbar">
          {results.length > 0 ? (
            results.map((r, idx) => {
              const Icon = r.icon;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    onNavigate(r.targetTab);
                    onClose();
                  }}
                  className="p-3 rounded-xl hover:bg-slate-50 cursor-pointer flex items-center justify-between transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-700 transition">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#00a864] transition">
                        {r.title}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {r.category} • <span className="font-mono text-slate-500">{r.gstin}</span>
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#00a864] group-hover:translate-x-0.5 transition" />
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              No matching records found for "{query}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
