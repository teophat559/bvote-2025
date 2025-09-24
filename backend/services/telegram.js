/**
 * Telegram Bot Integration
 * votingonline2025.site
 */

import axios from "axios";
import dotenv from "dotenv";

dotenv.config({ path: ".env.production" });

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const ENABLE_TELEGRAM = process.env.ENABLE_TELEGRAM_ALERTS === "true";

class TelegramService {
  constructor() {
    this.botToken = TELEGRAM_BOT_TOKEN;
    this.chatId = TELEGRAM_CHAT_ID;
    this.enabled = ENABLE_TELEGRAM && this.botToken && this.chatId;

    if (!this.enabled) {
      console.log("⚠️ Telegram notifications disabled or not configured");
    } else {
      console.log("📱 Telegram notifications enabled");
      this.sendStartupMessage();
    }
  }

  async sendMessage(message, options = {}) {
    if (!this.enabled) return null;

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

      const payload = {
        chat_id: this.chatId,
        text: message,
        parse_mode: options.parseMode || "Markdown",
        disable_web_page_preview: options.disablePreview || true,
        ...options,
      };

      const response = await axios.post(url, payload, {
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      console.error("❌ Failed to send Telegram message:", error.message);
      return null;
    }
  }

  async sendStartupMessage() {
    const message = `
🚀 *BVOTE System Started*

🌐 *Server:* votingonline2025.site
⏰ *Time:* ${new Date().toLocaleString()}
🔧 *Environment:* Production
📊 *Status:* Online

✅ System is now running and monitoring active.
    `.trim();

    await this.sendMessage(message);
  }

  async sendAlert(type, title, description, metadata = {}) {
    const emoji = this.getAlertEmoji(type);

    const message = `
${emoji} *${title}*

📋 *Type:* ${type}
⏰ *Time:* ${new Date().toLocaleString()}
🌐 *Server:* votingonline2025.site

${description}

${
  Object.keys(metadata).length > 0
    ? `📊 *Details:*\n${JSON.stringify(metadata, null, 2)}`
    : ""
}
    `.trim();

    await this.sendMessage(message);
  }

  async sendSystemHealth(healthData) {
    const statusEmoji = healthData.status === "healthy" ? "✅" : "⚠️";

    const message = `
${statusEmoji} *System Health Report*

📊 *Status:* ${healthData.status}
💾 *Memory:* ${Math.round(healthData.memory?.heapUsed / 1024 / 1024) || 0}MB
⏱️ *Uptime:* ${Math.floor(healthData.uptime / 60) || 0} minutes
🌐 *Environment:* ${healthData.environment}
📅 *Time:* ${new Date().toLocaleString()}

🔧 *Services:*
• Database: ${healthData.services?.database || "unknown"}
• Redis: ${healthData.services?.redis || "unknown"}
    `.trim();

    await this.sendMessage(message);
  }

  async sendLoginRequestAlert(action, requestData) {
    const actionEmoji = {
      created: "📝",
      updated: "📋",
      completed: "✅",
      failed: "❌",
      deleted: "🗑️",
    };

    const message = `
${actionEmoji[action] || "📋"} *Login Request ${action.toUpperCase()}*

🔐 *Platform:* ${requestData.platform}
👤 *Account:* ${requestData.account}
📊 *Status:* ${requestData.status}
⏰ *Time:* ${new Date().toLocaleString()}

${requestData.notes ? `📝 *Notes:* ${requestData.notes}` : ""}
    `.trim();

    await this.sendMessage(message);
  }

  async sendUserActivity(action, userData, metadata = {}) {
    const message = `
👤 *User Activity: ${action.toUpperCase()}*

📧 *Email:* ${userData.email}
👨‍💼 *Role:* ${userData.role}
⏰ *Time:* ${new Date().toLocaleString()}
🌐 *IP:* ${metadata.ip || "unknown"}

${
  metadata.userAgent
    ? `🖥️ *Browser:* ${metadata.userAgent.substring(0, 50)}...`
    : ""
}
    `.trim();

    await this.sendMessage(message);
  }

  async sendErrorAlert(error, context = {}) {
    const message = `
🚨 *System Error Alert*

❌ *Error:* ${error.message}
📁 *File:* ${error.stack?.split("\n")[1] || "unknown"}
⏰ *Time:* ${new Date().toLocaleString()}

🔍 *Context:*
${JSON.stringify(context, null, 2)}

🌐 *Server:* votingonline2025.site
    `.trim();

    await this.sendMessage(message);
  }

  getAlertEmoji(type) {
    const emojis = {
      error: "🚨",
      warning: "⚠️",
      info: "📋",
      success: "✅",
      security: "🔒",
      performance: "📊",
      database: "🗄️",
      system: "🔧",
    };

    return emojis[type] || "📋";
  }

  // Test method
  async testConnection() {
    if (!this.enabled) {
      return { success: false, message: "Telegram not configured" };
    }

    try {
      const result = await this.sendMessage(
        "🧪 *Test Message*\n\nTelegram integration is working correctly!"
      );
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export default new TelegramService();
