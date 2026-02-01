import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// POST /subscriptions - Save push subscription
router.post("/", requireAuth, async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ error: "Invalid subscription data" });
    }
    await query(
      `INSERT INTO push_subscriptions (username, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO UPDATE SET endpoint = $2, p256dh = $3, auth = $4`,
      [req.user.username, endpoint, keys.p256dh, keys.auth]
    );
    res.status(201).json({ message: "Subscription saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save subscription" });
  }
});

// DELETE /subscriptions - Remove push subscription
router.delete("/", requireAuth, async (req, res) => {
  try {
    await query(
      "DELETE FROM push_subscriptions WHERE username = $1",
      [req.user.username]
    );
    res.json({ message: "Subscription removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove subscription" });
  }
});

export default router;
