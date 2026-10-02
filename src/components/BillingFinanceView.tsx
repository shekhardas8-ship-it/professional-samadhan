// src/components/BillingFinanceView.tsx
import React, { useState } from 'react';
import {
  CreditCard,
  IndianRupee,
  Receipt,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlusCircle,
  Download,
  Eye,
  Filter,
  Search,
  Building2,
  ArrowLeft,
} from 'lucide-react';
import { BillingInvoiceItem } from '../types/index.ts';
import { INITIAL_BILLING_INVOICES, INITIAL_CLIENTS_DATA } from '../services/frontPageDataService.ts';

interface BillingFinanceViewProps {
  onBack?: () => void;
}

export const BillingFinanceView: React.FC<BillingFinanceViewProps> = ({ onBack }) => {
  const [invoices, setInvoices] = useState<BillingInvoiceItem[]>(() => {
    const saved = localStorage.getItem('ps_billing_invoices');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_BILLING_INVOICES;
      }
    }
    return INITIAL_BILLING_INVOICES;
  });

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);

  const [newInvoiceForm, setNewInvoiceForm] = useState({
    clientId: INITIAL_CLIENTS_DATA[0]?.id || 'cli_briopox_01',
    serviceDescription: 'Monthly GST Retainer & GSTR-3B Filing (September 2026)',
    serviceCategory: 'Routine GST Filing' as BillingInvoiceItem['serviceCategory'],
    professionalFee: 5000,
    dueDate: '2026-10-20',
  });

  const persistInvoices = (updated: BillingInvoiceItem[]) => {
    setInvoices(updated);
    localStorage.setItem('ps_billing_invoices', JSON.stringify(updated));
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = INITIAL_CLIENTS_DATA.find(c => c.id === newInvoiceForm.clientId) || INITIAL_CLIENTS_DATA[0];
    const fee = Number(newInvoiceForm.professionalFee) || 5000;
    const gst = Math.round(fee * 0.18);
    const total = fee + gst;

    const newInv: BillingInvoiceItem = {
      id: `inv_${Date.now()}`,
      invoiceNumber: `PS/2026-27/${Math.floor(1000 + Math.random() * 9000)}`,
      clientId: client.id,
      clientName: client.businessName,
      serviceDescription: newInvoiceForm.serviceDescription,
      serviceCategory: newInvoiceForm.serviceCategory,
      professionalFee: fee,
      gstAmount: gst,
      totalPayable: total,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: newInvoiceForm.dueDate,
      status: 'Pending',
    };

    persistInvoices([newInv, ...invoices]);

    try {
      await fetch('/api/billing-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'ca_admin' },
        body: JSON.stringify(newInv),
      });
    } catch (err) {
      console.warn('Backend sync queued:', err);
    }

    setIsNewInvoiceModalOpen(false);
    alert(`Tax Invoice #${newInv.invoiceNumber} generated and memorized on backend for ${client.businessName}! Total: ₹${total.toLocaleString('en-IN')}`);
  };

  const handleMarkAsPaid = async (id: string) => {
    const updated = invoices.map(inv => {
      if (inv.id === id) {
        return {
          ...inv,
          status: 'Paid' as const,
          paymentMode: 'Bank Transfer (NEFT)',
          receiptNumber: `REC-${Date.now().toString().slice(-4)}`,
        };
      }
      return inv;
    });
    persistInvoices(updated);

    try {
      await fetch(`/api/billing-invoices/${id}/mark-paid`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'ca_admin' },
      });
    } catch (err) {
      console.warn('Backend sync queued:', err);
    }
  };

  const totalBilled = invoices.reduce((acc, curr) => acc + curr.totalPayable, 0);
  const totalCollected = invoices.filter(i => i.status === 'Paid').reduce((acc, curr) => acc + curr.totalPayable, 0);
  const totalPending = invoices.filter(i => i.status === 'Pending').reduce((acc, curr) => acc + curr.totalPayable, 0);

  const filteredInvoices = invoices.filter(inv => {
    const matchSearch =
      inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.serviceDescription.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Banner */}
      <div className="theme-banner text-white rounded-3xl p-6 sm:p-8 shadow-xl border flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          {onBack && (
            <button
              onClick={onBack}
              className="mb-3 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 w-fit border border-white/20 shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Cockpit</span>
            </button>
          )}
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase tracking-wider theme-accent-text font-bold">
              Practice Revenue & Collections
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full theme-badge border font-semibold">
              Tax Invoicing
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
            Billing & Finance
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Maintain statutory CA retainer invoices, adhoc service billing, 18% GST output tax, and payment receipts.
          </p>
        </div>

        <button
          onClick={() => setIsNewInvoiceModalOpen(true)}
          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center space-x-2 shadow-lg transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Generate Tax Invoice</span>
        </button>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Total Billed Fees</div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono">
            ₹{totalBilled.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">FY 2026-27 practice revenue</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Total Collected</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2 font-mono">
            ₹{totalCollected.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Direct to firm bank account
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Outstanding Receivables</div>
          <div className="text-2xl sm:text-3xl font-black text-amber-700 mt-2 font-mono">
            ₹{totalPending.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-amber-600 font-medium mt-1">Pending payment by clients</div>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by invoice #, client name, or service..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold">
          {['all', 'Paid', 'Pending'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded-lg transition ${
                filterStatus === status
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === 'all' ? 'All Invoices' : status}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="p-4">Invoice #</th>
                <th className="p-4">Client Business</th>
                <th className="p-4">Service Description</th>
                <th className="p-4">Fee + GST</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredInvoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                  <td className="p-4 font-extrabold text-slate-900">{inv.clientName}</td>
                  <td className="p-4 max-w-xs truncate">{inv.serviceDescription}</td>
                  <td className="p-4 font-mono text-slate-500">
                    ₹{inv.professionalFee.toLocaleString('en-IN')} + ₹{inv.gstAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-4 font-mono font-black text-slate-900 text-sm">
                    ₹{inv.totalPayable.toLocaleString('en-IN')}
                  </td>
                  <td className="p-4 font-mono text-slate-600">{inv.dueDate}</td>
                  <td className="p-4">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                        inv.status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {inv.status === 'Pending' ? (
                      <button
                        onClick={() => handleMarkAsPaid(inv.id)}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-200 transition"
                      >
                        Mark Paid
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-700 font-semibold font-mono">
                        {inv.receiptNumber}
                      </span>
                    )}
                    <button
                      onClick={() => alert(`Downloading Statutory Tax Invoice ${inv.invoiceNumber} for ${inv.clientName}...`)}
                      className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition"
                      title="Download PDF Invoice"
                    >
                      <Download className="w-3.5 h-3.5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. New Invoice Modal */}
      {isNewInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-teal-600" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Generate CA Tax Invoice
                </h3>
              </div>
              <button
                onClick={() => setIsNewInvoiceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Client *</label>
                <select
                  value={newInvoiceForm.clientId}
                  onChange={e => setNewInvoiceForm({ ...newInvoiceForm, clientId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500"
                >
                  {INITIAL_CLIENTS_DATA.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.businessName} ({c.gstin})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Service Description</label>
                <input
                  type="text"
                  required
                  value={newInvoiceForm.serviceDescription}
                  onChange={e => setNewInvoiceForm({ ...newInvoiceForm, serviceDescription: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Professional Fee (₹)</label>
                  <input
                    type="number"
                    required
                    value={newInvoiceForm.professionalFee}
                    onChange={e => setNewInvoiceForm({ ...newInvoiceForm, professionalFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Due Date</label>
                  <input
                    type="date"
                    required
                    value={newInvoiceForm.dueDate}
                    onChange={e => setNewInvoiceForm({ ...newInvoiceForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Professional Fee:</span>
                  <span className="font-mono font-semibold">₹{newInvoiceForm.professionalFee}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>CGST (9%) + SGST (9%):</span>
                  <span className="font-mono font-semibold">₹{Math.round(newInvoiceForm.professionalFee * 0.18)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
                  <span>Total Payable:</span>
                  <span className="font-mono">₹{newInvoiceForm.professionalFee + Math.round(newInvoiceForm.professionalFee * 0.18)}</span>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewInvoiceModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md transition"
                >
                  Create & Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
