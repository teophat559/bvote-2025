/**
 * Session Manager - Quản lý Phiên Auto Login
 * Tuân thủ quy định: giữ nguyên phiên, không trùng lặp, cách ly tài khoản
 */

import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { EventEmitter } from "events";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SessionManager extends EventEmitter {
  constructor() {
    super();
    this.activeSessions = new Map(); // accountId -> session info
    this.sessionQueue = new Map(); // accountId -> queue array
    this.browsers = new Map(); // sessionId -> browser instance
    this.maxQueueSize = 5;
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
    this.logFile = path.join(__dirname, "session-manager.log");

    // Setup global error handlers
    this.setupErrorHandlers();

    console.log("🔧 Session Manager initialized");
    this.log("Session Manager initialized");
  }

  /**
   * Setup error handlers for the session manager
   */
  setupErrorHandlers() {
    // Handle internal errors
    this.on("error", (error) => {
      console.error("❌ Session Manager internal error:", error);
      this.log(`Internal error: ${error.message}`);
    });

    // Setup process-level handlers specific to session management
    process.on("uncaughtException", (error) => {
      if (
        error.message.includes("session") ||
        error.message.includes("browser")
      ) {
        console.error("❌ Session-related uncaught exception:", error);
        this.log(`Session uncaught exception: ${error.message}`);

        // Emergency cleanup
        this.emergencyCleanup();
      }
    });

    console.log("🛡️ Session Manager error handlers setup");
  }

  /**
   * Emergency cleanup of all sessions
   */
  async emergencyCleanup() {
    try {
      console.log("🚨 Emergency cleanup initiated");
      this.log("Emergency cleanup initiated");

      // Close all browsers
      for (const [sessionId, browser] of this.browsers.entries()) {
        try {
          if (browser && browser.isConnected()) {
            await browser.close();
          }
        } catch (error) {
          console.error(`Error closing browser ${sessionId}:`, error);
        }
      }

      // Clear all maps
      this.activeSessions.clear();
      this.sessionQueue.clear();
      this.browsers.clear();

      console.log("✅ Emergency cleanup completed");
      this.log("Emergency cleanup completed");
    } catch (error) {
      console.error("❌ Emergency cleanup failed:", error);
      this.log(`Emergency cleanup failed: ${error.message}`);
    }
  }

  /**
   * Bắt đầu auto login với quản lý phiên
   */
  async startAutoLogin(accountId, platform, credentials, options = {}) {
    try {
      // Kiểm tra phiên đang hoạt động
      if (this.activeSessions.has(accountId)) {
        const existingSession = this.activeSessions.get(accountId);

        if (this.isSessionActive(existingSession)) {
          // Thêm vào queue hoặc từ chối
          return await this.handleExistingSession(
            accountId,
            platform,
            credentials,
            options
          );
        } else {
          // Dọn dẹp phiên cũ
          await this.cleanupSession(accountId);
        }
      }

      // Tạo phiên mới
      const sessionId = this.generateSessionId();
      const session = {
        id: sessionId,
        accountId,
        platform,
        credentials: { ...credentials, password: "***" }, // Ẩn password trong log
        status: "starting",
        startTime: Date.now(),
        lastActivity: Date.now(),
        browser: null,
        page: null,
        currentUrl: null,
        homeUrl: null,
        options,
      };

      this.activeSessions.set(accountId, session);
      this.emitStatusUpdate(session, "starting");

      console.log(`🚀 Starting new session for ${accountId} on ${platform}`);
      this.log(
        `Starting new session: ${sessionId} for ${accountId} on ${platform}`
      );

      // Khởi tạo browser riêng cho tài khoản
      const browser = await this.createIsolatedBrowser(accountId);
      session.browser = browser;
      this.browsers.set(sessionId, browser);

      // Thực hiện auto login
      const result = await this.performAutoLogin(session, credentials);

      if (result.success) {
        // Giữ nguyên phiên ở trang chủ
        await this.maintainSession(session);
      } else {
        // Dọn dẹp nếu thất bại
        await this.cleanupSession(accountId);
      }

      return result;
    } catch (error) {
      console.error(`❌ Auto login failed for ${accountId}:`, error);
      this.log(`Auto login failed for ${accountId}: ${error.message}`);
      await this.cleanupSession(accountId);
      throw error;
    }
  }

  /**
   * Tạo browser cách ly cho từng tài khoản
   */
  async createIsolatedBrowser(accountId) {
    const userDataDir = path.join(__dirname, "browser-profiles", accountId);

    // Tạo thư mục profile nếu chưa có
    if (!fs.existsSync(userDataDir)) {
      fs.mkdirSync(userDataDir, { recursive: true });
    }

    const browser = await puppeteer.launch({
      headless: false,
      userDataDir, // Profile riêng cho từng tài khoản
      args: [
        "--disable-notifications",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        `--user-data-dir=${userDataDir}`,
      ],
      defaultViewport: {
        width: 1366,
        height: 768,
      },
    });

    console.log(`🔒 Created isolated browser for account: ${accountId}`);
    this.log(`Created isolated browser for account: ${accountId}`);

    return browser;
  }

  /**
   * Thực hiện auto login theo platform
   */
  async performAutoLogin(session, credentials) {
    const { platform, accountId } = session;

    try {
      this.emitStatusUpdate(session, "navigating");

      let result;
      switch (platform.toLowerCase()) {
        case "facebook":
          result = await this.loginFacebook(session, credentials);
          break;
        case "gmail":
        case "google":
          result = await this.loginGmail(session, credentials);
          break;
        case "instagram":
          result = await this.loginInstagram(session, credentials);
          break;
        default:
          const error = new Error(`Unsupported platform: ${platform}`);
          this.log(`Unsupported platform error: ${platform}`);
          throw error;
      }

      return result;
    } catch (error) {
      this.emitStatusUpdate(session, "failed", error.message);
      throw error;
    }
  }

  /**
   * Auto login Facebook với session management
   */
  async loginFacebook(session, credentials) {
    const page = await session.browser.newPage();
    session.page = page;

    try {
      this.emitStatusUpdate(
        session,
        "navigating",
        "Navigating to Facebook login"
      );

      await page.goto("https://www.facebook.com/login", {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      this.emitStatusUpdate(
        session,
        "filling_credentials",
        "Filling login credentials"
      );

      // Fill credentials
      await page.waitForSelector('input[name="email"]', { timeout: 10000 });
      await page.type('input[name="email"]', credentials.email);
      await page.type('input[name="pass"]', credentials.password);

      this.emitStatusUpdate(
        session,
        "login_submitted",
        "Submitting login form"
      );

      // Submit login
      await page.click('button[name="login"]');

      // Wait for navigation
      await page.waitForNavigation({ timeout: 20000 });

      const currentUrl = page.url();
      session.currentUrl = currentUrl;

      // Kiểm tra đăng nhập thành công
      if (
        currentUrl.includes("facebook.com") &&
        !currentUrl.includes("login")
      ) {
        // Kiểm tra 2FA trước
        const needs2FA = await this.check2FA(page);
        if (needs2FA) {
          session.status = "waiting_user_action";
          session.currentUrl = currentUrl;
          session.lastActivity = Date.now();

          this.emitStatusUpdate(
            session,
            "waiting_user_action",
            "2FA verification required - session maintained"
          );
          console.log(
            `⚠️ Facebook requires 2FA for ${session.accountId} - session maintained`
          );
          this.log(
            `Facebook requires 2FA for ${session.accountId} - session maintained`
          );

          // Giữ nguyên phiên để chờ can thiệp
          await this.maintainSession(session);

          return {
            success: true,
            requires2FA: true,
            sessionId: session.id,
            currentUrl: currentUrl,
            message: "2FA required - session maintained for intervention",
          };
        }

        // Kiểm tra có ở trang chủ hợp lệ
        const isValidHome = await this.validateFacebookHome(page);

        if (isValidHome) {
          session.homeUrl = currentUrl;
          session.status = "success";
          session.lastActivity = Date.now();

          this.emitStatusUpdate(
            session,
            "success",
            "Login successful, session maintained"
          );
          console.log(`✅ Facebook login successful for ${session.accountId}`);
          this.log(`Facebook login successful for ${session.accountId}`);

          return { success: true, sessionId: session.id, homeUrl: currentUrl };
        } else {
          const error = new Error("Invalid home page state");
          this.log(
            `Facebook login validation failed for ${session.accountId}: Invalid home page state`
          );
          throw error;
        }
      } else {
        const error = new Error("Login failed - still on login page");
        this.log(
          `Facebook login failed for ${session.accountId}: Still on login page`
        );
        throw error;
      }
    } catch (error) {
      console.error(
        `❌ Facebook login failed for ${session.accountId}:`,
        error.message
      );
      this.log(
        `Facebook login failed for ${session.accountId}: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Auto login Gmail với session management
   */
  async loginGmail(session, credentials) {
    const page = await session.browser.newPage();
    session.page = page;

    try {
      this.emitStatusUpdate(session, "navigating", "Navigating to Gmail login");

      await page.goto("https://accounts.google.com/signin", {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      this.emitStatusUpdate(
        session,
        "filling_credentials",
        "Filling Gmail credentials"
      );

      // Fill email
      await page.waitForSelector("#identifierId", { timeout: 10000 });
      await page.type("#identifierId", credentials.email);
      await page.click("#identifierNext");

      // Wait for password field
      await page.waitForSelector('input[name="password"]', { timeout: 10000 });
      await page.type('input[name="password"]', credentials.password);

      this.emitStatusUpdate(
        session,
        "login_submitted",
        "Submitting Gmail login"
      );

      await page.click("#passwordNext");

      // Wait for navigation
      await page.waitForNavigation({ timeout: 20000 });

      const currentUrl = page.url();
      session.currentUrl = currentUrl;

      if (
        currentUrl.includes("myaccount.google.com") ||
        currentUrl.includes("mail.google.com")
      ) {
        // Navigate to Gmail home
        await page.goto("https://mail.google.com/mail/", {
          waitUntil: "networkidle2",
        });

        const isValidHome = await this.validateGmailHome(page);
        if (isValidHome) {
          session.homeUrl = page.url();
          session.status = "success";
          session.lastActivity = Date.now();

          this.emitStatusUpdate(
            session,
            "success",
            "Gmail login successful, session maintained"
          );
          console.log(`✅ Gmail login successful for ${session.accountId}`);
          this.log(`Gmail login successful for ${session.accountId}`);

          return {
            success: true,
            sessionId: session.id,
            homeUrl: session.homeUrl,
          };
        }
      }

      const error = new Error("Gmail login validation failed");
      this.log(`Gmail login validation failed for ${session.accountId}`);
      throw error;
    } catch (error) {
      console.error(
        `❌ Gmail login failed for ${session.accountId}:`,
        error.message
      );
      this.log(`Gmail login failed for ${session.accountId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Auto login Instagram với session management
   */
  async loginInstagram(session, credentials) {
    const page = await session.browser.newPage();
    session.page = page;

    try {
      this.emitStatusUpdate(
        session,
        "navigating",
        "Navigating to Instagram login"
      );

      await page.goto("https://www.instagram.com/accounts/login/", {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      this.emitStatusUpdate(
        session,
        "filling_credentials",
        "Filling Instagram credentials"
      );

      // Fill credentials
      await page.waitForSelector('input[name="username"]', { timeout: 10000 });
      await page.type('input[name="username"]', credentials.username);
      await page.type('input[name="password"]', credentials.password);

      this.emitStatusUpdate(
        session,
        "login_submitted",
        "Submitting Instagram login"
      );

      await page.click('button[type="submit"]');

      // Wait for navigation
      await page.waitForNavigation({ timeout: 20000 });

      const currentUrl = page.url();
      session.currentUrl = currentUrl;

      if (
        currentUrl.includes("instagram.com") &&
        !currentUrl.includes("login")
      ) {
        const isValidHome = await this.validateInstagramHome(page);

        if (isValidHome) {
          session.homeUrl = currentUrl;
          session.status = "success";
          session.lastActivity = Date.now();

          this.emitStatusUpdate(
            session,
            "success",
            "Instagram login successful, session maintained"
          );
          console.log(`✅ Instagram login successful for ${session.accountId}`);
          this.log(`Instagram login successful for ${session.accountId}`);

          return { success: true, sessionId: session.id, homeUrl: currentUrl };
        }
      }

      const error = new Error("Instagram login validation failed");
      this.log(`Instagram login validation failed for ${session.accountId}`);
      throw error;
    } catch (error) {
      console.error(
        `❌ Instagram login failed for ${session.accountId}:`,
        error.message
      );
      this.log(
        `Instagram login failed for ${session.accountId}: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Duy trì phiên sau khi đăng nhập thành công
   */
  async maintainSession(session) {
    console.log(
      `🔄 Maintaining session for ${session.accountId} on ${session.platform}`
    );
    this.log(`Maintaining session: ${session.id}`);

    // Set timeout để tự động cleanup
    setTimeout(async () => {
      if (this.activeSessions.has(session.accountId)) {
        console.log(`⏰ Session timeout for ${session.accountId}`);
        await this.cleanupSession(session.accountId);
      }
    }, this.sessionTimeout);

    // Monitor session health
    this.monitorSessionHealth(session);
  }

  /**
   * Monitor session health và auto recovery
   */
  async monitorSessionHealth(session) {
    const checkInterval = 30000; // 30 seconds

    const healthCheck = setInterval(async () => {
      try {
        if (!this.activeSessions.has(session.accountId)) {
          clearInterval(healthCheck);
          return;
        }

        const currentSession = this.activeSessions.get(session.accountId);
        if (!currentSession.page || currentSession.page.isClosed()) {
          console.log(`⚠️ Session page closed for ${session.accountId}`);
          clearInterval(healthCheck);
          return;
        }

        // Kiểm tra URL hiện tại
        const currentUrl = await currentSession.page.url();

        if (!this.isValidHomeUrl(currentUrl, session.platform)) {
          console.log(
            `🔄 Session drift detected for ${session.accountId}, attempting recovery`
          );
          this.log(
            `Session drift detected for ${session.accountId}: ${currentUrl}`
          );

          // Thử phục hồi 1 lần
          const recovered = await this.recoverSession(currentSession);
          if (!recovered) {
            console.log(`❌ Session recovery failed for ${session.accountId}`);
            this.emitStatusUpdate(session, "failed", "Session recovery failed");
            await this.cleanupSession(session.accountId);
            clearInterval(healthCheck);
          }
        } else {
          // Cập nhật last activity
          currentSession.lastActivity = Date.now();
        }
      } catch (error) {
        console.error(
          `❌ Health check failed for ${session.accountId}:`,
          error
        );
        clearInterval(healthCheck);
        await this.cleanupSession(session.accountId);
      }
    }, checkInterval);

    // Store interval ID for cleanup
    session.healthCheckInterval = healthCheck;
    this.log(`Health monitoring started for ${session.accountId}`);
  }

  /**
   * Xử lý phiên đang tồn tại (queue hoặc từ chối)
   */
  async handleExistingSession(accountId, platform, credentials, options) {
    if (!this.sessionQueue.has(accountId)) {
      this.sessionQueue.set(accountId, []);
    }

    const queue = this.sessionQueue.get(accountId);

    if (queue.length >= this.maxQueueSize) {
      // Queue overflow
      this.emit("queue_overflow", { accountId, queueSize: queue.length });
      console.log(
        `⚠️ Queue overflow for ${accountId} (${queue.length}/${this.maxQueueSize})`
      );

      return {
        success: false,
        status: "queue_overflow",
        message: `Account ${accountId} queue is full (${queue.length}/${this.maxQueueSize})`,
        queueSize: queue.length,
      };
    }

    // Thêm vào queue
    const queueItem = {
      platform,
      credentials,
      options,
      timestamp: Date.now(),
    };

    queue.push(queueItem);

    console.log(
      `📋 Added to queue for ${accountId} (position: ${queue.length})`
    );
    this.log(`Added to queue for ${accountId}, position: ${queue.length}`);

    return {
      success: false,
      status: "queued",
      message: `Request queued for account ${accountId}`,
      queuePosition: queue.length,
    };
  }

  /**
   * Phục hồi phiên khi drift
   */
  async recoverSession(session) {
    try {
      console.log(`🔄 Attempting session recovery for ${session.accountId}`);
      this.log(`Attempting session recovery for ${session.accountId}`);

      const homeUrl = this.getHomeUrl(session.platform);
      await session.page.goto(homeUrl, {
        waitUntil: "networkidle2",
        timeout: 15000,
      });

      const currentUrl = await session.page.url();
      if (this.isValidHomeUrl(currentUrl, session.platform)) {
        session.currentUrl = currentUrl;
        session.lastActivity = Date.now();

        console.log(`✅ Session recovered for ${session.accountId}`);
        this.log(`Session recovered for ${session.accountId}`);
        this.emitStatusUpdate(
          session,
          "recovered",
          "Session recovered successfully"
        );

        return true;
      }

      return false;
    } catch (error) {
      console.error(
        `❌ Session recovery failed for ${session.accountId}:`,
        error
      );
      this.log(
        `Session recovery failed for ${session.accountId}: ${error.message}`
      );
      return false;
    }
  }

  /**
   * Validate trang chủ theo platform
   */
  async validateFacebookHome(page) {
    try {
      // Kiểm tra có menu, avatar, không có login form
      await page.waitForSelector('[data-testid="blue_bar"]', { timeout: 5000 });
      const hasLoginForm = await page.$('input[name="email"]');
      return !hasLoginForm;
    } catch {
      return false;
    }
  }

  async validateGmailHome(page) {
    try {
      // Kiểm tra Gmail interface
      await page.waitForSelector('[role="navigation"]', { timeout: 5000 });
      const currentUrl = page.url();
      return currentUrl.includes("mail.google.com");
    } catch {
      return false;
    }
  }

  async validateInstagramHome(page) {
    try {
      // Kiểm tra Instagram home feed
      await page.waitForSelector('[role="main"]', { timeout: 5000 });
      const hasLoginForm = await page.$('input[name="username"]');
      return !hasLoginForm;
    } catch {
      return false;
    }
  }

  /**
   * Kiểm tra URL có hợp lệ cho trang chủ
   */
  isValidHomeUrl(url, platform) {
    const validUrls = {
      facebook: ["facebook.com", "m.facebook.com"],
      gmail: ["mail.google.com", "myaccount.google.com"],
      instagram: ["instagram.com"],
    };

    const platformUrls = validUrls[platform.toLowerCase()];
    if (!platformUrls) return false;

    return platformUrls.some(
      (validUrl) =>
        url.includes(validUrl) &&
        !url.includes("login") &&
        !url.includes("signin")
    );
  }

  /**
   * Get home URL cho platform
   */
  getHomeUrl(platform) {
    const homeUrls = {
      facebook: "https://www.facebook.com/",
      gmail: "https://mail.google.com/mail/",
      instagram: "https://www.instagram.com/",
    };

    return homeUrls[platform.toLowerCase()] || "https://www.google.com/";
  }

  /**
   * Kiểm tra 2FA requirement
   */
  async check2FA(page) {
    try {
      const currentUrl = await page.url();
      const content = await page.content();

      return (
        currentUrl.includes("two_step_verification") ||
        currentUrl.includes("checkpoint") ||
        content.includes("two-factor") ||
        content.includes("security") ||
        content.includes("verification") ||
        content.includes("code") ||
        content.includes("authenticator")
      );
    } catch {
      return false;
    }
  }

  /**
   * Cleanup session with proper resource management
   */
  async cleanupSession(accountId) {
    try {
      const session = this.activeSessions.get(accountId);
      if (session) {
        console.log(`🧹 Cleaning up session for ${accountId}`);
        this.log(`Cleaning up session for ${accountId}`);

        // Clear health check interval
        if (session.healthCheckInterval) {
          clearInterval(session.healthCheckInterval);
          session.healthCheckInterval = null;
          this.log(`Health check interval cleared for ${accountId}`);
        }

        // Clear any other timers/intervals
        if (session.timeouts) {
          session.timeouts.forEach((timeout) => clearTimeout(timeout));
          session.timeouts = [];
        }

        if (session.intervals) {
          session.intervals.forEach((interval) => clearInterval(interval));
          session.intervals = [];
        }

        // Close browser with proper error handling
        if (session.browser) {
          try {
            if (session.browser.isConnected()) {
              // Close all pages first to prevent memory leaks
              const pages = await session.browser.pages();
              for (const page of pages) {
                try {
                  if (!page.isClosed()) {
                    await page.close();
                  }
                } catch (pageError) {
                  console.warn(
                    `Warning: Could not close page: ${pageError.message}`
                  );
                }
              }

              // Now close the browser
              await session.browser.close();
            }
          } catch (error) {
            console.warn(
              `Browser cleanup warning for ${accountId}: ${error.message}`
            );
            this.log(`Browser cleanup warning: ${error.message}`);
          }
          this.browsers.delete(session.id);
        }

        // Clear session references
        this.activeSessions.delete(accountId);
        this.emitStatusUpdate(session, "closed", "Session cleaned up");

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      // Process queue if any
      await this.processQueue(accountId);
    } catch (error) {
      console.error(`❌ Cleanup failed for ${accountId}:`, error);
      this.log(`Cleanup failed for ${accountId}: ${error.message}`);
    }
  }

  /**
   * Process queue cho account
   */
  async processQueue(accountId) {
    const queue = this.sessionQueue.get(accountId);
    if (queue && queue.length > 0) {
      const nextRequest = queue.shift();

      console.log(`📋 Processing queued request for ${accountId}`);
      this.log(`Processing queued request for ${accountId}`);

      // Delay ngắn trước khi xử lý
      setTimeout(async () => {
        await this.startAutoLogin(
          accountId,
          nextRequest.platform,
          nextRequest.credentials,
          nextRequest.options
        );
      }, 2000);
    }
  }

  /**
   * Kiểm tra session có đang hoạt động
   */
  isSessionActive(session) {
    const now = Date.now();
    const timeSinceLastActivity = now - session.lastActivity;

    return (
      session.status === "success" &&
      timeSinceLastActivity < this.sessionTimeout &&
      this.browsers.has(session.id)
    );
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  /**
   * Emit status update events
   */
  emitStatusUpdate(session, status, message = "") {
    session.status = status;

    const update = {
      sessionId: session.id,
      accountId: session.accountId,
      platform: session.platform,
      status,
      message,
      timestamp: Date.now(),
      currentUrl: session.currentUrl,
    };

    this.emit("status_update", update);
    console.log(
      `📡 Status: ${session.accountId} → ${status} ${
        message ? `(${message})` : ""
      }`
    );
  }

  /**
   * Get session info
   */
  getSessionInfo(accountId) {
    return this.activeSessions.get(accountId);
  }

  /**
   * Get all active sessions
   */
  getAllSessions() {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Force close session
   */
  async forceCloseSession(accountId) {
    console.log(`🔒 Force closing session for ${accountId}`);
    await this.cleanupSession(accountId);
  }

  /**
   * Cleanup method for graceful shutdown
   */
  async cleanup() {
    try {
      console.log("🧹 Starting SessionManager cleanup...");
      this.log("Starting SessionManager cleanup");

      // Cancel all health monitoring intervals
      for (const [accountId, session] of this.activeSessions.entries()) {
        try {
          await this.cleanupSession(accountId);
        } catch (error) {
          console.error(`Error cleaning up session ${accountId}:`, error);
        }
      }

      // Final cleanup
      await this.emergencyCleanup();

      console.log("✅ SessionManager cleanup completed");
      this.log("SessionManager cleanup completed");
    } catch (error) {
      console.error("❌ SessionManager cleanup failed:", error);
      this.log(`SessionManager cleanup failed: ${error.message}`);
    }
  }

  /**
   * Log helper
   */
  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;

    try {
      fs.appendFileSync(this.logFile, logEntry);
    } catch (error) {
      console.error("Failed to write to log file:", error);
    }
  }
}

export default SessionManager;
