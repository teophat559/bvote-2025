import { apiClient } from "./apiClient";

const ENABLE_AUDIT_LOG = import.meta.env.VITE_ENABLE_AUDIT_LOG === "1";

// ========================================
// AUDIT LOG SERVICE
// ========================================
class AuditService {
  constructor() {
    this.enabled = ENABLE_AUDIT_LOG;
    this.localLogs = [];
    this.maxLocalLogs = 1000;
  }

  // ========================================
  // LOGGING METHODS
  // ========================================

  /**
   * Log admin action
   * @param {string} action - Action performed
   * @param {string} resource - Resource affected
   * @param {object} details - Additional details
   * @param {string} userId - User ID affected (if any)
   * @param {string} severity - Log severity (INFO, WARNING, ERROR)
   */
  logAction(action, resource, details = {}, userId = null, severity = "INFO") {
    const auditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      adminId: this.getCurrentAdminId(),
      action,
      resource,
      details,
      userId,
      severity,
      ip: this.getClientIP(),
      userAgent: navigator.userAgent,
      sessionId: this.getSessionId(),
    };

    // Add to local logs
    this.addToLocalLogs(auditLog);

    // Send to backend if enabled
    if (this.enabled) {
      this.sendToBackend(auditLog);
    }

    // Console log for development
    if (import.meta.env.DEV) {
      console.log("🔍 AUDIT LOG:", auditLog);
    }

