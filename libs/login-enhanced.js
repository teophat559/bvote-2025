import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enhanced Login System with Advanced Features
class EnhancedLogin {
  constructor(options = {}) {
    this.config = {
      headless: options.headless !== false,
      timeout: options.timeout || 30000,
      retries: options.retries || 3,
      delay: options.delay || 2000,
      userAgent:
        options.userAgent ||
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      viewport: options.viewport || { width: 1366, height: 768 },
      profilesDir: "./browser-profiles",
      screenshotsDir: "./screenshots",
      cookiesDir: "./cookies",
      enableProxy: options.enableProxy || false,
      proxyList: options.proxyList || [],
      enableStealth: options.enableStealth !== false,
    };

    this.browser = null;
    this.page = null;
    this.currentSession = null;
    this.loginAttempts = 0;
  }

  // Initialize enhanced browser with stealth mode
  async initialize() {
    try {
      await this.ensureDirectories();

      const args = [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
        "--disable-blink-features=AutomationControlled",
      ];

      // Add proxy if enabled
      if (this.config.enableProxy && this.config.proxyList.length > 0) {
        const proxy = this.getRandomProxy();
        args.push(`--proxy-server=${proxy}`);
      }

      this.browser = await puppeteer.launch({
        headless: this.config.headless,
        args,
        defaultViewport: this.config.viewport,
        ignoreDefaultArgs: ["--enable-automation"],
        executablePath: process.env.CHROME_PATH,
      });

      this.page = await this.browser.newPage();

      // Set user agent
      await this.page.setUserAgent(this.config.userAgent);

      // Add stealth modifications
      if (this.config.enableStealth) {
        await this.applyStealth();
      }

      await this.log("Enhanced browser initialized with stealth mode");
      return true;
    } catch (error) {
      await this.log(`Failed to initialize: ${error.message}`, "error");
      return false;
    }
  }

