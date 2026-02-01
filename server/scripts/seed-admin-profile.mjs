import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import pkg from "pg";

const { Pool } = pkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath, override: true });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("railway")
    ? { rejectUnauthorized: false }
    : undefined,
});

const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || "admin").trim().toLowerCase();
const ADMIN_EMAIL = `${ADMIN_USERNAME}@lakay.social`;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const userRes = await client.query(
      "SELECT id FROM users WHERE LOWER(username) = LOWER($1)",
      [ADMIN_USERNAME]
    );

    let userId;
    if (userRes.rowCount === 0) {
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
      const inserted = await client.query(
        "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id",
        [ADMIN_USERNAME, ADMIN_EMAIL, passwordHash]
      );
      userId = inserted.rows[0].id;
      console.log(`Inserted admin user ${ADMIN_USERNAME}`);
    } else {
      userId = userRes.rows[0].id;
      console.log(`Found admin user ${ADMIN_USERNAME} (id=${userId})`);
    }

    const profileRes = await client.query(
      "SELECT 1 FROM profiles WHERE user_id = $1",
      [userId]
    );

    if (profileRes.rowCount === 0) {
      await client.query(
        "INSERT INTO profiles (user_id, username, display_name, bio, location) VALUES ($1, $2, $2, '', '')",
        [userId, ADMIN_USERNAME]
      );
      console.log("Inserted admin profile");
    } else {
      console.log("Admin profile already exists");
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Failed to seed admin profile", err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
