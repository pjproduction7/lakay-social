import { query } from './server/src/db.js';

(async () => {
  try {
    const result = await query('SELECT COUNT(*) as count FROM users');
    console.log('Total users:', result.rows[0].count);

    const adminResult = await query("SELECT username FROM users WHERE username = 'admin'");
    console.log('Admin user exists:', adminResult.rowCount > 0);
    if (adminResult.rowCount > 0) {
      console.log('Admin user found:', adminResult.rows[0]);
    } else {
      console.log('Admin user not found - you may need to create it');
    }
  } catch (err) {
    console.error('Database error:', err.message);
  }
  process.exit(0);
})();