

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

// Edit a private message
export async function editPrivateMessage(messageId, content) {
  return apiRequest(`/messages/private/${messageId}`, {
    method: 'PUT',
    body: { content },
    auth: true
  });
}

// Delete a private message
export async function deletePrivateMessage(messageId) {
  return apiRequest(`/messages/private/${messageId}`, {
    method: 'DELETE',
    auth: true
  });
}

// Edit a public message
export async function editPublicMessage(messageId, content) {
  return apiRequest(`/messages/public/${messageId}`, {
    method: 'PUT',
    body: { content },
    auth: true
  });
}

// Delete a public message
export async function deletePublicMessage(messageId) {
  return apiRequest(`/messages/public/${messageId}`, {
    method: 'DELETE',
    auth: true
  });
}
