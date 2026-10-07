// src/components/settings/RolePermissionsMatrixView.tsx
import React, { useState, useEffect } from 'react';
import {
  Check,
  Info,
  HelpCircle,
  Plus,
  Shield,
  Edit2,
  Trash2,
  Copy,
  ChevronRight,
  ExternalLink,
  Users,
  CheckSquare,
} from 'lucide-react';
import {
  PracticeRole,
  RolePermissions,
  DEFAULT_FULL_PERMISSIONS,
  getStoredRoles,
  saveStoredRoles,
} from '../../services/rolesService';

interface RolePermissionsMatrixViewProps {
  onBackToRolesList?: () => void;
  onSavedNotification?: (msg: string) => void;
  initialRole?: PracticeRole | null;
}

export const RolePermissionsMatrixView: React.FC<RolePermissionsMatrixViewProps> = ({
  onBackToRolesList,
  onSavedNotification,
  initialRole,
}) => {
  // Active Tab: General vs Segmented Access Control (as in Screenshot)
  const [activeTab, setActiveTab] = useState<'general' | 'segmented'>('segmented');

  // Role Form State
  const [roleName, setRoleName] = useState(initialRole?.name || '');
  const [roleDescription, setRoleDescription] = useState(initialRole?.description || '');
  const [roleId, setRoleId] = useState(initialRole?.id || '');

  // Permissions state initialized from initialRole or DEFAULT_FULL_PERMISSIONS
  const [permissions, setPermissions] = useState<RolePermissions>(
    initialRole?.permissions
      ? JSON.parse(JSON.stringify(initialRole.permissions))
      : JSON.parse(JSON.stringify(DEFAULT_FULL_PERMISSIONS))
  );

  // More permissions modal state
  const [activeMorePermsModal, setActiveMorePermsModal] = useState<'clients' | 'tasks' | null>(null);
  const [clientExtraPerms, setClientExtraPerms] = useState({
    exportExcel: true,
    importBulk: true,
    viewPanSensitive: true,
    mergeDuplicates: false,
  });
  const [taskExtraPerms, setTaskExtraPerms] = useState({
    assignToOthers: true,
    overrideDeadlines: false,
    deleteWorkpaperSnapshots: false,
    signOffAudits: true,
  });

  // Track existing roles for listing / quick-switch
  const [allRoles, setAllRoles] = useState<PracticeRole[]>([]);
  const [viewMode, setViewMode] = useState<'form' | 'list'>(initialRole ? 'form' : 'form');

  useEffect(() => {
    setAllRoles(getStoredRoles());
  }, []);

  // Update permissions helper for standard CRUD matrices (Clients, Tasks, Client Request, WorkPaper)
  const handleMatrixChange = (
    moduleKey: 'clients' | 'tasks' | 'clientRequest' | 'workPaper',
    field: 'full' | 'view' | 'create' | 'edit' | 'delete' | 'managedClientsOnly',
    checked: boolean
  ) => {
    setPermissions(prev => {
      const currentModule = { ...prev[moduleKey] } as any;

      if (field === 'full') {
        currentModule.full = checked;
        currentModule.view = checked;
        currentModule.create = checked;
        currentModule.edit = checked;
        currentModule.delete = checked;
      } else if (field === 'managedClientsOnly') {
        currentModule.managedClientsOnly = checked;
      } else {
        currentModule[field] = checked;
        // If all 4 are true, full becomes true; otherwise false
        const allActive =
          currentModule.view &&
          currentModule.create &&
          currentModule.edit &&
          currentModule.delete;
        currentModule.full = allActive;
      }

      return {
        ...prev,
        [moduleKey]: currentModule,
      };
    });
  };

  // Helper for Documents master checkbox
  const handleDocumentsMasterChange = (checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      documents: {
        full: checked,
        view: checked,
        upload: checked,
        delete: checked,
        manageFolder: checked,
      },
    }));
  };

  const handleDocumentSubChange = (
    field: 'view' | 'upload' | 'delete' | 'manageFolder',
    checked: boolean
  ) => {
    setPermissions(prev => {
      const updated = {
        ...prev.documents,
        [field]: checked,
      };
      const allActive = updated.view && updated.upload && updated.delete && updated.manageFolder;
      updated.full = allActive;
      return {
        ...prev,
        documents: updated,
      };
    });
  };

  // Helper for Settings master checkbox
  const handleSettingsMasterChange = (checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      settings: {
        full: checked,
        updateOrgProfile: checked,
        users: checked,
        exportData: checked,
        emailTemplate: checked,
        automation: checked,
        generalPreferences: checked,
      },
    }));
  };

  const handleSettingSubChange = (
    field:
      | 'updateOrgProfile'
      | 'users'
      | 'exportData'
      | 'emailTemplate'
      | 'automation'
      | 'generalPreferences',
    checked: boolean
  ) => {
    setPermissions(prev => {
      const updated = {
        ...prev.settings,
        [field]: checked,
      };
      const allActive =
        updated.updateOrgProfile &&
        updated.users &&
        updated.exportData &&
        updated.emailTemplate &&
        updated.automation &&
        updated.generalPreferences;
      updated.full = allActive;
      return {
        ...prev,
        settings: updated,
      };
    });
  };

  // Handle Save / Proceed
  const handleProceed = (e: React.FormEvent) => {
    e.preventDefault();

    if (!roleName.trim()) {
      alert('Please enter a Role Name.');
      return;
    }

    const currentStored = getStoredRoles();
    const targetId = roleId || `role_${Date.now()}`;

    const updatedRole: PracticeRole = {
      id: targetId,
      name: roleName.trim(),
      description: roleDescription.trim(),
      isSystem: initialRole?.isSystem || false,
      userCount: initialRole?.userCount || 0,
      permissions: permissions,
    };

    const existingIdx = currentStored.findIndex(r => r.id === targetId);
    let newRolesList: PracticeRole[];
    if (existingIdx >= 0) {
      newRolesList = [...currentStored];
      newRolesList[existingIdx] = updatedRole;
    } else {
      newRolesList = [...currentStored, updatedRole];
    }

    saveStoredRoles(newRolesList);
    setAllRoles(newRolesList);

    if (onSavedNotification) {
      onSavedNotification(`Role "${roleName}" has been successfully saved with granular permissions.`);
    }

    // Switch to role list or notify
    setViewMode('list');
  };

  const handleCreateFreshRole = () => {
    setRoleId('');
    setRoleName('');
    setRoleDescription('');
    setPermissions(JSON.parse(JSON.stringify(DEFAULT_FULL_PERMISSIONS)));
    setActiveTab('segmented');
    setViewMode('form');
  };

  const handleEditRole = (r: PracticeRole) => {
    setRoleId(r.id);
    setRoleName(r.name);
    setRoleDescription(r.description);
    setPermissions(JSON.parse(JSON.stringify(r.permissions)));
    setActiveTab('segmented');
    setViewMode('form');
  };

  return (
    <div className="flex-1 bg-white min-h-screen overflow-y-auto">
      {/* Top Header */}
      <div className="px-8 py-5 border-b border-slate-200 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-800">
              {viewMode === 'list' ? 'Roles & Access Control' : roleId ? `Edit Role: ${roleName}` : 'New Role'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure granular permissions for Chartered Accountants, Audit Associates, and Article Clerks.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {viewMode === 'form' && (
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-300 transition cursor-pointer"
            >
              View All Roles ({allRoles.length})
            </button>
          )}

          {viewMode === 'list' && (
            <button
              type="button"
              onClick={handleCreateFreshRole}
              className="px-3.5 py-1.5 text-xs font-semibold bg-[#00c073] hover:bg-[#00ab66] text-white rounded-lg shadow-sm transition inline-flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Role</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW MODE: LIST OF ROLES                                                  */}
      {/* ========================================================================= */}
      {viewMode === 'list' && (
        <div className="p-8 max-w-5xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {allRoles.map(role => (
              <div
                key={role.id}
                className="p-5 border border-slate-200 rounded-2xl bg-white shadow-2xs hover:shadow-md hover:border-emerald-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                        <Shield className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-slate-800 text-xs">{role.name}</h3>
                    </div>
                    {role.isSystem && (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        System
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-3 line-clamp-3 leading-relaxed">
                    {role.description || 'Custom staff role with specific permission bounds.'}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium text-[11px]">
                    {role.userCount ?? 1} Users assigned
                  </span>
                  <button
                    onClick={() => handleEditRole(role)}
                    className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Edit Permissions</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE: FORM (EXACT REPLICA OF SCREENSHOT 3)                           */}
      {/* ========================================================================= */}
      {viewMode === 'form' && (
        <form onSubmit={handleProceed} className="p-8 max-w-5xl space-y-7 text-xs">
          {/* Sub-tabs / Breadcrumbs matching Screenshot: ✓ General > Segmented Access Control */}
          <div className="flex items-center space-x-3 text-xs border-b border-slate-200 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`flex items-center space-x-1.5 pb-1 font-medium transition cursor-pointer ${
                activeTab === 'general'
                  ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                ✓
              </div>
              <span>General</span>
            </button>

            <span className="text-slate-400 font-bold">&gt;</span>

            <button
              type="button"
              onClick={() => setActiveTab('segmented')}
              className={`pb-1 font-medium transition cursor-pointer ${
                activeTab === 'segmented'
                  ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Segmented Access Control</span>
            </button>
          </div>

          {/* Form Meta Fields: Role Name* & Description */}
          <div className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Role Name<span className="text-rose-500 font-bold ml-0.5">*</span>
              </label>
              <input
                type="text"
                required
                value={roleName}
                onChange={e => setRoleName(e.target.value)}
                placeholder="e.g. Audit Manager or Senior Tax Associate"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-2xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">Description</label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {roleDescription.length}/500
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={500}
                value={roleDescription}
                onChange={e => setRoleDescription(e.target.value)}
                placeholder="Max. 500 characters"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-2xs resize-none"
              />
            </div>
          </div>

          {/* ===================================================================== */}
          {/* PERMISSION MATRICES EXACTLY AS IN SCREENSHOT 3                        */}
          {/* ===================================================================== */}

          {/* 1. Clients Section */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Clients</h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                    <th className="py-2.5 px-4 w-44">Particulars</th>
                    <th className="py-2.5 px-3 text-center w-20">Full</th>
                    <th className="py-2.5 px-3 text-center w-20">View</th>
                    <th className="py-2.5 px-3 text-center w-20">Create</th>
                    <th className="py-2.5 px-3 text-center w-20">Edit</th>
                    <th className="py-2.5 px-3 text-center w-20">Delete</th>
                    <th className="py-2.5 px-4 text-left">Others</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4 font-medium text-slate-700">Clients</td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={permissions.clients.full}
                        onChange={e => handleMatrixChange('clients', 'full', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={permissions.clients.view}
                        onChange={e => handleMatrixChange('clients', 'view', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={permissions.clients.create}
                        onChange={e => handleMatrixChange('clients', 'create', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={permissions.clients.edit}
                        onChange={e => handleMatrixChange('clients', 'edit', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={permissions.clients.delete}
                        onChange={e => handleMatrixChange('clients', 'delete', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => setActiveMorePermsModal('clients')}
                        className="text-blue-600 hover:text-blue-700 hover:underline font-medium text-xs cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>More Permissions</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Sub-constraint checkbox: Allow users to handle the data for managed clients only */}
              <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex items-center space-x-2.5">
                <input
                  type="checkbox"
                  id="chk-managed-clients"
                  checked={permissions.clients.managedClientsOnly}
                  onChange={e =>
                    handleMatrixChange('clients', 'managedClientsOnly', e.target.checked)
                  }
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                />
                <label
                  htmlFor="chk-managed-clients"
                  className="text-xs text-slate-700 cursor-pointer font-medium"
                >
                  Allow users to handle the data for managed clients only.
                </label>
              </div>
            </div>
          </div>

          {/* 2. Tasks Section */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Tasks</h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                    <th className="py-2.5 px-4 w-44">Particulars</th>
                    <th className="py-2.5 px-3 text-center w-20">Full</th>
                    <th className="py-2.5 px-3 text-center w-20">View</th>
                    <th className="py-2.5 px-3 text-center w-20">Create</th>
                    <th className="py-2.5 px-3 text-center w-20">Edit</th>
                    <th className="py-2.5 px-3 text-center w-20">Delete</th>
                    <th className="py-2.5 px-4 text-left">Others</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4 font-medium text-slate-700">Tasks</td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={permissions.tasks.full}
                        onChange={e => handleMatrixChange('tasks', 'full', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={permissions.tasks.view}
                        onChange={e => handleMatrixChange('tasks', 'view', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={permissions.tasks.create}
                        onChange={e => handleMatrixChange('tasks', 'create', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={permissions.tasks.edit}
                        onChange={e => handleMatrixChange('tasks', 'edit', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={permissions.tasks.delete}
                        onChange={e => handleMatrixChange('tasks', 'delete', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => setActiveMorePermsModal('tasks')}
                        className="text-blue-600 hover:text-blue-700 hover:underline font-medium text-xs cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>More Permissions</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Client Request Section */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Client Request</h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                    <th className="py-2.5 px-4 w-44">Particulars</th>
                    <th className="py-2.5 px-3 text-center w-20">Full</th>
                    <th className="py-2.5 px-3 text-center w-20">View</th>
                    <th className="py-2.5 px-3 text-center w-20">Create</th>
                    <th className="py-2.5 px-3 text-center w-20">Edit</th>
                    <th className="py-2.5 px-3 text-center w-20">Delete</th>
                    <th className="py-2.5 px-4 text-left">Others</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4 font-medium text-slate-700">Client Request</td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={permissions.clientRequest.full}
                        onChange={e =>
                          handleMatrixChange('clientRequest', 'full', e.target.checked)
                        }
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={permissions.clientRequest.view}
                        onChange={e =>
                          handleMatrixChange('clientRequest', 'view', e.target.checked)
                        }
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={permissions.clientRequest.create}
                        onChange={e =>
                          handleMatrixChange('clientRequest', 'create', e.target.checked)
                        }
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={permissions.clientRequest.edit}
                        onChange={e =>
                          handleMatrixChange('clientRequest', 'edit', e.target.checked)
                        }
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={permissions.clientRequest.delete}
                        onChange={e =>
                          handleMatrixChange('clientRequest', 'delete', e.target.checked)
                        }
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4 text-slate-400">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. WorkPaper Section */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">WorkPaper</h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                    <th className="py-2.5 px-4 w-44">Particulars</th>
                    <th className="py-2.5 px-3 text-center w-20">Full</th>
                    <th className="py-2.5 px-3 text-center w-20">View</th>
                    <th className="py-2.5 px-3 text-center w-20">Create</th>
                    <th className="py-2.5 px-3 text-center w-20">Edit</th>
                    <th className="py-2.5 px-3 text-center w-20">Delete</th>
                    <th className="py-2.5 px-4 text-left">Others</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4 font-medium text-slate-700">WorkPaper</td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={permissions.workPaper.full}
                        onChange={e => handleMatrixChange('workPaper', 'full', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={permissions.workPaper.view}
                        onChange={e => handleMatrixChange('workPaper', 'view', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={permissions.workPaper.create}
                        onChange={e => handleMatrixChange('workPaper', 'create', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={permissions.workPaper.edit}
                        onChange={e => handleMatrixChange('workPaper', 'edit', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={permissions.workPaper.delete}
                        onChange={e => handleMatrixChange('workPaper', 'delete', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4 text-slate-400">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. Documents Section */}
          <div className="space-y-3 pt-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="chk-master-documents"
                checked={permissions.documents.full}
                onChange={e => handleDocumentsMasterChange(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
              />
              <label
                htmlFor="chk-master-documents"
                className="text-xs font-bold text-slate-800 cursor-pointer"
              >
                Documents
              </label>
            </div>

            <div className="pl-6 space-y-2.5">
              <label className="flex items-center space-x-2 text-slate-700 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={permissions.documents.view}
                  onChange={e => handleDocumentSubChange('view', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                />
                <span>View Documents</span>
              </label>

              <label className="flex items-center space-x-2 text-slate-700 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={permissions.documents.upload}
                  onChange={e => handleDocumentSubChange('upload', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                />
                <span>Upload Documents</span>
              </label>

              <label className="flex items-center space-x-2 text-slate-700 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={permissions.documents.delete}
                  onChange={e => handleDocumentSubChange('delete', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                />
                <span>Delete Documents</span>
              </label>

              <label className="flex items-center space-x-2 text-slate-700 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={permissions.documents.manageFolder}
                  onChange={e => handleDocumentSubChange('manageFolder', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                />
                <span>Manage Folder</span>
              </label>
            </div>
          </div>

          {/* 6. Settings Section */}
          <div className="space-y-3 pt-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="chk-master-settings"
                checked={permissions.settings.full}
                onChange={e => handleSettingsMasterChange(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
              />
              <label
                htmlFor="chk-master-settings"
                className="text-xs font-bold text-slate-800 cursor-pointer"
              >
                Settings
              </label>
            </div>

            <div className="pl-6 space-y-2.5">
              <label className="flex items-center space-x-2 text-slate-700 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={permissions.settings.updateOrgProfile}
                  onChange={e => handleSettingSubChange('updateOrgProfile', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                />
                <span>Update organization profile</span>
              </label>

              <label className="flex items-center space-x-2 text-slate-700 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={permissions.settings.users}
                  onChange={e => handleSettingSubChange('users', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                />
                <span>Users</span>
              </label>

              <label className="flex items-center space-x-2 text-slate-700 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={permissions.settings.exportData}
                  onChange={e => handleSettingSubChange('exportData', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                />
                <span>Export data</span>
              </label>

              <label className="flex items-center space-x-2 text-slate-700 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={permissions.settings.emailTemplate}
                  onChange={e => handleSettingSubChange('emailTemplate', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                />
                <span>Email Template</span>
              </label>

              <label className="flex items-center space-x-2 text-slate-700 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={permissions.settings.automation}
                  onChange={e => handleSettingSubChange('automation', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                />
                <span>Automation</span>
                <span title="Configures automated reminder intervals, WhatsApp triggers, and intake dispatch schedules">
                  <Info className="w-3.5 h-3.5 text-amber-500 cursor-pointer" />
                </span>
              </label>

              <label className="flex items-center space-x-2 text-slate-700 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={permissions.settings.generalPreferences}
                  onChange={e => handleSettingSubChange('generalPreferences', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                />
                <span>General preferences</span>
                <span title="Configures default currency format (₹ INR), fiscal year view, and Indian date format (DD/MM/YYYY)">
                  <Info className="w-3.5 h-3.5 text-amber-500 cursor-pointer" />
                </span>
              </label>
            </div>
          </div>

          {/* Bottom Action Bar: [Proceed] [Cancel] */}
          <div className="pt-6 border-t border-slate-200 flex items-center space-x-3">
            <button
              type="submit"
              className="px-6 py-2 bg-[#00c073] hover:bg-[#00ab66] text-white text-xs font-semibold rounded-md shadow-xs transition inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Proceed</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (onBackToRolesList) {
                  onBackToRolesList();
                } else {
                  setViewMode('list');
                }
              }}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* More Permissions Modal (Clients or Tasks) */}
      {activeMorePermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">
                More Permissions: {activeMorePermsModal === 'clients' ? 'Clients' : 'Tasks'}
              </h3>
              <button
                onClick={() => setActiveMorePermsModal(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {activeMorePermsModal === 'clients' && (
              <div className="space-y-3 text-xs text-slate-700">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={clientExtraPerms.exportExcel}
                    onChange={e =>
                      setClientExtraPerms({ ...clientExtraPerms, exportExcel: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                  />
                  <span>Export Client Directory to Excel / CSV</span>
                </label>
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={clientExtraPerms.importBulk}
                    onChange={e =>
                      setClientExtraPerms({ ...clientExtraPerms, importBulk: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                  />
                  <span>Bulk Import Clients via GSTN Portal Bridge</span>
                </label>
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={clientExtraPerms.viewPanSensitive}
                    onChange={e =>
                      setClientExtraPerms({
                        ...clientExtraPerms,
                        viewPanSensitive: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                  />
                  <span>View Unmasked PAN, Aadhaar & Bank Details</span>
                </label>
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={clientExtraPerms.mergeDuplicates}
                    onChange={e =>
                      setClientExtraPerms({
                        ...clientExtraPerms,
                        mergeDuplicates: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                  />
                  <span>Merge Duplicate Client Records</span>
                </label>
              </div>
            )}

            {activeMorePermsModal === 'tasks' && (
              <div className="space-y-3 text-xs text-slate-700">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={taskExtraPerms.assignToOthers}
                    onChange={e =>
                      setTaskExtraPerms({ ...taskExtraPerms, assignToOthers: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                  />
                  <span>Reassign Tasks & Audit Checklists to Others</span>
                </label>
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={taskExtraPerms.overrideDeadlines}
                    onChange={e =>
                      setTaskExtraPerms({
                        ...taskExtraPerms,
                        overrideDeadlines: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                  />
                  <span>Override Statutory Due Dates & SLA Turnaround</span>
                </label>
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={taskExtraPerms.deleteWorkpaperSnapshots}
                    onChange={e =>
                      setTaskExtraPerms({
                        ...taskExtraPerms,
                        deleteWorkpaperSnapshots: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                  />
                  <span>Delete Frozen Working Paper Snapshots</span>
                </label>
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={taskExtraPerms.signOffAudits}
                    onChange={e =>
                      setTaskExtraPerms({ ...taskExtraPerms, signOffAudits: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                  />
                  <span>Final Statutory CA Sign-Off & UDIN Verification</span>
                </label>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveMorePermsModal(null)}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Apply & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
