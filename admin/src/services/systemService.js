import { systemAdaptor } from '../adaptors';
import { auditService } from './auditService';

class SystemService {
    constructor() {
        this.baseUrl = '/admin/system';
    }

    async getSystemStats() {
        try {
            const response = await systemAdaptor.getSystemStats();
            if (response.success) {
                auditService.logAction('SYSTEM_STATS_VIEW', 'SYSTEM');
            }
            return response;
        } catch (error) {
            console.error('Failed to get system stats:', error);
            throw error;
        }
    }

    async getSystemHealth() {
        try {
            const response = await systemAdaptor.getSystemHealth();
            if (response.success) {
                auditService.logAction('SYSTEM_HEALTH_VIEW', 'SYSTEM');
            }
            return response;
        } catch (error) {
            console.error('Failed to get system health:', error);
            throw error;
        }
    }

    async getLogs(filters = {}) {
        try {
            const response = await systemAdaptor.getLogs(filters);
            if (response.success) {
                auditService.logAction('LOGS_VIEW', 'SYSTEM', { filters });
            }
            return response;
        } catch (error) {
            console.error('Failed to get logs:', error);
            throw error;
        }
    }

    async clearLogs(filters = {}) {
        try {
            const response = await systemAdaptor.clearLogs(filters);
            if (response.success) {
                auditService.logAction('LOGS_CLEAR', 'SYSTEM', { filters });
            }
            return response;
        } catch (error) {
            console.error('Failed to clear logs:', error);
            throw error;
        }
    }

    async getAuditTrail(filters = {}) {
        try {
            const response = await systemAdaptor.getAuditTrail(filters);
            if (response.success) {
                auditService.logAction('AUDIT_TRAIL_VIEW', 'SYSTEM', { filters });
            }
            return response;
        } catch (error) {
            console.error('Failed to get audit trail:', error);
            throw error;
        }
    }

    async exportData(type, filters = {}) {
        try {
            const response = await systemAdaptor.exportData(type, filters);
            if (response.success) {
                auditService.logDataExport(type, filters, response.data?.records || 0);
            }
            return response;
        } catch (error) {
            console.error(`Failed to export ${type} data:`, error);
            throw error;
        }
    }

    async updateSettings(settings) {
        try {
            const response = await systemAdaptor.updateSettings(settings);
            if (response.success) {
                auditService.logAction('SYSTEM_SETTINGS_UPDATE', 'SYSTEM', { settings });
            }
            return response;
        } catch (error) {
            console.error('Failed to update system settings:', error);
            throw error;
        }
    }
}

export const systemService = new SystemService();
export { SystemService };
