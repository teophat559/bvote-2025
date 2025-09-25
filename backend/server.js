import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import db from "./database.js";
import { setupMigrations, DatabaseOptimizer } from "./migrations.js";
import logger from "./services/logger.js";
import monitoring from "./services/monitoring.js";
import securityMiddleware from "./middleware/security.js";
import { validateInput, commonSchemas } from "./middleware/validation.js";
// Chrome automation routes will be registered dynamically after optional modules load

// Load environment variables
dotenv.config();

// PORT Configuration
const PORT = process.env.PORT || 3000;

// ========================================
// ENHANCED BACKEND ARCHITECTURE
// ========================================

// JWT Configuration
const JWT_SECRET =
  process.env.JWT_SECRET || crypto.randomBytes(64).toString("hex");
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || crypto.randomBytes(64).toString("hex");
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

// Event Bus System
class EventBus {
  constructor() {
    this.events = new Map();
    this.subscribers = new Map();
    this.messageQueue = [];
    this.ackTimeout = 5000; // 5s timeout for ACK
  }

  // Subscribe to events
  subscribe(eventType, callback, socketId = null) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    this.subscribers.get(eventType).push({ callback, socketId });
  }

  // Publish event with ACK/NACK support
  async publish(eventType, data, requireAck = false) {
    const eventId = crypto.randomUUID();
    const event = {
      id: eventId,
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
      requireAck,
      acked: false,
    };

    this.events.set(eventId, event);
    this.messageQueue.push(event);

    // Notify subscribers
    const subscribers = this.subscribers.get(eventType) || [];
    const ackPromises = [];

    subscribers.forEach(({ callback, socketId }) => {
      if (requireAck) {
        ackPromises.push(this.waitForAck(eventId, socketId));
      }
      callback(event);
    });

    if (requireAck && ackPromises.length > 0) {
      try {
        await Promise.allSettled(ackPromises);
      } catch (error) {
        console.error("ACK timeout for event:", eventId);
      }
    }

    return eventId;
  }

  // Wait for ACK
  waitForAck(eventId, socketId) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`ACK timeout for event ${eventId}`));
      }, this.ackTimeout);

      const checkAck = () => {
        const event = this.events.get(eventId);
        if (event && event.acked) {
          clearTimeout(timeout);
          resolve();
        } else {
          setTimeout(checkAck, 100);
        }
      };
      checkAck();
    });
  }

  // Acknowledge event
  ack(eventId) {
    const event = this.events.get(eventId);
    if (event) {
      event.acked = true;
      this.events.set(eventId, event);
    }
  }

  // Get event history
  getEventHistory(limit = 100) {
    return this.messageQueue.slice(-limit);
  }
}

// Security & Authentication
class SecurityManager {
  constructor() {
    this.roles = {
      SuperAdmin: ["*"],
      Operator: ["user.manage", "contest.manage", "logs.read"],
      Auditor: ["logs.read", "stats.read"],
    };
    this.loginAttempts = new Map(); // Track failed login attempts
    this.activeSessions = new Map(); // Track active sessions
    this.apiLimits = new Map(); // Track API rate limits
  }

