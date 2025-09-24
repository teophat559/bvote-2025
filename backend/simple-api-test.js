/**
 * Simple API Test Server - Quick Connection Test
 * Server đơn giản để test API connectivity
 */

import express from "express";
import cors from "cors";

const app = express();
const PORT = 4002;

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());

// Basic logging
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path}`);
  next();
});

// Health endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    server: "simple-api-test",
    port: PORT,
  });
});

// Auto login test endpoints
app.get("/api/auto-login/requests", (req, res) => {
  console.log("✅ Auto login requests endpoint hit!");
  res.json({
    success: true,
    data: [
      {
        id: "test_001",
        platform: "facebook",
        status: "pending",
        createdAt: new Date().toISOString(),
      },
      {
        id: "test_002",
        platform: "google",
        status: "completed",
        createdAt: new Date().toISOString(),
      },
    ],
    total: 2,
    message: "Test data from simple API server",
  });
});

app.post("/api/auto-login/requests", (req, res) => {
  console.log("✅ Auto login request creation endpoint hit!");
  console.log("Request body:", req.body);

  res.json({
    success: true,
    data: {
      id: `test_${Date.now()}`,
      ...req.body,
      status: "created",
      createdAt: new Date().toISOString(),
    },
    message: "Request created successfully (test mode)",
  });
});

// Connection test endpoint
app.get("/api/system/connection-test", (req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    latency: 15,
    message: "Connection test successful",
  });
});

// 404 handler
app.use("*", (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: "Endpoint not found",
    path: req.originalUrl,
    availableEndpoints: [
      "GET /api/health",
      "GET /api/auto-login/requests",
      "POST /api/auto-login/requests",
      "GET /api/system/connection-test",
    ],
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple API Test Server started on port ${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
  console.log(
    `🤖 Auto Login: http://localhost:${PORT}/api/auto-login/requests`
  );
  console.log("✅ Ready for connection testing!");
});
