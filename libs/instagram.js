import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";

// Instagram Login Automation Module
class InstagramLogin {
  constructor(options = {}) {
    this.config = {
      headless: options.headless !== false,
      timeout: options.timeout || 30000,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1366, height: 768 },
      enableScreenshots: options.screenshots || false,
      profilePath: options.profilePath || "./browser-profiles/instagram",
      screenshotsDir: "./screenshots/instagram",
      retries: options.retries || 3,
      enableStealth: options.enableStealth !== false,
    };

    this.browser = null;
    this.page = null;
    this.isLoggedIn = false;
    this.currentUser = null;
    this.loginUrl = "https://www.instagram.com/accounts/login/";
    this.homeUrl = "https://www.instagram.com/";
  }

  // Initialize Instagram-specific browser
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

      // Set Instagram-optimized settings
      await this.page.setUserAgent(this.config.userAgent);
      await this.page.setExtraHTTPHeaders({
        "Accept-Language": "en-US,en;q=0.9",
      });

      if (this.config.enableStealth) {
        await this.setupStealth();
      }

      await this.log("Instagram login module initialized successfully");
      return true;
    } catch (error) {
      await this.log(`Failed to initialize Instagram login: ${error.message}`);
      throw error;
    }
  }

  // Setup stealth mode
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
    });
  }

  // Login to Instagram
  async login(credentials) {
    try {
      const { username, password } = credentials;

      if (!username || !password) {
        throw new Error("Username and password are required");
      }

      await this.log(
        `Attempting to login to Instagram with username: ${username}`
      );

      // Navigate to Instagram login
      await this.page.goto(this.loginUrl, { waitUntil: "networkidle2" });

      if (this.config.enableScreenshots) {
        await this.takeScreenshot("01-instagram-login-page");
      }

      // Check if already logged in
      const isAlreadyLoggedIn = await this.checkIfLoggedIn();
      if (isAlreadyLoggedIn) {
        await this.log("Already logged in to Instagram");
        return {
          success: true,
          platform: "instagram",
          url: this.page.url(),
          message: "Already authenticated",
        };
      }

      // Handle cookie consent if present
      await this.handleCookieConsent();

      // Fill login form
      await this.fillLoginForm(username, password);

      if (this.config.enableScreenshots) {
        await this.takeScreenshot("02-login-form-filled");
      }

      // Submit login form
      await this.submitLoginForm();

      // Wait for login result
      const loginResult = await this.waitForLoginResult();

      if (loginResult.success) {
        this.isLoggedIn = true;
        this.currentUser = username;
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
        platform: "instagram",
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
        currentUrl === "https://www.instagram.com/" ||
        currentUrl.includes("/feed/")
      ) {
        return true;
      }

      // Look for Instagram home page elements
      const homeSelectors = [
        '[data-testid="new-post-button"]',
        'svg[aria-label="New post"]',
        'a[href="/direct/inbox/"]',
        '[data-testid="home-link"]',
      ];

      for (const selector of homeSelectors) {
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

  // Handle cookie consent popup
  async handleCookieConsent() {
    try {
      const cookieSelectors = [
        'button:contains("Accept All")',
        'button:contains("Accept")',
        '[data-testid="cookie-accept"]',
        '.x1i10hfl:contains("Accept")',
      ];

      for (const selector of cookieSelectors) {
        try {
          const cookieBtn = await this.page.waitForSelector(selector, {
            timeout: 5000,
          });
          if (cookieBtn) {
            await cookieBtn.click();
            await this.page.waitForTimeout(1000);
            break;
          }
        } catch (e) {
          continue;
        }
      }
    } catch (error) {
      // Cookie consent not found or already handled
    }
  }

  // Fill login form
  async fillLoginForm(username, password) {
    try {
      // Wait for login form
      const usernameSelectors = [
        'input[name="username"]',
        'input[aria-label="Phone number, username, or email"]',
        'input[placeholder*="username"]',
        'input[autocomplete="username"]',
      ];

      const passwordSelectors = [
        'input[name="password"]',
        'input[type="password"]',
        'input[aria-label="Password"]',
        'input[autocomplete="current-password"]',
      ];

      // Fill username
      let usernameInput = null;
      for (const selector of usernameSelectors) {
        try {
          usernameInput = await this.page.waitForSelector(selector, {
            timeout: 10000,
          });
          if (usernameInput) break;
        } catch (e) {
          continue;
        }
      }

      if (!usernameInput) {
        throw new Error("Could not find username input field");
      }

      await usernameInput.click({ clickCount: 3 });
      await usernameInput.type(username, { delay: 100 });

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
        'button:contains("Log in")',
        'button:contains("Log In")',
        'div[role="button"]:contains("Log in")',
        "button._acan._acap._acas._aj1-",
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
      const timeout = this.config.timeout;
      const startTime = Date.now();

      while (Date.now() - startTime < timeout) {
        const currentUrl = this.page.url();

        // Success indicators
        if (
          currentUrl === "https://www.instagram.com/" ||
          currentUrl.includes("/feed/")
        ) {
          await this.log("Login successful - redirected to home page");
          return {
            success: true,
            platform: "instagram",
            url: currentUrl,
            message: "Successfully logged in to Instagram",
          };
        }

        // Check for home page elements
        const homeSelectors = [
          '[data-testid="new-post-button"]',
          'svg[aria-label="New post"]',
          'a[href="/direct/inbox/"]',
        ];

        for (const selector of homeSelectors) {
          const element = await this.page.$(selector);
          if (element) {
            await this.log("Login successful - found home page elements");
            return {
              success: true,
              platform: "instagram",
              url: currentUrl,
              message: "Successfully logged in to Instagram",
            };
          }
        }

        // Check for 2FA requirement
        const twoFASelectors = [
          'input[aria-label*="security code"]',
          'input[placeholder*="security code"]',
          '[data-testid="security-code"]',
          'h1:contains("Two-factor authentication required")',
        ];

        for (const selector of twoFASelectors) {
          const element = await this.page.$(selector);
          if (element) {
            await this.log("2FA verification required");
            return {
              success: false,
              platform: "instagram",
              url: currentUrl,
              error: "2FA verification required",
              twoFactorRequired: true,
              verificationMethod: "sms_or_app",
            };
          }
        }

        // Check for errors
        const errorSelectors = [
          '[data-testid="login-error"]',
          'p:contains("Sorry, your password was incorrect")',
          'p:contains("The username you entered doesn\'t belong")',
          'p:contains("We couldn\'t connect to Instagram")',
          'div[role="alert"]',
        ];

        for (const selector of errorSelectors) {
          const element = await this.page.$(selector);
          if (element) {
            const errorText = await element.textContent();
            await this.log(`Login error detected: ${errorText}`);
            return {
              success: false,
              platform: "instagram",
              url: currentUrl,
              error: errorText || "Authentication failed",
            };
          }
        }

        // Check for suspicious login challenge
        if (currentUrl.includes("/challenge/")) {
          return {
            success: false,
            platform: "instagram",
            url: currentUrl,
            error: "Suspicious login activity detected - verification required",
            suspiciousActivity: true,
          };
        }

        await this.page.waitForTimeout(2000);
      }

      return {
        success: false,
        platform: "instagram",
        url: this.page.url(),
        error: "Login timeout - unable to determine result",
      };
    } catch (error) {
      return {
        success: false,
        platform: "instagram",
        error: `Login verification failed: ${error.message}`,
        url: this.page.url(),
      };
    }
  }

  // Handle 2FA verification
  async verify2FA(code) {
    try {
      const codeSelectors = [
        'input[aria-label*="security code"]',
        'input[placeholder*="security code"]',
        '[data-testid="security-code"]',
        'input[name="verificationCode"]',
      ];

      let codeInput = null;
      for (const selector of codeSelectors) {
        try {
          codeInput = await this.page.waitForSelector(selector, {
            timeout: 10000,
          });
          if (codeInput) break;
        } catch (e) {
          continue;
        }
      }

      if (!codeInput) {
        throw new Error("Could not find 2FA code input field");
      }

      await codeInput.type(code, { delay: 100 });

      // Submit the code
      const submitBtn = await this.page.$(
        'button[type="submit"], button:contains("Confirm")'
      );
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

  // Post photo with caption
  async postPhoto(imagePath, caption = "") {
    try {
      if (!this.isLoggedIn) {
        throw new Error("Not logged in to Instagram");
      }

      // Navigate to Instagram home if not already there
      if (!this.page.url().includes("instagram.com")) {
        await this.page.goto(this.homeUrl, { waitUntil: "networkidle2" });
      }

      // Click new post button
      const newPostSelectors = [
        '[data-testid="new-post-button"]',
        'svg[aria-label="New post"]',
        '[aria-label="New post"]',
      ];

      let newPostClicked = false;
      for (const selector of newPostSelectors) {
        try {
          const newPostBtn = await this.page.waitForSelector(selector, {
            timeout: 10000,
          });
          if (newPostBtn) {
            await newPostBtn.click();
            newPostClicked = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!newPostClicked) {
        throw new Error("Could not find new post button");
      }

      await this.page.waitForTimeout(2000);

      // Upload photo
      const fileInput = await this.page.waitForSelector('input[type="file"]', {
        timeout: 10000,
      });
      await fileInput.uploadFile(imagePath);

      await this.page.waitForTimeout(3000);

      // Click Next to go to editing
      const nextBtn = await this.page.waitForSelector(
        'button:contains("Next")',
        { timeout: 10000 }
      );
      await nextBtn.click();

      await this.page.waitForTimeout(2000);

      // Click Next again to go to caption
      const nextBtn2 = await this.page.waitForSelector(
        'button:contains("Next")',
        { timeout: 10000 }
      );
      await nextBtn2.click();

      await this.page.waitForTimeout(2000);

      // Add caption if provided
      if (caption) {
        const captionArea = await this.page.waitForSelector(
          'textarea[aria-label="Write a caption..."]',
          { timeout: 10000 }
        );
        await captionArea.type(caption, { delay: 50 });
      }

      // Share/Post
      const shareBtn = await this.page.waitForSelector(
        'button:contains("Share")',
        { timeout: 10000 }
      );
      await shareBtn.click();

      await this.log(`Photo posted successfully`);

      return {
        success: true,
        imagePath,
        caption,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      await this.log(`Failed to post photo: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Follow a user
  async followUser(username) {
    try {
      if (!this.isLoggedIn) {
        throw new Error("Not logged in to Instagram");
      }

      // Navigate to user profile
      const profileUrl = `https://www.instagram.com/${username}/`;
      await this.page.goto(profileUrl, { waitUntil: "networkidle2" });

      // Look for follow button
      const followSelectors = [
        'button:contains("Follow")',
        '[data-testid="follow-button"]',
        'button._acan._acap._acas._aj1-._ap30:contains("Follow")',
      ];

      let followClicked = false;
      for (const selector of followSelectors) {
        try {
          const followBtn = await this.page.waitForSelector(selector, {
            timeout: 10000,
          });
          if (followBtn) {
            await followBtn.click();
            followClicked = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!followClicked) {
        return {
          success: false,
          error:
            "Could not find follow button - user might be private or already followed",
        };
      }

      await this.log(`Followed user: ${username}`);

      return {
        success: true,
        username,
        action: "follow",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      await this.log(`Failed to follow user ${username}: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Like a post by URL
  async likePost(postUrl) {
    try {
      if (!this.isLoggedIn) {
        throw new Error("Not logged in to Instagram");
      }

      // Navigate to post
      await this.page.goto(postUrl, { waitUntil: "networkidle2" });

      // Look for like button
      const likeSelectors = [
        'svg[aria-label="Like"]',
        '[data-testid="like-button"]',
        'button[aria-label="Like"]',
      ];

      let likeClicked = false;
      for (const selector of likeSelectors) {
        try {
          const likeBtn = await this.page.waitForSelector(selector, {
            timeout: 10000,
          });
          if (likeBtn) {
            await likeBtn.click();
            likeClicked = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!likeClicked) {
        return {
          success: false,
          error: "Could not find like button or post already liked",
        };
      }

      await this.log(`Liked post: ${postUrl}`);

      return {
        success: true,
        postUrl,
        action: "like",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      await this.log(`Failed to like post: ${error.message}`);
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
    const logMessage = `[${timestamp}] [InstagramLogin] ${message}`;
    console.log(logMessage);

    try {
      const logFile = path.join(this.config.profilePath, "instagram-login.log");
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
        await this.log("Instagram browser closed");
      }
    } catch (error) {
      await this.log(`Error closing browser: ${error.message}`);
    }
  }
}

export default InstagramLogin;
