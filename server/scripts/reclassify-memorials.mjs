import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath, override: true });

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
const DRY_RUN = (process.env.DRY_RUN || "true").toLowerCase() !== "false";

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL?.includes("railway") ? { rejectUnauthorized: false } : undefined,
});

function looksLikeMemorialContent(content) {
  if (!content || typeof content !== "string") return false;
  const lines = content.split("\n");
  if (lines.length < 3) return false;
  if (lines[1].trim() !== "") return false;
  const firstLine = lines[0].trim();
  const tribute = lines.slice(2).join("\n").trim();
  if (!firstLine || !tribute) return false;

  // Heuristic: memorials often include years like "(1950-2023)" or "(1950–2023)"
  const yearsPattern = /\((\d{4}[^)]*)\)/;
  return yearsPattern.test(firstLine) || firstLine.length <= 80;
}

async function run() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      "SELECT id, content FROM posts WHERE post_type = 'memorial'"
    );

    const toReclassify = [];
    for (const row of rows) {
      if (!looksLikeMemorialContent(row.content)) {
        toReclassify.push(row.id);
      }
    }

    console.log(`Found ${rows.length} memorial posts.`);
    console.log(`Will reclassify ${toReclassify.length} posts to 'post'.`);

    if (DRY_RUN) {
      console.log("DRY_RUN=true -> no changes made.");
      return;
    }

    if (toReclassify.length > 0) {
      await client.query(
        "UPDATE posts SET post_type = 'post' WHERE id = ANY($1::int[])",
        [toReclassify]
      );
    }

    console.log("Reclassification complete.");
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("Reclassification failed:", err);
  process.exit(1);
});
