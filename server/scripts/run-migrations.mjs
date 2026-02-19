import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../src/db.js';

async function ensureMigrationsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS migrations (
      name TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
}

async function getApplied() {
  const res = await query('SELECT name FROM migrations');
  return new Set(res.rows.map(r => r.name));
}

export async function run() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const migrationsDir = path.resolve(__dirname, '../sql/migrations');

  console.log('Migrations dir:', migrationsDir);
  await ensureMigrationsTable();
  const applied = await getApplied();

  const files = (await fs.readdir(migrationsDir))
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      console.log('Skipping already applied:', file);
      continue;
    }

    console.log('Applying migration:', file);
    const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
    try {
      await query(sql);
      await query('INSERT INTO migrations(name) VALUES ($1)', [file]);
      console.log('Applied:', file);
    } catch (err) {
      console.error('Failed to apply migration', file, err);
      process.exit(1);
    }
  }

  console.log('All migrations processed.');
}

// If script is executed directly, run immediately. Otherwise other modules can import { run }.
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  run().catch((err) => {
    console.error('Migration runner failed:', err);
    process.exit(1);
  });
}