/**
 * Production Auto Login System
 * Triển khai đầy đủ Runbook với stability và resource management
 */

const SystemMonitor = require("./system-monitor.js");
const SessionManager = require("./session-manager.js");
const { EventEmitter } = require("events");

class ProductionAutoLogin extends EventEmitter {
  constructor() {
    super();
    this.systemMonitor = new SystemMonitor();
    this.sessionManager = new SessionManager();
    this.activeJobs = new Map();
    this.otpSessions = new Map();

    this.setupEventHandlers();
    this.log("info", "Production Auto Login System initialized");
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    // System Monitor events
    this.systemMonitor.on("memory_alert", (data) => {
      this.handleMemoryAlert(data);
    });

    this.systemMonitor.on("browser_crash", (data) => {
      this.handleBrowserCrash(data);
    });

    this.systemMonitor.on("log_entry", (entry) => {
      this.emit("system_log", entry);
    });

    // Session Manager events
    this.sessionManager.on("status_update", (update) => {
      this.handleSessionUpdate(update);
    });
  }

  /**
   * Production auto login với full runbook compliance
   */
  async startProductionAutoLogin(
    accountId,
    platform,
    credentials,
    options = {}
  ) {
    const requestId = this.generateRequestId();

    try {
      this.log("info", "Starting production auto login", {
        requestId,
        accountId,
        platform,
      });

      // 1. Job assignment (prevent race conditions)
      const jobAssignment = await this.systemMonitor.assignJob(
        accountId,
        platform,
        requestId
      );

      if (!jobAssignment.assigned) {
        this.log("warn", "Job assignment rejected", {
          requestId,
          accountId,
          reason: jobAssignment.reason,
        });

        return {
          success: false,
          reason: jobAssignment.reason,
          existingBot: jobAssignment.existingBot,
        };
      }

      this.activeJobs.set(requestId, jobAssignment.assignment);

      // 2. Create managed browser with optimized config
      const browser = await this.systemMonitor.createManagedBrowser(
        accountId,
        platform
      );
      const page = await browser.newPage();

      // 3. Enhanced login process with proper waits
      const loginResult = await this.performEnhancedLogin(
        page,
        platform,
        credentials,
        accountId,
        requestId
      );

      if (loginResult.success) {
        // 4. Validate success criteria
        const validation = await this.systemMonitor.validateLoginSuccess(
          page,
          platform,
          accountId
        );

        if (validation.success) {
          // 5. Maintain session (không đóng browser)
          await this.maintainProductionSession(
            browser,
            page,
            accountId,
            platform,
            validation
          );

          this.log("info", "Production auto login completed successfully", {
            requestId,
            accountId,
            platform,
            homeUrl: validation.homeUrl,
          });

          return {
            success: true,
            requestId,
            sessionId: loginResult.sessionId,
            homeUrl: validation.homeUrl,
            userInfo: validation.userInfo,
          };
        } else {
          throw new Error(`Login validation failed: ${validation.reason}`);
        }
      } else if (loginResult.requiresOTP) {
        // 6. Handle OTP properly
        return await this.handleProductionOTP(
          page,
          browser,
          accountId,
          platform,
          requestId,
          loginResult
        );
      } else {
        throw new Error(loginResult.error || "Login failed");
      }
    } catch (error) {
      this.log("error", "Production auto login failed", {
        requestId,
        accountId,
        platform,
        error: error.message,
      });

      // Cleanup on failure
      await this.cleanupFailedSession(requestId, accountId);

      return {
        success: false,
        requestId,
        error: error.message,
      };
    }
  }

