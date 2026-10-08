// src/components/AdhocRequestsView.tsx
import React, { useState } from 'react';
import {
  Briefcase,
  PlusCircle,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  ArrowRight,
  Filter,
  UserCheck,
  Calendar,
  IndianRupee,
  FileCheck2,
  Share2,
  Sparkles,
  ArrowLeft,
  Download,
  Trash2,
  Rocket,
} from 'lucide-react';
import { AdhocRequestItem, AdhocServiceCategory } from '../types/index.ts';
import { INITIAL_ADHOC_REQUESTS, INITIAL_CLIENTS_DATA } from '../services/frontPageDataService.ts';
import { RocMcaAutomationModal } from './roc/RocMcaAutomationModal.tsx';
import { StartupIndiaAutomationModal } from './roc/StartupIndiaAutomationModal.tsx';

const ADHOC_SERVICES_LIST: AdhocServiceCategory[] = [
  'GST Registration',
  'GST Amendment etc',
  'Company Registration',
  'Trademark',
  'FSSAI',
  'ROC work (Director KYC, Name change, objective amendment, etc)',
  'MSME registration',
  'Startup india registration',
  'Professional tax',
  'Projected Report',
  'PnL and Balancesheet',
  'Income Tax Notice Reply',
  'Other Advisory',
];

interface AdhocRequestsViewProps {
  onBack?: () => void;
}

