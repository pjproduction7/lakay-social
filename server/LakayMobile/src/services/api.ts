import * as Keychain from 'react-native-keychain';
import axios from 'axios';

// API Configuration
const API_BASE_URL = __DEV__
  ? 'http://localhost:4000'
  : process.env.EXPO_PUBLIC_API_URL ??
    'https://lakay-social-production-fee1.up.railway.app';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Secure Storage Keys
const ACCESS_TOKEN_KEY = 'lakay_access_token';
const REFRESH_TOKEN_KEY = 'lakay_refresh_token';
const USER_SESSION_KEY = 'lakay_user_session';

// Secure Storage Functions
export const secureStorage = {
  async setTokens(accessToken: string, refreshToken: string) {
    try {
      await Keychain.setGenericPassword(ACCESS_TOKEN_KEY, accessToken, {
        service: 'lakay_access_token',
      });
      await Keychain.setGenericPassword(REFRESH_TOKEN_KEY, refreshToken, {
        service: 'lakay_refresh_token',
      });
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw error;
    }
  },

  async getAccessToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: 'lakay_access_token',
      });
      return credentials ? credentials.password : null;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: 'lakay_refresh_token',
      });
      return credentials ? credentials.password : null;
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  },

  async clearTokens() {
    try {
      await Keychain.resetGenericPassword({ service: 'lakay_access_token' });
      await Keychain.resetGenericPassword({ service: 'lakay_refresh_token' });
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  },

  async setUserSession(session: any) {
    try {
      await Keychain.setGenericPassword(USER_SESSION_KEY, JSON.stringify(session), {
        service: 'lakay_user_session',
      });
    } catch (error) {
      console.error('Error storing user session:', error);
    }
  },

  async getUserSession(): Promise<any | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: 'lakay_user_session',
      });
      return credentials ? JSON.parse(credentials.password) : null;
    } catch (error) {
      console.error('Error getting user session:', error);
      return null;
    }
  },

  async clearUserSession() {
    try {
      await Keychain.resetGenericPassword({ service: 'lakay_user_session' });
    } catch (error) {
      console.error('Error clearing user session:', error);
    }
  },
};

// Request Interceptor - Add Auth Token
api.interceptors.request.use(
  async (config) => {
    console.log('API baseURL', api.defaults.baseURL);
    const token = await secureStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor - Handle Token Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const url = error.config?.url ?? '';
    if (status || url) {
      console.log('API response error', { status, url });
    }
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await secureStorage.getRefreshToken();
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data;
          await secureStorage.setTokens(accessToken, refreshToken);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        await secureStorage.clearTokens();
        await secureStorage.clearUserSession();
        // You might want to emit an event or use a navigation ref here
        console.error('Token refresh failed:', refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API Functions
export const authAPI = {
  async login(credentials: { username: string; password: string; mfaToken?: string }) {
    const response = await api.post('/auth/login', credentials);
    const { accessToken, refreshToken, user } = response.data;

    await secureStorage.setTokens(accessToken, refreshToken);
    await secureStorage.setUserSession({ user, loginTime: Date.now() });

    return { user, accessToken, refreshToken };
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      await secureStorage.clearTokens();
      await secureStorage.clearUserSession();
    }
  },

  async getCurrentUser() {
    const session = await secureStorage.getUserSession();
    return session?.user || null;
  },

  async refreshSession() {
    const refreshToken = await secureStorage.getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token');

    const response = await api.post('/auth/refresh', { refreshToken });
    const { accessToken } = response.data;

    await secureStorage.setTokens(accessToken, refreshToken);
    return accessToken;
  },
};

export const userAPI = {
  async getProfile() {
    const response = await api.get('/profiles/me');
    return response.data;
  },

  async updateProfile(profileData: any) {
    const response = await api.put('/profiles/me', profileData);
    return response.data;
  },

  async getAllUsers() {
    const response = await api.get('/profiles');
    return response.data;
  },
};

export const feedAPI = {
  async getPosts() {
    const response = await api.get('/posts');
    return response.data;
  },

  async createPost(postData: any) {
    const response = await api.post('/posts', postData);
    return response.data;
  },
};

export default api;
