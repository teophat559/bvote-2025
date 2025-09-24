/**
 * Retry Management API Routes
 * Endpoints for managing retry mechanisms and monitoring failed login attempts
 */

import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { validateInput } from "../middleware/validation.js";
import logger from "../services/logger.js";

const router = express.Router();

// This will be injected by the main server
let retryManager = null;

// Middleware to inject retry manager
export const injectRetryManager = (manager) => {
  retryManager = manager;
};

// Middleware to check retry manager availability
const requireRetryManager = (req, res, next) => {
  if (!retryManager) {
    return res.status(503).json({
      success: false,
      error: "Retry management service not available",
    });
  }
  next();
};

/**
 * POST /api/retry/initialize
 * Initialize retry session for failed login
 */
router.post(
  "/initialize",
  authenticateToken,
  requireRetryManager,
  validateInput({
    originalSessionId: { type: "string", required: true },
    platform: { type: "string", required: true },
    accountId: { type: "string", required: true },
    errorType: { type: "string", required: true },
    errorDetails: { type: "object", required: false },
  }),
  async (req, res) => {
    try {
      const {
        originalSessionId,
        platform,
        accountId,
        errorType,
        errorDetails = {},
      } = req.body;

      const session = await retryManager.initializeRetrySession(
        originalSessionId,
        platform,
        accountId,
        errorType,
        {
          ...errorDetails,
          userAgent: req.headers["user-agent"],
          ipAddress: req.ip,
        }
      );

      logger.info(
        `Retry session initialized: ${session.id} for ${accountId} on ${platform}`
      );

      res.json({
        success: true,
        data: {
          retrySessionId: session.id,
          maxAttempts: session.maxAttempts,
          nextAttemptAt: session.nextAttemptAt,
          strategy: session.strategy,
        },
        message: "Retry session initialized successfully",
      });
    } catch (error) {
      logger.error("Retry initialization failed:", error);

      let statusCode = 500;
      if (error.message.includes("Circuit breaker")) {
        statusCode = 429; // Too Many Requests
      }

      res.status(statusCode).json({
        success: false,
        error: "Failed to initialize retry session",
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/retry/session/:retrySessionId
 * Get retry session information
 */
router.get(
  "/session/:retrySessionId",
  authenticateToken,
  requireRetryManager,
  (req, res) => {
    try {
      const { retrySessionId } = req.params;
      const session = retryManager.getRetrySession(retrySessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          error: "Retry session not found",
        });
      }

      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      logger.error("Get retry session failed:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get retry session",
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/retry/cancel/:retrySessionId
 * Cancel retry session
 */
router.post(
  "/cancel/:retrySessionId",
  authenticateToken,
  requireRetryManager,
  validateInput({
    reason: { type: "string", required: false },
  }),
  async (req, res) => {
    try {
      const { retrySessionId } = req.params;
      const { reason = "user_cancelled" } = req.body;

      const cancelled = await retryManager.cancelRetrySession(
        retrySessionId,
        reason
      );

      if (cancelled) {
        res.json({
          success: true,
          message: "Retry session cancelled successfully",
        });
      } else {
        res.status(404).json({
          success: false,
          error: "Retry session not found",
        });
      }
    } catch (error) {
      logger.error("Cancel retry session failed:", error);
      res.status(500).json({
        success: false,
        error: "Failed to cancel retry session",
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/retry/execute/:retrySessionId
 * Manually trigger retry attempt
 */
router.post(
  "/execute/:retrySessionId",
  authenticateToken,
  requireRetryManager,
  async (req, res) => {
    try {
      const { retrySessionId } = req.params;

      const success = await retryManager.executeRetryAttempt(retrySessionId);

      res.json({
        success: true,
        data: {
          attemptExecuted: true,
          attemptSuccess: success,
        },
        message: success ? "Retry attempt successful" : "Retry attempt failed",
      });
    } catch (error) {
      logger.error("Execute retry attempt failed:", error);
      res.status(500).json({
        success: false,
        error: "Failed to execute retry attempt",
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/retry/stats
 * Get retry management statistics
 */
router.get("/stats", authenticateToken, requireRetryManager, (req, res) => {
  try {
    const stats = retryManager.getRetryStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("Get retry stats failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get retry statistics",
      message: error.message,
    });
  }
});

/**
 * GET /api/retry/circuit-breakers
 * Get circuit breaker status
 */
router.get(
  "/circuit-breakers",
  authenticateToken,
  requireRetryManager,
  (req, res) => {
    try {
      const stats = retryManager.getRetryStats();
      const circuitBreakers = stats.circuitBreakerStatus;

      // Transform circuit breaker data for better API response
      const breakersArray = Object.entries(circuitBreakers).map(
        ([key, breaker]) => {
          const [platform, accountId] = key.split("_");
          return {
            key,
            platform,
            accountId,
            state: breaker.state,
            failureCount: breaker.failureCount,
            lastFailureTime: breaker.lastFailureTime,
            isBlocked: breaker.state === "open",
            canAttempt: retryManager.canAttempt(key),
          };
        }
      );

      res.json({
        success: true,
        data: {
          circuitBreakers: breakersArray,
          summary: {
            total: breakersArray.length,
            open: breakersArray.filter((b) => b.state === "open").length,
            halfOpen: breakersArray.filter((b) => b.state === "half-open")
              .length,
            closed: breakersArray.filter((b) => b.state === "closed").length,
          },
        },
      });
    } catch (error) {
      logger.error("Get circuit breakers failed:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get circuit breaker status",
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/retry/circuit-breaker/reset
 * Reset circuit breaker for specific platform/account
 */
router.post(
  "/circuit-breaker/reset",
  authenticateToken,
  requireRetryManager,
  validateInput({
    platform: { type: "string", required: true },
    accountId: { type: "string", required: true },
  }),
  (req, res) => {
    try {
      const { platform, accountId } = req.body;

      // Reset circuit breaker by recording a success
      retryManager.recordSuccess(platform, accountId);

      logger.info(
        `Circuit breaker reset for ${platform}:${accountId} by admin`
      );

      res.json({
        success: true,
        message: `Circuit breaker reset for ${platform}:${accountId}`,
      });
    } catch (error) {
      logger.error("Reset circuit breaker failed:", error);
      res.status(500).json({
        success: false,
        error: "Failed to reset circuit breaker",
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/retry/failure-patterns
 * Get failure pattern analysis
 */
router.get(
  "/failure-patterns",
  authenticateToken,
  requireRetryManager,
  (req, res) => {
    try {
      const { timeframe = "1h" } = req.query;

      // Get failure patterns from retry manager
      // Note: This would need to be implemented in the RetryManager class
      const patterns = retryManager.failurePatterns
        ? Array.from(retryManager.failurePatterns.entries()).map(
            ([key, pattern]) => ({
              key,
              platform: pattern.platform,
              errorType: pattern.errorType,
              count: pattern.count,
              recentCount: pattern.occurrences.filter(
                (time) =>
                  Date.now() - time < (timeframe === "1h" ? 3600000 : 86400000)
              ).length,
              firstSeen: new Date(pattern.firstSeen).toISOString(),
              lastSeen: new Date(pattern.lastSeen).toISOString(),
              severity: retryManager.calculatePatternSeverity(pattern),
              recommendation: retryManager.generateRecommendation(pattern),
            })
          )
        : [];

      // Sort by severity and recent count
      patterns.sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const aSeverity = severityOrder[a.severity] || 0;
        const bSeverity = severityOrder[b.severity] || 0;

        if (aSeverity !== bSeverity) {
          return bSeverity - aSeverity;
        }
        return b.recentCount - a.recentCount;
      });

      res.json({
        success: true,
        data: {
          patterns,
          summary: {
            totalPatterns: patterns.length,
            criticalPatterns: patterns.filter((p) => p.severity === "critical")
              .length,
            highPatterns: patterns.filter((p) => p.severity === "high").length,
            mediumPatterns: patterns.filter((p) => p.severity === "medium")
              .length,
            lowPatterns: patterns.filter((p) => p.severity === "low").length,
          },
          timeframe,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error("Get failure patterns failed:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get failure patterns",
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/retry/recommendations
 * Get system recommendations based on retry patterns
 */
router.get(
  "/recommendations",
  authenticateToken,
  requireRetryManager,
  (req, res) => {
    try {
      const stats = retryManager.getRetryStats();
      const recommendations = [];

      // Analyze retry statistics and generate recommendations
      if (stats.successRate < 70) {
        recommendations.push({
          type: "success_rate",
          priority: "high",
          title: "Low Retry Success Rate",
          description: `Current success rate is ${stats.successRate.toFixed(
            1
          )}%. Consider reviewing retry strategies.`,
          action: "Review and adjust retry parameters for failing platforms",
        });
      }

      if (stats.averageAttempts > 3) {
        recommendations.push({
          type: "attempt_count",
          priority: "medium",
          title: "High Average Attempts",
          description: `Average attempts per session: ${stats.averageAttempts.toFixed(
            1
          )}. This may indicate ineffective retry strategies.`,
          action: "Optimize retry delays and conditions",
        });
      }

      // Check circuit breaker recommendations
      const circuitBreakers = stats.circuitBreakerStatus;
      const openBreakers = Object.values(circuitBreakers).filter(
        (b) => b.state === "open"
      ).length;

      if (openBreakers > 0) {
        recommendations.push({
          type: "circuit_breakers",
          priority: "high",
          title: "Open Circuit Breakers",
          description: `${openBreakers} circuit breakers are currently open, blocking retry attempts.`,
          action:
            "Investigate root causes and consider manual resets if appropriate",
        });
      }

      // Error type specific recommendations
      const errorTypes = stats.errorTypeBreakdown;
      Object.entries(errorTypes).forEach(([errorType, count]) => {
        if (count > 10) {
          recommendations.push({
            type: "error_pattern",
            priority: "medium",
            title: `High ${errorType} Errors`,
            description: `${count} retry sessions initiated due to ${errorType} errors.`,
            action: this.getErrorTypeRecommendation(errorType),
          });
        }
      });

      res.json({
        success: true,
        data: {
          recommendations,
          count: recommendations.length,
          basedOnStats: {
            totalSessions: stats.totalSessions,
            successRate: stats.successRate,
            averageAttempts: stats.averageAttempts,
            openCircuitBreakers: openBreakers,
          },
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error("Get recommendations failed:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get recommendations",
        message: error.message,
      });
    }
  }
);

/**
 * Helper function for error type recommendations
 */
function getErrorTypeRecommendation(errorType) {
  const recommendations = {
    rate_limited: "Implement longer delays and reduce concurrent operations",
    network_timeout: "Check network connectivity and increase timeout values",
    captcha_required:
      "Consider implementing CAPTCHA solving or reducing automation frequency",
    element_not_found: "Update selectors and improve element waiting logic",
    browser_crash: "Monitor system resources and improve browser stability",
  };

  return (
    recommendations[errorType] ||
    "Investigate root cause and adjust retry strategy"
  );
}

/**
 * GET /api/retry/health
 * Get retry system health status
 */
router.get("/health", requireRetryManager, (req, res) => {
  try {
    const stats = retryManager.getRetryStats();

    // Calculate health score based on various metrics
    let healthScore = 100;
    let issues = [];

    // Reduce score for low success rate
    if (stats.successRate < 50) {
      healthScore -= 30;
      issues.push("Very low retry success rate");
    } else if (stats.successRate < 70) {
      healthScore -= 15;
      issues.push("Low retry success rate");
    }

    // Reduce score for high average attempts
    if (stats.averageAttempts > 4) {
      healthScore -= 20;
      issues.push("High average retry attempts");
    } else if (stats.averageAttempts > 3) {
      healthScore -= 10;
      issues.push("Elevated retry attempts");
    }

    // Reduce score for open circuit breakers
    const openBreakers = Object.values(stats.circuitBreakerStatus).filter(
      (b) => b.state === "open"
    ).length;
    if (openBreakers > 0) {
      healthScore -= openBreakers * 10;
      issues.push(`${openBreakers} circuit breakers open`);
    }

    // Determine health status
    let status = "healthy";
    if (healthScore < 50) {
      status = "critical";
    } else if (healthScore < 70) {
      status = "degraded";
    } else if (healthScore < 90) {
      status = "warning";
    }

    res.json({
      success: true,
      data: {
        status,
        healthScore: Math.max(healthScore, 0),
        issues,
        metrics: {
          totalSessions: stats.totalSessions,
          successRate: stats.successRate,
          averageAttempts: stats.averageAttempts,
          pendingSessions: stats.pendingSessions,
          openCircuitBreakers: openBreakers,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Get retry health failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get retry system health",
      message: error.message,
    });
  }
});

export default router;