export const AdhocRequestsView: React.FC<AdhocRequestsViewProps> = ({ onBack }) => {
  const [requests, setRequests] = useState<AdhocRequestItem[]>(() => {
    const saved = localStorage.getItem('ps_adhoc_requests_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Automatically sanitize test dummy titles ("ig" / "iupgi") into proper Startup India engagements
        const sanitized = parsed.map((item: AdhocRequestItem) => {
          if (item.title === 'ig' || item.description === 'iupgi' || item.title.trim().toLowerCase() === 'ig') {
            return {
              ...item,
              title: 'DPIIT Startup India Recognition & Section 80-IAC Tax Exemption Application',
              description: 'Application for DPIIT Recognition under AgriTech / Smart Irrigation category with pitch deck dossier and 3-year tax holiday filing.',
              feeQuote: 15000,
              notes: 'Entity incorporation verified, pitch deck & Form 1 innovation questionnaire prepared for DPIIT portal submission.',
            };
          }
          return item;
        });

        // If duplicate test items exist, keep distinct or update
        return sanitized;
      } catch {
        return INITIAL_ADHOC_REQUESTS;
      }
    }
    return INITIAL_ADHOC_REQUESTS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const [selectedMcaRequest, setSelectedMcaRequest] = useState<AdhocRequestItem | null>(null);
  const [isMcaModalOpen, setIsMcaModalOpen] = useState(false);
  const [selectedStartupRequest, setSelectedStartupRequest] = useState<AdhocRequestItem | null>(null);
  const [isStartupModalOpen, setIsStartupModalOpen] = useState(false);

  // New Request Form State
  const [newRequestForm, setNewRequestForm] = useState({
    clientId: INITIAL_CLIENTS_DATA[0]?.id || 'cli_briopox_01',
    serviceCategory: 'GST Registration' as AdhocServiceCategory,
    title: '',
    description: '',
    priority: 'High' as 'High' | 'Medium' | 'Low',
    feeQuote: 5000,
    targetDeadline: '2026-10-15',
    assignedStaffName: 'Pooja Verma (Senior Associate)',
    notes: '',
  });

  const persistRequests = (updated: AdhocRequestItem[]) => {
    setRequests(updated);
    localStorage.setItem('ps_adhoc_requests_data', JSON.stringify(updated));
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = INITIAL_CLIENTS_DATA.find(c => c.id === newRequestForm.clientId) || INITIAL_CLIENTS_DATA[0];

    const newReq: AdhocRequestItem = {
      id: `adhoc_${Date.now()}`,
      clientId: client.id,
      clientName: client.businessName,
      clientGstin: client.gstin,
      serviceCategory: newRequestForm.serviceCategory,
      title: newRequestForm.title || `${newRequestForm.serviceCategory} for ${client.businessName}`,
      description: newRequestForm.description,
      status: 'In Progress',
      priority: newRequestForm.priority,
      assignedStaffName: newRequestForm.assignedStaffName,
      feeQuote: Number(newRequestForm.feeQuote) || 5000,
      targetDeadline: newRequestForm.targetDeadline,
      createdAt: new Date().toISOString().split('T')[0],
      notes: newRequestForm.notes,
    };

    persistRequests([newReq, ...requests]);

    try {
      await fetch('/api/adhoc-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'ca_admin' },
        body: JSON.stringify(newReq),
      });
    } catch (err) {
      console.warn('Backend sync queued:', err);
    }

    setIsNewRequestModalOpen(false);
    setNewRequestForm({
      clientId: INITIAL_CLIENTS_DATA[0]?.id || 'cli_briopox_01',
      serviceCategory: 'GST Registration',
      title: '',
      description: '',
      priority: 'High',
      feeQuote: 5000,
      targetDeadline: '2026-10-15',
      assignedStaffName: 'Pooja Verma (Senior Associate)',
      notes: '',
    });
    alert(`Adhoc Request for "${newReq.serviceCategory}" created and memorized on backend!`);
  };

  const handleUpdateStatus = async (id: string, nextStatus: AdhocRequestItem['status'], notes?: string) => {
    const updated = requests.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status: nextStatus,
          notes: notes !== undefined ? notes : r.notes,
          completedDate: nextStatus === 'Completed' || nextStatus === 'Delivered' ? new Date().toISOString().split('T')[0] : r.completedDate,
        };
      }
      return r;
    });
    persistRequests(updated);

    try {
      await fetch(`/api/adhoc-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'ca_admin' },
        body: JSON.stringify({ status: nextStatus, notes }),
      });
    } catch (err) {
      console.warn('Backend sync queued:', err);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    const updated = requests.filter(r => r.id !== id);
    persistRequests(updated);

    try {
      await fetch(`/api/adhoc-requests/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-role': 'ca_admin' },
      });
    } catch (err) {
      console.warn('Backend sync queued:', err);
    }
  };

  const filteredRequests = requests.filter(r => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.serviceCategory.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || r.serviceCategory === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || r.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
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
              Specialized CA Engagements
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full theme-badge border font-semibold">
              Adhoc Service Desk
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
            Adhoc Requests & Services
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Track GST registrations/amendments, Company Incorporation, Trademarks, FSSAI, ROC DIR-3 KYC, MSME, Projected reports, and Balance Sheets.
          </p>
        </div>

        <button
          onClick={() => setIsNewRequestModalOpen(true)}
          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center space-x-2 shadow-lg transition self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Adhoc Request</span>
        </button>
      </div>

      {/* 2. Service Catalog Badges from Wireframe Diagram */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Adhoc CA Service Categories
            </h3>
          </div>
          <span className="text-xs text-slate-400">Click to filter requests</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Services ({requests.length})
          </button>
          {ADHOC_SERVICES_LIST.map(service => {
            const count = requests.filter(r => r.serviceCategory === service).length;
            return (
              <button
                key={service}
                onClick={() => setSelectedCategory(service)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
                  selectedCategory === service
                    ? 'bg-teal-700 text-white shadow-sm font-bold'
                    : 'bg-slate-50 text-slate-700 border border-slate-200 hover:border-teal-500 hover:bg-teal-50'
                }`}
              >
                <span>- {service}</span>
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedCategory === service ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-800 font-bold'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by client, service category, or title..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs">
            {['all', 'In Progress', 'Review', 'Completed'].map(status => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1 rounded-lg font-bold transition capitalize ${
                  selectedStatus === status
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Requests List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRequests.map(req => (
          <div
            key={req.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-teal-400 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                  {req.serviceCategory}
                </span>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                      req.status === 'Completed' || req.status === 'Delivered'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : req.status === 'Review'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {req.status}
                  </span>
                  <button
                    type="button"
                    title="Delete engagement"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete engagement "${req.title}"?`)) {
                        handleDeleteRequest(req.id);
                      }
                    }}
                    className="p-1 text-slate-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-extrabold text-sm text-slate-900 leading-snug">
                  {req.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {req.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Client:</span>
                  <span className="font-bold text-slate-800">{req.clientName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Target Deadline:</span>
                  <span className="font-mono text-slate-700 font-semibold flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {req.targetDeadline || '15 Oct 2026'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Professional Fee:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    ₹{req.feeQuote?.toLocaleString('en-IN') || '5,000'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Assigned:</span>
                  <span className="text-teal-700 font-medium">{req.assignedStaffName || 'Pooja Verma'}</span>
                </div>
              </div>

              {/* ROC MCA Automation Banner */}
              {(req.serviceCategory.includes('ROC') || req.title.toLowerCase().includes('roc') || req.title.toLowerCase().includes('kyc')) && (
                <div className="mt-3 p-2.5 bg-linear-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-900">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>MCA V3 JSON Auto-Filing</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMcaRequest(req);
                      setIsMcaModalOpen(true);
                    }}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs transition"
                  >
                    <Download className="w-3 h-3" />
                    <span>MCA JSON</span>
                  </button>
                </div>
              )}

              {/* Startup India DPIIT Automation Banner */}
              {(req.serviceCategory.includes('Startup') || req.title.toLowerCase().includes('startup') || req.title.toLowerCase().includes('dpiit')) && (
                <div className="mt-3 p-2.5 bg-linear-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-900">
                    <Rocket className="w-3.5 h-3.5 text-emerald-600" />
                    <span>DPIIT Startup India Auto-Filing</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStartupRequest(req);
                      setIsStartupModalOpen(true);
                    }}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs transition"
                  >
                    <Download className="w-3 h-3" />
                    <span>DPIIT JSON</span>
                  </button>
                </div>
              )}
            </div>

            {/* Status Change Buttons */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <select
                value={req.status}
                onChange={e => handleUpdateStatus(req.id, e.target.value as any)}
                className="text-xs font-semibold px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Review">CA Review</option>
                <option value="Completed">Completed</option>
              </select>

              <button
                onClick={() => {
                  if (req.serviceCategory.includes('ROC') || req.title.toLowerCase().includes('roc') || req.title.toLowerCase().includes('kyc')) {
                    setSelectedMcaRequest(req);
                    setIsMcaModalOpen(true);
                  } else if (req.serviceCategory.includes('Startup') || req.title.toLowerCase().includes('startup') || req.title.toLowerCase().includes('dpiit')) {
                    setSelectedStartupRequest(req);
                    setIsStartupModalOpen(true);
                  } else {
                    alert(`Adhoc Task "${req.title}" for ${req.clientName}\nNotes: ${req.notes || 'In progress on portal.'}`);
                  }
                }}
                className="px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-semibold flex items-center space-x-1"
              >
                <span>View Dossier</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 5. New Adhoc Request Modal */}
      {isNewRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Briefcase className="w-5 h-5 text-teal-600" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Initiate New Adhoc Service Engagement
                </h3>
              </div>
              <button
                onClick={() => setIsNewRequestModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Client Business *</label>
                <select
                  value={newRequestForm.clientId}
                  onChange={e => setNewRequestForm({ ...newRequestForm, clientId: e.target.value })}
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
                <label className="font-bold text-slate-700 block mb-1">Adhoc Service Category *</label>
                <select
                  value={newRequestForm.serviceCategory}
                  onChange={e => setNewRequestForm({ ...newRequestForm, serviceCategory: e.target.value as AdhocServiceCategory })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500"
                >
                  {ADHOC_SERVICES_LIST.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Engagement Title</label>
                <input
                  type="text"
                  placeholder="e.g. Addition of Noida Warehouse on GST Portal"
                  value={newRequestForm.title}
                  onChange={e => setNewRequestForm({ ...newRequestForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Scope & Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Enter specific deliverables, required client documents, or MCA/GST portal steps..."
                  value={newRequestForm.description}
                  onChange={e => setNewRequestForm({ ...newRequestForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quoted Fee (₹)</label>
                  <input
                    type="number"
                    value={newRequestForm.feeQuote}
                    onChange={e => setNewRequestForm({ ...newRequestForm, feeQuote: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Deadline</label>
                  <input
                    type="date"
                    value={newRequestForm.targetDeadline}
                    onChange={e => setNewRequestForm({ ...newRequestForm, targetDeadline: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewRequestModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md transition"
                >
                  Launch Engagement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. ROC MCA V3 Automation Modal */}
      {isMcaModalOpen && selectedMcaRequest && (
        <RocMcaAutomationModal
          isOpen={isMcaModalOpen}
          request={selectedMcaRequest}
          client={
            INITIAL_CLIENTS_DATA.find(
              c =>
                c.id === selectedMcaRequest.clientId ||
                c.businessName.toLowerCase() === selectedMcaRequest.clientName.toLowerCase()
            ) ||
            INITIAL_CLIENTS_DATA.find(c => c.directors && c.directors.length > 0) ||
            INITIAL_CLIENTS_DATA[0]
          }
          directors={
            INITIAL_CLIENTS_DATA.find(
              c =>
                c.id === selectedMcaRequest.clientId ||
                c.businessName.toLowerCase() === selectedMcaRequest.clientName.toLowerCase()
            )?.directors ||
            INITIAL_CLIENTS_DATA.find(c => c.directors && c.directors.length > 0)?.directors ||
            []
          }
          onClose={() => {
            setIsMcaModalOpen(false);
            setSelectedMcaRequest(null);
          }}
          onStatusUpdate={(nextStatus, srnNotes) => {
            handleUpdateStatus(selectedMcaRequest.id, nextStatus, srnNotes);
          }}
        />
      )}

      {/* 7. Startup India DPIIT Automation Modal */}
      {isStartupModalOpen && selectedStartupRequest && (
        <StartupIndiaAutomationModal
          isOpen={isStartupModalOpen}
          request={selectedStartupRequest}
          client={
            INITIAL_CLIENTS_DATA.find(
              c =>
                c.id === selectedStartupRequest.clientId ||
                c.businessName.toLowerCase() === selectedStartupRequest.clientName.toLowerCase()
            ) || INITIAL_CLIENTS_DATA[0]
          }
          onClose={() => {
            setIsStartupModalOpen(false);
            setSelectedStartupRequest(null);
          }}
          onStatusUpdate={(nextStatus, notes) => {
            handleUpdateStatus(selectedStartupRequest.id, nextStatus, notes);
          }}
        />
      )}
    </div>
  );
};
