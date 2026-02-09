import { query } from "./src/db.js";

async function checkUsers() {
  try {
    const result = await query("SELECT id, username, email FROM users");
    console.log("Users in database:");
    result.rows.forEach(user => console.log(user));
  } catch (err) {
    console.error("Error:", err);
  }
}

checkUsers();