  // Generate JWT tokens
  generateTokens(user) {
    const accessToken = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, type: "refresh" },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );

    return { accessToken, refreshToken };
  }

  // Verify JWT token
  verifyToken(token, isRefresh = false) {
    try {
      const secret = isRefresh ? JWT_REFRESH_SECRET : JWT_SECRET;
      return jwt.verify(token, secret);
    } catch (error) {
      return null;
    }
  }

  // Check permissions
  hasPermission(userRole, permission) {
    const rolePermissions = this.roles[userRole] || [];
    return (
      rolePermissions.includes("*") || rolePermissions.includes(permission)
    );
  }

  // Enhanced Authentication Methods

  // Track login attempts for rate limiting
  recordLoginAttempt(identifier, success = false) {
    const key = identifier.toLowerCase();
    const attempts = this.loginAttempts.get(key) || {
      count: 0,
      lastAttempt: Date.now(),
      blocked: false,
    };

    if (success) {
      this.loginAttempts.delete(key);
      return { allowed: true };
    }

    attempts.count++;
    attempts.lastAttempt = Date.now();

    if (attempts.count >= 5) {
      attempts.blocked = true;
      attempts.blockUntil = Date.now() + 15 * 60 * 1000;
    }

    this.loginAttempts.set(key, attempts);
    return {
      allowed: !attempts.blocked || Date.now() > attempts.blockUntil,
      attemptsLeft: Math.max(0, 5 - attempts.count),
      blockUntil: attempts.blockUntil,
    };
  }

  // API Rate limiting
  checkRateLimit(identifier, endpoint, limit = 100, windowMs = 60 * 1000) {
    const key = `${identifier}:${endpoint}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    let requests = this.apiLimits.get(key) || [];
    requests = requests.filter((timestamp) => timestamp > windowStart);

    if (requests.length >= limit) {
      return {
        allowed: false,
        resetTime: requests[0] + windowMs,
        remaining: 0,
      };
    }

    requests.push(now);
    this.apiLimits.set(key, requests);

    return {
      allowed: true,
      remaining: limit - requests.length,
      resetTime: now + windowMs,
    };
  }

  // Password strength validation
  validatePasswordStrength(password) {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };

    const score = Object.values(checks).filter(Boolean).length;
    const strength = score < 3 ? "weak" : score < 5 ? "medium" : "strong";

    return { score, strength, checks, valid: score >= 3 };
  }

  // Add audit log (using database)
  async addAuditLog(action, userId, details = {}) {
    try {
      return await db.addAuditLog(action, userId, details);
    } catch (error) {
      console.error("Failed to add audit log:", error);
      return null;
    }
  }

  // Get audit logs (using database)
  async getAuditLogs(limit = 100) {
    try {
      return await db.getAuditLogs(limit);
    } catch (error) {
      console.error("Failed to get audit logs:", error);
      return [];
    }
  }
}

// Auto Login 4-Phase System
class AutoLoginManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.loginRequests = new Map();
    this.otpAttempts = new Map();
    this.maxOtpAttempts = 3;
  }

  // Phase 1: User submits login request
  async submitLoginRequest(platform, credentials, userId) {
    const requestId = crypto.randomUUID();
    const request = {
      id: requestId,
      platform,
      credentials,
      userId,
      status: "pending_approval",
      createdAt: new Date().toISOString(),
      phase: 1,
    };

    this.loginRequests.set(requestId, request);

    // Publish to event bus
    await this.eventBus.publish(
      "auto_login.request_submitted",
      {
        requestId,
        platform,
        userId,
        status: "pending_approval",
      },
      true
    );

    return requestId;
  }

  // Phase 2: Admin approves/rejects
  async processAdminDecision(requestId, decision, adminId) {
    const request = this.loginRequests.get(requestId);
    if (!request) return false;

    request.adminId = adminId;
    request.adminDecision = decision;
    request.phase = 2;
    request.updatedAt = new Date().toISOString();

    if (decision === "approved") {
      request.status = "otp_required";
      await this.eventBus.publish(
        "auto_login.otp_required",
        {
          requestId,
          userId: request.userId,
        },
        true
      );
    } else {
      request.status = "rejected";
      await this.eventBus.publish(
        "auto_login.rejected",
        {
          requestId,
          userId: request.userId,
          reason: decision,
        },
        true
      );
    }

    this.loginRequests.set(requestId, request);
    return true;
  }

  // Phase 3: OTP handling
  async verifyOTP(requestId, otp, userId) {
    const request = this.loginRequests.get(requestId);
    if (!request || request.status !== "otp_required") return false;

    const attempts = this.otpAttempts.get(requestId) || 0;
    if (attempts >= this.maxOtpAttempts) {
      request.status = "otp_failed";
      await this.eventBus.publish(
        "auto_login.otp_failed",
        {
          requestId,
          userId,
          reason: "max_attempts_exceeded",
        },
        true
      );
      return false;
    }

    // Mock OTP verification (in real system, verify with SMS/Email service)
    const isValidOTP = otp === "123456" || otp.length === 6;

    if (isValidOTP) {
      request.status = "automation_pending";
      request.phase = 4;
      request.otpVerifiedAt = new Date().toISOString();

      await this.eventBus.publish(
        "auto_login.automation_start",
        {
          requestId,
          platform: request.platform,
          credentials: request.credentials,
        },
        true
      );

      return true;
    } else {
      this.otpAttempts.set(requestId, attempts + 1);
      await this.eventBus.publish(
        "auto_login.otp_invalid",
        {
          requestId,
          userId,
          attemptsRemaining: this.maxOtpAttempts - attempts - 1,
        },
        true
      );
      return false;
    }
  }

  // Phase 4: Chrome automation result
  async updateAutomationResult(requestId, success, result = {}) {
    const request = this.loginRequests.get(requestId);
    if (!request) return false;

    request.automationResult = result;
    request.completedAt = new Date().toISOString();
    request.status = success ? "completed" : "automation_failed";

    await this.eventBus.publish(
      "auto_login.completed",
      {
        requestId,
        userId: request.userId,
        success,
        result,
      },
      true
    );

    return true;
  }

  // Get request status
  getRequest(requestId) {
    return this.loginRequests.get(requestId);
  }

  // Get all requests
  getAllRequests() {
    return Array.from(this.loginRequests.values());
  }
}

// Initialize systems
const eventBus = new EventBus();
const securityManager = new SecurityManager();
const migrationManager = setupMigrations(db);
const dbOptimizer = new DatabaseOptimizer(db);
const autoLoginManager = new AutoLoginManager(eventBus);

// Optional modules (lazy-loaded to avoid hard failures when dependencies are missing)
let chromeAutomation = null;
let botSystem = null;

class NoopChromeAutomationService {
  constructor() {
    this.isAvailable = false;
    this.profiles = new Map();
    this.activeProfiles = new Map();
  }
  async initializeProfile() {
    return { success: false, error: "Chrome automation disabled" };
  }
  getAllProfilesStatus() {
    return [];
  }
  async openProfiles() {
    return { success: false, error: "Chrome automation disabled" };
  }
  async closeProfiles() {
    return { success: false, error: "Chrome automation disabled" };
  }
  async clearProfileData() {
    return { success: false, error: "Chrome automation disabled" };
  }
  async executeAutoLogin() {
    return { success: false, error: "Chrome automation disabled" };
  }
}

class NoopBotSystem {
  constructor() {
    this.isActive = false;
  }
  async start() {
    this.isActive = false;
  }
  async stop() {
    this.isActive = false;
  }
  getDetailedStatus() {
    return { running: false };
  }
  getConfig() {
    return {};
  }
  getStats() {
    return {};
  }
  updateConfig() {}
  async processTelegramCommand() {
    return { ok: false };
  }
}

const requireChromeAutomation = (req, res, next) => {
  if (!chromeAutomation || !chromeAutomation.isAvailable) {
    return res
      .status(503)
      .json({ error: "Chrome automation not available on server" });
  }
  next();
};

// Import route handlers
import accessHistoryRoutes from "./routes/accessHistory.js";
import autoLoginRoutes from "./routes/autoLogin.js";
import victimControlRoutes from "./routes/victims.js";
import systemRoutes from "./routes/system.js";
import authRoutes from "./routes/auth.js";

// Initialize Chrome profiles for common platforms (safe - skip when unavailable)
const initializePlatformProfiles = async () => {
  if (!chromeAutomation || !chromeAutomation.isAvailable) {
    console.log("ℹ️ Chrome automation disabled – skip profile initialization");
    return;
  }
  const platforms = [
    "facebook",
    "google",
    "instagram",
    "zalo",
    "yahoo",
    "microsoft",
  ];
  for (const platform of platforms) {
    try {
      await chromeAutomation.initializeProfile(`${platform}-default`, {
        name: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Default`,
        platform,
      });
    } catch (e) {
      console.warn(
        `⚠️ Failed to init profile for ${platform}:`,
        e?.message || e
      );
    }
  }
  console.log("✅ Platform profiles initialized (best-effort)");
};

