/**
 * Real-time Logger Service - PRODUCTION VERSION
 * Socket.IO integration để đẩy logs real-time đến Admin
 * Sử dụng real database và production logging
 */

import { addHistoryLog, historyManager } from "../routes/admin.js";

class RealTimeLogger {
  constructor(io) {
    this.io = io;
    this.adminClients = new Map(); // Track admin clients with realtime enabled
    this.maxBufferSize = 100; // Smaller buffer for production

    // Store io globally for access from other modules
    global.socketIO = io;

    this.setupSocketHandlers();
    this.initializeProductionLogging();
  }

  // Initialize production logging integration
  async initializeProductionLogging() {
    try {
      // Ensure database table exists
      await historyManager.initializeTable();
      console.log("✅ Production logging initialized with database");
    } catch (error) {
      console.error("❌ Failed to initialize production logging:", error);
    }
  }

  // Setup Socket.IO event handlers
  setupSocketHandlers() {
    this.io.on("connection", (socket) => {
      console.log(`New socket connection: ${socket.id}`);

      // Admin enables real-time logging
      socket.on("admin:realtime:enable", (data) => {
        console.log(`Admin ${socket.id} enabled real-time logging`);

        this.adminClients.set(socket.id, {
          socketId: socket.id,
          enabledAt: new Date().toISOString(),
          filters: data.filters || {},
          isActive: true,
        });

        // Send recent logs from database to newly connected admin
        try {
          const recentLogs = await historyManager.queryLogs({
            limit: 50,
            sortBy: 'timestamp',
            sortOrder: 'desc'
          });

          if (recentLogs.success && recentLogs.data.length > 0) {
            socket.emit("admin:logs:buffer", {
              logs: recentLogs.data,
              count: recentLogs.pagination.totalItems,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error("❌ Failed to send buffered logs:", error);
        }

        // Confirm real-time enabled
        socket.emit("admin:realtime:enabled", {
          success: true,
          message: "Real-time logging enabled",
          bufferedLogs: this.logBuffer.length,
        });
      });

      // Admin disables real-time logging
      socket.on("admin:realtime:disable", () => {
        console.log(`Admin ${socket.id} disabled real-time logging`);
        this.adminClients.delete(socket.id);

        socket.emit("admin:realtime:disabled", {
          success: true,
          message: "Real-time logging disabled",
        });
      });

      // Admin updates filters
      socket.on("admin:realtime:filters", (filters) => {
        const client = this.adminClients.get(socket.id);
        if (client) {
          client.filters = filters;
          console.log(`Admin ${socket.id} updated real-time filters:`, filters);
        }
      });

      // Handle disconnect
      socket.on("disconnect", () => {
        console.log(`Socket disconnected: ${socket.id}`);
        this.adminClients.delete(socket.id);
      });

      // Send initial status
      socket.emit("admin:status", {
        connected: true,
        timestamp: new Date().toISOString(),
        activeAdmins: this.adminClients.size,
      });
    });
  }

  // Log operation with real-time broadcast
  logOperation(operation) {
    try {
      const logEntry = {
        platform: operation.platform,
        action: operation.action,
        status: operation.status,
        user: operation.user,
        message: operation.message,
        metadata: {
          duration: operation.duration,
          ip: operation.ip,
          userAgent: operation.userAgent,
          sessionId: operation.sessionId,
          ...operation.metadata,
        },
        category: operation.category || "automation",
      };

      // Add to production database
      const savedLog = await addHistoryLog(logEntry);

      if (savedLog) {
        // Broadcast to admin clients in real-time
        this.broadcastToAdmins("admin:logs:new", savedLog);
        return savedLog;
      }

      return null;
    } catch (error) {
      console.error("Real-time logging error:", error);
      return null;
    }
  }

  // Log authentication events
  logAuth(authEvent) {
    const logEntry = {
      platform: authEvent.platform,
      action: "authentication",
      status: authEvent.success ? "success" : "failed",
      user: authEvent.user,
      message:
        authEvent.message ||
        `Authentication ${authEvent.success ? "successful" : "failed"}`,
      metadata: {
        duration: authEvent.duration,
        ip: authEvent.ip,
        method: authEvent.method, // password, 2fa, app_password
        attempts: authEvent.attempts,
        ...authEvent.metadata,
      },
      category: "authentication",
    };

    return this.logOperation(logEntry);
  }

  // Log automation actions
  logAutomation(automationEvent) {
    const logEntry = {
      platform: automationEvent.platform,
      action: automationEvent.action,
      status: automationEvent.status,
      user: automationEvent.user,
      message: automationEvent.message,
      metadata: {
        targetUser: automationEvent.targetUser,
        content: automationEvent.content,
        campaignId: automationEvent.campaignId,
        batchId: automationEvent.batchId,
        ...automationEvent.metadata,
      },
      category: "automation",
    };

    return this.logOperation(logEntry);
  }

  // Log system events
  logSystem(systemEvent) {
    const logEntry = {
      platform: "system",
      action: systemEvent.action,
      status: systemEvent.status,
      user: systemEvent.user || "system",
      message: systemEvent.message,
      metadata: {
        component: systemEvent.component,
        version: systemEvent.version,
        ...systemEvent.metadata,
      },
      category: "system",
    };

    return this.logOperation(logEntry);
  }

  // Broadcast log to admin clients with filtering
  broadcastToAdmins(event, logData) {
    if (this.adminClients.size === 0) {
      return; // No admins listening
    }

    this.adminClients.forEach((client, socketId) => {
      if (!client.isActive) return;

      // Apply client-specific filters
      if (this.shouldSendToClient(logData, client.filters)) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit(event, {
            log: logData,
            timestamp: new Date().toISOString(),
            filters: client.filters,
          });
        }
      }
    });
  }

  // Check if log matches client filters
  shouldSendToClient(logData, filters) {
    if (!filters || Object.keys(filters).length === 0) {
      return true; // No filters, send all
    }

    // Platform filter
    if (
      filters.platform &&
      filters.platform !== "all" &&
      logData.platform !== filters.platform
    ) {
      return false;
    }

    // Status filter
    if (
      filters.status &&
      filters.status !== "all" &&
      logData.status !== filters.status
    ) {
      return false;
    }

    // Action filter
    if (
      filters.action &&
      !logData.action.toLowerCase().includes(filters.action.toLowerCase())
    ) {
      return false;
    }

    // User filter
    if (
      filters.user &&
      !logData.user.toLowerCase().includes(filters.user.toLowerCase())
    ) {
      return false;
    }

    // Category filter
    if (
      filters.category &&
      filters.category !== "all" &&
      logData.category !== filters.category
    ) {
      return false;
    }

    return true;
  }

  // Send system status to all admin clients
  broadcastSystemStatus(statusData) {
    this.broadcastToAdmins("admin:system:status", {
      type: "system_status",
      data: statusData,
      timestamp: new Date().toISOString(),
    });
  }

  // Send performance metrics
  broadcastPerformanceMetrics(metrics) {
    this.broadcastToAdmins("admin:performance:update", {
      type: "performance_metrics",
      data: metrics,
      timestamp: new Date().toISOString(),
    });
  }

  // Send alerts to admins
  broadcastAlert(alertData) {
    this.broadcastToAdmins("admin:alert", {
      type: "alert",
      level: alertData.level || "warning", // info, warning, error, critical
      message: alertData.message,
      data: alertData.data,
      timestamp: new Date().toISOString(),
    });
  }

  // Get current admin clients status
  getAdminClientsStatus() {
    return {
      totalClients: this.adminClients.size,
      activeClients: Array.from(this.adminClients.values()).filter(
        (c) => c.isActive
      ).length,
      clients: Array.from(this.adminClients.values()).map((client) => ({
        socketId: client.socketId,
        enabledAt: client.enabledAt,
        hasFilters: Object.keys(client.filters).length > 0,
        isActive: client.isActive,
      })),
      bufferSize: this.logBuffer.length,
      lastBroadcast: this.lastBroadcast || null,
    };
  }
}

export default RealTimeLogger;
