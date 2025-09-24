// ========================================
// Build Configuration for AdminBvote
// ========================================

export const buildConfig = {
  // ========================================
  // BUILD SETTINGS
  // ========================================
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    minify: "terser",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"],
          charts: ["recharts"],
          utils: ["date-fns", "clsx", "tailwind-merge"],
        },
      },
    },
  },

  // ========================================
  // ENVIRONMENT CONFIGURATION
  // ========================================
  environments: {
    development: {
      VITE_USE_MOCK: "1",
      VITE_API_URL: "http://localhost:3000/api",
      VITE_SOCKET_URL: "http://localhost:3000",
      VITE_ENABLE_REALTIME: "1",
      VITE_ENABLE_AUDIT_LOG: "1",
    },

    staging: {
      VITE_USE_MOCK: "0",
      VITE_API_URL: "https://staging-api.bvote.com/api",
      VITE_SOCKET_URL: "https://staging-api.bvote.com",
      VITE_ENABLE_REALTIME: "1",
      VITE_ENABLE_AUDIT_LOG: "1",
    },

    production: {
      VITE_USE_MOCK: "0",
      VITE_API_URL: "https://api.bvote.com/api",
      VITE_SOCKET_URL: "https://api.bvote.com",
      VITE_ENABLE_REALTIME: "1",
      VITE_ENABLE_AUDIT_LOG: "1",
    },
  },

  // ========================================
  // DEPLOYMENT CONFIGURATION
  // ========================================
  deployment: {
    // OpenLiteSpeed proxy configuration
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },

    // Build output structure
    outputStructure: {
      "index.html": "/admin/",
      "assets/": "/admin/assets/",
      "favicon.ico": "/admin/",
    },

    // Security headers
    securityHeaders: {
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: wss:;",
    },
  },

  // ========================================
  // FEATURE FLAGS
  // ========================================
  features: {
    realtime: true,
    auditLog: true,
    userManagement: true,
    chromeProfiles: true,
    contests: true,
    analytics: true,
    bulkOperations: true,
    dataExport: true,
    dataImport: true,
  },

  // ========================================
  // API ENDPOINTS
  // ========================================
  apiEndpoints: {
    // User Management
    users: "/admin/users",
    userById: "/admin/users/:id",
    userBlock: "/admin/users/:id/block",
    userUnblock: "/admin/users/:id/unblock",
    userSuspend: "/admin/users/:id/suspend",
    userActivate: "/admin/users/:id/activate",
    userRole: "/admin/users/:id/role",
    userPermissions: "/admin/users/:id/permissions",
    userActivity: "/admin/users/:id/activity",
    userSessions: "/admin/users/:id/sessions",
    userStats: "/admin/users/stats",
    userExport: "/admin/users/export",
    userImport: "/admin/users/import",
    bulkUpdate: "/admin/users/bulk-update",
    bulkDelete: "/admin/users/bulk-delete",
    bulkBlock: "/admin/users/bulk-block",

    // Chrome Profiles
    chromeProfiles: "/admin/chrome-profiles",
    chromeProfileById: "/admin/chrome-profiles/:id",
    chromeProfileStart: "/admin/chrome-profiles/:id/start",
    chromeProfileStop: "/admin/chrome-profiles/:id/stop",

    // Contests
    contests: "/admin/contests",
    contestById: "/admin/contests/:id",

    // System
    stats: "/admin/stats",
    logs: "/admin/logs",
    auditLogs: "/admin/audit-logs",
    systemHealth: "/admin/system/health",
    systemConfig: "/admin/system/config",
  },

  // ========================================
  // SOCKET EVENTS
  // ========================================
  socketEvents: {
    // Admin Commands
    adminCommand: "admin:command",
    adminSubscribe: "admin:subscribe",
    adminUnsubscribe: "admin:unsubscribe",

    // Admin Feeds
    adminFeed: "admin:feed",

    // User Events
    userLogin: "user:login",
    userLogout: "user:logout",
    userVote: "user:vote",
    userActivity: "user:activity",

    // System Events
    systemAlert: "system:alert",
    systemStatus: "system:status",
    systemHealth: "system:health",
  },

  // ========================================
  // BUILD SCRIPTS
  // ========================================
  scripts: {
    build: "npm run build",
    buildDev: "npm run build --mode development",
    buildStaging: "npm run build --mode staging",
    buildProd: "npm run build --mode production",
    preview: "npm run preview",
    deploy: "npm run build && npm run deploy:upload",
  },
};

// ========================================
// DEPLOYMENT SCRIPTS
// ========================================

export const deployScripts = {
  // Build for different environments
  buildDev: () => {
    console.log("🔧 Building for development...");
    // Build with development config
  },

  buildStaging: () => {
    console.log("🚀 Building for staging...");
    // Build with staging config
  },

  buildProd: () => {
    console.log("🎯 Building for production...");
    // Build with production config
  },

  // Deploy to different environments
  deployDev: () => {
    console.log("🔧 Deploying to development...");
    // Deploy to dev server
  },

  deployStaging: () => {
    console.log("🚀 Deploying to staging...");
    // Deploy to staging server
  },

  deployProd: () => {
    console.log("🎯 Deploying to production...");
    // Deploy to production server
  },

  // OpenLiteSpeed specific deployment
  deployToOpenLiteSpeed: () => {
    console.log("🌐 Deploying to OpenLiteSpeed...");
    // Copy files to /admin/ directory
    // Configure proxy rules
    // Restart server if needed
  },
};

export default buildConfig;
