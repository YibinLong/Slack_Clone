/**
 * Main workspace page
 * Shows the Slack-like interface with sidebar and chat area
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { authAPI } from '../lib/auth';
import { initializeSocket, getSocket, disconnectSocket, socketHelpers } from '../lib/socket';
import api from '../lib/auth';
import WorkspaceBar from '../components/WorkspaceBar';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import CreateWorkspaceModal from '../components/CreateWorkspaceModal';
import CreateChannelModal from '../components/CreateChannelModal';
import JoinWorkspaceModal from '../components/JoinWorkspaceModal';
import InviteModal from '../components/InviteModal';
import ManageMembersModal from '../components/ManageMembersModal';

export default function Workspace({ user, setUser }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [channels, setChannels] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [switchingWorkspace, setSwitchingWorkspace] = useState(false);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showJoinWorkspace, setShowJoinWorkspace] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showManageMembers, setShowManageMembers] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Initialize WebSocket connection
    const socket = initializeSocket();
    if (!socket) {
      router.push('/login');
      return;
    }

    // Load initial data
    loadWorkspaces();

    return () => {
      // Cleanup socket connection
      disconnectSocket();
    };
  }, [user, router]);

  // Set up socket event listeners that depend on current state
  useEffect(() => {
    // Set up socket event listeners
    socketHelpers.onNewMessage(handleNewMessage);
    socketHelpers.onUserTyping(handleUserTyping);
    socketHelpers.onUserStoppedTyping(handleUserStoppedTyping);
    socketHelpers.onError(handleSocketError);
    socketHelpers.on('new-channel', handleNewChannel);

    return () => {
      // Cleanup event listeners
      socketHelpers.off('new-message', handleNewMessage);
      socketHelpers.off('user-typing', handleUserTyping);
      socketHelpers.off('user-stopped-typing', handleUserStoppedTyping);
      socketHelpers.off('error', handleSocketError);
      socketHelpers.off('new-channel', handleNewChannel);
    };
  }, [currentChannel, currentWorkspace, user]);

  // Load user's workspaces
  const loadWorkspaces = async () => {
    try {
      const response = await api.get('/workspaces');
      setWorkspaces(response.data.workspaces);
      
      // Auto-select first workspace if available
      if (response.data.workspaces.length > 0) {
        await selectWorkspace(response.data.workspaces[0].id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading workspaces:', error);
      setLoading(false);
    }
  };

  // Select a workspace and load its channels
  const selectWorkspace = async (workspaceId) => {
    try {
      console.log('📍 Selecting workspace:', workspaceId);
      console.log('📍 Current workspace ID:', currentWorkspace?.id);
      
      // Don't reload if already selected
      if (currentWorkspace?.id === workspaceId) {
        console.log('📍 Already in this workspace, skipping reload');
        return;
      }
      
      // Set appropriate loading state
      if (!currentWorkspace) {
        setLoading(true);
      } else {
        setSwitchingWorkspace(true);
      }
      
      const response = await api.get(`/workspaces/${workspaceId}`);
      console.log('📍 Workspace response:', response.data);
      
      // Set new workspace and channels first
      setCurrentWorkspace(response.data.workspace);
      setChannels(response.data.channels);
      
      // Join workspace room for workspace-level events (like new channels)
      socketHelpers.joinWorkspaces([workspaceId]);
      
      // Join all channels for real-time updates
      const channelIds = response.data.channels.map(channel => channel.id);
      socketHelpers.joinChannels(channelIds);
      
      // Auto-select first channel (usually "general")
      if (response.data.channels.length > 0) {
        console.log('📍 Auto-selecting channel:', response.data.channels[0].name);
        await selectChannel(response.data.channels[0]);
      } else {
        console.log('📍 No channels found in workspace');
        // Clear current channel if no channels in workspace
        setCurrentChannel(null);
        setMessages([]);
      }
      
      setLoading(false);
      setSwitchingWorkspace(false);
    } catch (error) {
      console.error('❌ Error loading workspace:', error);
      setLoading(false);
      setSwitchingWorkspace(false);
    }
  };

  // Select a channel and load its messages
  const selectChannel = async (channel) => {
    try {
      console.log('📍 Selecting channel:', channel.name, channel.id);
      setCurrentChannel(channel);
      const response = await api.get(`/channels/${channel.id}/messages`);
      console.log('📍 Messages loaded:', response.data.messages.length, 'messages');
      setMessages(response.data.messages);
    } catch (error) {
      console.error('❌ Error loading messages:', error);
    }
  };

  // Handle new message from WebSocket
  const handleNewMessage = (message) => {
    console.log('New message received:', message, 'Current channel:', currentChannel?.id);
    // Only add message if it's for the current channel
    if (currentChannel && message.channelId === currentChannel.id) {
      setMessages(prev => {
        // Check if message already exists to prevent duplicates
        const messageExists = prev.some(msg => msg.id === message.id);
        if (messageExists) {
          return prev;
        }
        return [...prev, message];
      });
    }
  };

  // Handle typing indicators
  const handleUserTyping = (data) => {
    if (data.channelId === currentChannel?.id && data.userId !== user.id) {
      setTypingUsers(prev => {
        if (!prev.find(u => u.userId === data.userId)) {
          return [...prev, data];
        }
        return prev;
      });
    }
  };

  const handleUserStoppedTyping = (data) => {
    if (data.channelId === currentChannel?.id) {
      setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
    }
  };

  // Handle socket errors
  const handleSocketError = (error) => {
    console.error('Socket error:', error);
  };

  // Handle new channel created in workspace
  const handleNewChannel = (channelData) => {
    console.log('🆕 New channel created:', channelData);
    
    // Only add if it's for the current workspace and doesn't already exist
    if (currentWorkspace && channelData.workspaceId === currentWorkspace.id) {
      setChannels(prev => {
        // Check if channel already exists to prevent duplicates
        const channelExists = prev.some(ch => ch.id === channelData.id);
        if (channelExists) {
          return prev;
        }
        // Add new channel to the list
        const newChannel = {
          id: channelData.id,
          name: channelData.name,
          description: channelData.description,
          isPrivate: channelData.isPrivate,
          createdAt: channelData.createdAt
        };
        // Join the new channel room for real-time messages
        socketHelpers.joinChannels([channelData.id]);
        return [...prev, newChannel];
      });
    }
  };

  // Send a message
  const sendMessage = (content) => {
    if (currentChannel && content.trim()) {
      socketHelpers.sendMessage(currentChannel.id, content);
    }
  };

  // Create workspace
  const handleCreateWorkspace = async (workspaceData) => {
    try {
      const response = await api.post('/workspaces', workspaceData);
      await loadWorkspaces(); // Reload workspaces
      setShowCreateWorkspace(false);
      
      // Select the new workspace
      await selectWorkspace(response.data.workspace.id);
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw error;
    }
  };

  // Create channel
  const handleCreateChannel = async (channelData) => {
    try {
      if (!currentWorkspace) return;
      
      await api.post(`/channels/${currentWorkspace.id}/channels`, channelData);
      await selectWorkspace(currentWorkspace.id); // Reload workspace data
      setShowCreateChannel(false);
    } catch (error) {
      console.error('Error creating channel:', error);
      throw error;
    }
  };

  // Join a channel
  const joinChannel = async (channelId) => {
    try {
      await api.post(`/channels/${channelId}/join`);
      if (currentWorkspace) {
        await selectWorkspace(currentWorkspace.id); // Reload workspace data
      }
    } catch (error) {
      console.error('Error joining channel:', error);
    }
  };

  // Join a workspace
  const handleJoinWorkspace = async (workspaceId) => {
    try {
      await api.post(`/workspaces/${workspaceId}/join`);
      await loadWorkspaces(); // Reload workspaces
      setShowJoinWorkspace(false);
      
      // Select the new workspace
      await selectWorkspace(workspaceId);
    } catch (error) {
      console.error('Error joining workspace:', error);
      throw error;
    }
  };

  // Logout
  const handleLogout = () => {
    authAPI.logout();
    setUser(null);
    disconnectSocket();
    router.push('/');
  };

  if (!user) {
    return null; // Will redirect
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading workspace...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Discord-style Workspace Bar */}
      <WorkspaceBar
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        onSelectWorkspace={selectWorkspace}
        onCreateWorkspace={() => setShowCreateWorkspace(true)}
        onJoinWorkspace={() => setShowJoinWorkspace(true)}
      />
      
      {/* Channel Sidebar */}
      <Sidebar
        currentWorkspace={currentWorkspace}
        channels={channels}
        currentChannel={currentChannel}
        user={user}
        onSelectChannel={selectChannel}
        onCreateChannel={() => setShowCreateChannel(true)}
        onShowInvite={() => setShowInviteModal(true)}
        onManageMembers={() => setShowManageMembers(true)}
        onLogout={handleLogout}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {switchingWorkspace ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <h2 className="text-lg font-medium text-gray-700">
                Switching workspace...
              </h2>
            </div>
          </div>
        ) : currentChannel ? (
          <ChatArea
            channel={currentChannel}
            workspace={currentWorkspace}
            messages={messages}
            user={user}
            typingUsers={typingUsers}
            onSendMessage={sendMessage}
            onStartTyping={() => socketHelpers.startTyping(currentChannel.id)}
            onStopTyping={() => socketHelpers.stopTyping(currentChannel.id)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                {workspaces.length === 0 ? 'Welcome to Slack Clone!' : 'Select a channel to start chatting'}
              </h2>
              {workspaces.length === 0 && (
                <button
                  onClick={() => setShowCreateWorkspace(true)}
                  className="btn-primary"
                >
                  Create Your First Workspace
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateWorkspace && (
        <CreateWorkspaceModal
          onClose={() => setShowCreateWorkspace(false)}
          onSubmit={handleCreateWorkspace}
        />
      )}

      {showCreateChannel && currentWorkspace && (
        <CreateChannelModal
          workspace={currentWorkspace}
          onClose={() => setShowCreateChannel(false)}
          onSubmit={handleCreateChannel}
        />
      )}

      {showJoinWorkspace && (
        <JoinWorkspaceModal
          onClose={() => setShowJoinWorkspace(false)}
          onSubmit={handleJoinWorkspace}
        />
      )}

      {showInviteModal && currentWorkspace && (
        <InviteModal
          workspace={currentWorkspace}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {showManageMembers && currentWorkspace && (
        <ManageMembersModal
          workspace={currentWorkspace}
          currentUser={user}
          onClose={() => setShowManageMembers(false)}
        />
      )}
    </div>
  );
}
