
/**
 * State Synchronization - Đồng bộ state giữa Admin và User
 */

import EventEmitter from 'events';

class StateSynchronization extends EventEmitter {
  constructor() {
    super();
    this.globalState = new Map();
    this.userStates = new Map();
    this.adminStates = new Map();
    this.pendingUpdates = new Map();
    
    this.conflictResolution = 'admin-priority'; // admin-priority, timestamp, merge
    this.syncInterval = 5000; // 5 seconds
    
    this.startSyncCycle();
  }

  // Update global state
  updateGlobalState(key, value, source) {
    const timestamp = Date.now();
    const update = {
      key,
      value,
      source,
      timestamp,
      version: this.getNextVersion(key)
    };
    
    this.globalState.set(key, update);
    
    // Emit update to subscribers
    this.emit('state:updated', update);
    
    // Queue for sync
    this.queueUpdate(update);
    
    console.log(`📊 Global state updated: ${key} by ${source}`);
  }

  // Update user-specific state
  updateUserState(userId, key, value) {
    if (!this.userStates.has(userId)) {
      this.userStates.set(userId, new Map());
    }
    
    const userState = this.userStates.get(userId);
    const timestamp = Date.now();
    
    const update = {
      userId,
      key,
      value,
      timestamp,
      version: this.getNextVersion(`user_${userId}_${key}`)
    };
    
    userState.set(key, update);
    
    // Notify admins about user state change
    this.emit('user:state:changed', update);
    
    console.log(`👤 User state updated: ${userId}.${key}`);
  }

  // Update admin-specific state
  updateAdminState(adminId, key, value) {
    if (!this.adminStates.has(adminId)) {
      this.adminStates.set(adminId, new Map());
    }
    
    const adminState = this.adminStates.get(adminId);
    const timestamp = Date.now();
    
    const update = {
      adminId,
      key,
      value,
      timestamp,
      version: this.getNextVersion(`admin_${adminId}_${key}`)
    };
    
    adminState.set(key, update);
    
    // Broadcast admin state to relevant users
    this.emit('admin:state:changed', update);
    
    console.log(`👨‍💼 Admin state updated: ${adminId}.${key}`);
  }

  // Get current global state
  getGlobalState(key) {
    const state = this.globalState.get(key);
    return state ? state.value : null;
  }

  // Get user state
  getUserState(userId, key) {
    const userState = this.userStates.get(userId);
    if (!userState) return null;
    
    const state = userState.get(key);
    return state ? state.value : null;
  }

  // Get admin state
  getAdminState(adminId, key) {
    const adminState = this.adminStates.get(adminId);
    if (!adminState) return null;
    
    const state = adminState.get(key);
    return state ? state.value : null;
  }

  // Sync states between admin and users
  syncStates() {
    const syncData = {
      globalState: this.serializeStateMap(this.globalState),
      timestamp: Date.now(),
      version: this.getCurrentSyncVersion()
    };
    
    // Emit sync event
    this.emit('sync:broadcast', syncData);
    
    // Process pending updates
    this.processPendingUpdates();
  }

  // Handle state conflicts
  resolveConflict(existingUpdate, newUpdate) {
    switch (this.conflictResolution) {
      case 'admin-priority':
        return newUpdate.source === 'admin' ? newUpdate : existingUpdate;
        
      case 'timestamp':
        return newUpdate.timestamp > existingUpdate.timestamp ? newUpdate : existingUpdate;
        
      case 'merge':
        return this.mergeUpdates(existingUpdate, newUpdate);
        
      default:
        return newUpdate;
    }
  }

  mergeUpdates(existing, newUpdate) {
    // Simple merge strategy - can be enhanced
    return {
      ...existing,
      value: { ...existing.value, ...newUpdate.value },
      timestamp: Math.max(existing.timestamp, newUpdate.timestamp),
      version: Math.max(existing.version, newUpdate.version)
    };
  }

  // Queue update for synchronization
  queueUpdate(update) {
    const key = `${update.source}_${update.key}_${update.timestamp}`;
    this.pendingUpdates.set(key, update);
  }

  // Process queued updates
  processPendingUpdates() {
    for (const [key, update] of this.pendingUpdates) {
      this.broadcastUpdate(update);
    }
    
    this.pendingUpdates.clear();
  }

  broadcastUpdate(update) {
    // Broadcast to appropriate channels
    if (update.source === 'admin') {
      this.emit('admin:broadcast:update', update);
    } else if (update.source === 'user') {
      this.emit('user:broadcast:update', update);
    }
    
    this.emit('global:broadcast:update', update);
  }

  // Start synchronization cycle
  startSyncCycle() {
    setInterval(() => {
      this.syncStates();
    }, this.syncInterval);
    
    // Cleanup old states every 10 minutes
    setInterval(() => {
      this.cleanupOldStates();
    }, 600000);
  }

  cleanupOldStates() {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const now = Date.now();
    
    // Cleanup global state
    for (const [key, state] of this.globalState) {
      if (now - state.timestamp > maxAge) {
        this.globalState.delete(key);
      }
    }
    
    // Cleanup user states
    for (const [userId, userState] of this.userStates) {
      for (const [key, state] of userState) {
        if (now - state.timestamp > maxAge) {
          userState.delete(key);
        }
      }
      
      if (userState.size === 0) {
        this.userStates.delete(userId);
      }
    }
    
    // Cleanup admin states
    for (const [adminId, adminState] of this.adminStates) {
      for (const [key, state] of adminState) {
        if (now - state.timestamp > maxAge) {
          adminState.delete(key);
        }
      }
      
      if (adminState.size === 0) {
        this.adminStates.delete(adminId);
      }
    }
  }

  serializeStateMap(stateMap) {
    const serialized = {};
    for (const [key, value] of stateMap) {
      serialized[key] = value;
    }
    return serialized;
  }

  getNextVersion(key) {
    const current = this.globalState.get(key);
    return current ? current.version + 1 : 1;
  }

  getCurrentSyncVersion() {
    return Math.floor(Date.now() / 1000); // Unix timestamp in seconds
  }

  // Get synchronization statistics
  getSyncStats() {
    return {
      globalStateSize: this.globalState.size,
      userStatesCount: this.userStates.size,
      adminStatesCount: this.adminStates.size,
      pendingUpdatesCount: this.pendingUpdates.size,
      syncInterval: this.syncInterval,
      conflictResolution: this.conflictResolution,
      lastSyncVersion: this.getCurrentSyncVersion()
    };
  }
}

export default StateSynchronization;