    return auditLog;
  }

  // ========================================
  // SPECIFIC LOGGING METHODS
  // ========================================

  logUserAction(action, userId, details = {}) {
    return this.logAction(action, "USER", details, userId, "INFO");
  }

  logUserBlock(userId, reason) {
    return this.logAction("USER_BLOCK", "USER", { reason }, userId, "WARNING");
  }

  logUserUnblock(userId, reason) {
    return this.logAction("USER_UNBLOCK", "USER", { reason }, userId, "INFO");
  }

  logUserDelete(userId, reason) {
    return this.logAction("USER_DELETE", "USER", { reason }, userId, "WARNING");
  }

  logUserCreate(userData) {
    return this.logAction("USER_CREATE", "USER", { userData }, null, "INFO");
  }

  logUserUpdate(userId, changes) {
    return this.logAction("USER_UPDATE", "USER", { changes }, userId, "INFO");
  }

  logChromeProfileAction(action, profileId, details = {}) {
    return this.logAction(action, "CHROME_PROFILE", details, null, "INFO");
  }

  logContestAction(action, contestId, details = {}) {
    return this.logAction(action, "CONTEST", details, null, "INFO");
  }

  logSystemAction(action, details = {}) {
    return this.logAction(action, "SYSTEM", details, null, "INFO");
  }

  logSecurityEvent(event, details = {}, severity = "WARNING") {
    return this.logAction(event, "SECURITY", details, null, severity);
  }

  logLoginAttempt(adminId, success, details = {}) {
    const action = success ? "LOGIN_SUCCESS" : "LOGIN_FAILED";
    const severity = success ? "INFO" : "WARNING";
    return this.logAction(action, "AUTH", details, adminId, severity);
  }

  logLogout(adminId) {
    return this.logAction("LOGOUT", "AUTH", {}, adminId, "INFO");
  }

  logDataExport(resource, filters, recordCount) {
    return this.logAction(
      "DATA_EXPORT",
      resource,
      { filters, recordCount },
      null,
      "INFO"
    );
  }

  logDataImport(resource, recordCount, source) {
    return this.logAction(
      "DATA_IMPORT",
      resource,
      { recordCount, source },
      null,
      "INFO"
    );
  }

  logConfigurationChange(setting, oldValue, newValue) {
    return this.logAction(
      "CONFIG_CHANGE",
      "SYSTEM",
      {
        setting,
        oldValue,
        newValue,
      },
      null,
      "INFO"
    );
  }

  // ========================================
  // QUERY METHODS
  // ========================================

  async getAuditLogs(filters = {}) {
    try {
      if (this.enabled) {
        return await apiClient.get("/admin/audit-logs", { params: filters });
      } else {
        return this.getLocalAuditLogs(filters);
      }
    } catch (error) {
      console.error("Failed to get audit logs:", error);
      return this.getLocalAuditLogs(filters);
    }
  }

  async getAuditLogsByUser(userId, limit = 50) {
    try {
      if (this.enabled) {
        return await apiClient.get(`/admin/audit-logs/user/${userId}`, {
          params: { limit },
        });
      } else {
        return this.getLocalAuditLogs({ userId, limit });
      }
    } catch (error) {
      console.error("Failed to get user audit logs:", error);
      return this.getLocalAuditLogs({ userId, limit });
    }
  }

  async getAuditLogsByAction(action, limit = 50) {
    try {
      if (this.enabled) {
        return await apiClient.get(`/admin/audit-logs/action/${action}`, {
          params: { limit },
        });
      } else {
        return this.getLocalAuditLogs({ action, limit });
      }
    } catch (error) {
      console.error("Failed to get action audit logs:", error);
      return this.getLocalAuditLogs({ action, limit });
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  getCurrentAdminId() {
    // Try to get from localStorage or session
    const adminData = localStorage.getItem("admin_data");
    if (adminData) {
      try {
        const parsed = JSON.parse(adminData);
        return parsed.id || parsed.adminId || "unknown";
      } catch {
        return "unknown";
      }
    }
    return "unknown";
  }

  getClientIP() {
    // In a real app, this would come from the server
    // For now, return a placeholder
    return "127.0.0.1";
  }

  getSessionId() {
    return sessionStorage.getItem("session_id") || "unknown";
  }

  addToLocalLogs(log) {
    this.localLogs.unshift(log);

    // Keep only the last maxLocalLogs
    if (this.localLogs.length > this.maxLocalLogs) {
      this.localLogs = this.localLogs.slice(0, this.maxLocalLogs);
    }
  }

  getLocalAuditLogs(filters = {}) {
    let filteredLogs = [...this.localLogs];

    if (filters.userId) {
      filteredLogs = filteredLogs.filter(
        (log) => log.userId === filters.userId
      );
    }

    if (filters.action) {
      filteredLogs = filteredLogs.filter(
        (log) => log.action === filters.action
      );
    }

    if (filters.resource) {
      filteredLogs = filteredLogs.filter(
        (log) => log.resource === filters.resource
      );
    }

    if (filters.severity) {
      filteredLogs = filteredLogs.filter(
        (log) => log.severity === filters.severity
      );
    }

    if (filters.startDate && filters.endDate) {
      filteredLogs = filteredLogs.filter((log) => {
        const logDate = new Date(log.timestamp);
        return (
          logDate >= new Date(filters.startDate) &&
          logDate <= new Date(filters.endDate)
        );
      });
    }

    const limit = filters.limit || 50;
    const page = filters.page || 1;
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      logs: filteredLogs.slice(start, end),
      total: filteredLogs.length,
      page,
      limit,
      totalPages: Math.ceil(filteredLogs.length / limit),
    };
  }

  async sendToBackend(log) {
    try {
      // Check if we're in mock mode
      const useMock = import.meta.env.VITE_USE_MOCK === "1";
      if (useMock) {
        // In mock mode, just store locally
        this.addToLocalLogs(log);
        return;
      }

      await apiClient.post("/admin/audit-logs", log);
    } catch (error) {
      console.error("Failed to send audit log to backend:", error);
      // Store locally if backend fails
      this.addToLocalLogs(log);
    }
  }

  // ========================================
  // EXPORT METHODS
  // ========================================

  exportAuditLogs(filters = {}, format = "json") {
    const logs = this.getLocalAuditLogs(filters);

    if (format === "csv") {
      return this.convertToCSV(logs.logs);
    } else if (format === "json") {
      return JSON.stringify(logs.logs, null, 2);
    }

    return logs.logs;
  }

  convertToCSV(logs) {
    if (!logs.length) return "";

    const headers = Object.keys(logs[0]);
    const csvRows = [headers.join(",")];

    for (const log of logs) {
      const values = headers.map((header) => {
        const value = log[header];
        if (typeof value === "object") {
          return JSON.stringify(value);
        }
        return value;
      });
      csvRows.push(values.join(","));
    }

    return csvRows.join("\n");
  }

  // ========================================
  // CLEANUP METHODS
  // ========================================

  clearLocalLogs() {
    this.localLogs = [];
    console.log("Local audit logs cleared");
  }

  async clearOldLogs(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    if (this.enabled) {
      try {
        await apiClient.delete("/admin/audit-logs/old", {
          params: { cutoffDate: cutoffDate.toISOString() },
        });
      } catch (error) {
        console.error("Failed to clear old logs from backend:", error);
      }
    }

    // Clear local old logs
    this.localLogs = this.localLogs.filter(
      (log) => new Date(log.timestamp) > cutoffDate
    );

    console.log(`Cleared logs older than ${daysOld} days`);
  }
}

export const auditService = new AuditService();

// Export for testing
export { AuditService };
