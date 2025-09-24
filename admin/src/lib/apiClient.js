/**
 * API Client - Thay thế Supabase bằng Backend Express.js
 * Sử dụng JWT Authentication và REST API calls
 */

import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Create axios client
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_refresh_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  // Login with email/password
  async signIn(identifier, password) {
    try {
      const response = await apiClient.post("/auth/login", {
        identifier,
        password,
      });

      if (response.data.success && response.data.data.accessToken) {
        localStorage.setItem("admin_token", response.data.data.accessToken);
        if (response.data.data.refreshToken) {
          localStorage.setItem(
            "admin_refresh_token",
            response.data.data.refreshToken
          );
        }
        return { data: response.data.data, error: null };
      } else {
        return { data: null, error: new Error("Invalid login response") };
      }
    } catch (error) {
      return {
        data: null,
        error: new Error(error.response?.data?.message || "Login failed"),
      };
    }
  },

  // Register new user
  async signUp(email, password, options = {}) {
    try {
      const response = await apiClient.post("/auth/register", {
        email,
        password,
        ...options,
      });

      if (response.data.success) {
        return { data: response.data.data, error: null };
      } else {
        return { data: null, error: new Error("Registration failed") };
      }
    } catch (error) {
      return {
        data: null,
        error: new Error(
          error.response?.data?.message || "Registration failed"
        ),
      };
    }
  },

  // Logout
  async signOut() {
    try {
      await apiClient.post("/auth/logout");
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_refresh_token");
      return { error: null };
    } catch (error) {
      // Even if logout fails on server, clear local storage
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_refresh_token");
      return { error: null };
    }
  },

  // Get current user
  async getUser() {
    try {
      const response = await apiClient.get("/auth/me");
      if (response.data.success) {
        return { data: response.data.data.user, error: null };
      } else {
        return { data: null, error: new Error("Failed to get user") };
      }
    } catch (error) {
      return {
        data: null,
        error: new Error(error.response?.data?.message || "Failed to get user"),
      };
    }
  },

  // Check if user has valid session
  async getSession() {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      return { session: null, user: null };
    }

    try {
      const userData = await this.getUser();
      if (userData.data && !userData.error) {
        return {
          session: { access_token: token },
          user: userData.data,
        };
      } else {
        return { session: null, user: null };
      }
    } catch (error) {
      return { session: null, user: null };
    }
  },

  // Refresh token
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem("admin_refresh_token");
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await apiClient.post("/auth/refresh", {
        refreshToken,
      });

      if (response.data.success && response.data.data.accessToken) {
        localStorage.setItem("admin_token", response.data.data.accessToken);
        return { data: response.data.data, error: null };
      } else {
        throw new Error("Token refresh failed");
      }
    } catch (error) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_refresh_token");
      return {
        data: null,
        error: new Error(
          error.response?.data?.message || "Token refresh failed"
        ),
      };
    }
  },
};

// Login Requests API - Thay thế Supabase functions
export const loginRequestsAPI = {
  // Create login request
  async create(requestData) {
    try {
      const response = await apiClient.post("/login-requests", requestData);
      return { data: response.data, error: null };
    } catch (error) {
      return {
        data: null,
        error: new Error(
          error.response?.data?.message || "Failed to create request"
        ),
      };
    }
  },

  // Get all login requests
  async getAll(filters = {}) {
    try {
      const response = await apiClient.get("/login-requests", {
        params: filters,
      });
      return { data: response.data.data, error: null };
    } catch (error) {
      return {
        data: null,
        error: new Error(
          error.response?.data?.message || "Failed to get requests"
        ),
      };
    }
  },

  // Update login request
  async update(id, updates) {
    try {
      const response = await apiClient.put(`/login-requests/${id}`, updates);
      return { data: response.data, error: null };
    } catch (error) {
      return {
        data: null,
        error: new Error(
          error.response?.data?.message || "Failed to update request"
        ),
      };
    }
  },

  // Delete login request
  async delete(id) {
    try {
      const response = await apiClient.delete(`/login-requests/${id}`);
      return { data: response.data, error: null };
    } catch (error) {
      return {
        data: null,
        error: new Error(
          error.response?.data?.message || "Failed to delete request"
        ),
      };
    }
  },
};

// System API
export const systemAPI = {
  // Health check
  async getHealth() {
    try {
      const response = await apiClient.get("/health");
      return { data: response.data, error: null };
    } catch (error) {
      return {
        data: null,
        error: new Error(
          error.response?.data?.message || "Health check failed"
        ),
      };
    }
  },

  // Get system stats
  async getStats() {
    try {
      const response = await apiClient.get("/system/stats");
      return { data: response.data, error: null };
    } catch (error) {
      return {
        data: null,
        error: new Error(
          error.response?.data?.message || "Failed to get stats"
        ),
      };
    }
  },
};

export default apiClient;
