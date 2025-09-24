/**
 * System Monitor - Runbook Implementation
 * Xử lý nhanh theo thứ tự ưu tiên: OOM, stability, resource management
 */

const fs = require("fs");
const path = require("path");
const { EventEmitter } = require("events");
const os = require("os");

class SystemMonitor extends EventEmitter {
  constructor() {
    super();
    this.logFile = path.join(__dirname, "system-monitor.log");
    this.processMetrics = new Map();
    this.browserProcesses = new Map();
    this.concurrentLimit = 1; // Bắt đầu với 1 phiên/tiến trình
    this.activeSessions = 0;
    this.memoryThreshold = 80; // 80% memory usage warning
    this.isVPSEnvironment = this.detectVPSEnvironment();

    this.startMonitoring();
    this.log("info", "System Monitor initialized", {
      isVPS: this.isVPSEnvironment,
      concurrentLimit: this.concurrentLimit,
    });
  }

  /**
   * 1. Xác nhận có OOM/crash hệ thống
   */
  async checkSystemHealth() {
    const health = {
      memory: this.getMemoryUsage(),
      processes: this.getProcessHealth(),
      browserCrashes: await this.checkBrowserCrashes(),
      oomKills: await this.checkOOMKills(),
      timestamp: Date.now(),
    };

    // Kiểm tra OOM
    if (health.memory.usage > this.memoryThreshold) {
      this.log("warn", "High memory usage detected", {
        usage: health.memory.usage,
        threshold: this.memoryThreshold,
      });

      await this.handleHighMemoryUsage();
    }

    // Kiểm tra browser crashes
    if (health.browserCrashes.length > 0) {
      this.log("error", "Browser crashes detected", {
        crashes: health.browserCrashes.length,
      });

      await this.handleBrowserCrashes();
    }

    return health;
  }

  /**
   * Detect VPS environment
   */
  detectVPSEnvironment() {
    const platform = os.platform();
    const isLinux = platform === "linux";
    const hasLimitedRAM = os.totalmem() < 4 * 1024 * 1024 * 1024; // < 4GB

    return isLinux && hasLimitedRAM;
  }

  /**
   * Get memory usage
   */
  getMemoryUsage() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const usage = (used / total) * 100;

