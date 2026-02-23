import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn('⚠️ DATABASE_URL is not set. Set it in .env or via Railway env vars.');
}

// Log parsed DB config for debugging (masks password)
try {
  const url = new URL(process.env.DATABASE_URL);
  console.log('[DB] target via DATABASE_URL', {
    host: url.hostname,
    user: url.username,
    db: url.pathname.slice(1),
    port: url.port,
  });
} catch (e) {
  console.error('[DB] Failed to parse DATABASE_URL for logging:', e.message);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

pool.on('connect', () => {
  console.log('[DB] New client connected to PostgreSQL');
});

/**
 * Run a query against the pool.
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters
 */
export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('[DB] query executed', { text: text.slice(0, 80), duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('[DB] query error', { text: text.slice(0, 80), error: err.message });
    throw err;
  }
}

/**
 * Get a client from the pool (for transactions).
 */
export async function getClient() {
  const client = await pool.connect();
  return client;
}

export default pool;