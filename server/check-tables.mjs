import { query } from "./src/db.js";

async function checkTables() {
  try {
    const result = await query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log("Tables in database:");
    result.rows.forEach(row => console.log(row.table_name));
  } catch (err) {
    console.error("Error:", err);
  }
}

checkTables();