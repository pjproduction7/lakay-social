// Push notification service using web-push
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:no-reply@lakay.social',
  process.env.VITE_PUSH_VAPID_PUBLIC_KEY,
  process.env.PUSH_VAPID_PRIVATE_KEY
);

export async function sendPushNotification(subscription, payload) {
  return webpush.sendNotification(subscription, JSON.stringify(payload));
}
