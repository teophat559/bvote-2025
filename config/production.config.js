/**
 * Production Configuration
 * Unified config for VPS deployment
 */

export const productionConfig = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    host: "0.0.0.0",
    environment: "production",
  },

  // Database Configuration
  database: {
    url:
      process.env.DATABASE_URL ||
      "mysql://user:password@localhost:3306/bvote_prod",
    fallback: true,
    pool: {
      min: 2,
      max: 10,
    },
  },

  // Security Configuration
  security: {
    jwtSecret: process.env.JWT_SECRET || "production-jwt-secret-key",
    corsOrigin: ["https://yourdomain.com", "https://admin.yourdomain.com"],
    httpsRedirect: true,
    helmet: true,
  },

  // API Configuration
  api: {
    version: "v1",
    basePath: "/api",
    timeout: 30000,
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    },
  },

  // Frontend URLs
  frontend: {
    adminUrl: "https://admin.yourdomain.com",
    userUrl: "https://yourdomain.com",
  },

  // Features
  features: {
    monitoring: true,
    logging: true,
    alerts: true,
    compression: true,
  },
};
