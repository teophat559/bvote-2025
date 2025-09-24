/**
 * Mock Backend Service
 * Comprehensive backend simulation for production-ready development
 */

class MockBackendService {
  constructor() {
    this.storage = new Map();
    this.subscribers = new Map();
    this.isInitialized = false;
    this.init();
  }

  init() {
    if (this.isInitialized) return;

    // Initialize default data
    this.storage.set("login_requests", [
      {
        id: "1",
        platform: "Facebook",
        account: "user@example.com",
        password: "password123",
        status: "pending",
        log: "Đang chờ xử lý...",
        last_updated: new Date().toISOString(),
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        ip_address: "192.168.1.100",
        user_agent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        metadata: {
          attempts: 0,
          last_attempt: null,
          success_rate: 0,
        },
      },
    ]);

    this.storage.set("admin_keys", [
      {
        id: "1",
        name: "Master Admin Key",
        key: "WEBBVOTE2025$ABC",
        key_preview: "WEBB...ABC",
        created_at: new Date().toISOString(),
        last_used_at: new Date().toISOString(),
        status: "active",
        permissions: ["full_access"],
        usage_count: 5,
        last_ip: "192.168.1.1",
      },
    ]);

    this.storage.set("system_stats", {
      total_requests: 156,
      successful_logins: 134,
      failed_logins: 22,
      active_sessions: 8,
      uptime: Date.now() - 24 * 60 * 60 * 1000, // 24 hours
    });

    this.storage.set("realtime_events", []);
    this.isInitialized = true;
    console.log("🚀 Mock Backend Service initialized successfully");
  }

  // Realtime subscription system
  subscribe(channel, callback) {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    this.subscribers.get(channel).add(callback);

    console.log(`📡 Subscribed to channel: ${channel}`);

    // Return unsubscribe function
    return () => {
      if (this.subscribers.has(channel)) {
        this.subscribers.get(channel).delete(callback);
        console.log(`📡 Unsubscribed from channel: ${channel}`);
      }
    };
  }

  // Emit events to subscribers
  emit(channel, event, data) {
    if (this.subscribers.has(channel)) {
      this.subscribers.get(channel).forEach((callback) => {
        try {
          callback({ event, data, timestamp: new Date().toISOString() });
        } catch (error) {
          console.error("Error in realtime callback:", error);
        }
      });
    }

    // Store event for history
    const events = this.storage.get("realtime_events") || [];
    events.push({
      id: Date.now().toString(),
      channel,
      event,
      data,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 100 events
    if (events.length > 100) {
      events.splice(0, events.length - 100);
    }

    this.storage.set("realtime_events", events);
  }

  // Database operations
  async get(table, filters = {}) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let data = this.storage.get(table) || [];

        // Apply filters
        if (Object.keys(filters).length > 0) {
          data = data.filter((item) => {
            return Object.entries(filters).every(([key, value]) => {
              if (typeof value === "object" && value.operator) {
                switch (value.operator) {
                  case "in":
                    return value.value.includes(item[key]);
                  case "gt":
                    return item[key] > value.value;
                  case "lt":
                    return item[key] < value.value;
                  case "contains":
                    return item[key]
                      ?.toLowerCase()
                      .includes(value.value.toLowerCase());
                  default:
                    return item[key] === value.value;
                }
              }
              return item[key] === value;
            });
          });
        }

        resolve(data);
      }, Math.random() * 300 + 100); // 100-400ms delay
    });
  }

  async create(table, data) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const items = this.storage.get(table) || [];
        const newItem = {
          id: Date.now().toString(),
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        items.push(newItem);
        this.storage.set(table, items);

        // Emit realtime event
        this.emit(table, "INSERT", newItem);

        resolve(newItem);
      }, Math.random() * 200 + 100);
    });
  }

  async update(table, id, data) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const items = this.storage.get(table) || [];
        const index = items.findIndex((item) => item.id === id);

        if (index !== -1) {
          const updatedItem = {
            ...items[index],
            ...data,
            updated_at: new Date().toISOString(),
          };

          items[index] = updatedItem;
          this.storage.set(table, items);

          // Emit realtime event
          this.emit(table, "UPDATE", updatedItem);

          resolve(updatedItem);
        } else {
          throw new Error(`Item with id ${id} not found in ${table}`);
        }
      }, Math.random() * 200 + 100);
    });
  }

  async delete(table, id) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const items = this.storage.get(table) || [];
        const index = items.findIndex((item) => item.id === id);

        if (index !== -1) {
          const deletedItem = items[index];
          items.splice(index, 1);
          this.storage.set(table, items);

          // Emit realtime event
          this.emit(table, "DELETE", deletedItem);

          resolve(deletedItem);
        } else {
          throw new Error(`Item with id ${id} not found in ${table}`);
        }
      }, Math.random() * 200 + 100);
    });
  }

  // System monitoring
  getSystemHealth() {
    return {
      status: "healthy",
      uptime:
        Date.now() - (this.storage.get("system_stats")?.uptime || Date.now()),
      memory_usage: Math.random() * 100,
      cpu_usage: Math.random() * 100,
      active_connections: this.subscribers.size,
      last_check: new Date().toISOString(),
    };
  }

  // Authentication
  async authenticate(key) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const adminKeys = this.storage.get("admin_keys") || [];
        const validKey = adminKeys.find(
          (k) => k.key === key && k.status === "active"
        );

        if (validKey) {
          // Update usage stats
          validKey.last_used_at = new Date().toISOString();
          validKey.usage_count = (validKey.usage_count || 0) + 1;

          resolve({
            user: {
              id: "admin-" + validKey.id,
              name: validKey.name,
              email: "admin@bvote.com",
              role: "admin",
              permissions: validKey.permissions,
            },
            token: `mock_token_${Date.now()}`,
            key_info: validKey,
          });
        } else {
          reject(new Error("Khóa truy cập không hợp lệ hoặc đã hết hạn"));
        }
      }, 500);
    });
  }
}

// Singleton instance
export const mockBackend = new MockBackendService();

// Export for direct usage
export default mockBackend;
