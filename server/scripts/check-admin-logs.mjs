import { query } from '../src/db.js';

(async () => {
  try {
    console.log('Running recentUsers query...');
    const recentUsers = await query("SELECT username, created_at FROM users ORDER BY created_at DESC LIMIT 10");
    console.log('recentUsers rows:', recentUsers.rows);

    console.log('Running recentRoles query...');
    const recentRoles = await query(`
      SELECT ur.role, u.username as target, g.username as granted_by, ur.granted_at
      FROM user_roles ur
      JOIN users u ON ur.user_id = u.id
      LEFT JOIN users g ON ur.granted_by = g.id
      ORDER BY ur.granted_at DESC LIMIT 10
    `);
    console.log('recentRoles rows:', recentRoles.rows);
  } catch (err) {
    console.error('Query error:', err);
    process.exit(1);
  }
  process.exit(0);
})();