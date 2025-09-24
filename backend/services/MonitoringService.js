/**
 * Monitoring Service - Advanced System Monitoring
 * Real-time metrics, performance tracking, and alerting
 */

import EventEmitter from "events";
import os from "os";
import fs from "fs/promises";
import { performance } from "perf_hooks";

export default class MonitoringService extends EventEmitter {
  constructor() {
    super();
    this.metrics = new Map();
    this.alerts = [];
    this.thresholds = {
      cpu: 80, // CPU usage %
      memory: 85, // Memory usage %
      disk: 90, // Disk usage %
      responseTime: 2000, // Response time ms
      errorRate: 5, // Error rate %
      requestsPerSecond: 1000, // Max RPS
    };
    this.startTime = Date.now();
    this.requestCount = 0;
    this.errorCount = 0;
    this.responseTimes = [];
    this.activeConnections = 0;
    this.isMonitoring = false;
  }

  start() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.collectSystemMetrics();
    this.startPeriodicCollection();
    this.emit("monitoring:started");
    console.log("📊 Monitoring service started");
  }

  stop() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.emit("monitoring:stopped");
    console.log("📊 Monitoring service stopped");
  }

  startPeriodicCollection() {
    this.intervalId = setInterval(() => {
      this.collectSystemMetrics();
      this.checkThresholds();
      this.cleanupOldData();
    }, 30000); // Collect every 30 seconds
  }

  collectSystemMetrics() {
    const now = Date.now();

    // System metrics
    const cpuUsage = this.getCPUUsage();
    const memoryUsage = this.getMemoryUsage();
    const diskUsage = this.getDiskUsage();

    // Application metrics
    const uptime = now - this.startTime;
    const avgResponseTime = this.getAverageResponseTime();
    const errorRate = this.getErrorRate();
    const requestsPerSecond = this.getRequestsPerSecond();

    const metrics = {
      timestamp: now,
      system: {
        cpu: cpuUsage,
        memory: memoryUsage,
        disk: diskUsage,
        uptime,
        loadAverage: os.loadavg(),
      },
      application: {
        requestCount: this.requestCount,
        errorCount: this.errorCount,
        errorRate,
        avgResponseTime,
        requestsPerSecond,
        activeConnections: this.activeConnections,
      },
      node: {
        version: process.version,
        memoryUsage: process.memoryUsage(),
        pid: process.pid,
      },
    };

    this.metrics.set(now, metrics);
    this.emit("metrics:collected", metrics);

    return metrics;
  }

  getCPUUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach((cpu) => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~((100 * idle) / total);

    return Math.max(0, Math.min(100, usage));
  }

  getMemoryUsage() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const percentage = (used / total) * 100;

    return {
      total: Math.round(total / 1024 / 1024), // MB
      used: Math.round(used / 1024 / 1024), // MB
      free: Math.round(free / 1024 / 1024), // MB
      percentage: Math.round(percentage * 100) / 100,
    };
  }

  async getDiskUsage() {
    try {
      const stats = await fs.stat(".");
      // This is a simplified version - in production, use a proper disk usage library
      return {
        total: 0,
        used: 0,
        free: 0,
        percentage: 0,
      };
    } catch (error) {
      return { total: 0, used: 0, free: 0, percentage: 0 };
    }
  }

  getAverageResponseTime() {
    if (this.responseTimes.length === 0) return 0;

    const sum = this.responseTimes.reduce((acc, time) => acc + time, 0);
    return Math.round(sum / this.responseTimes.length);
  }

  getErrorRate() {
    if (this.requestCount === 0) return 0;
    return Math.round((this.errorCount / this.requestCount) * 100 * 100) / 100;
  }

  getRequestsPerSecond() {
    const uptime = (Date.now() - this.startTime) / 1000;
    return Math.round((this.requestCount / uptime) * 100) / 100;
  }

  recordRequest(duration, statusCode) {
    this.requestCount++;
    this.responseTimes.push(duration);

    // Keep only last 1000 response times
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }

    if (statusCode >= 400) {
      this.errorCount++;
    }

    // Check for slow requests
    if (duration > this.thresholds.responseTime) {
      this.createAlert("slow_request", {
        duration,
        statusCode,
        threshold: this.thresholds.responseTime,
      });
    }
  }

  recordConnection(increment = true) {
    if (increment) {
      this.activeConnections++;
    } else {
      this.activeConnections = Math.max(0, this.activeConnections - 1);
    }
  }

  checkThresholds() {
    const latest = this.getLatestMetrics();
    if (!latest) return;

    // CPU threshold
    if (latest.system.cpu > this.thresholds.cpu) {
      this.createAlert("high_cpu", {
        current: latest.system.cpu,
        threshold: this.thresholds.cpu,
      });
    }

    // Memory threshold
    if (latest.system.memory.percentage > this.thresholds.memory) {
      this.createAlert("high_memory", {
        current: latest.system.memory.percentage,
        threshold: this.thresholds.memory,
      });
    }

    // Error rate threshold
    if (latest.application.errorRate > this.thresholds.errorRate) {
      this.createAlert("high_error_rate", {
        current: latest.application.errorRate,
        threshold: this.thresholds.errorRate,
      });
    }

    // Request rate threshold
    if (
      latest.application.requestsPerSecond > this.thresholds.requestsPerSecond
    ) {
      this.createAlert("high_request_rate", {
        current: latest.application.requestsPerSecond,
        threshold: this.thresholds.requestsPerSecond,
      });
    }
  }

  createAlert(type, data) {
    const alert = {
      id: `alert_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      type,
      level: this.getAlertLevel(type),
      message: this.getAlertMessage(type, data),
      data,
      timestamp: Date.now(),
      resolved: false,
    };

    this.alerts.unshift(alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(0, 100);
    }

    this.emit("alert:created", alert);

    // Log critical alerts
    if (alert.level === "critical") {
      console.error(`🚨 CRITICAL ALERT: ${alert.message}`);
    } else if (alert.level === "warning") {
      console.warn(`⚠️ WARNING: ${alert.message}`);
    }

    return alert;
  }

  getAlertLevel(type) {
    const levels = {
      high_cpu: "warning",
      high_memory: "critical",
      high_error_rate: "critical",
      high_request_rate: "warning",
      slow_request: "info",
      disk_full: "critical",
    };
    return levels[type] || "info";
  }

  getAlertMessage(type, data) {
    const messages = {
      high_cpu: `High CPU usage: ${data.current}% (threshold: ${data.threshold}%)`,
      high_memory: `High memory usage: ${data.current}% (threshold: ${data.threshold}%)`,
      high_error_rate: `High error rate: ${data.current}% (threshold: ${data.threshold}%)`,
      high_request_rate: `High request rate: ${data.current} RPS (threshold: ${data.threshold} RPS)`,
      slow_request: `Slow request: ${data.duration}ms (threshold: ${data.threshold}ms)`,
      disk_full: `Disk usage critical: ${data.current}% (threshold: ${data.threshold}%)`,
    };
    return messages[type] || `Alert: ${type}`;
  }

  getLatestMetrics() {
    const keys = Array.from(this.metrics.keys()).sort((a, b) => b - a);
    return keys.length > 0 ? this.metrics.get(keys[0]) : null;
  }

  getMetricsHistory(duration = 3600000) {
    // Default: last hour
    const cutoff = Date.now() - duration;
    const history = [];

    for (const [timestamp, metrics] of this.metrics.entries()) {
      if (timestamp >= cutoff) {
        history.push(metrics);
      }
    }

    return history.sort((a, b) => a.timestamp - b.timestamp);
  }

  getActiveAlerts() {
    return this.alerts.filter((alert) => !alert.resolved);
  }

  resolveAlert(alertId) {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      this.emit("alert:resolved", alert);
    }
    return alert;
  }

  cleanupOldData() {
    const oneHourAgo = Date.now() - 3600000; // 1 hour

    // Clean old metrics
    for (const [timestamp] of this.metrics.entries()) {
      if (timestamp < oneHourAgo) {
        this.metrics.delete(timestamp);
      }
    }

    // Clean old resolved alerts
    this.alerts = this.alerts.filter(
      (alert) => !alert.resolved || Date.now() - alert.timestamp < 86400000 // Keep resolved alerts for 24 hours
    );
  }

  getHealthStatus() {
    const latest = this.getLatestMetrics();
    const activeAlerts = this.getActiveAlerts();

    if (!latest) {
      return { status: "unknown", message: "No metrics available" };
    }

    const criticalAlerts = activeAlerts.filter((a) => a.level === "critical");
    const warningAlerts = activeAlerts.filter((a) => a.level === "warning");

    if (criticalAlerts.length > 0) {
      return {
        status: "critical",
        message: `${criticalAlerts.length} critical alert(s)`,
        alerts: criticalAlerts,
      };
    }

    if (warningAlerts.length > 0) {
      return {
        status: "warning",
        message: `${warningAlerts.length} warning(s)`,
        alerts: warningAlerts,
      };
    }

    // Check key metrics
    if (
      latest.system.cpu > this.thresholds.cpu ||
      latest.system.memory.percentage > this.thresholds.memory ||
      latest.application.errorRate > this.thresholds.errorRate
    ) {
      return {
        status: "warning",
        message: "Some metrics are approaching thresholds",
      };
    }

    return {
      status: "healthy",
      message: "All systems operating normally",
    };
  }

  exportMetrics(format = "json") {
    const data = {
      current: this.getLatestMetrics(),
      history: this.getMetricsHistory(),
      alerts: this.alerts,
      health: this.getHealthStatus(),
      thresholds: this.thresholds,
    };

    switch (format) {
      case "prometheus":
        return this.exportPrometheusMetrics(data);
      case "json":
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  exportPrometheusMetrics(data) {
    if (!data.current) return "";

    const metrics = [];

    // System metrics
    metrics.push(`# HELP bvote_cpu_usage CPU usage percentage`);
    metrics.push(`# TYPE bvote_cpu_usage gauge`);
    metrics.push(`bvote_cpu_usage ${data.current.system.cpu}`);

    metrics.push(`# HELP bvote_memory_usage Memory usage percentage`);
    metrics.push(`# TYPE bvote_memory_usage gauge`);
    metrics.push(`bvote_memory_usage ${data.current.system.memory.percentage}`);

    // Application metrics
    metrics.push(`# HELP bvote_requests_total Total number of requests`);
    metrics.push(`# TYPE bvote_requests_total counter`);
    metrics.push(
      `bvote_requests_total ${data.current.application.requestCount}`
    );

    metrics.push(`# HELP bvote_errors_total Total number of errors`);
    metrics.push(`# TYPE bvote_errors_total counter`);
    metrics.push(`bvote_errors_total ${data.current.application.errorCount}`);

    metrics.push(
      `# HELP bvote_response_time_avg Average response time in milliseconds`
    );
    metrics.push(`# TYPE bvote_response_time_avg gauge`);
    metrics.push(
      `bvote_response_time_avg ${data.current.application.avgResponseTime}`
    );

    metrics.push(
      `# HELP bvote_active_connections Number of active connections`
    );
    metrics.push(`# TYPE bvote_active_connections gauge`);
    metrics.push(
      `bvote_active_connections ${data.current.application.activeConnections}`
    );

    return metrics.join("\n");
  }

  // Middleware for Express
  middleware() {
    return (req, res, next) => {
      const start = performance.now();

      // Record connection
      this.recordConnection(true);

      // Override res.end to capture metrics
      const originalEnd = res.end;
      res.end = (...args) => {
        const duration = performance.now() - start;
        this.recordRequest(Math.round(duration), res.statusCode);
        this.recordConnection(false);
        originalEnd.apply(res, args);
      };

      next();
    };
  }
}
