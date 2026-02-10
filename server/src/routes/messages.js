import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { emitPublicChatMessage, emitPrivateChatMessage } from '../realtime.js';

const router = Router();

// GET /messages/public - Get public chat messages
router.get('/public', async (_req, res) => {
  try {
    const result = await query(
      'SELECT id, username as sender, content, created_at FROM messages WHERE recipient IS NULL ORDER BY created_at DESC LIMIT 50'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch public messages' });
  }
});

// POST /messages/public - Send public chat message
router.post('/public', requireAuth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }
    const result = await query(
      'INSERT INTO messages (sender, content, type) VALUES (, , \'public\') RETURNING id, sender, content, created_at',
      [req.user.username, content.trim()]
    );
    const message = result.rows[0];
    emitPublicChatMessage(message);
    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// GET /messages/private/:recipient - Get private messages with a user
router.get('/private/:recipient', requireAuth, async (req, res) => {
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
    res.status(500).json({ error: 'Failed to fetch private messages' });
  }
});

// GET /messages/private - Get all private messages for current user
router.get('/private', requireAuth, async (req, res) => {
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
    res.status(500).json({ error: 'Failed to fetch private messages' });
  }
});

// POST /messages/private - Send private message
router.post('/private', requireAuth, async (req, res) => {
  try {
    const { recipient, content } = req.body;
    if (!recipient || !content || !content.trim()) {
      return res.status(400).json({ error: 'Recipient and content are required' });
    }
    const result = await query(
      'INSERT INTO messages (sender, recipient, content, type) VALUES ($1, $2, $3, \'private\') RETURNING id, sender, recipient, content, created_at',
      [req.user.username, recipient.toLowerCase(), content.trim()]
    );
    const message = result.rows[0];
    emitPrivateChatMessage(message);
    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// PUT /messages/public/:id - Edit public message
router.put('/public/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Check if message exists and user is the sender
    const messageResult = await query(
      'SELECT id, sender, content FROM messages WHERE id = $1 AND recipient IS NULL',
      [id]
    );

    if (messageResult.rowCount === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const message = messageResult.rows[0];
    if (message.sender !== req.user.username) {
      return res.status(403).json({ error: 'You can only edit your own messages' });
    }

    // Store original content in edit history for admin archives
    await query(
      'INSERT INTO message_edits (message_id, previous_content, edited_by) VALUES ($1, $2, $3)',
      [id, message.content, req.user.username]
    );

    // Update message
    const updateResult = await query(
      `UPDATE messages
       SET content = $1, edited_at = NOW(), edit_count = edit_count + 1,
           original_content = COALESCE(original_content, $2)
       WHERE id = $3
       RETURNING id, sender, content, created_at, edited_at, edit_count`,
      [content.trim(), message.content, id]
    );

    const updatedMessage = updateResult.rows[0];
    emitPublicChatMessage(updatedMessage);
    res.json(updatedMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to edit message' });
  }
});

// PUT /messages/private/:id - Edit private message
router.put('/private/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Check if message exists and user is the sender
    const messageResult = await query(
      'SELECT id, sender, recipient, content FROM messages WHERE id = $1 AND recipient IS NOT NULL',
      [id]
    );

    if (messageResult.rowCount === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const message = messageResult.rows[0];
    if (message.sender !== req.user.username) {
      return res.status(403).json({ error: 'You can only edit your own messages' });
    }

    // Store original content in edit history for admin archives
    await query(
      'INSERT INTO message_edits (message_id, previous_content, edited_by) VALUES ($1, $2, $3)',
      [id, message.content, req.user.username]
    );

    // Update message
    const updateResult = await query(
      `UPDATE messages
       SET content = $1, edited_at = NOW(), edit_count = edit_count + 1,
           original_content = COALESCE(original_content, $2)
       WHERE id = $3
       RETURNING id, sender, recipient, content, created_at, edited_at, edit_count`,
      [content.trim(), message.content, id]
    );

    const updatedMessage = updateResult.rows[0];
    emitPrivateChatMessage(updatedMessage);
    res.json(updatedMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to edit message' });
  }
});

// DELETE /messages/public/:id - Delete public message
router.delete('/public/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if message exists and user is the sender
    const messageResult = await query(
      'SELECT id, sender, content FROM messages WHERE id = $1 AND recipient IS NULL',
      [id]
    );

    if (messageResult.rowCount === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const message = messageResult.rows[0];
    if (message.sender !== req.user.username) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    // Store deletion in edit history for admin archives
    await query(
      'INSERT INTO message_edits (message_id, previous_content, edited_by) VALUES ($1, $2, $3)',
      [id, message.content, req.user.username]
    );

    // Delete the message
    await query('DELETE FROM messages WHERE id = $1', [id]);

    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// DELETE /messages/private/:id - Delete private message
router.delete('/private/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if message exists and user is the sender
    const messageResult = await query(
      'SELECT id, sender, recipient, content FROM messages WHERE id = $1 AND recipient IS NOT NULL',
      [id]
    );

    if (messageResult.rowCount === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const message = messageResult.rows[0];
    if (message.sender !== req.user.username) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    // Store deletion in edit history for admin archives
    await query(
      'INSERT INTO message_edits (message_id, previous_content, edited_by) VALUES ($1, $2, $3)',
      [id, message.content, req.user.username]
    );

    // Delete the message
    await query('DELETE FROM messages WHERE id = $1', [id]);

    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

export default router;