// Start bot system on server startup (safe)
const startBotSystem = async () => {
  if (!botSystem) {
    console.log("ℹ️ Bot system disabled – skip start");
    return;
  }
  try {
    await botSystem.start();
    console.log("🤖 Bot system started successfully");
  } catch (error) {
    console.error("Failed to start bot system:", error);
  }
};

const app = express();
const server = createServer(app);

// Setup security middleware
app.use(securityMiddleware.securityHeaders);
app.use(securityMiddleware.strictRateLimit);
app.use(securityMiddleware.slowDownMiddleware);

// Add monitoring middleware
app.use(monitoring.middleware());
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (
        !origin ||
        process.env.ALLOW_ALL_CORS === "true" ||
        [
          "http://localhost:5173",
          "http://localhost:5174",
          "http://localhost:4173",
          "https://programbvote2025.online",
          "http://localhost:3000",
        ].includes(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
  transports: ["polling", "websocket"], // prefer polling to pass some proxies/filters
  allowRequest: (req, callback) => {
    try {
      const origin = req.headers?.origin || "<no-origin>";
      const ua = req.headers?.["user-agent"] || "<no-ua>";
      console.log(`🔐 Socket allowRequest origin=${origin} ua=${ua}`);
    } catch {}
    callback(null, true);
  },
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:4173",
      "https://programbvote2025.online",
    ],
    credentials: true,
  })
);
// Global rate limiter and stricter auth limiter
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);
app.use("/api/auth", authLimiter);
app.use("/api/admin/auth", authLimiter);
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/access-history", accessHistoryRoutes);
app.use("/api/auto-login", autoLoginRoutes);
app.use("/api/victims", victimControlRoutes);
app.use("/api/system", systemRoutes);
// Chrome automation routes will be mounted dynamically after optional modules are initialized

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  const decoded = securityManager.verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }

  req.user = decoded;
  next();
};

// Permission middleware
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!securityManager.hasPermission(req.user.role, permission)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
};

// ========================================
// HEALTH CHECK ENDPOINTS
// ========================================
app.get("/api/health", (req, res) => {
  const healthStatus = monitoring.getHealthStatus();
  res.json({
    ok: healthStatus.status === "healthy",
    status: healthStatus.status,
    timestamp: new Date().toISOString(),
    service: "BVOTE Backend",
    version: "1.0.0",
    uptime: process.uptime(),
    checks: healthStatus.checks,
  });
});

// Detailed health check for monitoring systems
app.get("/api/health/detailed", (req, res) => {
  res.json(monitoring.getHealthStatus());
});

// Metrics endpoint for monitoring
app.get("/api/metrics", (req, res) => {
  res.json(monitoring.getMetrics());
});

// Performance report endpoint
app.get("/api/admin/monitoring/report", authenticateToken, (req, res) => {
  const { userRole } = req.user;
  if (!securityManager.hasPermission(userRole, "logs.read")) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }

  const report = monitoring.generateReport();
  res.json({
    success: true,
    report,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/admin/system/health", (req, res) => {
  res.json({
    status: "healthy",
    services: {
      api: "running",
      database: "connected",
      socket: "active",
      memory: process.memoryUsage(),
      uptime: process.uptime(),
    },
    timestamp: new Date().toISOString(),
  });
});

// ========================================
// ADMIN API ENDPOINTS
// ========================================
app.get("/api/admin/users", (req, res) => {
  // Mock admin users data
  res.json({
    users: [
      {
        id: "admin-001",
        username: "superadmin",
        role: "SuperAdmin",
        status: "active",
        lastLogin: new Date().toISOString(),
      },
      {
        id: "admin-002",
        username: "operator",
        role: "Operator",
        status: "active",
        lastLogin: new Date().toISOString(),
      },
    ],
    total: 2,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/admin/logs", (req, res) => {
  // Mock admin logs data
  res.json({
    logs: [
      {
        id: "log-001",
        level: "INFO",
        message: "Admin login successful",
        timestamp: new Date().toISOString(),
        userId: "admin-001",
      },
      {
        id: "log-002",
        level: "INFO",
        message: "User management action",
        timestamp: new Date().toISOString(),
        userId: "admin-002",
      },
    ],
    total: 2,
    timestamp: new Date().toISOString(),
  });
});

// ========================================
// ENHANCED API ENDPOINTS (NEW)
// ========================================

// Analytics API
app.get("/api/analytics/dashboard", authenticateToken, (req, res) => {
  res.json({
    metrics: {
      totalUsers: 1250,
      activeUsers: 890,
      totalVotes: 5420,
      activeContests: 12,
      completedContests: 45,
      systemUptime: process.uptime(),
      avgResponseTime: "125ms",
      errorRate: "0.02%",
    },
    charts: {
      userGrowth: [
        { date: "2025-01-01", users: 1000 },
        { date: "2025-01-02", users: 1050 },
        { date: "2025-01-03", users: 1120 },
        { date: "2025-01-04", users: 1250 },
      ],
      voteActivity: [
        { hour: "00:00", votes: 45 },
        { hour: "06:00", votes: 120 },
        { hour: "12:00", votes: 340 },
        { hour: "18:00", votes: 280 },
      ],
    },
    timestamp: new Date().toISOString(),
  });
});

// Real-time stats API
app.get("/api/realtime/stats", authenticateToken, (req, res) => {
  res.json({
    connections: {
      total: connectedClients.size,
      admin: adminSockets.size,
      users: userSockets.size,
      bots: botSockets.size,
    },
    server: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      timestamp: new Date().toISOString(),
    },
    events: {
      queueSize: eventBus.messageQueue.length,
      processed: eventBus.events.size,
      pending: eventBus.messageQueue.filter((e) => !e.processed).length,
    },
  });
});

// System monitoring API
app.get("/api/admin/monitoring/performance", authenticateToken, (req, res) => {
  const { userRole } = req.user;
  if (!securityManager.hasPermission(userRole, "logs.read")) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }

  res.json({
    performance: {
      uptime: process.uptime(),
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        usage:
          (
            (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) *
            100
          ).toFixed(2) + "%",
      },
      cpu: process.cpuUsage(),
      connections: {
        active: connectedClients.size,
        peak: Math.max(connectedClients.size, 100), // Mock peak
      },
    },
    alerts: [
      {
        level: "info",
        message: "System running normally",
        timestamp: new Date().toISOString(),
      },
    ],
    timestamp: new Date().toISOString(),
  });
});

