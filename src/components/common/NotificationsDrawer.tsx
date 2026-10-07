// src/components/common/NotificationsDrawer.tsx
import React from 'react';
import { X, Bell, AlertTriangle, CheckCircle2, Clock, Calendar, Sparkles, ArrowRight } from 'lucide-react';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({ isOpen, onClose, onNavigate }) => {
  if (!isOpen) return null;

  const notifications = [
    { id: '1', title: '12 Statutory Filings Due Today', desc: 'GSTR-1, TDS Challans, and DIR-3 KYC statutory deadlines.', time: '10 mins ago', type: 'urgent', target: 'compliance-calendar' },
    { id: '2', title: 'ASMT-10 Notice Uploaded', desc: 'Briopox Pvt Ltd: ₹48,520 ITC mismatch requires written response.', time: '1 hour ago', type: 'urgent', target: 'notices' },
    { id: '3', title: 'DSC Token Expiring in 7 Days', desc: 'Ramesh Aggarwal (Class 3 Combo) expires on 12-Oct-2026.', time: '3 hours ago', type: 'warning', target: 'dsc' },
    { id: '4', title: '142 Invoices Extracted via AI', desc: 'Gemini Vision AI completed batch extraction for Briopox.', time: '5 hours ago', type: 'success', target: 'workpaper' },
    { id: '5', title: 'Automated Day-3 Reminder Sent', desc: 'WhatsApp reminder dispatched to 8 clients for pending statements.', time: '1 day ago', type: 'info', target: 'client-requests' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-sm h-full shadow-2xl flex flex-col animate-slideLeft">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800">Practice Notifications</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => {
                onNavigate(n.target);
                onClose();
              }}
              className="p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 cursor-pointer transition space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                  n.type === 'urgent'
                    ? 'bg-rose-100 text-rose-800'
                    : n.type === 'warning'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {n.type}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
              </div>
              <h4 className="text-xs font-bold text-slate-800 leading-tight">{n.title}</h4>
              <p className="text-[11px] text-slate-500 leading-snug">{n.desc}</p>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-slate-100 text-center">
          <button
            onClick={() => {
              onNavigate('recent-updates');
              onClose();
            }}
            className="text-xs font-bold text-[#00a864] hover:underline"
          >
            View Complete Activity Log
          </button>
        </div>
      </div>
    </div>
  );
};
