import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL
});

async function setupDatabase() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');
    
    const schema = fs.readFileSync('server/sql/schema.sql', 'utf8');
    await client.query(schema);
    console.log('✅ Tables created successfully!');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

setupDatabase();