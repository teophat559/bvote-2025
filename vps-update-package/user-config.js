/**
 * UserBvote Adaptor Configuration
 * Cấu hình cho việc chuyển đổi giữa mock và real data
 */

const config = {
  // Chế độ hoạt động (mock hoặc real) - REAL MODE ENABLED
  mode: import.meta.env.VITE_USE_MOCK === "1" ? "mock" : "real", // Use real data from backend

  // API Configuration
  api: {
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
    fallbackURL: "http://localhost:3000/api", // Added fallback
    timeout: parseInt(import.meta.env.VITE_EXTERNAL_API_TIMEOUT) || 10000,
    retryAttempts: 3,
    retryDelay: 1000,
  },

  // Socket Configuration
  socket: {
    url: import.meta.env.VITE_SOCKET_URL || "http://localhost:3000",
    fallbackURL: "http://localhost:3000", // Added fallback
    autoConnect: import.meta.env.VITE_ENABLE_REALTIME !== "0",
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    timeout: 20000,
  },

  // Authentication
  auth: {
    tokenKey: "user_token",
    refreshTokenKey: "user_refresh_token",
    sessionTimeout: 30 * 60 * 1000, // 30 phút
  },

  // Mock Configuration
  mock: {
    delay: {
      min: 100,
      max: 500,
    },
    refreshInterval: 5000,
    enableNotifications: true,
  },

  // Features
  features: {
    realtime: import.meta.env.VITE_ENABLE_REALTIME !== "0",
    notifications: true,
    voting: true,
    contests: true,
  },

  // Logging
  logging: {
    level: "info",
    enablePerformanceMonitoring: true,
    enableErrorTracking: true,
  },
};

export default config;
