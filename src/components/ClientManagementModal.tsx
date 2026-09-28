// src/components/ClientManagementModal.tsx
import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Users,
  Settings2,
  Check,
  RefreshCw,
  Search,
  Edit2,
  Phone,
  Mail,
  Building,
  Shield,
  UserCheck,
} from 'lucide-react';

interface ClientManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientAddedOrUpdated: () => void;
  selectedClientIds?: string[];
  initialEditClientId?: string | null;
  onClearEditClientId?: () => void;
}

export const ClientManagementModal: React.FC<ClientManagementModalProps> = ({
  isOpen,
  onClose,
  onClientAddedOrUpdated,
  selectedClientIds = [],
  initialEditClientId = null,
  onClearEditClientId,
}) => {
  const [activeTab, setActiveTab] = useState<'directory' | 'single' | 'staff_users' | 'bulk' | 'batch'>(
    initialEditClientId ? 'single' : selectedClientIds.length > 0 ? 'batch' : 'directory'
  );

  // Loaded clients and users lists
  const [clientList, setClientList] = useState<any[]>([]);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingClientId, setEditingClientId] = useState<string | null>(initialEditClientId);

  // Single Client Form State
  const [singleForm, setSingleForm] = useState({
    id: '',
    businessName: '',
    contactPerson: '',
    gstin: '',
    registeredPhone: '+91',
    email: '',
    assignedStaffId: 'staff_pooja_02',
    assignedStaffName: 'Pooja Verma (Senior Associate)',
    reminderCadenceDays: 3,
    maxReminders: 3,
    whatsappConsent: true,
    active: true,
  });

  // Editing Staff User State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({
    displayName: '',
    email: '',
    phone: '',
    role: 'staff',
    active: true,
  });

  // Bulk CSV State
  const [bulkText, setBulkText] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);

  // Batch Update State
  const [batchUpdates, setBatchUpdates] = useState({
    remindersPaused: false,
    applyPauseReminders: false,
    reminderCadenceDays: 3,
    applyCadence: false,
    maxReminders: 3,
    applyMaxReminders: false,
    whatsappConsent: true,
    applyWhatsappConsent: false,
    assignedStaffId: 'staff_pooja_02',
    assignedStaffName: 'Pooja Verma (Senior Associate)',
    applyStaff: false,
  });

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch clients and staff users when modal opens
  const fetchDirectories = async () => {
    try {
      const [resClients, resUsers] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/users'),
      ]);
      if (resClients.ok) {
        const data = await resClients.json();
        setClientList(data);
      }
      if (resUsers.ok) {
        const udata = await resUsers.json();
        setStaffUsers(udata);
      }
    } catch (e) {
      console.warn('Failed to load clients/users directory:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDirectories();
    }
  }, [isOpen]);

  // Handle setting initial edit client
  useEffect(() => {
    if (initialEditClientId && clientList.length > 0) {
      const target = clientList.find(c => c.id === initialEditClientId);
      if (target) {
        loadClientIntoForm(target);
      }
    }
  }, [initialEditClientId, clientList]);

  if (!isOpen) return null;

  const loadClientIntoForm = (client: any) => {
    setEditingClientId(client.id);
    setSingleForm({
      id: client.id,
      businessName: client.businessName || '',
      contactPerson: client.contactPerson || '',
      gstin: client.gstin || '',
      registeredPhone: client.registeredPhone || '+91',
      email: client.email || '',
      assignedStaffId: client.assignedStaffId || 'staff_pooja_02',
      assignedStaffName: client.assignedStaffName || 'Pooja Verma (Senior Associate)',
      reminderCadenceDays: client.reminderCadenceDays || 3,
      maxReminders: client.maxReminders || 3,
      whatsappConsent: client.whatsappConsent !== undefined ? Boolean(client.whatsappConsent) : true,
      active: client.active !== undefined ? Boolean(client.active) : true,
    });
    setActiveTab('single');
    setStatusMessage(null);
  };

  const resetSingleForm = () => {
    setEditingClientId(null);
    if (onClearEditClientId) onClearEditClientId();
    setSingleForm({
      id: '',
      businessName: '',
      contactPerson: '',
      gstin: '',
      registeredPhone: '+91',
      email: '',
      assignedStaffId: 'staff_pooja_02',
      assignedStaffName: 'Pooja Verma (Senior Associate)',
      reminderCadenceDays: 3,
      maxReminders: 3,
      whatsappConsent: true,
      active: true,
    });
    setStatusMessage(null);
  };

  // Single Client Submit (Add or Edit)
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    try {
      const isEditing = Boolean(editingClientId);
      const url = isEditing ? `/api/clients/${editingClientId}` : '/api/clients';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(singleForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save client');
      }

      setStatusMessage({
        type: 'success',
        text: `Client "${data.businessName}" ${isEditing ? 'updated' : 'registered'} successfully!`,
      });

      await fetchDirectories();
      onClientAddedOrUpdated();

      if (!isEditing) {
        resetSingleForm();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Staff User Edit Submit
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/users/${editingUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user');

      setStatusMessage({
        type: 'success',
        text: `Staff User "${data.displayName}" updated successfully!`,
      });
      setEditingUserId(null);
      await fetchDirectories();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Parse CSV text into objects
  const handleParseCsv = () => {
    setStatusMessage(null);
    if (!bulkText.trim()) return;

    const lines = bulkText.trim().split('\n');
    const rows: any[] = [];
    const startIndex = lines[0].toLowerCase().includes('business') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length < 5) continue;

      const [businessName, contactPerson, gstin, registeredPhone, email, cadence, maxRem] = parts;
      const isValidGstin = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(gstin || '');

      rows.push({
        businessName,
        contactPerson,
        gstin: (gstin || '').toUpperCase(),
        registeredPhone: registeredPhone?.startsWith('+') ? registeredPhone : `+91${registeredPhone}`,
        email,
        reminderCadenceDays: Number(cadence) || 3,
        maxReminders: Number(maxRem) || 3,
        whatsappConsent: true,
        isValidGstin,
      });
    }

    setParsedRows(rows);
    if (rows.length === 0) {
      setStatusMessage({ type: 'error', text: 'No valid rows detected. Ensure columns are comma-separated.' });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      setBulkText(content);
    };
    reader.readAsText(file);
  };

  const handleBulkSubmit = async () => {
    if (parsedRows.length === 0) return;
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/clients/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientList: parsedRows }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk import failed');

      setStatusMessage({
        type: 'success',
        text: `Bulk Import Completed! Processed ${data.totalProcessed} records: ${data.successCount} saved, ${data.errorCount} skipped.`,
      });
      await fetchDirectories();
      onClientAddedOrUpdated();
      setParsedRows([]);
      setBulkText('');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleBatchSubmit = async () => {
    if (selectedClientIds.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please select at least one client to apply batch updates.' });
      return;
    }

    const updates: Record<string, any> = {};
    if (batchUpdates.applyPauseReminders) updates.remindersPaused = batchUpdates.remindersPaused;
    if (batchUpdates.applyCadence) updates.reminderCadenceDays = Number(batchUpdates.reminderCadenceDays);
    if (batchUpdates.applyMaxReminders) updates.maxReminders = Number(batchUpdates.maxReminders);
    if (batchUpdates.applyWhatsappConsent) updates.whatsappConsent = batchUpdates.whatsappConsent;
    if (batchUpdates.applyStaff) {
      updates.assignedStaffId = batchUpdates.assignedStaffId;
      updates.assignedStaffName = batchUpdates.assignedStaffName;
    }

    if (Object.keys(updates).length === 0) {
      setStatusMessage({ type: 'error', text: 'Check at least one field to update.' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/clients/batch-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientIds: selectedClientIds, updates }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Batch update failed');

      setStatusMessage({
        type: 'success',
        text: `Batch updated applied to ${data.updatedCount} clients successfully!`,
      });
      await fetchDirectories();
      onClientAddedOrUpdated();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const downloadSampleCsv = () => {
    const header = 'Business Name,Contact Person,GSTIN,Registered Phone,Email,Reminder Cadence (Days),Max Reminders\n';
    const sample = 'Acme Logistics Ltd,Rohan Joshi,27ABCDE1234F1Z5,+919876543210,rohan@acmelogistics.in,3,3\nShreeji Enterprises,Bhavesh Shah,24AAAAA0000A1Z5,+919812345678,accounts@shreejient.in,4,3\n';
    const blob = new Blob([header + sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_clients_import.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered clients for directory
  const filteredClients = clientList.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      (c.businessName || '').toLowerCase().includes(q) ||
      (c.contactPerson || '').toLowerCase().includes(q) ||
      (c.gstin || '').toLowerCase().includes(q) ||
      (c.registeredPhone || '').includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-800">Client & User Directory Management</h2>
              <p className="text-xs text-slate-500">Edit existing clients, register new companies, and manage staff</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-white gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('directory')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition whitespace-nowrap ${
              activeTab === 'directory'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Clients Directory ({clientList.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('single');
            }}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition whitespace-nowrap ${
              activeTab === 'single'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {editingClientId ? <Edit2 className="w-4 h-4 text-amber-600" /> : <UserPlus className="w-4 h-4" />}
            <span>{editingClientId ? 'Edit Client Details' : '+ Add New Client'}</span>
          </button>

          <button
            onClick={() => setActiveTab('staff_users')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition whitespace-nowrap ${
              activeTab === 'staff_users'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>CA Staff Users ({staffUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('bulk')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition whitespace-nowrap ${
              activeTab === 'bulk'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Bulk CSV Import</span>
          </button>

          <button
            onClick={() => setActiveTab('batch')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition whitespace-nowrap ${
              activeTab === 'batch'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings2 className="w-4 h-4" />
            <span>Batch Update ({selectedClientIds.length})</span>
          </button>
        </div>

        {/* Status Alerts */}
        {statusMessage && (
          <div
            className={`mx-6 mt-4 p-3 rounded-lg text-xs flex items-center space-x-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: CLIENTS DIRECTORY (LIST & EDIT ACCESS) */}
          {activeTab === 'directory' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by company name, GSTIN, phone, or contact person..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-slate-50"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetSingleForm();
                    setActiveTab('single');
                  }}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center justify-center space-x-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register New Client</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="min-w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-3">Company & Contact</th>
                      <th className="p-3">GSTIN</th>
                      <th className="p-3">WhatsApp / Phone</th>
                      <th className="p-3">Assigned Staff</th>
                      <th className="p-3">Cadence</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredClients.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400">
                          No clients found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredClients.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3">
                            <div className="font-bold text-slate-800">{c.businessName}</div>
                            <div className="text-slate-500 text-[11px]">{c.contactPerson} • {c.email}</div>
                          </td>
                          <td className="p-3 font-mono font-semibold text-slate-700">{c.gstin}</td>
                          <td className="p-3 text-emerald-700 font-mono font-medium">{c.registeredPhone}</td>
                          <td className="p-3 text-slate-600">{c.assignedStaffName || 'Pooja Verma'}</td>
                          <td className="p-3 text-slate-500">{c.reminderCadenceDays}d (max {c.maxReminders})</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                c.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {c.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => loadClientIntoForm(c)}
                              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg border border-blue-200 transition inline-flex items-center space-x-1"
                              title="Edit this client's profile, phone number, and settings"
                            >
                              <Edit2 className="w-3 h-3 text-blue-600" />
                              <span>Edit</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: ADD OR EDIT CLIENT FORM */}
          {activeTab === 'single' && (
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              {editingClientId ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-900">
                  <div className="flex items-center space-x-2">
                    <Edit2 className="w-4 h-4 text-amber-600" />
                    <span>
                      Currently editing: <strong>{singleForm.businessName || 'Client'}</strong> ({singleForm.gstin})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={resetSingleForm}
                    className="text-blue-600 hover:text-blue-800 font-semibold underline text-[11px]"
                  >
                    Switch to Add New Client
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-900 flex items-center space-x-2">
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  <span>Register a new client company. A statutory upload link will automatically be prepared.</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Business / Company Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Engineering Works"
                    value={singleForm.businessName}
                    onChange={e => setSingleForm({ ...singleForm, businessName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Person Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Patil"
                    value={singleForm.contactPerson}
                    onChange={e => setSingleForm({ ...singleForm, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client GSTIN (15 Digits) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={15}
                    placeholder="27AAACA1234A1Z5"
                    value={singleForm.gstin}
                    onChange={e => setSingleForm({ ...singleForm, gstin: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    WhatsApp Registered Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+919820123456"
                    value={singleForm.registeredPhone}
                    onChange={e => setSingleForm({ ...singleForm, registeredPhone: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400">Used for WhatsApp monthly intake and reminders</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Accounts Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="accounts@company.com"
                    value={singleForm.email}
                    onChange={e => setSingleForm({ ...singleForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned CA Staff Member</label>
                  <select
                    value={singleForm.assignedStaffId}
                    onChange={e => {
                      const staffId = e.target.value;
                      const staff = staffUsers.find(u => u.id === staffId);
                      setSingleForm({
                        ...singleForm,
                        assignedStaffId: staffId,
                        assignedStaffName: staff?.displayName || (staffId === 'staff_pooja_02' ? 'Pooja Verma (Senior Associate)' : 'Amit Patel (GST Assistant)'),
                      });
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  >
                    {staffUsers.length > 0 ? (
                      staffUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.displayName} ({u.role})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="staff_pooja_02">Pooja Verma (Senior Associate)</option>
                        <option value="staff_amit_03">Amit Patel (GST Assistant)</option>
                        <option value="ca_rajesh_01">CA Rajesh Sharma (FCA)</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reminder Cadence (Every N Days)</label>
                  <input
                    type="number"
                    min={1}
                    max={14}
                    value={singleForm.reminderCadenceDays}
                    onChange={e => setSingleForm({ ...singleForm, reminderCadenceDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Reminders per Month</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={singleForm.maxReminders}
                    onChange={e => setSingleForm({ ...singleForm, maxReminders: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center space-x-2 cursor-pointer text-xs text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={singleForm.whatsappConsent}
                    onChange={e => setSingleForm({ ...singleForm, whatsappConsent: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <span>Client consented to WhatsApp compliance messaging</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer text-xs text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={singleForm.active}
                    onChange={e => setSingleForm({ ...singleForm, active: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500"
                  />
                  <span>Active Client (included in scheduled monthly intake)</span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                {editingClientId && (
                  <button
                    type="button"
                    onClick={resetSingleForm}
                    className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-100 transition"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center space-x-2"
                >
                  {loading ? (
                    <span>Saving...</span>
                  ) : editingClientId ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Register Client</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: CA STAFF & TEAM USERS */}
          {activeTab === 'staff_users' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900">CA Staff & Team Users Register:</span> View and edit staff names, contact numbers, and system roles.
                </div>
              </div>

              {editingUserId && (
                <form onSubmit={handleUserSubmit} className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-blue-950 flex items-center gap-1.5">
                      <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Editing User: {userForm.displayName}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingUserId(null)}
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={userForm.displayName}
                        onChange={e => setUserForm({ ...userForm, displayName: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Phone</label>
                      <input
                        type="text"
                        value={userForm.phone}
                        onChange={e => setUserForm({ ...userForm, phone: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Role</label>
                      <select
                        value={userForm.role}
                        onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="ca_admin">CA Admin (Partner)</option>
                        <option value="staff">Staff Associate</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm"
                    >
                      Update Staff Member
                    </button>
                  </div>
                </form>
              )}

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="min-w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-3">Staff Member</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {staffUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-400">Loading users...</td>
                      </tr>
                    ) : (
                      staffUsers.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-bold text-slate-800">{u.displayName}</td>
                          <td className="p-3 text-slate-600">{u.email}</td>
                          <td className="p-3 font-mono text-slate-600">{u.phone || '—'}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              {u.role === 'ca_admin' ? 'CA Partner / Admin' : 'Senior Staff'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${u.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                              {u.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                setEditingUserId(u.id);
                                setUserForm({
                                  displayName: u.displayName || '',
                                  email: u.email || '',
                                  phone: u.phone || '',
                                  role: u.role || 'staff',
                                  active: u.active !== undefined ? Boolean(u.active) : true,
                                });
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 font-semibold inline-flex items-center space-x-1"
                            >
                              <Edit2 className="w-3 h-3 text-slate-500" />
                              <span>Edit</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: BULK CSV IMPORT */}
          {activeTab === 'bulk' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">CSV Structure:</span> Business Name, Contact Person, GSTIN, Phone, Email, Cadence, Max Reminders
                </div>
                <button
                  type="button"
                  onClick={downloadSampleCsv}
                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg shadow-2xs flex items-center space-x-1.5 transition shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Download Sample CSV</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Upload CSV File or Paste Data
                </label>
                <div className="flex items-center space-x-3 mb-2">
                  <label className="cursor-pointer px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 transition flex items-center space-x-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose File (.csv)</span>
                    <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <span className="text-[11px] text-slate-400">or paste comma-separated lines directly below:</span>
                </div>
                <textarea
                  rows={5}
                  placeholder={`Acme Logistics Ltd,Rohan Joshi,27ABCDE1234F1Z5,+919876543210,rohan@acmelogistics.in,3,3\nShreeji Enterprises,Bhavesh Shah,24AAAAA0000A1Z5,+919812345678,accounts@shreejient.in,4,3`}
                  value={bulkText}
                  onChange={e => setBulkText(e.target.value)}
                  className="w-full p-3 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleParseCsv}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition"
                >
                  Parse & Validate CSV
                </button>
                {parsedRows.length > 0 && (
                  <span className="text-xs text-emerald-700 font-semibold">
                    ✓ {parsedRows.length} valid row(s) ready to import
                  </span>
                )}
              </div>

              {parsedRows.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="min-w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="p-2.5">Business Name</th>
                        <th className="p-2.5">Contact Person</th>
                        <th className="p-2.5">GSTIN</th>
                        <th className="p-2.5">Phone</th>
                        <th className="p-2.5">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.slice(0, 5).map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-2.5 font-medium">{r.businessName}</td>
                          <td className="p-2.5">{r.contactPerson}</td>
                          <td className="p-2.5 font-mono">{r.gstin}</td>
                          <td className="p-2.5 font-mono">{r.registeredPhone}</td>
                          <td className="p-2.5">{r.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedRows.length > 5 && (
                    <div className="p-2 text-center text-xs text-slate-400 bg-slate-50 border-t border-slate-200">
                      ...and {parsedRows.length - 5} more records
                    </div>
                  )}
                  <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
                    <button
                      type="button"
                      onClick={handleBulkSubmit}
                      disabled={loading}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition"
                    >
                      {loading ? 'Importing...' : `Import ${parsedRows.length} Clients`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: BATCH UPDATE SELECTED CLIENTS */}
          {activeTab === 'batch' && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900 flex items-center justify-between">
                <span>
                  Targeting <strong>{selectedClientIds.length}</strong> selected client(s). Check the fields below to apply bulk updates across all of them at once.
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-3 border border-slate-200 rounded-xl space-y-2">
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={batchUpdates.applyPauseReminders}
                      onChange={e => setBatchUpdates({ ...batchUpdates, applyPauseReminders: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 border-slate-300"
                    />
                    <span>Pause or Resume Automated Reminders</span>
                  </label>
                  {batchUpdates.applyPauseReminders && (
                    <div className="pl-6 flex items-center space-x-4 text-xs">
                      <label className="flex items-center space-x-1 cursor-pointer">
                        <input
                          type="radio"
                          name="remindersPaused"
                          checked={batchUpdates.remindersPaused === true}
                          onChange={() => setBatchUpdates({ ...batchUpdates, remindersPaused: true })}
                        />
                        <span>Pause All Reminders</span>
                      </label>
                      <label className="flex items-center space-x-1 cursor-pointer">
                        <input
                          type="radio"
                          name="remindersPaused"
                          checked={batchUpdates.remindersPaused === false}
                          onChange={() => setBatchUpdates({ ...batchUpdates, remindersPaused: false })}
                        />
                        <span>Resume Reminders</span>
                      </label>
                    </div>
                  )}
                </div>

                <div className="p-3 border border-slate-200 rounded-xl space-y-2">
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={batchUpdates.applyStaff}
                      onChange={e => setBatchUpdates({ ...batchUpdates, applyStaff: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 border-slate-300"
                    />
                    <span>Reassign Staff Member</span>
                  </label>
                  {batchUpdates.applyStaff && (
                    <div className="pl-6">
                      <select
                        value={batchUpdates.assignedStaffId}
                        onChange={e => {
                          const staffId = e.target.value;
                          const staff = staffUsers.find(u => u.id === staffId);
                          setBatchUpdates({
                            ...batchUpdates,
                            assignedStaffId: staffId,
                            assignedStaffName: staff?.displayName || (staffId === 'staff_pooja_02' ? 'Pooja Verma (Senior Associate)' : 'Amit Patel (GST Assistant)'),
                          });
                        }}
                        className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      >
                        {staffUsers.length > 0 ? (
                          staffUsers.map(u => (
                            <option key={u.id} value={u.id}>{u.displayName} ({u.role})</option>
                          ))
                        ) : (
                          <>
                            <option value="staff_pooja_02">Pooja Verma (Senior Associate)</option>
                            <option value="staff_amit_03">Amit Patel (GST Assistant)</option>
                            <option value="ca_rajesh_01">CA Rajesh Sharma (FCA)</option>
                          </>
                        )}
                      </select>
                    </div>
                  )}
                </div>

                <div className="p-3 border border-slate-200 rounded-xl space-y-2">
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={batchUpdates.applyCadence}
                      onChange={e => setBatchUpdates({ ...batchUpdates, applyCadence: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 border-slate-300"
                    />
                    <span>Update Reminder Cadence (Days)</span>
                  </label>
                  {batchUpdates.applyCadence && (
                    <div className="pl-6">
                      <input
                        type="number"
                        min={1}
                        max={14}
                        value={batchUpdates.reminderCadenceDays}
                        onChange={e => setBatchUpdates({ ...batchUpdates, reminderCadenceDays: Number(e.target.value) })}
                        className="w-24 px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleBatchSubmit}
                  disabled={loading || selectedClientIds.length === 0}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition"
                >
                  {loading ? 'Applying Updates...' : `Apply Batch Updates to ${selectedClientIds.length} Clients`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
