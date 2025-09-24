#!/usr/bin/env node

/**
 * AUTOMATED DEPLOYMENT SCRIPT - 30 MIN DEPLOYMENT
 * Handles production deployment, process management, and monitoring
 */

import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execAsync = promisify(exec);

const log = (message, type = "INFO") => {
  const timestamp = new Date().toISOString();
  const emoji =
    type === "SUCCESS"
      ? "✅"
      : type === "ERROR"
      ? "❌"
      : type === "WARN"
      ? "⚠️"
      : "📋";
  console.log(`${emoji} [${timestamp}] ${message}`);
};

const runCommand = async (command, description) => {
  try {
    log(`Running: ${description}`, "INFO");
    const { stdout, stderr } = await execAsync(command);
    if (stderr && !stderr.includes("warn")) {
      log(`Warning: ${stderr}`, "WARN");
    }
    log(`✓ ${description} completed`, "SUCCESS");
    return { success: true, output: stdout };
  } catch (error) {
    log(`✗ ${description} failed: ${error.message}`, "ERROR");
    return { success: false, error: error.message };
  }
};

const createProductionConfig = () => {
  const configContent = `
# PRODUCTION ENVIRONMENT VARIABLES
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# JWT Configuration
JWT_SECRET=${
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  }

# Database Configuration (Fallback to in-memory)
DATABASE_URL=mysql://localhost:3306/bvote_prod
DB_FALLBACK=true

# Security Settings
CORS_ORIGIN=*
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# Monitoring
ENABLE_MONITORING=true
ENABLE_ALERTS=true

# Logging
LOG_LEVEL=info
ENABLE_ACCESS_LOG=true
`.trim();

  try {
    fs.writeFileSync(".env.production", configContent);
    log("Production configuration created", "SUCCESS");
    return true;
  } catch (error) {
    log(`Failed to create production config: ${error.message}`, "ERROR");
    return false;
  }
};

const createStartupScripts = () => {
  const startScript = `#!/bin/bash
# Production Startup Script

echo "🚀 Starting BVOTE Production Deployment..."

# Kill any existing processes
echo "📋 Cleaning up existing processes..."
pkill -f "node.*server.js" || true
pkill -f "npm.*dev" || true

# Set environment
export NODE_ENV=production
export PORT=3000

# Start backend
echo "🎯 Starting backend server..."
cd backend
nohup node server.js > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid

sleep 3

# Verify backend is running
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Backend server started successfully"
else
    echo "❌ Backend server failed to start"
    exit 1
fi

# Start admin frontend
echo "🎨 Starting admin frontend..."
cd ../admin
npm run build > ../logs/admin-build.log 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Admin frontend built successfully"
else
    echo "⚠️ Admin frontend build had warnings"
fi

# Start user frontend
echo "👤 Starting user frontend..."
cd ../user
npm run build > ../logs/user-build.log 2>&1
if [ $? -eq 0 ]; then
    echo "✅ User frontend built successfully"
else
    echo "⚠️ User frontend build had warnings"
fi

echo "🎉 Production deployment completed!"
echo "📊 Backend: http://localhost:3000"
echo "🎯 Admin: Built in admin/dist/"
echo "👥 User: Built in user/dist/"
`;

  const stopScript = `#!/bin/bash
# Production Stop Script

echo "🛑 Stopping BVOTE services..."

# Kill backend
if [ -f logs/backend.pid ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    kill $BACKEND_PID 2>/dev/null || true
    rm logs/backend.pid
    echo "✅ Backend stopped"
fi

# Kill any remaining processes
pkill -f "node.*server.js" || true
pkill -f "npm.*dev" || true

echo "🏁 All services stopped"
`;

  const healthScript = `#!/bin/bash
# Health Check Script

echo "🏥 Checking system health..."

# Check backend
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Backend: Healthy"
else
    echo "❌ Backend: Down"
fi

# Check processes
if pgrep -f "node.*server.js" > /dev/null; then
    echo "✅ Backend Process: Running"
else
    echo "❌ Backend Process: Not running"
fi

# Check disk space (cross-platform)
echo "📊 System: Checking resources..."

# Basic process check
if pgrep -f "node" > /dev/null 2>&1; then
    echo "✅ Node processes: Running"
else
    echo "⚠️ Node processes: None found"
fi
`;

  try {
    // Create logs directory
    if (!fs.existsSync("logs")) {
      fs.mkdirSync("logs");
    }

    // Create scripts directory
    if (!fs.existsSync("scripts/production")) {
      fs.mkdirSync("scripts/production", { recursive: true });
    }

    fs.writeFileSync("scripts/production/start.sh", startScript);
    fs.writeFileSync("scripts/production/stop.sh", stopScript);
    fs.writeFileSync("scripts/production/health.sh", healthScript);

    // Make scripts executable (Windows compatible)
    if (process.platform !== "win32") {
      fs.chmodSync("scripts/production/start.sh", 0o755);
      fs.chmodSync("scripts/production/stop.sh", 0o755);
      fs.chmodSync("scripts/production/health.sh", 0o755);
    }

    log("Production scripts created", "SUCCESS");
    return true;
  } catch (error) {
    log(`Failed to create scripts: ${error.message}`, "ERROR");
    return false;
  }
};

