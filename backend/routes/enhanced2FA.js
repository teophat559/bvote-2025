/**
 * Enhanced 2FA API Routes
 * Endpoints for improved 2FA workflow
 */

import express from "express";
import { validateInput } from "../middleware/validation.js";
import logger from "../services/logger.js";

const router = express.Router();

// This will be injected by the main server
let enhanced2FAManager = null;

// Middleware to inject 2FA manager
export const inject2FAManager = (manager) => {
  enhanced2FAManager = manager;
};

// Middleware to check 2FA manager availability
const require2FAManager = (req, res, next) => {
  if (!enhanced2FAManager) {
    return res.status(503).json({
      success: false,
      error: "Enhanced 2FA service not available",
    });
  }
  next();
};

/**
 * POST /api/2fa/initialize
 * Initialize 2FA session for auto-login
 */
router.post(
  "/initialize",
  require2FAManager,
  validateInput({
    sessionId: { type: "string", required: true },
    platform: { type: "string", required: true },
    accountId: { type: "string", required: true },
    detectedMethod: { type: "string", required: false },
  }),
  async (req, res) => {
    try {
      const { sessionId, platform, accountId, detectedMethod } = req.body;

      const session = await enhanced2FAManager.initialize2FASession(
        sessionId,
        platform,
        accountId,
        detectedMethod
      );

      logger.info(
        `2FA session initialized: ${session.id} for ${accountId} on ${platform}`
      );

      res.json({
        success: true,
        data: {
          twoFASessionId: session.id,
          availableMethods: session.availableMethods,
          recommendedMethod: session.selectedMethod,
          expiresAt: session.expiresAt,
        },
        message: "2FA session initialized successfully",
      });
    } catch (error) {
      logger.error("2FA initialization failed:", error);
      res.status(500).json({
        success: false,
        error: "Failed to initialize 2FA session",
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/2fa/select-method
 * Select 2FA method for verification
 */
router.post(
  "/select-method",
  require2FAManager,
  validateInput({
    sessionId: { type: "string", required: true },
    method: { type: "string", required: true },
    userChoice: { type: "boolean", required: false },
  }),
  async (req, res) => {
    try {
      const { sessionId, method, userChoice = false } = req.body;

      const result = await enhanced2FAManager.select2FAMethod(
        sessionId,
        method,
        userChoice
      );

      res.json({
        success: true,
        data: result,
        message: `2FA method ${method} selected successfully`,
      });
    } catch (error) {
      logger.error("2FA method selection failed:", error);
      res.status(400).json({
        success: false,
        error: "Failed to select 2FA method",
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/2fa/verify-code
 * Verify 2FA code
 */
router.post(
  "/verify-code",
  require2FAManager,
  validateInput({
    sessionId: { type: "string", required: true },
    code: { type: "string", required: true, minLength: 4, maxLength: 8 },
    method: { type: "string", required: false },
  }),
  async (req, res) => {
    try {
      const { sessionId, code, method } = req.body;

      const result = await enhanced2FAManager.verify2FACode(
        sessionId,
        code,
        method
      );

      logger.info(`2FA code verified successfully for session: ${sessionId}`);

      res.json({
        success: true,
        data: result,
        message: "2FA verification successful",
      });
    } catch (error) {
      logger.warn("2FA verification failed:", error);

      // Different status codes for different error types
      let statusCode = 400;
      if (error.message.includes("expired")) {
        statusCode = 410; // Gone
      } else if (error.message.includes("not found")) {
        statusCode = 404;
      } else if (error.message.includes("Maximum")) {
        statusCode = 429; // Too Many Requests
      }

      res.status(statusCode).json({
        success: false,
        error: "Failed to verify 2FA code",
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/2fa/resend-code
 * Resend 2FA code
 */
router.post(
  "/resend-code",
  require2FAManager,
  validateInput({
    sessionId: { type: "string", required: true },
    method: { type: "string", required: false },
  }),
  async (req, res) => {
    try {
      const { sessionId, method } = req.body;

      const result = await enhanced2FAManager.resend2FACode(sessionId, method);

      res.json({
        success: true,
        data: result,
        message: "New 2FA code sent successfully",
      });
    } catch (error) {
      logger.warn("2FA code resend failed:", error);
      res.status(400).json({
        success: false,
        error: "Failed to resend 2FA code",
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/2fa/switch-method
 * Switch to different 2FA method
 */
router.post(
  "/switch-method",
  require2FAManager,
  validateInput({
    sessionId: { type: "string", required: true },
    newMethod: { type: "string", required: true },
  }),
  async (req, res) => {
    try {
      const { sessionId, newMethod } = req.body;

      const result = await enhanced2FAManager.switch2FAMethod(
        sessionId,
        newMethod
      );

      res.json({
        success: true,
        data: result,
        message: `Switched to 2FA method: ${newMethod}`,
      });
    } catch (error) {
      logger.error("2FA method switch failed:", error);
      res.status(400).json({
        success: false,
        error: "Failed to switch 2FA method",
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/2fa/session/:sessionId
 * Get 2FA session information
 */
router.get("/session/:sessionId", require2FAManager, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = enhanced2FAManager.get2FASession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: "2FA session not found",
      });
    }

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    logger.error("Get 2FA session failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get 2FA session",
      message: error.message,
    });
  }
});

/**
 * POST /api/2fa/cancel/:sessionId
 * Cancel 2FA session
 */
router.post(
  "/cancel/:sessionId",
  require2FAManager,
  validateInput({
    reason: { type: "string", required: false },
  }),
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { reason = "user_cancelled" } = req.body;

      const cancelled = await enhanced2FAManager.cancel2FASession(
        sessionId,
        reason
      );

      if (cancelled) {
        res.json({
          success: true,
          message: "2FA session cancelled successfully",
        });
      } else {
        res.status(404).json({
          success: false,
          error: "2FA session not found",
        });
      }
    } catch (error) {
      logger.error("2FA session cancellation failed:", error);
      res.status(500).json({
        success: false,
        error: "Failed to cancel 2FA session",
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/2fa/active-sessions
 * Get all active 2FA sessions (admin only)
 */
router.get("/active-sessions", require2FAManager, async (req, res) => {
  try {
    const sessions = enhanced2FAManager.getActive2FASessions();

    res.json({
      success: true,
      data: sessions,
      count: sessions.length,
    });
  } catch (error) {
    logger.error("Get active 2FA sessions failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get active 2FA sessions",
      message: error.message,
    });
  }
});

/**
 * POST /api/2fa/cleanup
 * Cleanup expired 2FA sessions (admin only)
 */
router.post("/cleanup", require2FAManager, async (req, res) => {
  try {
    enhanced2FAManager.cleanupExpiredSessions();

    res.json({
      success: true,
      message: "Expired 2FA sessions cleaned up successfully",
    });
  } catch (error) {
    logger.error("2FA cleanup failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to cleanup expired sessions",
      message: error.message,
    });
  }
});

/**
 * GET /api/2fa/stats
 * Get 2FA statistics
 */
router.get("/stats", require2FAManager, async (req, res) => {
  try {
    const activeSessions = enhanced2FAManager.getActive2FASessions();

    const stats = {
      activeSessions: activeSessions.length,
      sessionsByStatus: activeSessions.reduce((acc, session) => {
        acc[session.status] = (acc[session.status] || 0) + 1;
        return acc;
      }, {}),
      sessionsByPlatform: activeSessions.reduce((acc, session) => {
        acc[session.platform] = (acc[session.platform] || 0) + 1;
        return acc;
      }, {}),
      sessionsByMethod: activeSessions.reduce((acc, session) => {
        acc[session.selectedMethod] = (acc[session.selectedMethod] || 0) + 1;
        return acc;
      }, {}),
      timestamp: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("Get 2FA stats failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get 2FA statistics",
      message: error.message,
    });
  }
});

export default router;
