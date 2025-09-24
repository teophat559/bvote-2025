/**
 * User Domain Adaptor
 * Quản lý dữ liệu người dùng với chuyển đổi mock/real
 */
import { BaseAdaptor } from "../base/BaseAdaptor.js";
import { restAdaptor } from "../rest/RestAdaptor.js";
import { socketAdaptor } from "../socket/SocketAdaptor.js";
import config from "../config.js";

// Mock data for development
const mockUsers = [
  {
    id: "1",
    username: "admin",
    name: "Nguyễn Văn Admin",
    email: "admin@bvote.com",
    phone: "0123456789",
    role: "SuperAdmin",
    status: "active",
    online_status: "online",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-15T10:30:00Z",
    last_login: "2024-01-15T10:30:00Z",
    avatar: null,
    permissions: ["read", "write", "delete", "admin"],
  },
  {
    id: "2",
    username: "moderator",
    name: "Trần Thị Moderator",
    email: "moderator@bvote.com",
    phone: "0987654321",
    role: "Operator",
    status: "active",
    online_status: "offline",
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-14T15:20:00Z",
    last_login: "2024-01-14T15:20:00Z",
    avatar: null,
    permissions: ["read", "write"],
  },
  {
    id: "3",
    username: "auditor1",
    name: "Lê Văn User",
    email: "user@bvote.com",
    phone: "0369852147",
    role: "Auditor",
    status: "active",
    online_status: "online",
    created_at: "2024-01-03T00:00:00Z",
    updated_at: "2024-01-15T09:15:00Z",
    last_login: "2024-01-15T09:15:00Z",
    avatar: null,
    permissions: ["read"],
  },
  {
    id: "4",
    username: "pending_user",
    name: "Phạm Thị Pending",
    email: "pending@bvote.com",
    phone: "0741852963",
    role: "Auditor",
    status: "active",
    online_status: "offline",
    created_at: "2024-01-10T00:00:00Z",
    updated_at: "2024-01-10T00:00:00Z",
    last_login: null,
    avatar: null,
    permissions: [],
  },
  {
    id: "5",
    username: "banned_user",
    name: "Hoàng Văn Banned",
    email: "banned@bvote.com",
    phone: "0527419638",
    role: "Auditor",
    status: "banned",
    online_status: "offline",
    created_at: "2024-01-05T00:00:00Z",
    updated_at: "2024-01-12T14:30:00Z",
    last_login: "2024-01-12T14:30:00Z",
    avatar: null,
    permissions: [],
  },
  {
    id: "6",
    username: "inactive_user",
    name: "Vũ Thị Inactive",
    email: "inactive@bvote.com",
    phone: "0963258741",
    role: "Auditor",
    status: "active",
    online_status: "offline",
    created_at: "2024-01-08T00:00:00Z",
    updated_at: "2024-01-13T11:45:00Z",
    last_login: "2024-01-13T11:45:00Z",
    avatar: null,
    permissions: ["read"],
  },
  {
    id: "7",
    username: "testuser",
    name: "Đặng Văn Test",
    email: "test@bvote.com",
    phone: "0147258369",
    role: "Operator",
    status: "active",
    online_status: "online",
    created_at: "2024-01-12T00:00:00Z",
    updated_at: "2024-01-15T08:20:00Z",
    last_login: "2024-01-15T08:20:00Z",
    avatar: null,
    permissions: ["read"],
  },
  {
    id: "8",
    username: "demo",
    name: "Bùi Thị Demo",
    email: "demo@bvote.com",
    phone: "0852741963",
    role: "Operator",
    status: "active",
    online_status: "offline",
    created_at: "2024-01-14T00:00:00Z",
    updated_at: "2024-01-15T07:30:00Z",
    last_login: "2024-01-15T07:30:00Z",
    avatar: null,
    permissions: ["read", "write"],
  },
];

export class UserAdaptor extends BaseAdaptor {
  constructor() {
    super("UserAdaptor");

    // Real-time subscriptions
    this.setupRealtimeSubscriptions();
  }

  /**
   * Setup real-time event subscriptions
   */
  setupRealtimeSubscriptions() {
    if (config.features.realtime) {
      socketAdaptor.subscribe("user:updated", (data) => {
        this.log("info", "User updated via socket", data);
        this.emit("user:updated", data);
      });

      socketAdaptor.subscribe("user:status_changed", (data) => {
        this.log("info", "User status changed via socket", data);
        this.emit("user:status_changed", data);
      });

      socketAdaptor.subscribe("user:login", (data) => {
        this.log("info", "User logged in via socket", data);
        this.emit("user:login", data);
      });

      socketAdaptor.subscribe("user:logout", (data) => {
        this.log("info", "User logged out via socket", data);
        this.emit("user:logout", data);
      });
    }
  }

