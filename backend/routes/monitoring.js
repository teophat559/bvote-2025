/**
 * Monitoring Routes - System Metrics and Health Endpoints
 * Real-time monitoring, metrics export, and alerting
 */

import express from "express";
import MonitoringService from "../services/MonitoringService.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();
const monitoring = new MonitoringService();

// Start monitoring service
monitoring.start();

// GET /api/monitoring/health - Health check endpoint
router.get("/health", (req, res) => {
  const health = monitoring.getHealthStatus();

  res.status(health.status === "critical" ? 503 : 200).json({
    success: true,
    health,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/monitoring/metrics - Current metrics
router.get("/metrics", authMiddleware.requireAdmin, (req, res) => {
  const current = monitoring.getLatestMetrics();

  res.json({
    success: true,
    metrics: current,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/monitoring/metrics/history - Metrics history
router.get("/metrics/history", authMiddleware.requireAdmin, (req, res) => {
  const duration = parseInt(req.query.duration) || 3600000; // Default 1 hour
  const history = monitoring.getMetricsHistory(duration);

  res.json({
    success: true,
    history,
    duration,
    count: history.length,
  });
});

// GET /api/monitoring/alerts - Active alerts
router.get("/alerts", authMiddleware.requireAdmin, (req, res) => {
  const activeAlerts = monitoring.getActiveAlerts();

  res.json({
    success: true,
    alerts: activeAlerts,
    count: activeAlerts.length,
  });
});

// POST /api/monitoring/alerts/:id/resolve - Resolve alert
router.post("/alerts/:id/resolve", authMiddleware.requireAdmin, (req, res) => {
  const { id } = req.params;
  const alert = monitoring.resolveAlert(id);

  if (!alert) {
    return res.status(404).json({
      success: false,
      message: "Alert not found",
    });
  }

  res.json({
    success: true,
    message: "Alert resolved",
    alert,
  });
});

// GET /api/monitoring/export - Export metrics
router.get("/export", authMiddleware.requireAdmin, (req, res) => {
  const format = req.query.format || "json";
  const data = monitoring.exportMetrics(format);

  if (format === "prometheus") {
    res.set("Content-Type", "text/plain");
    res.send(data);
  } else {
    res.json({
      success: true,
      data: JSON.parse(data),
      format,
    });
  }
});

// GET /api/monitoring/prometheus - Prometheus metrics endpoint
router.get("/prometheus", (req, res) => {
  const metrics = monitoring.exportMetrics("prometheus");
  res.set("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
  res.send(metrics);
});

// POST /api/monitoring/test-alert - Create test alert (development only)
router.post("/test-alert", authMiddleware.requireAdmin, (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({
      success: false,
      message: "Test alerts not allowed in production",
    });
  }

  const { type, data } = req.body;
  const alert = monitoring.createAlert(
    type || "test_alert",
    data || {
      message: "This is a test alert",
      severity: "info",
    }
  );

  res.json({
    success: true,
    message: "Test alert created",
    alert,
  });
});

// GET /api/monitoring/dashboard - Dashboard data
router.get("/dashboard", authMiddleware.requireAdmin, (req, res) => {
  const current = monitoring.getLatestMetrics();
  const alerts = monitoring.getActiveAlerts();
  const health = monitoring.getHealthStatus();

  if (!current) {
    return res.status(503).json({
      success: false,
      message: "No metrics available",
    });
  }

  const dashboard = {
    overview: {
      status: health.status,
      uptime: current.system.uptime,
      totalRequests: current.application.requestCount,
      errorRate: current.application.errorRate,
      avgResponseTime: current.application.avgResponseTime,
    },
    system: {
      cpu: current.system.cpu,
      memory: current.system.memory,
      loadAverage: current.system.loadAverage,
    },
    application: {
      activeConnections: current.application.activeConnections,
      requestsPerSecond: current.application.requestsPerSecond,
      errorCount: current.application.errorCount,
    },
    alerts: {
      active: alerts.length,
      critical: alerts.filter((a) => a.level === "critical").length,
      warning: alerts.filter((a) => a.level === "warning").length,
      recent: alerts.slice(0, 5), // Last 5 alerts
    },
    charts: {
      responseTime: monitoring.getMetricsHistory(3600000).map((m) => ({
        timestamp: m.timestamp,
        value: m.application.avgResponseTime,
      })),
      requestRate: monitoring.getMetricsHistory(3600000).map((m) => ({
        timestamp: m.timestamp,
        value: m.application.requestsPerSecond,
      })),
      errorRate: monitoring.getMetricsHistory(3600000).map((m) => ({
        timestamp: m.timestamp,
        value: m.application.errorRate,
      })),
      systemLoad: monitoring.getMetricsHistory(3600000).map((m) => ({
        timestamp: m.timestamp,
        cpu: m.system.cpu,
        memory: m.system.memory.percentage,
      })),
    },
  };

  res.json({
    success: true,
    dashboard,
    timestamp: new Date().toISOString(),
  });
});

// WebSocket endpoint for real-time metrics (if Socket.IO is available)
router.get("/realtime", authMiddleware.requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: "Connect to WebSocket for real-time metrics",
    endpoint: "/socket.io/",
    events: ["metrics:collected", "alert:created", "alert:resolved"],
  });
});

// Error handling middleware
router.use((error, req, res, next) => {
  console.error("Monitoring API error:", error);

  res.status(500).json({
    success: false,
    message: "Internal monitoring error",
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
});

// Cleanup on process exit
process.on("SIGINT", () => {
  monitoring.stop();
});

process.on("SIGTERM", () => {
  monitoring.stop();
});

export default router;
