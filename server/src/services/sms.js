// SMS notification service using Twilio
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER;

const client = twilio(accountSid, authToken);

export async function sendSMS({ to, body }) {
  return client.messages.create({
    body,
    from: fromNumber,
    to
  });
}
