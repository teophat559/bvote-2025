/**
 * Social Media Login Configuration
 *
 * Central configuration file for all social media platform login modules.
 * Customize these settings based on your needs and environment.
 */

export const SOCIAL_LOGIN_CONFIG = {
  // Global Settings
  global: {
    headless: process.env.HEADLESS !== "false", // Set to false for development
    timeout: parseInt(process.env.TIMEOUT) || 30000,
    retries: parseInt(process.env.RETRIES) || 3,
    enableScreenshots: process.env.ENABLE_SCREENSHOTS === "true",
    enableLogging: process.env.ENABLE_LOGGING !== "false",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: {
      width: 1366,
      height: 768,
    },
  },

  // Directory Paths
  paths: {
    profiles: process.env.PROFILES_DIR || "./browser-profiles",
    screenshots: process.env.SCREENSHOTS_DIR || "./screenshots",
    logs: process.env.LOGS_DIR || "./logs",
    downloads: process.env.DOWNLOADS_DIR || "./downloads",
    temp: process.env.TEMP_DIR || "./temp",
  },

  // Platform-specific configurations
  platforms: {
    facebook: {
      loginUrl: "https://www.facebook.com/login",
      homeUrl: "https://www.facebook.com",
      timeout: 35000,
      enableStealth: true,
      retryDelay: 3000,
      selectors: {
        email: 'input[name="email"]',
        password: 'input[name="pass"]',
        loginButton: 'button[name="login"]',
        twoFACode: 'input[name="approvals_code"]',
      },
    },

    zalo: {
      loginUrl: "https://zalo.me",
      chatUrl: "https://chat.zalo.me",
      timeout: 30000,
      enableStealth: true,
      retryDelay: 2000,
      language: "vi-VN",
      selectors: {
        phone: 'input[name="phone"]',
        password: 'input[name="password"]',
        loginButton: 'button[type="submit"]',
        otpInput: 'input[placeholder*="mã xác nhận"]',
        chatList: ".chat-list-container",
      },
    },

    gmail: {
      loginUrl: "https://accounts.google.com/signin",
      gmailUrl: "https://mail.google.com",
      timeout: 45000,
      enableStealth: true,
      retryDelay: 4000,
      selectors: {
        email: "#identifierId",
        password: 'input[name="password"]',
        nextButton: "#identifierNext",
        passwordNext: "#passwordNext",
        totpInput: 'input[aria-label*="verification"]',
      },
    },

    instagram: {
      loginUrl: "https://www.instagram.com/accounts/login/",
      homeUrl: "https://www.instagram.com/",
      timeout: 30000,
      enableStealth: true,
      retryDelay: 3000,
      selectors: {
        username: 'input[name="username"]',
        password: 'input[name="password"]',
        loginButton: 'button[type="submit"]',
        twoFACode: 'input[aria-label*="security code"]',
        newPostButton: '[data-testid="new-post-button"]',
      },
    },
  },

  // Security & Anti-Detection Settings
  security: {
    enableStealth: true,
    randomDelay: {
      min: 1000,
      max: 3000,
    },
    userAgents: [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    ],
    headers: {
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    },
  },

  // Proxy Configuration (Optional)
  proxy: {
    enabled: process.env.PROXY_ENABLED === "true",
    list: process.env.PROXY_LIST ? process.env.PROXY_LIST.split(",") : [],
    rotation: process.env.PROXY_ROTATION === "true",
  },

  // Rate Limiting
  rateLimit: {
    enabled: true,
    requestsPerMinute: 30,
    burstLimit: 10,
    delays: {
      betweenLogins: 5000,
      betweenActions: 2000,
      betweenRetries: 3000,
    },
  },

  // Session Management
  session: {
    saveEnabled: true,
    autoLoad: process.env.AUTO_LOAD_SESSIONS === "true",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    cleanupInterval: 60 * 60 * 1000, // 1 hour
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || "info", // debug, info, warn, error
    maxFileSize: "10MB",
    maxFiles: 5,
    enableConsole: process.env.NODE_ENV !== "production",
    enableFile: true,
    formats: {
      console: "simple",
      file: "json",
    },
  },

  // Browser Launch Options
  browser: {
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
      "--disable-web-security",
      "--disable-features=VizDisplayCompositor",
      "--disable-blink-features=AutomationControlled",
    ],
    defaultViewport: {
      width: 1366,
      height: 768,
    },
    ignoreHTTPSErrors: true,
    ignoreDefaultArgs: ["--enable-automation"],
  },

  // Error Handling
  errorHandling: {
    maxRetries: 3,
    retryDelay: 5000,
    captureScreenshotOnError: true,
    saveLogs: true,
    continueOnError: false,
  },
};

// Environment-specific overrides
if (process.env.NODE_ENV === "development") {
  SOCIAL_LOGIN_CONFIG.global.headless = false;
  SOCIAL_LOGIN_CONFIG.global.enableScreenshots = true;
  SOCIAL_LOGIN_CONFIG.logging.level = "debug";
  SOCIAL_LOGIN_CONFIG.logging.enableConsole = true;
}

if (process.env.NODE_ENV === "production") {
  SOCIAL_LOGIN_CONFIG.global.headless = true;
  SOCIAL_LOGIN_CONFIG.global.enableScreenshots = false;
  SOCIAL_LOGIN_CONFIG.logging.level = "warn";
  SOCIAL_LOGIN_CONFIG.logging.enableConsole = false;
}

// Helper function to get platform config
export function getPlatformConfig(platform) {
  const globalConfig = SOCIAL_LOGIN_CONFIG.global;
  const platformConfig = SOCIAL_LOGIN_CONFIG.platforms[platform.toLowerCase()];

  if (!platformConfig) {
    throw new Error(`Platform ${platform} is not configured`);
  }

  return {
    ...globalConfig,
    ...platformConfig,
    paths: SOCIAL_LOGIN_CONFIG.paths,
    security: SOCIAL_LOGIN_CONFIG.security,
    browser: SOCIAL_LOGIN_CONFIG.browser,
    errorHandling: SOCIAL_LOGIN_CONFIG.errorHandling,
  };
}

// Helper function to get all configured platforms
export function getAvailablePlatforms() {
  return Object.keys(SOCIAL_LOGIN_CONFIG.platforms);
}

// Environment validation
export function validateEnvironment() {
  const warnings = [];
  const errors = [];

  // Check required directories
  if (!SOCIAL_LOGIN_CONFIG.paths.profiles) {
    errors.push("PROFILES_DIR is not configured");
  }

  // Check browser args in different environments
  if (process.platform === "linux" && process.env.CI) {
    SOCIAL_LOGIN_CONFIG.browser.args.push("--single-process");
  }

  // Proxy validation
  if (
    SOCIAL_LOGIN_CONFIG.proxy.enabled &&
    SOCIAL_LOGIN_CONFIG.proxy.list.length === 0
  ) {
    warnings.push("Proxy is enabled but no proxy list is provided");
  }

  // Security warnings
  if (!SOCIAL_LOGIN_CONFIG.security.enableStealth) {
    warnings.push("Stealth mode is disabled - higher detection risk");
  }

  return { warnings, errors };
}

export default SOCIAL_LOGIN_CONFIG;
