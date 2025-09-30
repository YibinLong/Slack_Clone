/**
 * WebSocket connection management
 * Handles real-time communication with the server
 */

import { io } from 'socket.io-client';
import { authAPI } from './auth';

let socket = null;

export const initializeSocket = () => {
  const token = authAPI.getToken();
  
  if (!token) {
    console.error('No token available for WebSocket connection');
    return null;
  }

  // Disconnect existing socket if any
  if (socket) {
    socket.disconnect();
  }

  // Create new socket connection
  socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001', {
    auth: {
      token: token
    }
  });

  // Connection event handlers
  socket.on('connect', () => {
    console.log('✅ Connected to WebSocket server');
  });

  socket.on('disconnect', () => {
    console.log('❌ Disconnected from WebSocket server');
  });

  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error.message);
  });

  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Socket event helpers
export const socketHelpers = {
  // Join workspaces for workspace-level events (like new channels)
  joinWorkspaces: (workspaceIds) => {
    if (socket) {
      socket.emit('join-workspaces', workspaceIds);
    }
  },

  // Join channels for real-time updates
  joinChannels: (channelIds) => {
    if (socket) {
      socket.emit('join-channels', channelIds);
    }
  },

  // Send a message
  sendMessage: (channelId, content) => {
    if (socket) {
      socket.emit('send-message', { channelId, content });
    }
  },

  // Typing indicators
  startTyping: (channelId) => {
    if (socket) {
      socket.emit('typing-start', { channelId });
    }
  },

  stopTyping: (channelId) => {
    if (socket) {
      socket.emit('typing-stop', { channelId });
    }
  },

  // Listen for new messages
  onNewMessage: (callback) => {
    if (socket) {
      socket.on('new-message', callback);
    }
  },

  // Listen for typing events
  onUserTyping: (callback) => {
    if (socket) {
      socket.on('user-typing', callback);
    }
  },

  onUserStoppedTyping: (callback) => {
    if (socket) {
      socket.on('user-stopped-typing', callback);
    }
  },

  // Listen for errors
  onError: (callback) => {
    if (socket) {
      socket.on('error', callback);
    }
  },

  // Generic event listener (for custom events like 'new-channel')
  on: (event, callback) => {
    if (socket) {
      socket.on(event, callback);
    }
  },

  // Remove event listeners
  off: (event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  }
};
