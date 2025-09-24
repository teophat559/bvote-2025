/**
 * Base Adaptor Class
 * Lớp cơ sở cho tất cả adaptors với các chức năng chung
 */
import config from '../config.js';

export class BaseAdaptor {
  constructor(name) {
    this.name = name;
    this.mode = config.mode;
    this.listeners = new Map();

    // Bind methods
    this.log = this.log.bind(this);
    this.error = this.error.bind(this);
    this.delay = this.delay.bind(this);
  }

  /**
   * Logging với level
   */
  log(level, message, data = null) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const currentLevel = levels[config.logging.level] || 1;

    if (levels[level] >= currentLevel) {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [${this.name}] [${level.toUpperCase()}]`;

      if (data) {
        console[level === 'error' ? 'error' : 'log'](prefix, message, data);
      } else {
        console[level === 'error' ? 'error' : 'log'](prefix, message);
      }
    }
  }

  /**
   * Error logging với stack trace
   */
  error(message, error = null, context = {}) {
    const errorData = {
      message,
      context,
      timestamp: new Date().toISOString(),
      mode: this.mode,
      adaptor: this.name,
    };

    if (error) {
      errorData.error = {
        message: error.message,
        stack: error.stack,
        name: error.name,
      };
    }

    this.log('error', message, errorData);

    // Track errors if enabled
    if (config.logging.enableErrorTracking) {
      // Có thể tích hợp với service tracking như Sentry
      this.trackError(errorData);
    }
  }

  /**
   * Simulate network delay cho mock mode
   */
  async delay() {
    if (this.mode === 'mock') {
      const { min, max } = config.mock.delay;
      const delayTime = Math.random() * (max - min) + min;
      await new Promise(resolve => setTimeout(resolve, delayTime));
    }
  }

  /**
   * Chuẩn hóa response format
   */
  standardizeResponse(data, success = true, message = null, meta = {}) {
    return {
      success,
      data,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        mode: this.mode,
        adaptor: this.name,
        ...meta,
      },
    };
  }

  /**
   * Chuẩn hóa error response
   */
  standardizeError(error, code = 'UNKNOWN_ERROR', context = {}) {
    const errorResponse = {
      success: false,
      data: null,
      error: {
        code,
        message: error.message || 'Đã xảy ra lỗi không xác định',
        context,
      },
      meta: {
        timestamp: new Date().toISOString(),
        mode: this.mode,
        adaptor: this.name,
      },
    };

    this.error(`Error ${code}`, error, context);
    return errorResponse;
  }

  /**
   * Event listener management
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          this.error(`Error in event listener for ${event}`, error);
        }
      });
    }
  }

  /**
   * Performance tracking
   */
  startPerformanceTracking(operation) {
    if (config.logging.enablePerformanceMonitoring) {
      return {
        start: performance.now(),
        operation,
        adaptor: this.name,
      };
    }
    return null;
  }

  endPerformanceTracking(tracker) {
    if (tracker && config.logging.enablePerformanceMonitoring) {
      const duration = performance.now() - tracker.start;
      this.log('debug', `Performance: ${tracker.operation} took ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * Error tracking (placeholder for external service)
   */
  trackError(errorData) {
    // Placeholder cho việc gửi error tới external service
    // Có thể tích hợp Sentry, LogRocket, etc.
    this.log('debug', 'Error tracked', errorData);
  }

  /**
   * Health check
   */
  async healthCheck() {
    return this.standardizeResponse({
      status: 'healthy',
      mode: this.mode,
      adaptor: this.name,
      timestamp: new Date().toISOString(),
    });
  }
}
