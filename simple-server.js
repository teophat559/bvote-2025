/**
 * Simple BVOTE Backend Server for Testing
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "BVOTE Backend is running!",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
    status: "healthy",
  });
});

// Auth endpoints
app.post("/api/auth/login", (req, res) => {
  const { email, password, adminKey } = req.body;

  // Admin key login
  if (adminKey === process.env.ADMIN_KEY) {
    return res.json({
      success: true,
      message: "Admin login successful",
      user: {
        id: "admin-1",
        email: "admin@bvote.com",
        role: "superadmin",
        name: "Super Admin",
      },
      token: "mock-admin-token",
      expiresIn: "24h",
    });
  }

  // Regular user login
  if (email === "user@bvote.com" && password === "password123") {
    return res.json({
      success: true,
      message: "Login successful",
      user: {
        id: "user-1",
        email: "user@bvote.com",
        role: "user",
        name: "Test User",
      },
      token: "mock-user-token",
      expiresIn: "24h",
    });
  }

  res.status(401).json({
    success: false,
    message: "Invalid credentials",
  });
});

// Auto login endpoints
app.get("/api/auto-login/sessions", (req, res) => {
  res.json({
    success: true,
    data: {
      sessions: [
        {
          id: "session-1",
          platform: "facebook",
          status: "completed",
          startTime: new Date().toISOString(),
          result: { success: true, message: "Login successful" },
        },
      ],
      total: 1,
    },
  });
});

// Victims endpoints
app.get("/api/victims", (req, res) => {
  res.json({
    success: true,
    data: {
      victims: [
        {
          id: "victim-001",
          name: "Target_User_001",
          ip: "192.168.1.50",
          status: "online",
          device: "Windows 11 - Chrome",
          lastSeen: new Date().toISOString(),
        },
      ],
      total: 1,
    },
  });
});

// Admin endpoints
app.get("/api/admin/stats", (req, res) => {
  res.json({
    success: true,
    data: {
      users: { total: 150, active: 120 },
      sessions: { total: 1250, successful: 1100 },
      victims: { total: 50, online: 30 },
      system: { uptime: 86400000, cpu: 15.5, memory: 25.0 },
    },
  });
});

// Monitoring endpoints
app.get("/api/monitoring/metrics", (req, res) => {
  res.json({
    success: true,
    metrics: {
      timestamp: Date.now(),
      system: { cpu: 25.5, memory: { percentage: 25.0 } },
      application: { requestCount: 1000, errorRate: 1.0 },
    },
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
    path: req.originalUrl,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// Start server
app.listen(PORT, () => {
  console.log("🚀 BVOTE Backend Server Started!");
  console.log(`📊 Port: ${PORT}`);
  console.log(`🔐 Admin Key: ${process.env.ADMIN_KEY}`);
  console.log(`🌐 Health Check: http://localhost:${PORT}/health`);
  console.log(`✅ Server ready for connections!`);
});

export { app };