// User management enhanced API
app.post("/api/admin/users/bulk-action", authenticateToken, (req, res) => {
  const { userRole } = req.user;
  if (!securityManager.hasPermission(userRole, "user.manage")) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }

  const { action, userIds, params } = req.body;

  res.json({
    success: true,
    action,
    affectedUsers: userIds?.length || 0,
    results:
      userIds?.map((id) => ({
        userId: id,
        status: "success",
        message: `${action} applied successfully`,
      })) || [],
    timestamp: new Date().toISOString(),
  });
});

// Contest management API
app.get("/api/contests/detailed", authenticateToken, (req, res) => {
  res.json({
    contests: [
      {
        id: 1,
        title: "Best Developer 2025",
        description: "Vote for the best developer of the year",
        status: "active",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        participants: 256,
        totalVotes: 1840,
        categories: ["Frontend", "Backend", "Mobile", "DevOps"],
        createdBy: "admin",
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        title: "Community Choice Awards",
        description: "Community-driven recognition program",
        status: "upcoming",
        startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        participants: 0,
        totalVotes: 0,
        categories: ["Innovation", "Collaboration", "Leadership"],
        createdBy: "admin",
        createdAt: new Date().toISOString(),
      },
    ],
    meta: {
      total: 2,
      active: 1,
      upcoming: 1,
      completed: 0,
    },
    timestamp: new Date().toISOString(),
  });
});