  /**
   * Get all users
   */
  async getUsers(filters = {}) {
    const tracker = this.startPerformanceTracking("getUsers");

    try {
      if (this.mode === "mock") {
        await this.delay();

        let users = [...mockUsers];

        // Apply filters
        if (filters.status) {
          users = users.filter((user) => user.status === filters.status);
        }
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          users = users.filter(
            (user) =>
              user.name.toLowerCase().includes(searchLower) ||
              user.email.toLowerCase().includes(searchLower) ||
              user.phone.toLowerCase().includes(searchLower)
          );
        }
        if (filters.role) {
          users = users.filter((user) => user.role === filters.role);
        }

        // Apply pagination
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedUsers = users.slice(startIndex, endIndex);

        const result = this.standardizeResponse(paginatedUsers, true, null, {
          total: users.length,
          page,
          limit,
          totalPages: Math.ceil(users.length / limit),
        });

        this.endPerformanceTracking(tracker);
        return result;
      } else {
        // Real API call
        const response = await restAdaptor.get("/users", filters);
        this.endPerformanceTracking(tracker);
        return response;
      }
    } catch (error) {
      this.endPerformanceTracking(tracker);
      return this.standardizeError(error, "GET_USERS_FAILED", { filters });
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id) {
    const tracker = this.startPerformanceTracking("getUserById");

    try {
      if (this.mode === "mock") {
        await this.delay();

        const user = mockUsers.find((u) => u.id === id);
        if (!user) {
          throw new Error("User not found");
        }

        const result = this.standardizeResponse(user);
        this.endPerformanceTracking(tracker);
        return result;
      } else {
        // Real API call
        const response = await restAdaptor.get(`/users/${id}`);
        this.endPerformanceTracking(tracker);
        return response;
      }
    } catch (error) {
      this.endPerformanceTracking(tracker);
      return this.standardizeError(error, "GET_USER_FAILED", { id });
    }
  }

