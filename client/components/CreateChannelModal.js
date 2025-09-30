/**
 * Create channel modal component
 * Allows users to create new channels within a workspace
 */

import { useState } from 'react';

export default function CreateChannelModal({ workspace, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    if (error) setError('');
  };

  const handleNameChange = (e) => {
    // Convert to lowercase and replace spaces with hyphens for channel names
    let value = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
    setFormData({
      ...formData,
      name: value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Channel name is required');
      return;
    }

    if (formData.name.length < 2) {
      setError('Channel name must be at least 2 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSubmit(formData);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create channel');
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
              Create Channel
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

          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              Creating channel in: <span className="font-medium">{workspace.name}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Channel Name *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  #
                </span>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleNameChange}
                  className="input-field pl-8"
                  placeholder="e.g., general, random, marketing"
                  required
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Channel names must be lowercase, without spaces or periods, and shorter than 22 characters.
              </p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input-field resize-none"
                rows={3}
                placeholder="What's this channel about?"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPrivate"
                name="isPrivate"
                checked={formData.isPrivate}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="isPrivate" className="ml-2 block text-sm text-gray-700">
                Make private
              </label>
            </div>
            
            {formData.isPrivate && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Private channels</strong> can only be viewed or joined by invitation.
                </p>
              </div>
            )}

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
                disabled={loading || !formData.name.trim()}
              >
                {loading ? 'Creating...' : 'Create Channel'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
