module.exports = {
  apps: [
    {
      // Application Configuration
      name: "voting-system-api",
      script: "server-production.default.js",
      cwd: "/home/your-domain.com/public_html",

      // Node.js Configuration
      node_args: "--max-old-space-size=1024",
      interpreter: "node",

      // Environment
      env: {
        NODE_ENV: "production",
        PORT: 3000,

        // Database
        DB_HOST: "localhost",
        DB_USER: "your_db_user",
        DB_PASSWORD: "your_password",
        DB_NAME: "voting_system_db",
        DATABASE_URL:
          "mysql://your_db_user:your_password@localhost:3306/voting_system_db",

        // Security
        JWT_SECRET: "your-super-secure-jwt-secret-key",
        BCRYPT_ROUNDS: 12,

        // CORS
        CORS_ORIGIN: "https://your-domain.com",

        // Application
        APP_NAME: "Voting System",
        API_RATE_LIMIT: 100,
      },

      // Process Management
      instances: 1,
      exec_mode: "cluster",

      // Auto Restart
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",

      // Logs
      log_file: "./logs/combined.log",
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,

      // Advanced Features
      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 4000,

      // Health Check
      health_check_grace_period: 3000,

      // Startup
      wait_ready: true,
      listen_timeout: 8000,
      kill_timeout: 5000,

      // Environment Variables Override
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],

  // Deployment Configuration
  deploy: {
    production: {
      user: "root",
      host: "your-vps-ip",
      ref: "origin/main",
      repo: "git@github.com:your-username/voting-system.git",
      path: "/home/your-domain.com/public_html",
      "pre-deploy-local": "",
      "post-deploy":
        "npm install --production && pm2 reload ecosystem.default.config.js --env production && pm2 save",
      "pre-setup": "pm2 install pm2-logrotate",
    },
  },

  // Log Rotation
  deploy_env: {
    PM2_SERVE_PATH: "./public",
    PM2_SERVE_PORT: 8080,
  },
};
