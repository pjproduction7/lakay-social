import { Router } from "express";
import webPush from "web-push";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

console.log('VAPID keys loaded:', { public: !!vapidPublicKey, private: !!vapidPrivateKey });

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(
    "mailto:admin@lakay.social",
    vapidPublicKey,
    vapidPrivateKey
  );
  console.log('VAPID details set for web-push');
} else {
  console.warn('VAPID keys not found, push notifications will not work');
}

// POST /push/send - Send push notification to a user
router.post("/send", requireAuth, async (req, res) => {
  try {
    const { username, title, body } = req.body;
    if (!username || !title || !body) {
      return res.status(400).json({ error: "username, title, and body are required" });
    }
    const result = await query(
      "SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE username = $1",
      [username.toLowerCase()]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "No push subscription found for user" });
    }
    const subscription = {
      endpoint: result.rows[0].endpoint,
      keys: {
        p256dh: result.rows[0].p256dh,
        auth: result.rows[0].auth,
      },
    };
    const payload = JSON.stringify({ title, body });
    await webPush.sendNotification(subscription, payload);
    res.json({ message: "Push notification sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send push notification" });
  }
});

export default router;
