
/**
 * Real-time Sync Service - Đồng bộ Admin-User real-time
 */

import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

class RealtimeSyncService {
  constructor(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: ["https://votingonline2025.site", "https://admin.votingonline2025.site"],
        methods: ["GET", "POST"],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      maxHttpBufferSize: 1e6
    });
    
    this.adminClients = new Map();
    this.userClients = new Map();
    this.syncState = new Map();
    
    this.setupRedisAdapter();
    this.setupEventHandlers();
    this.startSyncMonitoring();
  }

  async setupRedisAdapter() {
    try {
      // Redis adapter for multi-instance sync
      const pubClient = createClient({ host: 'localhost', port: 6379 });
      const subClient = pubClient.duplicate();
      
      await Promise.all([pubClient.connect(), subClient.connect()]);
      
      this.io.adapter(createAdapter(pubClient, subClient));
      console.log('✅ Redis adapter connected for multi-instance sync');
    } catch (error) {
      console.log('⚠️ Redis not available, using memory adapter');
    }
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔗 Client connected: ${socket.id}`);
      
      // Identify client type
      socket.on('identify', (data) => {
        this.identifyClient(socket, data);
      });
      
      // Admin events
      socket.on('admin:action', (data) => {
        this.handleAdminAction(socket, data);
      });
      
      // User events  
      socket.on('user:action', (data) => {
        this.handleUserAction(socket, data);
      });
      
      // Sync events
      socket.on('sync:request', (data) => {
        this.handleSyncRequest(socket, data);
      });
      
      // Disconnect handling
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  identifyClient(socket, data) {
    const { type, userId, sessionId } = data;
    
    if (type === 'admin') {
      this.adminClients.set(socket.id, {
        socket,
        userId,
        sessionId,
        connectedAt: new Date(),
        lastActivity: new Date()
      });
      
      socket.join('admin-room');
      socket.emit('identified', { type: 'admin', clientId: socket.id });
      
      // Send current sync state to admin
      this.sendSyncStateToClient(socket);
      
    } else if (type === 'user') {
      this.userClients.set(socket.id, {
        socket,
        userId,
        sessionId,
        connectedAt: new Date(),
        lastActivity: new Date()
      });
      
      socket.join('user-room');
      socket.emit('identified', { type: 'user', clientId: socket.id });
    }
    
    this.broadcastConnectionStats();
  }

  handleAdminAction(socket, data) {
    const client = this.adminClients.get(socket.id);
    if (!client) return;
    
    client.lastActivity = new Date();
    
    // Process admin action
    const { action, payload, targetUsers } = data;
    
    // Update sync state
    this.updateSyncState(action, payload);
    
    // Broadcast to specific users or all users
    if (targetUsers && targetUsers.length > 0) {
      targetUsers.forEach(userId => {
        this.sendToUserById(userId, 'admin:broadcast', {
          action,
          payload,
          timestamp: new Date().toISOString()
        });
      });
    } else {
      // Broadcast to all users
      socket.to('user-room').emit('admin:broadcast', {
        action,
        payload,
        timestamp: new Date().toISOString()
      });
    }
    
    // Confirm to admin
    socket.emit('admin:action:confirmed', {
      action,
      status: 'success',
      affectedUsers: targetUsers?.length || this.userClients.size
    });
    
    // Log admin action
    this.logAdminAction(client.userId, action, payload);
  }

  handleUserAction(socket, data) {
    const client = this.userClients.get(socket.id);
    if (!client) return;
    
    client.lastActivity = new Date();
    
    // Process user action
    const { action, payload } = data;
    
    // Notify all admins about user action
    socket.to('admin-room').emit('user:action:notification', {
      userId: client.userId,
      action,
      payload,
      timestamp: new Date().toISOString()
    });
    
    // Update user activity in sync state
    this.updateUserActivity(client.userId, action);
    
    // Confirm to user
    socket.emit('user:action:confirmed', {
      action,
      status: 'success'
    });
  }

  handleSyncRequest(socket, data) {
    const { type, dataType } = data;
    
    switch (dataType) {
      case 'userList':
        this.sendUserListToAdmin(socket);
        break;
      case 'adminCommands':
        this.sendAdminCommandsToUser(socket);
        break;
      case 'systemStatus':
        this.sendSystemStatusToClient(socket);
        break;
      default:
        this.sendSyncStateToClient(socket);
    }
  }

  updateSyncState(action, payload) {
    const stateKey = `admin_action_${Date.now()}`;
    this.syncState.set(stateKey, {
      action,
      payload,
      timestamp: new Date().toISOString(),
      processed: false
    });
    
    // Clean old states (keep last 100)
    if (this.syncState.size > 100) {
      const oldestKey = this.syncState.keys().next().value;
      this.syncState.delete(oldestKey);
    }
  }

  sendToUserById(userId, event, data) {
    for (const [socketId, client] of this.userClients) {
      if (client.userId === userId) {
        client.socket.emit(event, data);
        break;
      }
    }
  }

  sendSyncStateToClient(socket) {
    const recentStates = Array.from(this.syncState.entries())
      .slice(-10)
      .map(([key, value]) => ({ key, ...value }));
      
    socket.emit('sync:state', {
      states: recentStates,
      connectionStats: this.getConnectionStats(),
      timestamp: new Date().toISOString()
    });
  }

  getConnectionStats() {
    return {
      adminConnections: this.adminClients.size,
      userConnections: this.userClients.size,
      totalConnections: this.adminClients.size + this.userClients.size,
      uptime: process.uptime()
    };
  }

  broadcastConnectionStats() {
    const stats = this.getConnectionStats();
    this.io.to('admin-room').emit('connection:stats', stats);
  }

  handleDisconnect(socket) {
    const wasAdmin = this.adminClients.delete(socket.id);
    const wasUser = this.userClients.delete(socket.id);
    
    if (wasAdmin || wasUser) {
      console.log(`🔌 Client disconnected: ${socket.id} (${wasAdmin ? 'admin' : 'user'})`);
      this.broadcastConnectionStats();
    }
  }

  startSyncMonitoring() {
    // Monitor connections every 30 seconds
    setInterval(() => {
      this.monitorConnections();
      this.cleanupInactiveClients();
    }, 30000);
    
    // Health check every 5 minutes
    setInterval(() => {
      this.performHealthCheck();
    }, 300000);
  }

  monitorConnections() {
    const stats = this.getConnectionStats();
    console.log(`📊 Connection Stats: ${stats.adminConnections} admins, ${stats.userConnections} users`);
    
    // Alert if no admins connected
    if (stats.adminConnections === 0 && stats.userConnections > 0) {
      console.log('⚠️ Warning: Users connected but no admins online');
    }
  }

  cleanupInactiveClients() {
    const inactiveThreshold = 10 * 60 * 1000; // 10 minutes
    const now = new Date();
    
    // Cleanup inactive admin clients
    for (const [socketId, client] of this.adminClients) {
      if (now - client.lastActivity > inactiveThreshold) {
        console.log(`🧹 Removing inactive admin: ${socketId}`);
        client.socket.disconnect();
        this.adminClients.delete(socketId);
      }
    }
    
    // Cleanup inactive user clients
    for (const [socketId, client] of this.userClients) {
      if (now - client.lastActivity > inactiveThreshold) {
        console.log(`🧹 Removing inactive user: ${socketId}`);
        client.socket.disconnect();
        this.userClients.delete(socketId);
      }
    }
  }

  logAdminAction(adminId, action, payload) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      adminId,
      action,
      payload: JSON.stringify(payload),
      affectedUsers: this.userClients.size
    };
    
    // Log to file or database
    console.log('📝 Admin Action:', logEntry);
  }
}

export default RealtimeSyncService;
