/**
 * Enhanced System Integration
 * Kết nối và tích hợp tất cả các enhanced services
 */

import Enhanced2FAManager from "./enhanced-2fa-manager.js";
import ChromeProcessMonitor from "./chrome-process-monitor.js";
import RetryManager from "./retry-manager.js";

// Import API routes
import enhanced2FARoutes, { inject2FAManager } from "../routes/enhanced2FA.js";
import chromeMonitoringRoutes, {
  injectChromeMonitor,
} from "../routes/chromeMonitoring.js";
import retryManagementRoutes, {
  injectRetryManager,
} from "../routes/retryManagement.js";

class EnhancedSystemIntegration {
  constructor(app, eventBus, securityManager, logger) {
    this.app = app;
    this.eventBus = eventBus;
    this.securityManager = securityManager;
    this.logger = logger;

    // Enhanced services
    this.enhanced2FAManager = null;
    this.chromeProcessMonitor = null;
    this.retryManager = null;

    // Integration status
    this.isInitialized = false;
    this.enabledServices = {
      enhanced2FA: true,
      chromeMonitoring: true,
      retryManagement: true,
    };
  }

  /**
   * Initialize all enhanced services
   */
  async initialize() {
    try {
      this.logger?.info("🔧 Initializing Enhanced System Integration...");

      // Initialize Enhanced 2FA Manager
      if (this.enabledServices.enhanced2FA) {
        await this.initialize2FAManager();
      }

      // Initialize Chrome Process Monitor
      if (this.enabledServices.chromeMonitoring) {
        await this.initializeChromeMonitor();
      }

      // Initialize Retry Manager
      if (this.enabledServices.retryManagement) {
        await this.initializeRetryManager();
      }

      // Setup inter-service communication
      await this.setupInterServiceCommunication();

      // Mount API routes
      this.mountAPIRoutes();

      // Setup event listeners for system integration
      this.setupSystemEventListeners();

      this.isInitialized = true;
      this.logger?.info(
        "✅ Enhanced System Integration initialized successfully"
      );

      return {
        success: true,
        services: {
          enhanced2FA: !!this.enhanced2FAManager,
          chromeMonitoring: !!this.chromeProcessMonitor,
          retryManagement: !!this.retryManager,
        },
      };
    } catch (error) {
      this.logger?.error("❌ Enhanced System Integration failed:", error);
      throw error;
    }
  }

  /**
   * Initialize Enhanced 2FA Manager
   */
  async initialize2FAManager() {
    try {
      this.enhanced2FAManager = new Enhanced2FAManager(
        this.eventBus,
        this.securityManager
      );

      // Setup 2FA specific event handlers
      this.enhanced2FAManager.on("session_created", (data) => {
        this.logger?.info(`2FA session created: ${data.sessionId}`);
      });

      this.enhanced2FAManager.on("verification_success", (data) => {
        this.logger?.info(`2FA verification successful: ${data.sessionId}`);
        // Trigger continuation of auto-login process
        this.eventBus?.publish("auto_login.2fa_verified", data);
      });

      this.enhanced2FAManager.on("session_expired", (data) => {
        this.logger?.warn(`2FA session expired: ${data.sessionId}`);
        // Possibly trigger retry with new 2FA session
        if (this.retryManager) {
          this.retryManager.initializeRetrySession(
            data.originalSessionId,
            data.platform,
            data.accountId,
            "2fa_expired",
            { originalSessionId: data.sessionId }
          );
        }
      });

      this.logger?.info("✅ Enhanced 2FA Manager initialized");
    } catch (error) {
      this.logger?.error(
        "❌ Enhanced 2FA Manager initialization failed:",
        error
      );
      this.enabledServices.enhanced2FA = false;
    }
  }