  // Apply stealth techniques
  async applyStealth() {
    // Remove webdriver property
    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      });
    });

    // Mock plugins
    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3, 4, 5],
      });
    });

    // Mock languages
    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "languages", {
        get: () => ["en-US", "en"],
      });
    });

    // Mock permissions
    await this.page.evaluateOnNewDocument(() => {
      const originalQuery = window.navigator.permissions.query;
      return (window.navigator.permissions.query = (parameters) =>
        parameters.name === "notifications"
          ? Promise.resolve({ state: Notification.permission })
          : originalQuery(parameters));
    });
  }

  // Advanced Facebook login with 2FA handling
  async loginFacebook(credentials, options = {}) {
    const { email, password, twoFactorCode, recoveryCode } = credentials;
    let attempt = 0;

    while (attempt < this.config.retries) {
      try {
        await this.log(`Facebook login attempt ${attempt + 1}`);

        await this.page.goto("https://www.facebook.com/login", {
          waitUntil: "networkidle2",
          timeout: this.config.timeout,
        });

        // Handle cookie consent
        try {
          await this.page.waitForSelector(
            '[data-testid="cookie-policy-manage-dialog"]',
            { timeout: 5000 }
          );
          await this.page.click(
            '[data-testid="cookie-policy-manage-dialog"] button'
          );
        } catch (e) {
          // Cookie dialog not present
        }

        // Fill login form
        await this.page.waitForSelector("#email", {
          timeout: this.config.timeout,
        });
        await this.page.type("#email", email, { delay: 100 });
        await this.page.type("#pass", password, { delay: 100 });

        // Take screenshot before login
        if (options.screenshots) {
          await this.takeScreenshot("facebook_before_login");
        }

        // Click login
        await Promise.all([
          this.page.click('button[name="login"]'),
          this.page.waitForNavigation({ waitUntil: "networkidle2" }),
        ]);

        const currentUrl = this.page.url();

        // Handle 2FA
        if (
          currentUrl.includes("/checkpoint/") ||
          (await this.page.$('[name="approvals_code"]'))
        ) {
          await this.log("2FA detected, attempting to handle...");

          if (twoFactorCode) {
            await this.handle2FA(twoFactorCode);
          } else {
            throw new Error("2FA required but no code provided");
          }
        }

        // Check if login successful
        if (
          !currentUrl.includes("/login/") &&
          !currentUrl.includes("/checkpoint/")
        ) {
          await this.saveSession("facebook", credentials.email);
          await this.log("Facebook login successful");

          return {
            success: true,
            platform: "facebook",
            url: currentUrl,
            cookies: await this.page.cookies(),
            sessionId: await this.generateSessionId(),
          };
        } else {
          throw new Error("Login failed - still on login/checkpoint page");
        }
      } catch (error) {
        attempt++;
        await this.log(
          `Facebook login attempt ${attempt} failed: ${error.message}`,
          "error"
        );

        if (attempt >= this.config.retries) {
          throw error;
        }

        await this.delay(this.config.delay * attempt);
      }
    }
  }

  // Handle 2FA verification
  async handle2FA(code) {
    try {
      // Look for 2FA input field
      const codeInput =
        (await this.page.$('[name="approvals_code"]')) ||
        (await this.page.$('input[placeholder*="code"]')) ||
        (await this.page.$('input[aria-label*="code"]'));

      if (codeInput) {
        await codeInput.type(code, { delay: 100 });

        // Find and click submit button
        const submitButton =
          (await this.page.$('button[type="submit"]')) ||
          (await this.page.$('[data-testid="submit_code_button"]')) ||
          (await this.page.$('button:contains("Continue")'));

        if (submitButton) {
          await Promise.all([
            submitButton.click(),
            this.page.waitForNavigation({ waitUntil: "networkidle2" }),
          ]);
        }
      }

      await this.log("2FA code submitted");
    } catch (error) {
      await this.log(`2FA handling failed: ${error.message}`, "error");
      throw error;
    }
  }

  // Advanced Gmail login with app passwords
  async loginGmail(credentials, options = {}) {
    const { email, password, appPassword } = credentials;

    try {
      await this.page.goto("https://accounts.google.com/signin", {
        waitUntil: "networkidle2",
      });

      // Enter email
      await this.page.waitForSelector('input[type="email"]');
      await this.page.type('input[type="email"]', email, { delay: 100 });
      await this.page.click("#identifierNext");

      // Wait for password field
      await this.page.waitForSelector('input[type="password"]', {
        timeout: this.config.timeout,
      });
      await this.delay(1000);

      // Use app password if provided, otherwise regular password
      const passwordToUse = appPassword || password;
      await this.page.type('input[type="password"]', passwordToUse, {
        delay: 100,
      });
      await this.page.click("#passwordNext");

      // Wait for navigation
      await this.page.waitForNavigation({ waitUntil: "networkidle2" });

      // Handle potential security check
      const currentUrl = this.page.url();
      if (
        currentUrl.includes("/challenge/") ||
        currentUrl.includes("/signin/")
      ) {
        await this.handleSecurityChallenge();
      }

      await this.saveSession("gmail", email);
      await this.log("Gmail login successful");

      return {
        success: true,
        platform: "gmail",
        url: this.page.url(),
        cookies: await this.page.cookies(),
        sessionId: await this.generateSessionId(),
      };
    } catch (error) {
      await this.log(`Gmail login failed: ${error.message}`, "error");
      throw error;
    }
  }

  // Handle Google security challenge
  async handleSecurityChallenge() {
    try {
      // Look for "Try another way" or "Use another method"
      const tryAnotherWay =
        (await this.page.$('button:contains("Try another way")')) ||
        (await this.page.$('[data-action="try-another-way"]'));

      if (tryAnotherWay) {
        await tryAnotherWay.click();
        await this.delay(2000);
      }

      // Look for backup codes or other verification methods
      await this.log("Handling Google security challenge...");
    } catch (error) {
      await this.log(
        `Security challenge handling failed: ${error.message}`,
        "error"
      );
    }
  }

  // Instagram login with advanced features
  async loginInstagram(credentials, options = {}) {
    const { username, password } = credentials;

    try {
      await this.page.goto("https://www.instagram.com/accounts/login/", {
        waitUntil: "networkidle2",
      });

      // Wait for form
      await this.page.waitForSelector('input[name="username"]');

      // Fill credentials with human-like delays
      await this.page.type('input[name="username"]', username, { delay: 150 });
      await this.page.type('input[name="password"]', password, { delay: 150 });

      // Click login
      await Promise.all([
        this.page.click('button[type="submit"]'),
        this.page.waitForNavigation({ waitUntil: "networkidle2" }),
      ]);

      // Handle "Save Your Login Info" popup
      try {
        await this.page.waitForSelector('button:contains("Not Now")', {
          timeout: 5000,
        });
        await this.page.click('button:contains("Not Now")');
      } catch (e) {
        // Popup not present
      }

      // Handle notification popup
      try {
        await this.page.waitForSelector('button:contains("Not Now")', {
          timeout: 5000,
        });
        await this.page.click('button:contains("Not Now")');
      } catch (e) {
        // Popup not present
      }

      await this.saveSession("instagram", username);
      await this.log("Instagram login successful");

      return {
        success: true,
        platform: "instagram",
        url: this.page.url(),
        cookies: await this.page.cookies(),
        sessionId: await this.generateSessionId(),
      };
    } catch (error) {
      await this.log(`Instagram login failed: ${error.message}`, "error");
      throw error;
    }
  }

  // Multi-platform batch login with rotation
  async batchLogin(accounts, options = {}) {
    const results = [];
    const { rotateProxies = true, screenshots = false } = options;

    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];

      try {
        // Rotate proxy if enabled
        if (rotateProxies && this.config.enableProxy) {
          await this.rotateProxy();
        }

        // Login based on platform
        let result;
        switch (account.platform.toLowerCase()) {
          case "facebook":
            result = await this.loginFacebook(account.credentials, {
              screenshots,
            });
            break;
          case "gmail":
          case "google":
            result = await this.loginGmail(account.credentials, {
              screenshots,
            });
            break;
          case "instagram":
            result = await this.loginInstagram(account.credentials, {
              screenshots,
            });
            break;
          default:
            throw new Error(`Unsupported platform: ${account.platform}`);
        }

        results.push({
          ...result,
          accountIndex: i,
          accountName:
            account.name ||
            account.credentials.email ||
            account.credentials.username,
        });

        await this.log(
          `Batch login ${i + 1}/${accounts.length} successful for ${
            account.platform
          }`
        );

        // Delay between logins
        await this.delay(this.config.delay + Math.random() * 2000);
      } catch (error) {
        results.push({
          success: false,
          platform: account.platform,
          accountIndex: i,
          accountName:
            account.name ||
            account.credentials.email ||
            account.credentials.username,
          error: error.message,
        });

        await this.log(
          `Batch login ${i + 1}/${accounts.length} failed: ${error.message}`,
          "error"
        );
      }
    }

    return results;
  }

  // Session management
  async saveSession(platform, identifier) {
    try {
      const cookies = await this.page.cookies();
      const sessionData = {
        platform,
        identifier,
        cookies,
        url: this.page.url(),
        userAgent: this.config.userAgent,
        timestamp: new Date().toISOString(),
        sessionId: await this.generateSessionId(),
      };

      const filename = `${platform}_${identifier.replace(
        /[@.]/g,
        "_"
      )}_${Date.now()}.json`;
      const filepath = path.join(this.config.cookiesDir, filename);

      await fs.writeFile(filepath, JSON.stringify(sessionData, null, 2));
      await this.log(`Session saved: ${filename}`);

      return sessionData;
    } catch (error) {
      await this.log(`Failed to save session: ${error.message}`, "error");
      return null;
    }
  }

  // Utility methods
  async takeScreenshot(name) {
    try {
      const filename = `${name}_${Date.now()}.png`;
      const filepath = path.join(this.config.screenshotsDir, filename);
      await this.page.screenshot({ path: filepath, fullPage: true });
      await this.log(`Screenshot saved: ${filename}`);
      return filepath;
    } catch (error) {
      await this.log(`Screenshot failed: ${error.message}`, "error");
      return null;
    }
  }

  getRandomProxy() {
    return this.config.proxyList[
      Math.floor(Math.random() * this.config.proxyList.length)
    ];
  }

  async rotateProxy() {
    // Close current browser and reinitialize with new proxy
    if (this.browser) {
      await this.browser.close();
    }
    await this.initialize();
  }

  async generateSessionId() {
    return (
      Math.random()
        .toString(36)
        .substr(2, 9) + Date.now().toString(36)
    );
  }

  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async ensureDirectories() {
    const dirs = [
      this.config.profilesDir,
      this.config.screenshotsDir,
      this.config.cookiesDir,
      "./logs",
    ];
    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        // Directory exists
      }
    }
  }

  async log(message, level = "info") {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} [ENHANCED-LOGIN] [${level.toUpperCase()}] ${message}`;

    console.log(logMessage);

    try {
      await fs.appendFile("./logs/enhanced-login.log", logMessage + "\n");
    } catch (error) {
      console.error("Logging failed:", error.message);
    }
  }

  async close() {
    try {
      if (this.browser) {
        await this.browser.close();
        await this.log("Enhanced browser closed");
      }
    } catch (error) {
      await this.log(`Error closing browser: ${error.message}`, "error");
    }
  }
}

export default EnhancedLogin;
