import { apiRequest, persistSession, clearSession, getStoredSession } from "./api";

export async function signup({ username, password, email }) {
  const result = await apiRequest("/auth/signup", {
    method: "POST",
    body: { username, password, email },
  });
  persistSession(result);
  return result;
}

export async function login({ username, password }) {
  const result = await apiRequest("/auth/login", {
    method: "POST",
    body: { username, password },
  });
  persistSession(result);
  return result;
}

export async function logout() {
  clearSession();
}

export async function getSession() {
  return getStoredSession();
}

export async function getAllUsers() {
  return apiRequest("/profiles", { method: "GET" });
}

export async function getUser(username) {
  return apiRequest(`/profiles/${encodeURIComponent(username)}`, { method: "GET" });
}

export async function updateUserProfile({ displayName, bio, location }) {
  return apiRequest("/profiles/me", {
    method: "PUT",
    body: { displayName, bio, location },
    auth: true,
  });
}

export async function deleteUser(username) {
  return apiRequest(`/admin/users/${encodeURIComponent(username)}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function assignUserRole(username, role) {
  return apiRequest(`/admin/users/${encodeURIComponent(username)}/role`, {
    method: "POST",
    body: { role },
    auth: true,
  });
}

export async function removeUserRole(username, role) {
  return apiRequest(`/admin/users/${encodeURIComponent(username)}/role/${encodeURIComponent(role)}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function getUserRoles(username) {
  return apiRequest(`/admin/users/${encodeURIComponent(username)}/roles`, {
    method: "GET",
    auth: true,
  });
}

export async function getAdminLogs() {
  return apiRequest("/admin/logs", {
    method: "GET",
    auth: true,
  });
}

export async function getAdminStats() {
  return apiRequest("/admin/stats", {
    method: "GET",
    auth: true,
  });
}

export async function adminCreateUser({ username, password, email }) {
  return apiRequest('/admin/users', {
    method: 'POST',
    body: { username, password, email },
    auth: true,
  });
}

export async function adminResetPassword(username, newPassword) {
  return apiRequest(`/admin/users/${encodeURIComponent(username)}/password`, {
    method: 'PUT',
    body: { newPassword },
    auth: true,
  });
}

export async function changePassword({ currentPassword, newPassword }) {
  return apiRequest("/auth/change-password", {
    method: "POST",
    body: { currentPassword, newPassword },
    auth: true,
  });
}

export async function getAllPosts() {
  return apiRequest("/admin/posts", {
    method: "GET",
    auth: true,
  });
}

export async function deletePost(postId) {
  return apiRequest(`/admin/posts/${encodeURIComponent(postId)}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function getAllMessages() {
  return apiRequest("/admin/messages", {
    method: "GET",
    auth: true,
  });
}

export async function deleteMessage(messageId) {
  return apiRequest(`/admin/messages/${encodeURIComponent(messageId)}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function adminUpdateUserProfile(username, { displayName, bio, location }) {
  return apiRequest(`/admin/users/${encodeURIComponent(username)}/profile`, {
    method: "PUT",
    body: { display_name: displayName, bio, location },
    auth: true,
  });
}

export async function getSystemSettings() {
  return apiRequest("/admin/settings", {
    method: "GET",
    auth: true,
  });
}

export async function updateSystemSettings(settings) {
  return apiRequest("/admin/settings", {
    method: "PUT",
    body: settings,
    auth: true,
  });
}

export async function getPendingPosts() {
  return apiRequest("/admin/posts/pending", {
    method: "GET",
    auth: true,
  });
}

export async function approvePost(postId) {
  return apiRequest(`/admin/posts/${encodeURIComponent(postId)}/approve`, {
    method: "PUT",
    auth: true,
  });
}

export async function rejectPost(postId) {
  return apiRequest(`/admin/posts/${encodeURIComponent(postId)}/reject`, {
    method: "PUT",
    auth: true,
  });
}
