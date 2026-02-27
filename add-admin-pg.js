import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL
});

const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || 'admin').trim();
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@lakaysocial.com').trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function addAdmin() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set');
    }
    if (!ADMIN_PASSWORD) {
      throw new Error('ADMIN_PASSWORD is not set');
    }

    await client.connect();
    console.log('Connected to PostgreSQL');

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

    await client.query(
      `
      INSERT INTO users (username, email, password_hash)
      VALUES ($1, $2, $3)
      ON CONFLICT (username) DO NOTHING
    `,
      [ADMIN_USERNAME, ADMIN_EMAIL, hashedPassword]
    );

    console.log('Admin user created (or already exists).');
    console.log(`Username: ${ADMIN_USERNAME}`);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

addAdmin();
