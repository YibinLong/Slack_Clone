/**
 * Sidebar component
 * Shows workspaces, channels, and navigation
 */

import { useState } from 'react';

export default function Sidebar({
  currentWorkspace,
  channels,
  currentChannel,
  user,
  onSelectChannel,
  onCreateChannel,
  onShowInvite,
  onLogout
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <div className="w-64 bg-slack-sidebar text-white flex flex-col h-screen">
      {/* Current Workspace Header */}
      <div className="p-4 border-b border-slack-hover">
        {currentWorkspace ? (
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-lg font-semibold truncate">
                {currentWorkspace.name}
              </h1>
              <p className="text-xs text-gray-300 truncate">
                ID: {currentWorkspace.id}
              </p>
            </div>
            <button
              onClick={onShowInvite}
              className="text-gray-300 hover:text-white p-1 rounded"
              title="Invite people"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="text-center">
            <h1 className="text-lg font-semibold">Select a Workspace</h1>
            <p className="text-xs text-gray-300 mt-1">Use the workspace bar on the left</p>
          </div>
        )}
      </div>

      {/* Channels Section */}
      <div className="flex-1 overflow-y-auto">
        {currentWorkspace && (
          <div className="p-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">
                Channels
              </h3>
              <button
                onClick={onCreateChannel}
                className="text-gray-300 hover:text-white p-1 rounded"
                title="Create channel"
              >
                +
              </button>
            </div>
            
            <div className="space-y-1">
              {channels.map(channel => (
                <button
                  key={channel.id}
                  onClick={() => onSelectChannel(channel)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    currentChannel?.id === channel.id
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-300 hover:bg-slack-hover hover:text-white'
                  }`}
                >
                  <span className="mr-2">#</span>
                  {channel.name}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* User Profile Section */}
      <div className="relative p-4 border-t border-slack-hover">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="w-full flex items-center space-x-3 hover:bg-slack-hover rounded p-2 transition-colors"
        >
          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">
              {user.displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium">{user.displayName}</div>
            <div className="text-xs text-gray-300 truncate">{user.email}</div>
          </div>
        </button>

        {/* User Menu Dropdown */}
        {showUserMenu && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="py-1">
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onLogout();
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