  /**
   * Enhanced login process với proper waits
   */
  async performEnhancedLogin(
    page,
    platform,
    credentials,
    accountId,
    requestId
  ) {
    try {
      this.log("info", "Starting enhanced login process", {
        requestId,
        accountId,
        platform,
      });

      // Navigation với proper wait
      await this.systemMonitor.safePageOperation(
        page,
        async () => {
          const loginUrls = {
            facebook: "https://www.facebook.com/login",
            gmail: "https://accounts.google.com/signin",
            instagram: "https://www.instagram.com/accounts/login/",
          };

          const url = loginUrls[platform.toLowerCase()];
          await page.goto(url, {
            waitUntil: "networkidle2",
            timeout: this.systemMonitor.getTimeoutConfig("navigation"),
          });
        },
        "navigation",
        accountId
      );

      // Fill credentials với proper waits
      await this.fillCredentialsEnhanced(
        page,
        platform,
        credentials,
        accountId
      );

      // Submit form với proper wait
      const submitResult = await this.submitLoginFormEnhanced(
        page,
        platform,
        accountId
      );

      return submitResult;
    } catch (error) {
      this.log("error", "Enhanced login process failed", {
        requestId,
        accountId,
        platform,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Fill credentials với enhanced error handling
   */
  async fillCredentialsEnhanced(page, platform, credentials, accountId) {
    const selectors = {
      facebook: {
        email: 'input[name="email"]',
        password: 'input[name="pass"]',
      },
      gmail: {
        email: "#identifierId",
        password: 'input[name="password"]',
      },
      instagram: {
        email: 'input[name="username"]',
        password: 'input[name="password"]',
      },
    };

    const platformSelectors = selectors[platform.toLowerCase()];
    if (!platformSelectors) {
      throw new Error(`No selectors defined for platform: ${platform}`);
    }

    // Fill email/username
    await this.systemMonitor.safePageOperation(
      page,
      async () => {
        await page.waitForSelector(platformSelectors.email, {
          timeout: this.systemMonitor.getTimeoutConfig("selector_wait"),
        });
        await page.type(
          platformSelectors.email,
          credentials.email || credentials.username
        );
      },
      "fill_email",
      accountId
    );

    // Special handling for Gmail (next button)
    if (platform.toLowerCase() === "gmail") {
      await this.systemMonitor.safePageOperation(
        page,
        async () => {
          await page.click("#identifierNext");
          await page.waitForSelector(platformSelectors.password, {
            timeout: this.systemMonitor.getTimeoutConfig("selector_wait"),
          });
        },
        "gmail_next_step",
        accountId
      );
    }

    // Fill password
    await this.systemMonitor.safePageOperation(
      page,
      async () => {
        if (platform.toLowerCase() !== "gmail") {
          await page.waitForSelector(platformSelectors.password, {
            timeout: this.systemMonitor.getTimeoutConfig("selector_wait"),
          });
        }
        await page.type(platformSelectors.password, credentials.password);
      },
      "fill_password",
      accountId
    );

    this.log("info", "Credentials filled successfully", {
      accountId,
      platform,
    });
  }

  /**
   * Submit login form với enhanced handling
   */
  async submitLoginFormEnhanced(page, platform, accountId) {
    const submitSelectors = {
      facebook: 'button[name="login"]',
      gmail: "#passwordNext",
      instagram: 'button[type="submit"]',
    };

    const submitSelector = submitSelectors[platform.toLowerCase()];

    return await this.systemMonitor.safePageOperation(
      page,
      async () => {
        // Click submit
        await page.click(submitSelector);

        // Wait for navigation or response
        try {
          await page.waitForNavigation({
            timeout: this.systemMonitor.getTimeoutConfig("form_submit"),
            waitUntil: "networkidle2",
          });

          const currentUrl = page.url();

          // Check for OTP/2FA
          const needsOTP = await this.checkForOTPRequirement(page, platform);

          if (needsOTP) {
            return {
              success: false,
              requiresOTP: true,
              otpType: needsOTP.type,
              currentUrl,
            };
          }

          // Check if still on login page
          if (this.isStillOnLoginPage(currentUrl, platform)) {
            throw new Error("Login failed - still on login page");
          }

          return {
            success: true,
            currentUrl,
            sessionId: this.generateSessionId(),
          };
        } catch (navError) {
          if (navError.message.includes("timeout")) {
            // Check if page changed anyway
            const currentUrl = page.url();
            if (!this.isStillOnLoginPage(currentUrl, platform)) {
              return { success: true, currentUrl };
            }
          }
          throw navError;
        }
      },
      "form_submit",
      accountId
    );
  }

  /**
   * Check for OTP requirement
   */
  async checkForOTPRequirement(page, platform) {
    try {
      const currentUrl = page.url();
      const content = await page.content();

      const otpIndicators = {
        facebook: ["two_step_verification", "checkpoint", "security_check"],
        gmail: ["signin/v2/challenge", "verification", "recovery"],
        instagram: ["challenge", "two_factor"],
      };

      const indicators = otpIndicators[platform.toLowerCase()] || [];

      for (const indicator of indicators) {
        if (currentUrl.includes(indicator) || content.includes(indicator)) {
          return {
            required: true,
            type: indicator,
            currentUrl,
          };
        }
      }

      return { required: false };
    } catch {
      return { required: false };
    }
  }

  /**
   * Check if still on login page
   */
  isStillOnLoginPage(url, platform) {
    const loginIndicators = {
      facebook: ["login", "signin"],
      gmail: ["signin", "accounts.google.com"],
      instagram: ["accounts/login"],
    };

    const indicators = loginIndicators[platform.toLowerCase()] || ["login"];
    return indicators.some((indicator) => url.includes(indicator));
  }

  /**
   * Handle production OTP
   */
  async handleProductionOTP(
    page,
    browser,
    accountId,
    platform,
    requestId,
    loginResult
  ) {
    this.log("info", "Handling production OTP", {
      requestId,
      accountId,
      platform,
      otpType: loginResult.otpType,
    });

    const otpSession = await this.systemMonitor.handleOTPCheckpoint(
      page,
      accountId,
      platform
    );

    // Store OTP session
    this.otpSessions.set(requestId, {
      ...otpSession.otpSession,
      page,
      browser,
      timeout: otpSession.otpTimeout,
    });

    return {
      success: false,
      requiresOTP: true,
      requestId,
      otpType: loginResult.otpType,
      currentUrl: loginResult.currentUrl,
      message: "OTP verification required - session maintained",
    };
  }

  /**
   * Submit OTP code
   */
  async submitOTPCode(requestId, otpCode) {
    const otpSession = this.otpSessions.get(requestId);
    if (!otpSession) {
      throw new Error("OTP session not found");
    }

    try {
      this.log("info", "Submitting OTP code", {
        requestId,
        accountId: otpSession.accountId,
        platform: otpSession.platform,
      });

      const { page } = otpSession;

      // Clear timeout
      if (otpSession.timeout) {
        clearTimeout(otpSession.timeout);
      }

      // Find OTP input and submit
      await this.systemMonitor.safePageOperation(
        page,
        async () => {
          const otpSelectors = [
            'input[name="approvals_code"]',
            'input[id*="code"]',
            'input[type="text"]',
            'input[inputmode="numeric"]',
          ];

          let otpInput = null;
          for (const selector of otpSelectors) {
            otpInput = await page.$(selector);
            if (otpInput) break;
          }

          if (!otpInput) {
            throw new Error("OTP input field not found");
          }

          await otpInput.type(otpCode);

          // Find and click submit
          const submitSelectors = [
            'button[type="submit"]',
            'button[name="submit"]',
            "#checkpointSubmitButton",
            'button:contains("Submit")',
            'button:contains("Continue")',
          ];

          let submitBtn = null;
          for (const selector of submitSelectors) {
            submitBtn = await page.$(selector);
            if (submitBtn) break;
          }

          if (submitBtn) {
            await submitBtn.click();

            // Wait for navigation
            await page.waitForNavigation({
              timeout: this.systemMonitor.getTimeoutConfig("form_submit"),
              waitUntil: "networkidle2",
            });
          }
        },
        "otp_submit",
        otpSession.accountId
      );

      // Validate success after OTP
      const validation = await this.systemMonitor.validateLoginSuccess(
        page,
        otpSession.platform,
        otpSession.accountId
      );

      if (validation.success) {
        // Maintain session
        await this.maintainProductionSession(
          otpSession.browser,
          page,
          otpSession.accountId,
          otpSession.platform,
          validation
        );

        this.log("info", "OTP verification successful", {
          requestId,
          accountId: otpSession.accountId,
          platform: otpSession.platform,
        });

        // Cleanup OTP session
        this.otpSessions.delete(requestId);

        return {
          success: true,
          requestId,
          homeUrl: validation.homeUrl,
        };
      } else {
        throw new Error(`Post-OTP validation failed: ${validation.reason}`);
      }
    } catch (error) {
      this.log("error", "OTP submission failed", {
        requestId,
        accountId: otpSession.accountId,
        error: error.message,
      });

      // Cleanup OTP session
      this.otpSessions.delete(requestId);
      throw error;
    }
  }

  /**
   * Maintain production session (không đóng browser)
   */
  async maintainProductionSession(
    browser,
    page,
    accountId,
    platform,
    validation
  ) {
    this.log("info", "Maintaining production session", {
      accountId,
      platform,
      homeUrl: validation.homeUrl,
    });

    // Update final status
    this.emit("session_maintained", {
      accountId,
      platform,
      homeUrl: validation.homeUrl,
      userInfo: validation.userInfo,
      status: "active_maintained",
      timestamp: Date.now(),
    });

    // Setup session health monitoring
    this.setupSessionHealthMonitoring(page, accountId, platform);

    // Log completion
    this.log("info", "Session maintenance established", {
      accountId,
      platform,
      indicators: validation.indicators,
      message: "Browser tab maintained at home page",
    });
  }

  /**
   * Setup session health monitoring
   */
  setupSessionHealthMonitoring(page, accountId, platform) {
    const healthInterval = setInterval(async () => {
      try {
        if (page.isClosed()) {
          this.log("warn", "Session page closed unexpectedly", {
            accountId,
            platform,
          });
          clearInterval(healthInterval);
          return;
        }

        const currentUrl = await page.url();
        const title = await page.title();

        // Check if still on valid home page
        const isValidHome = this.systemMonitor.isValidHomeUrl
          ? this.systemMonitor.isValidHomeUrl(currentUrl, platform)
          : !currentUrl.includes("login");

        if (!isValidHome) {
          this.log("warn", "Session drift detected", {
            accountId,
            platform,
            currentUrl,
            action: "attempting_recovery",
          });

          // Attempt recovery
          await this.recoverSession(page, platform, accountId);
        } else {
          this.log("debug", "Session health check passed", {
            accountId,
            platform,
            currentUrl,
            title,
          });
        }
      } catch (error) {
        this.log("error", "Session health check failed", {
          accountId,
          platform,
          error: error.message,
        });
        clearInterval(healthInterval);
      }
    }, 60000); // Check every minute
  }

  /**
   * Recover session when drift detected
   */
  async recoverSession(page, platform, accountId) {
    try {
      const homeUrls = {
        facebook: "https://www.facebook.com/",
        gmail: "https://mail.google.com/mail/",
        instagram: "https://www.instagram.com/",
      };

      const homeUrl = homeUrls[platform.toLowerCase()];
      if (homeUrl) {
        await page.goto(homeUrl, {
          waitUntil: "networkidle2",
          timeout: this.systemMonitor.getTimeoutConfig("navigation"),
        });

        this.log("info", "Session recovery successful", {
          accountId,
          platform,
          recoveredUrl: await page.url(),
        });

        return true;
      }

      return false;
    } catch (error) {
      this.log("error", "Session recovery failed", {
        accountId,
        platform,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Handle memory alert
   */
  handleMemoryAlert(data) {
    this.log("warn", "Memory alert received", {
      usage: data.usage,
      action: data.action,
      newLimit: data.newLimit,
    });

    // Reduce concurrent operations
    this.emit("memory_pressure", {
      currentSessions: this.activeJobs.size,
      recommendedAction: "reduce_concurrent_sessions",
    });
  }

  /**
   * Handle browser crash
   */
  handleBrowserCrash(data) {
    this.log("error", "Browser crash detected", {
      accountId: data.accountId,
      exitCode: data.exitCode,
      signal: data.signal,
    });

    // Implement auto-restart
    this.emit("browser_restart_required", {
      accountId: data.accountId,
      reason: "crash_detected",
    });
  }

  /**
   * Cleanup failed session
   */
  async cleanupFailedSession(requestId, accountId) {
    try {
      this.log("info", "Cleaning up failed session", {
        requestId,
        accountId,
      });

      // Remove from active jobs
      this.activeJobs.delete(requestId);

      // Remove OTP session if exists
      this.otpSessions.delete(requestId);

      // Use system monitor cleanup
      await this.systemMonitor.cleanupSession(accountId, "failed");

      this.log("info", "Failed session cleanup completed", {
        requestId,
        accountId,
      });
    } catch (error) {
      this.log("error", "Failed session cleanup error", {
        requestId,
        accountId,
        error: error.message,
      });
    }
  }

  /**
   * Get production status
   */
  getProductionStatus() {
    const systemMetrics = this.systemMonitor.getSystemMetrics();

    return {
      ...systemMetrics,
      activeJobs: this.activeJobs.size,
      otpSessions: this.otpSessions.size,
      healthStatus: "operational",
      lastHealthCheck: Date.now(),
    };
  }

  /**
   * Log helper với structured format
   */
  log(level, message, metadata = {}) {
    this.systemMonitor.log(level, message, {
      component: "ProductionAutoLogin",
      ...metadata,
    });
  }

  /**
   * Generate request ID
   */
  generateRequestId() {
    return `prod_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 8)}`;
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }
}

module.exports = ProductionAutoLogin;

// Run if called directly
if (require.main === module) {
  const production = new ProductionAutoLogin();

  // Test with current environment variables
  const testAccountId = "prod_test_fb";
  const testPlatform = "facebook";
  const testCredentials = {
    email: process.env.FB_EMAIL,
    password: process.env.FB_PASSWORD,
  };

  if (testCredentials.email && testCredentials.password) {
    console.log("🚀 Starting production auto login test...");

    production
      .startProductionAutoLogin(testAccountId, testPlatform, testCredentials)
      .then((result) => {
        console.log("📊 Production test result:", result);
      })
      .catch((error) => {
        console.error("❌ Production test failed:", error);
      });
  } else {
    console.log("⚠️ No credentials provided for production test");
    console.log("Set FB_EMAIL and FB_PASSWORD environment variables");
  }
}

