require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function addAdmin() {
  try {
    console.log('Connecting to database...');
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    console.log('Inserting admin user...');
    await connection.execute(
      'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
      ['admin', hashedPassword, 'admin@lakaysocial.com']
    );
    
    console.log('✅ Admin user added successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('\n⚠️  IMPORTANT: Change this password immediately at lakaysocial.com/settings\n');
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addAdmin();
