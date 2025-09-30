/**
 * Database migration script - adds workspace_id column
 */

const pool = require('../config/database');

const addWorkspaceIdColumn = async () => {
  try {
    console.log('🚀 Adding workspace_id column...');

    // Add workspace_id column if it doesn't exist
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='workspaces' AND column_name='workspace_id') THEN
          ALTER TABLE workspaces ADD COLUMN workspace_id VARCHAR(20);
          
          -- Update existing workspaces with generated IDs
          UPDATE workspaces SET workspace_id = 
            ((EXTRACT(EPOCH FROM created_at) * 1000 - 1420070400000)::bigint << 12 | (random() * 4096)::int)::text
            WHERE workspace_id IS NULL;
            
          -- Make workspace_id NOT NULL and UNIQUE
          ALTER TABLE workspaces ALTER COLUMN workspace_id SET NOT NULL;
          ALTER TABLE workspaces ADD CONSTRAINT workspace_id_unique UNIQUE (workspace_id);
        END IF;
      END $$;
    `);
    console.log('✅ Workspace ID column added/updated');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

addWorkspaceIdColumn();
