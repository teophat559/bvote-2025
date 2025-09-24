import { logger } from "./errorHandler.js";
import fs from "fs";
import path from "path";

// Performance monitoring
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        byStatusCode: {},
        byPath: {},
        responseTimeTotal: 0,
        slowRequests: [],
      },
      errors: {
        total: 0,
        by5xxCount: 0,
        by4xxCount: 0,
        byType: {},
        recent: [],
      },
      system: {
        memory: {
          used: 0,
          free: 0,
          total: 0,
          usage: 0,
        },
        cpu: {
          usage: 0,
        },
        uptime: 0,
      },
    };

    this.alerts = [];
    this.thresholds = {
      responseTime: 5000, // 5 seconds
      errorRate: 0.05, // 5%
      memoryUsage: 0.8, // 80%
      consecutiveErrors: 10,
    };

    this.consecutiveErrors = 0;
    this.startSystemMonitoring();
  }

  // Request monitoring middleware
  requestMonitor() {
    return (req, res, next) => {
      const startTime = Date.now();
      const originalSend = res.send;

      // Override res.send to capture response
      res.send = function (data) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        const statusCode = res.statusCode;

        // Update metrics
        performanceMonitor.updateRequestMetrics(req, res, responseTime);

        // Check for alerts
        performanceMonitor.checkRequestAlerts(req, res, responseTime);

        // Call original send
        return originalSend.call(this, data);
      };

      next();
    };
  }

  updateRequestMetrics(req, res, responseTime) {
    const { path, method } = req;
    const statusCode = res.statusCode;
    const pathKey = `${method} ${path}`;

    // Update request counts
    this.metrics.requests.total++;
    this.metrics.requests.responseTimeTotal += responseTime;

    // Update status code metrics
    this.metrics.requests.byStatusCode[statusCode] =
      (this.metrics.requests.byStatusCode[statusCode] || 0) + 1;

    // Update path metrics
    this.metrics.requests.byPath[pathKey] =
      (this.metrics.requests.byPath[pathKey] || 0) + 1;

    // Update success/failure counts
    if (statusCode >= 200 && statusCode < 400) {
      this.metrics.requests.successful++;
      this.consecutiveErrors = 0;
    } else {
      this.metrics.requests.failed++;
      this.consecutiveErrors++;

      // Update error metrics
      this.metrics.errors.total++;
      if (statusCode >= 400 && statusCode < 500) {
        this.metrics.errors.by4xxCount++;
      } else if (statusCode >= 500) {
        this.metrics.errors.by5xxCount++;
      }

      // Store recent error
      this.metrics.errors.recent.unshift({
        timestamp: new Date().toISOString(),
        path,
        method,
        statusCode,
        userAgent: req.headers["user-agent"],
        ip: req.ip,
      });

      // Keep only last 50 errors
      this.metrics.errors.recent = this.metrics.errors.recent.slice(0, 50);
    }

    // Track slow requests
    if (responseTime > this.thresholds.responseTime) {
      this.metrics.requests.slowRequests.unshift({
        timestamp: new Date().toISOString(),
        path,
        method,
        responseTime,
        statusCode,
      });

      // Keep only last 20 slow requests
      this.metrics.requests.slowRequests =
        this.metrics.requests.slowRequests.slice(0, 20);
    }
  }

  checkRequestAlerts(req, res, responseTime) {
    const statusCode = res.statusCode;

    // Slow response alert
    if (responseTime > this.thresholds.responseTime) {
      this.createAlert("SLOW_RESPONSE", {
        path: req.path,
        responseTime,
        threshold: this.thresholds.responseTime,
      });
    }

    // High error rate alert
    if (this.metrics.requests.total > 100) {
      const errorRate =
        this.metrics.requests.failed / this.metrics.requests.total;
      if (errorRate > this.thresholds.errorRate) {
        this.createAlert("HIGH_ERROR_RATE", {
          errorRate: (errorRate * 100).toFixed(2) + "%",
          threshold: (this.thresholds.errorRate * 100).toFixed(2) + "%",
        });
      }
    }

    // Consecutive errors alert
    if (this.consecutiveErrors >= this.thresholds.consecutiveErrors) {
      this.createAlert("CONSECUTIVE_ERRORS", {
        count: this.consecutiveErrors,
        lastError: req.path,
      });
    }

    // 5xx error alert
    if (statusCode >= 500) {
      this.createAlert("SERVER_ERROR", {
        statusCode,
        path: req.path,
        method: req.method,
      });
    }
  }

  createAlert(type, data) {
    const alert = {
      id: `ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: new Date().toISOString(),
      data,
      severity: this.getAlertSeverity(type),
      acknowledged: false,
    };

    this.alerts.unshift(alert);

    // Keep only last 100 alerts
    this.alerts = this.alerts.slice(0, 100);

    // Log alert
    logger.warn("System alert generated", alert);

    // Send notification if critical
    if (alert.severity === "critical") {
      this.sendCriticalAlert(alert);
    }
  }

  getAlertSeverity(type) {
    const severityMap = {
      SLOW_RESPONSE: "warning",
      HIGH_ERROR_RATE: "critical",
      CONSECUTIVE_ERRORS: "critical",
      SERVER_ERROR: "error",
      HIGH_MEMORY_USAGE: "warning",
      SERVICE_DOWN: "critical",
    };

    return severityMap[type] || "info";
  }

  sendCriticalAlert(alert) {
    // In production, you would send this to Slack, email, or other notification system
    logger.error("CRITICAL ALERT", {
      alert,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    });

    // You could integrate with services like:
    // - Slack webhook
    // - Email service
    // - PagerDuty
    // - Discord webhook
    // etc.
  }

  startSystemMonitoring() {
    setInterval(() => {
      this.updateSystemMetrics();
      this.checkSystemAlerts();
    }, 30000); // Every 30 seconds
  }

  updateSystemMetrics() {
    const memUsage = process.memoryUsage();

    this.metrics.system.memory = {
      used: memUsage.heapUsed,
      free: memUsage.heapTotal - memUsage.heapUsed,
      total: memUsage.heapTotal,
      usage: memUsage.heapUsed / memUsage.heapTotal,
      rss: memUsage.rss,
      external: memUsage.external,
    };

    this.metrics.system.uptime = process.uptime();

    // CPU usage would require additional libraries in production
    // For now, we'll estimate based on event loop delay
    const start = process.hrtime();
    setImmediate(() => {
      const delta = process.hrtime(start);
      const nanosec = delta[0] * 1e9 + delta[1];
      const millisec = nanosec / 1e6;
      this.metrics.system.cpu.eventLoopDelay = millisec;
    });
  }

  checkSystemAlerts() {
    // Memory usage alert
    if (this.metrics.system.memory.usage > this.thresholds.memoryUsage) {
      this.createAlert("HIGH_MEMORY_USAGE", {
        usage: (this.metrics.system.memory.usage * 100).toFixed(2) + "%",
        threshold: (this.thresholds.memoryUsage * 100).toFixed(2) + "%",
      });
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      averageResponseTime:
        this.metrics.requests.total > 0
          ? Math.round(
              this.metrics.requests.responseTimeTotal /
                this.metrics.requests.total
            )
          : 0,
      errorRate:
        this.metrics.requests.total > 0
          ? (
              (this.metrics.requests.failed / this.metrics.requests.total) *
              100
            ).toFixed(2) + "%"
          : "0%",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  getAlerts(limit = 50) {
    return this.alerts.slice(0, limit);
  }

  acknowledgeAlert(alertId) {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  exportMetrics() {
    const metricsData = {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      alerts: this.getAlerts(),
    };

    const filename = `metrics-${Date.now()}.json`;
    const filepath = path.join(process.cwd(), "logs", filename);

    try {
      fs.writeFileSync(filepath, JSON.stringify(metricsData, null, 2));
      logger.info("Metrics exported", { filename, filepath });
      return { success: true, filename, filepath };
    } catch (error) {
      logger.error("Failed to export metrics", error);
      return { success: false, error: error.message };
    }
  }

  reset() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        byStatusCode: {},
        byPath: {},
        responseTimeTotal: 0,
        slowRequests: [],
      },
      errors: {
        total: 0,
        by5xxCount: 0,
        by4xxCount: 0,
        byType: {},
        recent: [],
      },
      system: {
        memory: { used: 0, free: 0, total: 0, usage: 0 },
        cpu: { usage: 0 },
        uptime: 0,
      },
    };

    this.alerts = [];
    this.consecutiveErrors = 0;

    logger.info("Monitoring metrics reset");
  }
}

// Create global performance monitor instance
const performanceMonitor = new PerformanceMonitor();

// Health check with monitoring data
export const monitoringHealthCheck = (req, res) => {
  const metrics = performanceMonitor.getMetrics();
  const alerts = performanceMonitor.getAlerts(10);

  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.version,
    memory: metrics.system.memory,
    performance: {
      totalRequests: metrics.requests.total,
      errorRate: metrics.errorRate,
      averageResponseTime: metrics.averageResponseTime + "ms",
    },
    activeAlerts: alerts.filter((a) => !a.acknowledged).length,
    recentErrors: metrics.errors.recent.slice(0, 5),
  };

  // Determine overall health status
  const criticalAlerts = alerts.filter(
    (a) => a.severity === "critical" && !a.acknowledged
  );
  if (criticalAlerts.length > 0) {
    health.status = "critical";
  } else if (
    metrics.system.memory.usage > 0.9 ||
    parseFloat(metrics.errorRate) > 10
  ) {
    health.status = "degraded";
  }

  const statusCode =
    health.status === "healthy"
      ? 200
      : health.status === "degraded"
      ? 503
      : 503;

  res.status(statusCode).json(health);
};

// Middleware exports
export const requestMonitoring = () => performanceMonitor.requestMonitor();

export const getPerformanceMetrics = () => performanceMonitor.getMetrics();

export const getSystemAlerts = (limit) => performanceMonitor.getAlerts(limit);

export const acknowledgeAlert = (alertId) =>
  performanceMonitor.acknowledgeAlert(alertId);

export const exportMetrics = () => performanceMonitor.exportMetrics();

export const resetMetrics = () => performanceMonitor.reset();

export { performanceMonitor };

export default {
  requestMonitoring,
  monitoringHealthCheck,
  getPerformanceMetrics,
  getSystemAlerts,
  acknowledgeAlert,
  exportMetrics,
  resetMetrics,
  performanceMonitor,
};
