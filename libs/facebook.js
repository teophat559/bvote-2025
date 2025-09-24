import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";

// Facebook Login Specialized Module
class FacebookLogin {
  constructor(options = {}) {
    this.config = {
      headless: options.headless !== false,
      timeout: options.timeout || 30000,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1366, height: 768 },
      enableScreenshots: options.screenshots || false,
      profilePath: options.profilePath || "./browser-profiles/facebook",
    };

    this.browser = null;
    this.page = null;
    this.isLoggedIn = false;
    this.currentUser = null;
  }

  // Initialize Facebook-specific browser
  async initialize() {
    try {
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
        ],
        defaultViewport: this.config.viewport,
      });

      this.page = await this.browser.newPage();

      // Set Facebook-optimized user agent
      await this.page.setUserAgent(this.config.userAgent);

      // Override navigator.webdriver
      await this.page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, "webdriver", {
          get: () => undefined,
        });
      });

      console.log("Facebook browser initialized");
      return true;
    } catch (error) {
      console.error("Failed to initialize Facebook browser:", error);
      return false;
    }
  }

  // Standard Facebook login
  async login(email, password, options = {}) {
    try {
      console.log(`Attempting Facebook login for: ${email}`);

      await this.page.goto("https://www.facebook.com/login", {
        waitUntil: "networkidle2",
        timeout: this.config.timeout,
      });

      // Handle cookie consent
      await this.handleCookieConsent();

      // Fill login form
      await this.page.waitForSelector("#email", {
        timeout: this.config.timeout,
      });
      await this.page.type("#email", email, { delay: 100 });
      await this.page.type("#pass", password, { delay: 100 });

      if (this.config.enableScreenshots) {
        await this.takeScreenshot("facebook_login_form");
      }

      // Submit login
      await Promise.all([
        this.page.click('button[name="login"]'),
        this.page.waitForNavigation({
          waitUntil: "networkidle2",
          timeout: this.config.timeout,
        }),
      ]);

      const currentUrl = this.page.url();

      // Check for 2FA or checkpoint
      if (currentUrl.includes("/checkpoint/")) {
        console.log("Facebook checkpoint detected");
        return await this.handleCheckpoint(options.twoFactorCode);
      }

      // Check for successful login
      if (!currentUrl.includes("/login/")) {
        this.isLoggedIn = true;
        this.currentUser = email;

        // Save session
        await this.saveSession();

        console.log("Facebook login successful");
        return {
          success: true,
          url: currentUrl,
          cookies: await this.page.cookies(),
          user: await this.getCurrentUser(),
        };
      } else {
        throw new Error("Login failed - credentials may be incorrect");
      }
    } catch (error) {
      console.error("Facebook login failed:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Handle cookie consent popup
  async handleCookieConsent() {
    try {
      const cookieDialog = await this.page.$(
        '[data-testid="cookie-policy-manage-dialog"]'
      );
      if (cookieDialog) {
        const acceptButton = await this.page.$(
          '[data-testid="cookie-policy-manage-dialog"] button'
        );
        if (acceptButton) {
          await acceptButton.click();
          await this.page.waitForTimeout(1000);
        }
      }
    } catch (error) {
      // Cookie dialog not present or already handled
    }
  }

  // Handle Facebook checkpoint/2FA
  async handleCheckpoint(twoFactorCode = null) {
    try {
      console.log("Handling Facebook checkpoint...");

      if (this.config.enableScreenshots) {
        await this.takeScreenshot("facebook_checkpoint");
      }

      // Look for 2FA code input
      const codeInput =
        (await this.page.$('input[name="approvals_code"]')) ||
        (await this.page.$('input[placeholder*="code"]')) ||
        (await this.page.$("#approvals_code"));

      if (codeInput && twoFactorCode) {
        await codeInput.type(twoFactorCode, { delay: 100 });

        const submitButton =
          (await this.page.$('button[type="submit"]')) ||
          (await this.page.$("#checkpointSubmitButton"));

        if (submitButton) {
          await Promise.all([
            submitButton.click(),
            this.page.waitForNavigation({ waitUntil: "networkidle2" }),
          ]);

          // Check if checkpoint passed
          const newUrl = this.page.url();
          if (!newUrl.includes("/checkpoint/")) {
            this.isLoggedIn = true;
            console.log("Facebook checkpoint passed");
            return { success: true, url: newUrl };
          }
        }
      }

      // Try alternative checkpoint methods
      await this.tryAlternativeCheckpoint();

      return { success: false, error: "Checkpoint not resolved" };
    } catch (error) {
      console.error("Checkpoint handling failed:", error.message);
      return { success: false, error: error.message };
    }
  }

  // Try alternative checkpoint resolution methods
  async tryAlternativeCheckpoint() {
    try {
      // Look for "Try Another Way" button
      const tryAnotherWay =
        (await this.page.$('a[href*="try_another_way"]')) ||
        (await this.page.$('button:contains("Try Another Way")'));

      if (tryAnotherWay) {
        await tryAnotherWay.click();
        await this.page.waitForTimeout(2000);
      }

      // Look for "Skip" or "Not Now" options
      const skipButton =
        (await this.page.$('button:contains("Skip")')) ||
        (await this.page.$('button:contains("Not Now")')) ||
        (await this.page.$('a[href*="skip"]'));

      if (skipButton) {
        await skipButton.click();
        await this.page.waitForTimeout(2000);
      }
    } catch (error) {
      console.log("Alternative checkpoint methods failed");
    }
  }

  // Get current logged-in user info
  async getCurrentUser() {
    try {
      // Navigate to profile to get user info
      await this.page.goto("https://www.facebook.com/me", {
        waitUntil: "networkidle2",
      });

      const userInfo = await this.page.evaluate(() => {
        const nameElement =
          document.querySelector('h1[data-testid="profile-name"]') ||
          document.querySelector('[data-testid="profile-name"] span') ||
          document.querySelector("h1");

        const name = nameElement ? nameElement.textContent.trim() : "Unknown";
        const profileUrl = window.location.href;

        return { name, profileUrl };
      });

      return userInfo;
    } catch (error) {
      console.error("Failed to get user info:", error.message);
      return { name: "Unknown", profileUrl: null };
    }
  }

  // Facebook-specific actions
  async postStatus(message, options = {}) {
    if (!this.isLoggedIn) {
      throw new Error("Not logged in to Facebook");
    }

    try {
      await this.page.goto("https://www.facebook.com/", {
        waitUntil: "networkidle2",
      });

      // Click on status composer
      const statusBox =
        (await this.page.$(
          '[role="textbox"][data-testid="status-attachment-mentions-input"]'
        )) ||
        (await this.page.$(
          '[data-testid="status-attachment-mentions-input"]'
        )) ||
        (await this.page.$('div[role="textbox"]'));

      if (statusBox) {
        await statusBox.click();
        await this.page.waitForTimeout(1000);
        await statusBox.type(message, { delay: 100 });

        // Find and click post button
        const postButton =
          (await this.page.$('[data-testid="react-composer-post-button"]')) ||
          (await this.page.$('div[role="button"]:contains("Post")'));

        if (postButton) {
          await postButton.click();
          await this.page.waitForTimeout(2000);

          console.log("Facebook status posted successfully");
          return { success: true };
        }
      }

      throw new Error("Could not find status composer");
    } catch (error) {
      console.error("Failed to post status:", error.message);
      return { success: false, error: error.message };
    }
  }

  // Send friend request
  async sendFriendRequest(profileUrl) {
    if (!this.isLoggedIn) {
      throw new Error("Not logged in to Facebook");
    }

    try {
      await this.page.goto(profileUrl, { waitUntil: "networkidle2" });

      // Look for "Add Friend" button
      const addFriendButton =
        (await this.page.$('div[aria-label="Add Friend"]')) ||
        (await this.page.$('button:contains("Add Friend")')) ||
        (await this.page.$('[data-testid="add-friend-button"]'));

      if (addFriendButton) {
        await addFriendButton.click();
        await this.page.waitForTimeout(1000);

        console.log("Friend request sent");
        return { success: true };
      } else {
        throw new Error("Add Friend button not found");
      }
    } catch (error) {
      console.error("Failed to send friend request:", error.message);
      return { success: false, error: error.message };
    }
  }

  // Join Facebook group
  async joinGroup(groupUrl) {
    if (!this.isLoggedIn) {
      throw new Error("Not logged in to Facebook");
    }

    try {
      await this.page.goto(groupUrl, { waitUntil: "networkidle2" });

      // Look for "Join Group" button
      const joinButton =
        (await this.page.$('div[aria-label="Join Group"]')) ||
        (await this.page.$('button:contains("Join")')) ||
        (await this.page.$('[data-testid="join-group-button"]'));

      if (joinButton) {
        await joinButton.click();
        await this.page.waitForTimeout(1000);

        console.log("Joined Facebook group");
        return { success: true };
      } else {
        console.log("Already member or join button not found");
        return { success: true, message: "Already member or no join button" };
      }
    } catch (error) {
      console.error("Failed to join group:", error.message);
      return { success: false, error: error.message };
    }
  }

  // Save current session
  async saveSession() {
    try {
      const cookies = await this.page.cookies();
      const sessionData = {
        cookies,
        url: this.page.url(),
        timestamp: new Date().toISOString(),
        user: this.currentUser,
      };

      const sessionFile = path.join(this.config.profilePath, "session.json");
      await fs.writeFile(sessionFile, JSON.stringify(sessionData, null, 2));

      console.log("Facebook session saved");
      return true;
    } catch (error) {
      console.error("Failed to save session:", error.message);
      return false;
    }
  }

  // Load previous session
  async loadSession() {
    try {
      const sessionFile = path.join(this.config.profilePath, "session.json");
      const sessionData = JSON.parse(await fs.readFile(sessionFile, "utf8"));

      await this.page.setCookie(...sessionData.cookies);
      await this.page.goto("https://www.facebook.com/", {
        waitUntil: "networkidle2",
      });

      // Check if still logged in
      const currentUrl = this.page.url();
      if (!currentUrl.includes("/login/")) {
        this.isLoggedIn = true;
        this.currentUser = sessionData.user;
        console.log("Facebook session loaded successfully");
        return true;
      } else {
        console.log("Facebook session expired");
        return false;
      }
    } catch (error) {
      console.error("Failed to load session:", error.message);
      return false;
    }
  }

  // Utility methods
  async takeScreenshot(name) {
    if (!this.config.enableScreenshots) return;

    try {
      const filename = `facebook_${name}_${Date.now()}.png`;
      const filepath = path.join("./screenshots", filename);

      // Ensure screenshots directory exists
      await fs.mkdir("./screenshots", { recursive: true });
      await this.page.screenshot({ path: filepath, fullPage: true });

      console.log(`Facebook screenshot saved: ${filename}`);
    } catch (error) {
      console.error("Screenshot failed:", error.message);
    }
  }

  async close() {
    try {
      if (this.browser) {
        await this.browser.close();
        console.log("Facebook browser closed");
      }
    } catch (error) {
      console.error("Error closing Facebook browser:", error.message);
    }
  }
}

export default FacebookLogin;

// Example usage
export const createFacebookLogin = async (options = {}) => {
  const fbLogin = new FacebookLogin(options);
  await fbLogin.initialize();
  return fbLogin;
};
