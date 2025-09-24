/**
 * Socket.IO Client - Thay thế Supabase Realtime
 * Kết nối với backend Express.js + Socket.io
 */

import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

class SocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventListeners = new Map();
  }

  connect() {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    const token = localStorage.getItem("admin_token");

    this.socket = io(SOCKET_URL, {
      auth: {
        token: token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    this.socket.on("connect", () => {
      console.log("✅ Connected to realtime server");
      this.isConnected = true;
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from realtime server:", reason);
      this.isConnected = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
      this.isConnected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventListeners.clear();
    }
  }

  // Subscribe to login requests events
  subscribeToLoginRequests(callback) {
    if (!this.socket) {
      this.connect();
    }

    const eventHandler = (data) => {
      callback({
        eventType: data.eventType, // 'INSERT', 'UPDATE', 'DELETE'
        new: data.data,
        old: data.oldData,
      });
    };

    this.socket.on("login_request_created", (data) =>
      eventHandler({ eventType: "INSERT", data })
    );
    this.socket.on("login_request_updated", (data) =>
      eventHandler({ eventType: "UPDATE", data, oldData: data.oldData })
    );
    this.socket.on("login_request_deleted", (data) =>
      eventHandler({ eventType: "DELETE", data })
    );

    // Store listener for cleanup
    this.eventListeners.set("login_requests", eventHandler);

    return () => {
      this.socket.off("login_request_created");
      this.socket.off("login_request_updated");
      this.socket.off("login_request_deleted");
      this.eventListeners.delete("login_requests");
    };
  }

  // Subscribe to system events
  subscribeToSystemEvents(callback) {
    if (!this.socket) {
      this.connect();
    }

    const eventHandler = (data) => {
      callback(data);
    };

    this.socket.on("system_alert", eventHandler);
    this.socket.on("system_stats", eventHandler);

    this.eventListeners.set("system_events", eventHandler);

    return () => {
      this.socket.off("system_alert");
      this.socket.off("system_stats");
      this.eventListeners.delete("system_events");
    };
  }

  // Subscribe to user activity
  subscribeToUserActivity(callback) {
    if (!this.socket) {
      this.connect();
    }

    const eventHandler = (data) => {
      callback(data);
    };

    this.socket.on("user_online", eventHandler);
    this.socket.on("user_offline", eventHandler);
    this.socket.on("user_activity", eventHandler);

    this.eventListeners.set("user_activity", eventHandler);

    return () => {
      this.socket.off("user_online");
      this.socket.off("user_offline");
      this.socket.off("user_activity");
      this.eventListeners.delete("user_activity");
    };
  }

  // Send message to server
  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }

  // Generic subscription method
  subscribe(event, callback) {
    if (!this.socket) {
      this.connect();
    }

    this.socket.on(event, callback);

    return () => {
      this.socket.off(event, callback);
    };
  }

  // Check connection status
  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }
}

// Export singleton instance
export const socketClient = new SocketClient();

// Export class for manual instantiation if needed
export default SocketClient;
