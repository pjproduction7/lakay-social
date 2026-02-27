import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '..', '.env.local');
dotenv.config({ path: envPath });

const { DATABASE_URL } = process.env;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@lakaysocial.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is missing. Add it to .env.local before running this script.');
  process.exit(1);
}
if (!ADMIN_PASSWORD) {
  console.error('ADMIN_PASSWORD is missing. Add it to .env.local before running this script.');
  process.exit(1);
}

async function addAdmin() {
  try {
    console.log('Connecting to database...');
    const connection = await mysql.createConnection({
      uri: DATABASE_URL,
      ssl: DATABASE_URL.includes('railway') ? { rejectUnauthorized: false } : undefined,
    });

    console.log('Checking if admin exists...');
    const [rows] = await connection.execute('SELECT id FROM users WHERE username = ?', [ADMIN_USERNAME]);

    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    if (rows.length > 0) {
      console.log('Admin exists. Updating password...');
      await connection.execute('UPDATE users SET password = ?, email = ? WHERE username = ?', [
        hashedPassword,
        ADMIN_EMAIL,
        ADMIN_USERNAME,
      ]);
    } else {
      console.log('Inserting admin user...');
      await connection.execute(
        'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
        [ADMIN_USERNAME, hashedPassword, ADMIN_EMAIL]
      );
    }

    console.log('Admin user ready!');
    console.log(`Username: ${ADMIN_USERNAME}`);

    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

addAdmin();
