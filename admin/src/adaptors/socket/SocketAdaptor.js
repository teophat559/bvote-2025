/**
 * Socket Adaptor
 * Quản lý kết nối Socket.IO với auto-reconnect và authentication
 */
import { io } from 'socket.io-client';
import { BaseAdaptor } from '../base/BaseAdaptor.js';
import config from '../config.js';

export class SocketAdaptor extends BaseAdaptor {
  constructor() {
    super('SocketAdaptor');

    this.socket = null;
    this.connectionState = 'disconnected'; // disconnected, connecting, connected, reconnecting
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = config.socket.reconnectionAttempts;
    this.reconnectDelay = config.socket.reconnectionDelay;
    this.subscriptions = new Map(); // Track event subscriptions
    this.mockMode = config.mode === 'mock';

    // Only connect in real mode
    if (config.socket.autoConnect && config.features.realtime && !this.mockMode) {
      this.connect();
    } else if (this.mockMode) {
      this.log('info', 'Socket adaptor running in mock mode - no real connection');
      this.setupMockSocket();
    }
  }

  /**
   * Setup mock socket for development
   */
  setupMockSocket() {
    this.connectionState = 'connected';
    this.socket = {
      connected: true,
      id: 'mock-socket-id',
      on: () => {},
      off: () => {},
      emit: () => {},
      connect: () => {},
      disconnect: () => {}
    };
    
    // Simulate connection events
    setTimeout(() => {
      this.emit('socket:connected', { id: 'mock-socket-id' });
    }, 100);
  }

  /**
   * Kết nối Socket.IO
   */
  connect(token = null) {
    if (this.mockMode) {
      this.log('info', 'Mock mode: simulating socket connection');
      this.setupMockSocket();
      return;
    }

    if (this.socket && this.socket.connected) {
      this.log('debug', 'Socket already connected');
      return;
    }

    this.connectionState = 'connecting';
    this.log('info', 'Connecting to socket server', { url: config.socket.url });

    // Get token from localStorage if not provided
    if (!token) {
      token = localStorage.getItem(config.auth.tokenKey);
    }

    const socketOptions = {
      transports: ['websocket', 'polling'],
      timeout: config.socket.timeout,
      autoConnect: false,
      auth: {
        token,
      },
    };

    this.socket = io(config.socket.url, socketOptions);
    this.setupEventHandlers();
    this.socket.connect();
  }

  /**
   * Ngắt kết nối
   */
  disconnect() {
    if (this.socket) {
      this.log('info', 'Disconnecting from socket server');
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionState = 'disconnected';
    this.reconnectAttempts = 0;
  }

  /**
   * Setup event handlers cho socket
   */
  setupEventHandlers() {
    // Connection events
    this.socket.on('connect', () => {
      this.connectionState = 'connected';
      this.reconnectAttempts = 0;
      this.log('info', 'Socket connected', { id: this.socket.id });
      this.emit('socket:connected', { id: this.socket.id });

      // Re-subscribe to events after reconnection
      this.resubscribeEvents();
    });

    this.socket.on('disconnect', (reason) => {
      this.connectionState = 'disconnected';
      this.log('warn', 'Socket disconnected', { reason });
      this.emit('socket:disconnected', { reason });

      // Auto-reconnect logic
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect automatically
        this.log('info', 'Server initiated disconnect, not reconnecting');
      } else {
        // Client side disconnect, attempt reconnection
        this.attemptReconnection();
      }
    });

    this.socket.on('connect_error', (error) => {
      this.connectionState = 'disconnected';
      this.error('Socket connection error', error);
      this.emit('socket:error', { error: error.message });

      this.attemptReconnection();
    });

    // Authentication events
    this.socket.on('auth:success', (data) => {
      this.log('info', 'Socket authentication successful', data);
      this.emit('auth:success', data);
    });

    this.socket.on('auth:failed', (error) => {
      this.error('Socket authentication failed', new Error(error.message));
      this.emit('auth:failed', error);

      // Try to refresh token and reconnect
      this.handleAuthFailure();
    });

    // Generic error handler
    this.socket.on('error', (error) => {
      this.error('Socket error', new Error(error.message || error));
      this.emit('socket:error', error);
    });

    // Ping/Pong for connection health
    this.socket.on('pong', (latency) => {
      this.log('debug', `Socket latency: ${latency}ms`);
      this.emit('socket:pong', { latency });
    });
  }

