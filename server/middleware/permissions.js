/**
 * Permission middleware
 * Checks user roles and permissions for workspace/channel operations
 */

const pool = require('../config/database');

/**
 * Permission Hierarchy:
 * - owner: Full control, can't be removed, can delete workspace
 * - admin: Can manage channels, invite/remove members (except owner/admin), manage roles
 * - member: Can create channels, send messages, leave workspace
 */

// Check if user is workspace owner
const isWorkspaceOwner = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.userId;

    // Get workspace and check if user is owner
    const result = await pool.query(
      'SELECT owner_id FROM workspaces WHERE workspace_id = $1',
      [workspaceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (result.rows[0].owner_id !== userId) {
      return res.status(403).json({ error: 'Only workspace owner can perform this action' });
    }

    next();
  } catch (error) {
    console.error('Permission check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Check if user is workspace owner or admin
const isWorkspaceAdmin = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.userId;

    // Get workspace to check ownership
    const workspaceResult = await pool.query(
      'SELECT id, owner_id FROM workspaces WHERE workspace_id = $1',
      [workspaceId]
    );

    if (workspaceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const workspace = workspaceResult.rows[0];

    // Check if user is owner
    if (workspace.owner_id === userId) {
      req.userRole = 'owner';
      return next();
    }

    // Check if user is admin
    const memberResult = await pool.query(
      'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
      [workspace.id, userId]
    );

    if (memberResult.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }

    const role = memberResult.rows[0].role;
    if (role === 'admin' || role === 'owner') {
      req.userRole = role;
      return next();
    }

    return res.status(403).json({ error: 'Admin privileges required' });
  } catch (error) {
    console.error('Permission check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Check if user is a member of workspace (any role)
const isWorkspaceMember = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.userId;

    // Get workspace internal ID
    const workspaceResult = await pool.query(
      'SELECT id FROM workspaces WHERE workspace_id = $1',
      [workspaceId]
    );

    if (workspaceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const workspace = workspaceResult.rows[0];

    // Check membership
    const memberResult = await pool.query(
      'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
      [workspace.id, userId]
    );

    if (memberResult.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }

    req.userRole = memberResult.rows[0].role;
    next();
  } catch (error) {
    console.error('Permission check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  isWorkspaceOwner,
  isWorkspaceAdmin,
  isWorkspaceMember
};
