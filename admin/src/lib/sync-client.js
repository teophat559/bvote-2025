
/**
 * Admin Sync Client - Frontend client cho Admin interface
 */

class AdminSyncClient {
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
    this.socket = null;
    this.connected = false;
    this.retryAttempts = 0;
    this.maxRetries = 5;
    
    this.eventHandlers = new Map();
    
    this.connect();
  }

  connect() {
    try {
      this.socket = io(this.serverUrl, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxRetries,
        reconnectionDelay: 1000
      });
      
      this.setupEventHandlers();
      console.log('🔗 Admin sync client connecting...');
      
    } catch (error) {
      console.error('❌ Admin sync client connection failed:', error);
    }
  }

  setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('✅ Admin sync client connected');
      this.connected = true;
      this.retryAttempts = 0;
      
      // Identify as admin
      this.socket.emit('identify', {
        type: 'admin',
        userId: this.getAdminId(),
        sessionId: this.getSessionId()
      });
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Admin sync client disconnected');
      this.connected = false;
    });

    this.socket.on('identified', (data) => {
      console.log('🆔 Admin client identified:', data);
      this.emit('connected', data);
    });

    this.socket.on('user:action:notification', (data) => {
      this.emit('userAction', data);
    });

    this.socket.on('connection:stats', (stats) => {
      this.emit('connectionStats', stats);
    });

    this.socket.on('sync:state', (state) => {
      this.emit('syncState', state);
    });

    this.socket.on('admin:action:confirmed', (data) => {
      this.emit('actionConfirmed', data);
    });
  }

  // Send command to user
  sendCommandToUser(userId, command) {
    if (!this.connected) {
      console.warn('⚠️ Admin client not connected');
      return false;
    }

    this.socket.emit('admin:action', {
      action: 'command',
      payload: command,
      targetUsers: [userId]
    });

    return true;
  }

  // Broadcast to all users
  broadcastToUsers(message) {
    if (!this.connected) {
      console.warn('⚠️ Admin client not connected');
      return false;
    }

    this.socket.emit('admin:action', {
      action: 'broadcast',
      payload: message
    });

    return true;
  }

  // Request sync data
  requestSync(dataType = 'all') {
    this.socket.emit('sync:request', { type: 'admin', dataType });
  }

  // Event system
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  emit(event, data) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  getAdminId() {
    return localStorage.getItem('admin_id') || 'admin_' + Math.random().toString(36).substr(2, 9);
  }

  getSessionId() {
    return sessionStorage.getItem('session_id') || 'session_' + Date.now();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.connected = false;
    }
  }
}

// Global admin sync client
window.AdminSyncClient = AdminSyncClient;
