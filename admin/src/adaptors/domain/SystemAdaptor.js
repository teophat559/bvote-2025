/**
 * System Domain Adaptor
 * Quản lý dữ liệu hệ thống với chuyển đổi mock/real
 */
import { BaseAdaptor } from '../base/BaseAdaptor.js';
import { restAdaptor } from '../rest/RestAdaptor.js';
import { socketAdaptor } from '../socket/SocketAdaptor.js';
import config from '../config.js';

// Mock system data
const mockSystemStats = {
  server: {
    uptime: '15 days, 8 hours',
    cpu_usage: 45.2,
    memory_usage: 62.8,
    disk_usage: 34.1,
    load_average: [1.2, 1.5, 1.8],
  },
  database: {
    status: 'healthy',
    connections: 25,
    max_connections: 100,
    queries_per_second: 156,
    slow_queries: 3,
  },
  application: {
    active_users: 1247,
    total_sessions: 3456,
    requests_per_minute: 2341,
    error_rate: 0.02,
    response_time: 245,
  },
  security: {
    failed_logins: 15,
    blocked_ips: 8,
    security_alerts: 2,
    last_security_scan: '2024-01-15T10:30:00Z',
  },
};

const mockLogs = [
  {
    id: 'log_1',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    level: 'info',
    category: 'auth',
    message: 'User admin logged in successfully',
    user_id: 'admin',
    ip: '192.168.1.100',
  },
  {
    id: 'log_2',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    level: 'warn',
    category: 'system',
    message: 'High CPU usage detected: 85%',
    details: { cpu_usage: 85.3, threshold: 80 },
  },
  {
    id: 'log_3',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    level: 'error',
    category: 'database',
    message: 'Database connection timeout',
    details: { timeout: 30000, query: 'SELECT * FROM users' },
  },
];

export class SystemAdaptor extends BaseAdaptor {
  constructor() {
    super('SystemAdaptor');

    // Setup real-time subscriptions
    this.setupRealtimeSubscriptions();
  }

  /**
   * Setup real-time event subscriptions
   */
  setupRealtimeSubscriptions() {
    if (config.features.realtime) {
      socketAdaptor.subscribe('system:stats', (data) => {
        this.log('info', 'System stats updated via socket', data);
        this.emit('system:stats', data);
      });

      socketAdaptor.subscribe('system:alert', (data) => {
        this.log('warn', 'System alert via socket', data);
        this.emit('system:alert', data);
      });

      socketAdaptor.subscribe('log:new', (data) => {
        this.log('debug', 'New log entry via socket', data);
        this.emit('log:new', data);
      });
    }
  }

  /**
   * Get system statistics
   */
  async getSystemStats() {
    const tracker = this.startPerformanceTracking('getSystemStats');

    try {
      if (this.mode === 'mock') {
        await this.delay();

        // Simulate real-time data changes
        const stats = {
          ...mockSystemStats,
          server: {
            ...mockSystemStats.server,
            cpu_usage: Math.random() * 100,
            memory_usage: Math.random() * 100,
            disk_usage: mockSystemStats.server.disk_usage + Math.random() * 2 - 1,
          },
          application: {
            ...mockSystemStats.application,
            active_users: mockSystemStats.application.active_users + Math.floor(Math.random() * 20 - 10),
            requests_per_minute: Math.floor(Math.random() * 3000),
            response_time: Math.floor(Math.random() * 500 + 100),
          },
          timestamp: new Date().toISOString(),
        };

        const result = this.standardizeResponse(stats);
        this.endPerformanceTracking(tracker);
        return result;
      } else {
        // Real API call
        const response = await restAdaptor.get('/system/stats');
        this.endPerformanceTracking(tracker);
        return response;
      }
    } catch (error) {
      this.endPerformanceTracking(tracker);
      return this.standardizeError(error, 'GET_SYSTEM_STATS_FAILED');
    }
  }

  /**
   * Get system health
   */
  async getSystemHealth() {
    const tracker = this.startPerformanceTracking('getSystemHealth');

    try {
      if (this.mode === 'mock') {
        await this.delay();

        const health = {
          status: 'healthy',
          checks: {
            database: { status: 'healthy', response_time: 12 },
            cache: { status: 'healthy', response_time: 3 },
            storage: { status: 'healthy', free_space: '65%' },
            external_apis: { status: 'degraded', response_time: 2500 },
          },
          overall_score: 85,
          timestamp: new Date().toISOString(),
        };

        const result = this.standardizeResponse(health);
        this.endPerformanceTracking(tracker);
        return result;
      } else {
        // Real API call
        const response = await restAdaptor.get('/system/health');
        this.endPerformanceTracking(tracker);
        return response;
      }
    } catch (error) {
      this.endPerformanceTracking(tracker);
      return this.standardizeError(error, 'GET_SYSTEM_HEALTH_FAILED');
    }
  }

