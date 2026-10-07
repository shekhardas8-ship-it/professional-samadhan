// src/components/settings/UsersManagementView.tsx
import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  Shield,
  CheckCircle,
  MoreVertical,
  Plus,
  Search,
  Filter,
} from 'lucide-react';
import { PracticeRole, getStoredRoles } from '../../services/rolesService';

interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  roleId: string;
  roleName: string;
  status: 'active' | 'invited' | 'suspended';
  assignedClientsCount: number;
}

export const UsersManagementView: React.FC = () => {
  const roles = getStoredRoles();

  const [users, setUsers] = useState<UserAccount[]>([
    {
      id: 'u_1',
      name: 'CA Suraj Dutta (FCA)',
      email: 'suraj.dutta@quinceca.com',
      phone: '+91 98200 11111',
      roleId: 'role_partner',
      roleName: 'Managing Partner (CA Admin)',
      status: 'active',
      assignedClientsCount: 48,
    },
    {
      id: 'u_2',
      name: 'Pooja Verma (Associate)',
      email: 'pooja.verma@quinceca.com',
      phone: '+91 98200 22222',
      roleId: 'role_senior_associate',
      roleName: 'Senior Associate (Reviewer)',
      status: 'active',
      assignedClientsCount: 24,
    },
    {
      id: 'u_3',
      name: 'Rahul Sharma',
      email: 'rahul.s@quinceca.com',
      phone: '+91 98200 33333',
      roleId: 'role_article_clerk',
      roleName: 'Article Clerk (Assistant)',
      status: 'active',
      assignedClientsCount: 12,
    },
    {
      id: 'u_4',
      name: 'Sneha Patel',
      email: 'sneha.p@quinceca.com',
      phone: '+91 98200 44444',
      roleId: 'role_article_clerk',
      roleName: 'Article Clerk (Assistant)',
      status: 'invited',
      assignedClientsCount: 0,
    },
  ]);

  const [search, setSearch] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    roleId: roles[0]?.id || 'role_partner',
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;

    const matchedRole = roles.find(r => r.id === newUser.roleId);
    const added: UserAccount = {
      id: `u_${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      roleId: newUser.roleId,
      roleName: matchedRole?.name || 'Staff Member',
      status: 'invited',
      assignedClientsCount: 0,
    };

    setUsers([...users, added]);
    setShowInviteModal(false);
    setNewUser({ name: '', email: '', phone: '', roleId: roles[0]?.id || 'role_partner' });
  };

  const filteredUsers = users.filter(
    u =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.roleName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 bg-white min-h-screen overflow-y-auto">
      {/* Header bar */}
      <div className="px-8 py-5 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Users & Staff Accounts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage partners, senior associates, and article clerks with assigned security roles.
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="px-3.5 py-1.5 text-xs font-semibold bg-[#00c073] hover:bg-[#00ab66] text-white rounded-lg shadow-sm transition inline-flex items-center space-x-1.5 cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Invite User</span>
        </button>
      </div>

      <div className="p-8 max-w-5xl space-y-6">
        {/* Search & Stats */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search staff by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
            <span>Total Staff: <strong className="text-slate-800">{users.length}</strong></span>
            <span>•</span>
            <span>Active: <strong className="text-emerald-700">{users.filter(u => u.status === 'active').length}</strong></span>
          </div>
        </div>

        {/* Users Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                <th className="py-3 px-4">User Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4 text-center">Managed Clients</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{user.name}</div>
                        <div className="text-[11px] text-slate-400 font-medium">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      <Shield className="w-3 h-3 text-emerald-600" />
                      <span>{user.roleName}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                    {user.phone || '—'}
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-slate-700">
                    {user.assignedClientsCount}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        user.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {user.status === 'active' ? 'Active' : 'Invited'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">Invite Practice Staff Member</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Seth"
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="vikram@firm.in"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  placeholder="+91 98200 99999"
                  value={newUser.phone}
                  onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assign Role</label>
                <select
                  value={newUser.roleId}
                  onChange={e => setNewUser({ ...newUser, roleId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#00c073] hover:bg-[#00ab66] text-white rounded-lg font-semibold"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
