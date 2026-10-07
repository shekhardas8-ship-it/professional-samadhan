// src/components/ClientDirectoryKycView.tsx
import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Plus,
  Edit2,
  Upload,
  Download,
  Eye,
  Trash2,
  Phone,
  Mail,
  MapPin,
  FileSpreadsheet,
  AlertTriangle,
  FolderOpen,
  UserPlus,
  ExternalLink,
  Search,
  Check,
  ArrowLeft,
  X,
  FileCheck,
  BadgeCheck,
  Printer,
  Sparkles,
  Tag,
  Star,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  MoreHorizontal,
  DollarSign,
  TrendingUp,
  CreditCard,
  Layers,
  Sliders,
  Send,
  HelpCircle,
  AlertCircle,
  MessageSquare,
  Paperclip,
  Share2,
} from 'lucide-react';
import {
  Client,
  DirectorKYC,
  ClientAttachedDoc,
  ContactPerson,
  ClientNote,
  ClientRequestItem,
} from '../types/index.ts';
import {
  INITIAL_CLIENTS_DATA,
  ATTACHED_DOC_TEMPLATES,
} from '../services/frontPageDataService.ts';
import { ClientManagementModal } from './ClientManagementModal.tsx';

interface ClientDirectoryKycViewProps {
  onBack?: () => void;
  onOpenClientPortal?: (token: string) => void;
  onRefreshParent?: () => void;
}

