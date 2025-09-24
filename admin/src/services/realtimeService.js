/**
 * Realtime Service - Supabase Replacement
 * WebSocket-based realtime communication system
 */

import { mockBackend } from "./mockBackendService";

class RealtimeService {
  constructor() {
    this.channels = new Map();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.heartbeatInterval = null;

    this.init();
  }

  init() {
    console.log("🔌 Initializing Realtime Service...");

    // Simulate WebSocket connection
    setTimeout(() => {
      this.isConnected = true;
      this.startHeartbeat();
      console.log("✅ Realtime Service connected");
    }, 1000);
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        // Simulate random updates for demo
        this.simulateRealtimeUpdates();
      }
    }, 10000); // Every 10 seconds
  }

  simulateRealtimeUpdates() {
    const updateTypes = ["login_requests", "system_stats", "admin_activity"];
    const randomType =
      updateTypes[Math.floor(Math.random() * updateTypes.length)];

    switch (randomType) {
      case "login_requests":
        this.emitLoginRequestUpdate();
        break;
      case "system_stats":
        this.emitSystemStatsUpdate();
        break;
      case "admin_activity":
        this.emitAdminActivity();
        break;
    }
  }

  emitLoginRequestUpdate() {
    const mockUpdate = {
      id: Date.now().toString(),
      platform: ["Facebook", "Google", "Instagram"][
        Math.floor(Math.random() * 3)
      ],
      account: `user${Math.floor(Math.random() * 1000)}@example.com`,
      status: ["pending", "processing", "success", "failed"][
        Math.floor(Math.random() * 4)
      ],
      log: "Cập nhật tự động từ hệ thống...",
      last_updated: new Date().toISOString(),
    };

    this.emit("login_requests", "UPDATE", mockUpdate);
  }

  emitSystemStatsUpdate() {
    const stats = {
      active_sessions: Math.floor(Math.random() * 20) + 1,
      cpu_usage: Math.random() * 100,
      memory_usage: Math.random() * 100,
      timestamp: new Date().toISOString(),
    };

    this.emit("system_stats", "UPDATE", stats);
  }

  emitAdminActivity() {
    const activities = [
      "Quản trị viên đã đăng nhập",
      "Yêu cầu mới được tạo",
      "Hệ thống đã được cập nhật",
      "Backup tự động hoàn thành",
    ];

    const activity = {
      id: Date.now().toString(),
      message: activities[Math.floor(Math.random() * activities.length)],
      timestamp: new Date().toISOString(),
      type: "info",
    };

    this.emit("admin_activity", "INSERT", activity);
  }

  // Channel management
  channel(channelName) {
    if (!this.channels.has(channelName)) {
      this.channels.set(channelName, {
        name: channelName,
        subscribers: new Set(),
        isActive: true,
      });
      console.log(`📺 Created channel: ${channelName}`);
    }

    const channel = this.channels.get(channelName);

    return {
      on: (event, callback) => {
        const subscriber = { event, callback };
        channel.subscribers.add(subscriber);
        console.log(`👂 Listening to ${event} on ${channelName}`);
        return this;
      },

      subscribe: () => {
        console.log(`✅ Subscribed to channel: ${channelName}`);
        return this;
      },

      unsubscribe: () => {
        if (this.channels.has(channelName)) {
          this.channels.get(channelName).isActive = false;
          console.log(`❌ Unsubscribed from channel: ${channelName}`);
        }
        return this;
      },
    };
  }

  // Emit events to channel subscribers
  emit(channelName, event, data) {
    if (this.channels.has(channelName)) {
      const channel = this.channels.get(channelName);

      channel.subscribers.forEach((subscriber) => {
        if (subscriber.event === event || subscriber.event === "*") {
          try {
            subscriber.callback({
              event,
              new: data,
              old: null,
              timestamp: new Date().toISOString(),
              table: channelName,
            });
          } catch (error) {
            console.error("Error in realtime callback:", error);
          }
        }
      });
    }

    // Also emit to mock backend for storage
    mockBackend.emit(channelName, event, data);
  }

  // Remove channel
  removeChannel(channelRef) {
    // In real implementation, channelRef would have channel info
    // For now, we'll clean up inactive channels
    this.channels.forEach((channel, name) => {
      if (!channel.isActive) {
        this.channels.delete(name);
        console.log(`🗑️ Removed inactive channel: ${name}`);
      }
    });
  }

  // Connection management
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      channels: Array.from(this.channels.keys()),
      activeSubscriptions: Array.from(this.channels.values()).reduce(
        (total, channel) => total + channel.subscribers.size,
        0
      ),
      lastHeartbeat: new Date().toISOString(),
    };
  }

  // Cleanup
  destroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.channels.clear();
    this.isConnected = false;
    console.log("🔌 Realtime Service disconnected");
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();
export default realtimeService;