  /**
   * Initialize Chrome Process Monitor
   */
  async initializeChromeMonitor() {
    try {
      this.chromeProcessMonitor = new ChromeProcessMonitor(
        this.eventBus,
        this.logger
      );

      // Setup Chrome monitoring event handlers
      this.chromeProcessMonitor.on("process_crashed", (data) => {
        this.logger?.error(`Chrome process crashed: ${data.profileId}`);

        // Trigger retry if session was active
        if (this.retryManager && data.sessionId) {
          this.retryManager.initializeRetrySession(
            data.sessionId,
            data.platform || "unknown",
            data.accountId || "unknown",
            "browser_crash",
            { crashReason: data.reason, uptime: data.uptime }
          );
        }
      });

      this.chromeProcessMonitor.on("resource_alert", (data) => {
        this.logger?.warn(
          `Chrome resource alert: ${data.profileId} - ${data.alert.type}`
        );

        // Emit system alert
        this.eventBus?.publish("system.resource_alert", {
          service: "chrome_monitoring",
          profileId: data.profileId,
          alert: data.alert,
          timestamp: new Date().toISOString(),
        });
      });

      this.chromeProcessMonitor.on("system_alert", (data) => {
        this.logger?.warn(`System alert: ${data.type} - ${data.value}`);

        // Send to event bus for admin notification
        this.eventBus?.publish("system.health_alert", {
          type: data.type,
          value: data.value,
          threshold: data.threshold,
          severity: data.value > data.threshold * 1.5 ? "critical" : "high",
          timestamp: new Date().toISOString(),
        });
      });

      this.logger?.info("✅ Chrome Process Monitor initialized");
    } catch (error) {
      this.logger?.error(
        "❌ Chrome Process Monitor initialization failed:",
        error
      );
      this.enabledServices.chromeMonitoring = false;
    }
  }

  /**
   * Initialize Retry Manager
   */
  async initializeRetryManager() {
    try {
      this.retryManager = new RetryManager(this.eventBus, this.logger);

      // Setup Retry Manager event handlers
      this.retryManager.on("session_created", (data) => {
        this.logger?.info(
          `Retry session created: ${data.retrySessionId} for ${data.errorType}`
        );
      });

      this.retryManager.on("attempt_success", (data) => {
        this.logger?.info(
          `Retry attempt successful: ${data.retrySessionId} on attempt ${data.attemptNumber}`
        );

        // Emit success to continue auto-login workflow
        this.eventBus?.publish("auto_login.retry_success", {
          originalSessionId: data.originalSessionId,
          retrySessionId: data.retrySessionId,
          result: data.result,
        });
      });

      this.retryManager.on("session_failed", (data) => {
        this.logger?.warn(
          `Retry session failed permanently: ${data.retrySessionId} after ${data.totalAttempts} attempts`
        );

        // Final failure - may need manual intervention
        this.eventBus?.publish("auto_login.retry_failed", {
          originalSessionId: data.originalSessionId,
          retrySessionId: data.retrySessionId,
          finalError: data.finalError,
          totalAttempts: data.totalAttempts,
        });
      });

      this.retryManager.on("circuit_breaker_opened", (data) => {
        this.logger?.error(
          `Circuit breaker opened: ${data.platform}:${data.accountId}`
        );

        // Send alert to admins
        this.eventBus?.publish("admin.alert", {
          type: "circuit_breaker_opened",
          platform: data.platform,
          accountId: data.accountId,
          failureCount: data.failureCount,
          severity: "high",
          timestamp: new Date().toISOString(),
        });
      });

      this.retryManager.on("failure_pattern_detected", (data) => {
        this.logger?.warn(
          `Failure pattern detected: ${data.platform} - ${data.errorType}`
        );

        // Send pattern analysis to admins
        this.eventBus?.publish("admin.pattern_alert", {
          type: "failure_pattern",
          platform: data.platform,
          errorType: data.errorType,
          occurrences: data.occurrences,
          pattern: data.pattern,
          severity: "medium",
          timestamp: new Date().toISOString(),
        });
      });

      this.logger?.info("✅ Retry Manager initialized");
    } catch (error) {
      this.logger?.error("❌ Retry Manager initialization failed:", error);
      this.enabledServices.retryManagement = false;
    }
  }

