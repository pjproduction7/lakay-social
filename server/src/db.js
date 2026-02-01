import { Pool } from "pg";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnvPath = path.resolve(__dirname, "../../.env");
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath, override: false });
}
if (!process.env.DATABASE_URL) {
  console.warn("⚠️ DATABASE_URL is not set. Set it in .env or via Railway env vars.");
}

if (process.env.DATABASE_URL?.startsWith("mysql://")) {
  console.error("❌ DATABASE_URL points to MySQL, but this backend requires a PostgreSQL connection string.");
  console.error("   Example: postgresql://USER:PASSWORD@HOST:PORT/DATABASE");
  process.exit(1);
}
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("railway")
    ? { rejectUnauthorized: false }
    : undefined,
});

export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV !== "production") {
    console.log("Executed query", { text, duration, rows: res.rowCount });
  }
  return res;
}
