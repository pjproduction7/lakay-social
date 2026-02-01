import { Client } from "pg";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnvPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: rootEnvPath, override: true });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("railway")
    ? { rejectUnauthorized: false }
    : undefined,
});

await client.connect();
const res = await client.query(
  "SELECT id, username, email, password_hash FROM users WHERE username = $1",
  ["admin"]
);
const row = res.rows[0];
if (row) {
  const matchesEnv = await bcrypt.compare(process.env.ADMIN_PASSWORD || "", row.password_hash);
  console.log({ ...row, matchesEnv });
} else {
  console.log([]);
}
await client.end();