  /**
   * Setup inter-service communication
   */
  async setupInterServiceCommunication() {
    // Auto-login failure triggers retry
    this.eventBus.on("auto_login.failed", async (data) => {
      if (this.retryManager && data.sessionId) {
        try {
          await this.retryManager.initializeRetrySession(
            data.sessionId,
            data.platform,
            data.accountId,
            data.errorType || "unknown",
            {
              originalError: data.error,
              userAgent: data.userAgent,
              ipAddress: data.ipAddress,
            }
          );
        } catch (error) {
          this.logger?.error("Failed to initialize retry session:", error);
        }
      }
    });

    // 2FA requirement triggers 2FA manager
    this.eventBus.on("auto_login.2fa_required", async (data) => {
      if (this.enhanced2FAManager && data.sessionId) {
        try {
          await this.enhanced2FAManager.initialize2FASession(
            data.sessionId,
            data.platform,
            data.accountId,
            data.detectedMethod
          );
        } catch (error) {
          this.logger?.error("Failed to initialize 2FA session:", error);
        }
      }
    });

    // Chrome process registration for monitoring
    this.eventBus.on("chrome.process_started", (data) => {
      if (this.chromeProcessMonitor) {
        this.chromeProcessMonitor.registerProcess(
          data.profileId,
          data.processInfo
        );
      }
    });

    // Chrome process termination
    this.eventBus.on("chrome.process_terminated", (data) => {
      if (this.chromeProcessMonitor) {
        this.chromeProcessMonitor.unregisterProcess(data.profileId);
      }
    });

    this.logger?.info("✅ Inter-service communication setup complete");
  }

  /**
   * Mount API routes
   */
  mountAPIRoutes() {
    if (this.enhanced2FAManager) {
      inject2FAManager(this.enhanced2FAManager);
      this.app.use("/api/2fa", enhanced2FARoutes);
      this.logger?.info("✅ Enhanced 2FA API routes mounted");
    }

    if (this.chromeProcessMonitor) {
      injectChromeMonitor(this.chromeProcessMonitor);
      this.app.use("/api/chrome-monitoring", chromeMonitoringRoutes);
      this.logger?.info("✅ Chrome Monitoring API routes mounted");
    }

    if (this.retryManager) {
      injectRetryManager(this.retryManager);
      this.app.use("/api/retry", retryManagementRoutes);
      this.logger?.info("✅ Retry Management API routes mounted");
    }
  }

  /**
   * Setup system-wide event listeners
   */
  setupSystemEventListeners() {
    // Health monitoring integration
    this.eventBus.on("system.health_check", async () => {
      const healthStatus = await this.getSystemHealthStatus();
      this.eventBus?.publish("system.health_status", healthStatus);
    });

    // Performance monitoring
    this.eventBus?.on("system.performance_check", async () => {
      const performanceMetrics = await this.getPerformanceMetrics();
      this.eventBus?.publish("system.performance_metrics", performanceMetrics);
    });

    // Cleanup tasks
    this.eventBus?.on("system.cleanup", async () => {
      await this.performSystemCleanup();
    });

    this.logger?.info("✅ System event listeners setup complete");
  }

  /**
   * Get overall system health status
   */
  async getSystemHealthStatus() {
    const health = {
      overall: "healthy",
      services: {},
      issues: [],
      timestamp: new Date().toISOString(),
    };

    try {
      // Check Enhanced 2FA Manager
      if (this.enhanced2FAManager) {
        const active2FASessions = this.enhanced2FAManager.getActive2FASessions();
        const expired2FASessions = active2FASessions.filter(
          (s) => new Date(s.expiresAt) < new Date()
        );

        health.services.enhanced2FA = {
          status: "healthy",
          activeSessions: active2FASessions.length,
          expiredSessions: expired2FASessions.length,
        };

        if (expired2FASessions.length > 5) {
          health.issues.push("High number of expired 2FA sessions");
          health.services.enhanced2FA.status = "warning";
        }
      }

      // Check Chrome Process Monitor
      if (this.chromeProcessMonitor) {
        const chromeStats = this.chromeProcessMonitor.getMonitoringStats();

        health.services.chromeMonitoring = {
          status: chromeStats.crashedProcesses > 0 ? "warning" : "healthy",
          totalProcesses: chromeStats.totalProcesses,
          runningProcesses: chromeStats.runningProcesses,
          crashedProcesses: chromeStats.crashedProcesses,
          memoryUsage:
            Math.round(chromeStats.totalMemoryUsage / (1024 * 1024)) + "MB",
        };

        if (chromeStats.crashedProcesses > 0) {
          health.issues.push(
            `${chromeStats.crashedProcesses} Chrome processes crashed`
          );
        }

        if (chromeStats.unhealthyProcesses > 0) {
          health.issues.push(
            `${chromeStats.unhealthyProcesses} Chrome processes unhealthy`
          );
        }
      }

      // Check Retry Manager
      if (this.retryManager) {
        const retryStats = this.retryManager.getRetryStats();

        health.services.retryManagement = {
          status:
            retryStats.successRate < 50
              ? "critical"
              : retryStats.successRate < 70
              ? "warning"
              : "healthy",
          totalSessions: retryStats.totalSessions,
          successRate: retryStats.successRate,
          pendingSessions: retryStats.pendingSessions,
          failedSessions: retryStats.failedSessions,
        };

        if (retryStats.successRate < 50) {
          health.issues.push("Very low retry success rate");
        }

        const openBreakers = Object.values(
          retryStats.circuitBreakerStatus
        ).filter((b) => b.state === "open").length;

        if (openBreakers > 0) {
          health.issues.push(`${openBreakers} circuit breakers are open`);
        }
      }

      // Determine overall health
      const serviceStatuses = Object.values(health.services).map(
        (s) => s.status
      );
      if (serviceStatuses.includes("critical")) {
        health.overall = "critical";
      } else if (serviceStatuses.includes("warning")) {
        health.overall = "warning";
      }
    } catch (error) {
      health.overall = "error";
      health.issues.push(`Health check error: ${error.message}`);
    }

    return health;
  }

