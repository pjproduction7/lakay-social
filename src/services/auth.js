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
  // Use the public signup endpoint to create a new user (admin may use this for quick create)
  const result = await apiRequest('/auth/signup', {
    method: 'POST',
    body: { username, password, email }
  });
  return result;
}

export async function adminChangePassword() {
  // Keep default behavior for now; admin password reset implementation may be added later
  throw new Error('Password reset is unavailable in this static version.');
}