    return {
      total: Math.round(total / 1024 / 1024), // MB
      used: Math.round(used / 1024 / 1024), // MB
      free: Math.round(free / 1024 / 1024), // MB
      usage: Math.round(usage), // %
    };
  }

  /**
   * Get process health
   */
  getProcessHealth() {
    const processes = {
      current: {
        pid: process.pid,
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        cpu: process.cpuUsage(),
      },
      browsers: Array.from(this.browserProcesses.values()),
      total: this.browserProcesses.size,
    };

    return processes;
  }

  /**
   * Check for browser crashes in logs
   */
  async checkBrowserCrashes() {
    try {
      const logContent = fs.readFileSync(this.logFile, "utf8");
      const crashPatterns = [
        "Protocol error",
        "Target closed",
        "Browser process crashed",
        "Connection terminated",
        "Navigation timeout",
      ];

      const crashes = [];
      crashPatterns.forEach((pattern) => {
        const matches = logContent.match(new RegExp(pattern, "gi"));
        if (matches) {
          crashes.push({ pattern, count: matches.length });
        }
      });

      return crashes;
    } catch {
      return [];
    }
  }

  /**
   * Check for OOM kills
   */
  async checkOOMKills() {
    try {
      if (this.isVPSEnvironment) {
        // Check dmesg for OOM kills on Linux
        const { exec } = require("child_process");
        return new Promise((resolve) => {
          exec(
            'dmesg | grep -i "killed process\\|out of memory" | tail -5',
            (error, stdout) => {
              if (error) {
                resolve([]);
              } else {
                const oomEvents = stdout
                  .split("\n")
                  .filter((line) => line.trim());
                resolve(oomEvents);
              }
            }
          );
        });
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Handle high memory usage
   */
  async handleHighMemoryUsage() {
    this.log("warn", "Handling high memory usage", {
      action: "reducing_concurrent_sessions",
    });

    // Giảm concurrent limit
    if (this.concurrentLimit > 1) {
      this.concurrentLimit = Math.max(1, this.concurrentLimit - 1);
      this.emit("concurrent_limit_reduced", this.concurrentLimit);
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      this.log("info", "Forced garbage collection");
    }

    // Alert admin
    this.emit("memory_alert", {
      usage: this.getMemoryUsage(),
      action: "reduced_concurrent_limit",
      newLimit: this.concurrentLimit,
    });
  }

  /**
   * Handle browser crashes
   */
  async handleBrowserCrashes() {
    this.log("error", "Handling browser crashes", {
      action: "implementing_auto_restart",
    });

    // Implement auto-restart mechanism
    this.emit("browser_crash_detected", {
      action: "restart_required",
      timestamp: Date.now(),
    });
  }

  /**
   * 2. Optimized browser configuration for VPS
   */
  getOptimizedBrowserConfig(accountId) {
    const baseConfig = {
      headless: false,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage", // Giảm shared memory usage
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--disable-features=TranslateUI",
        "--disable-ipc-flooding-protection",
        "--disable-extensions",
        "--disable-default-apps",
        "--disable-sync",
        "--disable-background-networking",
        "--disable-notifications",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
      ],
      defaultViewport: {
        width: 1366,
        height: 768,
      },
      timeout: 60000,
    };

    // VPS specific optimizations
    if (this.isVPSEnvironment) {
      baseConfig.args.push(
        "--memory-pressure-off",
        "--max_old_space_size=1024", // Limit V8 heap
        "--disable-background-mode",
        "--disable-plugins",
        "--disable-images", // Disable image loading to save memory
        "--disable-javascript", // For login pages that work without JS
        "--single-process" // Use single process mode
      );

      // Use system Chrome if available
      const chromePaths = [
        "/usr/bin/google-chrome",
        "/usr/bin/chromium-browser",
        "/opt/google/chrome/chrome",
      ];

      for (const chromePath of chromePaths) {
        if (fs.existsSync(chromePath)) {
          baseConfig.executablePath = chromePath;
          break;
        }
      }
    }

    // Create isolated user data directory
    const userDataDir = path.join(__dirname, "browser-profiles", accountId);
    if (!fs.existsSync(userDataDir)) {
      fs.mkdirSync(userDataDir, { recursive: true });
    }
    baseConfig.userDataDir = userDataDir;

    this.log("info", "Browser config optimized", {
      accountId,
      isVPS: this.isVPSEnvironment,
      executablePath: baseConfig.executablePath || "default",
    });

    return baseConfig;
  }

  /**
   * 3. Job assignment (race condition prevention)
   */
  async assignJob(accountId, platform, requestId) {
    const jobKey = `${accountId}_${platform}`;
    const assignment = {
      requestId,
      botId: process.pid,
      assignedAt: Date.now(),
      status: "assigned",
      accountId,
      platform,
    };

    // Atomic job assignment check
    if (this.processMetrics.has(jobKey)) {
      const existingJob = this.processMetrics.get(jobKey);
      const timeSinceAssigned = Date.now() - existingJob.assignedAt;

      // If job is recent (< 5 minutes), reject
      if (timeSinceAssigned < 5 * 60 * 1000) {
        this.log("warn", "Job assignment rejected - already assigned", {
          jobKey,
          existingBot: existingJob.botId,
          currentBot: process.pid,
        });

        return {
          assigned: false,
          reason: "already_assigned",
          existingBot: existingJob.botId,
        };
      }
    }

    // Assign job
    this.processMetrics.set(jobKey, assignment);
    this.activeSessions++;

    this.log("info", "Job assigned successfully", {
      jobKey,
      botId: process.pid,
      activeSessions: this.activeSessions,
    });

    return { assigned: true, assignment };
  }

  /**
   * 4. Enhanced timeout management
   */
  getTimeoutConfig(action) {
    const timeouts = {
      navigation: 30000, // Page navigation
      selector_wait: 15000, // Wait for selectors
      input_typing: 5000, // Typing input
      button_click: 3000, // Button clicks
      form_submit: 20000, // Form submission
      otp_wait: 300000, // 5 minutes for OTP
      page_load: 45000, // Full page load
    };

    if (this.isVPSEnvironment) {
      // Increase timeouts for VPS
      Object.keys(timeouts).forEach((key) => {
        timeouts[key] = Math.round(timeouts[key] * 1.5);
      });
    }

    return timeouts[action] || 10000;
  }

  /**
   * 5. Structured logging with levels
   */
  log(level, message, metadata = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      metadata: {
        ...metadata,
        pid: process.pid,
        memory: this.getMemoryUsage(),
        activeSessions: this.activeSessions,
      },
    };

    // Console output with colors
    const colors = {
      INFO: "\x1b[36m", // Cyan
      WARN: "\x1b[33m", // Yellow
      ERROR: "\x1b[31m", // Red
      DEBUG: "\x1b[90m", // Gray
      RESET: "\x1b[0m",
    };

    const color = colors[level.toUpperCase()] || colors.INFO;
    console.log(
      `${color}[${logEntry.timestamp}] [${logEntry.level}] ${message}${colors.RESET}`
    );

    if (Object.keys(metadata).length > 0) {
      console.log(
        `${color}  Metadata: ${JSON.stringify(metadata, null, 2)}${
          colors.RESET
        }`
      );
    }

    // Write to file
    fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + "\n");

    // Emit for real-time UI
    this.emit("log_entry", logEntry);
  }

  /**
   * 6. Process lifecycle management
   */
  async createManagedBrowser(accountId, platform) {
    try {
      // Check if we can create new session
      if (this.activeSessions >= this.concurrentLimit) {
        const errorMessage = `Concurrent limit reached: ${this.activeSessions}/${this.concurrentLimit}`;
        this.log("warn", "Concurrent limit reached", {
          activeSessions: this.activeSessions,
          concurrentLimit: this.concurrentLimit,
        });

        const error = new Error(errorMessage);
        throw error;
      }

      const config = this.getOptimizedBrowserConfig(accountId);
      this.log("info", "Creating managed browser", {
        accountId,
        platform,
        config: {
          headless: config.headless,
          argsCount: config.args.length,
          userDataDir: config.userDataDir,
        },
      });

      const puppeteer = require("puppeteer");
      const browser = await puppeteer.launch(config);

      // Track browser process
      const browserProcess = {
        pid: browser.process()?.pid,
        accountId,
        platform,
        startTime: Date.now(),
        lastActivity: Date.now(),
        status: "active",
      };

      this.browserProcesses.set(accountId, browserProcess);

      // Setup process monitoring
      this.setupBrowserMonitoring(browser, accountId);

      this.log("info", "Managed browser created successfully", {
        accountId,
        platform,
        pid: browserProcess.pid,
      });

      return browser;
    } catch (error) {
      this.log("error", "Failed to create managed browser", {
        accountId,
        platform,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Setup browser monitoring
   */
  setupBrowserMonitoring(browser, accountId) {
    // Monitor browser process
    if (browser.process()) {
      browser.process().on("exit", (code, signal) => {
        this.log("warn", "Browser process exited", {
          accountId,
          exitCode: code,
          signal,
          unexpected: code !== 0,
        });

        this.browserProcesses.delete(accountId);
        this.activeSessions = Math.max(0, this.activeSessions - 1);

        if (code !== 0) {
          this.emit("browser_crash", { accountId, exitCode: code, signal });
        }
      });
    }

    // Monitor disconnection
    browser.on("disconnected", () => {
      this.log("warn", "Browser disconnected", { accountId });
      this.browserProcesses.delete(accountId);
      this.activeSessions = Math.max(0, this.activeSessions - 1);
    });
  }

  /**
   * 7. Enhanced page operations with proper waits
   */
  async safePageOperation(page, operation, operationName, accountId) {
    const timeout = this.getTimeoutConfig(operationName);
    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        this.log("debug", `Attempting ${operationName}`, {
          accountId,
          attempt: retryCount + 1,
          timeout,
        });

        const result = await Promise.race([
          operation(),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error(`${operationName} timeout`)),
              timeout
            )
          ),
        ]);

        this.log("info", `${operationName} completed successfully`, {
          accountId,
          attempt: retryCount + 1,
        });

        return result;
      } catch (error) {
        retryCount++;

        this.log("warn", `${operationName} failed`, {
          accountId,
          attempt: retryCount,
          error: error.message,
          willRetry: retryCount <= maxRetries,
        });

        if (retryCount <= maxRetries) {
          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } else {
          this.log("error", `${operationName} failed after all retries`, {
            accountId,
            totalAttempts: retryCount,
            error: error.message,
          });
          throw error;
        }
      }
    }
  }

  /**
   * 8. OTP/Checkpoint management
   */
  async handleOTPCheckpoint(page, accountId, platform) {
    this.log("info", "OTP/Checkpoint detected", {
      accountId,
      platform,
      currentUrl: await page.url(),
    });

    const otpSession = {
      accountId,
      platform,
      startTime: Date.now(),
      status: "waiting_otp",
      timeoutAt: Date.now() + this.getTimeoutConfig("otp_wait"),
    };

    // Update status
    this.emit("otp_required", {
      accountId,
      platform,
      sessionId: otpSession.sessionId,
      timeoutAt: otpSession.timeoutAt,
      message: "OTP verification required",
    });

    // Start OTP timeout monitor
    const otpTimeout = setTimeout(() => {
      this.log("error", "OTP timeout - no code provided", {
        accountId,
        platform,
        waitTime: this.getTimeoutConfig("otp_wait"),
      });

      this.emit("otp_timeout", {
        accountId,
        platform,
        reason: "timeout_no_otp_provided",
      });
    }, this.getTimeoutConfig("otp_wait"));

    return { otpSession, otpTimeout };
  }

  /**
   * 9. Success criteria validation
   */
  async validateLoginSuccess(page, platform, accountId) {
    try {
      const currentUrl = await page.url();

      this.log("debug", "Validating login success", {
        accountId,
        platform,
        currentUrl,
      });

      const validationResult = await this.safePageOperation(
        page,
        async () => {
          switch (platform.toLowerCase()) {
            case "facebook":
              return await this.validateFacebookSuccess(page);
            case "gmail":
              return await this.validateGmailSuccess(page);
            case "instagram":
              return await this.validateInstagramSuccess(page);
            default:
              return await this.validateGenericSuccess(page, platform);
          }
        },
        "login_validation",
        accountId
      );

      if (validationResult.success) {
        this.log("info", "Login success validated", {
          accountId,
          platform,
          homeUrl: validationResult.homeUrl,
          userInfo: validationResult.userInfo,
        });

        // Update status to completed
        this.emit("login_completed", {
          accountId,
          platform,
          homeUrl: validationResult.homeUrl,
          userInfo: validationResult.userInfo,
          timestamp: Date.now(),
        });

        return validationResult;
      } else {
        const errorMessage =
          validationResult.reason || "Login validation failed";
        this.log("error", "Login validation failed", {
          accountId,
          platform,
          reason: errorMessage,
        });

        const error = new Error(errorMessage);
        throw error;
      }
    } catch (error) {
      this.log("error", "Login validation failed", {
        accountId,
        platform,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Validate Facebook success
   */
  async validateFacebookSuccess(page) {
    try {
      // Wait for home page elements
      await page.waitForSelector('[data-testid="blue_bar"]', {
        timeout: this.getTimeoutConfig("selector_wait"),
      });

      // Check for user menu (indicates logged in)
      const userMenu = await page.$('[data-testid="blue_bar"] [role="button"]');
      const hasLoginForm = await page.$('input[name="email"]');

      if (userMenu && !hasLoginForm) {
        const homeUrl = page.url();
        const title = await page.title();

        return {
          success: true,
          homeUrl,
          userInfo: { title },
          indicators: ["user_menu_present", "no_login_form"],
        };
      }

      return { success: false, reason: "Home page validation failed" };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }

  /**
   * Validate Gmail success
   */
  async validateGmailSuccess(page) {
    try {
      // Wait for Gmail interface
      await page.waitForSelector('[role="navigation"]', {
        timeout: this.getTimeoutConfig("selector_wait"),
      });

      const currentUrl = page.url();
      const title = await page.title();

      if (currentUrl.includes("mail.google.com") && title.includes("Gmail")) {
        return {
          success: true,
          homeUrl: currentUrl,
          userInfo: { title },
          indicators: ["gmail_interface_loaded"],
        };
      }

      return { success: false, reason: "Gmail interface not detected" };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }

  /**
   * Validate Instagram success
   */
  async validateInstagramSuccess(page) {
    try {
      // Wait for main content
      await page.waitForSelector('[role="main"]', {
        timeout: this.getTimeoutConfig("selector_wait"),
      });

      const hasLoginForm = await page.$('input[name="username"]');
      const currentUrl = page.url();

      if (!hasLoginForm && currentUrl.includes("instagram.com")) {
        const title = await page.title();

        return {
          success: true,
          homeUrl: currentUrl,
          userInfo: { title },
          indicators: ["main_content_loaded", "no_login_form"],
        };
      }

      return { success: false, reason: "Instagram home not detected" };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }

  /**
   * Generic success validation
   */
  async validateGenericSuccess(page, platform) {
    try {
      const currentUrl = page.url();
      const title = await page.title();

      // Basic checks
      const hasLoginKeywords =
        currentUrl.includes("login") ||
        currentUrl.includes("signin") ||
        title.toLowerCase().includes("login");

      if (!hasLoginKeywords) {
        return {
          success: true,
          homeUrl: currentUrl,
          userInfo: { title },
          indicators: ["no_login_keywords"],
        };
      }

      return { success: false, reason: "Still on login page" };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }

  /**
   * 10. Session cleanup with proper resource management
   */
  async cleanupSession(accountId, reason = "manual") {
    try {
      this.log("info", "Starting session cleanup", {
        accountId,
        reason,
      });

      // Remove job assignment
      const jobKey = `${accountId}_*`;
      for (const [key, job] of this.processMetrics.entries()) {
        if (key.startsWith(accountId)) {
          this.processMetrics.delete(key);
          this.log("debug", "Job assignment removed", { jobKey: key });
        }
      }

      // Cleanup browser process
      const browserProcess = this.browserProcesses.get(accountId);
      if (browserProcess) {
        this.log("info", "Cleaning up browser process", {
          accountId,
          pid: browserProcess.pid,
        });

        this.browserProcesses.delete(accountId);
        this.activeSessions = Math.max(0, this.activeSessions - 1);
      }

      this.log("info", "Session cleanup completed", {
        accountId,
        reason,
        remainingActiveSessions: this.activeSessions,
      });

      // Emit cleanup event
      this.emit("session_cleaned", {
        accountId,
        reason,
        activeSessions: this.activeSessions,
      });
    } catch (error) {
      this.log("error", "Session cleanup failed", {
        accountId,
        error: error.message,
      });
    }
  }

  /**
   * Start system monitoring with proper interval management
   */
  startMonitoring() {
    // Store interval IDs for cleanup
    this.monitoringIntervals = [];

    // Health check every minute
    const healthInterval = setInterval(async () => {
      try {
        await this.checkSystemHealth();
      } catch (error) {
        this.log("error", "Health check failed", { error: error.message });
      }
    }, 60000);
    this.monitoringIntervals.push(healthInterval);

    // Memory check every 30 seconds
    const memoryInterval = setInterval(() => {
      try {
        const memory = this.getMemoryUsage();
        if (memory.usage > this.memoryThreshold) {
          this.emit("memory_warning", memory);
        }

        // Log memory usage for monitoring
        this.log("debug", "Memory check", {
          usage: memory.usage,
          threshold: this.memoryThreshold,
        });
      } catch (error) {
        this.log("error", "Memory check failed", { error: error.message });
      }
    }, 30000);
    this.monitoringIntervals.push(memoryInterval);

    // Cleanup orphaned processes every 5 minutes
    const cleanupInterval = setInterval(async () => {
      try {
        await this.cleanupOrphanedProcesses();
      } catch (error) {
        this.log("error", "Cleanup process failed", { error: error.message });
      }
    }, 300000); // 5 minutes
    this.monitoringIntervals.push(cleanupInterval);

    this.log(
      "info",
      "System monitoring started with " +
        this.monitoringIntervals.length +
        " intervals"
    );
  }

  /**
   * Stop all monitoring intervals
   */
  stopMonitoring() {
    if (this.monitoringIntervals) {
      this.monitoringIntervals.forEach((interval) => clearInterval(interval));
      this.monitoringIntervals = [];
      this.log("info", "System monitoring stopped");
    }
  }

  /**
   * Cleanup orphaned browser processes
   */
  async cleanupOrphanedProcesses() {
    const currentTime = Date.now();
    const orphanedProcesses = [];

    // Check for old browser processes
    for (const [accountId, browserProcess] of this.browserProcesses.entries()) {
      const processAge = currentTime - browserProcess.startTime;
      const lastActivityAge = currentTime - browserProcess.lastActivity;

      // If process is older than 2 hours or inactive for 1 hour
      if (processAge > 2 * 60 * 60 * 1000 || lastActivityAge > 60 * 60 * 1000) {
        orphanedProcesses.push(accountId);
      }
    }

    if (orphanedProcesses.length > 0) {
      this.log("warn", "Found orphaned processes", {
        count: orphanedProcesses.length,
        processes: orphanedProcesses,
      });

      for (const accountId of orphanedProcesses) {
        try {
          await this.cleanupSession(accountId, "orphaned");
        } catch (error) {
          this.log("error", "Failed to cleanup orphaned process", {
            accountId,
            error: error.message,
          });
        }
      }
    }
  }

  /**
   * Get system metrics
   */
  getSystemMetrics() {
    return {
      memory: this.getMemoryUsage(),
      activeSessions: this.activeSessions,
      concurrentLimit: this.concurrentLimit,
      browserProcesses: this.browserProcesses.size,
      jobAssignments: this.processMetrics.size,
      isVPS: this.isVPSEnvironment,
      uptime: process.uptime(),
      timestamp: Date.now(),
    };
  }
}

module.exports = SystemMonitor;
