import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// GET /notifications - Get user's notifications
router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await query(
      "SELECT id, type, message, read, created_at FROM notifications WHERE username = $1 ORDER BY created_at DESC LIMIT 50",
      [req.user.username]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// PUT /notifications/:id/read - Mark notification as read
router.put("/:id/read", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await query(
      "UPDATE notifications SET read = true WHERE id = $1 AND username = $2",
      [id, req.user.username]
    );
    res.json({ message: "Notification marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update notification" });
  }
});

// PUT /notifications/read-all - Mark all notifications as read
router.put("/read-all", requireAuth, async (req, res) => {
  try {
    await query(
      "UPDATE notifications SET read = true WHERE username = $1",
      [req.user.username]
    );
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update notifications" });
  }
});

export default router;
