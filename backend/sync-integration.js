
/**
 * Backend Integration Update - Tích hợp sync system với backend
 */

import RealtimeSyncService from './services/realtime-sync.js';
import AdminUserBridge from './services/admin-user-bridge.js';
import ConnectionManager from './services/connection-manager.js';
import StateSynchronization from './services/state-sync.js';
import MonitoringDashboard from './monitoring/dashboard.js';

class SyncIntegration {
  constructor(server) {
    this.server = server;
    this.syncService = new RealtimeSyncService(server);
    this.bridge = new AdminUserBridge();
    this.connectionManager = new ConnectionManager();
    this.stateSync = new StateSynchronization();
    this.dashboard = new MonitoringDashboard();
    
    this.setupIntegration();
  }

  setupIntegration() {
    // Connect sync service with bridge
    this.syncService.on('admin:action', (data) => {
      this.bridge.sendCommandToUser(data.adminId, data.userId, data.command);
    });
    
    // Connect bridge with state sync
    this.bridge.on('state:updated', (update) => {
      this.stateSync.updateGlobalState(update.key, update.value, update.source);
    });
    
    // Connect state sync with sync service
    this.stateSync.on('sync:broadcast', (data) => {
      this.syncService.broadcastToAll('state:sync', data);
    });
    
    // Setup monitoring
    this.setupMonitoring();
    
    console.log('🔄 Sync system integration complete');
  }

  setupMonitoring() {
    // Start dashboard
    this.dashboard.start();
    
    // Register connections with connection manager
    this.connectionManager.registerConnection('sync-service', this.syncService, { type: 'websocket' });
    this.connectionManager.registerConnection('dashboard', this.dashboard, { type: 'websocket' });
    
    console.log('📊 Monitoring setup complete');
  }

  // API endpoints for integration
  getIntegrationStatus() {
    return {
      syncService: 'active',
      bridge: 'active', 
      connectionManager: 'active',
      stateSync: 'active',
      dashboard: 'active',
      timestamp: new Date().toISOString()
    };
  }
}

export default SyncIntegration;
