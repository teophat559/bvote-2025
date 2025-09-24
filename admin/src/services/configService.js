/**
 * Configuration Service
 * Centralized configuration management for production environment
 */

class ConfigService {
  constructor() {
    this.config = new Map();
    this.init();
  }

  init() {
    // Environment-based configuration
    const env = import.meta.env.VITE_APP_ENV || "development";

    // Base configuration
    this.setConfig("app", {
      name: "BVOTE Admin System",
      version: "2.0.0",
      environment: env,
      debug: env === "development",
      buildTime: new Date().toISOString(),
    });

    // API Configuration
    this.setConfig("api", {
      baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
      timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
      retryAttempts: parseInt(import.meta.env.VITE_API_RETRY_ATTEMPTS) || 3,
      retryDelay: parseInt(import.meta.env.VITE_API_RETRY_DELAY) || 1000,
    });

    // Authentication Configuration
    this.setConfig("auth", {
      adminKey: "WEBBVOTE2025$ABC", // Main admin key
      tokenExpiry: parseInt(import.meta.env.VITE_TOKEN_EXPIRY) || 3600000, // 1 hour
      sessionTimeout: parseInt(import.meta.env.VITE_SESSION_TIMEOUT) || 1800000, // 30 minutes
      maxLoginAttempts: parseInt(import.meta.env.VITE_MAX_LOGIN_ATTEMPTS) || 5,
      lockoutDuration:
        parseInt(import.meta.env.VITE_LOCKOUT_DURATION) || 900000, // 15 minutes
    });

    // Realtime Configuration
    this.setConfig("realtime", {
      enabled: import.meta.env.VITE_ENABLE_REALTIME !== "0",
      reconnectAttempts: parseInt(import.meta.env.VITE_REALTIME_RECONNECT) || 5,
      reconnectDelay: parseInt(import.meta.env.VITE_REALTIME_DELAY) || 2000,
      heartbeatInterval:
        parseInt(import.meta.env.VITE_HEARTBEAT_INTERVAL) || 30000,
    });

    // Storage Configuration
    this.setConfig("storage", {
      prefix: "bvote_admin_",
      enablePersistence: import.meta.env.VITE_ENABLE_PERSISTENCE !== "0",
      maxStorageSize:
        parseInt(import.meta.env.VITE_MAX_STORAGE_SIZE) || 50000000, // 50MB
      compressionEnabled: import.meta.env.VITE_ENABLE_COMPRESSION === "1",
    });

    // Security Configuration
    this.setConfig("security", {
      enableCSP: import.meta.env.VITE_ENABLE_CSP !== "0",
      allowedOrigins: (import.meta.env.VITE_ALLOWED_ORIGINS || "")
        .split(",")
        .filter(Boolean),
      rateLimit: {
        enabled: import.meta.env.VITE_ENABLE_RATE_LIMIT !== "0",
        requests: parseInt(import.meta.env.VITE_RATE_LIMIT_REQUESTS) || 100,
        window: parseInt(import.meta.env.VITE_RATE_LIMIT_WINDOW) || 60000, // 1 minute
      },
    });

    // Feature Flags
    this.setConfig("features", {
      adminKeys: import.meta.env.VITE_FEATURE_ADMIN_KEYS !== "0",
      autoLogin: import.meta.env.VITE_FEATURE_AUTO_LOGIN !== "0",
      notifications: import.meta.env.VITE_FEATURE_NOTIFICATIONS !== "0",
      analytics: import.meta.env.VITE_FEATURE_ANALYTICS !== "0",
      dataExport: import.meta.env.VITE_FEATURE_DATA_EXPORT !== "0",
      realtime: import.meta.env.VITE_FEATURE_REALTIME !== "0",
    });

    // UI Configuration
    this.setConfig("ui", {
      theme: import.meta.env.VITE_UI_THEME || "dark",
      language: import.meta.env.VITE_UI_LANGUAGE || "vi",
      animations: import.meta.env.VITE_UI_ANIMATIONS !== "0",
      compactMode: import.meta.env.VITE_UI_COMPACT_MODE === "1",
      autoRefresh: parseInt(import.meta.env.VITE_UI_AUTO_REFRESH) || 30000,
    });

    // Performance Configuration
    this.setConfig("performance", {
      enableCaching: import.meta.env.VITE_ENABLE_CACHING !== "0",
      cacheTimeout: parseInt(import.meta.env.VITE_CACHE_TIMEOUT) || 300000, // 5 minutes
      lazyLoading: import.meta.env.VITE_LAZY_LOADING !== "0",
      virtualScrolling: import.meta.env.VITE_VIRTUAL_SCROLLING === "1",
      batchSize: parseInt(import.meta.env.VITE_BATCH_SIZE) || 50,
    });

    console.log(`⚙️ Configuration loaded for ${env} environment`);
  }

  setConfig(key, value) {
    this.config.set(key, value);
  }

  getConfig(key, defaultValue = null) {
    return this.config.get(key) || defaultValue;
  }

  getAllConfig() {
    return Object.fromEntries(this.config);
  }

  // Environment helpers
  isDevelopment() {
    return this.getConfig("app").environment === "development";
  }

  isProduction() {
    return this.getConfig("app").environment === "production";
  }

  // Feature flag helpers
  isFeatureEnabled(feature) {
    const features = this.getConfig("features");
    return features ? features[feature] === true : false;
  }

  // Configuration validation
  validateConfig() {
    const errors = [];

    // Check required configurations
    const requiredConfigs = ["app", "auth", "api"];
    requiredConfigs.forEach((key) => {
      if (!this.config.has(key)) {
        errors.push(`Missing required configuration: ${key}`);
      }
    });

    // Validate admin key
    const authConfig = this.getConfig("auth");
    if (!authConfig?.adminKey || authConfig.adminKey.length < 8) {
      errors.push("Admin key must be at least 8 characters long");
    }

    // Validate API configuration
    const apiConfig = this.getConfig("api");
    if (!apiConfig?.baseURL) {
      errors.push("API base URL is required");
    }

    if (errors.length > 0) {
      console.error("⚠️ Configuration validation errors:", errors);
      return { valid: false, errors };
    }

    console.log("✅ Configuration validation passed");
    return { valid: true, errors: [] };
  }

  // Dynamic configuration updates
  updateConfig(key, updates) {
    const current = this.getConfig(key) || {};
    const updated = { ...current, ...updates };
    this.setConfig(key, updated);

    console.log(`⚙️ Configuration updated: ${key}`, updates);

    // Emit configuration change event
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("configChanged", {
          detail: { key, updates, config: updated },
        })
      );
    }
  }

  // Export/Import configuration
  exportConfig() {
    return {
      timestamp: new Date().toISOString(),
      environment: this.getConfig("app").environment,
      config: this.getAllConfig(),
    };
  }

  importConfig(configData) {
    try {
      Object.entries(configData.config).forEach(([key, value]) => {
        this.setConfig(key, value);
      });
      console.log("📥 Configuration imported successfully");
      return true;
    } catch (error) {
      console.error("Error importing configuration:", error);
      return false;
    }
  }

  // Reset to defaults
  resetToDefaults() {
    this.config.clear();
    this.init();
    console.log("🔄 Configuration reset to defaults");
  }
}

// Singleton instance
const configService = new ConfigService();

export const useBackendConfig = () => {
  const context = useContext(BackendContext);
  if (!context) {
    throw new Error("useBackendConfig must be used within a BackendProvider");
  }

  return {
    config: configService,
    isConnected: context.isConnected,
    systemHealth: context.systemHealth,
    connectionError: context.connectionError,
  };
};

export { configService };
export default BackendProvider;
