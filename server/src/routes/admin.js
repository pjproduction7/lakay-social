import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Middleware to check admin role
function requireAdmin(req, res, next) {
  const adminUsername = (process.env.ADMIN_USERNAME || "admin").trim().toLowerCase();
  if (req.user.username.toLowerCase() !== adminUsername) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

// GET /admin/users - Get all users
router.get("/users", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.username, u.email, u.created_at,
              p.display_name, p.bio, p.location, p.photo_url
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       ORDER BY u.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// DELETE /admin/users/:username - Delete a user
router.delete("/users/:username", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { username } = req.params;
    const adminUsername = (process.env.ADMIN_USERNAME || "admin").trim().toLowerCase();
    if (username.toLowerCase() === adminUsername) {
      return res.status(400).json({ error: "Cannot delete admin user" });
    }
    const userResult = await query(
      "SELECT id FROM users WHERE LOWER(username) = $1",
      [username.toLowerCase()]
    );
    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const userId = userResult.rows[0].id;
    await query("DELETE FROM messages WHERE username = $1 OR sender = $1 OR recipient = $1", [username.toLowerCase()]);
    await query("DELETE FROM posts WHERE username = $1", [username.toLowerCase()]);
    await query("DELETE FROM profiles WHERE user_id = $1", [userId]);
    await query("DELETE FROM users WHERE id = $1", [userId]);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// GET /admin/stats - Get app statistics
router.get("/stats", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const users = await query("SELECT COUNT(*) as count FROM users");
    const posts = await query("SELECT COUNT(*) as count FROM posts");
    const messages = await query("SELECT COUNT(*) as count FROM messages");
    res.json({
      totalUsers: parseInt(users.rows[0].count),
      totalPosts: parseInt(posts.rows[0].count),
      totalMessages: parseInt(messages.rows[0].count),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
