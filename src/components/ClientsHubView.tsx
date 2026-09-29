// src/components/ClientsHubView.tsx
import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Building2,
  Phone,
  Mail,
  Edit2,
  Trash2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import { ClientManagementModal } from './ClientManagementModal.tsx';

interface ClientsHubViewProps {
  onOpenClientPortal: (token: string) => void;
  onRefreshParent?: () => void;
}

export const ClientsHubView: React.FC<ClientsHubViewProps> = ({
  onOpenClientPortal,
  onRefreshParent,
}) => {
  const [clientsList, setClientsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editClientId, setEditClientId] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/clients');
      if (res.ok) {
        const data = await res.json();
        setClientsList(data);
      }
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = clientsList.filter(c => {
    const q = searchTerm.toLowerCase();
    return (
      c.businessName?.toLowerCase().includes(q) ||
      c.gstin?.toLowerCase().includes(q) ||
      c.contactPerson?.toLowerCase().includes(q) ||
      c.registeredPhone?.includes(q)
    );
  });

  const handleEdit = (clientId: string) => {
    setEditClientId(clientId);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditClientId(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="theme-banner text-white rounded-3xl p-6 sm:p-8 shadow-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase tracking-wider theme-accent-text font-bold">
              Practice Management
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full theme-badge border font-semibold">
              Master Directory
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
            Client Companies & Profiles
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Maintain statutory GSTIN records, bank account checklists, assigned associates, and WhatsApp contact details.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchClients}
            disabled={loading}
            className="p-2.5 bg-black/30 hover:bg-black/50 text-slate-200 rounded-xl border border-white/10 transition"
            title="Refresh Client Records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-400' : ''}`} />
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Onboard New Client</span>
          </button>
        </div>
      </div>

      {/* Search & Statistics Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by company name, GSTIN, contact person, or phone..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-500 transition"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <strong>{filteredClients.length}</strong> of <strong>{clientsList.length}</strong> registered businesses
        </div>
      </div>

      {/* Clients Grid / Cards */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading client directory...</div>
      ) : filteredClients.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-800">No client businesses matched your search</p>
          <p className="text-xs text-slate-400 mt-1">Try a different keyword or onboard a new client.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map(client => (
            <div
              key={client.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-teal-500/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 font-extrabold flex items-center justify-center text-sm border border-teal-100">
                      {client.businessName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 leading-tight">
                        {client.businessName}
                      </h3>
                      <span className="font-mono text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60 inline-block mt-0.5 font-semibold">
                        {client.gstin}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    client.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {client.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 mt-3 border-t border-slate-100 pt-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400 font-medium w-16">Contact:</span>
                    <span className="font-semibold text-slate-800">{client.contactPerson}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono">{client.registeredPhone}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                    <span className="text-slate-400 font-medium w-16">Assigned:</span>
                    <span>{client.assignedStaffName || 'CA Firm Team'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleEdit(client.id)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit Profile</span>
                </button>

                <button
                  onClick={() => onOpenClientPortal(client.id)}
                  className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-semibold flex items-center space-x-1 border border-teal-200/60 transition"
                  title="Open simulated Client Upload Portal for this client"
                >
                  <span>Client View</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Onboard Client Modal */}
      {isModalOpen && (
        <ClientManagementModal
          isOpen={isModalOpen}
          initialEditClientId={editClientId}
          onClose={() => {
            setIsModalOpen(false);
            setEditClientId(null);
          }}
          onClientAddedOrUpdated={() => {
            fetchClients();
            if (onRefreshParent) onRefreshParent();
          }}
          onClearEditClientId={() => setEditClientId(null)}
        />
      )}
    </div>
  );
};
