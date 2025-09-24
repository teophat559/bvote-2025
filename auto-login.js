/**
 * Real Auto Login Script
 * Triển khai auto login thực tế cho các nền tảng
 */

const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

// Cấu hình credentials (KHÔNG commit file này vào git!)
// Production credentials loaded from environment
// Production credentials loaded from environment
const CREDENTIALS = {
  facebook: {
    email: process.env.PROD_FB_EMAIL_1 || process.env.FB_EMAIL,
    password: process.env.PROD_FB_PASSWORD_1 || process.env.FB_PASSWORD
  },
  gmail: {
    email: process.env.PROD_GMAIL_EMAIL_1 || process.env.GMAIL_EMAIL,
    password: process.env.PROD_GMAIL_PASSWORD_1 || process.env.GMAIL_PASSWORD
  },
  instagram: {
    username: process.env.PROD_IG_USERNAME_1 || process.env.IG_USERNAME,
    password: process.env.PROD_IG_PASSWORD_1 || process.env.IG_PASSWORD
  }
};

class RealAutoLogin {
  constructor() {
    this.browser = null;
    this.results = [];
    this.logFile = path.join(__dirname, "auto-login-results.log");
  }

  /**
   * Initialize browser
   */
  async initBrowser() {
    this.browser = await puppeteer.launch({
      headless: process.env.BROWSER_HEADLESS === 'true', // Set to true for production
      args: [
        "--disable-notifications",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],
      defaultViewport: {
        width: 1366,
        height: 768,
      },
    });

    console.log("🚀 Browser initialized");
    this.log("Browser initialized");
  }

