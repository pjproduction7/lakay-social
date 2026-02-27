import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL
});

async function checkAdmin() {
  try {
    await client.connect();
    
    const result = await client.query(
      'SELECT username, password_hash FROM users WHERE username = $1',
      ['admin']
    );
    
    if (result.rows.length === 0) {
      console.log('❌ Admin user not found!');
      return;
    }
    
    const user = result.rows[0];
    console.log('✅ Found user:', user.username);
    console.log('Password hash:', user.password_hash.substring(0, 20) + '...');
    
    // Test password
    const testPassword = process.env.ADMIN_PASSWORD || '';
    if (!testPassword) {
      throw new Error('ADMIN_PASSWORD is not set');
    }
    const match = await bcrypt.compare(testPassword, user.password_hash);
    console.log('\n🔐 Password test:', match ? '✅ MATCH' : '❌ NO MATCH');
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

checkAdmin();
