import express from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../database.js";

const router = express.Router();

/**
 * POST /api/facebook/login
 * Initiate Facebook login with proxy
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password, proxyId } = req.body;

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

    // In production, you'd submit the OTP to Facebook via Puppeteer
    // For now, we'll simulate success
    await db.execute(
      "UPDATE facebook_accounts SET status = 'success' WHERE id = ?",
      [accountId]
    );

    await logAction(accountId, "✅ Đăng nhập thành công!", "success");

    res.json({
      success: true,
      message: "OTP submitted successfully",
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
 * Perform Facebook login (async)
 */
async function performFacebookLogin(accountId, email, password, proxyId) {
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

    if (proxy) {
      await logAction(accountId, "🌐 Đang kết nối proxy...", "info");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await logAction(accountId, "✅ Proxy kết nối thành công", "success");
    }

    await logAction(accountId, "🚀 Đang mở Facebook...", "info");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await logAction(accountId, "✅ Đã mở Facebook", "success");

    await logAction(accountId, "✏️ Đang nhập thông tin đăng nhập...", "info");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await logAction(accountId, "🔐 Đang xử lý đăng nhập...", "info");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simulate checkpoint detection (30% chance)
    const hasCheckpoint = Math.random() > 0.7;

    if (hasCheckpoint) {
      await logAction(accountId, "🔍 Phát hiện checkpoint...", "warning");
      await logAction(
        accountId,
        "📱 Yêu cầu phê duyệt từ điện thoại...",
        "warning"
      );

      await db.execute(
        "UPDATE facebook_accounts SET status = 'checkpoint' WHERE id = ?",
        [accountId]
      );

      // Simulate waiting for approval
      await new Promise((resolve) => setTimeout(resolve, 5000));
      await logAction(accountId, "⏳ Đang kiểm tra... (polling)", "info");

      // In production, you'd poll for actual approval
      // For now, simulate success after delay
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await logAction(
        accountId,
        "✅ Đã phát hiện phê duyệt thành công!",
        "success"
      );
    }

    await logAction(accountId, "✅ Đăng nhập thành công!", "success");

    // Extract cookies
    await logAction(accountId, "🍪 Đang trích xuất cookie...", "info");
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simulate cookie data
    const cookieData = JSON.stringify({
      cookies: [
        { name: "c_user", value: "100000000000000" },
        { name: "xs", value: "mock_xs_value" },
      ],
    });

    await logAction(accountId, "✅ Đã lấy 42 cookies", "success");

    // Save cookies
    await logAction(accountId, "💾 Đang lưu cookie vào database...", "info");
    await db.execute(
      "UPDATE facebook_accounts SET cookie_data = ?, status = 'success', last_login = NOW() WHERE id = ?",
      [cookieData, accountId]
    );
    await logAction(accountId, "✅ Đã lưu cookie vào database", "success");

    await logAction(accountId, "🎉 Hoàn tất! Tất cả dữ liệu đã được lưu", "success");
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
  }
}

export default router;
