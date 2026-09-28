// src/components/ClientManagementModal.tsx
import React, { useState } from 'react';
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
} from 'lucide-react';

interface ClientManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientAddedOrUpdated: () => void;
  selectedClientIds?: string[];
}

export const ClientManagementModal: React.FC<ClientManagementModalProps> = ({
  isOpen,
  onClose,
  onClientAddedOrUpdated,
  selectedClientIds = [],
}) => {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk' | 'batch'>(
    selectedClientIds.length > 0 ? 'batch' : 'single'
  );

  // Single Client Form State
  const [singleForm, setSingleForm] = useState({
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

  if (!isOpen) return null;

  // Single Client Submit
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(singleForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create client');
      }

      setStatusMessage({ type: 'success', text: `Client "${data.businessName}" created/updated successfully!` });
      onClientAddedOrUpdated();
      setSingleForm({
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
      });
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

    // Header check
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

  // Handle CSV file upload
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

  // Submit Bulk Clients
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
      onClientAddedOrUpdated();
      setParsedRows([]);
      setBulkText('');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Submit Batch Updates
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
      onClientAddedOrUpdated();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Download Sample CSV
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">Client Management</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-white gap-4">
          <button
            onClick={() => setActiveTab('single')}
            className={`py-3 px-2 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition ${
              activeTab === 'single'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Single Client</span>
          </button>

          <button
            onClick={() => setActiveTab('bulk')}
            className={`py-3 px-2 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition ${
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
            className={`py-3 px-2 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition ${
              activeTab === 'batch'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings2 className="w-4 h-4" />
            <span>Batch Update ({selectedClientIds.length} Selected)</span>
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
          {/* TAB 1: SINGLE CLIENT FORM */}
          {activeTab === 'single' && (
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Business Name <span className="text-rose-500">*</span>
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
                    placeholder="e.g. Suresh Mehta"
                    value={singleForm.contactPerson}
                    onChange={e => setSingleForm({ ...singleForm, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client GSTIN (15 Chars) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={15}
                    placeholder="e.g. 27AAACA1234A1Z5"
                    value={singleForm.gstin}
                    onChange={e => setSingleForm({ ...singleForm, gstin: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registered WhatsApp Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+919820112345"
                    value={singleForm.registeredPhone}
                    onChange={e => setSingleForm({ ...singleForm, registeredPhone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="accounts@apexengineering.in"
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
                      const name = e.target.options[e.target.selectedIndex].text;
                      setSingleForm({ ...singleForm, assignedStaffId: e.target.value, assignedStaffName: name });
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  >
                    <option value="staff_pooja_02">Pooja Verma (Senior Associate)</option>
                    <option value="staff_amit_03">Amit Patel (GST Assistant)</option>
                    <option value="ca_rajesh_01">CA Rajesh Sharma (FCA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reminder Cadence (Days)</label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={singleForm.reminderCadenceDays}
                    onChange={e => setSingleForm({ ...singleForm, reminderCadenceDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Maximum Reminders Allowed</label>
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

              <div className="pt-2 flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="whatsappConsent"
                  checked={singleForm.whatsappConsent}
                  onChange={e => setSingleForm({ ...singleForm, whatsappConsent: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 border-slate-300"
                />
                <label htmlFor="whatsappConsent" className="text-xs text-slate-700">
                  Client has opted-in and provided WhatsApp communication consent
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-1.5"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Client</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: BULK CSV IMPORT */}
          {activeTab === 'bulk' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <div>
                  <div className="text-xs font-bold text-blue-900">Upload or Paste Client CSV Data</div>
                  <div className="text-[11px] text-blue-700">
                    Format: Business Name, Contact Person, GSTIN, Phone, Email, Cadence (Days), Max Reminders
                  </div>
                </div>
                <button
                  type="button"
                  onClick={downloadSampleCsv}
                  className="px-3 py-1.5 bg-white border border-blue-300 hover:bg-blue-100 text-blue-800 text-xs font-semibold rounded-lg shadow-xs flex items-center space-x-1 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample CSV</span>
                </button>
              </div>

              {/* Upload Input */}
              <div className="flex items-center space-x-3">
                <label className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 cursor-pointer flex items-center space-x-1.5 transition">
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>Select CSV File</span>
                  <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
                </label>
                <span className="text-xs text-slate-500">or paste CSV text directly below:</span>
              </div>

              <textarea
                rows={5}
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                placeholder="Acme Logistics Ltd, Rohan Joshi, 27ABCDE1234F1Z5, +919876543210, rohan@acme.in, 3, 3"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleParseCsv}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Parse & Preview ({parsedRows.length} Rows Ready)
                </button>

                {parsedRows.length > 0 && (
                  <button
                    type="button"
                    onClick={handleBulkSubmit}
                    disabled={loading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1.5 transition"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Import {parsedRows.length} Clients to Database</span>
                  </button>
                )}
              </div>

              {/* Parsed Preview Table */}
              {parsedRows.length > 0 && (
                <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="p-2">Business Name</th>
                        <th className="p-2">GSTIN</th>
                        <th className="p-2">Contact</th>
                        <th className="p-2">Phone</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-2 font-medium text-slate-800">{r.businessName}</td>
                          <td className="p-2 font-mono text-slate-700">{r.gstin}</td>
                          <td className="p-2 text-slate-600">{r.contactPerson}</td>
                          <td className="p-2 text-slate-600">{r.registeredPhone}</td>
                          <td className="p-2 text-slate-600">{r.email}</td>
                          <td className="p-2">
                            {r.isValidGstin ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-700 font-semibold">
                                Valid GSTIN
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-700 font-semibold">
                                Invalid GSTIN
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BATCH UPDATE EXISTING CLIENTS */}
          {activeTab === 'batch' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                You have selected <strong>{selectedClientIds.length} client(s)</strong> from the dashboard table.
                Check any property below to update it across all selected clients simultaneously.
              </div>

              <div className="space-y-3">
                {/* 1. Pause Reminders */}
                <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                  <input
                    type="checkbox"
                    id="applyPause"
                    checked={batchUpdates.applyPauseReminders}
                    onChange={e => setBatchUpdates({ ...batchUpdates, applyPauseReminders: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <div className="flex-1">
                    <label htmlFor="applyPause" className="text-xs font-semibold text-slate-800">
                      Update Reminder Pause State
                    </label>
                    <div className="text-[11px] text-slate-500">Enable or disable reminders across selected clients</div>
                  </div>
                  <select
                    disabled={!batchUpdates.applyPauseReminders}
                    value={batchUpdates.remindersPaused ? 'paused' : 'active'}
                    onChange={e => setBatchUpdates({ ...batchUpdates, remindersPaused: e.target.value === 'paused' })}
                    className="px-2 py-1 text-xs border border-slate-300 rounded-md bg-white disabled:opacity-50"
                  >
                    <option value="active">Active (Send Reminders)</option>
                    <option value="paused">Paused (Mute All Reminders)</option>
                  </select>
                </div>

                {/* 2. Reminder Cadence */}
                <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                  <input
                    type="checkbox"
                    id="applyCadence"
                    checked={batchUpdates.applyCadence}
                    onChange={e => setBatchUpdates({ ...batchUpdates, applyCadence: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <div className="flex-1">
                    <label htmlFor="applyCadence" className="text-xs font-semibold text-slate-800">
                      Update Reminder Cadence (Days)
                    </label>
                    <div className="text-[11px] text-slate-500">Days between automated WhatsApp follow-ups</div>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={14}
                    disabled={!batchUpdates.applyCadence}
                    value={batchUpdates.reminderCadenceDays}
                    onChange={e => setBatchUpdates({ ...batchUpdates, reminderCadenceDays: Number(e.target.value) })}
                    className="w-20 px-2 py-1 text-xs border border-slate-300 rounded-md bg-white disabled:opacity-50"
                  />
                </div>

                {/* 3. Re-assign Staff */}
                <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                  <input
                    type="checkbox"
                    id="applyStaff"
                    checked={batchUpdates.applyStaff}
                    onChange={e => setBatchUpdates({ ...batchUpdates, applyStaff: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <div className="flex-1">
                    <label htmlFor="applyStaff" className="text-xs font-semibold text-slate-800">
                      Re-assign CA Staff Member
                    </label>
                    <div className="text-[11px] text-slate-500">Assign all selected accounts to a team member</div>
                  </div>
                  <select
                    disabled={!batchUpdates.applyStaff}
                    value={batchUpdates.assignedStaffId}
                    onChange={e => {
                      const name = e.target.options[e.target.selectedIndex].text;
                      setBatchUpdates({ ...batchUpdates, assignedStaffId: e.target.value, assignedStaffName: name });
                    }}
                    className="px-2 py-1 text-xs border border-slate-300 rounded-md bg-white disabled:opacity-50"
                  >
                    <option value="staff_pooja_02">Pooja Verma (Senior Associate)</option>
                    <option value="staff_amit_03">Amit Patel (GST Assistant)</option>
                    <option value="ca_rajesh_01">CA Rajesh Sharma (FCA)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBatchSubmit}
                  disabled={loading || selectedClientIds.length === 0}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1.5 transition disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Apply Batch Changes</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
