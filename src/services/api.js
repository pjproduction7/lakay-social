/* global process */

const API_BASE_URL = (() => {
  const envCandidates = [
    typeof import.meta !== "undefined" ? import.meta.env?.VITE_API_BASE_URL : undefined,
    typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_API_BASE_URL : undefined,
  ];
  const fallback = "http://localhost:4001";
  const raw = envCandidates.find((value) => typeof value === "string" && value.length > 0) || fallback;
  return raw.replace(/\/$/, "");
})();

const TOKEN_KEY = "lakay_access_token";
const REFRESH_TOKEN_KEY = "lakay_refresh_token";
const SESSION_KEY = "lakay_session";

function safeParse(json) {
  try {
    return JSON.parse(json ?? "null");
  } catch {
    return null;
  }
}

export function getApiBaseUrl() {
  console.log('getApiBaseUrl ->', API_BASE_URL);
  return API_BASE_URL;
}

export function getStoredSession() {
  return safeParse(localStorage.getItem(SESSION_KEY));
}

export function persistSession({ accessToken, refreshToken, user }) {
  if (!accessToken || !user) return;
  const session = {
    accessToken,
    username: user.username,
    userId: user.id,
    email: user.email,
  };
  localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY) || getStoredSession()?.accessToken || null;
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
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
    let response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });

    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    let payload = isJson ? await response.json().catch(() => ({})) : await response.text();

    if (response.status === 401 && auth && getRefreshToken()) {
      try {
        await refreshAccessToken();
        const newToken = getAuthToken();
        if (newToken) {
          finalHeaders.Authorization = `Bearer ${newToken}`;
          response = await fetch(url, {
            method,
            headers: finalHeaders,
            body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
          });
          payload = isJson ? await response.json().catch(() => ({})) : await response.text();
        }
      } catch (refreshError) {
        clearSession();
        throw new Error("Session expired");
      }
    }

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

export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }
  const result = await apiRequest("/auth/refresh", {
    method: "POST",
    body: { refreshToken },
  });
  if (result.accessToken) {
    localStorage.setItem(TOKEN_KEY, result.accessToken);
    const session = getStoredSession();
    if (session) {
      session.accessToken = result.accessToken;
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
  }
  return result;
}

export { TOKEN_KEY, REFRESH_TOKEN_KEY, SESSION_KEY };
