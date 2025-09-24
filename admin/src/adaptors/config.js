/**
 * Adaptor Configuration
 * Cấu hình trung tâm cho việc chuyển đổi giữa mock và real data
 */

const config = {
  // Chế độ hoạt động (mock hoặc real)
  mode: import.meta.env.VITE_USE_MOCK === "1" ? "mock" : "real",

  // API Configuration - Updated for Enhanced Backend
  api: {
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
    timeout: parseInt(import.meta.env.VITE_EXTERNAL_API_TIMEOUT) || 10000,
    retryAttempts: 3,
    retryDelay: 1000,
  },

  // Socket Configuration - Updated for Enhanced Backend
  socket: {
    url: import.meta.env.VITE_SOCKET_URL || "http://localhost:3000",
    autoConnect: import.meta.env.VITE_ENABLE_REALTIME === "1",
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    timeout: 20000,
  },

  // Authentication
  auth: {
    tokenKey: import.meta.env.VITE_TOKEN_KEY || "admin_token",
    refreshTokenKey:
      import.meta.env.VITE_REFRESH_TOKEN_KEY || "admin_refresh_token",
    sessionTimeout:
      parseInt(import.meta.env.VITE_SESSION_TIMEOUT) * 60 * 1000 || 1800000, // 30 phút
    maxLoginAttempts: parseInt(import.meta.env.VITE_MAX_LOGIN_ATTEMPTS) || 5,
  },

  // Mock Configuration
  mock: {
    delay: {
      min: parseInt(import.meta.env.VITE_MOCK_DELAY_MIN) || 100,
      max: parseInt(import.meta.env.VITE_MOCK_DELAY_MAX) || 500,
    },
    refreshInterval:
      parseInt(import.meta.env.VITE_MOCK_REFRESH_INTERVAL) * 1000 || 5000,
    enableNotifications: import.meta.env.VITE_MOCK_NOTIFICATIONS === "1",
  },

  // Feature Flags
  features: {
    realtime: import.meta.env.VITE_ENABLE_REALTIME === "1",
    auditLog: import.meta.env.VITE_ENABLE_AUDIT_LOG === "1",
    notifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS === "1",
    dataExport: import.meta.env.VITE_ENABLE_DATA_EXPORT === "1",
    bulkOperations: import.meta.env.VITE_ENABLE_BULK_OPERATIONS === "1",
  },

  // Logging
  logging: {
    level: import.meta.env.VITE_LOG_LEVEL || "info",
    enablePerformanceMonitoring:
      import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === "1",
    enableErrorTracking: import.meta.env.VITE_ENABLE_ERROR_TRACKING === "1",
  },
};

// Validation
if (config.mode === "real" && !config.api.baseURL) {
  console.warn("⚠️ Real mode enabled but API_URL not configured");
}

if (config.features.realtime && !config.socket.url) {
  console.warn("⚠️ Realtime enabled but SOCKET_URL not configured");
}

export default config;
