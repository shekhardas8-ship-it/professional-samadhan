// src/components/settings/UsersManagementView.tsx
import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  Shield,
  ShieldAlert,
  CheckCircle,
  MoreVertical,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  AlertTriangle,
  X,
  Save,
  RefreshCw,
  Check,
} from 'lucide-react';
import { PracticeRole, getStoredRoles } from '../../services/rolesService';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  roleId: string;
  roleName: string;
  designation?: string;
  status: 'active' | 'invited' | 'suspended';
  active?: boolean;
  assignedClientsCount: number;
  assignedClientIds?: string[];
  createdAt?: string;
}

interface UsersManagementViewProps {
  currentUser?: any;
  isSuperAdmin?: boolean;
}

export const UsersManagementView: React.FC<UsersManagementViewProps> = ({
  currentUser,
  isSuperAdmin: externalIsSuperAdmin,
}) => {
  const isSuper =
    externalIsSuperAdmin ||
    currentUser?.role === 'superadmin' ||
    currentUser?.email?.toLowerCase() === 'shekhardas8@gmail.com' ||
    currentUser?.isSuperAdmin === true;

  const roles = getStoredRoles();

  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserAccount | null>(null);

  // New user form state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'staff',
    designation: 'Senior Associate (Reviewer)',
    status: 'active' as 'active' | 'invited' | 'suspended',
  });

  // Edit user form state
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'staff',
    designation: '',
    status: 'active' as 'active' | 'invited' | 'suspended',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        if (data.users && Array.isArray(data.users)) {
          setUsers(data.users);
          return;
        }
      }
      throw new Error('Failed to load users');
    } catch (e) {
      console.warn('Using local fallback users:', e);
      // Fallback initial list
      setUsers([
        {
          id: 'superadmin_shekhar_01',
          name: 'Shekhar Das (Super Admin)',
          email: 'shekhardas8@gmail.com',
          phone: '+919873875138',
          role: 'superadmin',
          roleId: 'role_superadmin',
          roleName: 'Platform Super Administrator',
          designation: 'Platform Super Administrator',
          status: 'active',
          assignedClientsCount: 0,
        },
        {
          id: 'u_1',
          name: 'CA Suraj Dutta (FCA)',
          email: 'suraj.dutta@quinceca.com',
          phone: '+91 98200 11111',
          role: 'ca_admin',
          roleId: 'role_partner',
          roleName: 'Managing Partner (CA Admin)',
          designation: 'Managing Partner (CA Admin)',
          status: 'active',
          assignedClientsCount: 48,
        },
        {
          id: 'u_2',
          name: 'Pooja Verma (Associate)',
          email: 'pooja.verma@quinceca.com',
          phone: '+91 98200 22222',
          role: 'staff',
          roleId: 'role_senior_associate',
          roleName: 'Senior Associate (Reviewer)',
          designation: 'Senior Associate (Reviewer)',
          status: 'active',
          assignedClientsCount: 24,
        },
        {
          id: 'u_3',
          name: 'Rahul Sharma',
          email: 'rahul.s@quinceca.com',
          phone: '+91 98200 33333',
          role: 'staff',
          roleId: 'role_article_clerk',
          roleName: 'Article Clerk (Assistant)',
          designation: 'Article Clerk (Assistant)',
          status: 'active',
          assignedClientsCount: 12,
        },
        {
          id: 'u_4',
          name: 'Sneha Patel',
          email: 'sneha.p@quinceca.com',
          phone: '+91 98200 44444',
          role: 'staff',
          roleId: 'role_article_clerk',
          roleName: 'Article Clerk (Assistant)',
          designation: 'Article Clerk (Assistant)',
          status: 'invited',
          assignedClientsCount: 0,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle Add User
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim()) return;

    try {
      setActionLoading(true);
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUser.name.trim(),
          email: newUser.email.trim(),
          phone: newUser.phone.trim(),
          role: newUser.role,
          designation: newUser.designation.trim() || undefined,
          status: newUser.status,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      showToast(`User ${newUser.name} added successfully!`);
      setShowAddModal(false);
      setNewUser({
        name: '',
        email: '',
        phone: '',
        role: 'staff',
        designation: 'Senior Associate (Reviewer)',
        status: 'active',
      });
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Error creating user');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (user: UserAccount) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role || 'staff',
      designation: user.designation || user.roleName || '',
      status: user.status || 'active',
    });
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setActionLoading(true);
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editFormData.name.trim(),
          email: editFormData.email.trim(),
          phone: editFormData.phone.trim(),
          role: editFormData.role,
          designation: editFormData.designation.trim(),
          status: editFormData.status,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update user');
      }

      showToast(`User ${editFormData.name} updated successfully!`);
      setEditingUser(null);
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Error updating user');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete User
  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;

    try {
      setActionLoading(true);
      const res = await fetch(`/api/users/${deletingUser.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      showToast(`User ${deletingUser.name} deleted successfully!`);
      setDeletingUser(null);
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Error deleting user');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.roleName.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone && u.phone.includes(search));

    const matchesRole =
      roleFilter === 'all' ||
      (roleFilter === 'superadmin' && u.role === 'superadmin') ||
      (roleFilter === 'ca_admin' && (u.role === 'ca_admin' || u.roleId === 'role_partner')) ||
      (roleFilter === 'staff' && (u.role === 'staff' || u.roleId.includes('associate') || u.roleId.includes('clerk'))) ||
      (roleFilter === 'client' && u.role === 'client');

    return matchesSearch && matchesRole;
  });

  return (
    <div className="flex-1 bg-white min-h-screen overflow-y-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2.5 text-xs font-semibold animate-in slide-in-from-top-3 border border-slate-700">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="px-8 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-800">Users & Staff Accounts</h1>
            {isSuper && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-700 border border-purple-300">
                Super Admin Access
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage partners, senior associates, article clerks, and system administrators with assigned security roles.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer"
            title="Refresh Users"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 text-xs font-semibold bg-[#00c073] hover:bg-[#00ab66] text-white rounded-lg shadow-sm transition inline-flex items-center space-x-1.5 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add / Invite User</span>
          </button>
        </div>
      </div>

      <div className="p-8 max-w-6xl space-y-6">
        {/* Search, Filter & Stats Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, or contact number..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Role Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Security Roles</option>
                <option value="superadmin">Super Administrators</option>
                <option value="ca_admin">CA Partners (Admins)</option>
                <option value="staff">Staff & Associates</option>
                <option value="client">Client Accounts</option>
              </select>
            </div>
          </div>

          {/* Stats Badges */}
          <div className="flex items-center space-x-3 text-xs text-slate-500 font-medium shrink-0">
            <span>Total: <strong className="text-slate-800">{users.length}</strong></span>
            <span>•</span>
            <span>Active: <strong className="text-emerald-700">{users.filter(u => u.status === 'active').length}</strong></span>
            <span>•</span>
            <span>Invited: <strong className="text-amber-700">{users.filter(u => u.status === 'invited').length}</strong></span>
          </div>
        </div>

        {/* Users Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                <th className="py-3 px-4">User Name</th>
                <th className="py-3 px-4">Role & Designation</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4 text-center">Managed Clients</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                    <span>Loading practice user accounts...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <span>No users match your search criteria.</span>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const isCurrentSuper = user.email.toLowerCase() === 'shekhardas8@gmail.com';
                  const isUserSuperRole = user.role === 'superadmin';

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition">
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div
                            className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs ${
                              isUserSuperRole
                                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                : user.role === 'ca_admin'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 flex items-center gap-1.5 truncate">
                              <span>{user.name}</span>
                              {isUserSuperRole && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-purple-100 text-purple-700 border border-purple-200">
                                  Super Admin
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium truncate font-mono">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Designation */}
                      <td className="py-3.5 px-4">
                        <div>
                          <span
                            className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              isUserSuperRole
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : user.role === 'ca_admin'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {isUserSuperRole ? (
                              <ShieldAlert className="w-3 h-3 text-purple-600" />
                            ) : (
                              <Shield className="w-3 h-3 text-emerald-600" />
                            )}
                            <span>{user.roleName || user.designation || user.role}</span>
                          </span>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                        {user.phone || '—'}
                      </td>

                      {/* Managed Clients */}
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                        {user.assignedClientsCount}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            user.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : user.status === 'invited'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {user.status === 'active'
                            ? 'Active'
                            : user.status === 'invited'
                            ? 'Invited'
                            : 'Suspended'}
                        </span>
                      </td>

                      {/* Actions: Edit & Delete */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Edit Button */}
                          <button
                            onClick={() => openEditModal(user)}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center space-x-1 cursor-pointer"
                            title="Edit User Details"
                          >
                            <Edit3 className="w-3 h-3 text-slate-600" />
                            <span>Edit</span>
                          </button>

                          {/* Delete Button */}
                          {isCurrentSuper ? (
                            <span
                              className="px-2 py-1 text-[10px] font-medium text-slate-400 bg-slate-50 rounded-lg cursor-not-allowed"
                              title="Primary Super Administrator cannot be deleted"
                            >
                              Protected
                            </span>
                          ) : (
                            <button
                              onClick={() => setDeletingUser(user)}
                              className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition flex items-center space-x-1 cursor-pointer border border-rose-200/60"
                              title="Delete User Account"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. ADD / INVITE USER MODAL */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Add New Practice User</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Seth"
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="vikram@firm.in"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile Contact</label>
                <input
                  type="tel"
                  placeholder="+91 98200 99999"
                  value={newUser.phone}
                  onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Security Role</label>
                  <select
                    value={newUser.role}
                    onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    {isSuper && <option value="superadmin">Super Administrator</option>}
                    <option value="ca_admin">CA Partner (Admin)</option>
                    <option value="staff">Staff Member / Associate</option>
                    <option value="client">Client User</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Status</label>
                  <select
                    value={newUser.status}
                    onChange={e => setNewUser({ ...newUser, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="active">Active</option>
                    <option value="invited">Invited</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Designation / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Associate (Audit & GST)"
                  value={newUser.designation}
                  onChange={e => setNewUser({ ...newUser, designation: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 border border-slate-300 rounded-lg text-slate-600 font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-[#00c073] hover:bg-[#00ab66] text-white rounded-lg font-semibold flex items-center space-x-1.5 shadow-sm transition disabled:opacity-50"
                >
                  {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save & Add User</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. EDIT USER MODAL */}
      {/* ========================================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Edit User: {editingUser.name}</h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={editFormData.email}
                  onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile Contact</label>
                <input
                  type="tel"
                  value={editFormData.phone}
                  onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Security Role</label>
                  <select
                    value={editFormData.role}
                    onChange={e => setEditFormData({ ...editFormData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    {isSuper && <option value="superadmin">Super Administrator</option>}
                    <option value="ca_admin">CA Partner (Admin)</option>
                    <option value="staff">Staff Member / Associate</option>
                    <option value="client">Client User</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={editFormData.status}
                    onChange={e => setEditFormData({ ...editFormData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="active">Active</option>
                    <option value="invited">Invited</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Designation / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Managing Partner / Senior Associate"
                  value={editFormData.designation}
                  onChange={e => setEditFormData({ ...editFormData, designation: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3.5 py-2 border border-slate-300 rounded-lg text-slate-600 font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center space-x-1.5 shadow-sm transition disabled:opacity-50"
                >
                  {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DELETE USER CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-800 text-sm">Delete User Account?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-800">{deletingUser.name}</strong> ({deletingUser.email})?
                This will revoke their access to the practice workspace.
              </p>
            </div>

            <div className="pt-2 flex justify-center space-x-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 text-xs font-semibold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition disabled:opacity-50"
              >
                {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
