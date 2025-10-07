/**
 * Main server file
 * Sets up Express server with WebSocket support for real-time messaging
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const pool = require('./config/database');
const authRoutes = require('./routes/auth');
const workspaceRoutes = require('./routes/workspaces');
const channelRoutes = require('./routes/channels');

const app = express();
const server = http.createServer(app);

// Set up Socket.IO with CORS
// Normalize allowed origins (remove trailing slashes, allow comma-separated list)
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(',')
  .map(origin => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      const normalizedOrigin = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }
      console.warn(`🚫 Socket.IO blocked origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet()); // Security headers

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true); // Allow non-browser requests
    }
    const normalizedOrigin = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }
    console.warn(`🚫 CORS blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json()); // Parse JSON bodies

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
// Pass io instance to channel routes for real-time updates
app.use('/api/channels', (req, res, next) => {
  req.io = io;
  next();
}, channelRoutes);

// WebSocket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: Token required'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.userEmail = decoded.email;
    socket.displayName = decoded.displayName;
    
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
};

// Apply authentication to all socket connections
io.use(authenticateSocket);

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.displayName} (${socket.userEmail})`);

  // Join user to their workspaces (for workspace-level events like new channels)
  socket.on('join-workspaces', async (workspaceIds) => {
    try {
      // Verify user is a member of these workspaces
      const membershipCheck = await pool.query(`
        SELECT wm.workspace_id 
        FROM workspace_members wm
        JOIN workspaces w ON wm.workspace_id = w.id
        WHERE wm.user_id = $1 AND w.workspace_id = ANY($2)
      `, [socket.userId, workspaceIds]);

      const validWorkspaceIds = membershipCheck.rows.map(row => row.workspace_id);
      
      // Join socket rooms for each valid workspace
      validWorkspaceIds.forEach(workspaceId => {
        socket.join(`workspace_${workspaceId}`);
      });

      console.log(`User ${socket.displayName} joined ${validWorkspaceIds.length} workspaces`);
    } catch (error) {
      console.error('Error joining workspaces:', error);
    }
  });

  // Join user to their channels
  socket.on('join-channels', async (channelIds) => {
    try {
      // Verify user is a member of these channels
      const membershipCheck = await pool.query(`
        SELECT cm.channel_id 
        FROM channel_members cm 
        WHERE cm.user_id = $1 AND cm.channel_id = ANY($2)
      `, [socket.userId, channelIds]);

      const validChannelIds = membershipCheck.rows.map(row => row.channel_id);
      
      // Join socket rooms for each valid channel
      validChannelIds.forEach(channelId => {
        socket.join(`channel_${channelId}`);
      });

      console.log(`User ${socket.displayName} joined ${validChannelIds.length} channels`);
    } catch (error) {
      console.error('Error joining channels:', error);
    }
  });

  // Handle sending messages
  socket.on('send-message', async (data) => {
    try {
      const { channelId, content } = data;

      // Validate input
      if (!channelId || !content || content.trim().length === 0) {
        socket.emit('error', { message: 'Channel ID and message content are required' });
        return;
      }

      // Check if user is a member of this channel
      const memberCheck = await pool.query(
        'SELECT id FROM channel_members WHERE channel_id = $1 AND user_id = $2',
        [channelId, socket.userId]
      );

      if (memberCheck.rows.length === 0) {
        socket.emit('error', { message: 'Access denied to this channel' });
        return;
      }

      // Save message to database
      const messageResult = await pool.query(
        'INSERT INTO messages (content, channel_id, user_id) VALUES ($1, $2, $3) RETURNING *',
        [content.trim(), channelId, socket.userId]
      );

      const message = messageResult.rows[0];

      // Create message object to broadcast
      const messageData = {
        id: message.id,
        content: message.content,
        channelId: message.channel_id,
        userId: message.user_id,
        user: {
          displayName: socket.displayName,
          email: socket.userEmail
        },
        createdAt: message.created_at
      };

      // Broadcast message to all users in the channel
      io.to(`channel_${channelId}`).emit('new-message', messageData);

      console.log(`Message sent by ${socket.displayName} to channel ${channelId}`);

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('typing-start', (data) => {
    const { channelId } = data;
    socket.to(`channel_${channelId}`).emit('user-typing', {
      userId: socket.userId,
      displayName: socket.displayName,
      channelId
    });
  });

  socket.on('typing-stop', (data) => {
    const { channelId } = data;
    socket.to(`channel_${channelId}`).emit('user-stopped-typing', {
      userId: socket.userId,
      channelId
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.displayName}`);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for real-time connections`);
  console.log(`🌍 CORS enabled for: ${process.env.CORS_ORIGIN || "http://localhost:3000"}`);
});
