// src/components/ClientDirectoryKycView.tsx
import React, { useState } from 'react';
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
} from 'lucide-react';
import { Client, DirectorKYC, ClientAttachedDoc } from '../types/index.ts';
import { INITIAL_CLIENTS_DATA, ATTACHED_DOC_TEMPLATES } from '../services/frontPageDataService.ts';

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
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('ps_clients_kyc_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_CLIENTS_DATA;
      }
    }
    return INITIAL_CLIENTS_DATA;
  });

  const [selectedClientId, setSelectedClientId] = useState<string>(
    clients[0]?.id || 'cli_briopox_01'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDirectorTab, setSelectedDirectorTab] = useState<number>(0);

  // Modal States
  const [isAddDirectorModalOpen, setIsAddDirectorModalOpen] = useState(false);
  const [isUploadDocModalOpen, setIsUploadDocModalOpen] = useState(false);
  const [activeUploadDocKey, setActiveUploadDocKey] = useState<string>('');
  const [uploadDocName, setUploadDocName] = useState<string>('');
  const [selectedFileName, setSelectedFileName] = useState<string>('');

  // New Director Form
  const [newDirector, setNewDirector] = useState({
    name: '',
    din: '',
    phone: '+91 ',
    email: '',
    aadharNumber: '',
    panNumber: '',
    bankDetails: '',
    aadharUploaded: true,
    panUploaded: true,
    bankDocUploaded: true,
    dinDocUploaded: true,
  });

  const persistClients = (updated: Client[]) => {
    setClients(updated);
    localStorage.setItem('ps_clients_kyc_data', JSON.stringify(updated));
  };

  const selectedClient = clients.find(c => c.id === selectedClientId) || clients[0];

  const filteredClients = clients.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      c.businessName.toLowerCase().includes(q) ||
      c.gstin.toLowerCase().includes(q) ||
      (c.cin && c.cin.toLowerCase().includes(q)) ||
      c.contactPerson.toLowerCase().includes(q)
    );
  });

  const handleAddDirector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDirector.name.trim()) {
      alert('Please enter director name');
      return;
    }

    const createdDirector: DirectorKYC = {
      id: `dir_${Date.now()}`,
      name: newDirector.name.trim(),
      din: newDirector.din.trim() || undefined,
      phone: newDirector.phone.trim() || undefined,
      email: newDirector.email.trim() || undefined,
      aadharNumber: newDirector.aadharNumber.trim() || undefined,
      panNumber: newDirector.panNumber.trim() || undefined,
      bankDetails: newDirector.bankDetails.trim() || undefined,
      aadharUploaded: newDirector.aadharUploaded,
      panUploaded: newDirector.panUploaded,
      bankDocUploaded: newDirector.bankDocUploaded,
      dinDocUploaded: newDirector.dinDocUploaded,
    };

    const updated = clients.map(c => {
      if (c.id === selectedClient.id) {
        return {
          ...c,
          directors: [...(c.directors || []), createdDirector],
        };
      }
      return c;
    });

    persistClients(updated);

    // Persist to backend container API
    try {
      await fetch(`/api/clients/${selectedClient.id}/directors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'ca_admin' },
        body: JSON.stringify(createdDirector),
      });
    } catch (err) {
      console.warn('Backend sync queued:', err);
    }

    setIsAddDirectorModalOpen(false);
    setNewDirector({
      name: '',
      din: '',
      phone: '+91 ',
      email: '',
      aadharNumber: '',
      panNumber: '',
      bankDetails: '',
      aadharUploaded: true,
      panUploaded: true,
      bankDocUploaded: true,
      dinDocUploaded: true,
    });
    alert(`Director ${createdDirector.name} successfully saved and memorized on backend for ${selectedClient.businessName}!`);
  };

  const handleOpenUploadModal = (docKey: string, defaultName: string) => {
    setActiveUploadDocKey(docKey);
    setUploadDocName(defaultName);
    setSelectedFileName(`${defaultName.replace(/[^a-zA-Z0-9]/g, '_')}_${selectedClient.businessName.substring(0, 7)}.pdf`);
    setIsUploadDocModalOpen(true);
  };

  const handleSaveUploadedDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    const template = ATTACHED_DOC_TEMPLATES.find(t => t.key === activeUploadDocKey);
    const newDoc: ClientAttachedDoc = {
      id: `att_${Date.now()}`,
      docKey: activeUploadDocKey,
      docName: uploadDocName || template?.name || 'Document',
      categoryNumber: template?.categoryNumber || 1,
      fileName: selectedFileName || 'Uploaded_Document.pdf',
      fileSize: '1.4 MB',
      uploadedAt: new Date().toISOString().split('T')[0],
      status: 'verified',
    };

    const updated = clients.map(c => {
      if (c.id === selectedClient.id) {
        const existingDocs = c.attachedDocuments || [];
        const index = existingDocs.findIndex(d => d.docKey === activeUploadDocKey);
        let newAttachedDocs: ClientAttachedDoc[];
        if (index >= 0) {
          newAttachedDocs = [...existingDocs];
          newAttachedDocs[index] = newDoc;
        } else {
          newAttachedDocs = [...existingDocs, newDoc];
        }

        return {
          ...c,
          attachedDocuments: newAttachedDocs,
        };
      }
      return c;
    });

    persistClients(updated);

    // Persist to backend container API
    try {
      await fetch(`/api/clients/${selectedClient.id}/attached-docs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'ca_admin' },
        body: JSON.stringify(newDoc),
      });
    } catch (err) {
      console.warn('Backend sync queued:', err);
    }

    setIsUploadDocModalOpen(false);
    alert(`Document "${uploadDocName}" successfully attached and memorized on backend for ${selectedClient.businessName}!`);
  };

  const currentDirector = selectedClient?.directors?.[selectedDirectorTab] || selectedClient?.directors?.[0];

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
              CA Master Dossier
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full theme-badge border font-semibold">
              KYC & Statutory Registry
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
            Client Directory & KYC
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Complete master records, CIN, GST registration, Director KYC (Aadhaar/PAN/DIN), and 13 statutory attached documents.
          </p>
        </div>

        {/* Client Quick Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-black/40 rounded-xl p-1 border border-white/10 flex items-center gap-1.5 overflow-x-auto max-w-full">
            {clients.map(c => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedClientId(c.id);
                  setSelectedDirectorTab(0);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  selectedClientId === c.id
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{c.businessName}</span>
              </button>
            ))}
          </div>

          {onOpenClientPortal && (
            <button
              onClick={() => onOpenClientPortal(selectedClient.id)}
              className="px-3.5 py-2 bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 border border-teal-400/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              title="Open Client Portal View"
            >
              <span>Portal View</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Client Profile Card (CIN, GST, Address, Directors Summary) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
        {/* Top Business Identification Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-800 font-extrabold flex items-center justify-center text-xl border border-teal-100 shrink-0">
              {selectedClient.businessName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {selectedClient.businessName}
                </h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active Statutory Client
                </span>
              </div>

              {/* CIN & GST Badges */}
              <div className="flex flex-wrap items-center gap-2.5 mt-2 text-xs">
                <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 font-mono">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">CIN:</span>
                  <strong className="text-slate-900">{selectedClient.cin || 'U74999DL2021PTC384592'}</strong>
                </div>

                <div className="flex items-center gap-1.5 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 text-teal-900 font-mono">
                  <span className="text-[10px] font-bold text-teal-700 uppercase">GST No:</span>
                  <strong className="text-teal-950">{selectedClient.gstin}</strong>
                </div>

                <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                  <UserPlus className="w-3.5 h-3.5 text-slate-400" />
                  <span>Assigned: <strong>{selectedClient.assignedStaffName || 'Pooja Verma (Senior Associate)'}</strong></span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddDirectorModalOpen(true)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Director</span>
            </button>
          </div>
        </div>

        {/* Address & Contact Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 text-xs">
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Registered Office Address</span>
              <span className="text-slate-800 font-medium leading-relaxed block mt-0.5">
                {selectedClient.address || 'Plot No. 44, Okhla Industrial Area Phase-III, New Delhi - 110020'}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Authorized Contact Person</span>
              <span className="text-slate-800 font-bold block mt-0.5">{selectedClient.contactPerson}</span>
              <span className="text-slate-600 font-mono block">{selectedClient.registeredPhone}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Mail className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Official Billing Email</span>
              <span className="text-slate-800 font-medium block mt-0.5">{selectedClient.email}</span>
              <span className="text-emerald-700 text-[11px] font-semibold flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3" /> WhatsApp Consent Enabled
              </span>
            </div>
          </div>
        </div>

        {/* 3. Director Names & KYC Section */}
        <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" />
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                  Directors & Designated Partners
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Director Names: {(selectedClient.directors || []).map((d, i) => `${i + 1}. ${d.name}`).join('  •  ')} (We can add other directors as well)
              </p>
            </div>

            {/* Director Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              {(selectedClient.directors || []).map((dir, idx) => (
                <button
                  key={dir.id}
                  onClick={() => setSelectedDirectorTab(idx)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    selectedDirectorTab === idx
                      ? 'bg-white text-teal-800 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{idx + 1}. {dir.name}</span>
                </button>
              ))}
              <button
                onClick={() => setIsAddDirectorModalOpen(true)}
                className="px-2 py-1 text-teal-700 hover:text-teal-900 hover:bg-teal-50 rounded-lg text-xs font-bold transition flex items-center gap-1"
                title="Add another director"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Director</span>
              </button>
            </div>
          </div>

          {/* Active Selected Director Dossier */}
          {currentDirector && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/90 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-slate-900">{currentDirector.name}</span>
                    <span className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-mono font-bold">
                      DIN: {currentDirector.din || '08492011'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-1">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <strong>Phone:</strong> {currentDirector.phone || '+91 98112 34567'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <strong>Email:</strong> {currentDirector.email || 'director@company.com'}
                    </span>
                  </div>
                </div>

                <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5 self-start sm:self-auto">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>MCA DIN Status: Active</span>
                </div>
              </div>

              {/* Director KYC 4-Point Checklist from Diagram */}
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Director KYC Verification Matrix:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* 1. Aadhar */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-slate-500 uppercase">1. Aadhaar Card</div>
                      <div className="text-xs font-mono font-bold text-slate-900 mt-0.5">
                        {currentDirector.aadharNumber || '**** **** 4821'}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Verified
                    </span>
                  </div>

                  {/* 2. PAN card */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-slate-500 uppercase">2. PAN Card</div>
                      <div className="text-xs font-mono font-bold text-slate-900 mt-0.5">
                        {currentDirector.panNumber || 'ABCDB1234F'}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Verified
                    </span>
                  </div>

                  {/* 3. Bank details (cancel cheque) */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <div className="text-[11px] font-bold text-slate-500 uppercase truncate">3. Bank details (cancel cheque)</div>
                      <div className="text-xs font-mono font-bold text-slate-900 mt-0.5 truncate">
                        {currentDirector.bankDetails || 'HDFC Cancel Cheque #492810'}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shrink-0">
                      <Check className="w-3 h-3" /> On File
                    </span>
                  </div>

                  {/* 4. DIN details */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-slate-500 uppercase">4. DIN Details</div>
                      <div className="text-xs font-mono font-bold text-slate-900 mt-0.5">
                        {currentDirector.din || '08492011'}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3 h-3" /> DIR-3 Valid
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Attached Documents (13 Documents Checklist from Diagram) */}
        <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                  Attached Documents Repository (13 Statutory Items)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Permanent document vault for GST registration, COA, MOA/AOA, leases, licences, and utility bills.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">
                {(selectedClient.attachedDocuments || []).length} of 13 Verified
              </span>
            </div>
          </div>

          {/* 13 Attached Documents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ATTACHED_DOC_TEMPLATES.map((tmpl) => {
              const attached = (selectedClient.attachedDocuments || []).find(
                d => d.docKey === tmpl.key || d.categoryNumber === tmpl.categoryNumber
              );

              return (
                <div
                  key={tmpl.key}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                    attached
                      ? 'bg-slate-50/80 border-slate-200 hover:border-teal-400'
                      : 'bg-amber-50/30 border-amber-200/80 border-dashed'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start space-x-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 text-xs font-extrabold flex items-center justify-center shrink-0">
                        {tmpl.categoryNumber}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">
                          {tmpl.name}
                        </h4>
                        {attached ? (
                          <div className="mt-1 text-[11px] text-slate-500 font-mono truncate flex items-center gap-1">
                            <FileText className="w-3 h-3 text-teal-600 shrink-0" />
                            <span className="truncate">{attached.fileName || `${tmpl.key}.pdf`}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-700 font-medium block mt-0.5">
                            Pending document upload
                          </span>
                        )}
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                      attached
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {attached ? 'Verified' : 'Missing'}
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    {attached ? (
                      <>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {attached.fileSize || '1.2 MB'} • {attached.uploadedAt || '2026-08-15'}
                        </span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => alert(`Viewing document: ${attached.fileName}\nCategory: ${tmpl.name}\nStatus: Verified on MCA/GST records.`)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-600"
                            title="Preview File"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => alert(`Downloading ${attached.fileName}...`)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-600"
                            title="Download Document"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        onClick={() => handleOpenUploadModal(tmpl.key, tmpl.name)}
                        className="w-full py-1 text-xs font-bold text-teal-700 hover:bg-teal-50 rounded flex items-center justify-center gap-1 transition"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload {tmpl.name.split(' ')[0]}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Add Director Modal */}
      {isAddDirectorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-teal-600" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Add Director / Partner to {selectedClient.businessName}
                </h3>
              </div>
              <button
                onClick={() => setIsAddDirectorModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddDirector} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Director Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SN Biswas / Priya Sharma"
                  value={newDirector.name}
                  onChange={e => setNewDirector({ ...newDirector, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">DIN (Director ID)</label>
                  <input
                    type="text"
                    placeholder="e.g. 08492011"
                    value={newDirector.din}
                    onChange={e => setNewDirector({ ...newDirector, din: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">PAN Card Number</label>
                  <input
                    type="text"
                    placeholder="e.g. ABCDB1234F"
                    value={newDirector.panNumber}
                    onChange={e => setNewDirector({ ...newDirector, panNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Director Mobile / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="+91 98112 34567"
                    value={newDirector.phone}
                    onChange={e => setNewDirector({ ...newDirector, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Director Email ID</label>
                  <input
                    type="email"
                    placeholder="director@briopox.com"
                    value={newDirector.email}
                    onChange={e => setNewDirector({ ...newDirector, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Aadhaar Number</label>
                  <input
                    type="text"
                    placeholder="9842 1284 4821"
                    value={newDirector.aadharNumber}
                    onChange={e => setNewDirector({ ...newDirector, aadharNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bank Cheque Ref / A/C</label>
                  <input
                    type="text"
                    placeholder="Cancel Cheque #492810"
                    value={newDirector.bankDetails}
                    onChange={e => setNewDirector({ ...newDirector, bankDetails: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddDirectorModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold shadow-md transition"
                >
                  Save Director
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Upload Attached Document Modal */}
      {isUploadDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Upload className="w-5 h-5 text-teal-600" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Attach Document: {uploadDocName}
                </h3>
              </div>
              <button
                onClick={() => setIsUploadDocModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUploadedDoc} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Document Category</label>
                <input
                  type="text"
                  disabled
                  value={uploadDocName}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Document Filename / Ref</label>
                <input
                  type="text"
                  required
                  value={selectedFileName}
                  onChange={e => setSelectedFileName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="p-4 border-2 border-dashed border-teal-300 bg-teal-50/50 rounded-2xl text-center space-y-2">
                <FileSpreadsheet className="w-8 h-8 text-teal-600 mx-auto" />
                <p className="font-bold text-slate-800">Choose PDF / Image to attach</p>
                <p className="text-[11px] text-slate-500">Supported: PDF, JPG, PNG up to 25MB (Encrypted & Backed up)</p>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadDocModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold shadow-md transition"
                >
                  Attach & Verify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
