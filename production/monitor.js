#!/usr/bin/env node

/**
 * Production Health Monitor
 * Monitors system health and sends alerts
 */

import axios from "axios";
import { createRequire } from "module";
import fs from "fs/promises";
import path from "path";

const require = createRequire(import.meta.url);

class ProductionHealthMonitor {
  constructor() {
    this.config = {
      checkInterval: 30000, // 30 seconds
      services: [
        {
          name: "Main App",
          url: "http://localhost:3000/health",
          timeout: 5000,
        },
        {
          name: "API Server",
          url: "http://localhost:3001/api/system/health",
          timeout: 5000,
        },
        {
          name: "Database",
          url: "http://localhost:3001/api/system/database-health",
          timeout: 10000,
        },
      ],
      telegramBot: {
        token: process.env.TELEGRAM_BOT_TOKEN,
        chatId: process.env.TELEGRAM_CHAT_ID,
      },
      alertThreshold: 3, // Failed checks before alert
      logFile: "/home/votingonline2025.site/logs/health-monitor.log",
    };

    this.serviceStatus = new Map();
    this.alertCooldown = new Map();
    this.isRunning = false;
  }

  // Initialize health monitor
  async initialize() {
    try {
      console.log("🔍 Initializing Production Health Monitor...");

      // Initialize service status tracking
      this.config.services.forEach((service) => {
        this.serviceStatus.set(service.name, {
          status: "unknown",
          failedChecks: 0,
          lastCheck: null,
          lastSuccess: null,
          lastFailure: null,
          responseTime: 0,
        });
      });

      console.log("✅ Health Monitor initialized");
      console.log(`📊 Monitoring ${this.config.services.length} services`);
      console.log(`⏱️ Check interval: ${this.config.checkInterval}ms`);

      return true;
    } catch (error) {
      console.error("❌ Health Monitor initialization failed:", error);
      return false;
    }
  }

  // Start monitoring
  async start() {
    if (this.isRunning) {
      console.log("⚠️ Health Monitor already running");
      return;
    }

    this.isRunning = true;
    console.log("🚀 Starting Health Monitor...");

    // Send startup notification
    await this.sendTelegramAlert(
      "🟢 Health Monitor Started",
      `Production health monitoring started on ${new Date().toISOString()}`
    );

    // Start monitoring loop
    this.monitorLoop();
  }

  // Main monitoring loop
  async monitorLoop() {
    while (this.isRunning) {
      try {
        await this.performHealthChecks();
        await this.checkSystemMetrics();
        await this.logSystemStatus();

        // Wait for next check
        await new Promise((resolve) =>
          setTimeout(resolve, this.config.checkInterval)
        );
      } catch (error) {
        console.error("❌ Monitoring loop error:", error);
        await this.logError("Monitoring loop error", error);

        // Continue monitoring even if there's an error
        await new Promise((resolve) =>
          setTimeout(resolve, this.config.checkInterval)
        );
      }
    }
  }

  // Perform health checks on all services
  async performHealthChecks() {
    const checkPromises = this.config.services.map((service) =>
      this.checkService(service)
    );

    await Promise.allSettled(checkPromises);
  }

