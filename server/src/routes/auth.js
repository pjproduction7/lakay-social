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
import { sendSMS } from "../services/sms.js";

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
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

router.post("/signup", authLimiter, async (req, res) => {
  const parse = signupSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.flatten().fieldErrors });
  }

  const { username, password, email } = parse.data;
  try {
    const existing = await query(
      "SELECT id, username, email FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($2)",
      [username, email]
    );
    if (existing.rowCount > 0) {
      const row = existing.rows[0];
      if (row.username && row.username.toLowerCase() === username.toLowerCase()) {
        return res.status(409).json({ error: "Username already exists" });
      }
      if (row.email && row.email.toLowerCase() === email.toLowerCase()) {
        return res.status(409).json({ error: "Email already exists" });
      }
      return res.status(409).json({ error: "Username or email already exists" });
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
    }

    // Send welcome email to user
    try {
      await sendEmail({
        to: email,
        subject: "Welcome to Lakay Social!",
        text: `Thank you for signing up, ${username}! Please be respectful and follow our community policy.`,
        html: `<h2>Welcome to Lakay Social!</h2><p>Thank you for signing up, <b>${username}</b>!</p><p>Please be respectful and follow our <a href="https://lakay.social/policies">community policy</a>.</p>`
      });
    } catch (userEmailErr) {
      console.error("Failed to send welcome email to user:", userEmailErr);
    }

    // Send SMS to user if phone number is provided and valid
    if (req.body.phone) {
      try {
        await sendSMS({
          to: req.body.phone,
          body: `Welcome to Lakay Social, ${username}! Please be respectful and follow our community policy: https://lakay.social/policies`
        });
      } catch (smsErr) {
        console.error("Failed to send SMS to user:", smsErr);
      }
    }
    
    res.status(201).json({ user: insert.rows[0], token });
  } catch (err) {
    if (err && err.code === "23505") {
      return res.status(409).json({ error: "Username or email already exists" });
    }
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
  const normalizedUsername = username.trim();
  try {
    const result = await query(
      "SELECT id, username, email, password_hash, mfa_secret, mfa_enabled FROM users WHERE LOWER(username) = LOWER($1)",
      [normalizedUsername]
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

    // Send login notification email to user
    try {
      await sendEmail({
        to: user.email,
        subject: "Lakay Social Login Notification",
        text: `Hi ${user.username}, you have just signed in to Lakay Social. If this wasn't you, please reset your password immediately.\n\nRemember to be respectful and follow our community policy: https://lakay.social/policies`,
        html: `<p>Hi <b>${user.username}</b>, you have just signed in to Lakay Social.</p><p>If this wasn't you, please <a href='https://lakay.social/reset-password'>reset your password</a> immediately.</p><p>Remember to be respectful and follow our <a href='https://lakay.social/policies'>community policy</a>.</p>`
      });
    } catch (loginEmailErr) {
      console.error("Failed to send login notification email to user:", loginEmailErr);
    }

    // Send SMS to user if phone number is available in DB (optional, if you store phone numbers)
    if (user.phone) {
      try {
        await sendSMS({
          to: user.phone,
          body: `You have just signed in to Lakay Social. If this wasn't you, reset your password. Be respectful: https://lakay.social/policies`
        });
      } catch (smsErr) {
        console.error("Failed to send login SMS to user:", smsErr);
      }
    }
    
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

// Change password for the currently authenticated user
router.post("/change-password", requireAuth, async (req, res) => {
  const parse = changePasswordSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.flatten().fieldErrors });
  }

  const { currentPassword, newPassword } = parse.data;
  if (currentPassword === newPassword) {
    return res.status(400).json({ error: "New password must be different from the current password" });
  }

  try {
    const result = await query("SELECT password_hash FROM users WHERE id = $1", [req.user.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, req.user.id]);
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Change password failed:", err);
    res.status(500).json({ error: "Failed to change password" });
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
