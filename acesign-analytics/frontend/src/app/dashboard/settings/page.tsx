'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';
import toast from 'react-hot-toast';
import { FiUsers, FiLoader, FiEdit2, FiTrash2, FiMailPlus, FiShield } from 'react-icons/fi';

interface TeamMember {
  id: number;
  email: string;
  name: string;
  role: string;
  joined_at: string;
  permissions: string[];
}

interface UserPermissions {
  role: string;
  permissions: string[];
}

const ROLES = [
  {
    name: 'admin',
    label: 'Administrator',
    description: 'Full access to all features and settings',
    badge: 'bg-red-100 text-red-700'
  },
  {
    name: 'editor',
    label: 'Editor',
    description: 'Can create, edit, and publish content',
    badge: 'bg-blue-100 text-blue-700'
  },
  {
    name: 'viewer',
    label: 'Viewer',
    description: 'Read-only access to dashboards and reports',
    badge: 'bg-slate-100 text-slate-700'
  }
];

export default function SettingsPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');

  useEffect(() => {
    fetchTeamAndPermissions();
  }, []);

  const fetchTeamAndPermissions = async () => {
    try {
      setLoading(true);
      const [membersData, permissionsData] = await Promise.all([
        apiClient.getTeamMembers(),
        apiClient.getUserPermissions()
      ]);

      setTeamMembers(membersData.data || []);
      setUserPermissions(permissionsData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (memberId: number, newRole: string) => {
    try {
      await apiClient.updateMemberRole(memberId, newRole);
      toast.success('Role updated successfully!');
      setEditingId(null);
      fetchTeamAndPermissions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update role');
    }
  };

  const handleRemoveMember = async (memberId: number, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email}? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiClient.removeTeamMember(memberId);
      toast.success('Team member removed');
      fetchTeamAndPermissions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove member');
    }
  };

  const handleResendInvite = async (memberId: number, email: string) => {
    try {
      await apiClient.resendInvite(memberId);
      toast.success(`Invite resent to ${email}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend invite');
    }
  };

  const getRoleBadge = (role: string) => {
    const roleInfo = ROLES.find(r => r.name === role);
    return roleInfo ? roleInfo.badge : 'bg-slate-100 text-slate-700';
  };

  const getRoleLabel = (role: string) => {
    const roleInfo = ROLES.find(r => r.name === role);
    return roleInfo ? roleInfo.label : role;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <FiLoader className="animate-spin text-4xl text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Settings & Access Control</h1>
        <p className="text-slate-600 mt-1">Manage team members and their permissions</p>
      </div>

      {/* Your Permissions Card */}
      {userPermissions && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-6 mb-8">
          <div className="flex items-start gap-4">
            <FiShield className="text-3xl text-blue-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Your Access Level</h2>
              <div className="mb-4">
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${getRoleBadge(userPermissions.role)}`}>
                  {getRoleLabel(userPermissions.role)}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Your Permissions:</p>
                <div className="flex flex-wrap gap-2">
                  {userPermissions.permissions.map(permission => (
                    <span key={permission} className="px-3 py-1 bg-white text-slate-700 rounded-full text-xs border border-slate-200">
                      {permission.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Members Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <FiUsers className="text-2xl text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-900">Team Members</h2>
          </div>
          <p className="text-slate-600 text-sm">Manage who has access to your account</p>
        </div>

        {teamMembers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Email</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700">Role</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Joined</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member) => (
                  <tr key={member.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {member.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {member.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      {editingId === member.id ? (
                        <select
                          value={selectedRole}
                          onChange={(e) => {
                            setSelectedRole(e.target.value);
                            handleRoleChange(member.id, e.target.value);
                          }}
                          className="px-3 py-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          {ROLES.map(role => (
                            <option key={role.name} value={role.name}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getRoleBadge(member.role)}`}>
                          {getRoleLabel(member.role)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(member.joined_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <div className="flex items-center justify-center gap-2">
                        {userPermissions?.role === 'admin' && (
                          <>
                            <button
                              onClick={() => {
                                if (editingId === member.id) {
                                  setEditingId(null);
                                } else {
                                  setEditingId(member.id);
                                  setSelectedRole(member.role);
                                }
                              }}
                              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                              title="Edit role"
                            >
                              <FiEdit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleResendInvite(member.id, member.email)}
                              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                              title="Resend invite"
                            >
                              <FiMailPlus size={16} />
                            </button>
                            <button
                              onClick={() => handleRemoveMember(member.id, member.email)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Remove member"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <FiUsers className="mx-auto text-4xl text-slate-300 mb-4" />
            <p className="text-slate-600">No team members yet</p>
          </div>
        )}
      </div>

      {/* Role Descriptions */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Role Permissions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ROLES.map(role => (
            <div key={role.name} className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <h3 className="text-lg font-bold text-slate-900 mb-2">{role.label}</h3>
              <p className="text-sm text-slate-600 mb-4">{role.description}</p>
              <div className="space-y-2">
                {userPermissions && (
                  <>
                    {role.name === 'admin' && (
                      <div className="text-xs space-y-1">
                        <p className="text-slate-700 font-medium">✓ View dashboard</p>
                        <p className="text-slate-700 font-medium">✓ Manage users</p>
                        <p className="text-slate-700 font-medium">✓ Manage integrations</p>
                        <p className="text-slate-700 font-medium">✓ View analytics</p>
                        <p className="text-slate-700 font-medium">✓ Create & publish content</p>
                        <p className="text-slate-700 font-medium">✓ Manage reports</p>
                        <p className="text-slate-700 font-medium">✓ Manage settings</p>
                      </div>
                    )}
                    {role.name === 'editor' && (
                      <div className="text-xs space-y-1">
                        <p className="text-slate-700 font-medium">✓ View dashboard</p>
                        <p className="text-slate-700 font-medium">✓ View analytics</p>
                        <p className="text-slate-700 font-medium">✓ Create & publish content</p>
                        <p className="text-slate-700 font-medium">✓ Manage reports</p>
                        <p className="text-slate-400 font-medium">✗ Manage users</p>
                        <p className="text-slate-400 font-medium">✗ Manage settings</p>
                      </div>
                    )}
                    {role.name === 'viewer' && (
                      <div className="text-xs space-y-1">
                        <p className="text-slate-700 font-medium">✓ View dashboard</p>
                        <p className="text-slate-700 font-medium">✓ View analytics</p>
                        <p className="text-slate-400 font-medium">✗ Create content</p>
                        <p className="text-slate-400 font-medium">✗ Publish content</p>
                        <p className="text-slate-400 font-medium">✗ Manage users</p>
                        <p className="text-slate-400 font-medium">✗ Manage settings</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
