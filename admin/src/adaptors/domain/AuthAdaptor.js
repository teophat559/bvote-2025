/**
 * Authentication Domain Adaptor
 * Quản lý xác thực với chuyển đổi mock/real
 */
import { BaseAdaptor } from "../base/BaseAdaptor.js";
import { restAdaptor } from "../rest/RestAdaptor.js";
import { socketAdaptor } from "../socket/SocketAdaptor.js";
import config from "../config.js";

export class AuthAdaptor extends BaseAdaptor {
  constructor() {
    super("AuthAdaptor");

    this.loginAttempts = 0;
    this.maxAttempts = config.auth.maxLoginAttempts;
    this.lockoutTime = 15 * 60 * 1000; // 15 minutes
    this.isLockedOut = false;

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen to REST adaptor auth events
    restAdaptor.on("auth:failed", () => {
      this.emit("auth:session_expired");
    });

    // Listen to Socket adaptor auth events
    if (config.features.realtime) {
      socketAdaptor.on("auth:failed", () => {
        this.emit("auth:socket_failed");
      });

      socketAdaptor.on("auth:success", (data) => {
        this.emit("auth:socket_connected", data);
      });
    }
  }

  /**
   * Login with credentials
   */
  async login(credentials) {
    const tracker = this.startPerformanceTracking("login");

    try {
      // Check lockout
      if (this.isLockedOut) {
        throw new Error("Tài khoản đã bị khóa do quá nhiều lần đăng nhập sai");
      }

      if (this.mode === "mock") {
        await this.delay();

        // Mock authentication logic
        const { username, password } = credentials;

        // Simulate wrong credentials
        if (username !== "admin" || password !== "bvote_admin_secure_2025") {
          this.loginAttempts++;

          if (this.loginAttempts >= this.maxAttempts) {
            this.isLockedOut = true;
            setTimeout(() => {
              this.isLockedOut = false;
              this.loginAttempts = 0;
            }, this.lockoutTime);

            throw new Error(
              "Quá nhiều lần đăng nhập sai. Tài khoản đã bị khóa 15 phút"
            );
          }

          throw new Error(
            `Sai tên đăng nhập hoặc mật khẩu. Còn ${this.maxAttempts -
              this.loginAttempts} lần thử`
          );
        }

        // Reset login attempts on success
        this.loginAttempts = 0;

        // Mock tokens
        const mockTokens = {
          access_token: "mock_access_token_" + Date.now(),
          refresh_token: "mock_refresh_token_" + Date.now(),
          expires_in: config.auth.sessionTimeout / 1000,
          token_type: "Bearer",
        };

        // Mock user data
        const mockUser = {
          id: "1",
          username: "admin",
          email: "admin@example.com",
          name: "Administrator",
          role: "admin",
          permissions: ["read", "write", "delete", "manage"],
          avatar: null,
          last_login: new Date().toISOString(),
        };

        // Save tokens
        restAdaptor.saveTokens(
          mockTokens.access_token,
          mockTokens.refresh_token
        );

        // Connect socket with new token
        if (config.features.realtime) {
          socketAdaptor.connect(mockTokens.access_token);
        }

        // Emit login event
        this.emit("auth:login_success", { user: mockUser, tokens: mockTokens });

        const result = this.standardizeResponse(
          {
            user: mockUser,
            tokens: mockTokens,
          },
          true,
          "Đăng nhập thành công"
        );

        this.endPerformanceTracking(tracker);
        return result;
      } else {
        // Real API call
        const response = await restAdaptor.post("/auth/login", credentials);

        if (response.success && response.data.tokens) {
          const { access_token, refresh_token } = response.data.tokens;

          // Save tokens
          restAdaptor.saveTokens(access_token, refresh_token);

          // Connect socket with new token
          if (config.features.realtime) {
            socketAdaptor.connect(access_token);
          }

          // Emit login event
          this.emit("auth:login_success", response.data);
        }

        this.endPerformanceTracking(tracker);
        return response;
      }
    } catch (error) {
      this.endPerformanceTracking(tracker);
      this.emit("auth:login_failed", { error: error.message });
      return this.standardizeError(error, "LOGIN_FAILED", {
        username: credentials.username,
      });
    }
  }

