// src/components/settings/OrgBranchesView.tsx
import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  MapPin,
  Phone,
  Mail,
  UserCheck,
  Edit2,
  Trash2,
  CheckCircle2,
  Shield,
  Search,
  Save,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  X,
  Check,
} from 'lucide-react';
import { FirmBrandingConfig } from '../../services/brandingService';

export interface PracticeBranch {
  id: string;
  name: string;
  code: string;
  isHeadOffice: boolean;
  icaiBranchCode: string;
  inChargePartner: string;
  partnerMembershipNo: string;
  phone: string;
  email: string;
  gstin: string;
  jurisdictionCircle: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  assignedClientsCount: number;
  assignedStaffCount: number;
  status: 'active' | 'inactive';
}

const DEFAULT_BRANCHES: PracticeBranch[] = [
  {
    id: 'br_mumbai_ho',
    name: 'Head Office (Mumbai BKC)',
    code: 'HO-MUM',
    isHeadOffice: true,
    icaiBranchCode: 'FRN-104523W/HO',
    inChargePartner: 'CA Suraj Dutta (Senior Partner)',
    partnerMembershipNo: 'FCA 089452',
    phone: '+91 98200 11111',
    email: 'mumbai@quinceca.com',
    gstin: '27AAAFQ1234M1Z5',
    jurisdictionCircle: 'Circle 8(1), Aayakar Bhavan, Mumbai',
    addressLine1: 'Suite 402, Express Towers, Nariman Point',
    addressLine2: 'Financial District',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400021',
    assignedClientsCount: 18,
    assignedStaffCount: 6,
    status: 'active',
  },
  {
    id: 'br_delhi_ro',
    name: 'Delhi NCR Regional Branch',
    code: 'BO-DEL',
    isHeadOffice: false,
    icaiBranchCode: 'FRN-104523W/DEL-01',
    inChargePartner: 'CA Rajesh Sharma (Partner)',
    partnerMembershipNo: 'FCA 094321',
    phone: '+91 98110 22222',
    email: 'delhi@quinceca.com',
    gstin: '07AAAFQ1234M1Z2',
    jurisdictionCircle: 'Ward 14(2), Civic Centre, New Delhi',
    addressLine1: 'Level 5, Statesman House, Barakhamba Road',
    addressLine2: 'Connaught Place',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    assignedClientsCount: 7,
    assignedStaffCount: 3,
    status: 'active',
  },
  {
    id: 'br_blr_bo',
    name: 'Bengaluru Tech Branch',
    code: 'BO-BLR',
    isHeadOffice: false,
    icaiBranchCode: 'FRN-104523W/BLR-02',
    inChargePartner: 'CA Pooja Verma (Associate Partner)',
    partnerMembershipNo: 'ACA 112450',
    phone: '+91 99800 33333',
    email: 'bengaluru@quinceca.com',
    gstin: '29AAAFQ1234M1Z9',
    jurisdictionCircle: 'Range 3, Queens Road, Bengaluru',
    addressLine1: '4th Floor, Prestige Meridian, MG Road',
    addressLine2: 'Central Business District',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    assignedClientsCount: 4,
    assignedStaffCount: 2,
    status: 'active',
  },
];

interface OrgBranchesViewProps {
  firmBranding: FirmBrandingConfig;
  currentUser?: any;
  onSavedNotification?: (msg: string) => void;
  onClose?: () => void;
  isDialogMode?: boolean;
}

