import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { query } from "../db.js";

const router = Router();
const { JWT_SECRET = "change-me" } = process.env;
const loginSchema = z.object({
  username: z.string().min(3).max(32),
  password: z.string().min(8).max(128),
});
const signupSchema = loginSchema.extend({
  email: z.string().email(),
});

router.post("/signup", async (req, res) => {
  const parse = signupSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.flatten().fieldErrors });
  }

  const { username, password, email } = parse.data;
  try {
    const existing = await query("SELECT id FROM users WHERE username = $1", [username]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: "Username already exists" });
    }

    const hash = await bcrypt.hash(password, 12);
    const insert = await query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3) RETURNING id, username, email, created_at`,
      [username, email, hash]
    );

    await query(
      `INSERT INTO profiles (user_id, username, display_name, bio, location)
       VALUES ($1, $2, $2, '', '')
       ON CONFLICT (user_id) DO NOTHING`,
      [insert.rows[0].id, username]
    );

    const token = jwt.sign({ id: insert.rows[0].id, username }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ user: insert.rows[0], token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Signup failed" });
  }
});

router.post("/login", async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid credentials" });
  }

  const { username, password } = parse.data;
  try {
    const result = await query(
      "SELECT id, username, email, password_hash FROM users WHERE username = $1",
      [username]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];
    console.log("Login attempt:", { username, submittedPassword: password, dbPasswordHash: user.password_hash });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      console.log("Password comparison failed");
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

export default router;