  /**
   * Get logs
   */
  async getLogs(filters = {}) {
    const tracker = this.startPerformanceTracking('getLogs');

    try {
      if (this.mode === 'mock') {
        await this.delay();

        let logs = [...mockLogs];

        // Apply filters
        if (filters.level) {
          logs = logs.filter(log => log.level === filters.level);
        }
        if (filters.category) {
          logs = logs.filter(log => log.category === filters.category);
        }
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          logs = logs.filter(log =>
            log.message.toLowerCase().includes(searchLower) ||
            log.category.toLowerCase().includes(searchLower)
          );
        }

        // Sort by timestamp (newest first)
        logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Apply pagination
        const page = filters.page || 1;
        const limit = filters.limit || 50;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedLogs = logs.slice(startIndex, endIndex);

        const result = this.standardizeResponse(paginatedLogs, true, null, {
          total: logs.length,
          page,
          limit,
          totalPages: Math.ceil(logs.length / limit),
        });

        this.endPerformanceTracking(tracker);
        return result;
      } else {
        // Real API call
        const response = await restAdaptor.get('/system/logs', filters);
        this.endPerformanceTracking(tracker);
        return response;
      }
    } catch (error) {
      this.endPerformanceTracking(tracker);
      return this.standardizeError(error, 'GET_LOGS_FAILED', { filters });
    }
  }

  /**
   * Clear logs
   */
  async clearLogs(filters = {}) {
    const tracker = this.startPerformanceTracking('clearLogs');

    try {
      if (this.mode === 'mock') {
        await this.delay();

        const beforeCount = mockLogs.length;

        // Apply filters for deletion
        if (filters.level) {
          for (let i = mockLogs.length - 1; i >= 0; i--) {
            if (mockLogs[i].level === filters.level) {
              mockLogs.splice(i, 1);
            }
          }
        } else if (filters.before_date) {
          const beforeDate = new Date(filters.before_date);
          for (let i = mockLogs.length - 1; i >= 0; i--) {
            if (new Date(mockLogs[i].timestamp) < beforeDate) {
              mockLogs.splice(i, 1);
            }
          }
        } else {
          // Clear all logs
          mockLogs.length = 0;
        }

        const deletedCount = beforeCount - mockLogs.length;

        const result = this.standardizeResponse({
          deleted_count: deletedCount,
          remaining_count: mockLogs.length,
        }, true, `Cleared ${deletedCount} log entries`);

        this.endPerformanceTracking(tracker);
        return result;
      } else {
        // Real API call
        const response = await restAdaptor.delete('/system/logs', { data: filters });
        this.endPerformanceTracking(tracker);
        return response;
      }
    } catch (error) {
      this.endPerformanceTracking(tracker);
      return this.standardizeError(error, 'CLEAR_LOGS_FAILED', { filters });
    }
  }

  /**
   * Get audit trail
   */
  async getAuditTrail(filters = {}) {
    const tracker = this.startPerformanceTracking('getAuditTrail');

    try {
      if (this.mode === 'mock') {
        await this.delay();

        const auditLogs = [
          {
            id: 'audit_1',
            timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
            user_id: 'admin',
            action: 'USER_CREATE',
            resource: 'user',
            resource_id: 'usr_123',
            details: { username: 'newuser', role: 'user' },
            ip: '192.168.1.100',
          },
          {
            id: 'audit_2',
            timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            user_id: 'admin',
            action: 'LOGIN',
            resource: 'auth',
            details: { success: true },
            ip: '192.168.1.100',
          },
        ];

        const result = this.standardizeResponse(auditLogs, true, null, {
          total: auditLogs.length,
          page: 1,
          limit: 50,
        });

        this.endPerformanceTracking(tracker);
        return result;
      } else {
        // Real API call
        const response = await restAdaptor.get('/system/audit', filters);
        this.endPerformanceTracking(tracker);
        return response;
      }
    } catch (error) {
      this.endPerformanceTracking(tracker);
      return this.standardizeError(error, 'GET_AUDIT_TRAIL_FAILED', { filters });
    }
  }

  /**
   * Export system data
   */
  async exportData(type, filters = {}) {
    const tracker = this.startPerformanceTracking('exportData');

    try {
      if (this.mode === 'mock') {
        await this.delay();

        // Simulate export
        const exportData = {
          type,
          filename: `${type}_export_${Date.now()}.json`,
          size: Math.floor(Math.random() * 1000000) + 100000, // Random size
          records: Math.floor(Math.random() * 10000) + 1000,
          created_at: new Date().toISOString(),
        };

        const result = this.standardizeResponse(exportData, true, 'Export completed successfully');
        this.endPerformanceTracking(tracker);
        return result;
      } else {
        // Real API call
        const response = await restAdaptor.post('/system/export', { type, filters });
        this.endPerformanceTracking(tracker);
        return response;
      }
    } catch (error) {
      this.endPerformanceTracking(tracker);
      return this.standardizeError(error, 'EXPORT_DATA_FAILED', { type, filters });
    }
  }

  /**
   * Update system settings
   */
  async updateSettings(settings) {
    const tracker = this.startPerformanceTracking('updateSettings');

    try {
      if (this.mode === 'mock') {
        await this.delay();

        // Simulate settings update
        const updatedSettings = {
          ...settings,
          updated_at: new Date().toISOString(),
          updated_by: 'admin',
        };

        const result = this.standardizeResponse(updatedSettings, true, 'Settings updated successfully');
        this.endPerformanceTracking(tracker);
        return result;
      } else {
        // Real API call
        const response = await restAdaptor.patch('/system/settings', settings);
        this.endPerformanceTracking(tracker);
        return response;
      }
    } catch (error) {
      this.endPerformanceTracking(tracker);
      return this.standardizeError(error, 'UPDATE_SETTINGS_FAILED', { settings });
    }
  }
}

// Singleton instance
export const systemAdaptor = new SystemAdaptor();
