
/**
 * Admin-User Bridge - Cầu nối giữa Admin và User
 */

import EventEmitter from 'events';

class AdminUserBridge extends EventEmitter {
  constructor() {
    super();
    this.activeCommands = new Map();
    this.userSessions = new Map();
    this.adminSessions = new Map();
    this.commandHistory = [];
  }

  // Admin commands to users
  sendCommandToUser(adminId, userId, command) {
    const commandId = this.generateCommandId();
    
    const commandData = {
      id: commandId,
      adminId,
      userId,
      command: command.type,
      payload: command.payload,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    
    this.activeCommands.set(commandId, commandData);
    
    // Emit to user
    this.emit('user:command', {
      userId,
      commandId,
      ...commandData
    });
    
    // Add to history
    this.commandHistory.push(commandData);
    this.limitHistory();
    
    return commandId;
  }

  // User response to admin
  sendResponseToAdmin(commandId, response) {
    const command = this.activeCommands.get(commandId);
    if (!command) return false;
    
    command.status = 'completed';
    command.response = response;
    command.completedAt = new Date().toISOString();
    
    // Emit to admin
    this.emit('admin:response', {
      adminId: command.adminId,
      commandId,
      response,
      originalCommand: command
    });
    
    // Move to completed
    this.activeCommands.delete(commandId);
    return true;
  }

  // Broadcast from admin to all users
  broadcastToAllUsers(adminId, message) {
    const broadcastId = this.generateCommandId();
    
    const broadcastData = {
      id: broadcastId,
      adminId,
      type: 'broadcast',
      message: message.content,
      priority: message.priority || 'normal',
      timestamp: new Date().toISOString()
    };
    
    this.emit('users:broadcast', broadcastData);
    
    this.commandHistory.push(broadcastData);
    this.limitHistory();
    
    return broadcastId;
  }

  // User status updates to admin
  updateUserStatus(userId, status) {
    const statusUpdate = {
      userId,
      status: status.type,
      details: status.details,
      timestamp: new Date().toISOString()
    };
    
    this.userSessions.set(userId, {
      ...this.userSessions.get(userId),
      lastStatus: statusUpdate,
      lastActivity: new Date()
    });
    
    this.emit('admin:userStatus', statusUpdate);
  }

  // Get active commands for user
  getActiveCommandsForUser(userId) {
    const userCommands = [];
    for (const [commandId, command] of this.activeCommands) {
      if (command.userId === userId && command.status === 'pending') {
        userCommands.push({ commandId, ...command });
      }
    }
    return userCommands;
  }

  // Get user session info
  getUserSession(userId) {
    return this.userSessions.get(userId) || null;
  }

  // Register user session
  registerUserSession(userId, sessionData) {
    this.userSessions.set(userId, {
      ...sessionData,
      registeredAt: new Date(),
      lastActivity: new Date()
    });
    
    this.emit('admin:userConnected', {
      userId,
      sessionData,
      timestamp: new Date().toISOString()
    });
  }

  // Register admin session
  registerAdminSession(adminId, sessionData) {
    this.adminSessions.set(adminId, {
      ...sessionData,
      registeredAt: new Date(),
      lastActivity: new Date()
    });
    
    this.emit('system:adminConnected', {
      adminId,
      sessionData,
      timestamp: new Date().toISOString()
    });
  }

  // Get system statistics
  getSystemStats() {
    return {
      activeCommands: this.activeCommands.size,
      connectedUsers: this.userSessions.size,
      connectedAdmins: this.adminSessions.size,
      commandHistory: this.commandHistory.length,
      systemUptime: process.uptime()
    };
  }

  // Cleanup expired sessions
  cleanupExpiredSessions() {
    const expireTime = 30 * 60 * 1000; // 30 minutes
    const now = new Date();
    
    // Cleanup user sessions
    for (const [userId, session] of this.userSessions) {
      if (now - session.lastActivity > expireTime) {
        this.userSessions.delete(userId);
        this.emit('admin:userDisconnected', { userId });
      }
    }
    
    // Cleanup admin sessions
    for (const [adminId, session] of this.adminSessions) {
      if (now - session.lastActivity > expireTime) {
        this.adminSessions.delete(adminId);
        this.emit('system:adminDisconnected', { adminId });
      }
    }
    
    // Cleanup old commands
    const commandExpireTime = 60 * 60 * 1000; // 1 hour
    for (const [commandId, command] of this.activeCommands) {
      if (now - new Date(command.timestamp) > commandExpireTime) {
        this.activeCommands.delete(commandId);
      }
    }
  }

  generateCommandId() {
    return 'cmd_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  limitHistory() {
    if (this.commandHistory.length > 1000) {
      this.commandHistory = this.commandHistory.slice(-500);
    }
  }
}

export default AdminUserBridge;
