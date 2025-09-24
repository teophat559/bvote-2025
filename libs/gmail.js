import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";

// Gmail Login Automation Module
class GmailLogin {
  constructor(options = {}) {
    this.config = {
      headless: options.headless !== false,
      timeout: options.timeout || 45000,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1366, height: 768 },
      enableScreenshots: options.screenshots || false,
      profilePath: options.profilePath || "./browser-profiles/gmail",
      screenshotsDir: "./screenshots/gmail",
      retries: options.retries || 3,
      enableStealth: options.enableStealth !== false,
    };

    this.browser = null;
    this.page = null;
    this.isLoggedIn = false;
    this.currentUser = null;
    this.loginUrl = "https://accounts.google.com/signin";
    this.gmailUrl = "https://mail.google.com";
  }

  // Initialize Gmail-specific browser
  async initialize() {
    try {
      await this.ensureDirectories();

      this.browser = await puppeteer.launch({
        headless: this.config.headless,
        userDataDir: this.config.profilePath,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-blink-features=AutomationControlled",
          "--disable-web-security",
          "--allow-running-insecure-content",
          "--disable-features=VizDisplayCompositor",
          "--lang=en-US,en",
        ],
        defaultViewport: this.config.viewport,
      });

      this.page = await this.browser.newPage();

      // Set Gmail-optimized settings
      await this.page.setUserAgent(this.config.userAgent);
      await this.page.setExtraHTTPHeaders({
        "Accept-Language": "en-US,en;q=0.9",
      });

      if (this.config.enableStealth) {
        await this.setupStealth();
      }

      await this.log("Gmail login module initialized successfully");
      return true;
    } catch (error) {
      await this.log(`Failed to initialize Gmail login: ${error.message}`);
      throw error;
    }
  }

  // Setup stealth mode to avoid detection
  async setupStealth() {
    await this.page.evaluateOnNewDocument(() => {
      // Override navigator.webdriver
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      });
      delete navigator.__proto__.webdriver;

      // Override permissions API
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) =>
        parameters.name === "notifications"
          ? Promise.resolve({ state: Notification.permission })
          : originalQuery(parameters);

      // Override plugins length
      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3, 4, 5],
      });

      // Override languages
      Object.defineProperty(navigator, "languages", {
        get: () => ["en-US", "en"],
      });
    });
  }

  // Login to Gmail with email and password
  async login(credentials) {
    try {
      const { email, password, appPassword } = credentials;

      if (!email || (!password && !appPassword)) {
        throw new Error("Email and password (or app password) are required");
      }

      await this.log(`Attempting to login to Gmail with email: ${email}`);

      // Navigate to Gmail login
      await this.page.goto(this.loginUrl, { waitUntil: "networkidle2" });

      if (this.config.enableScreenshots) {
        await this.takeScreenshot("01-gmail-login-page");
      }

      // Check if already logged in
      const isAlreadyLoggedIn = await this.checkIfLoggedIn();
      if (isAlreadyLoggedIn) {
        await this.log("Already logged in to Gmail");
        return {
          success: true,
          platform: "gmail",
          url: this.page.url(),
          message: "Already authenticated",
        };
      }

      // Step 1: Enter email
      await this.enterEmail(email);

      if (this.config.enableScreenshots) {
        await this.takeScreenshot("02-email-entered");
      }

      // Step 2: Enter password
      const passwordResult = await this.enterPassword(appPassword || password);

      if (!passwordResult.success) {
        return passwordResult;
      }

      if (this.config.enableScreenshots) {
        await this.takeScreenshot("03-password-entered");
      }

      // Step 3: Handle potential 2FA or verification
      const loginResult = await this.waitForLoginResult();

      if (loginResult.success) {
        this.isLoggedIn = true;
        this.currentUser = email;
        await this.saveSession();

        // Navigate to Gmail inbox
        await this.page.goto(this.gmailUrl, { waitUntil: "networkidle2" });
      }

      return loginResult;
    } catch (error) {
      await this.log(`Login failed: ${error.message}`);

      if (this.config.enableScreenshots) {
        await this.takeScreenshot("error-login-failed");
      }

      return {
        success: false,
        platform: "gmail",
        error: error.message,
        url: this.page.url(),
      };
    }
  }

  // Check if already logged in
  async checkIfLoggedIn() {
    try {
      const currentUrl = this.page.url();

      // Check URL patterns for logged in state
      if (
        currentUrl.includes("mail.google.com") ||
        currentUrl.includes("myaccount.google.com")
      ) {
        return true;
      }

      // Look for Google account elements
      const accountSelectors = [
        "[data-email]",
        ".gb_A", // Google account button
        ".gmail-nav",
        "#gbqf", // Google search form (indicates logged in)
      ];

      for (const selector of accountSelectors) {
        const element = await this.page.$(selector);
        if (element) {
          return true;
        }
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  // Enter email address
  async enterEmail(email) {
    try {
      // Wait for email input field
      const emailSelectors = [
        'input[type="email"]',
        'input[name="identifier"]',
        "#identifierId",
        'input[aria-label*="email"]',
      ];

      let emailInput = null;
      for (const selector of emailSelectors) {
        try {
          emailInput = await this.page.waitForSelector(selector, {
            timeout: 10000,
          });
          if (emailInput) break;
        } catch (e) {
          continue;
        }
      }

      if (!emailInput) {
        throw new Error("Could not find email input field");
      }

      // Clear and type email
      await emailInput.click({ clickCount: 3 });
      await emailInput.type(email, { delay: 100 });

      // Click Next button
      const nextSelectors = [
        "#identifierNext",
        'button:contains("Next")',
        '[data-testid="next-button"]',
        '.VfPpkd-LgbsSe[type="button"]',
      ];

      let nextClicked = false;
      for (const selector of nextSelectors) {
        try {
          const nextBtn = await this.page.$(selector);
          if (nextBtn) {
            await nextBtn.click();
            nextClicked = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!nextClicked) {
        await this.page.keyboard.press("Enter");
      }

      // Wait for password page
      await this.page.waitForTimeout(3000);

      await this.log("Email entered successfully");
    } catch (error) {
      throw new Error(`Failed to enter email: ${error.message}`);
    }
  }

  // Enter password
  async enterPassword(password) {
    try {
      // Wait for password input field
      const passwordSelectors = [
        'input[type="password"]',
        'input[name="password"]',
        "#password",
        'input[aria-label*="password"]',
      ];

      let passwordInput = null;
      for (const selector of passwordSelectors) {
        try {
          passwordInput = await this.page.waitForSelector(selector, {
            timeout: 15000,
          });
          if (passwordInput) break;
        } catch (e) {
          continue;
        }
      }

      if (!passwordInput) {
        return {
          success: false,
          platform: "gmail",
          error:
            "Could not find password input field - possible email verification required",
          url: this.page.url(),
        };
      }

      // Clear and type password
      await passwordInput.click();
      await passwordInput.type(password, { delay: 100 });

      // Click Next/Sign In button
      const signInSelectors = [
        "#passwordNext",
        'button:contains("Next")',
        'button:contains("Sign in")',
        '[data-testid="password-next"]',
        '.VfPpkd-LgbsSe[type="button"]',
      ];

      let signInClicked = false;
      for (const selector of signInSelectors) {
        try {
          const signInBtn = await this.page.$(selector);
          if (signInBtn) {
            await signInBtn.click();
            signInClicked = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!signInClicked) {
        await this.page.keyboard.press("Enter");
      }

      await this.log("Password entered successfully");
      return { success: true };
    } catch (error) {
      return {
        success: false,
        platform: "gmail",
        error: `Failed to enter password: ${error.message}`,
        url: this.page.url(),
      };
    }
  }

  // Wait for login result
  async waitForLoginResult() {
    try {
      const timeout = this.config.timeout;
      const startTime = Date.now();

      while (Date.now() - startTime < timeout) {
        const currentUrl = this.page.url();

        // Success indicators
        if (
          currentUrl.includes("mail.google.com") ||
          currentUrl.includes("myaccount.google.com")
        ) {
          await this.log("Login successful - redirected to Google services");
          return {
            success: true,
            platform: "gmail",
            url: currentUrl,
            message: "Successfully logged in to Gmail",
            authMethod: "password",
          };
        }

        // Check for 2FA requirement
        const twoFASelectors = [
          'input[type="tel"]', // Phone number input
          ".android-app-link", // Prompt to use mobile app
          '[data-testid="totpPin"]', // TOTP input
          'input[aria-label*="verification"]',
        ];

        for (const selector of twoFASelectors) {
          const element = await this.page.$(selector);
          if (element) {
            await this.log("2FA verification required");
            return {
              success: false,
              platform: "gmail",
              url: currentUrl,
              error: "2FA verification required",
              twoFactorRequired: true,
              verificationMethod: await this.detect2FAMethod(),
            };
          }
        }

        // Check for errors
        const errorSelectors = [
          ".LXRPh", // Google error text
          '[role="alert"]',
          ".dEOOab.RxsGPe", // Wrong password indicator
          ".GQ8Adb", // Account recovery suggestion
        ];

        for (const selector of errorSelectors) {
          const element = await this.page.$(selector);
          if (element) {
            const errorText = await element.textContent();
            await this.log(`Login error detected: ${errorText}`);
            return {
              success: false,
              platform: "gmail",
              url: currentUrl,
              error: errorText || "Authentication failed",
            };
          }
        }

        // Check for account recovery or suspicious activity
        if (
          currentUrl.includes("signin/challenge") ||
          currentUrl.includes("signin/recovery")
        ) {
          return {
            success: false,
            platform: "gmail",
            url: currentUrl,
            error: "Account security challenge detected",
            securityChallenge: true,
          };
        }

        await this.page.waitForTimeout(2000);
      }

      return {
        success: false,
        platform: "gmail",
        url: this.page.url(),
        error: "Login timeout - unable to determine result",
      };
    } catch (error) {
      return {
        success: false,
        platform: "gmail",
        error: `Login verification failed: ${error.message}`,
        url: this.page.url(),
      };
    }
  }

  // Detect 2FA method
  async detect2FAMethod() {
    try {
      const page = this.page;

      // Phone SMS
      const smsInput = await page.$('input[type="tel"]');
      if (smsInput) return "sms";

      // TOTP/Authenticator
      const totpInput = await page.$(
        'input[aria-label*="verification"], [data-testid="totpPin"]'
      );
      if (totpInput) return "totp";

      // Mobile app prompt
      const mobilePrompt = await page.$(".android-app-link, .ios-app-link");
      if (mobilePrompt) return "mobile_app";

      return "unknown";
    } catch (error) {
      return "unknown";
    }
  }

  // Handle 2FA verification
  async verify2FA(code, method = "totp") {
    try {
      let inputSelector;

      switch (method) {
        case "sms":
          inputSelector = 'input[type="tel"]';
          break;
        case "totp":
          inputSelector =
            'input[aria-label*="verification"], [data-testid="totpPin"]';
          break;
        default:
          inputSelector = 'input[type="text"], input[type="tel"]';
      }

      const codeInput = await this.page.waitForSelector(inputSelector, {
        timeout: 10000,
      });
      if (!codeInput) {
        throw new Error(`Could not find 2FA input field for method: ${method}`);
      }

      await codeInput.type(code, { delay: 100 });

      // Submit the code
      const submitBtn = await this.page.$('button[type="submit"], #next');
      if (submitBtn) {
        await submitBtn.click();
      } else {
        await this.page.keyboard.press("Enter");
      }

      return await this.waitForLoginResult();
    } catch (error) {
      return {
        success: false,
        error: `2FA verification failed: ${error.message}`,
      };
    }
  }

  // Send email
  async sendEmail(to, subject, body) {
    try {
      if (!this.isLoggedIn) {
        throw new Error("Not logged in to Gmail");
      }

      // Navigate to Gmail if not already there
      if (!this.page.url().includes("mail.google.com")) {
        await this.page.goto(this.gmailUrl, { waitUntil: "networkidle2" });
      }

      // Click compose button
      const composeSelectors = [
        '[data-tooltip="Compose"]',
        ".T-I.T-I-KE.L3",
        'div[role="button"][gh="cm"]',
      ];

      let composeClicked = false;
      for (const selector of composeSelectors) {
        try {
          const composeBtn = await this.page.waitForSelector(selector, {
            timeout: 10000,
          });
          if (composeBtn) {
            await composeBtn.click();
            composeClicked = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!composeClicked) {
        throw new Error("Could not find compose button");
      }

      await this.page.waitForTimeout(2000);

      // Fill recipient
      const toField = await this.page.waitForSelector(
        'input[name="to"], textarea[name="to"]',
        { timeout: 10000 }
      );
      await toField.type(to, { delay: 50 });

      // Fill subject
      const subjectField = await this.page.waitForSelector(
        'input[name="subjectbox"]',
        { timeout: 5000 }
      );
      await subjectField.type(subject, { delay: 50 });

      // Fill body
      const bodyField = await this.page.waitForSelector(
        'div[aria-label="Message Body"]',
        { timeout: 5000 }
      );
      await bodyField.click();
      await bodyField.type(body, { delay: 30 });

      // Send email
      const sendBtn = await this.page.waitForSelector(
        'div[data-tooltip="Send"]',
        { timeout: 5000 }
      );
      await sendBtn.click();

      await this.log(`Email sent to ${to}`);

      return {
        success: true,
        to,
        subject,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      await this.log(`Failed to send email: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Save session
  async saveSession() {
    try {
      const cookies = await this.page.cookies();
      const sessionData = {
        cookies,
        user: this.currentUser,
        loginTime: new Date().toISOString(),
        url: this.page.url(),
      };

      const sessionPath = path.join(this.config.profilePath, "session.json");
      await fs.writeFile(sessionPath, JSON.stringify(sessionData, null, 2));

      await this.log("Session saved successfully");
      return sessionData;
    } catch (error) {
      await this.log(`Failed to save session: ${error.message}`);
    }
  }

  // Load session
  async loadSession() {
    try {
      const sessionPath = path.join(this.config.profilePath, "session.json");
      const sessionData = JSON.parse(await fs.readFile(sessionPath, "utf8"));

      await this.page.setCookie(...sessionData.cookies);
      this.currentUser = sessionData.user;
      this.isLoggedIn = true;

      await this.log("Session loaded successfully");
      return true;
    } catch (error) {
      await this.log(`Failed to load session: ${error.message}`);
      return false;
    }
  }

  // Take screenshot
  async takeScreenshot(filename) {
    try {
      await this.ensureDirectories();
      const filepath = path.join(
        this.config.screenshotsDir,
        `${filename}-${Date.now()}.png`
      );
      await this.page.screenshot({ path: filepath, fullPage: true });
      await this.log(`Screenshot saved: ${filepath}`);
      return filepath;
    } catch (error) {
      await this.log(`Screenshot failed: ${error.message}`);
    }
  }

  // Ensure directories exist
  async ensureDirectories() {
    try {
      await fs.mkdir(this.config.profilePath, { recursive: true });
      if (this.config.enableScreenshots) {
        await fs.mkdir(this.config.screenshotsDir, { recursive: true });
      }
    } catch (error) {
      // Directory might already exist
    }
  }

  // Logging
  async log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [GmailLogin] ${message}`;
    console.log(logMessage);

    try {
      const logFile = path.join(this.config.profilePath, "gmail-login.log");
      await fs.appendFile(logFile, logMessage + "\n");
    } catch (error) {
      // Ignore logging errors
    }
  }

  // Close browser
  async close() {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
        this.isLoggedIn = false;
        await this.log("Gmail browser closed");
      }
    } catch (error) {
      await this.log(`Error closing browser: ${error.message}`);
    }
  }
}

export default GmailLogin;
