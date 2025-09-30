/**
 * Invite modal component
 * Shows workspace invitation information and ID for sharing
 */

import { useState } from 'react';

export default function InviteModal({ workspace, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(workspace.id.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyInfo = () => {
    const inviteText = `Join "${workspace.name}" workspace!\n\nWorkspace ID: ${workspace.id}\nDescription: ${workspace.description || 'No description'}\n\nTo join:\n1. Go to your Slack Clone app\n2. Click "🔗 Join Workspace"\n3. Enter workspace ID: ${workspace.id}`;
    
    navigator.clipboard.writeText(inviteText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Invite People
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

          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Workspace Details</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-lg font-semibold text-gray-900">{workspace.name}</div>
              <div className="text-sm text-gray-600 mt-1">
                {workspace.description || 'No description'}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Workspace ID</h3>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-50 rounded-lg p-3 font-mono text-lg">
                {workspace.id}
              </div>
              <button
                onClick={handleCopyId}
                className="btn-secondary px-3 py-3"
                title="Copy workspace ID"
              >
                {copied ? (
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-2">How to Share</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-3">
                Share this workspace ID with people you want to invite:
              </p>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Copy the workspace ID above</li>
                <li>2. Send it to your team members</li>
                <li>3. They click "🔗 Join Workspace" in their app</li>
                <li>4. They enter the ID and join!</li>
              </ol>
            </div>
          </div>

          <div className="flex justify-between space-x-3">
            <button
              onClick={handleCopyInfo}
              className="btn-secondary flex-1"
            >
              📋 Copy Invitation Text
            </button>
            <button
              onClick={onClose}
              className="btn-primary flex-1"
            >
              Done
            </button>
          </div>

          {copied && (
            <div className="mt-3 text-center text-sm text-green-600">
              ✅ Copied to clipboard!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
