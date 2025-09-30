/**
 * Join workspace modal component
 * Allows users to join existing workspaces by ID
 */

import { useState } from 'react';

export default function JoinWorkspaceModal({ onClose, onSubmit }) {
  const [workspaceId, setWorkspaceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!workspaceId.trim()) {
      setError('Workspace ID is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSubmit(workspaceId.trim());
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to join workspace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Join Workspace
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>How to join:</strong> Ask a workspace member for the workspace ID or invitation link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="workspaceId" className="block text-sm font-medium text-gray-700 mb-1">
                Workspace ID *
              </label>
              <input
                type="text"
                id="workspaceId"
                value={workspaceId}
                onChange={(e) => {
                  setWorkspaceId(e.target.value);
                  if (error) setError('');
                }}
                className="input-field"
                placeholder="e.g., 12345678"
                required
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the 8-digit workspace ID you want to join.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !workspaceId.trim()}
              >
                {loading ? 'Joining...' : 'Join Workspace'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
