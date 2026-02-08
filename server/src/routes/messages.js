import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { emitPublicChatMessage, emitPrivateChatMessage } from "../realtime.js";

const router = Router();

// GET /messages/public - Get public chat messages
router.get("/public", async (_req, res) => {
  try {
    const result = await query(
      "SELECT id, username as sender, content, created_at FROM messages WHERE recipient IS NULL ORDER BY created_at DESC LIMIT 50"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch public messages" });
  }
});

// POST /messages/public - Send public chat message
router.post("/public", requireAuth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Message content is required" });
    }
    const result = await query(
      "INSERT INTO messages (sender, content, type) VALUES ($1, $2, 'public') RETURNING id, sender, content, created_at",
      [req.user.username, content.trim()]
    );
    const message = result.rows[0];
    emitPublicChatMessage(message);
    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// GET /messages/private/:recipient - Get private messages with a user
router.get("/private/:recipient", requireAuth, async (req, res) => {
  try {
    const { recipient } = req.params;
    const result = await query(
      `SELECT id, sender, recipient, content, created_at FROM messages
       WHERE recipient IS NOT NULL
       AND ((sender = $1 AND recipient = $2) OR (sender = $2 AND recipient = $1))
       ORDER BY created_at ASC`,
      [req.user.username, recipient.toLowerCase()]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch private messages" });
  }
});

// GET /messages/private - Get all private messages for current user
router.get("/private", requireAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, sender, recipient, content, created_at FROM messages
       WHERE recipient IS NOT NULL
       AND (sender = $1 OR recipient = $1)
       ORDER BY created_at ASC`,
      [req.user.username]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch private messages" });
  }
});

// POST /messages/private - Send private message
router.post("/private", requireAuth, async (req, res) => {
  try {
    const { recipient, content } = req.body;
    if (!recipient || !content || !content.trim()) {
      return res.status(400).json({ error: "Recipient and content are required" });
    }
    const result = await query(
      "INSERT INTO messages (sender, recipient, content, type) VALUES ($1, $2, $3, 'private') RETURNING id, sender, recipient, content, created_at",
      [req.user.username, recipient.toLowerCase(), content.trim()]
    );
    const message = result.rows[0];
    emitPrivateChatMessage(message);
    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;
// Trigger redeploy