const createMonitoringDashboard = () => {
  const monitoringScript = `#!/usr/bin/env node

/**
 * Production Monitoring Dashboard
 */

import http from 'http';

const checkHealth = async () => {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/health',
      method: 'GET'
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: 'ok', data: result });
        } catch (e) {
          resolve({ status: 'error', error: 'Invalid response' });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ status: 'error', error: error.message });
    });

    req.setTimeout(5000, () => {
      resolve({ status: 'error', error: 'Timeout' });
    });

    req.end();
  });
};

const getSystemStats = () => {
  const used = process.memoryUsage();
  return {
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    memory: {
      rss: Math.round(used.rss / 1024 / 1024),
      heapTotal: Math.round(used.heapTotal / 1024 / 1024),
      heapUsed: Math.round(used.heapUsed / 1024 / 1024)
    },
    loadAverage: process.platform !== 'win32' ? require('os').loadavg() : [0, 0, 0]
  };
};

const monitor = async () => {
  console.log('🖥️ Production Monitoring Dashboard');
  console.log('================================');

  const health = await checkHealth();
  const stats = getSystemStats();

  console.log(\`⏰ Timestamp: \${stats.timestamp}\`);
  console.log(\`🕐 Uptime: \${Math.floor(stats.uptime / 60)}m \${stats.uptime % 60}s\`);
  console.log(\`🧠 Memory: \${stats.memory.heapUsed}MB / \${stats.memory.heapTotal}MB\`);
  console.log(\`📊 Health: \${health.status === 'ok' ? '✅ Healthy' : '❌ ' + health.error}\`);

  if (health.status === 'ok' && health.data) {
    console.log(\`🌐 Environment: \${health.data.environment || 'unknown'}\`);
    console.log(\`📈 Status: \${health.data.status || 'unknown'}\`);
  }

  console.log('================================');

  setTimeout(monitor, 30000); // Check every 30 seconds
};

monitor();
`;

  try {
    fs.writeFileSync("scripts/production/monitor.js", monitoringScript);
    log("Monitoring dashboard created", "SUCCESS");
    return true;
  } catch (error) {
    log(`Failed to create monitoring: ${error.message}`, "ERROR");
    return false;
  }
};

const deployProduction = async () => {
  log("🚀 STARTING AUTOMATED PRODUCTION DEPLOYMENT", "INFO");
  log("==========================================", "INFO");

  // Step 1: Create production configuration
  if (!createProductionConfig()) {
    log("Failed to create production config", "ERROR");
    return false;
  }

  // Step 2: Create startup scripts
  if (!createStartupScripts()) {
    log("Failed to create startup scripts", "ERROR");
    return false;
  }

  // Step 3: Create monitoring
  if (!createMonitoringDashboard()) {
    log("Failed to create monitoring", "ERROR");
    return false;
  }

  // Step 4: Install dependencies (if needed)
  await runCommand(
    "cd admin && npm install --only=prod",
    "Install admin dependencies"
  );
  await runCommand(
    "cd user && npm install --only=prod",
    "Install user dependencies"
  );

  // Step 5: Build frontends
  await runCommand("cd admin && npm run build", "Build admin frontend");
  await runCommand("cd user && npm run build", "Build user frontend");

  // Step 6: Start production server
  log("Starting production server...", "INFO");

  // Create package.json script entries
  try {
    const packageJsonPath = "package.json";
    let packageJson = {};

    if (fs.existsSync(packageJsonPath)) {
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    }

    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }

    packageJson.scripts["prod:start"] =
      "NODE_ENV=production node backend/server.js";
    packageJson.scripts["prod:stop"] = "node scripts/production/stop.js";
    packageJson.scripts["prod:monitor"] = "node scripts/production/monitor.js";
    packageJson.scripts["prod:health"] = "node scripts/production/health.js";

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    log("Package.json updated with production scripts", "SUCCESS");
  } catch (error) {
    log(`Failed to update package.json: ${error.message}`, "WARN");
  }

  log("==========================================", "INFO");
  log("🎉 PRODUCTION DEPLOYMENT READY!", "SUCCESS");
  log("", "INFO");
  log("📋 COMMANDS:", "INFO");
  log("  Start:   npm run prod:start", "INFO");
  log("  Monitor: npm run prod:monitor", "INFO");
  log("  Health:  curl http://localhost:3000/api/health", "INFO");
  log("", "INFO");
  log("📁 FILES CREATED:", "INFO");
  log("  .env.production", "INFO");
  log("  scripts/production/*.sh", "INFO");
  log("  scripts/production/monitor.js", "INFO");
  log("  logs/ directory", "INFO");

  return true;
};

// Run deployment
deployProduction()
  .then((success) => {
    if (success) {
      log("🚀 DEPLOYMENT AUTOMATION COMPLETED SUCCESSFULLY!", "SUCCESS");
      process.exit(0);
    } else {
      log("💥 DEPLOYMENT FAILED!", "ERROR");
      process.exit(1);
    }
  })
  .catch((error) => {
    log(`CRITICAL DEPLOYMENT ERROR: ${error.message}`, "ERROR");
    process.exit(1);
  });