  /**
   * Create new user
   */
  async createUser(userData) {
    const tracker = this.startPerformanceTracking("createUser");

    try {
      if (this.mode === "mock") {
        await this.delay();

        const newUser = {
          id: Date.now().toString(),
          ...userData,
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        mockUsers.push(newUser);

        // Emit real-time event
        if (config.features.realtime) {
          this.emit("user:created", newUser);
        }

        const result = this.standardizeResponse(
          newUser,
          true,
          "User created successfully"
        );
        this.endPerformanceTracking(tracker);
        return result;
      } else {
        // Real API call
        const response = await restAdaptor.post("/users", userData);
        this.endPerformanceTracking(tracker);
        return response;
      }
    } catch (error) {
      this.endPerformanceTracking(tracker);
      return this.standardizeError(error, "CREATE_USER_FAILED", { userData });
    }
  }

  /**
   * Update user
   */
  async updateUser(id, updates) {
    const tracker = this.startPerformanceTracking("updateUser");

    try {
      if (this.mode === "mock") {
        await this.delay();

        const userIndex = mockUsers.findIndex((u) => u.id === id);
        if (userIndex === -1) {
          throw new Error("User not found");
        }

        mockUsers[userIndex] = {
          ...mockUsers[userIndex],
          ...updates,
          updated_at: new Date().toISOString(),
        };

        const updatedUser = mockUsers[userIndex];

        // Emit real-time event
        if (config.features.realtime) {
          this.emit("user:updated", updatedUser);
        }

        const result = this.standardizeResponse(
          updatedUser,
          true,
          "User updated successfully"
        );
        this.endPerformanceTracking(tracker);
        return result;
      } else {
        // Real API call
        const response = await restAdaptor.put(`/users/${id}`, updates);
        this.endPerformanceTracking(tracker);
        return response;
      }
    } catch (error) {
      this.endPerformanceTracking(tracker);
      return this.standardizeError(error, "UPDATE_USER_FAILED", {
        id,
        updates,
      });
    }
  }

  /**
   * Delete user
   */
  async deleteUser(id) {
    const tracker = this.startPerformanceTracking("deleteUser");

    try {
      if (this.mode === "mock") {
        await this.delay();

        const userIndex = mockUsers.findIndex((u) => u.id === id);
        if (userIndex === -1) {
          throw new Error("User not found");
        }

        const deletedUser = mockUsers.splice(userIndex, 1)[0];

        // Emit real-time event
        if (config.features.realtime) {
          this.emit("user:deleted", { id, user: deletedUser });
        }

        const result = this.standardizeResponse(
          null,
          true,
          "User deleted successfully"
        );
        this.endPerformanceTracking(tracker);
        return result;
      } else {
        // Real API call
        const response = await restAdaptor.delete(`/users/${id}`);
        this.endPerformanceTracking(tracker);
        return response;
      }
    } catch (error) {
      this.endPerformanceTracking(tracker);
      return this.standardizeError(error, "DELETE_USER_FAILED", { id });
    }
  }

  /**
   * Update user status
   */
  async updateUserStatus(id, status, reason = "") {
    const tracker = this.startPerformanceTracking("updateUserStatus");

    try {
      if (this.mode === "mock") {
        await this.delay();

        const userIndex = mockUsers.findIndex((u) => u.id === id);
        if (userIndex === -1) {
          throw new Error("User not found");
        }

        mockUsers[userIndex] = {
          ...mockUsers[userIndex],
          status,
          status_reason: reason,
          status_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const updatedUser = mockUsers[userIndex];

        // Emit real-time event
        if (config.features.realtime) {
          this.emit("user:status_changed", {
            user: updatedUser,
            oldStatus: status,
            newStatus: status,
            reason,
          });
        }

        const result = this.standardizeResponse(
          updatedUser,
          true,
          "User status updated successfully"
        );
        this.endPerformanceTracking(tracker);
        return result;
      } else {
        // Real API call
        const response = await restAdaptor.patch(`/users/${id}/status`, {
          status,
          reason,
        });
        this.endPerformanceTracking(tracker);
        return response;
      }
    } catch (error) {
      this.endPerformanceTracking(tracker);
      return this.standardizeError(error, "UPDATE_USER_STATUS_FAILED", {
        id,
        status,
        reason,
      });
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats() {
    const tracker = this.startPerformanceTracking("getUserStats");

    try {
      if (this.mode === "mock") {
        await this.delay();

        const stats = {
          total: mockUsers.length,
          active: mockUsers.filter((u) => u.status === "active").length,
          inactive: mockUsers.filter((u) => u.status === "inactive").length,
          banned: mockUsers.filter((u) => u.status === "banned").length,
          pending: mockUsers.filter((u) => u.status === "pending").length,
          online: mockUsers.filter((u) => u.online_status === "online").length,
          roles: {
            admin: mockUsers.filter((u) => u.role === "admin").length,
            moderator: mockUsers.filter((u) => u.role === "moderator").length,
            user: mockUsers.filter((u) => u.role === "user").length,
          },
        };

        const result = this.standardizeResponse(stats);
        this.endPerformanceTracking(tracker);
        return result;
      } else {
        // Real API call
        const response = await restAdaptor.get("/users/stats");
        this.endPerformanceTracking(tracker);
        return response;
      }
    } catch (error) {
      this.endPerformanceTracking(tracker);
      return this.standardizeError(error, "GET_USER_STATS_FAILED");
    }
  }

  /**
   * Send notification to user
   */
  async sendNotification(userId, notification) {
    const tracker = this.startPerformanceTracking("sendNotification");

    try {
      if (this.mode === "mock") {
        await this.delay();

        // Simulate sending notification
        const notificationData = {
          id: Date.now().toString(),
          user_id: userId,
          ...notification,
          sent_at: new Date().toISOString(),
          status: "sent",
        };

        // Emit real-time event
        if (config.features.realtime) {
          socketAdaptor.send("user:notification", {
            user_id: userId,
            notification: notificationData,
          });
        }

        const result = this.standardizeResponse(
          notificationData,
          true,
          "Notification sent successfully"
        );
        this.endPerformanceTracking(tracker);
        return result;
      } else {
        // Real API call
        const response = await restAdaptor.post(
          `/users/${userId}/notifications`,
          notification
        );
        this.endPerformanceTracking(tracker);
        return response;
      }
    } catch (error) {
      this.endPerformanceTracking(tracker);
      return this.standardizeError(error, "SEND_NOTIFICATION_FAILED", {
        userId,
        notification,
      });
    }
  }
}

// Singleton instance
export const userAdaptor = new UserAdaptor();