export const ClientDirectoryKycView: React.FC<ClientDirectoryKycViewProps> = ({
  onBack,
  onOpenClientPortal,
  onRefreshParent,
}) => {
  // Load clients with local persistence
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('ps_clients_kyc_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        return INITIAL_CLIENTS_DATA;
      }
    }
    return INITIAL_CLIENTS_DATA;
  });

  // Navigation mode: 'table' (Screenshot 5: All Clients directory) vs 'detail' (Screenshots 1, 3, 4: Client 360 Workspace)
  const [viewMode, setViewMode] = useState<'table' | 'detail'>('table');
  const [selectedClientId, setSelectedClientId] = useState<string>(
    clients[0]?.id || 'cli_zylker_01'
  );

  // Client 360 Sub-tab
  const [activeSubTab, setActiveSubTab] = useState<
    | 'overview'
    | 'profile'
    | 'tasks'
    | 'insights'
    | 'client-requests'
    | 'emails'
    | 'discussions'
    | 'documents'
  >('profile');

  // Search & Filter in Table
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});

  // Toast feedback (matching the green banner at top of Screenshot 1)
  const [feedbackToast, setFeedbackToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Client Management Modals (Add / Edit Client)
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientManagementEditId, setClientManagementEditId] = useState<string | null>(null);

  // ==========================================
  // SCREENSHOT 2: ADD CONTACT PERSON MODAL
  // ==========================================
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState<{
    name: string;
    email: string;
    countryCode: string;
    phone: string;
    phoneType: 'Mobile' | 'Work' | 'Personal';
    skypeNumber: string;
    designation: string;
    department: string;
    isPrimary: boolean;
  }>({
    name: '',
    email: '',
    countryCode: '+1',
    phone: '',
    phoneType: 'Mobile',
    skypeNumber: '',
    designation: '',
    department: '',
    isPrimary: false,
  });

  // ==========================================
  // SCREENSHOT 1: NOTES & ONBOARDING STATE
  // ==========================================
  const [noteInputText, setNoteInputText] = useState('');
  const [noteIsBold, setNoteIsBold] = useState(false);
  const [noteIsItalic, setNoteIsItalic] = useState(false);
  const [noteIsUnderline, setNoteIsUnderline] = useState(false);
  const [showWhatsNextDropdown, setShowWhatsNextDropdown] = useState(false);
  const [isAssignUserModalOpen, setIsAssignUserModalOpen] = useState(false);
  const [selectedAssigneeName, setSelectedAssigneeName] = useState('Dwaipayan Bose');

  // ==========================================
  // SCREENSHOT 3: CLIENT REQUESTS FILTERS
  // ==========================================
  const [requestFilterApp, setRequestFilterApp] = useState('all');
  const [requestFilterStatus, setRequestFilterStatus] = useState('all');
  const [requestFilterPriority, setRequestFilterPriority] = useState('all');
  const [requestFilterUser, setRequestFilterUser] = useState('all');
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const [newRequestForm, setNewRequestForm] = useState({
    title: '',
    associatedApp: 'Books' as 'Books' | 'GST' | 'Expense' | 'Inventory',
    priority: 'Medium' as 'Very Low' | 'Low' | 'Medium' | 'High' | 'Urgent',
    assignedTo: 'Dwaipayan Bose',
  });

  // ==========================================
  // SCREENSHOT 4: INSIGHTS BANK & EXPENSE TABS
  // ==========================================
  const [bankSubTab, setBankSubTab] = useState<'disconnected' | 'uncategorized' | 'unreconciled' | 'duplicate'>('disconnected');

  // Auto-dismiss toast
  useEffect(() => {
    if (feedbackToast) {
      const timer = setTimeout(() => setFeedbackToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [feedbackToast]);

  const persistClients = (updated: Client[]) => {
    setClients(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ps_clients_kyc_data', JSON.stringify(updated));
      window.dispatchEvent(new Event('ps_data_updated'));
    }
  };

  useEffect(() => {
    const handleSync = () => {
      const saved = localStorage.getItem('ps_clients_kyc_data');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) setClients(parsed);
        } catch {}
      }
    };
    window.addEventListener('ps_data_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('ps_data_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const selectedClient =
    clients.find(c => c.id === selectedClientId) ||
    clients[0] || {
      id: 'empty',
      displayName: 'Empty',
      businessName: 'No Clients Found',
      contactPerson: '',
      gstin: '',
      registeredPhone: '',
      email: '',
      active: true,
      requiredChecklist: [],
      expectedBankAccounts: [],
      whatsappConsent: false,
      reminderCadenceDays: 3,
      maxReminders: 3,
      remindersPaused: false,
    };

  // Filter clients for table view
  const filteredClients = clients.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      (c.displayName && c.displayName.toLowerCase().includes(q)) ||
      c.businessName?.toLowerCase().includes(q) ||
      c.gstin?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.contactPerson?.toLowerCase().includes(q)
    );
  });

  // Toggle row select
  const toggleSelectRow = (id: string) => {
    setSelectedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSelectAll = () => {
    if (Object.keys(selectedRows).length === filteredClients.length) {
      setSelectedRows({});
    } else {
      const all: Record<string, boolean> = {};
      filteredClients.forEach(c => (all[c.id] = true));
      setSelectedRows(all);
    }
  };

  // Add Contact Person Handler (Screenshot 2)
  const handleSaveContactPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim()) {
      alert('Please provide contact person name and email address.');
      return;
    }

    const newContact: ContactPerson = {
      id: `cp_${Date.now()}`,
      name: contactForm.name.trim(),
      email: contactForm.email.trim(),
      countryCode: contactForm.countryCode,
      phone: contactForm.phone.trim(),
      phoneType: contactForm.phoneType,
      skypeNumber: contactForm.skypeNumber.trim() || undefined,
      designation: contactForm.designation.trim() || undefined,
      department: contactForm.department.trim() || undefined,
      isPrimary: contactForm.isPrimary,
    };

    const updated = clients.map(c => {
      if (c.id === selectedClient.id) {
        const existing = c.contactPersons || [];
        return {
          ...c,
          contactPersons: [...existing, newContact],
        };
      }
      return c;
    });

    persistClients(updated);
    setIsAddContactModalOpen(false);
    setContactForm({
      name: '',
      email: '',
      countryCode: '+1',
      phone: '',
      phoneType: 'Mobile',
      skypeNumber: '',
      designation: '',
      department: '',
      isPrimary: false,
    });

    // Exact toast feedback matching Screenshot 1!
    setFeedbackToast({
      type: 'success',
      message: "Contact person's information has been saved.",
    });
  };

  // Add Note Handler (Screenshot 1 - Column 3)
  const handleSaveNote = () => {
    if (!noteInputText.trim()) return;

    const newNote: ClientNote = {
      id: `note_${Date.now()}`,
      text: noteInputText.trim(),
      isBold: noteIsBold,
      isItalic: noteIsItalic,
      isUnderline: noteIsUnderline,
      authorName: 'Dwaipayan Bose',
      createdAt: 'Just now',
    };

    const updated = clients.map(c => {
      if (c.id === selectedClient.id) {
        return {
          ...c,
          notes: [newNote, ...(c.notes || [])],
        };
      }
      return c;
    });

    persistClients(updated);
    setNoteInputText('');
    setNoteIsBold(false);
    setNoteIsItalic(false);
    setNoteIsUnderline(false);

    setFeedbackToast({
      type: 'success',
      message: 'Note saved successfully.',
    });
  };

  const handleDeleteNote = (noteId: string) => {
    const updated = clients.map(c => {
      if (c.id === selectedClient.id) {
        return {
          ...c,
          notes: (c.notes || []).filter(n => n.id !== noteId),
        };
      }
      return c;
    });
    persistClients(updated);
    setFeedbackToast({
      type: 'success',
      message: 'Note deleted.',
    });
  };

  // Assign User Handler
  const handleAssignUser = (userName: string) => {
    const updated = clients.map(c => {
      if (c.id === selectedClient.id) {
        return {
          ...c,
          assignedStaffName: userName,
          managedBy: [{ id: `usr_${Date.now()}`, name: userName, role: 'Staff Member' }],
        };
      }
      return c;
    });
    persistClients(updated);
    setIsAssignUserModalOpen(false);
    setFeedbackToast({
      type: 'success',
      message: `Assigned client to ${userName}.`,
    });
  };

  // Add Request Handler (Screenshot 3)
  const handleCreateClientRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequestForm.title.trim()) return;

    const existing = selectedClient.clientRequests || [];
    const newReq: ClientRequestItem = {
      id: `cr_${Date.now()}`,
      requestNumber: existing.length + 1,
      title: newRequestForm.title.trim(),
      assignedTo: newRequestForm.assignedTo,
      status: 'Open',
      priority: newRequestForm.priority,
      clientName: selectedClient.businessName,
      associatedApp: newRequestForm.associatedApp,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updated = clients.map(c => {
      if (c.id === selectedClient.id) {
        return {
          ...c,
          openClientRequestsCount: (c.openClientRequestsCount || 0) + 1,
          clientRequests: [newReq, ...(c.clientRequests || [])],
        };
      }
      return c;
    });

    persistClients(updated);
    setIsNewRequestModalOpen(false);
    setNewRequestForm({
      title: '',
      associatedApp: 'Books',
      priority: 'Medium',
      assignedTo: 'Dwaipayan Bose',
    });
    setFeedbackToast({
      type: 'success',
      message: 'Client request created successfully.',
    });
  };

  // Filter client requests for tab
  const clientRequestsList = (selectedClient.clientRequests || []).filter(r => {
    if (requestFilterApp !== 'all' && r.associatedApp !== requestFilterApp) return false;
    if (requestFilterStatus !== 'all' && r.status !== requestFilterStatus) return false;
    if (requestFilterPriority !== 'all' && r.priority !== requestFilterPriority) return false;
    if (requestFilterUser !== 'all' && r.assignedTo !== requestFilterUser) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f3f5f8] text-slate-800 -m-4 sm:-m-6 lg:-m-8 flex flex-col font-sans select-none">
      {/* Top Floating Feedback Toast (Exact Screenshot 1 green badge) */}
      {feedbackToast && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg border flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-top-2 bg-[#e6f8f0] text-[#00874e] border-[#b0e8ce]">
          <CheckCircle2 className="w-4 h-4 text-[#00c073] shrink-0" />
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 1: ALL CLIENTS DIRECTORY TABLE (SCREENSHOT 5)
         ========================================================================= */}
      {viewMode === 'table' && (
        <div className="flex-1 flex flex-col p-6 sm:p-8 space-y-4">
          {/* Header Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <button className="flex items-center space-x-1.5 text-lg font-bold text-slate-900 hover:text-blue-700 transition cursor-pointer">
                  <span>All Clients</span>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Search input */}
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search in Clients ( / )"
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* + New Client Button */}
              <button
                onClick={() => {
                  setClientManagementEditId(null);
                  setIsClientModalOpen(true);
                }}
                className="px-4 py-2 bg-[#1565c0] hover:bg-[#0d47a1] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Client</span>
              </button>

              <button className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Directory Table (Screenshot 5) */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden flex-1">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8fafc] text-slate-500 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200 select-none">
                  <tr>
                    <th className="py-3.5 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={
                          filteredClients.length > 0 &&
                          Object.keys(selectedRows).length === filteredClients.length
                        }
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="py-3.5 px-4">NAME</th>
                    <th className="py-3.5 px-4">BUSINESS NAME</th>
                    <th className="py-3.5 px-4">EMAIL</th>
                    <th className="py-3.5 px-4">MOBILE PHONE</th>
                    <th className="py-3.5 px-4 text-center">PENDING TASKS</th>
                    <th className="py-3.5 px-4 text-center">OPEN CLIENTREQUESTS</th>
                    <th className="py-3.5 px-4">ASSOCIATED APPS</th>
                    <th className="py-3.5 px-4">MANAGED BY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClients.map(client => {
                    const isSelected = Boolean(selectedRows[client.id]);
                    const initials = client.displayName
                      ? client.displayName.charAt(0)
                      : client.businessName.charAt(0);

                    return (
                      <tr
                        key={client.id}
                        onClick={() => {
                          setSelectedClientId(client.id);
                          setViewMode('detail');
                        }}
                        className={`hover:bg-blue-50/40 transition cursor-pointer ${
                          isSelected ? 'bg-blue-50/60' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td
                          className="py-3.5 px-4"
                          onClick={e => {
                            e.stopPropagation();
                            toggleSelectRow(client.id);
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(client.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>

                        {/* Name with circle letter avatar */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0">
                              {initials}
                            </div>
                            <span className="font-semibold text-blue-600 hover:underline">
                              {client.displayName || client.businessName}
                            </span>
                          </div>
                        </td>

                        {/* Business Name */}
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {client.businessName}
                        </td>

                        {/* Email */}
                        <td className="py-3.5 px-4 text-slate-500">
                          {client.email || '—'}
                        </td>

                        {/* Mobile Phone */}
                        <td className="py-3.5 px-4 text-slate-500 font-mono">
                          {client.registeredPhone || '—'}
                        </td>

                        {/* Pending Tasks Count */}
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                          {client.pendingTasksCount ?? 0}
                        </td>

                        {/* Open Client Requests Count */}
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                          {client.openClientRequestsCount ?? 0}
                        </td>

                        {/* Associated Apps (Accounting/Books, Expense, Inventory) */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-1.5 text-slate-500">
                            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" title="Books / Accounting" />
                            <FileText className="w-3.5 h-3.5 text-rose-500" title="Expense Management" />
                            <Layers className="w-3.5 h-3.5 text-amber-500" title="Inventory / Stock" />
                          </div>
                        </td>

                        {/* Managed By */}
                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <Users className="w-3 h-3 text-emerald-600" />
                            <span>1 Users</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredClients.length === 0 && (
              <div className="text-center py-16 text-slate-400 text-xs">
                No clients match your filter or search query.
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 2: CLIENT 360 WORKSPACE (SCREENSHOTS 1, 3, 4)
         ========================================================================= */}
      {viewMode === 'detail' && (
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Top Bar: Back to All Clients & Client Switcher */}
          <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between shadow-2xs">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setViewMode('table')}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition flex items-center gap-1 text-xs font-semibold"
                title="Back to All Clients Table"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">All Clients</span>
              </button>

              <span className="text-slate-300">|</span>

              {/* Client Avatar & Name Selector */}
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  {(selectedClient.displayName || selectedClient.businessName).charAt(0)}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center space-x-1 font-bold text-slate-900 text-sm cursor-pointer">
                    <span>{selectedClient.displayName || selectedClient.businessName}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono -mt-0.5">
                    {selectedClient.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Top Right Actions */}
            <div className="flex items-center space-x-2.5">
              {onOpenClientPortal && (
                <button
                  onClick={() => onOpenClientPortal(selectedClient.id)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Portal View</span>
                </button>
              )}

              <button
                onClick={() => {
                  setClientManagementEditId(selectedClient.id);
                  setIsClientModalOpen(true);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Client</span>
              </button>

              <button
                onClick={() => {
                  if (activeSubTab === 'client-requests') {
                    setIsNewRequestModalOpen(true);
                  } else {
                    setIsAddContactModalOpen(true);
                  }
                }}
                className="px-3.5 py-1.5 bg-[#1565c0] hover:bg-[#0d47a1] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>
          </div>

          {/* Two-Pane Body: Left Sub-Navigation + Right Content Pane */}
          <div className="flex-1 flex min-h-0 bg-[#f8fafc]">
            {/* Left Sub-Navigation (Matching Screenshots 1, 3, 4) */}
            <aside className="w-48 bg-white border-r border-slate-200/90 flex flex-col shrink-0 select-none py-3">
              {[
                { id: 'overview', label: 'Overview', icon: Layers },
                { id: 'profile', label: 'Profile', icon: Users },
                { id: 'tasks', label: 'Tasks', icon: CheckCircle2 },
                { id: 'insights', label: 'Insights', icon: TrendingUp },
                { id: 'client-requests', label: 'Client Requests', icon: FileText },
                { id: 'emails', label: 'Emails', icon: Mail },
                { id: 'discussions', label: 'Discussions', icon: MessageSquare },
                { id: 'documents', label: 'Documents', icon: FolderOpen },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeSubTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id as any)}
                    className={`px-4 py-2.5 mx-2 rounded-lg text-xs font-semibold flex items-center space-x-2.5 transition cursor-pointer ${
                      isActive
                        ? 'bg-[#1565c0] text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </aside>

            {/* Right Content Area */}
            <main className="flex-1 overflow-y-auto p-6 sm:p-8">

              {/* =================================================================
                  SUB-TAB: PROFILE (SCREENSHOT 1)
                 ================================================================= */}
              {activeSubTab === 'profile' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                  {/* COLUMN 1: CLIENT DETAILS */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-2xs">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                        Client Details
                      </h3>
                    </div>

                    {/* Associated Finance Apps */}
                    <div className="space-y-3">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        ASSOCIATED ACCOUNTING APPS
                      </span>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition text-xs">
                          <div className="flex items-center space-x-2 text-slate-700">
                            <FileSpreadsheet className="w-4 h-4 text-blue-500" />
                            <span className="font-semibold">Books</span>
                          </div>
                          <MoreHorizontal className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition text-xs">
                          <div className="flex items-center space-x-2 text-slate-700">
                            <FileText className="w-4 h-4 text-rose-500" />
                            <span className="font-semibold">Expense</span>
                          </div>
                          <MoreHorizontal className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition text-xs">
                          <div className="flex items-center space-x-2 text-slate-700">
                            <Layers className="w-4 h-4 text-amber-500" />
                            <span className="font-semibold">Inventory</span>
                          </div>
                          <MoreHorizontal className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                        </div>
                      </div>
                    </div>

                    {/* Billing Address */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>BILLING ADDRESS</span>
                      </span>
                      <div className="text-xs text-slate-600 leading-relaxed pl-4">
                        {selectedClient.address ? (
                          <div>{selectedClient.address}</div>
                        ) : (
                          <>
                            <div>{selectedClient.city || 'New York'}</div>
                            <div>{selectedClient.country || 'U.S.A.'}</div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Unbilled Tasks */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>UNBILLED TASKS</span>
                      </span>
                      <div className="flex items-center space-x-3 pt-1">
                        <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-base font-bold text-slate-900 leading-none">
                            {selectedClient.unbilledTasksCount ?? 0}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 font-mono">
                            Total hours logged - {selectedClient.totalHoursLogged ?? 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* COLUMN 2: CONTACT PERSONS & MANAGED BY */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-2xs">
                    {/* Contact Persons Header */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                        Contact Persons
                      </h3>
                    </div>

                    {/* Contact Persons List */}
                    <div className="space-y-3">
                      {(selectedClient.contactPersons || []).length > 0 ? (
                        selectedClient.contactPersons?.map(contact => (
                          <div
                            key={contact.id}
                            className="flex items-start space-x-3 p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100"
                          >
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0">
                              {contact.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-bold text-xs text-slate-800 truncate">
                                  {contact.name}
                                </span>
                                {contact.isPrimary && (
                                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono truncate">
                                {contact.email}
                              </div>
                              {contact.phone && (
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  {contact.countryCode} {contact.phone} {contact.phoneType && `(${contact.phoneType})`}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-slate-400 py-2">
                          No contact persons added yet.
                        </div>
                      )}

                      {/* + Contact Person Button (Screenshot 1) */}
                      <button
                        onClick={() => setIsAddContactModalOpen(true)}
                        className="w-full py-2 bg-blue-50/60 hover:bg-blue-100/70 text-blue-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Contact Person</span>
                      </button>
                    </div>

                    {/* Managed By Section */}
                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>MANAGED BY</span>
                      </span>

                      <div className="flex items-center space-x-3 p-2 rounded-xl bg-slate-50">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0">
                          {(selectedClient.managedBy?.[0]?.name || selectedClient.assignedStaffName || 'Dwaipayan Bose').charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">
                            {selectedClient.managedBy?.[0]?.name || selectedClient.assignedStaffName || 'Dwaipayan Bose'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Managing Practice Partner
                          </div>
                        </div>
                      </div>

                      {/* + Assign User Button */}
                      <button
                        onClick={() => setIsAssignUserModalOpen(true)}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Assign User</span>
                      </button>
                    </div>
                  </div>

                  {/* COLUMN 3: NOTES & ONBOARDING (SCREENSHOT 1) */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-2xs">
                    {/* Top Right "What's Next?" & Progress Bar */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="relative">
                        <button
                          onClick={() => setShowWhatsNextDropdown(!showWhatsNextDropdown)}
                          className="flex items-center space-x-1 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                          <span>"What's Next?"</span>
                          <ChevronDown className="w-3 h-3 text-blue-500" />
                        </button>

                        {/* What's next dropdown modal */}
                        {showWhatsNextDropdown && (
                          <div className="absolute left-0 top-6 z-20 w-64 p-3 bg-white border border-slate-200 rounded-xl shadow-xl text-xs space-y-2 animate-in fade-in">
                            <span className="font-bold text-slate-800 block text-[11px] uppercase">
                              Client Onboarding Checklist
                            </span>
                            <div className="space-y-1.5 text-slate-600">
                              <label className="flex items-center gap-1.5 text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Setup client profile & GSTIN</span>
                              </label>
                              <label className="flex items-center gap-1.5 text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Assign primary contact person</span>
                              </label>
                              <label className="flex items-center gap-1.5 text-[11px]">
                                <Clock className="w-3.5 h-3.5 text-amber-500" />
                                <span>Connect bank feeds or upload PDF</span>
                              </label>
                              <label className="flex items-center gap-1.5 text-[11px]">
                                <Clock className="w-3.5 h-3.5 text-amber-500" />
                                <span>Dispatch first monthly intake</span>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Progress Percent (Screenshot 1: 33% Completed) */}
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-bold text-emerald-600">
                          {selectedClient.onboardingProgressPercent ?? 33}% Completed
                        </span>
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            style={{ width: `${selectedClient.onboardingProgressPercent ?? 33}%` }}
                            className="bg-[#00c073] h-full rounded-full"
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Notes Section with Rich Text Formatting Toolbar (B, I, U) */}
                    <div className="space-y-2.5">
                      <span className="text-xs font-bold text-slate-800 block">Notes</span>

                      {/* Editor Box */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-blue-500">
                        {/* Toolbar */}
                        <div className="bg-slate-50 border-b border-slate-200 px-3 py-1.5 flex items-center space-x-3 text-slate-600">
                          <button
                            type="button"
                            onClick={() => setNoteIsBold(!noteIsBold)}
                            className={`p-1 rounded font-bold text-xs transition ${
                              noteIsBold ? 'bg-slate-200 text-slate-900' : 'hover:bg-slate-200'
                            }`}
                            title="Bold"
                          >
                            B
                          </button>
                          <button
                            type="button"
                            onClick={() => setNoteIsItalic(!noteIsItalic)}
                            className={`p-1 rounded italic text-xs transition ${
                              noteIsItalic ? 'bg-slate-200 text-slate-900' : 'hover:bg-slate-200'
                            }`}
                            title="Italic"
                          >
                            I
                          </button>
                          <button
                            type="button"
                            onClick={() => setNoteIsUnderline(!noteIsUnderline)}
                            className={`p-1 rounded underline text-xs transition ${
                              noteIsUnderline ? 'bg-slate-200 text-slate-900' : 'hover:bg-slate-200'
                            }`}
                            title="Underline"
                          >
                            U
                          </button>
                        </div>

                        {/* Textarea */}
                        <textarea
                          rows={3}
                          value={noteInputText}
                          onChange={e => setNoteInputText(e.target.value)}
                          placeholder="Add Note"
                          className={`w-full p-3 text-xs text-slate-800 bg-white border-0 focus:outline-none resize-none ${
                            noteIsBold ? 'font-bold' : ''
                          } ${noteIsItalic ? 'italic' : ''} ${noteIsUnderline ? 'underline' : ''}`}
                        />

                        {/* Save Note Button */}
                        <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex justify-end">
                          <button
                            onClick={handleSaveNote}
                            disabled={!noteInputText.trim()}
                            className="px-3 py-1 bg-[#1565c0] hover:bg-[#0d47a1] text-white rounded-lg text-xs font-semibold disabled:opacity-40 transition cursor-pointer"
                          >
                            Save Note
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* All Notes List */}
                    <div className="space-y-3 pt-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        ALL NOTES
                      </span>

                      {(selectedClient.notes || []).length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {selectedClient.notes?.map(note => (
                            <div
                              key={note.id}
                              className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1 relative group"
                            >
                              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                <span>{note.authorName}</span>
                                <span>{note.createdAt}</span>
                              </div>
                              <p
                                className={`text-slate-700 leading-relaxed ${
                                  note.isBold ? 'font-bold' : ''
                                } ${note.isItalic ? 'italic' : ''} ${
                                  note.isUnderline ? 'underline' : ''
                                }`}
                              >
                                {note.text}
                              </p>
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="absolute top-2 right-2 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition"
                                title="Delete note"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-slate-400 text-xs font-medium">
                          No Notes found
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* =================================================================
                  SUB-TAB: CLIENT REQUESTS (SCREENSHOT 3)
                 ================================================================= */}
              {activeSubTab === 'client-requests' && (
                <div className="space-y-5">
                  {/* Top Header & Filters (Screenshot 3) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-2">
                      <button className="flex items-center space-x-1.5 text-base font-bold text-slate-900 cursor-pointer">
                        <span>All Requests</span>
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>

                    <button
                      onClick={() => setIsNewRequestModalOpen(true)}
                      className="px-4 py-2 bg-[#1565c0] hover:bg-[#0d47a1] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition self-start sm:self-auto cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New</span>
                    </button>
                  </div>

                  {/* Filters Bar (Screenshot 3) */}
                  <div className="flex flex-wrap items-center gap-3 text-xs bg-white p-3 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                      FILTERS:
                    </span>

                    {/* Filter: Select an App */}
                    <select
                      value={requestFilterApp}
                      onChange={e => setRequestFilterApp(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                    >
                      <option value="all">Select an App</option>
                      <option value="Books">Books</option>
                      <option value="GST">GST Compliance</option>
                      <option value="Expense">Expense</option>
                      <option value="Inventory">Inventory</option>
                    </select>

                    {/* Filter: Select Status */}
                    <select
                      value={requestFilterStatus}
                      onChange={e => setRequestFilterStatus(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                    >
                      <option value="all">Select Status</option>
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Needs Review">Needs Review</option>
                      <option value="Completed">Completed</option>
                    </select>

                    {/* Filter: Select Priority */}
                    <select
                      value={requestFilterPriority}
                      onChange={e => setRequestFilterPriority(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                    >
                      <option value="all">Select Priority</option>
                      <option value="Very Low">Very Low</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>

                    {/* Filter: Select user */}
                    <select
                      value={requestFilterUser}
                      onChange={e => setRequestFilterUser(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                    >
                      <option value="all">Select user</option>
                      <option value="Dwaipayan Bose">Dwaipayan Bose</option>
                      <option value="CA Suraj Dutta">CA Suraj Dutta</option>
                      <option value="Pooja Verma">Pooja Verma</option>
                    </select>
                  </div>

                  {/* Requests Table (Screenshot 3) */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#f8fafc] text-slate-500 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-3.5 px-4">CLIENT REQUEST#</th>
                          <th className="py-3.5 px-4">TITLE</th>
                          <th className="py-3.5 px-4">ASSIGNED TO</th>
                          <th className="py-3.5 px-4">STATUS</th>
                          <th className="py-3.5 px-4">PRIORITY</th>
                          <th className="py-3.5 px-4">CLIENT</th>
                          <th className="py-3.5 px-4">ASSOCIATED APP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {clientRequestsList.map(req => (
                          <tr key={req.id} className="hover:bg-slate-50 transition">
                            <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                              {req.requestNumber}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-800">
                              {req.title}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600">
                              {req.assignedTo}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="flex items-center gap-1.5 font-semibold text-amber-600">
                                <span className="w-1 h-3.5 bg-amber-500 rounded-full"></span>
                                <span>{req.status}</span>
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-600">
                              {req.priority}
                            </td>
                            <td className="py-3.5 px-4 text-slate-700 font-medium">
                              {req.clientName}
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 flex items-center gap-1.5">
                              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" />
                              <span>{req.associatedApp}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {clientRequestsList.length === 0 && (
                      <div className="text-center py-12 text-slate-400 text-xs">
                        No requests found for current filter.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* =================================================================
                  SUB-TAB: INSIGHTS (SCREENSHOT 4)
                 ================================================================= */}
              {activeSubTab === 'insights' && (
                <div className="space-y-6">
                  {/* Top 3 KPI Cards (Screenshot 4) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Card 1: Aged Receivables */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Aged Receivables</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block">
                          Invoices aged over 45 days
                        </span>
                        <div className="text-2xl font-black text-slate-900 mt-1">
                          ₹{(selectedClient.insightsData?.agedReceivablesOver45Days ?? 0).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Aged Payables */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-rose-600" />
                          <span>Aged Payables</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block">
                          Bills aged over 45 days
                        </span>
                        <div className="text-2xl font-black text-slate-900 mt-1">
                          $0.00
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Cash Flow Analysis */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-blue-600" />
                          <span>Cash Flow Analysis</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div className="bg-blue-600 h-full w-2/3 rounded-full"></div>
                        </div>
                        <span className="text-xs font-bold text-emerald-600">Positive</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Section & Right Column (Screenshot 4) */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left 2 Columns: Clean Up, Bank Transactions, Expense Summary */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Clean Up Container */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-2xs">
                        <div className="border-b border-slate-100 pb-3">
                          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-blue-600" />
                            <span>Clean Up</span>
                          </h3>
                        </div>

                        {/* Pending Reviews */}
                        <div className="p-4 bg-slate-50 rounded-xl space-y-1">
                          <div className="flex items-center gap-2 text-xs font-bold text-amber-700">
                            <Clock className="w-4 h-4 text-amber-500" />
                            <span>Pending Reviews</span>
                          </div>
                          <p className="text-xs text-slate-500">
                            You don't have any pending reviews.
                          </p>
                        </div>

                        {/* Bank Transactions */}
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                            <Building2 className="w-4 h-4 text-teal-600" />
                            <span>Bank Transactions</span>
                          </div>

                          {/* Sub-tabs */}
                          <div className="flex space-x-6 border-b border-slate-200 text-xs font-semibold">
                            {[
                              { id: 'disconnected', label: 'Disconnected Bank Feeds' },
                              { id: 'uncategorized', label: 'Uncategorized' },
                              { id: 'unreconciled', label: 'Unreconciled' },
                              { id: 'duplicate', label: 'Duplicate' },
                            ].map(tab => (
                              <button
                                key={tab.id}
                                onClick={() => setBankSubTab(tab.id as any)}
                                className={`pb-2.5 transition border-b-2 ${
                                  bankSubTab === tab.id
                                    ? 'border-blue-600 text-blue-700 font-bold'
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                                }`}
                              >
                                {tab.label}
                              </button>
                            ))}
                          </div>

                          {/* Empty Table */}
                          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-slate-100">
                            No results found
                          </div>
                        </div>

                        {/* Expense Summary */}
                        <div className="space-y-3 pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                            <FileText className="w-4 h-4 text-rose-600" />
                            <span>Expense Summary</span>
                          </div>

                          <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                            <div className="text-xs font-bold text-slate-700">Corporate Cards</div>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="text-[11px] text-slate-400 block">Spend Summary</span>
                                <span className="text-xs text-slate-500">This Month: $0.00</span>
                              </div>
                              <div>
                                <span className="text-[11px] text-slate-400 block">Pending Expenses</span>
                                <span className="text-xs text-slate-500">Unapproved: 0 • Unsubmitted: 0</span>
                              </div>
                            </div>
                            <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-lg border border-slate-200 mt-2">
                              No results found
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Insights Widgets (Screenshot 4) */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-2xs">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <span>Insights</span>
                        </h3>
                      </div>

                      <div className="space-y-4 text-xs">
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between">
                          <div>
                            <span className="font-bold text-slate-800 block">Average Debtor Age</span>
                            <span className="text-slate-500 text-[11px]">28 Days on invoices</span>
                          </div>
                          <HelpCircle className="w-4 h-4 text-slate-400" />
                        </div>

                        <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start justify-between">
                          <div>
                            <span className="font-bold text-amber-900 block">General Ledger</span>
                            <span className="text-amber-700 text-[11px]">1 Discrepancy flagged by audit bot</span>
                          </div>
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        </div>

                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between">
                          <div>
                            <span className="font-bold text-slate-800 block">Relative Size Factor</span>
                            <span className="text-slate-500 text-[11px]">1.4x standard sample size</span>
                          </div>
                          <HelpCircle className="w-4 h-4 text-slate-400" />
                        </div>

                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between">
                          <div>
                            <span className="font-bold text-slate-800 block">Top Expenses</span>
                            <span className="text-slate-500 text-[11px]">Lease & Subscriptions</span>
                          </div>
                          <HelpCircle className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* OTHER SUB-TABS: OVERVIEW, TASKS, EMAILS, DISCUSSIONS, DOCUMENTS */}
              {activeSubTab === 'overview' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 text-xs">
                  <h3 className="font-bold text-sm text-slate-900">Client Overview & Health Scorecard</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block">GSTIN Registration</span>
                      <strong className="text-sm text-slate-900 font-mono mt-1 block">{selectedClient.gstin}</strong>
                      <span className="text-[10px] text-emerald-700 font-bold">Active & Verified</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block">Filing Cadence</span>
                      <strong className="text-sm text-slate-900 mt-1 block">Monthly (GSTR-1 & 3B)</strong>
                      <span className="text-[10px] text-blue-700 font-bold">QRMP / Regular</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block">Compliance Status</span>
                      <strong className="text-sm text-emerald-600 mt-1 block">100% Up to Date</strong>
                      <span className="text-[10px] text-slate-500">Zero default notices</span>
                    </div>
                  </div>
                </div>
              )}

              {activeSubTab === 'tasks' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 text-xs">
                  <h3 className="font-bold text-sm text-slate-900">Assigned Practice Tasks for {selectedClient.businessName}</h3>
                  <p className="text-slate-500">Automated intake, reconciliation, and statutory audit tasks.</p>
                  <div className="divide-y divide-slate-100 pt-2">
                    <div className="py-3 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800">Monthly Document Collection & 2B Recon</span>
                        <p className="text-slate-400 text-[11px]">Due on 11th of every month</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">In Progress</span>
                    </div>
                    <div className="py-3 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800">GSTR-3B Tax Liability Verification</span>
                        <p className="text-slate-400 text-[11px]">Due on 20th of every month</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">Scheduled</span>
                    </div>
                  </div>
                </div>
              )}

              {activeSubTab === 'emails' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 text-xs">
                  <h3 className="font-bold text-sm text-slate-900">Email & Dispatch Logs</h3>
                  <p className="text-slate-500">Automated email receipts, WhatsApp messages, and notifications.</p>
                  <div className="p-8 text-center text-slate-400">
                    No outbound emails sent in the last 7 days.
                  </div>
                </div>
              )}

              {activeSubTab === 'discussions' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 text-xs">
                  <h3 className="font-bold text-sm text-slate-900">Internal CA Firm Discussions & Audit Trails</h3>
                  <p className="text-slate-500">Collaborate privately on client tax queries and return positions.</p>
                  <div className="p-8 text-center text-slate-400">
                    No active internal discussion threads.
                  </div>
                </div>
              )}

              {activeSubTab === 'documents' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 text-xs">
                  <h3 className="font-bold text-sm text-slate-900">Attached Documents & KYC Vault</h3>
                  <p className="text-slate-500">Statutory incorporation certificates, PAN, MOA/AOA, and GST registrations.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {(selectedClient.attachedDocuments || []).map(doc => (
                      <div key={doc.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                          <div>
                            <span className="font-bold text-slate-800 block truncate max-w-xs">{doc.docName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{doc.fileName} • {doc.fileSize}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Verified
                        </span>
                      </div>
                    ))}
                    {(selectedClient.attachedDocuments || []).length === 0 && (
                      <div className="col-span-2 text-center py-8 text-slate-400">
                        No attached documents in vault.
                      </div>
                    )}
                  </div>
                </div>
              )}

            </main>
          </div>
        </div>
      )}

      {/* =========================================================================
          SCREENSHOT 2: ADD CONTACT PERSON MODAL
         ========================================================================= */}
      {isAddContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            {/* Modal Header (Screenshot 2) */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Add Contact Person
              </h3>
              <button
                onClick={() => setIsAddContactModalOpen(false)}
                className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form (Screenshot 2 exact fields) */}
            <form onSubmit={handleSaveContactPerson} className="space-y-4 text-xs">
              {/* Name */}
              <div className="grid grid-cols-3 items-center gap-3">
                <label className="text-slate-600 font-semibold">Name</label>
                <input
                  type="text"
                  required
                  value={contactForm.name}
                  onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                  placeholder="e.g. Charles Stone"
                  className="col-span-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Email Address */}
              <div className="grid grid-cols-3 items-center gap-3">
                <label className="text-slate-600 font-semibold">Email Address</label>
                <input
                  type="email"
                  required
                  value={contactForm.email}
                  onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder="charles.stone@zylker.com"
                  className="col-span-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Phone (with country code & type dropdowns) */}
              <div className="grid grid-cols-3 items-start gap-3 pt-1">
                <label className="text-slate-600 font-semibold pt-2">Phone</label>
                <div className="col-span-2 space-y-2">
                  <div className="flex items-center space-x-2">
                    <select
                      value={contactForm.countryCode}
                      onChange={e => setContactForm({ ...contactForm, countryCode: e.target.value })}
                      className="px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono text-xs w-20 shrink-0"
                    >
                      <option value="+1">+1 (US)</option>
                      <option value="+91">+91 (IN)</option>
                      <option value="+44">+44 (UK)</option>
                      <option value="+971">+971 (AE)</option>
                    </select>
                    <input
                      type="text"
                      value={contactForm.phone}
                      onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                      placeholder="9999999999"
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <select
                      value={contactForm.phoneType}
                      onChange={e => setContactForm({ ...contactForm, phoneType: e.target.value as any })}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-xs w-28"
                    >
                      <option value="Mobile">Mobile</option>
                      <option value="Work">Work</option>
                      <option value="Personal">Personal</option>
                    </select>
                    <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer text-[11px] ml-2">
                      <input
                        type="checkbox"
                        checked={contactForm.isPrimary}
                        onChange={e => setContactForm({ ...contactForm, isPrimary: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600"
                      />
                      <span>Primary Contact</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Skype Name / Number */}
              <div className="grid grid-cols-3 items-center gap-3">
                <label className="text-slate-600 font-semibold">Skype Name/Number</label>
                <div className="col-span-2 relative">
                  <input
                    type="text"
                    value={contactForm.skypeNumber}
                    onChange={e => setContactForm({ ...contactForm, skypeNumber: e.target.value })}
                    placeholder="Skype Name/Number"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Other Details: Designation & Department */}
              <div className="grid grid-cols-3 items-center gap-3">
                <label className="text-slate-600 font-semibold">Other Details</label>
                <div className="col-span-2 grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={contactForm.designation}
                    onChange={e => setContactForm({ ...contactForm, designation: e.target.value })}
                    placeholder="Designation"
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={contactForm.department}
                    onChange={e => setContactForm({ ...contactForm, department: e.target.value })}
                    placeholder="Department"
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Modal Buttons (Screenshot 2: Save, Cancel) */}
              <div className="flex items-center space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1565c0] hover:bg-[#0d47a1] text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddContactModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN USER MODAL */}
      {isAssignUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">Assign Practice User</h3>
              <button onClick={() => setIsAssignUserModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              {['Dwaipayan Bose', 'CA Suraj Dutta (Partner)', 'Pooja Verma (Senior Associate)', 'Shekhar Das (Associate)'].map(u => (
                <div
                  key={u}
                  onClick={() => handleAssignUser(u)}
                  className="p-2.5 rounded-lg hover:bg-blue-50/70 border border-slate-100 hover:border-blue-200 flex items-center justify-between cursor-pointer transition"
                >
                  <span className="font-semibold text-slate-800">{u}</span>
                  <Check className="w-3.5 h-3.5 text-blue-600 opacity-0 hover:opacity-100" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* NEW REQUEST MODAL (SCREENSHOT 3) */}
      {isNewRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">New Client Request</h3>
              <button onClick={() => setIsNewRequestModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClientRequest} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Request Title</label>
                <input
                  type="text"
                  required
                  value={newRequestForm.title}
                  onChange={e => setNewRequestForm({ ...newRequestForm, title: e.target.value })}
                  placeholder="e.g. September Bank Statements & Credit Notes"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Associated App</label>
                  <select
                    value={newRequestForm.associatedApp}
                    onChange={e => setNewRequestForm({ ...newRequestForm, associatedApp: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="Books">Books</option>
                    <option value="GST">GST</option>
                    <option value="Expense">Expense</option>
                    <option value="Inventory">Inventory</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={newRequestForm.priority}
                    onChange={e => setNewRequestForm({ ...newRequestForm, priority: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="Very Low">Very Low</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Assign To</label>
                <select
                  value={newRequestForm.assignedTo}
                  onChange={e => setNewRequestForm({ ...newRequestForm, assignedTo: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="Dwaipayan Bose">Dwaipayan Bose</option>
                  <option value="CA Suraj Dutta">CA Suraj Dutta</option>
                  <option value="Pooja Verma">Pooja Verma</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewRequestModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1565c0] hover:bg-[#0d47a1] text-white rounded-lg font-bold shadow-xs"
                >
                  Create Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLIENT MANAGEMENT MODAL (Add / Edit Client) */}
      {isClientModalOpen && (
        <ClientManagementModal
          isOpen={isClientModalOpen}
          initialEditClientId={clientManagementEditId}
          editClientId={clientManagementEditId}
          onClose={() => setIsClientModalOpen(false)}
          onClientAddedOrUpdated={() => {
            setIsClientModalOpen(false);
            const saved = localStorage.getItem('ps_clients_kyc_data');
            if (saved) {
              try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) setClients(parsed);
              } catch {}
            }
            if (onRefreshParent) onRefreshParent();
            setFeedbackToast({
              type: 'success',
              message: 'Client master record updated successfully.',
            });
          }}
          onSuccess={() => {
            setIsClientModalOpen(false);
            const saved = localStorage.getItem('ps_clients_kyc_data');
            if (saved) {
              try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) setClients(parsed);
              } catch {}
            }
            if (onRefreshParent) onRefreshParent();
            setFeedbackToast({
              type: 'success',
              message: 'Client master record updated successfully.',
            });
          }}
        />
      )}
    </div>
  );
};
