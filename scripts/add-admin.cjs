require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@lakaysocial.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const DATABASE_URL = process.env.DATABASE_URL;

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
    const connection = await mysql.createConnection(DATABASE_URL);

    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    console.log('Inserting admin user...');
    await connection.execute(
      'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
      [ADMIN_USERNAME, hashedPassword, ADMIN_EMAIL]
    );

    console.log('Admin user added successfully!');
    console.log(`Username: ${ADMIN_USERNAME}`);

    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

addAdmin();
