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
  Trash2,
  Plus,
  FileText,
  ChevronDown,
  ChevronUp,
  Eye,
  Sparkles,
} from 'lucide-react';
import { ATTACHED_DOC_TEMPLATES } from '../services/frontPageDataService.ts';

interface ClientManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientAddedOrUpdated?: () => void;
  onSuccess?: () => void;
  selectedClientIds?: string[];
  initialEditClientId?: string | null;
  editClientId?: string | null;
  onClearEditClientId?: () => void;
}

export const ClientManagementModal: React.FC<ClientManagementModalProps> = ({
  isOpen,
  onClose,
  onClientAddedOrUpdated,
  onSuccess,
  selectedClientIds = [],
  initialEditClientId = null,
  editClientId = null,
  onClearEditClientId,
}) => {
  const targetEditId = initialEditClientId || editClientId || null;
  const [activeTab, setActiveTab] = useState<'directory' | 'single' | 'staff_users' | 'bulk' | 'batch'>(
    targetEditId ? 'single' : selectedClientIds.length > 0 ? 'batch' : 'directory'
  );

  // Loaded clients and users lists
  const [clientList, setClientList] = useState<any[]>([]);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingClientId, setEditingClientId] = useState<string | null>(targetEditId);

  // Safe callback dispatcher that never throws "is not a function"
  const notifyClientChanged = () => {
    window.dispatchEvent(new Event('ps_clients_updated'));
    window.dispatchEvent(new Event('ps_data_updated'));
    if (typeof onClientAddedOrUpdated === 'function') {
      try {
        onClientAddedOrUpdated();
      } catch (err) {
        console.warn('onClientAddedOrUpdated error:', err);
      }
    }
    if (typeof onSuccess === 'function') {
      try {
        onSuccess();
      } catch (err) {
        console.warn('onSuccess error:', err);
      }
    }
  };

  // Single Client Form State
  const [singleForm, setSingleForm] = useState({
    id: '',
    businessName: '',
    contactPerson: '',
    gstin: '',
    cin: '',
    address: '',
    registeredPhone: '+91',
    email: '',
    assignedStaffId: 'staff_pooja_02',
    assignedStaffName: 'Pooja Verma (Senior Associate)',
    reminderCadenceDays: 3,
    maxReminders: 3,
    whatsappConsent: true,
    active: true,
    directors: [] as any[],
    attachedDocuments: [] as any[],
  });

  // State for adding a director within client creation
  const [newDirector, setNewDirector] = useState({
    name: '',
    din: '',
    phone: '',
    email: '',
    aadharNumber: '',
    panNumber: '',
    bankDetails: '',
    aadharDocFileName: '',
    aadharDocUrl: '',
  });
  const [isExtractingAadhar, setIsExtractingAadhar] = useState(false);
  const [aadharExtractNotice, setAadharExtractNotice] = useState('');
  const [editingDirectorIdx, setEditingDirectorIdx] = useState<number | null>(null);
  const [editAadharVal, setEditAadharVal] = useState('');
  const [showDirectorsSection, setShowDirectorsSection] = useState(true);
  const [showAttachedDocsSection, setShowAttachedDocsSection] = useState(false);

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [directoryError, setDirectoryError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Friendly error formatter to prevent raw technical "Failed to fetch" browser exceptions
  const getFriendlyErrorMessage = (err: any, fallback = 'Operation failed'): string => {
    if (!err) return fallback;
    const msg = typeof err === 'string' ? err : err.message || '';
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Load failed')) {
      return 'Server connection was momentarily interrupted while syncing. Please verify your connection and click "Retry Sync".';
    }
    return msg || fallback;
  };

  // Helper to attach authorization headers from local session
  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'x-user-role': 'ca_admin',
    };
    try {
      const raw = localStorage.getItem('ps_auth_user');
      if (raw) {
        const u = JSON.parse(raw);
        if (u.token) headers['Authorization'] = `Bearer ${u.token}`;
        if (u.role) headers['x-user-role'] = u.role;
        if (u.id) headers['x-user-id'] = u.id;
      }
    } catch {}
    return headers;
  };

  // Client Deletion Confirmation State
  const [clientToDelete, setClientToDelete] = useState<{ id: string; name: string; gstin: string } | null>(null);
  const [isDeletingClient, setIsDeletingClient] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  const handleConfirmDeleteClient = async () => {
    if (!clientToDelete) return;
    try {
      setIsDeletingClient(true);
      setDeleteErrorMessage(null);
      const res = await fetch(`/api/clients/${clientToDelete.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete client');
      setClientToDelete(null);
      setStatusMessage({ type: 'success', text: `Client "${clientToDelete.name}" and all records were deleted successfully.` });
      await fetchDirectories();
      notifyClientChanged();
    } catch (err: any) {
      setDeleteErrorMessage(getFriendlyErrorMessage(err, 'Failed to delete client'));
    } finally {
      setIsDeletingClient(false);
    }
  };

  // Fetch clients and staff users when modal opens
  const fetchDirectories = async () => {
    setIsRefreshing(true);
    setDirectoryError(null);
    const authHeaders = getAuthHeaders();
    try {
      const [resClients, resUsers] = await Promise.all([
        fetch('/api/clients', { headers: authHeaders }),
        fetch('/api/users', { headers: authHeaders }),
      ]);
      if (resClients.ok) {
        const data = await resClients.json();
        const clientsArray = Array.isArray(data) ? data : (Array.isArray(data?.clients) ? data.clients : []);
        setClientList(clientsArray);
        if (clientsArray.length > 0 && typeof window !== 'undefined') {
          try {
            localStorage.setItem('ps_clients_kyc_data', JSON.stringify(clientsArray));
            window.dispatchEvent(new Event('ps_data_updated'));
          } catch {}
        }
      } else {
        // Soft fallback to local storage clients so UI is always responsive
        const cached = localStorage.getItem('ps_clients_kyc_data');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setClientList(parsed);
            }
          } catch {}
        }
      }
      if (resUsers.ok) {
        const udata = await resUsers.json();
        const usersArray = Array.isArray(udata) ? udata : (Array.isArray(udata?.users) ? udata.users : []);
        setStaffUsers(usersArray);
        if (usersArray.length > 0 && typeof window !== 'undefined') {
          try {
            localStorage.setItem('ps_staff_users_data', JSON.stringify(usersArray));
          } catch {}
        }
      } else {
        const cachedUsers = localStorage.getItem('ps_staff_users_data');
        if (cachedUsers) {
          try {
            const parsed = JSON.parse(cachedUsers);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setStaffUsers(parsed);
            }
          } catch {}
        }
      }
      if (!resClients.ok && !resUsers.ok) {
        const cached = localStorage.getItem('ps_clients_kyc_data');
        if (!cached) {
          setDirectoryError('Server connection was momentarily interrupted while syncing. Please verify your connection and click "Retry Sync".');
        }
      }
    } catch (e: any) {
      console.warn('Failed to load clients/users directory:', e);
      try {
        const cached = localStorage.getItem('ps_clients_kyc_data');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setClientList(parsed);
          }
        }
        const cachedUsers = localStorage.getItem('ps_staff_users_data');
        if (cachedUsers) {
          const parsedU = JSON.parse(cachedUsers);
          if (Array.isArray(parsedU) && parsedU.length > 0) {
            setStaffUsers(parsedU);
          }
        }
      } catch {}
      if (!localStorage.getItem('ps_clients_kyc_data')) {
        setDirectoryError(getFriendlyErrorMessage(e, 'Could not sync clients and staff directories.'));
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDirectories();
    }
  }, [isOpen]);

  // Handle setting initial edit client
  useEffect(() => {
    const editId = initialEditClientId || editClientId;
    if (editId && clientList.length > 0) {
      const target = clientList.find(c => c.id === editId);
      if (target) {
        loadClientIntoForm(target);
      }
    }
  }, [initialEditClientId, editClientId, clientList]);

  if (!isOpen) return null;

  const loadClientIntoForm = (client: any) => {
    setEditingClientId(client.id);
    setSingleForm({
      id: client.id,
      businessName: client.businessName || '',
      contactPerson: client.contactPerson || '',
      gstin: client.gstin || '',
      cin: client.cin || '',
      address: client.address || '',
      registeredPhone: client.registeredPhone || '+91',
      email: client.email || '',
      assignedStaffId: client.assignedStaffId || 'staff_pooja_02',
      assignedStaffName: client.assignedStaffName || 'Pooja Verma (Senior Associate)',
      reminderCadenceDays: client.reminderCadenceDays || 3,
      maxReminders: client.maxReminders || 3,
      whatsappConsent: client.whatsappConsent !== undefined ? Boolean(client.whatsappConsent) : true,
      active: client.active !== undefined ? Boolean(client.active) : true,
      directors: Array.isArray(client.directors) ? client.directors : [],
      attachedDocuments: Array.isArray(client.attachedDocuments) ? client.attachedDocuments : [],
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
      cin: '',
      address: '',
      registeredPhone: '+91',
      email: '',
      assignedStaffId: 'staff_pooja_02',
      assignedStaffName: 'Pooja Verma (Senior Associate)',
      reminderCadenceDays: 3,
      maxReminders: 3,
      whatsappConsent: true,
      active: true,
      directors: [],
      attachedDocuments: [],
    });
    setNewDirector({
      name: '',
      din: '',
      phone: '',
      email: '',
      aadharNumber: '',
      panNumber: '',
      bankDetails: '',
      aadharDocFileName: '',
      aadharDocUrl: '',
    });
    setEditingDirectorIdx(null);
    setAadharExtractNotice('');
    setStatusMessage(null);
  };

  // Helper to extract Aadhaar number automatically on upload
  const handleAadharUploadForForm = async (file: File, directorIdx?: number) => {
    if (!file) return;
    setIsExtractingAadhar(true);
    setAadharExtractNotice('Extracting Aadhaar number with AI & OCR...');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('targetDocType', 'aadhar');
      if (editingClientId) fd.append('clientId', editingClientId);

      const res = await fetch('/api/kyc/upload-and-extract', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to extract document');

      const extractedAadhar = data.aadharNumber || data.extractedNumber || '';
      const docUrl = data.fileUrl || '';
      const docFileName = data.fileName || file.name;

      if (directorIdx !== undefined && directorIdx >= 0) {
        const copy = [...singleForm.directors];
        copy[directorIdx] = {
          ...copy[directorIdx],
          aadharNumber: extractedAadhar || copy[directorIdx].aadharNumber,
          aadharUploaded: true,
          aadharDocFileName: docFileName,
          aadharDocUrl: docUrl,
        };
        setSingleForm({ ...singleForm, directors: copy });
      } else {
        setNewDirector(prev => ({
          ...prev,
          aadharNumber: extractedAadhar || prev.aadharNumber,
          aadharDocFileName: docFileName,
          aadharDocUrl: docUrl,
        }));
      }

      setAadharExtractNotice(
        extractedAadhar
          ? `Aadhaar Detected: ${extractedAadhar}`
          : 'Aadhaar uploaded! (Number not detected cleanly, you can type/edit it manually)'
      );
      setTimeout(() => setAadharExtractNotice(''), 4500);
    } catch (err: any) {
      setAadharExtractNotice('Extraction notice: ' + err.message);
    } finally {
      setIsExtractingAadhar(false);
    }
  };

  const handleAddDirectorToList = () => {
    if (!newDirector.name.trim() && !newDirector.aadharNumber && !newDirector.din) {
      alert('Please enter at least a Director name or identification number');
      return;
    }
    const dirToAdd = {
      id: `dir_${Date.now()}`,
      name: (newDirector.name || 'Director').trim(),
      din: newDirector.din?.trim() || undefined,
      phone: newDirector.phone?.trim() || undefined,
      email: newDirector.email?.trim() || undefined,
      aadharNumber: newDirector.aadharNumber?.trim() || undefined,
      panNumber: newDirector.panNumber?.trim().toUpperCase() || undefined,
      bankDetails: newDirector.bankDetails?.trim() || undefined,
      aadharUploaded: Boolean(newDirector.aadharDocUrl || newDirector.aadharNumber),
      panUploaded: Boolean(newDirector.panNumber),
      bankDocUploaded: Boolean(newDirector.bankDetails),
      dinDocUploaded: Boolean(newDirector.din),
      aadharDocFileName: newDirector.aadharDocFileName || undefined,
      aadharDocUrl: newDirector.aadharDocUrl || undefined,
    };

    setSingleForm({
      ...singleForm,
      directors: [...(singleForm.directors || []), dirToAdd],
    });

    setNewDirector({
      name: '',
      din: '',
      phone: '',
      email: '',
      aadharNumber: '',
      panNumber: '',
      bankDetails: '',
      aadharDocFileName: '',
      aadharDocUrl: '',
    });
  };

  const handleRemoveDirectorFromList = (idx: number) => {
    const updated = (singleForm.directors || []).filter((_, i) => i !== idx);
    setSingleForm({ ...singleForm, directors: updated });
  };

  // Single Client Submit (Add or Edit - No Mandatory * Requirements)
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    try {
      let finalPhone = singleForm.registeredPhone || '+91';
      const cleanDigits = finalPhone.replace(/\D/g, '');
      const localDigits = cleanDigits.startsWith('91') && cleanDigits.length > 10 ? cleanDigits.slice(2) : cleanDigits;
      if (localDigits.length === 10) {
        finalPhone = `+91${localDigits}`;
      }

      const payload = {
        ...singleForm,
        registeredPhone: finalPhone,
      };

      const isEditing = Boolean(editingClientId);
      const url = isEditing ? `/api/clients/${editingClientId}` : '/api/clients';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
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
      notifyClientChanged();

      if (!isEditing) {
        resetSingleForm();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: getFriendlyErrorMessage(err, 'Failed to save client') });
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
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
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
      setStatusMessage({ type: 'error', text: getFriendlyErrorMessage(err, 'Failed to update user') });
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
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientList: parsedRows }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk import failed');

      setStatusMessage({
        type: 'success',
        text: `Bulk Import Completed! Processed ${data.totalProcessed} records: ${data.successCount} saved, ${data.errorCount} skipped.`,
      });
      await fetchDirectories();
      notifyClientChanged();
      setParsedRows([]);
      setBulkText('');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: getFriendlyErrorMessage(err, 'Bulk import failed') });
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
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientIds: selectedClientIds, updates }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Batch update failed');

      setStatusMessage({
        type: 'success',
        text: `Batch updated applied to ${data.updatedCount} clients successfully!`,
      });
      await fetchDirectories();
      notifyClientChanged();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: getFriendlyErrorMessage(err, 'Batch update failed') });
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

  // Check if entered GSTIN already exists in client directory (when adding a new client)
  const matchingExistingClient = !editingClientId && singleForm.gstin.trim().length === 15
    ? clientList.find(c => (c.gstin || '').toUpperCase() === singleForm.gstin.trim().toUpperCase())
    : null;

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
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={fetchDirectories}
              disabled={isRefreshing}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-slate-200/60 rounded-lg transition inline-flex items-center gap-1.5 border border-slate-200 bg-white shadow-2xs cursor-pointer"
              title="Refresh clients and staff directory from server"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Directory'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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
        {(statusMessage || directoryError) && (
          <div
            className={`mx-6 mt-4 p-3 rounded-lg text-xs flex items-center justify-between space-x-2 ${
              statusMessage?.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <div className="flex items-center space-x-2 flex-1">
              {statusMessage?.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{statusMessage?.text || directoryError}</span>
            </div>
            {(statusMessage?.type === 'error' || directoryError) && (
              <button
                type="button"
                onClick={() => {
                  fetchDirectories();
                  if (statusMessage) setStatusMessage(null);
                }}
                className="px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-700 font-semibold rounded text-[11px] border border-rose-300 shadow-2xs cursor-pointer ml-3 flex items-center space-x-1 shrink-0"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Retry Sync</span>
              </button>
            )}
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
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          {isRefreshing ? (
                            <div className="flex items-center justify-center space-x-2 text-blue-600 font-medium">
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Loading client directory from database...</span>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-slate-500">No clients found matching your search.</p>
                              <button
                                type="button"
                                onClick={fetchDirectories}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center space-x-1.5 cursor-pointer border border-slate-200"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Re-sync Directory</span>
                              </button>
                            </div>
                          )}
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
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => loadClientIntoForm(c)}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg border border-blue-200 transition inline-flex items-center space-x-1"
                                title="Edit this client's profile, phone number, and settings"
                              >
                                <Edit2 className="w-3 h-3 text-blue-600" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteErrorMessage(null);
                                  setClientToDelete({ id: c.id, name: c.businessName, gstin: c.gstin });
                                }}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg border border-rose-200 transition inline-flex items-center cursor-pointer"
                                title={`Delete ${c.businessName} and all filing records`}
                              >
                                <Trash2 className="w-3 h-3 text-rose-600" />
                              </button>
                            </div>
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
                    Business / Company Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Engineering Works"
                    value={singleForm.businessName}
                    onChange={e => setSingleForm({ ...singleForm, businessName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Patil"
                    value={singleForm.contactPerson}
                    onChange={e => setSingleForm({ ...singleForm, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client GSTIN (15 Digits)
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="27AAACA1234A1Z5"
                    value={singleForm.gstin}
                    onChange={e => setSingleForm({ ...singleForm, gstin: e.target.value.toUpperCase() })}
                    className={`w-full px-3 py-2 text-xs font-mono border rounded-lg focus:ring-2 focus:outline-hidden ${
                      matchingExistingClient ? 'border-amber-400 bg-amber-50/40 text-amber-900 focus:ring-amber-500' : 'border-slate-300 focus:ring-blue-500'
                    }`}
                  />
                  {matchingExistingClient && (
                    <div className="mt-1.5 p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 flex items-center justify-between">
                      <span>GSTIN already registered to <strong>{matchingExistingClient.businessName}</strong></span>
                      <button
                        type="button"
                        onClick={() => loadClientIntoForm(matchingExistingClient)}
                        className="text-blue-700 font-bold underline hover:text-blue-900 ml-2 shrink-0 cursor-pointer"
                      >
                        Edit Instead
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Corporate Identification Number (CIN)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. U74999DL2021PTC384592"
                    value={singleForm.cin}
                    onChange={e => setSingleForm({ ...singleForm, cin: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registered Office Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Plot No. 44, Okhla Industrial Area Phase-III, New Delhi - 110020"
                    value={singleForm.address}
                    onChange={e => setSingleForm({ ...singleForm, address: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    WhatsApp Registered Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+919820123456"
                    value={singleForm.registeredPhone}
                    onChange={e => setSingleForm({ ...singleForm, registeredPhone: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400">Used for WhatsApp monthly intake and reminders</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Accounts Email
                  </label>
                  <input
                    type="email"
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
                        <option value="ca_rajesh_01">CA Suraj Dutta (FCA)</option>
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

              {/* SECTION: COMPANY DIRECTORS & KYC */}
              <div className="mt-4 border border-slate-200 rounded-2xl p-4 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-teal-700" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Company Directors & KYC ({singleForm.directors.length} Added)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDirectorsSection(!showDirectorsSection)}
                    className="text-xs text-teal-700 hover:text-teal-900 font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <span>{showDirectorsSection ? 'Collapse' : 'Expand'}</span>
                    {showDirectorsSection ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {showDirectorsSection && (
                  <div className="space-y-3">
                    {/* List of Already Added Directors */}
                    {singleForm.directors.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-slate-600 block">Registered Directors:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {singleForm.directors.map((dir: any, idx: number) => (
                            <div key={dir.id || idx} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs text-xs space-y-1.5 relative">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900">{idx + 1}. {dir.name}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDirectorFromList(idx)}
                                  className="text-rose-500 hover:text-rose-700 p-0.5 rounded cursor-pointer"
                                  title="Remove director"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="text-[11px] text-slate-600 space-y-0.5 font-mono">
                                {dir.din && <div>DIN: {dir.din}</div>}
                                {dir.panNumber && <div>PAN: {dir.panNumber}</div>}
                                {dir.phone && <div>Phone: {dir.phone}</div>}
                              </div>

                              {/* Aadhaar Display with Edit and Download options */}
                              <div className="pt-1.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                                <div className="flex items-center space-x-1">
                                  <span className="text-slate-500 font-medium">Aadhaar:</span>
                                  {editingDirectorIdx === idx ? (
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="text"
                                        value={editAadharVal}
                                        onChange={e => setEditAadharVal(e.target.value)}
                                        placeholder="12 digits"
                                        className="w-32 px-1.5 py-0.5 text-xs font-mono border border-teal-400 rounded bg-teal-50/50"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const copy = [...singleForm.directors];
                                          copy[idx] = { ...copy[idx], aadharNumber: editAadharVal.trim() };
                                          setSingleForm({ ...singleForm, directors: copy });
                                          setEditingDirectorIdx(null);
                                        }}
                                        className="px-1.5 py-0.5 bg-teal-600 text-white rounded font-bold text-[10px]"
                                      >
                                        Save
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="font-mono font-bold text-slate-800">
                                      {dir.aadharNumber || 'Not set'}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center space-x-1.5">
                                  {editingDirectorIdx !== idx && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingDirectorIdx(idx);
                                        setEditAadharVal(dir.aadharNumber || '');
                                      }}
                                      className="text-teal-700 hover:text-teal-900 font-semibold inline-flex items-center gap-0.5 text-[10px] cursor-pointer"
                                      title="Edit Aadhaar number if wrong"
                                    >
                                      <Edit2 className="w-2.5 h-2.5" />
                                      <span>Edit</span>
                                    </button>
                                  )}

                                  {dir.aadharDocUrl && (
                                    <a
                                      href={dir.aadharDocUrl}
                                      download={dir.aadharDocFileName || 'Aadhaar.pdf'}
                                      className="text-blue-700 hover:text-blue-900 font-semibold inline-flex items-center gap-0.5 text-[10px]"
                                      title="Download uploaded Aadhaar card"
                                    >
                                      <Download className="w-2.5 h-2.5" />
                                      <span>Download</span>
                                    </a>
                                  )}

                                  <label className="text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-0.5 text-[10px] cursor-pointer">
                                    <Upload className="w-2.5 h-2.5" />
                                    <span>Re-scan</span>
                                    <input
                                      type="file"
                                      accept=".pdf,image/*"
                                      className="hidden"
                                      onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) handleAadharUploadForForm(file, idx);
                                      }}
                                    />
                                  </label>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add New Director Inline Box */}
                    <div className="bg-white p-3.5 rounded-xl border border-dashed border-teal-300 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-teal-900 flex items-center gap-1">
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add New Director (Optional)</span>
                        </span>
                        {aadharExtractNotice && (
                          <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 animate-pulse">
                            {aadharExtractNotice}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Director Full Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Rajesh Kumar"
                            value={newDirector.name}
                            onChange={e => setNewDirector({ ...newDirector, name: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-0.5">DIN (8 Digits)</label>
                          <input
                            type="text"
                            placeholder="e.g. 08492013"
                            value={newDirector.din}
                            onChange={e => setNewDirector({ ...newDirector, din: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Director PAN</label>
                          <input
                            type="text"
                            placeholder="e.g. ABCDE1234F"
                            value={newDirector.panNumber}
                            onChange={e => setNewDirector({ ...newDirector, panNumber: e.target.value.toUpperCase() })}
                            className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Phone / WhatsApp</label>
                          <input
                            type="text"
                            placeholder="+91 98112 34567"
                            value={newDirector.phone}
                            onChange={e => setNewDirector({ ...newDirector, phone: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Director Email</label>
                          <input
                            type="email"
                            placeholder="director@company.com"
                            value={newDirector.email}
                            onChange={e => setNewDirector({ ...newDirector, email: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Bank Cancel Cheque / Details</label>
                          <input
                            type="text"
                            placeholder="e.g. HDFC Bank A/C ... verified"
                            value={newDirector.bankDetails}
                            onChange={e => setNewDirector({ ...newDirector, bankDetails: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                      </div>

                      {/* Aadhaar Upload with Auto-Extract & Edit */}
                      <div className="p-2.5 bg-teal-50/70 rounded-lg border border-teal-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center space-x-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                            <span className="font-bold text-teal-900 text-xs">Aadhaar Card (Auto-Scan):</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              placeholder="Auto-fetches from scan or type manually"
                              value={newDirector.aadharNumber}
                              onChange={e => setNewDirector({ ...newDirector, aadharNumber: e.target.value })}
                              className="px-2 py-1 text-xs font-mono font-bold bg-white border border-teal-300 rounded w-48 text-slate-900 focus:outline-none"
                            />
                            {newDirector.aadharDocUrl && (
                              <a
                                href={newDirector.aadharDocUrl}
                                download={newDirector.aadharDocFileName || 'Aadhaar.pdf'}
                                className="px-2 py-1 bg-white hover:bg-slate-100 text-teal-800 text-[11px] font-bold rounded border border-teal-300 inline-flex items-center gap-1"
                              >
                                <Download className="w-3 h-3 text-teal-700" />
                                <span>Download</span>
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <label className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-bold text-xs rounded-lg shadow-2xs inline-flex items-center gap-1.5 cursor-pointer transition">
                            <Upload className="w-3.5 h-3.5" />
                            <span>{isExtractingAadhar ? 'Scanning...' : 'Upload & Fetch Aadhaar No.'}</span>
                            <input
                              type="file"
                              accept=".pdf,image/*"
                              disabled={isExtractingAadhar}
                              className="hidden"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) handleAadharUploadForForm(file);
                              }}
                            />
                          </label>

                          <button
                            type="button"
                            onClick={handleAddDirectorToList}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-2xs transition inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Director</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION: 13 ATTACHED STATUTORY DOCUMENTS */}
              <div className="mt-3 border border-slate-200 rounded-2xl p-4 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-purple-700" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Attached Documents ({((singleForm.attachedDocuments || []).filter((d: any) => d.status === 'verified' || d.fileUrl)).length}/13 Uploaded)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAttachedDocsSection(!showAttachedDocsSection)}
                    className="text-xs text-purple-700 hover:text-purple-900 font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <span>{showAttachedDocsSection ? 'Collapse' : 'Expand All 13 Categories'}</span>
                    {showAttachedDocsSection ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {showAttachedDocsSection && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {ATTACHED_DOC_TEMPLATES.map(tmpl => {
                      const attached = (singleForm.attachedDocuments || []).find(
                        (d: any) => d.docKey === tmpl.key || d.categoryNumber === tmpl.categoryNumber
                      );
                      const isUploaded = Boolean(attached && (attached.status === 'verified' || attached.fileUrl));

                      return (
                        <div key={tmpl.key} className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-slate-800 block truncate">
                              <strong>{tmpl.categoryNumber}.</strong> {tmpl.name}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded inline-block mt-0.5 ${
                              isUploaded ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {isUploaded ? '✓ Uploaded' : 'Pending'}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1.5 shrink-0">
                            {isUploaded && attached?.fileUrl && (
                              <a
                                href={attached.fileUrl}
                                download={attached.fileName || `${tmpl.key}.pdf`}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[11px] font-bold inline-flex items-center gap-0.5"
                                title="Download uploaded statutory document"
                              >
                                <Download className="w-3 h-3" />
                                <span>Download</span>
                              </a>
                            )}

                            <label className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold inline-flex items-center gap-0.5 cursor-pointer transition border border-slate-200">
                              <Upload className="w-3 h-3 text-slate-600" />
                              <span>{isUploaded ? 'Replace' : 'Upload'}</span>
                              <input
                                type="file"
                                accept=".pdf,image/*,.xlsx,.csv"
                                className="hidden"
                                onChange={async e => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    const fd = new FormData();
                                    fd.append('file', file);
                                    fd.append('docKey', tmpl.key);
                                    fd.append('docName', tmpl.name);
                                    fd.append('categoryNumber', String(tmpl.categoryNumber));
                                    if (editingClientId) fd.append('clientId', editingClientId);

                                    const res = await fetch('/api/kyc/upload-and-extract', {
                                      method: 'POST',
                                      headers: getAuthHeaders(),
                                      body: fd,
                                    });
                                    const data = await res.json();
                                    const updatedEntry = {
                                      id: `att_${Date.now()}`,
                                      docKey: tmpl.key,
                                      docName: tmpl.name,
                                      categoryNumber: tmpl.categoryNumber,
                                      fileName: data.fileName || file.name,
                                      fileSize: `${Math.round(file.size / 1024)} KB`,
                                      uploadedAt: new Date().toISOString().split('T')[0],
                                      status: 'verified' as const,
                                      fileUrl: data.fileUrl,
                                      fileId: data.fileId,
                                    };

                                    const copy = [...(singleForm.attachedDocuments || [])];
                                    const exIdx = copy.findIndex((d: any) => d.docKey === tmpl.key || d.categoryNumber === tmpl.categoryNumber);
                                    if (exIdx >= 0) copy[exIdx] = updatedEntry;
                                    else copy.push(updatedEntry);

                                    setSingleForm({ ...singleForm, attachedDocuments: copy });
                                  } catch (err: any) {
                                    alert('Failed to upload document: ' + err.message);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                            <option value="ca_rajesh_01">CA Suraj Dutta (FCA)</option>
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

      {/* Delete Client Confirmation Modal Popup */}
      {clientToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-rose-600 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>Confirm Client Deletion</span>
              </div>
              <button
                onClick={() => setClientToDelete(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <p className="text-slate-800 font-medium text-sm">
                Are you sure you want to permanently delete <strong className="text-rose-600 font-bold">{clientToDelete.name}</strong>?
              </p>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 font-mono text-[11px] text-slate-700">
                <div>Client ID: <strong>{clientToDelete.id}</strong></div>
                <div>GSTIN: <strong>{clientToDelete.gstin}</strong></div>
              </div>
              <p className="text-rose-700 font-medium pt-1">
                ⚠️ Warning: This will permanently remove this client profile along with all their monthly filing requests, OCR extracted invoices, bank statements, and WhatsApp audit history. This action cannot be undone.
              </p>
            </div>

            {deleteErrorMessage && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs">
                {deleteErrorMessage}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                disabled={isDeletingClient}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteClient}
                disabled={isDeletingClient}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingClient ? 'Deleting Client...' : 'Yes, Permanently Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
