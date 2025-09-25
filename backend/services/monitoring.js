import os from "os";
// import logger from "./logger.js"; // Replaced with console logging

/**
 * Performance and System Monitoring Service
 * Tracks system metrics, API performance, and application health
 */
class MonitoringService {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        errors: 0,
        by_endpoint: {},
        by_status: {},
      },
      performance: {
        avg_response_time: 0,
        response_times: [],
        slow_requests: 0,
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      },
      database: {
        queries: 0,
        query_times: [],
        connection_errors: 0,
      },
      security: {
        failed_logins: 0,
        blocked_ips: 0,
        rate_limit_hits: 0,
      },
    };

    this.startTime = Date.now();
    this.alertThresholds = {
      response_time: 1000, // 1 second
      memory_usage: 0.9, // 90%
      cpu_usage: 0.8, // 80%
      error_rate: 0.05, // 5%
    };

    // Start periodic monitoring
    this.startPeriodicMonitoring();
  }

  // API Request Monitoring
  recordRequest(req, res, responseTime) {
    this.metrics.requests.total++;

    // Record by endpoint
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    this.metrics.requests.by_endpoint[endpoint] =
      (this.metrics.requests.by_endpoint[endpoint] || 0) + 1;

    // Record by status code
    const statusCode = res.statusCode;
    this.metrics.requests.by_status[statusCode] =
      (this.metrics.requests.by_status[statusCode] || 0) + 1;

    // Record errors
    if (statusCode >= 400) {
      this.metrics.requests.errors++;
    }

    // Record performance
    this.metrics.performance.response_times.push(responseTime);

    // Keep only last 1000 response times
    if (this.metrics.performance.response_times.length > 1000) {
      this.metrics.performance.response_times.shift();
    }

    // Calculate average response time
    this.metrics.performance.avg_response_time =
      this.metrics.performance.response_times.reduce((a, b) => a + b, 0) /
      this.metrics.performance.response_times.length;

    // Count slow requests
    if (responseTime > this.alertThresholds.response_time) {
      this.metrics.performance.slow_requests++;
    }

    // Check for alerts
    this.checkAlerts(endpoint, responseTime, statusCode);
  }

  // Database Query Monitoring
  recordDatabaseQuery(queryTime) {
    this.metrics.database.queries++;
    this.metrics.database.query_times.push(queryTime);

    // Keep only last 500 query times
    if (this.metrics.database.query_times.length > 500) {
      this.metrics.database.query_times.shift();
    }
  }

  recordDatabaseError() {
    this.metrics.database.connection_errors++;
  }

  // Security Monitoring
  recordFailedLogin(ip, username) {
    this.metrics.security.failed_logins++;
    console.log("🔒 Failed login attempt", { ip, username });
  }

  recordBlockedIP(ip, reason) {
    this.metrics.security.blocked_ips++;
    console.log("🚫 IP blocked", { ip, reason });
  }

  recordRateLimitHit(ip, endpoint) {
    this.metrics.security.rate_limit_hits++;
    console.log("⚠️ Rate limit hit", { ip, endpoint });
  }

  // System Metrics Collection
  collectSystemMetrics() {
    return {
      uptime: process.uptime(),
      memory: {
        ...process.memoryUsage(),
        system: {
          total: os.totalmem(),
          free: os.freemem(),
          usage: (os.totalmem() - os.freemem()) / os.totalmem(),
        },
      },
      cpu: {
        usage: process.cpuUsage(),
        load: os.loadavg(),
        cores: os.cpus().length,
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        version: os.release(),
        hostname: os.hostname(),
      },
    };
  }

  // Health Check
  getHealthStatus() {
    const systemMetrics = this.collectSystemMetrics();
    const errorRate =
      this.metrics.requests.total > 0
        ? this.metrics.requests.errors / this.metrics.requests.total
        : 0;

    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: systemMetrics.uptime,
      checks: {
        memory: {
          status:
            systemMetrics.memory.system.usage <
            this.alertThresholds.memory_usage
              ? "healthy"
              : "warning",
          usage: systemMetrics.memory.system.usage,
          details: systemMetrics.memory,
        },
        cpu: {
          status:
            systemMetrics.cpu.load[0] < this.alertThresholds.cpu_usage
              ? "healthy"
              : "warning",
          load: systemMetrics.cpu.load,
          details: systemMetrics.cpu,
        },
        api: {
          status:
            errorRate < this.alertThresholds.error_rate ? "healthy" : "warning",
          error_rate: errorRate,
          avg_response_time: this.metrics.performance.avg_response_time,
          total_requests: this.metrics.requests.total,
        },
        database: {
          status:
            this.metrics.database.connection_errors < 5 ? "healthy" : "warning",
          queries: this.metrics.database.queries,
          connection_errors: this.metrics.database.connection_errors,
          avg_query_time:
            this.metrics.database.query_times.length > 0
              ? this.metrics.database.query_times.reduce((a, b) => a + b, 0) /
                this.metrics.database.query_times.length
              : 0,
        },
      },
    };

    // Overall status based on individual checks
    const hasWarnings = Object.values(health.checks).some(
      (check) => check.status === "warning"
    );
    if (hasWarnings) {
      health.status = "warning";
    }

    return health;
  }

  // Get comprehensive metrics
  getMetrics() {
    return {
      ...this.metrics,
      system: this.collectSystemMetrics(),
      timestamp: new Date().toISOString(),
      uptime_ms: Date.now() - this.startTime,
    };
  }

  // Alert checking
  checkAlerts(endpoint, responseTime, statusCode) {
    // Slow response alert
    if (responseTime > this.alertThresholds.response_time) {
      console.warn("🐌 Slow API response detected", {
        endpoint,
        responseTime,
        threshold: this.alertThresholds.response_time,
      });
    }

    // High error rate alert
    const errorRate =
      this.metrics.requests.total > 0
        ? this.metrics.requests.errors / this.metrics.requests.total
        : 0;

    if (
      errorRate > this.alertThresholds.error_rate &&
      this.metrics.requests.total > 100
    ) {
      console.warn("🚨 High error rate detected", {
        errorRate,
        threshold: this.alertThresholds.error_rate,
        totalRequests: this.metrics.requests.total,
        errors: this.metrics.requests.errors,
      });
    }
  }

  // Periodic monitoring
  startPeriodicMonitoring() {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      const systemMetrics = this.collectSystemMetrics();

      // Memory usage alert
      if (
        systemMetrics.memory.system.usage > this.alertThresholds.memory_usage
      ) {
        console.warn("🧠 High memory usage detected", {
          usage: systemMetrics.memory.system.usage,
          threshold: this.alertThresholds.memory_usage,
          details: systemMetrics.memory,
        });
      }

      // CPU usage alert
      if (systemMetrics.cpu.load[0] > this.alertThresholds.cpu_usage) {
        console.warn("💻 High CPU usage detected", {
          load: systemMetrics.cpu.load,
          threshold: this.alertThresholds.cpu_usage,
        });
      }

      // Log system metrics
      console.log("📊 System metrics collected", {
        type: "system_metrics",
        ...systemMetrics,
      });
    }, 30000);

    // Reset performance counters every hour
    setInterval(() => {
      this.metrics.performance.response_times = [];
      this.metrics.performance.slow_requests = 0;
      this.metrics.database.query_times = [];

      console.log("🔄 Performance counters reset");
    }, 3600000);
  }

  // Generate performance report
  generateReport() {
    const metrics = this.getMetrics();
    const health = this.getHealthStatus();

    return {
      summary: {
        status: health.status,
        uptime: metrics.uptime_ms,
        total_requests: metrics.requests.total,
        error_rate:
          metrics.requests.total > 0
            ? metrics.requests.errors / metrics.requests.total
            : 0,
        avg_response_time: metrics.performance.avg_response_time,
      },
      detailed_metrics: metrics,
      health_checks: health.checks,
      top_endpoints: this.getTopEndpoints(),
      recent_errors: this.getRecentErrors(),
      recommendations: this.generateRecommendations(metrics, health),
    };
  }

  getTopEndpoints() {
    return Object.entries(this.metrics.requests.by_endpoint)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));
  }

  getRecentErrors() {
    return Object.entries(this.metrics.requests.by_status)
      .filter(([status]) => parseInt(status) >= 400)
      .map(([status, count]) => ({ status: parseInt(status), count }));
  }

  generateRecommendations(metrics, health) {
    const recommendations = [];

    if (health.checks.memory.status === "warning") {
      recommendations.push(
        "Consider increasing server memory or optimizing memory usage"
      );
    }

    if (health.checks.cpu.status === "warning") {
      recommendations.push(
        "High CPU usage detected - consider scaling horizontally"
      );
    }

    if (metrics.performance.avg_response_time > 500) {
      recommendations.push(
        "Average response time is high - consider optimizing database queries"
      );
    }

    if (health.checks.api.error_rate > 0.02) {
      recommendations.push(
        "Error rate is elevated - investigate recent errors"
      );
    }

    return recommendations;
  }

  // Express middleware for automatic monitoring
  middleware() {
    return (req, res, next) => {
      const startTime = Date.now();

      // Override res.end to capture response time
      const originalEnd = res.end;
      res.end = (...args) => {
        const responseTime = Date.now() - startTime;
        this.recordRequest(req, res, responseTime);
        // Log API request (logger.api method not available)
        console.log(
          `API ${req.method} ${req.path} - ${res.statusCode} (${responseTime}ms)`
        );
        originalEnd.apply(res, args);
      };

      next();
    };
  }
}

// Create singleton instance
const monitoring = new MonitoringService();

export default monitoring;
export { MonitoringService };
