/**
 * 🚀 PM2 PRODUCTION ECOSYSTEM CONFIGURATION
 * Production-ready PM2 configuration cho VPS deployment
 */

module.exports = {
  apps: [
    {
      name: "bvote-production-api",
      script: "./main.js",
      cwd: "/var/www/bvote",
      instances: "max", // Use all CPU cores
      exec_mode: "cluster",
      watch: false, // Disable in production
      max_memory_restart: "1G",
      node_args: "--max-old-space-size=1024",

      // Environment variables
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        BROWSER_HEADLESS: "true",
        LOG_LEVEL: "info",
      },

      // Logging
      error_file: "/var/log/bvote/api-error.log",
      out_file: "/var/log/bvote/api-out.log",
      log_file: "/var/log/bvote/api-combined.log",
      time: true,

      // Auto-restart configuration
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 4000,

      // Advanced PM2 features
      kill_timeout: 1600,
      listen_timeout: 8000,

      // Monitoring
      pmx: true,

      // Merge logs
      merge_logs: true,

      // Source map support
      source_map_support: true,
    },

    {
      name: "bvote-production-auto-login",
      script: "./auto-login.js",
      cwd: "/var/www/bvote",
      instances: 1, // Single instance for auto-login
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "512M",

      env_production: {
        NODE_ENV: "production",
        BROWSER_HEADLESS: "true",
        LOG_LEVEL: "info",
      },

      // Logging
      error_file: "/var/log/bvote/auto-login-error.log",
      out_file: "/var/log/bvote/auto-login-out.log",
      log_file: "/var/log/bvote/auto-login-combined.log",
      time: true,

      // Auto-restart configuration
      autorestart: true,
      max_restarts: 5,
      min_uptime: "30s",
      restart_delay: 10000,

      // Cron restart (daily at 3 AM)
      cron_restart: "0 3 * * *",
    },

    {
      name: "bvote-production-monitor",
      script: "./system-monitor.js",
      cwd: "/var/www/bvote",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "256M",

      env_production: {
        NODE_ENV: "production",
        LOG_LEVEL: "info",
      },

      // Logging
      error_file: "/var/log/bvote/monitor-error.log",
      out_file: "/var/log/bvote/monitor-out.log",
      log_file: "/var/log/bvote/monitor-combined.log",
      time: true,

      // Auto-restart
      autorestart: true,
      max_restarts: 5,
      min_uptime: "60s",
    },
  ],

  deploy: {
    production: {
      user: "root",
      host: process.env.VPS_HOST,
      ref: "origin/production",
      repo: "https://github.com/your-repo/bvote-2025.git",
      path: "/var/www/bvote",
      "pre-deploy-local": "",
      "post-deploy":
        "npm ci --production && npm run migrate && pm2 reload ecosystem.prod.js --env production",
      "pre-setup": "",
      ssh_options: "ForwardAgent=yes",
    },
  },
};
