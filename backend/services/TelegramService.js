/**
 * Telegram Notification Service - BVOTE 2025
 * Handles Telegram bot notifications for system events
 */

import https from 'https';
import { config } from 'dotenv';

config();

class TelegramService {
  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.chatId = process.env.TELEGRAM_CHAT_ID;
    this.enabled = process.env.ENABLE_TELEGRAM_NOTIFICATIONS === 'true';
    
    if (this.enabled && (!this.botToken || !this.chatId)) {
      console.warn('⚠️ Telegram notifications enabled but credentials missing');
      this.enabled = false;
    }
    
    if (this.enabled) {
      console.log('✅ Telegram notifications enabled');
      this.sendStartupMessage();
    }
  }

  /**
   * Send message to Telegram
   */
  async sendMessage(message, options = {}) {
    if (!this.enabled) {
      console.log('📱 Telegram disabled, message not sent:', message);
      return false;
    }

    try {
      const payload = {
        chat_id: this.chatId,
        text: message,
        parse_mode: options.parseMode || 'HTML',
        disable_web_page_preview: options.disablePreview || true
      };

      const data = JSON.stringify(payload);
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

      return new Promise((resolve, reject) => {
        const req = https.request(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
          }
        }, (res) => {
          let responseData = '';
          res.on('data', (chunk) => responseData += chunk);
          res.on('end', () => {
            if (res.statusCode === 200) {
              console.log('✅ Telegram message sent successfully');
              resolve(true);
            } else {
              console.error('❌ Telegram API error:', responseData);
              resolve(false);
            }
          });
        });

        req.on('error', (error) => {
          console.error('❌ Telegram request error:', error.message);
          resolve(false);
        });

        req.write(data);
        req.end();
      });
    } catch (error) {
      console.error('❌ Telegram service error:', error.message);
      return false;
    }
  }

  /**
   * Send system startup notification
   */
  async sendStartupMessage() {
    const message = `
🚀 <b>BVOTE 2025 - SYSTEM STARTED</b>

📊 <b>Status:</b> Backend API Online
⏰ <b>Time:</b> ${new Date().toLocaleString()}
🌐 <b>Environment:</b> ${process.env.NODE_ENV || 'development'}
🔗 <b>Health:</b> http://localhost:3000/health

✅ System is ready for operations!
    `.trim();

    return await this.sendMessage(message);
  }

  /**
   * Send error notification
   */
  async sendError(error, context = '') {
    const message = `
❌ <b>BVOTE 2025 - ERROR ALERT</b>

🚨 <b>Error:</b> ${error.message || error}
📍 <b>Context:</b> ${context}
⏰ <b>Time:</b> ${new Date().toLocaleString()}
🔧 <b>Stack:</b> ${error.stack ? error.stack.substring(0, 500) + '...' : 'No stack trace'}

⚠️ Immediate attention required!
    `.trim();

    return await this.sendMessage(message);
  }

  /**
   * Send voting activity notification
   */
  async sendVotingAlert(data) {
    const message = `
🗳️ <b>VOTING ACTIVITY - BVOTE 2025</b>

👤 <b>User:</b> ${data.user || 'Anonymous'}
🎯 <b>Action:</b> ${data.action}
📊 <b>Contest:</b> ${data.contest || 'N/A'}
⏰ <b>Time:</b> ${new Date().toLocaleString()}
🔍 <b>IP:</b> ${data.ip || 'Unknown'}

${data.details || ''}
    `.trim();

    return await this.sendMessage(message);
  }

  /**
   * Send admin action notification
   */
  async sendAdminAlert(data) {
    const message = `
🔧 <b>ADMIN ACTION - BVOTE 2025</b>

👨‍💼 <b>Admin:</b> ${data.admin}
⚡ <b>Action:</b> ${data.action}
📋 <b>Target:</b> ${data.target || 'System'}
⏰ <b>Time:</b> ${new Date().toLocaleString()}
🌐 <b>IP:</b> ${data.ip || 'Unknown'}

${data.details || ''}
    `.trim();

    return await this.sendMessage(message);
  }

  /**
   * Send security alert
   */
  async sendSecurityAlert(data) {
    const message = `
🚨 <b>SECURITY ALERT - BVOTE 2025</b>

⚠️ <b>Threat:</b> ${data.threat}
📍 <b>Source IP:</b> ${data.ip}
🕐 <b>Time:</b> ${new Date().toLocaleString()}
🔍 <b>Details:</b> ${data.details}
🛡️ <b>Action Taken:</b> ${data.action || 'Logged'}

🔒 Review security logs immediately!
    `.trim();

    return await this.sendMessage(message);
  }

  /**
   * Send daily summary
   */
  async sendDailySummary(stats) {
    const message = `
📊 <b>DAILY SUMMARY - BVOTE 2025</b>

📅 <b>Date:</b> ${new Date().toDateString()}

🗳️ <b>Voting Stats:</b>
• Total Votes: ${stats.totalVotes || 0}
• Active Users: ${stats.activeUsers || 0}
• New Registrations: ${stats.newUsers || 0}

🔧 <b>System Stats:</b>
• API Requests: ${stats.apiRequests || 0}
• Errors: ${stats.errors || 0}
• Uptime: ${stats.uptime || 'N/A'}

✅ System operating normally
    `.trim();

    return await this.sendMessage(message);
  }

  /**
   * Test Telegram connection
   */
  async testConnection() {
    if (!this.enabled) {
      return { success: false, message: 'Telegram notifications disabled' };
    }

    const testMessage = `
🧪 <b>TELEGRAM TEST - BVOTE 2025</b>

✅ Connection successful!
⏰ Time: ${new Date().toLocaleString()}
🤖 Bot Token: ...${this.botToken.slice(-10)}
💬 Chat ID: ${this.chatId}

📱 Telegram notifications are working properly!
    `.trim();

    const success = await this.sendMessage(testMessage);
    
    return {
      success,
      message: success ? 'Telegram test successful!' : 'Telegram test failed!'
    };
  }
}

// Export singleton instance
const telegramService = new TelegramService();
export default telegramService;
