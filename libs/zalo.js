import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";

// Zalo Login Automation Module
class ZaloLogin {
  constructor(options = {}) {
    this.config = {
      headless: options.headless !== false,
      timeout: options.timeout || 30000,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1366, height: 768 },
      enableScreenshots: options.screenshots || false,
      profilePath: options.profilePath || "./browser-profiles/zalo",
      screenshotsDir: "./screenshots/zalo",
      retries: options.retries || 3,
    };

    this.browser = null;
    this.page = null;
    this.isLoggedIn = false;
    this.currentUser = null;
    this.loginUrl = "https://zalo.me";
    this.chatUrl = "https://chat.zalo.me";
  }

  // Initialize Zalo-specific browser
  async initialize() {
    try {
      // Ensure directories exist
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
          "--lang=vi-VN,vi",
        ],
        defaultViewport: this.config.viewport,
      });

      this.page = await this.browser.newPage();

      // Set Vietnamese locale and Zalo-optimized settings
      await this.page.setUserAgent(this.config.userAgent);
      await this.page.setExtraHTTPHeaders({
        "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
      });

      // Override navigator.webdriver
      await this.page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, "webdriver", {
          get: () => undefined,
        });
        delete navigator.__proto__.webdriver;
      });

      await this.log("Zalo login module initialized successfully");
      return true;
    } catch (error) {
      await this.log(`Failed to initialize Zalo login: ${error.message}`);
      throw error;
    }
  }

  // Login to Zalo with phone number
  async login(credentials) {
    try {
      const { phone, password } = credentials;

      if (!phone || !password) {
        throw new Error("Phone number and password are required");
      }

      await this.log(`Attempting to login to Zalo with phone: ${phone}`);

      // Navigate to Zalo
      await this.page.goto(this.loginUrl, { waitUntil: "networkidle2" });

      if (this.config.enableScreenshots) {
        await this.takeScreenshot("01-zalo-homepage");
      }

      // Check if already logged in
      const isAlreadyLoggedIn = await this.checkIfLoggedIn();
      if (isAlreadyLoggedIn) {
        await this.log("Already logged in to Zalo");
        return {
          success: true,
          platform: "zalo",
          url: this.page.url(),
          message: "Already authenticated",
        };
      }

      // Click login button or navigate to login page
      await this.navigateToLogin();

      // Fill login form
      await this.fillLoginForm(phone, password);

      if (this.config.enableScreenshots) {
        await this.takeScreenshot("02-login-form-filled");
      }

      // Submit login form
      await this.submitLoginForm();

      // Wait for login result
      const loginResult = await this.waitForLoginResult();

      if (loginResult.success) {
        this.isLoggedIn = true;
        this.currentUser = phone;
        await this.saveSession();
      }

      return loginResult;
    } catch (error) {
      await this.log(`Login failed: ${error.message}`);

      if (this.config.enableScreenshots) {
        await this.takeScreenshot("error-login-failed");
      }

      return {
        success: false,
        platform: "zalo",
        error: error.message,
        url: this.page.url(),
      };
    }
  }

  // Check if already logged in
  async checkIfLoggedIn() {
    try {
      // Look for Zalo chat interface or user avatar
      const selectors = [
        ".chat-list-container",
        ".user-info",
        '[data-testid="chat-list"]',
        ".zalo-chat-container",
      ];

      for (const selector of selectors) {
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

  // Navigate to login page
  async navigateToLogin() {
    try {
      // Look for login button or link
      const loginSelectors = [
        'a[href*="login"]',
        'button:contains("Đăng nhập")',
        ".login-btn",
        '[data-testid="login-button"]',
      ];

      let clicked = false;
      for (const selector of loginSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 5000 });
          await this.page.click(selector);
          clicked = true;
          break;
        } catch (e) {
          continue;
        }
      }

      if (!clicked) {
        // Try navigating directly to login URL
        await this.page.goto(`${this.loginUrl}/login`, {
          waitUntil: "networkidle2",
        });
      }

      await this.page.waitForTimeout(2000);
    } catch (error) {
      await this.log(`Navigation to login failed: ${error.message}`);
      throw error;
    }
  }

  // Fill login form
  async fillLoginForm(phone, password) {
    try {
      // Wait for login form
      const phoneSelectors = [
        'input[name="phone"]',
        'input[type="tel"]',
        'input[placeholder*="số điện thoại"]',
        'input[placeholder*="phone"]',
        "#phone",
        ".phone-input",
      ];

      const passwordSelectors = [
        'input[name="password"]',
        'input[type="password"]',
        'input[placeholder*="mật khẩu"]',
        'input[placeholder*="password"]',
        "#password",
        ".password-input",
      ];

      // Fill phone number
      let phoneInput = null;
      for (const selector of phoneSelectors) {
        try {
          phoneInput = await this.page.waitForSelector(selector, {
            timeout: 5000,
          });
          if (phoneInput) break;
        } catch (e) {
          continue;
        }
      }

      if (!phoneInput) {
        throw new Error("Could not find phone input field");
      }

      await phoneInput.click({ clickCount: 3 });
      await phoneInput.type(phone, { delay: 100 });

      // Fill password
      let passwordInput = null;
      for (const selector of passwordSelectors) {
        try {
          passwordInput = await this.page.waitForSelector(selector, {
            timeout: 5000,
          });
          if (passwordInput) break;
        } catch (e) {
          continue;
        }
      }

      if (!passwordInput) {
        throw new Error("Could not find password input field");
      }

      await passwordInput.click();
      await passwordInput.type(password, { delay: 100 });

      await this.log("Login form filled successfully");
    } catch (error) {
      throw new Error(`Failed to fill login form: ${error.message}`);
    }
  }

  // Submit login form
  async submitLoginForm() {
    try {
      const submitSelectors = [
        'button[type="submit"]',
        'button:contains("Đăng nhập")',
        'button:contains("Login")',
        ".login-submit",
        ".submit-btn",
        '[data-testid="login-submit"]',
      ];

      let submitted = false;
      for (const selector of submitSelectors) {
        try {
          const button = await this.page.$(selector);
          if (button) {
            await button.click();
            submitted = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!submitted) {
        // Try pressing Enter key
        await this.page.keyboard.press("Enter");
      }

      await this.log("Login form submitted");
    } catch (error) {
      throw new Error(`Failed to submit login form: ${error.message}`);
    }
  }

  // Wait for login result
  async waitForLoginResult() {
    try {
      // Wait for either success or error indicators
      const timeout = this.config.timeout;

      await this.page.waitForTimeout(3000);

      // Check for success indicators
      const successSelectors = [
        ".chat-list-container",
        ".zalo-chat-container",
        '[data-testid="chat-list"]',
        ".user-avatar",
        ".conversation-list",
      ];

      // Check for error indicators
      const errorSelectors = [
        ".error-message",
        ".login-error",
        '[data-testid="error"]',
        ".alert-error",
      ];

      // Check for OTP requirement
      const otpSelectors = [
        ".otp-container",
        ".verification-code",
        'input[placeholder*="mã xác nhận"]',
        'input[placeholder*="OTP"]',
      ];

      // Wait for one of the conditions
      const startTime = Date.now();
      while (Date.now() - startTime < timeout) {
        // Check for success
        for (const selector of successSelectors) {
          const element = await this.page.$(selector);
          if (element) {
            await this.log("Login successful - found chat interface");
            return {
              success: true,
              platform: "zalo",
              url: this.page.url(),
              message: "Successfully logged in to Zalo",
            };
          }
        }

        // Check for OTP requirement
        for (const selector of otpSelectors) {
          const element = await this.page.$(selector);
          if (element) {
            await this.log("OTP verification required");
            return {
              success: false,
              platform: "zalo",
              url: this.page.url(),
              error: "OTP verification required",
              otpRequired: true,
              verificationMethod: "sms_otp",
            };
          }
        }

        // Check for errors
        for (const selector of errorSelectors) {
          const element = await this.page.$(selector);
          if (element) {
            const errorText = await element.textContent();
            await this.log(`Login error detected: ${errorText}`);
            return {
              success: false,
              platform: "zalo",
              url: this.page.url(),
              error: errorText || "Login failed",
            };
          }
        }

        await this.page.waitForTimeout(1000);
      }

      // Timeout - check URL for clues
      const currentUrl = this.page.url();
      if (currentUrl.includes("chat.zalo.me") || currentUrl.includes("/home")) {
        return {
          success: true,
          platform: "zalo",
          url: currentUrl,
          message: "Login appears successful based on URL",
        };
      }

      return {
        success: false,
        platform: "zalo",
        url: currentUrl,
        error: "Login timeout - unable to determine result",
      };
    } catch (error) {
      return {
        success: false,
        platform: "zalo",
        error: `Login verification failed: ${error.message}`,
        url: this.page.url(),
      };
    }
  }

  // Send message to contact
  async sendMessage(contact, message) {
    try {
      if (!this.isLoggedIn) {
        throw new Error("Not logged in to Zalo");
      }

      // Navigate to chat if not already there
      if (!this.page.url().includes("chat.zalo.me")) {
        await this.page.goto(this.chatUrl, { waitUntil: "networkidle2" });
      }

      // Search for contact
      await this.searchContact(contact);

      // Type and send message
      await this.typeMessage(message);

      return {
        success: true,
        contact,
        message,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      await this.log(`Failed to send message: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Search for contact
  async searchContact(contact) {
    const searchSelectors = [
      'input[placeholder*="tìm kiếm"]',
      'input[placeholder*="search"]',
      ".search-input",
      '[data-testid="search-input"]',
    ];

    for (const selector of searchSelectors) {
      try {
        const searchBox = await this.page.waitForSelector(selector, {
          timeout: 5000,
        });
        if (searchBox) {
          await searchBox.click();
          await searchBox.type(contact, { delay: 100 });
          await this.page.waitForTimeout(2000);

          // Click on first result
          const firstResult = await this.page.$(
            ".contact-item:first-child, .search-result:first-child"
          );
          if (firstResult) {
            await firstResult.click();
          }
          return;
        }
      } catch (e) {
        continue;
      }
    }
  }

  // Type message
  async typeMessage(message) {
    const messageSelectors = [
      'input[placeholder*="tin nhắn"]',
      'textarea[placeholder*="tin nhắn"]',
      ".message-input",
      '[data-testid="message-input"]',
    ];

    for (const selector of messageSelectors) {
      try {
        const messageBox = await this.page.waitForSelector(selector, {
          timeout: 5000,
        });
        if (messageBox) {
          await messageBox.click();
          await messageBox.type(message, { delay: 50 });
          await this.page.keyboard.press("Enter");
          return;
        }
      } catch (e) {
        continue;
      }
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

  // Handle OTP verification
  async verifyOTP(otpCode) {
    try {
      const otpSelectors = [
        'input[placeholder*="mã xác nhận"]',
        'input[placeholder*="OTP"]',
        ".otp-input",
        '[data-testid="otp-input"]',
      ];

      for (const selector of otpSelectors) {
        try {
          const otpInput = await this.page.waitForSelector(selector, {
            timeout: 5000,
          });
          if (otpInput) {
            await otpInput.type(otpCode, { delay: 100 });

            // Submit OTP
            const submitBtn = await this.page.$(
              'button[type="submit"], .otp-submit'
            );
            if (submitBtn) {
              await submitBtn.click();
            } else {
              await this.page.keyboard.press("Enter");
            }

            return await this.waitForLoginResult();
          }
        } catch (e) {
          continue;
        }
      }

      throw new Error("Could not find OTP input field");
    } catch (error) {
      return {
        success: false,
        error: `OTP verification failed: ${error.message}`,
      };
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
    const logMessage = `[${timestamp}] [ZaloLogin] ${message}`;
    console.log(logMessage);

    try {
      const logFile = path.join(this.config.profilePath, "zalo-login.log");
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
        await this.log("Zalo browser closed");
      }
    } catch (error) {
      await this.log(`Error closing browser: ${error.message}`);
    }
  }
}

export default ZaloLogin;
