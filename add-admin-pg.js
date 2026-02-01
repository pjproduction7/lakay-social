import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL
});

async function addAdmin() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');
    
    const hashedPassword = await bcrypt.hash('Titoutou7@Delmas19', 10);
    
    await client.query(`
      INSERT INTO users (username, email, password_hash)
      VALUES ($1, $2, $3)
      ON CONFLICT (username) DO NOTHING
    `, ['admin', 'admin@lakaysocial.com', hashedPassword]);
    
    console.log('✅ Admin user created!');
    console.log('Username: admin');
    console.log('Password: Titoutou7@Delmas19');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

addAdmin();