  /**
   * Logout
   */
  async logout() {
    const tracker = this.startPerformanceTracking("logout");

    try {
      if (this.mode === "mock") {
        await this.delay();

        // Clear tokens
        restAdaptor.clearTokens();

        // Disconnect socket
        if (config.features.realtime) {
          socketAdaptor.disconnect();
        }

        // Emit logout event
        this.emit("auth:logout_success");

        const result = this.standardizeResponse(
          null,
          true,
          "Đăng xuất thành công"
        );
        this.endPerformanceTracking(tracker);
        return result;
      } else {
        // Real API call
        try {
          await restAdaptor.post("/auth/logout");
        } catch (error) {
          // Continue with logout even if API call fails
          this.log(
            "warn",
            "Logout API call failed, continuing with local logout",
            error
          );
        }

        // Clear tokens
        restAdaptor.clearTokens();

        // Disconnect socket
        if (config.features.realtime) {
          socketAdaptor.disconnect();
        }

        // Emit logout event
        this.emit("auth:logout_success");

        const result = this.standardizeResponse(
          null,
          true,
          "Đăng xuất thành công"
        );
        this.endPerformanceTracking(tracker);
        return result;
      }
    } catch (error) {
      this.endPerformanceTracking(tracker);
      return this.standardizeError(error, "LOGOUT_FAILED");
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser() {
    const tracker = this.startPerformanceTracking("getCurrentUser");

    try {
      if (this.mode === "mock") {
        await this.delay();

        // Check if we have a token
        const token = localStorage.getItem(config.auth.tokenKey);
        if (!token) {
          throw new Error("No authentication token found");
        }

        // Mock user data
        const mockUser = {
          id: "1",
          username: "admin",
          email: "admin@example.com",
          name: "Administrator",
          role: "admin",
          permissions: ["read", "write", "delete", "manage"],
          avatar: null,
          last_login: new Date().toISOString(),
          created_at: "2024-01-01T00:00:00Z",
          updated_at: new Date().toISOString(),
        };

        const result = this.standardizeResponse(mockUser);
        this.endPerformanceTracking(tracker);
        return result;
      } else {
        // Real API call
        const response = await restAdaptor.get("/auth/me");
        this.endPerformanceTracking(tracker);
        return response;
      }
    } catch (error) {
      this.endPerformanceTracking(tracker);
      return this.standardizeError(error, "GET_CURRENT_USER_FAILED");
    }
  }

  /**
   * Refresh tokens
   */
  async refreshTokens() {
    const tracker = this.startPerformanceTracking("refreshTokens");

    try {
      if (this.mode === "mock") {
        await this.delay();

        const refreshToken = localStorage.getItem(config.auth.refreshTokenKey);
        if (!refreshToken) {
          throw new Error("No refresh token found");
        }

        // Mock new tokens
        const mockTokens = {
          access_token: "mock_access_token_" + Date.now(),
          refresh_token: "mock_refresh_token_" + Date.now(),
          expires_in: config.auth.sessionTimeout / 1000,
          token_type: "Bearer",
        };

        // Save new tokens
        restAdaptor.saveTokens(
          mockTokens.access_token,
          mockTokens.refresh_token
        );

        // Reconnect socket with new token
        if (config.features.realtime && socketAdaptor.getStatus().connected) {
          socketAdaptor.disconnect();
          socketAdaptor.connect(mockTokens.access_token);
        }

        const result = this.standardizeResponse(
          mockTokens,
          true,
          "Tokens refreshed successfully"
        );
        this.endPerformanceTracking(tracker);
        return result;
      } else {
        // Real API call (handled by RestAdaptor)
        const newToken = await restAdaptor.refreshTokens();

        // Reconnect socket with new token
        if (config.features.realtime && socketAdaptor.getStatus().connected) {
          socketAdaptor.disconnect();
          socketAdaptor.connect(newToken);
        }

        const result = this.standardizeResponse(
          { access_token: newToken },
          true,
          "Tokens refreshed successfully"
        );
        this.endPerformanceTracking(tracker);
        return result;
      }
    } catch (error) {
      this.endPerformanceTracking(tracker);
      this.emit("auth:refresh_failed", { error: error.message });
      return this.standardizeError(error, "REFRESH_TOKENS_FAILED");
    }
  }

  /**
   * Change password
   */
  async changePassword(currentPassword, newPassword) {
    const tracker = this.startPerformanceTracking("changePassword");

    try {
      if (this.mode === "mock") {
        await this.delay();

        // Mock password validation
        if (currentPassword !== "admin123") {
          throw new Error("Mật khẩu hiện tại không đúng");
        }

        if (newPassword.length < 6) {
          throw new Error("Mật khẩu mới phải có ít nhất 6 ký tự");
        }

        // Simulate password change
        const result = this.standardizeResponse(
          null,
          true,
          "Đổi mật khẩu thành công"
        );
        this.endPerformanceTracking(tracker);
        return result;
      } else {
        // Real API call
        const response = await restAdaptor.post("/auth/change-password", {
          current_password: currentPassword,
          new_password: newPassword,
        });

        this.endPerformanceTracking(tracker);
        return response;
      }
    } catch (error) {
      this.endPerformanceTracking(tracker);
      return this.standardizeError(error, "CHANGE_PASSWORD_FAILED");
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    const token = localStorage.getItem(config.auth.tokenKey);
    return !!token;
  }

  /**
   * Get current token
   */
  getToken() {
    return localStorage.getItem(config.auth.tokenKey);
  }

  /**
   * Validate session
   */
  async validateSession() {
    try {
      const response = await this.getCurrentUser();
      return response.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * Setup session timeout
   */
  setupSessionTimeout() {
    if (config.auth.sessionTimeout > 0) {
      setTimeout(() => {
        this.emit("auth:session_timeout");
        this.logout();
      }, config.auth.sessionTimeout);
    }
  }
}

// Singleton instance
export const authAdaptor = new AuthAdaptor();
