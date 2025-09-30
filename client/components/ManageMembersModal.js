/**
 * Manage Members Modal Component
 * Shows all workspace members with their roles
 * Allows admins/owners to change roles and remove members
 */

import { useState, useEffect } from 'react';
import api from '../lib/auth';

export default function ManageMembersModal({ workspace, currentUser, onClose }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load members when modal opens
  useEffect(() => {
    loadMembers();
  }, [workspace]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/workspaces/${workspace.id}/members`);
      setMembers(response.data.members);
    } catch (err) {
      console.error('Error loading members:', err);
      setError('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  // Change a member's role
  const handleChangeRole = async (memberId, newRole) => {
    try {
      await api.put(`/workspaces/${workspace.id}/members/${memberId}/role`, { role: newRole });
      // Update local state
      setMembers(prev => prev.map(m => 
        m.id === memberId ? { ...m, role: newRole } : m
      ));
    } catch (err) {
      console.error('Error changing role:', err);
      alert(err.response?.data?.error || 'Failed to change role');
    }
  };

  // Remove a member from the workspace
  const handleRemoveMember = async (memberId, memberName) => {
    if (!confirm(`Remove ${memberName} from this workspace?`)) {
      return;
    }

    try {
      await api.delete(`/workspaces/${workspace.id}/members/${memberId}`);
      // Update local state
      setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (err) {
      console.error('Error removing member:', err);
      alert(err.response?.data?.error || 'Failed to remove member');
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'owner':
        return 'bg-yellow-500 text-white';
      case 'admin':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  // Check if current user can manage this member
  const canManage = (member) => {
    const currentMember = members.find(m => m.id === currentUser.id);
    if (!currentMember) return false;

    // Owner can manage everyone except themselves
    if (currentMember.role === 'owner') {
      return member.role !== 'owner';
    }

    // Admin can only manage regular members
    if (currentMember.role === 'admin') {
      return member.role === 'member';
    }

    return false;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Manage Members</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading members...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="mb-4 text-sm text-gray-600">
              <p><strong>Total Members:</strong> {members.length}</p>
            </div>

            {members.map(member => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{member.displayName}</span>
                    <span className={`text-xs px-2 py-1 rounded ${getRoleBadgeColor(member.role)}`}>
                      {member.role.toUpperCase()}
                    </span>
                    {member.id === currentUser.id && (
                      <span className="text-xs text-gray-500">(You)</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{member.email}</p>
                  <p className="text-xs text-gray-400">
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </p>
                </div>

                {canManage(member) && (
                  <div className="flex items-center gap-2">
                    {/* Role dropdown */}
                    <select
                      value={member.role}
                      onChange={(e) => handleChangeRole(member.id, e.target.value)}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>

                    {/* Remove button */}
                    <button
                      onClick={() => handleRemoveMember(member.id, member.displayName)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
