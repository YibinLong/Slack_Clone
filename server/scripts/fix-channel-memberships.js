/**
 * Fix channel memberships
 * Ensures all workspace members are in all public channels
 */

const pool = require('../config/database');

const fixChannelMemberships = async () => {
  try {
    console.log('🔧 Starting channel membership fix...');

    // Get all workspaces
    const workspacesResult = await pool.query('SELECT id FROM workspaces');
    
    for (const workspace of workspacesResult.rows) {
      console.log(`\n📦 Processing workspace ID: ${workspace.id}`);
      
      // Get all workspace members
      const membersResult = await pool.query(
        'SELECT user_id FROM workspace_members WHERE workspace_id = $1',
        [workspace.id]
      );
      
      console.log(`   👥 Found ${membersResult.rows.length} members`);
      
      // Get all public channels in this workspace
      const channelsResult = await pool.query(
        'SELECT id, name FROM channels WHERE workspace_id = $1 AND is_private = false',
        [workspace.id]
      );
      
      console.log(`   📺 Found ${channelsResult.rows.length} public channels`);
      
      // For each public channel, ensure all workspace members are members
      for (const channel of channelsResult.rows) {
        console.log(`   ⚙️  Fixing channel: ${channel.name} (ID: ${channel.id})`);
        
        for (const member of membersResult.rows) {
          // Check if user is already a member
          const existingMember = await pool.query(
            'SELECT id FROM channel_members WHERE channel_id = $1 AND user_id = $2',
            [channel.id, member.user_id]
          );
          
          if (existingMember.rows.length === 0) {
            // Add user to channel
            await pool.query(
              'INSERT INTO channel_members (channel_id, user_id) VALUES ($1, $2)',
              [channel.id, member.user_id]
            );
            console.log(`      ✅ Added user ${member.user_id} to channel ${channel.name}`);
          }
        }
      }
    }

    console.log('\n✅ Channel membership fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing channel memberships:', error);
    process.exit(1);
  }
};

fixChannelMemberships();