  /**
   * Get performance metrics from all services
   */
  async getPerformanceMetrics() {
    const metrics = {
      enhanced2FA: null,
      chromeMonitoring: null,
      retryManagement: null,
      timestamp: new Date().toISOString(),
    };

    try {
      if (this.enhanced2FAManager) {
        const sessions = this.enhanced2FAManager.getActive2FASessions();
        metrics.enhanced2FA = {
          activeSessions: sessions.length,
          averageSessionAge:
            sessions.length > 0
              ? sessions.reduce(
                  (sum, s) =>
                    sum + (Date.now() - new Date(s.createdAt).getTime()),
                  0
                ) / sessions.length
              : 0,
        };
      }

      if (this.chromeProcessMonitor) {
        metrics.chromeMonitoring = this.chromeProcessMonitor.getMonitoringStats();
      }

      if (this.retryManager) {
        metrics.retryManagement = this.retryManager.getRetryStats();
      }
    } catch (error) {
      this.logger?.error("Error collecting performance metrics:", error);
    }

    return metrics;
  }

  /**
   * Perform system cleanup
   */
  async performSystemCleanup() {
    try {
      this.logger?.info("🧹 Performing system cleanup...");

      // Cleanup Enhanced 2FA Manager
      if (this.enhanced2FAManager) {
        this.enhanced2FAManager.cleanupExpiredSessions();
      }

      // Cleanup Chrome Process Monitor
      if (this.chromeProcessMonitor) {
        this.chromeProcessMonitor.cleanupOldProcesses();
      }

      // Cleanup Retry Manager
      if (this.retryManager) {
        this.retryManager.cleanupOldSessions();
        this.retryManager.maintainCircuitBreakers();
      }

      this.logger?.info("✅ System cleanup completed");
    } catch (error) {
      this.logger?.error("❌ System cleanup failed:", error);
    }
  }

  /**
   * Get integration status
   */
  getIntegrationStatus() {
    return {
      isInitialized: this.isInitialized,
      enabledServices: this.enabledServices,
      services: {
        enhanced2FA: !!this.enhanced2FAManager,
        chromeMonitoring: !!this.chromeProcessMonitor,
        retryManagement: !!this.retryManager,
      },
      version: "1.0.0",
      lastInitialized: this.isInitialized ? new Date().toISOString() : null,
    };
  }

  /**
   * Shutdown all enhanced services gracefully
   */
  async shutdown() {
    try {
      this.logger?.info("🛑 Shutting down Enhanced System Integration...");

      // Cleanup any pending operations
      await this.performSystemCleanup();

      // Stop background tasks
      if (this.enhanced2FAManager) {
        this.enhanced2FAManager.removeAllListeners();
      }

      if (this.chromeProcessMonitor) {
        this.chromeProcessMonitor.removeAllListeners();
      }

      if (this.retryManager) {
        this.retryManager.removeAllListeners();
      }

      this.isInitialized = false;
      this.logger?.info("✅ Enhanced System Integration shutdown complete");
    } catch (error) {
      this.logger?.error("❌ Shutdown error:", error);
    }
  }
}

export default EnhancedSystemIntegration;
