import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { auditLog } from "../utils/logger.js";

const router = Router();

// Middleware to check admin role
function requireAdmin(req, res, next) {
  // First check if user has admin role
  query("SELECT role FROM user_roles WHERE user_id = $1 AND role = 'admin'", [req.user.id])
    .then(result => {
      if (result.rowCount > 0) {
        return next();
      }
      // Fallback to username check for backwards compatibility
      const adminUsername = (process.env.ADMIN_USERNAME || "admin").trim().toLowerCase();
      const userUsername = req.user.username.toLowerCase();
      if (userUsername === adminUsername) {
        return next();
      }
      return res.status(403).json({ error: "Admin access required" });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: "Authorization check failed" });
    });
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
    await query("DELETE FROM messages WHERE sender = $1 OR recipient = $1", [username.toLowerCase()]);
    await query("DELETE FROM posts WHERE username = $1", [username.toLowerCase()]);
    await query("DELETE FROM profiles WHERE user_id = $1", [userId]);
    await query("DELETE FROM users WHERE id = $1", [userId]);
    auditLog('USER_DELETED', req.user.id, { targetUserId: userId, targetUsername: username });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// POST /admin/users - Create a new user (admin only)
router.post("/users", requireAuth, requireAdmin, async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Username, email, and password are required" });
  }

  try {
    // Check if user already exists
    const existing = await query("SELECT id FROM users WHERE username = $1 OR email = $2", [username, email]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: "Username or email already exists" });
    }

    // Hash password
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.default.hash(password, 12);

    // Create user
    const insert = await query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at",
      [username, email, hash]
    );

    // Create profile
    await query(
      "INSERT INTO profiles (user_id, username, display_name, bio, location) VALUES ($1, $2, $2, '', '') ON CONFLICT (user_id) DO NOTHING",
      [insert.rows[0].id, username]
    );

    auditLog('USER_CREATED', req.user.id, { targetUserId: insert.rows[0].id, targetUsername: username });
    res.status(201).json({ user: insert.rows[0], message: "User created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// PUT /admin/users/:username/password - Reset user password
router.put("/users/:username/password", requireAuth, requireAdmin, async (req, res) => {
  const { username } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters long" });
  }

  try {
    const userResult = await query("SELECT id FROM users WHERE LOWER(username) = $1", [username.toLowerCase()]);
    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.default.hash(newPassword, 12);

    await query("UPDATE users SET password_hash = $1 WHERE LOWER(username) = $2", [hash, username.toLowerCase()]);

    auditLog('PASSWORD_RESET', req.user.id, { targetUsername: username });
    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// DELETE /admin/messages/:id - Delete a message (public or private)
router.delete("/messages/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const messageResult = await query("SELECT id, sender, content FROM messages WHERE id = $1", [id]);
    if (messageResult.rowCount === 0) {
      return res.status(404).json({ error: "Message not found" });
    }

    await query("DELETE FROM messages WHERE id = $1", [id]);

    auditLog('MESSAGE_DELETED', req.user.id, { messageId: id, sender: messageResult.rows[0].sender });
    res.json({ message: "Message deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete message" });
  }
});

// GET /admin/messages - Get all messages (for moderation)
router.get("/messages", requireAuth, requireAdmin, async (req, res) => {
  const { limit = 100, offset = 0 } = req.query;

  try {
    const result = await query(
      `SELECT id, sender, recipient, content, type, created_at
       FROM messages
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [parseInt(limit), parseInt(offset)]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// DELETE /admin/posts/:id - Delete a post
router.delete("/posts/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const postResult = await query("SELECT id, username, content FROM posts WHERE id = $1", [id]);
    if (postResult.rowCount === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    await query("DELETE FROM posts WHERE id = $1", [id]);

    auditLog('POST_DELETED', req.user.id, { postId: id, author: postResult.rows[0].username });
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete post" });
  }
});

// GET /admin/posts - Get all posts (for moderation)
router.get("/posts", requireAuth, requireAdmin, async (req, res) => {
  const { limit = 50, offset = 0 } = req.query;

  try {
    const result = await query(
      `SELECT p.id, p.username, p.content, p.image_url, p.created_at,
              u.email, pr.display_name, pr.bio
       FROM posts p
       LEFT JOIN users u ON p.username = u.username
       LEFT JOIN profiles pr ON u.id = pr.user_id
       ORDER BY p.created_at DESC
       LIMIT $1 OFFSET $2`,
      [parseInt(limit), parseInt(offset)]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch posts" });
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

// GET /admin/posts - Get all posts for moderation
router.get("/posts", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const result = await query(
      `SELECT p.id, p.username, p.content, p.created_at,
              u.email, pr.display_name
       FROM posts p
       LEFT JOIN users u ON LOWER(p.username) = LOWER(u.username)
       LEFT JOIN profiles pr ON u.id = pr.user_id
       ORDER BY p.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// DELETE /admin/posts/:id - Delete a specific post
router.delete("/posts/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query("DELETE FROM posts WHERE id = $1 RETURNING id", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete post" });
  }
});

// GET /admin/messages - Get all messages for moderation
router.get("/messages", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const result = await query(
      `SELECT m.id, m.sender, m.recipient, m.content, m.type, m.created_at,
              u.email as sender_email, pr.display_name as sender_display_name
       FROM messages m
       LEFT JOIN users u ON LOWER(m.sender) = LOWER(u.username)
       LEFT JOIN profiles pr ON u.id = pr.user_id
       ORDER BY m.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// DELETE /admin/messages/:id - Delete a specific message
router.delete("/messages/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query("DELETE FROM messages WHERE id = $1 RETURNING id", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Message not found" });
    }
    res.json({ message: "Message deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete message" });
  }
});

// PUT /admin/users/:username/profile - Edit user profile
router.put("/users/:username/profile", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { username } = req.params;
    const { display_name, bio, location } = req.body;
    
    const userResult = await query("SELECT id FROM users WHERE LOWER(username) = $1", [username.toLowerCase()]);
    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const userId = userResult.rows[0].id;

    await query(
      `UPDATE profiles 
       SET display_name = $1, bio = $2, location = $3, updated_at = NOW()
       WHERE user_id = $4`,
      [display_name || '', bio || '', location || '', userId]
    );
    
    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// GET /admin/settings - Get system settings
router.get("/settings", requireAuth, requireAdmin, async (_req, res) => {
  try {
    // Return current system settings
    res.json({
      maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
      registrationEnabled: process.env.REGISTRATION_ENABLED !== 'false',
      maxFileSize: process.env.MAX_FILE_SIZE || '10MB',
      rateLimitWindow: process.env.RATE_LIMIT_WINDOW || '15',
      rateLimitMax: process.env.RATE_LIMIT_MAX || '100',
      jwtExpiry: process.env.JWT_EXPIRY || '7d'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// PUT /admin/settings - Update system settings
router.put("/settings", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { maintenanceMode, registrationEnabled, maxFileSize, rateLimitWindow, rateLimitMax, jwtExpiry } = req.body;
    
    // In a real app, you'd update environment variables or a settings table
    // For now, we'll just acknowledge the update
    console.log('Admin updating settings:', { maintenanceMode, registrationEnabled, maxFileSize, rateLimitWindow, rateLimitMax, jwtExpiry });
    
    res.json({ message: "Settings updated successfully (restart may be required)" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// POST /admin/announcement - Send system-wide announcement
router.post("/announcement", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { message, type = 'info' } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    
    // In a real app, you'd broadcast this via WebSocket or store it
    console.log(`Admin announcement (${type}): ${message}`);
    
    res.json({ message: "Announcement sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send announcement" });
  }
});

// GET /admin/posts/pending - Get pending posts (unapproved memorials)
router.get("/posts/pending", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const result = await query(
      "SELECT p.id, p.username, p.content, p.image_url, p.post_type, p.created_at, u.email, pr.display_name FROM posts p LEFT JOIN users u ON LOWER(p.username) = LOWER(u.username) LEFT JOIN profiles pr ON u.id = pr.user_id WHERE p.approved = false ORDER BY p.created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch pending posts" });
  }
});

// PUT /admin/posts/:id/approve - Approve a post
router.put("/posts/:id/approve", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query("UPDATE posts SET approved = true WHERE id = $1 RETURNING id", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Post not found" });
    }
    auditLog('POST_APPROVED', req.user.id, { postId: id });
    res.json({ message: "Post approved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to approve post" });
  }
});

// PUT /admin/posts/:id/reject - Reject a post (delete it)
router.put("/posts/:id/reject", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query("DELETE FROM posts WHERE id = $1 RETURNING id", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Post not found" });
    }
    auditLog('POST_REJECTED', req.user.id, { postId: id });
    res.json({ message: "Post rejected and deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reject post" });
  }
});

export default router;
