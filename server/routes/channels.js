/**
 * Channel routes
 * Handles channel creation, joining, leaving, and message management
 */

const express = require('express');
const Joi = require('joi');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Validation schemas
const createChannelSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional(),
  isPrivate: Joi.boolean().default(false)
});

// Create a new channel
router.post('/:workspaceId/channels', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.userId;

    // Validate input
    const { error, value } = createChannelSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, description, isPrivate } = value;

    // Get workspace details to get internal ID
    const workspaceResult = await pool.query(
      'SELECT * FROM workspaces WHERE workspace_id = $1',
      [workspaceId]
    );

    if (workspaceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const workspace = workspaceResult.rows[0];

    // Check if user is a member of the workspace
    const memberCheck = await pool.query(
      'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
      [workspace.id, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }

    // Check if channel name already exists in this workspace
    const existingChannel = await pool.query(
      'SELECT id FROM channels WHERE workspace_id = $1 AND name = $2',
      [workspace.id, name]
    );

    if (existingChannel.rows.length > 0) {
      return res.status(400).json({ error: 'Channel name already exists in this workspace' });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Create the channel
      const channelResult = await client.query(
        'INSERT INTO channels (name, description, workspace_id, created_by, is_private) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, description, workspace.id, userId, isPrivate]
      );

      const channel = channelResult.rows[0];

      // If it's a public channel, add ALL workspace members
      // If it's a private channel, only add the creator
      if (!isPrivate) {
        // Get all workspace members
        const workspaceMembersResult = await client.query(
          'SELECT user_id FROM workspace_members WHERE workspace_id = $1',
          [workspace.id]
        );

        // Add all workspace members to this public channel
        for (const member of workspaceMembersResult.rows) {
          await client.query(
            'INSERT INTO channel_members (channel_id, user_id) VALUES ($1, $2)',
            [channel.id, member.user_id]
          );
        }
      } else {
        // For private channels, only add the creator
        await client.query(
          'INSERT INTO channel_members (channel_id, user_id) VALUES ($1, $2)',
          [channel.id, userId]
        );
      }

      await client.query('COMMIT');

      const channelData = {
        id: channel.id,
        name: channel.name,
        description: channel.description,
        workspaceId: workspace.workspace_id,
        createdBy: channel.created_by,
        isPrivate: channel.is_private,
        createdAt: channel.created_at
      };

      // Emit real-time event to all users in the workspace
      // This makes the channel appear instantly for everyone
      if (req.io) {
        req.io.to(`workspace_${workspace.id}`).emit('new-channel', channelData);
      }

      res.status(201).json({
        message: 'Channel created successfully',
        channel: channelData
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Create channel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Join a channel
router.post('/:channelId/join', async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user.userId;

    // Get channel details and check workspace membership
    const channelResult = await pool.query(`
      SELECT c.*, wm.user_id as workspace_member
      FROM channels c
      LEFT JOIN workspace_members wm ON c.workspace_id = wm.workspace_id AND wm.user_id = $1
      WHERE c.id = $2
    `, [userId, channelId]);

    if (channelResult.rows.length === 0) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    const channel = channelResult.rows[0];

    if (!channel.workspace_member) {
      return res.status(403).json({ error: 'You must be a workspace member to join this channel' });
    }

    // Check if already a member
    const existingMember = await pool.query(
      'SELECT id FROM channel_members WHERE channel_id = $1 AND user_id = $2',
      [channelId, userId]
    );

    if (existingMember.rows.length > 0) {
      return res.status(400).json({ error: 'Already a member of this channel' });
    }

    // Add user to channel
    await pool.query(
      'INSERT INTO channel_members (channel_id, user_id) VALUES ($1, $2)',
      [channelId, userId]
    );

    res.json({ message: 'Successfully joined channel' });

  } catch (error) {
    console.error('Join channel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Leave a channel
router.post('/:channelId/leave', async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user.userId;

    // Check if user is a member
    const memberCheck = await pool.query(
      'SELECT id FROM channel_members WHERE channel_id = $1 AND user_id = $2',
      [channelId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(404).json({ error: 'You are not a member of this channel' });
    }

    // Remove user from channel
    await pool.query(
      'DELETE FROM channel_members WHERE channel_id = $1 AND user_id = $2',
      [channelId, userId]
    );

    res.json({ message: 'Successfully left channel' });

  } catch (error) {
    console.error('Leave channel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get messages for a channel
router.get('/:channelId/messages', async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    // Check if user is a member of this channel
    const memberCheck = await pool.query(
      'SELECT id FROM channel_members WHERE channel_id = $1 AND user_id = $2',
      [channelId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this channel' });
    }

    // Get messages with user information
    const messagesResult = await pool.query(`
      SELECT m.*, u.display_name, u.email
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.channel_id = $1
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `, [channelId, limit, offset]);

    const messages = messagesResult.rows.reverse().map(message => ({
      id: message.id,
      content: message.content,
      channelId: message.channel_id,
      userId: message.user_id,
      user: {
        displayName: message.display_name,
        email: message.email
      },
      createdAt: message.created_at,
      updatedAt: message.updated_at
    }));

    res.json({ messages });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
