/* global process */

const API_BASE_URL = (() => {
  const envCandidates = [
    typeof import.meta !== "undefined" ? import.meta.env?.VITE_API_BASE_URL : undefined,
    typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_API_BASE_URL : undefined,
  ];
  const fallback = "http://localhost:4000";
  const raw = envCandidates.find((value) => typeof value === "string" && value.length > 0) || fallback;
  return raw.replace(/\/$/, "");
})();

const TOKEN_KEY = "lakay_token";
const SESSION_KEY = "lakay_session";

function safeParse(json) {
  try {
    return JSON.parse(json ?? "null");
  } catch {
    return null;
  }
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function getStoredSession() {
  return safeParse(localStorage.getItem(SESSION_KEY));
}

export function persistSession({ token, user }) {
  if (!token || !user) return;
  const session = {
    token,
    username: user.username,
    userId: user.id,
    email: user.email,
  };
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY) || getStoredSession()?.token || null;
}

export async function apiRequest(path, { method = "GET", body, headers = {}, auth = false } = {}) {
  const url = `${API_BASE_URL}${path}`;
  const finalHeaders = { ...headers };

  if (!(body instanceof FormData)) {
    finalHeaders["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getAuthToken();
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });

    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const payload = isJson ? await response.json().catch(() => ({})) : await response.text();

    if (!response.ok) {
      const message = (isJson && payload?.error) || payload || "Request failed";
      console.error(`API Request Failed: ${method} ${url}`, {
        status: response.status,
        statusText: response.statusText,
        payload,
      });
      throw new Error(typeof message === "string" ? message : "Request failed");
    }

    return payload;
  } catch (error) {
    console.error(`API Request Error: ${method} ${url}`, {
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

export { TOKEN_KEY, SESSION_KEY };
