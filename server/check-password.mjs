import { query } from "./src/db.js";
import bcrypt from "bcryptjs";

async function checkPassword() {
  try {
    const result = await query("SELECT id, username, password_hash FROM users WHERE username = 'admin'");
    if (result.rows.length === 0) {
      console.log("Admin user not found");
      return;
    }
    const user = result.rows[0];
    console.log("Admin user:", user);

    const password = process.env.ADMIN_PASSWORD || "";
    if (!password) {
      throw new Error("ADMIN_PASSWORD is not set");
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    console.log("Password check for ADMIN_PASSWORD:", valid);

    // Also check if the hash was created correctly
    const hash = await bcrypt.hash(password, 12);
    console.log("New hash:", hash);
    const valid2 = await bcrypt.compare(password, hash);
    console.log("New hash check:", valid2);
  } catch (err) {
    console.error("Error:", err);
  }
}

checkPassword();