  /**
   * Attempt reconnection with backoff
   */
  attemptReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.log('error', 'Max reconnection attempts reached');
      this.emit('socket:reconnect_failed');
      return;
    }

    this.connectionState = 'reconnecting';
    this.reconnectAttempts++;

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    this.log('info', `Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    this.emit('socket:reconnecting', {
      attempt: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
      delay
    });

    setTimeout(() => {
      if (this.socket && !this.socket.connected) {
        this.socket.connect();
      }
    }, delay);
  }

  /**
   * Handle authentication failure
   */
  async handleAuthFailure() {
    try {
      // Try to get fresh token from REST adaptor
      const { restAdaptor } = await import('../rest/RestAdaptor.js');
      await restAdaptor.refreshTokens();

      // Reconnect with new token
      const newToken = localStorage.getItem(config.auth.tokenKey);
      if (newToken) {
        this.disconnect();
        this.connect(newToken);
      }
    } catch (error) {
      this.error('Failed to refresh token for socket', error);
      this.disconnect();
    }
  }

  /**
   * Re-subscribe to events after reconnection
   */
  resubscribeEvents() {
    this.subscriptions.forEach((callback, event) => {
      this.socket.on(event, callback);
      this.log('debug', `Re-subscribed to event: ${event}`);
    });
  }

  /**
   * Subscribe to socket event
   */
  subscribe(event, callback) {
    if (!this.socket) {
      this.log('warn', `Cannot subscribe to ${event}: socket not connected`);
      return;
    }

    if (this.mockMode) {
      this.log('debug', `Mock mode: simulating subscription to ${event}`);
      this.subscriptions.set(event, callback);
      return;
    }

    this.socket.on(event, callback);
    this.subscriptions.set(event, callback);
    this.log('debug', `Subscribed to event: ${event}`);
  }

  /**
   * Unsubscribe from socket event
   */
  unsubscribe(event, callback = null) {
    if (!this.socket) {
      return;
    }

    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
      this.subscriptions.delete(event);
    }

    this.log('debug', `Unsubscribed from event: ${event}`);
  }

  /**
   * Emit event to server
   */
  send(event, data = {}, callback = null) {
    if (!this.socket || !this.socket.connected) {
      this.log('warn', `Cannot send ${event}: socket not connected`);
      return false;
    }

    if (this.mockMode) {
      this.log('debug', `Mock mode: simulating send event ${event}`, data);
      if (callback) {
        setTimeout(() => callback({ success: true, data: {} }), 100);
      }
      return true;
    }

    const payload = {
      ...data,
      timestamp: new Date().toISOString(),
    };

    this.log('debug', `Sending event: ${event}`, payload);

    if (callback) {
      this.socket.emit(event, payload, callback);
    } else {
      this.socket.emit(event, payload);
    }

    return true;
  }

  /**
   * Send with Promise-based response
   */
  async sendAsync(event, data = {}, timeout = 5000) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      const timer = setTimeout(() => {
        reject(new Error(`Socket event ${event} timed out`));
      }, timeout);

      this.socket.emit(event, data, (response) => {
        clearTimeout(timer);

        if (response.success) {
          resolve(this.standardizeResponse(response.data, true, response.message));
        } else {
          reject(this.standardizeError(new Error(response.message || 'Socket request failed'), response.code || 'SOCKET_ERROR'));
        }
      });
    });
  }

  /**
   * Join room
   */
  joinRoom(room) {
    return this.sendAsync('join_room', { room });
  }

  /**
   * Leave room
   */
  leaveRoom(room) {
    return this.sendAsync('leave_room', { room });
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      state: this.connectionState,
      connected: this.socket?.connected || false,
      id: this.socket?.id || null,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
    };
  }

  /**
   * Ping server
   */
  ping() {
    if (this.socket && this.socket.connected) {
      this.socket.emit('ping');
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      if (!this.socket || !this.socket.connected) {
        throw new Error('Socket not connected');
      }

      const response = await this.sendAsync('health_check', {}, 3000);
      return response;
    } catch (error) {
      return this.standardizeError(error, 'SOCKET_HEALTH_CHECK_FAILED');
    }
  }
}

// Singleton instance
export const socketAdaptor = new SocketAdaptor();
