import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import rateLimit from "express-rate-limit";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { sendEmail } from "../services/email.js";

const router = Router();
const { JWT_SECRET = "change-me" } = process.env;

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const loginSchema = z.object({
  username: z.string().min(3).max(32),
  password: z.string().min(8).max(128),
  mfaToken: z.string().optional(),
});
const signupSchema = loginSchema.extend({
  email: z.string().email(),
});

router.post("/signup", authLimiter, async (req, res) => {
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
    
    // Send email notification to admin
    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: "New User Registration - Lakay Social",
        text: `A new user has registered:\n\nUsername: ${username}\nEmail: ${email}\nCreated: ${insert.rows[0].created_at}`,
        html: `<h2>New User Registration</h2><p><strong>Username:</strong> ${username}</p><p><strong>Email:</strong> ${email}</p><p><strong>Created:</strong> ${insert.rows[0].created_at}</p>`
      });
    } catch (emailErr) {
      console.error("Failed to send registration email:", emailErr);
      // Don't fail the signup if email fails
    }
    
    res.status(201).json({ user: insert.rows[0], token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Signup failed" });
  }
});

router.post("/login", authLimiter, async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid credentials" });
  }

  const { username, password, mfaToken } = parse.data;
  try {
    const result = await query(
      "SELECT id, username, email, password_hash, mfa_secret, mfa_enabled FROM users WHERE username = $1",
      [username]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Check MFA if enabled
    if (user.mfa_enabled) {
      if (!mfaToken) {
        return res.status(401).json({ error: "MFA token required", requiresMfa: true });
      }
      const verified = speakeasy.totp.verify({ secret: user.mfa_secret, encoding: "base32", token: mfaToken });
      if (!verified) {
        return res.status(401).json({ error: "Invalid MFA token" });
      }
    }

    const accessToken = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
    
    // Set httpOnly cookies
    res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 });
    
    res.json({ 
      accessToken, 
      refreshToken,
      user: { id: user.id, username: user.username, email: user.email } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token required" });
  }
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    const accessToken = jwt.sign({ id: decoded.id, username: decoded.username }, JWT_SECRET, { expiresIn: "15m" });
    res.json({ accessToken });
  } catch (err) {
    return res.status(401).json({ error: "Invalid refresh token" });
  }
});

// MFA Setup
router.post("/mfa/setup", requireAuth, async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({ name: "Lakay Social", issuer: "Lakay" });
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
    // Store temp secret in session or return it (for demo, return and require enable)
    res.json({ secret: secret.base32, qrCodeUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "MFA setup failed" });
  }
});

// Enable MFA
router.post("/mfa/enable", requireAuth, async (req, res) => {
  const { secret, token } = req.body;
  if (!secret || !token) {
    return res.status(400).json({ error: "Secret and token required" });
  }
  const verified = speakeasy.totp.verify({ secret, encoding: "base32", token });
  if (!verified) {
    return res.status(400).json({ error: "Invalid token" });
  }
  try {
    await query("UPDATE users SET mfa_secret = $1, mfa_enabled = TRUE WHERE id = $2", [secret, req.user.id]);
    res.json({ message: "MFA enabled" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to enable MFA" });
  }
});

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ message: "Logged out" });
});

export default router;
