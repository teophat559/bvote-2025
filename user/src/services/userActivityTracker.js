/**
 * User Activity Tracker Service
 * Theo dõi và gửi real-time user activities lên admin dashboard
 */

class UserActivityTracker {
  constructor() {
    this.socket = null;
    this.isEnabled = true;
    this.activities = [];
    this.sessionId = this.generateSessionId();
    this.startTime = new Date().toISOString();

    // Activity tracking configuration
    this.config = {
      trackPageViews: true,
      trackClicks: true,
      trackFormSubmissions: true,
      trackScrolling: false, // Can be heavy
      trackMouseMovement: false, // Very heavy
      batchSize: 10,
      sendInterval: 5000, // 5 seconds
      maxActivities: 100,
    };

    // Initialize tracking
    this.initializeTracking();
  }

  /**
   * Khởi tạo socket connection
   */
  setSocket(socket) {
    this.socket = socket;
    this.isEnabled = socket && socket.connected;
    console.log("🔗 UserActivityTracker socket set:", this.isEnabled);
  }

  /**
   * Khởi tạo các event listeners để track activities
   */
  initializeTracking() {
    // Track page visibility changes
    document.addEventListener("visibilitychange", () => {
      this.trackActivity({
        type: "session.visibility",
        action: document.hidden ? "Ẩn trang" : "Hiển thị trang",
        data: { hidden: document.hidden },
      });
    });

    // Track page beforeunload
    window.addEventListener("beforeunload", () => {
      this.trackActivity({
        type: "session.end",
        action: "Rời trang",
        data: {
          duration: Date.now() - new Date(this.startTime).getTime(),
          url: window.location.href,
        },
      });
      this.sendActivitiesSync(); // Send immediately before leaving
    });

    // Track clicks if enabled
    if (this.config.trackClicks) {
      document.addEventListener("click", (e) => {
        this.trackActivity({
          type: "user.click",
          action: "Click vào element",
          data: {
            element: e.target.tagName,
            className: e.target.className,
            id: e.target.id,
            text: e.target.textContent?.substring(0, 50),
            href: e.target.href,
            coordinates: { x: e.clientX, y: e.clientY },
          },
        });
      });
    }

    // Track form submissions if enabled
    if (this.config.trackFormSubmissions) {
      document.addEventListener("submit", (e) => {
        this.trackActivity({
          type: "user.form_submit",
          action: "Gửi form",
          data: {
            formId: e.target.id,
            formClass: e.target.className,
            formAction: e.target.action,
            formMethod: e.target.method,
          },
        });
      });
    }

    // Track scroll if enabled
    if (this.config.trackScrolling) {
      let scrollTimeout;
      window.addEventListener("scroll", () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          this.trackActivity({
            type: "user.scroll",
            action: "Cuộn trang",
            data: {
              scrollY: window.scrollY,
              scrollX: window.scrollX,
              maxScroll: document.body.scrollHeight - window.innerHeight,
            },
          });
        }, 1000); // Debounce scroll events
      });
    }

    // Auto-send activities periodically
    setInterval(() => {
      if (this.activities.length > 0) {
        this.sendActivitiesBatch();
      }
    }, this.config.sendInterval);

    console.log("✅ UserActivityTracker initialized with config:", this.config);
  }

  /**
   * Track một activity mới
   */
  trackActivity(activity) {
    if (!this.isEnabled) return;

    const enhancedActivity = {
      id: this.generateActivityId(),
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      pathname: window.location.pathname,
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      windowSize: `${window.innerWidth}x${window.innerHeight}`,
      userId: localStorage.getItem("user_id") || "anonymous",
      deviceType: this.getDeviceType(),
      browser: this.getBrowserInfo(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      referrer: document.referrer,
      ipAddress: null, // Will be filled by backend
      ...activity,
    };

    this.activities.push(enhancedActivity);

    // Keep only recent activities
    if (this.activities.length > this.config.maxActivities) {
      this.activities = this.activities.slice(-this.config.maxActivities);
    }

    console.log("📊 Tracked activity:", enhancedActivity);

    // Send immediately for important activities
    if (this.isImportantActivity(activity.type)) {
      this.sendActivity(enhancedActivity);
    }
  }

  /**
   * Kiểm tra xem activity có quan trọng không
   */
  isImportantActivity(type) {
    const importantTypes = [
      "auth.login",
      "auth.logout",
      "vote.cast",
      "contest.submit",
      "error.occurred",
      "session.start",
      "session.end",
    ];
    return importantTypes.includes(type);
  }

  /**
   * Gửi một activity ngay lập tức
   */
  sendActivity(activity) {
    if (!this.socket || !this.socket.connected) {
      console.warn("🔌 Socket not connected, cannot send activity");
      return;
    }

    this.socket.emit("user:activity", activity);
    console.log("📤 Sent activity:", activity.type);
  }

  /**
   * Gửi activities theo batch
   */
  sendActivitiesBatch() {
    if (
      !this.socket ||
      !this.socket.connected ||
      this.activities.length === 0
    ) {
      return;
    }

    const batch = this.activities.splice(0, this.config.batchSize);

    this.socket.emit("user:activities_batch", {
      sessionId: this.sessionId,
      activities: batch,
      timestamp: new Date().toISOString(),
    });

    console.log(`📦 Sent activities batch: ${batch.length} activities`);
  }

  /**
   * Gửi activities đồng bộ (cho beforeunload)
   */
  sendActivitiesSync() {
    if (this.activities.length === 0) return;

    // Use sendBeacon for reliable delivery
    if (navigator.sendBeacon) {
      const data = JSON.stringify({
        sessionId: this.sessionId,
        activities: this.activities,
        timestamp: new Date().toISOString(),
        type: "session_end",
      });

      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:3000/api";
      const token =
        localStorage.getItem("jwt_token") ||
        localStorage.getItem("accessToken");

      // Create a blob with the data
      const blob = new Blob([data], { type: "application/json" });
      navigator.sendBeacon(`${apiUrl}/user-activities/batch`, blob);
    }
  }

  /**
   * Tracking methods cho các activities cụ thể
   */

  // Track page view
  trackPageView(page = window.location.pathname) {
    this.trackActivity({
      type: "page.view",
      action: "Xem trang",
      data: {
        page,
        title: document.title,
        referrer: document.referrer,
      },
    });
  }

  // Track authentication
  trackAuth(type, success = true, details = {}) {
    this.trackActivity({
      type: `auth.${type}`,
      action: `${success ? "Thành công" : "Thất bại"} ${type}`,
      data: { success, ...details },
    });
  }

  // Track voting
  trackVote(contestantId, contestId) {
    this.trackActivity({
      type: "vote.cast",
      action: "Bỏ phiếu",
      data: { contestantId, contestId },
    });
  }

  // Track contest interaction
  trackContestInteraction(action, contestId, details = {}) {
    this.trackActivity({
      type: "contest.interaction",
      action,
      data: { contestId, ...details },
    });
  }

  // Track errors
  trackError(error, context = {}) {
    this.trackActivity({
      type: "error.occurred",
      action: "Lỗi xảy ra",
      data: {
        message: error.message || error,
        stack: error.stack,
        ...context,
      },
    });
  }

  // Track auto login
  trackAutoLogin(platform, status, details = {}) {
    this.trackActivity({
      type: "auto_login.request",
      action: `Yêu cầu đăng nhập tự động ${platform}`,
      data: { platform, status, ...details },
    });
  }

  /**
   * Utility methods
   */

  generateSessionId() {
    return `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  getDeviceType() {
    const userAgent = navigator.userAgent;
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) return "Mobile";
    if (/Tablet/.test(userAgent)) return "Tablet";
    return "Desktop";
  }

  getBrowserInfo() {
    const userAgent = navigator.userAgent;
    let browser = "Unknown";
    let version = "";

    if (userAgent.indexOf("Chrome") > -1) {
      browser = "Chrome";
      version = userAgent.match(/Chrome\/([0-9]+)/)?.[1] || "";
    } else if (userAgent.indexOf("Firefox") > -1) {
      browser = "Firefox";
      version = userAgent.match(/Firefox\/([0-9]+)/)?.[1] || "";
    } else if (
      userAgent.indexOf("Safari") > -1 &&
      userAgent.indexOf("Chrome") === -1
    ) {
      browser = "Safari";
      version = userAgent.match(/Version\/([0-9]+)/)?.[1] || "";
    } else if (userAgent.indexOf("Edge") > -1) {
      browser = "Edge";
      version = userAgent.match(/Edge\/([0-9]+)/)?.[1] || "";
    }

    return `${browser}${version ? ` ${version}` : ""}`;
  }

  generateActivityId() {
    return `activity_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  // Enable/disable tracking
  enable() {
    this.isEnabled = true;
    console.log("✅ UserActivityTracker enabled");
  }

  disable() {
    this.isEnabled = false;
    console.log("❌ UserActivityTracker disabled");
  }

  // Update configuration
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log("🔧 UserActivityTracker config updated:", this.config);
  }

  // Get current statistics
  getStats() {
    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      activitiesCount: this.activities.length,
      isEnabled: this.isEnabled,
      isConnected: this.socket?.connected || false,
      config: this.config,
    };
  }

  // Clear activities
  clearActivities() {
    this.activities = [];
    console.log("🗑️ Activities cleared");
  }
}

// Export singleton instance
const userActivityTracker = new UserActivityTracker();

// Track errors globally
window.addEventListener("error", (e) => {
  userActivityTracker.trackError(e.error, {
    filename: e.filename,
    lineno: e.lineno,
    colno: e.colno,
  });
});

// Track unhandled promise rejections
window.addEventListener("unhandledrejection", (e) => {
  userActivityTracker.trackError(e.reason, {
    type: "unhandled_promise_rejection",
  });
});

export default userActivityTracker;
