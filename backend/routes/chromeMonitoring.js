/**
 * Chrome Monitoring API Routes
 * Endpoints for Chrome process monitoring and management
 */

import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import logger from "../services/logger.js";

const router = express.Router();

// This will be injected by the main server
let chromeProcessMonitor = null;

// Middleware to inject Chrome monitor
export const injectChromeMonitor = (monitor) => {
  chromeProcessMonitor = monitor;
};

// Middleware to check Chrome monitor availability
const requireChromeMonitor = (req, res, next) => {
  if (!chromeProcessMonitor) {
    return res.status(503).json({
      success: false,
      error: "Chrome monitoring service not available",
    });
  }
  next();
};

/**
 * GET /api/chrome-monitoring/processes
 * Get all monitored Chrome processes
 */
router.get(
  "/processes",
  authenticateToken,
  requireChromeMonitor,
  (req, res) => {
    try {
      const processes = chromeProcessMonitor.getAllProcesses();

      res.json({
        success: true,
        data: processes,
        count: processes.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Get Chrome processes failed:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get Chrome processes",
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/chrome-monitoring/process/:profileId
 * Get specific Chrome process details
 */
router.get(
  "/process/:profileId",
  authenticateToken,
  requireChromeMonitor,
  (req, res) => {
    try {
      const { profileId } = req.params;
      const process = chromeProcessMonitor.getProcess(profileId);

      if (!process) {
        return res.status(404).json({
          success: false,
          error: "Chrome process not found",
        });
      }

      res.json({
        success: true,
        data: process,
      });
    } catch (error) {
      logger.error("Get Chrome process failed:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get Chrome process",
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/chrome-monitoring/stats
 * Get Chrome monitoring statistics
 */
router.get("/stats", authenticateToken, requireChromeMonitor, (req, res) => {
  try {
    const stats = chromeProcessMonitor.getMonitoringStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("Get Chrome monitoring stats failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get monitoring statistics",
      message: error.message,
    });
  }
});

/**
 * POST /api/chrome-monitoring/health-check/:profileId
 * Perform health check on specific process
 */
router.post(
  "/health-check/:profileId",
  authenticateToken,
  requireChromeMonitor,
  async (req, res) => {
    try {
      const { profileId } = req.params;

      await chromeProcessMonitor.performHealthCheck(profileId);

      res.json({
        success: true,
        message: `Health check initiated for process ${profileId}`,
      });
    } catch (error) {
      logger.error("Chrome health check failed:", error);
      res.status(500).json({
        success: false,
        error: "Failed to perform health check",
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/chrome-monitoring/cleanup
 * Cleanup old/inactive processes
 */
router.post("/cleanup", authenticateToken, requireChromeMonitor, (req, res) => {
  try {
    chromeProcessMonitor.cleanupOldProcesses();

    res.json({
      success: true,
      message: "Process cleanup completed successfully",
    });
  } catch (error) {
    logger.error("Chrome process cleanup failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to cleanup processes",
      message: error.message,
    });
  }
});

/**
 * GET /api/chrome-monitoring/system-health
 * Get system health metrics
 */
router.get(
  "/system-health",
  authenticateToken,
  requireChromeMonitor,
  async (req, res) => {
    try {
      await chromeProcessMonitor.performSystemHealthCheck();

      res.json({
        success: true,
        message: "System health check completed",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("System health check failed:", error);
      res.status(500).json({
        success: false,
        error: "Failed to perform system health check",
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/chrome-monitoring/alerts
 * Get active resource alerts
 */
router.get("/alerts", authenticateToken, requireChromeMonitor, (req, res) => {
  try {
    const alerts = [];

    // Get alerts from monitor (this would need to be implemented in the monitor class)
    const processes = chromeProcessMonitor.getAllProcesses();
    const stats = chromeProcessMonitor.getMonitoringStats();

    // Generate alert summary
    if (stats.unhealthyProcesses > 0) {
      alerts.push({
        type: "unhealthy_processes",
        severity: "high",
        count: stats.unhealthyProcesses,
        message: `${stats.unhealthyProcesses} Chrome processes are unhealthy`,
      });
    }

    if (stats.crashedProcesses > 0) {
      alerts.push({
        type: "crashed_processes",
        severity: "critical",
        count: stats.crashedProcesses,
        message: `${stats.crashedProcesses} Chrome processes have crashed`,
      });
    }

    if (stats.totalMemoryUsage > 2 * 1024 * 1024 * 1024) {
      // 2GB
      alerts.push({
        type: "high_memory_usage",
        severity: "medium",
        value: Math.round(stats.totalMemoryUsage / (1024 * 1024)),
        message: `High total memory usage: ${Math.round(
          stats.totalMemoryUsage / (1024 * 1024)
        )}MB`,
      });
    }

    res.json({
      success: true,
      data: {
        alerts,
        count: alerts.length,
        lastUpdate: stats.lastUpdate,
      },
    });
  } catch (error) {
    logger.error("Get Chrome alerts failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get alerts",
      message: error.message,
    });
  }
});

/**
 * WebSocket endpoint for real-time monitoring
 * GET /api/chrome-monitoring/realtime/:profileId
 */
router.get(
  "/realtime/:profileId",
  authenticateToken,
  requireChromeMonitor,
  (req, res) => {
    try {
      const { profileId } = req.params;

      // Set up Server-Sent Events
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
      });

      // Send initial data
      const process = chromeProcessMonitor.getProcess(profileId);
      if (process) {
        res.write(
          `data: ${JSON.stringify({ type: "initial", data: process })}\n\n`
        );
      } else {
        res.write(
          `data: ${JSON.stringify({
            type: "error",
            message: "Process not found",
          })}\n\n`
        );
        res.end();
        return;
      }

      // Set up event listeners
      const onMetricsUpdate = (data) => {
        if (data.profileId === profileId) {
          res.write(
            `data: ${JSON.stringify({
              type: "metrics",
              data: data.metrics,
            })}\n\n`
          );
        }
      };

      const onResourceAlert = (data) => {
        if (data.profileId === profileId) {
          res.write(
            `data: ${JSON.stringify({ type: "alert", data: data.alert })}\n\n`
          );
        }
      };

      const onProcessCrashed = (data) => {
        if (data.profileId === profileId) {
          res.write(`data: ${JSON.stringify({ type: "crashed", data })}\n\n`);
          res.end();
        }
      };

      chromeProcessMonitor.on("metrics_updated", onMetricsUpdate);
      chromeProcessMonitor.on("resource_alert", onResourceAlert);
      chromeProcessMonitor.on("process_crashed", onProcessCrashed);

      // Cleanup on disconnect
      req.on("close", () => {
        chromeProcessMonitor.off("metrics_updated", onMetricsUpdate);
        chromeProcessMonitor.off("resource_alert", onResourceAlert);
        chromeProcessMonitor.off("process_crashed", onProcessCrashed);
      });

      // Send periodic heartbeat
      const heartbeat = setInterval(() => {
        res.write(
          `data: ${JSON.stringify({
            type: "heartbeat",
            timestamp: new Date().toISOString(),
          })}\n\n`
        );
      }, 30000);

      req.on("close", () => {
        clearInterval(heartbeat);
      });
    } catch (error) {
      logger.error("Chrome realtime monitoring failed:", error);
      res.status(500).json({
        success: false,
        error: "Failed to start realtime monitoring",
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/chrome-monitoring/kill-process/:profileId
 * Force kill a Chrome process (emergency)
 */
router.post(
  "/kill-process/:profileId",
  authenticateToken,
  requireChromeMonitor,
  async (req, res) => {
    try {
      const { profileId } = req.params;
      const { force = false } = req.body;

      const process = chromeProcessMonitor.getProcess(profileId);
      if (!process) {
        return res.status(404).json({
          success: false,
          error: "Chrome process not found",
        });
      }

      // Kill the process
      const { spawn } = await import("child_process");
      const platform = process.platform || require("os").platform();

      let killCommand;
      if (platform === "win32") {
        killCommand = spawn(
          "taskkill",
          force ? ["/F", "/PID", process.pid] : ["/PID", process.pid]
        );
      } else {
        killCommand = spawn(
          "kill",
          force ? ["-9", process.pid] : [process.pid]
        );
      }

      killCommand.on("close", (code) => {
        if (code === 0) {
          chromeProcessMonitor.unregisterProcess(profileId);

          logger.info(
            `Chrome process killed: ${profileId} (PID: ${process.pid})`
          );

          res.json({
            success: true,
            message: `Process ${profileId} killed successfully`,
            pid: process.pid,
          });
        } else {
          res.status(500).json({
            success: false,
            error: "Failed to kill process",
            code,
          });
        }
      });
    } catch (error) {
      logger.error("Kill Chrome process failed:", error);
      res.status(500).json({
        success: false,
        error: "Failed to kill Chrome process",
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/chrome-monitoring/performance-report
 * Generate performance report
 */
router.get(
  "/performance-report",
  authenticateToken,
  requireChromeMonitor,
  (req, res) => {
    try {
      const { timeframe = "1h" } = req.query;
      const processes = chromeProcessMonitor.getAllProcesses();
      const stats = chromeProcessMonitor.getMonitoringStats();

      const report = {
        summary: {
          totalProcesses: stats.totalProcesses,
          runningProcesses: stats.runningProcesses,
          averageMemoryUsage: Math.round(
            stats.totalMemoryUsage / (1024 * 1024)
          ),
          averageCpuUsage: Math.round(stats.averageCpuUsage * 100) / 100,
          totalErrors: stats.totalErrors,
          uptime: stats.oldestProcess,
        },
        processes: processes.map((p) => ({
          profileId: p.profileId,
          status: p.status,
          uptime: Math.round(p.uptime / 1000),
          memory: p.memory,
          cpu: p.cpu,
          errors: p.errors,
          platform: p.platform,
        })),
        recommendations: [],
        generatedAt: new Date().toISOString(),
        timeframe,
      };

      // Add recommendations
      if (stats.averageCpuUsage > 70) {
        report.recommendations.push({
          type: "performance",
          priority: "high",
          message:
            "High CPU usage detected. Consider reducing concurrent Chrome processes.",
        });
      }

      if (stats.totalMemoryUsage > 1.5 * 1024 * 1024 * 1024) {
        report.recommendations.push({
          type: "memory",
          priority: "medium",
          message:
            "High memory usage detected. Consider implementing process rotation.",
        });
      }

      if (stats.totalErrors > 10) {
        report.recommendations.push({
          type: "stability",
          priority: "high",
          message:
            "High error count detected. Check Chrome automation scripts.",
        });
      }

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      logger.error("Generate performance report failed:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate performance report",
        message: error.message,
      });
    }
  }
);

export default router;