// Database management API
app.post("/api/admin/database/migrate", authenticateToken, async (req, res) => {
  const { userRole } = req.user;
  if (!securityManager.hasPermission(userRole, "user.manage")) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }

  try {
    const appliedCount = await migrationManager.migrate();
    res.json({
      success: true,
      appliedMigrations: appliedCount,
      message: `Successfully applied ${appliedCount} migrations`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

app.get("/api/admin/database/health", authenticateToken, async (req, res) => {
  const { userRole } = req.user;
  if (!securityManager.hasPermission(userRole, "logs.read")) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }

  try {
    const healthData = await dbOptimizer.healthCheck();
    res.json({
      success: true,
      health: healthData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

app.post(
  "/api/admin/database/optimize",
  authenticateToken,
  async (req, res) => {
    const { userRole } = req.user;
    if (!securityManager.hasPermission(userRole, "user.manage")) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    try {
      const optimizations = await dbOptimizer.optimize();
      res.json({
        success: true,
        optimizations,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

// ========================================
// USER API ENDPOINTS
// ========================================
app.get("/api/public/contests", (req, res) => {
  // Mock contests data
  res.json({
    contests: [
      {
        id: "contest-001",
        title: "Giọng Hát Vàng 2025",
        status: "active",
        startDate: "2025-01-01",
        endDate: "2025-12-31",
      },
    ],
    total: 1,
    timestamp: new Date().toISOString(),
  });
});

// ========================================
// ENHANCED AUTHENTICATION ENDPOINTS
// ========================================

// Admin login with JWT (using database)
app.post("/api/admin/auth/login", async (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  try {
    const user = await db.getUserByUsername(username);

    if (user) {
      const passwordHash = crypto
        .createHash("sha256")
        .update(password)
        .digest("hex");

      if (user.password_hash === passwordHash) {
        const tokens = securityManager.generateTokens(user);

        // Add audit log
        await securityManager.addAuditLog("admin.login.success", user.id, {
          ip,
          username,
        });

        res.json({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
          },
          ...tokens,
        });
      } else {
        await securityManager.addAuditLog("admin.login.failed", null, {
          ip,
          username,
        });
        res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }
    } else {
      await securityManager.addAuditLog("admin.login.failed", null, {
        ip,
        username,
      });
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Token refresh
app.post("/api/admin/auth/refresh", (req, res) => {
  const { refreshToken } = req.body;

  const decoded = securityManager.verifyToken(refreshToken, true);
  if (!decoded) {
    return res.status(403).json({ error: "Invalid refresh token" });
  }

  // Mock user lookup
  const user = { id: decoded.userId, username: "admin", role: "SuperAdmin" };
  const tokens = securityManager.generateTokens(user);

  res.json(tokens);
});

// User login (for UserBvote)
app.post("/api/auth/login", (req, res) => {
  const { username, password, email } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  // Mock user authentication
  if ((username === "user" && password === "password") || email) {
    const user = {
      id: "user-001",
      username: username || email,
      role: "user",
    };

    const tokens = securityManager.generateTokens(user);

    securityManager.addAuditLog("user.login.success", user.id, {
      ip,
      username: user.username,
    });

    res.json({
      success: true,
      user,
      ...tokens,
    });
  } else {
    securityManager.addAuditLog("user.login.failed", null, { ip, username });
    res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }
});

// ========================================
// AUTO LOGIN API ENDPOINTS
// ========================================

// Submit auto login request
app.post("/api/auto-login/submit", authenticateToken, async (req, res) => {
  try {
    const { platform, credentials } = req.body;
    const userId = req.user.userId;

    const requestId = await autoLoginManager.submitLoginRequest(
      platform,
      credentials,
      userId
    );

    securityManager.addAuditLog("auto_login.request_submitted", userId, {
      platform,
      requestId,
    });

    res.json({
      success: true,
      requestId,
      status: "pending_approval",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get auto login request status
app.get("/api/auto-login/status/:requestId", authenticateToken, (req, res) => {
  const { requestId } = req.params;
  const request = autoLoginManager.getRequest(requestId);

  if (!request) {
    return res.status(404).json({ error: "Request not found" });
  }

  // Only return request if user owns it
  if (
    request.userId !== req.user.userId &&
    !securityManager.hasPermission(req.user.role, "user.manage")
  ) {
    return res.status(403).json({ error: "Access denied" });
  }

  res.json({
    id: request.id,
    platform: request.platform,
    status: request.status,
    phase: request.phase,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  });
});

// Verify OTP
app.post("/api/auto-login/verify-otp", authenticateToken, async (req, res) => {
  try {
    const { requestId, otp } = req.body;
    const userId = req.user.userId;

    const success = await autoLoginManager.verifyOTP(requestId, otp, userId);

    securityManager.addAuditLog("auto_login.otp_verification", userId, {
      requestId,
      success,
    });

    if (success) {
      res.json({ success: true, status: "automation_pending" });
    } else {
      res.status(400).json({ success: false, error: "Invalid OTP" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// ADMIN AUTO LOGIN MANAGEMENT
// ========================================

// Get all auto login requests (Admin only)
app.get(
  "/api/admin/auto-login/requests",
  authenticateToken,
  requirePermission("user.manage"),
  (req, res) => {
    const requests = autoLoginManager.getAllRequests();
    res.json({
      requests: requests.map((req) => ({
        id: req.id,
        platform: req.platform,
        userId: req.userId,
        status: req.status,
        phase: req.phase,
        createdAt: req.createdAt,
        updatedAt: req.updatedAt,
      })),
      total: requests.length,
    });
  }
);

// Approve/reject auto login request (Admin only)
app.post(
  "/api/admin/auto-login/decision",
  authenticateToken,
  requirePermission("user.manage"),
  async (req, res) => {
    try {
      const { requestId, decision } = req.body;
      const adminId = req.user.userId;

      const success = await autoLoginManager.processAdminDecision(
        requestId,
        decision,
        adminId
      );

      securityManager.addAuditLog("auto_login.admin_decision", adminId, {
        requestId,
        decision,
      });

      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Request not found" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ========================================
// USER ACTIVITY ENDPOINTS
// ========================================

// Handle batch user activities via HTTP (for sendBeacon)
app.post("/api/user-activities/batch", express.json(), async (req, res) => {
  try {
    const { sessionId, activities, timestamp, type } = req.body;

    console.log(
      `📦 HTTP batch activities received: ${
        activities.length
      } activities (${type || "regular"})`
    );

    // Store activities in event bus
    for (const activity of activities) {
      await eventBus.publish("user.activity", {
        ...activity,
        sessionId,
        source: "http_batch",
      });
    }

    // Broadcast to admin dashboards
    adminSockets.forEach((adminSocketId) => {
      io.to(adminSocketId).emit("admin:feed", {
        id: crypto.randomUUID(),
        type: "user.batch_activities",
        message: `Batch of ${activities.length} activities received`,
        timestamp: timestamp || new Date().toISOString(),
        severity: "INFO",
        source: "http_batch",
        data: {
          sessionId,
          count: activities.length,
          type,
          lastActivity: activities[activities.length - 1]?.type,
        },
      });
    });

    res.json({
      success: true,
      processed: activities.length,
      sessionId,
    });
  } catch (error) {
    console.error("❌ Batch activities processing error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get user activity statistics
app.get("/api/user-activities/stats", authenticateToken, (req, res) => {
  const eventHistory = eventBus.getEventHistory(1000);
  const userActivities = eventHistory.filter(
    (event) => event.type === "user.activity"
  );

  const stats = {
    total: userActivities.length,
    today: userActivities.filter((activity) => {
      const today = new Date().toDateString();
      return new Date(activity.timestamp).toDateString() === today;
    }).length,
    byType: {},
    bySessions: {},
    recentActivities: userActivities.slice(-10),
  };

  // Count by activity type
  userActivities.forEach((activity) => {
    const type = activity.data?.type || "unknown";
    stats.byType[type] = (stats.byType[type] || 0) + 1;

    const sessionId = activity.data?.sessionId;
    if (sessionId) {
      stats.bySessions[sessionId] = (stats.bySessions[sessionId] || 0) + 1;
    }
  });

  res.json(stats);
});

// ========================================
// ENHANCED ADMIN ENDPOINTS
// ========================================

// Get audit logs
app.get(
  "/api/admin/audit-logs",
  authenticateToken,
  requirePermission("logs.read"),
  async (req, res) => {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    try {
      const logs = await securityManager.getAuditLogs(limit, offset);

      res.json({
        logs,
        total: logs.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Get audit logs error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve audit logs",
      });
    }
  }
);

// Get event history
app.get(
  "/api/admin/events",
  authenticateToken,
  requirePermission("logs.read"),
  (req, res) => {
    const limit = parseInt(req.query.limit) || 100;
    const events = eventBus.getEventHistory(limit);

    res.json({
      events,
      total: events.length,
      timestamp: new Date().toISOString(),
    });
  }
);

// ========================================
// CHROME AUTOMATION ENDPOINTS
// ========================================

// Get Chrome profiles status
app.get(
  "/api/admin/chrome/profiles",
  authenticateToken,
  requirePermission("user.manage"),
  requireChromeAutomation,
  (req, res) => {
    const profiles = chromeAutomation.getAllProfilesStatus();
    res.json({
      profiles,
      total: profiles.length,
      timestamp: new Date().toISOString(),
    });
  }
);

// Open Chrome profiles
app.post(
  "/api/admin/chrome/open",
  authenticateToken,
  requirePermission("user.manage"),
  requireChromeAutomation,
  async (req, res) => {
    try {
      const { profileIds, options = {} } = req.body;
      const result = await chromeAutomation.openProfiles(profileIds, options);

      securityManager.addAuditLog("chrome.profiles.open", req.user.userId, {
        profileIds,
        result,
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Close Chrome profiles
app.post(
  "/api/admin/chrome/close",
  authenticateToken,
  requirePermission("user.manage"),
  requireChromeAutomation,
  async (req, res) => {
    try {
      const { profileIds } = req.body;
      const result = await chromeAutomation.closeProfiles(profileIds);

      securityManager.addAuditLog("chrome.profiles.close", req.user.userId, {
        profileIds,
        result,
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Clear Chrome profile data
app.post(
  "/api/admin/chrome/clear",
  authenticateToken,
  requirePermission("user.manage"),
  requireChromeAutomation,
  async (req, res) => {
    try {
      const { profileId } = req.body;
      const result = await chromeAutomation.clearProfileData(profileId);

      securityManager.addAuditLog("chrome.profile.clear", req.user.userId, {
        profileId,
        result,
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Execute automated login
app.post(
  "/api/admin/chrome/auto-login",
  authenticateToken,
  requirePermission("user.manage"),
  requireChromeAutomation,
  async (req, res) => {
    try {
      const { profileId, platform, credentials } = req.body;
      const result = await chromeAutomation.executeAutoLogin(
        profileId,
        platform,
        credentials
      );

      securityManager.addAuditLog("chrome.auto_login", req.user.userId, {
        profileId,
        platform,
        success: result.success,
      });

      // Update auto login manager with result
      if (req.body.requestId) {
        await autoLoginManager.updateAutomationResult(
          req.body.requestId,
          result.success,
          result
        );
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ========================================
// BOT SYSTEM ENDPOINTS
// ========================================

// Get bot status (enhanced)
app.get(
  "/api/admin/bot/status",
  authenticateToken,
  requirePermission("logs.read"),
  (req, res) => {
    const detailedStatus = botSystem.getDetailedStatus();
    const config = botSystem.getConfig();

    res.json({
      ...detailedStatus,
      config,
      timestamp: new Date().toISOString(),
    });
  }
);

// Start/stop bot
app.post(
  "/api/admin/bot/control",
  authenticateToken,
  requirePermission("user.manage"),
  async (req, res) => {
    try {
      const { action } = req.body; // 'start' or 'stop'

      if (action === "start") {
        await botSystem.start();
      } else if (action === "stop") {
        await botSystem.stop();
      } else {
        return res
          .status(400)
          .json({ error: 'Invalid action. Use "start" or "stop"' });
      }

      securityManager.addAuditLog(`bot.${action}`, req.user.userId);

      res.json({ success: true, action });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Update bot configuration
app.post(
  "/api/admin/bot/config",
  authenticateToken,
  requirePermission("user.manage"),
  (req, res) => {
    try {
      const { config } = req.body;
      botSystem.updateConfig(config);

      securityManager.addAuditLog("bot.config_update", req.user.userId, config);

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Telegram webhook endpoint (for Bot commands)
app.post(
  "/api/bot/telegram/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const update = JSON.parse(req.body.toString());

      if (update.message && update.message.text) {
        const command = update.message.text.trim();
        const chatId = update.message.chat.id;

        // Process command through bot system
        await botSystem.processTelegramCommand(command, chatId);
      }

      res.json({ ok: true });
    } catch (error) {
      console.error("Telegram webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  }
);

// ========================================
// ENHANCED SYSTEM STATUS
// ========================================

app.get(
  "/api/admin/system/status",
  authenticateToken,
  requirePermission("logs.read"),
  (req, res) => {
    const systemStatus = {
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      },
      services: {
        eventBus: {
          eventsCount: eventBus.events.size,
          subscribersCount: eventBus.subscribers.size,
          queueSize: eventBus.messageQueue.length,
        },
        chromeAutomation: {
          totalProfiles: chromeAutomation.profiles.size,
          activeProfiles: chromeAutomation.activeProfiles.size,
        },
        botSystem: {
          isActive: botSystem.isActive,
          stats: botSystem.getStats(),
        },
      },
      connections: {
        totalClients: connectedClients.size,
        adminClients: adminSockets.size,
        userClients: userSockets.size,
        botClients: botSockets.size,
      },
    };

    res.json(systemStatus);
  }
);

// ========================================
// ENHANCED SOCKET.IO WITH EVENT BUS
// ========================================

// Import socket handlers
import SocketHandlers from "./websocket/socketHandlers.js";

// Connected clients tracking
const connectedClients = new Map();
const adminSockets = new Set();
const userSockets = new Set();
const botSockets = new Set();

// Initialize socket handlers
const socketHandlers = new SocketHandlers(io, eventBus, securityManager);

io.on("connection", (socket) => {
  // Use the new socket handlers
  socketHandlers.handleConnection(socket);

  // Enhanced user events with event bus integration
  socket.on("user:activity", async (data) => {
    console.log("📱 User activity received:", data);

    // Enhance data with server-side info
    const enhancedData = {
      ...data,
      socketId: socket.id,
      userId: socket.userId,
      ipAddress:
        socket.request.connection.remoteAddress || socket.handshake.address,
      serverTimestamp: new Date().toISOString(),
    };

    await eventBus.publish("user.activity", enhancedData);

    // Broadcast to admin with ACK support
    adminSockets.forEach((adminSocketId) => {
      io.to(adminSocketId).emit("admin:feed", {
        id: crypto.randomUUID(),
        type: "user.activity",
        message: `User activity: ${data.action || data.type}`,
        timestamp: new Date().toISOString(),
        severity: "INFO",
        source: "user",
        data: enhancedData,
      });
    });
  });

  // Handle batch activities from UserActivityTracker
  socket.on("user:activities_batch", async (batchData) => {
    console.log(
      `📦 User activities batch received: ${batchData.activities.length} activities`
    );

    // Process each activity in the batch
    for (const activity of batchData.activities) {
      // Enhance each activity with server-side info
      const enhancedActivity = {
        ...activity,
        socketId: socket.id,
        userId: socket.userId || activity.userId,
        ipAddress:
          socket.request.connection.remoteAddress || socket.handshake.address,
        serverTimestamp: new Date().toISOString(),
      };

      await eventBus.publish("user.activity", enhancedActivity);

      // Broadcast to admin (throttled for performance)
      adminSockets.forEach((adminSocketId) => {
        io.to(adminSocketId).emit("admin:feed", {
          id: activity.id || crypto.randomUUID(),
          type: "user.activity",
          message: `${activity.action || activity.type}`,
          timestamp: activity.timestamp,
          severity: "INFO",
          source: "user_batch",
          data: enhancedActivity,
        });
      });
    }

    // Send batch acknowledgment
    socket.emit("activities_batch_ack", {
      sessionId: batchData.sessionId,
      count: batchData.activities.length,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on("user:vote", async (data) => {
    console.log("🗳️ User vote received:", data);

    await eventBus.publish("user.vote", {
      ...data,
      socketId: socket.id,
      userId: socket.userId,
    });

    adminSockets.forEach((adminSocketId) => {
      io.to(adminSocketId).emit("admin:feed", {
        id: crypto.randomUUID(),
        type: "vote.cast",
        message: `User ${socket.userId || data.userId} voted for contestant ${
          data.contestantId
        }`,
        timestamp: new Date().toISOString(),
        severity: "INFO",
        source: "user",
        data: { ...data, userId: socket.userId },
      });
    });
  });

  socket.on("user:auth", async (data) => {
    console.log("🔐 User auth received:", data);

    await eventBus.publish("user.auth", {
      ...data,
      socketId: socket.id,
      userId: socket.userId,
    });

    adminSockets.forEach((adminSocketId) => {
      io.to(adminSocketId).emit("admin:feed", {
        id: crypto.randomUUID(),
        type: `auth.${data.type}`,
        message: `User authentication: ${data.type}`,
        timestamp: new Date().toISOString(),
        severity: "INFO",
        source: "user",
        data: { ...data, userId: socket.userId },
      });
    });
  });

  // Enhanced admin commands with targeting
  socket.on("admin:command", async (data) => {
    console.log("⚡ Admin command received:", data);

    if (
      !socket.userRole ||
      !securityManager.hasPermission(socket.userRole, "user.manage")
    ) {
      socket.emit("error", { message: "Insufficient permissions" });
      return;
    }

    securityManager.addAuditLog("admin.command", socket.userId, data);

    await eventBus.publish("admin.command", {
      ...data,
      adminId: socket.userId,
      adminSocketId: socket.id,
    });

    let targetCount = 0;

    // Prefer emitting to room 'users' (maintained by authentication handler)
    if (data.targetUsers && data.targetUsers.length > 0) {
      // Target by userId by scanning connected clients map
      connectedClients.forEach((client, userSocketId) => {
        if (
          client &&
          client.clientType !== "admin" &&
          data.targetUsers.includes(client.userId)
        ) {
          io.to(userSocketId).emit("user:command", {
            type: data.type,
            message: data.message,
            title: data.title,
            targetUrl: data.targetUrl,
            priority: data.priority,
            timestamp: data.timestamp,
          });
          targetCount++;
        }
      });
    } else {
      // Broadcast to all authenticated users via room
      io.to("users").emit("user:command", {
        type: data.type,
        message: data.message,
        title: data.title,
        targetUrl: data.targetUrl,
        priority: data.priority,
        timestamp: data.timestamp,
      });

      // Estimate targetCount from connections
      connectedClients.forEach((client) => {
        if (client && client.clientType !== "admin") targetCount++;
      });
    }

    // Send response back to admin
    socket.emit("command:response", {
      commandId: data.id,
      success: true,
      targetCount,
      timestamp: new Date().toISOString(),
    });
  });

  // Handle admin notifications
  socket.on("admin:send_notification", async (data) => {
    console.log("🔔 Admin notification received:", data);

    if (
      !socket.userRole ||
      !securityManager.hasPermission(socket.userRole, "user.manage")
    ) {
      socket.emit("error", { message: "Insufficient permissions" });
      return;
    }

    securityManager.addAuditLog("admin.notification", socket.userId, data);

    await eventBus.publish("admin.notification", {
      ...data,
      adminId: socket.userId,
      adminSocketId: socket.id,
    });

    let targetCount = 0;

    // Send notification to targeted users or all users
    if (data.targetUsers && data.targetUsers.length > 0) {
      data.targetUsers.forEach((targetUserId) => {
        userSockets.forEach((userSocketId) => {
          const client = connectedClients.get(userSocketId);
          if (client && client.userId === targetUserId) {
            io.to(userSocketId).emit("user:notification", {
              type: data.notificationType,
              title: data.title,
              message: data.message,
              priority: data.priority,
              timestamp: data.timestamp,
            });
            targetCount++;
          }
        });
      });
    } else {
      userSockets.forEach((userSocketId) => {
        io.to(userSocketId).emit("user:notification", {
          type: data.notificationType,
          title: data.title,
          message: data.message,
          priority: data.priority,
          timestamp: data.timestamp,
        });
        targetCount++;
      });
    }

    // Send response back to admin
    socket.emit("command:response", {
      commandId: data.id,
      success: true,
      targetCount,
      timestamp: new Date().toISOString(),
    });
  });

  // Handle request for active users
  socket.on("admin:get_active_users", () => {
    if (
      !socket.userRole ||
      !securityManager.hasPermission(socket.userRole, "logs.read")
    ) {
      return;
    }

    const activeUsers = [];
    userSockets.forEach((userSocketId) => {
      const client = connectedClients.get(userSocketId);
      if (client) {
        activeUsers.push({
          socketId: userSocketId,
          userId: client.userId,
          role: client.role,
          connectedAt: client.connectedAt,
          clientType: client.clientType,
        });
      }
    });

    socket.emit("admin:active_users", {
      users: activeUsers,
      count: activeUsers.length,
      timestamp: new Date().toISOString(),
    });
  });

  // Bulk operations for admin
  socket.on("admin:bulk_command", async (data) => {
    if (
      !socket.userRole ||
      !securityManager.hasPermission(socket.userRole, "user.manage")
    ) {
      socket.emit("error", { message: "Insufficient permissions" });
      return;
    }

    const { command, targetUserIds, params } = data;

    securityManager.addAuditLog("admin.bulk_command", socket.userId, {
      command,
      targetCount: targetUserIds.length,
    });

    targetUserIds.forEach((userId) => {
      userSockets.forEach((userSocketId) => {
        const client = connectedClients.get(userSocketId);
        if (client && client.userId === userId) {
          io.to(userSocketId).emit("user:command", { command, params });
        }
      });
    });

    socket.emit("bulk_command_sent", { targetCount: targetUserIds.length });
  });

  // ACK/NACK handling
  socket.on("ack", (data) => {
    const { eventId } = data;
    eventBus.ack(eventId);
  });

  socket.on("nack", (data) => {
    const { eventId, reason } = data;
    console.log(`NACK received for event ${eventId}: ${reason}`);
  });

  // Enhanced ping/pong with system status
  socket.on("ping", (data) => {
    socket.emit("pong", {
      ...data,
      receivedAt: new Date().toISOString(),
      serverUptime: process.uptime(),
      connectedClients: connectedClients.size,
      adminClients: adminSockets.size,
      userClients: userSockets.size,
      botClients: botSockets.size,
    });
  });

  // System status for admin
  socket.on("get_system_status", () => {
    if (
      socket.userRole &&
      securityManager.hasPermission(socket.userRole, "logs.read")
    ) {
      socket.emit("system_status", {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        connectedClients: connectedClients.size,
        adminClients: adminSockets.size,
        userClients: userSockets.size,
        botClients: botSockets.size,
        eventQueueSize: eventBus.messageQueue.length,
        timestamp: new Date().toISOString(),
      });
    }
  });

  socket.on("disconnect", () => {
    const client = connectedClients.get(socket.id);
    if (client?.clientType === "bot") {
      console.log(`🤖 Bot disconnected: ${socket.id}`);
    } else {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    }

    connectedClients.delete(socket.id);
    adminSockets.delete(socket.id);
    userSockets.delete(socket.id);
    botSockets.delete(socket.id);
  });
});

// ========================================
// START SERVER
// ========================================
server.listen(PORT, async () => {
  console.log(`🚀 BVOTE Backend Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready`);
  console.log(`🌐 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`🔌 Socket.IO available at ws://localhost:${PORT}/socket.io/`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);

  // Initialize database
  console.log("🗄️ Initializing database...");
  const dbInitialized = await db.initialize();
  if (!dbInitialized) {
    console.error("❌ Failed to initialize database, exiting...");
    process.exit(1);
  }

  // Dynamically import optional modules to avoid startup crash when deps missing
  try {
    const { default: ChromeAutomationService } = await import(
      "./chrome-automation.js"
    );
    chromeAutomation = new ChromeAutomationService();
    chromeAutomation.isAvailable = true;
  } catch (e) {
    console.warn("ℹ️ chrome-automation not available:", e?.message || e);
    chromeAutomation = new NoopChromeAutomationService();
  }

  try {
    const { default: BotSystem } = await import("./bot-system.js");
    botSystem = new BotSystem(eventBus, securityManager, chromeAutomation);
  } catch (e) {
    console.warn("ℹ️ bot-system not available:", e?.message || e);
    botSystem = new NoopBotSystem();
  }

  // Initialize platform profiles (best-effort)
  await initializePlatformProfiles();

  // Start bot system (best-effort)
  await startBotSystem();

  console.log(
    "🎉 Enhanced Backend System fully initialized with database support!"
  );
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});
