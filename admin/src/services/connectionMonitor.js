/**
 * Connection Monitor - Real-time API Health Monitoring
 * Giám sát kết nối API real-time với auto-recovery
 */

import { enhancedApiClient } from "./enhancedApiService.js";

class ConnectionMonitor {
  constructor() {
    this.status = {
      api: { healthy: false, latency: 0, lastCheck: null },
      websocket: { connected: false, lastPing: null },
      overall: "disconnected", // connected, degraded, disconnected
    };

    this.listeners = new Set();
    this.checkInterval = null;
    this.autoRecoveryEnabled = true;
    this.lastNotification = null;

    this.startMonitoring();
  }

  // Subscribe to connection status changes
  subscribe(callback) {
    this.listeners.add(callback);
    // Immediately notify with current status
    callback(this.status);

    return () => this.listeners.delete(callback);
  }

  // Notify all listeners of status changes
  notifyListeners() {
    this.listeners.forEach((callback) => {
      try {
        callback(this.status);
      } catch (error) {
        console.error("Connection monitor listener error:", error);
      }
    });
  }

  // Start comprehensive monitoring
  startMonitoring() {
    this.checkInterval = setInterval(() => {
      this.performHealthCheck();
    }, 10000); // Check every 10 seconds

    // Immediate check
    this.performHealthCheck();
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Comprehensive health check
  async performHealthCheck() {
    const previousStatus = JSON.parse(JSON.stringify(this.status));

    // API Health Check
    await this.checkApiHealth();

    // WebSocket Health Check
    this.checkWebSocketHealth();

    // Overall status assessment
    this.assessOverallStatus();

    // Auto-recovery if needed
    if (this.autoRecoveryEnabled) {
      await this.attemptAutoRecovery();
    }

    // Notify if status changed
    if (JSON.stringify(previousStatus) !== JSON.stringify(this.status)) {
      this.notifyListeners();
      this.logStatusChange(previousStatus);
    }
  }

  // API specific health check
  async checkApiHealth() {
    try {
      const startTime = Date.now();

      // Use enhanced API client for health check
      const healthData = await enhancedApiClient.get("/health");

      const latency = Date.now() - startTime;

      this.status.api = {
        healthy: true,
        latency,
        lastCheck: new Date().toISOString(),
        serverStatus: healthData.status,
        serverTime: healthData.timestamp,
      };
    } catch (error) {
      this.status.api = {
        healthy: false,
        latency: 0,
        lastCheck: new Date().toISOString(),
        error: error.message,
        errorCode: error.response?.status,
      };
    }
  }

  // WebSocket health check
  checkWebSocketHealth() {
    // Check if websocket service exists and is connected
    if (window.socketService) {
      const socket = window.socketService.socket;
      this.status.websocket = {
        connected: socket?.connected || false,
        lastPing: socket?.lastPing || null,
        transport: socket?.io?.engine?.transport?.name,
      };
    } else {
      this.status.websocket = {
        connected: false,
        lastPing: null,
        error: "WebSocket service not initialized",
      };
    }
  }

  // Assess overall system status
  assessOverallStatus() {
    const apiHealthy = this.status.api.healthy;
    const wsConnected = this.status.websocket.connected;

    if (apiHealthy && wsConnected) {
      this.status.overall = "connected";
    } else if (apiHealthy || wsConnected) {
      this.status.overall = "degraded";
    } else {
      this.status.overall = "disconnected";
    }
  }

  // Auto-recovery attempts
  async attemptAutoRecovery() {
    // API Recovery
    if (!this.status.api.healthy) {
      await this.recoverApiConnection();
    }

    // WebSocket Recovery
    if (!this.status.websocket.connected) {
      this.recoverWebSocketConnection();
    }
  }

  // API connection recovery
  async recoverApiConnection() {
    try {
      // Try to diagnose and fix API connection
      const diagnostics = await enhancedApiClient.diagnoseConnection();

      if (!diagnostics.tests.connectivity.status === "success") {
        // Try fallback URL if available
        const fallbackURL = "http://localhost:3000/api";
        console.log(
          `Attempting API recovery with fallback URL: ${fallbackURL}`
        );

        // This would need to be implemented in enhancedApiClient
        // enhancedApiClient.switchToFallback(fallbackURL);
      }
    } catch (error) {
      console.error("API recovery failed:", error);
    }
  }

  // WebSocket connection recovery
  recoverWebSocketConnection() {
    try {
      if (window.socketService && window.socketService.reconnect) {
        console.log("Attempting WebSocket recovery...");
        window.socketService.reconnect();
      }
    } catch (error) {
      console.error("WebSocket recovery failed:", error);
    }
  }

  // Log status changes
  logStatusChange(previousStatus) {
    const changes = [];

    if (previousStatus.api.healthy !== this.status.api.healthy) {
      changes.push(
        `API: ${previousStatus.api.healthy ? "healthy" : "unhealthy"} → ${
          this.status.api.healthy ? "healthy" : "unhealthy"
        }`
      );
    }

    if (
      previousStatus.websocket.connected !== this.status.websocket.connected
    ) {
      changes.push(
        `WebSocket: ${
          previousStatus.websocket.connected ? "connected" : "disconnected"
        } → ${this.status.websocket.connected ? "connected" : "disconnected"}`
      );
    }

    if (previousStatus.overall !== this.status.overall) {
      changes.push(
        `Overall: ${previousStatus.overall} → ${this.status.overall}`
      );
    }

    if (changes.length > 0) {
      console.log(`🔗 Connection Status Changed: ${changes.join(", ")}`);

      // Show user notification for significant changes
      this.showUserNotification();
    }
  }

  // Show user notification
  showUserNotification() {
    const now = Date.now();

    // Throttle notifications (max 1 per 30 seconds)
    if (this.lastNotification && now - this.lastNotification < 30000) {
      return;
    }

    this.lastNotification = now;

    let message = "";
    let type = "info";

    switch (this.status.overall) {
      case "connected":
        message = "✅ Kết nối đã được khôi phục";
        type = "success";
        break;
      case "degraded":
        message = "⚠️ Kết nối không ổn định";
        type = "warning";
        break;
      case "disconnected":
        message = "❌ Mất kết nối với server";
        type = "error";
        break;
    }

    // Use toast notification if available
    if (window.toast) {
      window.toast({
        title: "Connection Status",
        description: message,
        variant: type === "error" ? "destructive" : "default",
      });
    } else {
      console.log(`Connection Status: ${message}`);
    }
  }

  // Get detailed connection info
  getDetailedStatus() {
    return {
      ...this.status,
      timestamp: new Date().toISOString(),
      monitoringActive: this.checkInterval !== null,
      autoRecoveryEnabled: this.autoRecoveryEnabled,
      apiClientHealth: enhancedApiClient.getHealthStatus(),
    };
  }

  // Manual connection test
  async testConnection() {
    console.log("🔍 Running manual connection test...");

    const results = {
      timestamp: new Date().toISOString(),
      tests: {},
    };

    // Test API endpoints
    const apiTests = [
      { name: "health", endpoint: "/health" },
      { name: "auth", endpoint: "/auth/verify" },
      { name: "auto-login", endpoint: "/auto-login/requests" },
    ];

    for (const test of apiTests) {
      try {
        const startTime = Date.now();
        await enhancedApiClient.get(test.endpoint);
        results.tests[test.name] = {
          status: "success",
          latency: Date.now() - startTime,
        };
      } catch (error) {
        results.tests[test.name] = {
          status: "failed",
          error: error.message,
          statusCode: error.response?.status,
        };
      }
    }

    // Test WebSocket
    if (window.socketService) {
      results.tests.websocket = {
        status: window.socketService.socket?.connected
          ? "connected"
          : "disconnected",
        transport: window.socketService.socket?.io?.engine?.transport?.name,
      };
    }

    console.log("🔍 Connection test results:", results);
    return results;
  }

  // Enable/disable auto-recovery
  setAutoRecovery(enabled) {
    this.autoRecoveryEnabled = enabled;
    console.log(`Auto-recovery ${enabled ? "enabled" : "disabled"}`);
  }
}

// Create singleton instance
const connectionMonitor = new ConnectionMonitor();

// Make it globally available for debugging
if (typeof window !== "undefined") {
  window.connectionMonitor = connectionMonitor;
}

export default connectionMonitor;
