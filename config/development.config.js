/**
 * Development Configuration
 * Unified config for local development
 */

export const developmentConfig = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    host: "localhost",
    environment: "development",
  },

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL || "mysql://localhost:3306/bvote_dev",
    fallback: true,
    pool: {
      min: 1,
      max: 5,
    },
  },

  // Security Configuration
  security: {
    jwtSecret: "dev-jwt-secret-key",
    corsOrigin: ["http://localhost:5173", "http://localhost:5174"],
    httpsRedirect: false,
    helmet: false,
  },

  // API Configuration
  api: {
    version: "v1",
    basePath: "/api",
    timeout: 10000,
    rateLimit: {
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 1000, // high limit for development
    },
  },

  // Frontend URLs
  frontend: {
    adminUrl: "http://localhost:5174",
    userUrl: "http://localhost:5173",
  },

  // Features
  features: {
    monitoring: true,
    logging: true,
    alerts: false,
    compression: false,
  },
};
