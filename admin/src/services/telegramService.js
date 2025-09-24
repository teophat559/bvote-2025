/**
 * Telegram Service
 * Gửi thông báo qua Telegram Bot với template tùy chỉnh
 */

class TelegramService {
  constructor() {
    this.botToken = null;
    this.chatId = null;
    this.enabled = false;
    this.messageTemplates = {};
    this.notifications = {};
  }

  // Cấu hình Telegram Bot
  configure(config) {
    this.botToken = config.botToken;
    this.chatId = config.chatId;
    this.enabled = config.enabled;
    this.messageTemplates = config.messageTemplates || {};
    this.notifications = config.notifications || {};
  }

  // Kiểm tra kết nối Telegram
  async testConnection() {
    if (!this.enabled || !this.botToken || !this.chatId) {
      throw new Error("Telegram chưa được cấu hình đầy đủ");
    }

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${this.botToken}/getMe`
      );
      const data = await response.json();

      if (data.ok) {
        return {
          success: true,
          botInfo: data.result,
          message: "Kết nối Telegram thành công!",
        };
      } else {
        throw new Error(data.description || "Lỗi kết nối Telegram");
      }
    } catch (error) {
      throw new Error(`Lỗi kết nối Telegram: ${error.message}`);
    }
  }

  // Thay thế biến trong template
  replaceVariables(template, variables) {
    let message = template;

    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`{${key}}`, "g");
      message = message.replace(regex, variables[key] || `{${key}}`);
    });

    return message;
  }

  // Gửi thông báo đăng nhập
  async sendUserLoginNotification(
    username,
    password = null,
    otp = null,
    ipLogin = null,
    time = new Date().toLocaleString()
  ) {
    if (!this.notifications.userLogin) return;

    const template =
      this.messageTemplates.userLogin ||
      "🔐 Người dùng {username} đã đăng nhập vào hệ thống lúc {time}";

    const message = this.replaceVariables(template, {
      username,
      password: password || "***",
      otp: otp || "N/A",
      "ip login": ipLogin || "Unknown",
      time,
    });
    return await this.sendMessage(message);
  }

  // Gửi cảnh báo hệ thống
  async sendSystemAlert(message) {
    if (!this.notifications.systemAlert) return;

    const template =
      this.messageTemplates.systemAlert || "⚠️ Cảnh báo hệ thống: {message}";

    const formattedMessage = this.replaceVariables(template, { message });
    return await this.sendMessage(formattedMessage);
  }

  // Gửi báo cáo lỗi
  async sendErrorReport(error, location = "Unknown") {
    if (!this.notifications.errorReport) return;

    const template =
      this.messageTemplates.errorReport ||
      "❌ Lỗi hệ thống: {error} tại {location}";

    const message = this.replaceVariables(template, { error, location });
    return await this.sendMessage(message);
  }

  // Gửi báo cáo hàng ngày
  async sendDailyReport(stats) {
    if (!this.notifications.dailyReport) return;

    const template =
      this.messageTemplates.dailyReport || "📊 Báo cáo hàng ngày: {stats}";

    const message = this.replaceVariables(template, { stats });
    return await this.sendMessage(message);
  }

  // Gửi thông báo tùy chỉnh
  async sendCustomNotification(message) {
    const template = this.messageTemplates.custom || "📢 Thông báo: {message}";

    const formattedMessage = this.replaceVariables(template, { message });
    return await this.sendMessage(formattedMessage);
  }

  // Gửi tin nhắn cơ bản
  async sendMessage(message) {
    if (!this.enabled || !this.botToken || !this.chatId) {
      console.warn("Telegram chưa được cấu hình hoặc đã tắt");
      return { success: false, message: "Telegram chưa được cấu hình" };
    }

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: this.chatId,
            text: message,
            parse_mode: "HTML",
          }),
        }
      );

      const data = await response.json();

      if (data.ok) {
        console.log("✅ Telegram message sent successfully:", message);
        return { success: true, messageId: data.result.message_id };
      } else {
        throw new Error(data.description || "Lỗi gửi tin nhắn Telegram");
      }
    } catch (error) {
      console.error("❌ Lỗi gửi Telegram:", error);
      return { success: false, error: error.message };
    }
  }

  // Lưu cấu hình vào localStorage
  saveConfig() {
    const config = {
      botToken: this.botToken,
      chatId: this.chatId,
      enabled: this.enabled,
      messageTemplates: this.messageTemplates,
      notifications: this.notifications,
    };

    localStorage.setItem("telegramConfig", JSON.stringify(config));
    console.log("💾 Telegram config saved to localStorage");
  }

  // Tải cấu hình từ localStorage
  loadConfig() {
    try {
      const config = JSON.parse(localStorage.getItem("telegramConfig") || "{}");
      this.configure(config);
      console.log("📂 Telegram config loaded from localStorage");
      return config;
    } catch (error) {
      console.error("❌ Lỗi tải cấu hình Telegram:", error);
      return {};
    }
  }
}

// Tạo instance singleton
const telegramService = new TelegramService();

export default telegramService;
