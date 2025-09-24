/**
 * Adaptors Main Export
 * Central export point for all adaptors
 */

// Base adaptors
export { BaseAdaptor } from './base/BaseAdaptor.js';
export { restAdaptor } from './rest/RestAdaptor.js';
export { socketAdaptor } from './socket/SocketAdaptor.js';

// Domain adaptors
export { userAdaptor } from './domain/UserAdaptor.js';
export { authAdaptor } from './domain/AuthAdaptor.js';
export { contestAdaptor } from './domain/ContestAdaptor.js';
export { systemAdaptor } from './domain/SystemAdaptor.js';

// Configuration
export { default as config } from './config.js';

/**
 * Adaptor Manager
 * Quản lý tất cả adaptors và cung cấp interface thống nhất
 */
import { restAdaptor } from './rest/RestAdaptor.js';
import { socketAdaptor } from './socket/SocketAdaptor.js';
import { userAdaptor } from './domain/UserAdaptor.js';
import { authAdaptor } from './domain/AuthAdaptor.js';
import { contestAdaptor } from './domain/ContestAdaptor.js';
import { systemAdaptor } from './domain/SystemAdaptor.js';
import config from './config.js';

class AdaptorManager {
  constructor() {
    this.adaptors = {
      rest: restAdaptor,
      socket: socketAdaptor,
      user: userAdaptor,
      auth: authAdaptor,
      contest: contestAdaptor,
      system: systemAdaptor,
    };

    this.mode = config.mode;
    this.initialized = false;
  }

  /**
   * Initialize all adaptors
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    console.log(`🚀 Initializing adaptors in ${this.mode} mode`);

    try {
      // Initialize REST adaptor
      await this.adaptors.rest.healthCheck();
      console.log('✅ REST adaptor initialized');

      // Initialize Socket adaptor if realtime is enabled
      if (config.features.realtime) {
        // Socket will auto-connect if configured
        console.log('✅ Socket adaptor initialized');
      }

      // Initialize domain adaptors
      console.log('✅ Domain adaptors initialized');

      this.initialized = true;
      console.log('🎉 All adaptors initialized successfully');

      // Setup global error handlers
      this.setupGlobalErrorHandlers();

    } catch (error) {
      console.error('❌ Failed to initialize adaptors:', error);
      throw error;
    }
  }

  /**
   * Setup global error handlers
   */
  setupGlobalErrorHandlers() {
    // Listen to auth events
    this.adaptors.auth.on('auth:session_expired', () => {
      console.warn('🔒 Session expired, redirecting to login');
      this.handleSessionExpired();
    });

    this.adaptors.auth.on('auth:login_success', (data) => {
      console.log('🔓 Login successful', data.user);
    });

    this.adaptors.auth.on('auth:logout_success', () => {
      console.log('👋 Logout successful');
    });

    // Listen to socket events
    if (config.features.realtime) {
      this.adaptors.socket.on('socket:connected', (data) => {
        console.log('🔌 Socket connected', data);
      });

      this.adaptors.socket.on('socket:disconnected', (data) => {
        console.warn('🔌 Socket disconnected', data);
      });

      this.adaptors.socket.on('socket:reconnecting', (data) => {
        console.log('🔄 Socket reconnecting', data);
      });

      this.adaptors.socket.on('socket:reconnect_failed', () => {
        console.error('❌ Socket reconnection failed');
      });
    }
  }

  /**
   * Handle session expired
   */
  handleSessionExpired() {
    // Clear all tokens
    this.adaptors.rest.clearTokens();

    // Disconnect socket
    if (config.features.realtime) {
      this.adaptors.socket.disconnect();
    }

    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  /**
   * Switch mode (mock/real)
   */
  async switchMode(newMode) {
    if (newMode !== 'mock' && newMode !== 'real') {
      throw new Error('Invalid mode. Must be "mock" or "real"');
    }

    console.log(`🔄 Switching from ${this.mode} to ${newMode} mode`);

    // Update config
    config.mode = newMode;
    this.mode = newMode;

    // Update all adaptors
    Object.values(this.adaptors).forEach(adaptor => {
      adaptor.mode = newMode;
    });

    console.log(`✅ Switched to ${newMode} mode`);
  }

  /**
   * Get health status of all adaptors
   */
  async getHealthStatus() {
    const status = {
      mode: this.mode,
      initialized: this.initialized,
      adaptors: {},
    };

    for (const [name, adaptor] of Object.entries(this.adaptors)) {
      try {
        const health = await adaptor.healthCheck();
        status.adaptors[name] = {
          healthy: health.success,
          ...health.data,
        };
      } catch (error) {
        status.adaptors[name] = {
          healthy: false,
          error: error.message,
        };
      }
    }

    return status;
  }

  /**
   * Get adaptor by name
   */
  get(name) {
    return this.adaptors[name];
  }

  /**
   * Check if in mock mode
   */
  isMockMode() {
    return this.mode === 'mock';
  }

  /**
   * Check if in real mode
   */
  isRealMode() {
    return this.mode === 'real';
  }
}

// Singleton instance
export const adaptorManager = new AdaptorManager();

// Auto-initialize on import
if (typeof window !== 'undefined') {
  // Browser environment
  adaptorManager.initialize().catch(console.error);
} else {
  // Node.js environment (SSR, tests, etc.)
  console.log('🔧 Adaptors will be initialized manually in non-browser environment');
}
