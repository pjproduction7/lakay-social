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

// POST /admin/users/:username/role - Assign role to user
router.post("/users/:username/role", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { username } = req.params;
    const { role } = req.body; // e.g., 'moderator', 'banned', 'shadow_banned'
    if (!role) {
      return res.status(400).json({ error: "Role is required" });
    }
    const userResult = await query("SELECT id FROM users WHERE LOWER(username) = $1", [username.toLowerCase()]);
    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const userId = userResult.rows[0].id;
    await query(
      "INSERT INTO user_roles (user_id, role, granted_by) VALUES ($1, $2, $3) ON CONFLICT (user_id, role) DO NOTHING",
      [userId, role, req.user.id]
    );
    res.json({ message: `Role ${role} assigned to ${username}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to assign role" });
  }
});

// DELETE /admin/users/:username/role/:role - Remove role from user
router.delete("/users/:username/role/:role", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { username, role } = req.params;
    const userResult = await query("SELECT id FROM users WHERE LOWER(username) = $1", [username.toLowerCase()]);
    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const userId = userResult.rows[0].id;
    await query("DELETE FROM user_roles WHERE user_id = $1 AND role = $2", [userId, role]);
    res.json({ message: `Role ${role} removed from ${username}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove role" });
  }
});

// GET /admin/users/:username/roles - Get user roles
router.get("/users/:username/roles", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { username } = req.params;
    const userResult = await query("SELECT id FROM users WHERE LOWER(username) = $1", [username.toLowerCase()]);
    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const userId = userResult.rows[0].id;
    const rolesResult = await query("SELECT role FROM user_roles WHERE user_id = $1", [userId]);
    res.json({ roles: rolesResult.rows.map(r => r.role) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch roles" });
  }
});

// GET /admin/logs - Get recent admin actions (simplified logs)
router.get("/logs", requireAuth, requireAdmin, async (_req, res) => {
  try {
    // For now, return recent user creations and role changes
    const recentUsers = await query("SELECT username, created_at FROM users ORDER BY created_at DESC LIMIT 10");
    const recentRoles = await query(`
      SELECT ur.role, u.username as target, g.username as granted_by, ur.granted_at
      FROM user_roles ur
      JOIN users u ON ur.user_id = u.id
      LEFT JOIN users g ON ur.granted_by = g.id
      ORDER BY ur.granted_at DESC LIMIT 10
    `);
    res.json({
      recentUsers: recentUsers.rows,
      recentRoleChanges: recentRoles.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

export default router;
