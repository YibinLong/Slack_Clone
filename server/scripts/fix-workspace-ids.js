/**
 * Fix existing workspace IDs to be 8 digits
 */

const pool = require('../config/database');

const generateWorkspaceId = () => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

const fixWorkspaceIds = async () => {
  try {
    console.log('🚀 Fixing workspace IDs...');

    // Get all workspaces
    const workspaces = await pool.query('SELECT id, workspace_id FROM workspaces');
    
    for (const workspace of workspaces.rows) {
      // Check if workspace_id is null or doesn't look like an 8-digit ID
      if (!workspace.workspace_id || workspace.workspace_id.length !== 8) {
        const newId = generateWorkspaceId();
        
        // Make sure the new ID doesn't already exist
        let unique = false;
        let attempts = 0;
        let finalId = newId;
        
        while (!unique && attempts < 10) {
          const existing = await pool.query(
            'SELECT id FROM workspaces WHERE workspace_id = $1',
            [finalId]
          );
          
          if (existing.rows.length === 0) {
            unique = true;
          } else {
            finalId = generateWorkspaceId();
            attempts++;
          }
        }
        
        if (unique) {
          await pool.query(
            'UPDATE workspaces SET workspace_id = $1 WHERE id = $2',
            [finalId, workspace.id]
          );
          
          console.log(`✅ Updated workspace ${workspace.id}: ${workspace.workspace_id || 'NULL'} -> ${finalId}`);
        } else {
          console.log(`❌ Could not generate unique ID for workspace ${workspace.id}`);
        }
      } else {
        console.log(`✅ Workspace ${workspace.id} already has good ID: ${workspace.workspace_id}`);
      }
    }

    console.log('🎉 Workspace ID fixing completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fixing failed:', error);
    process.exit(1);
  }
};

fixWorkspaceIds();