export const OrgBranchesView: React.FC<OrgBranchesViewProps> = ({
  firmBranding,
  currentUser,
  onSavedNotification,
  onClose,
  isDialogMode = false,
}) => {
  const [branches, setBranches] = useState<PracticeBranch[]>(() => {
    try {
      const stored = localStorage.getItem('quinceca_practice_branches');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      // fallback
    }
    return DEFAULT_BRANCHES;
  });

  const [searchFilter, setSearchFilter] = useState('');
  const [editingBranch, setEditingBranch] = useState<PracticeBranch | null>(null);
  const [isNewBranchModalOpen, setIsNewBranchModalOpen] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // New/Edit branch form state
  const [formData, setFormData] = useState<Partial<PracticeBranch>>({
    name: '',
    code: '',
    isHeadOffice: false,
    icaiBranchCode: '',
    inChargePartner: '',
    partnerMembershipNo: '',
    phone: '',
    email: '',
    gstin: '',
    jurisdictionCircle: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: 'Maharashtra',
    pincode: '',
    status: 'active',
  });

  const saveBranchesToStorage = (updated: PracticeBranch[]) => {
    setBranches(updated);
    try {
      localStorage.setItem('quinceca_practice_branches', JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
    setSaveSuccessMsg('Practice branch directory updated and synchronized successfully.');
    if (onSavedNotification) onSavedNotification('Practice branch configuration saved.');
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const handleOpenNewBranch = () => {
    setFormData({
      id: `br_${Date.now()}`,
      name: '',
      code: `BO-${Math.floor(100 + Math.random() * 900)}`,
      isHeadOffice: false,
      icaiBranchCode: `FRN-104523W/BO-${branches.length + 1}`,
      inChargePartner: currentUser?.displayName || 'CA Suraj Dutta',
      partnerMembershipNo: 'FCA 089452',
      phone: '+91 ',
      email: `branch${branches.length + 1}@${firmBranding.firmName.toLowerCase().replace(/\s+/g, '')}.com`,
      gstin: '',
      jurisdictionCircle: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: 'Maharashtra',
      pincode: '',
      assignedClientsCount: 0,
      assignedStaffCount: 1,
      status: 'active',
    });
    setEditingBranch(null);
    setIsNewBranchModalOpen(true);
  };

  const handleEditBranch = (b: PracticeBranch) => {
    setFormData({ ...b });
    setEditingBranch(b);
    setIsNewBranchModalOpen(true);
  };

  const handleDeleteBranch = (id: string) => {
    const target = branches.find(b => b.id === id);
    if (target?.isHeadOffice) {
      alert('The designated Head Office branch cannot be deleted. Promote another branch to Head Office first.');
      return;
    }
    if (window.confirm(`Are you sure you want to remove the branch "${target?.name}"?`)) {
      const updated = branches.filter(b => b.id !== id);
      saveBranchesToStorage(updated);
    }
  };

  const handleSaveBranchForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    let updated: PracticeBranch[];
    if (editingBranch) {
      updated = branches.map(b => (b.id === editingBranch.id ? ({ ...b, ...formData } as PracticeBranch) : b));
    } else {
      const newBranch: PracticeBranch = {
        id: formData.id || `br_${Date.now()}`,
        name: formData.name.trim(),
        code: formData.code || `BO-${branches.length + 1}`,
        isHeadOffice: !!formData.isHeadOffice,
        icaiBranchCode: formData.icaiBranchCode || 'FRN-104523W',
        inChargePartner: formData.inChargePartner || 'Managing Partner',
        partnerMembershipNo: formData.partnerMembershipNo || 'FCA',
        phone: formData.phone || '',
        email: formData.email || '',
        gstin: formData.gstin || '',
        jurisdictionCircle: formData.jurisdictionCircle || '',
        addressLine1: formData.addressLine1 || '',
        addressLine2: formData.addressLine2 || '',
        city: formData.city || '',
        state: formData.state || 'Maharashtra',
        pincode: formData.pincode || '',
        assignedClientsCount: formData.assignedClientsCount || 0,
        assignedStaffCount: formData.assignedStaffCount || 1,
        status: formData.status || 'active',
      };
      updated = [...branches, newBranch];
    }

    // If marked as Head Office, ensure others are not HO
    if (formData.isHeadOffice) {
      updated = updated.map(b => ({
        ...b,
        isHeadOffice: b.id === (editingBranch?.id || formData.id),
      }));
    }

    saveBranchesToStorage(updated);
    setIsNewBranchModalOpen(false);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset branches to default Mumbai, Delhi, and Bengaluru locations?')) {
      saveBranchesToStorage(DEFAULT_BRANCHES);
    }
  };

  const filteredBranches = branches.filter(b => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.city.toLowerCase().includes(q) ||
      b.code.toLowerCase().includes(q) ||
      b.inChargePartner.toLowerCase().includes(q) ||
      b.gstin.toLowerCase().includes(q)
    );
  });

  return (
    <div className={`${isDialogMode ? 'p-2' : 'p-6 max-w-6xl mx-auto'} space-y-6 animate-in fade-in duration-150`}>
      {/* Header bar */}
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800">Practice Branch Offices</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage ICAI registered multi-city branches, jurisdictional circles, and in-charge partners.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-2xs flex items-center space-x-1"
            title="Reset to default branches"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <button
            type="button"
            onClick={handleOpenNewBranch}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Branch</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg transition"
            >
              Back
            </button>
          )}
        </div>
      </div>

      {/* Success Alert */}
      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-800 text-xs animate-in slide-in-from-top-1">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{saveSuccessMsg}</span>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Branches</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-800">{branches.length}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
              {branches.filter(b => b.status === 'active').length} Active
            </span>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Head Office</span>
          <div className="mt-1">
            <span className="text-sm font-bold text-slate-800 block truncate">
              {branches.find(b => b.isHeadOffice)?.city || 'Mumbai'}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {branches.find(b => b.isHeadOffice)?.code || 'HO-MUM'}
            </span>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Clients Served</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-indigo-700">
              {branches.reduce((acc, b) => acc + (b.assignedClientsCount || 0), 0)}
            </span>
            <span className="text-[10px] text-slate-500">Across Branches</span>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Practice Staff</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-teal-700">
              {branches.reduce((acc, b) => acc + (b.assignedStaffCount || 0), 0)}
            </span>
            <span className="text-[10px] text-slate-500">Allocated</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          value={searchFilter}
          onChange={e => setSearchFilter(e.target.value)}
          placeholder="Filter branches by name, city, partner, or GSTIN..."
          className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-white shadow-2xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
        />
      </div>

      {/* Branches List */}
      <div className="space-y-3">
        {filteredBranches.map(branch => (
          <div
            key={branch.id}
            className="p-4 bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl shadow-2xs transition-all space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                    branch.isHeadOffice
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {branch.code.substring(0, 3)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-slate-800">{branch.name}</h3>
                    {branch.isHeadOffice && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Head Office
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        branch.status === 'active'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {branch.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center space-x-2 mt-0.5">
                    <span>ICAI Code: <strong className="text-slate-700">{branch.icaiBranchCode}</strong></span>
                    <span>•</span>
                    <span>GSTIN: <strong className="font-mono text-slate-700">{branch.gstin || '27AAAFQ1234M1Z5'}</strong></span>
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleEditBranch(branch)}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 border border-slate-200 rounded-lg transition flex items-center space-x-1 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
                {!branch.isHeadOffice && (
                  <button
                    type="button"
                    onClick={() => handleDeleteBranch(branch.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="Remove branch"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-start space-x-2 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-slate-700 block">{branch.addressLine1}</span>
                  <span className="text-slate-500 text-[11px]">
                    {branch.city}, {branch.state} - {branch.pincode}
                  </span>
                </div>
              </div>

              <div className="flex items-start space-x-2 text-slate-600">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800 block">{branch.inChargePartner}</span>
                  <span className="text-slate-500 text-[11px]">Membership: {branch.partnerMembershipNo}</span>
                </div>
              </div>

              <div className="flex items-start space-x-2 text-slate-600">
                <Shield className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-slate-700 block truncate">{branch.jurisdictionCircle || 'Circle 8(1)'}</span>
                  <span className="text-slate-500 text-[11px]">
                    {branch.assignedClientsCount} Clients • {branch.assignedStaffCount} Staff
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Add/Edit Branch */}
      {isNewBranchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-extrabold text-slate-800">
                  {editingBranch ? `Edit Branch: ${editingBranch.name}` : 'Add Practice Branch Office'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewBranchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBranchForm} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Branch Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Pune Regional Office"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Branch Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.code || ''}
                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. BO-PUN"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">ICAI Branch Code</label>
                  <input
                    type="text"
                    value={formData.icaiBranchCode || ''}
                    onChange={e => setFormData({ ...formData, icaiBranchCode: e.target.value })}
                    placeholder="e.g. FRN-104523W/PUN-03"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">In-Charge Partner *</label>
                  <input
                    type="text"
                    required
                    value={formData.inChargePartner || ''}
                    onChange={e => setFormData({ ...formData, inChargePartner: e.target.value })}
                    placeholder="e.g. CA Arun Kulkarni"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">ICAI Membership No.</label>
                  <input
                    type="text"
                    value={formData.partnerMembershipNo || ''}
                    onChange={e => setFormData({ ...formData, partnerMembershipNo: e.target.value })}
                    placeholder="e.g. FCA 104822"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Address Line 1 *</label>
                  <input
                    type="text"
                    required
                    value={formData.addressLine1 || ''}
                    onChange={e => setFormData({ ...formData, addressLine1: e.target.value })}
                    placeholder="Office/Building, Floor, Road"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.city || ''}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Pune"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={formData.state || ''}
                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                    placeholder="e.g. Maharashtra"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={formData.pincode || ''}
                    onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="411001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Branch GSTIN</label>
                  <input
                    type="text"
                    maxLength={15}
                    value={formData.gstin || ''}
                    onChange={e => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    placeholder="27AAAFQ1234M1Z5"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase"
                  />
                </div>

                <div className="col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Jurisdictional Tax Circle / Ward</label>
                  <input
                    type="text"
                    value={formData.jurisdictionCircle || ''}
                    onChange={e => setFormData({ ...formData, jurisdictionCircle: e.target.value })}
                    placeholder="e.g. Circle 2(1), PMT Commercial Building, Pune"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98200 12345"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="pune@quinceca.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center space-x-4 border-t border-slate-100">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!formData.isHeadOffice}
                    onChange={e => setFormData({ ...formData, isHeadOffice: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-slate-700">Designate as Head Office</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.status === 'active'}
                    onChange={e => setFormData({ ...formData, status: e.target.checked ? 'active' : 'inactive' })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-slate-700">Active Status</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewBranchModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg border border-slate-300 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingBranch ? 'Update Branch' : 'Create Branch'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
