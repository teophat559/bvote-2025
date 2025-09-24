
/**
 * User Sync Client - Frontend client cho User interface
 */

class UserSyncClient {
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
    this.socket = null;
    this.connected = false;
    this.retryAttempts = 0;
    this.maxRetries = 5;
    
    this.eventHandlers = new Map();
    this.pendingCommands = [];
    
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
      console.log('🔗 User sync client connecting...');
      
    } catch (error) {
      console.error('❌ User sync client connection failed:', error);
    }
  }

  setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('✅ User sync client connected');
      this.connected = true;
      this.retryAttempts = 0;
      
      // Identify as user
      this.socket.emit('identify', {
        type: 'user',
        userId: this.getUserId(),
        sessionId: this.getSessionId()
      });
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 User sync client disconnected');
      this.connected = false;
    });

    this.socket.on('identified', (data) => {
      console.log('🆔 User client identified:', data);
      this.emit('connected', data);
    });

    this.socket.on('admin:broadcast', (data) => {
      this.handleAdminCommand(data);
    });

    this.socket.on('user:command', (data) => {
      this.handleDirectCommand(data);
    });

    this.socket.on('sync:state', (state) => {
      this.emit('syncState', state);
    });

    this.socket.on('user:action:confirmed', (data) => {
      this.emit('actionConfirmed', data);
    });
  }

  handleAdminCommand(data) {
    const { action, payload, timestamp } = data;
    
    console.log('📨 Received admin command:', action);
    
    // Emit to UI
    this.emit('adminCommand', { action, payload, timestamp });
    
    // Auto-handle certain commands
    switch (action) {
      case 'refresh':
        window.location.reload();
        break;
      case 'redirect':
        window.location.href = payload.url;
        break;
      case 'notification':
        this.showNotification(payload.message, payload.type);
        break;
    }
  }

  handleDirectCommand(data) {
    const { commandId, command, payload } = data;
    
    console.log('🎯 Received direct command:', command);
    
    // Store for processing
    this.pendingCommands.push({ commandId, command, payload });
    
    // Emit to UI
    this.emit('directCommand', data);
  }

  // Send action to admin
  sendAction(action, payload) {
    if (!this.connected) {
      console.warn('⚠️ User client not connected');
      return false;
    }

    this.socket.emit('user:action', {
      action,
      payload
    });

    return true;
  }

  // Respond to command
  respondToCommand(commandId, response) {
    if (!this.connected) return false;

    this.socket.emit('user:response', {
      commandId,
      response
    });

    // Remove from pending
    this.pendingCommands = this.pendingCommands.filter(cmd => cmd.commandId !== commandId);
    
    return true;
  }

  // Update status
  updateStatus(status) {
    this.sendAction('status_update', status);
  }

  // Show notification
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
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

  getUserId() {
    return localStorage.getItem('user_id') || 'user_' + Math.random().toString(36).substr(2, 9);
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

// Global user sync client
window.UserSyncClient = UserSyncClient;
