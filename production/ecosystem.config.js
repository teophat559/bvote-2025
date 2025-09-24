/**
 * PM2 Production Configuration
 * VPS: votingonline2025.site
 */

module.exports = {
  apps: [
    {
      // Main Production Application
      name: "voting-production",
      script: "./app.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        DATABASE_HOST: "localhost",
        DATABASE_NAME: "voti_voting_secure_2025",
        DATABASE_USER: "voti_voting_user",
        DATABASE_PASSWORD: "123123zz@",
      },
      log_file: "/home/votingonline2025.site/logs/app.log",
      error_file: "/home/votingonline2025.site/logs/error.log",
      out_file: "/home/votingonline2025.site/logs/out.log",
      max_memory_restart: "1G",
      node_args: "--max-old-space-size=1024",
      restart_delay: 4000,
      kill_timeout: 5000,
      watch: false,
      ignore_watch: ["node_modules", "logs", "data"],
      merge_logs: true,
      time: true,
    },

    {
      // Backend API Server
      name: "voting-api",
      script: "./backend/server.js",
      instances: 2,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3001,
        DATABASE_HOST: "localhost",
        DATABASE_NAME: "voti_voting_secure_2025",
        DATABASE_USER: "voti_voting_user",
        DATABASE_PASSWORD: "123123zz@",
      },
      log_file: "/home/votingonline2025.site/logs/api.log",
      error_file: "/home/votingonline2025.site/logs/api-error.log",
      out_file: "/home/votingonline2025.site/logs/api-out.log",
      max_memory_restart: "512M",
      restart_delay: 3000,
      kill_timeout: 3000,
    },

    {
      // Chrome Automation Service
      name: "voting-automation",
      script: "./backend/chrome-automation.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        CHROME_SERVICE: "true",
      },
      env_production: {
        NODE_ENV: "production",
        CHROME_SERVICE: "true",
        CHROME_MAX_INSTANCES: 10,
        CHROME_HEADLESS: "true",
      },
      log_file: "/home/votingonline2025.site/logs/automation.log",
      error_file: "/home/votingonline2025.site/logs/automation-error.log",
      max_memory_restart: "2G",
      restart_delay: 5000,
      kill_timeout: 10000,
      min_uptime: "10s",
      max_restarts: 5,
    },

    {
      // Monitoring and Health Check
      name: "voting-monitor",
      script: "./production/health-monitor.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        MONITOR_SERVICE: "true",
      },
      log_file: "/home/votingonline2025.site/logs/monitor.log",
      max_memory_restart: "128M",
      restart_delay: 10000,
    },
  ],

  deploy: {
    production: {
      user: "root",
      host: "85.31.224.8",
      ref: "origin/main",
      repo: "git@github.com:your-repo/voting-system.git",
      path: "/home/votingonline2025.site/production",
      "pre-deploy-local": "",
      "post-deploy":
        "npm install && npm run build && pm2 reload ecosystem.config.js --env production",
      "pre-setup":
        "mkdir -p /home/votingonline2025.site/{logs,data,backups,uploads}",
    },
  },
};
