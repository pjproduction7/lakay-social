import { Client } from "pg";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath, override: true });

const username = (process.env.ADMIN_USERNAME || "admin").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD;

console.log("Password to be hashed:", password);
if (!password) {
  console.error("ADMIN_PASSWORD missing in .env");
  process.exit(1);
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("railway")
    ? { rejectUnauthorized: false }
    : undefined,
});

await client.connect();
const hash = await bcrypt.hash(password, 12);
const res = await client.query(
  "UPDATE users SET password_hash = $1 WHERE LOWER(username) = LOWER($2) RETURNING id",
  [hash, username]
);
console.log(res.rows.length ? `Updated ${username}` : "User not found");
await client.end();
