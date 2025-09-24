/**
 * Enhanced Auto Login System
 * Triển khai đầy đủ quy định Auto Đăng Nhập & Quản lý Phiên
 */

const SessionManager = require("./session-manager.js");

class EnhancedAutoLogin {
  constructor() {
    this.sessionManager = new SessionManager();
    this.setupEventListeners();

    console.log("🚀 Enhanced Auto Login System initialized");
  }

  /**
   * Setup event listeners cho session manager
   */
  setupEventListeners() {
    this.sessionManager.on("status_update", (update) => {
      this.handleStatusUpdate(update);
    });

    this.sessionManager.on("queue_overflow", (data) => {
      console.log(
        `⚠️ QUEUE OVERFLOW: Account ${data.accountId} has ${data.queueSize} pending requests`
      );
      // Có thể gửi alert đến Admin ở đây
    });
  }

  /**
   * Xử lý status updates và gửi về Admin/User
   */
  handleStatusUpdate(update) {
    const statusMessages = {
      starting: "🚀 Khởi tạo phiên đăng nhập",
      navigating: "🌐 Đang điều hướng đến trang login",
      filling_credentials: "📝 Đang điền thông tin đăng nhập",
      login_submitted: "⏳ Đã gửi form đăng nhập",
      waiting_user_action: "⏸️ Chờ can thiệp từ user (2FA/Captcha)",
      success: "✅ Đăng nhập thành công, duy trì phiên",
      failed: "❌ Đăng nhập thất bại",
      recovered: "🔄 Phục hồi phiên thành công",
      closed: "🔒 Phiên đã được đóng",
    };

    const message = statusMessages[update.status] || update.status;
    console.log(
      `📡 [${update.accountId}] ${message} ${
        update.message ? `- ${update.message}` : ""
      }`
    );

    // Gửi real-time update đến Admin/User interfaces
    this.broadcastToClients(update);
  }

  /**
   * Broadcast updates đến clients (Admin/User)
   */
  broadcastToClients(update) {
    // Trong thực tế sẽ gửi qua WebSocket/SSE
    // Ở đây chỉ log để demo
    const clientUpdate = {
      type: "auto_login_status",
      data: {
        sessionId: update.sessionId,
        accountId: update.accountId,
        platform: update.platform,
        status: update.status,
        message: update.message,
        timestamp: update.timestamp,
        currentUrl: update.currentUrl,
      },
    };

    // Simulate sending to Admin dashboard
    console.log(`📤 → Admin: ${JSON.stringify(clientUpdate, null, 2)}`);

    // Simulate sending to User interface
    console.log(`📤 → User: Status updated for ${update.platform} login`);
  }

  /**
   * API: Bắt đầu auto login
   */
  async startLogin(accountId, platform, credentials, options = {}) {
    try {
      console.log(`\n🎯 Starting auto login: ${accountId} → ${platform}`);

      const result = await this.sessionManager.startAutoLogin(
        accountId,
        platform,
        credentials,
        options
      );

      return result;
    } catch (error) {
      console.error(`❌ Auto login failed:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * API: Lấy thông tin phiên
   */
  getSessionInfo(accountId) {
    const session = this.sessionManager.getSessionInfo(accountId);
    if (!session) {
      return { exists: false };
    }

    return {
      exists: true,
      sessionId: session.id,
      platform: session.platform,
      status: session.status,
      startTime: session.startTime,
      lastActivity: session.lastActivity,
      currentUrl: session.currentUrl,
      homeUrl: session.homeUrl,
    };
  }

  /**
   * API: Lấy tất cả phiên đang hoạt động
   */
  getAllActiveSessions() {
    return this.sessionManager.getAllSessions().map((session) => ({
      sessionId: session.id,
      accountId: session.accountId,
      platform: session.platform,
      status: session.status,
      startTime: session.startTime,
      lastActivity: session.lastActivity,
      currentUrl: session.currentUrl,
    }));
  }

  /**
   * API: Đóng phiên
   */
  async closeSession(accountId) {
    console.log(`🔒 Closing session for ${accountId}`);
    await this.sessionManager.forceCloseSession(accountId);

    return {
      success: true,
      message: `Session closed for ${accountId}`,
    };
  }

  /**
   * Demo: Chạy multiple logins với session management
   */
  async runMultipleLoginsDemo() {
    console.log("\n🎬 === MULTIPLE LOGINS DEMO ===");
    console.log("Testing session management với multiple accounts");

    const testAccounts = [
      {
        accountId: "user1_facebook",
        platform: "facebook",
        credentials: {
          email: process.env.FB_EMAIL,
          password: process.env.FB_PASSWORD,
        },
      },
      {
        accountId: "user1_gmail",
        platform: "gmail",
        credentials: {
          email: process.env.GMAIL_EMAIL,
          password: process.env.GMAIL_PASSWORD,
        },
      },
      {
        accountId: "user1_instagram",
        platform: "instagram",
        credentials: {
          username: process.env.IG_USERNAME,
          password: process.env.IG_PASSWORD,
        },
      },
    ];

    // Start logins simultaneously để test session isolation
    const promises = testAccounts
      .filter(
        (account) => account.credentials.email || account.credentials.username
      )
      .map((account) =>
        this.startLogin(
          account.accountId,
          account.platform,
          account.credentials
        )
      );

    const results = await Promise.allSettled(promises);

    console.log("\n📊 Multiple Logins Results:");
    results.forEach((result, index) => {
      const account = testAccounts[index];
      if (result.status === "fulfilled") {
        const status = result.value.success ? "✅" : "⚠️";
        console.log(
          `${status} ${account.accountId}: ${result.value.status ||
            "completed"}`
        );
      } else {
        console.log(`❌ ${account.accountId}: ${result.reason.message}`);
      }
    });

    // Show active sessions
    console.log("\n📋 Active Sessions:");
    const activeSessions = this.getAllActiveSessions();
    activeSessions.forEach((session) => {
      console.log(
        `🔗 ${session.accountId} (${session.platform}): ${session.status}`
      );
    });

    return results;
  }
}

// Export for use
module.exports = EnhancedAutoLogin;

// Run if called directly
if (require.main === module) {
  const autoLogin = new EnhancedAutoLogin();

  // Check command line args
  const args = process.argv.slice(2);

  if (args.includes("--demo")) {
    autoLogin.runMultipleLoginsDemo().catch(console.error);
  } else if (args.includes("--single")) {
    // Single login test
    const accountId = "test_user_facebook";
    const platform = "facebook";
    const credentials = {
      email: process.env.FB_EMAIL,
      password: process.env.FB_PASSWORD,
    };

    if (credentials.email && credentials.password) {
      autoLogin
        .startLogin(accountId, platform, credentials)
        .catch(console.error);
    } else {
      console.log("⚠️ No Facebook credentials provided");
    }
  } else {
    console.log(`
🎯 Enhanced Auto Login System

Usage:
  node enhanced-auto-login.js --demo     # Multiple accounts demo
  node enhanced-auto-login.js --single   # Single Facebook login

Environment Variables:
  FB_EMAIL, FB_PASSWORD      # Facebook credentials
  GMAIL_EMAIL, GMAIL_PASSWORD # Gmail credentials
  IG_USERNAME, IG_PASSWORD   # Instagram credentials
    `);
  }
}
