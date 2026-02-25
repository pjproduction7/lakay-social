import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new Client({
  connectionString: 'postgresql://postgres:SnqOZmeRTPAdqBLpHabZpITepEDbSGec@maglev.proxy.rlwy.net:25671/railway',
  ssl: { rejectUnauthorized: false }
});

const schema = fs.readFileSync(path.join(__dirname, 'server/sql/schema.sql'), 'utf8');

try {
  await client.connect();
  console.log('Connected to database!');
  await client.query(schema);
  console.log('Schema applied successfully!');
} catch (err) {
  console.error('Error:', err.message);
} finally {
  await client.end();
}