  // Check individual service health
  async checkService(service) {
    const startTime = Date.now();
    const status = this.serviceStatus.get(service.name);

    try {
      const response = await axios.get(service.url, {
        timeout: service.timeout,
        validateStatus: (status) => status < 500,
      });

      const responseTime = Date.now() - startTime;
      const isHealthy = response.status === 200;

      // Update status
      status.responseTime = responseTime;
      status.lastCheck = new Date().toISOString();

      if (isHealthy) {
        status.status = "healthy";
        status.failedChecks = 0;
        status.lastSuccess = new Date().toISOString();

        console.log(`✅ ${service.name}: Healthy (${responseTime}ms)`);
      } else {
        status.status = "unhealthy";
        status.failedChecks++;
        status.lastFailure = new Date().toISOString();

        console.log(
          `⚠️ ${service.name}: Unhealthy - Status ${response.status}`
        );

        // Check if alert threshold reached
        if (status.failedChecks >= this.config.alertThreshold) {
          await this.sendServiceAlert(
            service.name,
            "unhealthy",
            `Service returning status ${response.status}`
          );
        }
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // Update status for failed check
      status.status = "down";
      status.failedChecks++;
      status.responseTime = responseTime;
      status.lastCheck = new Date().toISOString();
      status.lastFailure = new Date().toISOString();

      console.log(`❌ ${service.name}: Down - ${error.message}`);

      // Send alert if threshold reached
      if (status.failedChecks >= this.config.alertThreshold) {
        await this.sendServiceAlert(service.name, "down", error.message);
      }
    }

    this.serviceStatus.set(service.name, status);
  }

  // Check system metrics
  async checkSystemMetrics() {
    try {
      // Check disk space
      const diskUsage = await this.checkDiskUsage();
      if (diskUsage > 85) {
        await this.sendSystemAlert(
          "Disk Space Warning",
          `Disk usage is at ${diskUsage}%`
        );
      }

      // Check memory usage
      const memoryUsage = await this.checkMemoryUsage();
      if (memoryUsage > 90) {
        await this.sendSystemAlert(
          "Memory Warning",
          `Memory usage is at ${memoryUsage}%`
        );
      }

      // Check PM2 processes
      await this.checkPM2Status();
    } catch (error) {
      console.error("❌ System metrics check failed:", error);
    }
  }

  // Check disk usage
  async checkDiskUsage() {
    try {
      const { exec } = require("child_process");
      const { promisify } = require("util");
      const execAsync = promisify(exec);

      const { stdout } = await execAsync(
        "df -h /home/votingonline2025.site | tail -1 | awk '{print $5}' | sed 's/%//'"
      );
      return parseInt(stdout.trim());
    } catch (error) {
      console.error("Disk usage check failed:", error);
      return 0;
    }
  }

  // Check memory usage
  async checkMemoryUsage() {
    try {
      const { exec } = require("child_process");
      const { promisify } = require("util");
      const execAsync = promisify(exec);

      const { stdout } = await execAsync(
        "free | grep Mem | awk '{printf \"%.0f\", ($3/$2)*100}'"
      );
      return parseInt(stdout.trim());
    } catch (error) {
      console.error("Memory usage check failed:", error);
      return 0;
    }
  }

  // Check PM2 process status
  async checkPM2Status() {
    try {
      const { exec } = require("child_process");
      const { promisify } = require("util");
      const execAsync = promisify(exec);

      const { stdout } = await execAsync("pm2 jlist");
      const processes = JSON.parse(stdout);

      const downProcesses = processes.filter(
        (proc) => proc.pm2_env.status !== "online"
      );

      if (downProcesses.length > 0) {
        const processNames = downProcesses.map((p) => p.name).join(", ");
        await this.sendSystemAlert(
          "PM2 Process Down",
          `Processes down: ${processNames}`
        );
      }
    } catch (error) {
      console.error("PM2 status check failed:", error);
    }
  }

  // Send service-specific alert
  async sendServiceAlert(serviceName, status, message) {
    const alertKey = `service_${serviceName}`;

    // Check cooldown (don't spam alerts)
    if (this.alertCooldown.has(alertKey)) {
      const lastAlert = this.alertCooldown.get(alertKey);
      if (Date.now() - lastAlert < 300000) {
        // 5 minutes cooldown
        return;
      }
    }

    const emoji = status === "down" ? "🔴" : "⚠️";
    const title = `${emoji} Service Alert: ${serviceName}`;

    await this.sendTelegramAlert(
      title,
      `Status: ${status.toUpperCase()}\nMessage: ${message}\nTime: ${new Date().toISOString()}`
    );

    this.alertCooldown.set(alertKey, Date.now());
  }

  // Send system-wide alert
  async sendSystemAlert(title, message) {
    const alertKey = `system_${title}`;

    // Check cooldown
    if (this.alertCooldown.has(alertKey)) {
      const lastAlert = this.alertCooldown.get(alertKey);
      if (Date.now() - lastAlert < 600000) {
        // 10 minutes cooldown
        return;
      }
    }

    await this.sendTelegramAlert(
      `🚨 System Alert: ${title}`,
      `${message}\nTime: ${new Date().toISOString()}`
    );

    this.alertCooldown.set(alertKey, Date.now());
  }

  // Send Telegram notification
  async sendTelegramAlert(title, message) {
    if (!this.config.telegramBot.token || !this.config.telegramBot.chatId) {
      console.log(`📢 Alert: ${title} - ${message}`);
      return;
    }

    try {
      const telegramMessage = `*${title}*\n\n${message}`;

      await axios.post(
        `https://api.telegram.org/bot${this.config.telegramBot.token}/sendMessage`,
        {
          chat_id: this.config.telegramBot.chatId,
          text: telegramMessage,
          parse_mode: "Markdown",
        }
      );

      console.log("📱 Telegram alert sent:", title);
    } catch (error) {
      console.error("❌ Failed to send Telegram alert:", error.message);
    }
  }

  // Log system status
  async logSystemStatus() {
    const timestamp = new Date().toISOString();
    const statusSummary = {
      timestamp,
      services: {},
    };

    // Collect service statuses
    this.serviceStatus.forEach((status, serviceName) => {
      statusSummary.services[serviceName] = {
        status: status.status,
        responseTime: status.responseTime,
        failedChecks: status.failedChecks,
        lastCheck: status.lastCheck,
      };
    });

    // Write to log file
    try {
      const logEntry = JSON.stringify(statusSummary) + "\n";
      await fs.appendFile(this.config.logFile, logEntry);
    } catch (error) {
      console.error("❌ Failed to write status log:", error);
    }
  }

  // Log errors
  async logError(title, error) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      title,
      error: error.message,
      stack: error.stack,
    };

    try {
      const errorLogFile =
        "/home/votingonline2025.site/logs/health-monitor-errors.log";
      await fs.appendFile(errorLogFile, JSON.stringify(errorLog) + "\n");
    } catch (logError) {
      console.error("❌ Failed to log error:", logError);
    }
  }

  // Get current status summary
  getStatusSummary() {
    const summary = {
      timestamp: new Date().toISOString(),
      services: {},
      overall: "healthy",
    };

    this.serviceStatus.forEach((status, serviceName) => {
      summary.services[serviceName] = status;

      // Determine overall status
      if (
        status.status === "down" ||
        status.failedChecks >= this.config.alertThreshold
      ) {
        summary.overall = "unhealthy";
      }
    });

    return summary;
  }

  // Stop monitoring
  async stop() {
    this.isRunning = false;
    console.log("🛑 Stopping Health Monitor...");

    await this.sendTelegramAlert(
      "🔴 Health Monitor Stopped",
      `Production health monitoring stopped on ${new Date().toISOString()}`
    );
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new ProductionHealthMonitor();

  monitor.initialize().then(async (success) => {
    if (success) {
      await monitor.start();
    } else {
      console.error("❌ Failed to initialize health monitor");
      process.exit(1);
    }
  });

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    await monitor.stop();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    await monitor.stop();
    process.exit(0);
  });
}

export default ProductionHealthMonitor;
