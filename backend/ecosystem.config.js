// 🎯 PM2 Production Config for votingonline2025.site
// VPS: 85.31.224.8 | CyberPanel Setup

module.exports = {
  apps: [
    {
      name: 'voting-api',
      script: './server.js',
      cwd: '/home/votingonline2025.site/backend',
      
      // Production Environment
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        
        // Domain Configuration
        DOMAIN: 'votingonline2025.site',
        BASE_URL: 'https://votingonline2025.site',
        API_BASE_URL: 'https://api.votingonline2025.site',
        ADMIN_URL: 'https://admin.votingonline2025.site',
        USER_URL: 'https://votingonline2025.site',
        
        // Database
        DATABASE_URL: 'postgresql://voting_user:VotingSec2025!@localhost:5432/voting_production_2025',
        DB_TYPE: 'postgresql',
        DB_HOST: 'localhost',
        DB_PORT: 5432,
        DB_NAME: 'voting_production_2025',
        DB_USER: 'voting_user',
        DB_PASSWORD: 'VotingSec2025!',
        
        // Security
        JWT_SECRET: 'votingonline2025_production_jwt_secret_secure_2025_unique_key',
        JWT_REFRESH_SECRET: 'votingonline2025_production_refresh_secret_secure_2025_unique_key',
        JWT_EXPIRES_IN: '24h',
        JWT_REFRESH_EXPIRES_IN: '7d',
        BCRYPT_SALT_ROUNDS: 12,
        
        // CORS
        CORS_ORIGIN: 'https://votingonline2025.site,https://admin.votingonline2025.site',
        CORS_CREDENTIALS: 'true',
        
        // Features
        BROWSER_HEADLESS: 'true',
        MAX_CONCURRENT_SESSIONS: 10,
        ENABLE_RATE_LIMITING: 'true',
        ENABLE_CACHING: 'true',
        LOG_LEVEL: 'info'
      },
      
      // PM2 Settings
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      
      // Logging
      log_file: '/home/votingonline2025.site/logs/pm2-combined.log',
      out_file: '/home/votingonline2025.site/logs/pm2-out.log',
      error_file: '/home/votingonline2025.site/logs/pm2-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Auto-restart
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Process monitoring
      monitoring: false,
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      
      // Environment
      node_args: '--max-old-space-size=2048'
    }
  ],
  
  deploy: {
    production: {
      user: 'root',
      host: '85.31.224.8',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/voting-system.git',
      path: '/home/votingonline2025.site/backend',
      'post-deploy': 'npm install --production && pm2 reload ecosystem-production.config.js --env production'
    }
  }
};

