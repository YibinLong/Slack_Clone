/**
 * Workspace routes
 * Handles workspace creation, listing, and management
 */

const express = require('express');
const Joi = require('joi');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes in this file require authentication
router.use(authenticateToken);

// Validation schemas
const createWorkspaceSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional()
});

// Generate simple 8-digit workspace ID
const generateWorkspaceId = () => {
  // Generate an 8-digit ID
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

// Create a new workspace
router.post('/', async (req, res) => {
  try {
    const { error, value } = createWorkspaceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, description } = value;
    const userId = req.user.userId;

    // Start a database transaction
    // This ensures all operations succeed or all fail together
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Generate unique workspace ID
      const workspaceId = generateWorkspaceId();

      // Create the workspace
      const workspaceResult = await client.query(
        'INSERT INTO workspaces (workspace_id, name, description, owner_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [workspaceId, name, description, userId]
      );

      const workspace = workspaceResult.rows[0];

      // Add the creator as a member of the workspace
      await client.query(
        'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3)',
        [workspace.id, userId, 'owner']
      );

      // Create a default "general" channel
      const channelResult = await client.query(
        'INSERT INTO channels (name, description, workspace_id, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
        ['general', 'General discussion channel', workspace.id, userId]
      );

      const generalChannel = channelResult.rows[0];

      // Add the creator to the general channel
      await client.query(
        'INSERT INTO channel_members (channel_id, user_id) VALUES ($1, $2)',
        [generalChannel.id, userId]
      );

      await client.query('COMMIT');

      res.status(201).json({
        message: 'Workspace created successfully',
        workspace: {
          id: workspace.workspace_id,
          name: workspace.name,
          description: workspace.description,
          ownerId: workspace.owner_id,
          createdAt: workspace.created_at
        },
        defaultChannel: {
          id: generalChannel.id,
          name: generalChannel.name,
          description: generalChannel.description
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Create workspace error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all workspaces for the current user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(`
      SELECT w.*, wm.role, wm.joined_at
      FROM workspaces w
      JOIN workspace_members wm ON w.id = wm.workspace_id
      WHERE wm.user_id = $1
      ORDER BY w.created_at DESC
    `, [userId]);

    res.json({
      workspaces: result.rows.map(row => ({
        id: row.workspace_id,
        name: row.name,
        description: row.description,
        ownerId: row.owner_id,
        role: row.role,
        joinedAt: row.joined_at,
        createdAt: row.created_at
      }))
    });

  } catch (error) {
    console.error('Get workspaces error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific workspace with its channels
router.get('/:workspaceId', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.userId;

    // Get workspace details first to get the internal ID
    const workspaceResult = await pool.query(
      'SELECT * FROM workspaces WHERE workspace_id = $1',
      [workspaceId]
    );

    if (workspaceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const workspace = workspaceResult.rows[0];

    // Check if user is a member of this workspace
    const memberCheck = await pool.query(
      'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
      [workspace.id, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }

    // Get channels that the user is a member of
    const channelsResult = await pool.query(`
      SELECT c.*, cm.joined_at
      FROM channels c
      JOIN channel_members cm ON c.id = cm.channel_id
      WHERE c.workspace_id = $1 AND cm.user_id = $2
      ORDER BY c.created_at ASC
    `, [workspace.id, userId]);

    const userRole = memberCheck.rows[0].role;

    res.json({
      workspace: {
        id: workspace.workspace_id,
        name: workspace.name,
        description: workspace.description,
        ownerId: workspace.owner_id,
        userRole,
        createdAt: workspace.created_at
      },
      channels: channelsResult.rows.map(channel => ({
        id: channel.id,
        name: channel.name,
        description: channel.description,
        isPrivate: channel.is_private,
        joinedAt: channel.joined_at,
        createdAt: channel.created_at
      }))
    });

  } catch (error) {
    console.error('Get workspace error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Join a workspace by invitation
router.post('/:workspaceId/join', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.userId;

    // Check if workspace exists
    const workspaceResult = await pool.query(
      'SELECT * FROM workspaces WHERE workspace_id = $1',
      [workspaceId]
    );

    if (workspaceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const workspace = workspaceResult.rows[0];

    // Check if user is already a member
    const memberCheck = await pool.query(
      'SELECT id FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
      [workspace.id, userId]
    );

    if (memberCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Already a member of this workspace' });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Add user to workspace
      await client.query(
        'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3)',
        [workspace.id, userId, 'member']
      );

      // Add user to all public channels in the workspace
      const publicChannelsResult = await client.query(
        'SELECT id FROM channels WHERE workspace_id = $1 AND is_private = false',
        [workspace.id]
      );

      for (const channel of publicChannelsResult.rows) {
        // Check if user is not already a member
        const existingMember = await client.query(
          'SELECT id FROM channel_members WHERE channel_id = $1 AND user_id = $2',
          [channel.id, userId]
        );
        
        if (existingMember.rows.length === 0) {
          await client.query(
            'INSERT INTO channel_members (channel_id, user_id) VALUES ($1, $2)',
            [channel.id, userId]
          );
        }
      }

      await client.query('COMMIT');

      res.json({ 
        message: 'Successfully joined workspace',
        workspace: {
          id: workspace.workspace_id,
          name: workspace.name,
          description: workspace.description
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Join workspace error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get workspace invite info (for sharing)
router.get('/:workspaceId/invite-info', async (req, res) => {
  try {
    const { workspaceId } = req.params; // this is the public string id (workspace_id)
    const userId = req.user.userId;

    // Load workspace by public id to get internal numeric id
    const workspaceResult = await pool.query(
      'SELECT id, workspace_id, name, description FROM workspaces WHERE workspace_id = $1',
      [workspaceId]
    );

    if (workspaceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const workspace = workspaceResult.rows[0];

    // Check if user is a member of this workspace (use internal id)
    const memberCheck = await pool.query(
      'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
      [workspace.id, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }

    res.json({
      id: workspace.workspace_id,
      name: workspace.name,
      description: workspace.description,
      inviteUrl: `${process.env.CORS_ORIGIN}/join-workspace/${workspace.workspace_id}`
    });

  } catch (error) {
    console.error('Get invite info error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
