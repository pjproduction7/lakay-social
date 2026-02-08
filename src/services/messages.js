

import { apiRequest } from './api.js';

// Fetch all private messages for the current user
export async function fetchAllPrivateMessages() {
  return apiRequest('/messages/private', {
    method: 'GET',
    auth: true
  });
}

// Send a private message
export async function sendPrivateMessage({ recipient, content }) {
  return apiRequest('/messages/private', {
    method: 'POST',
    body: { recipient, content },
    auth: true
  });
}