  /**
   * Auto login to Facebook
   */
  async loginFacebook() {
    const page = await this.browser.newPage();
    const platform = "Facebook";

    try {
      console.log(`🔐 Starting ${platform} auto login...`);
      this.log(`Starting ${platform} auto login`);

      await page.goto("https://www.facebook.com/login", {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // Fill email
      await page.waitForSelector('input[name="email"]', { timeout: 10000 });
      await page.type('input[name="email"]', CREDENTIALS.facebook.email);

      // Fill password
      await page.type('input[name="pass"]', CREDENTIALS.facebook.password);

      // Click login
      await page.click('button[name="login"]');

      // Wait for navigation or 2FA
      try {
        await page.waitForNavigation({ timeout: 15000 });

        // Check if login successful
        const currentUrl = page.url();
        if (
          currentUrl.includes("facebook.com") &&
          !currentUrl.includes("login")
        ) {
          console.log(`✅ ${platform} login successful`);
          this.log(`${platform} login successful`);
          this.results.push({ platform, status: "success", url: currentUrl });
        } else {
          throw new Error("Login failed - still on login page");
        }
      } catch (navError) {
        // Check for 2FA or other challenges
        const pageContent = await page.content();
        if (
          pageContent.includes("two-factor") ||
          pageContent.includes("security")
        ) {
          console.log(`⚠️ ${platform} requires 2FA verification`);
          this.log(`${platform} requires 2FA verification`);
          this.results.push({
            platform,
            status: "requires_2fa",
            message: "2FA required",
          });
        } else {
          throw navError;
        }
      }
    } catch (error) {
      console.error(`❌ ${platform} login failed:`, error.message);
      this.log(`${platform} login failed: ${error.message}`);
      this.results.push({ platform, status: "failed", error: error.message });
    } finally {
      await page.close();
    }
  }

  /**
   * Auto login to Gmail
   */
  async loginGmail() {
    const page = await this.browser.newPage();
    const platform = "Gmail";

    try {
      console.log(`🔐 Starting ${platform} auto login...`);
      this.log(`Starting ${platform} auto login`);

      await page.goto("https://accounts.google.com/signin", {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // Fill email
      await page.waitForSelector("#identifierId", { timeout: 10000 });
      await page.type("#identifierId", CREDENTIALS.gmail.email);
      await page.click("#identifierNext");

      // Wait for password field
      await page.waitForSelector('input[name="password"]', { timeout: 10000 });
      await page.type('input[name="password"]', CREDENTIALS.gmail.password);
      await page.click("#passwordNext");

      // Wait for navigation
      await page.waitForNavigation({ timeout: 15000 });

      const currentUrl = page.url();
      if (
        currentUrl.includes("myaccount.google.com") ||
        currentUrl.includes("mail.google.com")
      ) {
        console.log(`✅ ${platform} login successful`);
        this.log(`${platform} login successful`);
        this.results.push({ platform, status: "success", url: currentUrl });
      } else {
        throw new Error("Login failed - unexpected redirect");
      }
    } catch (error) {
      console.error(`❌ ${platform} login failed:`, error.message);
      this.log(`${platform} login failed: ${error.message}`);
      this.results.push({ platform, status: "failed", error: error.message });
    } finally {
      await page.close();
    }
  }

  /**
   * Auto login to Instagram
   */
  async loginInstagram() {
    const page = await this.browser.newPage();
    const platform = "Instagram";

    try {
      console.log(`🔐 Starting ${platform} auto login...`);
      this.log(`Starting ${platform} auto login`);

      await page.goto("https://www.instagram.com/accounts/login/", {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // Fill username
      await page.waitForSelector('input[name="username"]', { timeout: 10000 });
      await page.type('input[name="username"]', CREDENTIALS.instagram.username);

      // Fill password
      await page.type('input[name="password"]', CREDENTIALS.instagram.password);

      // Click login
      await page.click('button[type="submit"]');

      // Wait for navigation
      await page.waitForNavigation({ timeout: 15000 });

      const currentUrl = page.url();
      if (
        currentUrl.includes("instagram.com") &&
        !currentUrl.includes("login")
      ) {
        console.log(`✅ ${platform} login successful`);
        this.log(`${platform} login successful`);
        this.results.push({ platform, status: "success", url: currentUrl });
      } else {
        throw new Error("Login failed - still on login page");
      }
    } catch (error) {
      console.error(`❌ ${platform} login failed:`, error.message);
      this.log(`${platform} login failed: ${error.message}`);
      this.results.push({ platform, status: "failed", error: error.message });
    } finally {
      await page.close();
    }
  }

  /**
   * Run all auto logins
   */
  async runAllLogins() {
    try {
      await this.initBrowser();

      console.log("🎯 Starting real auto login process...");
      this.log("=== REAL AUTO LOGIN SESSION STARTED ===");

      // Check if credentials are provided
      if (!CREDENTIALS.facebook.email && !process.env.FB_EMAIL) {
        console.log(
          "⚠️ No credentials provided. Set environment variables or update CREDENTIALS object."
        );
        this.log("No credentials provided");
        return;
      }

      // Run logins sequentially to avoid overwhelming
      if (CREDENTIALS.facebook.email) {
        await this.loginFacebook();
        await this.delay(2000);
      }

      if (CREDENTIALS.gmail.email) {
        await this.loginGmail();
        await this.delay(2000);
      }

      if (CREDENTIALS.instagram.username) {
        await this.loginInstagram();
        await this.delay(2000);
      }

      // Print results
      console.log("\n📊 Auto Login Results:");
      this.results.forEach((result) => {
        const status =
          result.status === "success"
            ? "✅"
            : result.status === "requires_2fa"
            ? "⚠️"
            : "❌";
        console.log(`${status} ${result.platform}: ${result.status}`);
        if (result.error) console.log(`   Error: ${result.error}`);
        if (result.message) console.log(`   Message: ${result.message}`);
      });

      this.log("=== AUTO LOGIN SESSION COMPLETED ===");
    } catch (error) {
      console.error("❌ Auto login process failed:", error);
      this.log(`Auto login process failed: ${error.message}`);
    } finally {
      if (this.browser) {
        await this.browser.close();
        console.log("🔚 Browser closed");
      }
    }
  }

  /**
   * Delay helper
   */
  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Log to file
   */
  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(this.logFile, logEntry);
  }
}

// Export for use in other modules
module.exports = RealAutoLogin;

// Run if called directly
if (require.main === module) {
  const autoLogin = new RealAutoLogin();
  autoLogin.runAllLogins().catch(console.error);
}
